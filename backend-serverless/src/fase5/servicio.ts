import {
  ErrorAplicacion,
} from "../compartido/respuestas.js";
import {
  DURACION_PRESENTACION_PITCH_SEGUNDOS,
} from "../fase4/servicio.js";
import type {
  RepositorioFase4,
} from "../fase4/repositorio.js";
import type {
  CriteriosEvaluacion,
  RepositorioFase5,
} from "./repositorio.js";
import { totalCriterios } from "./repositorio.js";

function segundosRestantes(sesion: {
  timerCorriendo: boolean;
  timerFin?: string;
  segundosRestantes: number;
}): number {
  if (sesion.timerCorriendo && sesion.timerFin) {
    const fin = Date.parse(sesion.timerFin);

    if (Number.isFinite(fin)) {
      return Math.max(0, Math.ceil((fin - Date.now()) / 1000));
    }
  }

  return Math.max(0, Number(sesion.segundosRestantes || 0));
}

async function evaluacionActualCompleta(
  sesionId: string,
  grupoPresentandoId: string,
  totalGrupos: number,
  repositorioFase5: RepositorioFase5,
): Promise<boolean> {
  const totalEvaluadores = Math.max(0, totalGrupos - 1);

  if (totalEvaluadores === 0) {
    return false;
  }

  const recibidas = await repositorioFase5.listarEvaluacionesDeGrupo(
    sesionId,
    grupoPresentandoId,
  );

  return recibidas.length >= totalEvaluadores;
}

async function completarEvaluacionesFaltantes(
  sesionId: string,
  grupoPresentandoId: string,
  grupos: { grupoId: string }[],
  repositorioFase4: RepositorioFase4,
  repositorioFase5: RepositorioFase5,
): Promise<void> {
  const yaEvaluaron = new Set(
    (
      await repositorioFase5.listarEvaluacionesDeGrupo(
        sesionId,
        grupoPresentandoId,
      )
    ).map((e) => e.grupoEvaluadorId),
  );

  const evaluadores = grupos.filter(
    (g) => g.grupoId !== grupoPresentandoId,
  );

  for (const evaluador of evaluadores) {
    if (yaEvaluaron.has(evaluador.grupoId)) {
      continue;
    }

    const creada = await repositorioFase5.crearEvaluacion(sesionId, {
      grupoEvaluadoId: grupoPresentandoId,
      grupoEvaluadorId: evaluador.grupoId,
      claridad: 5,
      creatividad: 5,
      viabilidad: 5,
      equipo: 5,
      presentacion: 5,
      comentario:
        "Evaluación completada automáticamente porque se agotó el tiempo.",
      reflexion: "",
      automatica: true,
    });

    if (creada) {
      await repositorioFase4.ajustarTokens(sesionId, evaluador.grupoId, -2);
    }
  }
}

async function premiarMejorPuntajeAcumulado(
  sesionId: string,
  repositorioFase4: RepositorioFase4,
  repositorioFase5: RepositorioFase5,
): Promise<void> {
  const todas = await repositorioFase5.listarTodasEvaluaciones(sesionId);

  if (!todas.length) {
    return;
  }

  const puntajePorGrupo = new Map<string, number>();

  for (const evaluacion of todas) {
    const actual = puntajePorGrupo.get(evaluacion.grupoEvaluadoId) ?? 0;
    puntajePorGrupo.set(
      evaluacion.grupoEvaluadoId,
      actual + totalCriterios(evaluacion),
    );
  }

  const maximo = Math.max(...puntajePorGrupo.values());

  const mejores = [...puntajePorGrupo.entries()]
    .filter(([, puntaje]) => puntaje === maximo)
    .map(([grupoId]) => grupoId);

  for (const grupoId of mejores) {
    await repositorioFase4.ajustarTokens(sesionId, grupoId, 3);
  }
}

