// k22 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟» — «سه مسیر»: a floating isometric world, on the user's
// take at its normal speed. It takes the principles of the user's two reference reels (one relatable character, one
// idea per beat, short labels, a calm clear pace) and none of their look: a small trader (violet hoodie, a lime backpack:
// his strategy) stands scared before a gate marked «بررسی». On «سه تا جواب» he splits into three copies, each walking a
// bridge to its own island while the camera glides from one to the next:
//   - green: a flag goes up, confetti on «راحت»;
//   - amber: his backpack shrinks on «حجمتو»;
//   - red: he walks toward the cliff with his money and a barrier drops before he goes over, a check on «فهمیدی»;
//   - a fourth copy wanders into a foggy island («ندونستن») and gets a red ✕;
//   - «۵۰ تا معامله»: 50 tiles build a bridge to the BacktestLab building, whose billboard shows the real gold replay
//     (k13's screens), the planned sell ringed on «تست»; the free start, the end card.
// The words come as cartoon stickers at the top. Everything is drawn here. 1080×1920, a pure function of t.
const W = 1080, H = 1920, CX = 540, CY = 1160;
const INK = '#2A2140', VIO = '#6C47FF', LIL = '#A58BFF', LIME = '#C6F24E', GREEN = '#22B573', AMBER = '#F5A524', RED = '#EF4B5C', WHITE = '#FFFFFF', GREY = '#9C98A8';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- helpers ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); }, eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const win = (t, a, b, d = 0.2) => Math.min(sm(k01(t, a - d, d)), 1 - sm(k01(t, b, d)));
const FONT = (s, w = 800) => `${w} ${s}px Vazirmatn, "Noto Color Emoji"`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 800); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = isL(s) ? 'ltr' : 'rtl'; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 800) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, r); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { cv.beginPath(); cv.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function ell(x, y, rx, ry, fill, stroke, lw = 3) { cv.beginPath(); cv.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function poly(pts, fill, stroke, lw = 3) { cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.lineJoin = 'round'; cv.stroke(); } }
function line(pts, col, lw) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.stroke(); cv.restore(); }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, k) => { const p = hx(a), q = hx(b); return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- the isometric world ----------
const TW = 160, TH = 80, ZH = 44;
const iso = (gx, gy, gz = 0) => [(gx - gy) * (TW / 2), (gx + gy) * (TH / 2) - gz * ZH];
/** A block on the grid, with a rocky underside (a floating island) or a thin plank deck (a bridge). */
function block(b, t) {
  const { x, y, w, d, h = 1, col = LIL, top = '#F6F3FF', kind = 'island', sink = 0 } = b, z0 = kind === 'tower' ? b.base ?? 1 : h - (kind === 'bridge' ? 0.22 : 1) - sink, z1 = h - sink;
  const P = (gx, gy, gz) => iso(gx, gy, gz);
  if (kind === 'island') { const c = P(x + w / 2, y + d / 2, z0 - 1.6 - Math.min(w, d) * 0.25); [[P(x, y + d, z0), P(x + w, y + d, z0)], [P(x + w, y + d, z0), P(x + w, y, z0)]].forEach(([a, b2], i) => poly([a, b2, c], i ? mix(col, '#2A1F55', 0.55) : mix(col, '#2A1F55', 0.45))); }
  poly([P(x, y + d, z1), P(x + w, y + d, z1), P(x + w, y + d, z0), P(x, y + d, z0)], mix(col, '#FFFFFF', 0.05));
  poly([P(x + w, y, z1), P(x + w, y + d, z1), P(x + w, y + d, z0), P(x + w, y, z0)], mix(col, '#2A1F55', 0.18));
  poly([P(x, y, z1), P(x + w, y, z1), P(x + w, y + d, z1), P(x, y + d, z1)], top);
  cv.save(); cv.strokeStyle = kind === 'bridge' ? 'rgba(120,80,40,0.35)' : 'rgba(42,33,64,0.07)'; cv.lineWidth = 2;
  if (kind === 'tower') { /* plain walls */ } else if (kind === 'bridge') { const along = w >= d; for (let k = 0.25; k < (along ? w : d); k += 0.25) { const a = along ? P(x + k, y, z1) : P(x, y + k, z1), b2 = along ? P(x + k, y + d, z1) : P(x + w, y + k, z1); cv.beginPath(); cv.moveTo(...a); cv.lineTo(...b2); cv.stroke(); } }
  else { for (let k = 1; k < w; k++) { cv.beginPath(); cv.moveTo(...P(x + k, y, z1)); cv.lineTo(...P(x + k, y + d, z1)); cv.stroke(); } for (let k = 1; k < d; k++) { cv.beginPath(); cv.moveTo(...P(x, y + k, z1)); cv.lineTo(...P(x + w, y + k, z1)); cv.stroke(); } }
  cv.restore();
  poly([P(x, y, z1), P(x + w, y, z1), P(x + w, y + d, z1), P(x, y + d, z1)], null, 'rgba(255,255,255,0.7)', 2.5);
}
const ISL = {
  S: { x: 0, y: 0, w: 4, d: 4, col: LIL }, H: { x: 6, y: 0, w: 4, d: 4, col: LIL },
  A1: { x: 7, y: -5, w: 3, d: 3, col: GREEN, top: '#E6F8EF' }, P2: { x: 12, y: 0.5, w: 3, d: 3, col: AMBER, top: '#FFF2DC' }, P3: { x: 7, y: 6, w: 3, d: 3, col: RED, top: '#FFE6E9' },
  F: { x: 2, y: 6.5, w: 3, d: 2.5, col: GREY, top: '#ECEAF1' }, L: { x: 20, y: -0.5, w: 5, d: 5, col: VIO, top: '#F1ECFF' },
};
const BR = { B0: { x: 4, y: 1.5, w: 2, d: 1 }, B1: { x: 8, y: -2, w: 1, d: 2 }, B2: { x: 10, y: 1.5, w: 2, d: 1 }, B3: { x: 8, y: 4, w: 1, d: 2 }, B4: { x: 5, y: 7, w: 2, d: 1 } };
Object.values(BR).forEach((b) => Object.assign(b, { kind: 'bridge', col: '#C9A27A', top: '#EBD9C0' }));

// ---------- the trader ----------
/** Draws the trader standing at iso point (x, y): st = { face, bag (backpack size 0–1), tint (an outline colour for a copy), shake, jump, thumb, money, alpha, flip, walk }. */
function trader(x, y, st, t) {
  const a = st.alpha ?? 1; if (a <= 0.01) return;
  cv.save(); cv.globalAlpha *= a; const j = st.jump ?? 0, sh = st.shake ? Math.sin(t * 60) * st.shake : 0, walk = st.walk ?? 0, bob = walk ? Math.abs(Math.sin(t * 11)) * 5 : 0;
  cv.translate(x + sh, y - j - bob); if (st.flip) cv.scale(-1, 1);
  ell(0, j + bob + 2, 34, 12, 'rgba(42,33,64,0.18)');
  if (st.tint) { cv.save(); cv.shadowColor = st.tint; cv.shadowBlur = 22; ell(0, -60, 40, 62, rgba(st.tint, 0.18)); cv.restore(); }
  // legs and shoes
  const ls = walk ? Math.sin(t * 11) * 7 : 0;
  [-1, 1].forEach((s) => { rr(s * 11 - 6 + ls * s, -34, 12, 32, 5, '#2B2440'); ell(s * 12 + ls * s, -2, 11, 6, WHITE, INK, 2); });
  // backpack (his strategy) behind the body
  const bs = 0.45 + 0.55 * (st.bag ?? 1); rr(14, -96 + (1 - bs) * 26, 34 * bs, 46 * bs, 10 * bs, LIME, INK, 2.5); line([[22, -94 + (1 - bs) * 26], [8, -86]], INK, 3);
  // hoodie
  rr(-26, -88, 52, 58, 18, VIO, INK, 2.5); poly([[-12, -88], [12, -88], [0, -76]], '#5634E0'); line([[-6, -80], [-7, -64]], LIME, 3); line([[6, -80], [7, -64]], LIME, 3);
  // arms
  const arm = (s, up) => { const hx2 = s * 30, hy = up ? -116 : -48; line([[s * 20, -80], [s * 30, up ? -100 : -64], [hx2, hy]], VIO, 11); circle(hx2, hy, 7, '#F2C8A0', INK, 2); };
  arm(-1, false); arm(1, !!st.thumb);
  if (st.thumb) { rr(26, -134, 8, 14, 4, '#F2C8A0', INK, 2); }
  if (st.money) { cv.save(); cv.translate(-34, -58); rr(-16, -18, 32, 34, 12, '#2E9E5B', INK, 2.5); txt('$', 0, 0, 20, WHITE, { w: 900, dir: 'ltr' }); cv.restore(); }
  // head
  const hy = -122; circle(0, hy, 30, '#F2C8A0', INK, 2.5);
  cv.fillStyle = '#2B1F1A'; cv.beginPath(); cv.arc(0, hy - 6, 31, Math.PI * 1.03, Math.PI * 1.97); cv.quadraticCurveTo(14, hy - 30, -4, hy - 24); cv.closePath(); cv.fill();
  const f = st.face ?? 'calm', b = 1 - blinkAt(t, st.seed ?? 1) * 0.9, eyeY = hy + 2;
  [-1, 1].forEach((s) => { ell(s * 11, eyeY, 5, 7 * b, WHITE, INK, 1.6); circle(s * 11 + (f === 'scared' ? 0 : 1), eyeY + 1, 2.8 * b, INK); });
  if (f === 'scared') { line([[-16, hy - 13], [-6, hy - 17]], INK, 2.5); line([[16, hy - 13], [6, hy - 17]], INK, 2.5); line([[-8, hy + 17], [-3, hy + 14], [3, hy + 17], [8, hy + 14]], INK, 2.5); ell(24, hy - 10 + ((t * 2) % 1) * 10, 3.5, 6, '#7FC8FF'); }
  else if (f === 'happy') { cv.save(); cv.beginPath(); cv.arc(0, hy + 10, 10, 0.1, Math.PI - 0.1); cv.closePath(); cv.fillStyle = '#5A2C2C'; cv.fill(); cv.restore(); line([[-16, hy - 15], [-6, hy - 16]], INK, 2.5); line([[16, hy - 15], [6, hy - 16]], INK, 2.5); }
  else if (f === 'curious') { line([[-16, hy - 16], [-6, hy - 14]], INK, 2.5); line([[16, hy - 19], [6, hy - 15]], INK, 2.5); circle(3, hy + 15, 4, '#5A2C2C'); }
  else { line([[-16, hy - 14], [-6, hy - 15]], INK, 2.5); line([[16, hy - 14], [6, hy - 15]], INK, 2.5); cv.save(); cv.strokeStyle = INK; cv.lineWidth = 2.5; cv.beginPath(); cv.arc(0, hy + 8, 8, 0.3, Math.PI - 0.3); cv.stroke(); cv.restore(); }
  cv.restore();
}
function blinkAt(t, seed) { let b = 0, x = 0.8 + seed * 0.7, r = seed * 13 + 1; while (x < t + 1) { const u = t - x; if (u >= 0 && u < 0.15) b = Math.max(b, u < 0.05 ? u / 0.05 : 1 - (u - 0.05) / 0.1); r = (r * 16807) % 2147483647; x += 2.4 + (r / 2147483647) * 2.4; } return b; }
/** Position along a list of grid points between t0 and t1 (eased), and whether it's walking. */
function along(pts, t0, t1, t) { const k = eio(k01(t, t0, t1 - t0)), segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = segs.reduce((a, b) => a + b, 0); let left = k * L;
  for (let i = 0; i < segs.length; i++) { if (left <= segs[i]) { const f = segs[i] ? left / segs[i] : 0; return { p: [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)], walking: t > t0 && t < t1, dx: pts[i + 1][0] - pts[i][0] - (pts[i + 1][1] - pts[i][1]) }; } left -= segs[i]; }
  return { p: pts[pts.length - 1], walking: false, dx: 0 }; }

