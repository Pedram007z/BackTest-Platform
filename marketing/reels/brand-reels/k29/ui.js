// k29 · «نکنه استراتژی سوددهت فقط توی ذهنت سوددهه؟» (dialog #2) as a UI motion study, on the user's take at its normal
// speed (k27's timeline). Inspired by a reference reel's principles only (one object on a light ground that keeps
// morphing into the next, a cursor driving it, motion blur on fast moves, a calm monochrome look); the components and the
// story are BacktestLab's own:
//   a question bar whose results answer «توی ذهنت: سودده / توی تست: ؟» → a «باز کردن چارت» button → a chart card (a
//   sample, labelled) where the cursor marks the buy and the sell in hindsight → a «نمایش آینده» switch, on, then off
//   (the future turns to a dashed «؟») → three placeholder strategies all flipping to «سودده» → a «با آینده | بدون آینده»
//   control sliding to «بدون آینده» → the BacktestLab icon → a date picker landing on the replay's real date, ۲۵ فروردین
//   ۱۴۰۴ → a replay card playing the real gold replay (k13's screens) with the future curtained off → buy and sell
//   buttons → a counter for the week's twenty trades, «سودده؟» still loading → a «شروع رایگان» button that loads, ticks
//   and opens to «لینک توی بیو» → the end card.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], END = D.end, DUR = D.dur;
const VT = window.THEME === 'violet';   // the violet version: the ground in the logo's gradient (#9273FF → #5430E6)
const BG = '#EDECE8', CARD = '#FFFFFF', INK = '#0E0E10', GREY = '#8D8C93', LINE = '#E6E5E1', LIME = '#C6F24E', VIO = '#6C47FF', GREEN = '#1FB574', RED = '#EE4458', SOFT = '#F4F3F0';
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - cl(k)) ** 3, io = (k) => { k = cl(k); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
const oBack = (k) => { const c = 1.5; k = cl(k); return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fa = (n) => Math.round(n).toLocaleString('fa-IR');
const IMG = {};
const font = (s, w = 800) => `${w} ${s}px Vazirmatn`;
function txt(s, x, y, size, col, o = {}) { cv.save(); cv.font = font(size, o.w ?? 800); cv.direction = o.dir ?? 'rtl'; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.globalAlpha *= o.alpha ?? 1; cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 800) { cv.font = font(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 2) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2)); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function line(x1, y1, x2, y2, col, lw, dash) { cv.save(); cv.beginPath(); if (dash) cv.setLineDash(dash); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.stroke(); cv.restore(); }
function pill(s, x, y, size, bg, fg, o = {}) { const w = (o.w ?? measure(s, size)) + size * 1.1, h = size * 1.9; rr(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, 2); txt(s, x, y + size * 0.06, size, fg); return w; }
const mix = (a, b, k) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };
const T = (i) => ws(i) - 0.07;

// ---------- the sample chart (a dip, a rally to a top, then the future) ----------
const SER = (() => { const out = []; let p = 50; for (let i = 0; i < 80; i++) { const d = i < 14 ? -1.1 : i < 34 ? 1.7 : i < 46 ? -1.2 : i < 60 ? 0.9 : -1.0; p += d + (rnd(i * 7) - 0.5) * 2.4; out.push(p); } return out; })();
const LOWI = SER.slice(0, 24).indexOf(Math.min(...SER.slice(0, 24))), HIGHI = 24 + SER.slice(24, 46).indexOf(Math.max(...SER.slice(24, 46))), NOWI = 48;
const smin = Math.min(...SER) - 4, smax = Math.max(...SER) + 4;

// ---------- the morphing object: one state after another ----------
// each state: [start, box {w, h, r, y}, fill, draw(t, a, b)]; the box morphs from the previous one over MORPH seconds
const MORPH = 0.5;
const S = [];
const state = (t, w, h, r, fill, draw, y = 1080) => S.push({ t, b: { w, h, r, y }, fill, draw });
function cur(t) { let k = 0; S.forEach((s, i) => { if (t >= s.t) k = i; }); return k; }

