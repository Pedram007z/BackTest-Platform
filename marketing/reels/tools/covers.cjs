// Renders covers/cover.html → reelN-cover.jpg (1080×1920) and reelN-cover-grid-preview.jpg (the 3:4 profile-grid crop).
// usage: node tools/covers.cjs covers <out-dir> 1 2 3 4
const { chromium } = require('./pw.cjs');
const path = require('path');
const [,, dir, out, ...ns] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(dir, 'cover.html'));
  await p.waitForFunction(() => window.ready === true);
  for (const n of ns) {
    await p.evaluate((n) => window.show(n), +n);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/reel${n}-cover.jpg`, type: 'jpeg', quality: 95 });
    await p.screenshot({ path: `${out}/reel${n}-cover-grid-preview.jpg`, type: 'jpeg', quality: 90, clip: { x: 0, y: 240, width: 1080, height: 1440 } });
  }
  await b.close();
})();
