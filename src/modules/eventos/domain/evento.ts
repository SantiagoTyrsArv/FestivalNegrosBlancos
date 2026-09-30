import { err, ok, type Result } from "@/shared/lib/result";

export const TIPOS_EVENTO = ["concierto", "desfile", "ceremonia", "taller"] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface ReferenciaArtista {
  readonly slug: string;
  readonly nombre: string;
}

export interface ReferenciaEscenario {
  readonly slug: string;
  readonly nombre: string;
}

/** Entidad Evento. Las fechas son instantes UTC. */
export interface Evento {
  readonly id: number;
  readonly nombre: string;
  readonly tipo: TipoEvento;
  readonly descripcion: string;
  readonly inicio: Date;
  readonly fin: Date;
  readonly cancelado: boolean;
  readonly escenario: ReferenciaEscenario;
  readonly artistas: readonly ReferenciaArtista[];
}

export type EstadoTemporal = "proximo" | "en-curso" | "finalizado";

export function estadoTemporal(
  evento: Pick<Evento, "inicio" | "fin">,
  ahora: Date
): EstadoTemporal {
  if (ahora < evento.inicio) return "proximo";
  if (ahora < evento.fin) return "en-curso";
  return "finalizado";
}

/** Ordena cronológicamente; a igual hora de inicio, por nombre (orden estable y determinista). */
export function ordenarCronologicamente<T extends Pick<Evento, "inicio" | "nombre">>(
  eventos: readonly T[]
): T[] {
  return [...eventos].sort(
    (a, b) => a.inicio.getTime() - b.inicio.getTime() || a.nombre.localeCompare(b.nombre, "es")
  );
}

/**
 * Agrupa eventos por día local del festival. `diaDe` se inyecta para que el
 * dominio no dependa de una zona horaria concreta.
 */
export function agruparPorDia<T extends Pick<Evento, "inicio" | "nombre">>(
  eventos: readonly T[],
  diaDe: (instante: Date) => string
): Array<{ dia: string; eventos: T[] }> {
  const grupos = new Map<string, T[]>();
  for (const evento of ordenarCronologicamente(eventos)) {
    const dia = diaDe(evento.inicio);
    const grupo = grupos.get(dia);
    if (grupo) grupo.push(evento);
    else grupos.set(dia, [evento]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, lista]) => ({ dia, eventos: lista }));
}

/** Dos eventos se solapan si uno empieza antes de que el otro termine. */
export function seSolapan(
  a: Pick<Evento, "inicio" | "fin">,
  b: Pick<Evento, "inicio" | "fin">
): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

// --- Edición de eventos (panel admin) ---

export interface CambiosEvento {
  readonly nombre: string;
  readonly descripcion: string;
  readonly cancelado: boolean;
}

export type ErrorCambiosEvento =
  { readonly tipo: "NOMBRE_INVALIDO" } | { readonly tipo: "DESCRIPCION_INVALIDA" };

export const LIMITES_EVENTO = { nombreMin: 3, nombreMax: 120, descripcionMax: 600 } as const;

export function validarCambiosEvento(
  cambios: CambiosEvento
): Result<CambiosEvento, ErrorCambiosEvento> {
  const nombre = cambios.nombre.trim();
  const descripcion = cambios.descripcion.trim();
  if (nombre.length < LIMITES_EVENTO.nombreMin || nombre.length > LIMITES_EVENTO.nombreMax) {
    return err({ tipo: "NOMBRE_INVALIDO" });
  }
  if (descripcion.length === 0 || descripcion.length > LIMITES_EVENTO.descripcionMax) {
    return err({ tipo: "DESCRIPCION_INVALIDA" });
  }
  return ok({ nombre, descripcion, cancelado: cambios.cancelado });
}
