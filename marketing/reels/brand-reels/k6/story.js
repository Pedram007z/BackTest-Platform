// k6 · «نظرت چیه باهم یه خودکشی کنیم؟», the kinetic look (u-kit), on the user's second take of k5's script.
// The drawn parts:
//   - an account's equity line that crashes on «خودکشی» (no numbers);
//   - the plan card with «بک‌تست» crossed out;
//   - a stopwatch and the capital bar draining from ۱۰۰٪ to ۰٪;
//   - the «؟» that turns into a light bulb on «راه‌حل»;
//   - three strategy cards, dealt and then shuffled face-down on «نمی‌دونی کدومش».
// From «بک‌تست‌لب» on, every screen is the real platform in its light theme, from k5's captures (../k5/screens):
//   the dashboard; the strategy's rules and the checklist; the three gold sessions at their end; the analytics with its
//   strategy filter, then filtered to the winner; the strategy cards with their real results (results.json, the same
//   numbers k5 shows).
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
/** A crop (CSS px of the 1440×900 capture) of a real screen, drawn into the box [x, y, w] with rounded corners; returns its height. */
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
/** a real screen on a white plate with a shadow */
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.32)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, WHITE); cv.restore(); cv.save(); cv.globalAlpha *= a; rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(26,20,48,0.1)', 2); cv.restore(); crop(key, r, x, y, w, a); return h; }
function ringIn(r, q, x, y, w, k, col = LIME, round = false) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  const X = x + (q[0] - r[0]) * s - m, Y = y + (q[1] - r[1]) * s - m, W2 = q[2] * s + 2 * m, H2 = q[3] * s + 2 * m;
  if (round) circle(X + W2 / 2, Y + H2 / 2, Math.max(W2, H2) / 2, null, col, 6); else rrect(X, Y, W2, H2, 14, null, col, 6); cv.restore(); }
const inCrop = (r, x, y, w, px, py) => [x + (px - r[0]) * (w / r[2]), y + (py - r[1]) * (w / r[2])];
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };

// the three strategies, by name, with their real results (k5's capture: 10 trades each, XAUUSD 1h)
const RES = (D.res && D.res.cards) || [], byName = (n) => RES.find((c) => c.name === n);
const STRATS = [
  { name: 'خرید در باز شدن لندن', side: 'خرید', where: 'لندن', col: G },
  { name: 'فروش در باز شدن لندن', side: 'فروش', where: 'لندن', col: R },
  { name: 'خرید در باز شدن نیویورک', side: 'خرید', where: 'نیویورک', col: G },
];
const BEST = (D.res && D.res.best) || STRATS[1].name, WINC = byName(BEST);
const usd = (n) => `${n >= 0 ? 'سود' : 'ضرر'} ${fa(Math.abs(Math.round(n)))} دلار`;
const pct = (s) => (s || '').replace('٫۰٪', '٪');

