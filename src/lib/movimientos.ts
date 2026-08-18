/**
 * Tipos y cálculos de gastos, retiros y la vista unificada de movimientos.
 *
 * Misma idea que `cuentas.ts`: todo lo que sea cuenta o cálculo vive acá y
 * no dentro de las pantallas, así se reusa tal cual en la app móvil.
 */

import { netoDeRetiro, plata, type Retiro } from "./cuentas";

/* ---------- Categorías de gasto ---------- */

export const CATEGORIAS = [
  "fee_challenge",
  "reset",
  "activacion",
  "software_suscripcion",
  "otro",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_INFO: Record<
  Categoria,
  { label: string; ayuda: string; general: boolean }
> = {
  fee_challenge: {
    label: "Evaluación",
    ayuda: "Lo que pagaste por comprar la evaluación",
    general: false,
  },
  reset: {
    label: "Reset",
    ayuda: "Volver a arrancar una cuenta quemada",
    general: false,
  },
  activacion: {
    label: "Fee de activación",
    ayuda: "Lo que costó pasar la evaluación a fondeada",
    general: false,
  },
  software_suscripcion: {
    label: "Software / suscripción",
    ayuda: "Data feed, plataforma, indicadores — normalmente no es de una cuenta puntual",
    general: true,
  },
  otro: { label: "Otro", ayuda: "", general: true },
};

/**
 * Las categorías que se ofrecen al cargar un gasto a mano.
 *
 * Las otras tres (evaluación, reset, fee de activación) existen igual,
 * pero **solo las usan los movimientos automáticos**: esos números ya son
 * campos de la cuenta. Ofrecerlas también acá permitía cargar dos veces lo
 * mismo — el precio en la evaluación y de nuevo como gasto — y el ROI
 * quedaba inflado sin que nadie avisara.
 *
 * Un reset se carga como una evaluación nueva más barata: así queda además
 * la cuenta para seguirla.
 */
export const CATEGORIAS_MANUALES = CATEGORIAS.filter(
  (c) => CATEGORIA_INFO[c].general
);

/** Una fila de la tabla `gastos`. */
export type Gasto = {
  id: string;
  /** null = gasto general, no atado a ninguna cuenta. */
  cuenta_id: string | null;
  categoria: Categoria;
  monto: number;
  fecha: string;
  descripcion: string | null;
};

/* ---------- Movimientos: gastos y retiros en una sola lista ---------- */

export const TIPOS_MOVIMIENTO = ["gasto", "retiro"] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const TIPO_MOVIMIENTO_INFO: Record<
  TipoMovimiento,
  { label: string; plural: string; signo: string; clase: string }
> = {
  gasto: {
    label: "Gasto",
    plural: "Gastos",
    signo: "−",
    clase: "text-rose-400",
  },
  retiro: {
    label: "Retiro",
    plural: "Retiros",
    signo: "+",
    clase: "text-emerald-400",
  },
};

/**
 * Un movimiento es un gasto o un retiro, ya normalizados para poder
 * mostrarlos en la misma tabla. El `monto` siempre es positivo: el signo
 * lo pone el tipo, no el número.
 */
export type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  fecha: string;
  monto: number;
  cuenta_id: string | null;
  /** Solo en gastos. */
  categoria: Categoria | null;
  /** `descripcion` en un gasto, `notas` en un retiro. */
  detalle: string | null;
  /**
   * true = no es una fila de `gastos` ni de `payouts`, sale de un campo de
   * la cuenta (precio de la evaluación, fee de activación, retiros previos).
   * No se edita ni se borra desde acá: se cambia en la cuenta.
   */
  automatico?: boolean;
  /** Qué campo de la cuenta lo generó. Solo en los automáticos. */
  origen?: CampoCuenta;
};

/** Los campos de la cuenta que se pueden editar desde la lista. */
export const CAMPOS_CUENTA = [
  "precio",
  "fee_activacion",
  "retiros_previos",
] as const;

export type CampoCuenta = (typeof CAMPOS_CUENTA)[number];

export const CAMPO_CUENTA_INFO: Record<
  CampoCuenta,
  { label: string; ayuda: string }
