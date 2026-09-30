import "server-only";

/**
 * Limitador de ventana deslizante en memoria. Suficiente para una sola
 * instancia; en despliegues con varias réplicas debería respaldarse en un
 * almacén compartido (Redis, etc.). Ver ADR 0007.
 */
export class LimitadorTasa {
  private readonly golpes = new Map<string, number[]>();

  constructor(
    private readonly maximo: number,
    private readonly ventanaMs: number,
    private readonly reloj: () => number = Date.now
  ) {}

  /** Registra un intento. Devuelve los segundos a esperar si se superó el límite, o 0. */
  consumir(clave: string): number {
    const ahora = this.reloj();
    const recientes = (this.golpes.get(clave) ?? []).filter((t) => ahora - t < this.ventanaMs);
    if (recientes.length >= this.maximo) {
      this.golpes.set(clave, recientes);
      const masAntiguo = recientes[0] ?? ahora;
      return Math.max(1, Math.ceil((this.ventanaMs - (ahora - masAntiguo)) / 1000));
    }
    recientes.push(ahora);
    this.golpes.set(clave, recientes);
    if (this.golpes.size > 10_000) this.purgar(ahora);
    return 0;
  }

  private purgar(ahora: number) {
    for (const [clave, tiempos] of this.golpes) {
      if (tiempos.every((t) => ahora - t >= this.ventanaMs)) this.golpes.delete(clave);
    }
  }
}

declare global {
  var __cbnLimitadores: Map<string, LimitadorTasa> | undefined;
}

/** Limitadores compartidos por nombre (sobreviven a recargas en caliente en desarrollo). */
export function limitador(nombre: string, maximo: number, ventanaMs: number): LimitadorTasa {
  globalThis.__cbnLimitadores ??= new Map();
  let l = globalThis.__cbnLimitadores.get(nombre);
  if (!l) {
    l = new LimitadorTasa(maximo, ventanaMs);
    globalThis.__cbnLimitadores.set(nombre, l);
  }
  return l;
}

/** IP del cliente según el proxy de confianza (x-forwarded-for) o "local". */
export function ipDe(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local"
  );
}
