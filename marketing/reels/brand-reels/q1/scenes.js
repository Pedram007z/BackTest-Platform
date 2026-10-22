// q1 · «تریدرهای سودده قبل از هر معامله یه چیزی رو چک می‌کنن… تو نه.» on the user's take.
// A different language from the other reels: full-bleed colour blocks (paper, ink, violet, lime) that wipe into each
// other on the beat, and the words themselves as the picture: huge type that lands word by word as it is spoken, with
// a few bold symbols: a green «خرید» button the cursor stops short of (and comes back to at the end), ten «؟» for «چند
// بار از ده بار», a plunging red arrow for «ضرر», «عدد» crisp on paper over «حس» blurred on ink, a wall of tiles for
// «صدها بار», giant real gold daily candles behind an «آینده» curtain (XAUUSD, 29 Aug – 16 Sep 2025), a worked
// position-size example, a journal, two gauges, and the closing question.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 800–900. Key content inside y 230–1480.
const W = 1080, H = 1920, CX = 540;
const PAPER = '#F3F0FA', INKD = '#100C1C', INKP = '#1A1430', VIO = '#6C47FF', LIME = '#C6F24E', G = '#16B37A', R = '#F0435B', AMB = '#FFB020';
const WHITE = '#FFFFFF', MP = '#6B6489', MD = '#9C95B8', PLATE = '#1D1730';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, GOLD = D.gold;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  if (o.blur) cv.filter = `blur(${o.blur}px)`;
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800 }); return w; }
function check(x, y, s, col, k = 1) { cv.save(); cv.strokeStyle = col; cv.lineWidth = s * 0.16; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath();
  const p = [[-0.45, 0.02], [-0.12, 0.34], [0.48, -0.32]], L1 = Math.hypot(0.33, 0.32), L2 = Math.hypot(0.6, 0.66), d = k * (L1 + L2);
  cv.moveTo(x + p[0][0] * s, y + p[0][1] * s); if (d <= L1) cv.lineTo(x + lerp(p[0][0], p[1][0], d / L1) * s, y + lerp(p[0][1], p[1][1], d / L1) * s);
  else { cv.lineTo(x + p[1][0] * s, y + p[1][1] * s); const e = (d - L1) / L2; cv.lineTo(x + lerp(p[1][0], p[2][0], e) * s, y + lerp(p[1][1], p[2][1], e) * s); }
  cv.stroke(); cv.restore(); }
