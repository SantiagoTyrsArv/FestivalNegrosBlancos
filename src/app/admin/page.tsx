import type { Metadata } from "next";
import { casos } from "@/composition-root";
import { requerirAdmin } from "@/modules/usuarios/infrastructure/sesion";
import { BarraSesion } from "@/modules/usuarios/ui/BarraSesion";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Card } from "@/shared/ui/components/Card";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { FormularioEvento, FormularioPublicar } from "./FormulariosAdmin";

/** SSR protegido: solo rol admin (redirección en el servidor). */
export const dynamic = "force-dynamic";

const t = es.admin;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default async function AdminPage() {
  const inicio = iniciarMedicion();
  const sesion = await requerirAdmin("/admin");
  const [eventos, resultados] = await Promise.all([
    casos().eventos.listarPaginados.ejecutar({ cursor: null, limite: 50 }),
    casos().resultados.listarAdmin.ejecutar(),
  ]);
  const pendientes = resultados.filter((r) => !r.publicado);

  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <BarraSesion sesion={sesion} />
        <PageHeader antetitulo="SSR · solo admin" titulo={t.titulo} descripcion={t.descripcion} />
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <section aria-labelledby="eventos-admin">
            <h2 id="eventos-admin" className="mb-4 text-2xl font-bold">
              {t.eventos}
            </h2>
            <ul className="flex flex-col gap-3">
              {eventos.items.map((e) => (
                <li key={e.id}>
                  <details className="border-border bg-surface rounded-lg border p-4">
                    <summary className="cursor-pointer font-semibold">
                      {e.nombre} <span className="text-fg-muted font-mono text-xs">({e.dia})</span>
                    </summary>
                    <div className="mt-4">
                      <FormularioEvento evento={e} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="resultados-admin">
            <h2 id="resultados-admin" className="mb-4 text-2xl font-bold">
              {t.resultados}
            </h2>
            {pendientes.length === 0 ? (
              <EmptyState titulo={t.sinPendientes} />
            ) : (
              <ul className="flex flex-col gap-3">
                {pendientes.map((r) => (
                  <li key={r.id}>
                    <Card>
                      <FormularioPublicar resultado={r} />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <RenderProbe ruta="/admin" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
