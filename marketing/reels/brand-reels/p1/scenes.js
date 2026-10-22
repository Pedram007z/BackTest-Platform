// p1 · «می‌خوای تو ترید سودده بشی… ولی نمی‌تونی؟» on the user's take. Captions light up word by word as they are
// spoken (karaoke, bottom band); above them, one picture per line:
// a balance curve that climbs and crashes → a new strategy every week, indicators raining down, the «ضرر» stamp → the
// trader's checklist: strategy ✓, indicators ✓, testing ✗ → «حس» struck out, «عدد» lit up → BacktestLab: a real gold
// day (XAUUSD 15m, 14 Aug 2026, Tehran time) replayed candle by candle, a long with its stop and 2R target that really
// reached the target → the trade goes into the journal, analytics shows where money is made and burned (sample bars)
// → years of market in hours → «شروعش رایگانه», «لینک توی بیو».
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 700–900, large, on solid ground. Key content
// stays inside Instagram's safe area (y 230–1480; x ≤ 940 below y 1100).
const W = 1080, H = 1920, CX = 540;
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, C = D.chart, LIGHT = !!D.light;   // light: the light-theme cut (light/)
// ON_*: text on a filled chip of that colour; BGR: the background as "r,g,b" for veils; GRID / HATCH: hairlines
const TH = LIGHT
  ? { BG: '#F5F3FA', PANEL: '#FFFFFF', PANEL2: '#F1EEF8', LINE: '#DFD9EC', INK: '#17131F', MUTED: '#5F5874', FAINT: '#9C95B2', V: '#6A46FF', LILAC: '#6A46FF',
      G: '#12A36A', R: '#E0384F', AMBER: '#C77D00', SKY: '#2F6FE8', ON_G: '#FFFFFF', ON_AMB: '#FFFFFF', ON_INK: '#FFFFFF', ON_V: '#FFFFFF', ON_R: '#FFFFFF',
      CARD: '#F3EFFF', REDGLOW: '#F25466', BGR: '245,243,250', GRID: 'rgba(23,19,31,0.045)', GRID2: 'rgba(23,19,31,0.06)', HATCH: 'rgba(23,19,31,0.08)' }
  : { BG: '#09080F', PANEL: '#14111D', PANEL2: '#1C1829', LINE: '#2D2843', INK: '#F5F3FA', MUTED: '#A9A3BE', FAINT: '#6E6886', V: '#7C5CFF', LILAC: '#B9A6FF',
      G: '#22C27E', R: '#F25466', AMBER: '#FFB93E', SKY: '#4C8DFF', ON_G: ON_G, ON_AMB: ON_AMB, ON_INK: ON_INK, ON_V: '#F5F3FA', ON_R: '#F5F3FA',
      CARD: CARD, REDGLOW: REDGLOW, BGR: '9,8,15', GRID: GRID, GRID2: GRID2, HATCH: HATCH };
const { BG, PANEL, PANEL2, LINE, INK, MUTED, FAINT, V, LILAC, G, R, AMBER, SKY, ON_G, ON_AMB, ON_INK, ON_V, ON_R, CARD, REDGLOW, BGR, GRID, GRID2, HATCH } = TH;
const cv = document.getElementById('c').getContext('2d');
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const ex = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? 'rtl';
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.blur ?? 30; }
  cv.fillText(s, x, y); cv.restore();
}
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
function chip(s, x, y, size, fg, bg, o = {}) {
  const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75;
  rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800, dir: isL(s) ? 'ltr' : 'rtl' }); return w;
}
function check(x, y, s, col, k = 1) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.16; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath();
  const p = [[-0.45, 0.02], [-0.12, 0.34], [0.48, -0.32]], L1 = Math.hypot(0.33, 0.32), L2 = Math.hypot(0.6, 0.66), d = k * (L1 + L2);
  cv.moveTo(x + p[0][0] * s, y + p[0][1] * s); if (d <= L1) cv.lineTo(x + lerp(p[0][0], p[1][0], d / L1) * s, y + lerp(p[0][1], p[1][1], d / L1) * s);
  else { cv.lineTo(x + p[1][0] * s, y + p[1][1] * s); const e = (d - L1) / L2; cv.lineTo(x + lerp(p[1][0], p[2][0], e) * s, y + lerp(p[1][1], p[2][1], e) * s); }
  cv.stroke(); cv.restore(); }
function cross(x, y, s, col, k = 1) { const a = cl(k * 2), b = cl(k * 2 - 1); line(x - s * 0.4, y - s * 0.4, x - s * 0.4 + s * 0.8 * a, y - s * 0.4 + s * 0.8 * a, col, s * 0.16); if (b > 0) line(x + s * 0.4, y - s * 0.4, x + s * 0.4 - s * 0.8 * b, y - s * 0.4 + s * 0.8 * b, col, s * 0.16); }
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- background: near-black, two slow glows (violet, and green once the platform appears), a faint grid ----------
function background(t) {
  cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
  const glow = (x, y, r, col, a) => { const g = cv.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H); };
  const red = t >= T.crash && t < T.feel ? 0.5 : 0, green = k01(t, T.brand, 1.2);
  glow(220 + Math.sin(t * 0.3) * 90, 420 + Math.cos(t * 0.25) * 70, 760, red > 0 ? REDGLOW : V, 0.17);
  glow(880 + Math.cos(t * 0.27) * 70, 1450 + Math.sin(t * 0.2) * 90, 820, V, 0.12);
  if (green > 0) glow(CX, 700, 900, G, 0.06 * green);
  cv.strokeStyle = GRID; cv.lineWidth = 2;
  for (let x = 0; x <= W; x += 90) { cv.beginPath(); cv.moveTo(x, 0); cv.lineTo(x, H); cv.stroke(); }
  for (let y = 0; y <= H; y += 90) { cv.beginPath(); cv.moveTo(0, y); cv.lineTo(W, y); cv.stroke(); }
}

