"use client";

import {
  chipDeCuenta,
  colchon,
  plata,
  porcentaje,
  salud,
  variacion,
  type Cuenta,
} from "@/lib/cuentas";
import { MenuCuenta } from "./tarjeta-cuenta";

/**
 * La misma cuenta que la tarjeta, pero en una línea.
 *
 * Existe porque la sección Cuentas es un tablero: con 20 cuentas cargadas,
 * las tarjetas obligan a scrollear cinco pantallas para tener el panorama.
 * Acá entran todas juntas y se ve de un vistazo cuál está en rojo.
 */
export function FilaCuenta({
  cuenta,
  onEditar,
  onDuplicar,
  onRetiros,
  onResultado,
  onCurva,
}: {
  cuenta: Cuenta;
  onEditar: () => void;
  onDuplicar: () => void;
  onRetiros: () => void;
  onResultado: () => void;
  onCurva: () => void;
}) {
  const chip = chipDeCuenta(cuenta);
  const v = variacion(cuenta);
  const c = colchon(cuenta);
  const s = salud(cuenta);
  const positivo = v.monto >= 0;

  return (
    <div className="flex items-center gap-3 border-b border-neutral-800 px-3 py-2.5 transition last:border-0 hover:bg-neutral-900/60">
      {/* Nombre y firm */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{cuenta.nombre}</p>
        <p className="truncate text-xs text-neutral-500">{cuenta.firm}</p>
      </div>

      {/* Balance y variación */}
      <div className="hidden w-28 shrink-0 text-right sm:block">
        <p className="text-sm tabular-nums">{plata(cuenta.balance_actual)}</p>
        <p
          className={`text-xs tabular-nums ${positivo ? "text-emerald-400" : "text-rose-400"}`}
        >
          {positivo ? "+" : "−"}
          {plata(Math.abs(v.monto))}
        </p>
      </div>

      {/* Cuánto falta para tocar el drawdown: el número que hay que mirar */}
      <div className="hidden w-32 shrink-0 text-right md:block">
        {c !== null ? (
          <>
            <p
              className={`text-sm tabular-nums ${
                s === "critico"
                  ? "text-rose-400"
                  : s === "precaucion"
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
            >
              {plata(c.monto)}
            </p>
            <p className="text-xs text-neutral-600 tabular-nums">
              {porcentaje(c.pct)} de drawdown
            </p>
          </>
        ) : (
          <p className="text-xs text-neutral-600">Sin drawdown</p>
        )}
      </div>

      <span
        className={`hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs sm:inline-flex ${chip.chip}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${chip.punto}`} />
        {chip.label}
      </span>

      {/* Con 20 cuentas, poder cerrar el día de todas sin abrir nada es
          la mitad del sentido de la vista compacta. */}
      <button
        onClick={onResultado}
        className="shrink-0 rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-800"
      >
        + Día
      </button>

      <MenuCuenta
        cuenta={cuenta}
        onEditar={onEditar}
        onDuplicar={onDuplicar}
        onRetiros={onRetiros}
        onResultado={onResultado}
        onCurva={onCurva}
      />
    </div>
  );
}

