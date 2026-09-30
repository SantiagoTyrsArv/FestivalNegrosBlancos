/**
 * Inserta datos estructurados JSON-LD de forma segura: se escapa "<" para que
 * un texto con "</script>" no pueda cerrar la etiqueta (patrón recomendado en
 * la guía de JSON-LD de Next). El contenido es JSON generado por nosotros.
 */
export function JsonLd({ datos }: { datos: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\u003c") }}
    />
  );
}
