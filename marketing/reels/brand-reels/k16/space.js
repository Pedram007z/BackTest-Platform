// k16 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟», 3D type in space, on the user's voice.
// A light studio with a floor that runs to the horizon. Every word is a solid block of type: each line hangs flat and
// grey first, and each word pops out in 3D (extruded toward the back, with a small hop) as it is said. The camera flies
// through space from one line to the next, so the last line rushes past it.
//   - the hook: the whole question, readable on the first frame; a magnifier and a «؟» on the floor;
//   - «بیا ببینیم…»: question marks at three depths (parallax);
//   - «سه تا جواب»: a huge «۳» and three tiles rising from the floor: a green check, an amber risk knob, a red cross;
//   - each answer: the camera pans to its tile (the knob turns down on «ریسک کمتر»; a bill stops short of the red tile
//     on «قبل از اینکه پولتو بگیره»);
//   - «هر سه تاش از ندونستن بهتره»: the camera pulls back to all three, «ندونستن» is struck through, a grey «؟» fades;
//   - «این هفته فقط ۵۰ تا معامله…»: 50 cubes drop onto the floor;
//   - «توی بک‌تست‌لب تست کن»: the camera glides over them to the real gold replay (k13's screens);
//   - the free start and the end card.
// The camera only moves (it never turns), so every plane facing it stays undistorted. 1080×1920, every frame a pure
// function of t (window.seek). Key content inside y 230–1500.
const W = 1080, H = 1920, CX = 540, CY = 960, F = 1000, FLOOR = 420, NEAR = 60;
const INK = '#1A1430', VIO = '#6C47FF', GRN = '#12A06C', RED = '#EE3D58', AMB = '#F29A0B', LIME = '#C6F24E', WHITE = '#FFFFFF', GREY = '#A69EBB', GHOST = '#958CB0';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- 2D helpers ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = 'center'; cv.textBaseline = 'middle'; cv.direction = isL(s) ? 'ltr' : 'rtl'; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, k) => { const p = hx(a), q = hx(b); return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const SIDES = { [INK]: ['#4A3A8C', '#2C2160'], [WHITE]: ['#D9D3E8', '#B9B1CC'], [GREY]: ['#857C9C', '#6A6283'] };
const sidesOf = (c) => SIDES[c] ?? (SIDES[c] = [mix(c, '#000000', 0.3), mix(c, '#000000', 0.5)]);
function chip(s, x, y, size, fg, bg) { const w = measure(s, size, 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg); txt(s, x, y + size * 0.04, size, fg, { w: 800 }); }
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];

// ---------- the camera: it only moves ----------
const CAMS = { hook: [0, 0, 0], see: [0, 0, 2200], three: [0, 0, 4400], a1: [330, 120, 4780], a2: [0, 120, 4780], a3: [-330, 120, 4780], all: [0, -90, 4250], week: [0, 0, 7600], lab: [0, 0, 9900], cta: [0, 0, 12100], end: [0, 170, 12350] };
const DRIFT = { all: [0, -40, -120], end: [0, 0, 40] };   // every other scene pushes in by DRIFT_Z
const DRIFT_Z = 70;
let CAM = [0, 0, 0], GA = 1;
function camAt(t) {
  let i = 0; for (let j = 0; j < SC.length; j++) if (t >= SC[j].t0 - 0.14) i = j;
  const s = SC[i], dr = DRIFT[s.k] ?? [0, 0, DRIFT_Z], kd = cub(k01(t, s.t0, Math.max(0.6, s.t1 - s.t0)));
  let p = CAMS[s.k].map((v, a) => v + dr[a] * kd);
  if (i > 0) { const pv = SC[i - 1], pd = DRIFT[pv.k] ?? [0, 0, DRIFT_Z], from = CAMS[pv.k].map((v, a) => v + pd[a]), k = exIO(k01(t, s.t0 - 0.14, 0.5)); p = p.map((v, a) => lerp(from[a], v, k)); }
  return [p[0] + Math.sin(t * 0.9) * 7, p[1] + Math.cos(t * 0.7) * 5, p[2]];
}
function P(x, y, z) { const d = z - CAM[2]; if (d < NEAR) return null; const s = F / d; return { X: CX + (x - CAM[0]) * s, Y: CY + (y - CAM[1]) * s, s, d }; }
const fadeD = (d) => cl((d - 150) / 360) * cl(1 - (d - 3400) / 2600);
const alphaAt = (p, a = 1) => GA * a * fadeD(p.d);

