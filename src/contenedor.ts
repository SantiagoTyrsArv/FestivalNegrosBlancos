import bcrypt from "bcryptjs";
import type { Conexion } from "@/db/connection";
import {
  AgregarAAgenda,
  QuitarDeAgenda,
  VerAgenda,
} from "@/modules/agenda/application/casos-de-uso";
import { DrizzleAgendaRepository } from "@/modules/agenda/infrastructure/drizzle-agenda-repository";
import {
  ComprarBoletas,
  ConsultarCupos,
  ListarBoletasDeUsuario,
  ObtenerSesion,
} from "@/modules/boleteria/application/casos-de-uso";
import {
  DrizzleBoleteriaRepository,
  GeneradorCodigosAleatorios,
} from "@/modules/boleteria/infrastructure/drizzle-boleteria-repository";
import {
  ListarComparsas,
  ObtenerComparsa,
  ObtenerEstadoEnVivo,
} from "@/modules/comparsas/application/casos-de-uso";
import { DrizzleComparsaRepository } from "@/modules/comparsas/infrastructure/drizzle-comparsa-repository";
import {
  ActualizarEvento,
  BuscarEnFestival,
  ListarArtistas,
  ListarEventosPaginados,
  ListarProgramacion,
  ObtenerArtista,
  ObtenerEvento,
} from "@/modules/eventos/application/casos-de-uso";
import {
  DrizzleArtistaRepository,
  DrizzleEventoRepository,
} from "@/modules/eventos/infrastructure/drizzle-repositorios";
import { ProgramacionGatewaySimulado } from "@/modules/eventos/infrastructure/programacion-gateway-simulado";
import {
  ListarResultadosAdmin,
  ListarResultadosPublicados,
  PublicarResultado,
} from "@/modules/resultados/application/casos-de-uso";
import { DrizzleResultadoRepository } from "@/modules/resultados/infrastructure/drizzle-resultado-repository";
import { IniciarSesion, RegistrarUsuario } from "@/modules/usuarios/application/casos-de-uso";
import {
  DrizzleUsuarioRepository,
  ServicioHashBcrypt,
} from "@/modules/usuarios/infrastructure/drizzle-usuario-repository";
import { DrizzleAjustesCaos } from "@/observability/caos";
import { DrizzleMedicionesRepository } from "@/observability/infrastructure/mediciones-repository";
import { FESTIVAL } from "@/shared/config/constants";

/**
 * Composition root: el ÚNICO lugar que conoce las implementaciones concretas.
 * Los casos de uso reciben interfaces (puertos) por constructor, de modo que
 * los tests pueden sustituir cualquier adaptador por un fake en memoria.
 */
export function crearContenedor(conexion: Conexion) {
  const { db, sqlite } = conexion;

  const eventosRepo = new DrizzleEventoRepository(db);
  const artistasRepo = new DrizzleArtistaRepository(db, eventosRepo);
  const comparsasRepo = new DrizzleComparsaRepository(db);
  const boleteriaRepo = new DrizzleBoleteriaRepository(db, sqlite);
  const resultadosRepo = new DrizzleResultadoRepository(db);
  const agendaRepo = new DrizzleAgendaRepository(db);
  const usuariosRepo = new DrizzleUsuarioRepository(db);
  const hash = new ServicioHashBcrypt();
  const caos = new DrizzleAjustesCaos(db);
  const gateway = new ProgramacionGatewaySimulado(eventosRepo, caos);

  return {
    caos,
    mediciones: new DrizzleMedicionesRepository(db),
    eventos: {
      listarProgramacion: new ListarProgramacion(gateway),
      obtener: new ObtenerEvento(eventosRepo),
      listarPaginados: new ListarEventosPaginados(eventosRepo),
      actualizar: new ActualizarEvento(eventosRepo),
      buscar: new BuscarEnFestival(gateway, artistasRepo),
    },
    artistas: {
      listar: new ListarArtistas(artistasRepo),
      obtener: new ObtenerArtista(artistasRepo),
    },
    comparsas: {
      listar: new ListarComparsas(comparsasRepo, FESTIVAL.anio),
      obtener: new ObtenerComparsa(comparsasRepo, FESTIVAL.anio),
      estadoEnVivo: new ObtenerEstadoEnVivo(comparsasRepo, gateway),
    },
    boleteria: {
      consultarCupos: new ConsultarCupos(boleteriaRepo),
      obtenerSesion: new ObtenerSesion(boleteriaRepo),
      comprar: new ComprarBoletas(boleteriaRepo, new GeneradorCodigosAleatorios()),
      boletasDeUsuario: new ListarBoletasDeUsuario(boleteriaRepo),
    },
    resultados: {
      listarPublicados: new ListarResultadosPublicados(resultadosRepo),
      listarAdmin: new ListarResultadosAdmin(resultadosRepo),
      publicar: new PublicarResultado(resultadosRepo),
    },
    agenda: {
      ver: new VerAgenda(agendaRepo, eventosRepo),
      agregar: new AgregarAAgenda(agendaRepo, eventosRepo),
      quitar: new QuitarDeAgenda(agendaRepo),
    },
    usuarios: {
      iniciarSesion: new IniciarSesion(
        usuariosRepo,
        hash,
        bcrypt.hashSync("señuelo-no-es-una-clave", 10)
      ),
      registrar: new RegistrarUsuario(usuariosRepo, hash),
      obtener: (id: number) => usuariosRepo.obtenerPorId(id),
    },
  };
}

export type Contenedor = ReturnType<typeof crearContenedor>;
