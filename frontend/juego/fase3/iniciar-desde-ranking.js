if (exigirSesionGrupo()) {
  const boton =
    document.getElementById("btnContinuarFase3");
  const progreso =
    document.getElementById("progresoInicioFase3");
  let enviado = false;

  async function continuar() {
    if (enviado) return;

    enviado = true;
    boton.disabled = true;
    boton.textContent = "ESPERANDO A LOS EQUIPOS...";

    try {
      const estado = await llamarApiJuego(
        "/api/fase3/iniciar",
        { method: "POST" },
      );

      renderProgresoFase3(
        progreso,
        estado.progreso?.rankingF2,
      );

      redirigirEstadoFase3(
        estado,
        ["ranking.html"],
      );
    } catch (error) {
      enviado = false;
      boton.disabled = false;
      boton.textContent = "CONTINUAR A CREATIVIDAD";
      mostrarErrorJuego(error);
    }
  }

  boton?.addEventListener("click", continuar);

  crearPollingFase3((estado) => {
    renderProgresoFase3(
      progreso,
      estado.progreso?.rankingF2,
    );

    if (estado.grupo?.listoF3Ranking) {
      enviado = true;
      boton.disabled = true;
      boton.textContent = "ESPERANDO A LOS EQUIPOS...";
    }

    redirigirEstadoFase3(
      estado,
      ["ranking.html"],
    );
  });
}
