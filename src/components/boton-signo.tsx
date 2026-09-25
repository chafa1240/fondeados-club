"use client";

/**
 * Toggle +/− pegado a un input de resultado.
 *
 * inputMode="decimal" no garantiza una tecla de "−" en el teclado del
 * celular — varios teclados de Android (y Brave, que es donde se vio el
 * bug) la sacan directamente, así que no había forma de cargar una
 * pérdida desde el celular. Este botón niega el valor que ya está en el
 * campo en vez de depender de que el usuario pueda tipear el signo.
 */
export function BotonSigno({
  valor,
  onCambiar,
}: {
  valor: string;
  onCambiar: (v: string) => void;
}) {
  const negativo = valor.trim().startsWith("-");

  function alternar() {
    const limpio = valor.trim();
    if (limpio === "") return onCambiar("-");
    if (limpio.startsWith("-")) return onCambiar(limpio.slice(1));
    onCambiar(`-${limpio}`);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={negativo ? "Marcar como ganancia" : "Marcar como pérdida"}
      title={negativo ? "Marcar como ganancia" : "Marcar como pérdida"}
      className={`flex h-full min-h-[38px] w-11 shrink-0 items-center justify-center rounded-lg border text-lg font-semibold transition ${
        negativo
          ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
          : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
      }`}
    >
      {negativo ? "−" : "+"}
    </button>
  );
}
