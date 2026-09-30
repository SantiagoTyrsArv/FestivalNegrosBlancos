import type { Usuario, UsuarioConCredenciales, UsuarioRepository } from "../domain/usuario";

const sinCredenciales = ({ id, email, nombre, rol }: UsuarioConCredenciales): Usuario => ({
  id,
  email,
  nombre,
  rol,
});

export class UsuarioRepositoryEnMemoria implements UsuarioRepository {
  constructor(private readonly usuarios: UsuarioConCredenciales[] = []) {}

  async buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null> {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    const usuario = this.usuarios.find((u) => u.id === id);
    return usuario ? sinCredenciales(usuario) : null;
  }

  async crear(datos: { email: string; nombre: string; password: string }): Promise<Usuario | null> {
    if (this.usuarios.some((u) => u.email === datos.email)) return null;
    const id = Math.max(0, ...this.usuarios.map((u) => u.id)) + 1;
    const nuevo: UsuarioConCredenciales = { id, rol: "asistente", ...datos };
    this.usuarios.push(nuevo);
    return sinCredenciales(nuevo);
  }
}
