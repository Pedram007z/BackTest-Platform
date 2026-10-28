// k3's screens (2×, JPEG): the light-theme replay of a gold session on the built-in chart, Friday 2 October 2026
// (10 مهر ۱۴۰۵), the day of the US jobs report (NFP, 12:30 UTC = 16:00 Tehran). From 12:30 Tehran: the chart with its news
// flags and the dashed line of the coming NFP (a0), the hover card on that flag (b0), the economic calendar beside the
// chart scrolled to the coming release (c0), then the replay stepped candle by candle through the release (f00…), the
// card again after it (b1), the timezone menu (d0) and the card in New York time (d1). Where things sat goes to ../marks.json (CSS px).
import fs from 'node:fs';
import { open, STATE, APP, SCREENS } from './lib.mjs';
const ID = process.argv[2] || 'se_mvs1qaxvyn9qf';
const shot = (p, name) => p.screenshot({ path: `${SCREENS}${name}.jpg`, type: 'jpeg', quality: 90 });
const marks = {}, rect = (r) => r && [r.x, r.y, r.width, r.height].map((v) => Math.round(v));
const mid = (r) => [r.x + r.width / 2, r.y + r.height / 2];
const { b, p, errs } = await open(STATE, 2);
await p.goto(APP + '/replay/' + ID); await p.waitForTimeout(7000);
// the clock under the chart opens the time zone menu; its options name their IANA zone
const tzBtn = () => p.getByRole('button', { name: /\(UTC[^)]*\)/ }).last();
const setTz = async (iana) => { await tzBtn().click(); await p.waitForTimeout(700); await p.getByRole('button', { name: new RegExp(iana) }).first().click(); await p.waitForTimeout(1500); };
if (!/تهران/.test(await tzBtn().innerText())) await setTz('Asia/Tehran');
const go = async (name) => { await p.getByRole('button', { name: 'برو به' }).first().click(); await p.waitForTimeout(600); await p.getByRole('button', { name }).first().click(); await p.waitForTimeout(1500); };
for (let i = 0; i < 4; i++) await go('+۱ روز');
await go(/شروع سشن لندن/); await go('+۱ ساعت'); await go('+۱ ساعت');
const flags = async () => p.$$eval('[role=button][aria-label]', (els) => els.filter((e) => /^(USD|EUR|GBP) /.test(e.getAttribute('aria-label'))).map((e) => { const r = e.getBoundingClientRect(); return { label: e.getAttribute('aria-label'), r: [r.x, r.y, r.width, r.height].map(Math.round) }; }));
const nfp = async () => (await flags()).sort((a, b2) => b2.r[0] - a.r[0])[0];   // the rightmost flag: the NFP group
const clock = async () => p.evaluate(() => document.body.innerText.match(/\S+، [۰-۹]+ \S+ [۰-۹]+ · [۰-۹:]+ \S+/)?.[0]);
// first the economic calendar beside the chart, scrolled to the coming release («بعدی»), then closed again
const cal = p.getByRole('button', { name: 'تقویم اقتصادی' }).first(); const rc = await cal.boundingBox(); marks.calBtn = rect(rc);
await p.mouse.move(...mid(rc), { steps: 8 }); await p.mouse.click(...mid(rc)); await p.waitForTimeout(2000);
// medium-impact news on the chart too (orange flags); the filter is kept with the account
const med = p.locator('aside[aria-label="تقویم اقتصادی"]').getByRole('button', { name: 'متوسط' });
if ((await med.getAttribute('aria-pressed')) !== 'true') { await med.click(); await p.waitForTimeout(800); }
const nx = p.locator('aside[aria-label="تقویم اقتصادی"]').getByText('بعدی', { exact: true }).first();
await nx.evaluate((e) => e.closest('li').scrollIntoView({ block: 'center' })); await p.waitForTimeout(600);
await p.mouse.move(700, 110); await p.waitForTimeout(400); await shot(p, 'c0');
marks.panel = rect(await p.locator('aside[aria-label="تقویم اقتصادی"]').boundingBox()); marks.next = rect(await nx.evaluate((e) => { const r = e.closest('li').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
await p.mouse.click(...mid(rc)); await p.waitForTimeout(1500);
await p.mouse.move(700, 110); await p.waitForTimeout(1500);
marks.a0 = { flags: await flags(), clock: await clock() }; await shot(p, 'a0');
// the hover card on the coming NFP flag
let f = await nfp(); await p.mouse.move(f.r[0] + 9, f.r[1] + 9, { steps: 10 }); await p.waitForTimeout(700); await shot(p, 'b0');
marks.b0 = { flag: f.r, card: await p.evaluate(() => { const c = [...document.querySelectorAll('div')].find((d) => d.style.minWidth === '220px'); if (!c) return null; const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); }) };
// the replay stepped candle by candle through the release
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' }); const rn = await next.boundingBox(); marks.step = rect(rn);
await p.mouse.move(...mid(rn), { steps: 8 }); await p.waitForTimeout(500);
marks.f = [];
for (let i = 0; i <= 22; i++) { if (i) { await p.mouse.click(...mid(rn)); await p.waitForTimeout(700); } await shot(p, `f${String(i).padStart(2, '0')}`); marks.f.push({ clock: await clock(), flags: await flags() }); }
// the card again, on the released news
f = await nfp(); await p.mouse.move(f.r[0] + 9, f.r[1] + 9, { steps: 10 }); await p.waitForTimeout(700); await shot(p, 'b1');
marks.b1 = { flag: f.r };
// the timezone menu (the clock under the chart), then New York
const rt = await tzBtn().boundingBox(); marks.tz = rect(rt);
await p.mouse.move(...mid(rt), { steps: 8 }); await p.mouse.click(...mid(rt)); await p.waitForTimeout(800); await shot(p, 'd0');
const ny = p.getByRole('button', { name: /America\/New_York/ }).first(); marks.ny = rect(await ny.boundingBox());
await ny.click(); await p.waitForTimeout(1500);
f = await nfp(); await p.mouse.move(f.r[0] + 9, f.r[1] + 9, { steps: 10 }); await p.waitForTimeout(700); await shot(p, 'd1'); marks.d1 = { flag: f.r };
// back to Tehran
await setTz('Asia/Tehran');
fs.writeFileSync(new URL('../marks.json', import.meta.url), JSON.stringify(marks, null, 1));
console.log(JSON.stringify({ a0: marks.a0, b0: marks.b0, tz: marks.tz, ny: marks.ny, panel: marks.panel, last: marks.f.at(-1) }));
await b.close(); console.log('errors', errs);
