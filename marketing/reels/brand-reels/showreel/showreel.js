// «بازپخش» (Replay): one candle unfolds into words, shapes, space and data, then folds back into itself.
// 25 s at 120 BPM (a beat is 0.5 s, a bar 2 s), 1920×1080. Every pixel is computed from t inside window.seek(t):
// no CSS animation, no timers, no state between frames. Vazirmatn only; violet, green, red, black, white; flat fills.
// Camera language: the camera tracks in the reading direction (right to left) or pushes forward into a detail, and
// that detail is the next scene. Bars: 1 hook (type) · 2 morph · 3 2D→3D · 4 UI · 5 type · 6 morph · 7 2D→3D ·
// 8 data · 9 type · 10 morph · 11 2D→3D city (riser) · 12 four synchronised replays (the strongest moment) ·
// ½ end title, which folds back into the opening candle, so the last frame meets the first.
// FORMAT 'reel' (window.FORMAT, set by build.py) is the Instagram cut: 1080×1920, every scene laid out again for
// portrait inside the app's safe area, and 28 s: after the title, a call to action, then the fold back into the candle.
const REEL = window.FORMAT === 'reel';
const W = REEL ? 1080 : 1920, H = REEL ? 1920 : 1080, CX = W / 2, CY = H / 2, DUR = REEL ? 28 : 25, SY = H / 1080;
const V = '#7C5CFF', G = '#26C281', R = '#F25466', K = '#09080D', WH = '#F5F3FA';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA;

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const k01 = (t, a, d) => cl((t - a) / d);
const ex = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));                 // exponential out
const exIn = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, 10 * x - 10));               // exponential in
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const spr = (dt, w = 16) => (dt <= 0 ? 0 : 1 - (1 + w * dt) * Math.exp(-w * dt));       // critically damped: no overshoot
/** A value that springs from keyframe to keyframe: [[t, v], …]; each spring starts from wherever the last one was. */
function track(t, keys, w = 16) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [ti, vi] = keys[i]; if (t < ti) break; v = lerp(v, vi, spr(t - ti, w)); } return v; }
const track3 = (t, keys, w) => [0, 1, 2].map((i) => track(t, keys.map(([tt, v]) => [tt, v[i]]), w));
const vel = (f, t) => (f(t) - f(t - 1 / 240)) * 240;                                       // px per second, from the function itself

// ---------- directional blur: SVG Gaussian filters along x or y, chosen from the speed ----------
(() => { let s = ''; for (let i = 2; i <= 64; i += 2) s += `<filter id="bx${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${i} 0"/></filter><filter id="by${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0 ${i}"/></filter>`; document.getElementById('flt').innerHTML = s; })();
function blurF(vx, vy) { const ax = Math.abs(vx), ay = Math.abs(vy), sp = Math.max(ax, ay), amt = Math.min(64, Math.round((sp * 0.008) / 2) * 2); if (amt < 4) return 'none'; return `url(#${ax >= ay ? 'bx' : 'by'}${amt})`; }
function blurred(vx, vy, fn) { cv.save(); cv.filter = blurF(vx, vy); fn(); cv.restore(); }

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
function txt(s, x, y, size, col, o = {}) { cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = o.base ?? 'middle'; cv.direction = o.dir ?? 'rtl'; cv.fillText(s, x, y); }
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
/** Ink box of a string drawn with align left / baseline middle at (0, 0). */
function inkBox(s, size, w = 900, dir = 'ltr') { cv.font = FONT(size, w); cv.direction = dir; cv.textAlign = 'left'; cv.textBaseline = 'middle'; const m = cv.measureText(s); return { x0: -m.actualBoundingBoxLeft, x1: m.actualBoundingBoxRight, y0: -m.actualBoundingBoxAscent, y1: m.actualBoundingBoxDescent }; }
/** A row of pieces laid right to left from xr, each in its own direction: [[text, colour, dir?, weight?], …]. */
function row(parts, xr, y, size, gap = 0.3) { let x = xr; parts.forEach(([s, col, dir, w]) => { const wd = measure(s, size, w ?? 800); txt(s, x, y, size, col, { align: 'right', dir: dir ?? 'rtl', w: w ?? 800 }); x -= wd + gap * size; }); }
function rect(x, y, w, h, col) { cv.fillStyle = col; cv.fillRect(x, y, w, h); }
function crect(cx, cy, w, h, col) { cv.fillStyle = col; cv.fillRect(cx - w / 2, cy - h / 2, w, h); }
function bg(col) { rect(0, 0, W, H, col); }
function clip(x, y, w, h) { cv.beginPath(); cv.rect(x, y, w, h); cv.clip(); }
function poly(pts, col) { cv.fillStyle = col; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); cv.fill(); }
function line(pts, col, lw, cap = 'round') { cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cap; cv.lineJoin = 'round'; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.stroke(); }
function dot(x, y, r, col) { if (r <= 0) return; cv.fillStyle = col; cv.beginPath(); cv.arc(x, y, r, 0, 7); cv.fill(); }
const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
/** The opening (and closing) candle: a violet body with its wick. */
function candleIcon(cx, cy, bw, bh, wick, col = V) { crect(cx, cy, 6, wick, col); crect(cx, cy, bw, bh, col); }

// ---------- shapes for morphing: closed outlines resampled to N points, starting at the top ----------
const NP = 160;
function resample(pts, n = NP, closed = true) {
  const P = closed ? [...pts, pts[0]] : pts, seg = []; let L = 0;
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); L += d; }
  const out = []; let j = 0, acc = 0;
  for (let k = 0; k < n; k++) { const s = (closed ? k / n : k / (n - 1)) * L; while (j < seg.length - 1 && acc + seg[j] < s) { acc += seg[j]; j++; } const u = seg[j] ? (s - acc) / seg[j] : 0; out.push([lerp(P[j][0], P[j + 1][0], u), lerp(P[j][1], P[j + 1][1], u)]); }
  if (!closed) return out;
  let cx = 0, cy = 0; out.forEach(([x, y]) => { cx += x; cy += y; }); cx /= n; cy /= n;
  let best = 0, bd = 1e9; out.forEach(([x, y], i) => { const a = Math.atan2(y - cy, x - cx), d = Math.abs(a + Math.PI / 2); if (d < bd) { bd = d; best = i; } });
  return [...out.slice(best), ...out.slice(0, best)];
}
const mix = (a, b, k) => a.map(([x, y], i) => [lerp(x, b[i][0], k), lerp(y, b[i][1], k)]);
const circleS = (cx, cy, r) => resample(Array.from({ length: 96 }, (_, i) => [cx + Math.cos((i / 96) * 6.283 - 1.5708) * r, cy + Math.sin((i / 96) * 6.283 - 1.5708) * r]));
const triS = (cx, cy, s, dir = 1) => resample([[cx - dir * s * 0.45, cy - s * 0.55], [cx + dir * s * 0.6, cy], [cx - dir * s * 0.45, cy + s * 0.55]]);
const rectS = (cx, cy, w, h) => resample([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]);
/** A candlestick outline: wick above and below a body. */
const candleS = (cx, top, bodyTop, bodyBot, bot, bw, ww = 10) => resample([[cx - ww / 2, top], [cx + ww / 2, top], [cx + ww / 2, bodyTop], [cx + bw / 2, bodyTop], [cx + bw / 2, bodyBot], [cx + ww / 2, bodyBot], [cx + ww / 2, bot], [cx - ww / 2, bot], [cx - ww / 2, bodyBot], [cx - bw / 2, bodyBot], [cx - bw / 2, bodyTop], [cx - ww / 2, bodyTop]]);
const hourS = (cx, cy, w, h, waist = 16) => resample([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + waist / 2, cy], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2], [cx - waist / 2, cy]]);
const rot = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
/** Fill a shape in one colour, then wipe a second colour up through it from the bottom (k 0…1): colour changes by shape, never by fading. */
function wipeFill(pts, c0, c1, k) { if (k < 1) poly(pts, c0); if (k <= 0) return; let y0 = 1e9, y1 = -1e9; pts.forEach(([, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); cv.save(); clip(0, lerp(y1, y0, k) - 1, W, y1 - lerp(y1, y0, k) + 2); poly(pts, c1); cv.restore(); }

// ---------- 3D: world x right, y up, z forward; a camera is a position and a target ----------
function camAt(P, T, f = 1400, cy = CY) { const dx = T[0] - P[0], dy = T[1] - P[1], dz = T[2] - P[2], hd = Math.hypot(dx, dz); return { x: P[0], y: P[1], z: P[2], yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, hd), f, cy }; }
function toCam(p, c) { let x = p[0] - c.x, y = p[1] - c.y, z = p[2] - c.z; const cy_ = Math.cos(c.yaw), sy_ = Math.sin(c.yaw); [x, z] = [x * cy_ - z * sy_, x * sy_ + z * cy_]; const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch); [y, z] = [y * cp - z * sp, y * sp + z * cp]; return [x, y, z]; }
const scr = (q, c) => [CX + (q[0] * c.f) / q[2], c.cy - (q[1] * c.f) / q[2], q[2]];
const proj = (p, c) => { const q = toCam(p, c); q[2] = Math.max(1e-3, q[2]); return scr(q, c); };
/** A world-space line, clipped at the near plane. */
function line3(a, b, c, col, lw) { let A = toCam(a, c), B = toCam(b, c); const n = 4; if (A[2] < n && B[2] < n) return; if (A[2] < n) A = A.map((v, i) => lerp(v, B[i], (n - A[2]) / (B[2] - A[2]))); if (B[2] < n) B = B.map((v, i) => lerp(A[i], v, (A[2] - n) / (A[2] - B[2])));
  const p = scr(A, c), q = scr(B, c); cv.strokeStyle = col; cv.lineWidth = lw; cv.beginPath(); cv.moveTo(p[0], p[1]); cv.lineTo(q[0], q[1]); cv.stroke(); }
