// b1 · «ترید رو شروع نکن اگه…»: why 100 trades tell you what one trade can't. The hook and the unknown result,
// one trade → a hundred, luck vs a number, two wins → real money, three losses → the strategy in the bin,
// 50% wins and a run of 5 losses (81%), "those losses were normal", backtesting with zero rial at risk,
// the replay candle by candle with the future locked (real Bitcoin daily data), the real app screens, link, follow.
const M = DATA.m, TRD = DATA.trades, STK = DATA.streak, BTC = DATA.btc;
const SUB_ON = [0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0].map(Boolean);
const LABEL = 'نکته‌ی بک‌تست · ۱';
let shake = 0;

// ---- 0 · the hook: don't start trading… (the cover) ----
function hook(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['ترید رو', 96, C.ink], [[['شروع', C.loss], ['نکن…', C.loss]], 132]], t, -1, S(1), { y: 430, gap: 150, instant: true, hold: true, glow: rgba(C.loss, 0.6) });
  card(120, 720, 840, 560, { r: 44, border: rgba(C.accent, 0.5), glow: rgba(C.accent, 0.25) });
  txt('نتیجه‌ی ۱۰۰ معامله‌ی استراتژیت', 540, 800, { size: 42, weight: 700, color: C.muted });
  const pulse = 1 + 0.05 * Math.sin(t * 5);
  txt('؟', 540, 1000, { size: 240, font: 'Rdx', weight: 700, color: C.lilac, glow: rgba(C.accent, 0.8), scale: pulse });
  [['وین‌ریت', 780], ['بدترین افت', 540], ['سود', 300]].forEach(([s, x]) => { rr(x - 110, 1150, 220, 86, 22); cv.fillStyle = rgba(C.raised, 0.9); cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 2; cv.stroke();
    txt(s, x, 1178, { size: 26, weight: 600, color: C.faint }); txt('؟', x, 1214, { size: 34, font: 'Rdx', weight: 700, color: C.muted }); });
  const ak = E.out(P(t, M.age - 0.1, 0.4)); if (ak > 0) txt('…اگه هنوز این عدد رو نمی‌دونی', 540, 1390, { size: 44, weight: 700, color: C.ink, alpha: ak, reveal: E.out(P(t, M.age - 0.1, 0.8)) });
  cv.restore();
}

// ---- 1 · not one trade: a hundred ----
function hundred(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['نه', C.ink], ['یه', C.ink], ['معامله.', C.ink]], 84]], t, S(1), M.sad1 + 0.05, { y: 430, hold: true });
  headline([[[['صدتا.', C.lilac]], 150]], t, M.sad1 - 0.1, S(2) + 0.1, { y: 430, hold: true, glow: rgba(C.accent, 0.8), instant: true });
  const k = E.out(P(t, M.sad1 - 0.05, 0.7)), x0 = 540 + 4.5 * 82, y0 = 700;
  for (let i = 0; i < 100; i++) { const tx = x0 - (i % 10) * 82, ty = y0 + Math.floor(i / 10) * 66; const d = Math.hypot(i % 10 - 4.5, Math.floor(i / 10) - 4.5) / 6.4;
    const e = i === 44 ? 1 : E.back(clamp((k - d * 0.5) / 0.5)); if (e <= 0) continue;
    const x = lerp(540, tx, i === 44 ? k : 1), y = lerp(1000, ty, i === 44 ? k : 1), s = i === 44 ? lerp(2.2, 1, k) : e;
    cv.save(); cv.translate(x, y); cv.scale(s, s); rr(-33, -26, 66, 52, 12); cv.fillStyle = i === 44 ? C.accent : rgba(C.accent, 0.55); cv.shadowColor = rgba(C.accent, 0.6); cv.shadowBlur = 16; cv.fill(); cv.restore(); }
  txt(k < 0.5 ? '۱ معامله' : '۱۰۰ معامله', 540, 1420, { size: 48, weight: 800, color: C.ink, alpha: E.out(P(t, S(1) + 0.2, 0.3)) });
  cv.restore();
}

