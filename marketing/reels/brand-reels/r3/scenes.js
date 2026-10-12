// «با پول واقعی تست می‌کنی؟ صبر کن!»: why backtesting comes before profit. A real-money order frozen by «صبر کن!»,
// the balance draining, every strategy's bad days, 100 coin-flip trades with a run of 5 losses (81%), quitting at the bottom,
// the replay that shows those days first, the three numbers you learn, magic vs. knowing, the platform, follow.
const M = DATA.m, TRD = DATA.trades, STK = DATA.streak;
const SUB_ON = [0, 0, 0, 1, 1, 0, 0, 0, 0, 0].map(Boolean);
const LABEL = 'نکته · بک‌تست';
const SH = 1992 / 1170;
let shake = 0;

function phone(cx, top, w, img, sx, sy, sw, o = {}) {
  const h = o.h ?? w * SH, x = cx - w / 2; cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  cv.shadowColor = rgba(C.accent, 0.35); cv.shadowBlur = 80; rr(x - 14, top - 14, w + 28, h + 28, 62); cv.fillStyle = '#05040a'; cv.fill(); cv.shadowBlur = 0; cv.lineWidth = 3; cv.strokeStyle = C.line; cv.stroke();
  cv.save(); rr(x, top, w, h, 48); cv.clip(); cv.fillStyle = C.bg; cv.fillRect(x, top, w, h); if (img) { const k = w / sw; cv.drawImage(img, sx, sy, sw, h / k, x, top, w, h); } cv.restore(); cv.restore();
  return { X: (px) => x + (px - sx) * (w / sw), Y: (py) => top + (py - sy) * (w / sw), k: w / sw };
}
function tap(x, y, k) { if (k <= 0 || k >= 1) return; cv.save(); cv.globalAlpha *= 1 - k; cv.strokeStyle = '#fff'; cv.lineWidth = 5; cv.beginPath(); cv.arc(x, y, 20 + 50 * k, 0, 7); cv.stroke(); cv.fillStyle = 'rgba(255,255,255,0.5)'; cv.beginPath(); cv.arc(x, y, 18, 0, 7); cv.fill(); cv.restore(); }
function finger(x, y, a = 1, press = 0) { cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 20; cv.fillStyle = 'rgba(255,255,255,0.88)'; cv.beginPath(); cv.arc(x, y, 30 - 6 * press, 0, 7); cv.fill(); cv.shadowBlur = 0; cv.strokeStyle = rgba(C.accent, 0.8); cv.lineWidth = 4; cv.stroke(); cv.restore(); }
function check(x, y, s, col) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.2; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(x - s * 0.45, y + s * 0.02); cv.lineTo(x - s * 0.12, y + s * 0.34); cv.lineTo(x + s * 0.48, y - s * 0.32); cv.stroke(); cv.restore(); }
function cross(x, y, s, col, lw) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw ?? s * 0.2; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x - s / 2, y - s / 2); cv.lineTo(x + s / 2, y + s / 2); cv.moveTo(x + s / 2, y - s / 2); cv.lineTo(x - s / 2, y + s / 2); cv.stroke(); cv.restore(); }
function sparkle(x, y, s, col, a = 1) { cv.save(); cv.globalAlpha *= a; cv.fillStyle = col; cv.shadowColor = col; cv.shadowBlur = 20; cv.beginPath(); cv.moveTo(x, y - s); cv.quadraticCurveTo(x, y, x + s, y); cv.quadraticCurveTo(x, y, x, y + s); cv.quadraticCurveTo(x, y, x - s, y); cv.quadraticCurveTo(x, y, x, y - s); cv.fill(); cv.restore(); }
// an equity curve through control points [u, v] with light deterministic noise
function curve(pts, n, seed, amp) { const r = rng(seed), out = []; for (let i = 0; i < n; i++) { const u = i / (n - 1); let j = 0; while (j < pts.length - 2 && pts[j + 1][0] < u) j++; const [u0, v0] = pts[j], [u1, v1] = pts[j + 1]; const k = E.sine(clamp((u - u0) / (u1 - u0))); out.push(lerp(v0, v1, k) + (r() - 0.5) * amp); } return out; }

