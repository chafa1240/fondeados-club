"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  balanceAlPasar,
  CANTIDAD_MAXIMA_LOTE,
  enJuego,
  esCierre,
  ESTADOS,
  estadoValido,
  nombresParaLote,
  tieneRetiro,
  TIPOS,
  TIPOS_DRAWDOWN,
  type TipoDrawdown,
  UMBRAL_PRECAUCION_DEFAULT,
  UMBRAL_SALUDABLE_DEFAULT,
  type Estado,
  type Tipo,
} from "@/lib/cuentas";

export type EstadoForm = { error?: string; ok?: string };

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

function entero(fd: FormData, campo: string) {
  const n = numero(fd, campo);
  return n === null ? null : Math.round(n);
}

function tipoDrawdown(fd: FormData) {
  const v = String(fd.get("tipo_drawdown") ?? "");
  return TIPOS_DRAWDOWN.includes(v as TipoDrawdown)
    ? (v as TipoDrawdown)
    : null;
}

function datosDesdeForm(fd: FormData) {
  const tipo = String(fd.get("tipo") ?? "fondeada") as Tipo;
  const nombre = texto(fd, "nombre");
  const firm = texto(fd, "firm");
  const tamano_cuenta = numero(fd, "tamano_cuenta");
  const fecha_inicio = texto(fd, "fecha_inicio");
  const estado = String(fd.get("estado") ?? "activa") as Estado;

  if (!TIPOS.includes(tipo)) return { error: "Tipo de cuenta inválido." };
  if (!nombre) return { error: "Poné un nombre para la cuenta." };
  if (!firm) return { error: "Poné la firm (FTMO, Apex, etc.)." };
  if (tamano_cuenta === null || tamano_cuenta <= 0) {
    return { error: "El tamaño de la cuenta tiene que ser mayor a 0." };
  }
  if (!fecha_inicio) return { error: "Elegí la fecha de inicio." };
  if (!ESTADOS.includes(estado) || !estadoValido(tipo, estado)) {
    return { error: "Ese estado no corresponde a este tipo de cuenta." };
  }

  const balance = numero(fd, "balance_actual");
  const balance_objetivo = numero(fd, "balance_objetivo");

  if (balance_objetivo !== null && balance_objetivo <= tamano_cuenta) {
    return {
      error:
        "El balance necesario para retirar tiene que ser mayor al tamaño de la cuenta.",
    };
  }

  const umbral_saludable_pct =
    numero(fd, "umbral_saludable_pct") ?? UMBRAL_SALUDABLE_DEFAULT;
  const umbral_precaucion_pct =
    numero(fd, "umbral_precaucion_pct") ?? UMBRAL_PRECAUCION_DEFAULT;

  if (umbral_precaucion_pct > umbral_saludable_pct) {
    return {
      error: "El umbral de precaución no puede ser mayor al de saludable.",
    };
  }

  // En una evaluación todavía no se cobra nada: si la cuenta es de ese
  // tipo, estos tres campos se guardan vacíos (y se limpian si la cuenta
  // venía de ser fondeada).
  const conRetiro = tieneRetiro(tipo);

  const datos = {
    tipo,
    nombre,
    firm,
    tamano_cuenta,
    fecha_inicio,
    estado,
    drawdown_maximo_pct: numero(fd, "drawdown_maximo_pct"),
    drawdown_maximo_monto: numero(fd, "drawdown_maximo_monto"),
    profit_split: conRetiro ? numero(fd, "profit_split") : null,
    objetivo_retiro: conRetiro ? numero(fd, "objetivo_retiro") : null,
    balance_objetivo: conRetiro ? balance_objetivo : null,
    // Al revés: el profit target es de la evaluación, no de la fondeada.
    profit_target_pct: conRetiro ? null : numero(fd, "profit_target_pct"),
    profit_target_monto: conRetiro ? null : numero(fd, "profit_target_monto"),
    retiros_previos: conRetiro ? (numero(fd, "retiros_previos") ?? 0) : 0,
    // El fee de activación es de la fondeada; en la evaluación se paga
    // el precio de la evaluación, que va más abajo.
    // La tilde destildada manda: sin fee, no se guarda monto.
    fee_activacion:
      conRetiro && fd.get("tiene_fee") === "si"
        ? numero(fd, "fee_activacion")
        : null,
    // La regla de consistencia aplica a los dos tipos.
    regla_consistencia: numero(fd, "regla_consistencia"),
    // El resto es propio de la evaluación.
    tipo_drawdown: conRetiro ? null : tipoDrawdown(fd),
    precio: conRetiro ? null : numero(fd, "precio"),
    cantidad_contratos: conRetiro ? null : entero(fd, "cantidad_contratos"),
    umbral_saludable_pct,
    umbral_saludable_monto: numero(fd, "umbral_saludable_monto"),
    umbral_precaucion_pct,
    umbral_precaucion_monto: numero(fd, "umbral_precaucion_monto"),
    // Solo tiene fecha de cierre la cuenta que ya terminó su ciclo.
    fecha_cierre: esCierre(estado) ? texto(fd, "fecha_cierre") : null,
    // Si no cargó balance todavía, arranca en el balance base.
    balance_actual: balance === null ? tamano_cuenta : balance,
    notas: texto(fd, "notas"),
  };

  // Misma regla que en el menú ⋯: una evaluación marcada como pasada llega
  // al profit target por definición.
  if (estado === "passed") {
    const alPasar = balanceAlPasar(datos);
    if (alPasar !== null) datos.balance_actual = alPasar;
  }

  return { datos };
}

