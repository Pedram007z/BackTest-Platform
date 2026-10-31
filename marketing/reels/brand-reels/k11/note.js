// k11 · «وین‌ریت استراتژیم ۶۰ درصد بود… پس چرا چالش پراپمو سوزوندم؟», as math worked out by hand in a squared notebook. The
// same voice, math and real screens as the other looks. The camera films one long page (a slight handheld wobble) and
// scrolls down to a fresh part of it on each new idea. The spoken words are written in blue ink as they're said, from
// right to left. Circles, underlines, boxes, arrows, checks and crosses are drawn by hand, the key words get a
// highlighter, and the real screens are printed photos taped onto the page. In order:
//   - «۶۰٪» circled, a 60/40 pie, a challenge card that burns and gets crossed;
//   - ten boxes, four of them crossed; expected vs real, the four losses circled;
//   - 200 tally marks and «۷۰٪» boxed (the exact 71.4% and its assumption in pencil);
//   - five crosses in a row;
//   - «۲٪ × ۵ = ۱۰٪», a hand-drawn drawdown staircase hitting the common prop limit, «حساب بسته شد!»;
//   - strategy ✓, risk ✕;
//   - «۱٪ × ۵ = ۵٪», the green staircase stopping halfway;
//   - «چنده؟» and the blanks;
//   - «حدس» struck out for «بک‌تست»;
//   - f1's real gold replay and the real Analytics, taped in and circled in red;
//   - the checklist and the end.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 700 in ink. Key content inside y 200–1560.
const W = 1080, H = 1920, CX = 540;
const PAPER = '#FBF8EF', GRIDC = 'rgba(70,120,190,0.15)', MARGIN = 'rgba(214,40,57,0.38)';
const INK = '#1E3A8A', RED = '#D62839', GRN = '#15803D', PEN = '#6B7280', VIO = '#6C47FF', WHITE = '#FFFFFF';
const HLY = 'rgba(253,224,71,0.6)', HLL = 'rgba(190,242,100,0.65)', HLP = 'rgba(251,113,133,0.32)';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), io = (x) => { x = cl(x); return x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- drawing ----------
const FONT = (s, w = 700) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 700); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 700) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const pct = (v) => fa(String(v).replace('.', '٫')) + '٪';
function trace(pts, k, col, lw) {
  if (k <= 0) return pts[0];
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L;
  cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(...pts[0]); let end = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; cv.lineTo(...end); left -= seg[i]; }
  cv.stroke(); cv.restore(); return end;
}
// hand-drawn strokes: every shape is a polyline with a little wobble, drawn up to fraction k
function rough(pts, seed, amp = 2.4) { const out = []; pts.forEach((p, i) => { if (i) { const q = pts[i - 1]; for (let j = 1; j <= 3; j++) { const u = j / 4; out.push([lerp(q[0], p[0], u) + (rnd(seed + i * 9 + j) - 0.5) * amp * 2, lerp(q[1], p[1], u) + (rnd(seed + i * 9 + j + 0.5) - 0.5) * amp * 2]); } } out.push([p[0] + (rnd(seed + i) - 0.5) * amp, p[1] + (rnd(seed + i + 0.3) - 0.5) * amp]); }); return out; }
function sLine(x1, y1, x2, y2, k, col, lw = 6, seed = 1) { const bow = (rnd(seed) - 0.5) * 10, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1, pts = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10, b = Math.sin(Math.PI * u) * bow; pts.push([lerp(x1, x2, u) + (nx / L) * b + (rnd(seed + i) - 0.5) * 3, lerp(y1, y2, u) + (ny / L) * b + (rnd(seed + i + 0.5) - 0.5) * 3]); }
  return trace(pts, k, col, lw); }
function sEllipse(cx, cy, rx, ry, k, col, lw = 6, seed = 1) { const pts = [], a0 = -Math.PI * 0.35 + rnd(seed) * 0.4;
  for (let i = 0; i <= 44; i++) { const a = a0 - (i / 40) * Math.PI * 2, r = 1 + (rnd(seed + i * 0.7) - 0.5) * 0.06 + (i / 44) * 0.05; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  trace(pts, k, col, lw); }
function sRect(x, y, w, h, k, col, lw = 6, seed = 1) { const e = [[x + w, y], [x, y], [x, y + h], [x + w, y + h], [x + w + 6, y - 6]]; trace(rough(e, seed, 2.2), k, col, lw); }
function sCheck(x, y, s, k, col, lw) { trace([[x - s * 0.5, y], [x - s * 0.15, y + s * 0.38], [x + s * 0.55, y - s * 0.48]], k, col, lw ?? s * 0.16); }
function sCross(x, y, s, k, col, lw) { sLine(x + s * 0.45, y - s * 0.45, x - s * 0.45, y + s * 0.45, cl(k * 2), col, lw ?? s * 0.15, x + y); sLine(x - s * 0.45, y - s * 0.45, x + s * 0.45, y + s * 0.45, cl(k * 2 - 1), col, lw ?? s * 0.15, x - y); }
function sArrow(pts, k, col, lw = 6) { const e = trace(pts, k, col, lw); if (k > 0.9) { const p = pts[pts.length - 2], q = pts[pts.length - 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]); [2.6, -2.6].forEach((d) => trace([e, [e[0] + Math.cos(a + d) * 30, e[1] + Math.sin(a + d) * 30]], 1, col, lw)); } }
/** A highlighter band behind [x, x + w], laid from right to left. */
function marker(x, y, w, h, k, col, seed = 1) { if (k <= 0) return; const ww = w * k; cv.save(); cv.fillStyle = col; cv.beginPath();
  cv.moveTo(x + w, y - h / 2 + (rnd(seed) - 0.5) * 6); cv.lineTo(x + w - ww, y - h / 2 + (rnd(seed + 1) - 0.5) * 6); cv.lineTo(x + w - ww - 4, y + h / 2 + (rnd(seed + 2) - 0.5) * 6); cv.lineTo(x + w + 3, y + h / 2 + (rnd(seed + 3) - 0.5) * 6); cv.closePath(); cv.fill(); cv.restore(); }
