if (exigirSesionGrupo()) {
  [
    document.getElementById("pc-btn"),
    document.getElementById("bt-btn"),
  ]
    .filter(Boolean)
    .forEach((boton) => {
      boton.textContent = "MISIÓN FINAL · PRÓXIMA FASE";
      boton.style.pointerEvents = "none";
      boton.setAttribute("aria-disabled", "true");
    });
}
