"use client";

import { useState } from "react";
import { fechaCorta, plata } from "@/lib/cuentas";
import type { PuntoCapital } from "@/lib/movimientos";

/**
 * El capital que manejás, día a día.
 *
 * Va en **escalones y no en línea interpolada**: el capital cambia de
 * golpe —pasás una evaluación, quemás una cuenta— y una rampa diría que
 * fuiste manejando 60k, 70k, 80k, cosa que nunca pasó.
 *
 * El área arranca siempre en 0. Un área que no toca el cero exagera los
 * escalones y hace parecer que pasaste de manejar nada a manejar todo.
 */
const LINEA = "#059669";

const ANCHO = 640;
const ALTO = 200;
const PAD = { arriba: 14, derecha: 12, abajo: 22, izquierda: 60 };

export function GraficoCapital({
  puntos,
  hoy,
}: {
  puntos: PuntoCapital[];
  /** De qué cuentas sale el número de hoy, para poder auditarlo. */
  hoy: { nombre: string; tamano: number }[];
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const [verDetalle, setVerDetalle] = useState(false);

  if (puntos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-8 text-center text-sm text-neutral-500">
        Cuando tengas tu primera fondeada, acá se dibuja cuánto capital
        manejás.
      </p>
    );
  }

  // Con un solo punto —tu primera fondeada, hoy— se dibuja igual, plana:
  // un cartel de "faltan datos" el día que conseguís la primera cuenta es
  // exactamente el día en que uno quiere ver el gráfico.
  const serie = puntos.length === 1 ? [puntos[0], puntos[0]] : puntos;

  const max = Math.max(...serie.map((p) => p.capital), 0) || 1;
  // Aire arriba para que el escalón más alto no toque el borde.
  const techo = max * 1.12;

  const anchoUtil = ANCHO - PAD.izquierda - PAD.derecha;
  const altoUtil = ALTO - PAD.arriba - PAD.abajo;
  const piso = PAD.arriba + altoUtil;

  const x = (i: number) =>
    PAD.izquierda + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) => piso - (v / techo) * altoUtil;

  /**
   * La línea va **de punto a punto**, no en escalones.
   *
   * El dato es escalonado —el capital cambia de golpe el día que pasás una
   * evaluación— y la primera versión lo dibujaba así, con el ángulo recto.
   * Se ve duro y, sobre todo, hace que un salto tape la forma general de
   * la serie, que es lo que uno viene a mirar. Los puntos siguen estando
   * en los días exactos en que algo cambió y el tooltip da el número
   * correcto de cada día, así que lo único que se suaviza es el trazo
   * entre dos eventos.
   */
  const tramos = serie.map(
    (p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.capital)}`
  );

  const linea = tramos.join(" ");
  // El área es la misma escalera, cerrada contra el piso. Va rellena y no
  // como línea suelta: lo que se mira acá es el volumen de capital, y una
  // superficie se compara de un vistazo mucho mejor que una altura.
  const area = [
    `M${x(0)},${piso}`,
    ...tramos.map((c, i) => (i === 0 ? c.replace("M", "L") : c)),
    `L${x(serie.length - 1)},${piso}`,
    "Z",
  ].join(" ");

  const marcas = [0, max / 2, max];
  const p = activo === null ? null : serie[activo];

  function mover(e: React.MouseEvent<SVGRectElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const i = Math.round(
      ((rel - PAD.izquierda) / anchoUtil) * (serie.length - 1)
    );
    setActivo(Math.max(0, Math.min(serie.length - 1, i)));
  }

  const capitalHoy = hoy.reduce((suma, c) => suma + c.tamano, 0);

  return (
    <div>
      {/* El número de hoy, arriba y grande: es la respuesta a la pregunta
          del panel. La curva es el contexto, no el dato. */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums text-emerald-400">
            {plata(capitalHoy)}
          </p>
          <p className="text-xs text-neutral-500">
            hoy, en {hoy.length} {hoy.length === 1 ? "fondeada" : "fondeadas"}
          </p>
        </div>

        {hoy.length > 0 && (
          <button
            type="button"
            onClick={() => setVerDetalle((v) => !v)}
            className="text-xs text-neutral-500 underline-offset-2 transition hover:text-neutral-300 hover:underline"
          >
            {verDetalle ? "Ocultar cuáles" : "Ver cuáles"}
          </button>
        )}
      </div>

      {/* Desarmar el total es lo que permite corregirlo: si acá aparece una
          cuenta que ya quemaste, el problema es su estado en Cuentas y no
          el gráfico. */}
      {verDetalle && hoy.length > 0 && (
        <ul className="mb-3 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 text-xs">
          {hoy.map((c, i) => (
            <li
              key={`${c.nombre}-${i}`}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-neutral-400">{c.nombre}</span>
              <span className="tabular-nums text-neutral-300">
                {plata(c.tamano)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full"
        role="img"
        aria-label="Capital bajo gestión en el tiempo"
      >
        {marcas.map((v) => (
          <g key={v}>
            <line
              x1={PAD.izquierda}
              y1={y(v)}
              x2={ANCHO - PAD.derecha}
              y2={y(v)}
              stroke="rgb(var(--grafico-grilla))"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={PAD.izquierda - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="rgb(var(--grafico-texto))"
            >
              {plata(v)}
            </text>
          </g>
        ))}

        {/* Degradado y no un relleno plano: así el área pesa arriba, donde
            está el dato, y se apaga contra el eje en vez de tapar la
            grilla. */}
        <defs>
          <linearGradient id="capital-relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINEA} stopOpacity="0.45" />
            <stop offset="100%" stopColor={LINEA} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#capital-relleno)" />
        <path
          d={linea}
          fill="none"
          stroke={LINEA}
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
              y2={piso}
              stroke="rgb(var(--grafico-eje))"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(activo)} cy={y(p.capital)} r="4" fill={LINEA} />
          </>
        )}

        <text
          x={PAD.izquierda}
          y={ALTO - 6}
          fontSize="10"
          fill="rgb(var(--grafico-texto))"
        >
          {fechaCorta(serie[0].fecha)}
        </text>
        <text
          x={ANCHO - PAD.derecha}
          y={ALTO - 6}
          textAnchor="end"
          fontSize="10"
          fill="rgb(var(--grafico-texto))"
        >
          {fechaCorta(serie[serie.length - 1].fecha)}
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

      {/* El detalle va abajo y no flotando: en una tarjeta angosta un
          tooltip encima tapa justo lo que estás mirando. */}
      <div className="mt-1 min-h-[2.25rem] rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs">
        {p ? (
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-neutral-400">{fechaCorta(p.fecha)}</span>
            <span className="text-emerald-400">{plata(p.capital)}</span>
            <span className="text-neutral-500">
              {p.cuentas} {p.cuentas === 1 ? "fondeada" : "fondeadas"}
            </span>
          </span>
        ) : (
          <span className="text-neutral-600">
            Pasá el mouse por la curva para ver cualquier día.
          </span>
        )}
      </div>
    </div>
  );
}
