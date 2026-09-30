import type { AgendaRepository } from "@/modules/agenda/domain/agenda";
import type { Boleta, SesionBoleteria } from "@/modules/boleteria/domain/boleteria";
import { cupoDisponible } from "@/modules/boleteria/domain/boleteria";
import type { BoleteriaRepository, SolicitudCompra } from "@/modules/boleteria/domain/ports";
import type { Comparsa, ComparsaRepository } from "@/modules/comparsas/domain/comparsa";
import type { Artista } from "@/modules/eventos/domain/artista";
import type { CambiosEvento, Evento, TipoEvento } from "@/modules/eventos/domain/evento";
import type {
  ArtistaRepository,
  ErrorUpstream,
  EventoRepository,
  ProgramacionGateway,
} from "@/modules/eventos/domain/ports";
import type { Resultado, ResultadoRepository } from "@/modules/resultados/domain/resultado";
import type {
  ServicioHash,
  Usuario,
  UsuarioConCredenciales,
  UsuarioRepository,
} from "@/modules/usuarios/domain/usuario";
import { err, ok, type Result } from "@/shared/lib/result";

let secuencia = 1;

export function unEvento(parcial: Partial<Evento> = {}): Evento {
  const id = parcial.id ?? secuencia++;
  return {
    id,
    nombre: `Evento ${id}`,
    tipo: "concierto",
    descripcion: "Descripción",
    inicio: new Date("2027-01-02T23:00:00Z"),
    fin: new Date("2027-01-03T01:00:00Z"),
    cancelado: false,
    escenario: { slug: "tarima-mayor", nombre: "Tarima Mayor" },
    artistas: [],
    ...parcial,
  };
}

export function unArtista(parcial: Partial<Artista> = {}): Artista {
  const id = parcial.id ?? secuencia++;
  return {
    id,
    slug: `artista-${id}`,
    nombre: `Artista ${id}`,
    genero: "Cumbia",
    origen: "Pasto",
    biografia: "Bio",
    destacado: false,
    ...parcial,
  };
}

export function unaSesion(parcial: Partial<SesionBoleteria> = {}): SesionBoleteria {
  return {
    id: parcial.id ?? secuencia++,
    eventoId: 1,
    nombre: "General",
    cupoTotal: 100,
    cupoVendido: 0,
    precio: { centavos: 4_500_000, moneda: "COP" },
    ...parcial,
  };
}

export class EventoRepositoryEnMemoria implements EventoRepository {
  constructor(public eventos: Evento[] = []) {}

  async listar(filtro: { tipo?: TipoEvento } = {}) {
    return this.eventos.filter((e) => !filtro.tipo || e.tipo === filtro.tipo);
  }

