// Screenshots a reel at chosen times, to check layout without rendering the whole video.
// usage: node tools/stills.cjs <reel-dir> <out-dir> 2.6 8.6 13.5 …
const { chromium } = require('./pw.cjs');
const path = require('path');
const [,, dir, out, ...times] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(dir, 'index.html'));
  await p.waitForFunction(() => window.ready === true);
  for (const t of times) { await p.evaluate((t) => window.render(t), +t); await p.screenshot({ path: `${out}/t${String(t).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 80 }); }
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