> = {
  precio: {
    label: "Precio de la evaluación",
    ayuda: "Lo que pagaste por comprarla",
  },
  fee_activacion: {
    label: "Fee de activación",
    ayuda: "Lo que costó pasarla a fondeada",
  },
  retiros_previos: {
    label: "Retiros previos",
    ayuda: "Lo que sacaste de esta cuenta antes de usar la app",
  },
};

/* ---------- Movimientos que salen de la propia cuenta ---------- */

/** Los campos de la cuenta que son plata entrando o saliendo. */
export type CuentaMovimientos = {
  id: string;
  nombre: string;
  firm: string;
  fecha_inicio: string;
  /** Solo evaluaciones: lo que costó comprarla. */
  precio: number | null;
  /** Solo fondeadas: lo que costó activarla. null = no tuvo. */
  fee_activacion: number | null;
  /** Lo retirado antes de empezar a usar la app. */
  retiros_previos: number;
};

/**
 * El precio de la evaluación, el fee de activación y los retiros previos
 * se cargan en el formulario de la cuenta, no como movimientos. Pero son
 * plata que salió y entró, así que tienen que contar en los totales.
 *
 * Se derivan en vez de crear filas en `gastos`: si se copiaran, habría dos
 * fuentes para el mismo dato y tarde o temprano una queda desactualizada.
 * Acá el número vive en un solo lugar (la cuenta) y esto es una vista.
 *
 * La fecha que se les pone es la de inicio de la cuenta, que es cuando
 * efectivamente pagaste.
 */
export function movimientosDeCuentas(
  cuentas: CuentaMovimientos[]
): Movimiento[] {
  const movs: Movimiento[] = [];

  for (const c of cuentas) {
    if (c.precio !== null && c.precio > 0) {
      movs.push({
        id: `cuenta-precio-${c.id}`,
        tipo: "gasto",
        fecha: c.fecha_inicio,
        monto: c.precio,
        cuenta_id: c.id,
        categoria: "fee_challenge",
        detalle: null,
        automatico: true,
        origen: "precio",
      });
    }

    if (c.fee_activacion !== null && c.fee_activacion > 0) {
      movs.push({
        id: `cuenta-fee-${c.id}`,
        tipo: "gasto",
        fecha: c.fecha_inicio,
        monto: c.fee_activacion,
        cuenta_id: c.id,
        categoria: "activacion",
        detalle: null,
        automatico: true,
        origen: "fee_activacion",
      });
    }

    if (c.retiros_previos > 0) {
      movs.push({
        id: `cuenta-previos-${c.id}`,
        tipo: "retiro",
        fecha: c.fecha_inicio,
        monto: c.retiros_previos,
        cuenta_id: c.id,
        categoria: null,
        detalle: "Previos a la app",
        automatico: true,
        origen: "retiros_previos",
      });
    }
  }

  return movs;
}

export function movimientosDe(
  gastos: Gasto[],
  retiros: Retiro[],
  cuentas: CuentaMovimientos[] = []
): Movimiento[] {
  const deGastos: Movimiento[] = gastos.map((g) => ({
    id: g.id,
    tipo: "gasto",
    fecha: g.fecha,
    monto: g.monto,
    cuenta_id: g.cuenta_id,
    categoria: g.categoria,
    detalle: g.descripcion,
  }));

  // En un retiro el monto que cuenta como "cobrado" es el neto: lo que
  // realmente entró después del profit split. El bruto (lo que salió de la
  // cuenta) se aclara al costado cuando son distintos.
  const deRetiros: Movimiento[] = retiros.map((r) => {
    const neto = netoDeRetiro(r);
    const partido = neto !== r.monto;

    return {
      id: r.id,
      tipo: "retiro" as const,
      fecha: r.fecha,
      monto: neto,
      cuenta_id: r.cuenta_id,
      categoria: null,
      detalle: partido
        ? `De ${plata(r.monto, 2)} retirados${r.notas ? ` · ${r.notas}` : ""}`
        : r.notas,
    };
  });

  return ordenarMovimientos([
    ...deGastos,
    ...deRetiros,
    ...movimientosDeCuentas(cuentas),
  ]);
}

