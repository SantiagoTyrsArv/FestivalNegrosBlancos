export interface Comparsa {
  readonly id: number;
  readonly slug: string;
  readonly nombre: string;
  readonly fundacion: number;
  readonly director: string;
  readonly integrantes: number;
  readonly descripcion: string;
  readonly motivo: string;
  /** Color identificativo en hex (#rrggbb). */
  readonly color: string;
}

export function aniosDeTrayectoria(c: Pick<Comparsa, "fundacion">, anioActual: number): number {
  return Math.max(0, anioActual - c.fundacion);
}

export interface ComparsaRepository {
  listar(): Promise<Comparsa[]>;
  obtenerPorSlug(slug: string): Promise<Comparsa | null>;
}
