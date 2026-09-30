import { es } from "@/shared/i18n/es";
import { formatearDinero, formatearHora } from "@/shared/lib/formato";
import { Badge, type TonoBadge } from "@/shared/ui/components/Badge";
import { ButtonLink } from "@/shared/ui/components/Button";
import type { SesionDTO } from "../application/casos-de-uso";
import type { Disponibilidad } from "../domain/boleteria";

const t = es.boletas;

const tono: Record<Disponibilidad, TonoBadge> = {
  disponible: "exito",
  ultimas: "aviso",
  agotado: "peligro",
};

export function BadgeDisponibilidad({ valor }: { valor: Disponibilidad }) {
  return <Badge tono={tono[valor]}>{t.disponibilidad[valor]}</Badge>;
}

export const precio = (s: Pick<SesionDTO, "precioCentavos" | "moneda">) =>
  s.precioCentavos === 0 ? t.gratis : formatearDinero(s.precioCentavos, s.moneda);

/** Lista de localidades con cupo y enlace de compra (Server Component). */
export function ListaSesiones({
  sesiones,
  consultadoEn,
}: {
  sesiones: SesionDTO[];
  consultadoEn?: Date;
}) {
  if (sesiones.length === 0) return <p className="text-fg-muted">{t.sinSesiones}</p>;
  return (
    <div>
      <ul className="flex flex-col gap-3">
        {sesiones.map((s) => (
          <li
            key={s.id}
            className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-lg border p-4"
          >
            <div className="min-w-40 flex-1">
              <p className="font-semibold">{s.nombre}</p>
              <p className="text-fg-muted text-sm">
                {precio(s)} · {t.disponibles(s.disponible)}
              </p>
            </div>
            <BadgeDisponibilidad valor={s.disponibilidad} />
            {s.disponibilidad !== "agotado" && (
              <ButtonLink href={`/checkout?sesion=${s.id}`} tamano="sm">
                {t.comprar}
              </ButtonLink>
            )}
          </li>
        ))}
      </ul>
      {consultadoEn && (
        <p className="text-fg-muted mt-2 font-mono text-xs">
          {t.consultadoEn(formatearHora(consultadoEn))}
        </p>
      )}
    </div>
  );
}
