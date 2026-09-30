import { SITE_URL } from "@/shared/config/constants";
import type { EventoDTO } from "../application/dto";

/** Datos estructurados schema.org (Event / MusicEvent) para buscadores. */
export function eventoJsonLd(e: EventoDTO) {
  return {
    "@context": "https://schema.org",
    "@type": e.tipo === "concierto" ? "MusicEvent" : "Event",
    name: e.nombre,
    description: e.descripcion,
    startDate: e.inicio,
    endDate: e.fin,
    eventStatus: e.cancelado
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.escenario.nombre,
      address: {
        "@type": "PostalAddress",
        addressLocality: "San Juan de Pasto",
        addressCountry: "CO",
      },
    },
    url: `${SITE_URL}/boletas/${e.id}`,
    ...(e.artistas.length > 0 && {
      performer: e.artistas.map((a) => ({
        "@type": "MusicGroup",
        name: a.nombre,
        url: `${SITE_URL}/artistas/${a.slug}`,
      })),
    }),
  };
}
