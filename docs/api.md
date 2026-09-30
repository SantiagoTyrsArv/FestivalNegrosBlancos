# API HTTP

Route Handlers en `src/app/api/`. Todas las respuestas son JSON. Las rutas
marcadas con 🔒 requieren la cookie de sesión (iniciar sesión en `/login`).

## Endpoints

| Método      | Ruta                            | Descripción                                                                                                                                                                                        | Respuesta OK                     |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `GET`       | `/api/v1/eventos`               | Eventos paginados por cursor. Query: `cursor`, `limite` (1–50, por defecto 10), `tipo` (`concierto`, `desfile`, `ceremonia`, `taller`). Cacheable 60 s en CDN.                                     | `200 { datos, siguienteCursor }` |
| `GET`       | `/api/v1/en-vivo`               | Estado simulado del desfile (lo consume `/en-vivo` cada 5 s).                                                                                                                                      | `200`                            |
| `GET` 🔒    | `/api/v1/agenda`                | Agenda del usuario.                                                                                                                                                                                | `200`                            |
| `POST` 🔒   | `/api/v1/agenda`                | Añade un evento. Cuerpo: `{ "eventoId": 3 }`.                                                                                                                                                      | `201` con la agenda              |
| `DELETE` 🔒 | `/api/v1/agenda/{eventoId}`     | Quita un evento (idempotente).                                                                                                                                                                     | `200` con la agenda              |
| `GET`       | `/api/v1/observatorio/metricas` | Resumen por ruta, mediciones recientes y modo caos.                                                                                                                                                | `200`                            |
| `POST`      | `/api/v1/observatorio/vistas`   | Beacon del `RenderBadge`: `{ ruta, patron, generadoEn, revalidar, enHtmlInicial }`.                                                                                                                | `204`                            |
| `POST`      | `/api/revalidate`               | Revalidación on-demand. Cuerpo: `{ "etiquetas"?: string[], "rutas"?: string[], "modo"?: "swr" \| "inmediata" }`. Etiquetas permitidas: `programacion`, `resultados`, `artistas`, `artista:<slug>`. | `200 { revalidado: true, … }`    |

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"etiquetas":["resultados"],"modo":"inmediata"}'
```

## Errores

Los errores siguen el formato _problem+json_ (RFC 9457) y se generan en
`src/shared/http/problem.ts`:

```json
{
  "type": "/docs/errores#validacion",
  "title": "Datos inválidos",
  "status": 422,
  "errores": [{ "campo": "eventoId", "mensaje": "Invalid input" }]
}
```

| Código (`type`)          | Estado | Cuándo                                                              |
| ------------------------ | ------ | ------------------------------------------------------------------- |
| `json-invalido`          | 400    | El cuerpo no es JSON.                                               |
| `parametros-invalidos`   | 400    | Query o parámetro de ruta inválido.                                 |
| `no-autenticado`         | 401    | Falta la sesión en una ruta 🔒.                                     |
| `no-encontrado`          | 404    | El evento no existe.                                                |
| `evento-cancelado`       | 409    | Se intentó agendar un evento cancelado.                             |
| `agenda-llena`           | 409    | La agenda ya tiene el máximo de eventos (30).                       |
| `validacion`             | 422    | El cuerpo no cumple el esquema Zod; `errores` indica los campos.    |
| `upstream-no-disponible` | 503    | La fuente de programación falla (Modo Caos). Incluye `Retry-After`. |
