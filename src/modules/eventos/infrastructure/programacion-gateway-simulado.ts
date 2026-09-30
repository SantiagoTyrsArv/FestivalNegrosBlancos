import { z } from "zod";
import { LATENCIA_CAOS_MS, type AjustesCaos } from "@/observability/caos";
import { err, ok, type Result } from "@/shared/lib/result";
import { TIPOS_EVENTO, type Evento } from "../domain/evento";
import type { ErrorUpstream, EventoRepository, ProgramacionGateway } from "../domain/ports";

/**
 * Contrato del payload de la API upstream (formato "externo", distinto del
 * dominio). Todo lo que entra se valida aquí: capa anticorrupción.
 */
const payloadUpstream = z.object({
  version: z.literal(1),
  eventos: z.array(
    z.object({
      id: z.number().int().positive(),
      titulo: z.string().min(1),
      categoria: z.enum(TIPOS_EVENTO),
      resumen: z.string(),
      empieza: z.string().datetime(),
      termina: z.string().datetime(),
      cancelado: z.boolean(),
      escenario: z.object({ slug: z.string(), nombre: z.string() }),
      artistas: z.array(z.object({ slug: z.string(), nombre: z.string() })),
    })
  ),
});

type PayloadUpstream = z.infer<typeof payloadUpstream>;

/**
 * SIMULACIÓN de una API upstream de programación. Como no hay un servicio
 * externo real, la "respuesta" se construye a partir de la BD local y se
 * serializa como lo haría una API HTTP; después se valida con Zod igual que
 * se haría con una respuesta real. El Modo Caos altera esa respuesta.
 */
export class ProgramacionGatewaySimulado implements ProgramacionGateway {
  constructor(
    private readonly fuente: EventoRepository,
    private readonly caos: AjustesCaos,
    private readonly esperar: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms))
  ) {}

  async obtenerProgramacion(): Promise<Result<Evento[], ErrorUpstream>> {
    const modo = await this.caos.modoActual();

    if (modo === "error") {
      return err({
        tipo: "UPSTREAM_NO_DISPONIBLE",
        detalle: "503 Service Unavailable (Modo Caos)",
      });
    }
    if (modo === "lento") await this.esperar(LATENCIA_CAOS_MS);

    const cuerpo = JSON.stringify(this.serializar(await this.fuente.listar()));
    const recibido: unknown = JSON.parse(cuerpo);
    if (modo === "invalido") corromper(recibido);

    const validado = payloadUpstream.safeParse(recibido);
    if (!validado.success) {
      return err({
        tipo: "UPSTREAM_RESPUESTA_INVALIDA",
        detalle: validado.error.issues[0]?.message ?? "payload inválido",
      });
    }
    return ok(validado.data.eventos.map(aDominio));
  }

  private serializar(eventos: Evento[]): PayloadUpstream {
    return {
      version: 1,
      eventos: eventos.map((e) => ({
        id: e.id,
        titulo: e.nombre,
        categoria: e.tipo,
        resumen: e.descripcion,
        empieza: e.inicio.toISOString(),
        termina: e.fin.toISOString(),
        cancelado: e.cancelado,
        escenario: e.escenario,
        artistas: [...e.artistas],
      })),
    };
  }
}

function aDominio(e: PayloadUpstream["eventos"][number]): Evento {
  return {
    id: e.id,
    nombre: e.titulo,
    tipo: e.categoria,
    descripcion: e.resumen,
    inicio: new Date(e.empieza),
    fin: new Date(e.termina),
    cancelado: e.cancelado,
    escenario: e.escenario,
    artistas: e.artistas,
  };
}

/** Simula una upstream que cambió su contrato sin avisar (fechas en otro formato). */
function corromper(payload: unknown): void {
  if (typeof payload !== "object" || payload === null || !("eventos" in payload)) return;
  const { eventos } = payload as { eventos: Array<Record<string, unknown>> };
  for (const e of eventos) e["empieza"] = "02/01/2027 5pm";
}
