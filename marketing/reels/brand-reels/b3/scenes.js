// b3 · «قبل از اینکه پوزیشن باز کنی، اینو بدون»: know the worst days before you take risk. A position with a «؟» over its stop,
// the best vs the worst stretch of an equity curve, 8 losses in a row, 35% wins → 69% chance of it in 100 trades,
// the same 8 losses at 1% risk (−7.7%) and at 10% risk (−57%), "only one number was different", test it first,
// backtesting = see the worst days then risk, the app's lot size from risk % and longest losing streak, link, follow.
const M = DATA.m, TRD = DATA.trades, STK = DATA.streak, DD = DATA.dd;
const SUB_ON = [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0].map(Boolean);
const LABEL = 'نکته‌ی بک‌تست · ۳';
let shake = 0;
const fa1 = (v) => fa(v, 1);

// ---- 0 · the hook: before you open a position, know this (the cover) ----
const HC = (() => { const r = rng(9), out = []; let p = 100; for (let i = 0; i < 46; i++) { const o = p, c = p + (r() - 0.45) * 2.4; out.push([o, Math.max(o, c) + r() * 1.2, Math.min(o, c) - r() * 1.2, c]); p = c; } return out; })();
function hook(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['قبل از اینکه', 78, C.ink], [[['پوزیشن', C.lilac], ['باز', C.lilac], ['کنی', C.lilac]], 112]], t, -1, S(1), { y: 400, gap: 140, instant: true, hold: true, glow: rgba(C.accent, 0.7) });
  const R = { x: 150, y: 700, w: 520, h: 520 }; card(110, 640, 860, 680, { r: 44 });
  const ch = candles(R, HC, 0, HC.length, { span: HC.length });
  const entry = HC[HC.length - 1][3], x0 = R.x + R.w + 10, x1 = 930, ye = ch.Y(entry), yt = ch.Y(entry + 6), ys = ch.Y(entry - 4);
  cv.save(); cv.fillStyle = rgba(C.gain, 0.18); cv.fillRect(x0, yt, x1 - x0, ye - yt); cv.fillStyle = rgba(C.loss, 0.22); cv.fillRect(x0, ye, x1 - x0, ys - ye);
  cv.strokeStyle = C.ink; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(x0, ye); cv.lineTo(x1, ye); cv.stroke(); cv.restore();
  tag(x1 - 10, yt + 26, 'حد سود', C.gain, { size: 24, align: 'right', dir: 'rtl' }); tag(x1 - 10, ys - 26, 'حد ضرر', C.loss, { size: 24, align: 'right', dir: 'rtl' });
  const q = 1 + 0.08 * Math.sin(t * 5); txt('؟', (x0 + x1) / 2, (ye + ys) / 2 + 8, { size: 120, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.7), scale: q });
  const bk = E.back(P(t, M.bedun - 0.15, 0.45)); if (bk > 0) { cv.save(); cv.translate(540, 1430); cv.scale(bk, bk); txt('اینو بدون…', 0, 0, { size: 88, font: 'Rdx', weight: 700, color: C.amber, glow: rgba(C.amber, 0.5) }); cv.restore(); }
  cv.restore();
}

// ---- 1 · what do your strategy's worst days look like? not the best: the worst ----
const EQ = curve([[0, 100], [0.12, 118], [0.2, 112], [0.32, 140], [0.38, 146], [0.5, 112], [0.58, 104], [0.66, 118], [0.78, 150], [0.9, 163], [1, 176]], 120, 21, 3);
function worst(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['بدترین روزهای استراتژیت', 70, C.ink], [[['چه', C.loss], ['شکلیه؟', C.loss]], 100]], t, S(1), S(2) + 0.1, { y: 400, gap: 120, hold: true, glow: rgba(C.loss, 0.5) });
  const R = { x: 150, y: 700, w: 780, h: 520 }; card(100, 640, 880, 680, { r: 40 });
  const s = series(R, EQ, { upto: 2 + 118 * E.inOut(P(t, S(1), 1.4)), lo: 90, hi: 180, color: C.accent, fill: C.accent, glow: true });
  // the best stretch (struck out) and the worst (the drawdown)
  const bk = E.out(P(t, M.behtarin - 0.15, 0.35)); if (bk > 0) { const i = 46; cv.save(); cv.globalAlpha *= bk * (1 - 0.5 * P(t, M.badtarinesh - 0.1, 0.3)); dot(s.X(i), s.Y(EQ[i]), C.gain, 12); tag(s.X(i), s.Y(EQ[i]) - 60, 'بهترینش؟', C.gain, { size: 28, dir: 'rtl' }); cross(s.X(i) + 90, s.Y(EQ[i]) - 60, 36, C.loss, 7); cv.restore(); }
  const wk = E.out(P(t, M.badtarinesh - 0.15, 0.4)); if (wk > 0) { const i0 = 46, i1 = 70; cv.save(); cv.globalAlpha *= wk; cv.fillStyle = rgba(C.loss, 0.18); cv.fillRect(s.X(i0), R.y - 10, s.X(i1) - s.X(i0), R.h + 20);
    cv.strokeStyle = C.loss; cv.lineWidth = 7; cv.shadowColor = C.loss; cv.shadowBlur = 16; cv.beginPath(); for (let i = i0; i <= i1; i++) (i === i0 ? cv.moveTo : cv.lineTo).call(cv, s.X(i), s.Y(EQ[i])); cv.stroke(); cv.restore();
    tag((s.X(i0) + s.X(i1)) / 2, R.y + R.h + 40, 'بدترینش', C.loss, { size: 34, alpha: wk, dir: 'rtl' }); }
  cv.restore();
}