// 0 · the question bar, then its two answers
state(0, 940, 170, 85, CARD, (t, a, b) => { const typed = 'استراتژی من سودده‌ست؟', n = Math.floor(cl((t - 0.25) / 1.6) * typed.length), s = typed.slice(0, n);
  cv.save(); cv.globalAlpha *= a; cv.strokeStyle = GREY; cv.lineWidth = 6; cv.beginPath(); cv.arc(b.w / 2 - 78, -b.h / 2 + 80, 18, 0, Math.PI * 2); cv.stroke(); line(b.w / 2 - 64, -b.h / 2 + 94, b.w / 2 - 50, -b.h / 2 + 108, GREY, 6);
  txt(s, b.w / 2 - 128, -b.h / 2 + 86, 54, n ? INK : GREY, { align: 'right' }); const cw = measure(s, 54); if (Math.floor(t * 2.2) % 2 === 0) line(b.w / 2 - 138 - cw, -b.h / 2 + 58, b.w / 2 - 138 - cw, -b.h / 2 + 114, INK, 3);
  if (b.h > 220) { line(-b.w / 2 + 40, -b.h / 2 + 170, b.w / 2 - 40, -b.h / 2 + 170, LINE, 2);
    [['توی ذهنت', 'سودده ✓', GREEN, ws(5)], ['توی تست', 'تست نشده', GREY, ws(6)]].forEach(([l, v, c, t0], i) => { const q = oCub(k01(t, t0 - 0.05, 0.3)), y = -b.h / 2 + 265 + i * 140; if (q <= 0) return;
      cv.save(); cv.globalAlpha *= q; cv.translate(0, (1 - q) * 20); rr(-b.w / 2 + 30, y - 60, b.w - 60, 120, 30, i === 0 ? SOFT : null); txt(l, b.w / 2 - 70, y, 52, INK, { align: 'right' }); pill(v, -b.w / 2 + 190, y, 40, c === GREY ? '#E9E8E4' : c, c === GREY ? GREY : '#FFFFFF'); cv.restore(); }); }
  cv.restore(); });
state(T(4), 940, 500, 52, CARD, (t, a, b) => S[0].draw(t, a, b));
// 1 · «باز کردن چارت»
state(T(7), 620, 160, 80, INK, (t, a, b) => { cv.save(); cv.globalAlpha *= a; txt('باز کردن چارت', 36, 4, 56, '#FFFFFF'); cv.strokeStyle = '#FFFFFF'; cv.lineWidth = 5; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-240, 24); cv.lineTo(-218, -2); cv.lineTo(-198, 12); cv.lineTo(-170, -24); cv.stroke(); cv.restore(); });
// 2 · the chart card; the cursor marks the buy and the sell in hindsight; the «نمایش آینده» switch
function chart(t, a, b, o = {}) { const x0 = -b.w / 2 + 50, x1 = b.w / 2 - 50, y0 = -b.h / 2 + 170, y1 = o.y1 ?? b.h / 2 - 60, px = (i) => lerp(x0, x1, i / (SER.length - 1)), py = (v) => lerp(y1, y0, (v - smin) / (smax - smin));
  cv.save(); cv.globalAlpha *= a; txt('چارت گذشته', b.w / 2 - 50, -b.h / 2 + 70, 56, INK, { align: 'right', w: 900 }); txt('نمودار نمونه', b.w / 2 - 50, -b.h / 2 + 126, 34, GREY, { align: 'right', w: 600 });
  const n = Math.max(2, Math.floor(cl(o.draw ?? 1) * SER.length)), fut = o.future ?? 1, cut = fut >= 1 ? n : Math.min(n, NOWI + 1);
  const grad = cv.createLinearGradient(0, y0, 0, y1); grad.addColorStop(0, 'rgba(14,14,16,0.10)'); grad.addColorStop(1, 'rgba(14,14,16,0)');
  cv.beginPath(); cv.moveTo(px(0), y1); for (let i = 0; i < cut; i++) cv.lineTo(px(i), py(SER[i])); cv.lineTo(px(cut - 1), y1); cv.closePath(); cv.fillStyle = grad; cv.fill();
  cv.beginPath(); for (let i = 0; i < cut; i++) i ? cv.lineTo(px(i), py(SER[i])) : cv.moveTo(px(i), py(SER[i])); cv.strokeStyle = INK; cv.lineWidth = 7; cv.lineJoin = 'round'; cv.stroke();
  if (fut < 1 && n > NOWI) { cv.save(); cv.globalAlpha *= 1 - fut; cv.setLineDash([10, 12]); cv.beginPath(); for (let i = NOWI; i < n; i++) i > NOWI ? cv.lineTo(px(i), lerp(py(SER[NOWI]), py(SER[NOWI]), 0)) : cv.moveTo(px(i), py(SER[i])); cv.strokeStyle = '#C9C8C3'; cv.lineWidth = 5; cv.stroke(); cv.restore();
    cv.save(); cv.globalAlpha *= fut; cv.beginPath(); for (let i = NOWI; i < n; i++) i > NOWI ? cv.lineTo(px(i), py(SER[i])) : cv.moveTo(px(i), py(SER[i])); cv.strokeStyle = INK; cv.lineWidth = 6; cv.stroke(); cv.restore();
    const q = 1 - fut; if (q > 0.5) pill('؟', (px(NOWI) + px(SER.length - 1)) / 2, py(SER[NOWI]) - 70, 40, '#E9E8E4', GREY); }
  if (o.nowLine) { cv.save(); cv.globalAlpha *= o.nowLine; line(px(NOWI), y0 - 10, px(NOWI), y1, '#BDBCB6', 3, [6, 8]); txt('اون موقع', px(NOWI), y0 - 34, 28, GREY, { w: 700 }); cv.restore(); }
  if (o.hl) { cv.save(); cv.globalAlpha *= o.hl; cv.fillStyle = 'rgba(198,242,78,0.22)'; cv.fillRect(px(NOWI), y0 - 10, x1 - px(NOWI) + 20, y1 - y0 + 10); cv.restore(); }
  const tip = (i, s, col, k, up) => { if (k <= 0) return; const x = px(i), y = py(SER[i]); circle(x, y, 13 * oBack(k), col); circle(x, y, 6, '#FFFFFF'); cv.save(); cv.globalAlpha *= cl(k * 2); const ty = up ? y - 80 : y + 80; rr(x - 92, ty - 40, 184, 80, 40, INK); txt(s, x, ty + 3, 42, '#FFFFFF'); cv.restore(); };
  tip(LOWI, 'خرید', GREEN, k01(t, T(18), 0.3), false); tip(HIGHI, 'فروش', RED, k01(t, T(21), 0.3), true);
  cv.restore(); return { px, py }; }
