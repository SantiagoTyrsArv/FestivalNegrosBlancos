import { describe, expect, it } from "vitest";
import {
  ActualizarEvento,
  BuscarEnFestival,
  ListarArtistas,
  ListarEventosPaginados,
  ListarProgramacion,
  ObtenerArtista,
  ObtenerEvento,
} from "@/modules/eventos/application/casos-de-uso";
import { coincideBusqueda, normalizarBusqueda } from "@/modules/eventos/domain/artista";
import {
  agruparPorDia,
  estadoTemporal,
  ordenarCronologicamente,
  seSolapan,
  validarCambiosEvento,
} from "@/modules/eventos/domain/evento";
import { err, ok } from "@/shared/lib/result";
import {
  ArtistaRepositoryEnMemoria,
  EventoRepositoryEnMemoria,
  GatewayFalso,
  unArtista,
  unEvento,
} from "../fakes";

const d = (iso: string) => new Date(iso);

describe("dominio de eventos", () => {
  it("calcula el estado temporal", () => {
    const e = { inicio: d("2027-01-02T10:00:00Z"), fin: d("2027-01-02T12:00:00Z") };
    expect(estadoTemporal(e, d("2027-01-02T09:59:59Z"))).toBe("proximo");
    expect(estadoTemporal(e, d("2027-01-02T10:00:00Z"))).toBe("en-curso");
    expect(estadoTemporal(e, d("2027-01-02T12:00:00Z"))).toBe("finalizado");
  });

  it("ordena por inicio y desempata por nombre", () => {
    const a = unEvento({ nombre: "B", inicio: d("2027-01-02T10:00:00Z") });
    const b = unEvento({ nombre: "A", inicio: d("2027-01-02T10:00:00Z") });
    const c = unEvento({ nombre: "C", inicio: d("2027-01-01T10:00:00Z") });
    expect(ordenarCronologicamente([a, b, c]).map((e) => e.nombre)).toEqual(["C", "A", "B"]);
  });

  it("agrupa por día usando la función de día inyectada", () => {
    const eventos = [
      unEvento({ inicio: d("2027-01-03T02:00:00Z") }), // 2 de enero 21:00 en Bogotá
      unEvento({ inicio: d("2027-01-02T15:00:00Z") }),
      unEvento({ inicio: d("2027-01-03T15:00:00Z") }),
    ];
    const diaBogota = (x: Date) => new Date(x.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
    const grupos = agruparPorDia(eventos, diaBogota);
    expect(grupos.map((g) => [g.dia, g.eventos.length])).toEqual([
      ["2027-01-02", 2],
      ["2027-01-03", 1],
    ]);
  });

  it("detecta solapamientos sin contar eventos contiguos", () => {
    const a = { inicio: d("2027-01-02T10:00:00Z"), fin: d("2027-01-02T12:00:00Z") };
    expect(
      seSolapan(a, { inicio: d("2027-01-02T11:00:00Z"), fin: d("2027-01-02T13:00:00Z") })
    ).toBe(true);
    expect(
      seSolapan(a, { inicio: d("2027-01-02T12:00:00Z"), fin: d("2027-01-02T13:00:00Z") })
    ).toBe(false);
  });

  it("valida y normaliza los cambios de un evento", () => {
    expect(
      validarCambiosEvento({ nombre: "  Nuevo  ", descripcion: " x ", cancelado: true })
    ).toEqual(ok({ nombre: "Nuevo", descripcion: "x", cancelado: true }));
    expect(validarCambiosEvento({ nombre: "ab", descripcion: "x", cancelado: false })).toEqual(
      err({ tipo: "NOMBRE_INVALIDO" })
    );
    expect(
      validarCambiosEvento({ nombre: "Válido", descripcion: "   ", cancelado: false })
    ).toEqual(err({ tipo: "DESCRIPCION_INVALIDA" }));
  });

  it("normaliza búsquedas sin tildes ni mayúsculas", () => {
    expect(normalizarBusqueda("  Páramo ")).toBe("paramo");
    expect(coincideBusqueda(["La Cumbia del Páramo"], "PARAMO")).toBe(true);
    expect(coincideBusqueda(["Salsa"], "cumbia")).toBe(false);
  });
});

describe("casos de uso de eventos", () => {
  it("ListarProgramacion agrupa por día del festival y filtra por día", async () => {
    const gateway = new GatewayFalso(
      ok([
        unEvento({ inicio: d("2027-01-02T22:00:00Z") }),
        unEvento({ inicio: d("2027-01-03T22:00:00Z") }),
      ])
    );
    const caso = new ListarProgramacion(gateway);
    const todo = await caso.ejecutar();
    expect(todo.ok && todo.value.map((x) => x.dia)).toEqual(["2027-01-02", "2027-01-03"]);
    const unDia = await caso.ejecutar({ dia: "2027-01-03" });
    expect(unDia.ok && unDia.value).toHaveLength(1);
  });

  it("ListarProgramacion rechaza días fuera del festival y propaga fallos de la upstream", async () => {
    const caso = new ListarProgramacion(new GatewayFalso(ok([])));
    expect(await caso.ejecutar({ dia: "2030-01-01" })).toEqual(err({ tipo: "DIA_NO_EXISTE" }));
    const caida = new ListarProgramacion(
      new GatewayFalso(err({ tipo: "UPSTREAM_NO_DISPONIBLE", detalle: "503" }))
    );
    expect((await caida.ejecutar()).ok).toBe(false);
  });

  it("ObtenerEvento devuelve DTO serializable o NO_ENCONTRADO", async () => {
    const repo = new EventoRepositoryEnMemoria([
      unEvento({ id: 7, inicio: d("2027-01-02T22:00:00Z") }),
    ]);
    const r = await new ObtenerEvento(repo).ejecutar(7);
    expect(r.ok && r.value).toMatchObject({
      id: 7,
      inicio: "2027-01-02T22:00:00.000Z",
      dia: "2027-01-02",
    });
    expect(await new ObtenerEvento(repo).ejecutar(99)).toEqual(err({ tipo: "NO_ENCONTRADO" }));
  });

  it("ListarEventosPaginados acota el límite y devuelve cursor", async () => {
    const repo = new EventoRepositoryEnMemoria([1, 2, 3].map((id) => unEvento({ id })));
    const caso = new ListarEventosPaginados(repo);
    const p1 = await caso.ejecutar({ cursor: null, limite: 2 });
    expect(p1.items.map((e) => e.id)).toEqual([1, 2]);
    expect(p1.siguienteCursor).toBe(2);
    const p2 = await caso.ejecutar({ cursor: 2, limite: 999 });
    expect(p2).toMatchObject({ siguienteCursor: null });
    expect((await caso.ejecutar({ cursor: null, tipo: "desfile" })).items).toEqual([]);
  });

  it("ActualizarEvento valida antes de persistir", async () => {
    const repo = new EventoRepositoryEnMemoria([unEvento({ id: 1 })]);
    const caso = new ActualizarEvento(repo);
    const r = await caso.ejecutar(1, {
      nombre: "Renombrado",
      descripcion: "Nueva",
      cancelado: true,
    });
    expect(r.ok && r.value).toMatchObject({ nombre: "Renombrado", cancelado: true });
    expect((await caso.ejecutar(1, { nombre: "x", descripcion: "y", cancelado: false })).ok).toBe(
      false
    );
    expect(
      await caso.ejecutar(42, { nombre: "Válido", descripcion: "y", cancelado: false })
    ).toEqual(err({ tipo: "NO_ENCONTRADO" }));
  });

  it("artistas: lista destacados y obtiene uno con sus eventos", async () => {
    const artista = unArtista({ slug: "dúo", destacado: true });
    const evento = unEvento({ artistas: [{ slug: "dúo", nombre: "Dúo" }] });
    const repo = new ArtistaRepositoryEnMemoria(
      [artista, unArtista()],
      new EventoRepositoryEnMemoria([evento])
    );
    expect(await new ListarArtistas(repo).ejecutar({ soloDestacados: true })).toHaveLength(1);
    expect(await new ListarArtistas(repo).ejecutar()).toHaveLength(2);
    const r = await new ObtenerArtista(repo).ejecutar("dúo");
    expect(r.ok && r.value.eventos).toHaveLength(1);
    expect((await new ObtenerArtista(repo).ejecutar("nadie")).ok).toBe(false);
  });

  it("BuscarEnFestival busca en eventos y artistas y valida la consulta", async () => {
    const gateway = new GatewayFalso(
      ok([unEvento({ nombre: "Noche de marimba" }), unEvento({ nombre: "Salsa" })])
    );
    const artistas = new ArtistaRepositoryEnMemoria(
      [unArtista({ nombre: "Marimba Tumaco Sur" })],
      new EventoRepositoryEnMemoria()
    );
    const caso = new BuscarEnFestival(gateway, artistas);
    const r = await caso.ejecutar("MARIMBA");
    expect(r.ok && [r.value.eventos.length, r.value.artistas.length]).toEqual([1, 1]);
    expect(await caso.ejecutar("a")).toEqual(err({ tipo: "CONSULTA_INVALIDA" }));
    gateway.respuesta = err({ tipo: "UPSTREAM_NO_DISPONIBLE", detalle: "x" });
    expect((await caso.ejecutar("salsa")).ok).toBe(false);
  });
});
