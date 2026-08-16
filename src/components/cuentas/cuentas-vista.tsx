"use client";

import { useMemo, useState } from "react";
import { ModalCuenta } from "./modal-cuenta";
import { ModalRetiros } from "./modal-retiros";
import { TarjetaCuenta } from "./tarjeta-cuenta";
import {
  ESTADO_PLURAL,
  FILTROS_POR_TIPO,
  TIPO_INFO,
  enJuego,
  plata,
  sugerirNombre,
  type Cuenta,
  type Retiro,
  type Tipo,
} from "@/lib/cuentas";

/** La pestaña de arriba: los dos tipos de cuenta, más "Todas". */
type Pestana = "todas" | Tipo;

const PESTANAS: { valor: Pestana; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "fondeada", label: "Fondeadas" },
  { valor: "challenge", label: `${TIPO_INFO.challenge.label}es` },
];

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

/** Un filtro de la fila de abajo: qué dice el botón y a qué cuentas deja pasar. */
type FiltroEstado = {
  valor: string;
  label: string;
  pasa: (c: Cuenta) => boolean;
};

/**
 * En "Todas" no se puede filtrar por estado concreto (una fondeada está
 * "activa" y una evaluación "en curso"), así que se agrupa en las que
 * seguís operando y las que ya terminaron.
 */
const FILTROS_TODAS: FiltroEstado[] = [
  { valor: "en_juego", label: "Activas", pasa: (c) => enJuego(c.estado) },
  { valor: "cerradas", label: "No activas", pasa: (c) => !enJuego(c.estado) },
];

export function CuentasVista({
  cuentas,
  retiros,
}: {
  cuentas: Cuenta[];
  /** Retiros ya agrupados por cuenta, para no recorrer todo en cada tarjeta. */
  retiros: Record<string, Retiro[]>;
}) {
  const [pestana, setPestana] = useState<Pestana>("todas");
  const [estado, setEstado] = useState<string | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [firm, setFirm] = useState<string>("todas");
  const [modal, setModal] = useState<null | { cuenta?: Cuenta }>(null);
  const [modalRetiros, setModalRetiros] = useState<Cuenta | null>(null);

  function cambiarPestana(p: Pestana) {
    setPestana(p);
    setEstado(null); // los estados de un tipo no aplican al otro
  }

  const firms = useMemo(
    () => Array.from(new Set(cuentas.map((c) => c.firm))).sort(),
    [cuentas]
  );

  // Filtros de estado disponibles según la pestaña.
  const filtrosEstado: FiltroEstado[] =
    pestana === "todas"
      ? FILTROS_TODAS
      : FILTROS_POR_TIPO[pestana].map((e) => ({
          valor: e,
          label: ESTADO_PLURAL[e],
          pasa: (c: Cuenta) => c.estado === e,
        }));

  const visibles = useMemo(
    () =>
      cuentas.filter((c) => {
        // Las archivadas se ven solo cuando se piden.
        const archivada = c.estado === "archivada";
        if (verArchivadas !== archivada) return false;

        if (pestana !== "todas" && c.tipo !== pestana) return false;
        if (firm !== "todas" && c.firm !== firm) return false;

        if (estado !== null) {
          const filtro = filtrosEstado.find((f) => f.valor === estado);
          if (filtro && !filtro.pasa(c)) return false;
        }

        return true;
      }),
    // filtrosEstado se deriva de pestana, no hace falta en las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuentas, pestana, estado, verArchivadas, firm]
  );

  const capitalGestionado = visibles.reduce((a, c) => a + c.tamano_cuenta, 0);

  return (
    <>
      {/* Pestañas por tipo de cuenta */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {PESTANAS.map((p) => (
          <Chip
            key={p.valor}
            activo={pestana === p.valor}
            onClick={() => cambiarPestana(p.valor)}
          >
            {p.label}
          </Chip>
        ))}

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

      {/* Filtros de estado + archivadas */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        {filtrosEstado.map((f) => (
          <button
            key={f.valor}
            onClick={() => setEstado(estado === f.valor ? null : f.valor)}
            className={`rounded-lg px-2.5 py-1 transition ${
              estado === f.valor
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {f.label}
          </button>
        ))}

        <button
          onClick={() => setVerArchivadas((v) => !v)}
          className={`ml-auto rounded-lg px-2.5 py-1 transition ${
            verArchivadas
              ? "bg-neutral-800 text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Archivadas
        </button>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibles.map((c) => (
              <TarjetaCuenta
                key={c.id}
                cuenta={c}
                retiros={retiros[c.id] ?? []}
                onEditar={() => setModal({ cuenta: c })}
                onRetiros={() => setModalRetiros(c)}
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

      {modalRetiros && (
        <ModalRetiros
          cuenta={modalRetiros}
          retiros={retiros[modalRetiros.id] ?? []}
          onCerrar={() => setModalRetiros(null)}
        />
      )}

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