state(T(11) + 0.18, 940, 820, 48, CARD, (t, a, b) => chart(t, a, b, { draw: k01(t, T(11) + 0.4, 0.9) }));
state(T(24), 940, 980, 48, CARD, (t, a, b) => { const on = t < T(33) + 0.05, k = on ? 1 : 1 - oCub(k01(t, T(33) + 0.05, 0.35));
  chart(t, a, b, { y1: b.h / 2 - 210, future: k, nowLine: oCub(k01(t, T(26), 0.3)), hl: on ? 0.6 * oCub(k01(t, T(26), 0.3)) : 0 });
  cv.save(); cv.globalAlpha *= a; line(-b.w / 2 + 40, b.h / 2 - 160, b.w / 2 - 40, b.h / 2 - 160, LINE, 2); txt('نمایش آینده', b.w / 2 - 60, b.h / 2 - 80, 52, INK, { align: 'right' });
  const sx = -b.w / 2 + 160; rr(sx - 80, b.h / 2 - 124, 160, 88, 44, mix('#D9D8D3', LIME.toUpperCase(), k)); circle(lerp(sx - 36, sx + 36, k), b.h / 2 - 80, 35, '#FFFFFF'); cv.restore(); });
// 3 · every strategy looks profitable when the future is visible
state(T(36), 940, 800, 48, CARD, (t, a, b) => { cv.save(); cv.globalAlpha *= a; txt('آینده: معلوم', b.w / 2 - 50, -b.h / 2 + 80, 52, INK, { align: 'right', w: 900 }); pill('نمایش آینده روشن', -b.w / 2 + 200, -b.h / 2 + 80, 32, LIME, INK);
  ['استراتژی الف', 'استراتژی ب', 'استراتژی ج'].forEach((s, i) => { const y = -b.h / 2 + 240 + i * 185, q = oCub(k01(t, T(41) + i * 0.1, 0.3)); if (q <= 0) return; cv.save(); cv.globalAlpha *= q; cv.translate(0, (1 - q) * 24);
    rr(-b.w / 2 + 30, y - 74, b.w - 60, 148, 34, SOFT); txt(s, b.w / 2 - 70, y, 50, INK, { align: 'right' }); cv.beginPath(); for (let k = 0; k <= 12; k++) { const x = -40 + k * 14, yy = y + 22 - k * 3.4 + Math.sin(k * 1.7 + i) * 8; k ? cv.lineTo(x, yy) : cv.moveTo(x, yy); } cv.strokeStyle = INK; cv.lineWidth = 4; cv.stroke();
    const f = oCub(k01(t, T(43) + i * 0.16, 0.3)); pill(f > 0.5 ? 'سودده ✓' : '…', -b.w / 2 + 175, y, 38, f > 0.5 ? GREEN : '#E9E8E4', f > 0.5 ? '#FFFFFF' : GREY, { w: measure('سودده ✓', 38) }); cv.restore(); }); cv.restore(); });
