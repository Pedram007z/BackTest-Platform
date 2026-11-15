// k33: «قیمت سقف رو شکست… ولی این BOS نیست», k32's take (the user's voice at its normal speed) in k30's dark HUD look,
// in the logo's violet from the start (the user asked for the ground to match the logo). Every candle set is drawn by
// hand so each rule shows exactly; the HUD is BacktestLab's own (no other creator's footage, wording or look):
//   glowing candles printed by a scan line → target brackets locking onto the high candle and onto the break → HUD
//   alerts («BOS نیست», «استاپ خورد») → a reticle hunting the high («سقف بود؟») → a BOS CHECK panel with the rule's three
//   steps → the steps on a valid case, a wick-only invalid case and the downtrend, with a status strip ticking ✓ or ✗ →
//   a full-frame violet card «حرف منو قبول نکن؛ این قانون رو تست کن» → a flash into the icon → k30's flap board settling
//   on the replay's real date, ۲۵ فروردین ۱۴۰۴ → the real gold replay behind glass, a break marked before seeing what
//   came next, «معتبر یا نامعتبر؟» → a sample break log, every answer «؟» → the close.
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

// ---------- the drawn sample candles ----------
const K_ = (a) => a.map(([o, c, h, l]) => ({ o, c, h, l }));
const RISE = [[20, 24, 25, 19], [24, 23, 25.5, 22], [23, 28, 29, 22.5], [28, 27, 29, 26], [27, 32, 33, 26.5], [32, 31, 33.5, 30], [31, 36, 38, 30.5]];   // 6 is the high candle: high 38, low 30.5
const UPV = K_([...RISE, [36, 33, 36.5, 32], [33, 29, 33.5, 28], [29, 30, 31, 27.5], [30, 34, 35, 29.5], [34, 33, 35, 32], [33, 37, 37.6, 32.5], [37, 41, 42, 36.5], [41, 40, 42.5, 39], [40, 44, 45, 39.5]]);   // valid
const UPX = K_([...RISE, [36, 34, 36.5, 31.8], [34, 32, 34.5, 29.0], [32, 33, 33.8, 31.5], [33, 37, 37.8, 32.5], [37, 40, 41, 36.5], [40, 43, 44, 39.5], [43, 42, 44.5, 41]]);   // invalid: 8 only wicks below
const TRAP = [...UPX, ...K_([[42, 37, 42.5, 36.5], [37, 32, 37.5, 31], [32, 27, 32.5, 26]])];
const DNV = UPV.map((d) => ({ o: 64 - d.o, c: 64 - d.c, h: 64 - d.l, l: 64 - d.h }));   // mirrored: 6 is the low candle (high 33.5)
const NS = 17, BOX = { x: 110, y: 800, w: 860, h: 580 };
function mkG(S) { const lo = Math.min(...S.map((d) => d.l)) - 2.5, hi = Math.max(...S.map((d) => d.h)) + 2.5; return { X: (i) => BOX.x + ((i + 0.5) * BOX.w) / NS, Y: (v) => BOX.y + BOX.h - ((v - lo) / (hi - lo)) * BOX.h, bw: (BOX.w / NS) * 0.56 }; }
function candle(G, i, d, k, a = 1) { if (k <= 0) return; const x = G.X(i), col = d.c >= d.o ? GREEN : RED, q = oCub(k); cv.save(); cv.globalAlpha *= a * cl(k * 3); cv.shadowColor = col; cv.shadowBlur = 14;
  line(x, lerp(G.Y(d.o), G.Y(d.h), q), x, lerp(G.Y(d.o), G.Y(d.l), q), col, 3); const yo = G.Y(d.o), yc = lerp(yo, G.Y(d.c), q); rr(x - G.bw / 2, Math.min(yo, yc), G.bw, Math.max(5, Math.abs(yc - yo)), 3, col); cv.restore(); }
function candles(G, S, t, times) { S.forEach((d, i) => { if (times[i] != null) candle(G, i, d, k01(t, times[i], 0.28)); }); }
const seqT = (a, b, n) => Array.from({ length: n }, (_, i) => (n < 2 ? a : a + ((b - a) * i) / (n - 1)));
function level(G, v, i0, i1, col, k, dash = true, lw = 3) { if (k <= 0) return; const x0 = G.X(i0) - G.bw, x1 = lerp(x0, G.X(i1) + G.bw, oCub(k)); cv.save(); cv.shadowColor = col; cv.shadowBlur = dash ? 0 : 16; line(x0, G.Y(v), x1, G.Y(v), col, lw, dash ? [12, 10] : null); cv.restore(); }
// target brackets: they shrink from wide onto the candle
function lockOn(G, i, d, col, k) { if (k <= 0) return; const q = oCub(k), x = G.X(i), y0 = G.Y(d.h) - 14, y1 = G.Y(d.l) + 14, w = lerp(200, G.bw + 34, q), hh = lerp(y1 - y0 + 160, y1 - y0, q); cv.save(); cv.globalAlpha *= cl(k * 2); brackets(x - w / 2, (y0 + y1) / 2 - hh / 2, w, hh, 16, col, 4); cv.restore(); }
// a HUD label: a dark box with a coloured edge, the Persian label, and a small mono caption above it
function hudTag(t, t0, s, mono, x, y, col, mark, size = 30) { const k = oBack(k01(t, t0, 0.35)); if (k <= 0) return; at(x, y, k, cl(k * 2), () => { const w = measure(s, size, 800) + 44 + (mark ? 40 : 0), h = size * 1.9;
  cv.save(); cv.shadowColor = col; cv.shadowBlur = 16; rr(-w / 2, -h / 2, w, h, 10, `rgba(${BG_RGB},0.9)`, col, 2.5); cv.restore(); txt(s, mark ? -18 : 0, 2, size, col, { w: 800 });
  if (mark === 'ok') check(w / 2 - 30, 0, 9, col, 4); if (mark === 'no') cross(w / 2 - 30, 0, 8, col, 4); if (mono) txt(mono, -w / 2 + 4, -h / 2 - 16, 17, col, { mono: true, align: 'left', alpha: 0.85 }); }); }
