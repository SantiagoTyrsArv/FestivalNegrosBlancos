import Link from "next/link";
import { es } from "@/shared/i18n/es";
import { formatearHora } from "@/shared/lib/formato";
import { Badge, type TonoBadge } from "@/shared/ui/components/Badge";
import { Card } from "@/shared/ui/components/Card";
import type { EventoDTO } from "../application/dto";
import type { TipoEvento } from "../domain/evento";

const tonoPorTipo: Record<TipoEvento, TonoBadge> = {
  concierto: "primario",
  desfile: "aviso",
  ceremonia: "info",
  taller: "exito",
};

export function EtiquetaTipo({ tipo }: { tipo: TipoEvento }) {
  return <Badge tono={tonoPorTipo[tipo]}>{es.tiposEvento[tipo]}</Badge>;
}

/** Tarjeta de evento (Server Component, sin JS en el cliente). */
export function EventoCard({ evento, accion }: { evento: EventoDTO; accion?: React.ReactNode }) {
  const inicio = new Date(evento.inicio);
  const fin = new Date(evento.fin);
  return (
    <Card as="article" className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaTipo tipo={evento.tipo} />
        {evento.cancelado && <Badge tono="peligro">{es.eventos.cancelado}</Badge>}
        <time dateTime={evento.inicio} className="text-fg-muted ml-auto font-mono text-sm">
          {es.eventos.horario(formatearHora(inicio), formatearHora(fin))}
        </time>
      </div>
      <h3 className={`text-xl font-bold ${evento.cancelado ? "line-through opacity-70" : ""}`}>
        {evento.nombre}
      </h3>
      <p className="text-fg-muted text-sm">{evento.descripcion}</p>
      <dl className="mt-auto grid gap-1 text-sm">
        <div className="flex gap-2">
          <dt className="font-semibold">{es.eventos.escenario}:</dt>
          <dd>{evento.escenario.nombre}</dd>
        </div>
        {evento.artistas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold">{es.eventos.artistas}:</dt>
            <dd className="flex flex-wrap gap-x-2">
              {evento.artistas.map((a) => (
                <Link key={a.slug} href={`/artistas/${a.slug}`}>
                  {a.nombre}
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>
      {accion}
    </Card>
  );
}
