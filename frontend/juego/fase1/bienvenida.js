if (exigirSesionGrupo()) {
  const paginaActual = "bienvenida.html";
  let procesando = false;
  let desbloqueado = false;

  async function prepararPantalla() {
    try {
      const estado = await obtenerEstadoJuego();

      if (redirigirRutaSugerida(estado, paginaActual)) {
        return;
      }
    } catch (error) {
      mostrarErrorJuego(error);
    }

    const video = document.querySelector("video");

    const continuar =
      document.querySelector(".btn-iniciar") ||
      buscarElementoPorTexto("a, button", "continuar");

    if (!continuar) {
      return;
    }

    continuar.setAttribute("href", "#");

    function bloquearContinuar() {
      desbloqueado = false;
      continuar.classList.add("btn-locked");
      continuar.setAttribute("aria-disabled", "true");
    }

    function desbloquearContinuar() {
      desbloqueado = true;
      continuar.classList.remove("btn-locked");
      continuar.setAttribute("aria-disabled", "false");
    }

    bloquearContinuar();

    if (video) {
      video.muted = true;
      video.play().catch(() => {});

      // El botón se activa visual y funcionalmente
      // cuando termina el video.
      video.addEventListener(
        "ended",
        desbloquearContinuar,
        { once: true },
      );

      // Evita dejar al jugador atrapado si falla el video.
      video.addEventListener(
        "error",
        desbloquearContinuar,
        { once: true },
      );

      if (video.ended) {
        desbloquearContinuar();
      }
    } else {
      desbloquearContinuar();
    }

    continuar.addEventListener("click", async (evento) => {
      evento.preventDefault();

      if (!desbloqueado || procesando) {
        return;
      }

      procesando = true;
      continuar.setAttribute("aria-disabled", "true");

      try {
        const estado = await llamarApiJuego(
          "/api/fase1/iniciar",
          { method: "POST" },
        );

        window.location.href =
          estado.rutaSugerida || "modo-equipo.html";
      } catch (error) {
        procesando = false;
        continuar.setAttribute("aria-disabled", "false");
        mostrarErrorJuego(error);
      }
    });

    const activarSonido = buscarElementoPorTexto(
      "button, a, p, div",
      "activa el sonido",
    );

    activarSonido?.addEventListener("click", () => {
      if (!video) return;

      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
    });
  }

  prepararPantalla();
}