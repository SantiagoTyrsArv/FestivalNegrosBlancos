import type { ReactNode } from "react";

export function EmptyState({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="border-border rounded-lg border border-dashed px-6 py-10 text-center">
      <p className="font-display text-xl font-bold">{titulo}</p>
      {descripcion && <p className="text-fg-muted mx-auto mt-2 max-w-prose">{descripcion}</p>}
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
