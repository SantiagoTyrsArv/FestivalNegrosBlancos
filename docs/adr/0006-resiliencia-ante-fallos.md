# 0006. Resiliencia de cada patrón ante fallos (Modo Caos)

- **Estado:** Aceptada
- **Fecha:** 2026-09-29

## Contexto

La programación viene de una "API upstream" (simulada en
`programacion-gateway-simulado.ts`). Una diferencia clave entre patrones es
cómo se comportan cuando esa fuente falla, y queríamos poder demostrarlo en vivo.

## Decisión

**Modo Caos** (`src/observability/caos.ts`), activable por el admin desde
`/observatorio`, hace que la upstream:

| Modo       | Efecto                                                             |
| ---------- | ------------------------------------------------------------------ |
| `error`    | Responde como caída (503).                                         |
| `lento`    | Tarda 4 s en responder.                                            |
| `invalido` | Devuelve fechas en otro formato; la validación con Zod lo rechaza. |

Regla de resiliencia en `src/app/_lib/datos-cacheados.ts`: si la upstream
falla, `programacionCacheada` **lanza** `UpstreamNoDisponibleError` en lugar de
devolver el error. Así el fallo nunca queda guardado en el Data Cache.

## Consecuencias

Comportamiento de cada patrón con la upstream caída:

| Patrón                    | Resultado                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ISR** (`/programacion`) | La regeneración en segundo plano falla y Next **sigue sirviendo la última versión buena**. El usuario no nota nada. |
| **SSG**                   | No le afecta: el HTML se generó en el build.                                                                        |
| **SSR** (`/buscar`)       | Muestra un aviso controlado en la página, porque cada petición depende de la upstream.                              |
| **CSR** (`/en-vivo`)      | `/api/v1/en-vivo` responde 503 con `Retry-After` y el cliente muestra un botón de reintento.                        |
| ISR sin versión previa    | Se muestra `programacion/error.tsx`.                                                                                |

- El E2E "Modo Caos" (`tests/e2e/flujos.spec.ts`) comprueba estos
  comportamientos contra el build de producción.
- Al cambiar de modo se revalida la etiqueta `programacion` en modo `swr`, de
  modo que la siguiente visita dispara la regeneración que va a fallar.
