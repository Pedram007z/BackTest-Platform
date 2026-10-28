// k4's news on the built-in chart (2×, JPEG, dark theme), same session and moment as cap.mjs (Friday 2 October 2026,
// 12:30 Tehran): the flags and the dashed line of the coming NFP (n2), and the hover card on that flag (n3) with its
// Persian titles and «۱۶:۰۰ تهران». The flags' positions are added to ../marks.json.
import fs from 'node:fs';
import { open, STATE, APP, SCREENS } from './lib.mjs';
const ID = process.argv[2];
const shot = (p, name) => p.screenshot({ path: `${SCREENS}${name}.jpg`, type: 'jpeg', quality: 90 });
const { b, ctx, p, errs } = await open(STATE, 2);
await ctx.addInitScript(() => localStorage.setItem('backtest:chart-engine', 'lightweight'));
await p.goto(APP + '/replay/' + ID); await p.waitForTimeout(7000);
const marks = JSON.parse(fs.readFileSync(new URL('../marks.json', import.meta.url)));
const go = async (name) => { await p.getByRole('button', { name: 'برو به' }).first().click(); await p.waitForTimeout(600); await p.getByRole('button', { name }).first().click(); await p.waitForTimeout(1500); };
const clockNow = () => p.evaluate(() => document.body.innerText.match(/\S+، [۰-۹]+ \S+ [۰-۹]+ · [۰-۹:]+ \S+/)?.[0]);
if (!/۱۰ مهر/.test(await clockNow())) { for (let i = 0; i < 4; i++) await go('+۱ روز'); await go(/شروع سشن لندن/); await go('+۱ ساعت'); await go('+۱ ساعت'); }
marks.clock2 = await p.evaluate(() => document.body.innerText.match(/\S+، [۰-۹]+ \S+ [۰-۹]+ · [۰-۹:]+ \S+/)?.[0]);
const flags = async () => p.$$eval('[role=button][aria-label]', (els) => els.filter((e) => /^(USD|EUR|GBP) /.test(e.getAttribute('aria-label'))).map((e) => { const r = e.getBoundingClientRect(); return { label: e.getAttribute('aria-label'), r: [r.x, r.y, r.width, r.height].map(Math.round) }; }));
await p.mouse.move(700, 110); await p.waitForTimeout(1500);
marks.n2 = await flags(); await shot(p, 'n2');
const f = marks.n2.slice().sort((a, c) => c.r[0] - a.r[0])[0];
await p.mouse.move(f.r[0] + 9, f.r[1] + 9, { steps: 10 }); await p.waitForTimeout(800); await shot(p, 'n3');
marks.n3 = { flag: f.r, card: await p.evaluate(() => { const c = [...document.querySelectorAll('div')].find((d) => d.style.minWidth === '220px'); if (!c) return null; const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); }) };
fs.writeFileSync(new URL('../marks.json', import.meta.url), JSON.stringify(marks, null, 1));
console.log(JSON.stringify({ clock2: marks.clock2, n2: marks.n2, n3: marks.n3 })); await b.close(); console.log('errors', errs);
