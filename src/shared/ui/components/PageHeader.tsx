import type { ReactNode } from "react";

/** Encabezado de página: un único h1 por ruta, con antetítulo y descripción opcionales. */
export function PageHeader({
  antetitulo,
  titulo,
  descripcion,
  children,
}: {
  antetitulo?: string;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-border mb-8 flex flex-col gap-3 border-b pb-6">
      {antetitulo && (
        <p className="text-primary font-mono text-xs font-semibold tracking-widest uppercase">
          {antetitulo}
        </p>
      )}
      <h1 className="text-4xl font-extrabold sm:text-5xl">{titulo}</h1>
      {descripcion && <p className="text-fg-muted max-w-2xl text-lg">{descripcion}</p>}
      {children}
    </header>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className ?? ""}`}>{children}</div>
  );
}
