if (exigirSesionGrupo()) {
  const temaId = localStorage.getItem("fase2TemaId") || "";
  const grid = document.getElementById("desafiosGrid");
  const timer = document.getElementById("timer");
  let procesando = false;

  document.getElementById("volver").addEventListener("click", () => {
    window.location.href = "tematicas.html";
  });

  async function seleccionar(tema, desafio) {
    if (procesando) return;
    procesando = true;
    try {
      const estado = await llamarApiJuego("/api/fase2/seleccion", {
        method: "POST",
        body: JSON.stringify({ temaId: tema.id, desafioId: desafio.id }),
      });
      localStorage.removeItem("fase2TemaId");
      window.location.replace(estado.rutaSugerida || "espera-eleccion.html");
    } catch (error) {
      procesando = false;
      mostrarErrorJuego(error);
    }
  }

  function render(tematicas) {
    const tema = tematicas.find((item) => item.id === temaId) || tematicas[0];
    if (!tema) return;
    document.getElementById("tituloTema").textContent = tema.titulo;
    document.getElementById("descripcionTema").textContent = tema.hero;
    grid.innerHTML = tema.desafios.map((desafio) => `
      <article class="f2-card challenge-card" style="--accent:${escaparHtmlFase2(tema.accent)};min-height:320px">
        <div class="f2-card-content content">
          <h2 class="title">${escaparHtmlFase2(desafio.nombre)}</h2>
          <p>${escaparHtmlFase2(desafio.resumen)}</p>
          <p style="font-size:13px">${escaparHtmlFase2(desafio.descripcion)}</p>
          <div class="f2-card-actions actions"><button class="f2-primary-button" data-desafio="${escaparHtmlFase2(desafio.id)}">ELEGIR DESAFÍO</button></div>
        </div>
      </article>
    `).join("");
    grid.querySelectorAll("[data-desafio]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const desafio = tema.desafios.find((item) => item.id === boton.dataset.desafio);
        if (desafio) seleccionar(tema, desafio);
      });
    });
  }

  async function asignarAzar() {
    if (procesando) return;
    procesando = true;
    try {
      const estado = await llamarApiJuego("/api/fase2/asignar-azar", { method: "POST" });
      window.location.replace(estado.rutaSugerida || "espera-eleccion.html");
    } catch (error) {
      procesando = false;
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
