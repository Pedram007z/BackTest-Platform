// «برگرد به ۱۲ مارس ۲۰۲۰»: an animated product demo. The calendar rewinds, the date picker lands on 12 March,
// the replay plays with the future hidden, an order is placed with risk-based volume, the trade lands in the journal.
const OH = DATA.ohlc, CR = DATA.crash;
const SUB_ON = [0, 1, 1, 1, 1, 0, 0].map(Boolean);
const LABEL = 'چالش · ۱۲ مارس ۲۰۲۰';
const SH = 1992 / 1170;

function phone(cx, top, w, img, sx, sy, sw, o = {}) {
  const h = w * SH, x = cx - w / 2; cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  cv.shadowColor = rgba(C.accent, 0.35); cv.shadowBlur = 80; rr(x - 16, top - 16, w + 32, h + 32, 70); cv.fillStyle = '#05040a'; cv.fill(); cv.shadowBlur = 0; cv.lineWidth = 3; cv.strokeStyle = C.line; cv.stroke();
  cv.save(); rr(x, top, w, h, 54); cv.clip(); cv.fillStyle = C.bg; cv.fillRect(x, top, w, h); if (img) { const k = w / sw; cv.drawImage(img, sx, sy, sw, h / k, x, top, w, h); } cv.restore(); cv.restore();
  return { X: (px) => x + (px - sx) * (w / sw), Y: (py) => top + (py - sy) * (w / sw), k: w / sw };
}
function tap(x, y, k) { if (k <= 0 || k >= 1) return; cv.save(); cv.globalAlpha *= 1 - k; cv.strokeStyle = '#fff'; cv.lineWidth = 5; cv.beginPath(); cv.arc(x, y, 20 + 50 * k, 0, 7); cv.stroke(); cv.fillStyle = 'rgba(255,255,255,0.5)'; cv.beginPath(); cv.arc(x, y, 18, 0, 7); cv.fill(); cv.restore(); }
function lockIcon(x, y, s, col) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.16; cv.beginPath(); cv.arc(x, y - s * 0.25, s * 0.32, Math.PI, 0); cv.stroke(); rr(x - s * 0.5, y - s * 0.25, s, s * 0.78, s * 0.14); cv.fillStyle = col; cv.fill(); cv.restore(); }
function bsButtons(y, a, pulse) { // the app's buy / sell buttons
  [[300, 'فروش', C.loss], [780, 'خرید', C.gain]].forEach(([x, s, col], i) => { const p = 1 + 0.04 * Math.sin(t_ * 5 + i * 1.6) * pulse; cv.save(); cv.globalAlpha *= a; cv.translate(x, y); cv.scale(p, p);
    cv.shadowColor = rgba(col, 0.6); cv.shadowBlur = 40; rr(-200, -70, 400, 140, 40); cv.fillStyle = col; cv.fill(); cv.shadowBlur = 0; txt(s, 0, 4, { size: 60, weight: 800, color: '#fff' }); cv.restore(); });
}
let t_ = 0;

// ---- 0 · rewind to 12 March 2020 (the cover) ----
function rewind(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['اگه برمی‌گشتی به…', 70, C.ink]], t, -1, S(1), { y: 400, instant: true, hold: true });
  // flying calendar pages (rewind), then the date card
  const r = rng(13); for (let i = 0; i < 14; i++) { const st = 0.1 + i * 0.09, k = P(t, st, 0.7); if (k <= 0 || k >= 1) continue; const ang = -0.6 + r() * 1.2;
    cv.save(); cv.globalAlpha *= 1 - k; cv.translate(540 + Math.sin(ang) * 700 * k, 860 - 500 * k + 900 * k * k); cv.rotate(ang * 2 * k); rr(-230, -190, 460, 380, 30); cv.fillStyle = C.raised; cv.fill(); txt(fy(2026 - Math.floor(i / 2.3)), 0, 0, { size: 90, font: 'Rdx', weight: 700, color: C.muted }); cv.restore(); }
  cv.save(); cv.translate(540, 860); const pop = 1 + 0.06 * Math.sin(Math.PI * P(t, 1.3, 0.4));
  cv.scale(pop, pop); cv.shadowColor = rgba(C.accent, 0.6); cv.shadowBlur = 80; rr(-260, -230, 520, 460, 40); cv.fillStyle = C.surface; cv.fill(); cv.shadowBlur = 0; cv.strokeStyle = C.line; cv.lineWidth = 3; cv.stroke();
  rr(-260, -230, 520, 110, [40, 40, 0, 0]); cv.fillStyle = C.loss; cv.fill();
  txt('مارس ۲۰۲۰', 0, -175, { size: 48, weight: 800, color: '#fff' });
  txt('۱۲', 0, 20, { size: 220, font: 'Rdx', weight: 700, color: C.ink }); txt('پنجشنبه', 0, 170, { size: 40, weight: 700, color: C.muted });
  [-140, 140].forEach((x) => { cv.fillStyle = C.line; rr(x - 14, -262, 28, 70, 14); cv.fill(); });
  cv.restore();
  txt('می‌خریدی یا می‌فروختی؟', 540, 1220, { size: 66, font: 'Rdx', weight: 700, color: C.lilac, glow: rgba(C.accent, 0.7) });
  bsButtons(1420, 1, 1);
  cv.restore();
}

