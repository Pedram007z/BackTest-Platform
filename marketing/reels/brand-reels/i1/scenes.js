// i1 · «با ICT و اسمارت‌مانی ترید می‌کنی؟»: a music-only reel; the on-screen lines carry the script.
// Hook (the user's line) → two stat cards that spin and land on «؟» → the usual answers, struck out → a classic ICT
// short replayed on real NAS100 data (London high swept, FVG, entry at its midpoint, 2R target): it wins → the same
// setup another day: it loses → one trade proves nothing; a hundred tiles → BacktestLab: replay, chart time zone (New
// York kill zone), Fib levels for OTE, spread and commission, per-strategy win rate and average RR → call to action.
// 1080×1920, every frame a pure function of t (window.seek). Text: Vazirmatn 700–900, large, on solid ground (never
// over a busy picture). Key content stays inside Instagram's safe area (y 230–1480; x ≤ 940 below y 1100).
const W = 1080, H = 1920, CX = 540;
const BG = '#0A0910', PANEL = '#14111D', PANEL2 = '#1B1828', LINE = '#2C2842', INK = '#F5F3FA', MUTED = '#A9A3BE', FAINT = '#6E6886';
const V = '#7C5CFF', LILAC = '#B9A6FF', G = '#22C27E', R = '#F25466', AMBER = '#FFB93E', SKY = '#4C8DFF';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, CH = D.charts, VO = !!D.voiced;   // VO: the voiced cut (voice/), whose lines follow the take

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const ex = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
/** A damped spring from 0 to 1 (a small overshoot), dt seconds after its start. */
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
function measure(s, size, w = 900, dir = 'rtl') { cv.font = FONT(size, w); cv.direction = dir; return cv.measureText(s).width; }
/** Coloured runs [[text, colour], …] in reading order, laid right to left as one line centred on x (or right-aligned). */
function runs(parts, x, y, size, o = {}) {
  const wt = o.w ?? 900, gap = measure(' ', size, wt), isL = (s) => /^[\x20-\x7E\u2212]+$/.test(s), ws = parts.map(([s]) => measure(s, size, wt, isL(s) ? 'ltr' : 'rtl'));
  let total = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let sz = size; if (o.max && total > o.max) { sz = size * (o.max / total); return runs(parts, x, y, sz, { ...o, max: undefined }); }
  let right = o.align === 'right' ? x : x + total / 2;
  parts.forEach(([s, col], i) => { txt(s, right, y, sz, col, { ...o, align: 'right', dir: isL(s) ? 'ltr' : 'rtl' }); right -= ws[i] + gap; });
  return total;
}
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn) { cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
/** A pill label: text on a solid chip, centred on (x, y). */
function chip(s, x, y, size, fg, bg, o = {}) {
  const w = measure(s, size, o.w ?? 800, o.dir ?? 'rtl') + size * 1.1, h = size * 1.75;
  rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800, dir: o.dir ?? 'rtl' }); return w;
}
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- background: near-black with two slow violet glows and a faint dot grid ----------
function background(t) {
  cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
  const glow = (x, y, r, a) => { const g = cv.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(V, a)); g.addColorStop(1, rgba(V, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H); };
  glow(250 + Math.sin(t * 0.3) * 80, 420 + Math.cos(t * 0.25) * 60, 760, 0.16); glow(860 + Math.cos(t * 0.27) * 70, 1500 + Math.sin(t * 0.2) * 80, 820, 0.12);
  cv.fillStyle = 'rgba(255,255,255,0.05)';
  for (let y = 40; y < H; y += 60) for (let x = 30; x < W; x += 60) cv.fillRect(x, y, 3, 3);
}

// ---------- captions (the script) at the top, y 250–470 ----------
const CAPS = [
  [T.q1, T.q2, [[['خب…', MUTED]], [['وین‌ریت', AMBER], ['دقیقش چنده؟', INK]]]],
  [T.q2, T.guess, [[['میانگین', INK], ['ریسک به ریواردش', AMBER]], [['چی؟', INK]]]],
  [T.guess, T.dunno, [[['اگه جوابت', INK]], VO ? [['حدوداً', AMBER], ['یا', INK], ['حس می‌کنم…', AMBER]] : [['یکی از اینا بود…', INK]]]],
  [T.dunno, T.chart, [[['یعنی', INK], ['نمی‌دونی.', R]]]],
  [T.chart, T.liq, [[['یه ستاپ کلاسیک', INK], ['ICT', LILAC]], [[VO ? 'روی داده‌ی واقعی نزدک' : 'روی داده‌ی واقعی', MUTED]]]],
  [T.liq, T.sweep, [[['نقدینگی', AMBER], ['بالای سقف لندن…', INK]]]],
  [T.sweep, T.fvg, [[['سوییپ', AMBER], ['شد…', INK]]]],
  [T.fvg, T.entry, [[['حرکت قوی و', INK], ['FVG', LILAC]]]],
  [T.entry, T.tp, [[['ورود،', INK], ['حد ضرر،', R], ['تارگت 2R', G]]]],
  [T.tp, T.loss, [[['تارگت خورد:', INK], ['+2R', G]]]],
  [T.loss, T.sl, [[['همون ستاپ،', INK]], [['یه روز دیگه…', MUTED]]]],
  [T.sl, T.proof, [[['استاپ خورد:', INK], ['−1R', R]]]],
  [T.proof, T.grid, [[['یه معامله', INK]], [['هیچی رو ثابت نمی‌کنه.', INK]]]],
  [T.grid, T.brand, [[['آمار واقعی', AMBER]], [['از صدها معامله درمیاد.', INK]]]],
  [T.brand, T.f1, [[['توی بک‌تست‌لب:', INK]]]],
  [T.f1, T.f2, [[['بازار واقعی،', INK], ['کندل به کندل', LILAC]], [['بدون دیدن آینده', MUTED]]]],
  [T.f2, T.f3, [[['ساعت چارت روی', INK], ['نیویورک', LILAC]], [['برای کیل‌زون‌ها', MUTED]]]],
  [T.f3, T.f4, [[['سطوح فیبو برای', INK], ['OTE', LILAC]], [['همون‌طور که خودت می‌خوای', MUTED]]]],
  [T.f4, T.f5, [VO ? [['اسپرد و کمیسیون', LILAC], ['هم حساب می‌شه', INK]] : [['اسپرد و کمیسیون', LILAC]], [['مثل حساب واقعی', MUTED]]]],
  [T.f5, T.cta, VO ? [[['هر ستاپ رو یه استراتژی جدا تعریف کن', INK]], [['وین‌ریت و میانگین RR هرکدوم رو جدا می‌بینی', MUTED]]]
    : [[['هر ستاپ، یه استراتژی', INK]], [['وین‌ریت و میانگین RR هرکدوم، جدا', MUTED]]]],
];
function captions(t) {
  for (const [a, b, lines] of CAPS) {
    if (t < a || t >= b) continue;
    const out = k01(t, b - 0.14, 0.14);
    lines.forEach((ln, i) => {
      const k = cub(k01(t, a + i * 0.07, 0.24)), size = i === 0 ? 84 : 66, y = 318 + i * 104;
      cv.save(); cv.globalAlpha = k * (1 - out); cv.translate(0, (1 - k) * 34);
      runs(ln, CX, y, size, { max: 980, w: i === 0 ? 900 : 800 }); cv.restore();
    });
  }
}

