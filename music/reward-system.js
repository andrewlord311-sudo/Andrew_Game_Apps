/*
 * Shared reward layer for every Tiny Games Arcade music nugget.
 *
 * Integration:
 *   - After the existing `streak++;` on a correct answer, add
 *     `RewardSystem.correct();` — nothing else to wire up for the base
 *     reward loop.
 *   - Optionally, once at game setup, register
 *     `RewardSystem.onAnimalComplete(() => { if (currentStage < 3) setStage(currentStage + 1); });`
 *     so completing an animal automatically advances the difficulty stage
 *     (separate from - and in addition to - each game's own streak-based
 *     stage-complete overlay, which is unchanged).
 *
 * The module shows its own animal-picker modal as soon as the page loads
 * (before the first question is answered, not lazily on the first correct
 * answer), injects its own widget/modal DOM, tracks completion tiers in
 * localStorage, and auto-detects which game called it from the page URL.
 *
 * Mechanic: the child picks an animal fresh at the start of every game
 * (shared devices mean the same browser sees different pupils game to
 * game, so the choice is never persisted). Correct answers build it up,
 * one part at a time; on the 8th part the animal is complete and
 * celebrates. Per game, the first three times an animal completes get
 * progressively smaller fanfare (Reward system.md's "three times max");
 * after that it still completes, just quietly.
 *
 * The completion tally that drives that fanfare tier is scoped per
 * logged-in pupil (reads the same tga_pupil_session auth.js writes), so
 * one child's tally doesn't affect another's on a shared device. A pupil
 * with no session (guest) shares a single "guest" bucket, separate from
 * every named pupil.
 */
