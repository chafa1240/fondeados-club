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

/**
 * Guarda el resultado de un día.
 *
 * Un día tiene un solo resultado por cuenta, así que esto es un upsert:
 * volver a cargar el mismo día lo corrige en vez de duplicarlo.
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

  revalidatePath("/cuentas");
  revalidatePath("/funding-manager");
  return { ok: "Resultado guardado." };
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