// ---------- 1 · hook: the user's line, at full strength from the very first frame, among ICT terms ----------
// hand-placed so no two overlap: three rows above the hook, two below; d = depth (1 near, 0.6 far)
const CHIPS = [['Order Block', 250, 360, 1], ['FVG', 560, 350, 0.6], ['Liquidity', 840, 370, 1], ['BOS', 170, 495, 0.6], ['Kill Zone', 440, 500, 1],
  ['CHoCH', 760, 490, 0.6], ['OTE', 280, 625, 1], ['Silver Bullet', 640, 630, 0.6], ['Breaker', 230, 1185, 0.6], ['Premium', 530, 1175, 1],
  ['MSS', 830, 1190, 0.6], ['SMT', 170, 1315, 1], ['Discount', 440, 1320, 0.6], ['Mitigation', 760, 1310, 1]].map(([s, x, y, d], i) => ({ s, x, y, d, ph: rnd(i + 7) * 6 }));
function hook(t) {
  if (t > T.q1 + 0.3) return;
  const out = ex(k01(t, T.q1 - 0.25, 0.5));
  CHIPS.forEach((c, i) => {
    const dx = (c.x - CX) * out * 0.9, dy = (c.y - 900) * out * 0.9, f = Math.sin(t * 1.1 + c.ph) * 10;
    const a = (c.d > 0.8 ? 1 : 0.55) * (1 - out), s = c.d > 0.8 ? 1.05 : 0.88;
    at(c.x + dx, c.y + dy + f, s, a, () => chip(c.s, 0, 0, 36, c.d > 0.8 ? INK : MUTED, c.d > 0.8 ? rgba(V, 0.32) : PANEL2, { dir: 'ltr', stroke: rgba(V, 0.55), lw: 2.5 }));
  });
  // the hook itself: no entrance, a slight settle; the two names light up in turn
  const s = 1 + 0.035 * (1 - cub(k01(t, 0, 0.6))) - 0.06 * out;
  at(CX, 900, s, 1 - out, () => {
    const hl = (k) => cub(k01(t, k, 0.35));
    rrect(-470, -170, 940, 340, 48, rgba(BG, 0.82));
    runs([['با', INK], ['ICT', LILAC], ['و', INK], ['اسمارت‌مانی', LILAC]], 0, -62, 108, { max: 880 });
    runs([['ترید می‌کنی؟', INK]], 0, 74, 108);
    // underline sweeps under «ICT» and «اسمارت‌مانی» after a beat
    const u = hl(0.7); if (u > 0) { cv.fillStyle = V; const w0 = 760 * u; rrect(380 - w0, 4, w0, 10, 5, V); }
  });
}

// ---------- 2 · the two numbers nobody has: they spin and land on «؟» ----------
function statCard(y, label, t, t0, tSpin, tLand, kind) {
  const k = pop(t - t0, 14, 0.7), gone = ex(k01(t, T.guess - 0.05, 0.4));
  if (k <= 0) return;
  const x = 110 + (1 - k) * 160, a = cl(k) * (1 - gone), yy = y + gone * 380;
  cv.save(); cv.globalAlpha = a;
  const landed = t >= tLand, glow = landed ? Math.exp(-(t - tLand) * 2.2) : 0;
  if (landed) { cv.shadowColor = rgba(AMBER, 0.5 * glow + 0.15); cv.shadowBlur = 60; }
  rrect(x, yy, 860, 330, 46, PANEL, landed ? rgba(AMBER, 0.55 + 0.4 * glow) : LINE, 4); cv.shadowBlur = 0;
  txt(label, x + 800, yy + 62, 46, MUTED, { align: 'right', w: 800 });
  const cy = yy + 200, sc = landed ? 1 + 0.18 * Math.exp(-(t - tLand) * 7) * Math.cos((t - tLand) * 22) : 1;
  cv.beginPath(); cv.rect(x + 20, yy + 100, 820, 210); cv.clip();
  if (kind === 'pct') {
    if (!landed) {
      const p = k01(t, tSpin, tLand - tSpin), v = (1 - cub(p)) * 60 + 4, off = (v % 1) * 190;
      for (let j = -1; j <= 1; j++) {
        const n = (Math.floor(v) + j) % 10, m = (Math.floor(v / 10) + j) % 10;
        txt(fa(`${((n + 3) % 9) + 1}${(m + 6) % 10}٪`), x + 430, cy + off - j * 190, 200, rgba(INK, j === 0 ? 0.9 : 0.35));
      }
    } else at(x + 430, cy, sc, 1, () => txt('؟٪', 0, 0, 220, AMBER, { glow: rgba(AMBER, 0.6 * glow), blur: 50 }));
  } else {
    txt('۱ به', x + 520, cy, 170, INK, { align: 'left', dir: 'rtl' });
    const bx = x + 390;
    if (!landed) {
      const p = k01(t, tSpin, tLand - tSpin), v = (1 - cub(p)) * 40 + 1, off = (v % 1) * 190;
      for (let j = -1; j <= 1; j++) txt(fa(String(((Math.floor(v) + j) % 9) + 1)), bx, cy + off - j * 190, 190, rgba(INK, j === 0 ? 0.9 : 0.35));
    } else at(bx, cy, sc, 1, () => txt('؟', 0, 0, 210, AMBER, { glow: rgba(AMBER, 0.6 * glow), blur: 50 }));
  }
  cv.restore();
}
function stats(t) {
  if (t < T.q1 - 0.1 || t > T.guess + 0.5) return;
  statCard(640, 'وین‌ریت', t, T.q1 + 0.05, T.q1 + 0.15, Math.min(T.q1 + 1.35, T.q2 - 0.45), 'pct');
  statCard(1030, 'میانگین ریسک به ریوارد', t, T.q2 + 0.05, T.q2 + 0.15, Math.min(T.q2 + 1.3, T.guess - 0.65), 'rr');
}

