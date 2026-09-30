import type { Metadata } from "next";
import { PanelAgenda } from "@/modules/agenda/ui/PanelAgenda";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/**
 * CSR: shell estático idéntico para todos; la agenda privada la obtiene el
 * navegador de /api/v1/agenda con la cookie de sesión. Así la página no se
 * vuelve dinámica y los datos personales nunca quedan en una caché compartida.
 */
export const dynamic = "force-static";

const t = es.agenda;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default function MiAgendaPage() {
  const inicio = iniciarMedicion();
  return (
    <Container className="py-12">
      <PageHeader antetitulo="CSR · optimista" titulo={t.titulo} descripcion={t.descripcion} />
      <PanelAgenda />
      <RenderProbe ruta="/mi-agenda" patron="CSR" inicioRender={inicio} />
    </Container>
  );
}