// ---------- props ----------
function sign(gx, gy, gz, label, col, k, t) {
  if (k <= 0) return; const [x, y] = iso(gx, gy, gz); cv.save(); cv.translate(x, y); cv.scale(cl(k, 0, 1.15), cl(k, 0, 1.15));
  rr(-4, -78, 8, 78, 3, '#8A6A4A'); const w = measure(label, 26) + 34; rr(-w / 2, -118, w, 48, 12, col, INK, 2.5); txt(label, 0, -93, 26, WHITE, { w: 900 }); cv.restore();
}
function gate(t) {
  const [x, y] = iso(4.1, 2, 1), glow = 0.5 + 0.5 * Math.sin(t * 4), open = sm(k01(t, ws(10) + 0.1, 0.5));
  cv.save(); cv.translate(x, y);
  rr(-74, -170, 22, 170, 8, '#3B2E6B'); rr(52, -170, 22, 170, 8, '#3B2E6B'); rr(-84, -196, 168, 36, 14, VIO, INK, 2.5); txt('بررسی', 0, -177, 26, WHITE, { w: 900 });
  cv.save(); cv.globalAlpha = (1 - open) * (0.35 + 0.25 * glow); const g = cv.createLinearGradient(0, -160, 0, 0); g.addColorStop(0, rgba(LIME, 0.9)); g.addColorStop(1, rgba(LIME, 0.1)); cv.fillStyle = g; cv.fillRect(-52, -160, 104, 160); cv.restore();
  cv.save(); cv.globalAlpha = 1 - open; for (let i = 0; i < 4; i++) { const yy = -150 + ((t * 0.8 + i * 0.25) % 1) * 150; line([[-50, yy], [50, yy]], rgba(LIME, 0.9), 3); } cv.restore();
  cv.restore();
}
function flag(t) { const [x, y] = iso(9.2, -4.2, 1), up = sm(k01(t, ws(23) - 0.1, 0.8)); cv.save(); cv.translate(x, y); rr(-3, -170, 6, 170, 3, '#6B5B85');
  const fy = lerp(-30, -166, up), wave = Math.sin(t * 7) * 6; poly([[3, fy], [70, fy + 14 + wave], [3, fy + 34]], GREEN, INK, 2); cv.restore(); }
