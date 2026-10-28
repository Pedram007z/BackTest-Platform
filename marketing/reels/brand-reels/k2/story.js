// k2 · «مگه میشه با بک‌تست‌لب تمرین کنی و نتیجه نگیری؟», the kinetic look (u-kit), on the user's voice.
// The symbols: practice days filling toward a trophy with a question mark; the arrow from «تمرین» to «نتیجه» snapping
// on «آره، میشه»; the three wrong ways (a play button with buy and sell flying anywhere, a rule crossed out after each
// loss, numbers nobody looks at); the arrow mending for «تمرین درست»; a strategy card with its rules ticked; then the real
// platform (s1's gold replay with the future covered, f1's session costs, f1's analytics from its 10-trade test
// session, marked «نمونه»); feeling crossed out against numbers; «سود تضمینی» struck through; a curve showing when a
// strategy works and when it doesn't (drawn, not data); the bio link; the end card.
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, th, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, th.card); cv.restore(); rrect(x, y, w, h, r, null, th.rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
function stamp(s, x, y, size, col, k, rot = -0.14) { if (k <= 0) return; at(x, y, lerp(1.7, 1, cl(k)), cl(k * 2), () => { const w = measure(s, size) + size * 0.9; rrect(-w / 2, -size * 0.75, w, size * 1.5, size * 0.25, rgba(col, 0.1), col, Math.max(6, size * 0.07)); txt(s, 0, size * 0.04, size, col); }, rot); }
/** A crop (CSS px of the 1440×900 capture) of a real screen, drawn into the box [x, y, w] with rounded corners; returns its height. */
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; if (!im || a <= 0) return (w * r[3]) / r[2]; const s = im.width / 1440, h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 18); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
/** a gold ring round part of a crop: r is the crop's region, q the part (both CSS px), the crop drawn at [x, y, w] */
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = 22; rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 5); cv.restore(); }
function tag(s, x, y, col, ink, k) { if (k > 0) at(x, y, cl(k, 0, 1.15), cl(k), () => chip(s, 0, 0, 34, ink, col)); }
function trophy(x, y, s, col) { at(x, y, s, 1, () => { cv.fillStyle = col; cv.beginPath(); cv.moveTo(-70, -80); cv.lineTo(70, -80); cv.quadraticCurveTo(70, 30, 0, 45); cv.quadraticCurveTo(-70, 30, -70, -80); cv.fill();
  cv.strokeStyle = col; cv.lineWidth = 14; cv.beginPath(); cv.arc(-70, -40, 30, Math.PI * 0.5, Math.PI * 1.5); cv.stroke(); cv.beginPath(); cv.arc(70, -40, 30, -Math.PI * 0.5, Math.PI * 0.5); cv.stroke();
  rrect(-14, 40, 28, 40, 6, col); rrect(-55, 78, 110, 24, 8, col); }); }
/** the arrow from «تمرین» (right) to «نتیجه» (left): k draws it, brk snaps it in the middle, mend joins it green */
function practiceArrow(t, th, o) {
  const y = 0, from = o.from ?? 'تمرین', x1 = 320 - (measure(from, 46, 800) + 50.6) / 2 + 20, x0 = -230, k = cub(k01(t, o.at, 0.5));
  const col = o.mend ? mixC(R, G, cub(k01(t, o.mend, 0.4))) : th.ink;
  at(320, y, 1, 1, () => chip(from, 0, 0, 46, th === THEME.lime ? LIME : WHITE, th === THEME.lime ? INKD : VIO));
  at(-320, y, 1, 1, () => chip('نتیجه', 0, 0, 46, th === THEME.lime ? INKD : th.ink, th === THEME.lime ? WHITE : th.card, { stroke: th.rule }));
  const xe = lerp(x1 - 40, x0 + 60, k), gap = o.brk ? 60 * cub(k01(t, o.brk, 0.25)) : 0, drop = o.brk ? 40 * cub(k01(t, o.brk, 0.4)) : 0;
  if (gap > 0) { line(x1 - 40, y, 10 + gap / 2, y + drop * 0.3, col, 12); line(-10 - gap / 2, y + drop, xe, y + drop * 1.6, col, 12); cross(0, y - 90, 42, R, pop(t - o.brk, 14, 0.5)); }
  else { line(x1 - 40, y, xe, y, col, 12); if (k > 0.98) { cv.fillStyle = col; cv.beginPath(); cv.moveTo(x0 + 30, y); cv.lineTo(x0 + 70, y - 26); cv.lineTo(x0 + 70, y + 26); cv.fill(); } }
  if (o.mend) check(0, y - 90, 42, G, pop(t - o.mend - 0.15, 14, 0.5));
}

