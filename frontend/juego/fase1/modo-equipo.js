if (exigirSesionGrupo()) {
  const paginaActual = "modo-equipo.html";
  let procesando = false;

  async function seleccionar(modo, tarjeta) {
    if (procesando) return;

    procesando = true;
    tarjeta?.classList.add("selected");

    try {
      const estado = await llamarApiJuego(
        "/api/fase1/modo-equipo",
        {
          method: "POST",
          body: JSON.stringify({ modo }),
        },
      );

      localStorage.setItem("modoEquipoF1", modo);
      window.location.href =
        estado.rutaSugerida || "conocidos.html";
    } catch (error) {
      procesando = false;
      tarjeta?.classList.remove("selected");
      mostrarErrorJuego(error);
    }
  }

  async function iniciar() {
    try {
      const estado = await obtenerEstadoJuego();

      if (redirigirRutaSugerida(estado, paginaActual)) {
        return;
      }
    } catch (error) {
      mostrarErrorJuego(error);
    }

    const primeraVez =
      document.querySelector(".mode-intro") ||
      buscarElementoPorTexto("a, button", "primera vez");
    const conocidos =
      document.querySelector(".mode-known") ||
      buscarElementoPorTexto("a, button", "viejos conocidos");

    primeraVez?.addEventListener("click", (evento) => {
      evento.preventDefault();
      seleccionar("primera_vez", primeraVez);
    });

    conocidos?.addEventListener("click", (evento) => {
      evento.preventDefault();
      seleccionar("conocidos", conocidos);
    });

    const audio = new Audio(
      "../../compartido/recursos/sonidos/musica_promptconocidos.mp3",
    );
    audio.loop = true;
    audio.volume = 0.35;

    document.addEventListener(
      "click",
      () => audio.play().catch(() => {}),
      { once: true },
    );
  }

  iniciar();
}
