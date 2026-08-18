"use client";

import { useState } from "react";
import { fechaCorta, plata } from "@/lib/cuentas";
import type { Punto } from "@/lib/resultados";

/**
 * Balance de la cuenta contra el piso del drawdown, día por día.
 *
 * Los dos colores están validados sobre el fondo oscuro (emerald 600 y
 * amber 600): el rojo contra el verde, que era lo intuitivo, se vuelve
 * indistinguible con daltonismo (ΔE 4,6 en deuteranopía). Igual el color no
 * es lo único que separa las series: el piso va **punteado** y las dos
 * líneas están etiquetadas.
 */
const BALANCE = "#059669";
const PISO = "#d97706";

const ANCHO = 640;
const ALTO = 220;
const PAD = { arriba: 14, derecha: 12, abajo: 22, izquierda: 52 };

export function GraficoCurva({ puntos }: { puntos: Punto[] }) {
  const [activo, setActivo] = useState<number | null>(null);

  if (puntos.length < 2) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-8 text-center text-sm text-neutral-500">
        Cargá al menos un día para ver la curva.
      </p>
    );
  }

  const valores = puntos.flatMap((p) =>
    p.piso === null ? [p.balance] : [p.balance, p.piso]
  );

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Un poco de aire arriba y abajo para que las líneas no toquen el borde.
  const aire = (max - min || 1) * 0.12;
  const desde = min - aire;
  const hasta = max + aire;

  const anchoUtil = ANCHO - PAD.izquierda - PAD.derecha;
  const altoUtil = ALTO - PAD.arriba - PAD.abajo;

  const x = (i: number) =>
    PAD.izquierda + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) =>
    PAD.arriba + altoUtil - ((v - desde) / (hasta - desde)) * altoUtil;

  const linea = (sacar: (p: Punto) => number | null) =>
    puntos
      .map((p, i) => {
        const v = sacar(p);
        return v === null ? null : `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`;
      })
      .filter(Boolean)
      .join(" ");

  const p = activo === null ? null : puntos[activo];

  // Tres marcas en el eje: abajo, medio y arriba del rango dibujado.
  const marcas = [desde + aire, (desde + hasta) / 2, hasta - aire];

  function mover(e: React.MouseEvent<SVGRectElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const i = Math.round(
      ((rel - PAD.izquierda) / anchoUtil) * (puntos.length - 1)
    );
    setActivo(Math.max(0, Math.min(puntos.length - 1, i)));
  }

  return (
    <div>
      {/* Con dos series la leyenda va siempre: el color no puede ser lo
          único que diga cuál es cuál. */}
      <div className="mb-2 flex items-center gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded"
            style={{ background: BALANCE }}
          />
          Balance
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="2" aria-hidden>
            <line
              x1="0"
              y1="1"
              x2="16"
              y2="1"
              stroke={PISO}
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>
          Piso del drawdown
        </span>
      </div>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full"
        role="img"
        aria-label="Balance de la cuenta contra el piso del drawdown"
      >
        {marcas.map((v) => (
          <g key={v}>
            <line
              x1={PAD.izquierda}
              y1={y(v)}
              x2={ANCHO - PAD.derecha}
              y2={y(v)}
              stroke="#262626"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={PAD.izquierda - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#737373"
            >
              {plata(v)}
            </text>
          </g>
        ))}

        {/* El piso primero, para que el balance quede por encima */}
        <path
          d={linea((p) => p.piso)}
          fill="none"
          stroke={PISO}
          strokeWidth="2"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={linea((p) => p.balance)}
          fill="none"
          stroke={BALANCE}
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {activo !== null && p && (
          <>
            <line
              x1={x(activo)}
              y1={PAD.arriba}
              x2={x(activo)}
              y2={ALTO - PAD.abajo}
              stroke="#525252"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(activo)} cy={y(p.balance)} r="4" fill={BALANCE} />
            {p.piso !== null && (
              <circle cx={x(activo)} cy={y(p.piso)} r="4" fill={PISO} />
            )}
          </>
        )}

        <text
          x={PAD.izquierda}
          y={ALTO - 6}
          fontSize="10"
          fill="#737373"
        >
          {fechaCorta(puntos[0].fecha)}
        </text>
        <text
          x={ANCHO - PAD.derecha}
          y={ALTO - 6}
          textAnchor="end"
          fontSize="10"
          fill="#737373"
        >
          {fechaCorta(puntos[puntos.length - 1].fecha)}
        </text>

        <rect
          x={0}
          y={0}
          width={ANCHO}
          height={ALTO}
          fill="transparent"
          onMouseMove={mover}
          onMouseLeave={() => setActivo(null)}
        />
      </svg>

      {/* El detalle del punto va abajo y no flotando: en una tarjeta
          angosta un tooltip encima tapa justo la línea que estás mirando. */}
      <div className="mt-1 min-h-[2.5rem] rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs">
        {p ? (
          <>
            <span className="text-neutral-400">{fechaCorta(p.fecha)}</span>{" "}
            <span className="text-neutral-200">{plata(p.balance)}</span>
            {p.piso !== null && (
              <span className="text-neutral-500">
                {" "}
                · piso {plata(p.piso)} · colchón{" "}
                {plata(p.balance - p.piso)}
              </span>
            )}
            {p.monto !== null && (
              <span
                className={p.monto >= 0 ? "text-emerald-400" : "text-rose-400"}
              >
                {" "}
                · día {p.monto >= 0 ? "+" : "−"}
                {plata(Math.abs(p.monto))}
              </span>
            )}
          </>
        ) : (
          <span className="text-neutral-600">
            Pasá el mouse por el gráfico para ver cada día.
          </span>
        )}
      </div>
    </div>
  );
}