// ---- 0 · the real-money order, frozen by «صبر کن!» (the cover) ----
function order(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['با پولِ واقعی', 92, C.ink], [[['تست', C.loss], ['می‌کنی؟', C.ink]], 92]], t, -1, S(1), { y: 420, gap: 118, instant: true, hold: true, glow: rgba(C.loss, 0.55) });
  const fl = Math.sin(t * 1.3) * 6; cv.save(); cv.translate(0, fl);
  card(120, 640, 840, 620, { r: 40, border: rgba(C.loss, 0.45) });
  txt('سفارش جدید', 900, 712, { size: 44, weight: 800, color: C.ink, align: 'right' });
  pill(180, 712, 'حساب واقعی', { align: 'left', size: 28, dot: C.loss, color: C.loss, border: rgba(C.loss, 0.6) });
  cv.fillStyle = C.line; cv.fillRect(170, 770, 740, 2);
  [['نماد', 'EURUSD', C.ink], ['مبلغ', '$10,000', C.ink], ['استراتژی', 'تست‌نشده', C.amber]].forEach(([k, v, col], i) => { const y = 840 + i * 92;
    txt(k, 900, y, { size: 36, weight: 600, color: C.muted, align: 'right' }); txt(v, 180, y, { size: 42, weight: 700, color: col, align: 'left', font: 'Rdx', dir: /[a-z$]/i.test(v) ? 'ltr' : 'rtl' }); });
  // the buy button and the finger on its way to it
  const press = P(t, 2.4, 0.25) * (1 - P(t, M.sabr - 0.15, 0.1)), bx = 540, by = 1160;
  cv.save(); cv.translate(bx, by); cv.scale(1 - 0.04 * press, 1 - 0.04 * press); cv.shadowColor = rgba(C.gain, 0.6); cv.shadowBlur = 40; rr(-360, -62, 720, 124, 40); cv.fillStyle = C.gain; cv.fill(); cv.shadowBlur = 0; txt('خرید', 0, 4, { size: 58, weight: 800, color: '#fff' }); cv.restore();
  const fk = E.inOut(P(t, 0.6, 1.8)), stop = P(t, M.sabr - 0.1, 0.01);
  const fx_ = lerp(860, 600, fk), fy_ = lerp(1560, 1180, fk) - 70 * E.out(P(t, M.sabr - 0.1, 0.3));
  finger(fx_, fy_, E.out(P(t, 0.4, 0.4)), press);
  cv.restore();
  // «صبر کن!» slams in
  const st = P(t, M.sabr - 0.12, 0.35); if (st > 0) { glow(540, 1000, 800, 700, C.loss, 0.25 * st); cv.save(); cv.translate(540, 1000); cv.rotate(-0.08); const s = lerp(1.8, 1, E.out(st)); cv.scale(s, s); cv.globalAlpha *= clamp(st * 3);
    rr(-330, -110, 660, 220, 36); cv.fillStyle = rgba(C.bg, 0.85); cv.fill(); cv.strokeStyle = C.loss; cv.lineWidth = 10; cv.stroke();
    txt('صبر کن!', 0, 6, { size: 130, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.7) }); cv.restore(); }
  cv.restore();
}

