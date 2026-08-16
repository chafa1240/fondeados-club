import { EncabezadoSeccion, Placeholder } from "@/components/seccion";

export default function HomePage() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Home"
        descripcion="Resumen rápido de tus cuentas y tus números."
      />
      <Placeholder>
        Esta sección se define en el Paso 7, cuando ya existan datos reales
        de Cuentas y Funding Manager.
      </Placeholder>
    </>
  );
}
