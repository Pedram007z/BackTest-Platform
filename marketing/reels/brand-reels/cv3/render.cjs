// Renders every cover of cv3 to out/<n>-<id>.jpg (1080×1920), its 3:4 profile-grid crop to out/<n>-<id>-grid.jpg, and a
// 3×3 preview of the profile grid to out/grid-preview.jpg.
//   node render.cjs [only-index]
const { chromium } = require('../../tools/pw.cjs');
const { execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.join(__dirname, 'page', 'index.html')); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const n = await p.evaluate(() => window.N), ids = await p.evaluate(() => window.IDS), only = process.argv[2] !== undefined ? Number(process.argv[2]) : null, grids = [];
  for (let i = 0; i < n; i++) { if (only !== null && i !== only) continue; await p.evaluate((i) => window.render(i), i);
    const f = path.join(out, `${i + 1}-${ids[i]}.jpg`), png = f.replace('.jpg', '.png'); await p.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', f]); execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'crop=1080:1440:0:240', '-q:v', '2', f.replace('.jpg', '-grid.jpg')]); fs.unlinkSync(png); grids.push(f.replace('.jpg', '-grid.jpg')); }
  await b.close();
  if (grids.length === 9) execFileSync('ffmpeg', ['-v', 'error', '-y', ...grids.flatMap((g) => ['-i', g]), '-filter_complex', grids.map((_, i) => `[${i}]scale=360:480,pad=364:484:2:2:black[g${i}]`).join(';') + ';' + grids.map((_, i) => `[g${i}]`).join('') + 'xstack=inputs=9:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h3|w0_h0+h3|w0+w1_h0+h3', '-q:v', '2', path.join(out, 'grid-preview.jpg')]);
  console.log('errors:', JSON.stringify(errs), 'rendered', grids.length);
})();
