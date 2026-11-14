// k24 · «چند بار باید ضرر کنی تا بفهمی استراتژی‌ات ایراد داره؟», a kinetic typography reel on the user's take at its
// normal speed. Big Persian words slam in as they are spoken, the background flips colour on every idea with a wipe,
// and each idea has one animated graphic:
//   - the hook: the whole question on screen from the first frame, each word lighting up as it is said, red loss chips
//     piling into a tower;
//   - «سه بار؟ پنج بار؟ ده بار؟»: a big number rolling ۳ → ۵ → ۱۰ over tally marks drawn stroke by stroke;
//   - «با شمردن ضرر هیچ‌وقت نمی‌فهمی»: the tally scribbled out and stamped with a red cross;
//   - «حتی یه استراتژی سالم هم ضرر پشت‌سرهم می‌ده»: a healthy strategy card, then five losses sliding in;
//   - «با وین‌ریت ۵۰٪»: a coin spinning between a win and a loss;
//   - «توی ۱۰۰ تا معامله…»: a 10 × 10 grid of simulated trades (a fair coin, labelled as a simulation) whose one
//     five-loss streak lights up while the rest dims;
//   - «سؤال درست اینه»: a lime flip;
//   - «چند تا ضرر پشت‌سرهم برای استراتژی من عادیه؟»: a ruler, a normal zone and an alarm zone, the line between them «؟»;
//   - «این عدد رو… از بک‌تست درمیاری»: a record counter spinning and stopping on «؟» (only a test gives the number);
//   - «توی بک‌تست‌لب روی بازار واقعی گذشته پیداش کن»: the real gold replay (k13's screens) in a browser card;
//   - the free start, the link in bio, the end card.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], we = (i) => D.w[i][1], END = D.end, DUR = D.dur;
const INK = '#0B0C10', PAPER = '#F2EEE6', RED = '#FF4D5E', LIME = '#C6F24E', VIO = '#6C47FF', GREEN = '#2FD67B', WHITE = '#FFFFFF', NIGHT = '#16112B';
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - k) ** 3, oExp = (k) => (k >= 1 ? 1 : 1 - 2 ** (-10 * k)), oBack = (k) => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const IMG = {};

