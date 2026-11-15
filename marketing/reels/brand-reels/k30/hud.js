// k30 · «نکنه استراتژی سوددهت فقط توی ذهنت سوددهه؟» (dialog #2) in a dark HUD / tech look, on the user's take at its
// normal speed (k27's timeline). Inspired by a reference reel's principles only (a dark navy screen with a faint grid
// and small corner read-outs, a glowing signal line, particles that assemble into data, a scope, a flash before the
// brand, a mechanical flap board, a full-frame colour card); every element, word and step is BacktestLab's own:
//   a pulse line that turns into the profit line «in your head» → dots assembling into a sample chart → target brackets
//   locking onto the buy at the low and the sell at the high → a scan line at «اون موقع», the future lit, then lost to
//   static («آینده: نامعلوم») → a grid of placeholder strategies all turning «سودده» when the future is visible → a scope
//   whose sweep cannot see the future's half → a white flash and the BacktestLab icon → a flap board settling on the
//   replay's real date, ۲۵ فروردین ۱۴۰۴ → a glass card playing the real gold replay (k13's screens), the future curtained,
//   then buy and sell → a counter running to twenty → a full-frame violet card «ببین هنوز سودده هست یا نه» → the close.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], END = D.end, DUR = D.dur;
const VT = window.THEME === 'violet';   // python3 page.py violet → reel-violet/: the logo's violet in place of the blue
const BG = VT ? '#0C0720' : '#070D18', NAVY = VT ? '#1A1138' : '#0D1830', CYAN = VT ? '#A58BFF' : '#6FB6FF', VIO = VT ? '#7B5BFF' : '#8E6BFF', FUT = VT ? '#D8CCFF' : '#C9B8FF', FUT2 = VT ? '#D8CCFF' : '#B9A8FF',
  ACC_RGB = VT ? '165,139,255' : '111,182,255', BG_RGB = VT ? '12,7,32' : '7,13,24', TILE = VT ? '#1B1338' : '#111C33', LIME = '#C6F24E', GREEN = '#2FD67B', RED = '#FF5A6A', WHITE = '#FFFFFF', DIMW = 'rgba(255,255,255,0.45)';
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
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function line(x1, y1, x2, y2, col, lw, dash) { cv.save(); cv.beginPath(); if (dash) cv.setLineDash(dash); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn) { if (a <= 0) return; cv.save(); cv.translate(x, y); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function brackets(x, y, w, h, len, col, lw = 3) { [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => { line(px, py, px + len * sx, py, col, lw); line(px, py, px, py + len * sy, col, lw); }); }
function glowPath(pts, col, lw, glow = 26) { cv.save(); cv.shadowColor = col; cv.shadowBlur = glow; cv.beginPath(); pts.forEach(([x, y], i) => (i ? cv.lineTo(x, y) : cv.moveTo(x, y))); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineJoin = cv.lineCap = 'round'; cv.stroke(); cv.restore(); }

// ---------- the sample series: a dip, a rally to a top, then the future ----------
const SER = (() => { const o = []; let p = 50; for (let i = 0; i < 90; i++) { const d = i < 16 ? -1.0 : i < 38 ? 1.6 : i < 50 ? -1.1 : i < 66 ? 0.9 : -1.0; p += d + (rnd(i * 7) - 0.5) * 2.2; o.push(p); } return o; })();
const LOWI = SER.slice(0, 26).indexOf(Math.min(...SER.slice(0, 26))), HIGHI = 26 + SER.slice(26, 50).indexOf(Math.max(...SER.slice(26, 50))), NOWI = 52;
const BOX = { x: 90, y: 760, w: 900, h: 640 }, smin = Math.min(...SER) - 4, smax = Math.max(...SER) + 4;
const px = (i) => BOX.x + (i / (SER.length - 1)) * BOX.w, py = (v) => BOX.y + BOX.h - ((v - smin) / (smax - smin)) * BOX.h;

// ---------- the words: centred, blurring in word by word, an accent bar under the key word ----------
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
function wordsLine(ln, t, fade = 1) { const gap = ln.size * 0.28, items = ln.toks.map(([s, wi, st = {}]) => ({ s, st, w: measure(s, ln.size, 800), t0: ln.now ? -1 : ws(Array.isArray(wi) ? wi[0] : wi) - 0.07 })), total = items.reduce((a, k) => a + k.w, 0) + gap * (items.length - 1); let xr = CX + total / 2;
  items.forEach((k) => { const x = xr - k.w / 2; xr -= k.w + gap; const e = t - k.t0; if (e < 0 && !ln.ghost) return; const q = oCub(k01(e, 0, 0.35)), a = ln.ghost && e < 0 ? 0.22 : q;
    cv.save(); cv.globalAlpha *= a * fade; if (q < 1 && e >= 0) cv.filter = `blur(${((1 - q) * 10).toFixed(1)}px)`; txt(k.s, x, ln.y + (1 - q) * 18, ln.size, k.st.c ?? WHITE, { glow: k.st.c ? k.st.c + '88' : null }); cv.restore();
    if (k.st.bar && e > 0.1) { const g = oCub(k01(e, 0.15, 0.4)); line(x + k.w / 2, ln.y + ln.size * 0.62, x + k.w / 2 - k.w * g, ln.y + ln.size * 0.62, k.st.c ?? CYAN, 6); } }); }

// ---------- scenes ----------
function hook(t) { const k = oCub(k01(t, T(5) - 0.1, 0.8)), y0 = 1180; const pts = [];
  for (let i = 0; i <= 120; i++) { const u = i / 120, x = 60 + u * 960, beat = Math.exp(-(((u - ((t * 0.25) % 1)) * 9) ** 2)) * Math.sin((u - ((t * 0.25) % 1)) * 60) * 150, rise = (u ** 1.6) * 520; pts.push([x, y0 - lerp(beat, rise + Math.sin(u * 14) * 12, k)]); }
  glowPath(pts, k > 0.5 ? GREEN : CYAN, 5, 30); const tip = pts[pts.length - 1]; circle(tip[0], tip[1], 10 + 4 * Math.sin(t * 8), WHITE);
  if (k > 0.3) { cv.save(); cv.globalAlpha = k; txt('توی ذهنت', tip[0] - 20, tip[1] - 60, 34, GREEN, { align: 'right', glow: GREEN }); txt('NO TRADES BEHIND IT', 120, y0 + 120, 22, DIMW, { mono: true, align: 'left' }); cv.restore(); } }
function dotsChart(t, o = {}) { const g0 = o.t0 ?? T(8), n = SER.length, cut = o.cut ?? n;
  for (let i = 0; i < Math.min(n, cut); i++) { const k = io(k01(t, g0 + i * 0.006, 0.7)), sx = CX + (rnd(i * 3) - 0.5) * 1100, sy = 960 + (rnd(i * 5) - 0.5) * 1700, x = lerp(sx, px(i), k), y = lerp(sy, py(SER[i]), k); circle(x, y, 4, i >= NOWI && o.futDim ? `rgba(${ACC_RGB},0.35)` : CYAN); }
  const lk = k01(t, g0 + 0.9, 0.5); if (lk > 0) { const pts = []; const m = Math.floor(lk * Math.min(n, cut)); for (let i = 0; i < m; i++) pts.push([px(i), py(SER[i])]); if (pts.length > 1) glowPath(pts, CYAN, 3, 16); }
  txt('SAMPLE SERIES', BOX.x, BOX.y + BOX.h + 50, 22, DIMW, { mono: true, align: 'left' }); }
function lock(t, i, s, col, t0, up) { const k = oCub(k01(t, t0, 0.35)); if (k <= 0) return; const x = px(i), y = py(SER[i]), sz = lerp(220, 70, k); brackets(x - sz / 2, y - sz / 2, sz, sz, 18, col, 4); circle(x, y, 8, col);
  cv.save(); cv.globalAlpha = cl(k * 2); const ty = up ? y - 110 : y + 110; rr(x - 90, ty - 36, 180, 72, 10, `rgba(${BG_RGB},0.85)`, col, 2); txt(s, x, ty + 2, 38, col, { glow: col }); txt('LOCK', x + 70, ty - 52, 18, col, { mono: true }); cv.restore(); }
function hindsight(t) { dotsChart(t, { t0: -10 }); lock(t, LOWI, 'خرید', GREEN, T(18), false); lock(t, HIGHI, 'فروش', RED, T(21), true); }
function unknown(t) { const lost = t >= T(33); dotsChart(t, { t0: -10, cut: lost ? NOWI : SER.length }); lock(t, LOWI, 'خرید', GREEN, -10, false); lock(t, HIGHI, 'فروش', RED, -10, true);
  const xs = px(NOWI), sk = oCub(k01(t, T(26), 0.5)); line(xs, BOX.y - 40, xs, lerp(BOX.y - 40, BOX.y + BOX.h + 40, sk), LIME, 3); txt('اون موقع', xs, BOX.y - 70, 30, LIME, { glow: LIME });
  if (!lost) { cv.save(); cv.globalAlpha = 0.12 + 0.06 * Math.sin(t * 6); cv.fillStyle = LIME; cv.fillRect(xs, BOX.y - 20, BOX.x + BOX.w - xs, BOX.h + 40); cv.restore(); }
  else { const q = oCub(k01(t, T(33), 0.4)); cv.save(); cv.globalAlpha = q; for (let k = 0; k < 900; k++) { const x = xs + rnd(k * 3 + Math.floor(t * 24)) * (BOX.x + BOX.w - xs), y = BOX.y + rnd(k * 7 + Math.floor(t * 24) * 3) * BOX.h; cv.fillStyle = `rgba(${VT ? '200,185,255' : '160,190,230'},${0.15 + 0.5 * rnd(k * 11 + Math.floor(t * 24))})`; cv.fillRect(x, y, 3, 3); }
    rr(CX + 120, BOX.y + BOX.h / 2 - 50, 300, 100, 12, `rgba(${BG_RGB},0.9)`, VIO, 2); txt('آینده: نامعلوم', CX + 270, BOX.y + BOX.h / 2 + 2, 38, FUT); txt('SIGNAL LOST', CX + 270, BOX.y + BOX.h / 2 - 72, 20, VIO, { mono: true }); cv.restore(); } }
function grid(t) { const cols = 6, rows = 7, cs = 128, x0 = CX + ((cols - 1) * cs) / 2, y0 = 760; let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c, on = t >= T(43) + i * 0.03, k = oCub(k01(t, T(41) + i * 0.012, 0.3)); if (k <= 0) continue; if (on) n++; const x = x0 - c * cs, y = y0 + r * cs;
    at(x, y, k, 1, () => { rr(-46, -46, 92, 92, 14, on ? 'rgba(47,214,123,0.18)' : 'rgba(255,255,255,0.04)', on ? GREEN : 'rgba(255,255,255,0.18)', 2); if (on) { cv.strokeStyle = GREEN; cv.lineWidth = 6; cv.lineCap = cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-16, 2); cv.lineTo(-4, 14); cv.lineTo(18, -12); cv.stroke(); } }); }
  txt(`${fa(n)} از ${fa(cols * rows)} سودده`, CX, y0 + rows * cs + 40, 54, n ? GREEN : DIMW, { glow: n ? GREEN : null }); txt('PLACEHOLDER STRATEGIES  /  FUTURE VISIBLE', CX, y0 + rows * cs + 110, 20, DIMW, { mono: true }); }
