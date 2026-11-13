// Renders cv4's character sheet: the mascot in four poses (window.renderSheet), side by side in out/character-sheet.jpg.
//   node sheet.cjs
const { chromium } = require('../../tools/pw.cjs');
const { execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'page', 'index.html')); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const files = [];
  for (let k = 0; k < 4; k++) { await p.evaluate((k) => window.renderSheet(k), k); const f = path.join(out, `pose-${k + 1}.png`); await p.screenshot({ path: f }); files.push(f); }
  await b.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}]crop=900:1300:90:330,scale=540:-1[p${i}]`).join(';') + ';' + files.map((_, i) => `[p${i}]`).join('') + 'hstack=4', '-q:v', '2', path.join(out, 'character-sheet.jpg')]);
  files.forEach((f) => fs.unlinkSync(f)); console.log('errors:', JSON.stringify(errs));
})();
