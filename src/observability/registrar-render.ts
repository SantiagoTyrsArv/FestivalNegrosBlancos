import "server-only";
import { casos } from "@/composition-root";
import { inferirEstadoCache, type Patron } from "./domain/medicion";

export interface DatosRender {
  ruta: string;
  patron: Patron;
  generadoEn: Date;
  tiempoRenderMs: number;
}

/**
 * Registra que el SERVIDOR ejecutó el render de una ruta. Para SSG ocurre en
 * `next build`; para ISR en cada regeneración; para SSR en cada petición.
 * Un fallo al registrar nunca debe romper la página: se informa y se sigue.
 */
export async function reportRender(datos: DatosRender): Promise<void> {
  try {
    await casos().mediciones.registrar({
      ...datos,
      origen: "render",
      estadoCache: inferirEstadoCache({
        patron: datos.patron,
        generadoEn: datos.generadoEn,
        recibidoEn: datos.generadoEn,
        revalidarSegundos: null,
      }),
      enHtmlInicial: null,
    });
  } catch (error) {
    console.error(`[observatorio] no se pudo registrar el render de ${datos.ruta}:`, error);
  }
}