function confetti(t, t0, gx, gy) { const dt = t - t0; if (dt < 0 || dt > 1.6) return; const [x, y] = iso(gx, gy, 1); const C = [GREEN, LIME, AMBER, LIL, RED];
  for (let i = 0; i < 36; i++) { const a = -Math.PI / 2 + (rnd(i) - 0.5) * 2.2, v = 220 + rnd(i * 3) * 260, px = x + Math.cos(a) * v * dt, py = y - 120 + Math.sin(a) * v * dt + 420 * dt * dt; cv.save(); cv.globalAlpha = 1 - dt / 1.6; cv.translate(px, py); cv.rotate(dt * 8 + i); rr(-5, -3, 10, 6, 2, C[i % 5]); cv.restore(); } }
function barrier(t) { const [x, y] = iso(8.5, 8.35, 1), k = cl(pop(t - ws(57) + 0.05, 16, 0.5), 0, 1.1); cv.save(); cv.translate(x, y); rr(-70, -60, 10, 60, 3, '#555'); rr(60, -60, 10, 60, 3, '#555');
  cv.save(); cv.translate(-65, -52); cv.rotate(lerp(-1.4, 0, k)); for (let i = 0; i < 7; i++) rr(i * 19, -8, 19, 16, 3, i % 2 ? WHITE : RED); rr(0, -8, 133, 16, 4, null, INK, 2); cv.restore(); cv.restore(); }
