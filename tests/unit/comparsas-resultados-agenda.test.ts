import { describe, expect, it } from "vitest";
import {
  AgregarAAgenda,
  QuitarDeAgenda,
  VerAgenda,
} from "@/modules/agenda/application/casos-de-uso";
import {
  MAXIMO_ITEMS_AGENDA,
  detectarConflictos,
  puedeAgregar,
} from "@/modules/agenda/domain/agenda";
import {
  ListarComparsas,
  ObtenerComparsa,
  ObtenerEstadoEnVivo,
} from "@/modules/comparsas/application/casos-de-uso";
import { aniosDeTrayectoria, type Comparsa } from "@/modules/comparsas/domain/comparsa";
import {
  LARGO_TOTAL,
  RECORRIDO,
  hitoAlcanzado,
  puntoEnRecorrido,
} from "@/modules/comparsas/domain/recorrido";
import { simularPosiciones } from "@/modules/comparsas/domain/simulacion-en-vivo";
import {
  ListarResultadosAdmin,
  ListarResultadosPublicados,
  PublicarResultado,
} from "@/modules/resultados/application/casos-de-uso";
import { clasificar, type Resultado } from "@/modules/resultados/domain/resultado";
import { err, ok } from "@/shared/lib/result";
import {
  AgendaRepositoryEnMemoria,
  ComparsaRepositoryEnMemoria,
  EventoRepositoryEnMemoria,
  GatewayFalso,
  ResultadoRepositoryEnMemoria,
  unEvento,
} from "../fakes";

const comparsa = (slug: string): Comparsa => ({
  id: slug.length,
  slug,
  nombre: slug.toUpperCase(),
  fundacion: 1990,
  director: "D",
  integrantes: 50,
  descripcion: "d",
  motivo: "m",
  color: "#000000",
});

describe("comparsas y recorrido", () => {
  it("calcula años de trayectoria sin negativos", () => {
    expect(aniosDeTrayectoria({ fundacion: 1990 }, 2027)).toBe(37);
    expect(aniosDeTrayectoria({ fundacion: 2030 }, 2027)).toBe(0);
  });

  it("interpola puntos del recorrido en los extremos y acota el progreso", () => {
    const primero = RECORRIDO[0];
    const ultimo = RECORRIDO.at(-1);
    expect(puntoEnRecorrido(0)).toEqual({ x: primero?.x, y: primero?.y });
    expect(puntoEnRecorrido(1.5)).toEqual({ x: ultimo?.x, y: ultimo?.y });
    expect(LARGO_TOTAL).toBeGreaterThan(0);
    expect(hitoAlcanzado(0).nombre).toBe(primero?.nombre);
    expect(hitoAlcanzado(1).nombre).toBe(ultimo?.nombre);
  });

  it("simula posiciones deterministas y escalonadas", () => {
    const lista = ["a", "b", "c"].map(comparsa);
    const config = { periodoMs: 1000, separacion: 0.1 };
    const inicio = simularPosiciones(lista, new Date(0), config);
    expect(inicio.map((p) => p.estado)).toEqual(["desfilando", "en-espera", "en-espera"]);
    const mitad = simularPosiciones(lista, new Date(500), config);
    expect(mitad[0]?.progreso).toBeGreaterThan(mitad[1]?.progreso ?? 1);
    const casiFin = simularPosiciones(lista, new Date(999), config);
    expect(casiFin[0]?.estado).toBe("finalizado");
    expect(simularPosiciones(lista, new Date(1500), config)).toEqual(mitad);
  });

  it("lista, obtiene y compone el estado en vivo con la programación", async () => {
    const repo = new ComparsaRepositoryEnMemoria([comparsa("x")]);
    expect(await new ListarComparsas(repo, 2027).ejecutar()).toHaveLength(1);
    expect((await new ObtenerComparsa(repo, 2027).ejecutar("x")).ok).toBe(true);
    expect(await new ObtenerComparsa(repo, 2027).ejecutar("y")).toEqual(
      err({ tipo: "NO_ENCONTRADO" })
    );

    const pasado = unEvento({
      inicio: new Date("2020-01-01T00:00:00Z"),
      fin: new Date("2020-01-01T01:00:00Z"),
    });
    const cancelado = unEvento({ cancelado: true, inicio: new Date("2027-01-01T00:00:00Z") });
    const futuro = unEvento({
      nombre: "Siguiente",
      inicio: new Date("2027-01-02T00:00:00Z"),
      fin: new Date("2027-01-02T02:00:00Z"),
    });
    const gateway = new GatewayFalso(ok([futuro, cancelado, pasado]));
    const caso = new ObtenerEstadoEnVivo(repo, gateway, () => new Date("2026-10-01T00:00:00Z"));
    const r = await caso.ejecutar();
    expect(r.ok && r.value).toMatchObject({
      simulado: true,
      proximoEvento: { nombre: "Siguiente" },
    });
    expect(r.ok && r.value.posiciones).toHaveLength(1);

    gateway.respuesta = err({ tipo: "UPSTREAM_NO_DISPONIBLE", detalle: "caos" });
    expect((await caso.ejecutar()).ok).toBe(false);
  });
});

