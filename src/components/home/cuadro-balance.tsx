"use client";

import { useEffect, useMemo, useState } from "react";
import { enJuego, fechaCorta, plata, porcentaje, type Cuenta, type Tipo } from "@/lib/cuentas";
import { hoyLocal } from "@/lib/home";

/**
 * Balance de las cuentas en juego: con cuánto arrancó el período (semana,
 * mes o un día puntual de esta semana), cuánto tienen hoy y cómo van.
 * Plan en `docs/PLAN-CUADRO-BALANCE.md`.
 *
 * Fondeadas y evaluaciones nunca se suman juntas (misma regla que los
 * números de trading del Home): un dólar de evaluación es simulado.
 */

type Serie = { fecha: string; balance: number }[];

const OPCIONES_TIPO: { valor: Tipo; label: string }[] = [
  { valor: "fondeada", label: "Fondeadas" },
  { valor: "challenge", label: "Evaluaciones" },
];

/** "semana" | "mes" | una fecha ISO (un día de esta semana). */
type Desde = "semana" | "mes" | string;

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

function color(n: number) {
  return n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-neutral-300";
}

function signo(n: number) {
  return n > 0 ? "+" : n < 0 ? "−" : "";
}

/** Suma días a una fecha ISO sin pasar por la zona horaria local. */
function sumarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** El lunes de la semana de `iso` (sábado y domingo cuentan para la que termina). */
function lunesDe(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDias(iso, dia === 0 ? -6 : 1 - dia);
}

/**
 * Balance con el que la cuenta **arrancó** el día `fecha`: el cierre del
 * último día anterior. Si la cuenta todavía no existía, su balance de
 * arranque (el primer punto de la curva).
 */
function balanceAlInicio(serie: Serie | undefined, fecha: string, respaldo: number) {
  if (!serie || serie.length === 0) return respaldo;
  let valor = serie[0].balance;
  for (const p of serie) {
    if (p.fecha < fecha) valor = p.balance;
    else break;
  }
  return valor;
}

export function CuadroBalance({
  cuentas,
  series,
}: {
  cuentas: Cuenta[];
  series: Record<string, Serie>;
}) {
  const [tipo, setTipo] = useState<Tipo>("fondeada");
  const [desde, setDesde] = useState<Desde>("semana");

  // "Hoy" lo decide el navegador (el servidor corre en UTC).
  const [hoy, setHoy] = useState<string | null>(null);
  useEffect(() => setHoy(hoyLocal()), []);

  const lunes = hoy ? lunesDe(hoy) : null;
  const diasSemana = lunes ? DIAS.map((label, i) => ({ label, fecha: sumarDias(lunes, i) })) : [];

  /** La fecha desde la que se mide. */
  const fechaDesde = !hoy || !lunes
    ? null
    : desde === "semana"
      ? lunes
      : desde === "mes"
        ? `${hoy.slice(0, 7)}-01`
        : desde;

  const lista = useMemo(
    () => cuentas.filter((c) => c.tipo === tipo && enJuego(c.estado)),
    [cuentas, tipo]
  );

  const filas = useMemo(() => {
    if (!fechaDesde) return [];
    return lista.map((c) => {
      const inicio = balanceAlInicio(series[c.id], fechaDesde, c.tamano_cuenta);
      const monto = c.balance_actual - inicio;
      return { c, inicio, monto, pct: inicio ? (monto / inicio) * 100 : 0 };
    });
  }, [lista, series, fechaDesde]);

  const total = useMemo(() => {
    const balance = filas.reduce((a, f) => a + f.c.balance_actual, 0);
    const inicio = filas.reduce((a, f) => a + f.inicio, 0);
    const monto = balance - inicio;
    return { balance, inicio, monto, pct: inicio ? (monto / inicio) * 100 : 0 };
  }, [filas]);

  const chip = (activo: boolean, deshabilitado = false) =>
    `rounded-md px-2.5 py-1 text-xs transition ${
      activo
        ? "bg-neutral-800 text-neutral-100"
        : deshabilitado
          ? "cursor-not-allowed text-neutral-700"
          : "text-neutral-400 hover:text-neutral-200"
    }`;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Balance de tus cuentas</p>
        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          {OPCIONES_TIPO.map((o) => (
            <button key={o.valor} onClick={() => setTipo(o.valor)} className={chip(tipo === o.valor)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desde cuándo se mide el inicio */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          <button onClick={() => setDesde("mes")} className={chip(desde === "mes")}>
            Mes
          </button>
          <button onClick={() => setDesde("semana")} className={chip(desde === "semana")}>
            Semana
          </button>
        </div>
        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          {diasSemana.map((d) => {
            const futuro = hoy !== null && d.fecha > hoy;
            return (
              <button
                key={d.fecha}
                disabled={futuro}
                title={futuro ? "Todavía no llegó" : `Desde el ${fechaCorta(d.fecha)}`}
                onClick={() => setDesde(d.fecha)}
                className={chip(desde === d.fecha, futuro)}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-6 text-center text-sm text-neutral-500">
          No tenés {tipo === "fondeada" ? "fondeadas" : "evaluaciones"} en juego ahora mismo.
        </p>
      ) : !fechaDesde ? null : (
        <>
          {/* Los tres números: inicio y balance del mismo tamaño, el inicio en gris */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-neutral-500">Inicio · {fechaCorta(fechaDesde)}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-neutral-400 sm:text-2xl">
                {plata(total.inicio)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">
                {plata(total.balance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Cómo van</p>
              <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${color(total.monto)}`}>
                {signo(total.monto)}
                {plata(Math.abs(total.monto))}
              </p>
              <p className={`text-xs tabular-nums ${color(total.monto)}`}>
                {signo(total.pct)}
                {porcentaje(Math.abs(total.pct))}
              </p>
            </div>
          </div>

          {/* De dónde sale el total */}
          <ul className="mt-4 divide-y divide-neutral-800/70 border-t border-neutral-800 text-sm">
            {filas.map(({ c, inicio, monto, pct }) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium">{c.nombre}</span>
                  <span className="ml-2 text-xs text-neutral-500">{c.firm}</span>
                </span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-neutral-400">{plata(inicio)}</span>
                  <span className="text-neutral-600">→</span>
                  <span className="text-neutral-300">{plata(c.balance_actual)}</span>
                  <span className={`w-32 whitespace-nowrap text-right text-xs ${color(monto)}`}>
                    {signo(monto)}
                    {plata(Math.abs(monto))} ({signo(pct)}
                    {porcentaje(Math.abs(pct))})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
