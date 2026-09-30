import { es } from "@/shared/i18n/es";
import { ButtonLink } from "@/shared/ui/components/Button";
import { Container } from "@/shared/ui/components/PageHeader";

export default function InicioPage() {
  return (
    <Container className="py-20">
      <h1 className="text-5xl font-extrabold">{es.sitio.nombre}</h1>
      <p className="text-fg-muted mt-4 max-w-xl text-lg">{es.sitio.lema}</p>
      <div className="mt-8">
        <ButtonLink href="/programacion">{es.nav.programacion}</ButtonLink>
      </div>
    </Container>
  );
}
