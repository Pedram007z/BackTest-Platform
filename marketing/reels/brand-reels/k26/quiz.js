// k26 · «خرید یا فروش؟», a chart quiz on the bear flag, on the user's take at its normal speed. An original reel in
// BacktestLab's own look: a sample chart (drawn here, labelled «نمودار نمونه») replays up to a decision point; the
// viewer gets five seconds to pick «خرید» or «فروش» on two big buttons under a lime countdown; then the chart explains
// itself (the sellers' big red candles, the buyers' small weak ones, the flag's channel and pole), the plan is drawn
// as a position (entry under the flag's floor, the stop above the flag, the target three times the risk), the replay
// runs on to the target (labelled «مثال»), a grid of a hundred setups asks how often it really works, and the close is
// the real BacktestLab replay with «می‌تونی این استراتژی رو توی بک‌تست‌لب امتحان کنی».
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], we = (i) => D.w[i][1], END = D.end, DUR = D.dur, B = D.beats;
const INK = '#0B0C10', CARD = '#11121A', GRID = 'rgba(255,255,255,0.05)', RED = '#FF4D5E', GREEN = '#2FD67B', LIME = '#C6F24E', VIO = '#6C47FF', WHITE = '#FFFFFF', AMB = '#FFB020', LIL = '#A58BFF';
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - cl(k)) ** 3, oBack = (k) => { const c = 1.9; k = cl(k); return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const IMG = {};
const font = (s, w = 900) => `${w} ${s}px Vazirmatn`;
function measure(s, size, w = 900) { cv.font = font(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function txt(s, x, y, size, col, o = {}) { cv.save(); cv.font = font(size, o.w ?? 900); cv.direction = o.dir ?? 'rtl'; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.globalAlpha *= o.alpha ?? 1; cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
function rrect(x, y, w, h, r, fill, stroke, lw = 2) { cv.beginPath(); cv.roundRect(x, y, w, h, r); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw, dash) { cv.save(); cv.beginPath(); if (dash) cv.setLineDash(dash); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { if (a <= 0 || s <= 0) return; cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.35) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : oBack(k01(t, t0, d)));
function chip(s, x, y, size, bg, fg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 0.9, h = size * 1.55; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.06, size, fg, { w: o.w ?? 800 }); return w; }

// ---------- the sample chart: an uptrend, a sharp drop, a weak flag, the break, the fall to the target ----------
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const CANDLES = (() => { const out = []; let p = 100; const push = (o, c, wk = 0.6) => { const hi = Math.max(o, c) + wk * (0.3 + rnd(out.length * 3)), lo = Math.min(o, c) - wk * (0.3 + rnd(out.length * 5)); out.push({ o, h: hi, l: lo, c }); p = c; };
  for (let i = 0; i < 32; i++) { const c = p + 0.95 + (rnd(i * 7 + 1) - 0.42) * 3.2; push(p, c, 1.0); }                       // the uptrend
  [-5.2, -5.8, -4.6, -5.4, -3.6].forEach((d, i) => push(p, p + d, 0.7));                                                   // the sellers: five big red candles
  const f0 = p; for (let i = 0; i < 12; i++) { const target = f0 + 0.55 * (i + 1), c = target + (i % 2 ? -0.9 : 0.6) * (0.6 + rnd(i * 11) * 0.5); push(p, c, 0.45); }   // the flag: small, weak
  push(p, p - 4.4, 0.5);                                                                                                     // the break, under the flag's floor
  for (let i = 0; i < 14; i++) { const c = p - 1.55 + (rnd(i * 13 + 5) - 0.5) * 2.6; push(p, c, 0.8); }                   // the fall
  return out; })();
const I_DROP = 32, I_FLAG = 37, I_BREAK = 49, N = CANDLES.length;
const FLAG = (() => { const f = CANDLES.slice(I_FLAG, I_BREAK); const lo = Math.min(...f.map((c) => c.l)), hi = Math.max(...f.map((c) => c.h)); return { lo, hi }; })();
const ENTRY = CANDLES[I_BREAK].c, STOP = FLAG.hi + 0.6, RISK = STOP - ENTRY, TARGET = ENTRY - 3 * RISK;
const I_HIT = (() => { for (let i = I_BREAK + 1; i < N; i++) if (CANDLES[i].l <= TARGET) return i; return N - 1; })();
// the chart card
const CH = { x: 60, y: 560, w: 960, h: 820 };
const pmin = Math.min(...CANDLES.map((c) => c.l), TARGET) - 2, pmax = Math.max(...CANDLES.map((c) => c.h)) + 2;
const cx = (i) => CH.x + 40 + (i + 0.5) * ((CH.w - 120) / N), cy = (p) => CH.y + 30 + (1 - (p - pmin) / (pmax - pmin)) * (CH.h - 90), CW = ((CH.w - 120) / N) * 0.62;
function candle(i, a = 1, hl = 0) { const c = CANDLES[i], up = c.c >= c.o, col = up ? GREEN : RED, x = cx(i); cv.save(); cv.globalAlpha *= a;
  if (hl) { cv.shadowColor = rgba(col, 0.9); cv.shadowBlur = 24 * hl; }
  line(x, cy(c.h), x, cy(c.l), col, 3); const y1 = cy(Math.max(c.o, c.c)), y2 = cy(Math.min(c.o, c.c)); cv.fillStyle = col; cv.fillRect(x - CW / 2, y1, CW, Math.max(3, y2 - y1)); cv.restore(); }
function chartCard(t, shown, o = {}) {
  shadowed(() => rrect(CH.x, CH.y, CH.w, CH.h, 36, CARD), 60, 24, 0.5); rrect(CH.x, CH.y, CH.w, CH.h, 36, null, 'rgba(255,255,255,0.08)', 2);
  cv.save(); cv.beginPath(); cv.roundRect(CH.x, CH.y, CH.w, CH.h, 36); cv.clip();
  for (let k = 1; k < 6; k++) line(CH.x, CH.y + (k * CH.h) / 6, CH.x + CH.w, CH.y + (k * CH.h) / 6, GRID, 2);
  if (o.under) o.under();
  const whole = Math.floor(shown); for (let i = 0; i < Math.min(N, whole); i++) candle(i, o.alpha ? o.alpha(i) : 1, o.hl ? o.hl(i) : 0);
  if (o.over) o.over();
  cv.restore();
  txt('نمودار نمونه', CH.x + CH.w - 30, CH.y + 34, 26, 'rgba(255,255,255,0.45)', { w: 700, align: 'right' });
}

// ---------- kinetic headline (one line at a time, words landing on the voice) ----------
const L = (y, size, col, toks, o = {}) => ({ y, size, col, toks, ...o });
function drawLine(ln, t) {
  const size = ln.size, gap = size * 0.26, toks = ln.toks.map(([s, wi, st = {}]) => { const sz = st.size ?? size; return { s, sz, st, w: measure(s, sz), t0: ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, m: st.hl ? sz * 0.24 : 0 }; });
  const total = toks.reduce((a, k) => a + k.w + 2 * k.m, 0) + gap * (toks.length - 1); let xr = CX + total / 2;
  toks.forEach((k) => { const x = xr - k.m - k.w / 2; xr -= k.w + 2 * k.m + gap; const e = t - k.t0; if (e < 0) return; const q = k01(e, 0, 0.2), big = k.st.hl;
    at(x, ln.y + (big ? 0 : (1 - oCub(q)) * 40), big ? lerp(1.5, 1, oBack(q)) : 1, cl(q * 2), () => {
      if (big) { const g = oCub(k01(e, 0.03, 0.18)), w = k.w + k.sz * 0.42, h = k.sz * 1.3; cv.save(); cv.beginPath(); cv.rect(w / 2 - w * g, -h, w * g + 2, h * 2); cv.clip(); shadowed(() => rrect(-w / 2, -h / 2, w, h, k.sz * 0.16, k.st.hl), 30, 10, 0.3); cv.restore(); }
      txt(k.s, 0, k.sz * 0.05, k.sz, big ? (k.st.ht ?? WHITE) : (k.st.c ?? ln.col)); }); });
}