function cursor(x, y, s = 1) { at(x, y, s, 1, () => { cv.fillStyle = WHITE; cv.strokeStyle = INKD; cv.lineWidth = 6; cv.lineJoin = 'round'; cv.beginPath();
  cv.moveTo(0, 0); cv.lineTo(0, 92); cv.lineTo(22, 70); cv.lineTo(38, 106); cv.lineTo(54, 98); cv.lineTo(38, 63); cv.lineTo(68, 63); cv.closePath(); cv.stroke(); cv.fill(); }); }
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- scenes: background colour, how it wipes in, and the spoken lines (word groups) ----------
// a token: [text, word index (or [first, last]), { c: colour, hl: marker colour, ht: text colour on the marker, blur }]
// a group: { at: first word, lines: [{ y, size, c (default colour), toks }] }; a group shows until the next group starts
const SC = [
  { k: 'hook', bg: PAPER, wipe: 'none', groups: [{ at: 0, lines: [
    { y: 520, size: 118, c: INKP, toks: [['تریدرهای', 0], ['سودده', 1, { c: G }]] },
    { y: 680, size: 118, c: INKP, toks: [['قبل', 2], ['از', 3], ['هر', 4], ['معامله', 5]] },
    { y: 870, size: 150, c: INKP, toks: [['یه', 6], ['چیزی', 7, { hl: VIO, ht: WHITE }]] },
    { y: 1050, size: 118, c: INKP, toks: [['رو', 8], ['چک', 9], ['می‌کنن…', [10, 11]]] }] }] },
  { k: 'notyou', bg: INKD, wipe: 'right', groups: [{ at: 12, lines: [{ y: 900, size: 300, c: WHITE, toks: [['تو', 12], ['نه.', 13, { c: R }]] }] }] },
  { k: 'nots', bg: INKD, wipe: 'none', groups: [] },
  { k: 'button', bg: PAPER, wipe: 'up', groups: [{ at: 21, lines: [
    { y: 400, size: 96, c: INKP, toks: [['قبل', 21], ['از', 22], ['اینکه', [23, 24]]] },
    { y: 520, size: 96, c: INKP, toks: [['دکمه‌ی', 25], ['خرید', 26, { c: G }], ['رو', 27], ['بزنن،', 28]] }] },
    { at: 29, lines: [{ y: 460, size: 104, c: VIO, toks: [['از', 29], ['خودشون', 30], ['می‌پرسن…', [31, 32]]] }] }] },
  { k: 'tenof', bg: VIO, wipe: 'iris', groups: [{ at: 33, lines: [
    { y: 420, size: 100, c: WHITE, toks: [['این', 33], ['ستاپ', 34], ['تو', 35], ['گذشته', 36]] },
    { y: 560, size: 128, c: WHITE, toks: [['چند', 37, { c: LIME }], ['بار', 38, { c: LIME }], ['از', 39], ['ده', 40], ['بار', 41]] },
    { y: 1280, size: 116, c: WHITE, toks: [['جواب', 42], ['داده؟', 43]] }] }] },
  { k: 'loss', bg: INKD, wipe: 'down', groups: [{ at: 44, lines: [
    { y: 420, size: 100, c: MD, toks: [['و', 44], ['وقتی', 45], ['جواب', 46], ['نداده،', 47]] },
    { y: 570, size: 140, c: WHITE, toks: [['چقدر', 48], ['ضرر', 49, { c: R }], ['داشته؟', 50]] }] }] },
  { k: 'number', bg: 'split', wipe: 'left', groups: [{ at: 51, lines: [
    { y: 450, size: 92, c: MP, toks: [['جوابش', 51], ['رو', 52], ['هم', 53]] },
    { y: 640, size: 168, c: INKP, toks: [['با', 54], ['عدد', 55, { hl: VIO, ht: WHITE }], ['می‌دونن،', [56, 57]]] },
    { y: 1280, size: 168, c: MD, toks: [['نه', 58], ['با', 59], ['حس.', 60, { blur: 5 }]] }] }] },
  { k: 'hundreds', bg: VIO, wipe: 'up', groups: [{ at: 61, lines: [
    { y: 820, size: 96, c: WHITE, max: 800, toks: [['چون', 61], ['قبلاً', 62], ['همین', 63], ['ستاپ', 64], ['رو', 65]] },
    { y: 980, size: 160, c: LIME, toks: [['صدها', 66], ['بار', 67]] },
    { y: 1140, size: 96, c: WHITE, toks: [['تست', 68], ['کردن.', 69]] }] }] },
  { k: 'you', bg: LIME, wipe: 'iris', groups: [{ at: 70, lines: [
    { y: 860, size: 230, c: INKD, toks: [['تو', 70], ['هم', 71]] },
    { y: 1100, size: 230, c: INKD, toks: [['می‌تونی.', [72, 73]]] }] }] },
  { k: 'brand', bg: PAPER, wipe: 'right', groups: [{ at: 74, lines: [{ y: 600, size: 90, c: MP, toks: [['توی', 74]] }] }] },
  { k: 'replay', bg: INKD, wipe: 'up', groups: [
    { at: 77, lines: [{ y: 360, size: 96, c: WHITE, toks: [['بازار', 77], ['واقعی', 78], ['رو', 79]] }, { y: 490, size: 120, c: LIME, toks: [['کندل', 80], ['به', 81], ['کندل،', 82]] }] },
    { at: 83, lines: [{ y: 360, size: 96, c: WHITE, toks: [['بدون', 83], ['دیدن', 84], ['آینده', 85, { c: AMB }]] }, { y: 490, size: 110, c: WHITE, toks: [['دوباره', 86], ['پخش', 87], ['می‌کنی…', [88, 89]]] }] }] },
  { k: 'repeat', bg: INKD, wipe: 'none', groups: [{ at: 90, lines: [{ y: 360, size: 96, c: WHITE, toks: [['و', 90], ['ستاپت', 91], ['رو', 92]] }, { y: 490, size: 120, c: LIME, toks: [['بارها', 93], ['تست', 94], ['می‌کنی.', [95, 96]]] }] }] },
  { k: 'risk', bg: PAPER, wipe: 'left', groups: [{ at: 97, lines: [
    { y: 380, size: 96, c: INKP, toks: [['حجم', 97], ['معامله', 98], ['از', 99]] },
    { y: 510, size: 110, c: INKP, toks: [['درصد', 100], ['ریسکت', 101, { c: VIO }]] },
    { y: 640, size: 96, c: INKP, toks: [['حساب', 102], ['می‌شه.', [103, 104]]] }] }] },
  { k: 'journal', bg: VIO, wipe: 'iris', groups: [{ at: 105, lines: [
    { y: 400, size: 110, c: WHITE, toks: [['هر', 105], ['معامله', 106]] },
    { y: 540, size: 110, c: WHITE, toks: [['می‌ره', [107, 108]], ['توی', 109], ['ژورنال', 110, { c: LIME }]] }] }] },
  { k: 'stats', bg: INKD, wipe: 'down', groups: [
    { at: 111, lines: [{ y: 380, size: 96, c: WHITE, toks: [['و', 111], ['آنالیز', 112, { c: LIME }], ['بهت', 113], ['می‌گه', [114, 115]]] }, { y: 510, size: 120, c: WHITE, toks: [['وین‌ریتت', [116, 117], { c: LIME }], ['چنده', 118]] }] },
    { at: 119, lines: [{ y: 380, size: 92, c: WHITE, toks: [['و', 119], ['میانگین', 120, { c: LIME }], ['ریسک', 121], ['به', 122], ['ریواردت', 123]] }, { y: 510, size: 120, c: WHITE, toks: [['چقدره.', 124]] }] }] },
  { k: 'next', bg: PAPER, wipe: 'right', groups: [
    { at: 125, lines: [{ y: 400, size: 92, c: INKP, toks: [['دفعه‌ی', 125], ['بعد', 126], ['که', 127], ['خواستی', 128]] }, { y: 520, size: 92, c: INKP, toks: [['وارد', 129], ['معامله', 130], ['بشی،', 131]] }] },
    { at: 132, lines: [{ y: 400, size: 100, c: INKP, toks: [['فقط', 132], ['یه', 133], ['سؤال', 134, { hl: VIO, ht: WHITE }]] }, { y: 530, size: 100, c: INKP, toks: [['از', 135], ['خودت', 136], ['بپرس…', 137]] }] }] },
  { k: 'q', bg: INKD, wipe: 'cut', groups: [{ at: 138, lines: [
    { y: 820, size: 200, c: WHITE, toks: [['عددش', 138], ['رو', 139]] },
    { y: 1060, size: 200, c: LIME, toks: [['می‌دونم؟', [140, 141]]] }] }] },
  { k: 'end', bg: VIO, wipe: 'iris', groups: [] },
];
SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; });
const scene = (k) => SC.find((s) => s.k === k);
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);