// ---------- 3 · the usual answers, struck out ----------
const BUBBLES = [['حدوداً ۶۰ درصد!', 1, 690], ['فکر کنم ۱ به ۳', -1, 900], ['حس می‌کنم جواب می‌ده', 1, 1110]];
function guesses(t) {
  if (t < T.guess || t > T.chart + 0.6) return;
  const gone = ex(k01(t, T.chart - 0.2, 0.5));
  BUBBLES.forEach(([s, side, y], i) => {
    const t0 = T.guess + 0.25 + i * 0.5, k = pop(t - t0, 16, 0.6); if (k <= 0) return;
    const w = measure(s, 62, 800) + 110, x = side > 0 ? 990 - w : 90, strike = cub(k01(t, T.dunno - 0.25 + i * 0.12, 0.3));
    cv.save(); cv.globalAlpha = cl(k) * (1 - gone) * (1 - 0.45 * strike); cv.translate(x + w / 2, y + gone * (500 + i * 120)); cv.rotate(gone * side * 0.25); cv.scale(k, k);
    rrect(-w / 2, -70, w, 140, 52, side > 0 ? '#2A2440' : PANEL2, side > 0 ? null : LINE, 3);
    // the tail
    cv.fillStyle = side > 0 ? '#2A2440' : PANEL2; cv.beginPath(); const tx = side > 0 ? w / 2 - 50 : -w / 2 + 50; cv.moveTo(tx - 20, 60); cv.lineTo(tx + side * 34, 96); cv.lineTo(tx + 22, 52); cv.fill();
    txt(s, 0, 4, 62, INK, { w: 800 });
    if (strike > 0) { cv.globalAlpha = cl(k) * (1 - gone); line(w / 2 - 30, 4, w / 2 - 30 - (w - 60) * strike, 4, R, 9); }
    cv.restore();
  });
  // «یعنی نمی‌دونی.»: a red flash at the edges
  const f = Math.exp(-Math.max(0, t - T.dunno) * 4) * (t >= T.dunno ? 1 : 0);
  if (f > 0.01) { const g = cv.createRadialGradient(CX, 960, 400, CX, 960, 1200); g.addColorStop(0, rgba(R, 0)); g.addColorStop(1, rgba(R, 0.35 * f)); cv.fillStyle = g; cv.fillRect(0, 0, W, H); }
}

// ---------- 4–5 · the chart: real NAS100 5-minute bars in New York time, replayed candle by candle ----------
const PX = { x0: 70, x1: 905, y0: 690, y1: 1300 };
/** Shown bars (float) as a function of time: keys [[t, n], …], eased between keys. */
function shown(t, keys) { let n = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [ta, na] = keys[i - 1], [tb, nb] = keys[i]; if (t >= ta) n = t >= tb ? nb : lerp(na, nb, (t - ta) / (tb - ta)); } return n; }
const WIN = CH.win, LOSS = CH.loss;
const KW = [[T.chart + 0.3, 0], [T.liq - 0.1, WIN.sweep], [T.sweep, WIN.sweep], [T.sweep + 0.5, WIN.ext + 1], [T.fvg, WIN.ext + 1], [T.fvg + 0.6, WIN.fvg_i + 2],
  [T.run, WIN.fvg_i + 2], [T.tp, WIN.out + 1], [T.tp + 0.2, WIN.out + 1], [T.loss - 0.2, WIN.bars.length]];
const KL = [[T.loss + 0.3, 0], [T.lbuild, LOSS.sweep], [T.lbuild + 0.4, LOSS.ext + 1], [T.lbuild + 0.75, LOSS.fvg_i + 2], [T.lrun, LOSS.fvg_i + 2], [T.sl, LOSS.out + 1],
  [T.sl + 0.2, LOSS.out + 1], [T.proof - 0.2, LOSS.bars.length]];
