// k31: «نکنه استراتژی سوددهت فقط توی ذهنت سوددهه؟» (dialog #2) as a clean fintech explainer, on the user's take at its
// normal speed (k27's timeline). Inspired by a reference reel's principles only: numbered sections, big right-aligned
// two-tone headlines that rise in word by word, one clear visual per section with a small footnote under it, and
// panels that alternate between light, dark and violet. Every element, word and step is BacktestLab's own:
//   ۰۱ the profit line that lives only in your head → ۰۲ a sample chart, the buy and the sell marked in hindsight →
//   ۰۳ dark: now you know what came next, back then you didn't (the real path gives way to simulated paths) →
//   ۰۴ placeholder strategies all turning «سودده» while the future is visible → ۰۵ violet: the rule, a test that
//   doesn't see the future → ۰۶ BacktestLab, then a Farvardin 1404 calendar where the 25th, the replay's real date, is
//   picked → ۰۷ dark: the real gold replay (k13's screens) moving forward, the future curtained, then buy or sell →
//   ۰۸ a ring filling to twenty trades for this week, then «سودده؟» → ۰۹ violet: the close and the end card.
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

// ---------- the sample candles (drawn, not real) ----------
const N = 44;
const OH = (() => { const o = []; let p = 100; for (let i = 0; i < N; i++) { const d = i < 12 ? -1.7 : i < 30 ? 2.1 : i < 36 ? -1.3 : 0.3, c = p + d + (rnd(i * 7 + 1) - 0.5) * 3.2; o.push({ o: p, c, h: Math.max(p, c) + rnd(i * 11 + 2) * 1.8, l: Math.min(p, c) - rnd(i * 13 + 3) * 1.8 }); p = c; } return o; })();
const argBy = (a, b, f) => { let k = a; for (let i = a; i < b; i++) if (f(OH[i]) > f(OH[k])) k = i; return k; };
const LOWI = argBy(0, 18, (d) => -d.l), HIGHI = argBy(18, 36, (d) => d.h), NI = LOWI + 1;
const vmin = Math.min(...OH.map((d) => d.l)) - 2, vmax = Math.max(...OH.map((d) => d.h)) + 2;
const CB = { x: 150, y: 870, w: 780, h: 450 };
const cxI = (i) => CB.x + ((i + 0.5) * CB.w) / N, cyV = (v) => CB.y + CB.h - ((v - vmin) / (vmax - vmin)) * CB.h;
function gridLines(P, B = CB) { for (let k = 0; k <= 4; k++) line(B.x, B.y + (B.h * k) / 4, B.x + B.w, B.y + (B.h * k) / 4, P.line, 2); }
function candles(t, t0, P, o = {}) { const bw = (CB.w / N) * 0.62;
  for (let i = 0; i < N; i++) { const k = oCub(k01(t, t0 + i * 0.022, 0.3)); if (k <= 0) continue; const d = OH[i], col = d.c >= d.o ? P.green : P.red, a = o.dimFrom != null && i > o.dimFrom ? o.dimA : 1; if (a <= 0.001) continue;
    cv.save(); cv.globalAlpha *= k * a; const x = cxI(i); line(x, cyV(d.h), x, cyV(d.l), col, 2.5); const y1 = cyV(Math.max(d.o, d.c)), y2 = cyV(Math.min(d.o, d.c)), hh = Math.max(4, y2 - y1); rr(x - bw / 2, (y1 + y2) / 2 - (hh * k) / 2, bw, Math.max(4, hh * k), 3, col); cv.restore(); } }
function marker(t, t0, i, s, col, up, P) { const k = oBack(k01(t, t0, 0.4)); if (k <= 0) return; const x = cxI(i), y = up ? cyV(OH[i].h) - 18 : cyV(OH[i].l) + 18;
  cv.save(); cv.beginPath(); cv.arc(x, y, 16 * k, 0, Math.PI * 2); cv.strokeStyle = col; cv.lineWidth = 5; cv.stroke(); cv.restore();
  at(x, up ? y - 62 : y + 62, k, 1, () => { const w = measure(s, 32, 800) + 46; rr(-w / 2, -28, w, 56, 28, col); txt(s, 0, 2, 32, '#FFFFFF'); }); }

