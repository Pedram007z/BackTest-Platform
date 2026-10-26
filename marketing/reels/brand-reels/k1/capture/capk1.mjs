// k1: the new-session window with a challenge-sized balance, and the analytics' Monte Carlo box (2×)
import { open, B, APP } from './lib.mjs';
const C = `${B}/cap`, shot = (p, name, o = {}) => p.screenshot({ path: `${C}/${name}.jpg`, type: 'jpeg', quality: 92, ...o });
const { b, p, errs } = await open(`${B}/state.json`, 2);
await p.goto(APP + '/dashboard'); await p.waitForTimeout(2500); await p.getByRole('button', { name: 'جلسه جدید' }).first().click(); await p.waitForTimeout(1000);
await p.getByPlaceholder('مثلاً: شکست لندن').fill('چالش پراپ · ۱۰۰ هزار دلاری');
const ins = p.locator('input'); await ins.nth(1).fill('100000'); await p.waitForTimeout(300);
await p.getByRole('button', { name: 'نمادها را انتخاب کنید' }).click(); await p.waitForTimeout(500);
await p.getByPlaceholder('جستجوی نماد…').fill('XAU'); await p.waitForTimeout(300); await p.getByRole('button', { name: /^XAUUSD\s*طلا/ }).first().click(); await p.waitForTimeout(400);
await p.getByText('ساخت جلسه جدید').click(); await p.waitForTimeout(600);
await shot(p, 'k-session');
const box = await p.evaluate(() => { const el = [...document.querySelectorAll('input')][1]; const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }); console.log('balance input', JSON.stringify(box));
await p.getByRole('button', { name: 'انصراف' }).click(); await p.waitForTimeout(400);
await p.goto(APP + '/analytics'); await p.waitForTimeout(3500);
const mc = p.getByText('شبیه‌سازی مونت‌کارلو').first(); await mc.scrollIntoViewIfNeeded(); await p.mouse.wheel(0, -120); await p.waitForTimeout(1500);
await shot(p, 'k-montecarlo');
console.log((await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).match(/شبیه‌سازی مونت‌کارلو.{0,300}/)?.[0]);
const r2 = await p.evaluate(() => { const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent.includes('بدترین ۵٪')); const r = dt.parentElement.getBoundingClientRect(); const g = dt.parentElement.parentElement.getBoundingClientRect(); return { card: [r.x, r.y, r.width, r.height], grid: [g.x, g.y, g.width, g.height] }; }); console.log('mc', JSON.stringify(r2));
await b.close(); console.log('errors', errs);
