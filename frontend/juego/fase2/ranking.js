if (exigirSesionGrupo()) {
  const contenedor = document.getElementById("ranking");
  async function cargar() {
    try {
      const resultado = await llamarApiJuego("/api/fase2/ranking");
      contenedor.innerHTML = (resultado.ranking || []).map((equipo) => `
        <article class="f2-ranking-row ${equipo.esMiGrupo ? "mine" : ""}">
          <div class="f2-ranking-pos">#${equipo.posicion}</div>
          <div><strong>${escaparHtmlFase2(equipo.nombreGrupo)}</strong>${equipo.esMiGrupo ? '<span class="f2-chip" style="margin-left:8px">tu equipo</span>' : ''}<div style="color:#9fb0c6;font-size:12px">Bubble Map: ${equipo.puntajeBubble}/10</div></div>
          <div class="f2-ranking-token">${equipo.tokens} tokens</div>
        </article>
      `).join("");
    } catch (error) { mostrarErrorJuego(error); }
  }
  cargar();
  const id = setInterval(cargar, 5000);
  window.addEventListener("beforeunload", () => clearInterval(id));
}