// ---------- captions: the script, word by word as it is spoken (lower band, y 1240–1440) ----------
// [text, first word index, colour]: a token lights up when its word starts
const PH = [
  [[['می‌خوای', 0], ['تو', 1], ['ترید', 2]], [['سودده', 3, G], ['بشی…', 4]]],
  [[['ولی', 5], ['نمی‌تونی؟', 7, R]]],
  [[['هر', 8], ['هفته', 9]], [['یه', 10], ['استراتژی', 11, LILAC], ['جدید،', 12]]],
  [[['یه', 13], ['اندیکاتور', 14, LILAC], ['جدید…', 15]]],
  [[['و', 16], ['باز', 17], ['هم', 18], ['ضرر.', 19, R]]],
  [[['مشکل', 20], ['از', 21], ['استراتژی', 22], ['نیست؛', 23]]],
  [[['هیچ‌وقت', 24], ['درست', 26]], [['تستش', 27, AMBER], ['نکردی.', 28]]],
  [[['تریدر', 29], ['سودده', 30, G]], [['با', 31], ['حس', 32, R], ['ترید', 33], ['نمی‌کنه،', 34]]],
  [[['با', 36], ['عدد', 37, G], ['ترید', 38], ['می‌کنه.', 39]]],
  [[['توی', 41], ['بک‌تست‌لب،', 42, LILAC]]],
  [[['بازار', 44], ['واقعی', 45], ['رو', 46]], [['کندل', 47, LILAC], ['به', 48, LILAC], ['کندل،', 49, LILAC]]],
  [[['بدون', 50], ['دیدن', 51], ['آینده', 52, AMBER]], [['پخش', 53], ['می‌کنی.', 54]]],
  [[['پوزیشن', 56], ['می‌گیری،', 57]], [['حد ضرر', 59, R], ['و', 61], ['سود', 62, G], ['می‌ذاری…', 63]]],
  [[['بدون', 65, G], ['ریسک.', 66, G]]],
  [[['ژورنال', 67, LILAC], ['و', 68], ['آنالیز', 69, LILAC]], [['بهت', 70], ['نشون', 71], ['می‌دن', 72]]],
  [[['کجا', 74], ['پول', 75], ['می‌سازی…', 76, G]]],
  [[['و', 78], ['کجا', 79], ['می‌سوزونی.', 80, R]]],
  [[['چند', 82, AMBER], ['سال', 83, AMBER], ['بازار،', 84]], [['توی', 85], ['چند', 86, G], ['ساعت.', 87, G]]],
];
const phStart = (p) => ws(p[0][0][1]);
function captions(t) {
  if (t >= T.end - 0.1) return;
  let cur = -1; PH.forEach((p, i) => { if (t >= phStart(p) - 0.12) cur = i; });
  if (cur < 0) return;
  const p = PH[cur], nextAt = cur + 1 < PH.length ? phStart(PH[cur + 1]) - 0.12 : T.end - 0.1, k = cur === 0 ? 1 : cub(k01(t, phStart(p) - 0.12, 0.18)), out = k01(t, nextAt - 0.08, 0.08);
  // a soft dark band behind the words
  const g = cv.createLinearGradient(0, 1150, 0, 1520); g.addColorStop(0, `rgba(${BGR},0)`); g.addColorStop(0.3, `rgba(${BGR},0.75)`); g.addColorStop(1, `rgba(${BGR},0.75)`); cv.fillStyle = g; cv.fillRect(0, 1150, W, 370);
  const size = 84, gapY = 112, y0 = p.length === 1 ? 1320 : 1272;
  p.forEach((ln, li) => {
    const wds = ln.map(([s]) => measure(s, size)), gap = measure(' ', size) * 1.3, total = wds.reduce((a, b) => a + b, 0) + gap * (ln.length - 1);
    const sc = Math.min(1, 820 / total); let right = 510 + (total * sc) / 2;
    ln.forEach(([s, wi, col], j) => {
      // the hook is lit from the first frame; later words light up as they are spoken
      const said = cur === 0 || t >= ws(wi) - 0.04, pk = pop(t - ws(wi) + 0.04, 22, 0.5), wpx = wds[j] * sc;
      const c = said ? col ?? INK : rgba(INK, 0.42), s2 = said && cur > 0 ? 1 + 0.08 * (1 - cl(pk)) * (pk > 0 ? 1 : 0) : 1;
      cv.save(); cv.globalAlpha = k * (1 - out); cv.translate(right - wpx / 2, y0 + li * gapY + (1 - k) * 24); cv.scale(sc * s2, sc * s2);
      txt(s, 0, 0, size, c, { dir: isL(s) ? 'ltr' : 'rtl', glow: said && col && !LIGHT ? rgba(col, 0.45) : undefined, blur: 26 }); cv.restore();
      right -= wpx + gap * sc;
    });
  });
}

