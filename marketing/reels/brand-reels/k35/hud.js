// k35: «هواپیماهایی که برنگشتن», survivorship bias for traders, on the user's take at its normal speed, in the dark HUD look
// (k33's, in the logo's violet). The script is BacktestLab's own: only the creative mechanism of a reference reel was
// studied (the trap everyone falls into, the hidden reason, a reframe, a one-line rule); its topic and look aren't
// used. The story is the well-known one of Abraham Wald and the returning bombers of World War II, told as an
// illustration (a blueprint plane, no real aircraft's drawing):
//   a plane full of bullet holes → armor where the holes are, rejected → the untouched engines and cockpit lit → «چرا؟»
//   → a radar where some planes never come back («LOST») → «سوگیری بقا» → a sample Explore grid (profit screenshots,
//   targets hit, «همیشه جواب می‌ده»), each a returned plane → the grid opens up the gaps nobody posts → the wrong
//   question struck out, the right one ticked → the missing planes found on the radar, one of them «حساب تو؟» → a flash
//   into the icon → the real gold replay, every case counted, each answer «؟» → the close.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], END = D.end, DUR = D.dur;
const BG = '#0C0720', CYAN = '#A58BFF', VIO = '#7B5BFF', FUT = '#D8CCFF', ACC_RGB = '165,139,255', BG_RGB = '12,7,32', TILE = '#1B1338',
  LIME = '#C6F24E', GREEN = '#2FD67B', RED = '#FF5A6A', WHITE = '#FFFFFF', DIMW = 'rgba(255,255,255,0.45)';
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - cl(k)) ** 3, io = (k) => { k = cl(k); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; }, oBack = (k) => { const c = 1.6; k = cl(k); return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fa = (n, pad = 0) => Math.round(n).toLocaleString('fa-IR', { minimumIntegerDigits: pad || 1, useGrouping: false });
const T = (i) => ws(i) - 0.07, IMG = {};
const font = (s, w = 800) => `${w} ${s}px Vazirmatn`, MONO = (s) => `500 ${s}px "DejaVu Sans Mono", monospace`;
function txt(s, x, y, size, col, o = {}) { cv.save(); cv.font = o.mono ? MONO(size) : font(size, o.w ?? 800); cv.direction = o.dir ?? (o.mono ? 'ltr' : 'rtl'); cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.globalAlpha *= o.alpha ?? 1; if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = 24; } cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 800) { cv.font = font(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 2) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2)); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, Math.max(0, r), 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function line(x1, y1, x2, y2, col, lw, dash) { cv.save(); cv.beginPath(); if (dash) cv.setLineDash(dash); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn) { if (a <= 0 || s <= 0) return; cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function brackets(x, y, w, h, len, col, lw = 3) { [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => { line(px, py, px + len * sx, py, col, lw); line(px, py, px, py + len * sy, col, lw); }); }
function check(x, y, s, col, lw = 6) { cv.save(); cv.beginPath(); cv.moveTo(x - s, y); cv.lineTo(x - s * 0.3, y + s * 0.7); cv.lineTo(x + s, y - s * 0.7); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.stroke(); cv.restore(); }
function cross(x, y, s, col, lw = 6) { line(x - s, y - s, x + s, y + s, col, lw); line(x - s, y + s, x + s, y - s, col, lw); }

const seqT = (a, b, n) => Array.from({ length: n }, (_, i) => (n < 2 ? a : a + ((b - a) * i) / (n - 1)));
function hudTag(t, t0, s, mono, x, y, col, mark, size = 30) { const k = oBack(k01(t, t0, 0.35)); if (k <= 0) return; at(x, y, k, cl(k * 2), () => { const w = measure(s, size, 800) + 44 + (mark ? 40 : 0), h = size * 1.9;
  cv.save(); cv.shadowColor = col; cv.shadowBlur = 16; rr(-w / 2, -h / 2, w, h, 10, `rgba(${BG_RGB},0.9)`, col, 2.5); cv.restore(); txt(s, mark ? -18 : 0, 2, size, col, { w: 800 });
  if (mark === 'ok') check(w / 2 - 30, 0, 9, col, 4); if (mark === 'no') cross(w / 2 - 30, 0, 8, col, 4); if (mono) txt(mono, -w / 2 + 4, -h / 2 - 16, 17, col, { mono: true, align: 'left', alpha: 0.85 }); }); }
function alertBox(t, t0, s, mono, x, y, col) { const k = k01(t, t0, 0.4); if (k <= 0) return; const jit = k < 0.5 ? (rnd(Math.floor(t * 60)) - 0.5) * 10 * (1 - k * 2) : 0; at(x + jit, y, lerp(1.4, 1, oCub(k)), cl(k * 3), () => { const w = measure(s, 70, 900) + 80;
  cv.save(); cv.shadowColor = col; cv.shadowBlur = 30; rr(-w / 2, -62, w, 124, 14, `rgba(${BG_RGB},0.88)`, col, 4); cv.restore(); txt(s, 0, 6, 70, col, { w: 900, glow: col }); txt(mono, -w / 2 + 6, -84, 20, col, { mono: true, align: 'left' }); }); }
// the status strip: the rule's three steps, each pending, passed or failed
// ---------- the words: centred, blurring in word by word, an accent and an underline on key words ----------
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
function wordsLine(ln, t, fade = 1) { let size = ln.size; const gapF = 0.28; let items = ln.toks.map(([s, wi, st = {}]) => ({ s, st, w: measure(s, size, 800), t0: ln.now ? -1 : ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, t1: ws(Array.isArray(wi) ? wi[0] : wi) - 0.07 }));
  let total = items.reduce((a, k) => a + k.w, 0) + size * gapF * (items.length - 1); if (total > 960) { const f = 960 / total; size *= f; items.forEach((k) => (k.w *= f)); total = 960; }
  const gap = size * gapF; let xr = CX + total / 2;
  items.forEach((k) => { const x = xr - k.w / 2; xr -= k.w + gap; const e = t - (ln.ghost ? k.t1 : k.t0); if (e < 0 && !ln.ghost) return; const q = oCub(k01(e, 0, 0.35)), a = ln.ghost && e < 0 ? 0.22 : ln.ghost ? lerp(0.22, 1, q) : q;
    cv.save(); cv.globalAlpha *= a * fade; if (!ln.ghost && q < 1 && e >= 0) cv.filter = `blur(${((1 - q) * 10).toFixed(1)}px)`; txt(k.s, x, ln.y + (ln.ghost ? 0 : (1 - q) * 18), size, k.st.c ?? WHITE, { glow: k.st.c ? k.st.c + '88' : null }); cv.restore();
    if (k.st.bar && e > 0.1) { const g = oCub(k01(e, 0.15, 0.4)); line(x + k.w / 2, ln.y + size * 0.62, x + k.w / 2 - k.w * g, ln.y + size * 0.62, k.st.c ?? CYAN, 6); } }); }

function reveal(t) { const t0 = T(169) - 0.05, fl = k01(t, t0, 0.12) * (1 - k01(t, t0 + 0.15, 0.35)), k = oBack(k01(t, t0 + 0.1, 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 80 * k; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 1080 - s / 2, s, s); cv.restore(); } if (fl > 0) { cv.fillStyle = `rgba(242,236,255,${fl})`; cv.fillRect(0, 0, W, H); } }
// the flap board flips whole words, so the Persian joins and the digits' order stay right
const FLAP = [['۲۵', ['۰۷', '۱۳', '۰۲', '۳۰', '۱۸', '۰۹', '۲۲']], ['فروردین', ['مهر', 'آبان', 'دی', 'اسفند', 'تیر', 'بهمن', 'آذر']], ['۱۴۰۴', ['۱۴۰۱', '۱۳۹۹', '۱۴۰۲', '۱۴۰۰', '۱۴۰۳']]];
// ---------- the plane: a top-view blueprint (an illustration, no real aircraft's drawing) ----------
const PC = { x: CX, y: 1090 }, PS = 1.0;
const P_ = (pts) => pts.map(([x, y]) => [PC.x + x * PS, PC.y + y * PS]), MIRX = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
const BODY = P_([[0, -315], [22, -300], [36, -260], [38, -120], [38, 200], [24, 280], [0, 300], [-24, 280], [-38, 200], [-38, -120], [-36, -260], [-22, -300]]);
const WR = [[38, -60], [430, 0], [440, 40], [38, 90]], TR = [[24, 220], [170, 250], [170, 280], [20, 290]];
const WINGS = [P_(WR), P_(MIRX(WR))], TAILS = [P_(TR), P_(MIRX(TR))];
const LE = (x) => -60 + ((Math.abs(x) - 38) / 392) * 60;
const ENG = [-270, -140, 140, 270].map((x) => ({ x: PC.x + x * PS, y0: PC.y + (LE(x) - 55) * PS, y1: PC.y + (LE(x) + 35) * PS }));
const NOSE = { x: PC.x, y: PC.y - 278 * PS, r: 28 * PS };
function poly(pts, stroke, fill, lw = 3) { cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.closePath(); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
// the holes: on the wings, the body and the tail, never on the engines or the cockpit
const HOLES = (() => { const o = []; let s = 1; const inside = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  while (o.length < 46 && s < 4000) { s++; const x = PC.x + (rnd(s * 3.1) - 0.5) * 900, y = PC.y + (rnd(s * 7.7) - 0.5) * 640;
    const onW = WINGS.some((w) => inside(w, x, y)), onB = inside(BODY, x, y) && y > PC.y - 150 && y < PC.y + 230, onT = TAILS.some((w) => inside(w, x, y)), nearE = ENG.some((e) => Math.abs(x - e.x) < 34 && y > e.y0 - 14 && y < e.y1 + 14), nearN = Math.hypot(x - NOSE.x, y - NOSE.y) < 70;
    if ((onW || onB || onT) && !nearE && !nearN && o.every((p) => Math.hypot(p[0] - x, p[1] - y) > 30)) o.push([x, y]); } return o; })();
const ARMOR = [[PC.x - 400, PC.y - 30, 220, 90], [PC.x + 180, PC.y - 30, 220, 90], [PC.x - 34, PC.y - 120, 68, 300], [PC.x - 175, PC.y + 225, 350, 60]];
function plane(t, o = {}) { const k = oCub(k01(t, o.t0 ?? -0.6, 1.6)); if (k <= 0) return; cv.save(); if (k < 1) { cv.beginPath(); cv.rect(0, 0, W, PC.y - 340 + 700 * k); cv.clip(); } cv.globalAlpha *= o.a ?? 1; cv.shadowColor = CYAN; cv.shadowBlur = 14;
  const fill = `rgba(${ACC_RGB},0.07)`; [...WINGS, ...TAILS].forEach((w) => poly(w, CYAN, fill, 3)); poly(BODY, CYAN, `rgba(${ACC_RGB},0.10)`, 3);
  ENG.forEach((e) => { cv.beginPath(); cv.roundRect(e.x - 17, e.y0, 34, e.y1 - e.y0, 10); cv.fillStyle = TILE; cv.fill(); cv.strokeStyle = CYAN; cv.lineWidth = 3; cv.stroke(); }); cv.beginPath(); cv.arc(NOSE.x, NOSE.y, NOSE.r, 0, Math.PI * 2); cv.strokeStyle = CYAN; cv.lineWidth = 3; cv.stroke(); cv.restore();
  cv.save(); cv.globalAlpha *= 0.35; line(PC.x - 470, PC.y + 340, PC.x + 470, PC.y + 340, `rgba(${ACC_RGB},0.6)`, 2, [6, 8]); cv.restore(); txt('ILLUSTRATION', PC.x - 470, PC.y + 370, 18, DIMW, { mono: true, align: 'left' }); }
function holes(t, t0, t1) { HOLES.forEach(([x, y], i) => { const ti = t0 + ((t1 - t0) * i) / HOLES.length, k = k01(t, ti, 0.12); if (k <= 0) return; cv.save(); cv.shadowColor = RED; cv.shadowBlur = 12; circle(x, y, 7 * oBack(k), RED); cv.restore(); }); }
function healthy(t, t0) { const k = oCub(k01(t, t0, 0.5)); if (k <= 0) return; const p = 0.6 + 0.4 * Math.sin(t * 5); cv.save(); cv.globalAlpha *= k; cv.shadowColor = LIME; cv.shadowBlur = 26 * p; cv.strokeStyle = LIME; cv.lineWidth = 4;
  ENG.forEach((e) => { cv.beginPath(); cv.roundRect(e.x - 26, e.y0 - 10, 52, e.y1 - e.y0 + 20, 14); cv.stroke(); }); cv.beginPath(); cv.arc(NOSE.x, NOSE.y, NOSE.r + 12, 0, Math.PI * 2); cv.stroke(); cv.restore(); }
// ---------- the radar: blips that came back, and blips that never did ----------
const RC = { x: CX, y: 1090, r: 330 }, BLIPS = Array.from({ length: 12 }, (_, i) => ({ a: (i / 12) * Math.PI * 2 + rnd(i * 5) * 0.4, r: 0.35 + rnd(i * 9) * 0.55, lost: [1, 4, 6, 9, 11].includes(i) }));
function blipXY(b) { return [RC.x + Math.cos(b.a) * b.r * RC.r, RC.y + Math.sin(b.a) * b.r * RC.r]; }
function radarBase(t, k) { cv.save(); cv.globalAlpha *= k; [1, 0.66, 0.33].forEach((f) => { cv.beginPath(); cv.arc(RC.x, RC.y, RC.r * f, 0, Math.PI * 2); cv.strokeStyle = `rgba(${ACC_RGB},0.28)`; cv.lineWidth = 2; cv.stroke(); });
  line(RC.x - RC.r, RC.y, RC.x + RC.r, RC.y, `rgba(${ACC_RGB},0.2)`, 2); line(RC.x, RC.y - RC.r, RC.x, RC.y + RC.r, `rgba(${ACC_RGB},0.2)`, 2);
  const a = (t * 1.8) % (Math.PI * 2), g = cv.createConicGradient(a - 0.7, RC.x, RC.y); g.addColorStop(0, `rgba(${ACC_RGB},0)`); g.addColorStop(0.11, `rgba(${ACC_RGB},0.3)`); g.addColorStop(0.111, `rgba(${ACC_RGB},0)`);
  cv.beginPath(); cv.moveTo(RC.x, RC.y); cv.arc(RC.x, RC.y, RC.r, a - 0.7, a); cv.closePath(); cv.fillStyle = g; cv.fill(); line(RC.x, RC.y, RC.x + Math.cos(a) * RC.r, RC.y + Math.sin(a) * RC.r, CYAN, 3); cv.restore(); }
function miniPlane(x, y, s, col) { cv.save(); cv.translate(x, y); cv.scale(s, s); cv.beginPath(); cv.moveTo(0, -14); cv.lineTo(3, -4); cv.lineTo(14, 2); cv.lineTo(3, 3); cv.lineTo(2, 10); cv.lineTo(6, 13); cv.lineTo(-6, 13); cv.lineTo(-2, 10); cv.lineTo(-3, 3); cv.lineTo(-14, 2); cv.lineTo(-3, -4); cv.closePath(); cv.fillStyle = col; cv.fill(); cv.restore(); }
// lostAt: when the lost ones fade; foundAt: when they come back as dashed outlines; mine: which one is «حساب تو؟»
function radar(t, o) { const k = oCub(k01(t, o.t0, 0.5)); if (k <= 0) return; radarBase(t, k);
  BLIPS.forEach((b, i) => { const [x, y] = blipXY(b), ap = oCub(k01(t, o.t0 + 0.2 + i * 0.05, 0.3)); if (ap <= 0) return; cv.save(); cv.globalAlpha *= ap * k;
    if (!b.lost) { cv.shadowColor = CYAN; cv.shadowBlur = 14; miniPlane(x, y, 1.5, CYAN); if (o.okAt != null) { const q = oBack(k01(t, o.okAt + i * 0.04, 0.3)); if (q > 0) { cv.globalAlpha *= cl(q); cv.beginPath(); cv.arc(x, y, 26 * q, 0, Math.PI * 2); cv.strokeStyle = GREEN; cv.lineWidth = 3; cv.stroke(); } } }
    else { const li = BLIPS.slice(0, i).filter((q) => q.lost).length, lost = o.lostAt == null ? 0 : k01(t, o.lostAt + li * 0.35, 0.5), found = o.foundAt == null ? 0 : oCub(k01(t, o.foundAt + li * 0.45, 0.4));
      if (lost < 1) { cv.save(); cv.globalAlpha *= 1 - lost; cv.shadowColor = lost > 0 ? RED : CYAN; cv.shadowBlur = 14; miniPlane(x, y, 1.5, lost > 0 ? RED : CYAN); cv.restore(); }
      if (lost > 0.3 && found <= 0) { cv.save(); cv.globalAlpha *= cl((lost - 0.3) * 2) * 0.8; cv.setLineDash([5, 5]); cv.beginPath(); cv.arc(x, y, 18, 0, Math.PI * 2); cv.strokeStyle = RED; cv.lineWidth = 2; cv.stroke(); cv.restore(); txt('LOST', x + 22, y - 20, 15, RED, { mono: true, align: 'left', alpha: cl((lost - 0.3) * 2) }); }
      if (found > 0) { const mine = o.mine != null && i === o.mine && t >= o.mineAt, col = mine ? RED : FUT; cv.save(); cv.globalAlpha *= found; cv.setLineDash([5, 4]); cv.shadowColor = col; cv.shadowBlur = 12; cv.beginPath(); cv.arc(x, y, 22 + (mine ? 6 * Math.sin(t * 8) : 0), 0, Math.PI * 2); cv.strokeStyle = col; cv.lineWidth = 3; cv.stroke(); cv.setLineDash([]); miniPlane(x, y, 1.4, col); cv.restore(); if (!mine) txt('FOUND', x + 24, y - 22, 15, FUT, { mono: true, align: 'left', alpha: found }); } }
    cv.restore(); });
  txt('ILLUSTRATION', RC.x - RC.r, RC.y + RC.r + 40, 18, DIMW, { mono: true, align: 'left', alpha: k }); }
// ---------- the Explore grid: sample posts (no real account), then the gaps nobody posts ----------
const KINDS = ['profit', 'target', 'quote', 'target', 'profit', 'quote', 'quote', 'profit', 'target'], SLOTS16 = [0, 2, 3, 5, 8, 10, 11, 13, 15], EMPTY16 = [1, 4, 6, 7, 9, 12, 14];
function slot3(i) { const c = i % 3, r = Math.floor(i / 3), w = 260, h = 250; return [954 - w - c * (w + 24), 720 + r * (h + 24), w, h]; }
function slot4(i) { const c = i % 4, r = Math.floor(i / 4), w = 186, h = 180; return [939 - w - c * (w + 18), 720 + r * (h + 18), w, h]; }
function post(kind, x, y, w, h, hl, t) { const s = w / 260; cv.save(); cv.shadowColor = hl > 0 ? CYAN : 'transparent'; cv.shadowBlur = 24 * hl; rr(x, y, w, h, 16 * s, '#140C2C', hl > 0 ? CYAN : 'rgba(255,255,255,0.12)', 2 + 2 * hl); cv.restore();
  circle(x + w - 26 * s, y + 26 * s, 12 * s, `rgba(${ACC_RGB},0.4)`); rr(x + w - 130 * s, y + 20 * s, 88 * s, 10 * s, 5 * s, 'rgba(255,255,255,0.18)'); const cx = x + w / 2, cy = y + h * 0.58;
  if (kind === 'profit') { cv.save(); cv.shadowColor = GREEN; cv.shadowBlur = 16; const pts = [[x + 30 * s, y + h - 40 * s], [x + 80 * s, y + h - 70 * s], [x + 120 * s, y + h - 60 * s], [x + 170 * s, y + h - 120 * s], [x + w - 34 * s, y + 70 * s]]; cv.beginPath(); pts.forEach(([a, b], i) => (i ? cv.lineTo(a, b) : cv.moveTo(a, b))); cv.strokeStyle = GREEN; cv.lineWidth = 5 * s; cv.stroke(); cv.restore(); txt('سود', x + 64 * s, y + 80 * s, 34 * s, GREEN, { w: 900 }); }
  if (kind === 'target') { line(x + 24 * s, y + 80 * s, x + w - 24 * s, y + 80 * s, LIME, 3 * s, [8 * s, 6 * s]); for (let k = 0; k < 7; k++) { const bx = x + 40 * s + k * 28 * s, up = k % 3 !== 1, top = y + h - 50 * s - k * 20 * s; rr(bx, top - 26 * s, 14 * s, 26 * s, 3 * s, up ? GREEN : RED); } check(x + w - 50 * s, y + 80 * s - 30 * s, 12 * s, LIME, 5 * s); txt('تارگت', x + w - 60 * s, y + 120 * s, 28 * s, LIME, { w: 800 }); }
  if (kind === 'quote') { txt('«همیشه', cx, cy - 26 * s, 36 * s, WHITE, { w: 900 }); txt('جواب می‌ده»', cx, cy + 22 * s, 36 * s, WHITE, { w: 900 }); } }
function feed(t, o) { const k = oCub(k01(t, o.t0, 0.5)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; const m = o.morph ? io(k01(t, o.morph, 0.8)) : 0;
  txt('EXPLORE  /  SAMPLE POSTS', 126, 690, 18, DIMW, { mono: true, align: 'left' }); hudTag(t, o.t0 + 0.3, 'نمونه', null, 880, 680, DIMW, null, 22);
  KINDS.forEach((kind, i) => { const a = slot3(i), b = slot4(SLOTS16[i]), r = a.map((v, j) => lerp(v, b[j], m)), q = oBack(k01(t, o.t0 + 0.15 + i * 0.05, 0.35)); if (q <= 0) return;
    const hl = Math.max(...(o.hl || []).filter(([kd]) => kd === kind).map(([, a0, a1]) => (t >= a0 && t < a1 ? 0.6 + 0.4 * Math.sin((t - a0) * 9) : 0)), 0);
    at(r[0] + r[2] / 2, r[1] + r[3] / 2, q, 1, () => post(kind, -r[2] / 2, -r[3] / 2, r[2], r[3], hl, t));
    if (o.stamp != null) { const sq = oBack(k01(t, o.stamp + i * 0.06, 0.3)); if (sq > 0) at(r[0] + 30, r[1] + r[3] - 30, sq, 1, () => { cv.shadowColor = CYAN; cv.shadowBlur = 12; circle(0, 0, 22, `rgba(${BG_RGB},0.9)`); miniPlane(0, 0, 1.1, CYAN); }); } });
  if (o.morph != null) EMPTY16.forEach((si, j) => { const [x, y, w, h] = slot4(si), q = oCub(k01(t, o.gaps + j * 0.08, 0.35)); if (q <= 0) return; cv.save(); cv.globalAlpha *= q; cv.setLineDash([8, 7]); rr(x, y, w, h, 14, `rgba(${BG_RGB},0.6)`, RED, 2.5); cv.restore();
    txt('؟', x + w / 2, y + h / 2 - 6, 64, FUT, { w: 900, alpha: q * (t >= o.qAt ? 1 : 0.25), glow: VIO }); if (t >= o.notAt) txt('NOT POSTED', x + w / 2, y + h - 22, 14, RED, { mono: true, alpha: q * oCub(k01(t, o.notAt + j * 0.05, 0.3)) }); });
  cv.restore(); }
// ---------- the two questions ----------
function questions(t) { const q1 = oCub(k01(t, T(124), 0.4)), st = k01(t, T(127) + 0.2, 0.35), q2 = oBack(k01(t, T(130), 0.45));
  if (q1 > 0) { cv.save(); cv.globalAlpha *= q1 * (1 - 0.45 * st); brackets(110, 820, 860, 180, 26, 'rgba(255,255,255,0.4)', 3); txt('QUESTION 1', 130, 800, 18, DIMW, { mono: true, align: 'left' }); txt('«این استراتژی جواب داده؟»', CX, 912, 56, WHITE, { w: 900 }); cv.restore();
    if (st > 0) { line(CX + 380, 912, CX + 380 - 760 * st, 912, RED, 8); txt('WRONG QUESTION', 950, 800, 18, RED, { mono: true, align: 'right', alpha: st }); } }
  if (q2 > 0) at(CX, 1180, q2, cl(q2 * 2), () => { cv.shadowColor = LIME; cv.shadowBlur = 24; rr(-430, -110, 860, 220, 18, `rgba(${BG_RGB},0.88)`, LIME, 3.5); cv.shadowBlur = 0; txt('RIGHT QUESTION', -410, -136, 18, LIME, { mono: true, align: 'left' });
    txt('«هر بار که این الگو اومده،', 0, -34, 50, WHITE, { w: 900 }); txt('چی شده؟»', 0, 42, 64, LIME, { w: 900, glow: LIME }); if (t >= T(137)) check(370, -66, 16, LIME, 6); }); }
// ---------- the real replay, every case counted ----------
const SCR = [20, 140, 1540, 1000], KEYS = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), TALLY = seqT(T(180), T(195), 10);
function glassReplay(t) { const w = 940, h = (w * SCR[3]) / SCR[2], x = CX - w / 2, y = 740, k = oCub(k01(t, T(172), 0.45)); if (k <= 0) return; cv.save(); cv.globalAlpha = k;
  rr(x - 18, y - 18, w + 36, h + 36, 26, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.18)', 2); const f = cl((t - T(175)) / (T(195) - T(175))), im = IMG[KEYS[Math.min(15, Math.floor(f * 16))]];
  if (im) { cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 14); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, y, w, h);
    const cu = oCub(k01(t, T(186), 0.4)); if (cu > 0) { cv.globalAlpha *= cu; const g = cv.createLinearGradient(x + w * 0.6, 0, x + w * 0.86, 0); g.addColorStop(0, `rgba(${BG_RGB},0)`); g.addColorStop(0.35, `rgba(${BG_RGB},0.97)`); cv.fillStyle = g; cv.fillRect(x + w * 0.6, y, w * 0.4, h); txt('ادامه‌ش', x + w * 0.83, y + h / 2, 42, FUT); } cv.restore(); }
  const dk = k01(t, T(188), 0.6); if (dk > 0 && dk < 1) { cv.save(); cv.globalAlpha *= 1 - dk; cv.beginPath(); cv.arc(x + w * 0.58, y + h * 0.45, 30 + dk * 90, 0, Math.PI * 2); cv.strokeStyle = LIME; cv.lineWidth = 4; cv.stroke(); cv.restore(); }
  brackets(x - 30, y - 30, w + 60, h + 60, 30, CYAN, 3); txt('REPLAY  25.01.1404', x, y - 56, 22, CYAN, { mono: true, align: 'left' }); hudTag(t, T(174), '۲۵ فروردین ۱۴۰۴', 'DATE', x + w - 150, y - 60, CYAN, null, 26);
  txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', CX, y + h + 66, 32, DIMW, { w: 600 }); rr(x, y + h + 110, w, 6, 3, 'rgba(255,255,255,0.12)'); rr(x, y + h + 110, w * f, 6, 3, CYAN);
  const ty = y + h + 210, n = TALLY.filter((a) => t >= a).length; txt(`COUNT: ${String(n).padStart(2, '0')}`, x, ty - 62, 20, LIME, { mono: true, align: 'left' }); txt('همه‌ی دفعه‌ها', x + w, ty - 60, 30, WHITE, { align: 'right', w: 700 });
  TALLY.forEach((a, i) => { const q = oBack(k01(t, a, 0.3)), bx = x + w - 47 - i * 94; if (q <= 0) { rr(bx - 36, ty - 36, 72, 72, 10, null, 'rgba(255,255,255,0.12)', 2); return; } at(bx, ty, q, 1, () => { rr(-36, -36, 72, 72, 10, `rgba(${BG_RGB},0.9)`, CYAN, 2.5); txt('؟', 0, 0, 40, FUT, { w: 900 }); }); });
  cv.restore(); }
