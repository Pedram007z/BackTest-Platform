// pass 4: eight more real trades in the same session (alternating buy and sell, the app's default stop and 2R target),
// each played candle by candle until it closes; then the analytics pages (2×)
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92 });
{
  const { b, ctx, p, errs } = await open(`${B}/state.json`, 1);
  await p.goto(APP + '/replay/se_mvmnj3l5ug9po'); await p.waitForTimeout(7000);
  const openCount = async () => Number((await p.evaluate(() => document.body.innerText)).match(/پوزیشن‌ها \(([۰-۹0-9]+)\)/)?.[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) ?? -1);
  const next = p.getByRole('button', { name: 'نمایش کندل بعدی' });
  for (let k = 0; k < 8; k++) {
    for (let w = 0; w < 6; w++) { await next.click(); await p.waitForTimeout(200); }          // a few candles between trades
    await p.getByRole('button', { name: k % 2 ? 'فروش' : 'خرید', exact: true }).first().click(); await p.waitForTimeout(900);
    await p.getByRole('button', { name: 'ثبت معامله' }).click(); await p.waitForTimeout(900);
    let i = 0; for (i = 1; i <= 150; i++) { await next.click(); await p.waitForTimeout(250); if ((await openCount()) === 0) break; }
    console.log('trade', k + 1, k % 2 ? 'sell' : 'buy', 'closed after', i, (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).match(/سود\/زیان محقق:\s*\S+/)?.[0]);
  }
  await p.waitForTimeout(1500); await ctx.storageState({ path: `${B}/state.json` }); await b.close(); console.log('errors', errs);
}
{
  const { b, p, errs } = await open(`${B}/state.json`, 2);
  await p.goto(APP + '/analytics'); await p.waitForTimeout(3500); await shot(p, 'h-analytics');
  console.log((await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).match(/سود\/زیان کل.{0,900}/)?.[0]);
  for (let k = 2; k <= 5; k++) { await p.mouse.move(700, 500); await p.mouse.wheel(0, 760); await p.waitForTimeout(1200); await shot(p, `h-analytics-${k}`); }
  await p.goto(APP + '/dashboard'); await p.waitForTimeout(3000); await shot(p, 'h-dashboard');
  await p.goto(APP + '/journal'); await p.waitForTimeout(2500); await shot(p, 'h-journal');
  await b.close(); console.log('errors', errs);
}
