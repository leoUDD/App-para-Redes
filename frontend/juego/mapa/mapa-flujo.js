if (exigirSesionGrupo()) {
  const botonPanel = document.getElementById("pc-btn");
  const botonInferior = document.getElementById("bt-btn");

  let enviado = false;

  function bloquearBotones(texto) {
    [botonPanel, botonInferior].forEach((boton) => {
      if (!boton) return;

      boton.style.pointerEvents = "none";
      boton.setAttribute("aria-disabled", "true");
      boton.textContent = texto;
    });
  }

  function desbloquearBotones() {
    enviado = false;

    if (botonPanel) {
      botonPanel.style.pointerEvents = "";
      botonPanel.setAttribute("aria-disabled", "false");
      botonPanel.textContent = "[ CONTINUAR A DESAFÍOS ]";
    }

    if (botonInferior) {
      botonInferior.style.pointerEvents = "";
      botonInferior.setAttribute("aria-disabled", "false");
      botonInferior.textContent = "▶ CONTINUAR A DESAFÍOS";
    }
  }

  async function confirmarMapa(evento) {
    evento?.preventDefault();
    evento?.stopPropagation();
    evento?.stopImmediatePropagation();

    if (enviado) {
      return;
    }

    enviado = true;
    bloquearBotones("CARGANDO MISIÓN...");

    try {
      const estado = await llamarApiJuego(
        "/api/fase2/listo",
        {
          method: "POST",
          body: JSON.stringify({
            etapa: "mapa_empatia",
          }),
        },
      );

      const progreso = estado.progreso?.mapaEmpatia;

      if (
        estado.fase === "mapa_f2_empatia" &&
        progreso
      ) {
        bloquearBotones(
          `ESPERANDO A LOS EQUIPOS (${progreso.completados}/${progreso.totalGrupos})`,
        );
      }

      redirigirEstadoFase2(
        estado,
        ["habilidades.html"],
      );
    } catch (error) {
      desbloquearBotones();
      mostrarErrorJuego(error);
    }
  }

  /*
   * El mapa original ejecuta markDone() desde pc-btn y luego
   * navega usando rutaContinuar. Capturamos el clic antes de
   * esa función para que el avance dependa del backend.
   */
  botonPanel?.addEventListener(
    "click",
    confirmarMapa,
    true,
  );

  botonInferior?.addEventListener(
    "click",
    confirmarMapa,
    true,
  );

  crearPollingFase2((estado) => {
    const progreso = estado.progreso?.mapaEmpatia;

    if (estado.grupo?.listoF2Mapa) {
      enviado = true;

      bloquearBotones(
        progreso
          ? `ESPERANDO A LOS EQUIPOS (${progreso.completados}/${progreso.totalGrupos})`
          : "ESPERANDO A LOS EQUIPOS...",
      );
    }

    redirigirEstadoFase2(
      estado,
      ["habilidades.html"],
    );
  });
}
