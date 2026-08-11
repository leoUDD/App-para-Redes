if (exigirSesionGrupo()) {
  const boton = document.getElementById("btnContinuarFase2");
  const progreso = document.getElementById("progresoInicioFase2");
  if (boton && progreso) {
    boton.addEventListener("click", async () => {
      boton.disabled = true;
      boton.textContent = "ESPERANDO A LOS EQUIPOS...";
      try {
        const estado = await llamarApiJuego("/api/fase2/iniciar", { method: "POST" });
        renderProgresoFase2(progreso, estado.progreso?.rankingF1);
        redirigirEstadoFase2(estado);
      } catch (error) { boton.disabled = false; boton.textContent = "CONTINUAR A EMPATÍA"; mostrarErrorJuego(error); }
    });
    crearPollingFase2((estado) => {
      renderProgresoFase2(progreso, estado.progreso?.rankingF1);
      if (estado.grupo?.listoF2Ranking) { boton.disabled = true; boton.textContent = "ESPERANDO A LOS EQUIPOS..."; }
      redirigirEstadoFase2(estado, ["ranking.html"]);
    });
  }
}