// ---------- 1 · the balance climbs… and crashes ----------
const CURVE = [[0, 0.32], [0.07, 0.4], [0.13, 0.35], [0.2, 0.52], [0.26, 0.46], [0.33, 0.64], [0.39, 0.56], [0.46, 0.42], [0.52, 0.5], [0.58, 0.38],
  [0.64, 0.56], [0.7, 0.7], [0.74, 0.63], [0.8, 0.8], [0.86, 0.52], [0.9, 0.34], [0.95, 0.2], [1, 0.12]];
function hook(t) {
  if (t > T.weeks + 0.5) return;
  const out = exIO(k01(t, T.weeks - 0.1, 0.5)), x0 = 110, x1 = 970, y0 = 470, y1 = 1060;
  cv.save(); cv.globalAlpha = 1 - out; cv.translate(0, -out * 120);
  rrect(70, 330, 940, 790, 44, PANEL, LINE, 3);
  txt('موجودی حساب', 960, 395, 44, INK, { align: 'right', w: 800 }); txt('هر روز یه حس جدید', 960, 445, 30, FAINT, { align: 'right', w: 600 });
  for (let k = 0; k < 4; k++) line(x0, lerp(y0, y1, k / 3), x1, lerp(y0, y1, k / 3), GRID2, 2);
  // the head runs to the peak by «ولی», then the crash
  const head = t < T.crash ? lerp(0.5, 0.8, cub(t / T.crash)) : lerp(0.8, 1, cub(k01(t, T.crash + 0.25, 0.7)));
  const P = (u) => { for (let i = 1; i < CURVE.length; i++) if (u <= CURVE[i][0]) { const [a, ya] = CURVE[i - 1], [b, yb] = CURVE[i]; return [lerp(x0, x1, u), lerp(y1, y0, lerp(ya, yb, (u - a) / (b - a)))]; } return [x1, lerp(y1, y0, CURVE[CURVE.length - 1][1])]; };
  const crashed = head > 0.8, steps = 160;
  // area under the curve
  cv.beginPath(); cv.moveTo(x0, y1); for (let s = 0; s <= steps; s++) { const u = (head * s) / steps, [x, y] = P(u); cv.lineTo(x, y); } cv.lineTo(P(head)[0], y1); cv.closePath();
  const gr = cv.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgba(crashed ? R : V, 0.28)); gr.addColorStop(1, rgba(crashed ? R : V, 0)); cv.fillStyle = gr; cv.fill();
  cv.lineWidth = 9; cv.lineJoin = 'round'; cv.lineCap = 'round';
  cv.strokeStyle = LILAC; cv.beginPath(); for (let s = 0; s <= steps; s++) { const u = (Math.min(head, 0.8) * s) / steps, [x, y] = P(u); s ? cv.lineTo(x, y) : cv.moveTo(x, y); } cv.stroke();
  if (crashed) { cv.strokeStyle = R; cv.shadowColor = rgba(R, 0.7); cv.shadowBlur = 30; cv.beginPath(); for (let s = 0; s <= 40; s++) { const [x, y] = P(lerp(0.8, head, s / 40)); s ? cv.lineTo(x, y) : cv.moveTo(x, y); } cv.stroke(); cv.shadowBlur = 0; }
  const [hx, hy] = P(head); circle(hx, hy, 16, crashed ? R : INK); circle(hx, hy, 30 + 8 * Math.sin(t * 8), null, rgba(crashed ? R : LILAC, 0.5), 4);
  // small ups and downs along the way
  [[0.33, 1], [0.46, -1], [0.7, 1]].forEach(([u, s], i) => { if (head < u) return; const [x, y] = P(u), a = pop(t - (i * 0.5 - 0.6), 14); at(x, y - s * 60, cl(a, 0, 1.2), cl(a), () => chip(s > 0 ? 'سود' : 'ضرر', 0, 0, 30, s > 0 ? ON_G : ON_R, s > 0 ? G : R)); });
  if (crashed) { const a = pop(t - T.crash - 0.6, 12); at(hx - 140, hy - 70, cl(a, 0, 1.2), cl(a), () => chip('باز هم برگشت…', 0, 0, 36, ON_R, R)); }
  cv.restore();
}

