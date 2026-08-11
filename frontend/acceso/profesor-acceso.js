/**
 * Este archivo reemplaza solamente la validación local del perfil
 * Profesor por una validación contra Lambda.
 *
 * Debe cargarse al final de perfiles.html, después de su script original.
 */
(function integrarAccesoProfesor() {
  const botonConfirmar =
    document.getElementById("modalConfirm");
  const entrada =
    document.getElementById("modalInput");
  const error =
    document.getElementById("modalError");

  if (!botonConfirmar || !entrada || !error) {
    return;
  }

  let procesando = false;

  async function validarProfesor(evento) {
    let rolActual = null;

    try {
      rolActual =
        typeof pendingRol !== "undefined"
          ? pendingRol
          : null;
    } catch {
      rolActual = null;
    }

    if (rolActual !== "profesor") {
      return;
    }

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    if (procesando) {
      return;
    }

    procesando = true;
    botonConfirmar.disabled = true;
    botonConfirmar.textContent = "VALIDANDO...";

    try {
      const resultado = await fetch(
        `${String(API_URL).replace(/\/+$/, "")}/api/profesor/ingresar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codigo: entrada.value,
          }),
        },
      );

      const datos = await resultado.json();

      if (!resultado.ok) {
        throw new Error(
          datos.error || "Código incorrecto",
        );
      }

      localStorage.setItem(
        "tokenProfesor",
        datos.token,
      );

      if (typeof closeModal === "function") {
        closeModal();
      }

      window.location.href = "../profesor/index.html";
    } catch (excepcion) {
      error.textContent =
        excepcion.message || "Código incorrecto";
      error.style.display = "block";
      entrada.value = "";
      entrada.focus();
    } finally {
      procesando = false;
      botonConfirmar.disabled = false;
      botonConfirmar.textContent = "ACCEDER ▶";
    }
  }

  botonConfirmar.addEventListener(
    "click",
    validarProfesor,
    true,
  );

  entrada.addEventListener(
    "keydown",
    (evento) => {
      if (evento.key === "Enter") {
        validarProfesor(evento);
      }
    },
    true,
  );
})();
