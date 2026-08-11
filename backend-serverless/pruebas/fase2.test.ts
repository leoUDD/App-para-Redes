import { describe, expect, it } from "vitest";

import type {
  BubbleMapDatos,
  GrupoFase2,
  RepositorioFase2,
  SesionFase2,
} from "../src/fase2/repositorio.js";
import {
  TEMATICAS_FASE2,
  calcularPuntajeBubbleMap,
  marcarListoFase2,
  seleccionarDesafio,
} from "../src/fase2/servicio.js";

function bubbleVacio(): BubbleMapDatos {
  return {
    emociones: "",
    gustos: "",
    entorno: "",
    necesidades: "",
    limitaciones: "",
    motivaciones: "",
    otros: [],
    relato: "",
    link: "",
  };
}

function grupo(id: string): GrupoFase2 {
  return {
    grupoId: id,
    nombreGrupo: id,
    tokens: 10,
    listoF2Ranking: false,
    listoF2Mapa: false,
    listoF2Transicion: false,
    listoF2Empatia: false,
    temaElegido: "",
    desafioId: "",
    desafioNombre: "",
    desafioDescripcion: "",
    listoF2Desafio: false,
    bubbleMap: bubbleVacio(),
    bubbleCompletado: false,
    bubblePuntaje: 0,
    bubbleTokensOtorgados: 0,
  };
}

function memoria(fase: string) {
  const sesion: SesionFase2 = {
    sesionId: "s1",
    fase,
    totalGrupos: 2,
    timerCorriendo: false,
    segundosRestantes: 0,
  };
  const grupos = [grupo("g1"), grupo("g2")];

  const repositorio: RepositorioFase2 = {
    async buscarSesion() {
      return { ...sesion };
    },
    async buscarGrupo(_sesionId, grupoId) {
      return grupos.find((item) => item.grupoId === grupoId) ?? null;
    },
    async listarGrupos() {
      return grupos.map((item) => ({ ...item }));
    },
    async marcarListo(_sesionId, grupoId, campo) {
      const actual = grupos.find((item) => item.grupoId === grupoId);
      if (actual) {
        (actual as unknown as Record<string, unknown>)[campo] = true;
      }
    },
    async cambiarFase(_sesionId, esperadas, nueva, duracion) {
      if (!esperadas.includes(sesion.fase)) return false;
      sesion.fase = nueva;
      sesion.segundosRestantes = duracion;
      sesion.timerCorriendo = duracion > 0;
      return true;
    },
    async guardarSeleccion(_sesionId, grupoId, tema, desafioId, nombre, descripcion) {
      const actual = grupos.find((item) => item.grupoId === grupoId);
      if (actual) {
        actual.temaElegido = tema;
        actual.desafioId = desafioId;
        actual.desafioNombre = nombre;
        actual.desafioDescripcion = descripcion;
        actual.listoF2Desafio = true;
      }
    },
    async guardarBubbleMap() {},
    async completarBubbleMap() { return true; },
  };

  return { sesion, grupos, repositorio };
}

describe("Fase 2", () => {

  it("pasa del ranking al mapa de Empatía y luego a la transición", async () => {
    const estado = memoria("f1_ranking");

    await marcarListoFase2(
      "s1",
      "g1",
      "ranking_f1",
      estado.repositorio,
    );
    expect(estado.sesion.fase).toBe("f1_ranking");

    await marcarListoFase2(
      "s1",
      "g2",
      "ranking_f1",
      estado.repositorio,
    );
    expect(estado.sesion.fase).toBe("mapa_f2_empatia");

    await marcarListoFase2(
      "s1",
      "g1",
      "mapa_empatia",
      estado.repositorio,
    );
    await marcarListoFase2(
      "s1",
      "g2",
      "mapa_empatia",
      estado.repositorio,
    );

    expect(estado.sesion.fase).toBe("f2_transicion");
  });

  it("mantiene las tres temáticas y nueve desafíos", () => {
    expect(TEMATICAS_FASE2).toHaveLength(3);
    expect(
      TEMATICAS_FASE2.flatMap((tema) => tema.desafios),
    ).toHaveLength(9);
  });

  it("avanza cuando todos los grupos confirman la transición", async () => {
    const estado = memoria("f2_transicion");

    await marcarListoFase2("s1", "g1", "transicion", estado.repositorio);
    expect(estado.sesion.fase).toBe("f2_transicion");

    await marcarListoFase2("s1", "g2", "transicion", estado.repositorio);
    expect(estado.sesion.fase).toBe("f2_tematicas");
    expect(estado.sesion.segundosRestantes).toBe(120);
  });

  it("avanza cuando todos seleccionan un desafío", async () => {
    const estado = memoria("f2_tematicas");

    await seleccionarDesafio(
      "s1", "g1", "salud", "salud-1", estado.repositorio,
    );
    await seleccionarDesafio(
      "s1", "g2", "educacion", "educacion-1", estado.repositorio,
    );

    expect(estado.sesion.fase).toBe("f2_transicion_empatia");
  });

  it("calcula hasta diez tokens por Bubble Map", () => {
    expect(
      calcularPuntajeBubbleMap({
        emociones: "Ansiedad",
        gustos: "Conversar",
        entorno: "Familia",
        necesidades: "Apoyo",
        limitaciones: "Tiempo",
        motivaciones: "Bienestar",
        otros: ["Tecnología", "Seguridad", "Extra"],
        relato: "Historia breve",
        link: "https://ejemplo.cl",
      }),
    ).toBe(10);
  });
});
