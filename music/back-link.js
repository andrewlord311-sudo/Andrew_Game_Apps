/*
 * Shared "back to arcade" link for every Tiny Games Arcade music nugget.
 *
 * Integration is just one <script src="back-link.js"></script> tag -
 * nothing else to wire up. Injects a small fixed pill button, top-left
 * (auth.js's pupil badge already owns top-right), that navigates back to
 * music_arcade.html. Pairs with music_arcade.html opening games in the
 * same tab (no target="_blank") so this button is a real way back, not a
 * second tab to close.
 */
(function () {
  function ensureStyles() {
    if (document.getElementById("back-link-styles")) return;
    const style = document.createElement("style");
    style.id = "back-link-styles";
    style.textContent = `
      #back-link-badge {
        position: fixed; top: 16px; left: 16px; z-index: 9997;
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
    link.href = "music_arcade.html";
    link.innerHTML = "⬅️ Arcade";
    document.body.appendChild(link);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureBadge);
  } else {
    ensureBadge();
  }
})();
