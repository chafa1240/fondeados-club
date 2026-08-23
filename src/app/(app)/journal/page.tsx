import { EncabezadoSeccion } from "@/components/seccion";
import { JournalVista } from "@/components/journal/journal-vista";
import { createClient } from "@/lib/supabase/server";
import type { NotaDia } from "@/lib/journal";
import type { Resultado } from "@/lib/resultados";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

export default async function JournalPage() {
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
      supabase.from("cuentas_fondeo").select("id, nombre"),
    ]);

  const nombres: Record<string, string> = {};
  for (const c of (cuentas ?? []) as { id: string; nombre: string }[]) {
    nombres[c.id] = c.nombre;
  }

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
          <p className="font-medium">Falta correr la migración 013 en Supabase.</p>
          <p className="mt-1 text-amber-500/90">
            Abrí el SQL Editor y corré <code>supabase/013_journal.sql</code>. Hasta
            entonces se pueden ver los días pero no guardar notas.
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
          nombres={nombres}
        />
      )}
    </>
  );
}
