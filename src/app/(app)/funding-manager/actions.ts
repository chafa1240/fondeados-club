"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CAMPOS_CUENTA,
  CATEGORIAS,
  type CampoCuenta,
  type Categoria,
} from "@/lib/movimientos";

export type EstadoForm = { error?: string; ok?: string };

/**
 * Los movimientos se ven en el Funding Manager, pero un gasto o un retiro
 * puede cargarse desde la tarjeta de la cuenta: las dos pantallas tienen
 * que quedar frescas después de cualquier alta.
 */
function revalidarTodo() {
  revalidatePath("/funding-manager");
  revalidatePath("/cuentas");
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
  return mensaje;
}
