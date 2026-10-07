// node render.mjs video1  -> out/video1/video1_v2.mp4   (frame-by-frame: renderAt(t) is a pure function of time, so sync cannot drift)
import { chromium } from '/Users/andrewlord/Projects/family-reel/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import fs from 'fs';
const name = process.argv[2] || 'video1';
const range = (process.argv[3] || '').split('-').map(Number);          // optional "from-to" seconds for a quick partial render
const dir = new URL('.', import.meta.url).pathname;
const tl = JSON.parse(fs.readFileSync(`${dir}out/${name}/timeline.json`));
const FPS = tl.fps, t0 = range[0] || 0, t1 = range[1] || tl.duration;
const out = `${dir}out/${name}/${name}_v2${range[0] !== undefined && range.length === 2 && !isNaN(range[0]) ? '_part' : ''}.mp4`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(`http://localhost:8767/v2/engine.html?v=${name}`); await p.waitForFunction('window.READY===true');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-ss', String(t0), '-t', String(t1 - t0), '-i', `${dir}out/${name}/mix.wav`, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11,pan=stereo|c0=c0|c1=c0,aresample=44100',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-ar', '44100', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', '-shortest', out]);
ff.stderr.on('data', d => process.stderr.write(d));
const n = Math.round((t1 - t0) * FPS);
for (let i = 0; i < n; i++) {
  await p.evaluate(t => window.renderAt(t), t0 + i / FPS);
  const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 300 === 0) console.log(`frame ${i}/${n}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('wrote', out);
