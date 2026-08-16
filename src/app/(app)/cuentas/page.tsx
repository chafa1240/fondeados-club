import { EncabezadoSeccion } from "@/components/seccion";
import { CuentasVista } from "@/components/cuentas/cuentas-vista";
import { createClient } from "@/lib/supabase/server";
import type { Cuenta, Retiro } from "@/lib/cuentas";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const supabase = createClient();

  const [{ data: cuentas, error }, { data: payouts }] = await Promise.all([
    supabase
      .from("cuentas_fondeo")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("payouts").select("*").order("fecha", { ascending: false }),
  ]);

  // Los retiros se agrupan una sola vez acá, no en cada tarjeta.
  const retiros: Record<string, Retiro[]> = {};
  for (const p of (payouts ?? []) as Retiro[]) {
    (retiros[p.cuenta_id] ??= []).push(p);
  }

  return (
    <>
      <EncabezadoSeccion
        titulo="Cuentas"
        descripcion="Tus cuentas fondeadas y challenges."
      />

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          <p className="font-medium">No se pudieron cargar las cuentas.</p>
          <p className="mt-1 text-rose-400/80">{error.message}</p>
        </div>
      ) : (
        <CuentasVista
          cuentas={(cuentas ?? []) as Cuenta[]}
          retiros={retiros}
        />
      )}
    </>
  );
}
