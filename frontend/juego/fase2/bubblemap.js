if (exigirSesionGrupo()) {
  const ids = ["emociones", "gustos", "entorno", "necesidades", "limitaciones", "motivaciones", "otros", "relato", "link"];
  const timer = document.getElementById("timer");
  const boton = document.getElementById("completar");
  let guardadoPendiente = null;
  let finalizando = false;
  let inicializado = false;

  function datosFormulario() {
    return {
      emociones: document.getElementById("emociones").value.trim(),
      gustos: document.getElementById("gustos").value.trim(),
      entorno: document.getElementById("entorno").value.trim(),
      necesidades: document.getElementById("necesidades").value.trim(),
      limitaciones: document.getElementById("limitaciones").value.trim(),
      motivaciones: document.getElementById("motivaciones").value.trim(),
      otros: document.getElementById("otros").value.split("\n").map((v) => v.trim()).filter(Boolean),
      relato: document.getElementById("relato").value.trim(),
      link: document.getElementById("link").value.trim(),
    };
  }

  function calcular(datos) {
    const principales = [datos.emociones, datos.gustos, datos.entorno, datos.necesidades, datos.limitaciones, datos.motivaciones].filter(Boolean).length;
    return Math.min(10, principales + Math.min(2, datos.otros.length) + (datos.relato ? 1 : 0) + (datos.link ? 1 : 0));
  }

  function actualizarPuntaje() {
    document.getElementById("puntaje").textContent = String(calcular(datosFormulario()));
    document.getElementById("guardado").textContent = "Cambios pendientes...";
    clearTimeout(guardadoPendiente);
    guardadoPendiente = setTimeout(guardar, 800);
  }

  async function guardar() {
    try {
      await llamarApiJuego("/api/fase2/bubblemap/guardar", { method: "POST", body: JSON.stringify(datosFormulario()) });
      document.getElementById("guardado").textContent = "Guardado";
    } catch (error) { mostrarErrorJuego(error); }
  }

  function cargar(datos) {
    if (inicializado || !datos) return;
    inicializado = true;
    for (const id of ids) {
      const elemento = document.getElementById(id);
      if (!elemento) continue;
      elemento.value = id === "otros" ? (datos.otros || []).join("\n") : (datos[id] || "");
    }
    document.getElementById("puntaje").textContent = String(calcular(datosFormulario()));
  }

  async function completar() {
    if (finalizando) return;
    finalizando = true;
    boton.disabled = true;
    boton.textContent = "FINALIZANDO...";
    try {
      const estado = await llamarApiJuego("/api/fase2/bubblemap/completar", { method: "POST", body: JSON.stringify(datosFormulario()) });
      renderProgresoFase2(document.getElementById("progreso"), estado.progreso?.bubble);
      if (!redirigirEstadoFase2(estado)) {
        boton.textContent = `COMPLETADO +${estado.recompensa || 0} TOKENS`;
      }
    } catch (error) {
      finalizando = false; boton.disabled = false; boton.textContent = "FINALIZAR BUBBLE MAP"; mostrarErrorJuego(error);
    }
  }

  ids.forEach((id) => document.getElementById(id)?.addEventListener("input", actualizarPuntaje));
  boton.addEventListener("click", completar);

  crearPollingFase2((estado) => {
    if (redirigirEstadoFase2(estado, ["bubblemap.html"])) return;
    cargar(estado.grupo?.bubbleMap);
    actualizarTimerFase2(timer, estado.timer?.segundosRestantes);
    document.getElementById("objetivo").textContent = `${estado.grupo?.temaElegido || "Temática"} · ${estado.grupo?.desafioNombre || "Desafío"}`;
    renderProgresoFase2(document.getElementById("progreso"), estado.progreso?.bubble);
    if (estado.grupo?.bubbleCompletado) { boton.disabled = true; boton.textContent = `COMPLETADO +${estado.grupo.bubbleTokensOtorgados || 0} TOKENS`; }
    if (estado.timer?.expirado && !estado.grupo?.bubbleCompletado) completar();
  });
}
