"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarNota, type EstadoJournal } from "@/app/(app)/journal/actions";
import {
  eliminarResultado,
  guardarEnVariasCuentas,
  type EstadoForm,
} from "@/app/(app)/cuentas/resultados-actions";
import { enJuego, fechaCorta, plata, trailea, type Tipo } from "@/lib/cuentas";
import type { CuentaJournal, DiaJournal } from "@/lib/journal";

/**
 * El día abierto: lo que pasó arriba, lo que escribís abajo.
 *
 * Las flechas pasan de día **sin cerrar el modal**, que es el gesto que
 * hace que revisar la semana no sea abrir y cerrar diez veces. Si hay algo
 * escrito sin guardar, avisa antes de moverse: perder un párrafo por
 * apretar una flecha es la forma más rápida de que alguien no vuelva a
 * escribir nunca más.
 */

function Agregar({ cuantas }: { cuantas: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || cuantas === 0}
      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
    >
      {pending
        ? "Agregando…"
        : cuantas > 1
          ? `Agregar en ${cuantas} cuentas`
          : "Agregar"}
    </button>
  );
}

/**
 * Cargar un resultado sin salir del journal.
 *
 * Es la misma action que usa la sección Cuentas — no una copia: el alta de
 * un día toca la semilla, el máximo del día y el balance calculado, y dos
 * caminos distintos para escribir lo mismo terminan divergiendo.
 */
