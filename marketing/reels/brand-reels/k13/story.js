// k13 · «سود می‌کنی چون استراتژی داری، یا چون هنوز شانست تموم نشده؟», the default kinetic look (u-kit), on the user's voice,
// paced like the reels past 10k views (k1, q2, k12): ×1.18, about 176 words a minute, the brand only from 24 s.
// Luck is a pair of dice and a battery that runs down; strategy is a card of rules:
//   - the hook: the rules card with a profit, then the dice and the «شانس» battery draining;
//   - two account cards that look the same, whichever made the profit («یه شکلن»), on a full green block («هر دو سبزن»);
//   - ten winning trades that prove nothing;
//   - the first 10 trades of two simulated traders, tangled together;
//   - the count rolling from 10 to 200 as a grid of 200 trades fills;
//   - the same two traders over 200 trades: luck fades below its start, the strategy keeps climbing;
//   - the live market: months of calendar pages and real money;
//   - the real gold replay: candles stepping, a planned sell (entry, stop, target), the trade played until it closes at
//     its target, and the balance after it;
//   - the strategy's curve with a check; the lucky trader's curve with a «الان» pin before it turns; the empty battery;
//   - the free start.
// The simulation is a sample, not market data (said on screen): the strategy wins 45% of trades with wins twice the
// size of losses, the lucky trader wins 50% with wins the size of losses (no edge). Both are fixed pseudo-random paths.
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w) { const h = (w * r[3]) / r[2]; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); crop(key, r, x, y, w); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
function upArrow(s, col) { cv.save(); cv.fillStyle = col; cv.beginPath(); cv.moveTo(0, -s); cv.lineTo(s * 0.78, -s * 0.12); cv.lineTo(s * 0.3, -s * 0.12); cv.lineTo(s * 0.3, s); cv.lineTo(-s * 0.3, s); cv.lineTo(-s * 0.3, -s * 0.12); cv.lineTo(-s * 0.78, -s * 0.12); cv.closePath(); cv.fill(); cv.restore(); }

// ---- luck: dice and a battery ----
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function die(n, s, fill = WHITE, pip = INKD) { shadowed(() => rrect(-s / 2, -s / 2, s, s, s * 0.22, fill), 30, 12, 0.35); PIPS[n].forEach(([a, b]) => circle(a * s * 0.27, b * s * 0.27, s * 0.085, pip)); }
/** The «شانس» battery, filled to lv (0–1): green, then amber, then red; it blinks when nearly empty. */
function battery(lv, t, o = {}) {
  const w = 440, h = 190, col = lv > 0.5 ? G : lv > 0.22 ? AMB : R, low = lv <= 0.22, blink = low ? 0.55 + 0.45 * Math.sin(t * 16) : 1;
  shadowed(() => { rrect(-w / 2 - 16, -h / 2 - 16, w + 32, h + 32, 50, o.body ?? WHITE); rrect(w / 2 + 12, -38, 34, 76, 14, o.body ?? WHITE); }, 40, 14, 0.3);
  rrect(-w / 2, -h / 2, w, h, 34, o.well ?? '#ECE7FA');
  const fw = (w - 24) * cl(lv); if (fw > 6) { cv.save(); cv.globalAlpha *= blink; rrect(-w / 2 + 12, -h / 2 + 12, fw, h - 24, 24, col); cv.restore(); }
  txt('شانس', 0, 6, 76, o.label ?? INKP, { alpha: 0.92 });
}
// ---- strategy: a card of rules ----
function rules(t, t0, th, w = 440, h = 380) {
  card(-w / 2, -h / 2, w, h, th.card, th.rule, 36); txt('استراتژی', 0, -h / 2 + 62, 46, th.cardInk); line(-w / 2 + 36, -h / 2 + 112, w / 2 - 36, -h / 2 + 112, th.rule, 2);
  [0.74, 0.56, 0.66].forEach((f, i) => { const y = -h / 2 + 168 + i * 76, bw = (w - 170) * f; rrect(w / 2 - 110 - bw, y - 13, bw, 26, 13, th.plate); check(w / 2 - 62, y, 26, G, pop(t - t0 - i * 0.12 + 0.05, 13, 0.55)); });
}

