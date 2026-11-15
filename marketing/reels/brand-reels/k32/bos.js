// k32: «قیمت سقف رو شکست… ولی این BOS نیست», the user's take at its normal speed, as a clean explainer in k31's style
// (numbered sections, right-aligned two-tone headlines rising word by word, one visual and a small footnote per section,
// light, dark and violet panels that slide up as cards). The script is BacktestLab's own, written fresh on the idea of
// a valid BOS (no other creator's wording or visuals); every candle set is drawn by hand so each rule shows exactly:
//   ۰۱ a break that isn't a BOS → ۰۲ dark: the trap, a "protected" low with the stop under it, and the drop →
//   ۰۳ the real question, was that high a high? → ۰۴ violet: the rule in three steps → ۰۵ step by step on a valid BOS
//   (the high candle, a close below its low, the pullback, the real high, the close above it) → ۰۶ dark: only a wick
//   dips below, so the break isn't a BOS, just the same leg up → ۰۷ the downtrend, mirrored → ۰۸ violet: don't take
//   my word for it, test it → ۰۹ dark: the real gold replay (k13's screens), a break marked before seeing what came next
//   → ۱۰ the marks, each answer still «؟» → ۱۱ violet: the close and the end card.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], END = D.end, DUR = D.dur;
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - cl(k)) ** 3, io = (k) => { k = cl(k); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; }, oBack = (k) => { const c = 1.6; k = cl(k); return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fa = (n) => Math.round(n).toLocaleString('fa-IR', { useGrouping: false });
const T = (i) => ws(i) - 0.07, IMG = {};
const font = (s, w = 800) => `${w} ${s}px Vazirmatn`;
function txt(s, x, y, size, col, o = {}) { cv.save(); cv.font = font(size, o.w ?? 800); cv.direction = o.dir ?? 'rtl'; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.globalAlpha *= o.alpha ?? 1; cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 800) { cv.font = font(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 2) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2)); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, Math.max(0, r), 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function line(x1, y1, x2, y2, col, lw, dash) { cv.save(); cv.beginPath(); if (dash) cv.setLineDash(dash); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.stroke(); cv.restore(); }
function path(pts, col, lw, dash) { if (pts.length < 2) return; cv.save(); cv.beginPath(); if (dash) cv.setLineDash(dash); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineJoin = cv.lineCap = 'round'; cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn) { if (a <= 0 || s <= 0) return; cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function appear(k, fn, dy = 70) { if (k <= 0) return; cv.save(); cv.globalAlpha *= cl(k); cv.translate(0, (1 - k) * dy); fn(); cv.restore(); }
function check(x, y, s, col, lw = 6) { path([[x - s, y], [x - s * 0.3, y + s * 0.7], [x + s, y - s * 0.7]], col, lw); }
function eye(x, y, s, col, slash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.14; cv.beginPath(); cv.moveTo(x - s, y); cv.quadraticCurveTo(x, y - s * 0.95, x + s, y); cv.quadraticCurveTo(x, y + s * 0.95, x - s, y); cv.stroke(); cv.restore(); circle(x, y, s * 0.32, col); if (slash) line(x - s * 0.9, y + s * 0.8, x + s * 0.9, y - s * 0.8, col, s * 0.14); }
function cursor(x, y, press = 0) { cv.save(); cv.translate(x, y); cv.scale(1.35 * (1 - press * 0.15), 1.35 * (1 - press * 0.15)); cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(0, 34); cv.lineTo(9, 26); cv.lineTo(16, 41); cv.lineTo(22, 38); cv.lineTo(15, 24); cv.lineTo(26, 24); cv.closePath(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 10; cv.shadowOffsetY = 4; cv.fillStyle = '#FFFFFF'; cv.fill(); cv.shadowColor = 'transparent'; cv.strokeStyle = '#17131F'; cv.lineWidth = 2.2; cv.lineJoin = 'round'; cv.stroke(); cv.restore(); }

// ---------- the three panels ----------
const PAL = {
  light: { bg: '#EDECE8', card: '#FFFFFF', ink: '#17131F', acc: '#6A46FF', mute: '#7A7684', line: 'rgba(23,19,31,0.10)', chip: 'rgba(23,19,31,0.06)', track: 'rgba(23,19,31,0.08)', green: '#12A15E', red: '#E5484D', pill: '#FFFFFF' },
  dark: { bg: '#110F18', card: '#1B1825', ink: '#F4F2FA', acc: '#A58BFF', mute: '#8E89A0', line: 'rgba(255,255,255,0.10)', chip: 'rgba(255,255,255,0.08)', track: 'rgba(255,255,255,0.10)', green: '#2FD67B', red: '#FF5A6A', pill: '#FFFFFF' },
  violet: { bg: '#6A46FF', card: '#FFFFFF', ink: '#FFFFFF', acc: '#1B1040', mute: 'rgba(255,255,255,0.75)', line: 'rgba(255,255,255,0.25)', chip: 'rgba(255,255,255,0.18)', track: 'rgba(255,255,255,0.25)', green: '#D7FF6B', red: '#FFB4B8', pill: '#FFFFFF' },
};
PAL.light.theme = 'light'; PAL.dark.theme = 'dark'; PAL.violet.theme = 'violet';
function background(P) { if (P.theme === 'violet') { const g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7B5BFF'); g.addColorStop(1, '#5430E6'); cv.fillStyle = g; } else cv.fillStyle = P.bg; cv.fillRect(0, 0, W, H);
  if (P.theme === 'dark') { const g = cv.createRadialGradient(CX, 260, 50, CX, 260, 1100); g.addColorStop(0, 'rgba(106,70,255,0.16)'); g.addColorStop(1, 'rgba(106,70,255,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H); } }
function card(x, y, w, h, P, r = 36) { cv.save(); if (P.theme !== 'dark') { cv.shadowColor = 'rgba(23,19,31,0.10)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; } rr(x, y, w, h, r, P.card); cv.restore(); if (P.theme === 'dark') rr(x, y, w, h, r, null, 'rgba(255,255,255,0.08)', 2); }
function chip(s, x, y, P, o = {}) { const size = o.size ?? 26, w = measure(s, size, 700) + size * 1.4, hh = size * 1.8; rr(x - w / 2, y - hh / 2, w, hh, hh / 2, o.fill ?? P.chip); txt(s, x, y + 1, size, o.col ?? P.mute, { w: 700 }); return w; }

// ---------- the drawn sample candles (hand-built so each rule shows exactly) ----------
const K_ = (a) => a.map(([o, c, h, l]) => ({ o, c, h, l }));
const RISE = [[20, 24, 25, 19], [24, 23, 25.5, 22], [23, 28, 29, 22.5], [28, 27, 29, 26], [27, 32, 33, 26.5], [32, 31, 33.5, 30], [31, 36, 38, 30.5]];   // index 6 is the high candle: high 38, low 30.5
const UPV = K_([...RISE, [36, 33, 36.5, 32], [33, 29, 33.5, 28], [29, 30, 31, 27.5], [30, 34, 35, 29.5], [34, 33, 35, 32], [33, 37, 37.6, 32.5], [37, 41, 42, 36.5], [41, 40, 42.5, 39], [40, 44, 45, 39.5]]);   // valid: 8 closes below 30.5, 13 closes above 38
const UPX = K_([...RISE, [36, 34, 36.5, 31.8], [34, 32, 34.5, 29.0], [32, 33, 33.8, 31.5], [33, 37, 37.8, 32.5], [37, 40, 41, 36.5], [40, 43, 44, 39.5], [43, 42, 44.5, 41]]);   // invalid: 8 only wicks below 30.5, 11 breaks 38
const TRAP = [...UPX, ...K_([[42, 37, 42.5, 36.5], [37, 32, 37.5, 31], [32, 27, 32.5, 26]])];   // the same, then the drop through the "protected" low
const DNV = UPV.map((d) => ({ o: 64 - d.o, c: 64 - d.c, h: 64 - d.l, l: 64 - d.h }));   // the valid case, mirrored: 6 is the low candle (high 33.5), 8 closes above it
const NS = 17, CB = { x: 150, y: 820, w: 780, h: 550 };
function mkChart(S, B = CB) { const lo = Math.min(...S.map((d) => d.l)) - 2.5, hi = Math.max(...S.map((d) => d.h)) + 2.5; return { X: (i) => B.x + ((i + 0.5) * B.w) / NS, Y: (v) => B.y + B.h - ((v - lo) / (hi - lo)) * B.h, bw: (B.w / NS) * 0.6 }; }
function gridLines(P, B = CB) { for (let k = 0; k <= 4; k++) line(B.x, B.y + (B.h * k) / 4, B.x + B.w, B.y + (B.h * k) / 4, P.line, 2); }
function candle(G, i, d, k, P, a = 1) { if (k <= 0) return; const x = G.X(i), up = d.c >= d.o, col = up ? P.green : P.red, q = oCub(k); cv.save(); cv.globalAlpha *= a * cl(k * 3);
  line(x, lerp(G.Y(d.o), G.Y(d.h), q), x, lerp(G.Y(d.o), G.Y(d.l), q), col, 3); const yo = G.Y(d.o), yc = lerp(yo, G.Y(d.c), q); rr(x - G.bw / 2, Math.min(yo, yc), G.bw, Math.max(5, Math.abs(yc - yo)), 4, col); cv.restore(); }
function drawSet(G, S, t, times, P, dim) { S.forEach((d, i) => { if (times[i] != null) candle(G, i, d, k01(t, times[i], 0.3), P, dim && dim(i) ? 0.3 : 1); }); }
const seqT = (a, b, n) => Array.from({ length: n }, (_, i) => (n < 2 ? a : a + ((b - a) * i) / (n - 1)));
function level(G, v, i0, i1, col, k, dash = true, lw = 3) { if (k <= 0) return; const x0 = G.X(i0) - G.bw, x1 = lerp(x0, G.X(i1) + G.bw, oCub(k)); line(x0, G.Y(v), x1, G.Y(v), col, lw, dash ? [12, 10] : null); }
function boxAt(G, i, d, col, k) { if (k <= 0) return; const x = G.X(i), y0 = G.Y(d.h) - 16, y1 = G.Y(d.l) + 16, w = G.bw + 28, s = lerp(1.3, 1, oCub(k)); cv.save(); cv.globalAlpha *= cl(k * 2); cv.translate(x, (y0 + y1) / 2); cv.scale(s, s); rr(-w / 2, -(y1 - y0) / 2, w, y1 - y0, 14, null, col, 4); cv.restore(); }
function pill(s, x, y, fill, col, size = 30, mark) { const w = measure(s, size, 800) + size * 1.5 + (mark ? size * 1.1 : 0), h = size * 1.9; rr(x - w / 2, y - h / 2, w, h, h / 2, fill); txt(s, mark ? x - size * 0.5 : x, y + 2, size, col, { w: 800 });
  if (mark) { const mx = x + w / 2 - size * 0.95, r = size * 0.27; if (mark === 'ok') check(mx, y, r * 1.1, col, size * 0.14); else { line(mx - r, y - r, mx + r, y + r, col, size * 0.14); line(mx - r, y + r, mx + r, y - r, col, size * 0.14); } } }
const popIn = (t, t0, fn, x, y) => { const k = oBack(k01(t, t0, 0.4)); if (k > 0) at(x, y, k, cl(k * 2), fn); };
function stamp(s, x, y, col, k, size = 74) { if (k <= 0) return; at(x, y, lerp(1.7, 1, oCub(k)), cl(k * 2.5), () => { cv.rotate(-0.1); const w = measure(s, size, 900) + 64; rr(-w / 2, -size * 0.78, w, size * 1.56, 20, 'rgba(255,255,255,0.0)', col, 7); txt(s, 0, 5, size, col, { w: 900 }); }); }
function arrow(x1, y1, x2, y2, col, k, lw = 5, dash) { if (k <= 0) return; const q = oCub(k), x = lerp(x1, x2, q), y = lerp(y1, y2, q); line(x1, y1, x, y, col, lw, dash); if (q > 0.85) { const a = Math.atan2(y2 - y1, x2 - x1), s = 20; path([[x - Math.cos(a - 0.5) * s, y - Math.sin(a - 0.5) * s], [x, y], [x - Math.cos(a + 0.5) * s, y - Math.sin(a + 0.5) * s]], col, lw); } }
function chartCard(P, side) { card(100, 690, 880, 810, P); txt('نمودار نمونه', 930, 752, 32, P.ink, { align: 'right', w: 700 }); if (side) chip(side, 230, 752, P, { size: 26 }); gridLines(P); }

// ---------- ۰۱ a break that isn't a BOS ----------
function hook(t, P) { chartCard(P, 'روند صعودی'); const G = mkChart(UPX), times = UPX.map((_, i) => (i <= 6 ? -1 : i <= 10 ? 0.2 + (i - 7) * 0.28 : i === 11 ? T(3) : null));
  level(G, 38, 6, 13, P.ink, 1); chip('سقف', 860, G.Y(38) - 36, P, { size: 26 }); drawSet(G, UPX, t, times, P);
  boxAt(G, 11, UPX[11], P.acc, k01(t, T(3), 0.3)); popIn(t, T(3) + 0.15, () => pill('شکست!', 0, 0, P.acc, '#FFFFFF', 30), G.X(11), G.Y(41) - 62);
  stamp('BOS نیست', 400, 870, P.red, k01(t, T(9) - 0.05, 0.4)); }
// ---------- ۰۲ the trap: a "protected" low, a stop under it, and the drop ----------
function trap(t, P) { appear(oCub(k01(t, T(10) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(TRAP), times = TRAP.map((_, i) => (i <= 13 ? T(10) + 0.15 + i * 0.03 : [T(31), T(32), T(33)][i - 14]));
  level(G, 38, 6, 13, P.mute, 1); level(G, 29, 8, 16, P.green, k01(t, T(22), 0.5)); level(G, 28, 8, 16, P.red, k01(t, T(26) + 0.1, 0.5));
  drawSet(G, TRAP, t, times, P); boxAt(G, 11, TRAP[11], P.acc, k01(t, T(14), 0.3)); popIn(t, T(14) + 0.1, () => pill('BOS؟', 0, 0, P.acc, '#FFFFFF', 30), G.X(11), G.Y(41) - 62);
  popIn(t, T(23), () => pill('کف محافظت‌شده؟', 0, 0, 'rgba(47,214,123,0.16)', P.green, 30), G.X(13), G.Y(29) - 38); popIn(t, T(26) + 0.2, () => pill('استاپ', 0, 0, P.red, '#FFFFFF', 30), G.X(10), G.Y(28) + 40);
  const hit = k01(t, T(33) + 0.25, 0.5); if (hit > 0) { cv.save(); cv.globalAlpha *= 0.18 * (1 - hit); rr(100, 690, 880, 810, 36, P.red); cv.restore(); } popIn(t, T(33) + 0.25, () => pill('استاپ خورد', 0, 0, P.red, '#FFFFFF', 30, 'no'), G.X(13) - 40, G.Y(26) + 70); }); }
// ---------- ۰۳ the real question: was that high a high? ----------
function question(t, P) { appear(oCub(k01(t, T(34) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(UPX), times = UPX.map((_, i) => (i <= 11 ? T(34) + 0.15 + i * 0.025 : null));
  level(G, 38, 6, 13, P.ink, 1); drawSet(G, UPX, t, times, P); const dimS = k01(t, T(37) + 0.05, 0.3);
  popIn(t, T(36), () => { cv.globalAlpha *= 1 - 0.55 * dimS; pill('شکست', 0, 0, P.chip, P.ink, 28); if (dimS > 0) line(-70 * dimS, 0, 70 * dimS, 0, P.red, 5); }, G.X(11), G.Y(41) - 62);
  const m = oCub(k01(t, T(40), 0.5)); if (m > 0) { const cx = G.X(6), cy = G.Y(34.2), r = 104; cv.save(); cv.globalAlpha *= m; cv.beginPath(); cv.arc(cx, cy, r * lerp(1.5, 1, m), 0, Math.PI * 2); cv.fillStyle = 'rgba(106,70,255,0.06)'; cv.fill(); cv.strokeStyle = P.acc; cv.lineWidth = 7; cv.stroke(); line(cx - r * 0.72, cy + r * 0.72, cx - r * 1.3, cy + r * 1.3, P.acc, 14); cv.restore(); }
  popIn(t, T(41), () => pill('سقف', 0, 0, P.acc, '#FFFFFF', 30), G.X(6), G.Y(34.2) - 150);
  const q = oBack(k01(t, T(49), 0.45)); if (q > 0) at(290, 900, q, cl(q * 2), () => txt('؟', 0, 0, 150, P.acc, { w: 900 })); popIn(t, T(50), () => pill('سقف بود؟', 0, 0, P.acc, '#FFFFFF', 30), 290, 1010); }); }
// ---------- ۰۴ a simple rule (violet): the three steps ----------
const STEPS = ['کندلِ سقف رو پیدا کن', 'یه کندل زیر کفش بسته بشه', 'قیمت بالای سقف بسته بشه'];
function rule(t, P) { const L_ = PAL.light; appear(oCub(k01(t, T(52) + 0.05, 0.5)), () => { card(100, 700, 880, 760, L_); txt('قانون BOS معتبر', 930, 785, 40, L_.ink, { align: 'right', w: 800 });
  pill('روند صعودی', 250, 785, 'rgba(18,161,94,0.12)', L_.green, 26); arrow(170, 805, 170, 765, L_.green, 1, 4);
  STEPS.forEach((s, i) => { const k = oCub(k01(t, T(52) + 0.4 + i * 0.5, 0.45)), y = 930 + i * 160; if (k <= 0) return; cv.save(); cv.globalAlpha *= k; cv.translate(-(1 - k) * 60, 0); rr(150, y - 62, 780, 124, 28, 'rgba(106,70,255,0.06)');
    circle(870, y, 38, '#6A46FF'); txt(fa(i + 1), 870, y + 3, 40, '#FFFFFF', { w: 800 }); txt(s, 810, y + 2, 38, L_.ink, { align: 'right', w: 700 }); cv.restore(); }); }); }
// ---------- ۰۵ the rule, step by step, on a valid BOS ----------
function valid(t, P) { appear(oCub(k01(t, T(58) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(UPV), H_ = UPV[6];
  const times = UPV.map((_, i) => (i <= 6 ? T(58) + 0.15 + i * 0.06 : i === 7 ? T(69) : i === 8 ? T(74) : i <= 12 ? seqT(T(89), T(93), 4)[i - 9] : i === 13 ? T(95) : i === 14 ? T(100) : T(101)));
  level(G, 30.5, 6, 15, P.acc, k01(t, T(71), 0.5)); const real = k01(t, T(85), 0.5); level(G, 38, 6, 15, P.acc, real, false, 4);
  drawSet(G, UPV, t, times, P); boxAt(G, 6, H_, P.acc, k01(t, T(60), 0.35)); const fadeC = 1 - k01(t, T(85), 0.3);
  popIn(t, T(60) + 0.15, () => { cv.globalAlpha *= fadeC; pill('کندل سقف', 0, 0, P.acc, '#FFFFFF', 28); }, G.X(6), G.Y(38) - 52);
  popIn(t, T(72), () => chip('کف کندل سقف', 0, 0, P, { size: 28, fill: 'rgba(106,70,255,0.10)', col: P.acc }), 860, G.Y(30.5) + 36);
  popIn(t, T(75), () => pill('زیرش بسته شد', 0, 0, P.green, '#FFFFFF', 30, 'ok'), G.X(8), G.Y(28) + 58);
  popIn(t, T(81), () => pill('پولبک', 0, 0, 'rgba(18,161,94,0.12)', P.green, 30, 'ok'), 640, 960);
  popIn(t, T(87), () => pill('سقف واقعی', 0, 0, P.acc, '#FFFFFF', 28), 270, G.Y(38));
  boxAt(G, 13, UPV[13], P.green, k01(t, T(95), 0.35)); popIn(t, T(99), () => pill('BOS معتبر', 0, 0, P.green, '#FFFFFF', 32, 'ok'), 690, 846); }); }
// ---------- ۰۶ dark: only a wick dips below, so the break isn't a BOS ----------
function invalid(t, P) { appear(oCub(k01(t, T(103) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(UPX);
  const times = UPX.map((_, i) => (i <= 6 ? T(103) + 0.15 + i * 0.04 : i <= 9 ? [T(105), T(106), T(107)][i - 7] : i <= 11 ? [T(111), T(112)][i - 10] : [T(116), T(117)][i - 12]));
  level(G, 30.5, 6, 13, P.acc, k01(t, T(103) + 0.4, 0.5)); level(G, 38, 6, 13, P.mute, k01(t, T(111), 0.5)); drawSet(G, UPX, t, times, P); boxAt(G, 6, UPX[6], P.acc, k01(t, T(103) + 0.3, 0.35));
  const wk = oCub(k01(t, T(108), 0.35)); if (wk > 0) { cv.save(); cv.globalAlpha *= wk; cv.beginPath(); cv.arc(G.X(8), G.Y(29.0) + 4, 26, 0, Math.PI * 2); cv.strokeStyle = P.acc; cv.lineWidth = 4; cv.stroke(); cv.restore(); }
  popIn(t, T(108) + 0.1, () => chip('فقط سایه', 0, 0, P, { size: 28 }), G.X(8), G.Y(29) + 64); popIn(t, T(110), () => pill('زیرش بسته نشد', 0, 0, P.red, '#FFFFFF', 30, 'no'), 720, 1260);
  boxAt(G, 11, UPX[11], P.mute, k01(t, T(112), 0.35)); stamp('BOS نیست', 390, 880, P.red, k01(t, T(114) - 0.05, 0.4));
  arrow(G.X(10), G.Y(35), G.X(13) + 10, G.Y(46), P.green, k01(t, T(118), 0.5), 5, [10, 8]); popIn(t, T(119), () => pill('ادامه‌ی موج صعودی', 0, 0, 'rgba(47,214,123,0.16)', P.green, 30), 700, 792); }); }
// ---------- ۰۷ the downtrend: the same rule, mirrored ----------
function down(t, P) { appear(oCub(k01(t, T(121) + 0.05, 0.5)), () => { chartCard(P, 'روند نزولی'); const G = mkChart(DNV), L6 = DNV[6];
  const times = DNV.map((_, i) => (i <= 6 ? T(121) + 0.15 + i * 0.06 : i === 7 ? T(132) : i === 8 ? T(134) : null));
  level(G, 33.5, 6, 15, P.acc, k01(t, T(135), 0.5)); drawSet(G, DNV, t, times, P); boxAt(G, 6, L6, P.acc, k01(t, T(130), 0.35));
  popIn(t, T(130) + 0.15, () => pill('کندل کف', 0, 0, P.acc, '#FFFFFF', 28), G.X(6), G.Y(26) + 54); popIn(t, T(136), () => chip('سقف کندل کف', 0, 0, P, { size: 28, fill: 'rgba(106,70,255,0.10)', col: P.acc }), 860, G.Y(33.5) - 36);
  popIn(t, T(139), () => pill('بالاش بسته شد', 0, 0, P.green, '#FFFFFF', 30, 'ok'), G.X(8), G.Y(36) - 54);
  arrow(G.X(9), G.Y(31), G.X(12), G.Y(22), P.red, k01(t, T(140) + 0.1, 0.4), 5, [10, 8]); popIn(t, T(140) + 0.25, () => pill('بعدش: شکست کف یعنی BOS', 0, 0, 'rgba(229,72,77,0.10)', P.red, 28), 690, 1300); }); }
// ---------- ۰۸ violet: don't take my word for it, test it ----------
function testIt(t, P) { appear(oCub(k01(t, T(141) + 0.05, 0.5)), () => { const rows = [['حرف من', T(142)], ['قانون', T(147)], ['تست روی گذشته', T(149)]], strike = k01(t, T(145), 0.3);
  rows.forEach(([s, t0], i) => { const y = 860 + i * 230, k = oBack(k01(t, t0, 0.4)); if (k <= 0) return; at(CX, y, k, cl(k * 2), () => { const last = i === 2; cv.globalAlpha *= i === 0 ? 1 - 0.5 * strike : 1;
    rr(-300, -78, 600, 156, 78, last ? '#1B1040' : '#FFFFFF'); txt(s, 0, 4, 56, last ? '#FFFFFF' : '#5430E6', { w: 900 }); if (i === 0 && strike > 0) line(-230 * strike, 0, 230 * strike, 0, '#E5484D', 8); if (last) check(220, 0, 16, '#D7FF6B', 7); });
    if (i > 0) arrow(CX, y - 205, CX, y - 92, 'rgba(255,255,255,0.8)', k01(t, t0 - 0.1, 0.3), 5); }); }); }
// ---------- ۰۹ dark: the real replay, a break marked before seeing what came next ----------
const SCR = [20, 140, 1540, 1000], KEYS = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`);
function replay(t, P) { appear(oCub(k01(t, T(151) + 0.05, 0.5)), () => { const x = 60, y = 680, w = 960, sh = (w * SCR[3]) / SCR[2];
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 60; cv.shadowOffsetY = 20; rr(x, y, w, 56 + sh + 64, 28, '#1F1B2B'); cv.restore(); rr(x, y, w, 56 + sh + 64, 28, null, 'rgba(255,255,255,0.10)', 2);
  ['#FF6B6B', '#FFC14D', '#3DDC84'].forEach((c, i) => circle(x + 40 + i * 30, y + 28, 8, c)); rr(CX - 170, y + 12, 340, 34, 17, 'rgba(255,255,255,0.07)'); txt('بک‌تست‌لب، بازپخش', CX, y + 30, 22, P.mute, { w: 600 });
  const f = cl((t - T(160)) / (T(174) - T(160))), im = IMG[KEYS[Math.min(15, Math.floor(f * 16))]], sy = y + 56;
  if (im) { cv.save(); cv.beginPath(); cv.rect(x, sy, w, sh); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, sy, w, sh);
    const bk = k01(t, T(165), 0.5); if (bk > 0) { line(x + 40, sy + sh * 0.36, lerp(x + 40, x + w * 0.6, oCub(bk)), sy + sh * 0.36, '#A58BFF', 4, [12, 9]); popIn(t, T(166), () => pill('شکست؟', 0, 0, '#6A46FF', '#FFFFFF', 30), x + w * 0.5, sy + sh * 0.36 - 40); }
    const cu = oCub(k01(t, T(170), 0.45)); if (cu > 0) { const cx0 = x + w * 0.62; cv.globalAlpha *= cu; const g = cv.createLinearGradient(cx0, 0, cx0 + w * 0.12, 0); g.addColorStop(0, 'rgba(17,15,24,0)'); g.addColorStop(1, 'rgba(17,15,24,0.97)'); cv.fillStyle = g; cv.fillRect(cx0, sy, w * 0.38, sh); eye(x + w * 0.86, sy + sh / 2 - 40, 34, P.acc, true); txt('ادامه‌ش', x + w * 0.86, sy + sh / 2 + 40, 38, P.acc, { w: 800 }); } cv.restore(); }
  popIn(t, T(157), () => pill('۲۵ فروردین ۱۴۰۴', 0, 0, '#6A46FF', '#FFFFFF', 28), x + w - 150, sy + 40);
  const by = sy + sh + 32; cv.save(); cv.beginPath(); cv.moveTo(x + 36, by - 13); cv.lineTo(x + 36, by + 13); cv.lineTo(x + 58, by); cv.closePath(); cv.fillStyle = P.ink; cv.fill(); cv.restore(); rr(x + 84, by - 4, w - 124, 8, 4, P.track); rr(x + 84, by - 4, (w - 124) * f, 8, 4, P.acc); circle(x + 84 + (w - 124) * f, by, 11, P.acc);
  const pulse = (t0) => 1 + 0.07 * Math.sin(Math.PI * k01(t, t0, 0.35));
  popIn(t, T(172), () => { cv.scale(pulse(T(174)), pulse(T(174))); rr(-200, -52, 400, 104, 52, 'rgba(47,214,123,0.14)', P.green, 4); txt('معتبر', 0, 3, 44, P.green, { w: 900 }); }, CX + 230, 1505);
  popIn(t, T(172) + 0.08, () => { cv.scale(pulse(T(176)), pulse(T(176))); rr(-200, -52, 400, 104, 52, 'rgba(255,90,106,0.14)', P.red, 4); txt('نامعتبر', 0, 3, 44, P.red, { w: 900 }); }, CX - 230, 1505); }); }
// ---------- ۱۰ then see which ones worked ----------
const ROWS = [['معتبر', 1], ['نامعتبر', 0], ['معتبر', 1], ['معتبر', 1], ['نامعتبر', 0]];
function results(t, P) { appear(oCub(k01(t, T(177) + 0.05, 0.5)), () => { card(100, 690, 880, 810, P); txt('شکست‌هایی که علامت زدی', 930, 760, 34, P.ink, { align: 'right', w: 700 }); chip('نمونه', 200, 760, P, { size: 26 });
  txt('علامت تو', 600, 850, 28, P.mute, { w: 600 }); txt('جوابش', 260, 850, 28, P.mute, { w: 600 });
  ROWS.forEach(([s, ok], i) => { const y = 940 + i * 108, k = oCub(k01(t, T(177) + 0.2 + i * 0.1, 0.4)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; line(150, y + 54, 930, y + 54, P.line, 2); txt(`شکست ${fa(i + 1)}`, 930, y, 32, P.ink, { align: 'right', w: 700 });
    pill(s, 600, y, ok ? 'rgba(18,161,94,0.12)' : 'rgba(229,72,77,0.10)', ok ? P.green : P.red, 26); const sh = 0.5 + 0.5 * Math.sin(t * 5 - i * 0.7); txt('؟', 260, y, 54, P.acc, { w: 900, alpha: 0.55 + 0.45 * sh }); cv.restore(); }); }); }
// ---------- ۱۱ violet: the close, then the end card ----------
function close_(t, P) { const k = oBack(k01(t, T(184) + 0.05, 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(20,8,60,0.45)'; cv.shadowBlur = 80; cv.shadowOffsetY = 24; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 980 - s / 2, s, s); cv.restore(); }
  const p = oBack(k01(t, T(186), 0.4)); at(CX, 1300, p, 1, () => { rr(-280, -64, 560, 128, 64, '#FFFFFF'); txt('لینک توی بیو', 0, 4, 56, '#5430E6', { w: 900 }); }); }
function endCard(t, P) { const k = oBack(k01(t, END + 0.05, 0.45)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(20,8,60,0.45)'; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 740 - s / 2, s, s); cv.restore(); }
  if (IMG.word) { const q = oCub(k01(t, END + 0.25, 0.4)), ww = 500, hh = (ww * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= q; cv.drawImage(IMG.word, CX - ww / 2, 920, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.5, 0.4)); txt('هر شکستی BOS نیست؛ تستش کن', CX, 1200, 58, '#FFFFFF', { w: 900, alpha: f }); at(CX, 1340, 1, f, () => { rr(-330, -48, 660, 96, 48, '#FFFFFF'); txt('شروعش رایگانه؛ لینک توی بیو', 0, 3, 36, '#5430E6', { w: 800 }); }); }

// ---------- the sections: their panel, number, headline pages (words with their index in the voice) and footnotes ----------
const SC = [
  { t: 0, th: 'light', num: '۰۱', label: 'شکست', draw: hook, foot: [[-1, 'نمودار نمونه، فقط برای توضیح']],
    pages: [{ t: 0, ghost: true, lines: [[['قیمت', 0], ['سقف', 1, 1], ['رو', 2], ['شکست…', 3]], [['ولی', 4], ['این', 5], ['BOS', [6, 7, 8], 1], ['نیست.', 9]]] }] },
  { t: T(10), th: 'dark', num: '۰۲', label: 'تله', draw: trap, foot: [[T(10) + 0.4, 'نمودار نمونه، فقط برای توضیح']],
    pages: [{ t: T(10), lines: [[['اگر', 10], ['هر', 11], ['شکستی', 12], ['رو', 13]], [['BOS', [14, 15, 16], 1], ['حساب', 17], ['کنی،', 18]]] },
      { t: T(19), lines: [[['فکر', 19], ['می‌کنی', 20], ['کفِ', 21], ['پشتش', 22]], [['محافظت‌شده‌ست.', [23, 24, 25], 1]]] },
      { t: T(26), lines: [[['استاپت', 26, 1], ['رو', 27], ['همون‌جا', 28], ['می‌ذاری', 29]], [['و', 30], ['بازار', 31], ['راحت', 32], ['می‌زنتش.', 33, 1]]] }] },
  { t: T(34), th: 'light', num: '۰۳', label: 'سؤال اصلی', draw: question, foot: [[T(34) + 0.4, 'سؤالی که قبل از هر BOS باید بپرسی']],
    pages: [{ t: T(34), lines: [[['مشکل', 34], ['از', 35], ['شکست', 36], ['نیست؛', 37]], [['مشکل', 38], ['از', 39], ['خود', 40], ['سقفه.', 41, 1]]] },
      { t: T(42), size: 88, lines: [[['سؤال', 42], ['اینه:', 43], ['اون', 44], ['سقفی', 45]], [['که', 46], ['شکسته', 47], ['شد،', 48]], [['اصلاً', 49], ['سقف', 50, 1], ['بود؟', 51, 1]]] }] },
  { t: T(52), th: 'violet', num: '۰۴', label: 'قانون', draw: rule, foot: [[T(52) + 0.4, 'یکی از تعریف‌های رایج؛ خودت تستش کن']],
    pages: [{ t: T(52), lines: [[['یه', 52], ['قانون', 53], ['ساده:', 54, 1]], [['توی', 55], ['روند', 56], ['صعودی…', 57, 1]]] }] },
  { t: T(58), th: 'light', num: '۰۵', label: 'سقف واقعی', draw: valid, foot: [[T(58) + 0.4, 'نمودار نمونه، مرحله به مرحله'], [T(95), 'شکست یعنی بسته شدن بالای سقف، نه فقط سایه']],
    pages: [{ t: T(58), lines: [[['کندلی', 58], ['که', 59], ['سقف', 60, 1], ['رو', 61]], [['ساخته', 62], ['پیدا', 63], ['کن.', 64]]] },
      { t: T(65), size: 86, lines: [[['اگر', 65], ['بعد', 66], ['از', 67], ['اون،', 68]], [['یه', 69], ['کندل', 70], ['زیر', 71, 1], ['کفِ', 72, 1]], [['همین', 73], ['کندل', 74], ['بسته', 75], ['شده', 76], ['باشه،', 77]]] },
      { t: T(78), lines: [[['یعنی', 78], ['قیمت', 79], ['واقعاً', 80]], [['پولبک', 81, 1], ['زده', 82]]] },
      { t: T(83), lines: [[['و', 83], ['اون', 84], ['سقف،', 85]], [['یه', 86], ['سقف', 87], ['واقعیه.', 88, 1]]] },
      { t: T(89), lines: [[['حالا', 89], ['اگر', 90], ['قیمت', 91], ['بالای', 92]], [['این', 93], ['سقف', 94], ['بسته', 95, 1], ['بشه،', 96, 1]]] },
      { t: T(97), lines: [[['این', 97], ['یه', 98]], [['BOS', [99, 100, 101], 1], ['معتبره.', 102, 1]]] }] },
  { t: T(103), th: 'dark', num: '۰۶', label: 'BOS نامعتبر', draw: invalid, foot: [[T(103) + 0.4, 'نمودار نمونه؛ سایه زیر کف رفته، ولی بسته شدن نه']],
    pages: [{ t: T(103), lines: [[['ولی', 103], ['اگر', 104], ['هیچ', 105], ['کندلی', 106]], [['زیر', 107, 1], ['کفش', 108, 1], ['بسته', 109], ['نشده،', 110]]] },
      { t: T(111), lines: [[['شکستنش', 111]], [['BOS', [112, 113, 114], 1], ['نیست.', 115, 1]]] },
      { t: T(116), lines: [[['فقط', 116], ['ادامه‌ی', 117], ['همون', 118]], [['موج', 119], ['صعودیه.', 120, 1]]] }] },
  { t: T(121), th: 'light', num: '۰۷', label: 'روند نزولی', draw: down, foot: [[T(121) + 0.4, 'نمودار نمونه؛ همون قانون، برعکس']],
    pages: [{ t: T(121), lines: [[['توی', 121], ['روند', 122], ['نزولی', 123, 1]], [['هم', 124], ['همینه،', 125], ['فقط', 126], ['برعکس.', 127, 1]]] },
      { t: T(128), size: 86, lines: [[['بعد', 128], ['از', 129], ['کندلِ', 130], ['کف،', 131, 1]], [['یه', 132], ['کندل', 133], ['باید', 134], ['بالای', 135, 1]], [['سقفِ', 136, 1], ['همون', 137], ['کندل', 138], ['بسته', 139], ['بشه.', 140]]] }] },
  { t: T(141), th: 'violet', num: '۰۸', label: 'تست', draw: testIt, foot: [[T(141) + 0.4, 'تعریف‌ها فرق دارن؛ تست تصمیم می‌گیره']],
    pages: [{ t: T(141), lines: [[['ولی', 141], ['حرف', 142], ['منو', 143]], [['قبول', 144], ['نکن؛', 145, 1]]] },
      { t: T(146), lines: [[['این', 146], ['قانون', 147], ['رو', 148]], [['تست', 149, 1], ['کن.', 150, 1]]] }] },
  { t: T(151), th: 'dark', num: '۰۹', label: 'بازپخش', draw: replay, foot: [[T(151) + 0.4, 'صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا؛ برچسب‌ها نمایشی‌اند']],
    pages: [{ t: T(151), lines: [[['توی', 151], ['بک‌تست‌لب', [152, 153], 1]], [['برو', 154], ['به', 155], ['یه', 156], ['روز', 157], ['از', 158], ['گذشته،', 159, 1]]] },
      { t: T(160), lines: [[['بازار', 160], ['رو', 161]], [['جلو', 162, 1], ['ببر،', 163, 1]]] },
      { t: T(164), size: 86, lines: [[['و', 164], ['هر', 165], ['شکست', 166, 1], ['رو', 167]], [['قبل', 168], ['از', 169], ['دیدن', 170], ['ادامه‌ش', 171]], [['علامت', 172, 1], ['بزن:', 173, 1]]] },
      { t: T(174), lines: [[['معتبر', 174, 1]], [['یا', 175], ['نامعتبر؟', 176, 1]]] }] },
  { t: T(177), th: 'light', num: '۱۰', label: 'نتیجه', draw: results, foot: [[T(177) + 0.4, 'نمونه؛ جوابش رو فقط بازپخش نشون می‌ده']],
    pages: [{ t: T(177), lines: [[['بعد', 177], ['ببین', 178]], [['کدوم‌ها', [179, 180]], ['واقعاً', 181], ['جواب', 182, 1], ['دادن.', 183, 1]]] }] },
  { t: T(184), th: 'violet', num: '۱۱', label: 'شروع', draw: close_, pages: [{ t: T(184), lines: [[['شروعش', 184]], [['رایگانه.', 185, 1]]] }] },
  { t: END, th: 'violet', fade: true, draw: endCard, pages: [] },
];
const NSEC = SC.filter((s) => s.num).length;

// ---------- headlines: right-aligned, two-tone, each word rising out of a mask at its word ----------
function headline(pg, nx, t, P) { const out = nx ? io(k01(t, nx.t - 0.12, 0.3)) : 0; if (out >= 1) return; let y = 300;
  pg.lines.forEach((ln) => { const o = Array.isArray(ln) ? { k: ln } : ln, base = o.s ?? pg.size ?? 100, wt = o.w ?? 900, gf = 0.26; if (o.s) y += 14;
    let wd = o.k.map(([s]) => measure(s, base, wt)); const tot = wd.reduce((a, b) => a + b, 0) + base * gf * (o.k.length - 1), size = tot > 900 ? (base * 900) / tot : base; wd = wd.map((w) => (w * size) / base);
    const yc = y + size * 0.55; cv.save(); cv.beginPath(); cv.rect(0, yc - size * 0.85, W, size * 1.7); cv.clip(); let xr = 980;
    o.k.forEach(([s, wi, acc], j) => { const w = wd[j], x = xr - w / 2; xr -= w + size * gf; const t0 = Math.max(ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, pg.ghost ? -9 : pg.t + 0.06), e = t - t0; let a, dy;
      if (e < 0) { if (!pg.ghost) return; a = 0.2; dy = 0; } else { const q = oCub(k01(e, 0, 0.42)); a = pg.ghost ? lerp(0.2, 1, q) : q; dy = pg.ghost ? 0 : (1 - q) * size * 0.95; }
      txt(s, x, yc + dy - out * size * 0.9, size, acc ? P.acc : o.mute ? P.mute : P.ink, { w: wt, alpha: a * (1 - out) }); });
    cv.restore(); y += size * 1.2; }); }
function footnote(s, t, P) { if (!s.foot) return; let cur = null; s.foot.forEach((f) => { if (t >= f[0]) cur = f; }); if (!cur) return; const q = cur[0] < 0 ? 1 : oCub(k01(t, cur[0], 0.4));
  line(980, 1578, 980 - 64 * q, 1578, P.theme === 'violet' ? '#FFFFFF' : P.acc, 5); txt(cur[1], 980, 1628, 30, P.mute, { align: 'right', w: 500, alpha: q }); }
function tag(s, t, P) { if (!s.num) return; const q = s.t <= 0 ? 1 : oCub(k01(t, s.t + 0.1, 0.4)); cv.save(); cv.globalAlpha *= q; rr(904, 160, 96, 60, 30, P.theme === 'violet' ? '#FFFFFF' : P.acc); txt(s.num, 952, 192, 32, P.theme === 'violet' ? '#5430E6' : '#FFFFFF', { w: 800 }); txt(s.label, 880, 191, 32, P.mute, { align: 'right', w: 600 }); cv.restore(); }
function drawSection(i, t) { const s = SC[i], P = PAL[s.th]; background(P); tag(s, t, P);
  let pi = -1; s.pages.forEach((p, j) => { if (t >= p.t) pi = j; }); if (pi < 0 && s.pages.length) pi = 0;
  cv.save(); s.draw(t, P); cv.restore(); if (pi >= 0) { headline(s.pages[pi], s.pages[pi + 1], t, P); if (pi > 0) { const o = io(k01(t, s.pages[pi].t - 0.12, 0.3)); if (o < 1) headline(s.pages[pi - 1], s.pages[pi], t, P); } }
  footnote(s, t, P); }
function progress(t, k, P) { const n = NSEC, gap = 10, w = (960 - gap * (n - 1)) / n; for (let i = 0; i < n; i++) { const x = 1020 - (i + 1) * w - i * gap, f = i < k ? 1 : i > k ? 0 : cl((t - SC[i].t) / (SC[i + 1].t - SC[i].t)); const light = P.theme === 'light';
  rr(x, 84, w, 8, 4, light ? 'rgba(23,19,31,0.12)' : 'rgba(255,255,255,0.22)'); if (f > 0) rr(x + w * (1 - f), 84, w * f, 8, 4, light ? '#17131F' : '#FFFFFF'); } }
function frame(t) { let k = 0; SC.forEach((s, i) => { if (t >= s.t) k = i; }); const s = SC[k], tr = k ? io(k01(t, s.t, 0.5)) : 1;
  if (tr < 1) { if (s.fade) { drawSection(k - 1, t); cv.save(); cv.globalAlpha = tr; drawSection(k, t); cv.restore(); }
    else { cv.save(); cv.translate(0, -200 * tr); drawSection(k - 1, t); cv.restore(); cv.fillStyle = `rgba(0,0,0,${0.35 * tr})`; cv.fillRect(0, 0, W, H); const y = H * (1 - tr);
      cv.save(); cv.translate(0, y); cv.shadowColor = 'rgba(0,0,0,0.35)'; cv.shadowBlur = 60; cv.shadowOffsetY = -12; cv.beginPath(); cv.roundRect(0, 0, W, H + 80, [56, 56, 0, 0]); cv.fillStyle = PAL[s.th].bg; cv.fill(); cv.shadowColor = 'transparent'; cv.clip(); drawSection(k, t); cv.restore(); } }
  else drawSection(k, t);
  progress(t, Math.min(k, NSEC), PAL[(tr > 0.5 ? s : SC[Math.max(0, k - 1)]).th]); }
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(9) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['500', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); IMG.wordL = await load(window.LOGO.wordL); })()]);
  frame(0); window.ready = true;
});
