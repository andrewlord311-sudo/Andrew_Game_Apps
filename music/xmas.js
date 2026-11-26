/*
 * The arcade's Christmas look: snow, Santa hats on Melody and Barnaby, red-and-green bunting, a wintry sky,
 * and a Christmas tile at the top linking to the Christmas music activities.
 * Switches itself on from 1 to 26 December (UK date) and off again afterwards, every year: nothing to remember.
 * Preview any time with ?xmas=1 (and ?xmas=0 to see the normal look). Load it after arcade-core.js.
 */
(function () {
  const q = new URLSearchParams(location.search).get("xmas");
  let month, day;
  try { const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", month: "numeric", day: "numeric" }).formatToParts(new Date()).map(x => [x.type, x.value])); month = +p.month; day = +p.day; }
  catch (e) { const d = new Date(); month = d.getMonth() + 1; day = d.getDate(); }
  const inSeason = month === 12 && day <= 26;
  if (q === "0" || (!inSeason && q !== "1")) return;

  const css = document.createElement("style");
  css.textContent = `
    body.xmas { background: radial-gradient(circle at 50% 0%, #ffffff 0%, #e0f2fe 45%, #bae6fd 100%) !important; }
    body.xmas .card { border-color: #fecaca; }
    #xmas-snow { position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden; }
    #xmas-snow i { position: absolute; top: -14px; color: #fff; text-shadow: 0 0 4px rgba(56,120,190,.55); font-style: normal; animation: xmas-fall linear infinite; }
    @keyframes xmas-fall { to { transform: translateY(105vh) rotate(200deg); } }
    @media (prefers-reduced-motion: reduce) { #xmas-snow { display: none; } }
    .xmas-tile { display: flex; align-items: center; gap: 18px; text-decoration: none; margin: 0 auto 40px; max-width: 900px; padding: 18px 24px;
                 background: linear-gradient(135deg, #2e2a6b, #3d3a86); color: #fff; border-radius: 26px; box-shadow: 0 10px 0 rgba(46,42,107,.25); transition: transform .15s; }
    .xmas-tile:hover { transform: translateY(-4px); }
    .xmas-tile .e { font-size: 56px; line-height: 1; }
    .xmas-tile b { display: block; font-family: 'Fredoka One', cursive; font-weight: normal; font-size: 28px; color: #ffd25a; }
    .xmas-tile span { font-size: 16px; font-weight: 700; opacity: .92; }
    .xmas-tile .go { margin-left: auto; background: #c8102e; font-family: 'Fredoka One', cursive; font-size: 20px; padding: 10px 20px; border-radius: 40px; white-space: nowrap; box-shadow: 0 4px 0 rgba(0,0,0,.25); }
    @media (max-width: 640px) { .xmas-tile { flex-wrap: wrap; } .xmas-tile .go { margin-left: 0; } }`;
  document.head.appendChild(css);
  document.body.classList.add("xmas");

  // snow
  const sn = document.createElement("div"); sn.id = "xmas-snow";
  sn.innerHTML = Array.from({ length: 34 }, () => { const s = 10 + Math.random() * 16;
    return `<i style="left:${(Math.random() * 100).toFixed(1)}%;font-size:${s.toFixed(0)}px;opacity:${(0.5 + Math.random() * 0.5).toFixed(2)};animation-duration:${(9 + Math.random() * 12).toFixed(1)}s;animation-delay:-${(Math.random() * 20).toFixed(1)}s">❄</i>`; }).join("");
  document.body.appendChild(sn);

  // red, green and gold bunting
  const COLS = ["#c8102e", "#1f7a4d", "#f59e0b"];
  document.querySelectorAll("span[class*='border-t-']").forEach((b, i) => { b.style.borderTopColor = COLS[i % 3]; });

  // a Christmas tile above the games
  const grid = document.getElementById("games-grid");
  if (grid) {
    const a = document.createElement("a"); a.className = "xmas-tile"; a.href = "christmas/";
    a.innerHTML = `<div class="e">🎄</div><div><b>Christmas music activities</b><span>Play Jingle Bells with five fingers · Name That Carol · the nativity advent calendar</span></div><div class="go">Let's go ▶</div>`;
    grid.parentNode.insertBefore(a, grid);
  }

  // Santa hats on Melody and Barnaby (the same hat as the advent calendar and the Christmas videos)
  const HAT = `<g transform="translate(50 6) rotate(-8)"><path d="M-27,12 C-22,-12 6,-30 30,-26 L27,-16 C16,-16 12,-6 27,12 Z" fill="#e8392c" stroke="#2b2250" stroke-width="2.3" stroke-linejoin="round"/><rect x="-31" y="6" width="62" height="13" rx="6.5" fill="#fff" stroke="#2b2250" stroke-width="2.3"/><circle cx="31" cy="-25" r="7" fill="#fff" stroke="#2b2250" stroke-width="2.3"/></g>`;
  let tries = 0;
  (function hats() {
    const svgs = [...document.querySelectorAll("header .mascot-bounce svg")];
    if (!svgs.length && tries++ < 40) return setTimeout(hats, 100);
    svgs.forEach(s => { if (s.dataset.hat) return; s.dataset.hat = "1"; s.style.overflow = "visible"; s.insertAdjacentHTML("beforeend", HAT); });
  })();
})();