/* ---------- alta / edición ---------- */

export async function guardarCuenta(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const parsed = datosDesdeForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createClient();
  const id = texto(fd, "id");

  // Editar: siempre una sola cuenta, la cantidad no aplica.
  if (id) {
    const { error } = await supabase
      .from("cuentas_fondeo")
      .update(parsed.datos)
      .eq("id", id);

    if (error) return { error: mensajeDeError(error.message) };

    revalidatePath("/cuentas");
    return { ok: "Cuenta actualizada." };
  }

  // Alta: puede ser una o un pack de cuentas iguales (ej. las 5 de Apex).
  const cantidad = entero(fd, "cantidad") ?? 1;

  if (cantidad < 1 || cantidad > CANTIDAD_MAXIMA_LOTE) {
    return {
      error: `La cantidad tiene que estar entre 1 y ${CANTIDAD_MAXIMA_LOTE}.`,
    };
  }

  // Los nombres se resuelven contra los que ya existen para no repetir.
  const { data: existentes } = await supabase
    .from("cuentas_fondeo")
    .select("nombre");

  const nombres = nombresParaLote(
    parsed.datos.nombre,
    cantidad,
    (existentes ?? []).map((c) => c.nombre),
  );

  const filas = nombres.map((nombre) => ({ ...parsed.datos, nombre }));

  const { error } = await supabase.from("cuentas_fondeo").insert(filas);

  if (error) return { error: mensajeDeError(error.message) };

  revalidatePath("/cuentas");
  return {
    ok: cantidad === 1 ? "Cuenta creada." : `${cantidad} cuentas creadas.`,
  };
}

/* ---------- acciones rápidas desde la tarjeta ---------- */

/**
 * Ojo: estas dos se llaman directo desde el menú de la tarjeta (no con
 * <form action=...>). Con formulario, cerrar el menú desmontaba el form
 * antes de que se enviara y la acción nunca llegaba a correr.
 */
