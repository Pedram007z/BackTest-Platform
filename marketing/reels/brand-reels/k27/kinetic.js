// k27 · «نکنه استراتژی سوددهت فقط توی ذهنت سوددهه؟» (dialog #2, «چارت گذشته گولت می‌زنه»), a kinetic typography reel
// on the user's take at its normal speed, on k24's engine: big words slam in on the voice, the background flips colour
// on every idea with a wipe, and each idea has one animated graphic:
//   - the hook: the whole question from the first frame, a thought cloud holding a perfect rising equity line;
//   - «یه چارت گذشته رو باز کن»: a sample chart (labelled «نمودار نمونه») sliding in;
//   - «ورودها چقدر واضحن… اینجا می‌خریدم، اینجا می‌فروختم»: a buy at the low and a sell at the high, ringed in marker;
//   - «ولی تو الان می‌دونی بعدش چی شد. اون موقع نمی‌دونستی»: the future lit, then a curtain over it with «؟»;
//   - «روی چارتی که آینده‌ش پیداست، هر استراتژی‌ای سودده به نظر میاد»: three strategy cards all stamped «سودده»;
//   - «تست واقعی وقتیه که آینده رو نبینی»: an eye closing;
//   - «بک‌تست‌لب دقیقاً همینه… می‌ری به یه روز از گذشته…»: the calendar flipping back to the replay's real date, then the
//     real gold replay (k13's screens) with the future curtained off and the buy and sell buttons waiting;
//   - «این هفته ۲۰ تا معامله…»: twenty tiles for the week, the answer «؟»;
//   - the free start, the link in bio, the end card.
// window.seek(t) draws time t; window.cover() draws the cover.
const W = 1080, H = 1920, CX = 540, D = window.DATA, ws = (i) => D.w[i][0], we = (i) => D.w[i][1], END = D.end, DUR = D.dur;
const INK = '#0B0C10', PAPER = '#F2EEE6', RED = '#FF4D5E', LIME = '#C6F24E', VIO = '#6C47FF', GREEN = '#2FD67B', WHITE = '#FFFFFF', NIGHT = '#16112B';
const cv = document.getElementById('c').getContext('2d');
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const oCub = (k) => 1 - (1 - k) ** 3, oExp = (k) => (k >= 1 ? 1 : 1 - 2 ** (-10 * k)), oBack = (k) => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const IMG = {};

// ---------- drawing ----------
const font = (size, w = 900) => `${w} ${size}px Vazirmatn`;
function measure(s, size, w = 900) { cv.font = font(size, w); cv.direction = 'rtl'; return cv.measureText(s).width; }
function txt(s, x, y, size, col, o = {}) { cv.save(); cv.font = font(size, o.w ?? 900); cv.direction = o.dir ?? 'rtl'; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.globalAlpha *= o.alpha ?? 1; cv.fillStyle = col; cv.fillText(s, x, y); cv.restore(); }
function rrect(x, y, w, h, r, fill, stroke, lw = 2) { cv.beginPath(); cv.roundRect(x, y, w, h, r); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill) { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = fill; cv.fill(); }
function line(x1, y1, x2, y2, col, lw, cap = 'round') { cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cap; cv.stroke(); }
function at(x, y, s, a, fn, rot = 0) { if (a <= 0 || s <= 0) return; cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
function shadowed(fn, blur = 40, dy = 14, a = 0.3) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : oBack(k01(t, t0, d)));
function chip(s, x, y, size, bg, fg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 0.9, h = size * 1.55; rrect(x - w / 2, y - h / 2, w, h, o.r ?? h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.06, size, fg, { w: o.w ?? 800 }); return w; }
/** a hand-drawn stroke from a to b, drawn up to fraction k */
function stroke(pts, k, col, lw) { if (k <= 0) return; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * cl(k); cv.beginPath(); cv.moveTo(...pts[0]); for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / seg[i - 1]); cv.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= seg[i - 1]; }
  cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = cv.lineJoin = 'round'; cv.stroke(); }

