// k36: «بیشتر تریدرها تایم‌فریم‌ها رو اشتباه با هم ترکیب می‌کنن», the user's take at its normal speed, as a clean white
// motion design. The user asked for motion graphics like a reference reel's; only its principles are taken (a white
// ground, green and black candles, thin labels joined by curved or dotted lines, a red ✗, badge columns, an oval on the
// entry, a position box). The script, the layout, the example and the violet accent are BacktestLab's own:
//   the daily and the one-minute joined by a curve and crossed out → «جهت» on one, «ورود» on the other, nothing fits →
//   the rule's two columns (higher timeframe: direction and key levels; lower: entry) → four pairs lit one by one with
//   dotted connectors (D↔H1, H4↔M15, H1↔M5, M15↔M1) → a sample H1 chart, a sweep of the level and a curved arrow down,
//   then M5: the rejection circled, a sell-only position box, «تایم‌فریم بی‌ربط ✗» and «خلاف جهت ✗» → one example among
//   many «؟» → the real replay, its timeframe buttons ringed (1h, then 5m), the future curtained → repeat until you
//   know → the close and the end card.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], END = D.end, DUR = D.dur;
const BG = '#FFFFFF', INK = '#111111', MUTE = '#8C8C8C', HAIR = 'rgba(0,0,0,0.08)', GREEN = '#22B04B', BLACK = '#161616', RED = '#E5322D', VIO = '#6A46FF';
const P1 = '#6A46FF', P2 = '#E5322D', P3 = '#2563EB', P4 = '#E08A00';
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
function at(x, y, s, a, fn) { if (a <= 0 || s <= 0) return; cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function check(x, y, s, col, lw = 6) { cv.save(); cv.beginPath(); cv.moveTo(x - s, y); cv.lineTo(x - s * 0.3, y + s * 0.7); cv.lineTo(x + s, y - s * 0.7); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.stroke(); cv.restore(); }
function cross(x, y, s, col, lw = 6) { line(x - s, y - s, x + s, y + s, col, lw); line(x - s, y + s, x + s, y - s, col, lw); }
const seqT = (a, b, n) => Array.from({ length: n }, (_, i) => (n < 2 ? a : a + ((b - a) * i) / (n - 1)));
// a pill: a soft fill, the label, an optional ✓ or ✗
function pill(s, x, y, col, size = 30, mark, solid) { const w = measure(s, size, 800) + size * 1.4 + (mark ? size * 1.1 : 0), h = size * 1.9; rr(x - w / 2, y - h / 2, w, h, h / 2, solid ? col : col + '1A', solid ? null : col, 2.5); const tc = solid ? '#FFFFFF' : col;
  txt(s, mark ? x - size * 0.5 : x, y + 2, size, tc, { w: 800 }); if (mark) { const mx = x + w / 2 - size * 0.95; if (mark === 'ok') check(mx, y, size * 0.3, tc, size * 0.14); else cross(mx, y, size * 0.25, tc, size * 0.14); } }
const popIn = (t, t0, fn, x, y) => { const k = oBack(k01(t, t0, 0.4)); if (k > 0) at(x, y, k, cl(k * 2), fn); };
// an arrow along a quadratic curve, drawn on
function curveArrow(x0, y0, cx, cy, x1, y1, col, k, lw = 6) { if (k <= 0) return; const q = oCub(k), n = 40, pts = []; for (let i = 0; i <= n * q; i++) { const u = i / n; pts.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1]); }
  cv.save(); cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.stroke(); if (q > 0.9 && pts.length > 2) { const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 3], a = Math.atan2(ay - by, ax - bx); cv.beginPath(); cv.moveTo(ax - Math.cos(a - 0.5) * 24, ay - Math.sin(a - 0.5) * 24); cv.lineTo(ax, ay); cv.lineTo(ax - Math.cos(a + 0.5) * 24, ay - Math.sin(a + 0.5) * 24); cv.stroke(); } cv.restore(); }

