import {
  ErrorAplicacion,
} from "../compartido/respuestas.js";
import type {
  GrupoFase4,
  RepositorioFase4,
  SesionFase4,
} from "./repositorio.js";

export const DURACION_CONSTRUCCION_PITCH_SEGUNDOS = 120;
export const DURACION_PRESENTACION_PITCH_SEGUNDOS = 90;
export const DURACION_EVALUACION_PITCH_SEGUNDOS = 90;

export type EtapaListaFase4 =
  | "ranking_f3"
  | "mapa_final"
  | "transicion_comunicacion"
  | "construccion_pitch"
  | "orden_pitch";

function segundosRestantes(sesion: SesionFase4): number {
  if (sesion.timerCorriendo && sesion.timerFin) {
    const fin = Date.parse(sesion.timerFin);

    if (Number.isFinite(fin)) {
      return Math.max(0, Math.ceil((fin - Date.now()) / 1000));
    }
  }

  return Math.max(0, Number(sesion.segundosRestantes || 0));
}

function rutaSugerida(fase: string): string {
  if (fase === "mapa_f4_final") return "../mapa/final.html";
  if (fase === "f4_transicion_comunicacion") return "transicion-comunicacion.html";
  if (fase === "f4_construccion_pitch") return "construccion-pitch.html";
  if (fase === "f4_orden_pitch") return "orden-pitch.html";
  if (fase === "f4_presentacion_pitch") return "presentacion-pitch.html";
  if (fase.startsWith("f5_") || fase === "f6_ranking" || fase === "reflexion") {
    return "../fase5/transicion-apoyo.html";
  }

  return "construccion-pitch.html";
}

function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copia[i] as T;
    copia[i] = copia[j] as T;
    copia[j] = temp;
  }

  return copia;
}

async function contexto(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase4,
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

  return { sesion, grupo, grupos };
}

export async function obtenerEstadoFase4(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase4,
) {
  let { sesion, grupo, grupos } = await contexto(sesionId, grupoId, repositorio);
  let restantes = segundosRestantes(sesion);

  if (
    sesion.fase === "f4_presentacion_pitch" &&
    sesion.timerCorriendo &&
    restantes === 0
  ) {
    const cambiado = await repositorio.cambiarFase(
      sesionId,
      ["f4_presentacion_pitch"],
      "f5_evaluacion_pitch",
      DURACION_EVALUACION_PITCH_SEGUNDOS,
    );

    if (cambiado) {
      await repositorio.iniciarTimerDeFase(
        sesionId,
        "f5_evaluacion_pitch",
        DURACION_EVALUACION_PITCH_SEGUNDOS,
      );
    }

    const actualizado = await contexto(sesionId, grupoId, repositorio);
    sesion = actualizado.sesion;
    grupo = actualizado.grupo;
    grupos = actualizado.grupos;
    restantes = segundosRestantes(sesion);
  }

  const ordenPitch = grupos
    .filter((g) => g.ordenPresentacion !== null)
    .sort((a, b) => (a.ordenPresentacion ?? 0) - (b.ordenPresentacion ?? 0))
    .map((g) => ({
      grupoId: g.grupoId,
      nombreGrupo: g.nombreGrupo,
      orden: g.ordenPresentacion,
    }));

  return {
    ok: true,
    fase: sesion.fase,
    rutaSugerida: rutaSugerida(sesion.fase),
    timer: {
      corriendo: Boolean(sesion.timerCorriendo) && restantes > 0,
      segundosRestantes: restantes,
      expirado: Boolean(sesion.timerCorriendo) && restantes === 0,
    },
    grupo,
    pitch: {
      ordenSorteado: sesion.ordenSorteado,
      ordenPitch,
      grupoPresentandoId: sesion.grupoPresentandoId,
      esMiTurno: sesion.grupoPresentandoId === grupoId,
    },
    progreso: {
      transicionComunicacion: {
        completados: grupos.filter((g) => g.listoF4).length,
        totalGrupos: sesion.totalGrupos,
      },
      ordenPitch: {
        completados: grupos.filter((g) => g.listoF4Orden).length,
        totalGrupos: sesion.totalGrupos,
      },
    },
  };
}

interface ConfiguracionLista {
  fasesEsperadas: string[];
  nuevaFase: string;
  duracion: number;
}

