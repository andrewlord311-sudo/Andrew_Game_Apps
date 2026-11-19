// node compose.mjs -> ../out/short36_advent_calendar.mp4 (1080x1920). Needs raw/footage.webm from record.mjs.
import { chromium } from '/Users/andrewlord/Projects/family-reel/node_modules/playwright/index.mjs';
import { spawnSync } from 'child_process';
import fs from 'fs';
const here = new URL('.', import.meta.url).pathname, repo = new URL('../../../', import.meta.url).pathname;
const bgf = here + '../out/_bg.png', out = here + '../out/short36_advent_calendar.mp4';
const jingle = '/Users/andrewlord/Library/Mobile Documents/iCloud~md~obsidian/Documents/Andrew Second Brain/Claude Projects/Kids learning/Music teaching/Videos and channel/intro outro.mp3';
// segments of the raw footage [start, end, speed]
const segs = [[0.6, 3.4, 1], [4.5, 7.2, 1], [10.3, 12.6, 1], [16.3, 26.3, 1.8], [26.3, 28.8, 1]];
const lens = segs.map(([a, z, s]) => (z - a) / s), body = lens.reduce((a, b) => a + b, 0), tail = 3.2, dur = body + tail;
const hooks = [[0, 3, 'A free <b>advent calendar</b>'], [3, 6, 'A window <b>every day</b>'], [6, body - 0.2, 'Follow the <b>donkey</b>'], [body, dur, 'Opens <b>1 December</b>']];
const html = `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:F;src:url(data:font/woff2;base64,${fs.readFileSync(repo + 'music/fonts/fredoka-one.woff2').toString('base64')})}
*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;background:transparent;font-family:F,sans-serif;color:#1f1b3a;position:relative}
#hook{position:absolute;left:40px;right:40px;top:150px;text-align:center;font-size:84px;line-height:1.14}#hook b{color:#e8590c}
#foot{position:absolute;left:0;right:0;top:1780px;text-align:center}
#foot .a{display:inline-block;background:#e8590c;color:#fff;font-size:46px;border-radius:50px;padding:14px 44px}
#foot .b{font-size:36px;opacity:.85;margin-top:14px}</style><div id=hook></div><div id=foot><div class=a>Link in bio ▶</div></div>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready);
const tmp = here + 'raw/'; const inputs = []; let chain = '';
// footage -> 638x1380, bottom 20px cropped (hides the "preview: day" label)
const parts = segs.map(([a, z, s], i) => `[0:v]trim=${a}:${z},setpts=(PTS-STARTPTS)/${s},crop=390:824:0:0,scale=638:1348:flags=lanczos[s${i}]`).join(';');
chain = parts + ';' + segs.map((_, i) => `[s${i}]`).join('') + `concat=n=${segs.length}:v=1,tpad=stop_mode=clone:stop_duration=${tail}[fg];[1:v][fg]overlay=221:330:shortest=1[v0]`;
let last = 'v0', n = 3;
for (const [a, z, t] of hooks) {
  await p.evaluate(h => { document.getElementById('hook').innerHTML = h; }, t);
  const f = `${tmp}hook${n}.png`; await p.screenshot({ path: f, omitBackground: true });
  inputs.push('-loop', 1, '-framerate', 30, '-t', dur, '-i', f);
  chain += `;[${last}][${n - 1}:v]overlay=0:0:enable='between(t,${a},${z})'[v${n}]`; last = 'v' + n; n++;
}
await p.evaluate(() => { document.getElementById('hook').innerHTML = ''; }); await p.screenshot({ path: tmp + 'foot.png', omitBackground: true });
inputs.push('-loop', 1, '-framerate', 30, '-t', dur, '-i', tmp + 'foot.png');
chain += `;[${last}][${n - 1}:v]overlay=0:0:enable='gte(t,${body})'[vf]`;
// inputs order: 0 footage, 1 bg, then hooks (2..), foot, then jingle
const args = ['-y', '-loglevel', 'error', '-i', tmp + 'footage.webm', '-loop', 1, '-framerate', 30, '-t', dur, '-i', bgf, ...inputs, '-i', jingle];
const ai = 2 + hooks.length + 1;
const r = spawnSync('ffmpeg', [...args, '-filter_complex', chain.replace(/\[(\d+):v\]overlay=0:0:enable/g, (m, d) => `[${+d}:v]overlay=0:0:enable`), '-map', '[vf]', '-map', `${ai}:a`,
  '-af', `volume=0.55,afade=t=in:d=0.5,afade=t=out:st=${(dur - 1).toFixed(2)}:d=1`, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', 30, '-c:a', 'aac', '-b:a', '192k', '-t', dur.toFixed(2), out], { stdio: 'inherit' });
console.log(r.status === 0 ? `ok ${out} ${dur.toFixed(1)}s` : 'FAILED'); await b.close();
