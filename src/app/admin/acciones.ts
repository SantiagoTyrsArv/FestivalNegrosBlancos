"use server";

import { z } from "zod";
import { revalidar } from "@/app/_lib/revalidacion";
import { casos } from "@/composition-root";
import { requerirAdmin } from "@/modules/usuarios/infrastructure/sesion";
import { esModoCaos } from "@/observability/caos";
import { CACHE_TAGS } from "@/shared/config/constants";
import { es } from "@/shared/i18n/es";
import type { EstadoFormulario } from "@/shared/ui/estado-formulario";

const t = es.admin;

const esquemaEvento = z.object({
  id: z.coerce.number().int().positive(),
  nombre: z.string(),
  descripcion: z.string(),
  cancelado: z.boolean(),
});

/** Edita un evento e invalida al instante las páginas ISR que lo muestran. */
export async function actualizarEventoAction(
  _previo: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirAdmin("/admin");
  const datos = esquemaEvento.safeParse({
    id: formData.get("id"),
    nombre: String(formData.get("nombre") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    cancelado: formData.get("cancelado") === "on",
  });
  if (!datos.success) return { estado: "error", mensaje: t.noEncontrado };

  const { id, ...cambios } = datos.data;
  const r = await casos().eventos.actualizar.ejecutar(id, cambios);
  if (!r.ok) {
    const mensaje =
      r.error.tipo === "NOMBRE_INVALIDO"
        ? t.errorNombre
        : r.error.tipo === "DESCRIPCION_INVALIDA"
          ? t.errorDescripcion
          : t.noEncontrado;
    return { estado: "error", mensaje };
  }
  const etiquetas = [
    CACHE_TAGS.programacion,
    ...r.value.artistas.map((a) => CACHE_TAGS.artista(a.slug)),
  ];
  revalidar({ etiquetas, modo: "inmediata" });
  return { estado: "exito", mensaje: t.guardado(etiquetas.join(", ")) };
}

export async function publicarResultadoAction(
  _previo: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirAdmin("/admin");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { estado: "error", mensaje: t.noEncontrado };
  const r = await casos().resultados.publicar.ejecutar(id.data);
  if (!r.ok)
    return {
      estado: "error",
      mensaje: r.error.tipo === "YA_PUBLICADO" ? t.yaPublicado : t.noEncontrado,
    };
  revalidar({ etiquetas: [CACHE_TAGS.resultados], modo: "inmediata" });
  return { estado: "exito", mensaje: t.publicado };
}

/** Activa/desactiva el Modo Caos (solo admin). La propia upstream simulada lo lee en cada llamada. */
export async function cambiarModoCaosAction(formData: FormData): Promise<void> {
  await requerirAdmin("/observatorio");
  const modo = String(formData.get("modo") ?? "");
  if (!esModoCaos(modo)) return;
  await casos().caos.cambiarModo(modo);
  // "swr": la próxima visita a /programacion recibe la versión cacheada y
  // dispara una regeneración en segundo plano; si la upstream falla, Next
  // conserva esa última versión buena (lo que el Modo Caos quiere demostrar).
  revalidar({ etiquetas: [CACHE_TAGS.programacion], rutas: ["/observatorio"], modo: "swr" });
}
