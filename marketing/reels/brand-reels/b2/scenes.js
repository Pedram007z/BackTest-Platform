// b2 · «۹۰٪ تریدرها این اشتباه رو می‌کنن…»: judging a strategy after 20 trades. The hook (and "probably you too"),
// 20 trades then the verdict, "this is it!" / "next one", the thing nobody says, 30 traders with the same 50% strategy
// spreading from 30% to 70% after 20 trades and closing in on 45–55% after 500, a year of real trading for 500 trades,
// backtesting at full speed, the real app screens, link, follow.
const M = DATA.m, W20 = DATA.w20, W500 = DATA.w500;
const SUB_ON = [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0].map(Boolean);
const LABEL = 'نکته‌ی بک‌تست · ۲';
let shake = 0;

function person(x, y, s, col, a = 1) { cv.save(); cv.globalAlpha *= a; cv.translate(x, y); cv.scale(s, s); cv.fillStyle = col;
  cv.beginPath(); cv.arc(0, -58, 32, 0, 7); cv.fill(); rr(-48, -14, 96, 82, 34); cv.fill(); cv.restore(); }

// ---- 0 · the hook: 90% of traders make this mistake… probably you too (the cover) ----
function hook(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['۹۰٪', C.loss], ['تریدرها', C.ink]], 130], ['این اشتباه رو می‌کنن…', 70, C.ink]], t, -1, S(1), { y: 420, gap: 150, instant: true, hold: true, glow: rgba(C.loss, 0.6) });
  card(110, 680, 860, 640, { r: 44 });
  const you = 6, yk = E.out(P(t, M.to - 0.15, 0.4));
  for (let i = 0; i < 10; i++) { const row = Math.floor(i / 5), col = i % 5, x = 860 - col * 160, y = 860 + row * 260, red = i !== 9;
    const s = i === you ? 1 + 0.18 * yk : 1; person(x, y, s, red ? rgba(C.loss, 0.85) : rgba(C.gain, 0.85), i === you || yk <= 0 ? 1 : 1 - 0.45 * yk);
    if (red) cross(x + 40, y - 92, 26, C.loss, 6); }
  if (yk > 0) { const x = 860 - (you % 5) * 160, y = 860 + 260; cv.save(); cv.globalAlpha *= yk; cv.strokeStyle = C.lilac; cv.lineWidth = 6; cv.beginPath(); cv.arc(x, y - 20, 112, 0, 7); cv.stroke(); cv.restore();
    tag(x, y + 120, 'تو؟', C.accent, { size: 40, alpha: yk, dir: 'rtl' }); }
  cv.restore();
}

// ---- 1 · they judge a strategy after 20 trades ----
const T20 = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1];
function judge(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['بعد', C.ink], ['از', C.ink], ['۲۰', C.lilac], ['معامله', C.ink]], 90]], t, S(1), S(2) + 0.1, { y: 420, hold: true, glow: rgba(C.accent, 0.6) });
  const fill = P(t, M.bist1 - 0.15, 1.0);
  for (let i = 0; i < 20; i++) { const x = 540 + 4.5 * 82 - (i % 10) * 82, y = 680 + Math.floor(i / 10) * 76; if (fill * 20 <= i) { rr(x - 33, y - 26, 66, 52, 12); cv.fillStyle = rgba(C.line, 0.6); cv.fill(); continue; }
    const p = E.back(clamp((fill * 20 - i) / 3)); cv.save(); cv.translate(x, y); cv.scale(p, p); rr(-33, -26, 66, 52, 12); cv.fillStyle = T20[i] ? rgba(C.gain, 0.85) : rgba(C.loss, 0.85); cv.fill(); cv.restore(); }
  const st = P(t, M.ghezavat - 0.12, 0.35); if (st > 0) { cv.save(); cv.translate(540, 1080); cv.rotate(-0.08); const s = lerp(1.8, 1, E.out(st)); cv.scale(s, s); cv.globalAlpha *= clamp(st * 3);
    rr(-300, -110, 600, 220, 36); cv.fillStyle = rgba(C.bg, 0.88); cv.fill(); cv.strokeStyle = C.loss; cv.lineWidth = 10; cv.stroke();
    txt('قضاوت!', 0, 6, { size: 130, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.7) }); cv.restore(); }
  cv.restore();
}

