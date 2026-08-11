import { describe, expect, it } from "vitest";

import type {
  ItemDynamo,
  RepositorioProfesor,
  SesionResumen,
} from "../src/profesor/repositorio.js";
import {
  crearSesiones,
  ingresarProfesor,
} from "../src/profesor/servicio.js";

function repositorioEnMemoria() {
  const items: ItemDynamo[] = [];

  const repositorio: RepositorioProfesor = {
    async guardarProfesor() {},

    async guardarItems(nuevos) {
      items.push(...nuevos);
    },

    async listarSesiones(): Promise<SesionResumen[]> {
      return [];
    },

    async obtenerSesion() {
      return null;
    },

    async listarElementosSesion() {
      return [];
    },

    async actualizarSesion() {},
  };

  return {
    repositorio,
    items,
  };
}

describe("Profesor y creación de sesiones", () => {
  it("permite ingresar con la clave configurada", () => {
    process.env.CLAVE_ACCESO_PROFESOR = "profe123";
    process.env.CLAVE_TOKEN =
      "clave-de-prueba-con-mas-de-treinta-y-dos-caracteres";

    const resultado = ingresarProfesor("profe123");

    expect(resultado.ok).toBe(true);
    expect(resultado.rol).toBe("profesor");
    expect(resultado.token).toContain(".");
  });

  it("crea grupos recomendados de máximo ocho alumnos", async () => {
    const memoria = repositorioEnMemoria();

    const alumnos = Array.from(
      { length: 17 },
      (_, indice) => ({
        correo: `alumno${indice}@udd.cl`,
        rut: "",
        nombre: `Alumno ${indice + 1}`,
        apellidoPaterno: "",
        apellidoMaterno: "",
        carrera: "Ingeniería",
      }),
    );

    const resultado = await crearSesiones(
      {
        nombre: "Prueba",
        correoProfesor: "profesor@udd.cl",
        facultad: "Ingeniería",
        modoCreacion: "recomendado",
        alumnos,
      },
      memoria.repositorio,
    );

    expect(resultado.sesiones).toHaveLength(1);
    expect(resultado.sesiones[0]!.grupos).toHaveLength(3);

    const gruposGuardados = memoria.items.filter(
      (item) => item.tipo === "GRUPO",
    );

    expect(gruposGuardados).toHaveLength(3);
  });

  it("divide una sala en dos sesiones", async () => {
    const memoria = repositorioEnMemoria();

    const resultado = await crearSesiones(
      {
        nombre: "Curso",
        correoProfesor: "profesor@udd.cl",
        facultad: "Ingeniería",
        modoCreacion: "dividir_dos",
        alumnos: Array.from(
          { length: 10 },
          (_, indice) => ({
            correo: "",
            rut: "",
            nombre: `Alumno ${indice + 1}`,
            apellidoPaterno: "",
            apellidoMaterno: "",
            carrera: "",
          }),
        ),
      },
      memoria.repositorio,
    );

    expect(resultado.sesiones).toHaveLength(2);
    expect(resultado.sesiones[0]!.nombre).toContain("Sala 1");
    expect(resultado.sesiones[1]!.nombre).toContain("Sala 2");
  });
});
