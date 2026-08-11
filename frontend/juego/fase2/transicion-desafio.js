if (exigirSesionGrupo()) {
  const boton = document.getElementById("btnListo");
  const progreso = document.getElementById("progreso");

  boton.addEventListener("click", async () => {
    boton.disabled = true;
    boton.textContent = "ESPERANDO...";
    try {
      const estado = await llamarApiJuego("/api/fase2/listo", {
        method: "POST",
        body: JSON.stringify({ etapa: "transicion" }),
      });
      renderProgresoFase2(progreso, estado.progreso?.transicion);
      redirigirEstadoFase2(estado);
    } catch (error) {
      boton.disabled = false;
      boton.textContent = "¡ESTOY LISTO!";
      mostrarErrorJuego(error);
    }
  });

  crearPollingFase2((estado) => {
    renderProgresoFase2(progreso, estado.progreso?.transicion);
    if (estado.grupo?.listoF2Transicion) {
      boton.disabled = true;
      boton.textContent = "ESPERANDO...";
    }
    redirigirEstadoFase2(estado);
  });
}
