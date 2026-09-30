"use client";

import { es } from "@/shared/i18n/es";
import { Button } from "@/shared/ui/components/Button";
import { Container } from "@/shared/ui/components/PageHeader";

/**
 * Solo se ve si la upstream falla y NO existe una versión previa cacheada de
 * la página (p. ej. primera visita en desarrollo con el Modo Caos activo).
 * En producción, una regeneración ISR fallida mantiene la última versión buena.
 * No se muestra `error.message`: podría filtrar detalles internos.
 */
export default function ErrorProgramacion({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-16">
      <div
        role="alert"
        className="border-danger/40 bg-surface mx-auto max-w-xl rounded-lg border p-8"
      >
        <h1 className="text-3xl font-extrabold">{es.errores.upstream}</h1>
        <p className="text-fg-muted mt-3">{es.errores.upstreamDetalle}</p>
        <Button className="mt-6" onClick={reset}>
          {es.comun.reintentar}
        </Button>
      </div>
    </Container>
  );
}
