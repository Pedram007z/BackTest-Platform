// k5's screens (2×, JPEG, light theme) after the trades: the dashboard (dash), the strategies page with each strategy's
// stats and equity curve (strats), strategy A's rules form (smodal), the checklist (clist), each session's chart at its
// end (rA, rB, rC), and the analytics page with its strategy filter open (anF) and filtered to the best one (anW).
// The strategies' numbers and the cards' places go to ../results.json.     node shots.mjs <idA> <idB> <idC>
import fs from 'node:fs';
import { open, STATE, APP, SCREENS, light } from './lib.mjs';
const IDS = process.argv.slice(2);
const shot = (p, name) => p.screenshot({ path: `${SCREENS}${name}.jpg`, type: 'jpeg', quality: 90 });
const rect = (r) => r && [r.x, r.y, r.width, r.height].map((v) => Math.round(v));
const fa2en = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g, '.').replace(/٬/g, '').replace(/−/g, '-');
const { b, ctx, p, errs } = await open(STATE, 2);
await p.goto(APP + '/dashboard'); await p.waitForTimeout(3000); await light(p); await p.mouse.move(700, 40); await p.waitForTimeout(800); await shot(p, 'dash');
await p.goto(APP + '/strategies'); await p.waitForTimeout(3000); await p.mouse.move(700, 40); await p.waitForTimeout(800); await shot(p, 'strats');
const cards = await p.$$eval('article.card', (as) => as.map((a) => { const r = a.getBoundingClientRect(); return { name: a.querySelector('h3')?.innerText, stats: [...a.querySelectorAll('dd')].map((d) => d.innerText), r: [r.x, r.y, r.width, r.height].map(Math.round) }; }));
const res = cards.map((c) => ({ ...c, total: Number(fa2en(c.stats[0])), win: c.stats[1], rr: c.stats[2], net: c.stats[3], netNum: Number(fa2en(c.stats[3]).replace(/[^0-9.\-]/g, '')) * (/[-]/.test(fa2en(c.stats[3])) ? 1 : 1) }));
console.log(JSON.stringify(res));
// strategy A's rules: its card menu → «ویرایش»
const cardA = p.locator('article.card').filter({ hasText: 'خرید در باز شدن لندن' }).first();
await cardA.getByRole('button', { name: 'گزینه‌ها' }).click(); await p.waitForTimeout(400); await p.getByText('ویرایش', { exact: true }).first().click(); await p.waitForTimeout(900);
await shot(p, 'smodal'); const modal = rect(await p.locator('[role=dialog]').first().boundingBox().catch(() => null));
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
await p.goto(APP + '/checklists'); await p.waitForTimeout(2500); await p.mouse.move(700, 40); await shot(p, 'clist');
const clist = rect(await p.locator('article.card').first().boundingBox());
for (const [i, id] of IDS.entries()) { await p.goto(APP + '/replay/' + id); await p.waitForTimeout(7000); await p.mouse.move(700, 110); await p.waitForTimeout(1200); await shot(p, 'r' + 'ABC'[i]); }
await p.goto(APP + '/analytics'); await p.waitForTimeout(3500); await p.mouse.move(700, 40);
const filt = p.getByRole('button', { name: /همه‌ی استراتژی‌ها/ }).first(); const rf = rect(await filt.boundingBox());
await filt.click(); await p.waitForTimeout(600); await shot(p, 'anF');
const best = res.slice().sort((a, c) => c.netNum - a.netNum)[0];
await p.locator('[role=option]').filter({ hasText: best.name }).first().click(); await p.waitForTimeout(1500); await p.mouse.move(700, 40); await shot(p, 'anW');
fs.writeFileSync(new URL('../results.json', import.meta.url), JSON.stringify({ cards: res, best: best.name, modal, clist, filter: rf }, null, 1));
await ctx.storageState({ path: STATE }); await b.close(); console.log('errors', errs);
