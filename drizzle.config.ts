import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

/** drizzle-kit (generate) trabaja con el dialecto de Turso; el esquema es sqlite-core. */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env["TURSO_DATABASE_URL"] ?? ":memory:",
    ...(process.env["TURSO_AUTH_TOKEN"] ? { authToken: process.env["TURSO_AUTH_TOKEN"] } : {}),
  },
  strict: true,
});
