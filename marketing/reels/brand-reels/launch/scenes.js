// BacktestLab launch reel, after the user's two references: kinetic type on changing backgrounds (a search bar being
// typed into, word-by-word lines, a stacked repeat, a glowing counter, a tilted feature stack, a light streak) and the
// real site on a desktop, with a big cursor and camera moves into the UI.
// Screens (launch/shots, see README): the platform on its own API server with real gold prices from April 2025
// (seq1, seq2, r-*), the 4-chart layout with real EURUSD/XAUUSD/BTCUSD/NAS100, and the journal, analytics and
// dashboard of the sample account (p-*).
const T = DATA.t;
const PW = 1440, PH = 900;
const SEQ1 = 17, SEQ2 = 10;

// ---------- small helpers ----------
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, k) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(k)))).join(',')})`; };
/** Keyframed value: keys [[t, v], …] with v a number or an object of numbers, eased between keys. */
function track(t, keys, fn = E.inOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, a] = keys[i - 1], [t1, b] = keys[i], k = fn((t - t0) / (t1 - t0));
    return typeof a === 'number' ? lerp(a, b, k) : Object.fromEntries(Object.keys(a).map((q) => [q, lerp(a[q], b[q] ?? a[q], k)]));
  }
  return keys[keys.length - 1][1];
}
const press = (t, tc) => Math.sin(Math.PI * P(t, tc - 0.08, 0.22));
const lt = (t, k) => t - T[k];

/** Words that land one by one (right to left), each blurring in and rising. words: [[text, colour?], …]. */
function kwords(words, x, y, t, t0, o = {}) {
  const size = o.size ?? 110, font = o.font ?? 'Rdx', wt = o.weight ?? 700, gap = size * 0.3, st = o.stagger ?? 0.13;
  const ws = words.map(([s]) => measure(s, size, wt, font));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let right = x + total / 2;
  const out = o.out !== undefined ? 1 - E.in(P(t, o.out, 0.25)) : 1;
  words.forEach(([s, col], i) => {
    const k = E.out(P(t, t0 + i * st, o.d ?? 0.42)) * out;
    if (k > 0) {
      cv.save(); cv.filter = k < 0.995 ? `blur(${((1 - k) * 18).toFixed(1)}px)` : 'none';
      txt(s, right, y + (1 - k) * 46, { size, font, weight: wt, color: col ?? o.color ?? C.ink, align: 'right', alpha: k * (o.alpha ?? 1), dir: /^[\x20-\x7E]+$/.test(s) ? 'ltr' : 'rtl', glow: col && o.glowCol ? rgba(col, 0.7) : o.glow, glowBlur: o.glowBlur });
      cv.restore();
    }
    right -= ws[i] + gap;
  });
  return total;
}
/** One line that blurs in at a and out at b. */
function bline(s, x, y, t, a, b, o = {}) {
  const k = Math.min(E.out(P(t, a, o.fi ?? 0.35)), 1 - E.in(P(t, b - (o.fo ?? 0.25), o.fo ?? 0.25)));
  if (k <= 0) return; cv.save(); cv.filter = k < 0.995 ? `blur(${((1 - k) * 16).toFixed(1)}px)` : 'none';
  txt(s, x, y + (1 - k) * 30 * (t < b - 0.3 ? 1 : -1), { size: o.size ?? 90, font: o.font ?? 'Rdx', weight: o.weight ?? 700, color: o.color ?? C.ink, alpha: k, glow: o.glow, glowBlur: o.glowBlur, dir: o.dir });
  cv.restore();
}

// ---------- the desktop: a browser window with the site, seen through a camera ----------
// cam: {x, y, z, sy}: the page point (css px of the 1440x900 page) shown at screen (540, sy), z screen px per css px.
const toS = (c, px, py) => [540 + (px - c.x) * c.z, (c.sy ?? 960) + (py - c.y) * c.z];
let DESK_I = 0;   // the motion-blur sample being drawn: only the first one casts the window's shadow
function windowFrame() {
  cv.save(); if (DESK_I === 0) { cv.shadowColor = 'rgba(0,0,0,0.6)'; cv.shadowBlur = 90; cv.shadowOffsetY = 34; }
  rr(-1, -40, PW + 2, PH + 41, 16); cv.fillStyle = '#17141F'; cv.fill(); cv.restore();
  cv.save(); rr(-1, -40, PW + 2, PH + 41, 16); cv.lineWidth = 1.5; cv.strokeStyle = 'rgba(255,255,255,0.10)'; cv.stroke();
  [['#FF5F57', 22], ['#FEBC2E', 44], ['#28C840', 66]].forEach(([c, x]) => { cv.fillStyle = c; cv.beginPath(); cv.arc(x, -20, 6.5, 0, 7); cv.fill(); });
  rr(560, -32, 320, 24, 12); cv.fillStyle = 'rgba(255,255,255,0.07)'; cv.fill();
  cv.restore();
  txt('backtestlab.ir', 720, -19.5, { size: 13, weight: 500, color: '#B9B3CC', dir: 'ltr', font: 'Vaz' });
  cv.save(); cv.strokeStyle = '#8C86A0'; cv.lineWidth = 1.4; rr(655, -24, 8, 7, 1.5); cv.stroke(); cv.beginPath(); cv.arc(659, -24, 3, Math.PI, 0); cv.stroke(); cv.restore();
}
/** The page: a screenshot (2x), or a scroll window into a full-page one; img2 at mix crossfades over it. */
function pageImg(img, o = {}) {
  cv.save(); rr(0, 0, PW, PH, [0, 0, 14, 14]); cv.clip(); cv.fillStyle = '#0D0B14'; cv.fillRect(0, 0, PW, PH);
  if (img) { if (o.scroll !== undefined) cv.drawImage(img, 0, o.scroll * 2, PW * 2, PH * 2, 0, 0, PW, PH); else cv.drawImage(img, 0, 0, PW, PH); }
  if (o.img2 && o.mix > 0) { cv.globalAlpha = o.mix; cv.drawImage(o.img2, 0, 0, PW, PH); }
  cv.restore();
}
function desk(cam, paint) { cv.save(); cv.translate(540 - cam.x * cam.z, (cam.sy ?? 960) - cam.y * cam.z); cv.scale(cam.z, cam.z); paint(); cv.restore(); }
/** The desktop layer with camera motion blur: camAt(t) gives the camera, paint(t) draws the window in page coordinates. */
function deskBlur(t, camAt, paint, t0 = -1) {
  const c0 = camAt(t), c1 = camAt(Math.max(t0, t - 1 / 30));
  const move = Math.hypot((c0.x - c1.x) * c0.z, (c0.y - c1.y) * c0.z, (c0.sy ?? 960) - (c1.sy ?? 960)) + Math.abs(c0.z - c1.z) * 700;
  const n = move > 5 ? Math.min(9, 2 + Math.round(move / 10)) : 1;
  for (let i = 0; i < n; i++) { const ti = Math.max(t0, t - (i / n) * (1.3 / 30)); DESK_I = i; cv.save(); cv.globalAlpha *= 1 / (i + 1); desk(camAt(ti), () => paint(ti)); cv.restore(); }
  DESK_I = 0; return c0;
}
function bgDesk(t, o = {}) {
  const g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top ?? '#33208C'); g.addColorStop(0.5, o.mid ?? '#1C1350'); g.addColorStop(1, '#0B0918');
  cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  glow(800 + 80 * Math.sin(t * 0.4), 260, 900, 600, o.glowCol ?? C.accent, 0.35);
  glow(200, 1500 + 60 * Math.cos(t * 0.3), 800, 600, C.pink, 0.12);
}
/** The macOS pointer, its tip at (x, y). */
function pointer(x, y, o = {}) {
  if ((o.alpha ?? 1) <= 0) return;
  const s = ((o.size ?? 74) / 22) * (1 - 0.14 * (o.press ?? 0));
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; cv.translate(x, y); cv.scale(s, s);
  cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(0, 19); cv.lineTo(4.6, 14.8); cv.lineTo(7.6, 21.6); cv.lineTo(10.7, 20.3); cv.lineTo(7.8, 13.7); cv.lineTo(13.8, 13.7); cv.closePath();
  cv.shadowColor = 'rgba(0,0,0,0.45)'; cv.shadowBlur = 16; cv.shadowOffsetY = 5; cv.fillStyle = '#fff'; cv.fill();
  cv.shadowColor = 'transparent'; cv.lineJoin = 'round'; cv.lineWidth = 1.4; cv.strokeStyle = '#121016'; cv.stroke(); cv.restore();
}
function ring(x, y, k, col = '#fff', r0 = 14) { if (k <= 0 || k >= 1) return; cv.save(); cv.globalAlpha *= (1 - k) * 0.95; cv.strokeStyle = col; cv.lineWidth = 5; cv.beginPath(); cv.arc(x, y, r0 + 52 * E.out(k), 0, 7); cv.stroke(); cv.restore(); }
/** A cursor that follows page-point keys [[t, x, y], …] through the camera; clicks at the given times. */
function cursorOn(t, cam, keys, clicks = [], o = {}) {
  const p = track(t, keys.map(([tk, x, y]) => [tk, { x, y }]), E.inOut);
  const [sx, sy] = toS(cam, p.x, p.y);
  const pr = Math.max(0, ...clicks.map((c) => press(t, c)));
  clicks.forEach((c) => ring(sx, sy, P(t, c, 0.5), o.ringCol ?? '#fff'));
  const a = Math.min(E.out(P(t, keys[0][0] - 0.25, 0.25)), o.out !== undefined ? 1 - P(t, o.out, 0.2) : 1);
  pointer(sx, sy, { press: pr, alpha: a, size: o.size });
}
/** A caption chip in screen space (the site's pill, larger). */
function chip(x, y, s, k, o = {}) {
  if (k <= 0) return; const sc = E.back(clamp(k));
  cv.save(); cv.translate(x, y); cv.scale(sc, sc); pill(0, 0, s, { size: o.size ?? 38, dot: o.dot ?? C.gain, alpha: clamp(k * 1.6), color: o.color ?? C.ink, fill: o.fill ?? rgba('#120F1C', 0.9), border: o.border ?? rgba(C.accent, 0.7) }); cv.restore();
}
/** A highlight box around a page rect, drawn in screen space. */
function hiRect(cam, x, y, w, h, k, col = C.accent) {
  if (k <= 0) return; const [x0, y0] = toS(cam, x, y), [x1, y1] = toS(cam, x + w, y + h);
  cv.save(); cv.globalAlpha *= clamp(k); cv.shadowColor = col; cv.shadowBlur = 30; cv.strokeStyle = col; cv.lineWidth = 5; rr(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20, 18); cv.stroke(); cv.restore();
}
/** Top caption for the desktop scenes: big kinetic words over a soft dark band. */
function topCap(words, t, t0, t1, o = {}) {
  const k = Math.min(E.out(P(t, t0, 0.3)), 1 - E.in(P(t, t1 - 0.2, 0.2))); if (k <= 0) return;
  cv.save(); cv.globalAlpha = k; const g = cv.createLinearGradient(0, 120, 0, 520); g.addColorStop(0, 'rgba(8,6,16,0.0)'); g.addColorStop(0.35, 'rgba(8,6,16,0.55)'); g.addColorStop(1, 'rgba(8,6,16,0)'); cv.fillStyle = g; cv.fillRect(0, 120, W, 400); cv.restore();
  kwords(words, 540, o.y ?? 330, t, t0, { size: o.size ?? 92, out: t1 - 0.25, glowCol: true, glowBlur: 30 });
}

// ---------- 1 · the hook: a search bar is typed into ----------
const QUERY = Array.from('استراتژیم واقعاً جواب می‌ده؟');
function sHook(t) {
  const l = lt(t, 'hook'), dark = E.inOut(P(l, 2.15, 0.6));
  cv.fillStyle = mixc('#ECEAF3', '#0D0B14', dark); cv.fillRect(0, 0, W, H);
  glow(540, 900, 900, 700, C.accent, 0.10 + 0.22 * dark);
  const enter = E.out(P(l, 0, 0.6)), shrink = E.inOut(P(l, 2.05, 0.75));
  const sc = lerp(1.7, 1, enter) * lerp(1, 0.66, shrink), blurPx = (1 - enter) * 22, by = lerp(930, 900, enter);
  const bw = 940, bh = 156, n = Math.round(QUERY.length * P(l, 0.95, 1.05)), s = QUERY.slice(0, n).join('');
  const clicked = l > 2.62;
  cv.save(); cv.translate(540, by); cv.scale(sc, sc); cv.globalAlpha = clamp(enter * 1.6); if (blurPx > 0.3) cv.filter = `blur(${blurPx.toFixed(1)}px)`;
  cv.save(); cv.shadowColor = `rgba(40,20,90,${0.18 + 0.3 * dark})`; cv.shadowBlur = 60; cv.shadowOffsetY = 18; rr(-bw / 2, -bh / 2, bw, bh, bh / 2); cv.fillStyle = mixc('#FFFFFF', '#1D1830', dark); cv.fill(); cv.restore();
  rr(-bw / 2, -bh / 2, bw, bh, bh / 2); cv.lineWidth = 2.5; cv.strokeStyle = mixc('#DCD7EA', '#3A3354', dark); cv.stroke();
  // magnifier on the right
  cv.save(); cv.strokeStyle = mixc('#3C3550', '#B9B3CC', dark); cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.arc(bw / 2 - 92, -6, 22, 0, 7); cv.stroke(); cv.beginPath(); cv.moveTo(bw / 2 - 108, 10); cv.lineTo(bw / 2 - 124, 26); cv.stroke(); cv.restore();
  const tx = bw / 2 - 150;
  txt(s || 'جستجو…', tx, 3, { size: 50, weight: s ? 600 : 500, color: s ? mixc('#1A1628', '#EEEBF6', dark) : '#9C96AE', align: 'right', font: 'Vaz' });
  if (l > 0.5 && !clicked && Math.floor(l * 2.4) % 2 === 0) { const cx = tx - (s ? measure(s, 50, 600, 'Vaz') : 0) - 8; cv.fillStyle = C.accent; cv.fillRect(cx - 2, -30, 4, 60); }
  // the search button on the left
  const bp = press(l, 2.6); cv.save(); cv.translate(-bw / 2 + 112, 0); cv.scale(1 - 0.08 * bp, 1 - 0.08 * bp);
  rr(-88, -50, 176, 100, 50); const g = cv.createLinearGradient(-88, 0, 88, 0); g.addColorStop(0, C.grad0); g.addColorStop(1, C.grad1); cv.fillStyle = g; cv.fill();
  if (!clicked) txt('جستجو', 0, 3, { size: 38, weight: 700, color: '#fff', font: 'Vaz' });
  else for (let i = 0; i < 3; i++) { const k = 0.5 + 0.5 * Math.sin((l - 2.62) * 12 - i * 1.2); cv.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * k})`; cv.beginPath(); cv.arc(-30 + i * 30, 0, 9, 0, 7); cv.fill(); }
  cv.restore();
  cv.restore();
  // the cursor: in, click the field, wait while typing, then click «جستجو»
  const btnX = 540 + sc * (-bw / 2 + 112), btnY = by;
  const p = l < 1.0 ? track(l, [[0.35, { x: 960, y: 1560 }], [0.85, { x: 610, y: 935 }]]) : track(l, [[2.0, { x: 610, y: 935 }], [2.5, { x: btnX + 14, y: btnY + 10 }], [9, { x: btnX + 14, y: btnY + 10 }]]);
  ring(p.x, p.y, P(l, 0.88, 0.5), mixc('#7C5CFF', '#FFFFFF', dark)); ring(p.x, p.y, P(l, 2.6, 0.5), '#fff');
  pointer(p.x, p.y, { press: Math.max(press(l, 0.88), press(l, 2.6)), alpha: E.out(P(l, 0.3, 0.25)) * (1 - P(l, 2.85, 0.15)) });
}

