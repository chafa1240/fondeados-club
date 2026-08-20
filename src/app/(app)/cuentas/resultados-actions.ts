"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const datos = {
    cuenta_id,
    fecha,
    monto,
    pct: numero(fd, "pct"),
    pico_dia,
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
  return { ok: id ? "Entrada corregida." : "Entrada agregada." };
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
  if (mensaje.includes("does not exist") || mensaje.includes("schema cache")) {
    return "Falta correr supabase/011_resultados_diarios.sql en el SQL Editor de Supabase.";
  }
  return mensaje;
}
