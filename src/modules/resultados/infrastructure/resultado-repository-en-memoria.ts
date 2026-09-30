import type { Resultado, ResultadoRepository } from "../domain/resultado";

export class ResultadoRepositoryEnMemoria implements ResultadoRepository {
  constructor(private resultados: Resultado[] = []) {}

  async listar({ soloPublicados }: { soloPublicados: boolean }): Promise<Resultado[]> {
    return this.resultados
      .filter((r) => !soloPublicados || r.publicado)
      .sort((a, b) => a.id - b.id);
  }

  async obtener(id: number): Promise<Resultado | null> {
    return this.resultados.find((r) => r.id === id) ?? null;
  }

  async marcarPublicado(id: number, fecha: Date): Promise<void> {
    this.resultados = this.resultados.map((r) =>
      r.id === id ? { ...r, publicado: true, publicadoEn: fecha } : r
    );
  }
}