// ---- 1 · the most expensive way to learn ----
function drain(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['گرون‌ترین', C.loss]], 104], ['راهِ یاد گرفتن', 80, C.ink]], t, S(1), S(2) + 0.1, { y: 430, gap: 125, hold: true, glow: rgba(C.loss, 0.6) });
  card(110, 680, 860, 640, { r: 40 });
  txt('موجودی حساب واقعی', 900, 750, { size: 36, weight: 600, color: C.muted, align: 'right' });
  const k = E.inOut(P(t, S(1) + 0.2, 1.6)), bal = lerp(10000, 6140, k);
  txt('$' + Math.round(bal).toLocaleString('en-US'), 900, 850, { size: 96, font: 'Rdx', weight: 700, color: k > 0.05 ? C.loss : C.ink, align: 'right', dir: 'ltr' });
  const vals = curve([[0, 100], [0.15, 103], [0.35, 92], [0.55, 84], [0.7, 88], [1, 61.4]], 60, 7, 2.5);
  series({ x: 170, y: 950, w: 740, h: 300 }, vals, { upto: 2 + 58 * k, lo: 55, hi: 108, color: C.loss, fill: C.loss, glow: true });
  const tg = E.back(P(t, S(1) + 1.3, 0.4)); if (tg > 0) { cv.save(); cv.translate(540, 1400); cv.scale(tg, tg); pill(0, 0, 'هزینه‌ی یاد گرفتن: ۳٬۸۶۰ دلار', { size: 36, color: C.ink, dot: C.loss, weight: 800 }); cv.restore(); }
  cv.restore();
}

// ---- 2 · every strategy has bad days ----
const EQ = curve([[0, 100], [0.1, 116], [0.18, 103], [0.3, 128], [0.4, 136], [0.5, 113], [0.6, 140], [0.7, 158], [0.79, 139], [0.88, 166], [1, 184]], 120, 11, 3);
function badDays(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['چیزی که', 70, C.muted], [[['کسی', C.lilac], ['بهت', C.lilac], ['نمی‌گه…', C.lilac]], 92]], t, M.kasi - 0.3, S(3) + 0.1, { y: 400, gap: 110, hold: true, glow: rgba(C.accent, 0.7) });
  const r = { x: 150, y: 720, w: 780, h: 480 }; card(100, 640, 880, 640, { r: 40 });
  pill(900, 690, 'حتی بهترین استراتژی', { align: 'right', size: 28, dot: C.gain, alpha: E.out(P(t, M.behtarin - 0.2, 0.4)) });
  const k = E.inOut(P(t, M.har - 0.2, 2.2)), hi = P(t, M.bad - 0.1, 0.4), X = (i) => r.x + (i / (EQ.length - 1)) * r.w, Y = (v) => r.y + (1 - (v - 90) / 100) * r.h;
  series(r, EQ, { upto: 2 + (EQ.length - 2) * k, lo: 90, hi: 190, color: C.accent, fill: C.accent, glow: true });
  // the underwater stretches (below the running peak) turn red when «روزای بد» is said
  if (hi > 0) { let peak = -1, s0 = -1; const seg = []; EQ.forEach((v, i) => { if (v >= peak) { if (s0 >= 0 && i - s0 > 4) seg.push([s0, i]); peak = v; s0 = -1; } else if (v < peak * 0.97 && s0 < 0) s0 = i - 1; });
    seg.forEach(([i0, i1], j) => { const e = E.out(P(t, M.bad - 0.1 + j * 0.15, 0.4)); if (e <= 0) return; cv.save(); cv.globalAlpha *= e; cv.fillStyle = rgba(C.loss, 0.16); cv.fillRect(X(i0), r.y - 10, X(i1) - X(i0), r.h + 20);
      cv.strokeStyle = C.loss; cv.lineWidth = 7; cv.shadowColor = C.loss; cv.shadowBlur = 16; cv.beginPath(); for (let i = i0; i <= i1; i++) (i === i0 ? cv.moveTo : cv.lineTo).call(cv, X(i), Y(EQ[i])); cv.stroke(); cv.restore();
      tag((X(i0) + X(i1)) / 2, r.y + r.h + 40, 'روز بد', C.loss, { size: 26, alpha: e, dir: 'rtl' }); }); }
  txt('روزای بد داره.', 540, 1400, { size: 74, font: 'Rdx', weight: 700, color: C.loss, alpha: E.out(P(t, M.bad - 0.1, 0.4)), glow: rgba(C.loss, 0.5), reveal: E.out(P(t, M.bad - 0.1, 0.5)) });
  cv.restore();
}