/** Ink text written from right to left (the reveal), with a little tilt. */
function ink(s, cx, y, size, col, k, seed = 1, o = {}) {
  if (k <= 0) return; const w = measure(s, size) + 12;
  cv.save(); cv.beginPath(); cv.rect(cx + w / 2 - w * k - 4, y - size * 1.1, w * k + 8, size * 2.2); cv.clip();
  at(cx, y + (rnd(seed) - 0.5) * 6, 1, 1, () => txt(s, 0, 0, size, col, { dir: o.dir }), (rnd(seed + 0.4) - 0.5) * 0.05); cv.restore();
}
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); return h; }
function tape(x, y, rot) { at(x, y, 1, 1, () => { rrect(-64, -20, 128, 40, 3, 'rgba(236,222,170,0.78)'); rrect(-64, -20, 128, 40, 3, null, 'rgba(180,160,100,0.25)', 2); }, rot); }
/** A printed photo taped onto the page; `over` draws on it in its own coordinates (x, y of its top-left, scale). */
function photo(key, r, cx, cy, w, rot, k, over) {
  if (k <= 0) return; const h = (w * r[3]) / r[2];
  at(cx, cy, lerp(1.1, 1, cub(k)), cl(k * 2), () => {
    cv.save(); cv.shadowColor = 'rgba(40,30,10,0.3)'; cv.shadowBlur = 26; cv.shadowOffsetY = 10; rrect(-w / 2 - 16, -h / 2 - 16, w + 32, h + 32, 4, WHITE); cv.restore();
    crop(key, r, -w / 2, -h / 2, w);
    tape(-w / 2 + 40, -h / 2 - 8, -0.45); tape(w / 2 - 40, -h / 2 - 8, 0.45);
    if (over) over(-w / 2, -h / 2, w / r[2]);
  }, rot + (1 - cub(k)) * 0.05);
}

