"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  actualizarBalance,
  cambiarEstado,
  eliminarCuenta,
  type EstadoForm,
} from "@/app/(app)/cuentas/actions";
import {
  ESTADOS_POR_TIPO,
  ESTADO_INFO,
  TIPO_INFO,
  anillo,
  chipDeCuenta,
  colchon,
  estadoAlDesarchivar,
  fechaCorta,
  pisoDrawdown,
  plata,
  porcentaje,
  salud,
  tieneRetiro,
  variacion,
  type Cuenta,
} from "@/lib/cuentas";

/* ---------- Anillo de progreso ---------- */

function Anillo({ pct }: { pct: number }) {
  const r = 26;
  const largo = 2 * Math.PI * r;
  const completo = pct >= 100;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-neutral-800"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={largo}
          strokeDashoffset={largo * (1 - pct / 100)}
          className={completo ? "stroke-emerald-400" : "stroke-emerald-500/80"}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/* ---------- Balance editable en línea ---------- */

function BotonBalance() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium transition hover:bg-emerald-500 disabled:opacity-50"
    >
      {pending ? "…" : "OK"}
    </button>
  );
}

function BalanceEditable({ cuenta }: { cuenta: Cuenta }) {
  const [editando, setEditando] = useState(false);
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    actualizarBalance,
    {}
  );

  useEffect(() => {
    if (estado.ok) setEditando(false);
  }, [estado.ok]);

  const v = variacion(cuenta);
  const positivo = v.monto >= 0;

  if (editando) {
    return (
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={cuenta.id} />
        <input
          name="balance_actual"
          inputMode="decimal"
          autoFocus
          defaultValue={cuenta.balance_actual}
          className="w-32 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm outline-none focus:border-emerald-500"
        />
        <BotonBalance />
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditando(true)}
        title="Actualizar balance"
        className="group flex items-baseline gap-2 text-left"
      >
        <span className="text-2xl font-semibold tracking-tight">
          {plata(cuenta.balance_actual)}
        </span>
        <span className="text-xs text-neutral-600 opacity-0 transition group-hover:opacity-100">
          editar
        </span>
      </button>
      <p
        className={`text-sm ${positivo ? "text-emerald-400" : "text-rose-400"}`}
      >
        {positivo ? "+" : "−"}
        {plata(Math.abs(v.monto))} ({positivo ? "+" : "−"}
        {porcentaje(Math.abs(v.pct))})
      </p>
    </div>
  );
}

/* ---------- Menú de la tarjeta ---------- */