// ---- 3 · 50% wins, 100 trades: 81% chance of 5 losses in a row ----
function streaks(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const c1 = E.back(P(t, M.panjah - 0.1, 0.4)), c2 = E.back(P(t, M.sad - 0.1, 0.4));
  [[700, '۵۰٪ برد', C.gain, c1], [380, '۱۰۰ معامله', C.sky, c2]].forEach(([x, s, col, k]) => { if (k <= 0) return; cv.save(); cv.translate(x, 380); cv.scale(k, k); cv.globalAlpha *= clamp(k);
    rr(-150, -46, 300, 92, 46); cv.fillStyle = rgba(col, 0.16); cv.fill(); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); txt(s, 0, 3, { size: 42, weight: 800, color: C.ink }); cv.restore(); });
  const nk = E.out(P(t, M.hashtad - 0.15, 0.7)); if (nk > 0) { const big = 0.85 + 0.15 * E.back(P(t, M.hashtad - 0.15, 0.5));
    txt(fa(Math.round(81 * nk)) + '٪', 450, 548, { size: 150, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.6), scale: big, alpha: clamp(nk * 2) });
    txt('احتمالِ', 760, 548, { size: 48, weight: 800, color: C.muted, alpha: clamp(nk * 2) }); }
  // the grid: 100 trades fill in, then the run of 5 lights up
  const fill = P(t, M.sad - 0.2, 1.6), sk = E.out(P(t, M.panj - 0.1, 0.25)), x0 = 540 + 4.5 * 82, y0 = 700;
  for (let i = 0; i < 100; i++) { const row = Math.floor(i / 10), col = i % 10, x = x0 - col * 82, y = y0 + row * 66, on = fill * 100 > i; if (!on) { rr(x - 33, y - 26, 66, 52, 12); cv.fillStyle = rgba(C.line, 0.6); cv.fill(); continue; }
    const pop = E.back(clamp((fill * 100 - i) / 6)), win_ = TRD[i] === 1, inRun = i >= STK && i < STK + 5;
    cv.save(); cv.translate(x, y); cv.scale(pop, pop); rr(-33, -26, 66, 52, 12);
    cv.globalAlpha *= inRun || sk <= 0 ? 1 : 1 - 0.55 * sk; cv.fillStyle = win_ ? rgba(C.gain, 0.85) : rgba(C.loss, 0.85);
    if (inRun && sk > 0) { cv.shadowColor = C.loss; cv.shadowBlur = 30 * sk; cv.fillStyle = C.loss; } cv.fill(); cv.shadowBlur = 0; cv.restore(); }
  if (sk > 0) { const row = Math.floor(STK / 10), xa = x0 - (STK % 10) * 82 + 42, xb = x0 - ((STK + 4) % 10) * 82 - 42, y = y0 + row * 66;
    for (let j = 0; j < 5; j++) { const e = E.back(P(t, M.panj - 0.1 + 0.12 * j, 0.3)); if (e > 0) { cv.save(); cv.translate(x0 - ((STK + j) % 10) * 82, y); cv.scale(e, e); cross(0, 0, 26, '#fff', 6); cv.restore(); } }
    cv.save(); cv.globalAlpha *= sk; rr(xb - 8, y - 42, xa - xb + 16, 84, 18); cv.strokeStyle = '#fff'; cv.lineWidth = 5; cv.stroke(); cv.restore();
    tag((xa + xb) / 2, y - 76, '۵ ضرر پشت هم', C.loss, { size: 32, alpha: sk, dir: 'rtl' }); }
  txt('یک نمونه‌ی تصادفی از ۱۰۰ معامله با ۵۰٪ برد', 540, 1390, { size: 28, weight: 500, color: C.faint, alpha: P(t, M.sad + 0.4, 0.5) });
  cv.restore();
}