// 4 · «با آینده | بدون آینده»
state(T(47), 900, 170, 85, CARD, (t, a, b) => { const k = io(k01(t, T(53), 0.4)), segW = (b.w - 24) / 2; cv.save(); cv.globalAlpha *= a; rr(lerp(12, -segW - 12 + 24, k) - 0, -b.h / 2 + 12, segW, b.h - 24, (b.h - 24) / 2, INK);
  txt('با آینده', b.w / 4, 4, 52, mix('#FFFFFF', '#8D8C93', k)); txt('بدون آینده', -b.w / 4, 4, 52, mix('#8D8C93', '#FFFFFF', k)); cv.restore(); });
// 5 · the BacktestLab icon
state(T(54), 340, 340, 94, VT ? CARD : VIO, (t, a, b) => { if (IMG.icon) { cv.save(); cv.globalAlpha *= a; const z = VT ? 0.76 : 1; cv.drawImage(IMG.icon, -b.w * z / 2, -b.h * z / 2, b.w * z, b.h * z); cv.restore(); } }, 1060);
// 6 · the date picker: ۲۵ فروردین ۱۴۰۴ (a Monday; 1 Farvardin 1404 was a Friday)
state(T(58), 900, 1000, 48, CARD, (t, a, b) => { cv.save(); cv.globalAlpha *= a; const picked = t >= T(61) + 0.1, title = t >= T(63) ? '۲۵ فروردین ۱۴۰۴' : 'فروردین ۱۴۰۴';
  txt(title, b.w / 2 - 60, -b.h / 2 + 84, 54, INK, { align: 'right', w: 900 }); txt('برو به', -b.w / 2 + 100, -b.h / 2 + 84, 40, GREY, { w: 700 });
  const days = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'], cw = (b.w - 80) / 7, gx = (c) => b.w / 2 - 40 - cw * (c + 0.5), gy = (r) => -b.h / 2 + 300 + r * 122;
  days.forEach((d, c) => txt(d, gx(c), -b.h / 2 + 195, 38, GREY, { w: 700 }));
  for (let d = 1; d <= 31; d++) { const idx = 6 + d - 1, c = idx % 7, r = Math.floor(idx / 7), on = d === 25 && picked, q = on ? oBack(k01(t, T(61) + 0.1, 0.3)) : 0; if (on) circle(gx(c), gy(r), 50 * q, INK); txt(fa(d), gx(c), gy(r) + 2, 46, on ? '#FFFFFF' : INK, { w: 700 }); }
  cv.restore(); });
// 7 · the replay card: the real gold replay, the future curtained off
const SCR = [20, 140, 1540, 1000];
state(T(64), 960, 920, 48, INK, (t, a, b) => { cv.save(); cv.globalAlpha *= a; const w = b.w - 60, h = (w * SCR[3]) / SCR[2], ox = -w / 2, oy = -b.h / 2 + 30;
  const play = t >= T(67), f = play ? cl((t - T(67)) / (T(76) - T(67))) : 0, keys = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), im = IMG[keys[Math.min(15, Math.floor(f * 16))]];
  if (im) { cv.save(); cv.beginPath(); cv.roundRect(ox, oy, w, h, 26); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, ox, oy, w, h);
    const cu = oCub(k01(t, T(74), 0.4)); if (cu > 0) { cv.globalAlpha *= cu; const g = cv.createLinearGradient(ox + w * 0.6, 0, ox + w * 0.86, 0); g.addColorStop(0, 'rgba(14,14,16,0)'); g.addColorStop(0.35, 'rgba(14,14,16,0.97)'); cv.fillStyle = g; cv.fillRect(ox + w * 0.6, oy, w * 0.4, h); txt('آینده', ox + w * 0.83, oy + h / 2, 44, '#B9A8FF', { w: 800 }); } cv.restore(); }
  const by = oy + h + 80; txt('بازپخش طلا، ۲۵ فروردین ۱۴۰۴', b.w / 2 - 40, by - 6, 42, '#FFFFFF', { align: 'right' }); txt('صفحه‌ی واقعی بک‌تست‌لب', b.w / 2 - 40, by + 48, 32, '#8D8C93', { align: 'right', w: 600 });
  rr(-b.w / 2 + 40, by + 100, b.w - 80, 10, 5, '#2A2A30'); rr(-b.w / 2 + 40, by + 100, (b.w - 80) * f, 10, 5, '#FFFFFF');
  const px = -b.w / 2 + 110, pyy = by + 10; circle(px, pyy, 50, '#FFFFFF'); cv.fillStyle = INK; if (play) { cv.fillRect(px - 14, pyy - 18, 9, 36); cv.fillRect(px + 5, pyy - 18, 9, 36); } else { cv.beginPath(); cv.moveTo(px - 12, pyy - 20); cv.lineTo(px + 20, pyy); cv.lineTo(px - 12, pyy + 20); cv.closePath(); cv.fill(); }
  cv.restore(); });
