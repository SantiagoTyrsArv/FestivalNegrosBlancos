import { SignJWT, jwtVerify } from "jose";
import { ROLES, type Rol } from "../domain/usuario";

/** Datos mínimos que viajan en la cookie (nada sensible: la cookie es firmada, no cifrada). */
export interface DatosSesion {
  id: number;
  nombre: string;
  rol: Rol;
}

const EMISOR = "cbn";
const AUDIENCIA = "cbn-web";
export const DURACION_SESION_SEG = 60 * 60 * 24 * 7;

const clave = (secreto: string) => new TextEncoder().encode(secreto);

export async function firmarSesion(
  datos: DatosSesion,
  secreto: string,
  ahora = new Date()
): Promise<string> {
  const iat = Math.floor(ahora.getTime() / 1000);
  return new SignJWT({ nombre: datos.nombre, rol: datos.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(datos.id))
    .setIssuer(EMISOR)
    .setAudience(AUDIENCIA)
    .setIssuedAt(iat)
    .setExpirationTime(iat + DURACION_SESION_SEG)
    .sign(clave(secreto));
}

/** Verifica firma, emisor, audiencia y expiración. Cualquier anomalía devuelve null. */
export async function verificarSesion(token: string, secreto: string): Promise<DatosSesion | null> {
  try {
    const { payload } = await jwtVerify(token, clave(secreto), {
      issuer: EMISOR,
      audience: AUDIENCIA,
      algorithms: ["HS256"],
    });
    const id = Number(payload.sub);
    const rol = payload["rol"];
    const nombre = payload["nombre"];
    if (
      !Number.isInteger(id) ||
      typeof nombre !== "string" ||
      !(ROLES as readonly unknown[]).includes(rol)
    ) {
      return null;
    }
    return { id, nombre, rol: rol as Rol };
  } catch {
    // Firma inválida, token manipulado o expirado: se trata como "sin sesión".
    return null;
  }
}
