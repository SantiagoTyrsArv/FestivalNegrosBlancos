import { crearCatalogo, type Catalogo } from "@/datos/catalogo";
import {
  AgregarAAgenda,
  QuitarDeAgenda,
  VerAgenda,
} from "@/modules/agenda/application/casos-de-uso";
import { AgendaRepositoryEnMemoria } from "@/modules/agenda/infrastructure/agenda-repository-en-memoria";
import {
  ComprarBoletas,
  ConsultarCupos,
  ListarBoletasDeUsuario,
  ObtenerSesion,
} from "@/modules/boleteria/application/casos-de-uso";
import {
  BoleteriaRepositoryEnMemoria,
  GeneradorCodigosAleatorios,
} from "@/modules/boleteria/infrastructure/boleteria-repository-en-memoria";
import {
  ListarComparsas,
  ObtenerComparsa,
  ObtenerEstadoEnVivo,
} from "@/modules/comparsas/application/casos-de-uso";
import { ComparsaRepositoryEnMemoria } from "@/modules/comparsas/infrastructure/comparsa-repository-en-memoria";
import {
  ActualizarEvento,
  BuscarEnFestival,
  ListarArtistas,
  ListarEventosPaginados,
  ListarProgramacion,
  ObtenerArtista,
  ObtenerEvento,
} from "@/modules/eventos/application/casos-de-uso";
import { ProgramacionGatewaySimulado } from "@/modules/eventos/infrastructure/programacion-gateway-simulado";
import {
  ArtistaRepositoryEnMemoria,
  EventoRepositoryEnMemoria,
} from "@/modules/eventos/infrastructure/repositorios-en-memoria";
import {
  ListarResultadosAdmin,
  ListarResultadosPublicados,
  PublicarResultado,
} from "@/modules/resultados/application/casos-de-uso";
import { ResultadoRepositoryEnMemoria } from "@/modules/resultados/infrastructure/resultado-repository-en-memoria";
import { IniciarSesion, RegistrarUsuario } from "@/modules/usuarios/application/casos-de-uso";
import { UsuarioRepositoryEnMemoria } from "@/modules/usuarios/infrastructure/usuario-repository-en-memoria";
import { AjustesCaosEnMemoria } from "@/observability/caos";
import { MedicionesEnMemoria } from "@/observability/infrastructure/mediciones-en-memoria";
import { FESTIVAL } from "@/shared/config/constants";

/**
 * Composition root: el ÚNICO lugar que conoce las implementaciones concretas.
 * Los casos de uso reciben interfaces (puertos) por constructor; aquí se
 * conectan con repositorios en memoria alimentados por los datos quemados.
 */
export function crearContenedor(catalogo: Catalogo = crearCatalogo()) {
  const eventosRepo = new EventoRepositoryEnMemoria(catalogo.eventos);
  const artistasRepo = new ArtistaRepositoryEnMemoria(catalogo.artistas, eventosRepo);
  const comparsasRepo = new ComparsaRepositoryEnMemoria(catalogo.comparsas);
  const boleteriaRepo = new BoleteriaRepositoryEnMemoria(catalogo.sesiones);
  const resultadosRepo = new ResultadoRepositoryEnMemoria(catalogo.resultados);
  const agendaRepo = new AgendaRepositoryEnMemoria();
  const usuariosRepo = new UsuarioRepositoryEnMemoria(catalogo.usuarios);
  const caos = new AjustesCaosEnMemoria();
  const gateway = new ProgramacionGatewaySimulado(eventosRepo, caos);

  return {
    caos,
    mediciones: new MedicionesEnMemoria(),
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
      iniciarSesion: new IniciarSesion(usuariosRepo),
      registrar: new RegistrarUsuario(usuariosRepo),
      obtener: (id: number) => usuariosRepo.obtenerPorId(id),
    },
  };
}

export type Contenedor = ReturnType<typeof crearContenedor>;
