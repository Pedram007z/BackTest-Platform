// k13's second pass (2×, JPEG, to the scratch cap/ folder): from where cap.mjs stopped, a planned sell, the placed
// trade played until it closes, and the balance after it.
//   node cap2.mjs <session id> [buy|sell] [prefix]
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92 });
const side = process.argv[3] === 'buy' ? 'خرید' : 'فروش', pre = process.argv[4] || 'c';
const { b, ctx, p, errs } = await open(`${B}/state.json`, 2);
await p.goto(APP + '/replay/' + process.argv[2]); await p.waitForTimeout(7000);
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' }), n3 = (i) => String(i).padStart(3, '0');
const state = () => p.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); return (t.match(/پوزیشن‌ها \([^)]*\)/) || [''])[0] + ' ' + (t.match(/موجودی: \S+/) || [''])[0]; });
await shot(p, `${pre}-before`);
await p.getByRole('button', { name: side, exact: true }).click(); await p.waitForTimeout(1200); await shot(p, `${pre}-plan`);
await p.getByRole('button', { name: 'ثبت معامله' }).click(); await p.waitForTimeout(1500); await shot(p, `${pre}-placed`); console.log('placed:', await state());
let closed = -1;
for (let i = 0; i < 120; i++) {
  await next.click(); await p.waitForTimeout(450); await shot(p, `${pre}-${n3(i)}`); const s = await state();
  if (closed < 0 && /\(۰\)/.test(s)) { closed = i; console.log('closed at step', i, s); }
  if (closed >= 0 && i >= closed + 3) break;
}
await ctx.storageState({ path: `${B}/state.json` });
await b.close(); console.log('errors', errs);
