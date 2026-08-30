"use client";

import { useState } from "react";
import { Carrusel } from "@/components/carrusel";
import { fechaCorta, plata, porcentaje } from "@/lib/cuentas";
import type { DiaHome } from "@/lib/home";
import {
  estadisticasDeDias,
  estadisticasDeOperaciones,
  porDiaSemana,
  porSentido,
  porSesion,
  type ResumenSentido,
} from "@/lib/estadisticas";
import {
  SENTIDO_INFO,
  SESION_INFO,
  type Resultado,
  type Sentido,
  type Sesion,
} from "@/lib/resultados";

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
    <div className="w-40 shrink-0 snap-start rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:w-44">
      <p className="text-xs text-neutral-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${clase ?? ""}`}>
        {valor}
      </p>
      {pie && <p className="mt-0.5 text-xs text-neutral-500">{pie}</p>}
    </div>
  );
}

/**
 * Las tarjetas van en una sola fila que se corre al costado.
 *
 * Estuvieron un rato partidas en dos grillas —"por operación" y "por
 * día"— y esa división era del cálculo, no de la pregunta: uno mira los
 * números seguidos. El scroll y las flechas viven en `Carrusel`, que
 * también usa el Funding Manager.
 */
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

/* ---------- Long vs. short ---------- */

function Lado({
  sentido,
  datos,
}: {
  sentido: Sentido;
  datos: ResumenSentido;
}) {
  const info = SENTIDO_INFO[sentido];

  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span aria-hidden>{info.flecha}</span>
        {info.label}
      </p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color(datos.total)}`}>
        {plata(datos.total)}
      </p>
      <p className="text-xs text-neutral-500">
        {datos.entradas === 0
          ? "Sin operaciones"
          : `${datos.entradas} op · ${porcentaje(datos.ganadorPct ?? 0, 0)} en verde`}
      </p>
      {datos.promedio !== null && (
        <p className="text-xs text-neutral-500">
          {plata(datos.promedio)} por operación
        </p>
      )}
    </div>
  );
}

/**
 * La barra que compara los dos lados.
 *
 * Reparte el ancho por el **valor absoluto** de cada lado: la pregunta es
 * cuánto pesa cada uno, y un short que perdió $500 pesa lo mismo que un
 * long que ganó $500 — lo que cambia es el color, no el tamaño. Un lado en
 * cero no dibuja nada.
 */
function Balanza({ long, short }: { long: number; short: number }) {
  const a = Math.abs(long);
  const b = Math.abs(short);
  if (a + b === 0) return null;

  const pctLong = (a / (a + b)) * 100;

  const tono = (n: number) =>
    n >= 0 ? "bg-[rgb(var(--grafico-positivo))]" : "bg-[rgb(var(--grafico-negativo))]";

  return (
    <div className="mt-4">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-neutral-800">
        <div className={tono(long)} style={{ width: `${pctLong}%` }} />
        <div className={tono(short)} style={{ width: `${100 - pctLong}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>▲ Long</span>
        <span>Short ▼</span>
      </div>
    </div>
  );
}

/* ---------- Por sesión ---------- */

/**
 * Una plaza y lo que dejó.
 *
 * La barra se mide contra **la sesión que más movió en valor absoluto**,
 * no contra el total: si una plaza dejó $900 y otra −$100, lo que se
 * quiere ver es que una pesa nueve veces más que la otra. Contra el total
 * neto ($800) la segunda barra saldría desproporcionada y una plaza que
 * perdió más de lo que ganó el conjunto se saldría de la caja.
 */
function FilaSesion({
  sesion,
  datos,
  tope,
}: {
  sesion: Sesion;
  datos: ResumenSentido;
  tope: number;
}) {
  const info = SESION_INFO[sesion];
  const ancho = tope === 0 ? 0 : (Math.abs(datos.total) / tope) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-neutral-500">{info.label}</p>
        <p className={`text-sm font-semibold tabular-nums ${color(datos.total)}`}>
          {datos.entradas === 0 ? "—" : plata(datos.total)}
        </p>
      </div>

      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={
            datos.total >= 0
              ? "h-full bg-[rgb(var(--grafico-positivo))]"
              : "h-full bg-[rgb(var(--grafico-negativo))]"
          }
          style={{ width: `${ancho}%` }}
        />
      </div>

      <p className="mt-1 text-xs text-neutral-500">
        {datos.entradas === 0
          ? "Sin operaciones"
          : `${datos.entradas} op · ${porcentaje(datos.ganadorPct ?? 0, 0)} en verde · ${plata(datos.promedio ?? 0)} por op`}
      </p>
    </div>
  );
}

/* ---------- El bloque entero ---------- */

