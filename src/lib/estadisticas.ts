/**
 * Las estadísticas del journal.
 *
 * Todas se calculan **sobre días**, nunca sobre operaciones. Las métricas
 * finas de la competencia (profit factor, win rate por trade) salen de
 * operaciones importadas del broker, que nosotros no tenemos y decidimos
 * no pedir. Lo que sigue es lo que se puede responder honestamente con un
 * número por día, que es más de lo que parece.
 */

import { DIAS_SEMANA, type DiaHome } from "./home";
import type { Sentido } from "./resultados";

/* ---------- Los números del día ---------- */

export type EstadisticasDias = {
  operados: number;
  ganadores: number;
  perdedores: number;
  planos: number;
  /** Qué proporción de tus días cierra en verde. null = todavía no operaste. */
  ganadorPct: number | null;
  mejor: DiaHome | null;
  peor: DiaHome | null;
  /** Cuánto deja un día promedio. Es la expectativa por jornada. */
  expectativa: number | null;
};

export function estadisticasDeDias(dias: DiaHome[]): EstadisticasDias {
  if (dias.length === 0) {
    return {
      operados: 0,
      ganadores: 0,
      perdedores: 0,
      planos: 0,
      ganadorPct: null,
      mejor: null,
      peor: null,
      expectativa: null,
    };
  }

  let ganadores = 0;
  let perdedores = 0;
  let planos = 0;
  let suma = 0;
  let mejor = dias[0];
  let peor = dias[0];

  for (const d of dias) {
    if (d.monto > 0) ganadores += 1;
    else if (d.monto < 0) perdedores += 1;
    else planos += 1;

    suma += d.monto;
    if (d.monto > mejor.monto) mejor = d;
    if (d.monto < peor.monto) peor = d;
  }

  return {
    operados: dias.length,
    ganadores,
    perdedores,
    planos,
    // Los días planos cuentan en el denominador: operaste ese día.
    ganadorPct: (ganadores / dias.length) * 100,
    mejor,
    peor,
    expectativa: suma / dias.length,
  };
}

/* ---------- Los números de las operaciones ---------- */

/**
 * Win rate, profit factor y P&L, calculados **sobre las entradas
 * cargadas**, no sobre los días.
 *
 * Durante todo el MVP esto no existió a propósito: sin el sentido de cada
 * operación, lo único que teníamos era un número por jornada y llamarle
 * "win rate por trade" habría sido inventar. Con las operaciones cargadas
 * de a una (2026-08-27) el número se puede calcular sin mentir, con una
 * salvedad que la pantalla dice: **una orden replicada en cinco cuentas
 * son cinco entradas**. Para la plata está bien —ganaste en las cinco—,
 * para contar operaciones infla.
 */
export type EstadisticasOperaciones = {
  operaciones: number;
  ganadoras: number;
  perdedoras: number;
  planas: number;
  /** Todo lo que dejaron, sumado. */
  pnl: number;
  /** Qué proporción cerró en verde. null = todavía no cargaste ninguna. */
  winRate: number | null;
  /**
   * Lo ganado sobre lo perdido, las dos en bruto.
   *
   * null cuando no hay ninguna operación perdedora: ahí la división es por
   * cero y "infinito" no es una respuesta — es un cartel de que la
   * pregunta todavía no aplica. Debajo de 1 estás perdiendo.
   */
  profitFactor: number | null;
  bruto: { ganado: number; perdido: number };
  /** Lo que deja una operación promedio. */
  promedio: number | null;
};

export function estadisticasDeOperaciones(
  entradas: { monto: number }[],
): EstadisticasOperaciones {
  let ganadoras = 0;
  let perdedoras = 0;
  let planas = 0;
  let ganado = 0;
  let perdido = 0;

  for (const e of entradas) {
    if (e.monto > 0) {
      ganadoras += 1;
      ganado += e.monto;
    } else if (e.monto < 0) {
      perdedoras += 1;
      perdido += -e.monto;
    } else {
      planas += 1;
    }
  }

  const operaciones = entradas.length;
  const pnl = ganado - perdido;

  return {
    operaciones,
    ganadoras,
    perdedoras,
    planas,
    pnl,
    // Las planas cuentan en el denominador: operaste igual.
    winRate: operaciones > 0 ? (ganadoras / operaciones) * 100 : null,
    profitFactor: perdido > 0 ? ganado / perdido : null,
    bruto: { ganado, perdido },
    promedio: operaciones > 0 ? pnl / operaciones : null,
  };
}

