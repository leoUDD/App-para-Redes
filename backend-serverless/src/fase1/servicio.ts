import {
  ErrorAplicacion,
} from "../compartido/respuestas.js";
import type {
  EtapaLista,
  ModoEquipo,
  RepositorioFase1,
  SesionFase1,
} from "./repositorio.js";

export const PALABRAS_FASE1 = [
  "IDEA",
  "EQUIPO",
  "NEGOCIO",
  "CREATIVIDAD",
  "LIDERAZGO",
  "VALOR",
  "IMPACTO",
  "CLIENTE",
] as const;

const PALABRAS_VALIDAS = new Set<string>(
  PALABRAS_FASE1,
);

function segundosRestantes(
  sesion: SesionFase1,
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

  return Math.max(0, sesion.segundosRestantes ?? 0);
}

function segundosRestantesConocidos(
  sesion: SesionFase1,
): number {
  if (!sesion.conocidosActividadIniciada) {
    return 10;
  }

  if (sesion.conocidosTimerFin) {
    const fin = Date.parse(sesion.conocidosTimerFin);

    if (Number.isFinite(fin)) {
      return Math.max(
        0,
        Math.ceil((fin - Date.now()) / 1000),
      );
    }
  }

  return 0;
}

function rutaSugerida(
  fase: string,
  modoEquipo: ModoEquipo | undefined,
): string {
  if (fase === "f1_bienvenida") {
    return "bienvenida.html";
  }

  if (fase === "f1_conocidos") {
    return modoEquipo
      ? "conocidos.html"
      : "modo-equipo.html";
  }

  if (fase === "f1_pre_sopa") {
    return "trabajo-equipo.html";
  }

  if (fase === "f1_sopa") {
    return "sopa-letras.html";
  }

  if (fase === "f1_ranking") {
    return "ranking.html";
  }

  if (fase === "mapa_f2_empatia") {
    return "../mapa/habilidades.html";
  }

  if (fase === "f2_transicion") {
    return "../fase2/transicion-desafio.html";
  }

  if (fase === "f2_tematicas") {
    return "../fase2/tematicas.html";
  }

  if (fase === "f2_transicion_empatia") {
    return "../fase2/transicion-empatia.html";
  }

  if (fase === "f2_bubblemap") {
    return "../fase2/bubblemap.html";
  }

  if (fase === "f2_ranking") {
    return "../fase2/ranking.html";
  }

  return "ranking.html";
}

export async function obtenerEstadoFase1(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase1,
) {
  const [sesion, grupo, palabras] =
    await Promise.all([
      repositorio.buscarSesion(sesionId),
      repositorio.buscarGrupo(sesionId, grupoId),
      repositorio.listarPalabras(sesionId, grupoId),
    ]);

  if (!sesion || !grupo) {
    throw new ErrorAplicacion(
      "No se encontró la sesión o el grupo",
      404,
      "CONTEXTO_NO_ENCONTRADO",
    );
  }

  return {
    ok: true,
    fase: sesion.fase,
    rutaSugerida: rutaSugerida(
      sesion.fase,
      grupo.modoEquipo,
    ),
    timer: {
      corriendo: sesion.timerCorriendo,
      segundosRestantes: segundosRestantes(sesion),
    },
    actividadConocidos: {
      iniciada: Boolean(
        sesion.conocidosActividadIniciada,
      ),
      segundosRestantes:
        segundosRestantesConocidos(sesion),
    },
    grupo,
    palabras,
    palabrasObjetivo: PALABRAS_FASE1,
    progreso: {
      conocidos: {
        completados: sesion.gruposListosConocidos ?? 0,
        totalGrupos: sesion.totalGrupos,
      },
      preSopa: {
        completados: sesion.gruposListosF1 ?? 0,
        totalGrupos: sesion.totalGrupos,
      },
      sopa: {
        completados: sesion.gruposSopaCompletada,
        totalGrupos: sesion.totalGrupos,
      },
    },
  };
}

export async function iniciarFase1(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase1,
) {
  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion) {
    throw new ErrorAplicacion(
      "No se encontró la sesión",
      404,
      "SESION_NO_ENCONTRADA",
    );
  }

  if (sesion.fase === "f1_bienvenida") {
    if (!repositorio.iniciarFaseAtomica) {
      throw new ErrorAplicacion(
        "El repositorio no permite iniciar la fase",
        500,
        "REPOSITORIO_INCOMPLETO",
      );
    }

    await repositorio.iniciarFaseAtomica(sesionId);
  }

  return obtenerEstadoFase1(
    sesionId,
    grupoId,
    repositorio,
  );
}

