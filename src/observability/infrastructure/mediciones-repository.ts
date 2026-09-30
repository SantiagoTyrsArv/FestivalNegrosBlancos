import { desc, eq, lt } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { medicionesRender } from "@/db/schema";
import type { EstadoCache, Medicion, OrigenMedicion, Patron } from "../domain/medicion";

/** Máximo de mediciones conservadas: el observatorio es una ventana reciente, no un histórico. */
export const RETENCION_MEDICIONES = 2000;

type Fila = typeof medicionesRender.$inferSelect;

const aMedicion = (f: Fila): Medicion => ({
  ruta: f.ruta,
  patron: f.patron as Patron,
  origen: f.origen as OrigenMedicion,
  generadoEn: new Date(f.generadoEn),
  tiempoRenderMs: f.tiempoRenderMs,
  estadoCache: f.estadoCache as EstadoCache,
  enHtmlInicial: f.enHtmlInicial,
  creadoEn: new Date(f.creadoEn),
});

export class DrizzleMedicionesRepository {
  constructor(private readonly db: Db) {}

  async registrar(m: Omit<Medicion, "creadoEn">): Promise<void> {
    const [insertada] = await this.db
      .insert(medicionesRender)
      .values({
        ruta: m.ruta,
        patron: m.patron,
        origen: m.origen,
        generadoEn: m.generadoEn.toISOString(),
        tiempoRenderMs: m.tiempoRenderMs,
        estadoCache: m.estadoCache,
        enHtmlInicial: m.enHtmlInicial,
      })
      .returning({ id: medicionesRender.id });
    // Retención: se borra lo anterior a la ventana cada 100 inserciones.
    if (insertada && insertada.id % 100 === 0) {
      await this.db
        .delete(medicionesRender)
        .where(lt(medicionesRender.id, insertada.id - RETENCION_MEDICIONES));
    }
  }

  async recientes(limite = 500): Promise<Medicion[]> {
    const filas = await this.db
      .select()
      .from(medicionesRender)
      .orderBy(desc(medicionesRender.id))
      .limit(limite);
    return filas.map(aMedicion);
  }

  async deRuta(ruta: string, limite = 30): Promise<Medicion[]> {
    const filas = await this.db
      .select()
      .from(medicionesRender)
      .where(eq(medicionesRender.ruta, ruta))
      .orderBy(desc(medicionesRender.id))
      .limit(limite);
    return filas.map(aMedicion);
  }

  async vaciar(): Promise<void> {
    await this.db.delete(medicionesRender);
  }
}
