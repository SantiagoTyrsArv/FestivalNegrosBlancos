import { es } from "@/shared/i18n/es";
import { ButtonLink } from "@/shared/ui/components/Button";
import { Container } from "@/shared/ui/components/PageHeader";

export default function NoEncontrado() {
  return (
    <Container className="py-24 text-center">
      <p className="text-primary font-mono text-sm font-semibold">404</p>
      <h1 className="mt-2 text-4xl font-extrabold">{es.comun.noEncontrado}</h1>
      <p className="text-fg-muted mx-auto mt-4 max-w-md">{es.comun.noEncontradoDetalle}</p>
      <ButtonLink href="/" className="mt-8">
        {es.comun.irInicio}
      </ButtonLink>
    </Container>
  );
}
