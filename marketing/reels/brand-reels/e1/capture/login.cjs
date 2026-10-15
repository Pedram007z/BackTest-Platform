// Sign the trader in with the dev OTP (new account), save the browser state.
const { open, wait, APP, STATE } = require('./common.cjs');
(async () => {
  const { b, ctx, page } = await open({ fresh: true });
  await page.goto(`${APP}/#/login`); await wait(1500);
  await page.getByPlaceholder('0912 123 4567').fill('09357778899');
  await page.locator('button[type=submit]').first().click(); await wait(1500);
  const nm = page.locator('#auth-name'); if (await nm.count()) await nm.fill('امید رحیمی');
  await page.getByRole('button', { name: 'وارد کردن' }).click(); await wait(3000);
  console.log('url', page.url(), await page.evaluate(() => Object.keys(localStorage)));
  await ctx.storageState({ path: STATE });
  await b.close();
})();