async function otorgarTokensPeerReviewSiCorresponde(
  sesionId: string,
  grupoEvaluadorId: string,
  recompensaYaOtorgada: boolean,
  repositorioFase4: RepositorioFase4,
  repositorioFase5: RepositorioFase5,
): Promise<void> {
  if (recompensaYaOtorgada) {
    return;
  }

  const misEvaluaciones = await repositorioFase5.listarEvaluacionesDeEvaluador(
    sesionId,
    grupoEvaluadorId,
  );

  if (!misEvaluaciones.length) {
    return;
  }

  const mejor = [...misEvaluaciones].sort((a, b) => {
    const diferencia = totalCriterios(b) - totalCriterios(a);
    if (diferencia !== 0) return diferencia;
    return a.grupoEvaluadoId.localeCompare(b.grupoEvaluadoId);
  })[0];

  if (!mejor) {
    return;
  }

  await repositorioFase4.ajustarTokens(sesionId, mejor.grupoEvaluadoId, 2);
  await repositorioFase5.marcarRecompensaPeerOtorgada(
    sesionId,
    grupoEvaluadorId,
  );
}

export async function obtenerEstadoFase5(
  sesionId: string,
  grupoId: string,
  repositorioFase4: RepositorioFase4,
  repositorioFase5: RepositorioFase5,
) {
  let sesion = await repositorioFase4.buscarSesion(sesionId);
  let grupo = await repositorioFase4.buscarGrupo(sesionId, grupoId);
  let grupos = await repositorioFase4.listarGrupos(sesionId);

  if (!sesion || !grupo) {
    throw new ErrorAplicacion(
      "No se encontró la sesión o el grupo",
      404,
      "CONTEXTO_NO_ENCONTRADO",
    );
  }

  if (
    sesion.fase === "f5_evaluacion_pitch" &&
    sesion.timerCorriendo &&
    segundosRestantes(sesion) === 0 &&
    sesion.grupoPresentandoId
  ) {
    await completarEvaluacionesFaltantes(
      sesionId,
      sesion.grupoPresentandoId,
      grupos,
      repositorioFase4,
      repositorioFase5,
    );
    await premiarMejorPuntajeAcumulado(
      sesionId,
      repositorioFase4,
      repositorioFase5,
    );
    await repositorioFase4.avanzarSiguientePitchORanking(
      sesionId,
      sesion.grupoPresentandoId,
      DURACION_PRESENTACION_PITCH_SEGUNDOS,
    );

    sesion = await repositorioFase4.buscarSesion(sesionId);
    grupo = await repositorioFase4.buscarGrupo(sesionId, grupoId);
    grupos = await repositorioFase4.listarGrupos(sesionId);

    if (!sesion || !grupo) {
      throw new ErrorAplicacion(
        "No se encontró la sesión o el grupo",
        404,
        "CONTEXTO_NO_ENCONTRADO",
      );
    }
  }

  const esQuienPresenta = sesion.grupoPresentandoId === grupoId;

  let yaEvalue = false;

  if (sesion.grupoPresentandoId && !esQuienPresenta) {
    const misEvaluaciones = await repositorioFase5.listarEvaluacionesDeEvaluador(
      sesionId,
      grupoId,
    );
    yaEvalue = misEvaluaciones.some(
      (e) => e.grupoEvaluadoId === sesion!.grupoPresentandoId,
    );
  }

  return {
    ok: true,
    fase: sesion.fase,
    timer: {
      corriendo: sesion.timerCorriendo && segundosRestantes(sesion) > 0,
      segundosRestantes: segundosRestantes(sesion),
    },
    grupoPresentandoId: sesion.grupoPresentandoId,
    esQuienPresenta,
    yaEvalue,
    totalGrupos: sesion.totalGrupos,
    grupos: grupos.map((g) => ({
      grupoId: g.grupoId,
      nombreGrupo: g.nombreGrupo,
      tokens: g.tokens,
    })),
  };
}

