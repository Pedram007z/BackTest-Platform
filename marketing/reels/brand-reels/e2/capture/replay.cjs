// e2's replay: gold on the 1-minute chart, 1 Aug 2025, minutes before the US jobs report (NFP, 12:30 UTC).
// Buy at 2% risk with the default stop (1.5 ATR) and target (2R), then step one candle at a time through the release.
//   node replay.cjs <outdir>   (sign in first: ../../e1/capture/login.cjs)
const { open, wait, inject, APP } = require('../../e1/capture/common.cjs');
const fs = require('fs');
const OUT = process.argv[2];
const ses = { id: 'se_e2_nfp', name: 'طلا | خبر NFP', balance: 10000, symbols: ['XAUUSD'], startDate: '2025-07-01', endDate: '2025-08-29',
  cursor: Date.UTC(2025, 7, 1, 12, 30), timeframe: '1m', activeSymbol: 'XAUUSD', notes: '', layout: '1',
  panes: [{ symbol: 'XAUUSD', timeframe: '1m' }], createdAt: Date.UTC(2026, 9, 15, 17, 5), lastOpenedAt: Date.UTC(2026, 9, 15, 17, 6) };
const PARK = [720, 28];
const shot = async (page, name) => { await page.mouse.move(...PARK); await wait(250); await page.screenshot({ path: `${OUT}/${name}`, quality: 92 }); };
const blur = (page) => page.evaluate(() => document.activeElement && document.activeElement.blur());
(async () => {
  fs.mkdirSync(`${OUT}/seq`, { recursive: true });
  const { b, page } = await open();
  await page.goto(`${APP}/dashboard`); await wait(1500);
  await inject(page, { sessions: [ses], trades: [], strategies: [] });
  await page.goto(`${APP}/sessions`); await wait(2000);
  await page.getByText('رفتن به چارت').first().click(); await wait(6000);
  await page.getByRole('button', { name: '1m', exact: true }).first().click(); await wait(1500);
  await page.locator('select').filter({ has: page.locator('option[value="1m"]') }).last().selectOption('1m').catch((e) => console.log('step sel', e.message)); await wait(500);
  const risk = page.getByTitle('درصد ریسک هر معامله از موجودی').locator('input');
  await risk.fill('2').catch((e) => console.log('risk', e.message)); await risk.press('Enter').catch(() => {}); await wait(300);
  await blur(page); await shot(page, 'r-clean.jpg');
  await page.getByRole('button', { name: /تقویم اقتصادی/ }).first().click().catch((e) => console.log('news', e.message)); await wait(1800);
  await shot(page, 'r-news.jpg');
  await page.getByLabel('بستن تقویم اقتصادی').click().catch(() => {}); await wait(500);
  await page.getByRole('button', { name: 'خرید', exact: true }).first().click(); await wait(1500);
  await wait(300);
  await blur(page); await shot(page, 'r-buy.jpg');
  await page.getByRole('button', { name: /ثبت معامله/ }).click(); await wait(1200);
  await shot(page, 'r-placed.jpg');
  // let the success toast show in these frames
  await page.addStyleTag({ content: '.pointer-events-none.fixed.bottom-4{display:flex!important}' });
  let closedAt = -1;
  for (let i = 0; i <= 12; i++) {
    if (i) { await page.getByTitle('کندل بعدی (→)').click(); await wait(i === closedAt + 1 ? 300 : 650); }
    await shot(page, `seq/${String(i).padStart(3, '0')}.jpg`);
    const bar = await page.locator('body').innerText().catch(() => '');
    const m = bar.match(/سود\/زیان محقق:\s*([^\n]*)/); console.log(i, m && m[1]);
    if (i && m && !/\$۰[٫,.]۰۰|\$0\.00/.test(m[1]) && closedAt < 0) closedAt = i;
    if (closedAt >= 0 && i >= closedAt + 3) break;
  }
  console.log('closed at step', closedAt);
  await b.close();
})();