// ---- 2 · one good trade is luck; a hundred is a number ----
function luck(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const e1 = pop(t, S(2) + 0.1), e2 = pop(t, M.shanse - 0.3 > S(2) + 0.6 ? M.shanse - 0.3 : S(2) + 0.6);
  // right: one trade → «شانس»
  if (e1 > 0) { cv.save(); cv.translate(770, 950); cv.scale(e1, e1); cv.globalAlpha *= clamp(e1); card(-200, -330, 400, 660, { r: 40, border: rgba(C.amber, 0.5) });
    txt('۱ معامله', 0, -260, { size: 40, weight: 800, color: C.muted }); badge(0, -100, 70, true);
    const sk = E.back(P(t, M.shanse - 0.15, 0.45)); if (sk > 0) { cv.save(); cv.translate(0, 120); cv.scale(sk, sk); txt('شانس', 0, 0, { size: 104, font: 'Rdx', weight: 700, color: C.amber, glow: rgba(C.amber, 0.5) }); cv.restore(); }
    txt('نمی‌شه بهش تکیه کرد', 0, 240, { size: 30, weight: 600, color: C.faint, alpha: P(t, M.shanse + 0.3, 0.4) }); cv.restore(); }
  // left: a hundred trades → «عدد»
  const e3 = pop(t, M.shanse + 0.6); if (e3 > 0) { cv.save(); cv.translate(310, 950); cv.scale(e3, e3); cv.globalAlpha *= clamp(e3); card(-200, -330, 400, 660, { r: 40, border: rgba(C.accent, 0.6), glow: rgba(C.accent, 0.25) });
    txt('۱۰۰ معامله', 0, -260, { size: 40, weight: 800, color: C.muted });
    for (let i = 0; i < 100; i++) { const x = 4.5 * 30 - (i % 10) * 30, y = -190 + Math.floor(i / 10) * 24; if (P(t, M.shanse + 0.6, 0.8) * 100 <= i) continue; rr(x - 12, y, 24, 18, 5); cv.fillStyle = TRD[i] ? rgba(C.gain, 0.85) : rgba(C.loss, 0.85); cv.fill(); }
    const nk = E.back(P(t, M.adade - 0.15, 0.45)); if (nk > 0) { cv.save(); cv.translate(0, 160); cv.scale(nk, nk); txt('عدد', 0, 0, { size: 110, font: 'Rdx', weight: 700, color: C.lilac, glow: rgba(C.accent, 0.7) }); cv.restore();
      txt('وین‌ریت، افت، سود', 0, 250, { size: 30, weight: 600, color: C.muted, alpha: clamp(nk) }); }
    cv.restore(); }
  void e2;
  cv.restore();
}

// ---- 3 · what we do: two wins → straight to real money ----
function rush(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['ولی ما چی کار می‌کنیم؟', 72, C.muted]], t, S(3), S(4) + 0.1, { y: 400, hold: true });
  tradeRow(540, 640, 820, 'EURUSD', true, '+$120', { alpha: pop(t, M.do), scale: 0.9 + 0.1 * pop(t, M.do) });
  tradeRow(540, 790, 820, 'XAUUSD', true, '+$95', { alpha: pop(t, M.do + 0.35), scale: 0.9 + 0.1 * pop(t, M.do + 0.35) });
  const dk = E.out(P(t, M.vaghei - 0.5, 0.5)); if (dk > 0) { cv.save(); cv.globalAlpha *= dk; cv.translate(0, (1 - dk) * 80);
    card(130, 960, 820, 420, { r: 40, border: rgba(C.amber, 0.6), glow: rgba(C.amber, 0.25) });
    pill(880, 1030, 'حساب واقعی', { align: 'right', size: 28, dot: C.amber, color: C.amber, border: rgba(C.amber, 0.6) });
    const amt = 5000 * E.out(P(t, M.vaghei, 0.8)); txt(usd(amt), 540, 1140, { size: 100, font: 'Rdx', weight: 700, color: C.amber, dir: 'ltr', glow: rgba(C.amber, 0.4) });
    const press = Math.sin(Math.PI * P(t, M.vaghei - 0.15, 0.3)); cv.save(); cv.translate(540, 1290); cv.scale(1 - 0.05 * press, 1 - 0.05 * press); rr(-300, -50, 600, 100, 30); cv.fillStyle = C.amber; cv.fill(); txt('واریز و شروع', 0, 4, { size: 44, weight: 800, color: '#1a1300' }); cv.restore();
    const fk = E.inOut(P(t, M.vaghei - 0.7, 0.6)); finger(lerp(860, 610, fk), lerp(1520, 1300, fk), clamp(fk * 3) * (1 - P(t, M.vaghei + 0.5, 0.3)), press);
    tap(610, 1295, P(t, M.vaghei - 0.05, 0.5));
    cv.restore(); }
  cv.restore();
}

