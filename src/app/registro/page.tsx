import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinoSeguro, obtenerSesion } from "@/modules/usuarios/infrastructure/sesion";
import { FormularioAuth } from "@/modules/usuarios/ui/FormularioAuth";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { registrarAction } from "../login/acciones";

export const dynamic = "force-dynamic";

const t = es.auth;

export const metadata: Metadata = {
  title: t.registroTitulo,
  robots: { index: false, follow: false },
};

export default async function RegistroPage({ searchParams }: PageProps<"/registro">) {
  const inicio = iniciarMedicion();
  const siguiente = destinoSeguro((await searchParams)["siguiente"]);
  if (await obtenerSesion()) redirect(siguiente);

  return (
    <Container className="py-12">
      <div data-contenido-principal className="mx-auto max-w-lg">
        <PageHeader
          antetitulo="SSR"
          titulo={t.registroTitulo}
          descripcion={t.registroDescripcion}
        />
        <FormularioAuth modo="registro" accion={registrarAction} siguiente={siguiente} />
      </div>
      <RenderProbe ruta="/registro" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
