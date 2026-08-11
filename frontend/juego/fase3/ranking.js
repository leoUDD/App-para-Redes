if (exigirSesionGrupo()) {
  const contenedor =
    document.getElementById(
      "rankingFase3",
    );

  const boton =
    document.getElementById(
      "btnContinuarFinal",
    );

  const progreso =
    document.getElementById(
      "progresoFinal",
    );

  let enviado = false;

  async function cargarRanking() {
    try {
      const resultado =
        await llamarApiJuego(
          "/api/fase3/ranking",
        );

      contenedor.innerHTML =
        (
          resultado.ranking || []
        )
          .map(
            (equipo) => `
              <article class="f3-ranking-row ${
                equipo.esMiGrupo
                  ? "mine"
                  : ""
              }">
                <div class="f3-ranking-position">
                  #${equipo.posicion}
                </div>

                <div>
                  <strong>
                    ${escaparHtmlFase3(
                      equipo.nombreGrupo,
                    )}
                  </strong>

                  ${
                    equipo.esMiGrupo
                      ? '<span class="f3-chip">tu equipo</span>'
                      : ""
                  }

                  <div class="f3-ranking-detail">
                    ${
                      equipo.legoConFoto
                        ? "LEGO con foto"
                        : "LEGO sin foto"
                    }
                  </div>
                </div>

                <div class="f3-ranking-tokens">
                  ${equipo.tokens} tokens
                </div>
              </article>
            `,
          )
          .join("");
    } catch (error) {
      mostrarErrorJuego(error);
    }
  }

  async function continuar() {
    if (enviado) {
      return;
    }

    enviado = true;
    boton.disabled = true;
    boton.textContent =
      "ESPERANDO A LOS EQUIPOS...";

    try {
      const estado =
        await llamarApiJuego(
          "/api/fase3/listo",
          {
            method: "POST",
            body: JSON.stringify({
              etapa: "ranking_f3",
            }),
          },
        );

      renderProgresoFase3(
        progreso,
        estado.progreso?.rankingF3,
      );

      redirigirEstadoFase3(
        estado,
        ["ranking.html"],
      );
    } catch (error) {
      enviado = false;
      boton.disabled = false;
      boton.textContent =
        "CONTINUAR A MISIÓN FINAL";
      mostrarErrorJuego(error);
    }
  }

  boton.addEventListener(
    "click",
    continuar,
  );

  cargarRanking();

  const id = setInterval(
    cargarRanking,
    5000,
  );

  crearPollingFase3((estado) => {
    renderProgresoFase3(
      progreso,
      estado.progreso?.rankingF3,
    );

    if (
      estado.grupo?.listoF3Salida
    ) {
      enviado = true;
      boton.disabled = true;
      boton.textContent =
        "ESPERANDO A LOS EQUIPOS...";
    }

    redirigirEstadoFase3(
      estado,
      ["ranking.html"],
    );
  });

  window.addEventListener(
    "beforeunload",
    () => clearInterval(id),
  );
}
