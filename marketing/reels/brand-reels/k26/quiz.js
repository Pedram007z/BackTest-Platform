// k26 · «خرید یا فروش؟», a chart quiz on the bear flag, on the user's take at its normal speed. An original reel in
// BacktestLab's own look: a sample chart (drawn here, labelled «نمودار نمونه») replays up to a decision point; the
// viewer gets five seconds to pick «خرید» or «فروش» on two big buttons under a lime countdown; then the chart explains
// itself (the sellers' big red candles, the buyers' small weak ones, the flag's channel and pole), the plan is drawn
// as a position (entry under the flag's floor, the stop above the flag, the target three times the risk), the replay
// runs on to the target (labelled «مثال»), a grid of a hundred setups asks how often it really works, and the close is
// the real BacktestLab replay with «می‌تونی این استراتژی رو توی بک‌تست‌لب امتحان کنی».
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], we = (i) => D.w[i][1], END = D.end, DUR = D.dur;
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
const CH = { x: 50, y: 560, w: 980, h: 900 }, V0 = 12, NV = 64 - V0;
const pmin = Math.min(...CANDLES.slice(V0).map((c) => c.l), TARGET) - 2, pmax = Math.max(...CANDLES.slice(V0).map((c) => c.h)) + 2;
const cx = (i) => CH.x + 30 + (i - V0 + 0.5) * ((CH.w - 90) / NV), cy = (p) => CH.y + 60 + (1 - (p - pmin) / (pmax - pmin)) * (CH.h - 120), CW = ((CH.w - 90) / NV) * 0.62;
function candle(i, a = 1, hl = 0) { const c = CANDLES[i], up = c.c >= c.o, col = up ? GREEN : RED, x = cx(i); cv.save(); cv.globalAlpha *= a;
  if (hl) { cv.shadowColor = rgba(col, 0.9); cv.shadowBlur = 24 * hl; }
  line(x, cy(c.h), x, cy(c.l), col, 3); const y1 = cy(Math.max(c.o, c.c)), y2 = cy(Math.min(c.o, c.c)); cv.fillStyle = col; cv.fillRect(x - CW / 2, y1, CW, Math.max(3, y2 - y1)); cv.restore(); }
function chartCard(t, shown, o = {}) {
  shadowed(() => rrect(CH.x, CH.y, CH.w, CH.h, 36, CARD), 60, 24, 0.5); rrect(CH.x, CH.y, CH.w, CH.h, 36, null, 'rgba(255,255,255,0.08)', 2);
  cv.save(); cv.beginPath(); cv.roundRect(CH.x, CH.y, CH.w, CH.h, 36); cv.clip();
  for (let k = 1; k < 6; k++) line(CH.x, CH.y + (k * CH.h) / 6, CH.x + CH.w, CH.y + (k * CH.h) / 6, GRID, 2);
  if (o.under) o.under();
  const whole = Math.floor(shown); for (let i = V0; i < Math.min(N, whole); i++) candle(i, o.alpha ? o.alpha(i) : 1, o.hl ? o.hl(i) : 0);
  if (o.over) o.over();
  cv.restore();
  txt('نمودار نمونه', CH.x + CH.w - 30, CH.y + 34, 26, 'rgba(255,255,255,0.45)', { w: 700, align: 'right' });
}

// ---------- kinetic headline (one line at a time, words landing on the voice) ----------
const L = (y, size, col, toks, o = {}) => ({ y, size, col, toks, ...o });
function drawLine(ln, t) {
  const size = ln.size, gap = size * 0.26, toks = ln.toks.map(([s, wi, st = {}]) => { const sz = st.size ?? size; return { s, sz, st, w: measure(s, sz), t0: ln.now ? -1 : ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, m: st.hl ? sz * 0.24 : 0 }; });
  const total = toks.reduce((a, k) => a + k.w + 2 * k.m, 0) + gap * (toks.length - 1); let xr = CX + total / 2;
  toks.forEach((k) => { const x = xr - k.m - k.w / 2; xr -= k.w + 2 * k.m + gap; const e = t - k.t0; if (e < 0) return; const q = k01(e, 0, 0.2), big = k.st.hl;
    at(x, ln.y + (big ? 0 : (1 - oCub(q)) * 40), big ? lerp(1.5, 1, oBack(q)) : 1, cl(q * 2), () => {
      if (big) { const g = oCub(k01(e, 0.03, 0.18)), w = k.w + k.sz * 0.42, h = k.sz * 1.3; cv.save(); cv.beginPath(); cv.rect(w / 2 - w * g, -h, w * g + 2, h * 2); cv.clip(); shadowed(() => rrect(-w / 2, -h / 2, w, h, k.sz * 0.16, k.st.hl), 30, 10, 0.3); cv.restore(); }
      txt(k.s, 0, k.sz * 0.05, k.sz, big ? (k.st.ht ?? WHITE) : (k.st.c ?? ln.col)); }); });
}

