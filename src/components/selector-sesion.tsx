"use client";

import {
  SESIONES,
  SESION_INFO,
  sesionQueCuenta,
  type Sesion,
} from "@/lib/resultados";

/**
 * En qué sesión operaste: Asia, Londres o Nueva York.
 *
 * **Se pueden marcar varias**, y ese es el punto: una operación puede
 * cruzar de plaza —entrás en Londres y cerrás cuando ya abrió Nueva
 * York— y obligar a elegir una sola haría que la mitad de las entradas
 * estuvieran mal clasificadas.
 *
 * La plata, en cambio, cuenta para **una sola**: la de cierre. Con dos
 * marcadas la decide el reloj y con tres, la última que tocaste (ver
 * `sesionQueCuenta()`). Por eso el componente **dice en pantalla a cuál
 * le cuenta**: una regla que el usuario no ve es una regla que va a
 * creer que la app se equivocó.
 *
 * Se puede dejar sin marcar, igual que el lado: las estadísticas cuentan
 * solo las marcadas y dicen cuántas quedaron afuera.
 */
export function SelectorSesion({
  valor,
  onCambiar,
  compacto = false,
}: {
  /** Las marcadas, **en el orden en que se marcaron**. */
  valor: Sesion[];
  onCambiar: (v: Sesion[]) => void;
  /** Para el alta rápida del journal, donde va en una fila con el monto. */
  compacto?: boolean;
}) {
  const cuenta = sesionQueCuenta(valor);

  function alternar(s: Sesion) {
    // Se agrega al final: el orden de la lista es el orden en que se
    // marcaron, y con las tres puestas es lo único que decide.
    onCambiar(valor.includes(s) ? valor.filter((x) => x !== s) : [...valor, s]);
  }

  return (
    <>
      <input type="hidden" name="sesiones" value={valor.join(",")} />

      <div className="flex flex-wrap items-center gap-1.5">
        {SESIONES.map((s) => {
          const info = SESION_INFO[s];
          const activa = valor.includes(s);
          // La de cierre va más marcada que las otras elegidas: es la que
          // se lleva la plata y tiene que poder leerse de un vistazo.
          const clase = activa
            ? cuenta === s
              ? "border-sky-500/50 bg-sky-500/15 text-sky-400"
              : "border-sky-500/25 bg-sky-500/5 text-sky-400/70"
            : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200";

          return (
            <button
              key={s}
              type="button"
              aria-pressed={activa}
              onClick={() => alternar(s)}
              title={info.horario}
              className={`rounded-full border px-3 ${
                compacto ? "py-2" : "py-1.5"
              } text-xs transition ${clase}`}
            >
              {info.label}
            </button>
          );
        })}

        {valor.length > 1 && cuenta && (
          <span className="text-xs text-neutral-500">
            cuenta para {SESION_INFO[cuenta].label}
          </span>
        )}
      </div>
    </>
  );
}
