// Playwright setup for e1's captures: 1440x900 @2x, dark theme, signed in as the reel's trader on the local server.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const APP = 'http://localhost:5174';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const STATE = __dirname + '/state.json';
async function open({ fresh = false, w = 1440, h = 900 } = {}) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'fa-IR',
    ...(!fresh && fs.existsSync(STATE) ? { storageState: STATE } : {}) });
  await ctx.addInitScript(() => { addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.pointer-events-none.fixed.bottom-4{display:none!important} *{caret-color:transparent!important}'; document.head.append(st); }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  return { b, ctx, page };
}
// Replace the signed-in user's sessions/trades/strategies with `data` (the app keeps them in localStorage).
async function inject(page, data) {
  await page.evaluate((data) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('backtest-dashboard:v2:u_'));
    const cur = JSON.parse(localStorage.getItem(key));
    Object.assign(cur.state, data, { hasDemoData: false });
    localStorage.setItem(key, JSON.stringify(cur));
  }, data);
}
module.exports = { open, wait, inject, APP, STATE };
