"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarCuenta, type EstadoForm } from "@/app/(app)/cuentas/actions";
import {
  CANTIDAD_MAXIMA_LOTE,
  esCierre,
  fechaCorta,
  ESTADOS_POR_TIPO,
  ESTADO_INFO,
  FIRMS_FOREX,
  FIRMS_FUTUROS,
  MODOS_DRAWDOWN,
  MODO_DRAWDOWN_DEFAULT,
  MODO_DRAWDOWN_INFO,
  TIPOS,
  TIPO_INFO,
  UMBRAL_PRECAUCION_DEFAULT,
  UMBRAL_SALUDABLE_DEFAULT,
  montoDesdePct,
  montoDesdePiso,
  pctDesdeMonto,
  pisoDesdeMonto,
  plata,
  tieneRetiro,
  trailea,
  type Cuenta,
  type Estado,
  type ModoDrawdown,
  type Tipo,
} from "@/lib/cuentas";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600";

/** Aviso para los campos que no se pueden calcular sin el tamaño de cuenta. */
function FaltaTamano() {
  return (
    <p className="-mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-500/90">
      Cargá primero el <strong>tamaño de cuenta</strong>: estos valores se
      calculan sobre él.
    </p>
  );
}

function Campo({
  label,
  ayuda,
  children,
}: {
  label: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-neutral-300">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-neutral-500">{ayuda}</span>}
    </label>
  );
}

/**
 * Elegir la firm de un menú con submenús, como los filtros del Funding
 * Manager. Son más de cincuenta: mostradas todas juntas es una lista
 * imposible, y separadas en Futuros y Forex se encuentra la que buscás sin
 * leer todo.
 *
 * Sigue habiendo forma de escribir una que no esté en la lista: el rubro
 * abre firms nuevas todo el tiempo y no queremos que la app le diga a
 * alguien que su firm no existe.
 */