// ---------- 2 · the problem, on white ----------
function sProblem(t) {
  const l = lt(t, 'problem');
  cv.fillStyle = '#F7F6FB'; cv.fillRect(0, 0, W, H);
  kwords([['با'], ['پول'], ['واقعی؟']], 540, 720, t, T.problem + 0.05, { size: 124, color: '#15121F' });
  kwords([['خیلی'], ['گرون', C.loss]], 540, 890, t, T.problem + 0.6, { size: 150, color: '#15121F' });
  kwords([['تموم'], ['می‌شه.']], 540, 1050, t, T.problem + 0.85, { size: 124, color: '#15121F' });
  // a falling red line under the words
  const k = P(l, 1.0, 0.85); if (k > 0) {
    const pts = curve([[0, 0.15], [0.3, 0.3], [0.45, 0.22], [0.7, 0.62], [1, 0.95]], 60, 9, 0.05);
    series({ x: 200, y: 1190, w: 680, h: 260 }, pts.map((v) => -v), { upto: 60 * E.out(k), color: C.loss, lw: 9, glow: true, lo: -1.05, hi: 0 });
  }
}

// ---------- 3 · the brand, full purple ----------
function sBrand(t) {
  const l = lt(t, 'brand'), d = T.stack - T.brand;
  const g = cv.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#8A6CFF'); g.addColorStop(1, '#4A26D9'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  glow(540, 900, 800, 700, '#FFFFFF', 0.16);
  const zoom = E.in(P(l, d - 0.35, 0.35)), k = E.out(P(l, 0, 0.5));
  cv.save(); cv.translate(540, 940); cv.scale(lerp(0.86, 1, k) * (1 + 0.05 * l) * (1 + 5 * zoom), lerp(0.86, 1, k) * (1 + 0.05 * l) * (1 + 5 * zoom));
  cv.globalAlpha = k * (1 - zoom); if (k < 0.99) cv.filter = `blur(${((1 - k) * 20).toFixed(1)}px)`;
  if (IMG.logoW) { const w = 700, h = (w * IMG.logoW.height) / IMG.logoW.width; cv.drawImage(IMG.logoW, -w / 2, -h / 2, w, h); }
  cv.restore();
  bline('برای همین ساختیمش', 540, 720, t, T.brand + 0.15, T.stack - 0.3, { size: 52, color: 'rgba(255,255,255,0.85)', weight: 600, font: 'Vaz' });
}

