import { describe, expect, it } from "vitest";
import { crearContenedor } from "@/contenedor";
import { crearCatalogo } from "@/datos/catalogo";

describe("catálogo de datos quemados", () => {
  it("tiene ids y slugs únicos", () => {
    const c = crearCatalogo();
    const unicos = (xs: readonly (string | number)[]) => new Set(xs).size === xs.length;
    expect(unicos(c.eventos.map((e) => e.id))).toBe(true);
    expect(unicos(c.sesiones.map((s) => s.id))).toBe(true);
    expect(unicos(c.artistas.map((a) => a.slug))).toBe(true);
    expect(unicos(c.comparsas.map((x) => x.slug))).toBe(true);
  });

  it("solo referencia eventos existentes y deja resultados pendientes para /admin", () => {
    const c = crearCatalogo();
    const ids = new Set(c.eventos.map((e) => e.id));
    expect(c.sesiones.every((s) => ids.has(s.eventoId))).toBe(true);
    expect(c.resultados.filter((r) => r.publicado)).toHaveLength(6);
    expect(c.resultados.filter((r) => !r.publicado).length).toBeGreaterThan(0);
  });

  it("cada llamada devuelve una copia independiente", () => {
    const a = crearCatalogo();
    a.usuarios.pop();
    expect(crearCatalogo().usuarios).toHaveLength(2);
  });
});

describe("contenedor en memoria", () => {
  it("una compra descuenta cupo y aparece en las boletas del usuario", async () => {
    const casos = crearContenedor();
    const [sesion] = await casos.boleteria.consultarCupos.ejecutar(1);
    if (!sesion) throw new Error("El evento 1 debe tener sesiones");

    const r = await casos.boleteria.comprar.ejecutar({
      sesionId: sesion.id,
      usuarioId: 2,
      cantidad: 2,
      idempotencyKey: "00000000-0000-4000-8000-000000000000",
    });

    expect(r.ok).toBe(true);
    expect((await casos.boleteria.obtenerSesion.ejecutar(sesion.id))?.disponible).toBe(
      sesion.disponible - 2
    );
    expect(await casos.boleteria.boletasDeUsuario.ejecutar(2)).toHaveLength(1);
  });

  it("inicia sesión con las cuentas de demostración", async () => {
    const casos = crearContenedor();
    const r = await casos.usuarios.iniciarSesion.ejecutar("admin@carnaval.test", "Admin123!");
    expect(r.ok && r.value.rol).toBe("admin");
  });
});
