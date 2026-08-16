/**
 * Tipos y cálculos de la sección Cuentas.
 *
 * Todo lo que sea "cuenta" se calcula acá (no dentro de las pantallas),
 * así el día que exista la app móvil se reusa tal cual.
 */

/* ---------- Tipo de cuenta ---------- */

export const TIPOS = ["fondeada", "challenge"] as const;
export type Tipo = (typeof TIPOS)[number];

/**
 * El valor guardado en la base sigue siendo `challenge` (así no hace falta
 * migrar datos), pero en pantalla se llama "Evaluación".
 */
export const TIPO_INFO: Record<Tipo, { label: string }> = {
  fondeada: { label: "Fondeada" },
  challenge: { label: "Evaluación" },
};

/**
 * El objetivo de retiro y el profit split son cosas de una cuenta fondeada:
 * en una evaluación todavía no se cobra nada.
 */
export function tieneRetiro(tipo: Tipo) {
  return tipo === "fondeada";
}

/* ---------- Estados que se eligen a mano ---------- */

export const ESTADOS = [
  "activa",
  "en_curso",
  "passed",
  "quemada",
  "archivada",
] as const;

export type Estado = (typeof ESTADOS)[number];

/**
 * Qué estados tiene sentido elegir según el tipo de cuenta.
 * `archivada` no está acá a propósito: archivar es una acción aparte
 * (guardar la cuenta sin borrarla), no un estado más de la lista.
 */
export const ESTADOS_POR_TIPO: Record<Tipo, Estado[]> = {
  fondeada: ["activa", "quemada"],
  challenge: ["en_curso", "passed", "quemada"],
};

/** Los estados que se pueden guardar para un tipo, archivada incluida. */
export function estadoValido(tipo: Tipo, estado: Estado) {
  return estado === "archivada" || ESTADOS_POR_TIPO[tipo].includes(estado);
}

/** Estado al que vuelve una cuenta cuando se desarchiva. */
export function estadoAlDesarchivar(tipo: Tipo): Estado {
  return tipo === "fondeada" ? "activa" : "en_curso";
}

export const ESTADO_INFO: Record<Estado, Chip> = {
  activa: {
    label: "Activa",
    chip: "border-neutral-700 bg-neutral-800/60 text-neutral-300",
    punto: "bg-neutral-400",
  },
  en_curso: {
    label: "En curso",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    punto: "bg-sky-400",
  },
  passed: {
    label: "Passed",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    punto: "bg-violet-400",
  },
  quemada: {
    label: "Quemada",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    punto: "bg-rose-400",
  },
  archivada: {
    label: "Archivada",
    chip: "border-neutral-700 bg-neutral-800/60 text-neutral-400",
    punto: "bg-neutral-500",
  },
};

/* ---------- Salud: se calcula sola con el balance ---------- */

export const SALUDES = ["saludable", "precaucion", "critico"] as const;
export type Salud = (typeof SALUDES)[number];

type Chip = { label: string; chip: string; punto: string };

export const SALUD_INFO: Record<Salud, Chip> = {
  saludable: {
    label: "Saludable",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    punto: "bg-emerald-400",
  },
  precaucion: {
    label: "Precaución",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    punto: "bg-amber-400",
  },
  critico: {
    label: "Crítico",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    punto: "bg-rose-400",
  },
};

/** Umbrales por defecto, en % del tamaño de cuenta. */
export const UMBRAL_SALUDABLE_DEFAULT = 3;
export const UMBRAL_PRECAUCION_DEFAULT = 2;

/* ---------- La cuenta ---------- */

