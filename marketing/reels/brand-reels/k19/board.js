// k19 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟», a split-flap board, on k16's cut of the user's voice.
// The whole reel is two split-flap boards on a dark wall, like an airport's:
//   - the top board carries the spoken words: each word's flaps run through a few random letters and land as it is said
//     (right to left), and the words of the last line flip back to blank or straight into the next ones. The hook's
//     question is on the board from the first frame, each word lighting up as it is said;
//   - the lower board is the status table: the strategy's status flips between «اعتماد» and «ترس» until «می‌ترسی؟»;
//     «بررسی نشده»; then the three answers as rows with a number, the answer, a status and a light (green «ادامه»,
//     amber «حجم کم», red «توقف» that flips to «به‌موقع» on «فهمیدی»); «ندونستن» lands as «نامعلوم» and flips to «لغو»
//     on «بهتره»; two big flaps count up to «۵۰»; the real gold replay (k13's screens) inside the board; the brand and
//     the free start.
// Every flip is a click in the soundtrack (window.CLICKS, dumped by clicks.cjs). 1080×1920, every frame a pure function
// of t (window.seek).
const W = 1080, H = 1920, CX = 540;
const TXT = '#F2EDE2', DIM = '#7E796F', YEL = '#FFC93C', GRN = '#3DDC84', RED = '#FF4D5E', AMB = '#FFA62B', LIME = '#C6F24E', VIOL = '#B39CFF', GRY = '#9A95A3';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- helpers ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pulse = (t, a, d = 0.35) => (t >= a && t < a + d ? Math.sin(((t - a) / d) * Math.PI) : 0);
const FONT = (s, w = 800) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 800); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = isL(s) ? 'ltr' : 'rtl'; cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 800) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- the boards ----------
const FL = 0.055;   // one flip
const TOP = { id: 'T', x0: 46, y0: 256, rows: 4, rh: 142, rg: 10, U: 119, G: 6, units: 8, size: 88 };
const LOW = { id: 'L', x0: 46, y0: 990, rows: 4, rh: 112, rg: 10, U: 119, G: 6, units: 8, size: 60 };
const unitX = (B, u) => B.x0 + (B.units - 1 - u) * (B.U + B.G);   // u = 0 is the rightmost unit
const rowY = (B, r) => B.y0 + r * (B.rh + B.rg);
const EV = {};   // `${board}:${row}:${unit}` → [{ t: when it lands, c: content or null (blank), n: random flaps before it }]
const CUR = {};
const ev = (B, r, u, t, c, n = 3) => { const k = `${B.id}:${r}:${u}`; (EV[k] = EV[k] || []).push({ t, c, n }); CUR[k] = c; };
const cur = (B, r, u) => CUR[`${B.id}:${r}:${u}`] ?? null;
/** Content spanning units uA..uB of a row (right to left), landing at t (one unit after another, right to left). */
function cell(B, r, uA, uB, c, t, n = 3) {
  const right = unitX(B, uA) + B.U, left = unitX(B, uB), cc = { ...c, cx: (left + right) / 2, w: right - left, size: c.size ?? B.size };
  if (c.text && !c.big) { const tw = measure(c.text, cc.size); cc.sc = Math.min(1, (cc.w - 30) / tw); }
  for (let u = uA; u <= uB; u++) ev(B, r, u, t + (u - uA) * 0.018, cc, n);
}
const blank = (B, r, u, t) => { if (cur(B, r, u)) ev(B, r, u, t, null, 1); };
function clearBoard(B, t, keep = () => false) { for (let r = 0; r < B.rows; r++) for (let u = 0; u < B.units; u++) if (!keep(r, u)) blank(B, r, u, t + u * 0.016 + r * 0.035); }
/** The top board: a group of spoken lines; each word lands as it is said, units it leaves empty flip to blank. */
function spoken(lines, start, o = {}) {
  const want = {};
  lines.forEach((toks, r) => {
    if (!toks) return; let size = o.size ?? TOP.size, spans;
    const spanOf = (s, z) => Math.max(1, Math.ceil((measure(s, z) + 34 + TOP.G) / (TOP.U + TOP.G)));
    for (;;) { spans = toks.map(([s]) => spanOf(s, size)); if (spans.reduce((a, b) => a + b, 0) <= TOP.units || size < 50) break; size -= 6; }
    let u = Math.floor((TOP.units - spans.reduce((a, b) => a + b, 0)) / 2);
    toks.forEach(([s, wi, col], j) => { const t = o.at ? o.at + j * 0.12 + r * 0.25 : ws(Array.isArray(wi) ? wi[0] : wi) - 0.03; for (let k = 0; k < spans[j]; k++) want[`${r}:${u + k}`] = { s, wi: o.at ? undefined : Array.isArray(wi) ? wi[0] : wi, col, uA: u, uB: u + spans[j] - 1, t, size }; u += spans[j]; });
  });
  // the last line's words all flip away first (the new ones land as they are said)
  for (let r = 0; r < TOP.rows; r++) for (let u = 0; u < TOP.units; u++) blank(TOP, r, u, start + u * 0.015 + r * 0.03);
  const done = new Set();
  Object.values(want).forEach((w) => { const key = `${w.uA}:${w.t}:${w.s}`; if (done.has(key)) return; done.add(key); const r = +Object.keys(want).find((k) => want[k] === w).split(':')[0];
    cell(TOP, r, w.uA, w.uB, { text: w.s, col: w.col, wi: w.wi, size: w.size }, o.static ? -5 : w.t, o.static ? 0 : 3); });
}

