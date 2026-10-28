// k3 · «کدوم پلتفرم بک‌تست‌گیری ایرانی تقویم اقتصادی داره…؟ صد البته بک‌تست‌لب», the kinetic look (u-kit) in a light
// theme: pastel grounds, white cards, dark ink, and the platform's own light theme in every real screen.
// The real screens (capture/cap.mjs) are one gold session on the built-in chart, Friday 2 October 2026 (۱۰ مهر ۱۴۰۵), the
// day of the US jobs report (NFP at 16:00 Tehran): its news flags and the dashed line of the coming release, the hover card
// in Tehran and New York time, the time zone menu, the calendar beside the chart, and the replay stepped through the
// release. The drawn parts: the hook's chart and calendar page, the missing piece, the locked «عدد واقعی» card (an
// example, no numbers), the bio link and the end card.
const LILAC = '#E8E1FF', ROSE = '#FFE8EC', MINTL = '#E1F5EB', SKYL = '#E5EDFF', LIMEL = '#F0F8D6';
const ORANGE = '#F5A524', FRED = '#F25466';
const NFPX = window.DATA.nfpx;
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };
function card(x, y, w, h, th, r = 36) { cv.save(); cv.shadowColor = 'rgba(40,30,90,0.16)'; cv.shadowBlur = 44; cv.shadowOffsetY = 16; rrect(x, y, w, h, r, WHITE); cv.restore(); rrect(x, y, w, h, r, null, 'rgba(26,20,48,0.08)', 2); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function stamp(s, x, y, size, col, k, rot = -0.14) { if (k <= 0) return; at(x, y, lerp(1.7, 1, cl(k)), cl(k * 2), () => { const w = measure(s, size) + size * 0.9; rrect(-w / 2, -size * 0.75, w, size * 1.5, size * 0.25, rgba(col, 0.1), col, Math.max(6, size * 0.07)); txt(s, 0, size * 0.04, size, col); }, rot); }
/** A crop (CSS px of the 1440×900 capture) of a real screen, drawn into the box [x, y, w] with rounded corners; returns its height. */
function crop(key, r, x, y, w, a = 1, rad = 22) { const im = IMG[key]; if (!im || a <= 0) return (w * r[3]) / r[2]; const s = im.width / 1440, h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, rad); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
/** a real screen on the light ground: a soft shadow, the crop, a hairline frame */
function shot(key, r, x, y, w, a = 1) { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = 'rgba(40,30,90,0.22)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; rrect(x, y, w, h, 24, WHITE); cv.restore(); crop(key, r, x, y, w, a, 24); cv.save(); cv.globalAlpha *= a; rrect(x, y, w, h, 24, null, 'rgba(26,20,48,0.12)', 2); cv.restore(); return h; }
/** a ring round part of a crop: r is the crop's region, q the part (both CSS px), the crop drawn at [x, y, w] */
function ringIn(r, q, x, y, w, k, col = VIO, round = false) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.5); cv.shadowBlur = 18;
  const X = x + (q[0] - r[0]) * s - m, Y = y + (q[1] - r[1]) * s - m, W = q[2] * s + 2 * m, Hh = q[3] * s + 2 * m;
  if (round) circle(X + W / 2, Y + Hh / 2, Math.max(W, Hh) / 2, null, col, 6); else rrect(X, Y, W, Hh, 14, null, col, 6); cv.restore(); }
/** where a CSS point of a crop lands on the reel */
const inCrop = (r, x, y, w, px, py) => [x + (px - r[0]) * (w / r[2]), y + (py - r[1]) * (w / r[2])];
const flipIdx = (t, t0, t1, j0, j1) => Math.round(lerp(j0, j1, cl((t - t0) / (t1 - t0))));
/** a news flag as the platform draws it: a disc in the impact colour with the country code */
function flag(x, y, r, col, k = 1, s = 'US') { if (k > 0) at(x, y, cl(k, 0, 1.25), cl(k), () => { cv.save(); cv.shadowColor = rgba(col, 0.45); cv.shadowBlur = r; circle(0, 0, r, col); cv.restore(); circle(0, 0, r, null, WHITE, r * 0.18); txt(s, 0, r * 0.06, r * 0.82, '#111', { dir: 'ltr' }); }); }
// a drawn chart (an illustration: a seeded walk, not market data)
const BARS = (() => { const out = []; let p = 100; for (let i = 0; i < 26; i++) { const o = p, c = o + (rnd(i * 3.7) - 0.48) * 4 + (i === 19 ? 13 : 0), h = Math.max(o, c) + rnd(i * 1.3) * 2, l = Math.min(o, c) - rnd(i * 2.1) * 2; out.push([o, h, l, c]); p = c; } return out; })();
function miniChart(x0, y0, x1, y1, n, o = {}) { return candleChart(BARS, n, [x0, y0, x1, y1], { up: G, down: R, ...o }); }

