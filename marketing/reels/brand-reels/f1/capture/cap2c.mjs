// continue the open trade candle by candle until it closes (frames g-run-NNN), then the closed trades list
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92 });
const { b, ctx, p, errs } = await open(`${B}/state.json`, 2);
await p.goto(APP + '/replay/se_mvmnj3l5ug9po'); await p.waitForTimeout(7000);
const openCount = async () => Number((await p.evaluate(() => document.body.innerText)).match(/پوزیشن‌ها \(([۰-۹0-9]+)\)/)?.[1].replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) ?? -1);
console.log('open', await openCount()); await shot(p, 'g-run-000');
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' }); let i = 0;
for (i = 1; i <= 120; i++) { await next.click(); await p.waitForTimeout(450); await shot(p, `g-run-${String(i).padStart(3, '0')}`); if ((await openCount()) === 0) break; }
console.log('closed after', i, (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).match(/موجودی.{0,120}/)?.[0]);
await p.waitForTimeout(800); await shot(p, 'g-closed');
await p.getByRole('button', { name: /پوزیشن‌ها/ }).first().click(); await p.waitForTimeout(800);
await p.getByText(/پوزیشن‌های بسته/).first().click().catch(() => {}); await p.waitForTimeout(800); await shot(p, 'g-positions');
console.log((await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).match(/پوزیشن‌های بسته.{0,400}/)?.[0]);
await ctx.storageState({ path: `${B}/state.json` });
await b.close(); console.log('errors', errs);
