/**
 * Resultados diarios: el neto de trading de cada día, y el cálculo del
 * balance y del pico que sale de ellos.
 *
 * Desde el Paso 5b el balance **no es un dato guardado**: es
 *
 *     balance = balance_semilla + resultados − retiros
 *
 * anclado en la fecha de la semilla. Guardar además el balance sería una
 * segunda fuente de verdad que hay que mantener sincronizada, y es
 * exactamente donde aparecen los números que no cierran.
 */

import type { Retiro } from "./cuentas";

/** Una fila de `resultados_diarios`. */
export type Resultado = {
  id: string;
  cuenta_id: string;
  fecha: string;
  /** Neto del día en USD. Negativo si perdiste. */
  monto: number;
  /** El mismo número en % del tamaño de cuenta. */
  pct: number | null;
  /**
   * Solo cuentas trailing: cuánto llegaste a tener arriba dentro del día,
   * medido desde el balance con el que abriste. null = se usa el cierre.
   */
  pico_dia: number | null;
  notas: string | null;
};

/**
 * Lo que hace falta de la cuenta para reconstruir su curva.
 *
 * Los campos de la semilla van opcionales a propósito: si la migración 011
 * todavía no corrió, la fila viene sin ellos y hay que poder seguir
 * mostrando la cuenta en vez de llenar la pantalla de NaN.
 */
export type CuentaSerie = {
  tamano_cuenta: number;
  balance_actual: number;
  fecha_inicio: string;
  balance_semilla?: number | null;
  fecha_semilla?: string | null;
  pico_semilla?: number | null;
};

/** Un número que sirva para calcular, o el de reserva. */
function numeroOAlternativa(valor: number | null | undefined, alternativa: number) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : alternativa;
}

export type Punto = {
  fecha: string;
  /** Balance al cierre de ese día. */
  balance: number;
  /** Lo más alto que estuvo ese día (con el flotante, si se cargó). */
  maximo: number;
};

export type EstadoCuenta = {
  /** Balance de hoy, ya con resultados y retiros aplicados. */
  balance: number;
  /** Máximo histórico, que es lo que persigue el trailing. */
  pico: number;
  /** La curva completa, para el gráfico de balance vs. piso. */
  serie: Punto[];
};

/**
 * Reconstruye la curva de la cuenta y devuelve balance y pico de hoy.
 *
 * El truco del ancla: se suman todos los movimientos en orden, y después
 * se corre toda la curva para que el valor en la fecha de la semilla dé
 * justo `balance_semilla`. Así da igual si los días cargados son
 * posteriores a la semilla (empujan el balance de hoy) o anteriores
 * (reconstruyen la curva hacia atrás sin tocar el presente).
 */
export function estadoDeCuenta(
  cuenta: CuentaSerie,
  resultados: Resultado[],
  retiros: Retiro[]
): EstadoCuenta {
  type Evento = { fecha: string; delta: number; picoDia: number | null };

  const eventos: Evento[] = [
    ...resultados.map((r) => ({
      fecha: r.fecha,
      delta: r.monto,
      picoDia: r.pico_dia,
    })),
    // Un retiro saca plata de la cuenta igual que un día perdedor.
    ...retiros.map((r) => ({
      fecha: r.fecha,
      delta: -r.monto,
      picoDia: null,
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

  // Sin semilla cargada, el balance que ya estaba es el punto de partida y
  // la fecha de inicio hace de ancla: la cuenta se muestra igual.
  const balanceSemilla = numeroOAlternativa(
    cuenta.balance_semilla,
    numeroOAlternativa(cuenta.balance_actual, cuenta.tamano_cuenta)
  );
  const fechaSemilla = cuenta.fecha_semilla ?? cuenta.fecha_inicio;

  // Cuánto acumulan los eventos hasta la semilla, incluida: el balance de
  // la semilla es el del CIERRE de ese día.
  const hastaSemilla = eventos
    .filter((e) => e.fecha <= fechaSemilla)
    .reduce((a, e) => a + e.delta, 0);

  const offset = balanceSemilla - hastaSemilla;

  // El pico nunca puede ser menor al tamaño de cuenta, y respeta el que se
  // haya cargado a mano (sirve para cuentas con historia previa a la app).
  let pico = Math.max(
    cuenta.tamano_cuenta,
    numeroOAlternativa(cuenta.pico_semilla, 0)
  );
  let acumulado = 0;
  const serie: Punto[] = [];

  for (const e of eventos) {
    // Lo alto que estuvo dentro del día se mide desde el balance con el
    // que abrió, o sea antes de aplicar el neto.
    const apertura = acumulado + offset;
    acumulado += e.delta;
    const balance = acumulado + offset;

    const maximo =
      e.picoDia === null
        ? Math.max(apertura, balance)
        : Math.max(apertura + e.picoDia, apertura, balance);

    pico = Math.max(pico, maximo);
    serie.push({ fecha: e.fecha, balance, maximo });
  }

  const balance = acumulado + offset;

  return { balance, pico: Math.max(pico, balance), serie };
}

/** Agrupa por cuenta, para no recorrer todo en cada tarjeta. */
export function porCuenta<T extends { cuenta_id: string }>(filas: T[]) {
  const mapa: Record<string, T[]> = {};
  for (const f of filas) (mapa[f.cuenta_id] ??= []).push(f);
  return mapa;
}

/* ---------- Conversión monto <-> % ---------- */

export function pctDeResultado(tamano: number, monto: number) {
  if (!tamano) return 0;
  return Math.round((monto / tamano) * 100 * 100) / 100;
}

export function montoDeResultado(tamano: number, pct: number) {
  return Math.round(((tamano * pct) / 100) * 100) / 100;
}

/* ---------- Estadísticas simples ---------- */

export function rachaActual(resultados: Resultado[]) {
  const orden = [...resultados].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  if (orden.length === 0) return { dias: 0, ganadora: true };

  const ganadora = orden[0].monto >= 0;
  let dias = 0;

  for (const r of orden) {
    if (r.monto >= 0 !== ganadora) break;
    dias += 1;
  }

  return { dias, ganadora };
}

export function resumenDias(resultados: Resultado[]) {
  const ganadores = resultados.filter((r) => r.monto > 0).length;
  const perdedores = resultados.filter((r) => r.monto < 0).length;
  return { ganadores, perdedores, total: resultados.length };
}
