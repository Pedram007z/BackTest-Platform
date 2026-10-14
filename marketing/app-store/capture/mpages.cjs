// Phone screens: economic calendar on the replay, journal, analytics and dashboard (sample account + the gold trade).
const { mopen, wait, APP } = require('./mcommon.cjs');
const OUT = process.argv[2];
(async () => {
  const { b, page } = await mopen();
  await page.goto(APP + '/replay/se_mv8isl7eu1l1p'); await wait(6000);
  await page.getByRole('button', { name: /تقویم اقتصادی/ }).first().click(); await wait(2000);
  await page.screenshot({ path: `${OUT}/m-news.png` });
  await page.keyboard.press('Escape').catch(() => {});
  await page.goto(APP + '/journal'); await wait(3000);
  await page.screenshot({ path: `${OUT}/m-journal-full.png`, fullPage: true });
  await page.goto(APP + '/analytics'); await wait(3500);
  await page.screenshot({ path: `${OUT}/m-analytics-full.png`, fullPage: true });
  await page.goto(APP + '/dashboard'); await wait(3000);
  await page.screenshot({ path: `${OUT}/m-dashboard-full.png`, fullPage: true });
  await page.goto(APP + '/sessions'); await wait(3000);
  await page.screenshot({ path: `${OUT}/m-sessions-full.png`, fullPage: true });
  await b.close();
})();
