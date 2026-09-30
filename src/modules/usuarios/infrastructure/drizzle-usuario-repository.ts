import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Db } from "@/db/connection";
import { usuarios } from "@/db/schema";
import type {
  ServicioHash,
  Usuario,
  UsuarioConCredenciales,
  UsuarioRepository,
} from "../domain/usuario";

type Fila = typeof usuarios.$inferSelect;

const aUsuario = (f: Fila): Usuario => ({ id: f.id, email: f.email, nombre: f.nombre, rol: f.rol });

export class DrizzleUsuarioRepository implements UsuarioRepository {
  constructor(private readonly db: Db) {}

  async buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null> {
    const [f] = await this.db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    return f ? { ...aUsuario(f), passwordHash: f.passwordHash } : null;
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    const [f] = await this.db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return f ? aUsuario(f) : null;
  }

  async crear(datos: {
    email: string;
    nombre: string;
    passwordHash: string;
  }): Promise<Usuario | null> {
    const [creado] = await this.db.insert(usuarios).values(datos).onConflictDoNothing().returning();
    return creado ? aUsuario(creado) : null;
  }
}

export class ServicioHashBcrypt implements ServicioHash {
  constructor(private readonly costo = 10) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.costo);
  }

  verificar(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
