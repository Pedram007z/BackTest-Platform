// q3 · «یکی بهت سیگنال با ۹۰ درصد سود ماهانه می‌فروشه؟» on the user's take, in q1/q2's language: full-bleed colour
// blocks that wipe on the beat, huge words that land as they are spoken, and one symbol per idea: a «سیگنال VIP · ۹۰٪»
// ad card; three numbered questions; ten winning trades that turn out to be 10 of 200 (an example); a screenshot of
// three green months that zooms out to a year with its red months (an example); ×1.9 a month for twelve months,
// $1,000 → $2,213,315; «می‌فروشه؟» on lime; the ad stamped «تست‌نشده»; real NAS100 monthly candles 2015–2026; two
// gauges waiting for your own numbers; «عدد» crisp over «اسکرین‌شات» struck out; the end card with a share prompt.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 800–900. Key content inside y 230–1480.
// Built from q2's engine (time, drawing, wipes, words): only the scenes and the symbols are new.
const W = 1080, H = 1920, CX = 540;
const PAPER = '#F3F0FA', INKD = '#100C1C', INKP = '#1A1430', VIO = '#6C47FF', LIME = '#C6F24E', G = '#16B37A', R = '#F0435B', AMB = '#FFB020';
const WHITE = '#FFFFFF', MP = '#6B6489', MD = '#9C95B8', PLATE = '#1D1730';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, CHART = D.chart;
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
const money = (n) => fa(Math.round(n).toLocaleString('en-US')).replace(/,/g, '٬');
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800 }); return w; }
/** A polyline drawn up to fraction k of its length. */
function trace(pts, k, col, lw) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L;
  cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(...pts[0]); let end = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; cv.lineTo(...end); left -= seg[i]; }
  cv.stroke(); cv.restore(); return end;
}
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- scenes: background colour, how it wipes in, and the spoken lines (word groups) ----------
// a token: [text, word index (or [first, last]), { c: colour, hl: marker colour, ht: text colour on the marker, blur }]
// a group: { at: first word, lines: [{ y, size, c (default colour), toks }] }; a group shows until the next group starts
const SC = [
  { k: 'hook', bg: PAPER, wipe: 'none', groups: [{ at: 0, lines: [
    { y: 400, size: 112, c: INKP, toks: [['یکی', 0], ['بهت', 1]] },
    { y: 590, size: 200, c: INKP, toks: [['سیگنال', 2, { hl: VIO, ht: WHITE }]] },
    { y: 800, size: 108, c: INKP, toks: [['با', 3], ['۹۰', 4, { c: G }], ['درصد', 5, { c: G }], ['سود', 6], ['ماهانه', 7]] },
    { y: 950, size: 120, c: INKP, toks: [['می‌فروشه؟', [8, 9]]] }] }] },
  { k: 'three', bg: INKD, wipe: 'right', groups: [{ at: 10, lines: [
    { y: 380, size: 96, c: MD, toks: [['قبل', 10], ['از', 11], ['اینکه', [12, 13]], ['پول', 14], ['بدی،', 15]] },
    { y: 530, size: 116, c: WHITE, toks: [['این', 16], ['سه', 17, { c: LIME }], ['تا', 17, { c: LIME }], ['سؤال', 18, { c: LIME }], ['رو', 19]] },
    { y: 680, size: 116, c: WHITE, toks: [['ازش', 20], ['بپرس.', 21]] }] }] },
  { k: 'q1', bg: VIO, wipe: 'iris', groups: [
    { at: 22, lines: [{ y: 360, size: 120, c: LIME, toks: [['یک:', 22]] }, { y: 500, size: 100, c: WHITE, toks: [['این', 23], ['عدد', 24], ['روی', 25]] },
      { y: 630, size: 116, c: WHITE, toks: [['چند', 26, { c: LIME }], ['تا', 27, { c: LIME }], ['معامله‌ست؟', [28, 29]]] }] },
    { at: 30, lines: [{ y: 360, size: 100, c: WHITE, toks: [['ده', 30, { c: LIME }], ['تا', 31, { c: LIME }], ['معامله‌ی', 32], ['خوب،', 33]] },
      { y: 490, size: 116, c: WHITE, toks: [['هیچی', 34, { c: LIME }], ['رو', 35]] }, { y: 620, size: 116, c: WHITE, toks: [['ثابت', 36], ['نمی‌کنه.', [37, 38]]] }] }] },
  { k: 'q2', bg: PAPER, wipe: 'left', groups: [
    { at: 39, lines: [{ y: 360, size: 120, c: VIO, toks: [['دو:', 39]] }, { y: 500, size: 140, c: R, toks: [['بدترین', 40], ['ماهش', 41]] }, { y: 650, size: 110, c: INKP, toks: [['چی', 42], ['بوده؟', 43]] }] },
    { at: 44, lines: [{ y: 340, size: 92, c: INKP, toks: [['اگه', 44], ['فقط', 45], ['ماه‌های', 46], ['سبزش', 47, { c: G }], ['رو', 48]] }, { y: 460, size: 92, c: INKP, toks: [['نشونت', 49], ['می‌ده،', [50, 51]]] }] },
    { at: 52, lines: [{ y: 350, size: 104, c: INKP, toks: [['یعنی', 52], ['کل ماجرا', [53, 54], { hl: R, ht: WHITE }], ['رو', 55]] }, { y: 500, size: 110, c: INKP, toks: [['نمی‌بینی.', [56, 57]]] }] }] },
  { k: 'q3', bg: INKD, wipe: 'up', groups: [
    { at: 58, lines: [{ y: 360, size: 120, c: LIME, toks: [['سه:', 58]] }, { y: 500, size: 96, c: WHITE, toks: [['اگه', 59], ['واقعاً', 60], ['ماهی', 61]] },
      { y: 630, size: 110, c: WHITE, toks: [['۹۰', 62, { c: LIME }], ['درصد', 63, { c: LIME }], ['سود', 64], ['می‌کنه،', [65, 66]]] }] },
    { at: 67, lines: [{ y: 340, size: 96, c: WHITE, toks: [['با', 67], ['هزار', 68, { c: LIME }], ['دلار،', 69, { c: LIME }]] }, { y: 460, size: 96, c: WHITE, toks: [['یه', 70], ['سال', 71], ['بعد…', 72]] }] },
    { at: 73, lines: [{ y: 320, size: 88, c: WHITE, toks: [['بیشتر', 73], ['از', 74]] }, { y: 450, size: 130, c: LIME, toks: [['دو', 75], ['میلیون', 76], ['دلار', 77]] }, { y: 580, size: 88, c: WHITE, toks: [['داره.', 78]] }] }] },
  { k: 'why', bg: LIME, wipe: 'iris', groups: [{ at: 79, lines: [
    { y: 660, size: 120, c: INKD, toks: [['پس', 79], ['چرا', 80]] },
    { y: 880, size: 190, c: INKD, toks: [['داره', 81], ['سیگنال', 82]] },
    { y: 1120, size: 200, c: INKD, toks: [['می‌فروشه؟', [83, 84]]] }] }] },
  { k: 'test', bg: INKD, wipe: 'down', groups: [
    { at: 85, lines: [{ y: 380, size: 100, c: WHITE, toks: [['هیچ', 85], ['عددی', 86], ['رو', 87]] }, { y: 540, size: 150, c: LIME, toks: [['بدون', 88], ['تست', 89]] }, { y: 710, size: 130, c: R, toks: [['قبول', 90], ['نکن.', 91]] }] },
    { at: 92, lines: [{ y: 420, size: 130, c: WHITE, toks: [['نه', 92], ['از', 93], ['اون،', 94]] }, { y: 620, size: 130, c: LIME, toks: [['نه', 95], ['از', 96], ['خودت.', 97]] }] }] },
  { k: 'brand', bg: PAPER, wipe: 'right', groups: [{ at: 98, lines: [{ y: 600, size: 90, c: MP, toks: [['توی', 98]] }] }] },
  { k: 'years', bg: INKD, wipe: 'up', groups: [{ at: 102, lines: [
    { y: 340, size: 92, c: WHITE, toks: [['هر', 102], ['ستاپی', [103, 104]], ['رو', 105], ['روی', 106]] },
    { y: 470, size: 116, c: LIME, toks: [['سال‌ها', 107], ['داده‌ی', [108, 109]], ['واقعی', 110]] },
    { y: 600, size: 92, c: WHITE, toks: [['تست', 111], ['می‌کنی،', [112, 113]]] }] }] },
  { k: 'stats', bg: VIO, wipe: 'down', groups: [{ at: 114, lines: [
    { y: 370, size: 110, c: WHITE, toks: [['و', 114], ['وین‌ریت', [115, 116], { c: LIME }]] },
    { y: 500, size: 110, c: WHITE, toks: [['و', 117], ['بدترین', 118, { c: LIME }], ['افتش', 119, { c: LIME }], ['رو', 120]] },
    { y: 625, size: 88, c: WHITE, toks: [['با', 121], ['چشم', 122], ['خودت', 123], ['می‌بینی.', [124, 125]]] }] }] },
  { k: 'trust', bg: 'split', wipe: 'left', groups: [{ at: 126, lines: [
    { y: 420, size: 168, c: INKP, toks: [['به', 126], ['عدد', 127, { hl: VIO, ht: WHITE }]] },
    { y: 620, size: 120, c: INKP, toks: [['اعتماد', 128], ['کن،', 129]] },
    { y: 1190, size: 110, c: MD, toks: [['نه', 130], ['به', 131]] },
    { y: 1390, size: 150, c: MD, toks: [['اسکرین‌شات.', 132, { blur: 4 }]] }] }] },
  { k: 'end', bg: VIO, wipe: 'iris', groups: [] },
];

SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; });
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);

// the wipe of a scene's background over the previous one
const WIPE = 0.32;
function bgFill(bg, x, y, w, h) {
  if (bg === 'splitR') { cv.save(); cv.beginPath(); cv.rect(x, y, w, h); cv.clip(); cv.fillStyle = INKD; cv.fillRect(0, 0, W, 960); cv.fillStyle = PAPER; cv.fillRect(0, 960, W, H - 960);
    // a fine ruler grid on the paper half: the side of tests
    cv.strokeStyle = 'rgba(26,20,48,0.07)'; cv.lineWidth = 2; for (let gx = 0; gx <= W; gx += 60) { cv.beginPath(); cv.moveTo(gx, 960); cv.lineTo(gx, H); cv.stroke(); } for (let gy = 960; gy <= H; gy += 60) { cv.beginPath(); cv.moveTo(0, gy); cv.lineTo(W, gy); cv.stroke(); }
    cv.restore(); return; }
  if (bg === 'split') { cv.save(); cv.beginPath(); cv.rect(x, y, w, h); cv.clip(); cv.fillStyle = PAPER; cv.fillRect(0, 0, W, 960); cv.fillStyle = INKD; cv.fillRect(0, 960, W, H - 960);
    cv.strokeStyle = 'rgba(26,20,48,0.07)'; cv.lineWidth = 2; for (let gx = 0; gx <= W; gx += 60) { cv.beginPath(); cv.moveTo(gx, 0); cv.lineTo(gx, 960); cv.stroke(); } for (let gy = 0; gy <= 960; gy += 60) { cv.beginPath(); cv.moveTo(0, gy); cv.lineTo(W, gy); cv.stroke(); }
    cv.restore(); return; }
  cv.fillStyle = bg; cv.fillRect(x, y, w, h);
}
/** Progress of a scene's wipe (1 = done), and a clip to that shape while it runs. */
function wipeK(s, t) { if (s.wipe === 'none') return 1; if (s.wipe === 'cut') return t < s.t0 ? 0 : 1; return exIO(k01(t, s.t0 - 0.06, WIPE)); }
function clipTo(s, k, origin) {
  cv.beginPath();
  if (s.wipe === 'right') cv.rect(W * (1 - k), 0, W * k, H);
  else if (s.wipe === 'left') cv.rect(0, 0, W * k, H);
  else if (s.wipe === 'up') cv.rect(0, H * (1 - k), W, H * k);
  else if (s.wipe === 'down') cv.rect(0, 0, W, H * k);
  else if (s.wipe === 'iris') { const [ox, oy] = origin ?? [CX, 960]; cv.arc(ox, oy, k * 2300, 0, Math.PI * 2); }
  else cv.rect(0, 0, W, H);
  cv.clip();
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
// the ad: a dark «سیگنال VIP» card promising 90% a month; o.stamp (a time) stamps it «تست‌نشده»
function adCard(t, x, y, s, a, o = {}) {
  if (a <= 0) return;
  at(x, y, s, a, () => {
    cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 16; rrect(-400, -150, 800, 300, 44, INKD); cv.shadowColor = 'transparent';
    chip('سیگنال VIP', 250, -82, 34, INKD, AMB);
    const kn = o.num === undefined ? 1 : pop(t - o.num, 16, 0.5);
    if (kn > 0) at(210, 22, cl(kn, 0, 1.25), cl(kn), () => txt('۹۰٪', 0, 0, 120, G));
    txt('سود ماهانه', 210, 105, 38, MD, { w: 800 });
    rrect(-360, -110, 380, 220, 26, PLATE);
    const pts = [[-330, 80], [-280, 50], [-240, 64], [-190, 10], [-150, 30], [-100, -30], [-60, -14], [-10, -80]];
    trace(pts, o.line === undefined ? 1 : cub(k01(t, o.line, 0.5)), G, 9);
    if (o.stamp !== undefined) { const k = pop(t - o.stamp, 14, 0.5); if (k > 0) at(0, 10, lerp(1.9, 1, cl(k)), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.4)'; cv.shadowBlur = 30; rrect(-280, -80, 560, 160, 24, '#2A0D17'); cv.shadowColor = 'transparent'; rrect(-280, -80, 560, 160, 24, null, R, 10); txt('تست‌نشده', 0, 6, 88, R); }, -0.1); }
  });
}
// hook: the ad slides up under the words
function hookArt(t) { const k = pop(t - ws(2) + 0.1, 12, 0.65); adCard(t, CX, lerp(1420, 1270, cl(k)), 0.95, cl(k), { num: ws(4), line: ws(6) }); }
// «این سه تا سؤال»: three numbered circles, each gets its «؟»
function threeArt(t) {
  [790, 540, 290].forEach((x, i) => {
    const k = pop(t - ws(17) - i * 0.1, 14, 0.55); if (k <= 0) return;
    at(x, 1080, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, 110, LIME); txt(fa(i + 1), 0, 8, 120, INKD);
      const q = pop(t - ws(18) - i * 0.08, 16, 0.5); if (q > 0) at(80, -80, cl(q, 0, 1.3), cl(q), () => { circle(0, 0, 44, VIO); txt('؟', 0, 6, 56, WHITE); }); });
  });
}
// «روی چند تا معامله؟ ده تا معامله‌ی خوب هیچی رو ثابت نمی‌کنه»: ten wins, then the other 190 trades around them (an example)
const DOTS = (() => { const s = []; for (let i = 0; i < 200; i++) s.push(rnd(i * 2.3 + 5) < 0.45 ? 1 : 0); for (let i = 85; i < 95; i++) s[i] = 1; return s; })();
function sampleArt(t) {
  const cols = 20, p = 44, x0 = CX + ((cols - 1) * p) / 2, y0 = 900, ten = ws(30), all = ws(34);
  const k = cub(k01(t, T.q1 + 0.2, 0.4)); if (k <= 0) return;
  for (let i = 0; i < 200; i++) {
    const r = Math.floor(i / cols), c = i % cols, x = x0 - c * p, y = y0 + r * p, inTen = i >= 85 && i < 95;
    if (inTen && t >= ten) { const q = pop(t - ten - (i - 85) * 0.04, 16, 0.55); circle(x, y, 17 * cl(q, 0, 1.3), G); continue; }
    if (t >= all) { const q = cub(k01(t, all + rnd(i) * 0.4, 0.15)); circle(x, y, 17, rgba(WHITE, 0.12)); if (q > 0) circle(x, y, 17 * q, DOTS[i] ? G : R); continue; }
    circle(x, y, 17, rgba(WHITE, 0.12 * k));
  }
  if (t >= ten) { const h = cub(k01(t, ten + 0.4, 0.3)), xa = x0 - 14 * p, xb = x0 - 5 * p, y = y0 + 4 * p; cv.save(); cv.globalAlpha = h; rrect(xa - 30, y - 30, xb - xa + 60, 60, 30, null, LIME, 6); cv.restore();
    if (h > 0) at((xa + xb) / 2, y0 + 10 * p + 30, 1, h, () => chip(t >= all ? '۱۰ از ۲۰۰' : '۱۰ معامله', 0, 0, 40, INKD, LIME)); }
  const kn = cub(k01(t, all + 0.2, 0.3)); if (kn > 0) { cv.save(); cv.globalAlpha = kn; chip('نمونه', 930, 830, 28, WHITE, rgba(WHITE, 0.15)); cv.restore(); }
}
// «بدترین ماهش؟ اگه فقط ماه‌های سبزش رو نشونت می‌ده»: a screenshot of three green months zooms out to the year (an example)
const PNL = [14, 9, -22, 18, 11, -31, 16, 8, 21, -27, 12, 19];
function monthsArt(t) {
  const k = pop(t - T.q2 - 0.1, 12, 0.7); if (k <= 0) return;
  const z = cub(k01(t, ws(53) - 0.05, 0.7)), cx = CX, base = 1120, sc = lerp(13, 7, z);
  at(cx, 0, cl(k, 0, 1.06), cl(k), () => {
    rrect(-450, 700, 900, 760, 48, WHITE, rgba(VIO, 0.25), 4);
    cv.save(); cv.beginPath(); cv.roundRect(-440, 710, 880, 740, 40); cv.clip();
    line(-420, base, 420, base, rgba(INKP, 0.2), 4);
    PNL.forEach((v, i) => {
      const xf = -380 + (i + 0.5) * (760 / 12), xz = (i - 7) * 270, x = lerp(xz, xf, z), bw = lerp(140, 44, z), h = v * sc;
      rrect(x - bw / 2, v > 0 ? base - h : base, bw, Math.abs(h), 10, v > 0 ? G : R);
      txt(`${v > 0 ? '+' : '−'}${fa(Math.abs(v))}٪`, x, v > 0 ? base - h - 34 : base - h + 34, lerp(46, 24, z), v > 0 ? G : R, { dir: 'ltr' });
    });
    cv.restore();
    // the screenshot frame: tight around the three green months, then left behind as the view widens
    const fx0 = lerp(-400, -380 + 6 * (760 / 12) - 8, z), fx1 = lerp(400, -380 + 9 * (760 / 12) + 8, z);
    cv.save(); cv.setLineDash([16, 12]); rrect(fx0, 730, fx1 - fx0, 590, 30, null, VIO, 6); cv.restore();
    at((fx0 + fx1) / 2, 1360, 1, 1, () => chip('اسکرین‌شات', 0, 0, lerp(34, 26, z), WHITE, VIO));
    if (z < 0.5) { const q = pop(t - ws(40), 14, 0.55); if (q > 0) at(0, 1230, cl(q, 0, 1.2), cl(q) * (1 - z * 2), () => chip('بدترین ماه؟', 0, 0, 38, WHITE, R)); }
    if (z > 0.6) { const q = pop(t - ws(54), 14, 0.55); const x = -380 + 5.5 * (760 / 12); if (q > 0) at(x + 60, 1425, cl(q, 0, 1.2), cl(q), () => chip('بدترین ماه: −۳۱٪', 0, 0, 30, WHITE, R)); }
    if (z > 0.3) { cv.save(); cv.globalAlpha = (z - 0.3) / 0.7; chip('نمونه', -370, 750, 26, MP, rgba(MP, 0.1)); cv.restore(); }
  });
}
// twelve months at ×1.9: $1,000 → $2,213,315
const mon = (i) => lerp(ws(67), ws(75), (i - 1) / 11);
function growArt(t) {
  const x0 = 120, x1 = 960, base = 1330, n = 12, step = (x1 - x0) / n, bw = step * 0.62, H12 = 620;
  line(x0 - 20, base, x1 + 20, base, rgba(WHITE, 0.25), 4);
  let cur = 0;
  for (let i = 1; i <= n; i++) {
    const st = mon(i), g = cub(k01(t, st, 0.22)), x = x0 + step * (i - 0.5);
    if (g <= 0) { txt(fa(i), x, base + 40, 30, rgba(WHITE, 0.25), { w: 700 }); continue; }
    cur = i; const h = Math.max(8, (Math.pow(1.9, i) / Math.pow(1.9, 12)) * H12) * g;
    rrect(x - bw / 2, base - h, bw, h, 10, i === 12 ? LIME : i >= 10 ? G : rgba(WHITE, 0.75));
    txt(fa(i), x, base + 40, 30, i === 12 ? LIME : MD, { w: 800 });
  }
  txt('ماه', x0 - 40, base + 40, 28, MD, { w: 700 });
  const k = cub(k01(t, ws(67), 0.3)); if (k <= 0) return;
  const bal = 1000 * Math.pow(1.9, cur), done = cur === 12;
  at(CX, 1450, done ? 1 + 0.12 * Math.exp(-(t - mon(12)) * 5) : 1, k, () => { rrect(-440, -62, 880, 124, 62, done ? LIME : PLATE); txt(`${money(bal)} دلار`, 0, 4, done ? 66 : 62, done ? INKD : WHITE); });
  const kx = pop(t - ws(62), 16, 0.5); if (kx > 0 && t < ws(67) + 0.2) at(CX, 1000, cl(kx, 0, 1.3), cl(kx) * (1 - k01(t, ws(67), 0.2)), () => { circle(0, 0, 120, LIME); txt('×۱٫۹', 0, 6, 92, INKD); txt('هر ماه', 0, 170, 44, MD, { w: 800 }); });
}
// «بدون تست قبول نکن»: the ad again, stamped
function testArt(t) { const k = pop(t - T.test - 0.1, 12, 0.65); adCard(t, CX, 1230, 0.9, cl(k), { stamp: ws(89) + 0.15 }); }
// the brand
function brandArt(t) {
  const ki = pop(t - ws(99) + 0.1, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 880, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 60; cv.shadowOffsetY = 18; cv.drawImage(IMG.icon, -160, -160, 320, 320); });
  const kw = cub(k01(t, ws(99) + 0.15, 0.35)); if (kw > 0 && IMG.wordL) { const w = 620, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.wordL, CX - w / 2, 1090 + (1 - kw) * 24, w, h); cv.restore(); }
}
// «روی سال‌ها داده‌ی واقعی»: real NAS100 monthly candles from January 2015, drawn year by year
function yearsArt(t) {
  const B = CHART.bars, N = B.length, x0 = 70, x1 = 1010, y0 = 770, y1 = 1320, step = (x1 - x0) / N, bw = Math.max(3, step * 0.62);
  const lo = Math.min(...B.map((b) => b[2])) * 0.95, hi = Math.max(...B.map((b) => b[1])) * 1.02, Y = (p) => y1 - ((p - lo) / (hi - lo)) * (y1 - y0);
  const n = Math.round(cl((t - ws(107) + 0.1) / (ws(113) + 0.3 - ws(107))) * N); if (n <= 0) return;
  for (let i = 0; i < n; i++) { const [o, h, l, c] = B[i], col = c >= o ? G : R, x = x0 + step * (i + 0.5); line(x, Y(h), x, Y(l), col, 2); cv.fillStyle = col; cv.fillRect(x - bw / 2, Y(Math.max(o, c)), bw, Math.max(2, Math.abs(Y(o) - Y(c)))); }
  const yr = 2015 + Math.floor((n - 1) / 12), xn = x0 + step * (n - 0.5);
  line(xn, y0 - 30, xn, y1 + 10, rgba(LIME, 0.6), 3, [10, 10]);
  at(cl(xn, 140, 940), y0 - 70, 1, 1, () => chip(fa(yr), 0, 0, 44, INKD, LIME));
  txt('نزدک ۱۰۰ · ماهانه · ۲۰۱۵ تا ۲۰۲۶ · داده‌ی واقعی', CX, 1420, 34, MD, { w: 700 });
}
// two gauges: win rate and the worst drawdown; the readouts wait for your own numbers
function gauges(t) {
  [['وین‌ریت', ws(115)], ['بدترین افت', ws(118)]].forEach(([s, st], i) => {
    const x = i ? 300 : 780, k = pop(t - st + 0.1, 12, 0.7); if (k <= 0) return;
    at(x, 1020, cl(k, 0, 1.1), cl(k), () => {
      circle(0, 0, 200, PLATE); cv.lineWidth = 26; cv.lineCap = 'round'; cv.strokeStyle = 'rgba(255,255,255,0.1)'; cv.beginPath(); cv.arc(0, 0, 160, Math.PI * 0.8, Math.PI * 2.2); cv.stroke();
      const sw = cub(k01(t, st, 1.0)), a = Math.PI * 0.8 + Math.PI * 1.4 * (0.5 + 0.5 * Math.sin((t - st) * 5) * (1 - sw * 0.6)) * cl((t - st) * 2);
      cv.strokeStyle = i ? R : LIME; cv.beginPath(); cv.arc(0, 0, 160, Math.PI * 0.8, Math.max(Math.PI * 0.8, a)); cv.stroke();
      line(0, 0, Math.cos(a) * 120, Math.sin(a) * 120, WHITE, 10); circle(0, 0, 16, WHITE);
      txt(s, 0, 250, 48, WHITE); const caret = Math.floor(t * 2.5) % 2 ? '_' : ' '; txt(caret, 0, 95, 70, LIME, { dir: 'ltr' });
    });
  });
  const a = cub(k01(t, ws(122), 0.4)); if (a > 0) txt('عدد خودت، از معامله‌های خودت', CX, 1390, 46, LIME, { alpha: a, w: 800 });
}
// «نه به اسکرین‌شات»: a phone frame behind the word on the ink half, and the word struck out
function trustArt(t) {
  const k = cub(k01(t, ws(130), 0.3)); if (k > 0) { cv.save(); cv.globalAlpha = 0.35 * k; rrect(CX - 210, 1040, 420, 440, 48, null, MD, 6); rrect(CX - 50, 1058, 100, 16, 8, MD); cv.restore(); }
  const s = cub(k01(t, ws(132) + 0.3, 0.3)); if (s > 0) line(860, 1390, 860 - 680 * s, 1390, R, 16);
}
// the end card: «شروعش رایگانه», «لینک توی بیو», then «بفرستش برای رفیقت»
function endCard(t) {
  const ki = pop(t - T.end + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 620, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, T.end + 0.2, 0.35));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 810 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - ws(133) + 0.05, 14, 0.55);
  if (kf > 0) at(CX, 1070, cl(kf, 0, 1.25), cl(kf), () => chip('شروعش رایگانه', 0, 0, 58, INKD, LIME));
  const kb = pop(t - ws(135) + 0.05, 14, 0.6);
  if (kb > 0) at(CX, 1230, cl(kb, 0, 1.2), cl(kb), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, VIO); });
  const ks = pop(t - ws(138) + 0.05, 14, 0.55), fly = t > ws(138) + 0.4 ? Math.sin((t - ws(138)) * 5) * 6 : 0;
  if (ks > 0) at(CX, 1390, cl(ks, 0, 1.2), cl(ks), () => { const w = chip('بفرستش برای رفیقت', -40, 0, 44, WHITE, INKD);
    cv.save(); cv.translate(-40 - w / 2 - 50, fly); cv.rotate(-0.35); cv.fillStyle = LIME; cv.beginPath(); cv.moveTo(34, 0); cv.lineTo(-30, -26); cv.lineTo(-16, 0); cv.lineTo(-30, 26); cv.closePath(); cv.fill(); cv.restore(); });
}

