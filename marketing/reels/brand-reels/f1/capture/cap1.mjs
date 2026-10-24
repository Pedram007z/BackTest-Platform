// pass 1 (2×, JPEG): sign-up, billing, the new-session window, the replay stepping forward
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name, o = {}) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92, ...o });
{ // signed out: the sign-up page with a number typed
  const { b, p } = await open(null, 2);
  await p.goto(APP + '/signup'); await p.waitForTimeout(2500); await p.getByPlaceholder('0912 123 4567').fill('09121234567'); await p.waitForTimeout(400);
  await shot(p, 'a-signup'); await b.close();
}
const { b, ctx, p, errs } = await open(`${B}/state.json`, 2);
await p.goto(APP + '/billing'); await p.waitForTimeout(2500); await shot(p, 'b-billing');
await p.goto(APP + '/dashboard'); await p.waitForTimeout(2500); await shot(p, 'b-dashboard-session');
await p.getByRole('button', { name: 'جلسه جدید' }).first().click(); await p.waitForTimeout(1000);
await p.getByPlaceholder('مثلاً: شکست لندن').fill('طلا · شکست لندن');
await p.getByRole('button', { name: 'نمادها را انتخاب کنید' }).click(); await p.waitForTimeout(700); await shot(p, 'c-assets');
await p.getByPlaceholder('جستجوی نماد…').fill('XAU'); await p.waitForTimeout(300);
await p.getByRole('button', { name: /^XAUUSD\s*طلا/ }).first().click(); await p.waitForTimeout(500);
await p.getByText('ساخت جلسه جدید').click(); await p.waitForTimeout(500);
const ins = p.locator('input'); await ins.nth(2).fill('3'); await ins.nth(3).fill('7');
await p.getByText('روز / ماه / سال').nth(0).click(); await p.waitForTimeout(500); await p.getByRole('button', { name: 'میلادی' }).click(); await p.waitForTimeout(300);
const sel = p.locator('select'); await sel.nth(0).selectOption('2025'); await sel.nth(1).selectOption('4'); await p.waitForTimeout(300);
await shot(p, 'c-datepicker');
await p.getByRole('button', { name: '۱۴', exact: true }).first().click(); await p.waitForTimeout(400); await p.getByRole('button', { name: '+1M' }).click(); await p.waitForTimeout(400);
await shot(p, 'c-session');
await p.getByRole('button', { name: 'انصراف' }).click(); await p.waitForTimeout(500);
// the replay: step forward one candle at a time
await p.goto(APP + '/replay/se_mvmnj3l5ug9po'); await p.waitForTimeout(7000); await shot(p, 'd-replay-000');
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' });
for (let i = 1; i <= 40; i++) { await next.click(); await p.waitForTimeout(450); await shot(p, `d-step-${String(i).padStart(3, '0')}`); }
await ctx.storageState({ path: `${B}/state.json` });
await b.close(); console.log('errors', errs);