(function () {
  const STORAGE_PREFIX = "tga_reward_completions";
  const SESSION_KEY = "tga_pupil_session"; // must match auth.js's STORAGE_SESSION
  const PARTS_PER_ANIMAL = 8;
  const PART_ORDER = ["body", "legs", "arms", "ears", "tail", "eyes", "nose", "mouth"];

  const ANIMALS = {
    cat: { name: "Cat", body: "#f4a83f", accent: "#fff4e0" },
    fox: { name: "Fox", body: "#ef6f8e", accent: "#fff0f4" },
    bear: { name: "Bear", body: "#a1662f", accent: "#f3e2cf" },
    rabbit: { name: "Rabbit", body: "#8ec9e8", accent: "#eef8ff" },
    owl: { name: "Owl", body: "#6b4c8a", accent: "#ece4f5" },
  };

  function currentPupilKey() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      return (session && session.id) || "guest";
    } catch {
      return "guest";
    }
  }

  function storageKey() {
    return `${STORAGE_PREFIX}::${currentPupilKey()}`;
  }

  function currentGameId() {
    const file = location.pathname.split("/").pop() || "game";
    return file.replace(/\.html?$/i, "");
  }

  function loadCompletions() {
    try {
      return JSON.parse(localStorage.getItem(storageKey())) || {};
    } catch {
      return {};
    }
  }

  function saveCompletions(obj) {
    localStorage.setItem(storageKey(), JSON.stringify(obj));
  }

  function ensureStyles() {
    if (document.getElementById("reward-system-styles")) return;
    const style = document.createElement("style");
    style.id = "reward-system-styles";
    style.textContent = `
      #reward-widget {
        position: fixed; right: 16px; bottom: 16px; z-index: 9998;
        width: clamp(120px, 26vw, 260px); height: clamp(120px, 26vw, 260px);
        border-radius: 15%;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 10px 0 rgba(90,60,30,0.15), 0 16px 32px rgba(90,60,30,0.14);
        border: 5px solid rgba(255,255,255,0.8);
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      #reward-widget svg { width: 85%; height: 85%; }
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

  // Flat-shape critters, but each species gets its own silhouette and face
  // rather than one shared blob with a different ear bolted on (the old
  // version) — a fox needs a pointed muzzle and a bushy tail, a rabbit needs
  // tall ears and front teeth, an owl needs wings instead of arms and no
  // real legs at all. Still simple SVG primitives, not hand-illustrated art;
  // just enough per-species detail that a child can tell them apart at a
  // glance (Andrew, 27.8.26 — the old ones "all look poor").
  const INK = "#1e1b17";

  const ANIMAL_PARTS = {
    cat: (a) => ({
      body: `<circle cx="50" cy="34" r="19" fill="${a.body}"/><ellipse cx="50" cy="62" rx="28" ry="26" fill="${a.body}"/><ellipse cx="50" cy="70" rx="14" ry="16" fill="${a.accent}"/>`,
      legs: `<rect x="34" y="86" width="9" height="13" rx="4" fill="${a.body}"/><rect x="57" y="86" width="9" height="13" rx="4" fill="${a.body}"/>`,
      arms: `<ellipse cx="17" cy="58" rx="8" ry="5.5" fill="${a.body}" transform="rotate(20 17 58)"/><ellipse cx="83" cy="58" rx="8" ry="5.5" fill="${a.body}" transform="rotate(-20 83 58)"/>`,
      ears: `<polygon points="32,26 25,4 45,22" fill="${a.body}"/><polygon points="33,20 29,9 39,19" fill="${a.accent}"/><polygon points="68,26 75,4 55,22" fill="${a.body}"/><polygon points="67,20 71,9 61,19" fill="${a.accent}"/>`,
      tail: `<path d="M78,80 Q95,76 93,58 Q91,44 77,48" stroke="${a.body}" stroke-width="9" stroke-linecap="round" fill="none"/>`,
      eyes: `<path d="M40,32 Q44,28 48,32 Q44,36 40,32 Z" fill="${INK}"/><path d="M52,32 Q56,28 60,32 Q56,36 52,32 Z" fill="${INK}"/>`,
      nose: `<polygon points="46,40 54,40 50,45" fill="#f0a8bb"/>`,
      mouth: `<path d="M44,47 Q50,51 56,47" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="38" y1="42" x2="24" y2="38" stroke="${INK}" stroke-width="1"/><line x1="38" y1="45" x2="24" y2="47" stroke="${INK}" stroke-width="1"/><line x1="62" y1="42" x2="76" y2="38" stroke="${INK}" stroke-width="1"/><line x1="62" y1="45" x2="76" y2="47" stroke="${INK}" stroke-width="1"/>`,
    }),
    fox: (a) => ({
      body: `<circle cx="50" cy="34" r="18" fill="${a.body}"/><ellipse cx="50" cy="62" rx="27" ry="25" fill="${a.body}"/><ellipse cx="50" cy="70" rx="13" ry="15" fill="${a.accent}"/>`,
      legs: `<rect x="35" y="84" width="9" height="13" rx="4" fill="${a.body}"/><rect x="56" y="84" width="9" height="13" rx="4" fill="${a.body}"/><circle cx="39.5" cy="99" r="3.5" fill="${INK}"/><circle cx="60.5" cy="99" r="3.5" fill="${INK}"/>`,
      arms: `<ellipse cx="18" cy="58" rx="8" ry="5.5" fill="${a.body}" transform="rotate(20 18 58)"/><ellipse cx="82" cy="58" rx="8" ry="5.5" fill="${a.body}" transform="rotate(-20 82 58)"/>`,
      ears: `<polygon points="30,22 22,0 44,18" fill="${a.body}"/><polygon points="25,5 22,0 30,11" fill="${INK}"/><polygon points="32,18 28,6 38,16" fill="${a.accent}"/><polygon points="70,22 78,0 56,18" fill="${a.body}"/><polygon points="75,5 78,0 70,11" fill="${INK}"/><polygon points="68,18 72,6 62,16" fill="${a.accent}"/>`,
      tail: `<path d="M76,68 Q96,56 97,78 Q98,96 79,90 Q68,85 72,72 Z" fill="${a.body}" stroke="rgba(0,0,0,0.15)" stroke-width="1.2"/><ellipse cx="87" cy="82" rx="8" ry="6.5" fill="${a.accent}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>`,
      eyes: `<ellipse cx="42" cy="30" rx="3" ry="3.8" fill="${INK}"/><ellipse cx="58" cy="30" rx="3" ry="3.8" fill="${INK}"/>`,
      nose: `<path d="M40,38 Q50,50 60,38 Q56,48 50,50 Q44,48 40,38 Z" fill="${a.accent}"/><polygon points="46,43 54,43 50,47" fill="${INK}"/>`,
      mouth: `<path d="M44,52 Q50,55 56,52" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    }),
    bear: (a) => ({
      body: `<circle cx="50" cy="36" r="19" fill="${a.body}"/><ellipse cx="50" cy="64" rx="29" ry="26" fill="${a.body}"/><ellipse cx="50" cy="72" rx="15" ry="14" fill="${a.accent}"/>`,
      legs: `<rect x="33" y="88" width="11" height="11" rx="5" fill="${a.body}"/><rect x="56" y="88" width="11" height="11" rx="5" fill="${a.body}"/>`,
      arms: `<circle cx="16" cy="58" r="8" fill="${a.body}"/><circle cx="84" cy="58" r="8" fill="${a.body}"/>`,
      ears: `<circle cx="30" cy="18" r="10" fill="${a.body}"/><circle cx="30" cy="18" r="4.5" fill="${a.accent}"/><circle cx="70" cy="18" r="10" fill="${a.body}"/><circle cx="70" cy="18" r="4.5" fill="${a.accent}"/>`,
      tail: `<circle cx="88" cy="70" r="4" fill="${a.body}" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>`,
      eyes: `<circle cx="43" cy="32" r="2.6" fill="${INK}"/><circle cx="57" cy="32" r="2.6" fill="${INK}"/>`,
      nose: `<circle cx="50" cy="42" r="11" fill="${a.accent}"/><ellipse cx="50" cy="38" rx="3.5" ry="2.6" fill="${INK}"/>`,
      mouth: `<path d="M44,46 Q50,50 56,46" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    }),
    rabbit: (a) => ({
      body: `<circle cx="50" cy="36" r="17" fill="${a.body}"/><ellipse cx="50" cy="62" rx="25" ry="26" fill="${a.body}"/><ellipse cx="50" cy="70" rx="13" ry="14" fill="${a.accent}"/>`,
      legs: `<rect x="35" y="86" width="9" height="12" rx="4" fill="${a.body}"/><rect x="56" y="86" width="9" height="12" rx="4" fill="${a.body}"/>`,
      arms: `<ellipse cx="19" cy="58" rx="7" ry="5" fill="${a.body}" transform="rotate(20 19 58)"/><ellipse cx="81" cy="58" rx="7" ry="5" fill="${a.body}" transform="rotate(-20 81 58)"/>`,
      ears: `<ellipse cx="38" cy="17" rx="6.5" ry="16" fill="${a.body}"/><ellipse cx="38" cy="18" rx="3" ry="12" fill="${a.accent}"/><ellipse cx="62" cy="17" rx="6.5" ry="16" fill="${a.body}"/><ellipse cx="62" cy="18" rx="3" ry="12" fill="${a.accent}"/>`,
      tail: `<circle cx="82" cy="66" r="7" fill="${a.accent}"/>`,
      eyes: `<circle cx="43" cy="34" r="3" fill="${INK}"/><circle cx="57" cy="34" r="3" fill="${INK}"/>`,
      nose: `<ellipse cx="50" cy="40" rx="2.6" ry="2" fill="#e78ba0"/>`,
      mouth: `<rect x="46.5" y="42" width="3.2" height="6" fill="#fff" stroke="#d8d8d8" stroke-width="0.5"/><rect x="50.3" y="42" width="3.2" height="6" fill="#fff" stroke="#d8d8d8" stroke-width="0.5"/><line x1="38" y1="39" x2="26" y2="36" stroke="${INK}" stroke-width="1"/><line x1="38" y1="42" x2="26" y2="44" stroke="${INK}" stroke-width="1"/><line x1="62" y1="39" x2="74" y2="36" stroke="${INK}" stroke-width="1"/><line x1="62" y1="42" x2="74" y2="44" stroke="${INK}" stroke-width="1"/>`,
    }),
    owl: (a) => ({
      body: `<ellipse cx="50" cy="64" rx="25" ry="27" fill="${a.body}"/><circle cx="50" cy="35" r="19" fill="${a.accent}"/>`,
      legs: `<ellipse cx="41" cy="95" rx="4" ry="3" fill="#d9a441"/><ellipse cx="59" cy="95" rx="4" ry="3" fill="#d9a441"/>`,
      arms: `<path d="M25,50 Q10,64 21,84 Q30,76 28,54 Z" fill="${a.body}"/><path d="M75,50 Q90,64 79,84 Q70,76 72,54 Z" fill="${a.body}"/>`,
      ears: `<polygon points="34,18 28,2 40,14" fill="${a.body}"/><polygon points="66,18 72,2 60,14" fill="${a.body}"/>`,
      tail: `<path d="M40,88 L50,100 L60,88 Z" fill="${a.body}" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>`,
      eyes: `<circle cx="40" cy="34" r="9" fill="#fff"/><circle cx="40" cy="34" r="5" fill="${INK}"/><circle cx="60" cy="34" r="9" fill="#fff"/><circle cx="60" cy="34" r="5" fill="${INK}"/>`,
      nose: `<polygon points="46,42 54,42 50,49" fill="#d9a441"/>`,
      mouth: `<path d="M44,50 Q50,54 56,50" stroke="${a.accent}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    }),
  };

  function animalSvg(key, partsShown) {
    const a = ANIMALS[key];
    const parts = ANIMAL_PARTS[key](a);
    const has = (p) => partsShown.includes(p);
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${PART_ORDER.map((p) => (has(p) ? `<g class="rw-part">${parts[p]}</g>` : "")).join("")}
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

  let chimeCtx = null;
  function getChimeContext() {
    if (!chimeCtx) chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (chimeCtx.state === 'suspended') chimeCtx.resume();
    return chimeCtx;
  }

  function chime(tier) {
    try {
      const ctx = getChimeContext();
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

  // onDone fires exactly once, however the modal closes (auto-timeout, the
  // "Keep going!" button, or a backdrop click) - this is what drives the
  // auto-advance-to-next-stage hook, so it can't only live on the timeout.
  function showCelebration(key, tier, onDone) {
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
    }
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      backdrop.classList.remove("show");
      if (onDone) onDone();
    };
    backdrop.querySelector("#reward-modal-btn").onclick = dismiss;
    backdrop.onclick = (e) => { if (e.target === backdrop) dismiss(); };
    backdrop.querySelector("#reward-modal-animal").innerHTML = animalSvg(key, PART_ORDER);
    backdrop.querySelector("#reward-modal-title").textContent = msg.title;
    backdrop.querySelector("#reward-modal-body").textContent = msg.body;
    backdrop.classList.add("show");
    confettiBurst(Math.min(tier, 2) === 2 ? 0 : Math.min(tier, 2) === 1 ? 1 : 2); // tier 0 = biggest burst
    chime(2 - Math.min(tier, 2));
    setTimeout(dismiss, tier === 0 ? 2600 : tier === 1 ? 1800 : 1200);
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
        backdrop.remove();
        onChosen(key);
      };
    });
  }

  let sessionParts = 0;
  let chosenAnimal = null;
  let ready = false;
  let pendingCorrect = 0;
  let animalCompleteCallback = null;

  function withAnimal(cb) {
    if (chosenAnimal) return cb(chosenAnimal);
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
      showCelebration(key, tier, animalCompleteCallback || undefined);
      completions[gameId] = Math.min(tier + 1, 3);
      saveCompletions(completions);
      sessionParts = 0;
    }
  }

  // Ask which animal before the first question is answered, not lazily on
  // the first correct() call - withAnimal() itself is a no-op once a choice
  // has already been made or the picker is already open, so this is safe
  // to call unconditionally. Called directly (not deferred to
  // DOMContentLoaded) because this script tag is always placed after the
  // game's own markup, so document.body already exists by this point.
  withAnimal(() => {});

  window.RewardSystem = {
    correct() {
      if (!chosenAnimal) {
        pendingCorrect++;
        withAnimal(() => {});
        return;
      }
      applyCorrect(chosenAnimal);
    },
    // Register a callback that fires once an animal completes (after its
    // celebration modal closes, however it closes). Intended use: advance
    // the game's own difficulty stage, e.g.
    //   RewardSystem.onAnimalComplete(() => { if (currentStage < 3) setStage(currentStage + 1); });
    onAnimalComplete(callback) {
      animalCompleteCallback = callback;
    },
  };
})();
