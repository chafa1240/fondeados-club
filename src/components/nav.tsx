"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const SECCIONES = [
  { href: "/", label: "Home", icono: HomeIcon },
  { href: "/cuentas", label: "Cuentas", icono: CuentasIcon },
  { href: "/funding-manager", label: "Funding Manager", icono: ManagerIcon },
];

function esActiva(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Nav({ email }: { email?: string }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1">
      {SECCIONES.map(({ href, label, icono: Icono }) => {
        const activa = esActiva(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setAbierto(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              activa
                ? "bg-neutral-800 font-medium text-white"
                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
            }`}
          >
            <Icono />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Barra superior — solo en celular */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 md:hidden">
        <span className="font-bold">Fondeados Club</span>
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-label="Menú"
          className="rounded-lg border border-neutral-700 p-2 transition hover:bg-neutral-800"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Menú desplegable en celular */}
      {abierto && (
        <div className="border-b border-neutral-800 p-3 md:hidden">
          {links}
          <p className="mt-3 truncate px-3 text-xs text-neutral-500">{email}</p>
        </div>
      )}

      {/* Menú lateral — desde tablet para arriba */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-800 p-4 md:flex">
        <div className="mb-8 px-3">
          <span className="text-lg font-bold tracking-tight">Fondeados Club</span>
        </div>
        {links}
      </aside>
    </>
  );
}

/* --- Iconos (SVG inline, sin librerías) --- */

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function CuentasIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function ManagerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 14 3-4 3 3 5-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
