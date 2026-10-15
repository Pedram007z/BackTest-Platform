// Renders the character sheet: the portrait, his name and line, mouth/blink states for lip sync.  node sheet.cjs <out.png>
const { chromium } = require('../../tools/pw.cjs');
const { characterSVG } = require('./character.cjs');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const font = 'file://' + path.resolve(__dirname, '../../../../');
  const states = [{ mouth: 0 }, { mouth: 1, shape: 'rest' }, { mouth: 1, shape: 'o' }, { mouth: 0.8, shape: 'e' }, { blink: 1 }, { brow: 1, mouth: 0.6 }];
  const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Vaz;src:url(${font}/public/fonts/vazirmatn-arabic.woff2)}
@font-face{font-family:Rdx;src:url(${font}/node_modules/@fontsource-variable/readex-pro/files/readex-pro-arabic-wght-normal.woff2);font-weight:160 700}
body{margin:0;width:1080px;height:1920px;background:#07050F;color:#EEEBF6;font-family:Vaz;overflow:hidden}
.top{position:absolute;top:0;left:0}.t{position:absolute;width:1080px;text-align:center}
.row{position:absolute;top:1560px;left:30px;display:flex;gap:12px;direction:ltr}.row div{width:162px;height:203px;border-radius:18px;overflow:hidden;border:2px solid #302A44}
.lab{position:absolute;top:1775px;width:1080px;text-align:center;color:#A39CBA;font-size:26px}</style></head><body>
<div class="top">${characterSVG({})}</div>
<div class="t" style="top:1365px;font:800 84px Rdx">زمان‌گرد</div>
<div class="t" style="top:1475px;font:500 34px Vaz;color:#B5A2FF">تریدری که هر روزِ بازار رو برمی‌گردونه و دوباره معامله می‌کنه</div>
<div class="row">${states.map((s) => `<div>${characterSVG({ ...s }).replace('width="1080" height="1350"', 'width="162" height="203"')}</div>`).join('')}</div>
<div class="lab">حالت‌های دهان، پلک و ابرو برای لب‌خوانی با صدای تو</div>
</body></html>`;
  await p.setContent(html); await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 800));
  await p.screenshot({ path: process.argv[2] }); await b.close(); console.log('ok');
})();
