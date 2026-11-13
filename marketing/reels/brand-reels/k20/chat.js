// k20 · «به استراتژیت اعتماد داری یا از بررسی کردنش می‌ترسی؟», a DM chat, on k16's cut of the user's voice.
// The reel is an Instagram-style direct-message thread with «بک‌تست‌لب» in dark mode. The voice is the coach's messages:
// each sentence arrives as a bubble (after a typing indicator), its words lighting up as they are said. The viewer
// types back in the composer and sends («راستش… یه کم می‌ترسم 😬», «و اگه کلاً بررسیش نکنم؟», «رفتم ببینم 🔥»).
//   - the thread opens on the profile header and the hook's two messages (readable on the first frame);
//   - «سه تا جواب داره» → a poll card whose rows fill green, amber and red as each answer is said; then a «ندونستن» row
//     slides in, is struck through, and a «بهتره!» stamp lands;
//   - «۵۰ تا معامله» → a «چالش این هفته» card whose 50 squares fill;
//   - «توی بک‌تست‌لب تست کن» → a link preview with the real gold replay (k13's screens), the planned sell ringed;
//   - «شروعش رایگانه؛ لینکش توی بیوئه» → a heart reaction, the viewer's reply, and a profile card to end.
// 1080×1920, every frame a pure function of t (window.seek).
const W = 1080, H = 1920, CX = 540;
const COACH = '#2A2342', VIO = '#7C5CFF', PINK = '#C04CFD', LIME = '#C6F24E', GRN = '#2BD67B', RED = '#FF4D6A', AMB = '#FFB020', WHITE = '#FFFFFF', INK = '#17112A', MUTE = '#9C95B8';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- helpers ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3), back = (x) => { x = cl(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const FONT = (s, w = 700) => `${w} ${s}px Vazirmatn, "Noto Color Emoji"`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) { cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha; cv.font = FONT(size, o.w ?? 700); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl'); cv.fillText(s, x, y); cv.restore(); }
function measure(s, size, w = 700) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, r); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function stroke(pts, col, lw) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.stroke(); cv.restore(); }
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
function shadowed(fn, blur = 40, dy = 14, a = 0.35) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
function chip(s, x, y, size, fg, bg) { const w = measure(s, size, 800) + size * 1.1, h = size * 1.75; rr(x - w / 2, y - h / 2, w, h, h / 2, bg); txt(s, x, y + size * 0.04, size, fg, { w: 800 }); return w; }
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
const said = (wi, t) => wi === undefined || t >= ws(wi) - 0.04;

// ---------- words in a bubble: wrapped right to left, each lighting up when said ----------
function wrap(toks, size, maxW, wgt = 700) {
  const gap = measure(' ', size, wgt) * 1.25, lines = [[]]; let lw = 0;
  toks.forEach(([s, wi, c]) => { const w = measure(s, size, wgt); if (lw + w > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ s, wi: Array.isArray(wi) ? wi[0] : wi, c, w }); lw += w + gap; });
  const widths = lines.map((l) => l.reduce((a, b) => a + b.w, 0) + gap * (l.length - 1));
  return { lines, widths, w: Math.max(...widths), gap, size, wgt };
}
/** Draws wrapped words with their right edge at xr, first line's centre at y. */
function words(L, xr, y, lh, t, cols) {
  L.lines.forEach((ln, i) => { let x = xr; ln.forEach((it) => { const lit = said(it.wi, t), k = it.wi === undefined ? 1 : pop(t - ws(it.wi) + 0.04, 20, 0.6);
    const col = lit ? it.c ?? cols.on : cols.off; cv.save(); cv.translate(x - it.w / 2, y + i * lh); const s = lit && it.wi !== undefined ? lerp(0.9, 1, cl(k, 0, 1.2)) : 1; cv.scale(s, s);
    txt(it.s, 0, 0, L.size, col, { w: it.c && lit ? 800 : L.wgt }); cv.restore(); x -= it.w + L.gap; }); });
}

