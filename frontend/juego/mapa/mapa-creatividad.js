if (exigirSesionGrupo()) {
  const botones = [
    document.getElementById("pc-btn"),
    document.getElementById("bt-btn"),
  ].filter(Boolean);

  let enviado = false;

  function actualizar(texto, bloqueado) {
    botones.forEach((boton) => {
      boton.textContent = texto;
      boton.style.pointerEvents = bloqueado ? "none" : "";
      boton.setAttribute(
        "aria-disabled",
        String(bloqueado),
      );
    });
  }

  async function continuar(evento) {
    evento?.preventDefault();
    evento?.stopPropagation();
    evento?.stopImmediatePropagation();

    if (enviado) return;

    enviado = true;
    actualizar("CARGANDO CREATIVIDAD...", true);

    try {
      const estado = await llamarApiJuego(
        "/api/fase3/listo",
        {
          method: "POST",
          body: JSON.stringify({
            etapa: "mapa_creatividad",
          }),
        },
      );

      const progreso =
        estado.progreso?.mapaCreatividad;

      if (
        estado.fase === "mapa_f3_creatividad" &&
        progreso
      ) {
        actualizar(
          `ESPERANDO A LOS EQUIPOS (${progreso.completados}/${progreso.totalGrupos})`,
          true,
        );
      }

      redirigirEstadoFase3(
        estado,
        ["creatividad.html"],
      );
    } catch (error) {
      enviado = false;
      actualizar("CONTINUAR A CREATIVIDAD", false);
      mostrarErrorJuego(error);
    }
  }

  botones.forEach((boton) => {
    boton.addEventListener("click", continuar, true);
  });

  crearPollingFase3((estado) => {
    const progreso =
      estado.progreso?.mapaCreatividad;

    if (estado.grupo?.listoF3Mapa) {
      enviado = true;
      actualizar(
        progreso
          ? `ESPERANDO A LOS EQUIPOS (${progreso.completados}/${progreso.totalGrupos})`
          : "ESPERANDO A LOS EQUIPOS...",
        true,
      );
    }

    redirigirEstadoFase3(
      estado,
      ["creatividad.html"],
    );
  });
}
