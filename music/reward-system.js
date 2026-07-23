/*
 * Shared reward layer for every Tiny Games Arcade music nugget.
 *
 * Integration is a single line: after the existing `streak++;` on a correct
 * answer, add `RewardSystem.correct();` — nothing else to wire up. The module
 * injects its own widget/modal DOM, tracks progress in localStorage, and
 * auto-detects which game called it from the page URL.
 *
 * Mechanic: the child picks an animal once (persists across every game).
 * Correct answers build it up, one part at a time; on the 5th part the
 * animal is complete and celebrates. Per game, the first three times an
 * animal completes get progressively smaller fanfare (Reward system.md's
 * "three times max"); after that it still completes, just quietly.
 */
(function () {
  const STORAGE_ANIMAL = "tga_reward_animal";
  const STORAGE_COMPLETIONS = "tga_reward_completions";
  const PARTS_PER_ANIMAL = 5;
  const PART_ORDER = ["body", "legs", "ears", "tail", "face"];

  const ANIMALS = {
    cat: { name: "Cat", body: "#f4a83f", accent: "#fff4e0", ear: "pointed" },
    fox: { name: "Fox", body: "#ef6f8e", accent: "#fff0f4", ear: "pointed" },
    bear: { name: "Bear", body: "#a1662f", accent: "#f3e2cf", ear: "round" },
    rabbit: { name: "Rabbit", body: "#8ec9e8", accent: "#eef8ff", ear: "long" },
    owl: { name: "Owl", body: "#6b4c8a", accent: "#ece4f5", ear: "tuft" },
  };

  function currentGameId() {
    const file = location.pathname.split("/").pop() || "game";
    return file.replace(/\.html?$/i, "");
  }

  function loadCompletions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_COMPLETIONS)) || {};
    } catch {
      return {};
    }
  }

  function saveCompletions(obj) {
    localStorage.setItem(STORAGE_COMPLETIONS, JSON.stringify(obj));
  }

  function ensureStyles() {
    if (document.getElementById("reward-system-styles")) return;
    const style = document.createElement("style");
    style.id = "reward-system-styles";
    style.textContent = `
      #reward-widget {
        position: fixed; right: 16px; bottom: 16px; z-index: 9998;
        width: 96px; height: 96px; border-radius: 20px;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 6px 0 rgba(90,60,30,0.15), 0 10px 18px rgba(90,60,30,0.14);
        border: 3px solid rgba(255,255,255,0.8);
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      #reward-widget svg { width: 76px; height: 76px; }
      .rw-part { opacity: 0; transform: scale(0.4); transform-origin: center;
        animation: rw-pop 0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
      @keyframes rw-pop { to { opacity: 1; transform: scale(1); } }

      #reward-modal-backdrop {
        position: fixed; inset: 0; background: rgba(40,30,20,0.35);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; opacity: 0; pointer-events: none; transition: opacity .25s ease;
      }
      #reward-modal-backdrop.show { opacity: 1; pointer-events: auto; }
      #reward-modal {
        background: #fffdf6; border-radius: 24px; padding: 28px 32px 24px;
        text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        transform: scale(0.85); transition: transform .25s ease;
        font-family: 'Trebuchet MS','Segoe UI',sans-serif; max-width: 260px;
      }
      #reward-modal-backdrop.show #reward-modal { transform: scale(1); }
      #reward-modal svg { width: 120px; height: 120px; }
      #reward-modal h2 { margin: 4px 0 2px; font-size: 20px; color: #4a3728; }
      #reward-modal p { margin: 0 0 14px; font-size: 14px; color: #6b5745; }
      #reward-modal button {
        appearance: none; border: none; cursor: pointer; font-family: inherit;
        font-size: 14px; font-weight: 800; color: #fff; padding: 9px 20px;
        border-radius: 14px; background: linear-gradient(180deg,#4a9d5f,#3f8a51);
        box-shadow: 0 4px 0 rgba(0,0,0,0.18);
      }

      #reward-confetti-holder { position: fixed; inset: 0; pointer-events: none; z-index: 10000; }
      .rw-confetti { position: fixed; width: 8px; height: 8px; border-radius: 2px;
        animation: rw-confetti 900ms ease-out forwards; }
      @keyframes rw-confetti {
        to { transform: translate(var(--dx), var(--dy)) rotate(360deg); opacity: 0; }
      }

      #reward-picker-backdrop {
        position: fixed; inset: 0; background: rgba(40,30,20,0.4);
        display: flex; align-items: center; justify-content: center; z-index: 9999;
      }
      #reward-picker {
        background: #fffdf6; border-radius: 24px; padding: 26px 28px;
        text-align: center; font-family: 'Trebuchet MS','Segoe UI',sans-serif;
        box-shadow: 0 16px 40px rgba(0,0,0,0.25); max-width: 320px;
      }
      #reward-picker h2 { margin: 0 0 4px; font-size: 19px; color: #4a3728; }
      #reward-picker p { margin: 0 0 16px; font-size: 13px; color: #6b5745; }
      #reward-picker .rw-options { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
      #reward-picker button {
        appearance: none; border: 3px solid transparent; cursor: pointer;
        background: #f6f2e8; border-radius: 16px; padding: 10px; width: 78px;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        font-family: inherit; font-size: 11px; font-weight: 700; color: #4a3728;
      }
      #reward-picker button:hover { border-color: #f4c542; }
      #reward-picker button svg { width: 48px; height: 48px; }
    `;
    document.head.appendChild(style);
  }

  // Simple flat-shape critter, built from basic primitives (not hand-illustrated art) —
  // deliberately easy to swap for real character sprites later if wanted.
  function animalSvg(key, partsShown) {
    const a = ANIMALS[key];
    const has = (p) => partsShown.includes(p);
    const ears =
      a.ear === "pointed"
        ? `<path d="M28 30 L20 8 L40 26 Z" fill="${a.body}"/><path d="M72 30 L80 8 L60 26 Z" fill="${a.body}"/>`
        : a.ear === "round"
          ? `<circle cx="28" cy="20" r="13" fill="${a.body}"/><circle cx="72" cy="20" r="13" fill="${a.body}"/>`
          : a.ear === "long"
            ? `<ellipse cx="32" cy="6" rx="8" ry="22" fill="${a.body}"/><ellipse cx="68" cy="6" rx="8" ry="22" fill="${a.body}"/>`
            : `<path d="M26 26 L18 4 L38 22 Z" fill="${a.body}"/><path d="M74 26 L82 4 L62 22 Z" fill="${a.body}"/>`; // tuft (owl)

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${has("tail") ? `<g class="rw-part"><ellipse cx="88" cy="66" rx="12" ry="7" fill="${a.body}" transform="rotate(-25 88 66)"/></g>` : ""}
      ${has("legs") ? `<g class="rw-part"><rect x="34" y="78" width="10" height="16" rx="4" fill="${a.body}"/><rect x="56" y="78" width="10" height="16" rx="4" fill="${a.body}"/></g>` : ""}
      ${has("ears") ? `<g class="rw-part">${ears}</g>` : ""}
      ${has("body") ? `<g class="rw-part"><ellipse cx="50" cy="58" rx="34" ry="30" fill="${a.body}"/><ellipse cx="50" cy="66" rx="18" ry="14" fill="${a.accent}"/></g>` : ""}
      ${has("face") ? `<g class="rw-part"><circle cx="38" cy="48" r="6" fill="#fff"/><circle cx="62" cy="48" r="6" fill="#fff"/><circle cx="39" cy="49" r="3" fill="#1e1b17"/><circle cx="63" cy="49" r="3" fill="#1e1b17"/><ellipse cx="50" cy="58" rx="4" ry="3" fill="#1e1b17"/></g>` : ""}
    </svg>`;
  }

  function ensureWidget() {
    let widget = document.getElementById("reward-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.id = "reward-widget";
      document.body.appendChild(widget);
    }
    return widget;
  }

  function renderWidget(key, sessionParts) {
    ensureStyles();
    const widget = ensureWidget();
    const shown = PART_ORDER.slice(0, sessionParts);
    widget.innerHTML = animalSvg(key, shown);
  }

  function confettiBurst(intensity) {
    ensureStyles();
    const holder = document.createElement("div");
    holder.id = "reward-confetti-holder";
    document.body.appendChild(holder);
    const colors = ["#f43f5e", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ff7849"];
    const count = intensity === 2 ? 60 : intensity === 1 ? 30 : 12;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "rw-confetti";
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 160;
      p.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = "50%";
      p.style.top = "40%";
      holder.appendChild(p);
    }
    setTimeout(() => holder.remove(), 950);
  }

  function chime(tier) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = tier === 2 ? [523.25, 659.25, 783.99] : tier === 1 ? [523.25, 659.25] : [659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } catch {
      /* Web Audio unavailable — celebration still shows visually, just silent. */
    }
  }

  function showCelebration(key, tier) {
    ensureStyles();
    const a = ANIMALS[key];
    const messages = [
      { title: "Amazing! 🎉", body: `You built a whole ${a.name.toLowerCase()}!` },
      { title: "Well done again! ⭐", body: `Another ${a.name.toLowerCase()}, all built!` },
      { title: "Nice! ✨", body: `${a.name} says hello again.` },
    ];
    const msg = messages[Math.min(tier, 2)];

    let backdrop = document.getElementById("reward-modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "reward-modal-backdrop";
      backdrop.innerHTML = `<div id="reward-modal">
        <div id="reward-modal-animal"></div>
        <h2 id="reward-modal-title"></h2>
        <p id="reward-modal-body"></p>
        <button id="reward-modal-btn">Keep going!</button>
      </div>`;
      document.body.appendChild(backdrop);
      backdrop.querySelector("#reward-modal-btn").onclick = () => backdrop.classList.remove("show");
      backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.classList.remove("show"); };
    }
    backdrop.querySelector("#reward-modal-animal").innerHTML = animalSvg(key, PART_ORDER);
    backdrop.querySelector("#reward-modal-title").textContent = msg.title;
    backdrop.querySelector("#reward-modal-body").textContent = msg.body;
    backdrop.classList.add("show");
    confettiBurst(Math.min(tier, 2) === 2 ? 0 : Math.min(tier, 2) === 1 ? 1 : 2); // tier 0 = biggest burst
    chime(2 - Math.min(tier, 2));
    setTimeout(() => backdrop.classList.remove("show"), tier === 0 ? 2600 : tier === 1 ? 1800 : 1200);
  }

  function pickAnimal(onChosen) {
    ensureStyles();
    const backdrop = document.createElement("div");
    backdrop.id = "reward-picker-backdrop";
    const options = Object.entries(ANIMALS)
      .map(([key, a]) => `<button data-key="${key}">${animalSvg(key, PART_ORDER)}<span>${a.name}</span></button>`)
      .join("");
    backdrop.innerHTML = `<div id="reward-picker">
      <h2>Choose your animal!</h2>
      <p>Get answers right to build it up.</p>
      <div class="rw-options">${options}</div>
    </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelectorAll("button[data-key]").forEach((btn) => {
      btn.onclick = () => {
        const key = btn.getAttribute("data-key");
        localStorage.setItem(STORAGE_ANIMAL, key);
        backdrop.remove();
        onChosen(key);
      };
    });
  }

  let sessionParts = 0;
  let chosenAnimal = null;
  let ready = false;
  let pendingCorrect = 0;

  function withAnimal(cb) {
    if (chosenAnimal) return cb(chosenAnimal);
    const saved = localStorage.getItem(STORAGE_ANIMAL);
    if (saved && ANIMALS[saved]) {
      chosenAnimal = saved;
      ready = true;
      return cb(chosenAnimal);
    }
    if (ready) return; // picker already open, awaiting a choice
    ready = true;
    pickAnimal((key) => {
      chosenAnimal = key;
      cb(key);
      // Replay any correct() calls that arrived while the picker was open.
      for (let i = 0; i < pendingCorrect; i++) applyCorrect(key);
      pendingCorrect = 0;
    });
  }

  function applyCorrect(key) {
    sessionParts = Math.min(sessionParts + 1, PARTS_PER_ANIMAL);
    renderWidget(key, sessionParts);
    if (sessionParts === PARTS_PER_ANIMAL) {
      const gameId = currentGameId();
      const completions = loadCompletions();
      const tier = completions[gameId] || 0;
      showCelebration(key, tier);
      completions[gameId] = Math.min(tier + 1, 3);
      saveCompletions(completions);
      sessionParts = 0;
    }
  }

  window.RewardSystem = {
    correct() {
      if (!chosenAnimal) {
        pendingCorrect++;
        withAnimal(() => {});
        return;
      }
      applyCorrect(chosenAnimal);
    },
  };
})();
