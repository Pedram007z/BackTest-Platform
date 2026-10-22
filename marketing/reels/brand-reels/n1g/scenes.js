// n1g · «سه تا عدد», the glass cut of n1: the same take, timing and soundtrack (../n1/mix.wav), restyled.
// Frosted-glass cards (a real blur of the scene behind them, a dark frost, a light rim) over slowly drifting colour
// fields and floating glossy shapes; Lucide icons on gradient squircles; a padlock whose shackle lifts.
// Hook: a glass lock card «حساب پراپ · پول واقعی» with three combination tiles that spin and land on «یک / دو / سه»
// (average R → a scale, the losing streak → a five-tally, the worst drawdown → trending-down). «چرا؟»: a glass heart
// monitor, five «−1R», the pulse racing while the colours turn red; the three moves of the trader without numbers;
// the trader with numbers: «۵ از ۷» (an example), a breathing orb, play. «این آرامش، از عدد میاد»: the lock opens into
// light and BacktestLab comes out of it. Real gold daily candles (XAUUSD, Sep 2025), the three stats under the names
// the platform's analytics uses, the coin into the lock card, the end card. 1080×1920, every frame a pure function of t.
const W = 1080, H = 1920, CX = 540;
const INK = '#FFFFFF', MUT = 'rgba(232,236,255,0.68)', MINT = '#3CF0B4', TEAL = '#14B8A6', RED = '#FF5C72', AMB = '#FFC15A', VIO = '#8B6CFF',
  LILAC = '#C9BBFF', BLUE = '#4D8DFF', PINK = '#FF5FB0', CYAN = '#49E0FF', ORANGE = '#FF8A3D', DEEP = '#0B0A22';
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

// ---------- the pulse (the same curve as n1's scenes.js and sound.py) ----------
function bpm(t) {
  if (t < T.why) return 76;
  if (t < T.fifth) return lerp(76, 104, k01(t, T.why, T.fifth - T.why));
  if (t < T.panic) return lerp(104, 118, k01(t, T.fifth, T.panic - T.fifth));
  if (t < T.calm) return lerp(118, 148, k01(t, T.panic, 3));
  if (t < T.breath) return lerp(148, 96, cub(k01(t, T.calm, 1.5)));
  return lerp(96, 70, cub(k01(t, T.breath, 2)));
}

