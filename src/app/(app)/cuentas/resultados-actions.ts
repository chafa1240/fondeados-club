"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SENTIDOS, pctDeResultado, type Sentido } from "@/lib/resultados";

export type EstadoForm = { error?: string; ok?: string };

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

/** "2026-08-18" -> "2026-08-17", sin pasar por zonas horarias. */
function diaAnterior(fecha: string) {
  const [a, m, d] = fecha.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d - 1));
  return t.toISOString().slice(0, 10);
}

/**
 * Guarda una entrada del día: la agrega, o corrige una que ya existía si
 * viene con `id`.
 *
 * Desde la migración 012 **un día puede tener varias entradas** (dos
 * trades en la misma jornada son dos filas) y el neto del día es la suma.
 * Antes esto era un upsert por (cuenta, fecha), así que la segunda carga
 * pisaba a la primera — que es el caso normal de cualquiera que opere dos
 * veces en el mismo día.
 *
 * Además corre la semilla hacia atrás si hace falta. Sin eso, cargar un
 * día que cae en la fecha de la semilla o antes no movía el balance (queda
 * "absorbido" por el punto de partida) y parecía que la app se comía el
 * resultado. La regla es: **si cargás un día, ese día cuenta**. Lo último
 * que dijiste sobre la cuenta es lo que más sabe.
 */
export async function guardarResultado(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const id = texto(fd, "id");
  const cuenta_id = texto(fd, "cuenta_id");
  const fecha = texto(fd, "fecha");
  const monto = numero(fd, "monto");

  if (!cuenta_id) return { error: "Falta la cuenta." };
  if (!fecha) return { error: "Elegí el día." };
  if (monto === null) return { error: "Escribí el resultado." };

  // El máximo del día se carga como delta ("llegué a estar +800 arriba") y
  // lo único que no puede ser es negativo. No se lo compara contra el
  // monto de esta entrada: el máximo es de la jornada entera, y el cálculo
  // ya se queda con el mayor entre el máximo cargado y el cierre del día
  // (ver `estadoDeCuenta()`), así que un número corto no rompe nada.
  const picoCargado = numero(fd, "pico_dia");
  const pico_dia = picoCargado === null ? null : Math.max(picoCargado, 0);

  // El sentido es opcional: lo cargado antes de la 015 no lo tiene, y una
  // entrada puede ser el neto de una jornada mixta, que no es ni long ni
  // short. Un valor raro se guarda como null en vez de romper el alta:
  // perder el lado es molesto, perder el resultado del día es peor.
  const crudo = texto(fd, "sentido");
  const sentido: Sentido | null =
    crudo !== null && SENTIDOS.includes(crudo as Sentido)
      ? (crudo as Sentido)
      : null;

  const datos = {
    cuenta_id,
    fecha,
    monto,
    pct: numero(fd, "pct"),
    pico_dia,
    sentido,
    notas: texto(fd, "notas"),
  };

  const supabase = createClient();

  const { data: guardado, error } = id
    ? await supabase
        .from("resultados_diarios")
        .update(datos)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("resultados_diarios")
        .insert(datos)
        .select("id")
        .single();

  if (error) return { error: mensajeDeError(error.message) };

  await dejarUnSoloMaximo(cuenta_id, fecha, guardado?.id ?? null, pico_dia);
  await correrSemilla(cuenta_id, fecha);

  revalidatePath("/cuentas");
  revalidatePath("/funding-manager");
  // El journal y el Home también listan días: sin esto, cargar un
  // resultado desde el journal no se ve hasta recargar a mano.
  revalidatePath("/journal");
  revalidatePath("/");
  return { ok: id ? "Entrada corregida." : "Entrada agregada." };
}

/**
 * El mismo resultado en varias cuentas de una sola vez.
 *
 * Existe porque replicar es la forma normal de operar con prop firms: la
 * misma orden se copia a cinco cuentas y el día queda con el mismo número
 * en todas. Cargarlo cinco veces a mano es donde aparecen los errores —
 * una cuenta que se saltea, un monto tipeado distinto.
 *
 * Reusa `guardarResultado()` cuenta por cuenta en vez de escribir el
 * insert acá: el alta corre la semilla y deja un solo máximo por día, y
 * duplicar esa lógica es la forma más rápida de que las dos empiecen a
 * diferir.
 *
 * Si una falla, **las otras igual se guardan** y el mensaje dice cuántas
 * entraron y cuántas no: cancelar las cinco porque una falló es peor:
 * te deja sin saber cuáles quedaron.
 */
