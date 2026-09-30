// Constantes globales sin secretos: seguras para cliente y servidor.

export const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000";

export const FESTIVAL = {
  anio: 2027,
  /** Zona horaria del festival: todas las fechas se guardan en UTC y se presentan en esta zona. */
  zonaHoraria: "America/Bogota",
  ciudad: "San Juan de Pasto",
  /** Días del festival (fecha local del festival, YYYY-MM-DD). */
  dias: ["2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05", "2027-01-06"],
} as const;

export type DiaFestival = (typeof FESTIVAL.dias)[number];

export const PAGINACION = { porDefecto: 10, maximo: 50 } as const;

/** Etiquetas de caché usadas con unstable_cache + revalidateTag. */
export const CACHE_TAGS = {
  programacion: "programacion",
  resultados: "resultados",
  artistas: "artistas",
  artista: (slug: string) => `artista:${slug}`,
} as const;

/** Segundos de revalidación de las rutas ISR (deben ser literales en cada page.tsx). */
export const REVALIDACION = { programacion: 60, resultados: 30, artista: 300 } as const;

export const SESION_COOKIE = "cbn_sesion";

export const LIMITE_COMPRA = { maximoPorOrden: 6 } as const;
