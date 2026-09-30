import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinoSeguro, obtenerSesion } from "@/modules/usuarios/infrastructure/sesion";
import { FormularioAuth } from "@/modules/usuarios/ui/FormularioAuth";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Card } from "@/shared/ui/components/Card";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { iniciarSesionAction } from "./acciones";

/** SSR: depende de la cookie de sesión (si ya hay sesión, redirige en el servidor). */
export const dynamic = "force-dynamic";

const t = es.auth;

export const metadata: Metadata = {
  title: t.loginTitulo,
  robots: { index: false, follow: false },
};

/** Cuentas del seed. Se muestran a propósito: es una demo pública de un proyecto académico. */
const CUENTAS_DEMO = [
  ["Admin (panel, Modo Caos)", "admin@carnaval.test", "Admin123!"],
  ["Asistente (compras, agenda)", "asistente@carnaval.test", "Asistente123!"],
] as const;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const inicio = iniciarMedicion();
  const siguiente = destinoSeguro((await searchParams)["siguiente"]);
  if (await obtenerSesion()) redirect(siguiente);

  return (
    <Container className="py-12">
      <div data-contenido-principal className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[3fr_2fr]">
        <div>
          <PageHeader antetitulo="SSR" titulo={t.loginTitulo} descripcion={t.loginDescripcion} />
          <FormularioAuth modo="login" accion={iniciarSesionAction} siguiente={siguiente} />
        </div>
        <aside aria-labelledby="demo" className="flex flex-col gap-4">
          <Card>
            <h2 id="demo" className="text-xl font-bold">
              {t.cuentasDemo}
            </h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              {CUENTAS_DEMO.map(([rol, email, clave]) => (
                <div key={email}>
                  <dt className="font-semibold">{rol}</dt>
                  <dd className="font-mono">{email}</dd>
                  <dd className="font-mono">{clave}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Alert titulo={es.comun.patron}>{t.patronNota}</Alert>
        </aside>
      </div>
      <RenderProbe ruta="/login" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
