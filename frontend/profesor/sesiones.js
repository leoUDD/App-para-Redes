if (exigirAccesoProfesor()) {
  const tabla =
    document.getElementById("tablaSesiones");
  const contenedor =
    document.getElementById("contenedorTabla");
  const estadoVacio =
    document.getElementById("estadoVacio");
  const mensaje =
    document.getElementById("mensaje");

  document
    .getElementById("cerrarProfesor")
    .addEventListener("click", (evento) => {
      evento.preventDefault();
      cerrarAccesoProfesor();
    });

  function fechaLegible(valor) {
    if (!valor) return "—";

    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valor));
  }

  async function cargarSesiones() {
    try {
      const correo =
        localStorage.getItem("correoProfesor");

      const query = correo
        ? `?correo=${encodeURIComponent(correo)}`
        : "";

      const resultado = await llamarApiProfesor(
        `/api/profesor/sesiones${query}`,
      );

      const sesiones = resultado.sesiones || [];

      if (!sesiones.length) {
        estadoVacio.hidden = false;
        contenedor.hidden = true;
        return;
      }

      estadoVacio.hidden = true;
      contenedor.hidden = false;

      tabla.innerHTML = sesiones
        .map(
          (sesion) => `
            <tr>
              <td data-label="Sesión">
                ${sesion.nombre}
              </td>

              <td data-label="Fecha">
                ${fechaLegible(sesion.fechaCreacion)}
              </td>

              <td data-label="Grupos">
                ${sesion.totalGrupos}
              </td>

              <td data-label="Alumnos">
                ${sesion.totalAlumnos}
              </td>

              <td data-label="Fase">
                ${sesion.fase}
              </td>

              <td data-label="Control">
                <a
                  class="btn-primary"
                  href="control-sesion.html?id=${encodeURIComponent(
                    sesion.sesionId,
                  )}"
                >
                  Controlar
                </a>
              </td>
            </tr>
          `,
        )
        .join("");
    } catch (error) {
      mensaje.textContent = error.message;
      mensaje.className = "mensaje visible error";
    }
  }

  cargarSesiones();
}
