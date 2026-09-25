/**
 * Los cálculos del Home.
 *
 * El Home es la foto de arriba: la fila de números grandes, el calendario
 * del mes y los avisos. No inventa datos — todo sale de los resultados
 * diarios y de los movimientos que ya carga el resto de la app.
 *
 * **Los dos modos.** El switch de arriba cambia qué plata se mira, y son
 * dos preguntas distintas que conviene no mezclar:
 *
 * - `trading`: lo que ganaste o perdiste **operando**. Sale de
 *   `resultados_diarios`. Es el número que mirás día a día y el que
 *   muestran los calendarios de la competencia.
 * - `flujo`: el **flujo de caja**, lo que entró y salió de tu bolsillo.
 *   Retiros cobrados (ya netos del profit split) menos gastos. Es el
 *   mismo neto del Funding Manager, y se puede filtrar por tipo de
 *   movimiento.
 *
 * Ojo con la tentación de sumarlos: un día verde de trading y el retiro
 * que después hacés de esa misma ganancia son **la misma plata contada
 * dos veces**. Por eso son dos modos y no dos series del mismo gráfico.
 */

import type { Categoria, Movimiento } from "./movimientos";
import { agruparPorDia, rachaDeDias, type Resultado } from "./resultados";

export const MODOS_HOME = ["trading", "flujo"] as const;
export type ModoHome = (typeof MODOS_HOME)[number];

export const MODO_HOME_INFO: Record<ModoHome, { label: string; ayuda: string }> = {
  trading: {
    label: "Trading",
    ayuda: "Lo que ganaste o perdiste operando",
  },
  flujo: {
    label: "Flujo de caja",
    ayuda: "Lo que entró y salió: retiros cobrados menos gastos",
  },
};

/* ---------- Los tipos de movimiento del flujo de caja ---------- */

/**
 * Los cuatro tipos de plata que se pueden filtrar en el flujo de caja.
 *
 * Son menos que las categorías de `movimientos.ts` a propósito: el Home
 * responde "¿en qué se me va y de dónde me viene?", y para eso alcanzan
 * cuatro cajones. El detalle categoría por categoría sigue estando en el
 * Funding Manager, que es el dueño de los movimientos.
 */
export const FLUJOS = ["evaluaciones", "activacion", "retiros", "otros"] as const;
export type Flujo = (typeof FLUJOS)[number];

export const FLUJO_INFO: Record<Flujo, { label: string; ayuda: string }> = {
  evaluaciones: {
    label: "Evaluaciones",
    ayuda: "Lo que pagaste por comprar evaluaciones, y los resets",
  },
  activacion: {
    label: "Fee de activación",
    ayuda: "Lo que costó pasar una evaluación a fondeada",
  },
  retiros: {
    label: "Retiros",
    ayuda: "Lo que cobraste, ya neto del profit split",
  },
  otros: {
    label: "Otros gastos",
    ayuda: "Data feed, plataforma, y todo lo que no es de una cuenta puntual",
  },
};

/**
 * En qué cajón cae un movimiento.
 *
 * El **reset va con las evaluaciones**: pagarle a la firm para reiniciar
 * una cuenta es el mismo tipo de gasto que comprarla de nuevo, y de hecho
 * así se carga (ver `CATEGORIAS_MANUALES` en `movimientos.ts`).
 */
export function flujoDe(mov: Movimiento): Flujo {
  if (mov.tipo === "retiro") return "retiros";

  const porCategoria: Partial<Record<Categoria, Flujo>> = {
    fee_challenge: "evaluaciones",
    reset: "evaluaciones",
    activacion: "activacion",
  };

  return (mov.categoria && porCategoria[mov.categoria]) || "otros";
}

/**
 * Deja pasar solo los movimientos elegidos.
 *
 * Una lista vacía es **todos**, no ninguno: es lo que espera cualquiera
 * que despinte el último filtro, y evita la pantalla en cero que no
 * explica por qué está en cero.
 */
export function filtrarFlujos(movs: Movimiento[], elegidos: Flujo[]): Movimiento[] {
  if (elegidos.length === 0) return movs;
  return movs.filter((m) => elegidos.includes(flujoDe(m)));
}

/**
 * Un día con plata, venga del modo que venga.
 *
 * `entradas` es cuántas cosas lo componen: en trading, cuántos resultados
 * se cargaron ese día (desde la migración 012 puede haber varios); en
 * flujo de caja, cuántos movimientos hubo.
 */
export type DiaHome = {
  fecha: string;
  monto: number;
  entradas: number;
};

/** Los días de trading: el neto de cada jornada, de más viejo a más nuevo. */
export function diasDeTrading(resultados: Resultado[]): DiaHome[] {
  return agruparPorDia(resultados).map((d) => ({
    fecha: d.fecha,
    monto: d.monto,
    entradas: d.entradas,
  }));
}

