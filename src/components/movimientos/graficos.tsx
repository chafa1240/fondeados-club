"use client";

import { useState } from "react";
import { fechaCorta, plata } from "@/lib/cuentas";
import {
  CATEGORIA_INFO,
  type Categoria,
  type PuntoAcumulado,
  type ResumenFirm,
} from "@/lib/movimientos";

/**
 * Los dos colores de las series están validados sobre el fondo oscuro de
 * la app: verde y ámbar en el paso 600. El par verde/rojo, que era lo
 * intuitivo, se vuelve casi indistinguible con daltonismo. Igual el color
 * nunca es lo único que separa: hay leyenda y etiquetas directas.
 */
const ENTRA = "#059669";
const SALE = "#d97706";

/** Un solo tono para magnitudes: comparar tamaños, no identificar cosas. */
const MAGNITUD = "#0284c7";

const ANCHO = 640;
const ALTO = 200;
const PAD = { arriba: 12, derecha: 12, abajo: 22, izquierda: 56 };

export function Panel({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-sm font-medium">{titulo}</p>
      {ayuda && <p className="mt-0.5 text-xs text-neutral-500">{ayuda}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-8 text-center text-sm text-neutral-500">
      {children}
    </p>
  );
}

function Leyenda({
  series,
}: {
  series: { color: string; label: string; punteada?: boolean }[];
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
      {series.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <svg width="16" height="2" aria-hidden>
            <line
              x1="0"
              y1="1"
              x2="16"
              y2="1"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.punteada ? "4 3" : undefined}
            />
          </svg>
          {s.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Invertido vs cobrado, y el neto ---------- */

export function GraficoAcumulado({
  puntos,
  modo,
}: {
  puntos: PuntoAcumulado[];
  /** `comparado` dibuja invertido y cobrado; `neto` dibuja la diferencia. */
  modo: "comparado" | "neto";
}) {
  const [activo, setActivo] = useState<number | null>(null);

  if (puntos.length < 2) {
    return <Vacio>Hacen falta al menos dos días con movimientos.</Vacio>;
  }

  const valores =
    modo === "comparado"
      ? puntos.flatMap((p) => [p.invertido, p.cobrado])
      : [...puntos.map((p) => p.neto), 0];

  const min = Math.min(...valores, 0);
  const max = Math.max(...valores, 0);
  const aire = (max - min || 1) * 0.12;
  const desde = min - aire;
  const hasta = max + aire;

  const anchoUtil = ANCHO - PAD.izquierda - PAD.derecha;
  const altoUtil = ALTO - PAD.arriba - PAD.abajo;

  const x = (i: number) => PAD.izquierda + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) =>
    PAD.arriba + altoUtil - ((v - desde) / (hasta - desde)) * altoUtil;

  const linea = (sacar: (p: PuntoAcumulado) => number) =>
    puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(sacar(p))}`).join(" ");

  const p = activo === null ? null : puntos[activo];
  const marcas = [desde + aire, (desde + hasta) / 2, hasta - aire];

  function mover(e: React.MouseEvent<SVGRectElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const i = Math.round(((rel - PAD.izquierda) / anchoUtil) * (puntos.length - 1));
    setActivo(Math.max(0, Math.min(puntos.length - 1, i)));
  }

  return (
    <div>
      {modo === "comparado" && (
        <Leyenda
          series={[
            { color: ENTRA, label: "Cobrado" },
            { color: SALE, label: "Invertido", punteada: true },
          ]}
        />
      )}

      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img">
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

        {/* El cero, que es la línea que separa ganar de perder */}
        {modo === "neto" && desde < 0 && hasta > 0 && (
          <line
            x1={PAD.izquierda}
            y1={y(0)}
            x2={ANCHO - PAD.derecha}
            y2={y(0)}
            stroke="#525252"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {modo === "comparado" ? (
          <>
            <path
              d={linea((p) => p.invertido)}
              fill="none"
              stroke={SALE}
              strokeWidth="2"
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={linea((p) => p.cobrado)}
              fill="none"
              stroke={ENTRA}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <path
            d={linea((p) => p.neto)}
            fill="none"
            stroke={ENTRA}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {activo !== null && p && (
          <line
            x1={x(activo)}
            y1={PAD.arriba}
            x2={x(activo)}
            y2={ALTO - PAD.abajo}
            stroke="#525252"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <text x={PAD.izquierda} y={ALTO - 6} fontSize="10" fill="#737373">
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

      <div className="mt-1 min-h-[2rem] text-xs">
        {p ? (
          <>
            <span className="text-neutral-400">{fechaCorta(p.fecha)}</span>{" "}
            {modo === "comparado" ? (
              <span className="text-neutral-300">
                cobrado {plata(p.cobrado)} · invertido {plata(p.invertido)}
              </span>
            ) : (
              <span
                className={p.neto < 0 ? "text-rose-400" : "text-emerald-400"}
              >
                neto {p.neto < 0 ? "−" : "+"}
                {plata(Math.abs(p.neto))}
              </span>
            )}
          </>
        ) : (
          <span className="text-neutral-600">
            Pasá el mouse para ver cada fecha.
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Gastos por categoría ---------- */

export function GraficoCategorias({
  datos,
}: {
  datos: { categoria: Categoria; monto: number }[];
}) {
  if (datos.length === 0) return <Vacio>Todavía no cargaste gastos.</Vacio>;

  const max = Math.max(...datos.map((d) => d.monto));

  // Un solo tono: acá se comparan tamaños, no se identifican cosas. Pintar
  // cada categoría de un color distinto sugeriría que el color significa
  // algo, y no significa nada.
  return (
    <ul className="space-y-2">
      {datos.map((d) => (
        <li key={d.categoria}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-neutral-300">
              {CATEGORIA_INFO[d.categoria].label}
            </span>
            <span className="tabular-nums text-neutral-400">
              {plata(d.monto)}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-neutral-950">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max(2, (d.monto / max) * 100)}%`,
                background: MAGNITUD,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Cómo terminaron las cuentas de cada firm ---------- */

export function GraficoFirms({ datos }: { datos: ResumenFirm[] }) {
  if (datos.length === 0) return <Vacio>Todavía no cargaste cuentas.</Vacio>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: ENTRA }} />
          Pasadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: SALE }} />
          Quemadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-neutral-700" />
          En juego
        </span>
      </div>

      <ul className="space-y-3">
        {datos.map((f) => {
          const total = f.pasadas + f.quemadas + f.enJuego || 1;
          const cerradas = f.pasadas + f.quemadas;

          return (
            <li key={f.firm}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-neutral-300">{f.firm}</span>
                <span className="tabular-nums text-neutral-500">
                  {cerradas > 0
                    ? `${Math.round((f.pasadas / cerradas) * 100)}% pasadas`
                    : "sin cerrar"}
                </span>
              </div>

              {/* Los segmentos van separados por 2px de superficie: pegados,
                  dos colores contiguos se leen como uno solo. */}
              <div className="mt-1 flex h-2 gap-0.5">
                {[
                  { n: f.pasadas, color: ENTRA, label: "pasadas" },
                  { n: f.quemadas, color: SALE, label: "quemadas" },
                  { n: f.enJuego, color: "#404040", label: "en juego" },
                ]
                  .filter((s) => s.n > 0)
                  .map((s) => (
                    <div
                      key={s.label}
                      title={`${s.n} ${s.label}`}
                      className="h-2 rounded-sm"
                      style={{
                        width: `${(s.n / total) * 100}%`,
                        background: s.color,
                      }}
                    />
                  ))}
              </div>

              <p className="mt-1 text-[11px] text-neutral-600">
                {f.pasadas} pasadas · {f.quemadas} quemadas · {f.enJuego} en juego
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
