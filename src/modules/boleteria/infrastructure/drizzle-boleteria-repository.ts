import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { boletas, sesionesBoleteria } from "@/db/schema";
import { err, ok, type Result } from "@/shared/lib/result";
import {
  cupoDisponible,
  type Boleta,
  type ErrorCompra,
  type SesionBoleteria,
} from "../domain/boleteria";
import type {
  BoleteriaRepository,
  CompraRegistrada,
  GeneradorCodigos,
  SolicitudCompra,
} from "../domain/ports";

type FilaSesion = typeof sesionesBoleteria.$inferSelect;
type FilaBoleta = typeof boletas.$inferSelect;

const aSesion = (f: FilaSesion): SesionBoleteria => ({
  id: f.id,
  eventoId: f.eventoId,
  nombre: f.nombre,
  cupoTotal: f.cupoTotal,
  cupoVendido: f.cupoVendido,
  precio: { centavos: f.precioCentavos, moneda: f.moneda },
});

const aBoleta = (f: FilaBoleta): Boleta => ({
  id: f.id,
  codigo: f.codigo,
  sesionId: f.sesionId,
  usuarioId: f.usuarioId,
  cantidad: f.cantidad,
  total: { centavos: f.totalCentavos, moneda: f.moneda },
  creadaEn: new Date(f.creadoEn),
});

/** Fila cruda devuelta por node:sqlite (columnas en snake_case). */
interface FilaBoletaSql {
  id: number;
  codigo: string;
  sesion_id: number;
  usuario_id: number;
  cantidad: number;
  total_centavos: number;
  moneda: string;
  creado_en: string;
}

const boletaDesdeSql = (f: FilaBoletaSql): Boleta => ({
  id: f.id,
  codigo: f.codigo,
  sesionId: f.sesion_id,
  usuarioId: f.usuario_id,
  cantidad: f.cantidad,
  total: { centavos: f.total_centavos, moneda: f.moneda },
  creadaEn: new Date(f.creado_en),
});

export class DrizzleBoleteriaRepository implements BoleteriaRepository {
  constructor(
    private readonly db: Db,
    private readonly sqlite: DatabaseSync
  ) {}

  async sesionesDeEvento(eventoId: number): Promise<SesionBoleteria[]> {
    const filas = await this.db
      .select()
      .from(sesionesBoleteria)
      .where(eq(sesionesBoleteria.eventoId, eventoId))
      .orderBy(asc(sesionesBoleteria.precioCentavos));
    return filas.map(aSesion);
  }

  async obtenerSesion(id: number): Promise<SesionBoleteria | null> {
    const [fila] = await this.db
      .select()
      .from(sesionesBoleteria)
      .where(eq(sesionesBoleteria.id, id))
      .limit(1);
    return fila ? aSesion(fila) : null;
  }

  async boletasDeUsuario(usuarioId: number): Promise<Boleta[]> {
    const filas = await this.db
      .select()
      .from(boletas)
      .where(eq(boletas.usuarioId, usuarioId))
      .orderBy(desc(boletas.id));
    return filas.map(aBoleta);
  }

  /**
   * Compra atómica. Se ejecuta de forma SÍNCRONA sobre el manejador nativo:
   * entre BEGIN y COMMIT no hay ningún `await`, así que ninguna otra petición
   * del mismo proceso puede intercalarse. `BEGIN IMMEDIATE` toma el lock de
   * escritura desde el inicio (protege frente a otros procesos) y el UPDATE
   * condicional `cupo_vendido + n <= cupo_total` hace imposible la sobreventa
   * aunque dos compras lean el mismo cupo. La restricción CHECK de la tabla es
   * una tercera barrera.
   */
  async registrarCompra(s: SolicitudCompra): Promise<Result<CompraRegistrada, ErrorCompra>> {
    const db = this.sqlite;
    db.exec("BEGIN IMMEDIATE");
    try {
      const previa = db
        .prepare("SELECT * FROM boletas WHERE usuario_id = ? AND idempotency_key = ?")
        .get(s.usuarioId, s.idempotencyKey) as FilaBoletaSql | undefined;
      if (previa) {
        db.exec("COMMIT");
        return ok({ boleta: boletaDesdeSql(previa), repetida: true });
      }

      const descuento = db
        .prepare(
          `UPDATE sesiones_boleteria SET cupo_vendido = cupo_vendido + ?
           WHERE id = ? AND cupo_vendido + ? <= cupo_total`
        )
        .run(s.cantidad, s.sesionId, s.cantidad);

      const sesion = db
        .prepare(
          "SELECT cupo_total, cupo_vendido, precio_centavos, moneda FROM sesiones_boleteria WHERE id = ?"
        )
        .get(s.sesionId) as
        | { cupo_total: number; cupo_vendido: number; precio_centavos: number; moneda: string }
        | undefined;

      if (Number(descuento.changes) === 0) {
        db.exec("ROLLBACK");
        if (!sesion) return err({ tipo: "SESION_NO_ENCONTRADA" });
        return err({
          tipo: "CUPO_INSUFICIENTE",
          disponible: cupoDisponible({
            cupoTotal: sesion.cupo_total,
            cupoVendido: sesion.cupo_vendido,
          }),
        });
      }
      if (!sesion) throw new Error("Sesión desaparecida dentro de la transacción");

      const insertada = db
        .prepare(
          `INSERT INTO boletas (codigo, sesion_id, usuario_id, cantidad, total_centavos, moneda, idempotency_key)
           VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
        )
        .get(
          s.codigo,
          s.sesionId,
          s.usuarioId,
          s.cantidad,
          sesion.precio_centavos * s.cantidad,
          sesion.moneda,
          s.idempotencyKey
        ) as unknown as FilaBoletaSql;

      db.exec("COMMIT");
      return ok({ boleta: boletaDesdeSql(insertada), repetida: false });
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }
}

/** Códigos legibles tipo "CBN-7K3Q-9XPA" (sin caracteres ambiguos como 0/O o 1/I). */
export class GeneradorCodigosAleatorios implements GeneradorCodigos {
  private static readonly ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  generar(): string {
    const bytes = randomBytes(8);
    const chars = [...bytes].map((b) => GeneradorCodigosAleatorios.ALFABETO[b % 32] ?? "X");
    return `CBN-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
  }
}
