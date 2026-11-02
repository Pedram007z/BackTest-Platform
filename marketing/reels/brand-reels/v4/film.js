// v4 · the manifesto as a cinematic product film. The same voice and timing as v1 (../v1/data.json).
// Real BacktestLab screens float on tilted 3D planes in a dark violet space; the camera drifts and pushes in
// slowly, cuts on the words and whip-pans between features. A light sweep crosses each screen; film grain, a vignette
// and soft flashes on the beats. The words run as large subtitles at the bottom, revealed word by word. Everything is
// drawn on one 2D canvas, the screens in perspective too (see drawPlane). In order:
//   - a real replay of gold advancing (f1's replay frames, as a flipbook);
//   - the clean replay out of focus while «حدس زدن» is said, pulled sharp on «تمام» (guessing ends);
//   - the BacktestLab icon and wordmark;
//   - New session (آزمایش), the real Monte Carlo simulation (شبیه‌سازی), Analytics (تحلیل);
//   - the chart with drawing tools (بک‌تست دستی); the win/loss and donut panels of Analytics (ارزیابی);
//   - prop-firm rules: no screen (the platform has no rule simulation), only a glass shield and three rule chips;
//   - the dashboard, a scroll down the full Analytics page (سنجش عملکرد), the journal (تصمیم‌گیری);
//   - four screens converge into one stack (یک‌پارچه);
//   - a placed order desaturates on «صرفاً معامله»; a planned position (entry, stop, target) with a check on «آماده»;
//   - the wordmark, «شروعش رایگانه», «لینک توی بیو».
// 1080×1920, every frame a pure function of t (window.seek). Key content inside y 220–1520.
const W = 1080, H = 1920, CX = 540, CY = 740;
const VIO = '#A48DFF', RED = '#FF4D5E', GRN = '#4ADE80';
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), io = (x) => { x = cl(x); return x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const sine = (x) => 0.5 - Math.cos(Math.PI * cl(x)) / 2;
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- the canvas ----------
// one 2D canvas kept on the CPU (willReadFrequently): headless Chromium's emulated GPU process kept dying with these
// screens (through WebGL, CSS 3D or a GPU canvas, which then silently drew nothing)
const cv = document.getElementById('c').getContext('2d', { willReadFrequently: true });
const IMG = {};
const loadImg = (k, src) => new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => { console.error('missing image: ' + k); ok(); }; i.src = src; });
const PATHS = {};
/** A Lucide icon (its <path d> elements) as Path2D objects in its 24×24 box. */
const icon = (name) => (PATHS[name] ??= [...window.ICONS[name].matchAll(/ d="([^"]+)"/g)].map((m) => new Path2D(m[1])));
function strokeIcon(name, cx, cy, size, col, lw) { cv.save(); cv.translate(cx - size / 2, cy - size / 2); cv.scale(size / 24, size / 24); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; icon(name).forEach((p) => cv.stroke(p)); cv.restore(); }
const FONT = (size, w) => `${w} ${size}px Vazirmatn`;
function measure(s, size, w) { cv.font = FONT(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
/** A soft glow (a radial gradient; canvas shadowBlur crashed headless Chromium's GPU process here). */
function glow(x, y, r, col) { const g = cv.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = g; cv.fillRect(x - r, y - r, r * 2, r * 2); }
/** An image centred at (cx, cy), w wide, scaled by s; k < 1 shows only its right part (a reveal from the right). */
function drawImg(key, cx, cy, w, s = 1, k = 1) {
  const im = IMG[key]; if (!im || k <= 0) return; const h = (w * im.height) / im.width;
  cv.save(); cv.translate(cx, cy); cv.scale(s, s); if (k < 1) { cv.beginPath(); cv.rect(w / 2 - w * k, -h / 2 - 10, w * k, h + 20); cv.clip(); } cv.drawImage(im, -w / 2, -h / 2, w, h); cv.restore();
}

// ---------- the screens: planes in perspective, drawn on the 2D canvas ----------
// The camera is like a CSS perspective of 1700 px with its origin at (540, 740): a plane's point is placed by the same
// transform as CSS (translate3d, rotateX, rotateY, rotateZ, scale, then the (u, v) offset; y down, z toward the eye)
// and projected. Each picture is cut into a grid of triangles, and each triangle is drawn with the affine transform
// that maps it exactly onto its projected corners, so the perspective is right to within a fraction of a pixel.
const PERSP = 1700, D2R = Math.PI / 180, GX = 16, GY = 10;
const SIZE = { tall: [1200, 3960] };   // the full Analytics page is tall; every other screen is 16:10
const P = {};
function plane(key) {
  if (P[key]) return P[key]; const [w, h] = SIZE[key] || [1600, 1000];
  // the tall page is a column of tiles; the flipbook is one tile whose picture is swapped
  const src = key === 'flip' ? [null] : [].concat(window.IMGS[key]), n = src.length;
  return (P[key] = { key, w, h, tiles: src.map((u, i) => ({ src: u, cur: null, img: null, blur: null, gray: null, y0: (h / n) * i, h: h / n })), order: 0, used: false, st: null, glare: 0 });
}
const BASE = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, u: 0.5, v: 0.5, blur: 0, br: 1, sat: 1, op: 1 };
function place(p, st, glare) { p.st = st; p.glare = glare; p.used = true; }
/** The projection of a plane in a state: (px, py) from its top-left corner, in px → [x, y] in the frame, or null behind
 *  the eye. `zoom` is the camera punch, around the perspective origin. */
function projector(p, st, zoom) {
  const [cx, sx] = [Math.cos(st.rx * D2R), Math.sin(st.rx * D2R)], [cy, sy] = [Math.cos(st.ry * D2R), Math.sin(st.ry * D2R)], [cz, sz] = [Math.cos(st.rz * D2R), Math.sin(st.rz * D2R)];
  const ox = (0.5 - st.u) * p.w - p.w / 2, oy = (0.5 - st.v) * p.h - p.h / 2;
  return (px, py) => {
    let x = (px + ox) * st.s, y = (py + oy) * st.s, z = 0, t;
    t = x * cz - y * sz; y = x * sz + y * cz; x = t;            // rotateZ
    t = x * cy + z * sy; z = -x * sy + z * cy; x = t;           // rotateY
    t = y * cx - z * sx; z = y * sx + z * cx; y = t;            // rotateX
    x += st.x; y += st.y; z += st.z; if (z > PERSP - 60) return null;
    const k = (PERSP / (PERSP - z)) * zoom; return [CX + x * k, CY + y * k];
  };
}
/** Draw the triangle (s0, s1, s2) of a picture (in its own px) onto the frame triangle (d0, d1, d2). */
function tri(img, s0, s1, s2, d0, d1, d2) {
  const minx = Math.min(d0[0], d1[0], d2[0]), maxx = Math.max(d0[0], d1[0], d2[0]), miny = Math.min(d0[1], d1[1], d2[1]), maxy = Math.max(d0[1], d1[1], d2[1]);
  if (maxx < 0 || minx > W || maxy < 0 || miny > H) return;
  const [x0, y0] = s0, [x1, y1] = s1, [x2, y2] = s2, [u0, v0] = d0, [u1, v1] = d1, [u2, v2] = d2;
  const den = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (!den) return;
  const a = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / den, c = ((u2 - u0) * (x1 - x0) - (u1 - u0) * (x2 - x0)) / den;
  const b = ((v1 - v0) * (y2 - y0) - (v2 - v0) * (y1 - y0)) / den, d = ((v2 - v0) * (x1 - x0) - (v1 - v0) * (x2 - x0)) / den;
  // the clip is grown by 0.7 px around its centre so neighbouring triangles overlap and leave no seams
  const mx = (u0 + u1 + u2) / 3, my = (v0 + v1 + v2) / 3, grow = (q) => { const dx = q[0] - mx, dy = q[1] - my, l = Math.hypot(dx, dy) || 1; return [q[0] + (dx / l) * 0.7, q[1] + (dy / l) * 0.7]; };
  const g0 = grow(d0), g1 = grow(d1), g2 = grow(d2);
  cv.save(); cv.beginPath(); cv.moveTo(g0[0], g0[1]); cv.lineTo(g1[0], g1[1]); cv.lineTo(g2[0], g2[1]); cv.closePath(); cv.clip();
  cv.setTransform(a, b, c, d, u0 - a * x0 - c * y0, v0 - b * x0 - d * y0);
  const sx0 = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 2), sy0 = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 2);
  const sx1 = Math.min(img.width, Math.ceil(Math.max(x0, x1, x2)) + 2), sy1 = Math.min(img.height, Math.ceil(Math.max(y0, y1, y2)) + 2);
  cv.drawImage(img, sx0, sy0, sx1 - sx0, sy1 - sy0, sx0, sy0, sx1 - sx0, sy1 - sy0);
  cv.restore();
}
/** One picture of a tile over the tile's area of the plane, through the projection, at alpha a. */
function drawTile(tl, img, proj, w, a) {
  if (!img || a <= 0.002) return; const nx = GX, ny = Math.max(4, Math.round((GY * tl.h) / 1000)), pts = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) pts.push(proj((i / nx) * w, tl.y0 + (j / ny) * tl.h));
  const cw = img.width / nx, ch = img.height / ny; cv.save(); cv.globalAlpha *= a;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const p00 = pts[j * (nx + 1) + i], p10 = pts[j * (nx + 1) + i + 1], p01 = pts[(j + 1) * (nx + 1) + i], p11 = pts[(j + 1) * (nx + 1) + i + 1];
    if (!p00 || !p10 || !p01 || !p11) continue;
    const s00 = [i * cw, j * ch], s10 = [(i + 1) * cw, j * ch], s01 = [i * cw, (j + 1) * ch], s11 = [(i + 1) * cw, (j + 1) * ch];
    tri(img, s00, s10, s01, p00, p10, p01); tri(img, s11, s01, s10, p11, p01, p10);
  }
  cv.restore();
}
/** A plane: its pictures (sharp, then the blurred and grey copies mixed over), darkened, a light sweep, rounded corners
 *  and a thin light edge. */