// when each layer of the setup appears
const LW = { liq: T.liq, sweep: T.sweep + 0.35, fvg: T.fvg + 0.45, pos: T.entry, out: T.tp };
const LL = { liq: T.lbuild - 0.1, sweep: T.lbuild + 0.3, fvg: T.lbuild + 0.65, pos: T.lbuild + 0.95, out: T.sl };
function drawChart(c, t, n, L, o = {}) {
  const bars = c.bars, N = bars.length, step = (PX.x1 - PX.x0) / N, cw = step * 0.62;
  const upto = bars.slice(0, c.out + 1);
  let lo = Math.min(...upto.map((b) => b[2]), c.tp, c.sl), hi = Math.max(...upto.map((b) => b[1]), c.tp, c.sl); const span0 = hi - lo; lo -= span0 * 0.1; hi += span0 * 0.2;
  const X = (i) => PX.x0 + step * (i + 0.5), Y = (p) => PX.y1 - ((p - lo) / (hi - lo)) * (PX.y1 - PX.y0);
  // header: market, timeframe, date, «داده‌ی واقعی»
  txt('نزدک ۱۰۰ · ۵ دقیقه', 1000, 610, 40, INK, { align: 'right', w: 800 });
  txt(`${c.jalali} · ساعت نیویورک`, 1000, 660, 32, MUTED, { align: 'right', w: 600 });
  chip('داده‌ی واقعی', 190, 622, 30, G, rgba(G, 0.14), { stroke: rgba(G, 0.4), lw: 2 });
  // grid and axes
  const span = hi - lo, stepP = span > 400 ? 100 : span > 200 ? 50 : 25;
  for (let p = Math.ceil(lo / stepP) * stepP; p < hi; p += stepP) { const y = Y(p); line(PX.x0, y, PX.x1, y, 'rgba(255,255,255,0.06)', 2); txt(Math.round(p).toLocaleString('en-US'), 1000, y, 26, FAINT, { dir: 'ltr', align: 'right', w: 600 }); }
  c.times.forEach((s, i) => { if (s.endsWith(':00')) { line(X(i), PX.y0, X(i), PX.y1, 'rgba(255,255,255,0.05)', 2); txt(fa(s), X(i), PX.y1 + 44, 28, FAINT, { w: 600, dir: 'ltr' }); } });
  const nn = Math.floor(n), last = nn - 1, fx = n > 0 ? X(Math.max(0, last)) + step / 2 : PX.x0;
  cv.save(); cv.beginPath(); cv.rect(PX.x0 - 10, PX.y0 - 40, PX.x1 - PX.x0 + 20, PX.y1 - PX.y0 + 60); cv.clip();
  const A = (k, d = 0.3) => cub(k01(t, k, d));
  // London high, «$$$» above it
  const a1 = A(L.liq, 0.45);
  if (a1 > 0) {
    const y = Y(c.LH); line(PX.x0, y, lerp(PX.x0, PX.x1, a1), y, AMBER, 4, [16, 12]);
    for (let j = 0; j < 4; j++) txt('$', PX.x0 + 90 + j * 46, y - 30, 34, rgba(AMBER, a1 * 0.9), { dir: 'ltr', w: 900 });
  }
  // the FVG
  const a3 = A(L.fvg, 0.35);
  if (a3 > 0) { const x = X(c.fvg_i - 1) - step / 2, y = Y(c.fvg[1]), h = Y(c.fvg[0]) - y; cv.globalAlpha = a3; rrect(x, y, (PX.x1 - x) * a3, Math.max(6, h), 6, rgba(V, 0.38), rgba(LILAC, 0.9), 2.5); cv.globalAlpha = 1; }
  // the position: entry at the FVG's midpoint, stop above the sweep, target 2R
  const a4 = A(L.pos, 0.35);
  if (a4 > 0) {
    const x = X(c.fvg_i + 1), w = (PX.x1 - x) * a4, ye = Y(c.ce), ys = Y(c.sl), yt = Y(c.tp);
    const hitT = t >= L.out && c.result === 'tp', hitS = t >= L.out && c.result === 'sl', fl = t >= L.out ? Math.exp(-(t - L.out) * 3) : 0;
    rrect(x, ys, w, ye - ys, 4, rgba(R, (hitS ? 0.5 + 0.3 * fl : 0.24) * a4)); rrect(x, ye, w, yt - ye, 4, rgba(G, (hitT ? 0.45 + 0.3 * fl : 0.2) * a4));
    line(x, ye, x + w, ye, rgba(INK, a4), 3);
  }
  // candles
  for (let i = 0; i < nn; i++) {
    const [o_, h_, l_, c_] = bars[i], up = c_ >= o_, col = up ? G : R, x = X(i);
    const g = i === last ? cub((n - nn) * 3 + 0.4) : 1;
    line(x, Y(h_), x, Y(l_), col, 3);
    const y0 = Y(Math.max(o_, c_)), y1 = Y(Math.min(o_, c_)); cv.fillStyle = col; cv.globalAlpha = g; cv.fillRect(x - cw / 2, y0, cw, Math.max(3, y1 - y0)); cv.globalAlpha = 1;
  }
  // the sweep: a ring on the wick that took the liquidity
  const a2 = A(L.sweep, 0.3);
  if (a2 > 0 && nn > c.ext) { const x = X(c.ext), y = Y(bars[c.ext][1]); const pr = Math.exp(-Math.max(0, t - L.sweep) * 2.5); circle(x, y, 26 + 18 * pr, null, rgba(AMBER, a2), 5); }
  // the fill: a dot where the entry was touched
  if (c.fill !== null && nn > c.fill && a4 > 0) circle(X(c.fill), Y(c.ce), 11, INK);
  cv.restore();
  // the future is hidden: hatching right of the newest candle
  if (n > 0 && fx < PX.x1 - 2 && !o.noFuture) {
    cv.save(); cv.beginPath(); cv.rect(fx + 4, PX.y0 - 30, PX.x1 + 20 - fx, PX.y1 - PX.y0 + 50); cv.clip(); cv.fillStyle = 'rgba(10,9,16,0.55)'; cv.fillRect(fx, PX.y0 - 30, W, PX.y1 - PX.y0 + 50);
    cv.strokeStyle = 'rgba(255,255,255,0.05)'; cv.lineWidth = 3; for (let k = -1200; k < 1200; k += 26) { cv.beginPath(); cv.moveTo(fx + k, PX.y1 + 30); cv.lineTo(fx + k + 700, PX.y0 - 670 + 700 - 30); cv.stroke(); }
    cv.restore(); line(fx + 2, PX.y0 - 30, fx + 2, PX.y1 + 10, rgba(LILAC, 0.7), 3, [10, 8]);
  }
  // labels on solid chips, above everything
  const lab = (k, s, x, y, fg, bg, dir = 'rtl') => { const a = pop(t - k, 16, 0.6); if (a > 0) at(x, y, cl(a, 0, 1.2), cl(a), () => chip(s, 0, 0, 34, fg, bg, { dir })); };
  lab(L.liq + 0.2, 'سقف لندن', PX.x0 + 150, Y(c.LH) + 48, '#241A05', AMBER);
  if (nn > c.ext) lab(L.sweep + 0.05, 'سوییپ', X(c.ext) - 120, Y(bars[c.ext][1]) - 46, '#241A05', AMBER);
  lab(L.fvg + 0.25, 'FVG', X(c.fvg_i - 1) - step / 2 - 62, Y((c.fvg[0] + c.fvg[1]) / 2), INK, V, 'ltr');
  const xr = PX.x1 - 95;
  lab(L.pos + 0.15, 'حد ضرر', xr, (Y(c.sl) + Y(c.ce)) / 2, INK, R);
  lab(L.pos + 0.3, 'تارگت 2R', xr, (Y(c.tp) + Y(c.ce)) / 2 + 20, '#06291A', G);
  // the result badge
  const b = pop(t - L.out - 0.05, 13, 0.5);
  if (b > 0) at(c.badge[0], c.badge[1], cl(b, 0, 1.3), cl(b), () => {
    const win = c.result === 'tp', s = win ? '+2R' : '−1R';
    cv.shadowColor = rgba(win ? G : R, 0.7); cv.shadowBlur = 50; rrect(-150, -70, 300, 140, 70, win ? G : R); cv.shadowBlur = 0;
    txt(s, 0, 6, 88, win ? '#05241A' : INK, { dir: 'ltr', w: 900 });
  });
}
function chartPanel(t, c, n, L, xoff, alpha, o = {}) {
  cv.save(); cv.globalAlpha = alpha; cv.translate(xoff, 0);
  rrect(40, 560, 1000, 840, 44, PANEL, LINE, 3); drawChart(c, t, n, L, o); cv.restore();
}
function charts(t) {
  if (t < T.chart - 0.1 || t > T.grid + 0.2) return;
  // win: slides up in, out to the left at T.loss; loss: in from the right, then shrinks away at T.proof
  if (t < T.loss + 0.6) {
    const kin = pop(t - T.chart, 12, 0.75), kout = exIO(k01(t, T.loss - 0.05, 0.55));
    cv.save(); cv.translate(0, (1 - cl(kin)) * 700); chartPanel(t, WIN, shown(t, KW), LW, -kout * 1150, cl(kin) * (1 - kout)); cv.restore();
  }
  if (t >= T.loss - 0.05) {
    const kin = exIO(k01(t, T.loss - 0.05, 0.55)), kout = exIO(k01(t, T.proof, 0.5));
    cv.save(); const s = 1 - 0.55 * kout; cv.translate(CX + (1 - kin) * 1150 + kout * 230, 980 - kout * 40); cv.scale(s, s); cv.translate(-CX, -980);
    chartPanel(t, LOSS, shown(t, KL), LL, 0, 1 - k01(t, T.grid - 0.2, 0.3)); cv.restore();
  }
  // at «یه معامله هیچی رو ثابت نمی‌کنه» the winner comes back beside the loser, both small
  if (t >= T.proof) {
    const k = exIO(k01(t, T.proof, 0.5)), s = 0.45, a = 1 - k01(t, T.grid - 0.2, 0.3);
    cv.save(); cv.translate(CX - 230 - (1 - k) * 900, 940); cv.scale(s, s); cv.translate(-CX, -980); chartPanel(t, WIN, WIN.bars.length, LW, 0, a); cv.restore();
  }
}