// ---------- 2 · a new strategy every week, indicators raining down, then «ضرر» ----------
const STRATS = ['پرایس اکشن', 'اسمارت‌مانی', 'اسکالپ', 'سوئینگ', 'هارمونیک'];
const INDS = ['RSI', 'MACD', 'Bollinger', 'Ichimoku', 'EMA 200', 'Stochastic', 'ATR', 'Fibonacci', 'VWAP', 'Volume'];
function weeks(t) {
  if (t < T.weeks - 0.1 || t > T.test + 0.6) return;
  const kin = cub(k01(t, T.weeks, 0.35)), out = exIO(k01(t, T.test - 0.05, 0.5)), dim = cub(k01(t, T.loss, 0.25));
  cv.save(); cv.globalAlpha = kin * (1 - out); cv.translate(0, out * 300);
  // the week strip
  const step = Math.min(4, Math.floor((t - T.weeks) / 0.42));
  for (let i = 0; i < 4; i++) { const x = 900 - i * 240, on = i === Math.min(3, step); rrect(x - 105, 330, 210, 84, 42, on ? V : PANEL2, on ? null : LINE, 3); txt(`هفته‌ی ${fa(i + 1)}`, x, 374, 36, on ? ON_V : MUTED, { w: 800 }); }
  // the strategy deck: a new card each week
  const idx = Math.min(STRATS.length - 1, Math.max(0, Math.floor((t - T.weeks) / 0.42))), flip = ((t - T.weeks) % 0.42) / 0.42;
  for (let j = 2; j >= 1; j--) rrect(170 + j * 14, 480 + j * 16, 740, 230, 36, PANEL2, LINE, 2);
  const sx = t - T.weeks < 0.42 * STRATS.length ? Math.abs(Math.cos(Math.min(1, flip * 3) * Math.PI)) : 1;
  cv.save(); cv.translate(CX, 595); cv.scale(Math.max(0.02, sx), 1); rrect(-370, -115, 740, 230, 36, CARD, V, 4);
  txt('استراتژی جدید', 320, -66, 30, LILAC, { align: 'right', w: 700 }); txt(STRATS[idx], 0, 22, 84, INK); cv.restore();
  // indicators rain into a pile
  INDS.forEach((s, i) => {
    const t0 = T.ind + 0.05 + i * 0.13, d = t - t0; if (d <= 0) return;
    const col = i % 3, row = Math.floor(i / 3), tx = 230 + col * 300 + (row % 2) * 60 - 30, ty = 830 + row * 92 - (i === 9 ? 0 : 0);
    const fall = Math.min(1, d / 0.38), y = lerp(260, ty, fall * fall) - (fall >= 1 ? Math.abs(Math.sin((d - 0.38) * 14)) * Math.exp(-(d - 0.38) * 7) * 40 : 0);
    const rot = (rnd(i) - 0.5) * 0.35 * (1 - fall * 0.6);
    at(tx, y, 1, 1, () => chip(s, 0, 0, 38, INK, PANEL2, { stroke: rgba(V, 0.7), lw: 2.5 }), rot);
  });
  // «ضرر»: everything dims, the stamp slams down
  if (dim > 0) { cv.fillStyle = `rgba(${BGR},${0.6 * dim})`; cv.fillRect(0, 300, W, 900); }
  const sk = pop(t - T.loss, 16, 0.5);
  if (sk > 0) at(CX, 760, lerp(2.2, 1, cl(sk)), cl(sk * 1.5), () => {
    cv.shadowColor = rgba(R, 0.8); cv.shadowBlur = 50; rrect(-300, -130, 600, 260, 40, rgba(R, 0.18), R, 12); cv.shadowBlur = 0;
    txt('ضرر', 0, 10, 190, R); }, -0.12);
  cv.restore();
}

// ---------- 3 · the checklist: strategy ✓, indicators ✓, testing ✗ ----------
function checklist(t) {
  if (t < T.test - 0.1 || t > T.feel + 0.6) return;
  const kin = pop(t - T.test, 12, 0.75), out = exIO(k01(t, T.feel - 0.05, 0.5));
  cv.save(); cv.globalAlpha = cl(kin) * (1 - out); cv.translate((1 - cl(kin)) * 300 - out * 1100, 0);
  rrect(110, 360, 860, 760, 48, PANEL, LINE, 3);
  txt('چک‌لیست تریدر', 910, 440, 52, INK, { align: 'right' });
  const rows = [['استراتژی', ws(22), 'ok'], ['اندیکاتور', ws(23) + 0.15, 'ok'], ['تست روی داده‌ی واقعی', ws(27), 'no']];
  rows.forEach(([s, tm, kind], i) => {
    const y = 560 + i * 175, k = cub(k01(t, tm, 0.35)), no = kind === 'no' && t >= tm, blink = no ? 0.5 + 0.5 * Math.sin((t - tm) * 10) : 0;
    rrect(160, y - 70, 760, 140, 30, no ? rgba(R, 0.12 + 0.08 * blink) : PANEL2, no ? rgba(R, 0.8) : null, 3);
    txt(s, 870, y, 52, no ? INK : t >= tm ? INK : MUTED, { align: 'right', w: 800 });
    rrect(200, y - 44, 88, 88, 22, null, no ? R : t >= tm ? G : FAINT, 5);
    if (kind === 'ok' && k > 0) check(244, y, 70, G, k); if (kind === 'no' && k > 0) cross(244, y, 62, R, k);
  });
  cv.restore();
}

