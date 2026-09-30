import type { Metadata } from "next";
import { RECORRIDO } from "@/modules/comparsas/domain/recorrido";
import { MapaRecorrido } from "@/modules/comparsas/ui/MapaRecorrido";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

export const dynamic = "force-static";

const t = es.recorrido;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/recorrido" },
};

export default function RecorridoPage() {
  const inicio = iniciarMedicion();
  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <PageHeader antetitulo="SSG" titulo={t.titulo} descripcion={t.descripcion} />
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <figure>
            <MapaRecorrido etiqueta={t.mapaEtiqueta} />
            <figcaption className="text-fg-muted mt-2 text-sm">{t.leyenda}</figcaption>
          </figure>
          <section aria-labelledby="hitos">
            <h2 id="hitos" className="mb-4 text-2xl font-bold">
              {t.hitos}
            </h2>
            <ol className="flex flex-col gap-3">
              {RECORRIDO.map((h, i) => (
                <li key={h.nombre} className="flex items-center gap-3">
                  <span className="border-fg flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-bold">
                    {i + 1}
                  </span>
                  {h.nombre}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      <RenderProbe ruta="/recorrido" patron="SSG" inicioRender={inicio} />
    </Container>
  );
}
