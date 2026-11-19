// Records the live advent calendar (served locally by `npm run serve` in ~/Projects/advent-calendar) as phone footage.
// node record.mjs  -> raw/footage.webm   (390x844 phone view). NO #for= in the address: the public promo must show no family names.
import { chromium } from '/Users/andrewlord/Projects/family-reel/node_modules/playwright/index.mjs';
import fs from 'fs';
const here = new URL('.', import.meta.url).pathname;
fs.rmSync(here + 'raw', { recursive: true, force: true }); fs.mkdirSync(here + 'raw', { recursive: true });
const b = await chromium.launch({ args: ['--mute-audio'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  recordVideo: { dir: here + 'raw', size: { width: 780, height: 1688 } } });
const page = await ctx.newPage();
const T0 = Date.now(); const mark = n => console.log(n, ((Date.now() - T0) / 1000).toFixed(1));
await page.goto('http://localhost:8765/?day=7&mute&reset'); await page.waitForTimeout(3200); mark('opening');
await page.click('#open'); await page.waitForTimeout(3500); mark('calendar');
await page.click('.door[data-n="7"]'); await page.waitForTimeout(2200); mark('door');
const s = await page.evaluate(async () => (await import('./js/windows/day07.js')).default.steps.find(x => x.type === 'trace'));
for (let c = 0; c < 6; c++) { if (await page.$('.startdot')) break; if (!(await page.$('#pActions .btn.go'))) { await page.waitForTimeout(500); continue; } await page.waitForTimeout(1800); await page.click('#pActions .btn.go'); await page.waitForTimeout(1200); }
mark('trace-start'); await page.waitForTimeout(1500);
const box = await page.$eval('#pStage', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
const sc = ([x, y]) => [box.x + ((x - 420) / 1080) * box.w, box.y + (y / 1080) * box.w];
const pts = s.path; await page.mouse.move(...sc(pts[0])); await page.mouse.down();
for (const p of pts) { await page.mouse.move(...sc(p), { steps: 6 }); await page.waitForTimeout(40); }
await page.mouse.up(); mark('traced'); await page.waitForTimeout(2800); mark('end');
await ctx.close(); await b.close();
const v = fs.readdirSync(here + 'raw').filter(f => f.endsWith('.webm'))[0]; fs.renameSync(here + 'raw/' + v, here + 'raw/footage.webm'); console.log('ok');
