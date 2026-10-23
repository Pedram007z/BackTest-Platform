// q2 · «چطور می‌تونم تو یه ماه ۲۰۰ درصد سود کنم؟» on the user's take, in q1's language: full-bleed colour blocks
// (paper, ink, violet, lime) that wipe into each other on the beat, huge words that land as they are spoken, and one
// bold symbol per idea: a rising arrow, a calculator, a bill that becomes three, twelve monthly bars where $1,000
// tripled every month breaks the chart (1,000 × 3¹² = $531,441,000), a risk gauge in the red, a worked example (a
// $1,000 account risking a fixed $200 a trade: five losses take all of it), a wall of example trades with a run of five
// losses, «حدس» blurred and struck out over a crisp «بک‌تست», real gold monthly candles 2015–2026, two gauges
// waiting for your own numbers, a small repeating profit against a one-off spike, and the end card.
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
    { y: 420, size: 112, c: INKP, toks: [['چطور', 0], ['می‌تونم', 1]] },
    { y: 560, size: 112, c: INKP, toks: [['توی', 2], ['یه', 3], ['ماه', 4]] },
    { y: 790, size: 230, c: INKP, toks: [['۲۰۰', 5, { hl: VIO, ht: WHITE }], ['درصد', 6]] },
    { y: 1020, size: 140, c: INKP, toks: [['سود', 7, { c: G }], ['کنم؟', 8]] }] }] },
  { k: 'calc', bg: INKD, wipe: 'right', groups: [{ at: 9, lines: [
    { y: 470, size: 120, c: WHITE, toks: [['بیا', 9], ['یه', 10], ['حساب', 11, { c: LIME }]] },
    { y: 620, size: 120, c: WHITE, toks: [['ساده', 12], ['کنیم.', 13]] }] }] },
  { k: 'triple', bg: VIO, wipe: 'iris', groups: [{ at: 14, lines: [
    { y: 370, size: 100, c: WHITE, toks: [['۲۰۰', 14], ['درصد', 15], ['یعنی', 16]] },
    { y: 500, size: 100, c: WHITE, toks: [['پولت', 17], ['توی', 18], ['یه', 19], ['ماه', 20]] },
    { y: 1400, size: 150, c: LIME, toks: [['سه', 21], ['برابر', 22], ['بشه.', 23, { c: WHITE }]] }] }] },
  { k: 'year', bg: INKD, wipe: 'up', groups: [
    { at: 24, lines: [{ y: 340, size: 96, c: WHITE, toks: [['اگه', 24], ['کسی', 25], ['هر', 26], ['ماه', 27, { c: LIME }]] }, { y: 460, size: 96, c: WHITE, toks: [['این', 28], ['کار', 29], ['رو', 30], ['می‌کرد،', 31]] }] },
    { at: 32, lines: [{ y: 340, size: 96, c: WHITE, toks: [['با', 32], ['هزار', 33, { c: LIME }], ['دلار،', 34, { c: LIME }]] }, { y: 460, size: 96, c: WHITE, toks: [['یه', 35], ['سال', 36], ['بعد…', 37]] }] },
    { at: 38, lines: [{ y: 320, size: 88, c: WHITE, toks: [['بیشتر', 38], ['از', 39]] }, { y: 450, size: 124, c: LIME, toks: [['پونصد', 40], ['میلیون', 41], ['دلار', 42]] }, { y: 575, size: 88, c: WHITE, toks: [['داشت.', 43]] }] }] },
  { k: 'nobody', bg: LIME, wipe: 'iris', groups: [{ at: 44, lines: [
    { y: 650, size: 120, c: INKD, toks: [['پس', 44], ['چرا', 45]] },
    { y: 890, size: 270, c: INKD, toks: [['هیچ‌کس', [46, 47]]] },
    { y: 1140, size: 200, c: INKD, toks: [['نداره؟', 48]] }] }] },
  { k: 'risk', bg: INKD, wipe: 'down', groups: [{ at: 49, lines: [
    { y: 380, size: 100, c: MD, toks: [['چون', 49], ['همچین', 50], ['سودی', 51]] },
    { y: 510, size: 100, c: WHITE, toks: [['یعنی', 52]] },
    { y: 780, size: 280, c: R, toks: [['ریسک', 53]] },
    { y: 1020, size: 150, c: WHITE, toks: [['خیلی', 54], ['بزرگ.', 55]] }] }] },
  { k: 'example', bg: PAPER, wipe: 'left', groups: [
    { at: 56, lines: [{ y: 340, size: 96, c: INKP, toks: [['مثلاً', 56, { c: MP }], ['با', 57], ['ریسک', 58], ['۲۰', 59, { c: R }], ['درصد', 60, { c: R }]] }, { y: 460, size: 96, c: INKP, toks: [['روی', 61], ['هر', 62], ['معامله،', 63]] }] },
    { at: 64, lines: [{ y: 340, size: 96, c: INKP, toks: [['فقط', 64], ['پنج', 65, { c: R }], ['تا', 66, { c: R }], ['ضرر', 67, { c: R }]] }, { y: 460, size: 96, c: INKP, toks: [['پشت‌سرهم…', [68, 69]]] }] },
    { at: 70, lines: [{ y: 360, size: 140, c: INKP, toks: [['کل حسابت', [70, 71], { hl: R, ht: WHITE }]] }, { y: 515, size: 100, c: INKP, toks: [['رو', 72], ['می‌بره.', 73]] }] }] },
  { k: 'everyone', bg: INKD, wipe: 'up', groups: [
    { at: 75, lines: [{ y: 370, size: 100, c: WHITE, toks: [['و', 75], ['پنج', 75, { c: R }], ['تا', 76, { c: R }], ['ضرر', 77, { c: R }]] }, { y: 500, size: 100, c: WHITE, toks: [['پشت‌سرهم', [78, 79]]] }] },
    { at: 80, lines: [{ y: 370, size: 130, c: LIME, toks: [['دیر', 80], ['یا', 81], ['زود', 82]] }, { y: 520, size: 96, c: WHITE, toks: [['برای', 83], ['همه', 84, { c: LIME }], ['پیش', 85], ['میاد.', 86]] }] }] },
  { k: 'right', bg: VIO, wipe: 'iris', groups: [{ at: 87, lines: [
    { y: 840, size: 200, c: WHITE, toks: [['سؤال', 87], ['درست', 88, { c: LIME }]] },
    { y: 1080, size: 170, c: WHITE, toks: [['اینه:', 89]] }] }] },
  { k: 'question', bg: PAPER, wipe: 'right', groups: [{ at: 90, lines: [
    { y: 420, size: 110, c: INKP, toks: [['استراتژی', 90], ['من،', 91]] },
    { y: 560, size: 110, c: INKP, toks: [['با', 92], ['ریسک', 93], ['معقول،', 94, { c: G }]] },
    { y: 860, size: 130, c: MP, toks: [['واقعاً', 95]] },
    { y: 1060, size: 190, c: INKP, toks: [['چقدر', 96], ['سود', 97, { hl: VIO, ht: WHITE }]] },
    { y: 1270, size: 150, c: INKP, toks: [['می‌ده؟', 98]] }] }] },
  { k: 'guess', bg: 'splitR', wipe: 'left', groups: [{ at: 99, lines: [
    { y: 330, size: 92, c: MD, toks: [['جوابش', 99], ['با', 100]] },
    { y: 560, size: 210, c: MD, toks: [['حدس', 101, { blur: 5 }]] },
    { y: 790, size: 92, c: MD, toks: [['پیدا', 102], ['نمی‌شه؛', 103]] },
    { y: 1220, size: 160, c: INKP, toks: [['با', 104], ['بک‌تست', [105, 106], { hl: VIO, ht: WHITE }]] },
    { y: 1430, size: 100, c: INKP, toks: [['پیدا', 107], ['می‌شه.', 108]] }] }] },
  { k: 'brand', bg: PAPER, wipe: 'right', groups: [{ at: 109, lines: [{ y: 600, size: 90, c: MP, toks: [['توی', 109]] }] }] },
  { k: 'years', bg: INKD, wipe: 'up', groups: [{ at: 113, lines: [
    { y: 340, size: 92, c: WHITE, toks: [['استراتژیت', 113], ['رو', 114], ['روی', 115]] },
    { y: 470, size: 116, c: LIME, toks: [['سال‌ها', 116], ['داده‌ی', 117], ['واقعی', 118]] },
    { y: 600, size: 92, c: WHITE, toks: [['تست', 119], ['می‌کنی،', 120]] }] }] },
  { k: 'stats', bg: VIO, wipe: 'down', groups: [{ at: 121, lines: [
    { y: 370, size: 110, c: WHITE, toks: [['و', 121], ['وین‌ریت', [122, 123], { c: LIME }]] },
    { y: 500, size: 110, c: WHITE, toks: [['و', 124], ['بدترین', 125, { c: LIME }], ['افتش', 126, { c: LIME }]] },
    { y: 625, size: 88, c: WHITE, toks: [['رو', 127], ['می‌بینی.', 128]] }] }] },
  { k: 'small', bg: PAPER, wipe: 'left', groups: [
    { at: 129, lines: [{ y: 340, size: 100, c: INKP, toks: [['یه', 129], ['سود', 130], ['کوچیک', 131, { c: G }]] }, { y: 470, size: 100, c: INKP, toks: [['که', 132], ['تکرار', 133, { c: G }], ['می‌شه،', 134]] }] },
    { at: 135, lines: [{ y: 340, size: 92, c: INKP, toks: [['از', 135], ['یه', 136], ['۲۰۰', 137, { c: R }], ['درصدِ', 138, { c: R }], ['یه‌باره', [139, 140], { c: R }]] }, { y: 480, size: 110, c: INKP, toks: [['خیلی', 141], ['بیشتر', 142, { hl: VIO, ht: WHITE }], ['می‌ارزه.', 143]] }] }] },
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
// hook: a green arrow shooting up on «سود»
function hookArt(t) {
  const k = cub(k01(t, ws(7) - 0.05, 0.55)); if (k <= 0) return;
  const pts = [[150, 1440], [330, 1370], [430, 1410], [620, 1290], [720, 1330], [920, 1180]];
  const end = trace(pts, k, G, 22);
  if (k > 0.95) { const a = Math.atan2(1180 - 1330, 920 - 720); cv.save(); cv.translate(...end); cv.rotate(a); cv.fillStyle = G; cv.beginPath(); cv.moveTo(40, 0); cv.lineTo(-24, -34); cv.lineTo(-24, 34); cv.closePath(); cv.fill(); cv.restore(); }
  const q = pop(t - ws(8), 14, 0.6); if (q > 0) at(960, 1080, cl(q, 0, 1.2), cl(q), () => { circle(0, 0, 70, VIO); txt('؟', 0, 8, 90, WHITE); });
}
// «بیا یه حساب ساده کنیم»: a calculator that types «۲۰۰٪» and then asks
function calcArt(t) {
  const k = pop(t - T.calc - 0.1, 13, 0.65); if (k <= 0) return;
  at(CX, 1150, cl(k, 0, 1.1), cl(k), () => {
    rrect(-270, -330, 540, 660, 50, PLATE);
    rrect(-220, -280, 440, 150, 26, '#2A2245');
    const typed = ['۲', '۲۰', '۲۰۰', '۲۰۰٪'], n = Math.min(4, Math.floor((t - ws(11)) / 0.12) + 1);
    if (n > 0) txt(t >= ws(13) ? '۲۰۰٪ = ؟' : typed[n - 1], 190, -205, 76, LIME, { align: 'right', dir: 'ltr' });
    const keys = ['۷', '۸', '۹', '÷', '۴', '۵', '۶', '×', '۱', '۲', '۳', '−', '۰', '٪', '=', '+'];
    keys.forEach((s, i) => { const r = Math.floor(i / 4), c = i % 4, x = -165 + c * 110, y = -50 + r * 100;
      const press = [['۲', ws(11)], ['۰', ws(11) + 0.12], ['۰', ws(11) + 0.24], ['٪', ws(11) + 0.36], ['=', ws(13)]].find(([kk, st]) => kk === s && t >= st && t < st + 0.11);
      rrect(x - 46, y - 40, 92, 80, 20, press ? LIME : s === '=' ? VIO : '#2A2245'); txt(s, x, y + 3, 44, press ? INKD : WHITE); });
  });
}
// «۲۰۰ درصد یعنی پولت سه برابر بشه»: one bill becomes three
function bill(x, y, s, rot) {
  at(x, y, s, 1, () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 30; cv.shadowOffsetY = 12; rrect(-210, -110, 420, 220, 26, '#DFF7C7'); cv.shadowColor = 'transparent';
    rrect(-186, -86, 372, 172, 18, null, G, 5); circle(0, 0, 58, G); txt('$', 0, 4, 76, '#DFF7C7', { dir: 'ltr' }); circle(-140, -50, 12, G); circle(140, 50, 12, G); }, rot);
}
function tripleArt(t) {
  const k1 = pop(t - ws(17), 14, 0.6), k2 = pop(t - ws(21), 14, 0.6), k3 = pop(t - ws(22), 14, 0.6);
  if (k3 > 0) bill(CX + 40 * cl(k3), 880 - 70 * cl(k3), cl(k3, 0, 1.15), 0.08);
  if (k2 > 0) bill(CX - 40 * cl(k2), 880 - 35 * cl(k2), cl(k2, 0, 1.15), -0.08);
  if (k1 > 0) bill(CX, 900, cl(k1, 0, 1.15), 0);
  if (k1 > 0) { const n = t >= ws(23) ? 3000 : 1000, kk = t >= ws(23) ? pop(t - ws(23), 16, 0.5) : 1;
    at(CX, 1170, lerp(1.3, 1, cl(kk)), cl(k1), () => txt(`${money(n)} دلار`, 0, 0, 84, t >= ws(23) ? LIME : WHITE)); }
  const kx = pop(t - ws(22), 16, 0.5); if (kx > 0) at(850, 700, cl(kx, 0, 1.3), cl(kx), () => { circle(0, 0, 80, LIME); txt('×۳', 0, 6, 74, INKD); }, 0.1);
}
// twelve months of tripling: the bars stay flat for months, then break the chart; the balance counter under them
const mon = (i) => lerp(ws(32), ws(40), (i - 1) / 11);
function yearArt(t) {
  const x0 = 120, x1 = 960, base = 1330, top = 690, n = 12, step = (x1 - x0) / n, bw = step * 0.62, H11 = 560;
  line(x0 - 20, base, x1 + 20, base, rgba(WHITE, 0.25), 4);
  let cur = 0;
  for (let i = 1; i <= n; i++) {
    const st = mon(i), g = cub(k01(t, st, 0.22)); if (g <= 0) { txt(fa(i), x0 + step * (i - 0.5), base + 40, 30, rgba(WHITE, 0.25), { w: 700 }); continue; }
    cur = i; const v = Math.pow(3, i), hFull = Math.max(8, (v / Math.pow(3, 11)) * H11), h = hFull * g, x = x0 + step * (i - 0.5);
    const yTop = Math.max(top, base - h), col = i === 12 ? LIME : i >= 10 ? G : rgba(WHITE, 0.75);
    rrect(x - bw / 2, yTop, bw, base - yTop, 10, col);
    if (i === 12 && base - h < top) {   // it doesn't fit: a torn top and arrows out of the chart
      cv.fillStyle = INKD; cv.beginPath(); cv.moveTo(x - bw / 2 - 2, top - 2); for (let j = 0; j <= 4; j++) cv.lineTo(x - bw / 2 + (bw / 4) * j, top + (j % 2 ? 16 : 0)); cv.lineTo(x + bw / 2 + 2, top - 2); cv.closePath(); cv.fill();
      for (let j = 0; j < 3; j++) { const yy = top - 40 - ((t * 2 + j / 3) % 1) * 60; cv.save(); cv.globalAlpha = 0.9 - ((t * 2 + j / 3) % 1) * 0.9; cv.strokeStyle = LIME; cv.lineWidth = 8; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(x - 22, yy + 14); cv.lineTo(x, yy - 8); cv.lineTo(x + 22, yy + 14); cv.stroke(); cv.restore(); }
    }
    txt(fa(i), x, base + 40, 30, i === 12 ? LIME : MD, { w: 800 });
  }
  txt('ماه', x0 - 40, base + 40, 28, MD, { w: 700 });
  const k = cub(k01(t, ws(32), 0.3)); if (k <= 0) return;
  const bal = 1000 * Math.pow(3, cur), done = cur === 12;
  at(CX, 1450, done ? 1 + 0.12 * Math.exp(-(t - mon(12)) * 5) : 1, k, () => { rrect(-440, -62, 880, 124, 62, done ? LIME : PLATE); txt(`${money(bal)} دلار`, 0, 4, done ? 66 : 62, done ? INKD : WHITE); });
}
// «ریسک خیلی بزرگ»: a gauge that swings into the red and stays there, shaking
function riskArt(t) {
  const k = pop(t - ws(53) + 0.05, 13, 0.65); if (k <= 0) return;
  at(CX, 1390, cl(k, 0, 1.1), cl(k), () => {
    const r = 200, segs = [[G, 0, 0.4], [AMB, 0.4, 0.7], [R, 0.7, 1]];
    cv.lineWidth = 40; cv.lineCap = 'butt'; segs.forEach(([c, a, b]) => { cv.strokeStyle = c; cv.beginPath(); cv.arc(0, 0, r, Math.PI + a * Math.PI + 0.02, Math.PI + b * Math.PI - 0.02); cv.stroke(); });
    const sw = cub(k01(t, ws(54), 0.6)), shake = t > ws(54) + 0.6 ? Math.sin(t * 40) * 0.025 : 0, a = Math.PI + lerp(0.15, 0.95, sw) * Math.PI + shake;
    line(0, 0, Math.cos(a) * (r - 30), Math.sin(a) * (r - 30), WHITE, 12); circle(0, 0, 22, WHITE);
  });
}
// the worked example: a $1,000 account risking a fixed $200 a trade; five losses take all of it
const LOSS = (i) => lerp(ws(65), ws(69) + 0.15, i / 4);
function exampleArt(t) {
  const k = pop(t - T.example - 0.1, 12, 0.7); if (k <= 0) return;
  const lost = [0, 1, 2, 3, 4].filter((i) => t >= LOSS(i)).length, zero = t >= LOSS(4);
  at(CX, 1035, cl(k, 0, 1.08), cl(k), () => {
    rrect(-450, -390, 900, 780, 48, WHITE, rgba(VIO, 0.25), 4);
    chip('مثال', -360, -320, 32, MP, rgba(MP, 0.1));
    txt('حساب', 400, -320, 40, MP, { align: 'right', w: 800 });
    const sk = lost ? pop(t - LOSS(lost - 1), 18, 0.45) : 1;
    at(0, -200, lerp(1.25, 1, cl(sk)), 1, () => txt(`${money(1000 - 200 * lost)} دلار`, 0, 0, 110, zero ? R : INKP));
    // five $200 segments; each loss turns one red and drops it
    for (let i = 0; i < 5; i++) {
      const x = 330 - i * 165, y = -40, d = t - LOSS(i);
      if (d >= 0) { const f = cub(k01(d, 0.08, 0.5)); cv.save(); cv.globalAlpha *= 1 - f; rrect(x - 70, y - 55 + f * 160, 140, 110, 22, R); cv.restore(); rrect(x - 70, y - 55, 140, 110, 22, null, rgba(R, 0.5), 4); }
      else rrect(x - 70, y - 55, 140, 110, 22, G);
      if (d < 0) txt('۲۰۰', x, y + 3, 40, WHITE);
    }
    const kr = cub(k01(t, ws(59), 0.3)); if (kr > 0) txt('ریسک هر معامله: ۲۰۰ دلار (۲۰٪ از ۱٬۰۰۰)', 0, 90, 38, MP, { alpha: kr, w: 800 });
    // the losses, one chip each
    for (let i = 0; i < 5; i++) { const q = pop(t - LOSS(i), 16, 0.55); if (q <= 0) continue; at(330 - i * 165, 210, cl(q, 0, 1.2), cl(q), () => chip('−۲۰۰', 0, 0, 40, WHITE, R)); }
  });
  const st = pop(t - LOSS(4) - 0.15, 14, 0.5); if (st > 0) at(CX, 1400, lerp(1.8, 1, cl(st)), cl(st), () => { rrect(-230, -60, 460, 120, 22, null, R, 9); txt('حساب صفر شد', 0, 4, 58, R); }, -0.06);
}
// «دیر یا زود برای همه پیش میاد»: a wall of example trades, a run of five losses lights up
const TRADES = (() => { const s = []; for (let i = 0; i < 70; i++) s.push(rnd(i * 3.7 + 11) < 0.52 ? 1 : 0);
  // no accidental runs of five; then one run of five losses at 41–45
  for (let i = 4; i < 70; i++) if (s.slice(i - 4, i + 1).every((x) => x === 0)) s[i] = 1;
  for (let i = 41; i <= 45; i++) s[i] = 0; s[40] = 1; s[46] = 1; return s; })();
