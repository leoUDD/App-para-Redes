function rutaActualFase3() {
  return window.location.pathname.split("/").pop() || "";
}

async function obtenerEstadoFase3() {
  return llamarApiJuego("/api/fase3/estado");
}

function resolverRutaFase3(ruta) {
  if (
    ruta.startsWith("/") ||
    ruta.startsWith("../") ||
    ruta.startsWith("./") ||
    /^https?:\/\//i.test(ruta)
  ) {
    return ruta;
  }

  if (
    window.location.pathname.includes("/juego/mapa/") ||
    window.location.pathname.includes("/juego/fase2/")
  ) {
    return `../fase3/${ruta}`;
  }

  return ruta;
}

function redirigirEstadoFase3(
  estado,
  permitidas = [],
) {
  const ruta = String(estado?.rutaSugerida || "");

  if (!ruta) {
    return false;
  }

  const actual = rutaActualFase3();
  const sugerida =
    ruta.split("?")[0].split("/").pop() || "";

  if (sugerida === actual) {
    return false;
  }

  if (
    permitidas.includes(actual) &&
    permitidas.includes(sugerida)
  ) {
    return false;
  }

  window.location.replace(
    resolverRutaFase3(ruta),
  );

  return true;
}

function renderProgresoFase3(elemento, progreso) {
  if (!elemento || !progreso) {
    return;
  }

  elemento.textContent =
    `${progreso.completados}/${progreso.totalGrupos} grupos listos`;
}

function crearPollingFase3(callback, intervalo = 3000) {
  let activo = true;
  let ejecutando = false;

  async function ciclo() {
    if (!activo || ejecutando) {
      return;
    }

    ejecutando = true;

    try {
      const estado = await obtenerEstadoFase3();
      await callback(estado);
    } catch (error) {
      mostrarErrorJuego(error);
    } finally {
      ejecutando = false;
    }
  }

  ciclo();
  const id = setInterval(ciclo, intervalo);

  window.addEventListener("beforeunload", () => {
    activo = false;
    clearInterval(id);
  });

  return () => {
    activo = false;
    clearInterval(id);
  };
}

function escaparHtmlFase3(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function datosGrupoLocal() {
  try {
    return JSON.parse(
      localStorage.getItem("grupoActual") || "{}",
    );
  } catch {
    return {};
  }
}
