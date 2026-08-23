import { EncabezadoSeccion } from "@/components/seccion";
import { JournalVista } from "@/components/journal/journal-vista";
import { createClient } from "@/lib/supabase/server";
import type { CuentaJournal, NotaDia } from "@/lib/journal";
import type { Resultado } from "@/lib/resultados";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  /** `?dia=2026-08-21` abre ese día al entrar. Lo usa el botón "Escribir
      el día" del modal de resultados, para no obligarte a buscarlo. */
  searchParams: { dia?: string; tipo?: string };
}) {
  const supabase = createClient();

  const [{ data: dias, error }, { data: notas, error: errorNotas }, { data: cuentas }] =
    await Promise.all([
      supabase
        .from("resultados_diarios")
        .select("*")
        .order("fecha", { ascending: false }),
      supabase
        .from("journal_dias")
        .select("id, fecha, notas, updated_at")
        .order("fecha", { ascending: false }),
      // `modo_drawdown` hace falta para saber si al cargar un resultado
      // desde el journal hay que pedir el máximo del día.
      supabase
        .from("cuentas_fondeo")
        .select("id, nombre, tipo, modo_drawdown, estado")
        .order("created_at", { ascending: false }),
    ]);

  const lista = (cuentas ?? []) as CuentaJournal[];

  // La tabla del journal es de la migración 013: si todavía no se corrió,
  // la pantalla tiene que decirlo con todas las letras en vez de tirar el
  // error crudo de Postgres.
  const faltaMigracion =
    errorNotas !== null && errorNotas.message.includes("journal_dias");

  return (
    <>
      <EncabezadoSeccion
        titulo="Journal"
        descripcion="Qué pasó cada día, escrito por vos."
      />

      {faltaMigracion && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
          <p className="font-medium">
            El journal todavía no puede guardar notas.
          </p>
          <p className="mt-1 text-amber-500/90">
            Corré <code>supabase/013_journal.sql</code> completo en el SQL Editor
            de Supabase. Si ya lo corriste, volvé a correrlo: le faltaba el
            permiso de la API (este proyecto no expone las tablas nuevas solo).
          </p>
          {/* El mensaje crudo, que es el que dice si es "no existe la tabla"
              o "permission denied". Adivinar cuál de los dos es cuesta más
              que mostrarlo. */}
          <p className="mt-2 font-mono text-xs text-amber-500/70">
            {errorNotas?.message}
          </p>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          <p className="font-medium">No se pudieron cargar tus días.</p>
          <p className="mt-1 text-rose-400/80">{error.message}</p>
        </div>
      ) : (
        <JournalVista
          resultados={(dias ?? []) as Resultado[]}
          notas={(notas ?? []) as NotaDia[]}
          cuentas={lista}
          diaInicial={searchParams.dia ?? null}
          tipoInicial={
            searchParams.tipo === "fondeada" || searchParams.tipo === "challenge"
              ? searchParams.tipo
              : null
          }
        />
      )}
    </>
  );
}
