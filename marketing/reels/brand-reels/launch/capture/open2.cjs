// Open the 4-symbol session's replay; exports a helper used by the capture scripts.
const { open, wait, APP } = require('./common.cjs');
async function openReplay(name = 'طلا و شاخص‌ها | سوئینگ') {
  const o = await open();
  const { page } = o;
  await page.goto(`${APP}/sessions`); await wait(2000);
  await page.locator('button[aria-haspopup], [role=combobox]').filter({ hasText: /\|/ }).first().click().catch(() => {});
  await wait(400);
  await page.getByText(name, { exact: true }).first().click(); await wait(800);
  await page.keyboard.press('Escape'); await wait(200);
  await page.getByText('رفتن به چارت').first().click(); await wait(6000);
  await page.mouse.move(1350, 700);
  return o;
}
module.exports = { openReplay };
if (require.main === module) (async () => {
  const OUT = process.argv[2];
  const { b, page } = await openReplay();
  console.log(page.url());
  await page.getByRole('button', { name: '1h', exact: true }).first().click(); await wait(2500);
  await page.mouse.move(1350, 700); await wait(300);
  await page.screenshot({ path: `${OUT}/x-r2-1h.png` });
  await b.close();
})();
