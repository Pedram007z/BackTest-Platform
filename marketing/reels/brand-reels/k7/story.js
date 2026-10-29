// k7 · «دیدی وقتی درگیر یه دردسر بزرگ تو زندگیت میشی…», the kinetic look (u-kit), on the user's voice.
// The drawn parts:
//   - a storm over a small figure, then the consolers' bubbles, which fall away;
//   - two puzzle pieces that click on «درکت کنه»;
//   - a winding path with a guide's easy line to the sun;
//   - a restless market chart that blurs without understanding (drawn, no prices);
//   - a magnifier that finds the experienced one;
//   - a timeline from ۲۰۱۵ to ۲۰۲۶;
//   - a past pattern that repeats as a ghost line;
//   - «باتجربه» pinned on you;
//   - the page's follow card.
// From «بک‌تست‌لب» on, the screens are the real platform in its dark theme (f1's captures):
//   - the gold replay (15-minute candles from 14 April 2025);
//   - the new-session window's data range «۱۱ دی ۱۳۹۳ تا ۱۵ مهر ۱۴۰۵» (1 Jan 2015 to 7 Oct 2026);
//   - the analytics' winners and losers from f1's 10-trade test session.
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, fill, rule, r = 36) { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.28)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(x, y, w, h, r, fill); cv.restore(); if (rule) rrect(x, y, w, h, r, null, rule, 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
/** a real screen (dark theme) on a dark plate with a shadow */
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'); cv.restore(); cv.save(); cv.globalAlpha *= a; rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); cv.restore(); crop(key, r, x, y, w, a); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
const note = (s, y, col, a = 1) => txt(s, 0, y, 28, col, { w: 700, alpha: a });
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];

// ---- drawn bits ----
/** a faceless figure standing on (0, 0) */
function person(x, y, s, col, o = {}) { at(x, y, s, o.a ?? 1, () => { circle(0, -178, 40, col); cv.fillStyle = col; cv.beginPath(); cv.roundRect(-58, -126, 116, 126, [58, 58, 14, 14]); cv.fill();
  if (o.lantern) { const g = cv.createRadialGradient(92, -50, 4, 92, -50, 120); g.addColorStop(0, rgba(AMB, 0.85)); g.addColorStop(1, rgba(AMB, 0)); cv.fillStyle = g; cv.fillRect(-40, -180, 260, 260); line(62, -70, 92, -70, col, 8); rrect(76, -70, 32, 44, 8, AMB); } }); }
function cloud(x, y, s, col) { at(x, y, s, 1, () => { cv.fillStyle = col; [[-100, 10, 70], [-30, -30, 92], [64, -6, 78], [130, 24, 56], [0, 30, 80]].forEach(([cx, cy, r]) => { cv.beginPath(); cv.arc(cx, cy, r, 0, Math.PI * 2); cv.fill(); }); rrect(-160, 20, 330, 70, 35, col); }); }
function bolt(x, y, s, a) { if (a <= 0) return; at(x, y, s, a, () => { cv.save(); cv.shadowColor = rgba(AMB, 0.9); cv.shadowBlur = 40; cv.fillStyle = AMB; cv.beginPath(); cv.moveTo(10, -80); cv.lineTo(-30, 10); cv.lineTo(0, 10); cv.lineTo(-20, 90); cv.lineTo(40, -10); cv.lineTo(8, -10); cv.lineTo(30, -80); cv.closePath(); cv.fill(); cv.restore(); }); }
function bubble(s, x, y, k, col = WHITE, ink = INKP, tail = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { const w = measure(s, 46) + 70; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.18)'; cv.shadowBlur = 24; cv.shadowOffsetY = 8; rrect(-w / 2, -46, w, 92, 46, col);
  cv.fillStyle = col; cv.beginPath(); cv.moveTo(tail * 10, 38); cv.lineTo(tail * 40, 76); cv.lineTo(tail * 46, 34); cv.fill(); cv.restore(); txt(s, 0, 4, 46, ink, { w: 800 }); }); }
const BARS = Array.from({ length: 70 }, (_, i) => { const base = 100 + 30 * Math.sin(i * 0.23) + i * 0.6, o = base + (rnd(i) - 0.5) * 14, c = base + (rnd(i * 1.7) - 0.5) * 18; return [o, Math.max(o, c) + rnd(i * 2.1) * 9, Math.min(o, c) - rnd(i * 3.3) * 9, c]; });

