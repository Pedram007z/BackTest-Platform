// f1 · «همیشه میخواستی رو FX Replay بک‌تست بگیری، ولی نمی‌شد؟», the real platform on a desktop screen (z-kit camera).
// Every screen is a real capture of BacktestLab running on the real market data (capture/: a new account, a gold session
// from 14 April 2025 with a 0.30 spread and $7 commission, the replay stepped candle by candle, a Fibonacci, EMA 50 and
// RSI, ten trades placed with the app's own buy and sell buttons and played until they closed, then the analytics).
// Each screen sits in a browser window; the detail the voice names pops out of it as a sharp callout cut from the 2×
// capture, with a ring on the place it came from. The hook and the three pains are drawn (generic, no other brand).
const SX = 40, SY = 700, SW = 1000, SH = 625;                           // the screen inside a window plate
const sx = (x) => SX + (x * SW) / 1440, sy = (y) => SY + (y * SH) / 900;  // CSS px of the 1440×900 capture → plate
const R2 = (r) => [sx(r[0]), sy(r[1]), (r[2] * SW) / 1440, (r[3] * SH) / 900];

function windowFrame() {
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.65)'; cv.shadowBlur = sb(80); cv.shadowOffsetY = sb(30); rrect(SX - 8, SY - 52, SW + 16, SH + 60, 24, '#15121F'); cv.restore();
  const g = cv.createLinearGradient(0, SY - 52, 0, SY); g.addColorStop(0, '#221D33'); g.addColorStop(1, '#17131F'); rrect(SX - 8, SY - 52, SW + 16, 52, [24, 24, 0, 0], g);
  rrect(SX - 8, SY - 52, SW + 16, SH + 60, 24, null, 'rgba(255,255,255,0.1)', 2);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => circle(SX + 20 + i * 24, SY - 26, 7.5, c));
  rrect(SX + 330, SY - 41, 340, 30, 15, 'rgba(255,255,255,0.07)');
  at(SX + 645, SY - 26, 0.55, 1, () => { rrect(-11, -3, 22, 16, 3, MUT); cv.strokeStyle = MUT; cv.lineWidth = 3.5; cv.beginPath(); cv.arc(0, -3, 7, Math.PI, 0); cv.stroke(); });
  txt('بک‌تست‌لب', SX + 500, SY - 25, 18, MUT, { w: 700 });
}
function shot(key, a = 1) { if (!IMG[key] || a <= 0) return; cv.save(); cv.beginPath(); cv.roundRect(SX, SY, SW, SH, [0, 0, 16, 16]); cv.clip(); cv.globalAlpha *= a; cv.drawImage(IMG[key], SX, SY, SW, SH); cv.restore(); }
/** The screen at time t from a list of [key, from]; a new picture fades in over 0.16 s. */
function screens(t, list) { let i = 0; list.forEach(([, t0], j) => { if (t >= t0) i = j; }); if (i > 0) shot(list[i - 1][0]); shot(list[i][0], i > 0 ? cub(k01(t, list[i][1], 0.16)) : 1); }
const seq = (prefix, nums, a, b) => nums.map((n, j) => [`${prefix}${String(n).padStart(3, '0')}`, a + ((b - a) * j) / (nums.length - 1)]);
const range = (a, b, s) => { const o = []; for (let i = a; i <= b; i += s) o.push(i); return o; };
function ring(r, t0, t, col = GOLD) {
  const k = cub(k01(t, t0, 0.3)); if (k <= 0) return; const [x, y, w, h] = R2(r), m = 10 * (1 - k) + 4;
  cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = sb(18); rrect(x - m, y - m, w + 2 * m, h + 2 * m, 10, null, col, 4); cv.restore();
}
/** A callout: the capture's region r (CSS px) cut from the 2× picture, grown out of its place to width w centred on (cx, cy). */
function callout(key, r, cx, cy, w, t0, t, o = {}) {
  const im = IMG[key]; const k = cub(k01(t, t0, 0.5)); if (!im || k <= 0) return;
  const s = im.width / 1440, h = (w * r[3]) / r[2], [hx, hy, hw, hh] = R2(r);
  const x = lerp(hx, cx - w / 2, k), y = lerp(hy, cy - h / 2, k), ww = lerp(hw, w, k), wh = lerp(hh, h, k), pad = 14 * k;
  cv.save(); cv.globalAlpha *= Math.min(1, k * 3);
  line(hx + hw / 2, hy + hh, x + ww / 2, y - pad, rgba(GOLD, 0.7 * k), 3, [8, 8]);
  cv.shadowColor = 'rgba(0,0,0,0.7)'; cv.shadowBlur = sb(50); cv.shadowOffsetY = sb(18); rrect(x - pad, y - pad, ww + 2 * pad, wh + 2 * pad, 22, '#0E0C16'); cv.restore();
  cv.save(); cv.globalAlpha *= Math.min(1, k * 3); cv.beginPath(); cv.roundRect(x, y, ww, wh, 12); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, ww, wh); cv.restore();
  cv.save(); cv.globalAlpha *= Math.min(1, k * 3); rrect(x - pad, y - pad, ww + 2 * pad, wh + 2 * pad, 22, null, rgba(GOLD, 0.85), 3);
  if (o.label) at(cx, y - pad - 34, 1, cub(k01(t, t0 + 0.25, 0.3)), () => chip(o.label, 0, 0, 30, INK, GOLD));
  if (o.ring) { const [rx, ry, rw, rh] = o.ring, kk = cub(k01(t, o.ringAt, 0.3)); if (kk > 0) { const X = (v) => x + ((v - r[0]) / r[2]) * ww, Y = (v) => y + ((v - r[1]) / r[3]) * wh;
    cv.shadowColor = rgba(GOLD, 0.8); cv.shadowBlur = sb(16); rrect(X(rx) - 8, Y(ry) - 6, ((rw / r[2]) * ww) + 16, ((rh / r[3]) * wh) + 12, 12, null, rgba(GOLD, kk), 4); } }
  if (o.note) txt(o.note, cx, y + wh + pad + 40, 30, MUT, { alpha: cub(k01(t, t0 + 0.35, 0.3)) });
  cv.restore();
}
const W4 = (i) => [-(i % 4) * 1250, Math.floor(i / 4) * 2150, 1];
const P = (i, draw, o = {}) => ({ id: 'p' + i, at: W4(i), draw, ...o });

