// k5's account setup (light theme): three strategies with their rules and an entry checklist, through the app's own forms
import { open, STATE, APP, light } from './lib.mjs';
export const STRATS = [
  ['خرید در باز شدن لندن', 'ساعت ۸ لندن خرید. حد ضرر ۱٫۵ برابر ATR، حد سود ۲R، ریسک ۱٪.'],
  ['فروش در باز شدن لندن', 'ساعت ۸ لندن فروش. حد ضرر ۱٫۵ برابر ATR، حد سود ۲R، ریسک ۱٪.'],
  ['خرید در باز شدن نیویورک', 'ساعت ۸ نیویورک خرید. حد ضرر ۱٫۵ برابر ATR، حد سود ۲R، ریسک ۱٪.'],
];
if (import.meta.url === `file://${process.argv[1]}`) {
  const { b, ctx, p, errs, dump } = await open(STATE);
  await p.goto(APP + '/strategies'); await p.waitForTimeout(2500); await light(p);
  const have = await p.evaluate(() => document.body.innerText);
  for (const [name, desc] of STRATS) {
    if (have.includes(name)) continue;
    await p.getByText('ساخت استراتژی جدید').first().click(); await p.waitForTimeout(700);
    await p.locator('#strategy-name').fill(name); await p.getByPlaceholder('شرایط ورود، حد ضرر، حد سود و مدیریت معامله را بنویسید.').fill(desc);
    await p.getByRole('button', { name: 'ذخیره استراتژی' }).click(); await p.waitForTimeout(900);
  }
  await dump('k5-strategies', 500);
  await p.goto(APP + '/checklists'); await p.waitForTimeout(2000);
  if (!(await p.evaluate(() => document.body.innerText.includes('چک‌لیست ورود')))) {
    await p.getByText('ساخت چک‌لیست جدید').first().click(); await p.waitForTimeout(700);
    await p.locator('#checklist-name').fill('چک‌لیست ورود');
    for (const it of ['ساعت ورود طبق قانون استراتژیه', 'حد ضرر و حد سود ثبت شده', 'ریسک فقط ۱٪']) { await p.locator('#checklist-item').fill(it); await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
    await p.getByRole('button', { name: 'ساخت', exact: true }).click(); await p.waitForTimeout(900);
  }
  await dump('k5-checklists', 500);
  await ctx.storageState({ path: STATE }); await b.close(); console.log('errors', errs);
}
