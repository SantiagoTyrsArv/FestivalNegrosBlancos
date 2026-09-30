# 0004. No activar `cacheComponents` (PPR)

- **Estado:** Aceptada
- **Fecha:** 2026-09-29

## Contexto

Next.js 16 ofrece `cacheComponents`, que activa Partial Prerendering (PPR):
cada ruta tiene un shell estático y las partes dinámicas llegan por streaming.
Es el modelo hacia el que va Next.js, y la ruta `/boletas/[eventoId]` encaja
con él.

Según la guía oficial (`node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`):

- Con el flag activo, las configuraciones de segmento `dynamic`, `revalidate`
  y `fetchCache` **dan error** y se sustituyen por `"use cache"` y `cacheLife`.
- Todas las páginas pasan a ser dinámicas por defecto.
- Llamadas como `new Date()` durante el prerender rompen el build si no están
  dentro de `<Suspense>` o de una función cacheada.

## Decisión

No activar `cacheComponents`. Se usa el modelo clásico (`revalidate`,
`dynamic`, `unstable_cache`, `revalidateTag`).

## Consecuencias

- Cada página declara su patrón con una línea visible, por ejemplo
  `export const revalidate = 60`, que es justo lo que el taller quiere enseñar y comparar.
  Con PPR la diferencia entre SSG, ISR y SSR queda difuminada.
- El `RenderProbe` puede usar `new Date()` para marcar cuándo se generó el
  HTML, que es la base del Observatorio ([0005](0005-observatorio.md)).
- La ruta híbrida `/boletas/[eventoId]` se resuelve sin PPR: la página es
  `force-dynamic`, el evento sale del Data Cache (`eventoCacheado`) y el cupo
  se calcula por petición dentro de `<Suspense>`. El resultado para el usuario
  es parecido (el shell se envía primero), aunque el shell no se sirve desde CDN.
- Si en el futuro se migra, hay que reemplazar las configuraciones de segmento
  siguiendo la guía citada y revisar este ADR.
