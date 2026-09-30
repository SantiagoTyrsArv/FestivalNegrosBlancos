export interface Artista {
  readonly id: number;
  readonly slug: string;
  readonly nombre: string;
  readonly genero: string;
  readonly origen: string;
  readonly biografia: string;
  /** Los destacados se pre-generan en el build (ISR); el resto se genera bajo demanda. */
  readonly destacado: boolean;
}

/** Texto de búsqueda normalizado: minúsculas y sin tildes. */
export function normalizarBusqueda(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function coincideBusqueda(campos: readonly string[], consulta: string): boolean {
  const q = normalizarBusqueda(consulta);
  return campos.some((c) => normalizarBusqueda(c).includes(q));
}
