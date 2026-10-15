// The trader's pages: state A (sessions 1-23) and state B (all 31). Analytics per session, sessions list, journal, dashboard.
//   node pages.cjs <data.json> <outdir>
const { open, wait, inject, APP } = require('./common.cjs');
const fs = require('fs');
const [DATA, OUT] = process.argv.slice(2);
const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const upTo = (n) => { const ids = new Set(all.sessions.slice(0, n).map((s) => s.id)); return { sessions: all.sessions.slice(0, n), trades: all.trades.filter((t) => ids.has(t.sessionId)), strategies: all.strategies }; };
const PARK = [720, 28];
(async () => {
  const { b, page } = await open();
  fs.mkdirSync(OUT, { recursive: true });
  const shot = async (name, full) => { await page.mouse.move(...PARK); await wait(400); await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 92, fullPage: !!full }); };
  for (const [n, list] of [[23, [23, 'all']], [31, [24, 25, 26, 27, 28, 29, 30, 31, 'all']]]) {
    await page.goto(`${APP}/dashboard`); await wait(1500);
    await inject(page, upTo(n)); await page.reload(); await wait(2500);
    await shot(`s${n}-dashboard`);
    await page.goto(`${APP}/sessions`); await wait(2500); await shot(`s${n}-sessions`); await shot(`s${n}-sessions-full`, true);
    await page.goto(`${APP}/journal`); await wait(2500); await shot(`s${n}-journal`);
    for (const k of list) {
      const id = k === 'all' ? 'all' : `se_e1_${String(k).padStart(2, '0')}`;
      await page.goto(`${APP}/analytics?session=${id}`); await wait(2500);
      await shot(`s${n}-an-${k}`); if (k === 23 || k === 31 || k === 'all') await shot(`s${n}-an-${k}-full`, true);
    }
  }
  await b.close();
})();
