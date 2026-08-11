/* ============================================================
   Misión Emprende UDD — mapa_agente.js
   Mapa HUB de habilidades + soporte ES/EN
   ============================================================ */

/*
  Este archivo funciona como HUB.
  Django manda la configuración desde habilidades_intro.html:

  window.MAPA_HABILIDADES_CONFIG = {
    habilidadActiva: "trabajo en equipo",
    habilidadesCompletadas: ["trabajo en equipo"],
    rutaContinuar: "/continuar-desde-mapa/",
    textoBoton: "CONTINUAR A TRABAJO EN EQUIPO"
  };
*/

const MAPA_CONFIG = window.MAPA_HABILIDADES_CONFIG || {};

function normalizarClave(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tJuego(clave, fallback = "") {
  const idioma = window.i18nJuego?.obtenerIdioma?.() || "es";
  return window.i18nJuego?.traducciones?.[idioma]?.[clave] || fallback;
}

const habilidadActivaKey = normalizarClave(MAPA_CONFIG.habilidadActiva || "trabajo en equipo");

const habilidadesCompletadasKeys = new Set(
  (MAPA_CONFIG.habilidadesCompletadas || []).map(normalizarClave)
);

const rutaContinuar = MAPA_CONFIG.rutaContinuar || "#";
const textoBotonBase = MAPA_CONFIG.textoBoton || "CONTINUAR";

/* ============================================================
   HABILIDADES DEL HUB
   ============================================================ */

const skills = [
  {
    key: "trabajo en equipo",
    e: "🤝",

    nameKey: "mapa_trabajo_nombre",
    subKey: "mapa_trabajo_sub",
    descKey: "mapa_trabajo_desc",
    botonKey: "mapa_boton_trabajo",

    name: "TRABAJO EN EQUIPO",
    sub: "COLABORACIÓN",
    c: "#ff6600",
    desc: "Escucha, comparte y avancen como uno solo. Un equipo sincronizado es el arma más poderosa de la misión.",
    pills: ["Escucha activa", "Meta común", "Apoyo mutuo"],
    pillsEn: ["Active listening", "Shared goal", "Mutual support"],
    imageKeys: ["trabajo en equipo"]
  },
  {
    key: "empatia",
    e: "💙",

    nameKey: "mapa_empatia_nombre",
    subKey: "mapa_empatia_sub",
    descKey: "mapa_empatia_desc",
    botonKey: "mapa_boton_empatia",

    name: "EMPATÍA",
    sub: "COMPRENSIÓN",
    c: "#00c8ff",
    desc: "Antes de actuar, entiende. Qué siente, qué necesita, qué teme la persona que buscas ayudar.",
    pills: ["¿Qué siente?", "¿Qué necesita?", "¿Qué espera?"],
    pillsEn: ["What do they feel?", "What do they need?", "What do they expect?"],
    imageKeys: ["empatia"]
  },
  {
    key: "creatividad",
    e: "💡",

    nameKey: "mapa_creatividad_nombre",
    subKey: "mapa_creatividad_sub",
    descKey: "mapa_creatividad_desc",
    botonKey: "mapa_boton_creatividad",

    name: "CREATIVIDAD",
    sub: "INNOVACIÓN",
    c: "#ffd700",
    desc: "Las soluciones obvias no bastan. Piensa diferente, combina lo inesperado, sorprende al mundo.",
    pills: ["Ideas atrevidas", "Combinar todo", "Iterar rápido"],
    pillsEn: ["Bold ideas", "Combine everything", "Iterate fast"],
    imageKeys: ["creatividad"]
  },
  {
    key: "mision final",
    e: "🚀",

    nameKey: "mapa_final_nombre",
    subKey: "mapa_final_sub",
    descKey: "mapa_final_desc",
    botonKey: "mapa_boton_final",

    name: "MISIÓN FINAL",
    sub: "COMUNICACIÓN + NEGOCIACIÓN",
    c: "#ff4455",
    desc: "Comunica tu propuesta con claridad, presenta tu solución y usa la retroalimentación para mejorar. Aquí se unen comunicación y negociación.",
    pills: ["Pitch claro", "Convicción", "Feedback", "Mejora"],
    pillsEn: ["Clear pitch", "Confidence", "Feedback", "Improve"],
    imageKeys: ["comunicacion", "negociacion"],
    esMisionFinal: true
  }
];

const ROUTE = [
  { fx: 0.16, fy: 0.24 },
  { fx: 0.80, fy: 0.24 },
  { fx: 0.28, fy: 0.74 },
  { fx: 0.78, fy: 0.72 }
];

const SPEEDS = ["3.2s", "2.9s", "3.7s", "3.0s"];
const DELAYS = ["0s", ".6s", "1.1s", ".3s"];

let activeIdx = Math.max(
  0,
  skills.findIndex(s => normalizarClave(s.key) === habilidadActivaKey)
);

if (activeIdx === -1) activeIdx = 0;

let selectedIdx = null;

let done = new Set();

skills.forEach((skill, idx) => {
  if (habilidadesCompletadasKeys.has(normalizarClave(skill.key))) {
    done.add(idx);
  }
});

/* ============================================================
   HELPERS TEXTO
   ============================================================ */

function nombreSkill(skill) {
  return tJuego(skill.nameKey, skill.name);
}

function subSkill(skill) {
  return tJuego(skill.subKey, skill.sub);
}

function descSkill(skill) {
  return tJuego(skill.descKey, skill.desc);
}

function botonSkill(skill) {
  return tJuego(skill.botonKey, textoBotonBase);
}

function pillsSkill(skill) {
  const idioma = window.i18nJuego?.obtenerIdioma?.() || "es";
  return idioma === "en" ? (skill.pillsEn || skill.pills) : skill.pills;
}

/* ============================================================
   HELPERS MAPA
   ============================================================ */

function rpx(f, t) {
  return Math.round(f * t);
}

function isActiveSkill(idx) {
  return idx === activeIdx;
}

function isDoneSkill(idx) {
  return done.has(idx);
}

function isLockedSkill(idx) {
  return !isActiveSkill(idx) && !isDoneSkill(idx);
}

function getStaticImage(key) {
  const normalizada = normalizarClave(key);

  if (typeof STATIC_IMAGES !== "undefined" && STATIC_IMAGES[normalizada]) {
    return STATIC_IMAGES[normalizada];
  }

  return null;
}

function iconHTML(skill) {
  if (skill.esMisionFinal) {
    const imgComunicacion = getStaticImage("comunicacion");
    const imgNegociacion = getStaticImage("negociacion");

    if (imgComunicacion && imgNegociacion) {
      return `
        <div class="img-dual-wrap">
          <div class="img-oct-wrap img-oct-mini">
            <img src="${imgComunicacion}" alt="Comunicación">
          </div>
          <div class="img-oct-wrap img-oct-mini">
            <img src="${imgNegociacion}" alt="Negociación">
          </div>
        </div>
      `;
    }
  }

  const firstKey = skill.imageKeys?.[0] || skill.key;
  const src = getStaticImage(firstKey);

  if (src) {
    return `<div class="img-oct-wrap"><img src="${src}" alt="${nombreSkill(skill)}"></div>`;
  }

  return skill.e;
}

function hasImage(skill) {
  if (skill.esMisionFinal) {
    return !!getStaticImage("comunicacion") && !!getStaticImage("negociacion");
  }

  const firstKey = skill.imageKeys?.[0] || skill.key;
  return !!getStaticImage(firstKey);
}

function setBottomButtonReady(ready) {
  const btn = document.getElementById("bt-btn");
  const hint = document.getElementById("bt-hint");

  if (!btn) return;

  const skill = skills[activeIdx];
  const textoBoton = skill ? botonSkill(skill) : textoBotonBase;

  btn.href = rutaContinuar;
  btn.textContent = `▶ ${textoBoton}`;

  if (ready) {
    btn.classList.add("ready");
    btn.style.pointerEvents = "all";
    btn.style.cursor = "pointer";

    if (hint) {
      hint.textContent = tJuego(
        "mapa_hint_confirmada",
        "// HABILIDAD CONFIRMADA — CONTINÚA LA MISIÓN"
      );
    }
  } else {
    btn.classList.remove("ready");
    btn.style.pointerEvents = "none";
    btn.style.cursor = "default";

    if (hint) {
      hint.textContent = tJuego(
        "mapa_hint",
        "// SELECCIONA LA HABILIDAD ACTIVA PARA CONTINUAR"
      );
    }
  }
}

/* ============================================================
   SONIDOS
   ============================================================ */

function playHoverSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(520, now + 0.12);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.start(now);
    osc.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(560, now + 0.06);
    osc2.frequency.linearRampToValueAtTime(800, now + 0.14);

    gain2.gain.setValueAtTime(0.03, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc2.start(now + 0.06);
    osc2.stop(now + 0.17);
  } catch (e) {}
}

function playClickSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    const bufLen = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 50);
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();

    noise.buffer = buf;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.value = 0.25;
    noise.start(now);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc.start(now + 0.02);
    osc.stop(now + 0.22);

    [
      { t: 0.22, f: 440 },
      { t: 0.32, f: 660 }
    ].forEach(({ t, f }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = "sine";
      o.frequency.value = f;

      g.gain.setValueAtTime(0.10, now + t);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);

      o.start(now + t);
      o.stop(now + t + 0.09);
    });
  } catch (e) {}
}

/* ============================================================
   MAPA
   ============================================================ */

function build() {
  const wrap = document.getElementById("map-wrap");
  if (!wrap) return;

  const W = wrap.offsetWidth;
  const H = wrap.offsetHeight;

  if (!W || !H) {
    setTimeout(build, 100);
    return;
  }

  const svg = document.getElementById("msvg");
  if (!svg) return;

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const pts = ROUTE.map(r => ({
    x: rpx(r.fx, W),
    y: rpx(r.fy, H)
  }));

  let grid = "";

  for (let x = 0; x < W; x += 80) {
    grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(140,200,255,.35)" stroke-width="1"/>`;
  }

  for (let y = 0; y < H; y += 80) {
    grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(140,200,255,.35)" stroke-width="1"/>`;
  }

  let rings = "";

  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([fx, fy]) => {
    const cx = fx === 0 ? 32 : W - 32;
    const cy = fy === 0 ? 32 : H - 32;

    [20, 36, 52].forEach(r => {
      rings += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(40,100,255,.1)" stroke-width="1"/>`;
    });

    rings += `<line x1="${cx - 16}" y1="${cy}" x2="${cx + 16}" y2="${cy}" stroke="rgba(40,100,255,.12)" stroke-width="1"/>`;
    rings += `<line x1="${cx}" y1="${cy - 16}" x2="${cx}" y2="${cy + 16}" stroke="rgba(40,100,255,.12)" stroke-width="1"/>`;
  });

  let pathD = `M${pts[0].x},${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.18;

    pathD += ` Q${cx},${cy} ${b.x},${b.y}`;
  }

  svg.innerHTML =
    grid +
    rings +
    `<path d="${pathD}" fill="none" stroke="rgba(64,128,255,.2)" stroke-width="3" stroke-dasharray="10 7"/>` +
    `<path d="${pathD}" fill="none" stroke="rgba(64,128,255,.07)" stroke-width="18"/>`;

  document.querySelectorAll(".nd").forEach(n => n.remove());

  pts.forEach((p, i) => {
    const s = skills[i];

    const isDone = isDoneSkill(i);
    const isLocked = isLockedSkill(i);
    const isActive = isActiveSkill(i);

    const nd = document.createElement("div");

    nd.className =
      "nd" +
      (isDone ? " done" : "") +
      (isLocked ? " locked" : "") +
      (isActive ? " active" : "") +
      (hasImage(s) ? " has-img" : "");

    nd.id = "nd" + i;
    nd.dataset.skillKey = s.key;

    nd.style.cssText =
      `left:${p.x}px;` +
      `top:${p.y}px;` +
      `--c:${s.c};` +
      `--spd:${SPEEDS[i]};` +
      `--dly:${DELAYS[i]};`;

    nd.innerHTML = `
      <div class="nd-outer">
        <div class="nd-pulse"></div>
        <div class="nd-icon">${iconHTML(s)}</div>
        <div class="nd-check">✓</div>
        <div class="nd-lock">🔒</div>
      </div>
      <div class="nd-lbl">${nombreSkill(s)}</div>
    `;

    nd.addEventListener("mouseenter", () => {
      if (!nd.classList.contains("locked")) {
        playHoverSound();
      }
    });

    nd.onclick = () => {
      if (nd.classList.contains("locked")) return;

      playClickSound();
      openSkill(i);
    };

    wrap.appendChild(nd);
  });

  moveDot(activeIdx, false);
  buildPips();
  setBottomButtonReady(false);

  setTimeout(() => {
    openSkill(activeIdx, false);
  }, 250);
}

function buildPips() {
  const c = document.getElementById("pips");
  if (!c) return;

  c.innerHTML = "";

  skills.forEach((skill, i) => {
    const d = document.createElement("div");

    d.className =
      "pip" +
      (done.has(i) ? " done" : "") +
      (i === activeIdx ? " active" : "");

    c.appendChild(d);
  });
}

/* ============================================================
   DOT
   ============================================================ */

let dotCurrentIdx = 0;

function moveDot(idx, animate = true) {
  const wrap = document.getElementById("map-wrap");
  const dot = document.getElementById("pdot");

  if (!wrap || !dot || !ROUTE[idx]) return;

  const W = wrap.offsetWidth;
  const H = wrap.offsetHeight;

  if (!animate) {
    const r = ROUTE[idx];

    dot.style.transition = "none";
    dot.style.left = rpx(r.fx, W) + "px";
    dot.style.top = rpx(r.fy, H) + "px";

    dotCurrentIdx = idx;
    return;
  }

  const pts = ROUTE.map(r => ({
    x: rpx(r.fx, W),
    y: rpx(r.fy, H)
  }));

  const ns = "http://www.w3.org/2000/svg";

  function buildPathUntil(i) {
    let d = `M${pts[0].x},${pts[0].y}`;

    for (let j = 1; j <= i; j++) {
      const a = pts[j - 1];
      const b = pts[j];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.18;

      d += ` Q${cx},${cy} ${b.x},${b.y}`;
    }

    return d;
  }

  function lengthAtNode(i) {
    const s2 = document.createElementNS(ns, "svg");
    const p2 = document.createElementNS(ns, "path");

    p2.setAttribute("d", buildPathUntil(i));

    s2.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:0;height:0;overflow:hidden;";

    s2.appendChild(p2);
    document.body.appendChild(s2);

    const len = p2.getTotalLength();

    document.body.removeChild(s2);

    return len;
  }

  const animSvg = document.createElementNS(ns, "svg");
  const animPath = document.createElementNS(ns, "path");

  animPath.setAttribute("d", buildPathUntil(ROUTE.length - 1));

  animSvg.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:0;height:0;overflow:hidden;";

  animSvg.appendChild(animPath);
  document.body.appendChild(animSvg);

  const fromLen = dotCurrentIdx === idx ? 0 : lengthAtNode(Math.min(dotCurrentIdx, idx));
  const toLen = lengthAtNode(idx);

  const duration = 1000;
  const start = performance.now();

  dot.style.transition = "none";
  dot.classList.add("moving");

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function step(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const pt = animPath.getPointAtLength(fromLen + (toLen - fromLen) * easeInOut(t));

    dot.style.left = pt.x + "px";
    dot.style.top = pt.y + "px";

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      document.body.removeChild(animSvg);
      dotCurrentIdx = idx;
      dot.classList.remove("moving");
    }
  }

  requestAnimationFrame(step);
}

/* ============================================================
   PANEL
   ============================================================ */

function openSkill(idx, animateDot = true) {
  if (isLockedSkill(idx)) return;

  selectedIdx = idx;

  if (animateDot) {
    moveDot(idx, true);
  }

  const s = skills[idx];

  const empty = document.getElementById("pempty");
  if (empty) empty.style.display = "none";

  const card = document.getElementById("pcard");
  if (!card) return;

  card.classList.remove("show");
  card.style.display = "none";

  void card.offsetWidth;

  const pcEm = document.getElementById("pc-em");
  const pcName = document.getElementById("pc-name");
  const pcDesc = document.getElementById("pc-desc");
  const pcSub = document.getElementById("pc-sub");
  const pcPills = document.getElementById("pc-pills");
  const btn = document.getElementById("pc-btn");

  if (pcEm) {
    pcEm.innerHTML = iconHTML(s);
  }

  if (pcName) {
    pcName.textContent = nombreSkill(s);
  }

  if (pcDesc) {
    pcDesc.textContent = descSkill(s);
  }

  card.style.setProperty("--skill-c", s.c);

  if (pcSub) {
    pcSub.textContent = subSkill(s);
    pcSub.style.color = s.c;
  }

  if (pcPills) {
    pcPills.innerHTML = pillsSkill(s)
      .map(p => `<div class="pll">${p}</div>`)
      .join("");
  }

  if (btn) {
    btn.classList.remove("confirmed");

    if (isDoneSkill(idx) && !isActiveSkill(idx)) {
      btn.textContent = `[ ${tJuego("mapa_habilidad_completada", "HABILIDAD COMPLETADA ✓")} ]`;
      btn.classList.add("confirmed");
    } else if (isActiveSkill(idx)) {
      btn.textContent = `[ ${botonSkill(s)} ]`;
    } else {
      btn.textContent = `[ ${tJuego("mapa_bloqueado", "BLOQUEADO")} ]`;
      btn.classList.add("confirmed");
    }
  }

  card.style.display = "flex";

  requestAnimationFrame(() => {
    card.classList.add("show");
  });
}

function markDone() {
  if (selectedIdx === null) return;

  if (!isActiveSkill(selectedIdx)) {
    return;
  }

  playClickSound();

  done.add(selectedIdx);

  const btnPanel = document.getElementById("pc-btn");
  if (btnPanel) {
    btnPanel.textContent = `[ ${tJuego("mapa_cargando", "CARGANDO MISIÓN...")} ]`;
    btnPanel.classList.add("confirmed");
  }

  const nd = document.getElementById("nd" + selectedIdx);
  if (nd) {
    nd.classList.add("done");
    nd.classList.remove("locked");
  }

  buildPips();

  setTimeout(() => {
    window.location.href = rutaContinuar;
  }, 450);
}

/* ============================================================
   MÚSICA + EVENTOS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");

  if (music) {
    music.volume = 0.4;

    function startMusic() {
      music.play().catch(() => {});
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    }

    music.play().catch(() => {
      document.addEventListener("click", startMusic);
      document.addEventListener("keydown", startMusic);
    });
  }

  const pcBtn = document.getElementById("pc-btn");
  if (pcBtn) {
    pcBtn.addEventListener("mouseenter", playHoverSound);
  }

  const btBtn = document.getElementById("bt-btn");
  if (btBtn) {
    btBtn.addEventListener("mouseenter", playHoverSound);
    btBtn.addEventListener("click", event => {
      if (!btBtn.classList.contains("ready")) {
        event.preventDefault();
        return;
      }

      playClickSound();
    });
  }
});

window.addEventListener("resize", build);

window.addEventListener("idiomaJuegoCambiado", () => {
  build();

  if (selectedIdx !== null) {
    setTimeout(() => openSkill(selectedIdx, false), 80);
  }
});

setTimeout(build, 80);