/**
 * El tono de la app: claro, oscuro, o el que tenga el sistema.
 *
 * La elección vive en `localStorage` y se aplica escribiendo `data-tema`
 * en el `<html>`. **El atributo solo toma dos valores** — `claro` y
 * `oscuro` —: "sistema" se resuelve acá y no en el CSS, para no tener la
 * paleta escrita dos veces (ver `globals.css`).
 */

export const TEMAS = ["sistema", "claro", "oscuro"] as const;
export type Tema = (typeof TEMAS)[number];

export const TEMA_INFO: Record<Tema, { label: string; ayuda: string }> = {
  sistema: { label: "Sistema", ayuda: "El tono que tenga tu computadora" },
  claro: { label: "Claro", ayuda: "Siempre en claro" },
  oscuro: { label: "Oscuro", ayuda: "Siempre en oscuro" },
};

export const CLAVE_TEMA = "tema";

/** Qué tono pide el sistema operativo ahora mismo. */
export function temaDelSistema(): "claro" | "oscuro" {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
    ? "claro"
    : "oscuro";
}

/** Lo elegido, o "sistema" si nunca se eligió nada. */
export function temaGuardado(): Tema {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return t === "claro" || t === "oscuro" ? t : "sistema";
  } catch {
    // Modo incógnito con el almacenamiento bloqueado: no es motivo para
    // que la app no cargue.
    return "sistema";
  }
}

/** Pinta la app y recuerda la elección. */
export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema =
    tema === "sistema" ? temaDelSistema() : tema;

  try {
    if (tema === "sistema") localStorage.removeItem(CLAVE_TEMA);
    else localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Igual que arriba: si no se puede guardar, al menos se ve bien ahora.
  }
}

/**
 * El mismo cálculo que `aplicarTema`, pero como texto para meter en un
 * `<script>` que corre **antes** de que se pinte la página.
 *
 * Sin esto la app arranca siempre en oscuro y pega un flash blanco al
 * hidratarse, que es justo lo que hace que un modo claro se sienta roto.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t!=="claro"&&t!=="oscuro"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"claro":"oscuro"}document.documentElement.dataset.tema=t}catch(e){}})()`;
