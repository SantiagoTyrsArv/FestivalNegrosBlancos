/**
 * Datos de demostración "quemados" en el código. TODOS son ficticios
 * (artistas, comparsas, personas, precios) y existen solo para ilustrar los
 * patrones de rendering. Se cargan en la BD libSQL en memoria al arrancar
 * cada proceso (ver client.ts) y también desde el script `pnpm db:seed`.
 */
import bcrypt from "bcryptjs";
import type { Db } from "./connection";
import * as s from "./schema";
import { toSlug } from "../shared/lib/formato";

/** Hora local del festival (UTC-5, sin horario de verano) → ISO UTC. */
function local(dia: string, hora: string): string {
  return new Date(`${dia}T${hora}:00-05:00`).toISOString();
}

const DIAS = ["2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05", "2027-01-06"] as const;
const [D1, D2, D3, D4, D5] = DIAS;

const ARTISTAS = [
  [
    "Los Herederos del Galeras",
    "Música andina",
    "Pasto, Nariño",
    true,
    "Quinteto de quenas, charangos y bombo que reinterpreta sanjuanitos y bambucos del sur con arreglos sinfónicos.",
  ],
  [
    "Marimba Tumaco Sur",
    "Currulao",
    "Tumaco, Nariño",
    true,
    "Agrupación de marimba de chonta y cantadoras que lleva el Pacífico nariñense a los escenarios andinos.",
  ],
  [
    "La Cumbia del Páramo",
    "Cumbia andina",
    "Ipiales, Nariño",
    true,
    "Banda que mezcla cumbia, guitarras eléctricas y zampoñas; su directo es una fiesta de principio a fin.",
  ],
  [
    "Sonora Guáitara",
    "Salsa",
    "Túquerres, Nariño",
    false,
    "Orquesta de salsa brava con doce músicos y una sección de vientos célebre en las verbenas del sur.",
  ],
  [
    "Chirimía Siete Colores",
    "Chirimía",
    "Sandoná, Nariño",
    false,
    "Chirimía tradicional de flautas de caña y tambores que acompaña desfiles desde hace tres generaciones.",
  ],
  [
    "Dúo Nevado",
    "Canción andina",
    "La Cruz, Nariño",
    false,
    "Dúo vocal de guitarra y tiple con repertorio de pasillos, huaynos y canciones propias.",
  ],
  [
    "Orquesta Ciudad Sorpresa",
    "Fusión",
    "Pasto, Nariño",
    false,
    "Colectivo de fusión electrónica y sonidos ancestrales que cierra cada noche con visuales proyectados.",
  ],
  [
    "Colectivo Quillasinga",
    "Música ancestral",
    "Valle de Atriz, Nariño",
    false,
    "Músicos e investigadores que recuperan cantos y danzas del pueblo Quillasinga.",
  ],
] as const;

const COMPARSAS = [
  [
    "Maravilla Andina",
    1985,
    "Miguel Á. Rosero",
    120,
    "Los paisajes andinos de Nariño en movimiento.",
    "Montañas y cóndores",
    "#c8102e",
  ],
  [
    "Fantasía del Volcán",
    1992,
    "Ana L. Córdoba",
    95,
    "Inspirada en la majestuosidad del volcán Galeras.",
    "Fuego y ceniza",
    "#e4572e",
  ],
  [
    "Sabores del Pacífico",
    1978,
    "Pedro Montaño",
    110,
    "La riqueza cultural del Pacífico nariñense.",
    "Mar y marimba",
    "#17806d",
  ],
  [
    "Mestizos de la Quebrada",
    2001,
    "Lucía Torres",
    80,
    "Los encuentros culturales de los valles del sur.",
    "Ríos que se encuentran",
    "#1f5aa6",
  ],
  [
    "Pasto Mágico",
    1969,
    "Carlos Guerrero",
    150,
    "Una de las comparsas más antiguas activas del carnaval.",
    "Leyendas de la ciudad",
    "#b8860b",
  ],
  [
    "Danzas del Putumayo",
    1995,
    "Esperanza Jurado",
    70,
    "Danzas tradicionales del alto Putumayo.",
    "Selva y yagé",
    "#6a2c91",
  ],
  [
    "Alegría Mestiza",
    2008,
    "Roberto Chaves",
    88,
    "Fusiona tradiciones indígenas con folclor mestizo.",
    "Máscaras dobles",
    "#d6246e",
  ],
  [
    "El Gran Cabildo",
    1955,
    "Luz M. Benavides",
    130,
    "Homenaje a los cabildos indígenas del territorio.",
    "Bastones de mando",
    "#3a2d8f",
  ],
  [
    "Blancos y Negros del Sur",
    1983,
    "Hernán Ñáñez",
    105,
    "La dualidad que da nombre al carnaval.",
    "Día y noche",
    "#1c1c1c",
  ],
  [
    "Colores de Ipiales",
    2003,
    "Sandra Enríquez",
    76,
    "Los colores y sabores del municipio de Ipiales.",
    "El santuario de piedra",
    "#c99700",
  ],
  [
    "Los Dorados",
    1990,
    "Jairo Muñoz",
    92,
    "Especialistas en trajes elaborados en tela dorada.",
    "Oro precolombino",
    "#a67c00",
  ],
  [
    "Ancestros del Sibundoy",
    1975,
    "Manuel Tisoy",
    84,
    "Los pueblos Inga y Kamëntsá del Valle de Sibundoy.",
    "Carnaval del perdón",
    "#3f7d3a",
  ],
  [
    "Niños del Futuro",
    2015,
    "Diana Pantoja",
    60,
    "Comparsa integrada por niñas, niños y jóvenes.",
    "Sueños de papel",
    "#e76f51",
  ],
  [
    "Jardín de las Flores",
    1998,
    "Cristina Arteaga",
    72,
    "Decoraciones florales tradicionales de la región.",
    "Flores del altiplano",
    "#2d9d6a",
  ],
  [
    "Cosmos Andino",
    2011,
    "Felipe Obando",
    66,
    "Cosmogonía andina y danza contemporánea.",
    "Sol, luna y chakana",
    "#7b3fe4",
  ],
] as const;