// ---------- the phases ----------
// each phase: [from word, headline lines]; the chart card stays on screen from the quiz to the result
const PH = [
  { w: 0, lines: [L(300, 150, WHITE, [['خرید', 0, { c: GREEN }], ['یا', 1], ['فروش؟', 2, { c: RED }]], { now: true }), L(450, 72, WHITE, [['۵', 3, { c: LIME }], ['ثانیه', 4], ['وقت', 5], ['داری', 6], ['تصمیم', 7], ['بگیری', 8]])] },
  { w: 9, lines: [L(330, 120, WHITE, [['خب،', 9], ['وقت', 10], ['تمومه!', 11, { hl: VIO }]])] },
  { w: 12, lines: [L(260, 100, WHITE, [['نگاه', 12], ['کن:', 13], ['فروشنده‌ها', [14, 15], { hl: RED }]]), L(390, 66, WHITE, [['با', 16], ['چند', 17], ['تا', 18], ['کندل', 19], ['قرمز', 20, { c: RED }], ['بزرگ', 21]]),
    L(480, 66, WHITE, [['قیمت', 22], ['رو', 23], ['یه‌نفس', [24, 25]], ['آوردن', 26], ['پایین.', 27, { c: RED }]])] },
  { w: 28, lines: [L(260, 90, WHITE, [['بعدش', 28], ['خریدارها', 29, { c: GREEN }], ['اومدن،', 30]]), L(385, 62, WHITE, [['ولی', 31], ['ببین', 32], ['کندل‌هاشون', 33], ['چقدر', 34], ['کوچیکه', 35, { hl: GREEN, ht: INK }]]),
    L(485, 62, WHITE, [['قیمت', 36], ['آروم', 37], ['و', 38], ['بی‌جون', 39, { c: LIL }], ['داره', 40], ['بالا', 41], ['می‌ره.', 42]])] },
  { w: 43, lines: [L(250, 72, WHITE, [['به', 43], ['این', 44], ['الگو', 45], ['می‌گن', 46]]), L(380, 130, WHITE, [['پرچم', 47], ['نزولی', 48, { hl: RED }]])] },
  { w: 49, lines: [L(260, 76, WHITE, [['یه', 49], ['ریزش', 50, { c: RED }], ['تند،', 51]]), L(370, 76, WHITE, [['یه', 52], ['استراحت', 53, { c: LIL }], ['کوتاه،', 54]]), L(480, 64, WHITE, [['و', 55], ['احتمال', 56], ['اینکه', [57, 58]], ['ریزش', 59, { c: RED }], ['ادامه', 60], ['پیدا', 61], ['کنه.', 62]])] },
  { w: 63, lines: [L(250, 90, WHITE, [['نقشه', 63, { c: LIME }], ['اینه:', 64]]), L(365, 64, WHITE, [['وقتی', 65], ['یه', 66], ['کندل', 67], ['زیر', 68], ['کف', 69, { c: LIME }], ['پرچم', 70], ['بسته', 71], ['شد،', 72]]), L(475, 100, WHITE, [['فروش.', 73, { hl: RED }]])] },
  { w: 74, lines: [L(270, 80, WHITE, [['حد', 74], ['ضرر', 75, { c: RED }], ['بالای', 76], ['پرچم،', 77]]), L(400, 80, WHITE, [['حد', 78], ['سود', 79, { c: GREEN }], ['سه', 80, { hl: GREEN, ht: INK }], ['برابر', 81], ['ریسک.', 82]])] },
  { w: 83, lines: [L(260, 80, WHITE, [['توی', 83], ['این', 84], ['مثال،', 85, { hl: LIME, ht: INK }]]), L(390, 80, WHITE, [['قیمت', 86], ['ریخت', 87, { c: RED }], ['و', 88], ['حد', 89], ['سود', 90, { c: GREEN }], ['خورد.', 91]])] },
  { w: 92, lines: [L(320, 90, WHITE, [['ولی', 92], ['یه', 93], ['معامله', 94]]), L(460, 100, WHITE, [['هیچی', 95, { hl: RED }], ['رو', 96], ['ثابت', 97], ['نمی‌کنه.', [98, 99]]])] },
  { w: 100, lines: [L(250, 72, WHITE, [['سؤال', 100], ['اصلی', 101], ['اینه:', 102]]), L(370, 76, WHITE, [['این', 103], ['الگو', 104], ['توی', 105], ['۱۰۰', 106, { c: LIME }], ['تا', 107], ['موقعیت', 108]]), L(490, 100, WHITE, [['چقدر', 109], ['جواب', 110], ['می‌ده؟', 111, { hl: LIME, ht: INK }]])] },
  { w: 112, lines: [L(250, 76, WHITE, [['می‌تونی', 112], ['این', 113], ['استراتژی', 114], ['رو', 115]]), L(370, 76, WHITE, [['توی', 116], ['بک‌تست‌لب', [117, 118], { hl: VIO }], ['امتحان', 119], ['کنی،', 120]])] },
  { w: 121, lines: [L(260, 76, WHITE, [['روی', 121], ['بازار', 122], ['واقعیِ', 123], ['گذشته،', 124, { c: LIME }]]), L(380, 90, WHITE, [['بدون', 125], ['دیدن', 126], ['آینده.', 127, { hl: VIO }]])] },
  { w: 128, lines: [L(560, 130, WHITE, [['شروعش', 128]]), L(740, 170, WHITE, [['رایگانه!', 129, { hl: LIME, ht: INK }]])] },
];
const phaseAt = (t) => { let k = 0; PH.forEach((p, i) => { if (t >= ws(p.w) - 0.12) k = i; }); return k; };
const T = (i) => ws(i) - 0.07;

