import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { comparsas, resultados } from "@/db/schema";
import type { Resultado, ResultadoRepository } from "../domain/resultado";

export class DrizzleResultadoRepository implements ResultadoRepository {
  constructor(private readonly db: Db) {}

  async listar({ soloPublicados }: { soloPublicados: boolean }): Promise<Resultado[]> {
    const filas = await this.consulta()
      .where(soloPublicados ? eq(resultados.publicado, true) : undefined)
      .orderBy(asc(resultados.id));
    return filas.map(aResultado);
  }

  async obtener(id: number): Promise<Resultado | null> {
    const [fila] = await this.consulta().where(eq(resultados.id, id)).limit(1);
    return fila ? aResultado(fila) : null;
  }

  async marcarPublicado(id: number, fecha: Date): Promise<void> {
    await this.db
      .update(resultados)
      .set({ publicado: true, publicadoEn: fecha.toISOString() })
      .where(eq(resultados.id, id));
  }

  private consulta() {
    return this.db
      .select({
        resultado: resultados,
        comparsa: { slug: comparsas.slug, nombre: comparsas.nombre, color: comparsas.color },
      })
      .from(resultados)
      .innerJoin(comparsas, eq(resultados.comparsaId, comparsas.id));
  }
}

function aResultado(f: {
  resultado: typeof resultados.$inferSelect;
  comparsa: { slug: string; nombre: string; color: string };
}): Resultado {
  return {
    id: f.resultado.id,
    comparsa: f.comparsa,
    categoria: f.resultado.categoria,
    puntajeCentesimas: f.resultado.puntajeCentesimas,
    publicado: f.resultado.publicado,
    publicadoEn: f.resultado.publicadoEn ? new Date(f.resultado.publicadoEn) : null,
  };
}