// ---- 1 · any day, any market (the go-to-date picker) ----
function picker(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const f = phone(540, 400, 560, IMG.replay, 0, 150, 1170);
  tap(f.X(850), f.Y(388), P(t, S(1) + 0.4, 0.6));
  const m = E.out(P(t, S(1) + 0.7, 0.5)); if (m > 0) { // the date picker sheet
    cv.save(); cv.globalAlpha *= m; cv.translate(0, (1 - m) * 200); card(130, 640, 820, 640, { r: 36, border: rgba(C.accent, 0.6), glow: rgba(C.accent, 0.3) });
    txt('برو به تاریخ', 890, 700, { size: 40, weight: 800, color: C.ink, align: 'right' }); txt('مارس ۲۰۲۰', 200, 700, { size: 34, weight: 700, color: C.lilac, align: 'left' });
    const days = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']; days.forEach((d, i) => txt(d, 860 - i * 108, 770, { size: 28, color: C.faint, weight: 600 }));
    // March 2020 starts on a Sunday: in a Saturday-first week that is column 1
    for (let d = 1; d <= 31; d++) { const col = (d + 0) % 7, row = Math.floor((d + 0) / 7), x = 860 - col * 108, y = 840 + row * 76, on = d === 12 && P(t, S(1) + 1.6, 0.3) > 0;
      if (on) { cv.fillStyle = C.accent; cv.beginPath(); cv.arc(x, y, 32, 0, 7); cv.fill(); } txt(fa(d), x, y + 2, { size: 30, weight: on ? 800 : 500, color: on ? '#fff' : C.ink }); }
    tap(860 - (12 % 7) * 108, 840 + Math.floor(12 / 7) * 76, P(t, S(1) + 1.5, 0.6));
    cv.restore(); }
  // the markets
  const items = [['فارکس', C.sky, 0.45], ['طلا', C.amber, 0.6], ['شاخص', C.pink, 0.74], ['کریپتو', C.gain, 0.88]];
  items.forEach(([s, col, fr], i) => { const k = E.back(P(t, S(1) + LN[1] * fr, 0.4)); if (k <= 0) return; const x = 870 - i * 220; cv.save(); cv.translate(x, 1360); cv.scale(k, k); cv.globalAlpha *= clamp(k);
    rr(-95, -40, 190, 80, 40); cv.fillStyle = rgba(col, 0.18); cv.fill(); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); txt(s, 0, 2, { size: 34, weight: 800, color: C.ink }); cv.restore(); });
  cv.restore();
}