// 8 · buy or sell
state(T(76), 900, 190, 95, CARD, (t, a, b) => { cv.save(); cv.globalAlpha *= a; rr(8, -b.h / 2 + 14, b.w / 2 - 22, b.h - 28, (b.h - 28) / 2, GREEN); txt('خرید', b.w / 4 + 2, 4, 58, '#FFFFFF'); rr(-b.w / 2 + 14, -b.h / 2 + 14, b.w / 2 - 22, b.h - 28, (b.h - 28) / 2, RED); txt('فروش', -b.w / 4 - 2, 4, 58, '#FFFFFF'); cv.restore(); });
// 9 · the week's twenty trades
state(T(78), 920, 640, 48, CARD, (t, a, b) => { cv.save(); cv.globalAlpha *= a; const n = Math.floor(20 * oCub(k01(t, T(80), 1.4)));
  txt('معامله‌های این هفته', b.w / 2 - 50, -b.h / 2 + 76, 46, GREY, { align: 'right', w: 700 }); txt(fa(n), b.w / 2 - 50, -b.h / 2 + 190, 130, INK, { align: 'right', w: 900 }); txt('/ ۲۰', b.w / 2 - 60 - measure(fa(n), 130, 900) - 24, -b.h / 2 + 204, 64, GREY, { align: 'right' });
  for (let i = 0; i < 20; i++) { const x = b.w / 2 - 60 - i * ((b.w - 120) / 19), on = i < n; circle(x, -b.h / 2 + 325, 16, on ? INK : '#E3E2DE'); }
  const q = oCub(k01(t, T(85), 0.3)); if (q > 0) { cv.save(); cv.globalAlpha *= q; rr(-b.w / 2 + 30, b.h / 2 - 180, b.w - 60, 140, 34, SOFT); txt('سودده؟', b.w / 2 - 70, b.h / 2 - 110, 54, INK, { align: 'right', w: 900 });
    const sx = -b.w / 2 + 110, sy = b.h / 2 - 110; cv.strokeStyle = '#D6D5D0'; cv.lineWidth = 7; cv.beginPath(); cv.arc(sx, sy, 26, 0, Math.PI * 2); cv.stroke(); cv.strokeStyle = INK; cv.lineCap = 'round'; cv.beginPath(); cv.arc(sx, sy, 26, t * 7, t * 7 + 1.6); cv.stroke(); txt('تست کن تا بفهمی', -b.w / 2 + 320, sy + 2, 38, GREY, { w: 700 }); cv.restore(); }
  cv.restore(); });
// 10 · «شروع رایگان»: loading, a tick, then «لینک توی بیو»
state(T(91), 640, 160, 80, INK, (t, a, b) => { cv.save(); cv.globalAlpha *= a; txt('شروع رایگان', 0, 4, 58, '#FFFFFF'); cv.restore(); });
state(T(92) + 0.1, 160, 160, 80, INK, (t, a, b) => { cv.save(); cv.globalAlpha *= a; if (t < T(92) + 0.5) { cv.strokeStyle = '#FFFFFF'; cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.arc(0, 0, 30, t * 8, t * 8 + 4.2); cv.stroke(); }
  else { const k = oBack(k01(t, T(92) + 0.5, 0.25)); cv.strokeStyle = LIME; cv.lineWidth = 9; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-22 * k, 2); cv.lineTo(-6 * k, 18 * k); cv.lineTo(24 * k, -16 * k); cv.stroke(); } cv.restore(); });
