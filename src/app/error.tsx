"use client";

import { es } from "@/shared/i18n/es";
import { Button } from "@/shared/ui/components/Button";
import { Container } from "@/shared/ui/components/PageHeader";

/** Límite de error por defecto. Nunca muestra el mensaje interno; solo el digest para soporte. */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-24">
      <div role="alert" className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-extrabold">{es.comun.errorGenerico}</h1>
        <p className="text-fg-muted mt-4">{es.comun.errorGenericoDetalle}</p>
        {error.digest && (
          <p className="text-fg-muted mt-2 font-mono text-xs">ref: {error.digest}</p>
        )}
        <Button className="mt-8" onClick={reset}>
          {es.comun.reintentar}
        </Button>
      </div>
    </Container>
  );
}
