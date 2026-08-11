if (exigirSesionGrupo()) {
  const TAMANO = 14;
  const PALABRAS = [
    "IDEA",
    "EQUIPO",
    "NEGOCIO",
    "CREATIVIDAD",
    "LIDERAZGO",
    "VALOR",
    "IMPACTO",
    "CLIENTE",
  ];
  const COLOCACIONES = [
  ["CREATIVIDAD", 0, 0, 0, 1],

  ["EQUIPO", 1, 0, 1, 0],

  ["LIDERAZGO", 2, 12, 1, 0],
  ["IDEA", 3, 7, 1, -1],
  ["VALOR", 9, 2, -1, 1],

  ["NEGOCIO", 11, 0, 0, 1],

  ["IMPACTO", 12, 13, 0, -1],
  ["CLIENTE", 13, 0, 0, 1],
];

  const grid = document.getElementById("sopaGrid");
  const lista = document.getElementById("listaPalabras");
  const tiempo = document.getElementById("tiempoSopa");
  const tokens = document.getElementById("tokensSopa");
  const resultado = document.getElementById("resultadoSopa");

  let matriz = [];
  let encontradas = new Set();
  let inicioSeleccion = null;
  let seleccionActual = [];
  let arrastrando = false;
  let finalizando = false;
  let polling = null;
  let reloj = null;
  let segundosLocales = 60;

  function crearMatriz() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    matriz = Array.from({ length: TAMANO }, () =>
      Array.from(
        { length: TAMANO },
        () => letras[Math.floor(Math.random() * letras.length)],
      ),
    );

    COLOCACIONES.forEach(([palabra, fila, columna, df, dc]) => {
      Array.from(palabra).forEach((letra, indice) => {
        matriz[fila + df * indice][columna + dc * indice] = letra;
      });
    });
  }

  function claveCelda(fila, columna) {
    return `${fila}:${columna}`;
  }

  function renderGrid() {
    grid.innerHTML = "";

    matriz.forEach((fila, indiceFila) => {
      fila.forEach((letra, indiceColumna) => {
        const celda = document.createElement("div");
        celda.className = "sopa-cell";
        celda.textContent = letra;
        celda.dataset.fila = String(indiceFila);
        celda.dataset.columna = String(indiceColumna);
        celda.dataset.clave = claveCelda(
          indiceFila,
          indiceColumna,
        );
        grid.appendChild(celda);
      });
    });
  }

  function renderLista() {
    lista.innerHTML = PALABRAS.map(
      (palabra) => `
        <div
          class="sopa-word ${
            encontradas.has(palabra) ? "found" : ""
          }"
          data-palabra="${palabra}"
        >
          ${palabra}
        </div>
      `,
    ).join("");
  }

  function lineaEntre(origen, destino) {
    const df = destino.fila - origen.fila;
    const dc = destino.columna - origen.columna;
    const pasos = Math.max(Math.abs(df), Math.abs(dc));

    if (pasos === 0) return [origen];

    const direccionFila = df / pasos;
    const direccionColumna = dc / pasos;

    if (
      !Number.isInteger(direccionFila) ||
      !Number.isInteger(direccionColumna) ||
      Math.abs(direccionFila) > 1 ||
      Math.abs(direccionColumna) > 1
    ) {
      return [];
    }

    return Array.from({ length: pasos + 1 }, (_, indice) => ({
      fila: origen.fila + direccionFila * indice,
      columna: origen.columna + direccionColumna * indice,
    }));
  }

  function limpiarSeleccion() {
    document
      .querySelectorAll(".sopa-cell.selected")
      .forEach((celda) => celda.classList.remove("selected"));
    seleccionActual = [];
  }

  function pintarSeleccion(celdas) {
    limpiarSeleccion();
    seleccionActual = celdas;

    celdas.forEach(({ fila, columna }) => {
      document
        .querySelector(
          `[data-clave="${claveCelda(fila, columna)}"]`,
        )
        ?.classList.add("selected");
    });
  }

  function palabraSeleccionada() {
    return seleccionActual
      .map(({ fila, columna }) => matriz[fila][columna])
      .join("");
  }

  function marcarEncontrada(palabra) {
    const colocacion = COLOCACIONES.find(
      ([candidata]) => candidata === palabra,
    );

    if (!colocacion) return;

    const [, fila, columna, df, dc] = colocacion;

    Array.from(palabra).forEach((_, indice) => {
      document
        .querySelector(
          `[data-clave="${claveCelda(
            fila + df * indice,
            columna + dc * indice,
          )}"]`,
        )
        ?.classList.add("found");
    });
  }

  async function registrarSeleccion() {
    if (!seleccionActual.length) return;

    const directa = palabraSeleccionada();
    const inversa = Array.from(directa).reverse().join("");
    const encontrada = PALABRAS.find(
      (palabra) =>
        !encontradas.has(palabra) &&
        (palabra === directa || palabra === inversa),
    );

    if (!encontrada) {
      limpiarSeleccion();
      return;
    }

    try {
      const respuesta = await llamarApiJuego(
        "/api/fase1/palabras",
        {
          method: "POST",
          body: JSON.stringify({ palabra: encontrada }),
        },
      );

      encontradas.add(encontrada);
      tokens.textContent = String(respuesta.tokens || 0);
      marcarEncontrada(encontrada);
      renderLista();
      limpiarSeleccion();

      if (encontradas.size === PALABRAS.length) {
        await finalizar("¡Buen trabajo! Encontraron todas las palabras.");
      }
    } catch (error) {
      limpiarSeleccion();
      mostrarErrorJuego(error);
    }
  }

  grid.addEventListener("pointerdown", (evento) => {
    const celda = evento.target.closest(".sopa-cell");
    if (!celda || finalizando) return;

    evento.preventDefault();
    arrastrando = true;
    inicioSeleccion = {
      fila: Number(celda.dataset.fila),
      columna: Number(celda.dataset.columna),
    };
    pintarSeleccion([inicioSeleccion]);
    celda.setPointerCapture?.(evento.pointerId);
  });

  grid.addEventListener("pointermove", (evento) => {
    if (!arrastrando || !inicioSeleccion) return;

    const elemento = document.elementFromPoint(
      evento.clientX,
      evento.clientY,
    );
    const celda = elemento?.closest?.(".sopa-cell");
    if (!celda) return;

    const destino = {
      fila: Number(celda.dataset.fila),
      columna: Number(celda.dataset.columna),
    };
    const linea = lineaEntre(inicioSeleccion, destino);

    if (linea.length) pintarSeleccion(linea);
  });

  window.addEventListener("pointerup", async () => {
    if (!arrastrando) return;
    arrastrando = false;
    await registrarSeleccion();
    inicioSeleccion = null;
  });

  async function finalizar(mensaje) {
    if (finalizando) return;
    finalizando = true;

    try {
      const respuesta = await llamarApiJuego(
        "/api/fase1/completar",
        { method: "POST" },
      );

      tokens.textContent = String(respuesta.tokens || 0);
      resultado.textContent =
        `${mensaje} Bonificación: +${respuesta.bonificacion || 0} tokens. ` +
        "Esperando a los demás escuadrones...";
      resultado.classList.add("visible");

      if (respuesta.fase === "f1_ranking") {
        window.location.replace("ranking.html");
      }
    } catch (error) {
      finalizando = false;
      mostrarErrorJuego(error);
    }
  }

  function iniciarReloj() {
    if (reloj) clearInterval(reloj);

    reloj = setInterval(() => {
      segundosLocales = Math.max(0, segundosLocales - 1);
      tiempo.textContent = formatearTiempo(segundosLocales);

      if (segundosLocales === 0) {
        clearInterval(reloj);
        finalizar("Se terminó el tiempo.");
      }
    }, 1000);
  }

  async function sincronizar() {
    try {
      const estado = await obtenerEstadoJuego();

      if (estado.fase === "f1_ranking") {
        window.location.replace("ranking.html");
        return;
      }

      if (estado.rutaSugerida !== "sopa-letras.html") {
        window.location.replace(estado.rutaSugerida);
        return;
      }

      encontradas = new Set(estado.palabras || []);
      segundosLocales = Number(
        estado.timer?.segundosRestantes ?? 60,
      );
      tiempo.textContent = formatearTiempo(segundosLocales);
      tokens.textContent = String(estado.grupo?.tokens || 0);
      encontradas.forEach(marcarEncontrada);
      renderLista();

      if (estado.grupo?.sopaCompletada) {
        finalizando = true;
        resultado.textContent =
          "Misión completada. Esperando a los demás escuadrones...";
        resultado.classList.add("visible");
      }
    } catch (error) {
      mostrarErrorJuego(error);
    }
  }

  crearMatriz();
  renderGrid();
  renderLista();
  sincronizar().then(iniciarReloj);
  polling = setInterval(sincronizar, 5000);

  window.addEventListener("beforeunload", () => {
    if (polling) clearInterval(polling);
    if (reloj) clearInterval(reloj);
  });
}