// ---------- the story ----------
function build() {
  // top board: the spoken lines
  spoken([[['به', 0, TXT], ['استراتژیت', 1, YEL]], [['اعتماد', 2, GRN], ['داری،', 3, TXT]], [['یا', 4, TXT], ['از', 5, TXT], ['بررسی', 6, YEL], ['کردنش', 7, TXT]], [['می‌ترسی؟', [8, 9], RED]]], -5, { static: true });
  spoken([[['بیا', 10, TXT], ['ببینیم', 11, TXT]], [['از', 12, TXT], ['چی', 13, YEL]], [['می‌ترسی؟', [14, 15], RED]]], T.see - 0.1);
  spoken([[['بررسیش', 16, TXT], ['فقط', 17, TXT]], [['سه', 18, YEL], ['تا', 19, TXT], ['جواب', 20, YEL]], [['داره.', 21, TXT]]], T.three - 0.1);
  spoken([[['یا', 22, TXT], ['کار', 23, GRN], ['می‌کنه،', [24, 25], GRN]], [['پس', 26, TXT], ['با', 27, TXT], ['خیال', 28, TXT], ['راحت', 29, GRN]], [['ادامه', 30, TXT], ['می‌دی.', [31, 32], TXT]]], T.a1 - 0.1);
  spoken([[['یا', 33, TXT], ['کار', 34, TXT], ['می‌کنه', [35, 36], TXT]], [['ولی', 37, TXT], ['با', 38, TXT], ['ریسک', 39, AMB], ['کمتر،', [40, 41], AMB]]], T.a2 - 0.1);
  spoken([null, null, [['پس', 42, TXT], ['فقط', 43, TXT]], [['حجمتو', 44, AMB], ['درست', 45, TXT], ['می‌کنی.', [46, 47], TXT]]], ws(42) - 0.15);
  spoken([[['یا', 48, TXT], ['کار', 49, TXT], ['نمی‌کنه،', [50, 51], RED]], [['پس', 52, TXT], ['قبل', 53, TXT], ['از', 54, TXT], ['اینکه', [55, 56], TXT]], [['پولتو', 57, GRN], ['بگیره،', 58, TXT]]], T.a3 - 0.1);
  spoken([null, null, null, [['فهمیدی.', 59, YEL]]], ws(59) - 0.12);
  spoken([[['هر', 60, TXT], ['سه', 61, YEL], ['تاش', 62, TXT]], [['از', 63, TXT], ['ندونستن', 64, GRY]], [['بهتره.', 65, GRN]]], T.all - 0.1);
  spoken([[['این', 66, TXT], ['هفته', 67, TXT], ['فقط', 68, TXT]], [['۵۰', 69, YEL], ['تا', 70, TXT], ['معامله‌ی', 71, TXT]], [['گذشته‌ش', 72, YEL], ['رو', 73, TXT]]], T.week - 0.1);
  spoken([[['توی', 74, TXT], ['بک‌تست‌لب', [75, 76], VIOL]], [['تست', 77, LIME], ['کن.', 78, TXT]]], T.lab - 0.1);
  spoken([[['شروعش', 79, TXT], ['رایگانه؛', 80, LIME]], [['لینکش', 81, TXT], ['توی', 82, TXT], ['بیوئه.', 83, TXT]]], T.cta - 0.1);
  spoken([null, [['بک‌تست‌لب', 0, VIOL]], [['شروعش', 0, TXT], ['رایگانه', 0, LIME]], [['لینک', 0, TXT], ['توی', 0, TXT], ['بیو', 0, TXT]]], T.end, { at: T.end + 0.1 });

  // lower board: the status table (u0 number, u1–u4 the answer, u5–u6 the status, u7 the light)
  const L = LOW;
  cell(L, 0, 0, 4, { text: 'استراتژی تو', col: TXT }, -5, 0); cell(L, 0, 5, 6, { text: 'اعتماد', col: GRN }, -5, 0); cell(L, 0, 7, 7, { led: AMB, blink: true }, -5, 0);
  for (let i = 0, t = 0.45; t < ws(9) - 0.3; i++, t += 0.42) cell(L, 0, 5, 6, i % 2 ? { text: 'اعتماد', col: GRN } : { text: 'ترس', col: RED }, t, 1);
  cell(L, 0, 5, 6, { text: 'ترس؟', col: RED }, ws(9) - 0.03, 2); cell(L, 0, 7, 7, { led: RED }, ws(9) - 0.03, 1);
  cell(L, 1, 0, 4, { text: 'بررسی', col: TXT }, T.see + 0.05); cell(L, 1, 5, 6, { text: 'نشده', col: RED }, ws(11)); cell(L, 1, 7, 7, { led: RED, blink: true }, ws(11) + 0.05, 1);
  clearBoard(L, T.three - 0.1);
  ['۱', '۲', '۳'].forEach((n, r) => { cell(L, r, 0, 0, { text: n, col: YEL }, ws(18) + r * 0.09, 3); cell(L, r, 7, 7, { led: null }, ws(18) + 0.1 + r * 0.09, 1); });
  cell(L, 0, 1, 4, { text: 'کار می‌کنه', col: GRN }, ws(23)); cell(L, 0, 7, 7, { led: GRN }, ws(23) + 0.05, 1); cell(L, 0, 5, 6, { text: 'ادامه', col: GRN }, ws(30));
  cell(L, 1, 1, 4, { text: 'ریسک کمتر', col: AMB }, ws(39)); cell(L, 1, 7, 7, { led: AMB }, ws(39) + 0.05, 1); cell(L, 1, 5, 6, { text: 'حجم کم', col: AMB }, ws(44));
  cell(L, 2, 1, 4, { text: 'کار نمی‌کنه', col: RED }, ws(50)); cell(L, 2, 7, 7, { led: RED }, ws(50) + 0.05, 1); cell(L, 2, 5, 6, { text: 'توقف', col: RED }, ws(52));
  cell(L, 2, 5, 6, { text: 'به‌موقع', col: GRN }, ws(59) - 0.03, 3); cell(L, 2, 7, 7, { led: GRN }, ws(59), 1);
  cell(L, 3, 0, 0, { text: '؟', col: GRY }, T.all + 0.05); cell(L, 3, 1, 4, { text: 'ندونستن', col: GRY }, ws(64) - 0.06); cell(L, 3, 5, 6, { text: 'نامعلوم', col: GRY }, ws(64) + 0.05); cell(L, 3, 7, 7, { led: GRY }, ws(64) + 0.1, 1);
  cell(L, 3, 5, 6, { text: 'لغو', col: RED }, ws(65) - 0.03, 3); cell(L, 3, 7, 7, { led: RED, blink: true }, ws(65), 1);
  // «۵۰ تا معامله»: the table flips away; two big flaps count up
  clearBoard(L, T.week - 0.12);
  cell(L, 0, 2, 5, { text: 'این هفته', col: TXT }, ws(67)); cell(L, 3, 1, 6, { text: 'معامله‌ی گذشته', col: TXT }, ws(71));
  // the replay inside the board, then the brand and the free start
  clearBoard(L, T.lab - 0.15);
  clearBoard(L, T.cta - 0.05);
  cell(L, 1, 1, 6, { text: 'بک‌تست‌لب', col: VIOL, size: 76 }, T.cta + 0.15); cell(L, 2, 1, 6, { text: 'شروع رایگان', col: LIME }, ws(80)); cell(L, 2, 7, 7, { led: LIME, blink: true }, ws(80) + 0.05, 1);
  cell(L, 3, 1, 5, { text: 'لینک توی بیو', col: TXT }, ws(81)); cell(L, 3, 6, 6, { arrow: LIME }, ws(81) + 0.1, 2);
  clearBoard(L, T.end + 0.05);
  Object.values(EV).forEach((list) => list.sort((a, b) => a.t - b.t));
}
// the two big digit flaps of «۵۰» (tens on the left, ones on the right, as the number is written)
const BIG = { tens: [], ones: [] };
function buildBig() {
  const t0 = T.week + 0.15, tEnd = ws(69) + 0.55, n = 5; BIG.tens.push({ t: t0, c: '۰', n: 2 }); BIG.ones.push({ t: t0 + 0.04, c: '۰', n: 2 });
  for (let k = 1; k <= n; k++) BIG.tens.push({ t: ws(69) - 0.05 + ((tEnd - ws(69)) * k) / n, c: '۰۱۲۳۴۵'[k], n: 0 });
  for (let t = ws(69) - 0.05, i = 1; t < tEnd - 0.02; t += 0.045, i++) BIG.ones.push({ t, c: '۰۱۲۳۴۵۶۷۸۹'[i % 10], n: 0 }); BIG.ones.push({ t: tEnd, c: '۰', n: 0 });
  [BIG.tens, BIG.ones].forEach((l) => l.push({ t: T.lab - 0.12, c: null, n: 1 }));
}
const BIGRECT = (which) => { const B = LOW, uA = which === 'tens' ? 4 : 2, right = unitX(B, uA) + B.U, left = unitX(B, uA + 1); return { x: left, y: rowY(B, 1), w: right - left, h: 2 * B.rh + B.rg }; };
const bigOn = (t) => t > T.week - 0.2 && t < T.lab + 0.2;

