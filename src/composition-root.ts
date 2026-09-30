import "server-only";
import { getConexion } from "@/db/client";
import { crearContenedor, type Contenedor } from "@/contenedor";

let contenedor: Contenedor | undefined;

/** Acceso a los casos de uso desde páginas, Route Handlers y Server Actions. */
export function casos(): Contenedor {
  contenedor ??= crearContenedor(getConexion());
  return contenedor;
}
