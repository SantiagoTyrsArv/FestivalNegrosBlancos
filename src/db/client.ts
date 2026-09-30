import "server-only";
import { getServerEnv } from "@/shared/config/env";
import { abrirConexion, type Conexion } from "./connection";

declare global {
  var __cbnConexion: Conexion | undefined;
}

/**
 * Cliente único por proceso hacia Turso. Se guarda en `globalThis` para
 * sobrevivir a las recargas en caliente de `next dev` sin abrir conexiones nuevas.
 */
export function getConexion(): Conexion {
  const env = getServerEnv();
  globalThis.__cbnConexion ??= abrirConexion({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
  return globalThis.__cbnConexion;
}
