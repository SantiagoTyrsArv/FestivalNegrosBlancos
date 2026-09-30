import type { Metadata } from "next";
import Link from "next/link";
import { cambiarModoCaosAction } from "@/app/admin/acciones";
import { casos } from "@/composition-root";
import { obtenerSesion } from "@/modules/usuarios/infrastructure/sesion";
import { MODOS_CAOS } from "@/observability/caos";
import { iniciarMedicion } from "@/observability/medir";
import { RenderProbe } from "@/observability/ui/RenderProbe";
import { TableroObservatorio } from "@/observability/ui/TableroObservatorio";
import { es } from "@/shared/i18n/es";
import { Button } from "@/shared/ui/components/Button";
import { Card } from "@/shared/ui/components/Card";
import { SelectField } from "@/shared/ui/components/Field";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";

/** SSR (lee la sesión para mostrar el control del Modo Caos) + tablero CSR con polling. */
export const dynamic = "force-dynamic";

const t = es.observatorio;

export const metadata: Metadata = {
  title: t.titulo,
  description: t.descripcion,
  robots: { index: false },
};

export default async function ObservatorioPage() {
  const inicio = iniciarMedicion();
  const [sesion, modo] = await Promise.all([obtenerSesion(), casos().caos.modoActual()]);
  const esAdmin = sesion?.rol === "admin";

  return (
    <Container className="py-12">
      <PageHeader antetitulo="Observatorio" titulo={t.titulo} descripcion={t.descripcion}>
        <Link href="/observatorio/costos">{t.costos} →</Link>
      </PageHeader>

      <div className="mb-10 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <h2 className="text-xl font-bold">{t.comoFunciona}</h2>
          <ul className="text-fg-muted mt-3 flex list-disc flex-col gap-2 pl-5 text-sm">
            {t.explicacion.map((p) => (
              <li key={p.slice(0, 20)}>{p}</li>
            ))}
          </ul>
        </Card>
        <Card className={modo !== "ninguno" ? "border-danger" : ""}>
          <h2 className="text-xl font-bold">{t.caosTitulo}</h2>
          <p className="text-fg-muted mt-2 text-sm">{t.caosDesc}</p>
          <p className="mt-3 font-semibold" data-testid="modo-caos">
            {t.caosActual(t.modos[modo])}
          </p>
          {esAdmin ? (
            <form action={cambiarModoCaosAction} className="mt-4 flex flex-wrap items-end gap-3">
              <SelectField
                etiqueta={t.caosTitulo}
                name="modo"
                defaultValue={modo}
                className="min-w-48 flex-1"
              >
                {MODOS_CAOS.map((m) => (
                  <option key={m} value={m}>
                    {t.modos[m]}
                  </option>
                ))}
              </SelectField>
              <Button type="submit">{t.aplicar}</Button>
            </form>
          ) : (
            <p className="text-fg-muted mt-3 text-sm">
              {t.caosSoloAdmin} <Link href="/login?siguiente=/observatorio">{es.nav.ingresar}</Link>
            </p>
          )}
        </Card>
      </div>

      <TableroObservatorio />
      <RenderProbe ruta="/observatorio" patron="SSR" inicioRender={inicio} />
    </Container>
  );
}
