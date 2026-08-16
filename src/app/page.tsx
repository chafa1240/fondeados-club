import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Fondeados Club</h1>
          <p className="mt-1 text-sm text-neutral-400">{user?.email}</p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm transition hover:bg-neutral-800"
          >
            Salir
          </button>
        </form>
      </header>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="font-semibold">Estás dentro 🎉</h2>
        <p className="mt-2 text-sm text-neutral-400">
          El login funciona y esta página solo se ve con sesión iniciada.
          Próximo paso: publicar la app en internet, y después el menú con
          Home / Cuentas / Funding Manager.
        </p>
      </div>
    </main>
  );
}