function scope(t) { const cx = CX, cy = 1180, R = 330, k = oCub(k01(t, T(47), 0.5)); if (k <= 0) return; cv.save(); cv.globalAlpha = k;
  [1, 0.66, 0.33].forEach((f) => { cv.beginPath(); cv.arc(cx, cy, R * f, 0, Math.PI * 2); cv.strokeStyle = `rgba(${ACC_RGB},0.25)`; cv.lineWidth = 2; cv.stroke(); }); line(cx - R, cy, cx + R, cy, `rgba(${ACC_RGB},0.2)`, 2); line(cx, cy - R, cx, cy + R, `rgba(${ACC_RGB},0.2)`, 2);
  const blind = oCub(k01(t, T(51), 0.4)); cv.beginPath(); cv.moveTo(cx, cy); cv.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); cv.closePath(); cv.fillStyle = `rgba(${VT ? '8,4,20' : '4,7,14'},${0.92 * blind})`; cv.fill(); if (blind > 0.5) txt('؟', cx + R * 0.5, cy, 120, VIO, { glow: VIO });
  const a = (t * 2.2) % (Math.PI * 2), inFuture = Math.cos(a) > 0 && blind > 0.5; if (!inFuture) { const g = cv.createConicGradient(a - 0.6, cx, cy); g.addColorStop(0, `rgba(${ACC_RGB},0)`); g.addColorStop(0.1, `rgba(${ACC_RGB},0.35)`); g.addColorStop(0.101, `rgba(${ACC_RGB},0)`); cv.beginPath(); cv.moveTo(cx, cy); cv.arc(cx, cy, R, a - 0.6, a); cv.closePath(); cv.fillStyle = g; cv.fill(); line(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, CYAN, 3); }
  txt('گذشته', cx - R * 0.5, cy + R + 50, 34, CYAN); txt('آینده', cx + R * 0.5, cy + R + 50, 34, FUT2); cv.restore(); }