function drawPlane(p, punch) {
  const st = p.st, proj = projector(p, st, 1 + punch), r = 28, edge = [];
  // the rounded outline, projected
  [[p.w - r, r, -90], [p.w - r, p.h - r, 0], [r, p.h - r, 90], [r, r, 180]].forEach(([ccx, ccy, a0]) => { for (let k = 0; k <= 6; k++) { const a = (a0 + k * 15) * D2R; edge.push(proj(ccx + Math.cos(a) * r, ccy + Math.sin(a) * r)); } });
  if (edge.some((q) => !q)) return;
  const path = () => { cv.beginPath(); edge.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); };
  cv.save(); cv.globalAlpha = st.op; path(); cv.fillStyle = '#0B0B14'; cv.fill();
  cv.save(); path(); cv.clip();
  const bl = cl(st.blur / 12);
  p.tiles.forEach((tl) => { drawTile(tl, tl.img, proj, p.w, 1); drawTile(tl, tl.blur, proj, p.w, bl); if (st.sat < 0.999) drawTile(tl, tl.gray, proj, p.w, 1 - st.sat); });
  if (st.br < 0.999) { cv.fillStyle = `rgba(0,0,0,${(1 - st.br).toFixed(3)})`; cv.fillRect(0, 0, W, H); }
  const xs = edge.map((q) => q[0]), ys = edge.map((q) => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const gc = lerp(-0.45, 1.45, p.glare), gr = cv.createLinearGradient(x0, y0, x1, y1);
  [[gc - 0.12, 0], [gc, 0.1], [gc + 0.12, 0]].forEach(([o, a]) => o >= 0 && o <= 1 && gr.addColorStop(o, `rgba(255,255,255,${a})`)); cv.fillStyle = gr; cv.fillRect(x0, y0, x1 - x0, y1 - y0);
  cv.restore();
  path(); cv.strokeStyle = 'rgba(255,255,255,0.16)'; cv.lineWidth = 2; cv.stroke(); cv.restore();
}
const mix = (a, b, k) => { const o = {}; for (const n in BASE) o[n] = lerp(a[n], b[n], k); return o; };
const flipAt = (t) => Math.min(window.FLIP.length - 1, Math.max(0, Math.floor(((t + 0.1) / (T.guess - 0.1)) * window.FLIP.length)));

