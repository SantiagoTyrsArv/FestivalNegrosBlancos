import "server-only";
import type { Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getServerEnv } from "@/shared/config/env";
import { abrirConexion, aplicarMigraciones, type Conexion } from "./connection";
import { poblarDatosDemo } from "./datos-demo";
import * as schema from "./schema";

declare global {
  var __cbnConexion: Conexion | undefined;
}

/** Métodos del cliente libSQL que usa Drizzle y nuestro repositorio de boletería. */
const METODOS_CONSULTA = new Set(["execute", "batch", "transaction", "migrate", "executeMultiple"]);

/**
 * Envuelve el cliente para que toda consulta espere a que la BD esté lista
 * (migraciones + datos demo). Así el resto del código sigue siendo síncrono
 * al pedir la conexión y no necesita saber que hay una inicialización.
 */
function esperarAntesDeConsultar(client: Client, lista: Promise<void>): Client {
  return new Proxy(client, {
    get(objetivo, prop, receptor) {
      const valor: unknown = Reflect.get(objetivo, prop, receptor);
      if (typeof prop === "string" && METODOS_CONSULTA.has(prop) && typeof valor === "function") {
        return async (...args: unknown[]) => {
          await lista;
          return (valor as (...a: unknown[]) => unknown).apply(objetivo, args);
        };
      }
      return typeof valor === "function"
        ? (valor as (...a: unknown[]) => unknown).bind(objetivo)
        : valor;
    },
  });
}

/**
 * Conexión única por proceso.
 * - Por defecto (`:memory:`): BD libSQL en memoria creada al arrancar y
 *   poblada con los datos "quemados" en src/db/datos-demo.ts. No depende de
 *   ningún servicio externo; los cambios (compras, agenda, admin) viven en la
 *   memoria del proceso y se reinician con él.
 * - Con TURSO_DATABASE_URL remota: usa esa BD tal cual (poblada con `pnpm db:setup`).
 */
export function getConexion(): Conexion {
  if (globalThis.__cbnConexion) return globalThis.__cbnConexion;
  const env = getServerEnv();
  const base = abrirConexion({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

  if (env.TURSO_DATABASE_URL !== ":memory:") {
    globalThis.__cbnConexion = base;
    return base;
  }

  const lista = (async () => {
    await aplicarMigraciones(base);
    await poblarDatosDemo(base.db);
  })();
  // Un fallo aquí es irrecuperable: se registra y cada consulta lo propagará.
  lista.catch((error: unknown) =>
    console.error("[db] no se pudo inicializar la BD en memoria:", error)
  );

  const client = esperarAntesDeConsultar(base.client, lista);
  globalThis.__cbnConexion = { client, db: drizzle(client, { schema }) };
  return globalThis.__cbnConexion;
}
