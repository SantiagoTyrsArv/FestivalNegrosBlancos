/** Estado que devuelven las Server Actions de formulario a useActionState. */
export interface EstadoFormulario {
  estado: "inicial" | "error" | "exito";
  mensaje?: string;
  /** Errores por campo, asociados al input con aria-describedby. */
  errores?: Partial<Record<string, string>>;
  /** Valores a conservar tras un error (nunca contraseñas). */
  valores?: Partial<Record<string, string>>;
}

export const ESTADO_INICIAL: EstadoFormulario = { estado: "inicial" };

/** Convierte los issues de Zod en un mapa campo → primer mensaje. */
export function erroresPorCampo(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const errores: Record<string, string> = {};
  for (const i of issues) {
    const campo = String(i.path[0] ?? "formulario");
    errores[campo] ??= i.message;
  }
  return errores;
}
