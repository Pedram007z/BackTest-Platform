// k11 · «وین‌ریت استراتژیم ۶۰ درصد بود… پس چرا چالش پراپمو سوزوندم؟», the default kinetic look (u-kit), on the user's voice.
// Built on what the two reels past 10k views share (k1, q2):
//   - a money question in the viewer's own words, with its number huge from the first frame;
//   - «بیا یه حساب ساده کنیم», then the math step by step;
//   - the brand only as the way to get the real number (from ~70% of the reel);
//   - fast speech (×1.22, ~190 words a minute) and a new picture every 2–3 s.
// The drawn parts:
//   - a 60% win-rate ring, a prop challenge card that burns;
//   - a calculator;
//   - ten trades, four of them losses, first evenly spread («انتظار») and then bunched («واقعیت»);
//   - 200 trades at a 60% win rate (a sample, labelled), with a run of five losses ringed;
//   - the drawdown staircase at 2% risk hitting the common prop limit of 10%, and at 1% stopping at 5%;
//   - a die for «حدس»;
//   - a risk slider moving from 2% to 1%, then «خرید چالش».
// The real platform (dark theme):
//   - f1's gold replay on «روی بازار واقعیِ گذشته»;
//   - on «آنالیزش بهت می‌گه…», the Analytics losers box with «بیشترین باخت‌های پیاپی» (f1) and the Monte Carlo card
//     «افت سرمایه در بدترین ۵٪» (k1).
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); cv.save(); cv.globalAlpha *= a; rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); cv.restore(); crop(key, r, x, y, w, a); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const pct = (v) => fa(String(v).replace('.', '٫')) + '٪';

