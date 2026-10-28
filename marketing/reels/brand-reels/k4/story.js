// k4 · «میخوای رو FX Replay بک‌تست بگیری ولی نمی‌تونی؟ راه‌حلش همینجاست», the kinetic look (u-kit), on the user's voice.
// The drawn parts: a backtest window that won't open (a lock, no brand of anyone's), the key that opens it, the three things
// you no longer need (a foreign card, a VPN, a dollar price). From «بک‌تست‌لب» on, every line has the real platform, dark
// theme: the app in Persian with its Jalali date and Tehran clock (s1), the session window's data range «۱۱ دی ۱۳۹۳ تا ۱۵ مهر
// ۱۴۰۵» (f1), the gold replay with the future covered (f1), the timeframe bar (s1), a trend line, Fibonacci and indicators
// (f1), «برو به» with the London and New York opens (s1), the news flags and their card (k4's own capture, built-in chart),
// spread and commission and a placed trade (f1), the analytics of f1's 10-trade test session («نمونه»), and the billing
// page's Iranian gateways (f1).
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, th, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, th.card); cv.restore(); rrect(x, y, w, h, r, null, th.rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
/** A crop (CSS px of the 1440×900 capture) of a real screen, drawn into the box [x, y, w] with rounded corners; returns its height. */
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; if (!im || a <= 0) return (w * r[3]) / r[2]; const s = im.width / 1440, h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 20); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
/** a real screen on its plate: shadow, dark frame, the crop */
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 30, '#15121F'); cv.restore(); crop(key, r, x, y, w, a); return h; }
function ringIn(r, q, x, y, w, k, col = LIME, round = false) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = 22;
  const X = x + (q[0] - r[0]) * s - m, Y = y + (q[1] - r[1]) * s - m, W = q[2] * s + 2 * m, Hh = q[3] * s + 2 * m;
  if (round) circle(X + W / 2, Y + Hh / 2, Math.max(W, Hh) / 2, null, col, 6); else rrect(X, Y, W, Hh, 14, null, col, 5); cv.restore(); }
const inCrop = (r, x, y, w, px, py) => [x + (px - r[0]) * (w / r[2]), y + (py - r[1]) * (w / r[2])];
const note = (s, y, a = 1) => txt(s, 0, y, 28, MD, { w: 700, alpha: a });
function lock(x, y, s, col, open = 0) { at(x, y, s, 1, () => { rrect(-60, -10, 120, 96, 18, col); cv.save(); cv.strokeStyle = col; cv.lineWidth = 18; cv.lineCap = 'round'; cv.beginPath(); cv.arc(0, -14 - 34 * open, 40, Math.PI, 0); cv.lineTo(40, -14 - 34 * open + (open > 0.5 ? -10 : 10)); cv.stroke(); cv.restore(); circle(0, 30, 12, rgba('#000000', 0.35)); }); }
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
const DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));

