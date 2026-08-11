function rutaActualFase2() {
  return window.location.pathname.split("/").pop() || "";
}

async function obtenerEstadoFase2() {
  return llamarApiJuego("/api/fase2/estado");
}

function formatearTimerFase2(segundos) {
  const total = Math.max(0, Number(segundos || 0));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;

  return `${String(minutos).padStart(2, "0")}:${String(
    resto,
  ).padStart(2, "0")}`;
}

function actualizarTimerFase2(elemento, segundos) {
  if (elemento) {
    elemento.textContent =
      formatearTimerFase2(segundos);
  }
}

function esRutaPermitidaFase2(ruta, permitidas) {
  return permitidas.includes(ruta);
}

function resolverRutaFase2(rutaRecibida) {
  if (
    rutaRecibida.startsWith("/") ||
    rutaRecibida.startsWith("../") ||
    rutaRecibida.startsWith("./") ||
    /^https?:\/\//i.test(rutaRecibida)
  ) {
    return rutaRecibida;
  }

  /*
   * Las vistas normales de Fase 2 están dentro de /juego/fase2/.
   * El mapa está en /juego/mapa/, por lo que desde allí hay que
   * entrar explícitamente a la carpeta fase2.
   */
  if (
    window.location.pathname.includes("/juego/mapa/")
  ) {
    return `../fase2/${rutaRecibida}`;
  }

  return rutaRecibida;
}

function redirigirEstadoFase2(
  estado,
  permitidas = [],
) {
  const rutaRecibida = String(
    estado?.rutaSugerida || "",
  );

  if (!rutaRecibida) {
    return false;
  }

  const actual = rutaActualFase2();
  const nombreSugerido =
    rutaRecibida.split("/").pop() || "";

  if (nombreSugerido === actual) {
    return false;
  }

  if (
    esRutaPermitidaFase2(actual, permitidas) &&
    esRutaPermitidaFase2(
      nombreSugerido,
      permitidas,
    )
  ) {
    return false;
  }

  window.location.replace(
    resolverRutaFase2(rutaRecibida),
  );

  return true;
}

function renderProgresoFase2(elemento, progreso) {
  if (!elemento || !progreso) {
    return;
  }

  elemento.textContent =
    `${progreso.completados}/${progreso.totalGrupos} grupos listos`;
}

function crearPollingFase2(
  callback,
  intervalo = 3000,
) {
  let activo = true;
  let ejecutando = false;

  async function ciclo() {
    if (!activo || ejecutando) {
      return;
    }

    ejecutando = true;

    try {
      const estado = await obtenerEstadoFase2();
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

function escaparHtmlFase2(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
