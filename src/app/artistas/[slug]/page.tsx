import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { artistaCacheado } from "@/app/_lib/datos-cacheados";
import { casos } from "@/composition-root";
import { EventoCard } from "@/modules/eventos/ui/EventoCard";
import { eventoJsonLd } from "@/modules/eventos/ui/json-ld";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { JsonLd } from "@/shared/ui/components/JsonLd";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/**
 * ISR con generación bajo demanda: solo los artistas destacados se generan en
 * el build. El resto se genera en su primera visita (dynamicParams = true, el
 * valor por defecto) y a partir de ahí queda cacheado y se revalida cada 5 min
 * o con revalidateTag("artista:{slug}").
 */
export const revalidate = 300;

export async function generateStaticParams() {
  const destacados = await casos().artistas.listar.ejecutar({ soloDestacados: true });
  return destacados.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/artistas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await artistaCacheado(slug);
  if (!r.ok) return {};
  return {
    title: r.value.artista.nombre,
    description: r.value.artista.biografia,
    alternates: { canonical: `/artistas/${slug}` },
    openGraph: {
      title: r.value.artista.nombre,
      description: r.value.artista.biografia,
      type: "profile",
    },
  };
}

const t = es.artistas;

export default async function ArtistaPage({ params }: PageProps<"/artistas/[slug]">) {
  const inicio = iniciarMedicion();
  const { slug } = await params;
  const r = await artistaCacheado(slug);
  if (!r.ok) notFound();
  const { artista, eventos } = r.value;

  return (
    <Container className="py-12">
      <article data-contenido-principal>
        <PageHeader
          antetitulo={`ISR · ${artista.destacado ? "pre-generado en build" : "generado bajo demanda"}`}
          titulo={artista.nombre}
          descripcion={artista.biografia}
        >
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-fg-muted inline">{t.genero}: </dt>
              <dd className="inline font-semibold">{artista.genero}</dd>
            </div>
            <div>
              <dt className="text-fg-muted inline">{t.origen}: </dt>
              <dd className="inline font-semibold">{artista.origen}</dd>
            </div>
          </dl>
        </PageHeader>
        <h2 className="mb-4 text-2xl font-bold">{t.presentaciones}</h2>
        {eventos.length === 0 ? (
          <EmptyState titulo={t.sinPresentaciones} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {eventos.map((e) => (
              <li key={e.id}>
                <EventoCard evento={e} />
              </li>
            ))}
          </ul>
        )}
      </article>
      <JsonLd datos={eventos.map(eventoJsonLd)} />
      <RenderProbe
        ruta={`/artistas/${slug}`}
        patron="ISR"
        revalidar={revalidate}
        inicioRender={inicio}
      />
    </Container>
  );
}