// ---------- the studio ----------
function studio(t, tint) {
  let g = cv.createLinearGradient(0, 0, 0, CY); g.addColorStop(0, '#F7F4FC'); g.addColorStop(1, '#E7E1F3'); cv.fillStyle = g; cv.fillRect(0, 0, W, CY);
  g = cv.createLinearGradient(0, CY, 0, H); g.addColorStop(0, '#DED7EE'); g.addColorStop(1, '#C9BFE0'); cv.fillStyle = g; cv.fillRect(0, CY, W, H - CY);
  tint.forEach(([col, a]) => { if (a <= 0.002) return; const r = cv.createRadialGradient(CX, CY - 60, 40, CX, CY - 60, 1000); r.addColorStop(0, rgba(col, 0.28 * a)); r.addColorStop(1, rgba(col, 0)); cv.fillStyle = r; cv.fillRect(0, 0, W, H); });
  const gy = FLOOR - CAM[1], dNear = Math.max(NEAR + 5, (gy * F) / (H - CY + 60)), dFar = 9000;
  cv.save(); cv.lineWidth = 2;
  for (let k = -16; k <= 16; k++) { const x = Math.round(CAM[0] / 300) * 300 + k * 300, a = P(x, FLOOR, CAM[2] + dNear), b = P(x, FLOOR, CAM[2] + dFar); if (!a || !b) continue;
    const lg = cv.createLinearGradient(a.X, a.Y, b.X, b.Y); lg.addColorStop(0, 'rgba(70,45,150,0.16)'); lg.addColorStop(1, 'rgba(70,45,150,0)'); cv.strokeStyle = lg; cv.beginPath(); cv.moveTo(a.X, a.Y); cv.lineTo(b.X, b.Y); cv.stroke(); }
  for (let z = Math.ceil((CAM[2] + dNear) / 300) * 300; z < CAM[2] + dFar; z += 300) { const a = P(CAM[0] - 6000, FLOOR, z), b = P(CAM[0] + 6000, FLOOR, z); if (!a) continue;
    cv.strokeStyle = `rgba(70,45,150,${0.16 * cl(1 - (z - CAM[2]) / dFar)})`; cv.beginPath(); cv.moveTo(a.X, a.Y); cv.lineTo(b.X, b.Y); cv.stroke(); }
  cv.restore();
  g = cv.createLinearGradient(0, CY - 70, 0, CY + 90); g.addColorStop(0, 'rgba(247,244,252,0)'); g.addColorStop(0.45, 'rgba(247,244,252,0.85)'); g.addColorStop(1, 'rgba(247,244,252,0)'); cv.fillStyle = g; cv.fillRect(0, CY - 70, W, 160);
  // dust in the air: it streaks past as the camera flies
  cv.fillStyle = 'rgba(90,60,180,0.22)';
  for (let i = 0; i < 420; i++) { const z = rnd(i * 3.1) * 15000, p = P((rnd(i * 1.7) - 0.5) * 3200, -1000 + rnd(i * 2.3) * 1380, z); if (!p || p.d > 5200) continue; cv.globalAlpha = fadeD(p.d); const r = Math.max(1.2, 5 * p.s); cv.fillRect(p.X - r / 2, p.Y - r / 2, r, r); }
  cv.globalAlpha = 1;
}
function shadow(x, z, w, a = 1) { const p = P(x, FLOOR, z); if (!p) return; cv.save(); cv.globalAlpha = alphaAt(p, a); cv.translate(p.X, p.Y); cv.scale(1, 0.2); const r = w * 0.62 * p.s;
  const g = cv.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(40,20,90,0.32)'); g.addColorStop(1, 'rgba(40,20,90,0)'); cv.fillStyle = g; cv.fillRect(-r, -r, 2 * r, 2 * r); cv.restore(); }

// ---------- solids ----------
/** An extruded rounded block facing the camera; glyph() draws on its front in world units around its centre. */
function block(x, y, z, w, h, depth, face, glyph, a = 1, r = 0.22) {
  if (a <= 0.003) return; const sd = sidesOf(face), N = depth > 1 ? Math.min(12, Math.max(3, Math.round(depth / 7))) : 0;
  for (let k = N; k >= 1; k--) { const p = P(x, y, z + (depth * k) / N); if (!p) continue; cv.globalAlpha = alphaAt(p, a); rrect(p.X - (w * p.s) / 2, p.Y - (h * p.s) / 2, w * p.s, h * p.s, Math.min(w, h) * r * p.s, k > N * 0.55 ? sd[1] : sd[0]); }
  const p = P(x, y, z); if (!p) return; cv.globalAlpha = alphaAt(p, a); rrect(p.X - (w * p.s) / 2, p.Y - (h * p.s) / 2, w * p.s, h * p.s, Math.min(w, h) * r * p.s, face);
  if (glyph) { cv.save(); cv.translate(p.X, p.Y); cv.scale(p.s, p.s); glyph(); cv.restore(); }
  cv.globalAlpha = 1;
}
const WC = {};
function wordImg(s, px, col) { const k = `${s}|${px}|${col}`; if (WC[k]) return WC[k]; const tw = measure(s, px), c = mkC(tw + px * 0.6, px * 1.7), g = c.getContext('2d');
  g.font = FONT(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = isL(s) ? 'ltr' : 'rtl'; g.fillStyle = col; g.fillText(s, c.width / 2, c.height / 2 + px * 0.04); return (WC[k] = c); }
/** Extruded text at (x, y, z), world size S, extruded depth. */
function solidText(s, x, y, z, S, depth, face, a = 1, ghostK = 0) {
  if (a <= 0.003) return; const base = Math.min(400, Math.round(S * 1.15)), sd = sidesOf(face), N = depth > 1 ? Math.min(10, Math.max(3, Math.round(depth / 4))) : 0;
  const draw = (img, p, al) => { if (al <= 0.003) return; const sc = (S * p.s) / base, w = img.width * sc, h = img.height * sc; cv.globalAlpha = al; cv.drawImage(img, p.X - w / 2, p.Y - h / 2, w, h); };
  for (let k = N; k >= 1; k--) { const p = P(x, y, z + (depth * k) / N); if (p) draw(wordImg(s, base, k > N * 0.7 ? sd[1] : sd[0]), p, alphaAt(p, a * (1 - ghostK))); }
  const p = P(x, y, z); if (!p) return;
  if (ghostK > 0) draw(wordImg(s, base, GHOST), p, alphaAt(p, a * ghostK));
  draw(wordImg(s, base, face), p, alphaAt(p, a * (1 - ghostK))); cv.globalAlpha = 1;
}

// ---------- the story's words ----------
const L_ = (y, size, c, toks, o = {}) => ({ y, size, c, toks, ...o });
function layout(ln) {
  if (ln._L) return ln._L;
  const items = ln.toks.map(([s, wi, o = {}]) => { const S = o.size ?? ln.size, tw = measure(s, S); return { s, wi: Array.isArray(wi) ? wi[0] : wi, o, S, tw, col: o.c ?? ln.c }; });
  const gap = ln.size * 0.42, total = items.reduce((a, b) => a + b.tw + (b.o.plate ? b.S * 0.5 : 0), 0) + gap * (items.length - 1), sc = Math.min(1, 830 / total);
  let right = total / 2; items.forEach((it) => { const ww = it.tw + (it.o.plate ? it.S * 0.5 : 0); it.dx = (right - ww / 2) * sc; right -= ww + gap; it.sc = sc; });
  return (ln._L = { items, sc });
}
function drawWord(it, x, y, z, t, offA) {
  const t0 = ws(it.wi) - 0.04, k = cl((t - t0) / 0.08), pk = pop(t - t0, 15, 0.5), hop = 45 * Math.sin(cl((t - t0) / 0.32) * Math.PI) * (t > t0 ? 1 : 0), S = it.S * it.sc, zz = z - hop;
  if (it.o.plate) { const kp = cl(pk, 0, 1.15), pw = (it.tw + it.S * 0.5) * it.sc * kp, ph = S * 1.3 * kp; if (kp > 0.01) block(x, y + S * 0.04, zz + 10, pw, ph, S * 0.2 * kp, it.o.plate, null, offA, 0.2); }
  const face = it.o.plate && k > 0 ? it.o.pc ?? WHITE : it.col;
  solidText(it.s, x, y, it.o.plate ? zz - 2 : zz, S, S * 0.13 * cl(pk, 0, 1.3), face, offA, 1 - k);
  if (it.o.strike) { const ks = cub(k01(t, ws(it.o.strike) - 0.04, 0.25)), w = it.tw * it.sc * 1.06 * ks; if (ks > 0) block(x + (it.tw * it.sc * 1.06) / 2 - w / 2, y + S * 0.02, zz - 20, w, S * 0.15, 26, RED, null, offA, 0.5); }
}
/** Queue a scene's lines: each line hangs flat from just before its first word; it is gone before the next one appears. */
function queueWords(s, t) {
  const cam = CAMS[s.k];
  s.groups.forEach((g, gi) => {
    const next = s.groups[gi + 1], first = s === SC[0] && gi === 0, start = (gi === 0 ? s.t0 + 0.02 : ws(g.at)) - 0.06, end = next ? ws(next.at) - 0.13 : s.t1 - 0.06;
    if ((!first && t < start) || t > end + 0.1) return;
    const offA = (first ? 1 : cub(k01(t, start, 0.06))) * (1 - k01(t, end, 0.1));
    g.lines.forEach((ln, li) => { const L = layout(ln), z = cam[2] + 1000, y = cam[1] + (ln.y - CY);
      L.items.forEach((it) => q(z, () => drawWord(it, cam[0] + it.dx, y, z, t, offA))); });
  });
}

// ---------- props (they live in the world and are seen from several scenes) ----------
let Q = [];
const q = (z, fn) => Q.push([z, GA, fn]);
const ICON_Z = 5400, ICON_Y = 285, ICON_X = [330, 0, -330], ICON_S = 260;
function glyphCheck() { cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 30; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-62, 4); cv.lineTo(-16, 48); cv.lineTo(66, -50); cv.stroke(); cv.restore(); }
function glyphCross() { cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 30; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(-54, -54); cv.lineTo(54, 54); cv.moveTo(54, -54); cv.lineTo(-54, 54); cv.stroke(); cv.restore(); }
const glyphKnob = (ang) => () => { circle(0, 0, 86, WHITE); for (let k = 0; k < 7; k++) { const a = Math.PI * (0.75 + (k / 6) * 1.5); cv.save(); cv.strokeStyle = mix(AMB, '#000000', 0.25); cv.lineWidth = 9; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(Math.cos(a) * 100, Math.sin(a) * 100); cv.lineTo(Math.cos(a) * 112, Math.sin(a) * 112); cv.stroke(); cv.restore(); }
  cv.save(); cv.strokeStyle = AMB; cv.lineWidth = 18; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(0, 0); cv.lineTo(Math.cos(ang) * 64, Math.sin(ang) * 64); cv.stroke(); cv.restore(); circle(0, 0, 14, AMB); };
function glyphBill() { rrect(-110, -50, 220, 100, 10, null, 'rgba(255,255,255,0.6)', 6); circle(0, 0, 34, 'rgba(255,255,255,0.9)'); txt('$', 0, 3, 48, '#1F9D63', { dir: 'ltr' }); }
function glyphQ() { txt('؟', 0, 10, 190, WHITE); }
function icons(t) {
  if (t < ws(18) - 0.1 || t > T.week + 0.7) return;
  const active = (i) => { if (t < T.a1 - 0.1 || (t >= T.all - 0.1 && t < T.week)) return 1; if (t >= T.week) return 1; const sc = t < T.a2 - 0.1 ? 0 : t < T.a3 - 0.1 ? 1 : 2; return i === sc ? 1 : 0.32; };
  const bounceAt = [[ws(23), ws(61)], [ws(34), ws(61) + 0.1], [ws(49), ws(61) + 0.2]];
  const knob = lerp(-Math.PI * 0.2, -Math.PI * 1.18, cub(k01(t, ws(40) - 0.05, 0.45)));   // from high (upper right) over the top to low (lower left)
  [[GRN, glyphCheck], [AMB, glyphKnob(knob)], [RED, glyphCross]].forEach(([col, gl], i) => {
    const kp = pop(t - (ws(18) - 0.05 + i * 0.12), 13, 0.55); if (kp <= 0) return;
    const hop = bounceAt[i].reduce((h, b) => h + (t > b ? 70 * Math.sin(cl((t - b) / 0.35) * Math.PI) : 0), 0), x = ICON_X[i], y = ICON_Y - hop - (1 - cl(kp)) * 120, S = ICON_S * cl(kp, 0, 1.15);
    q(ICON_Z + 1, () => shadow(x, ICON_Z, S, active(i)));
    q(ICON_Z, () => block(x, y, ICON_Z, S, S, 70, col, () => { cv.scale(S / ICON_S, S / ICON_S); gl(); }, active(i)));
  });
  // «ندونستن»: a grey «؟» behind them that fades into the haze on «بهتره»
  if (t > T.all - 0.2) { const a = cub(k01(t, T.all, 0.3)) * (1 - 0.85 * cub(k01(t, ws(65), 0.4))); q(6300, () => { shadow(0, 6300, 260, a); block(0, ICON_Y, 6300, 240, 240, 60, GREY, glyphQ, a); }); }
}
/** «قبل از اینکه پولتو بگیره، فهمیدی»: a bill above the red tile drops toward it and stops short; a check pops beside it. */
function bill(t) {
  if (t < ws(57) - 0.1 || t > T.all + 0.3) return;
  const kp = pop(t - ws(57) + 0.04, 13, 0.6), drop = cub(k01(t, ws(58), ws(59) - ws(58))) * (1 - cub(k01(t, ws(59), 0.35))), x = -330, y = 30 + 58 * drop, z = ICON_Z - 10;
  q(z, () => block(x, y, z, 230 * cl(kp, 0, 1.1), 115 * cl(kp, 0, 1.1), 22, '#1F9D63', glyphBill, cl(kp), 0.12));
  const kc = pop(t - ws(59) + 0.02, 13, 0.5); if (kc > 0) q(z - 5, () => block(x + 215, y - 10, z - 5, 110 * cl(kc, 0, 1.2), 110 * cl(kc, 0, 1.2), 30, LIME, () => { cv.save(); cv.strokeStyle = INK; cv.lineWidth = 16; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-28, 2); cv.lineTo(-8, 22); cv.lineTo(30, -22); cv.stroke(); cv.restore(); }, cl(kc), 0.5));
}
function magnifier(x, y, z, R, a, wob) {
  const N = 8, depth = 40, ring = (p, col, glass) => { const r = R * p.s; cv.save(); cv.translate(p.X, p.Y); cv.rotate(wob);
    if (glass) { circle(0, 0, r, 'rgba(255,255,255,0.45)'); cv.strokeStyle = 'rgba(255,255,255,0.9)'; cv.lineWidth = 10 * p.s; cv.lineCap = 'round'; cv.beginPath(); cv.arc(0, 0, r * 0.68, Math.PI * 1.1, Math.PI * 1.45); cv.stroke(); }
    cv.strokeStyle = col; cv.lineWidth = 30 * p.s; cv.beginPath(); cv.arc(0, 0, r, 0, Math.PI * 2); cv.stroke(); cv.lineCap = 'round'; cv.lineWidth = 42 * p.s; cv.beginPath(); cv.moveTo(r * 0.75, r * 0.75); cv.lineTo(r * 1.55, r * 1.55); cv.stroke(); cv.restore(); };
  const sd = sidesOf(VIO); for (let k = N; k >= 1; k--) { const p = P(x, y, z + (depth * k) / N); if (p) { cv.globalAlpha = alphaAt(p, a); ring(p, k > N * 0.55 ? sd[1] : sd[0], false); } }
  const p = P(x, y, z); if (p) { cv.globalAlpha = alphaAt(p, a); ring(p, VIO, true); } cv.globalAlpha = 1;
}
function hookProps(t) {
  if (t > T.see + 0.7) return; const z = 1000, kp = cl(pop(t + 1, 12, 0.6), 0, 1);
  q(z + 31, () => shadow(230, z + 30, 320, 0.8)); q(z + 30, () => magnifier(200, 190 + Math.sin(t * 2.2) * 14, z + 30, 105, kp, Math.sin(t * 1.6) * 0.08));
  q(z + 121, () => shadow(-250, z + 120, 220, 0.8)); q(z + 120, () => solidText('؟', -250, 230 + Math.sin(t * 2.6 + 1) * 12, z + 120, 300, 70, RED, kp));
}
function seeProps(t) {
  if (t < T.see - 0.15 || t > T.three + 0.7) return; const z0 = CAMS.see[2] + 1000;
  [[290, 200, 150, 340, RED], [-280, 150, -220, 230, VIO], [20, 250, 520, 260, INK]].forEach(([x, y, dz, S, col], i) => { const kp = pop(t - (T.see + 0.05 + i * 0.1), 13, 0.55); if (kp <= 0) return; const z = z0 + dz;
    q(z + 1, () => shadow(x, z, S * 0.7, cl(kp))); q(z, () => solidText('؟', x, y + Math.sin(t * 2.4 + i) * 12, z, S * cl(kp, 0, 1.15), 60, col, cl(kp))); });
}
const CUBE_Z = 8750;
function cubes(t) {
  if (t < ws(69) - 0.15 || t > T.lab + 0.8) return;
  for (let i = 0; i < 50; i++) { const r = Math.floor(i / 10), c = i % 10, x = (4.5 - c) * 112, z = CUBE_Z + r * 112, t0 = ws(69) - 0.1 + i * 0.02, k = t - t0; if (k < 0) continue;
    const y = FLOOR - 42 - (1 - cl(pop(k, 14, 0.6), 0, 1.05)) * 700;
    q(z + 1, () => shadow(x, z, 90, cl(k / 0.2))); q(z, () => block(x, y, z, 84, 84, 84, i % 3 ? VIO : '#8B6CFF', null, cl(k / 0.08), 0.18)); }
}
// the real gold replay (k13's screens): RR is the chart's right part in the 1440×900 capture
const RR = [440, 215, 750, 560], QPOS = [800, 340, 328, 284], A_KEYS = Array.from({ length: 6 }, (_, i) => 'a' + i);
const PANEL_Z = CAMS.lab[2] + 1000, PANEL_Y = -10, PANEL_W = 940, PANEL_H = (940 * 560) / 750;
function panel(t) {
  if (t < T.lab - 0.5 || t > T.cta + 0.7) return;
  const key = t < ws(77) - 0.04 ? FLIP(t, T.lab - 0.1, ws(77) - 0.04, A_KEYS) : 'cp';
  q(PANEL_Z + 2, () => shadow(0, PANEL_Z + 60, PANEL_W, 0.7));
  q(PANEL_Z, () => {
    block(0, PANEL_Y, PANEL_Z, PANEL_W + 44, PANEL_H + 44, 50, '#15121D', null, 1, 0.04);
    const p = P(0, PANEL_Y, PANEL_Z - 1); if (!p) return; const w = PANEL_W * p.s, h = PANEL_H * p.s, x = p.X - w / 2, y = p.Y - h / 2, im = IMG[key];
    cv.globalAlpha = alphaAt(p); if (im) { const sc = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 10 * p.s); cv.clip(); cv.drawImage(im, RR[0] * sc, RR[1] * sc, RR[2] * sc, RR[3] * sc, x, y, w, h); cv.restore(); }
    if (key === 'cp') { const k = cub(k01(t, ws(77), 0.3)), s = w / RR[2], m = 8 * p.s; cv.save(); cv.globalAlpha = alphaAt(p, k); cv.strokeStyle = LIME; cv.lineWidth = 7 * p.s; cv.shadowColor = rgba(LIME, 0.8); cv.shadowBlur = 16;
      cv.beginPath(); cv.roundRect(x + (QPOS[0] - RR[0]) * s - m, y + (QPOS[1] - RR[1]) * s - m, QPOS[2] * s + 2 * m, QPOS[3] * s + 2 * m, 14 * p.s); cv.stroke(); cv.restore(); }
    if (IMG.icon) { const r = 62 * p.s; cv.globalAlpha = alphaAt(p); cv.drawImage(IMG.icon, x + w - r * 1.2, y - r * 0.8, r * 2, r * 2); }
    cv.globalAlpha = alphaAt(p, 0.75); txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', p.X, y + h + 56 * p.s, 28 * p.s, INK, { w: 700 }); cv.globalAlpha = 1;
  });
}
const LOGO_Z = CAMS.cta[2] + 1000, LOGO_Y = 230;
function logo(t) {
  if (t < T.cta - 0.4) return; const kp = pop(t - T.cta - 0.05, 12, 0.55); if (kp <= 0) return; const S = 300 * cl(kp, 0, 1.15), y = LOGO_Y + Math.sin(t * 2) * 10;
  q(LOGO_Z + 1, () => shadow(0, LOGO_Z, S * 1.1, cl(kp)));
  q(LOGO_Z, () => block(0, y, LOGO_Z, S, S, 80, '#5A36F0', () => { if (IMG.icon) cv.drawImage(IMG.icon, -S / 2, -S / 2, S, S); }, cl(kp), 0.23));
}