// ---------- ۰۱ the profit line in your head ----------
function imagine(t, P) {
  card(100, 680, 880, 820, P); txt('بازدهی استراتژیت', 930, 750, 34, P.ink, { align: 'right', w: 700 }); chip('نمونه', 200, 750, P);
  const B = { x: 160, y: 850, w: 760, h: 460 }; gridLines(P, B);
  const pr = lerp(0.3, 1, oCub(k01(t, 0, 3.2))), pts = []; for (let i = 0; i <= 80 * pr; i++) { const u = i / 80; pts.push([B.x + u * B.w, B.y + B.h - 80 - u ** 1.7 * (B.h - 110) - Math.sin(u * 11) * 10 * u]); }
  path(pts, P.acc, 7, [18, 14]); const tip = pts[pts.length - 1]; circle(tip[0], tip[1], 12, P.acc); circle(tip[0], tip[1], 5, '#FFFFFF');
  const c = oBack(k01(t, T(5), 0.4)); at(Math.min(tip[0], 800), tip[1] - 70, c, 1, () => { const w = measure('توی ذهنت', 32, 800) + 48; rr(-w / 2, -30, w, 60, 30, P.acc); txt('توی ذهنت', 0, 2, 32, '#FFFFFF'); });
  const g = oCub(k01(t, T(6), 0.4)); if (g > 0) { cv.save(); cv.globalAlpha *= g; line(B.x, B.y + B.h - 10, B.x + 70, B.y + B.h - 10, P.mute, 7); circle(B.x + 70, B.y + B.h - 10, 9, P.mute); txt('؟', B.x + 116, B.y + B.h - 16, 52, P.mute, { w: 900 }); cv.restore(); }
  const ly = 1440; path([[930, ly], [880, ly]], P.acc, 6, [12, 10]); txt('تصور', 860, ly + 1, 28, P.ink, { align: 'right', w: 600 }); line(690, ly, 640, ly, P.mute, 6); txt('تست واقعی', 620, ly + 1, 28, P.ink, { align: 'right', w: 600, alpha: g > 0 ? 1 : 0.4 });
}
// ---------- ۰۲ the sample chart, marked in hindsight ----------
function past(t, P) { appear(oCub(k01(t, T(7) + 0.05, 0.5)), () => {
  card(100, 680, 880, 820, P); txt('نمودار نمونه', 930, 750, 34, P.ink, { align: 'right', w: 700 }); chip('گذشته', 200, 750, P); gridLines(P); candles(t, T(7) + 0.25, P);
  const b = oCub(k01(t, T(21) + 0.3, 0.5)); if (b > 0) { const x1 = cxI(LOWI), x2 = cxI(HIGHI), y1 = cyV(OH[LOWI].l), y2 = cyV(OH[HIGHI].h); cv.save(); cv.globalAlpha *= b * 0.12; cv.fillStyle = P.green; cv.fillRect(x1, y2, (x2 - x1) * b, y1 - y2); cv.restore(); path([[x1, y1 + 18], [lerp(x1, x2, b), lerp(y1 + 18, y2 - 18, b)]], P.green, 3, [6, 10]); }
  marker(t, T(18), LOWI, 'خرید', P.green, false, P); marker(t, T(21), HIGHI, 'فروش', P.red, true, P); }); }