export async function seleccionarModoEquipo(
  sesionId: string,
  grupoId: string,
  modo: string,
  repositorio: RepositorioFase1,
) {
  if (modo !== "primera_vez" && modo !== "conocidos") {
    throw new ErrorAplicacion(
      "El modo seleccionado no es válido",
      400,
      "MODO_INVALIDO",
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

  if (sesion.fase !== "f1_conocidos") {
    throw new ErrorAplicacion(
      "La selección de modo no está disponible en esta fase",
      409,
      "FASE_INVALIDA",
    );
  }

  if (!repositorio.guardarModoEquipo) {
    throw new ErrorAplicacion(
      "El repositorio no permite guardar el modo",
      500,
      "REPOSITORIO_INCOMPLETO",
    );
  }

  await repositorio.guardarModoEquipo(
    sesionId,
    grupoId,
    modo,
  );

  return obtenerEstadoFase1(
    sesionId,
    grupoId,
    repositorio,
  );
}

export async function marcarGrupoListo(
  sesionId: string,
  grupoId: string,
  etapa: EtapaLista,
  repositorio: RepositorioFase1,
) {
  if (etapa !== "conocidos" && etapa !== "pre_sopa") {
    throw new ErrorAplicacion(
      "La etapa enviada no es válida",
      400,
      "ETAPA_INVALIDA",
    );
  }

  for (let intento = 0; intento < 5; intento += 1) {
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

    if (etapa === "conocidos" && !grupo.modoEquipo) {
      throw new ErrorAplicacion(
        "Primero deben seleccionar el modo del equipo",
        409,
        "MODO_NO_SELECCIONADO",
      );
    }

    const yaListo =
      etapa === "conocidos"
        ? grupo.listoConocidos
        : grupo.listoF1;

    if (yaListo) {
      return obtenerEstadoFase1(
        sesionId,
        grupoId,
        repositorio,
      );
    }

    const faseEsperada =
      etapa === "conocidos"
        ? "f1_conocidos"
        : "f1_pre_sopa";

    if (sesion.fase !== faseEsperada) {
      return obtenerEstadoFase1(
        sesionId,
        grupoId,
        repositorio,
      );
    }

    if (sesion.totalGrupos <= 0) {
      throw new ErrorAplicacion(
        "La sesión no tiene grupos configurados",
        409,
        "SESION_SIN_GRUPOS",
      );
    }

    const cantidadEsperada =
      etapa === "conocidos"
        ? (sesion.gruposListosConocidos ?? 0)
        : (sesion.gruposListosF1 ?? 0);
    const nuevaCantidad = cantidadEsperada + 1;
    const todosListos =
      nuevaCantidad >= sesion.totalGrupos;
    const ahora = new Date();

    if (!repositorio.marcarListoAtomico) {
      throw new ErrorAplicacion(
        "El repositorio no permite sincronizar grupos",
        500,
        "REPOSITORIO_INCOMPLETO",
      );
    }

    const guardado =
      await repositorio.marcarListoAtomico({
        sesionId,
        grupoId,
        etapa,
        cantidadEsperada,
        nuevaCantidad,
        todosListos,
        ahora: ahora.toISOString(),
        ...(todosListos
          ? {
              timerFin: new Date(
                ahora.getTime() +
                  (etapa === "conocidos" ? 10_000 : 60_000),
              ).toISOString(),
            }
          : {}),
      });

    if (guardado) {
      return obtenerEstadoFase1(
        sesionId,
        grupoId,
        repositorio,
      );
    }
  }

  throw new ErrorAplicacion(
    "Otro grupo actualizó la sesión al mismo tiempo. Intenta nuevamente.",
    409,
    "CONFLICTO_CONCURRENCIA",
  );
}

export async function finalizarActividadConocidos(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase1,
) {
  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion) {
    throw new ErrorAplicacion(
      "No se encontró la sesión",
      404,
      "SESION_NO_ENCONTRADA",
    );
  }

  if (sesion.fase !== "f1_conocidos") {
    return obtenerEstadoFase1(
      sesionId,
      grupoId,
      repositorio,
    );
  }

  if (
    !sesion.conocidosActividadIniciada ||
    segundosRestantesConocidos(sesion) > 0
  ) {
    return obtenerEstadoFase1(
      sesionId,
      grupoId,
      repositorio,
    );
  }

  if (!repositorio.finalizarConocidosAtomico) {
    throw new ErrorAplicacion(
      "El repositorio no permite finalizar la actividad",
      500,
      "REPOSITORIO_INCOMPLETO",
    );
  }

  await repositorio.finalizarConocidosAtomico(
    sesionId,
    new Date().toISOString(),
  );

  return obtenerEstadoFase1(
    sesionId,
    grupoId,
    repositorio,
  );
}

export async function registrarPalabra(
  sesionId: string,
  grupoId: string,
  palabraRecibida: string,
  repositorio: RepositorioFase1,
) {
  const palabra = palabraRecibida
    .trim()
    .toUpperCase();

  if (!palabra) {
    throw new ErrorAplicacion(
      "Debes enviar una palabra",
      400,
      "PALABRA_REQUERIDA",
    );
  }

  if (!PALABRAS_VALIDAS.has(palabra)) {
    throw new ErrorAplicacion(
      "La palabra no pertenece a esta misión",
      400,
      "PALABRA_INVALIDA",
    );
  }

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

  if (
    sesion.fase !== "f1_sopa" &&
    sesion.fase !== "f1_ranking"
  ) {
    throw new ErrorAplicacion(
      "La sopa de letras todavía no ha comenzado",
      409,
      "FASE_INVALIDA",
    );
  }

  const creada =
    await repositorio.registrarPalabraAtomica(
      sesionId,
      grupoId,
      palabra,
      1,
    );

  if (
    !creada &&
    !(await repositorio.palabraExiste(
      sesionId,
      grupoId,
      palabra,
    ))
  ) {
    throw new ErrorAplicacion(
      "No se pudo guardar la palabra",
      409,
      "CONFLICTO_PALABRA",
    );
  }

  const grupoActualizado =
    await repositorio.buscarGrupo(sesionId, grupoId);

  return {
    ok: true,
    palabra,
    nueva: creada,
    recompensa: creada ? 1 : 0,
    tokens: grupoActualizado?.tokens ?? grupo.tokens,
  };
}

export async function completarSopa(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase1,
) {
  for (let intento = 0; intento < 5; intento += 1) {
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

    if (grupo.sopaCompletada) {
      return {
        ok: true,
        yaCompletada: true,
        bonificacion: 0,
        tokens: grupo.tokens,
        fase: sesion.fase,
      };
    }

    if (sesion.fase !== "f1_sopa") {
      throw new ErrorAplicacion(
        "La sopa de letras no está activa",
        409,
        "FASE_INVALIDA",
      );
    }

    if (sesion.totalGrupos <= 0) {
      throw new ErrorAplicacion(
        "La sesión no tiene grupos configurados",
        409,
        "SESION_SIN_GRUPOS",
      );
    }

    const nuevaCantidad =
      sesion.gruposSopaCompletada + 1;
    const esPrimerGrupo = !sesion.primerGrupoSopaId;
    const todosCompletaron =
      nuevaCantidad >= sesion.totalGrupos;
    const bonificacion = esPrimerGrupo ? 5 : 3;
    const segundosTranscurridos = sesion.timerInicio
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - Date.parse(sesion.timerInicio)) /
              1000,
          ),
        )
      : undefined;

    const completada =
      await repositorio.completarSopaAtomica({
        sesionId,
        grupoId,
        cantidadEsperada:
          sesion.gruposSopaCompletada,
        nuevaCantidad,
        esPrimerGrupo,
        todosCompletaron,
        bonificacion,
        ...(segundosTranscurridos === undefined
          ? {}
          : { segundosTranscurridos }),
      });

    if (!completada) {
      continue;
    }

    const [sesionActualizada, grupoActualizado] =
      await Promise.all([
        repositorio.buscarSesion(sesionId),
        repositorio.buscarGrupo(sesionId, grupoId),
      ]);

    return {
      ok: true,
      yaCompletada: false,
      esPrimerGrupo,
      todosCompletaron,
      bonificacion,
      tokens:
        grupoActualizado?.tokens ??
        grupo.tokens + bonificacion,
      fase:
        sesionActualizada?.fase ??
        (todosCompletaron
          ? "f1_ranking"
          : sesion.fase),
    };
  }

  throw new ErrorAplicacion(
    "Otro grupo actualizó la sesión al mismo tiempo. Intenta nuevamente.",
    409,
    "CONFLICTO_CONCURRENCIA",
  );
}

export async function obtenerRankingFase1(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase1,
) {
  if (!repositorio.listarGrupos) {
    throw new ErrorAplicacion(
      "El repositorio no permite obtener el ranking",
      500,
      "REPOSITORIO_INCOMPLETO",
    );
  }

  const grupos = await repositorio.listarGrupos(sesionId);

  const ordenados = [...grupos].sort((a, b) => {
    if (b.tokens !== a.tokens) {
      return b.tokens - a.tokens;
    }

    const tiempoA = a.sopaTiempoSegundos ?? Infinity;
    const tiempoB = b.sopaTiempoSegundos ?? Infinity;

    if (tiempoA !== tiempoB) {
      return tiempoA - tiempoB;
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
      esMiGrupo: grupo.grupoId === grupoId,
      sopaCompletada: grupo.sopaCompletada,
      ...(grupo.sopaTiempoSegundos !== undefined
        ? {
            sopaTiempoSegundos:
              grupo.sopaTiempoSegundos,
          }
        : {}),
    })),
  };
}