const resultado = (
  id: number,
  categoria: string,
  puntaje: number,
  nombre: string,
  publicado = true
): Resultado => ({
  id,
  comparsa: { slug: nombre, nombre, color: "#111111" },
  categoria,
  puntajeCentesimas: puntaje,
  publicado,
  publicadoEn: publicado ? new Date("2027-01-06T00:00:00Z") : null,
});

describe("resultados", () => {
  it("clasifica con ranking de competición y empates deterministas", () => {
    const tablas = clasificar([
      resultado(1, "Comparsas", 9000, "Beta"),
      resultado(2, "Comparsas", 9500, "Alfa"),
      resultado(3, "Comparsas", 9000, "Aurora"),
      resultado(4, "Comparsas", 8000, "Delta"),
      resultado(5, "Colectivos", 7000, "Zeta"),
    ]);
    expect(tablas.map((t) => t.categoria)).toEqual(["Colectivos", "Comparsas"]);
    const comparsas = tablas[1]?.posiciones.map((p) => [p.puesto, p.resultado.comparsa.nombre]);
    expect(comparsas).toEqual([
      [1, "Alfa"],
      [2, "Aurora"],
      [2, "Beta"],
      [4, "Delta"],
    ]);
  });

  it("lista solo publicados, lista todo para admin y publica una vez", async () => {
    const repo = new ResultadoRepositoryEnMemoria([
      resultado(1, "C", 9000, "A"),
      resultado(2, "C", 8000, "B", false),
    ]);
    expect((await new ListarResultadosPublicados(repo).ejecutar())[0]?.posiciones).toHaveLength(1);
    expect(await new ListarResultadosAdmin(repo).ejecutar()).toHaveLength(2);
    const publicar = new PublicarResultado(repo, () => new Date("2027-01-06T20:00:00Z"));
    expect(await publicar.ejecutar(2)).toEqual(ok({ id: 2 }));
    expect(await publicar.ejecutar(2)).toEqual(err({ tipo: "YA_PUBLICADO" }));
    expect(await publicar.ejecutar(9)).toEqual(err({ tipo: "NO_ENCONTRADO" }));
    expect((await new ListarResultadosPublicados(repo).ejecutar())[0]?.posiciones).toHaveLength(2);
  });
});

describe("agenda", () => {
  it("aplica las reglas para agregar eventos", () => {
    expect(puedeAgregar([], null)).toEqual(err({ tipo: "EVENTO_NO_ENCONTRADO" }));
    expect(puedeAgregar([1], { id: 1, cancelado: true })).toEqual(ok({ yaEstaba: true }));
    expect(puedeAgregar([], { id: 1, cancelado: true })).toEqual(err({ tipo: "EVENTO_CANCELADO" }));
    const llena = Array.from({ length: MAXIMO_ITEMS_AGENDA }, (_, i) => i + 100);
    expect(puedeAgregar(llena, { id: 1, cancelado: false })).toEqual(
      err({ tipo: "AGENDA_LLENA", maximo: MAXIMO_ITEMS_AGENDA })
    );
    expect(puedeAgregar([], { id: 1, cancelado: false })).toEqual(ok({ yaEstaba: false }));
  });

  it("detecta conflictos de horario", () => {
    const h = (x: string) => new Date(`2027-01-02T${x}:00Z`);
    expect(
      detectarConflictos([
        { id: 1, inicio: h("10:00"), fin: h("12:00") },
        { id: 2, inicio: h("11:00"), fin: h("13:00") },
        { id: 3, inicio: h("13:00"), fin: h("14:00") },
      ])
    ).toEqual([[1, 2]]);
  });

  it("agrega (idempotente), muestra con conflictos y quita", async () => {
    const e1 = unEvento({
      id: 1,
      inicio: new Date("2027-01-02T10:00:00Z"),
      fin: new Date("2027-01-02T12:00:00Z"),
    });
    const e2 = unEvento({
      id: 2,
      inicio: new Date("2027-01-02T11:00:00Z"),
      fin: new Date("2027-01-02T13:00:00Z"),
    });
    const eventos = new EventoRepositoryEnMemoria([e1, e2]);
    const agenda = new AgendaRepositoryEnMemoria();
    const agregar = new AgregarAAgenda(agenda, eventos);
    expect(await agregar.ejecutar(1, 1)).toEqual(ok({ eventoId: 1 }));
    await agregar.ejecutar(1, 1);
    await agregar.ejecutar(1, 2);
    expect((await agregar.ejecutar(1, 99)).ok).toBe(false);
    const vista = await new VerAgenda(agenda, eventos).ejecutar(1);
    expect(vista.eventos.map((e) => e.id)).toEqual([1, 2]);
    expect(vista.conflictos).toEqual([[1, 2]]);
    await new QuitarDeAgenda(agenda).ejecutar(1, 1);
    expect((await new VerAgenda(agenda, eventos).ejecutar(1)).eventos).toHaveLength(1);
  });
});
