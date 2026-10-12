// Saves a reel's first frame as a lossless PNG (the cover). usage: node cover.cjs <reel-dir> <out.png> [t=0]
const { chromium } = require(require('path').join(__dirname, '../tools/pw.cjs'));
const path = require('path');
(async () => {
  const [,, dir, out, t] = process.argv; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(dir, 'index.html')); await p.waitForFunction(() => window.ready === true);
  await p.evaluate((t) => window.render(t), +(t || 0)); await p.screenshot({ path: out, type: 'png' }); await b.close();
})();
