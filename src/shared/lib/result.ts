/**
 * Result<T, E>: la capa de aplicación devuelve errores esperados como valores
 * tipados en lugar de lanzar excepciones. Las excepciones quedan reservadas
 * para fallos inesperados (bugs, dependencias caídas), que capturan los error.tsx.
 */
export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Transforma el valor de un Result exitoso. */
export function map<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}
