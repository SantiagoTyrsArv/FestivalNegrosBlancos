import "server-only";
import { getServerEnv } from "@/shared/config/env";
import { abrirConexion, type Conexion } from "./connection";

declare global {
  var __cbnConexion: Conexion | undefined;
}

/**
 * Conexión única por proceso. Se guarda en `globalThis` para sobrevivir a los
 * recargas en caliente de `next dev` sin abrir un manejador nuevo en cada una.
 */
export function getConexion(): Conexion {
  globalThis.__cbnConexion ??= abrirConexion(getServerEnv().DATABASE_URL);
  return globalThis.__cbnConexion;
}
