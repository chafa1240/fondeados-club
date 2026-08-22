"use client";

import { useEffect, useState } from "react";
import {
  TEMAS,
  TEMA_INFO,
  aplicarTema,
  temaDelSistema,
  temaGuardado,
  type Tema,
} from "@/lib/tema";

/**
 * El botón que cambia el tono. Cicla Sistema → Claro → Oscuro.
 *
 * Arranca en null y se completa al montar: el servidor no sabe qué eligió
 * este navegador, y pintar un ícono en el servidor haría que el HTML del
 * servidor y el del cliente no coincidan.
 */
export function SelectorTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(temaGuardado());
  }, []);

  // Con "Sistema" elegido, cambiar el tono del sistema operativo tiene que
  // repintar la app en el momento, sin recargar.
  useEffect(() => {
    if (tema !== "sistema") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const alCambiar = () => {
      document.documentElement.dataset.tema = temaDelSistema();
    };

    media.addEventListener("change", alCambiar);
    return () => media.removeEventListener("change", alCambiar);
  }, [tema]);

  function siguiente() {
    if (!tema) return;
    const proximo = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length];
    setTema(proximo);
    aplicarTema(proximo);
  }

  const info = tema ? TEMA_INFO[tema] : null;

  return (
    <button
      onClick={siguiente}
      title={info ? `Tono: ${info.label} — ${info.ayuda}` : "Tono"}
      aria-label={info ? `Tono: ${info.label}. Cambiar` : "Cambiar el tono"}
      className={`flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-200 ${className}`}
    >
      {tema === "claro" ? <SolIcon /> : tema === "oscuro" ? <LunaIcon /> : <SistemaIcon />}
      <span className="md:hidden">{info ? info.label : "Tono"}</span>
    </button>
  );
}

/* --- Iconos (SVG inline, sin librerías, como el resto de la app) --- */

function SolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function LunaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SistemaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
