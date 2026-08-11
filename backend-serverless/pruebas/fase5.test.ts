import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  GrupoFase4,
  RepositorioFase4,
  SesionFase4,
} from "../src/fase4/repositorio.js";
import type {
  Evaluacion,
  RepositorioFase5,
} from "../src/fase5/repositorio.js";
import {
  enviarEvaluacion,
  marcarListoRankingFinal,
  obtenerEstadoFase5,
  obtenerEstadoRankingFinal,
} from "../src/fase5/servicio.js";

function grupo(id: string, ordenPresentacion: number | null): GrupoFase4 {
  return {
    grupoId: id,
    nombreGrupo: `Grupo ${id}`,
    tokens: 10,
    listoF4: true,
    pitchTexto: "Pitch",
    listoF4Orden: true,
    ordenPresentacion,
    listoF5: false,
    recompensaPeerOtorgada: false,
  };
}

function memoria(opciones?: {
  fase?: string;
  grupoPresentandoId?: string | null;
  totalGrupos?: number;
}) {
  const totalGrupos = opciones?.totalGrupos ?? 3;

  const sesion: SesionFase4 = {
    sesionId: "s1",
    fase: opciones?.fase ?? "f5_evaluacion_pitch",
    totalGrupos,
    timerCorriendo: true,
    segundosRestantes: 90,
    ordenSorteado: true,
    grupoPresentandoId: opciones?.grupoPresentandoId ?? "g1",
  };

  const grupos: GrupoFase4[] = [
    grupo("g1", 1),
    grupo("g2", 2),
    grupo("g3", 3),
  ].slice(0, totalGrupos);

  const evaluaciones: Evaluacion[] = [];

  const repositorioFase4: RepositorioFase4 = {
    async buscarSesion() {
      return { ...sesion };
    },

    async buscarGrupo(_s, id) {
      const encontrado = grupos.find((g) => g.grupoId === id);
      return encontrado ? { ...encontrado } : null;
    },

    async listarGrupos() {
      return grupos.map((g) => ({ ...g }));
    },

    async marcarListo(_s, id, campo) {
      const encontrado = grupos.find((g) => g.grupoId === id);
      if (encontrado) {
        (encontrado as unknown as Record<string, unknown>)[campo] = true;
      }
    },

    async guardarPitch() {},

    async cambiarFase(_s, esperadas, nueva, duracion) {
      if (!esperadas.includes(sesion.fase)) {
        return false;
      }

      sesion.fase = nueva;
      sesion.segundosRestantes = duracion;
      sesion.timerCorriendo = false;
      delete sesion.timerInicio;
      delete sesion.timerFin;
      return true;
    },

    async sortearOrdenPitch() {
      return true;
    },

    async confirmarOrdenYAvanzar() {
      return true;
    },

    async iniciarPresentacion() {
      return true;
    },

    async iniciarTimerDeFase(_s, faseEsperada, duracion) {
      if (sesion.fase !== faseEsperada) {
        return false;
      }

      sesion.timerCorriendo = true;
      sesion.segundosRestantes = duracion;
      sesion.timerInicio = new Date().toISOString();
      sesion.timerFin = new Date(
        Date.now() + duracion * 1000,
      ).toISOString();
      return true;
    },

    async avanzarSiguientePitchORanking(_s, actualId, duracion) {
      const actual = grupos.find((g) => g.grupoId === actualId);
      const ordenActual = actual?.ordenPresentacion ?? 0;

      const siguiente = grupos
        .filter(
          (g) =>
            g.ordenPresentacion !== null &&
            g.ordenPresentacion > ordenActual,
        )
        .sort(
          (a, b) => (a.ordenPresentacion ?? 0) - (b.ordenPresentacion ?? 0),
        )[0];

      grupos.forEach((g) => {
        g.listoF5 = false;
      });

      if (!siguiente) {
        sesion.fase = "f6_ranking";
        sesion.grupoPresentandoId = null;
        sesion.segundosRestantes = 0;
        sesion.timerCorriendo = false;
        return { ok: true, terminoTodos: true };
      }

      sesion.fase = "f4_presentacion_pitch";
      sesion.grupoPresentandoId = siguiente.grupoId;
      sesion.segundosRestantes = duracion;
      sesion.timerCorriendo = false;
      return { ok: true, terminoTodos: false };
    },

    async ajustarTokens(_s, id, delta) {
      const encontrado = grupos.find((g) => g.grupoId === id);
      if (encontrado) {
        encontrado.tokens = Math.max(0, encontrado.tokens + delta);
      }
    },
  };

  const repositorioFase5: RepositorioFase5 = {
    async listarEvaluacionesDeGrupo(_s, grupoEvaluadoId) {
      return evaluaciones.filter(
        (e) => e.grupoEvaluadoId === grupoEvaluadoId,
      );
    },

    async listarTodasEvaluaciones() {
      return [...evaluaciones];
    },

    async listarEvaluacionesDeEvaluador(_s, grupoEvaluadorId) {
      return evaluaciones.filter(
        (e) => e.grupoEvaluadorId === grupoEvaluadorId,
      );
    },

    async crearEvaluacion(_s, evaluacion) {
      const yaExiste = evaluaciones.some(
        (e) =>
          e.grupoEvaluadoId === evaluacion.grupoEvaluadoId &&
          e.grupoEvaluadorId === evaluacion.grupoEvaluadorId,
      );

      if (yaExiste) {
        return false;
      }

      evaluaciones.push({ ...evaluacion });
      return true;
    },

    async marcarRecompensaPeerOtorgada(_s, grupoEvaluadorId) {
      const encontrado = grupos.find((g) => g.grupoId === grupoEvaluadorId);
      if (encontrado) {
        encontrado.recompensaPeerOtorgada = true;
      }
    },
  };

  return { sesion, grupos, evaluaciones, repositorioFase4, repositorioFase5 };
}