// ---- 4 · three losses in a row → the strategy goes in the bin ----
function bin(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['سه', C.loss], ['تا', C.loss], ['ضرر', C.loss], ['پشت', C.ink], ['سر', C.ink], ['هم…', C.ink]], 76]], t, S(4), S(5) + 0.1, { y: 400, hold: true, glow: rgba(C.loss, 0.5) });
  const out = E.inOut(P(t, M.dur - 0.5, 0.7));
  for (let i = 0; i < 3; i++) { const e = pop(t, M.se + 0.45 * i, 0.35); tradeRow(540, 600 + i * 150, 820, ['EURUSD', 'GBPJPY', 'XAUUSD'][i], false, '−$100', { alpha: e * (1 - out), scale: lerp(1.25, 1, clamp(e)), glow: true }); }
  // the strategy card drops into the bin
  const sk = E.out(P(t, M.se + 1.0, 0.4)); if (sk > 0) { const fall = E.in(P(t, M.dur - 0.25, 0.55)); cv.save(); cv.globalAlpha *= sk * (1 - P(t, M.dur + 0.25, 0.1));
    cv.translate(540, lerp(1080, 1330, fall)); cv.rotate(-0.5 * fall); cv.scale(lerp(1, 0.35, fall), lerp(1, 0.35, fall));
    card(-300, -80, 600, 160, { r: 32, border: rgba(C.accent, 0.6) }); txt('استراتژی من', 0, 4, { size: 54, font: 'Rdx', weight: 700, color: C.lilac }); cv.restore(); }
  const bk = E.out(P(t, M.dur - 0.8, 0.4)); if (bk > 0) { cv.save(); cv.globalAlpha *= bk; cv.translate(540, 1390); const s = 1 + 0.08 * Math.sin(Math.PI * P(t, M.dur + 0.25, 0.3)); cv.scale(s, s);
    cv.fillStyle = C.raised; cv.strokeStyle = C.muted; cv.lineWidth = 6; cv.beginPath(); cv.moveTo(-90, -70); cv.lineTo(90, -70); cv.lineTo(70, 90); cv.lineTo(-70, 90); cv.closePath(); cv.fill(); cv.stroke();
    rr(-110, -100, 220, 28, 10); cv.fillStyle = C.muted; cv.fill(); for (const x of [-35, 0, 35]) { cv.beginPath(); cv.moveTo(x, -45); cv.lineTo(x * 0.85, 65); cv.stroke(); } cv.restore();
    txt('می‌ندازیمش دور', 540, 1540, { size: 44, weight: 800, color: C.loss, alpha: E.out(P(t, M.dur - 0.1, 0.3)) }); }
  cv.restore();
}

// ---- 5 · 50% wins, 100 trades: about 80% chance of 5 losses in a row ----
function streaks(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const c1 = pop(t, M.panjah), c2 = pop(t, M.sad5);
  [[700, '۵۰٪ برد', C.gain, c1], [380, '۱۰۰ معامله', C.sky, c2]].forEach(([x, s, col, k]) => { if (k <= 0) return; cv.save(); cv.translate(x, 380); cv.scale(k, k); cv.globalAlpha *= clamp(k);
    rr(-150, -46, 300, 92, 46); cv.fillStyle = rgba(col, 0.16); cv.fill(); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); txt(s, 0, 3, { size: 42, weight: 800, color: C.ink }); cv.restore(); });
  const nk = E.out(P(t, M.hashtad - 0.15, 0.7)); if (nk > 0) { const big = 0.85 + 0.15 * E.back(P(t, M.hashtad - 0.15, 0.5));
    txt(fa(Math.round(81 * nk)) + '٪', 450, 548, { size: 150, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.6), scale: big, alpha: clamp(nk * 2) });
    txt('احتمالِ', 760, 548, { size: 48, weight: 800, color: C.muted, alpha: clamp(nk * 2) }); }
  const sk = E.out(P(t, M.panj - 0.1, 0.25));
  const g = grid100(540, 700, TRD, { fill: P(t, M.sad5 - 0.2, 1.6), run: STK, runK: sk });
  if (sk > 0) { const y = g.y(STK), xa = g.x(STK) + 42, xb = g.x(STK + 4) - 42;
    for (let j = 0; j < 5; j++) { const e = E.back(P(t, M.panj - 0.1 + 0.12 * j, 0.3)); if (e > 0) { cv.save(); cv.translate(g.x(STK + j), y); cv.scale(e, e); cross(0, 0, 26, '#fff', 6); cv.restore(); } }
    cv.save(); cv.globalAlpha *= sk; rr(xb - 8, y - 42, xa - xb + 16, 84, 18); cv.strokeStyle = '#fff'; cv.lineWidth = 5; cv.stroke(); cv.restore();
    tag((xa + xb) / 2, y - 76, '۵ ضرر پشت هم', C.loss, { size: 32, alpha: sk, dir: 'rtl' }); }
  txt('یک نمونه‌ی تصادفی از ۱۰۰ معامله با ۵۰٪ برد', 540, 1390, { size: 28, weight: 500, color: C.faint, alpha: P(t, M.sad5 + 0.4, 0.5) });
  cv.restore();
}

