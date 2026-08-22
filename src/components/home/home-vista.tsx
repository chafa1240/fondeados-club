"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendario } from "./calendario";
import {
  anillo,
  chipDeCuenta,
  colchon,
  enJuego,
  fechaCorta,
  plata,
  retiroMaximoSeguro,
  salud,
  tieneRetiro,
  type Cuenta,
} from "@/lib/cuentas";
import { TIPO_MOVIMIENTO_INFO, type Movimiento } from "@/lib/movimientos";
import type { Resultado } from "@/lib/resultados";
import {
  armarMes,
  diasDeNeto,
  diasDeTrading,
  hoyLocal,
  mesDeFecha,
  MODOS_HOME,
  MODO_HOME_INFO,
  mesesConDatos,
  resumenHome,
  type ModoHome,
} from "@/lib/home";

/**
 * El Home: la pantalla que ves al entrar.
 *
 * Orden deliberado, sacado del research de la competencia: primero los
 * números grandes, después el calendario, y recién abajo las cuentas y los
 * avisos. **No es una lista de alertas** — abrir la app con una pared de
 * advertencias es la forma más rápida de que dejes de mirarlas.
 */

/** Qué cuentas entran en los números. */
type Seleccion = "en_juego" | "todas" | (string & {});

const VERDE = "text-emerald-400";
const ROJO = "text-rose-400";

function color(n: number) {
  return n > 0 ? VERDE : n < 0 ? ROJO : "text-neutral-300";
}