// ---- 2 · good? "this is it!"  bad? "next one." ----
function verdict(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const g = pop(t, M.khub); if (g > 0) { cv.save(); cv.translate(540, 760); cv.scale(g, g); cv.globalAlpha *= clamp(g); card(-420, -170, 840, 340, { r: 40, border: rgba(C.gain, 0.6) });
    txt('خوب بود؟', 380, -100, { size: 40, weight: 700, color: C.muted, align: 'right' });
    const hk = E.back(P(t, M.hamine - 0.12, 0.4)); if (hk > 0) { cv.save(); cv.translate(110, 20); cv.scale(hk, hk); txt('«همینه!»', 0, 0, { size: 104, font: 'Rdx', weight: 700, color: C.gain, glow: rgba(C.gain, 0.5) }); cv.restore(); }
    series({ x: -380, y: -40, w: 220, h: 150 }, curve([[0, 10], [0.4, 16], [0.7, 14], [1, 26]], 30, 3, 1.5), { upto: 2 + 28 * P(t, M.khub, 0.8), lo: 6, hi: 28, color: C.gain, lw: 5, glow: true }); cv.restore(); }
  const b = pop(t, M.bad); if (b > 0) { cv.save(); cv.translate(540, 1150); cv.scale(b, b); cv.globalAlpha *= clamp(b); card(-420, -170, 840, 340, { r: 40, border: rgba(C.loss, 0.6) });
    txt('بد بود؟', 380, -100, { size: 40, weight: 700, color: C.muted, align: 'right' });
    const nk = E.back(P(t, M.badi - 0.5, 0.4)); if (nk > 0) { cv.save(); cv.translate(140, 30); cv.scale(nk, nk); txt('«بریم سراغ بعدی»', 0, 0, { size: 62, font: 'Rdx', weight: 700, color: C.loss, glow: rgba(C.loss, 0.4) }); cv.restore(); }
    // strategies swiped away, one after another
    for (let j = 0; j < 3; j++) { const sw = E.in(P(t, M.badi - 0.4 + 0.35 * j, 0.35)); cv.save(); cv.translate(-280 - 520 * sw, 40 - j * 8); cv.rotate(-0.08 * j - 0.4 * sw); cv.globalAlpha *= 1 - sw;
      card(-110, -70, 220, 140, { r: 22, border: rgba(C.accent, 0.5), shadow: false }); txt('استراتژی ' + fa(3 - j), 0, 4, { size: 30, weight: 800, color: C.lilac }); cv.restore(); }
    cv.restore(); }
  cv.restore();
}

// ---- 3 · but nobody tells you this ----
function secret(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const k = E.back(P(t, S(3), 0.5)); cv.save(); cv.translate(540, 640); cv.scale(k, k); cv.globalAlpha *= clamp(k);
  glow(0, 0, 240, 240, C.accent, 0.35); rr(-70, -20, 140, 110, 24); cv.fillStyle = C.lilac; cv.fill(); cv.strokeStyle = C.lilac; cv.lineWidth = 18; cv.beginPath(); cv.arc(0, -20, 50, Math.PI, 0); cv.stroke();
  cv.fillStyle = C.bg; cv.beginPath(); cv.arc(0, 30, 16, 0, 7); cv.fill(); cv.restore();
  headline([['ولی اینو', 84, C.ink], [[['کسی', C.lilac], ['بهت', C.lilac], ['نمی‌گه:', C.lilac]], 112]], t, S(3), S(4) + 0.1, { y: 880, gap: 150, hold: true, glow: rgba(C.accent, 0.8) });
  cv.restore();
}