// ---- 2–3 · the replay, then an order ----
const TR = { x: 110, y: 560, w: 860, h: 640 };
function replay(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const shown = t < S(2) + 0.6 ? CR - 1 : Math.min(OH.length, CR - 1 + Math.floor(E.inOut(P(t, S(2) + 0.6, LN[2] - 0.6)) * (OH.length - CR + 1)));
  const end = t > S(3) ? CR + 1 : shown; // freeze just after the crash for the order
  card(TR.x - 40, TR.y - 70, TR.w + 80, TR.h + 130);
  txt('BTCUSD · 1D · BacktestLab', TR.x + TR.w, TR.y - 30, { size: 26, color: C.muted, weight: 500, dir: 'ltr', align: 'right' });
  const c = candles(TR, OH, 0, Math.min(end, shown), { span: OH.length, lo: 3600, hi: 10800 });
  const fx = TR.x + (Math.min(end, shown) / OH.length) * TR.w;
  if (t < S(3)) { rr(fx + 6, TR.y - 10, TR.x + TR.w - fx + 4, TR.h + 20, 20); cv.fillStyle = rgba(C.raised, 0.92); cv.fill(); cv.strokeStyle = rgba(C.accentInk, 0.4); cv.lineWidth = 2; cv.stroke();
    if (TR.x + TR.w - fx > 150) { lockIcon((fx + TR.x + TR.w) / 2, TR.y + TR.h / 2 - 30, 64, C.lilac); txt('آینده', (fx + TR.x + TR.w) / 2, TR.y + TR.h / 2 + 64, { size: 40, font: 'Rdx', weight: 700, color: C.ink }); } }
  // the play bar
  const pb = E.out(P(t, S(2), 0.4)) * (1 - P(t, S(3), 0.3)); if (pb > 0) { cv.save(); cv.globalAlpha *= pb; rr(180, 1290, 720, 110, 55); cv.fillStyle = rgba(C.surface, 0.95); cv.fill(); cv.strokeStyle = C.line; cv.stroke();
    rr(740, 1302, 130, 86, 30); const g = cv.createLinearGradient(740, 0, 870, 0); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.fill(); cv.fillStyle = '#fff'; cv.beginPath(); cv.moveTo(792, 1325); cv.lineTo(792, 1365); cv.lineTo(824, 1345); cv.closePath(); cv.fill();
    const prog = shown / OH.length; rr(240, 1336, 460, 12, 6); cv.fillStyle = C.raised; cv.fill(); rr(240, 1336, 460 * prog, 12, 6); cv.fillStyle = C.accent; cv.fill(); cv.fillStyle = '#fff'; cv.beginPath(); cv.arc(240 + 460 * prog, 1342, 15, 0, 7); cv.fill(); cv.restore(); tap(805, 1345, P(t, S(2) + 0.3, 0.6)); }
  if (shown > CR && t < S(3) + 0.2) { const k = P(t, S(2) + 0.8, 0.3); tag(c.X(CR) - 20, c.Y(OH[CR][2]) + 40, '−۳۹٫۵٪ · ۱۲ مارس', C.loss, { size: 28, alpha: k, align: 'right', dir: 'rtl' }); }
  // the order: entry, stop, target, volume from risk
  if (t > S(3) - 0.1) { const e = OH[CR + 1][0], sl = 4300, tp = 6600, x0 = c.X(CR + 1) + 10, x1 = TR.x + TR.w;
    const kE = E.out(P(t, S(3) + LN[3] * 0.02, 0.4)), kS = E.out(P(t, S(3) + LN[3] * 0.16, 0.4)), kT = E.out(P(t, S(3) + LN[3] * 0.3, 0.4));
    if (kT > 0) { cv.fillStyle = rgba(C.gain, 0.2 * kT); cv.fillRect(x0, c.Y(tp), (x1 - x0) * kT, c.Y(e) - c.Y(tp)); tag(x1 - 10, c.Y(tp) - 26, 'حد سود', C.gain, { size: 28, alpha: kT, align: 'right', dir: 'rtl' }); }
    if (kS > 0) { cv.fillStyle = rgba(C.loss, 0.22 * kS); cv.fillRect(x0, c.Y(e), (x1 - x0) * kS, c.Y(sl) - c.Y(e)); tag(x1 - 10, c.Y(sl) + 28, 'حد ضرر', C.loss, { size: 28, alpha: kS, align: 'right', dir: 'rtl' }); }
    if (kE > 0) { cv.strokeStyle = C.accentInk; cv.lineWidth = 4; cv.beginPath(); cv.moveTo(x0, c.Y(e)); cv.lineTo(x0 + (x1 - x0) * kE, c.Y(e)); cv.stroke(); tag(x0 + 70, c.Y(e) - 30, 'ورود', C.accent, { size: 28, alpha: kE, dir: 'rtl' }); }
    const kp = E.back(P(t, S(3) + LN[3] * 0.5, 0.45)); if (kp > 0) { cv.save(); cv.translate(540, 1328); cv.scale(kp, kp); card(-400, -90, 800, 180, { r: 32, border: rgba(C.accent, 0.6) });
      txt('ریسک', 340, -36, { size: 30, color: C.muted, weight: 600, align: 'right' }); txt('۱٪', 340, 26, { size: 56, font: 'Rdx', weight: 700, color: C.ink, align: 'right' });
      txt('←', 60, 0, { size: 50, weight: 800, color: C.faint });
      txt('حجم', -40, -36, { size: 30, color: C.muted, weight: 600, align: 'right' }); txt('خودکار حساب شد', -40, 26, { size: 40, weight: 800, color: C.gain, align: 'right' }); cv.restore(); } }
  cv.restore();
}

