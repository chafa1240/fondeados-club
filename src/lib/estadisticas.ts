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
import type { DiaJournal } from "./journal";

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

/* ---------- La racha de escritura ---------- */

export type RachaEscritura = {
  /** Días operados seguidos, desde el más reciente, que tienen nota. */
  dias: number;
  /** false = el último día que operaste todavía no está escrito. */
  alDia: boolean;
  /** El día que hay que escribir para arrancar (o seguir) la racha. */
  pendiente: string | null;
};

/**
 * Cuenta hacia atrás desde el último día operado.
 *
 * Cuenta **días operados**, no días de calendario: un fin de semana no te
 * corta la racha porque no había nada que escribir. Y si el último día que
 * operaste no está escrito, la racha es cero — no "se mantiene": el punto
 * de una racha es que duela cortarla.
 *
 * Espera los días como los devuelve `diasDeJournal()`: del más nuevo al
 * más viejo.
 */
export function rachaDeEscritura(dias: DiaJournal[]): RachaEscritura {
  const operados = dias.filter((d) => d.monto !== null);

  if (operados.length === 0) {
    return { dias: 0, alDia: true, pendiente: null };
  }

  if (!operados[0].escrito) {
    return { dias: 0, alDia: false, pendiente: operados[0].fecha };
  }

  let cuenta = 0;
  for (const d of operados) {
    if (!d.escrito) break;
    cuenta += 1;
  }

  return {
    dias: cuenta,
    alDia: true,
    pendiente: cuenta < operados.length ? null : null,
  };
}

/* ---------- ¿Escribir sirve? ---------- */

/**
 * La muestra mínima por grupo para animarse a mostrar la comparación.
 *
 * Con menos que esto el número es ruido, y un número que miente en una
 * pantalla que te pide que escribas todos los días es peor que no mostrar
 * nada.
 */
export const MINIMO_MUESTRA = 5;

export type EfectoEscribir = {
  suficiente: boolean;
  /** Cuántos días faltan en el grupo más chico para llegar al mínimo. */
  faltan: number;
  despuesDeEscribir: { dias: number; promedio: number };
  despuesDeNoEscribir: { dias: number; promedio: number };
  diferencia: number;
};

/**
 * Compara cómo te fue **el día después** de escribir contra el día después
 * de no escribir.
 *
 * El "después" no es un detalle: la nota se escribe al cierre, así que
 * escribir **no puede** haber cambiado el resultado de ese mismo día.
 * Comparar días escritos contra no escritos sin mover la ventana sería
 * medir el efecto de una causa que ocurrió más tarde — que es una de las
 * formas más fáciles de mentir con estadística.
 *
 * Aun así esto es **correlación, no causa**: quien viene ordenado escribe
 * y además opera mejor, y las dos cosas pueden salir de lo mismo. La
 * pantalla lo dice con todas las letras.
 */
export function efectoDeEscribir(dias: DiaJournal[]): EfectoEscribir {
  // De más viejo a más nuevo, y solo los días que operaste.
  const operados = dias.filter((d) => d.monto !== null).slice().reverse();

  const despues: number[] = [];
  const despuesSin: number[] = [];

  for (let i = 1; i < operados.length; i++) {
    const monto = operados[i].monto as number;
    if (operados[i - 1].escrito) despues.push(monto);
    else despuesSin.push(monto);
  }

  const promedio = (xs: number[]) =>
    xs.length === 0 ? 0 : xs.reduce((a, x) => a + x, 0) / xs.length;

  const menor = Math.min(despues.length, despuesSin.length);

  return {
    suficiente: menor >= MINIMO_MUESTRA,
    faltan: Math.max(0, MINIMO_MUESTRA - menor),
    despuesDeEscribir: { dias: despues.length, promedio: promedio(despues) },
    despuesDeNoEscribir: { dias: despuesSin.length, promedio: promedio(despuesSin) },
    diferencia: promedio(despues) - promedio(despuesSin),
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
