// Dumps every flap flip of the board (window.CLICKS: [time, board]) to clicks.json for sound.py.
//   node clicks.cjs
const { chromium } = require('../../tools/pw.cjs');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(__dirname, 'board', 'index.html')); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const c = await p.evaluate(() => window.CLICKS); fs.writeFileSync(path.join(__dirname, 'clicks.json'), JSON.stringify(c)); console.log(c.length, 'clicks'); await b.close();
})();