/** Clip a camera-space polygon to the near plane z = n (Sutherland–Hodgman). */
function clipNear(q, n = 2) { const out = []; q.forEach((a, i) => { const b = q[(i + 1) % q.length], ai = a[2] >= n, bi = b[2] >= n; if (ai) out.push(a); if (ai !== bi) { const k = (n - a[2]) / (b[2] - a[2]); out.push(a.map((v, j) => lerp(v, b[j], k))); } }); return out; }
/** A world polygon as a face [pts, colour, stroke, depth], clipped at the near plane. */
function face(Q, c, col, st) { const q = clipNear(Q.map((p) => toCam(p, c))); if (q.length < 3) return null; const s = q.map((p) => scr(p, c)); return [s, col, st, q.reduce((m, p) => m + p[2], 0) / q.length]; }
/** An axis-aligned box: front (−z) in its colour, a white top, black sides outlined in the colour. */
function boxFaces(x0, x1, y0, y1, z0, z1, c, col) {
  const F = [face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], c, col), face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], c, WH)];
  if (c.x < x0) F.push(face([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], c, K, col)); else if (c.x > x1) F.push(face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], c, K, col));
  return F.filter(Boolean);
}
function drawFaces(F) { F.sort((a, b) => b[3] - a[3]).forEach(([q, col, st]) => { poly(q, col); if (st) { cv.strokeStyle = st; cv.lineWidth = 3; cv.lineJoin = 'round'; cv.beginPath(); q.forEach((p, i) => (i ? cv.lineTo(p[0], p[1]) : cv.moveTo(p[0], p[1]))); cv.closePath(); cv.stroke(); } }); }

// ===================================================================================================================
// BAR 1 · 0–2 s · HOOK (kinetic type): «بازار رو دوباره بازی کن.» The candle collapses into an underline and the
// first word rises out of it; the camera tracks right to left, a word per beat, until the whole line sits underlined.
const HOOK = { words: ['بازار', 'رو', 'دوباره', 'بازی کن'], barH: 22 };
/** Word centres (x, y) relative to the block, the underline's last place and the full stop. Film: one line. Reel: three
 *  lines («بازار رو» / «دوباره» / «بازی کن.»), so the camera tracks down as well as right to left. */
