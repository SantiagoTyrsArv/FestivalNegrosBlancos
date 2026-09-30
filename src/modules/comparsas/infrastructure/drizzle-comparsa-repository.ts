import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { comparsas } from "@/db/schema";
import type { Comparsa, ComparsaRepository } from "../domain/comparsa";

const aComparsa = (f: typeof comparsas.$inferSelect): Comparsa => ({
  id: f.id,
  slug: f.slug,
  nombre: f.nombre,
  fundacion: f.fundacion,
  director: f.director,
  integrantes: f.integrantes,
  descripcion: f.descripcion,
  motivo: f.motivo,
  color: f.color,
});

export class DrizzleComparsaRepository implements ComparsaRepository {
  constructor(private readonly db: Db) {}

  async listar(): Promise<Comparsa[]> {
    return (await this.db.select().from(comparsas).orderBy(asc(comparsas.id))).map(aComparsa);
  }

  async obtenerPorSlug(slug: string): Promise<Comparsa | null> {
    const [f] = await this.db.select().from(comparsas).where(eq(comparsas.slug, slug)).limit(1);
    return f ? aComparsa(f) : null;
  }
}
