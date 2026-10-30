// k11 · «وین‌ریت استراتژیم ۶۰ درصد بود… پس چرا چالش پراپمو سوزوندم؟», in q2's colour-block language (the «۲۰۰ درصد» reel,
// past 10k views): full-bleed blocks (paper, ink, violet, lime, red, and the ink/paper split) that wipe into each other on
// the beat, huge words placed anywhere on the frame as they are spoken, one bold symbol per idea, and a punch-in on the
// hard moments. The same voice, math and real screens as the kinetic cut (story.js):
//   - a 60% win-rate ring and a prop challenge card that burns;
//   - a calculator typing «۶۰٪»;
//   - ten trades with four losses, evenly spread («انتظار»), then bunched («واقعیت»);
//   - 200 sample trades at 60% and «۷۰٪» huge under them;
//   - five red dots lighting up one by one for «۵ تا ضرر پشت‌سرهم»;
//   - the 2% drawdown staircase to −10%, the common prop limit and «حساب بسته شد»;
//   - the ink/paper split for «استراتژیت خراب نبود / ریسکت خراب بود»;
//   - the 1% staircase stopping at −5%;
//   - a readout waiting for «چنده؟», «حدس» blurred and struck over a crisp «بک‌تست»;
//   - f1's real gold replay;
//   - the real Analytics losers box and Monte Carlo card, ringed;
//   - the risk slider, «خرید چالش», and the end card.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 800–900. Key content inside y 230–1480.
const W = 1080, H = 1920, CX = 540;
const PAPER = '#F3F0FA', INKD = '#100C1C', INKP = '#1A1430', VIO = '#6C47FF', LIME = '#C6F24E', G = '#16B37A', R = '#F0435B', AMB = '#FFB020';
const WHITE = '#FFFFFF', MP = '#6B6489', MD = '#9C95B8', PLATE = '#1D1730';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
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
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const pct = (v) => fa(String(v).replace('.', '٫')) + '٪';
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800 }); return w; }
function trace(pts, k, col, lw) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L;
  cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(...pts[0]); let end = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; cv.lineTo(...end); left -= seg[i]; }
  cv.stroke(); cv.restore(); return end;
}
function shadowed(fn, blur = 40, dy = 14, a = 0.25) { cv.save(); cv.shadowColor = `rgba(0,0,0,${a})`; cv.shadowBlur = blur; cv.shadowOffsetY = dy; fn(); cv.restore(); }
const popIn = (t, t0, fn, x = 0, y = 0, z = 0.55, rot = 0) => { const k = pop(t - t0 + 0.05, 13, z); if (k > 0) at(x, y, cl(k, 0, 1.2), cl(k), fn, rot); };
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 16); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function shot(key, r, x, y, w) { const h = (w * r[3]) / r[2]; shadowed(() => rrect(x - 12, y - 12, w + 24, h + 24, 26, '#15121F'), 50, 18, 0.45); rrect(x - 12, y - 12, w + 24, h + 24, 26, null, 'rgba(255,255,255,0.1)', 2); crop(key, r, x, y, w); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.7); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }

// ---------- scenes: background colour, how it wipes in, and the spoken lines (word groups) ----------
// a token: [text, word index (or [first, last]), { c: colour, hl: marker colour, ht: text colour on the marker, blur }]
// a group: { at: first word, lines: [{ y, size, c (default colour), toks }] }; a group shows until the next group starts
const SC = [
  { k: 'hook', bg: PAPER, wipe: 'none', groups: [
    { at: 0, lines: [{ y: 400, size: 104, c: INKP, toks: [['وین‌ریتِ', 0], ['استراتژیم', 1]] }, { y: 650, size: 290, c: INKP, toks: [[pct(60), [2, 3], { hl: VIO, ht: WHITE }]] }, { y: 870, size: 110, c: INKP, toks: [['بود…', 4]] }] },
    { at: 5, lines: [{ y: 370, size: 120, c: INKP, toks: [['پس', 5], ['چرا', 6, { c: VIO }]] }, { y: 520, size: 120, c: INKP, toks: [['چالش', 7], ['پراپمو', 8, { c: VIO }]] }, { y: 770, size: 220, c: INKP, toks: [['سوزوندم؟', 9, { hl: R, ht: WHITE }]] }] }] },
  { k: 'calc', bg: INKD, wipe: 'right', groups: [{ at: 10, lines: [
    { y: 470, size: 120, c: WHITE, toks: [['بیا', 10], ['یه', 11], ['حساب', 12, { c: LIME }]] },
    { y: 620, size: 120, c: WHITE, toks: [['ساده', 13], ['کنیم.', 14]] }] }] },
  { k: 'four', bg: VIO, wipe: 'iris', groups: [{ at: 15, lines: [
    { y: 330, size: 100, c: WHITE, toks: [['وین‌ریت', 15], [pct(60), [16, 17], { c: LIME }]] },
    { y: 460, size: 100, c: WHITE, toks: [['یعنی', 18], ['از', 19], ['هر', 20]] },
    { y: 590, size: 110, c: WHITE, toks: [['۱۰', 21, { c: LIME }], ['تا', 22], ['معامله،', 23]] },
    { y: 1400, size: 170, c: WHITE, toks: [['۴', 24, { hl: R, ht: WHITE }], ['تاش', 25], ['ضرره.', 26]] }] }] },
  { k: 'spread', bg: INKD, wipe: 'up', groups: [{ at: 27, lines: [
    { y: 330, size: 110, c: WHITE, toks: [['ولی', 27], ['بازار', 28, { c: LIME }]] },
    { y: 460, size: 104, c: WHITE, toks: [['این', 29], ['۴', 30, { c: R }], ['تا', 31], ['رو', 32]] },
    { y: 590, size: 104, c: WHITE, toks: [['مرتب', 33], ['پخش', 34, { hl: R, ht: WHITE }], ['نمی‌کنه.', [35, 36]]] }] }] },
  { k: 'odds', bg: LIME, wipe: 'iris', groups: [
    { at: 37, lines: [{ y: 340, size: 110, c: INKD, toks: [['توی', 37], ['۲۰۰', 38, { hl: INKD, ht: LIME }], ['تا', 39], ['معامله،', 40]] }] },
    { at: 41, lines: [{ y: 340, size: 100, c: INKD, toks: [['به', 41], ['احتمال', 42], ['بیشتر', 43], ['از', 44]] }, { y: 1330, size: 260, c: INKD, toks: [[pct(70), [45, 46], { hl: VIO, ht: WHITE }]] }] }] },
  { k: 'run', bg: INKD, wipe: 'down', groups: [{ at: 47, lines: [
    { y: 360, size: 100, c: WHITE, toks: [['حداقل', [47, 48]], ['یه', 49], ['بار', 50]] },
    { y: 640, size: 250, c: R, toks: [['۵', 51], ['تا', 52], ['ضرر', 53]] },
    { y: 890, size: 140, c: WHITE, toks: [['پشت‌سرهم', [54, 56]]] },
    { y: 1060, size: 110, c: MD, toks: [['می‌خوری.', [57, 58]]] }] }] },
  { k: 'risk2', bg: PAPER, wipe: 'left', groups: [
    { at: 59, lines: [{ y: 330, size: 104, c: INKP, toks: [['با', 59], ['ریسک', 60], [pct(2), [61, 62], { c: VIO }]] }, { y: 460, size: 104, c: INKP, toks: [['۵', 63], ['تا', 64], ['ضرر', 65, { c: R }]] }] },
    { at: 66, lines: [{ y: 340, size: 110, c: INKP, toks: [['یعنی', 66], ['حدود', 67]] }, { y: 1420, size: 200, c: INKP, toks: [[pct(10), [68, 69], { hl: R, ht: WHITE }], ['افت.', 70]] }] }] },
  { k: 'prop', bg: R, wipe: 'cut', groups: [{ at: 71, lines: [
    { y: 330, size: 110, c: WHITE, toks: [['همون', 71], ['حدی', 72], ['که', 73]] },
    { y: 460, size: 104, c: WHITE, toks: [['توی', 74], ['خیلی', 75], ['از', 76], ['پراپ‌ها', [77, 78], { hl: INKD, ht: WHITE }]] },
    { y: 1440, size: 150, c: WHITE, toks: [['حسابتو', 79], ['می‌بنده.', [80, 81]]] }] }] },
  { k: 'twist', bg: 'splitR', wipe: 'iris', groups: [{ at: 82, lines: [
    { y: 290, size: 100, c: WHITE, toks: [['یعنی', 82], ['استراتژیت', 83]] },
    { y: 460, size: 150, c: WHITE, toks: [['خراب', 84], ['نبود؛', 85, { hl: G, ht: WHITE }]] },
    { y: 1120, size: 200, c: INKP, toks: [['ریسکت', 86, { hl: R, ht: WHITE }]] },
    { y: 1320, size: 150, c: INKP, toks: [['خراب', 87], ['بود.', 88]] }] }] },
  { k: 'risk1', bg: VIO, wipe: 'iris', groups: [
    { at: 89, lines: [{ y: 330, size: 104, c: WHITE, toks: [['با', 89], ['ریسک', 90], [pct(1), [91, 92], { hl: LIME, ht: INKD }]] }, { y: 460, size: 104, c: WHITE, toks: [['همون', 93], ['۵', 94], ['تا', 95], ['ضرر', 96]] }, { y: 1420, size: 170, c: WHITE, toks: [['می‌شه', [97, 98]], [pct(5), [99, 100], { c: LIME }]] }] },
    { at: 101, lines: [{ y: 340, size: 120, c: WHITE, toks: [['و', 101], ['هنوز', 102]] }, { y: 1420, size: 160, c: WHITE, toks: [['توی', 103], ['بازی‌ای.', 104, { hl: LIME, ht: INKD }]] }] }] },
  { k: 'real', bg: PAPER, wipe: 'right', groups: [{ at: 105, lines: [
    { y: 400, size: 110, c: INKP, toks: [['ولی', 105], ['عدد', 106], ['واقعیِ', 107, { c: VIO }]] },
    { y: 560, size: 120, c: INKP, toks: [['استراتژی', 108], ['خودت', 109]] },
    { y: 840, size: 260, c: INKP, toks: [['چنده؟', 110, { hl: VIO, ht: WHITE }]] }] }] },
  { k: 'guess', bg: 'splitR', wipe: 'left', groups: [{ at: 111, lines: [
    { y: 330, size: 92, c: MD, toks: [['با', 111]] },
    { y: 560, size: 210, c: MD, toks: [['حدس', 112, { blur: 5 }]] },
    { y: 790, size: 92, c: MD, toks: [['پیدا', 113], ['نمی‌شه؛', [114, 115]]] },
    { y: 1220, size: 160, c: INKP, toks: [['با', 116], ['بک‌تست', [117, 118], { hl: VIO, ht: WHITE }]] },
    { y: 1430, size: 100, c: INKP, toks: [['پیدا', 119], ['می‌شه.', [120, 121]]] }] }] },
  { k: 'lab', bg: INKD, wipe: 'up', groups: [{ at: 122, lines: [
    { y: 290, size: 100, c: WHITE, toks: [['توی', 122], ['بک‌تست‌لب', [123, 125], { c: LIME }]] },
    { y: 410, size: 96, c: WHITE, toks: [['استراتژیتو', 126], ['روی', 127]] },
    { y: 1460, size: 92, c: WHITE, toks: [['بازار', 128], ['واقعیِ', 129], ['گذشته', 130, { hl: LIME, ht: INKD }], ['تست', 131], ['می‌کنی،', [132, 133]]] }] }] },
  { k: 'analytics', bg: LIME, wipe: 'iris', groups: [
    { at: 134, lines: [{ y: 290, size: 92, c: INKD, toks: [['و', 134], ['آنالیزش', 135, { c: VIO }], ['بهت', 136], ['می‌گه', [137, 138]]] }, { y: 410, size: 104, c: INKD, toks: [['بیشترین', 139], ['ضررهای', 140, { hl: R, ht: WHITE }]] }, { y: 530, size: 96, c: INKD, toks: [['پشت‌سرهمت', [141, 142]], ['چندتاست', [143, 144]]] }] },
    { at: 145, lines: [{ y: 330, size: 110, c: INKD, toks: [['و', 145], ['بدترین', 146], ['افتت', 147, { hl: R, ht: WHITE }]] }, { y: 470, size: 110, c: INKD, toks: [['چقدره.', 148]] }] }] },
  { k: 'first', bg: INKD, wipe: 'right', groups: [
    { at: 149, lines: [{ y: 360, size: 140, c: WHITE, toks: [['اول', 149, { hl: LIME, ht: INKD }], ['ریسکتو', 150]] }, { y: 540, size: 110, c: WHITE, toks: [['اینجا', 151], ['تنظیم', 152], ['کن،', 153]] }] },
    { at: 154, lines: [{ y: 360, size: 140, c: WHITE, toks: [['بعد', 154, { hl: LIME, ht: INKD }], ['پول', 155]] }, { y: 540, size: 110, c: WHITE, toks: [['چالش', 156], ['رو', 157], ['بده.', 158]] }] }] },
  { k: 'cta', bg: VIO, wipe: 'iris', groups: [] },
];
SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; });
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);