function hookLayout() {
  if (!REEL) {
    let S = 230; const w0 = HOOK.words.reduce((s, w) => s + measure(w, S), 0) + 0.3 * S * 3 + 0.3 * S; if (w0 > 1640) S = Math.floor((S * 1640) / w0);
    const ws = HOOK.words.map((w) => measure(w, S)), gap = 0.3 * S; let xr = 0; const c = []; ws.forEach((w) => { c.push(xr - w / 2); xr -= w + gap; });
    const dotR = S * 0.085, dotX = c[3] - ws[3] / 2 - S * 0.07 - dotR, left = dotX - dotR, lc = left / 2;
    return { S, ws, pos: c.map((x) => [x, 0]), dotR, dot: [dotX, 0], end: [lc, 0, -left], textOff: -40, barOff: 150 };
  }
  const lines = [[0, 1], [2], [3]], lineW = (S) => lines.map((ln) => ln.reduce((a, i) => a + measure(HOOK.words[i], S), 0) + 0.3 * S * (ln.length - 1) + (ln.includes(3) ? 0.24 * S : 0));
  let S = 250; const mx = Math.max(...lineW(S)); if (mx > 900) S = Math.floor((S * 900) / mx);
  const ws = HOOK.words.map((w) => measure(w, S)), LW = lineW(S), pos = [], LS = 1.22 * S; let dot = null;
  lines.forEach((ln, li) => { let xr = LW[li] / 2; const y = (li - 1) * LS; ln.forEach((i) => { pos[i] = [xr - ws[i] / 2, y]; xr -= ws[i] + 0.3 * S; }); if (ln.includes(3)) dot = [pos[3][0] - ws[3] / 2 - 0.07 * S - 0.085 * S, y]; });
  return { S, ws, pos, dotR: 0.085 * S, dot, end: [0, 0, Math.max(...LW)], textOff: -40 * (S / 230), barOff: 150 * (S / 230) };
}
function bar1(t) {
  bg(K); const L = hookLayout(), S = L.S, P = L.pos, E = L.end;
  const panK = (j) => (tt) => track(tt, [[0, -P[0][j]], [0.5, -lerp(P[1][j], E[j], 1 / 3)], [1.0, -lerp(P[2][j], E[j], 2 / 3)], [1.5, -E[j]]], 15);
  const pan = panK(0), panY = panK(1), py = REEL ? panY(t) : 0, vyCam = REEL ? vel(panY, t) : 0;
  const exitX = (tt) => 2200 * exIn(k01(tt, 1.78, 0.22));
  const base = (tt) => CX + pan(tt) + exitX(tt), sx = (x) => base(t) + x, vx = vel(base, t), ty = (i) => CY + py + P[i][1] + L.textOff;
  // the underline: the candle collapses into it, then it slides under each new word and finally under the whole line
  const k = spr(t, 15), barL = track(t, [[0, P[0][0]], [0.5, P[1][0]], [1.0, P[2][0]], [1.5, E[0]]], 16), barW = track(t, [[0, 56], [0, L.ws[0]], [0.5, L.ws[1]], [1.0, L.ws[2]], [1.5, E[2]]], 16);
  const barLY = REEL ? track(t, [[0, P[0][1]], [0.5, P[1][1]], [1.0, P[2][1]], [1.5, P[3][1]]], 16) : 0;
  const by = CY + (REEL ? py + barLY : 0) + lerp(0, L.barOff, k), bh = lerp(220, HOOK.barH, k), wick = 360 * (1 - spr(t, 24)), barTop = by - bh / 2;
  // 1 · «بازار» rises out of the bar
  { const fy = (tt) => S * 1.25 * (1 - spr(tt - 0.04, 14)); cv.save(); clip(0, -50, W, barTop + 50); blurred(vx, vel(fy, t) + vyCam, () => txt(HOOK.words[0], sx(P[0][0]), ty(0) + fy(t), S, WH)); cv.restore(); }
  // 2 · «رو» drops in, violet
  if (t >= 0.5) { const fy = (tt) => (REEL ? -1150 : -760) * (1 - spr(tt - 0.5, 16)); blurred(vx, vel(fy, t) + vyCam, () => txt(HOOK.words[1], sx(P[1][0]), ty(1) + fy(t), S, V)); }
  // 3 · «دوباره» is wiped on from the right
  if (t >= 1.0) { const kk = ex(k01(t, 1.0, 0.3)), x = sx(P[2][0]), w = L.ws[2]; cv.save(); clip(x + w / 2 + 8 - (w + 16) * kk, 0, (w + 16) * kk, H); blurred(vx, vyCam, () => txt(HOOK.words[2], x, ty(2), S, WH)); cv.restore(); }
  // 4 · «بازی کن» slides in from the left
  if (t >= 1.5) { const fx = (tt) => -1200 * (1 - spr(tt - 1.5, 21)); blurred(vx + vel(fx, t), vyCam, () => txt(HOOK.words[3], sx(P[3][0]) + fx(t), ty(3), S, WH)); }
  blurred(vx, vyCam, () => candleIcon(sx(barL), by, barW, bh, wick));
  // the full stop pops on the and-of-four, then rides to the centre and grows into the next bar's dot
  const dk = spr(t - 1.72, 26); if (dk > 0) { const m = exIO(k01(t, 1.8, 0.2)), x0 = CX + pan(t) + L.dot[0], y0 = CY + py + L.dot[1] + L.textOff + S * 0.2;
    dot(lerp(x0, CX, m), lerp(y0, CY, m), lerp(L.dotR, 70, m) * dk, WH); }
}
// BAR 2 · 2–4 s · SHAPE MORPHING: dot → ▶ → ◀◀ → a red and a green candle → a chart of nine
const UIB = D.ui.bars, NINE = UIB.slice(D.ui.entry - 8, D.ui.entry + 1);
/** The nine-candle chart, right to left (the reading direction): NG[8], the entry candle, is the leftmost. */
const nineGeo = () => { let lo = 1e9, hi = -1e9; NINE.forEach((b) => { lo = Math.min(lo, b[2]); hi = Math.max(hi, b[1]); }); const Y = (v) => CY + 220 - ((v - lo) / (hi - lo)) * 440; return NINE.map((b, i) => ({ x: CX + (4 - i) * 104, top: Y(b[1]), bt: Y(Math.max(b[0], b[3])), bb: Y(Math.min(b[0], b[3])), bot: Y(b[2]), up: b[3] >= b[0] })); };
function bar2(t) {
  bg(K); const u = t - 2;
  const dotS = circleS(CX, CY, 70), play = triS(CX + 10, CY, 230, 1);
  const rwA = triS(CX + 95, CY, 200, -1), rwB = triS(CX - 95, CY, 200, -1);
  const candA = candleS(CX + 150, CY - 230, CY - 120, CY + 140, CY + 230, 110), candB = candleS(CX - 150, CY - 260, CY - 170, CY + 90, CY + 210, 110);
  const k1 = spr(u, 15), k2 = spr(u - 0.5, 15), k3 = spr(u - 1.0, 15);
  if (u < 0.5) { poly(mix(dotS, play, k1), WH); return; }
  if (u < 1.0) { poly(mix(play, rwA, k2), WH); poly(mix(play, rwB, k2), WH); return; }
  const A = mix(rwA, candA, k3), B = mix(rwB, candB, k3), wA = ex(k01(u, 1.04, 0.3)), wB = ex(k01(u, 1.1, 0.3));
  if (u < 1.5) { wipeFill(A, WH, R, wA); wipeFill(B, WH, G, wB); return; }
  // four: the pair becomes the chart; the other seven grow out of them, each wiping to its own colour
  const NG = nineGeo();
  NG.forEach((c, i) => { const fromA = i <= 4, src = fromA ? candA : candB, sc = fromA ? R : G, kk = spr(u - 1.5 - Math.abs(i - (fromA ? 3 : 5)) * 0.025, 14);
    const X = (tt) => lerp(fromA ? CX + 150 : CX - 150, c.x, spr(tt - 1.5 - Math.abs(i - (fromA ? 3 : 5)) * 0.025, 14));
    const pts = mix(src, candleS(c.x, c.top, c.bt, c.bb, c.bot, 74), kk), col = c.up ? G : R;
    blurred(vel(X, u), 0, () => wipeFill(pts, sc, col, ex(k01(u, 1.56 + i * 0.012, 0.2)))); });
}
// BAR 3 · 4–6 s · 2D → 3D: the chart tips back onto the floor, its bodies rise into columns, the camera tracks along
// the row and dives into the white top of the last column, the entry candle
function bar3(t) {
  const u = t - 4, NG = nineGeo(), y0 = -220, a = spr(u, 10) * 1.5708, grow = spr(u - 0.5, 12);
  const T = (x, y) => [x, y0 + (y - y0) * Math.cos(a), (y - y0) * Math.sin(a)];            // the chart plane, tipped about its bottom edge
  const geo = NG.map((c) => { const X = c.x - CX, yt = CY - c.bt, yb = CY - c.bb, hi = CY - c.top, lo = CY - c.bot; return { X, yt, yb, hi, lo, h: 70 + (yt - yb) * 2.4, col: c.up ? G : R }; });
  const L8 = geo[8], z8 = ((L8.yt + L8.yb) / 2) - y0, top8 = y0 + L8.h;
  const P0 = track3(u, [[0, [0, 0, -1400]], [0, [0, 780, -980]], [1.0, [-230, 430, -330]]], 9), T0 = track3(u, [[0, [0, 0, 0]], [0, [0, y0, 230]], [1.0, [L8.X, y0 + 60, z8]]], 9);
  // the dive: the camera's distance to the entry candle's top shrinks at a constant zoom rate (log space) and its
  // direction swings round to straight down, so the white roof grows steadily until it is the whole frame
  const dv = Math.pow(k01(u, 1.5, 0.5), 1.7), dt_ = ex(k01(u, 1.5, 0.3)), tgt = [L8.X, top8, z8];
  const O0 = P0.map((v, i) => v - tgt[i]), d0 = Math.hypot(...O0), dir = [lerp(O0[0] / d0, 0, dv), lerp(O0[1] / d0, 1, dv), lerp(O0[2] / d0, -0.06, dv)], dn = Math.hypot(...dir), dist = d0 * Math.pow(7 / d0, dv);
  const P = u < 1.5 ? P0 : tgt.map((v, i) => v + (dir[i] / dn) * dist), Tg = [lerp(T0[0], L8.X, dt_), lerp(T0[1], top8, dt_), lerp(T0[2], z8, dt_)];
  const cam = camAt(P, Tg, 1400);
  bg(K);
  // the floor grid spreads out from under the chart once it starts to tip
  const gk = ex(k01(u, 0.12, 0.7)); if (gk > 0) { cv.save(); cv.lineCap = 'butt'; const xs = lerp(470, 1700, gk), zs = lerp(440, 3200, gk), col = 'rgba(245,243,250,0.22)';
    for (let gx = -1716; gx <= 1716; gx += 104) if (Math.abs(gx) <= xs) line3([gx + 52, y0, 0], [gx + 52, y0, zs], cam, col, 2);
    for (let gz = 0; gz <= zs; gz += 104) line3([-xs, y0, gz], [xs, y0, gz], cam, col, 2); cv.restore(); }
  const F = [];
  geo.forEach((g) => {
    if (grow <= 0) { F.push(face([T(g.X - 5, g.lo), T(g.X + 5, g.lo), T(g.X + 5, g.hi), T(g.X - 5, g.hi)], cam, g.col)); F.push(face([T(g.X - 37, g.yb), T(g.X + 37, g.yb), T(g.X + 37, g.yt), T(g.X - 37, g.yt)], cam, g.col)); return; }
    // the wick shrinks into the body's footprint on the floor; the body rises into a column
    const za = lerp(g.lo, g.yb, grow) - y0, zb = lerp(g.hi, g.yt, grow) - y0; if (zb - za > 1) F.push(face([[g.X - 5, y0 + 0.5, za], [g.X + 5, y0 + 0.5, za], [g.X + 5, y0 + 0.5, zb], [g.X - 5, y0 + 0.5, zb]], cam, g.col));
    F.push(...boxFaces(g.X - 37, g.X + 37, y0, y0 + Math.max(1, g.h * grow), g.yb - y0, Math.max(g.yt - y0, g.yb - y0 + 2), cam, g.col));
  });
  drawFaces(F.filter(Boolean));
  if (u > 1.97) bg(WH);
}
// BAR 4 · 6–8 s · DATA/UI: the white top becomes a replay panel; real EUR/USD hourly candles, the position, the target
const PNL = REEL ? { x: 60, y: 440, w: 960, h: 1000 } : { x: 210, y: 150, w: 1500, h: 780 };
function uiChart(t) {
  const B = UIB, ent = D.ui.entry, exi = D.ui.exit, n = B.length; let lo = 1e9, hi = -1e9; B.forEach((b) => { lo = Math.min(lo, b[2]); hi = Math.max(hi, b[1]); }); lo = Math.min(lo, D.ui.tp); hi = Math.max(hi, D.ui.sl);
  const A = { x: PNL.x + 60, y: PNL.y + 170, w: PNL.w - 120, h: PNL.h - 230 }, X = (i) => A.x + ((i + 0.5) / n) * A.w, Y = (v) => A.y + (1 - (v - lo) / (hi - lo)) * A.h, cw = A.w / n;
  const shown = t < 6.5 ? 0 : t < 7.05 ? (ent + 1) * ex(k01(t, 6.5, 0.42)) : ent + 1 + (exi - ent) * ex(k01(t, 7.05, 0.38));
  const zx = (tt) => 1400 * (1 - spr(tt - 7.0, 15)), xa = X(ent) + zx(t), xb = A.x + A.w + zx(t), eY = Y(D.ui.e), sY = Y(D.ui.sl), tY = Y(D.ui.tp);
  const zone = { x: X(ent), y: Math.min(eY, tY), w: A.x + A.w - X(ent), h: Math.abs(tY - eY) };
  if (t >= 7.0) { blurred(vel(zx, t), 0, () => { rect(xa, Math.min(eY, sY), xb - xa, Math.abs(sY - eY), R); rect(xa, zone.y, xb - xa, zone.h, G); rect(xa, eY - 2, xb - xa, 4, K); });
    txt('حد ضرر', xb - 24, (eY + sY) / 2, 30, WH, { align: 'right', w: 700 }); txt('حد سود', xb - 24, zone.y + 34, 30, WH, { align: 'right', w: 700 }); }
  for (let i = 0; i < Math.min(n, Math.ceil(shown)); i++) { const [o, h, l, c] = B[i], g = cl(shown - i), x = X(i), col = c >= o ? G : R, mid = (Y(o) + Y(c)) / 2;
    const top = lerp(mid, Y(Math.max(o, c)), g), bot = lerp(mid, Y(Math.min(o, c)), g); rect(x - 1.5, lerp(mid, Y(h), g), 3, lerp(mid, Y(l), g) - lerp(mid, Y(h), g), K); rect(x - cw * 0.32, top, cw * 0.64, Math.max(3, bot - top), col); }
  // the replay head
  if (t >= 6.5) { const hx = X(Math.max(0, Math.min(n - 1, shown - 0.5))) + cw * 0.5; rect(hx - 2, A.y - 20, 4, A.h + 40, V); }
  return zone;
}
function bar4(t) {
  const u = t - 6; bg(K);
  const k = spr(u, 14), px = lerp(0, PNL.x, k), py = lerp(0, PNL.y, k), pw = lerp(W, PNL.w, k), ph = lerp(H, PNL.h, k);
  rect(px, py, pw, ph, WH);
  let zone = null;
  if (u > 0.1) { const hk = ex(k01(u, 0.1, 0.35)); cv.save(); clip(px, py, pw, ph);
    // header: the symbol and timeframe, and the replay controls (the ▶ and ◀◀ from bar 2)
    cv.save(); clip(PNL.x + PNL.w - 60 - 640 * hk, PNL.y + 40, 640 * hk, 90); row([['EUR/USD', K, 'ltr', 900], ['۱ ساعته', K, 'rtl', 600]], PNL.x + PNL.w - 60, PNL.y + 86, 46, 0.45); cv.restore();
    poly(triS(PNL.x + 110, PNL.y + 86, 46 * hk, 1), K); poly(triS(PNL.x + 196, PNL.y + 86, 38 * hk, -1), K); poly(triS(PNL.x + 228, PNL.y + 86, 38 * hk, -1), K);
    rect(PNL.x + 60, PNL.y + 140, (PNL.w - 120) * hk, 3, K);
    zone = uiChart(t); cv.restore(); }
  // the result lands on beat four's downbeat; then the camera pushes into the green target until it fills the frame
  if (zone && t >= 7.5) { const pk = exIn(k01(u, 1.8, 0.2)), r = { x: lerp(zone.x, -2, pk), y: lerp(zone.y, -2, pk), w: lerp(zone.w, W + 4, pk), h: lerp(zone.h, H + 4, pk) };
    rect(r.x, r.y, r.w, r.h, G); const lk = spr(t - 7.5, 18); cv.save(); clip(zone.x, zone.y, zone.w, zone.h); txt('+۲R', zone.x + zone.w / 2, zone.y + zone.h / 2 + (1 - lk) * zone.h + pk * zone.h * 1.2, Math.min(96, zone.h * 0.78), WH, { dir: 'ltr' }); cv.restore(); }
}
// BAR 5 · 8–10 s · KINETIC TYPE on green: «کندل به کندل / بدون دیدن آینده.» — the future gets redacted
const T5 = { s1: 250, s2: 150 };
function lay5() {
  if (REEL) return { s1: 280, s2: 116, p: [[CX, CY - 400], [CX, CY - 130], [CX, CY + 140]], y2: CY + 410 };
  const a = measure('کندل', T5.s1), b = measure('به', T5.s1), g = 70, total = a * 2 + b + g * 2, r = CX + total / 2, y1 = CY - 120;
  return { s1: T5.s1, s2: T5.s2, p: [[r - a / 2, y1], [r - a - g - b / 2, y1], [r - a - g - b - g - a / 2, y1]], y2: CY + 150 };
}
function bar5(t) {
  const u = t - 8; bg(G); const L = lay5(), P = L.p, y2 = L.y2, s1 = L.s1, s2 = L.s2;
  const outY = (tt) => -1100 * SY * exIn(k01(tt, 1.82, 0.18)), outX = (tt) => 2100 * (W / 1920) * exIn(k01(tt, 1.82, 0.18)), oy = outY(u), vy = vel(outY, u);
  const w1 = (tt) => -700 * SY * (1 - spr(tt, 16)), w2 = (tt) => 700 * SY * (1 - spr(tt - 0.5, 16)), w3 = (tt) => -1600 * (1 - spr(tt - 1.0, 15));
  blurred(0, vel(w1, u) + vy, () => txt('کندل', P[0][0], P[0][1] + w1(u) + oy, s1, K));
  if (u >= 0.5) blurred(0, vel(w2, u) + vy, () => txt('به', P[1][0], P[1][1] + w2(u) + oy, s1, WH));
  if (u >= 1.0) blurred(vel(w3, u), vy, () => txt('کندل', P[2][0] + w3(u), P[2][1] + oy, s1, K));
  if (u >= 1.5) { const s = 'بدون دیدن آینده', w = measure(s, s2), k = ex(k01(u, 1.5, 0.28)), right = CX + w / 2 + outX(u);
    cv.save(); clip(right - w * k - 8, y2 - 120, w * k + 16, 240); blurred(vel(outX, u), 0, () => txt(s, right, y2, s2, WH, { align: 'right' })); cv.restore();
    // the redaction bar slides over «آینده» from the left, then carries on to the centre: the next bar's rectangle
    const fw = measure('آینده', s2), fx = CX + w / 2 - w + fw / 2; const bx = (tt) => lerp(-300, fx, spr(tt - 1.7, 20));
    if (u >= 1.7) { const toC = exIO(k01(u, 1.84, 0.16)); const x = lerp(bx(u), CX, toC), y = lerp(y2 + 4, CY, toC); blurred(vel(bx, u), 0, () => crect(x, y, lerp(fw + 40, 420, toC), lerp(s2, 150, toC), K)); }
  }
}
// BAR 6 · 10–12 s · MORPH on green: the redaction bar → hourglass → it flips → a clock whose hand winds back → black floods out
function bar6(t) {
  const u = t - 10; bg(G);
  const r0 = rectS(CX, CY, 420, 150), hg = hourS(CX, CY, 300, 420), circ = circleS(CX, CY, 230);
  if (u < 1.0) { const k1 = spr(u, 15), flip = spr(u - 0.5, 12) * Math.PI; let pts = mix(r0, hg, k1); pts = rot(pts, CX, CY, flip); poly(pts, K);
    // the sand: a heap in the lower bulb; it turns over with the glass, then runs back down through the waist
    if (u > 0.12) { const fill = spr(u - 0.12, 14), d = ex(k01(u, 0.72, 0.28)), hp = (k) => [[CX - 110 * k, CY + 195], [CX + 110 * k, CY + 195], [CX, CY + 195 - 120 * k]];
      poly(rot(hp(fill * (1 - d)), CX, CY, flip), WH);
      if (d > 0) { poly(rot([[CX - 110 * d, CY - 195], [CX + 110 * d, CY - 195], [CX, CY - 195 + 120 * d]], CX, CY, flip), WH); if (d < 0.98) rect(CX - 3, CY, 6, 195 - 120 * d, WH); } }
    return; }
  const k3 = spr(u - 1.0, 15); poly(mix(rot(hg, CX, CY, Math.PI), circ, k3), K);
  if (k3 < 0.99) poly([[CX - 110, CY + 195], [CX + 110, CY + 195], [CX, CY + 75]].map(([x, y]) => [lerp(x, CX, k3), lerp(y, CY, k3)]), WH);
  // the clock hand winds backwards
  const ha = -1.5708 - exIO(k01(u, 1.04, 0.46)) * Math.PI * 3, hl = 170 * spr(u - 1.02, 18) * (1 - ex(k01(u, 1.55, 0.25)));
  if (hl > 1) line([[CX, CY], [CX + Math.cos(ha) * hl, CY + Math.sin(ha) * hl]], WH, 16);
  // the flood: the black disk spreads past the edges, leaving its rim as a white ring
  const fk = exIn(k01(u, 1.5, 0.5)); if (fk > 0) { dot(CX, CY, lerp(230, 1150, fk), K); cv.strokeStyle = WH; cv.lineWidth = 6; cv.beginPath(); cv.arc(CX, CY, lerp(230, 300, spr(u - 1.5, 14)), 0, 7); cv.stroke(); }
}
// BAR 7 · 12–14 s · 2D → 3D: the ring tips back into an orbit, five markets stand up on it, the carousel turns one
// stop right to left, and the camera pushes into the violet card, XAU/USD
const SYMS = ['XAU/USD', 'EUR/USD', 'BTC/USD', 'NAS100', 'GBP/USD'];
function bar7(t) {
  const u = t - 12; bg(K);
  const th = lerp(Math.PI / 2, 0.34, spr(u, 11)), Rr = lerp(REEL ? 428 : 300, REEL ? 440 : 560, spr(u, 11)), dy = 40 * spr(u, 11);
  const ring = (ph) => [Rr * Math.cos(ph), dy + Rr * Math.sin(ph) * Math.sin(th), Rr * Math.sin(ph) * Math.cos(th)];
  const spin = (2 * Math.PI) / 5 * (1 - spr(u - 1.0, 13)), cw = REEL ? 330 : 300, chh = REEL ? 190 : 170, F7 = REEL ? 1050 : 1500;
  // the front card's aim point: low on its face, so the camera ends inside the violet, under the label
  // the push: constant zoom rate (the distance shrinks in log space) from where the camera stands to 82 in front of it
  const f0 = ring(-Math.PI / 2), aim = [f0[0], f0[1] + 34, f0[2]], pk = Math.pow(k01(u, 1.5, 0.5), 1.5), lk = ex(k01(u, 1.5, 0.2));
  const O0 = [0 - aim[0], 0 - aim[1], -1500 - aim[2]], d0 = Math.hypot(...O0), od = [lerp(O0[0] / d0, 0, pk), lerp(O0[1] / d0, 0, pk), lerp(O0[2] / d0, -1, pk)], on = Math.hypot(...od), dist = d0 * Math.pow((REEL ? (30 * F7) / CY : 82) / d0, pk);
  const P = u < 1.5 ? [0, 0, -1500] : aim.map((v, i) => v + (od[i] / on) * dist), cam = camAt(P, [lerp(0, aim[0], lk), lerp(0, aim[1], lk), lerp(0, aim[2], lk)], F7);
  // the ring
  cv.strokeStyle = WH; cv.lineWidth = 6; cv.beginPath(); for (let i = 0; i <= 160; i++) { const p = proj(ring((i / 160) * 6.2832), cam); i ? cv.lineTo(p[0], p[1]) : cv.moveTo(p[0], p[1]); } cv.stroke();
  // the cards stand up around their bottom edge, facing the camera, staggered right to left
  const cards = SYMS.map((s, i) => { const ph = -Math.PI / 2 + (i / 5) * 2 * Math.PI + spin, b = ring(ph), st = spr(u - 0.5 - i * 0.04, 15) * (Math.PI / 2);
    const up = [0, chh * Math.sin(st), chh * Math.cos(st)], c3 = [[b[0] - cw / 2, b[1], b[2]], [b[0] + cw / 2, b[1], b[2]], [b[0] + cw / 2 + up[0], b[1] + up[1], b[2] + up[2]], [b[0] - cw / 2, b[1] + up[1], b[2] + up[2]]];
    const q = c3.map((p) => toCam(p, cam)); return { s, i, q, depth: q.reduce((m, p) => m + p[2], 0) / 4, st }; });
  cards.sort((a, b) => b.depth - a.depth).forEach(({ s, i, q, st }) => { if (u < 0.5 || st < 0.02 || q.some((p) => p[2] < 2)) return; const sel = i === 0, Q = q.map((p) => scr(p, cam));
    poly(Q, sel ? V : K); cv.strokeStyle = sel ? V : WH; cv.lineWidth = 4; cv.lineJoin = 'round'; cv.beginPath(); Q.forEach((p, j) => (j ? cv.lineTo(p[0], p[1]) : cv.moveTo(p[0], p[1]))); cv.closePath(); cv.stroke();
    // the label, laid on the card's face with the affine map of its corners (local y runs down the card)
    const [bl, br, tr, tl] = Q; cv.save(); cv.setTransform((tr[0] - tl[0]) / cw, (tr[1] - tl[1]) / cw, (bl[0] - tl[0]) / chh, (bl[1] - tl[1]) / chh, tl[0], tl[1]);
    txt(s, cw / 2, chh * 0.36, REEL ? 56 : 46, WH, { dir: 'ltr', w: 800 }); cv.restore(); });
  if (u > 1.97) bg(V);
}
// BAR 8 · 14–16 s · DATA on violet: 100 real trades, the equity, the hole, wins against losses
const EQ = D.equity, TR = D.trades, NTR = TR.length;
const AREA = REEL ? { x: 80, y: 520, w: 920, h: 640 } : { x: 230, y: 250, w: 1460, h: 560 };
function eqGeo() { let lo = 0, hi = 0; EQ.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); lo -= 1; hi += 1; return { X: (i) => AREA.x + ((i + 0.5) / NTR) * AREA.w, Y: (v) => AREA.y + (1 - (v - lo) / (hi - lo)) * AREA.h, lo, hi }; }
function bar8(t) {
  const u = t - 14; bg(V); const { X, Y } = eqGeo(), y0 = Y(0), bw = AREA.w / NTR;
  const lk = ex(k01(u, 0.04, 0.4)); cv.save(); clip(AREA.x + AREA.w - 1000 * lk, AREA.y - 130, 1000 * lk, 100); row([['بک‌تست', WH, 'rtl', 600], ['EUR/USD', WH, 'ltr', 900], ['۱۰۰ معامله‌ی آخر', WH, 'rtl', 600]], AREA.x + AREA.w, AREA.y - 82, 42, 0.35); cv.restore();
  const fold = exIO(k01(u, 1.8, 0.2)), one = lay9().one;
  if (u < 1.0) {
    rect(AREA.x, y0 - 1, AREA.w * ex(k01(u, 0, 0.3)), 2, WH);
    // one: the equity line draws itself; two: the hole under zero fills black
    const draw = ex(k01(u, 0.0, 0.42)) * (NTR - 1), n = Math.floor(draw), pts = [[AREA.x, y0]]; for (let i = 0; i <= n; i++) pts.push([X(i), Y(EQ[i])]); if (n < NTR - 1) pts.push([X(draw), Y(lerp(EQ[n], EQ[n + 1], draw - n))]);
    if (u >= 0.5) { const fk = ex(k01(u, 0.5, 0.35)), e = (NTR - 1) * fk; cv.fillStyle = K; cv.beginPath(); cv.moveTo(AREA.x, y0); for (let i = 0; i <= e; i++) cv.lineTo(X(i), Y(EQ[i])); cv.lineTo(X(e), Y(EQ[Math.floor(e)])); cv.lineTo(X(e), y0); cv.closePath(); cv.fill(); }
    line(pts, WH, 6);
    const ek = spr(u - 0.4, 20); if (ek > 0) { const p = pts[pts.length - 1]; cv.save(); clip(p[0] - 300, p[1] + 20, 320, 90); txt(rLabel(EQ[NTR - 1]), p[0] + 10, p[1] + 60 + (1 - ek) * 80, 56, WH, { dir: 'ltr', align: 'right' }); cv.restore(); }
    return;
  }
  // three: the hole splits into a bar per trade (a win stands up white, a loss hangs down black)
  // four: they sort, wins to the right and losses to the left; then all of them fold into the «۱» of the next bar
  const k3 = spr(u - 1.0, 15), sort = spr(u - 1.5, 14);
  const order = TR.map((r, i) => [r, i]).sort((p, q) => (p[0] === q[0] ? p[1] - q[1] : p[0] - q[0])), rank = new Array(NTR); order.forEach(([, i], j) => { rank[i] = j; });
  const base = CY + 40;
  [false, true].forEach((pass) => TR.forEach((r, i) => { const win = r > 0; if (win !== pass) return; const xs = AREA.x + (rank[i] + 0.5) * bw + (win ? 60 : -60); let x = lerp(X(i), xs, sort);
    const ya = lerp(y0, win ? base - 220 : base, k3), yb = lerp(Y(EQ[i]), win ? base : base + 110, k3);
    x = lerp(x, (one.x0 + one.x1) / 2, fold); const wdt = lerp(bw * lerp(1.02, 0.7, k3), one.x1 - one.x0, fold); const yt = lerp(Math.min(ya, yb), CY + one.y0, fold), yB = lerp(Math.max(ya, yb), CY + one.y1, fold);
    rect(x - wdt / 2, yt, wdt, yB - yt, K); if (win) { const wk = ex(k01(u, 1.04, 0.24)); rect(x - wdt / 2, lerp(yB, yt, wk), wdt, (yB - yt) * wk, WH); } }));
  if (sort > 0.05 && fold < 0.02) { const lk2 = ex(k01(u, 1.55, 0.25)); cv.save(); clip(0, base + 150 - 60 * lk2, W, 120 * lk2);
    const nWin = TR.filter((r) => r > 0).length; txt(fa(nWin) + ' برد', AREA.x + AREA.w - (nWin * bw) / 2 + 60, base + 160, 54, WH); txt(fa(NTR - nWin) + ' باخت', AREA.x + ((NTR - nWin) * bw) / 2 - 60, base + 160, 54, K); cv.restore(); }
}
// BAR 9 · 16–18 s · TYPE on violet: «۱۰۰ معامله / قبل از اولین / ریالِ واقعی.»
function lay9() {
  const sN = REEL ? 270 : 300, sW = REEL ? 152 : 170, s2 = REEL ? 140 : 150, nW = measure('۱۰۰', sN), w1 = measure('۱', sN), mW = measure('معامله', sW), g1 = 0.13 * sN, R1 = CX + (nW + g1 + mW) / 2;
  const ib = inkBox('۱', sN), nx = R1 - nW;
  const a2 = measure('قبل از', s2), b2 = measure('اولین', s2), g2 = 0.28 * s2, R2 = CX + (a2 + g2 + b2) / 2;
  const w3 = measure('ریالِ واقعی', s2), r3 = 16, R3 = CX + (w3 + 26 + 2 * r3) / 2;
  return { sN, sW, s2, nW, w1, mW, g1, R1, nx, one: { x0: nx + ib.x0, x1: nx + ib.x1, y0: ib.y0, y1: ib.y1 }, a2, b2, g2, R2, w3, r3, R3 };
}
function bar9(t) {
  const u = t - 16; bg(V); const L = lay9();
  const exitY = (tt) => -1300 * SY * exIn(k01(tt, 1.82, 0.18)), ey = exitY(u), vy = vel(exitY, u);
  const y1 = track(u, [[0, CY], [0.5, CY - 150], [1.5, CY - 250]], 16) + ey, y2 = track(u, [[0, CY + 110], [1.5, CY + 15]], 16) + ey, y3 = CY + 240 + ey;
  // «۱» is the folded bar; «۰۰» slides out from behind it; «معامله» is wiped on right to left
  blurred(0, vy, () => txt('۱', L.nx, y1, L.sN, WH, { align: 'left', dir: 'ltr' }));
  const off = (tt) => -(L.nW - L.w1) * (1 - spr(tt - 0.02, 17)); cv.save(); clip(L.nx + L.w1 - 4, 0, W, H); blurred(vel(off, u), vy, () => txt('۰۰', L.nx + L.w1 + off(u), y1, L.sN, WH, { align: 'left', dir: 'ltr' })); cv.restore();
  const mk = ex(k01(u, 0.12, 0.3)), mr = L.R1 - L.nW - L.g1; cv.save(); clip(mr + 6 - (L.mW + 12) * mk, 0, (L.mW + 12) * mk, H); blurred(0, vy, () => txt('معامله', mr, y1 + 26, L.sW, K, { align: 'right' })); cv.restore();
  // «قبل از» rises out of its own baseline; «اولین» slides in from the left
  if (u >= 0.5) { const ry = (tt) => L.s2 * 1.5 * (1 - spr(tt - 0.5, 16)); cv.save(); clip(0, -2000, W, y2 + L.s2 * 0.55 + 2000); blurred(0, vel(ry, u) + vy, () => txt('قبل از', L.R2, y2 + ry(u), L.s2, WH, { align: 'right' })); cv.restore(); }
  if (u >= 1.0) { const fx = (tt) => -1500 * (1 - spr(tt - 1.0, 15)); blurred(vel(fx, u), vy, () => txt('اولین', L.R2 - L.a2 - L.g2 + fx(u), y2, L.s2, K, { align: 'right' })); }
  // «ریالِ واقعی» stretches up from its baseline; the full stop drops in, then carries on to the centre: the next dot
  if (u >= 1.5) { const sk = spr(u - 1.5, 16); cv.save(); cv.translate(0, y3 + L.s2 * 0.3); cv.scale(1, Math.max(0.001, sk)); blurred(0, vy, () => txt('ریالِ واقعی', L.R3, -L.s2 * 0.3, L.s2, WH, { align: 'right' })); cv.restore();
    const dk = spr(u - 1.62, 22), m = exIO(k01(u, 1.8, 0.2)), dx = L.R3 - L.w3 - 26 - L.r3, dy = CY + 240 + L.s2 * 0.24;
    dot(lerp(dx, CX, m), lerp(dy - (1 - dk) * 120, CY, m), lerp(L.r3, 36, m) * cl(dk * 4), WH); }
}
// BAR 10 · 18–20 s · MORPH: the dot → V → W → staircase → the horizon; black ground rises to meet it
const NPL = 96, HZ = REEL ? 1180 : 620;
const pl = (pts) => resample(pts, NPL, false);
function bar10(t) {
  const u = t - 18; bg(V); const XS = REEL ? 0.82 : 1;
  const d0 = pl([[CX, CY], [CX + 0.01, CY]]), vS = pl([[CX - 380 * XS, CY - 200], [CX, CY + 200], [CX + 380 * XS, CY - 200]]);
  const wS = pl([[CX - 460 * XS, CY - 200], [CX - 230 * XS, CY + 200], [CX, CY - 60], [CX + 230 * XS, CY + 200], [CX + 460 * XS, CY - 200]]);
  const st = pl([[CX - 520 * XS, CY + 220], [CX - 300 * XS, CY + 220], [CX - 300 * XS, CY + 60], [CX - 80 * XS, CY + 60], [CX - 80 * XS, CY - 100], [CX + 140 * XS, CY - 100], [CX + 140 * XS, CY - 260], [CX + 520 * XS, CY - 260]]);
  const hz = pl([[-40, HZ], [W + 40, HZ]]);
  const k1 = spr(u, 14), k2 = spr(u - 0.5, 14), k3 = spr(u - 1.0, 14), k4 = spr(u - 1.5, 13);
  let pts = mix(d0, vS, k1); if (u >= 0.5) pts = mix(vS, wS, k2); if (u >= 1.0) pts = mix(wS, st, k3); if (u >= 1.5) pts = mix(st, hz, k4);
  const lw = lerp(72, 22, k1) - (u >= 1.5 ? 18 * k4 : 0);
  const gk = exIO(k01(u, 1.6, 0.4)); if (gk > 0) rect(0, lerp(H, HZ, gk), W, H, K);
  line(pts, WH, Math.max(4, lw));
}
// BAR 11 · 20–22 s · 2D → 3D: the ground becomes a grid, a city of real weekly EUR/USD moves rises, the camera flies
// in and dives into the white roof of the tallest tower
const CITY = D.city, NR = 12, NC = 12;
function bar11(t) {
  const u = t - 20, roof = [80, 560, 600];
  // fly: forward and up over the city; dive: the distance to the tallest roof shrinks at a constant zoom rate while the
  // view swings round to straight down, until the white roof is the whole frame
  const P0 = track3(u, [[0, [0, 200, -200]], [1.0, [-40, 470, 120]]], 8), T0 = track3(u, [[0, [0, 200, 3000]], [1.0, [60, 330, 1500]]], 8);
  const dv = Math.pow(k01(u, 1.5, 0.5), 1.7), lk = ex(k01(u, 1.5, 0.3)), O0 = P0.map((v, i) => v - roof[i]), d0 = Math.hypot(...O0);
  const dir = [lerp(O0[0] / d0, 0, dv), lerp(O0[1] / d0, 1, dv), lerp(O0[2] / d0, -0.05, dv)], dn = Math.hypot(...dir), dist = d0 * Math.pow(6 / d0, dv);
  const cam = camAt(u < 1.5 ? P0 : roof.map((v, i) => v + (dir[i] / dn) * dist), T0.map((v, i) => lerp(v, roof[i], lk)), 1100, HZ);
  const hy = cam.cy + cam.f * Math.tan(cam.pitch); rect(0, 0, W, cl(hy, -10, H + 10), V); rect(0, cl(hy, -10, H + 10), W, H, K);
  // the horizon line from bar 10 draws in to the vanishing point
  const hk = ex(k01(u, 0, 0.4)); if (hk < 1) rect(lerp(-40, CX, hk), HZ - 2, lerp(W + 80, 0, hk), 4, WH);
  const gk = ex(k01(u, 0, 0.45)); cv.save(); cv.lineCap = 'butt';
  for (let gx = -1600; gx <= 1600; gx += 160) line3([gx, 0, 4000], [gx, 0, lerp(4000, -200, gk)], cam, 'rgba(245,243,250,0.5)', 2);
  for (let gz = 0; gz <= 4000; gz += 200) { if (gz > lerp(4000, 0, gk)) continue; line3([-1600, 0, gz], [1600, 0, gz], cam, 'rgba(245,243,250,0.5)', 2); } cv.restore();
  // the city: weeks on a 12 × 12 grid, height = size of the move, green up / red down; rows rise far to near
  const F = []; let mx = 1e-9; CITY.forEach((v) => { mx = Math.max(mx, Math.abs(v)); });
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const v = CITY[r * NC + c]; if (v === undefined) continue; const x = (c - (NC - 1) / 2) * 160, z = 600 + r * 200;
    const rise = spr(u - 0.5 - (NR - 1 - r) * 0.025, 13); if (rise <= 0) continue; let h = (40 + (Math.abs(v) / mx) * 520) * rise; if (r === 0 && c === 6) h = Math.max(h, 560 * rise);
    F.push(...boxFaces(x - 50, x + 50, 0, h, z - 50, z + 50, cam, v >= 0 ? G : R)); }
  drawFaces(F);
  if (u > 1.97) bg(WH);
}
// BAR 12 · 22–24 s · THE STRONGEST MOMENT: the white splits into four markets that replay in sync, open together and
// resolve a sixteenth apart, each panel flooding with its real result
const PSY = ['EURUSD', 'XAUUSD', 'BTCUSD', 'NAS100'], PLAB = ['EUR/USD', 'XAU/USD', 'BTC/USD', 'NAS100'];
const resT = (i) => 23.5 + i * 0.125;
function panelRect(i, gut, mar) {
  if (REEL) { const k = mar / 40, by = lerp(0, 230, k), bh = lerp(H, 1290, k), ch = (bh - 3 * gut) / 4; return { x: mar, y: by + i * (ch + gut), w: W - 2 * mar, h: ch }; }
  const cw = (W - 2 * mar - gut) / 2, ch = (H - 2 * mar - gut) / 2; const col = i % 2, rw = Math.floor(i / 2); return { x: W - mar - (col + 1) * cw - col * gut, y: mar + rw * (ch + gut), w: cw, h: ch }; }