const CONFIGURACION_LISTA: Record<
  Exclude<EtapaListaFase4, "ranking_f3" | "orden_pitch">,
  ConfiguracionLista
> = {
  mapa_final: {
    fasesEsperadas: ["mapa_f4_final"],
    nuevaFase: "f4_transicion_comunicacion",
    duracion: 0,
  },
  transicion_comunicacion: {
    fasesEsperadas: ["f4_transicion_comunicacion"],
    nuevaFase: "f4_construccion_pitch",
    duracion: DURACION_CONSTRUCCION_PITCH_SEGUNDOS,
  },
  construccion_pitch: {
    fasesEsperadas: ["f4_construccion_pitch"],
    nuevaFase: "f4_orden_pitch",
    duracion: 0,
  },
};

export async function marcarListoFase4(
  sesionId: string,
  grupoId: string,
  etapa: EtapaListaFase4,
  repositorio: RepositorioFase4,
) {
  if (etapa === "ranking_f3") {
    return obtenerEstadoFase4(sesionId, grupoId, repositorio);
  }

  if (etapa === "orden_pitch") {
    return marcarListoOrdenPitch(sesionId, grupoId, repositorio);
  }

  const configuracion = CONFIGURACION_LISTA[etapa];

  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion) {
    throw new ErrorAplicacion(
      "No se encontró la sesión",
      404,
      "SESION_NO_ENCONTRADA",
    );
  }

  if (!configuracion.fasesEsperadas.includes(sesion.fase)) {
    return obtenerEstadoFase4(sesionId, grupoId, repositorio);
  }

  await repositorio.marcarListo(sesionId, grupoId, "listoF4");

  const grupos = await repositorio.listarGrupos(sesionId);
  const todosListos =
    grupos.length > 0 && grupos.every((grupo) => grupo.listoF4);

  if (todosListos) {
    await repositorio.cambiarFase(
      sesionId,
      configuracion.fasesEsperadas,
      configuracion.nuevaFase,
      configuracion.duracion,
    );
  }

  return obtenerEstadoFase4(sesionId, grupoId, repositorio);
}

async function marcarListoOrdenPitch(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase4,
) {
  const sesion = await repositorio.buscarSesion(sesionId);

  if (!sesion || sesion.fase !== "f4_orden_pitch") {
    return obtenerEstadoFase4(sesionId, grupoId, repositorio);
  }

  await repositorio.marcarListo(sesionId, grupoId, "listoF4Orden");

  const grupos = await repositorio.listarGrupos(sesionId);
  const todosListos =
    grupos.length > 0 && grupos.every((g) => g.listoF4Orden);

  if (!todosListos) {
    return obtenerEstadoFase4(sesionId, grupoId, repositorio);
  }

  if (!sesion.ordenSorteado) {
    const ordenBarajado = barajar(grupos.map((g) => g.grupoId));
    await repositorio.sortearOrdenPitch(sesionId, ordenBarajado);
  } else {
    await repositorio.confirmarOrdenYAvanzar(
      sesionId,
      DURACION_PRESENTACION_PITCH_SEGUNDOS,
    );
  }

  return obtenerEstadoFase4(sesionId, grupoId, repositorio);
}

export async function guardarPitch(
  sesionId: string,
  grupoId: string,
  entrada: { pitch?: string },
  repositorio: RepositorioFase4,
) {
  await contexto(sesionId, grupoId, repositorio);

  const pitchTexto = String(entrada.pitch || "").trim();

  await repositorio.guardarPitch(sesionId, grupoId, pitchTexto);

  return { ok: true, pitch: pitchTexto };
}

export async function iniciarPresentacionPitch(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioFase4,
) {
  const { sesion } = await contexto(sesionId, grupoId, repositorio);

  if (sesion.fase !== "f4_presentacion_pitch") {
    throw new ErrorAplicacion(
      "La sesión no está en fase de presentación",
      400,
      "FASE_INVALIDA",
    );
  }

  if (sesion.grupoPresentandoId !== grupoId) {
    throw new ErrorAplicacion(
      "Solo el grupo que está presentando puede iniciar el temporizador",
      403,
      "NO_ES_TU_TURNO",
    );
  }

  await repositorio.iniciarPresentacion(
    sesionId,
    grupoId,
    DURACION_PRESENTACION_PITCH_SEGUNDOS,
  );

  return obtenerEstadoFase4(sesionId, grupoId, repositorio);
}