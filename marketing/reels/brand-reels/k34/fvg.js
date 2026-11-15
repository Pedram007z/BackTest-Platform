// k34: «منتظری قیمت برگرده گپ رو پر کنه؟», the user's take at its normal speed, as a clean explainer in k32's style
// (numbered sections, right-aligned two-tone headlines rising word by word, one visual and a small footnote per section,
// light, dark and violet panels that slide up as cards). The script is BacktestLab's own, written fresh on the idea of
// FVG versus BAG (only the topic came from another brand's reel); every candle set is drawn by hand, and what's only
// expected or possible is drawn as dashed ghost candles, never as something that happened:
//   ۰۱ waiting for a fill that never comes → ۰۲ dark: two sample cases, an FVG filled and a BAG left behind →
//   ۰۳ violet: the gap's three candles, the third still «؟» → ۰۴ FVG: the third stays inside the second's range, then
//   the return many expect (ghosts) → ۰۵ dark: BAG, the third closes above the second's high, buying pressure, then a
//   possible run (ghosts) → ۰۶ the downtrend, mirrored → ۰۷ dark: an order waiting at the gap while the move runs away →
//   ۰۸ violet: «معمولاً» struck out, test on the past → ۰۹ dark: the real gold replay, a gap marked FVG or BAG before
//   seeing what came next → ۱۰ a sample log, every answer «؟» → ۱۱ violet: the close and the end card.
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

// ---------- the drawn sample candles (hand-built so each case shows exactly) ----------
const K_ = (a) => a.map(([o, c, h, l]) => ({ o, c, h, l }));
const PRE = [[20, 22, 23, 19.5], [22, 21.5, 23, 20.8]], A_ = [21.5, 24, 24.6, 21];
const FV = K_([...PRE, A_, [24, 31, 31.5, 23.5], [31, 29.5, 31.2, 27.5], [29.5, 27, 29.8, 26.5], [27, 25.5, 27.4, 24.9], [25.5, 28, 28.5, 25.2], [28, 32, 32.5, 27.6]]);   // FVG: the 3rd stays inside the 2nd (high 31.5); then the expected return (ghosts)
const BG = K_([...PRE, A_, [24, 30, 30.5, 23.5], [30, 35, 35.6, 29.8], [35, 37.5, 38, 34.6], [37.5, 36.8, 38.4, 36], [36.8, 40, 40.6, 36.4]]);   // BAG: the 3rd closes above the 2nd's high (30.5); then a possible run (ghosts)
const HOOK = K_([[20, 21.5, 22, 19.5], [21.5, 21, 22.2, 20.4], [21, 23, 23.4, 20.8], [23, 22.6, 23.6, 22], [22.6, 24, 24.5, 22.3], [24, 29, 29.4, 23.8], [29, 32.5, 33, 28.2], [32.5, 32, 33.4, 31.2],
  [32, 34, 34.5, 31.6], [34, 33.5, 35, 32.8], [33.5, 36, 36.4, 33.2], [36, 35.6, 37, 35], [35.6, 38, 38.5, 35.2], [38, 37.4, 38.8, 36.8], [37.4, 40, 40.5, 37]]);   // a BAG at 4–6 (gap 24.5–28.2) that's never filled
const MIRROR = (S, k) => S.map((d) => ({ o: k - d.o, c: k - d.c, h: k - d.l, l: k - d.h }));
const CB = { x: 150, y: 830, w: 780, h: 540 };
function mkChart(S, B = CB, ns = 17, lo0, hi0) { const lo = lo0 ?? Math.min(...S.map((d) => d.l)) - 2.5, hi = hi0 ?? Math.max(...S.map((d) => d.h)) + 2.5; return { B, X: (i) => B.x + ((i + 0.5) * B.w) / ns, Y: (v) => B.y + B.h - ((v - lo) / (hi - lo)) * B.h, bw: (B.w / ns) * 0.6 }; }
function gridLines(P, B = CB) { for (let k = 0; k <= 4; k++) line(B.x, B.y + (B.h * k) / 4, B.x + B.w, B.y + (B.h * k) / 4, P.line, 2); }
function candle(G, i, d, k, P, a = 1) { if (k <= 0) return; const x = G.X(i), col = d.c >= d.o ? P.green : P.red, q = oCub(k); cv.save(); cv.globalAlpha *= a * cl(k * 3);
  line(x, lerp(G.Y(d.o), G.Y(d.h), q), x, lerp(G.Y(d.o), G.Y(d.l), q), col, 3); const yo = G.Y(d.o), yc = lerp(yo, G.Y(d.c), q); rr(x - G.bw / 2, Math.min(yo, yc), G.bw, Math.max(5, Math.abs(yc - yo)), 4, col); cv.restore(); }
