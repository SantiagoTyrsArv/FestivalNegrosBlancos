import type { Comparsa } from "./comparsa";
import { hitoAlcanzado, puntoEnRecorrido, type Punto } from "./recorrido";

/**
 * SIMULACIÓN. No existen GPS reales: las posiciones se calculan de forma
 * determinista a partir del reloj, como si el desfile se repitiera en bucle
 * cada `periodoMs`. Así la demo muestra movimiento real sin datos externos.
 */
export type EstadoDesfile = "en-espera" | "desfilando" | "finalizado";

export interface PosicionComparsa {
  readonly slug: string;
  readonly nombre: string;
  readonly color: string;
  readonly estado: EstadoDesfile;
  readonly progreso: number;
  readonly punto: Punto;
  readonly hito: string;
}

export interface ConfigSimulacion {
  /** Duración de una vuelta completa del desfile simulado. */
  readonly periodoMs: number;
  /** Fracción del recorrido que separa a una comparsa de la siguiente. */
  readonly separacion: number;
}

export const SIMULACION_POR_DEFECTO: ConfigSimulacion = { periodoMs: 6 * 60_000, separacion: 0.06 };

export function simularPosiciones(
  comparsas: readonly Pick<Comparsa, "slug" | "nombre" | "color">[],
  instante: Date,
  config: ConfigSimulacion = SIMULACION_POR_DEFECTO
): PosicionComparsa[] {
  const n = comparsas.length;
  // La vuelta cubre el recorrido completo de la última comparsa.
  const avanceTotal = 1 + (n - 1) * config.separacion;
  const fase = (instante.getTime() % config.periodoMs) / config.periodoMs;
  const cabeza = fase * avanceTotal;

  return comparsas.map((c, i) => {
    const bruto = cabeza - i * config.separacion;
    const estado: EstadoDesfile = bruto < 0 ? "en-espera" : bruto > 1 ? "finalizado" : "desfilando";
    const progreso = Math.min(1, Math.max(0, bruto));
    return {
      slug: c.slug,
      nombre: c.nombre,
      color: c.color,
      estado,
      progreso: Math.round(progreso * 1000) / 1000,
      punto: puntoEnRecorrido(progreso),
      hito: hitoAlcanzado(progreso).nombre,
    };
  });
}
