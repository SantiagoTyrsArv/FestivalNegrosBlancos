/**
 * Dominio del Observatorio de Rendering: funciones puras que interpretan las
 * mediciones. Ver docs/adr/0005-observatorio.md para los límites de la inferencia.
 */
export const PATRONES = ["SSG", "ISR", "SSR", "CSR", "HIBRIDO"] as const;
export type Patron = (typeof PATRONES)[number];

/**
 * - HIT: se sirvió HTML ya generado y vigente.
 * - STALE: se sirvió HTML vencido (Next lo regenera en segundo plano).
 * - MISS: el HTML se generó para esta petición (o acaba de regenerarse).
 * - DINAMICO: la ruta se renderiza en cada petición, no hay caché de página.
 * - CLIENTE: el contenido se obtiene en el navegador tras cargar la página.
 */
export type EstadoCache = "HIT" | "MISS" | "STALE" | "DINAMICO" | "CLIENTE";

export type OrigenMedicion = "render" | "vista";

export interface Medicion {
  readonly ruta: string;
  readonly patron: Patron;
  readonly origen: OrigenMedicion;
  readonly generadoEn: Date;
  readonly tiempoRenderMs: number | null;
  readonly estadoCache: EstadoCache;
  readonly enHtmlInicial: boolean | null;
  readonly creadoEn: Date;
}

/** Margen bajo el cual consideramos que el HTML se generó para esta misma petición. */
export const UMBRAL_MISS_MS = 3000;

export function inferirEstadoCache(params: {
  patron: Patron;
  generadoEn: Date;
  recibidoEn: Date;
  revalidarSegundos: number | null;
}): EstadoCache {
  const { patron, generadoEn, recibidoEn, revalidarSegundos } = params;
  if (patron === "CSR") return "CLIENTE";
  if (patron === "SSR" || patron === "HIBRIDO") return "DINAMICO";
  const edadMs = recibidoEn.getTime() - generadoEn.getTime();
  if (edadMs <= UMBRAL_MISS_MS) return "MISS";
  if (patron === "ISR" && revalidarSegundos !== null && edadMs > revalidarSegundos * 1000) {
    return "STALE";
  }
  return "HIT";
}

export type PatronObservado = "SSG" | "ISR" | "SSR" | "CSR" | "INDETERMINADO";

/**
 * Deduce el patrón a partir de las vistas registradas por los navegadores:
 * - Contenido ausente del HTML inicial → CSR.
 * - Todas las vistas con la misma fecha de generación → SSG (HTML único).
 * - Cada vista con una generación distinta → SSR (render por petición).
 * - Algunas generaciones repetidas y otras nuevas → ISR (regeneración periódica).
 */
export function inferirPatron(
  vistas: readonly Pick<Medicion, "generadoEn" | "enHtmlInicial">[]
): PatronObservado {
  if (vistas.length === 0) return "INDETERMINADO";
  if (vistas.some((v) => v.enHtmlInicial === false)) return "CSR";
  if (vistas.length < 2) return "INDETERMINADO";
  const generaciones = new Set(vistas.map((v) => v.generadoEn.getTime())).size;
  if (generaciones === 1) return "SSG";
  if (generaciones === vistas.length) return "SSR";
  return "ISR";
}

/** ¿Coincide lo observado con lo declarado? El híbrido se observa como render dinámico. */
export function coincidePatron(declarado: Patron, observado: PatronObservado): boolean | null {
  if (observado === "INDETERMINADO") return null;
  if (declarado === "HIBRIDO") return observado === "SSR";
  // Un ISR que aún no ha llegado a regenerarse es indistinguible de un SSG.
  if (declarado === "ISR") return observado === "ISR" || observado === "SSG";
  return declarado === observado;
}

export interface ResumenRuta {
  ruta: string;
  patron: Patron;
  patronObservado: PatronObservado;
  coincide: boolean | null;
  vistas: number;
  renders: number;
  ultimaGeneracion: string | null;
  ultimoEstado: EstadoCache | null;
  tiempoMedioRenderMs: number | null;
  enHtmlInicial: boolean | null;
}

export function resumirPorRuta(mediciones: readonly Medicion[]): ResumenRuta[] {
  const porRuta = new Map<string, Medicion[]>();
  for (const m of mediciones) porRuta.set(m.ruta, [...(porRuta.get(m.ruta) ?? []), m]);

  return [...porRuta.entries()]
    .map(([ruta, lista]) => {
      const ordenadas = [...lista].sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime());
      const vistas = ordenadas.filter((m) => m.origen === "vista");
      const renders = ordenadas.filter((m) => m.origen === "render");
      const ultima = ordenadas.at(-1);
      const ultimaVista = vistas.at(-1);
      const tiempos = renders.map((r) => r.tiempoRenderMs).filter((t): t is number => t !== null);
      const patron = ultima?.patron ?? "SSG";
      const patronObservado = inferirPatron(vistas);
      return {
        ruta,
        patron,
        patronObservado,
        coincide: coincidePatron(patron, patronObservado),
        vistas: vistas.length,
        renders: renders.length,
        ultimaGeneracion: ultima ? ultima.generadoEn.toISOString() : null,
        ultimoEstado: ultimaVista?.estadoCache ?? null,
        tiempoMedioRenderMs: tiempos.length
          ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
          : null,
        enHtmlInicial: ultimaVista?.enHtmlInicial ?? null,
      };
    })
    .sort((a, b) => a.ruta.localeCompare(b.ruta));
}