// ---------- the thread ----------
const TOP = 226, BOT = 1452, GAPM = 22, XL = 40, XR = 1040, FS = 54, LH = 76, PX = 38, PY = 26, MAXW = 760;
const MSG = [];
const coach = (toks, wi0, o = {}) => { const L = wrap(toks, FS, MAXW); MSG.push({ kind: 'coach', L, t: o.t ?? ws(wi0) - 0.4, show: o.t ?? ws(wi0) - 0.06, w: L.w + 2 * PX, h: L.lines.length * LH + 2 * PY - 10 }); };
const meMsg = (text, tType, tSend) => { const L = wrap([[text]], FS, MAXW); MSG.push({ kind: 'me', text, L, t: tSend, tType, w: L.w + 2 * PX, h: L.lines.length * LH + 2 * PY - 10 }); };
const cardMsg = (kind, t, h, o = {}) => MSG.push({ kind, t, w: 940, h, ...o });
function build() {
  cardMsg('intro', -3, 560);
  cardMsg('date', -2, 64);
  coach([['به', 0], ['استراتژیت', 1], ['اعتماد', 2, GRN], ['داری،', 3]], 0, { t: -1 });
  coach([['یا', 4], ['از', 5], ['بررسی', 6], ['کردنش', 7], ['می‌ترسی؟', 8, RED]], 4, { t: -1 });
  meMsg('راستش… یه کم می‌ترسم 😬', 3.22, 3.62);
  coach([['بیا', 10], ['ببینیم', 11], ['از', 12], ['چی', 13], ['می‌ترسی', 14, RED], ['🤔', 15]], 10);
  coach([['بررسیش', 16], ['فقط', 17], ['۳', 18, LIME], ['تا', 19], ['جواب', 20, LIME], ['داره', 21], ['👇', 21]], 16);
  cardMsg('poll', ws(20) - 0.05, 790, { grow: [ws(64) - 0.08, 150] });
  meMsg('و اگه کلاً بررسیش نکنم؟', 16.42, 16.8);
  coach([['هر', 60], ['سه', 61, LIME], ['تاش', 62], ['از', 63], ['ندونستن', 64, MUTE], ['بهتره.', 65, LIME]], 60);
  coach([['این', 66], ['هفته', 67], ['فقط', 68], ['۵۰', 69, LIME], ['تا', 70], ['معامله‌ی', 71], ['گذشته‌شو', 72], ['…', 73]], 66);
  cardMsg('challenge', ws(69) - 0.02, 420);
  coach([['توی', 74], ['بک‌تست‌لب', 75, '#B9A6FF'], ['تست', 77, LIME], ['کن.', 78]], 74);
  cardMsg('link', ws(75) + 0.12, 700);
  coach([['شروعش', 79], ['رایگانه؛', 80, LIME], ['لینکش', 81], ['توی', 82], ['بیوئه', 83], ['👇', 83]], 79);
  meMsg('رفتم ببینم 🔥', T.end - 0.15, T.end + 0.22);
}
const hAt = (m, t) => m.h + (m.grow ? m.grow[1] * cub(k01(t, m.grow[0], 0.35)) : 0);
const enterK = (m, t) => cub(k01(t, m.t, 0.36));
/** Where each message sits at t: the thread is anchored at the bottom and scrolls as new ones come. */
function layout(t) {
  const out = []; let y = BOT;
  for (let i = MSG.length - 1; i >= 0; i--) { const m = MSG[i]; if (t < m.t) continue; const h = hAt(m, t), k = enterK(m, t); out.push({ m, y: y - h, h, k }); y -= (h + GAPM) * k; }
  return out;
}

