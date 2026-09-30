import type { Result } from "@/shared/lib/result";
import type { Boleta, ErrorCompra, SesionBoleteria } from "./boleteria";

export interface SolicitudCompra {
  readonly sesionId: number;
  readonly usuarioId: number;
  readonly cantidad: number;
  /** Clave de idempotencia: reintentar la misma compra no duplica boletas. */
  readonly idempotencyKey: string;
  readonly codigo: string;
}

export interface CompraRegistrada {
  readonly boleta: Boleta;
  /** true si la clave ya existía y se devolvió la compra original. */
  readonly repetida: boolean;
}

export interface BoleteriaRepository {
  sesionesDeEvento(eventoId: number): Promise<SesionBoleteria[]>;
  obtenerSesion(id: number): Promise<SesionBoleteria | null>;
  /**
   * Debe ser ATÓMICO: comprobar cupo, descontarlo y registrar la boleta en
   * una sola transacción, de modo que compras concurrentes nunca sobrevendan.
   */
  registrarCompra(solicitud: SolicitudCompra): Promise<Result<CompraRegistrada, ErrorCompra>>;
  boletasDeUsuario(usuarioId: number): Promise<Boleta[]>;
}

export interface GeneradorCodigos {
  generar(): string;
}