// ---------- kinetic lines: tokens laid right to left, each entering on its word ----------
// a token: [text, word index (or [first, last]), style]; style: c (colour), hl (block colour behind), ht (text colour on
// the block), size, strike, slam (force the slam entrance)
const L = (y, size, col, toks, o = {}) => ({ y, size, col, toks, ...o });
function drawLine(ln, t, o = {}) {
  const size = ln.size, gap = size * 0.26, toks = ln.toks.map(([s, wi, st = {}]) => { const sz = st.size ?? size; return { s, sz, st, w: measure(s, sz), t0: ws(Array.isArray(wi) ? wi[0] : wi) - 0.07, m: st.hl ? sz * 0.24 : 0 }; });
  const total = toks.reduce((a, k) => a + k.w + 2 * k.m, 0) + gap * (toks.length - 1); let xr = CX + total / 2;
  toks.forEach((k) => { const x = xr - k.m - k.w / 2; xr -= k.w + 2 * k.m + gap; drawToken(k, x, ln.y, t, ln.col, o.karaoke); });
}
function drawToken(k, x, y, t, col, karaoke) {
  const st = k.st, big = st.hl || st.slam || k.sz >= 200, e = t - k.t0;
  let a, s, dy = 0;
  if (karaoke) { a = e < 0 ? 0.36 : 1; s = e < 0 ? 1 : 1 + 0.14 * Math.sin(Math.PI * k01(e, 0, 0.22)); }
  else if (e < 0) return;
  else if (big) { const q = k01(e, 0, 0.2); a = cl(q * 2); s = lerp(1.65, 1, oBack(q)); }
  else { const q = oCub(k01(e, 0, 0.2)); a = q; s = 1; dy = (1 - q) * 46; }
  const lit = karaoke ? e >= 0 : true;
  // the slam's ghost trail
  if (!karaoke && big && e < 0.2) [1.35, 1.18].forEach((g, i) => at(x, y, s * g, 0.16 * (1 - e / 0.2) * (i + 1) / 2, () => txt(k.s, 0, 0, k.sz, st.hl ?? st.c ?? col)));
  at(x, y + dy, s, a, () => {
    if (st.hl && lit) { const grow = karaoke ? oCub(k01(e, 0, 0.18)) : oCub(k01(e, 0.04, 0.18)), w = k.w + k.sz * 0.42, h = k.sz * 1.28; cv.save(); cv.rotate(-0.02); cv.beginPath(); cv.rect(w / 2 - w * grow, -h, w * grow + 2, h * 2); cv.clip(); shadowed(() => rrect(-w / 2, -h / 2, w, h, k.sz * 0.16, st.hl), 30, 10, 0.25); cv.restore(); }
    txt(k.s, 0, k.sz * 0.05, k.sz, st.hl && lit ? (st.ht ?? WHITE) : (st.c ?? col));
    if (st.strike && lit) { const sk = oCub(k01(e, 0.12, 0.2)); line(k.w / 2 + 10, 0, k.w / 2 + 10 - (k.w + 20) * sk, 0, RED, k.sz * 0.12); }
  });
}


// ---------- the scenes ----------
const AMB_ = '#FFB020', LIL = '#A58BFF';
// a sample chart: a dip, a rally, a top and a fall (drawn here, labelled «نمودار نمونه»)
const CHART = (() => { const out = []; let p = 100; const seg = [[14, 0.2], [10, -1.6], [16, 1.9], [6, 0.1], [12, -1.7], [10, 0.6]]; let k = 0;
  seg.forEach(([n, d]) => { for (let i = 0; i < n; i++, k++) { const o = p, c = p + d + (rnd(k * 7 + 3) - 0.5) * 2.4, hi = Math.max(o, c) + 0.4 + rnd(k * 3) * 0.9, lo = Math.min(o, c) - 0.4 - rnd(k * 5) * 0.9; out.push({ o, h: hi, l: lo, c }); p = c; } });
  return out; })();
