/*
 * Shared "finish the game" layer for every Tiny Games Arcade music nugget —
 * sits alongside reward-system.js and auth.js as a third independent
 * self-injecting module. Integration is a single line: inside the game's
 * existing `triggerStageComplete()` (the streak-based "you cleared this
 * stage" overlay every game already has), add
 * `GameProgress.stageCleared(currentStage);` — nothing else to wire up.
 *
 * Mechanic: a game is "complete" once every one of its stages has been
 * cleared at least once (reusing each game's own existing stage-complete
 * trigger as the checkpoint, not a new difficulty gate — stages stay freely
 * selectable same as today). Unlike the reward animal, this progress is
 * real and persists per game in localStorage, so a child can see how much
 * further there is to go across separate sessions. music_arcade.html reads
 * the same storage to show a completion badge on each game's tile.
 *
 * Almost every game has 3 stages, so that's the default - but it's not
 * assumed: pass the real count as a second argument for any game that
 * differs, e.g. `GameProgress.stageCleared(currentStage, 2);` for a
 * 2-stage game. Get this wrong and the game can simply never show as
 * "complete", since the stage count it never reaches stays uncleared
 * forever - there's no way to detect that from stageCleared() calls alone.
 *
 * That second argument only takes effect once a stage has actually been
 * cleared once, which is too late for the very first load's widget (a
 * brand-new pupil would see "0/3" flash briefly on a 2-stage game). For
 * games that differ from the default, also set
 * `window.GP_TOTAL_STAGES = 2;` in an inline <script> before this file's
 * <script> tag, so the very first render already knows the true count.
 */