// ---------- 6 · a hundred trades: two known (+2R, −1R), ninety-eight «؟» ----------
const GX = 150, GY = 640, GS = 80, GT = 62;
const tilePos = (i) => [GX + (9 - (i % 10)) * GS + GT / 2 + 4, GY + Math.floor(i / 10) * GS + GT / 2];
function grid(t, alpha = 1, scale = 1) {
  if (t < T.grid - 0.25) return;
  for (let i = 0; i < 100; i++) {
    const [x, y] = tilePos(i), d = i < 2 ? 0 : 0.05 + (Math.floor(i / 10) + (i % 10)) * 0.045, k = pop(t - T.grid - d, 18, 0.6); if (k <= 0) continue;
    const col = i === 0 ? G : i === 1 ? R : null, scan = Math.exp(-Math.pow((t - T.grid - 1.3 - (i % 10) * 0.04 - Math.floor(i / 10) * 0.02) * 6, 2));
    at(CX + (x - CX) * scale, 980 + (y - 980) * scale, cl(k, 0, 1.2) * scale, cl(k) * alpha, () => {
      rrect(-GT / 2, -GT / 2, GT, GT, 14, col ?? (scan > 0.3 ? rgba(V, 0.55) : PANEL2), col ? null : rgba(V, 0.35 + 0.5 * scan), 2.5);
      txt(i === 0 ? '+2R' : i === 1 ? '−1R' : '؟', 0, 3, i < 2 ? 22 : 30, i === 0 ? '#05241A' : INK, { dir: 'ltr', w: 900 });
    });
  }
}

