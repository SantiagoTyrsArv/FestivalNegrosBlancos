export interface Resultado {
  readonly id: number;
  readonly comparsa: { readonly slug: string; readonly nombre: string; readonly color: string };
  readonly categoria: string;
  /** Puntaje en centésimas: 9550 = 95,50 puntos. */
  readonly puntajeCentesimas: number;
  readonly publicado: boolean;
  readonly publicadoEn: Date | null;
}

export interface PosicionTabla {
  readonly puesto: number;
  readonly resultado: Resultado;
}

export interface TablaCategoria {
  readonly categoria: string;
  readonly posiciones: readonly PosicionTabla[];
}

/**
 * Clasifica por categoría con ranking de competición ("1-2-2-4"): los empates
 * comparten puesto y el siguiente puesto salta. Los empates se ordenan por
 * nombre para que el resultado sea determinista.
 */
export function clasificar(resultados: readonly Resultado[]): TablaCategoria[] {
  const porCategoria = new Map<string, Resultado[]>();
  for (const r of resultados) {
    porCategoria.set(r.categoria, [...(porCategoria.get(r.categoria) ?? []), r]);
  }
  return [...porCategoria.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([categoria, lista]) => {
      const ordenados = [...lista].sort(
        (a, b) =>
          b.puntajeCentesimas - a.puntajeCentesimas ||
          a.comparsa.nombre.localeCompare(b.comparsa.nombre, "es")
      );
      let puestoAnterior = 0;
      const posiciones = ordenados.map((resultado, i) => {
        const empata = i > 0 && ordenados[i - 1]?.puntajeCentesimas === resultado.puntajeCentesimas;
        const puesto = empata ? puestoAnterior : i + 1;
        puestoAnterior = puesto;
        return { puesto, resultado };
      });
      return { categoria, posiciones };
    });
}

export type ErrorPublicacion =
  { readonly tipo: "NO_ENCONTRADO" } | { readonly tipo: "YA_PUBLICADO" };

export interface ResultadoRepository {
  listar(params: { soloPublicados: boolean }): Promise<Resultado[]>;
  obtener(id: number): Promise<Resultado | null>;
  marcarPublicado(id: number, fecha: Date): Promise<void>;
}
