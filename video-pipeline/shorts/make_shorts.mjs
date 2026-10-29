// node make_shorts.mjs [clipId ...]   -> out/<id>.mp4  (1080x1920, for YouTube Shorts / Reels / TikTok)
// Cuts a window out of a finished 16:9 Nugget video, puts it on a blurred copy of itself, and adds a hook line,
// captions (from the video's .srt) and a footer as transparent PNG overlays (this ffmpeg has no drawtext/libass).
// Reuses the finished video's audio, so it costs no ElevenLabs credits.
import { chromium } from '/Users/andrewlord/Projects/family-reel/node_modules/playwright/index.mjs';
import { spawnSync } from 'child_process';
import fs from 'fs';
const repo = new URL('../../', import.meta.url).pathname;
const here = new URL('.', import.meta.url).pathname;
const clips = JSON.parse(fs.readFileSync(here + 'clips.json')).filter(c => process.argv.length < 3 || process.argv.slice(2).includes(c.id));
fs.mkdirSync(here + 'out', { recursive: true });

const ts = s => { const m = s.match(/(\d+):(\d+):(\d+),(\d+)/); return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000; };
const parseSrt = txt => txt.trim().split(/\n\s*\n/).map(b => { const l = b.split('\n'); const [a, z] = l[1].split(' --> ');
  return { a: ts(a), z: ts(z), text: l.slice(2).join(' ') }; });

const html = `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:F;src:url(data:font/woff2;base64,${fs.readFileSync(repo + 'music/fonts/fredoka-one.woff2').toString('base64')})}
*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;background:transparent;font-family:F,sans-serif;color:#1f1b3a;position:relative;overflow:hidden}
#hook{position:absolute;left:60px;right:60px;top:230px;text-align:center;font-size:82px;line-height:1.14;white-space:nowrap;display:none}
#hook b{color:#e8590c}
#cap{position:absolute;left:50px;right:50px;top:1130px;text-align:center;font-size:66px;line-height:1.2;display:none}
#cap span{background:#fff;border-radius:34px;padding:10px 30px;box-decoration-break:clone;-webkit-box-decoration-break:clone;box-shadow:0 6px 0 rgba(31,27,58,.18)}
#foot{position:absolute;left:0;right:0;top:1400px;text-align:center;display:none}
#foot .a{display:inline-block;background:#e8590c;color:#fff;font-size:46px;border-radius:50px;padding:14px 44px}
#foot .b{margin-top:22px;font-size:40px;opacity:.85}
</style><div id=hook></div><div id=cap><span></span></div><div id=foot><div class=a id=ftxt>Full lesson + free game ▶</div><div class=b>🎵 Melody &amp; Barnaby's Music Nuggets</div></div>`;

const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready);
const bgf = here + 'out/_bg.png';
await p.evaluate(() => { document.body.style.background = 'radial-gradient(ellipse at 50% 38%, #fff3c4 0%, #d9eef7 55%, #bfe3f5 100%)'; });
await p.screenshot({ path: bgf });
await p.evaluate(() => { document.body.style.background = 'transparent'; });
const shot = async (file, show) => { await p.evaluate(s => { for (const id of ['hook', 'cap', 'foot']) document.getElementById(id).style.display = s.includes(id) ? 'block' : 'none'; }, show);
  await p.screenshot({ path: file, omitBackground: true }); };

for (const c of clips) {
  const dur = c.end - c.start, tmp = here + 'out/_' + c.id + '/'; fs.mkdirSync(tmp, { recursive: true });
  await p.evaluate(([h, f]) => { document.getElementById('hook').innerHTML = h; document.getElementById('ftxt').textContent = f || 'Full lesson + free game ▶'; }, [c.hook, c.footer]);
  await shot(tmp + 'static.png', ['hook', 'foot']);
  const cues = parseSrt(fs.readFileSync(repo + c.srt, 'utf8')).filter(q => q.a >= c.start - 0.2 && q.z <= c.end + 0.2);
  const inputs = ['-ss', c.start, '-t', dur, '-i', repo + c.src, '-loop', 1, '-framerate', 30, '-t', dur, '-i', bgf, '-loop', 1, '-framerate', 30, '-t', dur, '-i', tmp + 'static.png'];
  let chain = `[0:v]crop=1280:656:0:64,scale=1080:-2[fg];[1:v][fg]overlay=0:500[v0];[v0][2:v]overlay=0:0[v1]`;
  let last = 'v1', n = 3;
  for (const q of cues) {
    const f = `${tmp}cap${n}.png`;
    await p.evaluate(t => { document.querySelector('#cap span').textContent = t; }, q.text.replace(/\s+/g, ' '));
    await shot(f, ['cap']);
    inputs.push('-loop', 1, '-framerate', 30, '-t', dur, '-i', f);
    const a = Math.max(0, q.a - c.start).toFixed(3), z = Math.min(dur, q.z - c.start + 0.15).toFixed(3);
    chain += `;[${last}][${n}:v]overlay=0:0:enable='between(t,${a},${z})'[v${n}]`; last = 'v' + n; n++;
  }
  const out = here + 'out/' + c.id + '.mp4';
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', chain, '-map', `[${last}]`, '-map', '0:a',
    '-af', `afade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-r', 30, '-c:a', 'aac', '-b:a', '192k', '-ar', 44100, '-ac', 2, '-t', dur, out], { stdio: 'inherit' });
  console.log(r.status === 0 ? `ok ${out} (${dur.toFixed(1)}s, ${cues.length} captions)` : `FAILED ${c.id}`);
}
await b.close();
