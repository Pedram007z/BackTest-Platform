// s1 · Instagram story: «طبق درخواست کاربران عزیز بک‌تست‌لب، اندیکاتور سشن‌ها به لیست اندیکاتورها افزوده شد» (z-kit camera,
// no voice: the words are timed to a 120 BPM score in data.py). The announcement, then the indicator used on the real
// desktop platform (capture/cap.mjs: a fresh account, a gold session from 14 September 2026 on the TradingView chart):
// Indicators opened and "Sessions" typed and added; the boxes with each session's high and low; its settings; and the
// replay stepped from the London open while the London box grows and New York starts. The cursor is drawn where each
// button sat (marks.json). The candles on the announcement card are a drawn illustration, not market data.
const SX = 40, SY = 700, SW = 1000, SH = 625;                           // the screen inside a window plate
const sx = (x) => SX + (x * SW) / 1440, sy = (y) => SY + (y * SH) / 900;  // CSS px of the 1440×900 capture → plate
const M = D.marks || {};   // where the buttons sat (capture/cap.mjs → marks.json, carried in data.json)
const mid = (k) => (M[k] ? [M[k][0] + M[k][2] / 2, M[k][1] + M[k][3] / 2] : [720, 450]);

function windowFrame() {
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.65)'; cv.shadowBlur = sb(80); cv.shadowOffsetY = sb(30); rrect(SX - 8, SY - 52, SW + 16, SH + 60, 24, '#15121F'); cv.restore();
  const g = cv.createLinearGradient(0, SY - 52, 0, SY); g.addColorStop(0, '#221D33'); g.addColorStop(1, '#17131F'); rrect(SX - 8, SY - 52, SW + 16, 52, [24, 24, 0, 0], g);
  rrect(SX - 8, SY - 52, SW + 16, SH + 60, 24, null, 'rgba(255,255,255,0.1)', 2);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => circle(SX + 20 + i * 24, SY - 26, 7.5, c));
  rrect(SX + 330, SY - 41, 340, 30, 15, 'rgba(255,255,255,0.07)');
  at(SX + 645, SY - 26, 0.55, 1, () => { rrect(-11, -3, 22, 16, 3, MUT); cv.strokeStyle = MUT; cv.lineWidth = 3.5; cv.beginPath(); cv.arc(0, -3, 7, Math.PI, 0); cv.stroke(); });
  txt('backtestlab.ir', SX + 500, SY - 25, 17, MUT, { w: 700 });
}
function shot(key, a = 1) { if (!IMG[key] || a <= 0) return; cv.save(); cv.beginPath(); cv.roundRect(SX, SY, SW, SH, [0, 0, 16, 16]); cv.clip(); cv.globalAlpha *= a; cv.drawImage(IMG[key], SX, SY, SW, SH); cv.restore(); }
/** The screen at time t from a list of [key, from]; a new picture fades in over `fade` s. */
function screens(t, list, fade = 0.12) { let i = 0; list.forEach(([, t0], j) => { if (t >= t0) i = j; }); if (i > 0) shot(list[i - 1][0]); shot(list[i][0], i > 0 ? cub(k01(t, list[i][1], fade)) : 1); }
const seq = (prefix, nums, a, b) => nums.map((n, j) => [`${prefix}${String(n).padStart(2, '0')}`, a + ((b - a) * j) / Math.max(1, nums.length - 1)]);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/** a gold ring round a region (CSS px of the capture) */
function ring(r, t0, t, col = GOLD) {
  const k = cub(k01(t, t0, 0.3)); if (k <= 0) return; const x = sx(r[0]), y = sy(r[1]), w = (r[2] * SW) / 1440, h = (r[3] * SH) / 900, m = 8 * (1 - k) + 3;
  cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = sb(14); rrect(x - m, y - m, w + 2 * m, h + 2 * m, 7, null, col, 2.4); cv.restore();
}
/** The mouse pointer along keyframes [t, cssX, cssY, click?] (absolute times); a click leaves a ripple. */
function cursor(t, keys) {
  if (t < keys[0][0] - 0.2 || t > keys[keys.length - 1][0] + 0.6) return;
  let i = 0; keys.forEach((k, j) => { if (t >= k[0]) i = j; });
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], k = b === a ? 1 : inOut(cl((t - a[0]) / (b[0] - a[0])));
  const x = sx(lerp(a[1], b[1], k)), y = sy(lerp(a[2], b[2], k));
  keys.forEach(([tc, cxx, cyy, click]) => { if (!click) return; const d = t - tc; if (d < 0 || d > 0.45) return;
    const r = 6 + 26 * cub(d / 0.45); circle(sx(cxx), sy(cyy), r, null, rgba(GOLD, 0.9 * (1 - d / 0.45)), 3); });
  const press = keys.some(([tc, , , click]) => click && t >= tc - 0.05 && t < tc + 0.1) ? 0.85 : 1;
  at(x, y, 0.95 * press, 1, () => {
    cv.save(); cv.shadowColor = 'rgba(0,0,0,0.55)'; cv.shadowBlur = sb(8); cv.shadowOffsetY = sb(2);
    cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(0, 22); cv.lineTo(5.5, 17); cv.lineTo(9.5, 26); cv.lineTo(13, 24.5); cv.lineTo(9, 15.8); cv.lineTo(16, 15.5); cv.closePath();
    cv.fillStyle = WHITE; cv.fill(); cv.shadowColor = 'transparent'; cv.strokeStyle = '#0B0912'; cv.lineWidth = 1.6; cv.stroke(); cv.restore();
  });
}
const W4 = (i) => [-(i % 4) * 1250, Math.floor(i / 4) * 2150, 1];
const P = (i, draw, o = {}) => ({ id: 'p' + i, at: W4(i), draw, ...o });
const SES = [['Tokyo', '#EC4899'], ['London', '#3B82F6'], ['New York', '#F59E0B']];