// ---------- 4 · «کندل به کندل», stacked ----------
const STACK = [['#6E8BFF', '#D65CFF'], ['#7A86FF', '#E05CE0'], ['#8780FF', '#EA5CC6'], ['#FFFFFF', '#FFFFFF'], ['#9A72FF', '#F25C9E'], ['#A866FF', '#F5607F'], ['#B85CFF', '#F2706A']];
function sStack(t) {
  const l = lt(t, 'stack');
  const g = cv.createRadialGradient(540, 900, 50, 540, 900, 1200); g.addColorStop(0, '#2D1670'); g.addColorStop(0.6, '#130A33'); g.addColorStop(1, '#07040F'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  const open = E.out(P(l, 0.1, 0.45)) * (1 - E.inOut(P(l, 1.05, 0.35)));
  STACK.forEach(([c1, c2], i) => {
    const off = i - 3; if (off === 0) return; const a = open * (1 - Math.abs(off) * 0.08);
    if (a <= 0.01) return; runs([['کندل', c1], ['به', c2], ['کندل', c2]], 540, 900 + off * 120 * open, { size: 96, font: 'Rdx', weight: 700, alpha: a });
  });
  const ck = E.out(P(l, 0, 0.3));
  cv.save(); cv.globalAlpha = ck; runs([['کندل', '#FFFFFF'], ['به', '#FFFFFF'], ['کندل', '#FFFFFF']], 540, 900, { size: lerp(96, 112, E.inOut(P(l, 1.05, 0.35))), font: 'Rdx', weight: 700, glow: rgba('#FFFFFF', 0.6) }); cv.restore();
  // «بدون دیدن آینده», with «آینده» kept out of focus
  const k2 = E.out(P(l, 1.35, 0.4)); if (k2 > 0) {
    const size = 82, w1 = measure('بدون دیدن', size, 600, 'Vaz'), w2 = measure('آینده', size, 600, 'Vaz'), gap = 20, tot = w1 + w2 + gap, right = 540 + tot / 2;
    cv.save(); cv.globalAlpha = k2; cv.filter = `blur(${((1 - k2) * 14).toFixed(1)}px)`; txt('بدون دیدن', right, 1060, { size, weight: 600, color: C.muted, align: 'right', font: 'Vaz' }); cv.restore();
    cv.save(); cv.globalAlpha = k2 * 0.95; cv.filter = `blur(${(3.5 + (1 - k2) * 10).toFixed(1)}px)`; txt('آینده', right - w1 - gap, 1060, { size, weight: 700, color: C.lilac, align: 'right', font: 'Vaz' }); cv.restore();
  }
}

// ---------- 5 · the replay on the desktop: click play, real gold candles come in one by one ----------
const R5 = { play: [731, 808] };
function camReplay(tt) {
  const l = tt - T.replay;
  const c = track(l, [[0, { x: 720, y: 470, z: 0.6, sy: 1300 }], [0.6, { x: 720, y: 470, z: 0.69, sy: 1000 }], [1.0, { x: 720, y: 470, z: 0.69, sy: 1000 }], [1.55, { x: 760, y: 780, z: 1.85, sy: 1020 }], [2.05, { x: 760, y: 780, z: 1.85, sy: 1020 }], [2.7, { x: 930, y: 520, z: 1.22, sy: 1000 }], [4.6, { x: 1000, y: 480, z: 1.42, sy: 1000 }]]);
  return c;
}
function sReplay(t) {
  const l = lt(t, 'replay'), click = 1.75;
  bgDesk(t);
  const fi = l < click + 0.2 ? 0 : Math.min(SEQ1 - 1, Math.floor((l - click - 0.2) * 6.5));
  const enter = E.out(P(l, 0, 0.6));
  cv.save(); cv.globalAlpha = clamp(enter * 1.4);
  const cam = deskBlur(t, camReplay, () => { windowFrame(); pageImg(IMG['s1_' + fi]); }, T.replay);
  cv.restore();
  cursorOn(l, cam, [[0.7, 1100, 900], [1.6, R5.play[0] + 6, R5.play[1] + 6], [2.3, R5.play[0] + 6, R5.play[1] + 6], [2.9, 1300, 980]], [click], { out: 2.8 });
  chip(540, 300, 'داده‌ی واقعی · طلا · آوریل ۲۰۲۵', P(l, 2.4, 0.4), { size: 36, dot: C.amber });
  // the hidden future, to the right of the last candle
  const fk = E.out(P(l, 3.0, 0.4)); if (fk > 0) { const [x, y] = toS(cam, 1065, 560); cv.save(); cv.globalAlpha = fk; card(x - 150, y - 50, 300, 100, { r: 50, fill: rgba('#120F1C', 0.92), border: rgba(C.lilac, 0.7) }); cv.restore();
    txt('آینده قفله', x + 30, y + 3, { size: 38, weight: 700, color: C.ink, alpha: fk, font: 'Vaz' });
    cv.save(); cv.globalAlpha = fk; cv.strokeStyle = C.lilac; cv.lineWidth = 5; rr(x - 112, y - 6, 34, 28, 5); cv.stroke(); cv.beginPath(); cv.arc(x - 95, y - 6, 11, Math.PI, 0); cv.stroke(); cv.restore(); }
}

// ---------- 6 · tools: drawings and indicators, then the economic calendar ----------
const FIB = [22, 341];
function camTools(tt) {
  const l = tt - T.tools;
  if (l < 2.0) return track(l, [[0, { x: 150, y: 360, z: 2.1, sy: 960 }], [0.75, { x: 150, y: 360, z: 2.1, sy: 960 }], [1.4, { x: 560, y: 430, z: 1.02, sy: 1000 }], [2.0, { x: 600, y: 440, z: 1.08, sy: 1000 }]]);
  return track(l, [[2.0, { x: 175, y: 470, z: 1.7, sy: 1000 }], [3.0, { x: 185, y: 520, z: 1.85, sy: 1000 }]]);
}
function sTools(t) {
  const l = lt(t, 'tools'), news = l >= 2.0;
  bgDesk(t);
  const cam = deskBlur(t, camTools, () => { windowFrame(); pageImg(news ? IMG.news : IMG.tools); }, news ? T.tools + 2.0 : T.tools);
  if (!news) cursorOn(l, cam, [[0.0, 120, 420], [0.45, FIB[0] + 4, FIB[1] + 4], [0.9, FIB[0] + 4, FIB[1] + 4], [1.5, 700, 650]], [0.55], { out: 1.4 });
  topCap([['ابزار'], ['رسم', C.lilac]], t, T.tools + 0.15, T.tools + 1.05);
  topCap([['اندیکاتور', C.amber]], t, T.tools + 1.05, T.tools + 2.0);
  topCap([['تقویم'], ['اقتصادی', C.gain]], t, T.tools + 2.05, T.tools + 3.0);
}

// ---------- 7 · a position: buy, stop and target, size from the risk; then the target is hit ----------
const BUY = [403, 875], POS = { x: 814, y: 517, w: 303, h: 104 }, RISK = { x: 290, y: 808, w: 270, h: 28 };
function imgPos(l) { if (l < 1.0) return IMG.tools; if (l < 2.45) return IMG.buy; const f = Math.min(SEQ2 - 1, Math.max(0, Math.floor((l - 2.45) * 6))); return IMG['s2_' + f]; }
function camPos(tt) {
  const l = tt - T.pos;
  if (l < 1.0) return track(l, [[0, { x: 520, y: 760, z: 1.3, sy: 1000 }], [0.55, { x: 430, y: 850, z: 1.9, sy: 1000 }]]);
  return track(l, [[1.0, { x: 430, y: 850, z: 1.9, sy: 1000 }], [1.45, { x: 900, y: 590, z: 1.55, sy: 980 }], [1.95, { x: 900, y: 590, z: 1.55, sy: 980 }], [2.3, { x: 470, y: 800, z: 1.75, sy: 980 }], [2.45, { x: 470, y: 800, z: 1.75, sy: 980 }], [2.8, { x: 860, y: 560, z: 1.2, sy: 1000 }], [4.5, { x: 860, y: 560, z: 1.3, sy: 1000 }]]);
}
function sPos(t) {
  const l = lt(t, 'pos');
  bgDesk(t);
  const cam = deskBlur(t, camPos, (tt) => { windowFrame(); pageImg(imgPos(tt - T.pos)); }, l < 1.0 ? T.pos : T.pos + 1.0);
  if (l < 1.0) cursorOn(l, cam, [[0, 600, 700], [0.55, BUY[0] + 4, BUY[1] + 4], [1.0, BUY[0] + 4, BUY[1] + 4]], [0.68], { ringCol: C.gain });
  hiRect(cam, POS.x, POS.y, POS.w, POS.h, P(l, 1.45, 0.25) * (1 - P(l, 2.0, 0.15)), C.lilac);
  hiRect(cam, RISK.x, RISK.y, RISK.w, RISK.h, P(l, 2.3, 0.15) * (1 - P(l, 2.45, 0.05)), C.amber);
  topCap([['پوزیشن'], ['بگیر', C.gain]], t, T.pos + 0.1, T.pos + 1.05);
  topCap([['حد'], ['سود', C.gain], ['و'], ['ضرر', C.loss]], t, T.pos + 1.1, T.pos + 2.05);
  topCap([['حجم'], ['از'], ['درصد'], ['ریسکت', C.amber]], t, T.pos + 2.1, T.pos + 2.75, { size: 84 });
  // the target is hit
  const hit = 2.45 + 6 / 6, hk = P(l, hit, 0.35);
  if (hk > 0 && hk < 1) { cv.save(); cv.globalAlpha = (1 - hk) * 0.35; cv.fillStyle = C.gain; cv.fillRect(0, 0, W, H); cv.restore(); }
  const sk = E.back(P(l, hit + 0.05, 0.45)); if (sk > 0) { cv.save(); cv.translate(540, 1420); cv.scale(sk, sk); card(-300, -95, 600, 190, { r: 95, fill: rgba('#0F1A16', 0.94), border: rgba(C.gain, 0.8), glow: rgba(C.gain, 0.5) });
    txt('+$۱۹۳', 120, 2, { size: 70, font: 'Rdx', weight: 700, color: C.gain, dir: 'ltr', glow: rgba(C.gain, 0.6) }); txt('حد سود خورد', -110, 4, { size: 44, weight: 700, color: C.ink, font: 'Vaz' }); cv.restore(); }
  topCap([['+2R', C.gain]], t, T.pos + hit + 0.05, T.journal + 0.05, { size: 120 });
}

// ---------- 8 · journal, then the analytics page scrolled ----------
function camJournal(tt) {
  const l = tt - T.journal;
  if (l < 1.25) return track(l, [[0, { x: 640, y: 420, z: 0.95, sy: 1000 }], [1.25, { x: 640, y: 440, z: 1.12, sy: 1000 }]]);
  return { x: 700, y: 450, z: 1.0, sy: 1010 };
}
function sJournal(t) {
  const l = lt(t, 'journal'), an = l >= 1.25;
  bgDesk(t, { top: '#24186A' });
  const scrollAt = (tt) => track(tt - T.journal, [[1.35, 0], [1.55, 0], [1.85, 860], [2.15, 860], [2.45, 3852], [9, 3852]]);
  const cam = deskBlur(t, camJournal, (tt) => { windowFrame(); if (an) pageImg(IMG.analytics, { scroll: scrollAt(tt) }); else pageImg(IMG.journal); }, an ? T.journal + 1.25 : T.journal);
  if (an) { // scroll blur
    const v = scrollAt(t) - scrollAt(t - 1 / 30); if (v > 8) for (let i = 1; i < 6; i++) { cv.save(); cv.globalAlpha = 1 / (i + 1); desk(cam, () => pageImg(IMG.analytics, { scroll: scrollAt(t) - (v * i) / 6 })); cv.restore(); }
  }
  if (!an) hiRect(cam, 22, 428, 1140, 36, P(l, 0.35, 0.3) * (1 - P(l, 1.1, 0.15)), C.gain);
  topCap([['ژورنال', C.lilac], ['خودکار']], t, T.journal + 0.1, T.journal + 1.25);
  topCap([['آنالیز', C.lilac], ['کامل']], t, T.journal + 1.3, T.hours);
  [['سود و زیان و وین‌ریت', 1.4, 1.8], ['برنده‌ها و بازنده‌ها', 1.88, 2.4], ['شبیه‌سازی مونت‌کارلو', 2.5, 3.0]].forEach(([s, a, b], i) => chip(540, 1480, s, P(l, a, 0.25) * (1 - P(l, b - 0.06, 0.06)), { size: 44, dot: [C.gain, C.loss, C.lilac][i] }));
}

// ---------- 9 · years of market in hours (the dashboard) ----------
function camHours(tt) { const l = tt - T.hours; return track(l, [[0, { x: 880, y: 224, z: 1.0, sy: 980 }], [2.0, { x: 880, y: 226, z: 1.75, sy: 980 }]], E.out); }
function sHours(t) {
  const l = lt(t, 'hours');
  bgDesk(t, { top: '#1E1650' });
  const cam = deskBlur(t, camHours, () => { windowFrame(); pageImg(IMG.dashboard); }, T.hours);
  cv.save(); const g = cv.createLinearGradient(0, 1150, 0, 1700); g.addColorStop(0, 'rgba(8,6,16,0)'); g.addColorStop(0.4, 'rgba(8,6,16,0.8)'); g.addColorStop(1, 'rgba(8,6,16,0.9)'); cv.fillStyle = g; cv.fillRect(0, 1150, W, 600); cv.restore();
  kwords([['چند'], ['سال', C.lilac], ['بازار…']], 540, 1330, t, T.hours + 0.2, { size: 100, glowCol: true, glowBlur: 30 });
  kwords([['توی'], ['چند'], ['ساعت.', C.gain]], 540, 1470, t, T.hours + 0.8, { size: 100, glowCol: true, glowBlur: 30 });
  txt('تصویر واقعی برنامه · حساب نمونه', 540, 1600, { size: 26, weight: 500, color: C.faint, alpha: E.out(P(l, 0.6, 0.4)), font: 'Vaz' });
}

// ---------- 10 · a glowing counter: years of real data ----------
function sCount(t) {
  const l = lt(t, 'count');
  cv.fillStyle = '#040807'; cv.fillRect(0, 0, W, H);
  glow(540, 880, 760, 760, C.gain, 0.30 * E.out(P(l, 0, 0.5)));
  const n = Math.round(11 * E.out(P(l, 0.1, 0.9)));
  txt(fa(n), 540, 860, { size: 330, font: 'Rdx', weight: 700, color: '#C9FFE6', glow: rgba(C.gain, 0.95), glowBlur: 70, alpha: E.out(P(l, 0, 0.25)) });
  kwords([['سال'], ['داده‌ی'], ['واقعی', C.gain], ['بازار']], 540, 1110, t, T.count + 0.55, { size: 70, glowCol: true, glowBlur: 24 });
  bline('از ۲۰۱۵ تا امروز', 540, 1220, t, T.count + 0.95, T.layout + 0.3, { size: 46, color: C.muted, weight: 600, font: 'Vaz' });
}

// ---------- 10b · four real charts at once ----------
function camLayout(tt) { const l = tt - T.layout; return track(l, [[0, { x: 600, y: 470, z: 0.86, sy: 1050 }], [1.5, { x: 600, y: 480, z: 0.95, sy: 1050 }]], E.out); }
function sLayout(t) {
  const l = lt(t, 'layout');
  bgDesk(t, { top: '#1B3A5C', mid: '#14204A', glowCol: C.sky });
  deskBlur(t, camLayout, () => { windowFrame(); pageImg(IMG.layout4); }, T.layout);
  chip(540, 420, '۷۲ نماد در ۵ بازار', P(l, 0.1, 0.3), { size: 44, dot: C.gain });
  chip(540, 1530, '۴ چارت هم‌زمان', P(l, 0.45, 0.3), { size: 44, dot: C.sky });
  chip(540, 1640, 'تایم‌فریم ۱ ثانیه تا روزانه', P(l, 0.8, 0.3), { size: 44, dot: C.amber });
}

// ---------- 11 · the feature stack, tilted in 3D ----------
const FEATURES = ['ریپلی کندل به کندل', 'داده‌ی واقعی از ۲۰۱۵', '۷۲ نماد در ۵ بازار', 'تایم‌فریم ۱ ثانیه تا روزانه', '۴ چارت هم‌زمان', 'ابزار رسم و اندیکاتور', 'تقویم اقتصادی روی چارت', 'حجم بر اساس ریسک', 'ژورنال معاملات', 'آنالیز کامل', 'شبیه‌سازی مونت‌کارلو', 'استراتژی و چک‌لیست', 'ذخیره روی سرور، روی هر دستگاه'];
function sPills(t) {
  const l = lt(t, 'pills'), d = T.streak - T.pills;
  cv.fillStyle = '#05040B'; cv.fillRect(0, 0, W, H);
  glow(540, 960, 900, 900, C.accent, 0.16); glow(700, 1300, 600, 500, C.gain, 0.06);
  const scroll = lerp(-1.5, FEATURES.length - 3.5, E.inOut(P(l, 0, d))), PWD = 700, PHT = 116;
  // a tilted column: lower items nearer (bigger), the list drifting up and to the right
  FEATURES.map((f, i) => ({ f, i, y: (i - scroll) * 158 })).sort((p, q) => p.y - q.y).forEach(({ f, i, y }) => {
    const s = clamp(1 + y / 2000, 0.5, 1.5), al = clamp(1 - Math.abs(y) / 1050) * E.out(P(l, 0.04 * (i % 5), 0.35));
    if (al <= 0.02) return; const col = i % 3 === 1 ? C.gain : C.accent;
    cv.save(); cv.translate(560 - y * 0.2, 960 + y * 0.9); cv.rotate(-0.15); cv.transform(1, 0, -0.32, 0.8, 0, 0); cv.scale(s, s); cv.globalAlpha = al;
    cv.shadowColor = col; cv.shadowBlur = 44; rr(-PWD / 2, -PHT / 2, PWD, PHT, PHT / 2); const g = cv.createLinearGradient(0, -PHT / 2, 0, PHT / 2); g.addColorStop(0, rgba(col, 0.3)); g.addColorStop(1, rgba('#0B0916', 0.96)); cv.fillStyle = g; cv.fill();
    cv.shadowBlur = 20; cv.lineWidth = 3.5; cv.strokeStyle = rgba(col, 0.95); cv.stroke(); cv.shadowBlur = 0;
    cv.font = '700 50px Vaz'; cv.direction = 'rtl'; cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.fillStyle = C.ink; cv.fillText(f, 0, 3);
    cv.restore();
  });
}

// ---------- 12 · a light streak behind short lines ----------
function streak(t, k) {
  const ang = -1.05 + 0.08 * Math.sin(t * 0.9);
  cv.save(); cv.globalCompositeOperation = 'lighter'; cv.translate(540 + 30 * Math.sin(t * 0.7), 930); cv.rotate(ang);
  [[C.accent, 760, 0.16, 0.55], [C.gain, 520, 0.07, 0.45], ['#FFFFFF', 300, 0.035, 0.6]].forEach(([col, r, sy, a]) => { cv.save(); cv.scale(1, sy); const g = cv.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, rgba(col, a * k)); g.addColorStop(0.5, rgba(col, a * 0.35 * k)); g.addColorStop(1, rgba(col, 0)); cv.fillStyle = g; cv.fillRect(-r, -r, 2 * r, 2 * r); cv.restore(); });
  cv.restore();
}
const LINES12 = [[0.0, 0.42, 'استراتژیت.'], [0.42, 0.84, 'آمارت.'], [0.84, 1.3, 'ژورنالت.']];
function sStreak(t) {
  const l = lt(t, 'streak');
  cv.fillStyle = '#050409'; cv.fillRect(0, 0, W, H);
  streak(t, E.out(P(l, 0, 0.5)));
  LINES12.forEach(([a, b, s]) => bline(s, 540, 960, t, T.streak + a, T.streak + b, { size: 110, fi: 0.18, fo: 0.12 }));
  bline('بک‌تست‌لب', 540, 880, t, T.streak + 1.35, T.streak + 2.3, { size: 120, color: C.lilac, glow: rgba(C.accent, 0.7), glowBlur: 36 });
  bline('فقط یه ابزار نیست', 540, 1030, t, T.streak + 1.55, T.streak + 2.3, { size: 84 });
  bline('جاییه که قبل از ریسک،', 540, 900, t, T.streak + 2.35, T.streak + 3.15, { size: 80 });
  bline('تمرین می‌کنی.', 540, 1020, t, T.streak + 2.55, T.streak + 3.15, { size: 96, color: C.gain, glow: rgba(C.gain, 0.6), glowBlur: 30 });
  bline('آماده‌ای؟', 540, 960, t, T.streak + 3.2, T.end + 0.05, { size: 130, glow: rgba(C.accent, 0.8), glowBlur: 40 });
}

