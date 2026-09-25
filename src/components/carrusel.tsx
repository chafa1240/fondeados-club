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
 *
 * **Se corre solo cada 5 segundos** y al llegar al final vuelve al
 * principio. Sin eso, las tarjetas de la derecha no las veía nadie: la
 * fila entra cortada en la pantalla y parece que ahí se termina.
 *
 * Pero se frena apenas hay alguien mirando de cerca —el mouse encima, el
 * foco adentro, o recién tocaste— porque una tarjeta que se te va sola
 * mientras la leés es peor que no verla nunca. Ver `PAUSA`.
 */

/**
 * Cuánto se queda quieto después de que tocaste algo.
 *
 * El hover no alcanza: en el celular no existe, y con las flechas la mano
 * está en el botón y no arriba de la fila. Si no se frenara, apretar una
 * flecha y que a los dos segundos se corra sola se lee como que la app
 * hace lo que quiere.
 */
const PAUSA = 10_000;
const CADA = 5_000;

/**
 * Cuánto se corre el arranque de cada carrusel respecto del anterior.
 *
 * Sin esto los dos carruseles del Funding Manager montan en el mismo
 * instante, comparten el mismo reloj de 5 segundos y **saltan juntos**:
 * media pantalla que se mueve de golpe se lee como un parpadeo de la
 * página, no como algo que se está corriendo. Desfasados, lo que se ve es
 * una fila moviéndose por vez.
 *
 * No divide justo a `CADA`, así que con tres o más carruseles el desfase
 * sigue repartiéndose en vez de volver a juntarlos de a pares.
 */
const DESFASE = 1_700;

/** Cuántos carruseles se montaron: le da a cada uno su lugar en la vuelta. */
let montados = 0;
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
  /**
   * El mouse encima o el foco adentro: alguien está mirando esto.
   *
   * Es un `ref` y no un `useState` **a propósito**: nada de lo que se
   * dibuja depende de esto, y como estado volvería a armar el reloj en
   * cada hover — o sea que el carrusel perdería su desfase y volvería a
   * saltar junto con los otros justo después de que le pasás el mouse.
   */
  const mirando = useRef(false);
  /** Hasta cuándo no moverse solo, porque el usuario acaba de tocar. */
  const esperaHasta = useRef(0);

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

  /** Recién tocaste: quieto un rato. */
  const demorar = useCallback(() => {
    esperaHasta.current = Date.now() + PAUSA;
  }, []);

  /**
   * El paso solo.
   *
   * Al final vuelve al principio en vez de quedarse trabado: es una fila
   * de tarjetas que se mira en rueda, no una lista que se termina.
   *
   * No corre si el usuario pidió menos movimiento (`prefers-reduced-motion`
   * — para algunas personas una animación que no pararon es mareo o dolor
   * de cabeza, no una comodidad), ni con la pestaña en segundo plano, ni
   * si la fila entra entera: ahí no hay nada que correr.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function paso() {
      const el = caja.current;
      if (!el || mirando.current || document.hidden) return;
      if (Date.now() < esperaHasta.current) return;

      const enElFinal = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      if (enElFinal) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
    }

    // Cada carrusel entra en la vuelta un poco después que el anterior.
    const turno = montados++;
    let reloj: ReturnType<typeof setInterval>;
    const arranque = setTimeout(
      () => {
        paso();
        reloj = setInterval(paso, CADA);
      },
      CADA + ((turno * DESFASE) % CADA),
    );

    return () => {
      clearTimeout(arranque);
      clearInterval(reloj);
    };
  }, []);

  function correr(hacia: 1 | -1) {
    const el = caja.current;
    if (!el) return;
    demorar();
    // Poco menos que una pantalla, para que lo último que veías quede a la
    // vista y no se pierda el hilo.
    el.scrollBy({ left: hacia * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const FLECHA =
    "hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-30 disabled:hover:border-neutral-800 disabled:hover:text-neutral-400 sm:flex";

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => (mirando.current = true)}
      onMouseLeave={() => (mirando.current = false)}
      // El foco cuenta como estar mirando: si alguien llegó con el teclado
      // a una tarjeta, la fila no se le puede correr abajo del cursor.
      onFocus={() => (mirando.current = true)}
      onBlur={() => (mirando.current = false)}
    >
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
        // El scroll no sirve para saber si tocaste: el paso automático
        // también lo dispara. Estos tres sí son la mano del usuario.
        onWheel={demorar}
        onPointerDown={demorar}
        onTouchMove={demorar}
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