// ---- the hook: practice days toward a trophy with a question mark ----
function hookArt(t, th) {
  card(-420, -330, 840, 620, th); txt('روزهای تمرین', 0, -270, 36, th.cardMut, { w: 700 });
  for (let i = 0; i < 7; i++) { const x = 270 - i * 90, k = pop(t - 0.25 - i * 0.22, 15, 0.55); rrect(x - 36, -200, 72, 72, 16, th.soft); if (k > 0) at(x, -164, cl(k, 0, 1.2), cl(k), () => { rrect(-36, -36, 72, 72, 16, VIO); check(0, 0, 22, G, 1); }); }
  const ka = cub(k01(t, 1.9, 0.4)); if (ka > 0) line(0, -100, 0, -100 + 70 * ka, th.cardMut, 8, [14, 12]);
  const kt = pop(t - 2.1, 12, 0.55); if (kt > 0) at(0, 90, cl(kt, 0, 1.2), cl(kt), () => trophy(0, 0, 1, '#E8C25A'));
  const kq = pop(t - ws(8) + 0.05, 13, 0.5); if (kq > 0) at(120, -10, cl(kq, 0, 1.25), cl(kq), () => { circle(0, 0, 52, R); txt('؟', 0, 4, 70, WHITE); }, 0.12 * Math.sin(t * 6));
}
// ---- «راستش… آره، میشه.»: the arrow snaps ----
function twistArt(t, th) { practiceArrow(t, th, { at: T.twist - 0.1, brk: ws(11) }); }
// ---- wrong way 1: play, then buy and sell anywhere ----
function aimlessArt(t, th) {
  tag('اشتباه ۱', 330, -320, R, WHITE, pop(t - T.aimless, 14, 0.55));
  const kp = pop(t - T.aimless - 0.1, 12, 0.55), press = t > ws(15) && t < ws(15) + 0.15 ? 0.9 : 1;
  if (kp > 0) at(0, -80, cl(kp, 0, 1.2) * press, cl(kp), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 50; circle(0, 0, 120, VIO); cv.shadowColor = 'transparent'; cv.fillStyle = WHITE; cv.beginPath(); cv.moveTo(-36, -56); cv.lineTo(62, 0); cv.lineTo(-36, 56); cv.closePath(); cv.fill(); });
  for (let j = 0; j < 14; j++) { const t0 = ws(19) + j * ((ws(23) - ws(19) + 0.4) / 14), k = pop(t - t0, 14, 0.5); if (k <= 0) continue;
    const buy = rnd(j * 3.3) > 0.5, x = (rnd(j * 7.1) - 0.5) * 760, y = -260 + rnd(j * 5.7) * 560, rot = (rnd(j * 2.9) - 0.5) * 0.8;
    at(x, y, cl(k, 0, 1.15) * 0.9, cl(k) * (1 - 0.5 * cl((t - t0 - 0.6) / 0.6)), () => chip(buy ? 'خرید' : 'فروش', 0, 0, 34, WHITE, buy ? G : R), rot); }
  stamp('بی‌هدف', 0, 280, 90, R, pop(t - ws(19) - 0.1, 14, 0.5));
}
// ---- wrong way 2: a new rule after every loss ----
function rulesArt(t, th) {
  tag('اشتباه ۲', 330, -320, R, WHITE, pop(t - T.rules, 14, 0.55));
  const kc = pop(t - T.rules - 0.05, 12, 0.6); if (kc <= 0) return;
  at(0, 20, lerp(0.9, 1, cl(kc)), cl(kc), () => {
    card(-400, -230, 800, 470, th); txt('قانون ورود من', 300, -170, 38, th.cardMut, { align: 'right', w: 700 });
    const rules = [['ورود روی شکست سقف', ws(29)], ['ورود روی پولبک', ws(33)], ['ورود با… هر چی شد!', 1e9]];
    rules.forEach(([s, tx], i) => {
      const y = -80 + i * 100, k = i === 0 ? 1 : cub(k01(t, rules[i - 1][1] + 0.1, 0.3)); if (k <= 0) return;
      txt(s, 330, y, 44, i === 2 ? R : th.cardInk, { align: 'right', alpha: k });
      const ks = cub(k01(t, tx, 0.3)); if (ks > 0) { const w = measure(s, 44); line(330, y + 4, 330 - w * ks, y + 4, R, 8); }
    });
    [ws(28), ws(32)].forEach((tl, j) => { const k = pop(t - tl, 14, 0.5); if (k > 0) at(-300, -80 + j * 100, cl(k, 0, 1.2), cl(k), () => chip('ضرر', 0, 0, 30, WHITE, R)); });
  });
}
// ---- wrong way 3: numbers nobody looks at ----
function numbersArt(t, th) {
  tag('اشتباه ۳', 330, -320, R, WHITE, pop(t - T.numbers, 14, 0.55));
  const kc = pop(t - T.numbers - 0.05, 12, 0.6); if (kc <= 0) return;
  at(0, 20, lerp(0.9, 1, cl(kc)), cl(kc), () => {
    card(-400, -240, 800, 480, th);
    ['وین‌ریت', 'ریسک به ریوارد', 'بیشترین ضرر پیاپی'].forEach((s, i) => { const y = -140 + i * 120; txt(s, 340, y, 42, th.cardInk, { align: 'right' }); txt('؟؟', -300, y, 56, th.cardMut, { blur: 9 }); line(-360, y + 52, 340, y + 52, th.rule, 2); });
    // an eye shut
    at(-250, -220, 1, cub(k01(t, ws(40), 0.3)), () => { circle(0, 0, 70, VIO, WHITE, 6); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 8; cv.lineCap = 'round'; cv.beginPath(); cv.arc(0, -10, 40, 0.2, Math.PI - 0.2); cv.stroke(); for (let j = -1; j <= 1; j++) line(j * 22, 28, j * 30, 46, WHITE, 6); cv.restore(); });
  });
}
// ---- «ولی اگه درست تمرین کنی»: the arrow mends ----
function turnArt(t, th) { practiceArrow(t, th, { at: T.turn - 0.1, mend: ws(47), from: 'تمرین درست' }); }
// ---- a strategy with clear rules ----
function strategyArt(t, th) {
  const kc = pop(t - T.strategy - 0.05, 12, 0.6); if (kc <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(kc)), cl(kc), () => {
    card(-400, -270, 800, 540, th); txt('استراتژی من', 0, -205, 44, th.cardInk);
    [['شرط ورود', ws(52)], ['حد ضرر', ws(53)], ['حد سود', ws(54)]].forEach(([s, t0], i) => { const y = -90 + i * 115;
      rrect(-340, y - 46, 680, 92, 22, th.soft); txt(s, 280, y, 44, th.cardInk, { align: 'right' }); rrect(-260, y - 10, 300, 20, 10, th.rule); check(-300, y, 32, G, pop(t - t0, 14, 0.5)); });
    const kk = pop(t - ws(54), 13, 0.55); if (kk > 0) at(0, 240, cl(kk, 0, 1.2), cl(kk), () => chip('قانون مشخص', 0, 0, 36, INKD, LIME));
  });
}
// ---- the replay, the future covered (s1's gold replay) ----
function replayArt(t, th) {
  // s1's real gold replay up to its last candle, then the future: a covered panel nobody can see into
  const k = cub(k01(t, T.replay - 0.1, 0.4)), n = 37, j = Math.min(n - 1, Math.max(0, Math.floor(cl((t - T.replay) / (T.costs - 0.4 - T.replay)) * n)));
  const r = [500, 225, 555, 545], w = 600, fw = 260, x = -430, y = -310, h = (w * r[3]) / r[2], xl = x + w + 8, fwi = fw - 8;
  cv.save(); cv.globalAlpha *= k; cv.shadowColor = 'rgba(0,0,0,0.35)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 14, y - 14, w + fw + 28, h + 28, 30, '#15121F'); cv.restore();
  cv.save(); cv.globalAlpha *= k; crop('f' + String(j).padStart(2, '0'), r, x, y, w); rrect(xl, y, fwi, h, 18, '#0E0B17');
  const kf = cub(k01(t, ws(64) - 0.1, 0.4));
  if (kf > 0) { cv.save(); cv.globalAlpha *= kf; cv.beginPath(); cv.roundRect(xl, y, fwi, h, 18); cv.clip(); for (let q = -30; q < 20; q++) line(xl + q * 26, y + h, xl + q * 26 + 200, y, rgba(LIME, 0.22), 3); cv.restore();
    line(xl - 4, y, xl - 4, y + h, LIME, 4, [12, 9]);
    at(xl + fwi / 2, y + h / 2 - 30, lerp(1.4, 1, kf), kf, () => { circle(0, 0, 64, LIME); txt('؟', 0, 6, 84, INKD); });
    at(xl + fwi / 2, y + h / 2 + 80, 1, kf, () => chip('آینده', 0, 0, 34, INKD, LIME)); }
  cv.restore();
  txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', 0, y + h + 60, 30, th.mut, { w: 700, alpha: k });
}
// ---- real costs (f1's session setup) ----
function costsArt(t, th) {
  const k = pop(t - T.costs - 0.05, 12, 0.6); if (k <= 0) return; const r = [520, 305, 470, 115], w = 920, x = -460, h = (w * r[3]) / r[2], y = -h / 2 - 20;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 16, y - 16, w + 32, h + 32, 30, '#15121F'); cv.restore();
    crop('c-session', r, x, y, w);
    ringIn(r, [790, 370, 104, 40], x, y, w, cub(k01(t, ws(74) - 0.05, 0.3)));
    ringIn(r, [572, 370, 102, 40], x, y, w, cub(k01(t, ws(76) - 0.05, 0.3)));
    txt('صفحه‌ی واقعی بک‌تست‌لب · ساخت جلسه', 0, y + h + 70, 30, th.mut, { w: 700 });
  });
}
// ---- the checklist, then the journal ----
function journalArt(t, th) {
  const k = pop(t - T.journal - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, -150, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-400, -180, 800, 360, th); txt('چک‌لیست ورود', 300, -125, 38, th.cardMut, { align: 'right', w: 700 });
    ['هم‌جهت با روند', 'حد ضرر مشخصه', 'ریسک طبق قانونه'].forEach((s, i) => { const y = -45 + i * 80; rrect(255, y - 26, 52, 52, 12, null, th.rule, 4); txt(s, 220, y, 40, th.cardInk, { align: 'right' }); check(281, y, 30, G, pop(t - ws(84) - i * 0.18, 15, 0.5)); });
  });
  const kj = pop(t - ws(87), 12, 0.6); if (kj > 0) at(0, 260, lerp(0.9, 1, cl(kj)), cl(kj), () => {
    card(-400, -150, 800, 300, th, 30); txt('ژورنال', 300, -95, 38, th.cardMut, { align: 'right', w: 700 });
    const L1 = 'چرا وارد شدم؟ پولبک به سطح،', L2 = 'طبق قانون استراتژیم.', N = L1.length + L2.length;
    const n = Math.floor(cl((t - ws(89)) / Math.max(0.4, we(92) - ws(89))) * N), a1 = L1.slice(0, n), a2 = n > L1.length ? L2.slice(0, n - L1.length) : '';
    if (a1) txt(a1, 330, -10, 40, th.cardInk, { align: 'right' }); if (a2) txt(a2, 330, 60, 40, th.cardInk, { align: 'right' });
    if (n < N && Math.floor(t * 3) % 2 === 0) { const onL2 = n > L1.length; rrect(330 - measure(onL2 ? a2 : a1, 40) - 14, (onL2 ? 60 : -10) - 24, 5, 48, 2, VIO); }
  });
}
// ---- the analytics (f1's 10-trade test session) ----
function analyticsArt(t, th) {
  const a0 = T.analytics, kt = 1 - cub(k01(t, ws(100) - 0.3, 0.3));
  if (kt > 0) for (let i = 0; i < 40; i++) { const k = pop(t - a0 - 0.1 - i * 0.045, 16, 0.55); if (k <= 0) continue; const win = rnd(i * 4.1) > 0.55, x = 360 - (i % 10) * 80, y = -230 + Math.floor(i / 10) * 120;
    at(x, y, cl(k, 0, 1.2), cl(k) * kt, () => { rrect(-30, -40, 60, 80, 12, win ? G : R); txt(win ? '+' : '−', 0, 2, 46, WHITE, { dir: 'ltr' }); }); }
  if (kt > 0) txt('معامله پشت معامله…', 0, 300, 40, th.mut, { alpha: kt * cub(k01(t, a0 + 0.6, 0.4)) });
  // the three real numbers, one at a time (f1's analytics page)
  const shots = [['h-analytics', [670, 345, 135, 63], [680, 350, 115, 52], ws(100), 440, LIME], ['h-analytics', [795, 742, 357, 140], [990, 760, 150, 54], ws(103), 760, LIME],
    ['h-analytics-2', [40, 345, 550, 95], [48, 378, 532, 28], ws(108), 920, R]];
  shots.forEach(([key, r, q, t0, w, col], i) => {
    const nx = shots[i + 1], kin = pop(t - t0 + 0.05, 12, 0.6), kout = nx ? cub(k01(t, nx[3] - 0.15, 0.2)) : 0; if (kin <= 0 || kout >= 1) return;
    const h = (w * r[3]) / r[2], x = -w / 2, y = -h / 2 - 30;
    at(0, 0, lerp(0.85, 1, cl(kin)) * (1 - 0.08 * kout), cl(kin) * (1 - kout), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 14, y - 14, w + 28, h + 28, 26, '#15121F'); cv.restore();
      crop(key, r, x, y, w); ringIn(r, q, x, y, w, cub(k01(t, t0 + 0.15, 0.3)), col); });
    // the streak row is small on the page: its number, read out large under it
    if (i === 2) { const kz = pop(t - t0 - 0.45, 13, 0.6); if (kz > 0) at(0, y + h + 110, cl(kz, 0, 1.15), cl(kz) * (1 - kout), () => { rrect(-330, -75, 660, 150, 34, '#1D1730', rgba(R, 0.6), 3);
      txt('بیشترین باخت‌های پیاپی', 70, 2, 44, WHITE, { w: 800 }); txt('۳', -230, 6, 100, R); }); }
  });
  const kn = cub(k01(t, ws(100) + 0.4, 0.4)); if (kn > 0) txt('صفحه‌ی واقعی آنالیز · نمونه: ۱۰ معامله‌ی یک جلسه‌ی آزمایشی', 0, 400, 28, th.mut, { w: 700, alpha: kn });
}
// ---- feeling against numbers ----
function feelArt(t, th) {
  const k1 = pop(t - T.feel - 0.05, 12, 0.6), k2 = pop(t - ws(122) + 0.05, 12, 0.6);
  if (k1 > 0) at(215, 0, lerp(0.88, 1, cl(k1)), cl(k1) * (k2 > 0 ? 0.65 : 1), () => { card(-190, -230, 380, 460, th, 32);
    cv.fillStyle = R; cv.beginPath(); cv.moveTo(0, 30); cv.bezierCurveTo(-110, -40, -60, -150, 0, -90); cv.bezierCurveTo(60, -150, 110, -40, 0, 30); cv.fill(); txt('؟', 0, -70, 60, WHITE);
    txt('حس', 0, 130, 60, th.cardInk); cross(120, -170, 40, R, pop(t - ws(120), 14, 0.5)); });
  if (k2 > 0) at(-215, 0, lerp(0.88, 1, cl(k2)), cl(k2), () => { card(-190, -230, 380, 460, th, 32);
    [[-90, 50], [-30, 90], [30, 70], [90, 120]].forEach(([x, hh], i) => rrect(x - 22, -10 - hh, 44, hh, 8, i === 3 ? G : VIO));
    line(-120, -10, 120, -10, th.rule, 4); txt('عدد', 0, 130, 60, th.cardInk); check(-120, -170, 40, G, pop(t - ws(123), 14, 0.5)); });
}
// ---- the truth: no guaranteed profit; knowing when it works ----
function truthArt(t, th) {
  const kg = 1 - cub(k01(t, ws(133) - 0.2, 0.3));
  if (kg > 0) { const k = pop(t - ws(130) + 0.05, 13, 0.55); if (k > 0) at(0, -40, cl(k, 0, 1.2), cl(k) * kg, () => { rrect(-330, -90, 660, 180, 40, WHITE); txt('سود تضمینی', 0, 4, 84, INKD);
      const ks = cub(k01(t, ws(132), 0.25)); if (ks > 0) line(-300, 4, -300 + 600 * ks, 4, R, 16); }); }
  const kc = pop(t - ws(133) - 0.05, 12, 0.6); if (kc <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(kc)), cl(kc), () => {
    card(-420, -260, 840, 520, th); txt('مثال', 360, -215, 28, th.cardMut, { align: 'right', w: 700 });
    // a drawn curve (an example, not data), left to right: rising while its market suits it, then choppy and falling
    const pts = []; for (let i = 0; i <= 60; i++) { const x = -370 + i * 12.3, base = i <= 30 ? -i * 4.8 : -144 + (i - 30) * 3.9; pts.push([x, 80 + base + Math.sin(i * 1.7) * (i > 30 ? 16 : 9)]); }
    const kw = pop(t - ws(138), 13, 0.55), kn = pop(t - ws(142), 13, 0.55);
    if (kw > 0) { cv.save(); cv.globalAlpha *= cl(kw) * 0.2; rrect(-385, -215, 380, 345, 20, G); cv.restore(); at(-195, 190, cl(kw, 0, 1.2), cl(kw), () => chip('جواب میده', 0, 0, 34, WHITE, G)); }
    if (kn > 0) { cv.save(); cv.globalAlpha *= cl(kn) * 0.2; rrect(5, -215, 380, 345, 20, R); cv.restore(); at(195, 190, cl(kn, 0, 1.2), cl(kn), () => chip('جواب نمیده', 0, 0, 34, WHITE, R)); }
    const kd = cub(k01(t, ws(134), ws(137) - ws(134) + 0.3)); trace(pts, kd, WHITE, 8);
  });
}
// ---- the bio link ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-420, -300, 840, 600, 40, WHITE); cv.restore();
    if (IMG.icon) cv.drawImage(IMG.icon, 210, -250, 150, 150);
    txt('backtestlab_ir', 160, -200, 44, INKD, { align: 'right', dir: 'ltr' }); txt('بک‌تست با داده‌ی واقعی بازار', 160, -140, 32, MP, { align: 'right', w: 700 });
    [['پست‌ها', 70], ['دنبال‌کننده', -110], ['دنبال‌شده', -290]].forEach(([s, x]) => { rrect(x - 60, -70, 120, 26, 13, '#ECE7FA'); txt(s, x, -20, 26, MP, { w: 700 }); });
    rrect(-380, 30, 760, 2, 1, '#ECE7FA');
    txt('تمرین درست، با عدد', 360, 90, 34, INKD, { align: 'right', w: 700 });
    const kl = cub(k01(t, ws(153) - 0.1, 0.3)); rrect(-60 - 300, 140, 720, 76, 38, mixC('#ECE7FA', LIME, kl)); txt('backtestlab.ir', 0, 179, 40, kl > 0.5 ? INKD : VIO, { dir: 'ltr' });
    const kf = pop(t - ws(149), 13, 0.55); if (kf > 0) at(0, 380, cl(kf, 0, 1.2), cl(kf), () => chip('شروع رایگان', 0, 0, 40, LIME, INKD));
    const kc = t - ws(153) + 0.35; if (kc > 0) { const p = cl(kc / 0.35), y = lerp(470, 205, cub(p)), press = kc > 0.35 && kc < 0.5 ? 0.92 : 1; cursor(140, y, 0.8 * press);
      if (kc > 0.35) { const d = kc - 0.35; if (d < 0.5) circle(150, 182, 20 + 50 * d, null, rgba(VIO, 1 - d * 2), 5); } }
  });
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1250, 1.05], groups: [
      { at: 0, lines: [L_(300, 96, WHITE, [['مگه', 0], ['میشه', 1], ['با', 2]]), L_(440, 124, LIME, [['بک‌تست‌لب', 3]]), L_(590, 96, WHITE, [['تمرین', 4], ['کنی', 5]]), L_(730, 104, WHITE, [['و', 6], ['نتیجه', 7, { hl: LIME, ht: INKD }], ['نگیری؟', 8]])] }] },
    { k: 'twist', bg: PAPER, wipe: 'right', art: 'twist', kpos: [CX, 1150, 1.05], groups: [
      { at: 9, lines: [L_(360, 84, MP, [['راستش…', 9]]), L_(560, 170, INKP, [['آره،', 10], ['میشه.', 11, { hl: R, ht: WHITE }]])] }] },
    { k: 'aimless', bg: INKD, wipe: 'up', art: 'aimless', kpos: [CX, 1220, 1.05], groups: [
      { at: 12, lines: [L_(320, 92, WHITE, [['اگه', 12], ['فقط', 13], ['دکمه‌ی', 14], ['پخش', 15, { c: LIME }], ['رو', 16], ['بزنی', 17]]), L_(470, 92, WHITE, [['و', 18], ['بی‌هدف', 19, { hl: R, ht: WHITE }], ['خرید', 20, { c: G }], ['و', 21], ['فروش', 22, { c: R }], ['کنی،', 23]])] }] },
    { k: 'rules', bg: PAPER, wipe: 'left', art: 'rules', kpos: [CX, 1200, 1.1], groups: [
      { at: 24, lines: [L_(320, 96, INKP, [['اگه', 24], ['هر', 25], ['بار', 26], ['که', 27], ['ضرر', 28, { c: R }], ['کردی،', 29]]), L_(470, 104, INKP, [['قانونت', 30, { hl: VIO, ht: WHITE }], ['رو', 31], ['عوض', 32], ['کنی', 33]])] }] },
    { k: 'numbers', bg: VIO, wipe: 'iris', art: 'numbers', kpos: [CX, 1200, 1.1], groups: [
      { at: 34, lines: [L_(320, 100, WHITE, [['و', 34], ['اگه', 35], ['هیچ‌وقت', [36, 37]]]), L_(470, 104, WHITE, [['به', 38], ['عددهات', 39, { hl: LIME, ht: INKD }], ['نگاه', 40], ['نکنی.', 41]])] }] },
    { k: 'turn', bg: LIME, wipe: 'right', art: 'turn', kpos: [CX, 1150, 1.05], groups: [
      { at: 42, lines: [L_(340, 104, INKD, [['ولی', 42], ['اگه', 43], ['درست', 44, { hl: INKD, ht: LIME }], ['تمرین', 45], ['کنی،', 46]]), L_(500, 112, INKD, [['داستان', 47], ['فرق', 48], ['می‌کنه.', 49]])] }] },
    { k: 'strategy', bg: INKD, wipe: 'down', art: 'strategy', kpos: [CX, 1180, 1.1], groups: [
      { at: 50, lines: [L_(320, 100, WHITE, [['یه', 50], ['استراتژی', 51, { c: LIME }]]), L_(470, 96, WHITE, [['با', 52], ['قانون', 53], ['مشخص', 54, { hl: LIME, ht: INKD }], ['انتخاب', 55], ['کن.', 56]])] }] },
    { k: 'replay', bg: PAPER, wipe: 'up', art: 'replay', kpos: [CX, 1190, 1.1], groups: [
      { at: 57, lines: [L_(300, 92, INKP, [['بازار', 57], ['واقعی', 58, { c: VIO }], ['رو', 59], ['از', 60], ['گذشته', 61], ['پخش', 62], ['کن،', 63]]), L_(440, 100, INKP, [['بدون', 64], ['اینکه', [65, 66]], ['آینده', 67, { hl: VIO, ht: WHITE }], ['رو', 68], ['ببینی.', 69]])] }] },
    { k: 'costs', bg: VIO, wipe: 'left', art: 'costs', kpos: [CX, 1150, 1.05], groups: [
      { at: 70, lines: [L_(300, 92, WHITE, [['هر', 70], ['معامله', 71], ['رو', 72], ['با', 73]]), L_(440, 104, LIME, [['اسپرد', 74], ['و', 75], ['کمیسیون', 76]]), L_(590, 96, WHITE, [['واقعی', 77, { hl: LIME, ht: INKD }], ['ثبت', 78], ['کن.', 79]])] }] },
    { k: 'journal', bg: PAPER, wipe: 'iris', art: 'journal', kpos: [CX, 1180, 1.05], groups: [
      { at: 80, lines: [L_(300, 92, INKP, [['قبل', 80], ['از', 81], ['ورود،', 82]]), L_(440, 104, INKP, [['چک‌لیستتو', 83, { c: VIO }], ['تیک', 84, { hl: G, ht: WHITE }], ['بزن', 85]])] },
      { at: 86, lines: [L_(300, 92, INKP, [['و', 86], ['توی', 87], ['ژورنال', 88, { c: VIO }], ['بنویس', 89]]), L_(440, 104, INKP, [['چرا', 90, { hl: VIO, ht: WHITE }], ['وارد', 91], ['شدی.', 92]])] }] },
    { k: 'analytics', bg: INKD, wipe: 'right', art: 'analytics', kpos: [CX, 1120, 1.05], groups: [
      { at: 93, lines: [L_(300, 92, WHITE, [['بعد', 93], ['از', 94], ['کلی', 95], ['معامله،', 96]]), L_(440, 100, WHITE, [['آنالیز', 97, { c: LIME }], ['بهت', 98], ['میگه', 99]])] },
      { at: 100, lines: [L_(300, 100, WHITE, [['وین‌ریتت', [100, 101], { hl: LIME, ht: INKD }], ['چنده،', 102]])] },
      { at: 103, lines: [L_(300, 100, WHITE, [['ریسک', 103], ['به', 104], ['ریواردت', 105, { hl: LIME, ht: INKD }], ['چقدره', 106]])] },
      { at: 107, lines: [L_(300, 92, WHITE, [['و', 107], ['بدترین', 108], ['ضررهای', 109, { c: R }]]), L_(440, 92, WHITE, [['پشت', 110], ['سر', 111], ['همت', 111], ['چندتاست.', [112, 113], { hl: R, ht: WHITE }]])] }] },
    { k: 'feel', bg: PAPER, wipe: 'up', art: 'feel', kpos: [CX, 1170, 1.1], groups: [
      { at: 114, lines: [L_(320, 96, INKP, [['اون‌وقت', [114, 115]], ['دیگه', 116], ['با', 117], ['حس', 118, { c: R }]]), L_(470, 104, INKP, [['ترید', 119], ['نمی‌کنی؛', [120, 121]]])] },
      { at: 122, lines: [L_(320, 104, INKP, [['با', 122], ['عدد', 123, { hl: G, ht: WHITE }]]), L_(470, 104, INKP, [['ترید', 124], ['می‌کنی.', [125, 126]]])] }] },
    { k: 'truth', bg: VIO, wipe: 'iris', art: 'truth', kpos: [CX, 1180, 1.1], groups: [
      { at: 127, lines: [L_(320, 96, WHITE, [['نتیجه‌ی', 127], ['تمرین', 128], ['درست،', 129, { c: LIME }]]), L_(470, 100, WHITE, [['سود', 130], ['تضمینی', 131], ['نیست؛', 132, { hl: R, ht: WHITE }]])] },
      { at: 133, lines: [L_(300, 88, WHITE, [['اینه', 133], ['که', 134], ['بدونی', 135], ['استراتژیت', 136]]), L_(440, 104, WHITE, [['کِی', 137], ['جواب', 138, { c: LIME }], ['میده', [139, 140]]]), L_(580, 104, WHITE, [['و', 141], ['کِی', 142], ['نه.', 143, { hl: R, ht: WHITE }]])] }] },
    { k: 'cta', bg: LIME, wipe: 'right', art: 'cta', kpos: [CX, 1190, 1.05], groups: [
      { at: 144, lines: [L_(320, 104, INKD, [['از', 144], ['امروز', 145]]), L_(470, 112, INKD, [['درست', 146, { hl: INKD, ht: LIME }], ['تمرین', 147], ['کن.', 148]])] },
      { at: 149, lines: [L_(300, 100, INKD, [['شروع', 149], ['رایگان', 150, { hl: INKD, ht: LIME }]]), L_(440, 100, INKD, [['بک‌تست‌لب،', [151, 152]], ['لینکش', 153]]), L_(580, 100, INKD, [['توی', 154], ['بیوئه.', 155, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, twist: twistArt, aimless: aimlessArt, rules: rulesArt, numbers: numbersArt, turn: turnArt, strategy: strategyArt, replay: replayArt, costs: costsArt,
    journal: journalArt, analytics: analyticsArt, feel: feelArt, truth: truthArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(10), 12], [ws(132), 8]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('مگه میشه با', CX, 360, 110, WHITE); txt('بک‌تست‌لب', CX, 540, 160, LIME); txt('تمرین کنی و', CX, 720, 110, WHITE);
    const s = 'نتیجه نگیری؟', size = 130, w = measure(s, size); cv.save(); cv.translate(CX, 900); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, LIME); cv.restore(); txt(s, CX, 900, size, INKD);
    at(CX, 1450, 0.75, 1, () => hookArt(ws(8) + 0.6, THEME.ink));
  },
});
