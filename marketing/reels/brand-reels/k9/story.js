// k9 · «چالش ۱۰۰ معامله», the default kinetic look (u-kit), on the user's voice (dg1's cut, shared with the glass dg1).
// Everything is drawn; there are no platform screens and no prices. The drawn parts:
//   - a trophy and a track to the finish («تا آخرش بری»), «ترید مثل قبل» struck out;
//   - a four-step path («قانونش ساده‌ست»), then a «قدم ۱ از ۴» tag on each step;
//   - three strategy cards, one kept («فقط یکی»);
//   - a rule card: a sample chart with the entry, stop-loss and take-profit lines, and three rows written in;
//   - a 10×10 grid that fills to ۱۰۰;
//   - «پول واقعی» crossed out, «بازار واقعی گذشته» ticked;
//   - a shield, the hidden future and the locked rules («بدون تقلب»);
//   - a fork into the two endings, a strategy card you know, a wall of bad trades stamped «مجانی», an untouched wallet;
//   - the trophy again with both endings ticked («هر دوش برده»);
//   - the brand, a stair climbed step by step («قدم به قدم»), the free start and the end card.
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const ACC = (th) => (th === THEME.paper ? VIO : th === THEME.lime ? INKD : th === THEME.violet ? WHITE : LIME);
const CONF = [VIO, INKD, WHITE, R, AMB];

// ---- shared symbols ----
function trophy(col, label, lc = INKD) {
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18;
  cv.strokeStyle = col; cv.lineWidth = 28; cv.lineCap = 'round';
  cv.beginPath(); cv.arc(-160, -95, 62, Math.PI * 0.5, Math.PI * 1.5); cv.stroke();
  cv.beginPath(); cv.arc(160, -95, 62, -Math.PI * 0.5, Math.PI * 0.5); cv.stroke();
  cv.fillStyle = col; cv.beginPath(); cv.moveTo(-170, -180); cv.lineTo(170, -180); cv.bezierCurveTo(170, 10, 90, 75, 0, 75); cv.bezierCurveTo(-90, 75, -170, 10, -170, -180); cv.closePath(); cv.fill();
  rrect(-28, 60, 56, 90, 8, col); rrect(-115, 140, 230, 50, 14, col); rrect(-145, 182, 290, 44, 14, col);
  cv.restore();
  rrect(-140, -160, 32, 140, 16, 'rgba(255,255,255,0.35)'); rrect(-145, 182, 290, 44, 14, 'rgba(0,0,0,0.16)');
  if (label) txt(label, 0, -72, 92, lc);
}
function rings(t, col, r0 = 200, span = 320) { for (let i = 0; i < 4; i++) { const p = (t * 0.7 + i / 4) % 1; circle(0, 0, r0 + p * span, null, rgba(col, 0.5 * (1 - p)), 6); } }
function stepTag(t, s, n, th) {
  const k = pop(t - s.t0 - 0.12, 13, 0.6); if (k <= 0) return; const a = ACC(th), p = s.kpos;
  at(0, (120 - p[1]) / p[2], cl(k, 0, 1.15), cl(k), () => {
    chip(`قدم ${fa(n)} از ${fa(4)}`, 0, 0, 32, a, rgba(a, 0.1), { stroke: rgba(a, 0.35), lw: 2 });
    for (let i = 0; i < 4; i++) circle(45 - i * 30, 52, 8, i < n ? a : rgba(a, 0.22));
  });
}
function pen(x, y) { at(x, y, 1, 1, () => { cv.fillStyle = LIME; cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(-12, -30); cv.lineTo(12, -30); cv.closePath(); cv.fill(); rrect(-12, -130, 24, 100, 6, LIME); rrect(-12, -130, 24, 22, 6, VIO); }, -0.5); }
function shieldPath(s = 1) {
  cv.beginPath(); cv.moveTo(0, -200 * s); cv.bezierCurveTo(70 * s, -150 * s, 140 * s, -150 * s, 180 * s, -155 * s); cv.lineTo(175 * s, 30 * s);
  cv.bezierCurveTo(165 * s, 140 * s, 70 * s, 200 * s, 0, 235 * s); cv.bezierCurveTo(-70 * s, 200 * s, -165 * s, 140 * s, -175 * s, 30 * s);
  cv.lineTo(-180 * s, -155 * s); cv.bezierCurveTo(-140 * s, -150 * s, -70 * s, -150 * s, 0, -200 * s); cv.closePath();
}
function gear(r, col, hole, rot) { cv.save(); cv.rotate(rot); cv.fillStyle = col; cv.beginPath(); for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2; cv.arc(0, 0, i % 2 ? r : r * 1.3, a0, a0 + Math.PI / 8); } cv.closePath(); cv.fill(); circle(0, 0, r * 0.42, hole); cv.restore(); }
function confetti(t, t0, n = 46) {
  if (t < t0) return; const d = t - t0;
  for (let i = 0; i < n; i++) { const x = (rnd(i * 1.7) - 0.5) * 1000 + Math.sin(d * 3 + i) * 30, y = -620 + d * (380 + rnd(i * 2.9) * 420) - rnd(i * 4.1) * 200, a = cl(1 - (d - 1.2) / 0.5);
    if (a > 0) at(x, y, 1, a, () => rrect(-9, -16, 18, 32, 4, CONF[i % CONF.length]), d * (2 + rnd(i) * 4) + i); }
}

