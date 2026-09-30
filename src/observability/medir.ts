/**
 * Cronómetro del observatorio. Los Server Components de página se ejecutan una
 * sola vez por generación (build, regeneración ISR o petición SSR), así que
 * leer el reloj aquí es una medición intencional y no afecta a la hidratación:
 * el valor viaja congelado en el HTML/RSC hasta el RenderBadge.
 */
export const iniciarMedicion = (): number => performance.now();

export const msDesde = (inicio: number): number =>
  Math.max(0, Math.round(performance.now() - inicio));