// ---- 6 · those losses were normal; you just didn't know ----
function normal(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([['اون ضررها', 76, C.ink], [[['عادی', C.gain], ['بودن.', C.gain]], 120]], t, S(6), S(7) + 0.1, { y: 420, gap: 140, hold: true, glow: rgba(C.gain, 0.5) });
  card(140, 760, 800, 330, { r: 40 });
  for (let j = 0; j < 5; j++) { const x = 540 + (2 - j) * 130; rr(x - 52, 880, 104, 84, 18); cv.fillStyle = rgba(C.loss, 0.85); cv.fill(); cross(x, 922, 32, '#fff', 7); }
  txt('۵ ضرر پشت هم توی ۱۰۰ معامله', 540, 1030, { size: 32, weight: 600, color: C.muted });
  const st = P(t, M.adi - 0.1, 0.35); if (st > 0) { cv.save(); cv.translate(760, 820); cv.rotate(-0.16); const s = lerp(1.8, 1, E.out(st)); cv.scale(s, s); cv.globalAlpha *= clamp(st * 3);
    rr(-150, -54, 300, 108, 24); cv.fillStyle = rgba(C.bg, 0.9); cv.fill(); cv.strokeStyle = C.gain; cv.lineWidth = 7; cv.stroke(); txt('عادیه', 30, 4, { size: 56, font: 'Rdx', weight: 700, color: C.gain }); check(-85, 2, 40, C.gain); cv.restore(); }
  const kk = E.out(P(t, M.khabar - 0.4, 0.5)); if (kk > 0) txt('فقط خبر نداشتی.', 540, 1260, { size: 66, font: 'Rdx', weight: 700, color: C.lilac, alpha: kk, reveal: kk, glow: rgba(C.accent, 0.6) });
  cv.restore();
}

// ---- 7 · backtesting shows you this, before you spend one rial ----
function backtest(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['بک‌تست', C.lilac]], 140], ['همینو نشونت می‌ده', 66, C.ink]], t, M.backtest - 0.2, S(8) + 0.1, { y: 430, gap: 150, hold: true, glow: rgba(C.accent, 0.8) });
  const gk = E.out(P(t, S(7) + 0.2, 0.5)); if (gk > 0) { cv.save(); cv.globalAlpha *= gk; card(250, 680, 580, 400, { r: 36 });
    for (let i = 0; i < 100; i++) { const x = 540 + 4.5 * 46 - (i % 10) * 46, y = 730 + Math.floor(i / 10) * 32, inRun = i >= STK && i < STK + 5; rr(x - 18, y - 12, 36, 24, 6); cv.fillStyle = TRD[i] ? rgba(C.gain, inRun ? 1 : 0.55) : rgba(C.loss, inRun ? 1 : 0.55); cv.fill(); }
    txt('قبل از اینکه برسه', 540, 1050, { size: 32, weight: 700, color: C.muted }); cv.restore(); }
  const zk = pop(t, M.rial); if (zk > 0) { cv.save(); cv.translate(540, 1260); cv.scale(zk, zk); cv.globalAlpha *= clamp(zk); card(-380, -84, 760, 168, { r: 84, border: rgba(C.gain, 0.7), glow: rgba(C.gain, 0.3) });
    txt('ریسک پول واقعی:', 300, 2, { size: 42, weight: 800, color: C.ink, align: 'right' }); txt('صفر ریال', -170, 2, { size: 66, font: 'Rdx', weight: 700, color: C.gain, glow: rgba(C.gain, 0.5) }); cv.restore(); }
  cv.restore();
}

