if (exigirSesionGrupo()) {
  crearPollingFase2((estado) => {
    document.getElementById("desafio").textContent = estado.grupo?.desafioNombre || "Desafío seleccionado";
    document.getElementById("descripcion").textContent = estado.grupo?.desafioDescripcion || "Esperando a los demás equipos...";
    renderProgresoFase2(document.getElementById("progreso"), estado.progreso?.seleccion);
    redirigirEstadoFase2(estado, ["espera-eleccion.html"]);
  });
}