function SelectorFirm({
  valor,
  onElegir,
}: {
  valor: string;
  /** El grupo viene solo cuando se eligió de una lista, no al escribirla. */
  onElegir: (v: string, grupo?: "futuros" | "forex") => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [submenu, setSubmenu] = useState<null | "futuros" | "forex">(null);
  const [busqueda, setBusqueda] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cada submenú arranca con el buscador limpio: lo que escribiste para
  // encontrar una firm de futuros no tiene por qué filtrar las de forex.
  function abrirSubmenu(clave: null | "futuros" | "forex") {
    setSubmenu(clave);
    setBusqueda("");
  }

  useEffect(() => {
    if (!abierto) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        abrirSubmenu(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [abierto]);

  const item =
    "block w-full px-3 py-1.5 text-left text-sm text-neutral-300 transition hover:bg-neutral-800";

  function elegir(v: string, grupo: "futuros" | "forex") {
    onElegir(v, grupo);
    setEscribiendo(false);
    setAbierto(false);
    abrirSubmenu(null);
  }

  const grupo = (
    clave: "futuros" | "forex",
    label: string,
    lista: readonly string[]
  ) => {
    const filtradas = lista.filter((f) =>
      f.toLowerCase().includes(busqueda.trim().toLowerCase())
    );

    return (
      // El submenú NO se cierra al salir con el mouse: con un buscador
      // adentro, cerrarse mientras escribís sería insoportable. Se cierra al
      // elegir, al abrir el otro grupo, o al hacer clic afuera.
      <div className="relative" onMouseEnter={() => abrirSubmenu(clave)}>
        <button
          type="button"
          className={`${item} flex items-center justify-between`}
          onClick={() => abrirSubmenu(clave)}
        >
          {label}
          <span className="text-neutral-600">›</span>
        </button>

        {submenu === clave && (
          <div className="absolute left-full top-0 z-40 ml-1 w-60 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
            <div className="px-2 pb-1">
              <input
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar…"
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filtradas.length === 0 ? (
                <p className="px-3 py-2 text-xs text-neutral-600">
                  Ninguna coincide. Podés cargarla con “Otra”.
                </p>
              ) : (
                filtradas.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={item}
                    onClick={() => elegir(f, clave)}
                  >
                    {f}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      {escribiendo ? (
        <input
          autoFocus
          value={valor}
          onChange={(e) => onElegir(e.target.value)}
          onBlur={() => valor.trim() !== "" && setEscribiendo(false)}
          placeholder="Nombre de la firm"
          className={INPUT}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className={`${INPUT} flex items-center justify-between text-left`}
        >
          <span className={valor ? "" : "text-neutral-600"}>
            {valor || "Elegí la firm"}
          </span>
          <span className="text-neutral-600">▾</span>
        </button>
      )}

      {abierto && !escribiendo && (
        <div className="absolute left-0 z-30 mt-1 w-56 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          {grupo("futuros", "Futuros", FIRMS_FUTUROS)}
          {grupo("forex", "Forex / CFD", FIRMS_FOREX)}

          <div className="my-1 border-t border-neutral-800" />
          <button
            type="button"
            className={item}
            onClick={() => {
              setEscribiendo(true);
              setAbierto(false);
              abrirSubmenu(null);
            }}
          >
            Otra (escribirla)…
          </button>
        </div>
      )}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-neutral-800 pt-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
      {children}
    </p>
  );
}

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Guardando…" : texto}
    </button>
  );
}

function redondear(n: number) {
  return Math.round(n * 100) / 100;
}

function aNumero(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Un par de campos %/$ que se completan solos entre sí, usando el tamaño
 * de cuenta como referencia. Lo usan el drawdown y los dos umbrales.
 */
function useParPctMonto(pctInicial: string, montoInicial: string) {
  const [pct, setPct] = useState(pctInicial);
  const [monto, setMonto] = useState(montoInicial);

  function desdePct(v: string, tamano: number) {
    setPct(v);
    if (v === "") return setMonto("");
    const p = aNumero(v);
    if (tamano > 0 && !Number.isNaN(p)) {
      setMonto(String(redondear(montoDesdePct(tamano, p))));
    }
  }

  function desdeMonto(v: string, tamano: number) {
    setMonto(v);
    if (v === "") return setPct("");
    const m = aNumero(v);
    if (tamano > 0 && !Number.isNaN(m)) {
      setPct(String(redondear(pctDesdeMonto(tamano, m))));
    }
  }

  /** Cuando cambia el tamaño de cuenta, el % manda y el $ se recalcula. */
  function recalcular(tamano: number) {
    if (pct === "") return;
    const p = aNumero(pct);
    if (tamano > 0 && !Number.isNaN(p)) {
      setMonto(String(redondear(montoDesdePct(tamano, p))));
    }
  }

  return { pct, monto, desdePct, desdeMonto, recalcular };
}

function texto(n: number | null | undefined) {
  return n === null || n === undefined ? "" : String(n);
}

export function ModalCuenta({
  cuenta,
  duplicar = false,
  nombreSugerido,
  onCerrar,
}: {
  cuenta?: Cuenta;
  /**
   * Duplicar usa los datos de `cuenta` como plantilla, pero crea filas
   * nuevas: no se manda el id, así que la action inserta en vez de editar.
   */
  duplicar?: boolean;
  /** Nombre propuesto para cada tipo: PA3 / Evaluación 2. */
  nombreSugerido: Record<Tipo, string>;
  onCerrar: () => void;
}) {
  const [estadoForm, formAction] = useFormState<EstadoForm, FormData>(
    guardarCuenta,
    {}
  );

  // Solo es edición cuando hay cuenta y no se está duplicando.
  const esEdicion = !!cuenta && !duplicar;
  // Cargar varias iguales de una sola vez tiene sentido al crear, no al editar.
  const [cantidad, setCantidad] = useState("1");
  const cantidadNum = Math.min(Number(cantidad) || 1, CANTIDAD_MAXIMA_LOTE);

  const [tipo, setTipo] = useState<Tipo>(cuenta?.tipo ?? "fondeada");

  // El nombre es controlado para poder cambiarlo solo al cambiar de tipo
  // (PA3 ↔ Evaluación 2), pero sin pisar lo que el usuario haya escrito.
  const [nombre, setNombre] = useState(
    esEdicion ? cuenta!.nombre : nombreSugerido[cuenta?.tipo ?? "fondeada"]
  );

  function cambiarTipo(nuevo: Tipo) {
    if (!esEdicion && nombre.trim() === nombreSugerido[tipo].trim()) {
      setNombre(nombreSugerido[nuevo]);
    }
    setTipo(nuevo);
  }
  const [firm, setFirm] = useState(cuenta?.firm ?? "");

  /**
   * Elegir la firm propone el modo de drawdown que usa ese mercado: las de
   * futuros trailean, las de forex casi siempre tienen piso fijo. Es una
   * sugerencia, no una regla — el desplegable de abajo se puede cambiar, y
   * hay firms que no siguen la costumbre de su mercado.
   *
   * Solo se aplica al elegir de la lista. Si escribís la firm a mano no se
   * toca nada: no sabemos de qué mercado es.
   */
  function elegirFirm(v: string, grupo?: "futuros" | "forex") {
    setFirm(v);
    if (grupo === "futuros") setModo("trailing");
    if (grupo === "forex") setModo("estatico");
  }
  const [tamano, setTamano] = useState(texto(cuenta?.tamano_cuenta));
  // Controlada porque es el mínimo posible para la fecha de cierre.
  const [fechaInicio, setFechaInicio] = useState(
    cuenta?.fecha_inicio ?? new Date().toISOString().slice(0, 10)
  );
  const tamanoNum = aNumero(tamano) || 0;

  // Drawdown y umbrales se calculan sobre el tamaño de cuenta: sin ese
  // número no hay nada que calcular, así que se bloquean.
  const sinTamano = tamanoNum <= 0;
  const esFondeada = tieneRetiro(tipo);
  // Si la cuenta ya existía sin fee, arranca en "no tuvo".
  const [conFee, setConFee] = useState(
    cuenta ? cuenta.fee_activacion !== null : true
  );

  const dd = useParPctMonto(
    texto(cuenta?.drawdown_maximo_pct),
    texto(cuenta?.drawdown_maximo_monto)
  );

  // Drawdown: cómo se mueve el piso, dónde se traba, y desde qué pico.
  const [modo, setModo] = useState<ModoDrawdown>(
    cuenta?.modo_drawdown ?? MODO_DRAWDOWN_DEFAULT
  );
  const [pisoCongelado, setPisoCongelado] = useState(
    texto(cuenta?.piso_congelado)
  );
  const [pico, setPico] = useState(texto(cuenta?.pico_semilla));
  // Controlado (antes no lo era) para poder mostrar el piso calculado en
  // vivo: sin el balance no se sabe de qué pico venimos.
  const [balance, setBalance] = useState(texto(cuenta?.balance_actual));
  const saludable = useParPctMonto(
    texto(cuenta?.umbral_saludable_pct ?? UMBRAL_SALUDABLE_DEFAULT),
    texto(cuenta?.umbral_saludable_monto)
  );
  const target = useParPctMonto(
    texto(cuenta?.profit_target_pct),
    texto(cuenta?.profit_target_monto)
  );
  const precaucion = useParPctMonto(
    texto(cuenta?.umbral_precaucion_pct ?? UMBRAL_PRECAUCION_DEFAULT),
    texto(cuenta?.umbral_precaucion_monto)
  );

  function cambiarTamano(v: string) {
    setTamano(v);
    const t = aNumero(v) || 0;
    dd.recalcular(t);
    target.recalcular(t);
    saludable.recalcular(t);
    precaucion.recalcular(t);
  }

  // Archivar/desarchivar se hace desde el menú ⋯, pero si la cuenta ya
  // está archivada hay que poder mostrarlo acá sin cambiárselo de prepo.
  // Al duplicar, la copia nace en el estado normal del tipo: no tiene
  // sentido crear una cuenta nueva ya archivada.
  const estadosPosibles: Estado[] =
    esEdicion && cuenta!.estado === "archivada"
      ? [...ESTADOS_POR_TIPO[tipo], "archivada"]
      : ESTADOS_POR_TIPO[tipo];

  const estadoActual =
    cuenta && estadosPosibles.includes(cuenta.estado)
      ? cuenta.estado
      : estadosPosibles[0];

  // Controlado para poder mostrar la fecha de cierre al elegir
  // Pasada / Quemada. Se resetea si cambia el tipo, porque cada tipo tiene
  // su propia lista de estados.
  const [estado, setEstado] = useState<Estado>(estadoActual);

  useEffect(() => {
    if (!estadosPosibles.includes(estado)) setEstado(estadosPosibles[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  /* ----- Drawdown: piso calculado en vivo ----- */

  const ddMonto = dd.monto === "" ? null : aNumero(dd.monto);
  const balanceNum = balance === "" ? tamanoNum : aNumero(balance) || 0;
  const picoNum = Math.max(aNumero(pico) || 0, balanceNum, tamanoNum);
  const congeladoNum = pisoCongelado === "" ? null : aNumero(pisoCongelado);

  // El piso estático se muestra como balance ("no puede bajar de X"), que
  // es el mismo dato que el drawdown en $, visto al revés.
  const pisoEstatico =
    dd.monto === "" || ddMonto === null || Number.isNaN(ddMonto) || sinTamano
      ? ""
      : String(redondear(pisoDesdeMonto(tamanoNum, ddMonto)));

  function cambiarPisoEstatico(v: string) {
    if (v === "") return dd.desdeMonto("", tamanoNum);
    const n = aNumero(v);
    if (Number.isNaN(n)) return;
    dd.desdeMonto(String(redondear(montoDesdePiso(tamanoNum, n))), tamanoNum);
  }

  const pisoActual =
    ddMonto === null || Number.isNaN(ddMonto) || sinTamano
      ? null
      : !trailea(modo)
        ? tamanoNum - ddMonto
        : congeladoNum === null || Number.isNaN(congeladoNum)
          ? picoNum - ddMonto
          : Math.min(picoNum - ddMonto, congeladoNum);

  const congelamiento =
    !trailea(modo) ||
    congeladoNum === null ||
    Number.isNaN(congeladoNum) ||
    ddMonto === null ||
    Number.isNaN(ddMonto)
      ? null
      : congeladoNum + ddMonto;

  const congelada =
    congelamiento !== null && picoNum >= congelamiento;

  // Cerrar al guardar bien, y con la tecla Escape.
  useEffect(() => {
    if (estadoForm.ok) onCerrar();
  }, [estadoForm.ok, onCerrar]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {esEdicion
              ? `Editar ${cuenta!.nombre}`
              : duplicar
                ? `Duplicar ${cuenta!.nombre}`
                : "Nueva cuenta"}
          </h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg border border-neutral-700 px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {esEdicion && <input type="hidden" name="id" value={cuenta!.id} />}
          <input type="hidden" name="tipo" value={tipo} />

          {/* Tipo de cuenta */}
          <div className="flex gap-2">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => cambiarTipo(t)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm transition ${
                  tipo === t
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {TIPO_INFO[t].label}
              </button>
            ))}
          </div>

          {/* Alta en lote: los packs de cuentas (ej. 5 de Apex) se cargan
              una sola vez y la app crea las copias numeradas. */}
          {!esEdicion && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <p className="mb-2 text-sm text-neutral-300">
                ¿Cuántas cuentas iguales?
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {["1", "2", "3", "5", "10"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCantidad(n)}
                    className={`h-9 w-10 rounded-lg border text-sm transition ${
                      cantidad === n
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  name="cantidad"
                  inputMode="numeric"
                  aria-label="Cantidad de cuentas"
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className={`${INPUT} h-9 w-20`}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {cantidadNum > 1
                  ? `Se crean ${cantidadNum} cuentas idénticas, numeradas a partir del nombre de abajo. Después las editás por separado.`
                  : `Poné más de 1 si compraste un pack. Máximo ${CANTIDAD_MAXIMA_LOTE}.`}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label={cantidadNum > 1 ? "Nombre base" : "Nombre"}
              ayuda={
                cantidadNum > 1
                  ? "Las demás siguen la numeración desde acá"
                  : undefined
              }
            >
              <input
                name="nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Firm">
              <input type="hidden" name="firm" value={firm} />
              <SelectorFirm valor={firm} onElegir={elegirFirm} />
            </Campo>

            <Campo label="Tamaño de cuenta (USD)">
              <input
                name="tamano_cuenta"
                required
                inputMode="decimal"
                placeholder="50000"
                value={tamano}
                onChange={(e) => cambiarTamano(e.target.value)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Fecha de inicio">
              <input
                name="fecha_inicio"
                type="date"
                required
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={INPUT}
              />
            </Campo>

            {esFondeada && (
              <Campo label="Profit split (%)">
                <input
                  name="profit_split"
                  inputMode="decimal"
                  placeholder="90"
                  defaultValue={texto(cuenta?.profit_split)}
                  className={INPUT}
                />
              </Campo>
            )}

            <Campo
              label="Regla de consistencia (%)"
              ayuda="Máximo que puede representar un solo día"
            >
              <input
                name="regla_consistencia"
                inputMode="decimal"
                placeholder="30"
                defaultValue={texto(cuenta?.regla_consistencia)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Balance actual (USD)" ayuda="Lo actualizás vos cuando quieras">
              <input
                name="balance_actual"
                inputMode="decimal"
                placeholder="Igual al tamaño de cuenta"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className={INPUT}
              />
            </Campo>
          </div>

          {sinTamano && <FaltaTamano />}

          {/* Drawdown: el bloque más importante de la cuenta */}
          <Titulo>Drawdown</Titulo>
          {sinTamano && <FaltaTamano />}

          <Campo label="Cómo se mueve el piso" ayuda={MODO_DRAWDOWN_INFO[modo].ayuda}>
            <select
              name="modo_drawdown"
              value={modo}
              onChange={(e) => setModo(e.target.value as ModoDrawdown)}
              className={INPUT}
            >
              {MODOS_DRAWDOWN.map((m) => (
                <option key={m} value={m}>
                  {MODO_DRAWDOWN_INFO[m].label}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Drawdown máximo (%)" ayuda="Se completa solo con el monto">
              <input
                name="drawdown_maximo_pct"
                inputMode="decimal"
                disabled={sinTamano}
                placeholder="5"
                value={dd.pct}
                onChange={(e) => dd.desdePct(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Drawdown máximo (USD)" ayuda="Se completa solo con el %">
              <input
                name="drawdown_maximo_monto"
                inputMode="decimal"
                disabled={sinTamano}
                placeholder="2500"
                value={dd.monto}
                onChange={(e) => dd.desdeMonto(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>

            {/* El tercer campo cambia de significado según el modo: en
                estático es el piso (que es fijo y se puede cargar), y en
                los modos que trailean es el piso congelado. El piso actual
                de una cuenta que trailea NO se carga a mano: se calcula. */}
            {modo === "estatico" ? (
              <Campo
                label="No puede bajar de (USD)"
                ayuda="Otra forma de decir lo mismo: tamaño de cuenta menos el drawdown"
              >
                <input
                  inputMode="decimal"
                  disabled={sinTamano}
                  placeholder="47500"
                  value={pisoEstatico}
                  onChange={(e) => cambiarPisoEstatico(e.target.value)}
                  className={INPUT}
                />
              </Campo>
            ) : (
              <>
                <Campo
                  label="Piso congelado (USD)"
                  ayuda="Dónde se traba el trailing. Vacío = no se congela nunca."
                >
                  <input
                    name="piso_congelado"
                    inputMode="decimal"
                    disabled={sinTamano}
                    placeholder="50100"
                    value={pisoCongelado}
                    onChange={(e) => setPisoCongelado(e.target.value)}
                    className={INPUT}
                  />
                  {!sinTamano && (
                    <button
                      type="button"
                      onClick={() => setPisoCongelado(String(tamanoNum + 100))}
                      className="mt-1.5 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
                    >
                      Usar el de Apex ({plata(tamanoNum + 100)})
                    </button>
                  )}
                </Campo>

                <Campo
                  label="Pico histórico (USD)"
                  ayuda="El balance más alto que tocó la cuenta. Vacío = el balance actual."
                >
                  <input
                    name="pico_semilla"
                    inputMode="decimal"
                    placeholder={tamano || "50000"}
                    value={pico}
                    onChange={(e) => setPico(e.target.value)}
                    className={INPUT}
                  />
                </Campo>
              </>
            )}
          </div>

          {/* El piso calculado, en vivo: es el número del que después
              cuelgan el colchón y el semáforo. */}
          {pisoActual !== null && (
            <p className="-mt-1 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs text-neutral-400">
              Hoy la cuenta se quema si baja de{" "}
              <span className="font-medium text-neutral-200">
                {plata(pisoActual)}
              </span>
              {modo !== "estatico" &&
                (congelada ? (
                  <span className="text-emerald-400"> · ya está congelado</span>
                ) : congelamiento !== null ? (
                  <> · se congela cuando el balance toque {plata(congelamiento)}</>
                ) : null)}
            </p>
          )}

          {/* Objetivo de retiro — solo tiene sentido en cuentas fondeadas */}
          {esFondeada && (
            <>
              <Titulo>Objetivo de retiro</Titulo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Quiero retirar (USD)">
                  <input
                    name="objetivo_retiro"
                    inputMode="decimal"
                    placeholder="500"
                    defaultValue={texto(cuenta?.objetivo_retiro)}
                    className={INPUT}
                  />
                </Campo>

                <Campo
                  label="Balance necesario para retirarlo (USD)"
                  ayuda="Cambia según la firm. Ej. Apex: para sacar $500 la cuenta tiene que marcar $2.600"
                >
                  <input
                    name="balance_objetivo"
                    inputMode="decimal"
                    placeholder="2600"
                    defaultValue={texto(cuenta?.balance_objetivo)}
                    className={INPUT}
                  />
                </Campo>

                <Campo
                  label="Retiros previos (USD)"
                  ayuda="Lo que ya sacaste de esta cuenta antes de usar la app"
                >
                  <input
                    name="retiros_previos"
                    inputMode="decimal"
                    placeholder="0"
                    defaultValue={texto(cuenta?.retiros_previos)}
                    className={INPUT}
                  />
                </Campo>
              </div>
            </>
          )}

          {/* Fee de activación — solo fondeadas, y puede no haber tenido */}
          {esFondeada && (
            <>
          <Titulo>Fee de activación</Titulo>
          <div className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tiene_fee" value={conFee ? "si" : "no"} />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setConFee(true)}
                aria-label="Tuvo fee de activación"
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  conFee
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                }`}
              >
                ✓ Tuvo
              </button>
              <button
                type="button"
                onClick={() => setConFee(false)}
                aria-label="No tuvo fee de activación"
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  !conFee
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                    : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                }`}
              >
                ✕ No tuvo
              </button>
            </div>

            <div className="min-w-[12rem] flex-1">
              <input
                name="fee_activacion"
                inputMode="decimal"
                disabled={!conFee}
                placeholder={conFee ? "85" : "Sin fee de activación"}
                defaultValue={texto(cuenta?.fee_activacion)}
                className={INPUT}
              />
            </div>
          </div>
            </>
          )}

          {/* Profit target — el objetivo que aprueba la evaluación */}
          {!esFondeada && (
            <>
              <Titulo>Profit target</Titulo>
              <p className="-mt-2 text-xs text-neutral-500">
                Cuánto hay que ganar para pasar la evaluación. El anillo de la
                tarjeta mide cuánto te falta.
              </p>
              {sinTamano && <FaltaTamano />}
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Profit target (%)">
                  <input
                    name="profit_target_pct"
                    inputMode="decimal"
                    disabled={sinTamano}
                    placeholder="8"
                    value={target.pct}
                    onChange={(e) => target.desdePct(e.target.value, tamanoNum)}
                    className={INPUT}
                  />
                </Campo>
                <Campo label="Profit target (USD)">
                  <input
                    name="profit_target_monto"
                    inputMode="decimal"
                    disabled={sinTamano}
                    placeholder="4000"
                    value={target.monto}
                    onChange={(e) =>
                      target.desdeMonto(e.target.value, tamanoNum)
                    }
                    className={INPUT}
                  />
                </Campo>
              </div>
            </>
          )}

          {/* Semáforo */}
          <Titulo>Semáforo de salud</Titulo>
          <p className="-mt-2 text-xs text-neutral-500">
            Según cuánto colchón te quede hasta el drawdown máximo. El estado
            de la cuenta se pone solo con estos valores.
          </p>
          {sinTamano && <FaltaTamano />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Saludable desde (%)">
              <input
                name="umbral_saludable_pct"
                inputMode="decimal"
                disabled={sinTamano}
                value={saludable.pct}
                onChange={(e) => saludable.desdePct(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>
            <Campo label="Saludable desde (USD)">
              <input
                name="umbral_saludable_monto"
                inputMode="decimal"
                disabled={sinTamano}
                value={saludable.monto}
                onChange={(e) => saludable.desdeMonto(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>
            <Campo label="Precaución desde (%)" ayuda="Debajo de esto: Crítico">
              <input
                name="umbral_precaucion_pct"
                inputMode="decimal"
                disabled={sinTamano}
                value={precaucion.pct}
                onChange={(e) => precaucion.desdePct(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>
            <Campo label="Precaución desde (USD)">
              <input
                name="umbral_precaucion_monto"
                inputMode="decimal"
                disabled={sinTamano}
                value={precaucion.monto}
                onChange={(e) =>
                  precaucion.desdeMonto(e.target.value, tamanoNum)
                }
                className={INPUT}
              />
            </Campo>
          </div>

          {/* Reglas de la evaluación */}
          {!esFondeada && (
            <>
              <Titulo>Reglas de la evaluación</Titulo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Precio (USD)" ayuda="Lo que pagaste por la evaluación">
                  <input
                    name="precio"
                    inputMode="decimal"
                    placeholder="150"
                    defaultValue={texto(cuenta?.precio)}
                    className={INPUT}
                  />
                </Campo>

                <Campo label="Cantidad de contratos">
                  <input
                    name="cantidad_contratos"
                    inputMode="numeric"
                    placeholder="10"
                    defaultValue={texto(cuenta?.cantidad_contratos)}
                    className={INPUT}
                  />
                </Campo>
              </div>
            </>
          )}

          {/* Estado y notas */}
          <Titulo>Estado y notas</Titulo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Estado"
              ayuda={
                tipo === "fondeada"
                  ? "Crítico / Precaución / Saludable se calculan solos"
                  : undefined
              }
            >
              <select
                name="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as Estado)}
                className={INPUT}
              >
                {estadosPosibles.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_INFO[e].label}
                  </option>
                ))}
              </select>
            </Campo>

            {/* La fecha de cierre solo aplica si la cuenta ya terminó */}
            {esCierre(estado) && (
              <Campo
                label={
                  estado === "passed"
                    ? "¿Qué día la pasaste?"
                    : "¿Qué día se quemó?"
                }
                ayuda={`Se puede dejar vacío. No puede ser anterior al ${fechaCorta(fechaInicio)}.`}
              >
                <input
                  name="fecha_cierre"
                  type="date"
                  min={fechaInicio}
                  max={new Date().toISOString().slice(0, 10)}
                  defaultValue={cuenta?.fecha_cierre ?? ""}
                  className={INPUT}
                />
              </Campo>
            )}
          </div>

          <Campo label="Notas">
            <textarea
              name="notas"
              rows={3}
              defaultValue={cuenta?.notas ?? ""}
              className={INPUT}
            />
          </Campo>

          {estadoForm.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {estadoForm.error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <Guardar
              texto={cantidadNum > 1 ? `Crear ${cantidadNum} cuentas` : "Guardar"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
