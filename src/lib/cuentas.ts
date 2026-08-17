/**
 * Tipos y cálculos de la sección Cuentas.
 *
 * Todo lo que sea "cuenta" se calcula acá (no dentro de las pantallas),
 * así el día que exista la app móvil se reusa tal cual.
 */

/* ---------- Tipo de cuenta ---------- */

export const TIPOS = ["fondeada", "challenge"] as const;
export type Tipo = (typeof TIPOS)[number];

/**
 * El valor guardado en la base sigue siendo `challenge` (así no hace falta
 * migrar datos), pero en pantalla se llama "Evaluación".
 */
export const TIPO_INFO: Record<Tipo, { label: string }> = {
  fondeada: { label: "Fondeada" },
  challenge: { label: "Evaluación" },
};

/**
 * El objetivo de retiro y el profit split son cosas de una cuenta fondeada:
 * en una evaluación todavía no se cobra nada.
 */
export function tieneRetiro(tipo: Tipo) {
  return tipo === "fondeada";
}

/* ---------- Estados que se eligen a mano ---------- */

export const ESTADOS = [
  "activa",
  "en_curso",
  "passed",
  "quemada",
  "archivada",
] as const;

export type Estado = (typeof ESTADOS)[number];

/**
 * Qué estados tiene sentido elegir según el tipo de cuenta.
 * `archivada` no está acá a propósito: archivar es una acción aparte
 * (guardar la cuenta sin borrarla), no un estado más de la lista.
 */
export const ESTADOS_POR_TIPO: Record<Tipo, Estado[]> = {
  fondeada: ["activa", "quemada"],
  challenge: ["en_curso", "passed", "quemada"],
};

/** Los estados que se pueden guardar para un tipo, archivada incluida. */
export function estadoValido(tipo: Tipo, estado: Estado) {
  return estado === "archivada" || ESTADOS_POR_TIPO[tipo].includes(estado);
}

/**
 * Los filtros de estado de la pantalla de Cuentas, según el tipo elegido.
 * En "Todas" no se filtra por estado.
 */
export const FILTROS_POR_TIPO: Record<Tipo, Estado[]> = {
  fondeada: ["activa", "quemada"],
  challenge: ["en_curso", "passed", "quemada"],
};

/**
 * Una cuenta "en juego" es la que todavía estás operando: activa si es
 * fondeada, en curso si es evaluación. El resto (pasada, quemada,
 * archivada) ya terminó su ciclo.
 */
export function enJuego(estado: Estado) {
  return estado === "activa" || estado === "en_curso";
}

/**
 * Estados que cierran el ciclo de la cuenta: al llegar acá se pregunta en
 * qué fecha pasó, y al salir de acá esa fecha se borra.
 */
export function esCierre(estado: Estado) {
  return estado === "passed" || estado === "quemada";
}

/** Cómo se llama esa fecha según cómo terminó la cuenta. */
export const ETIQUETA_CIERRE: Record<"passed" | "quemada", string> = {
  passed: "¿Qué día la pasaste?",
  quemada: "¿Qué día se quemó?",
};

/** Etiquetas en plural, para los filtros. */
export const ESTADO_PLURAL: Record<Estado, string> = {
  activa: "Activas",
  en_curso: "En curso",
  passed: "Pasadas",
  quemada: "Quemadas",
  archivada: "Archivadas",
};

/** Estado al que vuelve una cuenta cuando se desarchiva. */
export function estadoAlDesarchivar(tipo: Tipo): Estado {
  return tipo === "fondeada" ? "activa" : "en_curso";
}