const ART = { hook: hookArt, three: threeArt, q1: sampleArt, q2: monthsArt, q3: growArt, test: testArt, brand: brandArt, years: yearsArt, stats: gauges, trust: trustArt, end: endCard };

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  // a punch-in on the hard moments: the whole year revealed, the $2.2M, «می‌فروشه؟», the stamp
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(ws(53), 10) + sh(mon(12), 12) + sh(ws(83), 10) + sh(ws(89) + 0.15, 10), 0);
  SC.forEach((s, i) => {
    if (t < s.t0 - 0.1) return;
    const nextBg = SC.slice(i + 1).find((x) => x.wipe !== 'none'), hidden = nextBg && t > nextBg.t0 + WIPE;
    if (hidden) return;
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
/** The cover: the hook over the stamped ad. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  txt('یکی بهت', CX, 400, 104, INKP);
  const s = 'سیگنال', size = 200, w = measure(s, size); cv.save(); cv.translate(CX, 590); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, VIO); cv.restore(); txt(s, CX, 590, size, WHITE);
  { const parts = [['با', INKP], ['۹۰ درصد', G], ['سود ماهانه', INKP]], size2 = 104, gap = measure(' ', size2) * 1.3, ws_ = parts.map(([p]) => measure(p, size2)); let right = CX + (ws_.reduce((a, b) => a + b, 0) + gap * 2) / 2;
    parts.forEach(([p, c], j) => { txt(p, right - ws_[j] / 2, 800, size2, c); right -= ws_[j] + gap; }); }
  txt('می‌فروشه؟', CX, 950, 116, INKP);
  adCard(99, CX, 1260, 0.95, 1, { stamp: 0 });
  rrect(CX - 340, 1520, 680, 110, 55, INKD); txt('اول این ۳ تا سؤال رو بپرس', CX, 1577, 54, WHITE);
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), loadImg('wordL', window.LOGO.wordL)]);
  window.seek(0); window.ready = true;
})();
