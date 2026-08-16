"use client";

import { useMemo, useState } from "react";
import { ModalCuenta } from "./modal-cuenta";
import { TarjetaCuenta } from "./tarjeta-cuenta";
import { plata, sugerirNombre, type Cuenta } from "@/lib/cuentas";

type Vista = "activas" | "archivadas";

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        activo
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

export function CuentasVista({ cuentas }: { cuentas: Cuenta[] }) {
  const [vista, setVista] = useState<Vista>("activas");
  const [firm, setFirm] = useState<string>("todas");
  const [modal, setModal] = useState<null | { cuenta?: Cuenta }>(null);

  const firms = useMemo(
    () => Array.from(new Set(cuentas.map((c) => c.firm))).sort(),
    [cuentas]
  );

  const visibles = useMemo(
    () =>
      cuentas.filter((c) => {
        const porVista =
          vista === "archivadas"
            ? c.estado === "archivada"
            : c.estado !== "archivada";
        const porFirm = firm === "todas" || c.firm === firm;
        return porVista && porFirm;
      }),
    [cuentas, vista, firm]
  );

  const capitalGestionado = visibles.reduce((a, c) => a + c.tamano_cuenta, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip activo={vista === "activas"} onClick={() => setVista("activas")}>
          Activas
        </Chip>
        <Chip
          activo={vista === "archivadas"}
          onClick={() => setVista("archivadas")}
        >
          Archivadas
        </Chip>

        <div className="ml-auto flex items-center gap-2">
          {firms.length > 1 && (
            <select
              value={firm}
              onChange={(e) => setFirm(e.target.value)}
              className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 outline-none focus:border-emerald-500"
            >
              <option value="todas">Todas las firms</option>
              {firms.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setModal({})}
            className="hidden rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium transition hover:bg-emerald-500 sm:block"
          >
            + Nueva cuenta
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-10 text-center">
          <p className="text-sm text-neutral-400">
            {cuentas.length === 0
              ? "Todavía no cargaste ninguna cuenta."
              : "No hay cuentas que coincidan con este filtro."}
          </p>
          {cuentas.length === 0 && (
            <button
              onClick={() => setModal({})}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium transition hover:bg-emerald-500"
            >
              Cargar mi primera cuenta
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {visibles.map((c) => (
              <TarjetaCuenta
                key={c.id}
                cuenta={c}
                onEditar={() => setModal({ cuenta: c })}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-600">
            {visibles.length} cuenta{visibles.length === 1 ? "" : "s"} ·{" "}
            {plata(capitalGestionado)} de capital gestionado
          </p>
        </>
      )}

      {/* Botón flotante para agregar (además del de arriba) */}
      <button
        onClick={() => setModal({})}
        aria-label="Nueva cuenta"
        className="fixed bottom-6 right-6 z-30 rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium shadow-lg transition hover:bg-emerald-500 sm:hidden"
      >
        + Cuenta
      </button>

      {modal && (
        <ModalCuenta
          cuenta={modal.cuenta}
          nombreSugerido={sugerirNombre(cuentas)}
          onCerrar={() => setModal(null)}
        />
      )}
    </>
  );
}
