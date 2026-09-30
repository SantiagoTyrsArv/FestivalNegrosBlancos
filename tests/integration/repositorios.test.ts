import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Conexion } from "@/db/connection";
import { sesionesBoleteria } from "@/db/schema";
import { DrizzleAgendaRepository } from "@/modules/agenda/infrastructure/drizzle-agenda-repository";
import { ComprarBoletas } from "@/modules/boleteria/application/casos-de-uso";
import {
  DrizzleBoleteriaRepository,
  GeneradorCodigosAleatorios,
} from "@/modules/boleteria/infrastructure/drizzle-boleteria-repository";
import { DrizzleComparsaRepository } from "@/modules/comparsas/infrastructure/drizzle-comparsa-repository";
import {
  DrizzleArtistaRepository,
  DrizzleEventoRepository,
} from "@/modules/eventos/infrastructure/drizzle-repositorios";
import { ProgramacionGatewaySimulado } from "@/modules/eventos/infrastructure/programacion-gateway-simulado";
import { DrizzleResultadoRepository } from "@/modules/resultados/infrastructure/drizzle-resultado-repository";
import { DrizzleUsuarioRepository } from "@/modules/usuarios/infrastructure/drizzle-usuario-repository";
import { DrizzleAjustesCaos } from "@/observability/caos";
import { DrizzleMedicionesRepository } from "@/observability/infrastructure/mediciones-repository";
import { crearBdPrueba } from "./helpers";

let conexion: Conexion;

beforeEach(async () => {
  conexion = await crearBdPrueba();
});

describe("DrizzleEventoRepository y DrizzleArtistaRepository", () => {
  it("mapea filas a entidades con escenario y artistas", async () => {
    const repo = new DrizzleEventoRepository(conexion.db);
    const evento = await repo.obtenerPorId(1);
    expect(evento?.inicio).toBeInstanceOf(Date);
    expect(evento).toMatchObject({
      nombre: "Noche de marimba",
      escenario: { slug: "tarima", nombre: "Tarima" },
      artistas: [
        { slug: "duo", nombre: "Dúo Nevado" },
        { slug: "marimba", nombre: "Marimba Sur" },
      ],
    });
    expect(await repo.obtenerPorId(99)).toBeNull();
    expect(await repo.listar({ tipo: "desfile" })).toHaveLength(1);
  });

  it("pagina por cursor", async () => {
    const repo = new DrizzleEventoRepository(conexion.db);
    const p1 = await repo.listarPagina({ cursor: null, limite: 2 });
    expect(p1.items.map((e) => e.id)).toEqual([1, 2]);
    expect(p1.siguienteCursor).toBe(2);
    const p2 = await repo.listarPagina({ cursor: 2, limite: 2 });
    expect(p2).toMatchObject({ siguienteCursor: null });
    expect(p2.items.map((e) => e.id)).toEqual([3]);
  });

  it("actualiza un evento", async () => {
    const repo = new DrizzleEventoRepository(conexion.db);
    const e = await repo.actualizar(1, { nombre: "Nuevo", descripcion: "x", cancelado: true });
    expect(e).toMatchObject({ nombre: "Nuevo", cancelado: true });
  });

  it("obtiene artistas y sus eventos", async () => {
    const repo = new DrizzleArtistaRepository(
      conexion.db,
      new DrizzleEventoRepository(conexion.db)
    );
    expect((await repo.listar()).map((a) => a.slug)).toEqual(["duo", "marimba"]);
    expect(await repo.obtenerPorSlug("marimba")).toMatchObject({ destacado: true });
    expect(await repo.obtenerPorSlug("nadie")).toBeNull();
    expect((await repo.eventosDeArtista("marimba")).map((e) => e.id)).toEqual([1]);
  });
});

