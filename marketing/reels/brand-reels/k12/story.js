// k12 · «نصف حسابمو باختم… حالا چند درصد سود کنم تا برگردم سر جام؟», the default kinetic look (u-kit), on the user's voice,
// paced like the two reels past 10k views (k1, q2): ×1.22, about 190 words a minute, the brand only from 37 s.
// The account is a tall bar out of $1,000 that runs through the math:
//   - it's half gone from the first frame («−۵۰٪»);
//   - +50% on $500 only brings it to $750, $250 short;
//   - it has to double (+100%) to get back to $1,000.
// Then:
//   - a curve of the gain needed for each loss shooting up;
//   - a table of losses and the gains they need, where «۴۰۰٪» breaks out of the card;
//   - a falling arrow stopped by a bar («فقط جلوشو می‌گیرن»);
//   - a drawdown sinking into the unknown;
//   - f1's real gold replay;
//   - the real Monte Carlo of the Analytics page (k1's session), with «افت سرمایه در بدترین ۵٪» and «ریسک نصف شدن حساب»
//     ringed;
//   - big risk against small risk;
//   - the free start.
// The math: −10% needs +11.1%, −30% needs +42.9%, −50% needs +100%, −80% needs +400%, −5% needs +5.3%.
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w) { const h = (w * r[3]) / r[2]; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); crop(key, r, x, y, w); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const pct = (v) => fa(String(v).replace('.', '٫')) + '٪';
/** A chip for signed numbers (−۱۰٪, +۴۰۰٪): drawn left to right so the sign stays in front. */
function chipL(s, x, y, size, fg, bg) { const w = measure(s, size, 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg); txt(s, x, y + size * 0.04, size, fg, { w: 800, dir: 'ltr' }); return w; }
const usd = (v) => money(v) + ' دلار';

// ---- the account bar: out of $1,000, filled from the bottom ----
// v: the money now; base: the part kept from before (violet), the rest above it is new gain (green); lost: a dashed ghost
const BH = 620, BW = 230;
function bar(t, v, o = {}) {
  const x = -BW / 2, y = -BH / 2, Y = (m) => y + BH - (BH * m) / 1000, base = Math.min(v, o.base ?? v);
  shadowed(() => rrect(x - 16, y - 16, BW + 32, BH + 32, 44, o.dark ? PLATE : WHITE), 40, 14, 0.3);
  rrect(x, y, BW, BH, 30, o.dark ? '#2A2340' : '#ECE7FA');
  cv.save(); cv.beginPath(); cv.roundRect(x, y, BW, BH, 30); cv.clip();
  rrect(x, Y(base), BW, BH - (Y(base) - y), 0, VIO);
  if (v > base) rrect(x, Y(v), BW, Y(base) - Y(v), 0, G);
  if (o.gap) { const a = 0.55 + 0.45 * Math.sin(t * 9); cv.save(); cv.globalAlpha *= a; for (let i = -6; i < 12; i++) line(x + i * 34, Y(1000), x + i * 34 + 120, Y(v), rgba(R, 0.7), 8); cv.restore(); }
  cv.restore();
  if (v < 1000) { cv.save(); cv.setLineDash([16, 12]); rrect(x + 4, y + 4, BW - 8, Y(v) - y - 4, 26, null, o.lostCol ?? rgba(R, 0.8), 5); cv.restore(); }
  txt(usd(v), 0, y + BH + 70, 52, o.dark ? WHITE : INKP);
  return { x, y, Y };
}
const BAR = (t, t0, a, b, d = 0.6) => lerp(a, b, cub(k01(t, t0, d)));