// shots: [key, t0, t1, from, to, { whip: direction into this shot, mod(t, state) }]
const SH = [];
const shot = (key, t0, t1, a, b, o = {}) => SH.push({ key, t0, t1, a: { ...BASE, ...a }, b: { ...BASE, ...a, ...b }, ...o });
shot('flip', -0.6, T.guess, { u: 0.4, v: 0.43, z: -80, rx: 10, ry: -26, s: 1.06, x: 30 }, { u: 0.47, v: 0.46, z: 250, rx: 6, ry: -15, x: -20 });
shot('clean', T.guess, T.we, { u: 0.36, v: 0.4, z: 300, rx: -6, ry: 18, s: 1.05, x: -40 }, { u: 0.45, v: 0.43, z: 430, rx: -3, ry: 10, x: 20 },
  { mod: (t, s) => { const f = io(k01(t, ws(10) - 0.06, 0.42)); s.blur = lerp(11, 0, f); s.br = lerp(0.62, 1, f); } });
shot('hero', T.we, T.three, { z: -420, s: 1.25, blur: 14, br: 0.38 }, { z: -330 });
shot('session', T.three, ws(18) - 0.06, { u: 0.5, v: 0.42, z: -60, rx: 14, ry: -10, s: 1.1 }, { v: 0.5, z: 200, rx: 9, ry: -5 });
shot('monte', ws(18) - 0.06, ws(20) - 0.06, { u: 0.56, v: 0.76, z: 260, rx: 8, ry: 16, s: 1.1 }, { u: 0.42, z: 340, rx: 6, ry: 11 }, { whip: -1 });
shot('an', ws(20) - 0.06, T.manual, { u: 0.5, v: 0.62, z: 100, rx: 12, ry: -16, s: 1.02 }, { u: 0.4, v: 0.57, z: 400, rx: 5, ry: -6 }, { whip: 1 });
shot('tools', T.manual, T.evals, { u: 0.3, v: 0.38, z: 330, rx: 6, ry: 20, s: 1.05 }, { u: 0.44, v: 0.42, z: 480, rx: 3, ry: 12 });
shot('an2', T.evals, T.prop, { u: 0.36, v: 0.73, z: 200, rx: -8, ry: -16, s: 1.05 }, { u: 0.45, v: 0.75, z: 430, rx: -4, ry: -8 });
shot('dash', T.prop, T.tools, { z: -520, s: 1.3, blur: 12, br: 0.28 }, { z: -430 });
shot('dash', T.tools, ws(48) - 0.06, { u: 0.45, v: 0.4, z: 60, rx: 12, ry: -18, s: 1.05 }, { u: 0.5, v: 0.45, z: 310, rx: 8, ry: -10 });
shot('tall', ws(48) - 0.06, ws(52) - 0.06, { u: 0.42, v: 0.1, z: -120, rx: 26, s: 1.0 }, { v: 0.5 }, { whip: -1, lin: true });
shot('jour', ws(52) - 0.06, T.one, { u: 0.5, v: 0.42, z: 150, rx: 8, ry: 14, s: 1.05 }, { u: 0.56, v: 0.5, z: 380, rx: 4, ry: 8 }, { whip: 1 });
shot('placed', T.not_, T.ready, { u: 0.62, v: 0.38, z: 260, rx: 6, ry: -14, s: 1.05 }, { u: 0.69, v: 0.4, z: 460, rx: 3, ry: -8 },
  { mod: (t, s) => { const f = io(k01(t, ws(64) - 0.05, 0.5)); s.sat = lerp(1, 0, f); s.br = lerp(1, 0.42, f); } });
