"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarGasto, type EstadoForm } from "@/app/(app)/funding-manager/actions";
import {
  CATEGORIAS,
  CATEGORIA_INFO,
  type Categoria,
  type Gasto,
} from "@/lib/movimientos";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600";

/** Lo mínimo que necesita el selector de cuenta. */
export type CuentaBreve = {
  id: string;
  nombre: string;
  firm: string;
  /** Hace falta para calcular el neto de un retiro. */
  profit_split?: number | null;
};

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

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Guardando…" : texto}
    </button>
  );
}

export function ModalGasto({
  gasto,
  cuentas,
  /**
   * Cuando el modal se abre desde la tarjeta de una cuenta, la cuenta ya
   * está decidida y el selector no se muestra: para eso se abrió ahí.
   */
  cuentaFija,
  /** Nombres ya usados antes, para no volver a escribirlos. */
  nombresUsados = [],
  onCerrar,
}: {
  gasto?: Gasto;
  cuentas: CuentaBreve[];
  cuentaFija?: CuentaBreve;
  nombresUsados?: string[];
  onCerrar: () => void;
}) {
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    guardarGasto,
    {}
  );

  const [categoria, setCategoria] = useState<Categoria>(
    gasto?.categoria ?? (cuentaFija ? "reset" : "software_suscripcion")
  );

  useEffect(() => {
    if (estado.ok) onCerrar();
  }, [estado.ok, onCerrar]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const esEdicion = !!gasto;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {esEdicion ? "Editar gasto" : "Nuevo gasto"}
            </h2>
            {cuentaFija && (
              <p className="mt-1 text-sm text-neutral-400">
                {cuentaFija.nombre} · {cuentaFija.firm}
              </p>
            )}
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg border border-neutral-700 px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {esEdicion && <input type="hidden" name="id" value={gasto!.id} />}
          {cuentaFija && (
            <input type="hidden" name="cuenta_id" value={cuentaFija.id} />
          )}

          <Campo label="Categoría" ayuda={CATEGORIA_INFO[categoria].ayuda}>
            <select
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className={INPUT}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_INFO[c].label}
                </option>
              ))}
            </select>
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Monto (USD)">
              <input
                name="monto"
                required
                inputMode="decimal"
                autoFocus
                placeholder="150"
                defaultValue={gasto ? String(gasto.monto) : ""}
                className={INPUT}
              />
            </Campo>

            <Campo label="Fecha">
              <input
                name="fecha"
                type="date"
                defaultValue={gasto?.fecha ?? new Date().toISOString().slice(0, 10)}
                className={INPUT}
              />
            </Campo>
          </div>

          {/* Sin cuenta fija, el gasto puede ser de una cuenta o general. */}
          {!cuentaFija && (
            <Campo
              label="Cuenta"
              ayuda="Dejalo en General si el gasto no es de una cuenta puntual (ej. el data feed)"
            >
              <select
                name="cuenta_id"
                defaultValue={gasto?.cuenta_id ?? ""}
                className={INPUT}
              >
                <option value="">General (no es de ninguna cuenta)</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} · {c.firm}
                  </option>
                ))}
              </select>
            </Campo>
          )}

          {/* El nombre es lo que distingue dos gastos de la misma
              categoría: "Rithmic" y "TradingView" son los dos
              software/suscripción. Los ya usados quedan sugeridos. */}
          <Campo
            label="Nombre"
            ayuda="Para distinguirlo dentro de la categoría (ej. Rithmic, TradingView)"
          >
            <input
              name="descripcion"
              list="nombres-de-gasto"
              placeholder="Opcional"
              defaultValue={gasto?.descripcion ?? ""}
              className={INPUT}
            />
            <datalist id="nombres-de-gasto">
              {nombresUsados.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Campo>

          <p className="text-xs text-neutral-500">
            Un gasto sale de tu bolsillo: no toca el balance de la cuenta.
          </p>

          {estado.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {estado.error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <Guardar texto={esEdicion ? "Guardar" : "Registrar gasto"} />
          </div>
        </form>
      </div>
    </div>
  );
}
