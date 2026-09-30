import { FESTIVAL } from "@/shared/config/constants";

// Utilidades puras de presentación. Las fechas llegan en UTC y se muestran en
// la zona horaria del festival; el dinero llega en centavos.

const zona = FESTIVAL.zonaHoraria;

const fmtFechaLarga = new Intl.DateTimeFormat("es-CO", {
  timeZone: zona,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const fmtHora = new Intl.DateTimeFormat("es-CO", {
  timeZone: zona,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const fmtFechaHora = new Intl.DateTimeFormat("es-CO", {
  timeZone: zona,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
// en-CA produce YYYY-MM-DD, útil como clave de día.
const fmtDiaIso = new Intl.DateTimeFormat("en-CA", {
  timeZone: zona,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatearFechaLarga = (d: Date): string => fmtFechaLarga.format(d);
export const formatearHora = (d: Date): string => fmtHora.format(d);
export const formatearFechaHora = (d: Date): string => fmtFechaHora.format(d);

/** Día local del festival (YYYY-MM-DD) al que pertenece un instante UTC. */
export const diaLocal = (d: Date): string => fmtDiaIso.format(d);

/** Convierte "2027-01-02" en un Date a mediodía UTC, seguro para formatear el día. */
export const fechaDeDia = (dia: string): Date => new Date(`${dia}T12:00:00Z`);

export function formatearDinero(centavos: number, moneda: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}

export function toSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