// ---------- 4 · «حس» struck out, «عدد» lit up ----------
function feelNum(t) {
  if (t < T.feel - 0.1 || t > T.brand + 0.5) return;
  const kin = pop(t - T.feel, 12, 0.75), out = exIO(k01(t, T.brand - 0.1, 0.5)), strike = cub(k01(t, ws(34), 0.35)), on = cub(k01(t, T.num, 0.35));
  cv.save(); cv.globalAlpha = cl(kin) * (1 - out); cv.translate(0, (1 - cl(kin)) * 200 - out * 200);
  // «حس»: a wobbly, foggy guess
  cv.save(); cv.globalAlpha *= 1 - 0.55 * strike;
  rrect(90, 330, 900, 330, 44, PANEL, LINE, 3);
  const wob = (1 - strike) * 6;
  cv.strokeStyle = rgba(MUTED, 0.6); cv.lineWidth = 6; cv.beginPath();
  for (let x = 140; x <= 600; x += 6) { const y = 495 + Math.sin(x * 0.03 + t * 5) * 40 * Math.sin(x * 0.007 + t) + Math.sin(x * 0.11 + t * 9) * wob; x === 140 ? cv.moveTo(x, y) : cv.lineTo(x, y); }
  cv.stroke();
  txt('حس', 800 + Math.sin(t * 13) * wob, 490, 150, MUTED);
  cv.restore();
  if (strike > 0) { line(120, 495, lerp(120, 960, strike), 495, R, 14); }
  // «عدد»: four measured things
  rrect(90, 710, 900, 400, 44, on > 0 ? rgba(G, 0.08 * on) : PANEL, on > 0 ? rgba(G, 0.25 + 0.5 * on) : LINE, 3);
  txt('عدد', 930, 775, 70, on > 0 ? G : MUTED, { align: 'right' });
  const tiles = [['وین‌ریت', 'ring'], ['ریسک به ریوارد', 'rr'], ['حداکثر افت', 'dd'], ['تعداد معاملات', 'bars']];
  tiles.forEach(([s, ic], i) => {
    const x = 760 - (i % 2) * 400 + (i % 2 ? 0 : 0), y = 900 + Math.floor(i / 2) * 120, k = pop(t - T.num - 0.1 - i * 0.12, 16, 0.6);
    if (k <= 0) { rrect(x - 180, y - 48, 360, 96, 24, PANEL2); txt(s, x + 150, y, 34, FAINT, { align: 'right', w: 700 }); return; }
    at(x, y, cl(k, 0, 1.15), 1, () => {
      rrect(-180, -48, 360, 96, 24, PANEL2, rgba(G, 0.6), 2.5); txt(s, 150, 0, 34, INK, { align: 'right', w: 800 });
      const ix = -130;
      if (ic === 'ring') { circle(ix, 0, 24, null, rgba(G, 0.25), 8); cv.strokeStyle = G; cv.lineWidth = 8; cv.beginPath(); cv.arc(ix, 0, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.3 * cl(k)); cv.stroke(); }
      if (ic === 'rr') { rrect(ix - 26, -6, 52, 26, 5, rgba(R, 0.8)); rrect(ix - 26, -32, 52, 26, 5, rgba(G, 0.9)); }
      if (ic === 'dd') { cv.strokeStyle = R; cv.lineWidth = 6; cv.beginPath(); cv.moveTo(ix - 28, -18); cv.lineTo(ix - 6, -4); cv.lineTo(ix + 6, -12); cv.lineTo(ix + 28, 20); cv.stroke(); }
      if (ic === 'bars') for (let j = 0; j < 4; j++) rrect(ix - 28 + j * 15, 22 - (10 + j * 9), 10, 10 + j * 9, 3, G);
    });
  });
  cv.restore();
}

