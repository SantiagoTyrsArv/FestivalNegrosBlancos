import { cn } from "../cn";

/** Marcador de carga. Es decorativo: el contenedor debe anunciar el estado con aria-busy o texto. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-md", className)} />;
}

export function SkeletonTarjetas({
  cantidad = 3,
  etiqueta,
}: {
  cantidad?: number;
  etiqueta: string;
}) {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">{etiqueta}</span>
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="border-border bg-surface rounded-lg border p-5">
          <Skeleton className="mb-3 h-4 w-1/3" />
          <Skeleton className="mb-2 h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
