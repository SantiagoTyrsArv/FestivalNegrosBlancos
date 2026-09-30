"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { EventoDTO } from "@/modules/eventos/application/dto";
import { es } from "@/shared/i18n/es";
import { fechaDeDia, formatearFechaLarga, formatearHora } from "@/shared/lib/formato";
import { enviarJson, obtenerJson, type ErrorHttp } from "@/shared/lib/http-cliente";
import { Alert } from "@/shared/ui/components/Alert";
import { Badge } from "@/shared/ui/components/Badge";
import { Button, ButtonLink } from "@/shared/ui/components/Button";
import { EmptyState } from "@/shared/ui/components/EmptyState";
import { SkeletonTarjetas } from "@/shared/ui/components/Skeleton";
import type { AgendaDTO } from "../application/casos-de-uso";

const t = es.agenda;
const URL_AGENDA = "/api/v1/agenda";

const cuando = (e: EventoDTO) =>
  `${formatearFechaLarga(fechaDeDia(e.dia))} · ${formatearHora(new Date(e.inicio))}`;

export function PanelAgenda() {
  const agenda = useSWR<AgendaDTO, ErrorHttp>(URL_AGENDA, obtenerJson, {
    shouldRetryOnError: false,
  });
  const eventos = useSWR<{ datos: EventoDTO[] }, ErrorHttp>(
    "/api/v1/eventos?limite=50",
    obtenerJson
  );
  const [errorGuardar, setErrorGuardar] = useState(false);

  if (agenda.error?.status === 401) {
    return (
      <EmptyState
        titulo={t.requiereSesion}
        accion={<ButtonLink href="/login?siguiente=/mi-agenda">{es.nav.ingresar}</ButtonLink>}
      />
    );
  }
  if (agenda.error || eventos.error) {
    return (
      <Alert tono="peligro" rol="alert" titulo={t.errorCarga}>
        <Button
          className="mt-3"
          tamano="sm"
          variante="secundario"
          onClick={() => void Promise.all([agenda.mutate(), eventos.mutate()])}
        >
          {es.comun.reintentar}
        </Button>
      </Alert>
    );
  }
  if (!agenda.data || !eventos.data) return <SkeletonTarjetas cantidad={4} etiqueta={t.cargando} />;

  const actual = agenda.data;
  const enAgenda = new Set(actual.eventos.map((e) => e.id));
  const enConflicto = new Set(actual.conflictos.flat());

  /**
   * Actualización optimista: la UI cambia al instante con `optimisticData`;
   * si la API falla, SWR restaura el estado anterior (`rollbackOnError`) y
   * avisamos al usuario. La respuesta del servidor (con conflictos
   * recalculados) reemplaza al dato optimista.
   */
  async function alternar(evento: EventoDTO) {
    setErrorGuardar(false);
    const quitar = enAgenda.has(evento.id);
    const optimista: AgendaDTO = {
      eventos: quitar
        ? actual.eventos.filter((e) => e.id !== evento.id)
        : [...actual.eventos, evento].sort((a, b) => a.inicio.localeCompare(b.inicio)),
      conflictos: actual.conflictos.filter(
        ([a, b]) => !quitar || (a !== evento.id && b !== evento.id)
      ),
    };
    try {
      await agenda.mutate(
        quitar
          ? enviarJson<AgendaDTO>(`${URL_AGENDA}/${evento.id}`, "DELETE")
          : enviarJson<AgendaDTO>(URL_AGENDA, "POST", { eventoId: evento.id }),
        { optimisticData: optimista, rollbackOnError: true, populateCache: true, revalidate: false }
      );
    } catch {
      setErrorGuardar(true);
    }
  }

  const candidatos = eventos.data.datos.filter((e) => !e.cancelado && !enAgenda.has(e.id));

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="mi-agenda" data-contenido-principal>
        <h2 id="mi-agenda" className="mb-4 text-2xl font-bold">
          {t.enAgenda}{" "}
          <span className="text-fg-muted font-mono text-base">({actual.eventos.length})</span>
        </h2>
        <div aria-live="polite">
          {errorGuardar && (
            <Alert tono="peligro" rol="alert" titulo={t.errorGuardar} className="mb-4" />
          )}
        </div>
        {actual.eventos.length === 0 ? (
          <EmptyState titulo={t.vacia} />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="lista-agenda">
            {actual.eventos.map((e) => (
              <li
                key={e.id}
                className="border-border bg-surface flex items-center gap-3 rounded-md border px-4 py-3"
              >
                <div className="flex-1">
                  <p className="font-semibold">{e.nombre}</p>
                  <p className="text-fg-muted text-sm capitalize">{cuando(e)}</p>
                  {enConflicto.has(e.id) && (
                    <Badge tono="aviso" className="mt-1">
                      {t.conflicto}
                    </Badge>
                  )}
                </div>
                <Button
                  tamano="sm"
                  variante="secundario"
                  onClick={() => void alternar(e)}
                  aria-label={`${t.quitar}: ${e.nombre}`}
                >
                  {t.quitar}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="disponibles">
        <h2 id="disponibles" className="mb-4 text-2xl font-bold">
          {t.disponibles}
        </h2>
        <ul className="flex flex-col gap-2">
          {candidatos.map((e) => (
            <li
              key={e.id}
              className="border-border flex items-center gap-3 rounded-md border px-4 py-3"
            >
              <div className="flex-1">
                <Link href={`/programacion/${e.dia}`} className="font-semibold">
                  {e.nombre}
                </Link>
                <p className="text-fg-muted text-sm capitalize">{cuando(e)}</p>
              </div>
              <Button
                tamano="sm"
                onClick={() => void alternar(e)}
                aria-label={`${t.agregar}: ${e.nombre}`}
              >
                {t.agregar}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
