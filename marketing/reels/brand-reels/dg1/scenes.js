// dg1 · «چالش ۱۰۰ معامله», a glass diagram reel on the user's voice, in the logo's violet.
// The whole challenge is one flowchart of frosted-glass nodes with Lucide icons on violet squircles, joined by glowing
// connectors that particles flow along. The camera travels down it node by node:
//   the challenge → «۴ قدم» → ۱ one strategy (three options, one kept) → ۲ its rules (entry, stop loss, take profit) →
//   ۳ a 0→100 trade counter (no real money, the real past market) → ۴ no cheating (the future hidden, the rules locked)
//   → a decision diamond → a strategy you know / 100 bad trades for free → «هر دوش برده» → BacktestLab → step by step
//   with the page.
// Then the camera pulls back to the whole map and the end card. Upcoming nodes wait as dashed outlines. The captions
// are typed on a glass plate at the top. The glass engine (blurred background, frost, rim, badges, pills, icons) is
// n1g's. 1080×1920, every frame a pure function of t.
const W = 1080, H = 1920, CX = 540;
const INK = '#FFFFFF', MUT = 'rgba(232,228,255,0.7)', VIO = '#6C47FF', LILAC = '#C9BBFF', INDI = '#4B3BFF', MAG = '#A04BFF', DV = '#2E1C8F',
  MINT = '#3CF0B4', TEAL = '#14B8A6', RED = '#FF5C8A', AMB = '#FFC15A', BLUE = '#6D7BFF', PINK = '#E25BFF', CYAN = '#8FA2FF', ORANGE = '#FF8A5C', DEEP = '#0B0726';
const EL = document.getElementById('c'), cv = EL.getContext('2d');
const BK = document.createElement('canvas'); BK.width = W / 4; BK.height = H / 4; const bx = BK.getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, GOLD = D.gold;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** 0 → 1 → 0 window: visible from a (fading in over din) to b (fading out over dout). */
const win = (t, a, b, din = 0.35, dout = 0.35) => Math.min(cub(k01(t, a, din)), 1 - cub(k01(t, b - dout, dout)));

// ---------- colour ----------
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a) => `rgba(${hx(h)},${a})`;
const mixc = (a, b, k) => '#' + hx(a).map((v, i) => Math.round(lerp(v, hx(b)[i], cl(k))).toString(16).padStart(2, '0')).join('');

// ---------- text ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.blur ?? 30; }
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ---------- shapes ----------
const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); return p; };
function circle(x, y, r, fill, stroke, lw = 3) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
/** A glossy sphere lit from the top-left. */
function sphere(x, y, r, c1, c2) {
  const g = cv.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  g.addColorStop(0, mixc(c1, '#FFFFFF', 0.6)); g.addColorStop(0.35, c1); g.addColorStop(1, c2);
  circle(x, y, r, g);
  const rg = cv.createRadialGradient(x, y + r * 0.2, r * 0.6, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,0.2)'); circle(x, y, r, rg);
}
/** A tilted glossy ring. */
function torus(x, y, r, th, c1, c2, rot) {
  cv.save(); cv.translate(x, y); cv.rotate(rot); cv.scale(1, 0.62);
  const g = cv.createLinearGradient(-r, -r, r, r); g.addColorStop(0, c1); g.addColorStop(1, c2);
  cv.lineWidth = th; cv.strokeStyle = g; cv.beginPath(); cv.arc(0, 0, r, 0, Math.PI * 2); cv.stroke();
  cv.lineCap = 'round'; cv.lineWidth = th * 0.2; cv.strokeStyle = 'rgba(255,255,255,0.5)'; cv.beginPath(); cv.arc(0, 0, r - th * 0.12, Math.PI * 1.08, Math.PI * 1.7); cv.stroke();
  cv.lineWidth = th * 0.3; cv.strokeStyle = 'rgba(0,0,0,0.22)'; cv.beginPath(); cv.arc(0, 0, r + th * 0.28, Math.PI * 0.15, Math.PI * 0.85); cv.stroke();
  cv.restore();
}
/** A glossy capsule. */
function capsule(x, y, w, h, rot, c1, c2) {
  cv.save(); cv.translate(x, y); cv.rotate(rot);
  const g = cv.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, mixc(c1, '#FFFFFF', 0.35)); g.addColorStop(0.45, c1); g.addColorStop(1, c2); cv.fillStyle = g; cv.fill(rr(-w / 2, -h / 2, w, h, h / 2));
  const gl = cv.createLinearGradient(0, -h / 2, 0, 0); gl.addColorStop(0, 'rgba(255,255,255,0.5)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = gl; cv.fill(rr(-w / 2 + h * 0.3, -h / 2 + h * 0.1, w - h * 0.6, h * 0.34, h * 0.17));
  cv.restore();
}

