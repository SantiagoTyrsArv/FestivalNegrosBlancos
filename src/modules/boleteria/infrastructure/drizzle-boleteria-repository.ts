import { randomBytes } from "node:crypto";
import type { Client } from "@libsql/client";
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

/** Fila cruda devuelta por libSQL (columnas en snake_case). */
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
  id: Number(f.id),
  codigo: f.codigo,
  sesionId: Number(f.sesion_id),
  usuarioId: Number(f.usuario_id),
  cantidad: Number(f.cantidad),
  total: { centavos: Number(f.total_centavos), moneda: f.moneda },
  creadaEn: new Date(f.creado_en),
});

export class DrizzleBoleteriaRepository implements BoleteriaRepository {
  constructor(
    private readonly db: Db,
    private readonly client: Client
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
   * Compra atómica en UN solo batch de escritura de libSQL: Turso lo ejecuta
   * como una única transacción (todo o nada) en un solo viaje de red, sin
   * mantener locks mientras viajan datos entre cliente y servidor.
   *
   * 1. INSERT … SELECT condicional: solo inserta si la clave de idempotencia
   *    es nueva y si `cupo_vendido + n <= cupo_total` en ese mismo instante.
   * 2. UPDATE que descuenta el cupo solo si el INSERT anterior insertó una
   *    fila (`changes() = 1`, contador de la sentencia previa del batch).
   * 3-4. Lecturas para interpretar el resultado dentro de la misma transacción.
   *
   * Dos compras concurrentes se serializan y la segunda ve el cupo ya
   * descontado, así que la sobreventa es imposible; el CHECK de la tabla y el
   * índice único (usuario, idempotency_key) son barreras adicionales.
   */
  async registrarCompra(s: SolicitudCompra): Promise<Result<CompraRegistrada, ErrorCompra>> {
    const [insercion, , boleta, sesion] = await this.client.batch(
      [
        {
          sql: `INSERT INTO boletas (codigo, sesion_id, usuario_id, cantidad, total_centavos, moneda, idempotency_key)
                SELECT ?, id, ?, ?, precio_centavos * ?, moneda, ?
                FROM sesiones_boleteria
                WHERE id = ? AND cupo_vendido + ? <= cupo_total
                  AND NOT EXISTS (SELECT 1 FROM boletas WHERE usuario_id = ? AND idempotency_key = ?)`,
          args: [
            s.codigo,
            s.usuarioId,
            s.cantidad,
            s.cantidad,
            s.idempotencyKey,
            s.sesionId,
            s.cantidad,
            s.usuarioId,
            s.idempotencyKey,
          ],
        },
        {
          sql: "UPDATE sesiones_boleteria SET cupo_vendido = cupo_vendido + ? WHERE id = ? AND changes() = 1",
          args: [s.cantidad, s.sesionId],
        },
        {
          sql: "SELECT * FROM boletas WHERE usuario_id = ? AND idempotency_key = ?",
          args: [s.usuarioId, s.idempotencyKey],
        },
        {
          sql: "SELECT cupo_total, cupo_vendido FROM sesiones_boleteria WHERE id = ?",
          args: [s.sesionId],
        },
      ],
      "write"
    );

    const filaBoleta = boleta?.rows[0] as unknown as FilaBoletaSql | undefined;
    if (insercion?.rowsAffected === 1 && filaBoleta) {
      return ok({ boleta: boletaDesdeSql(filaBoleta), repetida: false });
    }
    if (filaBoleta) return ok({ boleta: boletaDesdeSql(filaBoleta), repetida: true });

    const filaSesion = sesion?.rows[0] as unknown as
      { cupo_total: number; cupo_vendido: number } | undefined;
    if (!filaSesion) return err({ tipo: "SESION_NO_ENCONTRADA" });
    return err({
      tipo: "CUPO_INSUFICIENTE",
      disponible: cupoDisponible({
        cupoTotal: Number(filaSesion.cupo_total),
        cupoVendido: Number(filaSesion.cupo_vendido),
      }),
    });
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
