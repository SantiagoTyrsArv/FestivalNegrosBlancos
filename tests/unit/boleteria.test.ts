import { describe, expect, it } from "vitest";
import {
  ComprarBoletas,
  ConsultarCupos,
  ListarBoletasDeUsuario,
  ObtenerSesion,
} from "@/modules/boleteria/application/casos-de-uso";
import {
  MAXIMO_POR_ORDEN,
  cupoDisponible,
  disponibilidad,
  multiplicar,
  validarCompra,
} from "@/modules/boleteria/domain/boleteria";
import { err } from "@/shared/lib/result";
import { BoleteriaRepositoryEnMemoria, unaSesion } from "../fakes";

const codigos = { generar: () => "CBN-TEST-0001" };

describe("dominio de boletería", () => {
  it("multiplica dinero en centavos y rechaza factores no enteros", () => {
    expect(multiplicar({ centavos: 4_500_000, moneda: "COP" }, 3)).toEqual({
      centavos: 13_500_000,
      moneda: "COP",
    });
    expect(() => multiplicar({ centavos: 1, moneda: "COP" }, 1.5)).toThrow(RangeError);
  });

  it("calcula cupo disponible y nivel de disponibilidad", () => {
    expect(cupoDisponible({ cupoTotal: 10, cupoVendido: 12 })).toBe(0);
    expect(disponibilidad({ cupoTotal: 3000, cupoVendido: 3000 })).toBe("agotado");
    expect(disponibilidad({ cupoTotal: 3000, cupoVendido: 2900 })).toBe("ultimas");
    expect(disponibilidad({ cupoTotal: 3000, cupoVendido: 100 })).toBe("disponible");
    expect(disponibilidad({ cupoTotal: 40, cupoVendido: 31 })).toBe("ultimas");
  });

  it("no permite comprar más que el cupo ni cantidades inválidas", () => {
    const sesion = unaSesion({ cupoTotal: 10, cupoVendido: 8 });
    expect(validarCompra(sesion, 3)).toEqual(err({ tipo: "CUPO_INSUFICIENTE", disponible: 2 }));
    expect(validarCompra(sesion, 0)).toEqual(
      err({ tipo: "CANTIDAD_INVALIDA", maximo: MAXIMO_POR_ORDEN })
    );
    expect(validarCompra(sesion, 1.5).ok).toBe(false);
    expect(validarCompra(unaSesion(), MAXIMO_POR_ORDEN + 1).ok).toBe(false);
    const ok2 = validarCompra(sesion, 2);
    expect(ok2.ok && ok2.value.total.centavos).toBe(9_000_000);
  });
});

describe("casos de uso de boletería", () => {
  it("consulta cupos como DTO", async () => {
    const repo = new BoleteriaRepositoryEnMemoria([
      unaSesion({ id: 1, eventoId: 5, cupoTotal: 10, cupoVendido: 10 }),
    ]);
    const [s] = await new ConsultarCupos(repo).ejecutar(5);
    expect(s).toMatchObject({
      disponible: 0,
      disponibilidad: "agotado",
      precioCentavos: 4_500_000,
    });
    expect(await new ObtenerSesion(repo).ejecutar(1)).toMatchObject({ id: 1 });
    expect(await new ObtenerSesion(repo).ejecutar(2)).toBeNull();
  });

  it("compra boletas y descuenta el cupo", async () => {
    const repo = new BoleteriaRepositoryEnMemoria([unaSesion({ id: 1, cupoTotal: 5 })]);
    const r = await new ComprarBoletas(repo, codigos).ejecutar({
      sesionId: 1,
      usuarioId: 9,
      cantidad: 2,
      idempotencyKey: "k1",
    });
    expect(r.ok && r.value).toMatchObject({
      repetida: false,
      boleta: { cantidad: 2, totalCentavos: 9_000_000 },
    });
    expect(repo.sesiones[0]?.cupoVendido).toBe(2);
    expect(await new ListarBoletasDeUsuario(repo).ejecutar(9)).toHaveLength(1);
  });

  it("es idempotente: repetir la clave no duplica la compra", async () => {
    const repo = new BoleteriaRepositoryEnMemoria([unaSesion({ id: 1, cupoTotal: 5 })]);
    const caso = new ComprarBoletas(repo, codigos);
    const entrada = { sesionId: 1, usuarioId: 9, cantidad: 2, idempotencyKey: "misma" };
    await caso.ejecutar(entrada);
    const segunda = await caso.ejecutar(entrada);
    expect(segunda.ok && segunda.value.repetida).toBe(true);
    expect(repo.sesiones[0]?.cupoVendido).toBe(2);
  });

  it("devuelve errores tipados de sesión inexistente y cupo insuficiente", async () => {
    const repo = new BoleteriaRepositoryEnMemoria([unaSesion({ id: 1, cupoTotal: 1 })]);
    const caso = new ComprarBoletas(repo, codigos);
    const base = { usuarioId: 1, idempotencyKey: "k" };
    expect(await caso.ejecutar({ ...base, sesionId: 99, cantidad: 1 })).toEqual(
      err({ tipo: "SESION_NO_ENCONTRADA" })
    );
    expect(await caso.ejecutar({ ...base, sesionId: 1, cantidad: 2 })).toEqual(
      err({ tipo: "CUPO_INSUFICIENTE", disponible: 1 })
    );
  });

  it("propaga el rechazo atómico del repositorio (carrera perdida)", async () => {
    const repo = new BoleteriaRepositoryEnMemoria([unaSesion({ id: 1, cupoTotal: 2 })]);
    const caso = new ComprarBoletas(repo, codigos);
    const [a, b] = await Promise.all([
      caso.ejecutar({ sesionId: 1, usuarioId: 1, cantidad: 2, idempotencyKey: "a" }),
      caso.ejecutar({ sesionId: 1, usuarioId: 2, cantidad: 2, idempotencyKey: "b" }),
    ]);
    expect([a?.ok, b?.ok].filter(Boolean)).toHaveLength(1);
    expect(repo.sesiones[0]?.cupoVendido).toBe(2);
  });
});
