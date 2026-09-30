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

/**
 * Boletería en memoria. `registrarCompra` no tiene ningún `await` entre la
 * comprobación del cupo y su descuento, así que en el event loop de Node se
 * ejecuta de forma atómica: dos compras concurrentes nunca sobrevenden.
 */
export class BoleteriaRepositoryEnMemoria implements BoleteriaRepository {
  private readonly boletas: Boleta[] = [];
  /** Clave de idempotencia (usuario:clave) → boleta ya emitida. */
  private readonly porClave = new Map<string, Boleta>();

  constructor(
    private sesiones: SesionBoleteria[] = [],
    private readonly reloj: () => Date = () => new Date()
  ) {}

  async sesionesDeEvento(eventoId: number): Promise<SesionBoleteria[]> {
    return this.sesiones
      .filter((s) => s.eventoId === eventoId)
      .sort((a, b) => a.precio.centavos - b.precio.centavos);
  }

  async obtenerSesion(id: number): Promise<SesionBoleteria | null> {
    return this.sesiones.find((s) => s.id === id) ?? null;
  }

  async boletasDeUsuario(usuarioId: number): Promise<Boleta[]> {
    return this.boletas.filter((b) => b.usuarioId === usuarioId).sort((a, b) => b.id - a.id);
  }

  async registrarCompra(s: SolicitudCompra): Promise<Result<CompraRegistrada, ErrorCompra>> {
    const clave = `${s.usuarioId}:${s.idempotencyKey}`;
    const previa = this.porClave.get(clave);
    if (previa) return ok({ boleta: previa, repetida: true });

    const sesion = this.sesiones.find((x) => x.id === s.sesionId);
    if (!sesion) return err({ tipo: "SESION_NO_ENCONTRADA" });
    if (cupoDisponible(sesion) < s.cantidad) {
      return err({ tipo: "CUPO_INSUFICIENTE", disponible: cupoDisponible(sesion) });
    }

    this.sesiones = this.sesiones.map((x) =>
      x.id === sesion.id ? { ...x, cupoVendido: x.cupoVendido + s.cantidad } : x
    );
    const boleta: Boleta = {
      id: this.boletas.length + 1,
      codigo: s.codigo,
      sesionId: s.sesionId,
      usuarioId: s.usuarioId,
      cantidad: s.cantidad,
      total: { centavos: sesion.precio.centavos * s.cantidad, moneda: sesion.precio.moneda },
      creadaEn: this.reloj(),
    };
    this.boletas.push(boleta);
    this.porClave.set(clave, boleta);
    return ok({ boleta, repetida: false });
  }
}

/** Códigos legibles tipo "CBN-7K3Q-9XPA" (sin caracteres ambiguos como 0/O o 1/I). */
export class GeneradorCodigosAleatorios implements GeneradorCodigos {
  private static readonly ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  generar(): string {
    const { ALFABETO } = GeneradorCodigosAleatorios;
    const chars = Array.from(
      { length: 8 },
      () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)] ?? "X"
    );
    return `CBN-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
  }
}
