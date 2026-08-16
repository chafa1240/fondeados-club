"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { login, type EstadoAuth } from "./actions";
import { CajaAuth, Campo, BotonSubmit, Mensaje } from "@/components/auth-ui";

const inicial: EstadoAuth = {};

export default function LoginPage() {
  const [estado, action] = useFormState(login, inicial);

  return (
    <CajaAuth titulo="Iniciar sesión" subtitulo="Gestor de cuentas fondeadas">
      <form action={action} className="flex flex-col gap-4">
        <Campo
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Campo
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        <Mensaje error={estado.error} ok={estado.ok} />

        <BotonSubmit>Entrar</BotonSubmit>
      </form>

      <div className="mt-5 flex flex-col gap-2 text-center text-sm text-neutral-400">
        <Link href="/recuperar" className="hover:text-neutral-200">
          Olvidé mi contraseña
        </Link>
        <p>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-emerald-500 hover:text-emerald-400">
            Crear cuenta
          </Link>
        </p>
      </div>
    </CajaAuth>
  );
}
