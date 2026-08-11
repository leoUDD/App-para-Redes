import {
  ErrorAplicacion,
} from "../compartido/respuestas.js";
import type {
  BubbleMapDatos,
  GrupoFase2,
  RepositorioFase2,
  SesionFase2,
} from "./repositorio.js";

export interface DesafioFase2 {
  id: string;
  nombre: string;
  resumen: string;
  descripcion: string;
}

export interface TematicaFase2 {
  id: string;
  titulo: string;
  hero: string;
  chips: string[];
  accent: string;
  imagen: string;
  desafios: DesafioFase2[];
}

export const TEMATICAS_FASE2: TematicaFase2[] = [
  {
    id: "salud",
    titulo: "Desafíos — Salud",
    hero: "Mejora hábitos y bienestar en tu comunidad.",
    chips: ["Empatía", "Bienestar", "Innovación"],
    accent: "#22c55e",
    imagen: "tema_salud.png",
    desafios: [
      {
        id: "salud-1",
        nombre: "Autogestión de tratamientos",
        resumen:
          "Mejora la adherencia a tratamientos médicos en pacientes crónicos.",
        descripcion:
          "Muchos errores médicos y complicaciones surgen al cambiar de un centro de salud a otro por falta de continuidad y seguimiento personalizado. Don Humberto, de 50 años, fue dado de alta con indicaciones médicas complejas, pero no entendió qué debía seguir tomando ni a quién acudir si se sentía mal.",
      },
      {
        id: "salud-2",
        nombre: "Obesidad",
        resumen:
          "Aborda el sobrepeso mediante educación y hábitos saludables.",
        descripcion:
          "Simona tiene 27 años, una hija pequeña y trabaja tiempo completo. Sabe que la alimentación es clave, pero no ha logrado organizarse ni aprender cómo entregar una nutrición adecuada a su hija.",
      },
      {
        id: "salud-3",
        nombre: "Envejecimiento activo",
        resumen:
          "Fomenta la actividad y socialización de personas mayores.",
        descripcion:
          "Juana es una adulta mayor que quiere mantenerse activa, pero le cuesta encontrar actividades cercanas, accesibles y acompañadas que le permitan relacionarse con otras personas.",
      },
    ],
  },
  {
    id: "sustentabilidad",
    titulo: "Desafíos — Sustentabilidad",
    hero: "Crea impacto ambiental positivo y medible.",
    chips: ["Ambiental", "Circular", "Creativo"],
    accent: "#14b8a6",
    imagen: "tema_sustentabilidad.png",
    desafios: [
      {
        id: "sustentabilidad-1",
        nombre: "Contaminación por fast fashion",
        resumen:
          "Reduce el impacto de la ropa desechada y su consumo acelerado.",
        descripcion:
          "Gabriela es una estudiante de 18 años que vive cerca de sectores donde vertederos textiles y basurales afectan la vida diaria de las personas con residuos y olores desagradables.",
      },
      {
        id: "sustentabilidad-2",
        nombre: "Acceso al agua en la agricultura",
        resumen:
          "La escasez de agua dulce afecta la producción rural.",
        descripcion:
          "Camila es una agricultora de 50 años que cultiva paltas de exportación y teme perder su negocio debido a la gran cantidad de agua que necesita utilizar.",
      },
      {
        id: "sustentabilidad-3",
        nombre: "Gestión de residuos electrónicos",
        resumen:
          "Facilita el reciclaje de desechos electrónicos a gran escala.",
        descripcion:
          "Francisco acumula computadores, teléfonos y cables que ya no utiliza, pero no sabe dónde entregarlos ni cómo comprobar que serán reciclados de manera responsable.",
      },
    ],
  },
  {
    id: "educacion",
    titulo: "Desafíos — Educación",
    hero: "Mejora la experiencia de aprendizaje e inclusión.",
    chips: ["Comunicar", "Liderazgo", "Ideas"],
    accent: "#8b5cf6",
    imagen: "tema_educacion.png",
    desafios: [
      {
        id: "educacion-1",
        nombre: "Educación financiera accesible",
        resumen:
          "Acerca conceptos financieros a jóvenes de forma simple.",
        descripcion:
          "Martina comenzó a administrar sus primeros ingresos, pero no sabe cómo crear un presupuesto, evitar deudas ni tomar decisiones financieras informadas.",
      },
      {
        id: "educacion-2",
        nombre: "Inicio de vida laboral",
        resumen:
          "Prepara a jóvenes para enfrentar su primer empleo.",
        descripcion:
          "Andrés está terminando sus estudios y busca trabajo por primera vez. No sabe cómo presentarse, preparar una entrevista ni comprender sus responsabilidades laborales.",
      },
      {
        id: "educacion-3",
        nombre: "Tecnología para adultos mayores",
        resumen:
          "Facilita el aprendizaje digital de personas mayores.",
        descripcion:
          "Osvaldo quiere usar servicios digitales para comunicarse y realizar trámites, pero las instrucciones le parecen complejas y teme equivocarse o ser víctima de un engaño.",
      },
    ],
  },
];