// ---------- 13 · the end card ----------
function sEnd(t) {
  const l = lt(t, 'end');
  background(t, { intensity: 1.2 });
  streak(t, 0.5);
  const ik = E.back(P(l, 0.05, 0.5)); if (ik > 0 && IMG.icon) { cv.save(); cv.translate(540, 640); cv.scale(ik, ik); cv.shadowColor = rgba(C.accent, 0.8); cv.shadowBlur = 80; cv.drawImage(IMG.icon, -120, -120, 240, 240); cv.restore(); }
  const wk = E.out(P(l, 0.3, 0.5)), wm = IMG.wordmark; if (wk > 0 && wm) { const w = 600, h = (w * wm.height) / wm.width; cv.save(); cv.globalAlpha = wk; if (wk < 0.99) cv.filter = `blur(${((1 - wk) * 14).toFixed(1)}px)`; cv.drawImage(wm, 540 - w / 2, 880 - h / 2, w, h); cv.restore(); }
  chip(540, 1010, 'از امروز در دسترس', P(l, 0.65, 0.35), { size: 40, dot: C.gain });
  const bk = E.back(P(l, 1.0, 0.45)); if (bk > 0) { const bob = Math.sin((l - 1.0) * 6) * 8; cv.save(); cv.translate(540, 1210); cv.scale(bk, bk); button(0, 0, 'لینک در بیو', { size: 54 }); cv.restore();
    cv.save(); cv.globalAlpha = clamp(bk); cv.translate(540, 1080 + bob + 22); cv.fillStyle = C.lilac; cv.beginPath(); cv.moveTo(0, -30); cv.lineTo(28, 4); cv.lineTo(10, 4); cv.lineTo(10, 32); cv.lineTo(-10, 32); cv.lineTo(-10, 4); cv.lineTo(-28, 4); cv.closePath(); cv.fill(); cv.restore(); }
  bline('شروعش رایگانه', 540, 1350, t, T.end + 1.35, DUR + 1, { size: 50, color: C.gain, weight: 700, font: 'Vaz' });
  bline('فالو کن تا چیزی رو از دست ندی', 540, 1450, t, T.end + 1.7, DUR + 1, { size: 38, color: C.muted, weight: 600, font: 'Vaz' });
}

