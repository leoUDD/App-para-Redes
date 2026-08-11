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
import {
  guardarPitch,
  iniciarPresentacionPitch,
  marcarListoFase4,
  obtenerEstadoFase4,
} from "../src/fase4/servicio.js";

function grupo(id: string): GrupoFase4 {
  return {
    grupoId: id,
    nombreGrupo: `Grupo ${id}`,
    tokens: 10,
    listoF4: false,
    pitchTexto: "",
    listoF4Orden: false,
    ordenPresentacion: null,
    listoF5: false,
    recompensaPeerOtorgada: false,
  };
}

function memoria(fase = "mapa_f4_final") {
  const sesion: SesionFase4 = {
    sesionId: "s1",
    fase,
    totalGrupos: 2,
    timerCorriendo: false,
    segundosRestantes: 0,
    ordenSorteado: false,
    grupoPresentandoId: null,
  };

  const grupos = [grupo("g1"), grupo("g2")];

  const repositorio: RepositorioFase4 = {
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

    async guardarPitch(_s, id, texto) {
      const encontrado = grupos.find((g) => g.grupoId === id);
      if (encontrado) {
        encontrado.pitchTexto = texto;
      }
    },

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

    async sortearOrdenPitch(_s, orden) {
      orden.forEach((id, indice) => {
        const encontrado = grupos.find((g) => g.grupoId === id);
        if (encontrado) {
          encontrado.ordenPresentacion = indice + 1;
          encontrado.listoF4Orden = false;
        }
      });

      if (sesion.fase !== "f4_orden_pitch" || sesion.ordenSorteado) {
        return false;
      }

      sesion.ordenSorteado = true;
      sesion.grupoPresentandoId = orden[0] ?? null;
      return true;
    },

    async confirmarOrdenYAvanzar(_s, duracion) {
      if (sesion.fase !== "f4_orden_pitch" || !sesion.ordenSorteado) {
        return false;
      }

      sesion.fase = "f4_presentacion_pitch";
      sesion.segundosRestantes = duracion;
      sesion.timerCorriendo = false;
      return true;
    },

    async iniciarPresentacion(_s, id, duracion) {
      if (
        sesion.fase !== "f4_presentacion_pitch" ||
        sesion.grupoPresentandoId !== id
      ) {
        return false;
      }

      sesion.segundosRestantes = duracion;
      sesion.timerCorriendo = true;
      sesion.timerInicio = new Date().toISOString();
      sesion.timerFin = new Date(
        Date.now() + duracion * 1000,
      ).toISOString();
      return true;
    },

    async iniciarTimerDeFase(_s, faseEsperada, duracion) {
      if (sesion.fase !== faseEsperada) {
        return false;
      }

      sesion.segundosRestantes = duracion;
      sesion.timerCorriendo = true;
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

  return { sesion, grupos, repositorio };
}

describe("Fase 4", () => {
  it("avanza mapa -> transición -> construcción cuando todos están listos", async () => {
    const estado = memoria("mapa_f4_final");

    for (const id of ["g1", "g2"]) {
      await marcarListoFase4("s1", id, "mapa_final", estado.repositorio);
    }

    expect(estado.sesion.fase).toBe("f4_transicion_comunicacion");

    for (const id of ["g1", "g2"]) {
      await marcarListoFase4(
        "s1",
        id,
        "transicion_comunicacion",
        estado.repositorio,
      );
    }

    expect(estado.sesion.fase).toBe("f4_construccion_pitch");

    for (const id of ["g1", "g2"]) {
      await marcarListoFase4(
        "s1",
        id,
        "construccion_pitch",
        estado.repositorio,
      );
    }

    expect(estado.sesion.fase).toBe("f4_orden_pitch");
  });

  it("guarda el pitch de cada grupo", async () => {
    const estado = memoria("f4_construccion_pitch");

    await guardarPitch(
      "s1",
      "g1",
      { pitch: "  Nuestra idea  " },
      estado.repositorio,
    );

    expect(estado.grupos[0]!.pitchTexto).toBe("Nuestra idea");
  });

  it("el sorteo de orden requiere dos rondas de confirmación", async () => {
    const estado = memoria("f4_orden_pitch");

    // Ronda 1: dispara el sorteo real, pero NO avanza de fase todavía.
    for (const id of ["g1", "g2"]) {
      await marcarListoFase4("s1", id, "orden_pitch", estado.repositorio);
    }

    expect(estado.sesion.fase).toBe("f4_orden_pitch");
    expect(estado.sesion.ordenSorteado).toBe(true);
    expect(estado.sesion.grupoPresentandoId).not.toBeNull();
    expect(estado.grupos.every((g) => !g.listoF4Orden)).toBe(true);
    expect(
      estado.grupos.map((g) => g.ordenPresentacion).sort(),
    ).toEqual([1, 2]);

    // Ronda 2: recién ahora, con el orden ya confirmado, avanza.
    for (const id of ["g1", "g2"]) {
      await marcarListoFase4("s1", id, "orden_pitch", estado.repositorio);
    }

    expect(estado.sesion.fase).toBe("f4_presentacion_pitch");
    expect(estado.sesion.segundosRestantes).toBe(90);
    expect(estado.sesion.timerCorriendo).toBe(false);
  });

  it("solo el grupo que presenta puede iniciar su temporizador", async () => {
    const estado = memoria("f4_presentacion_pitch");
    estado.sesion.ordenSorteado = true;
    estado.sesion.grupoPresentandoId = "g1";

    await expect(
      iniciarPresentacionPitch("s1", "g2", estado.repositorio),
    ).rejects.toMatchObject({ codigo: "NO_ES_TU_TURNO" });

    expect(estado.sesion.timerCorriendo).toBe(false);

    const resultado = await iniciarPresentacionPitch(
      "s1",
      "g1",
      estado.repositorio,
    );

    expect(resultado.timer.corriendo).toBe(true);
    expect(resultado.timer.segundosRestantes).toBe(90);
  });

  it("al agotarse el timer de presentación pasa a evaluación entre pares", async () => {
    const estado = memoria("f4_presentacion_pitch");
    estado.sesion.ordenSorteado = true;
    estado.sesion.grupoPresentandoId = "g1";
    estado.sesion.timerCorriendo = true;
    estado.sesion.timerFin = new Date(Date.now() - 1000).toISOString();

    const resultado = await obtenerEstadoFase4(
      "s1",
      "g2",
      estado.repositorio,
    );

    expect(resultado.fase).toBe("f5_evaluacion_pitch");
    expect(resultado.timer.corriendo).toBe(true);
    expect(resultado.timer.segundosRestantes).toBe(90);
  });
});