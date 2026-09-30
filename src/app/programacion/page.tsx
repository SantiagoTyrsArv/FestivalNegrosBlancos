import type { Metadata } from "next";
import { programacionCacheada } from "@/app/_lib/datos-cacheados";
import { DiasNav } from "@/modules/eventos/ui/DiasNav";
import { ProgramacionDias } from "@/modules/eventos/ui/ProgramacionDias";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/**
 * ISR: HTML estático que Next regenera en segundo plano como máximo cada 60 s
 * (stale-while-revalidate) o al instante con revalidateTag("programacion").
 * El valor debe ser un literal analizable estáticamente (= REVALIDACION.programacion).
 */
export const revalidate = 60;

const t = es.programacion;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/programacion" },
};

export default async function ProgramacionPage() {
  const inicio = iniciarMedicion();
  // Si la upstream falla, programacionCacheada lanza: en una regeneración ISR
  // Next conserva la versión anterior; sin versión previa se muestra error.tsx.
  const r = await programacionCacheada();
  const dias = r.ok ? r.value : [];

  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <PageHeader
          antetitulo="ISR · revalidate 60 s"
          titulo={t.titulo}
          descripcion={t.descripcion}
        />
        <DiasNav />
        <ProgramacionDias dias={dias} />
      </div>
      <RenderProbe ruta="/programacion" patron="ISR" revalidar={revalidate} inicioRender={inicio} />
    </Container>
  );
}
