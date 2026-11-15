// node shot.cjs k30 → k30-cover.png: the cover page at 2×, scaled down to 1080×1920 with ffmpeg (lanczos).
const { chromium } = require('../../tools/pw.cjs');
const path = require('path'), { execFileSync } = require('child_process');
const name = process.argv[2] || 'k30';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, name, 'index.html')); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 }); await p.waitForTimeout(200);
  const raw = path.resolve(__dirname, name, 'cover@2x.png'), out = path.resolve(__dirname, name + '-cover.png'); await p.screenshot({ path: raw }); await b.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-vf', 'scale=1080:1920:flags=lanczos', out]); console.log('errors:', JSON.stringify(errs), '→', path.basename(out));
})();
