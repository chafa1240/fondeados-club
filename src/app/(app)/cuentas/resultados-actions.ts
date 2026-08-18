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
 * Guarda el resultado de un día.
 *
 * Un día tiene un solo resultado por cuenta, así que esto es un upsert:
 * volver a cargar el mismo día lo corrige en vez de duplicarlo.
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
  const cuenta_id = texto(fd, "cuenta_id");
  const fecha = texto(fd, "fecha");
  const monto = numero(fd, "monto");

  if (!cuenta_id) return { error: "Falta la cuenta." };
  if (!fecha) return { error: "Elegí el día." };
  if (monto === null) return { error: "Escribí el resultado del día." };

  // El máximo del día se carga como delta ("llegué a estar +800 arriba"),
  // así que nunca puede ser menor al neto del día: si cerraste +200 no
  // pudiste haber tocado como máximo +100. Se toma el mayor de los dos en
  // vez de rechazar la carga.
  const picoCargado = numero(fd, "pico_dia");
  const pico_dia =
    picoCargado === null ? null : Math.max(picoCargado, monto, 0);

  const datos = {
    cuenta_id,
    fecha,
    monto,
    pct: numero(fd, "pct"),
    pico_dia,
    notas: texto(fd, "notas"),
  };

  const supabase = createClient();

  const { error } = await supabase
    .from("resultados_diarios")
    .upsert(datos, { onConflict: "cuenta_id,fecha" });

  if (error) return { error: mensajeDeError(error.message) };

  await correrSemilla(cuenta_id, fecha);

  revalidatePath("/cuentas");
  revalidatePath("/funding-manager");
  return { ok: "Resultado guardado." };
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