// ---- 4 · you panic and quit right before it works ----
const DD = curve([[0, 140], [0.12, 146], [0.45, 98], [0.55, 96]], 50, 5, 3), UP = curve([[0, 96], [0.3, 108], [0.6, 135], [1, 172]], 50, 8, 3);
function quit(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['می‌ترسی…', C.loss]], 96]], t, M.mitarsi - 0.2, S(5) + 0.1, { y: 420, hold: true, glow: rgba(C.loss, 0.6) });
  const r = { x: 150, y: 640, w: 780, h: 600 }; card(100, 580, 880, 720, { r: 40 });
  const X = (u) => r.x + u * r.w, Y = (v) => r.y + (1 - (v - 80) / 110) * r.h;
  const k1 = E.inOut(P(t, S(4) + 0.1, 1.4)); cv.save(); cv.strokeStyle = C.loss; cv.lineWidth = 6; cv.lineJoin = 'round'; cv.shadowColor = C.loss; cv.shadowBlur = 16; cv.beginPath();
  for (let i = 0; i < DD.length * k1; i++) (i ? cv.lineTo : cv.moveTo).call(cv, X(0.5 * i / (DD.length - 1)), Y(DD[i])); cv.stroke(); cv.restore();
  const bx = X(0.5), by = Y(DD[DD.length - 1]);
  if (k1 >= 1) { const pulse = (t * 1.6) % 1; dot(bx, by, C.loss, 13, pulse); }
  // what would have happened next: a ghost line to a new high
  const k2 = E.inOut(P(t, M.ghabl - 0.3, 1.2)); if (k2 > 0) { cv.save(); cv.setLineDash([14, 12]); cv.strokeStyle = rgba(C.gain, 0.85); cv.lineWidth = 5; cv.beginPath();
    for (let i = 0; i < UP.length * k2; i++) (i ? cv.lineTo : cv.moveTo).call(cv, X(0.5 + 0.5 * i / (UP.length - 1)), Y(UP[i])); cv.stroke(); cv.restore();
    if (k2 > 0.95) { tag(X(1) - 10, Y(UP[UP.length - 1]) + 50, 'درست بعدش', C.gain, { size: 28, align: 'right', dir: 'rtl' }); } }
  // the exit
  const ex = E.back(P(t, M.velesh - 0.1, 0.4)); if (ex > 0) { cv.save(); cv.translate(bx, by + 100); cv.scale(ex, ex); rr(-120, -42, 240, 84, 24); cv.fillStyle = C.loss; cv.fill(); txt('ولش کردی', 0, 3, { size: 38, weight: 800, color: '#fff' }); cv.restore();
    cv.save(); cv.globalAlpha *= clamp(ex); cv.strokeStyle = C.loss; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(bx, by + 16); cv.lineTo(bx, by + 58); cv.stroke(); cv.restore(); }
  cv.restore();
}

// ---- 5 · backtesting: see those days before they come, with zero money at risk ----
function replay(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['بک‌تست', C.lilac], ['یعنی:', C.ink]], 92], ['روزای بد رو قبل از رسیدن ببینی', 56, C.ink]], t, M.backtest - 0.2, S(6) + 0.1, { y: 390, gap: 116, hold: true, glow: rgba(C.accent, 0.7), stagger: M.ghabl2 - M.backtest - 0.2 });
  const k = E.out(P(t, S(5), 0.6)); cv.save(); cv.translate(0, (1 - k) * 260);
  const f = phone(540, 610, 820, IMG.replay, 0, 470, 1170, { h: 740 });
  // the drop on the chart, boxed as one of the "bad days" seen ahead of time
  const bk = E.out(P(t, M.ghabl2 - 0.1, 0.4)); if (bk > 0) { cv.save(); cv.globalAlpha *= bk; rr(f.X(650), f.Y(860), f.X(830) - f.X(650), f.Y(1360) - f.Y(860), 14); cv.strokeStyle = C.loss; cv.lineWidth = 5; cv.shadowColor = C.loss; cv.shadowBlur = 20; cv.stroke(); cv.restore();
    tag(f.X(740), f.Y(860) - 30, 'روز بد', C.loss, { size: 26, alpha: bk, dir: 'rtl' }); }
  tap(f.X(935), f.Y(1435), P(t, S(5) + 0.5, 0.6));
  cv.restore();
  // $0 at risk
  const zk = E.back(P(t, M.bedun - 0.1, 0.45)); if (zk > 0) { cv.save(); cv.translate(540, 1460); cv.scale(zk, zk); card(-330, -78, 660, 156, { r: 78, border: rgba(C.gain, 0.7), glow: rgba(C.gain, 0.3) });
    txt('ریسک پول واقعی:', 250, 2, { size: 40, weight: 800, color: C.ink, align: 'right' }); txt('$0', -200, 2, { size: 64, font: 'Rdx', weight: 700, color: C.gain, dir: 'ltr', glow: rgba(C.gain, 0.5) }); cv.restore(); }
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 1588, { size: 24, color: C.faint, weight: 500, alpha: k });
  cv.restore();
}

