// App pages (sample data + the gold trade) and the logged-out landing page.
const { open, wait, APP } = require('./common.cjs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const OUT = process.argv[2];
const PARK = [720, 28];
async function boxOf(loc) { try { const b = await loc.first().boundingBox({ timeout: 1500 }); return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; } catch { return null; } }
(async () => {
  const { b, page } = await open();
  const boxes = {};
  for (const [name, path, full] of [['dashboard', '/dashboard', true], ['journal', '/journal', true], ['analytics', '/analytics', true], ['sessions', '/sessions', false], ['strategies', '/strategies', false], ['checklists', '/checklists', false]]) {
    await page.goto(APP + path); await wait(3000); await page.mouse.move(...PARK); await wait(300);
    await page.screenshot({ path: `${OUT}/p-${name}.jpg`, quality: 92 });
    if (full) await page.screenshot({ path: `${OUT}/p-${name}-full.jpg`, quality: 90, fullPage: true });
  }
  for (const n of ['داشبورد', 'جلسات', 'استراتژی‌ها', 'چک‌لیست‌ها', 'ژورنال', 'آنالیز']) boxes['nav-' + n] = await boxOf(page.getByRole('link', { name: n, exact: true }));
  fs.writeFileSync(`${OUT}/boxes-pages.json`, JSON.stringify(boxes, null, 1));
  await b.close();
  // landing, logged out
  const b2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p2 = await (await b2.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
  await p2.goto(APP + '/'); await wait(4000); await p2.mouse.move(...PARK);
  await p2.screenshot({ path: `${OUT}/l-hero.jpg`, quality: 92 });
  await p2.screenshot({ path: `${OUT}/l-full.jpg`, quality: 88, fullPage: true });
  await b2.close();
})();