function fog(t) { const [x, y] = iso(3.5, 7.75, 1); for (let i = 0; i < 9; i++) { const px = x + (rnd(i) - 0.5) * 260 + Math.sin(t * 0.6 + i) * 22, py = y - 40 - rnd(i * 3) * 90 + Math.cos(t * 0.5 + i) * 10; ell(px, py, 60 + rnd(i * 5) * 40, 30 + rnd(i * 7) * 16, 'rgba(255,255,255,0.72)'); } }
function stampX(t) { const k = pop(t - ws(65) + 0.02, 13, 0.5); if (k <= 0) return; const [x, y] = iso(3.5, 7.75, 1); cv.save(); cv.translate(x, y - 70); cv.scale(lerp(1.8, 1, cl(k)), lerp(1.8, 1, cl(k))); cv.globalAlpha = cl(k * 2);
  line([[-50, -50], [50, 50]], RED, 22); line([[50, -50], [-50, 50]], RED, 22); cv.restore(); }
// the 50 tiles: a bridge from the amber island to BacktestLab, built row by row
const TILE = (i) => ({ gx: 15 + Math.floor(i / 5) * 0.5, gy: 0.75 + (i % 5) * 0.5 });
function tiles(t) { for (let i = 0; i < 50; i++) { const t0 = ws(69) - 0.05 + i * 0.03, k = t - t0; if (k < 0) continue; const { gx, gy } = TILE(i), drop = (1 - cl(pop(k, 16, 0.6), 0, 1.04)) * 2.5;
  block({ x: gx + 0.02, y: gy + 0.02, w: 0.46, d: 0.46, h: 1 + drop, kind: 'bridge', col: VIO, top: i % 3 ? '#B8A6FF' : '#D2C6FF' }, t); } }