// ---- 6 · the three numbers you learn ----
function numbers(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['می‌فهمی…', C.lilac]], 92]], t, S(6), S(7) + 0.1, { y: 400, hold: true, glow: rgba(C.accent, 0.7) });
  [[M.darsad, 'درصد بردت', '۵۲٪', C.gain, 'Rdx'], [M.badtarin, 'بدترین افت حسابت', '۱۸٪−', C.loss, 'Rdx'], [M.key, 'کِی نباید بترسی', 'تا ۷ ضرر پشت هم، عادیه', C.lilac, 'Vaz']].forEach(([t0, k_, v, col, font], i) => {
    const e = E.back(P(t, t0 - 0.15, 0.45)); if (e <= 0) return; const y = 660 + i * 270;
    cv.save(); cv.translate(540, y); cv.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e); cv.globalAlpha *= clamp(e); card(-430, -100, 860, 200, { r: 36, border: rgba(col, 0.6), glow: rgba(col, 0.25) });
    txt(k_, 380, -42, { size: 34, weight: 600, color: C.muted, align: 'right' }); txt(v, 380, 30, { size: i === 2 ? 50 : 76, font, weight: 800, color: col, align: 'right', glow: rgba(col, 0.4) });
    if (i === 2) { cv.fillStyle = rgba(C.gain, 0.18); cv.beginPath(); cv.arc(-340, 0, 48, 0, 7); cv.fill(); check(-340, 0, 50, C.gain); } cv.restore(); });
  txt('اعداد نمونه‌ان؛ عددای خودت رو بک‌تست بهت می‌گه', 540, 1420, { size: 30, weight: 500, color: C.faint, alpha: E.out(P(t, M.darsad + 0.5, 0.5)) });
  cv.restore();
}

// ---- 7 · steady profit: not a magic strategy, but knowing yours ----
function magic(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['سودِ', C.gain], ['ثابت', C.gain]], 104]], t, S(7) - 0.1, S(8) + 0.1, { y: 420, hold: true, glow: rgba(C.gain, 0.6) });
  const e1 = E.back(P(t, M.jadu - 0.5, 0.45)), off = E.out(P(t, M.nemiad - 0.1, 0.35));
  if (e1 > 0) { cv.save(); cv.translate(540, 760); cv.scale(e1, e1); cv.globalAlpha *= clamp(e1) * (1 - 0.5 * off); card(-400, -110, 800, 220, { r: 40, border: rgba(C.amber, 0.6) });
    txt('استراتژی جادویی', 60, 4, { size: 66, font: 'Rdx', weight: 700, color: C.amber });
    [[-330, -40, 20], [-300, 50, 13], [340, -50, 16], [310, 40, 22]].forEach(([x, y, s], i) => sparkle(x, y, s * (1 + 0.2 * Math.sin(t * 4 + i)), C.amber, 1 - off));
    cv.restore(); }
  if (off > 0) { cv.save(); cv.strokeStyle = C.loss; cv.lineWidth = 12; cv.lineCap = 'round'; cv.shadowColor = C.loss; cv.shadowBlur = 20; cv.beginPath(); cv.moveTo(180, 760 + 10); cv.lineTo(180 + 720 * off, 760 - 10); cv.stroke(); cv.restore();
    txt('نمیاد', 540, 920, { size: 48, weight: 800, color: C.loss, alpha: off }); }
  const e2 = E.back(P(t, M.shenakhtan - 0.15, 0.5)); if (e2 > 0) { cv.save(); cv.translate(540, 1150); cv.scale(e2, e2); cv.globalAlpha *= clamp(e2); card(-420, -120, 840, 240, { r: 44, border: rgba(C.accent, 0.8), glow: rgba(C.accent, 0.45) });
    txt('شناختنِ استراتژیت', 50, 4, { size: 70, font: 'Rdx', weight: 700, color: C.lilac, glow: rgba(C.accent, 0.6) });
    cv.fillStyle = rgba(C.gain, 0.18); cv.beginPath(); cv.arc(-330, 0, 52, 0, 7); cv.fill(); check(-330, 0, 56, C.gain); cv.restore(); }
  cv.restore();
}