const rLabel = (r) => (r > 0 ? '+' : '−') + fa(Math.abs(r)) + 'R';
function miniChart(p, P, t, i) {
  const B = P.bars, n = B.length; let lo = 1e9, hi = -1e9; B.forEach((b) => { lo = Math.min(lo, b[2]); hi = Math.max(hi, b[1]); }); lo = Math.min(lo, P.tp, P.sl); hi = Math.max(hi, P.tp, P.sl);
  const A = REEL ? { x: p.x + 30, y: p.y + 74, w: p.w - 60, h: p.h - 94 } : { x: p.x + 40, y: p.y + 100, w: p.w - 80, h: p.h - 140 }, X = (k) => A.x + ((k + 0.5) / n) * A.w, Y = (v) => A.y + (1 - (v - lo) / (hi - lo)) * A.h, cw = A.w / n;
  const shown = t < 22.5 ? 0 : t < 23.5 ? (P.entry + 1) * ex(k01(t, 22.5, 0.45)) : P.entry + 1 + (P.exit - P.entry) * ex(k01(t, 23.5, 0.04 + i * 0.125));
  if (t >= 23.0) { const zx = (tt) => 1100 * (1 - spr(tt - 23.0 - i * 0.03, 15)), z = zx(t), xa = X(P.entry) + z, xb = A.x + A.w + 40 + z, eY = Y(P.e), sY = Y(P.sl), tY = Y(P.tp);
    blurred(vel(zx, t), 0, () => { rect(xa, Math.min(eY, sY), xb - xa, Math.abs(sY - eY), R); rect(xa, Math.min(eY, tY), xb - xa, Math.abs(tY - eY), G); rect(xa, eY - 2, xb - xa, 4, K); }); }
  for (let k = 0; k < Math.min(n, Math.ceil(shown)); k++) { const [o, h, l, c] = B[k], g = cl(shown - k), x = X(k), mid = (Y(o) + Y(c)) / 2; rect(x - 1.5, lerp(mid, Y(h), g), 3, lerp(mid, Y(l), g) - lerp(mid, Y(h), g), K);
    const top = lerp(mid, Y(Math.max(o, c)), g), bot = lerp(mid, Y(Math.min(o, c)), g); rect(x - cw * 0.32, top, cw * 0.64, Math.max(3, bot - top), c >= o ? G : R); }
  if (t >= 22.5) { const hx = X(Math.max(0, Math.min(n - 1, shown - 0.5))) + cw * 0.5; rect(hx - 3, A.y - 16, 6, A.h + 32, V); }
  // the result: the winning or losing zone floods the whole panel, and the R lands in it
  if (t >= resT(i)) { const win = P.r > 0, eY = Y(P.e), zy = win ? Math.min(eY, Y(P.tp)) : Math.min(eY, Y(P.sl)), zh = Math.abs((win ? Y(P.tp) : Y(P.sl)) - eY), k = spr(t - resT(i), 20), xa = X(P.entry);
    rect(lerp(xa, p.x, k), lerp(zy, p.y, k), lerp(A.x + A.w + 40 - xa, p.w, k), lerp(zh, p.h, k), win ? G : R);
    cv.save(); clip(p.x, p.y, p.w, p.h); txt(rLabel(P.r), p.x + p.w / 2, p.y + p.h / 2 + (1 - spr(t - resT(i) - 0.02, 18)) * p.h * 0.6, REEL ? 160 : 190, WH, { dir: 'ltr' }); cv.restore(); }
}
function bar12(t) {
  const u = t - 22; bg(K); const gut = 28 * spr(u, 16), mar = 40 * spr(u, 16);
  PSY.forEach((s, i) => { const p = panelRect(i, gut, mar); rect(p.x, p.y, p.w, p.h, WH); cv.save(); clip(p.x, p.y, p.w, p.h);
    const lk = ex(k01(u, 0.1 + i * 0.03, 0.3)); cv.save(); clip(p.x + p.w - 40 - 340 * lk, p.y + (REEL ? 12 : 20), 340 * lk, REEL ? 56 : 70); txt(PLAB[i], p.x + p.w - 40, p.y + (REEL ? 42 : 56), REEL ? 36 : 42, K, { align: 'right', dir: 'ltr', w: 900 }); cv.restore();
    miniChart(p, D.panels[s], t, i); cv.restore(); });
}
// END · 24–25 s · the four results fold into one violet bar, «بک‌تست‌لب» rises out of it, and the bar folds back into the candle
function barEnd(t) {
  const u = t - 24; bg(K);
  const name = 'بک‌تست‌لب', size = 230, nw = measure(name, size), barY = CY + 150, bh = 22;
  const ck = exIO(k01(u, 0, 0.24));
  if (ck < 1) PSY.forEach((s, i) => { const p = panelRect(i, 28, 40), r = D.panels[s].r, sx = CX + nw / 2 - ((i + 1) * nw) / 4;
    const x = lerp(p.x, sx, ck), y = lerp(p.y, barY - bh / 2, ck), w = lerp(p.w, nw / 4, ck), h = lerp(p.h, bh, ck); rect(x, y, w, h, r > 0 ? G : R);
    const sc = h / p.h; if (sc > 0.05) { cv.save(); cv.translate(x + w / 2, y + h / 2); cv.scale(w / p.w, sc); txt(rLabel(r), 0, 0, 190, WH, { dir: 'ltr' }); cv.restore(); } });
  // the violet wipes through the bar right to left, the title rises out of it (as «بازار» did) and sinks back; the bar folds into the candle
  const vw = ex(k01(u, 0.16, 0.16)), fold = exIO(k01(u, 0.66, 0.32));
  const bw = lerp(nw, 56, fold), bhh = lerp(bh, 220, fold), by = lerp(barY, CY, fold), wick = 360 * fold * ex(k01(u, 0.7, 0.24));
  if (ck >= 1) candleIcon(CX, by, bw, bhh, wick);
  if (ck >= 1 && vw < 1) { cv.save(); clip(CX - nw / 2, 0, nw * (1 - vw), H); PSY.forEach((s, i) => rect(CX + nw / 2 - ((i + 1) * nw) / 4, barY - bh / 2, nw / 4, bh, D.panels[s].r > 0 ? G : R)); cv.restore(); }
  const rise = (tt) => track(tt, [[0, 280], [24.12, 0], [24.6, 440]], 18), dy = rise(t);
  if (u >= 0.12 && u < 0.95) { cv.save(); clip(0, -50, W, barY - bh / 2 + 50); blurred(0, vel(rise, t), () => txt(name, CX, CY - 40 + dy, size, WH)); cv.restore();
    const sk = ex(k01(u, 0.2, 0.2)) * (1 - ex(k01(u, 0.58, 0.1))); if (sk > 0) { cv.save(); clip(CX - 320 * sk, barY + 30, 640 * sk, 90); txt('backtestlab.ir', CX, barY + 75, 48, WH, { dir: 'ltr', w: 600 }); cv.restore(); } }
}