state(Math.max(T(93), T(92) + 0.95), 700, 160, 80, CARD, (t, a, b) => { cv.save(); cv.globalAlpha *= a; txt('لینک توی بیو', 44, 4, 58, INK); const bb = Math.abs(Math.sin((t - T(93)) * 6)) * 8; cv.fillStyle = VIO; cv.beginPath(); cv.moveTo(-210, -22 - bb); cv.lineTo(-184, 6 - bb); cv.lineTo(-198, 6 - bb); cv.lineTo(-198, 28 - bb); cv.lineTo(-222, 28 - bb); cv.lineTo(-222, 6 - bb); cv.lineTo(-236, 6 - bb); cv.closePath(); cv.fill(); cv.restore(); });
// the end card
state(END, 320, 320, 90, VT ? CARD : VIO, (t, a, b) => { if (IMG.icon) { cv.save(); cv.globalAlpha *= a; const z = VT ? 0.76 : 1; cv.drawImage(IMG.icon, -b.w * z / 2, -b.h * z / 2, b.w * z, b.h * z); cv.restore(); } }, 860);

// ---------- the cursor ----------
const CUR = () => [[0.0, 900, 1500], [0.6, 760, 1120], [T(4), 700, 1150], [T(7) + 0.2, 760, 1250], [T(11) - 0.15, 0, 0, 'btn'], [T(11) + 0.3, 0, 0, 'btn'], [T(13) + 0.2, 720, 1250],
  [T(18) - 0.1, 0, 0, 'low'], [T(21) - 0.1, 0, 0, 'high'], [T(24) + 0.4, 800, 1450], [T(33) - 0.2, 0, 0, 'switch'], [T(33) + 0.3, 0, 0, 'switch'], [T(36) + 0.4, 820, 1500],
  [T(47) + 0.3, 700, 1200], [T(53) - 0.25, 0, 0, 'seg'], [T(53) + 0.5, 0, 0, 'seg'], [T(54) + 0.3, 760, 1300], [T(58) + 0.4, 820, 1420], [T(61) - 0.15, 0, 0, 'd25'], [T(61) + 0.4, 0, 0, 'd25'],
  [T(64) + 0.4, 820, 1500], [T(67) - 0.2, 0, 0, 'play'], [T(67) + 0.4, 0, 0, 'play'], [T(76) + 0.15, 560, 1160], [T(77) + 0.3, 520, 1140], [T(78) + 0.3, 820, 1500], [T(90), 820, 1520],
  [T(92) - 0.2, 0, 0, 'btn'], [T(92) + 0.2, 0, 0, 'btn'], [T(93) + 0.5, 800, 1330], [END, 900, 1600], [DUR, 900, 1650]];
const CLICKS = () => [T(11), T(33), T(53), T(61), T(67), T(92)];
let CK = null;
function cursorPos(t) { const K = CK; let k = 0; while (k < K.length - 2 && t >= K[k + 1][0]) k++; const P = (q) => { if (!q[3]) return [q[1], q[2]];
    if (q[3] === 'low' || q[3] === 'high') { const b = S[3].b, x0 = -b.w / 2 + 50, x1 = b.w / 2 - 50, y0 = -b.h / 2 + 170, y1 = b.h / 2 - 60, i = q[3] === 'low' ? LOWI : HIGHI; return [CX + lerp(x0, x1, i / (SER.length - 1)) + 18, b.y + lerp(y1, y0, (SER[i] - smin) / (smax - smin)) + 24]; }
    if (q[3] === 'd25') { const b = S[8].b, cw = (b.w - 80) / 7, idx = 30, c = idx % 7, r = Math.floor(idx / 7); return [CX + b.w / 2 - 40 - cw * (c + 0.5) + 14, b.y - b.h / 2 + 300 + r * 122 + 20]; }
    if (q[3] === 'switch') { const b = S[4].b; return [CX - b.w / 2 + 160 + 20, b.y + b.h / 2 - 80 + 14]; }
    if (q[3] === 'seg') { const b = S[6].b; return [CX - b.w / 4 + 10, b.y + 18]; }
    if (q[3] === 'play') { const b = S[9].b, w = b.w - 60, h = (w * SCR[3]) / SCR[2]; return [CX - b.w / 2 + 110 + 12, b.y - b.h / 2 + 30 + h + 80 + 14]; }
    if (q[3] === 'btn') return [CX + 20, 1080 + 14]; };
  const [x0, y0] = P(K[k]), [x1, y1] = P(K[k + 1]), e = io(cl((t - K[k][0]) / (K[k + 1][0] - K[k][0]))); return [lerp(x0, x1, e), lerp(y0, y1, e)]; }