// ---- 8 · the platform: forex, indices, crypto; link in bio ----
function platform(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['ما', C.ink], ['یه', C.ink], ['پلتفرم', C.lilac], ['ساختیم', C.ink]], 84]], t, S(8), S(9) + 0.1, { y: 400, hold: true, glow: rgba(C.accent, 0.7) });
  const k = E.out(P(t, S(8) + 0.1, 0.6)); cv.save(); cv.translate(-(1 - k) * 300, 0); phone(340, 560, 440, IMG.sessions, 0, 0, 1170, { alpha: k, h: 750 }); cv.restore();
  [[M.forex, 'فارکس', 'EURUSD · GBPUSD', C.sky], [M.shakhes, 'شاخص', 'NAS100 · US30', C.pink], [M.crypto, 'کریپتو', 'BTCUSD · ETHUSD', C.amber]].forEach(([t0, s, sym, col], i) => {
    const e = E.back(P(t, t0 - 0.15, 0.45)); if (e <= 0) return; cv.save(); cv.translate(800, 700 + i * 220); cv.scale(e, e); cv.globalAlpha *= clamp(e);
    card(-190, -88, 380, 176, { r: 34, border: rgba(col, 0.7), glow: rgba(col, 0.25) }); txt(s, 0, -24, { size: 50, weight: 800, color: C.ink }); txt(sym, 0, 38, { size: 26, font: 'Rdx', weight: 500, color: col, dir: 'ltr' }); cv.restore(); });
  const lk = E.back(P(t, M.link - 0.15, 0.45)); if (lk > 0) { const bob = Math.sin((t - M.link) * 7) * 8 * (1 - P(t, M.link + 1.2, 0.3)); cv.save(); cv.translate(540, 1500); cv.scale(lk, lk);
    button(0, 0, 'لینکش توی بیوئه', { size: 46 }); cv.restore();
    cv.save(); cv.globalAlpha *= clamp(lk); cv.translate(540, 1400 + bob); cv.fillStyle = C.lilac; cv.beginPath(); cv.moveTo(0, -34); cv.lineTo(30, 4); cv.lineTo(11, 4); cv.lineTo(11, 34); cv.lineTo(-11, 34); cv.lineTo(-11, 4); cv.lineTo(-30, 4); cv.closePath(); cv.fill(); cv.restore(); }
  cv.restore();
}

