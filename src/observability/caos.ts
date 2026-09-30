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

/** Guardado en memoria del proceso: lo comparten todos los renders mientras el servidor viva. */
export class AjustesCaosEnMemoria implements AjustesCaos {
  private modo: ModoCaos = "ninguno";

  async modoActual(): Promise<ModoCaos> {
    return this.modo;
  }

  async cambiarModo(modo: ModoCaos): Promise<void> {
    this.modo = modo;
  }
}