function reveal(t) { const fl = k01(t, T(54) - 0.05, 0.12) * (1 - k01(t, T(54) + 0.1, 0.35)); const k = oBack(k01(t, T(54) + 0.05, 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 80 * k; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 1180 - s / 2, s, s); cv.restore(); } if (fl > 0) { cv.fillStyle = `rgba(${VT ? '242,236,255' : '235,240,255'},${fl})`; cv.fillRect(0, 0, W, H); } }
// the flap board flips whole words (a letter per tile would break the Persian joins and the digits' order)
const FLAP = [['۲۵', ['۰۷', '۱۳', '۰۲', '۳۰', '۱۸', '۰۹', '۲۲']], ['فروردین', ['مهر', 'آبان', 'دی', 'اسفند', 'تیر', 'بهمن', 'آذر']], ['۱۴۰۴', ['۱۴۰۱', '۱۳۹۹', '۱۴۰۲', '۱۴۰۰', '۱۴۰۳']]];
function flap(t) { const ws_ = [170, 380, 260], gap = 24, total = ws_.reduce((a, b) => a + b, 0) + gap * 2, y = 1180; let xr = CX + total / 2;
  FLAP.forEach(([final, pool], i) => { const w = ws_[i], x = xr - w / 2; xr -= w + gap; const settle = T(60) + 0.18 * i, done = t >= settle, ph = (t * 9 + i * 3) % 1;
    rr(x - w / 2, y - 80, w, 160, 12, TILE, 'rgba(255,255,255,0.1)', 2); const s = done ? final : pool[Math.floor(t * 9 + i * 3) % pool.length];
    cv.save(); cv.beginPath(); cv.rect(x - w / 2, y - 80, w, 160); cv.clip(); const sq = done ? 1 : Math.abs(Math.cos(ph * Math.PI)); cv.translate(x, y); cv.scale(1, Math.max(0.15, sq)); txt(s, 0, 6, 92, done ? WHITE : 'rgba(255,255,255,0.6)', { w: 900 }); cv.restore();
    line(x - w / 2, y, x + w / 2, y, 'rgba(0,0,0,0.65)', 3); });
  txt('GO TO DATE', CX, y - 140, 22, DIMW, { mono: true }); }
