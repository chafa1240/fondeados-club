"use client";

import { useEffect, useState } from "react";
import {
  estaCongelado,
  fechaCorta,
  pisoDrawdown,
  plata,
  porcentaje,
  type Cuenta,
} from "@/lib/cuentas";
import {
  rachaActual,
  resumenDias,
  type Punto,
  type Resultado,
} from "@/lib/resultados";
import { GraficoCurva } from "./grafico-curva";

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-200">{valor}</p>
    </div>
  );
}

/**
 * La curva de la cuenta: balance contra piso del drawdown, más el resumen
 * de días. Va en un modal y no en la tarjeta porque un gráfico necesita
 * ancho para leerse, y la tarjeta no tiene que crecer.
 */
export function ModalCurva({
  cuenta,
  /**
   * La curva viene calculada de la página. No se recalcula acá: `cuenta`
   * ya trae el balance y el pico completados, y volver a pasarla por
   * `estadoDeCuenta` haría arrancar el piso en su valor final.
   */
  serie,
  resultados,
  onCerrar,
}: {
  cuenta: Cuenta;
  serie: Punto[];
  resultados: Resultado[];
  onCerrar: () => void;
}) {
  const [tabla, setTabla] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const racha = rachaActual(resultados);
  const dias = resumenDias(resultados);
  const piso = pisoDrawdown(cuenta);

  const filas = [...resultados].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Curva de {cuenta.nombre}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {cuenta.firm} · {plata(cuenta.balance_actual)}
              {piso !== null && (
                <>
                  {" "}
                  · se quema en {plata(piso)}
                  {estaCongelado(cuenta) && " (congelado)"}
                </>
              )}
            </p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg border border-neutral-700 px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <GraficoCurva puntos={serie} />

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-800 pt-4 sm:grid-cols-4">
          <Dato label="Días cargados" valor={String(dias.total)} />
          <Dato
            label="Ganadores / perdedores"
            valor={`${dias.ganadores} / ${dias.perdedores}`}
          />
          <Dato
            label="Racha actual"
            valor={
              racha.dias === 0
                ? "—"
                : `${racha.dias} ${racha.dias === 1 ? "día" : "días"} ${
                    racha.ganadora ? "en verde" : "en rojo"
                  }`
            }
          />
          <Dato
            label="% de días ganadores"
            valor={
              dias.total === 0
                ? "—"
                : porcentaje((dias.ganadores / dias.total) * 100, 0)
            }
          />
        </div>

        {/* La misma información en texto, para cuando el gráfico no alcanza
            o directamente no se puede ver. */}
        <div className="mt-4 border-t border-neutral-800 pt-3">
          <button
            onClick={() => setTabla((v) => !v)}
            className="text-xs text-neutral-500 transition hover:text-neutral-200"
          >
            {tabla ? "Ocultar tabla" : "Ver los días como tabla"}
          </button>

          {tabla && (
            <ul className="mt-2 space-y-1">
              {filas.length === 0 && (
                <li className="text-xs text-neutral-600">
                  Todavía no cargaste ningún día.
                </li>
              )}
              {filas.map((r) => (
                <li
                  key={r.id}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
                  <span className="text-neutral-500">
                    {fechaCorta(r.fecha)}
                    {r.notas ? ` · ${r.notas}` : ""}
                  </span>
                  <span
                    className={
                      r.monto >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  >
                    {r.monto >= 0 ? "+" : "−"}
                    {plata(Math.abs(r.monto), 2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
