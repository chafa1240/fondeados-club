"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalDia } from "./modal-dia";
import { Calendario } from "@/components/home/calendario";
import { Estadisticas } from "./estadisticas";
import { fechaCorta, plata } from "@/lib/cuentas";
import {
  diasDeJournal,
  vecinos,
  type CuentaJournal,
  type DiaJournal,
  type NotaDia,
} from "@/lib/journal";
import type { Tipo } from "@/lib/cuentas";
import {
  armarMes,
  diasDeTrading,
  hoyLocal,
  mesDeFecha,
  mesesConDatos,
} from "@/lib/home";
import type { Resultado } from "@/lib/resultados";

/**
 * La lista del journal: una tarjeta por día, de más nuevo a más viejo.
 *
 * El indicador de "escrito / sin escribir" es lo más importante de la
 * pantalla. Las métricas finas de la competencia (win rate, profit factor)
 * salen de operaciones importadas del broker, que nosotros no tenemos;
 * pero lo que hace que un journal se use no son esas métricas, es **ver de
 * un vistazo qué días escribiste y cuáles no**.
 */

type Filtro = "todos" | "sin_escribir" | "escritos";

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "sin_escribir", label: "Sin escribir" },
  { valor: "escritos", label: "Escritos" },
];

/**
 * Fondeadas o evaluaciones, igual que en el Home y por la misma razón: un
 * dólar de fondeada y uno de evaluación no son la misma unidad.
 *
 * **Ojo con lo que separa este filtro y lo que no.** Cambia los días que
 * ves y el número de cada día; **la nota no**, porque la nota es del día y
 * la jornada es una sola aunque hayas operado los dos tipos en paralelo.
 * Escribís una vez y la ves con cualquiera de los dos filtros puestos.
 */
const TIPOS: { valor: Tipo; label: string }[] = [
  { valor: "fondeada", label: "Fondeadas" },
  { valor: "challenge", label: "Evaluaciones" },
];

