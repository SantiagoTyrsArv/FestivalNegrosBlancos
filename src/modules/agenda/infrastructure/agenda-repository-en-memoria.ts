import type { AgendaRepository } from "../domain/agenda";

/** Agenda por usuario: ids de evento en el orden en que se añadieron. */
export class AgendaRepositoryEnMemoria implements AgendaRepository {
  private readonly items = new Map<number, number[]>();

  async eventosDe(usuarioId: number): Promise<number[]> {
    return [...(this.items.get(usuarioId) ?? [])];
  }

  async agregar(usuarioId: number, eventoId: number): Promise<void> {
    const actuales = this.items.get(usuarioId) ?? [];
    if (!actuales.includes(eventoId)) this.items.set(usuarioId, [...actuales, eventoId]);
  }

  async quitar(usuarioId: number, eventoId: number): Promise<void> {
    this.items.set(
      usuarioId,
      (this.items.get(usuarioId) ?? []).filter((id) => id !== eventoId)
    );
  }
}