function close_(t) { const k = oBack(k01(t, T(196), 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 760 - s / 2, s, s); cv.restore(); }
  const q = oCub(k01(t, T(196) + 0.15, 0.4)); txt('شروعش رایگانه', CX, 1010, 110, WHITE, { w: 900, alpha: q, glow: 'rgba(142,107,255,0.6)' });
  const p = oBack(k01(t, T(198), 0.4)); if (p > 0) at(CX, 1200, p, 1, () => { rr(-280, -70, 560, 140, 70, 'rgba(198,242,78,0.12)', LIME, 3); txt('لینک توی بیو', 0, 4, 60, LIME, { glow: LIME }); }); brackets(CX - 360, 600, 720, 720, 40, `rgba(${ACC_RGB},0.5)`, 3); }
function endCard(t) { const k = oBack(k01(t, END, 0.45)); if (IMG.icon) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 820 - s / 2, s, s); cv.restore(); }
  if (IMG.word) { const q = oCub(k01(t, END + 0.2, 0.4)), ww = 460, hh = (ww * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = q; cv.drawImage(IMG.word, CX - ww / 2, 1010, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.45, 0.35)), tag = 'همه‌ی دفعه‌ها رو بشمار، نه فقط برنده‌ها'; cv.save(); cv.globalAlpha = f; const tw = measure(tag, 38, 800) + 70; rr(CX - tw / 2, 1232, tw, 96, 48, 'rgba(198,242,78,0.12)', LIME, 2); txt(tag, CX, 1282, 38, LIME); txt('شروعش رایگانه؛ لینک توی بیو', CX, 1400, 36, DIMW, { w: 700 }); cv.restore(); }