// ---------- each kind of message ----------
function typingDots(x, y, t) { rr(x, y, 150, 86, 40, COACH); for (let i = 0; i < 3; i++) circle(x + 44 + i * 31, y + 43 - Math.max(0, Math.sin(t * 9 - i * 0.9)) * 10, 9, rgba(WHITE, 0.6)); }
function drawCoach(m, x, y, t) {
  if (t < m.show) { typingDots(x, y + m.h - 86, t); return; }
  const k = cub(k01(t, m.show, 0.2)), w = lerp(150, m.w, k), h = lerp(86, m.h, k), yy = y + m.h - h;
  cv.save(); cv.beginPath(); cv.roundRect(x, yy, w, h, [40, 40, 40, 12]); cv.fillStyle = COACH; cv.fill(); cv.strokeStyle = 'rgba(255,255,255,0.06)'; cv.lineWidth = 2; cv.stroke(); cv.restore();
  if (k > 0.6) { cv.save(); cv.globalAlpha *= cl((k - 0.6) / 0.4); words(m.L, x + m.w - PX, y + PY + LH / 2 - 8, LH, t, { on: WHITE, off: 'rgba(255,255,255,0.5)' }); cv.restore(); }
}
function drawMe(m, x, y, t) {
  const g = cv.createLinearGradient(x, y, x + m.w, y + m.h); g.addColorStop(0, VIO); g.addColorStop(1, PINK);
  cv.beginPath(); cv.roundRect(x, y, m.w, m.h, [40, 40, 12, 40]); cv.fillStyle = g; cv.fill();
  words(m.L, x + m.w - PX, y + PY + LH / 2 - 8, LH, t, { on: WHITE, off: WHITE });
}
function drawIntro(m, x, y, t) {
  const cx = CX; if (IMG.icon) { shadowed(() => { cv.save(); cv.beginPath(); cv.arc(cx, y + 130, 120, 0, Math.PI * 2); cv.clip(); cv.drawImage(IMG.icon, cx - 120, y + 10, 240, 240); cv.restore(); }, 40, 14, 0.4); }
  circle(cx, y + 130, 128, null, 'rgba(255,255,255,0.15)', 4);
  txt('بک‌تست‌لب', cx, y + 310, 56, WHITE, { w: 800 }); txt('backtestlab_ir · بک‌تست روی بازار واقعی', cx, y + 372, 32, MUTE, { w: 600 });
  rr(cx - 190, y + 420, 380, 84, 24, 'rgba(255,255,255,0.1)'); txt('مشاهده‌ی پروفایل', cx, y + 464, 36, WHITE, { w: 700 });
}
function drawDate(m, x, y) { txt('امروز', CX, y + 32, 30, MUTE, { w: 600 }); }
// the poll: three answers, filling as each is said; then «ندونستن», struck, and a stamp
const ROWS = [
  { col: GRN, t: () => ws(23), title: [['یا', 22], ['کار', 23], ['می‌کنه', 24]], sub: [['پس', 26], ['با', 27], ['خیال', 28], ['راحت', 29], ['ادامه', 30], ['می‌دی', 31]] },
  { col: AMB, t: () => ws(34), title: [['یا', 33], ['کار', 34], ['می‌کنه', 35], ['ولی', 37], ['با', 38], ['ریسک', 39], ['کمتر', 40]], sub: [['پس', 42], ['فقط', 43], ['حجمتو', 44], ['درست', 45], ['می‌کنی', 46]] },
  { col: RED, t: () => ws(49), title: [['یا', 48], ['کار', 49], ['نمی‌کنه', 50]], sub: [['پس', 52], ['قبل', 53], ['از', 54], ['اینکه', 55], ['پولتو', 57], ['بگیره،', 58], ['فهمیدی', 59]] },
];
let ROWL;
function icon(i, x, y, r, col, t) {
  circle(x, y, r, WHITE);
  if (i === 0) stroke([[x - r * 0.42, y + r * 0.02], [x - r * 0.12, y + r * 0.32], [x + r * 0.45, y - r * 0.32]], col, r * 0.22);
  else if (i === 1) { const a = lerp(-Math.PI * 0.2, -Math.PI * 1.15, cub(k01(t, ws(40) - 0.05, 0.4))); stroke([[x, y], [x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62]], col, r * 0.2); circle(x, y, r * 0.14, col); }
  else if (i === 2) { stroke([[x - r * 0.35, y - r * 0.35], [x + r * 0.35, y + r * 0.35]], col, r * 0.22); stroke([[x + r * 0.35, y - r * 0.35], [x - r * 0.35, y + r * 0.35]], col, r * 0.22); }
  else txt('؟', x, y + 4, r * 1.2, col, { w: 900 });
}
function drawPoll(m, x, y, t) {
  const w = m.w, h = hAt(m, t);
  shadowed(() => rr(x, y, w, h, 40, WHITE), 50, 18, 0.45);
  txt('۳ جواب ممکن', x + w - 40, y + 66, 46, INK, { align: 'right', w: 900 }); chip('بررسی استراتژی', x + 170, y + 66, 28, VIO, '#EEE9FF');
  ROWS.forEach((R, i) => { const ry = y + 128 + i * 212, rx = x + 26, rw = w - 52, rh = 196, f = cub(k01(t, R.t(), 0.55));
    rr(rx, ry, rw, rh, 34, '#F2EFF8');
    if (f > 0) { cv.save(); cv.beginPath(); cv.roundRect(rx, ry, rw, rh, 34); cv.clip(); rr(rx + rw * (1 - f), ry, rw * f, rh, 0, R.col); cv.restore(); }
    const lit = f > 0.55, ix = rx + rw - 66, iy = ry + rh / 2;
    if (f > 0.05) { const kk = pop(t - R.t() - 0.05, 14, 0.55); cv.save(); cv.translate(ix, iy); cv.scale(cl(kk, 0, 1.2), cl(kk, 0, 1.2)); icon(i, 0, 0, 42, R.col, t); cv.restore(); } else { circle(ix, iy, 42, '#E2DDEE'); txt(fa(i + 1), ix, iy + 4, 44, '#8A82A6', { w: 800 }); }
    const cols = { on: lit ? WHITE : INK, off: lit ? 'rgba(255,255,255,0.55)' : 'rgba(23,17,42,0.28)' };
    words(ROWL[i].a, ix - 70, ry + 64, 60, t, cols); words(ROWL[i].b, ix - 70, ry + 136, 52, t, { on: lit ? 'rgba(255,255,255,0.95)' : '#4A4266', off: cols.off });
  });
  // «ندونستن»: a fourth row slides in, is struck through, and a stamp lands
  const kg = cub(k01(t, m.grow[0], 0.35)); if (kg > 0) { const ry = y + 128 + 3 * 212, rx = x + 26, rw = w - 52, rh = 132; cv.save(); cv.globalAlpha *= kg;
    rr(rx, ry, rw, rh, 30, '#E9E5F1'); circle(rx + rw - 66, ry + rh / 2, 38, '#D6D0E3'); txt('؟', rx + rw - 66, ry + rh / 2 + 4, 48, '#8A82A6', { w: 900 }); txt('ندونستن', rx + rw - 130, ry + rh / 2 + 2, 46, '#8A82A6', { align: 'right', w: 800 });
    const ks = cub(k01(t, ws(65) - 0.05, 0.25)); if (ks > 0) { const sw = measure('ندونستن', 46, 800) + 40; rr(rx + rw - 110 - sw, ry + rh / 2 - 5, sw * ks, 10, 5, RED); }
    cv.restore(); }
  const kst = pop(t - ws(65) - 0.05, 12, 0.5); if (kst > 0) { cv.save(); cv.translate(x + 175, y + 128 + 2 * 212 + 98); cv.rotate(-0.2); cv.scale(lerp(1.5, 0.78, cl(kst)), lerp(1.5, 0.78, cl(kst))); cv.globalAlpha *= cl(kst * 2);
    rr(-170, -64, 340, 128, 26, null, LIME, 10); rr(-150, -46, 300, 92, 18, rgba(LIME, 0.92)); txt('بهتره!', 0, 4, 60, INK, { w: 900 }); cv.restore(); }
}
function drawChallenge(m, x, y, t) {
  const w = m.w, h = m.h; shadowed(() => rr(x, y, w, h, 40, '#1E1734'), 40, 14, 0.4); rr(x, y, w, h, 40, null, rgba(LIME, 0.6), 3);
  txt('چالش این هفته', x + w - 40, y + 62, 40, LIME, { align: 'right', w: 800 });
  txt('۵۰', x + w - 40, y + 168, 120, WHITE, { align: 'right', w: 900 }); txt('معامله‌ی گذشته', x + w - 220, y + 180, 44, WHITE, { align: 'right', w: 700 });
  const n = Math.round(50 * cub(k01(t, ws(69), 1.0)));
  for (let i = 0; i < 50; i++) { const c = i % 10, r = Math.floor(i / 10), sx = x + w - 52 - c * 64, sy = y + 248 + r * 30; rr(sx - 26, sy - 11, 52, 22, 7, i < n ? (i % 3 ? VIO : '#9C84FF') : 'rgba(255,255,255,0.08)'); }
  chip(fa(n) + ' / ۵۰', x + 120, y + 70, 30, INK, LIME);
}
const RRW = [330, 230, 860, 500], QPOS = [800, 340, 328, 284], A_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'];
function drawLink(m, x, y, t) {
  const w = m.w, ih = (w * RRW[3]) / RRW[2], key = t < ws(77) - 0.04 ? A_KEYS[Math.min(5, Math.floor(cl((t - m.t) / (ws(77) - 0.04 - m.t)) * 6))] : 'cp';
  shadowed(() => rr(x, y, w, m.h, 40, COACH), 40, 14, 0.4);
  const im = IMG[key]; if (im) { const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, ih, [40, 40, 0, 0]); cv.clip(); cv.drawImage(im, RRW[0] * s, RRW[1] * s, RRW[2] * s, RRW[3] * s, x, y, w, ih); cv.restore(); }
  if (key === 'cp') { const kr = cub(k01(t, ws(77), 0.3)), s = w / RRW[2], mm = 10 * (1 - kr) + 6; cv.save(); cv.globalAlpha *= kr; cv.strokeStyle = LIME; cv.lineWidth = 6; cv.shadowColor = rgba(LIME, 0.8); cv.shadowBlur = 16; cv.beginPath(); cv.roundRect(x + (QPOS[0] - RRW[0]) * s - mm, y + (QPOS[1] - RRW[1]) * s - mm, QPOS[2] * s + 2 * mm, QPOS[3] * s + 2 * mm, 12); cv.stroke(); cv.restore(); }
  if (IMG.icon) { cv.save(); cv.beginPath(); cv.arc(x + w - 70, y + ih + 82, 40, 0, Math.PI * 2); cv.clip(); cv.drawImage(IMG.icon, x + w - 110, y + ih + 42, 80, 80); cv.restore(); }
  txt('بک‌تست‌لب', x + w - 128, y + ih + 62, 44, WHITE, { align: 'right', w: 800 }); txt('بک‌تست روی بازار واقعیِ گذشته · بازپخش طلا', x + w - 128, y + ih + 112, 30, MUTE, { align: 'right', w: 600 });
  chip('لینک توی بیو', x + 130, y + ih + 86, 30, INK, LIME);
}
function heart(t) { const k = pop(t - T.end + 0.02, 12, 0.5); return k; }
function drawThread(t) {
  cv.save(); cv.beginPath(); cv.rect(0, TOP - 20, W, BOT - TOP + 40); cv.clip();
  layout(t).forEach(({ m, y, h, k }) => {
    if (y + h < TOP - 40) return; const fade = cl((y + h - TOP + 20) / 140);
    const x = m.kind === 'me' ? XR - m.w : m.kind === 'coach' ? XL : CX - m.w / 2;
    cv.save(); cv.globalAlpha *= fade * (m.kind === 'me' ? cl(k * 3) : cl(k * 2));
    const ox = m.kind === 'me' ? x + m.w : x, oy = y + h, s = lerp(m.kind === 'me' ? 0.9 : 0.86, 1, back(k)); cv.translate(ox, oy + (m.kind === 'me' ? (1 - k) * 60 : 0)); cv.scale(s, s); cv.translate(-ox, -oy);
    if (m.kind === 'coach') drawCoach(m, x, y, t); else if (m.kind === 'me') drawMe(m, x, y, t); else if (m.kind === 'intro') drawIntro(m, x, y, t); else if (m.kind === 'date') drawDate(m, x, y);
    else if (m.kind === 'poll') drawPoll(m, x, y, t); else if (m.kind === 'challenge') drawChallenge(m, x, y, t); else if (m.kind === 'link') drawLink(m, x, y, t);
    // a heart on the last coach message
    if (m === MSG[MSG.length - 2]) { const kh = heart(t); if (kh > 0) { cv.save(); cv.translate(x + m.w - 20, y + h + 6); cv.scale(cl(kh, 0, 1.3), cl(kh, 0, 1.3)); circle(0, 0, 30, '#1C1630'); txt('❤️', 0, 3, 34, RED); cv.restore(); } }
    cv.restore();
  });
  cv.restore();
}

