"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Una fila que se corre al costado, con flechas.
 *
 * Existe para no repetir el mismo scroll en dos pantallas: lo usan las
 * tarjetas de estadísticas del journal y los gráficos del Funding Manager.
 * Cada hijo decide su propio ancho (`shrink-0 snap-start` más el ancho que
 * corresponda); esto solo se ocupa de correr y de las flechas.
 *
 * Se arrastra con el dedo o la rueda **y** tiene flechas: en el celular el
 * gesto alcanza, pero en escritorio una fila que se corre sin ningún
 * control visible parece cortada, no desplazable. Las flechas se apagan al
 * llegar a cada punta, así se ve cuándo ya no hay más.
 */
export function Carrusel({
  children,
  etiqueta,
}: {
  children: React.ReactNode;
  /** Para los lectores de pantalla: "gráficos", "estadísticas". */
  etiqueta?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [puede, setPuede] = useState({ izq: false, der: false });

  const mirar = useCallback(() => {
    const el = caja.current;
    if (!el) return;
    // El −2 es para el redondeo del scroll: sin eso la flecha derecha
    // queda encendida para siempre en algunos zooms del navegador.
    setPuede({
      izq: el.scrollLeft > 2,
      der: el.scrollLeft < el.scrollWidth - el.clientWidth - 2,
    });
  }, []);

  useEffect(() => {
    mirar();
    window.addEventListener("resize", mirar);
    return () => window.removeEventListener("resize", mirar);
  }, [mirar, children]);

  function correr(hacia: 1 | -1) {
    const el = caja.current;
    if (!el) return;
    // Poco menos que una pantalla, para que lo último que veías quede a la
    // vista y no se pierda el hilo.
    el.scrollBy({ left: hacia * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const FLECHA =
    "hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-30 disabled:hover:border-neutral-800 disabled:hover:text-neutral-400 sm:flex";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={etiqueta ? `Ver ${etiqueta} anteriores` : "Ver anteriores"}
        disabled={!puede.izq}
        onClick={() => correr(-1)}
        className={FLECHA}
      >
        ‹
      </button>

      <div
        ref={caja}
        onScroll={mirar}
        className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label={etiqueta ? `Ver ${etiqueta} siguientes` : "Ver siguientes"}
        disabled={!puede.der}
        onClick={() => correr(1)}
        className={FLECHA}
      >
        ›
      </button>
    </div>
  );
}
