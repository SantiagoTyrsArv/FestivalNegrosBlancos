import { eq } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { ajustes } from "@/db/schema";

/**
 * Modo Caos: hace fallar a propósito la API upstream simulada
 * (ProgramacionGateway) para observar cómo degrada cada patrón.
 * - error: la upstream responde como caída (503).
 * - lento: la upstream tarda LATENCIA_CAOS_MS en responder.
 * - invalido: la upstream responde con un payload que no cumple el contrato.
 */
export const MODOS_CAOS = ["ninguno", "error", "lento", "invalido"] as const;
export type ModoCaos = (typeof MODOS_CAOS)[number];

export const LATENCIA_CAOS_MS = 4000;

export function esModoCaos(valor: string): valor is ModoCaos {
  return (MODOS_CAOS as readonly string[]).includes(valor);
}

export interface AjustesCaos {
  modoActual(): Promise<ModoCaos>;
  cambiarModo(modo: ModoCaos): Promise<void>;
}

const CLAVE = "modo_caos";

/** Persistido en SQLite para que lo compartan todos los renders del proceso y sobreviva reinicios. */
export class DrizzleAjustesCaos implements AjustesCaos {
  constructor(private readonly db: Db) {}

  async modoActual(): Promise<ModoCaos> {
    const [fila] = await this.db.select().from(ajustes).where(eq(ajustes.clave, CLAVE)).limit(1);
    return fila && esModoCaos(fila.valor) ? fila.valor : "ninguno";
  }

  async cambiarModo(modo: ModoCaos): Promise<void> {
    await this.db
      .insert(ajustes)
      .values({ clave: CLAVE, valor: modo })
      .onConflictDoUpdate({
        target: ajustes.clave,
        set: { valor: modo, actualizadoEn: new Date().toISOString() },
      });
  }
}
