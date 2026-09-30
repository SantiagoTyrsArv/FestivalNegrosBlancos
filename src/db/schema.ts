import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Esquema de persistencia. Convenciones:
 * - Fechas: texto ISO 8601 en UTC (la zona del festival solo se aplica al presentar).
 * - Dinero: enteros en centavos + código de moneda explícito.
 * - Puntajes: enteros en centésimas (9550 = 95,50) para evitar errores de coma flotante.
 * Las filas de estas tablas NUNCA salen de la capa de infraestructura: los
 * repositorios las convierten a entidades de dominio mediante mappers.
 */

const marcaTiempo = (columna: string) =>
  text(columna)
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

export const ediciones = sqliteTable("ediciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  anio: integer("anio").notNull().unique(),
  nombre: text("nombre").notNull(),
  fechaInicio: text("fecha_inicio").notNull(),
  fechaFin: text("fecha_fin").notNull(),
  activa: integer("activa", { mode: "boolean" }).notNull().default(true),
  creadoEn: marcaTiempo("creado_en"),
});

export const escenarios = sqliteTable("escenarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  capacidad: integer("capacidad").notNull(),
  ubicacion: text("ubicacion").notNull(),
  creadoEn: marcaTiempo("creado_en"),
});

export const artistas = sqliteTable("artistas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  genero: text("genero").notNull(),
  origen: text("origen").notNull(),
  biografia: text("biografia").notNull(),
  destacado: integer("destacado", { mode: "boolean" }).notNull().default(false),
  creadoEn: marcaTiempo("creado_en"),
});

export const comparsas = sqliteTable("comparsas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  fundacion: integer("fundacion").notNull(),
  director: text("director").notNull(),
  integrantes: integer("integrantes").notNull(),
  descripcion: text("descripcion").notNull(),
  motivo: text("motivo").notNull(),
  color: text("color").notNull(),
  creadoEn: marcaTiempo("creado_en"),
});

export const eventos = sqliteTable(
  "eventos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    edicionId: integer("edicion_id")
      .notNull()
      .references(() => ediciones.id),
    escenarioId: integer("escenario_id")
      .notNull()
      .references(() => escenarios.id),
    nombre: text("nombre").notNull(),
    tipo: text("tipo", { enum: ["concierto", "desfile", "ceremonia", "taller"] }).notNull(),
    descripcion: text("descripcion").notNull(),
    inicio: text("inicio").notNull(),
    fin: text("fin").notNull(),
    cancelado: integer("cancelado", { mode: "boolean" }).notNull().default(false),
    creadoEn: marcaTiempo("creado_en"),
    actualizadoEn: marcaTiempo("actualizado_en"),
  },
  (t) => [index("eventos_inicio_idx").on(t.inicio)]
);

export const eventoArtistas = sqliteTable(
  "evento_artistas",
  {
    eventoId: integer("evento_id")
      .notNull()
      .references(() => eventos.id, { onDelete: "cascade" }),
    artistaId: integer("artista_id")
      .notNull()
      .references(() => artistas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventoId, t.artistaId] })]
);

/** Sesión de boletería (una localidad/franja vendible de un evento). */
export const sesionesBoleteria = sqliteTable(
  "sesiones_boleteria",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventoId: integer("evento_id")
      .notNull()
      .references(() => eventos.id),
    nombre: text("nombre").notNull(),
    cupoTotal: integer("cupo_total").notNull(),
    cupoVendido: integer("cupo_vendido").notNull().default(0),
    precioCentavos: integer("precio_centavos").notNull(),
    moneda: text("moneda").notNull().default("COP"),
    creadoEn: marcaTiempo("creado_en"),
  },
  (t) => [
    index("sesiones_evento_idx").on(t.eventoId),
    // Defensa en profundidad: aunque la regla vive en el dominio y en la
    // transacción de compra, la BD también rechaza cualquier sobreventa.
    check("cupo_no_negativo", sql`${t.cupoVendido} >= 0`),
    check("cupo_no_excedido", sql`${t.cupoVendido} <= ${t.cupoTotal}`),
  ]
);

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "asistente"] })
    .notNull()
    .default("asistente"),
  creadoEn: marcaTiempo("creado_en"),
});

export const boletas = sqliteTable(
  "boletas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codigo: text("codigo").notNull().unique(),
    sesionId: integer("sesion_id")
      .notNull()
      .references(() => sesionesBoleteria.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    cantidad: integer("cantidad").notNull(),
    totalCentavos: integer("total_centavos").notNull(),
    moneda: text("moneda").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    creadoEn: marcaTiempo("creado_en"),
  },
  (t) => [
    index("boletas_usuario_idx").on(t.usuarioId),
    uniqueIndex("boletas_idempotencia_idx").on(t.usuarioId, t.idempotencyKey),
  ]
);

export const resultados = sqliteTable(
  "resultados",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    edicionId: integer("edicion_id")
      .notNull()
      .references(() => ediciones.id),
    comparsaId: integer("comparsa_id")
      .notNull()
      .references(() => comparsas.id),
    categoria: text("categoria").notNull(),
    puntajeCentesimas: integer("puntaje_centesimas").notNull(),
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(false),
    publicadoEn: text("publicado_en"),
    creadoEn: marcaTiempo("creado_en"),
  },
  (t) => [uniqueIndex("resultados_unicos_idx").on(t.edicionId, t.comparsaId, t.categoria)]
);

export const agendaItems = sqliteTable(
  "agenda_items",
  {
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    eventoId: integer("evento_id")
      .notNull()
      .references(() => eventos.id, { onDelete: "cascade" }),
    creadoEn: marcaTiempo("creado_en"),
  },
  (t) => [primaryKey({ columns: [t.usuarioId, t.eventoId] })]
);

/** Ajustes de sistema modificables en caliente (p. ej. el Modo Caos). */
export const ajustes = sqliteTable("ajustes", {
  clave: text("clave").primaryKey(),
  valor: text("valor").notNull(),
  actualizadoEn: marcaTiempo("actualizado_en"),
});

/** Mediciones del Observatorio de Rendering (retención limitada). */
export const medicionesRender = sqliteTable(
  "mediciones_render",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ruta: text("ruta").notNull(),
    patron: text("patron").notNull(),
    /** "render": el servidor ejecutó el componente. "vista": un navegador mostró la página. */
    origen: text("origen", { enum: ["render", "vista"] }).notNull(),
    generadoEn: text("generado_en").notNull(),
    tiempoRenderMs: integer("tiempo_render_ms"),
    estadoCache: text("estado_cache").notNull(),
    enHtmlInicial: integer("en_html_inicial", { mode: "boolean" }),
    creadoEn: marcaTiempo("creado_en"),
  },
  (t) => [index("mediciones_ruta_idx").on(t.ruta, t.id)]
);
