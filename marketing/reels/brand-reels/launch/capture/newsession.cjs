// Create a gold session on real data through the new-session dialog (and keep shots of the dialog).
const { open, wait, APP } = require('./common.cjs');
async function pickDate(page, id, y, m, d) {
  await page.locator(`#${id}`).click(); await wait(300);
  await page.getByRole('button', { name: 'میلادی', exact: true }).click(); await wait(200);
  await page.locator(`#${id}-year`).selectOption(String(y)); await wait(150);
  await page.locator(`#${id}-month`).selectOption(String(m)); await wait(150);
  const fa = (n) => n.toLocaleString('fa-IR');
  await page.locator(`#${id}`).locator('xpath=..').getByRole('button', { name: fa(d), exact: true }).first().click(); await wait(300);
}
(async () => {
  const { b, ctx, page, statePath } = await open();
  const OUT = process.argv[2];
  await page.goto(`${APP}/dashboard`); await wait(2000);
  await page.getByRole('button', { name: /جلسه جدید/ }).first().click(); await wait(800);
  await page.screenshot({ path: `${OUT}/x-new-empty.png` });
  await page.locator('#session-name').fill('طلا و شاخص‌ها | سوئینگ');
  await page.locator('#session-balance').fill('10000');
  await page.locator('#session-assets').click(); await wait(300);
  for (const sym of ['XAUUSD', 'EURUSD', 'NAS100', 'BTCUSD']) {
    const box = page.locator('input[placeholder^="جستجوی نماد"]');
    await box.fill(sym.slice(0, 4)); await wait(300);
    await box.locator('xpath=ancestor::div[2]').getByText(sym, { exact: true }).first().click(); await wait(300);
  }
  await page.screenshot({ path: `${OUT}/x-new-assets.png` });
  await page.locator('#session-name').click(); await wait(300);
  await pickDate(page, 'session-start', 2025, 4, 9);
  await pickDate(page, 'session-end', 2025, 12, 31);
  await page.screenshot({ path: `${OUT}/x-new2-filled.png` });
  await page.getByRole('button', { name: 'ساخت جلسه', exact: true }).click(); await wait(3000);
  console.log('url', page.url());
  await page.screenshot({ path: `${OUT}/x-after-create2.png` });
  await ctx.storageState({ path: statePath });
  await b.close();
})();
