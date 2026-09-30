import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma HMAC-SHA256 del valor de la cookie ("<id>.<firma>") para que no se
 * pueda falsificar cambiando el id a mano.
 */
export function firmar(id: number, secreto: string): string {
  const valor = String(id);
  return `${valor}.${createHmac("sha256", secreto).update(valor).digest("base64url")}`;
}

/** Devuelve el id si la firma es válida; null si falta, está mal formada o fue manipulada. */
export function verificar(cookie: string | undefined, secreto: string): number | null {
  const [valor, firma] = cookie?.split(".") ?? [];
  if (!valor || !firma) return null;
  const esperada = Buffer.from(firmar(Number(valor), secreto));
  const recibida = Buffer.from(cookie ?? "");
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  const id = Number(valor);
  return Number.isInteger(id) ? id : null;
}