export type EtapaListaFase2 =
  | "ranking_f1"
  | "mapa_empatia"
  | "transicion"
  | "empatia";

const DURACION_ELECCION_SEGUNDOS = 120;
const DURACION_BUBBLE_SEGUNDOS = 180;

function segundosRestantes(
  sesion: SesionFase2,
): number {
  if (sesion.timerCorriendo && sesion.timerFin) {
    const fin = Date.parse(sesion.timerFin);

    if (Number.isFinite(fin)) {
      return Math.max(
        0,
        Math.ceil((fin - Date.now()) / 1000),
      );
    }
  }

  return Math.max(0, sesion.segundosRestantes);
}

function rutaSugerida(
  fase: string,
  grupo: GrupoFase2,
): string {
  if (fase.startsWith("f1_")) {
    return "../fase1/ranking.html";
  }

  if (fase === "mapa_f2_empatia") {
    return "../mapa/habilidades.html";
  }

  if (fase === "f2_transicion") {
    return "transicion-desafio.html";
  }

  if (fase === "f2_tematicas") {
    return grupo.listoF2Desafio
      ? "espera-eleccion.html"
      : "tematicas.html";
  }

  if (fase === "f2_transicion_empatia") {
    return "transicion-empatia.html";
  }

  if (fase === "f2_bubblemap") {
    return "bubblemap.html";
  }

  if (fase === "f2_ranking") {
    return "ranking.html";
  }

  if (fase === "mapa_f3_creatividad") {
    return "../mapa/creatividad.html";
  }

  if (fase === "f3_transicion_creatividad") {
    return "../fase3/transicion-creatividad.html";
  }

  if (fase === "f3_lego") {
    return "../fase3/lego.html";
  }

  if (fase === "f3_ranking") {
    return "../fase3/ranking.html";
  }

  if (fase === "mapa_f4_final" || fase.startsWith("f4_")) {
    return "../mapa/final.html";
  }

  return "transicion-desafio.html";
}

function contarListos(
  grupos: GrupoFase2[],
  campo:
    | "listoF2Ranking"
    | "listoF2Mapa"
    | "listoF2Transicion"
    | "listoF2Empatia"
    | "listoF2Desafio"
    | "bubbleCompletado",
): number {
  return grupos.filter((grupo) => Boolean(grupo[campo])).length;
}

function buscarTematica(id: string): TematicaFase2 {
  const tematica = TEMATICAS_FASE2.find(
    (elemento) => elemento.id === id,
  );

  if (!tematica) {
    throw new ErrorAplicacion(
      "La temática seleccionada no existe",
      400,
      "TEMATICA_INVALIDA",
    );
  }

  return tematica;
}

function buscarDesafio(
  tematica: TematicaFase2,
  id: string,
): DesafioFase2 {
  const desafio = tematica.desafios.find(
    (elemento) => elemento.id === id,
  );

  if (!desafio) {
    throw new ErrorAplicacion(
      "El desafío seleccionado no existe",
      400,
      "DESAFIO_INVALIDO",
    );
  }

  return desafio;
}

function normalizarTexto(valor: unknown): string {
  return String(valor ?? "").trim().slice(0, 1000);
}

