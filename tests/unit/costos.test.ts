import { describe, expect, it } from "vitest";
import {
  PARAMETROS_POR_DEFECTO,
  calcularCostos,
  validarParametros,
  type ParametrosCostos,
} from "@/observability/domain/costos";

const base: ParametrosCostos = {
  visitasMes: 1_000_000,
  mezcla: { ssg: 25, isr: 25, ssr: 25, csr: 25 },
  costoMillonInvocaciones: 1,
  costoGB: 1,
  costoGBCdn: 1,
  htmlKB: 1024, // 1 MB por página para que las cuentas sean redondas
  jsonKB: 0,
  llamadasApiPorVistaCsr: 2,
  rutasIsr: 1,
  revalidarSegundos: 0,
};

describe("simulador de costos", () => {
  it("valida la mezcla y los valores negativos", () => {
    expect(validarParametros(base)).toBeNull();
    expect(validarParametros(PARAMETROS_POR_DEFECTO)).toBeNull();
    expect(validarParametros({ ...base, mezcla: { ssg: 50, isr: 0, ssr: 0, csr: 0 } })).toBe(
      "MEZCLA_NO_SUMA_100"
    );
    expect(validarParametros({ ...base, costoGB: -1 })).toBe("VALOR_NEGATIVO");
    expect(validarParametros({ ...base, visitasMes: Number.NaN })).toBe("VALOR_NEGATIVO");
  });

  it("todo-SSR invoca una función por visita", () => {
    const r = calcularCostos(base);
    expect(r.todoSsr.invocaciones).toBe(1_000_000);
    expect(r.todoSsr.gb).toBeCloseTo(1_000_000 / 1024);
    expect(r.todoSsr.costoInvocaciones).toBeCloseTo(1);
  });

  it("el híbrido solo invoca en SSR, CSR (API) e ISR sin límite de revalidación", () => {
    const r = calcularCostos(base);
    // ISR (sin ventana): 250k + SSR 250k + CSR 250k × 2 llamadas = 1M
    expect(r.hibrido.invocaciones).toBe(1_000_000);
  });

  it("ISR queda acotado por las regeneraciones posibles en un mes", () => {
    const r = calcularCostos({ ...base, revalidarSegundos: 3600 });
    // 1 ruta × 720 ventanas de 1 h en 30 días
    expect(r.hibrido.invocaciones).toBe(720 + 250_000 + 500_000);
    expect(r.ahorroUsd).toBeGreaterThan(0);
    expect(r.ahorroPorcentaje).toBeGreaterThan(0);
  });

  it("con los parámetros por defecto el híbrido es más barato", () => {
    const r = calcularCostos(PARAMETROS_POR_DEFECTO);
    expect(r.hibrido.total).toBeLessThan(r.todoSsr.total);
  });

  it("no divide por cero si todo es gratis", () => {
    const r = calcularCostos({ ...base, costoGB: 0, costoGBCdn: 0, costoMillonInvocaciones: 0 });
    expect(r.ahorroPorcentaje).toBe(0);
  });
});
