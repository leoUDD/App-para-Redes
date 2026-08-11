function obtenerUrlApiProfesor() {
  const configurada =
    localStorage.getItem("urlApi") ||
    (typeof API_URL !== "undefined" ? API_URL : "");

  return String(configurada).replace(/\/+$/, "");
}

async function llamarApiProfesor(
  ruta,
  opciones = {},
) {
  const token = localStorage.getItem("tokenProfesor");

  const respuesta = await fetch(
    `${obtenerUrlApiProfesor()}${ruta}`,
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
      localStorage.removeItem("tokenProfesor");
    }

    throw new Error(
      datos.error ||
        datos.mensaje ||
        "No fue posible comunicarse con el backend.",
    );
  }

  return datos;
}

function exigirAccesoProfesor() {
  if (!localStorage.getItem("tokenProfesor")) {
    window.location.replace("../acceso/perfiles.html");
    return false;
  }

  return true;
}

function cerrarAccesoProfesor() {
  localStorage.removeItem("tokenProfesor");
  localStorage.removeItem("correoProfesor");
  window.location.href = "../acceso/perfiles.html";
}
