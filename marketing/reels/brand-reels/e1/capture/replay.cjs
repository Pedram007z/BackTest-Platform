// The losing trade on the replay chart: session 24 opens at 2 Oct 2025 11:00 UTC (gold 1h); buy at market with the
// default stop (1.5 ATR) and target (2R), then step one candle at a time until the stop is hit (real prices).
//   node replay.cjs <data.json> <outdir>
const { open, wait, inject, APP } = require('./common.cjs');
const fs = require('fs');
const [DATA, OUT] = process.argv.slice(2);
const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const ids = new Set(all.sessions.slice(0, 23).map((s) => s.id));
const live = { id: 'se_e1_live', name: 'جلسه‌ی ۲۴ | طلا', balance: 10000, symbols: ['XAUUSD'], startDate: '2025-09-22', endDate: '2025-11-28',
  cursor: Date.UTC(2025, 9, 2, 11), timeframe: '1h', activeSymbol: 'XAUUSD', strategyId: 'st_e1_ema', notes: '', layout: '1',
  panes: [{ symbol: 'XAUUSD', timeframe: '1h' }], createdAt: Date.UTC(2026, 9, 14, 23, 5), lastOpenedAt: Date.UTC(2026, 9, 14, 23, 6) };
const PARK = [720, 28];
const shot = async (page, name) => { await page.mouse.move(...PARK); await wait(250); await page.screenshot({ path: `${OUT}/${name}`, quality: 92 }); };
const blur = (page) => page.evaluate(() => document.activeElement && document.activeElement.blur());
(async () => {
  fs.mkdirSync(`${OUT}/seq`, { recursive: true });
  const { b, page } = await open();
  await page.goto(`${APP}/dashboard`); await wait(1500);
  await inject(page, { sessions: [...all.sessions.slice(0, 23), live], trades: all.trades.filter((t) => ids.has(t.sessionId)), strategies: all.strategies });
  await page.goto(`${APP}/sessions`); await wait(2000);
  await page.locator('button[aria-haspopup], [role=combobox]').filter({ hasText: /\|/ }).first().click().catch(() => {}); await wait(400);
  await page.getByText(live.name, { exact: true }).first().click(); await wait(800);
  await page.keyboard.press('Escape'); await wait(300);
  await shot(page, 'p-session24.jpg');
  await page.getByText('رفتن به چارت').first().click(); await wait(6000);
  await page.getByRole('button', { name: '1h', exact: true }).first().click(); await wait(1500);
  await page.locator('select').filter({ has: page.locator('option[value="1h"]') }).last().selectOption('1h').catch((e) => console.log('step sel', e.message)); await wait(500);
  await blur(page);
  await shot(page, 'r-clean.jpg');
  await page.getByRole('button', { name: 'خرید', exact: true }).first().click(); await wait(1500);
  await page.getByTitle('قیمت ورود = قیمت فعلی بازار').click().catch((e) => console.log('market btn', e.message)); await wait(600);
  await blur(page); await shot(page, 'r-buy.jpg');
  await page.getByRole('button', { name: /ثبت معامله/ }).click(); await wait(1200);
  await shot(page, 'r-placed.jpg');
  let closedAt = -1;
  for (let i = 0; i <= 14; i++) {
    if (i) { await page.getByTitle('کندل بعدی (→)').click(); await wait(500); }
    await shot(page, `seq/${String(i).padStart(3, '0')}.jpg`);
    const bar = await page.locator('body').innerText().catch(() => '');
    const m = bar.match(/سود\/زیان محقق:\s*([^\n]*)/); console.log(i, m && m[1]);
    if (i && m && !/\$۰[٫,.]۰۰|\$0\.00/.test(m[1]) && closedAt < 0) closedAt = i;
    if (closedAt >= 0 && i >= closedAt + 2) break;
  }
  console.log('closed at step', closedAt);
  await page.getByTitle('پوزیشن‌های باز و بسته').click(); await wait(700);
  await page.getByRole('button', { name: /پوزیشن‌های بسته/ }).click().catch((e) => console.log('closed tab', e.message)); await wait(600);
  await shot(page, 'r-positions.jpg');
  await b.close();
})();
