"use client";

import { fechaCorta, plata, porcentaje } from "@/lib/cuentas";
import type { DiaHome } from "@/lib/home";
import type { DiaJournal } from "@/lib/journal";
import {
  efectoDeEscribir,
  estadisticasDeDias,
  porDiaSemana,
  rachaDeEscritura,
} from "@/lib/estadisticas";

/**
 * Las estadísticas del journal.
 *
 * Todas salen de **días**, no de operaciones. Es menos de lo que muestra
 * la competencia y es todo lo que se puede decir sin mentir: profit factor
 * y win rate por trade necesitan las operaciones importadas del broker,
 * que no tenemos.
 */

function Tarjeta({
  titulo,
  valor,
  clase,
  pie,
}: {
  titulo: string;
  valor: string;
  clase?: string;
  pie?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${clase ?? ""}`}>
        {valor}
      </p>
      {pie && <p className="mt-0.5 text-xs text-neutral-500">{pie}</p>}
    </div>
  );
}

function color(n: number) {
  return n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-neutral-300";
}

/* ---------- El gráfico por día de la semana ---------- */

const ANCHO = 700;
const ALTO = 210;
const PAD = { arriba: 26, abajo: 30, costado: 8 };

/**
 * El aire que se le saca a la barra más alta para que su valor entre.
 *
 * Sin esto, la barra más grande llega hasta el borde y su etiqueta se
 * escribe encima del nombre del día. Es el error clásico de dejar el eje
 * fuera del alto del contenedor.
 */
const MARGEN_ETIQUETA = 16;

function PorDiaSemana({ dias }: { dias: DiaHome[] }) {
  const filas = porDiaSemana(dias);
  const conDatos = filas.filter((f) => f.dias > 0);

  if (conDatos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-8 text-center text-sm text-neutral-500">
        Todavía no hay días cargados.
      </p>
    );
  }

  const tope = Math.max(...filas.map((f) => Math.abs(f.total)), 1);

  const anchoUtil = ANCHO - PAD.costado * 2;
  const columna = anchoUtil / filas.length;
  const anchoBarra = Math.min(48, columna * 0.5);

  // El cero va al medio si hay días de los dos signos; si son todos del
  // mismo signo, se apoya en el borde y las barras usan todo el alto.
  const hayPositivos = filas.some((f) => f.total > 0);
  const hayNegativos = filas.some((f) => f.total < 0);
  const altoUtil = ALTO - PAD.arriba - PAD.abajo;

  const cero =
    hayPositivos && hayNegativos
      ? PAD.arriba + altoUtil / 2
      : hayNegativos
        ? PAD.arriba
        : PAD.arriba + altoUtil;

  const disponible =
    (hayPositivos && hayNegativos ? altoUtil / 2 : altoUtil) - MARGEN_ETIQUETA;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full"
        role="img"
        aria-label="Resultado acumulado por día de la semana"
      >
        {/* La línea del cero: hairline, sólida, un tono sobre el fondo. */}
        <line
          x1={PAD.costado}
          y1={cero}
          x2={ANCHO - PAD.costado}
          y2={cero}
          stroke="rgb(var(--grafico-eje))"
          strokeWidth="1"
        />

        {filas.map((f, i) => {
          const centro = PAD.costado + columna * i + columna / 2;
          const alto = (Math.abs(f.total) / tope) * disponible;
          const positivo = f.total >= 0;
          const y = positivo ? cero - alto : cero;

          // El nombre del día siempre va abajo del todo: es el eje, no una
          // etiqueta de la barra, así que no se mueve con el signo.
          const etiquetaY = positivo ? cero - alto - 8 : cero + alto + 14;

          return (
            <g key={f.label}>
              {f.dias > 0 && (
                <rect
                  x={centro - anchoBarra / 2}
                  y={y}
                  width={anchoBarra}
                  height={Math.max(alto, 2)}
                  rx="4"
                  fill={
                    positivo
                      ? "rgb(var(--grafico-positivo))"
                      : "rgb(var(--grafico-negativo))"
                  }
                >
                  {/* Una sola expresión, no cuatro pedazos: partido en
                      varios nodos de texto, el servidor y el cliente lo
                      arman distinto y React tira error de hidratación. */}
                  <title>
                    {`${f.label}: ${plata(f.total)} en ${f.dias} ${f.dias === 1 ? "día" : "días"}`}
                  </title>
                </rect>
              )}

              {/* El valor va escrito al lado de cada barra: son siete, se
                  leen todas, y así el número no queda escondido detrás de
                  un hover que en el celular no existe. */}
              <text
                x={centro}
                y={f.dias > 0 ? etiquetaY : cero - 8}
                textAnchor="middle"
                fontSize="11"
                fill={
                  f.dias === 0 ? "rgb(var(--grafico-eje))" : "rgb(var(--grafico-texto))"
                }
              >
                {f.dias === 0 ? "—" : plata(f.total)}
              </text>

              <text
                x={centro}
                y={ALTO - 8}
                textAnchor="middle"
                fontSize="11"
                fill="rgb(var(--grafico-texto))"
              >
                {f.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/* ---------- El bloque entero ---------- */

export function Estadisticas({
  diasTrading,
  diasJournal,
}: {
  diasTrading: DiaHome[];
  diasJournal: DiaJournal[];
}) {
  const stats = estadisticasDeDias(diasTrading);
  const racha = rachaDeEscritura(diasJournal);
  const efecto = efectoDeEscribir(diasJournal);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tarjeta
          titulo="Racha de escritura"
          valor={
            racha.dias > 0 ? `${racha.dias} ${racha.dias === 1 ? "día" : "días"}` : "—"
          }
          clase={racha.dias > 0 ? "text-emerald-400" : "text-neutral-600"}
          pie={
            racha.pendiente
              ? `Escribí el ${fechaCorta(racha.pendiente)} para arrancarla`
              : racha.dias > 0
                ? "Días operados seguidos, escritos"
                : undefined
          }
        />
        <Tarjeta
          titulo="Días en verde"
          valor={stats.ganadorPct === null ? "—" : porcentaje(stats.ganadorPct, 0)}
          clase={stats.ganadorPct === null ? "text-neutral-600" : undefined}
          pie={
            stats.operados > 0
              ? `${stats.ganadores}V · ${stats.perdedores}R de ${stats.operados}`
              : undefined
          }
        />
        <Tarjeta
          titulo="Día promedio"
          valor={stats.expectativa === null ? "—" : plata(stats.expectativa)}
          clase={stats.expectativa === null ? "text-neutral-600" : color(stats.expectativa)}
          pie={stats.operados > 0 ? "Lo que deja una jornada" : undefined}
        />
        <Tarjeta
          titulo="Mejor día"
          valor={stats.mejor ? plata(stats.mejor.monto) : "—"}
          clase={stats.mejor ? "text-emerald-400" : "text-neutral-600"}
          pie={stats.mejor ? fechaCorta(stats.mejor.fecha) : undefined}
        />
        <Tarjeta
          titulo="Peor día"
          valor={stats.peor ? plata(stats.peor.monto) : "—"}
          clase={stats.peor ? "text-rose-400" : "text-neutral-600"}
          pie={stats.peor ? fechaCorta(stats.peor.fecha) : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ¿Escribir sirve? */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm font-medium">¿Escribir te sirve?</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Cómo te fue el día después de escribir, contra el día después de no
            escribir.
          </p>

          {efecto.suficiente ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-500">Después de escribir</p>
                  <p
                    className={`mt-1 text-xl font-bold tabular-nums ${color(efecto.despuesDeEscribir.promedio)}`}
                  >
                    {plata(efecto.despuesDeEscribir.promedio)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {efecto.despuesDeEscribir.dias} días
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Después de no escribir</p>
                  <p
                    className={`mt-1 text-xl font-bold tabular-nums ${color(efecto.despuesDeNoEscribir.promedio)}`}
                  >
                    {plata(efecto.despuesDeNoEscribir.promedio)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {efecto.despuesDeNoEscribir.dias} días
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                Diferencia: {plata(efecto.diferencia)} por día. Ojo: esto es una
                relación, no una causa — quien viene ordenado escribe y además
                opera mejor, y las dos cosas pueden salir de lo mismo.
              </p>
            </>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-6 text-center text-sm text-neutral-500">
              Faltan {efecto.faltan} {efecto.faltan === 1 ? "día" : "días"} para
              poder compararlo. Con menos, el número es ruido y prefiero no
              mostrarlo.
            </p>
          )}
        </div>

        {/* Por día de la semana */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm font-medium">Por día de la semana</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Todo lo que dejó cada día, sumado.
          </p>
          <div className="mt-3">
            <PorDiaSemana dias={diasTrading} />
          </div>
        </div>
      </div>
    </div>
  );
}