function alertBox(t, t0, s, mono, x, y, col) { const k = k01(t, t0, 0.4); if (k <= 0) return; const jit = k < 0.5 ? (rnd(Math.floor(t * 60)) - 0.5) * 10 * (1 - k * 2) : 0; at(x + jit, y, lerp(1.4, 1, oCub(k)), cl(k * 3), () => { const w = measure(s, 70, 900) + 80;
  cv.save(); cv.shadowColor = col; cv.shadowBlur = 30; rr(-w / 2, -62, w, 124, 14, `rgba(${BG_RGB},0.88)`, col, 4); cv.restore(); txt(s, 0, 6, 70, col, { w: 900, glow: col }); txt(mono, -w / 2 + 6, -84, 20, col, { mono: true, align: 'left' }); }); }
// the status strip: the rule's three steps, each pending, passed or failed
function strip(t, steps) { steps.forEach(([s, ok, t0], i) => { const x = 820 - i * 280, y = 1460, on = t0 != null && t >= t0, col = !on ? 'rgba(255,255,255,0.25)' : ok ? GREEN : RED, q = on ? oBack(k01(t, t0, 0.35)) : 1;
  at(x, y, q, 1, () => { rr(-122, -40, 244, 80, 12, `rgba(${BG_RGB},0.85)`, col, 2.5); txt(`${fa(i + 1)} ${s}`, 20, 2, 30, on ? WHITE : DIMW, { w: 700 }); if (on && ok) check(-86, 0, 10, col, 5); else if (on) cross(-86, 0, 9, col, 5); else txt('…', -86, -4, 30, DIMW); });
  txt(`STEP ${i + 1}`, x + 122, y - 56, 16, col, { mono: true, align: 'right' }); }); }
// the scan line that prints the candles
function scan(t, t0, t1) { const k = k01(t, t0, t1 - t0); if (k <= 0 || k >= 1) return; const x = lerp(BOX.x, BOX.x + BOX.w, k); cv.save(); const g = cv.createLinearGradient(x - 80, 0, x, 0); g.addColorStop(0, `rgba(${ACC_RGB},0)`); g.addColorStop(1, `rgba(${ACC_RGB},0.25)`); cv.fillStyle = g; cv.fillRect(x - 80, BOX.y, 80, BOX.h); cv.restore(); line(x, BOX.y, x, BOX.y + BOX.h, CYAN, 2); }

// ---------- the words: centred, blurring in word by word, an accent and an underline on key words ----------
const L = (y, size, toks, o = {}) => ({ y, size, toks, ...o });
function wordsLine(ln, t, fade = 1) { let size = ln.size; const gapF = 0.28; let items = ln.toks.map(([s, wi, st = {}]) => ({ s, st, w: measure(s, size, 800), t0: ln.now ? -1 : ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, t1: ws(Array.isArray(wi) ? wi[0] : wi) - 0.07 }));
  let total = items.reduce((a, k) => a + k.w, 0) + size * gapF * (items.length - 1); if (total > 960) { const f = 960 / total; size *= f; items.forEach((k) => (k.w *= f)); total = 960; }
  const gap = size * gapF; let xr = CX + total / 2;
  items.forEach((k) => { const x = xr - k.w / 2; xr -= k.w + gap; const e = t - (ln.ghost ? k.t1 : k.t0); if (e < 0 && !ln.ghost) return; const q = oCub(k01(e, 0, 0.35)), a = ln.ghost && e < 0 ? 0.22 : ln.ghost ? lerp(0.22, 1, q) : q;
    cv.save(); cv.globalAlpha *= a * fade; if (!ln.ghost && q < 1 && e >= 0) cv.filter = `blur(${((1 - q) * 10).toFixed(1)}px)`; txt(k.s, x, ln.y + (ln.ghost ? 0 : (1 - q) * 18), size, k.st.c ?? WHITE, { glow: k.st.c ? k.st.c + '88' : null }); cv.restore();
    if (k.st.bar && e > 0.1) { const g = oCub(k01(e, 0.15, 0.4)); line(x + k.w / 2, ln.y + size * 0.62, x + k.w / 2 - k.w * g, ln.y + size * 0.62, k.st.c ?? CYAN, 6); } }); }