// chart overlays
function arrowDown(x1, y1, x2, y2, col, k, lw = 10) { if (k <= 0) return; const x = lerp(x1, x2, k), y = lerp(y1, y2, k); line(x1, y1, x, y, col, lw); const a = Math.atan2(y - y1, x - x1); cv.save(); cv.translate(x, y); cv.rotate(a); cv.fillStyle = col; cv.beginPath(); cv.moveTo(14, 0); cv.lineTo(-18, -18); cv.lineTo(-18, 18); cv.closePath(); cv.fill(); cv.restore(); }
function tag(s, x, y, bg, fg, size = 36, a = 1) { at(x, y, 1, a, () => chip(s, 0, 0, size, bg, fg)); }
function chartScene(t) {
  const ph = phaseAt(t), Tb = T(71), hit = (t) => t >= ws(91) - 0.1;
  // how many candles: the setup from the first frame, the break on «بسته شد», the replay to the target on «قیمت ریخت»
  let shown = I_BREAK; if (t >= Tb) shown = I_BREAK + 1; if (t >= T(86)) shown = I_BREAK + 1 + (I_HIT - I_BREAK) * oCub(k01(t, T(86), ws(91) - ws(86)));
  const sell = ph === 2, buy = ph === 3, pole = t >= T(47) && t < T(63), flagOn = t >= T(47);
  const alpha = (i) => (sell ? (i >= I_DROP && i < I_FLAG ? 1 : 0.28) : buy ? (i >= I_FLAG && i < I_BREAK ? 1 : 0.28) : 1);
  const hl = (i) => (sell && i >= I_DROP && i < I_FLAG && t > T(19) ? 1 : buy && i >= I_FLAG && i < I_BREAK && t > T(33) ? 0.8 : i === I_BREAK && t >= Tb && t < Tb + 0.8 ? 1 : 0);
  const fx0 = cx(I_FLAG) - CW, fx1 = cx(I_BREAK - 1) + CW, chLo0 = FLAG.lo, chLo1 = FLAG.lo + 5.0, chHi0 = FLAG.hi - 4.4, chHi1 = FLAG.hi + 0.4;
  chartCard(t, shown, { alpha, hl,
    under: () => {
      // the plan: the stop and the target as boxes from the entry
      const pk = oCub(k01(t, T(75), 0.35)), tk = oCub(k01(t, T(79), 0.35)), x0 = cx(I_BREAK) - CW, x1 = CH.x + CH.w - 30;
      if (pk > 0) { cv.save(); cv.globalAlpha = pk; rrect(x0, cy(STOP), x1 - x0, cy(ENTRY) - cy(STOP), 8, rgba(RED, 0.22), rgba(RED, 0.6), 2); cv.restore(); }
      if (tk > 0) { const win = hit(t) ? 0.22 + 0.2 * Math.abs(Math.sin((t - ws(91)) * 8)) * cl(1 - (t - ws(91)) / 1.2) : 0.18; cv.save(); cv.globalAlpha = tk; rrect(x0, cy(ENTRY), x1 - x0, (cy(TARGET) - cy(ENTRY)) * tk, 8, rgba(GREEN, win), rgba(GREEN, 0.6), 2); cv.restore(); }
    },
    over: () => {
      // the quiz: a fork of two arrows from the last candle
      if (ph === 0) { const x = cx(I_BREAK - 1) + 20, y = cy(CANDLES[I_BREAK - 1].c), k = oCub(k01(t, 0.15, 0.4)); arrowDown(x, y, x + 110, y - 150, GREEN, k, 9); arrowDown(x, y, x + 110, y + 150, RED, k, 9);
        at(x + 60, y, 1, k, () => { cv.beginPath(); cv.arc(0, 0, 34, 0, Math.PI * 2); cv.fillStyle = LIME; cv.fill(); txt('؟', 0, 4, 46, INK); }); }
      // the sellers: numbered red candles, then the drop arrow
      if (sell) { for (let i = 0; i < 5; i++) { const q = pop(t, T(17) + i * 0.12, 0.25); if (q <= 0) continue; const c = CANDLES[I_DROP + i]; at(cx(I_DROP + i) - 34, cy(c.o) - 6, q, 1, () => { cv.beginPath(); cv.arc(0, 0, 17, 0, Math.PI * 2); cv.fillStyle = WHITE; cv.fill(); txt(['۱', '۲', '۳', '۴', '۵'][i], 0, 2, 22, INK); }); }
        arrowDown(cx(I_DROP) + 40, cy(CANDLES[I_DROP].o) - 10, cx(I_FLAG - 1) + 40, cy(CANDLES[I_FLAG - 1].c) + 30, RED, oCub(k01(t, T(26), 0.4)), 8);
        tag('فروشنده‌ها', cx(I_DROP) - 130, cy(CANDLES[I_DROP + 2].c), RED, WHITE, 36, oCub(k01(t, T(14), 0.3))); }
      // the buyers: a magnifier over the small candles, a slow arrow up
      if (buy) { const mk = pop(t, T(32), 0.3), mx = (fx0 + fx1) / 2, my = cy((FLAG.lo + FLAG.hi) / 2);
        at(mx, my, mk, 1, () => { cv.lineWidth = 8; cv.strokeStyle = LIME; cv.beginPath(); cv.arc(0, 0, 120, 0, Math.PI * 2); cv.stroke(); line(85, 85, 150, 150, LIME, 14); });
        tag('کوچیک و بی‌جون', mx, my + 190, GREEN, INK, 36, oCub(k01(t, T(35), 0.3))); tag('خریدارها', mx, my - 170, GREEN, INK, 36, oCub(k01(t, T(29), 0.3)));
        arrowDown(fx0, cy(chLo0) + 40, fx1, cy(chLo1) + 40, LIL, oCub(k01(t, T(37), ws(42) - ws(37))), 6); }
      // the pattern: the pole, the flag's channel and body, the projection down
      if (flagOn && ph < 8) { const pk = oCub(k01(t, T(47), 0.4)), poleGlow = t >= T(50) && t < T(52) ? 1 : 0, flagGlow = t >= T(53) && t < T(55) ? 1 : 0;
        cv.save(); cv.globalAlpha = pk;
        cv.beginPath(); cv.moveTo(fx0, cy(chLo0)); cv.lineTo(fx1, cy(chLo1)); cv.lineTo(fx1, cy(chHi1)); cv.lineTo(fx0, cy(chHi0)); cv.closePath(); cv.fillStyle = rgba(RED, 0.12 + 0.12 * flagGlow); cv.fill();
        line(fx0, cy(chLo0), fx1, cy(chLo1), WHITE, 4); line(fx0, cy(chHi0), fx1, cy(chHi1), WHITE, 4);
        cv.shadowColor = rgba(WHITE, 0.8); cv.shadowBlur = 20 * poleGlow; line(cx(I_DROP) - CW, cy(CANDLES[I_DROP].o), cx(I_DROP) - CW, cy(CANDLES[I_FLAG - 1].c), WHITE, 6 + 4 * poleGlow); cv.restore();
        if (pole) tag('پرچم نزولی', (fx0 + fx1) / 2, cy(chHi1) - 80, RED, WHITE, 40, pk);
        const pj = oCub(k01(t, T(59), 0.5)); if (pj > 0 && ph < 7) { cv.save(); cv.globalAlpha = pj; arrowDown(fx1 + 10, cy(chLo1), fx1 + 120, cy(chLo1 - 14), RED, pj, 6); cv.restore(); } }
      // the plan: the flag's floor, the entry, the boxes' labels
      if (ph >= 6) { const fk = oCub(k01(t, T(69), 0.3)); if (fk > 0) { line(fx0, cy(FLAG.lo), lerp(fx0, CH.x + CH.w - 30, fk), cy(FLAG.lo), LIME, 3, [12, 10]); tag('کف پرچم', fx0 - 90, cy(FLAG.lo), LIME, INK, 32, fk); }
        if (t >= T(73)) tag('فروش', cx(I_BREAK) + 80, cy(ENTRY), RED, WHITE, 32, pop(t, T(73), 0.3) > 0 ? 1 : 0);
        if (t >= T(75)) tag('حد ضرر', CH.x + CH.w - 110, (cy(STOP) + cy(ENTRY)) / 2, 'rgba(0,0,0,0.5)', '#FFB3BB', 30, oCub(k01(t, T(75), 0.3)));
        if (t >= T(79)) { tag('حد سود', CH.x + CH.w - 110, cy(TARGET) - 40, 'rgba(0,0,0,0.5)', '#B5F5D0', 30, oCub(k01(t, T(79), 0.3))); tag('۱ به ۳', CH.x + CH.w - 110, cy(TARGET) + 30, LIME, INK, 34, oCub(k01(t, T(80), 0.3))); } }
    } });
  // the quiz: two big buttons and the countdown
  if (ph <= 1) { const k = ph === 0 ? 1 : 1 - oCub(k01(t, T(9), 0.3)), pulse = 1 + 0.04 * Math.sin(t * 7);
    at(CX + 230, 1580, pulse, k, () => { shadowed(() => rrect(-200, -78, 400, 156, 40, GREEN)); txt('خرید', 30, 6, 64, WHITE); arrowDown(-120, 30, -120, -36, WHITE, 1, 10); });
    at(CX - 230, 1580, pulse, k, () => { shadowed(() => rrect(-200, -78, 400, 156, 40, RED)); txt('فروش', 30, 6, 64, WHITE); arrowDown(-120, -36, -120, 30, WHITE, 1, 10); });
    const c0 = we(8) + 0.05, c1 = ws(9) - 0.05; if (t >= c0 - 0.2 && t < c1 + 0.5) { const f = cl((t - c0) / (c1 - c0)), n = Math.max(1, 5 - Math.floor(f * 5)), out = t > c1;
      at(CX, CH.y + CH.h / 2, out ? lerp(1, 1.4, k01(t, c1, 0.3)) : pop(t, c0 - 0.2, 0.3), out ? 1 - k01(t, c1, 0.4) : 1, () => { shadowed(() => { cv.beginPath(); cv.arc(0, 0, 150, 0, Math.PI * 2); cv.fillStyle = 'rgba(11,12,16,0.85)'; cv.fill(); });
        cv.lineWidth = 16; cv.strokeStyle = 'rgba(255,255,255,0.12)'; cv.beginPath(); cv.arc(0, 0, 128, 0, Math.PI * 2); cv.stroke(); cv.strokeStyle = LIME; cv.lineCap = 'round'; cv.beginPath(); cv.arc(0, 0, 128, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); cv.stroke();
        txt(['۱', '۲', '۳', '۴', '۵'][n - 1], 0, 10, 150, WHITE); txt('ثانیه', 0, 92, 30, 'rgba(255,255,255,0.6)', { w: 700 }); }); } }
  // the result
  if (hit(t) && t < T(92) + 0.3) { const q = pop(t, ws(91) - 0.1, 0.35); at(CX, CH.y + 150, q, 1 - k01(t, T(92), 0.3), () => { shadowed(() => rrect(-170, -70, 340, 140, 40, GREEN)); txt('+۳R', 0, 8, 86, WHITE, { dir: 'ltr' }); });
    at(CX, CH.y + 245, 1, oCub(k01(t, ws(91), 0.3)) * (1 - k01(t, T(92), 0.3)), () => chip('مثال', 0, 0, 28, LIME, INK)); }
  if (ph >= 8 && ph < 9) at(CH.x + 120, CH.y + CH.h + 50, 1, oCub(k01(t, T(85), 0.3)), () => chip('مثال، نمودار نمونه', 0, 0, 26, 'rgba(255,255,255,0.12)', WHITE));
}
// «ولی یه معامله هیچی رو ثابت نمی‌کنه» → «این الگو توی ۱۰۰ تا موقعیت چقدر جواب می‌ده؟»: the trade shrinks into one tile of a hundred
function gridScene(t) {
  const g0 = T(94), k = oCub(k01(t, g0, 0.6)), step = 84, x0 = CX + step * 4.5, y0 = 640;
  if (k < 1) { cv.save(); const s = lerp(1, 72 / CH.w, k), tx = lerp(0, x0 - (CH.x + CH.w / 2) * s, k), ty = lerp(0, y0 - (CH.y + CH.h / 2) * s, k); cv.translate(tx, ty); cv.scale(s, s); chartScene(Math.min(t, T(92) - 0.01)); cv.restore(); }
  for (let i = 0; i < 100; i++) { const x = x0 - (i % 10) * step, y = y0 + Math.floor(i / 10) * step;
    if (i === 0) { if (k >= 1) at(x, y, 1, 1, () => { rrect(-36, -36, 72, 72, 16, GREEN); txt('✓', 0, 4, 40, WHITE, { dir: 'ltr' }); }); continue; }
    const q = pop(t, T(106) + i * 0.012, 0.25); if (q <= 0) continue; at(x, y, q, 1, () => { rrect(-36, -36, 72, 72, 16, '#1E1F2A', 'rgba(255,255,255,0.08)', 2); txt('؟', 0, 4, 38, 'rgba(255,255,255,0.45)'); }); }
  if (t >= T(109)) at(CX, y0 + step * 10 + 30, 1, oCub(k01(t, T(109), 0.3)), () => txt('یه معامله دیدی؛ ۹۹ تای دیگه چی؟', 0, 0, 40, 'rgba(255,255,255,0.8)', { w: 700 }));
}
// the close: the real BacktestLab replay
const SCR = [20, 140, 1540, 1000];
function labScene(t) {
  const k = pop(t, T(112), 0.35), w = 960, h = (w * SCR[3]) / SCR[2], y = 620; if (k <= 0) return;
  const keys = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), f = cl((t - ws(116)) / (we(127) - ws(116))), key = keys[Math.min(15, Math.floor(f * 16))];
  at(CX, y + h / 2, lerp(0.9, 1, cl(k)), cl(k * 2), () => { const ox = -w / 2, oy = -h / 2; shadowed(() => rrect(ox - 14, oy - 64, w + 28, h + 78, 30, '#1B1C24'), 60, 24, 0.5); [RED, AMB, GREEN].forEach((c, i) => { cv.beginPath(); cv.arc(ox + w - 22 - i * 34, oy - 32, 10, 0, Math.PI * 2); cv.fillStyle = c; cv.fill(); });
    const im = IMG[key]; if (im) { cv.save(); cv.beginPath(); cv.roundRect(ox, oy, w, h, 16); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, ox, oy, w, h); cv.restore(); }
    const r = pop(t, T(124), 0.3); at(ox + 150, oy + 40, cl(r, 0, 1.15), cl(r * 2), () => { shadowed(() => rrect(-150, -42, 300, 84, 42, LIME), 20, 8, 0.4); cv.fillStyle = INK; [0, 1].forEach((j) => { cv.beginPath(); cv.moveTo(-96 + j * 30, 0); cv.lineTo(-66 + j * 30, -20); cv.lineTo(-66 + j * 30, 20); cv.closePath(); cv.fill(); }); txt('گذشته', 34, 3, 44, INK, { w: 800 }); });
    if (t >= T(125)) { const c = oCub(k01(t, T(125), 0.4)); cv.save(); cv.globalAlpha = c; const g = cv.createLinearGradient(ox + w * 0.62, 0, ox + w * 0.92, 0); g.addColorStop(0, 'rgba(17,18,26,0)'); g.addColorStop(0.3, 'rgba(17,18,26,0.96)'); cv.fillStyle = g; cv.fillRect(ox + w * 0.62, oy, w * 0.3, h * 0.88); txt('آینده', ox + w * 0.82, 0, 44, LIL, { w: 800 }); cv.restore(); } });
  at(CX, y + h + 60, 1, cl(k * 2), () => txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', 0, 0, 34, WHITE, { w: 600, alpha: 0.75 }));
}
function freeScene(t) {
  const k = pop(t, T(128), 0.32); if (IMG.icon) at(CX, 330, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 50; cv.drawImage(IMG.icon, -110, -110, 220, 220); });
  const p = pop(t, T(130), 0.3); at(CX, 1080, cl(p, 0, 1.12), cl(p * 2), () => { shadowed(() => rrect(-320, -80, 640, 160, 80, WHITE)); txt('لینکش توی بیو', 0, 6, 70, VIO); });
  if (t > T(130)) { const b = Math.abs(Math.sin((t - T(130)) * 6)) * 24; at(CX, 930 - b, 1, cl((t - T(130)) * 4), () => { cv.fillStyle = WHITE; cv.beginPath(); cv.moveTo(0, -56); cv.lineTo(44, 0); cv.lineTo(15, 0); cv.lineTo(15, 46); cv.lineTo(-15, 46); cv.lineTo(-15, 0); cv.lineTo(-44, 0); cv.closePath(); cv.fill(); }); }
}
function endScene(t) {
  const k = pop(t, END, 0.35); if (IMG.icon) at(CX, 760, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 60; cv.drawImage(IMG.icon, -130, -130, 260, 260); });
  if (IMG.word) { const q = oCub(k01(t, END + 0.15, 0.35)), ww = 520, hh = (ww * IMG.word.height) / IMG.word.width; at(CX, 1000 + (1 - q) * 30, 1, q, () => cv.drawImage(IMG.word, -ww / 2, -hh / 2, ww, hh)); }
  const f = pop(t, END + 0.4, 0.3); at(CX, 1180, cl(f, 0, 1.1), cl(f * 2), () => chip('این استراتژی رو امتحان کن', 0, 0, 52, LIME, INK));
  const l = oCub(k01(t, END + 0.7, 0.3)); at(CX, 1320, 1, l, () => txt('شروعش رایگانه؛ لینک توی بیو', 0, 0, 46, WHITE, { w: 700, alpha: 0.85 }));
}