/* ---------- Long vs. short ---------- */

/**
 * Cuánto dejó cada lado.
 *
 * Reemplazó a la racha de escritura y al "¿escribir te sirve?"
 * (2026-08-27). Los dos hablaban del **hábito** de escribir, no de cómo
 * operás: uno premiaba la constancia y el otro comparaba días escritos
 * contra no escritos, que además era correlación y no causa. Con el
 * sentido cargado se puede responder algo que sí cambia lo que hacés
 * mañana: de qué lado ganás y de cuál perdés.
 *
 * **Cuenta entradas, no jornadas.** Cada entrada es un resultado cargado
 * en una cuenta, así que un mismo trade replicado en cinco cuentas suma
 * cinco veces — que es lo correcto para la plata (ganaste en las cinco)
 * pero no para "cuántas veces operé". La pantalla lo aclara.
 */
export type ResumenSentido = {
  /** Cuánto dejó en total, sumado. */
  total: number;
  /** Cuántas entradas de ese lado. */
  entradas: number;
  ganadoras: number;
  perdedoras: number;
  /** Qué proporción cerró en verde. null = ninguna entrada de ese lado. */
  ganadorPct: number | null;
  /** Lo que deja una entrada promedio. null = ninguna. */
  promedio: number | null;
};

export type PorSentido = {
  long: ResumenSentido;
  short: ResumenSentido;
  /** Entradas sin lado cargado: no entran en ningún grupo. */
  sinMarcar: number;
  /** true = todavía no hay ninguna marcada, la comparación no aplica. */
  vacio: boolean;
};

function resumir(entradas: { monto: number }[]): ResumenSentido {
  let total = 0;
  let ganadoras = 0;
  let perdedoras = 0;

  for (const e of entradas) {
    total += e.monto;
    if (e.monto > 0) ganadoras += 1;
    else if (e.monto < 0) perdedoras += 1;
  }

  return {
    total,
    entradas: entradas.length,
    ganadoras,
    perdedoras,
    // Las planas cuentan en el denominador: operaste igual.
    ganadorPct: entradas.length > 0 ? (ganadoras / entradas.length) * 100 : null,
    promedio: entradas.length > 0 ? total / entradas.length : null,
  };
}

export function porSentido(
  entradas: { monto: number; sentido: Sentido | null }[],
): PorSentido {
  const long = entradas.filter((e) => e.sentido === "long");
  const short = entradas.filter((e) => e.sentido === "short");

  return {
    long: resumir(long),
    short: resumir(short),
    sinMarcar: entradas.length - long.length - short.length,
    vacio: long.length === 0 && short.length === 0,
  };
}

/* ---------- Por día de la semana ---------- */

export type DiaDeSemana = {
  /** 0 = lunes, como las columnas del calendario. */
  indice: number;
  label: string;
  total: number;
  dias: number;
};

/**
 * Cuánto dejó cada día de la semana.
 *
 * Arranca en lunes, igual que la grilla del calendario, y va por
 * `Date.UTC` como todo lo que toca fechas acá: con la fecha local, en
 * UTC−3, el lunes se leería como domingo.
 */
export function porDiaSemana(dias: DiaHome[]): DiaDeSemana[] {
  const acumulado = DIAS_SEMANA.map((label, indice) => ({
    indice,
    label,
    total: 0,
    dias: 0,
  }));

  for (const d of dias) {
    const [a, m, dd] = d.fecha.split("-").map(Number);
    const semana = (new Date(Date.UTC(a, m - 1, dd)).getUTCDay() + 6) % 7;
    acumulado[semana].total += d.monto;
    acumulado[semana].dias += 1;
  }

  return acumulado;
}
