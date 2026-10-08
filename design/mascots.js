/* Melody (songbird, treble clef) and Barnaby (bear, bass clef), redrawn 8 Oct 2026 as full characters.
 *
 *   MASCOTS.melody({pose, mouth, blink, bust})  /  MASCOTS.barnaby({...})   ->  "<svg ...>" string
 *     pose   'idle' | 'wave' | 'point' | 'cheer' | 'think'
 *     mouth  0..1  how open the beak/mouth is (the video engine drives this from the narration's loudness)
 *     blink  0..1  1 = eyes closed
 *     bust   true  = head-and-shoulders crop, for small avatars in the games
 * Same drawing style as the five animals (design/animals.js): one warm dark outline, flat colour + one shadow tone + highlights.
 */
(function () {
  const INK = "#2b2250";                       // a deep indigo-brown outline, a little cooler than the animals'
  const SW = 2.3;
  const o = `stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"`;
  const noS = `stroke="none"`;
  const eye = (x, y, r, blink, lookX = 0.8) => blink > 0.6
    ? `<path d="M${x - r},${y + 0.5} Q${x},${y - r * 0.9} ${x + r},${y + 0.5}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`
    : `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.12 * (1 - 0.8 * blink)}" fill="#1c1535"/><circle cx="${x + lookX + r * .3}" cy="${y - r * .42}" r="${r * .42}" fill="#fff"/><circle cx="${x - r * .35}" cy="${y + r * .38}" r="${r * .2}" fill="#fff" opacity=".9"/></g>`;
  const cheek = (x, y, r = 4.8) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .7}" fill="#ff7f9d" opacity=".55"/>`;

  // arm/wing angles per pose: [left, right] rotation in degrees about the shoulder (positive = swings outwards/up)
  const POSES = {
    idle:  { l: 8,   r: -8 },
    wave:  { l: 8,   r: -138 },
    point: { l: 8,   r: -92 },
    cheer: { l: 140, r: -140 },
    think: { l: 8,   r: -150 },
  };

  // ============================================================ MELODY
  function melody({ pose = "idle", mouth = 0, blink = 0, bust = false } = {}) {
    const P = POSES[pose] || POSES.idle, m = Math.max(0, Math.min(1, mouth));
    const teal = "#2dd4bf", dark = "#119f8f", light = "#d9fbf3", feather = "#17b8a6", orange = "#ffa34a", orangeD = "#e8761e";
    const wing = (side, ang) => {          // side: -1 left, +1 right; hinge at the shoulder
      const sx = 50 + side * 22, sy = 70, rot = ang;
      return `<g transform="rotate(${rot} ${sx} ${sy})">
        <path d="M${sx},${sy - 8} Q${sx + side * 15},${sy - 6} ${sx + side * 14},${sy + 12} Q${sx + side * 13},${sy + 22} ${sx + side * 7},${sy + 23} Q${sx + side * 5},${sy + 18} ${sx + side * 2},${sy + 21} Q${sx - side * 1},${sy + 12} ${sx - side * 2},${sy + 2} Z" fill="${feather}" ${o}/>
        <path d="M${sx + side * 3},${sy + 4} q${side * 4},6 ${side * 2},13" stroke="${dark}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
    };
    const beakOpen = 2 + 7 * m;
    const body = `
      <!-- tail feathers behind -->
      <path d="M40,96 Q36,108 44,110 Q47,104 50,110 Q53,104 56,110 Q64,108 60,96 Z" fill="${feather}" ${o}/>
      <!-- feet -->
      <g fill="${orange}" ${o} stroke-width="1.9"><path d="M33,96 q1,6 5,6 q4,0 5,-6 q-3,2 -5,0 q-2,2 -5,0 Z"/><path d="M57,96 q1,6 5,6 q4,0 5,-6 q-3,2 -5,0 q-2,2 -5,0 Z"/></g>
      <!-- body -->
      <ellipse cx="50" cy="74" rx="25" ry="24" fill="${teal}" ${o}/>
      <path d="M62,96 Q82,88 76,66 Q80,90 56,97 Z" fill="${dark}" opacity=".45" ${noS}/>
      <ellipse cx="50" cy="80" rx="14.5" ry="15" fill="${light}" ${noS}/>
      <path d="M42,74 q3.5,3 7,0 M51,74 q3.5,3 7,0 M44,81 q3.5,3 7,0 M53,81 q3,3 6,0" stroke="${feather}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>
      ${wing(-1, P.l)}${wing(1, P.r)}
      <!-- head -->
      <circle cx="50" cy="40" r="27" fill="${teal}" ${o}/>
      <path d="M50,67 Q78,60 77,38 Q82,64 52,68 Z" fill="${dark}" opacity=".4" ${noS}/>
      <ellipse cx="38" cy="24" rx="9" ry="4.2" fill="#fff" opacity=".28" transform="rotate(-22 38 24)" ${noS}/>
      <!-- crest: a curl that echoes the treble clef, flanked by two small feathers -->
      <path d="M50,15 Q42,3 51,-2 Q61,-4 60,6 Q59,14 52,13 Q46,11 48,6" fill="none" stroke="${INK}" stroke-width="${SW + 5}" stroke-linecap="round"/>
      <path d="M50,15 Q42,3 51,-2 Q61,-4 60,6 Q59,14 52,13 Q46,11 48,6" fill="none" stroke="${teal}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="47.6" cy="6.5" r="1.9" fill="${INK}"/>
      <path d="M41,16 Q32,8 36,1 Q43,3 46,14 Z" fill="${teal}" ${o} stroke-width="1.9"/>
      <path d="M59,16 Q68,8 64,1 Q57,3 54,14 Z" fill="${teal}" ${o} stroke-width="1.9"/>
      <!-- face -->
      ${eye(39, 38, 5.6, blink)}${eye(61, 38, 5.6, blink)}${cheek(30, 47)}${cheek(70, 47)}
      <path d="M33,28 Q39,24 45,27 M67,28 Q61,24 55,27" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/>
      <!-- beak: top half fixed, bottom half drops as the mouth opens -->
      ${m > 0.05 ? `<path d="M43,${50} Q50,${50 + beakOpen + 3} 57,50 Z" fill="#7a2a3a" ${noS}/><ellipse cx="50" cy="${50 + beakOpen * 0.55}" rx="3.6" ry="${Math.min(2.4, beakOpen * 0.35)}" fill="#ff8fa0" ${noS}/>
        <path d="M43.5,${50} Q50,${50 + beakOpen + 4} 56.5,50 Q50,${50 + beakOpen} 43.5,50 Z" fill="${orange}" ${o} stroke-width="1.8"/>` : ""}
      <path d="M43,45 Q50,40.5 57,45 Q55,51.5 50,52.5 Q45,51.5 43,45 Z" fill="${orange}" ${o} stroke-width="1.9"/>
      <path d="M46,45 Q50,43.2 54,45" stroke="#ffd29a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>`;
    return svg(body, bust);
  }

  // ============================================================ BARNABY
  function barnaby({ pose = "idle", mouth = 0, blink = 0, bust = false } = {}) {
    const P = POSES[pose] || POSES.idle, m = Math.max(0, Math.min(1, mouth));
    const ind = "#6c6ff2", dark = "#4a4ccf", light = "#e4e7ff", deep = "#3a3aa8", bow = "#ff8a3d", bowD = "#e0601a";
    const arm = (side, ang) => {
      const sx = 50 + side * 25, sy = 72, rot = ang;
      return `<g transform="rotate(${rot} ${sx} ${sy})"><path d="M${sx - side * 4},${sy - 7} Q${sx + side * 12},${sy - 4} ${sx + side * 11},${sy + 14} Q${sx + side * 10},${sy + 24} ${sx + side * 3},${sy + 22} Q${sx - side * 4},${sy + 14} ${sx - side * 4},${sy - 7} Z" fill="${ind}" ${o}/>
        <ellipse cx="${sx + side * 4.5}" cy="${sy + 20}" rx="4.6" ry="4" fill="${light}" ${noS}/></g>`;
    };
    const open = 1.5 + 8 * m;
    const body = `
      <!-- feet -->
      <ellipse cx="35" cy="102" rx="12" ry="6.4" fill="${ind}" ${o}/><ellipse cx="65" cy="102" rx="12" ry="6.4" fill="${ind}" ${o}/>
      <ellipse cx="35" cy="103" rx="6" ry="3" fill="${light}" ${noS}/><ellipse cx="65" cy="103" rx="6" ry="3" fill="${light}" ${noS}/>
      <!-- body, with a bass-clef tummy patch -->
      <ellipse cx="50" cy="80" rx="28" ry="24" fill="${ind}" ${o}/>
      <path d="M64,102 Q86,92 78,70 Q84,96 58,103 Z" fill="${dark}" opacity=".5" ${noS}/>
      <ellipse cx="50" cy="83" rx="16.5" ry="15.5" fill="${light}" ${noS}/>
      <path d="M44,77 Q52,71 55,78 Q56,87 45,93" fill="none" stroke="${ind}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="43.4" cy="77.6" r="3.2" fill="${ind}"/><circle cx="59.6" cy="76" r="1.9" fill="${ind}"/><circle cx="59.6" cy="83" r="1.9" fill="${ind}"/>
      ${arm(-1, P.l)}${arm(1, P.r)}
      <!-- bow tie -->
      <path d="M50,64 L38,57 Q35,64 38,71 Z" fill="${bow}" ${o} stroke-width="1.9"/><path d="M50,64 L62,57 Q65,64 62,71 Z" fill="${bow}" ${o} stroke-width="1.9"/>
      <rect x="46.2" y="59.5" width="7.6" height="10" rx="3" fill="${bowD}" ${o} stroke-width="1.9"/>
      <!-- ears (behind the head's outline) -->
      <circle cx="25" cy="19" r="12.5" fill="${ind}" ${o}/><circle cx="25" cy="19" r="6.6" fill="#ff9bb5"/>
      <circle cx="75" cy="19" r="12.5" fill="${ind}" ${o}/><circle cx="75" cy="19" r="6.6" fill="#ff9bb5"/>
      <!-- head -->
      <ellipse cx="50" cy="38" rx="30" ry="27" fill="${ind}" ${o}/>
      <path d="M52,65 Q82,58 80,36 Q86,62 54,66 Z" fill="${dark}" opacity=".45" ${noS}/>
      <ellipse cx="36" cy="22" rx="9" ry="4.2" fill="#fff" opacity=".25" transform="rotate(-22 36 22)" ${noS}/>
      <!-- a little tuft -->
      <path d="M47,12 Q50,5 54,12" fill="${ind}" ${o} stroke-width="1.9"/>
      <!-- face -->
      <ellipse cx="50" cy="49" rx="15" ry="12" fill="${light}" ${o} stroke-width="1.7"/>
      ${eye(37, 35, 5.2, blink)}${eye(63, 35, 5.2, blink)}${cheek(29, 46)}${cheek(71, 46)}
      <path d="M30,26 Q36,22 43,25 M70,26 Q64,22 57,25" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M45,43.5 Q50,40.5 55,43.5 Q53,48 50,48.5 Q47,48 45,43.5 Z" fill="${INK}"/><ellipse cx="48" cy="43" rx="1.6" ry="1" fill="#fff" opacity=".7"/>
      ${m > 0.05
        ? `<path d="M42.5,${50} Q50,${50 + open * 1.9} 57.5,50 Q50,${48.4} 42.5,50 Z" fill="#6e1f3a" ${o} stroke-width="1.7"/><path d="M45.5,${50 + open * 1.2} Q50,${50 + open * 0.85} 54.5,${50 + open * 1.2} Q50,${50 + open * 1.7} 45.5,${50 + open * 1.2} Z" fill="#ff8fa0"/>`
        : `<path d="M50,48.5 v2 M50,50.5 Q46,54.5 42.5,52 M50,50.5 Q54,54.5 57.5,52" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`}`;
    return svg(body, bust);
  }

  function svg(inner, bust) {
    return `<svg viewBox="${bust ? "8 -9 84 85" : "0 -9 100 123"}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
  window.MASCOTS = { melody, barnaby, POSES };
})();
