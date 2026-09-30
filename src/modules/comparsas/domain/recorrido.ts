/**
 * Recorrido del desfile (la "Senda del Carnaval") en coordenadas de un lienzo
 * SVG de 1000×600. Es un trazado ilustrativo, no un mapa cartográfico real.
 */
export interface Punto {
  readonly x: number;
  readonly y: number;
}

export interface Hito extends Punto {
  readonly nombre: string;
}

export const LIENZO = { ancho: 1000, alto: 600 } as const;

export const RECORRIDO: readonly Hito[] = [
  { nombre: "Salida: Parque del Carnavalito", x: 70, y: 500 },
  { nombre: "Avenida de los Estudiantes", x: 250, y: 420 },
  { nombre: "Puente del Río", x: 360, y: 300 },
  { nombre: "Calle de las Máscaras", x: 520, y: 260 },
  { nombre: "Plaza de los Colores", x: 650, y: 360 },
  { nombre: "Tribuna Senda", x: 800, y: 220 },
  { nombre: "Llegada: Estadio del Carnaval", x: 930, y: 110 },
];

const distancia = (a: Punto, b: Punto) => Math.hypot(b.x - a.x, b.y - a.y);

/** Coordenadas SVG redondeadas a décimas: evita ruido de coma flotante en la salida. */
const redondear = (n: number) => Math.round(n * 10) / 10;

const tramos = RECORRIDO.slice(1).map((fin, i) => {
  const inicio = RECORRIDO[i] as Hito;
  return { inicio, fin, largo: distancia(inicio, fin) };
});

export const LARGO_TOTAL = tramos.reduce((acc, t) => acc + t.largo, 0);

/** Punto del recorrido para un progreso entre 0 (salida) y 1 (llegada). */
export function puntoEnRecorrido(progreso: number): Punto {
  const p = Math.min(1, Math.max(0, progreso));
  let restante = p * LARGO_TOTAL;
  for (const t of tramos) {
    if (restante <= t.largo) {
      const f = t.largo === 0 ? 0 : restante / t.largo;
      return {
        x: redondear(t.inicio.x + (t.fin.x - t.inicio.x) * f),
        y: redondear(t.inicio.y + (t.fin.y - t.inicio.y) * f),
      };
    }
    restante -= t.largo;
  }
  const ultimo = RECORRIDO.at(-1) as Hito;
  return { x: ultimo.x, y: ultimo.y };
}

/** Hito más cercano ya alcanzado (para describir la posición en texto accesible). */
export function hitoAlcanzado(progreso: number): Hito {
  const p = Math.min(1, Math.max(0, progreso));
  let acumulado = 0;
  let ultimo = RECORRIDO[0] as Hito;
  for (const t of tramos) {
    acumulado += t.largo;
    if (acumulado / LARGO_TOTAL <= p + 1e-9) ultimo = t.fin;
  }
  return ultimo;
}
