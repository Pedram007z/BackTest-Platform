// k5: one strategy's trades, placed with the app's own buttons on the built-in chart (1-hour candles):
//   node trade.mjs <session id> <buy|sell> <london|newyork> <count>
// each trade: «برو به» → the session's open (a weekday's), «خرید»/«فروش» with the app's default stop (1.5 × ATR) and 2R target,
// «ثبت معامله», then «نمایش کندل بعدی» until the position closes. Prints each trade's realized result.
import { open, STATE, APP } from './lib.mjs';
const [, , ID, SIDE, WHERE, N = '8'] = process.argv;
const { b, ctx, p, errs, dump } = await open(STATE);
await p.goto(APP + '/replay/' + ID); await p.waitForTimeout(7000);
await p.getByRole('button', { name: '1h', exact: true }).first().click(); await p.waitForTimeout(1500);
const go = async (name) => { await p.getByRole('button', { name: 'برو به' }).first().click(); await p.waitForTimeout(500); await p.getByRole('button', { name }).first().click(); await p.waitForTimeout(1300); };
const body = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const openCount = async () => { const m = (await body()).match(/پوزیشن‌ها \(([۰-۹0-9]+)\)/); return m ? Number(m[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) : -1; };
const realized = async () => (await body()).match(/سود\/زیان محقق:\s*\S+/)?.[0];
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' });
for (let k = 0; k < Number(N); k++) {
  // «برو به» can land on a Saturday or Sunday morning, when gold isn't trading: go on to the next open
  let clock = '';
  for (let tries = 0; tries < 4; tries++) {
    await go(WHERE === 'london' ? /شروع سشن لندن/ : /شروع سشن نیویورک/);
    clock = (await body()).match(/\S+، [۰-۹]+ \S+ [۰-۹]+ · [۰-۹:]+ \S+/)?.[0] ?? '';
    if (!['شنبه', 'یکشنبه'].includes(clock.split('،')[0])) break;
  }
  await p.getByRole('button', { name: SIDE === 'buy' ? 'خرید' : 'فروش', exact: true }).first().click(); await p.waitForTimeout(900);
  await p.getByRole('button', { name: 'ثبت معامله' }).click(); await p.waitForTimeout(900);
  if ((await openCount()) < 1) { console.log('not placed', clock); await dump('k5-notplaced', 400); break; }
  let steps = 0; while ((await openCount()) > 0 && steps < 120) { await next.click(); await p.waitForTimeout(160); steps++; }
  console.log(k + 1, clock, 'closed after', steps, 'candles;', await realized());
}
await ctx.storageState({ path: STATE }); await b.close(); console.log('errors', errs);
