# Glass-slab covers for k30 and k31. The user shared another brand's cover as a reference. Only its composition is
# taken: a big two-line headline (the second line in the brand colour), a glowing glass slab in perspective holding a
# chart with small label chips, its reflection on the floor, and the logo at the bottom. The words, the chart and the
# logo are BacktestLab's own.
#   python3 build.py k30 → k30/index.html (dark, the logo's violet: k30's violet cut)
#   python3 build.py k31 → k31/index.html (light, ink and violet: k31's explainer)
#   python3 build.py k32 → k32/index.html (light, the BOS chart: k32)
#   python3 build.py k33 → k33/index.html (dark, the logo's violet, the BOS chart: k33's HUD cut)
#   python3 build.py k34 → k34/index.html (light, the gap chart: k34)
#   python3 build.py k35 → k35/index.html (dark, the logo's violet, the plane: k35)
#   python3 build.py k36 → k36/index.html (light, the timeframe pairs: k36)
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
  'k33': dict(dark=1, bg='#07040F', glow='rgba(106,70,255,0.42)', l1='#FFFFFF', l2='linear-gradient(90deg,#8E6BFF,#D8CCFF)', l1t='سقف رو شکست…', l2t='ولی BOS نیست!',
              logo='brand/svg/logo-fa-dark.svg', kicker='قانون BOS معتبر', chart='bos', hs=150),
  'k34': dict(dark=0, bg='#EDECE8', glow='rgba(106,70,255,0.20)', l1='#17131F', l2='linear-gradient(90deg,#5430E6,#8E6BFF)', l1t='هر گپی', l2t='پر نمی‌شه!',
              logo='brand/svg/logo-fa-light.svg', kicker='FVG یا BAG؟', chart='gap', hs=160),
  'k35': dict(dark=1, bg='#07040F', glow='rgba(106,70,255,0.42)', l1='#FFFFFF', l2='linear-gradient(90deg,#8E6BFF,#D8CCFF)', l1t='فقط برنده‌ها', l2t='دیده می‌شن!',
              logo='brand/svg/logo-fa-dark.svg', kicker='سوگیری بقا', chart='plane', hs=160),
  'k36': dict(dark=0, bg='#EDECE8', glow='rgba(106,70,255,0.20)', l1='#17131F', l2='linear-gradient(90deg,#5430E6,#8E6BFF)', l1t='تایم‌فریم‌هات', l2t='جفت هستن؟',
              logo='brand/svg/logo-fa-light.svg', kicker='جهت از بالا، ورود از پایین', chart='tf', hs=170),
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
if (CHART === 'bos') bos(); else if (CHART === 'gap') gap(); else if (CHART === 'plane') planeC(); else if (CHART === 'tf') tfC(); else {{
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
  cv.strokeStyle = DARK ? 'rgba(255,255,255,0.07)' : 'rgba(23,19,31,0.07)'; cv.lineWidth = 1.5; for (let k = 0; k <= 4; k++) {{ cv.beginPath(); cv.moveTo(B.x, B.y + B.h * k / 4); cv.lineTo(B.x + B.w, B.y + B.h * k / 4); cv.stroke(); }}
  const dash = (v, i0, i1, col, lw = 3) => {{ cv.save(); cv.setLineDash([10, 9]); cv.strokeStyle = col; cv.lineWidth = lw; cv.beginPath(); cv.moveTo(X(i0) - bw, Y(v)); cv.lineTo(X(i1) + bw, Y(v)); cv.stroke(); cv.restore(); }};
  const VL = DARK ? '#A58BFF' : '#6A46FF', RD = DARK ? '#FF5A6A' : '#E5484D'; dash(38, 6, 14, DARK ? 'rgba(232,224,255,0.75)' : 'rgba(23,19,31,0.6)'); dash(30.5, 6, 10, VL);
  S.forEach((d, i) => {{ const col = d.c >= d.o ? (DARK ? '#2FD67B' : '#12A15E') : RD, x = X(i); cv.save(); cv.shadowColor = DARK ? col : 'transparent'; cv.shadowBlur = DARK ? 14 : 0; cv.strokeStyle = col; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(x, Y(d.h)); cv.lineTo(x, Y(d.l)); cv.stroke(); const y1 = Y(Math.max(d.o, d.c)), y2 = Y(Math.min(d.o, d.c)); cv.fillStyle = col; cv.beginPath(); cv.roundRect(x - bw / 2, y1, bw, Math.max(4, y2 - y1), 3); cv.fill(); cv.restore(); }});
  const box = (i, col) => {{ const d = S[i]; cv.save(); cv.strokeStyle = col; cv.lineWidth = 4; cv.beginPath(); cv.roundRect(X(i) - bw / 2 - 12, Y(d.h) - 12, bw + 24, Y(d.l) - Y(d.h) + 24, 12); cv.stroke(); cv.restore(); }};
  box(6, VL); box(11, RD);
  cv.save(); cv.strokeStyle = VL; cv.lineWidth = 3.5; cv.beginPath(); cv.arc(X(8), Y(29) + 3, 18, 0, Math.PI * 2); cv.stroke(); cv.restore();
  chip('سقف', '', X(14) + bw, Y(38), X(14) + bw + 10, Y(38) - 40);
  chip('فقط سایه', 'v', X(8), Y(29) + 22, X(8) + 30, Y(29) + 70);
  chip('BOS نیست', 'r', X(11), Y(41) - 14, X(11) - 20, Y(41) - 62);
}}
// the gap chart: a BAG's three candles (the third closes above the second's high), the gap left behind, and a return
// that doesn't come
function gap() {{ const S = [[20,22,23,19.5],[22,21.5,23,20.8],[21.5,24,24.6,21],[24,30,30.5,23.5],[30,35,35.6,29.8],[35,37.5,38,34.6],[37.5,36.8,38.4,36],[36.8,40,40.6,36.4]].map(([o, c, h, l]) => ({{ o, c, h, l }}));
  const NN = 10, B = {{ x: 60, y: 60, w: 720, h: 400 }}, lo = 17, hi = 43, X = (i) => B.x + (i + 0.5) * B.w / NN, Y = (v) => B.y + B.h - (v - lo) / (hi - lo) * B.h, bw = B.w / NN * 0.58;
  const UP = DARK ? '#2FD67B' : '#12A15E', RD = DARK ? '#FF5A6A' : '#E5484D', VL = DARK ? '#A58BFF' : '#6A46FF';
  cv.strokeStyle = DARK ? 'rgba(255,255,255,0.07)' : 'rgba(23,19,31,0.07)'; cv.lineWidth = 1.5; for (let k = 0; k <= 4; k++) {{ cv.beginPath(); cv.moveTo(B.x, B.y + B.h * k / 4); cv.lineTo(B.x + B.w, B.y + B.h * k / 4); cv.stroke(); }}
  const zx = X(2) - bw / 2; cv.fillStyle = DARK ? 'rgba(165,139,255,0.16)' : 'rgba(106,70,255,0.12)'; cv.fillRect(zx, Y(29.8), B.x + B.w - zx, Y(24.6) - Y(29.8)); cv.save(); cv.setLineDash([9, 8]); cv.strokeStyle = VL; cv.lineWidth = 2.5; cv.strokeRect(zx, Y(29.8), B.x + B.w - zx, Y(24.6) - Y(29.8)); cv.restore();
  cv.save(); cv.setLineDash([10, 9]); cv.strokeStyle = DARK ? 'rgba(232,224,255,0.6)' : 'rgba(23,19,31,0.45)'; cv.lineWidth = 2.5; cv.beginPath(); cv.moveTo(X(3) - bw, Y(30.5)); cv.lineTo(X(5) + bw, Y(30.5)); cv.stroke(); cv.restore();
  S.forEach((d, i) => {{ const col = d.c >= d.o ? UP : RD, x = X(i); cv.save(); cv.shadowColor = DARK ? col : 'transparent'; cv.shadowBlur = DARK ? 14 : 0; cv.strokeStyle = col; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(x, Y(d.h)); cv.lineTo(x, Y(d.l)); cv.stroke(); const y1 = Y(Math.max(d.o, d.c)), y2 = Y(Math.min(d.o, d.c)); cv.fillStyle = col; cv.beginPath(); cv.roundRect(x - bw / 2, y1, bw, Math.max(4, y2 - y1), 3); cv.fill(); cv.restore(); }});
  cv.save(); cv.strokeStyle = VL; cv.lineWidth = 4; cv.beginPath(); cv.roundRect(X(4) - bw / 2 - 12, Y(35.6) - 12, bw + 24, Y(29.8) - Y(35.6) + 24, 12); cv.stroke(); cv.restore();
  [[2, 24.6, '۱'], [3, 30.5, '۲'], [4, 35.6, '۳']].forEach(([i, h, n]) => {{ cv.fillStyle = VL; cv.beginPath(); cv.arc(X(i), Y(h) - 34, 20, 0, Math.PI * 2); cv.fill(); cv.fillStyle = '#FFFFFF'; cv.font = '800 24px Vazirmatn'; cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.fillText(n, X(i), Y(h) - 32); }});
  cv.save(); cv.setLineDash([9, 8]); cv.strokeStyle = RD; cv.lineWidth = 3.5; const ax = X(7) + 30, ay = Y(36), bx = X(7) + 10, by = Y(30.6); cv.beginPath(); cv.moveTo(ax, ay); cv.lineTo(bx, by); cv.stroke(); cv.setLineDash([]); cv.beginPath(); cv.moveTo(bx - 10, by - 16); cv.lineTo(bx, by); cv.lineTo(bx + 14, by - 12); cv.stroke(); cv.restore();
  chip('گپ', 'v', X(5) + 30, Y(27.2), X(5) + 30, Y(27.2));
  chip('BAG', 'v', X(4), Y(35.6) - 30, X(4) - 110, Y(38));
  chip('برنگشت', 'r', X(7) + 34, Y(33.4), X(8) + 64, Y(33.4));
}}
// the plane: a returned bomber full of holes (none on the engines or the cockpit), and the dashed outline of one that
// never came back (an illustration, as in k35)
function planeC() {{ const VL = '#A58BFF', RD = '#FF5A6A', LM = '#C6F24E';
  const shape = (cx, cy, s) => {{ const P = (a) => a.map(([x, y]) => [cx + x * s, cy + y * s]), M = (a) => a.map(([x, y]) => [-x, y]).reverse(), WR = [[38, -60], [430, 0], [440, 40], [38, 90]], TR = [[24, 220], [170, 250], [170, 280], [20, 290]];
    return {{ body: P([[0, -315], [22, -300], [36, -260], [38, -120], [38, 200], [24, 280], [0, 300], [-24, 280], [-38, 200], [-38, -120], [-36, -260], [-22, -300]]), wings: [P(WR), P(M(WR))], tails: [P(TR), P(M(TR))],
      eng: [-270, -140, 140, 270].map((x) => {{ const le = -60 + ((Math.abs(x) - 38) / 392) * 60; return [cx + x * s, cy + (le - 55) * s, cy + (le + 35) * s]; }}), nose: [cx, cy - 278 * s, 28 * s] }}; }};
  const poly = (pts, stroke, fill, lw, dash) => {{ cv.save(); if (dash) cv.setLineDash(dash); cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); if (fill) {{ cv.fillStyle = fill; cv.fill(); }} cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); cv.restore(); }};
  const inside = (pts, x, y) => {{ let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {{ const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }} return c; }};
  const A = shape(300, 262, 0.58); cv.save(); cv.shadowColor = VL; cv.shadowBlur = 14; [...A.wings, ...A.tails].forEach((w) => poly(w, VL, 'rgba(165,139,255,0.08)', 2.5)); poly(A.body, VL, 'rgba(165,139,255,0.12)', 2.5); cv.restore();
  A.eng.forEach(([x, y0, y1]) => {{ cv.save(); cv.shadowColor = LM; cv.shadowBlur = 18; cv.beginPath(); cv.roundRect(x - 11, y0, 22, y1 - y0, 7); cv.fillStyle = '#1B1338'; cv.fill(); cv.strokeStyle = LM; cv.lineWidth = 3; cv.stroke(); cv.restore(); }});
  cv.save(); cv.shadowColor = LM; cv.shadowBlur = 18; cv.beginPath(); cv.arc(A.nose[0], A.nose[1], A.nose[2] + 4, 0, Math.PI * 2); cv.strokeStyle = LM; cv.lineWidth = 3; cv.stroke(); cv.restore();
  let n = 0; for (let k = 1; k < 3000 && n < 40; k++) {{ const x = 300 + (rnd(k * 3.1) - 0.5) * 520, y = 262 + (rnd(k * 7.7) - 0.5) * 370, onW = A.wings.some((w) => inside(w, x, y)), onB = inside(A.body, x, y) && y > 262 - 86 && y < 262 + 130, onT = A.tails.some((w) => inside(w, x, y)), nearE = A.eng.some(([ex, y0, y1]) => Math.abs(x - ex) < 20 && y > y0 - 8 && y < y1 + 8);
    if ((onW || onB || onT) && !nearE) {{ cv.save(); cv.shadowColor = RD; cv.shadowBlur = 10; cv.fillStyle = RD; cv.beginPath(); cv.arc(x, y, 4.5, 0, Math.PI * 2); cv.fill(); cv.restore(); n++; }} }}
  const B = shape(690, 250, 0.26); [...B.wings, ...B.tails, B.body].forEach((w) => poly(w, 'rgba(255,90,106,0.75)', null, 2, [6, 5]));
  chip('برگشته', 'v', 300, 72, 300, 46); chip('برنگشت', 'r', 690, 330, 690, 380); chip('جاهای سالم', '', A.eng[3][0], A.eng[3][2], 590, 462);
}}
// the timeframe pairs: higher timeframe on the right, lower on the left, each pair in its colour, joined by dots
function tfC() {{ const HT = [['D', 'روزانه'], ['H4', '۴ ساعته'], ['H1', '۱ ساعته'], ['M15', '۱۵ دقیقه']], LT = [['H1', '۱ ساعته'], ['M15', '۱۵ دقیقه'], ['M5', '۵ دقیقه'], ['M1', '۱ دقیقه']], PC = ['#6A46FF', '#E5322D', '#2563EB', '#E08A00'];
  const T_ = (s, x, y, size, col, w, dir) => {{ cv.font = `${{w}} ${{size}}px Vazirmatn`; cv.direction = dir || 'rtl'; cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.fillStyle = col; cv.fillText(s, x, y); }};
  T_('تایم‌فریم بالا', 610, 46, 30, '#17131F', 900); T_('تایم‌فریم پایین', 230, 46, 30, '#17131F', 900);
  for (let i = 0; i < 4; i++) {{ const y = 120 + i * 100; cv.save(); cv.setLineDash([3, 11]); cv.lineCap = 'round'; cv.strokeStyle = PC[i]; cv.lineWidth = 5; cv.beginPath(); cv.moveTo(525, y); cv.lineTo(315, y); cv.stroke(); cv.restore();
    [[525, PC[i]], [315, PC[i]]].forEach(([x, c]) => {{ cv.fillStyle = c; cv.beginPath(); cv.arc(x, y, 7, 0, Math.PI * 2); cv.fill(); }});
    [[610, HT[i]], [230, LT[i]]].forEach(([x, [code, sub]]) => {{ cv.fillStyle = PC[i]; cv.beginPath(); cv.roundRect(x - 85, y - 38, 170, 76, 18); cv.fill(); T_(code, x, y - 8, 34, '#FFFFFF', 900, 'ltr'); T_(sub, x, y + 22, 17, 'rgba(255,255,255,0.88)', 600); }}); }}
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
