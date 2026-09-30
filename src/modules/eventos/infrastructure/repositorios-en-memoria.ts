import type { Artista } from "../domain/artista";
import type { CambiosEvento, Evento, TipoEvento } from "../domain/evento";
import type {
  ArtistaRepository,
  EventoRepository,
  FiltroEventos,
  PaginaEventos,
} from "../domain/ports";

/** Eventos en memoria (parten de los datos quemados de src/datos/catalogo.ts). */
export class EventoRepositoryEnMemoria implements EventoRepository {
  constructor(private eventos: Evento[] = []) {}

  async listar(filtro: FiltroEventos = {}): Promise<Evento[]> {
    return this.ordenados().filter((e) => !filtro.tipo || e.tipo === filtro.tipo);
  }

  async listarPagina(params: {
    cursor: number | null;
    limite: number;
    tipo?: TipoEvento;
  }): Promise<PaginaEventos> {
    const { cursor, limite, tipo } = params;
    const candidatos = this.ordenados().filter(
      (e) => (cursor === null || e.id > cursor) && (!tipo || e.tipo === tipo)
    );
    const items = candidatos.slice(0, limite);
    const hayMas = candidatos.length > limite;
    return { items, siguienteCursor: hayMas ? (items.at(-1)?.id ?? null) : null };
  }

  async obtenerPorId(id: number): Promise<Evento | null> {
    return this.eventos.find((e) => e.id === id) ?? null;
  }

  async actualizar(id: number, cambios: CambiosEvento): Promise<Evento | null> {
    const actual = await this.obtenerPorId(id);
    if (!actual) return null;
    const nuevo: Evento = { ...actual, ...cambios };
    this.eventos = this.eventos.map((e) => (e.id === id ? nuevo : e));
    return nuevo;
  }

  private ordenados(): Evento[] {
    return [...this.eventos].sort((a, b) => a.id - b.id);
  }
}

export class ArtistaRepositoryEnMemoria implements ArtistaRepository {
  constructor(
    private readonly artistas: Artista[],
    private readonly eventosRepo: EventoRepository
  ) {}

  async listar(): Promise<Artista[]> {
    return [...this.artistas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  async obtenerPorSlug(slug: string): Promise<Artista | null> {
    return this.artistas.find((a) => a.slug === slug) ?? null;
  }

  async eventosDeArtista(slug: string): Promise<Evento[]> {
    const eventos = await this.eventosRepo.listar();
    return eventos.filter((e) => e.artistas.some((a) => a.slug === slug));
  }
}