const SCR = [20, 140, 1540, 1000];
function glassReplay(t) { const w = 940, h = (w * SCR[3]) / SCR[2], x = CX - w / 2, y = 860, k = oCub(k01(t, T(64), 0.45)); if (k <= 0) return; cv.save(); cv.globalAlpha = k;
  rr(x - 18, y - 18, w + 36, h + 36, 26, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.18)', 2); const keys = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), f = cl((t - T(66)) / (T(76) - T(66))), im = IMG[keys[Math.min(15, Math.floor(f * 16))]];
  if (im) { cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 14); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, y, w, h); const cu = oCub(k01(t, T(74), 0.4)); if (cu > 0) { cv.globalAlpha *= cu; const g = cv.createLinearGradient(x + w * 0.6, 0, x + w * 0.86, 0); g.addColorStop(0, `rgba(${BG_RGB},0)`); g.addColorStop(0.35, `rgba(${BG_RGB},0.97)`); cv.fillStyle = g; cv.fillRect(x + w * 0.6, y, w * 0.4, h); txt('آینده', x + w * 0.83, y + h / 2, 44, FUT); } cv.restore(); }
  brackets(x - 30, y - 30, w + 60, h + 60, 30, CYAN, 3); txt('REPLAY  25.01.1404', x, y - 56, 22, CYAN, { mono: true, align: 'left' }); txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', CX, y + h + 70, 32, DIMW, { w: 600 });
  rr(x, y + h + 120, w, 6, 3, 'rgba(255,255,255,0.12)'); rr(x, y + h + 120, w * f, 6, 3, CYAN);
  const b = oBack(k01(t, T(76), 0.35)); if (b > 0) { at(CX + 210, y + h + 240, b, 1, () => { rr(-170, -60, 340, 120, 18, 'rgba(47,214,123,0.16)', GREEN, 3); txt('خرید', 0, 4, 54, GREEN, { glow: GREEN }); }); at(CX - 210, y + h + 240, b, 1, () => { rr(-170, -60, 340, 120, 18, 'rgba(255,90,106,0.16)', RED, 3); txt('فروش', 0, 4, 54, RED, { glow: RED }); }); }
  cv.restore(); }