// ---------- the scenes: their drawing (keep: the same drawing carries on) and their words (indices in the voice) ----------
const planeA = (t) => { plane(t); holes(t, T(9), T(13) + 0.5); cv.save(); cv.globalAlpha *= 1 - k01(t, T(34), 0.3); hudTag(t, T(4), 'برگشته از مأموریت', 'RETURNED', CX, 700, CYAN, null, 28); cv.restore();
  const ar = oCub(k01(t, T(22), 0.4)) * (1 - k01(t, T(33) + 0.3, 0.4)); if (ar > 0) { cv.save(); cv.globalAlpha *= ar; ARMOR.forEach(([x, y, w, h]) => { rr(x, y, w, h, 10, `rgba(${ACC_RGB},0.22)`, CYAN, 3); }); cv.restore(); }
  cv.save(); cv.globalAlpha *= 1 - k01(t, T(33) + 0.3, 0.4); hudTag(t, T(22) + 0.2, 'زره؟', 'ARMOR?', CX + 330, 1420, CYAN, null, 28); cv.restore(); const no = oBack(k01(t, T(33), 0.3)) * (1 - k01(t, T(34) + 0.4, 0.4)); if (no > 0) at(CX, 1090, no, cl(no * 2), () => cross(0, 0, 90, RED, 16));
  hudTag(t, T(30), 'آبراهام والد', 'STATISTICIAN', CX - 300, 1420, FUT, null, 28); healthy(t, T(34)); hudTag(t, T(35), 'جاهای سالم', 'NO HITS', CX, 700, LIME, null, 30);
  const qq = oBack(k01(t, T(37), 0.4)) * (1 - k01(t, T(44), 0.4)); if (qq > 0) at(CX, 1090, qq, cl(qq * 2), () => txt('؟', 0, 0, 260, FUT, { w: 900, glow: VIO })); };