export async function cambiarEstado(
  id: string,
  estado: Estado,
  /** Día en que pasó o se quemó. Solo se usa en esos dos estados. */
  fechaCierre?: string | null
) {
  if (!id || !ESTADOS.includes(estado)) return;

  const supabase = createClient();

  // Al marcar una evaluación como pasada, el balance salta al objetivo:
  // si la aprobaste, llegaste al profit target sí o sí.
  const cambios: {
    estado: Estado;
    balance_actual?: number;
    fecha_cierre?: string | null;
  } = { estado };

  // La fecha de cierre acompaña al cierre: se guarda al pasar/quemarse y
  // se borra si la cuenta vuelve a estar en juego. Al archivar no se toca,
  // así una evaluación pasada no pierde su fecha al guardarla.
  if (esCierre(estado)) {
    cambios.fecha_cierre = fechaCierre ?? null;
  } else if (enJuego(estado)) {
    cambios.fecha_cierre = null;
  }

  if (estado === "passed") {
    const { data: cuenta } = await supabase
      .from("cuentas_fondeo")
      .select("tipo, tamano_cuenta, balance_actual, profit_target_monto")
      .eq("id", id)
      .single();

    if (cuenta) {
      const balance = balanceAlPasar(cuenta);
      if (balance !== null) cambios.balance_actual = balance;
    }
  }

  await supabase.from("cuentas_fondeo").update(cambios).eq("id", id);
  revalidatePath("/cuentas");
}

export async function eliminarCuenta(id: string) {
  if (!id) return;

  const supabase = createClient();
  await supabase.from("cuentas_fondeo").delete().eq("id", id);
  revalidatePath("/cuentas");
}

export async function actualizarBalance(
  _prev: EstadoForm,
  fd: FormData,
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

/* ---------- retiros (tabla payouts) ---------- */

/**
 * Registra un retiro y lo descuenta del balance: la plata que sacaste ya
 * no está en la cuenta. Las dos cosas van juntas siempre.
 */
export async function registrarRetiro(
  _prev: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const cuenta_id = String(fd.get("cuenta_id") ?? "");
  const monto = numero(fd, "monto");
  const fecha = texto(fd, "fecha") ?? new Date().toISOString().slice(0, 10);

  if (!cuenta_id) return { error: "Falta la cuenta." };
  if (monto === null || monto <= 0) {
    return { error: "El monto del retiro tiene que ser mayor a 0." };
  }

  const supabase = createClient();

  const { data: cuenta, error: errorLectura } = await supabase
    .from("cuentas_fondeo")
    .select("balance_actual")
    .eq("id", cuenta_id)
    .single();

  if (errorLectura || !cuenta) {
    return { error: "No se encontró la cuenta." };
  }

  const { error: errorRetiro } = await supabase.from("payouts").insert({
    cuenta_id,
    monto,
    fecha,
    notas: texto(fd, "notas"),
  });

  if (errorRetiro) return { error: mensajeDeError(errorRetiro.message) };

  const { error: errorBalance } = await supabase
    .from("cuentas_fondeo")
    .update({ balance_actual: cuenta.balance_actual - monto })
    .eq("id", cuenta_id);

  if (errorBalance) return { error: mensajeDeError(errorBalance.message) };

  revalidatePath("/cuentas");
  return { ok: "Retiro registrado." };
}

/** Borra un retiro y le devuelve el monto al balance. */
export async function eliminarRetiro(id: string, cuenta_id: string) {
  if (!id || !cuenta_id) return;

  const supabase = createClient();

  const { data: retiro } = await supabase
    .from("payouts")
    .select("monto")
    .eq("id", id)
    .single();

  if (!retiro) return;

  await supabase.from("payouts").delete().eq("id", id);

  const { data: cuenta } = await supabase
    .from("cuentas_fondeo")
    .select("balance_actual")
    .eq("id", cuenta_id)
    .single();

  if (cuenta) {
    await supabase
      .from("cuentas_fondeo")
      .update({ balance_actual: cuenta.balance_actual + retiro.monto })
      .eq("id", cuenta_id);
  }

  revalidatePath("/cuentas");
}

/* ---------- errores en castellano ---------- */

function mensajeDeError(mensaje: string) {
  if (mensaje.includes("row-level security")) {
    return "No tenés permiso para guardar esto. Probá cerrar sesión y volver a entrar.";
  }
  if (mensaje.includes("permission denied")) {
    return "La tabla no tiene permisos para la API. Corré supabase/exponer_tablas.sql en el SQL Editor.";
  }
  if (mensaje.includes("does not exist") || mensaje.includes("schema cache")) {
    return "Falta correr alguna migración de la carpeta supabase/ en el SQL Editor de Supabase (la última es 006_fecha_cierre.sql).";
  }
  return mensaje;
}
