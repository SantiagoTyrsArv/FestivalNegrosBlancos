import type { SesionBoleteria } from "@/modules/boleteria/domain/boleteria";
import type { Artista } from "@/modules/eventos/domain/artista";
import type { Evento } from "@/modules/eventos/domain/evento";
import type { ErrorUpstream, ProgramacionGateway } from "@/modules/eventos/domain/ports";
import type { Result } from "@/shared/lib/result";

// Los tests usan los mismos repositorios en memoria que la aplicación.
export { AgendaRepositoryEnMemoria } from "@/modules/agenda/infrastructure/agenda-repository-en-memoria";
export { BoleteriaRepositoryEnMemoria } from "@/modules/boleteria/infrastructure/boleteria-repository-en-memoria";
export { ComparsaRepositoryEnMemoria } from "@/modules/comparsas/infrastructure/comparsa-repository-en-memoria";
export {
  ArtistaRepositoryEnMemoria,
  EventoRepositoryEnMemoria,
} from "@/modules/eventos/infrastructure/repositorios-en-memoria";
export { ResultadoRepositoryEnMemoria } from "@/modules/resultados/infrastructure/resultado-repository-en-memoria";
export { UsuarioRepositoryEnMemoria } from "@/modules/usuarios/infrastructure/usuario-repository-en-memoria";

let secuencia = 1;

export function unEvento(parcial: Partial<Evento> = {}): Evento {
  const id = parcial.id ?? secuencia++;
  return {
    id,
    nombre: `Evento ${id}`,
    tipo: "concierto",
    descripcion: "Descripción",
    inicio: new Date("2027-01-02T23:00:00Z"),
    fin: new Date("2027-01-03T01:00:00Z"),
    cancelado: false,
    escenario: { slug: "tarima-mayor", nombre: "Tarima Mayor" },
    artistas: [],
    ...parcial,
  };
}

export function unArtista(parcial: Partial<Artista> = {}): Artista {
  const id = parcial.id ?? secuencia++;
  return {
    id,
    slug: `artista-${id}`,
    nombre: `Artista ${id}`,
    genero: "Cumbia",
    origen: "Pasto",
    biografia: "Bio",
    destacado: false,
    ...parcial,
  };
}

export function unaSesion(parcial: Partial<SesionBoleteria> = {}): SesionBoleteria {
  return {
    id: parcial.id ?? secuencia++,
    eventoId: 1,
    nombre: "General",
    cupoTotal: 100,
    cupoVendido: 0,
    precio: { centavos: 4_500_000, moneda: "COP" },
    ...parcial,
  };
}

export class GatewayFalso implements ProgramacionGateway {
  constructor(public respuesta: Result<Evento[], ErrorUpstream>) {}

  async obtenerProgramacion() {
    return this.respuesta;
  }
}
