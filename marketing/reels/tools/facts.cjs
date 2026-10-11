// Prints the numbers a reel computes in the page (window.facts) and any page errors.
// usage: node tools/facts.cjs <reel-dir>
const { chromium } = require('./pw.cjs');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2], 'index.html')); await p.waitForFunction(() => window.ready === true);
  console.log(JSON.stringify(await p.evaluate(() => window.facts || null)), 'errors', JSON.stringify(errs)); await b.close();
})();
