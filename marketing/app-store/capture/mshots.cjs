// Phone screens of the gold session: tools, the order ticket, the target hit, and the rally after it.
const { mopen, wait, APP } = require('./mcommon.cjs');
const OUT = process.argv[2];
(async () => {
  const { b, page } = await mopen();
  const shot = async (n) => { await page.mouse.click(195, 30).catch(() => {}); await wait(300); await page.screenshot({ path: `${OUT}/${n}.png` }); };
  await page.goto(APP + '/replay/se_mv8isl7eu1l1p'); await wait(6000);
  await page.getByRole('button', { name: '1h', exact: true }).first().click(); await wait(2500);
  await page.locator('select').filter({ has: page.locator('option[value="1h"]') }).last().selectOption('1h'); await wait(500);
  await page.evaluate(() => document.querySelector('.overflow-x-auto')?.scrollTo({ left: 99999 })); await wait(300);
  await page.screenshot({ path: `${OUT}/m-tools0.png` });
  await page.getByRole('button', { name: 'خرید', exact: true }).first().click(); await wait(1500);
  await page.screenshot({ path: `${OUT}/m-ticket.png` });
  await page.getByRole('button', { name: /ثبت معامله/ }).click().catch((e) => console.log('submit', e.message)); await wait(1200);
  await page.screenshot({ path: `${OUT}/m-placed.png` });
  for (let i = 1; i <= 14; i++) { await page.getByTitle('کندل بعدی (→)').click(); await wait(500); if (i === 6 || i === 10 || i === 14) await page.screenshot({ path: `${OUT}/m-step${i}.png` }); }
  await b.close();
})();
