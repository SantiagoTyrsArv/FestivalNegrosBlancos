import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eventoCacheado } from "@/app/_lib/datos-cacheados";
import { casos } from "@/composition-root";
import { ListaSesiones } from "@/modules/boleteria/ui/Sesiones";
import { EventoCard } from "@/modules/eventos/ui/EventoCard";
import { eventoJsonLd } from "@/modules/eventos/ui/json-ld";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { JsonLd } from "@/shared/ui/components/JsonLd";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { Skeleton } from "@/shared/ui/components/Skeleton";

/**
 * HÍBRIDO (streaming): el "shell" del evento se obtiene del Data Cache
 * (unstable_cache con tag "programacion") y se envía de inmediato; el cupo en
 * tiempo real se calcula en esta petición y llega después por streaming dentro
 * de <Suspense>. Ver docs/adr/0004-sin-cache-components.md sobre por qué no usamos cacheComponents/PPR.
 */
export const dynamic = "force-dynamic";

const t = es.boletas;

const idValido = (valor: string) => (/^\d{1,9}$/.test(valor) ? Number(valor) : null);

export async function generateMetadata({
  params,
}: PageProps<"/boletas/[eventoId]">): Promise<Metadata> {
  const id = idValido((await params).eventoId);
  if (id === null) return {};
  const r = await eventoCacheado(id);
  return r.ok ? { title: `${t.titulo}: ${r.value.nombre}`, description: r.value.descripcion } : {};
}

async function CupoEnVivo({ eventoId }: { eventoId: number }) {
  await connection(); // Garantiza que esta parte se calcula en cada petición.
  const sesiones = await casos().boleteria.consultarCupos.ejecutar(eventoId);
  return <ListaSesiones sesiones={sesiones} consultadoEn={new Date()} />;
}

function EsqueletoCupo() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="text-fg-muted text-sm">{t.cargandoCupo}</span>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export default async function EventoBoletasPage({ params }: PageProps<"/boletas/[eventoId]">) {
  const inicio = iniciarMedicion();
  const id = idValido((await params).eventoId);
  if (id === null) notFound();
  const r = await eventoCacheado(id);
  if (!r.ok) notFound();
  const evento = r.value;

  return (
    <Container className="py-12">
      <div data-contenido-principal className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <PageHeader antetitulo="Híbrido · shell cacheado + streaming" titulo={evento.nombre} />
          <EventoCard evento={evento} />
          <Alert className="mt-6" titulo={es.comun.patron}>
            {t.shellNota}
          </Alert>
        </div>
        <section aria-labelledby="cupo">
          <h2 id="cupo" className="mb-4 text-2xl font-bold">
            {t.cupoEnVivo}
          </h2>
          <Suspense fallback={<EsqueletoCupo />}>
            <CupoEnVivo eventoId={evento.id} />
          </Suspense>
        </section>
      </div>
      <JsonLd datos={eventoJsonLd(evento)} />
      <RenderProbe ruta={`/boletas/${evento.id}`} patron="HIBRIDO" inicioRender={inicio} />
    </Container>
  );
}