export const ESTADO_INFO: Record<Estado, Chip> = {
  activa: {
    label: "Activa",
    chip: "border-neutral-700 bg-neutral-800/60 text-neutral-300",
    punto: "bg-neutral-400",
  },
  en_curso: {
    label: "En curso",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    punto: "bg-sky-400",
  },
  passed: {
    label: "Pasada",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    punto: "bg-emerald-400",
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

/* ---------- Salud: se calcula sola con el balance ---------- */

export const SALUDES = ["saludable", "precaucion", "critico"] as const;
export type Salud = (typeof SALUDES)[number];

type Chip = { label: string; chip: string; punto: string };

export const SALUD_INFO: Record<Salud, Chip> = {
  saludable: {
    label: "Saludable",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    punto: "bg-emerald-400",
  },
  precaucion: {
    label: "Precaución",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    punto: "bg-amber-400",
  },
  critico: {
    label: "Crítico",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    punto: "bg-rose-400",
  },
};

/** Umbrales por defecto, en % del tamaño de cuenta. */
export const UMBRAL_SALUDABLE_DEFAULT = 3;
export const UMBRAL_PRECAUCION_DEFAULT = 2;

/* ---------- Modo de drawdown ---------- */

/**
 * Cómo se mueve el piso de la cuenta. Aplica a los dos tipos de cuenta
 * (antes era `tipo_drawdown` y solo existía en las evaluaciones).
 *
 * Ojo con el malentendido fácil: **EOD también trailea**. La diferencia
 * con `trailing` no es que uno se mueva y el otro no, sino qué pico sigue:
 * el cierre del día o el flotante intradía.
 */
export const MODOS_DRAWDOWN = ["estatico", "eod", "trailing"] as const;
export type ModoDrawdown = (typeof MODOS_DRAWDOWN)[number];

export const MODO_DRAWDOWN_INFO: Record<
  ModoDrawdown,
  { label: string; corto: string; ayuda: string }
> = {
  estatico: {
    label: "Estático (piso fijo)",
    corto: "Estático",
    ayuda: "El piso no se mueve nunca: tamaño de cuenta menos el drawdown.",
  },
  eod: {
    label: "EOD (sigue el cierre del día)",
    corto: "EOD",
    ayuda:
      "El piso sube con el balance más alto al cierre del día, y no vuelve a bajar.",
  },
  trailing: {
    label: "Trailing (sigue el flotante intradía)",
    corto: "Trailing",
    ayuda:
      "El piso sube con el punto más alto que tocaste dentro del día, aunque después cierres más abajo.",
  },
};

/**
 * Modo de una cuenta nueva. Se elige trailing y no estático a propósito:
 * una cuenta trailing marcada como estática muestra MÁS colchón del real
 * y te podés quemar creyendo que estabas bien; al revés el error es
 * pesimista y se nota enseguida.
 */
export const MODO_DRAWDOWN_DEFAULT: ModoDrawdown = "trailing";

/**
 * Si el piso persigue al balance. Los dos modos que no son estáticos lo
 * hacen; solo cambia qué pico miran.
 */
export function trailea(modo: ModoDrawdown) {
  return modo !== "estatico";
}

/* ---------- La cuenta ---------- */

export type Cuenta = {
  id: string;
  tipo: Tipo;
  nombre: string;
  firm: string;
  tamano_cuenta: number;
  fecha_inicio: string;
  drawdown_maximo_pct: number | null;
  drawdown_maximo_monto: number | null;
  profit_split: number | null;
  /** Cuánto querés retirar. Ej: 500 */
  objetivo_retiro: number | null;
  /** Qué balance tiene que marcar la cuenta para poder retirarlo. Ej: 2600 */
  balance_objetivo: number | null;
  /** Solo evaluaciones: cuánto hay que ganar para pasarla. */
  profit_target_pct: number | null;
  profit_target_monto: number | null;
  umbral_saludable_pct: number;
  umbral_saludable_monto: number | null;
  umbral_precaucion_pct: number;
  umbral_precaucion_monto: number | null;
  /** Cómo se mueve el piso: estático, EOD o trailing. */
  modo_drawdown: ModoDrawdown;
  /**
   * Piso final donde el trailing se traba. En Apex, `tamaño + 100`
   * (50.100 en una cuenta de 50k). null = no se congela nunca.
   */
  piso_congelado: number | null;
  /**
   * Balance más alto que alcanzó la cuenta. Hoy se actualiza cada vez que
   * sube el balance; con el Paso 5b pasa a ser solo la semilla (el pico
   * previo a usar la app) y el resto se deriva de los resultados diarios.
   */
  pico_semilla: number;
  /** Solo evaluaciones: las reglas y el costo de la evaluación. */
  regla_consistencia: number | null;
  precio: number | null;
  cantidad_contratos: number | null;
  /** Lo ya retirado antes de empezar a usar la app. */
  retiros_previos: number;
  /** Lo que costó activar la cuenta. null = no tuvo fee. */
  fee_activacion: number | null;
  estado: Estado;
  /** Día en que pasó o se quemó. null mientras sigue en juego. */
  fecha_cierre: string | null;
  balance_actual: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

/** Un retiro cobrado (fila de la tabla `payouts`). */
export type Retiro = {
  id: string;
  cuenta_id: string;
  monto: number;
  fecha: string;
  notas: string | null;
};

/**
 * Total retirado de una cuenta: el arrastre inicial más todos los retiros
 * cargados en la app.
 */
export function totalRetirado(cuenta: Cuenta, retiros: Retiro[]) {
  return retiros.reduce((a, r) => a + r.monto, cuenta.retiros_previos);
}

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

/* ---------- Conversión % <-> $ (drawdown y umbrales) ---------- */

export function montoDesdePct(tamano: number, pct: number) {
  return (tamano * pct) / 100;
}

export function pctDesdeMonto(tamano: number, monto: number) {
  if (!tamano) return 0;
  return (monto / tamano) * 100;
}

/**
 * El drawdown estático se puede pensar de las dos formas: "me puedo comer
 * 2.500" o "no puedo bajar de 47.500". Son el mismo dato.
 */
export function pisoDesdeMonto(tamano: number, monto: number) {
  return tamano - monto;
}

export function montoDesdePiso(tamano: number, piso: number) {
  return tamano - piso;
}

/* ---------- Cálculos de la cuenta ---------- */

/** Ganancia (o pérdida) acumulada desde el balance base. */
export function variacion(cuenta: Cuenta) {
  const monto = cuenta.balance_actual - cuenta.tamano_cuenta;
  const pct = cuenta.tamano_cuenta ? (monto / cuenta.tamano_cuenta) * 100 : 0;
  return { monto, pct };
}

/**
 * Balance más alto que tocó la cuenta.
 *
 * Se toma el máximo entre lo guardado, el balance de hoy y el tamaño de
 * cuenta: así el pico nunca baja, que es justo lo que hace que un retiro
 * no le mueva el piso a la cuenta.
 */
export function picoDeCuenta(cuenta: Cuenta): number {
  return Math.max(
    cuenta.pico_semilla ?? 0,
    cuenta.balance_actual,
    cuenta.tamano_cuenta
  );
}

/**
 * Piso de la cuenta: hasta dónde puede caer antes de quemarse.
 *
 *   piso = min(pico − drawdown, piso_congelado ?? ∞)
 *
 * En estático el pico no juega y el piso sale del tamaño de cuenta. En EOD
 * y en trailing el piso persigue al pico, hasta trabarse en el piso
 * congelado si la firm lo tiene (Apex: tamaño + 100).
 */
export function pisoDrawdown(cuenta: Cuenta): number | null {
  if (cuenta.drawdown_maximo_monto === null) return null;

  if (!trailea(cuenta.modo_drawdown)) {
    return cuenta.tamano_cuenta - cuenta.drawdown_maximo_monto;
  }

  const piso = picoDeCuenta(cuenta) - cuenta.drawdown_maximo_monto;

  return cuenta.piso_congelado === null
    ? piso
    : Math.min(piso, cuenta.piso_congelado);
}

/** Si el trailing ya llegó a su tope y el piso quedó fijo para siempre. */
export function estaCongelado(cuenta: Cuenta) {
  if (!trailea(cuenta.modo_drawdown)) return false;
  if (cuenta.piso_congelado === null) return false;
  if (cuenta.drawdown_maximo_monto === null) return false;

  return (
    picoDeCuenta(cuenta) - cuenta.drawdown_maximo_monto >= cuenta.piso_congelado
  );
}

/**
 * Qué balance hay que tocar para que el trailing se congele. En una Apex
 * de 50k con 2.000 de DD y piso congelado en 50.100, son 52.100.
 */
export function balanceDeCongelamiento(cuenta: Cuenta): number | null {
  if (!trailea(cuenta.modo_drawdown)) return null;
  if (cuenta.piso_congelado === null) return null;
  if (cuenta.drawdown_maximo_monto === null) return null;

  return cuenta.piso_congelado + cuenta.drawdown_maximo_monto;
}

/**
 * Colchón: cuánta plata te queda antes de tocar el drawdown máximo,
 * en $ y en % del tamaño de cuenta.
 */
export function colchon(cuenta: Cuenta): { monto: number; pct: number } | null {
  const piso = pisoDrawdown(cuenta);
  if (piso === null) return null;
  const monto = cuenta.balance_actual - piso;
  return {
    monto,
    pct: cuenta.tamano_cuenta ? (monto / cuenta.tamano_cuenta) * 100 : 0,
  };
}

/**
 * Semáforo de salud, calculado con el colchón que queda hasta el drawdown.
 * Sin drawdown cargado no se puede saber: devuelve null.
 */
export function salud(cuenta: Cuenta): Salud | null {
  const c = colchon(cuenta);
  if (c === null) return null;
  if (c.pct >= cuenta.umbral_saludable_pct) return "saludable";
  if (c.pct >= cuenta.umbral_precaucion_pct) return "precaucion";
  return "critico";
}

/** El umbral de precaución en $, venga cargado en $ o en %. */
export function umbralPrecaucionMonto(cuenta: Cuenta) {
  return (
    cuenta.umbral_precaucion_monto ??
    montoDesdePct(cuenta.tamano_cuenta, cuenta.umbral_precaucion_pct)
  );
}

/**
 * Cuánto se puede retirar sin quedar en Crítico.
 *
 * En Apex el retiro **resta del balance pero no mueve el piso**: una vez
 * congelado el drawdown, cada dólar que sacás es un dólar menos de colchón.
 *
 * Hoy no se muestra en ningún lado: se sacó de la tarjeta el 2026-08-17
 * porque ensuciaba. Queda acá como candidata a las alertas del Paso 7.
 */
export function retiroMaximoSeguro(cuenta: Cuenta): number | null {
  const piso = pisoDrawdown(cuenta);
  if (piso === null) return null;

  return Math.max(0, cuenta.balance_actual - piso - umbralPrecaucionMonto(cuenta));
}

/**
 * Qué mostrar en la tarjeta.
 * Si la cuenta está activa / en curso, manda el semáforo de salud;
 * si está passed, quemada o archivada, manda el estado elegido a mano.
 */
export function chipDeCuenta(cuenta: Cuenta): Chip {
  if (!enJuego(cuenta.estado)) return ESTADO_INFO[cuenta.estado];

  if (cuenta.tipo === "fondeada") {
    const s = salud(cuenta);
    return s ? SALUD_INFO[s] : ESTADO_INFO.activa;
  }

  return ESTADO_INFO.en_curso;
}

/**
 * El anillo de la tarjeta.
 *
 * En una cuenta fondeada mide el camino hasta el balance que te habilita
 * a retirar; en una evaluación, hasta el profit target que la aprueba.
 * En los dos casos se mide desde el balance base.
 *
 * Devuelve null si falta el dato con el que se calcula.
 */
export function anillo(cuenta: Cuenta): {
  pct: number;
  etiqueta: string;
  meta: number | null;
  falta: number;
} | null {
  const meta = tieneRetiro(cuenta.tipo)
    ? cuenta.balance_objetivo
    : cuenta.profit_target_monto === null
      ? null
      : cuenta.tamano_cuenta + cuenta.profit_target_monto;

  const etiqueta = tieneRetiro(cuenta.tipo) ? "al retiro" : "al target";

  // Una evaluación marcada como pasada ya cumplió el objetivo: el anillo
  // va al 100% aunque el balance cargado todavía no llegue (o aunque ni
  // siquiera haya profit target cargado).
  if (cuenta.estado === "passed") {
    return { pct: 100, etiqueta, meta, falta: 0 };
  }

  if (meta === null || meta <= cuenta.tamano_cuenta) return null;

  const recorrido = cuenta.balance_actual - cuenta.tamano_cuenta;
  const total = meta - cuenta.tamano_cuenta;

  return {
    pct: Math.max(0, Math.min(100, (recorrido / total) * 100)),
    etiqueta,
    meta,
    falta: Math.max(0, meta - cuenta.balance_actual),
  };
}

/**
 * Prefijo con el que se numeran las cuentas nuevas de cada tipo:
 * las fondeadas van PA1, PA2… y las evaluaciones Evaluación 1, 2…
 */
export const PREFIJO_NOMBRE: Record<Tipo, string> = {
  fondeada: "PA",
  challenge: "Evaluación",
};

/* ---------- Orden de la lista ---------- */

export const ORDENES = ["nuevas", "antiguas"] as const;
export type Orden = (typeof ORDENES)[number];

export const ORDEN_INFO: Record<Orden, string> = {
  nuevas: "Más nuevas primero",
  antiguas: "Más antiguas primero",
};

/**
 * Ordena por fecha de inicio, y desempata por orden de carga.
 *
 * Ojo con los packs: las cuentas creadas de un saque comparten el mismo
 * `created_at` (Postgres le pone a toda la tanda la hora de la
 * transacción), así que ahí no alcanza y hace falta un tercer criterio.
 * Se usa el nombre, comparado como número cuando termina en número
 * (Evaluación 9 antes que Evaluación 10) y en la misma dirección que el
 * orden elegido, para que el pack no quede al revés que el resto.
 */
export function ordenarCuentas<
  T extends { fecha_inicio: string; created_at: string; nombre: string },
>(cuentas: T[], orden: Orden): T[] {
  const signo = orden === "nuevas" ? -1 : 1;

  return [...cuentas].sort((a, b) => {
    if (a.fecha_inicio !== b.fecha_inicio) {
      return a.fecha_inicio < b.fecha_inicio ? -signo : signo;
    }
    if (a.created_at !== b.created_at) {
      return a.created_at < b.created_at ? -signo : signo;
    }
    return signo * a.nombre.localeCompare(b.nombre, "es", { numeric: true });
  });
}

/**
 * Cómo nombrar un conjunto de cuentas en el pie de la lista.
 * Si son todas del mismo tipo se las llama por su nombre ("3 evaluaciones",
 * "2 fondeadas"); si están mezcladas, el genérico "5 cuentas".
 */
export function etiquetaCantidad(cuentas: { tipo: Tipo }[]) {
  const n = cuentas.length;
  const tipos = new Set(cuentas.map((c) => c.tipo));
  const unico = tipos.size === 1 ? [...tipos][0] : null;

  // Fondeada y Evaluación son los nombres de los tipos (igual que en
  // TIPO_INFO), por eso van con mayúscula; "cuentas" es genérico y no.
  if (unico === "fondeada") return `${n} Fondeada${n === 1 ? "" : "s"}`;
  if (unico === "challenge") {
    return n === 1 ? "1 Evaluación" : `${n} Evaluaciones`;
  }
  return `${n} cuenta${n === 1 ? "" : "s"}`;
}

/**
 * Balance que le corresponde a una evaluación recién pasada: el balance
 * base más el profit target, que es justo lo que hay que ganar para
 * aprobarla.
 *
 * Devuelve null si no aplica (no es evaluación, no hay target cargado) o
 * si el balance ya está por encima: si la pasaste con más ganancia que el
 * target, ese número real vale más que el teórico y no se pisa.
 */
export function balanceAlPasar(cuenta: {
  tipo: Tipo;
  tamano_cuenta: number;
  balance_actual: number;
  profit_target_monto: number | null;
}): number | null {
  if (tieneRetiro(cuenta.tipo)) return null;
  if (cuenta.profit_target_monto === null) return null;

  const objetivo = cuenta.tamano_cuenta + cuenta.profit_target_monto;
  return objetivo > cuenta.balance_actual ? objetivo : null;
}

/**
 * Sugiere el próximo nombre libre de la serie del tipo de cuenta:
 * PA1, PA2… en fondeadas; Evaluación 1, Evaluación 2… en evaluaciones.
 *
 * Cada tipo lleva su propia numeración, así que tener PA3 no empuja la
 * serie de las evaluaciones.
 */
export function sugerirNombre(cuentas: { nombre: string }[], tipo: Tipo) {
  const prefijo = PREFIJO_NOMBRE[tipo];
  // Acepta "PA3", "PA 3", "Evaluación 3" — con o sin espacio de por medio.
  const patron = new RegExp(`^${prefijo}\\s?(\\d+)$`, "i");

  const usados = cuentas
    .map((c) => patron.exec(c.nombre.trim()))
    .filter(Boolean)
    .map((m) => Number(m![1]));

  const proximo = usados.length ? Math.max(...usados) + 1 : 1;
  // "PA1" va pegado; "Evaluación 1" con espacio, que se lee mejor.
  const separador = prefijo === "PA" ? "" : " ";
  return `${prefijo}${separador}${proximo}`;
}

/* ---------- Alta en lote (packs de cuentas) ---------- */

/**
 * Tope de cuentas que se pueden crear de una vez. Es para evitar un error
 * de tipeo que cargue 500 cuentas, no una limitación real del negocio.
 */
export const CANTIDAD_MAXIMA_LOTE = 20;

/**
 * Nombres para un alta en lote (ej. el pack de 5 evaluaciones de Apex).
 *
 * A partir del nombre que escribió el usuario devuelve `cantidad` nombres
 * libres, numerados de forma correlativa y sin pisar los que ya existen:
 *
 *   "PA3" + 3 cuentas  →  PA3, PA4, PA5
 *   "Apex" + 2 cuentas →  Apex, Apex 2
 *
 * Si el nombre base ya está usado, arranca directamente por el siguiente
 * libre. La comparación no distingue mayúsculas.
 */
export function nombresParaLote(
  base: string,
  cantidad: number,
  usados: string[]
): string[] {
  const total = Math.max(1, Math.min(Math.round(cantidad), CANTIDAD_MAXIMA_LOTE));
  const ocupados = new Set(usados.map((u) => u.trim().toLowerCase()));
  const limpio = base.trim();
  const nombres: string[] = [];

  const libre = (n: string) => !ocupados.has(n.toLowerCase());
  const tomar = (n: string) => {
    nombres.push(n);
    ocupados.add(n.toLowerCase());
  };

  // "PA3" se parte en prefijo "PA" + número 3; "Apex" no tiene número, así
  // que la serie sigue por "Apex 2".
  const m = /^(.*?)(\d+)$/.exec(limpio);
  const prefijo = m ? m[1] : `${limpio} `;
  let numero = m ? Number(m[2]) : 2;

  if (libre(limpio)) {
    tomar(limpio);
    if (m) numero += 1;
  }

  while (nombres.length < total) {
    const candidato = `${prefijo}${numero}`;
    if (libre(candidato)) tomar(candidato);
    numero += 1;
  }

  return nombres;
}
