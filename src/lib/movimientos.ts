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
  /** Qué costo fijo lo generó. null = gasto cargado a mano. */
  costo_fijo_id?: string | null;
  /** El vencimiento teórico del período que cubre. Solo en los generados. */
  periodo?: string | null;
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
  /**
   * Qué costo fijo lo generó. Es una fila de `gastos` común —se edita y se
   * borra— pero se marca en la lista para que se entienda de dónde salió.
   */
  costoFijoId?: string | null;
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
    costoFijoId: g.costo_fijo_id ?? null,
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
  /**
   * Cuánto rindió lo invertido, en %. null cuando no invertiste nada:
   * dividir por cero daría infinito, y "infinito por ciento" no es una
   * respuesta — es un cartel de que la pregunta todavía no aplica.
   */
  roi: number | null;
  /** Cuántos retiros entraron en la cuenta, y de cuánto fue cada uno. */
  cantidadRetiros: number;
  retiroPromedio: number | null;
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
  let cantidadRetiros = 0;

  for (const m of movs) {
    if (m.tipo === "gasto") {
      invertido += m.monto;
    } else {
      cobrado += m.monto;
      cantidadRetiros += 1;
    }
  }

  const neto = cobrado - invertido;

  return {
    invertido,
    cobrado,
    neto,
    roi: invertido > 0 ? (neto / invertido) * 100 : null,
    cantidadRetiros,
    retiroPromedio: cantidadRetiros > 0 ? cobrado / cantidadRetiros : null,
  };
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

/* ---------- Pass rate ---------- */

export type PassRate = {
  pasadas: number;
  quemadas: number;
  /** Las que todavía estás operando: no entran en la cuenta. */
  enCurso: number;
  /** Pasadas + quemadas. El denominador. */
  resueltas: number;
  /** Qué proporción de las que terminaron, pasaste. null = ninguna terminó. */
  ratio: number | null;
};

/**
 * Cuántas evaluaciones pasás, de las que terminan.
 *
 * **El denominador son las resueltas, no todas.** Una evaluación en curso
 * todavía no es ni un éxito ni un fracaso, y meterla abajo hunde el número
 * justo cuando más evaluaciones tenés abiertas — que es cuando mejor te
 * está yendo. Las en curso se muestran al lado, para que se vea que el
 * número puede moverse.
 *
 * Solo mira evaluaciones (`tipo === "challenge"`): una fondeada no se
 * "pasa". Pasar una evaluación deja `estado = "passed"` y **no** cambia el
 * tipo de la cuenta, así que las pasadas siguen contándose acá.
 */
export function passRate(cuentas: { tipo: string; estado: string }[]): PassRate {
  let pasadas = 0;
  let quemadas = 0;
  let enCurso = 0;

  for (const c of cuentas) {
    if (c.tipo !== "challenge") continue;
    if (c.estado === "passed") pasadas += 1;
    else if (c.estado === "quemada") quemadas += 1;
    else if (c.estado !== "archivada") enCurso += 1;
  }

  const resueltas = pasadas + quemadas;

  return {
    pasadas,
    quemadas,
    enCurso,
    resueltas,
    ratio: resueltas > 0 ? (pasadas / resueltas) * 100 : null,
  };
}

/* ---------- El capital que manejás ---------- */

/** Lo que hace falta de cada cuenta para saber cuánto capital manejabas. */
export type CuentaCapital = {
  nombre?: string;
  tipo: string;
  estado: string;
  tamano_cuenta: number | null;
  fecha_inicio: string;
  /** El día que pasó o se quemó. null = sigue en juego. */
  fecha_cierre: string | null;
  /** Última modificación. Se usa como cierre cuando falta `fecha_cierre`. */
  updated_at?: string | null;
  /**
   * El balance de la cuenta día por día, de vieja a nueva — la misma curva
   * que dibuja la tarjeta en Cuentas (`estadoDeCuenta().serie`).
   *
   * **Es el dato que manda.** El capital que manejás es lo que hay en las
   * cuentas, no el tamaño del plan que compraste: una PA de 50k con la
   * que perdiste 2.000 son 48.000 manejados, y sumar 50.000 muestra plata
   * que no existe. Se probó con `tamano_cuenta` y el total daba redondo y
   * equivocado.
   */
  serie?: { fecha: string; balance: number }[];
};

/**
 * El balance de la cuenta en una fecha: el último punto de su curva que ya
 * había ocurrido.
 *
 * Sin curva cargada cae al tamaño de cuenta, que es de dónde arranca
 * cualquier cuenta antes del primer movimiento.
 */
function balanceEn(c: CuentaCapital, fecha: string): number {
  const serie = c.serie ?? [];

  let balance = Number(c.tamano_cuenta) || 0;
  for (const p of serie) {
    // Las fechas son "AAAA-MM-DD": como texto ya ordenan bien.
    if (p.fecha > fecha) break;
    balance = p.balance;
  }

  return balance;
}

