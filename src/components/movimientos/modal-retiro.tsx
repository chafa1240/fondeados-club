"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  actualizarRetiro,
  registrarRetiro,
  type EstadoForm,
} from "@/app/(app)/cuentas/actions";
import type { Retiro } from "@/lib/cuentas";
import type { CuentaBreve } from "./modal-gasto";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500";

function Boton({ texto }: { texto: string }) {
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

/**
 * Alta y edición de retiros desde el Funding Manager.
 *
 * Las dos llaman a las MISMAS actions que la tarjeta de la cuenta
 * (`registrarRetiro` / `actualizarRetiro`), que mueven `payouts` y el
 * balance en la misma operación. Dos puertas de entrada, una sola cocina:
 * si esto fuera un alta paralela, tarde o temprano una de las dos se
 * olvidaría de tocar el balance.
 */
export function ModalRetiro({
  fondeadas,
  retiro,
  /** Nombre de la cuenta del retiro que se está editando. */
  cuentaNombre,
  onCerrar,
}: {
  fondeadas: CuentaBreve[];
  retiro?: Retiro;
  cuentaNombre?: string;
  onCerrar: () => void;
}) {
  const esEdicion = !!retiro;

  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    esEdicion ? actualizarRetiro : registrarRetiro,
    {}
  );

  useEffect(() => {
    if (estado.ok) onCerrar();
  }, [estado.ok, onCerrar]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const sinCuentas = !esEdicion && fondeadas.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {esEdicion ? "Editar retiro" : "Nuevo retiro"}
            </h2>
            {esEdicion && cuentaNombre && (
              <p className="mt-1 text-sm text-neutral-400">{cuentaNombre}</p>
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

        {sinCuentas ? (
          <p className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-4 text-sm text-neutral-400">
            Todavía no tenés cuentas fondeadas. Un retiro siempre sale de una.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            {esEdicion && <input type="hidden" name="id" value={retiro!.id} />}

            {/* Al editar no se puede cambiar de cuenta: sería mover plata de
                un balance a otro. Para eso, borrar y volver a cargarlo. */}
            {!esEdicion && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-neutral-300">
                  Cuenta
                </span>
                <select name="cuenta_id" required className={INPUT}>
                  {fondeadas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} · {c.firm}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm text-neutral-300">
                  Monto retirado (USD)
                </span>
                <input
                  name="monto"
                  required
                  inputMode="decimal"
                  autoFocus
                  placeholder="500"
                  defaultValue={retiro ? String(retiro.monto) : ""}
                  className={INPUT}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm text-neutral-300">Fecha</span>
                <input
                  name="fecha"
                  type="date"
                  defaultValue={
                    retiro?.fecha ?? new Date().toISOString().slice(0, 10)
                  }
                  className={INPUT}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">Notas</span>
              <input
                name="notas"
                placeholder="Opcional"
                defaultValue={retiro?.notas ?? ""}
                className={INPUT}
              />
            </label>

            <p className="text-xs text-neutral-500">
              {esEdicion
                ? "El balance de la cuenta se corrige por la diferencia."
                : "El monto se descuenta del balance de la cuenta."}
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
              <Boton texto={esEdicion ? "Guardar" : "Registrar retiro"} />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
