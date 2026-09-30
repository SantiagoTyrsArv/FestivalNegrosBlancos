import type { Medicion } from "../domain/medicion";

/** Máximo de mediciones conservadas: el observatorio es una ventana reciente, no un histórico. */
export const RETENCION_MEDICIONES = 2000;

/** Mediciones de render y de vistas, de la más reciente a la más antigua. */
export class MedicionesEnMemoria {
  private mediciones: Medicion[] = [];

  constructor(private readonly reloj: () => Date = () => new Date()) {}

  async registrar(m: Omit<Medicion, "creadoEn">): Promise<void> {
    this.mediciones.unshift({ ...m, creadoEn: this.reloj() });
    if (this.mediciones.length > RETENCION_MEDICIONES) {
      this.mediciones.length = RETENCION_MEDICIONES;
    }
  }

  async recientes(limite = 500): Promise<Medicion[]> {
    return this.mediciones.slice(0, limite);
  }

  async deRuta(ruta: string, limite = 30): Promise<Medicion[]> {
    return this.mediciones.filter((m) => m.ruta === ruta).slice(0, limite);
  }

  async vaciar(): Promise<void> {
    this.mediciones = [];
  }
}