// ================= the plates =================
// 0 · the hook: a page that never loads
const HOOK = P(0, (t) => {
  windowFrame(); rrect(SX, SY, SW, SH, [0, 0, 16, 16], '#0D0B14');
  for (let i = 0; i < 26; i++) { const x = SX + 60 + i * 34, h = 60 + 120 * rnd(i * 3.1), y = SY + 300 - h / 2 + 40 * Math.sin(i * 0.6); rrect(x, y, 16, h, 5, `rgba(255,255,255,${0.05 + 0.04 * Math.sin(t * 3 + i * 0.4)})`); }
  rrect(SX + 60, SY + 520, 420, 18, 9, 'rgba(255,255,255,0.06)'); rrect(SX + 60, SY + 556, 280, 18, 9, 'rgba(255,255,255,0.05)');
  const fail = pop(t - ws(7) + 0.05, 13, 0.5);
  if (fail < 0.02) { cv.save(); cv.strokeStyle = 'rgba(255,255,255,0.75)'; cv.lineWidth = 10; cv.lineCap = 'round'; cv.beginPath(); cv.arc(CX, SY + 300, 56, t * 5, t * 5 + 4.2); cv.stroke(); cv.restore(); }
  else at(CX, SY + 300, cl(fail, 0, 1.25), cl(fail), () => { cv.shadowColor = rgba(R, 0.7); cv.shadowBlur = sb(40); circle(0, 0, 76, R); cv.shadowColor = 'transparent'; line(-28, -28, 28, 28, WHITE, 14); line(28, -28, -28, 28, WHITE, 14); });
});
// 1 · the three pains
const PAINS = P(1, (t) => {
  const items = [[ws(10), 760], [ws(15), 1130], [ws(22), 1500]];
  items.forEach(([t0, y], i) => {
    const k = pop(t - t0 + 0.05, 13, 0.55); if (k <= 0) return; const dim = i < 2 && t > items[i + 1][0] ? 0.45 : 1;
    at(CX, y, lerp(0.85, 1, cl(k)), cl(k) * dim, () => { card(-450, -160, 900, 320, 44);
      if (i === 0) {        // a bank card, declined
        const g = cv.createLinearGradient(-400, -110, -110, 110); g.addColorStop(0, '#5B3FD9'); g.addColorStop(1, '#2A6BE0'); rrect(-400, -110, 300, 200, 22, g);
        rrect(-370, -60, 50, 38, 8, '#E8C25A'); txt('•••• •••• •••• 4821', -250, 40, 24, 'rgba(255,255,255,0.9)', { w: 700, dir: 'ltr' });
        txt('پرداخت ناموفق', 160, -20, 54, R); txt('کارت بانکی خارجی', 160, 50, 34, MUT, { w: 700 });
        at(-110, -100, cl(pop(t - t0 - 0.35, 14, 0.5), 0, 1.2), 1, () => { circle(0, 0, 36, R); line(-13, -13, 13, 13, WHITE, 8); line(13, -13, -13, 13, WHITE, 8); });
      } else if (i === 1) { // a VPN switching off
        const off = cub(k01(t, ws(18), 0.25));
        at(-300, 0, 1, 1, () => { cv.fillStyle = mixC(G, '#5A5670', off); cv.beginPath(); cv.moveTo(0, -95); cv.lineTo(80, -60); cv.lineTo(70, 40); cv.quadraticCurveTo(40, 85, 0, 105); cv.quadraticCurveTo(-40, 85, -70, 40); cv.lineTo(-80, -60); cv.closePath(); cv.fill(); });
        rrect(-160, -40, 150, 80, 40, mixC(G, '#3B374D', off)); circle(lerp(-50, -120, off), 0, 32, WHITE);
        txt(off > 0.5 ? 'قطع شد' : 'وصل', 190, -20, 54, off > 0.5 ? R : G); txt('فیلترشکن', 190, 50, 34, MUT, { w: 700 });
      } else {              // a dollar price
        at(-290, 0, 1, 1, () => { cv.save(); cv.rotate(-0.18); cv.fillStyle = GOLD; cv.beginPath(); cv.moveTo(-110, -70); cv.lineTo(60, -70); cv.lineTo(120, 0); cv.lineTo(60, 70); cv.lineTo(-110, 70); cv.closePath(); cv.fill(); circle(70, 0, 12, INK); txt('$', -30, 4, 110, INK, { dir: 'ltr' }); cv.restore(); });
        for (let a = 0; a < 3; a++) { const yy = 60 - ((t * 120 + a * 40) % 120); at(-120 + a * 26, yy, 1, cl(1 - Math.abs(yy) / 70), () => { cv.fillStyle = R; cv.beginPath(); cv.moveTo(0, -16); cv.lineTo(13, 6); cv.lineTo(-13, 6); cv.fill(); }); }
        txt('قیمت دلاری', 170, -20, 54, GOLD); txt('ماهانه، به دلار', 170, 50, 34, MUT, { w: 700 });
      } });
  });
});
// 2 · the good news: BacktestLab
const GOOD = P(2, (t) => {
  const ki = pop(t - T.good - 0.2, 11, 0.6); if (ki > 0 && IMG.icon) at(CX, 900, cl(ki, 0, 1.25), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.7); cv.shadowBlur = sb(90); cv.drawImage(IMG.icon, -170, -170, 340, 340); });
  const kw = cub(k01(t, T.good + 0.45, 0.4)); if (kw > 0 && IMG.word) { const w = 620, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - w / 2, 1130 + (1 - kw) * 30, w, h); cv.restore(); }
  [['فارسی', 790], ['پرداخت ریالی', 540], ['بدون کارت خارجی', 250]].forEach(([s, x], j) => { const k = pop(t - ws(30) - j * 0.12, 14, 0.5); if (k > 0) at(x, 1420, cl(k, 0, 1.2), cl(k), () => chip(s, 0, 0, 34, WHITE, 'rgba(34,197,139,0.16)', { stroke: rgba(G, 0.7), lw: 2 })); });
});
// 3–11 · the real screens
const FA = P(3, (t) => { windowFrame(); shot('a-signup'); ring([900, 280, 405, 355], ws(34), t); callout('a-signup', [905, 285, 400, 345], CX, 1645, 520, ws(34) + 0.05, t); });
const RIAL = P(4, (t) => { windowFrame(); shot('b-billing'); ring([80, 535, 337, 262], ws(37), t); callout('b-billing', [80, 535, 337, 262], CX, 1630, 600, ws(37) + 0.05, t, { label: 'درگاه بانکی و شاپرک' }); });
const DATA = P(5, (t) => { windowFrame(); shot('c-session'); ring([455, 680, 535, 105], ws(43) - 0.1, t); callout('c-session', [455, 680, 535, 105], CX, 1560, 960, ws(43), t, { note: '۱۱ دی ۱۳۹۳ تا ۱۵ مهر ۱۴۰۵ = ژانویه‌ی ۲۰۱۵ تا اکتبر ۲۰۲۶' }); });
const REPLAY = P(6, (t) => {
  windowFrame(); screens(t, seq('d-', range(2, 40, 2), T.replay - 0.25, T.future + 0.5));
  const kf = cub(k01(t, T.future + 0.2, 0.4)); if (kf > 0) { const x = sx(1081), y0 = sy(196), y1 = sy(792);
    cv.save(); cv.globalAlpha *= kf; cv.beginPath(); cv.rect(x, y0, sx(1136) - x, y1 - y0); cv.clip(); cv.fillStyle = 'rgba(11,9,18,0.7)'; cv.fillRect(x, y0, 80, y1 - y0);
    for (let k = -12; k < 30; k++) line(x + k * 9, y1, x + k * 9 + 80, y0 + (y1 - y0) * 0.86, rgba(GOLD, 0.25), 2); cv.restore();
    line(x, y0, x, y1, rgba(GOLD, kf), 3, [8, 6]);
    at(x - 70, sy(470), 0.9, kf, () => chip('آینده؟', 0, 0, 22, INK, GOLD)); }
});
const TOOLS = P(7, (t) => { windowFrame(); screens(t, [['e-start', 0], ['e-fib', ws(57) - 0.05], ['e-indicators', ws(59) - 0.05]]); });
const TRADE = P(8, (t) => {
  windowFrame(); screens(t, [['f-buy', 0], ['f-placed', ws(66) - 0.1], ...seq('g-', range(2, 30, 2), ws(67) + 0.15, T.costs - 0.35)]);
  ring([505, 803, 680, 40], ws(64) - 0.1, t); callout('f-buy', [505, 803, 680, 40], CX, 1470, 980, ws(64), t, { label: 'ورود، حد ضرر، حد سود، R:R' });
});
const COSTS = P(9, (t) => { windowFrame(); shot('c-session'); ring([455, 295, 535, 200], ws(70) - 0.1, t); callout('c-session', [455, 295, 535, 200], CX, 1610, 900, ws(70), t); });
const ANALYTICS = P(10, (t) => { windowFrame(); shot('h-analytics'); ring([500, 350, 650, 55], ws(79) - 0.1, t); callout('h-analytics', [500, 350, 650, 55], CX, 1470, 980, ws(79), t, { ring: [690, 352, 92, 48], ringAt: ws(83), note: '۱۰ معامله‌ی واقعی توی همین جلسه' }); });
const STREAK = P(11, (t) => { windowFrame(); shot('h-analytics-2'); ring([40, 205, 550, 252], ws(86) - 0.1, t, R); callout('h-analytics-2', [40, 205, 550, 252], CX, 1620, 780, ws(86), t, { ring: [52, 378, 525, 26], ringAt: ws(88) }); });
// 12 · the comment and the DM
const CTA = P(12, (t) => {
  card(70, 700, 940, 1000, 54); txt('کامنت‌ها', CX, 765, 40, WHITE); line(110, 815, 970, 815, RULE, 2);
  [[890, 0.7], [1010, 0.5]].forEach(([y, w]) => { circle(920, y, 30, '#2A2340'); rrect(870 - 520 * w, y - 26, 520 * w, 18, 9, 'rgba(255,255,255,0.12)'); rrect(870 - 360 * w, y + 8, 360 * w, 16, 8, 'rgba(255,255,255,0.07)'); });
  const word = 'ریپلی', n = word.length, typed = Math.min(n, Math.floor(cl((t - ws(105) + 0.1) / 0.5) * (n + 0.999))), sent = pop(t - ws(106), 14, 0.5);
  if (sent > 0) at(CX, 1130, cl(sent, 0, 1.15), cl(sent), () => { rrect(-430, -60, 860, 120, 30, rgba(GOLD, 0.1), rgba(GOLD, 0.6), 2); circle(380, 0, 34, GOLD); txt('تو', 380, 2, 28, INK); txt(word, 300, 2, 46, GOLD, { align: 'right' }); });
  rrect(110, 1560, 860, 100, 50, '#0F0D17', rgba(GOLD, typed > 0 && sent <= 0 ? 0.7 : 0.15), 2);
  if (sent <= 0.05) { if (typed > 0) txt(word.slice(0, typed), 900, 1612, 44, WHITE, { align: 'right' }); else txt('یه کامنت بنویس…', 900, 1612, 34, DIM, { align: 'right' });
    if (Math.floor(t * 3) % 2 === 0) rrect(typed > 0 ? 900 - measure(word.slice(0, typed), 44) - 14 : 902, 1588, 4, 48, 2, GOLD); }
  at(175, 1610, 1, 1, () => { circle(0, 0, 38, typed > 0 ? GOLD : '#2A2340'); cv.fillStyle = INK; cv.beginPath(); cv.moveTo(14, 0); cv.lineTo(-12, -16); cv.lineTo(-6, 0); cv.lineTo(-12, 16); cv.closePath(); cv.fill(); });
  const kd = pop(t - ws(112) + 0.1, 12, 0.6); if (kd > 0) at(CX, 1340 + 60 * (1 - cl(kd)), lerp(0.9, 1, cl(kd)), cl(kd), () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.6)'; cv.shadowBlur = sb(50); rrect(-400, -150, 800, 300, 40, '#1E1836'); cv.restore(); rrect(-400, -150, 800, 300, 40, null, rgba(VIOL, 0.5), 2);
    if (IMG.icon) cv.drawImage(IMG.icon, 300, -126, 72, 72); txt('دایرکت', 270, -90, 34, WHITE, { align: 'right' }); txt('همین الان', -360, -90, 26, MUT, { align: 'left' });
    rrect(-370, -30, 740, 150, 30, VIO); txt('اینم لینک شروع رایگان:', 330, 12, 34, WHITE, { align: 'right' });
    rrect(-340, 44, 680, 56, 28, 'rgba(255,255,255,0.16)'); if (IMG.word) { const w = 170, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, 80, 72 - h / 2, w, h); } txt('باز کن', -300, 74, 28, WHITE, { align: 'left' });
  });
});
// 13 · the end card
const END = P(13, (t) => {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 760, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = sb(70); cv.drawImage(IMG.icon, -150, -150, 300, 300); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.word) { const w = 580, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - w / 2, 960 + (1 - kw) * 24, w, h); cv.restore(); }
  const kc = pop(t - t0 - 0.45, 13, 0.55); if (kc > 0) at(CX, 1250, cl(kc, 0, 1.2), cl(kc), () => chip('کامنت کن: «ریپلی»', 0, 0, 64, INK, GOLD));
  const ks = cub(k01(t, t0 + 0.8, 0.4)); if (ks > 0) txt('لینک شروع رایگان رو دایرکت می‌گیری', CX, 1400, 40, MUT, { alpha: ks });
}, { from: T.cta });
const mixC = (a, b, k) => { const p = (h) => (h[0] === '#' ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).slice(0, 3).map(Number)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], cl(k)))).join(',')})`; };

// ================= the take =================
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
const GRID = [-1.5 * 1250, 1.5 * 2150];
world({
  plates: [HOOK, PAINS, GOOD, FA, RIAL, DATA, REPLAY, TOOLS, TRADE, COSTS, ANALYTICS, STREAK, CTA, END],
  shots: [
    { k: 'hook', cam: HOOK.at, tone: R, push: 0.05, groups: [
      { at: 0, lines: [L(300, 96, [['همیشه', 0], ['میخواستی', 1], ['رو', 2]]), L(440, 140, [['FX Replay', [3, 4], { gold: true }]]), L(575, 96, [['بک‌تست', 5], ['بگیری،', 6]])] },
      { at: 7, lines: [L(420, 160, [['ولی', 7], ['نمی‌شد؟', 8, { c: R }]])] }] },
    { k: 'pains', cam: PAINS.at, tone: R, md: 0.75, groups: [
      { at: 9, lines: [L(330, 100, [['یا', 9], ['کارت', 10], ['بانکی', 11], ['خارجی', 12, { c: R }]]), L(470, 100, [['نداشتی؟', 13]])] },
      { at: 14, lines: [L(330, 100, [['یا', 14], ['وسط', 15], ['کار', 16]]), L(470, 100, [['فیلترشکنت', [17, 18], { c: R }], ['قطع', 19], ['شد؟', 20]])] },
      { at: 21, lines: [L(330, 100, [['یا', 21], ['قیمت', 22], ['دلاریش', 23, { c: R }]]), L(470, 100, [['منصرفت', 24], ['کرد؟', 25]])] }] },
    { k: 'good', cam: GOOD.at, tone: VIO, md: 0.8, groups: [{ at: 26, lines: [L(330, 104, [['خبر', 26], ['خوب', 27, { gold: true }], ['اینه', 28], ['که', 29]]), L(480, 120, [['دیگه', 30], ['لازم', 31], ['نیست.', 32, { gold: true, u: true }]])] }] },
    { k: 'fa', cam: FA.at, tone: VIO, md: 0.7, groups: [{ at: 33, lines: [L(400, 130, [['بک‌تست‌لب', [33, 34], { c: VIOL }], ['فارسیه،', 35, { gold: true }]])] }] },
    { k: 'rial', cam: RIAL.at, tone: GOLD, md: 0.62, groups: [{ at: 36, lines: [L(400, 130, [['با', 36], ['پرداخت', 37], ['ریالی.', 38, { gold: true, u: true }]])] }] },
    { k: 'data', cam: DATA.at, tone: G, md: 0.65, groups: [{ at: 39, lines: [L(330, 108, [['بازار', 39], ['واقعی', 40], ['رو', 41]]), L(480, 120, [['از', 42], ['۲۰۱۵', 43, { gold: true }], ['تا', 44], ['الان', 45, { gold: true }]])] }] },
    { k: 'replay', cam: REPLAY.at, tone: G, md: 0.6, groups: [{ at: 46, lines: [L(400, 120, [['دوباره', 46], ['پخش', 47, { gold: true }], ['می‌کنی،', 48]])] }] },
    { k: 'future', cam: frame(REPLAY, sx(1000), sy(430), 0.46), tone: GOLD, md: 0.7, push: 0.03, scrimB: 1330, groups: [{ at: 49, lines: [L(1560, 104, [['بدون', 49], ['اینکه', [50, 51]]]), L(1710, 112, [['آینده', 52, { gold: true }], ['رو', 53], ['ببینی؛', 54]])] }] },
    { k: 'tools', cam: frame(TOOLS, sx(590), sy(470), 0.62), tone: VIO, md: 0.75, push: 0.04, scrimB: 1380, groups: [{ at: 55, lines: [L(1560, 100, [['روی', 55], ['چارت', 56], ['خط', 57, { gold: true }], ['می‌کشی،', 58]]), L(1705, 100, [['اندیکاتور', 59, { gold: true }], ['می‌ذاری،', 60]])] }] },
    { k: 'trade', cam: TRADE.at, tone: G, md: 0.75, groups: [{ at: 61, lines: [L(320, 100, [['و', 61], ['مثل', 62], ['حساب', 63], ['واقعی', 64]]), L(470, 110, [['خرید', 65, { c: G }], ['و', 66], ['فروش', 67, { c: R }], ['می‌کنی؛', 68]])] }] },
    { k: 'costs', cam: COSTS.at, tone: GOLD, md: 0.7, groups: [{ at: 69, lines: [L(320, 100, [['حتی', 69], ['اسپرد', 70, { gold: true }], ['و', 71], ['کمیسیون', 72, { gold: true }]]), L(470, 96, [['بروکرت', 73], ['رو', 74], ['هم', 75], ['حساب', 76], ['می‌کنه.', 77]])] }] },
    { k: 'analytics', cam: ANALYTICS.at, tone: VIO, md: 0.7, groups: [{ at: 78, lines: [L(320, 104, [['آخرشم', 78], ['آنالیز', 79, { c: VIOL }]]), L(470, 104, [['بهت', 80], ['می‌گه', 81], ['وین‌ریتت', [82, 83], { gold: true }], ['چنده', 84]])] }] },
    { k: 'streak', cam: STREAK.at, tone: R, md: 0.65, groups: [{ at: 85, lines: [L(320, 104, [['و', 85], ['بدترین', 86], ['ضررهای', 87, { c: R }]]), L(470, 100, [['پشت', 88], ['سر', 89], ['همت', 90], ['چندتاست.', 91, { gold: true }]])] }] },
    { k: 'weekend', cam: [GRID[0], GRID[1], 3.4], tone: GOLD, md: 1.0, push: 0.08, scrim: 760, groups: [{ at: 92, lines: [L(310, 112, [['یه', 92], ['آخر', 93], ['هفته،', 94, { gold: true }]]), L(470, 112, [['چند', 95], ['سال', 96, { gold: true }], ['بازار', 97]]), L(620, 100, [['رو', 98], ['تست', 99], ['کن.', 100, { gold: true, u: true }]])] }] },
    { k: 'cta', cam: CTA.at, tone: VIO, md: 1.0, roll: 0.04, groups: [
      { at: 101, lines: [L(320, 108, [['زیر', 101], ['همین', 102], ['ویدیو', 103]]), L(490, 124, [['بنویس', 104], ['«ریپلی»', 105, { hl: GOLD }]])] },
      { at: 106, lines: [L(320, 100, [['تا', 106], ['لینک', 107], ['شروع', 108], ['رایگان', 109, { gold: true }]]), L(470, 100, [['رو', 110], ['برات', 111], ['دایرکت', 112, { gold: true }], ['کنم.', 113]])] }] },
    { k: 'end', cam: END.at, tone: VIO, md: 0.7, groups: [] },
  ],
  shakes: [[ws(7), 9]],
  cover: () => {
    cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
    const g = cv.createRadialGradient(CX, 1150, 0, CX, 1150, 1000); g.addColorStop(0, rgba(VIO, 0.28)); g.addColorStop(1, rgba(VIO, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
    cv.save(); cv.translate(0, 80); windowFrame(); shot('e-indicators'); cv.restore();
    txt('همیشه میخواستی رو', CX, 300, 96, WHITE); txt('FX Replay', CX, 450, 150, GOLD, { glow: rgba(GOLD, 0.5), gb: 40 }); txt('بک‌تست بگیری؟', CX, 600, 96, WHITE);
    chip('بک‌تست‌لب: فارسی، با پرداخت ریالی', CX, 1600, 46, INK, GOLD);
    finish(0);
  },
});
