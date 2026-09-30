import "server-only";
import { after } from "next/server";
import { getServerEnv } from "@/shared/config/env";
import type { Patron } from "../domain/medicion";
import { msDesde } from "../medir";
import { reportRender } from "../registrar-render";
import { RenderBadge } from "./RenderBadge";

interface RenderProbeProps {
  ruta: string;
  patron: Patron;
  /** Valor de iniciarMedicion() capturado al inicio del componente de página. */
  inicioRender: number;
  /** Segundos de revalidación de la ruta (solo ISR). */
  revalidar?: number;
}

/**
 * Sonda del observatorio: se coloca al final de cada página. Captura el
 * instante de generación (que queda "congelado" en el HTML si la página se
 * cachea) y entrega los datos al RenderBadge del cliente, que informa cada vista.
 * El registro del render se agenda con after(): se escribe en Turso cuando la
 * respuesta (o el prerender del build/regeneración ISR) ya terminó, sin sumar
 * la latencia de red al tiempo de respuesta.
 */
export function RenderProbe({ ruta, patron, inicioRender, revalidar }: RenderProbeProps) {
  const generadoEn = new Date();
  const tiempoRenderMs = msDesde(inicioRender);
  after(() => reportRender({ ruta, patron, generadoEn, tiempoRenderMs }));

  return (
    <RenderBadge
      ruta={ruta}
      patron={patron}
      generadoEn={generadoEn.toISOString()}
      tiempoRenderMs={tiempoRenderMs}
      revalidar={revalidar ?? null}
      visiblePorDefecto={getServerEnv().DEBUG_RENDERING}
    />
  );
}
