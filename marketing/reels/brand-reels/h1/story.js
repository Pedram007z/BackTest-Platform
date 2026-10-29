// h1 · «دیدی وقتی درگیر یه دردسر بزرگ تو زندگیت میشی…», an illustrated short film on the user's voice (shared with k7).
// Flat, faceless figures; layered landscapes; a sky whose mood follows the story; film grain and a vignette;
// subtitles at the top, word by word.
//   A (life):    a storm over you on a hill. The consolers come and go. The experienced one arrives with an umbrella,
//                then leads you down a golden path to a sunrise.
//   B (market):  the path becomes a price line, and the land a restless candle city that fog swallows. Far off, the
//                experienced one stands on a peak with a lantern. Its light shows the sky is the market's past
//                (۲۰۱۵ to ۲۰۲۶).
//   C (the app): that past becomes the real platform on a glowing screen (f1's dark-theme captures: the gold replay,
//                the data range «۱۱ دی ۱۳۹۳ تا ۱۵ مهر ۱۴۰۵», the winners and the losers).
//   D (you):     the pattern repeats across a dawn valley. The lantern comes to you, then the follow card.
//   E:           the years of the market, the end card.
// This file replaces u-kit's scenes: it calls story() with none, then sets window.seek and window.cover itself.
story({ scenes: [], art: {} });
const mixC = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], cl(k))).toString(16).padStart(2, '0')).join(''); };
const sm = (t, a, d) => exIO(k01(t, a, d)), easeO = (t, a, d) => cub(k01(t, a, d));
function crop(key, r, x, y, w, a = 1) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im || a <= 0) return h; const s = im.width / 1440; cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.roundRect(x, y, w, h, 14); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function glowShot(key, r, x, y, w, a = 1, col = '#A48CFF') { const h = (w * r[3]) / r[2]; cv.save(); cv.globalAlpha *= a; cv.shadowColor = rgba(col, 0.75); cv.shadowBlur = 70; rrect(x - 14, y - 14, w + 28, h + 28, 26, '#120E22'); cv.restore(); cv.save(); cv.globalAlpha *= a; rrect(x - 14, y - 14, w + 28, h + 28, 26, null, rgba(col, 0.6), 3); cv.restore(); crop(key, r, x, y, w, a); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = 20; rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];

// ---------- the sky: its mood follows the story ----------
const PAL = { storm: ['#10131F', '#1E2538', '#333B55'], dusk: ['#24193F', '#6B3A66', '#E58A5C'], dawn: ['#5B8FD0', '#F2BE96', '#FFE2B0'],
  night: ['#080B1A', '#10163A', '#1B2350'], violet: ['#140D36', '#2E1D86', '#5A3BE0'] };
let MOOD = [];
function sky3(t) { let a = MOOD[0], b = MOOD[0]; for (let i = 0; i < MOOD.length; i++) { if (t >= MOOD[i][0]) { a = MOOD[i]; b = MOOD[i + 1] || MOOD[i]; } }
  const k = b === a ? 0 : cl((t - a[0]) / (b[0] - a[0])), e = k * k * (3 - 2 * k); return [0, 1, 2].map((j) => mixC(PAL[a[1]][j], PAL[b[1]][j], e)); }
function sky(t) { const c = sky3(t), g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c[0]); g.addColorStop(0.55, c[1]); g.addColorStop(1, c[2]); cv.fillStyle = g; cv.fillRect(-600, -1200, W + 1200, H + 2400); return c; }
/** a ridge of hills, filled down to far below */
function ridge(y0, amp, f, ph, col, x0 = -600, x1 = 1700) { cv.fillStyle = col; cv.beginPath(); cv.moveTo(x0, 3200); for (let x = x0; x <= x1; x += 20) cv.lineTo(x, y0 + amp * Math.sin(x * f + ph) + amp * 0.4 * Math.sin(x * f * 2.7 + ph * 1.3)); cv.lineTo(x1, 3200); cv.closePath(); cv.fill(); }
const HILL = (x) => 1380 + Math.pow((x - 540) / 700, 2) * 260;
function hill(col) { cv.fillStyle = col; cv.beginPath(); cv.moveTo(-800, 3200); for (let x = -800; x <= 2000; x += 20) cv.lineTo(x, HILL(x)); cv.lineTo(2000, 3200); cv.closePath(); cv.fill(); }

