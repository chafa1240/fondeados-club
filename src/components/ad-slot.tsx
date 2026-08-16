/**
 * Espacio reservado para publicidad.
 *
 * Hoy no muestra nada (el interruptor está apagado), pero el lugar ya
 * queda ocupado en el diseño. Cuando llegue el momento de monetizar:
 *
 *  1. Se pone NEXT_PUBLIC_ADS_ENABLED=true en las variables de entorno.
 *  2. Se reemplaza el contenido de <Aviso /> por el código de AdSense.
 *  3. Cuando exista el plan premium, se agrega acá el chequeo del plan
 *     para devolver null a los usuarios que pagan.
 *
 * Con NEXT_PUBLIC_ADS_DEBUG=true se ve el hueco marcado, para revisar
 * que no moleste antes de activar avisos reales.
 */

const ADS_ACTIVAS = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const ADS_DEBUG = process.env.NEXT_PUBLIC_ADS_DEBUG === "true";

type Formato = "banner" | "lateral";

const MEDIDAS: Record<Formato, string> = {
  banner: "h-[90px] w-full",
  lateral: "h-[600px] w-[300px]",
};

export function AdSlot({
  formato = "banner",
  className = "",
}: {
  formato?: Formato;
  className?: string;
}) {
  // Sin publicidad activa y sin modo debug: no ocupa nada.
  if (!ADS_ACTIVAS && !ADS_DEBUG) return null;

  if (ADS_DEBUG && !ADS_ACTIVAS) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-neutral-700 text-xs text-neutral-600 ${MEDIDAS[formato]} ${className}`}
      >
        espacio publicidad ({formato})
      </div>
    );
  }

  return (
    <div className={`${MEDIDAS[formato]} ${className}`}>
      {/* Acá va el código de AdSense cuando se active. */}
    </div>
  );
}
