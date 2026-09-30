# Carnaval de Blancos y Negros — Taller de patrones de rendering

Sitio de demostración en Next.js (App Router) que muestra SSG, ISR, SSR, CSR y
rutas híbridas sobre el mismo dominio. **No usa base de datos**: todos los
datos son ficticios y están quemados en [`src/datos/catalogo.ts`](src/datos/catalogo.ts).
Los repositorios en memoria parten de ese catálogo, así que compras, agenda,
resultados publicados y Modo Caos viven mientras el servidor esté encendido.

## Ejecutar

```bash
pnpm install
pnpm dev             # desarrollo (todo se renderiza bajo demanda)
pnpm build && pnpm start   # producción: aquí se ven SSG/ISR de verdad
```

Cuentas de demostración: `admin@carnaval.test` / `Admin123!` y
`asistente@carnaval.test` / `Asistente123!`.

## Patrones por ruta

| Patrón | Rutas                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------- |
| SSG    | `/`, `/comparsas`, `/comparsas/[slug]`, `/historia`, `/faq`, `/recorrido`                       |
| ISR    | `/programacion` (60 s), `/programacion/[dia]`, `/resultados` (30 s), `/artistas/[slug]` (5 min) |
| SSR    | `/boletas`, `/boletas/[eventoId]`, `/checkout`, `/buscar`, `/admin`, `/observatorio`            |
| CSR    | `/mi-agenda`, `/en-vivo` (datos desde `/api/v1/*` con SWR)                                      |

- `/admin` publica resultados o edita eventos y revalida al instante las páginas ISR.
- `/observatorio` registra cada render y vista, e incluye el **Modo Caos** para
  ver cómo degrada cada patrón cuando la fuente de programación falla.
- Añade `?debug=1` a cualquier URL (o `DEBUG_RENDERING=1`) para ver la insignia de rendering.

## Arquitectura

`src/modules/<módulo>/{domain,application,infrastructure,ui}`: el dominio y los
casos de uso no conocen el almacenamiento; `src/contenedor.ts` los conecta con
los repositorios en memoria. Tests: `pnpm test` (unitarios) y `pnpm test:e2e`.
