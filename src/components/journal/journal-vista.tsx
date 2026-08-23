"use client";

import { useMemo, useState } from "react";
import { ModalDia } from "./modal-dia";
import { fechaCorta, plata } from "@/lib/cuentas";
import { diasDeJournal, vecinos, type NotaDia } from "@/lib/journal";
import { diasDeTrading } from "@/lib/home";
import type { Resultado } from "@/lib/resultados";

/**
 * La lista del journal: una tarjeta por día, de más nuevo a más viejo.
 *
 * El indicador de "escrito / sin escribir" es lo más importante de la
 * pantalla. Las métricas finas de la competencia (win rate, profit factor)
 * salen de operaciones importadas del broker, que nosotros no tenemos;
 * pero lo que hace que un journal se use no son esas métricas, es **ver de
 * un vistazo qué días escribiste y cuáles no**.
 */

type Filtro = "todos" | "sin_escribir" | "escritos";

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "sin_escribir", label: "Sin escribir" },
  { valor: "escritos", label: "Escritos" },
];

export function JournalVista({
  resultados,
  notas,
  nombres,
}: {
  resultados: Resultado[];
  notas: NotaDia[];
  /** id de cuenta -> nombre, para el detalle del día. */
  nombres: Record<string, string>;
}) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<string | null>(null);

  const dias = useMemo(
    () => diasDeJournal(diasDeTrading(resultados), notas),
    [resultados, notas]
  );

  const visibles = useMemo(
    () =>
      dias.filter((d) =>
        filtro === "todos"
          ? true
          : filtro === "escritos"
            ? d.escrito
            : !d.escrito
      ),
    [dias, filtro]
  );

  const escritos = dias.filter((d) => d.escrito).length;

  const dia = abierto ? dias.find((d) => d.fecha === abierto) : undefined;

  // Las flechas navegan la lista COMPLETA, no la filtrada: si estás viendo
  // "sin escribir" y guardás una nota, el día no tiene que desaparecerte
  // de abajo de las flechas.
  const { anterior, siguiente } = abierto
    ? vecinos(dias, abierto)
    : { anterior: null, siguiente: null };

  const detalle = useMemo(() => {
    if (!abierto) return [];
    return resultados
      .filter((r) => r.fecha === abierto)
      .map((r) => ({
        id: r.id,
        cuenta: nombres[r.cuenta_id] ?? "—",
        monto: r.monto,
        notas: r.notas,
      }));
  }, [abierto, resultados, nombres]);

  if (dias.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-10 text-center">
        <p className="text-sm text-neutral-300">Todavía no hay días para escribir.</p>
        <p className="mt-1 text-sm text-neutral-500">
          Cargá un resultado en alguna cuenta y ese día va a aparecer acá para
          que escribas qué pasó.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                filtro === f.valor
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-neutral-500">
          {escritos} de {dias.length} {dias.length === 1 ? "día" : "días"} escritos
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 px-4 py-8 text-center text-sm text-neutral-500">
          {filtro === "escritos"
            ? "Todavía no escribiste ninguno."
            : "Están todos escritos. Bien ahí."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibles.map((d) => (
            <li key={d.fecha}>
              <button
                onClick={() => setAbierto(d.fecha)}
                className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-neutral-700"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="font-medium">{fechaCorta(d.fecha)}</span>
                  <span
                    className={`tabular-nums ${
                      d.monto === null
                        ? "text-neutral-600"
                        : d.monto > 0
                          ? "text-emerald-400"
                          : d.monto < 0
                            ? "text-rose-400"
                            : "text-neutral-300"
                    }`}
                  >
                    {d.monto === null ? "Sin operar" : plata(d.monto)}
                  </span>
                  {d.entradas > 1 && (
                    <span className="text-xs text-neutral-500">
                      {d.entradas} entradas
                    </span>
                  )}
                </span>

                <span className="flex min-w-0 flex-1 items-center justify-end gap-3">
                  {d.escrito && d.nota && (
                    <span className="hidden min-w-0 flex-1 truncate text-right text-xs text-neutral-500 sm:block">
                      {d.nota.notas.replace(/\s+/g, " ").slice(0, 120)}
                    </span>
                  )}
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                      d.escrito
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-neutral-800 text-neutral-500"
                    }`}
                  >
                    {d.escrito ? "Escrito" : "Escribir"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {dia && (
        <ModalDia
          dia={dia}
          detalle={detalle}
          anterior={anterior}
          siguiente={siguiente}
          onCerrar={() => setAbierto(null)}
          onIr={(f) => setAbierto(f)}
        />
      )}
    </div>
  );
}