function counter(t) { const n = Math.floor(20 * oCub(k01(t, T(80), 1.3))), cy = 1180, R = 300; for (let i = 0; i < 20; i++) { const a = -Math.PI * 0.75 + (i / 19) * Math.PI * 1.5, on = i < n; line(CX + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40), CX + Math.cos(a) * R, cy + Math.sin(a) * R, on ? LIME : 'rgba(255,255,255,0.15)', on ? 10 : 6); }
  txt(fa(n, 2), CX, cy - 10, 200, WHITE, { mono: false, w: 900, glow: 'rgba(198,242,78,0.5)' }); txt('/ ۲۰ معامله', CX, cy + 130, 44, DIMW); txt('THIS WEEK', CX, cy - 190, 22, DIMW, { mono: true }); }
function card(t) { const k = io(k01(t, T(85) - 0.05, 0.45)); if (k <= 0) return; const y = lerp(H, 0, k); if (VT) { const g = cv.createLinearGradient(0, y, 0, y + H); g.addColorStop(0, '#9273FF'); g.addColorStop(1, '#5430E6'); cv.fillStyle = g; } else cv.fillStyle = VIO; cv.fillRect(0, y, W, H);
  cv.save(); cv.beginPath(); cv.rect(0, y, W, H); cv.clip(); [['ببین هنوز', T(85)], ['سودده هست', T(87)], ['یا نه.', T(89)]].forEach(([s, t0], i) => { const q = oCub(k01(t, t0, 0.35)); txt(s, CX, y + 820 + i * 170, 140, i === 1 ? '#FFFFFF' : 'rgba(255,255,255,0.72)', { w: 900, alpha: q }); }); txt('TEST IT  /  20 TRADES', CX, y + 1420, 24, 'rgba(255,255,255,0.7)', { mono: true }); cv.restore(); }