export type PuntoCapital = {
  fecha: string;
  /** Cuánto capital manejabas ese día. */
  capital: number;
  /** Cuántas fondeadas vivas lo componían. */
  cuentas: number;
};

/**
 * Cuándo dejaste de manejar esa cuenta. null = la seguís manejando.
 *
 * El dato bueno es `fecha_cierre`, pero **la mayoría de las cuentas viejas
 * no lo tienen** (se agregó en la 006, y solo se pregunta al cambiar el
 * estado desde la app). Sin un plan B, todas esas cuentas quemadas seguían
 * sumando para siempre: el gráfico decía que hoy manejás 24 fondeadas
 * cuando manejás 8. Por eso, cuando la cuenta ya no está en juego y no
 * tiene fecha de cierre, se usa `updated_at` — el último día que alguien
 * la tocó, que es aproximadamente el día que se cerró— y si tampoco está,
 * la fecha de inicio, que la deja contando un solo día en vez de siempre.
 *
 * Es una aproximación y se prefiere igual: equivocarle unos días a un
 * escalón viejo es mucho menos grave que decirle a alguien que maneja el
 * triple del capital que maneja.
 */
function finDeGestion(c: CuentaCapital): string | null {
  if (c.fecha_cierre) return c.fecha_cierre;
  if (c.estado === "activa" || c.estado === "en_curso") return null;
  return (c.updated_at ?? c.fecha_inicio).slice(0, 10);
}

/**
 * La escalera del capital bajo gestión: cuánta plata ajena manejaste cada
 * día.
 *
 * Sube cuando una fondeada arranca y baja cuando se quema o se cierra.
 * Ningún competidor lo muestra, y es el número que mejor cuenta el
 * progreso de un fondeado: el P&L sube y baja con el mercado, pero pasar
 * de manejar 50k a manejar 250k es una sola dirección.
 *
 * **Solo fondeadas**: en una evaluación los dólares son simulados, así que
 * "manejar 150k" no significa nada — la misma razón por la que el Home no
 * suma los dos tipos.
 *
 * Los puntos van en los **días en que algo cambió**, no uno por día: la
 * serie es una escalera y los días intermedios no agregan información.
 */
export function curvaCapital(
  cuentas: CuentaCapital[],
  hoy: string,
): PuntoCapital[] {
  const fondeadas = cuentas
    .filter((c) => c.tipo === "fondeada")
    .map((c) => ({
      cuenta: c,
      desde: c.fecha_inicio,
      hasta: finDeGestion(c),
    }))
    .filter((c) => c.desde);

  if (fondeadas.length === 0) return [];

  const fechas = new Set<string>();
  for (const c of fondeadas) {
    fechas.add(c.desde);
    // El día del cierre todavía la manejabas: el escalón baja al siguiente.
    if (c.hasta) fechas.add(diaSiguiente(c.hasta));
    // Y cada día en que el balance de esa cuenta se movió: el capital
    // manejado cambia también cuando ganás, perdés o retirás, no solo
    // cuando una cuenta nace o muere.
    for (const p of c.cuenta.serie ?? []) fechas.add(p.fecha);
  }
  fechas.add(hoy);

  return [...fechas]
    .filter((f) => f <= hoy)
    .sort()
    .map((fecha) => {
      let capital = 0;
      let vivas = 0;

      for (const c of fondeadas) {
        // Las fechas son "AAAA-MM-DD": como texto ya ordenan bien.
        if (c.desde > fecha) continue;
        if (c.hasta !== null && c.hasta < fecha) continue;
        capital += balanceEn(c.cuenta, fecha);
        vivas += 1;
      }

      return { fecha, capital, cuentas: vivas };
    });
}

/**
 * Qué cuentas componen el capital de hoy, una por una.
 *
 * Existe para que el número grande sea **auditable**: la primera vez que
 * el gráfico mostró un total, la reacción fue "yo no manejo tanto" — y sin
 * poder ver de qué cuentas sale, no había forma de saber si el error era
 * del cálculo o de una cuenta quemada que quedó marcada como activa. Un
 * número que no se puede desarmar no se puede corregir.
 */
export function fondeadasEnGestion(
  cuentas: CuentaCapital[],
  hoy: string,
): { nombre: string; tamano: number }[] {
  return cuentas
    .filter((c) => c.tipo === "fondeada")
    .filter((c) => c.fecha_inicio <= hoy)
    .filter((c) => {
      const fin = finDeGestion(c);
      return fin === null || fin >= hoy;
    })
    .map((c) => ({
      nombre: c.nombre ?? "—",
      // El balance de hoy, el mismo número que muestra su tarjeta en
      // Cuentas. Que los dos lugares digan lo mismo es la mitad del punto.
      tamano: balanceEn(c, hoy),
    }))
    .sort((a, b) => b.tamano - a.tamano);
}

/** "2026-08-18" -> "2026-08-19", por UTC para no correrse un día. */
function diaSiguiente(fecha: string) {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
}