// ---------- candles (drawn samples) ----------
const K_ = (a) => a.map(([o, c, h, l]) => ({ o, c, h, l }));
function chartG(S, B, ns, lo0, hi0) { const lo = lo0 ?? Math.min(...S.map((d) => d.l)) - 1.5, hi = hi0 ?? Math.max(...S.map((d) => d.h)) + 1.5; return { B, X: (i) => B.x + ((i + 0.5) * B.w) / ns, Y: (v) => B.y + B.h - ((v - lo) / (hi - lo)) * B.h, bw: (B.w / ns) * 0.62 }; }
function candle(G, i, d, k, a = 1) { if (k <= 0) return; const x = G.X(i), up = d.c >= d.o, col = up ? GREEN : BLACK, q = oCub(k); cv.save(); cv.globalAlpha *= a * cl(k * 3);
  line(x, lerp(G.Y(d.o), G.Y(d.h), q), x, lerp(G.Y(d.o), G.Y(d.l), q), BLACK, 2.5); const yo = G.Y(d.o), yc = lerp(yo, G.Y(d.c), q); rr(x - G.bw / 2, Math.min(yo, yc), G.bw, Math.max(4, Math.abs(yc - yo)), 2, col, BLACK, 2); cv.restore(); }
function candles(G, S, t, times, a = 1) { S.forEach((d, i) => { if (times[i] != null) candle(G, i, d, k01(t, times[i], 0.28), a); }); }
// the hook: three big daily candles, and a noisy one-minute chart
const DAILY = K_([[22, 34, 36, 20], [34, 32.5, 35.5, 31.5], [32.5, 24, 33.2, 22.5]]);
const M1 = (() => { const o = []; let p = 30; for (let i = 0; i < 44; i++) { const c = p + (rnd(i * 3 + 1) - 0.5) * 3.2 + Math.sin(i * 0.5) * 0.6; o.push({ o: p, c, h: Math.max(p, c) + rnd(i * 7) * 1.2, l: Math.min(p, c) - rnd(i * 11) * 1.2 }); p = c; } return o; })();
// the example: H1 rises into a level, sweeps it and turns; M5 pokes above the level and is rejected
const H1 = K_([[20, 21.5, 22, 19.6], [21.5, 21, 22.2, 20.4], [21, 23, 23.4, 20.8], [23, 24.6, 25, 22.7], [24.6, 24, 25.2, 23.4], [24, 26.2, 26.6, 23.8], [26.2, 27.8, 28.1, 25.9], [27.8, 27.2, 28.4, 26.7],
  [27.2, 29.4, 29.8, 27], [29.4, 31, 31.4, 29.1], [31, 30.2, 31.6, 29.8], [30.2, 32.6, 33, 30], [32.6, 34.4, 34.8, 32.3], [34.4, 33.6, 35, 33.1], [33.6, 35.8, 36.2, 33.4], [35.8, 37.4, 37.9, 35.5], [37.4, 37.9, 39.8, 37.1], [37.9, 36.1, 38.3, 35.6]]);
const LVL = 38.4;
const M5 = K_([[34.6, 35.4, 35.7, 34.4], [35.4, 35.1, 35.8, 34.8], [35.1, 36, 36.3, 34.9], [36, 36.6, 36.9, 35.8], [36.6, 36.3, 37, 36], [36.3, 37.1, 37.4, 36.1], [37.1, 37.6, 37.9, 36.9], [37.6, 37.3, 38, 37.1],
  [37.3, 38, 38.3, 37.1], [38, 38.6, 39.1, 37.8], [38.6, 39, 39.6, 38.4], [39, 38.7, 39.9, 38.5], [38.7, 37.5, 38.9, 37.3]]);   // 9–11 poke above 38.4, 12 is the rejection

// ---------- the words: centred, rising word by word, an accent and an underline on key words ----------
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
function wordsLine(ln, t, fade = 1) { let size = ln.size; const gapF = 0.28; const items = ln.toks.map(([s, wi, st = {}]) => ({ s, st, w: measure(s, size, 900), t1: ws(Array.isArray(wi) ? wi[0] : wi) - 0.07 }));
  let total = items.reduce((a, k) => a + k.w, 0) + size * gapF * (items.length - 1); if (total > 960) { const f = 960 / total; size *= f; items.forEach((k) => (k.w *= f)); total = 960; }
  const gap = size * gapF; let xr = CX + total / 2;
  items.forEach((k) => { const x = xr - k.w / 2; xr -= k.w + gap; const e = t - k.t1; if (e < 0 && !ln.ghost) return; const q = oCub(k01(e, 0, 0.35)), a = ln.ghost && e < 0 ? 0.18 : ln.ghost ? lerp(0.18, 1, q) : q;
    cv.save(); cv.globalAlpha *= a * fade; txt(k.s, x, ln.y + (ln.ghost ? 0 : (1 - q) * 22), size, k.st.c ?? INK, { w: 900 }); cv.restore();
    if (k.st.bar && e > 0.1) { const g = oCub(k01(e, 0.15, 0.4)); line(x + k.w / 2, ln.y + size * 0.6, x + k.w / 2 - k.w * g, ln.y + size * 0.6, k.st.c ?? INK, 6); } }); }