(function () {
  const STORAGE_KEY = "tga_game_progress";
  const DEFAULT_TOTAL_STAGES = 3;

  function currentGameId() {
    const file = location.pathname.split("/").pop() || "game";
    return file.replace(/\.html?$/i, "");
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveProgress(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  function entryFor(progress, gameId) {
    return (
      progress[gameId] || {
        stagesCleared: [],
        totalStages: window.GP_TOTAL_STAGES || DEFAULT_TOTAL_STAGES,
        completed: false,
        completedAt: null,
      }
    );
  }

  function ensureStyles() {
    if (document.getElementById("game-progress-styles")) return;
    const style = document.createElement("style");
    style.id = "game-progress-styles";
    style.textContent = `
      #game-progress-widget {
        position: fixed; left: 16px; bottom: 16px; z-index: 9998;
        display: flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.92); border-radius: 999px;
        padding: 8px 14px; box-shadow: 0 6px 0 rgba(30,41,59,0.12), 0 10px 18px rgba(30,41,59,0.1);
        border: 3px solid rgba(255,255,255,0.8);
        font-family: 'Trebuchet MS','Segoe UI',sans-serif;
        pointer-events: none;
      }
      #game-progress-widget .gp-pip { font-size: 20px; line-height: 1; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
      #game-progress-widget .gp-pip.gp-filled { animation: gp-pop .4s cubic-bezier(.34,1.56,.64,1); }
      @keyframes gp-pop { from { transform: scale(0.3); } to { transform: scale(1); } }
      #game-progress-widget .gp-label { font-size: 11px; font-weight: 800; color: #4a3728; }

      #game-complete-backdrop {
        position: fixed; inset: 0; background: rgba(40,30,20,0.4);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; opacity: 0; pointer-events: none; transition: opacity .25s ease;
      }
      #game-complete-backdrop.show { opacity: 1; pointer-events: auto; }
      #game-complete-modal {
        background: #fffdf6; border-radius: 24px; padding: 30px 34px 26px;
        text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        transform: scale(0.85); transition: transform .25s ease;
        font-family: 'Trebuchet MS','Segoe UI',sans-serif; max-width: 280px;
      }
      #game-complete-backdrop.show #game-complete-modal { transform: scale(1); }
      #game-complete-modal .gp-trophy { font-size: 56px; line-height: 1; margin-bottom: 6px; }
      #game-complete-modal h2 { margin: 4px 0 2px; font-size: 22px; color: #4a3728; }
      #game-complete-modal p { margin: 0 0 16px; font-size: 14px; color: #6b5745; }
      #game-complete-modal button {
        appearance: none; border: none; cursor: pointer; font-family: inherit;
        font-size: 14px; font-weight: 800; color: #fff; padding: 10px 22px;
        border-radius: 14px; background: linear-gradient(180deg,#eab308,#ca8a04);
        box-shadow: 0 4px 0 rgba(0,0,0,0.18);
      }

      #game-progress-confetti { position: fixed; inset: 0; pointer-events: none; z-index: 10000; }
      .gp-confetti { position: fixed; width: 8px; height: 8px; border-radius: 2px;
        animation: gp-confetti 900ms ease-out forwards; }
      @keyframes gp-confetti {
        to { transform: translate(var(--dx), var(--dy)) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureWidget() {
    let widget = document.getElementById("game-progress-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.id = "game-progress-widget";
      document.body.appendChild(widget);
    }
    return widget;
  }

  function renderWidget(stagesCleared, totalStages) {
    ensureStyles();
    const widget = ensureWidget();
    const pips = [];
    for (let s = 1; s <= totalStages; s++) {
      const filled = stagesCleared.includes(s);
      pips.push(`<span class="gp-pip${filled ? " gp-filled" : ""}">${filled ? "⭐" : "☆"}</span>`);
    }
    widget.innerHTML = `${pips.join("")}<span class="gp-label">${stagesCleared.length}/${totalStages} stages</span>`;
  }

  function confettiBurst() {
    ensureStyles();
    const holder = document.createElement("div");
    holder.id = "game-progress-confetti";
    document.body.appendChild(holder);
    const colors = ["#eab308", "#f43f5e", "#3b82f6", "#10b981", "#a855f7"];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("div");
      p.className = "gp-confetti";
      const angle = Math.random() * Math.PI * 2;
      const distance = 110 + Math.random() * 180;
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
  function chime() {
    try {
      if (!chimeCtx) chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (chimeCtx.state === "suspended") chimeCtx.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // bigger fanfare than a single stage-clear
      notes.forEach((freq, i) => {
        const osc = chimeCtx.createOscillator();
        const gain = chimeCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, chimeCtx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, chimeCtx.currentTime + i * 0.12 + 0.35);
        osc.connect(gain).connect(chimeCtx.destination);
        osc.start(chimeCtx.currentTime + i * 0.12);
        osc.stop(chimeCtx.currentTime + i * 0.12 + 0.35);
      });
    } catch {
      /* Web Audio unavailable — celebration still shows visually, just silent. */
    }
  }

  function showGameCompleteModal(totalStages) {
    ensureStyles();
    let backdrop = document.getElementById("game-complete-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "game-complete-backdrop";
      backdrop.innerHTML = `<div id="game-complete-modal">
        <div class="gp-trophy">🏆</div>
        <h2>Game Complete!</h2>
        <p id="game-complete-msg"></p>
        <button id="game-complete-btn">Keep playing</button>
      </div>`;
      document.body.appendChild(backdrop);
      backdrop.querySelector("#game-complete-btn").onclick = () => backdrop.classList.remove("show");
      backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.classList.remove("show"); };
    }
    backdrop.querySelector("#game-complete-msg").textContent =
      `You've cleared all ${totalStages} stage${totalStages === 1 ? "" : "s"}. Amazing work!`;
    backdrop.classList.add("show");
    confettiBurst();
    chime();
  }

  function stageCleared(stageNum, totalStages = DEFAULT_TOTAL_STAGES) {
    if (stageNum < 1 || stageNum > totalStages) return;
    const progress = loadProgress();
    const gameId = currentGameId();
    const entry = entryFor(progress, gameId);
    entry.totalStages = totalStages;
    if (!entry.stagesCleared.includes(stageNum)) {
      entry.stagesCleared = [...entry.stagesCleared, stageNum].sort();
    }
    renderWidget(entry.stagesCleared, totalStages);
    const nowComplete = entry.stagesCleared.length >= totalStages;
    if (nowComplete && !entry.completed) {
      entry.completed = true;
      entry.completedAt = new Date().toISOString();
      showGameCompleteModal(totalStages);
    }
    progress[gameId] = entry;
    saveProgress(progress);
  }

  function init() {
    const progress = loadProgress();
    const entry = entryFor(progress, currentGameId());
    renderWidget(entry.stagesCleared, entry.totalStages || DEFAULT_TOTAL_STAGES);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GameProgress = {
    stageCleared,
    getSummary() {
      return loadProgress();
    },
  };
})();
