// k15 · «سود می‌کنی چون استراتژی داری، یا چون هنوز شانست تموم نشده؟», the neon cut of k13's voice: one night room, a
// brick wall of neon signs over a casino table. Each spoken word is a neon tube that buzzes on when it is said (the
// whole line hangs there unlit first, so the hook is readable on the first frame). Luck is the casino: a pink «شانس»
// sign, dice, chips, a shell game; strategy is a steady cyan sign.
//   - the hook: the whole question as one sign; a stack of profit chips, then dice roll onto the felt;
//   - «یه شکلن»: two identical stacks under «شانس» and «استراتژی», then cups drop over them and shuffle;
//   - «هر دو سبزن»: the cups lift, the room goes green;
//   - ten winning chips dealt, a pink «؟»;
//   - the first 10 trades of both as neon tubes, tangled; two stacks of the same height;
//   - a mechanical counter rolling 10 → 200 while 200 chips stack up;
//   - 200 trades: luck's tube sputters and dies on «کم میاره», strategy's stays lit;
//   - the live market: a clock spinning, calendar pages torn off, chips turned to cash;
//   - the real gold replay on a monitor on the table, a planned sell, the trade to its target, the balance ringed, the
//     real chips under a glass dome;
//   - strategy's curve and a neon check; luck's 10 trades with a «الان» pin and the unlit tube of what comes after;
//   - «تموم شد»: luck's sign dies and the room blacks out, only the words left in red;
//   - the BacktestLab sign switches the lights back on.
// The simulation (a sample, said on screen) and the real gold replay are k13's (see ../k13/caption.md).
// 1080×1920, every frame a pure function of t (window.seek). Key content inside y 230–1500.
const W = 1080, H = 1920, CX = 540, WALLH = 1220;
const WARM = '#FFE6C4', CYAN = '#3DEBFF', PINK = '#FF3D96', LIME = '#C6F24E', VIO = '#9A7DFF', GRN = '#3BF59B', RED = '#FF4A5C';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- drawing ----------
const FONT = (s, w = 800) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 800); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 800) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function ell(x, y, rx, ry, fill) { cv.beginPath(); cv.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, k) => { const p = hx(a), q = hx(b); return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
function shadowed(fn, blur = 40, dy = 14, a = 0.45) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 10); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
const note = (s, x, y, a = 0.72) => txt(s, x, y, 28, WARM, { w: 700, alpha: a });

