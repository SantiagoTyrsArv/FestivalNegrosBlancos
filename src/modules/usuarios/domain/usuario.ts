import { err, ok, type Result } from "@/shared/lib/result";

export const ROLES = ["admin", "asistente"] as const;
export type Rol = (typeof ROLES)[number];

export interface Usuario {
  readonly id: number;
  readonly email: string;
  readonly nombre: string;
  readonly rol: Rol;
}

/** Proyecto de demostración: las contraseñas de los usuarios quemados se guardan tal cual. */
export interface UsuarioConCredenciales extends Usuario {
  readonly password: string;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type ErrorPassword = { readonly tipo: "PASSWORD_DEBIL" };

/** Política mínima: 8+ caracteres con al menos una letra y un número. */
export function validarPassword(password: string): Result<string, ErrorPassword> {
  const valida =
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password);
  return valida ? ok(password) : err({ tipo: "PASSWORD_DEBIL" });
}

export const esAdmin = (u: Pick<Usuario, "rol">): boolean => u.rol === "admin";

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null>;
  obtenerPorId(id: number): Promise<Usuario | null>;
  /** Devuelve null si el email ya está registrado. */
  crear(datos: { email: string; nombre: string; password: string }): Promise<Usuario | null>;
}
