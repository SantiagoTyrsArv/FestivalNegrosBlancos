import "server-only";
import { unstable_cache } from "next/cache";
import { casos } from "@/composition-root";
import { CACHE_TAGS, REVALIDACION } from "@/shared/config/constants";

/**
 * Lecturas cacheadas en el Data Cache de Next con etiquetas para revalidación
 * on-demand (revalidateTag). Solo se usan desde rutas SSG/ISR.
 *
 * Regla clave de resiliencia: si la upstream falla, se LANZA un error en vez
 * de devolverlo. Así el fallo nunca queda cacheado y, durante una
 * regeneración ISR en segundo plano, Next conserva y sigue sirviendo la última
 * versión buena de la página (stale-while-revalidate). Ver ADR 0006.
 */
export class UpstreamNoDisponibleError extends Error {
  constructor(public readonly motivo: string) {
    super(`La fuente de programación no está disponible: ${motivo}`);
    this.name = "UpstreamNoDisponibleError";
  }
}

export const programacionCacheada = unstable_cache(
  async (dia?: string) => {
    const r = await casos().eventos.listarProgramacion.ejecutar(dia ? { dia } : {});
    if (!r.ok && r.error.tipo !== "DIA_NO_EXISTE")
      throw new UpstreamNoDisponibleError(r.error.detalle);
    return r;
  },
  ["programacion"],
  { tags: [CACHE_TAGS.programacion], revalidate: REVALIDACION.programacion }
);

export const resultadosCacheados = unstable_cache(
  async () => casos().resultados.listarPublicados.ejecutar(),
  ["resultados"],
  { tags: [CACHE_TAGS.resultados], revalidate: REVALIDACION.resultados }
);

export function artistaCacheado(slug: string) {
  return unstable_cache(async () => casos().artistas.obtener.ejecutar(slug), ["artista", slug], {
    tags: [CACHE_TAGS.artistas, CACHE_TAGS.artista(slug), CACHE_TAGS.programacion],
    revalidate: REVALIDACION.artista,
  })();
}

/** Datos del evento para el shell cacheado de /boletas/[eventoId] (el cupo va aparte, sin caché). */
export function eventoCacheado(id: number) {
  return unstable_cache(async () => casos().eventos.obtener.ejecutar(id), ["evento", String(id)], {
    tags: [CACHE_TAGS.programacion],
    revalidate: REVALIDACION.programacion,
  })();
}