export function Estadisticas({
  diasTrading,
  entradas,
}: {
  diasTrading: DiaHome[];
  /**
   * Las entradas sueltas, no los días: el sentido, el win rate y el profit
   * factor son de la operación. Un día con un long y un short no tiene un
   * solo lado.
   */
  entradas: Resultado[];
}) {
  const stats = estadisticasDeDias(diasTrading);
  const ops = estadisticasDeOperaciones(entradas);
  const lados = porSentido(entradas);
  const plazas = porSesion(entradas);
  const topeSesion = Math.max(
    ...plazas.sesiones.map((p) => Math.abs(p.datos.total)),
    0,
  );

  return (
    <div className="space-y-4">
      <Carrusel etiqueta="estadísticas">
        <Tarjeta
          titulo="P&L"
          valor={plata(ops.pnl)}
          clase={ops.operaciones === 0 ? "text-neutral-600" : color(ops.pnl)}
          pie={
            ops.operaciones > 0
              ? `${plata(ops.bruto.ganado)} ganados · ${plata(ops.bruto.perdido)} perdidos`
              : undefined
          }
        />
        <Tarjeta
          titulo="Win rate"
          valor={ops.winRate === null ? "—" : porcentaje(ops.winRate, 0)}
          clase={ops.winRate === null ? "text-neutral-600" : undefined}
          pie={
            ops.operaciones > 0
              ? `${ops.ganadoras}V · ${ops.perdedoras}R de ${ops.operaciones} op`
              : undefined
          }
        />
        {/* Debajo de 1 estás perdiendo: por cada dólar que ganás, perdés
            más de uno. Por eso el color se corta ahí y no en cero. */}
        <Tarjeta
          titulo="Profit factor"
          valor={ops.profitFactor === null ? "—" : ops.profitFactor.toFixed(2)}
          clase={
            ops.profitFactor === null
              ? "text-neutral-600"
              : ops.profitFactor >= 1
                ? "text-emerald-400"
                : "text-rose-400"
          }
          pie={
            ops.profitFactor === null
              ? ops.operaciones > 0
                ? "Todavía ninguna perdedora"
                : undefined
              : "Ganado sobre perdido"
          }
        />
        <Tarjeta
          titulo="Operaciones"
          valor={String(ops.operaciones)}
          clase={ops.operaciones === 0 ? "text-neutral-600" : undefined}
          pie={
            ops.promedio !== null
              ? `${plata(ops.promedio)} promedio`
              : undefined
          }
        />
        <Tarjeta
          titulo="Días ganadores"
          valor={stats.ganadorPct === null ? "—" : porcentaje(stats.ganadorPct, 0)}
          clase={stats.ganadorPct === null ? "text-neutral-600" : undefined}
          pie={
            stats.operados > 0
              ? `${stats.ganadores}V · ${stats.perdedores}R de ${stats.operados} días`
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
      </Carrusel>

      {/* La salvedad va una sola vez, acá, y no repetida en cada tarjeta. */}
      <p className="text-xs text-neutral-600">
        Las tres primeras cuentan operaciones cargadas —la misma orden
        replicada en varias cuentas suma una vez por cuenta—; las de días
        cuentan jornadas.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Long vs. short */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm font-medium">Long vs. short</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Cuánto dejó cada lado, sumando todas las operaciones cargadas.
          </p>

          {lados.vacio ? (
            <p className="mt-4 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-6 text-center text-sm text-neutral-500">
              Todavía no marcaste ninguna operación como long o short. El
              selector está al cargar el resultado del día — desde acá mismo o
              desde la tarjeta de la cuenta.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Lado sentido="long" datos={lados.long} />
                <Lado sentido="short" datos={lados.short} />
              </div>

              <Balanza long={lados.long.total} short={lados.short.total} />

              <p className="mt-3 text-xs text-neutral-500">
                Cuenta operaciones cargadas, no jornadas: el mismo trade
                replicado en varias cuentas suma una vez por cuenta, que es lo
                correcto para la plata.
                {lados.sinMarcar > 0
                  ? ` Quedan ${lados.sinMarcar} sin marcar, afuera de los dos.`
                  : ""}
              </p>
            </>
          )}
        </div>

        {/* Por sesión */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm font-medium">Por sesión</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Cuánto dejó cada plaza, sumando todas las operaciones cargadas.
          </p>

          {plazas.vacio ? (
            <p className="mt-4 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-6 text-center text-sm text-neutral-500">
              Todavía no marcaste la sesión de ninguna operación. El selector
              está al cargar el resultado del día — desde acá mismo o desde la
              tarjeta de la cuenta.
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {plazas.sesiones.map((p) => (
                  <FilaSesion
                    key={p.sesion}
                    sesion={p.sesion}
                    datos={p.datos}
                    tope={topeSesion}
                  />
                ))}
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                Cada operación cuenta en una sola plaza: la de cierre. Si
                marcaste dos, la plata va a la que abrió después.
                {plazas.sinMarcar > 0
                  ? ` Quedan ${plazas.sinMarcar} sin sesión, afuera de las tres.`
                  : ""}
              </p>
            </>
          )}
        </div>

        {/* Por día de la semana */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 lg:col-span-2">
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
