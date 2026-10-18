/**
 * Renders the $COAL X kit into ../stoker/ from the kit page (kit.tsx), with the dev server running
 * (`npm run dev`, default http://localhost:5173; set KIT_URL to change it).
 *
 *   node konten-x/stoker-kit/render.mjs                 every asset
 *   node konten-x/stoker-kit/render.mjs og banner       just these
 *   node konten-x/stoker-kit/render.mjs receipt --amount=4,120,330 --n=7 --tx=0xabc…def --date="Oct 21, 14:02"
 *
 * Needs Google Chrome (CHROME to point elsewhere) and the ffmpeg that ships with the Remotion studio
 * in konten-x/studio (FFMPEG to point elsewhere) for the film and the GIF.
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'stoker');
const BASE = process.env.KIT_URL || 'http://localhost:5173';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG = process.env.FFMPEG || join(HERE, '..', 'studio', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe');

/** name, size, and for films the frame count and rate */
const ASSETS = {
  'tile-gauge': { w: 984, h: 252, file: '_tiles/tile-gauge.png' },
  'tile-whistle': { w: 984, h: 252, file: '_tiles/tile-whistle.png' },
  'tile-coal': { w: 984, h: 252, file: '_tiles/tile-coal.png' },
  'tile-furnace': { w: 984, h: 252, file: '_tiles/tile-furnace.png' },
  ...Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`tile-class-${i}`, { w: 282, h: 520, file: `_tiles/tile-class-${i}.png` }])),
  logo: { w: 1000, h: 1000, file: '01-logo-x.png' },
  banner: { w: 1500, h: 500, file: '02-banner-x.png' },
  og: { w: 1200, h: 630, file: '03-link-preview.png' },
  prelaunch: { w: 1080, h: 1350, file: '04-prelaunch.mp4', frames: 240, fps: 24 },
  burn: { w: 720, h: 720, file: '05-burn.gif', frames: 90, fps: 12 },
  how: { w: 1080, h: 1350, file: '06-how-it-burns.png' },
  classes: { w: 1600, h: 900, file: '07-engine-classes.png' },
  meme: { w: 1080, h: 1080, file: '08-meme-firebox.png' },
  receipt: { w: 1080, h: 1350, file: '09-template-burn.png' },
};

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split(/=(.*)/s).slice(0, 2)));
const wanted = args.filter((a) => !a.startsWith('--'));
const names = wanted.length ? wanted : Object.keys(ASSETS);

mkdirSync(join(OUT, '_tiles'), { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: process.env.SOFT_GL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] });

for (const name of names) {
  const a = ASSETS[name];
  if (!a) throw new Error(`unknown asset ${name}`);
  const params = new URLSearchParams({ shot: name, ...(name === 'receipt' ? flags : {}) });
  const page = await (await browser.newContext({ viewport: { width: a.w, height: a.h } })).newPage();
  page.on('pageerror', (e) => console.error(name, String(e)));
  await page.goto(`${BASE}/konten-x/stoker-kit/index.html?${params}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const usesMap = !['logo', 'how', 'classes'].includes(name);
  if (usesMap) await page.waitForFunction(() => !!window.__stokerKit && !!window.__kitFrame, null, { timeout: 30000 });
  else await page.waitForTimeout(800);
  const target = join(OUT, a.file);

  if (!a.frames) {
    // let the fire, smoke and lamps settle for a few seconds of world time, then take the frame
    if (usesMap) await page.evaluate(() => { for (let i = 0; i < 70; i++) window.__kitFrame(0, 1); });
    await page.screenshot({ path: target });
    if (name === 'og') copyFileSync(target, join(HERE, '..', '..', 'public', 'og-image.png'));
    if (name === 'logo') {
      const small = join(OUT, '01-logo-x-400.png');
      execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', target, '-vf', 'scale=400:400:flags=neighbor', small]);
    }
  } else {
    const dir = join(OUT, `_frames-${name}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    // warm the fire without starting the film
    await page.evaluate((n) => {
      window.__kitFrame(0, n);
      for (let i = 0; i < 50; i++) window.__stokerKit.step(0.05);
    }, a.frames);
    for (let i = 0; i < a.frames; i++) {
      await page.evaluate(([i, n]) => window.__kitFrame(i, n), [i, a.frames]);
      await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`) });
    }
    const input = ['-y', '-loglevel', 'error', '-framerate', String(a.fps), '-i', join(dir, '%04d.png')];
    if (a.file.endsWith('.mp4')) {
      execFileSync(FFMPEG, [...input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', target]);
    } else {
      execFileSync(FFMPEG, [...input, '-vf', 'split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=none', '-loop', '0', target]);
    }
    rmSync(dir, { recursive: true, force: true });
  }
  console.log('rendered', a.file);
  await page.context().close();
}
await browser.close();
if (!existsSync(OUT)) process.exit(1);
