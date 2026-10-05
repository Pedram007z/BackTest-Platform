import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.argv[2], SRC = process.argv[3] || '../svg';
const jobs = [
  ['app-icon.svg', [1024, 512, 192, 180, 64]], ['favicon.svg', [32, 16]], ['instagram-profile.svg', [1080]],
  ['logo-fa-dark.svg', ['x4']], ['logo-fa-light.svg', ['x4']], ['logo-en-dark.svg', ['x4']], ['logo-en-light.svg', ['x4']],
  ['logo-stacked-dark.svg', ['x4']], ['logo-stacked-light.svg', ['x4']],
];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
for (const [file, sizes] of jobs) {
  const svg = fs.readFileSync(SRC + '/' + file, 'utf8');
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  for (const s of sizes) {
    const k = typeof s === 'string' ? +s.slice(1) : s / w;
    const W = Math.round(w * k), H = Math.round(h * k);
    await p.setViewportSize({ width: W, height: H });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="[^"]+" height="[^"]+"/, `width="${W}" height="${H}"`)}</body></html>`);
    const name = file.replace('.svg', typeof s === 'string' ? `@4x.png` : (sizes.length > 1 || file.startsWith('app') ? `-${s}.png` : '.png'));
    await p.screenshot({ path: `${OUT}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
  }
}
await b.close();
