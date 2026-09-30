import { after } from "next/server";
import { z } from "zod";
import { casos } from "@/composition-root";
import { PATRONES, inferirEstadoCache } from "@/observability/domain/medicion";
import { leerCuerpo } from "@/shared/http/problem";

const esquema = z.object({
  ruta: z.string().startsWith("/").max(200),
  patron: z.enum(PATRONES),
  generadoEn: z.iso.datetime(),
  revalidar: z.number().int().positive().nullable(),
  enHtmlInicial: z.boolean(),
});

/** Recibe la "vista" que emite el RenderBadge de cada página (navigator.sendBeacon). */
export async function POST(request: Request) {
  const cuerpo = await leerCuerpo(request, esquema);
  if (!cuerpo.ok) return cuerpo.respuesta;
  const { ruta, patron, generadoEn, revalidar, enHtmlInicial } = cuerpo.datos;
  const generado = new Date(generadoEn);

  // Se usa el reloj del SERVIDOR como instante de recepción para no depender
  // del reloj (posiblemente desfasado) del navegador.
  const recibidoEn = new Date();
  // El registro se hace tras responder: el beacon no espera.
  after(() =>
    casos().mediciones.registrar({
      ruta,
      patron,
      origen: "vista",
      generadoEn: generado,
      tiempoRenderMs: null,
      estadoCache: inferirEstadoCache({
        patron,
        generadoEn: generado,
        recibidoEn,
        revalidarSegundos: revalidar,
      }),
      enHtmlInicial,
    })
  );
  return new Response(null, { status: 204 });
}
