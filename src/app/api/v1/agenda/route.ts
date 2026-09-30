import { z } from "zod";
import { casos } from "@/composition-root";
import { obtenerSesion } from "@/modules/usuarios/infrastructure/sesion";
import { json, leerCuerpo, noAutenticado, problema } from "@/shared/http/problem";
import { es } from "@/shared/i18n/es";

export const dynamic = "force-dynamic";

/** Agenda del usuario autenticado (privada: nunca se cachea). */
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) return noAutenticado();
  return json(await casos().agenda.ver.ejecutar(sesion.id));
}

const esquema = z.object({ eventoId: z.number().int().positive() });

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return noAutenticado();
  const cuerpo = await leerCuerpo(request, esquema);
  if (!cuerpo.ok) return cuerpo.respuesta;

  const r = await casos().agenda.agregar.ejecutar(sesion.id, cuerpo.datos.eventoId);
  if (!r.ok) {
    switch (r.error.tipo) {
      case "EVENTO_NO_ENCONTRADO":
        return problema(404, "no-encontrado", "Evento no encontrado");
      case "EVENTO_CANCELADO":
        return problema(409, "evento-cancelado", "El evento está cancelado");
      case "AGENDA_LLENA":
        return problema(
          409,
          "agenda-llena",
          es.agenda.errorGuardar,
          `Máximo ${r.error.maximo} eventos.`
        );
    }
  }
  return json(await casos().agenda.ver.ejecutar(sesion.id), { status: 201 });
}
