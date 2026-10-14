// Full replay capture on the gold session (restore the snapshot first: launchsrv/start.sh).
// A: clean + 16 one-hour steps. B: fib, trendline, EMA, RSI. C: buy, then steps until the trade closes. D: news, layout.
const { wait } = require('./common.cjs');
const { openReplay } = require('./open2.cjs');
const fs = require('fs');
const OUT = process.argv[2];
const PARK = [720, 28];
const shot = async (page, name) => { await page.mouse.move(...PARK); await wait(250); await page.screenshot({ path: `${OUT}/${name}`, quality: 92 }); };
const blur = (page) => page.evaluate(() => document.activeElement && document.activeElement.blur());
async function boxOf(loc) { try { const b = await loc.first().boundingBox({ timeout: 1500 }); return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; } catch { return null; } }
const boxes = {};
(async () => {
  const { b, page } = await openReplay();
  await page.getByRole('button', { name: '1h', exact: true }).first().click(); await wait(1500);
  await page.locator('select').filter({ has: page.locator('option[value="1h"]') }).last().selectOption('1h'); await wait(500);
  await blur(page);
  await shot(page, 'r-clean.jpg');
  const MODE = process.argv[3] || 'trade';
  if (MODE === 'clean') {
  fs.mkdirSync(`${OUT}/seq1`, { recursive: true });
  for (let i = 0; i <= 16; i++) {
    if (i) { await page.getByTitle('کندل بعدی (→)').click(); await wait(450); }
    await shot(page, `seq1/${String(i).padStart(3, '0')}.jpg`);
  }
  await b.close(); return;
  }
  // B: drawings and indicators (page coordinates read off the step-16 frame)
  boxes.toolFib = await boxOf(page.getByRole('button', { name: /^فیبوناچی/ }));
  await page.getByRole('button', { name: /^فیبوناچی/ }).click(); await wait(150);
  await page.mouse.click(92, 268); await wait(150); await page.mouse.click(575, 740); await wait(200);
  boxes.toolTrend = await boxOf(page.getByRole('button', { name: /^خط روند/ }));
  await page.getByRole('button', { name: /^خط روند/ }).click(); await wait(150);
  await page.mouse.click(575, 742); await wait(150); await page.mouse.click(790, 708); await wait(200);
  await shot(page, 'r-drawn.jpg');
  boxes.indicators = await boxOf(page.getByTitle('اندیکاتورها'));
  await page.getByTitle('اندیکاتورها').click(); await wait(500);
  await page.mouse.move(...PARK); await wait(200);
  await page.screenshot({ path: `${OUT}/r-indmenu.jpg`, quality: 92 });
  boxes.ema = await boxOf(page.getByRole('button', { name: /میانگین متحرک نمایی/ }));
  await page.getByRole('button', { name: /میانگین متحرک نمایی/ }).click(); await wait(400);
  await page.getByTitle('اندیکاتورها').click(); await wait(400);
  boxes.rsi = await boxOf(page.getByRole('button', { name: /شاخص قدرت نسبی/ }));
  await page.getByRole('button', { name: /شاخص قدرت نسبی/ }).click(); await wait(700);
  await page.keyboard.press('Escape'); await blur(page);
  await shot(page, 'r-tools.jpg');
  // C: buy at the current price, then step until the trade closes
  boxes.buy = await boxOf(page.getByRole('button', { name: 'خرید', exact: true }));
  boxes.risk = await boxOf(page.getByTitle('درصد ریسک هر معامله از موجودی'));
  await page.getByRole('button', { name: 'خرید', exact: true }).first().click(); await wait(1500);
  boxes.market = await boxOf(page.getByTitle('قیمت ورود = قیمت فعلی بازار'));
  await page.getByTitle('قیمت ورود = قیمت فعلی بازار').click().catch((e) => console.log('market btn', e.message)); await wait(600);
  await blur(page);
  await shot(page, 'r-buy.jpg');
  boxes.submit = await boxOf(page.getByRole('button', { name: /ثبت معامله/ }));
  await page.getByRole('button', { name: /ثبت معامله/ }).click(); await wait(1200);
  await shot(page, 'r-placed.jpg');
  fs.mkdirSync(`${OUT}/seq2`, { recursive: true });
  let closedAt = -1;
  for (let i = 0; i <= 48; i++) {
    if (i) { await page.getByTitle('کندل بعدی (→)').click(); await wait(450); }
    await shot(page, `seq2/${String(i).padStart(3, '0')}.jpg`);
    const bar = await page.locator('body').innerText().catch(() => '');
    const m = bar.match(/سود\/زیان محقق:\s*([^\n]*)/); console.log(i, m && m[1]);
    if (i && m && !/\$۰[٫,.]۰۰|\$0\.00/.test(m[1]) && closedAt < 0) closedAt = i;
    if (closedAt >= 0 && i >= closedAt + 3) break;
  }
  console.log('closed at step', closedAt);
  await page.getByTitle('پوزیشن‌های باز و بسته').click(); await wait(700);
  await page.getByRole('button', { name: /پوزیشن‌های بسته/ }).click().catch((e) => console.log('closed tab', e.message)); await wait(600);
  await shot(page, 'r-positions.jpg');
  await page.getByTitle('پوزیشن‌های باز و بسته').click(); await wait(400);
  // D: economic calendar and the 4-chart layout
  boxes.news = await boxOf(page.getByRole('button', { name: /تقویم اقتصادی/ }));
  await page.getByRole('button', { name: /تقویم اقتصادی/ }).first().click(); await wait(1500);
  await shot(page, 'r-news.jpg');
  await page.getByLabel('بستن تقویم اقتصادی').click().catch(() => {}); await wait(400);
  boxes.layout = await boxOf(page.getByRole('button', { name: /چیدمان/ }));
  await page.getByRole('button', { name: /چیدمان/ }).first().click(); await wait(600);
  await shot(page, 'r-layoutmenu.jpg');
  boxes.layout4 = await boxOf(page.getByRole('button', { name: /چهار چارت/ }));
  await page.getByRole('button', { name: /چهار چارت/ }).click().catch((e) => console.log('layout4', e.message)); await wait(4000);
  await shot(page, 'r-layout4.jpg');
  fs.writeFileSync(`${OUT}/boxes-capture.json`, JSON.stringify(boxes, null, 1));
  await b.close();
})();
