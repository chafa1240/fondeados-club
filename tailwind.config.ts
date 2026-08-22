import type { Config } from "tailwindcss";

/**
 * Los colores no son fijos: son variables CSS que cambian con el tono
 * (`data-tema` en el `<html>`, ver `src/app/globals.css`).
 *
 * Por qué así y no con las variantes `dark:` de Tailwind: la app tiene
 * unas 600 clases de color repartidas en 25 archivos, y cada una hubiera
 * necesitado su par `dark:`. Redefiniendo la paleta, `bg-neutral-900`
 * sigue escribiéndose igual en todos lados y es la variable la que decide
 * si eso es casi negro o blanco.
 *
 * El `<alpha-value>` es lo que mantiene vivos los modificadores de
 * opacidad: sin él, `bg-emerald-500/10` dejaría de funcionar.
 */
const tono = (nombre: string) => `rgb(var(--${nombre}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // La escala de grises es la que se da vuelta entera: en oscuro el
        // 950 es el fondo y el 100 el texto; en claro, al revés.
        neutral: {
          50: tono("n50"),
          100: tono("n100"),
          200: tono("n200"),
          300: tono("n300"),
          400: tono("n400"),
          500: tono("n500"),
          600: tono("n600"),
          700: tono("n700"),
          800: tono("n800"),
          900: tono("n900"),
          950: tono("n950"),
        },
        // De los colores solo se mueven los tonos que se usan como texto:
        // un emerald-400 se lee bien sobre negro y muy mal sobre blanco.
        // Los 500/600, que son fondos de botón y bordes con opacidad,
        // quedan igual en los dos tonos.
        emerald: {
          300: tono("emerald300"),
          400: tono("emerald400"),
          900: tono("emerald900"),
        },
        rose: {
          300: tono("rose300"),
          400: tono("rose400"),
        },
        red: {
          300: tono("red300"),
          900: tono("red900"),
          950: tono("red950"),
        },
        amber: {
          400: tono("amber400"),
          500: tono("amber500"),
        },
        sky: {
          400: tono("sky400"),
        },
      },
    },
  },
  plugins: [],
};

export default config;