const NC = CHART.length, LOWI = (() => { let m = 0; for (let i = 0; i < 40; i++) if (CHART[i].l < CHART[m].l) m = i; return m; })(), HIGHI = (() => { let m = 30; for (let i = 30; i < 60; i++) if (CHART[i].h > CHART[m].h) m = i; return m; })();
const CB = { x: 70, y: 700, w: 940, h: 720 }, cmin = Math.min(...CHART.map((c) => c.l)) - 2, cmax = Math.max(...CHART.map((c) => c.h)) + 2;
const ccx = (i) => CB.x + 30 + (i + 0.5) * ((CB.w - 60) / NC), ccy = (p) => CB.y + 40 + (1 - (p - cmin) / (cmax - cmin)) * (CB.h - 80), CCW = ((CB.w - 60) / NC) * 0.6;
const FUT = Math.floor(NC * 0.55);   // where «now» was, for the curtain
function chartCard(t, o = {}) { const n = o.n ?? NC; shadowed(() => rrect(CB.x, CB.y, CB.w, CB.h, 34, '#12131B'), 50, 20, 0.45);
  cv.save(); cv.beginPath(); cv.roundRect(CB.x, CB.y, CB.w, CB.h, 34); cv.clip(); for (let k = 1; k < 5; k++) line(CB.x, CB.y + (k * CB.h) / 5, CB.x + CB.w, CB.y + (k * CB.h) / 5, 'rgba(255,255,255,0.05)', 2);
  for (let i = 0; i < n; i++) { const c = CHART[i], up = c.c >= c.o, col = up ? GREEN : RED, x = ccx(i); cv.globalAlpha = o.alpha ? o.alpha(i) : 1; line(x, ccy(c.h), x, ccy(c.l), col, 3, 'butt'); cv.fillStyle = col; const y1 = ccy(Math.max(c.o, c.c)); cv.fillRect(x - CCW / 2, y1, CCW, Math.max(3, ccy(Math.min(c.o, c.c)) - y1)); }
  cv.globalAlpha = 1; if (o.over) o.over(); cv.restore(); txt('نمودار نمونه', CB.x + CB.w - 28, CB.y + 32, 26, 'rgba(255,255,255,0.45)', { w: 700, align: 'right' }); }
// the hook: a thought cloud with a perfect rising line
function hookArt(t) {
  const k = oCub(k01(t, 0.05, 0.5)); if (k <= 0) return; const cx0 = CX, cy0 = 1400;
  at(cx0, cy0, lerp(0.85, 1, k), k, () => { const puffs = [[0, 0, 250], [-210, 30, 150], [210, 30, 160], [-110, -110, 160], [120, -120, 170], [-260, 120, 100], [250, 130, 110], [0, 140, 190]];
    shadowed(() => puffs.forEach(([x, y, r]) => { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = '#F4F1FF'; cv.fill(); }), 50, 20, 0.35);
    [[-200, 330, 34], [-260, 400, 22]].forEach(([x, y, r]) => { cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); cv.fillStyle = '#F4F1FF'; cv.fill(); });
    const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([-250 + u * 500, 120 - u * 260 + Math.sin(u * 14) * 16]); } stroke(pts, k01(t, 0.3, 2.2), GREEN, 16);
    const e = k01(t, 0.3, 2.2); if (e > 0.98) { const tip = pts[30]; for (let s = 0; s < 6; s++) { const a = (s / 6) * Math.PI * 2 + t * 2, r = 30 + 10 * Math.sin(t * 6 + s); circle(tip[0] + Math.cos(a) * r, tip[1] + Math.sin(a) * r, 6, LIME); } }
    txt('$', 190, -40, 90, GREEN, { dir: 'ltr', alpha: cl((e - 0.6) * 3) }); });
}
// «یه چارت گذشته رو باز کن» … «اینجا می‌خریدم، اینجا می‌فروختم»
function marks(t, from) { const b = pop(t, ws(18) - 0.06, 0.3), s = pop(t, ws(21) - 0.06, 0.3), bx = ccx(LOWI), by = ccy(CHART[LOWI].l) + 70, sx = ccx(HIGHI), sy = ccy(CHART[HIGHI].h) - 70;
  if (b > 0) { at(bx, by, cl(b, 0, 1.2), 1, () => { cv.fillStyle = GREEN; cv.beginPath(); cv.moveTo(0, -40); cv.lineTo(30, 4); cv.lineTo(-30, 4); cv.closePath(); cv.fill(); chip('خرید', 0, 52, 34, GREEN, INK); });
    const ring = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2.1; ring.push([bx + Math.cos(a) * 64, by - 70 + Math.sin(a) * 52]); } stroke(ring, k01(t, ws(18), 0.4), LIME, 6); }
  if (s > 0) { at(sx, sy, cl(s, 0, 1.2), 1, () => { cv.fillStyle = RED; cv.beginPath(); cv.moveTo(0, 40); cv.lineTo(30, -4); cv.lineTo(-30, -4); cv.closePath(); cv.fill(); chip('فروش', 0, -52, 34, RED, WHITE); });
    const ring = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2.1; ring.push([sx + Math.cos(a) * 64, sy + 70 + Math.sin(a) * 52]); } stroke(ring, k01(t, ws(21), 0.4), LIME, 6); } }
