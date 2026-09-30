import { err, ok, type Result } from "@/shared/lib/result";
import { aEventoDTO, type EventoDTO } from "@/modules/eventos/application/dto";
import { ordenarCronologicamente } from "@/modules/eventos/domain/evento";
import type { ErrorUpstream, ProgramacionGateway } from "@/modules/eventos/domain/ports";
import { aniosDeTrayectoria, type Comparsa, type ComparsaRepository } from "../domain/comparsa";
import { simularPosiciones, type PosicionComparsa } from "../domain/simulacion-en-vivo";

export interface ComparsaDTO {
  slug: string;
  nombre: string;
  fundacion: number;
  anios: number;
  director: string;
  integrantes: number;
  descripcion: string;
  motivo: string;
  color: string;
}

const aDTO = (c: Comparsa, anio: number): ComparsaDTO => ({
  slug: c.slug,
  nombre: c.nombre,
  fundacion: c.fundacion,
  anios: aniosDeTrayectoria(c, anio),
  director: c.director,
  integrantes: c.integrantes,
  descripcion: c.descripcion,
  motivo: c.motivo,
  color: c.color,
});

export class ListarComparsas {
  constructor(
    private readonly repo: ComparsaRepository,
    private readonly anioEdicion: number
  ) {}

  async ejecutar(): Promise<ComparsaDTO[]> {
    return (await this.repo.listar()).map((c) => aDTO(c, this.anioEdicion));
  }
}

export class ObtenerComparsa {
  constructor(
    private readonly repo: ComparsaRepository,
    private readonly anioEdicion: number
  ) {}

  async ejecutar(slug: string): Promise<Result<ComparsaDTO, { tipo: "NO_ENCONTRADO" }>> {
    const c = await this.repo.obtenerPorSlug(slug);
    return c ? ok(aDTO(c, this.anioEdicion)) : err({ tipo: "NO_ENCONTRADO" });
  }
}

export interface EstadoEnVivoDTO {
  generadoEn: string;
  simulado: true;
  posiciones: PosicionComparsa[];
  proximoEvento: EventoDTO | null;
}

/**
 * Estado del desfile en vivo: posiciones simuladas + el próximo evento de la
 * programación oficial (que viene de la upstream y por tanto sufre el Modo Caos).
 */
export class ObtenerEstadoEnVivo {
  constructor(
    private readonly repo: ComparsaRepository,
    private readonly programacion: ProgramacionGateway,
    private readonly reloj: () => Date = () => new Date()
  ) {}

  async ejecutar(): Promise<Result<EstadoEnVivoDTO, ErrorUpstream>> {
    const programacion = await this.programacion.obtenerProgramacion();
    if (!programacion.ok) return programacion;
    const ahora = this.reloj();
    const proximo = ordenarCronologicamente(programacion.value).find(
      (e) => !e.cancelado && e.fin > ahora
    );
    const comparsas = await this.repo.listar();
    return ok({
      generadoEn: ahora.toISOString(),
      simulado: true,
      posiciones: simularPosiciones(comparsas, ahora),
      proximoEvento: proximo ? aEventoDTO(proximo) : null,
    });
  }
}
