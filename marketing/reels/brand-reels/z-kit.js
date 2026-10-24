// z-kit: «یک‌نما», one continuous camera shot through a world. Nothing cuts or wipes: every scene is a plate placed
// somewhere in one big world (plate-local 1080×1920 coordinates, placed by at: [x, y, scale]), and the camera flies
// between shots: it zooms through an object into the plate nested inside it, pans along a row of plates, or pulls back.
// The spoken words belong to each shot's camera frame, so they arrive framed and leave with the camera. They rise from
// behind a mask, and key words are gold.
// Depth: far light pools and mid dust drift with parallax, a few front bokeh pass faster; film grain and a vignette.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 700–900.
const W = 1080, H = 1920, CX = 540, CY = 960;
const BG = '#07060C', GOLD = '#F6C453', GOLDL = '#FFE6A3', GOLDD = '#A9792A', VIO = '#6C47FF', VIOL = '#A48CFF', G = '#22C58B', R = '#F0435B';
const WHITE = '#FFFFFF', MUT = '#8E88A6', DIM = '#3B374D', CARD = '#13101D', CARD2 = '#1B1728', RULE = 'rgba(255,255,255,0.09)', INK = '#0B0912';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0], we = (i) => Wd[i][1];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), quint = (x) => 1 - Math.pow(1 - cl(x), 5);
const inOut = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
/** Shadow blur is in screen pixels; this scales a blur meant for the drawing's own units (capped for speed). */
const sb = (v) => { const m = cv.getTransform(); return Math.min(140, v * Math.hypot(m.a, m.b)); };
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = sb(o.gb ?? 30); }
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g, '٫');
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800 }); return w; }
/** A polyline drawn up to fraction k of its length; returns the pen's position. */
function trace(pts, k, col, lw) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L;
  cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(...pts[0]); let end = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; cv.lineTo(...end); left -= seg[i]; }
  cv.stroke(); cv.restore(); return end;
}
/** A dark glass card: soft shadow, a faint top highlight, a hairline border. */
function card(x, y, w, h, r = 44, o = {}) {
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.55)'; cv.shadowBlur = sb(60); cv.shadowOffsetY = sb(24); rrect(x, y, w, h, r, o.fill ?? CARD); cv.restore();
  const g = cv.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); rrect(x, y, w, h, r, g, o.stroke ?? RULE, 2);
}
/** Candles bars[0..n) in box [x0, y0, x1, y1]; returns the mappings. */
function candleChart(bars, n, box, o = {}) {
  const [x0, y0, x1, y1] = box, N = o.N ?? bars.length, step = (x1 - x0) / N, bw = Math.max(2, step * (o.bw ?? 0.62));
  const lo = o.lo ?? Math.min(...bars.map((b) => b[2])), hi = o.hi ?? Math.max(...bars.map((b) => b[1])), pad = (hi - lo) * 0.06;
  const Y = (p) => y1 - ((p - lo + pad) / (hi - lo + 2 * pad)) * (y1 - y0), X = (i) => x0 + step * (i + 0.5);
  for (let i = 0; i < Math.min(n, bars.length); i++) { const [op, h, l, c] = bars[i], col = c >= op ? (o.up ?? G) : (o.down ?? R), x = X(i);
    line(x, Y(h), x, Y(l), col, Math.max(2, bw * 0.16)); rrect(x - bw / 2, Y(Math.max(op, c)), bw, Math.max(3, Math.abs(Y(op) - Y(c))), Math.min(6, bw / 3), col); }
  return { X, Y, step, bw };
}
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- the world ----------
// plates: [{ id, at: [x, y, s], draw(t, screenScale), from?, until?, alpha?(t) }]
// shots:  [{ k, cam: [x, y, s] (world centre, world units per screen px), tone, groups, lead?, md?, push?, roll?, dx?, dy? }]
let PLATES = [], SHOTS = [], COVER = null, SHAKES = [], DUST = [];
/** The camera that frames plate p centred on its local point (lx, ly), z times its size (z < 1 is closer). */
const frame = (p, lx = CX, ly = CY, z = 1) => [p.at[0] + (lx - CX) * p.at[2], p.at[1] + (ly - CY) * p.at[2], p.at[2] * z];
function world(o) {
  PLATES = o.plates; SHOTS = o.shots; COVER = o.cover; SHAKES = o.shakes || [];
  SHOTS.forEach((s) => { s.t0 = T[s.k]; s.lead = s.lead ?? 0.32; s.md = s.md ?? 0.78; s.go = s.t0 - s.lead; });
  SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].go : DUR + 1; s.next = SHOTS[i + 1]; });
  SHOTS.forEach((s, i) => { for (let j = 0; j < 26; j++) { const r = (q) => rnd(i * 97 + j * 13 + q * 7.7);
    DUST.push({ x: s.cam[0] + (r(1) - 0.5) * W * 1.8 * s.cam[2], y: s.cam[1] + (r(2) - 0.5) * H * 1.5 * s.cam[2], s: s.cam[2] * (3 + r(3) * 7), f: 0.5 + r(4) * 0.45,
      c: r(5) < 0.3 ? GOLD : r(5) < 0.45 ? G : r(5) < 0.55 ? R : WHITE, a: 0.06 + r(6) * 0.2, ph: r(7) * 6.28, front: r(8) < 0.12 }); } });
}
// ---------- the camera ----------
function held(s, t) {                                         // after landing, a slow push-in (and drift) until the next move
  const a = s.go + s.md, b = Math.max(a + 0.1, s.t1), k = inOut(cl((t - a) / (b - a))) * 0.6 + cl((t - a) / (b - a)) * 0.4, p = s.push ?? 0.045, c = s.cam;
  return [c[0] + (s.dx ?? 0) * k * c[2], c[1] + (s.dy ?? 0) * k * c[2], c[2] * (1 - p * k)];
}
function path(A, B, k, s) {
  const r = B[2] / A[2], z = Math.exp(lerp(Math.log(A[2]), Math.log(B[2]), k));
  if (Math.abs(Math.log(r)) > 0.35) {                         // a zoom about the one fixed point between the two frames
    const P = [(B[0] - A[0] * r) / (1 - r), (B[1] - A[1] * r) / (1 - r)], f = z / A[2];
    return [P[0] + (A[0] - P[0]) * f, P[1] + (A[1] - P[1]) * f, z];
  }
  const dist = Math.hypot(B[0] - A[0], B[1] - A[1]) / (W * Math.max(A[2], B[2])), bump = 1 + (s.bump ?? Math.max(0.12, Math.min(1.1, dist * 0.32))) * Math.sin(Math.PI * k);
  return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), z * bump];
}
function camAt(t) {
  let i = 0; SHOTS.forEach((s, j) => { if (t >= s.go) i = j; });
  const s = SHOTS[i]; if (i === 0 || t >= s.go + s.md) return [...held(s, t), 0];
  const k = (s.ease ?? inOut)(cl((t - s.go) / s.md));
  return [...path(held(SHOTS[i - 1], s.go), s.cam, k, s), (s.roll ?? 0) * Math.sin(Math.PI * k)];
}
// ---------- depth ----------
function backdrop(t, cam) {
  cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
  SHOTS.forEach((s, i) => {                                    // far light pools: one per shot, tinted by its tone
    const rel = Math.abs(Math.log(s.cam[2] / cam[2])); if (rel > 3) return;
    const x = CX + ((s.cam[0] - cam[0]) / cam[2]) * 0.35 + Math.sin(t * 0.4 + i) * 60, y = CY + 160 + ((s.cam[1] - cam[1]) / cam[2]) * 0.35, rad = 1150 * Math.pow(s.cam[2] / cam[2], 0.35);
    const a = 0.2 * Math.exp(-rel * 1.1), g = cv.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(s.tone ?? VIO, a)); g.addColorStop(1, rgba(s.tone ?? VIO, 0));
    cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  });
}
function dust(t, cam, front) {
  DUST.forEach((p) => {
    if (p.front !== front) return; const f = front ? 1.45 : p.f;
    const x = CX + ((p.x - cam[0]) / cam[2]) * f, y = CY + ((p.y - cam[1]) / cam[2]) * f, s = (p.s / cam[2]) * f * (front ? 2.4 : 1);
    if (s < 0.8 || s > 90 || x < -100 || x > W + 100 || y < -100 || y > H + 100) return;
    const a = p.a * (0.6 + 0.4 * Math.sin(t * 1.3 + p.ph)) * (front ? 0.5 : 1);
    if (front) { const g = cv.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, rgba(p.c, a)); g.addColorStop(1, rgba(p.c, 0)); cv.fillStyle = g; cv.fillRect(x - s, y - s, s * 2, s * 2); }
    else rrect(x - s / 2, y - s / 2, s, s, s * 0.25, rgba(p.c, a));
  });
}
// ---------- plates ----------
// Each plate's transform to the screen is worked out here in double precision (deep zooms nest plates 1000× smaller).
let SHAKE = 0;
function setPlate(at3, cam) {
  const sc = at3[2] / cam[2], c = Math.cos(cam[3]), s = Math.sin(cam[3]), ox = (at3[0] - cam[0]) / cam[2] - CX * sc, oy = (at3[1] - cam[1]) / cam[2] - CY * sc;
  cv.setTransform(sc * c, sc * s, -sc * s, sc * c, CX + SHAKE + c * ox - s * oy, CY + s * ox + c * oy);
}
function drawPlates(t, cam) {
  PLATES.forEach((p) => {
    if ((p.from !== undefined && t < p.from) || (p.until !== undefined && t > p.until)) return;
    const sc = p.at[2] / cam[2], fz = p.fadeAt ?? 4.5; if (sc < 0.012 || sc > fz * 2.4) return;     // a plate fades once it is fz× its size
    const pad = p.pad ?? 1.2, x0 = CX + (p.at[0] - CX * p.at[2] * pad - cam[0]) / cam[2], x1 = CX + (p.at[0] + CX * p.at[2] * pad - cam[0]) / cam[2];
    const y0 = CY + (p.at[1] - CY * p.at[2] * pad - cam[1]) / cam[2], y1 = CY + (p.at[1] + CY * p.at[2] * pad - cam[1]) / cam[2];
    if (x1 < -300 || x0 > W + 300 || y1 < -300 || y0 > H + 300) return;
    const a = (p.alpha ? p.alpha(t) : 1) * (1 - k01(sc, fz, fz * 1.3)) * cl((sc - 0.012) / 0.03); if (a <= 0.003) return;
    cv.save(); setPlate(p.at, cam); cv.globalAlpha *= a; p.draw(t, sc); cv.restore();
  });
}
// ---------- the spoken words: each shot's groups of lines, in its camera frame ----------
// group: { at: word index, lines: [{ y, size, c, toks: [[text, wordIdx | [a, b], { c, gold, hl, u }]] }] }
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);
function shotWords(s, t, cam) {
  if (!s.groups || !s.groups.length) return;
  const first = s === SHOTS[0], gStart = first ? -1 : ws(s.groups[0].at) - 0.4; if (t < gStart || t > s.t1 + (s.next ? s.next.md : 0.6)) return;
  const sc = s.cam[2] / cam[2], aOut = s.next ? 1 - cub(k01(t, s.t1 + 0.05, s.next.md * 0.6)) : 1, aZ = (1 - k01(sc, 2.2, 2.5)) * cl((sc - 0.08) / 0.15);
  const a = aOut * aZ; if (a <= 0.003) return;
  cv.save(); setPlate(s.cam, cam); cv.globalAlpha *= a;
  if (s.scrim) { const g = cv.createLinearGradient(0, 120, 0, s.scrim); g.addColorStop(0, rgba(BG, 0.92)); g.addColorStop(0.7, rgba(BG, 0.75)); g.addColorStop(1, rgba(BG, 0)); cv.fillStyle = g; cv.fillRect(-200, 0, W + 400, s.scrim); }
  if (s.scrimB) { const g = cv.createLinearGradient(0, s.scrimB, 0, H); g.addColorStop(0, rgba(BG, 0)); g.addColorStop(0.3, rgba(BG, 0.8)); g.addColorStop(1, rgba(BG, 0.94)); cv.fillStyle = g; cv.fillRect(-200, s.scrimB, W + 400, H - s.scrimB + 200); }
  s.groups.forEach((g, gi) => {
    const nx = s.groups[gi + 1], gEnd = nx ? ws(nx.at) - 0.14 : Infinity; if (t > gEnd + 0.2) return;
    const out = cub(k01(t, gEnd, 0.2));
    g.lines.forEach((ln, li) => {
      const gap = measure(' ', ln.size) * 1.4, wds = ln.toks.map(([x]) => measure(x, ln.size)), total = wds.reduce((p, q) => p + q, 0) + gap * (ln.toks.length - 1);
      const k0 = Math.min(1, (ln.max ?? 960) / total); let right = CX + (total * k0) / 2;
      ln.toks.forEach(([x, wi, o = {}], j) => {
        const st = first && gi === 0 && li === 0 ? -1 : ws(wIdx(wi)) - 0.07, d = t - st, wpx = wds[j] * k0;
        if (d >= 0) {
          const k = quint(d / 0.42), dy = (1 - k) * ln.size * 0.75 - out * ln.size * 0.5, aw = cl(d / 0.12) * (1 - out), cx = right - wpx / 2;
          cv.save(); cv.beginPath(); cv.rect(cx - wpx / 2 - 30, ln.y - ln.size * 0.95, wpx + 60, ln.size * 1.6); cv.clip();
          cv.translate(cx, ln.y + dy); cv.scale(k0, k0); cv.globalAlpha *= aw;
          if (o.hl) { const hk = cub(k01(t, st + 0.12, 0.25)), mw = wds[j] + ln.size * 0.45; rrect(mw / 2 - mw * hk, -ln.size * 0.6, mw * hk, ln.size * 1.18, ln.size * 0.22, o.hl); }
          const col = o.hl ? (o.ht ?? INK) : o.gold ? GOLD : o.c ?? ln.c ?? WHITE;
          txt(x, 0, 0, ln.size, col, { glow: o.gold ? rgba(GOLD, 0.55) : undefined, gb: 34 });
          cv.restore();
          if (o.u) { const uk = cub(k01(t, st + 0.25, 0.3)) * (1 - out); if (uk > 0) { const y = ln.y + ln.size * 0.62, x1 = cx + (wpx / 2) * 1.02; line(x1 - wpx * 1.04 * uk, y, x1, y, o.u === true ? GOLD : o.u, Math.max(6, ln.size * 0.07)); } }
        }
        right -= wpx + gap * k0;
      });
    });
  });
  cv.restore();
}
// ---------- finish ----------
let GRAIN = null;
function makeGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = Math.floor(rnd(i * 1.37 + 5) * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0); GRAIN = c;
}
function finish(t) {
  const v = cv.createRadialGradient(CX, CY, 480, CX, CY, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
  if (GRAIN) { const f = Math.floor(t * 24), ox = -Math.floor(rnd(f) * 256), oy = -Math.floor(rnd(f + 7.3) * 256); cv.save(); cv.globalAlpha = 0.06; cv.globalCompositeOperation = 'overlay';
    for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) cv.drawImage(GRAIN, x, y); cv.restore(); }
}
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; cv.globalCompositeOperation = 'source-over';
  const cam = camAt(t); SHAKE = SHAKES.reduce((x, [a, amp]) => x + (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0), 0);
  backdrop(t, cam); dust(t, cam, false);
  drawPlates(t, cam); SHOTS.forEach((s) => shotWords(s, t, cam));
  cv.setTransform(1, 0, 0, 1, 0, 0); dust(t, cam, true); finish(t);
};
window.camAt = camAt;
window.cover = () => { cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; if (COVER) COVER(); };
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  makeGrain(); window.seek(0); window.ready = true;
});
