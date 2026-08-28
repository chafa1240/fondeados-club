/**
 * Costos fijos: un gasto que se repite (data feed mensual, plataforma
 * anual, un servicio semanal).
 *
 * El costo fijo es una **plantilla**, no un gasto. Lo que suma en el
 * Funding Manager son los gastos que genera, uno por período — así cada
 * mes se puede corregir o borrar de a uno cuando la realidad no coincide
 * con la fórmula (un mes no lo pagaste, otro te lo cobraron distinto).
 *
 * Las fechas se manejan como texto "YYYY-MM-DD" y la aritmética va en
 * UTC: el resto de la app hace lo mismo para no correrse un día por la
 * zona horaria.
 */

import type { Categoria } from "./movimientos";

/* ---------- Periodicidad ---------- */

export const PERIODICIDADES = ["semanal", "mensual", "anual"] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];

export const PERIODICIDAD_INFO: Record<
  Periodicidad,
  { label: string; cada: string; porAnio: number }
> = {
  semanal: { label: "Semanal", cada: "por semana", porAnio: 52 },
  mensual: { label: "Mensual", cada: "por mes", porAnio: 12 },
  anual: { label: "Anual", cada: "por año", porAnio: 1 },
};

/** Las categorías que puede tener un costo fijo. Son las mismas que se
 * pueden cargar a mano en un gasto: las de cuenta (evaluación, reset,
 * activación) no se repiten solas. */
export const CATEGORIAS_COSTO_FIJO = [
  "software_suscripcion",
  "otro",
] as const satisfies readonly Categoria[];

export type CategoriaCostoFijo = (typeof CATEGORIAS_COSTO_FIJO)[number];

/** Una fila de la tabla `costos_fijos`. */
export type CostoFijo = {
  id: string;
  /** null = costo general, no atado a ninguna cuenta. */
  cuenta_id: string | null;
  nombre: string;
  categoria: CategoriaCostoFijo;
  monto: number;
  periodicidad: Periodicidad;
  fecha_inicio: string;
  /** null = sigue vigente. */
  fecha_fin: string | null;
  activo: boolean;
  /** Hasta qué período se generó el gasto. null = todavía ninguno. */
  ultimo_periodo: string | null;
  notas: string | null;
};

/* ---------- Aritmética de fechas ---------- */

function aUTC(fecha: string) {
  const [a, m, d] = fecha.split("-").map(Number);
  return { a, m: m - 1, d };
}

function texto(a: number, m: number, d: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${a}-${p(m + 1)}-${p(d)}`;
}

function ultimoDiaDe(a: number, m: number) {
  return new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
}

/**
 * El período número `n` contando desde `inicio` (n = 0 es el propio
 * inicio).
 *
 * Se calcula siempre desde el inicio y no sumando un período al anterior:
 * si el costo arranca un 31, sumar de a uno lo dejaría clavado en 28 desde
 * el primer febrero. Anclando al inicio, febrero es 28 y marzo vuelve a
 * ser 31, que es lo que hace cualquier cobro real.
 */
export function periodoN(
  inicio: string,
  n: number,
  periodicidad: Periodicidad,
): string {
  const { a, m, d } = aUTC(inicio);

  if (periodicidad === "semanal") {
    const f = new Date(Date.UTC(a, m, d + n * 7));
    return texto(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate());
  }

  const meses = periodicidad === "anual" ? n * 12 : n;
  const base = new Date(Date.UTC(a, m + meses, 1));
  const anio = base.getUTCFullYear();
  const mes = base.getUTCMonth();

  // El 31 en un mes de 30 cae en el último día, no se desborda al mes
  // siguiente (que es lo que haría Date.UTC con el día directamente).
  return texto(anio, mes, Math.min(d, ultimoDiaDe(anio, mes)));
}

/** Hoy en "YYYY-MM-DD". */
export function hoyTexto() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Los períodos que hay que generar: los que ya vencieron y todavía no
 * tienen su gasto.
 *
 * Arranca **después de `ultimo_periodo`**, no en `fecha_inicio`: así el
 * mes que el usuario borró a mano (porque no lo pagó) no vuelve a
 * aparecer la próxima vez que abre la pantalla.
 */
export function periodosPendientes(
  costo: CostoFijo,
  hasta: string = hoyTexto(),
): string[] {
  if (!costo.activo) return [];

  const limite =
    costo.fecha_fin && costo.fecha_fin < hasta ? costo.fecha_fin : hasta;

  const pendientes: string[] = [];

  // Tope de seguridad: 600 períodos son 50 años de costos mensuales. Si
  // se llega ahí es porque una fecha vino mal cargada, y es mejor generar
  // de menos que meter miles de gastos en la lista.
  for (let n = 0; n < 600; n++) {
    const fecha = periodoN(costo.fecha_inicio, n, costo.periodicidad);
    if (fecha > limite) break;
    if (costo.ultimo_periodo && fecha <= costo.ultimo_periodo) continue;
    pendientes.push(fecha);
  }

  return pendientes;
}

/** El próximo vencimiento después de hoy. null si ya terminó o está pausado. */
export function proximoVencimiento(
  costo: CostoFijo,
  desde: string = hoyTexto(),
): string | null {
  if (!costo.activo) return null;

  for (let n = 0; n < 600; n++) {
    const fecha = periodoN(costo.fecha_inicio, n, costo.periodicidad);
    if (fecha <= desde) continue;
    if (costo.fecha_fin && fecha > costo.fecha_fin) return null;
    return fecha;
  }

  return null;
}

/* ---------- Totales ---------- */

/**
 * Cuánto representa por mes, para poder sumar peras con manzanas.
 *
 * La semana se convierte con 52/12 y no con "4 semanas": un año tiene 52
 * semanas, no 48, y con 4 el total quedaría 8% corto todos los meses.
 */
export function equivalenteMensual(costo: {
  monto: number;
  periodicidad: Periodicidad;
}) {
  return (costo.monto * PERIODICIDAD_INFO[costo.periodicidad].porAnio) / 12;
}

/** Lo que se va todos los meses en costos fijos vigentes. */
export function totalMensual(costos: CostoFijo[]) {
  return costos
    .filter((c) => c.activo)
    .reduce((suma, c) => suma + equivalenteMensual(c), 0);
}

/** Vigentes primero, después los pausados; dentro, del más caro al más barato. */
export function ordenarCostosFijos(costos: CostoFijo[]): CostoFijo[] {
  return [...costos].sort((a, b) => {
    if (a.activo !== b.activo) return a.activo ? -1 : 1;
    return equivalenteMensual(b) - equivalenteMensual(a);
  });
}