  async listarPagina(p: { cursor: number | null; limite: number; tipo?: TipoEvento }) {
    const candidatos = this.eventos
      .filter((e) => (p.cursor === null || e.id > p.cursor) && (!p.tipo || e.tipo === p.tipo))
      .sort((a, b) => a.id - b.id);
    const items = candidatos.slice(0, p.limite);
    return {
      items,
      siguienteCursor: candidatos.length > p.limite ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async obtenerPorId(id: number) {
    return this.eventos.find((e) => e.id === id) ?? null;
  }

  async actualizar(id: number, cambios: CambiosEvento) {
    const i = this.eventos.findIndex((e) => e.id === id);
    const actual = this.eventos[i];
    if (!actual) return null;
    const nuevo = { ...actual, ...cambios };
    this.eventos[i] = nuevo;
    return nuevo;
  }
}

export class ArtistaRepositoryEnMemoria implements ArtistaRepository {
  constructor(
    public artistas: Artista[] = [],
    private readonly eventos: Evento[] = []
  ) {}

  async listar() {
    return this.artistas;
  }

  async obtenerPorSlug(slug: string) {
    return this.artistas.find((a) => a.slug === slug) ?? null;
  }

  async eventosDeArtista(slug: string) {
    return this.eventos.filter((e) => e.artistas.some((a) => a.slug === slug));
  }
}

export class GatewayFalso implements ProgramacionGateway {
  constructor(public respuesta: Result<Evento[], ErrorUpstream>) {}

  async obtenerProgramacion() {
    return this.respuesta;
  }
}

/** Implementación en memoria que respeta el contrato atómico del puerto. */
export class BoleteriaRepositoryEnMemoria implements BoleteriaRepository {
  boletas: Boleta[] = [];
  private porClave = new Map<string, Boleta>();

  constructor(public sesiones: SesionBoleteria[] = []) {}

  async sesionesDeEvento(eventoId: number) {
    return this.sesiones.filter((s) => s.eventoId === eventoId);
  }

  async obtenerSesion(id: number) {
    return this.sesiones.find((s) => s.id === id) ?? null;
  }

  async registrarCompra(s: SolicitudCompra) {
    const clave = `${s.usuarioId}:${s.idempotencyKey}`;
    const previa = this.porClave.get(clave);
    if (previa) return ok({ boleta: previa, repetida: true });
    const i = this.sesiones.findIndex((x) => x.id === s.sesionId);
    const sesion = this.sesiones[i];
    if (!sesion) return err({ tipo: "SESION_NO_ENCONTRADA" as const });
    if (cupoDisponible(sesion) < s.cantidad) {
      return err({ tipo: "CUPO_INSUFICIENTE" as const, disponible: cupoDisponible(sesion) });
    }
    this.sesiones[i] = { ...sesion, cupoVendido: sesion.cupoVendido + s.cantidad };
    const boleta: Boleta = {
      id: this.boletas.length + 1,
      codigo: s.codigo,
      sesionId: s.sesionId,
      usuarioId: s.usuarioId,
      cantidad: s.cantidad,
      total: { centavos: sesion.precio.centavos * s.cantidad, moneda: sesion.precio.moneda },
      creadaEn: new Date("2026-12-01T00:00:00Z"),
    };
    this.boletas.push(boleta);
    this.porClave.set(clave, boleta);
    return ok({ boleta, repetida: false });
  }

  async boletasDeUsuario(usuarioId: number) {
    return this.boletas.filter((b) => b.usuarioId === usuarioId);
  }
}

export class AgendaRepositoryEnMemoria implements AgendaRepository {
  items = new Map<number, number[]>();

  async eventosDe(usuarioId: number) {
    return [...(this.items.get(usuarioId) ?? [])];
  }

  async agregar(usuarioId: number, eventoId: number) {
    this.items.set(usuarioId, [...(this.items.get(usuarioId) ?? []), eventoId]);
  }

  async quitar(usuarioId: number, eventoId: number) {
    this.items.set(
      usuarioId,
      (this.items.get(usuarioId) ?? []).filter((id) => id !== eventoId)
    );
  }
}

export class ResultadoRepositoryEnMemoria implements ResultadoRepository {
  constructor(public resultados: Resultado[] = []) {}

  async listar({ soloPublicados }: { soloPublicados: boolean }) {
    return this.resultados.filter((r) => !soloPublicados || r.publicado);
  }

  async obtener(id: number) {
    return this.resultados.find((r) => r.id === id) ?? null;
  }

  async marcarPublicado(id: number, fecha: Date) {
    this.resultados = this.resultados.map((r) =>
      r.id === id ? { ...r, publicado: true, publicadoEn: fecha } : r
    );
  }
}

export class ComparsaRepositoryEnMemoria implements ComparsaRepository {
  constructor(public comparsas: Comparsa[] = []) {}

  async listar() {
    return this.comparsas;
  }

  async obtenerPorSlug(slug: string) {
    return this.comparsas.find((c) => c.slug === slug) ?? null;
  }
}

export class UsuarioRepositoryEnMemoria implements UsuarioRepository {
  constructor(public usuarios: UsuarioConCredenciales[] = []) {}

  async buscarPorEmail(email: string) {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }

  async obtenerPorId(id: number) {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async crear(datos: {
    email: string;
    nombre: string;
    passwordHash: string;
  }): Promise<Usuario | null> {
    if (this.usuarios.some((u) => u.email === datos.email)) return null;
    const nuevo = { id: this.usuarios.length + 1, rol: "asistente" as const, ...datos };
    this.usuarios.push(nuevo);
    return { id: nuevo.id, email: nuevo.email, nombre: nuevo.nombre, rol: nuevo.rol };
  }
}

/** Hash reversible trivial: solo para tests. */
export const hashFalso: ServicioHash = {
  hash: async (p) => `hash:${p}`,
  verificar: async (p, h) => h === `hash:${p}`,
};