// ---- 8 · candle by candle, without seeing the future (real Bitcoin daily candles) ----
function replay(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['توی', C.ink], ['بک‌تست‌لب', C.lilac]], 92]], t, S(8), S(9) + 0.1, { y: 400, hold: true, glow: rgba(C.accent, 0.7) });
  const R = { x: 150, y: 660, w: 780, h: 520 }; card(110, 590, 860, 760, { r: 40 });
  txt('بیت‌کوین · روزانه', 920, 630, { size: 28, weight: 600, color: C.muted, align: 'right' }); pill(170, 630, 'داده‌ی واقعی', { align: 'left', size: 24, dot: C.gain });
  const n = BTC.length, show = Math.floor(lerp(n * 0.45, n * 0.82, E.inOut(P(t, M.candle - 0.3, (M.ayande - M.candle) + 0.6))));
  let lo = Infinity, hi = -Infinity; BTC.forEach((c) => { lo = Math.min(lo, c[2]); hi = Math.max(hi, c[1]); });
  candles(R, BTC, 0, show, { span: n, lo: lo * 0.97, hi: hi * 1.03 });
  // the future, locked
  const fx_ = R.x + (show / n) * R.w; cv.save(); cv.fillStyle = rgba(C.side, 0.92); cv.fillRect(fx_ + 4, R.y - 10, R.x + R.w - fx_ + 10, R.h + 20);
  cv.setLineDash([12, 10]); cv.strokeStyle = C.lilac; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(fx_ + 2, R.y - 10); cv.lineTo(fx_ + 2, R.y + R.h + 10); cv.stroke(); cv.restore();
  const lk = E.out(P(t, M.ayande - 0.3, 0.4)), lx = (fx_ + R.x + R.w) / 2;
  if (R.x + R.w - fx_ > 120) { cv.save(); cv.globalAlpha *= 0.6 + 0.4 * lk; cv.translate(lx, R.y + R.h / 2); const s = 1 + 0.15 * E.back(P(t, M.ayande - 0.3, 0.4)) * (1 - P(t, M.ayande + 0.4, 0.3)); cv.scale(s, s);
    rr(-34, -10, 68, 54, 12); cv.fillStyle = C.lilac; cv.fill(); cv.strokeStyle = C.lilac; cv.lineWidth = 9; cv.beginPath(); cv.arc(0, -10, 22, Math.PI, 0); cv.stroke();
    txt('آینده', 0, 90, { size: 34, weight: 800, color: C.lilac }); cv.restore(); }
  // the app's play bar
  cv.save(); rr(250, 1230, 580, 90, 45); cv.fillStyle = rgba(C.raised, 0.95); cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 2; cv.stroke();
  cv.fillStyle = C.accent; cv.beginPath(); cv.arc(780, 1275, 32, 0, 7); cv.fill(); cv.fillStyle = '#fff'; cv.beginPath(); cv.moveTo(770, 1260); cv.lineTo(796, 1275); cv.lineTo(770, 1290); cv.fill();
  rr(320, 1270, 380, 10, 5); cv.fillStyle = C.line; cv.fill(); rr(320, 1270, 380 * (show / n), 10, 5); cv.fillStyle = C.accent; cv.fill();
  txt('کندل به کندل', 510, 1250, { size: 22, weight: 600, color: C.muted }); cv.restore();
  cv.restore();
}