// ---------- ۱ the daily and the one-minute, joined and crossed out ----------
function hookS(t) { const GD = chartG(DAILY, { x: 130, y: 860, w: 300, h: 560 }, 3, 18, 38), GM = chartG(M1, { x: 560, y: 940, w: 400, h: 420 }, 44);
  candles(GD, DAILY, t, [-1, -1, -1]); candles(GM, M1, t, M1.map(() => -1));   // still: no scrolling, so the one-minute candles don't shake
  txt('روزانه', 280, 760, 44, INK, { w: 800 }); txt('D', 280, 812, 26, MUTE, { w: 700, dir: 'ltr' }); txt('۱ دقیقه', 760, 760, 44, INK, { w: 800 }); txt('M1', 760, 812, 26, MUTE, { w: 700, dir: 'ltr' });
  cv.save(); cv.beginPath(); cv.moveTo(372, 790); cv.quadraticCurveTo(520, 900, 668, 790); cv.strokeStyle = INK; cv.lineWidth = 4; cv.stroke(); cv.restore();
  const x = oBack(k01(t, T(6), 0.35)); if (x > 0) at(520, 858, x, 1, () => cross(0, 0, 44, RED, 14));
  const d = oCub(k01(t, T(12), 0.5)); if (d > 0) curveArrow(170, 1180, 230, 900, 410, 880, GREEN, d, 6); popIn(t, T(13), () => pill('جهت', 0, 0, GREEN, 28), 300, 1480);
  const en = oBack(k01(t, T(18), 0.4)); if (en > 0) at(880, 1150, en, 1, () => { cv.beginPath(); cv.arc(0, 0, 30, 0, Math.PI * 2); cv.strokeStyle = VIO; cv.lineWidth = 5; cv.stroke(); line(-44, 0, 44, 0, VIO, 3); line(0, -44, 0, 44, VIO, 3); }); popIn(t, T(19), () => pill('ورود', 0, 0, VIO, 28), 760, 1480);
  [[640, 1000, T(30)], [930, 980, T(31) + 0.1], [700, 1290, T(31) + 0.3], [420, 1000, T(34)]].forEach(([qx, qy, t0]) => popIn(t, t0, () => txt('؟', 0, 0, 72, RED, { w: 900 }), qx, qy)); }
// ---------- ۲ the rule: two columns, four pairs ----------
const HTF = [['D', 'روزانه'], ['H4', '۴ ساعته'], ['H1', '۱ ساعته'], ['M15', '۱۵ دقیقه']], LTF = [['H1', '۱ ساعته'], ['M15', '۱۵ دقیقه'], ['M5', '۵ دقیقه'], ['M1', '۱ دقیقه']], PC = [P1, P2, P3, P4];
const PAIR_T = () => [T(61), T(68), T(74), T(80)];
const ROWY = (i) => 860 + i * 158;
function badge(x, y, code, sub, col, on, dim) { cv.save(); cv.globalAlpha *= dim ? 0.35 : 1; rr(x - 112, y - 58, 224, 116, 22, on ? col : '#F4F4F6', on ? null : 'rgba(0,0,0,0.12)', 2); txt(code, x, y - 12, 50, on ? '#FFFFFF' : INK, { w: 900, dir: 'ltr' }); txt(sub, x, y + 34, 24, on ? 'rgba(255,255,255,0.85)' : MUTE, { w: 600 }); cv.restore(); }
function tableS(t) { const h1 = oCub(k01(t, T(39), 0.4)), h2 = oCub(k01(t, T(48), 0.4)), pt = PAIR_T(), anyPair = t >= pt[0];
  if (h1 > 0) at(760, 700, 1, h1, () => { txt('تایم‌فریم بالا', 0, -10, 40, INK, { w: 900 }); txt('جهت و سطح‌های مهم', 0, 34, 24, GREEN, { w: 700 }); });
  if (h2 > 0) at(320, 700, 1, h2, () => { txt('تایم‌فریم پایین', 0, -10, 40, INK, { w: 900 }); txt('ورود', 0, 34, 24, VIO, { w: 700 }); });
  for (let i = 0; i < 4; i++) { const on = t >= pt[i], cur = anyPair && t >= pt[i] && (i === 3 || t < pt[i + 1]), y = ROWY(i), bq = oBack(k01(t, T(55) + i * 0.12, 0.35)), lq = oBack(k01(t, T(56) + i * 0.12, 0.35));
    const lk = on ? oCub(k01(t, pt[i], 0.5)) : t >= T(59) ? 0.25 : 0; if (lk > 0) { const xl = 650, xr = 430; line(xl, y, lerp(xl, xr, on ? lk : 1), y, on ? PC[i] : 'rgba(0,0,0,0.25)', on ? 5 : 3, [4, 12]); if (on && lk > 0.95) { circle(xl, y, 7, PC[i]); circle(xr, y, 7, PC[i]); } }
    const dim = anyPair && !on; if (bq > 0) at(760, y, bq, 1, () => badge(0, 0, HTF[i][0], HTF[i][1], PC[i], on, dim)); if (lq > 0) at(320, y, lq, 1, () => badge(0, 0, LTF[i][0], LTF[i][1], PC[i], on, dim));
    if (cur) { const p = 0.5 + 0.5 * Math.sin((t - pt[i]) * 7); cv.save(); cv.globalAlpha *= 0.5 * p; rr(190, y - 74, 700, 148, 30, null, PC[i], 3); cv.restore(); } } }