function Menu({ cuenta, onEditar }: { cuenta: Cuenta; onEditar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [trabajando, empezar] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const archivada = cuenta.estado === "archivada";

  useEffect(() => {
    if (!abierto) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [abierto]);

  const item =
    "block w-full px-3 py-1.5 text-left text-sm text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Opciones"
        className="rounded-lg px-2 py-1 text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
      >
        ⋯
      </button>

      {abierto && (
        <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          <button
            className={item}
            onClick={() => {
              setAbierto(false);
              onEditar();
            }}
          >
            Editar
          </button>

          <p className="px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-neutral-600">
            Cambiar estado
          </p>
          {ESTADOS_POR_TIPO[cuenta.tipo]
            .filter((e) => e !== cuenta.estado)
            .map((e) => (
              <button
                key={e}
                className={item}
                disabled={trabajando}
                onClick={() =>
                  empezar(async () => {
                    await cambiarEstado(cuenta.id, e);
                    setAbierto(false);
                  })
                }
              >
                {ESTADO_INFO[e].label}
              </button>
            ))}

          <div className="my-1 border-t border-neutral-800" />
          <button
            className={item}
            disabled={trabajando}
            onClick={() =>
              empezar(async () => {
                await cambiarEstado(
                  cuenta.id,
                  archivada ? estadoAlDesarchivar(cuenta.tipo) : "archivada"
                );
                setAbierto(false);
              })
            }
          >
            {archivada ? "Desarchivar" : "Archivar"}
          </button>

          <div className="my-1 border-t border-neutral-800" />
          <button
            disabled={trabajando}
            className="block w-full px-3 py-1.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
            onClick={() => {
              if (
                !confirm(
                  `¿Eliminar "${cuenta.nombre}"? Sus payouts también se borran. No se puede deshacer.`
                )
              ) {
                return;
              }
              empezar(async () => {
                await eliminarCuenta(cuenta.id);
                setAbierto(false);
              });
            }}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Tarjeta ---------- */

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-200">{valor}</p>
    </div>
  );
}

export function TarjetaCuenta({
  cuenta,
  onEditar,
}: {
  cuenta: Cuenta;
  onEditar: () => void;
}) {
  const chip = chipDeCuenta(cuenta);
  const meta = anillo(cuenta);
  const esFondeada = tieneRetiro(cuenta.tipo);
  const piso = pisoDrawdown(cuenta);
  const c = colchon(cuenta);
  const s = salud(cuenta);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{cuenta.nombre}</h3>
            <span className="shrink-0 rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
              {TIPO_INFO[cuenta.tipo].label}
            </span>
          </div>
          <p className="truncate text-sm text-neutral-400">{cuenta.firm}</p>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${chip.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${chip.punto}`} />
            {chip.label}
          </span>
          <Menu cuenta={cuenta} onEditar={onEditar} />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <BalanceEditable cuenta={cuenta} />
        {meta !== null && (
          <div className="flex flex-col items-center">
            <Anillo pct={meta.pct} />
            <span className="mt-1 text-[11px] text-neutral-500">
              {meta.etiqueta}
            </span>
          </div>
        )}
      </div>

      {/* Qué falta para llegar al objetivo */}
      {meta !== null && (
        <p className="mt-3 text-xs text-neutral-500">
          {meta.falta === 0 ? (
            <span className="text-emerald-400">
              {esFondeada
                ? `Ya podés retirar ${plata(cuenta.objetivo_retiro)}`
                : "Objetivo alcanzado: ya pasaste la evaluación"}
            </span>
          ) : (
            <>
              Faltan <span className="text-neutral-300">{plata(meta.falta)}</span>{" "}
              {esFondeada
                ? `para retirar ${plata(cuenta.objetivo_retiro)}`
                : "para pasar la evaluación"}{" "}
              (balance {plata(meta.meta)})
            </>
          )}
        </p>
      )}

      {/* Colchón hasta el drawdown */}
      {c !== null && s !== null && (
        <p className="mt-1 text-xs text-neutral-500">
          Colchón hasta el drawdown:{" "}
          <span
            className={
              s === "critico"
                ? "text-rose-400"
                : s === "precaucion"
                  ? "text-amber-400"
                  : "text-emerald-400"
            }
          >
            {plata(c.monto)} ({porcentaje(c.pct)})
          </span>
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-800 pt-4">
        <Dato label="Balance base" valor={plata(cuenta.tamano_cuenta)} />
        <Dato
          label="Drawdown máx."
          valor={
            cuenta.drawdown_maximo_monto != null
              ? `${plata(cuenta.drawdown_maximo_monto)}${
                  cuenta.drawdown_maximo_pct != null
                    ? ` (${porcentaje(cuenta.drawdown_maximo_pct)})`
                    : ""
                }`
              : "—"
          }
        />
        {esFondeada ? (
          <>
            <Dato
              label="Profit split"
              valor={porcentaje(cuenta.profit_split, 0)}
            />
            <Dato
              label="Objetivo de retiro"
              valor={plata(cuenta.objetivo_retiro)}
            />
          </>
        ) : (
          <Dato
            label="Profit target"
            valor={
              cuenta.profit_target_monto != null
                ? `${plata(cuenta.profit_target_monto)}${
                    cuenta.profit_target_pct != null
                      ? ` (${porcentaje(cuenta.profit_target_pct)})`
                      : ""
                  }`
                : "—"
            }
          />
        )}
        <Dato label="No bajar de" valor={piso != null ? plata(piso) : "—"} />
        <Dato label="Inicio" valor={fechaCorta(cuenta.fecha_inicio)} />
      </div>

      {cuenta.notas && (
        <p className="mt-4 border-t border-neutral-800 pt-3 text-xs text-neutral-500">
          {cuenta.notas}
        </p>
      )}
    </div>
  );
}
