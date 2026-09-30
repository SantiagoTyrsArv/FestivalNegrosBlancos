import "server-only";
import { crearContenedor, type Contenedor } from "@/contenedor";

declare global {
  var __cbnContenedor: Contenedor | undefined;
}

/**
 * Acceso a los casos de uso desde páginas, Route Handlers y Server Actions.
 * Se guarda en globalThis para que TODO el proceso (páginas, API, acciones y
 * recargas en caliente de desarrollo) comparta el mismo estado en memoria:
 * compras, agenda, resultados publicados y Modo Caos. Se reinicia con el servidor.
 */
export function casos(): Contenedor {
  globalThis.__cbnContenedor ??= crearContenedor();
  return globalThis.__cbnContenedor;
}
