import { describe, expect, it } from "vitest";
import {
  completarSopa,
  registrarPalabra,
} from "../src/fase1/servicio.js";
import type {
  DatosCompletarSopa,
  GrupoFase1,
  RepositorioFase1,
  SesionFase1,
} from "../src/fase1/repositorio.js";

function crearRepositorioFalso(): RepositorioFase1 {
  const sesion: SesionFase1 = {
    sesionId: "1",
    fase: "f1_sopa",
    totalGrupos: 2,
    gruposSopaCompletada: 0,
  };

  const grupos: Record<string, GrupoFase1> = {
    "1": {
      grupoId: "1",
      nombreGrupo: "Grupo 1",
      tokens: 10,
      sopaCompletada: false,
    },
    "2": {
      grupoId: "2",
      nombreGrupo: "Grupo 2",
      tokens: 10,
      sopaCompletada: false,
    },
  };

  const palabras = new Set<string>();

  return {
    async buscarSesion() {
      return { ...sesion };
    },
    async buscarGrupo(_sesionId, grupoId) {
      const grupo = grupos[grupoId];
      return grupo ? { ...grupo } : null;
    },
    async listarPalabras() {
      return [...palabras];
    },
    async palabraExiste(_sesionId, _grupoId, palabra) {
      return palabras.has(palabra);
    },
    async registrarPalabraAtomica(_sesionId, grupoId, palabra, recompensa) {
      if (palabras.has(palabra)) return false;
      palabras.add(palabra);
      grupos[grupoId]!.tokens += recompensa;
      return true;
    },
    async completarSopaAtomica(datos: DatosCompletarSopa) {
      const grupo = grupos[datos.grupoId];
      if (!grupo || grupo.sopaCompletada) return false;
      if (sesion.gruposSopaCompletada !== datos.cantidadEsperada) return false;

      grupo.sopaCompletada = true;
      grupo.tokens += datos.bonificacion;
      sesion.gruposSopaCompletada = datos.nuevaCantidad;

      if (datos.esPrimerGrupo) {
        sesion.primerGrupoSopaId = datos.grupoId;
      }

      if (datos.todosCompletaron) {
        sesion.fase = "f1_ranking";
      }

      return true;
    },
  };
}

describe("Fase 1", () => {
  it("entrega un token solo la primera vez que se registra una palabra", async () => {
    const repositorio = crearRepositorioFalso();

    const primera = await registrarPalabra("1", "1", "equipo", repositorio);
    const repetida = await registrarPalabra("1", "1", "equipo", repositorio);

    expect(primera.nueva).toBe(true);
    expect(primera.tokens).toBe(11);
    expect(repetida.nueva).toBe(false);
    expect(repetida.tokens).toBe(11);
  });

  it("entrega 5 tokens al primer grupo y 3 al segundo", async () => {
    const repositorio = crearRepositorioFalso();

    const primero = await completarSopa("1", "1", repositorio);
    const segundo = await completarSopa("1", "2", repositorio);

    expect(primero.bonificacion).toBe(5);
    expect(primero.tokens).toBe(15);
    expect(segundo.bonificacion).toBe(3);
    expect(segundo.tokens).toBe(13);
    expect(segundo.todosCompletaron).toBe(true);
    expect(segundo.fase).toBe("f1_ranking");
  });

  it("no entrega dos veces la bonificación al mismo grupo", async () => {
    const repositorio = crearRepositorioFalso();

    await completarSopa("1", "1", repositorio);
    const repeticion = await completarSopa("1", "1", repositorio);

    expect(repeticion.yaCompletada).toBe(true);
    expect(repeticion.bonificacion).toBe(0);
    expect(repeticion.tokens).toBe(15);
  });
});