// the wipe of a scene's background over the previous one
const WIPE = 0.32;
function bgFill(bg, x, y, w, h) {
  if (bg === 'splitR') { cv.save(); cv.beginPath(); cv.rect(x, y, w, h); cv.clip(); cv.fillStyle = INKD; cv.fillRect(0, 0, W, 960); cv.fillStyle = PAPER; cv.fillRect(0, 960, W, H - 960);
    cv.strokeStyle = 'rgba(26,20,48,0.07)'; cv.lineWidth = 2; for (let gx = 0; gx <= W; gx += 60) { cv.beginPath(); cv.moveTo(gx, 960); cv.lineTo(gx, H); cv.stroke(); } for (let gy = 960; gy <= H; gy += 60) { cv.beginPath(); cv.moveTo(0, gy); cv.lineTo(W, gy); cv.stroke(); }
    cv.restore(); return; }
  cv.fillStyle = bg; cv.fillRect(x, y, w, h);
}
function wipeK(s, t) { if (s.wipe === 'none') return 1; if (s.wipe === 'cut') return t < s.t0 ? 0 : 1; return exIO(k01(t, s.t0 - 0.06, WIPE)); }
function clipTo(s, k) {
  cv.beginPath();
  if (s.wipe === 'right') cv.rect(W * (1 - k), 0, W * k, H);
  else if (s.wipe === 'left') cv.rect(0, 0, W * k, H);
  else if (s.wipe === 'up') cv.rect(0, H * (1 - k), W, H * k);
  else if (s.wipe === 'down') cv.rect(0, 0, W, H * k);
  else if (s.wipe === 'iris') cv.arc(CX, 960, k * 2300, 0, Math.PI * 2);
  else cv.rect(0, 0, W, H);
  cv.clip();
}
// the spoken words: each token lands (a spring from 0.8×) as its word starts; the reel's first line is there from frame 0
function words(s, t) {
  s.groups.forEach((g, gi) => {
    const next = s.groups[gi + 1], gEnd = next ? ws(next.at) - 0.08 : s.t1 + 0.4, opening = s === SC[0] && gi === 0;
    if (t < ws(g.at) - 0.3 && !opening) return; if (t > gEnd) return;
    const gOut = next ? k01(t, gEnd - 0.1, 0.1) : 0;
    g.lines.forEach((ln) => {
      const gap = measure(' ', ln.size) * 1.45, wds = ln.toks.map(([x]) => measure(x, ln.size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.toks.length - 1);
      const sc = Math.min(1, (ln.max ?? 940) / total); let right = CX + (total * sc) / 2;
      ln.toks.forEach(([x, wi, o = {}], j) => {
        const st = opening && ln === g.lines[0] ? -1 : ws(wIdx(wi)) - 0.05, d = t - st, wpx = wds[j] * sc;
        if (d < 0) { right -= wpx + gap * sc; return; }
        const k = pop(d, 22, 0.62), a = cl(d / 0.08) * (1 - gOut), s2 = st < 0 ? 1 : lerp(0.8, 1, k);
        cv.save(); cv.globalAlpha = a; cv.translate(right - wpx / 2, ln.y); cv.scale(sc * s2, sc * s2);
        if (o.hl) { const hk = cub(k01(t, st + 0.05, 0.2)), mw = wds[j] + ln.size * 0.4; cv.save(); cv.rotate(-0.025); rrect(mw / 2 - mw * hk, -ln.size * 0.62, mw * hk, ln.size * 1.22, 18, o.hl); cv.restore(); }
        txt(x, 0, 0, ln.size, o.hl ? o.ht : o.c ?? ln.c, { blur: o.blur ? o.blur + Math.sin(t * 6) * 1.5 : 0 });
        cv.restore(); right -= wpx + gap * sc;
      });
    });
  });
}

// ---------- the symbols ----------
/** The win-rate ring: 60% green, 40% red; `light` for paper. */
function donut(r, k, light) {
  cv.save(); cv.lineWidth = r * 0.24; cv.lineCap = 'butt';
  cv.strokeStyle = light ? rgba(INKP, 0.08) : 'rgba(255,255,255,0.08)'; cv.beginPath(); cv.arc(0, 0, r, 0, Math.PI * 2); cv.stroke();
  const a0 = -Math.PI / 2, T6 = 0.6 * Math.PI * 2;
  cv.strokeStyle = G; cv.beginPath(); cv.arc(0, 0, r, a0, a0 + T6 * k); cv.stroke();
  cv.strokeStyle = R; cv.beginPath(); cv.arc(0, 0, r, a0 + T6, a0 + T6 + 0.4 * Math.PI * 2 * k); cv.stroke(); cv.restore();
  txt(pct(60), 0, -6, r * 0.62, light ? INKP : WHITE); txt('وین‌ریت', 0, r * 0.42, r * 0.2, light ? MP : MD, { w: 800 });
}
/** The prop challenge card; burn 0→1 tints it red and stamps «سوخت». */
function challenge(t, burn) {
  shadowed(() => rrect(-190, -150, 380, 300, 34, PLATE), 40, 14, 0.3);
  chip('چالش پراپ', 0, -88, 34, INKD, LIME);
  shadowed(() => circle(0, 30, 62, AMB), 20, 6, 0.3); txt('$', 0, 34, 70, INKD, { w: 900 });
  if (burn > 0) {
    cv.save(); cv.globalAlpha *= cl(burn) * 0.55; rrect(-190, -150, 380, 300, 34, R); cv.restore();
    for (let i = 0; i < 7; i++) { const x = -160 + i * 53, h = (40 + 30 * Math.sin(t * 13 + i * 1.7)) * cl(burn); cv.fillStyle = i % 2 ? AMB : R; cv.beginPath(); cv.moveTo(x - 22, 150); cv.quadraticCurveTo(x - 10, 150 - h * 0.6, x, 150 - h); cv.quadraticCurveTo(x + 10, 150 - h * 0.6, x + 22, 150); cv.closePath(); cv.fill(); }
    const ks = pop(burn * 0.8, 16, 0.5); at(0, 10, lerp(1.8, 1, cl(ks)), cl(ks * 3), () => { shadowed(() => rrect(-150, -56, 300, 112, 20, R), 30, 8, 0.4); rrect(-138, -44, 276, 88, 14, null, WHITE, 5); txt('سوخت', 0, 6, 72, WHITE); }, -0.14);
  }
}
/** A trade tile: 0 = not shown yet (grey), 1 = win (✓), −1 = loss (✕). */
function tile(s, res, light) {
  rrect(-s / 2, -s / 2, s, s, s * 0.22, res === 0 ? (light ? rgba(INKP, 0.1) : 'rgba(255,255,255,0.14)') : res > 0 ? G : R);
  if (res > 0) { cv.save(); cv.strokeStyle = WHITE; cv.lineWidth = s * 0.12; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-s * 0.2, 0); cv.lineTo(-s * 0.05, s * 0.15); cv.lineTo(s * 0.22, -s * 0.15); cv.stroke(); cv.restore(); }
  if (res < 0) { line(-s * 0.17, -s * 0.17, s * 0.17, s * 0.17, WHITE, s * 0.12); line(s * 0.17, -s * 0.17, -s * 0.17, s * 0.17, WHITE, s * 0.12); }
}
// the drawdown staircase in a chart card (drawn at the origin, 860×480): each loss drops `risk`% of the start balance
const DD_Y = (p) => -170 + p * 33;
function stairs(t, risk, t0, t1, col, n = 5, o = {}) {
  const k = cl((t - t0) / (t1 - t0)), m = Math.min(n, Math.floor(k * n + 0.0001) + (k > 0 ? 1 : 0));
  const xs = (i) => -310 + i * 120; const pts = [[-370, DD_Y(0)]];
  for (let i = 0; i < m; i++) { const x = xs(i) + 40, p0 = risk * i, p1 = risk * (i + 1), kk = cub(cl((k * n - i) * 2.5)); pts.push([x, DD_Y(p0)], [x, DD_Y(lerp(p0, p1, kk))]); if (kk >= 1) pts.push([x + (i < n - 1 ? 120 : 60), DD_Y(p1)]); }
  if (m === 0) pts.push([-310, DD_Y(0)]);
  trace(pts, 1, col, 11); const e = pts[pts.length - 1]; circle(e[0], e[1], 14, col);
  if (o.labels) for (let i = 0; i < m; i++) { const kk = cub(cl((k * n - i) * 2.5)); if (kk > 0.5) txt('−' + pct(risk), xs(i) + 86, DD_Y(risk * (i + 0.5)), 30, col, { w: 800, alpha: cub((kk - 0.5) * 2), dir: 'ltr' }); }
  return e;
}
function ddCard(fill, light) {
  shadowed(() => rrect(-430, -240, 860, 480, 36, fill), 40, 14, light ? 0.12 : 0.3);
  if (light) rrect(-430, -240, 860, 480, 36, null, rgba(INKP, 0.1), 2);
  [5, 10].forEach((p) => { line(-400, DD_Y(p), 400, DD_Y(p), light ? rgba(INKP, 0.08) : 'rgba(255,255,255,0.06)', 2); txt('−' + pct(p), 395, DD_Y(p) - 20, 26, light ? MP : MD, { align: 'right', w: 700, dir: 'ltr' }); });
}
function propLine(a, label = true) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a; line(-400, DD_Y(10), 400, DD_Y(10), R, 5, [16, 10]); if (label) chip('حد افت رایج پراپ‌ها: ' + pct(10), -170, DD_Y(10) + 40, 28, WHITE, R); cv.restore(); }