function openArt(t) { const k = oCub(k01(t, ws(8) - 0.1, 0.45)); cv.save(); cv.translate((1 - k) * 700, 0); chartCard(t); cv.restore(); }
function clearArt(t) { chartCard(t, { over: () => marks(t) }); }
// «ولی تو الان می‌دونی بعدش چی شد. اون موقع نمی‌دونستی»
function hindArt(t) {
  const lit = t < ws(32) - 0.07, cur = oCub(k01(t, ws(33) - 0.1, 0.45)), xF = ccx(FUT) - CCW;
  chartCard(t, { alpha: (i) => (i >= FUT && lit ? 1 : i >= FUT ? 1 : 0.9), over: () => { marks(t);
    if (lit) { cv.save(); cv.globalAlpha = 0.18 + 0.12 * Math.sin(t * 6); cv.fillStyle = LIME; cv.fillRect(xF, CB.y, CB.x + CB.w - xF, CB.h); cv.restore(); }
    if (cur > 0) { const w = (CB.x + CB.w - xF) * cur; cv.fillStyle = '#1B1630'; cv.fillRect(CB.x + CB.w - w, CB.y, w, CB.h); for (let k = 0; k < 6; k++) line(CB.x + CB.w - w + 12 + k * ((w - 24) / 6), CB.y, CB.x + CB.w - w + 12 + k * ((w - 24) / 6), CB.y + CB.h, 'rgba(255,255,255,0.05)', 10);
      at(CB.x + CB.w - w / 2, CB.y + CB.h / 2, cl(pop(t, ws(34) - 0.05, 0.3), 0, 1.2), cur, () => { txt('؟', 0, 0, 220, LIL); txt('آینده', 0, 150, 48, LIL, { w: 800 }); }); }
    line(xF, CB.y + 20, xF, CB.y + CB.h - 20, WHITE, 4, 'round'); } });
  at(xF, CB.y - 26, 1, 1, () => chip('اون موقع', 0, 0, 30, WHITE, INK));
}
// «روی چارتی که آینده‌ش پیداست، هر استراتژی‌ای سودده به نظر میاد»: three strategy cards, all stamped
function anyArt(t) {
  const names = ['استراتژی الف', 'استراتژی ب', 'استراتژی ج'];
  names.forEach((n, i) => { const k = pop(t, ws(42) - 0.1 + i * 0.12, 0.3); if (k <= 0) return; const y = 1000 + i * 210;
    at(CX, y, cl(k, 0, 1.15), cl(k * 2), () => { shadowed(() => rrect(-380, -80, 760, 160, 36, '#1F1A3A')); txt(n, 150, 4, 54, WHITE);
      const s = pop(t, ws(43) - 0.05 + i * 0.16, 0.25); at(-190, 0, lerp(1.8, 1, cl(s)), cl(s * 2), () => { rrect(-130, -46, 260, 92, 18, null, GREEN, 6); txt('سودده ✓', 0, 4, 46, GREEN); }, -0.12); }); });
  const e = oCub(k01(t, ws(39) - 0.1, 0.3)); at(CX, 780, 1, e, () => { cv.lineWidth = 10; cv.strokeStyle = LIME; cv.beginPath(); cv.ellipse(0, 0, 90, 52, 0, 0, Math.PI * 2); cv.stroke(); circle(0, 0, 30, LIME); circle(0, 0, 12, INK); chip('آینده پیداست', 0, 100, 30, LIME, INK); });
}
// «تست واقعی وقتیه که آینده رو نبینی»: an eye closing
function eyeArt(t) { const k = pop(t, ws(47) - 0.08, 0.3), close = oCub(k01(t, ws(51) - 0.05, 0.4)); if (k <= 0) return;
  at(CX, 1330, cl(k, 0, 1.15), 1, () => { const lid = lerp(1, 0.04, close); cv.save(); cv.beginPath(); cv.ellipse(0, 0, 240, 140 * lid, 0, 0, Math.PI * 2); cv.fillStyle = WHITE; cv.fill(); cv.clip(); circle(0, 0, 90, INK); circle(0, 0, 40, VIO); circle(-26, -26, 16, WHITE); cv.restore();
    cv.lineWidth = 16; cv.strokeStyle = INK; cv.beginPath(); cv.ellipse(0, 0, 240, Math.max(4, 140 * lid), 0, 0, Math.PI * 2); cv.stroke();
    if (close > 0.9) for (let i = 0; i < 5; i++) { const x = -160 + i * 80; line(x, 16, x - 14 * (i - 2) * 0.4, 70, INK, 12); } }); }
