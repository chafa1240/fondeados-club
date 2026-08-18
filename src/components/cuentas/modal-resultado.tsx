"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  eliminarResultado,
  guardarResultado,
  type EstadoForm,
} from "@/app/(app)/cuentas/resultados-actions";
import {
  estaCongelado,
  fechaCorta,
  plata,
  trailea,
  type Cuenta,
} from "@/lib/cuentas";
import {
  montoDeResultado,
  pctDeResultado,
  type Resultado,
} from "@/lib/resultados";

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
      {pending ? "Guardando…" : "Guardar día"}
    </button>
  );
}

function aNumero(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function Fila({ resultado }: { resultado: Resultado }) {
  const [borrando, empezar] = useTransition();
  const positivo = resultado.monto >= 0;

  return (
    <li className="flex items-center justify-between gap-3 border-b border-neutral-800 py-2 last:border-0">
      <div className="min-w-0">
        <p className={`text-sm ${positivo ? "text-emerald-400" : "text-rose-400"}`}>
          {positivo ? "+" : "−"}
          {plata(Math.abs(resultado.monto), 2)}
        </p>
        <p className="text-xs text-neutral-500">
          {fechaCorta(resultado.fecha)}
          {resultado.pico_dia !== null
            ? ` · máximo +${plata(resultado.pico_dia, 2)}`
            : ""}
          {resultado.notas ? ` · ${resultado.notas}` : ""}
        </p>
      </div>
      <button
        disabled={borrando}
        onClick={() => {
          if (!confirm("¿Borrar el resultado de este día?")) return;
          empezar(async () => {
            await eliminarResultado(resultado.id);
          });
        }}
        className="shrink-0 text-xs text-neutral-600 transition hover:text-rose-400 disabled:opacity-50"
      >
        Borrar
      </button>
    </li>
  );
}

/**
 * Carga del resultado de un día.
 *
 * Un día, una fila: si cargás dos veces el mismo día, la segunda corrige a
 * la primera en vez de sumarse (lo resuelve el upsert de la action).
 */
export function ModalResultado({
  cuenta,
  resultados,
  onCerrar,
}: {
  cuenta: Cuenta;
  resultados: Resultado[];
  onCerrar: () => void;
}) {
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    guardarResultado,
    {}
  );

  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [monto, setMonto] = useState("");
  const [pct, setPct] = useState("");

  // Si el día elegido ya tiene resultado, se precargan sus valores: el
  // formulario corrige en vez de duplicar.
  const yaCargado = resultados.find((r) => r.fecha === fecha);

  useEffect(() => {
    setMonto(yaCargado ? String(yaCargado.monto) : "");
    setPct(
      yaCargado?.pct !== null && yaCargado?.pct !== undefined
        ? String(yaCargado.pct)
        : ""
    );
  }, [fecha, yaCargado]);

  function cambiarMonto(v: string) {
    setMonto(v);
    if (v === "") return setPct("");
    const n = aNumero(v);
    if (!Number.isNaN(n)) setPct(String(pctDeResultado(cuenta.tamano_cuenta, n)));
  }

  function cambiarPct(v: string) {
    setPct(v);
    if (v === "") return setMonto("");
    const n = aNumero(v);
    if (!Number.isNaN(n)) {
      setMonto(String(montoDeResultado(cuenta.tamano_cuenta, n)));
    }
  }

  // El máximo del día solo importa mientras el trailing siga vivo: una vez
  // congelado, el flotante ya no mueve el piso.
  const pideMaximo = trailea(cuenta.modo_drawdown) && !estaCongelado(cuenta);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const ultimos = [...resultados]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Resultado del día</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {cuenta.nombre} · {cuenta.firm}
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

          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">Día</span>
            <input
              name="fecha"
              type="date"
              required
              max={hoy}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={INPUT}
            />
            {yaCargado && (
              <span className="mt-1 block text-xs text-amber-500/90">
                Este día ya tenía un resultado cargado: al guardar se corrige.
              </span>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Resultado (USD)
              </span>
              <input
                name="monto"
                required
                inputMode="decimal"
                autoFocus
                placeholder="481.46"
                value={monto}
                onChange={(e) => cambiarMonto(e.target.value)}
                className={INPUT}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Negativo si perdiste: −253.74
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Resultado (%)
              </span>
              <input
                name="pct"
                inputMode="decimal"
                value={pct}
                onChange={(e) => cambiarPct(e.target.value)}
                className={INPUT}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Sobre el tamaño de cuenta
              </span>
            </label>
          </div>

          {/* El máximo del día mueve SOLO el piso del drawdown, nunca el
              balance. Sin él, en una cuenta trailing intradía el colchón
              queda optimista. */}
          {pideMaximo && (
            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Máximo del día (USD)
              </span>
              <input
                name="pico_dia"
                inputMode="decimal"
                placeholder="vacío = se usa el cierre"
                className={INPUT}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Cuánto llegaste a tener arriba dentro del día, aunque hayas
                cerrado más abajo. Va también en los días perdedores: el
                trailing sube igual y no vuelve.
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">Notas</span>
            <input name="notas" placeholder="Opcional" className={INPUT} />
          </label>

          <p className="text-xs text-neutral-500">
            El balance de la cuenta se recalcula solo con esto.
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
              Cerrar
            </button>
            <Boton />
          </div>
        </form>

        {ultimos.length > 0 && (
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">
              Últimos días
            </p>
            <ul>
              {ultimos.map((r) => (
                <Fila key={r.id} resultado={r} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
