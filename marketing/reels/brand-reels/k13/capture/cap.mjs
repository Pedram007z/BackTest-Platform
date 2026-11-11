// k13's screens (2×, JPEG, to the scratch cap/ folder): the gold replay stepping forward, a planned buy (entry, stop,
// target), the placed trade played until it closes, and the balance after it.
//   node cap.mjs <session id>
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92 });
const { b, ctx, p, errs } = await open(`${B}/state.json`, 2);
await p.goto(APP + '/replay/' + process.argv[2]); await p.waitForTimeout(7000);
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' }), n3 = (i) => String(i).padStart(3, '0');
const state = () => p.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' '); return (t.match(/پوزیشن‌ها \([^)]*\)/) || [''])[0] + ' ' + (t.match(/موجودی: \S+/) || [''])[0]; });
for (let i = 0; i < 6; i++) { await shot(p, `a-${n3(i)}`); await next.click(); await p.waitForTimeout(450); }
await p.getByRole('button', { name: 'خرید', exact: true }).click(); await p.waitForTimeout(1200); await shot(p, 'p-plan');
await p.getByRole('button', { name: 'ثبت معامله' }).click(); await p.waitForTimeout(1500); await shot(p, 'p-placed'); console.log('placed:', await state());
let closed = -1;
for (let i = 0; i < 90; i++) {
  await next.click(); await p.waitForTimeout(450); await shot(p, `b-${n3(i)}`); const s = await state();
  if (i % 5 === 0) console.log(i, s);
  if (closed < 0 && /\(۰\)/.test(s)) { closed = i; console.log('closed at step', i, s); }
  if (closed >= 0 && i >= closed + 4) break;
}
await ctx.storageState({ path: `${B}/state.json` });
await b.close(); console.log('errors', errs);
