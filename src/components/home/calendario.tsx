"use client";

import { plata } from "@/lib/cuentas";
import { etiquetaMes } from "@/lib/movimientos";
import {
  DIAS_SEMANA,
  mesAnterior,
  mesSiguiente,
  type Celda,
  type MesCalendario,
} from "@/lib/home";

/**
 * El calendario mensual de P&L.
 *
 * Cada celda es un día con su neto; a la derecha, el total de cada semana.
 * Es la vista que tienen los dos competidores y la que hasta ahora nos
 * faltaba, aunque los datos ya estaban cargados.
 *
 * **Un día vacío y un día en cero no son lo mismo.** El día que no
 * operaste queda apagado; el que operaste y cerraste plano se pinta como
 * un día trabajado, con su $0. Si los dibujáramos igual, el calendario
 * mentiría sobre cuánto trabajaste.
 */

/** El color de la celda según cuánto se ganó o se perdió ese día. */
function tonoDia(monto: number) {
  if (monto > 0) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (monto < 0) return "border-rose-500/30 bg-rose-500/10 text-rose-300";
  return "border-neutral-700 bg-neutral-800/60 text-neutral-300";
}

function CeldaDia({
  celda,
  onClick,
}: {
  celda: Celda | null;
  onClick?: () => void;
}) {
  if (!celda) return <div className="min-h-[3.75rem] rounded-lg" />;

  const vacio = celda.monto === null;

  const clases = vacio
    ? "border-neutral-800/70 bg-neutral-900/40 text-neutral-600"
    : tonoDia(celda.monto as number);

  const contenido = (
    <>
      <span className="flex items-center justify-between text-[0.6875rem] leading-none text-neutral-500">
        <span className="flex items-center gap-1">
          {celda.numero}
          {celda.marcado && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              title="Tiene nota escrita"
            />
          )}
        </span>
        {celda.entradas > 1 && (
          <span
            className="rounded-full bg-neutral-800 px-1 text-[0.625rem] text-neutral-400"
            title={`${celda.entradas} entradas ese día`}
          >
            {celda.entradas}
          </span>
        )}
      </span>
      {!vacio && (
        <span className="mt-1 block truncate text-xs font-semibold tabular-nums">
          {plata(celda.monto as number)}
        </span>
      )}
    </>
  );

  const borde = celda.esHoy ? "ring-1 ring-inset ring-sky-400/60" : "";

  // En el Home solo se abren los días con algo cargado: un día vacío no
  // tiene nada que mostrar y un botón que no hace nada es peor que ningún
  // botón. En el journal sí se abren, porque el día que no operaste
  // también se puede escribir (`abrirVacios`).
  if (!onClick) {
    return (
      <div className={`min-h-[3.75rem] rounded-lg border p-1.5 ${clases} ${borde}`}>
        {contenido}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      title={vacio ? celda.fecha : `${celda.fecha} · ${plata(celda.monto as number, 2)}`}
      className={`min-h-[3.75rem] rounded-lg border p-1.5 text-left transition hover:brightness-125 ${clases} ${borde}`}
    >
      {contenido}
    </button>
  );
}

export function Calendario({
  datos,
  onMes,
  onDia,
  puedeAtras,
  puedeAdelante,
  abrirVacios = false,
  resumen,
}: {
  datos: MesCalendario;
  onMes: (mes: string) => void;
  onDia?: (fecha: string) => void;
  puedeAtras: boolean;
  puedeAdelante: boolean;
  /** true = también se pueden abrir los días sin nada cargado. */
  abrirVacios?: boolean;
  /** Reemplaza el resumen de la derecha (días, verdes, rojos, total). */
  resumen?: React.ReactNode;
}) {
  const signo = datos.total > 0 ? "text-emerald-400" : datos.total < 0 ? "text-rose-400" : "text-neutral-300";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMes(mesAnterior(datos.mes))}
            disabled={!puedeAtras}
            aria-label="Mes anterior"
            className="rounded-lg border border-neutral-800 px-2 py-1 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-30 disabled:hover:border-neutral-800"
          >
            ‹
          </button>
          <button
            onClick={() => onMes(mesSiguiente(datos.mes))}
            disabled={!puedeAdelante}
            aria-label="Mes siguiente"
            className="rounded-lg border border-neutral-800 px-2 py-1 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-30 disabled:hover:border-neutral-800"
          >
            ›
          </button>
          <p className="ml-2 text-sm font-medium">{etiquetaMes(datos.mes)}</p>
        </div>

        {resumen ?? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-500">
              {datos.diasConDatos === 0
                ? "Sin días cargados"
                : `${datos.diasConDatos} ${datos.diasConDatos === 1 ? "día" : "días"} · ${datos.ganadores} en verde, ${datos.perdedores} en rojo`}
            </span>
            <span className={`font-semibold tabular-nums ${signo}`}>
              {plata(datos.total)}
            </span>
          </div>
        )}
      </div>

      {/* La columna extra de la derecha es el total de la semana. */}
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-1.5">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="pb-1 text-center text-[0.6875rem] text-neutral-500">
            {d}
          </div>
        ))}
        <div className="pb-1 pl-2 text-right text-[0.6875rem] text-neutral-500">
          Semana
        </div>

        {datos.semanas.map((semana, i) => (
          <div key={i} className="contents">
            {semana.celdas.map((c, j) => (
              <CeldaDia
                key={j}
                celda={c}
                onClick={
                  c && onDia && (abrirVacios || c.monto !== null)
                    ? () => onDia(c.fecha)
                    : undefined
                }
              />
            ))}
            <div className="flex min-w-[5rem] items-center justify-end pl-2 text-xs tabular-nums">
              {semana.conDatos ? (
                <span
                  className={
                    semana.total > 0
                      ? "text-emerald-400"
                      : semana.total < 0
                        ? "text-rose-400"
                        : "text-neutral-400"
                  }
                >
                  {plata(semana.total)}
                </span>
              ) : (
                <span className="text-neutral-700">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
