// k14 · the full-frame cut of k13's voice («سود می‌کنی چون استراتژی داری، یا چون هنوز شانست تموم نشده؟»), on the u-kit
// kinetic engine. It keeps what the reels past 10k views share (k1, q2): colour blocks that change every 2–3 s, huge
// words landing as they are spoken, fast speech (×1.22), the brand late. What it changes from k13:
//   - the hook is one poster that is whole on the first frame: «استراتژی» on a lime panel, «یا», «شانست» on an amber
//     panel that lights up when it is said (the dice land on it and its battery runs down);
//   - every picture fills the frame (the art draws on the whole canvas, not in a box under the words): «جوابش سخته»,
//     «هر دو سبزن» and «تموم شد» are full-frame type, the two account cards slide into one on «یه شکلن», the count
//     10 → 200 is a huge readout over a grid of 200 trades, the charts and the real screens run edge to edge;
//   - a thin bar at the top shows how far the reel has run.
// The simulation (a sample, said on screen) and the real gold replay are k13's; see ../k13/story.js and ../k13/caption.md.
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


// ================= the full-frame cut: every art draws on the whole frame (kpos [0, 0, 1]) =================
/** A word that is on screen before it is said (faint), and lands when it is spoken. */
function ghost(t, s, x, y, size, col, wi, o = {}) { const t0 = ws(wi) - 0.05, said = t >= t0, k = pop(t - t0, 20, 0.5); at(x, y, said ? lerp(0.84, 1, cl(k, 0, 1.3)) : 1, said ? 1 : o.ghost ?? 0.35, () => txt(s, 0, 0, size, col)); }
function tick(x, y, r, bg, fg, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, bg); cv.save(); cv.strokeStyle = fg; cv.lineWidth = r * 0.26; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
const bump = (t, t0, amp = 0.04) => (t >= t0 ? 1 + amp * Math.exp(-(t - t0) * 7) : 1);

