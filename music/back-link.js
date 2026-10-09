/*
 * Shared "back to arcade" link for every Tiny Games Arcade music nugget.
 *
 * Integration is just one <script src="back-link.js"></script> tag -
 * nothing else to wire up. Injects a small fixed pill button, top-left
 * (auth.js's pupil badge already owns top-right), that navigates back to
 * the arcade (arcade.html = published games only; music_arcade.html = every game, for
 * teacher/testing devices). Pairs with the arcade opening games in the
 * same tab (no target="_blank") so this button is a real way back, not a
 * second tab to close.
 */
(function () {
  // Which arcade to return to: the public one (published games only) for everyone, the full one on a
  // teacher/testing device (pupil login switched on, or opened once with ?all=1).
  function teacherDevice() {
    try {
      const q = new URLSearchParams(location.search).get("all");
      if (q === "1") localStorage.setItem("tga_show_all", "1");
      if (q === "0") localStorage.removeItem("tga_show_all");
      return localStorage.getItem("tga_show_all") === "1" || localStorage.getItem("tga_pupil_mode") === "1" || !!localStorage.getItem("tga_pupil_session");
    } catch (e) { return false; }
  }
  window.ARCADE_URL = teacherDevice() ? "music_arcade.html" : "arcade.html";

  // Layout lanes. The Arcade pill (top-left) and the reward animal + stars (bottom corners) are fixed on screen, so on
  // phones and tablets they sat on top of the score chips and the answer buttons. Reserve a lane for them instead.
  (function reserveLanes() {
    const st = document.createElement("style");
    st.id = "layout-lanes";
    st.textContent = `
      /* tablets and small laptops: keep a bottom lane clear for the animal and the stars */
      @media (max-width: 1100px) and (min-width: 701px) { body { padding-bottom: calc(clamp(96px, 20vw, 240px) + 40px) !important; } }
      /* laptops: a lane down the right edge holds the animal with the stars just above it, so a wide game card
         (e.g. Alphabet Elevator's side-by-side layout) never slides underneath either of them */
      @media (min-width: 1101px) and (max-width: 1700px) {
        body { padding-right: calc(clamp(96px, 20vw, 240px) + 32px) !important; }
        #game-progress-widget { left: auto !important; right: 16px !important; bottom: calc(clamp(96px, 20vw, 240px) + 30px) !important; }
      }
      /* phones: everything fixed lives in a lane along the TOP (Arcade pill, stars, animal), so nothing covers the answers */
      @media (max-width: 700px) {
        body { padding-top: 84px !important; padding-bottom: 16px !important; }
        #reward-widget { top: 10px !important; bottom: auto !important; right: 10px !important; width: 68px !important; height: 68px !important; border-radius: 20px !important; border-width: 3px !important; }
        body:has(#auth-badge) #reward-widget { right: 112px !important; }   /* teacher devices: the pupil's name badge keeps the far corner */
        #game-progress-widget { top: 14px !important; bottom: auto !important; left: 112px !important; padding: 4px 10px !important; }
        #game-progress-widget .gp-pip { font-size: 13px !important; }
        #game-progress-widget .gp-label { font-size: 9px !important; }
      }
      /* the stage-complete / game-over card used to be squeezed into the small drawing area and spill out of it */
      #overlay { position: fixed !important; inset: 0 !important; z-index: 10020 !important; border-radius: 0 !important; overflow-y: auto; }
    `;
    document.head.appendChild(st);
  })();

  function ensureStyles() {
    if (document.getElementById("back-link-styles")) return;
    const style = document.createElement("style");
    style.id = "back-link-styles";
    style.textContent = `
      #back-link-badge {
        position: fixed; top: 16px; left: 16px; z-index: 10010;
        background: #fffdf6; border-radius: 999px; padding: 8px 14px;
        box-shadow: 0 4px 0 rgba(90,60,30,0.12), 0 6px 12px rgba(90,60,30,0.1);
        font-family: 'Trebuchet MS','Segoe UI',sans-serif;
        font-weight: 800; font-size: 14px; color: #4a3728;
        cursor: pointer; display: flex; align-items: center; gap: 6px;
        border: none; appearance: none; text-decoration: none;
      }
      #back-link-badge:active { transform: translateY(1px); }
    `;
    document.head.appendChild(style);
  }

  function ensureBadge() {
    if (document.getElementById("back-link-badge")) return;
    ensureStyles();
    const link = document.createElement("a");
    link.id = "back-link-badge";
    link.href = window.ARCADE_URL;
    link.innerHTML = "⬅️ Arcade";
    document.body.appendChild(link);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureBadge);
  } else {
    ensureBadge();
  }
})();
