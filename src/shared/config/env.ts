import "server-only";
import { z } from "zod";

/** "1" | "true" → true; "0" | "false" | vacío → false. z.coerce.boolean trata "0" como true. */
const booleanFlag = z
  .enum(["0", "1", "true", "false", ""])
  .optional()
  .transform((v) => v === "1" || v === "true");

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerida"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET debe tener al menos 32 caracteres"),
  REVALIDATION_SECRET: z.string().min(16, "REVALIDATION_SECRET debe tener al menos 16 caracteres"),
  DEBUG_RENDERING: booleanFlag,
  OBSERVATORIO_PUBLICO: booleanFlag,
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Variables de entorno validadas. Se valida en el primer acceso (y en
 * `instrumentation.ts` al arrancar el servidor) para fallar rápido con un
 * mensaje claro en lugar de errores crípticos en tiempo de ejecución.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const detalle = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(`Variables de entorno inválidas: ${detalle}`);
  }
  cached = parsed.data;
  return cached;
}
