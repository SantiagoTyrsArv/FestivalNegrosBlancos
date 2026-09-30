import { config } from "dotenv";
import type { ConfigConexion } from "./connection";

/** Lee la conexión a Turso para los scripts de CLI (migrate, seed) desde .env.local / .env. */
export function configDesdeEntorno(): ConfigConexion {
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
  const url = process.env["TURSO_DATABASE_URL"];
  if (!url) throw new Error("Falta TURSO_DATABASE_URL (ver .env.example)");
  return { url, authToken: process.env["TURSO_AUTH_TOKEN"] };
}

/** Host de la BD sin credenciales, para los mensajes de consola. */
export const describirUrl = (url: string) => url.replace(/\?.*$/, "");
