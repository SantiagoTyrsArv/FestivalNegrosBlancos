import type { Metadata } from "next";
import Link from "next/link";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { SimuladorCostos } from "@/observability/ui/SimuladorCostos";
import { es } from "@/shared/i18n/es";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/** Shell estático + calculadora que corre íntegra en el navegador (no necesita servidor). */
export const dynamic = "force-static";

const t = es.costos;

export const metadata: Metadata = { title: t.titulo, description: t.descripcion };

export default function CostosPage() {
  const inicio = iniciarMedicion();
  return (
    <Container className="py-12">
      <p className="mb-4">
        <Link href="/observatorio">← {es.observatorio.titulo}</Link>
      </p>
      <PageHeader antetitulo="Estimaciones" titulo={t.titulo} descripcion={t.descripcion} />
      <SimuladorCostos />
      <RenderProbe ruta="/observatorio/costos" patron="CSR" inicioRender={inicio} />
    </Container>
  );
}
