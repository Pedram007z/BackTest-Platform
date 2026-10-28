// k4's news screens (2×, JPEG), dark theme, TradingView chart: a gold session on Friday 2 October 2026 (۱۰ مهر ۱۴۰۵) at
// 12:30 Tehran, before the NFP (16:00 Tehran): the chart with its news marks and the dashed line of the coming release
// (n0), then the economic calendar beside it, scrolled to the coming release (n1). Positions go to ../marks.json.
import fs from 'node:fs';
import { open, STATE, APP, SCREENS } from './lib.mjs';
const ID = process.argv[2];
const shot = (p, name) => p.screenshot({ path: `${SCREENS}${name}.jpg`, type: 'jpeg', quality: 90 });
const marks = {}, rect = (r) => r && [r.x, r.y, r.width, r.height].map((v) => Math.round(v));
const mid = (r) => [r.x + r.width / 2, r.y + r.height / 2];
const { b, p, errs } = await open(STATE, 2);
await p.goto(APP + '/replay/' + ID); await p.waitForTimeout(10000);
const tzBtn = () => p.getByRole('button', { name: /\(UTC[^)]*\)/ }).last();
if (!/تهران/.test(await tzBtn().innerText())) { await tzBtn().click(); await p.waitForTimeout(700); await p.getByRole('button', { name: /Asia\/Tehran/ }).first().click(); await p.waitForTimeout(1500); }
const go = async (name) => { await p.getByRole('button', { name: 'برو به' }).first().click(); await p.waitForTimeout(600); await p.getByRole('button', { name }).first().click(); await p.waitForTimeout(1800); };
for (let i = 0; i < 4; i++) await go('+۱ روز');
await go(/شروع سشن لندن/); await go('+۱ ساعت'); await go('+۱ ساعت');
await p.mouse.move(700, 110); await p.waitForTimeout(3000);
marks.clock = await p.evaluate(() => document.body.innerText.match(/\S+، [۰-۹]+ \S+ [۰-۹]+ · [۰-۹:]+ \S+/)?.[0]);
await shot(p, 'n0');
const cal = p.getByRole('button', { name: 'تقویم اقتصادی' }).first(); const rc = await cal.boundingBox(); marks.calBtn = rect(rc);
await p.mouse.click(...mid(rc)); await p.waitForTimeout(2500);
const nx = p.locator('aside[aria-label="تقویم اقتصادی"]').getByText('بعدی', { exact: true }).first();
await nx.evaluate((e) => e.closest('li').scrollIntoView({ block: 'center' })); await p.waitForTimeout(600);
await p.mouse.move(700, 110); await p.waitForTimeout(1500); await shot(p, 'n1');
marks.panel = rect(await p.locator('aside[aria-label="تقویم اقتصادی"]').boundingBox());
marks.next = await nx.evaluate((e) => { const r = e.closest('li').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); });
fs.writeFileSync(new URL('../marks.json', import.meta.url), JSON.stringify(marks, null, 1));
console.log(JSON.stringify(marks)); await b.close(); console.log('errors', errs);
