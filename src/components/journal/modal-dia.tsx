"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarNota, type EstadoJournal } from "@/app/(app)/journal/actions";
import { fechaCorta, plata } from "@/lib/cuentas";
import type { DiaJournal } from "@/lib/journal";

/**
 * El día abierto: lo que pasó arriba, lo que escribís abajo.
 *
 * Las flechas pasan de día **sin cerrar el modal**, que es el gesto que
 * hace que revisar la semana no sea abrir y cerrar diez veces. Si hay algo
 * escrito sin guardar, avisa antes de moverse: perder un párrafo por
 * apretar una flecha es la forma más rápida de que alguien no vuelva a
 * escribir nunca más.
 */

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
}: {
  dia: DiaJournal;
  /** Lo que se cargó ese día, cuenta por cuenta. */
  detalle: { id: string; cuenta: string; monto: number; notas: string | null }[];
  anterior: string | null;
  siguiente: string | null;
  onCerrar: () => void;
  onIr: (fecha: string) => void;
}) {
  const [estado, accion] = useFormState<EstadoJournal, FormData>(guardarNota, {});
  const [texto, setTexto] = useState(dia.nota?.notas ?? "");
  const area = useRef<HTMLTextAreaElement>(null);

  // Al cambiar de día, el textarea tiene que traer la nota del día nuevo.
  useEffect(() => {
    setTexto(dia.nota?.notas ?? "");
  }, [dia.fecha, dia.nota]);

  const sucio = texto !== (dia.nota?.notas ?? "");

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
              {dia.monto === null ? "Sin operar" : plata(dia.monto, 2)}
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
                <li key={d.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="min-w-0">
                    <span className="text-neutral-300">{d.cuenta}</span>
                    {d.notas && (
                      <span className="ml-2 text-xs text-neutral-500">{d.notas}</span>
                    )}
                  </span>
                  <span
                    className={`tabular-nums ${
                      d.monto > 0
                        ? "text-emerald-400"
                        : d.monto < 0
                          ? "text-rose-400"
                          : "text-neutral-400"
                    }`}
                  >
                    {plata(d.monto, 2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