// ---------- ۰۳ now you know, back then you didn't ----------
const FAN = Array.from({ length: 26 }, (_, j) => { const o = [OH[NI].c]; const drift = (rnd(j * 31 + 5) - 0.5) * 1.6; for (let i = NI + 1; i < N; i++) o.push(cl(o[o.length - 1] + drift + (rnd(j * 97 + i * 13) - 0.5) * 5.2, vmin + 1, vmax - 1)); return o; });
function nowThen(t, P) { appear(oCub(k01(t, T(24) + 0.05, 0.5)), () => {
  card(100, 680, 880, 820, P); const then = t >= T(32), sk = io(k01(t, T(32), 0.35));
  rr(300, 718, 480, 68, 34, P.chip); rr(lerp(540, 300, sk) + 6, 724, 234, 56, 28, P.acc); txt('الان', 660, 753, 30, sk < 0.5 ? '#FFFFFF' : P.mute, { w: 700 }); txt('اون موقع', 420, 753, 30, sk >= 0.5 ? '#FFFFFF' : P.mute, { w: 700 });
  gridLines(P); const xn = cxI(NI) + CB.w / N / 2; candles(t, -10, P, { dimFrom: NI, dimA: 1 - 0.94 * sk });
  line(xn, CB.y - 30, xn, CB.y + CB.h + 20, P.acc, 4); txt('همون لحظه', xn + 14, CB.y - 52, 26, P.acc, { align: 'right', w: 700 }); marker(t, -10, LOWI, 'خرید', P.green, false, P);
  const bq = oCub(k01(t, T(29), 0.4)) * (1 - sk); if (bq > 0) { cv.save(); cv.globalAlpha *= bq; cv.save(); cv.setLineDash([12, 10]); rr(xn + 14, CB.y - 20, CB.x + CB.w - xn - 4, CB.h + 30, 18, null, P.acc, 3); cv.restore(); chip('بعدش چی شد: معلومه', (xn + CB.x + CB.w) / 2 + 10, CB.y - 20, P, { fill: P.acc, col: '#FFFFFF', size: 24 }); cv.restore(); }
  if (then) { const g = oCub(k01(t, T(32) + 0.1, 0.9)); FAN.forEach((f, j) => { const m = Math.max(2, Math.floor(f.length * g)), pts = f.slice(0, m).map((v, i) => [cxI(NI + i), cyV(v)]); cv.save(); cv.globalAlpha *= 0.45; path(pts, j % 3 ? P.mute : P.acc, 3); cv.restore(); });
    const q = oCub(k01(t, T(34), 0.4)); at((xn + CB.x + CB.w) / 2 + 10, CB.y + 10, q, 1, () => chip('شبیه‌سازی: مسیرهای ممکن', 0, 0, P, { size: 24 })); txt('؟', (xn + CB.x + CB.w) / 2 + 10, CB.y + CB.h / 2, 160, P.ink, { w: 900, alpha: q * 0.9 }); } }); }
// ---------- ۰۴ placeholder strategies, all «سودده» while the future shows ----------
const STR = [['استراتژی الف', 0.9], ['استراتژی ب', 0.74], ['استراتژی ج', 0.84], ['استراتژی د', 0.62], ['استراتژی هـ', 0.88], ['استراتژی و', 0.7]];
function bars(t, P) { appear(oCub(k01(t, T(36) + 0.05, 0.5)), () => {
  card(100, 680, 880, 820, P); txt('روی نمودار گذشته', 930, 750, 34, P.ink, { align: 'right', w: 700 });
  const e = oCub(k01(t, T(39), 0.4)); if (e > 0) at(230, 750, e, 1, () => { rr(-110, -30, 220, 60, 30, 'rgba(106,70,255,0.10)'); eye(66, 0, 18, P.acc); txt('آینده: پیدا', -18, 1, 26, P.acc, { w: 700 }); });
  STR.forEach(([s, L], i) => { const y = 860 + i * 104, x0 = 690, len = 520 * L * oCub(k01(t, T(41) + i * 0.08, 0.6)), on = t >= T(43) + i * 0.09, g = oCub(k01(t, T(43) + i * 0.09, 0.3));
    txt(s, 930, y + 1, 32, P.ink, { align: 'right', w: 600 }); rr(x0 - 520, y - 28, 520, 56, 28, P.track); if (len > 1) rr(x0 - len, y - 28, len, 56, 28, on ? P.green : 'rgba(23,19,31,0.22)');
    if (g > 0 && len > 160) { cv.save(); cv.globalAlpha *= g; check(x0 - len + 40, y, 11, '#FFFFFF', 5); txt('سودده', x0 - len + 66, y + 1, 26, '#FFFFFF', { align: 'left', dir: 'ltr', w: 800 }); cv.restore(); } }); }); }