function building(t) {
  block({ x: 22.6, y: 0, w: 2, d: 1.8, h: 3.6, kind: 'tower', base: 1, col: '#D9D0FF', top: '#E8E2FF' }, t); // the lab: a tall block
  poly([iso(22.6, 0, 3.6), iso(24.6, 0, 3.6), iso(24.6, 1.8, 3.6), iso(22.6, 1.8, 3.6)], '#7B5CFF');
  const [x, y] = iso(23.6, 1.8, 2.7); if (IMG.icon) { cv.drawImage(IMG.icon, x - 44, y - 44, 88, 88); }
  for (let i = 0; i < 3; i++) { const [wx, wy] = iso(24.6, 0.4 + i * 0.5, 1.8); poly([[wx, wy], [wx + 30, wy + 15], [wx + 30, wy - 35], [wx, wy - 50]], 'rgba(200,230,255,0.85)', INK, 1.5); }
}
const RRW = [330, 230, 860, 500], QPOS = [800, 340, 328, 284], A_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'];
function billboard(t) {
  const [x, y] = iso(21.2, 0.6, 1), bw = 360, bh = (bw * RRW[3]) / RRW[2];
  cv.save(); cv.translate(x, y); rr(-110, -40, 10, 40, 3, '#3B2E6B'); rr(100, -40, 10, 40, 3, '#3B2E6B');
  rr(-bw / 2 - 12, -40 - bh - 24, bw + 24, bh + 24, 14, '#1E1832', INK, 2.5);
  const key = t < ws(77) - 0.04 ? A_KEYS[Math.min(5, Math.floor(cl((t - T.lab) / (ws(77) - 0.04 - T.lab)) * 6))] : 'cp', im = IMG[key], sx = -bw / 2, sy = -40 - bh - 12;
  if (im) { const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(sx, sy, bw, bh, 6); cv.clip(); cv.drawImage(im, RRW[0] * s, RRW[1] * s, RRW[2] * s, RRW[3] * s, sx, sy, bw, bh); cv.restore(); }
  if (key === 'cp') { const kr = cub(k01(t, ws(77), 0.3)), s = bw / RRW[2], m = 4 * (1 - kr) + 3; cv.save(); cv.globalAlpha *= kr; cv.strokeStyle = LIME; cv.lineWidth = 3; cv.shadowColor = rgba(LIME, 0.8); cv.shadowBlur = 8; cv.beginPath(); cv.roundRect(sx + (QPOS[0] - RRW[0]) * s - m, sy + (QPOS[1] - RRW[1]) * s - m, QPOS[2] * s + 2 * m, QPOS[3] * s + 2 * m, 5); cv.stroke(); cv.restore(); }
  cv.restore();
}
function bubble(gx, gy, gz, k, fn) { if (k <= 0) return; const [x, y] = iso(gx, gy, gz); cv.save(); cv.translate(x + 40, y - 190); cv.scale(cl(k, 0, 1.15), cl(k, 0, 1.15)); circle(0, 0, 34, WHITE, INK, 2.5); circle(-24, 34, 7, WHITE, INK, 2); circle(-34, 50, 4, WHITE, INK, 2); fn(); cv.restore(); }

