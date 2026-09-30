# 0002. Datos quemados en memoria, sin base de datos

- **Estado:** Aceptada (reemplaza el uso de Turso/libSQL con Drizzle)
- **Fecha:** 2026-09-30

## Contexto

La primera versión guardaba los datos en Turso (libSQL) con Drizzle ORM. Eso
exigía migraciones, un script de carga, variables de entorno y una cuenta
externa, y nada de eso aporta al objetivo del taller: entender los patrones de
rendering. Además complicaba ejecutar el proyecto en otra máquina.

## Decisión

- Todos los datos son ficticios y están en `src/datos/catalogo.ts`.
  `crearCatalogo()` devuelve una copia nueva cada vez, lista para mutar.
- Cada puerto de repositorio tiene una implementación en memoria
  (`infrastructure/*-en-memoria.ts`). Los tests usan esas mismas clases.
- El contenedor se guarda en `globalThis` para que páginas, Route Handlers,
  Server Actions y recargas en caliente compartan el mismo estado.
- La sesión es de demostración: la cookie guarda el id del usuario firmado con
  HMAC (`firma-sesion.ts`) y las contraseñas de las cuentas demo se comparan
  tal cual.

## Consecuencias

- `pnpm install && pnpm dev` basta para ejecutar el proyecto; no hay servicios
  externos ni variables obligatorias.
- Las compras, la agenda, los resultados publicados y el Modo Caos se pierden
  al reiniciar el servidor. Es aceptable en una demo y hace las pruebas repetibles.
- Solo funciona con **una** instancia del servidor. En un despliegue serverless
  con varias instancias cada una tendría su propio estado; para producción
  habría que volver a una base de datos, implementando los mismos puertos.
- La compra sigue siendo atómica: `registrarCompra` comprueba y descuenta el
  cupo sin ningún `await` intermedio, así que el event loop de Node no puede
  intercalar otra compra.
