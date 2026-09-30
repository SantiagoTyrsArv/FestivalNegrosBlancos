# 0005. Observatorio de rendering y sus límites

- **Estado:** Aceptada
- **Fecha:** 2026-09-29

## Contexto

Declarar `revalidate = 60` no demuestra que la página se comporte como ISR.
Queríamos una forma de **observar** el patrón real de cada ruta en vez de
creer lo que dice el código.

## Decisión

Cada página termina con `<RenderProbe>` (`src/observability/ui/RenderProbe.tsx`):

1. **Render (servidor):** guarda la hora de generación y el tiempo de render.
   Se registra con `after()`, después de responder, para no sumar latencia.
2. **Vista (navegador):** `RenderBadge` envía con `navigator.sendBeacon` a
   `POST /api/v1/observatorio/vistas` la hora de generación que quedó en el
   HTML y si el contenido principal venía en el HTML inicial.

`src/observability/domain/medicion.ts` interpreta esas mediciones con funciones puras:

- **Estado de caché** de cada vista (`inferirEstadoCache`): `MISS` si el HTML
  se generó hace menos de 3 s, `STALE` si es ISR y superó su `revalidate`,
  `HIT` en otro caso; `DINAMICO` para SSR/híbrido y `CLIENTE` para CSR.
- **Patrón observado** de la ruta (`inferirPatron`): contenido ausente del
  HTML inicial → CSR; todas las vistas con la misma hora de generación → SSG;
  cada vista con una hora distinta → SSR; mezcla → ISR.

`/observatorio` muestra el resumen por ruta y si lo observado coincide con lo declarado.

## Consecuencias y límites

- Es una **inferencia**, no una lectura de la caché interna de Next.js. El
  umbral de 3 s para `MISS` es arbitrario: un render lento o un reloj
  desfasado pueden clasificar mal una vista.
- Se necesitan al menos 2 vistas para inferir un patrón; con menos se muestra
  `INDETERMINADO`.
- Un ISR que todavía no se ha regenerado es idéntico a un SSG; por eso
  `coincidePatron` acepta ambos para rutas ISR.
- La ruta híbrida se observa como `SSR`, porque la página entera es dinámica.
- Las mediciones viven en memoria (máximo 2000) y se pierden al reiniciar.