// ---- «نصف حسابمو باختم»: half gone from the first frame ----
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6); if (k <= 0) return;
  at(130, 0, cl(k, 0, 1.1), cl(k), () => bar(t, 500, { dark: true }));
  popIn(t, -0.2, () => { cv.save(); cv.shadowColor = rgba(R, 0.6); cv.shadowBlur = 40; rrect(-150, -80, 300, 160, 40, R); cv.restore(); txt('−' + pct(50), 0, 6, 100, WHITE, { dir: 'ltr' }); }, -250, -150, 0.5, -0.06);
}
// ---- «حالا چند درصد سود کنم تا برگردم سر جام؟» ----
function askArt(t, th) {
  const k = pop(t - T.ask - 0.05, 12, 0.6); if (k <= 0) return;
  at(130, 0, cl(k, 0, 1.1), cl(k), () => {
    const { Y } = bar(t, 500, { dark: true }); const ka = cub(k01(t, ws(6), 0.5));
    if (ka > 0) { const y0 = Y(500) - 20, y1 = lerp(y0, Y(1000) + 30, ka); line(0, y0, 0, y1, LIME, 14); cv.fillStyle = LIME; cv.beginPath(); cv.moveTo(-34, y1 + 10); cv.lineTo(0, y1 - 34); cv.lineTo(34, y1 + 10); cv.closePath(); cv.fill(); }
  });
  popIn(t, ws(5), () => { shadowed(() => rrect(-140, -80, 280, 160, 40, LIME), 30, 10, 0.3); txt('+ ؟٪', 0, 6, 92, INKD, { dir: 'ltr' }); }, -250, -150, 0.5, 0.05);
}
// ---- «پنجاه درصد؟ نه.» ----
function fiftyArt(t, th) {
  popIn(t, ws(12), () => { shadowed(() => rrect(-230, -110, 460, 220, 60, G), 40, 14, 0.3); txt('+' + pct(50), 0, 8, 130, WHITE, { dir: 'ltr' }); }, 0, -40, 0.5);
  const kx = pop(t - ws(14) + 0.02, 15, 0.5); if (kx > 0) at(0, -40, lerp(1.6, 1, cl(kx)), cl(kx * 3), () => { line(-210, -120, 210, 120, R, 34); line(210, -120, -210, 120, R, 34); });
}
// ---- «بیا یه حساب ساده کنیم»: a calculator ----
const KEYS = ['۷', '۸', '۹', '÷', '۴', '۵', '۶', '×', '۱', '۲', '۳', '−', '۰', '٪', '=', '+'];
function calcArt(t, th) {
  const k = pop(t - T.calc - 0.05, 12, 0.55); if (k <= 0) return;
  at(0, -20, cl(k, 0, 1.15), cl(k), () => {
    shadowed(() => rrect(-180, -250, 360, 500, 44, INKD), 50, 18, 0.4);
    rrect(-150, -220, 300, 110, 22, '#2A2340'); const typed = ['۵', '۵۰', '۵۰٪'], n = Math.min(3, Math.floor((t - ws(17)) / 0.1) + 1);
    if (n > 0) txt(t >= ws(19) ? '۵۰٪ = ؟' : typed[n - 1], 128, -165, 56, LIME, { align: 'right', dir: 'ltr' });
    KEYS.forEach((s, i) => { const c = i % 4, r = Math.floor(i / 4), x = 105 - c * 70, y = -50 + r * 70, hit = (s === '=' && t > ws(19)) || (s === '۵' && t > ws(17) && t < ws(17) + 0.1);
      rrect(x - 30, y - 30, 60, 60, 16, s === '=' ? VIO : hit ? LIME : PLATE); txt(s, x, y + 3, 30, hit ? INKD : WHITE, { w: 800 }); });
  }, -0.05);
}
// ---- «حساب هزار دلاری، ۵۰ درصد ضرر، می‌شه ۵۰۰ دلار» ----
function k1000Art(t, th) {
  const k = pop(t - T.k1000 - 0.05, 12, 0.6); if (k <= 0) return; const v = BAR(t, ws(25) - 0.1, 1000, 500, 0.7);
  at(130, 0, cl(k, 0, 1.1), cl(k), () => bar(t, v, { dark: true }));
  popIn(t, ws(24), () => { shadowed(() => rrect(-130, -66, 260, 132, 34, R), 30, 10, 0.4); txt('−' + pct(50), 0, 5, 76, WHITE, { dir: 'ltr' }); }, -250, -120, 0.5, -0.05);
}
// ---- «۵۰ درصد سود روی ۵۰۰ دلار؟ می‌شه ۷۵۰» ----
function backArt(t, th) {
  const k = pop(t - T.back - 0.05, 12, 0.6); if (k <= 0) return; const v = BAR(t, ws(35) - 0.1, 500, 750, 0.7);
  at(130, 0, cl(k, 0, 1.1), cl(k), () => bar(t, v, { base: 500, lostCol: rgba(INKP, 0.35) }));
  popIn(t, ws(31), () => { shadowed(() => rrect(-150, -66, 300, 132, 34, G), 30, 10, 0.3); txt('+' + pct(50), 0, 5, 76, WHITE, { dir: 'ltr' }); }, -250, -150, 0.5, 0.04);
  popIn(t, ws(33), () => txt('+۲۵۰ دلار', 0, 0, 44, G, { w: 800 }), -250, -30, 0.6);
}
// ---- «هنوز ۲۵۰ دلار عقبی» ----
function behindArt(t, th) {
  at(130, 0, 1, 1, () => { const { Y } = bar(t, 750, { base: 500, gap: true }); const kb = cub(k01(t, ws(40), 0.3));
    if (kb > 0) { cv.save(); cv.globalAlpha *= kb; line(-BW / 2 - 40, Y(1000), -BW / 2 - 40, Y(750), WHITE, 8); line(-BW / 2 - 56, Y(1000), -BW / 2 - 24, Y(1000), WHITE, 8); line(-BW / 2 - 56, Y(750), -BW / 2 - 24, Y(750), WHITE, 8); cv.restore(); } });
  popIn(t, ws(40), () => { shadowed(() => rrect(-150, -66, 300, 132, 34, INKD), 30, 10, 0.4); txt('−۲۵۰', 0, 5, 80, WHITE, { dir: 'ltr' }); }, -260, -200, 0.5, -0.05);
}
// ---- «برای برگشتن به ۱٬۰۰۰ دلار، باید ۱۰۰ درصد سود کنی؛ یعنی پولتو دو برابر کنی» ----
function hundredArt(t, th) {
  const k = pop(t - T.hundred - 0.05, 12, 0.6); if (k <= 0) return; const v = BAR(t, ws(51) - 0.05, 500, 1000, 0.9);
  at(130, 0, cl(k, 0, 1.1), cl(k), () => bar(t, v, { base: 500, lostCol: rgba(INKD, 0.35) }));
  popIn(t, ws(51), () => { shadowed(() => rrect(-170, -80, 340, 160, 40, INKD), 30, 10, 0.4); txt('+' + pct(100), 0, 6, 92, LIME, { dir: 'ltr' }); }, -250, -170, 0.5, 0.04);
  popIn(t, ws(57), () => { shadowed(() => circle(0, 0, 90, VIO), 30, 10, 0.4); txt('×۲', 0, 8, 86, WHITE, { dir: 'ltr' }); }, -250, 90, 0.45, 0.1);
}
// ---- «و هرچی ضرر بزرگ‌تر باشه، بدتر می‌شه»: the gain needed shoots up ----
const NEED = (l) => (1 / (1 - l / 100) - 1) * 100;
function worseArt(t, th) {
  const k = pop(t - T.worse - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-430, -300, 860, 600, PLATE, 'rgba(255,255,255,0.12)', 36);
    const X = (l) => -360 + (l / 80) * 720, Yv = (g) => 230 - Math.min(g, 400) * 1.15;
    line(-370, 230, 380, 230, 'rgba(255,255,255,0.25)', 3); line(-370, 230, -370, -260, 'rgba(255,255,255,0.25)', 3);
    txt('ضرر', 360, 270, 30, R, { w: 800 }); txt('سود لازم', -300, -250, 30, G, { w: 800 });
    const kc = cub(k01(t, ws(61), ws(66) - ws(61) + 0.3)), pts = []; for (let l = 0; l <= 80 * kc + 0.001; l += 1) pts.push([X(l), Yv(NEED(l))]);
    if (pts.length > 1) { cv.save(); cv.shadowColor = rgba(R, 0.7); cv.shadowBlur = 20; trace(pts, 1, R, 10); cv.restore(); const e = pts[pts.length - 1]; circle(e[0], e[1], 14, R); }
  });
}
// ---- the table: −10% → +11%, −30% → +43%, −80% → +400% (the last breaks out of the card) ----
const ROWS = [[10, 11, 67, 70], [30, 43, 75, 78], [80, 400, 82, 85]];
function tableArt(t, th) {
  const k = pop(t - T.table - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-440, -330, 880, 640, WHITE, 'rgba(26,20,48,0.1)', 36);
    txt('ضرر', 270, -270, 34, R, { w: 800 }); txt('سود لازم برای برگشتن', -170, -270, 34, G, { w: 800 }); line(400, -225, -400, -225, 'rgba(26,20,48,0.08)', 2);
    ROWS.forEach(([l, g, a, b], i) => {
      const y = -120 + i * 170, kl = pop(t - ws(a) + 0.05, 13, 0.6), kg = pop(t - ws(b) + 0.05, 12, 0.5); if (kl <= 0) return;
      at(270, y, cl(kl, 0, 1.2), cl(kl), () => chipL('−' + pct(l), 0, 0, 52, WHITE, R));
      if (kl > 0.5) { cv.save(); cv.fillStyle = MD; cv.beginPath(); cv.moveTo(70, y - 18); cv.lineTo(30, y); cv.lineTo(70, y + 18); cv.closePath(); cv.fill(); cv.restore(); line(140, y, 50, y, MD, 6); }
      if (kg > 0) { const big = i === 2, s = big ? 1.35 : 1, wob = big && t > ws(b) + 0.3 ? Math.sin(t * 40) * 0.02 : 0;
        at(big ? -170 : -170, y, cl(kg, 0, 1.25) * s, cl(kg), () => { if (big) { cv.save(); cv.shadowColor = rgba(G, 0.8); cv.shadowBlur = 40; } chipL('+' + pct(g), 0, 0, big ? 84 : 52, WHITE, G); if (big) cv.restore(); }, wob); }
    });
  });
}
// ---- «ضرر بزرگ رو با سود بزرگ جبران نمی‌کنن؛ فقط جلوشو می‌گیرن» ----
function quoteArt(t, th) {
  const kb = pop(t - ws(98) + 0.02, 15, 0.5), stop = t >= ws(98), y = stop ? -60 : lerp(-330, -60, cl((t - T.quote) / (ws(98) - T.quote)));
  const ka = cub(k01(t, T.quote, 0.4)); if (ka > 0) at(0, y, 1, ka, () => { shadowed(() => { rrect(-40, -220, 80, 220, 20, R); cv.fillStyle = R; cv.beginPath(); cv.moveTo(-100, -10); cv.lineTo(0, 110); cv.lineTo(100, -10); cv.closePath(); cv.fill(); }, 30, 10, 0.4); });
  if (kb > 0) at(0, 120, lerp(1.4, 1, cl(kb)), cl(kb * 3), () => { shadowed(() => rrect(-330, -40, 660, 80, 26, LIME), 30, 10, 0.4); txt('حد ضرر', 0, 3, 44, INKD); });
  if (stop) { const kf = 1 - cub(k01(t, ws(98), 0.4)); if (kf > 0) { cv.save(); cv.globalAlpha *= kf; for (let i = 0; i < 10; i++) { const a = Math.PI * (1 + i / 9); line(Math.cos(a) * 120, 80 + Math.sin(a) * 60, Math.cos(a) * 220, 80 + Math.sin(a) * 120, WHITE, 6); } cv.restore(); } }
}
// ---- «از کجا بدونی استراتژیت تا کجا می‌ریزه، قبل از اینکه با پول واقعی بفهمی؟» ----
function whereArt(t, th) {
  const k = pop(t - T.where - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-430, -280, 860, 560, PLATE, 'rgba(255,255,255,0.12)', 36);
    const g = cv.createLinearGradient(0, 0, 0, 280); g.addColorStop(0, 'rgba(16,12,28,0)'); g.addColorStop(1, 'rgba(16,12,28,0.95)');
    const pts = [[-390, -200], [-300, -170], [-230, -190], [-150, -90], [-80, -110], [0, -10], [60, -40], [140, 80], [200, 60], [280, 190], [330, 170], [390, 300]];
    cv.save(); cv.beginPath(); cv.roundRect(-430, -280, 860, 560, 36); cv.clip(); cv.shadowColor = rgba(R, 0.6); cv.shadowBlur = 16; trace(pts, cub(k01(t, T.where + 0.1, 1.6)), R, 10); cv.restore();
    cv.save(); cv.beginPath(); cv.roundRect(-430, -280, 860, 560, 36); cv.clip(); cv.fillStyle = g; cv.fillRect(-430, 0, 860, 280); cv.restore();
    [[-200, 160], [60, 200], [260, 120]].forEach(([x, y], i) => popIn(t, ws(107) + i * 0.15, () => txt('؟', 0, 0, 90, LIME), x, y, 0.5));
    popIn(t, ws(115), () => chip('پول واقعی', 0, 0, 40, WHITE, R), 230, -200, 0.55, 0.04);
  });
}
// ---- «توی بک‌تست‌لب، استراتژیتو روی بازار واقعیِ گذشته تست می‌کنی» (f1: the gold replay) ----
const RR = [520, 200, 560, 620], DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));
function labArt(t, th) {
  const k = pop(t - T.lab - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 560, x = -280, y = -300, h = shot(FLIP(t, T.lab, T.analytics + 0.3, DK), RR, x, y, w);
    if (IMG.icon) popIn(t, ws(119), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -55, -55, 110, 110); }, x + w, y, 0.5);
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y + h + 52, MP);
  });
}
// ---- «آنالیزش بهت می‌گه بدترین افتت چقدره و چقدر احتمال داره حسابت نصف بشه» (Analytics: k1's Monte Carlo) ----
const RCH = [40, 700, 1110, 220], RMC = [45, 600, 560, 100], QRUIN = [58, 620, 262, 64], QDD = [331, 620, 260, 64];
function analyticsArt(t, th) {
  const k = pop(t - T.analytics - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 900, x = -450, y = -330, h = shot('mc', RCH, x, y, w);
    const y2 = y + h + 50, h2 = shot('mc', RMC, x, y2, w);
    ringIn(RMC, QDD, x, y2, w, cub(k01(t, ws(133), 0.35)), VIO);
    ringIn(RMC, QRUIN, x, y2, w, cub(k01(t, ws(140), 0.35)), R);
    popIn(t, ws(141), () => chip('همون «نصف حساب»', 0, 0, 34, WHITE, R), 230, y2 + h2 + 70, 0.55, -0.03);
    note('صفحه‌ی واقعی بک‌تست‌لب · آنالیز، شبیه‌سازی مونت‌کارلو', y2 + h2 + 150, '#3E4D12');
  });
}
// ---- «ریسکتو طوری می‌چینی که هیچ‌وقت مجبور نشی ۱۰۰ درصد سود کنی، فقط برای برگشتن»: big risk vs small risk ----
function arrangeArt(t, th) {
  [['ریسک بزرگ', 50, 100, R, -1], ['ریسک کوچیک', 5, 5.3, G, 1]].forEach(([name, l, g, col, ok], i) => {
    const kk = pop(t - (i ? ws(146) : ws(143)) + 0.05, 12, 0.6); if (kk <= 0) return;
    at(i ? -215 : 215, 0, lerp(0.85, 1, cl(kk)), cl(kk), () => {
      card(-195, -260, 390, 520, WHITE, 'rgba(26,20,48,0.1)', 36);
      txt(name, 0, -195, 44, INKP);
      chipL('−' + pct(l), 0, -80, 50, WHITE, R);
      cv.save(); cv.fillStyle = MD; cv.beginPath(); cv.moveTo(-18, -10); cv.lineTo(0, 20); cv.lineTo(18, -10); cv.closePath(); cv.fill(); cv.restore();
      chipL('+' + pct(g), 0, 80, 50, WHITE, ok > 0 ? G : INKD);
      if (ok > 0) check(0, 200, 44, G, pop(t - ws(157), 13, 0.5)); else cross(0, 200, 44, R, pop(t - ws(153), 13, 0.5));
    });
  });
}
// ---- «شروعش رایگانه؛ لینک توی بیو» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(161), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -20, 0.55, -0.03);
  popIn(t, ws(162), () => { shadowed(() => rrect(-270, -72, 540, 144, 72, WHITE)); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1220, 1], groups: [
      { at: 0, lines: [L_(320, 130, WHITE, [['نصف', 0, { hl: R, ht: WHITE }], ['حسابمو', 1]]), L_(480, 140, WHITE, [['باختم.', 2]])] }] },
    { k: 'ask', bg: VIO, wipe: 'iris', art: 'ask', kpos: [CX, 1240, 1], groups: [
      { at: 3, lines: [L_(260, 100, WHITE, [['حالا', 3], ['چند', 4], ['درصد', 5]]), L_(390, 110, WHITE, [['سود', 6, { c: LIME }], ['کنم', 7]]), L_(530, 110, WHITE, [['تا', 8], ['برگردم', 9], ['سر', 10], ['جام؟', 11, { hl: LIME, ht: INKD }]])] }] },
    { k: 'fifty', bg: PAPER, wipe: 'up', art: 'fifty', kpos: [CX, 1220, 1], groups: [
      { at: 12, lines: [L_(360, 190, INKP, [[pct(50) + '؟', [12, 13], { c: VIO }]]), L_(580, 170, INKP, [['نه.', 14, { hl: R, ht: WHITE }]])] }] },
    { k: 'calc', bg: LIME, wipe: 'iris', art: 'calc', kpos: [CX, 1240, 1], groups: [
      { at: 15, lines: [L_(360, 120, INKD, [['بیا', 15], ['یه', 16], ['حساب', 17, { hl: INKD, ht: LIME }]]), L_(510, 120, INKD, [['ساده', 18], ['کنیم.', 19]])] }] },
    { k: 'k1000', bg: INKD, wipe: 'right', art: 'k1000', kpos: [CX, 1250, 1], groups: [
      { at: 20, lines: [L_(250, 100, WHITE, [['حساب', 20], ['۱٬۰۰۰', 21, { c: LIME }], ['دلاری،', 22]]), L_(380, 104, WHITE, [[pct(50), [23, 24], { c: R }], ['ضرر،', 25]]), L_(520, 120, WHITE, [['می‌شه', 26], ['۵۰۰', 27, { hl: R, ht: WHITE }], ['دلار.', 28]])] }] },
    { k: 'back', bg: PAPER, wipe: 'up', art: 'back', kpos: [CX, 1250, 1], groups: [
      { at: 29, lines: [L_(250, 100, INKP, [[pct(50), [29, 30], { c: G }], ['سود', 31], ['روی', 32]]), L_(380, 100, INKP, [['۵۰۰', 33], ['دلار؟', 34]]), L_(520, 130, INKP, [['می‌شه', 35], ['۷۵۰', [36, 38], { hl: VIO, ht: WHITE }]])] }] },
    { k: 'behind', bg: R, wipe: 'cut', art: 'behind', kpos: [CX, 1250, 1], groups: [
      { at: 39, lines: [L_(330, 120, WHITE, [['هنوز', 39]]), L_(500, 150, WHITE, [['۲۵۰', [40, 42], { hl: INKD, ht: WHITE }], ['دلار', 43], ['عقبی.', 44]])] }] },
    { k: 'hundred', bg: LIME, wipe: 'iris', art: 'hundred', kpos: [CX, 1260, 1], groups: [
      { at: 45, lines: [L_(250, 96, INKD, [['برای', 45], ['برگشتن', 46], ['به', 47], ['۱٬۰۰۰', 48, { c: VIO }], ['دلار،', 49]]), L_(400, 150, INKD, [['باید', 50], [pct(100), [51, 52], { hl: INKD, ht: LIME }]]), L_(540, 104, INKD, [['سود', 53], ['کنی؛', 54]])] },
      { at: 55, lines: [L_(320, 110, INKD, [['یعنی', 55], ['پولتو', 56]]), L_(480, 150, INKD, [['دو برابر', [57, 58], { hl: VIO, ht: WHITE }], ['کنی.', 59]])] }] },
    { k: 'worse', bg: INKD, wipe: 'up', art: 'worse', kpos: [CX, 1270, 1], groups: [
      { at: 60, lines: [L_(270, 110, WHITE, [['و', 60], ['هرچی', 61], ['ضرر', 62, { c: R }]]), L_(400, 110, WHITE, [['بزرگ‌تر', 63], ['باشه،', 64]]), L_(550, 140, WHITE, [['بدتر', 65, { hl: R, ht: WHITE }], ['می‌شه:', 66]])] }] },
    { k: 'table', bg: PAPER, wipe: 'left', art: 'table', kpos: [CX, 1300, 1], groups: [
      { at: 67, lines: [L_(300, 120, INKP, [[pct(10), [67, 68], { c: R }], ['ضرر،', 69]]), L_(450, 110, INKP, [[pct(11), [70, 71], { c: G }], ['سود', 72], ['لازم', 73], ['داره.', 74]])] },
      { at: 75, lines: [L_(300, 120, INKP, [[pct(30), [75, 76], { c: R }], ['ضرر،', 77]]), L_(450, 130, INKP, [[pct(43), [78, 81], { c: G }]])] },
      { at: 82, lines: [L_(300, 120, INKP, [[pct(80), [82, 83], { c: R }], ['ضرر؟', 84]]), L_(460, 160, INKP, [[pct(400), [85, 86], { hl: G, ht: WHITE }], ['سود.', 87]])] }] },
    { k: 'quote', bg: VIO, wipe: 'iris', art: 'quote', kpos: [CX, 1300, 1], groups: [
      { at: 88, lines: [L_(250, 100, WHITE, [['یعنی', 88], ['ضرر', 89, { c: LIME }], ['بزرگ', 90], ['رو', 91]]), L_(380, 100, WHITE, [['با', 92], ['سود', 93], ['بزرگ', 94]]), L_(510, 110, WHITE, [['جبران', 95], ['نمی‌کنن؛', [96, 97], { hl: R, ht: WHITE }]])] },
      { at: 98, lines: [L_(330, 140, WHITE, [['فقط', 98], ['جلوشو', [99, 100], { hl: LIME, ht: INKD }]]), L_(500, 140, WHITE, [['می‌گیرن.', 101]])] }] },
    { k: 'where', bg: INKD, wipe: 'right', art: 'where', kpos: [CX, 1260, 1], groups: [
      { at: 102, lines: [L_(250, 100, WHITE, [['ولی', 102], ['از', 103], ['کجا', 104], ['بدونی', 105]]), L_(380, 100, WHITE, [['استراتژیت', 106], ['تا', 107], ['کجا', 108, { c: LIME }]]), L_(515, 120, WHITE, [['می‌ریزه،', 109, { hl: R, ht: WHITE }]])] },
      { at: 110, lines: [L_(300, 104, WHITE, [['قبل', 110], ['از', 111], ['اینکه', [112, 113]]]), L_(440, 110, WHITE, [['با', 114], ['پول', 115], ['واقعی', 116, { c: R }], ['بفهمی؟', 117]])] }] },
    { k: 'lab', bg: PAPER, wipe: 'up', art: 'lab', kpos: [CX, 1290, 1], groups: [
      { at: 118, lines: [L_(240, 100, INKP, [['توی', 118], ['بک‌تست‌لب،', [119, 121], { c: VIO }]]), L_(360, 96, INKP, [['استراتژیتو', 122], ['روی', 123]]), L_(480, 100, INKP, [['بازار', 124], ['واقعیِ', 125], ['گذشته', 126, { hl: VIO, ht: WHITE }]]), L_(600, 96, INKP, [['تست', 127], ['می‌کنی،', 128]])] }] },
    { k: 'analytics', bg: LIME, wipe: 'iris', art: 'analytics', kpos: [CX, 1300, 1], groups: [
      { at: 129, lines: [L_(250, 92, INKD, [['و', 129], ['آنالیزش', 130, { c: VIO }], ['بهت', 131], ['می‌گه', 132]]), L_(380, 110, INKD, [['بدترین', 133], ['افت', 134, { hl: VIO, ht: WHITE }], ['چقدره', 135]])] },
      { at: 136, lines: [L_(260, 96, INKD, [['و', 136], ['چقدر', 137], ['احتمال', 138], ['داره', 139]]), L_(400, 124, INKD, [['حسابت', 140], ['نصف', 141, { hl: R, ht: WHITE }], ['بشه.', 142]])] }] },
    { k: 'arrange', bg: VIO, wipe: 'right', art: 'arrange', kpos: [CX, 1300, 1], groups: [
      { at: 143, lines: [L_(260, 104, WHITE, [['اون‌وقت', [143, 144]], ['ریسکتو', 145, { c: LIME }]]), L_(390, 104, WHITE, [['طوری', 146], ['می‌چینی', 147], ['که', 148]])] },
      { at: 149, lines: [L_(250, 100, WHITE, [['هیچ‌وقت', [149, 150]], ['مجبور', 151], ['نشی', 152]]), L_(390, 130, WHITE, [[pct(100), [153, 154], { hl: R, ht: WHITE }], ['سود', 155], ['کنی،', 156]]), L_(530, 100, WHITE, [['فقط', 157], ['برای', 158], ['برگشتن.', 159, { c: LIME }]])] }] },
    { k: 'cta', bg: LIME, wipe: 'up', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 160, lines: [L_(320, 130, INKD, [['شروعش', 160], ['رایگانه؛', 161, { hl: VIO, ht: WHITE }]]), L_(470, 110, INKD, [['لینک', 162], ['توی', 163], ['بیو.', 164]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, ask: askArt, fifty: fiftyArt, calc: calcArt, k1000: k1000Art, back: backArt, behind: behindArt, hundred: hundredArt, worse: worseArt, table: tableArt,
    quote: quoteArt, where: whereArt, lab: labArt, analytics: analyticsArt, arrange: arrangeArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(2), 10], [ws(14), 12], [ws(40), 8], [ws(85), 12], [ws(98), 10]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    { const a = measure('نصف', 140), b = measure('حسابمو', 140), gap = measure(' ', 140) * 1.45, right = CX + (a + gap + b) / 2;
      cv.save(); cv.translate(right - a / 2, 360); cv.rotate(-0.025); rrect(-a / 2 - 24, -86, a + 48, 172, 22, R); cv.restore(); txt('نصف', right - a / 2, 360, 140, WHITE); txt('حسابمو', right - a - gap - b / 2, 360, 140, WHITE); }
    txt('باختم…', CX, 540, 130, WHITE);
    at(CX + 130, 1120, 0.9, 1, () => bar(0, 500, { dark: true }));
    at(CX - 230, 980, 1, 1, () => { rrect(-150, -80, 300, 160, 40, R); txt('−' + pct(50), 0, 6, 100, WHITE, { dir: 'ltr' }); }, -0.06);
    at(CX - 230, 1200, 1, 1, () => { rrect(-140, -80, 280, 160, 40, LIME); txt('+ ؟٪', 0, 6, 92, INKD, { dir: 'ltr' }); }, 0.05);
    at(CX, 1620, 1, 1, () => chip('چند درصد سود لازمه تا برگردی؟', 0, 0, 46, INKD, LIME));
  },
});