function drawCursor(t) { const [x, y] = cursorPos(t); let s = 1.6, ripple = -1; CLICKS().forEach((c) => { const e = t - c; if (e >= -0.06 && e < 0.12) s = 1.6 * 0.82; if (e >= 0 && e < 0.45) ripple = e / 0.45; });
  if (ripple >= 0) { cv.save(); cv.globalAlpha = 0.35 * (1 - ripple); cv.strokeStyle = INK; cv.lineWidth = 4; cv.beginPath(); cv.arc(x, y, 20 + 50 * ripple, 0, Math.PI * 2); cv.stroke(); cv.restore(); }
  cv.save(); cv.translate(x, y); cv.scale(s, s); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 8; cv.shadowOffsetY = 3; cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(0, 30); cv.lineTo(8, 23); cv.lineTo(13.5, 35); cv.lineTo(18.5, 32.5); cv.lineTo(13, 21); cv.lineTo(23, 21); cv.closePath();
  cv.fillStyle = INK; cv.fill(); cv.shadowColor = 'transparent'; cv.strokeStyle = '#FFFFFF'; cv.lineWidth = 2.2; cv.lineJoin = 'round'; cv.stroke(); cv.restore(); }

// ---------- the words: the hook large, then the spoken line above the object ----------
const TOK = [['نکنه', 0], ['استراتژی', 1], ['سوددهت', 2], ['فقط', 3], ['توی', 4], ['ذهنت', 5], ['سوددهه؟', 6], ['یه', 7], ['چارت', 8], ['گذشته', 9], ['رو', 10], ['باز', 11], ['کن.', 12],
  ['ورودها', 13], ['چقدر', 14], ['واضحن،', 15], ['نه؟', 17], ['اینجا', 18], ['می‌خریدم،', 19], ['اینجا', 21], ['می‌فروختم.', 22], ['ولی', 24], ['تو', 25], ['الان', 26], ['می‌دونی', 27], ['بعدش', 29], ['چی', 30], ['شد.', 31],
  ['اون', 32], ['موقع', 33], ['نمی‌دونستی.', 34], ['روی', 36], ['چارتی', 37], ['که', 38], ['آینده‌ش', 39], ['پیداست،', 40], ['هر', 41], ['استراتژی‌ای', 42], ['سودده', 43], ['به', 44], ['نظر', 45], ['میاد.', 46],
  ['تست', 47], ['واقعی', 48], ['وقتیه', 49], ['که', 50], ['آینده', 51], ['رو', 52], ['نبینی.', 53], ['بک‌تست‌لب', 54], ['دقیقاً', 56], ['همینه.', 57], ['می‌ری', 58], ['به', 59], ['یه', 60], ['روز', 61], ['از', 62], ['گذشته،', 63],
  ['بازار', 64], ['از', 65], ['همون‌جا', 66], ['جلو', 67], ['میاد،', 68], ['و', 69], ['تو', 70], ['باید', 71], ['قبل', 72], ['از', 73], ['دیدن', 74], ['ادامه‌ش', 75], ['تصمیم', 76], ['بگیری.', 77],
  ['این', 78], ['هفته', 79], ['۲۰', 80], ['تا', 80], ['معامله', 81], ['این‌طوری', 82], ['بگیر', 83], ['و', 84], ['ببین', 85], ['هنوز', 86], ['سودده', 87], ['هست', 88], ['یا', 89], ['نه.', 90], ['شروعش', 91], ['رایگانه.', 92], ['لینک', 93], ['توی', 94], ['بیو.', 95]];
const CH = []; { let c = []; TOK.slice(7).forEach((tk, j, arr) => { c.push(tk); if (/[،.؟]$/.test(tk[0]) || c.length >= 5 || j === arr.length - 1) { CH.push(c); c = []; } }); }
function words(t) {
  const lineOf = (toks, y, size, fadeA = 1) => { cv.save(); cv.globalAlpha *= fadeA; cv.font = font(size, 800); cv.direction = 'rtl'; const gap = size * 0.3, wsz = toks.map(([s]) => cv.measureText(s).width), total = wsz.reduce((x, z) => x + z, 0) + gap * (toks.length - 1); let xr = CX + total / 2;
    toks.forEach(([s, wi], k) => { const on = t >= ws(wi) - 0.06, x = xr - wsz[k] / 2; xr -= wsz[k] + gap; const q = oCub(k01(t, ws(wi) - 0.06, 0.25)); txt(s, x, y, size, VT ? (on ? mix('#C8BCFF', '#FFFFFF', q) : '#B4A4F6') : on ? mix('#A9A8AE', '#0E0E10', q) : '#B9B8BE'); }); cv.restore(); };
  if (t < T(7) + 0.1) { const f = 1 - k01(t, T(7) - 0.15, 0.25); lineOf(TOK.slice(0, 3), 320, 100, f); lineOf(TOK.slice(3, 7), 460, 100, f); return; }
  if (t >= END - 0.1) return; let ci = 0; CH.forEach((c, k) => { if (t >= ws(c[0][1]) - 0.12) ci = k; }); const c = CH[ci], nx = CH[ci + 1], a = Math.min(oCub(k01(t, ws(c[0][1]) - 0.12, 0.25)), nx ? 1 - k01(t, ws(nx[0][1]) - 0.2, 0.08) : 1);
  lineOf(c, 380, 78, a);
}

