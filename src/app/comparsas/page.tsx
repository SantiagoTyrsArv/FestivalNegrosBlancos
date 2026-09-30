import type { Metadata } from "next";
import Link from "next/link";
import { casos } from "@/composition-root";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Card } from "@/shared/ui/components/Card";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

export const dynamic = "force-static";

const t = es.comparsas;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/comparsas" },
};

export default async function ComparsasPage() {
  const inicio = iniciarMedicion();
  const comparsas = await casos().comparsas.listar.ejecutar();
  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <PageHeader antetitulo="SSG" titulo={t.titulo} descripcion={t.descripcion} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparsas.map((c) => (
            <li key={c.slug}>
              <Card
                as="article"
                interactiva
                className="relative flex h-full flex-col gap-2 overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: c.color }}
                />
                <p className="text-fg-muted font-mono text-xs">{t.fundada(c.fundacion)}</p>
                <h2 className="text-xl font-bold">
                  {/* El enlace cubre la tarjeta completa mediante ::after. */}
                  <Link
                    href={`/comparsas/${c.slug}`}
                    className="text-fg no-underline after:absolute after:inset-0"
                  >
                    {c.nombre}
                  </Link>
                </h2>
                <p className="text-fg-muted text-sm">{c.descripcion}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <RenderProbe ruta="/comparsas" patron="SSG" inicioRender={inicio} />
    </Container>
  );
}