export type Cuenta = {
  id: string;
  tipo: Tipo;
  nombre: string;
  firm: string;
  tamano_cuenta: number;
  fecha_inicio: string;
  drawdown_maximo_pct: number | null;
  drawdown_maximo_monto: number | null;
  profit_split: number | null;
  /** Cuánto querés retirar. Ej: 500 */
  objetivo_retiro: number | null;
  /** Qué balance tiene que marcar la cuenta para poder retirarlo. Ej: 2600 */
  balance_objetivo: number | null;
  /** Solo evaluaciones: cuánto hay que ganar para pasarla. */
  profit_target_pct: number | null;
  profit_target_monto: number | null;
  umbral_saludable_pct: number;
  umbral_saludable_monto: number | null;
  umbral_precaucion_pct: number;
  umbral_precaucion_monto: number | null;
  estado: Estado;
  balance_actual: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

/** Firms más comunes — solo sugerencias, el campo es texto libre. */
export const FIRMS_SUGERIDAS = [
  "FTMO",
  "The5ers",
  "FundedNext",
  "Alpha Capital",
  "MyForexFunds",
  "Topstep",
  "Apex Trader Funding",
  "Take Profit Trader",
  "E8 Markets",
  "Blue Guardian",
  "Funding Pips",
];

/* ---------- Formato ---------- */

export function plata(n: number | null | undefined, decimales = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function porcentaje(n: number | null | undefined, decimales = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(decimales)}%`;
}

export function fechaCorta(iso: string) {
  // "2026-08-16" -> "16/08/2026" (sin pasar por Date, para no correr zonas horarias)
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/* ---------- Conversión % <-> $ (drawdown y umbrales) ---------- */

export function montoDesdePct(tamano: number, pct: number) {
  return (tamano * pct) / 100;
}

export function pctDesdeMonto(tamano: number, monto: number) {
  if (!tamano) return 0;
  return (monto / tamano) * 100;
}

/* ---------- Cálculos de la cuenta ---------- */

/** Ganancia (o pérdida) acumulada desde el balance base. */
export function variacion(cuenta: Cuenta) {
  const monto = cuenta.balance_actual - cuenta.tamano_cuenta;
  const pct = cuenta.tamano_cuenta ? (monto / cuenta.tamano_cuenta) * 100 : 0;
  return { monto, pct };
}

/** Piso de la cuenta: hasta dónde puede caer antes de quemarse. */
export function pisoDrawdown(cuenta: Cuenta): number | null {
  if (cuenta.drawdown_maximo_monto === null) return null;
  return cuenta.tamano_cuenta - cuenta.drawdown_maximo_monto;
}

/**
 * Colchón: cuánta plata te queda antes de tocar el drawdown máximo,
 * en $ y en % del tamaño de cuenta.
 */
export function colchon(cuenta: Cuenta): { monto: number; pct: number } | null {
  const piso = pisoDrawdown(cuenta);
  if (piso === null) return null;
  const monto = cuenta.balance_actual - piso;
  return {
    monto,
    pct: cuenta.tamano_cuenta ? (monto / cuenta.tamano_cuenta) * 100 : 0,
  };
}

/**
 * Semáforo de salud, calculado con el colchón que queda hasta el drawdown.
 * Sin drawdown cargado no se puede saber: devuelve null.
 */
export function salud(cuenta: Cuenta): Salud | null {
  const c = colchon(cuenta);
  if (c === null) return null;
  if (c.pct >= cuenta.umbral_saludable_pct) return "saludable";
  if (c.pct >= cuenta.umbral_precaucion_pct) return "precaucion";
  return "critico";
}

/**
 * Qué mostrar en la tarjeta.
 * Si la cuenta está activa / en curso, manda el semáforo de salud;
 * si está passed, quemada o archivada, manda el estado elegido a mano.
 */
export function chipDeCuenta(cuenta: Cuenta): Chip {
  const enJuego = cuenta.estado === "activa" || cuenta.estado === "en_curso";
  if (!enJuego) return ESTADO_INFO[cuenta.estado];

  if (cuenta.tipo === "fondeada") {
    const s = salud(cuenta);
    return s ? SALUD_INFO[s] : ESTADO_INFO.activa;
  }

  return ESTADO_INFO.en_curso;
}

/**
 * El anillo de la tarjeta.
 *
 * En una cuenta fondeada mide el camino hasta el balance que te habilita
 * a retirar; en una evaluación, hasta el profit target que la aprueba.
 * En los dos casos se mide desde el balance base.
 *
 * Devuelve null si falta el dato con el que se calcula.
 */
export function anillo(cuenta: Cuenta): {
  pct: number;
  etiqueta: string;
  meta: number;
  falta: number;
} | null {
  const meta = tieneRetiro(cuenta.tipo)
    ? cuenta.balance_objetivo
    : cuenta.profit_target_monto === null
      ? null
      : cuenta.tamano_cuenta + cuenta.profit_target_monto;

  if (meta === null || meta <= cuenta.tamano_cuenta) return null;

  const recorrido = cuenta.balance_actual - cuenta.tamano_cuenta;
  const total = meta - cuenta.tamano_cuenta;

  return {
    pct: Math.max(0, Math.min(100, (recorrido / total) * 100)),
    etiqueta: tieneRetiro(cuenta.tipo) ? "al retiro" : "al target",
    meta,
    falta: Math.max(0, meta - cuenta.balance_actual),
  };
}

/** Sugiere el próximo nombre libre de la serie: PA1, PA2, PA3… */
export function sugerirNombre(cuentas: { nombre: string }[]) {
  const usados = cuentas
    .map((c) => /^PA\s?(\d+)$/i.exec(c.nombre.trim()))
    .filter(Boolean)
    .map((m) => Number(m![1]));
  const proximo = usados.length ? Math.max(...usados) + 1 : 1;
  return `PA${proximo}`;
}