function AltaResultado({
  fecha,
  cuentas,
  tipo,
}: {
  fecha: string;
  cuentas: CuentaJournal[];
  tipo: Tipo;
}) {
  const [estado, accion] = useFormState<EstadoForm, FormData>(
    guardarEnVariasCuentas,
    {}
  );
  /**
   * Varias cuentas a la vez, no una.
   *
   * Replicar es la forma normal de operar con prop firms: la misma orden
   * se copia a varias cuentas y el día queda con el mismo número en todas.
   * Con un desplegable simple había que repetir la carga cuenta por
   * cuenta, que es justo donde uno se saltea una o tipea otro monto.
   */
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [monto, setMonto] = useState("");
  const [maximo, setMaximo] = useState("");

  // Cambiar de día limpia el formulario: cargar un resultado en la fecha
  // equivocada es de los errores más caros y más fáciles de cometer.
  useEffect(() => {
    setMonto("");
    setMaximo("");
    setElegidas([]);
  }, [fecha]);

  // Se limpia el monto pero **no** las cuentas elegidas: si cargás dos
  // trades del mismo día, el segundo va casi siempre en las mismas.
  useEffect(() => {
    if (estado.ok) {
      setMonto("");
      setMaximo("");
    }
  }, [estado]);

  /**
   * Solo las cuentas **en juego**.
   *
   * Con el historial completo el desplegable traía 128 cuentas, casi todas
   * quemadas: elegir ahí es peor que no tener el atajo. Para cargarle un
   * día a una cuenta cerrada está su tarjeta en Cuentas, que además es
   * donde uno va cuando quiere corregir historia vieja.
   */
  const disponibles = cuentas.filter((c) => enJuego(c.estado));

  // Alcanza con que una de las elegidas tenga drawdown que trailea: el
  // dato se guarda solo en las que lo usan.
  const pideMaximo = disponibles.some(
    (c) => elegidas.includes(c.id) && trailea(c.modo_drawdown)
  );

  function alternar(id: string) {
    setElegidas((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  // Primero las del tipo que estás mirando: nueve de cada diez veces es
  // una de esas.
  const grupos: { label: string; cuentas: CuentaJournal[] }[] = [
    {
      label: tipo === "fondeada" ? "Fondeadas" : "Evaluaciones",
      cuentas: disponibles.filter((c) => c.tipo === tipo),
    },
    {
      label: tipo === "fondeada" ? "Evaluaciones" : "Fondeadas",
      cuentas: disponibles.filter((c) => c.tipo !== tipo),
    },
  ].filter((g) => g.cuentas.length > 0);

  if (disponibles.length === 0) return null;

  return (
    <form action={accion} className="border-b border-neutral-800 p-4">
      <input type="hidden" name="fecha" value={fecha} />

      <p className="text-sm font-medium">Cargar un resultado</p>
      <p className="mt-0.5 text-xs text-neutral-500">
        Elegí una o varias cuentas. Solo aparecen las que están en juego.
      </p>

      <input type="hidden" name="cuenta_ids" value={elegidas.join(",")} />

      <div className="mt-3 space-y-2">
        {grupos.map((g) => (
          <div key={g.label} className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 shrink-0 text-xs text-neutral-500">{g.label}</span>
            {g.cuentas.map((c) => {
              const activa = elegidas.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => alternar(c.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    activa
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  {c.nombre}
                </button>
              );
            })}
            {g.cuentas.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setElegidas((v) => {
                    const ids = g.cuentas.map((c) => c.id);
                    const todas = ids.every((id) => v.includes(id));
                    return todas
                      ? v.filter((id) => !ids.includes(id))
                      : [...new Set([...v, ...ids])];
                  })
                }
                className="text-xs text-neutral-500 underline-offset-2 transition hover:text-neutral-300 hover:underline"
              >
                Todas
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="w-32">
          <span className="sr-only">Resultado en dólares</span>
          <input
            name="monto"
            inputMode="decimal"
            placeholder="USD"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
          />
        </label>

        {pideMaximo && (
          <label className="w-36">
            <span className="sr-only">Máximo del día</span>
            <input
              name="pico_dia"
              inputMode="decimal"
              placeholder="Máximo del día"
              value={maximo}
              onChange={(e) => setMaximo(e.target.value)}
              title="Cuánto llegaste a tener arriba dentro del día, desde que abrió la jornada. Vacío = se usa el cierre."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
          </label>
        )}

        <Agregar cuantas={elegidas.length} />
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        {estado.error ? (
          <span className="text-rose-400">{estado.error}</span>
        ) : estado.ok ? (
          <span className="text-emerald-400">{estado.ok}</span>
        ) : (
          elegidas.length > 1
            ? `El mismo monto se carga en las ${elegidas.length} cuentas elegidas.`
            : "Negativo si perdiste. Tocá varias cuentas para cargar el mismo monto en todas."
        )}
      </p>
    </form>
  );
}

/**
 * Una entrada del día, con su borrado.
 *
 * Si se puede cargar desde acá, se tiene que poder deshacer desde acá: un
 * monto en la cuenta equivocada obligaba a ir hasta Cuentas, buscar la
 * tarjeta y abrir otro modal para arreglar algo que se hizo en dos
 * segundos.
 */
function FilaEntrada({
  entrada,
}: {
  entrada: { id: string; cuenta: string; monto: number; notas: string | null };
}) {
  const [borrando, empezar] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="text-neutral-300">{entrada.cuenta}</span>
        {entrada.notas && (
          <span className="ml-2 text-xs text-neutral-500">{entrada.notas}</span>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span
          className={`tabular-nums ${
            entrada.monto > 0
              ? "text-emerald-400"
              : entrada.monto < 0
                ? "text-rose-400"
                : "text-neutral-400"
          }`}
        >
          {plata(entrada.monto, 2)}
        </span>
        <button
          type="button"
          disabled={borrando}
          onClick={() => {
            if (
              !confirm(
                `¿Borrar ${plata(entrada.monto, 2)} de ${entrada.cuenta}?`
              )
            ) {
              return;
            }
            empezar(async () => {
              await eliminarResultado(entrada.id);
            });
          }}
          className="text-xs text-neutral-600 transition hover:text-rose-400 disabled:opacity-50"
        >
          {borrando ? "Borrando…" : "Borrar"}
        </button>
      </span>
    </li>
  );
}

function Guardar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export function ModalDia({
  dia,
  detalle,
  anterior,
  siguiente,
  onCerrar,
  onIr,
  cuentas,
  tipo,
}: {
  dia: DiaJournal;
  /** Lo que se cargó ese día, cuenta por cuenta. */
  detalle: { id: string; cuenta: string; monto: number; notas: string | null }[];
  anterior: string | null;
  siguiente: string | null;
  onCerrar: () => void;
  onIr: (fecha: string) => void;
  cuentas: CuentaJournal[];
  /** El filtro que está puesto, para ordenar el desplegable de cuentas. */
  tipo: Tipo;
}) {
  const [estado, accion] = useFormState<EstadoJournal, FormData>(guardarNota, {});
  const [texto, setTexto] = useState(dia.nota?.notas ?? "");
  /**
   * Lo último que está guardado en la base, según lo que sabe esta
   * pantalla.
   *
   * No se compara contra `dia.nota` directo: el servidor tarda un instante
   * en revalidar, así que apenas guardás la prop todavía trae la nota
   * vieja y el cartel decía **"Sin guardar" justo después de guardar** —
   * exactamente el momento en que uno necesita que diga lo contrario.
   */
  const [base, setBase] = useState(dia.nota?.notas ?? "");
  const area = useRef<HTMLTextAreaElement>(null);

  // Al cambiar de día, el textarea tiene que traer la nota del día nuevo.
  useEffect(() => {
    setTexto(dia.nota?.notas ?? "");
    setBase(dia.nota?.notas ?? "");
  }, [dia.fecha, dia.nota]);

  // Guardó bien: lo que hay escrito pasa a ser lo guardado.
  useEffect(() => {
    if (estado.ok) setBase((b) => (b === texto ? b : texto));
    // `texto` a propósito fuera de las dependencias: esto tiene que correr
    // cuando llega la respuesta del servidor, no en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const sucio = texto !== base;

  function irA(fecha: string | null) {
    if (!fecha) return;
    if (sucio && !confirm("Tenés cambios sin guardar en este día. ¿Los descartás?")) {
      return;
    }
    onIr(fecha);
  }

  function cerrar() {
    if (sucio && !confirm("Tenés cambios sin guardar. ¿Los descartás?")) return;
    onCerrar();
  }

  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
    }
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  });

  const color =
    dia.monto === null
      ? "text-neutral-500"
      : dia.monto > 0
        ? "text-emerald-400"
        : dia.monto < 0
          ? "text-rose-400"
          : "text-neutral-300";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 p-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => irA(anterior)}
              disabled={!anterior}
              aria-label="Día anterior"
              className="rounded-lg border border-neutral-800 px-2 py-1 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={() => irA(siguiente)}
              disabled={!siguiente}
              aria-label="Día siguiente"
              className="rounded-lg border border-neutral-800 px-2 py-1 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-30"
            >
              ›
            </button>
            <p className="ml-2 font-medium">{fechaCorta(dia.fecha)}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold tabular-nums ${color}`}>
              {dia.monto === null ? "Sin resultados" : plata(dia.monto, 2)}
            </span>
            <button
              onClick={cerrar}
              aria-label="Cerrar"
              className="rounded-lg px-2 py-1 text-neutral-500 transition hover:text-neutral-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Lo que pasó */}
        {detalle.length > 0 && (
          <div className="border-b border-neutral-800 p-4">
            <p className="mb-2 text-xs text-neutral-500">
              {detalle.length === 1
                ? "1 entrada ese día"
                : `${detalle.length} entradas ese día`}
            </p>
            <ul className="divide-y divide-neutral-800/70 text-sm">
              {detalle.map((d) => (
                <FilaEntrada key={d.id} entrada={d} />
              ))}
            </ul>
          </div>
        )}

        {/* Cargar un resultado sin salir de acá */}
        <AltaResultado fecha={dia.fecha} cuentas={cuentas} tipo={tipo} />

        {/* Lo que escribís */}
        <form action={accion} className="p-4">
          <input type="hidden" name="fecha" value={dia.fecha} />

          <label htmlFor="notas" className="text-sm font-medium">
            Notas del día
          </label>
          <p className="mt-0.5 text-xs text-neutral-500">
            Qué viste, qué hiciste y qué harías distinto.
          </p>

          <textarea
            id="notas"
            name="notas"
            ref={area}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={12}
            autoFocus
            placeholder="El precio abrió bajista y…"
            className="mt-2 w-full resize-y rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-700"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs">
              {estado.error ? (
                <span className="text-rose-400">{estado.error}</span>
              ) : estado.ok && !sucio ? (
                <span className="text-emerald-400">{estado.ok}</span>
              ) : sucio ? (
                <span className="text-neutral-500">Sin guardar</span>
              ) : dia.nota ? (
                <span className="text-neutral-500">
                  Última vez: {fechaCorta(dia.nota.updated_at.slice(0, 10))}
                </span>
              ) : null}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cerrar}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
              >
                Cerrar
              </button>
              <Guardar />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
