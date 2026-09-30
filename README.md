# Carnaval de Blancos y Negros — Taller de patrones de rendering

Sitio de demostración en **Next.js 16 (App Router)** que implementa sobre un
mismo dominio (la programación, boletería y resultados de un carnaval) los
patrones **SSG, ISR, SSR, CSR** y una ruta **híbrida** con streaming. Incluye
un **Observatorio** que mide cómo se genera realmente cada página y un **Modo
Caos** que simula caídas para comparar cómo degrada cada patrón.

**No usa base de datos**: todos los datos son ficticios y están en
[`src/datos/catalogo.ts`](src/datos/catalogo.ts). Compras, agenda, resultados
publicados y Modo Caos viven en memoria mientras el servidor esté encendido.

## Ejecutar

Requisitos: Node.js 24 y pnpm.

```bash
pnpm install
pnpm build && pnpm start   # producción: SSG e ISR se comportan de verdad
pnpm dev                   # desarrollo: TODO se renderiza en cada petición
```

Abre <http://localhost:3000>. No hace falta ninguna variable de entorno
(opcionales en [`.env.example`](.env.example)).

| Cuenta        | Correo                    | Contraseña      |
| ------------- | ------------------------- | --------------- |
| Administrador | `admin@carnaval.test`     | `Admin123!`     |
| Asistente     | `asistente@carnaval.test` | `Asistente123!` |

## Patrones de rendering

| Patrón      | Qué es                                                                           | Rutas                                                                                                        | Cómo se declara                                     |
| ----------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **SSG**     | HTML generado una vez en el build y servido igual a todos.                       | `/`, `/historia`, `/faq`, `/recorrido`, `/comparsas`, `/comparsas/[slug]`                                    | `dynamic = "force-static"` + `generateStaticParams` |
| **ISR**     | HTML estático que se regenera en segundo plano cada N segundos o al invalidarlo. | `/programacion` y `/programacion/[dia]` (60 s), `/resultados` (30 s + on-demand), `/artistas/[slug]` (300 s) | `revalidate = N` + `unstable_cache` con etiquetas   |
| **SSR**     | HTML generado en cada petición. Necesario con sesión o `searchParams`.           | `/boletas`, `/checkout`, `/buscar`, `/admin`, `/observatorio`                                                | `dynamic = "force-dynamic"`                         |
| **Híbrido** | Parte cacheada que se envía primero + parte en tiempo real por streaming.        | `/boletas/[eventoId]` (evento cacheado, cupo en vivo)                                                        | Data Cache + `<Suspense>`                           |
| **CSR**     | Shell estático; los datos se piden desde el navegador.                           | `/mi-agenda` (agenda privada), `/en-vivo` (polling cada 5 s)                                                 | `"use client"` + SWR contra `/api/v1/*`             |

El porqué de cada elección está en [ADR 0003](docs/adr/0003-estrategia-de-cache.md).

### Cómo comprobar el patrón de una página

- Cada página muestra su patrón en el antetítulo (por ejemplo, _ISR · revalidate 60 s_).
- Añade `?debug=1` a la URL para ver la **insignia de rendering**: hora de
  generación del HTML, tiempo de render y estado de caché (`HIT`, `MISS`, `STALE`…).
- Recarga varias veces: en SSG la hora no cambia, en SSR cambia siempre y en
  ISR cambia como máximo una vez por intervalo.
- `/observatorio` compara, ruta por ruta, el patrón **declarado** con el **observado**.
- La salida de `pnpm build` marca cada ruta como `○` (estática), `●` (SSG con
  parámetros, con su `Revalidate`) o `ƒ` (dinámica).

## Recorrido de demostración (≈ 5 min)

1. **SSG** — Abre `/comparsas?debug=1` y recarga: la hora de generación es la del build.
2. **ISR on-demand** — Entra a `/resultados` y anota las comparsas publicadas.
   Inicia sesión como admin, ve a `/admin` y publica un resultado pendiente.
   Vuelve a `/resultados`: el nuevo resultado aparece sin redesplegar.
3. **SSR** — Busca en `/buscar?q=marimba`: la página se genera con cada consulta.
4. **Híbrido** — Abre `/boletas/2`: el evento aparece al instante y el cupo llega
   después (esqueleto de carga). Compra una boleta y observa cómo baja el cupo.
5. **CSR** — Abre `/en-vivo` y mira el código fuente (`Ctrl+U`): el estado del
   desfile no está en el HTML, lo trae el navegador.
6. **Modo Caos** — En `/observatorio` (como admin) elige _Error 503_ y aplica.
   - `/programacion` (ISR) sigue funcionando con la última versión buena.
   - `/buscar?q=marimba` (SSR) muestra un aviso controlado.
   - `/en-vivo` (CSR) muestra un botón de reintento.

   Vuelve a _Ninguno_ al terminar. Detalles en [ADR 0006](docs/adr/0006-resiliencia-ante-fallos.md).

## Arquitectura

```text
src/
├── app/                 Rutas de Next.js: cada page.tsx elige su patrón
│   ├── _lib/            Lecturas cacheadas (unstable_cache) y revalidación
│   └── api/             Route Handlers (ver docs/api.md)
├── datos/catalogo.ts    Datos ficticios quemados
├── modules/             Un módulo por área del negocio
│   └── <módulo>/
│       ├── domain/          Entidades, reglas puras y puertos (interfaces)
│       ├── application/     Casos de uso
│       ├── infrastructure/  Repositorios en memoria
│       └── ui/              Componentes del módulo
├── observability/       Observatorio, Modo Caos y simulador de costos
├── shared/              Design system, i18n, utilidades HTTP
└── contenedor.ts        Composition root: conecta casos de uso y repositorios
```

Módulos: `eventos`, `boleteria`, `agenda`, `comparsas`, `resultados`, `usuarios`.
Arquitectura hexagonal: el dominio no conoce Next.js ni el almacenamiento
([ADR 0001](docs/adr/0001-arquitectura-hexagonal.md)).

## Calidad

| Comando                            | Qué hace                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pnpm lint`                        | ESLint sin advertencias permitidas                                                                |
| `pnpm typecheck`                   | TypeScript estricto                                                                               |
| `pnpm test` / `pnpm test:coverage` | Tests unitarios (Vitest); cobertura mínima del 80 % en dominio y aplicación                       |
| `pnpm test:e2e`                    | Tests E2E (Playwright) contra el build de producción, incluidos Modo Caos y accesibilidad con axe |

La integración continua (`.github/workflows/ci.yml`) ejecuta todo lo anterior
en cada push. Husky y lint-staged formatean el código antes de cada commit.

## Documentación

- [Decisiones de arquitectura (ADR)](docs/adr/README.md)
- [API HTTP y formato de errores](docs/api.md)

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zod · SWR · Vitest ·
Playwright. Todos los datos, personas y precios son ficticios.
