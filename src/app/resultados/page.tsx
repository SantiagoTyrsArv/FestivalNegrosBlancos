import type { Metadata } from "next";
import { resultadosCacheados } from "@/app/_lib/datos-cacheados";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/** ISR corto (30 s) + on-demand: publicar desde /admin invalida la etiqueta "resultados". */
export const revalidate = 30;

const t = es.resultados;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  alternates: { canonical: "/resultados" },
};

const puntaje = (centesimas: number) =>
  (centesimas / 100).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function ResultadosPage() {
  const inicio = iniciarMedicion();
  const tablas = await resultadosCacheados();

  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <PageHeader
          antetitulo="ISR · revalidate 30 s + on-demand"
          titulo={t.titulo}
          descripcion={t.descripcion}
        />
        {tablas.length === 0 ? (
          <EmptyState titulo={t.vacio} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-2">
            {tablas.map((tabla) => (
              <section key={tabla.categoria} aria-labelledby={`cat-${tabla.categoria}`}>
                <h2 id={`cat-${tabla.categoria}`} className="mb-4 text-2xl font-bold">
                  {tabla.categoria}
                </h2>
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">{`${t.titulo}: ${tabla.categoria}`}</caption>
                  <thead>
                    <tr className="border-border text-fg-muted border-b text-sm">
                      <th scope="col" className="py-2 pr-3">
                        {t.puesto}
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        {t.comparsa}
                      </th>
                      <th scope="col" className="py-2 text-right">
                        {t.puntaje}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.posiciones.map((p) => (
                      <tr key={p.id} className="border-border border-b">
                        <td className="py-3 pr-3 font-mono text-lg font-bold">{p.puesto}</td>
                        <th scope="row" className="py-3 pr-3 font-semibold">
                          <span
                            aria-hidden="true"
                            className="mr-2 inline-block size-3 rounded-full"
                            style={{ background: p.comparsa.color }}
                          />
                          {p.comparsa.nombre}
                        </th>
                        <td className="py-3 text-right font-mono">
                          {puntaje(p.puntajeCentesimas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}
      </div>
      <RenderProbe ruta="/resultados" patron="ISR" revalidar={revalidate} inicioRender={inicio} />
    </Container>
  );
}