// ================= the plates =================
// 0 · the users asked: a crowd of users, each sending a request with the sessions' colours
const INTRO = P(0, (t) => {
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.12 + (0.76 * i) / (n - 1)), x = CX - Math.cos(a) * 400, y = 1500 - Math.sin(a) * 230, k = pop(t - 0.25 - i * 0.16, 13, 0.55);
    if (k <= 0) continue; const tint = [VIO, G, GOLD, R, VIOL, '#3B82F6', '#EC4899'][i];
    at(x, y, cl(k, 0, 1.2) * 0.95, cl(k), () => {
      cv.save(); cv.shadowColor = rgba(tint, 0.5); cv.shadowBlur = sb(30); circle(0, 0, 58, '#1B1728'); cv.restore(); circle(0, 0, 58, null, rgba(tint, 0.9), 4);
      circle(0, -14, 17, rgba(tint, 0.9)); cv.fillStyle = rgba(tint, 0.9); cv.beginPath(); cv.ellipse(0, 26, 30, 20, 0, Math.PI, 0); cv.fill();
      // the request bubble: the three sessions' colours
      const kb = pop(t - 0.55 - i * 0.16, 12, 0.6); if (kb > 0) at(44, -70, cl(kb, 0, 1.2), cl(kb), () => {
        rrect(-34, -24, 68, 48, 16, '#F2EEFF'); cv.fillStyle = '#F2EEFF'; cv.beginPath(); cv.moveTo(-18, 20); cv.lineTo(-26, 34); cv.lineTo(-6, 22); cv.fill();
        SES.forEach(([, c], j) => rrect(-22 + j * 16, -12 + (j % 2) * 6, 12, 20 - (j % 2) * 6, 3, c));
      });
    });
  }
  // the requests rise into the logo
  const ki = pop(t - 1.55, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 1060, cl(ki, 0, 1.25) * 0.8, cl(ki), () => { cv.shadowColor = rgba(VIO, 0.7); cv.shadowBlur = sb(80); cv.drawImage(IMG.icon, -110, -110, 220, 220); });
});
// 1 · the news: a drawn chart card with the three session boxes and their highs and lows (an illustration)
const BARS = (() => { const out = []; let p = 100; for (let i = 0; i < 54; i++) { const o = p, mv = (rnd(i * 2.3) - 0.48) * 2.6 + Math.sin(i / 7) * 0.9, c = o + mv;
  out.push([o, Math.max(o, c) + rnd(i * 5.1) * 1.3, Math.min(o, c) - rnd(i * 7.7) * 1.3, c]); p = c; } return out; })();