// the wipe of a scene's background over the previous one
const WIPE = 0.32;
function bgFill(bg, x, y, w, h) {
  if (bg === 'split') { cv.save(); cv.beginPath(); cv.rect(x, y, w, h); cv.clip(); cv.fillStyle = PAPER; cv.fillRect(0, 0, W, 960); cv.fillStyle = INKD; cv.fillRect(0, 960, W, H - 960);
    // a fine ruler grid on the paper half: the side of numbers
    cv.strokeStyle = 'rgba(26,20,48,0.07)'; cv.lineWidth = 2; for (let gx = 0; gx <= W; gx += 60) { cv.beginPath(); cv.moveTo(gx, 0); cv.lineTo(gx, 960); cv.stroke(); } for (let gy = 0; gy <= 960; gy += 60) { cv.beginPath(); cv.moveTo(0, gy); cv.lineTo(W, gy); cv.stroke(); }
    cv.restore(); return; }
  cv.fillStyle = bg; cv.fillRect(x, y, w, h);
}
function background(s, t, origin) {
  if (s.wipe === 'none' || (s.wipe === 'cut' && t < s.t0)) return;     // 'none' shares the previous scene's ground
  const k = s.wipe === 'cut' ? 1 : exIO(k01(t, s.t0 - 0.06, WIPE));
  if (k >= 1) return bgFill(s.bg, 0, 0, W, H);
  if (k <= 0) return;
  if (s.wipe === 'right') return bgFill(s.bg, W * (1 - k), 0, W * k, H);
  if (s.wipe === 'left') return bgFill(s.bg, 0, 0, W * k, H);
  if (s.wipe === 'up') return bgFill(s.bg, 0, H * (1 - k), W, H * k);
  if (s.wipe === 'down') return bgFill(s.bg, 0, 0, W, H * k);
  if (s.wipe === 'iris') { const [ox, oy] = origin ?? [CX, 960]; cv.save(); cv.beginPath(); cv.arc(ox, oy, k * 2300, 0, Math.PI * 2); cv.clip(); bgFill(s.bg, 0, 0, W, H); cv.restore(); }
}
// the spoken words: each token lands (a spring from 0.8×) as its word starts; the hook's first line is there from frame 0
function words(s, t) {
  s.groups.forEach((g, gi) => {
    const next = s.groups[gi + 1], gEnd = next ? ws(next.at) - 0.08 : s.t1 + 0.4;
    if (t < ws(g.at) - 0.3 && !(s.k === 'hook')) return; if (t > gEnd) return;
    const gOut = next ? k01(t, gEnd - 0.1, 0.1) : 0;
    g.lines.forEach((ln) => {
      const gap = measure(' ', ln.size) * 1.45, wds = ln.toks.map(([x]) => measure(x, ln.size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.toks.length - 1);
      const sc = Math.min(1, (ln.max ?? 940) / total); let right = CX + (total * sc) / 2;
      ln.toks.forEach(([x, wi, o = {}], j) => {
        const st = s.k === 'hook' && ln === g.lines[0] ? -1 : ws(wIdx(wi)) - 0.05, d = t - st, wpx = wds[j] * sc;
        if (d < 0) { right -= wpx + gap * sc; return; }
        const k = pop(d, 22, 0.62), a = cl(d / 0.08) * (1 - gOut), s2 = st < 0 ? 1 : lerp(0.8, 1, k);   // grows into place (never wider than its slot but for the spring's few %)
        cv.save(); cv.globalAlpha = a; cv.translate(right - wpx / 2, ln.y); cv.scale(sc * s2, sc * s2);
        if (o.hl) { const hk = cub(k01(t, st + 0.05, 0.2)), mw = wds[j] + ln.size * 0.4; cv.save(); cv.rotate(-0.025); rrect(mw / 2 - mw * hk, -ln.size * 0.62, mw * hk, ln.size * 1.22, 18, o.hl); cv.restore(); }
        txt(x, 0, 0, ln.size, o.hl ? o.ht : o.c ?? ln.c, { blur: o.blur ? o.blur + Math.sin(t * 6) * 1.5 : 0 });
        cv.restore(); right -= wpx + gap * sc;
      });
    });
  });
}

// ---------- the symbols ----------
// hook: a check circle that ticks on «چک»
function hookArt(t) {
  const k = cub(k01(t, ws(9), 0.4));
  circle(CX, 1290, 92, null, rgba(INKP, 0.15), 10); if (k > 0) { circle(CX, 1290, 92, null, G, 10 * k); check(CX, 1295, 110, G, k); }
}
// «تو نه.»: nothing but the words (a shake on «نه»)
// «نه اخبار، نه اندیکاتور، نه نظر بقیه»: three rows, each struck out as it is said
function nots(t) {
  const rows = [['اخبار', 14, 15, 'news'], ['اندیکاتور', 16, 17, 'osc'], ['نظر بقیه', 18, 19, 'chat']];
  rows.forEach(([s, wn, ww, ic], i) => {
    const y = 640 + i * 260, k = pop(t - ws(wn) + 0.05, 16, 0.6); if (k <= 0) return;
    at(CX, y, cl(k, 0, 1.15), cl(k), () => {
      rrect(-440, -100, 880, 200, 40, PLATE);
      chip('نه', 330, 0, 52, WHITE, R);
      txt(s, 60, 0, 104, WHITE);
      const ix = -330;
      if (ic === 'news') { rrect(ix - 55, -45, 110, 90, 10, null, MD, 6); for (let j = 0; j < 3; j++) line(ix - 35, -20 + j * 22, ix + 35, -20 + j * 22, MD, 6); }
      if (ic === 'osc') { cv.strokeStyle = MD; cv.lineWidth = 7; cv.beginPath(); for (let x = -60; x <= 60; x += 4) { const yy = Math.sin(x * 0.08 + t * 4) * 30; x === -60 ? cv.moveTo(ix + x, yy) : cv.lineTo(ix + x, yy); } cv.stroke(); }
      if (ic === 'chat') { rrect(ix - 60, -48, 80, 56, 16, MD); rrect(ix - 10, -8, 80, 56, 16, null, MD, 6); }
      const sk = cub(k01(t, ws(ww) + 0.15, 0.25)); if (sk > 0) line(420, 0, 420 - 840 * sk, 0, R, 14);
    });
  });
}
// the green «خرید» button and the cursor that stops just short of it (button…ask, and again in next)
function buyButton(t, t0, y0 = 930, hold = false) {
  const k = pop(t - t0, 13, 0.6); if (k <= 0) return;
  const breathe = 1 + 0.015 * Math.sin(t * 3);
  at(CX, y0, cl(k, 0, 1.2) * breathe, cl(k), () => { cv.shadowColor = rgba(G, 0.45); cv.shadowBlur = 50; cv.shadowOffsetY = 20; rrect(-330, -115, 660, 230, 115, G); cv.shadowColor = 'transparent'; txt('خرید', 0, 6, 120, WHITE); });
  // the cursor glides in from the corner and stops ~60 px short, hovering
  const m = cub(k01(t, t0 + 0.5, 1.3)), cx = lerp(1150, 720, m) + (m >= 1 ? Math.sin(t * 9) * 3 : 0), cy = lerp(1620, y0 + 150, m) + (m >= 1 ? Math.cos(t * 7) * 3 : 0);
  cursor(cx, cy, 1.25);
  if (hold) { const q = pop(t - hold, 14, 0.6); if (q > 0) at(cx + 130, cy + 150, cl(q, 0, 1.2), cl(q), () => { circle(0, 0, 70, VIO); txt('؟', 0, 8, 90, WHITE); }); }
}
// ten «؟»: how many times out of ten?
function tenOf(t) {
  for (let i = 0; i < 10; i++) {
    const r = Math.floor(i / 5), c = i % 5, x = 860 - c * 170, y = 830 + r * 190, st = ws(37) + i * 0.07, k = pop(t - st, 16, 0.55); if (k <= 0) continue;
    const spin = Math.cos(Math.max(0, Math.min(1, (t - st) / 0.5)) * Math.PI * 4), pulse = t > ws(41) ? 1 + 0.06 * Math.exp(-(t - ws(41)) * 4) : 1;
    at(x, y, cl(k, 0, 1.2) * pulse, cl(k), () => { cv.save(); cv.scale(Math.max(0.05, Math.abs(spin)), 1); circle(0, 0, 70, rgba(WHITE, 0.12), WHITE, 6); txt('؟', 0, 8, 86, LIME); cv.restore(); });
  }
}
// «چقدر ضرر»: a red arrow plunging, «−؟» at the bottom
function plunge(t) {
  const k = cub(k01(t, ws(48), 0.7)); if (k <= 0) return;
  const top = 740, bot = lerp(top, 1330, k);
  cv.save(); cv.shadowColor = rgba(R, 0.5); cv.shadowBlur = 40; rrect(CX - 60, top, 120, bot - top, 20, R); cv.restore();
  cv.fillStyle = R; cv.beginPath(); cv.moveTo(CX - 130, bot - 20); cv.lineTo(CX + 130, bot - 20); cv.lineTo(CX, bot + 120); cv.closePath(); cv.fill();
  if (k > 0.8) { const a = pop(t - ws(49) - 0.2, 14); at(CX + 260, 1150, cl(a, 0, 1.2), cl(a), () => chip('−؟', 0, 0, 80, WHITE, R)); }
}
// «حس» gets struck out on the ink half
function strikeFeel(t) { const k = cub(k01(t, ws(60) + 0.2, 0.3)); if (k > 0) line(880, 1280, 880 - 720 * k, 1280, R, 16); }
// a wall of tiles filling up: hundreds of tests
function tiles(t) {
  const cols = 15, rows = 22, p = 66, x0 = (W - cols * p) / 2 + 6, y0 = 250, t0 = ws(61), t1 = ws(69) + 0.3;
  const n = Math.floor(cl((t - t0) / (t1 - t0)) * cols * rows);
  for (let i = 0; i < cols * rows; i++) { const r = Math.floor(i / cols), c = i % cols, done = i < n; rrect(x0 + c * p, y0 + r * p, p - 12, p - 12, 10, done ? rgba(WHITE, 0.85) : rgba(WHITE, 0.12)); }
  rrect(90, 700, 900, 540, 50, rgba('#2B1C7A', 0.94));
}
// giant real gold daily candles; the future hidden behind a curtain; then rewound and replayed (repeat)
function candles(t) {
  const B = GOLD.bars, N = B.length, x0 = 70, x1 = 1010, y0 = 680, y1 = 1330, step = (x1 - x0) / N, bw = step * 0.6;
  const lo = Math.min(...B.map((b) => b[2])) - 20, hi = Math.max(...B.map((b) => b[1])) + 20, Y = (p) => y1 - ((p - lo) / (hi - lo)) * (y1 - y0);
  // how many are shown: one every ~0.33 s from «کندل»; in «repeat» it rewinds to 3 and plays again, twice
  let n = Math.min(N, Math.floor((t - ws(80) + 0.2) / 0.33) + 1);
  const rp = T.repeat;
  if (t >= rp) { const c = (t - rp) % 1.15, loop = Math.floor((t - rp) / 1.15); n = c < 0.25 ? Math.round(lerp(N, 3, c / 0.25)) : Math.min(N, 3 + Math.floor((c - 0.25) / 0.08)); if (loop >= 2) n = N; }
  n = Math.max(0, n);
  for (let i = 0; i < n; i++) {
    const [o, h, l, c] = B[i], up = c >= o, col = up ? G : R, x = x0 + step * (i + 0.5), g = i === n - 1 ? cub(k01(t, ws(80) - 0.2 + i * 0.33, 0.15)) : 1;
    line(x, Y(h), x, Y(l), col, 6); cv.globalAlpha = t >= rp ? 1 : Math.max(0.3, g); rrect(x - bw / 2, Y(Math.max(o, c)), bw, Math.max(8, Math.abs(Y(o) - Y(c))), 6, col); cv.globalAlpha = 1;
  }
  // the curtain
  const fx = x0 + step * n;
  if (fx < x1) {
    rrect(fx + 8, y0 - 40, x1 + 40 - fx, y1 - y0 + 80, 28, PLATE);
    cv.save(); cv.beginPath(); cv.rect(fx + 8, y0 - 40, x1 + 40 - fx, y1 - y0 + 80); cv.clip(); cv.strokeStyle = 'rgba(255,255,255,0.06)'; cv.lineWidth = 6;
    for (let k = -900; k < 900; k += 34) { cv.beginPath(); cv.moveTo(fx + k, y1 + 60); cv.lineTo(fx + k + 700, y0 - 640); cv.stroke(); } cv.restore();
    if (x1 - fx > 200) txt('آینده', (fx + x1) / 2 + 14, (y0 + y1) / 2, 64, AMB);
  }
  txt('طلا · روزانه · شهریور ۱۴۰۴ · داده‌ی واقعی', CX, 1420, 34, MD, { w: 700 });
  // the repeat counter
  if (t >= rp) { const loop = Math.min(3, Math.floor((t - rp) / 1.15) + 1), a = pop(t - rp - (loop - 1) * 1.15, 18); at(CX, 596, cl(a, 0, 1.15), 1, () => chip(`تست ${fa(loop)}`, 0, 0, 48, INKD, LIME)); }
}
// position size from the risk: a worked example (EURUSD: $10 a pip per lot)
function riskCalc(t) {
  const k = pop(t - ws(99), 12, 0.7); if (k <= 0) return;
  at(CX, 1060, cl(k, 0, 1.1), cl(k), () => {
    rrect(-450, -330, 900, 660, 48, WHITE, rgba(VIO, 0.25), 4);
    txt('مثال · EURUSD', 400, -270, 34, MP, { align: 'right', w: 700 });
    const rows = [['موجودی', '۱۰٬۰۰۰ دلار', ws(99) + 0.1], ['ریسک ۱٪', '۱۰۰ دلار', ws(100)], ['حد ضرر', '۲۰ پیپ', ws(101)]];
    rows.forEach(([a, b, st], i) => { const r = cub(k01(t, st, 0.25)); if (r <= 0) return; const y = -180 + i * 110; cv.save(); cv.globalAlpha *= r;
      txt(a, 400, y, 52, INKP, { align: 'right', w: 800 }); txt(b, -400, y, 52, INKP, { align: 'left', w: 900 }); line(-400, y + 50, 400, y + 50, rgba(INKP, 0.08), 3); cv.restore(); });
    const res = pop(t - ws(102), 14, 0.55);
    if (res > 0) at(0, 200, cl(res, 0, 1.2), cl(res), () => { rrect(-380, -80, 760, 160, 80, VIO); txt('حجم: ۰٫۵ لات', 0, 6, 76, WHITE); });
  });
}
// the journal: a notebook page, three entries slide in, «ثبت شد»
function journal(t) {
  const k = pop(t - ws(105) - 0.1, 12, 0.7); if (k <= 0) return;
  at(CX, 1040, cl(k, 0, 1.1), cl(k), () => {
    rrect(-420, -340, 840, 680, 36, WHITE); for (let i = 0; i < 9; i++) line(-380, -250 + i * 70, 380, -250 + i * 70, rgba(VIO, 0.12), 3);
    for (let i = 0; i < 7; i++) { circle(-420, -280 + i * 95, 18, VIO); }
    txt('ژورنال معاملات', 380, -290, 44, INKP, { align: 'right' });
    const rows = [['طلا · خرید', ws(106)], ['EURUSD · فروش', ws(108)], ['نزدک · خرید', ws(110)]];
    rows.forEach(([s, st], i) => { const r = pop(t - st, 16, 0.6); if (r <= 0) return; const y = -170 + i * 140;
      cv.save(); cv.translate((1 - cl(r)) * 300, 0); cv.globalAlpha *= cl(r); rrect(-360, y - 55, 720, 110, 24, rgba(VIO, 0.08), rgba(VIO, 0.3), 3);
      txt(s, 330, y, 44, INKP, { align: 'right', w: 800 }); rrect(-330, y - 12, 220, 24, 12, rgba(INKP, 0.12)); cv.restore(); });
    const st = pop(t - ws(110) - 0.35, 14, 0.5); if (st > 0) at(-200, 260, lerp(1.8, 1, cl(st)), cl(st), () => { rrect(-150, -50, 300, 100, 20, null, G, 8); txt('ثبت شد', 0, 4, 52, G); }, -0.12);
  });
}
// two gauges: win rate and average RR; the readout waits for your own number
function gauges(t) {
  [['وین‌ریت', ws(116), 300], ['میانگین RR', ws(120), 780]].forEach(([s, st, x], i) => {
    const k = pop(t - (i ? ws(119) : ws(111)) - 0.1, 12, 0.7); if (k <= 0) return;
    at(x, 1030, cl(k, 0, 1.1), cl(k), () => {
      circle(0, 0, 200, PLATE); cv.lineWidth = 26; cv.lineCap = 'round'; cv.strokeStyle = 'rgba(255,255,255,0.1)'; cv.beginPath(); cv.arc(0, 0, 160, Math.PI * 0.8, Math.PI * 2.2); cv.stroke();
      const sw = cub(k01(t, st, 1.0)), a = Math.PI * 0.8 + Math.PI * 1.4 * (0.5 + 0.5 * Math.sin((t - st) * 5) * (1 - sw * 0.6)) * cl((t - st) * 2);
      cv.strokeStyle = LIME; cv.beginPath(); cv.arc(0, 0, 160, Math.PI * 0.8, Math.max(Math.PI * 0.8, a)); cv.stroke();
      line(0, 0, Math.cos(a) * 120, Math.sin(a) * 120, WHITE, 10); circle(0, 0, 16, WHITE);
      txt(s, 0, 250, 48, WHITE); const caret = Math.floor(t * 2.5) % 2 ? '_' : ' '; txt(caret, 0, 95, 70, LIME, { dir: 'ltr' });
    });
  });
  const a = cub(k01(t, ws(124), 0.4)); if (a > 0) txt('عدد خودت، از معامله‌های خودت', CX, 1370, 46, LIME, { alpha: a, w: 800 });
}
// the closing question, then the end card
function endCard(t) {
  const ki = pop(t - T.end + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 640, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, T.end + 0.2, 0.35));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 830 + (1 - kw) * 24, w, h); cv.restore(); }
  const kb = pop(t - ws(142) + 0.05, 14, 0.6), pulse = 1 + 0.04 * Math.sin((t - ws(142)) * 6) * (t > ws(142) + 1 ? 1 : 0);
  if (kb > 0) at(CX, 1080, cl(kb, 0, 1.2) * pulse, cl(kb), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, VIO); });
  const kf = pop(t - ws(145) + 0.05, 14, 0.55);
  if (kf > 0) at(CX, 1250, cl(kf, 0, 1.25), cl(kf), () => chip('شروعش رایگانه', 0, 0, 54, INKD, LIME));
  const ka = cub(k01(t, ws(145) + 0.5, 0.4));
  if (ka > 0) { const y = 1400 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha = ka; cv.strokeStyle = WHITE; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 34, y + 20); cv.lineTo(CX, y - 14); cv.lineTo(CX + 34, y + 20); cv.stroke(); cv.restore(); }
}