// ---------- 5 · BacktestLab: the logo, then a real gold day replayed ----------
const PX = { x0: 80, x1: 905, y0: 470, y1: 1040 };
function goldChart(t, n, o = {}) {
  const bars = C.bars, N = bars.length, step = (PX.x1 - PX.x0) / N, cw = step * 0.62;
  let lo = Math.min(...bars.map((b) => b[2]), C.sl), hi = Math.max(...bars.map((b) => b[1]), C.tp); const sp = hi - lo; lo -= sp * 0.06; hi += sp * 0.16;
  const X = (i) => PX.x0 + step * (i + 0.5), Y = (p) => PX.y1 - ((p - lo) / (hi - lo)) * (PX.y1 - PX.y0);
  txt('طلا · ۱۵ دقیقه', 1000, 380, 42, INK, { align: 'right', w: 800 });
  txt(`${C.jalali} · ساعت تهران`, 1000, 428, 30, MUTED, { align: 'right', w: 600 });
  chip('داده‌ی واقعی', 190, 392, 30, G, rgba(G, 0.14), { stroke: rgba(G, 0.4), lw: 2 });
  for (let p = Math.ceil(lo / 10) * 10; p < hi; p += 10) { const y = Y(p); line(PX.x0, y, PX.x1, y, HATCH, 2); txt(Math.round(p).toLocaleString('en-US'), 1005, y, 26, FAINT, { dir: 'ltr', align: 'right', w: 600 }); }
  C.times.forEach((s, i) => { if (s.endsWith(':00') && parseInt(s) % 2 === 0) txt(fa(s), X(i), PX.y1 + 40, 28, FAINT, { w: 600, dir: 'ltr' }); });
  const nn = Math.floor(n), last = nn - 1, fx = n > 0 ? X(Math.max(0, last)) + step / 2 : PX.x0;
  // the position: entry at the entry bar's close, stop below the last six bars' low, target 2R
  const kp = cub(k01(t, T.pos, 0.4));
  if (kp > 0 && !o.noPos) {
    const x = X(C.entry_i) + step / 2, w = (PX.x1 - x) * kp, ye = Y(C.entry), ys = Y(C.sl), yt = Y(C.tp), hit = t >= T.hit, fl = hit ? Math.exp(-(t - T.hit) * 3) : 0;
    const hs = Math.exp(-Math.pow((t - T.sl - 0.3) * 3, 2)), ht = Math.exp(-Math.pow((t - T.tp - 0.3) * 3, 2));
    rrect(x, ye, w, ys - ye, 4, rgba(R, 0.22 + 0.3 * hs)); rrect(x, yt, w, ye - yt, 4, rgba(G, (hit ? 0.42 + 0.3 * fl : 0.2) + 0.3 * ht)); line(x, ye, x + w, ye, rgba(INK, kp), 3);
  }
  for (let i = 0; i < nn; i++) {
    const [o_, h_, l_, c_] = bars[i], up = c_ >= o_, col = up ? G : R, x = X(i), g = i === last ? cub((n - nn) * 3 + 0.4) : 1;
    line(x, Y(h_), x, Y(l_), col, 3); const y0 = Y(Math.max(o_, c_)), y1 = Y(Math.min(o_, c_)); cv.fillStyle = col; cv.globalAlpha = g; cv.fillRect(x - cw / 2, y0, cw, Math.max(3, y1 - y0)); cv.globalAlpha = 1;
  }
  // the future, hidden
  if (n > 0 && fx < PX.x1 - 2) {
    cv.save(); cv.beginPath(); cv.rect(fx + 4, PX.y0 - 20, PX.x1 + 20 - fx, PX.y1 - PX.y0 + 30); cv.clip(); cv.fillStyle = `rgba(${BGR},0.6)`; cv.fillRect(fx, PX.y0 - 20, W, PX.y1 - PX.y0 + 30);
    cv.strokeStyle = HATCH; cv.lineWidth = 3; for (let k = -1200; k < 1200; k += 26) { cv.beginPath(); cv.moveTo(fx + k, PX.y1 + 10); cv.lineTo(fx + k + 600, PX.y0 - 590); cv.stroke(); }
    if (PX.x1 - fx > 150) txt('آینده؟', (fx + PX.x1) / 2, (PX.y0 + PX.y1) / 2, 40, rgba(AMBER, 0.85 * (1 - cub(k01(t, T.pos - 0.2, 0.3)))));
    cv.restore(); line(fx + 2, PX.y0 - 20, fx + 2, PX.y1 + 8, rgba(LILAC, 0.75), 3, [10, 8]);
  }
  // labels
  const lab = (k, s, x, y, fg, bg) => { const a = pop(t - k, 16, 0.6); if (a > 0) at(x, y, cl(a, 0, 1.2), cl(a), () => chip(s, 0, 0, 32, fg, bg)); };
  if (!o.noPos) {
    const zx = (X(C.entry_i) + step / 2 + PX.x1) / 2;          // labels centred on the position's zone
    lab(T.pos + 0.2, 'ورود', zx, Y(C.entry), ON_INK, INK);
    lab(T.sl, 'حد ضرر', zx, (Y(C.sl) + Y(C.entry)) / 2 + 12, ON_R, R);
    lab(T.tp, 'حد سود 2R', zx, (Y(C.tp) + Y(C.entry)) / 2, ON_G, G);
  }
  const b = pop(t - T.hit - 0.05, 13, 0.5);
  if (b > 0 && !o.noPos) at(330, 660, cl(b, 0, 1.3), cl(b), () => { cv.shadowColor = rgba(G, 0.7); cv.shadowBlur = 50; rrect(-150, -70, 300, 140, 70, G); cv.shadowBlur = 0; txt('+2R', 0, 6, 88, ON_G, { dir: 'ltr' }); });
}
const KR = () => [[T.replay + 0.35, 10], [T.pos - 0.15, C.entry_i + 1], [T.norisk + 0.15, C.entry_i + 1], [T.hit, C.out_i + 1], [T.hit + 0.3, C.bars.length]];
function shown(t, keys) { let n = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [ta, na] = keys[i - 1], [tb, nb] = keys[i]; if (t >= ta) n = t >= tb ? nb : lerp(na, nb, (t - ta) / (tb - ta)); } return n; }
function platform(t) {
  if (t < T.brand - 0.1 || t > T.years + 0.4) return;
  // the logo, on «بک‌تست‌لب»
  if (t < T.replay + 0.5) {
    const ki = pop(t - T.brand, 12, 0.6), out = exIO(k01(t, T.replay - 0.1, 0.45));
    if (ki > 0 && IMG.icon) at(CX, 700 - out * 250, cl(ki, 0, 1.3) * (1 - 0.5 * out), cl(ki) * (1 - out), () => { cv.shadowColor = rgba(V, 0.8); cv.shadowBlur = 80; cv.drawImage(IMG.icon, -150, -150, 300, 300); cv.shadowBlur = 0; });
    const kw = cub(k01(t, T.brand + 0.3, 0.35));
    if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw * (1 - out); cv.drawImage(IMG.word, CX - w / 2, 900 + (1 - kw) * 30, w, h); cv.restore(); }
  }
  // the chart card, then (at «ژورنال») it shrinks into the journal's first row
  const kin = pop(t - T.replay, 11, 0.78);
  if (kin <= 0) return;
  const j = exIO(k01(t, T.journal - 0.05, 0.6)), s = lerp(1, 0.3, j), tx = lerp(0, 820 - 540, j), ty = lerp(0, 475 - 740, j);
  cv.save(); cv.translate(CX + tx, 740 + ty + (1 - cl(kin)) * 900); cv.scale(s, s); cv.translate(-CX, -740);
  rrect(40, 320, 1000, 840, 44, PANEL, LINE, 3 / s);
  goldChart(t, shown(t, KR()));
  // «بدون ریسک»: no real money involved
  const nr = pop(t - T.norisk, 14, 0.6);
  if (nr > 0 && j < 0.2) at(345, 520, cl(nr, 0, 1.2), cl(nr) * (1 - j * 5), () => {
    rrect(-230, -50, 460, 100, 50, rgba(G, 0.16), G, 3);
    cv.fillStyle = G; cv.beginPath(); cv.moveTo(-180, -28); cv.lineTo(-150, -38); cv.lineTo(-120, -28); cv.lineTo(-120, 0); cv.quadraticCurveTo(-120, 26, -150, 38); cv.quadraticCurveTo(-180, 26, -180, 0); cv.closePath(); cv.fill();
    txt('بدون ریسک', 30, 2, 40, INK, { w: 900 });
  });
  // replay controls under the chart
  if (j < 0.5) {
    cv.globalAlpha *= 1 - j * 2; rrect(260, 1095, 560, 52, 26, PANEL2, LINE, 2);
    circle(540, 1121, 20, V); cv.fillStyle = ON_V; cv.fillRect(533, 1112, 6, 18); cv.fillRect(543, 1112, 6, 18);
    chip('ریپلی', 380, 1121, 24, MUTED, 'transparent'); chip('1x', 700, 1121, 24, INK, rgba(V, 0.3));
  }
  cv.restore();
}

