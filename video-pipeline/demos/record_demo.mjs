// node record_demo.mjs <gameId> -> out/<gameId>_demo.mp4  (1080x1920 Short/Reel, silent game + music bed, no ElevenLabs credits)
// A robot plays the first stage of a game in a clean browser, with a visible finger-tap marker, then ffmpeg adds a hook,
// footer and a quiet music bed. Add a game by adding an entry to GAMES: how to read the right answer and tap it.
import { chromium } from '/Users/andrewlord/Projects/family-reel/node_modules/playwright/index.mjs';
import { spawnSync } from 'child_process';
import fs from 'fs';
const repo = new URL('../../', import.meta.url).pathname, here = new URL('.', import.meta.url).pathname;
const SITE = process.env.DEMO_BASE || 'http://localhost:8767/music/';

const GAMES = {
  name_that_part: {
    file: 'name_that_part.html', hook: 'Can you name the<br>parts of the music?', rounds: 6,
    pre: async (p) => { await p.waitForTimeout(800); await tap(p, p.locator('text=/^Fox$/').first()); await p.waitForTimeout(1200); },
    // the question's right answer is round.target; tap the button with that label
    answer: async (p) => { const label = await p.evaluate(() => TERMS[round.target].label); await tap(p, p.locator('#answer-buttons button', { hasText: new RegExp('^' + label + '$') })); },
  },
};

async function tap(p, loc) {
  const box = await loc.first().boundingBox(); const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await p.mouse.move(x - 60, y + 90, { steps: 12 }); await p.waitForTimeout(250);
  await p.mouse.move(x, y, { steps: 10 }); await p.waitForTimeout(250);
  await p.mouse.down(); await p.waitForTimeout(120); await p.mouse.up();
}

const id = process.argv[2] || 'name_that_part', g = GAMES[id];
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1,
  recordVideo: { dir: here + 'out/_rec', size: { width: 1080, height: 1920 } } });
const p = await ctx.newPage();
await p.addInitScript(() => { localStorage.setItem('tga_no_count', '1');
  // capture everything the game plays: all Web Audio goes through one shared context whose output is also recorded,
  // and <audio> elements (Melody and Barnaby saying a name) are routed into it too
  const R = new AudioContext(), recDest = R.createMediaStreamDestination(), mix = R.createGain();
  mix.connect(R.destination); mix.connect(recDest); Object.defineProperty(R, 'destination', { get: () => mix });
  window.AudioContext = window.webkitAudioContext = function () { return R; };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (!this.__h) { this.__h = 1; try { R.createMediaElementSource(this).connect(mix); } catch (e) {} } return play.apply(this, arguments); };
  window.__chunks = []; const mr = new MediaRecorder(recDest.stream, { mimeType: 'audio/webm;codecs=opus' });
  mr.ondataavailable = e => window.__chunks.push(e.data); mr.onstart = () => { window.__recStart = performance.now(); }; mr.start(200); window.__mr = mr;
  // a red flash at the start gives a known moment to line the sound up with the picture; it is cut from the final video
  addEventListener('DOMContentLoaded', () => { const f = document.createElement('div'); f.id = '__flash'; f.style.cssText = 'position:fixed;inset:0;background:#f00;z-index:2147483647'; document.body.appendChild(f); });
  addEventListener('DOMContentLoaded', () => { const d = document.createElement('div');
    d.style.cssText = 'position:fixed;zoom:.588;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.55);border:4px solid #e8590c;pointer-events:none;z-index:99999;left:-99px;top:-99px;transition:transform .12s';
    document.body.appendChild(d);
    addEventListener('mousemove', e => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true);
    window.__taps = []; addEventListener('mousedown', () => { window.__taps.push(performance.now()); d.style.transform = 'scale(.7)'; }, true); addEventListener('mouseup', () => d.style.transform = '', true); }); });
