"use client";

import { useMemo, useState, useTransition } from "react";
import { eliminarRetiro } from "@/app/(app)/cuentas/actions";
import { eliminarGasto } from "@/app/(app)/funding-manager/actions";
import { fechaCorta, plata, type Retiro } from "@/lib/cuentas";
import {
  CATEGORIA_INFO,
  type CampoCuenta,
  TIPOS_MOVIMIENTO,
  TIPO_MOVIMIENTO_INFO,
  etiquetaMes,
  mesDe,
  mesesDe,
  movimientosDe,
  totales,
  type CuentaMovimientos,
  type Gasto,
  type Movimiento,
  type TipoMovimiento,
} from "@/lib/movimientos";
import { ModalCampoCuenta } from "./modal-campo-cuenta";
import { ModalGasto, type CuentaBreve } from "./modal-gasto";
import { ModalRetiro } from "./modal-retiro";

const SELECT =
  "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm outline-none transition focus:border-neutral-600";

const FECHA =
  "rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-300 outline-none transition focus:border-neutral-600";

/* ---------- Resumen ---------- */

function Total({
  label,
  valor,
  clase,
}: {
  label: string;
  valor: string;
  clase?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${clase ?? ""}`}>
        {valor}
      </p>
    </div>
  );
}

/* ---------- Una fila ---------- */

function Fila({
  mov,
  nombreCuenta,
  onEditar,
}: {
  mov: Movimiento;
  nombreCuenta: (id: string | null) => string;
  onEditar: () => void;
}) {
  const [borrando, empezar] = useTransition();
  const info = TIPO_MOVIMIENTO_INFO[mov.tipo];

  function borrar() {
    const aviso =
      mov.tipo === "retiro"
        ? "¿Borrar este retiro? El monto vuelve al balance de la cuenta."
        : "¿Borrar este gasto?";

    if (!confirm(aviso)) return;

    empezar(async () => {
      if (mov.tipo === "retiro") {
        await eliminarRetiro(mov.id, mov.cuenta_id ?? "");
      } else {
        await eliminarGasto(mov.id);
      }
    });
  }

  return (
    <tr className="border-b border-neutral-800 last:border-0">
      <td className="whitespace-nowrap py-2.5 pr-3 text-sm text-neutral-400">
        {fechaCorta(mov.fecha)}
      </td>

      <td className="py-2.5 pr-3">
        <span className={`text-sm ${info.clase}`}>{info.label}</span>
        {mov.categoria && (
          <span className="block text-xs text-neutral-500">
            {CATEGORIA_INFO[mov.categoria].label}
          </span>
        )}
      </td>

      <td className="py-2.5 pr-3 text-sm text-neutral-300">
        {nombreCuenta(mov.cuenta_id)}
        {mov.detalle && (
          <span className="block text-xs text-neutral-500">{mov.detalle}</span>
        )}
      </td>

      <td
        className={`whitespace-nowrap py-2.5 pr-3 text-right text-sm ${info.clase}`}
      >
        {info.signo}
        {plata(mov.monto, 2)}
      </td>

      <td className="whitespace-nowrap py-2.5 text-right">
        <button
          onClick={onEditar}
          className="text-xs text-neutral-500 transition hover:text-neutral-200"
        >
          Editar
        </button>

        {/* Un movimiento automático no tiene fila propia que borrar: es un
            campo de la cuenta. Se saca poniéndolo en 0 desde el editor. */}
        {!mov.automatico && (
          <button
            disabled={borrando}
            onClick={borrar}
            className="ml-3 text-xs text-neutral-600 transition hover:text-rose-400 disabled:opacity-50"
          >
            Borrar
          </button>
        )}
      </td>
    </tr>
  );
}

/* ---------- Vista ---------- */

export function MovimientosVista({
  gastos,
  retiros,
  cuentas,
  fondeadas,
}: {
  gastos: Gasto[];
  retiros: Retiro[];
  /** Sirven para el selector y para los movimientos automáticos. */
  cuentas: (CuentaBreve & CuentaMovimientos & { tipo: string })[];
  fondeadas: CuentaBreve[];
}) {
  const [tipo, setTipo] = useState<TipoMovimiento | "todos">("todos");
  const [cuenta, setCuenta] = useState<string>("todas");
  // Mes y rango de fechas son excluyentes entre sí: elegir uno limpia el
  // otro. Combinarlos deja al usuario mirando una lista vacía sin entender
  // por qué.
  const [mes, setMes] = useState<string>("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  function elegirMes(v: string) {
    setMes(v);
    setDesde("");
    setHasta("");
  }

  function elegirDesde(v: string) {
    setDesde(v);
    setMes("todos");
  }

  function elegirHasta(v: string) {
    setHasta(v);
    setMes("todos");
  }

  const hayFiltros =
    tipo !== "todos" ||
    cuenta !== "todas" ||
    mes !== "todos" ||
    desde !== "" ||
    hasta !== "";

  function limpiar() {
    setTipo("todos");
    setCuenta("todas");
    setMes("todos");
    setDesde("");
    setHasta("");
  }
  const [modal, setModal] = useState<
    | null
    | { que: "gasto"; gasto?: Gasto }
    | { que: "retiro"; retiro?: Retiro; cuentaNombre?: string }
    | {
        que: "campo";
        campo: CampoCuenta;
        cuentaId: string;
        cuentaNombre: string;
        monto: number;
      }
  >(null);

  /**
   * Abrir el editor que corresponda a cada fila: un gasto propio, un
   * retiro, o el campo de la cuenta del que salió el movimiento automático.
   */
  function editar(m: Movimiento) {
    if (m.automatico && m.origen && m.cuenta_id) {
      return setModal({
        que: "campo",
        campo: m.origen,
        cuentaId: m.cuenta_id,
        cuentaNombre: nombres(m.cuenta_id),
        monto: m.monto,
      });
    }

    if (m.tipo === "retiro") {
      return setModal({
        que: "retiro",
        retiro: retiros.find((r) => r.id === m.id),
        cuentaNombre: nombres(m.cuenta_id),
      });
    }

    setModal({ que: "gasto", gasto: gastos.find((g) => g.id === m.id) });
  }

  const porId = useMemo(() => new Map(cuentas.map((c) => [c.id, c])), [cuentas]);

  function nombres(id: string | null) {
    return id === null ? "General" : (porId.get(id)?.nombre ?? "—");
  }

  function tipoDe(id: string) {
    return porId.get(id)?.tipo ?? "";
  }

  const todos = useMemo(
    () => movimientosDe(gastos, retiros, cuentas),
    [gastos, retiros, cuentas]
  );

  const visibles = useMemo(
    () =>
      todos.filter((m) => {
        if (tipo !== "todos" && m.tipo !== tipo) return false;

        if (mes !== "todos" && mesDe(m.fecha) !== mes) return false;
        // Las fechas son "AAAA-MM-DD": comparadas como texto ya ordenan bien.
        if (desde !== "" && m.fecha < desde) return false;
        if (hasta !== "" && m.fecha > hasta) return false;

        if (cuenta === "todas") return true;
        // "Todas las fondeadas" / "Todas las evaluaciones"
        if (cuenta === "fondeada" || cuenta === "challenge") {
          return m.cuenta_id !== null && tipoDe(m.cuenta_id) === cuenta;
        }
        return m.cuenta_id === cuenta;
      }),
    // tipoDe se deriva de `cuentas`, que no cambia mientras se filtra
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, tipo, cuenta, mes, desde, hasta]
  );

  const meses = useMemo(() => mesesDe(todos), [todos]);

  // Los totales miran lo filtrado: así "gastos de la PA7" también da su suma.
  const t = totales(visibles);

  const fondeadasLista = cuentas.filter((c) => c.tipo === "fondeada");
  const evaluaciones = cuentas.filter((c) => c.tipo === "challenge");

  // Los nombres ya usados se ofrecen al cargar uno nuevo, para no
  // reescribir "Rithmic" todos los meses.
  const nombresUsados = useMemo(
    () =>
      [...new Set(gastos.map((g) => g.descripcion).filter(Boolean))].sort() as string[],
    [gastos]
  );

  const BOTON =
    "rounded-lg border border-neutral-700 px-3 py-1.5 text-sm transition hover:bg-neutral-800";

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Total label="Invertido" valor={plata(t.invertido)} />
        <Total label="Cobrado" valor={plata(t.cobrado)} />
        <Total
          label="Neto"
          valor={`${t.neto < 0 ? "−" : "+"}${plata(Math.abs(t.neto))}`}
          clase={t.neto < 0 ? "text-rose-400" : "text-emerald-400"}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoMovimiento | "todos")}
          className={SELECT}
        >
          <option value="todos">Todo</option>
          {TIPOS_MOVIMIENTO.map((t) => (
            <option key={t} value={t}>
              {TIPO_MOVIMIENTO_INFO[t].plural}
            </option>
          ))}
        </select>

        <select
          value={cuenta}
          onChange={(e) => setCuenta(e.target.value)}
          className={SELECT}
        >
          <option value="todas">Todas las cuentas</option>

          {fondeadasLista.length > 0 && (
            <optgroup label="Fondeadas">
              <option value="fondeada">Todas las fondeadas</option>
              {fondeadasLista.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.firm}
                </option>
              ))}
            </optgroup>
          )}

          {evaluaciones.length > 0 && (
            <optgroup label="Evaluaciones">
              <option value="challenge">Todas las evaluaciones</option>
              {evaluaciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.firm}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <select
          value={mes}
          onChange={(e) => elegirMes(e.target.value)}
          aria-label="Filtrar por mes"
          className={SELECT}
        >
          <option value="todos">Todos los meses</option>
          {meses.map((m) => (
            <option key={m} value={m}>
              {etiquetaMes(m)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <input
            type="date"
            value={desde}
            onChange={(e) => elegirDesde(e.target.value)}
            aria-label="Desde"
            className={FECHA}
          />
          <span>a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => elegirHasta(e.target.value)}
            aria-label="Hasta"
            className={FECHA}
          />
        </div>

        {hayFiltros && (
          <button
            onClick={limpiar}
            className="text-xs text-neutral-500 transition hover:text-neutral-200"
          >
            Limpiar
          </button>
        )}

        <div className="ml-auto flex gap-2">
          <button className={BOTON} onClick={() => setModal({ que: "gasto" })}>
            + Gasto
          </button>
          <button className={BOTON} onClick={() => setModal({ que: "retiro" })}>
            + Retiro
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
          {todos.length === 0
            ? "Todavía no cargaste ningún movimiento. Empezá por el fee de una evaluación."
            : "No hay movimientos con esos filtros."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 px-4">
          <table className="w-full">
            <tbody>
              {visibles.map((m) => (
                <Fila
                  key={`${m.tipo}-${m.id}`}
                  mov={m}
                  nombreCuenta={nombres}
                  onEditar={() => editar(m)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-600">
        {visibles.length} movimiento{visibles.length === 1 ? "" : "s"}
      </p>

      {modal?.que === "gasto" && (
        <ModalGasto
          gasto={modal.gasto}
          cuentas={cuentas}
          nombresUsados={nombresUsados}
          onCerrar={() => setModal(null)}
        />
      )}

      {modal?.que === "retiro" && (
        <ModalRetiro
          fondeadas={fondeadas}
          retiro={modal.retiro}
          cuentaNombre={modal.cuentaNombre}
          onCerrar={() => setModal(null)}
        />
      )}

      {modal?.que === "campo" && (
        <ModalCampoCuenta
          campo={modal.campo}
          cuentaId={modal.cuentaId}
          cuentaNombre={modal.cuentaNombre}
          monto={modal.monto}
          onCerrar={() => setModal(null)}
        />
      )}
    </>
  );
}