// hook: the ring from the first frame; on «چالش پراپمو» the challenge card, burning on «سوزوندم»
function hookArt(t) {
  const k = pop(t + 0.3, 12, 0.6), mv = cub(k01(t, ws(5) - 0.1, 0.45));
  at(lerp(CX, CX + 240, mv), lerp(1190, 1260, mv), lerp(1.15, 0.78, mv) * cl(k, 0, 1.1), cl(k), () => donut(200, cub(k01(t, -0.2, 0.9)), true));
  const kc = pop(t - ws(7) + 0.05, 12, 0.6);
  if (kc > 0) at(CX - 200, 1260, 1.12 * cl(kc, 0, 1.15), cl(kc), () => challenge(t, k01(t, ws(9) - 0.05, 0.4)), 0.04 * Math.sin(t * 3));
}
// «بیا یه حساب ساده کنیم»: a calculator that types «۶۰٪» and then asks
function calcArt(t) {
  const k = pop(t - T.calc - 0.1, 13, 0.65); if (k <= 0) return;
  at(CX, 1150, cl(k, 0, 1.1), cl(k), () => {
    rrect(-270, -330, 540, 660, 50, PLATE); rrect(-220, -280, 440, 150, 26, '#2A2245');
    const typed = ['۶', '۶۰', '۶۰٪'], n = Math.min(3, Math.floor((t - ws(12)) / 0.12) + 1);
    if (n > 0) txt(t >= ws(14) ? '۶۰٪ = ؟' : typed[n - 1], 190, -205, 76, LIME, { align: 'right', dir: 'ltr' });
    const keys = ['۷', '۸', '۹', '÷', '۴', '۵', '۶', '×', '۱', '۲', '۳', '−', '۰', '٪', '=', '+'];
    keys.forEach((s, i) => { const r = Math.floor(i / 4), c = i % 4, x = -165 + c * 110, y = -50 + r * 100;
      const press = [['۶', ws(12)], ['۰', ws(12) + 0.12], ['٪', ws(12) + 0.24], ['=', ws(14)]].find(([kk, st]) => kk === s && t >= st && t < st + 0.11);
      rrect(x - 46, y - 40, 92, 80, 20, press ? LIME : s === '=' ? VIO : '#2A2245'); txt(s, x, y + 3, 44, press ? INKD : WHITE); });
  });
}
// «از هر ۱۰ تا معامله، ۴ تاش ضرره»: ten tiles; the four losses turn red on «۴»
const EVEN = [1, 1, -1, 1, -1, 1, 1, -1, 1, -1];
function fourArt(t) {
  for (let i = 0; i < 10; i++) {
    const k = pop(t - ws(21) - i * 0.05, 14, 0.55); if (k <= 0) continue;
    const c = i % 5, r = Math.floor(i / 5), x = CX + 340 - c * 170, y = 860 + r * 190, ts = ws(24) - 0.05 + (EVEN[i] < 0 ? 0 : 0.25), rev = t >= ts;
    at(x, y, cl(k, 0, 1.2) * (rev ? lerp(1.15, 1, cub(k01(t, ts, 0.25))) : 1), cl(k), () => shadowed(() => tile(150, rev ? EVEN[i] : 0), 24, 8, 0.2));
  }
}
// «ولی بازار این ۴ تا رو مرتب پخش نمی‌کنه»: expected (spread) vs real (bunched)
const SLOT = (() => { const w = [0, 1, 2, 7, 8, 9], l = [3, 4, 5, 6]; let wi = 0, li = 0; return EVEN.map((v) => (v > 0 ? w[wi++] : l[li++])); })();
function spreadArt(t) {
  const X = (i) => CX + 378 - i * 84, k1 = pop(t - T.spread - 0.05, 12, 0.6);
  if (k1 > 0) at(0, 860, 1, cl(k1), () => { EVEN.forEach((v, i) => at(X(i), 0, 1, 1, () => tile(70, v))); popIn(t, ws(33), () => chip('انتظار', 0, 0, 36, INKD, rgba(WHITE, 0.85)), CX, -100); });
  const k2 = pop(t - ws(34) + 0.1, 12, 0.6); if (k2 <= 0) return;
  const km = cub(k01(t, ws(34) + 0.05, 0.6));
  at(0, 1160, 1, cl(k2), () => {
    EVEN.forEach((v, i) => at(lerp(X(i), X(SLOT[i]), km), -80 * (1 - cl(k2)), 1, 1, () => tile(70, v)));
    const kr = cub(k01(t, ws(35) + 0.3, 0.35)); if (kr > 0) { cv.save(); cv.globalAlpha *= kr; cv.shadowColor = rgba(R, 0.8); cv.shadowBlur = 20; rrect(X(6) - 52, -52, X(3) - X(6) + 104, 104, 30, null, R, 7); cv.restore(); }
    popIn(t, ws(35), () => chip('واقعیت', 0, 0, 36, WHITE, R), CX, 115);
  });
}
// «توی ۲۰۰ تا معامله…»: 200 sample trades at 60% fill a grid; «۷۰٪» lands huge under it
const SEQ = (() => { const s = Array.from({ length: 200 }, (_, i) => (rnd(i * 7.13 + 3) < 0.4 ? -1 : 1)); s[125] = 1; for (let i = 126; i <= 130; i++) s[i] = -1; s[131] = 1; return s; })();
function oddsArt(t) {
  const t0 = ws(38) - 0.05, t1 = ws(40) + 0.6, f = cl((t - t0) / (t1 - t0)), io = f < 0.5 ? 4 * f ** 3 : 1 - Math.pow(-2 * f + 2, 3) / 2, n = Math.floor(io * 200 + 0.0001);
  const k = pop(t - T.odds - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 820, lerp(0.92, 1, cl(k)), cl(k), () => {
    shadowed(() => rrect(-460, -260, 920, 520, 36, INKD), 40, 14, 0.3);
    for (let i = 0; i < n; i++) { const c = i % 20, r = Math.floor(i / 20); circle(399 - c * 42, -189 + r * 42, 15, SEQ[i] > 0 ? G : R); }
    chip('نمونه', -360, -225, 24, MD, 'rgba(255,255,255,0.08)');
  });
  const kn = cub(k01(t, ws(45), 0.3)); if (kn > 0) txt('فرض: وین‌ریت ' + pct(60) + ' و معامله‌های مستقل؛ احتمال دقیق: ' + pct(71.4), CX, 1110, 28, '#3E4D12', { w: 700, alpha: kn });
}
// «حداقل یه بار ۵ تا ضرر پشت‌سرهم»: a row of trades, five losses light up in a row, one per word
const ROW = [1, -1, 1, 1, 0, 0, 0, 0, 0, 1, -1, 1];
function runArt(t) {
  const k = pop(t - T.run - 0.05, 12, 0.6); if (k <= 0) return;
  const lit = (j) => lerp(ws(51) - 0.05, ws(57), j / 4);
  at(0, 1300, 1, cl(k), () => {
    ROW.forEach((v, i) => { const x = CX + 440 - i * 80, j = i - 4;
      if (v) { circle(x, 0, 30, v > 0 ? rgba(G, 0.55) : rgba(R, 0.4)); return; }
      const q = pop(t - lit(j), 16, 0.5); circle(x, 0, 32, 'rgba(255,255,255,0.12)'); if (q > 0) at(x, 0, cl(q, 0, 1.3), cl(q), () => { circle(0, 0, 34, R); line(-11, -11, 11, 11, WHITE, 7); line(11, -11, -11, 11, WHITE, 7); }); });
    const kr = cub(k01(t, ws(57) + 0.1, 0.35)); if (kr > 0) { cv.save(); cv.globalAlpha *= kr; cv.shadowColor = rgba(R, 0.8); cv.shadowBlur = 20; rrect(CX + 440 - 8 * 80 - 50, -50, 4 * 80 + 100, 100, 50, null, R, 7); cv.restore(); }
  });
}
// «با ریسک ۲ درصد، ۵ تا ضرر یعنی حدود ۱۰ درصد افت»: the staircase on paper
function risk2Art(t) {
  const k = pop(t - T.risk2 - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 900, 1.12 * lerp(0.92, 1, cl(k)), cl(k), () => { ddCard(WHITE, true); chip('ریسک ' + pct(2), 300, -195, 30, WHITE, VIO); stairs(t, 2, ws(63) - 0.05, ws(66), R, 5, { labels: true }); });
}
// «همون حدی که توی خیلی از پراپ‌ها حسابتو می‌بنده»: the prop limit, the account closed
function propArt(t) {
  at(CX, 920, 1.12, 1, () => {
    ddCard(INKD); chip('ریسک ' + pct(2), 300, -195, 30, INKD, LIME); stairs(t, 2, -10, -9, R, 5, { labels: true }); propLine(cub(k01(t, ws(72), 0.4)));
    const kb = pop(t - ws(80) - 0.05, 14, 0.5);
    if (kb > 0) at(60, -40, lerp(1.8, 1, cl(kb)), cl(kb * 3), () => { const w = measure('حساب بسته شد', 64) + 90; shadowed(() => rrect(-w / 2, -60, w, 120, 24, R), 30, 10, 0.5); rrect(-w / 2 + 12, -48, w - 24, 96, 16, null, WHITE, 5); txt('حساب بسته شد', 0, 6, 64, WHITE); }, -0.1);
  });
}
// «استراتژیت خراب نبود؛ ریسکت خراب بود»: the ink half gets a check, the paper half a cross
function twistArt(t) { check(CX, 700, 86, G, pop(t - ws(85) + 0.02, 13, 0.5)); cross(CX, 1520, 74, R, pop(t - ws(87) + 0.02, 13, 0.5)); }
// «با ریسک ۱ درصد…»: the 1% staircase stops at −5%, well above the limit
function risk1Art(t) {
  const k = pop(t - T.risk1 - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 900, 1.12 * lerp(0.92, 1, cl(k)), cl(k), () => {
    ddCard(INKD); propLine(1, false);
    cv.save(); cv.globalAlpha *= 0.45; stairs(t, 2, -10, -9, R, 5); cv.restore();
    const e = stairs(t, 1, ws(93), ws(98), G, 5, { labels: true });
    chip('ریسک ' + pct(2), 300, -195, 26, WHITE, rgba(R, 0.7)); chip('ریسک ' + pct(1), 140, -195, 26, WHITE, G);
    check(e[0] + 62, e[1] - 50, 34, G, pop(t - ws(103), 13, 0.5));
  });
}
// «عدد واقعیِ استراتژی خودت چنده؟»: a readout waiting for its number
function realArt(t) {
  const k = pop(t - ws(106) + 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 1220, cl(k, 0, 1.12), cl(k), () => {
    shadowed(() => rrect(-300, -150, 600, 300, 44, INKD), 40, 14, 0.3);
    txt('بدترین افت', 0, -90, 36, MD, { w: 800 }); txt('بیشترین ضررهای پشت‌سرهم', 0, 90, 30, MD, { w: 800 });
    txt(Math.floor(t * 2.5) % 2 ? '؟' : '', 0, 2, 110, LIME);
  });
}
// «جوابش با حدس پیدا نمی‌شه»: «حدس» struck out on the ink half, a die that stops rolling
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function guessArt(t) {
  const kd = pop(t - T.guess - 0.05, 12, 0.6);
  if (kd > 0) at(890, 330, 0.5 * cl(kd, 0, 1.15), cl(kd), () => { const face = t < ws(113) ? 1 + Math.floor(rnd(Math.floor(t * 12)) * 6) : 5;
    shadowed(() => rrect(-120, -120, 240, 240, 46, WHITE), 30, 10, 0.4); PIPS[face].forEach(([x, y]) => circle(x * 62, y * 62, 22, INKD)); }, roll(t));
  const k = cub(k01(t, ws(114) + 0.05, 0.3)), w = measure('حدس', 210) + 60; if (k > 0) line(CX + w / 2, 560, CX + w / 2 - w * k, 560, R, 16);
}
const roll = (t) => (t < ws(113) ? Math.sin(t * 9) * 0.3 : 0.12);
// «توی بک‌تست‌لب… روی بازار واقعیِ گذشته» (f1: the gold replay)
const RR = [520, 200, 560, 620], DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function labArt(t) {
  const k = pop(t - T.lab - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 900, lerp(0.92, 1, cl(k)), cl(k), () => {
    const w = 660, x = -330, y = -380, h = shot(FLIP(t, T.lab, T.analytics + 0.3, DK), RR, x, y, w);
    if (IMG.icon) popIn(t, ws(123), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; cv.drawImage(IMG.icon, -60, -60, 120, 120); }, x + w, y, 0.5);
    txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', 0, y + h + 50, 28, 'rgba(255,255,255,0.75)', { w: 700 });
  });
}
// «آنالیزش بهت می‌گه…» (Analytics: f1's losers box, k1's Monte Carlo card)
const RWL = [36, 196, 556, 266], QWL = [50, 378, 530, 30], RMC = [325, 605, 545, 92], QMC = [331, 619, 260, 68];
function analyticsArt(t) {
  const k = pop(t - T.analytics - 0.05, 12, 0.6); if (k <= 0) return;
  const x = CX - 450, w = 900, y = 650;
  at(0, (1 - cl(k)) * 60, 1, cl(k), () => { const h = shot('wl', RWL, x, y, w); ringIn(RWL, QWL, x, y, w, cub(k01(t, ws(139), 0.35))); });
  const k2 = pop(t - ws(145) + 0.1, 12, 0.6);
  if (k2 > 0) at(0, (1 - cl(k2)) * 50, 1, cl(k2), () => { const y2 = y + (w * RWL[3]) / RWL[2] + 70, h2 = shot('mc', RMC, x, y2, w); ringIn(RMC, QMC, x, y2, w, cub(k01(t, ws(146), 0.35)));
    txt('صفحه‌ی واقعی بک‌تست‌لب · آنالیز', CX, y2 + h2 + 50, 28, '#3E4D12', { w: 700 }); });
}
// «اول ریسکتو اینجا تنظیم کن، بعد پول چالش رو بده»: the risk slider from 2% to 1%, then «خرید چالش»
const SL = [[0.5, 300], [1, 100], [2, -100], [3, -300]];
function firstArt(t) {
  const k = pop(t - T.first - 0.05, 12, 0.6); if (k <= 0) return;
  at(CX, 860, cl(k, 0, 1.12), cl(k), () => {
    shadowed(() => rrect(-440, -150, 880, 300, 40, PLATE), 40, 14, 0.3);
    chip('۱', 360, -88, 32, INKD, LIME); txt('ریسک هر معامله', 308, -88, 38, WHITE, { align: 'right' });
    rrect(-340, 10, 680, 22, 11, 'rgba(255,255,255,0.18)');
    SL.forEach(([v, x]) => txt(pct(v), x, 84, 30, 'rgba(255,255,255,0.8)', { w: 800 }));
    const km = cub(k01(t, ws(151), ws(153) - ws(151) + 0.1)), kx = lerp(-100, 100, km);
    rrect(kx, 10, 340 - kx, 22, 11, LIME); shadowed(() => circle(kx, 21, 34, WHITE), 20, 6, 0.35); circle(kx, 21, 13, km >= 1 ? G : R);
  });
  const k2 = pop(t - ws(154) + 0.05, 12, 0.6); if (k2 <= 0) return;
  at(CX, 1220, cl(k2, 0, 1.12), cl(k2), () => {
    shadowed(() => rrect(-440, -120, 880, 240, 40, PLATE), 40, 14, 0.3);
    chip('۲', 360, -58, 32, INKD, LIME); txt('خرید چالش', 308, -58, 44, WHITE, { align: 'right' });
    shadowed(() => circle(-310, 0, 60, AMB), 16, 5, 0.3); txt('$', -310, 4, 66, INKD);
    check(-310, -76, 32, G, pop(t - ws(158), 13, 0.5));
  });
}
// the end card: «شروعش رایگانه», then «لینک توی بیو», as they are said
function endCard(t) {
  const ki = pop(t - T.cta + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 640, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, T.cta + 0.2, 0.35));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 830 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - ws(160) + 0.05, 14, 0.55);
  if (kf > 0) at(CX, 1090, cl(kf, 0, 1.25), cl(kf), () => chip('شروعش رایگانه', 0, 0, 58, INKD, LIME));
  const kb = pop(t - ws(161) + 0.05, 14, 0.6), pulse = 1 + 0.04 * Math.sin((t - ws(161)) * 6) * (t > ws(161) + 1 ? 1 : 0);
  if (kb > 0) at(CX, 1260, cl(kb, 0, 1.2) * pulse, cl(kb), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, VIO); });
  const ka = cub(k01(t, ws(161) + 0.5, 0.4));
  if (ka > 0) { const y = 1410 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha = ka; cv.strokeStyle = WHITE; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 34, y + 20); cv.lineTo(CX, y - 14); cv.lineTo(CX + 34, y + 20); cv.stroke(); cv.restore(); }
}

