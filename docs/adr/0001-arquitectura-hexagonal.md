# 0001. Arquitectura hexagonal por módulos

- **Estado:** Aceptada
- **Fecha:** 2026-09-29

## Contexto

El proyecto demuestra patrones de rendering, pero la lógica del festival
(programación, boletería, agenda, resultados) debe ser la misma sin importar
si una página es SSG, ISR, SSR o CSR. Si esa lógica viviera dentro de las
páginas, cada patrón la duplicaría y sería imposible probarla sin Next.js.

## Decisión

Cada módulo de `src/modules/` se divide en cuatro capas:

| Capa              | Contenido                                                                   | Puede depender de    |
| ----------------- | --------------------------------------------------------------------------- | -------------------- |
| `domain/`         | Entidades, reglas puras y **puertos** (interfaces de repositorio)           | Nada externo         |
| `application/`    | Casos de uso (`ComprarBoletas`, `ListarProgramacion`…)                      | `domain`             |
| `infrastructure/` | Implementaciones de los puertos (repositorios en memoria, gateway simulado) | `domain`             |
| `ui/`             | Componentes React del módulo                                                | `application` (DTOs) |

Los casos de uso reciben sus dependencias por constructor. El único lugar que
conoce las implementaciones concretas es `src/contenedor.ts` (composition
root); las páginas acceden a él con `casos()` de `src/composition-root.ts`.

Los errores esperables (cupo insuficiente, evento no encontrado) se devuelven
como `Result<T, E>` tipado en lugar de lanzar excepciones.

## Consecuencias

- Las páginas quedan delgadas: solo eligen el patrón de rendering y pintan.
- El dominio y la aplicación tienen ~99 % de cobertura con tests unitarios
  rápidos que no levantan Next.js.
- Cambiar el almacenamiento no toca la lógica: al pasar de Turso a datos en
  memoria ([0002](0002-datos-en-memoria.md)) solo cambiaron la capa de
  infraestructura y `contenedor.ts`.
- Coste: más archivos y más indirección que una app Next.js típica.
