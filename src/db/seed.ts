import { configDesdeEntorno, describirUrl } from "./config-scripts";
import { abrirConexion } from "./connection";
import { poblarDatosDemo } from "./datos-demo";

/** Carga los datos de demostración en la BD indicada por TURSO_DATABASE_URL (opcional). */
async function main() {
  const config = configDesdeEntorno();
  const { db, client } = abrirConexion(config);
  console.log(`Poblando ${describirUrl(config.url)} con datos de demostración...`);
  const r = await poblarDatosDemo(db);
  client.close();
  console.log(
    `Listo: ${r.eventos} eventos, ${r.artistas} artistas, ${r.comparsas} comparsas, ` +
      `${r.escenarios} escenarios, ${r.sesiones} sesiones de boletería.`
  );
}

main().catch((error: unknown) => {
  console.error("Error en el seed:", error);
  process.exit(1);
});