export function normalizarBubbleMap(
  entrada: Partial<BubbleMapDatos>,
): BubbleMapDatos {
  const otros = Array.isArray(entrada.otros)
    ? entrada.otros
        .map(normalizarTexto)
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return {
    emociones: normalizarTexto(entrada.emociones),
    gustos: normalizarTexto(entrada.gustos),
    entorno: normalizarTexto(entrada.entorno),
    necesidades: normalizarTexto(entrada.necesidades),
    limitaciones: normalizarTexto(entrada.limitaciones),
    motivaciones: normalizarTexto(entrada.motivaciones),
    otros,
    relato: normalizarTexto(entrada.relato),
    link: normalizarTexto(entrada.link),
  };
}

export function calcularPuntajeBubbleMap(
  datos: BubbleMapDatos,
): number {
  const camposPrincipales = [
    datos.emociones,
    datos.gustos,
    datos.entorno,
    datos.necesidades,
    datos.limitaciones,
    datos.motivaciones,
  ];

  const principales = camposPrincipales.filter(Boolean).length;
  const otros = Math.min(2, datos.otros.filter(Boolean).length);
  const relato = datos.relato ? 1 : 0;
  const link = datos.link ? 1 : 0;

  return Math.min(10, principales + otros + relato + link);
}

export async function obtenerEstadoFase2(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase2,
) {
  const [sesion, grupo, grupos] = await Promise.all([
    repositorio.buscarSesion(sesionId),
    repositorio.buscarGrupo(sesionId, grupoId),
    repositorio.listarGrupos(sesionId),
  ]);

  if (!sesion || !grupo) {
    throw new ErrorAplicacion(
      "No se encontró la sesión o el grupo",
      404,
      "CONTEXTO_NO_ENCONTRADO",
    );
  }

  const restantes = segundosRestantes(sesion);

  return {
    ok: true,
    fase: sesion.fase,
    rutaSugerida: rutaSugerida(sesion.fase, grupo),
    timer: {
      corriendo:
        Boolean(sesion.timerCorriendo) && restantes > 0,
      segundosRestantes: restantes,
      expirado:
        Boolean(sesion.timerCorriendo) && restantes === 0,
    },
    grupo,
    tematicas: TEMATICAS_FASE2,
    progreso: {
      rankingF1: {
        completados: contarListos(grupos, "listoF2Ranking"),
        totalGrupos: sesion.totalGrupos,
      },
      mapaEmpatia: {
        completados: contarListos(grupos, "listoF2Mapa"),
        totalGrupos: sesion.totalGrupos,
      },
      transicion: {
        completados: contarListos(
          grupos,
          "listoF2Transicion",
        ),
        totalGrupos: sesion.totalGrupos,
      },
      seleccion: {
        completados: contarListos(grupos, "listoF2Desafio"),
        totalGrupos: sesion.totalGrupos,
      },
      empatia: {
        completados: contarListos(grupos, "listoF2Empatia"),
        totalGrupos: sesion.totalGrupos,
      },
      bubble: {
        completados: contarListos(grupos, "bubbleCompletado"),
        totalGrupos: sesion.totalGrupos,
      },
    },
  };
}

interface ConfiguracionListo {
  campo:
    | "listoF2Ranking"
    | "listoF2Mapa"
    | "listoF2Transicion"
    | "listoF2Empatia";
  fasesEsperadas: string[];
  nuevaFase: string;
  duracion: number;
}

const CONFIGURACION_LISTO: Record<
  EtapaListaFase2,
  ConfiguracionListo
> = {
  ranking_f1: {
    campo: "listoF2Ranking",
    fasesEsperadas: ["f1_ranking"],
    nuevaFase: "mapa_f2_empatia",
    duracion: 0,
  },
  mapa_empatia: {
    campo: "listoF2Mapa",
    fasesEsperadas: ["mapa_f2_empatia"],
    nuevaFase: "f2_transicion",
    duracion: 0,
  },
  transicion: {
    campo: "listoF2Transicion",
    fasesEsperadas: [
      "mapa_f2_empatia",
      "f2_transicion",
    ],
    nuevaFase: "f2_tematicas",
    duracion: DURACION_ELECCION_SEGUNDOS,
  },
  empatia: {
    campo: "listoF2Empatia",
    fasesEsperadas: ["f2_transicion_empatia"],
    nuevaFase: "f2_bubblemap",
    duracion: DURACION_BUBBLE_SEGUNDOS,
  },
};