// ---------- 6 · the journal and the analytics ----------
function journal(t) {
  if (t < T.journal - 0.1 || t > T.years + 0.5) return;
  const k = cub(k01(t, T.journal + 0.2, 0.4)), out = exIO(k01(t, T.years - 0.05, 0.5));
  cv.save(); cv.globalAlpha = k * (1 - out); cv.translate(0, -out * 200);
  // the journal row (its thumbnail is the shrunk chart card, drawn by platform())
  rrect(70, 330, 940, 300, 40, null, LINE, 3);
  txt('ژورنال', 960, 380, 44, INK, { align: 'right' });
  txt('طلا · خرید', 640, 450, 44, INK, { align: 'right', w: 800 }); txt(C.jalali, 640, 505, 30, MUTED, { align: 'right', w: 600 });
  chip('+2R', 220, 470, 40, ON_G, G);
  rrect(140, 545, 500, 18, 9, PANEL2); rrect(240, 580, 400, 18, 9, PANEL2);
  // analytics: profit and loss by hour of the day (sample bars)
  const ka = cub(k01(t, T.journal + 0.6, 0.4));
  cv.globalAlpha = k * (1 - out) * ka;
  rrect(70, 670, 940, 470, 40, PANEL, LINE, 3);
  txt('آنالیز · سود و زیان بر اساس ساعت', 960, 715, 38, INK, { align: 'right', w: 800 }); chip('نمونه', 165, 715, 26, MUTED, PANEL2);
  const H_ = [0.35, 0.55, -0.4, 0.8, 0.95, 0.3, -0.25, -0.7, -0.9, 0.2, 0.45, -0.5], base = 960, bw = 56;
  const gMake = cub(k01(t, T.make, 0.3)), gBurn = cub(k01(t, T.burn, 0.3));
  line(110, base, 970, base, LINE, 3);
  H_.forEach((v, i) => {
    const x = 930 - i * 70, grow = cub(k01(t, T.journal + 0.75 + i * 0.04, 0.35)), h = v * 150 * grow, pos = v > 0;
    const hl = pos ? gMake * (v > 0.5 ? 1 : 0) : gBurn * (v < -0.45 ? 1 : 0), dim = (gMake > 0 && !pos) || (gBurn > 0 && pos) ? 0.35 : 1;
    cv.save(); cv.globalAlpha *= dim; if (hl > 0) { cv.shadowColor = pos ? G : R; cv.shadowBlur = 40 * hl; }
    rrect(x - bw / 2, pos ? base - h : base, bw, Math.abs(h), 10, pos ? G : R); cv.restore();
  });
  if (gMake > 0) { const a = pop(t - T.make - 0.1, 14); at(705, 778, cl(a, 0, 1.2), cl(a), () => chip('اینجا می‌سازی', 0, 0, 34, ON_G, G)); }
  if (gBurn > 0) { const a = pop(t - T.burn - 0.1, 14); at(380, 778, cl(a, 0, 1.2), cl(a), () => chip('اینجا می‌سوزونی', 0, 0, 34, ON_R, R)); }
  cv.restore();
}

