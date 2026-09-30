import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { casos } from "@/composition-root";
import { SESION_COOKIE } from "@/shared/config/constants";
import type { Usuario } from "../domain/usuario";
import { firmar, verificar } from "./firma-sesion";

/** Datos del usuario que las páginas necesitan de la sesión. */
export type DatosSesion = Pick<Usuario, "id" | "nombre" | "rol">;

const DURACION_SESION_SEG = 60 * 60 * 24 * 7;

declare global {
  var __cbnSecretoSesion: string | undefined;
}

/**
 * Secreto de firma: SESSION_SECRET si existe; si no, uno aleatorio por
 * proceso (las sesiones caducan al reiniciar, igual que los datos en memoria).
 */
function secreto(): string {
  globalThis.__cbnSecretoSesion ??=
    process.env["SESSION_SECRET"] ?? randomBytes(32).toString("hex");
  return globalThis.__cbnSecretoSesion;
}

/**
 * Sesión de demostración: la cookie guarda el id del usuario firmado con HMAC
 * y se resuelve contra el repositorio en memoria. Leer la cookie vuelve dinámica la
 * ruta que lo haga: por eso solo lo usan las rutas SSR (boletas, checkout,
 * admin...) y los Route Handlers, nunca el layout de las páginas SSG/ISR.
 */
export async function iniciarSesionEnCookie(datos: DatosSesion): Promise<void> {
  (await cookies()).set(SESION_COOKIE, firmar(datos.id, secreto()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
}

export async function cerrarSesionEnCookie(): Promise<void> {
  (await cookies()).delete(SESION_COOKIE);
}

/** Sesión actual (memorizada por petición con React.cache). */
export const obtenerSesion = cache(async (): Promise<DatosSesion | null> => {
  const id = verificar((await cookies()).get(SESION_COOKIE)?.value, secreto());
  if (id === null) return null;
  const usuario = await casos().usuarios.obtener(id);
  return usuario ? { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } : null;
});

/** Exige sesión; si no hay, redirige en el servidor al login conservando el destino. */
export async function requerirSesion(destino: string): Promise<DatosSesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect(`/login?siguiente=${encodeURIComponent(destino)}`);
  return sesion;
}

export async function requerirAdmin(destino: string): Promise<DatosSesion> {
  const sesion = await requerirSesion(destino);
  if (sesion.rol !== "admin") redirect("/?acceso=denegado");
  return sesion;
}

/** Solo acepta rutas internas como destino tras el login ("//x" o "/\x" irían a otro dominio). */
export function destinoSeguro(valor: unknown, porDefecto = "/"): string {
  return typeof valor === "string" &&
    valor.startsWith("/") &&
    !valor.startsWith("//") &&
    !valor.includes("\\")
    ? valor
    : porDefecto;
}