// ---- 2 · imagine 8 losses in a row ----
function eight(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['فرض کن', 76, C.ink], [[['۸', C.loss], ['ضرر', C.loss], ['پشت', C.ink], ['سر', C.ink], ['هم', C.ink]], 104]], t, S(2), S(3) + 0.1, { y: 420, gap: 140, hold: true, glow: rgba(C.loss, 0.5) });
  let n = 0; for (let j = 0; j < 8; j++) { const e = E.back(P(t, M.hashta - 0.1 + 0.14 * j, 0.3)); if (e > 0) n = j + 1;
    const row = Math.floor(j / 4), col = j % 4, x = 765 - col * 150, y = 820 + row * 150; cv.save(); cv.translate(x, y); cv.scale(e, e); cv.globalAlpha *= clamp(e);
    rr(-62, -52, 124, 104, 22); cv.fillStyle = rgba(C.loss, 0.88); cv.shadowColor = C.loss; cv.shadowBlur = 20; cv.fill(); cv.shadowBlur = 0; cross(0, 0, 40, '#fff', 8); cv.restore(); }
  if (n > 0) txt(fa(n), 540, 1200, { size: 150, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.6) });
  cv.restore();
}

// ---- 3 · no joke: at 35% wins, in 100 trades, the chance is close to 70% ----
function chance(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const c1 = pop(t, M.si5), c2 = pop(t, M.sad);
  [[700, '۳۵٪ برد', C.gain, c1], [380, '۱۰۰ معامله', C.sky, c2]].forEach(([x, s, col, k]) => { if (k <= 0) return; cv.save(); cv.translate(x, 380); cv.scale(k, k); cv.globalAlpha *= clamp(k);
    rr(-150, -46, 300, 92, 46); cv.fillStyle = rgba(col, 0.16); cv.fill(); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); txt(s, 0, 3, { size: 42, weight: 800, color: C.ink }); cv.restore(); });
  const nk = E.out(P(t, M.haftad - 0.15, 0.7)); if (nk > 0) { const big = 0.85 + 0.15 * E.back(P(t, M.haftad - 0.15, 0.5));
    txt(fa(Math.round(69 * nk)) + '٪', 450, 548, { size: 150, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.6), scale: big, alpha: clamp(nk * 2) });
    txt('احتمالِ', 760, 548, { size: 48, weight: 800, color: C.muted, alpha: clamp(nk * 2) }); }
  const sk = E.out(P(t, M.haftad - 0.4, 0.3));
  // the grid highlights a run of 8 (grid100 marks 5: draw the full run here)
  const g = grid100(540, 700, TRD, { fill: P(t, M.sad - 0.2, 1.6) });
  if (sk > 0) { const y = g.y(STK), xa = g.x(STK) + 42, xb = g.x(STK + 7) - 42;
    for (let j = 0; j < 8; j++) { const e = E.back(P(t, M.haftad - 0.4 + 0.08 * j, 0.3)); if (e > 0) { cv.save(); cv.translate(g.x(STK + j), y); cv.scale(e, e); rr(-33, -26, 66, 52, 12); cv.fillStyle = C.loss; cv.shadowColor = C.loss; cv.shadowBlur = 24; cv.fill(); cv.shadowBlur = 0; cross(0, 0, 24, '#fff', 6); cv.restore(); } }
    cv.save(); cv.globalAlpha *= sk; rr(xb - 8, y - 42, xa - xb + 16, 84, 18); cv.strokeStyle = '#fff'; cv.lineWidth = 5; cv.stroke(); cv.restore();
    tag((xa + xb) / 2, y - 76, '۸ ضرر پشت هم', C.loss, { size: 32, alpha: sk, dir: 'rtl' }); }
  txt('یک نمونه‌ی تصادفی از ۱۰۰ معامله با ۳۵٪ برد', 540, 1390, { size: 28, weight: 500, color: C.faint, alpha: P(t, M.sad + 0.4, 0.5) });
  cv.restore();
}

