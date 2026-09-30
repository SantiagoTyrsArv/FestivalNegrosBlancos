"use server";

import { z } from "zod";
import { casos } from "@/composition-root";
import { MAXIMO_POR_ORDEN } from "@/modules/boleteria/domain/boleteria";
import { requerirSesion } from "@/modules/usuarios/infrastructure/sesion";
import { limitador } from "@/shared/http/rate-limit";
import { es } from "@/shared/i18n/es";
import type { EstadoFormulario } from "@/shared/ui/estado-formulario";

const t = es.checkout;

const esquema = z.object({
  sesionId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().min(1).max(MAXIMO_POR_ORDEN),
  // Generada en el servidor al pintar el formulario: si el usuario reenvía
  // (doble clic, recarga, reintento de red) la compra no se duplica.
  idempotencyKey: z.uuid(),
});

export async function comprarAction(
  _previo: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const entrada = {
    sesionId: formData.get("sesionId"),
    cantidad: formData.get("cantidad"),
    idempotencyKey: formData.get("idempotencyKey"),
  };
  const sesion = await requerirSesion(`/checkout?sesion=${String(entrada.sesionId ?? "")}`);

  const espera = limitador("compra", 10, 60_000).consumir(`usuario:${sesion.id}`);
  if (espera > 0) return { estado: "error", mensaje: es.auth.demasiadosIntentos(espera) };

  const datos = esquema.safeParse(entrada);
  if (!datos.success) {
    return {
      estado: "error",
      mensaje: t.errores.CANTIDAD_INVALIDA(MAXIMO_POR_ORDEN),
      errores: { cantidad: t.cantidadAyuda(MAXIMO_POR_ORDEN) },
    };
  }

  const r = await casos().boleteria.comprar.ejecutar({ ...datos.data, usuarioId: sesion.id });
  if (!r.ok) {
    const e = r.error;
    const mensaje =
      e.tipo === "CUPO_INSUFICIENTE"
        ? t.errores.CUPO_INSUFICIENTE(e.disponible)
        : e.tipo === "CANTIDAD_INVALIDA"
          ? t.errores.CANTIDAD_INVALIDA(e.maximo)
          : t.errores.SESION_NO_ENCONTRADA;
    return { estado: "error", mensaje };
  }
  return {
    estado: "exito",
    mensaje: r.value.repetida ? t.repetida : t.exito,
    valores: { codigo: r.value.boleta.codigo, cantidad: String(r.value.boleta.cantidad) },
  };
}
