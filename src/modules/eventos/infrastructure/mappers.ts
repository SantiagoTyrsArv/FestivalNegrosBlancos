import type { artistas, escenarios, eventos } from "@/db/schema";
import type { Artista } from "../domain/artista";
import type { Evento, ReferenciaArtista } from "../domain/evento";

type FilaEvento = typeof eventos.$inferSelect;
type FilaEscenario = typeof escenarios.$inferSelect;
type FilaArtista = typeof artistas.$inferSelect;

export function filaAEvento(
  fila: FilaEvento,
  escenario: Pick<FilaEscenario, "slug" | "nombre">,
  artistasDelEvento: readonly ReferenciaArtista[]
): Evento {
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    inicio: new Date(fila.inicio),
    fin: new Date(fila.fin),
    cancelado: fila.cancelado,
    escenario: { slug: escenario.slug, nombre: escenario.nombre },
    artistas: artistasDelEvento,
  };
}

export function filaAArtista(fila: FilaArtista): Artista {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    genero: fila.genero,
    origen: fila.origen,
    biografia: fila.biografia,
    destacado: fila.destacado,
  };
}