// ---------- 7 · BacktestLab: the logo, then five feature cards ----------
function brand(t) {
  if (t < T.grid + 1.6 || t > T.f1 + 0.6) return;
  const k = exIO(k01(t, T.brand - 0.15, 0.55)), out = ex(k01(t, T.f1 - 0.15, 0.5));
  if (t < T.brand + 0.4) grid(t, 1 - k, 1 - 0.85 * k);
  const ki = pop(t - T.brand - 0.2, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 900 - out * 120, cl(ki, 0, 1.3) * (1 - 0.4 * out), cl(ki) * (1 - out), () => { cv.shadowColor = rgba(V, 0.8); cv.shadowBlur = 80; cv.drawImage(IMG.icon, -150, -150, 300, 300); cv.shadowBlur = 0; });
  const kw = cub(k01(t, T.brand + 0.45, 0.4));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw * (1 - out); cv.drawImage(IMG.word, CX - w / 2, 1120 + (1 - kw) * 30, w, h); cv.restore(); }
}
/** A feature card: in from the right with a spring, out to the left as the next one comes. */
function card(t, t0, t1, fn) {
  if (t < t0 - 0.1 || t > t1 + 0.5) return;
  const kin = pop(t - t0, 11, 0.78), kout = exIO(k01(t, t1 - 0.1, 0.5));
  cv.save(); cv.translate((1 - kin) * 1100 - kout * 1150, 0); cv.globalAlpha = cl(kin) * (1 - kout);
  rrect(60, 560, 960, 880, 48, PANEL, LINE, 3); fn(t - t0); cv.restore();
}
function featReplay(lt) {
  // a small chart (the winning day) stepping one candle at a time, the future hidden, and the replay controls
  const c = WIN, n = Math.min(c.bars.length - 1, 4 + Math.floor(lt / 0.16)), Lx = { liq: 1e9, sweep: 1e9, fvg: 1e9, pos: 1e9, out: 1e9 };
  cv.save(); cv.translate(540, 575); cv.scale(0.9, 0.9); cv.translate(-540, -575); drawChart(c, 0, n + 0.99, Lx); cv.restore();
  // control bar
  rrect(170, 1310, 740, 100, 50, PANEL2, LINE, 3);
  const press = (k) => Math.exp(-Math.pow(((lt % 0.16) - 0.02) * 30, 2)) * k;
  circle(540, 1360, 40 + 4 * press(1), V); cv.fillStyle = INK; cv.fillRect(526, 1342, 10, 36); cv.fillRect(545, 1342, 10, 36);
  const tri = (x, d) => { cv.fillStyle = INK; cv.beginPath(); cv.moveTo(x + d * 16, 1360); cv.lineTo(x - d * 12, 1342); cv.lineTo(x - d * 12, 1378); cv.fill(); cv.fillRect(x + d * 16 - (d > 0 ? 0 : 5), 1342, 5, 36); };
  tri(660, 1); tri(420, -1); chip('1x', 790, 1360, 30, INK, rgba(V, 0.3), { dir: 'ltr' }); chip('ریپلی', 290, 1360, 30, MUTED, 'transparent');
}
function featTz(lt) {
  txt('منطقه‌ی زمانی چارت', 960, 640, 44, INK, { align: 'right', w: 800 });
  // the search field being typed into
  rrect(110, 690, 860, 104, 30, PANEL2, rgba(V, 0.8), 3);
  const q = 'New York', nq = Math.min(q.length, Math.floor(k01(lt, 0.15, 0.45) * q.length));
  txt(q.slice(0, nq) + (Math.floor(lt * 3) % 2 && nq < q.length ? '|' : ''), 160, 744, 44, INK, { dir: 'ltr', align: 'left', w: 700 });
  circle(912, 738, 18, null, MUTED, 4); line(925, 751, 940, 766, MUTED, 4);
  const rows = [['نیویورک', 'America/New_York', 'UTC−5'], ['لندن', 'Europe/London', 'UTC'], ['تهران (پیش‌فرض)', 'Asia/Tehran', 'UTC+3:30']];
  rows.forEach(([fa_, id, off], i) => {
    const k = cub(k01(lt, 0.55 + i * 0.1, 0.25)), y = 840 + i * 118, sel = i === 0 && lt > 0.95; if (k <= 0) return;
    cv.save(); cv.globalAlpha *= k; rrect(110, y, 860, 100, 26, sel ? rgba(V, 0.35) : 'transparent', sel ? V : null, 3);
    txt(fa_, 920, y + 38, 40, INK, { align: 'right', w: 800 }); txt(id, 920, y + 76, 26, FAINT, { align: 'right', dir: 'ltr', w: 500 });
    txt(off, 160, y + 52, 32, sel ? INK : MUTED, { align: 'left', dir: 'ltr', w: 700 });
    if (sel) { cv.strokeStyle = INK; cv.lineWidth = 6; cv.beginPath(); cv.moveTo(330, y + 52); cv.lineTo(348, y + 70); cv.lineTo(380, y + 34); cv.stroke(); }
    cv.restore();
  });
  // the NY kill zone on a time axis in New York time
  const kz = cub(k01(lt, 1.05, 0.45)), x0 = 140, x1 = 940, hx = (h) => lerp(x0, x1, (h - 5) / 7);
  line(x0, 1300, x1, 1300, LINE, 4);
  for (let h = 5; h <= 12; h++) { line(hx(h), 1290, hx(h), 1310, FAINT, 3); txt(fa(`${String(h).padStart(2, '0')}:00`), hx(h), 1345, 26, FAINT, { dir: 'ltr', w: 600 }); }
  if (kz > 0) { rrect(hx(7), 1230, (hx(10) - hx(7)) * kz, 60, 14, rgba(AMBER, 0.3), AMBER, 3); if (kz > 0.6) txt('کیل‌زون نیویورک', (hx(7) + hx(10)) / 2, 1261, 30, INK, { w: 800, alpha: (kz - 0.6) / 0.4 }); }
}
function featFib(lt) {
  txt('فیبوناچی · تنظیمات', 960, 640, 44, INK, { align: 'right', w: 800 });
  ['سبک', 'متن', 'مختصات', 'نمایش'].forEach((s, i) => { const x = 900 - i * 160; txt(s, x, 712, 32, i === 0 ? INK : FAINT, { w: 800 }); if (!i) rrect(x - 50, 738, 100, 6, 3, V); });
  line(110, 744, 970, 744, LINE, 2);
  const base = [[0, '0', MUTED], [1, '0.5', '#9AA0B5'], [5, '1', MUTED]], add = [[2, '0.62', AMBER], [3, '0.705', AMBER], [4, '0.79', AMBER]];
  const ta = (j) => 0.45 + j * 0.32, rowsAll = [...base, ...add.filter((_, j) => lt > ta(j))].sort((a, b) => a[0] - b[0]);
  rowsAll.forEach(([key, v, col], i) => {
    const isNew = key >= 2 && key <= 4, kn = isNew ? pop(lt - ta(key - 2), 16, 0.6) : 1, y = 790 + i * 82;
    cv.save(); cv.globalAlpha *= cl(kn); if (isNew) { cv.translate(540, y + 36); cv.scale(1, cl(kn, 0, 1.2)); cv.translate(-540, -y - 36); }
    rrect(110, y, 500, 70, 18, isNew ? rgba(AMBER, 0.14) : PANEL2, isNew ? rgba(AMBER, 0.6) : null, 2.5);
    rrect(548, y + 17, 36, 36, 9, V); cv.strokeStyle = INK; cv.lineWidth = 4; cv.beginPath(); cv.moveTo(556, y + 35); cv.lineTo(564, y + 44); cv.lineTo(577, y + 26); cv.stroke();
    txt(v, 470, y + 37, 36, INK, { dir: 'ltr', w: 800 }); rrect(150, y + 15, 70, 40, 10, col);
    cv.restore();
  });
  const bk = Math.exp(-Math.pow(((lt - 0.4) % 0.32) * 18, 2)) * (lt < 1.4 ? 1 : 0);
  chip('+ افزودن سطح', 360, 1330, 32, INK, rgba(V, 0.35 + 0.4 * bk), { stroke: V, lw: 2.5 });
  // preview: the swing, the levels, the OTE band between 0.62 and 0.79
  const px0 = 660, px1 = 980, py0 = 800, py1 = 1280, ly = (v) => lerp(py0, py1, v);
  rrect(px0 - 10, py0 - 30, px1 - px0 + 20, py1 - py0 + 60, 24, PANEL2);
  const ote = cub(k01(lt, 1.35, 0.4));
  if (ote > 0) { rrect(px0, ly(0.62), (px1 - px0) * ote, ly(0.79) - ly(0.62), 6, rgba(AMBER, 0.28)); if (ote > 0.7) txt('OTE', (px0 + px1) / 2, (ly(0.62) + ly(0.79)) / 2, 34, AMBER, { dir: 'ltr' }); }
  [[0, MUTED], [0.5, '#9AA0B5'], [1, MUTED], ...add.filter((_, j) => lt > ta(j)).map(([, v]) => [Number(v), AMBER])].forEach(([v, col]) => line(px0, ly(v), px1, ly(v), col, 3));
  line(px0 + 20, py1, px1 - 20, py0, rgba(INK, 0.5), 3, [10, 8]);
}
function featCosts(lt) {
  txt('اسپرد و کمیسیون', 960, 640, 44, INK, { align: 'right', w: 800 });
  const cols = [[940, 'نماد'], [640, 'اسپرد (پیپ)'], [320, 'کمیسیون ($/لات)']];
  cols.forEach(([x, s]) => txt(s, x, 725, 30, MUTED, { align: 'right', w: 700 }));
  line(110, 760, 970, 760, LINE, 2);
  const rows = [['NAS100', '1.0', '0'], ['EURUSD', '0.8', '7']];
  rows.forEach(([sym, sp, cm], i) => {
    const y = 820 + i * 110, k = cub(k01(lt, 0.2 + i * 0.25, 0.3)); if (k <= 0) return;
    cv.save(); cv.globalAlpha *= k;
    txt(sym, 940, y, 38, INK, { align: 'right', dir: 'ltr', w: 800 });
    const typ = (s, x, t0) => { const m = Math.floor(k01(lt, t0, 0.3) * s.length); rrect(x - 200, y - 38, 200, 76, 18, PANEL2, m && m < s.length ? V : LINE, 2.5); txt(s.slice(0, m), x - 30, y + 2, 38, INK, { align: 'right', dir: 'ltr', w: 800 }); };
    typ(sp, 640, 0.45 + i * 0.25); typ(cm, 320, 0.65 + i * 0.25); cv.restore();
  });
  // Bid and Ask on a small chart: the chart shows bids, the Ask line one spread above
  const k = cub(k01(lt, 0.9, 0.5)), y0 = 1180, gap = 46;
  if (k > 0) {
    cv.save(); cv.globalAlpha *= k; rrect(110, 1040, 860, 290, 26, PANEL2);
    for (let i = 0; i < 16; i++) { const x = 160 + i * 42, o = Math.sin(i * 1.3) * 40, c = Math.sin(i * 1.3 + 0.9) * 40, up = c < o; line(x, y0 + Math.min(o, c) - 18, x, y0 + Math.max(o, c) + 18, up ? G : R, 3); cv.fillStyle = up ? G : R; cv.fillRect(x - 11, y0 + Math.min(o, c), 22, Math.max(4, Math.abs(c - o))); }
    line(130, y0 - 6 - gap, 830 * k + 130 * (1 - k), y0 - 6 - gap, R, 4); line(130, y0 - 6, 830 * k + 130 * (1 - k), y0 - 6, SKY, 4);
    chip('Ask', 900, y0 - 6 - gap, 28, INK, R, { dir: 'ltr' }); chip('Bid', 900, y0 - 6, 28, INK, SKY, { dir: 'ltr' }); cv.restore();
  }
}
function featStats(lt) {
  txt('آنالیز', 960, 640, 44, INK, { align: 'right', w: 800 });
  // the strategy filter, open, one setup per strategy
  const opts = ['اوردر بلاک', 'سوییپ + FVG', 'سیلور بولت'], sel = Math.min(2, Math.floor(k01(lt, 0.35, 0.9) * 3)) === 1 || lt > 1.0 ? 1 : 0;
  rrect(110, 690, 860, 96, 26, PANEL2, V, 3); txt(`استراتژی: ${opts[lt > 1.0 ? 1 : sel]}`, 920, 740, 38, INK, { align: 'right', w: 800 });
  cv.fillStyle = MUTED; cv.beginPath(); cv.moveTo(150, 728); cv.lineTo(178, 728); cv.lineTo(164, 748); cv.fill();
  const open = cub(k01(lt, 0.15, 0.25)) * (1 - cub(k01(lt, 1.05, 0.25)));
  if (open > 0) {
    cv.save(); cv.globalAlpha *= open; rrect(110, 800, 860, 3 * 92 + 20, 26, '#221E33', LINE, 3);
    opts.forEach((s, i) => { const y = 810 + i * 92, on = i === 1 && lt > 0.65; if (on) rrect(124, y, 832, 82, 20, rgba(V, 0.4)); txt(s, 920, y + 43, 38, INK, { align: 'right', w: 800 }); });
    cv.restore();
  }
  // three tiles: «؟» until the filter is set, then the numbers come from your own trades
  const tiles = [['وین‌ریت', 830], ['میانگین RR', 540], ['کل معاملات', 250]];
  tiles.forEach(([s, x], i) => {
    const y = 1250, flip = k01(lt, 1.35 + i * 0.12, 0.35), sx = Math.abs(Math.cos(flip * Math.PI)), back = flip > 0.5;
    cv.save(); cv.translate(x, y); cv.scale(sx, 1); rrect(-135, -140, 270, 280, 32, back ? rgba(G, 0.14) : PANEL2, back ? rgba(G, 0.6) : LINE, 3);
    txt(s, 0, -100, 30, MUTED, { w: 700 });
    if (!back) txt('؟', 0, 20, 120, AMBER);
    else { cv.strokeStyle = G; cv.lineWidth = 12; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-44, 10); cv.lineTo(-12, 44); cv.lineTo(50, -24); cv.stroke(); txt('از معامله‌های خودت', 0, 100, 26, MUTED, { w: 700 }); }
    cv.restore();
  });
}