// ---------- ۳ the example: H1 for direction, M5 for the entry ----------
const EB = { x: 110, y: 760, w: 860, h: 640 };
function exampleS(t) { const z = io(k01(t, T(93), 0.8)), G1 = chartG(H1, EB, 20, 18, 41), G5 = chartG(M5, EB, 18, 33.6, 41);
  if (z < 1) { cv.save(); cv.globalAlpha *= 1 - z; const fx = G1.X(16), fy = G1.Y(LVL); cv.translate(fx, fy); cv.scale(1 + z * 2, 1 + z * 2); cv.translate(-fx, -fy);
    line(G1.X(10) - 30, G1.Y(LVL), EB.x + EB.w, G1.Y(LVL), INK, 3, [12, 9]); candles(G1, H1, t, H1.map((_, i) => T(86) + 0.1 + i * 0.04));
    const s = oCub(k01(t, T(91), 0.4)); if (s > 0) { cv.save(); cv.globalAlpha *= s; cv.beginPath(); cv.ellipse(G1.X(16), G1.Y(39.4), 30, 46, 0, 0, Math.PI * 2); cv.strokeStyle = RED; cv.lineWidth = 4; cv.stroke(); cv.restore(); }
    curveArrow(G1.X(16) + 26, G1.Y(39.8), G1.X(19) + 24, G1.Y(41), G1.X(19), G1.Y(31), RED, k01(t, T(92), 0.5), 6); cv.restore();
    txt('H1', EB.x + EB.w - 10, EB.y + EB.h + 40, 44, INK, { w: 900, dir: 'ltr', align: 'right', alpha: 1 - z }); }
  if (z > 0) { cv.save(); cv.globalAlpha *= z; line(EB.x, G5.Y(LVL), EB.x + EB.w, G5.Y(LVL), INK, 3, [12, 9]); candles(G5, M5, t, M5.map((_, i) => T(94) + 0.05 + i * 0.05)); txt('M5', EB.x + EB.w - 10, EB.y + EB.h + 40, 44, INK, { w: 900, dir: 'ltr', align: 'right' });
    const ov = oCub(k01(t, T(99), 0.4)); if (ov > 0) { cv.save(); cv.globalAlpha *= ov; cv.beginPath(); cv.ellipse(G5.X(11), G5.Y(39.1), 120, 70, 0, 0, Math.PI * 2); cv.strokeStyle = RED; cv.lineWidth = 4; cv.stroke(); cv.restore(); }
    const pb = oCub(k01(t, T(101), 0.4)); if (pb > 0) { const x0 = G5.X(12) - G5.bw / 2, x1 = EB.x + EB.w - 20, ye = G5.Y(37.5), ys = G5.Y(40.2), yt = G5.Y(34.4); cv.save(); cv.globalAlpha *= pb; cv.fillStyle = 'rgba(229,50,45,0.16)'; cv.fillRect(x0, ys, (x1 - x0) * pb, ye - ys); cv.fillStyle = 'rgba(34,176,75,0.16)'; cv.fillRect(x0, ye, (x1 - x0) * pb, yt - ye); line(x0, ye, x0 + (x1 - x0) * pb, ye, INK, 2.5); cv.restore();
      txt('حد ضرر', x1 - 10, (ys + ye) / 2, 24, RED, { align: 'right', w: 700, alpha: pb }); txt('هدف', x1 - 10, (ye + yt) / 2, 24, GREEN, { align: 'right', w: 700, alpha: pb }); }
    popIn(t, T(101) + 0.15, () => pill('فقط فروش', 0, 0, RED, 30, 'ok', true), 330, 900); cv.restore(); }
  popIn(t, T(90), () => { rr(-130, -34, 260, 68, 34, '#FFFFFF', 'rgba(0,0,0,0.15)', 2); txt('H1', 66, 2, 30, P3, { w: 900, dir: 'ltr' }); line(-30, 0, 30, 0, P3, 4, [3, 8]); txt('M5', -66, 2, 30, P3, { w: 900, dir: 'ltr' }); }, 250, 760);
  txt('نمودار نمونه', EB.x, EB.y + EB.h + 40, 24, MUTE, { align: 'left', dir: 'rtl', w: 600 });
  popIn(t, T(106), () => { pill('تایم‌فریم بی‌ربط', 0, 0, RED, 26, 'no'); }, 330, 1510); popIn(t, T(111), () => { pill('خلاف جهت', 0, 0, RED, 26, 'no'); }, 760, 1510); }
