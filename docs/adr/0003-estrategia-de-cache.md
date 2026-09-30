# 0003. Estrategia de caché y patrón de rendering por ruta

- **Estado:** Aceptada
- **Fecha:** 2026-09-29

## Contexto

Cada página tiene necesidades distintas de frescura y personalización. El
objetivo del taller es elegir el patrón adecuado para cada una y poder
justificarlo.

## Decisión

Se elige el patrón según **qué tan seguido cambia el dato** y **si es personal**:

| Ruta                                                                      | Patrón                   | Por qué                                                                        |
| ------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `/`, `/historia`, `/faq`, `/recorrido`, `/comparsas`, `/comparsas/[slug]` | **SSG**                  | Contenido que solo cambia con un nuevo despliegue.                             |
| `/programacion`, `/programacion/[dia]`                                    | **ISR 60 s**             | Cambia pocas veces al día; debe verse actualizado sin redeploy.                |
| `/resultados`                                                             | **ISR 30 s + on-demand** | El jurado publica desde `/admin` y la página se invalida al instante.          |
| `/artistas/[slug]`                                                        | **ISR 300 s**            | Los destacados se generan en el build; el resto, en la primera visita.         |
| `/boletas`, `/checkout`, `/admin`, `/buscar`, `/observatorio`             | **SSR**                  | Dependen de la sesión, de `searchParams` o de datos que no admiten desfase.    |
| `/boletas/[eventoId]`                                                     | **Híbrido**              | Datos del evento cacheados + cupo en tiempo real por streaming (`<Suspense>`). |
| `/mi-agenda`, `/en-vivo`                                                  | **CSR**                  | Shell estático; los datos personales o en vivo se piden desde el navegador.    |

Mecanismos usados (modelo de caché clásico de Next.js, ver [0004](0004-sin-cache-components.md)):

- `export const revalidate = N` y `export const dynamic = "force-static" | "force-dynamic"` en cada página.
- `unstable_cache` con etiquetas (`CACHE_TAGS` en `src/shared/config/constants.ts`)
  para compartir datos entre rutas; está en `src/app/_lib/datos-cacheados.ts`.
- `revalidateTag` / `revalidatePath` en `src/app/_lib/revalidacion.ts`, con dos modos:
  - `swr`: la siguiente visita aún ve la versión vieja mientras se regenera.
  - `inmediata`: la siguiente visita espera la versión nueva (se usa al publicar desde `/admin`).
- `POST /api/revalidate` permite invalidar desde fuera (ver `docs/api.md`).

## Consecuencias

- La sesión **no** se lee en el layout: hacerlo volvería dinámicas todas las
  páginas. Por eso la barra de sesión solo aparece en rutas SSR y
  `/mi-agenda` es CSR.
- Los valores de `revalidate` deben ser literales en cada `page.tsx` (Next los
  analiza estáticamente); `REVALIDACION` en constants los documenta.
- SSG/ISR solo se comportan como tales en `pnpm build && pnpm start`; en
  `pnpm dev` todo se renderiza en cada petición.