// a ghost candle: dashed outline only (an expectation or a possibility, not something that happened)
function ghost(G, i, d, k, P) { if (k <= 0) return; const x = G.X(i), col = d.c >= d.o ? P.green : P.red; cv.save(); cv.globalAlpha *= cl(k * 2) * 0.85; cv.setLineDash([7, 6]); line(x, G.Y(d.h), x, G.Y(Math.max(d.o, d.c)), col, 2.5, [5, 5]); line(x, G.Y(Math.min(d.o, d.c)), x, G.Y(d.l), col, 2.5, [5, 5]);
  cv.beginPath(); cv.roundRect(x - G.bw / 2, G.Y(Math.max(d.o, d.c)), G.bw, Math.max(5, G.Y(Math.min(d.o, d.c)) - G.Y(Math.max(d.o, d.c))), 4); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); cv.restore(); }
function drawSet(G, S, t, times, P, ghostFrom = 99) { S.forEach((d, i) => { if (times[i] == null) return; const k = k01(t, times[i], 0.3); if (i >= ghostFrom) ghost(G, i, d, k, P); else candle(G, i, d, k, P); }); }
function level(G, v, i0, i1, col, k, dash = true, lw = 3) { if (k <= 0) return; const x0 = G.X(i0) - G.bw, x1 = lerp(x0, G.X(i1) + G.bw, oCub(k)); line(x0, G.Y(v), x1, G.Y(v), col, lw, dash ? [12, 10] : null); }
function zone(G, lo, hi, i0, x1, k, P, col = '106,70,255') { if (k <= 0) return; const x0 = G.X(i0) - G.bw / 2, xe = lerp(x0, x1, oCub(k)); cv.save(); cv.globalAlpha *= cl(k * 2); cv.fillStyle = `rgba(${col},0.14)`; cv.fillRect(x0, G.Y(hi), xe - x0, G.Y(lo) - G.Y(hi)); cv.setLineDash([8, 7]); cv.strokeStyle = `rgba(${col},0.7)`; cv.lineWidth = 2.5; cv.strokeRect(x0, G.Y(hi), xe - x0, G.Y(lo) - G.Y(hi)); cv.restore(); }
function boxAt(G, i, d, col, k) { if (k <= 0) return; const x = G.X(i), y0 = G.Y(d.h) - 16, y1 = G.Y(d.l) + 16, w = G.bw + 28, s = lerp(1.3, 1, oCub(k)); cv.save(); cv.globalAlpha *= cl(k * 2); cv.translate(x, (y0 + y1) / 2); cv.scale(s, s); rr(-w / 2, -(y1 - y0) / 2, w, y1 - y0, 14, null, col, 4); cv.restore(); }
function pill(s, x, y, fill, col, size = 30, mark) { const w = measure(s, size, 800) + size * 1.5 + (mark ? size * 1.1 : 0), h = size * 1.9; rr(x - w / 2, y - h / 2, w, h, h / 2, fill); txt(s, mark ? x - size * 0.5 : x, y + 2, size, col, { w: 800 });
  if (mark) { const mx = x + w / 2 - size * 0.95, r = size * 0.27; if (mark === 'ok') check(mx, y, r * 1.1, col, size * 0.14); else { line(mx - r, y - r, mx + r, y + r, col, size * 0.14); line(mx - r, y + r, mx + r, y - r, col, size * 0.14); } } }
const popIn = (t, t0, fn, x, y) => { const k = oBack(k01(t, t0, 0.4)); if (k > 0) at(x, y, k, cl(k * 2), fn); };
function arrow(x1, y1, x2, y2, col, k, lw = 5, dash) { if (k <= 0) return; const q = oCub(k), x = lerp(x1, x2, q), y = lerp(y1, y2, q); line(x1, y1, x, y, col, lw, dash); if (q > 0.85) { const a = Math.atan2(y2 - y1, x2 - x1), s = 20; path([[x - Math.cos(a - 0.5) * s, y - Math.sin(a - 0.5) * s], [x, y], [x - Math.cos(a + 0.5) * s, y - Math.sin(a + 0.5) * s]], col, lw); } }
function numTag(G, i, d, n, P, k) { if (k <= 0) return; at(G.X(i), G.Y(d.h) - 44, oBack(k), cl(k * 2), () => { circle(0, 0, 24, P.acc); txt(fa(n), 0, 2, 28, '#FFFFFF', { w: 800 }); }); }
function chartCard(P, side, B = CB) { card(100, 690, 880, 810, P); txt('نمودار نمونه', 930, 752, 32, P.ink, { align: 'right', w: 700 }); if (side) chip(side, 230, 752, P, { size: 26 }); gridLines(P, B); }

