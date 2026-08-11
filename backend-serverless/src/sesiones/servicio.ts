import { ErrorAplicacion } from "../compartido/respuestas.js";
import type { RepositorioSesiones } from "./repositorio.js";

export async function obtenerSesionActual(
  sesionId: string,
  grupoId: string,
  repositorio: RepositorioSesiones,
) {
  const [sesion, grupo] = await Promise.all([
    repositorio.buscarSesion(sesionId),
    repositorio.buscarGrupo(sesionId, grupoId),
  ]);

  if (!sesion || !grupo) {
    throw new ErrorAplicacion("No se encontró la sesión o el grupo", 404, "CONTEXTO_NO_ENCONTRADO");
  }

  return {
    ok: true,
    sesion,
    grupo,
  };
}