// ---------- drawing a flap ----------
const GLYPHS = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی۰۱۲۳۴۵۶۷۸۹';
const filler = (seed) => ({ glyph: GLYPHS[Math.floor(rnd(seed) * GLYPHS.length)] });
function face(x, y, w, h, top) { const g = cv.createLinearGradient(0, y, 0, y + h); if (top) { g.addColorStop(0, '#2B2A30'); g.addColorStop(1, '#222127'); } else { g.addColorStop(0, '#1B1A1F'); g.addColorStop(1, '#232228'); } rrect(x, y, w, h * 2, 10, g); }
function content(c, x, y, w, h, hinge, t, big) {
  if (!c) return;
  if (c.glyph) { txt(c.glyph, x + w / 2, hinge + h * 0.03, big ? 170 : h * 0.55, '#CFC9BC'); return; }
  if (c.led !== undefined) { const on = c.led && (!c.blink || Math.floor(t * 3.2) % 2 === 0); circle(x + w / 2, hinge, h * 0.2, '#0E0D11'); if (on) { cv.save(); cv.shadowColor = c.led; cv.shadowBlur = 26; circle(x + w / 2, hinge, h * 0.16, c.led); cv.restore(); circle(x + w / 2 - h * 0.05, hinge - h * 0.05, h * 0.05, 'rgba(255,255,255,0.7)'); } else circle(x + w / 2, hinge, h * 0.16, '#2E2D33'); return; }
  if (c.arrow) { cv.save(); cv.strokeStyle = c.arrow; cv.lineWidth = 9; cv.lineCap = cv.lineJoin = 'round'; const ax = x + w / 2, s = h * 0.28, dy = ((t * 2) % 1) * 6; cv.beginPath(); cv.moveTo(ax, hinge - s + dy); cv.lineTo(ax, hinge + s + dy); cv.moveTo(ax - s * 0.6, hinge + s * 0.35 + dy); cv.lineTo(ax, hinge + s + dy); cv.lineTo(ax + s * 0.6, hinge + s * 0.35 + dy); cv.stroke(); cv.restore(); return; }
  const lit = c.wi === undefined || t >= ws(c.wi) - 0.04, col = lit ? c.col : DIM, size = big ? c.size : c.size * (c.sc ?? 1);
  if (lit && c.col !== TXT && c.col !== DIM) { cv.save(); cv.shadowColor = rgba(c.col, 0.55); cv.shadowBlur = 18; txt(c.text, c.cx, hinge + size * 0.05, size, col); cv.restore(); } else txt(c.text, c.cx, hinge + size * 0.05, size, col);
}
/** One flap unit at rect (x, y, w, h): A is shown before the flip, B after, p the flip's progress. */
function flap(x, y, w, h, A, B, p, t, big = false) {
  const hinge = y + h / 2, half = (top, c, s = 1, shade = 0) => {
    cv.save(); if (s !== 1) { cv.translate(0, hinge); cv.scale(1, s); cv.translate(0, -hinge); }
    cv.beginPath(); if (top) cv.rect(x, y, w, h / 2 - 1); else cv.rect(x, hinge + 1, w, h / 2 - 1); cv.clip();
    face(x, top ? y : y - h, w, h, top); content(c, x, y, w, h, hinge, t, big);
    if (shade) { cv.fillStyle = `rgba(0,0,0,${shade})`; cv.fillRect(x, y, w, h); } cv.restore(); };
  if (p >= 1) { half(true, B); half(false, B); }
  else { half(true, B); half(false, A); if (p < 0.5) half(true, A, Math.cos(p * Math.PI), p * 0.9); else half(false, B, -Math.cos(p * Math.PI), (1 - p) * 0.9); }
  cv.fillStyle = '#0B0A0D'; cv.fillRect(x, hinge - 1.5, w, 3); circle(x + 5, hinge, 3.5, '#45434B'); circle(x + w - 5, hinge, 3.5, '#45434B');
}
/** The state of a list of events at t: what to show and how far the flip is. */
function stateOf(list, t, seed) {
  let i = -1; for (let k = 0; k < list.length; k++) if (t >= list[k].t - (list[k].n + 1) * FL || list[k].n === 0 && t >= list[k].t - FL) i = k;
  if (i < 0) return { A: null, B: null, p: 1 };
  const e = list[i], prev = i > 0 ? list[i - 1].c : null, flips = e.n + 1, st = e.t - flips * FL;
  if (t >= e.t) return { A: e.c, B: e.c, p: 1 };
  const seq = [prev]; for (let k = 0; k < e.n; k++) seq.push(filler(seed * 31 + i * 7 + k)); seq.push(e.c);
  const f = (t - st) / FL, k = Math.max(0, Math.min(flips - 1, Math.floor(f)));
  return { A: seq[k], B: seq[k + 1], p: cl(f - k) };
}
function drawBoard(B, t, skip) {
  for (let r = 0; r < B.rows; r++) for (let u = 0; u < B.units; u++) { if (skip && skip(r, u)) continue; const s = stateOf(EV[`${B.id}:${r}:${u}`] || [], t, r * 17 + u * 3 + (B === LOW ? 500 : 0)); flap(unitX(B, u), rowY(B, r), B.U, B.rh, s.A, s.B, s.p, t); }
}
function frameBox(B, label) {
  const x = B.x0 - 22, y = B.y0 - 64, w = B.units * B.U + (B.units - 1) * B.G + 44, h = B.rows * B.rh + (B.rows - 1) * B.rg + 86;
  cv.save(); cv.shadowColor = 'rgba(0,0,0,0.6)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; const g = cv.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#34333A'); g.addColorStop(1, '#1E1D22'); rrect(x, y, w, h, 22, g); cv.restore();
  rrect(x + 3, y + 3, w - 6, h - 6, 20, null, 'rgba(255,255,255,0.07)', 2); rrect(B.x0 - 8, B.y0 - 8, w - 28, h - 70, 12, '#0C0B0E');
  [[x + 16, y + 16], [x + w - 16, y + 16], [x + 16, y + h - 16], [x + w - 16, y + h - 16]].forEach(([a, b]) => { circle(a, b, 6, '#55535C'); circle(a, b, 2.5, '#2A292F'); });
  txt(label, x + w - 40, y + 32, 30, YEL, { align: 'right', w: 800 });
  for (let i = 0; i < 3; i++) circle(x + 44 + i * 22, y + 32, 6, i === 0 ? rgba(GRN, 0.9) : '#3A3940');
}

