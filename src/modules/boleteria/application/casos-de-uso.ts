import { err, ok, type Result } from "@/shared/lib/result";
import {
  cupoDisponible,
  disponibilidad,
  validarCompra,
  type Boleta,
  type Disponibilidad,
  type ErrorCompra,
  type SesionBoleteria,
} from "../domain/boleteria";
import type { BoleteriaRepository, GeneradorCodigos } from "../domain/ports";

export interface SesionDTO {
  id: number;
  eventoId: number;
  nombre: string;
  cupoTotal: number;
  disponible: number;
  disponibilidad: Disponibilidad;
  precioCentavos: number;
  moneda: string;
}

export interface BoletaDTO {
  codigo: string;
  sesionId: number;
  cantidad: number;
  totalCentavos: number;
  moneda: string;
  creadaEn: string;
}

export const aSesionDTO = (s: SesionBoleteria): SesionDTO => ({
  id: s.id,
  eventoId: s.eventoId,
  nombre: s.nombre,
  cupoTotal: s.cupoTotal,
  disponible: cupoDisponible(s),
  disponibilidad: disponibilidad(s),
  precioCentavos: s.precio.centavos,
  moneda: s.precio.moneda,
});

export const aBoletaDTO = (b: Boleta): BoletaDTO => ({
  codigo: b.codigo,
  sesionId: b.sesionId,
  cantidad: b.cantidad,
  totalCentavos: b.total.centavos,
  moneda: b.total.moneda,
  creadaEn: b.creadaEn.toISOString(),
});

/** Cupos en tiempo real de un evento (nunca cacheado). */
export class ConsultarCupos {
  constructor(private readonly repo: BoleteriaRepository) {}

  async ejecutar(eventoId: number): Promise<SesionDTO[]> {
    return (await this.repo.sesionesDeEvento(eventoId)).map(aSesionDTO);
  }
}

export class ObtenerSesion {
  constructor(private readonly repo: BoleteriaRepository) {}

  async ejecutar(id: number): Promise<SesionDTO | null> {
    const sesion = await this.repo.obtenerSesion(id);
    return sesion ? aSesionDTO(sesion) : null;
  }
}

export interface EntradaCompra {
  sesionId: number;
  usuarioId: number;
  cantidad: number;
  idempotencyKey: string;
}

export class ComprarBoletas {
  constructor(
    private readonly repo: BoleteriaRepository,
    private readonly codigos: GeneradorCodigos
  ) {}

  async ejecutar(
    entrada: EntradaCompra
  ): Promise<Result<{ boleta: BoletaDTO; repetida: boolean }, ErrorCompra>> {
    const sesion = await this.repo.obtenerSesion(entrada.sesionId);
    if (!sesion) return err({ tipo: "SESION_NO_ENCONTRADA" });

    // Validación temprana para dar un error claro; la garantía real contra la
    // sobreventa la da la transacción atómica del repositorio.
    const valida = validarCompra(sesion, entrada.cantidad);
    if (!valida.ok) return valida;

    const registro = await this.repo.registrarCompra({
      ...entrada,
      codigo: this.codigos.generar(),
    });
    if (!registro.ok) return registro;
    return ok({ boleta: aBoletaDTO(registro.value.boleta), repetida: registro.value.repetida });
  }
}

export class ListarBoletasDeUsuario {
  constructor(private readonly repo: BoleteriaRepository) {}

  async ejecutar(usuarioId: number): Promise<BoletaDTO[]> {
    return (await this.repo.boletasDeUsuario(usuarioId)).map(aBoletaDTO);
  }
}