// ---------- the camera: glides between beats ----------
const KEYS = () => [[0, [110, 125, 1.85]], [T.see, [330, 210, 1.2]], [T.three - 0.1, [460, 300, 0.74]], [T.a1, [900, 120, 1.55]], [T.a2, [890, 520, 1.55]], [T.a3, [70, 560, 1.55]],
  [T.all, [380, 360, 0.64]], [T.week, [1180, 620, 0.95]], [T.lab - 0.05, [1520, 820, 1.5]], [ws(76), [1570, 760, 2.25]], [T.cta, [1600, 860, 1.45]], [T.end, [1600, 860, 1.25]]];
function camAt(t) { const K = KEYS(); let i = 0; K.forEach((k, j) => { if (t >= k[0]) i = j; }); const a = K[i][1], b = i + 1 < K.length ? K[i + 1][1] : a, t0 = K[i][0];
  const k = eio(k01(t, t0, 0.9)), prev = i > 0 ? K[i - 1][1] : a; const from = prev, to = a; const c = [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)];
  return [c[0] + Math.sin(t * 0.5) * 6, c[1] + Math.cos(t * 0.4) * 5, c[2] * (1 + 0.012 * Math.sin(t * 0.3))]; }

// ---------- the characters over time ----------
const HUB = [7.6, 2];
function people(t) {
  const out = [], split = ws(18) - 0.05, arrive = T.a1 + 0.4;
  // the main trader (he becomes the amber copy and walks on to the lab)
  let m;
  if (t < ws(10) + 0.15) m = { p: [2.7, 2], walking: false, dx: 1 };
  else if (t < split) m = along([[2.7, 2], [4.2, 2], [6.2, 2], HUB], ws(10) + 0.15, T.three - 0.1, t);
  else if (t < T.week) m = along([HUB, [10.5, 2], [12.4, 2], [13.2, 2]], split + 0.15, arrive, t);
  else m = along([[13.2, 2], [15.1, 2], [17.5, 2], [20.4, 2], [21.6, 2.3]], ws(69) + 0.45, T.lab + 0.5, t);
  const face = t < ws(10) ? 'scared' : t < split ? 'curious' : t < ws(44) ? 'calm' : 'happy';
  out.push({ g: m.p, st: { face, bag: 1 - 0.6 * sm(k01(t, ws(44) - 0.05, 0.5)), shake: t < ws(10) ? 1.6 * win(t, ws(6), ws(10), 0.3) + 0.6 : 0, walk: m.walking, flip: m.dx < 0, jump: t > T.cta ? Math.max(0, Math.sin((t - T.cta) * 6)) * 22 * (t < T.end + 1 ? 1 : 0) : 0, thumb: t > ws(80) - 0.1, tint: t > split && t < T.week ? AMBER : null, seed: 1 } });
  // the copies: green and red, from the split until the bridge is built
  if (t > split && t < T.week + 0.4) {
    const fadeIn = cub(k01(t, split, 0.35)), fadeOut = 1 - k01(t, T.week, 0.35);
    const g = along([HUB, [8.5, 0.2], [8.5, -2.4], [8.5, -3.6]], split + 0.15, arrive, t);
    out.push({ g: g.p, st: { face: t > ws(23) ? 'happy' : 'calm', walk: g.walking, flip: g.dx < 0, tint: GREEN, alpha: fadeIn * fadeOut, jump: t > ws(29) && t < ws(29) + 0.9 ? Math.abs(Math.sin((t - ws(29)) * 7)) * 26 : 0, seed: 2 } });
    const r1 = along([HUB, [8.5, 3.8], [8.5, 6.2], [8.5, 7.2]], split + 0.15, arrive, t), r2 = along([[8.5, 7.2], [8.5, 8.05]], T.a3 + 0.3, ws(57), t), r = t < T.a3 + 0.3 ? r1 : r2;
    out.push({ g: r.p, st: { face: t > ws(57) && t < ws(59) ? 'scared' : t >= ws(59) ? 'happy' : 'calm', walk: r.walking, flip: false, tint: RED, alpha: fadeIn * fadeOut, money: true, seed: 3 } });
  }
  // the fourth copy: into the fog
  if (t > T.all && t < ws(65) + 0.3) { const f = along([[8.2, 7.5], [6.8, 7.5], [4.8, 7.5], [3.6, 7.6]], T.all + 0.1, ws(64) + 0.1, t);
    out.push({ g: f.p, st: { face: 'curious', walk: f.walking, flip: true, tint: GREY, alpha: cub(k01(t, T.all, 0.3)) * (1 - k01(t, ws(64) - 0.2, 0.5)), seed: 4 } }); }
  return out;
}

