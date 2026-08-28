"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { guardarGasto, type EstadoForm } from "@/app/(app)/funding-manager/actions";
import {
  CATEGORIAS_MANUALES,
  CATEGORIA_INFO,
  type Categoria,
  type Gasto,
} from "@/lib/movimientos";
import {
  PERIODICIDADES,
  PERIODICIDAD_INFO,
  equivalenteMensual,
  type CostoFijo,
  type Periodicidad,
} from "@/lib/costos-fijos";
import { plata } from "@/lib/cuentas";

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

/**
 * El único formulario donde se anota plata que sale.
 *
 * Un costo fijo (el data feed, la plataforma) **no tiene su propio alta**:
 * es un gasto con el switch "se repite" puesto. Se probó al revés —dos
 * botones, "+ Gasto" y "+ Costo fijo"— y obliga a decidir qué tipo de cosa
 * es antes de saber qué campos hay: uno anota lo que pagó, y que se repita
 * es un dato más de ese pago, no otra categoría de cosa.
 *
 * Cuando "se repite" está puesto, lo que se guarda es la **plantilla**
 * (`costos_fijos`) y no una fila de `gastos`: los gastos de cada período
 * los crea la app sola. Si se guardara además el gasto suelto, el primer
 * período quedaría cargado dos veces.
 */
