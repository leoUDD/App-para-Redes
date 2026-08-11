if (exigirSesionGrupo()) {
  const grid = document.getElementById("tematicasGrid");
  const timer = document.getElementById("timer");
  let expiracionProcesada = false;

  function render(tematicas) {
    grid.innerHTML = tematicas.map((tema) => `
      <article class="f2-card theme-card" style="--accent:${escaparHtmlFase2(tema.accent)}">
        <div class="f2-card-image thumb" style="background-image:linear-gradient(180deg,transparent,rgba(0,8,20,.5)),url('../../compartido/recursos/imagenes/${escaparHtmlFase2(tema.imagen)}')"></div>
        <div class="f2-card-content content">
          <h2>${escaparHtmlFase2(tema.titulo)}</h2>
          <p>${escaparHtmlFase2(tema.hero)}</p>
          <div class="f2-chips chips">${tema.chips.map((chip) => `<span class="f2-chip">${escaparHtmlFase2(chip)}</span>`).join("")}</div>
          <div class="f2-card-actions"><button class="f2-primary-button" data-tema="${escaparHtmlFase2(tema.id)}">ELEGIR TEMÁTICA</button></div>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll("[data-tema]").forEach((boton) => {
      boton.addEventListener("click", () => {
        localStorage.setItem("fase2TemaId", boton.dataset.tema || "");
        window.location.href = "desafios.html";
      });
    });
  }

  async function asignarAzar() {
    if (expiracionProcesada) return;
    expiracionProcesada = true;
    try {
      const estado = await llamarApiJuego("/api/fase2/asignar-azar", { method: "POST" });
      window.location.replace(estado.rutaSugerida || "espera-eleccion.html");
    } catch (error) {
      expiracionProcesada = false;
      mostrarErrorJuego(error);
    }
  }

  crearPollingFase2((estado) => {
    if (redirigirEstadoFase2(estado, ["tematicas.html", "desafios.html"])) return;
    render(estado.tematicas || []);
    actualizarTimerFase2(timer, estado.timer?.segundosRestantes);
    if (estado.grupo?.listoF2Desafio) window.location.replace("espera-eleccion.html");
    if (estado.timer?.expirado) asignarAzar();
  });
}