// ---------- figures ----------
/** a faceless figure standing on (x, y). o: col, ph (walk phase; undefined = still), arm ('down' | 'point' | 'up' | 'hold'), umb (0..1), lantern (0..1), flip */
function fig(x, y, s, o = {}) {
  const col = o.col ?? '#8E7CFF', dark = mixC(col, '#000000', 0.35), walking = o.ph !== undefined, sw = walking ? Math.sin(o.ph * Math.PI * 2) * 0.38 : 0, bob = walking ? Math.abs(Math.cos(o.ph * Math.PI * 2)) * 6 : 0;
  at(x, y, s, o.a ?? 1, () => {
    if (o.flip) cv.scale(-1, 1);
    cv.translate(0, -bob);
    // legs
    [[sw, dark, -17], [-sw, col, 17]].forEach(([a, c, lx]) => { cv.save(); cv.translate(walking ? lx * 0.4 : lx, -112); cv.rotate(a); rrect(-15, 0, 30, 116, 15, c); cv.restore(); });
    // body
    cv.fillStyle = col; cv.beginPath(); cv.moveTo(-40, -230); cv.quadraticCurveTo(-50, -232, -54, -200); cv.lineTo(-50, -102); cv.quadraticCurveTo(0, -92, 50, -102); cv.lineTo(54, -200); cv.quadraticCurveTo(50, -232, 40, -230); cv.closePath(); cv.fill();
    circle(0, -272, 36, col);
    // arms
    const arm = o.arm ?? 'down', hand = arm === 'point' ? [150, -230] : arm === 'up' ? [70, -330] : arm === 'hold' ? [80, -150] : [62, -110];
    cv.save(); cv.strokeStyle = col; cv.lineWidth = 26; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(42, -210); cv.lineTo(...hand); cv.stroke();
    cv.strokeStyle = dark; cv.beginPath(); cv.moveTo(-42, -210); cv.lineTo(walking ? -60 + sw * 40 : -62, -110); cv.stroke(); cv.restore();
    if (o.umb > 0) { const k = cl(o.umb), cx = hand[0] - 10, cy = hand[1] - 200; line(hand[0], hand[1], cx, cy, '#3A3550', 8);
      cv.save(); cv.fillStyle = o.umbCol ?? '#E2574C'; cv.beginPath(); cv.moveTo(cx - 190 * k, cy + 30 * k); cv.quadraticCurveTo(cx, cy - 140 * k, cx + 190 * k, cy + 30 * k);
      for (let i = 4; i >= 0; i--) cv.quadraticCurveTo(cx - 190 * k + (i + 0.5) * 76 * k, cy + 4 * k, cx - 190 * k + i * 76 * k, cy + 30 * k); cv.closePath(); cv.fill(); cv.restore(); }
    if (o.lantern > 0) { const k = cl(o.lantern), [lx, ly] = arm === 'up' ? [hand[0], hand[1] + 40] : [hand[0] + 4, hand[1] + 44];
      const g = cv.createRadialGradient(lx, ly, 6, lx, ly, 260 * k + 40); g.addColorStop(0, rgba('#FFD27A', 0.9 * k)); g.addColorStop(0.35, rgba('#FFB347', 0.35 * k)); g.addColorStop(1, rgba('#FFB347', 0)); cv.fillStyle = g; cv.fillRect(lx - 320, ly - 320, 640, 640);
      line(hand[0], hand[1], lx, ly - 30, '#3A3550', 6); rrect(lx - 20, ly - 30, 40, 54, 10, '#FFD27A'); rrect(lx - 24, ly - 36, 48, 10, 4, '#3A3550'); }
  });
}
function cloud(x, y, s, col, a = 1) { if (a <= 0) return; at(x, y, s, a, () => { cv.fillStyle = col; [[-110, 10, 74], [-36, -34, 98], [64, -8, 82], [140, 24, 60], [0, 30, 86]].forEach(([cx, cy, r]) => { cv.beginPath(); cv.arc(cx, cy, r, 0, Math.PI * 2); cv.fill(); }); rrect(-170, 20, 350, 74, 37, col); }); }
function bolt(x, y, s, a) { if (a <= 0) return; at(x, y, s, a, () => { cv.save(); cv.shadowColor = 'rgba(255,220,140,0.95)'; cv.shadowBlur = 50; cv.fillStyle = '#FFE08A'; cv.beginPath(); cv.moveTo(10, -80); cv.lineTo(-30, 10); cv.lineTo(0, 10); cv.lineTo(-20, 90); cv.lineTo(40, -10); cv.lineTo(8, -10); cv.lineTo(30, -80); cv.closePath(); cv.fill(); cv.restore(); }); }
function bubble(s, x, y, k, side = 1, col = '#FFFFFF', ink = '#1A1430') { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { const w = measure(s, 44, 800) + 64; cv.save(); cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 24; cv.shadowOffsetY = 8; rrect(-w / 2, -44, w, 88, 44, col);
  cv.fillStyle = col; cv.beginPath(); cv.moveTo(side * 8, 36); cv.lineTo(side * 34, 74); cv.lineTo(side * 42, 32); cv.fill(); cv.restore(); txt(s, 0, 4, 44, ink, { w: 800 }); }); }
function rain(t, n, amt, skip) { if (amt <= 0) return; cv.save(); cv.globalAlpha *= amt; for (let i = 0; i < n; i++) { const x = -300 + rnd(i) * 1700, sp = 1300 + rnd(i * 3) * 500, y = -200 + ((t * sp + rnd(i * 7) * 2200) % 2200);
  if (skip && x > skip[0] && x < skip[1] && y > skip[2]) continue; line(x, y, x - 18, y + 58, i % 3 ? 'rgba(160,175,215,0.55)' : 'rgba(200,210,240,0.7)', 3); } cv.restore(); }
function stars(t, n, a, y1 = 1100) { if (a <= 0) return; for (let i = 0; i < n; i++) { const x = rnd(i * 1.3) * W, y = rnd(i * 2.9) * y1, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); circle(x, y, 1.5 + rnd(i * 4.1) * 2.5, rgba('#FFFFFF', a * (0.35 + 0.65 * tw))); } }
function sun(x, y, r, t, a = 1) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a; const g = cv.createRadialGradient(x, y, r * 0.3, x, y, r * 3.2); g.addColorStop(0, 'rgba(255,214,140,0.9)'); g.addColorStop(1, 'rgba(255,190,120,0)'); cv.fillStyle = g; cv.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8); circle(x, y, r, '#FFE2A0'); cv.restore(); }