shot('buy', T.ready, T.end, { u: 0.55, v: 0.53, z: 200, rx: -6, ry: 16, s: 1.05 }, { u: 0.61, v: 0.56, z: 470, rx: -3, ry: 8 });
shot('hero', T.end, DUR + 1, { z: -440, s: 1.25, blur: 14, br: 0.3 }, { z: -320 });
// one: four screens scattered in space converge into one stack on «یک‌پارچه»
const ONE = [['dash', { x: -250, y: -340, z: -280, rx: 10, ry: -22, rz: -4 }], ['jour', { x: 270, y: -120, z: -620, rx: 6, ry: 20, rz: 3 }],
  ['an', { x: -210, y: 190, z: -220, rx: -6, ry: -14, rz: 2 }], ['clean', { x: 250, y: 400, z: -460, rx: 8, ry: 24, rz: -3 }]];

// ---------- the overlays (the brand, the shield and its chips, the check) ----------
function overlays(t) {
  const brIn = pop(t - T.we + 0.02, 14, 0.6), brOut = 1 - cub(k01(t, T.three - 0.12, 0.16));
  cv.save(); cv.globalAlpha = cl(brIn * 3) * brOut; drawImg('icon', CX, 685, 250, 0.4 + 0.6 * brIn); cv.restore();
  cv.save(); cv.globalAlpha = brOut; drawImg('word', CX, 954, 660, 1, cub(k01(t, ws(14) - 0.12, 0.45))); cv.restore();
  const ei = pop(t - T.end - 0.02, 14, 0.6); cv.save(); cv.globalAlpha = cl(ei * 3); drawImg('icon', CX, 580, 220, 0.4 + 0.6 * ei); cv.restore();
  drawImg('word', CX, 846, 680, 1, cub(k01(t, T.end + 0.2, 0.5)));
  // the shield: a glass tile with the Lucide shield-check; three rule chips under it (words only, no screen)
  const sh = pop(t - T.prop - 0.04, 13, 0.55), shOut = 1 - cub(k01(t, T.tools - 0.12, 0.16));
  if (sh > 0 && shOut > 0) {
    cv.save(); cv.globalAlpha = cl(sh * 3) * shOut; cv.translate(CX, 635 + Math.sin((t - T.prop) * 2.2) * 8); cv.rotate(((1 - sh) * -12 * Math.PI) / 180); cv.scale(0.5 + 0.5 * sh, 0.5 + 0.5 * sh);
    glow(0, 40, 300, 'rgba(108,71,255,0.5)'); rr(-165, -165, 330, 330, 86); cv.fillStyle = 'rgba(30,22,60,0.55)'; cv.fill();
    const g = cv.createLinearGradient(-165, -165, 165, 165); g.addColorStop(0, 'rgba(255,255,255,0.17)'); g.addColorStop(1, 'rgba(255,255,255,0.04)');
    rr(-165, -165, 330, 330, 86); cv.fillStyle = g; cv.fill(); cv.strokeStyle = 'rgba(255,255,255,0.28)'; cv.lineWidth = 2; cv.stroke();
    strokeIcon('shield-check', 0, 0, 200, '#FFFFFF', 1.4); cv.restore();
  }
  const chips = ['حد ضرر روزانه', 'حداکثر افت', 'هدف سود'], cw = chips.map((c) => measure(c, 40, 700) + 60), tot = cw.reduce((a, b) => a + b, 0) + 16 * (chips.length - 1);
  let xr = CX + tot / 2;
  chips.forEach((c, i) => {
    const k = cub(k01(t, ws(39) + 0.05 + i * 0.22, 0.3)) * shOut, x = xr - cw[i]; xr = x - 16; if (k <= 0) return;
    cv.save(); cv.globalAlpha = k; cv.translate(0, (1 - k) * 30); rr(x, 900, cw[i], 84, 42); cv.fillStyle = 'rgba(255,255,255,0.08)'; cv.fill(); cv.strokeStyle = 'rgba(255,255,255,0.24)'; cv.lineWidth = 1.5; cv.stroke();
    cv.font = FONT(40, 700); cv.fillStyle = '#FFFFFF'; cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.direction = 'rtl'; cv.fillText(c, x + cw[i] / 2, 942); cv.restore();
  });
  // the check on «آماده»
  const ck = pop(t - ws(72) + 0.04, 15, 0.5), ckOut = 1 - cub(k01(t, T.end - 0.12, 0.16));
  if (ck > 0 && ckOut > 0) {
    cv.save(); cv.globalAlpha = cl(ck * 3) * ckOut; cv.translate(840, 430); cv.scale(0.3 + 0.7 * ck, 0.3 + 0.7 * ck);
    glow(0, 30, 220, 'rgba(74,222,128,0.45)'); cv.beginPath(); cv.arc(0, 0, 95, 0, Math.PI * 2); cv.fillStyle = GRN; cv.fill();
    strokeIcon('check', 0, 0, 120, '#06060C', 3.2); cv.restore();
  }
}