// ---------- the stickers (words) ----------
function sticker(s, x, y, size, k, o = {}) {
  if (k <= 0) return; const w = measure(s, size, 900) + size * 0.9, h = size * 1.55;
  cv.save(); cv.translate(x, y); cv.rotate((o.rot ?? 0) * (1 - 0.3 * cl(k))); cv.scale(cl(k, 0, 1.12), cl(k, 0, 1.12));
  rr(-w / 2 + 7, -h / 2 + 9, w, h, h * 0.32, INK); rr(-w / 2, -h / 2, w, h, h * 0.32, o.bg ?? WHITE, INK, 4); txt(s, 0, size * 0.05, size, o.fg ?? INK, { w: 900 }); cv.restore();
}
function stickers(t) {
  const S = [[-1, T.see, 'به استراتژیت اعتماد داری؟', 'یا از بررسیش می‌ترسی؟', RED], [T.see, T.three, 'بیا ببینیم', 'از چی می‌ترسی؟', RED], [T.three, T.a1, 'بررسیش فقط', '۳ تا جواب داره', VIO],
    [T.a1, T.a2, 'اول: کار می‌کنه', 'با خیال راحت ادامه بده', GREEN], [T.a2, T.a3, 'دوم: با ریسک کمتر کار می‌کنه', 'حجمتو درست کن', AMBER], [T.a3, T.all, 'سوم: کار نمی‌کنه', 'قبل از ضرر فهمیدی', RED],
    [T.all, T.week, 'هر ۳ تاش', 'از ندونستن بهتره', GREEN], [T.week, T.lab, 'این هفته فقط', '۵۰ معامله‌ی گذشته', VIO], [T.lab, T.cta, 'توی بک‌تست‌لب', 'تست کن', VIO], [T.cta, T.end, 'شروعش رایگانه', 'لینک توی بیو 👇', GREEN]];
  S.forEach(([a, b, l1, l2, col], i) => { if (t < a - 0.05 || t > b + 0.05) return; const out = 1 - k01(t, b - 0.12, 0.12);
    sticker(l1, CX, 300, 62, pop(t - a + (i ? 0 : 1), 13, 0.55) * out, { rot: -0.03 });
    sticker(l2, CX, 420, 58, pop(t - a - 0.15 + (i ? 0 : 1), 13, 0.55) * out, { rot: 0.025, bg: col, fg: col === AMBER || col === LIME ? INK : WHITE }); });
}
function endCard(t) {
  const k = cub(k01(t, T.end, 0.35)); if (k <= 0) return;
  cv.save(); cv.globalAlpha = k; const y = lerp(380, 300, k);
  rr(170 + 8, y + 10, 740, 470, 46, INK); rr(170, y, 740, 470, 46, WHITE, INK, 4);
  if (IMG.icon) cv.drawImage(IMG.icon, CX - 75, y + 34, 150, 150);
  if (IMG.word) { const w = 420, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, CX - w / 2, y + 200, w, h); }
  cv.restore();
  sticker('شروعش رایگانه', CX, 300 + 360, 50, pop(t - T.end - 0.3, 13, 0.55), { bg: GREEN, fg: WHITE, rot: -0.03 });
  sticker('لینک توی بیو 👇', CX, 300 + 480, 46, pop(t - T.end - 0.5, 13, 0.55), { bg: LIME, rot: 0.03 });
}

