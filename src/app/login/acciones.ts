"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { casos } from "@/composition-root";
import {
  cerrarSesionEnCookie,
  destinoSeguro,
  iniciarSesionEnCookie,
} from "@/modules/usuarios/infrastructure/sesion";
import { es } from "@/shared/i18n/es";
import { erroresPorCampo, type EstadoFormulario } from "@/shared/ui/estado-formulario";

// Toda entrada de formulario se valida con Zod antes de llegar a los casos de uso.

const t = es.auth;

const esquemaLogin = z.object({
  email: z.email(t.emailInvalido).max(254),
  password: z.string().min(1, t.requerido).max(128),
});

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, t.nombreInvalido).max(80, t.nombreInvalido),
  email: z.email(t.emailInvalido).max(254),
  password: z.string().min(1, t.requerido).max(128),
});

export async function iniciarSesionAction(
  _previo: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const entrada = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const valores = { email: entrada.email };

  const datos = esquemaLogin.safeParse(entrada);
  if (!datos.success) {
    return {
      estado: "error",
      mensaje: t.datosInvalidos,
      errores: erroresPorCampo(datos.error.issues),
      valores,
    };
  }

  const r = await casos().usuarios.iniciarSesion.ejecutar(datos.data.email, datos.data.password);
  if (!r.ok) return { estado: "error", mensaje: t.credencialesInvalidas, valores };

  await iniciarSesionEnCookie({ id: r.value.id, nombre: r.value.nombre, rol: r.value.rol });
  redirect(
    destinoSeguro(formData.get("siguiente"), r.value.rol === "admin" ? "/admin" : "/boletas")
  );
}

export async function registrarAction(
  _previo: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const entrada = {
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const valores = { nombre: entrada.nombre, email: entrada.email };

  const datos = esquemaRegistro.safeParse(entrada);
  if (!datos.success) {
    return {
      estado: "error",
      mensaje: t.datosInvalidos,
      errores: erroresPorCampo(datos.error.issues),
      valores,
    };
  }

  const r = await casos().usuarios.registrar.ejecutar(datos.data);
  if (!r.ok) {
    return r.error.tipo === "EMAIL_EN_USO"
      ? { estado: "error", mensaje: t.emailEnUso, errores: { email: t.emailEnUso }, valores }
      : {
          estado: "error",
          mensaje: t.passwordDebil,
          errores: { password: t.passwordAyuda },
          valores,
        };
  }

  await iniciarSesionEnCookie({ id: r.value.id, nombre: r.value.nombre, rol: r.value.rol });
  redirect(destinoSeguro(formData.get("siguiente"), "/boletas"));
}

export async function cerrarSesionAction(): Promise<void> {
  await cerrarSesionEnCookie();
  redirect("/");
}