// ---------- ۰۵ the rule: a test that doesn't see the future ----------
const SER = (() => { const o = []; let p = 50; for (let i = 0; i < 70; i++) { p += (i < 14 ? -0.8 : i < 34 ? 1.2 : i < 46 ? -0.9 : 0.7) + (rnd(i * 5 + 9) - 0.5) * 2.4; o.push(p); } return o; })();
function rule(t, P) { const L_ = PAL.light; appear(oCub(k01(t, T(47) + 0.05, 0.5)), () => {
  card(100, 700, 880, 780, L_); txt('نمودار نمونه', 930, 770, 32, L_.ink, { align: 'right', w: 700 }); const B = { x: 150, y: 860, w: 780, h: 520 }; gridLines(L_, B);
  const lo = Math.min(...SER) - 3, hi = Math.max(...SER) + 3, pts = SER.map((v, i) => [B.x + (i / (SER.length - 1)) * B.w, B.y + B.h - ((v - lo) / (hi - lo)) * B.h]);
  cv.save(); const g = cv.createLinearGradient(0, B.y, 0, B.y + B.h); g.addColorStop(0, 'rgba(106,70,255,0.28)'); g.addColorStop(1, 'rgba(106,70,255,0)'); cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.lineTo(B.x + B.w, B.y + B.h); cv.lineTo(B.x, B.y + B.h); cv.closePath(); cv.fillStyle = g; cv.fill(); cv.restore(); path(pts, '#6A46FF', 6);
  line(CX, B.y - 20, CX, B.y + B.h + 10, L_.ink, 3, [10, 10]); txt('لحظه‌ی تصمیم', CX + 14, B.y + B.h + 48, 26, L_.ink, { align: 'right', w: 700 });
  const c = io(k01(t, T(51), 0.5)); if (c > 0) { cv.save(); cv.beginPath(); cv.roundRect(100, 700, 880, 780, 36); cv.clip(); const x = lerp(980, CX + 4, c); cv.fillStyle = '#F1EDFF'; cv.fillRect(x, 700, 980 - x, 780); cv.strokeStyle = 'rgba(106,70,255,0.10)'; cv.lineWidth = 10; for (let k = -800; k < 800; k += 44) { cv.beginPath(); cv.moveTo(x + k, 700); cv.lineTo(x + k + 780, 1480); cv.stroke(); }
    eye(x + (980 - x) / 2, 1040, 46, '#6A46FF', true); txt('آینده: مخفی', x + (980 - x) / 2, 1140, 44, '#6A46FF', { w: 900 }); cv.restore(); } }); }