// «بک‌تست‌لب دقیقاً همینه»
function labLogo(t) { const k = pop(t, ws(54) - 0.08, 0.32); if (IMG.icon) at(CX, 1250, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = rgba(VIO, 0.7); cv.shadowBlur = 70; cv.drawImage(IMG.icon, -170, -170, 340, 340); }); }
// «می‌ری به یه روز از گذشته…»: the calendar flipping back, then the real replay with the future curtained off
const SCR = [20, 140, 1540, 1000];
function replayArt(t) {
  const c0 = ws(58) - 0.1, c1 = ws(63), flip = k01(t, c0, c1 - c0 + 0.2), days = ['امروز', 'دیروز', 'هفته‌ی پیش', 'ماه پیش', '۲۵ فروردین ۱۴۰۴'];
  if (t < ws(64) - 0.07) { const n = Math.min(days.length - 1, Math.floor(flip * days.length)), f = (flip * days.length) % 1;
    at(CX, 1200, 1, 1, () => { shadowed(() => rrect(-300, -170, 600, 340, 40, WHITE)); rrect(-300, -170, 600, 90, 40, RED); rrect(-300, -120, 600, 40, 0, RED); [-170, 170].forEach((x) => { rrect(x - 14, -200, 28, 70, 14, '#2A2A35'); });
      cv.save(); cv.beginPath(); cv.rect(-300, -80, 600, 250); cv.clip(); txt(days[n], 0, 50 - (n < days.length - 1 ? f * 0 : 0), n === days.length - 1 ? 60 : 84, INK); cv.restore(); txt('برو به', 0, -125, 40, WHITE, { w: 800 }); });
    return; }
  const k = pop(t, ws(64) - 0.07, 0.35), w = 960, h = (w * SCR[3]) / SCR[2], y = 760, keys = Array.from({ length: 16 }, (_, i) => `c${String(i).padStart(2, '0')}`), f = cl((t - ws(64)) / (ws(76) - ws(64))), key = keys[Math.min(15, Math.floor(f * 16))];
  at(CX, y + h / 2, lerp(0.9, 1, cl(k)), cl(k * 2), () => { const ox = -w / 2, oy = -h / 2; shadowed(() => rrect(ox - 14, oy - 64, w + 28, h + 78, 30, '#1B1C24'), 60, 24, 0.5); [RED, AMB_, GREEN].forEach((c, i) => circle(ox + w - 22 - i * 34, oy - 32, 10, c));
    const im = IMG[key]; if (im) { cv.save(); cv.beginPath(); cv.roundRect(ox, oy, w, h, 16); cv.clip(); const s = im.width / 1920; cv.drawImage(im, SCR[0] * s, SCR[1] * s, SCR[2] * s, SCR[3] * s, ox, oy, w, h); cv.restore(); }
    const cu = oCub(k01(t, ws(74) - 0.1, 0.4)); if (cu > 0) { cv.save(); cv.globalAlpha = cu; const g = cv.createLinearGradient(ox + w * 0.6, 0, ox + w * 0.9, 0); g.addColorStop(0, 'rgba(17,18,26,0)'); g.addColorStop(0.3, 'rgba(17,18,26,0.96)'); cv.fillStyle = g; cv.fillRect(ox + w * 0.6, oy, w * 0.32, h * 0.88); txt('آینده', ox + w * 0.8, 0, 46, LIL, { w: 800 }); cv.restore(); } });
  const b = pop(t, ws(76) - 0.08, 0.3), pulse = 1 + 0.05 * Math.sin(t * 8); at(CX + 200, y + h + 170, cl(b, 0, 1.1) * pulse, cl(b * 2), () => { shadowed(() => rrect(-170, -64, 340, 128, 32, GREEN)); txt('خرید', 0, 6, 56, WHITE); });
  at(CX - 200, y + h + 170, cl(b, 0, 1.1) * pulse, cl(b * 2), () => { shadowed(() => rrect(-170, -64, 340, 128, 32, RED)); txt('فروش', 0, 6, 56, WHITE); });
  at(CX, y + h + 50, 1, cl(k * 2), () => txt('صفحه‌ی واقعی بک‌تست‌لب، بازپخش طلا', 0, 0, 32, WHITE, { w: 600, alpha: 0.75 }));
}
// «این هفته ۲۰ تا معامله…»: twenty tiles
function weekArt(t) { for (let i = 0; i < 20; i++) { const k = pop(t, ws(80) - 0.05 + i * 0.05, 0.25); if (k <= 0) continue; const c = i % 5, r = Math.floor(i / 5); at(CX + 280 - c * 140, 1000 + r * 140, cl(k, 0, 1.15), 1, () => { shadowed(() => rrect(-56, -56, 112, 112, 26, '#2A2440'), 20, 8, 0.3); txt(fa(i + 1), 0, 6, 46, WHITE); }); }
  const q = pop(t, ws(87) - 0.06, 0.3); at(CX, 1640, cl(q, 0, 1.15), cl(q * 2), () => { const flip = Math.floor((t - ws(87)) * 5) % 2; chip(flip ? 'سودده؟ ✓' : 'سودده؟ ✗', 0, 0, 56, flip ? GREEN : RED, WHITE); }); }
