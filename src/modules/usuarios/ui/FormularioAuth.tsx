"use client";

import Link from "next/link";
import { useActionState } from "react";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Button } from "@/shared/ui/components/Button";
import { Field } from "@/shared/ui/components/Field";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/shared/ui/estado-formulario";

type Accion = (previo: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

const t = es.auth;

/**
 * Formulario de login/registro. Pasar la Server Action a useActionState
 * mantiene la mejora progresiva: sin JavaScript el <form> hace un POST normal.
 */
export function FormularioAuth({
  modo,
  accion,
  siguiente,
}: {
  modo: "login" | "registro";
  accion: Accion;
  siguiente: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const esRegistro = modo === "registro";
  const sufijo = siguiente !== "/" ? `?siguiente=${encodeURIComponent(siguiente)}` : "";

  return (
    <form action={enviar} noValidate className="flex flex-col gap-5">
      {estado.estado === "error" && estado.mensaje && (
        <Alert tono="peligro" rol="alert" titulo={estado.mensaje} />
      )}
      <input type="hidden" name="siguiente" value={siguiente} />
      {esRegistro && (
        <Field
          etiqueta={t.nombre}
          name="nombre"
          autoComplete="name"
          required
          defaultValue={estado.valores?.nombre}
          error={estado.errores?.nombre}
        />
      )}
      <Field
        etiqueta={t.email}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={estado.valores?.email}
        error={estado.errores?.email}
      />
      <Field
        etiqueta={t.password}
        name="password"
        type="password"
        autoComplete={esRegistro ? "new-password" : "current-password"}
        required
        {...(esRegistro ? { ayuda: t.passwordAyuda } : {})}
        error={estado.errores?.password}
      />
      <Button type="submit" cargando={pendiente} tamano="lg">
        {esRegistro ? t.registrarme : t.entrar}
      </Button>
      <p className="text-fg-muted text-sm">
        {esRegistro ? t.conCuenta : t.sinCuenta}{" "}
        <Link href={`${esRegistro ? "/login" : "/registro"}${sufijo}`}>
          {esRegistro ? t.entrar : t.registrarme}
        </Link>
      </p>
    </form>
  );
}
