"use client";

import { useFormState } from "react-dom";
import { cambiarPassword, type EstadoAuth } from "../login/actions";
import { CajaAuth, Campo, BotonSubmit, Mensaje } from "@/components/auth-ui";

const inicial: EstadoAuth = {};

export default function NuevaPasswordPage() {
  const [estado, action] = useFormState(cambiarPassword, inicial);

  return (
    <CajaAuth titulo="Nueva contraseña" subtitulo="Elegí una contraseña nueva">
      <form action={action} className="flex flex-col gap-4">
        <Campo
          label="Nueva contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Campo
          label="Repetir contraseña"
          name="password2"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <Mensaje error={estado.error} ok={estado.ok} />

        <BotonSubmit>Guardar</BotonSubmit>
      </form>
    </CajaAuth>
  );
}