/**
 * Los días de flujo de caja: lo que entró menos lo que salió, por fecha.
 *
 * El monto de un retiro ya viene neto del profit split (lo normaliza
 * `movimientosDe`), así que acá solo hay que ponerle el signo.
 */
export function diasDeFlujo(movs: Movimiento[]): DiaHome[] {
  const mapa = new Map<string, DiaHome>();

  for (const m of movs) {
    const delta = m.tipo === "retiro" ? m.monto : -m.monto;
    const dia = mapa.get(m.fecha);

    if (!dia) mapa.set(m.fecha, { fecha: m.fecha, monto: delta, entradas: 1 });
    else {
      dia.monto += delta;
      dia.entradas += 1;
    }
  }

  return [...mapa.values()].sort((a, b) =>
    a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0
  );
}

const DIAS_MS = 24 * 60 * 60 * 1000;

/* ---------- Períodos del acumulado ---------- */

/**
 * La ventana de tiempo del número acumulado.
 *
 * "Hoy" y "Este mes" son ventanas fijas y no se tocan; el tercer número
 * es el que se mueve, porque la pregunta cambia según el momento: a veces
 * es "¿cómo vengo esta semana?" y a veces "¿cuánto llevo desde que
 * empecé?".
 */
export const PERIODOS = ["7d", "30d", "3m", "6m", "12m", "todo"] as const;
export type Periodo = (typeof PERIODOS)[number];

export const PERIODO_INFO: Record<
  Periodo,
  { label: string; dias?: number; meses?: number }
> = {
  "7d": { label: "Últimos 7 días", dias: 7 },
  "30d": { label: "Últimos 30 días", dias: 30 },
  "3m": { label: "Últimos 3 meses", meses: 3 },
  "6m": { label: "Últimos 6 meses", meses: 6 },
  "12m": { label: "Últimos 12 meses", meses: 12 },
  todo: { label: "Desde siempre" },
};

export const PERIODO_DEFAULT: Periodo = "todo";

/**
 * Desde qué día cuenta un período, incluido. `null` = desde siempre.
 *
 * Las cuentas van por `Date.UTC` y devuelven texto ISO, igual que el
 * resto del archivo: nunca se construye un `Date` con la fecha local,
 * porque en UTC−3 eso corre el día para atrás.
 *
 * "Últimos 7 días" **incluye hoy**: son hoy y los seis anteriores, no los
 * siete anteriores a hoy. Es lo que espera cualquiera que mire una
 * semana.
 */
export function desdeDelPeriodo(periodo: Periodo, hoy: string): string | null {
  const info = PERIODO_INFO[periodo];
  const [a, m, d] = hoy.split("-").map(Number);

  if (info.dias) {
    return new Date(Date.UTC(a, m - 1, d) - (info.dias - 1) * DIAS_MS)
      .toISOString()
      .slice(0, 10);
  }

  if (info.meses) {
    // `Date.UTC` normaliza solo los meses que se pasan de rango, así que
    // restar 3 a enero cae en octubre del año anterior sin hacer cuentas.
    // Un 31 en un mes de 30 se corre al 1 del siguiente, y para una
    // ventana de meses eso es irrelevante.
    return new Date(Date.UTC(a, m - 1 - info.meses, d)).toISOString().slice(0, 10);
  }

  return null;
}

/** Los días que caen dentro del período. */
export function diasDelPeriodo(
  dias: DiaHome[],
  periodo: Periodo,
  hoy: string
): DiaHome[] {
  const desde = desdeDelPeriodo(periodo, hoy);
  if (desde === null) return dias;
  return dias.filter((d) => d.fecha >= desde && d.fecha <= hoy);
}

/** Lo mismo, pero sobre movimientos (para el ROI, que es plata y no días). */
export function movimientosDelPeriodo<T extends { fecha: string }>(
  movs: T[],
  periodo: Periodo,
  hoy: string
): T[] {
  const desde = desdeDelPeriodo(periodo, hoy);
  if (desde === null) return movs;
  return movs.filter((m) => m.fecha >= desde && m.fecha <= hoy);
}

/* ---------- La fila de números grandes ---------- */

export type ResumenHome = {
  /** El día de hoy. null si hoy no hay nada cargado. */
  hoy: DiaHome | null;
  /** Lo que va del mes en curso. */
  mes: number;
  /** Todo lo cargado, desde siempre. */
  total: number;
  /** Días en verde, en rojo y cuántos hay en total. */
  ganadores: number;
  perdedores: number;
  dias: number;
  /** La racha que viene corriendo, en días. */
  racha: { dias: number; ganadora: boolean };
  /** El último día con algo cargado, para cuando hoy está vacío. */
  ultimo: DiaHome | null;
};

