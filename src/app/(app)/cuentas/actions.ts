"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS, type Estado } from "@/lib/cuentas";

export type EstadoForm = { error?: string; ok?: string };

/* ---------- helpers de lectura del formulario ---------- */

function texto(fd: FormData, campo: string) {
  const v = String(fd.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function numero(fd: FormData, campo: string) {
  const v = String(fd.get(campo) ?? "").trim().replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function datosDesdeForm(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const firm = texto(fd, "firm");
  const tamano_cuenta = numero(fd, "tamano_cuenta");
  const fecha_inicio = texto(fd, "fecha_inicio");
  const estado = String(fd.get("estado") ?? "activa") as Estado;

  if (!nombre) return { error: "Poné un nombre para la cuenta." };
  if (!firm) return { error: "Poné la firm (FTMO, Apex, etc.)." };
  if (tamano_cuenta === null || tamano_cuenta <= 0) {
    return { error: "El tamaño de la cuenta tiene que ser mayor a 0." };
  }
  if (!fecha_inicio) return { error: "Elegí la fecha de inicio." };
  if (!ESTADOS.includes(estado)) return { error: "Estado inválido." };

  const balance = numero(fd, "balance_actual");

  return {
    datos: {
      nombre,
      firm,
      tamano_cuenta,
      fecha_inicio,
      estado,
      drawdown_maximo_pct: numero(fd, "drawdown_maximo_pct"),
      drawdown_maximo_monto: numero(fd, "drawdown_maximo_monto"),
      profit_split: numero(fd, "profit_split"),
      objetivo_payout: numero(fd, "objetivo_payout"),
      // Si no cargó balance todavía, arranca en el balance base.
      balance_actual: balance === null ? tamano_cuenta : balance,
      notas: texto(fd, "notas"),
    },
  };
}

/* ---------- alta / edición ---------- */

export async function guardarCuenta(
  _prev: EstadoForm,
  fd: FormData
): Promise<EstadoForm> {
  const parsed = datosDesdeForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createClient();
  const id = texto(fd, "id");

  const { error } = id
    ? await supabase.from("cuentas_fondeo").update(parsed.datos).eq("id", id)
    : await supabase.from("cuentas_fondeo").insert(parsed.datos);

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/cuentas");
  return { ok: id ? "Cuenta actualizada." : "Cuenta creada." };
}

/* ---------- acciones rápidas desde la tarjeta ---------- */

export async function cambiarEstado(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const estado = String(fd.get("estado") ?? "") as Estado;
  if (!id || !ESTADOS.includes(estado)) return;

  const supabase = createClient();
  await supabase.from("cuentas_fondeo").update({ estado }).eq("id", id);
  revalidatePath("/cuentas");
}

export async function actualizarBalance(
  _prev: EstadoForm,
  fd: FormData
): Promise<EstadoForm> {
  const id = String(fd.get("id") ?? "");
  const balance = numero(fd, "balance_actual");
  if (!id) return { error: "Falta la cuenta." };
  if (balance === null) return { error: "Escribí un número." };

  const supabase = createClient();
  const { error } = await supabase
    .from("cuentas_fondeo")
    .update({ balance_actual: balance })
    .eq("id", id);

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/cuentas");
  return { ok: "Balance actualizado." };
}

export async function eliminarCuenta(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const supabase = createClient();
  await supabase.from("cuentas_fondeo").delete().eq("id", id);
  revalidatePath("/cuentas");
}

/* ---------- errores en castellano ---------- */

function mensajeDeError(mensaje: string) {
  if (mensaje.includes("row-level security")) {
    return "No tenés permiso para guardar esto. Probá cerrar sesión y volver a entrar.";
  }
  if (mensaje.includes("does not exist") || mensaje.includes("schema cache")) {
    return "La tabla de cuentas no está expuesta en la API de Supabase. Revisá Settings → API → Exposed schemas.";
  }
  return mensaje;
}
