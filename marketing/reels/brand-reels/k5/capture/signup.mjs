// a new account (the dev server shows the sign-in code), saved to STATE
import { open, STATE, APP, latin } from './lib.mjs';
const { b, ctx, p, errs, dump } = await open();
await p.goto(APP + '/signup'); await p.waitForTimeout(1500);
await p.getByPlaceholder('0912 123 4567').fill('09361234577'); await p.getByRole('button', { name: 'دریافت کد تأیید' }).click(); await p.waitForTimeout(1500);
const txt = await p.evaluate(() => document.body.innerText); const mm = txt.match(/کد ورود شما[^۰-۹0-9]*([۰-۹0-9]{5})/); if (!mm) { console.log(txt.slice(0, 600)); process.exit(1); }
await p.getByPlaceholder('مثلاً: سارا محمدی').fill('نیما احمدی');
await p.locator('input[autocomplete=one-time-code]').fill(latin(mm[1])); await p.waitForTimeout(500);
const go = p.getByRole('button', { name: 'ساخت حساب و ورود' }); if (await go.count()) await go.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(3500);
await dump('k5-signup', 200); await ctx.storageState({ path: STATE }); await b.close(); console.log('errors', errs);
