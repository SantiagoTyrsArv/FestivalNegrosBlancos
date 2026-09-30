/** Error HTTP con el cuerpo problem+json (RFC 9457) que devuelve la API. */
export class ErrorHttp extends Error {
  constructor(
    public readonly status: number,
    public readonly problema: { title?: string; detail?: string } | null
  ) {
    super(problema?.title ?? `HTTP ${status}`);
    this.name = "ErrorHttp";
  }
}

async function leer<T>(respuesta: Response): Promise<T> {
  if (!respuesta.ok) {
    const problema = (await respuesta.json().catch(() => null)) as ErrorHttp["problema"];
    throw new ErrorHttp(respuesta.status, problema);
  }
  return (respuesta.status === 204 ? undefined : await respuesta.json()) as T;
}

/** Fetcher de SWR para /api/v1 (mismo origen, cookies incluidas). */
export const obtenerJson = <T>(url: string): Promise<T> =>
  fetch(url, { headers: { Accept: "application/json" } }).then((r) => leer<T>(r));

export const enviarJson = <T>(
  url: string,
  metodo: "POST" | "DELETE",
  cuerpo?: unknown
): Promise<T> =>
  fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
  }).then((r) => leer<T>(r));

/** Espera exponencial con tope: 1 s, 2 s, 4 s, 8 s… hasta 30 s. */
export const esperaBackoff = (intento: number): number =>
  Math.min(30_000, 1000 * 2 ** Math.max(0, intento - 1));