const fa = (n) => n.toLocaleString('fa-IR');
function ctaArt(t) { const k = pop(t, ws(91) - 0.05, 0.32); if (IMG.icon) at(CX, 420, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = 'rgba(0,0,0,0.3)'; cv.shadowBlur = 50; cv.shadowOffsetY = 16; cv.drawImage(IMG.icon, -120, -120, 240, 240); });
  const p = pop(t, ws(93) - 0.05, 0.3); at(CX, 1330, cl(p, 0, 1.12), cl(p * 2), () => { shadowed(() => rrect(-300, -82, 600, 164, 82, INK)); txt('لینک توی بیو', 0, 6, 74, WHITE); });
  if (t > ws(93)) { const b = Math.abs(Math.sin((t - ws(93)) * 6)) * 26; at(CX, 1150 - b, 1, cl((t - ws(93)) * 4), () => { cv.fillStyle = INK; cv.beginPath(); cv.moveTo(0, -60); cv.lineTo(48, 0); cv.lineTo(16, 0); cv.lineTo(16, 50); cv.lineTo(-16, 50); cv.lineTo(-16, 0); cv.lineTo(-48, 0); cv.closePath(); cv.fill(); }); } }
function endArt(t) { const k = pop(t, END, 0.35); if (IMG.icon) at(CX, 760, cl(k, 0, 1.15), cl(k * 2), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 60; cv.drawImage(IMG.icon, -130, -130, 260, 260); });
  if (IMG.word) { const q = oCub(k01(t, END + 0.15, 0.35)), ww = 520, hh = (ww * IMG.word.height) / IMG.word.width; at(CX, 1000 + (1 - q) * 30, 1, q, () => cv.drawImage(IMG.word, -ww / 2, -hh / 2, ww, hh)); }
  const f = pop(t, END + 0.4, 0.3); at(CX, 1180, cl(f, 0, 1.1), cl(f * 2), () => chip('آینده رو نبین، تست کن', 0, 0, 56, LIME, INK));
  const l = oCub(k01(t, END + 0.7, 0.3)); at(CX, 1330, 1, l, () => txt('شروعش رایگانه؛ لینک توی بیو', 0, 0, 48, WHITE, { w: 700, alpha: 0.85 })); }