// ---- 4–6 · 30 traders, the same 50% strategy: 30%–70% after 20 trades, 45%–55% after 500 ----
function spread(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const c1 = pop(t, M.panjah), c2 = pop(t, M.bist4), late = P(t, M.hichi - 0.3, 0.3), five = P(t, M.pansad6 - 0.2, 0.3);
  if (late < 1) { [[650, 'وین‌ریت واقعی: ۵۰٪', C.gain, c1], [650, '۳۰ نفر · هر کدوم ۲۰ معامله', C.sky, c2]].forEach(([, s, col, k], i) => { if (k <= 0) return; cv.save(); cv.translate(540, 380 + i * 100); cv.scale(k, k); cv.globalAlpha *= clamp(k) * (1 - late);
    const w = measure(s, 40, 800) + 70; rr(-w / 2, -42, w, 84, 42); cv.fillStyle = rgba(col, 0.16); cv.fill(); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); txt(s, 0, 3, { size: 40, weight: 800, color: C.ink }); cv.restore(); }); }
  if (late > 0 && five < 1) headline([[[['۲۰', C.lilac], ['معامله', C.ink]], 80], [[['تقریباً', C.loss], ['هیچی', C.loss], ['نمی‌گه', C.loss]], 92]], t, M.hichi - 0.3, M.pansad6, { y: 400, gap: 116, hold: true, glow: rgba(C.loss, 0.5) });
  if (five > 0) headline([[[['با', C.ink], ['۵۰۰', C.gain], ['معامله:', C.ink]], 92]], t, M.pansad6 - 0.2, S(7) + 0.2, { y: 430, hold: true, glow: rgba(C.gain, 0.5) });
  const R = { x: 150, y: 640, w: 780, h: 600 }; card(100, 600, 880, 760, { r: 40 });
  const X = (v) => R.x + ((v - 20) / 60) * R.w, base = 1180;
  cv.save(); cv.strokeStyle = C.line; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(R.x, base + 30); cv.lineTo(R.x + R.w, base + 30); cv.stroke(); cv.restore();
  [30, 40, 50, 60, 70].forEach((v) => txt(fa(v) + '٪', X(v), base + 70, { size: 28, weight: 600, color: C.faint }));
  // the true win rate
  const tk = E.out(P(t, M.panjah - 0.1, 0.4)); if (tk > 0) { dashLine(X(50), R.y + 40, X(50), base + 30, rgba(C.gain, 0.8 * tk), 3); txt('وین‌ریت واقعی', X(50), R.y + 18, { size: 26, weight: 700, color: C.gain, alpha: tk }); }
  // the 45–55% band once 500 trades are in
  const bk = E.out(P(t, M.chehel - 0.2, 0.5)); if (bk > 0) { cv.save(); cv.globalAlpha *= bk; cv.fillStyle = rgba(C.gain, 0.14); cv.fillRect(X(45), R.y + 60, X(55) - X(45), base + 30 - R.y - 60); cv.strokeStyle = rgba(C.gain, 0.6); cv.lineWidth = 2; cv.strokeRect(X(45), R.y + 60, X(55) - X(45), base + 30 - R.y - 60); cv.restore();
    tag(X(50), R.y + 90, '۴۵٪ تا ۵۵٪', C.gain, { size: 32, alpha: bk, dir: 'rtl' }); }
  // the dots: each trader's win rate, stacked; they move from the 20-trade result to the 500-trade result
  const mk = E.inOut(P(t, M.pansad6 - 0.1, 1.4)), h20 = {}, h500 = {};
  W20.forEach((v20, i) => { const appear = E.back(P(t, M.bist4 - 0.1 + i * 0.05, 0.35)); if (appear <= 0) return;
    const v5 = Math.round(W500[i]); const n20 = (h20[v20] = (h20[v20] ?? -1) + 1), n5 = (h500[v5] = (h500[v5] ?? -1) + 1);
    const x = lerp(X(v20), X(v5), mk), y = lerp(base - n20 * 40, base - n5 * 24, mk) - (1 - clamp(appear)) * 60, rad = lerp(17, 10, mk);
    const edge = v20 === 30 ? E.out(P(t, M.si - 0.1, 0.3)) : v20 === 70 ? E.out(P(t, M.haftad - 0.1, 0.3)) : 0, col = edge > 0 && mk < 0.5 ? (v20 === 30 ? C.loss : C.gain) : C.lilac;
    cv.save(); cv.globalAlpha *= clamp(appear); cv.fillStyle = col; cv.shadowColor = col; cv.shadowBlur = edge > 0 ? 24 : 8; cv.beginPath(); cv.arc(x, y, rad, 0, 7); cv.fill(); cv.restore();
    if (edge > 0 && mk < 0.2) tag(x, y - 54, fa(v20) + '٪', v20 === 30 ? C.loss : C.gain, { size: 34, alpha: edge * (1 - mk * 5), dir: 'rtl' }); });
  // the 30–70% bracket
  const brk = E.out(P(t, M.hichi - 0.4, 0.5)) * (1 - E.out(P(t, M.pansad6 - 0.2, 0.4))); if (brk > 0) { cv.save(); cv.globalAlpha *= brk; cv.strokeStyle = C.loss; cv.lineWidth = 4; const y = R.y + 120;
    cv.beginPath(); cv.moveTo(X(30), y + 24); cv.lineTo(X(30), y); cv.lineTo(X(70), y); cv.lineTo(X(70), y + 24); cv.stroke(); cv.restore();
    tag(X(50), R.y + 120, 'از ۳۰٪ تا ۷۰٪', C.loss, { size: 32, alpha: brk, dir: 'rtl' }); }
  txt('شبیه‌سازی: ۳۰ نفر با یه استراتژی ۵۰٪', 540, 1320, { size: 26, weight: 500, color: C.faint, alpha: c2 > 0 ? 1 : 0 });
  cv.restore();
}

