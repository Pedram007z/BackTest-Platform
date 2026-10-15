// e3's laptop screen: a trader with nothing yet: the dashboard, the sessions page and the new-session form.
//   node pages.cjs <outdir>   (sign in first: ../../e1/capture/login.cjs)
const { open, wait, inject, APP } = require('../../e1/capture/common.cjs');
const OUT = process.argv[2];
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const { b, page } = await open();
  const shot = async (n) => { await page.mouse.move(720, 28); await wait(300); await page.screenshot({ path: `${OUT}/${n}.jpg`, quality: 92 }); };
  await page.goto(`${APP}/dashboard`); await wait(1500);
  await inject(page, { sessions: [], trades: [], strategies: [] }); await page.reload(); await wait(2500);
  await shot('dashboard');
  await page.goto(`${APP}/sessions`); await wait(2500); await shot('sessions');
  await page.getByRole('button', { name: /جلسه جدید|جلسه‌ی جدید/ }).first().click().catch((e) => console.log('new', e.message)); await wait(1500);
  await shot('newsession');
  await b.close();
})();