// ---------- scenes ----------
function hookS(t) { const G = mkG(UPX), times = UPX.map((_, i) => (i <= 6 ? -1 : i <= 10 ? 0.2 + (i - 7) * 0.28 : i === 11 ? T(3) : null)); scan(t, 0.1, 1.4);
  level(G, 38, 6, 13, `rgba(${ACC_RGB},0.8)`, 1); hudTag(t, -1, 'سقف', 'HIGH', 880, G.Y(38) - 40, CYAN, null, 26); candles(G, UPX, t, times);
  lockOn(G, 11, UPX[11], CYAN, k01(t, T(3), 0.35)); hudTag(t, T(3) + 0.15, 'شکست!', 'BREAK', G.X(11), G.Y(41) - 74, CYAN);
  alertBox(t, T(9) - 0.05, 'BOS نیست', 'INVALID BREAK', 400, 880, RED); txt('SAMPLE SERIES', BOX.x, BOX.y + BOX.h + 40, 20, DIMW, { mono: true, align: 'left' }); }
function trapS(t) { const G = mkG(TRAP), times = TRAP.map((_, i) => (i <= 13 ? T(10) + 0.1 + i * 0.03 : [T(31), T(32), T(33)][i - 14]));
  level(G, 38, 6, 13, 'rgba(255,255,255,0.3)', 1); level(G, 29, 8, 16, GREEN, k01(t, T(22), 0.5)); level(G, 28, 8, 16, RED, k01(t, T(26) + 0.1, 0.5)); candles(G, TRAP, t, times);
  lockOn(G, 11, TRAP[11], CYAN, k01(t, T(14), 0.35)); hudTag(t, T(14) + 0.1, 'BOS؟', 'LOCK', G.X(11), G.Y(41) - 74, CYAN);
  hudTag(t, T(23), 'کف محافظت‌شده؟', 'SAFE?', G.X(13), G.Y(29) - 44, GREEN, null, 26); hudTag(t, T(26) + 0.2, 'استاپ', 'STOP', G.X(10), G.Y(28) + 46, RED, null, 26);
  const hit = k01(t, T(33) + 0.25, 0.6); if (hit > 0 && hit < 1) { cv.save(); cv.globalAlpha = 0.25 * (1 - hit); cv.fillStyle = RED; cv.fillRect(0, 0, W, H); cv.restore(); }
  alertBox(t, T(33) + 0.25, 'استاپ خورد', 'STOP HIT', 400, 900, RED); }
function questionS(t) { const G = mkG(UPX), times = UPX.map((_, i) => (i <= 11 ? -10 : null)); level(G, 38, 6, 13, `rgba(${ACC_RGB},0.8)`, 1); candles(G, UPX, t, times);
  const dimS = k01(t, T(37) + 0.05, 0.3); cv.save(); cv.globalAlpha *= 1 - 0.6 * dimS; hudTag(t, T(36), 'شکست', 'BREAK', G.X(11), G.Y(41) - 74, WHITE, null, 28); cv.restore(); if (dimS > 0) line(G.X(11) - 70 * dimS, G.Y(41) - 74, G.X(11) + 70 * dimS, G.Y(41) - 74, RED, 5);
  const m = io(k01(t, T(38), 0.9)), rx = lerp(G.X(11), G.X(6), m), ry = lerp(G.Y(38.5), G.Y(34.2), m), ra = oCub(k01(t, T(38) - 0.2, 0.4)); if (ra > 0) { cv.save(); cv.globalAlpha *= ra; cv.shadowColor = CYAN; cv.shadowBlur = 18; cv.strokeStyle = CYAN; cv.lineWidth = 3;
    cv.beginPath(); cv.arc(rx, ry, 100, 0, Math.PI * 2); cv.stroke(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + t * 0.8; line(rx + Math.cos(a) * 80, ry + Math.sin(a) * 80, rx + Math.cos(a) * 120, ry + Math.sin(a) * 120, CYAN, 4); } line(rx - 24, ry, rx + 24, ry, CYAN, 2); line(rx, ry - 24, rx, ry + 24, CYAN, 2); cv.restore(); }
  hudTag(t, T(41), 'سقف', 'TARGET', G.X(6), G.Y(34.2) - 150, CYAN); const q = oBack(k01(t, T(49), 0.45)); if (q > 0) at(260, 900, q, cl(q * 2), () => txt('؟', 0, 0, 160, FUT, { w: 900, glow: VIO }));
  hudTag(t, T(50), 'سقف بود؟', 'VERIFY', 260, 1020, FUT); }
