import pw from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pw;
export const B = '/tmp/claude-0/-home-user/ee32f65e-2583-5cba-b28d-231a4c3e2f45/scratchpad/bp', APP = 'http://localhost:5173';
export async function open(state, scale = 1) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale, colorScheme: 'dark', ...(state ? { storageState: state } : {}) });
  // hide toasts so they don't cover the screens
  await ctx.addInitScript(() => { addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.pointer-events-none.fixed.bottom-4{display:none!important}'; document.head.append(st); }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const dump = async (tag, n = 700) => { await p.screenshot({ path: `${B}/shots/${tag}.png` }); const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')); console.log(`--- ${tag}: ${p.url()}\n${t.slice(0, n)}`); };
  const buttons = async () => console.log((await p.$$eval('button, a, [role=button]', (els) => els.map((e) => (e.innerText || e.getAttribute('aria-label') || e.title || '').trim().replace(/\s+/g, ' ').slice(0, 30)).filter(Boolean))).join(' | '));
  return { b, ctx, p, errs, dump, buttons };
}
export const latin = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
