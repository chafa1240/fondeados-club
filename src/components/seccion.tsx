export function EncabezadoSeccion({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 text-sm text-neutral-400">{descripcion}</p>
        )}
      </div>
      {accion}
    </div>
  );
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
