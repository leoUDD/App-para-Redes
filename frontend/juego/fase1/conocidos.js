if (exigirSesionGrupo()) {
  const paginaActual = "conocidos.html";
  const preguntas = [
    "¿Qué habilidad aportarías a una misión imposible?",
    "¿Qué emprendimiento te gustaría crear algún día?",
    "¿Qué objeto llevarías a una expedición espacial?",
    "¿Qué problema cotidiano te gustaría resolver?",
    "¿Cuál es un talento inesperado que tienes?",
    "¿Qué persona te inspira y por qué?",
    "¿Qué idea loca podría convertirse en un negocio?",
    "¿Qué valor no puede faltar en un buen equipo?",
  ];

  let indicePregunta = 0;
  let actividadActiva = false;
  let finalizandoActividad = false;
  let polling = null;

  const botonListo =
    document.getElementById("btn-listo-fase") ||
    document.getElementById("btnListoConocidos");
  const espera =
    document.getElementById("texto-espera-fase") ||
    document.getElementById("esperaConocidos");
  const progreso =
    document.getElementById("contador-listos-fase") ||
    document.getElementById("progresoConocidos");
  const overlayInicio =
    document.getElementById("inicio-fase-overlay");
  const pregunta =
    document.getElementById("preguntaTexto") ||
    buscarElementoPorTexto(
      "p, h2, h3, div, span",
      "cargando pregunta",
    );
  const botonPregunta =
    document.getElementById("btnPregunta") ||
    buscarElementoPorTexto(
      "button, a",
      "nueva pregunta",
    );
  const timer =
    document.getElementById("timer") ||
    buscarElementoPorTexto(
      "div, span, h2, h3",
      "00:10",
    );

  function renderPregunta() {
    if (pregunta) {
      pregunta.textContent =
        preguntas[indicePregunta % preguntas.length];
    }
  }

  function renderTimer(segundos) {
    if (timer) {
      timer.textContent = formatearTiempo(segundos);
    }
  }

  function ajustarModo(modo) {
    if (modo !== "conocidos") {
      return;
    }

    document.querySelectorAll("p").forEach((parrafo) => {
      const texto = String(parrafo.textContent || "");

      if (texto.includes("dice su nombre")) {
        parrafo.textContent =
          "Cada agente comparte un dato curioso o responde una pregunta rápida.";
      }
    });
  }

  function bloquearActividad() {
    actividadActiva = false;

    document
      .querySelectorAll(".blur-target")
      .forEach((elemento) =>
        elemento.classList.add("blur-target-bloqueado"),
      );
  }

  function activarActividad(segundos) {
    actividadActiva = true;

    overlayInicio?.classList.add(
      "serverless-overlay-hidden",
    );

    if (overlayInicio) {
      overlayInicio.style.display = "none";
    }

    document
      .querySelectorAll(
        ".blur-target-bloqueado, .blur-target",
      )
      .forEach((elemento) =>
        elemento.classList.remove(
          "blur-target-bloqueado",
        ),
      );

    renderTimer(segundos);
  }

  function mostrarEspera() {
    if (botonListo) {
      botonListo.disabled = true;
      botonListo.textContent = "ESPERANDO...";
    }

    espera?.classList.add("visible");

    if (espera) {
      espera.style.display = "block";
    }
  }

  function actualizarProgreso(estado) {
    const datos = estado.progreso?.conocidos;

    if (datos && progreso) {
      progreso.textContent =
        `${datos.completados}/${datos.totalGrupos} grupos listos`;
    }
  }

  async function finalizarActividad() {
    if (finalizandoActividad) {
      return;
    }

    finalizandoActividad = true;

    try {
      const estado = await llamarApiJuego(
        "/api/fase1/finalizar-conocidos",
        { method: "POST" },
      );

      if (!redirigirRutaSugerida(estado, paginaActual)) {
        finalizandoActividad = false;
      }
    } catch (error) {
      finalizandoActividad = false;
      mostrarErrorJuego(error);
    }
  }

  function actualizarPantalla(estado) {
    ajustarModo(estado.grupo?.modoEquipo);
    actualizarProgreso(estado);

    const actividad =
      estado.actividadConocidos || {};

    if (actividad.iniciada) {
      activarActividad(
        actividad.segundosRestantes,
      );

      if (actividad.segundosRestantes <= 0) {
        finalizarActividad();
      }

      return;
    }

    bloquearActividad();
    renderTimer(10);

    if (estado.grupo?.listoConocidos) {
      mostrarEspera();
    }
  }

  async function consultarEstado() {
    try {
      const estado = await obtenerEstadoJuego();

      if (redirigirRutaSugerida(estado, paginaActual)) {
        if (polling) {
          clearInterval(polling);
        }

        return;
      }

      actualizarPantalla(estado);
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
          body: JSON.stringify({
            etapa: "conocidos",
          }),
        },
      );

      actualizarPantalla(estado);
    } catch (error) {
      botonListo.disabled = false;
      botonListo.textContent =
        "⚡ LISTO PARA COMENZAR";
      mostrarErrorJuego(error);
    }
  });

  botonPregunta?.addEventListener(
    "click",
    (evento) => {
      evento.preventDefault();

      if (!actividadActiva) {
        return;
      }

      indicePregunta += 1;
      renderPregunta();
    },
  );

  // Recupera el comportamiento básico del objeto informativo
  // que antes dependía del JavaScript inline de Django.
  const mizipTrigger =
    document.querySelector(".mizip-trigger");
  const mizipOverlay =
    document.querySelector(".mizip-overlay");
  const mizipClose =
    document.querySelector(".mizip-close");

  mizipTrigger?.addEventListener("click", () => {
    mizipOverlay?.classList.add(
      "activo",
      "mostrar-card",
    );
  });

  mizipClose?.addEventListener("click", () => {
    mizipOverlay?.classList.remove(
      "activo",
      "mostrar-card",
      "volando",
    );
  });

  renderPregunta();
  bloquearActividad();
  consultarEstado();
  polling = setInterval(consultarEstado, 1000);
}