// ---------- 8 · call to action ----------
function cta(t) {
  if (t < T.cta - 0.1) return;
  const k = pop(t - T.cta, 12, 0.65), up = exIO(k01(t, T.end, 0.6));
  at(CX, 860 - up * 360, 1 - 0.25 * up, cl(k), () => {
    runs([['با عدد ترید کن،', INK]], 0, -70, 112);
    const k2 = pop(t - T.cta - 0.45, 14, 0.6); at(0, 70, cl(k2, 0, 1.2), cl(k2), () => runs([['نه با حس.', LILAC]], 0, 0, 112));
  });
  const ki = pop(t - T.end - 0.25, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 870, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(V, 0.8); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -110, -110, 220, 220); cv.shadowBlur = 0; });
  const kw = cub(k01(t, T.end + 0.55, 0.4));
  if (kw > 0 && IMG.word) { const w = 470, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 1010 + (1 - kw) * 24, w, h); cv.restore(); }
  const kb = pop(t - T.end - 0.85, 14, 0.6), pulse = 1 + 0.035 * Math.sin((t - T.end) * 6) * (t > T.end + 1.4 ? 1 : 0);
  if (kb > 0) at(CX, 1220, cl(kb, 0, 1.2) * pulse, cl(kb), () => { cv.shadowColor = rgba(V, 0.7); cv.shadowBlur = 40; rrect(-230, -62, 460, 124, 62, V); cv.shadowBlur = 0; txt('لینک توی بیو', 0, 4, 52, INK); });
  const ks = cub(k01(t, T.end + 1.3, 0.45));
  if (ks > 0) {
    cv.save(); cv.globalAlpha = ks; cv.translate(0, (1 - ks) * 24);
    runs([['بفرستش برای رفیقت', INK], ['که ICT کار می‌کنه', MUTED]], CX + 30, 1360, 44, { w: 800, max: 820 });
    // a paper plane
    const px = 140, py = 1360; cv.fillStyle = LILAC; cv.beginPath(); cv.moveTo(px - 30, py + 4); cv.lineTo(px + 34, py - 26); cv.lineTo(px + 8, py + 30); cv.lineTo(px - 2, py + 10); cv.closePath(); cv.fill();
    cv.restore();
  }
}

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  background(t);
  // a short shake on «یعنی نمی‌دونی.» and on the stop-out
  const sh = (a) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * 10 : 0);
  cv.save(); cv.translate(sh(T.dunno) + sh(T.sl), 0);
  hook(t); stats(t); guesses(t); charts(t);
  if (t < T.brand - 0.15 && t >= T.grid - 0.25) grid(t);
  brand(t);
  card(t, T.f1, T.f2, featReplay); card(t, T.f2, T.f3, featTz); card(t, T.f3, T.f4, featFib); card(t, T.f4, T.f5, featCosts); card(t, T.f5, T.cta, featStats);
  cta(t); captions(t);
  cv.restore();
};
/** The cover (Instagram grid, 1080×1920 with the middle 1080×1350 safe): the hook and the two «؟» cards. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); background(0.5);
  runs([['با', INK], ['ICT', LILAC], ['و', INK], ['اسمارت‌مانی', LILAC]], CX, 470, 104, { max: 900 }); runs([['ترید می‌کنی؟', INK]], CX, 600, 104);
  const card2 = (y, label, val) => { rrect(130, y, 820, 300, 44, PANEL, rgba(AMBER, 0.6), 4); txt(label, 890, y + 58, 44, MUTED, { align: 'right', w: 800 }); txt(val, CX, y + 185, 190, AMBER, { glow: rgba(AMBER, 0.4), blur: 40 }); };
  card2(760, 'وین‌ریت', '؟٪'); card2(1110, 'میانگین ریسک به ریوارد', '۱ به ؟');
  chip('جوابشو می‌دونی؟', CX, 1500, 46, '#241A05', AMBER);
};
(async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  window.seek(0); window.ready = true;
})();
