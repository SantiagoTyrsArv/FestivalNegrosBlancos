import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

/** Etiquetas que se permite invalidar desde fuera (evita invalidaciones arbitrarias). */
export const PATRON_ETIQUETA = /^(programacion|resultados|artistas|artista:[a-z0-9-]{1,80})$/;

/**
 * - "swr": stale-while-revalidate (perfil "max"): la siguiente visita aún
 *   recibe la versión vieja mientras se regenera; la posterior ve la nueva.
 * - "inmediata": { expire: 0 }: la siguiente visita espera la versión nueva.
 */
export type ModoRevalidacion = "swr" | "inmediata";

export function revalidar(params: {
  etiquetas?: string[];
  rutas?: string[];
  modo?: ModoRevalidacion;
}): void {
  const perfil = params.modo === "inmediata" ? { expire: 0 } : "max";
  for (const etiqueta of params.etiquetas ?? []) revalidateTag(etiqueta, perfil);
  for (const ruta of params.rutas ?? []) revalidatePath(ruta);
}