type Tipo = (typeof s.eventos.$inferInsert)["tipo"];
interface EventoSeed {
  nombre: string;
  tipo: Tipo;
  descripcion: string;
  dia: string;
  inicio: string;
  fin: string;
  escenario: 0 | 1 | 2;
  artistas?: number[];
  /** [nombre, cupoTotal, cupoVendido, precio en pesos] */
  sesiones: Array<[string, number, number, number]>;
}

const EVENTOS: EventoSeed[] = [
  {
    nombre: "Apertura: llegada del Carnavalito",
    tipo: "ceremonia",
    descripcion:
      "Ceremonia de apertura con el recibimiento de los niños y la lectura del bando del carnaval.",
    dia: D1,
    inicio: "17:00",
    fin: "19:00",
    escenario: 0,
    sesiones: [["Gradería", 800, 412, 15000]],
  },
  {
    nombre: "Noche de marimba",
    tipo: "concierto",
    descripcion: "El currulao del Pacífico abre la temporada de conciertos en la Tarima Mayor.",
    dia: D1,
    inicio: "20:00",
    fin: "22:30",
    escenario: 0,
    artistas: [1],
    sesiones: [
      ["General", 3000, 2981, 45000],
      ["Palco", 200, 200, 120000],
    ],
  },
  {
    nombre: "Taller de máscaras de papel maché",
    tipo: "taller",
    descripcion:
      "Artesanos del carnaval enseñan la técnica del papel maché y la pintura de máscaras.",
    dia: D2,
    inicio: "09:00",
    fin: "12:00",
    escenario: 2,
    sesiones: [["Cupo taller", 40, 37, 20000]],
  },
  {
    nombre: "Canto del páramo",
    tipo: "concierto",
    descripcion: "Cumbia andina, zampoñas y guitarras eléctricas bajo el cielo de enero.",
    dia: D2,
    inicio: "20:00",
    fin: "22:30",
    escenario: 0,
    artistas: [2],
    sesiones: [
      ["General", 3000, 1540, 45000],
      ["Palco", 200, 88, 120000],
    ],
  },
  {
    nombre: "Taller de danza tradicional",
    tipo: "taller",
    descripcion: "Pasos básicos de sanjuanito y bambuco para todas las edades.",
    dia: D2,
    inicio: "15:00",
    fin: "17:00",
    escenario: 1,
    sesiones: [["Cupo taller", 60, 21, 10000]],
  },
  {
    nombre: "Desfile del Canto a la Tierra",
    tipo: "desfile",
    descripcion:
      "Colectivos coreográficos recorren la senda del carnaval con danzas dedicadas a la tierra.",
    dia: D3,
    inicio: "10:00",
    fin: "15:00",
    escenario: 0,
    sesiones: [["Tribuna Senda", 1500, 1203, 30000]],
  },
  {
    nombre: "Taller de música andina",
    tipo: "taller",
    descripcion: "Introducción a la quena, el charango y el bombo con maestros de la región.",
    dia: D3,
    inicio: "10:00",
    fin: "13:00",
    escenario: 2,
    sesiones: [["Cupo taller", 30, 30, 20000]],
  },
  {
    nombre: "Salsa en el Valle de Atriz",
    tipo: "concierto",
    descripcion: "Salsa brava con una de las orquestas más queridas del sur.",
    dia: D3,
    inicio: "19:00",
    fin: "21:00",
    escenario: 1,
    artistas: [3],
    sesiones: [["General", 1800, 640, 40000]],
  },
  {
    nombre: "Fusión bajo el volcán",
    tipo: "concierto",
    descripcion: "Electrónica y sonidos ancestrales con visuales proyectados sobre la plaza.",
    dia: D3,
    inicio: "21:30",
    fin: "23:30",
    escenario: 0,
    artistas: [6, 7],
    sesiones: [
      ["General", 3000, 2102, 50000],
      ["Palco", 200, 196, 140000],
    ],
  },
  {
    nombre: "Día de Negros: juego tradicional",
    tipo: "desfile",
    descripcion:
      "El día en que la ciudad se pinta de negro en señal de igualdad: juego, música y cosmético.",
    dia: D4,
    inicio: "10:00",
    fin: "17:00",
    escenario: 0,
    artistas: [4],
    sesiones: [["Tribuna Senda", 1500, 1498, 30000]],
  },
  {
    nombre: "Noche ancestral",
    tipo: "concierto",
    descripcion: "Cantos y danzas Quillasinga en un concierto íntimo al aire libre.",
    dia: D4,
    inicio: "19:00",
    fin: "21:00",
    escenario: 1,
    artistas: [7],
    sesiones: [["General", 1800, 312, 30000]],
  },
  {
    nombre: "Gran concierto andino",
    tipo: "concierto",
    descripcion: "Quenas, charangos y orquesta en la noche más esperada por el público local.",
    dia: D4,
    inicio: "20:00",
    fin: "23:00",
    escenario: 0,
    artistas: [0, 5],
    sesiones: [
      ["General", 3000, 2440, 55000],
      ["Palco", 200, 150, 150000],
    ],
  },
  {
    nombre: "Gran Desfile Magno",
    tipo: "desfile",
    descripcion:
      "El Día de Blancos: carrozas, comparsas y murgas recorren la senda en el desfile principal.",
    dia: D5,
    inicio: "09:00",
    fin: "17:00",
    escenario: 0,
    sesiones: [
      ["Tribuna Senda", 2500, 2210, 60000],
      ["Tribuna Preferencial", 400, 399, 150000],
    ],
  },
  {
    nombre: "Premiación del concurso",
    tipo: "ceremonia",
    descripcion: "Entrega de reconocimientos a comparsas, carrozas y colectivos coreográficos.",
    dia: D5,
    inicio: "17:30",
    fin: "19:00",
    escenario: 2,
    sesiones: [["Invitados", 500, 140, 0]],
  },
  {
    nombre: "Cierre con la Sonora",
    tipo: "concierto",
    descripcion: "La gran verbena de cierre del carnaval.",
    dia: D5,
    inicio: "20:00",
    fin: "23:00",
    escenario: 0,
    artistas: [3, 2],
    sesiones: [
      ["General", 3000, 900, 50000],
      ["Palco", 200, 40, 130000],
    ],
  },
  {
    nombre: "Serenata de despedida",
    tipo: "concierto",
    descripcion: "Pasillos y huaynos para despedir el carnaval en un formato acústico.",
    dia: D5,
    inicio: "20:30",
    fin: "22:30",
    escenario: 1,
    artistas: [5],
    sesiones: [["General", 1800, 1799, 35000]],
  },
  {
    nombre: "Chirimía por las calles",
    tipo: "desfile",
    descripcion: "Recorrido musical de chirimías por el centro histórico.",
    dia: D2,
    inicio: "11:00",
    fin: "13:00",
    escenario: 1,
    artistas: [4],
    sesiones: [],
  },
  {
    nombre: "Clausura: quema del año viejo del carnaval",
    tipo: "ceremonia",
    descripcion:
      "Cierre oficial con fuegos artificiales y el traspaso simbólico a la siguiente edición.",
    dia: D5,
    inicio: "23:15",
    fin: "23:59",
    escenario: 0,
    sesiones: [],
  },
];

