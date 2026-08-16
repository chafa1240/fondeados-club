"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarCuenta, type EstadoForm } from "@/app/(app)/cuentas/actions";
import {
  ESTADOS,
  ESTADO_INFO,
  FIRMS_SUGERIDAS,
  ddMontoDesdePct,
  ddPctDesdeMonto,
  type Cuenta,
} from "@/lib/cuentas";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500";

function Campo({
  label,
  ayuda,
  children,
}: {
  label: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-neutral-300">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-neutral-500">{ayuda}</span>}
    </label>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

function redondear(n: number) {
  return Math.round(n * 100) / 100;
}

export function ModalCuenta({
  cuenta,
  nombreSugerido,
  onCerrar,
}: {
  cuenta?: Cuenta;
  nombreSugerido: string;
  onCerrar: () => void;
}) {
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    guardarCuenta,
    {}
  );

  // Drawdown: los dos campos se mantienen sincronizados entre sí.
  const [tamano, setTamano] = useState(
    cuenta ? String(cuenta.tamano_cuenta) : ""
  );
  const [ddPct, setDdPct] = useState(
    cuenta?.drawdown_maximo_pct != null ? String(cuenta.drawdown_maximo_pct) : ""
  );
  const [ddMonto, setDdMonto] = useState(
    cuenta?.drawdown_maximo_monto != null
      ? String(cuenta.drawdown_maximo_monto)
      : ""
  );

  const tamanoNum = Number(tamano.replace(",", ".")) || 0;

  function cambiarTamano(v: string) {
    setTamano(v);
    const t = Number(v.replace(",", ".")) || 0;
    const p = Number(ddPct.replace(",", "."));
    if (t > 0 && Number.isFinite(p) && ddPct !== "") {
      setDdMonto(String(redondear(ddMontoDesdePct(t, p))));
    }
  }

  function cambiarDdPct(v: string) {
    setDdPct(v);
    const p = Number(v.replace(",", "."));
    if (v === "") return setDdMonto("");
    if (tamanoNum > 0 && Number.isFinite(p)) {
      setDdMonto(String(redondear(ddMontoDesdePct(tamanoNum, p))));
    }
  }

  function cambiarDdMonto(v: string) {
    setDdMonto(v);
    const m = Number(v.replace(",", "."));
    if (v === "") return setDdPct("");
    if (tamanoNum > 0 && Number.isFinite(m)) {
      setDdPct(String(redondear(ddPctDesdeMonto(tamanoNum, m))));
    }
  }

  // Cerrar al guardar bien, y con la tecla Escape.
  useEffect(() => {
    if (estado.ok) onCerrar();
  }, [estado.ok, onCerrar]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {cuenta ? `Editar ${cuenta.nombre}` : "Nueva cuenta"}
          </h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg border border-neutral-700 px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {cuenta && <input type="hidden" name="id" value={cuenta.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre">
              <input
                name="nombre"
                required
                defaultValue={cuenta?.nombre ?? nombreSugerido}
                className={INPUT}
              />
            </Campo>

            <Campo label="Firm">
              <input
                name="firm"
                required
                list="firms"
                placeholder="FTMO, Apex…"
                defaultValue={cuenta?.firm ?? ""}
                className={INPUT}
              />
              <datalist id="firms">
                {FIRMS_SUGERIDAS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </Campo>

            <Campo label="Tamaño de cuenta (USD)">
              <input
                name="tamano_cuenta"
                required
                inputMode="decimal"
                placeholder="50000"
                value={tamano}
                onChange={(e) => cambiarTamano(e.target.value)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Fecha de inicio">
              <input
                name="fecha_inicio"
                type="date"
                required
                defaultValue={
                  cuenta?.fecha_inicio ?? new Date().toISOString().slice(0, 10)
                }
                className={INPUT}
              />
            </Campo>

            <Campo label="Drawdown máximo (%)" ayuda="Se completa solo con el monto">
              <input
                name="drawdown_maximo_pct"
                inputMode="decimal"
                placeholder="10"
                value={ddPct}
                onChange={(e) => cambiarDdPct(e.target.value)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Drawdown máximo (USD)" ayuda="Se completa solo con el %">
              <input
                name="drawdown_maximo_monto"
                inputMode="decimal"
                placeholder="5000"
                value={ddMonto}
                onChange={(e) => cambiarDdMonto(e.target.value)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Profit split (%)">
              <input
                name="profit_split"
                inputMode="decimal"
                placeholder="80"
                defaultValue={cuenta?.profit_split ?? ""}
                className={INPUT}
              />
            </Campo>

            <Campo
              label="Objetivo de payout (USD)"
              ayuda="Ganancia que necesitás para cobrar"
            >
              <input
                name="objetivo_payout"
                inputMode="decimal"
                placeholder="3000"
                defaultValue={cuenta?.objetivo_payout ?? ""}
                className={INPUT}
              />
            </Campo>

            <Campo label="Balance actual (USD)" ayuda="Lo actualizás vos cuando quieras">
              <input
                name="balance_actual"
                inputMode="decimal"
                placeholder="Igual al tamaño de cuenta"
                defaultValue={cuenta?.balance_actual ?? ""}
                className={INPUT}
              />
            </Campo>

            <Campo label="Estado">
              <select
                name="estado"
                defaultValue={cuenta?.estado ?? "activa"}
                className={INPUT}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_INFO[e].label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Notas">
            <textarea
              name="notas"
              rows={3}
              defaultValue={cuenta?.notas ?? ""}
              className={INPUT}
            />
          </Campo>

          {estado.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {estado.error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <Guardar />
          </div>
        </form>
      </div>
    </div>
  );
}
