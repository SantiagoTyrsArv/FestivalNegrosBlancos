import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { casos } from "@/composition-root";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { ButtonLink } from "@/shared/ui/components/Button";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/**
 * SSG con rutas dinámicas: todas las comparsas se generan en el build y
 * cualquier slug que no esté en la lista responde 404 (dynamicParams = false).
 * Una comparsa nueva requiere un nuevo despliegue.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

const t = es.comparsas;

export async function generateStaticParams() {
  const comparsas = await casos().comparsas.listar.ejecutar();
  return comparsas.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/comparsas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await casos().comparsas.obtener.ejecutar(slug);
  if (!r.ok) return {};
  return {
    title: r.value.nombre,
    description: r.value.descripcion,
    alternates: { canonical: `/comparsas/${slug}` },
    openGraph: { title: r.value.nombre, description: r.value.descripcion, type: "article" },
  };
}

export default async function ComparsaPage({ params }: PageProps<"/comparsas/[slug]">) {
  const inicio = iniciarMedicion();
  const { slug } = await params;
  const r = await casos().comparsas.obtener.ejecutar(slug);
  if (!r.ok) notFound();
  const c = r.value;

  return (
    <Container className="py-12">
      <article data-contenido-principal className="mx-auto max-w-3xl">
        <p className="mb-6">
          <Link href="/comparsas">← {t.volver}</Link>
        </p>
        <div aria-hidden="true" className="mb-6 h-3 rounded-full" style={{ background: c.color }} />
        <PageHeader
          antetitulo={`SSG · ${t.fundada(c.fundacion)}`}
          titulo={c.nombre}
          descripcion={c.descripcion}
        />
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            [t.director, c.director],
            [t.integrantes, String(c.integrantes)],
            [t.motivo, c.motivo],
          ].map(([dt, dd]) => (
            <div key={dt} className="border-border bg-surface rounded-lg border p-4">
              <dt className="text-fg-muted text-sm">{dt}</dt>
              <dd className="mt-1 text-lg font-semibold">{dd}</dd>
            </div>
          ))}
        </dl>
        <p className="text-fg-muted mt-6">{t.trayectoria(c.anios)}</p>
        <div className="mt-8">
          <ButtonLink href={`/en-vivo?comparsa=${c.slug}`} variante="secundario">
            {t.enVivo}
          </ButtonLink>
        </div>
      </article>
      <RenderProbe ruta={`/comparsas/${slug}`} patron="SSG" inicioRender={inicio} />
    </Container>
  );
}