// ---------- the page: each scene has its own stretch of it (base) and where the camera looks (cam) ----------
// a line: { y, size, toks, align: 'right' (from the margin) | 'center' | 'left' at x }
// a token: [text, word index (or [first, last]), { c, hl, circ, ul, ul2, box, strike, strikeAt }]
const L_ = (y, size, toks, o = {}) => ({ y, size, toks, align: 'right', ...o });
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);
const SC = [
  { k: 'hook', base: 0, lines: [L_(250, 96, [['وین‌ریتِ', 0], ['استراتژیم', 1]], { pre: true }), L_(480, 230, [[pct(60), [2, 3], { circ: RED }]], { align: 'center', pre: true }), L_(530, 96, [['بود…', 4]], { align: 'left', x: 60 }),
    L_(700, 92, [['پس', 5], ['چرا', 6], ['چالش', 7], ['پراپمو', 8]]), L_(840, 136, [['سوزوندم؟', 9, { c: RED, ul2: RED }]])] },
  { k: 'calc', base: 1500, lines: [L_(320, 104, [['بیا', 10], ['یه', 11], ['حساب', 12, { hl: HLL }], ['ساده', 13], ['کنیم.', 14]])] },
  { k: 'four', base: 3000, lines: [L_(230, 92, [['وین‌ریت', 15], [pct(60), [16, 17], { circ: GRN }], ['یعنی', 18]]), L_(355, 92, [['از', 19], ['هر', 20], ['۱۰', 21, { ul: INK }], ['تا', 22], ['معامله،', 23]]),
    L_(500, 124, [['۴', 24, { c: RED, circ: RED }], ['تاش', 25], ['ضرره.', 26, { c: RED }]])] },
  { k: 'spread', base: 4500, lines: [L_(240, 96, [['ولی', 27], ['بازار', 28], ['این', 29], ['۴', 30, { c: RED }], ['تا', 31], ['رو', 32]]), L_(375, 112, [['مرتب', 33], ['پخش', 34, { ul: RED }], ['نمی‌کنه.', [35, 36]]])] },
  { k: 'odds', base: 6000, lines: [L_(230, 100, [['توی', 37], ['۲۰۰', 38, { hl: HLY }], ['تا', 39], ['معامله،', 40]]), L_(360, 92, [['به', 41], ['احتمال', 42], ['بیشتر', 43], ['از', 44]]),
    L_(560, 220, [[pct(70), [45, 46], { box: RED }]], { align: 'center' })] },
  { k: 'run', base: 7500, lines: [L_(240, 96, [['حداقل', [47, 48]], ['یه', 49], ['بار', 50]]), L_(385, 124, [['۵', 51, { c: RED, circ: RED }], ['تا', 52, { c: RED }], ['ضرر', 53, { c: RED }]]), L_(520, 96, [['پشت‌سرهم', [54, 56], { ul: RED }], ['می‌خوری.', [57, 58]]])] },
  { k: 'risk2', base: 9000, lines: [L_(230, 100, [['با', 59], ['ریسک', 60], [pct(2), [61, 62], { circ: INK }]]), L_(360, 96, [['۵', 63], ['تا', 64], ['ضرر', 65, { c: RED }], ['یعنی', 66]]), L_(490, 112, [['حدود', 67], [pct(10), [68, 69], { c: RED, hl: HLP }], ['افت.', 70]])] },
  { k: 'prop', base: 9000, cam: 9700, lines: [L_(1460, 90, [['همون', 71], ['حدی', 72], ['که', 73], ['توی', 74], ['خیلی', 75], ['از', 76], ['پراپ‌ها', [77, 78], { hl: HLY }]]), L_(1595, 124, [['حسابتو', 79], ['می‌بنده.', [80, 81], { c: RED, ul2: RED }]])] },
  { k: 'twist', base: 11500, lines: [L_(250, 100, [['یعنی', 82], ['استراتژیت', 83]]), L_(390, 112, [['خراب', 84], ['نبود؛', 85, { c: GRN, ul: GRN }]]), L_(570, 150, [['ریسکت', 86, { c: RED, circ: RED }]]), L_(735, 112, [['خراب', 87], ['بود.', 88]])] },
  { k: 'risk1', base: 13000, lines: [L_(230, 100, [['با', 89], ['ریسک', 90], [pct(1), [91, 92], { c: GRN, circ: GRN }]]), L_(355, 96, [['همون', 93], ['۵', 94], ['تا', 95], ['ضرر', 96]]), L_(480, 104, [['می‌شه', [97, 98]], [pct(5), [99, 100], { c: GRN, hl: HLL }]]),
    L_(615, 104, [['و', 101], ['هنوز', 102], ['توی', 103], ['بازی‌ای.', 104, { ul2: GRN }]])] },
  { k: 'real', base: 14500, lines: [L_(250, 100, [['ولی', 105], ['عدد', 106], ['واقعیِ', 107, { hl: HLY }]]), L_(380, 100, [['استراتژی', 108], ['خودت', 109]]), L_(600, 230, [['چنده؟', 110, { c: RED }]], { align: 'center' })] },
  { k: 'guess', base: 16000, lines: [L_(290, 110, [['با', 111], ['حدس', 112, { strike: RED, strikeAt: 114 }], ['پیدا', 113], ['نمی‌شه؛', [114, 115]]]), L_(455, 120, [['با', 116], ['بک‌تست', [117, 118], { hl: HLL, ul2: GRN }], ['پیدا', 119], ['می‌شه.', [120, 121]]])] },
  { k: 'lab', base: 17500, lines: [L_(230, 96, [['توی', 122], ['بک‌تست‌لب', [123, 125], { c: VIO }]]), L_(350, 92, [['استراتژیتو', 126], ['روی', 127], ['بازار', 128]]), L_(470, 96, [['واقعیِ', 129], ['گذشته', 130, { hl: HLY }], ['تست', 131], ['می‌کنی،', [132, 133]]])] },
  { k: 'analytics', base: 19000, lines: [L_(230, 90, [['و', 134], ['آنالیزش', 135, { c: VIO }], ['بهت', 136], ['می‌گه', [137, 138]]]), L_(345, 88, [['بیشترین', 139], ['ضررهای', 140, { c: RED }], ['پشت‌سرهمت', [141, 142]], ['چندتاست', [143, 144]]]),
    L_(465, 96, [['و', 145], ['بدترین', 146], ['افتت', 147, { c: RED, ul: RED }], ['چقدره.', 148]])] },
  { k: 'first', base: 20500, lines: [L_(250, 108, [['اول', 149, { ul: INK }], ['ریسکتو', 150], ['اینجا', 151], ['تنظیم', 152], ['کن،', 153]]), L_(390, 108, [['بعد', 154, { ul: INK }], ['پول', 155], ['چالش', 156], ['رو', 157], ['بده.', 158]])] },
  { k: 'cta', base: 22000, lines: [L_(1080, 116, [['شروعش', 159], ['رایگانه', 160, { hl: HLL }]], { align: 'center' }), L_(1240, 104, [['لینک', 161], ['توی', 162], ['بیو', 163, { ul2: VIO }]], { align: 'center' })] },
];
SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; s.cam = (s.cam ?? s.base) - 110; });   // a little above each stretch, so it sits mid-frame
// lay out each line once the font is in: token centres, widths and seeds
const layout = () => SC.forEach((s, si) => s.lines.forEach((ln, li) => {
  const gap = measure(' ', ln.size) * 1.3, wds = ln.toks.map(([x]) => measure(x, ln.size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.toks.length - 1), sc = Math.min(1, 880 / total);
  ln.sc = sc; let right = ln.align === 'center' ? CX + (total * sc) / 2 : ln.align === 'left' ? ln.x + total * sc : 950;
  ln.pos = wds.map((w, j) => { const c = right - (w * sc) / 2; right -= (w + gap) * sc; return { cx: c, w: w * sc, seed: si * 100 + li * 10 + j }; });
}));
function lines(s, t) {
  s.lines.forEach((ln) => ln.toks.forEach(([x, wi, o = {}], j) => {
    const p = ln.pos[j], st = ln.pre ? -1 : ws(wIdx(wi)) - 0.05, size = ln.size * ln.sc, y = s.base + ln.y; if (t < st) return;
    const kw = ln.pre ? 1 : cub(k01(t, st, 0.18 + 0.02 * x.length)), t2 = ln.pre ? -0.4 : st;
    if (o.hl) marker(p.cx - p.w / 2 - 12, y + size * 0.08, p.w + 24, size * 0.78, cub(k01(t, t2 + 0.15, 0.3)), o.hl, p.seed);
    ink(x, p.cx, y, size, o.c ?? INK, kw, p.seed);
    if (o.circ) sEllipse(p.cx, y + size * 0.05, p.w / 2 + size * 0.28, size * 0.66, cub(k01(t, t2 + 0.2, 0.45)), o.circ, Math.max(5, size * 0.05), p.seed);
    if (o.box) sRect(p.cx - p.w / 2 - 30, y - size * 0.62, p.w + 60, size * 1.24, cub(k01(t, t2 + 0.2, 0.5)), o.box, 7, p.seed);
    if (o.ul) sLine(p.cx + p.w / 2, y + size * 0.62, p.cx - p.w / 2, y + size * 0.62, cub(k01(t, t2 + 0.2, 0.25)), o.ul, 6, p.seed);
    if (o.ul2) { sLine(p.cx + p.w / 2, y + size * 0.6, p.cx - p.w / 2, y + size * 0.6, cub(k01(t, t2 + 0.2, 0.22)), o.ul2, 6, p.seed); sLine(p.cx + p.w / 2 - 10, y + size * 0.6 + 14, p.cx - p.w / 2 + 8, y + size * 0.6 + 14, cub(k01(t, t2 + 0.38, 0.22)), o.ul2, 6, p.seed + 3); }
    if (o.strike) sLine(p.cx + p.w / 2 + 14, y + 4, p.cx - p.w / 2 - 14, y - 2, cub(k01(t, ws(o.strikeAt), 0.3)), o.strike, 9, p.seed);
  }));
}

// ---------- the drawings, scene by scene (absolute page coordinates; Y is the scene's base) ----------
const EVEN = [1, 1, -1, 1, -1, 1, 1, -1, 1, -1], REAL = [1, 1, 1, -1, -1, -1, -1, 1, 1, 1];
function mark(v, x, y, s, k) { if (v > 0) sCheck(x, y, s, k, GRN); else sCross(x, y, s, k, RED); }
function hookArt(t, Y) {
  // a 60/40 pie, its outline and hatching
  const kp = cub(k01(t, 0.05, 0.8)), cx = 300, cy = Y + 1190, r = 150;
  sEllipse(cx, cy, r, r, kp, INK, 6, 3);
  if (kp > 0.6) { const a = cub((kp - 0.6) / 0.4); cv.save(); cv.globalAlpha *= a; cv.beginPath(); cv.moveTo(cx, cy); cv.arc(cx, cy, r - 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.2); cv.closePath(); cv.clip();
    for (let i = -10; i < 12; i++) sLine(cx - 200 + i * 24, cy + 200, cx + i * 24 + 40, cy - 200, 1, GRN, 4, i); cv.restore();
    sLine(cx, cy, cx, cy - r, a, INK, 5, 5); sLine(cx, cy, cx + Math.cos(-Math.PI / 2 + Math.PI * 1.2) * r, cy + Math.sin(-Math.PI / 2 + Math.PI * 1.2) * r, a, INK, 5, 6);
    txt('سود', cx + 60, cy + 30, 42, GRN, { alpha: a, w: 900 }); txt('ضرر', cx - 70, cy - 50, 38, RED, { alpha: a, w: 900 }); }
  // the challenge card: drawn on «چالش پراپمو», burnt and crossed on «سوزوندم»
  const kc = cub(k01(t, ws(7) - 0.05, 0.45)), x = 610, y = Y + 1080;
  sRect(x, y, 330, 210, kc, INK, 6, 9); ink('چالش پراپ', x + 165, y + 70, 54, INK, cub(k01(t, ws(8) - 0.1, 0.3)), 77); ink('$', x + 165, y + 150, 64, INK, cub(k01(t, ws(8), 0.2)), 78, { dir: 'ltr' });
  const kb = k01(t, ws(9) - 0.05, 0.5);
  if (kb > 0) { for (let i = 0; i < 9; i++) { const fx = x + 20 + i * 37, h = (50 + 40 * Math.sin(t * 11 + i * 1.9)) * cub(kb); trace(rough([[fx - 14, y + 210], [fx - 4, y + 210 - h * 0.6], [fx, y + 210 - h], [fx + 10, y + 210 - h * 0.5], [fx + 16, y + 210]], i * 7, 1.5), 1, i % 2 ? '#F59E0B' : RED, 5); }
    sCross(x + 165, y + 105, 230, cub(k01(t, ws(9) + 0.05, 0.4)), RED, 12); }
}
function calcArt(t, Y) {
  const k = cub(k01(t, T.calc + 0.3, 0.3)); ink('حساب:', 950 - measure('حساب:', 84) / 2, Y + 560, 84, INK, k, 41);
  sLine(950, Y + 615, 950 - measure('حساب:', 84) - 10, Y + 615, cub(k01(t, T.calc + 0.55, 0.2)), INK, 6, 42); sLine(944, Y + 630, 950 - measure('حساب:', 84) + 6, Y + 630, cub(k01(t, T.calc + 0.7, 0.2)), INK, 6, 43);
  sArrow([[540, Y + 740], [560, Y + 900], [540, Y + 1060]], cub(k01(t, T.calc + 0.6, 0.45)), PEN, 6);
}
function fourArt(t, Y) {
  EVEN.forEach((v, i) => { const x = 860 - (i % 5) * 180, y = Y + 790 + Math.floor(i / 5) * 175, ts = ws(24) - 0.05 + (v < 0 ? 0 : 0.25);
    sRect(x - 65, y - 65, 130, 130, cub(k01(t, ws(21) + i * 0.05, 0.25)), INK, 5, 50 + i); mark(v, x, y, 80, cub(k01(t, ts, 0.25))); });
  ink('۶ سود', 760, Y + 1160, 64, GRN, cub(k01(t, ws(25), 0.25)), 61); ink('۴ ضرر', 380, Y + 1160, 64, RED, cub(k01(t, ws(26), 0.25)), 62);
}
function spreadArt(t, Y) {
  const X = (i) => 860 - i * 78;
  ink('انتظار:', 950 - measure('انتظار:', 60) / 2, Y + 660, 60, PEN, cub(k01(t, T.spread + 0.1, 0.25)), 71);
  EVEN.forEach((v, i) => { sRect(X(i) - 30, Y + 740, 60, 60, cub(k01(t, T.spread + 0.2 + i * 0.03, 0.2)), INK, 4, 80 + i); mark(v, X(i), Y + 770, 40, cub(k01(t, T.spread + 0.3 + i * 0.04, 0.2))); });
  ink('واقعیت:', 950 - measure('واقعیت:', 60) / 2, Y + 920, 60, RED, cub(k01(t, ws(34) - 0.05, 0.25)), 72);
  REAL.forEach((v, i) => { sRect(X(i) - 30, Y + 1000, 60, 60, cub(k01(t, ws(34) + i * 0.04, 0.2)), INK, 4, 90 + i); mark(v, X(i), Y + 1030, 40, cub(k01(t, ws(34) + 0.1 + i * 0.05, 0.2))); });
  sEllipse((X(3) + X(6)) / 2, Y + 1030, (X(3) - X(6)) / 2 + 70, 72, cub(k01(t, ws(35) + 0.3, 0.45)), RED, 6, 99);
  ink('۴ تا پشت‌سرهم!', (X(3) + X(6)) / 2, Y + 1185, 54, RED, cub(k01(t, ws(36) + 0.2, 0.3)), 98);
}
const SEQ = (() => { const s = Array.from({ length: 200 }, (_, i) => (rnd(i * 7.13 + 3) < 0.4 ? -1 : 1)); s[125] = 1; for (let i = 126; i <= 130; i++) s[i] = -1; s[131] = 1; return s; })();
function oddsArt(t, Y) {
  const f = io(k01(t, ws(38) - 0.05, ws(40) + 0.65 - ws(38))), n = Math.floor(f * 200 + 0.0001);
  for (let i = 0; i < n; i++) { const c = i % 20, r = Math.floor(i / 20), x = 940 - c * 42, y = Y + 790 + r * 40, kk = cl((f * 200 - i) * 0.5);
    if (SEQ[i] > 0) sCheck(x, y, 22, kk, GRN, 4); else sCross(x, y, 20, kk, RED, 4); }
  ink('فرض: وین‌ریت ' + pct(60) + ' و معامله‌های مستقل؛ دقیقش ' + pct(71.4), CX, Y + 1250, 34, PEN, cub(k01(t, ws(46), 0.5)), 111);
}
function runArt(t, Y) {
  const lit = (j) => lerp(ws(51) - 0.05, ws(57), j / 4);
  for (let j = 0; j < 5; j++) sCross(860 - j * 170, Y + 820, 120, cub(k01(t, lit(j), 0.25)), RED, 14);
  const kb = cub(k01(t, ws(57) + 0.1, 0.4)); trace(rough([[930, Y + 920], [915, Y + 960], [540, Y + 960], [520, Y + 1000], [500, Y + 960], [165, Y + 960], [150, Y + 920]], 120, 2), kb, RED, 6);
  ink('۵ تا پشت‌سرهم!', 520, Y + 1080, 64, RED, cub(k01(t, ws(57) + 0.35, 0.3)), 121);
}
// the hand-drawn drawdown chart (fixed risk on the start balance); gy(p) maps a drawdown of p% to the page
function chart(Y, top, k, gy) { sLine(150, Y + top - 40, 150, Y + top + 520, k, INK, 5, 201); sLine(140, Y + top + 510, 960, Y + top + 510, k, INK, 5, 202);
  txt(pct(0), 120, gy(0), 30, PEN, { alpha: k, dir: 'ltr', align: 'right' }); txt('−' + pct(5), 120, gy(5), 30, PEN, { alpha: k, dir: 'ltr', align: 'right' }); txt('−' + pct(10), 120, gy(10), 30, PEN, { alpha: k, dir: 'ltr', align: 'right' }); }
function stairs(risk, n, gy, col, lw = 8, seed = 300, labels = 0) {
  const x0 = 260, step = 140, pts = [[170, gy(0)], [x0, gy(0)]];
  for (let i = 0; i < 5; i++) { const f = cl(n - i); if (f <= 0) break; const x = x0 + i * step; pts.push([x, gy(risk * (i + f))]); if (f >= 1) pts.push([x + step, gy(risk * (i + 1))]);
    if (labels && f >= 1) txt('−' + pct(risk), x + step / 2 + 8, gy(risk * (i + 0.5)) + 6, 30, col, { dir: 'ltr', alpha: labels }); }
  const e = trace(rough(pts, seed, 1.6), 1, col, lw); return e;
}
const nLoss = (times, t) => times.reduce((n, a) => n + cub(k01(t, a, 0.22)), 0);
const L2 = [0, 1, 2, 3, 4].map((i) => lerp(ws(63) - 0.05, ws(66) + 0.2, i / 4)), L1 = [0, 1, 2, 3, 4].map((i) => lerp(ws(93), ws(98), i / 4));
function eq(parts, y, size, t) { // a left-to-right equation, each part written at its own time
  const wds = parts.map(([s]) => measure(s, size) + 28), total = wds.reduce((a, b) => a + b, 0); let x = CX - total / 2;
  parts.forEach(([s, at0, col], i) => { const c = x + wds[i] / 2; ink(s, c, y, size, col ?? INK, cub(k01(t, at0, 0.22)), 400 + i, { dir: 'ltr' }); x += wds[i]; });
}
const GY2 = (Y) => (p) => Y + 870 + p * 46;
function risk2Art(t, Y) {
  eq([[pct(2), ws(61)], ['×', ws(63)], ['۵', ws(63) + 0.1], ['=', ws(68) - 0.1], [pct(10), ws(68), RED]], Y + 690, 104, t);
  const gy = GY2(Y); chart(Y, 860, cub(k01(t, T.risk2 + 0.2, 0.4)), gy); stairs(2, nLoss(L2, t), gy, RED, 8, 300, 1);
}
function propArt(t, Y) {
  const gy = GY2(Y), kl = cub(k01(t, ws(72), 0.5));
  if (kl > 0) { cv.save(); cv.setLineDash([20, 14]); sLine(160, gy(10), 960, gy(10), kl, RED, 5, 501); cv.restore(); ink('حد افت رایج پراپ‌ها: ' + pct(10), 700, gy(10) + 52, 38, RED, cub(k01(t, ws(77), 0.35)), 502); }
  const ks = pop(t - ws(80) + 0.02, 14, 0.5);
  if (ks > 0) at(560, Y + 1120, lerp(1.5, 1, cl(ks)), cl(ks * 3), () => { const w = measure('حساب بسته شد!', 92) + 80; sRect(-w / 2, -80, w, 160, 1, RED, 9, 503); sRect(-w / 2 + 12, -68, w - 24, 136, 1, RED, 4, 504); txt('حساب بسته شد!', 0, 6, 92, RED, { w: 900 }); }, -0.08);
}
function twistArt(t, Y) {
  ink('استراتژی', 780, Y + 950, 72, INK, cub(k01(t, ws(84), 0.3)), 601); sCheck(780, Y + 1120, 150, cub(k01(t, ws(85), 0.35)), GRN, 20);
  ink('ریسک', 300, Y + 950, 72, INK, cub(k01(t, ws(86), 0.3)), 602); sCross(300, Y + 1120, 150, cub(k01(t, ws(87), 0.4)), RED, 20);
  sEllipse(300, Y + 1040, 190, 200, cub(k01(t, ws(88), 0.5)), RED, 6, 603);
}
const GY1 = (Y) => (p) => Y + 900 + p * 46;
function risk1Art(t, Y) {
  eq([[pct(1), ws(91), GRN], ['×', ws(94)], ['۵', ws(94) + 0.1], ['=', ws(99) - 0.1], [pct(5), ws(99), GRN]], Y + 780, 96, t);
  const gy = GY1(Y); chart(Y, 890, cub(k01(t, T.risk1 + 0.2, 0.4)), gy);
  cv.save(); cv.setLineDash([20, 14]); sLine(160, gy(10), 960, gy(10), cub(k01(t, T.risk1 + 0.4, 0.4)), RED, 4, 701); cv.restore();
  cv.save(); cv.globalAlpha *= 0.35 * cub(k01(t, T.risk1 + 0.3, 0.4)); stairs(2, 5, gy, PEN, 6, 702); cv.restore();
  const e = stairs(1, nLoss(L1, t), gy, GRN, 9, 703, 1);
  const kp = cub(k01(t, ws(102), 0.35)); if (kp > 0) { ink('هنوز توی بازی!', 450, gy(8), 58, GRN, kp, 704); sArrow([[620, gy(8) - 20], [800, gy(7)], [e[0] - 20, e[1] + 26]], cub(k01(t, ws(103), 0.4)), GRN, 5); }
}
function realArt(t, Y) {
  const kb = cub(k01(t, ws(108), 0.4)); sRect(140, Y + 830, 800, 380, kb, INK, 6, 801);
  ink('بدترین افت = ؟', 540, Y + 940, 72, INK, cub(k01(t, ws(109), 0.35)), 802); ink('ضررهای پشت‌سرهم = ؟', 540, Y + 1100, 72, INK, cub(k01(t, ws(110), 0.35)), 803);
}
function guessArt(t, Y) {
  const kd = cub(k01(t, ws(112), 0.4)); sRect(180, Y + 690, 240, 240, kd, INK, 6, 901);
  [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]].forEach(([px, py], i) => { if (kd > 0.5 + i * 0.08) circle(300 + px * 62, Y + 810 + py * 62, 18, INK); });
  sCross(300, Y + 810, 300, cub(k01(t, ws(114), 0.4)), RED, 14);
  const kc = cub(k01(t, ws(117), 0.45)); sLine(640, Y + 680, 640, Y + 930, kc, INK, 5, 902); sLine(630, Y + 930, 920, Y + 930, kc, INK, 5, 903);
  trace(rough([[660, Y + 880], [720, Y + 840], [770, Y + 860], [830, Y + 780], [880, Y + 800], [910, Y + 720]], 904, 2), cub(k01(t, ws(118), 0.45)), GRN, 7);
  sCheck(780, Y + 1060, 110, cub(k01(t, ws(119), 0.35)), GRN, 16); ink('حدس', 300, Y + 1010, 54, PEN, kd, 905);
}
const RR = [520, 200, 560, 620], DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function labArt(t, Y) {
  photo(FLIP(t, T.lab, T.analytics + 0.3, DK), RR, CX, Y + 920, 540, -0.03, cub(k01(t, T.lab + 0.05, 0.35)), (x, y, s) => {
    if (IMG.icon) { const k = pop(t - ws(123) + 0.05, 13, 0.5); if (k > 0) at(x + 560 * s * 0.98, y + 10, cl(k, 0, 1.2), cl(k), () => { rrect(-66, -66, 132, 132, 30, WHITE); cv.drawImage(IMG.icon, -56, -56, 112, 112); }, 0.12); } });
  ink('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', CX, Y + 1290, 34, PEN, cub(k01(t, T.lab + 0.6, 0.6)), 1001);
}
const RWL = [36, 196, 556, 266], QWL = [50, 378, 530, 30], RMC = [325, 605, 545, 92], QMC = [331, 619, 260, 68];
function ringOn(r, q, x, y, s, k, seed) { sEllipse(x + (q[0] - r[0] + q[2] / 2) * s, y + (q[1] - r[1] + q[3] / 2) * s, (q[2] * s) / 2 + 30, (q[3] * s) / 2 + 22, k, RED, 6, seed); }
function analyticsArt(t, Y) {
  photo('wl', RWL, CX, Y + 790, 800, 0.015, cub(k01(t, T.analytics + 0.05, 0.35)), (x, y, s) => ringOn(RWL, QWL, x, y, s, cub(k01(t, ws(139), 0.5)), 1101));
  photo('mc', RMC, CX + 30, Y + 1110, 780, -0.02, cub(k01(t, ws(145) - 0.1, 0.35)), (x, y, s) => ringOn(RMC, QMC, x, y, s, cub(k01(t, ws(146), 0.5)), 1102));
  ink('صفحه‌ی واقعی بک‌تست‌لب · آنالیز', CX, Y + 1250, 34, PEN, cub(k01(t, ws(146) + 0.3, 0.5)), 1103);
}
function firstArt(t, Y) {
  [[650, 151, 153], [830, 155, 158]].forEach(([y, a, c], i) => {
    sRect(840, Y + y - 45, 90, 90, cub(k01(t, ws(a) - 0.2, 0.3)), INK, 6, 1200 + i); sCheck(885, Y + y, 80, cub(k01(t, ws(c), 0.3)), GRN, 13);
    if (!i) { ink('ریسک:', 790 - measure('ریسک:', 70) / 2, Y + y, 70, INK, cub(k01(t, ws(a), 0.3)), 1210); ink(pct(2), 470, Y + y, 74, INK, cub(k01(t, ws(a) + 0.1, 0.2)), 1211, { dir: 'ltr' });
      sLine(520, Y + y - 4, 420, Y + y + 4, cub(k01(t, ws(152), 0.25)), RED, 8, 1212); ink(pct(1), 300, Y + y, 74, GRN, cub(k01(t, ws(152) + 0.2, 0.2)), 1213, { dir: 'ltr' }); }
    else ink('خرید چالش', 790 - measure('خرید چالش', 70) / 2, Y + y, 70, INK, cub(k01(t, ws(a), 0.3)), 1214);
  });
}
function ctaArt(t, Y) {
  const k = pop(t - T.cta - 0.02, 12, 0.6);
  if (k > 0 && IMG.icon) at(CX, Y + 620, cl(k, 0, 1.2), cl(k), () => { cv.save(); cv.shadowColor = 'rgba(40,30,10,0.3)'; cv.shadowBlur = 24; cv.shadowOffsetY = 8; rrect(-170, -170, 340, 340, 70, WHITE); cv.restore(); cv.drawImage(IMG.icon, -150, -150, 300, 300); tape(0, -170, 0.06); }, -0.05);
  const kw = cub(k01(t, T.cta + 0.25, 0.4)); if (kw > 0 && IMG.wordL) { const w = 520, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.wordL, CX - w / 2, Y + 850, w, h); cv.restore(); }
  sArrow([[540, Y + 1320], [560, Y + 1400], [540, Y + 1480]], cub(k01(t, ws(163) + 0.2, 0.4)), VIO, 7);
}
const ART = { hook: hookArt, calc: calcArt, four: fourArt, spread: spreadArt, odds: oddsArt, run: runArt, risk2: risk2Art, prop: propArt, twist: twistArt, risk1: risk1Art, real: realArt, guess: guessArt, lab: labArt, analytics: analyticsArt, first: firstArt, cta: ctaArt };

