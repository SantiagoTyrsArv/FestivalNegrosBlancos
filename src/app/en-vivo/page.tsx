import type { Metadata } from "next";
import { Suspense } from "react";
import { PanelEnVivo } from "@/modules/comparsas/ui/PanelEnVivo";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { Skeleton } from "@/shared/ui/components/Skeleton";

/**
 * CSR: el servidor solo entrega un shell estático; los datos los pide el
 * navegador a /api/v1/en-vivo cada 5 s. No necesita SEO y cambia sin parar.
 */
export const dynamic = "force-static";

const t = es.enVivo;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  robots: { index: false, follow: true },
};

export default function EnVivoPage() {
  const inicio = iniciarMedicion();
  return (
    <Container className="py-12">
      <PageHeader antetitulo="CSR · polling 5 s" titulo={t.titulo} descripcion={t.descripcion} />
      <Alert tono="aviso" titulo={t.simulacion} className="mb-6" />
      {/* useSearchParams en una página estática requiere un límite de Suspense. */}
      <Suspense fallback={<Skeleton className="aspect-[5/3] w-full" />}>
        <PanelEnVivo />
      </Suspense>
      <RenderProbe ruta="/en-vivo" patron="CSR" inicioRender={inicio} />
    </Container>
  );
}