/**
 * `hoy` entra por parámetro y no se lee de `Date` acá adentro: el servidor
 * corre en UTC y el usuario en Buenos Aires, así que "hoy" lo decide la
 * pantalla (que sabe la zona del navegador) y esta función se mantiene
 * pura y testeable.
 */
export function resumenHome(dias: DiaHome[], hoy: string): ResumenHome {
  const mesActual = hoy.slice(0, 7);

  let mes = 0;
  let total = 0;
  let ganadores = 0;
  let perdedores = 0;

  for (const d of dias) {
    total += d.monto;
    if (d.fecha.slice(0, 7) === mesActual) mes += d.monto;
    if (d.monto > 0) ganadores += 1;
    else if (d.monto < 0) perdedores += 1;
  }

  return {
    hoy: dias.find((d) => d.fecha === hoy) ?? null,
    mes,
    total,
    ganadores,
    perdedores,
    dias: dias.length,
    racha: rachaDeDias(dias),
    ultimo: dias.length > 0 ? dias[dias.length - 1] : null,
  };
}

/* ---------- El calendario ---------- */

export type Celda = {
  fecha: string;
  /** El número del día, 1 a 31. */
  numero: number;
  /** null = ese día no se cargó nada. Distinto de haber cerrado en cero. */
  monto: number | null;
  entradas: number;
  esHoy: boolean;
  /** Una marca opcional del día. Hoy la usa el journal: "acá escribiste". */
  marcado: boolean;
};

export type Semana = {
  /** Siete lugares: null en los que caen fuera del mes. */
  celdas: (Celda | null)[];
  total: number;
  /** false = la semana entera está vacía; se dibuja en gris. */
  conDatos: boolean;
};

export type MesCalendario = {
  mes: string;
  semanas: Semana[];
  total: number;
  diasConDatos: number;
  ganadores: number;
  perdedores: number;
};

/** "2026-08" -> [2026, 8]. Sin pasar por Date, para no correr zonas horarias. */
function partesMes(mes: string): [number, number] {
  const [a, m] = mes.split("-").map(Number);
  return [a, m];
}

/** El mes de una fecha ISO, o el mes en curso si no hay ninguna. */
export function mesDeFecha(fecha: string) {
  return fecha.slice(0, 7);
}

