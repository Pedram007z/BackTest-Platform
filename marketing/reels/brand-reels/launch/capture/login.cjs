// Sign in with the dev OTP, name the account, restore the sample data, save the browser state.
const { open, wait, APP } = require('./common.cjs');
(async () => {
  const { b, ctx, page, statePath } = await open({ fresh: true });
  const OUT = process.argv[2];
  await page.goto(`${APP}/#/login`); await wait(1500);
  await page.screenshot({ path: `${OUT}/x-login.png` });
  await page.getByPlaceholder('0912 123 4567').fill('09351112233');
  await page.locator('button[type=submit]').first().click(); await wait(1500);
  const nm = page.locator('#auth-name'); if (await nm.count()) await nm.fill('آرش کریمی');
  await page.getByRole('button', { name: 'وارد کردن' }).click(); await wait(2500);
  console.log('url', page.url());
  await page.screenshot({ path: `${OUT}/x-after-login.png` });
  await ctx.storageState({ path: statePath });
  await b.close();
})();
