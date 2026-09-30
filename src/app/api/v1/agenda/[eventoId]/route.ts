import { casos } from "@/composition-root";
import { obtenerSesion } from "@/modules/usuarios/infrastructure/sesion";
import { json, noAutenticado, problema } from "@/shared/http/problem";

/** Quita un evento de la agenda. Idempotente: quitar algo que no estaba también responde 200. */
export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/v1/agenda/[eventoId]">
) {
  const sesion = await obtenerSesion();
  if (!sesion) return noAutenticado();
  const { eventoId } = await params;
  if (!/^\d{1,9}$/.test(eventoId))
    return problema(400, "parametros-invalidos", "Identificador inválido");
  await casos().agenda.quitar.ejecutar(sesion.id, Number(eventoId));
  return json(await casos().agenda.ver.ejecutar(sesion.id));
}
