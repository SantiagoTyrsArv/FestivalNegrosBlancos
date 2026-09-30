import type { Metadata } from "next";
import { Alert } from "@/shared/ui/components/Alert";
import { Badge } from "@/shared/ui/components/Badge";
import { Button } from "@/shared/ui/components/Button";
import { Card } from "@/shared/ui/components/Card";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { Field } from "@/shared/ui/components/Field";
import { Container, PageHeader } from "@/shared/ui/components/PageHeader";
import { Skeleton } from "@/shared/ui/components/Skeleton";

/** Catálogo interno de componentes del design system (SSG). */
export const dynamic = "force-static";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const tokens = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "fg",
  "fg-muted",
  "primary",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <Container className="py-12">
      <PageHeader
        antetitulo="Interno"
        titulo="Design system"
        descripcion="Tokens y componentes propios. Todos los pares de color cumplen contraste AA en tema claro y oscuro."
      />
      <div data-contenido-principal className="flex flex-col gap-12">
        <Seccion titulo="Color">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {tokens.map((tk) => (
              <li key={tk} className="border-border overflow-hidden rounded-md border text-xs">
                <div className="h-14" style={{ background: `var(--${tk})` }} />
                <p className="px-2 py-1 font-mono">--{tk}</p>
              </li>
            ))}
          </ul>
        </Seccion>
        <Seccion titulo="Botones">
          <div className="flex flex-wrap gap-3">
            <Button>Primario</Button>
            <Button variante="secundario">Secundario</Button>
            <Button variante="fantasma">Fantasma</Button>
            <Button variante="peligro">Peligro</Button>
            <Button cargando>Cargando</Button>
            <Button disabled>Deshabilitado</Button>
          </div>
        </Seccion>
        <Seccion titulo="Insignias">
          <div className="flex flex-wrap gap-2">
            {(["neutro", "primario", "exito", "aviso", "peligro", "info"] as const).map((tono) => (
              <Badge key={tono} tono={tono}>
                {tono}
              </Badge>
            ))}
          </div>
        </Seccion>
        <Seccion titulo="Alertas">
          <Alert titulo="Información">Texto de apoyo.</Alert>
          <Alert tono="exito" titulo="Éxito" />
          <Alert tono="aviso" titulo="Aviso" />
          <Alert tono="peligro" titulo="Error" />
        </Seccion>
        <Seccion titulo="Formularios">
          <div className="grid max-w-xl gap-4">
            <Field
              etiqueta="Campo"
              placeholder="Escribe algo"
              ayuda="Texto de ayuda asociado con aria-describedby."
            />
            <Field etiqueta="Campo con error" error="Mensaje de error asociado al campo." />
          </div>
        </Seccion>
        <Seccion titulo="Tarjetas, vacío y carga">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>Tarjeta estándar</Card>
            <EmptyState titulo="Sin resultados" descripcion="Estado vacío." />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </Seccion>
      </div>
    </Container>
  );
}