// ---- shared symbols ----
/** The win-rate ring: 60% green, 40% red. */
function donut(r, k = 1) {
  cv.save(); cv.lineWidth = r * 0.24; cv.lineCap = 'butt';
  cv.strokeStyle = 'rgba(255,255,255,0.08)'; cv.beginPath(); cv.arc(0, 0, r, 0, Math.PI * 2); cv.stroke();
  const a0 = -Math.PI / 2, g = 0.6 * Math.PI * 2 * k, l = 0.4 * Math.PI * 2 * k;
  cv.strokeStyle = G; cv.beginPath(); cv.arc(0, 0, r, a0, a0 + g); cv.stroke();
  cv.strokeStyle = R; cv.beginPath(); cv.arc(0, 0, r, a0 + 0.6 * Math.PI * 2, a0 + 0.6 * Math.PI * 2 + l); cv.stroke(); cv.restore();
  txt(pct(60), 0, -6, r * 0.62, WHITE); txt('وین‌ریت', 0, r * 0.42, r * 0.2, MD, { w: 800 });
}
/** The prop challenge card; burn 0→1 tints it red and stamps «سوخت». */
function challenge(t, burn) {
  card(-190, -150, 380, 300, PLATE, 'rgba(255,255,255,0.14)', 34);
  chip('چالش پراپ', 0, -88, 34, INKD, LIME);
  shadowed(() => circle(0, 30, 62, AMB), 20, 6, 0.3); txt('$', 0, 34, 70, INKD, { w: 900 });
  if (burn > 0) {
    cv.save(); cv.globalAlpha *= cl(burn) * 0.55; rrect(-190, -150, 380, 300, 34, R); cv.restore();
    for (let i = 0; i < 7; i++) { const x = -160 + i * 53, h = (40 + 30 * Math.sin(t * 13 + i * 1.7)) * cl(burn); cv.fillStyle = i % 2 ? AMB : R; cv.beginPath(); cv.moveTo(x - 22, 150); cv.quadraticCurveTo(x - 10, 150 - h * 0.6, x, 150 - h); cv.quadraticCurveTo(x + 10, 150 - h * 0.6, x + 22, 150); cv.closePath(); cv.fill(); }
    const ks = pop(burn * 0.8, 16, 0.5); at(0, 10, lerp(1.8, 1, cl(ks)), cl(ks * 3), () => { shadowed(() => rrect(-150, -56, 300, 112, 20, R), 30, 8, 0.4); rrect(-138, -44, 276, 88, 14, null, WHITE, 5); txt('سوخت', 0, 6, 72, WHITE); }, -0.14);
  }
}
/** A trade tile: 0 = not shown yet (grey), 1 = win (✓), −1 = loss (✕). */
function tile(s, res) {
  rrect(-s / 2, -s / 2, s, s, s * 0.22, res === 0 ? 'rgba(127,120,160,0.25)' : res > 0 ? G : R);
  if (res > 0) { cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = s * 0.12; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-s * 0.2, 0); cv.lineTo(-s * 0.05, s * 0.15); cv.lineTo(s * 0.22, -s * 0.15); cv.stroke(); cv.restore(); }
  if (res < 0) { line(-s * 0.17, -s * 0.17, s * 0.17, s * 0.17, WHITE, s * 0.12); line(s * 0.17, -s * 0.17, -s * 0.17, s * 0.17, WHITE, s * 0.12); }
}
/** The drawdown staircase in a chart card: each loss drops `risk`% (fixed risk on the start balance). */
const DD_Y = (p) => -170 + p * 33;   // p = drawdown in %
function stairs(t, risk, t0, t1, col, n = 5, o = {}) {
  const k = cl((t - t0) / (t1 - t0)), m = Math.min(n, Math.floor(k * n + 0.0001) + (k > 0 ? 1 : 0));
  const xs = (i) => -310 + i * 120; let pts = [[-370, DD_Y(0)]];
  for (let i = 0; i < m; i++) { const x = xs(i) + 40, p0 = risk * i, p1 = risk * (i + 1), kk = cub(cl((k * n - i) * 2.5)); pts.push([x, DD_Y(p0)], [x, DD_Y(lerp(p0, p1, kk))]); if (kk >= 1) pts.push([x + (i < n - 1 ? 120 : 60), DD_Y(p1)]); }
  if (m === 0) pts.push([-310, DD_Y(0)]);
  trace(pts, 1, col, 10); const e = pts[pts.length - 1]; circle(e[0], e[1], 13, col);
  if (o.labels) for (let i = 0; i < m; i++) { const kk = cub(cl((k * n - i) * 2.5)); if (kk > 0.5) txt('−' + pct(risk), xs(i) + 86, DD_Y(risk * (i + 0.5)), 30, col, { w: 800, alpha: cub((kk - 0.5) * 2), dir: 'ltr' }); }
  return { e, k };
}
function ddCard(fill) {
  card(-430, -240, 860, 480, fill, 'rgba(255,255,255,0.12)', 36);
  [0, 5, 10].forEach((p) => { line(-400, DD_Y(p), 400, DD_Y(p), 'rgba(255,255,255,0.06)', 2); if (p) txt('−' + pct(p), 395, DD_Y(p) - 20, 26, MD, { align: 'right', w: 700, dir: 'ltr' }); });
}
function propLine(a, label = true) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a; line(-400, DD_Y(10), 400, DD_Y(10), R, 5, [16, 10]); if (label) chip('حد افت رایج پراپ‌ها: ' + pct(10), -170, DD_Y(10) + 40, 28, WHITE, R); cv.restore(); }

