/**
 * El journal: una nota por día de trading.
 *
 * **Del día, no de la cuenta ni de la entrada.** La jornada es una sola
 * aunque hayas operado tres cuentas de Apex copiadas en paralelo, y la
 * reflexión que escribís al cierre es sobre esa jornada. Por eso vive en
 * su propia tabla (`journal_dias`, migración 013) y no en la columna
 * `notas` de `resultados_diarios`, que es la nota de *una entrada*.
 *
 * También por eso un día del journal **puede existir sin ningún resultado
 * cargado**: el día que no operaste y querés dejar escrito por qué, es
 * justamente uno de los que vale la pena escribir.
 */

import type { Estado, ModoDrawdown, Tipo } from "./cuentas";
import type { DiaHome } from "./home";

/** Lo que hace falta de cada cuenta: cómo se llama y de qué tipo es. */
export type CuentaJournal = {
  id: string;
  nombre: string;
  tipo: Tipo;
  /** Para saber si al cargar un resultado hay que pedir el máximo del día. */
  modo_drawdown: ModoDrawdown;
  estado: Estado;
};

/** Una fila de `journal_dias`. */
export type NotaDia = {
  id: string;
  fecha: string;
  notas: string;
  updated_at: string;
};

/** Las notas indexadas por fecha, para no recorrer la lista en cada tarjeta. */
export function notasPorFecha(notas: NotaDia[]): Map<string, NotaDia> {
  return new Map(notas.map((n) => [n.fecha, n]));
}

/**
 * Si una nota cuenta como escrita.
 *
 * Una nota vacía o con solo espacios **no cuenta**: si contara, abrir el
 * modal y cerrarlo sin escribir dejaría el día marcado como hecho, y el
 * indicador de "qué días escribí" —que es lo único que te hace volver a
 * escribir— dejaría de decir la verdad.
 */
export function tieneNota(nota: NotaDia | undefined): boolean {
  return nota !== undefined && nota.notas.trim() !== "";
}

/** Un día en la lista del journal: lo que pasó, más lo que escribiste. */
export type DiaJournal = {
  fecha: string;
  /** El neto del día. null = ese día no tiene ningún resultado cargado. */
  monto: number | null;
  entradas: number;
  nota: NotaDia | undefined;
  escrito: boolean;
};

/**
 * Arma la lista del journal, del día más nuevo al más viejo.
 *
 * Junta las dos fuentes: los días que operaste y los días que escribiste.
 * Un día puede estar en una sola de las dos —operaste y no escribiste, o
 * escribiste sin haber operado— y los dos tienen que aparecer.
 */
export function diasDeJournal(
  dias: DiaHome[],
  notas: NotaDia[]
): DiaJournal[] {
  const porFecha = notasPorFecha(notas);
  const fechas = new Set<string>([
    ...dias.map((d) => d.fecha),
    ...notas.filter((n) => n.notas.trim() !== "").map((n) => n.fecha),
  ]);

  const operados = new Map(dias.map((d) => [d.fecha, d]));

  return [...fechas]
    .sort()
    .reverse()
    .map((fecha) => {
      const dia = operados.get(fecha);
      const nota = porFecha.get(fecha);

      return {
        fecha,
        monto: dia ? dia.monto : null,
        entradas: dia ? dia.entradas : 0,
        nota,
        escrito: tieneNota(nota),
      };
    });
}

/** Cuántos días escribiste sobre los que operaste. */
export function cuantosEscritos(dias: DiaJournal[]) {
  return {
    escritos: dias.filter((d) => d.escrito).length,
    total: dias.length,
  };
}

/**
 * El día anterior y el siguiente dentro de la lista, para las flechas del
 * modal: se navega por los días que existen, no por el calendario. Saltar
 * de un día operado al anterior operado es lo que uno quiere al revisar;
 * pasar por veinte días vacíos, no.
 */
export function vecinos(dias: DiaJournal[], fecha: string) {
  const i = dias.findIndex((d) => d.fecha === fecha);
  if (i === -1) return { anterior: null, siguiente: null };

  // La lista viene de más nuevo a más viejo: el "anterior" en el tiempo
  // es el que está más abajo.
  return {
    anterior: i + 1 < dias.length ? dias[i + 1].fecha : null,
    siguiente: i - 1 >= 0 ? dias[i - 1].fecha : null,
  };
}
