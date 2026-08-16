import { EncabezadoSeccion, Placeholder } from "@/components/seccion";

export default function FundingManagerPage() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Funding Manager"
        descripcion="Cuánto invertiste, cuánto cobraste y cómo venís."
      />
      <Placeholder>
        Acá van las cards de resumen, los gráficos y la tabla de movimientos.
      </Placeholder>
    </>
  );
}
