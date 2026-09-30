import { diaLocal } from "@/shared/lib/formato";
import type { Artista } from "../domain/artista";
import type { Evento, ReferenciaArtista, ReferenciaEscenario, TipoEvento } from "../domain/evento";

/**
 * DTOs: objetos planos y serializables (fechas como ISO string). Son lo único
 * que la capa de aplicación entrega a la UI, a la API y a la caché de Next
 * (que serializa a JSON y perdería los Date).
 */
export interface EventoDTO {
  id: number;
  nombre: string;
  tipo: TipoEvento;
  descripcion: string;
  inicio: string;
  fin: string;
  /** Día local del festival (YYYY-MM-DD). */
  dia: string;
  cancelado: boolean;
  escenario: ReferenciaEscenario;
  artistas: ReferenciaArtista[];
}

export interface ArtistaDTO {
  slug: string;
  nombre: string;
  genero: string;
  origen: string;
  biografia: string;
  destacado: boolean;
}

export function aEventoDTO(e: Evento): EventoDTO {
  return {
    id: e.id,
    nombre: e.nombre,
    tipo: e.tipo,
    descripcion: e.descripcion,
    inicio: e.inicio.toISOString(),
    fin: e.fin.toISOString(),
    dia: diaLocal(e.inicio),
    cancelado: e.cancelado,
    escenario: { ...e.escenario },
    artistas: e.artistas.map((a) => ({ ...a })),
  };
}

export function aArtistaDTO(a: Artista): ArtistaDTO {
  return {
    slug: a.slug,
    nombre: a.nombre,
    genero: a.genero,
    origen: a.origen,
    biografia: a.biografia,
    destacado: a.destacado,
  };
}
