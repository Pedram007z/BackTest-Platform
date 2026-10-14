// Saves the six store screenshots of index.html as out/01.png … out/06.png (1080x1920) and a JPEG copy of each.
// usage: node render.cjs
const { chromium } = require('../reels/tools/pw.cjs');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('requestfailed', (r) => errs.push('failed ' + r.url()));
  await p.goto('file://' + path.join(__dirname, 'index.html'));
  await p.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  const n = await p.locator('section.shot').count();
  for (let i = 1; i <= n; i++) {
    const png = path.join(out, `${String(i).padStart(2, '0')}.png`);
    await p.locator(`#shot${i}`).screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', png.replace('.png', '.jpg')]);
  }
  console.log('shots', n, 'errors', JSON.stringify(errs));
  await b.close();
})();