function wallArt(t) {
  const cols = 10, p = 90, x0 = CX + (cols - 1) * p / 2, y0 = 760, n = Math.floor(cl((t - ws(75)) / (ws(80) - 0.1 - ws(75))) * 70);
  for (let i = 0; i < 70; i++) {
    const r = Math.floor(i / cols), c = i % cols, x = x0 - c * p, y = y0 + r * p;   // right to left, top to bottom
    if (i >= n) { circle(x, y, 30, rgba(WHITE, 0.08)); continue; }
    const run = i >= 41 && i <= 45 && t >= ws(80);
    circle(x, y, 30, TRADES[i] ? G : run ? R : rgba(R, 0.6));
  }
  const h = cub(k01(t, ws(80), 0.35));
  if (h > 0) { const r = 4, xa = x0 - 5 * p, xb = x0 - 1 * p, y = y0 + r * p; cv.save(); cv.globalAlpha = h; rrect(xa - 52, y - 52, (xb - xa) + 104, 104, 52, null, R, 8); cv.restore();
    const q = pop(t - ws(80) - 0.1, 14, 0.6); if (q > 0) at((xa + xb) / 2, y0 + 7 * p + 20, cl(q, 0, 1.2), cl(q), () => chip('۵ ضرر پشت‌سرهم', 0, 0, 38, WHITE, R)); }
  const kn = cub(k01(t, ws(75) + 0.2, 0.3)); if (kn > 0) { cv.save(); cv.globalAlpha = kn; chip('نمونه', 920, 690, 28, MD, rgba(WHITE, 0.08)); cv.restore(); }
}
// «جوابش با حدس پیدا نمی‌شه»: «حدس» struck out on the ink half
function strikeGuess(t) { const k = cub(k01(t, ws(103) + 0.05, 0.3)); if (k > 0) line(770, 560, 770 - 460 * k, 560, R, 16); }
// the brand
function brandArt(t) {
  const ki = pop(t - ws(110) + 0.1, 12, 0.6); if (ki > 0 && IMG.icon) at(CX, 880, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 60; cv.shadowOffsetY = 18; cv.drawImage(IMG.icon, -160, -160, 320, 320); });
  const kw = cub(k01(t, ws(110) + 0.15, 0.35)); if (kw > 0 && IMG.wordL) { const w = 620, h = (w * IMG.wordL.height) / IMG.wordL.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.wordL, CX - w / 2, 1090 + (1 - kw) * 24, w, h); cv.restore(); }
}
// «روی سال‌ها داده‌ی واقعی»: real gold monthly candles from January 2015, drawn year by year
function yearsArt(t) {
  const B = GOLD.bars, N = B.length, x0 = 70, x1 = 1010, y0 = 770, y1 = 1320, step = (x1 - x0) / N, bw = Math.max(3, step * 0.62);
  const lo = Math.min(...B.map((b) => b[2])) * 0.95, hi = Math.max(...B.map((b) => b[1])) * 1.02, Y = (p) => y1 - ((p - lo) / (hi - lo)) * (y1 - y0);
  const n = Math.round(cl((t - ws(116) + 0.1) / (ws(120) + 0.3 - ws(116))) * N); if (n <= 0) return;
  for (let i = 0; i < n; i++) { const [o, h, l, c] = B[i], col = c >= o ? G : R, x = x0 + step * (i + 0.5); line(x, Y(h), x, Y(l), col, 2); cv.fillStyle = col; cv.fillRect(x - bw / 2, Y(Math.max(o, c)), bw, Math.max(2, Math.abs(Y(o) - Y(c)))); }
  const yr = 2015 + Math.floor((n - 1) / 12), xn = x0 + step * (n - 0.5);
  line(xn, y0 - 30, xn, y1 + 10, rgba(LIME, 0.6), 3, [10, 10]);
  at(cl(xn, 140, 940), y0 - 70, 1, 1, () => chip(fa(yr), 0, 0, 44, INKD, LIME));
  txt('طلا · ماهانه · ۲۰۱۵ تا ۲۰۲۶ · داده‌ی واقعی', CX, 1420, 34, MD, { w: 700 });
}
// two gauges: win rate and the worst drawdown; the readouts wait for your own numbers
function gauges(t) {
  [['وین‌ریت', ws(122), 780], ['بدترین افت', ws(125), 300]].forEach(([s, st], i) => {
    const x = i ? 300 : 780, k = pop(t - st + 0.1, 12, 0.7); if (k <= 0) return;
    at(x, 1020, cl(k, 0, 1.1), cl(k), () => {
      circle(0, 0, 200, PLATE); cv.lineWidth = 26; cv.lineCap = 'round'; cv.strokeStyle = 'rgba(255,255,255,0.1)'; cv.beginPath(); cv.arc(0, 0, 160, Math.PI * 0.8, Math.PI * 2.2); cv.stroke();
      const sw = cub(k01(t, st, 1.0)), a = Math.PI * 0.8 + Math.PI * 1.4 * (0.5 + 0.5 * Math.sin((t - st) * 5) * (1 - sw * 0.6)) * cl((t - st) * 2);
      cv.strokeStyle = i ? R : LIME; cv.beginPath(); cv.arc(0, 0, 160, Math.PI * 0.8, Math.max(Math.PI * 0.8, a)); cv.stroke();
      line(0, 0, Math.cos(a) * 120, Math.sin(a) * 120, WHITE, 10); circle(0, 0, 16, WHITE);
      txt(s, 0, 250, 48, WHITE); const caret = Math.floor(t * 2.5) % 2 ? '_' : ' '; txt(caret, 0, 95, 70, LIME, { dir: 'ltr' });
    });
  });
  const a = cub(k01(t, ws(127), 0.4)); if (a > 0) txt('عدد خودت، از معامله‌های خودت', CX, 1390, 46, LIME, { alpha: a, w: 800 });
}
// «یه سود کوچیک که تکرار می‌شه» against «یه ۲۰۰ درصدِ یه‌باره»: a steady staircase and a spike that crashes (shapes only)
function smallArt(t) {
  const k = pop(t - T.small - 0.1, 12, 0.7); if (k <= 0) return;
  at(CX, 1040, cl(k, 0, 1.08), cl(k), () => {
    rrect(-450, -370, 900, 740, 48, WHITE, rgba(VIO, 0.25), 4);
    chip('نمونه', -360, -305, 30, MP, rgba(MP, 0.1));
    line(-380, 250, 380, 250, rgba(INKP, 0.15), 4);
    // the staircase: small steps up, again and again
    const stair = [[-380, 250]]; let sy = 250; for (let i = 0; i < 9; i++) { const x = -380 + (i + 1) * 80; stair.push([x, sy]); sy -= 46; stair.push([x, sy]); }
    const ks = cub(k01(t, ws(130), ws(134) - ws(130) + 0.2)); if (ks > 0) { const e = trace(stair, ks, G, 14); if (ks > 0.98) at(e[0] - 10, e[1] - 60, 1, 1, () => chip('تکرار', 0, 0, 36, WHITE, G)); }
    // the spike: way up, then down below where it started
    const spike = [[-380, 250], [-200, 230], [-80, -250], [0, -270], [70, 120], [180, 330], [260, 300]];
    const kp = cub(k01(t, ws(137) - 0.05, ws(140) - ws(137) + 0.15)); if (kp > 0) { cv.save(); cv.globalAlpha *= 0.95; const e = trace(spike, kp, R, 12); cv.restore();
      if (kp > 0.98) { line(e[0] - 22, e[1] - 22, e[0] + 22, e[1] + 22, R, 10); line(e[0] - 22, e[1] + 22, e[0] + 22, e[1] - 22, R, 10); at(e[0] + 10, e[1] - 80, 1, 1, () => chip('یه‌باره', 0, 0, 36, WHITE, R)); } }
  });
}
// the end card: «شروعش رایگانه», then «لینک توی بیو»
function endCard(t) {
  const ki = pop(t - T.end + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 640, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, T.end + 0.2, 0.35));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 830 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - ws(144) + 0.05, 14, 0.55);
  if (kf > 0) at(CX, 1090, cl(kf, 0, 1.25), cl(kf), () => chip('شروعش رایگانه', 0, 0, 58, INKD, LIME));
  const kb = pop(t - ws(146) + 0.05, 14, 0.6), pulse = 1 + 0.04 * Math.sin((t - ws(146)) * 6) * (t > ws(146) + 1 ? 1 : 0);
  if (kb > 0) at(CX, 1260, cl(kb, 0, 1.2) * pulse, cl(kb), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, VIO); });
  const ka = cub(k01(t, ws(146) + 0.5, 0.4));
  if (ka > 0) { const y = 1410 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha = ka; cv.strokeStyle = WHITE; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 34, y + 20); cv.lineTo(CX, y - 14); cv.lineTo(CX + 34, y + 20); cv.stroke(); cv.restore(); }
}