// ---- the hook, one poster readable on the first frame: «استراتژی» on lime, «یا», «شانست» on amber ----
// the strategy panel is lit from the start; the luck panel lights up as «یا چون هنوز شانست تموم نشده؟» is said, the dice
// land on it and its battery runs down
function duelArt(t) {
  const lit = cub(k01(t, T.luck - 0.05, 0.3)), lv = lerp(0.82, 0.14, cub(k01(t, ws(7), ws(10) + 0.35 - ws(7))));
  at(CX, 700, bump(t, ws(3) - 0.05), 1, () => {
    shadowed(() => rrect(-490, -255, 980, 510, 60, LIME), 70, 24, 0.45);
    ghost(t, 'استراتژی', 0, -40, 220, INKD, 3, { ghost: 0.92 }); ghost(t, 'داری،', 0, 150, 100, INKD, 4, { ghost: 0.5 });
    [0, 1, 2].forEach((i) => tick(-400 + i * 84, -185, 32, INKD, LIME, pop(t - (0.35 + i * 0.1), 13, 0.55)));
  }, -0.014);
  at(CX, 1285, bump(t, ws(8) - 0.05), 1, () => {
    cv.save(); cv.globalAlpha *= lerp(0.42, 1, lit); shadowed(() => rrect(-490, -265, 980, 530, 60, AMB), 70, 24, 0.45); cv.restore();
    ghost(t, 'چون هنوز', 0, -150, 88, INKD, 6, { ghost: 0.5 }); ghost(t, 'شانست', 0, 15, 230, INKD, 8, { ghost: 0.85 }); ghost(t, 'تموم نشده؟', 0, 185, 108, INKD, 9, { ghost: 0.5 });
    popIn(t, T.luck + 0.15, () => at(0, 0, 0.4, 1, () => battery(lv, t)), 345, -190, 0.55, 0.04);
  }, 0.012);
  [[150, 1010, 5, -1, 180, -0.2], [935, 1500, 3, 1, 160, 0.24]].forEach(([x, y, n, d, sz, r], i) => { const t0 = T.luck + 0.02 + i * 0.12, kk = pop(t - t0, 11, 0.5); if (kk <= 0) return;
    at(x, y - (1 - cl(kk)) * 260, cl(kk, 0, 1.15), cl(kk * 2), () => die(n, sz), (1 - cub(k01(t, t0, 0.7))) * 2.4 * d + r); });
  at(CX, 985, bump(t, ws(5) - 0.05, 0.25), 1, () => { shadowed(() => circle(0, 0, 78, WHITE), 30, 10, 0.4); txt('یا', 0, 2, 84, INKD); });
}
// ---- «جوابش سخته» ----
function hardArt(t) { [[170, 420, 260, -0.25], [905, 1500, 320, 0.2], [900, 400, 170, 0.3], [160, 1440, 190, -0.12]].forEach(([x, y, s, r], i) => popIn(t, T.hard + 0.03 + i * 0.07, () => txt('؟', 0, 0, s, i % 2 ? VIO : INKD), x, y, 0.5, r)); }
// ---- «سود شانسی و سود استراتژی توی حساب یه شکلن»: two accounts that slide into one ----
const MINI = [[-150, 90], [-90, 50], [-40, 70], [20, -5], [70, 20], [150, -90]];
function sameArt(t) {
  const same = cub(k01(t, ws(21) - 0.05, 0.45));
  [['شانس', 1, ws(15), AMB, INKD], ['استراتژی', -1, ws(18), VIO, WHITE]].forEach(([name, side, t0, bg, fg], i) => {
    const kk = pop(t - (T.same + 0.03 + i * 0.1), 12, 0.6); if (kk <= 0) return; const x = CX + side * 252 * (1 - same);
    at(x, 1150, lerp(0.85, 1, cl(kk)), cl(kk), () => {
      card(-230, -350, 460, 700, WHITE, 'rgba(26,20,48,0.1)', 44);
      txt('حساب', 0, -275, 44, MP, { w: 800 });
      rrect(-190, -215, 380, 320, 28, '#ECF9F3'); at(0, -55, 1.05, 1, () => { trace(MINI, 1, G, 14); circle(150, -90, 17, G); });
      at(0, 215, 1, 1, () => { rrect(-150, -62, 300, 124, 62, G); upArrow(30, WHITE); }); cv.save(); cv.fillStyle = WHITE; cv.restore();
    }, side * 0.02 * (1 - same));
    popIn(t, t0, () => { cv.save(); cv.globalAlpha *= 1 - same; chip(name, 0, 0, 54, fg, bg); cv.restore(); }, x, 760, 0.55, side * -0.04);
  });
  popIn(t, ws(21) + 0.2, () => { cv.save(); cv.shadowColor = rgba(LIME, 0.6); cv.shadowBlur = 40; chip('شانس یا استراتژی؟', 0, 0, 54, INKD, LIME); cv.restore(); }, CX, 760, 0.5, -0.02);
}
// ---- «هر دو سبزن» ----
function greenArt(t) { [1, -1].forEach((sd, i) => popIn(t, T.green + 0.02 + i * 0.12, () => { shadowed(() => circle(0, 0, 130, WHITE), 40, 14, 0.25); upArrow(72, G); }, CX + sd * 170, 1440, 0.5, sd * 0.05)); }
// ---- «با ده تا معامله‌ی خوب هم معلوم نمی‌شه»: ten wins, and still a question ----
function tenArt(t) {
  for (let i = 0; i < 10; i++) { const c = i % 5, r = Math.floor(i / 5), x = CX + (2 - c) * 192, y = 1010 + r * 192, kk = pop(t - (ws(27) - 0.1 + i * 0.07), 14, 0.55); if (kk <= 0) continue;
    at(x, y, cl(kk, 0, 1.15), cl(kk), () => { shadowed(() => rrect(-84, -84, 168, 168, 40, G), 24, 8, 0.2); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 20; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-36, 3); cv.lineTo(-10, 31); cv.lineTo(39, -28); cv.stroke(); cv.restore(); }); }
  popIn(t, ws(31), () => { shadowed(() => circle(0, 0, 200, INKD), 60, 20, 0.5); txt('؟', 0, 14, 270, LIME); }, CX, 1106, 0.45, 0.08);
}
// ---- «توی ده تا، شانس و مهارت از هم جدا نمی‌شن»: the first 10 trades of both, tangled ----
function tangleArt(t) {
  const k = pop(t - T.tangle - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 1140, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-490, -390, 980, 780, PLATE, 'rgba(255,255,255,0.12)', 44);
    const X = (i) => 400 - (10 - i) * 80, Y = (v) => 190 - (v + 2) * 62;
    txt('۱۰ معامله‌ی اول', 430, -320, 40, WHITE, { w: 800, align: 'right' });
    line(-440, Y(0), 440, Y(0), 'rgba(255,255,255,0.22)', 3, [10, 12]);
    for (let i = 1; i <= 10; i++) circle(X(i), 300, 6, 'rgba(255,255,255,0.3)');
    const n = 10 * cub(k01(t, ws(34) - 0.1, ws(41) - ws(34) + 0.2));
    const eL = glowLine(simPts(SIM_L, n, X, Y), AMB, 15), eS = glowLine(simPts(SIM_S, n, X, Y), LIME, 15);
    if (eL) circle(eL[0], eL[1], 16, AMB); if (eS) circle(eS[0], eS[1], 16, LIME);
    popIn(t, ws(36), () => chip('شانس', 0, 0, 42, INKD, AMB), -350, -320, 0.55);
    popIn(t, ws(38), () => chip('مهارت', 0, 0, 42, INKD, LIME), -170, -320, 0.55);
    popIn(t, ws(41), () => { shadowed(() => circle(0, 0, 76, WHITE), 30, 10, 0.4); txt('≈', 0, 2, 100, INKD, { dir: 'ltr' }); }, -300, -110, 0.5, -0.06);
    note('شبیه‌سازی نمونه', 345, MD);
  });
}
// ---- «فرقشون وقتی پیدا می‌شه که تعداد بره بالا»: 10 → 200, and a grid of 200 trades filling ----
function diffArt(t) {
  const k = pop(t - T.diff - 0.05, 12, 0.6); if (k <= 0) return;
  const kn = cub(k01(t, ws(48) - 0.05, ws(50) + 0.45 - ws(48))), n = Math.round(lerp(10, 200, kn));
  at(CX, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    at(0, 900, bump(t, ws(50) + 0.4, 0.06), 1, () => { shadowed(() => rrect(-440, -170, 880, 340, 64, INKD), 50, 18, 0.4);
      txt('تعداد معامله', 390, -105, 40, MD, { w: 800, align: 'right' }); txt(fa(n), -30, 30, 250, LIME, { dir: 'ltr' });
      if (kn > 0 && kn < 1) at(-350, 20, 1, 0.9, () => upArrow(44, LIME)); });
    for (let i = 0; i < 200; i++) { const c = i % 20, r = Math.floor(i / 20), x = 446.5 - c * 47, y = 1150 + r * 47; rrect(x - 19, y - 19, 38, 38, 10, i < 10 ? G : i < n ? VIO : 'rgba(16,12,28,0.12)'); }
  });
}
// ---- «توی دویست تا معامله، شانس کم میاره و استراتژی می‌مونه»: the same two over 200 trades ----
const X2 = (i) => 440 - (200 - i) * 4.4, Y2 = (v) => 290 - ((v + 16) / 96) * 640;
function twoArt(t) {
  const k = pop(t - T.two - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 1130, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-500, -430, 1000, 860, PLATE, 'rgba(255,255,255,0.12)', 44);
    rrect(X2(0), -380, X2(10) - X2(0), 700, 8, 'rgba(255,255,255,0.07)');
    line(-450, Y2(0), 450, Y2(0), 'rgba(255,255,255,0.22)', 3, [10, 12]);
    txt('۱۰', X2(5), 356, 30, MD, { w: 800 }); txt('۲۰۰ معامله', 440, 356, 30, MD, { w: 800, align: 'right' });
    const x = k01(t, T.two + 0.15, ws(59) + 0.2 - T.two), n = 200 * (1 - (1 - x) * (1 - x));
    const eL = glowLine(simPts(SIM_L, Math.min(200, n), X2, Y2), AMB, 11), eS = glowLine(simPts(SIM_S, Math.min(200, n), X2, Y2), LIME, 11);
    if (eL) circle(eL[0], eL[1], 15, AMB); if (eS) circle(eS[0], eS[1], 15, LIME);
    popIn(t, ws(54), () => chip('شانس', 0, 0, 48, INKD, AMB), 290, 130, 0.55, 0.03);
    popIn(t, ws(55), () => { shadowed(() => circle(0, 0, 48, R), 20, 8, 0.4); cv.save(); cv.rotate(Math.PI); upArrow(26, WHITE); cv.restore(); }, 120, 130, 0.5);
    popIn(t, ws(58), () => { cv.save(); cv.shadowColor = rgba(LIME, 0.6); cv.shadowBlur = 30; chip('استراتژی', 0, 0, 56, INKD, LIME); cv.restore(); }, 130, -340, 0.5, -0.03);
    note('شبیه‌سازی نمونه', 356, MD);
  });
}
// ---- «ولی توی بازار زنده، دویست تا معامله یعنی چند ماه وقت و پول واقعی» ----
function liveArt(t) {
  popIn(t, ws(62), () => {
    shadowed(() => rrect(-470, -110, 940, 220, 50, INKD), 40, 14, 0.3);
    circle(405, -46, 15, R); circle(405, -46, 15 + ((t * 1.6) % 1) * 22, null, rgba(R, 1 - ((t * 1.6) % 1)), 4); txt('زنده', 372, -43, 46, WHITE, { align: 'right' });
    const kn = pop(t - ws(64) + 0.05, 13, 0.6); if (kn > 0) { cv.save(); cv.globalAlpha *= cl(kn); txt('معامله‌ی ۳ از ۲۰۰', -425, -43, 50, LIME, { align: 'left' }); cv.restore(); }
    rrect(-425, 36, 850, 30, 15, '#2A2340'); rrect(425 - 850 * 0.015 - 8, 36, 850 * 0.015 + 8 + Math.sin(t * 3) * 2, 30, 15, LIME);
  }, CX, 850, 0.55, -0.015);
  ['ماه ۱', 'ماه ۲', 'ماه ۳', '…'].forEach((s, i) => { const kk = pop(t - (ws(67) - 0.08 + i * 0.13), 13, 0.55); if (kk <= 0) return;
    at(CX + 352 - i * 235, 1130 + (1 - cl(kk)) * -60, cl(kk, 0, 1.12) * 1.14, cl(kk), () => { card(-92, -105, 184, 210, WHITE, 'rgba(26,20,48,0.1)', 26); cv.save(); cv.beginPath(); cv.roundRect(-92, -105, 184, 210, 26); cv.clip(); rrect(-92, -105, 184, 62, 0, VIO); cv.restore();
      circle(-44, -105, 9, INKP); circle(44, -105, 9, INKP); txt(s, 0, 34, s === '…' ? 80 : 46, INKP); }, (i - 1.5) * 0.035); });
  popIn(t, ws(71), () => {
    [[-26, 26, -0.07], [0, 0, 0.02], [22, -26, 0.09]].forEach(([dx, dy, r]) => at(dx, dy, 1.2, 1, () => { shadowed(() => rrect(-170, -84, 340, 168, 22, G), 20, 8, 0.25); rrect(-150, -64, 300, 128, 12, null, 'rgba(255,255,255,0.55)', 4); circle(0, 0, 44, 'rgba(255,255,255,0.9)'); txt('$', 0, 4, 60, G, { dir: 'ltr' }); }, r));
  }, CX - 140, 1440, 0.5);
  popIn(t, ws(72), () => chip('واقعی', 0, 0, 64, WHITE, R), CX + 290, 1450, 0.5, -0.06);
}
// ---- «توی بک‌تست‌لب همون دویست تا رو روی بازار واقعیِ گذشته می‌گیری» (the real gold replay) ----
// crops, in the 1440×900 capture: RR the chart's right part, RS the bottom bar's result and balance, QB the balance
const RR = [440, 215, 750, 560], RS = [888, 857, 300, 44], QB = [1058, 861, 128, 36], QPOS = [800, 340, 328, 284];
const A_KEYS = Array.from({ length: 6 }, (_, i) => 'a' + i), C_KEYS = Array.from({ length: 16 }, (_, i) => 'c' + String(i).padStart(2, '0'));
const SW = 980, SX = 50, SY = 650;
function labArt(t) {
  const k = pop(t - T.lab - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 1016, lerp(0.92, 1, cl(k)), cl(k), () => { cv.translate(-CX, -1016);
    const plan = t >= ws(79), key = plan ? (t >= ws(83) ? 'cl' : 'cp') : FLIP(t, T.lab + 0.1, ws(79), A_KEYS); let h = 0;
    at(CX, 1016, plan ? 1 + 0.03 * (1 - cub(k01(t, ws(79), 0.3))) : 1, 1, () => { cv.translate(-CX, -1016); h = shot(key, RR, SX, SY, SW); if (plan && t < ws(83)) ringIn(RR, QPOS, SX, SY, SW, cub(k01(t, ws(80), 0.35)), LIME); });
    if (IMG.icon) popIn(t, ws(74), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -60, -60, 120, 120); }, SX + SW - 20, SY, 0.5);
    popIn(t, ws(80), () => chip('ورود · حد ضرر · حد سود', 0, 0, 42, INKD, LIME), CX - 190, SY + 70, 0.55, -0.03);
    at(CX, SY + h + 60, 1, 1, () => note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', 0, 'rgba(255,255,255,0.8)'));
  });
}
// ---- «بدون ریسک، و می‌بینی حسابت آخرش کجاست»: the trade plays to its target; the balance after it ----
function noriskArt(t) {
  const h = shot(FLIP(t, T.norisk - 0.05, ws(87) + 0.1, C_KEYS), RR, SX, SY, SW);
  if (IMG.icon) at(SX + SW - 20, SY, 1, 1, () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -60, -60, 120, 120); });
  const ks = pop(t - ws(88) + 0.08, 12, 0.55);
  if (ks > 0) at(CX, 1290, cl(ks, 0, 1.12), cl(ks), () => { const w = 1010, x = -505, y = -74; shot('c15', RS, x, y, w); ringIn(RS, QB, x, y, w, cub(k01(t, ws(89), 0.3)), LIME); }, -0.02);
  at(CX, SY + h + 60, 1, 1, () => note('صفحه‌ی واقعی بک‌تست‌لب · معامله‌ی نمونه روی طلا', 0, '#3E4D12'));
}
// ---- «اگه استراتژیه، خیالت راحت می‌شه» ----
function ifsArt(t) {
  const k = pop(t - T.ifs - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 1150, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-490, -340, 980, 680, PLATE, 'rgba(255,255,255,0.12)', 44);
    const X = (i) => 420 - (200 - i) * 4.2, Y = (v) => 250 - (v / 72) * 500;
    line(-440, Y(0), 440, Y(0), 'rgba(255,255,255,0.22)', 3, [10, 12]);
    const e = glowLine(simPts(SIM_S, 200 * cub(k01(t, T.ifs + 0.05, 1.1)), X, Y), LIME, 12); if (e) circle(e[0], e[1], 16, LIME);
    popIn(t, ws(92), () => chip('استراتژی', 0, 0, 50, INKD, LIME), 280, 150, 0.55, 0.03);
    note('شبیه‌سازی نمونه', 300, MD);
  });
  check(160, 850, 112, G, pop(t - ws(93) + 0.05, 12, 0.5));
}
// ---- «اگه شانس بوده، بهتره الان بفهمی»: the lucky trader's 10 trades, a «الان» pin, and what comes after ----
function iflArt(t) {
  const k = pop(t - T.ifl - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 1150, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-490, -340, 980, 680, WHITE, 'rgba(26,20,48,0.1)', 44);
    const X = (i) => 420 - (100 - i) * 8.4, Y = (v) => 90 - v * 21;
    line(-440, Y(0), 440, Y(0), 'rgba(26,20,48,0.18)', 3, [10, 12]);
    const kf = cub(k01(t, ws(99), 1.3)); if (kf > 0) { cv.save(); cv.globalAlpha *= 0.7; cv.setLineDash([4, 16]); trace(simPts(SIM_L, 10 + 90 * kf, X, Y).slice(10), 1, R, 9); cv.restore(); }
    const e = glowLine(simPts(SIM_L, 10 * cub(k01(t, T.ifl + 0.05, 0.5)), X, Y), AMB, 13, 8); if (e) circle(e[0], e[1], 16, AMB);
    popIn(t, ws(97), () => at(0, 0, 0.74, 1, () => die(5, 190, INKD, WHITE)), 350, -215, 0.5, -0.12);
    popIn(t, ws(97) + 0.1, () => at(0, 0, 0.74, 1, () => die(3, 190, INKD, WHITE)), 200, -245, 0.5, 0.16);
    const kp = pop(t - ws(100) + 0.05, 13, 0.5); if (kp > 0) { const px = X(10), py = Y(SIM_L[10]); line(px, py - 28, px, py - 28 - 140 * cl(kp), VIO, 7); at(px, py - 215, cl(kp, 0, 1.2), cl(kp), () => { cv.save(); cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 30; chip('الان', 0, 0, 68, WHITE, VIO); cv.restore(); }); circle(px, py, 26 * cl(kp), null, VIO, 7); }
    note('شبیه‌سازی نمونه', 300, MP);
  });
}
// ---- «نه وقتی که تموم شد»: the battery, empty ----
function lateArt(t) {
  const k = pop(t - T.late - 0.02, 14, 0.5); if (k <= 0) return;
  const lv = lerp(0.2, 0.0, cub(k01(t, T.late, ws(105) - T.late)));
  at(CX, 1340, cl(k, 0, 1.12) * 1.7, cl(k), () => battery(lv, t, { body: WHITE, well: '#2A0D14', label: WHITE }), -0.04 + (t > ws(105) ? Math.sin(t * 46) * 0.012 : 0));
  popIn(t, ws(105), () => { shadowed(() => circle(0, 0, 100, INKD), 30, 10, 0.4); line(-40, -40, 40, 40, WHITE, 20); line(40, -40, -40, 40, WHITE, 20); }, 880, 1100, 0.45, 0.1);
}
// ---- «شروعش رایگانه؛ لینک توی بیو» ----
function ctaArt(t) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(108), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -20, 0.55, -0.03);
  popIn(t, ws(109), () => { shadowed(() => rrect(-270, -72, 540, 144, 72, WHITE)); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
const FULL = [0, 0, 1];
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'duel', kpos: FULL, groups: [
      { at: 0, lines: [L_(315, 112, WHITE, [['سود', 0, { hl: G, ht: WHITE }], ['می‌کنی', 1], ['چون', 2]])] }] },
    { k: 'hard', bg: LIME, wipe: 'cut', art: 'hard', kpos: FULL, groups: [
      { at: 11, lines: [L_(800, 240, INKD, [['جوابش', 11]]), L_(1100, 300, INKD, [['سخته،', 12, { hl: INKD, ht: LIME }]])] }] },
    { k: 'same', bg: INKD, wipe: 'up', art: 'same', kpos: FULL, groups: [
      { at: 13, lines: [L_(300, 118, WHITE, [['چون', 13], ['سودِ', 14, { c: G }], ['شانسی', 15, { c: AMB }]]), L_(450, 118, WHITE, [['و', 16], ['سودِ', 17, { c: G }], ['استراتژی', 18, { c: '#A48CFF' }]])] },
      { at: 19, lines: [L_(300, 120, WHITE, [['توی', 19], ['حساب', 20]]), L_(490, 190, WHITE, [['یه شکلن.', [21, 22], { hl: LIME, ht: INKD }]])] }] },
    { k: 'green', bg: G, wipe: 'cut', art: 'green', kpos: FULL, groups: [
      { at: 23, lines: [L_(700, 250, WHITE, [['هر', 23], ['دو', 24]]), L_(1040, 350, WHITE, [['سبزن.', 25, { hl: WHITE, ht: G }]])] }] },
    { k: 'ten', bg: PAPER, wipe: 'right', art: 'ten', kpos: FULL, groups: [
      { at: 26, lines: [L_(290, 118, INKP, [['با', 26], ['۱۰', 27, { hl: VIO, ht: WHITE }], ['تا', 28], ['معامله‌ی', 29]]), L_(440, 118, INKP, [['خوب', 30, { c: G }], ['هم', 30]]), L_(630, 170, INKP, [['معلوم', 31], ['نمی‌شه.', 32, { hl: R, ht: WHITE }]])] }] },
    { k: 'tangle', bg: VIO, wipe: 'iris', art: 'tangle', kpos: FULL, groups: [
      { at: 33, lines: [L_(290, 124, WHITE, [['توی', 33], ['۱۰', 34, { c: LIME }], ['تا،', 35]]), L_(440, 124, WHITE, [['شانس', 36, { c: AMB }], ['و', 37], ['مهارت', 38, { c: LIME }]]), L_(610, 130, WHITE, [['از هم', [39, 40]], ['جدا', 41], ['نمی‌شن.', 42, { hl: INKD, ht: WHITE }]])] }] },
    { k: 'diff', bg: LIME, wipe: 'up', art: 'diff', kpos: FULL, groups: [
      { at: 43, lines: [L_(290, 130, INKD, [['فرقشون', 43, { hl: INKD, ht: LIME }], ['وقتی', 44]]), L_(440, 120, INKD, [['پیدا', 45], ['می‌شه', 46]]), L_(600, 136, INKD, [['که', 47], ['تعداد', 48, { c: VIO }], ['بره', 49], ['بالا.', 50]])] }] },
    { k: 'two', bg: INKD, wipe: 'left', art: 'two', kpos: FULL, groups: [
      { at: 51, lines: [L_(310, 130, WHITE, [['توی', 51], ['۲۰۰', 52, { hl: VIO, ht: WHITE }], ['تا', 52]]), L_(490, 140, WHITE, [['معامله،', 53]])] },
      { at: 54, lines: [L_(310, 130, WHITE, [['شانس', 54, { c: AMB }]]), L_(500, 170, WHITE, [['کم', 55, { hl: R, ht: WHITE }], ['میاره', 56]])] },
      { at: 57, lines: [L_(310, 130, WHITE, [['و', 57], ['استراتژی', 58, { c: LIME }]]), L_(500, 180, WHITE, [['می‌مونه.', 59, { hl: LIME, ht: INKD }]])] }] },
    { k: 'live', bg: PAPER, wipe: 'up', art: 'live', kpos: FULL, groups: [
      { at: 60, lines: [L_(290, 116, INKP, [['ولی', 60], ['توی', 61], ['بازار', 62]]), L_(450, 160, INKP, [['زنده،', 63, { hl: R, ht: WHITE }]]), L_(620, 116, INKP, [['۲۰۰', 64, { c: VIO }], ['تا', 64], ['معامله', 65]])] },
      { at: 66, lines: [L_(280, 110, INKP, [['یعنی', 66]]), L_(440, 150, INKP, [['چند', 67], ['ماه', 68, { hl: VIO, ht: WHITE }], ['وقت', 69]]), L_(620, 140, INKP, [['و', 70], ['پولِ', 71, { c: G }], ['واقعی.', 72, { c: R }]])] }] },
    { k: 'lab', bg: VIO, wipe: 'iris', art: 'lab', kpos: FULL, groups: [
      { at: 73, lines: [L_(300, 124, WHITE, [['توی', 73], ['بک‌تست‌لب', [74, 75], { hl: WHITE, ht: VIO }]]), L_(470, 130, WHITE, [['همون', 76], ['۲۰۰', 77, { c: LIME }], ['تا', 77], ['رو', 78]])] },
      { at: 79, lines: [L_(300, 112, WHITE, [['روی', 79], ['بازارِ', 80], ['واقعیِ', 81, { c: LIME }]]), L_(470, 140, WHITE, [['گذشته', 82, { hl: LIME, ht: INKD }], ['می‌گیری،', 83]])] }] },
    { k: 'norisk', bg: LIME, wipe: 'right', art: 'norisk', kpos: FULL, groups: [
      { at: 84, lines: [L_(390, 190, INKD, [['بدون', 84], ['ریسک،', 85, { hl: INKD, ht: LIME }]])] },
      { at: 86, lines: [L_(300, 118, INKD, [['و', 86], ['می‌بینی', 87], ['حسابت', 88, { c: VIO }]]), L_(470, 150, INKD, [['آخرش', 89], ['کجاست.', 90, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'ifs', bg: INKD, wipe: 'up', art: 'ifs', kpos: FULL, groups: [
      { at: 91, lines: [L_(290, 118, WHITE, [['اگه', 91], ['استراتژیه،', 92, { c: LIME }]]), L_(450, 130, WHITE, [['خیالت', 93]]), L_(630, 170, WHITE, [['راحت', 94, { hl: G, ht: WHITE }], ['می‌شه.', 95]])] }] },
    { k: 'ifl', bg: PAPER, wipe: 'left', art: 'ifl', kpos: FULL, groups: [
      { at: 96, lines: [L_(290, 124, INKP, [['اگه', 96], ['شانس', 97, { hl: AMB, ht: INKD }], ['بوده،', 98]]), L_(450, 124, INKP, [['بهتره', 99]]), L_(630, 180, INKP, [['الان', 100, { hl: VIO, ht: WHITE }], ['بفهمی،', 101]])] }] },
    { k: 'late', bg: R, wipe: 'cut', art: 'late', kpos: FULL, groups: [
      { at: 102, lines: [L_(420, 150, WHITE, [['نه', 102], ['وقتی', 103], ['که', 104]]), L_(730, 330, WHITE, [['تموم', 105, { hl: INKD, ht: WHITE }], ['شد.', 106]])] }] },
    { k: 'cta', bg: LIME, wipe: 'up', art: 'cta', kpos: [CX, 1290, 1.15], groups: [
      { at: 107, lines: [L_(330, 140, INKD, [['شروعش', 107], ['رایگانه؛', 108, { hl: VIO, ht: WHITE }]]), L_(500, 120, INKD, [['لینک', 109], ['توی', 110], ['بیو.', 111]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { duel: duelArt, hard: hardArt, same: sameArt, green: greenArt, ten: tenArt, tangle: tangleArt, diff: diffArt, two: twoArt, live: liveArt,
    lab: labArt, norisk: noriskArt, ifs: ifsArt, ifl: iflArt, late: lateArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(8), 8], [ws(12), 8], [ws(25), 12], [ws(31), 8], [ws(59), 10], [ws(105), 16]],
  // the cover is the hook's poster with every word said
  cover: () => { kineticFrame(T.hard - 0.08); },
});

// ---- over every frame: a thin bar of how far the reel has run (a reason to stay for the end) ----
const seekFrame = window.seek;
window.seek = (t) => {
  seekFrame(t);
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1;
  cv.fillStyle = 'rgba(0,0,0,0.28)'; cv.fillRect(0, 0, W, 12); const k = cl(t / T.end);
  cv.fillStyle = WHITE; cv.fillRect(W * (1 - k), 0, W * k, 12);
};