// ---- 4 · journal and analytics ----
function journal(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const k1 = E.out(P(t, S(4), 0.6)), k2 = E.out(P(t, S(4) + LN[4] * 0.45, 0.6));
  cv.save(); cv.translate(-(1 - k1) * 400, 0); phone(330, 520, 400, IMG.journal, 0, lerp(150, 1500, E.inOut(P(t, S(4) + 0.5, LN[4]))), 1170, { alpha: k1 }); cv.restore();
  cv.save(); cv.translate((1 - k2) * 400, 0); phone(750, 560, 400, IMG.analytics, 0, lerp(1750, 3200, E.inOut(P(t, S(4) + LN[4] * 0.5, LN[4] * 0.6))), 1170, { alpha: k2 }); cv.restore();
  const toast = E.back(P(t, S(4) + 0.3, 0.45)) * (1 - P(t, S(4) + LN[4] * 0.6, 0.3)); if (toast > 0) { cv.save(); cv.translate(540, 430); cv.scale(toast, toast); pill(0, 0, 'معامله ثبت شد ← ژورنال', { size: 38, color: C.ink, dot: C.gain, weight: 800 }); cv.restore(); }
  const tl = E.out(P(t, S(4) + LN[4] * 0.6, 0.4)); if (tl > 0) pill(540, 430, 'استراتژیت کجا جواب داده؟', { size: 38, color: C.ink, dot: C.lilac, weight: 800, alpha: tl });
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 1290, { size: 24, color: C.faint, weight: 500 });
  cv.restore();
}

// ---- 5–6 · comment «تمرین», and the question ----
function cta(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a; const c0 = S(5);
  headline([[[['کلمه‌ی', C.ink], ['«تمرین»', C.lilac]], 100], ['رو کامنت کن', 100, C.ink]], t, c0, DUR + 1, { y: 440, gap: 135, hold: true, glow: rgba(C.accent, 0.7) });
  card(110, 700, 860, 150, { r: 75 });
  const g = cv.createLinearGradient(870, 730, 950, 820); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.beginPath(); cv.arc(900, 775, 42, 0, 7); cv.fill();
  const word = 'تمرین', typed = word.slice(0, Math.floor(P(t, c0 + 0.2, 0.8) * word.length + 0.001));
  const tw = txt(typed, 830, 778, { size: 50, color: C.ink, weight: 700, align: 'right' }); if (Math.floor(t * 2.5) % 2 === 0 && typed.length < word.length) { cv.fillStyle = C.lilac; cv.fillRect(830 - tw - 10, 752, 4, 52); }
  txt('ارسال', 190, 778, { size: 38, weight: 800, color: P(t, c0 + 1.1, 0.3) > 0 ? C.lilac : C.faint });
  const dm = E.back(P(t, c0 + 1.6, 0.5)) * (1 - P(t, S(6) - 0.2, 0.3)); if (dm > 0) { cv.save(); cv.translate(540, 1010); cv.scale(dm, dm); card(-380, -90, 760, 180, { r: 34, border: rgba(C.accent, 0.6), glow: rgba(C.accent, 0.3) });
    txt('دایرکت', 330, -40, { size: 30, color: C.muted, weight: 600, align: 'right' }); txt('لینک و آموزش شروع', 330, 18, { size: 42, color: C.ink, weight: 800, align: 'right' }); txt('فرستاده شد', 330, 62, { size: 28, color: C.gain, weight: 700, align: 'right' }); cv.restore(); }
  const q = E.out(P(t, S(6), 0.4)); if (q > 0) { cv.save(); cv.globalAlpha *= q; txt('تو اون روز…', 540, 1020, { size: 60, font: 'Rdx', weight: 700, color: C.ink }); bsButtons(1200, 1, 1); cv.restore(); }
  if (IMG.logo) { const w = 320, h = (w * IMG.logo.height) / IMG.logo.width, e = E.out(P(t, S(6) + 0.6, 0.6)); cv.save(); cv.globalAlpha *= e; cv.drawImage(IMG.logo, 540 - w / 2, 1430 - h / 2, w, h); cv.restore(); }
  cv.restore();
}

function render(t) {
  t_ = t;
  background(t, { tense: 0.7 * win(t, S(2) + 0.8, S(3), 0.3, 0.4) });
  rewind(t, 1 - E.in(P(t, S(1) - 0.3, 0.3)));
  picker(t, win(t, S(1) - 0.1, S(2) + 0.05, 0.3, 0.3));
  replay(t, win(t, S(2) - 0.05, S(4) + 0.05, 0.3, 0.3));
  journal(t, win(t, S(4) - 0.05, S(5) + 0.05, 0.3, 0.3));
  cta(t, E.out(P(t, S(5) - 0.05, 0.3)));
  chrome(t, LABEL, { dot: C.loss });
  subs(t, SUB_ON);
  cutFx(t, [S(1) - 0.1, S(2) - 0.05, S(4) - 0.05, S(5) - 0.05]);
  { const k = 1 - Math.abs(t - (S(2) + 0.85)) / 0.25; if (k > 0) { cv.fillStyle = rgba(C.loss, 0.25 * k); cv.fillRect(0, 0, W, H); } }
  finish(t);
}
boot(render, [loadImg('replay', '../c3/img/03-replay.png'), loadImg('journal', '../c3/img/full-04-journal.png'), loadImg('analytics', '../c3/img/full-05-analytics.png')]);