const SCENES = [
  { at: 0, bg: INK, wipe: 'none', art: hookArt, karaoke: true, lines: [L(300, 150, WHITE, [['نکنه', 0, { c: LIME }]]), L(470, 120, WHITE, [['استراتژی', 1], ['سوددهت', 2, { hl: GREEN, ht: INK }]]),
    L(640, 120, WHITE, [['فقط', 3], ['توی', 4], ['ذهنت', 5, { hl: VIO }]]), L(810, 150, WHITE, [['سوددهه؟', 6]])] },
  { at: ws(7) - 0.07, bg: NIGHT, wipe: 'slash', art: openArt, lines: [L(330, 100, WHITE, [['یه', 7], ['چارت', 8], ['گذشته', 9, { c: LIME }], ['رو', 10]]), L(480, 130, WHITE, [['باز', 11], ['کن.', 12, { hl: VIO }]])] },
  { at: ws(13) - 0.07, bg: NIGHT, wipe: 'none', art: clearArt, lines: [L(280, 88, WHITE, [['ورودها', 13], ['چقدر', 14], ['واضحن،', [15, 16], { hl: LIME, ht: INK }], ['نه؟', 17]]),
    L(430, 66, WHITE, [['اینجا', 18], ['می‌خریدم،', [19, 20], { c: GREEN }], ['اینجا', 21], ['می‌فروختم.', [22, 23], { c: RED }]])] },
  { at: ws(24) - 0.07, bg: INK, wipe: 'cut', art: hindArt, lines: [L(260, 92, WHITE, [['ولی', 24], ['تو', 25], ['الان', 26, { hl: LIME, ht: INK }], ['می‌دونی', [27, 28]]]), L(380, 92, WHITE, [['بعدش', 29], ['چی', 30], ['شد.', 31]]),
    L(520, 100, WHITE, [['اون', 32], ['موقع', 33], ['نمی‌دونستی.', [34, 35], { hl: RED }]])] },
  { at: ws(36) - 0.07, bg: NIGHT, wipe: 'iris', art: anyArt, lines: [L(280, 78, WHITE, [['روی', 36], ['چارتی', 37], ['که', 38], ['آینده‌ش', 39, { c: LIME }], ['پیداست،', 40]]),
    L(430, 100, WHITE, [['هر', 41], ['استراتژی‌ای', 42]]), L(570, 110, WHITE, [['سودده', 43, { hl: GREEN, ht: INK }], ['به', 44], ['نظر', 45], ['میاد.', 46]])] },
  { at: ws(47) - 0.07, bg: LIME, wipe: 'slash', art: eyeArt, lines: [L(330, 120, INK, [['تست', 47], ['واقعی', 48], ['وقتیه', 49]]), L(520, 110, INK, [['که', 50], ['آینده', 51, { hl: INK, ht: LIME }], ['رو', 52], ['نبینی.', 53]])] },
  { at: ws(54) - 0.07, bg: VIO, wipe: 'iris', art: labLogo, lines: [L(560, 170, WHITE, [['بک‌تست‌لب', [54, 55]]]), L(760, 150, WHITE, [['دقیقاً', 56, { c: LIME }], ['همینه.', 57]])] },
  { at: ws(58) - 0.07, bg: INK, wipe: 'up', art: replayArt, lines: [L(260, 86, WHITE, [['می‌ری', 58], ['به', 59], ['یه', 60], ['روز', 61], ['از', 62], ['گذشته،', 63, { c: LIME }]]),
    L(380, 80, WHITE, [['بازار', 64], ['از', 65], ['همون‌جا', 66], ['جلو', 67], ['میاد', 68]]), L(500, 76, WHITE, [['و', 69], ['تو', 70], ['باید', 71], ['قبل', 72], ['از', 73], ['دیدن', 74], ['ادامه‌ش', 75, { c: LIL }]]),
    L(620, 96, WHITE, [['تصمیم', 76, { hl: VIO }], ['بگیری.', 77]])] },
  { at: ws(78) - 0.07, bg: PAPER, wipe: 'slash', art: weekArt, lines: [L(300, 100, INK, [['این', 78], ['هفته', 79], ['۲۰', 80, { hl: VIO }], ['تا', 80], ['معامله', 81]]), L(450, 90, INK, [['این‌طوری', 82], ['بگیر', 83, { c: VIO }]]),
    L(590, 90, INK, [['و', 84], ['ببین', 85], ['هنوز', 86], ['سودده', 87, { c: GREEN }], ['هست', 88], ['یا', 89], ['نه.', 90, { c: RED }]])] },
  { at: ws(91) - 0.07, bg: LIME, wipe: 'iris', art: ctaArt, lines: [L(700, 150, INK, [['شروعش', 91]]), L(890, 210, INK, [['رایگانه!', 92, { hl: VIO }]])] },
  { at: END, bg: INK, wipe: 'cut', art: endArt, lines: [] },
];
const PUNCH = [ws(2), ws(5), ws(12), ws(15), ws(20), ws(23), ws(26), ws(34), ws(43), ws(51), ws(54), ws(76), ws(80), ws(92)];
const WIPE = 0.24;

