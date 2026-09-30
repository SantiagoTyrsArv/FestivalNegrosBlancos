import type { Result } from "@/shared/lib/result";
import type { Artista } from "./artista";
import type { CambiosEvento, Evento, TipoEvento } from "./evento";

export interface FiltroEventos {
  readonly tipo?: TipoEvento;
}

export interface PaginaEventos {
  readonly items: Evento[];
  readonly siguienteCursor: number | null;
}

/** Puerto de persistencia de eventos (lo implementa infraestructura). */
export interface EventoRepository {
  listar(filtro?: FiltroEventos): Promise<Evento[]>;
  /** Paginación por cursor: devuelve eventos con id > cursor, ordenados por id. */
  listarPagina(params: {
    cursor: number | null;
    limite: number;
    tipo?: TipoEvento;
  }): Promise<PaginaEventos>;
  obtenerPorId(id: number): Promise<Evento | null>;
  actualizar(id: number, cambios: CambiosEvento): Promise<Evento | null>;
}

export interface ArtistaRepository {
  listar(): Promise<Artista[]>;
  obtenerPorSlug(slug: string): Promise<Artista | null>;
  eventosDeArtista(slug: string): Promise<Evento[]>;
}

export type ErrorUpstream =
  | { readonly tipo: "UPSTREAM_NO_DISPONIBLE"; readonly detalle: string }
  | { readonly tipo: "UPSTREAM_RESPUESTA_INVALIDA"; readonly detalle: string };

/**
 * Puerto hacia la "API upstream" que publica la programación oficial. En este
 * proyecto se simula (ver infraestructura) y puede fallar a voluntad con el
 * Modo Caos para demostrar cómo degrada cada patrón de rendering.
 */
export interface ProgramacionGateway {
  obtenerProgramacion(): Promise<Result<Evento[], ErrorUpstream>>;
}