const ART = { hook: hookArt, calc: calcArt, four: fourArt, spread: spreadArt, odds: oddsArt, run: runArt, risk2: risk2Art, prop: propArt, twist: twistArt,
  risk1: risk1Art, real: realArt, guess: guessArt, lab: labArt, analytics: analyticsArt, first: firstArt, cta: endCard };

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  // a punch-in on the hard moments: «سوزوندم», the five losses, «می‌بنده», «ریسکت», «حدس» struck out
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(ws(9), 10) + sh(ws(51), 10) + sh(ws(80), 14) + sh(ws(86), 10) + sh(ws(114), 6), 0);
  SC.forEach((s, i) => {
    if (t < s.t0 - 0.1) return;
    const nextBg = SC.slice(i + 1).find((x) => x.wipe !== 'none'); if (nextBg && t > nextBg.t0 + WIPE) return;
    const k = wipeK(s, t); if (k <= 0) return;
    cv.save(); if (k < 1) clipTo(s, k);
    if (s.wipe !== 'none') bgFill(s.bg, 0, 0, W, H);
    const nx = SC[i + 1], live = t < s.t1 + (nx && (nx.wipe === 'none' || nx.wipe === 'cut') ? 0 : WIPE);
    if (live && ART[s.k]) ART[s.k](t);
    if (live) words(s, t);
    cv.restore();
  });
  cv.restore();
};
/** The cover: the hook, the ring and the burned challenge. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  txt('وین‌ریتم', CX, 390, 112, INKP);
  const s = pct(60), size = 260, w = measure(s, size); cv.save(); cv.translate(CX, 620); cv.rotate(-0.025); rrect(-w / 2 - 50, -size * 0.62, w + 100, size * 1.22, 26, VIO); cv.restore(); txt(s, CX, 620, size, WHITE);
  txt('پس چرا چالشم سوخت؟', CX, 870, 92, R);
  at(CX + 240, 1220, 0.78, 1, () => donut(200, 1, true));
  at(CX - 200, 1220, 1.12, 1, () => challenge(3, 1));
  rrect(CX - 330, 1500, 660, 110, 55, INKD); txt('بیا یه حساب ساده کنیم', CX, 1557, 56, WHITE);
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), loadImg('wordL', window.LOGO.wordL), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  window.seek(0); window.ready = true;
})();
