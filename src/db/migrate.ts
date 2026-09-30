import { config } from "dotenv";
import { abrirConexion, aplicarMigraciones } from "./connection";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env["DATABASE_URL"] ?? "./sqlite.db";
  console.log(`Aplicando migraciones en ${url}...`);
  const conexion = abrirConexion(url);
  await aplicarMigraciones(conexion);
  conexion.sqlite.close();
  console.log("Migraciones aplicadas.");
}

main().catch((error: unknown) => {
  console.error("Error aplicando migraciones:", error);
  process.exit(1);
});
