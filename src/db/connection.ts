import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

/**
 * Conexión a Turso (libSQL, compatible con SQLite) con el driver oficial de
 * Drizzle. La misma función sirve para la BD en la nube (`libsql://...` +
 * token) y para BDs locales de libSQL (`:memory:` en los tests).
 *
 * No importa "server-only" para poder usarse desde scripts y tests; la app
 * accede a la BD únicamente a través de `client.ts`, que sí es server-only.
 */

export type Db = LibSQLDatabase<typeof schema>;

export interface Conexion {
  /** Cliente tipado de Drizzle para consultas y escrituras simples. */
  db: Db;
  /** Cliente libSQL nativo: se usa para la transacción interactiva de compra. */
  client: Client;
}

export interface ConfigConexion {
  url: string;
  authToken?: string | undefined;
}

export const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

export function abrirConexion({ url, authToken }: ConfigConexion): Conexion {
  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  return { db: drizzle(client, { schema }), client };
}

export async function aplicarMigraciones(conexion: Conexion): Promise<void> {
  // Las claves foráneas se activan por conexión; Turso las aplica por defecto.
  await conexion.client.execute("PRAGMA foreign_keys = ON");
  await migrate(conexion.db, { migrationsFolder: MIGRATIONS_DIR });
}
