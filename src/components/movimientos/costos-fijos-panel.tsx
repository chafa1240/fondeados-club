"use client";

import { useTransition } from "react";
import {
  alternarCostoFijo,
  eliminarCostoFijo,
} from "@/app/(app)/funding-manager/actions";
import { fechaCorta, plata } from "@/lib/cuentas";
import {
  PERIODICIDAD_INFO,
  equivalenteMensual,
  ordenarCostosFijos,
  proximoVencimiento,
  totalMensual,
  type CostoFijo,
} from "@/lib/costos-fijos";

/**
 * Los costos fijos: lo que se paga sí o sí todos los meses, opere o no.
 *
 * Va arriba del historial y no mezclado con los movimientos porque
 * responde otra pregunta. Los movimientos son "qué pasó"; esto es "cuánto
 * me cuesta estar acá todos los meses" — el número contra el que hay que
 * comparar lo que se retira.
 */
export function CostosFijosPanel({
  costos,
  nombreCuenta,
  onEditar,
}: {
  costos: CostoFijo[];
  nombreCuenta: (id: string | null) => string;
  onEditar: (costo: CostoFijo) => void;
}) {
  const lista = ordenarCostosFijos(costos);
  const mensual = totalMensual(costos);

  return (
    <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      {/* Sin botón de alta a propósito: los costos fijos se crean desde
          "+ Gasto", marcando "se repite". Un alta propia obligaría a
          decidir qué tipo de cosa estás cargando antes de saber qué campos
          hay, y son el mismo gesto: anotar plata que sale. */}
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Costos fijos
        </p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {plata(mensual)}
          <span className="ml-1.5 text-sm font-normal text-neutral-500">
            por mes
          </span>
        </p>
      </div>

      {lista.length === 0 ? (
        <p className="mt-3 border-t border-neutral-800 pt-3 text-sm text-neutral-500">
          Lo que pagás todos los meses opere o no —data feed, plataforma,
          indicadores— se carga desde <span className="text-neutral-300">+ Gasto</span>,
          marcando “se repite”. Después aparece acá y se carga solo en cada
          período.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-800 border-t border-neutral-800">
          {lista.map((c) => (
            <Fila
              key={c.id}
              costo={c}
              nombreCuenta={nombreCuenta}
              onEditar={() => onEditar(c)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Fila({
  costo,
  nombreCuenta,
  onEditar,
}: {
  costo: CostoFijo;
  nombreCuenta: (id: string | null) => string;
  onEditar: () => void;
}) {
  const [ocupado, empezar] = useTransition();
  const proximo = proximoVencimiento(costo);

  function pausar() {
    empezar(async () => {
      await alternarCostoFijo(costo.id, !costo.activo);
    });
  }

  function borrar() {
    if (
      !confirm(
        `¿Borrar el costo fijo "${costo.nombre}"?\n\nLos gastos que ya generó quedan: son plata que saliste. Deja de generar los que vienen.\n\nSi solo lo diste de baja, mejor pausalo.`,
      )
    ) {
      return;
    }

    empezar(async () => {
      await eliminarCostoFijo(costo.id);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-200">
          {costo.nombre}
          {!costo.activo && (
            <span className="ml-2 rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
              Pausado
            </span>
          )}
        </p>
        <p className="text-xs text-neutral-500">
          {nombreCuenta(costo.cuenta_id)}
          {proximo ? ` · próximo ${fechaCorta(proximo)}` : ""}
          {costo.periodicidad !== "mensual" && costo.activo
            ? ` · ${plata(equivalenteMensual(costo), 2)}/mes`
            : ""}
        </p>
      </div>

      <p className="whitespace-nowrap text-sm text-neutral-300">
        {plata(costo.monto, 2)}
        <span className="ml-1 text-xs text-neutral-500">
          {PERIODICIDAD_INFO[costo.periodicidad].cada}
        </span>
      </p>

      <div className="flex gap-3">
        <button
          onClick={onEditar}
          className="text-xs text-neutral-500 transition hover:text-neutral-200"
        >
          Editar
        </button>
        <button
          disabled={ocupado}
          onClick={pausar}
          className="text-xs text-neutral-500 transition hover:text-neutral-200 disabled:opacity-50"
        >
          {costo.activo ? "Pausar" : "Reanudar"}
        </button>
        <button
          disabled={ocupado}
          onClick={borrar}
          className="text-xs text-neutral-600 transition hover:text-rose-400 disabled:opacity-50"
        >
          Borrar
        </button>
      </div>
    </li>
  );
}
