/* The five reward animals (cat, fox, bear, rabbit, owl), redrawn 8 Oct 2026.
 *
 * Same contract as the old reward-system.js: each animal is split into eight parts, revealed in this order as a
 * child answers correctly - body, legs, arms, ears, tail, eyes, nose, mouth. animalSvg(key, partsShown) returns an
 * <svg viewBox="0 0 100 100">.
 *
 * Style (matches Melody and Barnaby): chunky chibi proportions (big head, small body), one warm dark outline,
 * flat colour + one soft shadow tone + small highlights, rosy cheeks, big glossy eyes. Each species has its own
 * silhouette, markings and face so they are different at a glance, not one blob with different ears.
 */
(function () {
  const INK = "#44291c";          // the outline colour, everywhere
  const SW = 2.3;                 // outline width
  const o = `stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"`;
  const noS = `stroke="none"`;
  const HEAD = { cx: 50, cy: 38, rx: 29, ry: 25 };
  const TORSO = { cx: 50, cy: 74, rx: 22, ry: 19 };
  const cheek = (x, y, c = "#ff8fa3", r = 4.6) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${c}" opacity=".55"/>`;
  const ell = (e, extra) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" ${extra}/>`;
  // glossy dark eye with two highlights
  const eye = (x, y, r = 4.6) => `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.12}" fill="#2a1a14"/><circle cx="${x + r * .32}" cy="${y - r * .42}" r="${r * .42}" fill="#fff"/><circle cx="${x - r * .38}" cy="${y + r * .38}" r="${r * .2}" fill="#fff" opacity=".9"/></g>`;
  // a clip that is just the head, used to hide an ear/tuft base inside the head so outlines merge cleanly
  const headClip = (id) => `<clipPath id="${id}"><ellipse cx="${HEAD.cx}" cy="${HEAD.cy}" rx="${HEAD.rx}" ry="${HEAD.ry}"/></clipPath>`;
  const cover = (id, fill, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" clip-path="url(#${id})" ${noS}/>`;
  // outlined thick curve (tails): dark underlay, coloured top
  const fat = (d, w, fill, extra = "") => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

  const bodyBase = (a, belly, behind = "") => `
    ${ell(TORSO, `fill="${a.body}" ${o}`)}
    <path d="M${TORSO.cx + 6},${TORSO.cy + 17} Q${TORSO.cx + 22},${TORSO.cy + 5} ${TORSO.cx + 19},${TORSO.cy - 6} Q${TORSO.cx + 24},${TORSO.cy + 14} ${TORSO.cx + 2},${TORSO.cy + 19} Z" fill="${a.dark}" opacity=".45" ${noS}/>
    ${belly}
    ${behind}
    ${ell(HEAD, `fill="${a.body}" ${o}`)}
    <path d="M${HEAD.cx + 4},${HEAD.cy + 24} Q${HEAD.cx + 30},${HEAD.cy + 16} ${HEAD.cx + 27},${HEAD.cy - 6} Q${HEAD.cx + 34},${HEAD.cy + 22} ${HEAD.cx - 2},${HEAD.cy + 25} Z" fill="${a.dark}" opacity=".4" ${noS}/>
    <ellipse cx="38" cy="24" rx="8" ry="4" fill="#fff" opacity=".22" transform="rotate(-20 38 24)" ${noS}/>`;
  const feet = (a, fill = a.body) => `
    <ellipse cx="37" cy="93" rx="10" ry="5.6" fill="${fill}" ${o}/><ellipse cx="63" cy="93" rx="10" ry="5.6" fill="${fill}" ${o}/>
    <path d="M32,94 v-3 M37,95 v-3 M42,94 v-3" stroke="${INK}" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>
    <path d="M58,94 v-3 M63,95 v-3 M68,94 v-3" stroke="${INK}" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>`;
  const arms = (a, fill = a.body) => `
    <ellipse cx="26.5" cy="73" rx="6.4" ry="11" fill="${fill}" ${o} transform="rotate(14 26.5 73)"/>
    <ellipse cx="73.5" cy="73" rx="6.4" ry="11" fill="${fill}" ${o} transform="rotate(-14 73.5 73)"/>`;

  const SPECIES = {
    // ------------------------------------------------------------------ CAT (ginger tabby)
    cat: {
      name: "Cat", body: "#f6b040", dark: "#dc8a2a", light: "#fff0d6", accent: "#c4631a",
      parts(a) {
        const hc = "hc-cat";
        return {
          body: `<defs>${headClip(hc)}</defs>` + bodyBase(a, `<ellipse cx="50" cy="77" rx="12" ry="12" fill="${a.light}" ${noS}/>`) +
            // forehead stripes
            `<path d="M50,15 v7 M43,17 l1.5,6 M57,17 l-1.5,6" stroke="${a.accent}" stroke-width="2.4" stroke-linecap="round"/>
             <path d="M30,69 q-3,0 -3,5 M30,76 q-3,0 -3,4 M70,69 q3,0 3,5 M70,76 q3,0 3,4" stroke="${a.accent}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
          legs: feet(a),
          arms: arms(a),
          ears: `<path d="M24,30 L22,6 Q22,4 24,5 L42,17 Z" fill="${a.body}" ${o}/><path d="M28,24 L27.5,12 L37,19 Z" fill="#f7b3c2" ${noS}/>
                  <path d="M76,30 L78,6 Q78,4 76,5 L58,17 Z" fill="${a.body}" ${o}/><path d="M72,24 L72.5,12 L63,19 Z" fill="#f7b3c2" ${noS}/>` +
                 cover(hc, a.body, 20, 10, 60, 24),
          tail: `${fat("M68,86 Q94,86 90,62 Q88,50 80,52", 8.5, a.body)}<path d="M89,70 l5,-1 M88,62 l5,-2.5 M84,55 l5,-3" stroke="${a.accent}" stroke-width="2.4" stroke-linecap="round"/>`,
          eyes: eye(38.5, 38, 5) + eye(61.5, 38, 5) + cheek(30, 47) + cheek(70, 47),
          nose: `<path d="M46.5,45 Q50,43.5 53.5,45 Q52.5,49 50,50 Q47.5,49 46.5,45 Z" fill="#ee8aa0" ${o} stroke-width="1.5"/>`,
          mouth: `<path d="M50,50 v2.5 M50,52.5 Q46,57 42,54 M50,52.5 Q54,57 58,54" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                  <path d="M38,48 l-11,-3 M38,51 l-12,1 M62,48 l11,-3 M62,51 l12,1" stroke="${INK}" stroke-width="1.1" opacity=".55" stroke-linecap="round"/>`,
        };
      },
    },
    // ------------------------------------------------------------------ FOX
    fox: {
      name: "Fox", body: "#e9552b", dark: "#b8391a", light: "#fff3e3", accent: "#2f211b",
      parts(a) {
        const hc = "hc-fox";
        return {
          body: `<defs>${headClip(hc)}</defs>` + bodyBase(a, `<path d="M50,58 Q34,66 38,86 Q50,92 62,86 Q66,66 50,58 Z" fill="${a.light}" ${noS}/>`) +
            // white cheek ruffs and a pale muzzle
            `<path d="M21,40 Q30,42 36,49 Q42,56 50,59 Q42,62 32,58 Q22,52 21,40 Z" fill="${a.light}" ${noS}/>
             <path d="M79,40 Q70,42 64,49 Q58,56 50,59 Q58,62 68,58 Q78,52 79,40 Z" fill="${a.light}" ${noS}/>
             <ellipse cx="50" cy="19" rx="5" ry="3" fill="${a.dark}" opacity=".5" ${noS}/>`,
          legs: feet(a, a.accent),
          arms: arms(a, a.body).replace(/\/>\s*$/, "/>") + `<ellipse cx="25" cy="81" rx="5" ry="3.6" fill="${a.accent}" ${noS} transform="rotate(14 25 81)"/><ellipse cx="75" cy="81" rx="5" ry="3.6" fill="${a.accent}" ${noS} transform="rotate(-14 75 81)"/>`,
          ears: `<path d="M22,36 L17,3 Q17,1 19,2 L45,16 Z" fill="${a.body}" ${o}/><path d="M17,3 L26,7 L22,16 L18,12 Z" fill="${a.accent}" ${noS}/><path d="M26,28 L23,12 L38,20 Z" fill="${a.light}" ${noS}/>
                  <path d="M78,36 L83,3 Q83,1 81,2 L55,16 Z" fill="${a.body}" ${o}/><path d="M83,3 L74,7 L78,16 L82,12 Z" fill="${a.accent}" ${noS}/><path d="M74,28 L77,12 L62,20 Z" fill="${a.light}" ${noS}/>` +
                 cover(hc, a.body, 18, 10, 64, 22),
          tail: `<path d="M70,84 Q98,86 96,58 Q94,46 84,48 Q96,64 80,72 Q74,76 70,76 Z" fill="${a.body}" ${o}/><path d="M96,58 Q94,46 84,48 Q92,52 91,60 Z" fill="${a.light}" ${noS}/><path d="M88,70 Q94,64 94,58" stroke="${a.dark}" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>`,
          eyes: eye(38.5, 37, 4.6) + eye(61.5, 37, 4.6) + `<ellipse cx="37" cy="29.5" rx="3.2" ry="1.7" fill="${a.light}" opacity=".95" transform="rotate(-18 37 29.5)"/><ellipse cx="63" cy="29.5" rx="3.2" ry="1.7" fill="${a.light}" opacity=".95" transform="rotate(18 63 29.5)"/>` + cheek(31, 47, "#ff7d6b") + cheek(69, 47, "#ff7d6b"),
          nose: `<path d="M45,46 Q50,43.5 55,46 Q53,50.5 50,51 Q47,50.5 45,46 Z" fill="${a.accent}"/><circle cx="48.5" cy="45.7" r="1" fill="#fff" opacity=".8"/>`,
          mouth: `<path d="M50,51 v2 M50,53 Q46.5,57 43,54.5 M50,53 Q53.5,57 57,54.5" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
        };
      },
    },
    // ------------------------------------------------------------------ BEAR
    bear: {
      name: "Bear", body: "#b0773f", dark: "#8c5628", light: "#f1dcb9", accent: "#5b3a1e",
      parts(a) {
        const hc = "hc-bear";
        return {
          body: `<defs>${headClip(hc)}</defs>` + bodyBase(a, `<ellipse cx="50" cy="77" rx="13.5" ry="13" fill="${a.light}" ${noS}/>`) +
            `<ellipse cx="50" cy="48" rx="13.5" ry="11" fill="${a.light}" ${o} stroke-width="1.6"/>`,
          legs: feet(a) + `<ellipse cx="37" cy="94" rx="5" ry="3" fill="${a.light}" ${noS}/><ellipse cx="63" cy="94" rx="5" ry="3" fill="${a.light}" ${noS}/>`,
          arms: arms(a),
          ears: `<circle cx="27" cy="19" r="11" fill="${a.body}" ${o}/><circle cx="27" cy="19" r="5.8" fill="${a.light}" ${noS}/>
                  <circle cx="73" cy="19" r="11" fill="${a.body}" ${o}/><circle cx="73" cy="19" r="5.8" fill="${a.light}" ${noS}/>` + cover(hc, a.body, 18, 14, 64, 18),
          tail: `<circle cx="73" cy="88" r="5.5" fill="${a.body}" ${o}/>`,
          eyes: eye(37.5, 38, 4.4) + eye(62.5, 38, 4.4) + cheek(29, 46) + cheek(71, 46),
          nose: `<path d="M45,44 Q50,41.5 55,44 Q53,49 50,49.5 Q47,49 45,44 Z" fill="${a.accent}"/><ellipse cx="48" cy="43.6" rx="1.6" ry="1" fill="#fff" opacity=".75"/>`,
          mouth: `<path d="M50,49.5 v2.5 M50,52 Q46,56 42.5,53.5 M50,52 Q54,56 57.5,53.5" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`,
        };
      },
    },
    // ------------------------------------------------------------------ RABBIT
    rabbit: {
      name: "Rabbit", body: "#dde4f4", dark: "#aab6d6", light: "#ffffff", accent: "#f6a9bd",
      parts(a) {
        const hc = "hc-rabbit";
        return {
          body: `<defs>${headClip(hc)}</defs>` + bodyBase(a, `<ellipse cx="50" cy="77" rx="12.5" ry="12.5" fill="${a.light}" ${noS}/>`),
          legs: `<ellipse cx="35" cy="93" rx="12" ry="5.8" fill="${a.body}" ${o}/><ellipse cx="65" cy="93" rx="12" ry="5.8" fill="${a.body}" ${o}/>
                 <ellipse cx="33" cy="94" rx="6" ry="2.6" fill="${a.accent}" opacity=".6" ${noS}/><ellipse cx="67" cy="94" rx="6" ry="2.6" fill="${a.accent}" opacity=".6" ${noS}/>`,
          arms: arms(a),
          ears: `<path d="M36,28 Q27,2 38,0 Q47,1 46,24 Z" fill="${a.body}" ${o}/><path d="M38,24 Q33,8 38,5 Q42,6 42,22 Z" fill="${a.accent}" ${noS}/>
                  <path d="M64,28 Q73,2 62,0 Q53,1 54,24 Z" fill="${a.body}" ${o}/><path d="M62,24 Q67,8 62,5 Q58,6 58,22 Z" fill="${a.accent}" ${noS}/>` + cover(hc, a.body, 26, 8, 48, 30),
          tail: `<circle cx="75" cy="86" r="8" fill="${a.light}" ${o}/><path d="M71,83 q3,-2 5,0 M73,88 q3,1 5,-1" stroke="${a.dark}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>`,
          eyes: eye(38, 39, 4.8) + eye(62, 39, 4.8) + cheek(29, 48) + cheek(71, 48),
          nose: `<path d="M46.5,45.5 Q50,43.5 53.5,45.5 Q52,49 50,49.5 Q48,49 46.5,45.5 Z" fill="#f088a5" ${o} stroke-width="1.3"/>`,
          mouth: `<path d="M50,49.5 v2 M50,51.5 Q46.5,55 43.5,52.5 M50,51.5 Q53.5,55 56.5,52.5" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
                  <path d="M46.5,53.2 h3 v5 q-1.5,1.2 -3,0 Z M50.5,53.2 h3 v5 q-1.5,1.2 -3,0 Z" fill="#fff" ${o} stroke-width="1.3"/>
                  <path d="M38,49 l-10,-2 M38,52 l-10,2.5 M62,49 l10,-2 M62,52 l10,2.5" stroke="${INK}" stroke-width="1" opacity=".45" stroke-linecap="round"/>`,
        };
      },
    },
    // ------------------------------------------------------------------ OWL
    owl: {
      name: "Owl", body: "#8e78b8", dark: "#68548f", light: "#f8ecd2", accent: "#f3a52f",
      parts(a) {
        const hc = "hc-owl";
        return {
          body: `<defs>${headClip(hc)}</defs>` + bodyBase(a, `<ellipse cx="50" cy="76" rx="14" ry="14" fill="${a.light}" ${noS}/>
                 <path d="M43,70 q3.5,3 7,0 q3.5,3 7,0 M41,76 q4.5,3.5 9,0 q4.5,3.5 9,0 M43,82 q3.5,3 7,0 q3.5,3 7,0" stroke="${a.body}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`) +
            // face disc: two cream circles
            `<circle cx="39" cy="38" r="14.5" fill="${a.light}" ${o} stroke-width="1.5"/><circle cx="61" cy="38" r="14.5" fill="${a.light}" ${o} stroke-width="1.5"/>
             <path d="M50,30 Q50,40 50,49" stroke="none"/>`,
          legs: `<g fill="${a.accent}" ${o} stroke-width="1.8"><path d="M31,92 q2,-1 3,1 q2,-2 3,0 q2,-2 3,0 q-1,4 -5,4 q-4,0 -4,-5 Z"/><path d="M69,92 q-2,-1 -3,1 q-2,-2 -3,0 q-2,-2 -3,0 q1,4 5,4 q4,0 4,-5 Z"/></g>`,
          arms: `<path d="M29,56 Q9,66 16,90 Q26,90 31,78 Q33,66 29,56 Z" fill="${a.dark}" ${o}/><path d="M22,70 q3,4 1,10 M26,64 q4,5 2,13" stroke="${a.body}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
                  <path d="M71,56 Q91,66 84,90 Q74,90 69,78 Q67,66 71,56 Z" fill="${a.dark}" ${o}/><path d="M78,70 q-3,4 -1,10 M74,64 q-4,5 -2,13" stroke="${a.body}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`,
          ears: `<path d="M24,26 L19,6 Q20,4 22,5 L40,15 Z" fill="${a.dark}" ${o}/><path d="M76,26 L81,6 Q80,4 78,5 L60,15 Z" fill="${a.dark}" ${o}/>` + cover(hc, a.body, 18, 10, 64, 16),
          tail: `<path d="M41,92 L44,100 L50,95 L56,100 L59,92 Z" fill="${a.dark}" ${o}/>`,
          eyes: `<circle cx="39" cy="38" r="9.2" fill="#fff" ${o} stroke-width="1.6"/><circle cx="61" cy="38" r="9.2" fill="#fff" ${o} stroke-width="1.6"/>
                 <circle cx="39" cy="38" r="6.2" fill="${a.accent}"/><circle cx="61" cy="38" r="6.2" fill="${a.accent}"/>
                 <circle cx="39.4" cy="38.4" r="3.6" fill="#2a1a14"/><circle cx="61.4" cy="38.4" r="3.6" fill="#2a1a14"/>
                 <circle cx="40.8" cy="36.4" r="1.4" fill="#fff"/><circle cx="62.8" cy="36.4" r="1.4" fill="#fff"/>` + cheek(27, 49, "#ff9a86", 4) + cheek(73, 49, "#ff9a86", 4),
          nose: `<path d="M45.5,44 Q50,41.5 54.5,44 Q52.5,52 50,53.5 Q47.5,52 45.5,44 Z" fill="${a.accent}" ${o} stroke-width="1.6"/>`,
          mouth: `<path d="M50,53.5 v1.5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M45,56 Q50,58.5 55,56" stroke="${a.dark}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".7"/>`,
        };
      },
    },
  };

  const PART_ORDER = ["body", "legs", "arms", "ears", "tail", "eyes", "nose", "mouth"];
  // draw order differs from reveal order for a few parts so things sit correctly: tails and feet go BEHIND the body
  const LAYER = { tail: 0, legs: 1, body: 2, arms: 3, ears: 4, eyes: 5, nose: 6, mouth: 7 };
  function animalSvg(key, partsShown, newest) {
    const a = SPECIES[key], parts = a.parts(a);
    const shown = PART_ORDER.filter((p) => partsShown.includes(p)).sort((x, y) => LAYER[x] - LAYER[y]);
    return `<svg viewBox="0 -4 100 106" xmlns="http://www.w3.org/2000/svg">${shown.map((p) => `<g${p === newest ? ' class="rw-part"' : ""}>${parts[p]}</g>`).join("")}</svg>`;
  }
  window.ANIMAL_SET = { SPECIES, PART_ORDER, animalSvg };
})();