/** An account after the 8 losses: risk per trade, the balance draining, the drawdown. */
function account(t, cx, cy, w, risk, t0, o = {}) {
  const e = pop(t, t0); if (e <= 0) return; const bad = risk >= 5, col = bad ? C.loss : C.gain, k = E.inOut(P(t, t0 + 0.2, 1.4));
  cv.save(); cv.translate(cx, cy); cv.scale(e * (o.scale ?? 1), e * (o.scale ?? 1)); cv.globalAlpha *= clamp(e);
  card(-w / 2, -250, w, 500, { r: 40, border: rgba(col, 0.6), glow: o.glow ? rgba(col, 0.4) : undefined });
  pill(w / 2 - 40, -190, 'ریسک ' + fa(risk) + '٪ در هر معامله', { align: 'right', size: 30, dot: col, color: C.ink, border: rgba(col, 0.6) });
  const bal = 10000 * Math.pow(1 - risk / 100, 8 * k);
  txt(usd(bal), w / 2 - 40, -80, { size: o.small ? 64 : 92, font: 'Rdx', weight: 700, color: C.ink, align: 'right', dir: 'ltr' });
  // 8 losses ticking in
  for (let j = 0; j < 8; j++) { const on = k * 8 > j; const x = w / 2 - 70 - j * ((w - 120) / 8); rr(x - 20, 10, 40, 34, 8); cv.fillStyle = on ? rgba(C.loss, 0.85) : rgba(C.line, 0.6); cv.fill(); }
  // the bar: what's left of the account; half marked
  const bw = w - 80; rr(-bw / 2, 90, bw, 34, 17); cv.fillStyle = rgba(C.line, 0.7); cv.fill(); rr(bw / 2 - bw * (bal / 10000), 90, bw * (bal / 10000), 34, 17); cv.fillStyle = col; cv.fill();
  dashLine(0, 76, 0, 140, rgba(C.ink, 0.6), 3, [6, 6]); txt('نصف', 0, 166, { size: 24, weight: 700, color: C.faint });
  txt('−' + fa1(DD[risk] * k) + '٪', -w / 2 + 40, -80, { size: o.small ? 52 : 70, font: 'Rdx', weight: 700, color: col, align: 'left', dir: 'ltr', alpha: clamp(k * 3) });
  cv.restore();
}

// ---- 4 · at 1% risk: about −8%, bearable ----
function risk1(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['با', C.ink], ['ریسک', C.ink], ['۱٪', C.gain]], 100]], t, S(4), S(5) + 0.1, { y: 420, hold: true, glow: rgba(C.gain, 0.5) });
  account(t, 540, 900, 860, 1, S(4) + 0.2);
  const ok = E.back(P(t, M.ghabel - 0.15, 0.45)); if (ok > 0) { cv.save(); cv.translate(540, 1300); cv.scale(ok, ok); cv.globalAlpha *= clamp(ok); card(-300, -64, 600, 128, { r: 64, border: rgba(C.gain, 0.7) }); txt('قابل تحمله', 40, 3, { size: 50, font: 'Rdx', weight: 700, color: C.gain }); check(-200, 0, 46, C.gain); cv.restore(); }
  cv.restore();
}

// ---- 5 · at 10% risk: more than half the account is gone ----
function risk10(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['با', C.ink], ['ریسک', C.ink], ['۱۰٪؟', C.loss]], 100]], t, S(5), S(6) + 0.1, { y: 420, hold: true, glow: rgba(C.loss, 0.5) });
  account(t, 540, 900, 860, 10, S(5) + 0.2);
  const nk = E.out(P(t, M.nesf - 0.3, 0.5)); if (nk > 0) txt('بیشتر از نصف حسابت رفته', 540, 1300, { size: 56, font: 'Rdx', weight: 700, color: C.loss, alpha: nk, reveal: nk, glow: rgba(C.loss, 0.5) });
  cv.restore();
}

