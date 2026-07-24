/*
 * Pupil login + practice tracking, shared across every Nugget.
 *
 * Integration is: one <script src="auth.js"></script> tag (before
 * reward-system.js), plus one Tracking.logAnswer(...) call next to the
 * existing RewardSystem.correct() call, plus one more next to the
 * wrong-answer branch. Nothing else to wire up — this module injects its
 * own full-screen "Who's playing?" overlay and auto-detects the game the
 * same way reward-system.js does.
 *
 * Requires Firebase config below to be filled in (see README note at the
 * bottom of this file). Until then, every game plays exactly as before —
 * no picker, no tracking — so a half-finished setup never blocks a lesson.
 *
 * Roster (pupils + their PINs) is managed directly in the Firebase console,
 * not from the app — see the plan doc for why. A pupil not in the roster
 * simply won't appear in the picker.
 */
(function () {
  // ---- Firebase config — replace with your project's values ----
  // Firebase console → Project settings → General → Your apps → SDK setup and configuration.
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA0s3yaWHQyNDkTcCG8RrmuO3v61BMeKZQ",
    authDomain: "nuggets-tracking.firebaseapp.com",
    projectId: "nuggets-tracking",
  };

  const STORAGE_SESSION = "tga_pupil_session";
  const configured = FIREBASE_CONFIG.apiKey !== "PASTE_YOUR_API_KEY";

  let db = null;
  if (configured && window.firebase) {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
  }

  function currentGameId() {
    const file = location.pathname.split("/").pop() || "game";
    return file.replace(/\.html?$/i, "");
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SESSION));
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  }

  function ensureStyles() {
    if (document.getElementById("auth-system-styles")) return;
    const style = document.createElement("style");
    style.id = "auth-system-styles";
    style.textContent = `
      #auth-backdrop {
        position: fixed; inset: 0; background: rgba(40,30,20,0.45);
        display: flex; align-items: center; justify-content: center;
        z-index: 10001; font-family: 'Trebuchet MS','Segoe UI',sans-serif;
      }
      #auth-card {
        background: #fffdf6; border-radius: 24px; padding: 28px 30px;
        text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        max-width: 340px; width: 90%;
      }
      #auth-card h2 { margin: 0 0 4px; font-size: 20px; color: #4a3728; }
      #auth-card p.auth-sub { margin: 0 0 18px; font-size: 13px; color: #6b5745; }
      #auth-names { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
      #auth-names button {
        appearance: none; border: 3px solid transparent; cursor: pointer;
        background: #f6f2e8; border-radius: 16px; padding: 12px 16px;
        font-family: inherit; font-size: 15px; font-weight: 800; color: #4a3728;
        min-width: 84px;
      }
      #auth-names button:hover { border-color: #f4c542; }
      #auth-pin-dots { display: flex; gap: 12px; justify-content: center; margin: 4px 0 20px; }
      .auth-pin-dot {
        width: 16px; height: 16px; border-radius: 50%; background: #e5ddc8;
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .auth-pin-dot.filled { background: #4a9d5f; transform: scale(1.15); }
      #auth-pin-dots.auth-shake { animation: auth-shake 0.4s ease; }
      @keyframes auth-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
      }
      #auth-keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      #auth-keypad button {
        appearance: none; border: none; cursor: pointer; font-family: inherit;
        font-size: 20px; font-weight: 800; color: #4a3728; padding: 14px 0;
        border-radius: 14px; background: #f6f2e8;
      }
      #auth-keypad button:active { background: #efe7d6; }
      #auth-back-link {
        display: inline-block; margin-top: 14px; font-size: 12px; color: #8a7660;
        cursor: pointer; text-decoration: underline;
      }
      #auth-error { color: #c0392b; font-size: 13px; margin: 0 0 14px; }
      #auth-guest-btn {
        margin-top: 16px; appearance: none; border: none; cursor: pointer;
        font-family: inherit; font-size: 13px; font-weight: 700; color: #6b5745;
        background: none; text-decoration: underline;
      }
      #auth-badge {
        position: fixed; top: 16px; right: 16px; z-index: 9997;
        background: #fffdf6; border-radius: 999px; padding: 8px 14px;
        box-shadow: 0 4px 0 rgba(90,60,30,0.12), 0 6px 12px rgba(90,60,30,0.1);
        font-family: 'Trebuchet MS','Segoe UI',sans-serif;
        font-weight: 800; font-size: 14px; color: #4a3728;
        cursor: pointer; display: flex; align-items: center; gap: 6px;
        border: none; appearance: none;
      }
      #auth-badge:active { transform: translateY(1px); }
      #auth-logout-confirm {
        position: fixed; top: 16px; right: 16px; z-index: 9997;
        background: #fffdf6; border-radius: 20px; padding: 14px 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        font-family: 'Trebuchet MS','Segoe UI',sans-serif; text-align: center;
      }
      #auth-logout-confirm p { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #4a3728; }
      #auth-logout-buttons { display: flex; gap: 8px; justify-content: center; }
      #auth-logout-buttons button {
        appearance: none; border: none; cursor: pointer; font-family: inherit;
        font-weight: 800; font-size: 13px; padding: 8px 14px; border-radius: 12px;
      }
      #auth-logout-yes { background: #c0392b; color: #fff; }
      #auth-logout-no { background: #f6f2e8; color: #4a3728; }
    `;
    document.head.appendChild(style);
  }

  function removeOverlay() {
    const el = document.getElementById("auth-backdrop");
    if (el) el.remove();
  }

  function renderPinPad(pupil, onSuccess, onBack) {
    const card = document.getElementById("auth-card");
    let entered = "";
    card.innerHTML = `
      <h2>Hi ${pupil.firstName}! 👋</h2>
      <p class="auth-sub">Enter your PIN</p>
      <div id="auth-pin-dots">
        ${[0, 1, 2, 3].map(() => `<div class="auth-pin-dot"></div>`).join("")}
      </div>
      <div id="auth-keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "OK"].map((k) => `<button data-key="${k}">${k}</button>`).join("")}
      </div>
      <div id="auth-back-link">Not you?</div>
    `;
    const dots = card.querySelectorAll(".auth-pin-dot");
    const dotsWrap = card.querySelector("#auth-pin-dots");

    function updateDots() {
      dots.forEach((d, i) => d.classList.toggle("filled", i < entered.length));
    }

    function tryVerify() {
      if (entered === String(pupil.pin)) {
        saveSession({ id: pupil.id, firstName: pupil.firstName, pin: pupil.pin });
        onSuccess();
      } else {
        dotsWrap.classList.add("auth-shake");
        setTimeout(() => dotsWrap.classList.remove("auth-shake"), 400);
        entered = "";
        updateDots();
      }
    }

    card.querySelector("#auth-keypad").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-key]");
      if (!btn) return;
      const key = btn.getAttribute("data-key");
      if (key === "⌫") {
        entered = entered.slice(0, -1);
        updateDots();
      } else if (key === "OK") {
        if (entered.length === 4) tryVerify();
      } else if (entered.length < 4) {
        entered += key;
        updateDots();
        if (entered.length === 4) setTimeout(tryVerify, 120);
      }
    });

    card.querySelector("#auth-back-link").addEventListener("click", onBack);
  }

  function renderNamePicker(pupils, onChosen) {
    const card = document.getElementById("auth-card");
    card.innerHTML = `
      <h2>Who's playing? 🎵</h2>
      <p class="auth-sub">Pick your name</p>
      <div id="auth-names">
        ${pupils.map((p) => `<button data-id="${p.id}">${p.firstName}</button>`).join("")}
      </div>
      <button id="auth-guest-btn">Play without saving progress</button>
    `;
    card.querySelector("#auth-names").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const pupil = pupils.find((p) => p.id === btn.getAttribute("data-id"));
      renderPinPad(
        pupil,
        () => {
          removeOverlay();
          onChosen();
        },
        () => renderNamePicker(pupils, onChosen)
      );
    });
    card.querySelector("#auth-guest-btn").addEventListener("click", () => {
      removeOverlay();
      onChosen();
    });
  }

  function showOverlay(inner) {
    ensureStyles();
    let backdrop = document.getElementById("auth-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "auth-backdrop";
      backdrop.innerHTML = `<div id="auth-card"></div>`;
      document.body.appendChild(backdrop);
    }
    inner();
  }

  function showConnectionError(onContinue) {
    showOverlay(() => {
      const card = document.getElementById("auth-card");
      card.innerHTML = `
        <h2>Couldn't connect 🔌</h2>
        <p id="auth-error">Progress won't be saved this time — check the internet connection when you get a chance.</p>
        <button id="auth-guest-btn" style="text-decoration:none;background:#4a9d5f;color:#fff;padding:10px 20px;border-radius:14px;font-weight:800;">Play anyway</button>
      `;
      card.querySelector("#auth-guest-btn").addEventListener("click", () => {
        removeOverlay();
        onContinue();
      });
    });
  }

  function showPicker(onDone) {
    showOverlay(() => {
      const card = document.getElementById("auth-card");
      card.innerHTML = `<h2>Loading… 🎵</h2>`;
    });
    db.collection("pupils")
      .get()
      .then((snap) => {
        const pupils = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, firstName: data.firstName || data.firstname };
        });
        renderNamePicker(pupils, onDone);
      })
      .catch(() => showConnectionError(onDone));
  }

  function removeBadge() {
    const badge = document.getElementById("auth-badge");
    if (badge) badge.remove();
    const confirm = document.getElementById("auth-logout-confirm");
    if (confirm) confirm.remove();
  }

  function showBadge() {
    ensureStyles();
    const session = loadSession();
    removeBadge();
    if (!session) return; // guest — nothing to show/log out of
    const badge = document.createElement("button");
    badge.id = "auth-badge";
    badge.innerHTML = `👤 ${session.firstName}`;
    badge.addEventListener("click", showLogoutConfirm);
    document.body.appendChild(badge);
  }

  function showLogoutConfirm() {
    const session = loadSession();
    if (!session) return;
    const badge = document.getElementById("auth-badge");
    if (badge) badge.remove();
    const box = document.createElement("div");
    box.id = "auth-logout-confirm";
    box.innerHTML = `
      <p>Log out ${session.firstName}?</p>
      <div id="auth-logout-buttons">
        <button id="auth-logout-yes">Log out</button>
        <button id="auth-logout-no">Cancel</button>
      </div>
    `;
    document.body.appendChild(box);
    box.querySelector("#auth-logout-yes").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_SESSION);
      location.reload();
    });
    box.querySelector("#auth-logout-no").addEventListener("click", () => {
      box.remove();
      showBadge();
    });
  }

  function ensureLogin(onReady) {
    if (!configured || !db) {
      onReady();
      return;
    }
    if (loadSession()) {
      showBadge();
      onReady();
      return;
    }
    showPicker(() => {
      showBadge();
      onReady();
    });
  }

  window.Tracking = {
    currentPupil() {
      return loadSession();
    },
    logAnswer({ correct, stage, meta }) {
      if (!configured || !db) return;
      const session = loadSession();
      if (!session) return; // guest — playing without saving progress
      db.collection("pupils")
        .doc(session.id)
        .collection("events")
        .add({
          game: currentGameId(),
          stage: stage || null,
          correct: !!correct,
          meta: meta || null,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .catch(() => {
          /* fire-and-forget — a dropped log shouldn't interrupt play */
        });
    },
  };

  ensureLogin(() => {});
})();

/*
 * Setup checklist for Andrew:
 * 1. Create a free Firebase project at console.firebase.google.com, enable Firestore.
 * 2. Project settings → General → add a Web app → copy the config values into
 *    FIREBASE_CONFIG above (apiKey, authDomain, projectId).
 * 3. Firestore → Rules → paste in the contents of firestore.rules (repo root).
 * 4. Firestore → Data → create a `pupils` collection; add one document per
 *    pupil with fields: firstName (string), pin (string, 4 digits).
 * 5. Add the Firebase SDK script tags to each game's <head>, before auth.js:
 *      <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
 *      <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
 */
