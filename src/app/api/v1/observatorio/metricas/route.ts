import { casos } from "@/composition-root";
import { resumirPorRuta } from "@/observability/domain/medicion";
import { json } from "@/shared/http/problem";

export const dynamic = "force-dynamic";

/** Métricas del observatorio (lectura pública: no contiene datos personales). */
export async function GET() {
  const c = casos();
  const [mediciones, modoCaos] = await Promise.all([
    c.mediciones.recientes(500),
    c.caos.modoActual(),
  ]);
  return json({
    generadoEn: new Date().toISOString(),
    modoCaos,
    resumen: resumirPorRuta(mediciones),
    recientes: mediciones.slice(0, 120).map((m) => ({
      ruta: m.ruta,
      patron: m.patron,
      origen: m.origen,
      estadoCache: m.estadoCache,
      tiempoRenderMs: m.tiempoRenderMs,
      generadoEn: m.generadoEn.toISOString(),
      creadoEn: m.creadoEn.toISOString(),
    })),
  });
}
