"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  actualizarCampoCuenta,
  type EstadoForm,
} from "@/app/(app)/funding-manager/actions";
import { CAMPO_CUENTA_INFO, type CampoCuenta } from "@/lib/movimientos";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500";

function Boton() {
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

/**
 * Edita, desde la lista de movimientos, uno de los tres números que viven
 * en la cuenta: precio de la evaluación, fee de activación y retiros
 * previos. Escribe directo en `cuentas_fondeo`, así que el cambio se ve
 * también en la tarjeta de la cuenta.
 *
 * La fecha no se edita acá a propósito: estos movimientos usan la fecha de
 * inicio de la cuenta, y cambiarla sería cambiarle el arranque a la cuenta
 * entera. Eso se hace en el modal de la cuenta.
 */
export function ModalCampoCuenta({
  campo,
  cuentaId,
  cuentaNombre,
  monto,
  onCerrar,
}: {
  campo: CampoCuenta;
  cuentaId: string;
  cuentaNombre: string;
  monto: number;
  onCerrar: () => void;
}) {
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    actualizarCampoCuenta,
    {}
  );

  const info = CAMPO_CUENTA_INFO[campo];

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
      <div className="my-8 w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{info.label}</h2>
            <p className="mt-1 text-sm text-neutral-400">{cuentaNombre}</p>
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
          <input type="hidden" name="cuenta_id" value={cuentaId} />
          <input type="hidden" name="campo" value={campo} />

          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">
              Monto (USD)
            </span>
            <input
              name="monto"
              required
              inputMode="decimal"
              autoFocus
              defaultValue={String(monto)}
              className={INPUT}
            />
            <span className="mt-1 block text-xs text-neutral-500">
              {info.ayuda}
            </span>
          </label>

          <p className="text-xs text-neutral-500">
            Este número vive en la cuenta: el cambio se ve también en su
            tarjeta. Poné 0 para que deje de figurar como movimiento.
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
            <Boton />
          </div>
        </form>
      </div>
    </div>
  );
}