// ---------- icons (Lucide, 24-unit boxes, stroked 2 units wide with round ends) ----------
const ICON = {};
function buildIcons() {
  for (const [n, nodes] of Object.entries(window.ICONS)) ICON[n] = nodes.map(([tag, a]) => {
    const p = new Path2D(), N = (k, d = 0) => (a[k] === undefined ? d : parseFloat(a[k]));
    if (tag === 'path') p.addPath(new Path2D(a.d));
    else if (tag === 'circle') p.arc(N('cx'), N('cy'), N('r'), 0, Math.PI * 2);
    else if (tag === 'ellipse') p.ellipse(N('cx'), N('cy'), N('rx'), N('ry'), 0, 0, Math.PI * 2);
    else if (tag === 'rect') p.roundRect(N('x'), N('y'), N('width'), N('height'), N('rx'));
    else if (tag === 'line') { p.moveTo(N('x1'), N('y1')); p.lineTo(N('x2'), N('y2')); }
    else if (tag === 'polyline' || tag === 'polygon') { const q = a.points.trim().split(/[\s,]+/).map(Number); p.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) p.lineTo(q[i], q[i + 1]); if (tag === 'polygon') p.closePath(); }
    return p;
  });
  // a five-tally (four strokes and the bar across them) for the losing streak, drawn in Lucide's style
  const t = new Path2D(); [6, 10, 14, 18].forEach((x) => { t.moveTo(x, 5); t.lineTo(x, 19); }); t.moveTo(3, 16.5); t.lineTo(21, 7.5); ICON.tally = [t];
}
function icon(n, x, y, s, col, o = {}) {
  const ps = ICON[n]; if (!ps) return;
  cv.save(); cv.translate(x - s / 2, y - s / 2); cv.scale(s / 24, s / 24);
  cv.lineWidth = o.lw ?? 2; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.strokeStyle = col;
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.blur ?? 18; }
  if (o.fill) { cv.fillStyle = o.fill; ps.forEach((p) => cv.fill(p)); }
  ps.forEach((p) => cv.stroke(p)); cv.restore();
}

// ---------- glass ----------
/** The blurred copy of the frame so far (the background), at a quarter size; glass panels show it through. */
function snap() { bx.save(); bx.filter = 'none'; bx.fillStyle = DEEP; bx.fillRect(0, 0, BK.width, BK.height); bx.filter = 'blur(9px)'; bx.drawImage(EL, 0, 0, BK.width, BK.height); bx.restore(); }
/** A frosted-glass panel on path p (box [x, y, w, h] for its gradients): a soft shadow, the blurred scene behind it,
 *  a dark frost, a light sheen, an optional colour tint and a rim that is brightest at the top-left.
 *  o.flat: a glass layer on top of another one (no blur, no shadow). */
function glassP(p, [x, y, w, h], o = {}) {
  cv.save();
  if (!o.flat) {
    if (o.shadow !== false) { cv.save(); cv.shadowColor = 'rgba(3,2,16,0.55)'; cv.shadowBlur = o.sb ?? 60; cv.shadowOffsetY = o.so ?? 26; cv.fillStyle = 'rgba(3,2,16,0.6)'; cv.fill(p); cv.restore(); }
    cv.save(); cv.clip(p); cv.setTransform(1, 0, 0, 1, 0, 0); cv.drawImage(BK, 0, 0, W, H); cv.restore();
    cv.fillStyle = `rgba(14,11,40,${o.dark ?? 0.34})`; cv.fill(p);
  }
  const g = cv.createLinearGradient(x, y, x + w * 0.7, y + h);
  g.addColorStop(0, `rgba(255,255,255,${o.flat ? 0.11 : 0.15})`); g.addColorStop(0.55, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.025)');
  cv.fillStyle = g; cv.fill(p);
  if (o.tint) { cv.fillStyle = rgba(o.tint, o.tintA ?? 0.14); cv.fill(p); }
  if (o.rim !== false) {
    const r = cv.createLinearGradient(x, y, x + w * 0.5, y + h);
    if (o.rimCol) { r.addColorStop(0, rgba(o.rimCol, 0.95)); r.addColorStop(0.5, rgba(o.rimCol, 0.3)); r.addColorStop(1, rgba(o.rimCol, 0.7)); }
    else { r.addColorStop(0, 'rgba(255,255,255,0.62)'); r.addColorStop(0.45, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0.3)'); }
    cv.strokeStyle = r; cv.lineWidth = o.rimW ?? 2.5; cv.stroke(p);
  }
  cv.restore();
}
function glass(x, y, w, h, r, o) { glassP(rr(x, y, w, h, r), [x, y, w, h], o); }
function glassC(x, y, r, o) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); glassP(p, [x - r, y - r, 2 * r, 2 * r], o); }
/** A gradient squircle with a glossy top and a white icon on it. */
function badge(n, x, y, s, c1, c2, o = {}) {
  const p = rr(x - s / 2, y - s / 2, s, s, s * 0.3);
  cv.save(); if (o.glow !== false) { cv.shadowColor = rgba(c1, 0.55); cv.shadowBlur = o.blur ?? 40; cv.shadowOffsetY = 8; }
  const g = cv.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, c1); g.addColorStop(1, c2); cv.fillStyle = g; cv.fill(p); cv.restore();
  cv.save(); cv.clip(p); const gl = cv.createLinearGradient(0, y - s / 2, 0, y + s * 0.1); gl.addColorStop(0, 'rgba(255,255,255,0.4)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = gl; cv.fillRect(x - s / 2, y - s / 2, s, s * 0.6); cv.restore();
  cv.save(); cv.strokeStyle = 'rgba(255,255,255,0.45)'; cv.lineWidth = 2; cv.stroke(p); cv.restore();
  icon(n, x, y, s * (o.k ?? 0.54), '#FFFFFF', { lw: o.lw ?? 2.1, fill: o.fill });
}
/** A round gradient button/dot with a gloss. */
function orb(x, y, r, c1, c2, glow = true) {
  cv.save(); if (glow) { cv.shadowColor = rgba(c1, 0.6); cv.shadowBlur = 40; }
  const g = cv.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, c1); g.addColorStop(1, c2); circle(x, y, r, g); cv.restore();
  cv.save(); cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.clip(); const gl = cv.createLinearGradient(0, y - r, 0, y + r * 0.1); gl.addColorStop(0, 'rgba(255,255,255,0.42)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = gl; cv.fillRect(x - r, y - r, 2 * r, r * 1.1); cv.restore();
  circle(x, y, r, null, 'rgba(255,255,255,0.45)', 2);
}
/** A pill: glass (or solid gradient o.solid, or bare), an icon on the right, the text left of it. Returns its width. */
function pill(s, x, y, size, o = {}) {
  const tw = measure(s, size, o.w ?? 800), isz = o.icon ? size * 1.2 : 0, gap = o.icon ? size * 0.4 : 0, px = size * 0.8, h = size * 1.95;
  const w = Math.max(o.minW ?? 0, tw + isz + gap + px * 2);
  if (o.right !== undefined) x = o.right - w / 2; if (o.left !== undefined) x = o.left + w / 2;
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  if (o.solid) {
    const p = rr(x - w / 2, y - h / 2, w, h, h / 2);
    cv.save(); cv.shadowColor = rgba(o.solid[0], 0.55); cv.shadowBlur = 44; cv.shadowOffsetY = 10; const g = cv.createLinearGradient(x - w / 2, y, x + w / 2, y); g.addColorStop(0, o.solid[1]); g.addColorStop(1, o.solid[0]); cv.fillStyle = g; cv.fill(p); cv.restore();
    cv.save(); cv.clip(p); const gl = cv.createLinearGradient(0, y - h / 2, 0, y); gl.addColorStop(0, 'rgba(255,255,255,0.45)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = gl; cv.fillRect(x - w / 2, y - h / 2, w, h / 2); cv.restore();
    cv.strokeStyle = 'rgba(255,255,255,0.5)'; cv.lineWidth = 2; cv.stroke(p);
  } else if (!o.bare) glass(x - w / 2, y - h / 2, w, h, h / 2, o);
  const cw = tw + isz + gap, right = x + cw / 2;
  if (o.icon) icon(o.icon, right - isz / 2, y, isz, o.ic ?? o.fg ?? INK, { lw: o.ilw ?? 2.2, fill: o.ifill, glow: o.iglow });
  txt(s, right - isz - gap - tw / 2, y + size * 0.05, size, o.fg ?? INK, { w: o.w ?? 800 });
  cv.restore(); return w;
}
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }


// ---------- background: violet colour fields, floating glossy shapes, a faint dot grid ----------
const BLOBS = [[160, 520, 660, VIO], [940, 760, 600, MAG], [240, 1360, 680, INDI], [900, 1580, 620, '#8A5CFF'], [540, 1020, 500, '#5A3DE0']];
function background(t, camY = 0) {
  const g = cv.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, '#1C1157'); g.addColorStop(1, '#07051A'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.save(); cv.globalCompositeOperation = 'screen';
  BLOBS.forEach(([x0, y0, r, c], i) => { const x = x0 + 110 * Math.sin(t * 0.31 + i * 1.7), y = y0 + 130 * Math.cos(t * 0.26 + i * 2.3);
    const gg = cv.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rgba(c, 0.55)); gg.addColorStop(0.55, rgba(c, 0.18)); gg.addColorStop(1, rgba(c, 0)); cv.fillStyle = gg; cv.fillRect(x - r, y - r, 2 * r, 2 * r); });
  cv.restore();
  // the dot grid drifts with the camera (a little), like graph paper under the diagram
  const oy = (-camY * 0.25) % 54; cv.fillStyle = 'rgba(201,187,255,0.10)'; for (let x = 27; x < W; x += 54) for (let y = oy - 54; y < H + 54; y += 54) { cv.beginPath(); cv.arc(x, y, 2.2, 0, Math.PI * 2); cv.fill(); }
  const f = (a, s, p) => a * Math.sin(t * s + p), py = -camY * 0.08;
  sphere(900 + f(24, 0.4, 0), 640 + f(30, 0.33, 1) + py % 400, 110, LILAC, DV);
  sphere(110 + f(18, 0.5, 2), 760 + f(26, 0.37, 0.5), 60, PINK, '#4B1FB0');
  torus(160 + f(20, 0.3, 1), 1520 + f(28, 0.35, 2), 120, 42, VIO, MAG, -0.5 + 0.15 * Math.sin(t * 0.4));
  capsule(930 + f(16, 0.45, 3), 1560 + f(24, 0.3, 1.5), 260, 104, -0.6 + 0.1 * Math.sin(t * 0.35), '#9B7BFF', '#4B2FD0');
  const v = cv.createRadialGradient(CX, 960, 520, CX, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,1,10,0.55)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
}
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const sio = (x) => { x = cl(x); return x * x * (3 - 2 * x); };