// END (reel) · 24–28 s · the four results fold into one violet bar and «بک‌تست‌لب» rises out of it; on beat three the
// block lifts and the bar lets go of a button, the call to action: «۷ روز رایگان», «لینک توی بیو», a press, the label
// rolls to «همین حالا شروع کن»; on the last half bar the button goes back into the bar and the bar folds into the candle
const CTA = { name: 'بک‌تست‌لب', size: 190, btn: ['۷ روز رایگان', 'همین حالا شروع کن'], link: 'لینک توی بیو' };
function barEndReel(t) {
  const u = t - 24; bg(K);
  const nw = measure(CTA.name, CTA.size), bh = 22, lift = (tt) => track(tt, [[0, 0], [25.0, -270]], 15), ly = lift(t), vyL = vel(lift, t);
  const barY0 = CY + 150, barY = barY0 + ly;
  // the panels collapse into four segments of the underline
  const ck = exIO(k01(u, 0, 0.24));
  if (ck < 1) PSY.forEach((s, i) => { const p = panelRect(i, 28, 40), r = D.panels[s].r, sx = CX + nw / 2 - ((i + 1) * nw) / 4;
    const x = lerp(p.x, sx, ck), y = lerp(p.y, barY0 - bh / 2, ck), w = lerp(p.w, nw / 4, ck), h = lerp(p.h, bh, ck); rect(x, y, w, h, r > 0 ? G : R);
    const sc = h / p.h; if (sc > 0.05) { cv.save(); cv.translate(x + w / 2, y + h / 2); cv.scale(w / p.w, sc); txt(rLabel(r), 0, 0, 160, WH, { dir: 'ltr' }); cv.restore(); } });
  // the bar: violet wipes through it right to left; at the end it folds into the candle
  const vw = ex(k01(u, 0.16, 0.16)), fold = exIO(k01(t, 27.66, 0.32));
  const bw = lerp(nw, 56, fold), bhh = lerp(bh, 220, fold), by = lerp(barY, CY, fold), wick = 360 * fold * ex(k01(t, 27.7, 0.24));
  if (ck >= 1) candleIcon(CX, by, bw, bhh, wick);
  if (ck >= 1 && vw < 1) { cv.save(); clip(CX - nw / 2, 0, nw * (1 - vw), H); PSY.forEach((s, i) => rect(CX + nw / 2 - ((i + 1) * nw) / 4, barY0 - bh / 2, nw / 4, bh, D.panels[s].r > 0 ? G : R)); cv.restore(); }
  // the button: born from the underline at 25.0, pressed at 26.5, taken back into the bar at 27.5
  const bk = spr(t - 25.0, 14) * (1 - exIO(k01(t, 27.5, 0.18)));
  if (t >= 25.0 && bk > 0.002) { const bx = CX, byy = lerp(barY, CY + 130, bk), w = lerp(nw, 720, bk), h = lerp(bh, 150, bk), rr = (h / 2) * bk;
    const press = 1 - 0.06 * spr(t - 26.5, 30) * (1 - spr(t - 26.62, 18)), path = () => { cv.beginPath(); cv.roundRect(-w / 2, -h / 2, w, h, rr); };
    cv.save(); cv.translate(bx, byy); cv.scale(press, press); cv.fillStyle = V; path(); cv.fill();
    if (h > 90) { path(); cv.clip(); const lk = ex(k01(t, 25.5, 0.28)), roll = exIO(k01(t, 27.0, 0.25)), w1 = measure(CTA.btn[0], 74);
      cv.save(); clip(w1 / 2 + 8 - (w1 + 16) * lk, -h, (w1 + 16) * lk, 2 * h); txt(CTA.btn[0], 0, -roll * h, 74, WH); cv.restore();
      if (roll > 0) txt(CTA.btn[1], 0, (1 - roll) * h, 62, WH); }
    cv.restore(); }
  // the title rises out of the bar (as «بازار» did), rides up with it, and sinks back into it at the end
  const rise = (tt) => track(tt, [[0, 280], [24.12, 0], [27.5, 440]], 18), dy = rise(t);
  if (u >= 0.12) { cv.save(); clip(0, -50, W, barY - bh / 2 + 50); blurred(0, vel(rise, t) + vyL, () => txt(CTA.name, CX, CY - 40 + ly + dy, CTA.size, WH)); cv.restore(); }
  const sk = ex(k01(t, 24.5, 0.22)) * (1 - ex(k01(t, 27.5, 0.12))); if (sk > 0) { cv.save(); clip(CX - 320 * sk, barY + 30, 640 * sk, 90); txt('backtestlab.ir', CX, barY + 75, 48, WH, { dir: 'ltr', w: 600 }); cv.restore(); }
  // «لینک توی بیو» rises out of its own baseline under the button, and drops back at the end
  if (t >= 26.0) { const ly2 = CY + 300, ry = 90 * (1 - spr(t - 26.0, 16)) + 130 * exIn(k01(t, 27.5, 0.12)); cv.save(); clip(0, 0, W, ly2 + 44); txt(CTA.link, CX, ly2 + ry, 56, WH, { w: 700 }); cv.restore(); }
}

const SCENES = [bar1, bar2, bar3, bar4, bar5, bar6, bar7, bar8, bar9, bar10, bar11, bar12, barEnd];
window.seek = (t) => {
  t = ((t % DUR) + DUR) % DUR;
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.filter = 'none'; cv.globalAlpha = 1; cv.globalCompositeOperation = 'source-over';
  if (REEL && t >= 24) barEndReel(t); else SCENES[Math.min(12, Math.floor(t / 2))](t);
};
window.DURATION = DUR; window.FRAME = [W, H];
(async () => { await Promise.all(['500', '600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A'))); window.seek(0); window.ready = true; })();
