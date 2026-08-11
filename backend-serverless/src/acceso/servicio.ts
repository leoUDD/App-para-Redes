import { crearToken } from "../compartido/seguridad.js";
import { ErrorAplicacion } from "../compartido/respuestas.js";
import type { RepositorioAcceso } from "./repositorio.js";

const nombresAleatorios = [
  "Equipo Cóndor",
  "Misión Alfa",
  "Agentes UDD",
  "Mentes Creativas",
  "Los Innovadores",
  "Escuadrón Delta",
  "Visionarios UDD",
  "Código Naranja",
  "Equipo Fénix",
  "StartUp Squad",
  "Los Estrategas",
  "Comando Emprende",
];

export async function ingresarConCodigo(
  codigoRecibido: string,
  nombreRecibido: string,
  repositorio: RepositorioAcceso,
) {
  const codigo = codigoRecibido.trim().toUpperCase();

  if (!codigo) {
    throw new ErrorAplicacion(
      "Debes ingresar un código de grupo",
      400,
      "CODIGO_REQUERIDO",
    );
  }

  const grupo = await repositorio.buscarPorCodigo(codigo);

  if (!grupo) {
    throw new ErrorAplicacion(
      "Código de grupo inválido",
      404,
      "GRUPO_NO_ENCONTRADO",
    );
  }

  const nombreLimpio = nombreRecibido.trim().slice(0, 100);

  const indiceAleatorio = Math.floor(
    Math.random() * nombresAleatorios.length,
  );

  const nombreAleatorio =
    nombresAleatorios[indiceAleatorio] ?? "Equipo UDD";

  const nombreGrupo = nombreLimpio || nombreAleatorio;

  await repositorio.actualizarNombre(
    grupo.sesionId,
    grupo.grupoId,
    nombreGrupo,
  );

  const token = crearToken({
    sesionId: grupo.sesionId,
    grupoId: grupo.grupoId,
  });

  return {
    ok: true,
    token,
    grupo: {
      id: grupo.grupoId,
      nombre: nombreGrupo,
    },
    sesionId: grupo.sesionId,
  };
}
