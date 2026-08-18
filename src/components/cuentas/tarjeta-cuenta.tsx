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
  ETIQUETA_CIERRE,
  MODO_DRAWDOWN_INFO,
  TIPO_INFO,
  anillo,
  chipDeCuenta,
  colchon,
  esCierre,
  estadoAlDesarchivar,
  fechaCorta,
  type Estado,
  picoDeCuenta,
  pisoDrawdown,
  plata,
  porcentaje,
  salud,
  tieneRetiro,
  trailea,
  totalRetirado,
  variacion,
  type Cuenta,
  type Retiro,
} from "@/lib/cuentas";
import type { Resultado } from "@/lib/resultados";

/* ---------- Anillo de progreso ---------- */

/** En cuántos tramos se corta el aro (cada tramo son 10%). */
const TRAMOS = 10;

function Anillo({ pct }: { pct: number }) {
  const r = 26;
  const largo = 2 * Math.PI * r;

  // Cortes que atraviesan el propio aro y lo parten en tramos, para que se
  // lea como una escala y no como un dibujo liso. Van del color de la
  // tarjeta, así "recortan" el anillo en vez de pintarse encima.
  const cortes = Array.from({ length: TRAMOS }, (_, i) => {
    const angulo = (i / TRAMOS) * 2 * Math.PI;
    const cos = Math.cos(angulo);
    const sen = Math.sin(angulo);
    // El aro va de radio 23 a 29 (r 26 con 6 de grosor): se corta un poco
    // más para que el tajo se vea limpio en los dos bordes.
    return {
      i,
      x1: 32 + cos * 22.4,
      y1: 32 + sen * 22.4,
      x2: 32 + cos * 29.6,
      y2: 32 + sen * 29.6,
    };
  });

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 64 64" className="h-24 w-24 -rotate-90">
        {/* Aro de fondo */}
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-neutral-800"
        />

        {/* Progreso */}
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeDasharray={largo}
          strokeDashoffset={largo * (1 - pct / 100)}
          className={pct >= 100 ? "stroke-emerald-400" : "stroke-emerald-500/80"}
        />

        {/* Cortes: van último para partir tanto el fondo como el progreso */}
        {cortes.map((c) => (
          <line
            key={c.i}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            strokeWidth="1.4"
            className="stroke-neutral-900"
          />
        ))}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold">
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
        <span className="text-xl font-semibold leading-tight tracking-tight">
          {plata(cuenta.balance_actual)}
        </span>
        <span className="text-xs text-neutral-600 opacity-0 transition group-hover:opacity-100">
          editar
        </span>
      </button>
      <p
        className={`text-sm leading-tight ${positivo ? "text-emerald-400" : "text-rose-400"}`}
      >
        {positivo ? "+" : "−"}
        {plata(Math.abs(v.monto))} ({positivo ? "+" : "−"}
        {porcentaje(Math.abs(v.pct))})
      </p>
    </div>
  );
}

/* ---------- Fecha de cierre (pasada / quemada) ---------- */

/**
 * Al cerrar una cuenta se pregunta el día: casi nunca la marcás el mismo
 * día que pasó. Se puede omitir y queda sin fecha.
 */
