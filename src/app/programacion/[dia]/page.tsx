import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { programacionCacheada } from "@/app/_lib/datos-cacheados";
import { eventoJsonLd } from "@/modules/eventos/ui/json-ld";
import { DiasNav } from "@/modules/eventos/ui/DiasNav";
import { ProgramacionDias } from "@/modules/eventos/ui/ProgramacionDias";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { FESTIVAL } from "@/shared/config/constants";
import { es } from "@/shared/i18n/es";
import { fechaDeDia, formatearFechaLarga } from "@/shared/lib/formato";
import { JsonLd } from "@/shared/ui/components/JsonLd";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/** ISR por día: los 5 días se pre-generan en el build y se regeneran cada 60 s o a demanda. */
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return FESTIVAL.dias.map((dia) => ({ dia }));
}

export async function generateMetadata({
  params,
}: PageProps<"/programacion/[dia]">): Promise<Metadata> {
  const { dia } = await params;
  const titulo = es.programacion.tituloDia(formatearFechaLarga(fechaDeDia(dia)));
  return { title: titulo, alternates: { canonical: `/programacion/${dia}` } };
}

export default async function ProgramacionDiaPage({ params }: PageProps<"/programacion/[dia]">) {
  const inicio = iniciarMedicion();
  const { dia } = await params;
  const r = await programacionCacheada(dia);
  if (!r.ok) notFound();
  const eventos = r.value.flatMap((d) => d.eventos);

  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <PageHeader
          antetitulo="ISR · revalidate 60 s"
          titulo={es.programacion.tituloDia(formatearFechaLarga(fechaDeDia(dia)))}
        />
        <DiasNav activo={dia} />
        <ProgramacionDias dias={r.value} />
      </div>
      <JsonLd datos={eventos.map(eventoJsonLd)} />
      <RenderProbe
        ruta={`/programacion/${dia}`}
        patron="ISR"
        revalidar={revalidate}
        inicioRender={inicio}
      />
    </Container>
  );
}