// ---------- ۰۶ BacktestLab, then the replay's real date ----------
const TCLK = T(63) + 0.1, TBTN = T(63) + 0.8;
function brand(t, P) { const out = io(k01(t, T(58), 0.4)), k = oBack(k01(t, T(54) + 0.05, 0.5));
  if (out < 1) { cv.save(); cv.globalAlpha *= 1 - out; cv.translate(0, -160 * out);
    for (let r = 0; r < 3; r++) { const q = k01(t, T(54) + 0.15 + r * 0.25, 1.4); if (q > 0 && q < 1) { cv.save(); cv.globalAlpha *= (1 - q) * 0.6; cv.beginPath(); cv.arc(CX, 1000, 150 + q * 300, 0, Math.PI * 2); cv.strokeStyle = P.acc; cv.lineWidth = 4; cv.stroke(); cv.restore(); } }
    if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(106,70,255,0.45)'; cv.shadowBlur = 70; cv.shadowOffsetY = 20; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 1000 - s / 2, s, s); cv.restore(); }
    if (IMG.wordL) { const q = oCub(k01(t, T(54) + 0.35, 0.4)), ww = 520, hh = (ww * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha *= q; cv.drawImage(IMG.wordL, CX - ww / 2, 1220, ww, hh); cv.restore(); } cv.restore(); }
  calendar(t, P); }
function dayPos(d) { const i = d + 5; return [900 - (i % 7) * 120, 950 + Math.floor(i / 7) * 88]; }   // 1 Farvardin 1404 was a Friday; the week starts on Saturday, at the right
function calendar(t, P) { appear(oCub(k01(t, T(58) + 0.15, 0.5)), () => {
  card(120, 690, 840, 860, P); txt('فروردین ۱۴۰۴', 900, 765, 44, P.ink, { align: 'right', w: 800 }); path([[200, 750], [186, 765], [200, 780]], P.mute, 4); path([[250, 750], [264, 765], [250, 780]], P.mute, 4);
  ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].forEach((d, c) => txt(d, 900 - c * 120, 860, 30, P.mute, { w: 600 }));
  const sel = oBack(k01(t, TCLK, 0.3));
  for (let d = 1; d <= 31; d++) { const [x, y] = dayPos(d); const on = d === 25 && sel > 0; if (on) circle(x, y, 40 * sel, P.acc); txt(fa(d), x, y + 2, 36, on ? '#FFFFFF' : P.ink, { w: on ? 800 : 500 }); }
  const bp = t >= TBTN ? 1 - 0.06 * Math.sin(Math.PI * k01(t, TBTN, 0.25)) : 1; at(CX, 1470, bp, 1, () => { rr(-250, -42, 500, 84, 42, sel > 0 ? P.acc : 'rgba(106,70,255,0.35)'); txt(sel > 0 ? 'برو به ۲۵ فروردین' : 'یه روز رو انتخاب کن', 0, 2, 32, '#FFFFFF', { w: 700 }); });
  const [dx, dy] = dayPos(25), c0 = k01(t, T(60) - 0.2, 0.25); if (c0 > 0) { const m1 = io(k01(t, T(60), TCLK - 0.15 - T(60))), m2 = io(k01(t, TCLK + 0.25, TBTN - 0.1 - TCLK - 0.25)); let x = lerp(860, dx, m1), y = lerp(1560, dy, m1); x = lerp(x, CX + 60, m2); y = lerp(y, 1470, m2);
    const press = Math.max(Math.sin(Math.PI * k01(t, TCLK - 0.05, 0.22)), Math.sin(Math.PI * k01(t, TBTN - 0.05, 0.22))); cv.save(); cv.globalAlpha *= cl(c0 * 4); cursor(x, y, press); cv.restore(); } }); }