export function ModalGasto({
  gasto,
  costoFijo,
  cuentas,
  /** Nombres ya usados antes, para no volver a escribirlos. */
  nombresUsados = [],
  onCerrar,
}: {
  gasto?: Gasto;
  /** Editar un costo fijo ya creado: mismo formulario, con "se repite" puesto. */
  costoFijo?: CostoFijo;
  cuentas: CuentaBreve[];
  nombresUsados?: string[];
  onCerrar: () => void;
}) {
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    guardarGasto,
    {}
  );

  const [categoria, setCategoria] = useState<Categoria>(
    costoFijo?.categoria ?? gasto?.categoria ?? "software_suscripcion"
  );

  const [repetir, setRepetir] = useState(!!costoFijo);
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>(
    costoFijo?.periodicidad ?? "mensual"
  );
  const [conFin, setConFin] = useState(!!costoFijo?.fecha_fin);
  // Solo para el cartel de "son X por mes": lo que se guarda es lo que se
  // paga, no este número.
  const [monto, setMonto] = useState(
    costoFijo ? String(costoFijo.monto) : gasto ? String(gasto.monto) : ""
  );

  useEffect(() => {
    if (estado.ok) onCerrar();
  }, [estado.ok, onCerrar]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const esEdicion = !!gasto || !!costoFijo;

  /**
   * Un gasto que ya generó un costo fijo no vuelve a ofrecer "se repite":
   * ya se repite, y marcarlo crearía una segunda plantilla del mismo
   * costo. Se edita como el gasto puntual que es —corregir el monto de un
   * mes que te cobraron distinto— y lo que se repite se cambia en el
   * costo fijo, arriba del historial.
   */
  const generado = !!gasto?.costo_fijo_id;

  const numero = Number(monto.replace(",", "."));
  const mensual =
    Number.isFinite(numero) && numero > 0
      ? equivalenteMensual({ monto: numero, periodicidad })
      : null;

  const titulo = costoFijo
    ? "Editar costo fijo"
    : gasto
      ? "Editar gasto"
      : "Nuevo gasto";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{titulo}</h2>
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
          {gasto && <input type="hidden" name="id" value={gasto.id} />}
          {costoFijo && (
            <>
              <input type="hidden" name="costo_fijo_id" value={costoFijo.id} />
              <input
                type="hidden"
                name="activo"
                value={costoFijo.activo ? "si" : "no"}
              />
            </>
          )}

          <Campo label="Categoría" ayuda={CATEGORIA_INFO[categoria].ayuda}>
            <select
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className={INPUT}
            >
              {/* El precio de una evaluación y el fee de activación no
                  están acá: son campos de la cuenta y ya se cuentan solos. */}
              {CATEGORIAS_MANUALES.map((c) => (
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
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={INPUT}
              />
            </Campo>

            <Campo
              label={repetir ? "Primer pago" : "Fecha"}
              ayuda={repetir ? "Desde acá se generan los períodos" : undefined}
            >
              <input
                name="fecha"
                type="date"
                defaultValue={
                  costoFijo?.fecha_inicio ??
                  gasto?.fecha ??
                  new Date().toISOString().slice(0, 10)
                }
                className={INPUT}
              />
            </Campo>
          </div>

          {/* ---- Se repite ---- */}
          {generado ? (
            <p className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
              Este gasto lo generó un costo fijo. Podés corregirlo o borrarlo
              como cualquier otro —el mes que te cobraron distinto, el que no
              pagaste— sin que vuelva a aparecer. Para cambiar lo que se
              repite, editá el costo fijo arriba del historial.
            </p>
          ) : (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                name="repetir"
                value="si"
                checked={repetir}
                onChange={(e) => setRepetir(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span className="block text-sm text-neutral-200">
                  Se repite (costo fijo)
                </span>
                <span className="block text-xs text-neutral-500">
                  Lo pagás todos los meses opere o no: data feed, plataforma,
                  indicadores. La app lo carga sola en cada período.
                </span>
              </span>
            </label>

            {repetir && (
              <div className="mt-3 space-y-3 border-t border-neutral-800 pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Cada cuánto">
                    <select
                      name="periodicidad"
                      value={periodicidad}
                      onChange={(e) =>
                        setPeriodicidad(e.target.value as Periodicidad)
                      }
                      className={INPUT}
                    >
                      {PERIODICIDADES.map((p) => (
                        <option key={p} value={p}>
                          {PERIODICIDAD_INFO[p].label}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm text-neutral-300">
                      <input
                        type="checkbox"
                        checked={conFin}
                        onChange={(e) => setConFin(e.target.checked)}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      Hasta una fecha
                    </label>
                    <input
                      name="fecha_fin"
                      type="date"
                      disabled={!conFin}
                      defaultValue={costoFijo?.fecha_fin ?? ""}
                      className={INPUT}
                    />
                    <span className="mt-1 block text-xs text-neutral-500">
                      Sin marcar = sigue vigente
                    </span>
                  </div>
                </div>

                {/* Lo que hace comparable un anual con un mensual. */}
                {mensual !== null && periodicidad !== "mensual" && (
                  <p className="text-xs text-neutral-400">
                    Son {plata(mensual, 2)} por mes.
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          <Campo
            label="Cuenta"
            ayuda="Dejalo en General si el gasto no es de una cuenta puntual (ej. el data feed)"
          >
            <select
              name="cuenta_id"
              defaultValue={(costoFijo?.cuenta_id ?? gasto?.cuenta_id) ?? ""}
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

          {/* El nombre es lo que distingue dos gastos de la misma
              categoría: "Rithmic" y "TradingView" son los dos
              software/suscripción. Los ya usados quedan sugeridos. */}
          <Campo
            label="Nombre"
            ayuda={
              repetir
                ? "Con qué nombre lo vas a ver todos los meses (ej. Rithmic)"
                : "Para distinguirlo dentro de la categoría (ej. Rithmic, TradingView)"
            }
          >
            <input
              name="descripcion"
              list="nombres-de-gasto"
              required={repetir}
              placeholder={repetir ? "Rithmic" : "Opcional"}
              defaultValue={costoFijo?.nombre ?? gasto?.descripcion ?? ""}
              className={INPUT}
            />
            <datalist id="nombres-de-gasto">
              {nombresUsados.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Campo>

          <p className="text-xs text-neutral-500">
            {repetir
              ? costoFijo
                ? "Los períodos ya cargados no cambian: esos meses se pagaron a ese precio. Lo que edites rige de acá en adelante. Si destildás “se repite”, deja de generar y los que ya están quedan como gastos comunes."
                : "Al guardar se cargan de una todos los períodos que ya vencieron."
              : "Un gasto sale de tu bolsillo: no toca el balance de la cuenta."}
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
            <Guardar
              texto={
                esEdicion
                  ? "Guardar"
                  : repetir
                    ? "Crear costo fijo"
                    : "Registrar gasto"
              }
            />
          </div>
        </form>
      </div>
    </div>
  );
}