// ---------- ۰۱ waiting for a fill that never comes ----------
function hook(t, P) { chartCard(P, 'روند صعودی'); const G = mkChart(HOOK), times = HOOK.map((_, i) => (i <= 7 ? -1 : 0.3 + (i - 8) * 0.55));
  zone(G, 24.5, 28.2, 4, CB.x + CB.w, 1, P); popIn(t, -1, () => pill('گپ', 0, 0, 'rgba(106,70,255,0.12)', P.acc, 26), G.X(2), G.Y(26.35)); drawSet(G, HOOK, t, times, P);
  const back = k01(t, T(2), 0.4) * (1 - k01(t, T(10), 0.3)), last = Math.min(14, Math.max(7, Math.floor((t - 0.3) / 0.55) + 8)); arrow(G.X(last) + 10, G.Y(HOOK[last].l) + 10, G.X(last) - 30, G.Y(28.2) - 6, P.acc, back, 4, [10, 8]);
  const nb = k01(t, T(10), 0.3); popIn(t, -1, () => { cv.globalAlpha *= 1 - nb; pill('منتظر برگشت…', 0, 0, P.acc, '#FFFFFF', 28); }, 760, G.Y(26.35) + 70);
  popIn(t, T(10), () => pill('برنگشت', 0, 0, P.red, '#FFFFFF', 30, 'no'), 760, G.Y(26.35) + 70); }
// ---------- ۰۲ dark: two kinds of gap ----------
function miniCase(t, P, x0, title, S, outTimes, fill, t0) { const B = { x: x0 + 20, y: 900, w: 360, h: 430 }, G = mkChart(S, B, 7, 18, 42); rr(x0, 790, 400, 600, 28, P.card, 'rgba(255,255,255,0.08)', 2); txt(title, x0 + 200, 845, 40, P.ink, { w: 900 });
  const z = S === FV2 ? [24.6, 27.5] : [24.6, 29.8]; zone(G, z[0], z[1], 1, B.x + B.w, k01(t, t0 + 0.4, 0.4), P); drawSet(G, S, t, S.map((_, i) => (i <= 3 ? t0 + 0.05 + i * 0.05 : outTimes[i - 4])), P); return G; }
const FV2 = K_([[20, 22, 23, 19.5], [21.5, 24, 24.6, 21], [24, 31, 31.5, 23.5], [31, 29.5, 31.2, 27.5], [29.5, 26.5, 29.8, 26], [26.5, 25.2, 27, 24.8], [25.2, 28.5, 29, 25]]);
const BG2 = K_([[20, 22, 23, 19.5], [21.5, 24, 24.6, 21], [24, 30, 30.5, 23.5], [30, 35, 35.6, 29.8], [35, 37.5, 38, 34.6], [37.5, 37, 38.4, 36.2], [37, 40, 40.6, 36.6]]);
function twoKinds(t, P) { appear(oCub(k01(t, T(12) + 0.05, 0.5)), () => { const t0 = T(12) + 0.15;
  miniCase(t, P, 560, 'FVG', FV2, [T(14), T(14) + 0.35, T(15)], 1, t0); miniCase(t, P, 120, 'BAG', BG2, [T(19), T(20), T(23)], 0, t0);
  popIn(t, T(15) + 0.2, () => pill('پر شد', 0, 0, P.green, '#0B2418', 26, 'ok'), 760, 1440); popIn(t, T(24), () => pill('جا موند', 0, 0, 'rgba(165,139,255,0.18)', P.acc, 26), 320, 1440);
  const em = oCub(k01(t, T(28), 0.4)); if (em > 0) { cv.save(); cv.globalAlpha *= em; rr(110, 780, 420, 620, 32, null, P.acc, 4); cv.restore(); } popIn(t, T(30), () => chip('Breakaway Gap', 0, 0, P, { size: 24, col: P.acc }), 320, 885); }); }
// ---------- ۰۳ violet: the three candles of a gap, the third still «؟» ----------
function third(t, P) { const L_ = PAL.light; appear(oCub(k01(t, T(38) + 0.05, 0.5)), () => { chartCard(L_, 'روند صعودی'); const G = mkChart(FV, CB, 9, 18, 36), times = FV.map((_, i) => (i <= 3 ? T(38) + 0.15 + i * 0.06 : null)); drawSet(G, FV, t, times, L_);
  const q = oCub(k01(t, T(43), 0.4)); if (q > 0) { const x = G.X(4); cv.save(); cv.globalAlpha *= q; cv.setLineDash([9, 8]); rr(x - G.bw / 2, G.Y(31), G.bw, G.Y(28) - G.Y(31), 6, null, '#6A46FF', 3.5); cv.restore(); txt('؟', x, (G.Y(31) + G.Y(28)) / 2, 56, '#6A46FF', { w: 900, alpha: q }); }
  popIn(t, T(44), () => pill('کندل سوم', 0, 0, '#6A46FF', '#FFFFFF', 28), G.X(4) + 130, G.Y(33));
  [[2, FV[2], 1, T(49)], [3, FV[3], 2, T(50)], [4, { h: 31 }, 3, T(51)]].forEach(([i, d, n, t0]) => numTag(G, i, d, n, L_, k01(t, t0, 0.4)));
  zone(G, 24.6, 28, 2, G.X(8) + G.bw, k01(t, T(52), 0.5), L_); popIn(t, T(52) + 0.2, () => pill('گپ', 0, 0, 'rgba(106,70,255,0.12)', '#6A46FF', 26), G.X(7), G.Y(26.3)); }); }
