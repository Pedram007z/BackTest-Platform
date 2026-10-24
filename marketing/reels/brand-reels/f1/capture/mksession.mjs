// creates the gold session (UI only) and saves the state; prints the replay page's controls
import { open, B, APP } from './lib.mjs';
const { b, ctx, p, errs, dump, buttons } = await open(`${B}/state.json`);
await p.goto(APP + '/dashboard'); await p.waitForTimeout(2000); await p.getByRole('button', { name: 'جلسه جدید' }).first().click(); await p.waitForTimeout(1000);
await p.getByPlaceholder('مثلاً: شکست لندن').fill('طلا · شکست لندن');
await p.getByRole('button', { name: 'نمادها را انتخاب کنید' }).click(); await p.waitForTimeout(500);
await p.getByPlaceholder('جستجوی نماد…').fill('XAU'); await p.waitForTimeout(300);
await p.getByRole('button', { name: /XAUUSD/ }).first().click(); await p.waitForTimeout(500);
await p.getByText('ساخت جلسه جدید').click(); await p.waitForTimeout(500);
const ins = p.locator('input'); await ins.nth(2).fill('3'); await ins.nth(3).fill('7');
const pick = async (k, year, month, day) => {
  await p.getByText('روز / ماه / سال').nth(k).click(); await p.waitForTimeout(500);
  await p.getByRole('button', { name: 'میلادی' }).click(); await p.waitForTimeout(300);
  const sel = p.locator('select'); await sel.nth(0).selectOption(year); await p.waitForTimeout(200); await sel.nth(1).selectOption(String(month)); await p.waitForTimeout(300);
  await p.getByRole('button', { name: day, exact: true }).first().click(); await p.waitForTimeout(400);
};
await pick(0, '2025', 4, '۱۴'); await p.getByRole('button', { name: '+1M' }).click(); await p.waitForTimeout(400); await dump('x-picked', 10);
await p.getByRole('button', { name: 'ساخت جلسه', exact: true }).click(); await p.waitForTimeout(2500); await dump('x-created', 300); await buttons();
await ctx.storageState({ path: `${B}/state.json` });
await b.close(); console.log('errors', errs);