// ---------- the scenes ----------
const SC = [
  { k: 'hook', tint: VIO, groups: [{ at: 0, lines: [
    L_(300, 116, INK, [['به', 0], ['استراتژیت', 1, { c: VIO }]]),
    L_(470, 176, INK, [['اعتماد', 2, { c: GRN }], ['داری', 3]]),
    L_(640, 110, INK, [['یا', 4], ['از', 5], ['بررسی', 6, { c: VIO }], ['کردنش', 7]]),
    L_(835, 196, RED, [['می‌ترسی؟', [8, 9], { plate: RED, pc: WHITE }]])] }] },
  { k: 'see', tint: RED, groups: [{ at: 10, lines: [L_(390, 150, INK, [['بیا', 10], ['ببینیم', 11]]), L_(600, 150, INK, [['از', 12], ['چی', 13, { c: VIO }], ['می‌ترسی؟', [14, 15], { c: RED }]])] }] },
  { k: 'three', tint: LIME, groups: [{ at: 16, lines: [L_(270, 120, INK, [['بررسیش', 16], ['فقط', 17]]), L_(500, 150, INK, [['۳', 18, { size: 300, c: VIO }], ['تا', 19], ['جواب', 20, { c: VIO }]]), L_(735, 110, INK, [['داره.', 21]])] }] },
  { k: 'a1', tint: GRN, groups: [{ at: 22, lines: [
    L_(280, 120, INK, [['یا', 22], ['کار', 23, { c: GRN }], ['می‌کنه،', [24, 25], { c: GRN }]]), L_(445, 120, INK, [['پس', 26], ['با', 27], ['خیال', 28], ['راحت', 29, { plate: GRN, pc: WHITE }]]), L_(615, 120, INK, [['ادامه', 30], ['می‌دی.', [31, 32]]])] }] },
  { k: 'a2', tint: AMB, groups: [
    { at: 33, lines: [L_(290, 120, INK, [['یا', 33], ['کار', 34], ['می‌کنه', [35, 36]]]), L_(465, 130, INK, [['ولی', 37], ['با', 38], ['ریسک', 39, { c: AMB }], ['کمتر،', [40, 41], { plate: AMB, pc: INK }]])] },
    { at: 42, lines: [L_(300, 120, INK, [['پس', 42], ['فقط', 43]]), L_(480, 150, INK, [['حجمتو', 44, { c: AMB }], ['درست', 45], ['می‌کنی.', [46, 47]]])] }] },
  { k: 'a3', tint: RED, groups: [
    { at: 48, lines: [L_(280, 120, INK, [['یا', 48], ['کار', 49], ['نمی‌کنه،', [50, 51], { c: RED }]]), L_(440, 110, INK, [['پس', 52], ['قبل', 53], ['از', 54], ['اینکه', [55, 56]]]), L_(600, 130, INK, [['پولتو', 57, { c: GRN }], ['بگیره،', 58]])] },
    { at: 59, lines: [L_(440, 220, INK, [['فهمیدی.', 59, { plate: VIO, pc: WHITE }]])] }] },
  { k: 'all', tint: VIO, groups: [{ at: 60, lines: [
    L_(280, 140, INK, [['هر', 60], ['سه', 61, { c: VIO }], ['تاش', 62]]), L_(460, 130, INK, [['از', 63], ['ندونستن', 64, { c: GREY, strike: 65 }]]), L_(650, 180, INK, [['بهتره.', 65, { plate: VIO, pc: WHITE }]])] }] },
  { k: 'week', tint: LIME, groups: [{ at: 66, lines: [
    L_(270, 120, INK, [['این', 66], ['هفته', 67], ['فقط', 68]]), L_(480, 140, INK, [['۵۰', 69, { size: 260, c: VIO }], ['تا', 70]]), L_(690, 120, INK, [['معامله‌ی', 71], ['گذشته‌ش', 72, { c: VIO }], ['رو', 73]])] }] },
  { k: 'lab', tint: VIO, groups: [{ at: 74, lines: [L_(285, 130, INK, [['توی', 74], ['بک‌تست‌لب', [75, 76], { plate: VIO, pc: WHITE }]]), L_(455, 140, INK, [['تست', 77, { c: VIO }], ['کن.', 78]])] }] },
  { k: 'cta', tint: LIME, groups: [{ at: 79, lines: [L_(300, 140, INK, [['شروعش', 79], ['رایگانه.', 80, { plate: LIME, pc: INK }]]), L_(480, 120, INK, [['لینکش', 81], ['توی', 82], ['بیوئه.', 83]])] }] },
  { k: 'end', tint: VIO, groups: [] },
];
SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; });
const SHAKES = [[ws(8), 8], [ws(18), 8], [ws(40), 6], [ws(59), 10], [ws(65), 8], [ws(69), 6]];