const NEWS = P(1, (t) => {
  const t0 = T.news, kc = cub(k01(t, t0 - 0.35, 0.45)); if (kc <= 0) return;
  cv.save(); cv.globalAlpha *= kc; cv.translate(0, (1 - kc) * 40);
  card(70, 760, 940, 560, 46);
  const box = [120, 840, 960, 1270], sh = candleChart(BARS, BARS.length, box, { bw: 0.6 });
  [[4, 20], [18, 36], [31, 53]].forEach(([a, b], j) => {
    const k = cub(k01(t, t0 + 0.15 + j * 0.3, 0.35)); if (k <= 0) return; const [name, col] = SES[j];
    let hi = -1e9, lo = 1e9; for (let i = a; i <= b; i++) { hi = Math.max(hi, BARS[i][1]); lo = Math.min(lo, BARS[i][2]); }
    const x0 = sh.X(a) - sh.step / 2, x1 = lerp(x0, sh.X(b) + sh.step / 2, k), yh = sh.Y(hi), yl = sh.Y(lo);
    rrect(x0, yh, x1 - x0, yl - yh, 4, rgba(col, 0.13)); line(x0, yh, x1, yh, col, 4); line(x0, yl, x1, yl, col, 4);
    line(x0, yh, x0, yl, rgba(col, 0.5), 2, [6, 6]); if (k > 0.98) line(x1, yh, x1, yl, rgba(col, 0.5), 2, [6, 6]);
    txt(name, x0 + 6, yh - 22, 26, col, { align: 'left', alpha: cub(k01(t, t0 + 0.35 + j * 0.3, 0.3)) });
  });
  cv.restore();
});
// 2 · Indicators → "Sessions" → added
const ADD = P(2, (t) => {
  const a = T.add;
  windowFrame();
  screens(t, [['a0', 0], ['a1', a - 0.05], ['b00', a + 0.8], ...seq('b', range(1, 8), a + 1.15, a + 2.05), ['b09', a + 2.45], ['b10', a + 2.9]]);
  const [ix, iy] = mid('indicators'), [qx, qy] = mid('search'), [rx, ry] = mid('result');
  cursor(t, [[a - 0.4, 980, 560], [a + 0.45, ix, iy], [a + 0.75, ix, iy, 1], [a + 1.05, qx + 60, qy + 4], [a + 2.15, qx + 60, qy + 4], [a + 2.45, rx - 10, ry], [a + 2.85, rx - 10, ry, 1], [a + 3.3, rx - 10, ry]]);
});
// 3 · the boxes: each session's high and low
const BOXES = P(3, (t) => {
  const a = T.boxes;
  windowFrame(); shot('c0');
  // the London box of Friday 11 September: its top and bottom are the session's high and low
  const x0 = 321, x1 = 706, yh = 260, yl = 770, blue = '#3B82F6';
  [[yh, 'سقف سشن', a + 0.15], [yl, 'کف سشن', a + 0.45]].forEach(([y, label, t0]) => {
    const k = cub(k01(t, t0, 0.4)); if (k <= 0) return;
    cv.save(); cv.shadowColor = rgba(GOLD, 0.9); cv.shadowBlur = sb(16); line(sx(x0), sy(y), sx(lerp(x0, x1, k)), sy(y), GOLD, 3.4); cv.restore();
    const kc = pop(t - t0 - 0.2, 13, 0.55); if (kc > 0) at(sx(x0) - 8, sy(y), cl(kc, 0, 1.15) * 0.62, cl(kc), () => {
      const w = chip(label, -110, 0, 30, INK, GOLD); cv.fillStyle = GOLD; cv.beginPath(); cv.moveTo(-110 + w / 2 - 2, -12); cv.lineTo(-110 + w / 2 + 14, 0); cv.lineTo(-110 + w / 2 - 2, 12); cv.fill(); });
  });
  ring([x0, yh, x1 - x0, yl - yh], a + 1.0, t, blue);
});
// 4 · the settings: four sessions, each with its hours, time zone and colour
const SET = P(4, (t) => {
  const a = T.set;
  windowFrame(); screens(t, [['d0', 0], ['d1', a + 1.05]], 0.1);
  ring([404, 506, 384, 226], a + 1.45, t);
});
// 5 · the replay steps on from the London open: London grows, New York starts
const LIVE = P(5, (t) => {
  const a = T.live;
  windowFrame(); screens(t, seq('f', range(0, 36), a - 0.25, a + 3.3), 0.06);
  const kf = pop(t - a - 2.6, 12, 0.6); if (kf > 0) at(sx(985), sy(395), cl(kf, 0, 1.15) * 0.5, cl(kf), () => chip('بدون دیدن آینده', 0, 0, 30, INK, GOLD));
});
// 6 · the end card
const END = P(6, (t) => {
  const t0 = T.end, ki = pop(t - t0 + 0.05, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 720, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = sb(70); cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, t0 + 0.2, 0.35)); if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - w / 2, 905 + (1 - kw) * 24, w, h); cv.restore(); }
  const ks = pop(t - t0 - 0.4, 13, 0.55); if (ks > 0) at(CX, 1150, cl(ks, 0, 1.15), cl(ks), () => {
    txt('اندیکاتور سشن‌ها', 0, 0, 74, GOLD, { glow: rgba(GOLD, 0.45), gb: 30 });
    SES.forEach(([, c], j) => rrect(-120 + j * 90, 62, 60, 12, 6, c)); });
  const kc = pop(t - t0 - 0.75, 13, 0.55); if (kc > 0) at(CX, 1330, cl(kc, 0, 1.2), cl(kc), () => chip('همین حالا امتحانش کن', 0, 0, 52, INK, GOLD));
  const ku = cub(k01(t, t0 + 1.05, 0.4)); if (ku > 0) txt('backtestlab.ir', CX, 1460, 44, MUT, { alpha: ku, w: 800 });
}, { from: T.live });