function ModalCierre({
  cuenta,
  estado,
  onConfirmar,
  onCerrar,
}: {
  cuenta: Cuenta;
  estado: "passed" | "quemada";
  onConfirmar: (fecha: string | null) => Promise<string | null>;
  onCerrar: () => void;
}) {
  const hoy = new Date().toISOString().slice(0, 10);
  // No puede haber terminado antes de arrancar, ni en el futuro.
  const minimo = cuenta.fecha_inicio;
  const [fecha, setFecha] = useState(
    cuenta.fecha_cierre ?? (minimo > hoy ? minimo : hoy)
  );
  const [error, setError] = useState<string | null>(null);
  const [trabajando, empezar] = useTransition();

  const invalida = fecha !== "" && fecha < minimo;

  function confirmar(valor: string | null) {
    if (valor !== null && valor < minimo) {
      return setError(
        `La cuenta arrancó el ${fechaCorta(minimo)}: no puede haber terminado antes.`
      );
    }
    setError(null);
    empezar(async () => {
      const err = await onConfirmar(valor);
      if (err) setError(err);
    });
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-base font-semibold">{ETIQUETA_CIERRE[estado]}</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {cuenta.nombre} · {cuenta.firm}
        </p>

        <input
          type="date"
          value={fecha}
          min={minimo}
          max={hoy}
          onChange={(e) => {
            setFecha(e.target.value);
            setError(null);
          }}
          className={`mt-4 w-full rounded-lg border bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 ${
            invalida ? "border-rose-500/60" : "border-neutral-700"
          }`}
        />

        <p className="mt-1.5 text-xs text-neutral-600">
          La cuenta arrancó el {fechaCorta(minimo)}.
        </p>

        {error && (
          <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={trabajando}
            onClick={() => confirmar(null)}
            className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:text-neutral-300 disabled:opacity-50"
          >
            Sin fecha
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm transition hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={trabajando || !fecha || invalida}
            onClick={() => confirmar(fecha)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {trabajando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Menú de la tarjeta ---------- */

export function MenuCuenta({
  cuenta,
  onEditar,
  onDuplicar,
  onRetiros,
  onGasto,
  onResultado,
}: {
  cuenta: Cuenta;
  onEditar: () => void;
  onDuplicar: () => void;
  onRetiros: () => void;
  onGasto: () => void;
  onResultado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const [trabajando, empezar] = useTransition();
  // Estado que se va a aplicar en cuanto el usuario elija la fecha.
  const [cerrando, setCerrando] = useState<null | "passed" | "quemada">(null);
  const ref = useRef<HTMLDivElement>(null);
  const archivada = cuenta.estado === "archivada";

  /**
   * Pasar o quemar pregunta primero el día; el resto de los estados se
   * aplican de una.
   */
  function elegirEstado(e: Estado) {
    setSubmenu(false);
    setAbierto(false);

    if (esCierre(e)) return setCerrando(e);
    empezar(async () => {
      await cambiarEstado(cuenta.id, e);
    });
  }

  useEffect(() => {
    if (!abierto) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        setSubmenu(false);
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
        <div className="absolute right-0 z-20 mt-1 w-48 overflow-visible rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          <button
            className={item}
            onClick={() => {
              setAbierto(false);
              onEditar();
            }}
          >
            Editar
          </button>

          {/* Lo que más se usa: cerrar el día y anotar cuánto hiciste. */}
          <button
            className={item}
            onClick={() => {
              setAbierto(false);
              onResultado();
            }}
          >
            Resultado del día…
          </button>

          {/* Duplicar: abre el mismo modal con todo precargado y el campo
              de cantidad, para clonar la cuenta una o varias veces. */}
          <button
            className={item}
            onClick={() => {
              setAbierto(false);
              onDuplicar();
            }}
          >
            Duplicar…
          </button>

          {tieneRetiro(cuenta.tipo) && (
            <button
              className={item}
              onClick={() => {
                setAbierto(false);
                onRetiros();
              }}
            >
              Retiros
            </button>
          )}

          {/* El gasto se carga acá, parado en la cuenta, y no yendo al
              Funding Manager a elegirla de un desplegable. Es la misma
              action de allá: el dato termina en el mismo lugar. */}
          <button
            className={item}
            onClick={() => {
              setAbierto(false);
              onGasto();
            }}
          >
            Agregar gasto…
          </button>

          {/* Submenú: se despliega al pasar el mouse por encima */}
          <div
            className="relative"
            onMouseEnter={() => setSubmenu(true)}
            onMouseLeave={() => setSubmenu(false)}
          >
            <button
              className={`${item} flex items-center justify-between`}
              onClick={() => setSubmenu((v) => !v)}
            >
              Cambiar estado
              <span className="text-neutral-600">›</span>
            </button>

            {submenu && (
              <div className="absolute right-full top-0 z-30 mr-1 w-40 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
                {ESTADOS_POR_TIPO[cuenta.tipo]
                  .filter((e) => e !== cuenta.estado)
                  .map((e) => (
                    <button
                      key={e}
                      className={item}
                      disabled={trabajando}
                      onClick={() => elegirEstado(e)}
                    >
                      {ESTADO_INFO[e].label}
                      {esCierre(e) && (
                        <span className="ml-1 text-neutral-600">…</span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>

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
                  `¿Eliminar "${cuenta.nombre}"? Sus retiros también se borran. No se puede deshacer.`
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

      {cerrando && (
        <ModalCierre
          cuenta={cuenta}
          estado={cerrando}
          onCerrar={() => setCerrando(null)}
          onConfirmar={async (fecha) => {
            const r = await cambiarEstado(cuenta.id, cerrando, fecha);
            if (r.error) return r.error;
            setCerrando(null);
            return null;
          }}
        />
      )}
    </div>
  );
}

/* ---------- Piezas sueltas ---------- */

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="leading-tight">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-200">{valor}</p>
    </div>
  );
}

function LineaRetiro({ fecha, monto }: { fecha: string; monto: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-neutral-500">{fecha}</span>
      <span className="text-emerald-400">{monto}</span>
    </li>
  );
}

/**
 * Acción rápida al pie de la tarjeta.
 *
 * Solo van acá las cosas que se hacen seguido: cerrar el día en todas las
 * cuentas, y retirar en las fondeadas. Duplicar, archivar o editar se usan
 * una vez cada tanto y siguen en el menú ⋯.
 */
function Accion({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-800"
    >
      {children}
    </button>
  );
}

function BotonVuelta({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
    >
      {children}
    </button>
  );
}

/* ---------- Tarjeta ---------- */

export function TarjetaCuenta({
  cuenta,
  retiros,
  resultados,
  onEditar,
  onDuplicar,
  onRetiros,
  onGasto,
  onResultado,
}: {
  cuenta: Cuenta;
  retiros: Retiro[];
  resultados: Resultado[];
  onEditar: () => void;
  onDuplicar: () => void;
  onRetiros: () => void;
  onGasto: () => void;
  onResultado: () => void;
}) {
  const [dorso, setDorso] = useState(false);

  const chip = chipDeCuenta(cuenta);
  const meta = anillo(cuenta);
  const esFondeada = tieneRetiro(cuenta.tipo);
  const retirado = totalRetirado(cuenta, retiros);
  const piso = pisoDrawdown(cuenta);

  // El día más reciente que se cargó. Se muestra siempre con su fecha y no
  // con un "Hoy": la tarjeta se renderiza primero en el servidor (UTC) y
  // después en el navegador, y comparar contra "hoy" da distinto en las dos
  // puntas después de las 21hs.
  const ultimo = [...resultados].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  const c = colchon(cuenta);
  const s = salud(cuenta);

  const drawdown =
    cuenta.drawdown_maximo_monto != null
      ? `${plata(cuenta.drawdown_maximo_monto)}${
          cuenta.drawdown_maximo_pct != null
            ? ` (${porcentaje(cuenta.drawdown_maximo_pct)})`
            : ""
        }`
      : "—";

  const CAJA =
    "rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700";

  /* ----- Frente ----- */
  const frente = (
    <div className={CAJA}>
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
          <MenuCuenta
            cuenta={cuenta}
            onEditar={onEditar}
            onDuplicar={onDuplicar}
            onRetiros={onRetiros}
            onGasto={onGasto}
            onResultado={onResultado}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <BalanceEditable cuenta={cuenta} />
        {meta !== null && (
          <div className="flex flex-col items-center">
            <Anillo pct={meta.pct} />
            <span className="text-[11px] text-neutral-500">
              {meta.etiqueta}
            </span>
          </div>
        )}
      </div>

      {meta !== null && (
        <p className="text-xs text-neutral-500">
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
                : "para pasar la evaluación"}
            </>
          )}
        </p>
      )}

      {/* Lo que importa mirar todos los días no es el drawdown máximo (ese
          no cambia nunca), sino cuánta plata queda hasta tocarlo. */}
      {c !== null && (
        <p className="mt-1 text-xs text-neutral-500">
          Drawdown:{" "}
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


      {/* Lo mínimo del ciclo */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-neutral-800 pt-2.5">
        {esFondeada ? (
          <Dato
            label="Objetivo de retiro"
            valor={plata(cuenta.objetivo_retiro)}
          />
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
      </div>

      {/* Últimos 3 retiros */}
      {esFondeada && retiros.length > 0 && (
        <ul className="mt-2.5 space-y-0.5 border-t border-neutral-800 pt-2">
          {retiros.slice(0, 3).map((r) => (
            <LineaRetiro
              key={r.id}
              fecha={fechaCorta(r.fecha)}
              monto={plata(r.monto, 2)}
            />
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Accion onClick={onResultado}>+ Día</Accion>
          {/* Retirar de una evaluación no existe: la cuenta todavía no
              cobra. Por eso el botón aparece solo en las fondeadas. */}
          {esFondeada && <Accion onClick={onRetiros}>Retiro</Accion>}

          {/* El último día cargado, al lado del botón que lo carga. Va en
              el hueco que ya existía: no agranda la tarjeta. */}
          {ultimo && (
            <span className="truncate text-[11px] text-neutral-500">
              {fechaCorta(ultimo.fecha).slice(0, 5)}{" "}
              <span
                className={
                  ultimo.monto >= 0 ? "text-emerald-400/90" : "text-rose-400/90"
                }
              >
                {ultimo.monto >= 0 ? "+" : "−"}
                {plata(Math.abs(ultimo.monto))}
              </span>
            </span>
          )}
        </div>
        <BotonVuelta onClick={() => setDorso(true)}>+ Información…</BotonVuelta>
      </div>
    </div>
  );

  /* ----- Dorso ----- */
  const dorsoContenido = (
    <div className={`${CAJA} flex h-full flex-col overflow-y-auto`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{cuenta.nombre}</h3>
          <p className="truncate text-sm text-neutral-400">{cuenta.firm}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-800 pt-3">
        <Dato label="Balance base" valor={plata(cuenta.tamano_cuenta)} />
        <Dato label="Inicio" valor={fechaCorta(cuenta.fecha_inicio)} />

        <Dato
          label="Tipo de drawdown"
          valor={MODO_DRAWDOWN_INFO[cuenta.modo_drawdown].corto}
        />
        <Dato label="Drawdown máximo" valor={drawdown} />
        {/* El drawdown, dicho como balance: el número que no puede tocar. */}
        <Dato label="Se quema si baja de" valor={plata(piso)} />

        {trailea(cuenta.modo_drawdown) && (
          <Dato label="Pico histórico" valor={plata(picoDeCuenta(cuenta))} />
        )}

        {cuenta.fecha_cierre && (
          <Dato
            label={cuenta.estado === "passed" ? "Pasada el" : "Quemada el"}
            valor={fechaCorta(cuenta.fecha_cierre)}
          />
        )}

        {esFondeada ? (
          <>
            <Dato
              label="Profit split"
              valor={porcentaje(cuenta.profit_split, 0)}
            />
            <Dato
              label="Fee de activación"
              valor={
                cuenta.fee_activacion === null
                  ? "No tuvo"
                  : plata(cuenta.fee_activacion, 2)
              }
            />
            <Dato
              label="Regla de consistencia"
              valor={porcentaje(cuenta.regla_consistencia, 0)}
            />
          </>
        ) : (
          <>
            <Dato
              label="Regla de consistencia"
              valor={porcentaje(cuenta.regla_consistencia, 0)}
            />
            <Dato label="Precio" valor={plata(cuenta.precio, 2)} />
            <Dato
              label="Contratos"
              valor={
                cuenta.cantidad_contratos != null
                  ? String(cuenta.cantidad_contratos)
                  : "—"
              }
            />
          </>
        )}
      </div>

      {/* Todos los retiros */}
      {esFondeada && (
        <div className="mt-3 border-t border-neutral-800 pt-2">
          <p className="mb-1 text-xs uppercase tracking-wide text-neutral-600">
            Retiros · {plata(retirado)}
          </p>

          {retiros.length === 0 && cuenta.retiros_previos === 0 ? (
            <p className="text-xs text-neutral-600">Todavía no retiraste nada.</p>
          ) : (
            <ul className="space-y-0.5">
              {retiros.map((r) => (
                <LineaRetiro
                  key={r.id}
                  fecha={fechaCorta(r.fecha)}
                  monto={plata(r.monto, 2)}
                />
              ))}
              {cuenta.retiros_previos > 0 && (
                <li className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-neutral-500">Previos a la app</span>
                  <span className="text-neutral-400">
                    {plata(cuenta.retiros_previos, 2)}
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {cuenta.notas && (
        <p className="mt-3 border-t border-neutral-800 pt-2 text-xs text-neutral-500">
          {cuenta.notas}
        </p>
      )}

      <div className="mt-auto flex justify-end pt-3">
        <BotonVuelta onClick={() => setDorso(false)}>← Volver</BotonVuelta>
      </div>
    </div>
  );

  return (
    <div className="[perspective:1200px]">
      <div
        className="relative transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: dorso ? "rotateY(180deg)" : undefined }}
      >
        {/* Frente: define el alto de la tarjeta */}
        <div
          className={`[backface-visibility:hidden] ${dorso ? "pointer-events-none" : ""}`}
          aria-hidden={dorso}
        >
          {frente}
        </div>

        {/* Dorso: encima del frente, girado */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            dorso ? "" : "pointer-events-none"
          }`}
          aria-hidden={!dorso}
        >
          {dorsoContenido}
        </div>
      </div>
    </div>
  );
}