export function mesAnterior(mes: string) {
  const [a, m] = partesMes(mes);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

export function mesSiguiente(mes: string) {
  const [a, m] = partesMes(mes);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}

/** Los nombres de las columnas. La semana arranca el lunes. */
export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Arma la grilla de un mes.
 *
 * Todas las cuentas de fechas van por `Date.UTC`: construir un `Date` con
 * la fecha local haría que en Buenos Aires (UTC−3) el día 1 se dibujara en
 * la casilla del 31 del mes anterior.
 *
 * Un día sin nada cargado tiene `monto: null`, y eso **no es lo mismo que
 * cero**: un día que operaste y cerraste plano es un día trabajado, y la
 * celda tiene que poder mostrarlo distinto de un domingo.
 */
export function armarMes(
  mes: string,
  dias: DiaHome[],
  hoy: string,
  /** Fechas a marcar con un punto. El journal manda acá los días escritos. */
  marcados?: Set<string>
): MesCalendario {
  const [anio, numeroMes] = partesMes(mes);

  const porFecha = new Map(dias.map((d) => [d.fecha, d]));

  const primero = Date.UTC(anio, numeroMes - 1, 1);
  const cantidadDias = new Date(Date.UTC(anio, numeroMes, 0)).getUTCDate();

  // getUTCDay() da 0 para domingo; la grilla arranca en lunes.
  const offset = (new Date(primero).getUTCDay() + 6) % 7;

  const semanas: Semana[] = [];
  let actual: (Celda | null)[] = Array(offset).fill(null);

  // La semana calendario de estas celdas de relleno sigue siendo una
  // semana real (ej. el lunes 31/8 de la semana que arranca la grilla de
  // septiembre): el dato de ese día ya está en `dias` -viene sin filtrar
  // por mes-, así que se suma al total de **esa** semana aunque la celda
  // se dibuje vacía por no ser de este mes. Sin esto, esa semana aparecía
  // incompleta en las dos vistas: en agosto le faltaban los días de
  // adelante, en septiembre el lunes de atrás.
  let extraSemanaInicial = 0;
  for (let i = 1; i <= offset; i++) {
    const fecha = new Date(primero - i * DIAS_MS).toISOString().slice(0, 10);
    const dia = porFecha.get(fecha);
    if (dia) extraSemanaInicial += dia.monto;
  }

  let total = 0;
  let diasConDatos = 0;
  let ganadores = 0;
  let perdedores = 0;

  for (let n = 1; n <= cantidadDias; n++) {
    const fecha = new Date(primero + (n - 1) * DIAS_MS)
      .toISOString()
      .slice(0, 10);

    const dia = porFecha.get(fecha);

    if (dia) {
      total += dia.monto;
      diasConDatos += 1;
      if (dia.monto > 0) ganadores += 1;
      else if (dia.monto < 0) perdedores += 1;
    }

    actual.push({
      fecha,
      numero: n,
      monto: dia ? dia.monto : null,
      entradas: dia ? dia.entradas : 0,
      esHoy: fecha === hoy,
      marcado: marcados ? marcados.has(fecha) : false,
    });

    if (actual.length === 7) {
      semanas.push(cerrarSemana(actual));
      actual = [];
    }
  }

  // Mismo caso que arriba, del otro lado: los días que le faltan a la
  // última semana para llegar al domingo ya cayeron en el mes siguiente.
  let extraSemanaFinal = 0;
  if (actual.length > 0) {
    const faltan = 7 - actual.length;
    for (let i = 0; i < faltan; i++) {
      const fecha = new Date(primero + (cantidadDias + i) * DIAS_MS)
        .toISOString()
        .slice(0, 10);
      const dia = porFecha.get(fecha);
      if (dia) extraSemanaFinal += dia.monto;
    }
    while (actual.length < 7) actual.push(null);
    semanas.push(cerrarSemana(actual));
  }

  if (semanas.length > 0 && extraSemanaInicial !== 0) {
    semanas[0].total += extraSemanaInicial;
    semanas[0].conDatos = true;
  }
  if (semanas.length > 0 && extraSemanaFinal !== 0) {
    const ultima = semanas[semanas.length - 1];
    ultima.total += extraSemanaFinal;
    ultima.conDatos = true;
  }

  return { mes, semanas, total, diasConDatos, ganadores, perdedores };
}

function cerrarSemana(celdas: (Celda | null)[]): Semana {
  let total = 0;
  let conDatos = false;

  for (const c of celdas) {
    if (c && c.monto !== null) {
      total += c.monto;
      conDatos = true;
    }
  }

  return { celdas, total, conDatos };
}

/** Los meses que tienen algo cargado, del más viejo al más nuevo. */
export function mesesConDatos(dias: DiaHome[]): string[] {
  return [...new Set(dias.map((d) => mesDeFecha(d.fecha)))].sort();
}

/* ---------- Fechas del navegador ---------- */

/**
 * El día de hoy en la zona del usuario, en formato ISO.
 *
 * Se llama **solo desde el cliente**: en el servidor daría la fecha UTC, y
 * entre las 21 y las 24 de Buenos Aires eso ya es mañana.
 */
export function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * El "día operativo" para CARGAR UN RESULTADO: la fecha de `hoyLocal()`,
 * adelantada un día desde que reabre el mercado tras el cierre de Nueva
 * York (Globex: 18:00 hora de Nueva York, todos los días).
 *
 * Por qué por hora de Nueva York y no una hora fija de Buenos Aires:
 * Argentina no tiene horario de verano desde 2009, pero EE.UU. sí, así
 * que la reapertura cae entre las 19 y las 20 en Buenos Aires según la
 * época del año. Calcular sobre la hora de Nueva York (con `Intl`, que
 * ya sabe cuándo rige el horario de verano allá) evita tener que
 * actualizar un número fijo dos veces por año.
 *
 * Solo se usa acá, en el formulario de carga: el "Hoy" del Home y la
 * celda resaltada del calendario siguen el día de calendario real, sin
 * este adelanto — mezclar los dos sentidos de "hoy" en el mismo lugar es
 * más confuso que tener dos funciones con nombres distintos.
 *
 * El fin de semana no es un adelanto de un día más: el mercado cierra el
 * viernes después del cierre de Nueva York y no reabre hasta el domingo
 * a la noche, así que ni el sábado ni el domingo (antes de esa reapertura)
 * son una jornada operativa real. Los dos casos saltan directo al lunes:
 * "sábado" no existe como día para cargar un resultado.
 */
export function diaOperativoLocal() {
  const horaNY = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );

  const [anio, mes, dia] = hoyLocal().split("-").map(Number);
  const avance = horaNY < 18 ? 0 : 1;
  const base = new Date(Date.UTC(anio, mes - 1, dia + avance));

  // 0 = domingo, 6 = sábado. Los dos casos empujan al lunes siguiente:
  // sábado necesita +2, domingo (que a esta altura solo puede ser el
  // domingo de día, antes de la reapertura) necesita +1.
  const diaSemana = base.getUTCDay();
  if (diaSemana === 6) base.setUTCDate(base.getUTCDate() + 2);
  else if (diaSemana === 0) base.setUTCDate(base.getUTCDate() + 1);

  return base.toISOString().slice(0, 10);
}