const CRITERIOS_BASE = {
  claridad: 4,
  creatividad: 4,
  viabilidad: 4,
  equipo: 4,
  presentacion: 4,
};

describe("Fase 5", () => {
  it("el grupo que presenta no puede evaluarse a sí mismo", async () => {
    const estado = memoria();

    await expect(
      enviarEvaluacion(
        "s1",
        "g1",
        CRITERIOS_BASE,
        estado.repositorioFase4,
        estado.repositorioFase5,
      ),
    ).rejects.toMatchObject({ codigo: "NO_PUEDES_EVALUARTE" });
  });

  it("rechaza criterios fuera del rango 1-5", async () => {
    const estado = memoria();

    await expect(
      enviarEvaluacion(
        "s1",
        "g2",
        { ...CRITERIOS_BASE, claridad: 7 },
        estado.repositorioFase4,
        estado.repositorioFase5,
      ),
    ).rejects.toMatchObject({ codigo: "CRITERIO_INVALIDO" });
  });

  it("no avanza de ronda hasta que todos los evaluadores envíen su evaluación", async () => {
    const estado = memoria();

    await enviarEvaluacion(
      "s1",
      "g2",
      CRITERIOS_BASE,
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    expect(estado.sesion.fase).toBe("f5_evaluacion_pitch");
    expect(estado.sesion.grupoPresentandoId).toBe("g1");

    await enviarEvaluacion(
      "s1",
      "g3",
      CRITERIOS_BASE,
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    expect(estado.sesion.fase).toBe("f4_presentacion_pitch");
    expect(estado.sesion.grupoPresentandoId).toBe("g2");
  });

  it("no permite evaluar dos veces al mismo grupo presentando", async () => {
    const estado = memoria();

    await enviarEvaluacion(
      "s1",
      "g2",
      CRITERIOS_BASE,
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    await expect(
      enviarEvaluacion(
        "s1",
        "g2",
        CRITERIOS_BASE,
        estado.repositorioFase4,
        estado.repositorioFase5,
      ),
    ).rejects.toMatchObject({ codigo: "EVALUACION_DUPLICADA" });
  });

  it("recompensa al evaluador con +2 tokens solo la primera vez", async () => {
    const estado = memoria();

    await enviarEvaluacion(
      "s1",
      "g2",
      CRITERIOS_BASE,
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    expect(estado.grupos.find((g) => g.grupoId === "g1")!.tokens).toBe(12);
    expect(
      estado.grupos.find((g) => g.grupoId === "g2")!.recompensaPeerOtorgada,
    ).toBe(true);
  });

  it("al agotarse el tiempo, penaliza a quien no evaluó y premia el puntaje acumulado", async () => {
    const estado = memoria();
    estado.sesion.timerFin = new Date(Date.now() - 1000).toISOString();

    const resultado = await obtenerEstadoFase5(
      "s1",
      "g2",
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    expect(estado.grupos.find((g) => g.grupoId === "g2")!.tokens).toBe(8);
    expect(estado.grupos.find((g) => g.grupoId === "g3")!.tokens).toBe(8);
    expect(estado.grupos.find((g) => g.grupoId === "g1")!.tokens).toBe(13);

    expect(resultado.fase).toBe("f4_presentacion_pitch");
    expect(resultado.grupoPresentandoId).toBe("g2");
  });

  it("cuando ya no queda nadie por presentar, cae a f6_ranking", async () => {
    const estado = memoria({ grupoPresentandoId: "g3" });

    await enviarEvaluacion(
      "s1",
      "g1",
      CRITERIOS_BASE,
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    await enviarEvaluacion(
      "s1",
      "g2",
      CRITERIOS_BASE,
      estado.repositorioFase4,
      estado.repositorioFase5,
    );

    expect(estado.sesion.fase).toBe("f6_ranking");
    expect(estado.sesion.grupoPresentandoId).toBeNull();
  });

  it("ordena el ranking final por tokens de mayor a menor", async () => {
    const estado = memoria({ fase: "f6_ranking", grupoPresentandoId: null });
    estado.grupos.find((g) => g.grupoId === "g2")!.tokens = 20;

    const resultado = await obtenerEstadoRankingFinal(
      "s1",
      estado.repositorioFase4,
    );

    expect(resultado.ranking[0]!.grupoId).toBe("g2");
    expect(resultado.ranking[0]!.posicion).toBe(1);
  });

  it("avanza de f6_ranking a reflexion cuando todos marcan listo", async () => {
    const estado = memoria({ fase: "f6_ranking", grupoPresentandoId: null });

    for (const id of ["g1", "g2", "g3"]) {
      await marcarListoRankingFinal("s1", id, estado.repositorioFase4);
    }

    expect(estado.sesion.fase).toBe("reflexion");
  });
});