"use client";

import { es } from "@/shared/i18n/es";

/** Último recurso: reemplaza el layout raíz si este falla, por eso define su propio <html>. */
export default function ErrorRaiz({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-CO">
      <body
        style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}
      >
        <h1>{es.comun.errorGenerico}</h1>
        <p>{es.comun.errorGenericoDetalle}</p>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 1.25rem" }}>
          {es.comun.reintentar}
        </button>
      </body>
    </html>
  );
}
