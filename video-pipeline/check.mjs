// Automated QA for video1_main.html (and future nugget-video scenes built the
// same way). Run BEFORE rendering to video, and again against the rendered
// output's timing data.
//
// Notation (clefs/notes/ledger lines) is rendered by VexFlow (notation.js),
// which guarantees correct proportions and placement by construction - that
// whole class of pixel-geometry bug (clef too small, note not on its line,
// ledger line in the wrong place) simply can't happen anymore, so this
// checker no longer measures notation pixels. It only asserts VexFlow
// actually rendered something into each notation container - a real render
// failure (bad pitch string, missing font) is still worth catching - and
// keeps the timing/reachability checks that were never the problem.
//
// For the actual notation content, look at storyboard_preview.html instead -
// open it in a browser and check by eye. That's cheaper and more meaningful
// than a pixel assertion now that VexFlow owns correctness.
//
// Usage: node check.mjs [http://localhost:8960/video1_main.html]

import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:8960/video1_main.html';

const results = [];
function check(label, pass, detail) {
  results.push({ label, pass, detail });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(URL, { waitUntil: 'load' });

// ---- 1. Notation rendered: every .notation-slot in scenes 3-7, and each of
//    scene 8's recap icons, must contain a real, non-empty <svg> after its
//    scene script runs - catches "VexFlow threw/didn't render", not pixel size. ----
const notationCheck = await page.evaluate(async () => {
  const out = [];
  function svgInfo(el) {
    const svg = el ? el.querySelector('svg') : null;
    if (!svg) return { ok: false, reason: 'no svg' };
    const w = parseFloat(svg.getAttribute('width'));
    const h = parseFloat(svg.getAttribute('height'));
    const hasContent = svg.children.length > 0;
    return { ok: w > 0 && h > 0 && hasContent, reason: `w=${w} h=${h} children=${svg.children.length}` };
  }
  for (const id of ['s3', 's4', 's5', 's6', 's7']) {
    document.querySelectorAll('.scene').forEach((s) => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.__runSceneScriptForCheck__(id);
    out.push({ label: `${id}-notation`, ...svgInfo(document.getElementById(`${id}-notation`)) });
  }
  // s6 stages a second note in ("space") partway through, via a second
  // renderNotation call rather than a sub-element animation - check that
  // render directly instead of waiting out its real (many-second) delay.
  renderNotation(document.getElementById('s6-notation'), Object.assign({}, STORYBOARD.s6_lineAndSpace.spec, { width: 340, height: 300, scale: 1.5 }));
  out.push({ label: 's6-notation (after space note added)', ...svgInfo(document.getElementById('s6-notation')) });

  document.querySelectorAll('.scene').forEach((s) => s.classList.remove('active'));
  document.getElementById('s8').classList.add('active');
  window.__runSceneScriptForCheck__('s8');
  for (const [key, spec] of Object.entries({
    STAVE: Object.assign({}, STORYBOARD.s8_stave.spec, { width: 220, height: 150 }),
    CLEF: Object.assign({}, STORYBOARD.s8_clef.spec, { width: 120, height: 240 }),
    NOTE: Object.assign({}, STORYBOARD.s8_note.spec, { width: 100, height: 220 }),
    LINE_SPACE: Object.assign({}, STORYBOARD.s8_lineSpace.spec, { width: 240, height: 245 }),
    LEDGER: Object.assign({}, STORYBOARD.s8_ledger.spec, { width: 150, height: 240 }),
  })) {
    const el = document.getElementById('s8-icon');
    renderNotation(el, spec);
    out.push({ label: `s8-icon (${key})`, ...svgInfo(el) });
  }
  return out;
});
for (const n of notationCheck) {
  check(`notation rendered: ${n.label}`, n.ok, n.reason);
}

// ---- 2. Timing: BEATS array must be contiguous, monotonic, and its final
//    end must match the narration audio's real duration ----
const timing = await page.evaluate(async () => {
  const audio = document.getElementById('narration');
  await new Promise((resolve) => {
    if (audio.readyState >= 1) resolve();
    else audio.addEventListener('loadedmetadata', resolve, { once: true });
  });
  return { beats: window.__BEATS_FOR_CHECK__ || null, audioDuration: audio.duration };
});
if (!timing.beats) {
  check('BEATS exposed for checking', false, 'page must set window.__BEATS_FOR_CHECK__ = BEATS for the checker to verify timing');
} else {
  let prevEnd = 0;
  let monotonic = true;
  let gapDetail = '';
  for (const b of timing.beats) {
    if (b.start < prevEnd - 0.001) { monotonic = false; gapDetail = `${b.id} starts at ${b.start} before previous scene ended at ${prevEnd}`; }
    prevEnd = b.end;
  }
  check('BEATS are contiguous/monotonic', monotonic, gapDetail || 'no overlaps or negative gaps');
  const last = timing.beats[timing.beats.length - 1];
  const drift = Math.abs(last.end - timing.audioDuration);
  check('BEATS total matches narration audio duration', drift <= 0.15, `last beat ends ${last.end}s, audio is ${timing.audioDuration.toFixed(3)}s, drift ${drift.toFixed(3)}s`);
}

// ---- 3. Gap handling: at every moment strictly *between* scenes (the silence
//    gaps in narration), the timeline must hold on the scene that just finished,
//    never fall back to scene 1 or any other wrong scene. ----
const gapResults = await page.evaluate(() => {
  const beats = window.__BEATS_FOR_CHECK__;
  const pick = window.__pickBeatForCheck__;
  if (!beats || !pick) return null;
  const out = [];
  for (let i = 0; i < beats.length - 1; i++) {
    const gapStart = beats[i].end;
    const gapEnd = beats[i + 1].start;
    if (gapEnd <= gapStart) continue; // no gap between these two
    const mid = (gapStart + gapEnd) / 2;
    out.push({ midOfGapAfter: beats[i].id, expected: beats[i].id, got: pick(mid), t: mid });
  }
  return out;
});
if (!gapResults) {
  check('gap-handling hooks present', false, 'window.__pickBeatForCheck__ not exposed');
} else {
  for (const g of gapResults) {
    check(`gap after ${g.midOfGapAfter} holds correct scene`, g.got === g.expected, `at t=${g.t.toFixed(2)}s expected "${g.expected}", picked "${g.got}"`);
  }
}

// ---- 4. Reachability: every element with a .show-triggering class name
//    referenced in runSceneScript actually becomes visible (opacity > .8)
//    at some point when its scene plays out in real time ----
const reachability = await page.evaluate(async () => {
  const out = [];
  const scenes = ['s2', 's3', 's4', 's5', 's6', 's7', 's8'];
  const beats = window.__BEATS_FOR_CHECK__ || [];
  for (const id of scenes) {
    document.querySelectorAll('.scene').forEach((s) => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (typeof window.__runSceneScriptForCheck__ === 'function') {
      window.__runSceneScriptForCheck__(id);
    }
    const beat = beats.find((b) => b.id === id);
    const waitMs = beat ? (beat.end - beat.start) * 1000 + 500 : 9000; // full scene span + buffer
    await new Promise((r) => setTimeout(r, waitMs));
    const scene = document.getElementById(id);
    const targets = scene.querySelectorAll('.caption, .notation-slot, .mascot');
    targets.forEach((el) => {
      const op = parseFloat(getComputedStyle(el).opacity);
      out.push({ scene: id, el: el.id || el.className, opacity: op });
    });
  }
  return out;
});
const neverShown = reachability.filter((r) => r.opacity < 0.8);
check('all scripted elements reach visible opacity', neverShown.length === 0, neverShown.length ? JSON.stringify(neverShown) : 'all reached opacity >= 0.8');

// ---- 5. Bumper notation (separate file/page) also renders something real -
//    same rendered-svg check as scenes 3-7, no pixel geometry. ----
const BUMPER_URL = URL.replace(/video1_main\.html.*$/, 'bumper_render.html');
const bumperPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await bumperPage.goto(BUMPER_URL, { waitUntil: 'load' });
const bumperNotationCheck = await bumperPage.evaluate(() => {
  const out = [];
  document.querySelectorAll('.notation-slot').forEach((el) => {
    const svg = el.querySelector('svg');
    const w = svg ? parseFloat(svg.getAttribute('width')) : 0;
    const h = svg ? parseFloat(svg.getAttribute('height')) : 0;
    out.push({ id: el.id, ok: !!svg && w > 0 && h > 0 && svg.children.length > 0, reason: svg ? `w=${w} h=${h} children=${svg.children.length}` : 'no svg' });
  });
  return out;
});
for (const n of bumperNotationCheck) {
  check(`notation rendered: bumper ${n.id}`, n.ok, n.reason);
}
await bumperPage.close();

await browser.close();

// ---- report ----
console.log('\n=== Video QA report ===');
let anyFail = false;
for (const r of results) {
  const mark = r.pass ? 'PASS' : 'FAIL';
  if (!r.pass) anyFail = true;
  console.log(`[${mark}] ${r.label}${r.detail ? ' — ' + r.detail : ''}`);
}
console.log(anyFail ? '\nRESULT: FAIL — do not ship until the above are fixed.' : '\nRESULT: PASS');
process.exit(anyFail ? 1 : 0);
