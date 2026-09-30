import { configDesdeEntorno, describirUrl } from "./config-scripts";
import { abrirConexion, aplicarMigraciones } from "./connection";

async function main() {
  const config = configDesdeEntorno();
  console.log(`Aplicando migraciones en ${describirUrl(config.url)}...`);
  const conexion = abrirConexion(config);
  await aplicarMigraciones(conexion);
  conexion.client.close();
  console.log("Migraciones aplicadas.");
}

main().catch((error: unknown) => {
  console.error("Error aplicando migraciones:", error);
  process.exit(1);
});
