import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { agendaItems } from "@/db/schema";
import type { AgendaRepository } from "../domain/agenda";

export class DrizzleAgendaRepository implements AgendaRepository {
  constructor(private readonly db: Db) {}

  async eventosDe(usuarioId: number): Promise<number[]> {
    const filas = await this.db
      .select({ eventoId: agendaItems.eventoId })
      .from(agendaItems)
      .where(eq(agendaItems.usuarioId, usuarioId))
      .orderBy(asc(agendaItems.creadoEn));
    return filas.map((f) => f.eventoId);
  }

  async agregar(usuarioId: number, eventoId: number): Promise<void> {
    await this.db.insert(agendaItems).values({ usuarioId, eventoId }).onConflictDoNothing();
  }

  async quitar(usuarioId: number, eventoId: number): Promise<void> {
    await this.db
      .delete(agendaItems)
      .where(and(eq(agendaItems.usuarioId, usuarioId), eq(agendaItems.eventoId, eventoId)));
  }
}
