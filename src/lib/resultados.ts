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

/**
 * Una fila de `resultados_diarios`: **una entrada, no un día**.
 *
 * Desde la migración 012 un día puede tener varias entradas — dos trades
 * en la misma jornada son dos filas. Todo lo que calcula balance, pico,
 * rachas o días ganadores trabaja sobre el **día**, no sobre la fila, y
 * para eso está `agruparPorDia()`. Contar filas como si fueran días infla
 * el total de días cargados y rompe las rachas.
 */
export type Resultado = {
  id: string;
  cuenta_id: string;
  fecha: string;
  /** Lo que dejó esta entrada, en USD. Negativo si perdiste. */
  monto: number;
  /** El mismo número en % del tamaño de cuenta. */
  pct: number | null;
  /**
   * Solo cuentas trailing: cuánto llegaste a tener arriba dentro del día,
   * medido desde el balance con el que abriste. null = se usa el cierre.
   *
   * Es un dato **del día**, no de la entrada: se mide desde la apertura de
   * la jornada. Cuando el día tiene varias entradas lo lleva una sola de
   * ellas y el resto va en null (lo garantiza `guardarResultado()`); acá,
   * por las dudas, se toma el mayor.
   */
  pico_dia: number | null;
  notas: string | null;
};

/** Un día entero: la suma de sus entradas. */
export type DiaResultado = {
  fecha: string;
  /** El neto del día: la suma de todas sus entradas. */
  monto: number;
  /** El máximo del día, si alguna entrada lo trae. */
  pico_dia: number | null;
  /** Cuántas entradas lo componen. 1 en la mayoría de los días. */
  entradas: number;
};

/**
 * Junta las entradas de cada día en un solo día, ordenado de más viejo a
 * más nuevo.
 *
 * El neto del día es la suma; el máximo del día es el mayor de los
 * cargados (normalmente hay uno solo). Esta es la única puerta entre "lo
 * que el usuario tipeó" y "lo que la app calcula".
 */
export function agruparPorDia(resultados: Resultado[]): DiaResultado[] {
  const mapa = new Map<string, DiaResultado>();

  for (const r of resultados) {
    const dia = mapa.get(r.fecha);

    if (!dia) {
      mapa.set(r.fecha, {
        fecha: r.fecha,
        monto: r.monto,
        pico_dia: r.pico_dia,
        entradas: 1,
      });
      continue;
    }

    dia.monto += r.monto;
    dia.entradas += 1;
    if (r.pico_dia !== null) {
      dia.pico_dia = dia.pico_dia === null ? r.pico_dia : Math.max(dia.pico_dia, r.pico_dia);
    }
  }

  return [...mapa.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

/** Las entradas de un día puntual, de la más vieja a la más nueva. */
export function entradasDelDia(resultados: Resultado[], fecha: string) {
  return resultados.filter((r) => r.fecha === fecha);
}

/** El máximo cargado para un día, o null si no tiene. */
export function maximoDelDia(resultados: Resultado[], fecha: string) {
  const picos = entradasDelDia(resultados, fecha)
    .map((r) => r.pico_dia)
    .filter((p): p is number => p !== null);

  return picos.length === 0 ? null : Math.max(...picos);
}

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
  /** Para dibujar el piso del drawdown día por día. */
  modo_drawdown?: string | null;
  drawdown_maximo_monto?: number | null;
  piso_congelado?: number | null;
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
  /** Hasta dónde podía caer ese día sin quemarse. null = sin drawdown cargado. */
  piso: number | null;
  /** El neto del día, si ese punto es un resultado y no un retiro. */
  monto: number | null;
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
  type Evento = {
    fecha: string;
    delta: number;
    picoDia: number | null;
    esResultado: boolean;
  };

  // Se agrupa por día antes de nada: un día con dos trades es **un** punto
  // de la curva con el neto de los dos, no dos puntos. Si entraran sueltos,
  // la apertura del segundo sería el balance de media jornada y el máximo
  // del día (que se mide desde la apertura real) quedaría mal ubicado.
  const eventos: Evento[] = [
    ...agruparPorDia(resultados).map((d) => ({
      fecha: d.fecha,
      delta: d.monto,
      picoDia: d.pico_dia,
      esResultado: true,
    })),
    // Un retiro saca plata de la cuenta igual que un día perdedor.
    ...retiros.map((r) => ({
      fecha: r.fecha,
      delta: -r.monto,
      picoDia: null,
      esResultado: false,
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

  /** El piso del drawdown con el pico acumulado hasta ese momento. */
  const pisoCon = (picoHasta: number): number | null => {
    const dd = cuenta.drawdown_maximo_monto;
    if (dd === null || dd === undefined) return null;

    if (cuenta.modo_drawdown === "estatico") return cuenta.tamano_cuenta - dd;

    const piso = picoHasta - dd;
    const tope = cuenta.piso_congelado;
    return tope === null || tope === undefined ? piso : Math.min(piso, tope);
  };

  // El primer punto es de dónde arranca la curva, antes de cualquier
  // movimiento: sin él el gráfico empezaría en el primer día cargado y no
  // se vería de dónde venía la cuenta.
  const arranque = eventos.length > 0 && eventos[0].fecha < cuenta.fecha_inicio
    ? eventos[0].fecha
    : cuenta.fecha_inicio;

  const serie: Punto[] = [
    { fecha: arranque, balance: offset, maximo: offset, piso: pisoCon(pico), monto: null },
  ];

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
    serie.push({
      fecha: e.fecha,
      balance,
      maximo,
      piso: pisoCon(pico),
      monto: e.esResultado ? e.delta : null,
    });
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

/**
 * La racha de días en verde o en rojo que viene corriendo.
 *
 * Cuenta **días**, no entradas: una jornada con dos trades es un día. Un
 * día verde es el que cierra en positivo sumando todo lo que se cargó,
 * aunque adentro haya habido una operación perdedora.
 */
export function rachaActual(resultados: Resultado[]) {
  const orden = agruparPorDia(resultados).reverse();
  if (orden.length === 0) return { dias: 0, ganadora: true };

  const ganadora = orden[0].monto >= 0;
  let dias = 0;

  for (const d of orden) {
    if (d.monto >= 0 !== ganadora) break;
    dias += 1;
  }

  return { dias, ganadora };
}

/** Días ganadores, perdedores y totales. También cuenta días, no entradas. */
export function resumenDias(resultados: Resultado[]) {
  const dias = agruparPorDia(resultados);
  const ganadores = dias.filter((d) => d.monto > 0).length;
  const perdedores = dias.filter((d) => d.monto < 0).length;
  return { ganadores, perdedores, total: dias.length };
}
