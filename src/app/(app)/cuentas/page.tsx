import { EncabezadoSeccion } from "@/components/seccion";
import { CuentasVista } from "@/components/cuentas/cuentas-vista";
import { createClient } from "@/lib/supabase/server";
import type { Cuenta, Retiro } from "@/lib/cuentas";
import {
  estadoDeCuenta,
  porCuenta,
  type Resultado,
} from "@/lib/resultados";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const supabase = createClient();

  const [{ data: cuentas, error }, { data: payouts }, { data: dias }] =
    await Promise.all([
      supabase
        .from("cuentas_fondeo")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("payouts").select("*").order("fecha", { ascending: false }),
      supabase
        .from("resultados_diarios")
        .select("*")
        .order("fecha", { ascending: false }),
    ]);

  const retiros = porCuenta((payouts ?? []) as Retiro[]);
  const resultados = porCuenta((dias ?? []) as Resultado[]);

  // El balance y el pico no se guardan: se calculan con los resultados
  // diarios y los retiros, anclados en la semilla de cada cuenta. Se
  // completan acá, una sola vez, y las pantallas los leen como siempre.
  const conBalance = ((cuentas ?? []) as Cuenta[]).map((c) => {
    const estado = estadoDeCuenta(
      c,
      resultados[c.id] ?? [],
      retiros[c.id] ?? []
    );

    return {
      ...c,
      balance_actual: estado.balance,
      pico_semilla: estado.pico,
    };
  });

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
          cuentas={conBalance}
          retiros={retiros}
          resultados={resultados}
        />
      )}
    </>
  );
}
