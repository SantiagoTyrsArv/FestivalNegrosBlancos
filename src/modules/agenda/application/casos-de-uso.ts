import { aEventoDTO, type EventoDTO } from "@/modules/eventos/application/dto";
import { ordenarCronologicamente, type Evento } from "@/modules/eventos/domain/evento";
import type { EventoRepository } from "@/modules/eventos/domain/ports";
import { ok, type Result } from "@/shared/lib/result";
import {
  detectarConflictos,
  puedeAgregar,
  type AgendaRepository,
  type ErrorAgenda,
} from "../domain/agenda";

export interface AgendaDTO {
  eventos: EventoDTO[];
  /** Pares de ids de eventos que se solapan en horario. */
  conflictos: Array<[number, number]>;
}

export class VerAgenda {
  constructor(
    private readonly agenda: AgendaRepository,
    private readonly eventos: EventoRepository
  ) {}

  async ejecutar(usuarioId: number): Promise<AgendaDTO> {
    const ids = await this.agenda.eventosDe(usuarioId);
    const eventos = (await Promise.all(ids.map((id) => this.eventos.obtenerPorId(id)))).filter(
      (e): e is Evento => e !== null
    );
    const ordenados = ordenarCronologicamente(eventos);
    return {
      eventos: ordenados.map(aEventoDTO),
      conflictos: detectarConflictos(ordenados.filter((e) => !e.cancelado)),
    };
  }
}

export class AgregarAAgenda {
  constructor(
    private readonly agenda: AgendaRepository,
    private readonly eventos: EventoRepository
  ) {}

  async ejecutar(
    usuarioId: number,
    eventoId: number
  ): Promise<Result<{ eventoId: number }, ErrorAgenda>> {
    const [actual, evento] = await Promise.all([
      this.agenda.eventosDe(usuarioId),
      this.eventos.obtenerPorId(eventoId),
    ]);
    const regla = puedeAgregar(actual, evento);
    if (!regla.ok) return regla;
    // Idempotente: añadir un evento que ya estaba no es un error.
    if (!regla.value.yaEstaba) await this.agenda.agregar(usuarioId, eventoId);
    return ok({ eventoId });
  }
}

export class QuitarDeAgenda {
  constructor(private readonly agenda: AgendaRepository) {}

  async ejecutar(usuarioId: number, eventoId: number): Promise<void> {
    await this.agenda.quitar(usuarioId, eventoId);
  }
}
