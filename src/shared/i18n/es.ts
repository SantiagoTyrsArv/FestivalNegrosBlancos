/**
 * Textos de interfaz en español. Centralizados para poder añadir otro idioma
 * creando un diccionario con la misma forma (`typeof es`) y eligiendo el
 * diccionario según el locale.
 */
export const es = {
  sitio: {
    nombre: "Carnaval de Blancos y Negros",
    nombreCorto: "Blancos y Negros",
    lema: "Seis siglos de juego, color y memoria en las calles de Pasto.",
    descripcion:
      "Plataforma del Carnaval de Blancos y Negros (edición ficticia de demostración): programación, comparsas, artistas, resultados y boletería.",
    saltarContenido: "Ir al contenido principal",
    avisoFicticio:
      "Proyecto académico. Festival, fechas, precios y datos son ficticios y creados para demostrar patrones de rendering.",
  },
  nav: {
    etiqueta: "Navegación principal",
    menu: "Menú",
    inicio: "Inicio",
    programacion: "Programación",
    comparsas: "Comparsas",
    resultados: "Resultados",
    boletas: "Boletas",
    enVivo: "En vivo",
    miAgenda: "Mi agenda",
    buscar: "Buscar",
    historia: "Historia",
    recorrido: "Recorrido",
    faq: "Preguntas frecuentes",
    observatorio: "Observatorio",
    ingresar: "Ingresar",
    salir: "Salir",
    admin: "Admin",
  },
  pie: {
    explorar: "Explorar",
    proyecto: "El proyecto",
    designSystem: "Design system",
    derechos: "Hecho con fines educativos.",
  },
  comun: {
    cargando: "Cargando…",
    reintentar: "Reintentar",
    volver: "Volver",
    verMas: "Ver más",
    cerrar: "Cerrar",
    errorGenerico: "Algo salió mal",
    errorGenericoDetalle: "No pudimos completar la operación. Intenta de nuevo en unos segundos.",
    noEncontrado: "No encontramos esta página",
    noEncontradoDetalle: "Puede que el enlace esté roto o que el contenido ya no exista.",
    irInicio: "Volver al inicio",
  },
} as const;

export type Diccionario = typeof es;