// ---- 6 · the same strategy, the same trades: only one number was different ----
function same(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['همون استراتژی، همون معامله‌ها', 62, C.ink], [[['فقط', C.lilac], ['یه', C.lilac], ['عدد', C.lilac], ['فرق', C.ink], ['داشت', C.ink]], 88]], t, S(6), S(7) + 0.1, { y: 400, gap: 120, hold: true, glow: rgba(C.accent, 0.7) });
  const hk = E.out(P(t, M.adad - 0.2, 0.4));
  account(t, 770, 930, 440, 1, S(6) + 0.1, { small: true, scale: 1 });
  account(t, 310, 930, 440, 10, S(6) + 0.3, { small: true, scale: 1 });
  if (hk > 0) { cv.save(); cv.globalAlpha *= hk; for (const x of [770, 310]) { rr(x - 205, 712, 410, 56, 28); cv.strokeStyle = C.lilac; cv.lineWidth = 5; cv.shadowColor = C.accent; cv.shadowBlur = 24; cv.stroke(); } cv.restore();
    txt('≠', 540, 740, { size: 80, font: 'Rdx', weight: 700, color: C.lilac, alpha: hk, glow: rgba(C.accent, 0.8) }); }
  cv.restore();
}

// ---- 7 · you only find out if you tested it first ----
function tested(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['اینو فقط وقتی می‌فهمی که', 66, C.ink], [[['قبلش', C.lilac], ['تستش', C.lilac], ['کرده', C.ink], ['باشی', C.ink]], 92]], t, S(7), S(8) + 0.1, { y: 560, gap: 130, hold: true, glow: rgba(C.accent, 0.7) });
  const st = P(t, M.test - 0.12, 0.35); if (st > 0) { cv.save(); cv.translate(540, 1030); cv.rotate(-0.08); const s = lerp(1.8, 1, E.out(st)); cv.scale(s, s); cv.globalAlpha *= clamp(st * 3);
    rr(-260, -100, 520, 200, 36); cv.fillStyle = rgba(C.bg, 0.88); cv.fill(); cv.strokeStyle = C.gain; cv.lineWidth = 9; cv.stroke(); txt('تست شده', 40, 6, { size: 84, font: 'Rdx', weight: 700, color: C.gain, glow: rgba(C.gain, 0.6) }); check(-190, 4, 60, C.gain); cv.restore(); }
  cv.restore();
}

// ---- 8 · backtesting means: see the worst days first, then take risk ----
function means(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['بک‌تست', C.lilac], ['یعنی:', C.ink]], 110]], t, M.backtest - 0.2, S(9) + 0.1, { y: 430, hold: true, glow: rgba(C.accent, 0.8) });
  [[M.badtarin8, '۱', 'اول بدترین روزها رو ببین', C.loss], [M.risk8, '۲', 'بعد ریسک کن', C.gain]].forEach(([t0, n, s, col], i) => { const e = pop(t, t0 - 0.1); if (e <= 0) return;
    cv.save(); cv.translate(540, 760 + i * 260); cv.scale(e, e); cv.globalAlpha *= clamp(e); card(-420, -100, 840, 200, { r: 40, border: rgba(col, 0.6), glow: rgba(col, 0.25) });
    cv.fillStyle = rgba(col, 0.18); cv.beginPath(); cv.arc(330, 0, 56, 0, 7); cv.fill(); txt(n, 330, 4, { size: 64, font: 'Rdx', weight: 700, color: col });
    txt(s, 240, 4, { size: 54, font: 'Rdx', weight: 700, color: C.ink, align: 'right' }); cv.restore(); });
  cv.restore();
}