// ---- 9 · trade, journal, stats: the real app screens ----
function app(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const steps = [[M.moamele, 'معامله'], [M.journal, 'ژورنال'], [M.amar, 'آمار']], cur = steps.reduce((c, [t0], i) => (t >= t0 - 0.15 ? i : c), 0);
  steps.forEach(([t0, s], i) => { const x = 760 - i * 220, on = i === cur, e = pop(t, i === 0 ? S(9) : t0); if (e <= 0) return; cv.save(); cv.translate(x, 400); cv.scale(e * (on ? 1.08 : 1), e * (on ? 1.08 : 1)); cv.globalAlpha *= clamp(e);
    rr(-95, -44, 190, 88, 44); cv.fillStyle = on ? rgba(C.accent, 0.9) : rgba(C.surface, 0.9); cv.fill(); cv.strokeStyle = on ? C.accent : C.line; cv.lineWidth = 2; cv.stroke(); txt(s, 0, 3, { size: 38, weight: 800, color: on ? '#fff' : C.muted }); cv.restore(); });
  const k = E.out(P(t, S(9), 0.5)); cv.save(); cv.translate(0, (1 - k) * 200);
  const shots = [[IMG.replay, 0, 383], [IMG.journal, 0, 1580], [IMG.analytics, 0, 1780]], [img, sx, sy] = shots[cur];
  const f = phone(540, 520, 640, img, sx, sy, 1170, { alpha: k, h: 880 });
  const ck = P(t, steps[cur][0] - 0.15, 0.25); if (ck < 1) { cv.save(); cv.globalAlpha *= 1 - ck; rr(540 - 320, 520, 640, 880, 48); cv.fillStyle = C.bg; cv.fill(); cv.restore(); }
  if (cur === 0) tap(f.X(1036), f.Y(1828), P(t, M.moamele + 0.2, 0.6));
  cv.restore();
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 1460, { size: 24, color: C.faint, weight: 500, alpha: k });
  cv.restore();
}

function render(t) {
  shake = Math.max(0, 1 - Math.abs(t - (M.nakon + 0.05)) / 0.35) * 14;
  for (let i = 0; i < 3; i++) shake += Math.max(0, 1 - Math.abs(t - (M.se + 0.45 * i)) / 0.25) * 9;
  background(t, { tense: 0.8 * win(t, 0, S(1), 0.01, 0.4) + 0.8 * win(t, S(4), S(6), 0.3, 0.4), happy: 0.6 * win(t, S(6), S(8), 0.3, 0.3) });
  cv.save(); if (shake > 0) cv.translate(Math.sin(t * 90) * shake, Math.cos(t * 77) * shake);
  hook(t, 1 - E.in(P(t, S(1) - 0.3, 0.3)));
  hundred(t, win(t, S(1) - 0.1, S(2) + 0.05, 0.3, 0.3));
  luck(t, win(t, S(2) - 0.05, S(3) + 0.05, 0.3, 0.3));
  rush(t, win(t, S(3) - 0.05, S(4) + 0.05, 0.3, 0.3));
  bin(t, win(t, S(4) - 0.05, S(5) + 0.05, 0.3, 0.3));
  streaks(t, win(t, S(5) - 0.05, S(6) + 0.05, 0.3, 0.3));
  normal(t, win(t, S(6) - 0.05, S(7) + 0.05, 0.3, 0.3));
  backtest(t, win(t, S(7) - 0.05, S(8) + 0.05, 0.3, 0.3));
  replay(t, win(t, S(8) - 0.05, S(9) + 0.05, 0.3, 0.3));
  app(t, win(t, S(9) - 0.05, S(10) + 0.05, 0.3, 0.3));
  linkScene(t, win(t, S(10) - 0.05, S(11) + 0.05, 0.3, 0.3), M.link, M.raygan);
  followScene(t, E.out(P(t, S(11) - 0.05, 0.3)), S(11), Math.max(M.follow + 0.9, S(11) + 1.0), 'تا نکته‌ی بعدی رو از دست ندی', { head: [[[['فالو', C.lilac], ['کن', C.ink]], 110]] });
  cv.restore();
  chrome(t, LABEL, { dot: C.lilac });
  subs(t, SUB_ON);
  cutFx(t, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => S(k) - 0.05));
  { const k = 1 - Math.abs(t - (M.nakon + 0.05)) / 0.3; if (k > 0) { cv.fillStyle = rgba(C.loss, 0.2 * k); cv.fillRect(0, 0, W, H); } }
  finish(t);
}
boot(render, [loadImg('replay', '../c3/img/03-replay.png'), loadImg('journal', '../c3/img/full-04-journal.png'), loadImg('analytics', '../c3/img/full-05-analytics.png')]);