/** Más nuevos primero; a igual fecha, primero los retiros (son la buena noticia). */
export function ordenarMovimientos(movs: Movimiento[]): Movimiento[] {
  return [...movs].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    if (a.tipo !== b.tipo) return a.tipo === "retiro" ? -1 : 1;
    return 0;
  });
}

/* ---------- Meses ---------- */

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-08-17" -> "2026-08". Sin pasar por Date, para no correr zonas horarias. */
export function mesDe(fecha: string) {
  return fecha.slice(0, 7);
}

/** "2026-08" -> "Agosto 2026" */
export function etiquetaMes(mes: string) {
  const [anio, m] = mes.split("-");
  const nombre = MESES[Number(m) - 1] ?? mes;
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${anio}`;
}

/** Los meses que realmente tienen movimientos, del más nuevo al más viejo. */
export function mesesDe(movs: Movimiento[]): string[] {
  return [...new Set(movs.map((m) => mesDe(m.fecha)))].sort().reverse();
}

/* ---------- Totales ---------- */

export type Totales = {
  invertido: number;
  cobrado: number;
  neto: number;
};

/**
 * Lo gastado, lo cobrado y la diferencia.
 *
 * Incluye los movimientos automáticos (precio de la evaluación, fee de
 * activación y retiros previos), porque son plata real que se movió aunque
 * se haya cargado desde el formulario de la cuenta.
 */
export function totales(movs: Movimiento[]): Totales {
  let invertido = 0;
  let cobrado = 0;

  for (const m of movs) {
    if (m.tipo === "gasto") invertido += m.monto;
    else cobrado += m.monto;
  }

  return { invertido, cobrado, neto: cobrado - invertido };
}

/** Cuánto se gastó en cada categoría, de mayor a menor. */
export function porCategoria(movs: Movimiento[]) {
  const acumulado = new Map<Categoria, number>();

  for (const m of movs) {
    if (m.tipo !== "gasto" || m.categoria === null) continue;
    acumulado.set(m.categoria, (acumulado.get(m.categoria) ?? 0) + m.monto);
  }

  return [...acumulado.entries()]
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);
}

/* ---------- Series para los gráficos ---------- */

export type PuntoAcumulado = {
  fecha: string;
  invertido: number;
  cobrado: number;
  neto: number;
};

/**
 * Los movimientos acumulados día a día.
 *
 * Acumulado y no por día a propósito: la pregunta del Funding Manager es
 * "¿cuánto llevo puesto y cuánto recuperé?", no "¿cuánto gasté el martes?".
 * Una serie acumulada responde eso de un vistazo; una de barras diarias
 * obliga a sumar con la vista.
 */
export function acumuladoEnTiempo(movs: Movimiento[]): PuntoAcumulado[] {
  const orden = [...movs].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const puntos: PuntoAcumulado[] = [];
  let invertido = 0;
  let cobrado = 0;

  for (const m of orden) {
    if (m.tipo === "gasto") invertido += m.monto;
    else cobrado += m.monto;

    const ultimo = puntos[puntos.length - 1];
    const punto = { fecha: m.fecha, invertido, cobrado, neto: cobrado - invertido };

    // Varios movimientos del mismo día son un solo punto: el de la última
    // suma. Si no, la línea tendría escalones verticales dentro de un día.
    if (ultimo && ultimo.fecha === m.fecha) puntos[puntos.length - 1] = punto;
    else puntos.push(punto);
  }

  return puntos;
}

/** Cómo terminaron las cuentas de cada firm. */
export type ResumenFirm = {
  firm: string;
  pasadas: number;
  quemadas: number;
  enJuego: number;
};

export function porFirm(
  cuentas: { firm: string; estado: string }[]
): ResumenFirm[] {
  const mapa = new Map<string, ResumenFirm>();

  for (const c of cuentas) {
    const r =
      mapa.get(c.firm) ??
      { firm: c.firm, pasadas: 0, quemadas: 0, enJuego: 0 };

    if (c.estado === "passed") r.pasadas += 1;
    else if (c.estado === "quemada") r.quemadas += 1;
    else if (c.estado !== "archivada") r.enJuego += 1;

    mapa.set(c.firm, r);
  }

  return [...mapa.values()].sort(
    (a, b) =>
      b.pasadas + b.quemadas + b.enJuego - (a.pasadas + a.quemadas + a.enJuego)
  );
}
