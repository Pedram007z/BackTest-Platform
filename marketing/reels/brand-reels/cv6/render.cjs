// Renders cv6's views to out/: each view as <id>.jpg (1080×1920), the turnaround (front, three-quarter, side, back) side
// by side in out/turnaround.jpg, and the three poses in out/poses.jpg, and the navy outfit in out/navy.jpg.
//   node render.cjs [only-id]
const { chromium } = require('../../tools/pw.cjs');
const { execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.join(__dirname, 'page', 'index.html')); await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  const ids = await p.evaluate(() => window.IDS), only = process.argv[2];
  for (let i = 0; i < ids.length; i++) { if (only && ids[i] !== only) continue; await p.evaluate((i) => window.view(i), i);
    const png = path.join(out, `${ids[i]}.png`); await p.screenshot({ path: png }); execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', png.replace('.png', '.jpg')]); console.log(ids[i]); }
  await b.close();
  const strip = (names, w, file) => { const f = names.map((n) => path.join(out, `${n}.png`)); if (!f.every((x) => fs.existsSync(x))) return;
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...f.flatMap((x) => ['-i', x]), '-filter_complex', f.map((_, i) => `[${i}]crop=${w}:1540:${(1080 - w) / 2}:190[p${i}]`).join(';') + ';' + f.map((_, i) => `[p${i}]`).join('') + `hstack=${f.length}`, '-q:v', '2', path.join(out, file)]); };
  strip(['front', 'three-quarter', 'side', 'back'], 700, 'turnaround.jpg'); strip(['present', 'think', 'wave'], 1040, 'poses.jpg'); strip(['navy-front', 'navy-three-quarter'], 700, 'navy.jpg');
  console.log('errors:', JSON.stringify(errs));
})();