await p.goto(SITE + g.file + '?nocount=1'); await p.evaluate(() => { document.documentElement.style.zoom = 1.7; document.body.style.cssText += ';min-height:0;align-items:flex-start;padding-top:170px'; const st = document.createElement('style'); st.textContent = '#reward-widget{width:130px!important;height:130px!important;bottom:132px!important}'; document.head.appendChild(st); }); await p.waitForTimeout(2500);
await p.evaluate(() => { document.getElementById('__flash').remove(); window.__flashEnd = performance.now(); }); await p.waitForTimeout(400);
if (g.pre) await g.pre(p);
for (let i = 0; i < g.rounds; i++) { await p.waitForTimeout(1500); await g.answer(p); await p.waitForTimeout(1800); }
await p.waitForTimeout(1500);
const sync = await p.evaluate(() => ({ off: (window.__flashEnd - window.__recStart) / 1000, taps: window.__taps.map(t => +((t - window.__recStart) / 1000).toFixed(2)) }));
console.log('tap times in the sound recording:', sync.taps.join(' '));
const audioB64 = await p.evaluate(() => new Promise(res => { window.__mr.onstop = async () => { const buf = new Uint8Array(await new Blob(window.__chunks).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192)); res(btoa(s)); }; window.__mr.stop(); }));
const vid = await p.video().path(); await ctx.close(); await b.close();
const raw = here + `out/${id}_raw.webm`; fs.copyFileSync(vid, raw); fs.rmSync(here + 'out/_rec', { recursive: true, force: true });
const recFile = here + `out/${id}_gamesound.webm`; fs.writeFileSync(recFile, Buffer.from(audioB64, 'base64'));
// when does the red flash end in the picture? (first frame that is no longer red, at 50 fps)
const fr = spawnSync('ffmpeg', ['-v', 'error', '-i', raw, '-vf', 'fps=50,scale=2:2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 }).stdout;
let seen = false, tE = 0; for (let i = 0; i * 12 < fr.length; i++) { const red = fr[i * 12] > 200 && fr[i * 12 + 1] < 80; if (red) seen = true; else if (seen) { tE = i / 50; break; } }
if (!tE) throw new Error('could not find the end of the red sync flash in the recording');
console.log('flash ends at video time', tE, 's; sound offset', sync.off.toFixed(3), 's');

// hook + footer overlay
const b2 = await chromium.launch(); const q = await b2.newPage({ viewport: { width: 1080, height: 1920 } });
await q.setContent(`<!doctype html><meta charset=utf-8><style>@font-face{font-family:F;src:url(data:font/woff2;base64,${fs.readFileSync(repo + 'music/fonts/fredoka-one.woff2').toString('base64')})}
body{margin:0;width:1080px;height:1920px;background:transparent;font-family:F,sans-serif;color:#1f1b3a;position:relative}
.h{position:absolute;left:40px;right:40px;top:70px;text-align:center;font-size:78px;line-height:1.14;background:#fff;border-radius:44px;padding:26px 20px;box-shadow:0 8px 0 rgba(31,27,58,.18)}
.f{position:absolute;left:0;right:0;bottom:60px;text-align:center}.f .a{display:inline-block;background:#e8590c;color:#fff;font-size:48px;border-radius:50px;padding:14px 46px}
.f .b{margin-top:20px;font-size:40px;background:#fff;display:inline-block;border-radius:30px;padding:6px 26px}</style>
<div class=h>${g.hook}</div><div class=f><div class=a>Free game: no sign-up ▶ link in bio</div><br><div class=b>🎵 Melody &amp; Barnaby's Music Nuggets</div></div>`);
await q.evaluate(() => document.fonts.ready); await q.screenshot({ path: here + 'out/_ov.png', omitBackground: true }); await b2.close();

const REC_LAG = 0.36;  // MediaRecorder delivers sound about 0.36 s late (measured: tap times vs sound onsets in the recording)
const INTRO = [  // parent-facing; no "free forever" promises (see the free-promise memory)
  ['Why play music games?', 'The best way to learn<br>is by doing. 🎵'],
  ['How easy are they?', 'Nothing to download.<br>No sign-up. No adverts.'],
  ['What do you need?', 'Any phone, tablet<br>or computer with<br>a web browser. 📱'],
  ['How do you get there?', 'Tap the link in our bio<br>or in the video description.'],
  ['Let’s look at a typical game…', 'Name That Part ▶'],
];
const CARD_S = 3.6;
const b3 = await chromium.launch(); const c = await b3.newPage({ viewport: { width: 1080, height: 1920 } });
const cardHtml = (h, t) => `<!doctype html><meta charset=utf-8><style>@font-face{font-family:F;src:url(data:font/woff2;base64,${fs.readFileSync(repo + 'music/fonts/fredoka-one.woff2').toString('base64')})}
body{margin:0;width:1080px;height:1920px;background:radial-gradient(ellipse at 50% 38%,#fff3c4 0%,#d9eef7 55%,#bfe3f5 100%);font-family:F,sans-serif;color:#1f1b3a;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 70px;box-sizing:border-box}
h1{font-size:112px;line-height:1.1;margin:0 0 60px;color:#e8590c}p{font-size:70px;line-height:1.3;margin:0}
.b{position:absolute;bottom:90px;left:0;right:0;font-size:42px;opacity:.85}</style><h1>${h}</h1><p>${t}</p><div class=b>🎵 Melody &amp; Barnaby's Music Nuggets</div>`;
const cards = [];
for (let i = 0; i < INTRO.length; i++) { await c.setContent(cardHtml(...INTRO[i])); await c.evaluate(() => document.fonts.ready); const f = here + `out/_card${i}.png`; await c.screenshot({ path: f }); cards.push(f); }
await b3.close();

const music = here + 'assets/sixes_and_sevens_flow1.mp3';  // Andrew's own piece; one continuous play, no looping
const out = here + `out/${id}_demo.mp4`;
const inputs = [];
cards.forEach(f => inputs.push('-loop', 1, '-framerate', 30, '-t', CARD_S, '-i', f));
inputs.push('-ss', tE, '-i', raw, '-i', here + 'out/_ov.png', '-i', music, '-ss', (sync.off + REC_LAG).toFixed(3), '-i', recFile);
const n = cards.length;
const rawDur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw]).stdout), total = n * CARD_S + rawDur - tE;
const chain = cards.map((_, i) => `[${i}:v]scale=1080:1920,setsar=1,format=yuv420p[c${i}]`).join(';')
  + `;[${n}:v]scale=1080:1920,setsar=1[a];[a][${n + 1}:v]overlay=0:0,format=yuv420p[d];`
  + cards.map((_, i) => `[c${i}]`).join('') + `[d]concat=n=${n + 1}:v=1:a=0[v];[${n + 2}:a]atrim=0:${total.toFixed(2)},afade=t=in:d=1.5,afade=t=out:st=${(total - 3).toFixed(2)}:d=3,volume=1.8,volume=0.5:enable='gte(t,${n * CARD_S})',aformat=sample_rates=44100:channel_layouts=stereo[bed];[${n + 3}:a]adelay=${Math.round(n * CARD_S * 1000)}:all=1,volume=1.6,aformat=sample_rates=44100:channel_layouts=stereo[gs];[bed][gs]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[m]`;
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', chain, '-map', '[v]', '-map', '[m]', '-t', total.toFixed(2),
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', 30, '-c:a', 'aac', '-b:a', '192k', out], { stdio: 'inherit' });
console.log(r.status === 0 ? 'ok ' + out : 'FAILED');
