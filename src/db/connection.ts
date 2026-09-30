import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import path from "node:path";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import * as schema from "./schema";

/**
 * Conexión a SQLite usando el módulo nativo `node:sqlite` (sin compilación
 * nativa) expuesto a Drizzle mediante su driver `sqlite-proxy`.
 *
 * Este archivo no importa "server-only" para poder reutilizarse desde los
 * scripts de migración/seed y desde los tests de integración. La app accede a
 * la BD únicamente a través de `client.ts`, que sí es server-only.
 */

export type Db = SqliteRemoteDatabase<typeof schema>;

export interface Conexion {
  /** Cliente tipado de Drizzle para consultas y escrituras simples. */
  db: Db;
  /** Manejador síncrono nativo: se usa para transacciones críticas (compra). */
  sqlite: DatabaseSync;
}

export const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

export function abrirConexion(url: string): Conexion {
  const sqlite = new DatabaseSync(url);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  // Varios procesos (workers de `next build`, servidor, scripts) pueden
  // escribir a la vez: se espera hasta 5 s por el lock en vez de fallar.
  sqlite.exec("PRAGMA busy_timeout = 5000;");

  const db = drizzle(
    async (query, params, method) => {
      const stmt = sqlite.prepare(query);
      const args = params as SQLInputValue[];
      if (method === "run") {
        stmt.run(...args);
        return { rows: [] };
      }
      stmt.setReturnArrays(true);
      if (method === "get") {
        const row = stmt.get(...args) as unknown as unknown[] | undefined;
        return { rows: row ?? [] };
      }
      return { rows: stmt.all(...args) as unknown as unknown[][] };
    },
    { schema }
  );

  return { db, sqlite };
}

export async function aplicarMigraciones(conexion: Conexion): Promise<void> {
  await migrate(
    conexion.db,
    async (queries) => {
      conexion.sqlite.exec("BEGIN");
      try {
        for (const q of queries) conexion.sqlite.exec(q);
        conexion.sqlite.exec("COMMIT");
      } catch (error) {
        conexion.sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    { migrationsFolder: MIGRATIONS_DIR }
  );
}