// ---------- the diagram: nodes in world space (x, y = centre) ----------
const NODES = {
  title: { x: 540, y: 760, w: 840, h: 300, t: () => -1 },
  steps: { x: 540, y: 1010, pill: true, t: () => T.rule },
  n1: { x: 540, y: 1330, w: 760, h: 230, t: () => ws(19) },
  n2: { x: 540, y: 1900, w: 760, h: 230, t: () => ws(25) },
  e: { x: 830, y: 2250, w: 250, h: 190, t: () => ws(27) }, sl: { x: 540, y: 2250, w: 250, h: 190, t: () => ws(31) }, tp: { x: 250, y: 2250, w: 250, h: 190, t: () => ws(34) },
  n3: { x: 540, y: 2780, w: 860, h: 380, t: () => ws(37) },
  n4: { x: 540, y: 3330, w: 760, h: 230, t: () => ws(51) },
  d: { x: 540, y: 3900, w: 240, h: 240, t: () => ws(63) },
  a: { x: 800, y: 4330, w: 440, h: 300, t: () => ws(66) }, b: { x: 280, y: 4330, w: 440, h: 300, t: () => ws(77) },
  win: { x: 540, y: 4850, w: 620, h: 220, t: () => ws(93) },
  bl: { x: 540, y: 5360, w: 760, h: 280, t: () => ws(98) },
  fol: { x: 540, y: 5900, w: 700, h: 220, t: () => ws(103) },
};
const EDGES = [['title', 'n1'], ['n1', 'n2'], ['n2', 'e'], ['n2', 'sl'], ['n2', 'tp'], ['e', 'n3'], ['sl', 'n3'], ['tp', 'n3'], ['n3', 'n4'], ['n4', 'd'], ['d', 'a'], ['d', 'b'], ['a', 'win'], ['b', 'win'], ['win', 'bl'], ['bl', 'fol']];
const nBot = (n) => [n.x, n.y + (n.h ?? 80) / 2], nTop = (n) => [n.x, n.y - (n.h ?? 80) / 2];
function edgePts(a, b) { const [x0, y0] = nBot(NODES[a]), [x1, y1] = nTop(NODES[b]), my = (y0 + y1) / 2, pts = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24, v = 1 - u; pts.push([v * v * v * x0 + 3 * v * v * u * x0 + 3 * v * u * u * x1 + u * u * u * x1, v * v * v * y0 + 3 * v * v * u * my + 3 * v * u * u * my + u * u * u * y1]); } return pts; }
const along = (pts, f) => { const i = Math.min(pts.length - 2, Math.floor(cl(f) * (pts.length - 1))), e = cl(f) * (pts.length - 1) - i; return [lerp(pts[i][0], pts[i + 1][0], e), lerp(pts[i][1], pts[i + 1][1], e)]; };
function connectors(t) {
  EDGES.forEach(([a, b], ei) => { const pts = edgePts(a, b), t1 = NODES[b].t(), k = sio(k01(t, t1 - 0.45, 0.45));
    // the dashed ghost, then the glowing line as it is drawn
    cv.save(); cv.setLineDash([10, 14]); cv.strokeStyle = 'rgba(201,187,255,0.16)'; cv.lineWidth = 4; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.stroke(); cv.restore();
    if (k <= 0) return; const n = Math.max(1, Math.round(k * (pts.length - 1)));
    cv.save(); cv.shadowColor = rgba(LILAC, 0.9); cv.shadowBlur = 18; cv.strokeStyle = rgba('#D9CFFF', 0.85); cv.lineWidth = 5; cv.lineCap = 'round'; cv.beginPath(); pts.slice(0, n + 1).forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.stroke(); cv.restore();
    if (k >= 1) for (let q = 0; q < 2; q++) { const f = ((t * 0.55 + q * 0.5 + ei * 0.13) % 1), [x, y] = along(pts, f); cv.save(); cv.shadowColor = rgba('#FFFFFF', 0.9); cv.shadowBlur = 16; circle(x, y, 7, '#FFFFFF'); cv.restore(); }
  });
}
const kIn = (t, n) => pop(t - n.t() + 0.05, 12, 0.62);
function ghost(n) { cv.save(); cv.setLineDash([12, 12]); cv.strokeStyle = 'rgba(201,187,255,0.18)'; cv.lineWidth = 3; if (n === NODES.d) { cv.translate(n.x, n.y); cv.rotate(Math.PI / 4); cv.stroke(rr(-n.w * 0.36, -n.w * 0.36, n.w * 0.72, n.w * 0.72, 30)); } else cv.stroke(rr(n.x - n.w / 2, n.y - n.h / 2, n.w, n.h, 44)); cv.restore(); }
/** a node card: glass, an icon badge on the right, the title and a subtitle to its left, a step number at the corner */
function card(n, t, o) {
  const k = kIn(t, n); if (k <= 0) { ghost(n); return 0; }
  at(n.x, n.y, lerp(0.88, 1, cl(k)), cl(k), () => {
    glass(-n.w / 2, -n.h / 2, n.w, n.h, 44, { dark: 0.36, tint: o.tint, tintA: 0.12, rimCol: o.rim });
    const bs = o.bs ?? 120, bx = n.w / 2 - bs / 2 - 34; badge(o.icon, bx, o.by ?? 0, bs, o.c1 ?? '#9B7BFF', o.c2 ?? '#5A2FE0', { k: 0.5 });
    const tx = bx - bs / 2 - 30; txt(o.title, tx, (o.sub ? -26 : 4) + (o.ty ?? 0), o.ts ?? 58, INK, { align: 'right', w: 900 });
    if (o.sub) txt(o.sub, tx, 46 + (o.ty ?? 0), o.ss ?? 34, MUT, { align: 'right', w: 700 });
    if (o.step) { glassC(-n.w / 2 + 6, -n.h / 2 + 6, 40, { flat: true, tint: VIO, tintA: 0.6, rimCol: LILAC }); txt(fa(o.step), -n.w / 2 + 6, -n.h / 2 + 10, 44, INK); }
  });
  return cl(k);
}
function mini(n, t, icon_, label, c1, c2) { const k = kIn(t, n); if (k <= 0) { ghost(n); return; }
  at(n.x, n.y, lerp(0.85, 1, cl(k)), cl(k), () => { glass(-n.w / 2, -n.h / 2, n.w, n.h, 40, { dark: 0.36 }); badge(icon_, 0, -26, 92, c1, c2, { k: 0.52 }); txt(label, 0, 60, 38, INK, { w: 800 }); }); }