// ---------- frame ----------
let GRAIN = null;
function grainTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256); for (let i = 0; i < 256 * 256; i++) { const v = (rnd(i * 1.7) * 255) | 0; im.data.set([v, v, v, 22], i * 4); } g.putImageData(im, 0, 0); return c; }
function frame(t) {
  cv.fillStyle = INK; cv.fillRect(0, 0, W, H); const glow = cv.createRadialGradient(CX, 380, 40, CX, 380, 900); glow.addColorStop(0, 'rgba(108,71,255,0.22)'); glow.addColorStop(1, 'rgba(108,71,255,0)'); cv.fillStyle = glow; cv.fillRect(0, 0, W, H);
  const ph = phaseAt(t);
  if (t >= END) endScene(t);
  else if (ph === 13) freeScene(t);
  else if (ph >= 11) labScene(t);
  else if (ph >= 9) gridScene(t);
  else chartScene(t);
  // the headline: the current phase's lines (the previous fades out)
  if (t < END) { const p = PH[ph], fade = ph < PH.length - 1 ? 1 - k01(t, ws(PH[ph + 1].w) - 0.2, 0.1) : 1; cv.save(); cv.globalAlpha = fade; p.lines.forEach((ln) => drawLine(ln, t)); cv.restore(); }
  if (GRAIN) { cv.save(); cv.globalCompositeOperation = 'overlay'; const ox = (rnd(Math.floor(t * 30)) * 256) | 0, oy = (rnd(Math.floor(t * 30) + 7) * 256) | 0; cv.translate(-ox, -oy); cv.fillStyle = cv.createPattern(GRAIN, 'repeat'); cv.fillRect(0, 0, W + 256, H + 256); cv.restore(); }
  const v = cv.createRadialGradient(CX, H / 2, H * 0.3, CX, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
  const pk = cl(t / END); cv.fillStyle = 'rgba(255,255,255,0.1)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = LIME; cv.fillRect(W * (1 - pk), 0, W * pk, 8);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(2) + 0.4); cv.fillStyle = INK; cv.fillRect(0, 0, W, 8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  GRAIN = grainTex(); frame(0); window.ready = true;
});
