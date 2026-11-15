# Glass-slab covers for k30 and k31. The user shared another brand's cover as a reference. Only its composition is
# taken: a big two-line headline (the second line in the brand colour), a glowing glass slab in perspective holding a
# chart with small label chips, its reflection on the floor, and the logo at the bottom. The words, the chart and the
# logo are BacktestLab's own.
#   python3 build.py k30 → k30/index.html (dark, the logo's violet: k30's violet cut)
#   python3 build.py k31 → k31/index.html (light, ink and violet: k31's explainer)
#   python3 build.py k32 → k32/index.html (light, the BOS chart: k32)
#   node shot.cjs k30 → k30-cover.png (1080×1920)
import base64, os, sys
NAME = sys.argv[1] if len(sys.argv) > 1 else 'k30'
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '../../../..')
b64 = lambda p: base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()
TH = {
  'k30': dict(dark=1, bg='#07040F', glow='rgba(106,70,255,0.42)', l1='#FFFFFF', l2='linear-gradient(90deg,#8E6BFF,#D8CCFF)', l1t='استراتژیت سودده‌ست', l2t='یا فقط توی ذهنت؟',
              logo='brand/svg/logo-fa-dark.svg', kicker='بدون دیدن آینده تستش کن'),
  'k31': dict(dark=0, bg='#EDECE8', glow='rgba(106,70,255,0.20)', l1='#17131F', l2='linear-gradient(90deg,#5430E6,#8E6BFF)', l1t='چرا روی چارت گذشته', l2t='همه سودده‌ان؟',
              logo='brand/svg/logo-fa-light.svg', kicker='۹ قدم تا یه تست واقعی'),
  'k32': dict(dark=0, bg='#EDECE8', glow='rgba(106,70,255,0.20)', l1='#17131F', l2='linear-gradient(90deg,#5430E6,#8E6BFF)', l1t='هر شکستی', l2t='BOS نیست!',
              logo='brand/svg/logo-fa-light.svg', kicker='قانون BOS معتبر', chart='bos', hs=150),
}[NAME]
D = TH['dark']
html = f'''<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>{NAME} cover</title><style>
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-arabic.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0600-06FF, U+0750-077F, U+200C-200F, U+2066-2069, U+FB50-FDFF, U+FE70-FEFF; }}
@font-face {{ font-family: Vazirmatn; src: url(data:font/woff2;base64,{b64('public/fonts/vazirmatn-latin.woff2')}) format('woff2'); font-weight: 100 900; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: {TH['bg']}; font-family: Vazirmatn; }}
.bg {{ position: absolute; inset: 0; background: radial-gradient(60% 34% at 50% 61%, {TH['glow']}, transparent 70%), radial-gradient(90% 60% at 50% 0%, {'rgba(84,48,230,0.16)' if D else 'rgba(255,255,255,0.9)'}, transparent 60%); }}
.grain {{ position: absolute; inset: 0; opacity: {0.05 if D else 0.035}; background-image: radial-gradient({'#fff' if D else '#000'} 1px, transparent 1.2px); background-size: 6px 6px; }}
.kicker {{ position: absolute; top: 400px; width: 100%; text-align: center; direction: rtl; font-weight: 600; font-size: 38px; color: {'rgba(216,204,255,0.75)' if D else '#7A7684'}; letter-spacing: 0; }}
.kicker b {{ display: inline-block; padding: 8px 26px; border-radius: 40px; border: 2px solid {'rgba(165,139,255,0.45)' if D else 'rgba(106,70,255,0.25)'}; background: {'rgba(106,70,255,0.12)' if D else 'rgba(106,70,255,0.07)'}; font-weight: 700; color: {'#D8CCFF' if D else '#6A46FF'}; }}
.h {{ position: absolute; top: 478px; width: 100%; text-align: center; direction: rtl; font-weight: 900; line-height: 1.18; }}
.h div {{ white-space: nowrap; font-size: 200px; width: fit-content; margin: 0 auto; }}
.l1 {{ color: {TH['l1']}; }}
.l2 {{ background: {TH['l2']}; -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 {'26px rgba(124,92,255,0.65)' if D else '0 rgba(0,0,0,0)'}); padding: 0 10px; }}
.scene {{ position: absolute; left: 0; top: 860px; width: 1080px; height: 780px; perspective: 1500px; perspective-origin: 50% 32%; }}
.slab {{ position: absolute; left: 120px; top: 70px; width: 840px; height: 520px; transform-style: preserve-3d; transform: rotateX(13deg) rotateY(-19deg) rotateZ(-3.5deg); }}
.face {{ position: absolute; border-radius: 36px; }}
.back {{ inset: 0; transform: translateZ(-34px); border: 2px solid {'rgba(150,120,255,0.55)' if D else 'rgba(106,70,255,0.28)'}; background: {'rgba(40,20,100,0.35)' if D else 'rgba(255,255,255,0.55)'}; box-shadow: 0 0 {'40px rgba(124,92,255,0.55)' if D else '30px rgba(106,70,255,0.18)'}; }}
.edgeB {{ left: 36px; top: 520px; width: 768px; height: 34px; border-radius: 0; transform-origin: top; transform: rotateX(-90deg); background: linear-gradient(180deg, {'rgba(205,190,255,0.85), rgba(110,80,255,0.35)' if D else 'rgba(255,255,255,1), rgba(196,184,255,0.9)'}); }}
.edgeR {{ left: 840px; top: 36px; width: 34px; height: 448px; border-radius: 0; transform-origin: left; transform: rotateY(90deg); background: linear-gradient(90deg, {'rgba(205,190,255,0.75), rgba(110,80,255,0.3)' if D else 'rgba(255,255,255,1), rgba(196,184,255,0.85)'}); }}
.front {{ inset: 0; overflow: hidden; background: linear-gradient(155deg, {'rgba(255,255,255,0.16), rgba(255,255,255,0.03) 42%, rgba(165,139,255,0.10)' if D else 'rgba(255,255,255,0.97), rgba(255,255,255,0.86) 50%, rgba(238,233,255,0.95)'}); border: 2.5px solid {'rgba(214,202,255,0.85)' if D else 'rgba(255,255,255,1)'};
  box-shadow: {'0 0 60px rgba(124,92,255,0.6), inset 0 0 50px rgba(165,139,255,0.22)' if D else '0 30px 70px rgba(54,30,150,0.22), 0 0 0 2px rgba(106,70,255,0.18), inset 0 0 40px rgba(106,70,255,0.06)'}; }}
.front::after {{ content: ''; position: absolute; left: -20%; top: -60%; width: 60%; height: 220%; transform: rotate(24deg); background: linear-gradient(90deg, transparent, {'rgba(255,255,255,0.10)' if D else 'rgba(255,255,255,0.55)'}, transparent); }}
canvas {{ position: absolute; left: 0; top: 0; width: 840px; height: 520px; }}
.chip {{ position: absolute; transform: translate(-50%, -50%); padding: 6px 20px 8px; border-radius: 16px; direction: rtl; white-space: nowrap; font-weight: 800; font-size: 32px;
  color: {'#FFFFFF' if D else '#17131F'}; background: {'rgba(14,8,34,0.82)' if D else '#FFFFFF'}; border: 2px solid {'rgba(214,202,255,0.85)' if D else 'rgba(23,19,31,0.12)'}; box-shadow: {'0 0 18px rgba(124,92,255,0.55)' if D else '0 8px 22px rgba(23,19,31,0.12)'}; }}
.chip.g {{ color: {'#7DFFB2' if D else '#FFFFFF'}; {'' if D else 'background:#12A15E; border-color:#12A15E;'} }}
.chip.r {{ color: {'#FF8A95' if D else '#FFFFFF'}; {'' if D else 'background:#E5484D; border-color:#E5484D;'} }}
.chip.v {{ font-size: 28px;  color: {'#D8CCFF' if D else '#FFFFFF'}; {'border-color:#A58BFF;' if D else 'background:#6A46FF; border-color:#6A46FF;'} }}
.refl {{ position: absolute; left: 0; top: 560px; width: 840px; height: 520px; transform: scaleY(-1); opacity: {0.24 if D else 0.16}; filter: blur(2.5px); border-radius: 36px; overflow: hidden;
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.85), transparent 36%); mask-image: linear-gradient(to top, rgba(0,0,0,0.85), transparent 36%); }}
.floor {{ position: absolute; left: 90px; top: 1450px; width: 900px; height: 190px; border-radius: 50%; background: radial-gradient(closest-side, {'rgba(124,92,255,0.45)' if D else 'rgba(106,70,255,0.16)'}, transparent); filter: blur(10px); }}
.logo {{ position: absolute; left: 50%; top: 1628px; transform: translateX(-50%); height: 80px; }}
</style></head><body>
<div class="bg"></div><div class="grain"></div><div class="floor"></div>
<div class="kicker"><b>{TH['kicker']}</b></div>
<div class="h"><div class="l1">{TH['l1t']}</div><div class="l2">{TH['l2t']}</div></div>
<div class="scene"><div class="slab">
  <div class="face back"></div><div class="face edgeB"></div><div class="face edgeR"></div>
  <div class="refl"><canvas id="r" width="1680" height="1040"></canvas></div>
  <div class="face front" id="front"><canvas id="c" width="1680" height="1040"></canvas></div>
</div></div>
<img class="logo" src="data:image/svg+xml;base64,{b64(TH['logo'])}">
<script>
const DARK = {D}, CHART = '{TH.get('chart', 'future')}', HS = {TH.get('hs', 200)}, cv = document.getElementById('c').getContext('2d'), front = document.getElementById('front');
(async () => {{ await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${{w}} 100px Vazirmatn`, 'آبپ؟'))); cv.scale(2, 2);
const rnd = (i) => {{ const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }};
// the chips, each on a short stem
const chip = (s, cls, x, y, tx, ty) => {{ cv.save(); cv.strokeStyle = DARK ? 'rgba(214,202,255,0.8)' : 'rgba(23,19,31,0.35)'; cv.lineWidth = 2; cv.beginPath(); cv.moveTo(x, y); cv.lineTo(tx, ty); cv.stroke(); cv.restore(); const e = document.createElement('div'); e.className = 'chip ' + cls; e.textContent = s; e.style.left = tx + 'px'; e.style.top = ty + 'px'; front.appendChild(e); }};
if (CHART === 'bos') bos(); else {{
// a drawn sample: a slide to a low, a rally to a high, a pullback; the last part is the future
const N = 34, OH = []; {{ let p = 100; for (let i = 0; i < N; i++) {{ const d = i < 9 ? -2.0 : i < 23 ? 2.4 : i < 27 ? -1.6 : 1.2, c = p + d + (rnd(i * 7 + 3) - 0.5) * 3.0; OH.push({{ o: p, c, h: Math.max(p, c) + rnd(i * 11 + 1) * 1.8, l: Math.min(p, c) - rnd(i * 13 + 2) * 1.8 }}); p = c; }} }}
let LO = 0, HI = 9; for (let i = 0; i < 12; i++) if (OH[i].l < OH[LO].l) LO = i; for (let i = 9; i < 27; i++) if (OH[i].h > OH[HI].h) HI = i;
const NOW = 24, vmin = Math.min(...OH.map((d) => d.l)) - 3, vmax = Math.max(...OH.map((d) => d.h)) + 4;
const B = {{ x: 56, y: 70, w: 728, h: 390 }}, X = (i) => B.x + (i + 0.5) * B.w / N, Y = (v) => B.y + B.h - (v - vmin) / (vmax - vmin) * B.h;
const UP = DARK ? '#C9B8FF' : '#12A15E', DN = DARK ? 'rgba(255,255,255,0.92)' : '#E5484D', GLOW = DARK ? 'rgba(140,110,255,0.9)' : 'rgba(0,0,0,0)';
cv.strokeStyle = DARK ? 'rgba(255,255,255,0.07)' : 'rgba(23,19,31,0.07)'; cv.lineWidth = 1.5; for (let k = 0; k <= 4; k++) {{ cv.beginPath(); cv.moveTo(B.x, B.y + B.h * k / 4); cv.lineTo(B.x + B.w, B.y + B.h * k / 4); cv.stroke(); }}
const cut = DARK ? NOW : N, bw = B.w / N * 0.58;
for (let i = 0; i < cut; i++) {{ const d = OH[i], col = d.c >= d.o ? UP : DN, x = X(i); cv.save(); cv.shadowColor = GLOW; cv.shadowBlur = DARK ? 14 : 0; cv.strokeStyle = col; cv.lineWidth = 2.5; cv.beginPath(); cv.moveTo(x, Y(d.h)); cv.lineTo(x, Y(d.l)); cv.stroke();
  const y1 = Y(Math.max(d.o, d.c)), y2 = Y(Math.min(d.o, d.c)); cv.fillStyle = col; cv.beginPath(); cv.roundRect(x - bw / 2, y1, bw, Math.max(4, y2 - y1), 2.5); cv.fill(); cv.restore(); }}
// the hindsight trade: a dashed line from the buy at the low to the sell at the high
const bx = X(LO), by = Y(OH[LO].l) + 14, sx = X(HI), sy = Y(OH[HI].h) - 14;
cv.save(); cv.setLineDash([10, 9]); cv.strokeStyle = DARK ? 'rgba(232,224,255,0.95)' : 'rgba(23,19,31,0.55)'; cv.lineWidth = 3; cv.shadowColor = GLOW; cv.shadowBlur = DARK ? 10 : 0; cv.beginPath(); cv.moveTo(bx, by); cv.lineTo(sx, sy); cv.stroke(); cv.restore();
[[bx, by, DARK ? '#7DFFB2' : '#12A15E'], [sx, sy, DARK ? '#FF8A95' : '#E5484D']].forEach(([x, y, c]) => {{ cv.save(); cv.shadowColor = c; cv.shadowBlur = DARK ? 22 : 0; cv.fillStyle = DARK ? '#FFFFFF' : c; cv.beginPath(); cv.arc(x, y, 9, 0, Math.PI * 2); cv.fill(); cv.lineWidth = 3; cv.strokeStyle = c; cv.beginPath(); cv.arc(x, y, 16, 0, Math.PI * 2); cv.stroke(); cv.restore(); }});
const xn = X(NOW) - B.w / N / 2;
if (DARK) {{ // the future: lost to static, with a «؟»
  cv.save(); cv.strokeStyle = 'rgba(214,202,255,0.8)'; cv.lineWidth = 2.5; cv.setLineDash([6, 8]); cv.beginPath(); cv.moveTo(xn, B.y - 20); cv.lineTo(xn, B.y + B.h + 10); cv.stroke(); cv.restore();
  for (let k = 0; k < 900; k++) {{ const x = xn + 8 + rnd(k * 3 + 1) * (B.x + B.w + 30 - xn), y = B.y - 10 + rnd(k * 7 + 2) * (B.h + 20); cv.fillStyle = `rgba(200,185,255,${{0.12 + 0.5 * rnd(k * 11 + 5)}})`; cv.fillRect(x, y, 2.5, 2.5); }}
  cv.save(); cv.font = '900 150px Vazirmatn'; cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.shadowColor = 'rgba(165,139,255,1)'; cv.shadowBlur = 40; cv.fillStyle = '#E9E2FF'; cv.fillText('؟', (xn + B.x + B.w + 30) / 2, B.y + B.h * 0.42); cv.restore();
}} else {{ // the future: covered
  const x0 = xn, w0 = 840 - x0; cv.fillStyle = 'rgba(241,237,255,0.97)'; cv.fillRect(x0, 0, w0, 520); cv.save(); cv.beginPath(); cv.rect(x0, 0, w0, 520); cv.clip(); cv.strokeStyle = 'rgba(106,70,255,0.12)'; cv.lineWidth = 10; for (let k = -600; k < 900; k += 40) {{ cv.beginPath(); cv.moveTo(x0 + k, 0); cv.lineTo(x0 + k + 520, 520); cv.stroke(); }} cv.restore();
  cv.strokeStyle = '#6A46FF'; cv.lineWidth = 3; cv.setLineDash([8, 8]); cv.beginPath(); cv.moveTo(x0, 30); cv.lineTo(x0, 490); cv.stroke(); cv.setLineDash([]);
  const ex = x0 + w0 / 2, ey = 230, s = 40; cv.lineWidth = 6; cv.beginPath(); cv.moveTo(ex - s, ey); cv.quadraticCurveTo(ex, ey - s * 0.95, ex + s, ey); cv.quadraticCurveTo(ex, ey + s * 0.95, ex - s, ey); cv.stroke(); cv.fillStyle = '#6A46FF'; cv.beginPath(); cv.arc(ex, ey, s * 0.32, 0, Math.PI * 2); cv.fill(); cv.beginPath(); cv.moveTo(ex - s * 0.9, ey + s * 0.8); cv.lineTo(ex + s * 0.9, ey - s * 0.8); cv.stroke();
}}
chip('خرید', 'g', bx, by + 16, bx + 40, by + 64 > 490 ? 490 : by + 64);
chip('فروش', 'r', sx, sy - 16, sx - 10, Math.max(36, sy - 62));
if (DARK) chip('آینده: نامعلوم', 'v', (xn + B.x + B.w + 30) / 2, B.y + B.h * 0.6, (xn + B.x + B.w + 30) / 2, B.y + B.h * 0.78);
else chip('آینده: مخفی', 'v', xn + (840 - xn) / 2, 290, xn + (840 - xn) / 2, 330);
}}
// the BOS chart: a rise to a high candle, a dip whose wick goes under that candle's low but whose close doesn't, then a
// break above the high, which isn't a BOS
function bos() {{ const S = [[20,24,25,19],[24,23,25.5,22],[23,28,29,22.5],[28,27,29,26],[27,32,33,26.5],[32,31,33.5,30],[31,36,38,30.5],[36,34,36.5,31.8],[34,32,34.5,29],[32,33,33.8,31.5],[33,37,37.8,32.5],[37,40,41,36.5],[40,43,44,39.5],[43,42,44.5,41]].map(([o, c, h, l]) => ({{ o, c, h, l }}));
  const NN = 16, B = {{ x: 60, y: 60, w: 720, h: 400 }}, lo = 16, hi = 47, X = (i) => B.x + (i + 0.5) * B.w / NN, Y = (v) => B.y + B.h - (v - lo) / (hi - lo) * B.h, bw = B.w / NN * 0.6;
  cv.strokeStyle = 'rgba(23,19,31,0.07)'; cv.lineWidth = 1.5; for (let k = 0; k <= 4; k++) {{ cv.beginPath(); cv.moveTo(B.x, B.y + B.h * k / 4); cv.lineTo(B.x + B.w, B.y + B.h * k / 4); cv.stroke(); }}
  const dash = (v, i0, i1, col, lw = 3) => {{ cv.save(); cv.setLineDash([10, 9]); cv.strokeStyle = col; cv.lineWidth = lw; cv.beginPath(); cv.moveTo(X(i0) - bw, Y(v)); cv.lineTo(X(i1) + bw, Y(v)); cv.stroke(); cv.restore(); }};
  dash(38, 6, 14, 'rgba(23,19,31,0.6)'); dash(30.5, 6, 10, '#6A46FF');
  S.forEach((d, i) => {{ const col = d.c >= d.o ? '#12A15E' : '#E5484D', x = X(i); cv.strokeStyle = col; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(x, Y(d.h)); cv.lineTo(x, Y(d.l)); cv.stroke(); const y1 = Y(Math.max(d.o, d.c)), y2 = Y(Math.min(d.o, d.c)); cv.fillStyle = col; cv.beginPath(); cv.roundRect(x - bw / 2, y1, bw, Math.max(4, y2 - y1), 3); cv.fill(); }});
  const box = (i, col) => {{ const d = S[i]; cv.save(); cv.strokeStyle = col; cv.lineWidth = 4; cv.beginPath(); cv.roundRect(X(i) - bw / 2 - 12, Y(d.h) - 12, bw + 24, Y(d.l) - Y(d.h) + 24, 12); cv.stroke(); cv.restore(); }};
  box(6, '#6A46FF'); box(11, '#E5484D');
  cv.save(); cv.strokeStyle = '#6A46FF'; cv.lineWidth = 3.5; cv.beginPath(); cv.arc(X(8), Y(29) + 3, 18, 0, Math.PI * 2); cv.stroke(); cv.restore();
  chip('سقف', '', X(14) + bw, Y(38), X(14) + bw + 10, Y(38) - 40);
  chip('فقط سایه', 'v', X(8), Y(29) + 22, X(8) + 30, Y(29) + 70);
  chip('BOS نیست', 'r', X(11), Y(41) - 14, X(11) - 20, Y(41) - 62);
}}
// the reflection is the chart canvas, flipped and faded
document.getElementById('r').getContext('2d').drawImage(document.getElementById('c'), 0, 0);
// fit each headline line to the frame
document.fonts.ready.then(() => {{ document.querySelectorAll('.h div').forEach((d) => {{ let s = HS; d.style.fontSize = s + 'px'; while (d.scrollWidth > 960 && s > 60) {{ s -= 2; d.style.fontSize = s + 'px'; }} }}); window.ready = true; }});
}})();
</script></body></html>
'''
os.makedirs(os.path.join(HERE, NAME), exist_ok=True)
open(os.path.join(HERE, NAME, 'index.html'), 'w', encoding='utf-8').write(html); print(NAME + '/index.html', len(html) // 1024, 'KB')