// ---- the hook: a storm over you ----
function hookArt(t, th) {
  const k = pop(t + 0.3, 12, 0.6); if (k <= 0) return;
  const big = pop(t - ws(6) + 0.05, 10, 0.5);
  at(0, 0, cl(k), cl(k), () => {
    // the rain
    cv.save(); cv.globalAlpha *= 0.55; for (let i = 0; i < 46; i++) { const x = -330 + rnd(i) * 660, y = -160 + ((t * 950 + rnd(i * 7) * 520) % 520); line(x, y, x - 14, y + 46, '#8C9BC6', 4); } cv.restore();
    person(0, 380, 1.15, '#B9B3D1');
    const kb = Math.max(0, 1 - (t - ws(4)) * 3) * (t >= ws(4) ? 1 : 0) + Math.max(0, 1 - (t - ws(6)) * 2.5) * (t >= ws(6) ? 1 : 0);
    bolt(-60, -10, 1.3, cl(kb)); bolt(150, -30, 1.0, cl(kb * (t >= ws(6) ? 1 : 0)));
    cloud(0, -230, lerp(1.05, 1.5, cl(big)), '#3A3550');
  });
}
// ---- «همه بهت دلداری میدن» ----
const SAY = [['غصه نخور', -230, -260, 1], ['درست میشه', 230, -150, -1], ['قوی باش', -250, 40, 1], ['بی‌خیال!', 240, 190, -1]];
function consoleArt(t, th) {
  const k = pop(t - T.console - 0.05, 12, 0.6); if (k <= 0) return;
  person(0, 420, 1.1, INKP, { a: cl(k) });
  SAY.forEach(([s, x, y, side], i) => bubble(s, x, y, pop(t - (T.console + 0.15 + i * 0.32), 13, 0.55), WHITE, INKP, side));
}
// ---- «اما کسی درکت نمی‌کنه»: the bubbles fall, you are alone ----
function aloneArt(t, th) {
  const k = cub(k01(t, T.alone - 0.05, 0.4)); if (k <= 0) return;
  const g = cv.createRadialGradient(0, 300, 20, 0, 300, 420); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = g; cv.fillRect(-540, -200, 1080, 900);
  person(0, 420, 1.1, '#B9B3D1', { a: k });
  SAY.forEach(([s, x, y, side], i) => { const d = Math.max(0, t - T.alone - i * 0.12), fy = y + d * d * 900, a = 1 - cl(d / 0.9); if (a <= 0) return; cv.save(); cv.globalAlpha *= a; bubble(s, x + side * d * 40, fy, 1, '#3A3550', '#9C95B8', side); cv.restore(); });
  popIn(t, ws(16), () => { circle(0, 0, 58, R); txt('؟', 0, 6, 80, WHITE); }, 120, 120, 0.5);
}
// ---- «اما اگه کسی واقعاً درکت کنه، قضیه خیلی فرق می‌کنه»: two pieces that fit ----
function trulyArt(t, th) {
  const k = pop(t - T.truly - 0.05, 12, 0.6); if (k <= 0) return;
  const j = cub(k01(t, ws(23) - 0.35, 0.45)), d = (1 - j) * 170, glow = cl(1 - (t - ws(23) - 0.1) * 1.5) * (t > ws(23) + 0.1 ? 1 : 0);
  at(0, 0, cl(k, 0, 1.1), cl(k), () => {
    const kf = cub(k01(t, ws(27), 0.4));
    at(d, 0, 1, 1, () => { rrect(0, -150, 300, 300, 34, mixC('#8A84A3', VIO, kf)); circle(4, 0, 54, LIME); });
    at(-d, 0, 1, 1, () => { rrect(-300, -150, 300, 300, 34, INKD); circle(4, 0, 50, INKD); });
    if (glow > 0) { cv.save(); cv.globalAlpha *= glow; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r0 = 190 + (1 - glow) * 120; line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * (r0 + 50), Math.sin(a) * (r0 + 50), INKD, 10); } cv.restore(); }
    // the pieces' own words
    txt('تو', 150 + d, 0, 64, WHITE); txt('اون', -150 - d, 0, 64, LIME);
    if (kf > 0) for (let i = 0; i < 14; i++) { const a = rnd(i) * Math.PI * 2, r = 200 + rnd(i * 3) * 160 * kf; at(Math.cos(a) * r, Math.sin(a) * r, 1, kf * (1 - k01(t, ws(27) + 0.8, 0.5)), () => circle(0, 0, 8 + rnd(i * 5) * 8, i % 2 ? VIO : INKD)); }
  });
}
// ---- «با تجربه‌ش کمکت می‌کنه به راحت‌ترین شکل ممکن به حال خوبت برگردی»: the easy way out ----
const MAZE = [[-380, 320], [-380, 120], [-120, 120], [-120, 260], [140, 260], [140, 40], [-300, 40], [-300, -140], [380, -140], [380, -320]];
const EASY = [[-380, 320], [-150, 120], [120, -60], [380, -320]];
function helpArt(t, th) {
  const k = pop(t - T.help - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    trace(MAZE, 1, 'rgba(255,255,255,0.22)', 26);
    cv.save(); cv.setLineDash([2, 30]); trace(MAZE, 1, 'rgba(255,255,255,0.5)', 10); cv.restore();
    cloud(-380, 360, 0.42, '#3A3550');
    const ke = cub(k01(t, ws(34) - 0.1, ws(37) - ws(34) + 0.2)); if (ke > 0) trace(EASY, ke, LIME, 14);
    const ks = pop(t - ws(40) + 0.1, 12, 0.5); if (ks > 0) at(380, -320, cl(ks, 0, 1.2), cl(ks), () => { cv.save(); cv.shadowColor = rgba(AMB, 0.9); cv.shadowBlur = 50; circle(0, 0, 80, AMB); cv.restore(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + t; line(Math.cos(a) * 100, Math.sin(a) * 100, Math.cos(a) * 130, Math.sin(a) * 130, AMB, 8); } });
    // you, walking the easy line
    const kw = cub(k01(t, ws(36), ws(41) - ws(36) + 0.2)); const seg = EASY.length - 1, f = kw * seg, si = Math.min(seg - 1, Math.floor(f)), e = f - si;
    const px = lerp(EASY[si][0], EASY[si + 1][0], e), py = lerp(EASY[si][1], EASY[si + 1][1], e); person(px, py + 10, 0.45, WHITE);
    popIn(t, ws(30), () => chip('با تجربه‌ش', 0, 0, 36, INKD, LIME), 200, 330);
  });
}
// ---- «بازارای مالی هم همینه» ----
function marketsArt(t, th) {
  const k = pop(t - T.markets - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => { card(-460, -320, 920, 640, PLATE, 'rgba(255,255,255,0.08)');
    const n = Math.floor(cl((t - T.markets) / 1.4) * 40); candleChart(BARS.slice(0, 40), n, [-420, -260, 420, 270], { N: 40 }); });
}
// ---- «بازار اونقدر باهوش و پویا شده که نمی‌شه بدون درکش کاری کرد» ----
function smartArt(t, th) {
  const k = pop(t - T.smart - 0.05, 12, 0.6); if (k <= 0) return;
  const fog = cub(k01(t, ws(57) - 0.1, 0.5)), sp = 1 + 3 * cub(k01(t, ws(51), 1.2));
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-460, -320, 920, 640, INKD, 'rgba(255,255,255,0.1)');
    cv.save(); cv.beginPath(); cv.roundRect(-460, -320, 920, 640, 36); cv.clip(); if (fog > 0) cv.filter = `blur(${fog * 10}px)`;
    const off = (t - T.smart) * 6 * sp, i0 = Math.floor(off) % 30;
    const bars = Array.from({ length: 34 }, (_, q) => { const i = q + Math.floor(off), b = 100 + 40 * Math.sin(i * 0.5) + 25 * Math.sin(i * 1.7 + 1) + (rnd(i) - 0.5) * 30; const o = b + (rnd(i * 2.3) - 0.5) * 30, c = b + (rnd(i * 4.1) - 0.5) * 36; return [o, Math.max(o, c) + rnd(i * 5.3) * 14, Math.min(o, c) - rnd(i * 6.7) * 14, c]; });
    candleChart(bars, 34, [-430 - (off % 1) * 25, -260, 430, 270], { N: 34, lo: 20, hi: 190 });
    cv.filter = 'none'; if (fog > 0) { cv.fillStyle = `rgba(16,12,28,${0.45 * fog})`; cv.fillRect(-460, -320, 920, 640); }
    cv.restore();
    popIn(t, ws(51), () => chip('باهوش', 0, 0, 40, INKD, LIME), -250, -380);
    popIn(t, ws(53), () => chip('پویا', 0, 0, 40, VIO, WHITE), 250, -380);
    const kq = pop(t - ws(58) + 0.05, 12, 0.5); if (kq > 0) at(0, 0, cl(kq, 0, 1.2), cl(kq), () => { circle(0, 0, 110, LIME); txt('؟', 0, 12, 150, INKD); });
    cross(300, 220, 52, R, pop(t - ws(59), 14, 0.5));
  });
}
// ---- «پس باید بریم دنبال تجربه‌ی همون آدمی که درک کامل رو داره» ----
const ROW = [-340, -170, 0, 170, 340];
function seekArt(t, th) {
  const k = pop(t - T.seek - 0.05, 12, 0.6); if (k <= 0) return;
  const found = cub(k01(t, ws(69) - 0.05, 0.3));
  ROW.forEach((x, i) => { const me = i === 3; person(x, 260, 0.62, me ? mixC('#C9C3DE', VIO, found) : '#C9C3DE', { a: cl(pop(t - T.seek - i * 0.06, 12, 0.6)) }); });
  // the magnifier: right to left, back, then onto the one
  const kx = [[T.seek, 420], [ws(64), -340], [ws(66), 0], [ws(69) - 0.1, 170]]; let mx = 420;
  for (let q = 0; q < kx.length - 1; q++) { if (t >= kx[q][0]) mx = lerp(kx[q][1], kx[q + 1][1], exIO(k01(t, kx[q][0], kx[q + 1][0] - kx[q][0]))); }
  at(mx, 120, 1, cl(k), () => { cv.save(); cv.globalAlpha *= 0.25; circle(0, 0, 92, WHITE); cv.restore(); circle(0, 0, 92, null, INKP, 16); line(64, 64, 140, 140, INKP, 26); });
  if (found > 0) { popIn(t, ws(69) + 0.05, () => { circle(0, 0, 40, AMB); txt('★', 0, 4, 44, WHITE, { dir: 'ltr' }); }, 220, 20, 0.5); popIn(t, ws(70), () => chip('درک کامل', 0, 0, 34, WHITE, VIO), 170, 330); }
}
// ---- «این درک همون گذشته‌ی بازاره»: ۲۰۱۵ to ۲۰۲۶ ----
const HIST = Array.from({ length: 111 }, (_, i) => [-440 + i * 8, 120 - i * 1.6 - 50 * Math.sin(i * 0.11) - 22 * Math.sin(i * 0.37) - (rnd(i) - 0.5) * 22]);
function pastArt(t, th) {
  const k = pop(t - T.past - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-490, -330, 980, 660, WHITE, 'rgba(16,12,28,0.1)');
    const kd = cub(k01(t, T.past, 1.6)); trace(HIST, kd, INKD, 7);
    for (let y = 0; y < 12; y++) { const x = -440 + y * 80; line(x, 250, x, 262, 'rgba(16,12,28,0.3)', 3); if (y % 2 === 0 || y === 11) txt(fa(2015 + y), x, 292, 26, MP, { w: 700, dir: 'ltr' }); }
    const kp = cub(k01(t, ws(80) - 0.1, 0.45)); if (kp > 0) { cv.save(); cv.globalAlpha *= 0.14 * kp; rrect(-460, -300, 860 * kp, 540, 20, VIO); cv.restore(); popIn(t, ws(80), () => chip('گذشته‌ی بازار', 0, 0, 40, WHITE, VIO), -30, -250); }
    popIn(t, ws(78), () => { line(0, -40, 0, 40, R, 6); chip('امروز', 0, -80, 30, WHITE, R); }, 440, -110);
  });
}
// ---- «توی بک‌تست‌لب، گذشته‌ی بازار رو می‌تونی درک کنی، یاد بگیری» (f1's screens) ----
const RREP = [40, 130, 1110, 700], RC = [455, 685, 535, 95], RWIN = [600, 196, 560, 268], RLOS = [34, 196, 560, 268];
const DK = ['d02', 'd06', 'd10', 'd14', 'd18', 'd22', 'd26', 'd30', 'd34', 'd38'];
function brandArtK(t, th) {
  const k = pop(t - T.brand - 0.05, 12, 0.6); if (k <= 0) return;
  const sw = cub(k01(t, ws(91) - 0.15, 0.35));
  if (sw < 1) at(0, 0, lerp(0.92, 1, cl(k)) * (1 - 0.06 * sw), cl(k) * (1 - sw), () => {
    const w = 960, x = -480, y = -440, h = shot(FLIP(t, ws(86), ws(91), DK), RREP, x, y, w);
    const kc = pop(t - ws(85) + 0.05, 12, 0.6); if (kc > 0) at(0, (1 - cl(kc)) * 60, 1, cl(kc), () => { const w2 = 900, y2 = y + h + 50, h2 = shot('c-session', RC, -450, y2, w2); ringIn(RC, [800, 755, 195, 24], -450, y2, w2, cub(k01(t, ws(86), 0.3))); });
    note('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', y - 50, 'rgba(255,255,255,0.75)');
  });
  if (sw > 0) at(0, 0, lerp(0.92, 1, sw), sw, () => {
    const w = 860, x = -430, y1 = -470, h1 = shot('h-wl', RWIN, x, y1, w);
    ringIn(RWIN, RWIN, x, y1, w, cub(k01(t, ws(91) + 0.15, 0.3)), G);
    const kl = pop(t - ws(92) + 0.1, 12, 0.6), y2 = y1 + h1 + 44;
    if (kl > 0) at(0, (1 - cl(kl)) * 60, 1, cl(kl), () => { const h2 = shot('h-wl', RLOS, x, y2, w); ringIn(RLOS, RLOS, x, y2, w, cub(k01(t, ws(92) + 0.1, 0.3)), R);
      note('صفحه‌ی واقعی آنالیز · برنده‌ها و بازنده‌های یه جلسه‌ی آزمایشی', y2 + h2 + 56, 'rgba(255,255,255,0.75)'); });
  });
}
// ---- «و تو تکراری که قراره اتفاق بیفته»: the pattern again ----
const PAT = [[0, 0], [40, -60], [80, 40], [120, -20], [160, 90], [200, -10], [240, 60], [280, -120], [330, -200]];
function repeatArt(t, th) {
  const k = pop(t - T.repeat - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 60, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-490, -330, 980, 660, PLATE, 'rgba(255,255,255,0.08)');
    line(0, -290, 0, 290, 'rgba(255,255,255,0.25)', 3, [12, 12]);
    const A = PAT.map(([x, y]) => [-440 + x * 1.25, 60 + y]), B = PAT.map(([x, y]) => [30 + x * 1.25, 60 + y]);
    trace(A, cub(k01(t, T.repeat, 0.8)), '#B9B3D1', 8);
    const kg = cub(k01(t, ws(95) - 0.05, 0.7)); if (kg > 0) { cv.save(); cv.setLineDash([16, 14]); trace(B, kg, rgba(LIME, 0.7), 6); cv.restore(); }
    const kr = cub(k01(t, ws(98) - 0.05, ws(99) - ws(98) + 0.5)); if (kr > 0) { const p = trace(B, kr, LIME, 9); circle(p[0], p[1], 14, LIME); }
    popIn(t, T.repeat + 0.2, () => chip('گذشته', 0, 0, 34, INKD, '#B9B3D1'), -240, 260);
    popIn(t, ws(95), () => chip('تکرار', 0, 0, 34, INKD, LIME), 240, 260);
  });
}
// ---- «این بار اون فرد باتجربه، تو باشی» ----
function youArt(t, th) {
  const k = pop(t - T.you - 0.05, 12, 0.6); if (k <= 0) return;
  const kt = cub(k01(t, ws(106) - 0.05, 0.35));
  if (kt > 0) { cv.save(); cv.globalAlpha *= kt; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + t * 0.4; line(Math.cos(a) * 300, -60 + Math.sin(a) * 300, Math.cos(a) * 380, -60 + Math.sin(a) * 380, INKD, 10); } cv.restore(); }
  person(0, 300, 1.7, INKD, { a: cl(k), lantern: true });
  const kb = cub(k01(t, ws(104) - 0.1, 0.45)); if (kb > 0) at(lerp(420, 0, kb), lerp(-420, 120, kb), 1, kb, () => { rrect(-110, -34, 220, 68, 16, WHITE); txt('باتجربه', 0, 3, 38, INKD); }, lerp(0.4, -0.04, kb));
  popIn(t, ws(106), () => chip('تو', 0, 0, 70, WHITE, VIO), 0, -470, 0.5);
}
// ---- «همین امروز شروع کن، پیج رو فالو کن» ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  const followed = t >= ws(114) + 0.12;
  at(0, 40, lerp(0.92, 1, cl(k)), cl(k), () => {
    card(-400, -260, 800, 520, WHITE, null, 44);
    if (IMG.icon) cv.drawImage(IMG.icon, 210, -200, 150, 150);
    txt('بک‌تست‌لب', 180, -150, 64, INKP, { align: 'right' }); txt('backtestlab_ir', 180, -80, 34, MP, { align: 'right', w: 700, dir: 'ltr' });
    txt('اول تست، بعد ترید', 0, 30, 40, MP, { w: 700 });
    const press = t >= ws(114) && t < ws(114) + 0.12 ? 0.95 : 1;
    at(0, 160, press, 1, () => { rrect(-340, -54, 680, 108, 30, followed ? '#ECE7FA' : VIO); txt(followed ? 'فالو شدی' : 'فالو', followed ? 30 : 0, 4, 48, followed ? VIO : WHITE); if (followed) check(-110, 0, 26, G, pop(t - ws(114) - 0.12, 14, 0.5)); });
    const kc = cub(k01(t, ws(112) - 0.2, ws(114) - ws(112) + 0.2)); if (kc > 0 && t < ws(115) + 0.6) cursor(lerp(360, 40, kc), lerp(420, 170, kc), 0.9);
  });
  popIn(t, ws(109), () => chip('همین امروز', 0, 0, 44, INKD, LIME), 0, -330, 0.5, -0.03);
}
// ---- «از تجربه‌ی چندین و چند ساله‌ی بازار نهایت استفاده رو ببر» ----
function useArt(t, th) {
  const k = pop(t - T.use - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const ky = cub(k01(t, ws(122) - 0.1, ws(125) - ws(122) + 0.5)), yr = Math.round(lerp(2015, 2026, ky));
    txt(fa(yr), 0, -260, 230, ky >= 1 ? LIME : WHITE, { dir: 'ltr' });
    txt(ky > 0 ? `${fa(2015)} تا ${fa(yr)}` : 'سال‌ها بازار', 0, -100, 44, MD, { w: 700 });
    const kc = pop(t - ws(121) + 0.05, 12, 0.6); if (kc > 0) at(0, (1 - cl(kc)) * 60, 1, cl(kc), () => { const w2 = 900, y2 = -20, h2 = shot('c-session', RC, -450, y2, w2); ringIn(RC, [800, 755, 195, 24], -450, y2, w2, cub(k01(t, ws(124), 0.3))); note('صفحه‌ی واقعی بک‌تست‌لب · ساخت جلسه', y2 + h2 + 50, 'rgba(255,255,255,0.7)'); });
    popIn(t, ws(127), () => chip('نهایت استفاده', 0, 0, 52, INKD, LIME), 0, 330, 0.5);
  });
}
// ---- the end card ----
function endArtK(t, th) {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(0, -400, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, -w / 2, -210 + (1 - kw) * 24, w, h); cv.restore(); }
  popIn(t, t0 + 0.4, () => chip('همین امروز شروع کن', 0, 0, 52, INKD, LIME), 0, 60);
  popIn(t, t0 + 0.7, () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.restore(); txt('لینک توی بیو', 0, 4, 62, VIO); }, 0, 230, 0.6);
}

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
story({
  scenes: [
    { k: 'hook', bg: INKD, wipe: 'none', art: 'hook', kpos: [CX, 1250, 1.2], groups: [
      { at: 0, lines: [L_(280, 96, WHITE, [['دیدی', 0], ['وقتی', 1], ['درگیر', 2], ['یه', 3]]), L_(430, 140, WHITE, [['دردسر', [4, 5], { hl: R, ht: WHITE }], ['بزرگ', 6, { c: AMB }]]), L_(580, 96, WHITE, [['تو', 7], ['زندگیت', 8], ['میشی،', 9]])] }] },
    { k: 'console', bg: PAPER, wipe: 'up', art: 'console', kpos: [CX, 1230, 1.3], groups: [
      { at: 10, lines: [L_(320, 120, INKP, [['همه', 10, { c: VIO }], ['بهت', 11]]), L_(470, 130, INKP, [['دلداری', 12, { hl: VIO, ht: WHITE }], ['میدن،', 13]])] }] },
    { k: 'alone', bg: INKD, wipe: 'right', art: 'alone', kpos: [CX, 1230, 1.3], groups: [
      { at: 14, lines: [L_(320, 120, WHITE, [['اما', 14], ['کسی', 15]]), L_(480, 140, WHITE, [['درکت', 16, { hl: R, ht: WHITE }], ['نمی‌کنه.', [17, 18]]])] }] },
    { k: 'truly', bg: LIME, wipe: 'iris', art: 'truly', kpos: [CX, 1220, 1.2], groups: [
      { at: 19, lines: [L_(280, 96, INKD, [['اما', 19], ['اگه', 20], ['کسی', 21]]), L_(420, 116, INKD, [['واقعاً', 22, { hl: INKD, ht: LIME }], ['درکت', 23], ['کنه،', 24]])] },
      { at: 25, lines: [L_(300, 116, INKD, [['قضیه', 25], ['خیلی', 26]]), L_(450, 140, INKD, [['فرق', 27, { hl: VIO, ht: WHITE }], ['می‌کنه.', 28]])] }] },
    { k: 'help', bg: VIO, wipe: 'right', art: 'help', kpos: [CX, 1260, 1], groups: [
      { at: 29, lines: [L_(240, 90, WHITE, [['با', 29], ['تجربه‌ش', 30, { c: LIME }], ['کمکت', 31], ['می‌کنه', 32]]), L_(360, 96, WHITE, [['به', 33], ['راحت‌ترین', [34, 35], { hl: LIME, ht: INKD }], ['شکل', 36], ['ممکن', 37]]), L_(480, 90, WHITE, [['به', 38], ['حال', 39], ['خوبت', 40, { c: LIME }], ['برگردی.', 41]])] }] },
    { k: 'markets', bg: INKD, wipe: 'up', art: 'markets', kpos: [CX, 1220, 1], groups: [
      { at: 42, lines: [L_(330, 140, LIME, [['بازارای', 42], ['مالی', 43]]), L_(490, 120, WHITE, [['هم', 44], ['همینه.', 45]])] }] },
    { k: 'smart', bg: VIO, wipe: 'left', art: 'smart', kpos: [CX, 1290, 1], groups: [
      { at: 46, lines: [L_(240, 86, WHITE, [['در', 46], ['سالیان', 47], ['اخیر،', 48]]), L_(360, 96, WHITE, [['بازار', 49], ['اونقدر', 50]]), L_(490, 116, WHITE, [['باهوش', 51, { hl: LIME, ht: INKD }], ['و', 52], ['پویا', 53, { hl: WHITE, ht: VIO }], ['شده', 54]])] },
      { at: 55, lines: [L_(260, 96, WHITE, [['که', 55], ['نمی‌شه', 56]]), L_(390, 116, WHITE, [['بدون', 57], ['درکش', 58, { c: LIME }]]), L_(520, 96, WHITE, [['کاری', 59], ['کرد.', 60]])] }] },
    { k: 'seek', bg: PAPER, wipe: 'up', art: 'seek', kpos: [CX, 1180, 1.4], groups: [
      { at: 61, lines: [L_(260, 96, INKP, [['پس', 61], ['باید', 62], ['بریم', 63]]), L_(390, 104, INKP, [['دنبال', 64], ['تجربه‌ی', 65, { c: VIO }]]), L_(520, 96, INKP, [['همون', 66], ['آدمی', 67]])] },
      { at: 68, lines: [L_(320, 116, INKP, [['که', 68], ['درک', 69, { hl: VIO, ht: WHITE }], ['کامل', 70, { hl: VIO, ht: WHITE }]]), L_(470, 110, INKP, [['رو', 71], ['داره.', 72]])] }] },
    { k: 'past', bg: LIME, wipe: 'right', art: 'past', kpos: [CX, 1240, 1], groups: [
      { at: 73, lines: [L_(250, 88, INKD, [['و', 73], ['توی', 74], ['بازارای', 75], ['مالی،', 76]]), L_(380, 100, INKD, [['این', 77], ['درک', 78]]), L_(520, 116, INKD, [['همون', 79], ['گذشته‌ی', 80, { hl: INKD, ht: LIME }], ['بازاره.', 81]])] }] },
    { k: 'brand', bg: VIO, wipe: 'iris', art: 'brand', kpos: [CX, 1290, 1], groups: [
      { at: 82, lines: [L_(230, 92, WHITE, [['توی', 82], ['بک‌تست‌لب،', [83, 84], { c: LIME }]]), L_(345, 88, WHITE, [['گذشته‌ی', 85], ['بازار', 86], ['رو', 87]]), L_(460, 92, WHITE, [['می‌تونی', 88], ['درک', 89, { hl: LIME, ht: INKD }], ['کنی،', 90]])] },
      { at: 91, lines: [L_(380, 150, WHITE, [['یاد', 91, { hl: LIME, ht: INKD }], ['بگیری', 92, { hl: LIME, ht: INKD }]])] }] },
    { k: 'repeat', bg: INKD, wipe: 'left', art: 'repeat', kpos: [CX, 1220, 1], groups: [
      { at: 93, lines: [L_(300, 110, WHITE, [['و', 93], ['تو', 94], ['تکراری', 95, { c: LIME }]]), L_(450, 100, WHITE, [['که', 96], ['قراره', 97], ['اتفاق', 98], ['بیفته،', 99]])] }] },
    { k: 'you', bg: LIME, wipe: 'up', art: 'you', kpos: [CX, 1300, 1], groups: [
      { at: 100, lines: [L_(250, 96, INKD, [['این', 100], ['بار', 101]]), L_(380, 104, INKD, [['اون', 102], ['فرد', 103], ['باتجربه،', [104, 105], { hl: INKD, ht: LIME }]]), L_(530, 150, INKD, [['تو', 106, { hl: VIO, ht: WHITE }], ['باشی.', 107]])] }] },
    { k: 'cta', bg: VIO, wipe: 'right', art: 'cta', kpos: [CX, 1240, 1.2], groups: [
      { at: 108, lines: [L_(250, 100, WHITE, [['همین', 108], ['امروز', 109, { c: LIME }], ['شروع', 110], ['کن،', 111]]), L_(390, 116, WHITE, [['پیج', 112], ['رو', 113], ['فالو', 114, { hl: LIME, ht: INKD }], ['کن', 115]])] }] },
    { k: 'use', bg: INKD, wipe: 'iris', art: 'use', kpos: [CX, 1290, 1], groups: [
      { at: 116, lines: [L_(240, 86, WHITE, [['و', 116], ['توی', 117], ['بک‌تست‌لب', [118, 119], { c: LIME }]]), L_(355, 86, WHITE, [['از', 120], ['تجربه‌ی', 121], ['چندین', 122], ['و', 123]]), L_(470, 96, WHITE, [['چند', 124], ['ساله‌ی', 125], ['بازار', 126, { c: LIME }]])] },
      { at: 127, lines: [L_(320, 110, WHITE, [['نهایت', 127, { hl: LIME, ht: INKD }], ['استفاده', 128]]), L_(470, 110, WHITE, [['رو', 129], ['ببر.', 130]])] }] },
    { k: 'end', bg: INKD, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, console: consoleArt, alone: aloneArt, truly: trulyArt, help: helpArt, markets: marketsArt, smart: smartArt, seek: seekArt,
    past: pastArt, brand: brandArtK, repeat: repeatArt, you: youArt, cta: ctaArt, use: useArt, end: endArtK },
  shakes: [[ws(4), 10], [ws(6), 14], [ws(23), 6], [ws(83), 6]],
  cover: () => {
    cv.fillStyle = INKD; cv.fillRect(0, 0, W, H);
    txt('دیدی وقتی درگیر', CX, 290, 104, WHITE);
    const s = 'یه دردسر بزرگ', size = 130, w = measure(s, size); cv.save(); cv.translate(CX, 450); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, R); cv.restore(); txt(s, CX, 450, size, WHITE);
    txt('میشی…', CX, 610, 104, WHITE);
    at(CX, 1230, 0.92, 1, () => hookArt(ws(6) + 0.05, THEME.ink));
    at(CX, 1760, 1, 1, () => chip('همه دلداری میدن، کسی درکت نمی‌کنه', 0, 0, 44, INKD, LIME));
  },
});