// ---------- ۰۷ the real replay ----------
const SCR = [20, 140, 1540, 1000], KEYS = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`);
function replay(t, P) { appear(oCub(k01(t, T(64) + 0.05, 0.5)), () => { const x = 60, y = 680, w = 960, sh = (w * SCR[3]) / SCR[2];
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 60; cv.shadowOffsetY = 20; rr(x, y, w, 56 + sh + 64, 28, '#1F1B2B'); cv.restore(); rr(x, y, w, 56 + sh + 64, 28, null, 'rgba(255,255,255,0.10)', 2);
  ['#FF6B6B', '#FFC14D', '#3DDC84'].forEach((c, i) => circle(x + 40 + i * 30, y + 28, 8, c)); rr(CX - 170, y + 12, 340, 34, 17, 'rgba(255,255,255,0.07)'); txt('بک‌تست‌لب، بازپخش', CX, y + 30, 22, P.mute, { w: 600 });
  const f = cl((t - T(66)) / (T(76) - T(66))), im = IMG[KEYS[Math.min(15, Math.floor(f * 16))]], sy = y + 56;
  if (im) { cv.save(); cv.beginPath(); cv.rect(x, sy, w, sh); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, sy, w, sh);
    const cu = oCub(k01(t, T(74), 0.45)); if (cu > 0) { const cx0 = x + w * 0.62; cv.globalAlpha *= cu; const g = cv.createLinearGradient(cx0, 0, cx0 + w * 0.12, 0); g.addColorStop(0, 'rgba(17,15,24,0)'); g.addColorStop(1, 'rgba(17,15,24,0.97)'); cv.fillStyle = g; cv.fillRect(cx0, sy, w * 0.38, sh); eye(x + w * 0.86, sy + sh / 2 - 40, 34, P.acc, true); txt('آینده', x + w * 0.86, sy + sh / 2 + 40, 40, P.acc, { w: 800 }); } cv.restore(); }
  const by = sy + sh + 32; cv.save(); cv.beginPath(); cv.moveTo(x + 36, by - 13); cv.lineTo(x + 36, by + 13); cv.lineTo(x + 58, by); cv.closePath(); cv.fillStyle = P.ink; cv.fill(); cv.restore(); rr(x + 84, by - 4, w - 124, 8, 4, P.track); rr(x + 84, by - 4, (w - 124) * f, 8, 4, P.acc); circle(x + 84 + (w - 124) * f, by, 11, P.acc);
  const b = oBack(k01(t, T(76), 0.4)); at(CX + 230, 1505, b, 1, () => { rr(-200, -52, 400, 104, 52, P.green); txt('خرید', 0, 3, 46, '#0B2418', { w: 900 }); }); at(CX - 230, 1505, b, 1, () => { rr(-200, -52, 400, 104, 52, P.red); txt('فروش', 0, 3, 46, '#2A0A0D', { w: 900 }); }); }); }
// ---------- ۰۸ twenty trades this week ----------
function ring(t, P) { appear(oCub(k01(t, T(78) + 0.05, 0.5)), () => { const cx = CX, cy = 1110, R = 300, th = 62, n = Math.floor(20 * oCub(k01(t, T(80), 1.4)) + 1e-6), q = oCub(k01(t, T(85), 0.4));
  chip('چالش این هفته', CX, 700, P, { fill: 'rgba(106,70,255,0.10)', col: P.acc, size: 28 });
  for (let i = 0; i < 20; i++) { const a0 = -Math.PI / 2 + (i / 20) * Math.PI * 2 + 0.035, a1 = -Math.PI / 2 + ((i + 1) / 20) * Math.PI * 2 - 0.035; cv.beginPath(); cv.arc(cx, cy, R, a0, a1); cv.strokeStyle = i < n ? P.acc : P.track; cv.lineWidth = th; cv.stroke(); }
  txt(fa(n), cx, cy - 30, 190, P.ink, { w: 900, alpha: 1 - q }); txt('معامله', cx, cy + 100, 44, P.mute, { w: 700, alpha: 1 - q }); at(cx, cy, lerp(0.8, 1, q), q, () => txt('سودده؟', 0, 0, 104, P.acc, { w: 900 })); }); }
// ---------- ۰۹ the close and the end card ----------
function close_(t, P) { const k = oBack(k01(t, T(91) + 0.05, 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(20,8,60,0.45)'; cv.shadowBlur = 80; cv.shadowOffsetY = 24; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 980 - s / 2, s, s); cv.restore(); }
  const p = oBack(k01(t, T(93), 0.4)); at(CX, 1300, p, 1, () => { rr(-280, -64, 560, 128, 64, '#FFFFFF'); txt('لینک توی بیو', 0, 4, 56, '#5430E6', { w: 900 }); }); }
function endCard(t, P) { const k = oBack(k01(t, END + 0.05, 0.45)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = 'rgba(20,8,60,0.45)'; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 740 - s / 2, s, s); cv.restore(); }
  if (IMG.word) { const q = oCub(k01(t, END + 0.25, 0.4)), ww = 500, hh = (ww * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= q; cv.drawImage(IMG.word, CX - ww / 2, 920, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.5, 0.4)); txt('آینده رو نبین، تست کن', CX, 1200, 66, '#FFFFFF', { w: 900, alpha: f }); at(CX, 1340, 1, f, () => { rr(-330, -48, 660, 96, 48, '#FFFFFF'); txt('شروعش رایگانه؛ لینک توی بیو', 0, 3, 36, '#5430E6', { w: 800 }); }); }

// ---------- the sections: their panel, number, headline pages (words with their index in the voice) and footnotes ----------
const SC = [
  { t: 0, th: 'light', num: '۰۱', label: 'فرضیه', draw: imagine, foot: [[-1, 'نمونه؛ خط‌چین یعنی تصور، نه نتیجه‌ی تست']],
    pages: [{ t: 0, ghost: true, lines: [[['نکنه', 0], ['استراتژی', 1], ['سوددهت', 2, 1]], [['فقط', 3], ['توی', 4], ['ذهنت', 5, 1], ['سوددهه؟', 6]]] }] },
  { t: T(7), th: 'light', num: '۰۲', label: 'نگاه به گذشته', draw: past, foot: [[T(7) + 0.4, 'نمودار نمونه، نه قیمت واقعی'], [T(18), 'علامت‌ها بعد از دیدن کل نمودار گذاشته شدن']],
    pages: [{ t: T(7), lines: [[['یه', 7], ['چارت', 8], ['گذشته', 9, 1]], [['رو', 10], ['باز', 11], ['کن.', 12]]] },
      { t: T(13), lines: [[['ورودها', 13], ['چقدر', 14]], [['واضحن،', [15, 16], 1], ['نه؟', 17]], { s: 44, w: 600, mute: 1, k: [['اینجا', 18], ['می‌خریدم،', [19, 20]], ['اینجا', 21], ['می‌فروختم.', [22, 23]]] }] }] },
  { t: T(24), th: 'dark', num: '۰۳', label: 'الان و اون موقع', draw: nowThen, foot: [[T(24) + 0.4, 'الان کل نمودار جلوی چشمته'], [T(32), 'خط‌های خاکستری شبیه‌سازی‌اند، نه داده‌ی واقعی']],
    pages: [{ t: T(24), lines: [[['ولی', 24], ['تو', 25], ['الان', 26, 1]], [['می‌دونی', [27, 28]], ['بعدش', 29], ['چی', 30], ['شد.', 31]]] },
      { t: T(32), lines: [[['اون', 32], ['موقع', 33, 1]], [['نمی‌دونستی.', [34, 35]]]] }] },
  { t: T(36), th: 'light', num: '۰۴', label: 'تله‌ی آینده‌ی پیدا', draw: bars, foot: [[T(36) + 0.4, 'استراتژی‌ها نمونه‌اند؛ طول میله‌ها عدد واقعی نیست']],
    pages: [{ t: T(36), lines: [[['روی', 36], ['چارتی', 37], ['که', 38]], [['آینده‌ش', 39, 1], ['پیداست،', 40]]] },
      { t: T(41), lines: [[['هر', 41], ['استراتژی‌ای', 42]], [['سودده', 43, 1], ['به', 44], ['نظر', 45], ['میاد.', 46]]] }] },
  { t: T(47), th: 'violet', num: '۰۵', label: 'قانون تست', draw: rule, foot: [[T(47) + 0.4, 'نمودار نمونه؛ شرط یه تست منصفانه']],
    pages: [{ t: T(47), lines: [[['تست', 47], ['واقعی', 48, 1], ['وقتیه', 49]], [['که', 50], ['آینده', 51, 1], ['رو', 52], ['نبینی.', 53]]] }] },
  { t: T(54), th: 'light', num: '۰۶', label: 'بک‌تست‌لب', draw: brand, foot: [[T(58) + 0.4, 'تاریخ واقعیِ بازپخشی که بعدش می‌بینی']],
    pages: [{ t: T(54), lines: [[['بک‌تست‌لب', [54, 55], 1]], [['دقیقاً', 56], ['همینه.', 57]]] },
      { t: T(58), lines: [[['می‌ری', 58], ['به', 59], ['یه', 60], ['روز', 61]], [['از', 62], ['گذشته،', 63, 1]]] }] },
  { t: T(64), th: 'dark', num: '۰۷', label: 'بازپخش', draw: replay, foot: [[T(64) + 0.4, 'صفحه‌ی واقعی بک‌تست‌لب؛ بازپخش طلا']],
    pages: [{ t: T(64), lines: [[['بازار', 64], ['از', 65], ['همون‌جا', 66]], [['جلو', 67], ['میاد،', 68, 1]]] },
      { t: T(69), lines: [[['و', 69], ['تو', 70], ['باید', 71], ['قبل', 72], ['از', 73], ['دیدن', 74]], [['ادامه‌ش', 75], ['تصمیم', 76, 1], ['بگیری.', 77, 1]]] }] },
  { t: T(78), th: 'light', num: '۰۸', label: 'چالش هفته', draw: ring, foot: [[T(78) + 0.4, 'هدف این هفته: ۲۰ معامله توی بازپخش'], [T(85), 'جوابش رو فقط تست نشون می‌ده']],
    pages: [{ t: T(78), lines: [[['این', 78], ['هفته', 79], ['۲۰', 80, 1], ['تا', 80, 1]], [['معامله', 81], ['این‌طوری', 82], ['بگیر', 83]]] },
      { t: T(85), lines: [[['و', 84], ['ببین', 85], ['هنوز', 86]], [['سودده', 87, 1], ['هست', 88], ['یا', 89], ['نه.', 90]]] }] },
  { t: T(91), th: 'violet', num: '۰۹', label: 'شروع', draw: close_, pages: [{ t: T(91), lines: [[['شروعش', 91]], [['رایگانه.', 92, 1]]] }] },
  { t: END, th: 'violet', fade: true, draw: endCard, pages: [] },
];

// ---------- headlines: right-aligned, two-tone, each word rising out of a mask at its word ----------
function headline(pg, nx, t, P) { const out = nx ? io(k01(t, nx.t - 0.12, 0.3)) : 0; if (out >= 1) return; let y = 300;
  pg.lines.forEach((ln) => { const o = Array.isArray(ln) ? { k: ln } : ln, base = o.s ?? 100, wt = o.w ?? 900, gf = 0.26; if (o.s) y += 14;
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
function progress(t, k, P) { const n = 9, gap = 10, w = (960 - gap * (n - 1)) / n; for (let i = 0; i < n; i++) { const x = 1020 - (i + 1) * w - i * gap, f = i < k ? 1 : i > k ? 0 : cl((t - SC[i].t) / (SC[i + 1].t - SC[i].t)); const light = P.theme === 'light';
  rr(x, 84, w, 8, 4, light ? 'rgba(23,19,31,0.12)' : 'rgba(255,255,255,0.22)'); if (f > 0) rr(x + w * (1 - f), 84, w * f, 8, 4, light ? '#17131F' : '#FFFFFF'); } }
function frame(t) { let k = 0; SC.forEach((s, i) => { if (t >= s.t) k = i; }); const s = SC[k], tr = k ? io(k01(t, s.t, 0.5)) : 1;
  if (tr < 1) { if (s.fade) { drawSection(k - 1, t); cv.save(); cv.globalAlpha = tr; drawSection(k, t); cv.restore(); }
    else { cv.save(); cv.translate(0, -200 * tr); drawSection(k - 1, t); cv.restore(); cv.fillStyle = `rgba(0,0,0,${0.35 * tr})`; cv.fillRect(0, 0, W, H); const y = H * (1 - tr);
      cv.save(); cv.translate(0, y); cv.shadowColor = 'rgba(0,0,0,0.35)'; cv.shadowBlur = 60; cv.shadowOffsetY = -12; cv.beginPath(); cv.roundRect(0, 0, W, H + 80, [56, 56, 0, 0]); cv.fillStyle = PAL[s.th].bg; cv.fill(); cv.shadowColor = 'transparent'; cv.clip(); drawSection(k, t); cv.restore(); } }
  else drawSection(k, t);
  progress(t, Math.min(k, 9), PAL[(tr > 0.5 ? s : SC[Math.max(0, k - 1)]).th]); }
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(6) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['500', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); IMG.wordL = await load(window.LOGO.wordL); })()]);
  frame(0); window.ready = true;
});