// ---- 9 · follow ----
function follow(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['می‌خوای سودت', 76, C.ink], [[['ثابت‌تر', C.gain], ['بشه؟', C.ink]], 104]], t, S(9), DUR + 1, { y: 440, gap: 125, hold: true, glow: rgba(C.gain, 0.5) });
  const pk = E.back(P(t, S(9) + 0.6, 0.5)); if (pk > 0) { cv.save(); cv.translate(540, 950); cv.scale(pk, pk); cv.globalAlpha *= clamp(pk); card(-420, -190, 840, 380, { r: 44, border: rgba(C.accent, 0.6), glow: rgba(C.accent, 0.3) });
    if (IMG.logo) { const w = 420, h = (w * IMG.logo.height) / IMG.logo.width; cv.drawImage(IMG.logo, -w / 2, -70 - h / 2, w, h); }
    const done = P(t, M.follow + 0.05, 0.2);
    cv.save(); cv.translate(0, 100); const press = Math.sin(Math.PI * P(t, M.follow - 0.1, 0.25)); cv.scale(1 - 0.05 * press, 1 - 0.05 * press);
    if (done <= 0) { cv.shadowColor = rgba(C.accent, 0.6); cv.shadowBlur = 40; rr(-360, -56, 720, 112, 30); const g = cv.createLinearGradient(-360, 0, 360, 0); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.fill(); cv.shadowBlur = 0; txt('فالو', 0, 4, { size: 50, weight: 800, color: '#fff' }); }
    else { rr(-360, -56, 720, 112, 30); cv.fillStyle = C.raised; cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 3; cv.stroke(); txt('فالو شد', 30, 4, { size: 48, weight: 800, color: C.ink }); check(-90, 2, 40, C.gain); }
    cv.restore(); cv.restore(); }
  const fk = E.inOut(P(t, M.follow - 0.9, 0.8)); if (fk > 0 && t < M.follow + 0.8) finger(lerp(860, 600, fk), lerp(1420, 1070, fk), clamp(fk * 3) * (1 - P(t, M.follow + 0.4, 0.4)), Math.sin(Math.PI * P(t, M.follow - 0.1, 0.25)));
  tap(600, 1050, P(t, M.follow - 0.05, 0.6));
  const hk = E.out(P(t, M.follow + 0.4, 0.5)); if (hk > 0) txt('نکته‌های کوتاهِ بک‌تست و مدیریت ریسک', 540, 1300, { size: 40, weight: 700, color: C.muted, alpha: hk });
  cv.restore();
}

function render(t) {
  shake = Math.max(0, 1 - Math.abs(t - (M.sabr + 0.1)) / 0.35) * 14 + Math.max(0, 1 - Math.abs(t - (M.velesh + 0.05)) / 0.3) * 8;
  background(t, { tense: 0.9 * win(t, S(0), S(2), 0.3, 0.4) + 0.7 * win(t, S(3), S(5), 0.4, 0.4), happy: 0.6 * win(t, S(6), S(8), 0.3, 0.3) });
  cv.save(); if (shake > 0) cv.translate(Math.sin(t * 90) * shake, Math.cos(t * 77) * shake);
  order(t, 1 - E.in(P(t, S(1) - 0.3, 0.3)));
  drain(t, win(t, S(1) - 0.1, S(2) + 0.05, 0.3, 0.3));
  badDays(t, win(t, S(2) - 0.05, S(3) + 0.05, 0.3, 0.3));
  streaks(t, win(t, S(3) - 0.05, S(4) + 0.05, 0.3, 0.3));
  quit(t, win(t, S(4) - 0.05, S(5) + 0.05, 0.3, 0.3));
  replay(t, win(t, S(5) - 0.05, S(6) + 0.05, 0.3, 0.3));
  numbers(t, win(t, S(6) - 0.05, S(7) + 0.05, 0.3, 0.3));
  magic(t, win(t, S(7) - 0.05, S(8) + 0.05, 0.3, 0.3));
  platform(t, win(t, S(8) - 0.05, S(9) + 0.05, 0.3, 0.3));
  follow(t, E.out(P(t, S(9) - 0.05, 0.3)));
  cv.restore();
  chrome(t, LABEL, { dot: C.lilac });
  subs(t, SUB_ON);
  cutFx(t, [S(1) - 0.1, S(2) - 0.05, S(3) - 0.05, S(4) - 0.05, S(5) - 0.05, S(6) - 0.05, S(7) - 0.05, S(8) - 0.05, S(9) - 0.05]);
  { const k = 1 - Math.abs(t - (M.sabr + 0.05)) / 0.3; if (k > 0) { cv.fillStyle = rgba(C.loss, 0.22 * k); cv.fillRect(0, 0, W, H); } }
  finish(t);
}
boot(render, [loadImg('replay', '../c3/img/03-replay.png'), loadImg('sessions', '../c3/img/02-sessions.png')]);
