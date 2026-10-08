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