// ---------- the room: a brick wall, a casino table, haze (drawn once) ----------
let WALL, TABLE, HAZE;
function buildRoom() {
  WALL = mkC(W, WALLH); let g = WALL.getContext('2d');
  g.fillStyle = '#060509'; g.fillRect(0, 0, W, WALLH);
  const bh = 62, bw = 176, m = 6;
  for (let r = 0; r * bh < WALLH; r++) { const off = (r % 2) * bw / 2;
    for (let x = -bw + off, j = 0; x < W; x += bw, j++) { const s = rnd(r * 91 + j * 13 + 7), base = 20 + s * 13;
      const gg = g.createLinearGradient(0, r * bh, 0, r * bh + bh); gg.addColorStop(0, `rgb(${Math.round(base + 7)},${Math.round(base * 0.8 + 3)},${Math.round(base + 13)})`); gg.addColorStop(1, `rgb(${Math.round(base - 5)},${Math.round(base * 0.74 - 3)},${Math.round(base + 1)})`);
      g.fillStyle = gg; g.beginPath(); g.roundRect(x + m / 2, r * bh + m / 2, bw - m, bh - m, 5); g.fill();
      for (let k = 0; k < 7; k++) { const sx = x + m + rnd(r * 7 + j * 3 + k * 17) * (bw - 2 * m), sy = r * bh + m + rnd(r * 5 + j * 11 + k * 29) * (bh - 2 * m); g.fillStyle = `rgba(255,255,255,${0.012 + 0.022 * rnd(k + r * 3 + j)})`; g.fillRect(sx, sy, 3, 2); }
    } }
  let v = g.createLinearGradient(0, 0, 0, WALLH); v.addColorStop(0, 'rgba(0,0,0,0.6)'); v.addColorStop(0.3, 'rgba(0,0,0,0.28)'); v.addColorStop(0.75, 'rgba(0,0,0,0.34)'); v.addColorStop(1, 'rgba(0,0,0,0.8)'); g.fillStyle = v; g.fillRect(0, 0, W, WALLH);
  v = g.createRadialGradient(CX, 640, 220, CX, 640, 950); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = v; g.fillRect(0, 0, W, WALLH);

  const TH = H - WALLH + 30; TABLE = mkC(W, TH); g = TABLE.getContext('2d');
  v = g.createLinearGradient(0, 0, 0, 58); v.addColorStop(0, '#2E1A22'); v.addColorStop(0.5, '#1A0F14'); v.addColorStop(1, '#0B0609'); g.fillStyle = v; g.fillRect(0, 0, W, 58);
  g.fillStyle = 'rgba(255,214,190,0.16)'; g.fillRect(0, 3, W, 3); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 56, W, 4);
  g.fillStyle = '#082A1F'; g.fillRect(0, 60, W, TH - 60);
  v = g.createRadialGradient(CX, 120, 40, CX, 160, 760); v.addColorStop(0, 'rgba(32,120,86,0.55)'); v.addColorStop(1, 'rgba(32,120,86,0)'); g.fillStyle = v; g.fillRect(0, 60, W, TH - 60);
  for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(255,255,255,${0.012 + 0.02 * rnd(k * 3.3)})`; g.fillRect(rnd(k * 1.7) * W, 60 + rnd(k * 2.9) * (TH - 60), 2, 2); }
  g.strokeStyle = 'rgba(255,205,120,0.18)'; g.lineWidth = 4; g.beginPath(); g.ellipse(CX, 430, 620, 190, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  v = g.createLinearGradient(0, 60, 0, TH); v.addColorStop(0, 'rgba(0,0,0,0.15)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); g.fillStyle = v; g.fillRect(0, 60, W, TH - 60);
  v = g.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(0,0,0,0.5)'); v.addColorStop(0.2, 'rgba(0,0,0,0)'); v.addColorStop(0.8, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = v; g.fillRect(0, 60, W, TH - 60);

  HAZE = mkC(W + 200, WALLH); g = HAZE.getContext('2d');
  for (let k = 0; k < 16; k++) { const x = rnd(k * 5.1) * (W + 200), y = 150 + rnd(k * 7.7) * (WALLH - 200), r = 160 + rnd(k * 3.3) * 280;
    v = g.createRadialGradient(x, y, 0, x, y, r); v.addColorStop(0, `rgba(255,255,255,${0.035 + 0.03 * rnd(k)})`); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
}

// ---------- light ----------
function pool(x, y, r, col, a) { if (a <= 0.003) return; const g = cv.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.45, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
  cv.save(); cv.globalCompositeOperation = 'lighter'; cv.fillStyle = g; cv.fillRect(x - r, y - r, 2 * r, 2 * r); cv.restore(); }
/** A neon tube switching on: a few fast flickers (not on every word), a small overshoot, then steady. */
function ignite(dt, seed) {
  if (dt < 0) return 0;
  if (rnd(seed * 3.7) < 0.4) { if (dt < 0.035) return dt / 0.035; }
  else { for (const [e, v] of [[0.03, 0.95], [0.055, 0.1], [0.09, 1], [0.115, 0.3]]) if (dt < e) return v; }
  return 1 + 0.22 * Math.exp(-Math.max(0, dt - 0.11) * 9);
}
const hum = (t, seed) => 0.94 + 0.06 * Math.sin(t * 61 + seed * 3.1) * Math.sin(t * 9.7 + seed);
/** A tube dying: on/off stutters that get rarer over d seconds, then off. */
function sputter(t, t0, d = 0.7, seed = 3) { const dt = t - t0; if (dt < 0) return 1; if (dt > d) return 0; const f = Math.floor(dt * 36); return rnd(f + seed * 100) > (dt / d) * 1.15 ? 0.35 + 0.65 * rnd(f * 7 + seed) : 0.03; }

// ---------- neon words: each one drawn once as a lit tube (glow) and an unlit tube ----------
const NC = {};
function neonImg(s, size, col, o = {}) {
  const key = `${s}|${size}|${col}|${o.box ? 1 : 0}`; if (NC[key]) return NC[key];
  const tw = measure(s, size), pad = Math.round(size * 0.7 + (o.box ? size * 0.35 : 0)), w = Math.ceil(tw + 2 * pad), h = Math.ceil(size * 1.45 + 2 * pad);
  const on = mkC(w, h), off = mkC(w, h), a = on.getContext('2d'), b = off.getContext('2d'), cx = w / 2, cy = h / 2 + size * 0.04;
  const bw = tw + size * 0.62, bh = size * 1.3, blw = Math.max(4, size * 0.05);
  const setup = (g) => { g.font = FONT(size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = isL(s) ? 'ltr' : 'rtl'; g.lineJoin = 'round'; };
  const box = (g, lw) => { if (!o.box) return; g.lineWidth = lw; g.beginPath(); g.roundRect(cx - bw / 2, cy - bh / 2 - size * 0.05, bw, bh, bh * 0.26); g.stroke(); };
  setup(a); a.shadowColor = col;
  a.fillStyle = a.strokeStyle = col; a.globalAlpha = 0.85; a.shadowBlur = size * 0.6; a.fillText(s, cx, cy); a.fillText(s, cx, cy); box(a, blw); box(a, blw);
  a.globalAlpha = 1; a.shadowBlur = size * 0.18; a.fillStyle = a.strokeStyle = mix(col, '#FFFFFF', 0.35); a.fillText(s, cx, cy); box(a, blw);
  a.shadowBlur = 0; a.fillStyle = a.strokeStyle = mix(col, '#FFFFFF', 0.8); a.fillText(s, cx, cy); box(a, blw * 0.45);
  setup(b); b.fillStyle = mix(col, '#120E18', 0.72); b.strokeStyle = rgba(col, 0.42); b.lineWidth = Math.max(1.5, size * 0.012); b.fillText(s, cx, cy); b.strokeText(s, cx, cy);
  b.strokeStyle = mix(col, '#120E18', 0.6); box(b, blw);
  return (NC[key] = { on, off, w, h, tw: tw + (o.box ? size * 0.62 : 0) });
}
function drawNeon(n, x, y, b, sc = 1, offA = 1) {
  const w = n.w * sc, h = n.h * sc;
  if (offA > 0.003) { cv.save(); cv.globalAlpha *= offA; cv.drawImage(n.off, x - w / 2, y - h / 2, w, h); cv.restore(); }
  if (b > 0.004) { cv.save(); cv.globalCompositeOperation = 'lighter'; const a0 = cv.globalAlpha; cv.globalAlpha = a0 * cl(b); cv.drawImage(n.on, x - w / 2, y - h / 2, w, h);
    if (b > 1) { cv.globalAlpha = a0 * cl(b - 1); cv.drawImage(n.on, x - w / 2, y - h / 2, w, h); } cv.restore(); }
}
/** A small neon sign, lit from t0. */
function sign(s, x, y, size, col, t, t0, o = {}) { const b = o.b ?? ignite(t - t0, Math.round(t0 * 100)) * hum(t, t0 * 7); const n = neonImg(s, size, col, { box: o.box }); if (b > 0.004 && !o.nopool) pool(x, y, Math.max(140, n.tw * 0.8), col, 0.1 * cl(b)); drawNeon(n, x, y, Math.max(b, o.idle ?? 0), o.sc ?? 1, o.offA ?? cl((t - t0 + 0.25) / 0.12)); }

/** A neon tube along a polyline. */
function tube(pts, col, b, lw = 9, offA = 1) {
  if (pts.length < 2) return;
  const path = () => { cv.beginPath(); cv.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) cv.lineTo(pts[i][0], pts[i][1]); };
  cv.save(); cv.lineCap = 'round'; cv.lineJoin = 'round';
  if (offA > 0) { path(); cv.strokeStyle = rgba(mix(col, '#1A1424', 0.6), 0.95 * offA); cv.lineWidth = lw; cv.stroke(); }
  if (b > 0.01) { cv.globalCompositeOperation = 'lighter'; const bb = cl(b, 0, 1.4);
    [[lw * 4.6, 0.07], [lw * 2.4, 0.22], [lw * 1.15, 0.75]].forEach(([w, a]) => { path(); cv.strokeStyle = rgba(col, Math.min(1, a * bb)); cv.lineWidth = w; cv.stroke(); });
    path(); cv.strokeStyle = rgba(mix(col, '#FFFFFF', 0.78), Math.min(1, bb)); cv.lineWidth = lw * 0.45; cv.stroke(); }
  cv.restore();
}
function partial(pts, k) { if (k >= 1) return pts; const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L; const out = [pts[0]];
  for (let i = 0; i < seg.length; i++) { if (left >= seg[i]) { out.push(pts[i + 1]); left -= seg[i]; } else { const f = left / seg[i]; out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); break; } } return out; }
const arrowPts = (x, y, s, dir = -1) => [[x - s * 0.55, y + dir * -s * 0.1], [x, y + dir * s * 0.5], [x + s * 0.55, y + dir * -s * 0.1], null, [x, y + dir * s * 0.5], [x, y - dir * s * 0.75]];
function arrow(x, y, s, col, b, dir = -1, lw = 12) { const p = arrowPts(x, y, s, dir); tube(p.slice(0, 3), col, b, lw); tube(p.slice(4), col, b, lw); }
function sparks(t, t0, x, y, n = 22, seed = 1) { const dt = t - t0; if (dt < 0 || dt > 1) return; cv.save(); cv.globalCompositeOperation = 'lighter'; cv.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = rnd(seed * 31 + i) * Math.PI * 2, v = 240 + rnd(seed * 7 + i) * 520, life = 1 - dt / (0.35 + 0.5 * rnd(i + seed * 3)); if (life <= 0) continue;
    const px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt + 1100 * dt * dt, vx = Math.cos(a) * v, vy = Math.sin(a) * v + 2200 * dt;
    cv.strokeStyle = rgba('#FFE7A0', life); cv.lineWidth = 4; cv.beginPath(); cv.moveTo(px, py); cv.lineTo(px - vx * 0.025, py - vy * 0.025); cv.stroke(); }
  cv.restore(); }

// ---------- props ----------
const CHIPS = {};
function chipImg(col, ph = 0) {
  const ck = col + ph; if (CHIPS[ck]) return CHIPS[ck];
  const c = mkC(150, 74), g = c.getContext('2d'), cx = 75, rx = 64, ry = 21, ty = 24, th = 13;
  g.fillStyle = mix(col, '#000000', 0.5); g.beginPath(); g.ellipse(cx, ty + th, rx, ry, 0, 0, Math.PI); g.lineTo(cx - rx, ty); g.lineTo(cx + rx, ty); g.closePath(); g.fill();
  for (let k = 0; k < 6; k++) { const a = ((k + 0.25 + ph * 0.5) / 6) * Math.PI, x = cx + rx * Math.cos(a), w = 9 * Math.sin(a) + 2; g.fillStyle = 'rgba(255,255,255,0.88)'; g.fillRect(x - w / 2, ty + ry * Math.sin(a) + 3, w, th - 5); }
  g.fillStyle = col; g.beginPath(); g.ellipse(cx, ty, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.setLineDash([11, 8]); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, ty, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  g.fillStyle = mix(col, '#FFFFFF', 0.2); g.beginPath(); g.ellipse(cx, ty, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(cx - 8, ty - 5, rx * 0.8, ry * 0.45, 0, 0, Math.PI * 2); g.fill();
  return (CHIPS[ck] = c);
}
const C_GRN = '#18B070', C_PINK = '#D9306E', C_CYAN = '#1C97D6', C_VIO = '#7B5BF2', C_GOLD = '#D9A23A';
/** A stack of n chips standing on base y; returns the y of its top. */
function stack(x, base, n, col, sc = 1, a = 1) {
  sc *= 1.28; const ims = [chipImg(col, 0), chipImg(col, 1)]; n = Math.max(0, Math.round(n)); if (a <= 0) return base; cv.save(); cv.globalAlpha *= a;
  cv.fillStyle = 'rgba(0,0,0,0.5)'; cv.beginPath(); cv.ellipse(x + 6 * sc, base + 4 * sc, 76 * sc, 22 * sc, 0, 0, Math.PI * 2); cv.fill();
  for (let i = 0; i < n; i++) { const ty = base - 34 * sc - i * 13 * sc; cv.drawImage(ims[i % 2], x - 75 * sc, ty - 24 * sc, 150 * sc, 74 * sc); }
  cv.restore(); return base - (34 + 13 * Math.max(0, n - 1)) * sc - 21 * sc;
}
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function die(x, y, s, n, rot = 0, a = 1) { s *= 1.15; at(x, y, 1, a, () => {
  ell(6, s * 0.62, s * 0.66, s * 0.17, 'rgba(0,0,0,0.5)');
  cv.rotate(rot); rrect(-s / 2, -s / 2 + s * 0.12, s, s, s * 0.22, '#A9A2B8'); rrect(-s / 2, -s / 2, s, s, s * 0.22, '#F7F4FB');
  const g = cv.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(1, 'rgba(60,40,90,0.18)'); rrect(-s / 2, -s / 2, s, s, s * 0.22, g);
  PIPS[n].forEach(([p, q]) => circle(p * s * 0.27, q * s * 0.27, s * 0.088, '#1A1424')); }); }
function cup(x, y, h = 230) {
  const bw = 176, tw = 120;
  ell(x + 8, y + 6, bw * 0.56, 26, 'rgba(0,0,0,0.55)');
  const g = cv.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0); g.addColorStop(0, '#4C0A1C'); g.addColorStop(0.3, '#B92B4B'); g.addColorStop(0.5, '#E2566F'); g.addColorStop(0.7, '#A82442'); g.addColorStop(1, '#3E0816');
  cv.fillStyle = g; cv.beginPath(); cv.moveTo(x - bw / 2, y); cv.lineTo(x - tw / 2, y - h); cv.ellipse(x, y - h, tw / 2, 17, 0, Math.PI, 0); cv.lineTo(x + bw / 2, y); cv.ellipse(x, y, bw / 2, 24, 0, 0, Math.PI); cv.fill();
  ell(x, y - h, tw / 2, 17, '#E46A82'); ell(x, y - h, tw / 2 - 10, 11, '#C8405C');
  cv.save(); cv.strokeStyle = '#E8B85A'; cv.lineWidth = 6; cv.beginPath(); cv.ellipse(x, y - 34, bw / 2 - 8, 21, 0, 0.05, Math.PI - 0.05); cv.stroke(); cv.restore();
}
function cloche(x, base, r = 120, a = 1) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a;
  cv.beginPath(); cv.ellipse(x, base, r, r * 0.3, 0, 0, Math.PI); cv.lineTo(x - r, base); cv.ellipse(x, base - r * 1.25, r, r * 1.25, 0, Math.PI, 0); cv.closePath();
  cv.fillStyle = 'rgba(200,225,255,0.07)'; cv.fill(); cv.strokeStyle = 'rgba(220,235,255,0.45)'; cv.lineWidth = 3; cv.stroke();
  cv.strokeStyle = 'rgba(255,255,255,0.5)'; cv.lineWidth = 6; cv.lineCap = 'round'; cv.beginPath(); cv.ellipse(x, base - r * 1.25, r * 0.8, r * 1.05, 0, Math.PI * 1.15, Math.PI * 1.4); cv.stroke();
  circle(x, base - r * 2.55, 14, 'rgba(220,235,255,0.5)'); cv.restore(); }
function bills(x, y, a = 1, n = 4) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a;
  for (let i = 0; i < n; i++) at(x + (i - 1.5) * 6, y - i * 14, 1, 1, () => { shadowed(() => rrect(-160, -70, 320, 140, 14, '#1E8F5C'), 18, 6, 0.5); rrect(-146, -56, 292, 112, 10, null, 'rgba(255,255,255,0.55)', 4); circle(0, 0, 40, 'rgba(255,255,255,0.85)'); txt('$', 0, 3, 54, '#1E8F5C', { w: 900, dir: 'ltr' }); }, (rnd(i * 3.1) - 0.5) * 0.16);
  cv.restore(); }
function monitor(key, r, x, y, w, glow = 1) {
  const h = (w * r[3]) / r[2];
  pool(x + w / 2, y + h / 2, w * 0.95, VIO, 0.2 * glow);
  rrect(x + w / 2 - 38, y + h + 12, 76, 124, 10, '#15121D'); ell(x + w / 2, y + h + 138, 200, 26, '#1D1A27'); ell(x + w / 2, y + h + 132, 196, 22, '#272335');
  shadowed(() => rrect(x - 18, y - 18, w + 36, h + 36, 26, '#0C0B12'), 60, 20, 0.6); rrect(x - 18, y - 18, w + 36, h + 36, 26, null, 'rgba(255,255,255,0.09)', 2);
  crop(key, r, x, y, w);
  const g = cv.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); rrect(x, y, w, h, 10, g);
  return h;
}
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; const rx = x + (q[0] - r[0]) * s - m, ry = y + (q[1] - r[1]) * s - m, rw = q[2] * s + 2 * m, rh = q[3] * s + 2 * m;
  cv.save(); cv.globalAlpha *= k; tube([[rx + 14, ry], [rx + rw - 14, ry], [rx + rw, ry + 14], [rx + rw, ry + rh - 14], [rx + rw - 14, ry + rh], [rx + 14, ry + rh], [rx, ry + rh - 14], [rx, ry + 14], [rx + 14, ry]], col, 1, 6, 0); cv.restore(); }
function shot(key, r, x, y, w) { const h = (w * r[3]) / r[2]; shadowed(() => rrect(x - 12, y - 12, w + 24, h + 24, 22, '#100E17'), 50, 18, 0.6); rrect(x - 12, y - 12, w + 24, h + 24, 22, null, 'rgba(255,255,255,0.12)', 2); crop(key, r, x, y, w); return h; }

// ---- the sample simulation (k13's): two fixed pseudo-random paths, in units of one risked amount ----
const walk = (seed, p, win, n = 200) => { const a = [0]; for (let i = 0; i < n; i++) a.push(a[i] + (rnd(seed * 1000 + i) < p ? win : -1)); return a; };
const SIM_S = walk(2981, 0.45, 2), SIM_L = walk(75, 0.5, 1);   // strategy: +5 after 10, +70 after 200; luck: +4 after 10, +9 at its best (trade 57), −4 after 100, −8 after 200
const valAt = (a, n) => { const m = Math.min(a.length - 1, Math.floor(n)); return m < a.length - 1 ? lerp(a[m], a[m + 1], n - m) : a[m]; };
function simPts(a, n, X, Y, from = 0) { const pts = [], m = Math.min(a.length - 1, Math.floor(n)); for (let i = from; i <= m; i++) pts.push([X(i), Y(a[i])]); if (m < a.length - 1 && n > m) pts.push([X(n), Y(valAt(a, n))]); return pts; }

// ================= scenes =================
const SLOT = [760, 320];   // the right place is luck's (said first), the left strategy's
// ---- the hook: profit chips; at «یا چون هنوز شانست…» the room turns pink and dice roll onto the felt ----
function hookFelt(t, settled = false) {
  stack(300, 1470, settled ? 10 : 4 + 6 * cub(k01(t, 0, 0.6)), C_GRN); pool(300, 1380, 240, GRN, 0.09);
  const kl = settled ? 1 : cub(k01(t, T.luck - 0.05, 0.3)); pool(770, 1380, 330, PINK, 0.15 * kl);
  [[700, 1440, 5, 0], [850, 1395, 3, 1]].forEach(([x, y, n, i]) => { const t0 = T.luck + 0.05 + i * 0.12, dt = settled ? 9 : t - t0; if (dt < 0) return; const k = cub(cl(dt / 0.5));
    die(lerp(1240, x, k), y - Math.abs(Math.sin(k * Math.PI * 2.5)) * (1 - k) * 140, 118, n, (1 - k) * 7 * (i ? 1 : -1) + (i ? 0.26 : -0.18)); });
}
function hookArt(t) { hookFelt(t); }
// ---- «جوابش سخته» ----
function hardArt(t) {
  hookFelt(t, true);
  [[150, 350, 150, -0.25, WARM], [940, 360, 120, 0.3, CYAN], [140, 1060, 130, -0.12, PINK], [945, 1040, 160, 0.2, WARM]].forEach(([x, y, s, r, col], i) => at(x, y, 1, 1, () => sign('؟', 0, 0, s, col, t, T.hard + 0.04 + i * 0.07), r));
}
// ---- «سود شانسی و سود استراتژی توی حساب یه شکلن»: two same stacks, then cups drop and shuffle ----
const SWAPS = () => [[ws(21) - 0.12, 0.36], [ws(22) + 0.1, 0.34]];
function cupPos(t, i) { let cur = i, x = SLOT[i], y = 0; for (const [t0, d] of SWAPS()) { if (t < t0) break; const p = exIO(k01(t, t0, d)); x = lerp(SLOT[cur], SLOT[1 - cur], p); y = (cur === 0 ? -1 : 1) * Math.sin(p * Math.PI) * 46; if (p >= 1) cur = 1 - cur; } return [x, y]; }
function sameArt(t) {
  const q = ws(21) - 0.12;
  [[PINK, 'شانس', ws(15), 0], [CYAN, 'استراتژی', ws(18), 1]].forEach(([col, s, t0, i]) => { const x = SLOT[i];
    if (t < q + 0.18) sign(s, x, 840, i ? 84 : 100, col, t, t0, { box: true, b: t < q ? ignite(t - t0, i + 3) * hum(t, i) : sputter(t, q, 0.18, i + 5), idle: 0.05 });
    if (t >= q) sign('؟', x, 840, 150, WARM, t, q + 0.05 + i * 0.06);
    stack(x, 1470, 9 * cub(k01(t, T.same + 0.05 + i * 0.12, 0.3)), C_GRN); pool(x, 1380, 220, col, t < q ? 0.1 * cl((t - t0) / 0.2) : 0.05); });
  const kd = ws(19) - 0.05; if (t >= kd) [0, 1].map((i) => [i, ...cupPos(t, i)]).sort((a, b) => a[2] - b[2]).forEach(([i, x, yo]) => cup(x, lerp(980, 1480, cl(pop(t - kd - i * 0.06, 15, 0.62), 0, 1.04)) + yo));
}
// ---- «هر دو سبزن»: the cups lift off two green stacks; the room goes green ----
function greenArt(t) {
  pool(CX, 900, 950, GRN, 0.12 * cl((t - T.green) / 0.15));
  SLOT.forEach((x, i) => { stack(x, 1470, 9, C_GRN); pool(x, 1380, 240, GRN, 0.14); arrow(x, 900, 120, GRN, ignite(t - (T.green + 0.06 + i * 0.12), 40 + i) * hum(t, i), -1, 14); });
  const ku = cub(k01(t, T.green - 0.02, 0.4)); if (ku < 1) [0, 1].forEach((i) => cup(cupPos(T.green, i)[0], 1480 - 1000 * ku));
}
// ---- «با ده تا معامله‌ی خوب هم معلوم نمی‌شه»: ten winning chips dealt, then a pink «؟» ----
function tenArt(t) {
  for (let i = 0; i < 10; i++) { const c = i % 5, r = Math.floor(i / 5), x = CX + (2 - c) * 168, y = 1350 + r * 118, t0 = ws(27) - 0.12 + i * 0.075, k = cub(k01(t, t0, 0.22)); if (k <= 0) continue;
    const xx = lerp(CX, x, k), yy = lerp(1180, y, k) - Math.sin(k * Math.PI) * 50; const top = stack(xx, yy, 1, C_GRN, 0.92);
    if (k > 0.6) { cv.save(); cv.globalAlpha *= cl((k - 0.6) / 0.4); cv.strokeStyle = WARM; cv.lineWidth = 7; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(xx - 16, top + 22); cv.lineTo(xx - 4, top + 31); cv.lineTo(xx + 18, top + 13); cv.stroke(); cv.restore(); } }
  pool(CX, 1400, 380, GRN, 0.08 * cub(k01(t, ws(27), 0.6)));
  sign('؟', CX, 905, 330, PINK, t, ws(31));
}
// ---- «توی ده تا، شانس و مهارت از هم جدا نمی‌شن»: the first 10 trades, tangled ----
function tangleArt(t) {
  const X = (i) => 160 + i * 76, Y = (v) => 1075 - (v + 1) * 58, n = 10 * cub(k01(t, ws(34) - 0.1, ws(41) - ws(34) + 0.2));
  tube([[140, Y(0)], [940, Y(0)]], WARM, 0, 3, 0.55);
  for (let i = 0; i <= 10; i++) circle(X(i), 1125, 5, 'rgba(255,230,196,0.35)');
  tube(simPts(SIM_L, n, X, Y), PINK, hum(t, 2), 10); tube(simPts(SIM_S, n, X, Y), CYAN, hum(t, 5), 10);
  sign('۱۰ معامله‌ی اول', 830, 690, 40, WARM, t, T.tangle + 0.1, { nopool: true });
  sign('شانس', 230, 690, 46, PINK, t, ws(36), { box: true }); sign('مهارت', 400, 690, 46, CYAN, t, ws(38), { box: true });
  sign('≈', 250, 860, 130, LIME, t, ws(41));
  note('شبیه‌سازی نمونه', CX, 1170);
  stack(SLOT[0], 1470, 5 + valAt(SIM_L, n), C_PINK); stack(SLOT[1], 1470, 5 + valAt(SIM_S, n), C_CYAN);
  pool(SLOT[0], 1380, 220, PINK, 0.1); pool(SLOT[1], 1380, 220, CYAN, 0.1);
}
// ---- «فرقشون وقتی پیدا می‌شه که تعداد بره بالا»: a counter rolling 10 → 200, and 200 chips ----
function counter(x, y, v) {
  const cw = 150, chh = 176, gap = 18, n = 3, bw = n * cw + (n - 1) * gap + 70, bh = chh + 60;
  shadowed(() => rrect(x - bw / 2, y - bh / 2, bw, bh, 30, '#1B1922'), 50, 18, 0.6);
  let g = cv.createLinearGradient(0, y - bh / 2, 0, y + bh / 2); g.addColorStop(0, '#4A4656'); g.addColorStop(0.5, '#25222E'); g.addColorStop(1, '#3A3645'); rrect(x - bw / 2, y - bh / 2, bw, bh, 30, null, g, 8);
  const pos = [Math.floor(v / 100) + cl((v % 100) - 99), Math.floor(v / 10) + cl((v % 10) - 9), v];
  for (let d = 0; d < n; d++) { const wx = x - bw / 2 + 35 + d * (cw + gap), wy = y - chh / 2;
    cv.save(); cv.beginPath(); cv.roundRect(wx, wy, cw, chh, 14); cv.clip(); cv.fillStyle = '#F2EAD8'; cv.fillRect(wx, wy, cw, chh);
    const p = pos[d], base = Math.floor(p), f = p - base; for (let k = -1; k <= 1; k++) txt(fa(((base + k) % 10 + 10) % 10), wx + cw / 2, wy + chh / 2 + (k - f) * chh + 8, 150, '#17121F', { w: 900 });
    g = cv.createLinearGradient(0, wy, 0, wy + chh); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.25, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); cv.fillStyle = g; cv.fillRect(wx, wy, cw, chh); cv.restore();
    rrect(wx, wy, cw, chh, 14, null, 'rgba(0,0,0,0.6)', 4); }
}
function diffArt(t) {
  const v = lerp(10, 200, cub(k01(t, ws(48) - 0.05, ws(50) + 0.45 - ws(48))));
  sign('تعداد معامله', CX, 720, 46, WARM, t, T.diff + 0.15, { nopool: true });
  pool(CX, 900, 420, VIO, 0.12); counter(CX, 900, v);
  for (let row = 0; row < 2; row++) for (let j = 0; j < 10; j++) { const k = (1 - row) * 10 + j, n = cl(v - 10 * k, 0, 10), sc = row ? 0.6 : 0.52, x = CX + (4.5 - j) * (row ? 90 : 82), y = row ? 1488 : 1380; if (n > 0) stack(x, y, n, C_VIO, sc); }
  pool(CX, 1420, 520, VIO, 0.1 * v / 200);
}
// ---- «توی دویست تا معامله، شانس کم میاره و استراتژی می‌مونه»: luck's tube dies, strategy's stays ----
const X2 = (i) => 140 + i * 4.05, Y2 = (v) => 1125 - ((v + 16) / 96) * 500;
function twoArt(t) {
  const x = k01(t, T.two + 0.15, ws(59) + 0.2 - T.two), n = 200 * (1 - (1 - x) * (1 - x)), die0 = ws(55) - 0.03, keep = ws(59) - 0.04;
  tube([[130, Y2(0)], [950, Y2(0)]], WARM, 0, 3, 0.55); note('شبیه‌سازی نمونه', CX, 1170); note('۲۰۰ معامله', 900, 1170);
  const lp = simPts(SIM_L, n, X2, Y2), sp = simPts(SIM_S, n, X2, Y2), bl = t < die0 ? hum(t, 2) : sputter(t, die0, 0.8, 4), bs = (t >= keep ? 1 + 0.4 * Math.exp(-(t - keep) * 5) : 1) * hum(t, 5);
  tube(lp, PINK, bl, 9); tube(sp, CYAN, bs, 9);
  const e = lp[lp.length - 1]; sparks(t, die0, e[0], e[1], 24, 3);
  sign('شانس', 860, 1040, 50, PINK, t, ws(54), { box: true, b: t < die0 ? ignite(t - ws(54), 54) * hum(t, 1) : bl });
  sign('استراتژی', 780, 640, 54, CYAN, t, ws(58), { box: true, b: ignite(t - ws(58), 58) * bs });
  stack(SLOT[0], 1470, Math.max(1, 6 + valAt(SIM_L, n) * 0.55), C_PINK, 0.85, t < die0 ? 1 : lerp(1, 0.45, k01(t, die0, 0.6)));
  stack(SLOT[1], 1470, 6 + valAt(SIM_S, n) / 3.4, C_CYAN, 0.85); pool(SLOT[1], 1300, 300, CYAN, 0.08 + 0.1 * cl(n / 200)); pool(SLOT[0], 1380, 220, PINK, t < die0 ? 0.1 : 0.1 * bl);
}
// ---- «ولی توی بازار زنده، دویست تا معامله یعنی چند ماه وقت و پول واقعی» ----
function clock(x, y, r, spin) {
  shadowed(() => circle(x, y, r + 14, '#14121B'), 40, 14, 0.6); circle(x, y, r, '#0E0C14');
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; cv.save(); cv.strokeStyle = 'rgba(255,230,196,0.55)'; cv.lineWidth = k % 3 ? 4 : 8; cv.beginPath(); cv.moveTo(x + Math.sin(a) * r * 0.8, y - Math.cos(a) * r * 0.8); cv.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); cv.stroke(); cv.restore(); }
  const ring = []; for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2; ring.push([x + Math.sin(a) * (r + 4), y - Math.cos(a) * (r + 4)]); } tube(ring, RED, 0.9, 8, 1);
  const hand = (a, l, w, col) => { cv.save(); cv.strokeStyle = col; cv.lineWidth = w; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x, y); cv.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); cv.stroke(); cv.restore(); };
  hand(spin / 12 + 1.1, r * 0.5, 12, WARM); hand(spin + 0.2, r * 0.75, 7, WARM); circle(x, y, 12, RED);
}
const MONTHS = ['۱', '۲', '۳', '۴'];
function calendar(x, y, t) {
  const w = 250, h = 290; shadowed(() => rrect(x - w / 2 - 10, y - h / 2 - 10, w + 20, h + 20, 22, '#16131D'), 40, 14, 0.6);
  const page = (i, rot = 0, dy = 0, a = 1) => at(x, y + dy, 1, a, () => { rrect(-w / 2, -h / 2, w, h, 16, '#F5F0E6'); cv.save(); cv.beginPath(); cv.roundRect(-w / 2, -h / 2, w, h, 16); cv.clip(); rrect(-w / 2, -h / 2, w, 70, 0, '#6C47FF'); cv.restore();
    txt('ماه', 0, -h / 2 + 37, 40, '#FFFFFF'); txt(MONTHS[i], 0, 40, 150, '#17121F', { w: 900 }); circle(-60, -h / 2, 10, '#2A2436'); circle(60, -h / 2, 10, '#2A2436'); }, rot);
  const tears = [0, 1, 2].map((i) => ws(67) - 0.06 + i * 0.16), cur = tears.filter((s) => t >= s + 0.3).length;
  page(Math.min(3, cur + (tears.some((s) => t >= s && t < s + 0.3) ? 1 : 0)));
  tears.forEach((s, i) => { const k = k01(t, s, 0.3); if (k > 0 && k < 1) page(i, k * 0.9 * (i % 2 ? -1 : 1), k * k * 520, 1 - k); else if (t < s && i === cur) page(i); });
}
function liveArt(t) {
  pool(CX, 420, 520, RED, 0.08 * cl((t - ws(63)) / 0.2));
  calendar(300, 880, t); clock(770, 880, 150, t * 0.6 + 26 * cub(k01(t, ws(67), 1.3)));
  sign('معامله‌ی ۳ از ۲۰۰', CX, 1120, 46, LIME, t, ws(64), { box: true });
  const kc = 1 - cub(k01(t, ws(71) - 0.05, 0.2)); stack(CX, 1480, 8, C_GOLD, 1, kc); pool(CX, 1390, 240, '#FFC24A', 0.08 * kc);
  const kb = pop(t - ws(71) + 0.02, 14, 0.6); if (kb > 0) at(CX, 1430 - (1 - cl(kb)) * 120, cl(kb, 0, 1.1), cl(kb * 2), () => bills(0, 0));
  if (t > ws(72)) pool(CX, 1400, 300, RED, 0.12 * cl((t - ws(72)) / 0.2));
}
// ---- the real gold replay on a monitor (lab + norisk): candles, a planned sell, the trade to its target, the balance ----
// crops, in the 1440×900 capture: RR the chart's right part, RS the bottom bar's result and balance, QB the balance
const RR = [440, 215, 750, 560], RS = [888, 857, 300, 44], QB = [1058, 861, 128, 36], QPOS = [800, 340, 328, 284];
const A_KEYS = Array.from({ length: 6 }, (_, i) => 'a' + i), C_KEYS = Array.from({ length: 16 }, (_, i) => 'c' + String(i).padStart(2, '0'));
const MX = 90, MY = 520, MW = 900;
function labArt(t) {
  const key = t < ws(79) ? FLIP(t, T.lab + 0.1, ws(79), A_KEYS) : t < ws(83) ? 'cp' : t < T.norisk - 0.05 ? 'cl' : t < ws(87) + 0.1 ? FLIP(t, T.norisk - 0.05, ws(87) + 0.1, C_KEYS) : 'c15';
  const kin = cub(k01(t, T.lab - 0.04, 0.35));
  at(CX, MY + 360, lerp(0.94, 1, kin), kin, () => { cv.translate(-CX, -(MY + 360)); monitor(key, RR, MX, MY, MW); if (t >= ws(79) && t < ws(83) + 0.1) ringIn(RR, QPOS, MX, MY, MW, cub(k01(t, ws(80), 0.3)), LIME); });
  if (IMG.icon) { const ki = pop(t - ws(74) + 0.05, 13, 0.55); if (ki > 0) at(MX + MW - 10, MY - 6, cl(ki, 0, 1.2), cl(ki), () => { pool(0, 0, 160, VIO, 0.25); cv.shadowColor = rgba(VIO, 0.9); cv.shadowBlur = 40; cv.drawImage(IMG.icon, -62, -62, 124, 124); }); }
  if (t >= ws(80) - 0.1 && t < T.norisk) sign('ورود · حد ضرر · حد سود', 330, MY + 64, 38, LIME, t, ws(80), { box: true });
  note(t < T.norisk ? 'صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا' : 'صفحه‌ی واقعی بک‌تست‌لب · معامله‌ی نمونه روی طلا', CX, MY + 708);
  // «بدون ریسک»: the real chips stay under glass
  const kg = pop(t - ws(84) + 0.03, 12, 0.6); if (kg > 0) at(175, 1480, 1, cl(kg), () => { stack(0, 0, 6, C_GOLD, 0.8); cloche(0, 2, 118, cl(kg)); });
  if (kg > 0) pool(175, 1380, 200, '#BFE1FF', 0.07 * cl(kg));
  const ks = pop(t - ws(88) + 0.06, 12, 0.55); if (ks > 0) at(CX, 1150, cl(ks, 0, 1.1), cl(ks), () => { const w = 1000, x = -500, y = -74; shot('c15', RS, x, y, w); ringIn(RS, QB, x, y, w, cub(k01(t, ws(89), 0.3)), LIME); }, -0.015);
}
// ---- «اگه استراتژیه، خیالت راحت می‌شه» ----
function checkTube(x, y, r, b) { const ring = []; for (let k = 0; k <= 40; k++) { const a = (k / 40) * Math.PI * 2; ring.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } tube(ring, GRN, b, 10); tube([[x - r * 0.42, y + r * 0.02], [x - r * 0.1, y + r * 0.32], [x + r * 0.45, y - r * 0.32]], GRN, b, 12); }
function ifsArt(t) {
  const X = (i) => 140 + i * 4.05, Y = (v) => 1125 - (v / 74) * 400;
  tube([[130, Y(0)], [950, Y(0)]], WARM, 0, 3, 0.55); note('شبیه‌سازی نمونه', CX, 1170);
  tube(simPts(SIM_S, 200 * cub(k01(t, T.ifs + 0.05, 1.1)), X, Y), CYAN, hum(t, 5), 10);
  sign('استراتژی', 640, 1075, 50, CYAN, t, ws(92), { box: true });
  const b = ignite(t - ws(93), 93) * hum(t, 9); pool(200, 800, 220, GRN, 0.16 * cl(b)); checkTube(200, 800, 86, b);
  stack(SLOT[1], 1470, 18, C_CYAN, 0.72); pool(SLOT[1], 1320, 300, CYAN, 0.12);
}
// ---- «اگه شانس بوده، بهتره الان بفهمی»: 10 lucky trades, a «الان» pin, and the unlit tube of what comes after ----
function iflArt(t) {
  const X = (i) => 140 + i * 8.1, Y = (v) => 1100 - (v + 10) * 16;
  tube([[130, Y(0)], [950, Y(0)]], WARM, 0, 3, 0.55); note('شبیه‌سازی نمونه', CX, 1170);
  tube(simPts(SIM_L, 100, X, Y, 10), PINK, 0, 9, 0.35 + 0.65 * cub(k01(t, ws(99), 0.8)));
  tube(simPts(SIM_L, 10 * cub(k01(t, T.ifl + 0.05, 0.5)), X, Y), PINK, hum(t, 2), 10);
  const px = X(10), py = Y(SIM_L[10]), kp = pop(t - ws(100) + 0.05, 13, 0.5);
  if (kp > 0) { const b = ignite(t - ws(100), 100); tube([[px, py - 24], [px + 60 * cl(kp), py - 24 - 70 * cl(kp)]], VIO, b, 8); sign('الان', px + 130, py - 140, 64, VIO, t, ws(100), { box: true, sc: cl(kp, 0, 1.1) }); circle(px, py, 18, null, VIO, 6); }
  [[760, 1440, 5, 0], [880, 1405, 3, 1]].forEach(([x, y, n, i]) => { const k = cub(k01(t, ws(97) - 0.05 + i * 0.1, 0.45)); if (k > 0) die(lerp(1240, x, k), y - Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k) * 120, 112, n, (1 - k) * 6 + (i ? 0.25 : -0.2)); });
  pool(820, 1390, 300, PINK, 0.12);
}
// ---- «نه وقتی که تموم شد»: luck's sign dies, the room blacks out ----
function lateArt(t) {
  const off = ws(105) - 0.02, b = t < T.late + 0.15 ? 1 : t < off ? (rnd(Math.floor(t * 22)) > 0.3 ? 0.55 + 0.45 * rnd(Math.floor(t * 31)) : 0.08) : 0;
  sign('شانس', CX, 930, 220, PINK, t, T.late, { box: true, b, offA: 1 });
  sparks(t, off, CX - 170, 870, 30, 7); sparks(t, off, CX + 190, 990, 22, 9);
  stack(SLOT[0], 1470, 2, C_PINK, 0.85); die(760, 1440, 112, 5, -0.2); die(880, 1405, 112, 3, 0.25);
}
function ROOM(t) { const off = ws(105) - 0.02; if (t < off) return 1; if (t < T.cta - 0.02) return 0.05; return 0.05 + 0.95 * cl(ignite(t - (T.cta - 0.02), 5)); }
// ---- «شروعش رایگانه؛ لینک توی بیو» and the end card: the BacktestLab sign turns the lights back on ----
function logoSign(x, y, s, b) { if (!IMG.icon || b <= 0.004) return; pool(x, y, s * 2.4, VIO, 0.3 * cl(b)); cv.save(); cv.globalAlpha *= cl(b); cv.shadowColor = rgba(VIO, 1); cv.shadowBlur = s * 0.35; cv.drawImage(IMG.icon, x - s / 2, y - s / 2, s, s); cv.drawImage(IMG.icon, x - s / 2, y - s / 2, s, s); cv.restore(); }
function ctaArt(t) {
  logoSign(CX, 860, 300, ignite(t - T.cta - 0.12, 77) * hum(t, 3));
  arrow(CX, 1390, 110, LIME, ignite(t - ws(109), 109) * hum(t, 4), 1, 14);
  stack(SLOT[1], 1470, 9, C_GRN, 0.85); stack(SLOT[0], 1470, 4, C_VIO, 0.85);
}
function endArt(t) {
  const t0 = T.end; pool(CX, 900, 800, VIO, 0.1);
  logoSign(CX, 620, 230, ignite(t - t0 - 0.02, 81) * hum(t, 6));
  if (IMG.word) { const k = cl((t - t0 - 0.15) / 0.2), w = 580, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(VIO, 0.9); cv.shadowBlur = 30; cv.drawImage(IMG.word, CX - w / 2, 790, w, h); cv.restore(); }
  sign('شروعش رایگانه', CX, 1040, 66, LIME, t, t0 + 0.35, { box: true });
  sign('لینک توی بیو', CX, 1175, 60, WARM, t, t0 + 0.55);
  arrow(CX, 1370, 90, LIME, ignite(t - t0 - 0.75, 3) * hum(t, 4), 1, 12);
}

// ---------- the story ----------
const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
const SC = [
  { k: 'hook', art: hookArt, groups: [{ at: 0, lines: [
    L_(262, 100, WARM, [['سود', 0, { c: GRN, box: true }], ['می‌کنی', 1], ['چون', 2]]),
    L_(440, 200, CYAN, [['استراتژی', 3]]),
    L_(578, 92, WARM, [['داری،', 4]]),
    L_(688, 92, WARM, [['یا', 5, { c: PINK }], ['چون', 6], ['هنوز', 7]]),
    L_(880, 196, PINK, [['شانست', 8, { box: true }]]),
    L_(1088, 104, WARM, [['تموم', 9], ['نشده؟', 10, { c: PINK }]])] }] },
  { k: 'hard', art: hardArt, groups: [{ at: 11, lines: [L_(520, 190, WARM, [['جوابش', 11]]), L_(800, 270, PINK, [['سخته،', 12, { box: true }]])] }] },
  { k: 'same', art: sameArt, groups: [
    { at: 13, lines: [L_(280, 112, WARM, [['چون', 13], ['سودِ', 14, { c: GRN }], ['شانسی', 15, { c: PINK }]]), L_(430, 112, WARM, [['و', 16], ['سودِ', 17, { c: GRN }], ['استراتژی', 18, { c: CYAN }]])] },
    { at: 19, lines: [L_(290, 116, WARM, [['توی', 19], ['حساب', 20]]), L_(470, 180, LIME, [['یه شکلن.', [21, 22], { box: true }]])] }] },
  { k: 'green', art: greenArt, groups: [{ at: 23, lines: [L_(310, 160, WARM, [['هر', 23], ['دو', 24]]), L_(545, 240, GRN, [['سبزن.', 25, { box: true }]])] }] },
  { k: 'ten', art: tenArt, groups: [{ at: 26, lines: [
    L_(270, 112, WARM, [['با', 26], ['۱۰', 27, { c: VIO, box: true }], ['تا', 28], ['معامله‌ی', 29]]), L_(420, 112, WARM, [['خوب', 30, { c: GRN }], ['هم', 30]]),
    L_(590, 150, WARM, [['معلوم', 31], ['نمی‌شه.', 32, { c: RED, box: true }]])] }] },
  { k: 'tangle', art: tangleArt, groups: [{ at: 33, lines: [
    L_(265, 116, WARM, [['توی', 33], ['۱۰', 34, { c: LIME }], ['تا،', 35]]), L_(405, 116, WARM, [['شانس', 36, { c: PINK }], ['و', 37], ['مهارت', 38, { c: CYAN }]]),
    L_(555, 120, WARM, [['از هم', [39, 40]], ['جدا', 41], ['نمی‌شن.', 42, { c: LIME, box: true }]])] }] },
  { k: 'diff', art: diffArt, groups: [{ at: 43, lines: [
    L_(265, 120, WARM, [['فرقشون', 43, { c: LIME, box: true }], ['وقتی', 44]]), L_(410, 112, WARM, [['پیدا', 45], ['می‌شه', 46]]),
    L_(555, 120, WARM, [['که', 47], ['تعداد', 48, { c: VIO }], ['بره', 49], ['بالا.', 50, { c: LIME }]])] }] },
  { k: 'two', art: twoArt, groups: [
    { at: 51, lines: [L_(280, 120, WARM, [['توی', 51], ['۲۰۰', 52, { c: VIO, box: true }], ['تا', 52]]), L_(440, 130, WARM, [['معامله،', 53]])] },
    { at: 54, lines: [L_(280, 120, PINK, [['شانس', 54]]), L_(445, 160, WARM, [['کم', 55, { c: RED, box: true }], ['میاره', 56]])] },
    { at: 57, lines: [L_(280, 120, WARM, [['و', 57], ['استراتژی', 58, { c: CYAN }]]), L_(450, 170, CYAN, [['می‌مونه.', 59, { box: true }]])] }] },
  { k: 'live', art: liveArt, groups: [
    { at: 60, lines: [L_(260, 110, WARM, [['ولی', 60], ['توی', 61], ['بازار', 62]]), L_(410, 160, RED, [['زنده،', 63, { box: true }]]), L_(575, 110, WARM, [['۲۰۰', 64, { c: VIO }], ['تا', 64], ['معامله', 65]])] },
    { at: 66, lines: [L_(260, 110, WARM, [['یعنی', 66]]), L_(410, 140, WARM, [['چند', 67], ['ماه', 68, { c: VIO, box: true }], ['وقت', 69]]), L_(575, 130, WARM, [['و', 70], ['پولِ', 71, { c: GRN }], ['واقعی.', 72, { c: RED }]])] }] },
  { k: 'lab', art: labArt, groups: [
    { at: 73, lines: [L_(255, 116, WARM, [['توی', 73], ['بک‌تست‌لب', [74, 75], { c: VIO, box: true }]]), L_(400, 116, WARM, [['همون', 76], ['۲۰۰', 77, { c: LIME }], ['تا', 77], ['رو', 78]])] },
    { at: 79, lines: [L_(255, 108, WARM, [['روی', 79], ['بازارِ', 80], ['واقعیِ', 81, { c: LIME }]]), L_(400, 120, WARM, [['گذشته', 82, { c: LIME, box: true }], ['می‌گیری،', 83]])] },
    { at: 84, lines: [L_(320, 170, WARM, [['بدون', 84], ['ریسک،', 85, { c: LIME, box: true }]])] },
    { at: 86, lines: [L_(255, 112, WARM, [['و', 86], ['می‌بینی', 87], ['حسابت', 88, { c: VIO }]]), L_(400, 130, WARM, [['آخرش', 89], ['کجاست.', 90, { c: LIME, box: true }]])] }] },
  { k: 'ifs', art: ifsArt, groups: [{ at: 91, lines: [
    L_(270, 116, WARM, [['اگه', 91], ['استراتژیه،', 92, { c: CYAN }]]), L_(420, 130, WARM, [['خیالت', 93]]), L_(585, 170, GRN, [['راحت', 94, { box: true }], ['می‌شه.', 95, { c: WARM }]])] }] },
  { k: 'ifl', art: iflArt, groups: [{ at: 96, lines: [
    L_(270, 120, WARM, [['اگه', 96], ['شانس', 97, { c: PINK, box: true }], ['بوده،', 98]]), L_(420, 120, WARM, [['بهتره', 99]]), L_(585, 170, WARM, [['الان', 100, { c: VIO, box: true }], ['بفهمی،', 101]])] }] },
  { k: 'late', art: lateArt, groups: [
    { at: 102, lines: [L_(330, 140, WARM, [['نه', 102], ['وقتی', 103], ['که', 104]])] },
    { at: 105, top: true, lines: [L_(600, 290, RED, [['تموم', 105], ['شد.', 106]])] }] },
  { k: 'cta', art: ctaArt, groups: [{ at: 107, lines: [L_(300, 124, WARM, [['شروعش', 107], ['رایگانه؛', 108, { c: LIME, box: true }]]), L_(470, 110, WARM, [['لینک', 109], ['توی', 110], ['بیو.', 111]])] }] },
  { k: 'end', art: endArt, groups: [] },
];
SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; });
const SHAKES = [[ws(12), 8], [ws(25), 10], [ws(31), 8], [ws(55), 8], [ws(59), 10], [ws(105), 18]];

// ---------- words ----------
function lineLayout(ln) {
  if (ln._L) return ln._L;
  const gap = measure(' ', ln.size) * 1.4, items = ln.toks.map(([s, wi, o = {}]) => { const size = o.size ?? ln.size, col = o.c ?? ln.c, n = neonImg(s, size, col, { box: o.box }); return { wi: Array.isArray(wi) ? wi[0] : wi, n, col, size, tw: n.tw }; });
  const total = items.reduce((a, b) => a + b.tw, 0) + gap * (items.length - 1), sc = Math.min(1, (ln.max ?? 960) / total); let right = CX + (total * sc) / 2;
  items.forEach((it) => { it.x = right - (it.tw * sc) / 2; right -= (it.tw + gap) * sc; });
  return (ln._L = { items, sc, total });
}
const wordB = (t, wi) => { const dt = t - (ws(wi) - 0.04); return dt < 0 ? 0 : ignite(dt, wi) * hum(t, wi); };
function sceneWords(s, t, top) {
  s.groups.forEach((g, gi) => {
    if (!!g.top !== top) return;
    // a line hangs unlit from just before its first word and is gone before the next line's tubes appear
    const next = s.groups[gi + 1], first = s === SC[0] && gi === 0, start = (gi === 0 ? s.t0 + 0.02 : ws(g.at)) - 0.06, end = next ? ws(next.at) - 0.13 : s.t1 - 0.1;
    if ((!first && t < start) || t > end + 0.08) return;
    const offA = (first ? 1 : cub(k01(t, start, 0.05))) * (1 - k01(t, end, 0.08)), idle = (first ? 0.42 : 0.05) * offA;
    g.lines.forEach((ln) => { const L = lineLayout(ln); L.items.forEach((it) => { it.b = Math.max(idle, wordB(t, it.wi) * offA); pool(it.x, ln.y, Math.max(150, it.tw * L.sc * 0.75), it.col, 0.085 * cl(it.b)); }); });
    g.lines.forEach((ln) => { const L = lineLayout(ln); L.items.forEach((it) => drawNeon(it.n, it.x, ln.y, it.b, L.sc, offA)); });
  });
}

// ---------- frame ----------
const shake = (t) => SHAKES.reduce((x, [a, amp]) => x + (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0), 0);
function camera(t) { const cur = SC.filter((s) => t >= s.t0 - 0.06).pop() ?? SC[0], z = 1.035 + 0.03 * cub(k01(t, cur.t0, Math.max(0.5, cur.t1 - cur.t0)));
  cv.translate(CX + Math.sin(t * 0.8) * 5 + shake(t), 860 + Math.cos(t * 0.6) * 4); cv.scale(z, z); cv.translate(-CX, -860); }
const visOf = (s, t) => cl(k01(t, s.t0 - 0.06, 0.1)) * (1 - k01(t, s.t1 - 0.08, 0.1));
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.globalCompositeOperation = 'source-over'; cv.filter = 'none';
  cv.fillStyle = '#000'; cv.fillRect(0, 0, W, H);
  cv.save(); camera(t);
  cv.drawImage(WALL, 0, 0); cv.drawImage(TABLE, 0, WALLH - 30);
  cv.save(); cv.globalCompositeOperation = 'screen'; cv.globalAlpha = 0.55; cv.drawImage(HAZE, -100 + Math.sin(t * 0.13) * 60, 0); cv.restore();
  SC.forEach((s) => { if (t < s.t0 - 0.08 || t > s.t1 + 0.12) return; const vis = visOf(s, t); if (vis <= 0) return; cv.save(); cv.globalAlpha = vis; s.art(t, s); sceneWords(s, t, false); cv.restore(); });
  cv.restore();
  const room = ROOM(t); if (room < 1) { cv.fillStyle = `rgba(0,0,0,${(1 - room) * 0.97})`; cv.fillRect(0, 0, W, H); }
  cv.save(); camera(t); SC.forEach((s) => { if (t < s.t0 - 0.08 || t > s.t1 + 0.12) return; const vis = visOf(s, t); if (vis <= 0) return; cv.save(); cv.globalAlpha = vis; sceneWords(s, t, true); cv.restore(); }); cv.restore();
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(255,255,255,0.1)'; cv.fillRect(0, 0, W, 8); cv.save(); cv.globalCompositeOperation = 'lighter'; cv.fillStyle = rgba(LIME, 0.3); cv.fillRect(W * (1 - k), 0, W * k, 18); cv.fillStyle = LIME; cv.fillRect(W * (1 - k), 0, W * k, 8); cv.restore(); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
// the cover is the hook with the whole question lit
window.cover = () => frame(ws(10) + 0.45, { cover: true });
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  buildRoom(); window.seek(0); window.ready = true;
});