const phone = (t) => { const k = oCub(k01(t, T(44), 0.5)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; cv.shadowColor = CYAN; cv.shadowBlur = 20; rr(CX - 190, 760, 380, 680, 44, `rgba(${BG_RGB},0.8)`, CYAN, 4); cv.restore(); cv.save(); cv.globalAlpha *= k;
  rr(CX - 50, 782, 100, 12, 6, `rgba(${ACC_RGB},0.4)`); for (let i = 0; i < 9; i++) { const c = i % 3, r = Math.floor(i / 3), q = oBack(k01(t, T(45) + i * 0.06, 0.3)); if (q > 0) at(CX + 110 - c * 110, 900 + r * 120, q, 1, () => rr(-50, -52, 100, 104, 10, '#140C2C', 'rgba(255,255,255,0.15)', 2)); }
  txt('INSTAGRAM', CX, 1475, 20, DIMW, { mono: true }); cv.restore(); };
const SC = [
  { group: 'plane', t: 0, draw: planeA, lines: [L(290, 96, [['جنگ', 0], ['جهانی', 1], ['دوم،', 2, { c: CYAN, bar: true }]], { now: true, ghost: true }), L(400, 66, [['هواپیماهایی', 3], ['که', 4], ['از', 5], ['مأموریت', 6], ['برمی‌گشتن،', [7, 8]]], { now: true, ghost: true }), L(510, 80, [['پر', 9], ['از', 10], ['جای', 11], ['گلوله', 12, { c: RED, bar: true }], ['بودن.', 13]], { now: true, ghost: true })] },
  { group: 'plane', t: T(14), draw: planeA, lines: [L(320, 84, [['پیشنهاد', 14], ['اول', 15], ['این', 16], ['بود:', 17]]), L(450, 78, [['همین', 18], ['جاهای', 19], ['سوراخ', 20, { c: RED }], ['رو', 21], ['زره‌پوش', [22, 23], { c: CYAN, bar: true }], ['کنیم.', 24]])] },
  { group: 'plane', t: T(25), draw: planeA, lines: [L(300, 70, [['ولی', 25], ['یه', 26], ['ریاضی‌دان', 27], ['به', 28], ['اسم', 29], ['آبراهام', 30, { c: FUT }], ['والد', 31, { c: FUT }], ['گفت:', 32]]), L(440, 104, [['نه…', 33, { c: RED }], ['جاهای', 34], ['سالم', 35, { c: LIME, bar: true }], ['رو.', 36]])] },
  { t: T(37), group: 'plane', draw: (t) => { cv.save(); cv.globalAlpha *= 1 - k01(t, T(44), 0.4); planeA(t); cv.restore(); phone(t); }, lines: [L(300, 120, [['چرا؟', 37, { c: FUT }]]), L(430, 66, [['جوابش', 38], ['دقیقاً', 39], ['همون', 40], ['اشتباهیه', 41, { c: RED, bar: true }]]), L(530, 66, [['که', 42], ['ما', 43], ['توی', 44], ['اینستاگرام', 45, { c: CYAN }], ['با', 46], ['استراتژی‌ها', [47, 48]], ['می‌کنیم.', [49, 50]]])] },
  { group: 'radar1', t: T(51), draw: (t) => radar(t, { t0: T(51), lostAt: T(61), okAt: T(80) }), lines: [L(300, 66, [['چون', 51], ['هواپیماهایی', 52], ['که', 53], ['به', 54], ['اون', 55], ['جاهای', 56], ['سالم', 57, { c: LIME }]]), L(400, 66, [['تیر', 58], ['خورده', 59], ['بودن،', 60]]), L(520, 84, [['هیچ‌وقت', [61, 62], { c: RED, bar: true }], ['برنگشتن', [63, 64]], ['که', 65], ['دیده', 66], ['بشن.', 67]])] },
  { group: 'radar1', t: T(68), draw: (t) => { radar(t, { t0: T(51), lostAt: T(61), okAt: T(80) }); alertBox(t, T(72), 'سوگیری بقا', 'SURVIVORSHIP BIAS', CX, 1540, CYAN); }, lines: [L(320, 96, [['به', 68], ['این', 69], ['می‌گن', [70, 71]], ['سوگیری', 72, { c: CYAN, bar: true }], ['بقا:', 73, { c: CYAN }]]), L(450, 72, [['فقط', 74], ['اونایی', 75], ['رو', 76], ['می‌بینیم', [77, 78]], ['که', 79], ['سالم', 80, { c: GREEN }], ['برگشتن.', 81]])] },
  { group: 'feed', t: T(82), draw: (t) => feed(t, { t0: T(83), hl: [['profit', T(86), T(88)], ['target', T(88), T(94)], ['quote', T(94), T(100)]] }), lines: [L(380, 100, [['حالا', 82], ['اکسپلورت', 83, { c: CYAN, bar: true }], ['رو', 84], ['ببین:', 85]])] },
  { group: 'feed', t: T(86), draw: (t) => feed(t, { t0: T(83), hl: [['profit', T(86), T(88)], ['target', T(88), T(94)], ['quote', T(94), T(100)]] }), lines: [L(290, 64, [['اسکرین‌شات', 86], ['سود،', 87, { c: GREEN }]]), L(390, 64, [['چارتی', 88], ['که', 89], ['دقیق', 90], ['خورده', 91], ['به', 92], ['تارگت،', 93, { c: GREEN }]]), L(500, 70, [['«این', 94], ['استراتژی', 95], ['همیشه', 96, { c: LIME, bar: true }], ['جواب', 97], ['می‌ده»', [98, 99]]])] },
  { group: 'feed', t: T(100), draw: (t) => feed(t, { t0: T(83), stamp: T(101) }), lines: [L(380, 96, [['اینا', 100], ['هواپیماهای', 101], ['برگشته‌ان.', 102, { c: CYAN, bar: true }]])] },
  { group: 'feed', t: T(103), draw: (t) => feed(t, { t0: T(83), stamp: -9, morph: T(104), gaps: T(107), qAt: T(111), notAt: T(115) }), lines: [L(290, 70, [['اون', 103], ['دفعه‌هایی', [104, 105]], ['که', 106], ['همون', 107], ['الگو', 108]]), L(395, 74, [['جواب', 109], ['نداد', 110, { c: RED }], ['کجاست؟', 111, { c: FUT, bar: true }]]), L(510, 70, [['هیچ‌کس', [112, 113]], ['ازشون', 114], ['پست', 115], ['نمی‌ذاره.', [116, 117]]])] },
  { t: T(118), draw: questions, lines: [L(330, 78, [['پس', 118], ['سؤال', 119], ['درست', 120, { c: LIME, bar: true }], ['این', 121], ['نیست', 122], ['که', 123]])] },
  { t: T(128), draw: questions, lines: [L(330, 96, [['سؤال', 128], ['اینه:', 129, { c: LIME, bar: true }]])] },
  { group: 'radar2', t: T(138), draw: (t) => radar(t, { t0: T(138) - 0.3, lostAt: -20, foundAt: T(152), mine: 6, mineAt: T(163) }), lines: [L(320, 88, [['همه‌ی', [138, 139]], ['دفعه‌ها،', [140, 141], { c: CYAN, bar: true }]]), L(450, 68, [['نه', 142], ['فقط', 143], ['اونایی', 144], ['که', 145], ['عکسشون', 146], ['رو', 147], ['دیدی.', 148]])] },
  { group: 'radar2', t: T(149), draw: (t) => radar(t, { t0: T(138) - 0.3, lostAt: -20, foundAt: T(152), mine: 6, mineAt: T(163) }), lines: [L(320, 70, [['اون‌وقته', [149, 150]], ['که', 151], ['هواپیماهای', 152], ['گم‌شده', [153, 154], { c: FUT, bar: true }]]), L(440, 76, [['هم', 155], ['دیده', 156], ['می‌شن…', [157, 158]]])] },
  { group: 'radar2', t: T(159), draw: (t) => { radar(t, { t0: T(138) - 0.3, lostAt: -20, foundAt: T(152), mine: 6, mineAt: T(163) }); const [x, y] = blipXY(BLIPS[6]); hudTag(t, T(163), 'حساب تو؟', 'YOUR ACCOUNT?', x, y - 70, RED, null, 30); }, lines: [L(320, 84, [['قبل', 159], ['از', 160], ['اینکه', [161, 162]]]), L(450, 84, [['حساب', 163, { c: RED, bar: true }], ['خودت', 164], ['یکی', 165], ['از', 166], ['اونا', 167], ['بشه.', 168]])] },
  { t: T(169) - 0.05, draw: reveal, lines: [L(1460, 100, [['توی', 169], ['بک‌تست‌لب', [170, 171], { c: CYAN }]])] },
  { t: T(172), draw: glassReplay, lines: [L(400, 96, [['برو', 172], ['به', 173], ['گذشته،', 174, { c: CYAN, bar: true }]])] },
  { t: T(175), draw: glassReplay, lines: [L(400, 96, [['بازار', 175], ['رو', 176], ['جلو', 177, { c: CYAN, bar: true }], ['ببر،', 178]])] },
  { t: T(179), draw: glassReplay, lines: [L(290, 68, [['و', 179], ['هر', 180], ['بار', 181], ['الگوت', 182, { c: CYAN }], ['اومد،', 183]]), L(395, 68, [['قبل', 184], ['از', 185], ['دیدن', 186], ['ادامه‌ش', 187, { c: FUT }]]), L(520, 92, [['تصمیم', 188, { c: LIME, bar: true }], ['بگیر.', 189]])] },
  { t: T(190), draw: glassReplay, lines: [L(400, 96, [['همه‌ی', [190, 191]], ['دفعه‌ها', [192, 193], { c: CYAN }], ['رو', 194], ['بشمار.', 195, { c: LIME, bar: true }]])] },
  { t: T(196), draw: close_, lines: [] },
  { t: END, draw: endCard, lines: [] },
];

// ---------- frame ----------
const REAL = [T(172), T(196)];
function hudFrame(t) { cv.fillStyle = BG; cv.fillRect(0, 0, W, H); const g = cv.createRadialGradient(CX, 1000, 100, CX, 1000, 1200); g.addColorStop(0, 'rgba(84,48,230,0.40)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.save(); cv.globalAlpha = 0.05; for (let x = 0; x <= W; x += 90) line(x, 0, x, H, WHITE, 1); for (let y = 0; y <= H; y += 90) line(0, y, W, y, WHITE, 1); cv.restore();
  brackets(36, 36, W - 72, H - 72, 46, 'rgba(255,255,255,0.35)', 3);
  const tc = (s) => String(Math.floor(s)).padStart(2, '0'); txt('BACKTESTLAB / SURVIVORSHIP', 70, 90, 20, DIMW, { mono: true, align: 'left' }); txt(`00:${tc(t / 60)}:${tc(t % 60)}:${tc((t * 30) % 30)}`, W - 70, 90, 20, DIMW, { mono: true, align: 'right' });
  txt(t >= REAL[0] && t < REAL[1] ? 'REAL REPLAY' : 'ILLUSTRATION', 70, H - 86, 20, DIMW, { mono: true, align: 'left' }); txt('COUNT EVERY CASE', W - 70, H - 86, 20, DIMW, { mono: true, align: 'right' }); }
function frame(t) {
  hudFrame(t); let k = 0; SC.forEach((s, i) => { if (t >= s.t) k = i; }); const s = SC[k], nx = SC[k + 1], pv = SC[k - 1], fadeIn = oCub(k01(t, s.t, 0.3)), fadeOut = nx ? 1 - k01(t, nx.t - 0.15, 0.15) : 1;
  const same = (a, b) => a && b && (a.draw === b.draw || (a.group && a.group === b.group)), dIn = same(pv, s) ? 1 : fadeIn, dOut = same(nx, s) ? 1 : fadeOut;
  cv.save(); cv.globalAlpha = k === 0 ? dOut : Math.min(dIn, dOut); s.draw(t); cv.restore();
  s.lines.forEach((ln) => wordsLine(ln, t, k === 0 ? fadeOut : Math.min(fadeIn, fadeOut)));
  const pk = cl(t / END); cv.fillStyle = 'rgba(255,255,255,0.1)'; cv.fillRect(0, 0, W, 6); cv.fillStyle = CYAN; cv.fillRect(W * (1 - pk), 0, W * pk, 6);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(13) + 0.6); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  frame(0); window.ready = true;
});