export async function guardarEnVariasCuentas(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const ids = String(fd.get("cuenta_ids") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (ids.length === 0) return { error: "Elegí al menos una cuenta." };

  const fecha = String(fd.get("fecha") ?? "");
  const monto = String(fd.get("monto") ?? "");
  const pico = String(fd.get("pico_dia") ?? "");
  const sentido = String(fd.get("sentido") ?? "");
  const notas = String(fd.get("notas") ?? "");

  let guardadas = 0;
  const errores: string[] = [];

  for (const cuenta_id of ids) {
    const uno = new FormData();
    uno.set("cuenta_id", cuenta_id);
    uno.set("fecha", fecha);
    uno.set("monto", monto);
    if (pico) uno.set("pico_dia", pico);
    // El lado viaja a todas: replicar es copiar la misma orden, y una
    // orden replicada es long en las cinco cuentas o short en las cinco.
    if (sentido) uno.set("sentido", sentido);
    if (notas) uno.set("notas", notas);

    const r = await guardarResultado({}, uno);
    if (r.error) errores.push(r.error);
    else guardadas += 1;
  }

  if (guardadas === 0) return { error: errores[0] ?? "No se pudo guardar." };

  if (errores.length > 0) {
    return {
      ok: `Guardado en ${guardadas} de ${ids.length} cuentas. En las otras: ${errores[0]}`,
    };
  }

  return {
    ok:
      guardadas === 1
        ? "Entrada agregada."
        : `Entrada agregada en ${guardadas} cuentas.`,
  };
}

/**
 * Corregir una entrada desde el journal: el monto y el lado, nada más.
 *
 * Existe aparte de `guardarResultado()` porque el journal **no conoce
 * todos los campos de la entrada**: no tiene el tamaño de la cuenta para
 * el %, ni el máximo del día. Pasar por el formulario grande con esos
 * campos vacíos los habría puesto en null sin que nadie lo pidiera —
 * borrar el máximo del día al corregir un monto es justo el error que
 * infla el colchón del drawdown.
 *
 * Acá se tocan exactamente dos columnas y el `pct` se **recalcula** con el
 * tamaño de la cuenta leído de la base: si cambió el monto y el % quedara
 * viejo, los dos números dirían cosas distintas de la misma entrada.
 * El máximo del día no se toca: es del día, no de la entrada, y para eso
 * está el modal de la tarjeta en Cuentas.
 */
export async function corregirEntrada(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const id = texto(fd, "id");
  const monto = numero(fd, "monto");

  if (!id) return { error: "Falta la entrada." };
  if (monto === null) return { error: "Escribí el resultado." };

  const crudo = texto(fd, "sentido");
  const sentido: Sentido | null =
    crudo !== null && SENTIDOS.includes(crudo as Sentido)
      ? (crudo as Sentido)
      : null;

  const supabase = createClient();

  const { data: entrada } = await supabase
    .from("resultados_diarios")
    .select("cuenta_id")
    .eq("id", id)
    .single();

  let pct: number | null = null;
  if (entrada?.cuenta_id) {
    const { data: cuenta } = await supabase
      .from("cuentas_fondeo")
      .select("tamano_cuenta")
      .eq("id", entrada.cuenta_id)
      .single();

    if (cuenta?.tamano_cuenta) {
      pct = pctDeResultado(cuenta.tamano_cuenta, monto);
    }
  }

  const { error } = await supabase
    .from("resultados_diarios")
    .update({ monto, pct, sentido })
    .eq("id", id);

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/cuentas");
  revalidatePath("/funding-manager");
  revalidatePath("/journal");
  revalidatePath("/");
  return { ok: "Entrada corregida." };
}

/**
 * El máximo del día lo lleva **una sola entrada**; las demás quedan en
 * NULL.
 *
 * `pico_dia` se mide desde la apertura de la jornada, así que es un dato
 * del día y no de cada operación. Si quedara repetido en varias filas, al
 * corregirlo hacia abajo la app seguiría viendo el número viejo — el
 * cálculo se queda con el mayor — y el piso del drawdown mostraría más
 * colchón del real. Ese es el error peligroso: el que te deja creer que
 * estás bien.
 *
 * Si no se cargó ningún máximo no se toca nada: dejar el campo vacío en
 * una entrada no tiene por qué borrar el que puso otra.
 */
async function dejarUnSoloMaximo(
  cuenta_id: string,
  fecha: string,
  id: string | null,
  pico_dia: number | null,
) {
  if (pico_dia === null || !id) return;

  const supabase = createClient();

  await supabase
    .from("resultados_diarios")
    .update({ pico_dia: null })
    .eq("cuenta_id", cuenta_id)
    .eq("fecha", fecha)
    .neq("id", id);
}

/**
 * Deja la semilla justo antes del día cargado, si estaba encima o después.
 *
 * El balance de partida no se toca: lo único que cambia es desde cuándo se
 * empieza a sumar, así el día recién cargado entra en la cuenta.
 */
async function correrSemilla(cuenta_id: string, fecha: string) {
  const supabase = createClient();

  const { data: cuenta } = await supabase
    .from("cuentas_fondeo")
    .select("fecha_semilla")
    .eq("id", cuenta_id)
    .single();

  if (!cuenta?.fecha_semilla) return;
  if (fecha > cuenta.fecha_semilla) return;

  await supabase
    .from("cuentas_fondeo")
    .update({ fecha_semilla: diaAnterior(fecha) })
    .eq("id", cuenta_id);
}

export async function eliminarResultado(id: string) {
  if (!id) return;

  const supabase = createClient();
  await supabase.from("resultados_diarios").delete().eq("id", id);

  revalidatePath("/cuentas");
  revalidatePath("/funding-manager");
  // El journal y el Home también listan días: sin esto, cargar un
  // resultado desde el journal no se ve hasta recargar a mano.
  revalidatePath("/journal");
  revalidatePath("/");
}

function mensajeDeError(mensaje: string) {
  // El índice único de la 011 es justo lo que la 012 viene a sacar: si
  // salta, es que la migración todavía no se corrió.
  if (
    mensaje.includes("duplicate key") ||
    mensaje.includes("idx_resultados_cuenta_fecha")
  ) {
    return "Para cargar más de un resultado en el mismo día falta correr supabase/012_varias_entradas_por_dia.sql en el SQL Editor de Supabase.";
  }
  if (mensaje.includes("row-level security")) {
    return "No tenés permiso para guardar esto. Probá cerrar sesión y volver a entrar.";
  }
  if (mensaje.includes("permission denied")) {
    return "La tabla no tiene permisos para la API. Corré supabase/011_resultados_diarios.sql en el SQL Editor.";
  }
  if (mensaje.includes("sentido")) {
    return "Falta correr supabase/015_long_short.sql en el SQL Editor de Supabase.";
  }
  if (mensaje.includes("does not exist") || mensaje.includes("schema cache")) {
    return "Falta correr supabase/011_resultados_diarios.sql en el SQL Editor de Supabase.";
  }
  return mensaje;
}
