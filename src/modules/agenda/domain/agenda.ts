import { err, ok, type Result } from "@/shared/lib/result";

export const MAXIMO_ITEMS_AGENDA = 30;

export type ErrorAgenda =
  | { readonly tipo: "EVENTO_NO_ENCONTRADO" }
  | { readonly tipo: "EVENTO_CANCELADO" }
  | { readonly tipo: "AGENDA_LLENA"; readonly maximo: number };

/** Reglas para añadir un evento: debe existir, no estar cancelado y caber en la agenda. */
export function puedeAgregar(
  agendaActual: readonly number[],
  evento: { readonly id: number; readonly cancelado: boolean } | null
): Result<{ yaEstaba: boolean }, ErrorAgenda> {
  if (!evento) return err({ tipo: "EVENTO_NO_ENCONTRADO" });
  if (agendaActual.includes(evento.id)) return ok({ yaEstaba: true });
  if (evento.cancelado) return err({ tipo: "EVENTO_CANCELADO" });
  if (agendaActual.length >= MAXIMO_ITEMS_AGENDA) {
    return err({ tipo: "AGENDA_LLENA", maximo: MAXIMO_ITEMS_AGENDA });
  }
  return ok({ yaEstaba: false });
}

interface Intervalo {
  readonly id: number;
  readonly inicio: Date;
  readonly fin: Date;
}

/** Pares de eventos de la agenda que se cruzan en horario (para avisar al usuario). */
export function detectarConflictos(eventos: readonly Intervalo[]): Array<[number, number]> {
  const ordenados = [...eventos].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  const conflictos: Array<[number, number]> = [];
  for (let i = 0; i < ordenados.length; i++) {
    const a = ordenados[i] as Intervalo;
    for (let j = i + 1; j < ordenados.length; j++) {
      const b = ordenados[j] as Intervalo;
      if (b.inicio >= a.fin) break;
      conflictos.push([a.id, b.id]);
    }
  }
  return conflictos;
}

export interface AgendaRepository {
  eventosDe(usuarioId: number): Promise<number[]>;
  agregar(usuarioId: number, eventoId: number): Promise<void>;
  quitar(usuarioId: number, eventoId: number): Promise<void>;
}
