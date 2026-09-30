CREATE TABLE `agenda_items` (
	`usuario_id` integer NOT NULL,
	`evento_id` integer NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`usuario_id`, `evento_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ajustes` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`actualizado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `artistas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nombre` text NOT NULL,
	`genero` text NOT NULL,
	`origen` text NOT NULL,
	`biografia` text NOT NULL,
	`destacado` integer DEFAULT false NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artistas_slug_unique` ON `artistas` (`slug`);--> statement-breakpoint
CREATE TABLE `boletas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`sesion_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`cantidad` integer NOT NULL,
	`total_centavos` integer NOT NULL,
	`moneda` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`sesion_id`) REFERENCES `sesiones_boleteria`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boletas_codigo_unique` ON `boletas` (`codigo`);--> statement-breakpoint
CREATE INDEX `boletas_usuario_idx` ON `boletas` (`usuario_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `boletas_idempotencia_idx` ON `boletas` (`usuario_id`,`idempotency_key`);--> statement-breakpoint
CREATE TABLE `comparsas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nombre` text NOT NULL,
	`fundacion` integer NOT NULL,
	`director` text NOT NULL,
	`integrantes` integer NOT NULL,
	`descripcion` text NOT NULL,
	`motivo` text NOT NULL,
	`color` text NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comparsas_slug_unique` ON `comparsas` (`slug`);--> statement-breakpoint
CREATE TABLE `ediciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`anio` integer NOT NULL,
	`nombre` text NOT NULL,
	`fecha_inicio` text NOT NULL,
	`fecha_fin` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ediciones_anio_unique` ON `ediciones` (`anio`);--> statement-breakpoint
CREATE TABLE `escenarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text NOT NULL,
	`capacidad` integer NOT NULL,
	`ubicacion` text NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `escenarios_slug_unique` ON `escenarios` (`slug`);--> statement-breakpoint
CREATE TABLE `evento_artistas` (
	`evento_id` integer NOT NULL,
	`artista_id` integer NOT NULL,
	PRIMARY KEY(`evento_id`, `artista_id`),
	FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artista_id`) REFERENCES `artistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `eventos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`edicion_id` integer NOT NULL,
	`escenario_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text NOT NULL,
	`descripcion` text NOT NULL,
	`inicio` text NOT NULL,
	`fin` text NOT NULL,
	`cancelado` integer DEFAULT false NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`actualizado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edicion_id`) REFERENCES `ediciones`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`escenario_id`) REFERENCES `escenarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `eventos_inicio_idx` ON `eventos` (`inicio`);--> statement-breakpoint
CREATE TABLE `mediciones_render` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ruta` text NOT NULL,
	`patron` text NOT NULL,
	`origen` text NOT NULL,
	`generado_en` text NOT NULL,
	`tiempo_render_ms` integer,
	`estado_cache` text NOT NULL,
	`en_html_inicial` integer,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mediciones_ruta_idx` ON `mediciones_render` (`ruta`,`id`);--> statement-breakpoint
CREATE TABLE `resultados` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`edicion_id` integer NOT NULL,
	`comparsa_id` integer NOT NULL,
	`categoria` text NOT NULL,
	`puntaje_centesimas` integer NOT NULL,
	`publicado` integer DEFAULT false NOT NULL,
	`publicado_en` text,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edicion_id`) REFERENCES `ediciones`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comparsa_id`) REFERENCES `comparsas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resultados_unicos_idx` ON `resultados` (`edicion_id`,`comparsa_id`,`categoria`);--> statement-breakpoint
CREATE TABLE `sesiones_boleteria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evento_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`cupo_total` integer NOT NULL,
	`cupo_vendido` integer DEFAULT 0 NOT NULL,
	`precio_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'COP' NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cupo_no_negativo" CHECK("sesiones_boleteria"."cupo_vendido" >= 0),
	CONSTRAINT "cupo_no_excedido" CHECK("sesiones_boleteria"."cupo_vendido" <= "sesiones_boleteria"."cupo_total")
);
--> statement-breakpoint
CREATE INDEX `sesiones_evento_idx` ON `sesiones_boleteria` (`evento_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nombre` text NOT NULL,
	`password_hash` text NOT NULL,
	`rol` text DEFAULT 'asistente' NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);