export async function marcarListoFase2(
  sesionId: string,
  grupoId: string,
  etapa: EtapaListaFase2,
  repositorio: RepositorioFase2,
) {
  const configuracion = CONFIGURACION_LISTO[etapa];

  if (!configuracion) {
    throw new ErrorAplicacion(
      "La etapa indicada no es válida",
      400,
      "ETAPA_INVALIDA",
    );
  }

  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion) {
    throw new ErrorAplicacion(
      "No se encontró la sesión",
      404,
      "SESION_NO_ENCONTRADA",
    );
  }

  if (!configuracion.fasesEsperadas.includes(sesion.fase)) {
    return obtenerEstadoFase2(
      sesionId,
      grupoId,
      repositorio,
    );
  }

  await repositorio.marcarListo(
    sesionId,
    grupoId,
    configuracion.campo,
  );

  const grupos = await repositorio.listarGrupos(sesionId);
  const todosListos =
    grupos.length > 0 &&
    grupos.every((grupo) =>
      Boolean(grupo[configuracion.campo]),
    );

  if (todosListos) {
    await repositorio.cambiarFase(
      sesionId,
      configuracion.fasesEsperadas,
      configuracion.nuevaFase,
      configuracion.duracion,
    );
  }

  return obtenerEstadoFase2(
    sesionId,
    grupoId,
    repositorio,
  );
}

export async function iniciarFase2(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase2,
) {
  return marcarListoFase2(
    sesionId,
    grupoId,
    "ranking_f1",
    repositorio,
  );
}

export async function seleccionarDesafio(
  sesionId: string,
  grupoId: string,
  temaId: string,
  desafioId: string,
  repositorio: RepositorioFase2,
) {
  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion) {
    throw new ErrorAplicacion(
      "No se encontró la sesión",
      404,
      "SESION_NO_ENCONTRADA",
    );
  }

  if (sesion.fase !== "f2_tematicas") {
    return obtenerEstadoFase2(
      sesionId,
      grupoId,
      repositorio,
    );
  }

  const tematica = buscarTematica(temaId);
  const desafio = buscarDesafio(tematica, desafioId);

  await repositorio.guardarSeleccion(
    sesionId,
    grupoId,
    tematica.id,
    desafio.id,
    desafio.nombre,
    desafio.descripcion,
  );

  const grupos = await repositorio.listarGrupos(sesionId);
  const todosSeleccionaron =
    grupos.length > 0 &&
    grupos.every((grupo) => grupo.listoF2Desafio);

  if (todosSeleccionaron) {
    await repositorio.cambiarFase(
      sesionId,
      ["f2_tematicas"],
      "f2_transicion_empatia",
      0,
    );
  }

  return obtenerEstadoFase2(
    sesionId,
    grupoId,
    repositorio,
  );
}

function indiceDeterminista(
  texto: string,
  total: number,
): number {
  let acumulado = 0;

  for (const caracter of texto) {
    acumulado = (acumulado * 31 + caracter.charCodeAt(0)) >>> 0;
  }

  return total > 0 ? acumulado % total : 0;
}

export async function asignarDesafioAleatorio(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase2,
) {
  const grupo = await repositorio.buscarGrupo(
    sesionId,
    grupoId,
  );

  if (!grupo) {
    throw new ErrorAplicacion(
      "No se encontró el grupo",
      404,
      "GRUPO_NO_ENCONTRADO",
    );
  }

  if (grupo.listoF2Desafio) {
    return obtenerEstadoFase2(
      sesionId,
      grupoId,
      repositorio,
    );
  }

  const indiceTema = indiceDeterminista(
    grupoId,
    TEMATICAS_FASE2.length,
  );
  const tematica = TEMATICAS_FASE2[indiceTema];

  if (!tematica) {
    throw new ErrorAplicacion(
      "No existen temáticas configuradas",
      500,
      "SIN_TEMATICAS",
    );
  }

  const indiceDesafio = indiceDeterminista(
    `${grupoId}-desafio`,
    tematica.desafios.length,
  );
  const desafio = tematica.desafios[indiceDesafio];

  if (!desafio) {
    throw new ErrorAplicacion(
      "No existen desafíos configurados",
      500,
      "SIN_DESAFIOS",
    );
  }

  return seleccionarDesafio(
    sesionId,
    grupoId,
    tematica.id,
    desafio.id,
    repositorio,
  );
}