export function JournalVista({
  resultados,
  notas,
  cuentas,
  diaInicial = null,
  tipoInicial = null,
}: {
  resultados: Resultado[];
  notas: NotaDia[];
  cuentas: CuentaJournal[];
  /** Día a abrir al entrar, del `?dia=` de la URL. */
  diaInicial?: string | null;
  /** Con qué filtro abrir, del `?tipo=` de la URL. */
  tipoInicial?: Tipo | null;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>(tipoInicial ?? "fondeada");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<string | null>(diaInicial);

  // "Hoy" lo decide el navegador: el servidor corre en UTC y de noche eso
  // ya es mañana. Arranca en null para que el HTML del servidor y el del
  // cliente sean iguales.
  const [hoy, setHoy] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);

  useEffect(() => {
    const d = hoyLocal();
    setHoy(d);
    // Si venís de "Escribir el día", el calendario tiene que abrir en el
    // mes de ese día y no en el de hoy: si no, cerrás el modal y estás
    // mirando otro mes sin entender por qué.
    setMes((m) => m ?? mesDeFecha(diaInicial ?? d));
  }, [diaInicial]);

  const nombres = useMemo(
    () => Object.fromEntries(cuentas.map((c) => [c.id, c.nombre])),
    [cuentas]
  );

  /** Los resultados del tipo elegido. La nota del día no se filtra: es del día. */
  const resultadosDelTipo = useMemo(() => {
    const ids = new Set(cuentas.filter((c) => c.tipo === tipo).map((c) => c.id));
    return resultados.filter((r) => ids.has(r.cuenta_id));
  }, [resultados, cuentas, tipo]);

  const diasTrading = useMemo(
    () => diasDeTrading(resultadosDelTipo),
    [resultadosDelTipo]
  );

  const dias = useMemo(
    () => diasDeJournal(diasTrading, notas),
    [diasTrading, notas]
  );

  /** Los días con nota, para el punto verde de las celdas. */
  const escritosSet = useMemo(
    () => new Set(dias.filter((d) => d.escrito).map((d) => d.fecha)),
    [dias]
  );

  const calendario = useMemo(
    () => (mes && hoy ? armarMes(mes, diasTrading, hoy, escritosSet) : null),
    [mes, hoy, diasTrading, escritosSet]
  );

  const meses = useMemo(() => mesesConDatos(diasTrading), [diasTrading]);

  /** Cuántos días del mes que estás mirando tienen nota. */
  const escritosDelMes = useMemo(
    () => (mes ? dias.filter((d) => d.escrito && d.fecha.startsWith(mes)).length : 0),
    [dias, mes]
  );

  const visibles = useMemo(
    () =>
      dias.filter((d) =>
        filtro === "todos"
          ? true
          : filtro === "escritos"
            ? d.escrito
            : !d.escrito
      ),
    [dias, filtro]
  );

  const escritos = dias.filter((d) => d.escrito).length;

  /**
   * El día abierto. Si no está en la lista es un día en blanco del
   * calendario: se arma uno vacío en vez de no abrir nada, porque el día
   * que no operaste también se puede escribir.
   */
  const dia: DiaJournal | undefined = abierto
    ? (dias.find((d) => d.fecha === abierto) ?? {
        fecha: abierto,
        monto: null,
        entradas: 0,
        nota: undefined,
        escrito: false,
      })
    : undefined;

  // Las flechas navegan la lista COMPLETA, no la filtrada: si estás viendo
  // "sin escribir" y guardás una nota, el día no tiene que desaparecerte
  // de abajo de las flechas.
  const { anterior, siguiente } = abierto
    ? vecinos(dias, abierto)
    : { anterior: null, siguiente: null };

  const detalle = useMemo(() => {
    if (!abierto) return [];
    return resultadosDelTipo
      .filter((r) => r.fecha === abierto)
      .map((r) => ({
        id: r.id,
        cuenta: nombres[r.cuenta_id] ?? "—",
        monto: r.monto,
        sentido: r.sentido,
        sesiones: r.sesiones,
        notas: r.notas,
      }));
  }, [abierto, resultadosDelTipo, nombres]);

  return (
    <div className="space-y-4">
      <Estadisticas diasTrading={diasTrading} entradas={resultadosDelTipo} />

      {calendario && (
        <Calendario
          datos={calendario}
          onMes={setMes}
          onDia={(f) => setAbierto(f)}
          // En el journal se abre cualquier día, también los que no
          // operaste: eso también se puede escribir.
          abrirVacios
          puedeAtras={meses.length === 0 || calendario.mes > meses[0]}
          puedeAdelante={hoy !== null && calendario.mes < mesDeFecha(hoy)}
          resumen={
            <span className="text-sm text-neutral-500">
              {escritosDelMes === 0
                ? "Ninguno escrito este mes"
                : `${escritosDelMes} ${escritosDelMes === 1 ? "día escrito" : "días escritos"} este mes`}
            </span>
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              onClick={() => setTipo(t.valor)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                tipo === t.valor
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-neutral-800 p-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                filtro === f.valor
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-neutral-500">
          {escritos} de {dias.length} {dias.length === 1 ? "día" : "días"} escritos
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 px-4 py-8 text-center text-sm text-neutral-500">
          {dias.length === 0
            ? "Todavía no hay días cargados. Tocá cualquier día del calendario para escribirlo igual."
            : filtro === "escritos"
              ? "Todavía no escribiste ninguno."
              : "Están todos escritos. Bien ahí."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibles.map((d) => (
            <li key={d.fecha}>
              <button
                onClick={() => setAbierto(d.fecha)}
                className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-neutral-700"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="font-medium">{fechaCorta(d.fecha)}</span>
                  <span
                    className={`tabular-nums ${
                      d.monto === null
                        ? "text-neutral-600"
                        : d.monto > 0
                          ? "text-emerald-400"
                          : d.monto < 0
                            ? "text-rose-400"
                            : "text-neutral-300"
                    }`}
                  >
                    {d.monto === null
                      ? `Sin ${tipo === "fondeada" ? "fondeadas" : "evaluaciones"}`
                      : plata(d.monto)}
                  </span>
                  {d.entradas > 1 && (
                    <span className="text-xs text-neutral-500">
                      {d.entradas} entradas
                    </span>
                  )}
                </span>

                <span className="flex min-w-0 flex-1 items-center justify-end gap-3">
                  {d.escrito && d.nota && (
                    <span className="hidden min-w-0 flex-1 truncate text-right text-xs text-neutral-500 sm:block">
                      {d.nota.notas.replace(/\s+/g, " ").slice(0, 120)}
                    </span>
                  )}
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                      d.escrito
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-neutral-800 text-neutral-500"
                    }`}
                  >
                    {d.escrito ? "Escrito" : "Escribir"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {dia && (
        <ModalDia
          dia={dia}
          detalle={detalle}
          anterior={anterior}
          siguiente={siguiente}
          onCerrar={() => {
            setAbierto(null);
            // Saca el `?dia=` de la URL: si queda, recargar la página te
            // vuelve a abrir un día que ya cerraste.
            if (diaInicial) router.replace("/journal");
          }}
          onIr={(f) => setAbierto(f)}
          cuentas={cuentas}
          tipo={tipo}
        />
      )}
    </div>
  );
}