function close_(t) { const k = oBack(k01(t, T(91), 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 760 - s / 2, s, s); cv.restore(); }
  const q = oCub(k01(t, T(91) + 0.15, 0.4)); txt('شروعش رایگانه', CX, 1010, 110, WHITE, { w: 900, alpha: q, glow: 'rgba(142,107,255,0.6)' });
  const p = oBack(k01(t, T(93), 0.4)); if (p > 0) at(CX, 1200, p, 1, () => { rr(-280, -70, 560, 140, 70, 'rgba(198,242,78,0.12)', LIME, 3); txt('لینک توی بیو', 0, 4, 60, LIME, { glow: LIME }); }); brackets(CX - 360, 600, 720, 720, 40, `rgba(${ACC_RGB},0.5)`, 3); }
function endCard(t) { const k = oBack(k01(t, END, 0.45)); if (IMG.icon) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 820 - s / 2, s, s); cv.restore(); }
  if (IMG.word) { const q = oCub(k01(t, END + 0.2, 0.4)), ww = 460, hh = (ww * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = q; cv.drawImage(IMG.word, CX - ww / 2, 1010, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.45, 0.35)); cv.save(); cv.globalAlpha = f; rr(CX - 260, 1230, 520, 96, 48, 'rgba(198,242,78,0.12)', LIME, 2); txt('آینده رو نبین، تست کن', CX, 1280, 42, LIME); txt('شروعش رایگانه؛ لینک توی بیو', CX, 1400, 36, DIMW, { w: 700 }); cv.restore(); }

// the scenes and their words
const SC = [
  { t: 0, draw: hook, lines: [L(330, 96, [['نکنه', 0], ['استراتژی', 1], ['سوددهت', 2, { c: GREEN }]], { now: true, ghost: true }), L(470, 96, [['فقط', 3], ['توی', 4], ['ذهنت', 5, { c: CYAN, bar: true }], ['سوددهه؟', 6]], { now: true, ghost: true })] },
  { t: T(7), draw: (t) => dotsChart(t), lines: [L(400, 92, [['یه', 7], ['چارت', 8], ['گذشته', 9, { c: CYAN, bar: true }], ['رو', 10], ['باز', 11], ['کن.', 12]])] },
  { t: T(13), draw: hindsight, lines: [L(340, 86, [['ورودها', 13], ['چقدر', 14], ['واضحن،', [15, 16], { c: LIME, bar: true }], ['نه؟', 17]]), L(470, 66, [['اینجا', 18], ['می‌خریدم،', [19, 20], { c: GREEN }], ['اینجا', 21], ['می‌فروختم.', [22, 23], { c: RED }]])] },
  { t: T(24), draw: unknown, lines: [L(320, 62, [['ولی', 24], ['تو', 25], ['الان', 26, { c: LIME, bar: true }], ['می‌دونی', [27, 28]], ['بعدش', 29], ['چی', 30], ['شد.', 31]]), L(460, 84, [['اون', 32], ['موقع', 33], ['نمی‌دونستی.', [34, 35], { c: FUT, bar: true }]])] },
  { t: T(36), draw: grid, lines: [L(320, 66, [['روی', 36], ['چارتی', 37], ['که', 38], ['آینده‌ش', 39, { c: LIME }], ['پیداست،', 40]]), L(450, 66, [['هر', 41], ['استراتژی‌ای', 42], ['سودده', 43, { c: GREEN, bar: true }], ['به', 44], ['نظر', 45], ['میاد.', 46]])] },
  { t: T(47), draw: scope, lines: [L(340, 88, [['تست', 47], ['واقعی', 48], ['وقتیه', 49]]), L(480, 92, [['که', 50], ['آینده', 51, { c: FUT, bar: true }], ['رو', 52], ['نبینی.', 53]])] },
  { t: T(54) - 0.05, draw: reveal, lines: [L(1480, 110, [['بک‌تست‌لب', [54, 55], { c: VIO }]]), L(1630, 84, [['دقیقاً', 56], ['همینه.', 57]])] },
  { t: T(58), draw: flap, lines: [L(420, 92, [['می‌ری', 58], ['به', 59], ['یه', 60], ['روز', 61], ['از', 62], ['گذشته،', 63, { c: CYAN, bar: true }]])] },
  { t: T(64), draw: glassReplay, lines: [L(300, 70, [['بازار', 64], ['از', 65], ['همون‌جا', 66], ['جلو', 67], ['میاد،', 68]]), L(420, 66, [['و', 69], ['تو', 70], ['باید', 71], ['قبل', 72], ['از', 73], ['دیدن', 74], ['ادامه‌ش', 75, { c: FUT }]]), L(560, 92, [['تصمیم', 76, { c: LIME, bar: true }], ['بگیری.', 77]])] },
  { t: T(78), draw: counter, lines: [L(380, 84, [['این', 78], ['هفته', 79], ['۲۰', 80, { c: LIME, bar: true }], ['تا', 80], ['معامله', 81]]), L(510, 76, [['این‌طوری', 82], ['بگیر', 83]])] },
  { t: T(85) - 0.05, draw: (t) => { counter(t); card(t); }, lines: [] },
  { t: T(91), draw: close_, lines: [] },
  { t: END, draw: endCard, lines: [] },
];

