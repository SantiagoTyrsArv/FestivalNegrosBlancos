import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESION_COOKIE } from "@/shared/config/constants";
import { getServerEnv } from "@/shared/config/env";
import {
  DURACION_SESION_SEG,
  firmarSesion,
  verificarSesion,
  type DatosSesion,
} from "./token-sesion";

/**
 * Capa de acceso a la sesión. Leer la cookie vuelve dinámica la ruta que lo
 * haga: por eso solo lo usan las rutas SSR (boletas, checkout, admin...) y
 * los Route Handlers, nunca el layout compartido por las páginas SSG/ISR.
 */
export async function iniciarSesionEnCookie(datos: DatosSesion): Promise<void> {
  const env = getServerEnv();
  const token = await firmarSesion(datos, env.AUTH_SECRET);
  (await cookies()).set(SESION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
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
  const token = (await cookies()).get(SESION_COOKIE)?.value;
  return token ? verificarSesion(token, getServerEnv().AUTH_SECRET) : null;
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

/** Solo acepta rutas internas relativas como destino tras el login (evita open redirects). */
export function destinoSeguro(valor: unknown, porDefecto = "/"): string {
  return typeof valor === "string" &&
    valor.startsWith("/") &&
    !valor.startsWith("//") &&
    !valor.includes("\\")
    ? valor
    : porDefecto;
}