// ---------- A: life ----------
const CONS = [[300, -1, 'غصه نخور', -520, 0, 400], [860, 1, 'درست میشه', 1500, 0, 380], [150, -1, 'قوی باش', -700, 70, 250]];
const PATH = [[560, 1380], [760, 1420], [930, 1480], [1100, 1520], [1300, 1510], [1520, 1470], [1800, 1440], [2100, 1420]];
const along = (pts, f) => { const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let d = cl(f) * L; for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const e = d / seg[i]; return [lerp(pts[i][0], pts[i + 1][0], e), lerp(pts[i][1], pts[i + 1][1], e)]; } d -= seg[i]; } return pts[pts.length - 1]; };
function camA(t) { const walk = sm(t, ws(36) - 0.1, ws(41) - ws(36) + 0.6); return { x: lerp(0, 880, walk), y: lerp(0, 80, walk), z: lerp(1, 1.08, sm(t, 0, T.console)) * lerp(1, 0.94, sm(t, T.alone, 0.8)) * lerp(1, 1.04, sm(t, T.truly, 1.2)) * lerp(1, 0.92, walk) }; }
function worldA(t) {
  const c = sky(t), cam = camA(t), warm = sm(t, ws(27) - 0.1, 1.4), dawn = sm(t, ws(38), 1.6), alone = sm(t, T.alone, 0.5) * (1 - sm(t, T.truly + 0.3, 0.8));
  cv.save(); cv.translate(CX, 1100); cv.scale(cam.z, cam.z); cv.translate(-CX - cam.x, -1100 - cam.y);
  stars(t, 40, 0.5 * (1 - warm) * 0.4);
  // the sun rises on the right as you walk out
  const sunY = lerp(1680, 1290, sm(t, ws(39) - 0.2, 1.6)); sun(1560, sunY, 110, t, sm(t, ws(38), 0.6));
  ridge(1250, 40, 0.004, 1.2, mixC(c[1], '#000000', 0.35)); ridge(1330, 30, 0.006, 3.1, mixC(c[2], '#000000', 0.45), -600, 2400);
  hill(mixC(c[2], '#000000', 0.62));
  // the cloud and the lightning
  const cloudA = 1 - sm(t, ws(27), 2.5), big = pop(t - ws(6) + 0.05, 10, 0.5);
  cloud(560, 700, lerp(1.4, 1.75, cl(big)), mixC('#2D3248', '#6B4B70', warm), cloudA);
  const fl = (a) => (t >= a ? Math.max(0, 1 - (t - a) * 3) : 0), kb = fl(ws(4)) + fl(ws(6));
  bolt(480, 900, 1.5, cl(kb) * cloudA); bolt(690, 880, 1.1, cl(fl(ws(6))) * cloudA);
  // the consolers come, talk, and go
  CONS.forEach(([x0, side, s, xo, bx, by], i) => { const tin = T.console + i * 0.22, kin = sm(t, tin - 0.5, 0.7), kout = sm(t, T.alone + i * 0.1, 0.9);
    if (kin <= 0 || kout >= 1) return; const x = lerp(xo, x0, kin) + (xo - x0) * kout * 0.9, walking = (kin > 0 && kin < 1) || (kout > 0 && kout < 1);
    fig(x, HILL(x), 0.95, { col: '#7D86A3', ph: walking ? t * 1.6 + i : undefined, flip: (kout > 0 ? side > 0 : side < 0) ? true : false, a: 1 - kout });
    bubble(s, x + bx, HILL(x) - by + (kout > 0 ? kout * kout * 600 : 0), pop(t - tin - 0.1, 13, 0.55) * (1 - kout), -side); });
  // the experienced one walks in with an umbrella, then shows the way
  const mIn = sm(t, ws(19) - 0.1, ws(22) - ws(19) + 0.2), walkK = sm(t, ws(36) - 0.1, ws(41) - ws(36) + 0.6);
  const umb = easeO(t, ws(22) - 0.1, 0.35), point = sm(t, ws(30) - 0.1, 0.3) * (1 - sm(t, ws(35), 0.3));
  const mStand = [lerp(-300, 400, mIn), HILL(lerp(-300, 400, mIn))], mWay = along(PATH, walkK * 0.62), mb = cl(walkK / 0.18), mPos = walkK > 0 ? [lerp(mStand[0], mWay[0], mb), lerp(mStand[1], mWay[1], mb)] : mStand;
  const yPos = walkK > 0 ? along(PATH, Math.max(0, walkK * 0.62 - 0.1)) : [560, HILL(560)];
  // the golden way out
  const kp = easeO(t, ws(31) - 0.1, ws(35) - ws(31)); if (kp > 0) { cv.save(); cv.shadowColor = 'rgba(255,200,110,0.9)'; cv.shadowBlur = 24; cv.setLineDash([4, 26]); trace(PATH, kp, '#FFD27A', 14); cv.restore(); }
  // rain, except under the umbrella
  const ux = mIn > 0 ? mPos[0] + 75 : 9999, uy = mPos[1] - 360;
  rain(t, 150, (1 - sm(t, ws(27), 1.6)) * lerp(0.8, 1, alone), umb > 0.5 ? [ux - 190, ux + 190, uy] : null);
  // you
  const youCol = mixC('#8E7CFF', '#A79AFF', warm);
  if (alone > 0) { cv.save(); const g = cv.createRadialGradient(560, 1220, 60, 560, 1220, 520); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.55 * alone})`); cv.fillStyle = g; cv.fillRect(-700, -400, 2600, 2600); cv.restore(); }
  fig(yPos[0], yPos[1], 1.1, { col: youCol, ph: walkK > 0 && walkK < 1 ? t * 1.7 : undefined });
  if (mIn > 0) fig(mPos[0], mPos[1], 1.12, { col: '#F2A33A', ph: (mIn > 0 && mIn < 1) || (walkK > 0 && walkK < 1) ? t * 1.7 + 0.5 : undefined, arm: point > 0.5 ? 'point' : 'hold', umb: umb * (1 - sm(t, ws(29), 0.6)), umbCol: '#E2574C' });
  cv.restore();
  return cam;
}

// ---------- B: the market ----------
const NB = 26, CBASE = Array.from({ length: NB }, (_, i) => 260 + 180 * Math.sin(i * 0.45) + 90 * Math.sin(i * 1.3 + 1) + rnd(i) * 140);
const HIST = Array.from({ length: 56 }, (_, i) => [90 + i * 16.4, 760 - i * 6.2 - 120 * Math.sin(i * 0.22) - 50 * Math.sin(i * 0.7) - (rnd(i * 2) - 0.5) * 60]);
function worldB(t) {
  const c = sky(t), shift = lerp(0, 120, sm(t, T.seek - 0.1, 1.2)), restless = sm(t, ws(49), 1.0), fast = 1 + 2.2 * sm(t, ws(51), 0.8) + 2.2 * sm(t, ws(53), 0.8), fog = sm(t, ws(57) - 0.1, 0.6) * (1 - sm(t, T.seek + 0.6, 1.4));
  const past = sm(t, T.past, 1.6), dissolve = sm(t, ws(80) - 0.2, 0.9);
  // the market's past, drawn across the sky like a constellation (۲۰۱۵ … ۲۰۲۶)
  stars(t, 90, sm(t, ws(69), 1.2) * 0.9);
  if (past > 0) { const P = HIST.map(([x, y]) => [x, 470 + ((y - 300) / 600) * 330]), n = Math.floor(past * P.length);
    cv.save(); cv.shadowColor = 'rgba(255,214,140,0.9)'; cv.shadowBlur = 16; trace(P, past, rgba('#FFD27A', 0.85), 4); cv.restore();
    P.slice(0, n).forEach(([x, y], i) => { if (i % 3 === 0) circle(x, y, 5, '#FFE7B0'); });
    for (let yr = 0; yr < 12; yr++) { const x = 90 + yr * 82, a = cl(past * 12 - yr); if (yr % 2 === 0 || yr === 11) txt(fa(2015 + yr), x, 850, 28, rgba('#FFE7B0', 0.85 * a), { w: 700, dir: 'ltr' }); }
    const kl = pop(t - ws(80) + 0.05, 12, 0.6); if (kl > 0) at(CX, 450, cl(kl, 0, 1.2), cl(kl), () => { rrect(-180, -40, 360, 80, 40, rgba('#FFD27A', 0.95)); txt('گذشته‌ی بازار', 0, 3, 40, '#1A1430'); }); }
  cv.save(); cv.translate(0, shift);
  // a faint grid
  cv.save(); cv.globalAlpha *= 0.5; for (let x = -400; x <= 1500; x += 90) line(x, -900, x, 1900, 'rgba(140,160,255,0.06)', 2); for (let y = -900; y <= 1900; y += 90) line(-400, y, 1500, y, 'rgba(140,160,255,0.06)', 2); cv.restore();
  // the experienced one, far away on a peak behind the city, with a lantern
  const kpk = sm(t, T.seek, 1.2);
  if (kpk > 0) { cv.save(); cv.globalAlpha *= kpk; ridge(1060, 60, 0.007, 0.4, mixC(c[1], '#000000', 0.45), -700, 1800); cv.fillStyle = mixC(c[1], '#000000', 0.58); cv.beginPath(); cv.moveTo(380, 1080); cv.lineTo(700, 760); cv.lineTo(1020, 1080); cv.closePath(); cv.fill(); cv.restore();
    const flare = 1 + 0.6 * pop(t - ws(69), 8, 0.4) + 1.2 * past; cv.save(); cv.globalAlpha *= (1 - dissolve) * kpk; fig(700, 760, 0.62, { col: '#F2A33A', arm: 'up', lantern: kpk * flare }); cv.restore();
    if (dissolve > 0) for (let i = 0; i < 34; i++) { const a = rnd(i) * Math.PI * 2, r = dissolve * (60 + rnd(i * 3) * 320); circle(700 + Math.cos(a) * r, 640 + Math.sin(a) * r * 0.6 - dissolve * 160, 3 + rnd(i * 5) * 4, rgba('#FFD27A', (1 - dissolve) * 0.9 + 0.1)); } }
  // the candle city: grows from the path, then won't sit still
  const grow = sm(t, T.markets - 0.1, 1.1), cw = 1000 / NB;
  if (fog > 0) cv.filter = `blur(${fog * 7}px)`;
  const tops = [];
  for (let i = 0; i < NB; i++) { const g = cl(grow * 1.6 - i / NB * 0.6), osc = restless * (0.22 * Math.sin(t * 2.2 * fast + i * 1.7) + 0.12 * Math.sin(t * 3.7 * fast + i)), h = Math.max(40, CBASE[i] * (1 + osc)) * g;
    const x = 40 + i * cw + cw / 2, up = Math.sin(t * 1.3 * fast + i * 2.1) * restless + (rnd(i) - 0.45) > 0, col = up ? '#1FB57C' : '#E5485F';
    line(x, 1720 - h - 40 * g, x, 1720, mixC(col, '#000000', 0.25), 4); rrect(x - cw * 0.32, 1720 - h, cw * 0.64, h * 0.8, 6, mixC(col, c[1], 0.25 + 0.35 * past)); tops.push([x, 1720 - h]); }
  if (grow > 0) { cv.save(); cv.shadowColor = 'rgba(255,200,110,0.9)'; cv.shadowBlur = 18; trace(tops, cl(grow * 1.3), '#FFD27A', 7); cv.restore(); }
  cv.filter = 'none';
  if (fog > 0) { const g = cv.createLinearGradient(0, 900, 0, 1900); g.addColorStop(0, 'rgba(190,200,225,0)'); g.addColorStop(1, `rgba(190,200,225,${0.7 * fog})`); cv.fillStyle = g; cv.fillRect(-600, 700, 2300, 1500); }
  rrect(-600, 1720, 2300, 900, 0, mixC(c[2], '#000000', 0.7));
  // you, small, at the foot of the city
  fig(150, 1720, 0.62, { col: '#8E7CFF' });
  const kq = pop(t - ws(58) + 0.05, 12, 0.5) * (1 - sm(t, T.seek + 0.4, 0.4)); if (kq > 0) at(220, 1450, cl(kq, 0, 1.2), cl(kq), () => { circle(0, 0, 46, '#FFFFFF'); txt('؟', 0, 6, 64, '#1A1430'); });
  cv.restore();
}

// ---------- C: the app (f1's real screens) ----------
const RREP = [40, 130, 1110, 700], RC = [455, 685, 535, 95], RWIN = [600, 196, 560, 268], RLOS = [34, 196, 560, 268];
const DK = ['d02', 'd06', 'd10', 'd14', 'd18', 'd22', 'd26', 'd30', 'd34', 'd38'];
function worldC(t) {
  sky(t); stars(t, 120, 0.8, 1920);
  // the constellation folds into the screen
  const k = easeO(t, T.brand - 0.1, 0.6), sw = sm(t, ws(91) - 0.15, 0.4);
  const ki = pop(t - ws(83) + 0.05, 12, 0.6); if (ki > 0 && IMG.icon) at(CX - 170, 640, cl(ki, 0, 1.2) * 0.8, cl(ki), () => { cv.shadowColor = 'rgba(108,71,255,0.8)'; cv.shadowBlur = 50; cv.drawImage(IMG.icon, -90, -90, 180, 180); });
  const kw = easeO(t, ws(83) + 0.1, 0.35); if (kw > 0 && IMG.word) { const w = 330, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - 60, 640 - h / 2 + (1 - kw) * 20, w, h); cv.restore(); }
  if (sw < 1) at(CX, 0, lerp(0.9, 1, k) * (1 - 0.05 * sw), k * (1 - sw), () => {
    const w = 940, x = -470, y = 780, h = glowShot(FLIP(t, ws(86), ws(91), DK), RREP, x, y, w);
    const kc = pop(t - ws(85) + 0.05, 12, 0.6); if (kc > 0) at(0, (1 - cl(kc)) * 50, 1, cl(kc), () => { const w2 = 860, y2 = y + h + 46; glowShot('c-session', RC, -430, y2, w2); ringIn(RC, [800, 755, 195, 24], -430, y2, w2, easeO(t, ws(86), 0.3), '#FFD27A'); });
  });
  if (sw > 0) at(CX, 0, lerp(0.9, 1, sw), sw, () => {
    const w = 820, x = -410, y1 = 770, h1 = glowShot('h-wl', RWIN, x, y1, w, 1, '#1FB57C'); ringIn(RWIN, RWIN, x, y1, w, easeO(t, ws(91) + 0.1, 0.3), '#1FB57C');
    const kl = pop(t - ws(92) + 0.1, 12, 0.6); if (kl > 0) at(0, (1 - cl(kl)) * 50, 1, cl(kl), () => { const y2 = y1 + h1 + 40; glowShot('h-wl', RLOS, x, y2, w, 1, '#E5485F'); ringIn(RLOS, RLOS, x, y2, w, easeO(t, ws(92) + 0.1, 0.3), '#E5485F'); });
  });
  txt('صفحه‌های واقعی بک‌تست‌لب', CX, 1790, 30, 'rgba(255,255,255,0.7)', { w: 700, alpha: k });
}

// ---------- D: you ----------
const PAT = [[0, 0], [40, -60], [80, 40], [120, -20], [160, 90], [200, -10], [240, 60], [280, -120], [330, -200]];
function worldD(t) {
  const c = sky(t), push = sm(t, ws(105), 1.2), cta = sm(t, T.cta - 0.1, 0.6);
  cv.save(); cv.translate(CX, 1200); const z = lerp(1, 1.12, push) * lerp(1, 0.96, cta); cv.scale(z, z); cv.translate(-CX, -1200);
  sun(540, lerp(1500, 1180, sm(t, T.repeat, 2.5)), 120, t, 1);
  ridge(1260, 50, 0.005, 2.2, mixC(c[1], '#000000', 0.25)); ridge(1380, 40, 0.008, 0.7, mixC(c[2], '#000000', 0.42));
  // the pattern of the past, and its repeat across the valley
  const rep = 1 - sm(t, T.you + 0.4, 0.6);
  if (rep > 0) { cv.save(); cv.globalAlpha *= rep; const A = PAT.map(([x, y]) => [80 + x * 1.2, 900 + y]), B = PAT.map(([x, y]) => [560 + x * 1.2, 900 + y]);
    trace(A, easeO(t, T.repeat, 0.8), 'rgba(255,255,255,0.9)', 7); A.forEach(([x, y], i) => { if (i <= easeO(t, T.repeat, 0.8) * 8) circle(x, y, 7, '#FFFFFF'); });
    const kg = easeO(t, ws(95) - 0.05, 0.8); if (kg > 0) { cv.save(); cv.setLineDash([14, 14]); trace(B, kg, 'rgba(255,255,255,0.55)', 5); cv.restore(); }
    const kr = easeO(t, ws(98) - 0.05, ws(99) - ws(98) + 0.5); if (kr > 0) { cv.save(); cv.shadowColor = 'rgba(255,200,110,0.9)'; cv.shadowBlur = 20; const p = trace(B, kr, '#FFD27A', 9); cv.restore(); circle(p[0], p[1], 12, '#FFD27A'); }
    line(520, 640, 520, 1180, 'rgba(255,255,255,0.35)', 3, [10, 12]);
    const lab = (s, x, k2, bg) => { if (k2 <= 0) return; at(x, 1150, cl(k2, 0, 1.2), cl(k2), () => { const w = measure(s, 34, 800) + 44; rrect(-w / 2, -32, w, 64, 32, bg); txt(s, 0, 3, 34, '#1A1430', { w: 800 }); }); };
    lab('گذشته', 260, pop(t - T.repeat - 0.2, 12, 0.6), 'rgba(255,255,255,0.92)'); lab('تکرار', 760, pop(t - ws(95), 12, 0.6), '#FFD27A'); cv.restore(); }
  // the hill, and you on it with the lantern
  cv.fillStyle = mixC(c[2], '#000000', 0.6); cv.beginPath(); cv.moveTo(-400, 2400); cv.lineTo(-400, 1650); cv.quadraticCurveTo(540, 1360, 1480, 1650); cv.lineTo(1480, 2400); cv.closePath(); cv.fill();
  const ky = sm(t, T.you - 0.2, 0.6), lan = easeO(t, ws(103), 0.6);
  // the lantern's light comes down to you
  if (ky > 0 && lan < 1) { const p = lan, x = lerp(540, 610, p), y = lerp(500, 1250, p); circle(x, y, 18, rgba('#FFD27A', ky)); const g = cv.createRadialGradient(x, y, 4, x, y, 120); g.addColorStop(0, rgba('#FFD27A', 0.6 * ky)); g.addColorStop(1, 'rgba(255,210,122,0)'); cv.fillStyle = g; cv.fillRect(x - 130, y - 130, 260, 260); }
  if (ky > 0) { if (push > 0) { cv.save(); cv.globalAlpha *= push * 0.5; for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (i - 6.5) * 0.16; line(540 + Math.cos(a) * 340, 1200 + Math.sin(a) * 340, 540 + Math.cos(a) * 760, 1200 + Math.sin(a) * 760, 'rgba(255,230,170,0.5)', 10); } cv.restore(); }
    fig(540, 1435, 1.2, { col: '#8E7CFF', arm: lan > 0.95 ? 'up' : 'down', lantern: lan > 0.95 ? 1 + 0.4 * push : 0, a: ky });
    // someone below, still in the rain: next time it's you who helps
    const ks = sm(t, ws(106), 0.8); if (ks > 0) { cv.save(); cv.globalAlpha *= ks; cloud(150, 1440, 0.4, '#3A3F57'); for (let i = 0; i < 10; i++) { const x = 80 + rnd(i) * 140, y = 1480 + ((t * 700 + rnd(i * 5) * 160) % 160); line(x, y, x - 6, y + 22, 'rgba(180,190,220,0.8)', 2); } fig(150, 1700, 0.45, { col: '#7D86A3' }); cv.restore(); } }
  cv.restore();
  // follow card, in the lantern's light
  if (cta > 0) { const followed = t >= ws(114) + 0.12, k = pop(t - T.cta + 0.05, 12, 0.6);
    at(CX, 760, lerp(0.9, 1, cl(k)), cl(k), () => {
      cv.save(); cv.shadowColor = 'rgba(255,200,110,0.6)'; cv.shadowBlur = 60; rrect(-400, -250, 800, 500, 44, '#FFFFFF'); cv.restore();
      if (IMG.icon) cv.drawImage(IMG.icon, 210, -190, 150, 150);
      txt('بک‌تست‌لب', 180, -140, 62, '#1A1430', { align: 'right' }); txt('backtestlab_ir', 180, -72, 34, '#6B6489', { align: 'right', w: 700, dir: 'ltr' });
      txt('اول تست، بعد ترید', 0, 30, 40, '#6B6489', { w: 700 });
      const press = t >= ws(114) && t < ws(114) + 0.12 ? 0.95 : 1;
      at(0, 160, press, 1, () => { rrect(-340, -54, 680, 108, 30, followed ? '#ECE7FA' : '#6C47FF'); txt(followed ? 'فالو شدی ✓' : 'فالو', 0, 4, 48, followed ? '#6C47FF' : '#FFFFFF'); });
      const kc = easeO(t, ws(112) - 0.2, ws(114) - ws(112) + 0.2); if (kc > 0 && t < ws(115) + 0.6) cursor(lerp(360, 40, kc), lerp(420, 170, kc), 0.9);
    });
    const kh = pop(t - ws(109) + 0.05, 13, 0.55); if (kh > 0) at(CX, 470, cl(kh, 0, 1.2), cl(kh), () => { rrect(-170, -40, 340, 80, 40, '#FFD27A'); txt('همین امروز', 0, 3, 42, '#1A1430'); }, -0.03); }
}

// ---------- E: the years of the market, then the end ----------
function worldE(t) {
  const c = sky(t); stars(t, 140, 1, 1920);
  const ky = sm(t, ws(122) - 0.1, ws(125) - ws(122) + 0.6), yr = Math.round(lerp(2015, 2026, ky)), k = easeO(t, T.use - 0.1, 0.6);
  cv.save(); cv.globalAlpha *= k * (1 - sm(t, T.end - 0.2, 0.5));
  cv.save(); cv.shadowColor = 'rgba(255,214,140,0.9)'; cv.shadowBlur = 40; txt(fa(yr), CX, 760, 250, ky >= 1 ? '#FFD27A' : '#FFFFFF', { dir: 'ltr' }); cv.restore();
  txt(ky > 0 ? `${fa(2015)} تا ${fa(yr)}` : 'سال‌ها تجربه‌ی بازار', CX, 920, 46, 'rgba(255,255,255,0.8)', { w: 700 });
  const kc = pop(t - ws(121) + 0.05, 12, 0.6); if (kc > 0) at(CX, (1 - cl(kc)) * 50, 1, cl(kc), () => { const w2 = 880, y2 = 1020; glowShot('c-session', RC, -440, y2, w2); ringIn(RC, [800, 755, 195, 24], -440, y2, w2, easeO(t, ws(124), 0.3), '#FFD27A'); txt('صفحه‌ی واقعی بک‌تست‌لب · ساخت جلسه', 0, y2 + 200, 28, 'rgba(255,255,255,0.7)', { w: 700 }); });
  const kn = pop(t - ws(127) + 0.05, 12, 0.5); if (kn > 0) at(CX, 1420, cl(kn, 0, 1.2), cl(kn), () => { rrect(-230, -50, 460, 100, 50, '#FFD27A'); txt('نهایت استفاده', 0, 4, 50, '#1A1430'); });
  // you, walking on with the lantern
  ridge(1700, 30, 0.006, 1.7, mixC(c[2], '#000000', 0.55)); const wx = lerp(-80, 520, k01(t, T.use, T.end - T.use)); fig(wx, 1712, 0.75, { col: '#8E7CFF', ph: t * 1.5, arm: 'up', lantern: 1 });
  cv.restore();
  // the end card
  const ke = sm(t, T.end - 0.15, 0.5); if (ke > 0) { cv.save(); cv.globalAlpha *= ke; const g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#140D36'); g.addColorStop(1, '#3B25A8'); cv.fillStyle = g; cv.fillRect(0, 0, W, H); stars(t, 80, 0.6, 1920); cv.restore();
    const ki = pop(t - T.end + 0.05, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 620, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.35)'; cv.shadowBlur = 50; cv.shadowOffsetY = 18; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
    const kw = easeO(t, T.end + 0.2, 0.35); if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, CX - w / 2, 810 + (1 - kw) * 24, w, h); cv.restore(); }
    const kf = pop(t - T.end - 0.4, 13, 0.55); if (kf > 0) at(CX, 1080, cl(kf, 0, 1.2), cl(kf), () => { rrect(-280, -52, 560, 104, 52, '#FFD27A'); txt('همین امروز شروع کن', 0, 4, 48, '#1A1430'); });
    const kb = pop(t - T.end - 0.7, 13, 0.6); if (kb > 0) at(CX, 1250, cl(kb, 0, 1.2), cl(kb), () => { cv.save(); cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, '#FFFFFF'); cv.restore(); txt('لینک توی بیو', 0, 4, 62, '#6C47FF'); }); }
}

// ---------- subtitles: the spoken words at the top, word by word ----------
const SUB = [
  [['دیدی', 0], ['وقتی', 1], ['درگیر', 2], ['یه', 3], ['دردسر', [4, 5], 'A'], ['بزرگ', 6, 'A'], ['تو', 7], ['زندگیت', 8], ['میشی،', 9]],
  [['همه', 10], ['بهت', 11], ['دلداری', 12, 'A'], ['میدن،', 13]],
  [['اما', 14], ['کسی', 15], ['درکت', 16, 'A'], ['نمی‌کنه.', [17, 18]]],
  [['اما', 19], ['اگه', 20], ['کسی', 21], ['واقعاً', 22, 'A'], ['درکت', 23, 'A'], ['کنه،', 24]],
  [['قضیه', 25], ['خیلی', 26], ['فرق', 27, 'A'], ['می‌کنه.', 28]],
  [['با', 29], ['تجربه‌ش', 30, 'A'], ['کمکت', 31], ['می‌کنه', 32], ['به', 33], ['راحت‌ترین', [34, 35]], ['شکل', 36], ['ممکن', 37]],
  [['به', 38], ['حال', 39], ['خوبت', 40, 'A'], ['برگردی.', 41]],
  [['بازارای', 42, 'A'], ['مالی', 43, 'A'], ['هم', 44], ['همینه.', 45]],
  [['در', 46], ['سالیان', 47], ['اخیر،', 48], ['بازار', 49], ['اونقدر', 50], ['باهوش', 51, 'A'], ['و', 52], ['پویا', 53, 'A'], ['شده', 54]],
  [['که', 55], ['نمی‌شه', 56], ['بدون', 57], ['درکش', 58, 'A'], ['کاری', 59], ['کرد.', 60]],
  [['پس', 61], ['باید', 62], ['بریم', 63], ['دنبال', 64], ['تجربه‌ی', 65, 'A'], ['همون', 66], ['آدمی', 67]],
  [['که', 68], ['درک', 69, 'A'], ['کامل', 70, 'A'], ['رو', 71], ['داره.', 72]],
  [['و', 73], ['توی', 74], ['بازارای', 75], ['مالی،', 76], ['این', 77], ['درک', 78], ['همون', 79], ['گذشته‌ی', 80, 'A'], ['بازاره.', 81, 'A']],
  [['توی', 82], ['بک‌تست‌لب،', [83, 84], 'V'], ['گذشته‌ی', 85], ['بازار', 86], ['رو', 87], ['می‌تونی', 88], ['درک', 89, 'A'], ['کنی،', 90]],
  [['یاد', 91, 'A'], ['بگیری', 92, 'A']],
  [['و', 93], ['تو', 94], ['تکراری', 95, 'A'], ['که', 96], ['قراره', 97], ['اتفاق', 98], ['بیفته،', 99]],
  [['این', 100], ['بار', 101], ['اون', 102], ['فرد', 103], ['باتجربه،', [104, 105], 'A'], ['تو', 106, 'A'], ['باشی.', 107]],
  [['همین', 108], ['امروز', 109, 'A'], ['شروع', 110], ['کن،', 111], ['پیج', 112], ['رو', 113], ['فالو', 114, 'A'], ['کن', 115]],
  [['و', 116], ['توی', 117], ['بک‌تست‌لب', [118, 119], 'V'], ['از', 120], ['تجربه‌ی', 121], ['چندین', 122], ['و', 123], ['چند', 124], ['ساله‌ی', 125], ['بازار', 126]],
  [['نهایت', 127, 'A'], ['استفاده', 128, 'A'], ['رو', 129], ['ببر.', 130]],
];
const wi0 = (x) => (Array.isArray(x) ? x[0] : x);
function subtitles(t) {
  if (t > T.end - 0.1) return;
  let gi = 0; SUB.forEach((g, i) => { if (t >= ws(wi0(g[0][1])) - 0.12) gi = i; });
  const g = SUB[gi], next = gi + 1 < SUB.length ? ws(wi0(SUB[gi + 1][0][1])) - 0.12 : T.end - 0.1, out = k01(t, next - 0.1, 0.1);
  const size = 66, gap = measure(' ', size, 800) * 1.35, wds = g.map(([s]) => measure(s, size, 800));
  // two lines at most, about 900 px each
  const rows = [[]]; let acc = 0; g.forEach((tk, j) => { const add = wds[j] + (rows[rows.length - 1].length ? gap : 0); if (acc + add > 900 && rows[rows.length - 1].length) { rows.push([]); acc = 0; } rows[rows.length - 1].push(j); acc += wds[j] + (rows[rows.length - 1].length > 1 ? gap : 0); });
  const lh = 96, y0 = 300 - ((rows.length - 1) * lh) / 2;
  rows.forEach((row, ri) => { const total = row.reduce((a, j, q) => a + wds[j] + (q ? gap : 0), 0); let right = CX + total / 2; const y = y0 + ri * lh;
    row.forEach((j) => { const [s, w, hl] = g[j], st = ws(wi0(w)) - 0.06, d = t - st, wpx = wds[j];
      if (d >= 0) { const a = cl(d / 0.12) * (1 - out), rise = (1 - easeO(t, st, 0.25)) * 14; cv.save(); cv.globalAlpha = a; cv.shadowColor = 'rgba(0,0,0,0.75)'; cv.shadowBlur = 22; cv.shadowOffsetY = 4;
        txt(s, right - wpx / 2, y + rise, size, hl === 'A' ? '#FFD27A' : hl === 'V' ? '#B9A8FF' : '#FFFFFF', { w: 800 }); cv.restore(); }
      right -= wpx + gap; });
  });
}

// ---------- grain and vignette ----------
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.floor(rnd(i * 0.37) * 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
function finish(t) {
  const v = cv.createRadialGradient(CX, 960, 600, CX, 960, 1350); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
  cv.save(); cv.globalAlpha = 0.05; cv.globalCompositeOperation = 'overlay'; const ox = Math.floor(rnd(Math.floor(t * 24)) * 256), oy = Math.floor(rnd(Math.floor(t * 24) + 9) * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) cv.drawImage(GRAIN, x, y); cv.restore();
}

// ---------- the frame ----------
function worldAt(t) { return t < T.markets ? 'A' : t < T.brand ? 'B' : t < T.repeat ? 'C' : t < T.use ? 'D' : 'E'; }
const DRAW = { A: worldA, B: worldB, C: worldC, D: worldD, E: worldE };
let NOSUB = false;   // the cover draws its own title instead
const XF = 0.45;   // the cross-dissolve between worlds
function frame(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; cv.globalCompositeOperation = 'source-over';
  if (!MOOD.length) MOOD = [[0, 'storm'], [ws(27) - 0.2, 'storm'], [ws(27) + 1.4, 'dusk'], [ws(38), 'dusk'], [ws(41) + 0.6, 'dawn'], [T.markets - 0.2, 'dawn'], [T.markets + 0.7, 'night'],
    [T.brand - 0.3, 'night'], [T.brand + 0.3, 'violet'], [T.repeat - 0.3, 'violet'], [T.repeat + 0.5, 'dawn'], [T.use - 0.2, 'dawn'], [T.use + 0.6, 'night'], [T.end - 0.2, 'night'], [T.end + 0.4, 'violet']];
  // the camera shakes on the thunder
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(ws(4), 8) + sh(ws(6), 14), 0);
  const cur = worldAt(t); DRAW[cur](t);
  // dissolve into the next world
  const bounds = [T.markets, T.brand, T.repeat, T.use], nx = { A: 'B', B: 'C', C: 'D', D: 'E' }[cur];
  bounds.forEach((b) => { if (nx && t > b - XF && t < b) { cv.save(); cv.globalAlpha = sm(t, b - XF, XF); DRAW[nx](t); cv.restore(); } });
  cv.restore();
  // the lightning lights the whole sky for a moment
  const fl = (a) => (t >= a ? Math.max(0, 1 - (t - a) * 6) : 0), f = 0.55 * fl(ws(4)) + 0.75 * fl(ws(6)); if (f > 0) { cv.fillStyle = `rgba(230,235,255,${f})`; cv.fillRect(0, 0, W, H); }
  if (!NOSUB) subtitles(t); finish(t);
}
window.seek = frame;
window.cover = () => {
  NOSUB = true; frame(ws(13) - 0.2); NOSUB = false;
  cv.setTransform(1, 0, 0, 1, 0, 0); const g = cv.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(8,10,20,0.85)'); g.addColorStop(1, 'rgba(8,10,20,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, 760);
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.7)'; cv.shadowBlur = 24; txt('همه دلداری میدن', CX, 260, 92, '#FFFFFF'); txt('اما کسی درکت نمی‌کنه', CX, 390, 92, '#FFD27A'); cv.restore();
};
