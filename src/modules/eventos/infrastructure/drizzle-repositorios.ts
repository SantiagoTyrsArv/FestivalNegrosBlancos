import { and, asc, eq, gt, inArray, type SQL } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { artistas, escenarios, eventoArtistas, eventos } from "@/db/schema";
import type { Artista } from "../domain/artista";
import type { CambiosEvento, Evento, ReferenciaArtista, TipoEvento } from "../domain/evento";
import type {
  ArtistaRepository,
  EventoRepository,
  FiltroEventos,
  PaginaEventos,
} from "../domain/ports";
import { filaAArtista, filaAEvento } from "./mappers";

export class DrizzleEventoRepository implements EventoRepository {
  constructor(private readonly db: Db) {}

  async listar(filtro: FiltroEventos = {}): Promise<Evento[]> {
    return this.consultar(filtro.tipo ? eq(eventos.tipo, filtro.tipo) : undefined);
  }

  async listarPagina(params: {
    cursor: number | null;
    limite: number;
    tipo?: TipoEvento;
  }): Promise<PaginaEventos> {
    const condiciones = [
      params.cursor !== null ? gt(eventos.id, params.cursor) : undefined,
      params.tipo ? eq(eventos.tipo, params.tipo) : undefined,
    ].filter((c): c is SQL => c !== undefined);
    // Se pide un elemento extra para saber si hay página siguiente.
    const items = await this.consultar(and(...condiciones), params.limite + 1);
    const hayMas = items.length > params.limite;
    const pagina = hayMas ? items.slice(0, params.limite) : items;
    return { items: pagina, siguienteCursor: hayMas ? (pagina.at(-1)?.id ?? null) : null };
  }

  async obtenerPorId(id: number): Promise<Evento | null> {
    const [evento] = await this.consultar(eq(eventos.id, id), 1);
    return evento ?? null;
  }

  async actualizar(id: number, cambios: CambiosEvento): Promise<Evento | null> {
    await this.db
      .update(eventos)
      .set({ ...cambios, actualizadoEn: new Date().toISOString() })
      .where(eq(eventos.id, id));
    return this.obtenerPorId(id);
  }

  private async consultar(where: SQL | undefined, limite?: number): Promise<Evento[]> {
    const base = this.db
      .select({ evento: eventos, escenario: { slug: escenarios.slug, nombre: escenarios.nombre } })
      .from(eventos)
      .innerJoin(escenarios, eq(eventos.escenarioId, escenarios.id))
      .where(where)
      .orderBy(asc(eventos.id));
    const filas = limite ? await base.limit(limite) : await base;
    const artistasPorEvento = await this.artistasDe(filas.map((f) => f.evento.id));
    return filas.map((f) =>
      filaAEvento(f.evento, f.escenario, artistasPorEvento.get(f.evento.id) ?? [])
    );
  }

  private async artistasDe(ids: number[]): Promise<Map<number, ReferenciaArtista[]>> {
    const mapa = new Map<number, ReferenciaArtista[]>();
    if (ids.length === 0) return mapa;
    const filas = await this.db
      .select({ eventoId: eventoArtistas.eventoId, slug: artistas.slug, nombre: artistas.nombre })
      .from(eventoArtistas)
      .innerJoin(artistas, eq(eventoArtistas.artistaId, artistas.id))
      .where(inArray(eventoArtistas.eventoId, ids))
      .orderBy(asc(artistas.nombre));
    for (const f of filas) {
      const lista = mapa.get(f.eventoId) ?? [];
      lista.push({ slug: f.slug, nombre: f.nombre });
      mapa.set(f.eventoId, lista);
    }
    return mapa;
  }
}

export class DrizzleArtistaRepository implements ArtistaRepository {
  constructor(
    private readonly db: Db,
    private readonly eventosRepo: EventoRepository
  ) {}

  async listar(): Promise<Artista[]> {
    const filas = await this.db.select().from(artistas).orderBy(asc(artistas.nombre));
    return filas.map(filaAArtista);
  }

  async obtenerPorSlug(slug: string): Promise<Artista | null> {
    const [fila] = await this.db.select().from(artistas).where(eq(artistas.slug, slug)).limit(1);
    return fila ? filaAArtista(fila) : null;
  }

  async eventosDeArtista(slug: string): Promise<Evento[]> {
    const filas = await this.db
      .select({ eventoId: eventoArtistas.eventoId })
      .from(eventoArtistas)
      .innerJoin(artistas, eq(eventoArtistas.artistaId, artistas.id))
      .where(eq(artistas.slug, slug));
    const eventosArtista = await Promise.all(
      filas.map((f) => this.eventosRepo.obtenerPorId(f.eventoId))
    );
    return eventosArtista.filter((e): e is Evento => e !== null);
  }
}
