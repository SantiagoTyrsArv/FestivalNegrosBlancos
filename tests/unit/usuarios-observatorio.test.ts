import { describe, expect, it } from "vitest";
import { IniciarSesion, RegistrarUsuario } from "@/modules/usuarios/application/casos-de-uso";
import { esAdmin, normalizarEmail, validarPassword } from "@/modules/usuarios/domain/usuario";
import {
  coincidePatron,
  inferirEstadoCache,
  inferirPatron,
  resumirPorRuta,
  type Medicion,
} from "@/observability/domain/medicion";
import { err } from "@/shared/lib/result";
import { UsuarioRepositoryEnMemoria } from "../fakes";

describe("usuarios", () => {
  it("normaliza emails y valida la política de contraseñas", () => {
    expect(normalizarEmail("  Ana@Correo.COM ")).toBe("ana@correo.com");
    expect(validarPassword("corta1").ok).toBe(false);
    expect(validarPassword("sinnumeros").ok).toBe(false);
    expect(validarPassword("12345678").ok).toBe(false);
    expect(validarPassword("Segura123").ok).toBe(true);
    expect(esAdmin({ rol: "admin" })).toBe(true);
    expect(esAdmin({ rol: "asistente" })).toBe(false);
  });

  it("registra usuarios y rechaza emails repetidos y contraseñas débiles", async () => {
    const repo = new UsuarioRepositoryEnMemoria();
    const caso = new RegistrarUsuario(repo);
    const r = await caso.ejecutar({
      email: "Nuevo@Test.com",
      nombre: " Nuevo ",
      password: "Segura123",
    });
    expect(r.ok && r.value).toMatchObject({
      email: "nuevo@test.com",
      nombre: "Nuevo",
      rol: "asistente",
    });
    expect(
      await caso.ejecutar({ email: "nuevo@test.com", nombre: "Otro", password: "Segura123" })
    ).toEqual(err({ tipo: "EMAIL_EN_USO" }));
    expect(await caso.ejecutar({ email: "x@test.com", nombre: "X", password: "debil" })).toEqual(
      err({ tipo: "PASSWORD_DEBIL" })
    );
  });

  it("inicia sesión solo con credenciales válidas", async () => {
    const repo = new UsuarioRepositoryEnMemoria([
      { id: 1, email: "ana@test.com", nombre: "Ana", rol: "admin", password: "Clave123" },
    ]);
    const caso = new IniciarSesion(repo);
    const bien = await caso.ejecutar("ANA@test.com", "Clave123");
    expect(bien.ok && bien.value).toEqual({
      id: 1,
      email: "ana@test.com",
      nombre: "Ana",
      rol: "admin",
    });
    const malaClave = await caso.ejecutar("ana@test.com", "otra");
    const sinUsuario = await caso.ejecutar("nadie@test.com", "Clave123");
    expect(malaClave).toEqual(err({ tipo: "CREDENCIALES_INVALIDAS" }));
    expect(sinUsuario).toEqual(malaClave);
  });
});

const t0 = new Date("2026-10-01T12:00:00Z");
const seg = (s: number) => new Date(t0.getTime() + s * 1000);

describe("observatorio: inferencia", () => {
  it("infiere HIT / MISS / STALE / DINAMICO / CLIENTE", () => {
    const base = { generadoEn: t0, revalidarSegundos: 60 };
    expect(inferirEstadoCache({ ...base, patron: "CSR", recibidoEn: seg(100) })).toBe("CLIENTE");
    expect(inferirEstadoCache({ ...base, patron: "SSR", recibidoEn: seg(0) })).toBe("DINAMICO");
    expect(inferirEstadoCache({ ...base, patron: "HIBRIDO", recibidoEn: seg(0) })).toBe("DINAMICO");
    expect(inferirEstadoCache({ ...base, patron: "ISR", recibidoEn: seg(1) })).toBe("MISS");
    expect(inferirEstadoCache({ ...base, patron: "ISR", recibidoEn: seg(30) })).toBe("HIT");
    expect(inferirEstadoCache({ ...base, patron: "ISR", recibidoEn: seg(61) })).toBe("STALE");
    expect(
      inferirEstadoCache({
        ...base,
        patron: "SSG",
        recibidoEn: seg(86400),
        revalidarSegundos: null,
      })
    ).toBe("HIT");
  });

  it("infiere el patrón observado a partir de las vistas", () => {
    const v = (s: number, enHtmlInicial: boolean | null = true) => ({
      generadoEn: seg(s),
      enHtmlInicial,
    });
    expect(inferirPatron([])).toBe("INDETERMINADO");
    expect(inferirPatron([v(0)])).toBe("INDETERMINADO");
    expect(inferirPatron([v(0, false)])).toBe("CSR");
    expect(inferirPatron([v(0), v(0), v(0)])).toBe("SSG");
    expect(inferirPatron([v(0), v(1), v(2)])).toBe("SSR");
    expect(inferirPatron([v(0), v(0), v(70)])).toBe("ISR");
  });

  it("compara patrón declarado y observado", () => {
    expect(coincidePatron("SSR", "INDETERMINADO")).toBeNull();
    expect(coincidePatron("HIBRIDO", "SSR")).toBe(true);
    expect(coincidePatron("ISR", "SSG")).toBe(true);
    expect(coincidePatron("SSG", "SSR")).toBe(false);
  });

  it("resume mediciones por ruta", () => {
    const m = (p: Partial<Medicion>): Medicion => ({
      ruta: "/programacion",
      patron: "ISR",
      origen: "vista",
      generadoEn: t0,
      tiempoRenderMs: null,
      estadoCache: "HIT",
      enHtmlInicial: true,
      creadoEn: seg(1),
      ...p,
    });
    const [resumen, otra] = resumirPorRuta([
      m({ origen: "render", tiempoRenderMs: 40, creadoEn: seg(0) }),
      m({ creadoEn: seg(5) }),
      m({ creadoEn: seg(8), estadoCache: "STALE" }),
      m({ ruta: "/a", patron: "SSR", origen: "render", tiempoRenderMs: null }),
    ]);
    expect(otra?.ruta).toBe("/programacion");
    expect(resumen).toMatchObject({ ruta: "/a", renders: 1, vistas: 0, tiempoMedioRenderMs: null });
    const programacion = resumirPorRuta([
      m({ origen: "render", tiempoRenderMs: 40, creadoEn: seg(0) }),
      m({ creadoEn: seg(5) }),
      m({ creadoEn: seg(8), estadoCache: "STALE" }),
    ])[0];
    expect(programacion).toMatchObject({
      renders: 1,
      vistas: 2,
      tiempoMedioRenderMs: 40,
      ultimoEstado: "STALE",
      patronObservado: "SSG",
      coincide: true,
    });
  });
});