export async function enviarEvaluacion(
  sesionId: string,
  grupoEvaluadorId: string,
  entrada: Partial<CriteriosEvaluacion> & {
    comentario?: string;
    reflexion?: string;
  },
  repositorioFase4: RepositorioFase4,
  repositorioFase5: RepositorioFase5,
) {
  const sesion = await repositorioFase4.buscarSesion(sesionId);
  const grupoEvaluador = await repositorioFase4.buscarGrupo(
    sesionId,
    grupoEvaluadorId,
  );

  if (!sesion || !grupoEvaluador) {
    throw new ErrorAplicacion(
      "No se encontró la sesión o el grupo",
      404,
      "CONTEXTO_NO_ENCONTRADO",
    );
  }

  if (sesion.fase !== "f5_evaluacion_pitch" || !sesion.grupoPresentandoId) {
    throw new ErrorAplicacion(
      "La sesión no está en etapa de evaluación entre pares",
      400,
      "FASE_INVALIDA",
    );
  }

  if (sesion.grupoPresentandoId === grupoEvaluadorId) {
    throw new ErrorAplicacion(
      "Tu equipo no puede evaluarse a sí mismo mientras presenta",
      403,
      "NO_PUEDES_EVALUARTE",
    );
  }

  const criterios: CriteriosEvaluacion = {
    claridad: Number(entrada.claridad ?? 0),
    creatividad: Number(entrada.creatividad ?? 0),
    viabilidad: Number(entrada.viabilidad ?? 0),
    equipo: Number(entrada.equipo ?? 0),
    presentacion: Number(entrada.presentacion ?? 0),
  };

  for (const [clave, valor] of Object.entries(criterios)) {
    if (!Number.isFinite(valor) || valor < 1 || valor > 5) {
      throw new ErrorAplicacion(
        `El criterio "${clave}" debe ser un número entre 1 y 5`,
        400,
        "CRITERIO_INVALIDO",
      );
    }
  }

  const creada = await repositorioFase5.crearEvaluacion(sesionId, {
    grupoEvaluadoId: sesion.grupoPresentandoId,
    grupoEvaluadorId,
    ...criterios,
    comentario: String(entrada.comentario || "").trim(),
    reflexion: String(entrada.reflexion || "").trim(),
    automatica: false,
  });

  if (!creada) {
    throw new ErrorAplicacion(
      "Tu equipo ya evaluó a este grupo",
      409,
      "EVALUACION_DUPLICADA",
    );
  }

  await otorgarTokensPeerReviewSiCorresponde(
    sesionId,
    grupoEvaluadorId,
    grupoEvaluador.recompensaPeerOtorgada,
    repositorioFase4,
    repositorioFase5,
  );

  await repositorioFase4.marcarListo(sesionId, grupoEvaluadorId, "listoF5");

  const grupos = await repositorioFase4.listarGrupos(sesionId);
  const completa = await evaluacionActualCompleta(
    sesionId,
    sesion.grupoPresentandoId,
    sesion.totalGrupos,
    repositorioFase5,
  );

  if (completa) {
    await repositorioFase4.avanzarSiguientePitchORanking(
      sesionId,
      sesion.grupoPresentandoId,
      DURACION_PRESENTACION_PITCH_SEGUNDOS,
    );
  }

  return obtenerEstadoFase5(
    sesionId,
    grupoEvaluadorId,
    repositorioFase4,
    repositorioFase5,
  );
}

export async function marcarListoRankingFinal(
  sesionId: string,
  grupoId: string,
  repositorioFase4: RepositorioFase4,
) {
  const sesion = await repositorioFase4.buscarSesion(sesionId);

  if (!sesion || sesion.fase !== "f6_ranking") {
    return obtenerEstadoRankingFinal(sesionId, repositorioFase4);
  }

  await repositorioFase4.marcarListo(sesionId, grupoId, "listoF5");

  const grupos = await repositorioFase4.listarGrupos(sesionId);
  const todosListos = grupos.length > 0 && grupos.every((g) => g.listoF5);

  if (todosListos) {
    await repositorioFase4.cambiarFase(
      sesionId,
      ["f6_ranking"],
      "reflexion",
      0,
    );
  }

  return obtenerEstadoRankingFinal(sesionId, repositorioFase4);
}

export async function obtenerEstadoRankingFinal(
  sesionId: string,
  repositorioFase4: RepositorioFase4,
) {
  const sesion = await repositorioFase4.buscarSesion(sesionId);
  const grupos = await repositorioFase4.listarGrupos(sesionId);

  const ranking = [...grupos]
    .sort((a, b) => b.tokens - a.tokens)
    .map((g, indice) => ({
      posicion: indice + 1,
      grupoId: g.grupoId,
      nombreGrupo: g.nombreGrupo,
      tokens: g.tokens,
    }));

  return {
    ok: true,
    fase: sesion?.fase ?? "f6_ranking",
    ranking,
  };
}