// ---------- the chrome: header, composer, background ----------
const typingNow = (t) => MSG.some((m) => m.kind === 'coach' && t >= m.t && t < m.show && m.t > 0);
function header(t) {
  cv.fillStyle = 'rgba(15,11,30,0.92)'; cv.fillRect(0, 0, W, 210); cv.fillStyle = 'rgba(255,255,255,0.07)'; cv.fillRect(0, 208, W, 2);
  stroke([[1012, 92], [1034, 116], [1012, 140]], WHITE, 7);
  if (IMG.icon) { cv.save(); cv.beginPath(); cv.arc(924, 116, 48, 0, Math.PI * 2); cv.clip(); cv.drawImage(IMG.icon, 876, 68, 96, 96); cv.restore(); }
  circle(958, 150, 12, '#0F0B1E'); circle(958, 150, 8, GRN);
  txt('بک‌تست‌لب', 852, 98, 46, WHITE, { align: 'right', w: 800 });
  const ty = typingNow(t); txt(ty ? 'در حال نوشتن…' : 'آنلاین', 852, 150, 30, ty ? LIME : MUTE, { align: 'right', w: 600 });
  // call and video
  cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 6; cv.lineJoin = 'round'; cv.beginPath(); cv.roundRect(56, 96, 64, 44, 10); cv.stroke(); cv.beginPath(); cv.moveTo(120, 112); cv.lineTo(144, 98); cv.lineTo(144, 138); cv.lineTo(120, 124); cv.stroke();
  cv.beginPath(); cv.arc(214, 118, 26, Math.PI * 0.75, Math.PI * 1.75); cv.stroke(); cv.restore();
}
function composer(t) {
  const y = 1484; rr(40, y, 1000, 100, 50, '#1E1830'); rr(40, y, 1000, 100, 50, null, 'rgba(255,255,255,0.06)', 2);
  circle(986, y + 50, 34, VIO); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = 5; cv.beginPath(); cv.roundRect(970, y + 36, 32, 26, 6); cv.stroke(); circle(986, y + 49, 6, null, WHITE, 4); cv.restore();
  const m = MSG.find((x) => x.kind === 'me' && t >= x.tType && t < x.t);
  if (m) { const n = Math.max(1, Math.round(m.text.length * cl((t - m.tType) / (m.t - m.tType - 0.06)))), s = m.text.slice(0, n);
    txt(s, 930, y + 52, 42, WHITE, { align: 'right', w: 600 }); const w = measure(s, 42, 600); if (Math.floor(t * 4) % 2 === 0) rr(930 - w - 10, y + 26, 4, 50, 2, LIME);
    const g = cv.createLinearGradient(70, 0, 150, 0); g.addColorStop(0, VIO); g.addColorStop(1, PINK); circle(108, y + 50, 38, g); stroke([[92, y + 50], [124, y + 50]], WHITE, 6); stroke([[110, y + 34], [126, y + 50], [110, y + 66]], WHITE, 6); }
  else { txt('پیام…', 930, y + 52, 40, 'rgba(255,255,255,0.35)', { align: 'right', w: 600 }); cv.save(); cv.strokeStyle = 'rgba(255,255,255,0.6)'; cv.lineWidth = 5; cv.beginPath(); cv.roundRect(96, y + 28, 24, 36, 12); cv.stroke(); cv.beginPath(); cv.arc(108, y + 54, 20, 0, Math.PI); cv.stroke(); cv.restore(); }
}
let PATTERN;
function buildPattern() {
  PATTERN = mkC(W, H); const g = PATTERN.getContext('2d'); g.globalAlpha = 0.05;
  for (let i = 0; i < 70; i++) { const x = rnd(i * 3.1) * W, y = rnd(i * 5.3) * H, up = rnd(i * 7.7) > 0.5, h = 40 + rnd(i) * 60; g.fillStyle = up ? GRN : RED; g.fillRect(x - 9, y - h / 2, 18, h); g.fillRect(x - 2, y - h / 2 - 16, 4, h + 32); }
  g.strokeStyle = WHITE; g.lineWidth = 4; for (let i = 0; i < 18; i++) { const x = rnd(i * 9.1) * W, y = rnd(i * 4.4) * H; g.beginPath(); g.moveTo(x, y); for (let k = 1; k < 6; k++) g.lineTo(x + k * 22, y - (rnd(i * 10 + k) - 0.4) * 40 * k * 0.4); g.stroke(); }
}
const SECTION = () => [[-9, VIO], [T.three, VIO], [ws(23), GRN], [ws(34), AMB], [ws(49), RED], [T.all, VIO], [T.week, LIME], [T.lab, VIO], [T.cta, PINK]];
function background(t) {
  let g = cv.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0F0B1E'); g.addColorStop(1, '#1A1238'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.drawImage(PATTERN, 0, 0);
  let col = VIO; SECTION().forEach(([t0, c]) => { if (t >= t0) col = c; });
  [[0.25, 0.3, 520, VIO], [0.8, 0.62, 600, col], [0.4, 0.85, 480, PINK]].forEach(([fx, fy, r, c], i) => { const x = fx * W + Math.sin(t * 0.3 + i * 2) * 90, y = fy * H + Math.cos(t * 0.25 + i) * 80;
    g = cv.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, 0.2)); g.addColorStop(1, rgba(c, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H); });
}
// the end: the profile card over the thread
function endCard(t) {
  const k = cub(k01(t, T.end + 0.55, 0.4)); if (k <= 0) return;
  cv.fillStyle = `rgba(8,6,16,${0.72 * k})`; cv.fillRect(0, 0, W, H);
  const y = lerp(1200, 520, k); cv.save(); cv.globalAlpha = k;
  shadowed(() => rr(90, y, 900, 760, 50, '#1E1734'), 60, 20, 0.5); rr(90, y, 900, 760, 50, null, 'rgba(255,255,255,0.08)', 2);
  if (IMG.icon) { cv.save(); cv.beginPath(); cv.arc(CX, y + 170, 110, 0, Math.PI * 2); cv.clip(); cv.drawImage(IMG.icon, CX - 110, y + 60, 220, 220); cv.restore(); }
  if (IMG.word) { const ww = 480, hh = (ww * IMG.word.height) / IMG.word.width; cv.drawImage(IMG.word, CX - ww / 2, y + 320, ww, hh); }
  chip('شروعش رایگانه', CX, y + 520, 52, INK, LIME);
  const g = cv.createLinearGradient(240, 0, 840, 0); g.addColorStop(0, VIO); g.addColorStop(1, PINK); rr(250, y + 600, 580, 110, 55, g); txt('لینک توی بیو 👆', CX, y + 656, 46, WHITE, { w: 800 });
  cv.restore();
}
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1;
  background(t); drawThread(t); header(t); composer(t); endCard(t);
  if (!o.cover) { const k = cl(t / T.end); cv.fillStyle = 'rgba(255,255,255,0.08)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = LIME; cv.fillRect(W * (1 - k), 0, W * k, 8); }
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
// the cover: the hook's two messages, all said
window.cover = () => frame(ws(9) + 0.3, { cover: true });
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await document.fonts.load('40px "Noto Color Emoji"', '😬🤔👇🔥❤️👆');
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  ROWL = ROWS.map((R) => ({ a: wrap(R.title, 44, 700, 800), b: wrap(R.sub, 37, 700, 600) }));
  buildPattern(); build(); window.seek(0); window.ready = true;
});
