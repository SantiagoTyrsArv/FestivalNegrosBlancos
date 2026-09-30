import { err, ok, type Result } from "@/shared/lib/result";
import {
  normalizarEmail,
  validarPassword,
  type ErrorPassword,
  type ServicioHash,
  type Usuario,
  type UsuarioRepository,
} from "../domain/usuario";

export class IniciarSesion {
  constructor(
    private readonly repo: UsuarioRepository,
    private readonly hash: ServicioHash,
    /** Hash señuelo: se verifica aunque el email no exista para no filtrar su existencia por tiempo. */
    private readonly hashSenuelo: string
  ) {}

  async ejecutar(
    email: string,
    password: string
  ): Promise<Result<Usuario, { tipo: "CREDENCIALES_INVALIDAS" }>> {
    const usuario = await this.repo.buscarPorEmail(normalizarEmail(email));
    const valida = await this.hash.verificar(password, usuario?.passwordHash ?? this.hashSenuelo);
    if (!usuario || !valida) return err({ tipo: "CREDENCIALES_INVALIDAS" });
    return ok({ id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol });
  }
}

export type ErrorRegistro = ErrorPassword | { readonly tipo: "EMAIL_EN_USO" };

export class RegistrarUsuario {
  constructor(
    private readonly repo: UsuarioRepository,
    private readonly hash: ServicioHash
  ) {}

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
      passwordHash: await this.hash.hash(password.value),
    });
    return creado ? ok(creado) : err({ tipo: "EMAIL_EN_USO" });
  }
}
