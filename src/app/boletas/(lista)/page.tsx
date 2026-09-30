import type { Metadata } from "next";
import Link from "next/link";
import { casos } from "@/composition-root";
import { BadgeDisponibilidad } from "@/modules/boleteria/ui/Sesiones";
import { EtiquetaTipo } from "@/modules/eventos/ui/EventoCard";
import { obtenerSesion } from "@/modules/usuarios/infrastructure/sesion";
import { BarraSesion } from "@/modules/usuarios/ui/BarraSesion";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { fechaDeDia, formatearFechaLarga, formatearHora } from "@/shared/lib/formato";
import { Card } from "@/shared/ui/components/Card";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/** SSR: el cupo cambia con cada compra, así que se calcula en cada petición y nunca se cachea. */
export const dynamic = "force-dynamic";

const t = es.boletas;

export const metadata: Metadata = { title: t.titulo, description: t.descripcion };

export default async function BoletasPage() {
  const inicio = iniciarMedicion();
  const [sesion, pagina] = await Promise.all([
    obtenerSesion(),
    casos().eventos.listarPaginados.ejecutar({ cursor: null, limite: 50 }),
  ]);
  const eventos = pagina.items.filter((e) => !e.cancelado);
  const cupos = await Promise.all(
    eventos.map((e) => casos().boleteria.consultarCupos.ejecutar(e.id))
  );

  const filas = eventos
    .map((e, i) => ({ evento: e, sesiones: cupos[i] ?? [] }))
    .filter((f) => f.sesiones.length > 0)
    .sort((a, b) => a.evento.inicio.localeCompare(b.evento.inicio));

  return (
    <Container className="py-12">
      <div data-contenido-principal>
        {sesion && <BarraSesion sesion={sesion} />}
        <PageHeader antetitulo="SSR · sin caché" titulo={t.titulo} descripcion={t.descripcion} />
        <ul className="grid gap-4 md:grid-cols-2">
          {filas.map(({ evento, sesiones }) => {
            const disponible = sesiones.reduce((acc, s) => acc + s.disponible, 0);
            const peor = sesiones.every((s) => s.disponibilidad === "agotado")
              ? "agotado"
              : sesiones.some((s) => s.disponibilidad !== "disponible")
                ? "ultimas"
                : "disponible";
            return (
              <li key={evento.id}>
                <Card as="article" className="flex h-full flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <EtiquetaTipo tipo={evento.tipo} />
                    <BadgeDisponibilidad valor={peor} />
                  </div>
                  <h2 className="text-xl font-bold">{evento.nombre}</h2>
                  <p className="text-fg-muted text-sm capitalize">
                    {formatearFechaLarga(fechaDeDia(evento.dia))} ·{" "}
                    {formatearHora(new Date(evento.inicio))} · {evento.escenario.nombre}
                  </p>
                  <p className="text-sm">{t.disponibles(disponible)}</p>
                  <Link href={`/boletas/${evento.id}`} className="mt-auto font-semibold">
                    {t.verSesiones} →
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
      <RenderProbe ruta="/boletas" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