// ---- «یه چالش دارم که اگه تا آخرش بری، دیگه هیچ‌وقت مثل قبل ترید نمی‌کنی» ----
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6), up = cub(k01(t, ws(4) - 0.1, 0.5));
  at(0, lerp(0, -230, up), 1, 1, () => { rings(t, AMB, lerp(200, 140, up), lerp(320, 220, up));
    at(0, 0, lerp(1, 0.66, up) * cl(k, 0, 1.1), cl(k), () => trophy(AMB, fa(100)), 0.05 * Math.sin(t * 3) * (1 - up)); });
  const kt = cub(k01(t, ws(4) - 0.05, 0.35));
  if (kt > 0) at(0, 230, 1, kt, () => {
    const kp = exIO(k01(t, ws(5), ws(7) + 0.2 - ws(5))), x = 380 - 740 * kp;
    line(380, 0, -360, 0, 'rgba(255,255,255,0.16)', 18); line(380, 0, x, 0, LIME, 18);
    line(-380, 8, -380, -150, WHITE, 8);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) rrect(-376 + c * 30, -150 + r * 30, 30, 30, 0, (r + c) % 2 ? LIME : WHITE);
    circle(x, 0, 30, LIME); circle(x, 0, 12, INKD);
    txt('شروع', 380, 72, 34, MD, { w: 800 }); txt('آخرش', -380, 72, 34, LIME, { w: 800 });
  });
  const kc = pop(t - ws(11) + 0.05, 13, 0.55);
  if (kc > 0) at(0, 450, cl(kc, 0, 1.2), cl(kc), () => { const w = chip('ترید مثل قبل', 0, 0, 46, WHITE, PLATE, { stroke: 'rgba(255,255,255,0.14)', lw: 2 }); const kx = cub(k01(t, ws(13), 0.35)); if (kx > 0) line(w / 2 - 20, 2, w / 2 - 20 - (w - 40) * kx, 2, R, 10); });
}
// ---- «قانونش ساده‌ست»: four steps ----
function ruleArt(t, th) {
  const kl = cub(k01(t, T.rule + 0.05, 0.45)); line(330, 0, 330 - 660 * kl, 0, 'rgba(255,255,255,0.4)', 8, [4, 18]);
  for (let i = 0; i < 4; i++) popIn(t, T.rule + 0.1 + i * 0.12, () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 30; cv.shadowOffsetY = 10; circle(0, 0, 78, WHITE); cv.restore(); txt(fa(i + 1), 0, 8, 80, VIO); }, 330 - i * 220, 0, 0.5);
  popIn(t, ws(17), () => chip('فقط ۴ قدم', 0, 0, 46, INKD, LIME), 0, 200, 0.55, -0.03);
}
// ---- «یه استراتژی انتخاب کن. فقط یکی.» ----
const STRATS = [['شکست سطح', [[-80, 40], [-40, 10], [-10, 30], [30, -10], [80, -60]], true], ['پولبک', [[-80, 50], [-30, -20], [10, 10], [80, -60]]], ['واگرایی', [[-80, -40], [-20, -10], [30, 20], [80, 50]]]];
function pickArt(t, th, s) {
  stepTag(t, s, 1, th);
  const kOut = cub(k01(t, ws(23) - 0.05, 0.4)), kKeep = pop(t - ws(23) + 0.05, 11, 0.55);
  STRATS.forEach(([name, pts, flat], i) => {
    const k = pop(t - ws(19) - 0.05 - i * 0.12, 12, 0.6); if (k <= 0) return;
    const keep = i === 1, x0 = 300 - i * 300, x = keep ? x0 : x0 + (i === 0 ? 160 : -160) * kOut, y = keep ? -lerp(0, 40, cl(kKeep)) : 200 * kOut * kOut;
    const sc = keep ? lerp(1, 1.3, cl(kKeep)) : 1, a = keep ? 1 : 1 - kOut;
    if (a <= 0) return;
    at(x, y, sc * lerp(0.85, 1, cl(k)), cl(k) * a, () => {
      card(-130, -175, 260, 350, WHITE, keep && kKeep > 0 ? VIO : 'rgba(26,20,48,0.1)', 30);
      if (keep && kKeep > 0) rrect(-130, -175, 260, 350, 30, null, VIO, 6 * cl(kKeep));
      rrect(-100, -145, 200, 170, 20, '#ECE7FA');
      at(0, -60, 0.9, 1, () => { if (flat) line(-90, 0, 90, 0, rgba(VIO, 0.5), 5, [10, 8]); trace(pts, 1, VIO, 9); });
      txt(name, 0, 105, name.length > 6 ? 34 : 40, INKP);
    }, keep ? 0 : (i === 0 ? 0.12 : -0.12) * kOut);
  });
  // the cursor picks the middle card on «انتخاب کن»
  const kc = cub(k01(t, ws(21) - 0.1, ws(22) - ws(21) + 0.1)), ka = cub(k01(t, ws(20), 0.3)) * (1 - cub(k01(t, ws(23) + 0.2, 0.3)));
  if (ka > 0) { cv.save(); cv.globalAlpha *= ka; cursor(lerp(320, 20, kc), lerp(360, -40, kc) + Math.sin(t * 5) * 6 * (1 - kc), 1.0); cv.restore(); }
  check(105, -200, 50, G, pop(t - ws(24) - 0.05, 13, 0.5));
}
// ---- «قانون‌هاشو بنویس. کجا وارد می‌شی؟ حد ضررت کجاست؟ حد سودت کجا؟» ----
const BARS = (() => { const b = []; let p = 100; for (let i = 0; i < 22; i++) { const o = p, c = p + (rnd(i * 2.1 + 5) - 0.45) * 5, h = Math.max(o, c) + rnd(i * 3.3) * 2.5, l = Math.min(o, c) - rnd(i * 4.7) * 2.5; b.push([o, h, l, c]); p = c; } return b; })();
const EN = BARS[BARS.length - 1][3], LV = [['ورود', EN, SKY, 28], ['حد ضرر', EN - 9, R, 31], ['حد سود', EN + 14, G, 34]];
function writeArt(t, th, s) {
  stepTag(t, s, 2, th);
  const k = pop(t - ws(25) - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, (1 - cl(k)) * 60, 1, cl(k), () => {
    card(-440, -330, 880, 660, PLATE, 'rgba(255,255,255,0.1)');
    const lo = Math.min(...BARS.map((b) => b[2]), EN - 9) - 1, hi = Math.max(...BARS.map((b) => b[1]), EN + 14) + 1;
    const n = Math.floor(cl((t - ws(25)) / 0.9) * BARS.length + 0.999), m = candleChart(BARS, n, [-400, -300, 400, -30], { N: 32, lo, hi });
    const xs = m.X(BARS.length - 1) + 10;
    LV.forEach(([name, p, col, wi], i) => {
      const kl = cub(k01(t, ws(wi), 0.35)); if (kl <= 0) return; const y = m.Y(p);
      line(xs, y, xs + (390 - xs) * kl, y, col, 6, i ? [14, 10] : null);
      if (kl > 0.6) at(330, y, 1, cub((kl - 0.6) / 0.4), () => chip(name, 0, 0, 24, WHITE, col));
      // the row written in under the chart
      const ry = 70 + i * 95; circle(395, ry, 12, col); txt(name, 365, ry + 3, 40, WHITE, { align: 'right' });
      const x0 = 365 - measure(name, 40) - 40, x1 = -300, N = 24, kw = cub(k01(t, ws(wi) + 0.1, 0.65));
      const pts = Array.from({ length: N + 1 }, (_, q) => [lerp(x0, x1, q / N), ry + Math.sin(q * 1.9 + i) * 9 + (rnd(q + i * 30) - 0.5) * 8]);
      const end = trace(pts, kw, 'rgba(255,255,255,0.65)', 5); if (kw > 0 && kw < 1) pen(end[0], end[1]);
      check(-360, ry, 30, col, pop(t - ws(wi) - 0.75, 14, 0.5));
      if (i < 2) line(380, ry + 47, -390, ry + 47, 'rgba(255,255,255,0.08)', 2);
    });
    note('نمودار نمونه', 375, MD);
  });
}
// ---- «حالا صد تا معامله باهاش بزن»: a 10×10 grid that fills ----
function hundredArt(t, th, s) {
  stepTag(t, s, 3, th);
  const k = pop(t - T.hundred - 0.05, 12, 0.6); if (k <= 0) return;
  const t0 = ws(38) - 0.05, t1 = ws(42) + 0.3, f = cl((t - t0) / (t1 - t0)), io = f < 0.5 ? 4 * f ** 3 : 1 - Math.pow(-2 * f + 2, 3) / 2, n = Math.floor(io * 100 + 0.0001);   // the same easing as the tick run in sound.py
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    for (let i = 0; i < 100; i++) { const c = i % 10, r = Math.floor(i / 10), x = 270 - c * 60, y = -270 + r * 60, on = i < n, kk = on ? pop((io * 100 - i) * 0.03, 18, 0.5) : 0;
      rrect(x - 25, y - 25, 50, 50, 12, rgba(INKD, 0.12)); if (on) at(x, y, cl(kk, 0, 1.25), 1, () => rrect(-25, -25, 50, 50, 12, i === n - 1 && f < 1 ? VIO : INKD)); }
    txt(fa(n), 0, 410, 130, INKD); txt('معامله', 0, 500, 40, '#3E4D12', { w: 800 });
  });
}
// ---- «نه با پول واقعی، روی بازار واقعی گذشته» ----
function safeArt(t, th, s) {
  stepTag(t, s, 3, th);
  [['پول واقعی', 44, 46, 'cash', false], ['بازار واقعی گذشته', 47, 50, 'chart', true]].forEach(([name, a, b, ic, ok], i) => {
    const k = pop(t - ws(a) + 0.1, 12, 0.6); if (k <= 0) return; const y = -170 + i * 340, size = name.length > 10 ? 48 : 58;
    at(0, y, lerp(0.85, 1, cl(k)), cl(k), () => {
      card(-420, -115, 840, 230, WHITE, 'rgba(26,20,48,0.1)', 34);
      at(300, 0, 1, 1, () => {
        if (ic === 'cash') { at(0, -10, 1, 1, () => rrect(-80, -48, 160, 96, 14, '#13996A'), -0.15); rrect(-80, -40, 160, 96, 14, G); circle(0, 8, 28, null, WHITE, 6); circle(-56, -18, 6, WHITE); circle(56, 34, 6, WHITE); }
        if (ic === 'chart') { rrect(-82, -64, 164, 128, 18, INKD); trace([[-60, 30], [-30, 0], [0, 14], [30, -24], [60, -36]], 1, LIME, 8); cv.fillStyle = WHITE; cv.beginPath(); cv.moveTo(40, 22); cv.lineTo(40, 52); cv.lineTo(64, 37); cv.closePath(); cv.fill(); }
      });
      txt(name, 175, 4, size, INKP, { align: 'right' });
      if (!ok) { const kx = cub(k01(t, ws(b), 0.3)); if (kx > 0) { const w = measure(name, size) + 40; line(195, 4, 195 - w * kx, 4, R, 12); } cross(-330, 0, 54, R, pop(t - ws(b) - 0.15, 14, 0.5)); }
      else check(-330, 0, 54, G, pop(t - ws(b) - 0.05, 14, 0.5));
    });
  });
}
// ---- «بدون تقلب. آینده رو نمی‌بینی و از قانون‌ها تخطی نمی‌کنی» ----
function fairArt(t, th, s) {
  stepTag(t, s, 4, th);
  const k = pop(t - ws(51) - 0.05, 11, 0.55), mv = cub(k01(t, ws(53) - 0.1, 0.5));
  if (k > 0) at(0, lerp(40, -330, mv), lerp(1, 0.48, mv) * cl(k, 0, 1.2), cl(k), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; shieldPath(); cv.fillStyle = VIO; cv.fill(); cv.restore();
    shieldPath(0.84); cv.strokeStyle = LIME; cv.lineWidth = 8; cv.stroke();
    trace([[-75, 15], [-18, 72], [85, -55]], cub(k01(t, ws(52), 0.35)), WHITE, 32);
  });
  [['آینده', 53, 55, 'eye', 'پنهان'], ['قانون‌ها', 59, 60, 'lock', 'قفل']].forEach(([name, a, b, ic, tag], i) => {
    const kt = pop(t - ws(a) - 0.05, 12, 0.6); if (kt <= 0) return; const y = -10 + i * 250, kb = cub(k01(t, ws(b), 0.3));
    at(0, y, lerp(0.85, 1, cl(kt)), cl(kt), () => {
      card(-420, -95, 840, 190, PLATE, 'rgba(255,255,255,0.1)', 32);
      at(300, 0, 1, 1, () => {
        if (ic === 'eye') { cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 8; cv.beginPath(); cv.moveTo(-62, 0); cv.quadraticCurveTo(0, -56, 62, 0); cv.quadraticCurveTo(0, 56, -62, 0); cv.stroke(); cv.restore(); circle(0, 0, 18, WHITE); if (kb > 0) line(-52, -44, -52 + 104 * kb, -44 + 88 * kb, R, 11); }
        if (ic === 'lock') { cv.save(); cv.strokeStyle = LIME; cv.lineWidth = 11; cv.beginPath(); cv.arc(0, -14 - 22 * (1 - kb), 30, Math.PI, Math.PI * 2); cv.lineTo(30, -14 + 4 - 22 * (1 - kb)); cv.stroke(); cv.restore(); rrect(-46, -14, 92, 72, 14, LIME); circle(0, 14, 9, INKD); }
      });
      txt(name, 180, 4, 58, WHITE, { align: 'right' });
      if (kb > 0) at(-270, 0, cl(pop(t - ws(b) - 0.1, 14, 0.5), 0, 1.2), cl(kb), () => chip(tag, 0, 0, 38, i ? INKD : WHITE, i ? LIME : R));
    });
  });
}
// ---- «آخر صد معامله»: the fork ----
function outcomeArt(t, th) {
  const k1 = cub(k01(t, T.outcome + 0.05, 0.35)), k2 = cub(k01(t, ws(64), 0.45));
  if (k1 > 0) line(0, -340, 0, -340 + 290 * k1, 'rgba(255,255,255,0.85)', 14);
  if (k2 > 0) { trace([[0, -50], [260, 260]], k2, 'rgba(255,255,255,0.85)', 14); trace([[0, -50], [-260, 260]], k2, 'rgba(255,255,255,0.85)', 14); }
  popIn(t, T.outcome + 0.1, () => { circle(0, 0, 44, WHITE); txt(fa(100), 0, 4, 40, VIO); }, 0, -50, 0.5);
  popIn(t, ws(65), () => { circle(0, 0, 92, LIME); txt('یا', 0, 6, 64, INKD); }, 260, 290, 0.5);
  popIn(t, ws(65) + 0.15, () => { circle(0, 0, 92, WHITE); txt('یا', 0, 6, 64, VIO); }, -260, 290, 0.5);
}
// ---- «یا یه استراتژی داری که می‌دونی چطور کار می‌کنه» ----
const KNOW = [['کجا جواب می‌ده', 71], ['کجا جواب نمی‌ده', 73], ['بدترین روزش', 75]];
function knowArt(t, th) {
  const k = pop(t - T.know - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-430, -290, 860, 580, WHITE, 'rgba(26,20,48,0.1)', 36);
    chip('استراتژی تو', 170, -195, 42, WHITE, VIO);
    at(-330, -195, 1, 1, () => gear(40, VIO, WHITE, t * 1.4));
    at(-235, -165, 1, 1, () => gear(24, LIME, WHITE, -t * 2.3));
    line(400, -112, -400, -112, 'rgba(26,20,48,0.08)', 2);
    KNOW.forEach(([name, wi], i) => {
      const kr = pop(t - ws(wi) + 0.05, 13, 0.6); if (kr <= 0) return; const y = -30 + i * 110;
      at(0, y, 1, cl(kr), () => { circle(380, 0, 11, VIO); txt(name, 350, 3, 46, INKP, { align: 'right' }); check(-340, 0, 36, G, pop(t - ws(wi) - 0.2, 14, 0.5)); if (i < 2) line(400, 55, -400, 55, 'rgba(26,20,48,0.08)', 2); });
    });
  });
}
// ---- «یا صد تا معامله‌ی بد رو مجانی زدی، به جای اینکه با پول واقعیت بزنی» ----
function wallet() {
  at(-30, -112, 1, 1, () => rrect(-150, -50, 300, 100, 12, '#13996A'), -0.14); at(10, -100, 1, 1, () => rrect(-150, -50, 300, 100, 12, G), 0.07);
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(-220, -110, 440, 270, 40, '#5634E0'); cv.restore();
  rrect(60, -20, 180, 110, 34, VIO); circle(140, 35, 18, LIME);
}
function badArt(t, th) {
  const out = 1 - cub(k01(t, ws(85) - 0.1, 0.35));
  if (out > 0) { cv.save(); cv.globalAlpha *= out;
    const t0 = ws(78) - 0.05, t1 = ws(81) + 0.3, N = 30;
    for (let i = 0; i < N; i++) { const ti = t0 + (t1 - t0) * Math.sqrt(i / N), kk = pop(t - ti, 15, 0.55); if (kk <= 0) continue;
      const c = i % 6, r = Math.floor(i / 6), x = 350 - c * 140, y = -330 + r * 140;
      at(x, y, cl(kk, 0, 1.25), cl(kk), () => { rrect(-56, -56, 112, 112, 26, PLATE); line(-20, -20, 20, 20, R, 13); line(20, -20, -20, 20, R, 13); }); }
    const ks = pop(t - ws(83) + 0.02, 15, 0.5);
    if (ks > 0) at(0, -60, lerp(1.9, 1, cl(ks)), cl(ks * 3), () => { const w = measure('مجانی', 120) + 120; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 40; rrect(-w / 2, -95, w, 190, 30, LIME); cv.restore(); rrect(-w / 2 + 14, -81, w - 28, 162, 20, null, INKD, 6); txt('مجانی', 0, 6, 120, INKD); }, -0.12);
    cv.restore(); }
  const kw = pop(t - ws(85) - 0.1, 12, 0.6);
  if (kw > 0) at(0, -40, cl(kw, 0, 1.15), cl(kw), () => wallet());
  popIn(t, ws(90), () => chip('پول واقعیت', 0, 0, 44, WHITE, PLATE, { stroke: 'rgba(255,255,255,0.16)', lw: 2 }), 0, 260, 0.55);
  check(200, -170, 62, G, pop(t - ws(91) - 0.05, 13, 0.5));
  popIn(t, ws(92), () => chip('دست‌نخورده', 0, 0, 42, INKD, LIME), 0, 400, 0.55, -0.03);
}
// ---- «هر دوش برده» ----
function bothArt(t, th) {
  const k = pop(t - T.both - 0.05, 11, 0.55); if (k <= 0) return;
  at(0, 0, 1, 1, () => rings(t, VIO, 230, 300));
  at(0, 0, cl(k, 0, 1.15), cl(k), () => trophy(VIO, fa(100), WHITE));
  check(300, -190, 64, INKD, pop(t - ws(94) + 0.05, 13, 0.5)); check(-300, -190, 64, INKD, pop(t - ws(94) - 0.1, 13, 0.5));
  confetti(t, ws(95));
}
// ---- «چالش رو توی بک‌تست‌لب شروع کن» ----
function startArt(t, th) {
  brandArt(t, th, ws(99));
  popIn(t, ws(101), () => chip(`چالش ${fa(100)} معامله`, 0, 0, 46, INKD, LIME), 0, 330, 0.55, -0.03);
}
// ---- «ما هم توی همین پیج قدم به قدم همراهتیم»: a stair, climbed ----
const STX = (i) => 300 - i * 200, STY = (i) => 180 - i * 100;
function followArt(t, th) {
  popIn(t, ws(106), () => { const s = 'دنبال کن', w = measure(s, 44, 800) + 140; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.2)'; cv.shadowBlur = 30; cv.shadowOffsetY = 10; rrect(-w / 2, -42, w, 84, 42, VIO); cv.restore();
    txt(s, -20, 2, 44, WHITE, { w: 800 }); line(w / 2 - 54, 0, w / 2 - 26, 0, WHITE, 7); line(w / 2 - 40, -14, w / 2 - 40, 14, WHITE, 7); }, 0, -330, 0.55);
  const hops = [ws(108), ws(110), ws(111) + 0.15]; let lvl = 0; hops.forEach((h) => { if (t >= h + 0.15) lvl++; });
  for (let i = 0; i < 4; i++) { const k = pop(t - T.follow - 0.1 - i * 0.1, 12, 0.6); if (k <= 0) continue;
    at(STX(i), 0, 1, cl(k), () => { const top = STY(i) + (1 - cl(k)) * 60; rrect(-94, top, 188, 300 - top, 20, i <= lvl ? VIO : '#DCD4F5'); txt(fa(i + 1), 0, top + 52, 52, i <= lvl ? WHITE : '#9C8FD0'); }); }
  const kd = pop(t - T.follow - 0.5, 12, 0.6); if (kd <= 0) return;
  let x = STX(0), y = STY(0);
  hops.forEach((h, j) => { const kk = cub(k01(t, h - 0.05, 0.3)); if (kk > 0) { x = lerp(STX(j), STX(j + 1), kk); y = lerp(STY(j), STY(j + 1), kk) - Math.sin(kk * Math.PI) * 90; } });
  at(x, y - 44, cl(kd, 0, 1.2), cl(kd), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 20; cv.shadowOffsetY = 8; circle(0, 0, 38, LIME); cv.restore(); circle(0, 0, 38, null, INKD, 6); circle(0, -2, 10, INKD); });
}
// ---- «شروعش رایگانه، لینکش توی بیوئه» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(113), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -20, 0.55, -0.03);
  popIn(t, ws(114), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-270, -72, 540, 144, 72, WHITE); cv.restore(); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
