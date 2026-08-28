"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CAMPOS_CUENTA,
  CATEGORIAS,
  type CampoCuenta,
  type Categoria,
} from "@/lib/movimientos";
import {
  CATEGORIAS_COSTO_FIJO,
  PERIODICIDADES,
  type CategoriaCostoFijo,
  type Periodicidad,
} from "@/lib/costos-fijos";
import { generarCostosFijos } from "@/lib/costos-fijos-server";

export type EstadoForm = { error?: string; ok?: string };

/**
 * Los movimientos se ven en el Funding Manager, pero un gasto o un retiro
 * puede cargarse desde la tarjeta de la cuenta: las dos pantallas tienen
 * que quedar frescas después de cualquier alta.
 */
function revalidarTodo() {
  revalidatePath("/funding-manager");
  revalidatePath("/cuentas");
  // El Home muestra el mismo flujo de caja: si no se revalida, un gasto
  // recién cargado aparece en una pantalla y no en la otra.
  revalidatePath("/");
}

/* ---------- helpers de lectura del formulario ---------- */

function texto(fd: FormData, campo: string) {
  const v = String(fd.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function numero(fd: FormData, campo: string) {
  const v = String(fd.get(campo) ?? "")
    .trim()
    .replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ---------- gastos ---------- */

export async function guardarGasto(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  // "Se repite" no crea otra clase de cosa: es el mismo formulario
  // guardando la plantilla en vez de una fila suelta. Si guardara las dos,
  // el primer período quedaría cargado dos veces.
  if (fd.get("repetir") === "si") return guardarCostoFijo(fd);

  // Destildar "se repite" en un costo fijo existente: se borra la
  // plantilla y los períodos ya generados quedan como gastos comunes. No
  // se borra nada de lo pagado, solo deja de generar lo que viene.
  const costoFijoId = texto(fd, "costo_fijo_id");
  if (costoFijoId) {
    const supabase = createClient();
    await supabase.from("costos_fijos").delete().eq("id", costoFijoId);
    revalidarTodo();
    return { ok: "Ya no se repite. Los períodos cargados quedan como están." };
  }

  const categoria = String(fd.get("categoria") ?? "") as Categoria;
  const monto = numero(fd, "monto");
  const fecha = texto(fd, "fecha") ?? new Date().toISOString().slice(0, 10);

  if (!CATEGORIAS.includes(categoria)) {
    return { error: "Elegí una categoría para el gasto." };
  }
  if (monto === null || monto <= 0) {
    return { error: "El monto del gasto tiene que ser mayor a 0." };
  }

  const datos = {
    // Vacío = gasto general (software, suscripciones): no es de una cuenta.
    cuenta_id: texto(fd, "cuenta_id"),
    categoria,
    monto,
    fecha,
    descripcion: texto(fd, "descripcion"),
  };

  const supabase = createClient();
  const id = texto(fd, "id");

  const { error } = id
    ? await supabase.from("gastos").update(datos).eq("id", id)
    : await supabase.from("gastos").insert(datos);

  if (error) return { error: mensajeDeError(error.message) };

  revalidarTodo();
  return { ok: id ? "Gasto actualizado." : "Gasto registrado." };
}

/**
 * Un gasto no toca el balance de ninguna cuenta (la plata sale de tu
 * bolsillo, no de la cuenta fondeada), así que borrarlo es borrar la fila
 * y nada más. El retiro es el caso opuesto: ver `eliminarRetiro()`.
 */
export async function eliminarGasto(id: string) {
  if (!id) return;

  const supabase = createClient();
  await supabase.from("gastos").delete().eq("id", id);
  revalidarTodo();
}

/* ---------- campos de la cuenta que se ven como movimientos ---------- */

/**
 * El precio de la evaluación, el fee de activación y los retiros previos
 * se muestran en la lista de movimientos pero viven en `cuentas_fondeo`.
 * Editarlos desde acá escribe en la cuenta: no hay copia que sincronizar.
 *
 * Ninguno de los tres toca `balance_actual`. El precio y el fee salen de
 * tu bolsillo, y los retiros previos son historia anterior a la app: el
 * balance que cargaste ya los tiene descontados.
 */
export async function actualizarCampoCuenta(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const id = texto(fd, "cuenta_id");
  const campo = String(fd.get("campo") ?? "") as CampoCuenta;
  const monto = numero(fd, "monto");

  if (!id) return { error: "Falta la cuenta." };
  if (!CAMPOS_CUENTA.includes(campo)) return { error: "Campo inválido." };
  if (monto === null || monto < 0) {
    return { error: "El monto no puede ser negativo." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("cuentas_fondeo")
    .update({ [campo]: monto })
    .eq("id", id);

  if (error) return { error: mensajeDeError(error.message) };

  revalidarTodo();
  return { ok: "Actualizado." };
}

/* ---------- errores en castellano ---------- */

function mensajeDeError(mensaje: string) {
  if (mensaje.includes("row-level security")) {
    return "No tenés permiso para guardar esto. Probá cerrar sesión y volver a entrar.";
  }
  if (mensaje.includes("permission denied")) {
    return "La tabla no tiene permisos para la API. Corré supabase/exponer_tablas.sql en el SQL Editor.";
  }
  if (mensaje.includes("gastos_categoria_check")) {
    return "Esa categoría de gasto no existe.";
  }
  if (mensaje.includes("costos_fijos")) {
    return "No se pudo guardar el costo fijo. ¿Corriste supabase/014_costos_fijos.sql?";
  }
  return mensaje;
}

/* ---------- costos fijos ---------- */

/**
 * Alta y edición de la **plantilla** de un costo fijo, no de los gastos
 * que ya generó.
 *
 * La llama `guardarGasto()` con el mismo FormData: el costo fijo no tiene
 * formulario propio, es un gasto con "se repite" puesto. Por eso lee
 * `descripcion` como nombre y `fecha` como primer vencimiento.
 *
 * Cambiar el monto NO reescribe lo ya cobrado: esos meses ya se pagaron a
 * ese precio y son historia. El monto nuevo rige de acá en adelante. Si
 * hace falta corregir un mes puntual, se edita ese gasto en la lista.
 */
async function guardarCostoFijo(fd: FormData): Promise<EstadoForm> {
  const nombre = texto(fd, "descripcion");
  const categoria = String(fd.get("categoria") ?? "") as CategoriaCostoFijo;
  const periodicidad = String(fd.get("periodicidad") ?? "") as Periodicidad;
  const monto = numero(fd, "monto");
  const fechaInicio = texto(fd, "fecha");
  const fechaFin = texto(fd, "fecha_fin");

  if (!nombre) {
    return { error: "Ponele un nombre: es como vas a ver el gasto cada mes." };
  }
  if (!CATEGORIAS_COSTO_FIJO.includes(categoria)) {
    return { error: "Esa categoría no se puede repetir." };
  }
  if (!PERIODICIDADES.includes(periodicidad)) {
    return { error: "Elegí cada cuánto se paga." };
  }
  if (monto === null || monto <= 0) {
    return { error: "El monto tiene que ser mayor a 0." };
  }
  if (!fechaInicio) return { error: "Falta la fecha del primer pago." };
  if (fechaFin && fechaFin < fechaInicio) {
    return { error: "La fecha de fin no puede ser anterior a la del primer pago." };
  }

  const datos = {
    cuenta_id: texto(fd, "cuenta_id"),
    nombre,
    categoria,
    monto,
    periodicidad,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    activo: fd.get("activo") !== "no",
    notas: null,
  };

  const supabase = createClient();
  const id = texto(fd, "costo_fijo_id");

  const { error } = id
    ? await supabase.from("costos_fijos").update(datos).eq("id", id)
    : await supabase.from("costos_fijos").insert(datos);

  if (error) return { error: mensajeDeError(error.message) };

  // Un gasto común que se marca "se repite" se convierte: la fila suelta
  // se borra y el período vuelve a entrar generado por la plantilla. Si
  // quedara, ese mes estaría cargado dos veces.
  const gastoId = texto(fd, "id");
  if (gastoId) await supabase.from("gastos").delete().eq("id", gastoId);

  // Generar acá y no esperar a la próxima carga: el usuario acaba de
  // cargar un costo que arranca en junio y tiene que ver junio, julio y
  // agosto en la lista al cerrar el modal.
  await generarCostosFijos(supabase);

  revalidarTodo();
  return { ok: id ? "Costo fijo actualizado." : "Costo fijo creado." };
}

/**
 * Pausar / reanudar. Pausado deja de generar períodos nuevos y **conserva
 * los ya generados**: diste de baja el servicio, no borraste los meses que
 * lo pagaste.
 */
export async function alternarCostoFijo(id: string, activo: boolean) {
  if (!id) return;

  const supabase = createClient();
  await supabase.from("costos_fijos").update({ activo }).eq("id", id);
  revalidarTodo();
}

/**
 * Borra la plantilla y **deja los gastos que generó**: son plata que
 * saliste, borrarla cambiaría el ROI de meses ya cerrados. Los gastos
 * quedan como gastos normales (`costo_fijo_id` pasa a null por el
 * `on delete set null` de la migración 014).
 *
 * Para dejar de pagarlo sin perder de vista que existió, está pausar.
 */
export async function eliminarCostoFijo(id: string) {
  if (!id) return;

  const supabase = createClient();
  await supabase.from("costos_fijos").delete().eq("id", id);
  revalidarTodo();
}
