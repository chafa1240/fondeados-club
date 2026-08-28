import { EncabezadoSeccion } from "@/components/seccion";
import { MovimientosVista } from "@/components/movimientos/movimientos-vista";
import type { CuentaBreve } from "@/components/movimientos/modal-gasto";
import { createClient } from "@/lib/supabase/server";
import { ordenarCuentas, type Cuenta, type Retiro } from "@/lib/cuentas";
import { estadoDeCuenta, porCuenta, type Resultado } from "@/lib/resultados";
import type {
  CuentaCapital,
  CuentaMovimientos,
  Gasto,
} from "@/lib/movimientos";
import type { CostoFijo } from "@/lib/costos-fijos";
import { generarCostosFijos } from "@/lib/costos-fijos-server";

// Siempre datos frescos: cada usuario ve solo lo suyo (RLS).
export const dynamic = "force-dynamic";

/** Lo que hace falta de cada cuenta para los selectores y los nombres. */
type CuentaLista = CuentaBreve &
  CuentaMovimientos &
  CuentaCapital & {
    created_at: string;
  };

export default async function FundingManagerPage() {
  const supabase = createClient();

  // Antes de leer: los costos fijos que ya vencieron se convierten en
  // gastos. Es idempotente (ver `generarCostosFijos`), así que abrir la
  // pantalla dos veces no duplica nada.
  await generarCostosFijos(supabase);

  const [
    { data: gastos, error },
    { data: payouts },
    { data: cuentas },
    { data: costosFijos },
    { data: dias },
  ] = await Promise.all([
      supabase.from("gastos").select("*").order("fecha", { ascending: false }),
      supabase.from("payouts").select("*").order("fecha", { ascending: false }),
      // `precio`, `fee_activacion` y `retiros_previos` viven en la cuenta
      // pero son plata que se movió: entran a la lista como movimientos
      // automáticos (ver `movimientosDeCuentas`).
      // `*` y no una lista de columnas: la curva de capital necesita
      // reconstruir el balance de cada cuenta igual que la sección
      // Cuentas, y eso usa casi todos los campos (semilla, drawdown, piso
      // congelado). Elegir columnas a mano acá era garantía de que la
      // próxima que se agregue rompa el cálculo en silencio.
      supabase.from("cuentas_fondeo").select("*"),
      supabase.from("costos_fijos").select("*"),
      supabase
        .from("resultados_diarios")
        .select("*")
        .order("fecha", { ascending: false }),
    ]);

  const retiros = (payouts ?? []) as Retiro[];
  const resultados = (dias ?? []) as Resultado[];

  const porCuentaRetiros = porCuenta(retiros);
  const porCuentaResultados = porCuenta(resultados);

  // La curva de balance de cada cuenta, la misma que dibuja su tarjeta en
  // Cuentas. El capital bajo gestión es la suma de esos balances: lo que
  // hay adentro de las cuentas, no el tamaño del plan que compraste.
  const conSerie = ((cuentas ?? []) as Cuenta[]).map((c) => {
    const estado = estadoDeCuenta(
      c,
      porCuentaResultados[c.id] ?? [],
      porCuentaRetiros[c.id] ?? [],
    );

    return {
      ...c,
      serie: estado.serie.map((p) => ({ fecha: p.fecha, balance: p.balance })),
    };
  });

  // Mismo orden que la sección Cuentas, para que los desplegables se lean
  // igual en las dos pantallas.
  const lista = ordenarCuentas(conSerie as unknown as CuentaLista[], "nuevas");

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
          retiros={retiros}
          cuentas={lista}
          fondeadas={lista.filter((c) => c.tipo === "fondeada")}
          costosFijos={(costosFijos ?? []) as CostoFijo[]}
        />
      )}
    </>
  );
}