// ---------- 7 · years of market, in hours ----------
function years(t) {
  if (t < T.years - 0.1 || t > T.end + 0.5) return;
  const k = pop(t - T.years, 12, 0.7), out = exIO(k01(t, T.end - 0.1, 0.5));
  cv.save(); cv.globalAlpha = cl(k) * (1 - out); cv.translate(0, (1 - cl(k)) * 150 - out * 200);
  // candles streaming past at fast-forward speed
  cv.save(); cv.beginPath(); cv.rect(60, 330, 960, 380); cv.clip();
  const sp = (t - T.years) * 900;
  for (let i = 0; i < 60; i++) { const x = 1020 - ((i * 34 + sp) % 2040) + 1020, y = 520 + Math.sin(i * 0.7) * 60 + Math.sin(i * 0.23) * 50, h = 40 + rnd(i) * 70, up = rnd(i + 3) > 0.45; if (x < 40 || x > 1040) continue; line(x, y - h * 0.7, x, y + h * 0.7, rgba(up ? G : R, 0.6), 3); cv.fillStyle = rgba(up ? G : R, 0.7); cv.fillRect(x - 10, y - h / 2, 20, h); }
  cv.restore();
  // the year counter: 2015 → 2026, the stored history
  const yv = Math.round(lerp(2015, 2026, cub(k01(t, T.years + 0.1, 1.2))));
  rrect(250, 430, 580, 190, 40, `rgba(${BGR},0.85)`, rgba(AMBER, 0.6), 4);
  txt(fa(yv), CX, 530, 150, AMBER, { glow: rgba(AMBER, 0.5), blur: 40 });
  // ▶▶ fast-forward
  cv.fillStyle = INK; [0, 34].forEach((d) => { cv.beginPath(); cv.moveTo(150 + d, 495); cv.lineTo(180 + d, 525); cv.lineTo(150 + d, 555); cv.fill(); });
  // the stopwatch: the hand spins, then settles on «چند ساعت»
  const kc = pop(t - T.hours, 14, 0.6);
  if (kc > 0) at(CX, 900, cl(kc, 0, 1.2), cl(kc), () => {
    circle(0, 0, 150, PANEL, rgba(G, 0.8), 10); rrect(-24, -192, 48, 34, 10, G);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(Math.sin(a) * 120, -Math.cos(a) * 120, Math.sin(a) * 134, -Math.cos(a) * 134, MUTED, 5); }
    const a = (1 - Math.exp(-(t - T.hours) * 2)) * Math.PI * 7.3; line(0, 0, Math.sin(a) * 105, -Math.cos(a) * 105, G, 10); circle(0, 0, 14, G);
  });
  cv.restore();
}

// ---------- 8 · the end card ----------
function end(t) {
  if (t < T.end - 0.1) return;
  const ki = pop(t - T.end, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 560, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(V, 0.8); cv.shadowBlur = 80; cv.drawImage(IMG.icon, -140, -140, 280, 280); cv.shadowBlur = 0; });
  const kw = cub(k01(t, T.end + 0.3, 0.35));
  if (kw > 0 && IMG.word) { const w = 540, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 745 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - ws(89) + 0.05, 14, 0.55);
  if (kf > 0) at(CX, 980, cl(kf, 0, 1.25), cl(kf), () => { cv.shadowColor = rgba(G, 0.6); cv.shadowBlur = 40; chip('شروعش رایگانه', 0, 0, 56, ON_G, G); cv.shadowBlur = 0; });
  const kb = pop(t - T.link, 14, 0.6), pulse = 1 + 0.04 * Math.sin((t - T.link) * 6) * (t > T.link + 0.8 ? 1 : 0);
  if (kb > 0) at(CX, 1150, cl(kb, 0, 1.2) * pulse, cl(kb), () => { cv.shadowColor = rgba(V, 0.7); cv.shadowBlur = 40; rrect(-250, -68, 500, 136, 68, V); cv.shadowBlur = 0; txt('لینک توی بیو', 0, 4, 58, ON_V); });
  // an arrow nudging up, towards the profile
  const ka = cub(k01(t, T.link + 0.5, 0.4));
  if (ka > 0) { const y = 1300 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha = ka; cv.strokeStyle = LILAC; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 34, y + 20); cv.lineTo(CX, y - 14); cv.lineTo(CX + 34, y + 20); cv.stroke(); cv.restore(); }
}

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  background(t);
  const sh = (a, amp = 10) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(T.crash + 0.45) + sh(T.loss, 14), 0);
  hook(t); weeks(t); checklist(t); feelNum(t); journal(t); platform(t); years(t); end(t); captions(t);
  cv.restore();
};
/** The cover: the hook over the crashing balance. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); background(0.5); hook(T.crash + 1.4);
  cv.fillStyle = `rgba(${BGR},0.68)`; cv.fillRect(0, 0, W, H);
  const lines = [[['می‌خوای', INK], ['تو', INK], ['ترید', INK]], [['سودده', G], ['بشی…', INK]], [['ولی', INK], ['نمی‌تونی؟', R]]];
  lines.forEach((ln, i) => { let total = 0; const sz = 116, gap = measure(' ', sz) * 1.4, wds = ln.map(([s]) => measure(s, sz)); total = wds.reduce((a, b) => a + b, 0) + gap * (ln.length - 1); let right = CX + total / 2;
    ln.forEach(([s, c], j) => { txt(s, right - wds[j] / 2, 640 + i * 150, sz, c, { glow: c !== INK && !LIGHT ? rgba(c, 0.5) : undefined }); right -= wds[j] + gap; }); });
  chip('راهش رو ببین', CX, 1180, 46, ON_AMB, AMBER);
};
(async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  window.seek(0); window.ready = true;
})();