const STEPS = ['کندلِ سقف رو پیدا کن', 'یه کندل زیر کفش بسته بشه', 'قیمت بالای سقف بسته بشه'];
function ruleS(t) { const k = oCub(k01(t, T(52), 0.4)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; brackets(130, 780, 820, 620, 40, `rgba(${ACC_RGB},0.6)`, 3); txt('BOS CHECK  /  UPTREND', 170, 830, 22, CYAN, { mono: true, align: 'left' }); txt('قانون BOS معتبر', 910, 832, 38, WHITE, { align: 'right', w: 800 });
  STEPS.forEach((s, i) => { const q = oCub(k01(t, T(52) + 0.35 + i * 0.45, 0.4)), y = 960 + i * 150; if (q <= 0) return; cv.save(); cv.globalAlpha *= q; cv.translate((1 - q) * 60, 0); rr(170, y - 56, 740, 112, 12, `rgba(${ACC_RGB},0.07)`, `rgba(${ACC_RGB},0.35)`, 2);
    rr(820, y - 34, 68, 68, 10, null, CYAN, 3); txt(fa(i + 1), 854, y + 3, 38, CYAN, { w: 800 }); txt(s, 790, y + 2, 36, WHITE, { align: 'right', w: 700 }); txt('PENDING', 200, y, 18, DIMW, { mono: true, align: 'left' }); cv.restore(); }); cv.restore(); }
function validS(t) { const G = mkG(UPV), times = UPV.map((_, i) => (i <= 6 ? T(58) + 0.1 + i * 0.05 : i === 7 ? T(69) : i === 8 ? T(74) : i <= 12 ? seqT(T(89), T(93), 4)[i - 9] : i === 13 ? T(95) : i === 14 ? T(100) : T(101)));
  level(G, 30.5, 6, 15, CYAN, k01(t, T(71), 0.5)); level(G, 38, 6, 15, CYAN, k01(t, T(85), 0.5), false, 4); candles(G, UPV, t, times);
  lockOn(G, 6, UPV[6], CYAN, k01(t, T(60), 0.35)); cv.save(); cv.globalAlpha *= 1 - k01(t, T(85), 0.3); hudTag(t, T(60) + 0.15, 'کندل سقف', 'HIGH CANDLE', G.X(6), G.Y(38) - 64, CYAN, null, 28); cv.restore();
  hudTag(t, T(72), 'کف کندل سقف', 'LOW', 880, G.Y(30.5) + 40, CYAN, null, 24);
  const fl = k01(t, T(75) - 0.1, 0.5); if (fl > 0 && fl < 1) { cv.save(); cv.globalAlpha *= 1 - fl; cv.beginPath(); cv.arc(G.X(8), G.Y(29), 20 + fl * 50, 0, Math.PI * 2); cv.strokeStyle = GREEN; cv.lineWidth = 4; cv.stroke(); cv.restore(); }
  hudTag(t, T(75), 'زیرش بسته شد', 'CLOSE < LOW', G.X(8), G.Y(28) + 66, GREEN, 'ok', 26); hudTag(t, T(81), 'پولبک', 'PULLBACK', 660, 950, GREEN, 'ok', 26);
  hudTag(t, T(87), 'سقف واقعی', 'REAL HIGH', 250, G.Y(38), CYAN, null, 28); lockOn(G, 13, UPV[13], GREEN, k01(t, T(95), 0.35)); hudTag(t, T(99), 'BOS معتبر', 'BOS: VALID', 690, 850, GREEN, 'ok', 32);
  strip(t, [['سقف', 1, T(60) + 0.2], ['پولبک', 1, T(75)], ['شکست', 1, T(99)]]); }
function invalidS(t) { const G = mkG(UPX), times = UPX.map((_, i) => (i <= 6 ? T(103) + 0.1 + i * 0.04 : i <= 9 ? [T(105), T(106), T(107)][i - 7] : i <= 11 ? [T(111), T(112)][i - 10] : [T(116), T(117)][i - 12]));
  level(G, 30.5, 6, 13, CYAN, k01(t, T(103) + 0.4, 0.5)); level(G, 38, 6, 13, 'rgba(255,255,255,0.35)', k01(t, T(111), 0.5)); candles(G, UPX, t, times); lockOn(G, 6, UPX[6], CYAN, k01(t, T(103) + 0.3, 0.35));
  const wk = oCub(k01(t, T(108), 0.35)); if (wk > 0) { cv.save(); cv.globalAlpha *= wk; cv.shadowColor = FUT; cv.shadowBlur = 14; cv.beginPath(); cv.arc(G.X(8), G.Y(29) + 4, 26, 0, Math.PI * 2); cv.strokeStyle = FUT; cv.lineWidth = 4; cv.stroke(); cv.restore(); }
  hudTag(t, T(108) + 0.1, 'فقط سایه', 'WICK ONLY', G.X(8), G.Y(29) + 70, FUT, null, 26); hudTag(t, T(110), 'زیرش بسته نشد', 'NO CLOSE < LOW', 760, 1290, RED, 'no', 26);
  lockOn(G, 11, UPX[11], 'rgba(255,255,255,0.6)', k01(t, T(112), 0.35)); alertBox(t, T(114) - 0.05, 'BOS نیست', 'NOT A BOS', 390, 890, RED);
  const ak = k01(t, T(118), 0.5); if (ak > 0) { const x1 = G.X(10), y1 = G.Y(35), x2 = G.X(13) + 10, y2 = G.Y(46), q = oCub(ak); line(x1, y1, lerp(x1, x2, q), lerp(y1, y2, q), GREEN, 5, [10, 8]); }
  hudTag(t, T(119), 'ادامه‌ی موج صعودی', 'SAME LEG UP', 730, 770, GREEN, null, 26); strip(t, [['سقف', 1, T(103) + 0.4], ['پولبک', 0, T(110)], ['شکست', 0, T(114)]]); }
function downS(t) { const G = mkG(DNV), times = DNV.map((_, i) => (i <= 6 ? T(121) + 0.1 + i * 0.05 : i === 7 ? T(132) : i === 8 ? T(134) : null));
  level(G, 33.5, 6, 15, CYAN, k01(t, T(135), 0.5)); candles(G, DNV, t, times); lockOn(G, 6, DNV[6], CYAN, k01(t, T(130), 0.35));
  hudTag(t, T(130) + 0.15, 'کندل کف', 'LOW CANDLE', G.X(6), G.Y(26) + 64, CYAN, null, 28); hudTag(t, T(136), 'سقف کندل کف', 'HIGH', 880, G.Y(33.5) - 40, CYAN, null, 24);
  hudTag(t, T(139), 'بالاش بسته شد', 'CLOSE > HIGH', G.X(8), G.Y(36) - 64, GREEN, 'ok', 26);
  const ak = k01(t, T(140) + 0.1, 0.4); if (ak > 0) { const x1 = G.X(9), y1 = G.Y(31), x2 = G.X(12), y2 = G.Y(22), q = oCub(ak); line(x1, y1, lerp(x1, x2, q), lerp(y1, y2, q), RED, 5, [10, 8]); }
  hudTag(t, T(140) + 0.25, 'بعدش: شکست کف یعنی BOS', 'NEXT', 700, 1320, RED, null, 24); strip(t, [['کف', 1, T(130) + 0.2], ['پولبک', 1, T(139)], ['شکست', 0, null]]); }
// the full-frame violet card: «حرف منو قبول نکن؛ این قانون رو تست کن»
function cardV(t) { const k = io(k01(t, T(141) - 0.05, 0.45)); if (k <= 0) return; const y = lerp(H, 0, k); const g = cv.createLinearGradient(0, y, 0, y + H); g.addColorStop(0, '#9273FF'); g.addColorStop(1, '#5430E6'); cv.fillStyle = g; cv.fillRect(0, y, W, H);
  cv.save(); cv.beginPath(); cv.rect(0, y, W, H); cv.clip(); [['حرف منو', T(142)], ['قبول نکن؛', T(144)], ['این قانون رو', T(146)], ['تست کن.', T(149)]].forEach(([s, t0], i) => { const q = oCub(k01(t, t0, 0.35)); txt(s, CX, y + 700 + i * 165, i === 3 ? 150 : 120, i === 3 ? '#FFFFFF' : 'rgba(255,255,255,0.75)', { w: 900, alpha: q }); });
  if (t >= T(144) + 0.2) { const s = oCub(k01(t, T(144) + 0.2, 0.3)), w0 = measure('حرف منو', 120, 900) / 2 + 20; line(CX + w0, y + 700, CX + w0 - 2 * w0 * s, y + 700, '#1B1040', 9); }
  txt('RULE  ->  TEST', CX, y + 1420, 24, 'rgba(255,255,255,0.7)', { mono: true }); cv.restore(); }
function reveal(t) { const t0 = T(151) - 0.05, fl = k01(t, t0, 0.12) * (1 - k01(t, t0 + 0.15, 0.35)), k = oBack(k01(t, t0 + 0.1, 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 80 * k; const s = 300 * k; cv.drawImage(IMG.icon, CX - s / 2, 1080 - s / 2, s, s); cv.restore(); } if (fl > 0) { cv.fillStyle = `rgba(242,236,255,${fl})`; cv.fillRect(0, 0, W, H); } }
// the flap board flips whole words, so the Persian joins and the digits' order stay right
const FLAP = [['۲۵', ['۰۷', '۱۳', '۰۲', '۳۰', '۱۸', '۰۹', '۲۲']], ['فروردین', ['مهر', 'آبان', 'دی', 'اسفند', 'تیر', 'بهمن', 'آذر']], ['۱۴۰۴', ['۱۴۰۱', '۱۳۹۹', '۱۴۰۲', '۱۴۰۰', '۱۴۰۳']]];
function flap(t) { const wd = [170, 380, 260], gap = 24, total = wd.reduce((a, b) => a + b, 0) + gap * 2, y = 1100; let xr = CX + total / 2;
  FLAP.forEach(([final, pool], i) => { const w = wd[i], x = xr - w / 2; xr -= w + gap; const done = t >= T(157) + 0.18 * i, ph = (t * 9 + i * 3) % 1;
    rr(x - w / 2, y - 80, w, 160, 12, TILE, 'rgba(255,255,255,0.1)', 2); const s = done ? final : pool[Math.floor(t * 9 + i * 3) % pool.length];
    cv.save(); cv.beginPath(); cv.rect(x - w / 2, y - 80, w, 160); cv.clip(); const sq = done ? 1 : Math.abs(Math.cos(ph * Math.PI)); cv.translate(x, y); cv.scale(1, Math.max(0.15, sq)); txt(s, 0, 6, 92, done ? WHITE : 'rgba(255,255,255,0.6)', { w: 900 }); cv.restore();
    line(x - w / 2, y, x + w / 2, y, 'rgba(0,0,0,0.65)', 3); });
  txt('GO TO DATE', CX, y - 140, 22, DIMW, { mono: true }); }
const SCR = [20, 140, 1540, 1000], KEYS = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`);
function glassReplay(t) { const w = 940, h = (w * SCR[3]) / SCR[2], x = CX - w / 2, y = 760, k = oCub(k01(t, T(160), 0.45)); if (k <= 0) return; cv.save(); cv.globalAlpha = k;
  rr(x - 18, y - 18, w + 36, h + 36, 26, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.18)', 2); const f = cl((t - T(160)) / (T(174) - T(160))), im = IMG[KEYS[Math.min(15, Math.floor(f * 16))]];
  if (im) { cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 14); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, x, y, w, h);
    const bk = k01(t, T(165), 0.5); if (bk > 0) line(x + 40, y + h * 0.36, lerp(x + 40, x + w * 0.6, oCub(bk)), y + h * 0.36, CYAN, 4, [12, 9]);
    const cu = oCub(k01(t, T(170), 0.4)); if (cu > 0) { cv.globalAlpha *= cu; const g = cv.createLinearGradient(x + w * 0.6, 0, x + w * 0.86, 0); g.addColorStop(0, `rgba(${BG_RGB},0)`); g.addColorStop(0.35, `rgba(${BG_RGB},0.97)`); cv.fillStyle = g; cv.fillRect(x + w * 0.6, y, w * 0.4, h); txt('ادامه‌ش', x + w * 0.83, y + h / 2, 42, FUT); } cv.restore(); }
  hudTag(t, T(166), 'شکست؟', 'MARK', x + w * 0.45, y + h * 0.36 - 46, CYAN, null, 26);
  brackets(x - 30, y - 30, w + 60, h + 60, 30, CYAN, 3); txt('REPLAY  25.01.1404', x, y - 56, 22, CYAN, { mono: true, align: 'left' }); txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', CX, y + h + 70, 32, DIMW, { w: 600 });
  rr(x, y + h + 120, w, 6, 3, 'rgba(255,255,255,0.12)'); rr(x, y + h + 120, w * f, 6, 3, CYAN);
  const pulse = (t0) => 1 + 0.08 * Math.sin(Math.PI * k01(t, t0, 0.35)), b = oBack(k01(t, T(172), 0.35)); if (b > 0) { at(CX + 210, y + h + 250, b * pulse(T(174)), 1, () => { rr(-170, -60, 340, 120, 18, 'rgba(47,214,123,0.16)', GREEN, 3); txt('معتبر', 0, 4, 54, GREEN, { glow: GREEN }); });
    at(CX - 210, y + h + 250, b * pulse(T(176)), 1, () => { rr(-170, -60, 340, 120, 18, 'rgba(255,90,106,0.16)', RED, 3); txt('نامعتبر', 0, 4, 54, RED, { glow: RED }); }); }
  cv.restore(); }
const ROWS = [['معتبر', 1], ['نامعتبر', 0], ['معتبر', 1], ['معتبر', 1], ['نامعتبر', 0]];
function resultsS(t) { const k = oCub(k01(t, T(177), 0.4)); if (k <= 0) return; cv.save(); cv.globalAlpha *= k; brackets(110, 760, 860, 680, 40, `rgba(${ACC_RGB},0.6)`, 3); txt('BREAK LOG  /  SAMPLE', 150, 810, 22, CYAN, { mono: true, align: 'left' });
  txt('علامت تو', 600, 880, 28, DIMW, { w: 600 }); txt('جوابش', 260, 880, 28, DIMW, { w: 600 });
  ROWS.forEach(([s, ok], i) => { const y = 970 + i * 96, q = oCub(k01(t, T(177) + 0.2 + i * 0.1, 0.35)); if (q <= 0) return; cv.save(); cv.globalAlpha *= q; line(150, y + 48, 930, y + 48, 'rgba(255,255,255,0.08)', 2); txt(`شکست ${fa(i + 1)}`, 920, y, 32, WHITE, { align: 'right', w: 700 });
    const col = ok ? GREEN : RED; rr(600 - 90, y - 26, 180, 52, 10, `rgba(${BG_RGB},0.8)`, col, 2); txt(s, 600, y + 2, 26, col, { w: 700 }); const sh = 0.5 + 0.5 * Math.sin(t * 5 - i * 0.7); txt('؟', 260, y, 54, FUT, { w: 900, alpha: 0.5 + 0.5 * sh, glow: VIO }); cv.restore(); });
  cv.restore(); }
function close_(t) { const k = oBack(k01(t, T(184), 0.5)); if (IMG.icon && k > 0) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 760 - s / 2, s, s); cv.restore(); }
  const q = oCub(k01(t, T(184) + 0.15, 0.4)); txt('شروعش رایگانه', CX, 1010, 110, WHITE, { w: 900, alpha: q, glow: 'rgba(142,107,255,0.6)' });
  const p = oBack(k01(t, T(186), 0.4)); if (p > 0) at(CX, 1200, p, 1, () => { rr(-280, -70, 560, 140, 70, 'rgba(198,242,78,0.12)', LIME, 3); txt('لینک توی بیو', 0, 4, 60, LIME, { glow: LIME }); }); brackets(CX - 360, 600, 720, 720, 40, `rgba(${ACC_RGB},0.5)`, 3); }
function endCard(t) { const k = oBack(k01(t, END, 0.45)); if (IMG.icon) { cv.save(); cv.shadowColor = VIO; cv.shadowBlur = 70; const s = 240 * k; cv.drawImage(IMG.icon, CX - s / 2, 820 - s / 2, s, s); cv.restore(); }
  if (IMG.word) { const q = oCub(k01(t, END + 0.2, 0.4)), ww = 460, hh = (ww * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = q; cv.drawImage(IMG.word, CX - ww / 2, 1010, ww, hh); cv.restore(); }
  const f = oCub(k01(t, END + 0.45, 0.35)); cv.save(); cv.globalAlpha = f; const tw = measure('هر شکستی BOS نیست؛ تستش کن', 40, 800) + 70; rr(CX - tw / 2, 1232, tw, 96, 48, 'rgba(198,242,78,0.12)', LIME, 2); txt('هر شکستی BOS نیست؛ تستش کن', CX, 1282, 40, LIME); txt('شروعش رایگانه؛ لینک توی بیو', CX, 1400, 36, DIMW, { w: 700 }); cv.restore(); }

// the scenes and their words (indices in the voice); scenes with keep: true carry the same drawing on without a blink
const SC = [
  { t: 0, draw: hookS, lines: [L(330, 100, [['قیمت', 0], ['سقف', 1, { c: CYAN, bar: true }], ['رو', 2], ['شکست…', 3]], { now: true, ghost: true }), L(470, 100, [['ولی', 4], ['این', 5], ['BOS', [6, 7, 8], { c: RED }], ['نیست.', 9]], { now: true, ghost: true })] },
  { t: T(10), draw: trapS, lines: [L(330, 80, [['اگر', 10], ['هر', 11], ['شکستی', 12], ['رو', 13], ['BOS', [14, 15, 16], { c: CYAN }], ['حساب', 17], ['کنی،', 18]]), L(460, 80, [['فکر', 19], ['می‌کنی', 20], ['کفِ', 21], ['پشتش', 22], ['محافظت‌شده‌ست.', [23, 24, 25], { c: GREEN, bar: true }]])] },
  { t: T(26), draw: trapS, lines: [L(330, 84, [['استاپت', 26, { c: RED, bar: true }], ['رو', 27], ['همون‌جا', 28], ['می‌ذاری', 29]]), L(460, 84, [['و', 30], ['بازار', 31], ['راحت', 32], ['می‌زنتش.', 33, { c: RED }]])] },
  { t: T(34), draw: questionS, lines: [L(330, 84, [['مشکل', 34], ['از', 35], ['شکست', 36], ['نیست؛', 37]]), L(460, 84, [['مشکل', 38], ['از', 39], ['خود', 40], ['سقفه.', 41, { c: CYAN, bar: true }]])] },
  { t: T(42), draw: questionS, lines: [L(300, 70, [['سؤال', 42], ['اینه:', 43], ['اون', 44], ['سقفی', 45], ['که', 46], ['شکسته', 47], ['شد،', 48]]), L(440, 104, [['اصلاً', 49], ['سقف', 50, { c: CYAN, bar: true }], ['بود؟', 51, { c: FUT }]])] },
  { t: T(52), draw: ruleS, lines: [L(330, 96, [['یه', 52], ['قانون', 53], ['ساده:', 54, { c: LIME, bar: true }]]), L(460, 84, [['توی', 55], ['روند', 56], ['صعودی…', 57, { c: GREEN }]])] },
  { t: T(58), draw: validS, lines: [L(330, 84, [['کندلی', 58], ['که', 59], ['سقف', 60, { c: CYAN, bar: true }], ['رو', 61], ['ساخته', 62]]), L(450, 84, [['پیدا', 63], ['کن.', 64]])] },
  { t: T(65), draw: validS, lines: [L(300, 72, [['اگر', 65], ['بعد', 66], ['از', 67], ['اون،', 68]]), L(405, 72, [['یه', 69], ['کندل', 70], ['زیر', 71, { c: GREEN, bar: true }], ['کفِ', 72, { c: GREEN }]]), L(510, 72, [['همین', 73], ['کندل', 74], ['بسته', 75], ['شده', 76], ['باشه،', 77]])] },
  { t: T(78), draw: validS, lines: [L(330, 78, [['یعنی', 78], ['قیمت', 79], ['واقعاً', 80], ['پولبک', 81, { c: GREEN, bar: true }], ['زده', 82]]), L(460, 78, [['و', 83], ['اون', 84], ['سقف،', 85], ['یه', 86], ['سقف', 87], ['واقعیه.', 88, { c: CYAN, bar: true }]])] },
  { t: T(89), draw: validS, lines: [L(330, 74, [['حالا', 89], ['اگر', 90], ['قیمت', 91], ['بالای', 92], ['این', 93], ['سقف', 94], ['بسته', 95, { c: LIME, bar: true }], ['بشه،', 96]]), L(470, 96, [['این', 97], ['یه', 98], ['BOS', [99, 100, 101], { c: GREEN }], ['معتبره.', 102, { c: GREEN, bar: true }]])] },
  { t: T(103), draw: invalidS, lines: [L(330, 84, [['ولی', 103], ['اگر', 104], ['هیچ', 105], ['کندلی', 106]]), L(460, 84, [['زیر', 107, { c: RED, bar: true }], ['کفش', 108], ['بسته', 109], ['نشده،', 110]])] },
  { t: T(111), draw: invalidS, lines: [L(330, 100, [['شکستنش', 111], ['BOS', [112, 113, 114], { c: RED }], ['نیست.', 115]]), L(470, 74, [['فقط', 116], ['ادامه‌ی', 117], ['همون', 118], ['موج', 119], ['صعودیه.', 120, { c: GREEN, bar: true }]])] },
  { t: T(121), draw: downS, lines: [L(330, 84, [['توی', 121], ['روند', 122], ['نزولی', 123, { c: RED, bar: true }], ['هم', 124], ['همینه،', 125]]), L(460, 84, [['فقط', 126], ['برعکس.', 127, { c: CYAN }]])] },
  { t: T(128), draw: downS, lines: [L(300, 72, [['بعد', 128], ['از', 129], ['کندلِ', 130], ['کف،', 131, { c: CYAN, bar: true }]]), L(405, 72, [['یه', 132], ['کندل', 133], ['باید', 134], ['بالای', 135, { c: GREEN, bar: true }]]), L(510, 72, [['سقفِ', 136], ['همون', 137], ['کندل', 138], ['بسته', 139], ['بشه.', 140]])] },
  { t: T(141) - 0.05, draw: (t) => { downS(t); cardV(t); }, lines: [] },
  { t: T(151) - 0.05, draw: reveal, lines: [L(1460, 100, [['توی', 151], ['بک‌تست‌لب', [152, 153], { c: CYAN }]])] },
  { t: T(154), draw: flap, lines: [L(420, 88, [['برو', 154], ['به', 155], ['یه', 156], ['روز', 157], ['از', 158], ['گذشته،', 159, { c: CYAN, bar: true }]])] },
  { t: T(160), draw: glassReplay, lines: [L(380, 96, [['بازار', 160], ['رو', 161], ['جلو', 162, { c: CYAN, bar: true }], ['ببر،', 163]])] },
  { t: T(164), draw: glassReplay, lines: [L(300, 70, [['و', 164], ['هر', 165], ['شکست', 166, { c: CYAN }], ['رو', 167], ['قبل', 168], ['از', 169]]), L(410, 70, [['دیدن', 170], ['ادامه‌ش', 171, { c: FUT }]]), L(540, 92, [['علامت', 172, { c: LIME, bar: true }], ['بزن:', 173]])] },
  { t: T(174), draw: glassReplay, lines: [L(420, 100, [['معتبر', 174, { c: GREEN }], ['یا', 175], ['نامعتبر؟', 176, { c: RED }]])] },
  { t: T(177), draw: resultsS, lines: [L(360, 88, [['بعد', 177], ['ببین', 178], ['کدوم‌ها', [179, 180]]]), L(500, 88, [['واقعاً', 181], ['جواب', 182, { c: LIME, bar: true }], ['دادن.', 183]])] },
  { t: T(184), draw: close_, lines: [] },
  { t: END, draw: endCard, lines: [] },
];

// ---------- frame ----------
const REAL = [T(160), T(177)];
function hudFrame(t) { cv.fillStyle = BG; cv.fillRect(0, 0, W, H); const g = cv.createRadialGradient(CX, 1000, 100, CX, 1000, 1200); g.addColorStop(0, 'rgba(84,48,230,0.40)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.save(); cv.globalAlpha = 0.05; for (let x = 0; x <= W; x += 90) line(x, 0, x, H, WHITE, 1); for (let y = 0; y <= H; y += 90) line(0, y, W, y, WHITE, 1); cv.restore();
  brackets(36, 36, W - 72, H - 72, 46, 'rgba(255,255,255,0.35)', 3);
  const tc = (s) => String(Math.floor(s)).padStart(2, '0'); txt('BACKTESTLAB / BOS CHECK', 70, 90, 20, DIMW, { mono: true, align: 'left' }); txt(`00:${tc(t / 60)}:${tc(t % 60)}:${tc((t * 30) % 30)}`, W - 70, 90, 20, DIMW, { mono: true, align: 'right' });
  txt(t >= REAL[0] && t < REAL[1] ? 'REAL REPLAY' : 'SAMPLE DATA', 70, H - 86, 20, DIMW, { mono: true, align: 'left' }); txt('RULE: TEST IT', W - 70, H - 86, 20, DIMW, { mono: true, align: 'right' }); }
function frame(t) {
  hudFrame(t); let k = 0; SC.forEach((s, i) => { if (t >= s.t) k = i; }); const s = SC[k], nx = SC[k + 1], pv = SC[k - 1], fadeIn = oCub(k01(t, s.t, 0.3)), fadeOut = nx ? 1 - k01(t, nx.t - 0.15, 0.15) : 1;
  const dIn = pv && pv.draw === s.draw ? 1 : fadeIn, dOut = nx && nx.draw === s.draw ? 1 : fadeOut;
  cv.save(); cv.globalAlpha = k === 0 ? dOut : Math.min(dIn, dOut); s.draw(t); cv.restore();
  s.lines.forEach((ln) => wordsLine(ln, t, k === 0 ? fadeOut : Math.min(fadeIn, fadeOut)));
  const pk = cl(t / END); cv.fillStyle = 'rgba(255,255,255,0.1)'; cv.fillRect(0, 0, W, 6); cv.fillStyle = CYAN; cv.fillRect(W * (1 - pk), 0, W * pk, 6);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(9) + 0.8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  frame(0); window.ready = true;
});
