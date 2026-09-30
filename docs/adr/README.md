# Registro de decisiones de arquitectura (ADR)

Cada ADR explica una decisión importante del proyecto: el contexto, qué se
decidió y qué consecuencias tiene. Se escriben una vez y no se reescriben; si
una decisión cambia, se crea un ADR nuevo que la reemplaza.

| ADR                                     | Decisión                                           | Estado   |
| --------------------------------------- | -------------------------------------------------- | -------- |
| [0001](0001-arquitectura-hexagonal.md)  | Arquitectura hexagonal por módulos                 | Aceptada |
| [0002](0002-datos-en-memoria.md)        | Datos quemados en memoria, sin base de datos       | Aceptada |
| [0003](0003-estrategia-de-cache.md)     | Estrategia de caché y patrón de rendering por ruta | Aceptada |
| [0004](0004-sin-cache-components.md)    | No activar `cacheComponents` (PPR)                 | Aceptada |
| [0005](0005-observatorio.md)            | Observatorio de rendering y sus límites            | Aceptada |
| [0006](0006-resiliencia-ante-fallos.md) | Resiliencia de cada patrón ante fallos (Modo Caos) | Aceptada |

## Plantilla

```markdown
# NNNN. Título

- **Estado:** Propuesta | Aceptada | Reemplazada por NNNN
- **Fecha:** AAAA-MM-DD

## Contexto

## Decisión

## Consecuencias
```
