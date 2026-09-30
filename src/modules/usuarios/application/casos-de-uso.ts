import { err, ok, type Result } from "@/shared/lib/result";
import {
  normalizarEmail,
  validarPassword,
  type ErrorPassword,
  type Usuario,
  type UsuarioRepository,
} from "../domain/usuario";

export class IniciarSesion {
  constructor(private readonly repo: UsuarioRepository) {}

  async ejecutar(
    email: string,
    password: string
  ): Promise<Result<Usuario, { tipo: "CREDENCIALES_INVALIDAS" }>> {
    const usuario = await this.repo.buscarPorEmail(normalizarEmail(email));
    if (!usuario || usuario.password !== password) return err({ tipo: "CREDENCIALES_INVALIDAS" });
    return ok({ id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol });
  }
}

export type ErrorRegistro = ErrorPassword | { readonly tipo: "EMAIL_EN_USO" };

export class RegistrarUsuario {
  constructor(private readonly repo: UsuarioRepository) {}

  async ejecutar(datos: {
    email: string;
    nombre: string;
    password: string;
  }): Promise<Result<Usuario, ErrorRegistro>> {
    const password = validarPassword(datos.password);
    if (!password.ok) return password;
    const creado = await this.repo.crear({
      email: normalizarEmail(datos.email),
      nombre: datos.nombre.trim(),
      password: password.value,
    });
    return creado ? ok(creado) : err({ tipo: "EMAIL_EN_USO" });
  }
}
