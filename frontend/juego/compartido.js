function obtenerUrlApiJuego() {
  const configurada =
    localStorage.getItem("urlApi") ||
    (typeof API_URL !== "undefined" ? API_URL : "");

  return String(configurada).replace(/\/+$/, "");
}

function obtenerTokenGrupo() {
  return localStorage.getItem("tokenAcceso") || "";
}

function exigirSesionGrupo() {
  if (!obtenerTokenGrupo()) {
    window.location.replace("../../acceso/registro.html");
    return false;
  }

  return true;
}

async function llamarApiJuego(ruta, opciones = {}) {
  const token = obtenerTokenGrupo();

  const respuesta = await fetch(
    `${obtenerUrlApiJuego()}${ruta}`,
    {
      ...opciones,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(opciones.headers || {}),
      },
    },
  );

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    datos = {
      error: "El servidor devolvió una respuesta inválida.",
    };
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      localStorage.removeItem("tokenAcceso");
    }

    throw new Error(
      datos.error ||
        datos.mensaje ||
        "No fue posible comunicarse con el backend.",
    );
  }

  return datos;
}

async function obtenerEstadoJuego() {
  return llamarApiJuego("/api/fase1/estado");
}

function mostrarErrorJuego(error) {
  let panel = document.getElementById("errorJuegoServerless");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "errorJuegoServerless";
    panel.className = "serverless-error";
    document.body.appendChild(panel);
  }

  panel.textContent =
    error instanceof Error
      ? error.message
      : String(error || "Ocurrió un error");
  panel.classList.add("visible");

  window.setTimeout(() => {
    panel.classList.remove("visible");
  }, 5000);
}

function nombreGrupoActual() {
  try {
    const grupo = JSON.parse(
      localStorage.getItem("grupoActual") || "null",
    );

    return grupo?.nombreGrupo || grupo?.nombre || "Equipo";
  } catch {
    return "Equipo";
  }
}

function redirigirRutaSugerida(estado, paginaActual) {
  const ruta = estado?.rutaSugerida;

  if (ruta && ruta !== paginaActual) {
    window.location.replace(ruta);
    return true;
  }

  return false;
}

function buscarElementoPorTexto(selector, texto) {
  const buscado = texto.toLowerCase();

  return Array.from(document.querySelectorAll(selector)).find(
    (elemento) =>
      String(elemento.textContent || "")
        .toLowerCase()
        .includes(buscado),
  );
}

function formatearTiempo(segundos) {
  const valor = Math.max(0, Number(segundos || 0));
  const minutos = Math.floor(valor / 60);
  const resto = valor % 60;

  return `${String(minutos).padStart(2, "0")}:${String(
    resto,
  ).padStart(2, "0")}`;
}
