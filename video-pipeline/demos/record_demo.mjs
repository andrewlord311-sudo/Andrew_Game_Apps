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
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1,
  recordVideo: { dir: here + 'out/_rec', size: { width: 1080, height: 1920 } } });
const p = await ctx.newPage();
await p.addInitScript(() => { localStorage.setItem('tga_no_count', '1');
  addEventListener('DOMContentLoaded', () => { const d = document.createElement('div');
    d.style.cssText = 'position:fixed;zoom:.588;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.55);border:4px solid #e8590c;pointer-events:none;z-index:99999;left:-99px;top:-99px;transition:transform .12s';
    document.body.appendChild(d);
    addEventListener('mousemove', e => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => d.style.transform = 'scale(.7)', true); addEventListener('mouseup', () => d.style.transform = '', true); }); });
await p.goto(SITE + g.file + '?nocount=1'); await p.evaluate(() => { document.documentElement.style.zoom = 1.7; document.body.style.cssText += ';min-height:0;align-items:flex-start;padding-top:170px'; }); await p.waitForTimeout(2500);
if (g.pre) await g.pre(p);
for (let i = 0; i < g.rounds; i++) { await p.waitForTimeout(1500); await g.answer(p); await p.waitForTimeout(1800); }
await p.waitForTimeout(1500);
const vid = await p.video().path(); await ctx.close(); await b.close();
const raw = here + `out/${id}_raw.webm`; fs.copyFileSync(vid, raw); fs.rmSync(here + 'out/_rec', { recursive: true, force: true });

// hook + footer overlay
const b2 = await chromium.launch(); const q = await b2.newPage({ viewport: { width: 1080, height: 1920 } });
await q.setContent(`<!doctype html><meta charset=utf-8><style>@font-face{font-family:F;src:url(data:font/woff2;base64,${fs.readFileSync(repo + 'music/fonts/fredoka-one.woff2').toString('base64')})}
body{margin:0;width:1080px;height:1920px;background:transparent;font-family:F,sans-serif;color:#1f1b3a;position:relative}
.h{position:absolute;left:40px;right:40px;top:70px;text-align:center;font-size:78px;line-height:1.14;background:#fff;border-radius:44px;padding:26px 20px;box-shadow:0 8px 0 rgba(31,27,58,.18)}
.f{position:absolute;left:0;right:0;bottom:60px;text-align:center}.f .a{display:inline-block;background:#e8590c;color:#fff;font-size:48px;border-radius:50px;padding:14px 46px}
.f .b{margin-top:20px;font-size:40px;background:#fff;display:inline-block;border-radius:30px;padding:6px 26px}</style>
<div class=h>${g.hook}</div><div class=f><div class=a>Free game: no sign-up ▶ link in bio</div><br><div class=b>🎵 Melody &amp; Barnaby's Music Nuggets</div></div>`);
await q.evaluate(() => document.fonts.ready); await q.screenshot({ path: here + 'out/_ov.png', omitBackground: true }); await b2.close();

const music = '/Users/andrewlord/Library/Mobile Documents/iCloud~md~obsidian/Documents/Andrew Second Brain/Claude Projects/Kids learning/Music teaching/Videos and channel/intro outro.mp3';
const out = here + `out/${id}_demo.mp4`;
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-i', here + 'out/_ov.png', '-stream_loop', '-1', '-i', music,
  '-filter_complex', '[0:v]scale=1080:1920,setsar=1[a];[a][1:v]overlay=0:0[v];[2:a]volume=0.35,aformat=sample_rates=44100:channel_layouts=stereo[m]',
  '-map', '[v]', '-map', '[m]', '-shortest', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', 30, '-c:a', 'aac', '-b:a', '192k', out], { stdio: 'inherit' });
console.log(r.status === 0 ? 'ok ' + out : 'FAILED');