// ---- 7 · 500 trades on a real account: at least a year ----
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
function year(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['۵۰۰', C.lilac], ['معامله', C.ink], ['با', C.ink], ['حساب', C.amber], ['واقعی؟', C.amber]], 76]], t, S(7), S(8) + 0.1, { y: 400, hold: true, glow: rgba(C.amber, 0.4) });
  const k = E.inOut(P(t, M.pansad7, M.sal - M.pansad7)); card(120, 540, 840, 640, { r: 40 });
  MONTHS.forEach((m, i) => { const row = Math.floor(i / 4), col = i % 4, x = 830 - col * 196, y = 640 + row * 170, on = k * 12 > i, e = E.back(clamp((k * 12 - i) / 1.2));
    rr(x - 84, y - 60, 168, 120, 22); cv.fillStyle = on ? rgba(C.amber, 0.18 * clamp(e)) : rgba(C.raised, 0.8); cv.fill(); cv.strokeStyle = on ? rgba(C.amber, 0.7) : C.line; cv.lineWidth = 2; cv.stroke();
    txt(m, x, y - 14, { size: 30, weight: 700, color: on ? C.ink : C.faint }); if (on) check(x, y + 32, 30, C.amber); });
  txt('معاملات: ' + fa(Math.round(500 * k)), 540, 1240, { size: 46, weight: 800, color: C.ink, alpha: E.out(P(t, M.pansad7, 0.3)) });
  const sk = E.back(P(t, M.sal - 0.2, 0.45)); if (sk > 0) { cv.save(); cv.translate(540, 1370); cv.scale(sk, sk); txt('حداقل ۱ سال', 0, 0, { size: 96, font: 'Rdx', weight: 700, color: C.amber, glow: rgba(C.amber, 0.5) }); cv.restore();
    txt('با ۲ ستاپ در روز', 540, 1460, { size: 28, weight: 500, color: C.faint, alpha: clamp(sk) }); }
  cv.restore();
}

