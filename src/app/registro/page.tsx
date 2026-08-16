"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { registro, type EstadoAuth } from "../login/actions";
import { CajaAuth, Campo, BotonSubmit, Mensaje } from "@/components/auth-ui";

const inicial: EstadoAuth = {};

export default function RegistroPage() {
  const [estado, action] = useFormState(registro, inicial);

  return (
    <CajaAuth titulo="Crear cuenta" subtitulo="Gestor de cuentas fondeadas">
      {estado.ok ? (
        <div className="flex flex-col gap-4">
          <Mensaje ok={estado.ok} />
          <Link
            href="/login"
            className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-center text-sm transition hover:bg-neutral-800"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
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

            <Mensaje error={estado.error} />

            <BotonSubmit>Crear cuenta</BotonSubmit>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-400">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400">
              Iniciar sesión
            </Link>
          </p>
        </>
      )}
    </CajaAuth>
  );
}
