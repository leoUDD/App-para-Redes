if (exigirSesionGrupo()) {
  const paginaActual = "trabajo-equipo.html";
  const botonListo =
    document.getElementById("btnListoPreSopa");
  const espera =
    document.getElementById("esperaPreSopa");
  const progreso =
    document.getElementById("progresoPreSopa");
  let polling = null;

  function actualizar(estado) {
    const datos = estado.progreso?.preSopa;

    if (datos && progreso) {
      progreso.textContent =
        `${datos.completados}/${datos.totalGrupos} grupos listos`;
    }

    if (estado.grupo?.listoF1) {
      botonListo?.setAttribute("hidden", "hidden");
      espera?.classList.add("visible");
    }
  }

  async function consultar() {
    try {
      const estado = await obtenerEstadoJuego();

      if (redirigirRutaSugerida(estado, paginaActual)) {
        if (polling) clearInterval(polling);
        return;
      }

      actualizar(estado);
    } catch (error) {
      mostrarErrorJuego(error);
    }
  }

  botonListo?.addEventListener("click", async () => {
    botonListo.disabled = true;
    botonListo.textContent = "REGISTRANDO...";

    try {
      const estado = await llamarApiJuego(
        "/api/fase1/listo",
        {
          method: "POST",
          body: JSON.stringify({ etapa: "pre_sopa" }),
        },
      );

      actualizar(estado);

      if (!redirigirRutaSugerida(estado, paginaActual)) {
        espera?.classList.add("visible");
      }
    } catch (error) {
      botonListo.disabled = false;
      botonListo.textContent = "¡ESTOY LISTO!";
      mostrarErrorJuego(error);
    }
  });

  consultar();
  polling = setInterval(consultar, 5000);
}