// ---------- ۰۴ FVG: the third candle stays inside the second ----------
function fvg(t, P) { appear(oCub(k01(t, T(56) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(FV, CB, 9, 18, 36), times = FV.map((_, i) => (i <= 3 ? T(56) + 0.15 + i * 0.06 : i === 4 ? T(58) : [T(73), T(74), T(76), T(78)][i - 5]));
  const rg = k01(t, T(60), 0.5); level(G, 31.5, 3, 8, P.acc, rg); level(G, 23.5, 3, 8, P.acc, rg); zone(G, 24.6, 27.5, 2, G.X(8) + G.bw, k01(t, T(66), 0.5), P);
  drawSet(G, FV, t, times, P, 5); boxAt(G, 4, FV[4], P.acc, k01(t, T(58), 0.35)); [[2, 1], [3, 2], [4, 3]].forEach(([i, n]) => numTag(G, i, FV[i], n, P, k01(t, T(56) + 0.4 + n * 0.1, 0.4)));
  popIn(t, T(61), () => chip('محدوده‌ی کندل ۲', 0, 0, P, { size: 24, fill: 'rgba(106,70,255,0.10)', col: P.acc }), 850, G.Y(23.5) + 34);
  popIn(t, T(64), () => pill('داخل محدوده', 0, 0, P.green, '#FFFFFF', 28, 'ok'), G.X(4) + 10, 1292);
  popIn(t, T(68), () => pill('FVG', 0, 0, '#6A46FF', '#FFFFFF', 40), 260, 900);
  arrow(G.X(4) + 30, G.Y(29), G.X(6) + 10, G.Y(26), P.acc, k01(t, T(71), 0.5), 4, [10, 8]); popIn(t, T(72), () => chip('انتظار خیلی‌ها: برگشت به گپ', 0, 0, P, { size: 24, col: P.acc }), 700, 878); }); }
// ---------- ۰۵ dark: BAG, the third candle closes above the second's high ----------
function bag(t, P) { appear(oCub(k01(t, T(80) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(BG, CB, 9, 18, 42), times = BG.map((_, i) => (i <= 3 ? T(80) + 0.15 + i * 0.06 : i === 4 ? null : [T(102), T(103), T(104)][i - 5]));
  level(G, 30.5, 3, 7, P.acc, k01(t, T(84), 0.5)); zone(G, 24.6, 29.8, 2, G.X(7) + G.bw, k01(t, T(99) + 0.2, 0.5), P, '165,139,255');
  drawSet(G, BG, t, times, P, 5); candle(G, 4, BG[4], k01(t, T(86), 0.8), P); boxAt(G, 4, BG[4], P.green, k01(t, T(88), 0.35)); [[2, 1], [3, 2], [4, 3]].forEach(([i, n]) => numTag(G, i, BG[i], n, P, k01(t, T(80) + 0.4 + n * 0.1, 0.4)));
  popIn(t, T(85), () => chip('سقف کندل ۲', 0, 0, P, { size: 24, fill: 'rgba(165,139,255,0.14)', col: P.acc }), 850, G.Y(30.5) - 34);
  popIn(t, T(88) + 0.1, () => pill('بالای سقفش بسته شد', 0, 0, P.green, '#0B2418', 26, 'ok'), 560, 1330);
  const pf = 1 - k01(t, T(99), 0.3); cv.save(); cv.globalAlpha *= pf; arrow(G.X(4) + 50, G.Y(31), G.X(4) + 50, G.Y(38), P.green, k01(t, T(91), 0.4), 5); popIn(t, T(92), () => chip('فشار خرید', 0, 0, P, { size: 24, col: P.green }), G.X(4) + 150, G.Y(36)); cv.restore();
  popIn(t, T(99), () => pill('BAG', 0, 0, P.acc, '#1B1040', 40), 260, 900); popIn(t, T(105), () => chip('ممکنه پر نشه', 0, 0, P, { size: 24, col: P.acc }), 760, G.Y(27.2)); }); }
// ---------- ۰۶ the downtrend, mirrored ----------
function down(t, P) { appear(oCub(k01(t, T(107) + 0.05, 0.5)), () => { const t0 = T(107) + 0.15, FD = MIRROR(FV2.slice(0, 4), 60), BD = MIRROR(BG2.slice(0, 4), 60);
  [[560, 'FVG', FD, [32.5, 35.4], 'داخل کندل ۲'], [120, 'BAG', BD, [30.2, 35.4], 'زیر کفش بسته شد']].forEach(([x0, title, S, z, note], j) => { const B = { x: x0 + 40, y: 900, w: 320, h: 400 }, G = mkChart(S, B, 5, 18, 42); card(x0, 790, 400, 640, P); txt(title, x0 + 200, 845, 40, P.ink, { w: 900 });
    zone(G, z[0], z[1], 1, B.x + B.w, k01(t, t0 + 0.4 + j * 0.1, 0.4), P); drawSet(G, S, t, S.map((_, i) => t0 + 0.05 + i * 0.06 + j * 0.1), P); popIn(t, T(111) + j * 0.15, () => chip(note, 0, 0, P, { size: 24, col: j ? P.red : P.acc }), x0 + 200, 1380); }); }); }
// ---------- ۰۷ dark: the trap, an order waiting at the gap while the move runs away ----------
function trap(t, P) { appear(oCub(k01(t, T(114) + 0.05, 0.5)), () => { chartCard(P, 'روند صعودی'); const G = mkChart(HOOK), times = HOOK.map((_, i) => (i <= 7 ? T(114) + 0.15 + i * 0.03 : seqT(T(116), T(126), 7)[i - 8]));
  zone(G, 24.5, 28.2, 4, CB.x + CB.w, 1, P, '165,139,255'); level(G, 28.2, 6, 16, P.acc, k01(t, T(119), 0.5), false, 4); popIn(t, T(120), () => pill('سفارش منتظر برگشت', 0, 0, 'rgba(165,139,255,0.16)', P.acc, 26), 700, G.Y(28.2) + 46);
  drawSet(G, HOOK, t, times, P); const r = oCub(k01(t, T(126), 0.4)); if (r > 0) { cv.save(); cv.globalAlpha *= r; cv.setLineDash([10, 8]); rr(G.X(6) - 26, G.Y(40.5) - 18, G.X(14) - G.X(6) + 52, G.Y(28.2) - G.Y(40.5) + 18, 16, null, P.red, 3); cv.restore(); }
  popIn(t, T(127), () => pill('حرکتی که از دست رفت', 0, 0, P.red, '#FFFFFF', 28, 'no'), 460, 880); }); }
const seqT = (a, b, n) => Array.from({ length: n }, (_, i) => (n < 2 ? a : a + ((b - a) * i) / (n - 1)));
// ---------- ۰۸ violet: don't take «usually» from me ----------
function testIt(t, P) { appear(oCub(k01(t, T(129) + 0.05, 0.5)), () => { const strike = k01(t, T(136), 0.3);
  popIn(t, T(131), () => { cv.globalAlpha *= 1 - 0.5 * strike; rr(-300, -78, 600, 156, 78, '#FFFFFF'); txt('«معمولاً»', 0, 4, 60, '#5430E6', { w: 900 }); if (strike > 0) line(-230 * strike, 0, 230 * strike, 0, '#E5484D', 8); }, CX, 930);
  arrow(CX, 1030, CX, 1150, 'rgba(255,255,255,0.8)', k01(t, T(137), 0.3), 5);
  popIn(t, T(137) + 0.2, () => { rr(-300, -78, 600, 156, 78, '#1B1040'); txt('تست روی گذشته', 0, 4, 56, '#FFFFFF', { w: 900 }); check(230, 0, 16, '#D7FF6B', 7); }, CX, 1250); }); }
// ---------- ۰۹ dark: the real replay, a gap marked FVG or BAG before seeing what came next ----------
const SCR = [20, 140, 1540, 1000], KEYS = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`);
function replay(t, P) { appear(oCub(k01(t, T(138) + 0.05, 0.5)), () => { const x = 60, y = 680, w = 960, sh = (w * SCR[3]) / SCR[2];
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 60; cv.shadowOffsetY = 20; rr(x, y, w, 56 + sh + 64, 28, '#1F1B2B'); cv.restore(); rr(x, y, w, 56 + sh + 64, 28, null, 'rgba(255,255,255,0.10)', 2);
  ['#FF6B6B', '#FFC14D', '#3DDC84'].forEach((c, i) => circle(x + 40 + i * 30, y + 28, 8, c)); rr(CX - 170, y + 12, 340, 34, 17, 'rgba(255,255,255,0.07)'); txt('بک‌تست‌لب، بازپخش', CX, y + 30, 22, P.mute, { w: 600 });
  const f = cl((t - T(141)) / (T(158) - T(141))), im = IMG[KEYS[Math.min(15, Math.floor(f * 16))]], sy = y + 56;
  if (im) { cv.save(); cv.beginPath(); cv.rect(x, sy, w, sh); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, sy, w, sh);
    const gk = oCub(k01(t, T(147), 0.5)); if (gk > 0) { cv.save(); cv.globalAlpha *= gk; cv.fillStyle = 'rgba(165,139,255,0.18)'; cv.fillRect(x + w * 0.3, sy + sh * 0.3, w * 0.28 * gk, sh * 0.09); cv.setLineDash([8, 7]); cv.strokeStyle = '#A58BFF'; cv.lineWidth = 3; cv.strokeRect(x + w * 0.3, sy + sh * 0.3, w * 0.28 * gk, sh * 0.09); cv.restore(); }
    const cu = oCub(k01(t, T(152), 0.45)); if (cu > 0) { const cx0 = x + w * 0.62; cv.globalAlpha *= cu; const g = cv.createLinearGradient(cx0, 0, cx0 + w * 0.12, 0); g.addColorStop(0, 'rgba(17,15,24,0)'); g.addColorStop(1, 'rgba(17,15,24,0.97)'); cv.fillStyle = g; cv.fillRect(cx0, sy, w * 0.38, sh); eye(x + w * 0.86, sy + sh / 2 - 40, 34, P.acc, true); txt('ادامه‌ش', x + w * 0.86, sy + sh / 2 + 40, 38, P.acc, { w: 800 }); } cv.restore(); }
  popIn(t, T(147) + 0.15, () => pill('گپ؟', 0, 0, '#6A46FF', '#FFFFFF', 26), x + w * 0.44, sy + sh * 0.3 - 36); popIn(t, T(143), () => pill('۲۵ فروردین ۱۴۰۴', 0, 0, '#6A46FF', '#FFFFFF', 28), x + w - 160, sy + 40);
  const by = sy + sh + 32; cv.save(); cv.beginPath(); cv.moveTo(x + 36, by - 13); cv.lineTo(x + 36, by + 13); cv.lineTo(x + 58, by); cv.closePath(); cv.fillStyle = P.ink; cv.fill(); cv.restore(); rr(x + 84, by - 4, w - 124, 8, 4, P.track); rr(x + 84, by - 4, (w - 124) * f, 8, 4, P.acc); circle(x + 84 + (w - 124) * f, by, 11, P.acc);
  const pulse = (t0) => 1 + 0.07 * Math.sin(Math.PI * k01(t, t0, 0.35));
  popIn(t, T(155), () => { cv.scale(pulse(T(156)), pulse(T(156))); rr(-200, -52, 400, 104, 52, 'rgba(165,139,255,0.14)', P.acc, 4); txt('FVG', 0, 3, 46, P.acc, { w: 900 }); }, CX + 230, 1505);
  popIn(t, T(155) + 0.08, () => { cv.scale(pulse(T(158)), pulse(T(158))); rr(-200, -52, 400, 104, 52, 'rgba(255,193,77,0.12)', '#FFC14D', 4); txt('BAG', 0, 3, 46, '#FFC14D', { w: 900 }); }, CX - 230, 1505); }); }
// ---------- ۱۰ then see which ones price really filled ----------
const ROWS = [['FVG', 1], ['BAG', 0], ['FVG', 1], ['BAG', 0], ['FVG', 1]];
function results(t, P) { appear(oCub(k01(t, T(159) + 0.05, 0.5)), () => { card(100, 690, 880, 810, P); txt('گپ‌هایی که علامت زدی', 930, 760, 34, P.ink, { align: 'right', w: 700 }); chip('نمونه', 200, 760, P, { size: 26 });
  txt('حدس تو', 600, 850, 28, P.mute, { w: 600 }); txt('پر شد؟', 260, 850, 28, P.mute, { w: 600 });
  ROWS.forEach(([s, f], i) => { const y = 940 + i * 108, k = oCub(k01(t, T(159) + 0.2 + i * 0.1, 0.4)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; line(150, y + 54, 930, y + 54, P.line, 2); txt(`گپ ${fa(i + 1)}`, 930, y, 32, P.ink, { align: 'right', w: 700 });
    pill(s, 600, y, f ? 'rgba(106,70,255,0.10)' : 'rgba(255,193,77,0.16)', f ? P.acc : '#B7791F', 26); const sh = 0.5 + 0.5 * Math.sin(t * 5 - i * 0.7); txt('؟', 260, y, 54, P.acc, { w: 900, alpha: 0.55 + 0.45 * sh }); cv.restore(); }); }); }
// ---------- ۱۱ violet: the close, then the end card ----------
function close_(t, P) { const k = oBack(k01(t, T(168) + 0.05, 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(20,8,60,0.45)'; cv.shadowBlur = 80; cv.shadowOffsetY = 24; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 980 - s / 2, s, s); cv.restore(); }
  const p = oBack(k01(t, T(170), 0.4)); at(CX, 1300, p, 1, () => { rr(-280, -64, 560, 128, 64, '#FFFFFF'); txt('لینک توی بیو', 0, 4, 56, '#5430E6', { w: 900 }); }); }
function endCard(t, P) { const k = oBack(k01(t, END + 0.05, 0.45)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(20,8,60,0.45)'; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 740 - s / 2, s, s); cv.restore(); }
  if (IMG.word) { const q = oCub(k01(t, END + 0.25, 0.4)), ww = 500, hh = (ww * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= q; cv.drawImage(IMG.word, CX - ww / 2, 920, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.5, 0.4)); txt('هر گپی پر نمی‌شه؛ تستش کن', CX, 1200, 60, '#FFFFFF', { w: 900, alpha: f }); at(CX, 1340, 1, f, () => { rr(-330, -48, 660, 96, 48, '#FFFFFF'); txt('شروعش رایگانه؛ لینک توی بیو', 0, 3, 36, '#5430E6', { w: 800 }); }); }

// ---------- the sections: their panel, number, headline pages (words with their index in the voice) and footnotes ----------
const SC = [
  { t: 0, th: 'light', num: '۰۱', label: 'گپ', draw: hook, foot: [[-1, 'نمودار نمونه، فقط برای توضیح']],
    pages: [{ t: 0, ghost: true, lines: [[['منتظری', 0], ['قیمت', 1], ['برگرده', 2]], [['گپ', 3, 1], ['رو', 4], ['پر', 5], ['کنه؟', 6]], { s: 52, w: 700, mute: 1, k: [['شاید', 7], ['هیچ‌وقت', [8, 9], 1], ['برنگرده.', [10, 11]]] }] }] },
  { t: T(12), th: 'dark', num: '۰۲', label: 'دو نوع گپ', draw: twoKinds, foot: [[T(12) + 0.4, 'نمونه؛ برای نشون دادن فرق دو نوع گپ']],
    pages: [{ t: T(12), lines: [[['هر', 12], ['گپی', 13]], [['FVG', 14, 1], ['نیست.', 15]]] },
      { t: T(16), size: 86, lines: [[['بعضی', 16], ['گپ‌ها', [17, 18]], ['جا', 19], ['می‌مونن', 20]], [['و', 21], ['قیمت', 22], ['دیگه', 23]], [['سراغشون', 24], ['نمیاد.', 25, 1]]] },
      { t: T(26), lines: [[['بهشون', 26], ['می‌گن', 27], ['BAG،', 28, 1]], [['یعنی', 29], ['Breakaway Gap،', [30, 31], 1]]] },
      { t: T(32), lines: [[['گپی', 32], ['که', 33], ['قیمت', 34]], [['ازش', 35], ['فرار', 36, 1], ['می‌کنه.', 37]]] }] },
  { t: T(38), th: 'violet', num: '۰۳', label: 'کندل سوم', draw: third, foot: [[T(38) + 0.4, 'یکی از روش‌های رایج؛ خودت تستش کن']],
    pages: [{ t: T(38), size: 88, lines: [[['یه', 38], ['راه', 39], ['ساده', 40]], [['برای', 41], ['تشخیصشون،', 42]], [['کندل', 43, 1], ['سومه.', 44, 1]]] },
      { t: T(45), lines: [[['توی', 45], ['یه', 46], ['حرکت', 47], ['صعودی،', 48, 1]], [['سه', 49], ['تا', 50], ['کندلِ', 51], ['گپ', 52, 1], ['رو', 53], ['نگاه', 54], ['کن.', 55]]] }] },
  { t: T(56), th: 'light', num: '۰۴', label: 'FVG', draw: fvg, foot: [[T(56) + 0.4, 'نمودار نمونه'], [T(73), 'کندل‌های خط‌چین انتظاره، نه اتفاق']],
    pages: [{ t: T(56), size: 86, lines: [[['اگه', 56], ['کندل', 57], ['سوم', 58, 1], ['آروم،', 59]], [['داخل', 60, 1], ['محدوده‌ی', 61], ['کندل', 62], ['دوم', 63]], [['بمونه،', 64]]] },
      { t: T(65), lines: [[['معمولاً', 65], ['بهش', 66], ['می‌گن', 67]], [['FVG؛', 68, 1]]] },
      { t: T(69), lines: [[['خیلی‌ها', [69, 70]], ['انتظار', 71], ['دارن', 72]], [['قیمت', 73], ['برگرده', 74, 1], ['و', 75], ['گپ', 76], ['رو', 77], ['پر', 78], ['کنه.', 79]]] }] },
  { t: T(80), th: 'dark', num: '۰۵', label: 'BAG', draw: bag, foot: [[T(80) + 0.4, 'نمودار نمونه'], [T(102), 'کندل‌های خط‌چین فقط یه احتماله']],
    pages: [{ t: T(80), size: 86, lines: [[['ولی', 80], ['اگه', 81], ['کندل', 82], ['سوم', 83, 1]], [['بالای', 84, 1], ['سقفِ', 85, 1], ['کندل', 86], ['دوم', 87]], [['بسته', 88], ['بشه،', 89]]] },
      { t: T(90), lines: [[['یعنی', 90], ['فشار', 91, 1], ['خرید', 92, 1]], [['هنوز', 93], ['تموم', 94], ['نشده.', 95]]] },
      { t: T(96), lines: [[['این‌جا', 96], ['با', 97], ['یه', 98], ['BAG', 99, 1], ['طرفی', 100]], [['و', 101], ['ممکنه', 102], ['قیمت', 103], ['اصلاً', 104], ['برنگرده.', [105, 106], 1]]] }] },
  { t: T(107), th: 'light', num: '۰۶', label: 'روند نزولی', draw: down, foot: [[T(107) + 0.4, 'نمونه؛ همون قانون، برعکس']],
    pages: [{ t: T(107), lines: [[['توی', 107], ['روند', 108], ['نزولی', 109, 1]], [['هم', 110], ['همینه،', 111], ['فقط', 112], ['برعکس.', 113, 1]]] }] },
  { t: T(114), th: 'dark', num: '۰۷', label: 'تله‌ی انتظار', draw: trap, foot: [[T(114) + 0.4, 'نمودار نمونه، فقط برای توضیح']],
    pages: [{ t: T(114), lines: [[['پس', 114], ['اگه', 115], ['روی', 116], ['هر', 117], ['گپی', 118]], [['منتظر', 119], ['برگشت', 120, 1], ['بمونی،', 121]]] },
      { t: T(122), lines: [[['خیلی', 122], ['وقت‌ها', 123], ['فقط', 124]], [['از', 125], ['حرکت', 126], ['جا', 127, 1], ['می‌مونی.', 128, 1]]] }] },
  { t: T(129), th: 'violet', num: '۰۸', label: 'تست', draw: testIt, foot: [[T(129) + 0.4, 'جواب رو تست می‌ده، نه حدس']],
    pages: [{ t: T(129), lines: [[['ولی', 129], ['این', 130], ['«معمولاً»ها', [131, 132], 1]], [['رو', 133], ['از', 134], ['من', 135], ['قبول', 136], ['نکن.', 137, 1]]] }] },
  { t: T(138), th: 'dark', num: '۰۹', label: 'بازپخش', draw: replay, foot: [[T(138) + 0.4, 'صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا؛ برچسب‌ها نمایشی‌اند']],
    pages: [{ t: T(138), lines: [[['توی', 138], ['بک‌تست‌لب', [139, 140], 1]], [['برو', 141], ['به', 142], ['گذشته،', 143, 1]]] },
      { t: T(144), lines: [[['گپ‌ها', [144, 145], 1], ['رو', 146]], [['پیدا', 147], ['کن', 148]]] },
      { t: T(149), lines: [[['و', 149], ['قبل', 150], ['از', 151], ['دیدن', 152]], [['ادامه‌شون', [153, 154], 1], ['بگو:', 155]]] },
      { t: T(156), lines: [[['FVG', 156, 1]], [['یا', 157], ['BAG؟', 158, 1]]] }] },
  { t: T(159), th: 'light', num: '۱۰', label: 'نتیجه', draw: results, foot: [[T(159) + 0.4, 'نمونه؛ جوابش رو فقط بازپخش نشون می‌ده']],
    pages: [{ t: T(159), lines: [[['بعد', 159], ['ببین', 160], ['قیمت', 161]], [['کدوم‌ها', [162, 163]], ['رو', 164], ['واقعاً', 165], ['پر', 166, 1], ['کرد.', 167, 1]]] }] },
  { t: T(168), th: 'violet', num: '۱۱', label: 'شروع', draw: close_, pages: [{ t: T(168), lines: [[['شروعش', 168]], [['رایگانه.', 169, 1]]] }] },
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
window.cover = () => { frame(ws(11) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['500', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); IMG.wordL = await load(window.LOGO.wordL); })()]);
  frame(0); window.ready = true;
});
