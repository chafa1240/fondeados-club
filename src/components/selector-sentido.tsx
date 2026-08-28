"use client";

import { SENTIDOS, SENTIDO_INFO, type Sentido } from "@/lib/resultados";

/**
 * De qué lado estuviste: long o short.
 *
 * Dos chips y no un desplegable: son dos opciones y el gesto tiene que
 * costar un toque, porque se carga en cada operación. Volver a tocar el
 * chip elegido lo despinta.
 *
 * **Se puede dejar sin marcar**, y es a propósito: una entrada puede ser
 * el neto de una jornada donde operaste para los dos lados, y obligar a
 * elegir ahí haría que la mitad de las estadísticas fueran mentira. Las
 * que quedan sin lado se cuentan aparte y no ensucian la comparación.
 */
export function SelectorSentido({
  valor,
  onCambiar,
  compacto = false,
}: {
  valor: Sentido | null;
  onCambiar: (v: Sentido | null) => void;
  /** Para el alta rápida del journal, donde va en una fila con el monto. */
  compacto?: boolean;
}) {
  return (
    <>
      <input type="hidden" name="sentido" value={valor ?? ""} />

      <div className="flex gap-1.5">
        {SENTIDOS.map((s) => {
          const info = SENTIDO_INFO[s];
          const activo = valor === s;

          // El color sigue al lado (long verde / short rosa) solo cuando
          // está elegido: pintarlos siempre haría creer que uno es el
          // bueno y el otro el malo, y de los dos se puede ganar.
          const clase = activo
            ? s === "long"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/40 bg-rose-500/10 text-rose-400"
            : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200";

          return (
            <button
              key={s}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambiar(activo ? null : s)}
              className={`rounded-full border px-3 ${
                compacto ? "py-2" : "py-1.5"
              } text-xs transition ${clase}`}
            >
              <span aria-hidden className="mr-1">
                {info.flecha}
              </span>
              {info.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
