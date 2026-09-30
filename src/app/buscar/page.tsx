import type { Metadata } from "next";
import Link from "next/link";
import { casos } from "@/composition-root";
import { EventoCard } from "@/modules/eventos/ui/EventoCard";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { Alert } from "@/shared/ui/components/Alert";
import { Button } from "@/shared/ui/components/Button";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { Field } from "@/shared/ui/components/Field";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/**
 * SSR: el resultado depende de ?q=, así que se calcula en cada petición.
 * noindex: las páginas de búsqueda no deben indexarse. El formulario es un
 * GET normal: funciona sin JavaScript.
 */
export const dynamic = "force-dynamic";

const t = es.buscar;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: true } };

export default async function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  const inicio = iniciarMedicion();
  const valor = (await searchParams)["q"];
  const q = (typeof valor === "string" ? valor : "").slice(0, 60);
  const resultado = q ? await casos().eventos.buscar.ejecutar(q) : null;

  return (
    <Container className="py-12">
      <div data-contenido-principal>
        <PageHeader antetitulo="SSR · searchParams" titulo={t.titulo} descripcion={t.descripcion} />
        <form role="search" action="/buscar" className="mb-10 flex flex-wrap items-end gap-3">
          <Field
            etiqueta={t.etiqueta}
            name="q"
            type="search"
            defaultValue={q}
            className="min-w-64 flex-1"
          />
          <Button type="submit">{t.boton}</Button>
        </form>

        {resultado && !resultado.ok && resultado.error.tipo === "CONSULTA_INVALIDA" && (
          <Alert tono="aviso" titulo={t.consultaCorta} />
        )}
        {/* Degradación controlada: la upstream falló, se informa sin exponer detalles internos. */}
        {resultado && !resultado.ok && resultado.error.tipo !== "CONSULTA_INVALIDA" && (
          <Alert tono="peligro" rol="alert" titulo={es.errores.upstream}>
            {es.errores.upstreamDetalle}
          </Alert>
        )}
        {resultado?.ok && (
          <div aria-live="polite">
            <h2 className="mb-6 text-2xl font-bold">{t.resultadosPara(q)}</h2>
            {resultado.value.eventos.length + resultado.value.artistas.length === 0 ? (
              <EmptyState titulo={t.sinResultados(q)} />
            ) : (
              <div className="flex flex-col gap-10">
                {resultado.value.artistas.length > 0 && (
                  <section aria-labelledby="res-artistas">
                    <h3 id="res-artistas" className="mb-3 text-xl font-bold">
                      {t.artistas}
                    </h3>
                    <ul className="flex flex-wrap gap-3">
                      {resultado.value.artistas.map((a) => (
                        <li key={a.slug}>
                          <Link
                            href={`/artistas/${a.slug}`}
                            className="border-border bg-surface inline-block rounded-full border px-4 py-2"
                          >
                            {a.nombre} · <span className="text-fg-muted">{a.genero}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {resultado.value.eventos.length > 0 && (
                  <section aria-labelledby="res-eventos">
                    <h3 id="res-eventos" className="mb-3 text-xl font-bold">
                      {t.eventos}
                    </h3>
                    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {resultado.value.eventos.map((e) => (
                        <li key={e.id}>
                          <EventoCard evento={e} />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <RenderProbe ruta="/buscar" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
