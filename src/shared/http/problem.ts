import "server-only";
import type { z } from "zod";

/**
 * Respuestas de error uniformes según RFC 9457 (application/problem+json).
 * Los códigos de `type` están documentados en docs/api.md.
 */
export interface Problema {
  type: string;
  title: string;
  status: number;
  detail?: string;
  [extension: string]: unknown;
}

const BASE_TIPOS = "/docs/errores#";

export function problema(
  status: number,
  codigo: string,
  titulo: string,
  detalle?: string,
  extensiones: Record<string, unknown> = {},
  cabeceras: HeadersInit = {}
): Response {
  const cuerpo: Problema = {
    type: `${BASE_TIPOS}${codigo}`,
    title: titulo,
    status,
    ...(detalle ? { detail: detalle } : {}),
    ...extensiones,
  };
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/problem+json",
      "Cache-Control": "no-store",
      ...cabeceras,
    },
  });
}

export const noAutenticado = () => problema(401, "no-autenticado", "Se requiere iniciar sesión");
export const prohibido = () => problema(403, "prohibido", "No tienes permiso para esta acción");
export const noEncontrado = (detalle?: string) =>
  problema(404, "no-encontrado", "Recurso no encontrado", detalle);

export type LecturaCuerpo<T> = { ok: true; datos: T } | { ok: false; respuesta: Response };

/** Lee y valida el cuerpo JSON. Acepta text/plain para soportar navigator.sendBeacon. */
export async function leerCuerpo<T>(
  request: Request,
  esquema: z.ZodType<T>
): Promise<LecturaCuerpo<T>> {
  let json: unknown;
  try {
    json = JSON.parse(await request.text());
  } catch {
    return { ok: false, respuesta: problema(400, "json-invalido", "El cuerpo no es JSON válido") };
  }
  const r = esquema.safeParse(json);
  if (!r.success) {
    return {
      ok: false,
      respuesta: problema(422, "validacion", "Datos inválidos", undefined, {
        errores: r.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })),
      }),
    };
  }
  return { ok: true, datos: r.data };
}

export function json(
  datos: unknown,
  init: { status?: number; cacheControl?: string; headers?: HeadersInit } = {}
) {
  return Response.json(datos, {
    status: init.status ?? 200,
    headers: { "Cache-Control": init.cacheControl ?? "no-store", ...init.headers },
  });
}