const ART = { hook: hookArt, calc: calcArt, triple: tripleArt, year: yearArt, risk: riskArt, example: exampleArt, everyone: wallArt,
  guess: strikeGuess, brand: brandArt, years: yearsArt, stats: gauges, small: smallArt, end: endCard };

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  // a punch-in on the hard moments: the chart breaking, «هیچ‌کس», «ریسک», the account at zero
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(sh(mon(12), 12) + sh(ws(46), 8) + sh(ws(53), 10) + sh(LOSS(4), 12), 0);
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
/** The cover: the hook, and the arrow. */
window.cover = () => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  txt('چطور توی یه ماه', CX, 440, 112, INKP);
  const s = '۲۰۰ درصد', size = 230, w = measure(s, size); cv.save(); cv.translate(CX, 680); cv.rotate(-0.025); rrect(-w / 2 - 40, -size * 0.62, w + 80, size * 1.22, 22, VIO); cv.restore(); txt(s, CX, 680, size, WHITE);
  { const a = measure('سود', 140), b = measure('کنم؟', 140), gap = measure(' ', 140) * 1.45, right = CX + (a + gap + b) / 2; txt('سود', right - a / 2, 920, 140, G); txt('کنم؟', right - a - gap - b / 2, 920, 140, INKP); }
  hookArt(ws(8) + 2);
  rrect(CX - 330, 1540, 660, 110, 55, INKD); txt('بیا یه حساب ساده کنیم', CX, 1597, 56, WHITE);
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), loadImg('wordL', window.LOGO.wordL)]);
  window.seek(0); window.ready = true;
})();