// ---------- the sky ----------
function sky(t) {
  const g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E4DDFF'); g.addColorStop(0.55, '#F3E9FF'); g.addColorStop(1, '#FFE4D6'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) { const x = ((rnd(i) * 1400 + t * (8 + rnd(i * 3) * 10)) % 1500) - 200, y = 300 + rnd(i * 5) * 1400, s = 0.6 + rnd(i * 7) * 0.9;
    cv.save(); cv.globalAlpha = 0.55; [[0, 0, 90], [70, -20, 70], [-70, -10, 60], [30, 20, 70]].forEach(([dx, dy, r]) => ell(x + dx * s, y + dy * s, r * s, r * 0.6 * s, WHITE)); cv.restore(); }
}

// ---------- frame ----------
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; sky(t);
  const [cx, cy, z] = camAt(t); cv.setTransform(z, 0, 0, z, CX - cx * z, CY - cy * z);
  // islands and bridges, far to near
  const all = [...Object.entries(ISL), ...Object.entries(BR)].map(([k, b]) => ({ k, b: k === 'F' ? { ...b, sink: 0.6 * cub(k01(t, ws(65), 0.6)) } : b })).sort((p, q) => p.b.x + p.b.y - (q.b.x + q.b.y));
  all.forEach(({ b }) => block(b, t));
  if (t > ws(69) - 0.2) tiles(t);
  // props and people, far to near
  const items = [];
  items.push([4.1 + 2, () => gate(t)]);
  items.push([5, () => flag(t)]); items.push([17.1, () => barrier(t)]);
  if (t > T.all - 0.3) items.push([11.8, () => fog(t)]);
  items.push([24, () => building(t)]); items.push([21.8, () => billboard(t)]);
  [[8.8, -4.6, 1, '۱ ادامه', GREEN, ws(18)], [12.4, 0.8, 1, '۲ حجم کمتر', AMBER, ws(18) + 0.12], [7.4, 6.4, 1, '۳ توقف', RED, ws(18) + 0.24], [2.4, 6.9, 1, 'ندونستن؟', GREY, T.all + 0.1]].forEach(([gx, gy, gz, s, col, t0]) => items.push([gx + gy - 0.5, () => sign(gx, gy, gz, s, col, pop(t - t0, 13, 0.55), t)]));
  people(t).forEach(({ g, st }) => items.push([g[0] + g[1] + 0.3, () => { const [x, y] = iso(g[0], g[1], 1); trader(x, y, st, t); }]));
  items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());
  // thought bubbles and effects on top
  if (t < T.see + 0.3) bubble(2.7, 2, 1, pop(t + 1, 12, 0.6) * (1 - k01(t, T.see, 0.25)), () => txt('؟', 0, 4, 44, RED, { w: 900 }));
  if (t > ws(59) - 0.05 && t < T.all + 0.3) bubble(8.5, 8.05, 1, pop(t - ws(59) + 0.05, 13, 0.5) * (1 - k01(t, T.all, 0.25)), () => line([[-12, 0], [-3, 10], [14, -10]], GREEN, 7));
  if (t > T.a2 && t < T.a3) bubble(13.2, 2, 1, pop(t - ws(44) + 0.05, 13, 0.5) * (1 - k01(t, T.a3 - 0.2, 0.2)), () => { rr(-14, -6, 28, 16, 5, LIME, INK, 2); line([[0, -18], [0, -10]], INK, 3); });
  confetti(t, ws(29), 8.5, -3.5); stampX(t);
  // the split: a flash where he stands
  { const k = 1 - k01(t, ws(18) - 0.05, 0.5); if (k < 1 && k > 0) { const [x, y] = iso(HUB[0], HUB[1], 1); cv.save(); cv.globalAlpha = k; circle(x, y - 70, 40 + (1 - k) * 120, null, LIME, 8); cv.restore(); } }
  cv.setTransform(1, 0, 0, 1, 0, 0);
  stickers(t); endCard(t);
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(42,33,64,0.1)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = VIO; cv.fillRect(W * (1 - k), 0, W * k, 8); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
window.cover = () => frame(2.2, { cover: true });
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await document.fonts.load('40px "Noto Color Emoji"', '👇');
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  window.seek(0); window.ready = true;
});