function diagram(t) {
  connectors(t);
  const N = NODES;
  // the challenge
  card(N.title, t, { icon: 'trophy', title: 'چالش ۱۰۰ معامله', sub: 'تا آخرش بری، ترید دیگه مثل قبل نیست', ts: 66, ss: 30, bs: 140, c1: '#FFD36E', c2: '#F08A1F', rim: LILAC });
  const ks = kIn(t, N.steps); if (ks > 0) at(N.steps.x, N.steps.y, cl(ks, 0, 1.2), cl(ks), () => pill('۴ قدم ساده', 0, 0, 40, { flat: true, tint: VIO, tintA: 0.45, rimCol: LILAC, icon: 'list-checks', ic: LILAC }));
  // ۱ one strategy: three options, one kept
  if (card(N.n1, t, { step: 1, icon: 'crosshair', title: 'یه استراتژی', sub: 'فقط یکی' }) > 0) {
    const keep = sio(k01(t, ws(23) - 0.05, 0.35));
    [['الف', 300], ['ب', 540], ['ج', 780]].forEach(([s, x], i) => { const k = pop(t - ws(20) - i * 0.1, 13, 0.6); if (k <= 0) return; const me = i === 1, a = me ? 1 : 1 - 0.75 * keep, sc = me ? 1 + 0.12 * keep : 1 - 0.15 * keep;
      at(x, N.n1.y + 175, cl(k, 0, 1.2) * sc, cl(k) * a, () => { pill('استراتژی ' + s, 0, 0, 30, me && keep > 0.5 ? { solid: [VIO, MAG], icon: 'check', ilw: 2.6 } : { flat: true, tint: DV, tintA: 0.5 }); }); });
  }
  // ۲ its rules
  card(N.n2, t, { step: 2, icon: 'notebook-pen', title: 'قانون‌هاشو بنویس', sub: 'قبل از اولین معامله' });
  mini(N.e, t, 'log-in', 'ورود', '#9B7BFF', '#5A2FE0'); mini(N.sl, t, 'octagon-x', 'حد ضرر', '#FF7AA2', '#C2185B'); mini(N.tp, t, 'target', 'حد سود', '#5EF5C4', '#0F9F7A');
  // ۳ 100 trades: the counter, not real money, the real past market
  if (card(N.n3, t, { step: 3, icon: 'history', title: '۱۰۰ معامله', sub: 'روی بازار واقعی گذشته', by: -100, ty: -100, ts: 64 }) > 0) {
    at(N.n3.x, N.n3.y, 1, cl(kIn(t, N.n3)), () => {
      const kc = sio(k01(t, ws(38), ws(50) + 0.6 - ws(38))), n = Math.round(100 * kc), cx = 250, cy = 60, r = 92;
      cv.save(); cv.lineWidth = 18; cv.strokeStyle = 'rgba(255,255,255,0.12)'; cv.beginPath(); cv.arc(cx, cy, r, 0, Math.PI * 2); cv.stroke();
      const g = cv.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, LILAC); g.addColorStop(1, VIO); cv.strokeStyle = g; cv.lineCap = 'round'; cv.shadowColor = rgba(VIO, 0.8); cv.shadowBlur = 20;
      if (kc > 0) { cv.beginPath(); cv.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kc); cv.stroke(); } cv.restore();
      txt(fa(n), cx, cy + 6, 70, INK); txt('معامله', cx, cy + 58, 24, MUT, { w: 700 });
      // not real money … the real market's past
      const k1 = pop(t - ws(44), 13, 0.6); if (k1 > 0) at(-120, 20, cl(k1, 0, 1.2), cl(k1), () => { pill('پول واقعی', 0, 0, 32, { flat: true, tint: DV, tintA: 0.4, icon: 'wallet', ic: '#FFB3C8', fg: '#FFD0DD' }); const kx = sio(k01(t, ws(46) - 0.1, 0.3)); if (kx > 0) { cv.save(); cv.strokeStyle = RED; cv.lineWidth = 7; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(130, 0); cv.lineTo(130 - 260 * kx, 0); cv.stroke(); cv.restore(); } });
      const k2 = pop(t - ws(48), 13, 0.6); if (k2 > 0) at(-120, 120, cl(k2, 0, 1.2), cl(k2), () => pill('بازار واقعی گذشته', 0, 0, 32, { solid: ['#2BD9A0', '#0F8F6A'], icon: 'circle-check', fg: '#03261B', ic: '#03261B', ilw: 2.6 }));
    });
  }
  // ۴ no cheating
  if (card(N.n4, t, { step: 4, icon: 'shield-check', title: 'بدون تقلب', sub: 'مثل بازار واقعی', c1: '#9B7BFF', c2: '#3B1FB0' }) > 0) {
    const k1 = pop(t - ws(53), 13, 0.6); if (k1 > 0) at(760, N.n4.y + 185, cl(k1, 0, 1.2), cl(k1), () => pill('آینده رو نمی‌بینی', 0, 0, 30, { flat: true, tint: DV, tintA: 0.5, icon: 'eye-off', ic: LILAC }));
    const k2 = pop(t - ws(59), 13, 0.6); if (k2 > 0) at(320, N.n4.y + 185, cl(k2, 0, 1.2), cl(k2), () => pill('قانون‌ها قفل', 0, 0, 30, { flat: true, tint: DV, tintA: 0.5, icon: 'lock', ic: LILAC }));
  }
  // the decision: after 100 trades
  { const n = N.d, k = kIn(t, n); if (k <= 0) ghost(n); else at(n.x, n.y, lerp(0.85, 1, cl(k)), cl(k), () => {
      cv.save(); cv.rotate(Math.PI / 4); const s = n.w * 0.72; glassP(rr(-s / 2, -s / 2, s, s, 30), [-s / 2, -s / 2, s, s], { dark: 0.3, tint: VIO, tintA: 0.3, rimCol: LILAC }); cv.restore();
      icon('split', 0, -6, 76, INK, { lw: 2.2, glow: rgba(LILAC, 0.8) }); pill('آخر ۱۰۰ معامله', 0, -190, 32, { flat: true, tint: VIO, tintA: 0.5, rimCol: LILAC }); }); }
  card(N.a, t, { icon: 'chart-line', title: 'یه استراتژی', sub: 'که می‌دونی چطور کار می‌کنه', ts: 44, ss: 26, bs: 100, c1: '#5EF5C4', c2: '#0F9F7A' });
  card(N.b, t, { icon: 'piggy-bank', title: '۱۰۰ معامله‌ی بد', sub: 'مجانی، نه با پول واقعیت', ts: 44, ss: 26, bs: 100, c1: '#FFB86B', c2: '#E2572B' });
  { const ka = pop(t - ws(72), 13, 0.5); if (ka > 0 && kIn(t, N.a) > 0) at(N.a.x - N.a.w / 2 + 10, N.a.y - N.a.h / 2 + 10, cl(ka, 0, 1.2), cl(ka), () => orb(0, 0, 34, '#3CF0B4', '#0F9F7A')); }
  // both are a win
  if (card(N.win, t, { icon: 'trophy', title: 'هر دوش برده', ts: 60, c1: '#FFD36E', c2: '#F08A1F', rim: '#FFE7A8' }) > 0) {
    const ks2 = k01(t, ws(95) - 0.1, 1.4); if (ks2 > 0 && ks2 < 1) for (let i = 0; i < 16; i++) { const a = rnd(i) * Math.PI * 2, r = 120 + ks2 * (200 + rnd(i * 3) * 160); circle(N.win.x + Math.cos(a) * r, N.win.y + Math.sin(a) * r * 0.6, 5 + rnd(i * 5) * 6, rgba(i % 2 ? '#FFD36E' : LILAC, 1 - ks2)); } }
  // BacktestLab
  { const n = N.bl, k = kIn(t, n); if (k <= 0) ghost(n); else at(n.x, n.y, lerp(0.88, 1, cl(k)), cl(k), () => {
      glass(-n.w / 2, -n.h / 2, n.w, n.h, 48, { dark: 0.3, tint: VIO, tintA: 0.25, rimCol: LILAC });
      if (IMG.icon) { cv.save(); cv.shadowColor = rgba(VIO, 0.8); cv.shadowBlur = 50; cv.drawImage(IMG.icon, n.w / 2 - 210, -90, 180, 180); cv.restore(); }
      if (IMG.word) { const w = 380, h = (w * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, n.w / 2 - 240 - w, -h / 2 - 30, w, h); }
      txt('چالش رو اینجا شروع کن', n.w / 2 - 240 - 190, 80, 30, MUT, { w: 700 }); }); }
  // step by step, with the page: footprints along the last connector, then the node
  { const pts = edgePts('bl', 'fol'), kf = k01(t, ws(108) - 0.1, ws(110) - ws(108) + 0.4); for (let i = 0; i < 5; i++) { if (kf * 5 <= i) break; const [x, y] = along(pts, 0.12 + i * 0.18); at(x + (i % 2 ? 28 : -28), y, 1, cl(kf * 5 - i), () => icon('footprints', 0, 0, 44, LILAC, { lw: 2.2, glow: rgba(LILAC, 0.7) })); } }
  card(N.fol, t, { icon: 'user-plus', title: 'قدم به قدم', sub: 'توی همین پیج همراهتیم', c1: '#9B7BFF', c2: '#5A2FE0' });
}

