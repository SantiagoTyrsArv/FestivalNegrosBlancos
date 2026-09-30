import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { casos } from "@/composition-root";
import { MAXIMO_POR_ORDEN } from "@/modules/boleteria/domain/boleteria";
import { BadgeDisponibilidad, precio } from "@/modules/boleteria/ui/Sesiones";
import { requerirSesion } from "@/modules/usuarios/infrastructure/sesion";
import { BarraSesion } from "@/modules/usuarios/ui/BarraSesion";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { es } from "@/shared/i18n/es";
import { formatearDinero } from "@/shared/lib/formato";
import { Card } from "@/shared/ui/components/Card";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { FormularioCompra } from "./FormularioCompra";

/** SSR con sesión obligatoria: sin sesión, el servidor redirige a /login antes de enviar HTML. */
export const dynamic = "force-dynamic";

const t = es.checkout;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const inicio = iniciarMedicion();
  const param = (await searchParams)["sesion"];
  const sesionId = typeof param === "string" && /^\d{1,9}$/.test(param) ? Number(param) : null;
  const usuario = await requerirSesion(`/checkout${sesionId ? `?sesion=${sesionId}` : ""}`);

  const sesion = sesionId ? await casos().boleteria.obtenerSesion.ejecutar(sesionId) : null;
  const [evento, boletas] = await Promise.all([
    sesion ? casos().eventos.obtener.ejecutar(sesion.eventoId) : null,
    casos().boleteria.boletasDeUsuario.ejecutar(usuario.id),
  ]);

  return (
    <Container className="py-12">
      <div data-contenido-principal className="mx-auto max-w-3xl">
        <BarraSesion sesion={usuario} />
        <PageHeader
          antetitulo="SSR · requiere sesión"
          titulo={t.titulo}
          descripcion={t.descripcion}
        />
        {!sesion || !evento?.ok ? (
          <EmptyState titulo={t.sinSesion} accion={<Link href="/boletas">{es.nav.boletas}</Link>} />
        ) : (
          <Card className="flex flex-col gap-4">
            <div>
              <p className="text-fg-muted text-sm">{evento.value.nombre}</p>
              <h2 className="text-2xl font-bold">{sesion.nombre}</h2>
              <p className="mt-1 flex items-center gap-2">
                {precio(sesion)} · {es.boletas.disponibles(sesion.disponible)}
                <BadgeDisponibilidad valor={sesion.disponibilidad} />
              </p>
            </div>
            {sesion.disponibilidad !== "agotado" && (
              <FormularioCompra
                sesionId={sesion.id}
                eventoId={sesion.eventoId}
                precioCentavos={sesion.precioCentavos}
                moneda={sesion.moneda}
                maximo={Math.min(MAXIMO_POR_ORDEN, sesion.disponible)}
                idempotencyKey={randomUUID()}
              />
            )}
          </Card>
        )}

        {boletas.length > 0 && (
          <section aria-labelledby="mis-boletas" className="mt-10">
            <h2 id="mis-boletas" className="mb-3 text-2xl font-bold">
              {es.boletas.misBoletas}
            </h2>
            <ul className="flex flex-col gap-2">
              {boletas.map((b) => (
                <li
                  key={b.codigo}
                  className="border-border flex justify-between rounded-md border px-4 py-2 font-mono text-sm"
                >
                  <span>{b.codigo}</span>
                  <span>
                    ×{b.cantidad} · {formatearDinero(b.totalCentavos, b.moneda)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <RenderProbe ruta="/checkout" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