export interface ResumenSemilla {
  eventos: number;
  artistas: number;
  comparsas: number;
  escenarios: number;
  sesiones: number;
}

/** Vacía las tablas y las vuelve a poblar (idempotente). */
export async function poblarDatosDemo(db: Db): Promise<ResumenSemilla> {
  // Orden inverso a las dependencias de claves foráneas.
  for (const tabla of [
    s.medicionesRender,
    s.ajustes,
    s.agendaItems,
    s.boletas,
    s.resultados,
    s.sesionesBoleteria,
    s.eventoArtistas,
    s.eventos,
    s.comparsas,
    s.artistas,
    s.escenarios,
    s.usuarios,
    s.ediciones,
  ]) {
    await db.delete(tabla);
  }

  const [edicion] = await db
    .insert(s.ediciones)
    .values({
      anio: 2027,
      nombre: "Carnaval de Blancos y Negros 2027",
      fechaInicio: D1,
      fechaFin: D5,
    })
    .returning();
  if (!edicion) throw new Error("No se creó la edición");

  const escenarios = await db
    .insert(s.escenarios)
    .values([
      {
        slug: "tarima-mayor",
        nombre: "Tarima Mayor",
        descripcion: "Escenario principal frente a la plaza central.",
        capacidad: 3200,
        ubicacion: "Plaza central",
      },
      {
        slug: "tarima-del-valle",
        nombre: "Tarima del Valle",
        descripcion: "Escenario mediano para conciertos y danzas.",
        capacidad: 1800,
        ubicacion: "Avenida de los Estudiantes",
      },
      {
        slug: "casa-del-carnaval",
        nombre: "Casa del Carnaval",
        descripcion: "Espacio cubierto para talleres y ceremonias.",
        capacidad: 500,
        ubicacion: "Centro histórico",
      },
    ])
    .returning();

  const artistas = await db
    .insert(s.artistas)
    .values(
      ARTISTAS.map(([nombre, genero, origen, destacado, biografia]) => ({
        slug: toSlug(nombre),
        nombre,
        genero,
        origen,
        destacado,
        biografia,
      }))
    )
    .returning();

  const comparsas = await db
    .insert(s.comparsas)
    .values(
      COMPARSAS.map(([nombre, fundacion, director, integrantes, descripcion, motivo, color]) => ({
        slug: toSlug(nombre),
        nombre,
        fundacion,
        director,
        integrantes,
        descripcion,
        motivo,
        color,
      }))
    )
    .returning();

  let totalSesiones = 0;
  for (const e of EVENTOS) {
    const escenario = escenarios[e.escenario];
    if (!escenario) throw new Error(`Escenario ${e.escenario} inexistente`);
    const [evento] = await db
      .insert(s.eventos)
      .values({
        edicionId: edicion.id,
        escenarioId: escenario.id,
        nombre: e.nombre,
        tipo: e.tipo,
        descripcion: e.descripcion,
        inicio: local(e.dia, e.inicio),
        fin: local(e.dia, e.fin),
      })
      .returning();
    if (!evento) throw new Error(`No se creó el evento ${e.nombre}`);

    for (const indice of e.artistas ?? []) {
      const artista = artistas[indice];
      if (artista)
        await db.insert(s.eventoArtistas).values({ eventoId: evento.id, artistaId: artista.id });
    }
    for (const [nombre, cupoTotal, cupoVendido, precio] of e.sesiones) {
      await db.insert(s.sesionesBoleteria).values({
        eventoId: evento.id,
        nombre,
        cupoTotal,
        cupoVendido,
        precioCentavos: precio * 100,
        moneda: "COP",
      });
      totalSesiones++;
    }
  }

  const categorias = ["Comparsas", "Colectivos coreográficos"] as const;
  await db.insert(s.resultados).values(
    comparsas.slice(0, 10).map((c, i) => ({
      edicionId: edicion.id,
      comparsaId: c.id,
      categoria: categorias[i < 5 ? 0 : 1],
      puntajeCentesimas: 9550 - i * 137,
      // Los 6 primeros ya están publicados; el resto queda pendiente para
      // publicarlo desde /admin y demostrar la revalidación on-demand.
      publicado: i < 6,
      publicadoEn: i < 6 ? new Date().toISOString() : null,
    }))
  );

  await db.insert(s.usuarios).values([
    {
      email: "admin@carnaval.test",
      nombre: "Admin del Carnaval",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      rol: "admin",
    },
    {
      email: "asistente@carnaval.test",
      nombre: "Ana Asistente",
      passwordHash: await bcrypt.hash("Asistente123!", 10),
      rol: "asistente",
    },
  ]);

  await db.insert(s.ajustes).values({ clave: "modo_caos", valor: "ninguno" });

  return {
    eventos: EVENTOS.length,
    artistas: artistas.length,
    comparsas: comparsas.length,
    escenarios: escenarios.length,
    sesiones: totalSesiones,
  };
}
