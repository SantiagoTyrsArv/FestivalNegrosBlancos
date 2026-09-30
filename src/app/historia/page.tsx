import type { Metadata } from "next";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

export const dynamic = "force-static";

const t = es.historia;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/historia" },
};

export default function HistoriaPage() {
  const inicio = iniciarMedicion();
  return (
    <Container className="py-12">
      <article data-contenido-principal className="mx-auto max-w-3xl">
        <PageHeader antetitulo="SSG" titulo={t.titulo} descripcion={t.descripcion} />
        <div className="flex flex-col gap-5 text-lg">
          {t.parrafos.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <Alert className="mt-10" titulo={es.comun.patron}>
          {t.patronNota}
        </Alert>
      </article>
      <RenderProbe ruta="/historia" patron="SSG" inicioRender={inicio} />
    </Container>
  );
}