// ---------- the subtitles ----------
// a group: { at, lines: [[size 'bg' | 'md' | 'sm', [[text, word index or time, { c, strike, ul }], …]], …] }
const G = [];
const grp = (at, lines) => G.push({ at, lines });
const wt = (i) => (Number.isInteger(i) && i >= 0 ? ws(i) - 0.05 : i);   // a word index, or a time
grp(-1, [['bg', [['ترید', -1], ['حرفه‌ای', -1, { c: VIO }]]], ['sm', [['از', 2], ['جایی', 3], ['شروع', 4], ['می‌شود', 5]]]]);
grp(T.guess - 0.05, [['sm', [['که', 7]]], ['bg', [['حدس', 8, { strike: ws(10) }], ['زدن', 9, { strike: ws(10) + 0.08 }]]], ['md', [['تمام', 10], ['می‌شود.', 11]]]]);
grp(T.we - 0.05, [['sm', [['ما', 13]]], ['bg', [['بستری', 14], ['جامع', 15, { c: VIO }]]]]);
grp(T.three - 0.05, [['sm', [['برای', 16]]], ['bg', [['آزمایش،', 17, { c: VIO }]]]]);
grp(ws(18) - 0.06, [['sm', [['برای', ws(18) - 0.06]]], ['bg', [['شبیه‌سازی', 18, { c: VIO }]]]]);
grp(ws(19) - 0.06, [['sm', [['برای', ws(19) - 0.06]]], ['bg', [['و', 19], ['تحلیل', 20, { c: VIO }]]]]);
grp(ws(21) - 0.06, [['bg', [['استراتژی‌های', 21], ['معاملاتی', 23]]], ['sm', [['فراهم', 24], ['کرده‌ایم.', 25]]]]);
grp(T.manual - 0.05, [['sm', [['از', 27], ['بک‌تستِ', 28]]], ['bg', [['دستی', 29], ['و', 30], ['خودکار', 31, { c: VIO }]]]]);
grp(T.evals - 0.05, [['sm', [['تا', 32]]], ['bg', [['ارزیابیِ', 33, { c: VIO }]]], ['sm', [['سیستم‌های', 34], ['معاملاتی', 36]]]]);
grp(T.prop - 0.05, [['sm', [['و', 37], ['شبیه‌سازیِ', 38]]], ['bg', [['قوانین', 39], ['پراپ‌فرم‌ها', 40, { c: VIO }]]]]);
grp(T.tools - 0.05, [['bg', [['تمامِ', 43], ['ابزارهای', 44]]], ['sm', [['موردِ', 45], ['نیاز', 46]]]]);
grp(ws(47) - 0.06, [['sm', [['برای', 47]]], ['bg', [['سنجشِ', 48, { c: VIO }], ['عملکرد', 49]]]]);
grp(ws(51) - 0.06, [['sm', [['و', 51]]], ['bg', [['تصمیم‌گیریِ', 52], ['آگاهانه', 53, { c: VIO }]]]]);
grp(T.one - 0.05, [['sm', [['در', 54], ['یک', 55], ['محیطِ', 56], ['حرفه‌ای', 57]]], ['bg', [['و', 58], ['یک‌پارچه.', 59, { c: VIO }]]]]);
grp(T.not_ - 0.05, [['sm', [['اینجا', 61]]], ['bg', [['قرار', 62], ['نیست', 63]]], ['md', [['صرفاً', 64, { c: RED, ul: ws(64) + 0.1 }], ['معامله', 65], ['کنید.', 66]]]]);
grp(T.ready - 0.05, [['sm', [['قرار', 67], ['است', 68]]], ['md', [['پیش', 69], ['از', 70], ['معامله،', 71]]], ['bg', [['آماده', 72, { c: GRN }], ['شوید.', 73]]]]);
grp(T.end + 0.5, [['bg', [['شروعش', T.end + 0.55], ['رایگانه', T.end + 0.7]]], ['sm', [['لینک', T.end + 1.0, { c: VIO }], ['توی', T.end + 1.05, { c: VIO }], ['بیو', T.end + 1.1, { c: VIO }]]]]);
// laid out once the fonts are in: each word's place on its line, set from the right edge (x 1000), lines from y 1196
const SZ = { bg: [116, 900, '#FFFFFF'], md: [84, 800, '#FFFFFF'], sm: [50, 500, 'rgba(255,255,255,0.74)'] };
function subtitles() {
  G.forEach((g, gi) => {
    g.t1 = gi + 1 < G.length ? G[gi + 1].at : 1e9; g.words = []; let y = 1170 + 8 + 18;
    g.lines.forEach(([size, toks]) => {
      let [sz, fw, col] = SZ[size]; let wd = toks.map(([s]) => measure(s, sz, fw)), gap = measure(' ', sz, fw), tot = wd.reduce((a, b) => a + b, 0) + gap * (toks.length - 1);
      if (tot > 920) { const f = 920 / tot; sz *= f; wd = wd.map((w) => w * f); gap *= f; }
      const lh = sz * 1.32, cy = y + lh / 2; let xr = 1000;
      toks.forEach(([s, i, o = {}], j) => { g.words.push({ s, at: wt(i), xr, w: wd[j], y: cy, sz, fw, col: o.c || col, sa: o.strike, ua: o.ul }); xr -= wd[j] + gap; });
      y += lh;
    });
  });
}
function drawSubs(t, o) {
  G.forEach((g) => {
    if (t < g.at - 0.05 || t > g.t1 + 0.25) return; const e = o.cover ? 0 : cub(k01(t, g.t1 - 0.1, 0.2)); if (e >= 1) return;
    cv.save(); cv.globalAlpha = 1 - e; cv.translate(0, -26 * e);
    const b = cub(k01(t, g.at, 0.45)); if (b > 0) { rr(1000 - 110 * b, 1170, 110 * b, 8, 4); cv.fillStyle = VIO; cv.fill(); }
    g.words.forEach((w) => {
      const k = o.cover ? 1 : cub(k01(t, w.at, 0.32)); if (k <= 0) return;
      cv.save(); cv.globalAlpha *= k; cv.translate(0, (1 - k) * 34);
      cv.font = FONT(w.sz, w.fw); cv.fillStyle = w.col; cv.textAlign = 'right'; cv.textBaseline = 'middle'; cv.direction = 'rtl'; cv.fillText(w.s, w.xr, w.y);
      if (w.sa) { const q = io(k01(t, w.sa, 0.22)), ext = w.w * 1.1; if (q > 0) { rr(w.xr + w.w * 0.05 - ext * q, w.y - 4, ext * q, 16, 8); cv.fillStyle = RED; cv.fill(); } }
      if (w.ua) { const q = io(k01(t, w.ua, 0.3)); if (q > 0) { rr(w.xr - w.w * q, w.y + w.sz * 0.66 - 14, w.w * q, 10, 5); cv.fillStyle = RED; cv.fill(); } }
      cv.restore();
    });
    cv.restore();
  });
}