const SCENES = { hook: sHook, problem: sProblem, brand: sBrand, stack: sStack, replay: sReplay, tools: sTools, pos: sPos, journal: sJournal, hours: sHours, count: sCount, layout: sLayout, pills: sPills, streak: sStreak, end: sEnd };
const ORDER = Object.keys(SCENES).filter((k) => T[k] !== undefined).sort((a, b) => T[a] - T[b]);
function render(t) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; cv.globalCompositeOperation = 'source-over';
  let k = ORDER[0]; for (const s of ORDER) if (t >= T[s]) k = s;
  SCENES[k](t);
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const light = k === 'problem' ? 1 : k === 'hook' ? 1 - E.inOut(P(t - T.hook, 2.15, 0.6)) : 0;
  const f = Math.floor(t * 24); for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) cv.drawImage(GRAIN[f % 3], x, y);
  if (light < 1) { const v = cv.createRadialGradient(540, 960, 520, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${0.5 * (1 - light)})`); cv.fillStyle = v; cv.fillRect(0, 0, W, H); }
}
const SHOTS = [['tools', 'r-tools'], ['buy', 'r-buy'], ['news', 'r-news'], ['layout4', 'r-layout4'], ['journal', 'p-journal'], ['analytics', 'p-analytics-full'], ['dashboard', 'p-dashboard']];
boot(render, [
  loadImg('logoW', window.ASSET + 'brand/svg/logo-fa-white.svg'), loadImg('wordmark', window.ASSET + 'brand/svg/wordmark-fa-dark.svg'),
  ...SHOTS.map(([k, f]) => loadImg(k, `shots/${f}.jpg`)),
  ...Array.from({ length: SEQ1 }, (_, i) => loadImg('s1_' + i, `shots/seq1/${String(i).padStart(3, '0')}.jpg`)),
  ...Array.from({ length: SEQ2 }, (_, i) => loadImg('s2_' + i, `shots/seq2/${String(i).padStart(3, '0')}.jpg`)),
]);
