"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalCuenta } from "./modal-cuenta";
import { ModalRetiros } from "./modal-retiros";
import { TarjetaCuenta } from "./tarjeta-cuenta";
import { FilaCuenta } from "./fila-cuenta";
import { ModalGasto } from "@/components/movimientos/modal-gasto";
import { ModalResultado } from "./modal-resultado";
import type { Resultado } from "@/lib/resultados";
import {
  ESTADO_PLURAL,
  FILTROS_POR_TIPO,
  ORDENES,
  ORDEN_INFO,
  SALUDES,
  SALUD_INFO,
  TIPO_INFO,
  enJuego,
  etiquetaCantidad,
  nombresParaLote,
  ordenarCuentas,
  type Orden,
  plata,
  salud,
  sugerirNombre,
  type Cuenta,
  type Retiro,
  type Salud,
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
  resultados,
}: {
  cuentas: Cuenta[];
  /** Retiros ya agrupados por cuenta, para no recorrer todo en cada tarjeta. */
  retiros: Record<string, Retiro[]>;
  /** Resultados diarios, también agrupados por cuenta. */
  resultados: Record<string, Resultado[]>;
}) {
  const [pestana, setPestana] = useState<Pestana>("todas");
  // Los dos grupos permiten marcar varios a la vez. Dentro de un grupo
  // las opciones suman (O); entre grupos se cruzan (Y).
  const [estados, setEstados] = useState<string[]>([]);
  const [saludes, setSaludes] = useState<Salud[]>([]);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [firm, setFirm] = useState<string>("todas");
  const [orden, setOrden] = useState<Orden>("nuevas");
  // Tarjetas para mirar una cuenta; lista para ver todas juntas. La
  // elección se recuerda: cambiarla en cada visita sería molesto.
  const [compacta, setCompacta] = useState(false);

  useEffect(() => {
    setCompacta(localStorage.getItem("cuentas_vista") === "lista");
  }, []);

  function cambiarVista() {
    setCompacta((v) => {
      localStorage.setItem("cuentas_vista", v ? "tarjetas" : "lista");
      return !v;
    });
  }
  // `duplicar` usa la cuenta como plantilla y crea copias nuevas en vez de
  // editarla.
  const [modal, setModal] = useState<null | {
    cuenta?: Cuenta;
    duplicar?: boolean;
  }>(null);
  const [modalRetiros, setModalRetiros] = useState<Cuenta | null>(null);
  const [modalGasto, setModalGasto] = useState<Cuenta | null>(null);
  const [modalResultado, setModalResultado] = useState<Cuenta | null>(null);

  function cambiarPestana(p: Pestana) {
    setPestana(p);
    setEstados([]); // los estados de un tipo no aplican al otro
    setSaludes([]);
  }

  function alternar<T>(lista: T[], valor: T): T[] {
    return lista.includes(valor)
      ? lista.filter((v) => v !== valor)
      : [...lista, valor];
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
      ordenarCuentas(cuentas, orden).filter((c) => {
        // Las archivadas se ven solo cuando se piden.
        const archivada = c.estado === "archivada";
        if (verArchivadas !== archivada) return false;

        if (pestana !== "todas" && c.tipo !== pestana) return false;
        if (firm !== "todas" && c.firm !== firm) return false;

        if (estados.length > 0) {
          const pasaAlguno = estados.some((v) =>
            filtrosEstado.find((f) => f.valor === v)?.pasa(c)
          );
          if (!pasaAlguno) return false;
        }

        if (saludes.length > 0) {
          const s = salud(c);
          if (s === null || !saludes.includes(s)) return false;
        }

        return true;
      }),
    // filtrosEstado se deriva de pestana, no hace falta en las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cuentas, pestana, estados, saludes, verArchivadas, firm, orden]
  );

  // El pie resume solo lo que sigue en juego: una cuenta pasada o quemada
  // ya no es capital que estés gestionando.
  const enCurso = visibles.filter((c) => enJuego(c.estado));
  const capitalGestionado = enCurso.reduce((a, c) => a + c.tamano_cuenta, 0);

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
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            aria-label="Ordenar cuentas"
            className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 outline-none focus:border-emerald-500"
          >
            {ORDENES.map((o) => (
              <option key={o} value={o}>
                {ORDEN_INFO[o]}
              </option>
            ))}
          </select>

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
            onClick={cambiarVista}
            title={compacta ? "Ver como tarjetas" : "Ver como lista"}
            className="rounded-full border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200"
          >
            {compacta ? "Tarjetas" : "Lista"}
          </button>

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
            onClick={() => setEstados((l) => alternar(l, f.valor))}
            className={`rounded-lg px-2.5 py-1 transition ${
              estados.includes(f.valor)
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Salud del drawdown: solo tiene sentido en fondeadas */}
        {pestana === "fondeada" && (
          <>
            <span className="text-neutral-800">|</span>
            {SALUDES.map((s) => (
              <button
                key={s}
                onClick={() => setSaludes((l) => alternar(l, s))}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                  saludes.includes(s)
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${SALUD_INFO[s].punto}`}
                />
                {SALUD_INFO[s].label}
              </button>
            ))}
          </>
        )}

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
          {compacta ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900">
              {visibles.map((c) => (
                <FilaCuenta
                  key={c.id}
                  cuenta={c}
                  onEditar={() => setModal({ cuenta: c })}
                  onDuplicar={() => setModal({ cuenta: c, duplicar: true })}
                  onRetiros={() => setModalRetiros(c)}
                  onGasto={() => setModalGasto(c)}
                  onResultado={() => setModalResultado(c)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visibles.map((c) => (
                <TarjetaCuenta
                  key={c.id}
                  cuenta={c}
                  retiros={retiros[c.id] ?? []}
                  resultados={resultados[c.id] ?? []}
                  onEditar={() => setModal({ cuenta: c })}
                  onDuplicar={() => setModal({ cuenta: c, duplicar: true })}
                  onRetiros={() => setModalRetiros(c)}
                  onGasto={() => setModalGasto(c)}
                  onResultado={() => setModalResultado(c)}
                />
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-600">
            {enCurso.length > 0 ? (
              <>
                {etiquetaCantidad(enCurso)} en curso · {plata(capitalGestionado)}{" "}
                de capital gestionado
              </>
            ) : (
              `${etiquetaCantidad(visibles)}, ninguna en curso`
            )}
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

      {modalResultado && (
        <ModalResultado
          cuenta={modalResultado}
          resultados={resultados[modalResultado.id] ?? []}
          onCerrar={() => setModalResultado(null)}
        />
      )}

      {modalGasto && (
        <ModalGasto
          cuentas={[]}
          cuentaFija={modalGasto}
          onCerrar={() => setModalGasto(null)}
        />
      )}

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
          duplicar={modal.duplicar}
          nombreSugerido={
            // Al duplicar, el nombre sigue la serie de la cuenta original
            // ("Apex 50k" → "Apex 50k 2") sin importar el tipo; si no, cada
            // tipo tiene su propia serie (PA1… / Evaluación 1…).
            modal.duplicar && modal.cuenta
              ? (() => {
                  const n = nombresParaLote(
                    modal.cuenta.nombre,
                    1,
                    cuentas.map((c) => c.nombre)
                  )[0];
                  return { fondeada: n, challenge: n };
                })()
              : {
                  fondeada: sugerirNombre(cuentas, "fondeada"),
                  challenge: sugerirNombre(cuentas, "challenge"),
                }
          }
          onCerrar={() => setModal(null)}
        />
      )}
    </>
  );
}
