import { FESTIVAL, PAGINACION } from "@/shared/config/constants";
import { diaLocal } from "@/shared/lib/formato";
import { err, ok, type Result } from "@/shared/lib/result";
import { coincideBusqueda, normalizarBusqueda } from "../domain/artista";
import {
  agruparPorDia,
  ordenarCronologicamente,
  validarCambiosEvento,
  type CambiosEvento,
  type ErrorCambiosEvento,
  type TipoEvento,
} from "../domain/evento";
import type {
  ArtistaRepository,
  ErrorUpstream,
  EventoRepository,
  ProgramacionGateway,
} from "../domain/ports";
import { aArtistaDTO, aEventoDTO, type ArtistaDTO, type EventoDTO } from "./dto";

export type NoEncontrado = { readonly tipo: "NO_ENCONTRADO" };
const noEncontrado: NoEncontrado = { tipo: "NO_ENCONTRADO" };

export interface DiaProgramacionDTO {
  dia: string;
  eventos: EventoDTO[];
}

/** Programación completa o de un día, agrupada por día local del festival. */
export class ListarProgramacion {
  constructor(private readonly gateway: ProgramacionGateway) {}

  async ejecutar(
    params: { dia?: string } = {}
  ): Promise<Result<DiaProgramacionDTO[], ErrorUpstream | { tipo: "DIA_NO_EXISTE" }>> {
    const dia = params.dia;
    if (dia !== undefined && !(FESTIVAL.dias as readonly string[]).includes(dia)) {
      return err({ tipo: "DIA_NO_EXISTE" });
    }
    const respuesta = await this.gateway.obtenerProgramacion();
    if (!respuesta.ok) return respuesta;

    const dias = agruparPorDia(respuesta.value, diaLocal).map((g) => ({
      dia: g.dia,
      eventos: g.eventos.map(aEventoDTO),
    }));
    return ok(dia ? dias.filter((d) => d.dia === dia) : dias);
  }
}

export class ObtenerEvento {
  constructor(private readonly repo: EventoRepository) {}

  async ejecutar(id: number): Promise<Result<EventoDTO, NoEncontrado>> {
    const evento = await this.repo.obtenerPorId(id);
    return evento ? ok(aEventoDTO(evento)) : err(noEncontrado);
  }
}

export class ListarEventosPaginados {
  constructor(private readonly repo: EventoRepository) {}

  async ejecutar(params: {
    cursor: number | null;
    limite?: number;
    tipo?: TipoEvento;
  }): Promise<{ items: EventoDTO[]; siguienteCursor: number | null }> {
    const limite = Math.min(Math.max(params.limite ?? PAGINACION.porDefecto, 1), PAGINACION.maximo);
    const pagina = await this.repo.listarPagina({
      cursor: params.cursor,
      limite,
      ...(params.tipo ? { tipo: params.tipo } : {}),
    });
    return { items: pagina.items.map(aEventoDTO), siguienteCursor: pagina.siguienteCursor };
  }
}

export class ActualizarEvento {
  constructor(private readonly repo: EventoRepository) {}

  async ejecutar(
    id: number,
    cambios: CambiosEvento
  ): Promise<Result<EventoDTO, ErrorCambiosEvento | NoEncontrado>> {
    const validos = validarCambiosEvento(cambios);
    if (!validos.ok) return validos;
    const actualizado = await this.repo.actualizar(id, validos.value);
    return actualizado ? ok(aEventoDTO(actualizado)) : err(noEncontrado);
  }
}

export class ListarArtistas {
  constructor(private readonly repo: ArtistaRepository) {}

  async ejecutar(params: { soloDestacados?: boolean } = {}): Promise<ArtistaDTO[]> {
    const artistas = await this.repo.listar();
    return artistas.filter((a) => !params.soloDestacados || a.destacado).map(aArtistaDTO);
  }
}

export class ObtenerArtista {
  constructor(private readonly repo: ArtistaRepository) {}

  async ejecutar(
    slug: string
  ): Promise<Result<{ artista: ArtistaDTO; eventos: EventoDTO[] }, NoEncontrado>> {
    const artista = await this.repo.obtenerPorSlug(slug);
    if (!artista) return err(noEncontrado);
    const eventos = ordenarCronologicamente(await this.repo.eventosDeArtista(slug));
    return ok({ artista: aArtistaDTO(artista), eventos: eventos.map(aEventoDTO) });
  }
}

export const LIMITES_BUSQUEDA = { min: 2, max: 60 } as const;

export class BuscarEnFestival {
  constructor(
    private readonly gateway: ProgramacionGateway,
    private readonly artistas: ArtistaRepository
  ) {}

  async ejecutar(
    consulta: string
  ): Promise<
    Result<
      { eventos: EventoDTO[]; artistas: ArtistaDTO[] },
      ErrorUpstream | { tipo: "CONSULTA_INVALIDA" }
    >
  > {
    const q = normalizarBusqueda(consulta);
    if (q.length < LIMITES_BUSQUEDA.min || q.length > LIMITES_BUSQUEDA.max) {
      return err({ tipo: "CONSULTA_INVALIDA" });
    }
    const programacion = await this.gateway.obtenerProgramacion();
    if (!programacion.ok) return programacion;

    const eventos = ordenarCronologicamente(programacion.value).filter((e) =>
      coincideBusqueda(
        [e.nombre, e.descripcion, e.escenario.nombre, ...e.artistas.map((a) => a.nombre)],
        q
      )
    );
    const artistas = (await this.artistas.listar()).filter((a) =>
      coincideBusqueda([a.nombre, a.genero, a.origen], q)
    );
    return ok({ eventos: eventos.map(aEventoDTO), artistas: artistas.map(aArtistaDTO) });
  }
}
