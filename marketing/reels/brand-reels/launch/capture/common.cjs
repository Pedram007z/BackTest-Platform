// Shared Playwright setup for the launch reel captures: 1440x900 @2x, dark theme, signed in on the local server.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const APP = 'http://localhost:5174';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function open({ fresh = false } = {}) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const statePath = __dirname + '/state.json';
  const fs = require('fs');
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'fa-IR',
    ...(!fresh && fs.existsSync(statePath) ? { storageState: statePath } : {}) });
  await ctx.addInitScript(() => { addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.pointer-events-none.fixed.bottom-4{display:none!important} *{caret-color:transparent!important}'; document.head.append(st); }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  return { b, ctx, page, statePath };
}
module.exports = { open, wait, APP };
