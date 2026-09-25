"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { BotonSigno } from "@/components/boton-signo";
import { SelectorSentido } from "@/components/selector-sentido";
import { SelectorSesion } from "@/components/selector-sesion";
import {
  eliminarResultado,
  guardarResultado,
  type EstadoForm,
} from "@/app/(app)/cuentas/resultados-actions";
import {
  estaCongelado,
  fechaCorta,
  plata,
  trailea,
  type Cuenta,
} from "@/lib/cuentas";
import { diaOperativoLocal } from "@/lib/home";
import {
  agruparPorDia,
  entradasDelDia,
  maximoDelDia,
  SENTIDO_INFO,
  SESION_INFO,
  montoDeResultado,
  pctDeResultado,
  sesionQueCuenta,
  type Resultado,
  type Sentido,
  type Sesion,
} from "@/lib/resultados";

const INPUT =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500";

function Boton({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending
        ? "Guardando…"
        : editando
          ? "Guardar cambios"
          : "Agregar al día"}
    </button>
  );
}

function JournalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function aNumero(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function Monto({ valor, clase = "" }: { valor: number; clase?: string }) {
  const positivo = valor >= 0;
  return (
    <span
      className={`${positivo ? "text-emerald-400" : "text-rose-400"} ${clase}`}
    >
      {positivo ? "+" : "−"}
      {plata(Math.abs(valor), 2)}
    </span>
  );
}

/** Una entrada del día que se está mirando: se puede corregir o borrar. */
function FilaEntrada({
  entrada,
  editando,
  onEditar,
}: {
  entrada: Resultado;
  editando: boolean;
  onEditar: () => void;
}) {
  const [borrando, empezar] = useTransition();

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 ${
        editando ? "bg-emerald-500/10" : ""
      }`}
    >
      <div className="min-w-0">
        {entrada.sentido && (
          <span
            className={`mr-1.5 text-xs ${
              entrada.sentido === "long" ? "text-emerald-500" : "text-rose-500"
            }`}
            title={SENTIDO_INFO[entrada.sentido].label}
          >
            {SENTIDO_INFO[entrada.sentido].flecha}
          </span>
        )}
        <Monto valor={entrada.monto} clase="text-sm" />
        {sesionQueCuenta(entrada.sesiones) && (
          <span
            className="ml-2 text-xs text-sky-400/80"
            title={
              (entrada.sesiones ?? []).length > 1
                ? `${(entrada.sesiones ?? [])
                    .map((x) => SESION_INFO[x].label)
                    .join(" → ")} · cuenta para la de cierre`
                : undefined
            }
          >
            {SESION_INFO[sesionQueCuenta(entrada.sesiones)!].corto}
          </span>
        )}
        {entrada.notas && (
          <span className="ml-2 text-xs text-neutral-500">{entrada.notas}</span>
        )}
        {entrada.pico_dia !== null && (
          <span className="ml-2 text-xs text-neutral-600">
            máximo +{plata(entrada.pico_dia, 2)}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onEditar}
          className="text-xs text-neutral-500 transition hover:text-neutral-200"
        >
          {editando ? "Editando" : "Corregir"}
        </button>
        <button
          type="button"
          disabled={borrando}
          onClick={() => {
            if (!confirm("¿Borrar esta entrada?")) return;
            empezar(async () => {
              await eliminarResultado(entrada.id);
            });
          }}
          className="text-xs text-neutral-600 transition hover:text-rose-400 disabled:opacity-50"
        >
          Borrar
        </button>
      </div>
    </li>
  );
}

/** Un día ya cerrado, en la lista de abajo. */
function FilaDia({
  fecha,
  monto,
  entradas,
  onIr,
}: {
  fecha: string;
  monto: number;
  entradas: number;
  onIr: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-neutral-800 py-2 last:border-0">
      <div className="min-w-0">
        <Monto valor={monto} clase="text-sm" />
        <p className="text-xs text-neutral-500">
          {fechaCorta(fecha)}
          {entradas > 1 ? ` · ${entradas} entradas` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onIr}
        className="shrink-0 text-xs text-neutral-600 transition hover:text-neutral-200"
      >
        Ver
      </button>
    </li>
  );
}

/**
 * Carga de resultados de un día.
 *
 * **Un día puede tener varias entradas**: si operaste dos veces, se cargan
 * las dos y el día es la suma. Hasta la migración 012 era una sola fila
 * por día y la segunda carga pisaba a la primera, que es exactamente lo
 * que uno no espera cuando tuvo dos trades.
 *
 * El **máximo del día** sigue siendo uno solo por jornada: se mide desde
 * la apertura del día, no desde cada operación. Por eso el campo aparece
 * una vez y muestra el que ya esté cargado.
 */
export function ModalResultado({
  cuenta,
  resultados,
  onCerrar,
}: {
  cuenta: Cuenta;
  resultados: Resultado[];
  onCerrar: () => void;
}) {
  const router = useRouter();
  const [estado, formAction] = useFormState<EstadoForm, FormData>(
    guardarResultado,
    {}
  );

  // El "día operativo" adelanta la sugerencia y el tope después de que
  // reabre el mercado tras Nueva York (18hs NY, ~19-20hs Buenos Aires
  // según la época del año): cargar la sesión de Asia de esta noche va
  // fechado mañana, no hoy. `hoyLocal()` puro se sigue usando en el
  // resto de la app (Home, calendario): esto es solo para este form.
  const hoy = diaOperativoLocal();
  const [fecha, setFecha] = useState(hoy);
  const [monto, setMonto] = useState("");
  const [pct, setPct] = useState("");
  const [notas, setNotas] = useState("");
  const [sentido, setSentido] = useState<Sentido | null>(null);
  // Tampoco se limpia al guardar: el segundo trade del día casi siempre
  // cae en la misma sesión que el primero.
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  /**
   * Se prende al guardar un día y se apaga si decís que no.
   *
   * Es una invitación, no un cartel de éxito: el "guardado" ya se ve
   * porque la entrada aparece en la lista de arriba. Lo que agrega es
   * ofrecerte escribir **en el único momento en que te acordás de todo**,
   * que es el segundo después de cargar el número. Si no, la nota se
   * escribe tres días más tarde o no se escribe nunca.
   */
  const [invita, setInvita] = useState(false);
  /** Aviso de que la cuenta se cerró sola (quemada o passed) al guardar. */
  const [avisoCierre, setAvisoCierre] = useState<string | null>(null);

  const delDia = entradasDelDia(resultados, fecha);
  const netoDelDia = delDia.reduce((a, r) => a + r.monto, 0);
  const maximo = maximoDelDia(resultados, fecha);

  const editando = delDia.find((r) => r.id === editandoId) ?? null;

  /** Vuelve el formulario a "agregar una entrada nueva". */
  const limpiar = useCallback(() => {
    setEditandoId(null);
    setMonto("");
    setPct("");
    setNotas("");
    // El lado NO se limpia: el segundo trade del día suele ir para el
    // mismo lado, igual que las cuentas elegidas en el journal.
  }, []);

  /** Hay algo tipeado que todavía no se guardó. */
  const sinGuardar =
    monto.trim() !== "" || pct.trim() !== "" || notas.trim() !== "";

  function irAlJournal() {
    if (
      sinGuardar &&
      !confirm(
        "Tenés un resultado escrito sin guardar. Si vas al journal ahora, se pierde. ¿Vas igual?"
      )
    ) {
      return;
    }
    // El tipo viaja con el día: si venís de una fondeada, el journal
    // abre en fondeadas. Llegar a una pantalla filtrada por otra cosa te
    // hace dudar de si el número que ves es el de tu cuenta.
    router.push(`/journal?dia=${fecha}&tipo=${cuenta.tipo}`);
  }

  // Cambiar de día siempre arranca de cero: seguir editando una entrada de
  // otra fecha guardaría el cambio en el día equivocado.
  useEffect(() => {
    limpiar();
  }, [fecha, limpiar]);

  // Si la entrada que se estaba corrigiendo se borró, el formulario no
  // puede quedar apuntando a una fila que ya no existe. Se compara contra
  // los ids en texto y no contra el array: `delDia` se arma en cada render
  // y como dependencia haría correr esto siempre.
  const idsDelDia = delDia.map((r) => r.id).join(",");

  useEffect(() => {
    if (editandoId && !idsDelDia.split(",").includes(editandoId)) limpiar();
  }, [idsDelDia, editandoId, limpiar]);

  function empezarAEditar(entrada: Resultado) {
    setEditandoId(entrada.id);
    setMonto(String(entrada.monto));
    setPct(entrada.pct !== null ? String(entrada.pct) : "");
    setNotas(entrada.notas ?? "");
    setSentido(entrada.sentido ?? null);
    setSesiones(entrada.sesiones ?? []);
  }

  function cambiarMonto(v: string) {
    setMonto(v);
    if (v === "") return setPct("");
    const n = aNumero(v);
    if (!Number.isNaN(n)) setPct(String(pctDeResultado(cuenta.tamano_cuenta, n)));
  }

  function cambiarPct(v: string) {
    setPct(v);
    if (v === "") return setMonto("");
    const n = aNumero(v);
    if (!Number.isNaN(n)) {
      setMonto(String(montoDeResultado(cuenta.tamano_cuenta, n)));
    }
  }

  // Después de agregar una entrada el formulario se vacía solo, así se
  // puede cargar la siguiente sin borrar a mano lo anterior.
  //
  // La dependencia es el objeto entero y no `estado.ok`: la action
  // devuelve el mismo texto en cada alta, así que comparando el string
  // esto correría una sola vez y la segunda entrada del día quedaría
  // escrita en el formulario.
  useEffect(() => {
    if (estado.ok) {
      limpiar();
      setInvita(true);
    }
    // El aviso de cierre automático se guarda aparte y no se pisa con la
    // próxima carga hasta que el usuario lo cierra a mano: si guardás
    // varias entradas seguidas después de quemarte, seguís viéndolo.
    if (estado.cierre) setAvisoCierre(estado.cierre);
  }, [estado, limpiar]);

  // Cambiar de día se lleva la invitación puesta: es del día que guardaste.
  useEffect(() => {
    setInvita(false);
  }, [fecha]);

  // El máximo del día solo importa mientras el trailing siga vivo: una vez
  // congelado, el flotante ya no mueve el piso.
  const pideMaximo = trailea(cuenta.modo_drawdown) && !estaCongelado(cuenta);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCerrar]);

  const dias = agruparPorDia(resultados)
    .filter((d) => d.fecha !== fecha)
    .reverse()
    .slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="my-8 w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Resultados del día</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {cuenta.nombre} · {cuenta.firm}
            </p>
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
          <input type="hidden" name="cuenta_id" value={cuenta.id} />
          {/* Con `id` la action corrige esa entrada; sin él, agrega una. */}
          {editando && <input type="hidden" name="id" value={editando.id} />}

          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">Día</span>
            <input
              name="fecha"
              type="date"
              required
              max={hoy}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={INPUT}
            />
          </label>

          {/* Lo que ya se cargó en este día. Está arriba del formulario a
              propósito: es lo primero que uno quiere ver al volver a
              entrar, y deja claro que lo nuevo se suma en vez de pisar. */}
          {delDia.length > 0 && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
              <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-neutral-600">
                <span>
                  {delDia.length === 1
                    ? "1 entrada este día"
                    : `${delDia.length} entradas este día`}
                </span>
                <span className="normal-case tracking-normal">
                  Neto: <Monto valor={netoDelDia} />
                </span>
              </div>
              <ul className="-mx-2">
                {delDia.map((e) => (
                  <FilaEntrada
                    key={e.id}
                    entrada={e}
                    editando={e.id === editandoId}
                    onEditar={() => empezarAEditar(e)}
                  />
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Resultado (USD)
              </span>
              <div className="flex gap-1.5">
                <BotonSigno valor={monto} onCambiar={cambiarMonto} />
                <input
                  name="monto"
                  required
                  inputMode="decimal"
                  autoFocus
                  placeholder="481.46"
                  value={monto}
                  onChange={(e) => cambiarMonto(e.target.value)}
                  className={INPUT}
                />
              </div>
              <span className="mt-1 block text-xs text-neutral-500">
                Tocá el signo para marcarlo como pérdida.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Resultado (%)
              </span>
              <input
                name="pct"
                inputMode="decimal"
                value={pct}
                onChange={(e) => cambiarPct(e.target.value)}
                className={INPUT}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Sobre el tamaño de cuenta
              </span>
            </label>
          </div>

          {/* El máximo del día mueve SOLO el piso del drawdown, nunca el
              balance. Sin él, en una cuenta trailing intradía el colchón
              queda optimista. Es uno por jornada, no uno por operación. */}
          {pideMaximo && (
            <label className="block">
              <span className="mb-1.5 block text-sm text-neutral-300">
                Máximo del día (USD)
              </span>
              <input
                name="pico_dia"
                inputMode="decimal"
                defaultValue={maximo !== null ? String(maximo) : ""}
                key={`${fecha}-${maximo}`}
                placeholder="vacío = se usa el cierre"
                className={INPUT}
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Cuánto llegaste a tener arriba dentro del día, medido desde
                que abrió la jornada — no desde esta operación. Es uno solo
                por día y va también en los días perdedores: el trailing
                sube igual y no vuelve.
              </span>
            </label>
          )}

          <div className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">
              Long o short
            </span>
            <SelectorSentido valor={sentido} onCambiar={setSentido} />
            <span className="mt-1 block text-xs text-neutral-500">
              Opcional. Si el número es el neto de un día en que operaste
              para los dos lados, dejalo sin marcar.
            </span>
          </div>

          <div className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">
              Sesión
            </span>
            <SelectorSesion valor={sesiones} onCambiar={setSesiones} />
            <span className="mt-1 block text-xs text-neutral-500">
              Opcional. Si la operación cruzó de plaza, marcá las dos: la
              plata cuenta para la de cierre. Con las tres marcadas cuenta
              para la última que toques.
            </span>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm text-neutral-300">Notas</span>
            <input
              name="notas"
              placeholder="Opcional"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className={INPUT}
            />
          </label>

          <p className="text-xs text-neutral-500">
            {delDia.length > 0
              ? "El balance de la cuenta usa el neto del día: la suma de todas las entradas."
              : "El balance de la cuenta se recalcula solo con esto."}
          </p>

          {estado.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {estado.error}
            </p>
          )}

          {avisoCierre && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-300">{avisoCierre}</p>
              <button
                type="button"
                onClick={() => setAvisoCierre(null)}
                className="shrink-0 text-sm text-amber-400/70 transition hover:text-amber-300"
              >
                Cerrar
              </button>
            </div>
          )}

          {invita && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
              <p className="min-w-0 flex-1 text-sm text-emerald-300">
                Guardado. ¿Escribís qué pasó ese día, mientras te acordás?
              </p>
              <button
                type="button"
                onClick={irAlJournal}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                <JournalIcon />
                Escribir el día
              </button>
              <button
                type="button"
                onClick={() => setInvita(false)}
                className="text-sm text-neutral-400 transition hover:text-neutral-200"
              >
                Ahora no
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {/* Está siempre, también mientras cargás: el momento en que
                mejor te acordás de lo que pasó es justo ese. Es un botón y
                no un link porque antes de irse tiene que avisar si dejás
                un resultado a medio escribir — irte a escribir la nota y
                volver para descubrir que el número se perdió es la peor
                forma de aprender cómo funciona la pantalla. */}
            {/* Mientras está la invitación, este se esconde: dos botones
                iguales a la vez, uno arriba del otro, no dan el doble de
                ganas de escribir — dan la mitad. */}
            {!invita && (
              <button
                type="button"
                onClick={irAlJournal}
                title="Ir al journal a escribir qué pasó ese día"
                className="mr-auto flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-neutral-100"
              >
                <JournalIcon />
                Escribir el día
              </button>
            )}

            {editando ? (
              <button
                type="button"
                onClick={limpiar}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
              >
                Cerrar
              </button>
            )}
            <Boton editando={editando !== null} />
          </div>
        </form>

        {dias.length > 0 && (
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">
              Otros días
            </p>
            <ul>
              {dias.map((d) => (
                <FilaDia
                  key={d.fecha}
                  fecha={d.fecha}
                  monto={d.monto}
                  entradas={d.entradas}
                  onIr={() => setFecha(d.fecha)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
