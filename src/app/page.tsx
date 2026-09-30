import Link from "next/link";
import { casos } from "@/composition-root";
import { EventoCard } from "@/modules/eventos/ui/EventoCard";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { ButtonLink } from "@/shared/ui/components/Button";
import { Card } from "@/shared/ui/components/Card";
import { Container } from "@/shared/ui/components/PageHeader";

/**
 * SSG: la landing se genera una única vez en `next build`. Consulta el caso
 * de uso directamente (sin unstable_cache) para no heredar ninguna
 * revalidación: su contenido solo cambia con un nuevo despliegue.
 */
export const dynamic = "force-static";

const t = es.inicio;

export default async function InicioPage() {
  const inicio = iniciarMedicion();
  const programacion = await casos().eventos.listarProgramacion.ejecutar();
  const destacados = programacion.ok
    ? programacion.value
        .flatMap((d) => d.eventos)
        .filter((e) => e.tipo === "concierto" && !e.cancelado)
        .slice(0, 3)
    : [];

  return (
    <div data-contenido-principal>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 grid grid-cols-2">
          <div className="bg-[hsl(20_12%_5%)]" />
          <div className="bg-[hsl(40_33%_98%)]" />
        </div>
        <div aria-hidden="true" className="confeti absolute inset-0 -z-10 opacity-60" />
        <Container className="py-20 sm:py-28">
          <div className="bg-surface/95 border-border max-w-2xl rounded-xl border p-8 shadow-lg sm:p-10">
            <p className="text-primary font-mono text-xs font-semibold tracking-widest uppercase">
              {t.antetitulo}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">{t.titulo}</h1>
            <p className="text-fg-muted mt-5 text-lg">{t.entradilla}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/programacion" tamano="lg">
                {t.ctaProgramacion}
              </ButtonLink>
              <ButtonLink href="/boletas" tamano="lg" variante="secundario">
                {t.ctaBoletas}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-4 py-12 sm:grid-cols-2">
        <div className="rounded-lg bg-[hsl(20_12%_5%)] p-5 text-[hsl(40_33%_98%)] shadow-sm">
          <h2 className="text-2xl font-extrabold">{t.diaNegros}</h2>
          <p className="mt-2">{t.diaNegrosTexto}</p>
        </div>
        <Card>
          <h2 className="text-2xl font-extrabold">{t.diaBlancos}</h2>
          <p className="text-fg-muted mt-2">{t.diaBlancosTexto}</p>
        </Card>
      </Container>

      {destacados.length > 0 && (
        <Container className="py-8">
          <h2 className="text-3xl font-extrabold">{t.destacados}</h2>
          <p className="text-fg-muted mt-2 text-sm">{t.destacadosNota}</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {destacados.map((e) => (
              <li key={e.id}>
                <EventoCard evento={e} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="py-12">
        <h2 className="text-3xl font-extrabold">{t.comoEsta}</h2>
        <p className="text-fg-muted mt-2 max-w-2xl">{t.comoEstaTexto}</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(t.patrones).map((p) => (
            <li key={p.titulo}>
              <Card className="h-full">
                <p className="text-primary font-mono text-lg font-bold">{p.titulo}</p>
                <p className="text-fg-muted mt-2 text-sm">{p.texto}</p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href="/observatorio">{t.verObservatorio}</Link>
        </p>
      </Container>

      <RenderProbe ruta="/" patron="SSG" inicioRender={inicio} />
    </div>
  );
}
