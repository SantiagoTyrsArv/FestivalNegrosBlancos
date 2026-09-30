import { es } from "@/shared/i18n/es";
import { SkeletonTarjetas } from "@/shared/ui/components/Skeleton";
import { Container } from "@/shared/ui/components/PageHeader";

export default function CargandoBoletas() {
  return (
    <Container className="py-12">
      <SkeletonTarjetas cantidad={6} etiqueta={es.comun.cargando} />
    </Container>
  );
}
