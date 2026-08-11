if (exigirSesionGrupo()) {
  const boton =
    document.getElementById("btnListoCreatividad");
  const progreso =
    document.getElementById("progresoCreatividad");
  let enviado = false;

  async function marcarListo() {
    if (enviado) return;

    enviado = true;
    boton.disabled = true;
    boton.textContent = "Esperando a los demás equipos...";

    try {
      const estado = await llamarApiJuego(
        "/api/fase3/listo",
        {
          method: "POST",
          body: JSON.stringify({
            etapa: "transicion_creatividad",
          }),
        },
      );

      renderProgresoFase3(
        progreso,
        estado.progreso?.transicionCreatividad,
      );

      redirigirEstadoFase3(
        estado,
        ["transicion-creatividad.html"],
      );
    } catch (error) {
      enviado = false;
      boton.disabled = false;
      boton.textContent = "¡Estoy listo!";
      mostrarErrorJuego(error);
    }
  }

  boton.addEventListener("click", marcarListo);

  crearPollingFase3((estado) => {
    renderProgresoFase3(
      progreso,
      estado.progreso?.transicionCreatividad,
    );

    if (estado.grupo?.listoF3Transicion) {
      enviado = true;
      boton.disabled = true;
      boton.textContent = "Esperando a los demás equipos...";
    }

    redirigirEstadoFase3(
      estado,
      ["transicion-creatividad.html"],
    );
  });
}