// ---- the hook: a chart, a calendar page, the flags with their hour and date ----
function hookArt(t, th) {
  const kc = pop(t + 0.3, 12, 0.6); if (kc <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(kc)), cl(kc), () => {
    card(-430, -300, 860, 560, th);
    const n = Math.min(BARS.length, Math.floor(6 + t * 6)); const m = miniChart(-380, -230, 380, 150, n);
    line(-390, 190, 390, 190, 'rgba(26,20,48,0.1)', 2);
    // the flags on their candles
    const kf1 = pop(t - ws(9) + 0.05, 13, 0.55), kf2 = pop(t - ws(9) - 0.15, 13, 0.55);
    flag(m.X(8), 215, 22, ORANGE, kf1); flag(m.X(19), 215, 22, FRED, kf2);
    const kd = cub(k01(t, ws(9) + 0.1, 0.3)); if (kd > 0) { cv.save(); cv.globalAlpha *= kd; line(m.X(19), -240, m.X(19), 190, rgba(FRED, 0.8), 3, [10, 8]); cv.restore(); }
    // its hour and its date
    const kh = pop(t - ws(10) + 0.05, 13, 0.55); if (kh > 0) at(m.X(19) - 10, -200, cl(kh, 0, 1.2), cl(kh), () => chip('۱۶:۰۰ تهران', 0, 0, 30, WHITE, VIO));
    const kt = pop(t - ws(12) + 0.05, 13, 0.55); if (kt > 0) at(m.X(19) - 10, -130, cl(kt, 0, 1.2), cl(kt), () => chip('جمعه، ۱۰ مهر', 0, 0, 30, INKP, LIMEL, { stroke: 'rgba(26,20,48,0.15)' }));
  });
  // the calendar page
  const kp = pop(t - ws(4) + 0.05, 12, 0.55);
  if (kp > 0) at(-330, -300, cl(kp, 0, 1.2), cl(kp), () => { cv.save(); cv.shadowColor = 'rgba(40,30,90,0.25)'; cv.shadowBlur = 30; cv.shadowOffsetY = 10; rrect(-95, -95, 190, 200, 28, WHITE); cv.restore();
    cv.save(); cv.beginPath(); cv.roundRect(-95, -95, 190, 200, 28); cv.clip(); cv.fillStyle = FRED; cv.fillRect(-95, -95, 190, 58); cv.restore(); txt('مهر', 0, -64, 34, WHITE);
    txt('۱۰', 0, 30, 92, INKP); [-50, 50].forEach((x) => rrect(x - 8, -110, 16, 34, 8, '#C9C2DD')); }, -0.08);
  const kq = pop(t - ws(17) + 0.1, 13, 0.5); if (kq > 0) at(370, -300, cl(kq, 0, 1.25), cl(kq), () => { circle(0, 0, 66, VIO); txt('؟', 0, 6, 92, WHITE); }, 0.12 * Math.sin(t * 5));
}
function brandArtL(t, th) { brandArt(t, THEME.paper, T.brand + 0.05); }
// ---- «بک‌تست بدون خبر، نصفه‌ست»: a chart with its other half missing ----
function halfArt(t, th) {
  const k = pop(t - T.half - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    const sp = 30 * cub(k01(t, ws(25) - 0.1, 0.35));
    card(-430 - sp, -260, 430, 500, th, 32);
    cv.save(); cv.beginPath(); cv.rect(-430 - sp, -280, 430, 540); cv.clip(); miniChart(-390 - sp, -200, 360 - sp, 160, 26); cv.restore();
    // the missing half: a dashed outline and the piece «خبر» floating out
    cv.save(); cv.setLineDash([16, 12]); rrect(10 + sp, -260, 420, 500, 32, rgba(VIO, 0.04), rgba(VIO, 0.5), 4); cv.restore();
    const kq = pop(t - ws(24) + 0.05, 12, 0.5); if (kq > 0) at(220 + sp, -10, cl(kq, 0, 1.2), cl(kq), () => { cv.save(); cv.shadowColor = rgba(FRED, 0.4); cv.shadowBlur = 30; rrect(-120, -70, 240, 140, 30, FRED); cv.restore(); txt('خبر', 0, 4, 64, WHITE); }, -0.06 + 0.04 * Math.sin(t * 3));
    stamp('۵۰٪', -215 - sp, 330, 70, FRED, pop(t - ws(25), 14, 0.5));
  });
}
// ---- the NFP candle: the replay stepped through the release, then its flag and card ----
const RC = [600, 150, 560, 690];
function candleArt(t, th) {
  const k = cub(k01(t, T.candle - 0.1, 0.4)); if (k <= 0) return;
  const w = 760, x = -380, y = -380, j = flipIdx(t, T.candle + 0.1, ws(33), 8, 22), key = 'f' + String(j).padStart(2, '0');
  const h = shot(key, RC, x, y, w, k);
  // the big candle, then the flag under it
  const fx = NFPX[j] + 9, [cx] = inCrop(RC, x, y, w, fx, 0);
  const kb = cub(k01(t, ws(29) - 0.1, 0.3)); if (kb > 0 && j >= 14) { cv.save(); cv.globalAlpha *= kb * (1 - cub(k01(t, ws(36), 0.3))) * 0.9; cv.strokeStyle = G; cv.lineWidth = 5; cv.setLineDash([12, 8]); cv.beginPath(); cv.ellipse(cx, y + 0.22 * h, 46, 140, 0, 0, Math.PI * 2); cv.stroke(); cv.restore(); }
  const ks = pop(t - ws(35) + 0.1, 13, 0.55); if (ks > 0) at(cx - 200, y + 120, cl(ks, 0, 1.2), cl(ks) * (1 - cub(k01(t, ws(36), 0.3))), () => chip('کار استراتژیمه؟', 0, 0, 34, WHITE, G));
  ringIn(RC, [NFPX[j], 798, 18, 18], x, y, w, cub(k01(t, ws(36), 0.3)), FRED, true);
  // its card (b1: the hover card on the released NFP flag)
  const kc = pop(t - ws(38) + 0.1, 12, 0.6); if (kc > 0) at(cx - 40, y + h - 300, lerp(0.85, 1, cl(kc)), cl(kc), () => { const r = [716, 622, 248, 182], ww = 520; shot('b1', r, -ww / 2, -((ww * r[3]) / r[2]) / 2, ww); });
  txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا، ۱۰ مهر ۱۴۰۵', 0, y - 40, 28, MP, { w: 700, alpha: k });
}
// ---- the flags on the real chart ----
const RA = [40, 150, 1150, 690];
function flagsArt(t, th) {
  const k = pop(t - T.flags - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 1000, x = -500, y = -290;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot('a0', RA, x, y, w);
    [[304, ws(48)], [349, ws(48) + 0.15], [1006, ws(49)]].forEach(([fx, t0], i) => ringIn(RA, [fx, 798, 18, 18], x, y, w, cub(k01(t, t0, 0.3)), i === 0 ? ORANGE : FRED, true));
    const ka = pop(t - ws(50) + 0.05, 13, 0.55); if (ka > 0) { const [px] = inCrop(RA, x, y, w, 1015, 0); at(px - 60, y + h + 70, cl(ka, 0, 1.2), cl(ka), () => chip('علامت خبر، روی کندل خودش', 0, 0, 32, WHITE, VIO)); }
    txt('صفحه‌ی واقعی بک‌تست‌لب · تم روشن', 0, y + h + 150, 28, MP, { w: 700 });
  });
}
// ---- red = high, orange = medium (a0, zoomed on its two flags) ----
const RZ = [236, 690, 176, 140];
function colorsArt(t, th) {
  const k = pop(t - T.colors - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 640, x = -320, y = -330;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    const h = shot('a0', RZ, x, y, w);
    const [ox, oy] = inCrop(RZ, x, y, w, 313, 807), [rx, ry] = inCrop(RZ, x, y, w, 358, 807);
    const kr = cub(k01(t, ws(52) - 0.05, 0.3)), ko = cub(k01(t, ws(56) - 0.05, 0.3));
    ringIn(RZ, [349, 798, 18, 18], x, y, w, kr, FRED, true); ringIn(RZ, [304, 798, 18, 18], x, y, w, ko, ORANGE, true);
    // the labels under them
    if (kr > 0) { cv.save(); cv.globalAlpha *= kr; line(rx, ry + 50, 170, y + h + 110, FRED, 5); cv.restore(); at(170, y + h + 160, cl(pop(t - ws(52), 13, 0.55), 0, 1.2), kr, () => { flag(-150, 0, 34, FRED); chip('پراهمیت', 30, 0, 44, WHITE, FRED); }); }
    if (ko > 0) { cv.save(); cv.globalAlpha *= ko; line(ox, oy + 50, -170, y + h + 260, ORANGE, 5); cv.restore(); at(-170, y + h + 310, cl(pop(t - ws(56), 13, 0.55), 0, 1.2), ko, () => { flag(-140, 0, 34, ORANGE); chip('متوسط', 30, 0, 44, INKD, ORANGE); }); }
  });
}
// ---- the hover card: the Persian title, Tehran time, then any time zone ----
const RB = [860, 600, 300, 232], RD0 = [322, 372, 352, 478], RD1 = [712, 616, 254, 210];
function hoverArt(t, th) {
  const k = pop(t - T.hover - 0.05, 12, 0.6); if (k <= 0) return;
  const swap = cub(k01(t, ws(74) - 0.1, 0.35)), w = 800, x = -400, y = -340;
  if (swap < 1) at(0, 0, lerp(0.9, 1, cl(k)) * (1 - 0.06 * swap), cl(k) * (1 - swap), () => {
    const h = shot('b0', RB, x, y, w);
    const [fx, fy] = inCrop(RB, x, y, w, 1015, 807), kc = cub(k01(t, T.hover, 0.6)); cursor(lerp(fx + 220, fx - 6, kc), lerp(fy + 160, fy - 6, kc), 0.9);
    ringIn(RB, [926, 708, 176, 30], x, y, w, cub(k01(t, ws(66), 0.3)));
    ringIn(RB, [992, 644, 62, 22], x, y, w, cub(k01(t, ws(71), 0.3)), FRED);
    const kf = pop(t - ws(67) + 0.05, 13, 0.55); if (kf > 0) at(-250, y + h + 70, cl(kf, 0, 1.2), cl(kf), () => chip('اسم خبر به فارسی', 0, 0, 34, WHITE, VIO));
    const kt = pop(t - ws(72) + 0.05, 13, 0.55); if (kt > 0) at(230, y + h + 70, cl(kt, 0, 1.2), cl(kt), () => chip('به وقت تهران', 0, 0, 34, WHITE, FRED));
  });
  if (swap > 0) at(0, 0, lerp(0.9, 1, swap), swap, () => {
    // the time zone menu (d0), New York ringed; then the same card in New York time (d1)
    const kd1 = pop(t - ws(78) + 0.05, 12, 0.6), wm = 520, xm = -470, ym = -380;
    const hm = shot('d0', RD0, xm, ym, wm);
    ringIn(RD0, [334, 479, 326, 32], xm, ym, wm, cub(k01(t, ws(75), 0.3)));
    txt('۴۱۹ منطقه‌ی زمانی', xm + wm / 2, ym + hm + 50, 30, MP, { w: 700 });
    if (kd1 > 0) at(230, 120, lerp(0.85, 1, cl(kd1)), cl(kd1), () => { const wc = 520, hc = shot('d1', RD1, -wc / 2, -((wc * RD1[3]) / RD1[2]) / 2, wc); ringIn(RD1, [814, 644, 66, 22], -wc / 2, -hc / 2, wc, cub(k01(t, ws(79), 0.3)), FRED); });
  });
}
// ---- the coming news: the dashed line the replay walks toward ----
function futureArt(t, th) {
  const k = cub(k01(t, T.future - 0.1, 0.4)); if (k <= 0) return;
  const w = 760, x = -380, y = -380, j = flipIdx(t, T.future + 0.2, ws(96), 0, 13), key = 'f' + String(j).padStart(2, '0');
  const h = shot(key, RC, x, y, w, k);
  const [lx] = inCrop(RC, x, y, w, NFPX[j] + 9, 0);
  const kl = cub(k01(t, ws(85), 0.3)); if (kl > 0) { cv.save(); cv.globalAlpha *= kl; cv.shadowColor = rgba(FRED, 0.6); cv.shadowBlur = 16; line(lx, y + 20, lx, y + h - 60, rgba(FRED, 0.9), 5, [14, 10]); cv.restore();
    at(lx, y + 60, cl(pop(t - ws(85), 13, 0.55), 0, 1.2), kl, () => chip('NFP · ۱۶:۰۰', 0, 0, 32, WHITE, FRED)); }
  // the gap to it, in candles
  const kg = cub(k01(t, ws(94), 0.3)); if (kg > 0) { const [cx] = inCrop(RC, x, y, w, NFPX[j] + 9 - (14 - j) * 7.5, 0); cv.save(); cv.globalAlpha *= kg; line(cx, y + h * 0.82, lx, y + h * 0.82, VIO, 5); circle(cx, y + h * 0.82, 9, VIO); circle(lx, y + h * 0.82, 9, VIO); cv.restore();
    at((cx + lx) / 2, y + h * 0.82 - 50, cl(pop(t - ws(94), 13, 0.55), 0, 1.2), kg, () => chip(`${fa(Math.max(1, 14 - j) * 15)} دقیقه مونده`, 0, 0, 30, WHITE, VIO)); }
  txt('صفحه‌ی واقعی بک‌تست‌لب · قبل از خبر', 0, y - 40, 28, MP, { w: 700, alpha: k });
}
// ---- «عدد واقعی» stays locked until the replay reaches the release (an illustration) ----
function actualArt(t, th) {
  const k = pop(t - T.actual - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-430, -300, 860, 600, th); txt('مثال', 380, -255, 28, MP, { align: 'right', w: 700 });
    flag(330, -190, 26, FRED); txt('تغییرات اشتغال غیرکشاورزی (NFP)', 280, -188, 38, INKP, { align: 'right' });
    // the replay's playhead walking to the release
    const tx0 = -360, tx1 = 360, rel = 240, kp = cub(k01(t, ws(102), ws(107) - ws(102))), px = lerp(tx0 + 40, rel, kp);
    rrect(tx0, -95, tx1 - tx0, 10, 5, '#E7E3F3'); rrect(tx0, -95, px - tx0, 10, 5, VIO);
    line(rel, -130, rel, -50, FRED, 4, [8, 6]); txt('لحظه‌ی خبر', rel, -20, 26, FRED, { w: 800 });
    circle(px, -90, 18, VIO, WHITE, 5); txt('بازپخش', px, -140, 26, VIO, { w: 800, alpha: kp < 0.9 ? 1 : 0 });
    const open = cub(k01(t, ws(107), 0.35));
    [['پیش‌بینی', 60], ['قبلی', 150]].forEach(([s, yy]) => { txt(s, 340, yy, 40, INKP, { align: 'right' }); rrect(-330, yy - 16, 200, 32, 16, '#E7E3F3'); });
    txt('عدد واقعی', 340, 240, 42, INKP, { align: 'right' });
    rrect(-340, 200, 420, 80, 22, mixC('#F1EEF9', '#DDF5E9', open), mixC('#D9D3EA', '#16B37A', open), 3);
    if (open < 1) at(-130, 240, 1 - 0.3 * open, 1 - open, () => { rrect(-26, -6, 52, 40, 8, MP); cv.save(); cv.strokeStyle = MP; cv.lineWidth = 8; cv.beginPath(); cv.arc(0, -8, 17, Math.PI, 0); cv.stroke(); cv.restore(); });
    if (open > 0) { check(-250, 240, 26, G, open); txt('منتشر شد', -100, 242, 38, G, { alpha: open }); }
  });
}
// ---- the calendar beside the chart (c0): Jalali dates, the country and impact filters ----
const RP = [0, 112, 330, 566];
function panelArt(t, th) {
  const k = pop(t - T.panel - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 520, x = -260, y = -470;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot('c0', RP, x, y, w);
    ringIn(RP, [212, 466, 108, 28], x, y, w, cub(k01(t, ws(122), 0.3)));
    ringIn(RP, [212, 541, 108, 28], x, y, w, cub(k01(t, ws(122) + 0.2, 0.3)));
    ringIn(RP, [44, 204, 276, 104], x, y, w, cub(k01(t, ws(126), 0.3)));
    ringIn(RP, [64, 402, 256, 42], x, y, w, cub(k01(t, ws(128), 0.3)), FRED);
    const kd = pop(t - ws(122) + 0.05, 13, 0.55); if (kd > 0) at(-390, y + 0.76 * h, cl(kd, 0, 1.2), cl(kd), () => chip('تاریخ شمسی', 0, 0, 32, WHITE, VIO), -0.06);
    const kc = pop(t - ws(126) + 0.05, 13, 0.55); if (kc > 0) at(390, y + 0.24 * h, cl(kc, 0, 1.2), cl(kc), () => chip('کشورها', 0, 0, 32, WHITE, VIO), 0.06);
    const ki = pop(t - ws(128) + 0.05, 13, 0.55); if (ki > 0) at(-390, y + 0.5 * h, cl(ki, 0, 1.2), cl(ki), () => chip('اهمیت خبر', 0, 0, 32, WHITE, FRED), -0.06);
  });
}
// ---- how a strategy behaves around the news: the release candle on the real chart ----
function testArt(t, th) {
  const k = pop(t - T.test - 0.05, 12, 0.6); if (k <= 0) return;
  const w = 760, x = -380, y = -340;
  at(0, 0, lerp(0.92, 1, cl(k)), cl(k), () => {
    const h = shot('f22', RC, x, y, w);
    const [cx] = inCrop(RC, x, y, w, NFPX[22] + 9, 0), kb = cub(k01(t, ws(133), 0.35));
    if (kb > 0) { cv.save(); cv.globalAlpha *= kb * 0.16; cv.fillStyle = FRED; cv.fillRect(cx - 34, y + 8, 68, h - 16); cv.restore(); }
    [['قبل', -170, ws(134)], ['موقع خبر', 0, ws(135)], ['بعد', 170, ws(136)]].forEach(([s, dx, t0]) => { const kk = pop(t - t0 + 0.05, 13, 0.55); if (kk > 0) at(cx + dx * 1.15, y - 50, cl(kk, 0, 1.2), cl(kk), () => chip(s, 0, 0, 32, dx ? INKP : WHITE, dx ? WHITE : FRED, dx ? { stroke: 'rgba(26,20,48,0.15)' } : {})); });
    const kq = pop(t - ws(137) + 0.05, 13, 0.5); if (kq > 0) at(-90, y + h - 150, cl(kq, 0, 1.2), cl(kq), () => chip('استراتژی من اینجا چی کار می‌کنه؟', 0, 0, 32, WHITE, VIO), -0.04);
  });
}
// ---- the bio link and the subscription ----
function ctaArt(t, th) {
  const k = pop(t - T.cta - 0.05, 12, 0.6); if (k <= 0) return;
  at(0, 0, lerp(0.9, 1, cl(k)), cl(k), () => {
    card(-420, -300, 840, 600, th, 40);
    if (IMG.icon) cv.drawImage(IMG.icon, 210, -250, 150, 150);
    txt('backtestlab_ir', 160, -200, 44, INKD, { align: 'right', dir: 'ltr' }); txt('بک‌تست با داده‌ی واقعی بازار', 160, -140, 32, MP, { align: 'right', w: 700 });
    [['پست‌ها', 70], ['دنبال‌کننده', -110], ['دنبال‌شده', -290]].forEach(([s, x]) => { rrect(x - 60, -70, 120, 26, 13, '#ECE7FA'); txt(s, x, -20, 26, MP, { w: 700 }); });
    rrect(-380, 30, 760, 2, 1, '#ECE7FA');
    txt('تقویم اقتصادی روی چارت', 360, 90, 34, INKD, { align: 'right', w: 700 });
    const kl = cub(k01(t, ws(145) - 0.1, 0.3)); rrect(-360, 140, 720, 76, 38, mixC('#ECE7FA', LIME, kl)); txt('backtestlab.ir', 0, 179, 40, kl > 0.5 ? INKD : VIO, { dir: 'ltr' });
    const kf = pop(t - ws(142) + 0.05, 13, 0.55); if (kf > 0) at(0, 380, cl(kf, 0, 1.2), cl(kf), () => chip('اشتراک حرفه‌ای', 0, 0, 40, WHITE, VIO));
    const kc = t - ws(145) + 0.35; if (kc > 0) { const p = cl(kc / 0.35), y = lerp(470, 205, cub(p)), press = kc > 0.35 && kc < 0.5 ? 0.92 : 1; cursor(140, y, 0.8 * press);
      if (kc > 0.35) { const d = kc - 0.35; if (d < 0.5) circle(150, 182, 20 + 50 * d, null, rgba(VIO, 1 - d * 2), 5); } }
  });
}
// ---- the end card on a light ground: icon, the light wordmark, «تقویم اقتصادی روی چارت», «لینک توی بیو» ----
function endArtL(t, th) {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(0, -400, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(80,50,200,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.wordL) { const w = 560, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.wordL, -w / 2, -210 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - t0 - 0.35, 14, 0.55); if (kf > 0) at(0, 60, cl(kf, 0, 1.25), cl(kf), () => chip('تقویم اقتصادی روی چارت', 0, 0, 52, INKD, LIME));
  const kb = pop(t - t0 - 0.65, 14, 0.6); if (kb > 0) at(0, 230, cl(kb, 0, 1.2), cl(kb), () => { cv.shadowColor = 'rgba(80,50,200,0.35)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, VIO); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, WHITE); });
  const ka = cub(k01(t, t0 + 1.15, 0.4)); if (ka > 0) { const y = 380 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha *= ka; cv.strokeStyle = VIO; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-34, y + 20); cv.lineTo(0, y - 14); cv.lineTo(34, y + 20); cv.stroke(); cv.restore(); }
}

const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
const P = 'paper';
story({
  scenes: [
    { k: 'hook', bg: PAPER, th: P, wipe: 'none', art: 'hook', kpos: [CX, 1290, 0.98], groups: [
      { at: 0, lines: [L_(290, 92, INKP, [['کدوم', 0], ['پلتفرم', 1]]), L_(420, 96, INKP, [['بک‌تست‌گیری', 2], ['ایرانی', 3, { c: VIO }]]), L_(560, 104, INKP, [['تقویم', 4, { hl: VIO, ht: WHITE }], ['اقتصادی', 5, { hl: VIO, ht: WHITE }], ['داره', 6]])] },
      { at: 7, lines: [L_(290, 92, INKP, [['که', 7], ['روی', 8], ['چارت،', 9, { c: VIO }]]), L_(420, 100, INKP, [['ساعت', 10, { hl: LIME, ht: INKD }], ['و', 11], ['تاریخ', 12, { hl: LIME, ht: INKD }]]), L_(560, 92, INKP, [['خبرهای', 13], ['مهم', 14, { c: FRED }], ['رو', 15], ['نشونت', 16], ['بده؟', 17]])] }] },
    { k: 'brand', bg: LILAC, th: P, wipe: 'right', art: 'brand', kpos: [CX, 1180, 1], groups: [
      { at: 18, lines: [L_(330, 96, MP, [['صد', 18], ['البته،', 19]]), L_(500, 150, VIO, [['بک‌تست‌لب.', [20, 21]]])] }] },
    { k: 'half', bg: WHITE, th: P, wipe: 'up', art: 'half', kpos: [CX, 1200, 1], groups: [
      { at: 22, lines: [L_(330, 104, INKP, [['بک‌تست', 22], ['بدون', 23], ['خبر،', 24, { c: FRED }]]), L_(490, 130, INKP, [['نصفه‌ست.', [25, 26], { hl: FRED, ht: WHITE }]])] }] },
    { k: 'candle', bg: ROSE, th: P, wipe: 'left', art: 'candle', kpos: [CX, 1230, 1.05], groups: [
      { at: 27, lines: [L_(290, 92, INKP, [['یه', 27], ['کندل', 28], ['بزرگ', 29, { c: G }], ['می‌بینی', 30]]), L_(420, 84, INKP, [['و', 31], ['فکر', 32], ['می‌کنی', 33], ['کار', 34], ['استراتژیته،', 35, { c: VIO }]])] },
      { at: 36, lines: [L_(290, 100, INKP, [['ولی', 36], ['پشتش', 37]]), L_(430, 124, INKP, [['NFP', 38, { hl: FRED, ht: WHITE }], ['بوده.', 39]])] }] },
    { k: 'flags', bg: PAPER, th: P, wipe: 'right', art: 'flags', kpos: [CX, 1180, 1.04], groups: [
      { at: 40, lines: [L_(280, 84, MP, [['توی', 40], ['بک‌تست‌لب،', [41, 42], { c: VIO }]]), L_(400, 92, INKP, [['هر', 43], ['خبر', 44], ['مهم', 45, { c: FRED }], ['درست', 46]]), L_(530, 92, INKP, [['روی', 47], ['کندل', 48], ['خودش', 49], ['علامت', 50, { hl: VIO, ht: WHITE }], ['داره.', 51]])] }] },
    { k: 'colors', bg: WHITE, th: P, wipe: 'up', art: 'colors', kpos: [CX, 1180, 1], groups: [
      { at: 52, lines: [L_(320, 104, INKP, [['قرمز', 52, { hl: FRED, ht: WHITE }], ['یعنی', 53], ['پراهمیت،', [54, 55]]]), L_(480, 104, INKP, [['نارنجی', 56, { hl: ORANGE, ht: INKD }], ['یعنی', 57], ['متوسط.', 58]])] }] },
    { k: 'hover', bg: LILAC, th: P, wipe: 'left', art: 'hover', kpos: [CX, 1250, 1], groups: [
      { at: 59, lines: [L_(280, 88, INKP, [['روی', 59], ['علامت', 60], ['خبر', 61], ['که', 62], ['بری،', 63]]), L_(410, 92, INKP, [['اسم', 64], ['خبر', 65], ['به', 66], ['فارسی', 67, { hl: VIO, ht: WHITE }], ['میاد', 68]])] },
      { at: 69, lines: [L_(300, 96, INKP, [['و', 69], ['ساعتش', 70]]), L_(440, 104, INKP, [['به', 71], ['وقت', 72], ['تهران؛', 73, { hl: FRED, ht: WHITE }]])] },
      { at: 74, lines: [L_(290, 92, INKP, [['یا', 74], ['هر', 75], ['منطقه‌ی', 76], ['زمانی', 77, { c: VIO }]]), L_(420, 96, INKP, [['که', 78], ['خودت', 79], ['بخوای.', 80, { hl: VIO, ht: WHITE }]])] }] },
    { k: 'future', bg: MINTL, th: P, wipe: 'right', art: 'future', kpos: [CX, 1240, 1.05], groups: [
      { at: 81, lines: [L_(280, 92, INKP, [['خبرهای', 81], ['پیش‌رو', [82, 83], { c: VIO }], ['هم', 84]]), L_(410, 96, INKP, [['با', 85], ['یه', 86], ['خط‌چین', 87, { hl: FRED, ht: WHITE }], ['معلومن؛', [88, 89]]])] },
      { at: 90, lines: [L_(280, 88, INKP, [['یعنی', 90], ['قبل', 91], ['از', 92], ['ورود', 93, { c: VIO }]]), L_(410, 96, INKP, [['می‌دونی', 94], ['خبر', 95], ['کِی', 96, { hl: VIO, ht: WHITE }], ['میاد.', 97]])] }] },
    { k: 'actual', bg: SKYL, th: P, wipe: 'iris', art: 'actual', kpos: [CX, 1230, 1], groups: [
      { at: 98, lines: [L_(270, 88, INKP, [['ولی', 98], ['عدد', 99], ['واقعی', 100, { hl: VIO, ht: WHITE }], ['خبر', 101]]), L_(390, 80, INKP, [['تا', 102], ['بازپخش', 103, { c: VIO }], ['به', 104], ['همون', 105], ['لحظه', 106], ['نرسه،', 107]]), L_(510, 88, INKP, [['نشون', 108], ['داده', 108], ['نمی‌شه؛', 109, { c: FRED }]])] },
      { at: 110, lines: [L_(300, 100, INKP, [['درست', 110], ['مثل', 111]]), L_(450, 110, INKP, [['بازار', 112], ['واقعی.', 113, { hl: LIME, ht: INKD }]])] }] },
    { k: 'panel', bg: PAPER, th: P, wipe: 'up', art: 'panel', kpos: [CX, 1320, 1.05], groups: [
      { at: 114, lines: [L_(250, 88, INKP, [['کنار', 114], ['چارت', 115], ['هم', 116]]), L_(370, 92, INKP, [['تقویم', 117, { hl: VIO, ht: WHITE }], ['کامل', 118], ['رو', 119], ['داری،', 120]])] },
      { at: 121, lines: [L_(250, 92, INKP, [['با', 121], ['تاریخ', 122], ['شمسی', 123, { hl: LIME, ht: INKD }]]), L_(370, 84, INKP, [['و', 124], ['فیلتر', 125], ['کشور', 126, { c: VIO }], ['و', 127], ['اهمیت', 128, { c: FRED }], ['خبر.', 129]])] }] },
    { k: 'test', bg: LIMEL, th: P, wipe: 'left', art: 'test', kpos: [CX, 1230, 1.05], groups: [
      { at: 130, lines: [L_(280, 92, INKP, [['حالا', 130], ['می‌تونی', 131], ['ببینی', 132]]), L_(410, 96, INKP, [['استراتژیت', 133, { c: VIO }], ['موقع', 134], ['خبر', 135, { hl: FRED, ht: WHITE }]]), L_(540, 96, INKP, [['چطوری', 136], ['رفتار', 137], ['می‌کنه.', 138]])] }] },
    { k: 'cta', bg: LILAC, th: P, wipe: 'right', art: 'cta', kpos: [CX, 1240, 1.02], groups: [
      { at: 139, lines: [L_(280, 100, INKP, [['تقویم', 139, { hl: VIO, ht: WHITE }], ['اقتصادی', 140, { hl: VIO, ht: WHITE }]]), L_(420, 84, INKP, [['توی', 141], ['اشتراک', 142], ['حرفه‌ای', 143, { c: VIO }], ['بک‌تست‌لبه؛', 144]]), L_(550, 92, INKP, [['لینکش', 145], ['توی', 146], ['بیوئه.', 147, { hl: LIME, ht: INKD }]])] }] },
    { k: 'end', bg: WHITE, th: P, wipe: 'iris', art: 'end', kpos: [CX, 960, 1], groups: [] },
  ],
  art: { hook: hookArt, brand: brandArtL, half: halfArt, candle: candleArt, flags: flagsArt, colors: colorsArt, hover: hoverArt, future: futureArt, actual: actualArt,
    panel: panelArt, test: testArt, cta: ctaArt, end: endArtL },
  shakes: [[ws(38), 9], [ws(25), 6]],
  cover: () => {
    cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
    txt('کدوم پلتفرم بک‌تست ایرانی', CX, 300, 84, INKP);
    const s = 'تقویم اقتصادی', size = 150, w = measure(s, size); cv.save(); cv.translate(CX, 480); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 26, VIO); cv.restore(); txt(s, CX, 480, size, WHITE);
    txt('روی چارت داره؟', CX, 660, 110, INKP);
    at(CX, 1230, 1, 1, () => { const r = RA, ww = 1000; shot('a0', r, -ww / 2, -300, ww); ringIn(r, [1006, 798, 18, 18], -ww / 2, -300, ww, 1, FRED, true); ringIn(r, [304, 798, 18, 18], -ww / 2, -300, ww, 1, ORANGE, true); });
    at(CX, 1720, 1, 1, () => { if (IMG.icon) cv.drawImage(IMG.icon, 150, -60, 120, 120); if (IMG.wordL) { const w2 = 340, h2 = (w2 * IMG.wordL.height) / IMG.wordL.width; cv.drawImage(IMG.wordL, -w2 / 2 - 60, -h2 / 2, w2, h2); } });
  },
});