// ---------- background: drifting colour fields that follow the mood, and floating glossy shapes ----------
const PAL = { hook: [VIO, BLUE, PINK, CYAN, VIO], panic: [RED, ORANGE, PINK, RED, '#B4306E'], calm: [MINT, CYAN, BLUE, '#22C79F', VIO], brand: [VIO, MINT, BLUE, PINK, CYAN] };
const BLOBS = [[160, 520, 640], [940, 760, 600], [240, 1360, 660], [900, 1580, 600], [540, 1020, 480]];
function mood(t) {
  const stress = t < T.calm ? Math.max(0.4 * k01(t, T.why, T.fifth - T.why), cub(k01(t, T.panic - 0.4, 0.8))) : 1 - cub(k01(t, T.calm, 0.9));
  return { stress, calm: win(t, T.calm, T.peace + 0.4, 0.9, 0.7), brand: cub(k01(t, T.peace + 0.3, 1.4)) };
}
function shapes(t) {
  const f = (a, s, p) => a * Math.sin(t * s + p);
  sphere(880 + f(24, 0.4, 0), 600 + f(30, 0.33, 1), 118, CYAN, '#2A3BD8');
  sphere(120 + f(18, 0.5, 2), 690 + f(26, 0.37, 0.5), 64, PINK, '#6A2BD8');
  torus(170 + f(20, 0.3, 1), 1470 + f(28, 0.35, 2), 128, 44, VIO, PINK, -0.5 + 0.15 * Math.sin(t * 0.4));
  capsule(930 + f(16, 0.45, 3), 1530 + f(24, 0.3, 1.5), 280, 112, -0.6 + 0.1 * Math.sin(t * 0.35), AMB, '#FF4F8B');
  sphere(1000 + f(10, 0.6, 1), 1120 + f(18, 0.5, 2.5), 40, MINT, '#0F7F70');
}
function background(t) {
  const g = cv.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, '#130F36'); g.addColorStop(1, '#06051A'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  const m = mood(t), hk = Math.exp(-(((t * bpm(t)) / 60) % 1) * 5);
  cv.save(); cv.globalCompositeOperation = 'screen';
  BLOBS.forEach(([x0, y0, r0], i) => {
    let c = hx(PAL.hook[i]); [['panic', m.stress], ['calm', m.calm], ['brand', m.brand]].forEach(([k, w]) => { const d = hx(PAL[k][i]); c = c.map((v, j) => lerp(v, d[j], w)); });
    c = c.map(Math.round);
    const x = x0 + 110 * Math.sin(t * 0.31 + i * 1.7) + m.stress * 36 * Math.sin(t * 5.3 + i * 2), y = y0 + 130 * Math.cos(t * 0.26 + i * 2.3), r = r0 * (1 + 0.07 * hk * m.stress);
    const gg = cv.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${c},0.6)`); gg.addColorStop(0.55, `rgba(${c},0.2)`); gg.addColorStop(1, `rgba(${c},0)`);
    cv.fillStyle = gg; cv.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  cv.restore();
  shapes(t);
  const v = cv.createRadialGradient(CX, 960, 520, CX, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(2,1,10,0.55)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
}

// ---------- captions: typed in word by word on a glass plate at the top ----------
// [text, first word index, colour]
const PH = [
  [[['قبل', 0], ['از', 1], ['اینکه', 2], ['حساب', 4], ['پراپ', 5, AMB], ['بخری', 6]], [['یا', 7], ['با', 8], ['پول', 9], ['واقعی', 10, AMB], ['ترید', 11], ['کنی،', 12]]],
  [[['سه', 13, MINT], ['تا', 14, MINT], ['عدد', 15, MINT], ['رو', 16], ['باید', 17]], [['درباره‌ی', 18], ['خودت', 20], ['از', 21], ['حفظ', 22], ['باشی.', 23]]],
  [[['یک:', 24, MINT], ['هر', 25], ['معامله', 26]], [['به‌طور', 27], ['میانگین', 29], ['چند', 30], ['R', 31, MINT], ['برات', 32], ['میاره.', 33]]],
  [[['دو:', 34, MINT], ['بیشترین', 35], ['ضررهای', 36, RED]], [['پشت‌سرهمت', 37], ['چندتا', 39], ['بوده.', 41]]],
  [[['سه:', 42, MINT], ['بدترین', 43], ['افت', 44, RED]], [['حسابت', 45], ['چقدر', 46], ['بوده.', 47]]],
  [[['چرا؟', 48, AMB]], [['چون', 49], ['بالاخره', 50], ['یه', 51], ['روز…', 52]]],
  [[['پنجمین', 53, RED], ['ضرر', 54, RED]], [['پشت‌سرهم', 55], ['میاد…', 57]]],
  [[['تریدری', 58], ['که', 59], ['این', 60], ['عددا', 61], ['رو', 62]], [['نمی‌دونه،', 63, RED]]],
  [[['همون‌جا', 64], ['ریسک', 65, RED], ['رو', 66]], [['دو', 67, RED], ['برابر', 68, RED], ['می‌کنه،', 69]]],
  [[['اورترید', 70, RED], ['می‌کنه،', 71]]],
  [[['یا', 72], ['استراتژی‌ای', 73], ['رو', 74], ['که', 75], ['تا', 76], ['دیروز', 77]], [['سود', 78, MINT], ['می‌داد', 79], ['کنار', 80, RED], ['می‌ذاره.', 81]]],
  [[['ولی', 82, MINT], ['تریدری', 83], ['که', 84], ['می‌دونه', 85]], [['سیستمش', 86], ['تو', 87], ['بک‌تست', 88]]],
  [[['هفت‌تا', 90, AMB], ['ضرر', 91], ['پشت‌سرهم', 92]], [['هم', 93], ['داشته…', 94]]],
  [[['فقط', 95], ['یه', 96], ['نفس', 97, MINT], ['عمیق', 98, MINT], ['می‌کشه', 99]], [['و', 100], ['ادامه', 101, MINT], ['می‌ده.', 102]]],
  [[['این', 103], ['آرامش،', 104, MINT]], [['از', 105], ['عدد', 106, MINT], ['میاد.', 107]]],
  [[['توی', 108], ['بک‌تست‌لب،', 109, LILAC]], [['ستاپت', 112], ['رو', 113], ['روی', 114], ['بازار', 115], ['واقعی', 116], ['تست', 117, MINT], ['می‌کنی،', 118]]],
  [[['و', 119], ['آنالیز', 120, MINT], ['این', 121], ['سه‌تا', 122], ['عدد', 123]], [['رو', 124], ['جلوت', 125], ['می‌ذاره.', 126]]],
  [[['اول', 127], ['عددهاتو', 128, MINT], ['بشناس،', 129]], [['بعد', 130], ['پول', 131, AMB], ['بذار.', 132]]],
];
const phAt = (p) => ws(p[0][0][1]);
function captions(t) {
  const pa = 1 - cub(k01(t, T.end - 0.35, 0.3)); if (pa <= 0) return;
  cv.save(); cv.globalAlpha = pa; glass(52, 212, 976, 276, 62, { dark: 0.4 }); cv.restore();
  if (t >= T.end - 0.05) return;
  let cur = -1; PH.forEach((p, i) => { if (t >= phAt(p) - 0.1) cur = i; });
  if (cur < 0) return;
  const p = PH[cur], next = cur + 1 < PH.length ? phAt(PH[cur + 1]) - 0.1 : T.end - 0.05, y0 = p.length === 1 ? 350 : 302;
  let last = null;
  p.forEach((ln, li) => {
    const size = li === 0 ? 74 : 66, y = y0 + li * 98, gap = measure(' ', size) * 1.3;
    const wds = ln.map(([s]) => measure(s, size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.length - 1), sc = Math.min(1, 900 / total);
    let right = CX + (total * sc) / 2;
    ln.forEach(([s, wi, col], j) => {
      const st = cur === 0 && li === 0 ? -1 : ws(wi) - 0.04, wpx = wds[j] * sc;
      if (t >= st) {
        const a = cl((t - st) / 0.06);
        cv.save(); cv.globalAlpha = a * (1 - k01(t, next - 0.06, 0.06)); cv.translate(right - wpx / 2, y); cv.scale(sc, sc); txt(s, 0, 0, size, col ?? INK, { glow: col ? rgba(col, 0.35) : null, blur: 24 }); cv.restore();
        last = [right - wpx, y, size * sc];
      }
      right -= wpx + gap * sc;
    });
  });
  if (last && Math.floor(t * 2.6) % 2 === 0) { cv.save(); cv.shadowColor = rgba(MINT, 0.7); cv.shadowBlur = 16; cv.fillStyle = MINT; cv.fill(rr(last[0] - 32, last[1] - last[2] * 0.4, 14, last[2] * 0.8, 7)); cv.restore(); }
}

// ---------- the lock card: a padlock and three combination tiles ----------
const TILES = [{ x: 800, label: 'میانگین R', ic: 'scale', c: [MINT, TEAL] }, { x: 540, label: 'باخت‌های پیاپی', ic: 'tally', c: [RED, PINK] }, { x: 280, label: 'بدترین افت', ic: 'trending-down', c: [ORANGE, RED] }];
const CARD = [90, 600, 900, 840], LY = 880, TY = 1220;
/** A padlock centred at (x, y): gold while the numbers are unknown, mint once known (k); open (0–1) lifts the shackle and swings it. */
function padlock(x, y, open, k) {
  cv.save(); cv.translate(x, y);
  const lift = cub(k01(open, 0, 0.45)) * 30, rot = -0.6 * cub(k01(open, 0.3, 0.7));
  cv.save(); cv.translate(34, -14 - lift); cv.rotate(rot);
  cv.beginPath(); cv.moveTo(0, 8); cv.lineTo(0, -34); cv.arc(-34, -34, 34, 0, Math.PI, true); cv.lineTo(-68, 8);
  const sg = cv.createLinearGradient(-70, -70, 0, 0); sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(1, '#BFC6E6'); cv.strokeStyle = sg; cv.lineWidth = 17; cv.lineCap = 'round'; cv.stroke();
  cv.restore();
  const p = rr(-62, -18, 124, 98, 26);
  cv.save(); cv.shadowColor = rgba(mixc(AMB, MINT, k), 0.6); cv.shadowBlur = 44; cv.shadowOffsetY = 6;
  const bg = cv.createLinearGradient(-62, -18, 62, 80); bg.addColorStop(0, mixc('#FFD67A', '#8BFFD9', k)); bg.addColorStop(1, mixc('#FF8A3D', '#12B39A', k)); cv.fillStyle = bg; cv.fill(p); cv.restore();
  cv.save(); cv.clip(p); const gl = cv.createLinearGradient(0, -18, 0, 34); gl.addColorStop(0, 'rgba(255,255,255,0.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = gl; cv.fillRect(-62, -18, 124, 52); cv.restore();
  cv.strokeStyle = 'rgba(255,255,255,0.55)'; cv.lineWidth = 2; cv.stroke(p);
  cv.fillStyle = mixc('#7A3A06', '#064D3E', k); cv.beginPath(); cv.arc(0, 22, 12, 0, Math.PI * 2); cv.fill(); cv.fill(rr(-5, 26, 10, 26, 5));
  cv.restore();
}
/** The round glass emblem holding the padlock, with a slowly turning gradient ring. pulse: seconds since the coin landed. */
function emblem(t, x, y, open, k, pulse) {
  glassC(x, y, 124, { flat: true, tint: mixc(VIO, MINT, k), tintA: 0.12 });
  cv.save();
  [[1 - k, [VIO, CYAN, PINK]], [k, [MINT, CYAN, TEAL]]].forEach(([a, cs]) => { if (a <= 0) return; const cg = cv.createConicGradient(t * 0.8, x, y); cg.addColorStop(0, cs[0]); cg.addColorStop(0.33, cs[1]); cg.addColorStop(0.66, cs[2]); cg.addColorStop(1, cs[0]);
    cv.save(); cv.globalAlpha *= a; cv.strokeStyle = cg; cv.lineWidth = 7; cv.beginPath(); cv.arc(x, y, 124, 0, Math.PI * 2); cv.stroke(); cv.restore(); });
  cv.restore();
  padlock(x, y + 4, open, k);
  if (pulse > 0) {
    const e = cl(pulse / 0.9); if (e < 1) { cv.save(); cv.globalAlpha *= 1 - e; circle(x, y, 124 + 220 * cub(e), null, MINT, 8 * (1 - e) + 1); cv.restore(); }
    [[x + 150, y - 110, 0], [x - 160, y - 80, 0.12], [x + 120, y + 120, 0.24]].forEach(([sx, sy, d]) => { const kk = pop(pulse - d, 14, 0.5); if (kk > 0) at(sx, sy, cl(kk, 0, 1.3), cl(kk) * (1 - k01(pulse, 1.4, 0.4)), () => icon('sparkles', 0, 0, 64, MINT, { lw: 2, glow: rgba(MINT, 0.8), fill: rgba(MINT, 0.35) })); });
  }
}
/** One combination tile: «؟», spinning digits, then its icon; st = { spin, land } (times or null). */
function tile(t, i, st, o) {
  const d = TILES[i], x = d.x, y = TY, w = 236, h = 290, cy = y - 28;
  const landed = st.land !== undefined && st.land !== null && t >= st.land, spinning = st.spin !== undefined && st.spin !== null && t >= st.spin && !landed;
  glass(x - w / 2, y - h / 2, w, h, 46, { flat: true, tint: landed ? d.c[0] : null, tintA: 0.08, rimCol: landed ? d.c[0] : null });
  const ix = x + w / 2 - 30, iy = y - h / 2 + 30; circle(ix, iy, 19, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.35)', 2); txt(fa(i + 1), ix, iy + 2, 23, landed ? INK : MUT, { w: 800 });
  if (spinning) {
    const p = cl((t - st.spin) / (st.land - st.spin)), v = (1 - cub(p)) * 30 + i * 3, off = (v % 1) * 110;
    cv.save(); cv.clip(rr(x - 72, cy - 72, 144, 144, 42)); cv.fillStyle = 'rgba(255,255,255,0.06)'; cv.fillRect(x - 72, cy - 72, 144, 144);
    for (let j = -2; j <= 2; j++) txt(fa(String((Math.floor(v) + j + 10) % 10)), x, cy + off - j * 110, 100, rgba(INK, j === 0 ? 0.95 : 0.3));
    cv.restore(); cv.save(); cv.strokeStyle = rgba(AMB, 0.8); cv.lineWidth = 3; cv.stroke(rr(x - 72, cy - 72, 144, 144, 42)); cv.restore();
  } else if (landed) {
    const k = pop(t - st.land, 15, 0.5), e = k01(t, st.land, 0.7);
    if (e < 1) { const g = cub(e); cv.save(); cv.globalAlpha *= 1 - e; cv.strokeStyle = d.c[0]; cv.lineWidth = 6 * (1 - e) + 1; cv.stroke(rr(x - 72 - 50 * g, cy - 72 - 50 * g, 144 + 100 * g, 144 + 100 * g, 42 + 24 * g)); cv.restore(); }
    at(x, cy, cl(k, 0, 1.25), cl(k), () => badge(d.ic, 0, 0, 130, d.c[0], d.c[1], { lw: 2.2 }));
  } else {
    const lit = o.lit ?? 0;
    cv.save(); cv.setLineDash([12, 10]); cv.strokeStyle = lit > 0 ? rgba(AMB, 0.35 + 0.45 * lit) : 'rgba(255,255,255,0.28)'; cv.lineWidth = 3; cv.stroke(rr(x - 72, cy - 72, 144, 144, 42)); cv.restore();
    txt('؟', x, cy + 6, 100, lit > 0 ? mixc('#C8CCE0', AMB, lit) : MUT, { glow: lit > 0 ? rgba(AMB, 0.6 * lit) : null, blur: 30 });
  }
  txt(d.label, x, y + 104, 30, landed ? INK : MUT, { w: 800 });
  if (o.checks !== undefined && t >= o.checks + i * 0.12) { const k = pop(t - o.checks - i * 0.12, 16, 0.5); at(x - w / 2 + 30, y - h / 2 + 30, cl(k, 0, 1.25), cl(k), () => { orb(0, 0, 22, MINT, TEAL); icon('check', 0, 1, 27, '#04271D', { lw: 3.4 }); }); }
}
/** The light out of the opening lock: a bloom and three shockwave rings. */
function light(x, y, k) {
  if (k <= 0) return;
  const A = cv.globalAlpha;
  cv.save(); cv.globalCompositeOperation = 'screen';
  const R = lerp(140, 1350, cub(k)), g = cv.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, `rgba(255,255,255,${0.95 * k})`); g.addColorStop(0.22, rgba(MINT, 0.75 * k)); g.addColorStop(0.6, rgba(CYAN, 0.22 * k)); g.addColorStop(1, rgba(CYAN, 0));
  cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) { const e = cl(k * 1.4 - i * 0.2); if (e <= 0 || e >= 1) continue; cv.globalAlpha = A * (1 - e) * 0.85; circle(x, y, 124 + e * 760, null, '#FFFFFF', 5); }
  cv.restore();
}
/** o: lit (the «؟» glow), known (lock turns mint), drums [{spin, land}], checks (t), open (0–1), emblemA, slot, pulse */
function lockCard(t, o) {
  const open = o.open ?? 0, keep = 1 - cub(k01(open, 0, 0.55)), [x, y, w, h] = CARD;
  glass(x, y, w, h, 64, { tint: o.known ? MINT : null, tintA: 0.05 * (o.known ?? 0) });
  cv.save(); cv.globalAlpha *= keep;
  pill('حساب پراپ · پول واقعی', CX, 690, 34, { icon: 'landmark', ic: AMB, fg: INK, flat: true, tint: AMB, tintA: 0.08 });
  TILES.forEach((d, i) => tile(t, i, o.drums?.[i] ?? {}, o));
  cv.restore();
  light(CX, LY, open);
  const ea = o.emblemA ?? 1; if (ea > 0) { cv.save(); cv.globalAlpha *= ea; emblem(t, CX, LY, open, o.known ?? 0, o.pulse ?? 0); cv.restore(); }
  if (o.slot) { cv.save(); cv.fillStyle = 'rgba(4,3,14,0.8)'; cv.fill(rr(CX - 110, 618, 220, 22, 11)); cv.strokeStyle = rgba(AMB, 0.7); cv.lineWidth = 2.5; cv.stroke(rr(CX - 110, 618, 220, 22, 11)); cv.restore(); }
}

// ---------- the heart monitor ----------
/** ECG: y offset at time-phase u (seconds along the trace) for a given rate (beats/min) and chaos (0–1). */
function ecgAt(u, bpmv, chaos) {
  const per = 60 / bpmv, n = Math.floor(u / per), ph = (u - n * per) / per, jit = chaos * (rnd(n) - 0.5) * 0.25;
  const p = ph + jit, amp = 1 + chaos * (rnd(n + 7) - 0.3) * 1.2;
  let y = Math.sin(u * 30 + n) * 3 * chaos;
  if (p > 0.1 && p < 0.16) y -= 18 * Math.sin(((p - 0.1) / 0.06) * Math.PI);
  if (p > 0.22 && p < 0.25) y += 26 * ((p - 0.22) / 0.03) * amp;
  if (p > 0.25 && p < 0.3) y -= 190 * Math.sin(((p - 0.25) / 0.05) * Math.PI) * amp;
  if (p > 0.3 && p < 0.33) y += 50 * Math.sin(((p - 0.3) / 0.03) * Math.PI) * amp;
  if (p > 0.45 && p < 0.6) y -= 34 * Math.sin(((p - 0.45) / 0.15) * Math.PI);
  return y;
}
const MON = [60, 580, 960, 930], YC = 1090;
function monitor(t, a, s) {
  if (a <= 0) return;
  cv.save(); cv.globalAlpha = a; cv.translate(CX, 1045); cv.scale(s, s); cv.translate(-CX, -1045);
  const panic = win(t, T.panic, T.calm + 0.2, 0.3, 0.5), calm = cub(k01(t, T.calm, 0.5)), [mx, my, mw, mh] = MON;
  glass(mx, my, mw, mh, 64, { tint: panic > 0.01 ? RED : calm > 0.01 ? MINT : null, tintA: 0.08 * Math.max(panic, calm), rimCol: panic > 0.5 ? RED : null });
  cv.save(); cv.clip(rr(mx, my, mw, mh, 64));
  // a faint grid behind the trace
  const gg = cv.createLinearGradient(0, 860, 0, 1240); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
  cv.strokeStyle = gg; cv.lineWidth = 2; cv.beginPath(); for (let x = 120; x < 1000; x += 60) { cv.moveTo(x, 860); cv.lineTo(x, 1240); } for (let y = 880; y <= 1240; y += 60) { cv.moveTo(100, y); cv.lineTo(980, y); } cv.stroke();
  // header: the pulse (right), who (left)
  const b = bpm(t), hk = Math.exp(-(((t * b) / 60) % 1) * 6), hc = mixc(MINT, RED, panic), hc2 = mixc(TEAL, PINK, panic);
  at(925, 680, 1 + 0.12 * hk, 1, () => badge('heart-pulse', 0, 0, 100, hc, hc2, {}));
  const bs = fa(Math.round(b)), bw = measure(bs, 66); txt(bs, 852, 686, 66, INK, { align: 'right', dir: 'ltr' }); txt('ضربان', 852 - bw - 16, 694, 28, MUT, { align: 'right', w: 700 });
  const who = panic > 0.5 ? ['تریدرِ بی‌عدد', RED, 'triangle-alert'] : calm > 0.5 ? ['تریدرِ با عدد', MINT, 'shield-check'] : ['ضرر پشت‌سرهم', AMB, 'activity'];
  pill(who[0], 0, 680, 30, { left: 110, icon: who[2], ic: who[1], fg: mixc(who[1], '#FFFFFF', 0.35), flat: true, tint: who[1], tintA: 0.12, rimCol: who[1] });
  // the five losses, one by one up to «پنجمین»
  for (let i = 0; i < 5; i++) {
    const st = i < 4 ? lerp(T.why + 0.3, T.fifth - 0.35, i / 3) : ws(53), k = pop(t - st, 16, 0.55); if (k <= 0) continue;
    const x = 880 - i * 170, big = i === 4 ? 1 + 0.25 * Math.exp(-(t - st) * 4) : 1, dim = 1 - 0.55 * calm;
    at(x, 795, cl(k, 0, 1.2) * big, cl(k) * dim, () => {
      if (i === 4) { cv.save(); cv.shadowColor = rgba(RED, 0.7); cv.shadowBlur = 40; const g = cv.createLinearGradient(-75, -42, 75, 42); g.addColorStop(0, RED); g.addColorStop(1, '#D61F5B'); cv.fillStyle = g; cv.fill(rr(-75, -42, 150, 84, 42)); cv.restore(); cv.strokeStyle = 'rgba(255,255,255,0.5)'; cv.lineWidth = 2; cv.stroke(rr(-75, -42, 150, 84, 42)); txt('−1R', 0, 3, 42, '#FFFFFF', { dir: 'ltr' }); }
      else { glass(-75, -42, 150, 84, 42, { flat: true, tint: RED, tintA: 0.16, rimCol: RED }); txt('−1R', 0, 3, 42, '#FF8C9A', { dir: 'ltr' }); }
    });
  }
  const k5 = pop(t - ws(53) - 0.1, 12, 0.5); if (k5 > 0 && t < T.panic + 0.3) at(CX, 900, cl(k5, 0, 1.2), cl(k5) * (1 - k01(t, T.panic, 0.3)), () => pill('پنجمین ضرر پشت‌سرهم', 0, 0, 40, { bare: true, icon: 'triangle-alert', ic: RED, fg: RED, iglow: rgba(RED, 0.7) }));
  // the trace, scrolling right to left
  const u0 = t * 2.2, chaos = panic, A = 0.7, tg = cv.createLinearGradient(110, 0, 970, 0); tg.addColorStop(0, rgba(hc, 0)); tg.addColorStop(0.35, rgba(hc, 0.75)); tg.addColorStop(1, hc);
  cv.save(); cv.lineWidth = 7; cv.lineJoin = 'round'; cv.lineCap = 'round'; cv.strokeStyle = tg; cv.shadowColor = hc; cv.shadowBlur = 22; cv.beginPath();
  for (let x = 970; x >= 110; x -= 4) { const u = u0 - (970 - x) / 420, y = YC + A * ecgAt(Math.max(0, u), b, chaos); x === 970 ? cv.moveTo(x, y) : cv.lineTo(x, y); }
  cv.stroke(); cv.restore();
  const hy = YC + A * ecgAt(u0, b, chaos); cv.save(); cv.shadowColor = hc; cv.shadowBlur = 30; circle(970, hy, 11, '#FFFFFF'); cv.restore(); circle(970, hy, 20 + 10 * hk, null, rgba(hc, 0.5 * hk), 3);
  // the trader without numbers: three moves, stamped as they are said
  if (panic > 0) {
    const moves = [['ریسک ×۲', ws(65), 'zap'], ['اورترید', ws(70), 'repeat'], ['استراتژی کنار گذاشته شد', ws(80), 'trash-2']];
    moves.forEach(([str, st, ic], i) => { const k = pop(t - st, 16, 0.5); if (k <= 0) return; const y = 1250 + i * 94, rot = (i % 2 ? 1 : -1) * 0.022;
      at(CX, y, lerp(1.45, 1, cl(k)), cl(k * 1.5) * panic, () => pill(str, 0, 0, 36, { icon: ic, ic: '#FF8C9A', fg: '#FFFFFF', flat: true, tint: RED, tintA: 0.28, rimCol: RED, minW: 540, iglow: rgba(RED, 0.8) }), rot); });
  }
  // the trader with numbers: «۵ از ۷», a deep breath, play
  if (calm > 0) {
    const k7 = pop(t - ws(90), 14, 0.6);
    if (k7 > 0) at(CX, 1335, cl(k7, 0, 1.1), cl(k7), () => {
      glass(-440, -122, 880, 244, 44, { flat: true, tint: MINT, tintA: 0.08, rimCol: MINT });
      txt('بک‌تست: بیشترین باخت‌های پیاپی', 400, -72, 34, INK, { align: 'right', w: 800 });
      pill('مثال', 0, -72, 22, { left: -410, flat: true, fg: MUT, rimCol: '#B8BFD8' });
      for (let i = 0; i < 7; i++) { const x = 330 - i * 110, ki = pop(t - ws(90) - 0.06 * i, 16, 0.6); if (ki <= 0) continue;
        at(x, 8, cl(ki, 0, 1.2), cl(ki), () => { if (i < 5) sphere(0, 0, 30, RED, '#9E1438'); else { cv.save(); cv.setLineDash([8, 7]); circle(0, 0, 28, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.55)', 3); cv.restore(); } }); }
      const kq = cub(k01(t, ws(94), 0.35)); if (kq > 0) pill('۵ از ۷ · هنوز تو محدوده‌ی عادیه', 0, 80, 30, { bare: true, icon: 'shield-check', ic: MINT, fg: MINT, alpha: kq });
    });
    const kb = win(t, ws(97), T.peace, 0.3, 0.4);
    if (kb > 0) { const br = 0.5 - 0.5 * Math.cos(((t - ws(97)) / 2.4) * Math.PI * 2), r = lerp(84, 150, br);
      cv.save(); cv.globalAlpha *= kb; circle(CX, YC, r + 22, null, rgba(MINT, 0.25), 3); glassC(CX, YC, r, { flat: true, tint: MINT, tintA: 0.16, rimCol: MINT });
      icon('wind', CX, YC - 24, 50, MINT, { lw: 2.2, glow: rgba(MINT, 0.6) }); txt(br > 0.5 ? 'دم' : 'بازدم', CX, YC + 34, 34, INK); cv.restore(); }
    const kp = pop(t - ws(101), 14, 0.55);
    if (kp > 0) at(900, 905, cl(kp, 0, 1.2), cl(kp), () => { orb(0, 0, 54, MINT, TEAL); icon('play', 5, 0, 46, '#04271D', { fill: '#04271D', lw: 2 }); });
  }
  cv.restore(); cv.restore();
}

// ---------- real gold candles, tested ----------
function goldPanel(t, a) {
  if (a <= 0) return;
  const s = lerp(1.06, 1, cub(k01(t, T.test, 0.45)));
  cv.save(); cv.globalAlpha = a; cv.translate(CX, 1010); cv.scale(s, s); cv.translate(-CX, -1010);
  glass(60, 600, 960, 820, 64, {});
  pill('تست روی بازار واقعی', 0, 690, 32, { right: 980, icon: 'chart-candlestick', ic: MINT, fg: INK, flat: true, tint: MINT, tintA: 0.12, rimCol: MINT });
  const B = GOLD.bars, N = B.length, x0 = 110, x1 = 970, y0 = 790, y1 = 1260, step = (x1 - x0) / N, bw = step * 0.56;
  const lo = Math.min(...B.map((q) => q[2])) - 15, hi = Math.max(...B.map((q) => q[1])) + 15, Y = (p) => y1 - ((p - lo) / (hi - lo)) * (y1 - y0);
  cv.save(); cv.strokeStyle = 'rgba(255,255,255,0.07)'; cv.lineWidth = 2; cv.setLineDash([6, 10]); for (let i = 0; i <= 4; i++) { const y = lerp(y0, y1, i / 4); cv.beginPath(); cv.moveTo(x0, y); cv.lineTo(x1, y); cv.stroke(); } cv.restore();
  for (let i = 0; i < N; i++) {
    const st = T.test + 0.2 + i * 0.11, k = cub(k01(t, st, 0.18)); if (k <= 0) continue;
    const [o, h, l, c] = B[i], up = c >= o, c1 = up ? MINT : RED, c2 = up ? TEAL : '#D61F5B', x = x0 + step * (i + 0.5), mid = (Y(o) + Y(c)) / 2;
    const top = lerp(mid, Y(Math.max(o, c)), k), bot = lerp(mid, Y(Math.min(o, c)), k);
    cv.save(); cv.strokeStyle = rgba(c1, 0.8); cv.lineWidth = 4; cv.lineCap = 'round'; cv.beginPath(); cv.moveTo(x, lerp(mid, Y(h), k)); cv.lineTo(x, lerp(mid, Y(l), k)); cv.stroke(); cv.restore();
    cv.save(); cv.shadowColor = rgba(c1, 0.55); cv.shadowBlur = 22; const g = cv.createLinearGradient(0, top, 0, bot + 1); g.addColorStop(0, mixc(c1, '#FFFFFF', 0.25)); g.addColorStop(1, c2); cv.fillStyle = g; cv.fill(rr(x - bw / 2, top, bw, Math.max(8, bot - top), 9)); cv.restore();
  }
  txt('طلا · روزانه · شهریور ۱۴۰۴ · داده‌ی واقعی', CX, 1350, 30, MUT, { w: 700 });
  cv.restore();
}
// the three numbers, under the names the platform's analytics uses
function statsPanel(t, a) {
  if (a <= 0) return;
  cv.save(); cv.globalAlpha = a;
  const kt = cub(k01(t, T.analytics, 0.4));
  cv.save(); cv.globalAlpha *= kt; badge('chart-line', 930, 650, 88, VIO, BLUE, { blur: 30 }); txt('آنالیز', 866, 656, 52, INK, { align: 'right' }); cv.restore();
  const rows = [['میانگین RR', 'scale', MINT, TEAL, ws(121)], ['بیشترین باخت‌های پیاپی', 'tally', RED, PINK, ws(122)], ['افت سرمایه در بدترین ۵٪', 'trending-down', ORANGE, RED, ws(123)]];
  rows.forEach(([s, ic, c1, c2, st], i) => {
    const k = pop(t - st + 0.15, 14, 0.6); if (k <= 0) return; const y = 830 + i * 232;
    at(CX, y, cl(k, 0, 1.1), cl(k), () => {
      glass(-450, -100, 900, 200, 48, {});
      badge(ic, 345, 0, 132, c1, c2, { lw: 2.2 });
      txt(s, 255, -28, 42, INK, { align: 'right', w: 800 });
      const caret = Math.floor(t * 2.6) % 2 ? '▍' : ''; txt('عدد خودت ' + caret, 255, 38, 34, MINT, { align: 'right', w: 700 });
    });
  });
  cv.restore();
}
// the coin, dropped into the lock card's slot on «بعد پول بذار»
function coin(t) {
  const st = ws(131) - 0.1, d = t - st; if (d <= 0) return;
  const f = cl(d / 0.55), y = d < 0.55 ? lerp(480, 629, f * f) : 629, a = d < 0.55 ? 1 : 1 - cl((d - 0.55) / 0.2), s = d < 0.55 ? 1 : lerp(1, 0.5, cl((d - 0.55) / 0.2));
  if (a <= 0) return;
  at(CX, y, s, a, () => {
    cv.scale(Math.max(0.15, Math.abs(Math.cos(d * 9))), 1);
    cv.save(); cv.shadowColor = rgba(AMB, 0.7); cv.shadowBlur = 40; const g = cv.createRadialGradient(-20, -24, 6, 0, 0, 62); g.addColorStop(0, '#FFF1C2'); g.addColorStop(0.45, AMB); g.addColorStop(1, '#E07B12'); circle(0, 0, 60, g); cv.restore();
    circle(0, 0, 60, null, '#FFE6A3', 4); circle(0, 0, 46, null, 'rgba(138,75,0,0.35)', 3); icon('dollar-sign', 0, 0, 58, '#8A4B00', { lw: 3 });
  });
}

// ---------- frame ----------
window.DURATION = DUR;
const settled = TILES.map(() => ({ spin: null, land: 0 }));
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none'; cv.globalCompositeOperation = 'source-over';
  background(t); snap();
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(ws(53), 12) + sh(ws(65), 7) + sh(ws(70), 7) + sh(ws(80), 7), 0);
  // 1 · the lock card: the tiles spin and land on «یک / دو / سه»; it sinks away on «چرا؟»
  const v1 = 1 - cub(k01(t, T.why - 0.05, 0.45));
  if (v1 > 0) {
    const z = lerp(1, 0.9, 1 - v1);
    cv.save(); cv.globalAlpha = v1; cv.translate(CX, 1020 + 40 * (1 - v1)); cv.scale(z, z); cv.translate(-CX, -1020);
    lockCard(t, { lit: cub(k01(t, ws(13), 0.4)), drums: TILES.map((d, i) => ({ spin: T[['one', 'two', 'three'][i]] + 0.05, land: T[['one', 'two', 'three'][i]] + 1.1 })) });
    cv.restore();
  }
  // 2 · the monitor: the streak, the panic, the calm
  monitor(t, Math.min(cub(k01(t, T.why, 0.4)), 1 - cub(k01(t, T.peace - 0.1, 0.4))), lerp(1.08, 1, cub(k01(t, T.why, 0.45))) * lerp(1, 0.94, cub(k01(t, T.peace - 0.1, 0.4))));
  // 3 · the lock card again, its tiles checked; it opens on «عدد», and BacktestLab comes out of the light
  const v2 = Math.min(cub(k01(t, T.peace - 0.1, 0.4)), 1 - cub(k01(t, T.brand + 0.6, 0.5)));
  if (v2 > 0) {
    const z = lerp(1.06, 1, cub(k01(t, T.peace - 0.1, 0.45)));
    cv.save(); cv.globalAlpha = v2; cv.translate(CX, 1020); cv.scale(z, z); cv.translate(-CX, -1020);
    lockCard(t, { lit: 1, known: cub(k01(t, T.peace + 0.55, 0.35)), drums: settled, checks: T.peace + 0.25, open: cub(k01(t, ws(106) - 0.05, 1.1)), emblemA: 1 - cub(k01(t, T.brand, 0.3)) });
    cv.restore();
  }
  const kl = pop(t - T.brand - 0.1, 11, 0.6);
  if (kl > 0 && t < T.test + 0.5 && IMG.icon) {
    const out = 1 - cub(k01(t, T.test - 0.1, 0.4));
    at(CX, LY, cl(kl, 0, 1.25) * lerp(1, 0.6, 1 - out), cl(kl) * out, () => { cv.shadowColor = rgba(MINT, 0.6); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -150, -150, 300, 300); });
    const kw = cub(k01(t, T.brand + 0.35, 0.35));
    if (kw > 0 && IMG.word) { const w = 540, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw * out; glass(CX - w / 2 - 44, 1080 - 30, w + 88, h + 60, 40, { dark: 0.55 }); cv.drawImage(IMG.word, CX - w / 2, 1080, w, h); cv.restore(); }
  }
  // 4 · real gold candles, then the three stats
  goldPanel(t, win(t, T.test, T.analytics + 0.2, 0.35, 0.35));
  statsPanel(t, win(t, T.analytics, T.know + 0.2, 0.35, 0.35));
  // 5 · «اول عددهاتو بشناس، بعد پول بذار»: the known lock card takes the coin
  const v3 = Math.min(cub(k01(t, T.know - 0.05, 0.4)), 1 - cub(k01(t, T.end - 0.05, 0.4)));
  if (v3 > 0) {
    const z = lerp(1.06, 1, cub(k01(t, T.know - 0.05, 0.45)));
    cv.save(); cv.globalAlpha = v3; cv.translate(CX, 1020); cv.scale(z, z); cv.translate(-CX, -1020);
    lockCard(t, { lit: 1, known: 1, drums: settled, checks: ws(128), slot: true, pulse: t - ws(131) - 0.45 }); coin(t);
    cv.restore();
  }
  // 6 · the end card
  if (t >= T.end - 0.05) {
    const kc = cub(k01(t, T.end - 0.05, 0.4)), z = lerp(1.06, 1, kc);
    cv.save(); cv.globalAlpha = kc; cv.translate(CX, 1020); cv.scale(z, z); cv.translate(-CX, -1020); glass(120, 540, 840, 960, 64, {}); cv.restore();
    const ki = pop(t - T.end, 12, 0.6);
    if (ki > 0 && IMG.icon) at(CX, 730, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.7); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
    const kw = cub(k01(t, T.end + 0.25, 0.35)); if (kw > 0 && IMG.word) { const w = 520, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 910 + (1 - kw) * 24, w, h); cv.restore(); }
    const kb = pop(t - ws(133) - 0.05, 14, 0.6), pulse = 1 + 0.04 * Math.sin((t - ws(133)) * 6) * (t > ws(133) + 1 ? 1 : 0);
    if (kb > 0) at(CX, 1150, cl(kb, 0, 1.2) * pulse, cl(kb), () => pill('لینک توی بیو', 0, 0, 56, { solid: [MINT, TEAL], fg: '#04271D', icon: 'link', ic: '#04271D', ilw: 2.6, w: 900 }));
    const kf = pop(t - ws(136) - 0.05, 14, 0.55); if (kf > 0) at(CX, 1300, cl(kf, 0, 1.25), cl(kf), () => pill('شروعش رایگانه', 0, 0, 46, { flat: true, tint: VIO, tintA: 0.4, rimCol: LILAC, icon: 'gift', ic: LILAC, fg: '#FFFFFF' }));
    const ka = cub(k01(t, ws(136) + 0.5, 0.4)); if (ka > 0) { const y = 1420 - ((t * 1.6) % 1) * 26; cv.save(); cv.globalAlpha = ka; icon('chevrons-down', CX, y, 78, MINT, { lw: 2.4, glow: rgba(MINT, 0.7) }); cv.restore(); }
  }
  captions(t);
  cv.restore();
};
/** The cover: the lock card with its three «؟» tiles under the hook. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.globalCompositeOperation = 'source-over';
  background(0); snap();
  cv.save(); cv.translate(CX, 1250); cv.scale(0.8, 0.8); cv.translate(-CX, -1020); lockCard(0, { lit: 1, drums: TILES.map(() => ({})) }); cv.restore();
  glass(60, 250, 960, 500, 64, { dark: 0.4 });
  const g = cv.createLinearGradient(300, 330, 780, 450); g.addColorStop(0, MINT); g.addColorStop(1, CYAN);
  txt('۳ تا عدد', CX, 400, 156, g, { glow: rgba(MINT, 0.5), blur: 40 });
  txt('که قبل از حساب پراپ', CX, 560, 68, INK); txt('باید از حفظ باشی', CX, 655, 68, INK);
};
(async () => {
  buildIcons();
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word)]);
  window.seek(0); window.ready = true;
})();