// ---- the sample simulation: two fixed pseudo-random paths, in units of one risked amount (R) ----
const walk = (seed, p, win, n = 200) => { const a = [0]; for (let i = 0; i < n; i++) a.push(a[i] + (rnd(seed * 1000 + i) < p ? win : -1)); return a; };
const SIM_S = walk(2981, 0.45, 2), SIM_L = walk(75, 0.5, 1);   // strategy: +5 after 10, +70 after 200; luck: +4 after 10, +9 at its best (trade 57), −4 after 100, −8 after 200
/** The path's points up to trade n (fractional), mapped by X and Y. */
function simPts(a, n, X, Y) { const pts = [], m = Math.min(a.length - 1, Math.floor(n)); for (let i = 0; i <= m; i++) pts.push([X(i), Y(a[i])]); if (m < a.length - 1 && n > m) pts.push([X(n), Y(lerp(a[m], a[m + 1], n - m))]); return pts; }
function glowLine(pts, col, lw, blur = 16) { if (pts.length < 2) return pts[0]; cv.save(); cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = blur; const e = trace(pts, 1, col, lw); cv.restore(); return e; }

// ---- «سود می‌کنی چون استراتژی داری»: the rules card and a profit ----
function hookArt(t, th) {
  const k = pop(t + 1, 12, 0.6);
  at(140, 0, cl(k, 0, 1.1), cl(k), () => rules(t, 0.45, THEME.ink));
  popIn(t, -1, () => { shadowed(() => circle(0, 0, 110, G), 40, 14, 0.4); upArrow(58, WHITE); }, -270, -70, 0.5, -0.06);
  popIn(t, -1, () => chip('سود', 0, 0, 54, WHITE, G), -270, 110, 0.55, 0.04);
}
// ---- «یا چون هنوز شانست تموم نشده؟»: the dice roll in, the battery runs down ----
function luckArt(t, th) {
  const lv = lerp(0.82, 0.16, cub(k01(t, ws(7), ws(10) + 0.35 - ws(7))));
  popIn(t, T.luck + 0.1, () => battery(lv, t), 0, 150, 0.55, -0.03);
  [[-190, -170, 5, -1], [150, -200, 3, 1]].forEach(([x, y, n, d], i) => { const t0 = T.luck + 0.05 + i * 0.12, kk = pop(t - t0, 11, 0.5); if (kk <= 0) return;
    const spin = (1 - cub(k01(t, t0, 0.7))) * 2.4 * d; at(x, y - (1 - cl(kk)) * 200, cl(kk, 0, 1.15), cl(kk * 2), () => die(n, 190), spin + (i ? 0.2 : -0.14)); });
}
// ---- «جوابش سخته» ----
function hardArt(t, th) { [[-290, -20, 260, -0.2], [0, 60, 380, 0.05], [290, -30, 260, 0.22]].forEach(([x, y, s, r], i) => popIn(t, T.hard + 0.05 + i * 0.09, () => txt('؟', 0, 0, s, i === 1 ? VIO : INKD), x, y, 0.5, r)); }
// ---- «سود شانسی و سود استراتژی توی حساب یه شکلن»: two account cards, the same ----
const MINI = [[-130, 70], [-80, 40], [-40, 55], [10, 0], [50, 15], [130, -70]];
function sameArt(t, th) {
  const same = cub(k01(t, ws(21) - 0.05, 0.3));
  [['شانس', 215, ws(15), AMB, INKD], ['استراتژی', -215, ws(18), VIO, WHITE]].forEach(([name, x, t0, bg, fg], i) => {
    const kk = pop(t - (T.same + 0.05 + i * 0.1), 12, 0.6); if (kk <= 0) return;
    at(x, 40, lerp(0.85, 1, cl(kk)), cl(kk), () => {
      card(-195, -230, 390, 460, WHITE, 'rgba(26,20,48,0.1)', 36);
      txt('حساب', 0, -170, 38, MP, { w: 800 });
      rrect(-160, -120, 320, 220, 22, '#ECF9F3'); trace(MINI, 1, G, 12); circle(130, -70, 14, G);
      chip('سود', 0, 160, 46, WHITE, G);
    });
    popIn(t, t0, () => { cv.save(); cv.globalAlpha *= 1 - same; chip(name, 0, 0, 46, fg, bg); cv.restore(); if (same > 0) at(0, 0, lerp(1.3, 1, same), same, () => chip('؟', 0, 0, 52, INKD, LIME)); }, x, -250, 0.55, i ? 0.04 : -0.04);
  });
  popIn(t, ws(21), () => { shadowed(() => circle(0, 0, 70, LIME), 30, 10, 0.4); txt('=', 0, 4, 96, INKD, { dir: 'ltr' }); }, 0, 40, 0.5);
}
// ---- «هر دو سبزن»: on a full green block ----
function greenArt(t, th) { [[150, ws(23)], [-150, ws(24)]].forEach(([x, t0], i) => popIn(t, i ? Math.min(t0, ws(23) + 0.12) : T.green + 0.02, () => { shadowed(() => circle(0, 0, 130, WHITE), 40, 14, 0.25); upArrow(72, G); }, x, 40, 0.5, i ? -0.05 : 0.05)); }
// ---- «با ده تا معامله‌ی خوب هم معلوم نمی‌شه»: ten wins, and still a question ----
function tenArt(t, th) {
  for (let i = 0; i < 10; i++) { const c = i % 5, r = Math.floor(i / 5), x = 308 - c * 154, y = -90 + r * 164, kk = pop(t - (ws(27) - 0.1 + i * 0.07), 14, 0.55); if (kk <= 0) continue;
    at(x, y, cl(kk, 0, 1.15), cl(kk), () => { shadowed(() => rrect(-65, -65, 130, 130, 30, G), 24, 8, 0.2); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 16; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-28, 2); cv.lineTo(-8, 24); cv.lineTo(30, -22); cv.stroke(); cv.restore(); }); }
  popIn(t, ws(31), () => { shadowed(() => circle(0, 0, 150, INKD), 50, 18, 0.45); txt('؟', 0, 10, 200, LIME); }, 0, -10, 0.45, 0.08);
}
// ---- «توی ده تا، شانس و مهارت از هم جدا نمی‌شن»: the first 10 trades of both, tangled ----
function tangleArt(t, th) {
  const k = pop(t - T.tangle - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-430, -300, 860, 600, PLATE, 'rgba(255,255,255,0.12)', 36);
    const X = (i) => 350 - (10 - i) * 70, Y = (v) => 170 - (v + 2) * 38;
    txt('۱۰ معامله‌ی اول', 380, -245, 34, WHITE, { w: 800, align: 'right' });
    line(-380, Y(0), 380, Y(0), 'rgba(255,255,255,0.22)', 3, [10, 12]);
    for (let i = 1; i <= 10; i++) { circle(X(i), 232, 5, 'rgba(255,255,255,0.3)'); }
    const n = 10 * cub(k01(t, ws(34) - 0.1, ws(41) - ws(34) + 0.2));
    const eL = glowLine(simPts(SIM_L, n, X, Y), AMB, 12), eS = glowLine(simPts(SIM_S, n, X, Y), LIME, 12);
    if (eL) circle(eL[0], eL[1], 13, AMB); if (eS) circle(eS[0], eS[1], 13, LIME);
    popIn(t, ws(36), () => chip('شانس', 0, 0, 36, INKD, AMB), -280, -245, 0.55);
    popIn(t, ws(38), () => chip('مهارت', 0, 0, 36, INKD, LIME), -120, -245, 0.55);
    popIn(t, ws(41), () => { shadowed(() => circle(0, 0, 62, WHITE), 30, 10, 0.4); txt('≈', 0, 2, 84, INKD, { dir: 'ltr' }); }, -250, -40, 0.5, -0.06);
    note('شبیه‌سازی نمونه', 262, MD);
  });
}
// ---- «فرقشون وقتی پیدا می‌شه که تعداد بره بالا»: 10 → 200, and a grid of 200 trades filling ----
function diffArt(t, th) {
  const k = pop(t - T.diff - 0.05, 12, 0.6); if (k <= 0) return;
  const kn = cub(k01(t, ws(48) - 0.05, ws(50) + 0.45 - ws(48))), n = Math.round(lerp(10, 200, kn));
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    shadowed(() => rrect(-380, -340, 760, 250, 50, INKD), 40, 14, 0.35);
    txt('تعداد معامله', 330, -280, 34, MD, { w: 800, align: 'right' });
    txt(fa(n), -40, -195, 170, LIME, { dir: 'ltr' });
    if (kn > 0 && kn < 1) { cv.save(); cv.globalAlpha *= 0.9; at(-300, -200, 1, 1, () => upArrow(34, LIME)); cv.restore(); }
    for (let i = 0; i < 200; i++) { const c = i % 20, r = Math.floor(i / 20), x = 361 - c * 38, y = -40 + r * 38; rrect(x - 15, y - 15, 30, 30, 8, i < 10 ? G : i < n ? VIO : 'rgba(16,12,28,0.12)'); }
  });
}
// ---- «توی دویست تا معامله، شانس کم میاره و استراتژی می‌مونه»: the same two over 200 trades ----
const X2 = (i) => 380 - (200 - i) * 3.8, Y2 = (v) => 240 - ((v + 16) / 96) * 500;
function twoArt(t, th) {
  const k = pop(t - T.two - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-440, -330, 880, 660, PLATE, 'rgba(255,255,255,0.12)', 36);
    rrect(X2(0), -280, X2(10) - X2(0), 540, 8, 'rgba(255,255,255,0.07)');
    line(-390, Y2(0), 390, Y2(0), 'rgba(255,255,255,0.22)', 3, [10, 12]);
    txt('۱۰', X2(5), 292, 26, MD, { w: 800 }); txt('۲۰۰ معامله', 380, 292, 26, MD, { w: 800, align: 'right' });
    const x = k01(t, T.two + 0.15, ws(59) + 0.2 - T.two), n = 200 * (1 - (1 - x) * (1 - x));
    const eL = glowLine(simPts(SIM_L, Math.min(200, n), X2, Y2), AMB, 9), eS = glowLine(simPts(SIM_S, Math.min(200, n), X2, Y2), LIME, 9);
    if (eL) circle(eL[0], eL[1], 12, AMB); if (eS) circle(eS[0], eS[1], 12, LIME);
    popIn(t, ws(54), () => chip('شانس', 0, 0, 40, INKD, AMB), 250, 165, 0.55, 0.03);
    popIn(t, ws(55), () => { shadowed(() => circle(0, 0, 40, R), 20, 8, 0.4); cv.save(); cv.rotate(Math.PI); upArrow(22, WHITE); cv.restore(); }, 110, 165, 0.5);
    popIn(t, ws(58), () => { cv.save(); cv.shadowColor = rgba(LIME, 0.6); cv.shadowBlur = 30; chip('استراتژی', 0, 0, 46, INKD, LIME); cv.restore(); }, 120, -255, 0.5, -0.03);
    note('شبیه‌سازی نمونه', 292, MD);
  });
}
// ---- «ولی توی بازار زنده، دویست تا معامله یعنی چند ماه وقت و پول واقعی» ----
function liveArt(t, th) {
  popIn(t, ws(62), () => {
    shadowed(() => rrect(-410, -95, 820, 190, 44, INKD), 40, 14, 0.3);
    circle(350, -40, 13, R); circle(350, -40, 13 + ((t * 1.6) % 1) * 20, null, rgba(R, 1 - ((t * 1.6) % 1)), 4); txt('زنده', 320, -37, 40, WHITE, { align: 'right' });
    const kn = pop(t - ws(64) + 0.05, 13, 0.6); if (kn > 0) { cv.save(); cv.globalAlpha *= cl(kn); txt('معامله‌ی ۳ از ۲۰۰', -370, -37, 44, LIME, { align: 'left' }); cv.restore(); }
    rrect(-370, 30, 740, 26, 13, '#2A2340'); rrect(370 - 740 * 0.015 - 6, 30, 740 * 0.015 + 6 + Math.sin(t * 3) * 2, 26, 13, LIME);
  }, 0, -270, 0.55, -0.015);
  ['ماه ۱', 'ماه ۲', 'ماه ۳', '…'].forEach((s, i) => { const kk = pop(t - (ws(67) - 0.08 + i * 0.13), 13, 0.55); if (kk <= 0) return;
    at(315 - i * 210, -20 + (1 - cl(kk)) * -60, cl(kk, 0, 1.12), cl(kk), () => { card(-92, -105, 184, 210, WHITE, 'rgba(26,20,48,0.1)', 26); cv.save(); cv.beginPath(); cv.roundRect(-92, -105, 184, 210, 26); cv.clip(); rrect(-92, -105, 184, 62, 0, VIO); cv.restore();
      circle(-44, -105, 9, INKP); circle(44, -105, 9, INKP); txt(s, 0, 34, s === '…' ? 80 : 46, INKP); }, (i - 1.5) * 0.035); });
  popIn(t, ws(71), () => {
    [[-26, 26, -0.07], [0, 0, 0.02], [22, -26, 0.09]].forEach(([dx, dy, r]) => at(dx, dy, 1, 1, () => { shadowed(() => rrect(-170, -84, 340, 168, 22, G), 20, 8, 0.25); rrect(-150, -64, 300, 128, 12, null, 'rgba(255,255,255,0.55)', 4); circle(0, 0, 44, 'rgba(255,255,255,0.9)'); txt('$', 0, 4, 60, G, { dir: 'ltr' }); }, r));
  }, -120, 260, 0.5);
  popIn(t, ws(72), () => chip('واقعی', 0, 0, 54, WHITE, R), 240, 270, 0.5, -0.06);
}
// ---- «توی بک‌تست‌لب همون دویست تا رو روی بازار واقعیِ گذشته می‌گیری» (the real gold replay) ----
// crops, in the 1440×900 capture: RR the chart's right part, RS the bottom bar's result and balance, QB the balance
const RR = [440, 215, 750, 560], RS = [888, 857, 300, 44], QB = [1058, 861, 128, 36], QPOS = [800, 340, 328, 284];
const A_KEYS = Array.from({ length: 6 }, (_, i) => 'a' + i), C_KEYS = Array.from({ length: 16 }, (_, i) => 'c' + String(i).padStart(2, '0'));
const SW = 920, SX = -460, SY = -360;
function labArt(t, th) {
  const k = pop(t - T.lab - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const plan = t >= ws(79), key = plan ? (t >= ws(83) ? 'cl' : 'cp') : FLIP(t, T.lab + 0.1, ws(79), A_KEYS);
    const bump = plan ? 1 + 0.03 * (1 - cub(k01(t, ws(79), 0.3))) : 1; let h = 0;
    at(0, 0, bump, 1, () => { h = shot(key, RR, SX, SY, SW); if (plan && t < ws(83)) ringIn(RR, QPOS, SX, SY, SW, cub(k01(t, ws(80), 0.35)), LIME); });
    if (IMG.icon) popIn(t, ws(74), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -55, -55, 110, 110); }, SX + SW, SY, 0.5);
    popIn(t, ws(80), () => chip('ورود · حد ضرر · حد سود', 0, 0, 38, INKD, LIME), -200, SY + 64, 0.55, -0.03);
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', SY + h + 54, 'rgba(255,255,255,0.8)');
  });
}
// ---- «بدون ریسک، و می‌بینی حسابت آخرش کجاست»: the trade plays to its target; the balance after it ----
function noriskArt(t, th) {
  const h = shot(FLIP(t, T.norisk - 0.05, ws(87) + 0.1, C_KEYS), RR, SX, SY, SW);
  if (IMG.icon) at(SX + SW, SY, 1, 1, () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -55, -55, 110, 110); });
  const ks = pop(t - ws(88) + 0.08, 12, 0.55);
  if (ks > 0) at(0, 190, cl(ks, 0, 1.12), cl(ks), () => { const w = 980, x = -490, y = -72, hh = shot('c15', RS, x, y, w); ringIn(RS, QB, x, y, w, cub(k01(t, ws(89), 0.3)), LIME); }, -0.02);
  note('صفحه‌ی واقعی بک‌تست‌لب · معامله‌ی نمونه روی طلا', SY + h + 54, '#3E4D12');
}
// ---- «اگه استراتژیه، خیالت راحت می‌شه» ----
function ifsArt(t, th) {
  const k = pop(t - T.ifs - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-430, -260, 860, 520, PLATE, 'rgba(255,255,255,0.12)', 36);
    const X = (i) => 370 - (200 - i) * 3.7, Y = (v) => 190 - (v / 72) * 380;
    line(-380, Y(0), 380, Y(0), 'rgba(255,255,255,0.22)', 3, [10, 12]);
    const e = glowLine(simPts(SIM_S, 200 * cub(k01(t, T.ifs + 0.05, 1.1)), X, Y), LIME, 10); if (e) circle(e[0], e[1], 13, LIME);
    popIn(t, ws(92), () => chip('استراتژی', 0, 0, 42, INKD, LIME), 250, 120, 0.55, 0.03);
  });
  check(-290, -230, 100, G, pop(t - ws(93) + 0.05, 12, 0.5));
}
// ---- «اگه شانس بوده، بهتره الان بفهمی»: the lucky trader's 10 trades, a «الان» pin, and what comes after ----
function iflArt(t, th) {
  const k = pop(t - T.ifl - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-430, -270, 860, 540, WHITE, 'rgba(26,20,48,0.1)', 36);
    const X = (i) => 370 - (100 - i) * 7.4, Y = (v) => 70 - v * 17;
    line(-380, Y(0), 380, Y(0), 'rgba(26,20,48,0.18)', 3, [10, 12]);
    const kf = cub(k01(t, ws(99), 1.3)); if (kf > 0) { cv.save(); cv.globalAlpha *= 0.7; cv.setLineDash([4, 14]); trace(simPts(SIM_L, 10 + 90 * kf, X, Y).slice(10), 1, R, 8); cv.restore(); }
    const e = glowLine(simPts(SIM_L, 10 * cub(k01(t, T.ifl + 0.05, 0.5)), X, Y), AMB, 11, 8); if (e) circle(e[0], e[1], 14, AMB);
    popIn(t, ws(97), () => at(0, 0, 0.62, 1, () => die(5, 190, INKD, WHITE)), 300, -165, 0.5, -0.12);
    popIn(t, ws(97) + 0.1, () => at(0, 0, 0.62, 1, () => die(3, 190, INKD, WHITE)), 170, -190, 0.5, 0.16);
    const kp = pop(t - ws(100) + 0.05, 13, 0.5); if (kp > 0) { const px = X(10), py = Y(SIM_L[10]); line(px, py - 24, px, py - 24 - 120 * cl(kp), VIO, 6); at(px, py - 184, cl(kp, 0, 1.2), cl(kp), () => { cv.save(); cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 30; chip('الان', 0, 0, 58, WHITE, VIO); cv.restore(); }); circle(px, py, 22 * cl(kp), null, VIO, 6); }
    note('شبیه‌سازی نمونه', 232, MP);
  });
}
// ---- «نه وقتی که تموم شد»: the battery, empty ----
function lateArt(t, th) {
  const k = pop(t - T.late - 0.02, 14, 0.5); if (k <= 0) return;
  const lv = lerp(0.2, 0.0, cub(k01(t, T.late, ws(105) - T.late)));
  at(0, 20, cl(k, 0, 1.12), cl(k), () => battery(lv, t, { body: WHITE, well: '#2A0D14', label: WHITE }), -0.04 + (t > ws(105) ? Math.sin(t * 46) * 0.012 : 0));
  popIn(t, ws(105), () => { shadowed(() => circle(0, 0, 76, INKD), 30, 10, 0.4); line(-30, -30, 30, 30, WHITE, 16); line(30, -30, -30, 30, WHITE, 16); }, 250, -150, 0.45, 0.1);
}
// ---- «شروعش رایگانه؛ لینک توی بیو» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(108), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -20, 0.55, -0.03);
  popIn(t, ws(109), () => { shadowed(() => rrect(-270, -72, 540, 144, 72, WHITE)); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1270, 1.3], groups: [
      { at: 0, lines: [L_(300, 140, WHITE, [['سود', 0, { hl: G, ht: WHITE }], ['می‌کنی', 1]]), L_(470, 110, WHITE, [['چون', 2], ['استراتژی', 3, { c: LIME }]]), L_(610, 110, WHITE, [['داری،', 4]])] }] },
    { k: 'luck', bg: VIO, wipe: 'iris', art: 'luck', kpos: [CX, 1300, 1.25], groups: [
      { at: 5, lines: [L_(270, 110, WHITE, [['یا', 5], ['چون', 6], ['هنوز', 7]]), L_(440, 170, WHITE, [['شانست', 8, { hl: LIME, ht: INKD }]]), L_(620, 130, WHITE, [['تموم', 9], ['نشده؟', 10]])] }] },
    { k: 'hard', bg: LIME, wipe: 'cut', art: 'hard', kpos: [CX, 1220, 1], groups: [
      { at: 11, lines: [L_(340, 170, INKD, [['جوابش', 11]]), L_(560, 190, INKD, [['سخته،', 12, { hl: INKD, ht: LIME }]])] }] },
    { k: 'same', bg: INKD, wipe: 'up', art: 'same', kpos: [CX, 1310, 1.14], groups: [
      { at: 13, lines: [L_(280, 110, WHITE, [['چون', 13], ['سودِ', 14, { c: G }], ['شانسی', 15, { c: AMB }]]), L_(430, 110, WHITE, [['و', 16], ['سودِ', 17, { c: G }], ['استراتژی', 18, { c: '#A48CFF' }]])] },
      { at: 19, lines: [L_(300, 120, WHITE, [['توی', 19], ['حساب', 20]]), L_(480, 170, WHITE, [['یه شکلن.', [21, 22], { hl: LIME, ht: INKD }]])] }] },
    { k: 'green', bg: G, wipe: 'cut', art: 'green', kpos: [CX, 1280, 1.4], groups: [
      { at: 23, lines: [L_(340, 170, WHITE, [['هر', 23], ['دو', 24]]), L_(570, 220, WHITE, [['سبزن.', 25, { hl: WHITE, ht: G }]])] }] },
    { k: 'ten', bg: PAPER, wipe: 'right', art: 'ten', kpos: [CX, 1290, 1.18], groups: [
      { at: 26, lines: [L_(270, 110, INKP, [['با', 26], ['۱۰', 27, { hl: VIO, ht: WHITE }], ['تا', 28], ['معامله‌ی', 29]]), L_(420, 110, INKP, [['خوب', 30, { c: G }], ['هم', 30]]), L_(590, 150, INKP, [['معلوم', 31], ['نمی‌شه.', 32, { hl: R, ht: WHITE }]])] }] },
    { k: 'tangle', bg: VIO, wipe: 'iris', art: 'tangle', kpos: [CX, 1320, 1.1], groups: [
      { at: 33, lines: [L_(260, 120, WHITE, [['توی', 33], ['۱۰', 34, { c: LIME }], ['تا،', 35]]), L_(410, 120, WHITE, [['شانس', 36, { c: AMB }], ['و', 37], ['مهارت', 38, { c: LIME }]]), L_(580, 120, WHITE, [['از هم', [39, 40]], ['جدا', 41], ['نمی‌شن.', 42, { hl: INKD, ht: WHITE }]])] }] },
    { k: 'diff', bg: LIME, wipe: 'up', art: 'diff', kpos: [CX, 1340, 1.16], groups: [
      { at: 43, lines: [L_(280, 130, INKD, [['فرقشون', 43, { hl: INKD, ht: LIME }], ['وقتی', 44]]), L_(430, 120, INKD, [['پیدا', 45], ['می‌شه', 46]]), L_(590, 130, INKD, [['که', 47], ['تعداد', 48, { c: VIO }], ['بره', 49], ['بالا.', 50]])] }] },
    { k: 'two', bg: INKD, wipe: 'left', art: 'two', kpos: [CX, 1320, 1.1], groups: [
      { at: 51, lines: [L_(300, 120, WHITE, [['توی', 51], ['۲۰۰', 52, { hl: VIO, ht: WHITE }], ['تا', 52]]), L_(460, 130, WHITE, [['معامله،', 53]])] },
      { at: 54, lines: [L_(300, 120, WHITE, [['شانس', 54, { c: AMB }]]), L_(470, 150, WHITE, [['کم', 55, { hl: R, ht: WHITE }], ['میاره', 56]])] },
      { at: 57, lines: [L_(300, 120, WHITE, [['و', 57], ['استراتژی', 58, { c: LIME }]]), L_(470, 160, WHITE, [['می‌مونه.', 59, { hl: LIME, ht: INKD }]])] }] },
    { k: 'live', bg: PAPER, wipe: 'up', art: 'live', kpos: [CX, 1320, 1.1], groups: [
      { at: 60, lines: [L_(280, 110, INKP, [['ولی', 60], ['توی', 61], ['بازار', 62]]), L_(430, 150, INKP, [['زنده،', 63, { hl: R, ht: WHITE }]]), L_(600, 110, INKP, [['۲۰۰', 64, { c: VIO }], ['تا', 64], ['معامله', 65]])] },
      { at: 66, lines: [L_(270, 110, INKP, [['یعنی', 66]]), L_(430, 140, INKP, [['چند', 67], ['ماه', 68, { hl: VIO, ht: WHITE }], ['وقت', 69]]), L_(600, 130, INKP, [['و', 70], ['پولِ', 71, { c: G }], ['واقعی.', 72, { c: R }]])] }] },
    { k: 'lab', bg: VIO, wipe: 'iris', art: 'lab', kpos: [CX, 1310, 1], groups: [
      { at: 73, lines: [L_(250, 110, WHITE, [['توی', 73], ['بک‌تست‌لب', [74, 75], { hl: WHITE, ht: VIO }]]), L_(400, 120, WHITE, [['همون', 76], ['۲۰۰', 77, { c: LIME }], ['تا', 77], ['رو', 78]])] },
      { at: 79, lines: [L_(250, 100, WHITE, [['روی', 79], ['بازارِ', 80], ['واقعیِ', 81, { c: LIME }]]), L_(400, 130, WHITE, [['گذشته', 82, { hl: LIME, ht: INKD }], ['می‌گیری،', 83]])] }] },
    { k: 'norisk', bg: LIME, wipe: 'right', art: 'norisk', kpos: [CX, 1310, 1], groups: [
      { at: 84, lines: [L_(320, 170, INKD, [['بدون', 84], ['ریسک،', 85, { hl: INKD, ht: LIME }]])] },
      { at: 86, lines: [L_(250, 110, INKD, [['و', 86], ['می‌بینی', 87], ['حسابت', 88, { c: VIO }]]), L_(410, 140, INKD, [['آخرش', 89], ['کجاست.', 90, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'ifs', bg: INKD, wipe: 'up', art: 'ifs', kpos: [CX, 1310, 1.14], groups: [
      { at: 91, lines: [L_(280, 110, WHITE, [['اگه', 91], ['استراتژیه،', 92, { c: LIME }]]), L_(440, 130, WHITE, [['خیالت', 93]]), L_(610, 150, WHITE, [['راحت', 94, { hl: G, ht: WHITE }], ['می‌شه.', 95]])] }] },
    { k: 'ifl', bg: PAPER, wipe: 'left', art: 'ifl', kpos: [CX, 1320, 1.14], groups: [
      { at: 96, lines: [L_(280, 120, INKP, [['اگه', 96], ['شانس', 97, { hl: AMB, ht: INKD }], ['بوده،', 98]]), L_(440, 120, INKP, [['بهتره', 99]]), L_(610, 160, INKP, [['الان', 100, { hl: VIO, ht: WHITE }], ['بفهمی،', 101]])] }] },
    { k: 'late', bg: R, wipe: 'cut', art: 'late', kpos: [CX, 1260, 1.5], groups: [
      { at: 102, lines: [L_(320, 130, WHITE, [['نه', 102], ['وقتی', 103], ['که', 104]]), L_(530, 200, WHITE, [['تموم', 105, { hl: INKD, ht: WHITE }], ['شد.', 106]])] }] },
    { k: 'cta', bg: LIME, wipe: 'up', art: 'cta', kpos: [CX, 1270, 1.1], groups: [
      { at: 107, lines: [L_(320, 130, INKD, [['شروعش', 107], ['رایگانه؛', 108, { hl: VIO, ht: WHITE }]]), L_(470, 110, INKD, [['لینک', 109], ['توی', 110], ['بیو.', 111]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, luck: luckArt, hard: hardArt, same: sameArt, green: greenArt, ten: tenArt, tangle: tangleArt, diff: diffArt, two: twoArt, live: liveArt,
    lab: labArt, norisk: noriskArt, ifs: ifsArt, ifl: iflArt, late: lateArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(12), 8], [ws(25), 10], [ws(31), 8], [ws(59), 8], [ws(105), 14]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('سود می‌کنی چون', CX, 250, 104, WHITE);
    { const a = measure('استراتژی', 150); cv.save(); cv.translate(CX, 430); cv.rotate(-0.025); rrect(-a / 2 - 30, -98, a + 60, 196, 24, LIME); cv.restore(); txt('استراتژی', CX, 430, 150, INKD); }
    txt('داری، یا', CX, 620, 110, WHITE);
    { const a = measure('شانس؟', 170); cv.save(); cv.translate(CX, 810); cv.rotate(0.02); rrect(-a / 2 - 30, -108, a + 60, 216, 24, VIO); cv.restore(); txt('شانس؟', CX, 810, 170, WHITE); }
    at(CX + 210, 1230, 1.05, 1, () => rules(9, 0, THEME.ink));
    at(CX - 330, 1120, 1, 1, () => die(5, 210), -0.14); at(CX - 170, 1300, 1, 1, () => die(3, 210), 0.2);
    at(CX, 1590, 0.9, 1, () => battery(0.18, 0.1), -0.03);
    at(CX, 1790, 1, 1, () => chip('با چند تا معامله معلوم می‌شه؟', 0, 0, 48, INKD, LIME));
  },
});
