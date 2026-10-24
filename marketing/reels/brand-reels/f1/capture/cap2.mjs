// pass 2 (2×, JPEG): drawings and indicators on the real chart, then a buy played until it closes
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92 });
const { b, ctx, p, errs } = await open(`${B}/state.json`, 2);
await p.goto(APP + '/replay/se_mvmnj3l5ug9po'); await p.waitForTimeout(7000);
const fr = p.frames().find((f) => f !== p.mainFrame());
// start clean: remove this script's earlier drawings and indicators (the app's own lines stay)
console.log('cleared', await fr.evaluate(() => { const c = window.tradingViewApi.activeChart(); let n = 0;
  c.getAllShapes().forEach((x) => { if (['trend_line', 'fib_retracement'].includes(x.name)) { c.removeEntity(x.id); n++; } });
  c.getAllStudies().forEach((x) => { if (/Moving Average Exponential|Relative Strength/.test(x.name)) { c.removeEntity(x.id); n++; } }); return n; }));
// a fresh stretch of the market for the drawings
const nx = p.getByRole('button', { name: 'نمایش کندل بعدی' }); for (let i = 0; i < 30; i++) { await nx.click(); await p.waitForTimeout(250); }
await p.waitForTimeout(1500); await shot(p, 'e-start');
// drawings and indicators through the library's own API, on the real swing points of the visible candles
const pts = await fr.evaluate(async () => {
  const c = window.tradingViewApi.activeChart(), r = c.getVisibleRange(), d = (await c.exportData({ includeTime: true, includeSeries: true })).data.filter((x) => x[0] >= r.from && x[0] <= r.to);
  let lo = 0; d.forEach((x, i) => { if (x[3] < d[lo][3]) lo = i; });
  let hi = lo; for (let i = lo; i < d.length; i++) if (d[i][2] > d[hi][2]) hi = i;
  let hl = -1; for (let i = lo + 20; i < hi - 5; i++) if (hl < 0 || d[i][3] < d[hl][3]) hl = i;            // the deepest pull-back low on the way up
  let pb = Math.min(d.length - 1, hi + 5); for (let i = hi + 5; i < d.length; i++) if (d[i][3] < d[pb][3]) pb = i;
  return { lo: [d[lo][0], d[lo][3]], hl: [d[hl][0], d[hl][3]], hi: [d[hi][0], d[hi][2]] };
});
console.log('points', JSON.stringify(pts));
console.log('trend', await fr.evaluate(async (q) => { const c = window.tradingViewApi.activeChart(); return await c.createMultipointShape([{ time: q.lo[0], price: q.lo[1] }, { time: q.hl[0], price: q.hl[1] }], { shape: 'trend_line', overrides: { linecolor: '#22C58B', linewidth: 3, linestyle: 0, extendRight: true } }); }, pts));
await p.mouse.move(900, 450); await p.waitForTimeout(1500); await shot(p, 'e-trend');
console.log('fib', await fr.evaluate(async (q) => { const c = window.tradingViewApi.activeChart(); return await c.createMultipointShape([{ time: q.lo[0], price: q.lo[1] }, { time: q.hi[0], price: q.hi[1] }], { shape: 'fib_retracement' }); }, pts));
await p.mouse.move(900, 460); await p.waitForTimeout(1500); await shot(p, 'e-fib');
await fr.evaluate(async () => { const c = window.tradingViewApi.activeChart(); await c.createStudy('Moving Average Exponential', false, false, { length: 50 }); await c.createStudy('Relative Strength Index', false, false, { length: 14 }); });
await p.waitForTimeout(1200);
await p.mouse.click(700, 300); await p.waitForTimeout(400); await shot(p, 'e-indicators');
// buy, then step until it closes
await p.getByRole('button', { name: 'خرید', exact: true }).first().click(); await p.waitForTimeout(1500); await shot(p, 'f-buy');
await p.getByRole('button', { name: 'ثبت معامله' }).click(); await p.waitForTimeout(1500); await shot(p, 'f-placed');
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' }); let closedAt = 0;
for (let i = 1; i <= 80; i++) {
  await next.click(); await p.waitForTimeout(450); await shot(p, `f-step-${String(i).padStart(3, '0')}`);
  const t = await p.evaluate(() => document.body.innerText); const m = t.match(/سود\/زیان محقق:\s*\S+/); if (m && !/\$۰٫۰۰|۰٫۰۰/.test(m[0])) { closedAt = i; console.log('closed at', i, m[0]); break; }
}
await p.getByRole('button', { name: /پوزیشن‌ها/ }).first().click(); await p.waitForTimeout(800);
await p.getByText(/پوزیشن‌های بسته/).first().click().catch(() => {}); await p.waitForTimeout(800); await shot(p, 'f-positions');
console.log((await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).match(/موجودی.{0,200}/)?.[0]);
await ctx.storageState({ path: `${B}/state.json` });
await b.close(); console.log('errors', errs, 'closedAt', closedAt);
