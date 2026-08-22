import { EncabezadoSeccion } from "@/components/seccion";
import { HomeVista } from "@/components/home/home-vista";
import { createClient } from "@/lib/supabase/server";
import { ordenarCuentas, type Cuenta, type Retiro } from "@/lib/cuentas";
import { movimientosDe, type Gasto } from "@/lib/movimientos";
import { estadoDeCuenta, porCuenta, type Resultado } from "@/lib/resultados";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: cuentas, error }, { data: payouts }, { data: dias }, { data: gastos }] =
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
      supabase.from("gastos").select("*").order("fecha", { ascending: false }),
    ]);

  const retiros = (payouts ?? []) as Retiro[];
  const resultados = (dias ?? []) as Resultado[];

  const porCuentaRetiros = porCuenta(retiros);
  const porCuentaResultados = porCuenta(resultados);

  // Igual que en Cuentas: el balance y el pico no se guardan, se calculan
  // con los resultados diarios y los retiros. Se completan acá una sola vez
  // y el resto de la pantalla los lee como si fueran datos.
  const conBalance = ordenarCuentas(
    ((cuentas ?? []) as Cuenta[]).map((c) => {
      const estado = estadoDeCuenta(
        c,
        porCuentaResultados[c.id] ?? [],
        porCuentaRetiros[c.id] ?? []
      );

      return { ...c, balance_actual: estado.balance, pico_semilla: estado.pico };
    }),
    "nuevas"
  );

  // La misma lista de movimientos del Funding Manager, con los automáticos
  // incluidos (precio de la evaluación, fee de activación, retiros previos):
  // el modo "neto" del Home tiene que dar el mismo número que esa pantalla.
  const movimientos = movimientosDe(
    (gastos ?? []) as Gasto[],
    retiros,
    conBalance
  );

  return (
    <>
      <EncabezadoSeccion
        titulo="Home"
        descripcion="Cómo venís hoy, este mes y en cada cuenta."
      />

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          <p className="font-medium">No se pudieron cargar tus datos.</p>
          <p className="mt-1 text-rose-400/80">{error.message}</p>
        </div>
      ) : (
        <HomeVista
          cuentas={conBalance}
          resultados={resultados}
          movimientos={movimientos}
        />
      )}
    </>
  );
}
