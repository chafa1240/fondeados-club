"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { eliminarRetiro } from "@/app/(app)/cuentas/actions";
import { eliminarGasto } from "@/app/(app)/funding-manager/actions";
import { fechaCorta, plata, type Retiro } from "@/lib/cuentas";
import {
  CATEGORIAS,
  CATEGORIA_INFO,
  type CampoCuenta,
  type Categoria,
  TIPO_MOVIMIENTO_INFO,
  acumuladoEnTiempo,
  etiquetaMes,
  mesDe,
  mesesDe,
  movimientosDe,
  porCategoria,
  porFirm,
  totales,
  type CuentaMovimientos,
  type Gasto,
  type Movimiento,
  type TipoMovimiento,
} from "@/lib/movimientos";
import {
  GraficoAcumulado,
  GraficoCategorias,
  GraficoFirms,
  Panel,
} from "./graficos";
import { ModalCampoCuenta } from "./modal-campo-cuenta";
import { ModalGasto, type CuentaBreve } from "./modal-gasto";
import { ModalRetiro } from "./modal-retiro";

const SELECT =
  "rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm outline-none transition focus:border-neutral-600";

/** Cuántos movimientos se muestran de entrada, y cuántos suma "Ver más". */
const TANDA = 20;

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

/* ---------- Filtros ---------- */

/**
 * El estado de un filtro. Hay dos instancias distintas en la pantalla —
 * una para el resumen de arriba y otra para el historial de abajo — porque
 * son dos preguntas diferentes: "cómo venís este mes" y "qué cargaste".
 * Compartir un solo filtro obligaba a romper una de las dos vistas para
 * mirar la otra.
 */
function useFiltro() {
  const [cuenta, setCuenta] = useState("todas");
  // Mes y rango de fechas son excluyentes entre sí: elegir uno limpia el
  // otro. Combinarlos deja al usuario mirando una lista vacía sin entender
  // por qué.
  const [mes, setMes] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipo, setTipo] = useState<TipoMovimiento | "todos">("todos");
  const [categoria, setCategoria] = useState<Categoria | "todas">("todas");

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

  /**
   * Tipo y categoría viajan juntos en un solo desplegable: "gasto" o
   * "gasto:reset". Son la misma pregunta en dos niveles — qué estoy
   * mirando — y separarlos obligaba a elegir dos veces.
   */
  const valorTipo =
    tipo === "gasto" && categoria !== "todas" ? `gasto:${categoria}` : tipo;

  function elegirTipo(v: string) {
    if (v.startsWith("gasto:")) {
      setTipo("gasto");
      setCategoria(v.slice("gasto:".length) as Categoria);
      return;
    }

    setTipo(v as TipoMovimiento | "todos");
    // La categoría solo existe dentro de los gastos: al salir de ahí se
    // limpia sola, si no queda un filtro invisible aplicado.
    setCategoria("todas");
  }

  const hay =
    cuenta !== "todas" ||
    mes !== "todos" ||
    desde !== "" ||
    hasta !== "" ||
    tipo !== "todos" ||
    categoria !== "todas";

  function limpiar() {
    setCuenta("todas");
    setMes("todos");
    setDesde("");
    setHasta("");
    setTipo("todos");
    setCategoria("todas");
  }

  return {
    cuenta,
    setCuenta,
    mes,
    desde,
    hasta,
    tipo,
    categoria,
    valorTipo,
    elegirMes,
    elegirDesde,
    elegirHasta,
    elegirTipo,
    hay,
    limpiar,
  };
}

type Filtro = ReturnType<typeof useFiltro>;

/**
 * El filtro de tipo, con los gastos desplegándose en un submenú.
 *
 * Es un desplegable propio y no un `<select>` porque el nativo no sabe
 * anidar: sus `optgroup` muestran todo abierto de una. Sigue el mismo
 * patrón que el menú ⋯ de las tarjetas — submenú al pasar por encima —
 * así el gesto es el mismo en toda la app.
 */
