import type { DiaProgramacionDTO } from "../application/casos-de-uso";
import { es } from "@/shared/i18n/es";
import { fechaDeDia, formatearFechaLarga } from "@/shared/lib/formato";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { ButtonLink } from "@/shared/ui/components/Button";
import { EventoCard } from "./EventoCard";

export function ProgramacionDias({ dias }: { dias: DiaProgramacionDTO[] }) {
  if (dias.length === 0 || dias.every((d) => d.eventos.length === 0)) {
    return <EmptyState titulo={es.programacion.vacio} />;
  }
  return (
    <div className="flex flex-col gap-12">
      {dias.map((d) => (
        <section key={d.dia} aria-labelledby={`dia-${d.dia}`}>
          <h2 id={`dia-${d.dia}`} className="mb-5 text-3xl font-extrabold capitalize">
            {formatearFechaLarga(fechaDeDia(d.dia))}
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {d.eventos.map((e) => (
              <li key={e.id}>
                <EventoCard
                  evento={e}
                  accion={
                    !e.cancelado && (
                      <ButtonLink
                        href={`/boletas/${e.id}`}
                        tamano="sm"
                        variante="secundario"
                        className="self-start"
                      >
                        {es.eventos.comprar}
                      </ButtonLink>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