// ---- the hook: an account's equity line that crashes ----
const EQ = Array.from({ length: 60 }, (_, i) => { const x = -360 + (i * 720) / 59;
  if (i <= 38) return [x, 40 - i * 3 + 22 * Math.sin(i * 0.9) + (rnd(i) - 0.5) * 18];
  const f = (i - 38) / 21; return [x, -74 + 330 * Math.pow(f, 1.25) + (rnd(i * 3) - 0.5) * 26 * (1 - f)]; });
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-430, -300, 860, 600, PLATE, 'rgba(255,255,255,0.08)');
    txt('حساب ما', 380, -240, 40, MD, { align: 'right', w: 800 });
    for (let g = 0; g < 4; g++) line(-380, -170 + g * 110, 380, -170 + g * 110, 'rgba(255,255,255,0.06)', 2);
    line(-380, 262, 380, 262, rgba(R, 0.5), 3, [14, 12]); txt('صفر', -340, 228, 28, rgba(R, 0.8), { w: 700 });
    const kA = cl(t / Math.max(0.5, ws(5) - 0.05)), kB = cub(k01(t, ws(5) - 0.05, ws(6) + 0.25 - ws(5)));
    const pA = trace(EQ.slice(0, 39), kA, G, 10); let pen = pA;
    if (kB > 0) { pen = trace(EQ.slice(38), kB, R, 11); }
    circle(pen[0], pen[1], 14 + 4 * Math.sin(t * 14), kB > 0 ? R : G);
    // the drop flashes red
    const kf = kB > 0 ? 1 - k01(t, ws(5), 0.5) : 0; if (kf > 0) { cv.save(); cv.globalAlpha *= kf * 0.35; rrect(-430, -300, 860, 600, 36, R); cv.restore(); }
  });
  popIn(t, ws(6), () => { circle(0, 0, 62, R); txt('؟', 0, 6, 86, WHITE); }, -360, -300, 0.5, 0.12 * Math.sin(t * 5));
}
// ---- «برنامه اینه»: the plan card ----
function planArt(t, th) {
  const k = pop(t - T.plan - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-420, -290, 840, 580, WHITE, 'rgba(26,20,48,0.1)');
    txt('نقشه‌ی ما', 360, -200, 58, INKP, { align: 'right' }); line(360, -150, 360 - 260 * cub(k01(t, T.plan + 0.2, 0.4)), -150, R, 8);
    const row = (y, t0, s, icon) => { const kr = pop(t - t0 + 0.05, 13, 0.6); if (kr <= 0) return; at(0, y + (1 - cl(kr)) * 30, 1, cl(kr), () => {
      rrect(260, -55, 110, 110, 26, icon === 'chart' ? '#ECE7FA' : '#E4F7EE');
      if (icon === 'chart') { [[-30, 10, 30, G], [-6, -20, 40, R], [18, 0, 36, G]].forEach(([dx, dy, hh, c]) => { line(315 + dx, dy - hh / 2 - 12, 315 + dx, dy + hh / 2 + 12, c, 4); rrect(315 + dx - 8, dy - hh / 2, 16, hh, 4, c); }); }
      else { cv.save(); cv.strokeStyle = G; cv.lineWidth = 12; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(285, 25); cv.lineTo(315, -5); cv.lineTo(330, 10); cv.lineTo(352, -20); cv.stroke(); cv.restore(); }
      txt(s, 230, 4, 56, INKP, { align: 'right' }); }); };
    row(-30, ws(9), 'بک‌تست گرفتن', 'chart');
    row(150, ws(14), 'ورود به بازار مالی', 'arrow');
    const ks = cub(k01(t, ws(12) - 0.05, 0.3)); if (ks > 0) { const w = measure('بک‌تست گرفتن', 56) + 30; line(245, -26, 245 - w * ks, -26, R, 10); }
    cross(-330, -30, 46, R, pop(t - ws(12) - 0.1, 14, 0.5));
    check(-330, 150, 46, G, pop(t - ws(16), 14, 0.5));
  });
}
// ---- «در کمترین زمان ممکن کل سرمایه‌مونو از دست بدیم»: a stopwatch, the capital draining ----
function loseArt(t, th) {
  const k = pop(t - T.lose - 0.05, 12, 0.6); if (k <= 0) return;
  const p = 1 - cub(k01(t, ws(23), ws(28) + 0.15 - ws(23)));
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    // the stopwatch
    at(250, -160, 1, 1, () => {
      rrect(-26, -175, 52, 40, 10, WHITE); line(0, -140, 0, -125, WHITE, 16);
      circle(0, 0, 135, 'rgba(0,0,0,0.18)'); circle(0, 0, 135, null, WHITE, 16);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(Math.sin(a) * 100, -Math.cos(a) * 100, Math.sin(a) * 118, -Math.cos(a) * 118, WHITE, i % 3 ? 4 : 8); }
      const ang = t < ws(19) ? 0 : (t - ws(19)) * 9 + Math.pow(Math.max(0, t - ws(23)), 2) * 6;
      line(0, 0, Math.sin(ang) * 96, -Math.cos(ang) * 96, LIME, 10); circle(0, 0, 14, WHITE);
    });
    // the percent left
    txt(fa(Math.round(p * 100)) + '٪', -180, -150, 170, WHITE);
    txt('باقی‌مونده', -180, -30, 38, 'rgba(255,255,255,0.8)', { w: 700 });
    // the capital bar
    txt('سرمایه', 380, 100, 46, WHITE, { align: 'right' });
    rrect(-380, 150, 760, 140, 34, 'rgba(0,0,0,0.25)');
    const fw = 736 * p, col = p > 0.5 ? LIME : mixC(AMB, '#FFFFFF', 0); if (fw > 2) rrect(368 - fw, 162, fw, 116, 26, p > 0.5 ? LIME : p > 0.2 ? AMB : '#FFFFFF');
    if (p <= 0.001) { const kz = pop(t - ws(28) - 0.15, 14, 0.45); if (kz > 0) at(0, 220, cl(kz, 0, 1.2), cl(kz), () => chip('صفر شد', 0, 0, 50, WHITE, INKD)); }
  });
}
// ---- «اما اگه نخوایم، راه‌حل چیه؟»: the question turns into a light bulb ----
function butArt(t, th) {
  const k = pop(t - T.but - 0.05, 12, 0.6); if (k <= 0) return;
  const kb = cub(k01(t, ws(32) - 0.05, 0.25));
  if (kb < 1) at(0, -20, cl(k, 0, 1.2) * (1 - kb), cl(k) * (1 - kb), () => { circle(0, 0, 230, INKD); txt('؟', 0, 24, 320, LIME); }, 0.12 * Math.sin(t * 6));
  const kl = pop(t - ws(32) + 0.02, 12, 0.5);
  if (kl > 0) at(0, -20, cl(kl, 0, 1.25), cl(kl), () => {
    cv.save(); cv.rotate(t * 0.6); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(Math.cos(a) * 250, Math.sin(a) * 250, Math.cos(a) * 320, Math.sin(a) * 320, INKD, 14); } cv.restore();
    cv.save(); cv.shadowColor = 'rgba(255,255,255,0.9)'; cv.shadowBlur = 70; circle(0, -40, 170, WHITE); cv.restore();
    cv.save(); cv.strokeStyle = AMB; cv.lineWidth = 10; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-50, 30); cv.lineTo(-50, -40); cv.quadraticCurveTo(-25, -90, 0, -40); cv.quadraticCurveTo(25, -90, 50, -40); cv.lineTo(50, 30); cv.stroke(); cv.restore();
    rrect(-85, 110, 170, 54, 14, INKD); rrect(-70, 170, 140, 30, 12, INKP); rrect(-50, 205, 100, 26, 12, INKD);
  });
}
// ---- «اینجاست که بک‌تست‌لب…»: the brand, then the real dashboard ----
const RDASH = [180, 40, 1000, 560];
function brandArtK(t, th) {
  const ki = pop(t - ws(37) + 0.1, 12, 0.6); if (ki <= 0) return;
  const up = cub(k01(t, ws(39) - 0.1, 0.45));
  at(0, lerp(-60, -330, up), lerp(1, 0.62, up), 1, () => {
    if (IMG.icon) at(0, -150, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 60; cv.shadowOffsetY = 18; cv.drawImage(IMG.icon, -150, -150, 300, 300); });
    const kw = cub(k01(t, ws(37) + 0.1, 0.35)); if (kw > 0 && IMG.word) { const w = 620, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, -w / 2, 60 + (1 - kw) * 24, w, h); cv.restore(); }
  });
  if (up > 0) at(0, (1 - up) * 300, 1, up, () => { const w = 900, h = shot('dash', RDASH, -450, -110, w); note('صفحه‌ی واقعی بک‌تست‌لب · داشبورد', -110 + h + 56, 'rgba(255,255,255,0.75)'); });
}
// ---- «سه تا استراتژی داری و نمی‌دونی کدومش…»: three cards, dealt, then shuffled face-down ----
const SLOT = [300, 0, -300], SWAPS = [[0, 1], [1, 2], [0, 2], [0, 1]];
function stratCard(s, back) {
  card(-140, -190, 280, 380, back ? VIO : WHITE, back ? null : 'rgba(26,20,48,0.1)', 30);
  if (back) { cv.save(); cv.beginPath(); cv.roundRect(-140, -190, 280, 380, 30); cv.clip(); for (let q = 0; q < 7; q++) circle(0, 0, 40 + q * 26, null, 'rgba(255,255,255,0.08)', 4); cv.restore(); txt('؟', 0, 14, 200, LIME); return; }
  cv.save(); cv.beginPath(); cv.roundRect(-140, -190, 280, 380, 30); cv.clip(); rrect(-140, -190, 280, 110, 0, s.col); cv.restore();
  txt(s.side, 0, -132, 60, WHITE);
  txt('باز شدن', 0, -30, 38, MP, { w: 700 }); txt(s.where, 0, 40, s.where.length > 5 ? 54 : 66, INKP);
  cv.save(); cv.strokeStyle = 'rgba(26,20,48,0.18)'; cv.lineWidth = 5; cv.setLineDash([10, 10]); cv.beginPath(); for (let i = 0; i < 9; i++) { const x = -100 + i * 25, y = 130 + 22 * Math.sin(i * 1.3 + s.where.length); i ? cv.lineTo(x, y) : cv.moveTo(x, y); } cv.stroke(); cv.restore();
}
function threeArt(t, th) {
  const s0 = ws(53) - 0.05, s1 = ws(56) + 0.1, n = SWAPS.length, d = (s1 - s0) / n;
  // where each card is: walk the swaps up to t
  const pos = [0, 1, 2].map((i) => [SLOT[i], 0]); let slot = [0, 1, 2];
  for (let q = 0; q < n; q++) { const a = s0 + q * d; if (t < a) break;
    const e = exIO(k01(t, a, d * 0.9)), [sa, sb] = SWAPS[q], ca = slot.indexOf(sa), cb = slot.indexOf(sb);
    if (e < 1) { pos[ca] = [lerp(SLOT[sa], SLOT[sb], e), -90 * Math.sin(Math.PI * e)]; pos[cb] = [lerp(SLOT[sb], SLOT[sa], e), 90 * Math.sin(Math.PI * e)]; break; }
    slot[ca] = sb; slot[cb] = sa; pos[ca] = [SLOT[sb], 0]; pos[cb] = [SLOT[sa], 0]; }
  const kf = k01(t, ws(52) - 0.1, 0.35), fx = Math.abs(Math.cos(Math.PI * kf)), back = kf > 0.5;
  STRATS.forEach((s, i) => { const kd = pop(t - ws(47 + i) + 0.05, 12, 0.6); if (kd <= 0) return;
    const [x, y] = pos[i]; cv.save(); cv.translate(x + (1 - cl(kd)) * -600, y); cv.rotate([0.05, -0.03, 0.04][i] * (1 - kf)); cv.scale(cl(kd, 0, 1.15) * Math.max(0.02, fx), cl(kd, 0, 1.15)); cv.globalAlpha *= cl(kd); stratCard(s, back); cv.restore(); });
  const kq = pop(t - ws(56) + 0.05, 12, 0.5); if (kq > 0) at(0, 330, cl(kq, 0, 1.2), cl(kq), () => chip('کدومش؟', 0, 0, 52, INKD, LIME));
}
// ---- «هر کدوم رو با قانون‌ها و چک‌لیستش… ذخیره کن»: the strategy's rules, the checklist (k5's screens) ----
const RMOD = [496, 230, 448, 440], RCL = [793, 208, 361, 193];
function saveArt(t, th) {
  const k = pop(t - T.save - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w1 = 600, x1 = -520, y1 = -480, h1 = shot('smodal', RMOD, x1, y1, w1);
    ringIn(RMOD, [512, 420, 418, 110], x1, y1, w1, cub(k01(t, ws(61), 0.3)), VIO);
    popIn(t, ws(61), () => chip('قانون‌ها', 0, 0, 40, WHITE, VIO), 310, y1 + 230);
    const kc = pop(t - ws(62) + 0.05, 12, 0.6);
    if (kc > 0) at(0, (1 - cl(kc)) * 60, 1, cl(kc), () => {
      const w2 = 580, x2 = -80, y2 = y1 + h1 + 40, h2 = shot('clist', RCL, x2, y2, w2);
      ringIn(RCL, [800, 286, 350, 100], x2, y2, w2, cub(k01(t, ws(63), 0.3)), VIO);
      popIn(t, ws(63), () => chip('چک‌لیست', 0, 0, 40, WHITE, VIO), -310, y2 + 130);
      popIn(t, ws(67), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.2)'; cv.shadowBlur = 30; cv.shadowOffsetY = 10; const ww = measure('ذخیره شد', 52) + 150; rrect(-ww / 2, -54, ww, 108, 54, G); cv.restore(); txt('ذخیره شد', 30, 4, 52, WHITE); check(-ww / 2 + 60, 0, 32, WHITE, 1); cv.save(); cv.strokeStyle = G; cv.lineWidth = 8; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-ww / 2 + 44, 2); cv.lineTo(-ww / 2 + 56, 14); cv.lineTo(-ww / 2 + 76, -10); cv.stroke(); cv.restore(); }, x1 + 190, y1 + h1 - 50, 0.5, -0.06);
    });
  });
}
// ---- «روی بازار واقعی گذشته تستشون کن»: the three gold sessions at their end (k5's tests) ----
const RRUN = [40, 150, 1150, 690];
function testArt(t, th) {
  const k = pop(t - T.test - 0.05, 12, 0.6); if (k <= 0) return;
  const keys = ['rA', 'rB', 'rC'], t0s = [ws(69) + 0.05, ws(71), ws(73)], caps = ['خرید · لندن', 'فروش · لندن', 'خرید · نیویورک'];
  keys.forEach((key, i) => { const kk = pop(t - t0s[i] + 0.05, 12, 0.6); if (kk <= 0) return;
    const w = 820, x = -470 + i * 60, y = -480 + i * 190;
    at(0, (1 - cl(kk)) * 120, 1, cl(kk), () => { shot(key, RRUN, x, y, w); at(x + w - 40, y + 16, 1, 1, () => { const s = caps[i], ww = measure(s, 34, 800) + 50; rrect(-ww, -10, ww, 64, 32, INKD); txt(s, -ww / 2, 22, 34, i === 1 ? '#FF8A9A' : '#7CE0B2', { w: 800 }); }); }, [0.02, -0.015, 0.012][i]);
  });
  popIn(t, ws(73) + 0.15, () => chip('طلا، تایم ۱ ساعته، ۱۰ معامله برای هر کدوم', 0, 0, 36, INKD, LIME), 0, 470);
}
// ---- «و توی آنالیز هر استراتژی رو جدا ببین»: the strategy filter, then filtered to the winner ----
const RF = [560, 140, 600, 250], RW = [700, 140, 460, 320];
function analyticsArt(t, th) {
  const k = pop(t - T.analytics - 0.05, 12, 0.6); if (k <= 0) return;
  const sw = cub(k01(t, ws(81) - 0.15, 0.35));
  if (sw < 1) at(0, -60, lerp(0.92, 1, cl(k)) * (1 - 0.06 * sw), cl(k) * (1 - sw), () => {
    const w = 980, x = -490, y = -240, h = shot('anF', RF, x, y, w);
    ringIn(RF, [596, 214, 274, 162], x, y, w, cub(k01(t, ws(79), 0.3)));
    popIn(t, ws(79), () => chip('فیلتر استراتژی', 0, 0, 40, INKD, LIME), 0, y + h + 90);
    note('صفحه‌ی واقعی آنالیز بک‌تست‌لب', y - 60, 'rgba(255,255,255,0.75)');
  });
  if (sw > 0) at(0, -60, lerp(0.92, 1, sw), sw, () => {
    const w = 940, x = -470, y = -340, h = shot('anW', RW, x, y, w);
    ringIn(RW, [880, 282, 202, 36], x, y, w, cub(k01(t, ws(81) + 0.15, 0.3)));
    ringIn(RW, [1030, 392, 120, 56], x, y, w, cub(k01(t, ws(82), 0.3)), G);
    popIn(t, ws(81) + 0.2, () => chip('فقط: ' + BEST, 0, 0, 38, INKD, LIME), 0, y + h + 90);
  });
}
// ---- «کدوم سود داده و کدوم فقط اعصابتو خورده»: the strategy cards with their real results ----
const RROW = [30, 244, 1132, 406];
function verdictArt(t, th) {
  const k = pop(t - T.verdict - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 1000, x = -500, y = -380, h = shot('strats', RROW, x, y, w);
    STRATS.forEach((s) => { const c = byName(s.name); if (!c) return; const win = s.name === BEST, t0 = win ? ws(84) : ws(89) + (s.where === 'لندن' ? 0 : 0.18);
      const [cx] = inCrop(RROW, x, y, w, c.r[0] + c.r[2] / 2, 0);
      ringIn(RROW, c.r, x, y, w, cub(k01(t, t0, 0.3)), win ? G : R);
      if (!win) { const kd = cub(k01(t, ws(89) + 0.35, 0.4)); if (kd > 0) { const [ax, ay] = inCrop(RROW, x, y, w, c.r[0], c.r[1]); cv.save(); cv.globalAlpha *= 0.55 * kd; rrect(ax, ay, c.r[2] * (w / RROW[2]), c.r[3] * (w / RROW[2]), 14, INKD); cv.restore(); } }
      popIn(t, t0 + 0.1, () => chip(usd(c.netNum), 0, 0, 40, WHITE, win ? G : R), cx, y + h + 80);
      popIn(t, t0 + 0.25, () => chip('وین‌ریت ' + pct(c.win), 0, 0, 30, win ? INKD : WHITE, win ? LIME : PLATE), cx, y + h + 180);
    });
    note('کارت‌های واقعی استراتژی · طلا، ۱۰ معامله‌ی هر کدوم', y + h + 280, 'rgba(255,255,255,0.7)');
  });
}
// ---- «بعد فقط برنده وارد بازار شو»: the winner's card ----
function winnerArt(t, th) {
  const k = pop(t - T.winner - 0.05, 12, 0.6); if (k <= 0 || !WINC) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    const w = 520, x = -260, y = -470, h = shot('strats', WINC.r, x, y, w);
    popIn(t, ws(93), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 30; cv.shadowOffsetY = 10;
      cv.fillStyle = R; cv.beginPath(); cv.moveTo(-60, 40); cv.lineTo(-90, 170); cv.lineTo(-40, 140); cv.lineTo(-10, 180); cv.lineTo(0, 40); cv.fill();
      cv.fillStyle = '#C62D44'; cv.beginPath(); cv.moveTo(60, 40); cv.lineTo(90, 170); cv.lineTo(40, 140); cv.lineTo(10, 180); cv.lineTo(0, 40); cv.fill();
      circle(0, 0, 110, AMB); cv.restore(); circle(0, 0, 88, null, 'rgba(255,255,255,0.6)', 5); txt('برنده', 0, 6, 46, INKD); }, x + 20, y + 10, 0.45, -0.15);
    popIn(t, ws(92), () => chip(BEST, 0, 0, 42, LIME, INKD), 0, y + h + 80);
    popIn(t, ws(94), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-300, -70, 600, 140, 70, G); cv.restore();
      txt('ورود به بازار', 40, 4, 56, WHITE); cv.fillStyle = WHITE; cv.beginPath(); cv.moveTo(-200, -30); cv.lineTo(-240, 0); cv.lineTo(-200, 30); cv.fill(); line(-232, 0, -170, 0, WHITE, 12); }, 0, y + h + 240, 0.5);
  });
}
// ---- «شروع رایگان، لینکش توی بیوئه» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -320, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(98), () => chip('شروع رایگان', 0, 0, 68, INKD, LIME), 0, -40, 0.55, -0.03);
  popIn(t, ws(99), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-270, -72, 540, 144, 72, WHITE); cv.restore(); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 170, 0.6);
  const ka = cub(k01(t, ws(100), 0.4)); if (ka > 0) { const y = 330 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha *= ka; cv.strokeStyle = WHITE; cv.lineWidth = 12; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-40, y + 24); cv.lineTo(0, y - 16); cv.lineTo(40, y + 24); cv.stroke(); cv.restore(); }
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1230, 1.05], groups: [
      { at: 0, lines: [L_(300, 120, WHITE, [['نظرت', 0], ['چیه؟', 1]]), L_(450, 110, WHITE, [['با', 2], ['هم', 3], ['یه', 4]]), L_(610, 130, WHITE, [['خودکشی', 5, { hl: R, ht: WHITE }], ['کنیم؟', 6]])] }] },
    { k: 'plan', bg: PAPER, wipe: 'up', art: 'plan', kpos: [CX, 1220, 1.08], groups: [
      { at: 7, lines: [L_(400, 140, INKP, [['برنامه', 7, { c: VIO }], ['اینه:', 8]])] },
      { at: 9, lines: [L_(300, 92, INKP, [['بدون', 9], ['اینکه', [10, 11]], ['بک‌تست', 12, { hl: R, ht: WHITE }], ['بگیریم،', 13]]), L_(440, 92, INKP, [['وارد', 14], ['بازار', 15, { c: VIO }], ['مالی', 16, { c: VIO }], ['بشیم', 17]])] }] },
    { k: 'lose', bg: R, wipe: 'right', art: 'lose', kpos: [CX, 1300, 1], groups: [
      { at: 18, lines: [L_(270, 88, WHITE, [['و', 18], ['در', 19], ['کمترین', 20], ['زمان', 21], ['ممکن', 22]]), L_(410, 116, WHITE, [['کل', 23], ['سرمایه‌مونو', [24, 25], { hl: INKD, ht: WHITE }]]), L_(550, 100, WHITE, [['از', 26], ['دست', 27], ['بدیم.', 28]])] }] },
    { k: 'but', bg: LIME, wipe: 'up', art: 'but', kpos: [CX, 1240, 1], groups: [
      { at: 29, lines: [L_(330, 110, INKD, [['اما', 29], ['اگه', 30], ['نخوایم،', 31]]), L_(490, 130, INKD, [['راه‌حل', [32, 33], { hl: INKD, ht: LIME }], ['چیه؟', 34]])] }] },
    { k: 'brand', bg: VIO, wipe: 'iris', art: 'brand', kpos: [CX, 1300, 1], groups: [
      { at: 35, lines: [L_(320, 100, WHITE, [['اینجاست', 35], ['که', 36]]), L_(470, 150, LIME, [['بک‌تست‌لب', [37, 38]]])] },
      { at: 39, lines: [L_(260, 100, WHITE, [['کامل‌ترین', [39, 40], { hl: LIME, ht: INKD }], ['پلتفرم', 41]]), L_(390, 100, WHITE, [['بک‌تست', 42], ['ایران', 43, { c: LIME }]]), L_(510, 88, WHITE, [['به', 44], ['کمکت', 45], ['میاد.', 46]])] }] },
    { k: 'three', bg: INKD, wipe: 'right', art: 'three', kpos: [CX, 1210, 1.12], groups: [
      { at: 47, lines: [L_(360, 110, WHITE, [['سه', 47, { hl: LIME, ht: INKD }], ['تا', 48], ['استراتژی', 49], ['داری', 50]])] },
      { at: 51, lines: [L_(290, 100, WHITE, [['و', 51], ['نمی‌دونی', 52], ['کدومش', 53, { c: LIME }]]), L_(430, 100, WHITE, [['واقعاً', 54], ['کار', 55], ['می‌کنه؟', 56, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'save', bg: PAPER, wipe: 'up', art: 'save', kpos: [CX, 1300, 1], groups: [
      { at: 57, lines: [L_(240, 84, INKP, [['هر', 57], ['کدوم', 58], ['رو', 59], ['با', 60], ['قانون‌ها', 61, { hl: VIO, ht: WHITE }]]), L_(355, 84, INKP, [['و', 62], ['چک‌لیستش', 63, { hl: VIO, ht: WHITE }]]), L_(470, 84, INKP, [['توی', 64], ['بک‌تست‌لب', [65, 66], { c: VIO }], ['ذخیره', 67, { hl: G, ht: WHITE }], ['کن،', 68]])] }] },
    { k: 'test', bg: INKD, wipe: 'left', art: 'test', kpos: [CX, 1290, 1], groups: [
      { at: 69, lines: [L_(290, 96, WHITE, [['روی', 69], ['بازار', 70], ['واقعی', 71, { hl: LIME, ht: INKD }], ['گذشته', 72]]), L_(430, 120, WHITE, [['تستشون', 73, { c: LIME }], ['کن', 74]])] }] },
    { k: 'analytics', bg: VIO, wipe: 'right', art: 'analytics', kpos: [CX, 1260, 1], groups: [
      { at: 75, lines: [L_(300, 110, WHITE, [['و', 75], ['توی', 76], ['آنالیز', 77, { hl: LIME, ht: INKD }]]), L_(450, 92, WHITE, [['هر', 78], ['استراتژی', 79], ['رو', 80], ['جدا', 81, { hl: WHITE, ht: VIO }], ['ببین.', 82]])] }] },
    { k: 'verdict', bg: INKD, wipe: 'iris', art: 'verdict', kpos: [CX, 1230, 1], groups: [
      { at: 83, lines: [L_(270, 104, WHITE, [['کدوم', 83], ['سود', 84, { hl: G, ht: WHITE }], ['داده', 85]]), L_(400, 96, WHITE, [['و', 86], ['کدوم', 87], ['فقط', 88]]), L_(535, 110, WHITE, [['اعصابتو', 89, { hl: R, ht: WHITE }], ['خورده.', 90]])] }] },
    { k: 'winner', bg: LIME, wipe: 'up', art: 'winner', kpos: [CX, 1300, 1], groups: [
      { at: 91, lines: [L_(300, 120, INKD, [['بعد', 91], ['فقط', 92], ['برنده', 93, { hl: INKD, ht: LIME }]]), L_(450, 104, INKD, [['وارد', 94], ['بازار', 95], ['شو.', 96]])] }] },
    { k: 'cta', bg: VIO, wipe: 'right', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 97, lines: [L_(330, 130, WHITE, [['شروع', 97], ['رایگان،', 98, { hl: LIME, ht: INKD }]]), L_(480, 100, WHITE, [['لینکش', 99], ['توی', 100], ['بیوئه.', 101]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, plan: planArt, lose: loseArt, but: butArt, brand: brandArtK, three: threeArt, save: saveArt, test: testArt,
    analytics: analyticsArt, verdict: verdictArt, winner: winnerArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(5), 16], [ws(28) + 0.1, 12], [ws(37), 6], [ws(89), 8]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('نظرت چیه', CX, 300, 120, WHITE); txt('با هم یه', CX, 450, 110, WHITE);
    const s = 'خودکشی کنیم؟', size = 130, w = measure(s, size); cv.save(); cv.translate(CX, 620); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, R); cv.restore(); txt(s, CX, 620, size, WHITE);
    at(CX, 1250, 0.95, 1, () => hookArt(ws(6) + 0.6, THEME.ink));
    at(CX, 1720, 1, 1, () => chip('یه راه‌حل بهتر داریم', 0, 0, 52, INKD, LIME));
  },
});
