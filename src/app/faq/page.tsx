import type { Metadata } from "next";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { JsonLd } from "@/shared/ui/components/JsonLd";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

export const dynamic = "force-static";

const t = es.faq;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: t.preguntas.map(([pregunta, respuesta]) => ({
    "@type": "Question",
    name: pregunta,
    acceptedAnswer: { "@type": "Answer", text: respuesta },
  })),
};

export default function FaqPage() {
  const inicio = iniciarMedicion();
  return (
    <Container className="py-12">
      <div data-contenido-principal className="mx-auto max-w-3xl">
        <PageHeader antetitulo="SSG" titulo={t.titulo} descripcion={t.descripcion} />
        {/* <details> es accesible por teclado y funciona sin JavaScript. */}
        <div className="flex flex-col gap-3">
          {t.preguntas.map(([pregunta, respuesta]) => (
            <details
              key={pregunta}
              className="group border-border bg-surface rounded-lg border p-5"
            >
              <summary className="marker:text-primary cursor-pointer text-lg font-semibold">
                {pregunta}
              </summary>
              <p className="text-fg-muted mt-3">{respuesta}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd datos={faqJsonLd} />
      <RenderProbe ruta="/faq" patron="SSG" inicioRender={inicio} />
    </Container>
  );
}
