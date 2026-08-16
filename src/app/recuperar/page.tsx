"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { recuperarPassword, type EstadoAuth } from "../login/actions";
import { CajaAuth, Campo, BotonSubmit, Mensaje } from "@/components/auth-ui";

const inicial: EstadoAuth = {};

export default function RecuperarPage() {
  const [estado, action] = useFormState(recuperarPassword, inicial);

  return (
    <CajaAuth
      titulo="Recuperar contraseña"
      subtitulo="Te mandamos un link por email"
    >
      <form action={action} className="flex flex-col gap-4">
        <Campo
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        <Mensaje error={estado.error} ok={estado.ok} />

        <BotonSubmit>Enviar link</BotonSubmit>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-400">
        <Link href="/login" className="hover:text-neutral-200">
          Volver a iniciar sesión
        </Link>
      </p>
    </CajaAuth>
  );
}
