// Phone-sized Playwright context (390x844 @3x, touch), signed in with the launch captures' saved state.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const APP = 'http://localhost:5174';
const STATE = require('path').join(__dirname, '../../reels/brand-reels/launch/capture/state.json');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function mopen() {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'fa-IR', storageState: STATE,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  await ctx.addInitScript(() => { addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.pointer-events-none.fixed.bottom-4{display:none!important} *{caret-color:transparent!important}'; document.head.append(st); }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  return { b, ctx, page };
}
module.exports = { mopen, wait, APP };