const ART = {
  hook: hookArt, nots, tenof: tenOf, loss: plunge, number: strikeFeel, hundreds: tiles,
  button: (t) => buyButton(t, ws(25), 930, ws(31)),
  brand: (t) => { const ki = pop(t - ws(75) + 0.1, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 880, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 60; cv.shadowOffsetY = 18; cv.drawImage(IMG.icon, -160, -160, 320, 320); });
    const kw = cub(k01(t, ws(75) + 0.15, 0.35)); if (kw > 0 && IMG.wordL) { const w = 620, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.wordL, CX - w / 2, 1090 + (1 - kw) * 24, w, h); cv.restore(); } },
  replay: candles, repeat: candles, risk: riskCalc, journal, stats: gauges,
  next: (t) => buyButton(t, T.next + 0.1, 930),
  q: (t) => { const a = cub(k01(t, T.q + 0.3, 0.4)); if (a > 0) { cv.save(); cv.globalAlpha = 0.5 * a; at(CX, 1370, 0.42, 1, () => { rrect(-330, -115, 660, 230, 115, G); txt('خرید', 0, 6, 120, WHITE); }); cv.restore(); cursor(700, 1400, 0.8); } },
  end: endCard,
};

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  // a punch-in on the hard moments
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(ws(13), 12) + sh(ws(49) + 0.3, 10), 0);
  SC.forEach((s, i) => {
    if (t < s.t0 - 0.1) return;
    const nextBg = SC.slice(i + 1).find((x) => x.wipe !== 'none'), hidden = nextBg && t > nextBg.t0 + WIPE;
    if (hidden) return;
    background(s, t, s.k === 'tenof' ? [760, 1080] : undefined);
    // the scene's art and words stay until the next scene's ground has covered them (at once if it shares this ground)
    const nx = SC[i + 1], live = t < s.t1 + (nx && nx.wipe === 'none' ? 0 : nx && nx.wipe === 'cut' ? 0 : WIPE);
    if (live && ART[s.k]) ART[s.k](t);
    if (live) words(s, t);
  });
  cv.restore();
};
/** The cover: the hook and the button. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  const L = [[['تریدرهای', INKP], ['سودده', G]], [['قبل از هر معامله', INKP]], [['یه چیزی', WHITE, VIO]], [['رو چک می‌کنن…', INKP]]];
  L.forEach((ln, i) => { const size = i === 2 ? 150 : 112, y = 470 + i * 150 + (i >= 2 ? 20 : 0) + (i === 3 ? 20 : 0); let total = 0; const ws_ = ln.map(([s]) => measure(s, size)), gap = measure(' ', size) * 1.2; total = ws_.reduce((a, b) => a + b, 0) + gap * (ln.length - 1); let right = CX + total / 2;
    ln.forEach(([s, c, hl], j) => { const x = right - ws_[j] / 2; if (hl) { cv.save(); cv.translate(x, y); cv.rotate(-0.025); rrect(-ws_[j] / 2 - 30, -size * 0.62, ws_[j] + 60, size * 1.22, 18, hl); cv.restore(); } txt(s, x, y, size, c); right -= ws_[j] + gap; }); });
  at(CX, 1220, 0.75, 1, () => { cv.shadowColor = rgba(G, 0.45); cv.shadowBlur = 50; cv.shadowOffsetY = 20; rrect(-330, -115, 660, 230, 115, G); cv.shadowColor = 'transparent'; txt('خرید', 0, 6, 120, WHITE); });
  cursor(735, 1300, 1.1);
  rrect(CX - 230, 1430, 460, 100, 50, INKD); txt('تو نه.', CX, 1482, 60, WHITE);
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), loadImg('wordL', window.LOGO.wordL)]);
  window.seek(0); window.ready = true;
})();