const C = fa(100);
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1200, 1], groups: [
      { at: 0, lines: [L_(330, 120, WHITE, [['یه', 0], ['چالش', 1, { hl: LIME, ht: INKD }], ['دارم', 2]])] },
      { at: 3, lines: [L_(300, 100, WHITE, [['که', 3], ['اگه', 4], ['تا', 5]]), L_(440, 130, WHITE, [['آخرش', 6, { c: LIME }], ['بری،', 7]])] },
      { at: 8, lines: [L_(260, 96, WHITE, [['دیگه', 8], ['هیچ‌وقت', [9, 10]]]), L_(390, 110, WHITE, [['مثل', 11], ['قبل', 12, { hl: R, ht: WHITE }]]), L_(520, 96, WHITE, [['ترید', 13], ['نمی‌کنی.', [14, 15]]])] }] },
    { k: 'rule', bg: VIO, wipe: 'iris', art: 'rule', kpos: [CX, 1220, 1], groups: [
      { at: 16, lines: [L_(380, 130, WHITE, [['قانونش', 16]]), L_(540, 150, WHITE, [['ساده‌ست.', [17, 18], { hl: LIME, ht: INKD }]])] }] },
    { k: 'pick', bg: PAPER, wipe: 'up', art: 'pick', kpos: [CX, 1240, 1.1], groups: [
      { at: 19, lines: [L_(320, 110, INKP, [['یه', 19], ['استراتژی', 20, { c: VIO }]]), L_(460, 110, INKP, [['انتخاب', 21], ['کن.', 22]])] },
      { at: 23, lines: [L_(400, 160, INKP, [['فقط', 23], ['یکی.', 24, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'write', bg: INKD, wipe: 'right', art: 'write', kpos: [CX, 1270, 1], groups: [
      { at: 25, lines: [L_(330, 116, WHITE, [['قانون‌هاشو', 25, { c: LIME }]]), L_(470, 120, WHITE, [['بنویس.', 26, { hl: LIME, ht: INKD }]])] },
      { at: 27, lines: [L_(280, 90, WHITE, [['کجا', 27], ['وارد', 28, { c: SKY }], ['می‌شی؟', [29, 30]]]), L_(400, 90, WHITE, [['حد', 31, { c: R }], ['ضررت', 32, { c: R }], ['کجاست؟', 33]]), L_(520, 90, WHITE, [['حد', 34, { c: G }], ['سودت', 35, { c: G }], ['کجا؟', 36]])] }] },
    { k: 'hundred', bg: LIME, wipe: 'iris', art: 'hundred', kpos: [CX, 1150, 1], groups: [
      { at: 37, lines: [L_(300, 110, INKD, [['حالا', 37], [C, 38, { hl: INKD, ht: LIME }], ['تا', 39]]), L_(440, 116, INKD, [['معامله', 40], ['باهاش', 41], ['بزن.', 42]])] }] },
    { k: 'safe', bg: PAPER, wipe: 'left', art: 'safe', kpos: [CX, 1230, 1], groups: [
      { at: 43, lines: [L_(290, 96, INKP, [['نه', 43], ['با', 44], ['پول', 45], ['واقعی،', 46, { c: R }]]), L_(410, 100, INKP, [['روی', 47], ['بازار', 48], ['واقعی', 49, { hl: VIO, ht: WHITE }]]), L_(530, 110, INKP, [['گذشته.', 50, { c: VIO }]])] }] },
    { k: 'fair', bg: INKD, wipe: 'up', art: 'fair', kpos: [CX, 1250, 1], groups: [
      { at: 51, lines: [L_(330, 130, WHITE, [['بدون', 51]]), L_(480, 160, WHITE, [['تقلب.', 52, { hl: R, ht: WHITE }]])] },
      { at: 53, lines: [L_(280, 96, WHITE, [['آینده', 53, { c: LIME }], ['رو', 54], ['نمی‌بینی', [55, 56]]]), L_(400, 96, WHITE, [['و', 57], ['از', 58], ['قانون‌ها', 59, { c: LIME }]]), L_(520, 104, WHITE, [['تخطی', 60, { hl: R, ht: WHITE }], ['نمی‌کنی.', [61, 62]]])] }] },
    { k: 'outcome', bg: VIO, wipe: 'right', art: 'outcome', kpos: [CX, 1260, 1], groups: [
      { at: 63, lines: [L_(340, 120, WHITE, [['آخر', 63]]), L_(490, 140, WHITE, [[C, 64, { hl: LIME, ht: INKD }], ['معامله', 65]])] }] },
    { k: 'know', bg: PAPER, wipe: 'up', art: 'know', kpos: [CX, 1250, 1], groups: [
      { at: 66, lines: [L_(260, 110, INKP, [['یا', 66, { hl: VIO, ht: WHITE }], ['یه', 67], ['استراتژی', 68, { c: VIO }], ['داری', 69]]), L_(400, 96, INKP, [['که', 70], ['می‌دونی', [71, 72]], ['چطور', 73]]), L_(520, 104, INKP, [['کار', 74], ['می‌کنه،', [75, 76], { hl: LIME, ht: INKD }]])] }] },
    { k: 'bad', bg: INKD, wipe: 'left', art: 'bad', kpos: [CX, 1250, 1], groups: [
      { at: 77, lines: [L_(260, 110, WHITE, [['یا', 77, { hl: VIO, ht: WHITE }], [C, 78, { c: LIME }], ['تا', 79]]), L_(400, 104, WHITE, [['معامله‌ی', 80], ['بد', 81, { hl: R, ht: WHITE }]]), L_(530, 104, WHITE, [['رو', 82], ['مجانی', 83, { hl: LIME, ht: INKD }], ['زدی،', 84]])] },
      { at: 85, lines: [L_(300, 96, WHITE, [['به', 85], ['جای', 86], ['اینکه', [87, 88]]]), L_(430, 104, WHITE, [['با', 89], ['پول', 90], ['واقعیت', 91, { c: LIME }], ['بزنی.', 92]])] }] },
    { k: 'both', bg: LIME, wipe: 'iris', art: 'both', kpos: [CX, 1260, 1], groups: [
      { at: 93, lines: [L_(360, 140, INKD, [['هر', 93], ['دوش', 94]]), L_(530, 170, INKD, [['برده.', 95, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'start', bg: VIO, wipe: 'right', art: 'start', kpos: [CX, 1240, 1], groups: [
      { at: 96, lines: [L_(280, 110, WHITE, [['چالش', 96, { hl: LIME, ht: INKD }], ['رو', 97]]), L_(410, 100, WHITE, [['توی', 98], ['بک‌تست‌لب', [99, 100], { c: LIME }]]), L_(540, 110, WHITE, [['شروع', 101], ['کن.', 102]])] }] },
    { k: 'follow', bg: PAPER, wipe: 'up', art: 'follow', kpos: [CX, 1320, 1], groups: [
      { at: 103, lines: [L_(250, 96, INKP, [['ما', 103], ['هم', 104], ['توی', 105]]), L_(370, 100, INKP, [['همین', 106], ['پیج', 107, { c: VIO }]]), L_(500, 110, INKP, [['قدم', 108, { c: VIO }], ['به', 109], ['قدم', 110, { c: VIO }]]), L_(630, 110, INKP, [['همراهتیم.', 111, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'cta', bg: LIME, wipe: 'left', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 112, lines: [L_(320, 130, INKD, [['شروعش', 112], ['رایگانه.', 113, { hl: VIO, ht: WHITE }]]), L_(470, 100, INKD, [['لینکش', 114], ['توی', 115], ['بیوئه.', 116]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, rule: ruleArt, pick: pickArt, write: writeArt, hundred: hundredArt, safe: safeArt, fair: fairArt, outcome: outcomeArt,
    know: knowArt, bad: badArt, both: bothArt, start: startArt, follow: followArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(1), 8], [ws(38), 10], [ws(52), 12], [ws(83), 9], [ws(95), 12]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('چالش', CX, 420, 190, LIME);
    const s = `${C} معامله`, size = 150, w = measure(s, size); cv.save(); cv.translate(CX, 610); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 24, VIO); cv.restore(); txt(s, CX, 610, size, WHITE);
    at(CX, 1110, 1, 1, () => { rings(0.9, AMB); trophy(AMB, C); });
    at(CX, 1500, 1, 1, () => chip('تا آخرش بری، مثل قبل ترید نمی‌کنی', 0, 0, 44, INKD, LIME));
  },
});
