import { z } from "zod";
import { PATRON_ETIQUETA, revalidar } from "@/app/_lib/revalidacion";
import { json, leerCuerpo } from "@/shared/http/problem";

const esquema = z
  .object({
    etiquetas: z
      .array(z.string().regex(PATRON_ETIQUETA, "etiqueta no permitida"))
      .max(20)
      .optional(),
    rutas: z
      .array(
        z
          .string()
          .startsWith("/")
          .max(200)
          .refine((r) => !r.startsWith("//"), "ruta inválida")
      )
      .max(20)
      .optional(),
    modo: z.enum(["swr", "inmediata"]).default("swr"),
  })
  .refine(
    (b) => (b.etiquetas?.length ?? 0) + (b.rutas?.length ?? 0) > 0,
    "Indica al menos una etiqueta o ruta"
  );

/**
 * Revalidación on-demand para sistemas externos (CMS, jurado, CI):
 * `POST /api/revalidate` con `{ "etiquetas": ["resultados"] }` o `{ "rutas": ["/"] }`.
 */
export async function POST(request: Request) {
  const cuerpo = await leerCuerpo(request, esquema);
  if (!cuerpo.ok) return cuerpo.respuesta;
  revalidar(cuerpo.datos);
  return json({ revalidado: true, ...cuerpo.datos, ahora: new Date().toISOString() });
}