function SelectorTipo({ filtro }: { filtro: Filtro }) {
  const [abierto, setAbierto] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const etiqueta =
    filtro.tipo === "todos"
      ? "Todo"
      : filtro.tipo === "retiro"
        ? TIPO_MOVIMIENTO_INFO.retiro.plural
        : filtro.categoria === "todas"
          ? TIPO_MOVIMIENTO_INFO.gasto.plural
          : CATEGORIA_INFO[filtro.categoria].label;

  const item =
    "block w-full px-3 py-1.5 text-left text-sm text-neutral-300 transition hover:bg-neutral-800";

  function elegir(v: string) {
    filtro.elegirTipo(v);
    setAbierto(false);
    setSubmenu(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className={`${SELECT} flex items-center gap-2`}
      >
        {etiqueta}
        <span className="text-neutral-600">▾</span>
      </button>

      {abierto && (
        <div className="absolute left-0 z-30 mt-1 w-48 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          <button className={item} onClick={() => elegir("todos")}>
            Todo
          </button>

          <div
            className="relative"
            onMouseEnter={() => setSubmenu(true)}
            onMouseLeave={() => setSubmenu(false)}
          >
            <button
              className={`${item} flex items-center justify-between`}
              onClick={() => elegir("gasto")}
            >
              {TIPO_MOVIMIENTO_INFO.gasto.plural}
              <span className="text-neutral-600">›</span>
            </button>

            {submenu && (
              <div className="absolute left-full top-0 z-40 ml-1 w-52 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
                <button className={item} onClick={() => elegir("gasto")}>
                  Todos los gastos
                </button>
                {CATEGORIAS.map((c) => (
                  <button
                    key={c}
                    className={item}
                    onClick={() => elegir(`gasto:${c}`)}
                  >
                    {CATEGORIA_INFO[c].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={item} onClick={() => elegir("retiro")}>
            {TIPO_MOVIMIENTO_INFO.retiro.plural}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * El filtro de cuenta, con Fondeadas y Evaluaciones desplegándose en
 * submenús. Mismo patrón y mismo motivo que `SelectorTipo`: el `<select>`
 * nativo muestra sus grupos siempre abiertos, y con veinte cuentas eso es
 * una lista interminable.
 */
function SelectorCuenta({
  filtro,
  fondeadas,
  evaluaciones,
}: {
  filtro: Filtro;
  fondeadas: CuentaBreve[];
  evaluaciones: CuentaBreve[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [submenu, setSubmenu] = useState<null | "fondeada" | "challenge">(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        setSubmenu(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [abierto]);

  const todas = [...fondeadas, ...evaluaciones];
  const elegida = todas.find((c) => c.id === filtro.cuenta);

  const etiqueta = elegida
    ? elegida.nombre
    : filtro.cuenta === "fondeada"
      ? "Todas las fondeadas"
      : filtro.cuenta === "challenge"
        ? "Todas las evaluaciones"
        : "Todas las cuentas";

  const item =
    "block w-full px-3 py-1.5 text-left text-sm text-neutral-300 transition hover:bg-neutral-800";

  function elegir(v: string) {
    filtro.setCuenta(v);
    setAbierto(false);
    setSubmenu(null);
  }

  const grupo = (
    clave: "fondeada" | "challenge",
    label: string,
    todosLabel: string,
    lista: CuentaBreve[]
  ) =>
    lista.length > 0 && (
      <div
        className="relative"
        onMouseEnter={() => setSubmenu(clave)}
        onMouseLeave={() => setSubmenu(null)}
      >
        <button
          className={`${item} flex items-center justify-between`}
          onClick={() => elegir(clave)}
        >
          {label}
          <span className="text-neutral-600">›</span>
        </button>

        {submenu === clave && (
          <div className="absolute left-full top-0 z-40 ml-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
            <button className={item} onClick={() => elegir(clave)}>
              {todosLabel}
            </button>
            {lista.map((c) => (
              <button
                key={c.id}
                className={item}
                onClick={() => elegir(c.id)}
              >
                {c.nombre} · {c.firm}
              </button>
            ))}
          </div>
        )}
      </div>
    );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Filtrar por cuenta"
        className={`${SELECT} flex items-center gap-2`}
      >
        {etiqueta}
        <span className="text-neutral-600">▾</span>
      </button>

      {abierto && (
        <div className="absolute left-0 z-30 mt-1 w-48 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          <button className={item} onClick={() => elegir("todas")}>
            Todas las cuentas
          </button>

          {grupo("fondeada", "Fondeadas", "Todas las fondeadas", fondeadas)}
          {grupo(
            "challenge",
            "Evaluaciones",
            "Todas las evaluaciones",
            evaluaciones
          )}
        </div>
      )}
    </div>
  );
}

function Filtros({
  filtro,
  meses,
  fondeadas,
  evaluaciones,
  /**
   * El resumen filtra solo por tiempo. Por tipo no, porque comparar
   * invertido contra cobrado necesita los dos lados; y por cuenta tampoco,
   * porque la pregunta del resumen es "cómo vengo", no "cómo viene la
   * PA7" — para eso está el filtro del historial.
   */
  conTipo,
  conCuenta,
  children,
}: {
  filtro: Filtro;
  meses: string[];
  fondeadas: CuentaBreve[];
  evaluaciones: CuentaBreve[];
  conTipo?: boolean;
  conCuenta?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {conTipo && <SelectorTipo filtro={filtro} />}

      {conCuenta && (
        <SelectorCuenta
          filtro={filtro}
          fondeadas={fondeadas}
          evaluaciones={evaluaciones}
        />
      )}

      <select
        value={filtro.mes}
        onChange={(e) => filtro.elegirMes(e.target.value)}
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
          value={filtro.desde}
          onChange={(e) => filtro.elegirDesde(e.target.value)}
          aria-label="Desde"
          className={FECHA}
        />
        <span>a</span>
        <input
          type="date"
          value={filtro.hasta}
          onChange={(e) => filtro.elegirHasta(e.target.value)}
          aria-label="Hasta"
          className={FECHA}
        />
      </div>

      {filtro.hay && (
        <button
          onClick={filtro.limpiar}
          className="text-xs text-neutral-500 transition hover:text-neutral-200"
        >
          Limpiar
        </button>
      )}

      {children}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
      {children}
    </h2>
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
  cuentas: (CuentaBreve &
    CuentaMovimientos & { tipo: string; estado: string })[];
  fondeadas: CuentaBreve[];
}) {
  const resumen = useFiltro();
  const historial = useFiltro();
  const [cuantos, setCuantos] = useState(TANDA);
  const [modal, setModal] = useState<
    | null
    | { que: "gasto"; gasto?: Gasto }
    | {
        que: "retiro";
        retiro?: Retiro;
        cuentaNombre?: string;
        split?: number | null;
      }
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
        split: m.cuenta_id ? (porId.get(m.cuenta_id)?.profit_split ?? null) : null,
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

  /** Un movimiento pasa un filtro, o no. La usan las dos secciones. */
  function pasa(m: Movimiento, f: Filtro) {
    if (f.tipo !== "todos" && m.tipo !== f.tipo) return false;
    if (f.categoria !== "todas" && m.categoria !== f.categoria) return false;

    if (f.mes !== "todos" && mesDe(m.fecha) !== f.mes) return false;
    // Las fechas son "AAAA-MM-DD": comparadas como texto ya ordenan bien.
    if (f.desde !== "" && m.fecha < f.desde) return false;
    if (f.hasta !== "" && m.fecha > f.hasta) return false;

    if (f.cuenta === "todas") return true;
    // "Todas las fondeadas" / "Todas las evaluaciones"
    if (f.cuenta === "fondeada" || f.cuenta === "challenge") {
      return m.cuenta_id !== null && tipoDe(m.cuenta_id) === f.cuenta;
    }
    return m.cuenta_id === f.cuenta;
  }

  const deResumen = todos.filter((m) => pasa(m, resumen));
  const deHistorial = todos.filter((m) => pasa(m, historial));

  const meses = useMemo(() => mesesDe(todos), [todos]);

  // Los totales acompañan al resumen, que es la sección donde viven.
  const t = totales(deResumen);

  // Al cambiar cualquier filtro del historial se vuelve a la primera tanda,
  // si no queda "Ver más" apretado sobre una lista que ya no es la misma.
  useEffect(() => {
    setCuantos(TANDA);
  }, [
    historial.tipo,
    historial.categoria,
    historial.cuenta,
    historial.mes,
    historial.desde,
    historial.hasta,
  ]);

  const acumulado = acumuladoEnTiempo(deResumen);
  const categorias = porCategoria(deResumen);
  const firms = useMemo(() => porFirm(cuentas), [cuentas]);

  const enPantalla = deHistorial.slice(0, cuantos);
  const faltan = deHistorial.length - enPantalla.length;

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
      <Titulo>Resumen</Titulo>

      <Filtros
        filtro={resumen}
        meses={meses}
        fondeadas={fondeadasLista}
        evaluaciones={evaluaciones}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Total label="Invertido" valor={plata(t.invertido)} />
        <Total label="Cobrado" valor={plata(t.cobrado)} />
        <Total
          label="Neto"
          valor={`${t.neto < 0 ? "−" : "+"}${plata(Math.abs(t.neto))}`}
          clase={t.neto < 0 ? "text-rose-400" : "text-emerald-400"}
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Panel
          titulo="Invertido vs. cobrado"
          ayuda="Acumulado: cuánto llevás puesto y cuánto recuperaste"
        >
          <GraficoAcumulado puntos={acumulado} modo="comparado" />
        </Panel>

        <Panel titulo="Neto acumulado" ayuda="La diferencia entre los dos">
          <GraficoAcumulado puntos={acumulado} modo="neto" />
        </Panel>

        <Panel titulo="Gastos por categoría" ayuda="En qué se te va la plata">
          <GraficoCategorias datos={categorias} />
        </Panel>

        <Panel
          titulo="Cuentas por firm"
          ayuda="Cómo terminaron. No sigue los filtros: mira todas tus cuentas"
        >
          <GraficoFirms datos={firms} />
        </Panel>
      </div>

      <Titulo>Historial</Titulo>

      <Filtros
        filtro={historial}
        meses={meses}
        fondeadas={fondeadasLista}
        evaluaciones={evaluaciones}
        conTipo
        conCuenta
      >
        <div className="ml-auto flex gap-2">
          <button className={BOTON} onClick={() => setModal({ que: "gasto" })}>
            + Gasto
          </button>
          <button className={BOTON} onClick={() => setModal({ que: "retiro" })}>
            + Retiro
          </button>
        </div>
      </Filtros>

      {deHistorial.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
          {todos.length === 0
            ? "Todavía no cargaste ningún movimiento. Empezá por el fee de una evaluación."
            : "No hay movimientos con esos filtros."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 px-4">
          <table className="w-full">
            <tbody>
              {enPantalla.map((m) => (
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

      {faltan > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setCuantos((n) => n + TANDA)}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
          >
            Ver más ({faltan} {faltan === 1 ? "restante" : "restantes"})
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-600">
        {faltan > 0
          ? `Mostrando ${enPantalla.length} de ${deHistorial.length} movimientos`
          : `${deHistorial.length} movimiento${
              deHistorial.length === 1 ? "" : "s"
            }`}
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
          split={modal.split}
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
