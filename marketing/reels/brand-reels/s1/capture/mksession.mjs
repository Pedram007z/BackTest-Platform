// a gold session from Monday 14 September 2026 (UI only), saved to STATE; prints its replay address
import { open, STATE, APP } from './lib.mjs';
const { b, ctx, p, errs, dump } = await open(STATE);
await p.goto(APP + '/dashboard'); await p.waitForTimeout(2000); await p.getByRole('button', { name: 'جلسه جدید' }).first().click(); await p.waitForTimeout(1000);
await p.getByPlaceholder('مثلاً: شکست لندن').fill('طلا · سشن لندن');
await p.getByRole('button', { name: 'نمادها را انتخاب کنید' }).click(); await p.waitForTimeout(500);
await p.getByPlaceholder('جستجوی نماد…').fill('XAU'); await p.waitForTimeout(300);
await p.getByRole('button', { name: /XAUUSD/ }).first().click(); await p.waitForTimeout(500);
await p.getByText('ساخت جلسه جدید').click(); await p.waitForTimeout(500);
const pick = async (k, year, month, day) => {
  await p.getByText('روز / ماه / سال').nth(k).click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'میلادی' }).click(); await p.waitForTimeout(300);
  const sel = p.locator('select'); await sel.nth(0).selectOption(year); await p.waitForTimeout(200); await sel.nth(1).selectOption(String(month)); await p.waitForTimeout(300);
  await p.getByRole('button', { name: day, exact: true }).first().click(); await p.waitForTimeout(400);
};
await pick(0, '2026', 9, '۱۴'); await p.getByRole('button', { name: '+1M' }).click(); await p.waitForTimeout(400);
await p.getByRole('button', { name: 'ساخت جلسه', exact: true }).click(); await p.waitForTimeout(2500); await dump('s1-created', 200);
console.log('session', await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('backtest-dashboard:v2:')); const ss = JSON.parse(localStorage.getItem(k)).state.sessions; return ss.slice().sort((a, b) => b.createdAt - a.createdAt)[0].id; }));
await ctx.storageState({ path: STATE }); await b.close(); console.log('errors', errs);
