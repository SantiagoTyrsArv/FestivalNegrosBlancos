import { err, ok, type Result } from "@/shared/lib/result";
import {
  clasificar,
  type ErrorPublicacion,
  type Resultado,
  type ResultadoRepository,
} from "../domain/resultado";

export interface ResultadoDTO {
  id: number;
  puesto: number;
  comparsa: { slug: string; nombre: string; color: string };
  categoria: string;
  puntajeCentesimas: number;
  publicado: boolean;
  publicadoEn: string | null;
}

export interface TablaDTO {
  categoria: string;
  posiciones: ResultadoDTO[];
}

const aDTO = (r: Resultado, puesto: number): ResultadoDTO => ({
  id: r.id,
  puesto,
  comparsa: { ...r.comparsa },
  categoria: r.categoria,
  puntajeCentesimas: r.puntajeCentesimas,
  publicado: r.publicado,
  publicadoEn: r.publicadoEn?.toISOString() ?? null,
});

/** Tablas de resultados publicados (lo que ve el público). */
export class ListarResultadosPublicados {
  constructor(private readonly repo: ResultadoRepository) {}

  async ejecutar(): Promise<TablaDTO[]> {
    const tablas = clasificar(await this.repo.listar({ soloPublicados: true }));
    return tablas.map((t) => ({
      categoria: t.categoria,
      posiciones: t.posiciones.map((p) => aDTO(p.resultado, p.puesto)),
    }));
  }
}

/** Todos los resultados, publicados o no (panel admin). */
export class ListarResultadosAdmin {
  constructor(private readonly repo: ResultadoRepository) {}

  async ejecutar(): Promise<ResultadoDTO[]> {
    return (await this.repo.listar({ soloPublicados: false })).map((r) => aDTO(r, 0));
  }
}

export class PublicarResultado {
  constructor(
    private readonly repo: ResultadoRepository,
    private readonly reloj: () => Date = () => new Date()
  ) {}

  async ejecutar(id: number): Promise<Result<{ id: number }, ErrorPublicacion>> {
    const resultado = await this.repo.obtener(id);
    if (!resultado) return err({ tipo: "NO_ENCONTRADO" });
    if (resultado.publicado) return err({ tipo: "YA_PUBLICADO" });
    await this.repo.marcarPublicado(id, this.reloj());
    return ok({ id });
  }
}
