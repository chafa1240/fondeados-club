/**
 * La generación de los gastos de cada costo fijo.
 *
 * Vive aparte de `costos-fijos.ts` porque toca la base: ese archivo es
 * cálculo puro y se va a reusar tal cual en la app móvil, este no.
 *
 * Corre al abrir el Home y el Funding Manager, que son las dos pantallas
 * donde el número tiene que estar al día. No hay cron ni job: la app solo
 * existe cuando alguien la abre, y generar al leer alcanza — lo único que
 * importa es que sea **idempotente**, y lo es por partida doble
 * (`ultimo_periodo` en la plantilla y el índice único en `gastos`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  periodosPendientes,
  type CostoFijo,
} from "./costos-fijos";

/** Código de Postgres para "chocaste contra un índice único". */
const DUPLICADO = "23505";

/**
 * Crea los gastos de todos los períodos vencidos que falten.
 *
 * Devuelve cuántos gastos creó (0 la enorme mayoría de las veces: solo el
 * primer día de cada mes hay algo que hacer).
 *
 * Nunca tira: si algo falla, la pantalla tiene que abrir igual. Un costo
 * fijo que no se generó se genera en la próxima carga; una pantalla que
 * no abre es un problema de verdad.
 */
export async function generarCostosFijos(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase
    .from("costos_fijos")
    .select("*")
    .eq("activo", true);

  if (error || !data) return 0;

  let creados = 0;

  for (const costo of data as CostoFijo[]) {
    const pendientes = periodosPendientes(costo);
    if (pendientes.length === 0) continue;

    const filas = pendientes.map((periodo) => ({
      cuenta_id: costo.cuenta_id,
      categoria: costo.categoria,
      monto: costo.monto,
      fecha: periodo,
      periodo,
      descripcion: costo.nombre,
      costo_fijo_id: costo.id,
    }));

    const { error: errorAlta } = await supabase.from("gastos").insert(filas);

    // Duplicado = otra pestaña se adelantó y ya los creó. El período está
    // cubierto igual, así que se avanza `ultimo_periodo` lo mismo.
    if (errorAlta && errorAlta.code !== DUPLICADO) continue;
    if (!errorAlta) creados += filas.length;

    await supabase
      .from("costos_fijos")
      .update({ ultimo_periodo: pendientes[pendientes.length - 1] })
      .eq("id", costo.id);
  }

  return creados;
}
