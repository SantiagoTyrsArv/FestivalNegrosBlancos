import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PATRON_ETIQUETA, revalidar } from "@/app/_lib/revalidacion";
import { getServerEnv } from "@/shared/config/env";
import { demasiadasPeticiones, json, leerCuerpo, problema } from "@/shared/http/problem";
import { ipDe, limitador } from "@/shared/http/rate-limit";

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
 * Compara secretos en tiempo constante. Se comparan los SHA-256 para que
 * ambos buffers tengan la misma longitud (timingSafeEqual lo exige) sin
 * revelar la longitud del secreto real.
 */
function secretoValido(recibido: string, esperado: string): boolean {
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

/**
 * Revalidación on-demand para sistemas externos (CMS, jurado, CI).
 * Autenticación: `Authorization: Bearer <REVALIDATION_SECRET>`.
 */
export async function POST(request: Request) {
  const espera = limitador("revalidate", 30, 60_000).consumir(ipDe(request.headers));
  if (espera > 0) return demasiadasPeticiones(espera);

  const cabecera = request.headers.get("authorization") ?? "";
  const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "";
  if (!secretoValido(token, getServerEnv().REVALIDATION_SECRET)) {
    return problema(
      401,
      "no-autorizado",
      "Secreto de revalidación inválido",
      undefined,
      {},
      {
        "WWW-Authenticate": 'Bearer realm="revalidate"',
      }
    );
  }

  const cuerpo = await leerCuerpo(request, esquema);
  if (!cuerpo.ok) return cuerpo.respuesta;
  revalidar(cuerpo.datos);
  return json({ revalidado: true, ...cuerpo.datos, ahora: new Date().toISOString() });
}
