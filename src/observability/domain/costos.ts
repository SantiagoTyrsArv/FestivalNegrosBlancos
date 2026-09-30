/**
 * Simulador de costos: compara servir TODO con SSR frente a la arquitectura
 * híbrida del proyecto. Todos los precios son SUPUESTOS editables, no tarifas
 * reales de ningún proveedor. Función pura: sin E/S, fácil de probar.
 */
export interface ParametrosCostos {
  visitasMes: number;
  /** Porcentaje de las visitas que cae en cada zona (debe sumar 100). */
  mezcla: { ssg: number; isr: number; ssr: number; csr: number };
  /** USD por millón de invocaciones de función en servidor. */
  costoMillonInvocaciones: number;
  /** USD por GB transferido desde una función (respuesta dinámica). */
  costoGB: number;
  /** USD por GB servido desde la caché de la CDN (HTML estático/ISR, shells CSR). */
  costoGBCdn: number;
  /** Peso medio del HTML de una página (KB). */
  htmlKB: number;
  /** Peso medio de una respuesta JSON de la API (KB). */
  jsonKB: number;
  /** Llamadas a la API por vista en las páginas CSR (polling, etc.). */
  llamadasApiPorVistaCsr: number;
  /** Rutas ISR distintas y su intervalo de revalidación (s). */
  rutasIsr: number;
  revalidarSegundos: number;
}

export interface DesgloseEscenario {
  invocaciones: number;
  gb: number;
  costoInvocaciones: number;
  costoTransferencia: number;
  total: number;
}

export interface ResultadoCostos {
  todoSsr: DesgloseEscenario;
  hibrido: DesgloseEscenario;
  ahorroUsd: number;
  /** Porcentaje de ahorro del híbrido frente a todo-SSR (0 si todo-SSR cuesta 0). */
  ahorroPorcentaje: number;
}

export type ErrorParametros = "MEZCLA_NO_SUMA_100" | "VALOR_NEGATIVO";

const SEGUNDOS_MES = 30 * 24 * 3600;
const KB_POR_GB = 1024 * 1024;

export function validarParametros(p: ParametrosCostos): ErrorParametros | null {
  const valores = [
    p.visitasMes,
    p.costoMillonInvocaciones,
    p.costoGB,
    p.costoGBCdn,
    p.htmlKB,
    p.jsonKB,
    p.llamadasApiPorVistaCsr,
    p.rutasIsr,
    p.revalidarSegundos,
    ...Object.values(p.mezcla),
  ];
  if (valores.some((v) => !Number.isFinite(v) || v < 0)) return "VALOR_NEGATIVO";
  const suma = p.mezcla.ssg + p.mezcla.isr + p.mezcla.ssr + p.mezcla.csr;
  return Math.abs(suma - 100) > 0.01 ? "MEZCLA_NO_SUMA_100" : null;
}

function desglose(
  invocaciones: number,
  gbDinamico: number,
  gbCdn: number,
  p: ParametrosCostos
): DesgloseEscenario {
  const costoInvocaciones = (invocaciones / 1_000_000) * p.costoMillonInvocaciones;
  const costoTransferencia = gbDinamico * p.costoGB + gbCdn * p.costoGBCdn;
  return {
    invocaciones,
    gb: gbDinamico + gbCdn,
    costoInvocaciones,
    costoTransferencia,
    total: costoInvocaciones + costoTransferencia,
  };
}

export function calcularCostos(p: ParametrosCostos): ResultadoCostos {
  const visitas = (pct: number) => (p.visitasMes * pct) / 100;

  // (a) Todo SSR: cada visita ejecuta una función y transfiere su HTML.
  const todoSsr = desglose(p.visitasMes, (p.visitasMes * p.htmlKB) / KB_POR_GB, 0, p);

  // (b) Híbrido:
  // - SSG: HTML desde CDN, 0 invocaciones.
  // - ISR: como máximo una regeneración por ruta y ventana de revalidación,
  //   y nunca más regeneraciones que visitas.
  // - SSR: una invocación por visita.
  // - CSR: shell estático (0 invocaciones) + N llamadas a la API por vista.
  const regeneraciones =
    p.revalidarSegundos > 0
      ? Math.min(visitas(p.mezcla.isr), p.rutasIsr * Math.ceil(SEGUNDOS_MES / p.revalidarSegundos))
      : visitas(p.mezcla.isr);
  const llamadasCsr = visitas(p.mezcla.csr) * p.llamadasApiPorVistaCsr;
  const invocaciones = regeneraciones + visitas(p.mezcla.ssr) + llamadasCsr;
  const visitasCacheadas = visitas(p.mezcla.ssg + p.mezcla.isr + p.mezcla.csr);
  const gbCdn = (visitasCacheadas * p.htmlKB) / KB_POR_GB;
  const gbDinamico = (visitas(p.mezcla.ssr) * p.htmlKB + llamadasCsr * p.jsonKB) / KB_POR_GB;
  const hibrido = desglose(invocaciones, gbDinamico, gbCdn, p);

  const ahorroUsd = todoSsr.total - hibrido.total;
  return {
    todoSsr,
    hibrido,
    ahorroUsd,
    ahorroPorcentaje: todoSsr.total > 0 ? (ahorroUsd / todoSsr.total) * 100 : 0,
  };
}

export const PARAMETROS_POR_DEFECTO: ParametrosCostos = {
  visitasMes: 2_000_000,
  mezcla: { ssg: 35, isr: 40, ssr: 15, csr: 10 },
  costoMillonInvocaciones: 0.6,
  costoGB: 0.15,
  costoGBCdn: 0.05,
  htmlKB: 60,
  jsonKB: 4,
  llamadasApiPorVistaCsr: 4,
  rutasIsr: 12,
  revalidarSegundos: 120,
};
