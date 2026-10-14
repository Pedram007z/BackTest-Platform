// On the desktop layout: draw the fib and trendline and add EMA + RSI to the gold session (they sync to the phone).
const { wait } = require('../../reels/brand-reels/launch/capture/common.cjs');
const { openReplay } = require('../../reels/brand-reels/launch/capture/open2.cjs');
(async () => {
  const { b, page } = await openReplay();
  await page.getByRole('button', { name: '1h', exact: true }).first().click(); await wait(1500);
  await page.locator('select').filter({ has: page.locator('option[value="1h"]') }).last().selectOption('1h'); await wait(500);
  await page.mouse.move(720, 28); await wait(300);
  await page.getByRole('button', { name: /^فیبوناچی/ }).click(); await wait(150);
  await page.mouse.click(92, 268); await wait(150); await page.mouse.click(575, 740); await wait(200);
  await page.getByRole('button', { name: /^خط روند/ }).click(); await wait(150);
  await page.mouse.click(575, 742); await wait(150); await page.mouse.click(790, 708); await wait(200);
  await page.getByTitle('اندیکاتورها').click(); await wait(500);
  await page.getByRole('button', { name: /میانگین متحرک نمایی/ }).click(); await wait(400);
  await page.getByTitle('اندیکاتورها').click(); await wait(400);
  await page.getByRole('button', { name: /شاخص قدرت نسبی/ }).click(); await wait(1500);
  await page.keyboard.press('Escape'); await wait(1500);
  await b.close(); console.log('drawn');
})();
