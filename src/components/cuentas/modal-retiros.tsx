"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  eliminarRetiro,
  registrarRetiro,
  type EstadoForm,
} from "@/app/(app)/cuentas/actions";
import {
  fechaCorta,
  netoConSplit,
  netoDeRetiro,
  plata,
  totalRetirado,
  type Cuenta,
  type Retiro,
} from "@/lib/cuentas";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500";

function BotonRegistrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Registrando…" : "Registrar retiro"}
    </button>
  );
}

function Fila({ retiro }: { retiro: Retiro }) {
  const [borrando, empezar] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 border-b border-neutral-800 py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-neutral-200">{plata(retiro.monto, 2)}</p>
        <p className="text-xs text-neutral-500">
          {fechaCorta(retiro.fecha)}
          {netoDeRetiro(retiro) !== retiro.monto
            ? ` · cobraste ${plata(netoDeRetiro(retiro), 2)}`
            : ""}
          {retiro.notas ? ` · ${retiro.notas}` : ""}
        </p>
      </div>
      <button
        disabled={borrando}
        onClick={() => {
          if (!confirm("¿Borrar este retiro? El monto vuelve al balance.")) return;
          empezar(async () => {
            await eliminarRetiro(retiro.id, retiro.cuenta_id);
          });
        }}
        className="shrink-0 text-xs text-neutral-600 transition hover:text-rose-400 disabled:opacity-50"
      >
        Borrar
      </button>
    </li>
  );
}

export function ModalRetiros({
  cuenta,
  retiros,
  onCerrar,
}: {
  cuenta: Cuenta;
  retiros: Retiro[];
  onCerrar: () => void;
}) {
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    registrarRetiro,
    {}
  );

  // El bruto sale de la cuenta; el neto es lo que cobrás después del
  // profit split. Se completa solo pero queda editable — ver el comentario
  // en `modal-retiro.tsx` del Funding Manager.
  const [monto, setMonto] = useState("");
  const [neto, setNeto] = useState("");
  const split = cuenta.profit_split;

  function cambiarMonto(v: string) {
    setMonto(v);
    const n = Number(v.replace(",", "."));
    setNeto(
      v === "" || !Number.isFinite(n) ? "" : String(netoConSplit(n, split))
    );
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const total = totalRetirado(cuenta, retiros);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Retiros de {cuenta.nombre}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Total retirado: {plata(total)}
              {cuenta.retiros_previos > 0 &&
                ` (incluye ${plata(cuenta.retiros_previos)} previos)`}
            </p>
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
          <input type="hidden" name="cuenta_id" value={cuenta.id} />

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
                value={monto}
                onChange={(e) => cambiarMonto(e.target.value)}
                className={INPUT}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Lo que cobraste (USD)
              </span>
              <input
                name="monto_neto"
                inputMode="decimal"
                value={neto}
                onChange={(e) => setNeto(e.target.value)}
                className={INPUT}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">Fecha</span>
              <input
                name="fecha"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={INPUT}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">Notas</span>
            <input name="notas" placeholder="Opcional" className={INPUT} />
          </label>

          <p className="text-xs text-neutral-500">
            El monto retirado se descuenta del balance de la cuenta.{" "}
            {split !== null && split < 100
              ? `Lo cobrado se calcula con el profit split ${split}%, y se puede corregir.`
              : "Sin profit split cargado se asume que cobrás todo."}
          </p>

          {estado.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {estado.error}
            </p>
          )}

          <div className="flex justify-end">
            <BotonRegistrar />
          </div>
        </form>

        {retiros.length > 0 && (
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">
              Historial
            </p>
            <ul>
              {retiros.map((r) => (
                <Fila key={r.id} retiro={r} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
