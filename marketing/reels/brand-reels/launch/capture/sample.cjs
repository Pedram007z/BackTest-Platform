// Restore the sample data in Settings, then screenshot dashboard, journal and analytics.
const { open, wait, APP } = require('./common.cjs');
(async () => {
  const { b, ctx, page, statePath } = await open();
  const OUT = process.argv[2];
  await page.goto(`${APP}/settings`); await wait(2000);
  await page.getByRole('button', { name: /بازگردانی داده‌ی نمونه/ }).first().click(); await wait(600);
  await page.screenshot({ path: `${OUT}/x-confirm.png` });
  const dlg = page.getByRole('dialog');
  await page.getByRole('button', { name: 'جایگزین کن' }).click(); await wait(2500);
  await page.goto(`${APP}/dashboard`); await wait(2500);
  await page.screenshot({ path: `${OUT}/x-dashboard.png` });
  await ctx.storageState({ path: statePath });
  await b.close();
})();
