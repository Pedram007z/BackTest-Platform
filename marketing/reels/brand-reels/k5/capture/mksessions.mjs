// k5: three gold sessions from Monday 14 September 2026 (one month), one per strategy, each with «چک‌لیست ورود»; prints their ids
import { open, STATE, APP, light } from './lib.mjs';
import { STRATS } from './setup.mjs';
const { b, ctx, p, errs, dump } = await open(STATE);
await p.goto(APP + '/dashboard'); await p.waitForTimeout(2500); await light(p);
const ids = [];
for (const [name] of STRATS) {
  await p.getByRole('button', { name: 'جلسه جدید' }).first().click(); await p.waitForTimeout(1000);
  const M = p.locator('.fixed.inset-0.z-50');
  await p.getByPlaceholder('مثلاً: شکست لندن').fill('طلا · ' + name);
  await p.getByRole('button', { name: 'نمادها را انتخاب کنید' }).click(); await p.waitForTimeout(500);
  await p.getByPlaceholder('جستجوی نماد…').fill('XAU'); await p.waitForTimeout(300);
  await M.getByText('XAUUSD', { exact: true }).first().click(); await p.waitForTimeout(400);
  await M.getByText('ساخت جلسه جدید').click(); await p.waitForTimeout(400);
  await p.locator('#session-strategy').click(); await p.waitForTimeout(400); await p.locator('[role=option]').filter({ hasText: name }).first().click(); await p.waitForTimeout(400);
  await p.locator('#session-checklist').click(); await p.waitForTimeout(400); await p.locator('[role=option]').filter({ hasText: 'چک‌لیست ورود' }).first().click(); await p.waitForTimeout(400);
  await p.getByText('روز / ماه / سال').nth(0).click(); await p.waitForTimeout(500); await p.getByRole('button', { name: 'میلادی' }).click(); await p.waitForTimeout(300);
  const sel = p.locator('select'); await sel.nth(0).selectOption('2026'); await p.waitForTimeout(200); await sel.nth(1).selectOption('9'); await p.waitForTimeout(300);
  await p.getByRole('button', { name: '۱۴', exact: true }).first().click(); await p.waitForTimeout(400); await p.getByRole('button', { name: '+1M' }).click(); await p.waitForTimeout(400);
  if (!ids.length) await dump('k5-newsession', 300);
  await p.screenshot({ path: `${new URL('../screens/', import.meta.url).pathname}n-session-${ids.length}.jpg`, type: 'jpeg', quality: 90 });
  await p.getByRole('button', { name: 'ساخت جلسه', exact: true }).click(); await p.waitForTimeout(2500);
  ids.push(await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('backtest-dashboard:v2:')); const ss = JSON.parse(localStorage.getItem(k)).state.sessions; return ss.slice().sort((a, c) => c.createdAt - a.createdAt)[0].id; }));
  await p.goto(APP + '/dashboard'); await p.waitForTimeout(1500);
}
console.log('sessions', JSON.stringify(ids));
await ctx.storageState({ path: STATE }); await b.close(); console.log('errors', errs);