// ---------- frame ----------
function frame(t) {
  if (VT) { const g = cv.createLinearGradient(0, 0, W * 0.35, H); g.addColorStop(0, '#9273FF'); g.addColorStop(0.55, '#6A47F0'); g.addColorStop(1, '#4626C9'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
    const o1 = cv.createRadialGradient(CX + 260, 300, 40, CX + 260, 300, 900); o1.addColorStop(0, 'rgba(255,255,255,0.20)'); o1.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = o1; cv.fillRect(0, 0, W, H);
    const o2 = cv.createRadialGradient(CX - 300, 1650, 60, CX - 300, 1650, 900); o2.addColorStop(0, 'rgba(30,10,110,0.35)'); o2.addColorStop(1, 'rgba(30,10,110,0)'); cv.fillStyle = o2; cv.fillRect(0, 0, W, H); }
  else { cv.fillStyle = BG; cv.fillRect(0, 0, W, H); const v = cv.createRadialGradient(CX, 900, 200, CX, 960, 1300); v.addColorStop(0, 'rgba(255,255,255,0.35)'); v.addColorStop(1, 'rgba(0,0,0,0.06)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H); }
  words(t);
  const k = cur(t), s = S[k], p = S[Math.max(0, k - 1)], e = k ? cl((t - s.t) / MORPH) : 1, m = io(e), sp = k ? oBack(e) : 1;
  const b = { w: lerp(p.b.w, s.b.w, sp), h: lerp(p.b.h, s.b.h, sp), r: lerp(p.b.r, s.b.r, m), y: lerp(p.b.y, s.b.y, m) }, fill = k ? mix(p.fill, s.fill, m) : s.fill, blur = k ? Math.sin(Math.PI * e) * 7 : 0;
  cv.save(); cv.translate(CX, b.y); if (blur > 0.5) cv.filter = `blur(${blur.toFixed(1)}px)`;
  cv.save(); cv.shadowColor = VT ? 'rgba(28,8,96,0.38)' : 'rgba(20,20,30,0.14)'; cv.shadowBlur = 70; cv.shadowOffsetY = 26; rr(-b.w / 2, -b.h / 2, b.w, b.h, b.r, fill); cv.restore();
  cv.save(); cv.beginPath(); cv.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, Math.min(b.r, b.h / 2, b.w / 2)); cv.clip();
  if (k && e < 0.45) p.draw(t, 1 - cl(e / 0.3), b); s.draw(t, k ? oCub(k01(e, 0.45, 0.55)) : 1, b); cv.restore();
  cv.restore(); cv.filter = 'none';
  if (t >= END) { const q = oCub(k01(t, END + 0.25, 0.4)); const WM = VT ? IMG.word : IMG.wordInk; if (WM) { const ww = 460, hh = (ww * WM.height) / WM.width; cv.save(); cv.globalAlpha = q; cv.drawImage(WM, CX - ww / 2, 1090 + (1 - q) * 20, ww, hh); cv.restore(); }
    const f = oCub(k01(t, END + 0.5, 0.35)); cv.save(); cv.globalAlpha = f; pill('آینده رو نبین، تست کن', CX, 1330, 44, VT ? '#FFFFFF' : INK, VT ? INK : '#FFFFFF'); txt('شروعش رایگانه؛ لینک توی بیو', CX, 1450, 38, VT ? 'rgba(255,255,255,0.85)' : GREY, { w: 700 }); cv.restore(); }
  if (t > 0.15) drawCursor(t);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(6) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  if (IMG.word) { const c = document.createElement('canvas'); c.width = IMG.word.width * 2; c.height = IMG.word.height * 2; const g = c.getContext('2d'); g.drawImage(IMG.word, 0, 0, c.width, c.height); g.globalCompositeOperation = 'source-in'; g.fillStyle = INK; g.fillRect(0, 0, c.width, c.height); IMG.wordInk = c; }   // the white wordmark, inked for the light ground
  CK = CUR(); frame(0); window.ready = true;
});