// ---------- the wall, light, the frame ----------
let WALL;
function buildWall() {
  WALL = mkC(W, H); const g = WALL.getContext('2d'); let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#16151A'); gr.addColorStop(1, '#0C0B0E'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(255,255,255,${0.008 + 0.018 * rnd(k * 1.3)})`; g.fillRect(rnd(k * 2.1) * W, rnd(k * 3.7) * H, 2, 2); }
  gr = g.createRadialGradient(CX, 700, 100, CX, 760, 1100); gr.addColorStop(0, 'rgba(255,214,150,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(CX, 900, 500, CX, 900, 1300); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
// the real gold replay inside the lower board (a wider crop of k13's capture, 1440×900 coordinates)
const RRW = [330, 230, 860, 500], QPOS = [800, 340, 328, 284], A_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'];
function screen(t) {
  const k = cub(k01(t, T.lab + 0.12, 0.25)) * (1 - cub(k01(t, T.cta - 0.12, 0.15))); if (k <= 0) return;
  const bh = LOW.rows * LOW.rh + (LOW.rows - 1) * LOW.rg, h = bh, w = (h * RRW[2]) / RRW[3], x = CX - w / 2, y = LOW.y0, key = t < ws(77) - 0.04 ? A_KEYS[Math.min(5, Math.floor(cl((t - T.lab) / (ws(77) - 0.04 - T.lab)) * 6))] : 'cp';
  cv.save(); cv.globalAlpha = k; rrect(x - 8, y - 8, w + 16, h + 16, 14, '#050507'); const im = IMG[key];
  if (im) { const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 8); cv.clip(); cv.drawImage(im, RRW[0] * s, RRW[1] * s, RRW[2] * s, RRW[3] * s, x, y, w, h); cv.restore(); }
  if (key === 'cp') { const kr = cub(k01(t, ws(77), 0.3)), s = w / RRW[2], m = 10 * (1 - kr) + 6; cv.save(); cv.globalAlpha *= kr; cv.strokeStyle = LIME; cv.lineWidth = 6; cv.shadowColor = rgba(LIME, 0.8); cv.shadowBlur = 16; cv.beginPath(); cv.roundRect(x + (QPOS[0] - RRW[0]) * s - m, y + (QPOS[1] - RRW[1]) * s - m, QPOS[2] * s + 2 * m, QPOS[3] * s + 2 * m, 12); cv.stroke(); cv.restore(); }
  if (IMG.icon) cv.drawImage(IMG.icon, x + w - 90, y + 14, 76, 76);
  txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', CX, y + h + 46, 26, TXT, { w: 700, alpha: 0.7 });
  cv.restore();
}
function endLogo(t) { const k = pop(t - T.end - 0.35, 12, 0.6); if (k <= 0 || !IMG.icon) return; const s = 230 * cl(k, 0, 1.15); cv.save(); cv.globalAlpha = cl(k); cv.shadowColor = 'rgba(108,71,255,0.7)'; cv.shadowBlur = 50; cv.drawImage(IMG.icon, CX - s / 2, LOW.y0 + 234 - s / 2, s, s); cv.restore(); }
const PUNCH = () => [ws(9), ws(18), ws(52), ws(59), ws(65), ws(69) + 0.55, ws(80)];
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.drawImage(WALL, 0, 0);
  const z = 1 + 0.025 * cl(t / DUR) + PUNCH().reduce((a, p) => a + 0.012 * pulse(t, p - 0.02, 0.3), 0);
  cv.save(); cv.translate(CX, 860); cv.scale(z, z); cv.translate(-CX, -860);
  frameBox(TOP, 'تابلوی استراتژی'); frameBox(LOW, 'جواب‌ها');
  drawBoard(TOP, t);
  const big = bigOn(t), sc = t > T.lab && t < T.cta;
  drawBoard(LOW, t, big ? (r, u) => (r === 1 || r === 2) && u >= 2 && u <= 5 : null);
  if (big) ['tens', 'ones'].forEach((k) => { const R = BIGRECT(k), s = stateOf(BIG[k], t, k === 'tens' ? 901 : 907); flap(R.x, R.y, R.w, R.h, s.A && { text: s.A, cx: R.x + R.w / 2, size: 200, col: YEL }, s.B && { text: s.B, cx: R.x + R.w / 2, size: 200, col: YEL }, s.p, t, true); });
  if (sc) screen(t);
  endLogo(t);
  // a slow sweep of light across the boards
  const sx = ((t * 0.18) % 1.6 - 0.3) * W; const g = cv.createLinearGradient(sx - 160, 0, sx + 160, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cv.fillStyle = g; cv.fillRect(0, 180, W, 1260);
  cv.restore();
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(255,255,255,0.08)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = YEL; cv.fillRect(W * (1 - k), 0, W * k, 8); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
// the cover: the hook's question all lit, the status landed on «ترس؟»
window.cover = () => frame(ws(9) + 0.5, { cover: true });
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  buildWall(); build(); buildBig();
  // every flip, for the soundtrack: [time, board (T, L or B for the big digits)]
  const clicks = []; const add = (list, b) => list.forEach((e, i) => { const flips = e.n + 1; for (let k = 0; k < flips; k++) { const tt = e.t - (flips - k) * FL + FL; if (e.t > 0 && tt > 0 && tt < DUR) clicks.push([+tt.toFixed(3), b]); } });
  Object.entries(EV).forEach(([k, list]) => add(list, k[0])); add(BIG.tens, 'B'); add(BIG.ones, 'B');
  window.CLICKS = clicks.sort((a, b) => a[0] - b[0]);
  window.seek(0); window.ready = true;
});