// ---------- frame ----------
function hudFrame(t) { cv.fillStyle = BG; cv.fillRect(0, 0, W, H); const g = cv.createRadialGradient(CX, 1000, 100, CX, 1000, 1200); g.addColorStop(0, VT ? 'rgba(84,48,230,0.40)' : 'rgba(40,70,140,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.save(); cv.globalAlpha = 0.05; for (let x = 0; x <= W; x += 90) line(x, 0, x, H, WHITE, 1); for (let y = 0; y <= H; y += 90) line(0, y, W, y, WHITE, 1); cv.restore();
  brackets(36, 36, W - 72, H - 72, 46, 'rgba(255,255,255,0.35)', 3);
  const tc = (s) => String(Math.floor(s)).padStart(2, '0'); txt('BACKTESTLAB / REPLAY', 70, 90, 20, DIMW, { mono: true, align: 'left' }); txt(`00:${tc(t / 60)}:${tc(t % 60)}:${tc((t * 30) % 30)}`, W - 70, 90, 20, DIMW, { mono: true, align: 'right' });
  txt('SAMPLE DATA', 70, H - 86, 20, DIMW, { mono: true, align: 'left' }); txt('FUTURE: HIDDEN', W - 70, H - 86, 20, DIMW, { mono: true, align: 'right' }); }
function frame(t) {
  hudFrame(t); let k = 0; SC.forEach((s, i) => { if (t >= s.t) k = i; }); const s = SC[k], nx = SC[k + 1], fadeIn = oCub(k01(t, s.t, 0.3)), fadeOut = nx ? 1 - k01(t, nx.t - 0.15, 0.15) : 1;
  cv.save(); cv.globalAlpha = k === 0 ? fadeOut : Math.min(fadeIn, fadeOut); s.draw(t); cv.restore(); if (k === 10) { /* the card covers everything */ }
  s.lines.forEach((ln) => wordsLine(ln, t, k === 0 ? fadeOut : Math.min(fadeIn, fadeOut)));
  const pk = cl(t / END); cv.fillStyle = 'rgba(255,255,255,0.1)'; cv.fillRect(0, 0, W, 6); cv.fillStyle = CYAN; cv.fillRect(W * (1 - pk), 0, W * pk, 6);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(6) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  frame(0); window.ready = true;
});
