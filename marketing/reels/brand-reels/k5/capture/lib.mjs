// k5's capture helpers: a 1440×900 desktop browser on the local platform (npm run dev + the API server on its market store),
// in the platform's light theme and on its built-in chart (whose news flags carry the hover card with the time and Persian title)
import pw from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pw;
export const B = '/tmp/claude-0/-home-user/ee32f65e-2583-5cba-b28d-231a4c3e2f45/scratchpad/bp', APP = 'http://localhost:5173';
export const STATE = `${B}/state-k5.json`, SCREENS = new URL('../screens/', import.meta.url).pathname;
export async function open(state, scale = 1) {
  const b = await chromium.launch(scale !== 1 ? { args: [`--force-device-scale-factor=${scale}`] } : {});
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale, colorScheme: 'light', ...(state ? { storageState: state } : {}) });
  await ctx.addInitScript(() => {
    localStorage.setItem('backtest:chart-engine', 'lightweight');
    // hide toasts so they don't cover the screens
    addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.pointer-events-none.fixed.bottom-4{display:none!important}'; document.head.append(st); });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const dump = async (tag, n = 700) => { await p.screenshot({ path: `${B}/shots/${tag}.png` }); const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')); console.log(`--- ${tag}: ${p.url()}\n${t.slice(0, n)}`); };
  return { b, ctx, p, errs, dump };
}
/** the account's theme to light (it is saved with the account), through the header's own button */
export async function light(p) {
  const btn = p.getByRole('button', { name: 'حالت روشن' }).first();
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(800); }
}
export const latin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