// ---------- grain ----------
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d', { willReadFrequently: true }), d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = rnd(i * 0.37) * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
let GRAINP = null;

// ---------- a frame ----------
const FLASH = [[T.we, 0.55], [ws(10), 0.3], [ws(59), 0.5], [ws(72), 0.5], [T.end, 0.4]];
const PUNCH = [ws(10), ws(59), ws(72)];
function frame(t, o = {}) {
  Object.values(P).forEach((p) => { p.used = false; p.order = 0; });
  // the shots on screen now (a whip-pan overlaps the outgoing and the incoming shot)
  SH.forEach((sh, i) => {
    const nx = SH[i + 1], out = nx && nx.whip && Math.abs(nx.t0 - sh.t1) < 0.01 ? nx.whip : 0;
    if (t < sh.t0 - (sh.whip ? 0 : 0) || t >= sh.t1 + (out ? 0.0 : 0)) return;
    const k = (t - sh.t0) / (sh.t1 - sh.t0), st = mix(sh.a, sh.b, sh.lin ? cl(k) : sine(k));
    if (sh.mod) sh.mod(t, st);
    if (sh.whip) { const w = 1 - cub(k01(t, sh.t0, 0.24)); st.x += sh.whip * 900 * w; st.blur += 10 * w; }
    if (out) { const w = io(k01(t, sh.t1 - 0.14, 0.14)); st.x -= out * 900 * w; st.blur += 10 * w; }
    const p = plane(sh.key); place(p, st, k); p.used = true;
  });
  if (t >= T.one && t < T.not_) {
    const c = io(k01(t, ws(59) - 0.18, 0.45)), drift = t - T.one;
    ONE.forEach(([key, a], i) => {
      const loose = { ...BASE, ...a, s: 0.56, x: a.x + Math.sin(drift * 0.9 + i) * 14, y: a.y + Math.cos(drift * 0.8 + i * 2) * 12, ry: a.ry + drift * 2 * (i % 2 ? -1 : 1) };
      const tight = { ...BASE, s: 0.6, x: -i * 4, y: 60 - i * 22, z: -i * 40, rx: 8, ry: -8 + i * 0.0, rz: 0 };
      const st = mix(loose, tight, c); st.br = lerp(0.85, i === 0 ? 1 : 0.7, c);
      const p = plane(key); p.order = 10 - i; place(p, st, cl(drift / 2.7)); p.used = true;
    });
  }
  // the background and its violet glow, then the screens (back to front) with a camera punch on the beats
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.fillStyle = '#06060C'; cv.fillRect(0, 0, W, H);
  cv.save(); cv.translate(CX, 770); cv.scale(1, 650 / 800); const bg = cv.createRadialGradient(0, 0, 0, 0, 0, 800); bg.addColorStop(0, 'rgba(108,71,255,0.36)'); bg.addColorStop(1, 'rgba(108,71,255,0)'); cv.fillStyle = bg; cv.fillRect(-800, -800, 1600, 1600); cv.restore();
  const punch = PUNCH.reduce((z, a) => z + (t >= a ? 0.035 * Math.exp(-(t - a) * 7) : 0), 0);
  Object.values(P).filter((p) => p.used).sort((a, b) => a.order - b.order).forEach((p) => drawPlane(p, punch));
  // on top: overlays, the fade under the subtitles, the subtitles, flashes, vignette, grain
  overlays(t);
  const cf = cv.createLinearGradient(0, 960, 0, H); cf.addColorStop(0, 'rgba(6,6,12,0)'); cf.addColorStop(0.3, 'rgba(6,6,12,0.88)'); cf.addColorStop(1, 'rgba(6,6,12,0.96)'); cv.fillStyle = cf; cv.fillRect(0, 960, W, H - 960);
  drawSubs(t, o);
  const fl = cl(FLASH.reduce((z, [a, s]) => z + (t >= a - 0.05 ? s * (t < a ? (t - a + 0.05) / 0.05 : Math.exp(-(t - a) * 7)) : 0), 0));
  if (fl > 0.002) { const g = cv.createRadialGradient(CX, 768, 0, CX, 768, 1272); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.45, 'rgba(164,141,255,0.5)'); g.addColorStop(0.8, 'rgba(108,71,255,0)'); cv.save(); cv.globalAlpha = fl; cv.fillStyle = g; cv.fillRect(0, 0, W, H); cv.restore(); }
  cv.save(); cv.translate(CX, 768); cv.scale(842 / 1190, 1); const vg = cv.createRadialGradient(0, 0, 0, 0, 0, 1190); vg.addColorStop(0.58, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)'); cv.fillStyle = vg; cv.fillRect(-1600, -1000, 3200, 2200); cv.restore();
  const f = Math.round(t * 30); GRAINP ??= cv.createPattern(GRAIN, 'repeat');
  cv.save(); cv.globalAlpha = 0.05; cv.translate((rnd(f) * 256) | 0, (rnd(f + 0.5) * 256) | 0); cv.fillStyle = GRAINP; cv.fillRect(-256, -256, W + 512, H + 512); cv.restore();
}