// ================= the take =================
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
world({
  plates: [INTRO, NEWS, ADD, BOXES, SET, LIVE, END],
  shots: [
    { k: 'intro', cam: INTRO.at, tone: VIO, push: 0.06, groups: [
      { at: 0, lines: [L(470, 100, [['طبق', 0], ['درخواست', 1]]), L(630, 112, [['کاربران', 2], ['عزیز', 3, { gold: true }]]), L(800, 136, [['بک‌تست‌لب', 4, { c: VIOL }]])] }] },
    { k: 'news', cam: NEWS.at, tone: GOLD, md: 0.7, push: 0.05, groups: [
      { at: 5, lines: [L(390, 100, [['اندیکاتور', 5]]), L(570, 176, [['سشن‌ها', 6, { gold: true, u: true }]]),
        L(1450, 84, [['به', 7], ['لیست', 8], ['اندیکاتورها', 9]]), L(1600, 104, [['افزوده', 10, { hl: G }], ['شد', 11, { hl: G }]])] }] },
    { k: 'add', cam: frame(ADD, sx(600), sy(470), 0.56), tone: VIO, md: 0.75, push: 0.3, dy: -60, scrim: 640, hud: true, groups: [
      { at: 12, lines: [L(330, 84, [['از', 12], ['لیست', 13], ['اندیکاتورها', 14]]), L(480, 104, [['Sessions', 15, { gold: true }], ['رو', 16], ['اضافه', 17], ['کن', 18]])] }] },
    { k: 'boxes', cam: frame(BOXES, sx(470), sy(520), 0.52), tone: '#3B82F6', md: 0.75, push: 0.06, scrim: 640, groups: [
      { at: 19, lines: [L(330, 92, [['سقف', 19, { gold: true }], ['و', 20], ['کف', 21, { gold: true }], ['هر', 22], ['سشن،', 23]]), L(480, 92, [['خودکار', 24], ['روی', 25], ['چارت', 26]])] }] },
    { k: 'set', cam: frame(SET, sx(596), sy(520), 0.43), tone: VIO, md: 0.75, push: 0.05, scrim: 640, groups: [
      { at: 27, lines: [L(330, 82, [['ساعت،', 27], ['منطقه‌ی', 28], ['زمانی', 29], ['و', 30], ['رنگ', 31]]), L(480, 96, [['هر', 32], ['۴', 33, { gold: true }], ['سشن', 34, { gold: true }], ['دست', 35], ['خودته', 36]])] }] },
    { k: 'live', cam: frame(LIVE, sx(715), sy(530), 0.5), tone: G, md: 0.75, push: 0.06, scrim: 640, groups: [
      { at: 37, lines: [L(330, 88, [['با', 37], ['هر', 38], ['کندل', 39], ['جدید،', 40]]), L(480, 96, [['سقف', 41, { gold: true }], ['و', 42], ['کف', 43, { gold: true }], ['به‌روز', 44], ['می‌شه', 45]])] }] },
    { k: 'end', cam: END.at, tone: VIO, md: 0.8, groups: [] },
  ],
  shakes: [[T.news, 7]],
  cover: () => {
    cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
    const g = cv.createRadialGradient(CX, 1150, 0, CX, 1150, 1000); g.addColorStop(0, rgba(VIO, 0.28)); g.addColorStop(1, rgba(VIO, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
    cv.save(); cv.translate(0, 120); windowFrame(); shot('f36'); cv.restore();
    txt('اندیکاتور', CX, 360, 100, WHITE); txt('سشن‌ها', CX, 540, 176, GOLD, { glow: rgba(GOLD, 0.5), gb: 40 });
    chip('به لیست اندیکاتورها افزوده شد', CX, 1600, 46, INK, GOLD);
    finish(0);
  },
});
