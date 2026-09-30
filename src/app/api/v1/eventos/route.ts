import { z } from "zod";
import { casos } from "@/composition-root";
import { TIPOS_EVENTO } from "@/modules/eventos/domain/evento";
import { PAGINACION } from "@/shared/config/constants";
import { json, problema } from "@/shared/http/problem";

const consulta = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().min(1).max(PAGINACION.maximo).default(PAGINACION.porDefecto),
  tipo: z.enum(TIPOS_EVENTO).optional(),
});

/** Lista paginada por cursor. Datos públicos: cacheable en CDN 60 s con SWR. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const r = consulta.safeParse(params);
  if (!r.success) {
    return problema(400, "parametros-invalidos", "Parámetros de consulta inválidos", undefined, {
      errores: r.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
    });
  }
  const pagina = await casos().eventos.listarPaginados.ejecutar({
    cursor: r.data.cursor ?? null,
    limite: r.data.limite,
    ...(r.data.tipo ? { tipo: r.data.tipo } : {}),
  });
  return json(
    { datos: pagina.items, siguienteCursor: pagina.siguienteCursor },
    { cacheControl: "public, s-maxage=60, stale-while-revalidate=300" }
  );
}
