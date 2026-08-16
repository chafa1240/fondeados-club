"use client";

import { useFormStatus } from "react-dom";

export function CajaAuth({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Fondeados Club</h1>
          {subtitulo && (
            <p className="mt-1 text-sm text-neutral-400">{subtitulo}</p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-5 text-lg font-semibold">{titulo}</h2>
          {children}
        </div>
      </div>
    </main>
  );
}

export function Campo({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-neutral-300">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
      />
    </label>
  );
}

export function BotonSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Cargando…" : children}
    </button>
  );
}

export function Mensaje({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-sm ${
        error
          ? "border-red-900 bg-red-950/50 text-red-300"
          : "border-emerald-900 bg-emerald-950/50 text-emerald-300"
      }`}
    >
      {error ?? ok}
    </p>
  );
}