describe("DrizzleBoleteriaRepository: compra atómica", () => {
  const compra = (
    repo: DrizzleBoleteriaRepository,
    usuarioId: number,
    cantidad: number,
    clave: string
  ) =>
    new ComprarBoletas(repo, new GeneradorCodigosAleatorios()).ejecutar({
      sesionId: 1,
      usuarioId,
      cantidad,
      idempotencyKey: clave,
    });

  it("registra la boleta y descuenta el cupo en la misma transacción", async () => {
    const repo = new DrizzleBoleteriaRepository(conexion.db, conexion.sqlite);
    const r = await compra(repo, 1, 3, "k1");
    expect(r.ok && r.value.boleta).toMatchObject({
      cantidad: 3,
      totalCentavos: 13_500_000,
      moneda: "COP",
    });
    expect(r.ok && r.value.boleta.codigo).toMatch(/^CBN-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect((await repo.obtenerSesion(1))?.cupoVendido).toBe(3);
    expect(await repo.boletasDeUsuario(1)).toHaveLength(1);
  });

  it("es imposible sobrevender: 40 compras concurrentes sobre 10 cupos", async () => {
    const repo = new DrizzleBoleteriaRepository(conexion.db, conexion.sqlite);
    const resultados = await Promise.all(
      Array.from({ length: 40 }, (_, i) => compra(repo, (i % 2) + 1, 1, `concurrente-${i}`))
    );
    const exitosas = resultados.filter((r) => r.ok);
    const rechazadas = resultados.filter((r) => !r.ok);
    expect(exitosas).toHaveLength(10);
    expect(rechazadas.every((r) => !r.ok && r.error.tipo === "CUPO_INSUFICIENTE")).toBe(true);
    const sesion = await repo.obtenerSesion(1);
    expect(sesion?.cupoVendido).toBe(10);
    const vendidas =
      (await repo.boletasDeUsuario(1)).length + (await repo.boletasDeUsuario(2)).length;
    expect(vendidas).toBe(10);
  });

  it("rechaza en el repositorio aunque la validación previa se salte (carrera)", async () => {
    const repo = new DrizzleBoleteriaRepository(conexion.db, conexion.sqlite);
    const r = await repo.registrarCompra({
      sesionId: 2,
      usuarioId: 1,
      cantidad: 1,
      idempotencyKey: "x",
      codigo: "CBN-AAAA-BBBB",
    });
    expect(r).toEqual({ ok: false, error: { tipo: "CUPO_INSUFICIENTE", disponible: 0 } });
    const inexistente = await repo.registrarCompra({
      sesionId: 99,
      usuarioId: 1,
      cantidad: 1,
      idempotencyKey: "y",
      codigo: "CBN-CCCC-DDDD",
    });
    expect(inexistente).toEqual({ ok: false, error: { tipo: "SESION_NO_ENCONTRADA" } });
  });

  it("la clave de idempotencia devuelve la compra original sin descontar dos veces", async () => {
    const repo = new DrizzleBoleteriaRepository(conexion.db, conexion.sqlite);
    const primera = await compra(repo, 1, 2, "reintento");
    const segunda = await compra(repo, 1, 2, "reintento");
    expect(segunda.ok && segunda.value.repetida).toBe(true);
    expect(
      primera.ok && segunda.ok && primera.value.boleta.codigo === segunda.value.boleta.codigo
    ).toBe(true);
    expect((await repo.obtenerSesion(1))?.cupoVendido).toBe(2);
    // La misma clave de OTRO usuario es una compra distinta.
    expect((await compra(repo, 2, 1, "reintento")).ok).toBe(true);
  });

  it("la restricción CHECK de la BD impide sobreventa incluso con SQL directo", async () => {
    const error = await conexion.db
      .update(sesionesBoleteria)
      .set({ cupoVendido: 11 })
      .where(eq(sesionesBoleteria.id, 1))
      .then(
        () => null,
        (e: unknown) => e
      );
    // Drizzle envuelve el error nativo de SQLite en `cause`.
    expect(String((error as { cause?: unknown } | null)?.cause)).toMatch(/CHECK constraint failed/);
  });
});

describe("otros repositorios", () => {
  it("resultados: lista publicados y publica", async () => {
    const repo = new DrizzleResultadoRepository(conexion.db);
    expect(await repo.listar({ soloPublicados: true })).toHaveLength(1);
    const pendientes = (await repo.listar({ soloPublicados: false })).filter((r) => !r.publicado);
    const id = pendientes[0]?.id ?? -1;
    await repo.marcarPublicado(id, new Date("2027-01-06T20:00:00Z"));
    expect(await repo.obtener(id)).toMatchObject({
      publicado: true,
      comparsa: { slug: "maravilla" },
    });
    expect(await repo.obtener(999)).toBeNull();
  });

  it("agenda: agrega sin duplicar y quita", async () => {
    const repo = new DrizzleAgendaRepository(conexion.db);
    await repo.agregar(1, 1);
    await repo.agregar(1, 1);
    await repo.agregar(1, 2);
    expect(await repo.eventosDe(1)).toEqual([1, 2]);
    await repo.quitar(1, 1);
    expect(await repo.eventosDe(1)).toEqual([2]);
  });

  it("usuarios: crea, rechaza duplicados y busca", async () => {
    const repo = new DrizzleUsuarioRepository(conexion.db);
    expect(await repo.crear({ email: "c@test.com", nombre: "C", passwordHash: "h" })).toMatchObject(
      { rol: "asistente" }
    );
    expect(await repo.crear({ email: "c@test.com", nombre: "C2", passwordHash: "h" })).toBeNull();
    expect(await repo.buscarPorEmail("c@test.com")).toMatchObject({ passwordHash: "h" });
    expect(await repo.obtenerPorId(1)).toMatchObject({ email: "a@test.com" });
    expect(await repo.obtenerPorId(999)).toBeNull();
  });

  it("comparsas: lista y busca por slug", async () => {
    const repo = new DrizzleComparsaRepository(conexion.db);
    expect(await repo.listar()).toHaveLength(1);
    expect(await repo.obtenerPorSlug("maravilla")).toMatchObject({ color: "#c8102e" });
    expect(await repo.obtenerPorSlug("otra")).toBeNull();
  });

  it("mediciones: registra y consulta por ruta", async () => {
    const repo = new DrizzleMedicionesRepository(conexion.db);
    await repo.registrar({
      ruta: "/",
      patron: "SSG",
      origen: "render",
      generadoEn: new Date(),
      tiempoRenderMs: 12,
      estadoCache: "MISS",
      enHtmlInicial: null,
    });
    await repo.registrar({
      ruta: "/faq",
      patron: "SSG",
      origen: "vista",
      generadoEn: new Date(),
      tiempoRenderMs: null,
      estadoCache: "HIT",
      enHtmlInicial: true,
    });
    expect(await repo.recientes()).toHaveLength(2);
    expect(await repo.deRuta("/faq")).toMatchObject([{ enHtmlInicial: true, estadoCache: "HIT" }]);
    await repo.vaciar();
    expect(await repo.recientes()).toHaveLength(0);
  });
});

describe("ProgramacionGatewaySimulado + Modo Caos", () => {
  const crear = () => {
    const caos = new DrizzleAjustesCaos(conexion.db);
    const gateway = new ProgramacionGatewaySimulado(
      new DrizzleEventoRepository(conexion.db),
      caos,
      async () => {}
    );
    return { caos, gateway };
  };

  it("sin caos devuelve la programación validada", async () => {
    const { caos, gateway } = crear();
    expect(await caos.modoActual()).toBe("ninguno");
    const r = await gateway.obtenerProgramacion();
    expect(r.ok && r.value).toHaveLength(3);
  });

  it("modo error: la upstream no está disponible", async () => {
    const { caos, gateway } = crear();
    await caos.cambiarModo("error");
    expect(await gateway.obtenerProgramacion()).toMatchObject({
      ok: false,
      error: { tipo: "UPSTREAM_NO_DISPONIBLE" },
    });
  });

  it("modo inválido: el contrato no se cumple y la capa anticorrupción lo rechaza", async () => {
    const { caos, gateway } = crear();
    await caos.cambiarModo("invalido");
    expect(await gateway.obtenerProgramacion()).toMatchObject({
      ok: false,
      error: { tipo: "UPSTREAM_RESPUESTA_INVALIDA" },
    });
  });

  it("modo lento: espera la latencia configurada y responde bien", async () => {
    const esperas: number[] = [];
    const caos = new DrizzleAjustesCaos(conexion.db);
    const gateway = new ProgramacionGatewaySimulado(
      new DrizzleEventoRepository(conexion.db),
      caos,
      async (ms) => {
        esperas.push(ms);
      }
    );
    await caos.cambiarModo("lento");
    expect((await gateway.obtenerProgramacion()).ok).toBe(true);
    expect(esperas).toEqual([4000]);
    await caos.cambiarModo("ninguno");
    expect(await caos.modoActual()).toBe("ninguno");
  });
});