export async function guardarBubbleMap(
  sesionId: string,
  grupoId: string,
  entrada: Partial<BubbleMapDatos>,
  repositorio: RepositorioFase2,
) {
  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion) {
    throw new ErrorAplicacion(
      "No se encontró la sesión",
      404,
      "SESION_NO_ENCONTRADA",
    );
  }

  if (
    sesion.fase !== "f2_bubblemap" &&
    sesion.fase !== "f2_ranking"
  ) {
    throw new ErrorAplicacion(
      "El Bubble Map todavía no está activo",
      409,
      "FASE_INVALIDA",
    );
  }

  const datos = normalizarBubbleMap(entrada);
  await repositorio.guardarBubbleMap(
    sesionId,
    grupoId,
    datos,
  );

  return {
    ok: true,
    guardado: true,
    puntajeActual: calcularPuntajeBubbleMap(datos),
  };
}

export async function completarBubbleMap(
  sesionId: string,
  grupoId: string,
  entrada: Partial<BubbleMapDatos>,
  repositorio: RepositorioFase2,
) {
  const [sesion, grupo] = await Promise.all([
    repositorio.buscarSesion(sesionId),
    repositorio.buscarGrupo(sesionId, grupoId),
  ]);

  if (!sesion || !grupo) {
    throw new ErrorAplicacion(
      "No se encontró la sesión o el grupo",
      404,
      "CONTEXTO_NO_ENCONTRADO",
    );
  }

  if (grupo.bubbleCompletado) {
    return {
      ...(await obtenerEstadoFase2(
        sesionId,
        grupoId,
        repositorio,
      )),
      yaCompletado: true,
      puntaje: grupo.bubblePuntaje,
      recompensa: grupo.bubbleTokensOtorgados,
    };
  }

  if (sesion.fase !== "f2_bubblemap") {
    return obtenerEstadoFase2(
      sesionId,
      grupoId,
      repositorio,
    );
  }

  const datos = normalizarBubbleMap(entrada);
  const puntaje = calcularPuntajeBubbleMap(datos);
  const recompensa = puntaje;

  await repositorio.guardarBubbleMap(
    sesionId,
    grupoId,
    datos,
  );

  const completado = await repositorio.completarBubbleMap(
    sesionId,
    grupoId,
    puntaje,
    recompensa,
  );

  const grupos = await repositorio.listarGrupos(sesionId);
  const todosCompletaron =
    grupos.length > 0 &&
    grupos.every((elemento) => elemento.bubbleCompletado);

  if (todosCompletaron) {
    await repositorio.cambiarFase(
      sesionId,
      ["f2_bubblemap"],
      "f2_ranking",
      0,
    );
  }

  return {
    ...(await obtenerEstadoFase2(
      sesionId,
      grupoId,
      repositorio,
    )),
    yaCompletado: !completado,
    puntaje,
    recompensa: completado ? recompensa : 0,
  };
}

export async function obtenerRankingFase2(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase2,
) {
  const grupos = await repositorio.listarGrupos(sesionId);
  const ordenados = [...grupos].sort((a, b) => {
    if (b.tokens !== a.tokens) {
      return b.tokens - a.tokens;
    }

    if (b.bubblePuntaje !== a.bubblePuntaje) {
      return b.bubblePuntaje - a.bubblePuntaje;
    }

    return a.nombreGrupo.localeCompare(b.nombreGrupo);
  });

  return {
    ok: true,
    ranking: ordenados.map((grupo, indice) => ({
      posicion: indice + 1,
      grupoId: grupo.grupoId,
      nombreGrupo: grupo.nombreGrupo,
      tokens: grupo.tokens,
      puntajeBubble: grupo.bubblePuntaje,
      esMiGrupo: grupo.grupoId === grupoId,
    })),
  };
}