// ---------- the camera over the page ----------
const cur = (t) => { let i = 0; SC.forEach((s, j) => { if (t >= s.t0 - 0.15) i = j; }); return i; };
function camY(t) { const i = cur(t); if (!i) return SC[0].cam; const s = SC[i]; return lerp(SC[i - 1].cam, s.cam, io(k01(t, s.t0 - 0.15, 0.5))); }
function paper(cy) {
  cv.fillStyle = PAPER; cv.fillRect(-60, cy - 60, W + 120, H + 120);
  cv.strokeStyle = GRIDC; cv.lineWidth = 2; const g = 54, y0 = Math.floor((cy - 60) / g) * g;
  for (let y = y0; y < cy + H + 60; y += g) { cv.beginPath(); cv.moveTo(-60, y); cv.lineTo(W + 60, y); cv.stroke(); }
  for (let x = 0; x <= W + 60; x += g) { cv.beginPath(); cv.moveTo(x, cy - 60); cv.lineTo(x, cy + H + 60); cv.stroke(); }
  cv.strokeStyle = MARGIN; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(1000, cy - 60); cv.lineTo(1000, cy + H + 60); cv.stroke();
}
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const cy = o.cam ?? camY(t), punch = [ws(9), ws(80), ws(87)].reduce((z, a) => z + (t >= a ? 0.035 * Math.exp(-(t - a) * 7) : 0), 0);
  cv.save();
  cv.translate(CX, H / 2); cv.rotate(Math.sin(t * 0.55) * 0.006); cv.scale(1 + punch, 1 + punch); cv.translate(-CX + Math.sin(t * 0.37) * 4, -H / 2 + Math.cos(t * 0.29) * 4);
  cv.translate(0, -cy);
  paper(cy);
  SC.forEach((s) => { if (t < s.t0 - 0.3 && !(s === SC[0])) return; if (Math.abs(s.cam - cy) > 2600) return; if (ART[s.k]) ART[s.k](t, s.base); if (!o.noWords) lines(s, t); });
  cv.restore();
  const v = cv.createRadialGradient(CX, 960, 600, CX, 960, 1350); v.addColorStop(0, 'rgba(60,40,10,0)'); v.addColorStop(1, 'rgba(60,40,10,0.22)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
/** The cover: the hook page, written out, with its own title. */
window.cover = () => {
  frame(ws(9) + 0.9, { noWords: true, cam: -110 });
  const y = 300; txt('وین‌ریتم', 950, y, 110, INK, { align: 'right' });
  txt(pct(60), CX, y + 230, 250, INK); sEllipse(CX, y + 240, 240, 150, 1, RED, 9, 7);
  marker(140, y + 470, 800, 100, 1, HLY, 3); txt('پس چرا چالشم سوخت؟', CX, y + 470, 92, RED);
  sLine(880, y + 545, 200, y + 545, 1, RED, 7, 4);
};
(async () => {
  await Promise.all(['700', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('wordL', window.LOGO.wordL), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  layout(); window.seek(0); window.ready = true;
})();