// ---------- ۴ one example, among many ----------
function manyS(t) { const k = oCub(k01(t, T(113), 0.4)), m = io(k01(t, T(119), 0.9)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k;
  for (let i = 0; i < 20; i++) { const c = i % 5, r = Math.floor(i / 5), gx = 880 - c * 170, gy = 820 + r * 170; if (i === 0) continue; const q = oBack(k01(t, T(119) + 0.1 + i * 0.04, 0.3)); if (q <= 0) continue;
    at(gx, gy, q, 1, () => { cv.save(); cv.setLineDash([7, 6]); rr(-70, -70, 140, 140, 18, '#FAFAFB', 'rgba(0,0,0,0.25)', 2); cv.restore(); txt('؟', 0, 0, 60, VIO, { w: 900, alpha: t >= T(121) ? 1 : 0.3 }); }); }
  const x = lerp(CX, 880, m), y = lerp(1090, 820, m), s = lerp(1, 140 / 520, m); at(x, y, s, 1, () => { rr(-260, -260, 520, 520, 36, '#FFFFFF', VIO, 5); const G = chartG(M5, { x: -220, y: -180, w: 440, h: 360 }, 14, 33.6, 41); line(-220, G.Y(LVL), 220, G.Y(LVL), INK, 3, [10, 8]); candles(G, M5, t, M5.map(() => -1)); txt('۱ مثال', 0, -220, 36, VIO, { w: 900 }); });
  popIn(t, T(122), () => pill('همه‌ی موقعیت‌ها؟', 0, 0, VIO, 30), CX, 1560); cv.restore(); }
// ---------- ۵ the real replay: the timeframe buttons, then the curtain ----------
const SCR = [20, 140, 1540, 1000], KEYS = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`);
function replayS(t) { const k = oCub(k01(t, T(124), 0.45)); if (k <= 0) return; const w = 960, h = (w * SCR[3]) / SCR[2], x = CX - w / 2, y = 760; cv.save(); cv.globalAlpha *= k;
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.18)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rr(x - 14, y - 52, w + 28, h + 66, 22, '#FFFFFF', 'rgba(0,0,0,0.12)', 2); cv.restore(); ['#FF6B6B', '#FFC14D', '#3DDC84'].forEach((c, i) => circle(x + 20 + i * 26, y - 26, 7, c));
  const f = cl((t - T(127)) / (T(146) - T(127))), im = IMG[KEYS[Math.min(15, Math.floor(f * 16))]];
  if (im) { cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 10); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, y, w, h);
    const cu = oCub(k01(t, T(143), 0.4)); if (cu > 0) { cv.globalAlpha *= cu; const g = cv.createLinearGradient(x + w * 0.6, 0, x + w * 0.84, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.35, 'rgba(255,255,255,0.97)'); cv.fillStyle = g; cv.fillRect(x + w * 0.6, y, w * 0.4, h); txt('ادامه‌ش', x + w * 0.84, y + h / 2, 42, VIO, { w: 900 }); } cv.restore(); }
  const ring = (fx, t0, t1, col, label) => { const q = oBack(k01(t, t0, 0.35)) * (t1 ? 1 - k01(t, t1, 0.3) : 1); if (q <= 0) return; const rx = x + w * fx, ry = y + h * 0.089; at(rx, ry, q, cl(q * 2), () => { cv.beginPath(); cv.arc(0, 0, 30, 0, Math.PI * 2); cv.strokeStyle = col; cv.lineWidth = 5; cv.stroke(); }); popIn(t, t0 + 0.1, () => pill(label, 0, 0, col, 26, null, true), rx, ry + 80); };
  ring(0.305, T(133), T(138), GREEN, 'تایم‌فریم بالا'); ring(0.218, T(139), null, VIO, 'تایم‌فریم پایین');
  txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', CX, y + h + 60, 30, MUTE, { w: 600 }); popIn(t, T(129), () => pill('۲۵ فروردین ۱۴۰۴', 0, 0, VIO, 26, null, true), x + w - 140, y - 100);
  popIn(t, T(145), () => pill('تصمیم', 0, 0, VIO, 34, null, true), CX, y + h + 150); cv.restore(); }
// ---------- ۶ repeat until you know ----------
function repeatS(t) { const k = oCub(k01(t, T(147), 0.4)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; const a = t * 2.4; cv.save(); cv.translate(CX, 940); cv.rotate(a); cv.beginPath(); cv.arc(0, 0, 110, 0.3, Math.PI * 1.75); cv.strokeStyle = VIO; cv.lineWidth = 12; cv.lineCap = 'round'; cv.stroke();
  cv.beginPath(); cv.moveTo(110 * Math.cos(Math.PI * 1.75) + 26, 110 * Math.sin(Math.PI * 1.75) + 6); cv.lineTo(110 * Math.cos(Math.PI * 1.75), 110 * Math.sin(Math.PI * 1.75)); cv.lineTo(110 * Math.cos(Math.PI * 1.75) - 4, 110 * Math.sin(Math.PI * 1.75) + 28); cv.stroke(); cv.restore();
  rr(CX - 120, 910, 240, 64, 32, '#FFFFFF', 'rgba(0,0,0,0.15)', 2); txt('H1', CX + 60, 943, 28, P3, { w: 900, dir: 'ltr' }); line(CX - 26, 942, CX + 26, 942, P3, 4, [3, 8]); txt('M5', CX - 60, 943, 28, P3, { w: 900, dir: 'ltr' });
  const n = 10, tt = seqT(T(148), T(158), n); for (let i = 0; i < n; i++) { const q = oBack(k01(t, tt[i], 0.3)), bx = 900 - (i % 5) * 180, by = 1200 + Math.floor(i / 5) * 160; if (q <= 0) { rr(bx - 60, by - 60, 120, 120, 16, null, 'rgba(0,0,0,0.1)', 2); continue; } at(bx, by, q, 1, () => { rr(-60, -60, 120, 120, 16, '#F6F3FF', VIO, 2.5); txt('؟', 0, 0, 56, VIO, { w: 900 }); }); }
  popIn(t, T(157), () => pill('جواب می‌ده؟', 0, 0, VIO, 32, null, true), CX, 1560); cv.restore(); }
// ---------- ۷ the close and the end card ----------
function closeS(t) { const k = oBack(k01(t, T(161), 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(106,70,255,0.35)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; const s = 260 * k; cv.drawImage(IMG.icon, CX - s / 2, 860 - s / 2, s, s); cv.restore(); }
  const q = oCub(k01(t, T(161) + 0.15, 0.4)); txt('شروعش رایگانه', CX, 1100, 110, INK, { w: 900, alpha: q }); popIn(t, T(163), () => pill('لینک توی بیو', 0, 0, VIO, 52, null, true), CX, 1290); }
function endCard(t) { const k = oBack(k01(t, END + 0.05, 0.45)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(106,70,255,0.35)'; cv.shadowBlur = 50; const s = 220 * k; cv.drawImage(IMG.icon, CX - s / 2, 780 - s / 2, s, s); cv.restore(); }
  if (IMG.wordL) { const q = oCub(k01(t, END + 0.25, 0.4)), ww = 480, hh = (ww * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha *= q; cv.drawImage(IMG.wordL, CX - ww / 2, 950, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.5, 0.4)); txt('جهت از بالا، ورود از پایین؛ تستش کن', CX, 1190, 50, INK, { w: 900, alpha: f }); at(CX, 1320, 1, f, () => pill('شروعش رایگانه؛ لینک توی بیو', 0, 0, VIO, 34, null, true)); }

// ---------- the scenes (group: the same drawing carries on) and their words (indices in the voice) ----------
const SC = [
  { group: 'hook', t: 0, draw: hookS, lines: [L(300, 92, [['بیشتر', 0], ['تریدرها', 1], ['تایم‌فریم‌ها', [2, 3, 4], { c: VIO }], ['رو', 5]], { ghost: true }), L(410, 92, [['اشتباه', 6, { c: RED, bar: true }], ['با', 7], ['هم', 8], ['ترکیب', 9], ['می‌کنن.', [10, 11]]], { ghost: true })] },
  { group: 'hook', t: T(12), draw: hookS, lines: [L(300, 84, [['جهت', 12, { c: GREEN }], ['رو', 13], ['از', 14], ['روزانه', 15, { bar: true }], ['می‌گیرن،', [16, 17]]]), L(410, 84, [['ورود', 18, { c: VIO }], ['رو', 19], ['توی', 20], ['یک‌دقیقه', [21, 22], { bar: true }], ['می‌زنن…', [23, 24]]])] },
  { group: 'hook', t: T(25), draw: hookS, lines: [L(300, 80, [['و', 25], ['بعد', 26], ['تعجب', 27], ['می‌کنن', [28, 29]]]), L(410, 80, [['چرا', 30], ['هیچ‌چی', 31, { c: RED, bar: true }], ['با', 32], ['هم', 33], ['جور', 34], ['نیست.', 35]])] },
  { group: 'table', t: T(36), draw: tableS, lines: [L(360, 104, [['قانون', 36], ['ساده‌ست:', [37, 38], { c: VIO, bar: true }]])] },
  { group: 'table', t: T(39), draw: tableS, lines: [L(290, 74, [['تایم‌فریم', [39, 40]], ['بالا', 41, { c: GREEN, bar: true }], ['برای', 42], ['جهت', 43], ['و', 44], ['سطح‌های', [45, 46]], ['مهم،', 47]]), L(400, 74, [['تایم‌فریم', [48, 49]], ['پایین', 50, { c: VIO, bar: true }], ['برای', 51], ['ورود.', 52]])] },
  { group: 'table', t: T(53), draw: tableS, lines: [L(360, 88, [['ولی', 53], ['این', 54], ['دو تا', 55], ['باید', 56], ['با', 57], ['هم', 58], ['جفت', 59, { c: VIO, bar: true }], ['باشن.', 60]])] },
  { group: 'table', t: T(61), draw: tableS, lines: [L(360, 92, [['روزانه', 61, { c: P1 }], ['رو', 62], ['با', 63], ['یک‌ساعته', [64, 65], { c: P1, bar: true }], ['جفت', 66], ['کن.', 67]])] },
  { group: 'table', t: T(68), draw: tableS, lines: [L(360, 92, [['چهارساعته', [68, 69], { c: P2 }], ['رو', 70], ['با', 71], ['پونزده‌دقیقه.', [72, 73], { c: P2, bar: true }]])] },
  { group: 'table', t: T(74), draw: tableS, lines: [L(360, 92, [['یک‌ساعته', [74, 75], { c: P3 }], ['رو', 76], ['با', 77], ['پنج‌دقیقه.', [78, 79], { c: P3, bar: true }]])] },
  { group: 'table', t: T(80), draw: tableS, lines: [L(360, 92, [['پونزده‌دقیقه', [80, 81], { c: P4 }], ['رو', 82], ['با', 83], ['یک‌دقیقه.', [84, 85], { c: P4, bar: true }]])] },
  { group: 'ex', t: T(86), draw: exampleS, lines: [L(300, 82, [['مثلاً', 86], ['اگه', 87], ['توی', 88], ['یک‌ساعته', [89, 90], { c: P3, bar: true }]]), L(410, 82, [['جهتت', 91], ['نزولیه،', 92, { c: RED }]])] },
  { group: 'ex', t: T(93), draw: exampleS, lines: [L(300, 76, [['برو', 93], ['توی', 94], ['پنج‌دقیقه', [95, 96], { c: P3, bar: true }]]), L(410, 76, [['و', 97], ['فقط', 98], ['دنبال', 99], ['ورودِ', 100], ['فروش', 101, { c: RED, bar: true }], ['بگرد؛', 102]])] },
  { group: 'ex', t: T(103), draw: exampleS, lines: [L(300, 76, [['نه', 103], ['توی', 104], ['یه', 105], ['تایم‌فریم', [106, 107]], ['بی‌ربط،', [108, 109], { c: RED }]]), L(410, 76, [['نه', 110], ['خلاف', 111], ['جهت.', 112, { c: RED, bar: true }]])] },
  { group: 'many', t: T(113), draw: manyS, lines: [L(360, 104, [['ولی', 113], ['یه', 114], ['نکته:', 115, { c: VIO, bar: true }]])] },
  { group: 'many', t: T(116), draw: manyS, lines: [L(300, 84, [['یه', 116], ['مثال', 117], ['خوب', 118]]), L(420, 84, [['هیچ‌چی', 119, { c: RED }], ['رو', 120], ['ثابت', 121, { bar: true }], ['نمی‌کنه.', [122, 123]]])] },
  { group: 'replay', t: T(124), draw: replayS, lines: [L(300, 92, [['توی', 124], ['بک‌تست‌لب', [125, 126], { c: VIO }]]), L(420, 82, [['برو', 127], ['به', 128], ['گذشته،', 129, { bar: true }]])] },
  { group: 'replay', t: T(130), draw: replayS, lines: [L(300, 80, [['جهت', 130, { c: GREEN }], ['رو', 131], ['توی', 132]]), L(410, 80, [['تایم‌فریم', [133, 134]], ['بالا', 135, { c: GREEN, bar: true }], ['پیدا', 136], ['کن،', 137]])] },
  { group: 'replay', t: T(138), draw: replayS, lines: [L(280, 72, [['برو', 138], ['پایین', 139, { c: VIO, bar: true }], ['و', 140], ['قبل', 141], ['از', 142]]), L(380, 72, [['دیدن', 143], ['ادامه‌ش', 144]]), L(500, 88, [['تصمیم', 145, { c: VIO, bar: true }], ['بگیر.', 146]])] },
  { group: 'rep', t: T(147), draw: repeatS, lines: [L(300, 76, [['اون‌قدر', 147], ['تکرارش', 148, { c: VIO, bar: true }], ['کن', 149], ['تا', 150], ['ببینی', 151]]), L(410, 76, [['جفتِ', 152], ['تایم‌فریمت', [153, 154], { c: VIO }]]), L(520, 76, [['واقعاً', 155], ['برات', 156], ['جواب', 157, { bar: true }], ['می‌ده', 158], ['یا', 159], ['نه.', 160]])] },
  { t: T(161), draw: closeS, lines: [] },
  { t: END, draw: endCard, lines: [] },
];

// ---------- frame ----------
function frame(t) { cv.fillStyle = BG; cv.fillRect(0, 0, W, H); let k = 0; SC.forEach((s, i) => { if (t >= s.t) k = i; }); const s = SC[k], nx = SC[k + 1], pv = SC[k - 1], fadeIn = oCub(k01(t, s.t, 0.3)), fadeOut = nx ? 1 - k01(t, nx.t - 0.15, 0.15) : 1;
  const same = (a, b) => a && b && a.group && a.group === b.group, dIn = same(pv, s) ? 1 : fadeIn, dOut = same(nx, s) ? 1 : fadeOut;
  cv.save(); cv.globalAlpha = k === 0 ? dOut : Math.min(dIn, dOut); s.draw(t); cv.restore();
  s.lines.forEach((ln) => wordsLine(ln, t, k === 0 ? fadeOut : Math.min(fadeIn, fadeOut)));
  const pk = cl(t / END); cv.fillStyle = 'rgba(0,0,0,0.06)'; cv.fillRect(0, 0, W, 6); cv.fillStyle = VIO; cv.fillRect(W * (1 - pk), 0, W * pk, 6); }
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(11) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.wordL = await load(window.LOGO.wordL); })()]);
  frame(0); window.ready = true;
});