window.DURATION = DUR;
// Only the screens on screen now are loaded (with a small blurred copy for the focus pulls and a grey one for «صرفاً»);
// the others are let go at once, so the memory stays small.
function keysAt(t, m) { const ks = new Set(); SH.forEach((sh) => { if (t >= sh.t0 - m && t < sh.t1 + m) ks.add(sh.key); }); if (t >= T.one - m && t < T.not_ + m) ONE.forEach(([k]) => ks.add(k)); return ks; }
const PIC = new Map();
// helper canvases stay on the CPU too (a GPU canvas drawn into a CPU one is read back every frame), and use no canvas
// filters: the blurred copy is the picture shrunk to 1/16 and grown back to 1/4
const cpu = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })]; };
function blurred(im) {
  const [a, ga] = cpu(Math.round(im.width / 16), Math.round(im.height / 16)); ga.imageSmoothingQuality = 'high'; ga.drawImage(im, 0, 0, a.width, a.height);
  const [b, gb] = cpu(Math.round(im.width / 4), Math.round(im.height / 4)); gb.imageSmoothingQuality = 'high'; gb.drawImage(a, 0, 0, b.width, b.height); return b;
}
function greyed(im) {   // the 'saturation' blend with a grey takes all colour out (pixels from a file can't be read back)
  const [c, g] = cpu(im.width, im.height); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height); return c;
}
async function picture(src, gray) {
  let x = PIC.get(src);
  if (!x) { const im = new Image(); im.src = src; await im.decode().catch(() => console.error('missing image: ' + src.slice(-40))); x = { im, blur: blurred(im), gray: null }; PIC.set(src, x); }
  if (gray && !x.gray) x.gray = greyed(x.im);
  return x;
}
async function load(t) {
  const now = keysAt(t, 0.02), jobs = [];
  now.forEach((k) => plane(k).tiles.forEach((tl) => { const want = k === 'flip' ? window.FLIP[flipAt(t)] : tl.src; jobs.push(picture(want, k === 'placed').then((x) => { tl.cur = want; tl.img = x.im; tl.blur = x.blur; tl.gray = x.gray; })); }));
  await Promise.all(jobs);
  const used = new Set(); Object.entries(P).forEach(([k, p]) => p.tiles.forEach((tl) => { if (now.has(k) && tl.cur) used.add(tl.cur); else { tl.cur = tl.img = tl.blur = tl.gray = null; } }));
  [...PIC.keys()].forEach((src) => { if (!used.has(src)) PIC.delete(src); });
}
// after drawing, wait for the next animation frame so the screenshot never catches the canvas before it's shown
window.seek = async (t) => { await load(t); frame(t); await new Promise((ok) => requestAnimationFrame(() => ok())); };
/** The cover: the opening replay with the hook subtitle written out. */
window.cover = async () => { await load(2.3); frame(2.3, { cover: true }); await new Promise((ok) => requestAnimationFrame(() => ok())); };
(async () => {
  await Promise.all(['500', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  subtitles();
  await window.seek(0); window.ready = true;
})();
