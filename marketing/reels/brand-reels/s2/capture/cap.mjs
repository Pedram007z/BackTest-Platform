// s2's screen (2×, JPEG): the billing page in the dark theme, with DISCOUNT20 typed into «کد تخفیف» letter by letter
// (p00 empty … p10 the whole code, then p11 with the cursor on «اعمال»). The code isn't applied here: the local copy
// doesn't have it, and the plan prices on this page are the platform's defaults. Where things sat goes to ../marks.json.
import fs from 'node:fs';
import { open, STATE, APP, SCREENS, dark } from './lib.mjs';
const shot = (p, name) => p.screenshot({ path: `${SCREENS}${name}.jpg`, type: 'jpeg', quality: 90 });
const rect = async (loc) => { const r = await loc.boundingBox(); return r && [r.x, r.y, r.width, r.height].map((v) => Math.round(v)); };
const { b, p, errs } = await open(STATE, 2);
await p.goto(APP + '/billing'); await p.waitForTimeout(3000); await dark(p); await p.mouse.move(700, 60); await p.waitForTimeout(800);
const input = p.getByPlaceholder('PAEEZ1405'), apply = p.getByRole('button', { name: 'اعمال' });
const marks = { input: await rect(input), apply: await rect(apply), label: await rect(p.getByText('کد تخفیف', { exact: true }).first()), methods: await rect(p.getByText('روش پرداخت', { exact: true }).first()) };
await input.click(); await p.waitForTimeout(300); await shot(p, 'p00');
const code = 'DISCOUNT20';
for (let i = 0; i < code.length; i++) { await p.keyboard.type(code[i]); await p.waitForTimeout(120); await shot(p, `p${String(i + 1).padStart(2, '0')}`); }
const ra = marks.apply; await p.mouse.move(ra[0] + ra[2] / 2, ra[1] + ra[3] / 2, { steps: 8 }); await p.waitForTimeout(500); await shot(p, 'p11');
fs.writeFileSync(new URL('../marks.json', import.meta.url), JSON.stringify(marks, null, 1)); console.log(JSON.stringify(marks));
await b.close(); console.log('errors', errs);
