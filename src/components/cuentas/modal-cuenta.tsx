"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarCuenta, type EstadoForm } from "@/app/(app)/cuentas/actions";
import {
  ESTADOS_POR_TIPO,
  ESTADO_INFO,
  FIRMS_SUGERIDAS,
  TIPOS,
  TIPO_INFO,
  UMBRAL_PRECAUCION_DEFAULT,
  UMBRAL_SALUDABLE_DEFAULT,
  montoDesdePct,
  pctDesdeMonto,
  tieneRetiro,
  type Cuenta,
  type Estado,
  type Tipo,
} from "@/lib/cuentas";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600";

/** Aviso para los campos que no se pueden calcular sin el tamaño de cuenta. */
function FaltaTamano() {
  return (
    <p className="-mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-500/90">
      Cargá primero el <strong>tamaño de cuenta</strong>: estos valores se
      calculan sobre él.
    </p>
  );
}

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

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-neutral-800 pt-4 text-xs font-medium uppercase tracking-wide text-neutral-500">
      {children}
    </p>
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

function aNumero(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Un par de campos %/$ que se completan solos entre sí, usando el tamaño
 * de cuenta como referencia. Lo usan el drawdown y los dos umbrales.
 */
function useParPctMonto(pctInicial: string, montoInicial: string) {
  const [pct, setPct] = useState(pctInicial);
  const [monto, setMonto] = useState(montoInicial);

  function desdePct(v: string, tamano: number) {
    setPct(v);
    if (v === "") return setMonto("");
    const p = aNumero(v);
    if (tamano > 0 && !Number.isNaN(p)) {
      setMonto(String(redondear(montoDesdePct(tamano, p))));
    }
  }

  function desdeMonto(v: string, tamano: number) {
    setMonto(v);
    if (v === "") return setPct("");
    const m = aNumero(v);
    if (tamano > 0 && !Number.isNaN(m)) {
      setPct(String(redondear(pctDesdeMonto(tamano, m))));
    }
  }

  /** Cuando cambia el tamaño de cuenta, el % manda y el $ se recalcula. */
  function recalcular(tamano: number) {
    if (pct === "") return;
    const p = aNumero(pct);
    if (tamano > 0 && !Number.isNaN(p)) {
      setMonto(String(redondear(montoDesdePct(tamano, p))));
    }
  }

  return { pct, monto, desdePct, desdeMonto, recalcular };
}

function texto(n: number | null | undefined) {
  return n === null || n === undefined ? "" : String(n);
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
  const [estadoForm, formAction] = useFormState<EstadoForm, FormData>(
    guardarCuenta,
    {}
  );

  const [tipo, setTipo] = useState<Tipo>(cuenta?.tipo ?? "fondeada");
  const [tamano, setTamano] = useState(texto(cuenta?.tamano_cuenta));
  const tamanoNum = aNumero(tamano) || 0;

  // Drawdown y umbrales se calculan sobre el tamaño de cuenta: sin ese
  // número no hay nada que calcular, así que se bloquean.
  const sinTamano = tamanoNum <= 0;
  const esFondeada = tieneRetiro(tipo);

  const dd = useParPctMonto(
    texto(cuenta?.drawdown_maximo_pct),
    texto(cuenta?.drawdown_maximo_monto)
  );
  const saludable = useParPctMonto(
    texto(cuenta?.umbral_saludable_pct ?? UMBRAL_SALUDABLE_DEFAULT),
    texto(cuenta?.umbral_saludable_monto)
  );
  const precaucion = useParPctMonto(
    texto(cuenta?.umbral_precaucion_pct ?? UMBRAL_PRECAUCION_DEFAULT),
    texto(cuenta?.umbral_precaucion_monto)
  );

  function cambiarTamano(v: string) {
    setTamano(v);
    const t = aNumero(v) || 0;
    dd.recalcular(t);
    saludable.recalcular(t);
    precaucion.recalcular(t);
  }

  // Archivar/desarchivar se hace desde el menú ⋯, pero si la cuenta ya
  // está archivada hay que poder mostrarlo acá sin cambiárselo de prepo.
  const estadosPosibles: Estado[] =
    cuenta?.estado === "archivada"
      ? [...ESTADOS_POR_TIPO[tipo], "archivada"]
      : ESTADOS_POR_TIPO[tipo];

  const estadoActual =
    cuenta && estadosPosibles.includes(cuenta.estado)
      ? cuenta.estado
      : estadosPosibles[0];

  // Cerrar al guardar bien, y con la tecla Escape.
  useEffect(() => {
    if (estadoForm.ok) onCerrar();
  }, [estadoForm.ok, onCerrar]);

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
          <input type="hidden" name="tipo" value={tipo} />

          {/* Tipo de cuenta */}
          <div className="flex gap-2">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm transition ${
                  tipo === t
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {TIPO_INFO[t].label}
              </button>
            ))}
          </div>

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
                disabled={sinTamano}
                placeholder="4"
                value={dd.pct}
                onChange={(e) => dd.desdePct(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>

            <Campo label="Drawdown máximo (USD)" ayuda="Se completa solo con el %">
              <input
                name="drawdown_maximo_monto"
                inputMode="decimal"
                disabled={sinTamano}
                placeholder="2000"
                value={dd.monto}
                onChange={(e) => dd.desdeMonto(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>

            {esFondeada && (
              <Campo label="Profit split (%)">
                <input
                  name="profit_split"
                  inputMode="decimal"
                  placeholder="90"
                  defaultValue={texto(cuenta?.profit_split)}
                  className={INPUT}
                />
              </Campo>
            )}

            <Campo label="Balance actual (USD)" ayuda="Lo actualizás vos cuando quieras">
              <input
                name="balance_actual"
                inputMode="decimal"
                placeholder="Igual al tamaño de cuenta"
                defaultValue={texto(cuenta?.balance_actual)}
                className={INPUT}
              />
            </Campo>
          </div>

          {sinTamano && <FaltaTamano />}

          {/* Objetivo de retiro — solo tiene sentido en cuentas fondeadas */}
          {esFondeada && (
            <>
              <Titulo>Objetivo de retiro</Titulo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Quiero retirar (USD)">
                  <input
                    name="objetivo_retiro"
                    inputMode="decimal"
                    placeholder="500"
                    defaultValue={texto(cuenta?.objetivo_retiro)}
                    className={INPUT}
                  />
                </Campo>

                <Campo
                  label="Balance necesario para retirarlo (USD)"
                  ayuda="Cambia según la firm. Ej. Apex: para sacar $500 la cuenta tiene que marcar $2.600"
                >
                  <input
                    name="balance_objetivo"
                    inputMode="decimal"
                    placeholder="2600"
                    defaultValue={texto(cuenta?.balance_objetivo)}
                    className={INPUT}
                  />
                </Campo>
              </div>
            </>
          )}

          {/* Semáforo */}
          <Titulo>Semáforo de salud</Titulo>
          <p className="-mt-2 text-xs text-neutral-500">
            Según cuánto colchón te quede hasta el drawdown máximo. El estado
            de la cuenta se pone solo con estos valores.
          </p>
          {sinTamano && <FaltaTamano />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Saludable desde (%)">
              <input
                name="umbral_saludable_pct"
                inputMode="decimal"
                disabled={sinTamano}
                value={saludable.pct}
                onChange={(e) => saludable.desdePct(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>
            <Campo label="Saludable desde (USD)">
              <input
                name="umbral_saludable_monto"
                inputMode="decimal"
                disabled={sinTamano}
                value={saludable.monto}
                onChange={(e) => saludable.desdeMonto(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>
            <Campo label="Precaución desde (%)" ayuda="Debajo de esto: Crítico">
              <input
                name="umbral_precaucion_pct"
                inputMode="decimal"
                disabled={sinTamano}
                value={precaucion.pct}
                onChange={(e) => precaucion.desdePct(e.target.value, tamanoNum)}
                className={INPUT}
              />
            </Campo>
            <Campo label="Precaución desde (USD)">
              <input
                name="umbral_precaucion_monto"
                inputMode="decimal"
                disabled={sinTamano}
                value={precaucion.monto}
                onChange={(e) =>
                  precaucion.desdeMonto(e.target.value, tamanoNum)
                }
                className={INPUT}
              />
            </Campo>
          </div>

          {/* Estado y notas */}
          <Titulo>Estado y notas</Titulo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Estado"
              ayuda={
                tipo === "fondeada"
                  ? "Crítico / Precaución / Saludable se calculan solos"
                  : undefined
              }
            >
              <select
                name="estado"
                key={tipo}
                defaultValue={estadoActual}
                className={INPUT}
              >
                {estadosPosibles.map((e) => (
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

          {estadoForm.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {estadoForm.error}
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