// ---------- drawing ----------
const font = (size, w = 900) => `${w} ${size}px Vazirmatn`;
function measure(s, size, w = 900) { cv.font = font(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function txt(s, x, y, size, col, o = {}) { cv.save(); cv.font = font(size, o.w ?? 900); cv.direction = o.dir ?? 'rtl'; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.globalAlpha *= o.alpha ?? 1; cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
function rrect(x, y, w, h, r, fill, stroke, lw = 2) { cv.beginPath(); cv.roundRect(x, y, w, h, r); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function line(x1, y1, x2, y2, col, lw, cap = 'round') { cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cap; cv.stroke(); }
function at(x, y, s, a, fn, rot = 0) { if (a <= 0 || s <= 0) return; cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.3) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : oBack(k01(t, t0, d)));
function chip(s, x, y, size, bg, fg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 0.9, h = size * 1.55; rrect(x - w / 2, y - h / 2, w, h, o.r ?? h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.06, size, fg, { w: o.w ?? 800 }); return w; }
/** a hand-drawn stroke from a to b, drawn up to fraction k */
function stroke(pts, k, col, lw) { if (k <= 0) return; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * cl(k); cv.beginPath(); cv.moveTo(...pts[0]); for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / seg[i - 1]); cv.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= seg[i - 1]; }
  cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.stroke(); }

// ---------- kinetic lines: tokens laid right to left, each entering on its word ----------
// a token: [text, word index (or [first, last]), style]; style: c (colour), hl (block colour behind), ht (text colour on
// the block), size, strike, slam (force the slam entrance)
const L = (y, size, col, toks, o = {}) => ({ y, size, col, toks, ...o });
function drawLine(ln, t, o = {}) {
  const size = ln.size, gap = size * 0.26, toks = ln.toks.map(([s, wi, st = {}]) => { const sz = st.size ?? size; return { s, sz, st, w: measure(s, sz), t0: ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, m: st.hl ? sz * 0.24 : 0 }; });
  const total = toks.reduce((a, k) => a + k.w + 2 * k.m, 0) + gap * (toks.length - 1); let xr = CX + total / 2;
  toks.forEach((k) => { const x = xr - k.m - k.w / 2; xr -= k.w + 2 * k.m + gap; drawToken(k, x, ln.y, t, ln.col, o.karaoke); });
}
function drawToken(k, x, y, t, col, karaoke) {
  const st = k.st, big = st.hl || st.slam || k.sz >= 200, e = t - k.t0;
  let a, s, dy = 0;
  if (karaoke) { a = e < 0 ? 0.36 : 1; s = e < 0 ? 1 : 1 + 0.14 * Math.sin(Math.PI * k01(e, 0, 0.22)); }
  else if (e < 0) return;
  else if (big) { const q = k01(e, 0, 0.2); a = cl(q * 2); s = lerp(1.65, 1, oBack(q)); }
  else { const q = oCub(k01(e, 0, 0.2)); a = q; s = 1; dy = (1 - q) * 46; }
  const lit = karaoke ? e >= 0 : true;
  // the slam's ghost trail
  if (!karaoke && big && e < 0.2) [1.35, 1.18].forEach((g, i) => at(x, y, s * g, 0.16 * (1 - e / 0.2) * (i + 1) / 2, () => txt(k.s, 0, 0, k.sz, st.hl ?? st.c ?? col)));
  at(x, y + dy, s, a, () => {
    if (st.hl && lit) { const grow = karaoke ? oCub(k01(e, 0, 0.18)) : oCub(k01(e, 0.04, 0.18)), w = k.w + k.sz * 0.42, h = k.sz * 1.28; cv.save(); cv.rotate(-0.02); cv.beginPath(); cv.rect(w / 2 - w * grow, -h, w * grow + 2, h * 2); cv.clip(); shadowed(() => rrect(-w / 2, -h / 2, w, h, k.sz * 0.16, st.hl), 30, 10, 0.25); cv.restore(); }
    txt(k.s, 0, k.sz * 0.05, k.sz, st.hl && lit ? (st.ht ?? WHITE) : (st.c ?? col));
    if (st.strike && lit) { const sk = oCub(k01(e, 0.12, 0.2)); line(k.w / 2 + 10, 0, k.w / 2 + 10 - (k.w + 20) * sk, 0, RED, k.sz * 0.12); }
  });
}

// ---------- the scenes ----------
function lossChip(s = 1) { shadowed(() => rrect(-56 * s, -40 * s, 112 * s, 80 * s, 20 * s, RED), 20, 8, 0.35); line(-24 * s, 0, 24 * s, 0, WHITE, 13 * s); }
function winChip(s = 1) { shadowed(() => rrect(-56 * s, -40 * s, 112 * s, 80 * s, 20 * s, GREEN), 20, 8, 0.35); line(-22 * s, 0, 22 * s, 0, WHITE, 12 * s); line(0, -22 * s, 0, 22 * s, WHITE, 12 * s); }
// the hook: red loss chips falling into a tower
function hookArt(t) {
  for (let i = 0; i < 9; i++) { const t0 = 0.2 + i * 0.36, k = k01(t, t0, 0.34); if (k <= 0) continue;
    const yEnd = 1750 - i * 64, y = k < 1 ? lerp(1080, yEnd, k * k) : yEnd + Math.sin(Math.min(1, (t - t0 - 0.34) / 0.18) * Math.PI) * -10 * Math.max(0, 1 - (t - t0 - 0.34) / 0.18), rot = (rnd(i) - 0.5) * 0.3 * (k < 1 ? 1 : 0.6);
    at(CX + (rnd(i * 3) - 0.5) * 34, y, 1.05, cl(k * 3), () => lossChip(1), rot); }
}
// «سه بار؟ پنج بار؟ ده بار؟»: the number rolls; tally marks drawn stroke by stroke
const TALLY = (() => { const out = []; for (let i = 0; i < 10; i++) { const g = Math.floor(i / 5), j = i % 5, gx = CX + 210 - g * 420; out.push(j < 4 ? [[gx + 90 - j * 60, 1210], [gx + 84 - j * 60, 1420]] : [[gx + 130, 1250], [gx - 140, 1385]]); } return out; })();
const tallyTimes = () => [0, 1, 2].map((i) => ws(11) + i * 0.09).concat([0, 1].map((i) => ws(13) + i * 0.09), [0, 1, 2, 3, 4].map((i) => ws(15) + i * 0.07));
function drawTally(t, col, lw = 26, scale = 1, cy = 0) { const tt = tallyTimes(); cv.save(); cv.translate(CX, cy); cv.scale(scale, scale); cv.translate(-CX, -cy);
  TALLY.forEach((p, i) => stroke([p[0], [lerp(p[0][0], p[1][0], 0.5) + 6, lerp(p[0][1], p[1][1], 0.5)], p[1]], k01(t, tt[i], 0.12), col, lw)); cv.restore(); }
function countArt(t) {
  const N = [[11, '۳'], [13, '۵'], [15, '۱۰']]; let cur = -1; N.forEach(([wi], i) => { if (t >= ws(wi) - 0.07) cur = i; });
  if (cur >= 0) { const e = t - ws(N[cur][0]) + 0.07, k = oExp(k01(e, 0, 0.22));
    if (cur > 0 && e < 0.22) at(CX, 640 - 260 * k, 1, 1 - k, () => txt(N[cur - 1][1], 0, 0, 520, INK));
    at(CX, 640 + 260 * (1 - k), lerp(1.25, 1, k), cl(k * 1.5), () => txt(N[cur][1], 0, 0, 520, cur === 2 ? RED : INK));
    at(CX, 940, 1, cl(k * 2), () => txt('بار؟', 0, 0, 140, INK)); }
  drawTally(t, INK);
}
// «با شمردن ضرر هیچ‌وقت نمی‌فهمی»: the tally, scribbled out, stamped
function neverArt(t) {
  drawTally(DUR, rgba(WHITE, 0.85), 26, 0.62, 1330);
  const sc = []; for (let i = 0; i < 9; i++) sc.push([CX + 330 - i * 82 + (i % 2) * 20, 1330 + (i % 2 ? 70 : -70)]);
  stroke(sc, k01(t, ws(20) - 0.05, 0.45), RED, 22);
  const k = pop(t, ws(22) - 0.05, 0.28); at(CX, 1330, lerp(1.6, 1, cl(k)), cl(k * 2), () => { cv.shadowColor = rgba(RED, 0.6); cv.shadowBlur = 30; line(-150, -150, 150, 150, RED, 46); line(150, -150, -150, 150, RED, 46); }, -0.08);
}
// «حتی یه استراتژی سالم هم ضرر پشت‌سرهم می‌ده»: a healthy strategy card, then five losses
function healthyArt(t) {
  const k = pop(t, ws(27) - 0.05, 0.3); at(CX, 1300, cl(k, 0, 1.2), cl(k * 2), () => { shadowed(() => rrect(-330, -110, 660, 220, 44, '#241C47'), 40, 16, 0.35); rrect(-330, -110, 660, 220, 44, null, rgba('#A58BFF', 0.5), 3);
    txt('استراتژی', 90, 0, 72, WHITE); const c = pop(t, ws(28) - 0.04, 0.28); at(-200, 0, cl(c, 0, 1.2), cl(c * 2), () => { circle(0, 0, 70, GREEN); cv.strokeStyle = WHITE; cv.lineWidth = 18; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-30, 2); cv.lineTo(-8, 26); cv.lineTo(32, -24); cv.stroke(); }); });
  for (let i = 0; i < 5; i++) { const t0 = ws(31) - 0.05 + i * 0.11, q = oExp(k01(t, t0, 0.3)); if (t < t0) continue; at(CX + 300 - i * 150 + (1 - q) * 500, 1580, 1, cl(q * 2), () => lossChip(1.05), (1 - q) * 0.4); }
}
// «با وین‌ریت ۵۰٪»: a coin spinning between a win and a loss
function coinArt(t) {
  const k = pop(t, ws(36) - 0.05, 0.3); if (k <= 0) return; const ph = (t - ws(36)) * 9, c = Math.cos(ph), face = c >= 0;
  at(CX, 1300, cl(k, 0, 1.15), 1, () => { cv.save(); cv.scale(Math.max(0.04, Math.abs(c)), 1); shadowed(() => circle(0, 0, 210, face ? GREEN : RED), 50, 20, 0.35); circle(0, 0, 176, null); cv.beginPath(); cv.arc(0, 0, 176, 0, Math.PI * 2); cv.strokeStyle = 'rgba(255,255,255,0.45)'; cv.lineWidth = 8; cv.stroke();
    cv.strokeStyle = WHITE; cv.lineWidth = 34; cv.lineCap = 'round'; cv.beginPath(); if (face) { cv.moveTo(-70, 0); cv.lineTo(70, 0); cv.moveTo(0, -70); cv.lineTo(0, 70); } else { cv.moveTo(-70, 0); cv.lineTo(70, 0); } cv.stroke(); cv.restore(); });
  at(CX, 1590, 1, cl(k * 2), () => { txt('سود', 150, 0, 54, GREEN, { w: 800 }); txt('یا', 0, 0, 46, INK, { w: 700, alpha: 0.6 }); txt('ضرر', -150, 0, 54, RED, { w: 800 }); });
}
// «توی ۱۰۰ تا معامله… یه جا ۵ تا ضرر پشت‌سرهم»: the simulated grid
const GRID = { x0: CX + 342, y0: 560, step: 76 }, cellXY = (i) => [GRID.x0 - (i % 10) * GRID.step, GRID.y0 + Math.floor(i / 10) * GRID.step];   // right to left, row by row
function gridArt(t) {
  const t0 = ws(41) - 0.1, hl = ws(49) - 0.06, hk = oCub(k01(t, hl, 0.35)), run = D.run, [rx, ry] = cellXY(run + 2);
  const z = lerp(1, 1.22, oCub(k01(t, hl + 0.1, 1.2)));
  cv.save(); cv.translate(rx, ry); cv.scale(z, z); cv.translate(-rx, -ry);
  for (let i = 0; i < 100; i++) { const k = pop(t, t0 + i * 0.013, 0.22); if (k <= 0) continue; const [x, y] = cellXY(i), inRun = i >= run && i < run + 5, loss = D.sim[i] === 'L';
    const a = inRun ? 1 : lerp(1, 0.18, hk), s = cl(k, 0, 1.2) * (inRun ? 1 + 0.12 * hk + 0.05 * Math.sin((t - hl) * 10) * hk : 1);
    at(x, y, s, a, () => rrect(-29, -29, 58, 58, 15, loss ? RED : GREEN)); }
  if (hk > 0) { const [x1, y1] = cellXY(run), x2 = cellXY(run + 4)[0], pad = 20 + 8 * (1 - hk); cv.save(); cv.globalAlpha = hk; cv.shadowColor = rgba(RED, 0.8); cv.shadowBlur = 30; rrect(x2 - 29 - pad, y1 - 29 - pad, x1 - x2 + 58 + pad * 2, 58 + pad * 2, 24, null, WHITE, 7); cv.restore(); }
  cv.restore();
  if (t >= t0) at(CX, 1355, 1, oCub(k01(t, t0 + 0.4, 0.3)) * lerp(1, 0.4, hk), () => txt('شبیه‌سازی نمونه: ۱۰۰ معامله با وین‌ریت ۵۰ درصد', 0, 0, 34, WHITE, { w: 600, alpha: 0.75 }));
}
// «سؤال درست اینه»
function rightArt(t) { at(CX, 1450, 1, 0.12, () => txt('؟', 0, 0, 640, INK), Math.sin((t - ws(56)) * 2) * 0.12); }
// «چند تا ضرر پشت‌سرهم برای استراتژی من عادیه؟»: a ruler with a normal zone and an alarm zone; the line between is «؟»
function rulerArt(t) {
  const k = oCub(k01(t, ws(59), 0.4)); if (k <= 0) return; const x0 = CX + 430, x1 = CX - 430, y = 1330, mx = lerp(x0, x1, 0.56);
  cv.save(); cv.globalAlpha = k; rrect(x1, y - 46, x0 - x1, 92, 46, '#1C1D24'); rrect(mx, y - 46, x0 - mx, 92, 46, rgba(GREEN, 0.22)); rrect(x1, y - 46, mx - x1, 92, 46, rgba(RED, 0.18)); cv.restore();
  at(lerp(x0, mx, 0.5), y - 110, 1, k, () => txt('عادی', 0, 0, 50, GREEN, { w: 800 })); at(lerp(mx, x1, 0.5), y - 110, 1, k, () => txt('زنگ خطر', 0, 0, 50, RED, { w: 800 }));
  for (let i = 0; i < 5; i++) { const t0 = ws(61) + i * 0.32, q = pop(t, t0, 0.26); if (q <= 0) continue; at(x0 - 70 - i * 96, y, cl(q, 0, 1.15) * 0.72, 1, () => lossChip(1)); }
  const m = pop(t, ws(67) - 0.08, 0.3); at(mx, y, 1, cl(m * 2), () => { line(0, -80, 0, 80, WHITE, 8); at(0, 165, cl(m, 0, 1.2), 1, () => { shadowed(() => circle(0, 0, 64, LIME), 30, 10, 0.4); txt('؟', 0, 6, 84, INK); }); });
}
// «این عدد رو… از بک‌تست درمیاری»: a record counter spinning, stopping on «؟»
function counterArt(t) {
  const k = pop(t, ws(69) - 0.05, 0.3); if (k <= 0) return; const stop = ws(78) + 0.1, spin = t < stop;
  at(CX, 1260, cl(k, 0, 1.1), cl(k * 2), () => {
    txt('رکورد ضرر پشت‌سرهم', 0, -230, 50, INK, { w: 800 });
    shadowed(() => rrect(-230, -160, 460, 320, 50, INK), 50, 20, 0.35); rrect(-200, -130, 400, 260, 36, '#1A1B22');
    cv.save(); cv.beginPath(); cv.roundRect(-200, -130, 400, 260, 36); cv.clip();
    if (spin) { const v = (t - ws(69)) * 9, d = ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']; for (let j = -1; j <= 1; j++) { const n = Math.floor(v) + j, f = v - Math.floor(v), y = (j - f) * 230; [0, 22, 44].forEach((o, q) => txt(d[((n % 9) + 9) % 9], 0, y - o, 180, WHITE, { alpha: [0.9, 0.3, 0.12][q] })); } }
    else { const q = oBack(k01(t, stop, 0.3)); at(0, 0, lerp(1.4, 1, q), cl(q * 2), () => txt('؟', 0, 10, 220, LIME)); }
    cv.restore();
    const g = cv.createLinearGradient(0, -130, 0, 130); g.addColorStop(0, 'rgba(26,27,34,0.95)'); g.addColorStop(0.3, 'rgba(26,27,34,0)'); g.addColorStop(0.7, 'rgba(26,27,34,0)'); g.addColorStop(1, 'rgba(26,27,34,0.95)'); rrect(-200, -130, 400, 260, 36, g);
  });
  const a = oCub(k01(t, ws(76) - 0.05, 0.35)); if (a > 0) at(CX, 1260, cl(k, 0, 1.1), a, () => { cv.shadowColor = rgba(LIME, 0.9); cv.shadowBlur = 40; rrect(-238, -168, 476, 336, 56, null, LIME, 10); });
}
// «توی بک‌تست‌لب روی بازار واقعی گذشته پیداش کن»: the real replay in a browser card
const SCR = [20, 140, 1540, 1000];
function labArt(t) {
  const k = pop(t, ws(79) - 0.05, 0.32); if (k <= 0) return; const w = 960, h = (w * SCR[3]) / SCR[2], x = CX - w / 2, y = 540;
  const keys = ['c00', 'c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15'], f = cl((t - ws(80)) / (we(87) + 0.4 - ws(80))), key = keys[Math.min(15, Math.floor(f * 16))];
  at(CX, y + h / 2, lerp(0.9, 1, cl(k)), cl(k * 2), () => { const ox = -w / 2, oy = -h / 2;
    shadowed(() => rrect(ox - 14, oy - 64, w + 28, h + 78, 30, '#1B1C24'), 60, 24, 0.5); [RED, AMB_, GREEN].forEach((c, i) => circle(ox + w - 22 - i * 34, oy - 32, 10, c));
    const im = IMG[key]; if (im) { cv.save(); cv.beginPath(); cv.roundRect(ox, oy, w, h, 16); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, ox, oy, w, h); cv.restore(); }
    const r = pop(t, ws(85) - 0.05, 0.3); at(ox + 150, oy + 40, cl(r, 0, 1.15), cl(r * 2), () => { shadowed(() => rrect(-150, -42, 300, 84, 42, LIME), 20, 8, 0.4); cv.fillStyle = INK; [0, 1].forEach((j) => { cv.beginPath(); cv.moveTo(-96 + j * 30, 0); cv.lineTo(-66 + j * 30, -20); cv.lineTo(-66 + j * 30, 20); cv.closePath(); cv.fill(); }); txt('گذشته', 34, 3, 44, INK, { w: 800 }); });
  });
  at(CX, y + h + 60, 1, cl(k * 2), () => txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', 0, 0, 34, WHITE, { w: 600, alpha: 0.75 }));
}
const AMB_ = '#FFB020';
// «شروعش رایگانه؛ لینکش توی بیوئه»
function ctaArt(t) {
  const k = pop(t, ws(88) - 0.05, 0.32); if (IMG.icon) at(CX, 420, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  const p = pop(t, ws(90) - 0.05, 0.3); at(CX, 1330, cl(p, 0, 1.12), cl(p * 2), () => { shadowed(() => rrect(-330, -82, 660, 164, 82, INK)); txt('لینکش توی بیو', 0, 6, 74, WHITE); });
  if (t > ws(90)) { const b = Math.abs(Math.sin((t - ws(90)) * 6)) * 26; at(CX, 1150 - b, 1, cl((t - ws(90)) * 4), () => { cv.fillStyle = INK; cv.beginPath(); cv.moveTo(0, -60); cv.lineTo(48, 0); cv.lineTo(16, 0); cv.lineTo(16, 50); cv.lineTo(-16, 50); cv.lineTo(-16, 0); cv.lineTo(-48, 0); cv.closePath(); cv.fill(); }); }
}
function endArt(t) {
  const k = pop(t, END, 0.35); if (IMG.icon) at(CX, 760, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 60; cv.drawImage(IMG.icon, -130, -130, 260, 260); });
  if (IMG.word) { const q = oCub(k01(t, END + 0.15, 0.35)), ww = 520, hh = (ww * IMG.word.height) / IMG.word.width; at(CX, 1000 + (1 - q) * 30, 1, q, () => cv.drawImage(IMG.word, -ww / 2, -hh / 2, ww, hh)); }
  const f = pop(t, END + 0.4, 0.3); at(CX, 1180, cl(f, 0, 1.1), cl(f * 2), () => chip('شروعش رایگانه', 0, 0, 60, LIME, INK));
  const l = oCub(k01(t, END + 0.7, 0.3)); at(CX, 1330, 1, l, () => txt('لینک توی بیو', 0, 0, 52, WHITE, { w: 700, alpha: 0.85 }));
}

const SCENES = [
  { at: 0, bg: INK, wipe: 'none', art: hookArt, karaoke: true, lines: [
    L(300, 190, WHITE, [['چند', 0], ['بار', 1]]), L(500, 130, WHITE, [['باید', 2], ['ضرر', 3, { hl: RED }], ['کنی', 4]]), L(660, 110, WHITE, [['تا', 5], ['بفهمی', [6, 7]]]),
    L(830, 150, LIME, [['استراتژی‌ات', 8]]), L(1000, 150, WHITE, [['ایراد', 9, { hl: LIME, ht: INK }], ['داره؟', 10]])] },
  { at: ws(11) - 0.07, bg: PAPER, wipe: 'slash', art: countArt, lines: [] },
  { at: ws(17) - 0.07, bg: INK, wipe: 'cut', art: neverArt, lines: [
    L(400, 120, WHITE, [['با', 17], ['شمردن', 18], ['ضرر', 19, { c: RED }]]), L(620, 230, WHITE, [['هیچ‌وقت', [20, 21]]]), L(850, 150, WHITE, [['نمی‌فهمی.', [22, 23], { hl: RED }]])] },
  { at: ws(24) - 0.07, bg: NIGHT, wipe: 'iris', art: healthyArt, lines: [
    L(330, 100, WHITE, [['چون', 24], ['حتی', 25], ['یه', 26], ['استراتژی', 27]]), L(540, 230, GREEN, [['سالم', 28, { slam: true }]]), L(760, 105, WHITE, [['هم', 29], ['ضرر', 30, { c: RED }], ['پشت‌سرهم', [31, 32]]]), L(910, 105, WHITE, [['می‌ده.', [33, 34]]])] },
  { at: ws(35) - 0.07, bg: PAPER, wipe: 'slash', art: coinArt, lines: [
    L(380, 120, INK, [['با', 35], ['وین‌ریت', [36, 37], { c: VIO }]]), L(680, 300, INK, [['۵۰٪', [38, 39], { slam: true }]])] },
  { at: ws(40) - 0.07, bg: INK, wipe: 'up', art: gridArt, lines: [
    L(330, 110, WHITE, [['توی', 40], ['۱۰۰', 41, { c: LIME }], ['تا', 42], ['معامله', 43]]), L(1460, 84, WHITE, [['به', 44], ['احتمال', 45], ['زیاد', 46], ['یه', 47], ['جا', 48]]),
    L(1610, 110, WHITE, [['۵', 49, { hl: RED }], ['تا', 50], ['ضرر', 51, { c: RED }], ['پشت‌سرهم', [52, 53]]]), L(1760, 100, WHITE, [['می‌خوری.', [54, 55]]])] },
  { at: ws(56) - 0.07, bg: LIME, wipe: 'iris', art: rightArt, lines: [L(760, 190, INK, [['سؤال', 56], ['درست', 57]]), L(980, 190, INK, [['اینه.', 58, { hl: INK, ht: LIME }]])] },
  { at: ws(59) - 0.07, bg: INK, wipe: 'cut', art: rulerArt, lines: [
    L(380, 110, WHITE, [['چند', 59], ['تا', 60], ['ضرر', 61, { c: RED }], ['پشت‌سرهم', [62, 63]]]), L(540, 110, WHITE, [['برای', 64], ['استراتژی', 65], ['من', 66, { c: LIME }]]), L(780, 250, WHITE, [['عادیه؟', 67, { hl: LIME, ht: INK }]])] },
  { at: ws(68) - 0.07, bg: PAPER, wipe: 'slash', art: counterArt, lines: [
    L(330, 130, INK, [['این', 68], ['عدد', 69, { hl: VIO }], ['رو', 70]]), L(500, 110, INK, [['قبل', 71], ['از', 72], ['پول', 73, { c: RED }], ['واقعی', 74, { c: RED }]]), L(670, 100, INK, [['از', 75], ['بک‌تست', 76, { hl: LIME, ht: INK }], ['درمیاری.', [77, 78]]])] },
  { at: ws(79) - 0.07, bg: INK, wipe: 'up', art: labArt, lines: [
    L(270, 120, WHITE, [['توی', 79], ['بک‌تست‌لب', [80, 81], { c: LIME }]]), L(410, 92, WHITE, [['روی', 82], ['بازار', 83], ['واقعی', 84], ['گذشته', 85, { c: LIME }]]), L(1480, 190, WHITE, [['پیداش', 86], ['کن.', 87, { hl: LIME, ht: INK }]])] },
  { at: ws(88) - 0.07, bg: LIME, wipe: 'iris', art: ctaArt, lines: [L(700, 150, INK, [['شروعش', 88]]), L(890, 210, INK, [['رایگانه!', 89, { hl: VIO }]])] },
  { at: END, bg: INK, wipe: 'cut', art: endArt, lines: [] },
];
const PUNCH = [ws(3), ws(9), ws(15), ws(20), ws(22), ws(28), ws(31), ws(38), ws(49), ws(58), ws(67), ws(76), ws(87), ws(89)];
const WIPE = 0.24;

// ---------- frame ----------
let GRAIN = null;
function grainTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256); for (let i = 0; i < 256 * 256; i++) { const v = (rnd(i * 1.7) * 255) | 0; im.data.set([v, v, v, 22], i * 4); } g.putImageData(im, 0, 0); return c; }
function drawScene(i, t) {
  const S = SCENES[i]; cv.fillStyle = S.bg; cv.fillRect(0, 0, W, H);
  let p = 0; PUNCH.forEach((u) => { if (t >= u - 0.07 && t < u + 0.3) p = Math.max(p, Math.sin(Math.PI * k01(t, u - 0.07, 0.37))); });
  const z = 1 + 0.035 * k01(t, S.at, 4) + 0.025 * p, sh = p * 5;
  cv.save(); cv.translate(CX + Math.sin(t * 47) * sh, H / 2 + Math.cos(t * 39) * sh); cv.scale(z, z); cv.translate(-CX, -H / 2);
  S.art(t); S.lines.forEach((ln) => drawLine(ln, t, { karaoke: S.karaoke })); cv.restore();
}
function frame(t) {
  let i = 0; SCENES.forEach((s, k) => { if (t >= s.at) i = k; });
  const S = SCENES[i], e = t - S.at;
  if (i > 0 && e < WIPE && S.wipe !== 'none') {
    drawScene(i - 1, t); const k = oCub(e / WIPE); cv.save(); cv.beginPath();
    if (S.wipe === 'slash') { const x = lerp(W + 700, -700, k); cv.moveTo(x, 0); cv.lineTo(x + 2400, 0); cv.lineTo(x + 2400 - 700, H); cv.lineTo(x - 700, H); }
    else if (S.wipe === 'iris') cv.arc(CX, H / 2, k * 1200, 0, Math.PI * 2);
    else if (S.wipe === 'up') cv.rect(0, H * (1 - k), W, H * k);
    else cv.rect(0, 0, W, H);
    cv.clip(); drawScene(i, t); cv.restore();
    if (S.wipe === 'cut' && e < 0.08) { cv.fillStyle = `rgba(255,255,255,${0.5 * (1 - e / 0.08)})`; cv.fillRect(0, 0, W, H); }
  } else drawScene(i, t);
  // the grain and a soft vignette
  if (GRAIN) { cv.save(); cv.globalCompositeOperation = 'overlay'; const ox = (rnd(Math.floor(t * 30)) * 256) | 0, oy = (rnd(Math.floor(t * 30) + 7) * 256) | 0; cv.translate(-ox, -oy); cv.fillStyle = cv.createPattern(GRAIN, 'repeat'); cv.fillRect(0, 0, W + 256, H + 256); cv.restore(); }
  const v = cv.createRadialGradient(CX, H / 2, H * 0.3, CX, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.28)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
  // progress
  const pk = cl(t / END); cv.fillStyle = 'rgba(128,128,128,0.25)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = LIME; cv.fillRect(W * (1 - pk), 0, W * pk, 8);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(10) + 0.5); cv.fillStyle = INK; cv.fillRect(0, 0, W, 8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  GRAIN = grainTex(); frame(0); window.ready = true;
});