function Numero({
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

export function HomeVista({
  cuentas,
  resultados,
  movimientos,
}: {
  /** Con el balance y el pico ya calculados por la página. */
  cuentas: Cuenta[];
  resultados: Resultado[];
  movimientos: Movimiento[];
}) {
  const [modo, setModo] = useState<ModoHome>("trading");
  const [seleccion, setSeleccion] = useState<Seleccion>("en_juego");
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);

  // "Hoy" lo decide el navegador: el servidor corre en UTC y de noche eso
  // ya es mañana. Arranca en null para que el HTML del servidor y el del
  // cliente sean iguales, y se completa al montar.
  const [hoy, setHoy] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);

  useEffect(() => {
    const d = hoyLocal();
    setHoy(d);
    setMes((m) => m ?? mesDeFecha(d));
  }, []);

  const vivas = useMemo(() => cuentas.filter((c) => enJuego(c.estado)), [cuentas]);

  const nombres = useMemo(
    () => new Map(cuentas.map((c) => [c.id, c.nombre])),
    [cuentas]
  );

  /** Los ids que dejan pasar los datos, según el filtro de arriba. */
  const ids = useMemo(() => {
    if (seleccion === "todas") return new Set(cuentas.map((c) => c.id));
    if (seleccion === "en_juego") return new Set(vivas.map((c) => c.id));
    return new Set([seleccion]);
  }, [seleccion, cuentas, vivas]);

  const unaSola = seleccion !== "todas" && seleccion !== "en_juego";

  const dias = useMemo(() => {
    if (modo === "trading") {
      return diasDeTrading(resultados.filter((r) => ids.has(r.cuenta_id)));
    }

    // Los gastos generales (data feed, plataforma) no son de ninguna
    // cuenta: entran siempre salvo que estés mirando una sola.
    return diasDeNeto(
      movimientos.filter((m) =>
        m.cuenta_id === null ? !unaSola : ids.has(m.cuenta_id)
      )
    );
  }, [modo, resultados, movimientos, ids, unaSola]);

  const resumen = useMemo(
    () => (hoy ? resumenHome(dias, hoy) : null),
    [dias, hoy]
  );

  const calendario = useMemo(
    () => (mes && hoy ? armarMes(mes, dias, hoy) : null),
    [mes, dias, hoy]
  );

  const meses = useMemo(() => mesesConDatos(dias), [dias]);

  /** Lo que pasó el día que abriste, ya listo para listar. */
  const detalle = useMemo(() => {
    if (!diaAbierto) return null;

    if (modo === "trading") {
      return resultados
        .filter((r) => r.fecha === diaAbierto && ids.has(r.cuenta_id))
        .map((r) => ({
          id: r.id,
          cuenta: nombres.get(r.cuenta_id) ?? "—",
          monto: r.monto,
          detalle: r.notas,
        }));
    }

    return movimientos
      .filter(
        (m) =>
          m.fecha === diaAbierto &&
          (m.cuenta_id === null ? !unaSola : ids.has(m.cuenta_id))
      )
      .map((m) => ({
        id: m.id,
        cuenta: m.cuenta_id
          ? (nombres.get(m.cuenta_id) ?? "—")
          : "General",
        monto: m.tipo === "retiro" ? m.monto : -m.monto,
        detalle: m.detalle ?? TIPO_MOVIMIENTO_INFO[m.tipo].label,
      }));
  }, [diaAbierto, modo, resultados, movimientos, ids, unaSola, nombres]);

  /* ---------- Avisos ---------- */

  // Pocos y solo cuando aplican: una cuenta al borde del piso y una que ya
  // puede retirar. `retiroMaximoSeguro()` estaba escrita desde el Paso 5 y
  // se había sacado de la tarjeta por ruidosa; como aviso puntual es
  // exactamente lo que hace falta.
  const avisos = useMemo(() => {
    const lista: { id: string; tono: "malo" | "bueno"; texto: string }[] = [];

    for (const c of vivas) {
      if (salud(c) === "critico") {
        const col = colchon(c);
        lista.push({
          id: `critico-${c.id}`,
          tono: "malo",
          texto: `${c.nombre} está en crítico: ${plata(col?.monto ?? 0)} hasta el piso.`,
        });
        continue;
      }

      const a = anillo(c);
      if (!a || a.pct < 100) continue;

      if (tieneRetiro(c.tipo)) {
        const max = retiroMaximoSeguro(c);
        lista.push({
          id: `retiro-${c.id}`,
          tono: "bueno",
          texto:
            max === null
              ? `${c.nombre} llegó al objetivo de retiro.`
              : `${c.nombre} llegó al objetivo: podés retirar hasta ${plata(max)} sin quedar en precaución.`,
        });
      } else if (c.estado !== "passed") {
        lista.push({
          id: `target-${c.id}`,
          tono: "bueno",
          texto: `${c.nombre} llegó al profit target. Falta marcarla como pasada.`,
        });
      }
    }

    return lista.slice(0, 4);
  }, [vivas]);

  /* ---------- Sin nada cargado ---------- */

  if (cuentas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-10 text-center">
        <p className="text-sm text-neutral-300">
          Todavía no cargaste ninguna cuenta.
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Cargá tu primera fondeada o evaluación y acá vas a ver tus números,
          el calendario del mes y el estado de cada cuenta.
        </p>
        <Link
          href="/cuentas"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Ir a Cuentas
        </Link>
      </div>
    );
  }

  const infoModo = MODO_HOME_INFO[modo];

  return (
    <div className="space-y-6">
      {/* ---------- Controles ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          {MODOS_HOME.map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              title={MODO_HOME_INFO[m].ayuda}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                modo === m
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {MODO_HOME_INFO[m].label}
            </button>
          ))}
        </div>

        <select
          value={seleccion}
          onChange={(e) => {
            setSeleccion(e.target.value);
            setDiaAbierto(null);
          }}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300 outline-none focus:border-neutral-700"
        >
          <option value="en_juego">Todas las cuentas en juego</option>
          <option value="todas">Todas, incluidas las cerradas</option>
          <optgroup label="Una sola">
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.firm}
                {enJuego(c.estado) ? "" : " (cerrada)"}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <p className="-mt-3 text-xs text-neutral-500">
        {infoModo.ayuda}
        {modo === "neto" && seleccion === "en_juego" && (
          <>
            {" "}
            · Las cuentas cerradas no entran: para el neto real de todo lo
            que invertiste, elegí <em>Todas, incluidas las cerradas</em>.
          </>
        )}
      </p>

      {/* ---------- Los números ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero
          titulo="Hoy"
          valor={resumen?.hoy ? plata(resumen.hoy.monto) : "—"}
          clase={resumen?.hoy ? color(resumen.hoy.monto) : "text-neutral-600"}
          pie={
            resumen?.hoy
              ? resumen.hoy.entradas > 1
                ? `${resumen.hoy.entradas} entradas`
                : undefined
              : resumen?.ultimo
                ? `Último: ${fechaCorta(resumen.ultimo.fecha)}`
                : "Sin días cargados"
          }
        />
        <Numero
          titulo="Este mes"
          valor={resumen ? plata(resumen.mes) : "—"}
          clase={resumen ? color(resumen.mes) : undefined}
        />
        <Numero
          titulo="Acumulado"
          valor={resumen ? plata(resumen.total) : "—"}
          clase={resumen ? color(resumen.total) : undefined}
          pie={resumen ? `${resumen.dias} días cargados` : undefined}
        />
        <Numero
          titulo="Racha"
          valor={
            resumen && resumen.racha.dias > 0
              ? `${resumen.racha.dias} ${resumen.racha.dias === 1 ? "día" : "días"}`
              : "—"
          }
          clase={
            resumen && resumen.racha.dias > 0
              ? resumen.racha.ganadora
                ? VERDE
                : ROJO
              : "text-neutral-600"
          }
          pie={
            resumen && resumen.dias > 0
              ? `${resumen.ganadores} en verde · ${resumen.perdedores} en rojo`
              : undefined
          }
        />
      </div>

      {/* ---------- El calendario ---------- */}
      {calendario && (
        <div>
          <Calendario
            datos={calendario}
            onMes={(m) => {
              setMes(m);
              setDiaAbierto(null);
            }}
            onDia={(f) => setDiaAbierto((v) => (v === f ? null : f))}
            // Sin nada cargado se puede navegar libre; con datos, el tope es
            // el primer mes que tiene algo: más atrás son meses en blanco.
            puedeAtras={meses.length === 0 || calendario.mes > meses[0]}
            puedeAdelante={hoy !== null && calendario.mes < mesDeFecha(hoy)}
          />

          {diaAbierto && detalle && detalle.length > 0 && (
            <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{fechaCorta(diaAbierto)}</p>
                <button
                  onClick={() => setDiaAbierto(null)}
                  className="text-xs text-neutral-500 hover:text-neutral-300"
                >
                  Cerrar
                </button>
              </div>
              <ul className="divide-y divide-neutral-800/70 text-sm">
                {detalle.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="min-w-0">
                      <span className="text-neutral-300">{d.cuenta}</span>
                      {d.detalle && (
                        <span className="ml-2 text-xs text-neutral-500">{d.detalle}</span>
                      )}
                    </span>
                    <span className={`tabular-nums ${color(d.monto)}`}>
                      {plata(d.monto, 2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ---------- Avisos ---------- */}
      {avisos.length > 0 && (
        <div className="space-y-2">
          {avisos.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border px-3 py-2 text-sm ${
                a.tono === "malo"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {a.texto}
            </div>
          ))}
        </div>
      )}

      {/* ---------- Las cuentas en juego ---------- */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Cuentas en juego</p>
          <Link
            href="/cuentas"
            className="text-xs text-neutral-400 transition hover:text-neutral-200"
          >
            Ver todas →
          </Link>
        </div>

        {vivas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 px-3 py-6 text-center text-sm text-neutral-500">
            No tenés ninguna cuenta activa ahora mismo.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800/70">
            {vivas.map((c) => {
              const chip = chipDeCuenta(c);
              const col = colchon(c);
              const a = anillo(c);

              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${chip.punto}`} />
                    <span className="truncate font-medium">{c.nombre}</span>
                    <span className="truncate text-xs text-neutral-500">{c.firm}</span>
                  </span>

                  <span className="flex items-center gap-4 tabular-nums">
                    <span className="text-neutral-300">{plata(c.balance_actual)}</span>
                    <span
                      className="w-24 text-right text-xs text-neutral-500"
                      title="Colchón hasta el piso del drawdown"
                    >
                      {col ? `${plata(col.monto)} de colchón` : "sin drawdown"}
                    </span>
                    <span className="w-20 text-right text-xs text-neutral-500">
                      {a ? `${Math.round(a.pct)}% ${a.etiqueta}` : "—"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
