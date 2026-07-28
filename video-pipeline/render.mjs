import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT_DIR = path.resolve('./render_out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 720;

async function recordSegment({ name, url, durationMs, onReady }) {
  const segDir = path.join(OUT_DIR, name);
  fs.rmSync(segDir, { recursive: true, force: true });
  fs.mkdirSync(segDir, { recursive: true });

  const browser = await chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: segDir, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.error(`[${name}] pageerror:`, err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error(`[${name}] console error:`, msg.text());
  });

  await page.goto(url, { waitUntil: 'load' });
  await onReady(page);
  await page.waitForTimeout(durationMs);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  // Playwright finalizes the video file only after context.close(); path is known beforehand but file write completes on close.
  const finalPath = path.join(OUT_DIR, `${name}.webm`);
  fs.renameSync(videoPath, finalPath);
  fs.rmSync(segDir, { recursive: true, force: true });
  console.log(`[${name}] recorded -> ${finalPath}`);
  return finalPath;
}

const segment = process.argv[2];

if (segment === 'intro' || !segment) {
  await recordSegment({
    name: 'intro',
    url: 'http://localhost:8960/bumper_render.html?mode=intro',
    durationMs: 12500,
    onReady: async (page) => {
      await page.evaluate(() => window.startRender());
    },
  });
}

if (segment === 'outro' || !segment) {
  await recordSegment({
    name: 'outro',
    url: 'http://localhost:8960/bumper_render.html?mode=outro',
    durationMs: 12500,
    onReady: async (page) => {
      await page.evaluate(() => window.startRender());
    },
  });
}

if (segment === 'main' || !segment) {
  await recordSegment({
    name: 'main',
    url: 'http://localhost:8960/video1_main.html',
    durationMs: 68900,
    onReady: async (page) => {
      await page.evaluate(() => window.startShow());
    },
  });
}

console.log('Done.');