// ---- the hook: a backtest window that won't open ----
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6); if (k <= 0) return;
  const kl = cub(k01(t, ws(6), 0.35));
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-430, -300, 860, 600, th);
    rrect(-430, -300, 860, 70, 36, '#2A2340'); [0, 1, 2].forEach((i) => circle(-380 + i * 40, -265, 12, ['#F0435B', '#FFB020', '#16B37A'][i]));
    rrect(-250, -285, 520, 40, 20, '#1D1730'); txt('بک‌تست · بازپخش بازار', 10, -264, 24, MD, { w: 700 });
    const bars = 30, n = Math.min(bars, Math.floor(t * 14)); cv.save(); cv.globalAlpha *= 1 - 0.65 * kl;
    for (let i = 0; i < n; i++) { const o = 60 * Math.sin(i * 0.55) + (rnd(i) - 0.5) * 40, c = o + (rnd(i * 2.3) - 0.48) * 60, x = -380 + i * 25.5, up = c < o;
      line(x, Math.min(o, c) - 20, x, Math.max(o, c) + 20, up ? G : R, 3); rrect(x - 8, Math.min(o, c), 16, Math.max(6, Math.abs(c - o)), 3, up ? G : R); }
    cv.restore();
    // the play button greys out and a lock drops
    at(0, 200, 1, 1, () => { circle(0, 0, 44, mixC(VIO, '#4A4560', kl)); cv.fillStyle = WHITE; cv.beginPath(); cv.moveTo(-14, -22); cv.lineTo(24, 0); cv.lineTo(-14, 22); cv.fill(); });
    if (kl > 0) { cv.save(); cv.globalAlpha *= kl; rrect(-430, -230, 860, 530, 0, 'rgba(16,12,28,0.45)'); cv.restore(); at(0, 10 - 60 * (1 - pop(t - ws(6), 13, 0.5)), 1, kl, () => lock(0, 0, 1.4, R)); }
  });
  const kq = pop(t - ws(7) + 0.05, 13, 0.5); if (kq > 0) at(360, -300, cl(kq, 0, 1.25), cl(kq), () => { circle(0, 0, 62, R); txt('؟', 0, 6, 86, WHITE); }, 0.12 * Math.sin(t * 5));
}
// ---- «راه‌حلش همینجاست»: the lock opens ----
function fixArt(t, th) {
  const ko = cub(k01(t, ws(10), 0.4)), k = pop(t - T.fix + 0.05, 12, 0.6); if (k <= 0) return;
  at(0, -20, cl(k, 0, 1.15), cl(k), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; circle(0, 0, 230, WHITE); cv.restore(); lock(0, 0, 1.9, ko > 0.5 ? G : INKD, ko); });
  const kk = cub(k01(t, T.fix + 0.1, 0.45)); if (kk > 0) at(lerp(380, 120, kk), lerp(260, 110, kk), 1, kk, () => { cv.save(); cv.strokeStyle = INKD; cv.lineWidth = 22; cv.lineCap = 'round'; circle(70, 0, 46, null, INKD, 22); line(24, 0, -90, 0, INKD, 22); line(-60, 0, -60, 34, INKD, 18); line(-86, 0, -86, 28, INKD, 18); cv.restore(); }, -0.5);
  const kc = pop(t - ws(11) + 0.05, 13, 0.55); if (kc > 0) at(0, 300, cl(kc, 0, 1.2), cl(kc), () => chip('همینجا', 0, 0, 44, LIME, INKD));
}
// ---- what you no longer need ----
function painsArt(t, th) {
  const items = [['کارت ارزی', ws(12), 'card'], ['فیلترشکن', ws(16), 'vpn'], ['پرداخت دلاری', ws(19), 'usd']];
  items.forEach(([s, t0, ic], i) => {
    const k = pop(t - t0 + 0.1, 12, 0.6); if (k <= 0) return; const y = -260 + i * 250;
    at(0, y, lerp(0.85, 1, cl(k)), cl(k), () => {
      card(-400, -95, 800, 190, th, 32);
      at(270, 0, 1, 1, () => {
        if (ic === 'card') { rrect(-70, -46, 140, 92, 14, VIO); rrect(-70, -26, 140, 18, 0, INKD); rrect(-52, 14, 40, 14, 4, LIME); }
        if (ic === 'vpn') { cv.fillStyle = SKY; cv.beginPath(); cv.moveTo(0, -56); cv.lineTo(52, -34); cv.quadraticCurveTo(52, 30, 0, 58); cv.quadraticCurveTo(-52, 30, -52, -34); cv.closePath(); cv.fill(); txt('VPN', 0, 2, 30, WHITE, { dir: 'ltr' }); }
        if (ic === 'usd') { circle(0, 0, 54, AMB); txt('$', 0, 4, 70, WHITE, { dir: 'ltr' }); }
      });
      txt(s, 140, 4, 56, th.cardInk, { align: 'right' });
      const kx = cub(k01(t, t0 + 0.25, 0.3)); if (kx > 0) { const w = measure(s, 56) + 150; line(170, 4, 170 - (w + 30) * kx, 4, R, 10); }
      cross(-310, 0, 46, R, pop(t - t0 - 0.2, 14, 0.5));
    });
  });
}
// ---- the app in Persian: Jalali date, Tehran clock (s1's chart, its top bar) ----
const RS = [0, 0, 1440, 900];
function brandArtK(t, th) {
  const k = pop(t - T.brand - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 960, x = -480, y = -420;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot('sa0', RS, x, y, w);
    ringIn(RS, [1200, 70, 232, 280], x, y, w, cub(k01(t, ws(28), 0.3)));
    ringIn(RS, [574, 111, 218, 34], x, y, w, cub(k01(t, ws(30), 0.3)));
    // the date chip, large
    const kz = pop(t - ws(30) - 0.1, 12, 0.6); if (kz > 0) at(0, y + h + 150, lerp(0.85, 1, cl(kz)), cl(kz), () => { const r = [574, 111, 218, 34], ww = 820, hh = shot('sa0', r, -ww / 2, -((ww * r[3]) / r[2]) / 2, ww); ringIn(r, [576, 113, 40, 30], -ww / 2, -hh / 2, ww, cub(k01(t, ws(34), 0.3)), R); });
    const kf = pop(t - ws(28) + 0.05, 13, 0.55); if (kf > 0) at(330, y - 50, cl(kf, 0, 1.2), cl(kf), () => chip('فارسی', 0, 0, 34, INKD, LIME));
  });
}
// ---- the market from 2015 to now, replayed without the future ----
const RC = [455, 685, 535, 95], RR = [520, 200, 560, 620];
function replayArt(t, th) {
  const swap = cub(k01(t, ws(42) - 0.2, 0.35));
  if (swap < 1) { const k = pop(t - T.replay - 0.05, 12, 0.6); if (k > 0) at(0, -40, lerp(0.9, 1, cl(k)) * (1 - 0.08 * swap), cl(k) * (1 - swap), () => {
    const w = 940, x = -470, y = -110, h = shot('c-session', RC, x, y, w);
    ringIn(RC, [800, 755, 195, 24], x, y, w, cub(k01(t, ws(38), 0.3)));
    const k1 = pop(t - ws(39) + 0.05, 13, 0.55), k2 = pop(t - ws(41) + 0.05, 13, 0.55);
    if (k1 > 0) at(240, y + h + 90, cl(k1, 0, 1.2), cl(k1), () => chip('۱۱ دی ۱۳۹۳ = ۲۰۱۵', 0, 0, 36, INKD, LIME));
    if (k2 > 0) at(-240, y + h + 90, cl(k2, 0, 1.2), cl(k2), () => chip('تا الان', 0, 0, 36, WHITE, VIO));
    note('صفحه‌ی واقعی بک‌تست‌لب · ساخت جلسه', y - 60);
  }); }
  if (swap > 0) at(0, 0, lerp(0.92, 1, swap), swap, () => {
    const w = 620, fw = 260, x = -440, y = -330, h = (w * RR[3]) / RR[2], xl = x + w + 8, fwi = fw - 8;
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.35)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 14, y - 14, w + fw + 28, h + 28, 30, '#15121F'); cv.restore();
    crop(FLIP(t, ws(42), T.tf - 0.2, DK), RR, x, y, w); rrect(xl, y, fwi, h, 18, '#0E0B17');
    const kf = cub(k01(t, ws(45) - 0.1, 0.4));
    if (kf > 0) { cv.save(); cv.globalAlpha *= kf; cv.beginPath(); cv.roundRect(xl, y, fwi, h, 18); cv.clip(); for (let q = -30; q < 20; q++) line(xl + q * 26, y + h, xl + q * 26 + 200, y, rgba(LIME, 0.22), 3); cv.restore();
      line(xl - 4, y, xl - 4, y + h, LIME, 4, [12, 9]); at(xl + fwi / 2, y + h / 2 - 30, lerp(1.4, 1, kf), kf, () => { circle(0, 0, 64, LIME); txt('؟', 0, 6, 84, INKD); });
      at(xl + fwi / 2, y + h / 2 + 80, 1, kf, () => chip('آینده', 0, 0, 34, INKD, LIME)); }
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y + h + 60);
  });
}
// ---- the timeframe bar: 1 minute to daily ----
const RT = [0, 150, 480, 50];
function tfArt(t, th) {
  const k = pop(t - T.tf - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 980, x = -490, y = -120;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot('sa0', RT, x, y, w);
    const k1 = cub(k01(t, ws(54), 0.3)), k2 = cub(k01(t, ws(57), 0.3));
    ringIn(RT, [236, 160, 28, 30], x, y, w, k1); ringIn(RT, [430, 160, 22, 30], x, y, w, k2);
    if (k1 > 0 && k2 > 0) { const [a] = inCrop(RT, x, y, w, 250, 0), [b] = inCrop(RT, x, y, w, 441, 0); cv.save(); cv.globalAlpha *= k2; line(a, y + h + 40, a + (b - a) * k2, y + h + 40, LIME, 8); cv.restore(); }
    const ka = pop(t - ws(54) + 0.05, 13, 0.55), kb = pop(t - ws(57) + 0.05, 13, 0.55);
    if (ka > 0) at(inCrop(RT, x, y, w, 250, 0)[0], y + h + 110, cl(ka, 0, 1.2), cl(ka), () => chip('۱ دقیقه', 0, 0, 34, INKD, LIME));
    if (kb > 0) at(inCrop(RT, x, y, w, 441, 0)[0] - 40, y + h + 110, cl(kb, 0, 1.2), cl(kb), () => chip('روزانه', 0, 0, 34, INKD, LIME));
  });
}
// ---- drawing: a line, Fibonacci, indicators (f1) ----
const RD = [0, 195, 1192, 630];
function drawArt(t, th) {
  const k = pop(t - T.draw - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 1000, x = -500, y = -280, key = t < ws(62) - 0.1 ? 'e-start' : t < ws(64) - 0.1 ? 'e-fib' : 'e-indicators';
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot(key, RD, x, y, w);
    ringIn(RD, [6, 240, 42, 200], x, y, w, cub(k01(t, ws(60), 0.3)) * (1 - cub(k01(t, ws(62) - 0.1, 0.2))));
    ringIn(RD, [476, 320, 356, 296], x, y, w, cub(k01(t, ws(62), 0.3)) * (1 - cub(k01(t, ws(64) - 0.1, 0.2))));
    ringIn(RD, [56, 618, 1080, 186], x, y, w, cub(k01(t, ws(64), 0.3)));
    [['خط', ws(60), -300], ['فیبوناچی', ws(62), 0], ['اندیکاتور', ws(64), 300]].forEach(([s, t0, cx]) => { const kk = pop(t - t0 + 0.05, 13, 0.55); if (kk > 0) at(cx, y + h + 80, cl(kk, 0, 1.2), cl(kk), () => chip(s, 0, 0, 34, INKD, LIME)); });
    note('صفحه‌ی واقعی بک‌تست‌لب · چارت طلا', y - 60);
  });
}
// ---- «برو به»: straight to the London or New York open (s1) ----
const RG = [470, 100, 420, 590];
function gotoArt(t, th) {
  const k = pop(t - T.goto - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 640, x = -320, y = -420, key = t < ws(70) ? 'se0' : 'se1';
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot(key, RG, x, y, w);
    ringIn(RG, [486, 110, 84, 38], x, y, w, cub(k01(t, ws(69), 0.3)) * (1 - cub(k01(t, ws(75) - 0.2, 0.2))));
    ringIn(RG, [496, 284, 362, 54], x, y, w, cub(k01(t, ws(75), 0.3)));
    ringIn(RG, [496, 341, 362, 54], x, y, w, cub(k01(t, ws(77), 0.3)), SKY);
    note('صفحه‌ی واقعی بک‌تست‌لب · برو به', y + h + 50);
  });
}
// ---- news on the chart, Persian names and the exact time (k4's capture, built-in chart) ----
const RN = [40, 150, 1150, 690], RB = [860, 600, 300, 232];
function newsArt(t, th) {
  const k = pop(t - T.news - 0.05, 12, 0.6); if (k <= 0) return;
  const zoom = cub(k01(t, ws(85) - 0.15, 0.4));
  if (zoom < 1) at(0, 0, lerp(0.92, 1, cl(k)) * (1 - 0.06 * zoom), cl(k) * (1 - zoom), () => {
    const w = 1000, x = -500, y = -300, h = shot('n2', RN, x, y, w);
    [[304, ws(83)], [349, ws(83) + 0.15], [1006, ws(84)]].forEach(([fx, t0], i) => ringIn(RN, [fx, 798, 18, 18], x, y, w, cub(k01(t, t0, 0.3)), i === 0 ? AMB : R, true));
    note('صفحه‌ی واقعی بک‌تست‌لب · جمعه ۱۰ مهر ۱۴۰۵، روز NFP', y + h + 50);
  });
  if (zoom > 0) at(0, 0, lerp(0.9, 1, zoom), zoom, () => {
    const w = 820, x = -410, y = -330, h = shot('n3', RB, x, y, w);
    ringIn(RB, [926, 708, 176, 30], x, y, w, cub(k01(t, ws(87), 0.3)));
    ringIn(RB, [992, 644, 62, 22], x, y, w, cub(k01(t, ws(90), 0.3)), R);
    const kf = pop(t - ws(87) + 0.05, 13, 0.55); if (kf > 0) at(-230, y + h + 70, cl(kf, 0, 1.2), cl(kf), () => chip('اسم فارسی', 0, 0, 34, INKD, LIME));
    const kt = pop(t - ws(90) + 0.05, 13, 0.55); if (kt > 0) at(230, y + h + 70, cl(kt, 0, 1.2), cl(kt), () => chip('۱۶:۰۰ تهران', 0, 0, 34, WHITE, R));
  });
}
// ---- real spread and commission, a placed trade (f1) ----
const RCS = [520, 305, 470, 115], RP = [0, 195, 1192, 420];
function tradeArt(t, th) {
  const k = pop(t - T.trade - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 900, x = -450, y = -400, h = shot('c-session', RCS, x, y, w);
    ringIn(RCS, [790, 370, 104, 40], x, y, w, cub(k01(t, ws(93) - 0.05, 0.3)));
    ringIn(RCS, [572, 370, 102, 40], x, y, w, cub(k01(t, ws(95) - 0.05, 0.3)));
    const kp = pop(t - ws(96) + 0.1, 12, 0.6); if (kp > 0) at(0, 0, lerp(0.9, 1, cl(kp)), cl(kp), () => {
      const w2 = 980, x2 = -490, y2 = y + h + 70, h2 = shot('f-placed', RP, x2, y2, w2);
      ringIn(RP, [55, 398, 92, 24], x2, y2, w2, cub(k01(t, ws(96) + 0.1, 0.3)));
      ringIn(RP, [990, 265, 96, 222], x2, y2, w2, cub(k01(t, ws(97), 0.3)), SKY);
      note('صفحه‌ی واقعی بک‌تست‌لب · اسپرد ۳ پیپ، کمیسیون ۷ دلار', y2 + h2 + 50);
    });
  });
}
// ---- the analytics: does the strategy work? (f1's 10-trade test session) ----
const RA = [500, 345, 650, 63];
function analyticsArt(t, th) {
  const k = pop(t - T.analytics - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, -40, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 1000, x = -500, y = -160, h = shot('h-analytics', RA, x, y, w);
    ringIn(RA, [680, 348, 115, 56], x, y, w, cub(k01(t, ws(104), 0.3)));
    ringIn(RA, [1040, 348, 100, 56], x, y, w, cub(k01(t, ws(106), 0.3)), G);
    const kq = pop(t - ws(106) + 0.05, 12, 0.55); if (kq > 0) at(0, y + h + 190, cl(kq, 0, 1.2), cl(kq), () => { rrect(-330, -80, 660, 160, 40, WHITE); txt('جواب میده؟', 120, 4, 54, INKD); check(-150, 0, 40, G, pop(t - ws(107), 14, 0.5)); txt('/', -205, 4, 54, MP, { dir: 'ltr' }); cross(-260, 0, 40, R, pop(t - ws(109), 14, 0.5)); });
    note('صفحه‌ی واقعی آنالیز · نمونه: ۱۰ معامله‌ی یک جلسه‌ی آزمایشی', y + h + 50);
  });
}
// ---- rial payment, the free start, the link (f1's billing page) ----
const RPAY = [80, 540, 338, 135];
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 620, x = -310, y = -400, h = shot('b-billing', RPAY, x, y, w);
    ringIn(RPAY, [96, 568, 304, 104], x, y, w, cub(k01(t, ws(111), 0.3)), INKD);
    const kr = pop(t - ws(111) + 0.05, 13, 0.55); if (kr > 0) at(0, y + h + 70, cl(kr, 0, 1.2), cl(kr), () => chip('درگاه ایرانی · پرداخت ریالی', 0, 0, 34, LIME, INKD));
    const kf = pop(t - ws(114) + 0.05, 13, 0.55); if (kf > 0) at(0, y + h + 200, cl(kf, 0, 1.25), cl(kf), () => chip('شروع رایگان', 0, 0, 56, LIME, INKD));
    const kb = pop(t - ws(115) + 0.05, 13, 0.6); if (kb > 0) at(0, y + h + 350, cl(kb, 0, 1.2), cl(kb), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-250, -66, 500, 132, 66, WHITE); cv.restore(); txt('لینک توی بیو', 0, 4, 56, VIO); });
  });
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1280, 0.98], groups: [
      { at: 0, lines: [L_(300, 96, WHITE, [['میخوای', 0], ['رو', 1]]), L_(440, 124, LIME, [['FX Replay', [2, 3]]]), L_(590, 96, WHITE, [['بک‌تست', 4], ['بگیری،', 5]]), L_(730, 104, WHITE, [['ولی', 6], ['نمی‌تونی؟', 7, { hl: R, ht: WHITE }]])] }] },
    { k: 'fix', bg: LIME, wipe: 'right', art: 'fix', kpos: [CX, 1180, 1], groups: [
      { at: 8, lines: [L_(360, 120, INKD, [['راه‌حلش', [8, 9]]]), L_(520, 130, INKD, [['همینجاست.', [10, 11], { hl: INKD, ht: LIME }]])] }] },
    { k: 'pains', bg: PAPER, wipe: 'up', art: 'pains', kpos: [CX, 1250, 0.95], groups: [
      { at: 12, lines: [L_(300, 96, INKP, [['نه', 12], ['کارت', 13], ['ارزی', 14, { c: VIO }], ['می‌خواد،', 15]]), L_(440, 96, INKP, [['نه', 16], ['فیلترشکن،', [17, 18], { c: SKY }]]), L_(580, 96, INKP, [['نه', 19], ['پرداخت', 20], ['دلاری.', 21, { hl: AMB, ht: INKD }]])] }] },
    { k: 'brand', bg: VIO, wipe: 'iris', art: 'brand', kpos: [CX, 1240, 1], groups: [
      { at: 22, lines: [L_(280, 120, LIME, [['بک‌تست‌لب', [22, 23]]]), L_(420, 84, WHITE, [['یه', 24], ['پلتفرم', 25], ['بک‌تست‌گیری', 26], ['ایرانیه؛', 27, { hl: LIME, ht: INKD }]])] },
      { at: 28, lines: [L_(280, 100, WHITE, [['فارسی،', 28, { hl: LIME, ht: INKD }]]), L_(420, 92, WHITE, [['با', 29], ['تاریخ', 30], ['شمسی', 31, { c: LIME }], ['و', 32], ['ساعت', 33], ['تهران', 34, { hl: R, ht: WHITE }]])] }] },
    { k: 'replay', bg: INKD, wipe: 'right', art: 'replay', kpos: [CX, 1240, 1], groups: [
      { at: 35, lines: [L_(280, 96, WHITE, [['بازار', 35], ['واقعی', 36, { c: LIME }], ['رو', 37]]), L_(420, 104, WHITE, [['از', 38], ['۲۰۱۵', 39, { hl: LIME, ht: INKD }], ['تا', 40], ['الان', 41, { hl: VIO, ht: WHITE }]])] },
      { at: 42, lines: [L_(280, 92, WHITE, [['دوباره', 42], ['پخش', 43], ['می‌کنی،', 44]]), L_(420, 92, WHITE, [['بدون', 45], ['اینکه', [46, 47]], ['آینده', 48, { hl: LIME, ht: INKD }], ['رو', 49], ['ببینی.', 50]])] }] },
    { k: 'tf', bg: PAPER, wipe: 'up', art: 'tf', kpos: [CX, 1150, 1], groups: [
      { at: 51, lines: [L_(320, 96, INKP, [['از', 51], ['تایم‌فریم', [52, 53], { c: VIO }]]), L_(470, 110, INKP, [['یک', 54], ['دقیقه', 55, { hl: VIO, ht: WHITE }], ['تا', 56], ['روزانه', 57, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'draw', bg: INKD, wipe: 'left', art: 'draw', kpos: [CX, 1220, 1], groups: [
      { at: 58, lines: [L_(280, 96, WHITE, [['روی', 58], ['چارت', 59], ['خط', 60, { c: LIME }], ['می‌کشی،', 61]]), L_(420, 96, WHITE, [['فیبوناچی', 62, { hl: LIME, ht: INKD }], ['و', 63], ['اندیکاتور', 64, { hl: LIME, ht: INKD }], ['می‌ذاری', 65]])] }] },
    { k: 'goto', bg: VIO, wipe: 'right', art: 'goto', kpos: [CX, 1320, 1], groups: [
      { at: 66, lines: [L_(250, 88, WHITE, [['و', 66], ['با', 67], ['گزینه‌ی', 68], ['«برو', 69, { hl: LIME, ht: INKD }], ['به»', 69, { hl: LIME, ht: INKD }]]), L_(370, 88, WHITE, [['مستقیم', 70], ['می‌پری', 71], ['سر', 72], ['باز', 73], ['شدن', 74]]), L_(490, 100, WHITE, [['لندن', 75, { hl: LIME, ht: INKD }], ['یا', 76], ['نیویورک', 77, { hl: SKY, ht: WHITE }]])] }] },
    { k: 'news', bg: INKD, wipe: 'iris', art: 'news', kpos: [CX, 1230, 1], groups: [
      { at: 78, lines: [L_(280, 92, WHITE, [['خبرهای', 78], ['مهم', 79, { c: R }], ['رو', 80], ['هم', 81]]), L_(420, 92, WHITE, [['روی', 82], ['چارت', 83, { c: LIME }], ['می‌بینی،', 84]])] },
      { at: 85, lines: [L_(280, 92, WHITE, [['با', 85], ['اسم', 86], ['فارسی', 87, { hl: LIME, ht: INKD }]]), L_(420, 96, WHITE, [['و', 88], ['ساعت', 89], ['دقیق.', 90, { hl: R, ht: WHITE }]])] }] },
    { k: 'trade', bg: PAPER, wipe: 'up', art: 'trade', kpos: [CX, 1290, 0.95], groups: [
      { at: 91, lines: [L_(250, 92, INKP, [['معامله‌هات', 91], ['با', 92]]), L_(380, 100, VIO, [['اسپرد', 93], ['و', 94], ['کمیسیون', 95]]), L_(510, 92, INKP, [['واقعی', 96, { hl: VIO, ht: WHITE }], ['ثبت', 97], ['می‌شن.', 98]])] }] },
    { k: 'analytics', bg: INKD, wipe: 'left', art: 'analytics', kpos: [CX, 1250, 1], groups: [
      { at: 99, lines: [L_(280, 92, WHITE, [['و', 99], ['آخرش', 100], ['آنالیز', 101, { c: LIME }], ['بهت', 102], ['میگه', 103]]), L_(420, 92, WHITE, [['استراتژیت', 104, { c: LIME }], ['واقعاً', 105]]), L_(560, 104, WHITE, [['جواب', 106, { hl: G, ht: WHITE }], ['میده', 107], ['یا', 108], ['نه.', 109, { hl: R, ht: WHITE }]])] }] },
    { k: 'cta', bg: LIME, wipe: 'right', art: 'cta', kpos: [CX, 1240, 1], groups: [
      { at: 110, lines: [L_(280, 100, INKD, [['پرداختش', 110], ['ریالیه', 111, { hl: INKD, ht: LIME }]]), L_(420, 100, INKD, [['و', 112], ['شروعش', 113], ['رایگانه؛', 114, { hl: VIO, ht: WHITE }]]), L_(560, 92, INKD, [['لینکش', 115], ['توی', 116], ['بیوئه.', 117]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, fix: fixArt, pains: painsArt, brand: brandArtK, replay: replayArt, tf: tfArt, draw: drawArt, goto: gotoArt, news: newsArt, trade: tradeArt,
    analytics: analyticsArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(7), 10], [ws(10), 6]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('میخوای رو', CX, 300, 100, WHITE); txt('FX Replay', CX, 460, 150, LIME, { dir: 'ltr' }); txt('بک‌تست بگیری', CX, 620, 100, WHITE);
    const s = 'ولی نمی‌تونی؟', size = 120, w = measure(s, size); cv.save(); cv.translate(CX, 790); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, R); cv.restore(); txt(s, CX, 790, size, WHITE);
    at(CX, 1330, 1, 1, () => { const ww = 980; shot('n2', RN, -ww / 2, -280, ww); });
    at(CX, 1760, 1, 1, () => chip('راه‌حلش همینجاست', 0, 0, 56, INKD, LIME));
  },
});