// ---------- frame ----------
let GRAIN = null;
function grainTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256); for (let i = 0; i < 256 * 256; i++) { const v = (rnd(i * 1.7) * 255) | 0; im.data.set([v, v, v, 22], i * 4); } g.putImageData(im, 0, 0); return c; }
function drawScene(i, t) {
  const S = SCENES[i]; cv.fillStyle = S.bg; cv.fillRect(0, 0, W, H);
  let p = 0; PUNCH.forEach((u) => { if (t >= u - 0.07 && t < u + 0.3) p = Math.max(p, Math.sin(Math.PI * k01(t, u - 0.07, 0.37))); });
  const z = 1 + 0.035 * k01(t, S.at, 4) + 0.025 * p, sh = p * 5;
  cv.save(); cv.translate(CX + Math.sin(t * 47) * sh, H / 2 + Math.cos(t * 39) * sh); cv.scale(z, z); cv.translate(-CX, -H / 2);
  S.art(t); S.lines.forEach((ln) => drawLine(ln, t, { karaoke: S.karaoke })); cv.restore();
}
function frame(t) {
  let i = 0; SCENES.forEach((s, k) => { if (t >= s.at) i = k; });
  const S = SCENES[i], e = t - S.at;
  if (i > 0 && e < WIPE && S.wipe !== 'none') {
    drawScene(i - 1, t); const k = oCub(e / WIPE); cv.save(); cv.beginPath();
    if (S.wipe === 'slash') { const x = lerp(W + 700, -700, k); cv.moveTo(x, 0); cv.lineTo(x + 2400, 0); cv.lineTo(x + 2400 - 700, H); cv.lineTo(x - 700, H); }
    else if (S.wipe === 'iris') cv.arc(CX, H / 2, k * 1200, 0, Math.PI * 2);
    else if (S.wipe === 'up') cv.rect(0, H * (1 - k), W, H * k);
    else cv.rect(0, 0, W, H);
    cv.clip(); drawScene(i, t); cv.restore();
    if (S.wipe === 'cut' && e < 0.08) { cv.fillStyle = `rgba(255,255,255,${0.5 * (1 - e / 0.08)})`; cv.fillRect(0, 0, W, H); }
  } else drawScene(i, t);
  // the grain and a soft vignette
  if (GRAIN) { cv.save(); cv.globalCompositeOperation = 'overlay'; const ox = (rnd(Math.floor(t * 30)) * 256) | 0, oy = (rnd(Math.floor(t * 30) + 7) * 256) | 0; cv.translate(-ox, -oy); cv.fillStyle = cv.createPattern(GRAIN, 'repeat'); cv.fillRect(0, 0, W + 256, H + 256); cv.restore(); }
  const v = cv.createRadialGradient(CX, H / 2, H * 0.3, CX, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.28)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
  // progress
  const pk = cl(t / END); cv.fillStyle = 'rgba(128,128,128,0.25)'; cv.fillRect(0, 0, W, 8); cv.fillStyle = LIME; cv.fillRect(W * (1 - pk), 0, W * pk, 8);
}
window.DURATION = DUR; window.seek = (t) => frame(t);
window.cover = () => { frame(ws(6) + 0.5); cv.fillStyle = INK; cv.fillRect(0, 0, W, 8); };
window.addEventListener('load', async () => {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  await Promise.all([...Object.entries(window.IMGS).map(async ([k, s]) => { IMG[k] = await load(s); }), (async () => { IMG.icon = await load(window.LOGO.icon); IMG.word = await load(window.LOGO.word); })()]);
  GRAIN = grainTex(); frame(0); window.ready = true;
});