// ---- «وین‌ریت استراتژیم ۶۰ درصد بود… پس چرا چالش پراپمو سوزوندم؟» ----
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6), mv = cub(k01(t, ws(5) - 0.1, 0.45));
  at(lerp(0, 220, mv), -60, lerp(1, 0.68, mv) * cl(k, 0, 1.1), cl(k), () => donut(200, cub(k01(t, -0.2, 0.9))));
  const kc = pop(t - ws(7) + 0.05, 12, 0.6);
  if (kc > 0) at(-210, -60, cl(kc, 0, 1.15), cl(kc), () => challenge(t, k01(t, ws(9) - 0.05, 0.4)), 0.04 * Math.sin(t * 3));
}
// ---- «بیا یه حساب ساده کنیم»: a calculator ----
const KEYS = ['۷', '۸', '۹', '÷', '۴', '۵', '۶', '×', '۱', '۲', '۳', '−', '۰', '٪', '=', '+'];
function calcArt(t, th) {
  const k = pop(t - T.calc - 0.05, 12, 0.55); if (k <= 0) return;
  at(0, -20, cl(k, 0, 1.15), cl(k), () => {
    shadowed(() => rrect(-180, -250, 360, 500, 44, INKD), 50, 18, 0.4);
    rrect(-150, -220, 300, 110, 22, '#2A2340'); txt(pct(60), 128, -165, 64, LIME, { align: 'right' });
    KEYS.forEach((s, i) => { const c = i % 4, r = Math.floor(i / 4), x = 105 - c * 70, y = -50 + r * 70, hit = (i === 14 && t > ws(12)) || (i === 13 && t > ws(11) && t < ws(12));
      rrect(x - 30, y - 30, 60, 60, 16, s === '=' ? VIO : hit ? LIME : PLATE); txt(s, x, y + 3, 30, s === '=' ? WHITE : hit ? INKD : WHITE, { w: 800 }); });
  }, -0.05);
}
// ---- «وین‌ریت ۶۰ درصد یعنی از هر ۱۰ تا معامله، ۴ تاش ضرره» ----
const EVEN = [1, 1, -1, 1, -1, 1, 1, -1, 1, -1];
function fourArt(t, th) {
  for (let i = 0; i < 10; i++) {
    const k = pop(t - ws(21) - i * 0.05, 14, 0.55); if (k <= 0) continue;
    const c = i % 5, r = Math.floor(i / 5), x = 320 - c * 160, y = -150 + r * 170, rev = t >= ws(24) - 0.05 + (EVEN[i] < 0 ? 0 : 0.25);
    at(x, y, cl(k, 0, 1.2) * (rev ? lerp(1.15, 1, cub(k01(t, ws(24) - 0.05 + (EVEN[i] < 0 ? 0 : 0.25), 0.25))) : 1), cl(k), () => shadowed(() => tile(130, rev ? EVEN[i] : 0), 24, 8, 0.15));
  }
  popIn(t, ws(25), () => chip('۶ سود', 0, 0, 42, WHITE, G), 140, 200);
  popIn(t, ws(26), () => chip('۴ ضرر', 0, 0, 42, WHITE, R), -140, 200);
}
// ---- «ولی بازار این ۴ تا رو مرتب پخش نمی‌کنه»: expected vs real ----
const REAL = [1, 1, 1, -1, -1, -1, -1, 1, 1, 1];
const SLOT = (() => { const w = [0, 1, 2, 7, 8, 9], l = [3, 4, 5, 6]; let wi = 0, li = 0; return EVEN.map((v) => (v > 0 ? w[wi++] : l[li++])); })();
function spreadArt(t, th) {
  const X = (i) => 378 - i * 84, k1 = pop(t - T.spread - 0.05, 12, 0.6);
  if (k1 > 0) at(0, -170, 1, cl(k1), () => { EVEN.forEach((v, i) => at(X(i), 0, 1, 1, () => tile(70, v))); popIn(t, ws(33), () => chip('انتظار', 0, 0, 34, INKD, rgba(WHITE, 0.85)), 0, -100); });
  const k2 = pop(t - ws(34) + 0.1, 12, 0.6); if (k2 <= 0) return;
  const km = cub(k01(t, ws(34) + 0.05, 0.6));
  at(0, 120, 1, cl(k2), () => {
    EVEN.forEach((v, i) => at(lerp(X(i), X(SLOT[i]), km), -80 * (1 - cl(k2)), 1, 1, () => tile(70, v)));
    const kr = cub(k01(t, ws(35) + 0.3, 0.35)); if (kr > 0) { cv.save(); cv.globalAlpha *= kr; cv.shadowColor = rgba(R, 0.8); cv.shadowBlur = 20; rrect(X(6) - 52, -52, X(3) - X(6) + 104, 104, 30, null, R, 7); cv.restore(); }
    popIn(t, ws(35), () => chip('واقعیت', 0, 0, 34, WHITE, R), 0, 110);
  });
}
// ---- «توی ۲۰۰ تا معامله، به احتمال بیشتر از ۷۰ درصد، حداقل یه بار ۵ تا ضرر پشت‌سرهم می‌خوری» ----
const SEQ = (() => { const s = Array.from({ length: 200 }, (_, i) => (rnd(i * 7.13 + 3) < 0.4 ? -1 : 1)); s[125] = 1; for (let i = 126; i <= 130; i++) s[i] = -1; s[131] = 1; return s; })();
function oddsArt(t, th) {
  const t0 = ws(38) - 0.05, t1 = ws(40) + 0.6, f = cl((t - t0) / (t1 - t0)), io = f < 0.5 ? 4 * f ** 3 : 1 - Math.pow(-2 * f + 2, 3) / 2, n = Math.floor(io * 200 + 0.0001);
  const kh = cub(k01(t, ws(51) - 0.05, 0.35));
  if (t >= t0) at(0, 0, 1, 1, () => {
    card(-450, -250, 900, 500, INKD, null, 34);
    for (let i = 0; i < n; i++) { const c = i % 20, r = Math.floor(i / 20), x = 399 - c * 42, y = -189 + r * 42, run = i >= 126 && i <= 130;
      cv.save(); cv.globalAlpha *= run ? 1 : lerp(1, 0.28, kh); circle(x, y, 15, SEQ[i] > 0 ? G : R); cv.restore(); }
    if (kh > 0) { const y = -189 + 6 * 42; cv.save(); cv.globalAlpha *= kh; cv.shadowColor = rgba(WHITE, 0.8); cv.shadowBlur = 16; rrect(399 - 10 * 42 - 26, y - 26, 4 * 42 + 52, 52, 26, null, WHITE, 6); cv.restore(); }
    popIn(t, ws(53), () => chip('۵ ضرر پشت‌سرهم', 0, 0, 34, WHITE, R), 0, 300);
    note('نمونه؛ فرض: وین‌ریت ' + pct(60) + ' و معامله‌های مستقل؛ احتمال دقیق: ' + pct(71.4), 370, '#3E4D12');
  });
}
// ---- «با ریسک ۲ درصد، ۵ تا ضرر یعنی حدود ۱۰ درصد افت» ----
function risk2Art(t, th) {
  const k = pop(t - T.risk2 - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    ddCard(PLATE); chip('ریسک ' + pct(2), 300, -195, 30, INKD, LIME);
    stairs(t, 2, ws(63) - 0.05, ws(66), R, 5, { labels: true });
    popIn(t, ws(68), () => { shadowed(() => rrect(-120, -50, 240, 100, 26, R), 30, 10, 0.4); txt('−' + pct(10), 0, 4, 64, WHITE, { dir: 'ltr' }); }, -200, DD_Y(10) - 90, 0.5);
  });
}
// ---- «همون حدی که توی خیلی از پراپ‌ها حسابتو می‌بنده» ----
function propArt(t, th) {
  ddCard(INKD); chip('ریسک ' + pct(2), 300, -195, 30, INKD, LIME);
  stairs(t, 2, -10, -9, R, 5, { labels: true });
  const kl = cub(k01(t, ws(72), 0.4)); propLine(kl);
  const kb = pop(t - ws(80) - 0.05, 14, 0.5);
  if (kb > 0) at(60, -40, lerp(1.8, 1, cl(kb)), cl(kb * 3), () => { const w = measure('حساب بسته شد', 64) + 90; shadowed(() => rrect(-w / 2, -60, w, 120, 24, R), 30, 10, 0.5); rrect(-w / 2 + 12, -48, w - 24, 96, 16, null, WHITE, 5); txt('حساب بسته شد', 0, 6, 64, WHITE); }, -0.1);
}
// ---- «یعنی استراتژیت خراب نبود؛ ریسکت خراب بود» ----
function twistArt(t, th) {
  [['استراتژی', 85, 1], ['ریسک', 87, -1]].forEach(([name, wi, ok], i) => {
    const k = pop(t - (i ? ws(86) : ws(83)) + 0.05, 12, 0.6); if (k <= 0) return;
    at(i ? -210 : 210, 0, lerp(0.85, 1, cl(k)), cl(k), () => {
      card(-180, -200, 360, 400, INKD, null, 40); txt(name, 0, -110, 60, WHITE);
      if (ok > 0) check(0, 60, 90, G, pop(t - ws(wi) + 0.02, 13, 0.5)); else cross(0, 60, 90, R, pop(t - ws(wi) + 0.02, 13, 0.5));
    }, (i ? -1 : 1) * 0.04);
  });
}
// ---- «با ریسک ۱ درصد، همون ۵ تا ضرر می‌شه ۵ درصد، و هنوز توی بازی‌ای» ----
function risk1Art(t, th) {
  const k = pop(t - T.risk1 - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    ddCard(INKD); propLine(1, false);
    cv.save(); cv.globalAlpha *= 0.45; stairs(t, 2, -10, -9, R, 5); cv.restore();
    const { e } = stairs(t, 1, ws(93), ws(98), G, 5, { labels: true });
    chip('ریسک ' + pct(2), 300, -195, 26, WHITE, rgba(R, 0.7)); chip('ریسک ' + pct(1), 140, -195, 26, WHITE, G);
    popIn(t, ws(99), () => { shadowed(() => rrect(-110, -46, 220, 92, 24, G), 30, 10, 0.4); txt('−' + pct(5), 0, 4, 56, WHITE, { dir: 'ltr' }); }, 290, DD_Y(5) + 75, 0.5);
    popIn(t, ws(102), () => chip('هنوز توی بازی', 0, 0, 36, INKD, LIME), -170, DD_Y(10) + 45, 0.55);
    check(e[0] + 62, e[1] - 50, 34, G, pop(t - ws(103), 13, 0.5));
  });
}
// ---- «ولی عدد واقعیِ استراتژی خودت چنده؟ با حدس پیدا نمی‌شه؛ با بک‌تست پیدا می‌شه» ----
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function realArt(t, th) {
  const k = pop(t - T.real - 0.05, 12, 0.6);
  if (k > 0) at(210, -40, cl(k, 0, 1.15), cl(k), () => {
    const roll = t < ws(113), face = roll ? 1 + Math.floor(rnd(Math.floor(t * 12)) * 6) : 5;
    at(0, -20, 1, 1, () => { shadowed(() => rrect(-120, -120, 240, 240, 46, WHITE), 40, 14, 0.35); PIPS[face].forEach(([x, y]) => circle(x * 62, y * 62, 22, INKD)); }, roll ? Math.sin(t * 9) * 0.3 : 0.12);
    chip('حدس', 0, 180, 40, WHITE, 'rgba(255,255,255,0.2)');
    cross(110, -130, 46, R, pop(t - ws(114) + 0.02, 14, 0.5));
  });
  const kb = pop(t - ws(117) + 0.05, 12, 0.6);
  if (kb > 0) at(-210, -40, cl(kb, 0, 1.15), cl(kb), () => {
    card(-150, -140, 300, 240, INKD, null, 34); trace([[-110, 50], [-60, 10], [-20, 30], [30, -30], [80, -10], [110, -70]], 1, LIME, 9);
    chip('بک‌تست', 0, 160, 40, INKD, LIME);
    check(110, -130, 46, G, pop(t - ws(119), 14, 0.5));
  });
}
// ---- «توی بک‌تست‌لب استراتژیتو روی بازار واقعیِ گذشته تست می‌کنی» (f1: the gold replay) ----
const RR = [520, 200, 560, 620], DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));
function labArt(t, th) {
  const k = pop(t - T.lab - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 560, x = -280, y = -300, h = shot(FLIP(t, T.lab, T.analytics + 0.3, DK), RR, x, y, w);
    if (IMG.icon) popIn(t, ws(123), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -55, -55, 110, 110); }, x + w, y, 0.5);
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y + h + 52, 'rgba(255,255,255,0.75)');
  });
}
// ---- «و آنالیزش بهت می‌گه بیشترین ضررهای پشت‌سرهمت چندتاست و بدترین افتت چقدره» (Analytics: f1, k1) ----
const RWL = [36, 196, 556, 266], QWL = [50, 378, 530, 30], RMC = [325, 605, 545, 92], QMC = [331, 619, 260, 68];
function analyticsArt(t, th) {
  const k = pop(t - T.analytics - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 900, x = -450, y = -340, h = shot('wl', RWL, x, y, w);
    ringIn(RWL, QWL, x, y, w, cub(k01(t, ws(139), 0.35)));
    const k2 = pop(t - ws(145) + 0.1, 12, 0.6);
    if (k2 > 0) at(0, (1 - cl(k2)) * 50, 1, cl(k2), () => { const y2 = y + h + 60, h2 = shot('mc', RMC, x, y2, w); ringIn(RMC, QMC, x, y2, w, cub(k01(t, ws(146), 0.35)));
      note('صفحه‌ی واقعی بک‌تست‌لب · آنالیز', y2 + h2 + 50, '#3E4D12'); });
  });
}
// ---- «اول ریسکتو اینجا تنظیم کن، بعد پول چالش رو بده» ----
const SL = [[0.5, 300], [1, 100], [2, -100], [3, -300]];
function firstArt(t, th) {
  const k = pop(t - T.first - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, -170, cl(k, 0, 1.12), cl(k), () => {
    card(-420, -130, 840, 260, '#5634E0', 'rgba(255,255,255,0.18)', 36);
    chip('۱', 340, -80, 30, INKD, LIME); txt('ریسک هر معامله', 290, -80, 34, WHITE, { align: 'right' });
    rrect(-330, 10, 660, 20, 10, 'rgba(255,255,255,0.25)');
    SL.forEach(([v, x]) => txt(pct(v), x, 76, 28, 'rgba(255,255,255,0.8)', { w: 800 }));
    const km = cub(k01(t, ws(151), ws(153) - ws(151) + 0.1)), kx = lerp(-100, 100, km);
    rrect(kx, 10, 330 - kx, 20, 10, LIME); shadowed(() => circle(kx, 20, 30, WHITE), 20, 6, 0.35); circle(kx, 20, 12, km >= 1 ? G : R);
  });
  const k2 = pop(t - ws(154) + 0.05, 12, 0.6); if (k2 <= 0) return;
  at(0, 230, cl(k2, 0, 1.12), cl(k2), () => {
    card(-420, -110, 840, 220, '#5634E0', 'rgba(255,255,255,0.18)', 36);
    chip('۲', 340, -50, 30, INKD, LIME); txt('خرید چالش', 290, -50, 40, WHITE, { align: 'right' });
    shadowed(() => circle(-300, 0, 56, AMB), 16, 5, 0.3); txt('$', -300, 4, 62, INKD);
    check(-300, -70, 30, G, pop(t - ws(158), 13, 0.5));
  });
}
// ---- «شروعش رایگانه؛ لینک توی بیو» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  if (IMG.icon) at(0, -300, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  popIn(t, ws(160), () => chip('شروع رایگان', 0, 0, 68, LIME, INKD), 0, -20, 0.55, -0.03);
  popIn(t, ws(161), () => { shadowed(() => rrect(-270, -72, 540, 144, 72, WHITE)); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 190, 0.6);
}
function endArtK(t, th) { endArt(t, th, { t0: T.end, free: T.end + 0.4, link: T.end + 0.7 }); }

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1230, 1], groups: [
      { at: 0, lines: [L_(280, 104, WHITE, [['وین‌ریتِ', 0], ['استراتژیم', 1]]), L_(450, 180, WHITE, [[pct(60), [2, 3], { c: LIME }], ['بود…', 4]])] },
      { at: 5, lines: [L_(280, 110, WHITE, [['پس', 5], ['چرا', 6, { c: LIME }]]), L_(420, 110, WHITE, [['چالش', 7], ['پراپمو', 8, { c: LIME }]]), L_(570, 130, WHITE, [['سوزوندم؟', 9, { hl: R, ht: WHITE }]])] }] },
    { k: 'calc', bg: VIO, wipe: 'iris', art: 'calc', kpos: [CX, 1240, 1], groups: [
      { at: 10, lines: [L_(360, 120, WHITE, [['بیا', 10], ['یه', 11], ['حساب', 12, { hl: LIME, ht: INKD }]]), L_(510, 120, WHITE, [['ساده', 13], ['کنیم.', 14]])] }] },
    { k: 'four', bg: PAPER, wipe: 'up', art: 'four', kpos: [CX, 1240, 1], groups: [
      { at: 15, lines: [L_(270, 104, INKP, [['وین‌ریت', 15], [pct(60), [16, 17], { c: G }]]), L_(400, 104, INKP, [['یعنی', 18], ['از', 19], ['هر', 20]]), L_(530, 110, INKP, [['۱۰', 21, { c: VIO }], ['تا', 22], ['معامله،', 23]])] },
      { at: 24, lines: [L_(380, 150, INKP, [['۴', 24, { hl: R, ht: WHITE }], ['تاش', 25]]), L_(550, 150, INKP, [['ضرره.', 26, { c: R }]])] }] },
    { k: 'spread', bg: INKD, wipe: 'right', art: 'spread', kpos: [CX, 1250, 1], groups: [
      { at: 27, lines: [L_(280, 110, WHITE, [['ولی', 27], ['بازار', 28, { c: LIME }]]), L_(420, 104, WHITE, [['این', 29], ['۴', 30, { c: R }], ['تا', 31], ['رو', 32]]), L_(560, 104, WHITE, [['مرتب', 33], ['پخش', 34, { hl: R, ht: WHITE }], ['نمی‌کنه.', [35, 36]]])] }] },
    { k: 'odds', bg: LIME, wipe: 'iris', art: 'odds', kpos: [CX, 1250, 1], groups: [
      { at: 37, lines: [L_(330, 120, INKD, [['توی', 37], ['۲۰۰', 38, { hl: INKD, ht: LIME }], ['تا', 39], ['معامله،', 40]])] },
      { at: 41, lines: [L_(270, 100, INKD, [['به', 41], ['احتمال', 42], ['بیشتر', 43], ['از', 44]]), L_(430, 180, INKD, [[pct(70), [45, 46], { hl: VIO, ht: WHITE }]])] },
      { at: 47, lines: [L_(250, 96, INKD, [['حداقل', [47, 48]], ['یه', 49], ['بار', 50]]), L_(380, 120, INKD, [['۵', 51, { hl: R, ht: WHITE }], ['تا', 52], ['ضرر', 53]]), L_(520, 104, INKD, [['پشت‌سرهم', [54, 56]], ['می‌خوری.', [57, 58]]])] }] },
    { k: 'risk2', bg: INKD, wipe: 'up', art: 'risk2', kpos: [CX, 1250, 1.12], groups: [
      { at: 59, lines: [L_(270, 110, WHITE, [['با', 59], ['ریسک', 60], [pct(2), [61, 62], { c: LIME }]]), L_(400, 104, WHITE, [['۵', 63], ['تا', 64], ['ضرر', 65, { c: R }]]), L_(540, 110, WHITE, [['یعنی', 66], ['حدود', 67], [pct(10), [68, 69], { hl: R, ht: WHITE }], ['افت.', 70]])] }] },
    { k: 'prop', bg: R, wipe: 'cut', art: 'prop', kpos: [CX, 1250, 1.12], groups: [
      { at: 71, lines: [L_(270, 110, WHITE, [['همون', 71], ['حدی', 72], ['که', 73]]), L_(400, 100, WHITE, [['توی', 74], ['خیلی', 75], ['از', 76], ['پراپ‌ها', [77, 78], { hl: INKD, ht: WHITE }]]), L_(545, 120, WHITE, [['حسابتو', 79], ['می‌بنده.', [80, 81]]])] }] },
    { k: 'twist', bg: LIME, wipe: 'iris', art: 'twist', kpos: [CX, 1270, 1], groups: [
      { at: 82, lines: [L_(290, 110, INKD, [['یعنی', 82], ['استراتژیت', 83]]), L_(430, 120, INKD, [['خراب', 84], ['نبود؛', 85, { hl: G, ht: WHITE }]])] },
      { at: 86, lines: [L_(330, 160, INKD, [['ریسکت', 86, { hl: R, ht: WHITE }]]), L_(510, 150, INKD, [['خراب', 87], ['بود.', 88]])] }] },
    { k: 'risk1', bg: PAPER, wipe: 'up', art: 'risk1', kpos: [CX, 1260, 1.12], groups: [
      { at: 89, lines: [L_(260, 104, INKP, [['با', 89], ['ریسک', 90], [pct(1), [91, 92], { hl: G, ht: WHITE }]]), L_(390, 100, INKP, [['همون', 93], ['۵', 94], ['تا', 95], ['ضرر', 96, { c: R }]]), L_(520, 110, INKP, [['می‌شه', [97, 98]], [pct(5), [99, 100], { c: G }]])] },
      { at: 101, lines: [L_(350, 120, INKP, [['و', 101], ['هنوز', 102]]), L_(500, 130, INKP, [['توی', 103], ['بازی‌ای.', 104, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'real', bg: VIO, wipe: 'right', art: 'real', kpos: [CX, 1260, 1], groups: [
      { at: 105, lines: [L_(280, 104, WHITE, [['ولی', 105], ['عدد', 106], ['واقعیِ', 107, { c: LIME }]]), L_(420, 110, WHITE, [['استراتژی', 108], ['خودت', 109], ['چنده؟', 110, { hl: LIME, ht: INKD }]])] },
      { at: 111, lines: [L_(290, 104, WHITE, [['با', 111], ['حدس', 112, { hl: R, ht: WHITE }], ['پیدا', 113], ['نمی‌شه؛', [114, 115]]]), L_(440, 110, WHITE, [['با', 116], ['بک‌تست', [117, 118], { hl: LIME, ht: INKD }], ['پیدا', 119], ['می‌شه.', [120, 121]]])] }] },
    { k: 'lab', bg: INKD, wipe: 'up', art: 'lab', kpos: [CX, 1275, 1], groups: [
      { at: 122, lines: [L_(250, 100, WHITE, [['توی', 122], ['بک‌تست‌لب', [123, 125], { c: LIME }]]), L_(370, 100, WHITE, [['استراتژیتو', 126], ['روی', 127]]), L_(490, 100, WHITE, [['بازار', 128], ['واقعیِ', 129], ['گذشته', 130, { hl: LIME, ht: INKD }]]), L_(610, 100, WHITE, [['تست', 131], ['می‌کنی،', [132, 133]]])] }] },
    { k: 'analytics', bg: LIME, wipe: 'iris', art: 'analytics', kpos: [CX, 1270, 1], groups: [
      { at: 134, lines: [L_(240, 92, INKD, [['و', 134], ['آنالیزش', 135, { c: VIO }], ['بهت', 136], ['می‌گه', [137, 138]]]), L_(355, 96, INKD, [['بیشترین', 139], ['ضررهای', 140, { hl: R, ht: WHITE }]]), L_(470, 96, INKD, [['پشت‌سرهمت', [141, 142]], ['چندتاست', [143, 144]]]), L_(585, 96, INKD, [['و', 145], ['بدترین', 146], ['افتت', 147, { hl: R, ht: WHITE }], ['چقدره.', 148]])] }] },
    { k: 'first', bg: VIO, wipe: 'right', art: 'first', kpos: [CX, 1250, 1], groups: [
      { at: 149, lines: [L_(320, 120, WHITE, [['اول', 149, { hl: LIME, ht: INKD }], ['ریسکتو', 150]]), L_(470, 110, WHITE, [['اینجا', 151], ['تنظیم', 152], ['کن،', 153]])] },
      { at: 154, lines: [L_(320, 120, WHITE, [['بعد', 154, { hl: LIME, ht: INKD }], ['پول', 155]]), L_(470, 110, WHITE, [['چالش', 156], ['رو', 157], ['بده.', 158]])] }] },
    { k: 'cta', bg: LIME, wipe: 'up', art: 'cta', kpos: [CX, 1250, 1], groups: [
      { at: 159, lines: [L_(320, 130, INKD, [['شروعش', 159], ['رایگانه؛', 160, { hl: VIO, ht: WHITE }]]), L_(470, 110, INKD, [['لینک', 161], ['توی', 162], ['بیو.', 163]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, calc: calcArt, four: fourArt, spread: spreadArt, odds: oddsArt, risk2: risk2Art, prop: propArt, twist: twistArt, risk1: risk1Art,
    real: realArt, lab: labArt, analytics: analyticsArt, first: firstArt, cta: ctaArt, end: endArtK },
  shakes: [[ws(9), 10], [ws(68), 8], [ws(80), 14], [ws(87), 10], [ws(114), 6]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('وین‌ریتم', CX, 360, 110, WHITE); txt(pct(60), CX, 560, 230, LIME);
    const s = 'پس چرا چالشم سوخت؟', size = 92, w = measure(s, size); cv.save(); cv.translate(CX, 780); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, R); cv.restore(); txt(s, CX, 780, size, WHITE);
    at(CX + 220, 1180, 0.68, 1, () => donut(200));
    at(CX - 210, 1180, 1, 1, () => challenge(3, 1));
    at(CX, 1520, 1, 1, () => chip('یه حساب ساده', 0, 0, 50, INKD, LIME));
  },
});