// ---- 8 · backtesting: much faster, no waiting for the market ----
const WALK = (() => { const r = rng(17), out = []; let p = 100; for (let i = 0; i < 400; i++) { const o = p, c = p + (r() - 0.48) * 3; out.push([o, Math.max(o, c) + r() * 1.5, Math.min(o, c) - r() * 1.5, c]); p = c; } return out; })();
function fast(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  headline([[[['با', C.ink], ['بک‌تست', C.lilac]], 100], [[['خیلی', C.gain], ['سریع‌تر', C.gain]], 84]], t, S(8), S(9) + 0.1, { y: 400, gap: 120, hold: true, glow: rgba(C.accent, 0.7) });
  const R = { x: 160, y: 640, w: 760, h: 420 }; card(110, 600, 860, 640, { r: 40 });
  const speed = lerp(1, 20, E.inOut(P(t, M.sari - 0.3, 1.0))), i0 = Math.floor(Math.max(0, (t - S(8)) * 6 + Math.max(0, t - M.sari) * speed * 1.5)) % 300;
  candles(R, WALK, i0, i0 + 60, { span: 60 });
  cv.save(); rr(230, 1110, 620, 90, 45); cv.fillStyle = rgba(C.raised, 0.95); cv.fill(); cv.strokeStyle = C.line; cv.lineWidth = 2; cv.stroke();
  cv.fillStyle = C.accent; cv.beginPath(); cv.arc(800, 1155, 32, 0, 7); cv.fill(); cv.fillStyle = '#fff'; for (const dx of [-8, 8]) { cv.beginPath(); cv.moveTo(790 + dx, 1140); cv.lineTo(806 + dx, 1155); cv.lineTo(790 + dx, 1170); cv.fill(); } cv.restore();
  txt('سرعت: ' + fa(Math.round(speed)) + ' کندل در ثانیه', 520, 1157, { size: 34, weight: 800, color: speed > 15 ? C.gain : C.ink });
  const mk = E.out(P(t, M.montazer - 0.2, 0.45)); if (mk > 0) { cv.save(); cv.globalAlpha *= mk; cv.translate(540, 1340);
    card(-390, -70, 780, 140, { r: 70, border: rgba(C.gain, 0.6) }); txt('منتظر بازار نمی‌مونی', 60, 3, { size: 46, weight: 800, color: C.ink });
    cv.translate(-300, 0); cv.strokeStyle = C.amber; cv.lineWidth = 6; cv.beginPath(); cv.moveTo(-22, -34); cv.lineTo(22, -34); cv.lineTo(-22, 34); cv.lineTo(22, 34); cv.closePath(); cv.stroke(); cross(0, 0, 70, C.loss, 7); cv.restore(); }
  cv.restore();
}

