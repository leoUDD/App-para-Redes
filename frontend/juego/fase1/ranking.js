if (exigirSesionGrupo()) {
  const lista = document.getElementById("rankingLista");
  let polling = null;

  function render(ranking) {
    lista.innerHTML = ranking
      .map(
        (equipo) => `
          <article class="ranking-row ${
            equipo.esMiGrupo ? "mine" : ""
          }">
            <div class="ranking-position">
              #${equipo.posicion}
            </div>

            <div class="ranking-name">
              ${equipo.nombreGrupo}
              ${
                equipo.esMiGrupo
                  ? '<span class="ranking-mine">tu equipo</span>'
                  : ""
              }
            </div>

            <div class="ranking-tokens">
              ${equipo.tokens} tokens
            </div>
          </article>
        `,
      )
      .join("");
  }

  async function cargar() {
    try {
      const resultado = await llamarApiJuego(
        "/api/fase1/ranking",
      );

      render(resultado.ranking || []);
    } catch (error) {
      mostrarErrorJuego(error);
    }
  }

  cargar();
  polling = setInterval(cargar, 5000);

  window.addEventListener("beforeunload", () => {
    if (polling) clearInterval(polling);
  });
}
