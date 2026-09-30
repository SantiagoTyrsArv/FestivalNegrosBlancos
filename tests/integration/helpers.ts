import { abrirConexion, aplicarMigraciones, type Conexion } from "@/db/connection";
import * as s from "@/db/schema";

/** BD SQLite en memoria con el esquema real (migraciones) y un conjunto mínimo de datos. */
export async function crearBdPrueba(): Promise<Conexion> {
  const conexion = abrirConexion({ url: ":memory:" });
  await aplicarMigraciones(conexion);
  const { db } = conexion;

  await db.insert(s.ediciones).values({
    id: 1,
    anio: 2027,
    nombre: "Test",
    fechaInicio: "2027-01-02",
    fechaFin: "2027-01-06",
  });
  await db.insert(s.escenarios).values({
    id: 1,
    slug: "tarima",
    nombre: "Tarima",
    descripcion: "d",
    capacidad: 100,
    ubicacion: "u",
  });
  await db.insert(s.artistas).values([
    {
      id: 1,
      slug: "marimba",
      nombre: "Marimba Sur",
      genero: "Currulao",
      origen: "Tumaco",
      biografia: "b",
      destacado: true,
    },
    {
      id: 2,
      slug: "duo",
      nombre: "Dúo Nevado",
      genero: "Andina",
      origen: "La Cruz",
      biografia: "b",
    },
  ]);
  await db.insert(s.eventos).values([
    {
      id: 1,
      edicionId: 1,
      escenarioId: 1,
      nombre: "Noche de marimba",
      tipo: "concierto",
      descripcion: "d",
      inicio: "2027-01-03T01:00:00.000Z",
      fin: "2027-01-03T03:00:00.000Z",
    },
    {
      id: 2,
      edicionId: 1,
      escenarioId: 1,
      nombre: "Desfile",
      tipo: "desfile",
      descripcion: "d",
      inicio: "2027-01-02T15:00:00.000Z",
      fin: "2027-01-02T20:00:00.000Z",
    },
    {
      id: 3,
      edicionId: 1,
      escenarioId: 1,
      nombre: "Taller",
      tipo: "taller",
      descripcion: "d",
      inicio: "2027-01-04T15:00:00.000Z",
      fin: "2027-01-04T17:00:00.000Z",
    },
  ]);
  await db.insert(s.eventoArtistas).values([
    { eventoId: 1, artistaId: 1 },
    { eventoId: 1, artistaId: 2 },
  ]);
  await db.insert(s.sesionesBoleteria).values([
    {
      id: 1,
      eventoId: 1,
      nombre: "General",
      cupoTotal: 10,
      cupoVendido: 0,
      precioCentavos: 4_500_000,
      moneda: "COP",
    },
    {
      id: 2,
      eventoId: 1,
      nombre: "Palco",
      cupoTotal: 2,
      cupoVendido: 2,
      precioCentavos: 12_000_000,
      moneda: "COP",
    },
  ]);
  await db.insert(s.usuarios).values([
    { id: 1, email: "a@test.com", nombre: "A", passwordHash: "x" },
    { id: 2, email: "b@test.com", nombre: "B", passwordHash: "x" },
  ]);
  await db.insert(s.comparsas).values({
    id: 1,
    slug: "maravilla",
    nombre: "Maravilla",
    fundacion: 1985,
    director: "D",
    integrantes: 10,
    descripcion: "d",
    motivo: "m",
    color: "#c8102e",
  });
  await db.insert(s.resultados).values([
    {
      edicionId: 1,
      comparsaId: 1,
      categoria: "Comparsas",
      puntajeCentesimas: 9000,
      publicado: true,
      publicadoEn: "2027-01-06T00:00:00.000Z",
    },
    {
      edicionId: 1,
      comparsaId: 1,
      categoria: "Colectivos",
      puntajeCentesimas: 8000,
      publicado: false,
    },
  ]);
  return conexion;
}
