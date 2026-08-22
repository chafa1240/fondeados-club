import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { Nav } from "@/components/nav";
import { AdSlot } from "@/components/ad-slot";
import { SelectorTema } from "@/components/selector-tema";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Nav email={user?.email} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="hidden items-center justify-end gap-4 border-b border-neutral-800 px-6 py-3 md:flex">
          <span className="text-sm text-neutral-400">{user?.email}</span>
          <SelectorTema />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm transition hover:bg-neutral-800"
            >
              Salir
            </button>
          </form>
        </header>

        <div className="flex min-w-0 flex-1 gap-6 p-4 md:p-6">
          {/* Contenido */}
          <div className="min-w-0 flex-1">
            {children}

            {/* Publicidad al pie del contenido (hoy no ocupa nada) */}
            <AdSlot formato="banner" className="mt-8" />
          </div>

          {/* Publicidad lateral — solo en pantallas grandes */}
          <AdSlot formato="lateral" className="hidden shrink-0 xl:block" />
        </div>

        {/* Salir en celular */}
        <div className="flex items-center gap-3 border-t border-neutral-800 p-4 md:hidden">
          <SelectorTema className="shrink-0" />
          <form action={logout} className="flex-1">
            <button
              type="submit"
              className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-sm transition hover:bg-neutral-800"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