// ---------- the camera: from node to node, then back to the whole map ----------
const CAM = () => [[0, 760, 1.12], [T.rule - 0.1, 820, 1.1], [T.pick - 0.35, 1340, 1.12], [T.write - 0.35, 1960, 1.08], [ws(31) - 0.2, 2060, 1.05], [T.hundred - 0.35, 2780, 1.1],
  [T.fair - 0.35, 3370, 1.12], [T.outcome - 0.35, 3900, 1.12], [ws(66) - 0.4, 4260, 0.98], [T.both - 0.35, 4850, 1.12], [T.start - 0.35, 5360, 1.12], [T.follow - 0.35, 5800, 1.08], [T.cta - 0.2, 3330, 0.27]];
function camAt(t) { const K = CAM(); let y = K[0][1], z = K[0][2];
  for (let i = 1; i < K.length; i++) { const [t1, y1, z1] = K[i], d = i === K.length - 1 ? 1.4 : 0.7; if (t >= t1) { const e = exIO(k01(t, t1, d)); y = lerp(y, y1, e); z = lerp(z, z1, e); } }
  return { y, z }; }
const FOCUS = 1180;   // the screen line the camera keeps the current node on

// ---------- captions: typed in word by word on a glass plate at the top ----------
const PH = [
  [[['یه', 0], ['چالش', 1, LILAC], ['دارم', 2]], [['که', 3], ['اگه', 4], ['تا', 5], ['آخرش', 6], ['بری،', 7]]],
  [[['دیگه', 8], ['هیچ‌وقت', [9, 10]], ['مثل', 11], ['قبل', 12]], [['ترید', 13], ['نمی‌کنی.', [14, 15], LILAC]]],
  [[['قانونش', 16], ['ساده‌ست:', [17, 18], MINT]]],
  [[['یه', 19], ['استراتژی', 20, LILAC], ['انتخاب', 21], ['کن.', 22]], [['فقط', 23, MINT], ['یکی.', 24, MINT]]],
  [[['قانون‌هاشو', 25, LILAC], ['بنویس:', 26]], [['کجا', 27], ['وارد', 28], ['می‌شی؟', [29, 30]]]],
  [[['حد', 31, RED], ['ضررت', 32, RED], ['کجاست؟', 33]], [['حد', 34, MINT], ['سودت', 35, MINT], ['کجا؟', 36]]],
  [[['حالا', 37], ['صد', 38, LILAC], ['تا', 39], ['معامله', 40]], [['باهاش', 41], ['بزن،', 42]]],
  [[['نه', 43], ['با', 44], ['پول', 45, RED], ['واقعی،', 46, RED]], [['روی', 47], ['بازار', 48], ['واقعی', 49, MINT], ['گذشته.', 50, MINT]]],
  [[['بدون', 51], ['تقلب:', 52, LILAC]], [['آینده', 53], ['رو', 54], ['نمی‌بینی', [55, 56]]]],
  [[['و', 57], ['از', 58], ['قانون‌هات', 59, LILAC]], [['تخطی', 60], ['نمی‌کنی.', [61, 62]]]],
  [[['آخر', 63], ['صد', 64, LILAC], ['معامله،', 65]]],
  [[['یا', 66], ['یه', 67], ['استراتژی', 68, MINT], ['داری', 69]], [['که', 70], ['می‌دونی', [71, 72]], ['چطور', 73], ['کار', 74], ['می‌کنه،', [75, 76]]]],
  [[['یا', 77], ['صد', 78, LILAC], ['تا', 79], ['معامله‌ی', 80], ['بد', 81, RED]], [['رو', 82], ['مجانی', 83, MINT], ['زدی،', 84]]],
  [[['به', 85], ['جای', 86], ['اینکه', [87, 88]]], [['با', 89], ['پول', 90, RED], ['واقعیت', 91, RED], ['بزنی.', 92]]],
  [[['هر', 93], ['دوش', 94], ['برده.', 95, AMB]]],
  [[['چالش', 96], ['رو', 97], ['توی', 98], ['بک‌تست‌لب', [99, 100], LILAC]], [['شروع', 101], ['کن.', 102]]],
  [[['ما', 103], ['هم', 104], ['توی', 105], ['همین', 106], ['پیج', 107]], [['قدم', 108, MINT], ['به', 109, MINT], ['قدم', 110, MINT], ['همراهتیم.', 111]]],
  [[['شروعش', 112], ['رایگانه؛', 113, MINT]], [['لینکش', 114], ['توی', 115], ['بیوئه.', 116]]],
];
const wi = (x) => (Array.isArray(x) ? x[0] : x);
const phAt = (p) => ws(wi(p[0][0][1]));
function captions(t) {
  const pa = 1 - cub(k01(t, T.end - 0.35, 0.3)); if (pa <= 0) return;
  cv.save(); cv.globalAlpha = pa; glass(52, 212, 976, 276, 62, { dark: 0.42 }); cv.restore();
  if (t >= T.end - 0.05) return;
  let cur = -1; PH.forEach((p, i) => { if (t >= phAt(p) - 0.1) cur = i; }); if (cur < 0) return;
  const p = PH[cur], next = cur + 1 < PH.length ? phAt(PH[cur + 1]) - 0.1 : T.end - 0.05, y0 = p.length === 1 ? 350 : 302;
  let last = null;
  p.forEach((ln, li) => {
    const size = li === 0 ? 74 : 66, y = y0 + li * 98, gap = measure(' ', size) * 1.3;
    const wds = ln.map(([s]) => measure(s, size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.length - 1), sc = Math.min(1, 900 / total);
    let right = CX + (total * sc) / 2;
    ln.forEach(([s, w, col], j) => { const st = cur === 0 && li === 0 ? -1 : ws(wi(w)) - 0.04, wpx = wds[j] * sc;
      if (t >= st) { const a = cl((t - st) / 0.06); cv.save(); cv.globalAlpha = a * (1 - k01(t, next - 0.06, 0.06)); cv.translate(right - wpx / 2, y); cv.scale(sc, sc); txt(s, 0, 0, size, col ?? INK, { glow: col ? rgba(col, 0.35) : null, blur: 24 }); cv.restore(); last = [right - wpx, y, size * sc]; }
      right -= wpx + gap * sc; });
  });
  if (last && Math.floor(t * 2.6) % 2 === 0) { cv.save(); cv.shadowColor = rgba(LILAC, 0.7); cv.shadowBlur = 16; cv.fillStyle = LILAC; cv.fill(rr(last[0] - 32, last[1] - last[2] * 0.4, 14, last[2] * 0.8, 7)); cv.restore(); }
}

// ---------- the frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; cv.globalCompositeOperation = 'source-over';
  const cam = camAt(t);
  background(t, cam.y); snap();
  cv.save(); cv.translate(CX, FOCUS); cv.scale(cam.z, cam.z); cv.translate(-CX, -cam.y); diagram(t); cv.restore();
  // the map's last word: «شروعش رایگانه» and the link, then the end card
  const kf = pop(t - ws(113) + 0.05, 13, 0.55); if (kf > 0 && t < T.end + 0.3) at(CX, 1500, cl(kf, 0, 1.2), cl(kf) * (1 - k01(t, T.end - 0.1, 0.3)), () => pill('شروعش رایگانه', 0, 0, 52, { solid: [VIO, MAG], icon: 'gift', ilw: 2.6 }));
  const kl = pop(t - ws(114) + 0.05, 13, 0.6); if (kl > 0 && t < T.end + 0.3) at(CX, 1660, cl(kl, 0, 1.2), cl(kl) * (1 - k01(t, T.end - 0.1, 0.3)), () => pill('لینک توی بیو', 0, 0, 46, { dark: 0.3, rimCol: LILAC, icon: 'link', ic: LILAC }));
  if (t >= T.end - 0.05) {
    const kc = cub(k01(t, T.end - 0.05, 0.4)), z = lerp(1.06, 1, kc);
    cv.save(); cv.globalAlpha = kc; cv.translate(CX, 1020); cv.scale(z, z); cv.translate(-CX, -1020); glass(120, 540, 840, 960, 64, { tint: VIO, tintA: 0.15, rimCol: LILAC }); cv.restore();
    const ki = pop(t - T.end, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 730, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.8); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
    const kw = cub(k01(t, T.end + 0.25, 0.35)); if (kw > 0 && IMG.word) { const w = 520, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 910 + (1 - kw) * 24, w, h); cv.restore(); }
    const kb = pop(t - T.end - 0.45, 14, 0.6); if (kb > 0) at(CX, 1150, cl(kb, 0, 1.2), cl(kb), () => pill('چالش ۱۰۰ معامله', 0, 0, 50, { solid: [VIO, MAG], icon: 'trophy', ilw: 2.6 }));
    const kg = pop(t - T.end - 0.7, 14, 0.55); if (kg > 0) at(CX, 1300, cl(kg, 0, 1.25), cl(kg), () => pill('لینک توی بیو', 0, 0, 44, { flat: true, tint: VIO, tintA: 0.4, rimCol: LILAC, icon: 'link', ic: LILAC }));
    const ka = cub(k01(t, T.end + 1.1, 0.4)); if (ka > 0) { const y = 1420 - ((t * 1.6) % 1) * 26; cv.save(); cv.globalAlpha = ka; icon('chevrons-down', CX, y, 78, LILAC, { lw: 2.4, glow: rgba(LILAC, 0.7) }); cv.restore(); }
  }
  captions(t);
};
/** The cover: the map at a glance under the title. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.globalCompositeOperation = 'source-over';
  background(0, 3000); snap();
  cv.save(); cv.translate(CX, 1250); cv.scale(0.3, 0.3); cv.translate(-CX, -3330); diagram(T.end); cv.restore();
  glass(60, 230, 960, 460, 64, { dark: 0.42, tint: VIO, tintA: 0.12, rimCol: LILAC });
  const g = cv.createLinearGradient(300, 330, 780, 450); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, LILAC);
  txt('چالش', CX, 360, 120, g, { glow: rgba(VIO, 0.6), blur: 40 }); txt(fa(100) + ' معامله', CX, 520, 120, LILAC, { glow: rgba(VIO, 0.6), blur: 40 });
  txt('تا آخرش بری، دیگه مثل قبل ترید نمی‌کنی', CX, 630, 40, MUT, { w: 700 });
};
(async () => {
  buildIcons();
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  window.seek(0); window.ready = true;
})();