// ---- 9 · the app: lot size from your risk %, and your longest losing streak (real screens) ----
function app(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const second = t >= M.bishtarin - 0.25;
  headline([[[['توی', C.ink], ['بک‌تست‌لب', C.lilac]], 84]], t, S(9), S(10) + 0.1, { y: 400, hold: true, glow: rgba(C.accent, 0.7) });
  const k = E.out(P(t, S(9), 0.5)); cv.save(); cv.translate(0, (1 - k) * 200);
  // the phone ends above the three-line subtitle of this line
  const f = second ? phone(540, 500, 640, IMG.analytics, 0, 5880, 1170, { alpha: k, h: 760 }) : phone(540, 500, 640, IMG.replay, 0, 603, 1170, { alpha: k, h: 760 });
  if (second) { const ck = P(t, M.bishtarin - 0.25, 0.25); if (ck < 1) { cv.save(); cv.globalAlpha *= 1 - ck; rr(220, 500, 640, 760, 48); cv.fillStyle = C.bg; cv.fill(); cv.restore(); } }
  if (!second) {
    const hk = E.out(P(t, M.hajm - 0.15, 0.4)); if (hk > 0) { cv.save(); cv.globalAlpha *= hk; rr(f.X(210), f.Y(1790), f.X(664) - f.X(210), f.Y(1870) - f.Y(1790), 14); cv.strokeStyle = C.amber; cv.lineWidth = 5; cv.shadowColor = C.amber; cv.shadowBlur = 20; cv.stroke();
      rr(f.X(850), f.Y(1905), f.X(1160) - f.X(850), f.Y(1975) - f.Y(1905), 14); cv.stroke(); cv.restore();
      tag(f.X(437), f.Y(1790) - 40, 'درصد ریسک', C.amber, { size: 28, alpha: hk, dir: 'rtl' }); tag(f.X(1000), f.Y(1905) - 40, 'حجم: خودکار', C.amber, { size: 28, alpha: hk, dir: 'rtl' }); }
  } else {
    const hk = E.out(P(t, M.bishtarin + 0.1, 0.4)); if (hk > 0) { cv.save(); cv.globalAlpha *= hk; rr(f.X(70), f.Y(6455), f.X(1110) - f.X(70), f.Y(6545) - f.Y(6455), 14); cv.strokeStyle = C.loss; cv.lineWidth = 5; cv.shadowColor = C.loss; cv.shadowBlur = 20; cv.stroke(); cv.restore();
      tag(540, f.Y(6455) - 44, 'بیشترین ضررهای پشت سر هم', C.loss, { size: 30, alpha: hk, dir: 'rtl' }); }
  }
  cv.restore();
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 1305, { size: 24, color: C.faint, weight: 500, alpha: k });
  cv.restore();
}

function render(t) {
  shake = Math.max(0, 1 - Math.abs(t - (M.badtarinesh + 0.05)) / 0.3) * 8 + Math.max(0, 1 - Math.abs(t - (M.nesf + 0.1)) / 0.3) * 10;
  background(t, { tense: 0.6 * win(t, 0, S(1), 0.01, 0.4) + 0.8 * win(t, S(2), S(4), 0.3, 0.3) + 0.8 * win(t, S(5), S(6), 0.3, 0.3), happy: 0.5 * win(t, S(4), S(5), 0.3, 0.3) + 0.6 * win(t, S(7), S(9), 0.3, 0.3) });
  cv.save(); if (shake > 0) cv.translate(Math.sin(t * 90) * shake, Math.cos(t * 77) * shake);
  hook(t, 1 - E.in(P(t, S(1) - 0.3, 0.3)));
  worst(t, win(t, S(1) - 0.1, S(2) + 0.05, 0.3, 0.3));
  eight(t, win(t, S(2) - 0.05, S(3) + 0.05, 0.3, 0.3));
  chance(t, win(t, S(3) - 0.05, S(4) + 0.05, 0.3, 0.3));
  risk1(t, win(t, S(4) - 0.05, S(5) + 0.05, 0.3, 0.3));
  risk10(t, win(t, S(5) - 0.05, S(6) + 0.05, 0.3, 0.3));
  same(t, win(t, S(6) - 0.05, S(7) + 0.05, 0.3, 0.3));
  tested(t, win(t, S(7) - 0.05, S(8) + 0.05, 0.3, 0.3));
  means(t, win(t, S(8) - 0.05, S(9) + 0.05, 0.3, 0.3));
  app(t, win(t, S(9) - 0.05, S(10) + 0.05, 0.3, 0.3));
  linkScene(t, win(t, S(10) - 0.05, S(11) + 0.05, 0.3, 0.3), M.link, M.raygan, { freeTop: 'رایگان', freeBig: 'شروع کن', freeSize: 100 });
  followScene(t, E.out(P(t, S(11) - 0.05, 0.3)), S(11), Math.max(M.follow + 0.9, S(11) + 1.0), 'قبل از معامله‌ی بعدیت به کارت میاد', { head: [[[['فالو', C.lilac], ['کن', C.ink]], 110]] });
  cv.restore();
  chrome(t, LABEL, { dot: C.lilac });
  subs(t, SUB_ON);
  cutFx(t, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => S(k) - 0.05));
  finish(t);
}
boot(render, [loadImg('replay', '../c3/img/03-replay.png'), loadImg('analytics', '../c3/img/full-05-analytics.png')]);
