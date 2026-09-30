import { err, ok, type Result } from "@/shared/lib/result";

/** Dinero como entero de centavos con moneda explícita: nunca coma flotante. */
export interface Dinero {
  readonly centavos: number;
  readonly moneda: string;
}

export function multiplicar(d: Dinero, factor: number): Dinero {
  if (!Number.isInteger(factor)) throw new RangeError("El factor debe ser entero");
  return { centavos: d.centavos * factor, moneda: d.moneda };
}

export interface SesionBoleteria {
  readonly id: number;
  readonly eventoId: number;
  readonly nombre: string;
  readonly cupoTotal: number;
  readonly cupoVendido: number;
  readonly precio: Dinero;
}

export interface Boleta {
  readonly id: number;
  readonly codigo: string;
  readonly sesionId: number;
  readonly usuarioId: number;
  readonly cantidad: number;
  readonly total: Dinero;
  readonly creadaEn: Date;
}

export type Disponibilidad = "disponible" | "ultimas" | "agotado";

export const MAXIMO_POR_ORDEN = 6;

export function cupoDisponible(s: Pick<SesionBoleteria, "cupoTotal" | "cupoVendido">): number {
  return Math.max(0, s.cupoTotal - s.cupoVendido);
}

/** "Últimas boletas" cuando queda el 5 % del aforo o menos (mínimo 10 unidades). */
export function disponibilidad(
  s: Pick<SesionBoleteria, "cupoTotal" | "cupoVendido">
): Disponibilidad {
  const quedan = cupoDisponible(s);
  if (quedan === 0) return "agotado";
  return quedan <= Math.max(10, Math.ceil(s.cupoTotal * 0.05)) ? "ultimas" : "disponible";
}

export type ErrorCompra =
  | { readonly tipo: "CANTIDAD_INVALIDA"; readonly maximo: number }
  | { readonly tipo: "CUPO_INSUFICIENTE"; readonly disponible: number }
  | { readonly tipo: "SESION_NO_ENCONTRADA" };

/**
 * Regla central del dominio: no se venden más boletas que el cupo. La
 * transacción de infraestructura vuelve a comprobarla de forma atómica,
 * porque entre esta validación y la escritura puede haber otras compras.
 */
export function validarCompra(
  sesion: SesionBoleteria,
  cantidad: number
): Result<{ total: Dinero }, ErrorCompra> {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAXIMO_POR_ORDEN) {
    return err({ tipo: "CANTIDAD_INVALIDA", maximo: MAXIMO_POR_ORDEN });
  }
  const disponible = cupoDisponible(sesion);
  if (cantidad > disponible) return err({ tipo: "CUPO_INSUFICIENTE", disponible });
  return ok({ total: multiplicar(sesion.precio, cantidad) });
}
