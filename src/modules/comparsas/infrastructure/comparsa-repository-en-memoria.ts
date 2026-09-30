import type { Comparsa, ComparsaRepository } from "../domain/comparsa";

export class ComparsaRepositoryEnMemoria implements ComparsaRepository {
  constructor(private readonly comparsas: Comparsa[] = []) {}

  async listar(): Promise<Comparsa[]> {
    return [...this.comparsas].sort((a, b) => a.id - b.id);
  }

  async obtenerPorSlug(slug: string): Promise<Comparsa | null> {
    return this.comparsas.find((c) => c.slug === slug) ?? null;
  }
}
