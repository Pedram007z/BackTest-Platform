// s1's screens (2×, JPEG) on the TradingView chart of a fresh gold session (14 September 2026, 15-minute candles):
// the clean chart; Indicators opened and "Sessions" typed letter by letter; the indicator added and its boxes drawn;
// its settings; then «برو به» → «شروع سشن لندن» and the replay stepped candle by candle while the London box grows.
// Where each button sat is written to ../marks.json (CSS px of the 1440×900 page) for the story's cursor.
import fs from 'node:fs';
import { open, STATE, APP, SCREENS } from './lib.mjs';
const ID = process.argv[2] || 'se_mvr13mgaagg61';
const shot = (p, name) => p.screenshot({ path: `${SCREENS}${name}.jpg`, type: 'jpeg', quality: 90 });
const marks = {}, box = async (k, loc) => { const r = await loc.boundingBox(); marks[k] = r && [r.x, r.y, r.width, r.height].map((v) => Math.round(v)); return r; };
const mid = (r) => [r.x + r.width / 2, r.y + r.height / 2];
const { b, p, errs } = await open(STATE, 2);
await p.goto(APP + '/replay/' + ID); await p.waitForTimeout(10000);
const fr = p.frames().find((x) => x.url().startsWith('blob:'));
// start clean: an earlier run's indicators go
await fr.evaluate(() => { const c = window.tradingViewApi.activeChart(); c.getAllStudies().forEach((s) => c.removeEntity(s.id)); });
await p.mouse.move(1320, 400); await p.waitForTimeout(1500); await shot(p, 'a0');
// Indicators
const ind = fr.locator('[data-name="open-indicators-dialog"]:visible').first(); const ri = await box('indicators', ind);
await p.mouse.move(...mid(ri), { steps: 8 }); await p.waitForTimeout(400); await shot(p, 'a1');
await p.mouse.click(...mid(ri)); await p.waitForTimeout(1200); await shot(p, 'b00');
const search = fr.locator('input[data-role="search"]:visible, input[placeholder*="Search" i]:visible').first(); await box('search', search);
const word = 'Sessions';
for (let i = 0; i < word.length; i++) { await p.keyboard.type(word[i]); await p.waitForTimeout(300); await shot(p, `b${String(i + 1).padStart(2, '0')}`); }
const item = fr.getByText('Sessions (High / Low)').first(); const rr = await box('result', item); await box('dialog', fr.locator('[data-name="indicators-dialog"], [class*="dialog-"]:visible').first());
await p.mouse.move(...mid(rr), { steps: 8 }); await p.waitForTimeout(400); await shot(p, 'b09');
await p.mouse.click(...mid(rr)); await p.waitForTimeout(900); await shot(p, 'b10');
await p.keyboard.press('Escape'); await p.waitForTimeout(400); await p.mouse.move(1320, 400); await p.waitForTimeout(2500); await shot(p, 'c0');
console.log('shapes', await fr.evaluate(() => window.tradingViewApi.activeChart().getAllShapes().length));
// the legend: hover its title (its buttons show), then a double click opens the settings, as in TradingView
const title = fr.locator('[data-name="legend-source-title"]').filter({ hasText: /^Sessions$/ }).first(); const rl = await box('legend', title);
await p.mouse.move(...mid(rl), { steps: 8 }); await p.waitForTimeout(600); await shot(p, 'c1');
await p.mouse.dblclick(...mid(rl)); await p.waitForTimeout(1300); await shot(p, 'd0');
const dlg = fr.locator('[data-name="indicator-properties-dialog"], [class*="dialog"]:visible').first(); await box('settings', dlg);
// scroll the inputs to London and New York
const body = fr.getByText('Session 3: show').first(); await body.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await shot(p, 'd1');
await box('london', fr.getByText('Session 3: hours').first());
await p.keyboard.press('Escape'); await p.waitForTimeout(600);
// «برو به» → «شروع سشن لندن»
const goto = p.getByRole('button', { name: 'برو به' }).first(); const rgo = await box('goto', goto);
await p.mouse.move(...mid(rgo), { steps: 8 }); await p.mouse.click(...mid(rgo)); await p.waitForTimeout(700); await shot(p, 'e0');
const ld = p.getByRole('button', { name: /شروع سشن لندن/ }).first(); const rld = await box('gotoLondon', ld);
await p.mouse.move(...mid(rld), { steps: 8 }); await p.waitForTimeout(300); await shot(p, 'e1');
await p.mouse.click(...mid(rld)); await p.waitForTimeout(4000);
// closer candles, the newest at the right
await fr.evaluate(() => { const ts = window.tradingViewApi.activeChart().getTimeScale(); ts.setBarSpacing(11); ts.setRightOffset(8); });
const next = p.getByRole('button', { name: 'نمایش کندل بعدی' }); const rn = await box('step', next);
await p.mouse.move(...mid(rn), { steps: 8 }); await p.waitForTimeout(2000); await shot(p, 'f00');
for (let i = 1; i <= 36; i++) { await p.mouse.click(...mid(rn)); await p.waitForTimeout(650); await shot(p, `f${String(i).padStart(2, '0')}`); }
marks.clock = await p.evaluate(() => document.body.innerText.match(/\S+، \d*[۰-۹]+ \S+ [۰-۹]+ · [۰-۹:]+/)?.[0]);
fs.writeFileSync(new URL('../marks.json', import.meta.url), JSON.stringify(marks, null, 1));
console.log(JSON.stringify(marks)); await b.close(); console.log('errors', errs);
