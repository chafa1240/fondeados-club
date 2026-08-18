import { EncabezadoSeccion } from "@/components/seccion";
import { MovimientosVista } from "@/components/movimientos/movimientos-vista";
import type { CuentaBreve } from "@/components/movimientos/modal-gasto";
import { createClient } from "@/lib/supabase/server";
import { ordenarCuentas, type Retiro } from "@/lib/cuentas";
import type { CuentaMovimientos, Gasto } from "@/lib/movimientos";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

/** Lo que hace falta de cada cuenta para los selectores y los nombres. */
type CuentaLista = CuentaBreve &
  CuentaMovimientos & {
    tipo: string;
    estado: string;
    created_at: string;
  };

export default async function FundingManagerPage() {
  const supabase = createClient();

  const [{ data: gastos, error }, { data: payouts }, { data: cuentas }] =
    await Promise.all([
      supabase.from("gastos").select("*").order("fecha", { ascending: false }),
      supabase.from("payouts").select("*").order("fecha", { ascending: false }),
      // `precio`, `fee_activacion` y `retiros_previos` viven en la cuenta
      // pero son plata que se movió: entran a la lista como movimientos
      // automáticos (ver `movimientosDeCuentas`).
      supabase
        .from("cuentas_fondeo")
        .select(
          "id, nombre, firm, tipo, estado, fecha_inicio, created_at, precio, fee_activacion, retiros_previos, profit_split",
        ),
    ]);

  // Mismo orden que la sección Cuentas, para que los desplegables se lean
  // igual en las dos pantallas.
  const lista = ordenarCuentas((cuentas ?? []) as CuentaLista[], "nuevas");

  return (
    <>
      <EncabezadoSeccion
        titulo="Funding Manager"
        descripcion="Cuánto invertiste, cuánto cobraste y cómo venís."
      />

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
          <p className="font-medium">No se pudieron cargar los movimientos.</p>
          <p className="mt-1 text-rose-400/80">{error.message}</p>
        </div>
      ) : (
        <MovimientosVista
          gastos={(gastos ?? []) as Gasto[]}
          retiros={(payouts ?? []) as Retiro[]}
          cuentas={lista}
          fondeadas={lista.filter((c) => c.tipo === "fondeada")}
        />
      )}
    </>
  );
}