// ---------- frame ----------
function endCard(t) {
  const t0 = T.end, k = cub(k01(t, t0 + 0.05, 0.35)); if (k <= 0) return;
  if (IMG.wordL) { const w = 600, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha = k; cv.drawImage(IMG.wordL, CX - w / 2, 330 - h / 2 + (1 - k) * 24, w, h); cv.restore(); }
  const kf = pop(t - t0 - 0.3, 14, 0.55); if (kf > 0) { cv.save(); cv.translate(CX, 560); cv.scale(cl(kf, 0, 1.2), cl(kf, 0, 1.2)); cv.globalAlpha = cl(kf); chip('شروعش رایگانه', 0, 0, 58, INK, LIME); cv.restore(); }
  const kl = pop(t - t0 - 0.5, 14, 0.6); if (kl > 0) { cv.save(); cv.translate(CX, 720); cv.scale(cl(kl, 0, 1.2), cl(kl, 0, 1.2)); cv.globalAlpha = cl(kl); chip('لینک توی بیو', 0, 0, 58, WHITE, VIO); cv.restore(); }
}
const shake = (t) => SHAKES.reduce((x, [a, amp]) => x + (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0), 0);
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.globalCompositeOperation = 'source-over';
  CAM = camAt(t);
  cv.save(); cv.translate(CX + shake(t), CY); cv.rotate(Math.sin(t * 0.6) * 0.01); cv.scale(1.03, 1.03); cv.translate(-CX, -CY);
  studio(t, SC.map((s) => [s.tint, cl(k01(t, s.t0 - 0.2, 0.4)) * (1 - k01(t, s.t1 - 0.2, 0.4))]));
  Q = []; GA = 1;
  hookProps(t); seeProps(t); icons(t); bill(t); cubes(t); panel(t); logo(t);
  SC.forEach((s) => { if (t < s.t0 - 0.3 || t > s.t1 + 0.4) return; queueWords(s, t); });
  Q.sort((a, b) => b[0] - a[0]).forEach(([, ga, fn]) => { GA = ga; fn(); });
  cv.restore();
  endCard(t);
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(26,20,48,0.08)'; cv.fillRect(0, 0, W, 9); cv.fillStyle = VIO; cv.fillRect(W * (1 - k), 0, W * k, 9); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
// the cover is the hook with the whole question popped out
window.cover = () => frame(ws(9) + 0.45, { cover: true });
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('wordL', window.LOGO.wordL), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  window.seek(0); window.ready = true;
});
