/**
 * Tipos y cálculos de la sección Cuentas.
 *
 * Todo lo que sea "cuenta" se calcula acá (no dentro de las pantallas),
 * así el día que exista la app móvil se reusa tal cual.
 */

export const ESTADOS = [
  "activa",
  "precaucion",
  "passed",
  "funded",
  "quemada",
  "archivada",
] as const;

export type Estado = (typeof ESTADOS)[number];

export type Cuenta = {
  id: string;
  nombre: string;
  firm: string;
  tamano_cuenta: number;
  fecha_inicio: string;
  drawdown_maximo_pct: number | null;
  drawdown_maximo_monto: number | null;
  profit_split: number | null;
  objetivo_payout: number | null;
  estado: Estado;
  balance_actual: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export const ESTADO_INFO: Record<
  Estado,
  { label: string; chip: string; punto: string }
> = {
  activa: {
    label: "Activa",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    punto: "bg-emerald-400",
  },
  precaucion: {
    label: "Precaución",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    punto: "bg-amber-400",
  },
  passed: {
    label: "Passed",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    punto: "bg-sky-400",
  },
  funded: {
    label: "Funded",
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

/* ---------- Cálculos ---------- */

/** Drawdown: convierte % a $ usando el tamaño de la cuenta. */
export function ddMontoDesdePct(tamano: number, pct: number) {
  return (tamano * pct) / 100;
}

/** Drawdown: convierte $ a % usando el tamaño de la cuenta. */
export function ddPctDesdeMonto(tamano: number, monto: number) {
  if (!tamano) return 0;
  return (monto / tamano) * 100;
}

/** Ganancia (o pérdida) acumulada desde el balance base. */
export function variacion(cuenta: Cuenta) {
  const monto = cuenta.balance_actual - cuenta.tamano_cuenta;
  const pct = cuenta.tamano_cuenta ? (monto / cuenta.tamano_cuenta) * 100 : 0;
  return { monto, pct };
}

/**
 * % de avance hacia el próximo payout.
 * Se mide contra la ganancia necesaria (objetivo_payout), no contra el balance.
 * Sin objetivo cargado devuelve null (la tarjeta no muestra el anillo).
 */
export function progresoPayout(cuenta: Cuenta): number | null {
  if (!cuenta.objetivo_payout) return null;
  const ganancia = cuenta.balance_actual - cuenta.tamano_cuenta;
  const pct = (ganancia / cuenta.objetivo_payout) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Piso de la cuenta: hasta dónde puede caer antes de quemarse. */
export function pisoDrawdown(cuenta: Cuenta): number | null {
  if (cuenta.drawdown_maximo_monto === null) return null;
  return cuenta.tamano_cuenta - cuenta.drawdown_maximo_monto;
}

/** Sugiere el próximo nombre libre de la serie: PA1, PA2, PA3… */
export function sugerirNombre(cuentas: { nombre: string }[]) {
  const usados = cuentas
    .map((c) => /^PA(\d+)$/i.exec(c.nombre.trim()))
    .filter(Boolean)
    .map((m) => Number(m![1]));
  const proximo = usados.length ? Math.max(...usados) + 1 : 1;
  return `PA${proximo}`;
}