// ---- 9 · any day from the past, candle by candle, the stats come by themselves: the real app screens ----
function app(t, a) {
  if (a <= 0) return; cv.save(); cv.globalAlpha = a;
  const steps = [[M.ruzi, 'هر روزی از گذشته'], [M.candle, 'کندل به کندل'], [M.amar, 'آمار']], cur = steps.reduce((c, [t0], i) => (t >= t0 - 0.2 ? i : c), 0);
  let x = 960; steps.forEach(([t0, s], i) => { const on = i === cur, w = measure(s, 34, 800) + 56, e = pop(t, i === 0 ? S(9) : t0); x -= w / 2; if (e > 0) { cv.save(); cv.translate(x, 400); cv.scale(e, e); cv.globalAlpha *= clamp(e) * (on ? 1 : 0.7);
    rr(-w / 2, -42, w, 84, 42); cv.fillStyle = on ? rgba(C.accent, 0.9) : rgba(C.surface, 0.9); cv.fill(); cv.strokeStyle = on ? C.accent : C.line; cv.lineWidth = 2; cv.stroke(); txt(s, 0, 3, { size: 34, weight: 800, color: on ? '#fff' : C.muted }); cv.restore(); } x -= w / 2 + 16; });
  const k = E.out(P(t, S(9), 0.5)); cv.save(); cv.translate(0, (1 - k) * 200);
  const shots = [[IMG.replay, 0], [IMG.replay, 383], [IMG.analytics, 1780]], [img, sy] = shots[cur];
  const f = phone(540, 520, 640, img, 0, sy, 1170, { alpha: k, h: 880 });
  const ck = P(t, steps[cur][0] - 0.2, 0.25); if (cur > 0 && ck < 1) { cv.save(); cv.globalAlpha *= 1 - ck; rr(220, 520, 640, 880, 48); cv.fillStyle = C.bg; cv.fill(); cv.restore(); }
  if (cur === 0) tap(f.X(874), f.Y(383), P(t, M.ruzi + 0.3, 0.6));
  cv.restore();
  txt('تصویر واقعی برنامه · داده‌ی نمونه', 540, 1460, { size: 24, color: C.faint, weight: 500, alpha: k });
  cv.restore();
}

function render(t) {
  shake = Math.max(0, 1 - Math.abs(t - (M.ghezavat + 0.05)) / 0.35) * 12;
  background(t, { tense: 0.6 * win(t, 0, S(3), 0.01, 0.4) + 0.4 * win(t, S(7), S(8), 0.3, 0.3), happy: 0.6 * win(t, S(6), S(7), 0.3, 0.3) + 0.5 * win(t, S(8), S(10), 0.3, 0.3) });
  cv.save(); if (shake > 0) cv.translate(Math.sin(t * 90) * shake, Math.cos(t * 77) * shake);
  hook(t, 1 - E.in(P(t, S(1) - 0.3, 0.3)));
  judge(t, win(t, S(1) - 0.1, S(2) + 0.05, 0.3, 0.3));
  verdict(t, win(t, S(2) - 0.05, S(3) + 0.05, 0.3, 0.3));
  secret(t, win(t, S(3) - 0.05, S(4) + 0.05, 0.3, 0.3));
  spread(t, win(t, S(4) - 0.05, S(7) + 0.05, 0.3, 0.3));
  year(t, win(t, S(7) - 0.05, S(8) + 0.05, 0.3, 0.3));
  fast(t, win(t, S(8) - 0.05, S(9) + 0.05, 0.3, 0.3));
  app(t, win(t, S(9) - 0.05, S(10) + 0.05, 0.3, 0.3));
  linkScene(t, win(t, S(10) - 0.05, S(11) + 0.05, 0.3, 0.3), M.link, M.raygan, { linkText: 'لینک سایت توی بیوئه', freeTop: 'رایگان', freeBig: 'امتحانش کن', freeSize: 92 });
  followScene(t, E.out(P(t, S(11) - 0.05, 0.3)), S(11), Math.max(M.follow + 0.9, S(11) + 1.0), 'تا اشتباه بعدی رو هم با هم درست کنیم', { head: [[[['فالو', C.lilac], ['کن', C.ink]], 110]] });
  cv.restore();
  chrome(t, LABEL, { dot: C.lilac });
  subs(t, SUB_ON);
  cutFx(t, [1, 2, 3, 4, 7, 8, 9, 10, 11].map((k) => S(k) - 0.05));
  { const k = 1 - Math.abs(t - (M.ghezavat + 0.05)) / 0.3; if (k > 0) { cv.fillStyle = rgba(C.loss, 0.18 * k); cv.fillRect(0, 0, W, H); } }
  finish(t);
}
boot(render, [loadImg('replay', '../c3/img/03-replay.png'), loadImg('analytics', '../c3/img/full-05-analytics.png')]);
