const nombresEscuadron = [
  "Equipo Cóndor",
  "Misión Alfa",
  "Agentes UDD",
  "Mentes Creativas",
  "Los Innovadores",
  "Escuadrón Delta",
  "Visionarios UDD",
  "Código Naranja",
  "Equipo Fénix",
  "StartUp Squad",
  "Los Estrategas",
  "Comando Emprende",
];

const formulario = document.getElementById("form-registro");
const inputCodigo = document.getElementById("id_grupo");
const inputNombre = document.getElementById("nombre_grupo");
const botonContinuar = document.getElementById("botonContinuar");
const popupError = document.getElementById("popup_error");
const popupErrorTexto = document.getElementById("popup_error_texto");
const bgMusic = document.getElementById("bg-music");

let temporizadorError;

function mostrarError(mensaje) {
  clearTimeout(temporizadorError);
  popupErrorTexto.textContent = mensaje;
  popupError.hidden = false;

  temporizadorError = setTimeout(cerrarPopup, 4000);
}

function cerrarPopup() {
  popupError.hidden = true;
}

document.getElementById("cerrar_popup")
  ?.addEventListener("click", cerrarPopup);

// Música original de la pantalla.
if (bgMusic) {
  bgMusic.volume = 0.4;

  bgMusic.play().catch(() => {
    function iniciarMusica() {
      bgMusic.play().catch(() => {});
      document.removeEventListener("click", iniciarMusica);
      document.removeEventListener("keydown", iniciarMusica);
    }

    document.addEventListener("click", iniciarMusica);
    document.addEventListener("keydown", iniciarMusica);
  });
}

// Efecto original al continuar.
function playAgentSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    function makeReverb(dur = 1.2) {
      const conv = ctx.createConvolver();
      const len = ctx.sampleRate * dur;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);

      for (let canal = 0; canal < 2; canal += 1) {
        const datos = buf.getChannelData(canal);

        for (let i = 0; i < len; i += 1) {
          datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
        }
      }

      conv.buffer = buf;
      return conv;
    }

    const reverb = makeReverb(1.2);
    const revGain = ctx.createGain();
    revGain.gain.value = 0.35;
    reverb.connect(revGain);
    revGain.connect(ctx.destination);

    function tone(freq, start, dur, type = "sine", vol = 0.18) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(reverb);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.1);
    }

    tone(55, 0.00, 0.12, "sine", 0.28);
    tone(55, 0.18, 0.10, "sine", 0.18);

    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    droneGain.connect(reverb);
    drone.type = "sawtooth";
    drone.frequency.setValueAtTime(55, now + 0.30);
    drone.frequency.linearRampToValueAtTime(82, now + 0.90);
    droneGain.gain.setValueAtTime(0.001, now + 0.30);
    droneGain.gain.linearRampToValueAtTime(0.12, now + 0.50);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.90);
    drone.start(now + 0.30);
    drone.stop(now + 0.95);

    tone(220, 0.35, 0.08, "sine", 0.14);
    tone(220, 0.46, 0.08, "sine", 0.14);
    tone(277, 0.57, 0.12, "sine", 0.18);
    tone(110, 0.72, 0.55, "sine", 0.22);
    tone(138, 0.74, 0.50, "triangle", 0.12);
    tone(165, 0.76, 0.45, "sine", 0.10);

    const clickBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const clickData = clickBuf.getChannelData(0);

    for (let i = 0; i < clickData.length; i += 1) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 200);
    }

    const click = ctx.createBufferSource();
    const clickGain = ctx.createGain();
    click.buffer = clickBuf;
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickGain.gain.value = 0.4;
    click.start(now + 1.00);
  } catch (_) {
    // El sonido no debe bloquear el ingreso.
  }
}

let keyCount = 0;

function playKeyClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const freqs = [220, 246, 261, 293, 329, 349, 392, 440];
    const freq = freqs[keyCount % freqs.length];
    keyCount += 1;

    const delay = ctx.createDelay(0.3);
    const delayGain = ctx.createGain();
    delay.delayTime.value = 0.12;
    delayGain.gain.value = 0.18;
    delay.connect(delayGain);
    delayGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.connect(delay);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "triangle";
    osc2.frequency.value = freq * 3;
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc2.start(now);
    osc2.stop(now + 0.08);

    const bufLen = Math.floor(ctx.sampleRate * 0.025);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < bufLen; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 40);
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buf;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.value = 0.08;
    noise.start(now);
  } catch (_) {
    // Los efectos no deben bloquear el formulario.
  }
}

function generarNombreEscuadron() {
  const elegido = nombresEscuadron[
    Math.floor(Math.random() * nombresEscuadron.length)
  ];

  inputNombre.value = elegido;
  playKeyClick();
}

document.getElementById("btnNombreAleatorio")
  ?.addEventListener("click", generarNombreEscuadron);

[inputCodigo, inputNombre].forEach((input) => {
  input?.addEventListener("keydown", (evento) => {
    if (evento.key.length === 1 || evento.key === "Backspace") {
      playKeyClick();
    }
  });
});

inputCodigo?.addEventListener("input", () => {
  inputCodigo.value = inputCodigo.value
    .toUpperCase()
    .replace(/\s+/g, "");
});

formulario?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  cerrarPopup();

  const codigo = inputCodigo.value.trim().toUpperCase();
  const nombreGrupo = inputNombre.value.trim();

  if (!codigo) {
    mostrarError("Debes ingresar el código de escuadrón.");
    inputCodigo.focus();
    return;
  }

  playAgentSound();
  botonContinuar.disabled = true;
  botonContinuar.innerHTML = 'CONECTANDO <span class="btn-arrow">▶▶</span>';

  try {
    const resultado = await llamarApi("/api/acceso/ingresar", {
      method: "POST",
      body: JSON.stringify({
        codigo,
        nombreGrupo,
      }),
    });

    guardarSesionGrupo(resultado, codigo);

    // Se creará en el siguiente paso conservando también su diseño original.
    window.location.href = "../juego/fase1/bienvenida.html";
  } catch (error) {
    mostrarError(error.message || "No fue posible ingresar al escuadrón.");
  } finally {
    botonContinuar.disabled = false;
    botonContinuar.innerHTML = 'CONTINUAR <span class="btn-arrow">▶▶</span>';
  }
});
