// k11 · «وین‌ریت استراتژیم ۶۰ درصد بود… پس چرا چالش پراپمو سوزوندم؟», as a live prop-challenge dashboard. The same
// voice, math and real screens as the other looks. One window on a dark trading-terminal screen stays for the whole reel.
// The spoken words land above it, and its title, status, counters and panel follow the story:
//   - the hook: the 60% win rate glows, five losses take the sample $10,000 account to $9,000 (−10%), the status flips
//     to «رد شد» with a glitch and «چالش رد شد»;
//   - «بیا یه حساب ساده کنیم»: the account rewinds to $10,000;
//   - the trade log of ten (six wins, four losses);
//   - expected vs real (the losses bunch);
//   - a 200-trade heatmap and the 71.4% gauge;
//   - the losing-streak alert counting to five;
//   - at 2% risk: −$200 a loss, the drawdown bar and the equity steps to −10%, the common prop limit, «حساب بسته شد»;
//   - a diagnostic: strategy «سالم», risk «خراب»;
//   - a rewind, the risk field typed from 2% to 1%, the same five losses stop at −5%, the status stays «فعال»;
//   - the counters turn to «؟», «حدس» against «بک‌تست»;
//   - the window opens f1's real gold replay, then the real Analytics losers box and Monte Carlo card, ringed;
//   - the pre-challenge checklist and the end card.
// The account and trades are a sample (labelled); the prop limit is the common 10%.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 700–900. Key content inside y 200–1560.
const W = 1080, H = 1920, CX = 540;
const BG = '#070B14', PANEL = '#0E1524', PANEL2 = '#131C30', EDGE = 'rgba(120,160,255,0.14)', MUT = '#7C8AA5';
const VIO = '#6C47FF', VIOL = '#A68BFF', LIME = '#C6F24E', G = '#22E39A', R = '#FF4D6A', AMB = '#FFB020', WHITE = '#FFFFFF', INKD = '#100C1C';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w;
const ws = (i) => Wd[i][0];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
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
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.gb ?? 24; }
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
const usd = (v) => '$' + fa(Math.round(v).toLocaleString('en-US')).replace(/,/g, '٬');
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800, dir: o.dir }); return w; }
function trace(pts, k, col, lw) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L;
  cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(...pts[0]); let end = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; cv.lineTo(...end); left -= seg[i]; }
  cv.stroke(); cv.restore(); return end;
}
function glow(col, blur, fn) { cv.save(); cv.shadowColor = col; cv.shadowBlur = blur; fn(); cv.restore(); }
function check(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); cv.save(); cv.strokeStyle = INKD; cv.lineWidth = r * 0.24; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-r * 0.4, 0); cv.lineTo(-r * 0.1, r * 0.3); cv.lineTo(r * 0.42, -r * 0.3); cv.stroke(); cv.restore(); }); }
function cross(x, y, r, col, k = 1) { if (k <= 0) return; at(x, y, cl(k, 0, 1.2), cl(k), () => { circle(0, 0, r, col); line(-r * 0.36, -r * 0.36, r * 0.36, r * 0.36, WHITE, r * 0.22); line(r * 0.36, -r * 0.36, -r * 0.36, r * 0.36, WHITE, r * 0.22); }); }
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }
function crop(key, r, x, y, w) { const im = IMG[key]; const h = (w * r[3]) / r[2]; if (!im) return h; const s = im.width / 1440; cv.save(); cv.beginPath(); cv.roundRect(x, y, w, h, 14); cv.clip(); cv.drawImage(im, r[0] * s, r[1] * s, r[2] * s, r[3] * s, x, y, w, h); cv.restore(); return h; }
function ringIn(r, q, x, y, w, k, col = LIME) { if (k <= 0) return; const s = w / r[2], m = 10 * (1 - k) + 6; cv.save(); cv.globalAlpha *= k; cv.shadowColor = rgba(col, 0.8); cv.shadowBlur = 18;
  rrect(x + (q[0] - r[0]) * s - m, y + (q[1] - r[1]) * s - m, q[2] * s + 2 * m, q[3] * s + 2 * m, 14, null, col, 6); cv.restore(); }

// ---------- the scenes: the spoken lines (word groups) above the window ----------
// a token: [text, word index (or [first, last]), { c: colour, hl: marker colour, ht: text colour on the marker, blur }]
const L_ = (y, size, toks, c = WHITE) => ({ y, size, c, toks });
const SC = [
  { k: 'hook', groups: [
    { at: 0, lines: [L_(250, 100, [['وین‌ریتِ', 0], ['استراتژیم', 1]]), L_(430, 170, [[pct(60), [2, 3], { c: G }], ['بود…', 4]])] },
    { at: 5, lines: [L_(240, 100, [['پس', 5], ['چرا', 6, { c: LIME }]]), L_(360, 100, [['چالش', 7], ['پراپمو', 8, { c: LIME }]]), L_(500, 130, [['سوزوندم؟', 9, { hl: R, ht: WHITE }]])] }] },
  { k: 'calc', groups: [{ at: 10, lines: [L_(320, 120, [['بیا', 10], ['یه', 11], ['حساب', 12, { hl: LIME, ht: INKD }]]), L_(470, 120, [['ساده', 13], ['کنیم.', 14]])] }] },
  { k: 'four', groups: [
    { at: 15, lines: [L_(240, 96, [['وین‌ریت', 15], [pct(60), [16, 17], { c: G }]]), L_(360, 96, [['یعنی', 18], ['از', 19], ['هر', 20], ['۱۰', 21, { c: LIME }], ['تا', 22], ['معامله،', 23]]), L_(500, 130, [['۴', 24, { hl: R, ht: WHITE }], ['تاش', 25], ['ضرره.', 26, { c: R }]])] }] },
  { k: 'spread', groups: [{ at: 27, lines: [L_(240, 104, [['ولی', 27], ['بازار', 28, { c: LIME }]]), L_(360, 104, [['این', 29], ['۴', 30, { c: R }], ['تا', 31], ['رو', 32]]), L_(495, 110, [['مرتب', 33], ['پخش', 34, { hl: R, ht: WHITE }], ['نمی‌کنه.', [35, 36]]])] }] },
  { k: 'odds', groups: [
    { at: 37, lines: [L_(330, 120, [['توی', 37], ['۲۰۰', 38, { hl: LIME, ht: INKD }], ['تا', 39], ['معامله،', 40]])] },
    { at: 41, lines: [L_(240, 100, [['به', 41], ['احتمال', 42], ['بیشتر', 43], ['از', 44]]), L_(430, 200, [[pct(70), [45, 46], { hl: VIO, ht: WHITE }]])] }] },
  { k: 'run', groups: [{ at: 47, lines: [L_(240, 100, [['حداقل', [47, 48]], ['یه', 49], ['بار', 50]]), L_(375, 140, [['۵', 51, { hl: R, ht: WHITE }], ['تا', 52], ['ضرر', 53, { c: R }]]), L_(515, 104, [['پشت‌سرهم', [54, 56]], ['می‌خوری.', [57, 58]]])] }] },
  { k: 'risk2', groups: [
    { at: 59, lines: [L_(260, 110, [['با', 59], ['ریسک', 60], [pct(2), [61, 62], { c: LIME }]]), L_(400, 110, [['۵', 63], ['تا', 64], ['ضرر', 65, { c: R }]])] },
    { at: 66, lines: [L_(260, 104, [['یعنی', 66], ['حدود', 67]]), L_(430, 190, [[pct(10), [68, 69], { hl: R, ht: WHITE }], ['افت.', 70]])] }] },
  { k: 'prop', groups: [{ at: 71, lines: [L_(240, 104, [['همون', 71], ['حدی', 72], ['که', 73]]), L_(360, 100, [['توی', 74], ['خیلی', 75], ['از', 76], ['پراپ‌ها', [77, 78], { hl: LIME, ht: INKD }]]), L_(500, 124, [['حسابتو', 79], ['می‌بنده.', [80, 81], { c: R }]])] }] },
  { k: 'twist', groups: [
    { at: 82, lines: [L_(270, 110, [['یعنی', 82], ['استراتژیت', 83]]), L_(430, 140, [['خراب', 84], ['نبود؛', 85, { hl: G, ht: INKD }]])] },
    { at: 86, lines: [L_(290, 160, [['ریسکت', 86, { hl: R, ht: WHITE }]]), L_(470, 140, [['خراب', 87], ['بود.', 88]])] }] },
  { k: 'risk1', groups: [
    { at: 89, lines: [L_(240, 100, [['با', 89], ['ریسک', 90], [pct(1), [91, 92], { hl: G, ht: INKD }]]), L_(360, 100, [['همون', 93], ['۵', 94], ['تا', 95], ['ضرر', 96]]), L_(495, 120, [['می‌شه', [97, 98]], [pct(5), [99, 100], { c: G }]])] },
    { at: 101, lines: [L_(300, 120, [['و', 101], ['هنوز', 102]]), L_(460, 140, [['توی', 103], ['بازی‌ای.', 104, { hl: G, ht: INKD }]])] }] },
  { k: 'real', groups: [{ at: 105, lines: [L_(240, 100, [['ولی', 105], ['عدد', 106], ['واقعیِ', 107, { c: LIME }]]), L_(360, 104, [['استراتژی', 108], ['خودت', 109]]), L_(505, 150, [['چنده؟', 110, { hl: VIO, ht: WHITE }]])] }] },
  { k: 'guess', groups: [{ at: 111, lines: [L_(280, 110, [['با', 111], ['حدس', 112, { c: MUT, blur: 4 }], ['پیدا', 113], ['نمی‌شه؛', [114, 115]]]), L_(440, 120, [['با', 116], ['بک‌تست', [117, 118], { hl: LIME, ht: INKD }], ['پیدا', 119], ['می‌شه.', [120, 121]]])] }] },
  { k: 'lab', groups: [{ at: 122, lines: [L_(240, 100, [['توی', 122], ['بک‌تست‌لب', [123, 125], { c: LIME }]]), L_(360, 96, [['استراتژیتو', 126], ['روی', 127], ['بازار', 128]]), L_(485, 100, [['واقعیِ', 129], ['گذشته', 130, { hl: LIME, ht: INKD }], ['تست', 131], ['می‌کنی،', [132, 133]]])] }] },
  { k: 'analytics', groups: [
    { at: 134, lines: [L_(240, 92, [['و', 134], ['آنالیزش', 135, { c: VIOL }], ['بهت', 136], ['می‌گه', [137, 138]]]), L_(360, 100, [['بیشترین', 139], ['ضررهای', 140, { hl: R, ht: WHITE }]]), L_(480, 96, [['پشت‌سرهمت', [141, 142]], ['چندتاست', [143, 144]]])] },
    { at: 145, lines: [L_(300, 110, [['و', 145], ['بدترین', 146], ['افتت', 147, { hl: R, ht: WHITE }]]), L_(450, 110, [['چقدره.', 148]])] }] },
  { k: 'first', groups: [
    { at: 149, lines: [L_(300, 130, [['اول', 149, { hl: LIME, ht: INKD }], ['ریسکتو', 150]]), L_(460, 110, [['اینجا', 151], ['تنظیم', 152], ['کن،', 153]])] },
    { at: 154, lines: [L_(300, 130, [['بعد', 154, { hl: LIME, ht: INKD }], ['پول', 155]]), L_(460, 110, [['چالش', 156], ['رو', 157], ['بده.', 158]])] }] },
  { k: 'cta', groups: [] },
];
SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; });
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);
const scene = (t) => SC.filter((s) => t >= s.t0 - 0.05).pop() ?? SC[0];
// the spoken words: each token lands (a spring from 0.8×) as its word starts; the reel's first line is there from frame 0
function words(s, t) {
  s.groups.forEach((g, gi) => {
    const next = s.groups[gi + 1], gEnd = next ? ws(next.at) - 0.08 : s.t1 - 0.02, opening = s === SC[0] && gi === 0;
    if (t < ws(g.at) - 0.3 && !opening) return; if (t > gEnd) return;
    const gOut = k01(t, gEnd - 0.1, 0.1);
    g.lines.forEach((ln) => {
      const gap = measure(' ', ln.size) * 1.45, wds = ln.toks.map(([x]) => measure(x, ln.size)), total = wds.reduce((a, b) => a + b, 0) + gap * (ln.toks.length - 1);
      const sc = Math.min(1, 960 / total); let right = CX + (total * sc) / 2;
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

// ---------- the account: a sample $10,000 challenge, fixed risk on the start balance ----------
const START = 10000, LIMIT = 10;
const HOOKL = [0, 1, 2, 3, 4].map((i) => lerp(ws(5), ws(9) - 0.12, i / 4));
const L2 = [0, 1, 2, 3, 4].map((i) => lerp(ws(63) - 0.05, ws(66) + 0.2, i / 4));
const L1 = [0, 1, 2, 3, 4].map((i) => lerp(ws(93), ws(98), i / 4));
const nLoss = (times, t) => times.reduce((n, a) => n + cub(k01(t, a, 0.22)), 0);
function account(t) {
  let bal = START, risk = 2;
  if (t < T.calc) bal = START - 200 * nLoss(HOOKL, t);
  else if (t < T.calc + 0.85) bal = lerp(START - 1000, START, cub(k01(t, T.calc, 0.85)));
  else if (t < T.risk2) bal = START;
  else if (t < T.risk1) bal = START - 200 * nLoss(L2, t);
  else if (t < T.risk1 + 0.6) bal = lerp(START - 1000, START, cub(k01(t, T.risk1, 0.6)));
  else { bal = START - 100 * nLoss(L1, t); }
  if (t >= ws(91) - 0.05) risk = 1;
  const failed = (t >= ws(9) && t < T.calc + 0.5) || (t >= ws(80) && t < T.risk1 + 0.35);
  return { bal, dd: ((START - bal) / START) * 100, risk, failed };
}

// ---------- the window: title, status, counters, and the panel of the moment ----------
const WX = 50, WY = 600, WW = 980, WH = 960, PX = CX, PY = 1190;   // the panel's centre; it spans x ±470, y ±345
function title(t) { return t < T.lab ? 'چالش پراپ · حساب نمونه' : t < T.analytics ? 'بک‌تست‌لب · بازپخش' : t < T.first ? 'بک‌تست‌لب · آنالیز' : 'قبل از خرید چالش'; }
function frameWin(t, A) {
  const wa = 1 - cub(k01(t, T.cta - 0.1, 0.3)); if (wa <= 0) return 0;
  const k = cub(k01(t, -0.3, 0.5));
  cv.save(); cv.globalAlpha *= wa;
  glow(A.failed ? rgba(R, 0.5) : 'rgba(0,0,0,0.6)', A.failed ? 60 : 50, () => rrect(WX, WY, WW, WH, 34, PANEL));
  rrect(WX, WY, WW, WH, 34, null, A.failed ? rgba(R, 0.8) : EDGE, A.failed ? 4 : 2);
  // the title bar
  cv.save(); cv.beginPath(); cv.roundRect(WX, WY, WW, 78, [34, 34, 0, 0]); cv.fillStyle = PANEL2; cv.fill(); cv.restore();
  [0, 1, 2].forEach((i) => circle(WX + WW - 40 - i * 30, WY + 39, 9, [R, AMB, G][i]));
  txt(title(t), WX + WW - 140, WY + 40, 32, WHITE, { align: 'right', w: 800 });
  if (t < T.lab) { const fail = A.failed, s = fail ? 'رد شد' : 'فعال', blink = fail ? 0.6 + 0.4 * Math.sin(t * 16) : 1;
    at(WX + 110, WY + 39, 1, blink, () => chip(s, 0, 0, 28, fail ? WHITE : INKD, fail ? R : G)); }
  cv.restore();
  return wa * k;
}
// the three counters: balance, drawdown (with its bar and the limit), win rate; «؟» from «عدد واقعی…»; gone from the replay
function kpis(t, A) {
  const a = 1 - cub(k01(t, T.lab - 0.15, 0.3)); if (a <= 0) return;
  const unk = t >= T.real, ku = cub(k01(t, T.real, 0.3));
  const tiles = [
    { l: unk ? 'بدترین افت' : 'موجودی', v: usd(A.bal), c: A.bal < START ? R : WHITE },
    { l: unk ? 'ضررهای پشت‌سرهم' : 'افت', v: A.dd > 0.01 ? '−' + pct(Math.round(A.dd * 10) / 10) : pct(0), c: A.dd >= LIMIT - 0.01 ? R : A.dd > 0 ? AMB : WHITE, bar: !unk },
    { l: 'وین‌ریت', v: pct(60), c: G, hot: t < T.calc },
  ];
  cv.save(); cv.globalAlpha *= a;
  tiles.forEach((tl, i) => {
    const x = WX + WW - 20 - (i + 1) * 300 - i * 13, y = WY + 96, w = 300, h = 140;
    if (tl.hot) glow(rgba(G, 0.6), 30 + 10 * Math.sin(t * 6), () => rrect(x, y, w, h, 22, PANEL2)); else rrect(x, y, w, h, 22, PANEL2);
    rrect(x, y, w, h, 22, null, tl.hot ? rgba(G, 0.7) : EDGE, 2);
    txt(tl.l, x + w - 22, y + 34, 26, MUT, { align: 'right', w: 700 });
    if (unk && i < 3) { cv.save(); cv.globalAlpha *= 1 - ku; txt(tl.v, x + w / 2, y + 88, 46, tl.c, { dir: 'ltr' }); cv.restore(); cv.save(); cv.globalAlpha *= ku; txt(Math.floor(t * 2.5) % 2 ? '؟' : '', x + w / 2, y + 88, 58, LIME, { glow: rgba(LIME, 0.7) }); cv.restore(); }
    else txt(tl.v, x + w / 2, y + 88, 46, tl.c, { dir: 'ltr', glow: tl.hot ? rgba(G, 0.6) : undefined });
    if (tl.bar) { const bw = w - 44, f = cl(A.dd / 12); rrect(x + 22, y + h - 18, bw, 8, 4, 'rgba(255,255,255,0.08)'); rrect(x + 22 + bw * (1 - f), y + h - 18, bw * f, 8, 4, A.dd >= LIMIT - 0.01 ? R : AMB);
      const lx = x + 22 + bw * (1 - LIMIT / 12); line(lx, y + h - 26, lx, y + h - 2, R, 3); }
  });
  cv.restore();
}

// ---------- the panels (drawn at the panel's centre; x ±470, y ±345) ----------
const Y$ = (v, top = -230, sc = 0.36) => top + (START - v) * sc;
/** Equity steps: `n` (fractional) losses of `per` dollars from x0; returns the pen. */
function equity(n, per, col, x0 = -120, step = 105, top = -230, lw = 9) {
  const pts = [];
  for (let i = 0; i <= 26; i++) { const x = -430 + i * ((x0 + 430) / 26); pts.push([x, Y$(START, top) + Math.sin(i * 1.3) * 10 - (i / 26) * 6]); }
  pts.push([x0, Y$(START, top)]);
  for (let i = 0; i < 5; i++) { const f = cl(n - i); if (f <= 0) break; const x = x0 + i * step, y0 = Y$(START - per * i, top), y1 = Y$(START - per * (i + f), top); pts.push([x, y0], [x, y1]); if (f >= 1) pts.push([x + step * 0.92, y1]); }
  glow(rgba(col, 0.6), 16, () => trace(pts, 1, col, lw)); const e = pts[pts.length - 1]; circle(e[0], e[1], 12, col); return e;
}
function limitLine(a, top = -230, label = true) { if (a <= 0) return; cv.save(); cv.globalAlpha *= a; const y = Y$(START * (1 - LIMIT / 100), top); line(-440, y, 440, y, R, 4, [16, 10]); if (label) chip('حد افت رایج پراپ‌ها: ' + pct(10), -250, y + 40, 26, WHITE, R); cv.restore(); }
function stamp(s, k, col = R, rot = -0.1, size = 74) { if (k <= 0) return; at(0, 0, lerp(1.8, 1, cl(k)), cl(k * 3), () => { const w = measure(s, size) + 90; glow(rgba(col, 0.6), 30, () => rrect(-w / 2, -size * 0.9, w, size * 1.8, 24, col)); rrect(-w / 2 + 12, -size * 0.9 + 12, w - 24, size * 1.8 - 24, 16, null, WHITE, 5); txt(s, 0, 6, size, WHITE); }, rot); }
function rewindIcon(x, y, s = 1) { at(x, y, s, 1, () => { cv.fillStyle = WHITE; [0, 38].forEach((dx) => { cv.beginPath(); cv.moveTo(-dx + 10, -24); cv.lineTo(-dx - 26, 0); cv.lineTo(-dx + 10, 24); cv.closePath(); cv.fill(); }); }); }

// hook: the 60% win rate, then five losses and the challenge fails
function hookP(t, A) {
  txt('منحنی سرمایه', 430, -300, 28, MUT, { align: 'right', w: 700 });
  equity((START - A.bal) / 200, 200, A.bal < START ? R : G);
  limitLine(cub(k01(t, ws(5), 0.4)), -230, false);
  at(0, 40, 1, 1, () => stamp('چالش رد شد', pop(t - ws(9) - 0.02, 14, 0.5)));
}
// «بیا یه حساب ساده کنیم»: the account rewinds
function calcP(t, A) {
  equity((START - A.bal) / 200, 200, A.bal < START ? R : G);
  const k = 1 - cub(k01(t, T.calc + 0.85, 0.2)); if (k <= 0) return;
  cv.save(); cv.globalAlpha *= k; for (let j = 0; j < 14; j++) { const y = -345 + rnd(j * 3.1 + Math.floor(t * 24)) * 690; line(-470, y, 470, y, 'rgba(255,255,255,0.18)', 2); }
  rewindIcon(330, -280, 1.2); txt('بازپخش', 250, -280, 34, WHITE, { align: 'right' }); cv.restore();
}
// the trade log of ten
const EVEN = [1, 1, -1, 1, -1, 1, 1, -1, 1, -1];
function fourP(t) {
  txt('معامله‌ها', 430, -310, 28, MUT, { align: 'right', w: 700 });
  EVEN.forEach((v, i) => {
    const k = pop(t - ws(21) - i * 0.05, 14, 0.6); if (k <= 0) return;
    const x = i < 5 ? 235 : -235, y = -235 + (i % 5) * 104, ts = ws(24) - 0.05 + (v < 0 ? 0 : 0.25), rev = t >= ts, kr = cub(k01(t, ts, 0.2));
    at(x, y + (1 - cl(k)) * 30, 1, cl(k), () => {
      rrect(-215, -42, 430, 84, 18, PANEL2, rev ? rgba(v > 0 ? G : R, 0.5) : EDGE, 2);
      txt('معامله‌ی ' + fa(i + 1), 190, 2, 32, WHITE, { align: 'right', w: 800 });
      if (!rev) txt('…', -140, 0, 34, MUT); else at(-140, 0, lerp(1.25, 1, kr), 1, () => chip(v > 0 ? 'سود' : 'ضرر', 0, 0, 30, INKD, v > 0 ? G : R));
    });
  });
  const ks = pop(t - ws(25) + 0.05, 13, 0.6); if (ks > 0) at(0, 300, cl(ks, 0, 1.15), cl(ks), () => { chip('۶ سود', 120, 0, 34, INKD, G); chip('۴ ضرر', -120, 0, 34, WHITE, R); });
}
// expected vs real: the four losses bunch
const SLOT = (() => { const w = [0, 1, 2, 7, 8, 9], l = [3, 4, 5, 6]; let wi = 0, li = 0; return EVEN.map((v) => (v > 0 ? w[wi++] : l[li++])); })();
function cell(v, s = 70) { rrect(-s / 2, -s / 2, s, s, 14, v > 0 ? rgba(G, 0.9) : R); if (v < 0) { line(-12, -12, 12, 12, WHITE, 7); line(12, -12, -12, 12, WHITE, 7); } }
function spreadP(t) {
  const X = (i) => 378 - i * 84;
  txt('انتظار', 430, -250, 30, MUT, { align: 'right', w: 800 }); EVEN.forEach((v, i) => at(X(i), -170, 1, 1, () => cell(v)));
  const k2 = pop(t - ws(34) + 0.1, 12, 0.6); if (k2 <= 0) return;
  const km = cub(k01(t, ws(34) + 0.05, 0.6));
  at(0, 110, 1, cl(k2), () => {
    txt('واقعیت', 430, -80, 30, R, { align: 'right', w: 800 });
    EVEN.forEach((v, i) => at(lerp(X(i), X(SLOT[i]), km), 0, 1, 1, () => cell(v)));
    const kr = cub(k01(t, ws(35) + 0.3, 0.35)); if (kr > 0) { cv.save(); cv.globalAlpha *= kr; glow(rgba(R, 0.9), 20, () => rrect(X(6) - 52, -52, X(3) - X(6) + 104, 104, 26, null, R, 6)); cv.restore();
      at(0, 140, 1, kr, () => chip('هشدار: ۴ ضرر پشت‌سرهم', 0, 0, 30, WHITE, R)); }
  });
}
// 200 trades and the gauge
const SEQ = (() => { const s = Array.from({ length: 200 }, (_, i) => (rnd(i * 7.13 + 3) < 0.4 ? -1 : 1)); s[125] = 1; for (let i = 126; i <= 130; i++) s[i] = -1; s[131] = 1; return s; })();
function oddsP(t) {
  const t0 = ws(38) - 0.05, t1 = ws(40) + 0.6, f = cl((t - t0) / (t1 - t0)), io = f < 0.5 ? 4 * f ** 3 : 1 - Math.pow(-2 * f + 2, 3) / 2, n = Math.floor(io * 200 + 0.0001);
  txt('معامله‌ها: ' + fa(n) + ' از ' + fa(200), 430, -310, 30, WHITE, { align: 'right', w: 800 }); chip('نمونه', -390, -310, 22, MUT, 'rgba(255,255,255,0.06)');
  for (let i = 0; i < 200; i++) { const c = i % 20, r = Math.floor(i / 20), x = 399 - c * 42, y = -250 + r * 36; rrect(x - 17, y - 14, 34, 28, 6, i < n ? (SEQ[i] > 0 ? rgba(G, 0.85) : R) : 'rgba(255,255,255,0.05)'); }
  const kg = cub(k01(t, ws(41), 0.3)); if (kg <= 0) return;
  at(0, 220, 1, kg, () => {
    txt('احتمال حداقل یه بار ۵ ضرر پشت‌سرهم', 430, -36, 28, MUT, { align: 'right', w: 700 });
    const fill = cub(k01(t, ws(42), ws(45) - ws(42) + 0.2)) * 0.714;
    rrect(-430, 0, 860, 40, 20, 'rgba(255,255,255,0.08)'); glow(rgba(VIOL, 0.7), 18, () => rrect(430 - 860 * fill, 0, 860 * fill, 40, 20, VIO));
    if (t > ws(45) - 0.1) txt(pct(71.4), 430 - 860 * fill - 70, 20, 34, VIOL, { dir: 'ltr' });
    txt('فرض: وین‌ریت ' + pct(60) + ' و معامله‌های مستقل', 0, 90, 24, MUT, { w: 700 });
  });
}
// the streak alert counts to five
function runP(t) {
  const lit = (j) => lerp(ws(51) - 0.05, ws(57), j / 4), n = [0, 1, 2, 3, 4].filter((j) => t >= lit(j)).length, blink = 0.55 + 0.45 * Math.sin(t * 14);
  at(0, -250, 1, n ? blink : 0.4, () => { rrect(-430, -46, 860, 92, 22, rgba(R, 0.18), R, 3); txt('هشدار: ضرر پشت‌سرهم', 0, 3, 38, R); });
  for (let j = 0; j < 5; j++) { const x = 300 - j * 150, q = pop(t - lit(j), 16, 0.5); rrect(x - 60, -60, 120, 120, 22, 'rgba(255,255,255,0.06)'); if (q > 0) at(x, 0, cl(q, 0, 1.25), cl(q), () => glow(rgba(R, 0.8), 24, () => cell(-1, 120))); }
  txt(fa(n), 0, 220, 150, n ? R : MUT, { glow: n ? rgba(R, 0.6) : undefined }); txt('ضرر پشت‌سرهم', 0, 320, 34, MUT, { w: 800 });
}
// 2% risk: −$200 a loss
function riskField(t, v, x = 0, y = -300, typing) {
  rrect(x - 430, y - 40, 860, 80, 20, PANEL2, EDGE, 2); txt('ریسک هر معامله', x + 400, y + 2, 30, MUT, { align: 'right', w: 700 });
  rrect(x - 420, y - 30, 200, 60, 14, '#0A101C', typing ? LIME : EDGE, typing ? 3 : 2); txt(pct(v), x - 320, y + 2, 38, typing ? LIME : WHITE, { dir: 'ltr' });
  if (typing && Math.floor(t * 3) % 2) line(x - 270, y - 18, x - 270, y + 20, LIME, 3);
}
function risk2P(t, A) {
  riskField(t, 2);
  equity((START - A.bal) / 200, 200, R, -120, 105, -180);
  const n = Math.floor(nLoss(L2, t) + 0.0001);
  for (let i = 0; i < n; i++) at(330 - i * 165, 300, 1, 1, () => chip('−' + usd(200), 0, 0, 30, WHITE, R, { dir: 'ltr' }));
}
// the prop limit, the account closed
function propP(t, A) {
  riskField(t, 2); equity(5, 200, R, -120, 105, -180); limitLine(cub(k01(t, ws(72), 0.4)), -180);
  const kb = pop(t - ws(80) - 0.05, 14, 0.5);
  if (kb > 0) at(0, 20, lerp(1.6, 1, cl(kb)), cl(kb * 3), () => { glow(rgba(R, 0.7), 40, () => rrect(-330, -120, 660, 240, 30, '#1A0B12')); rrect(-330, -120, 660, 240, 30, null, R, 4);
    rrect(-24, -86, 48, 40, 8, R); cv.save(); cv.strokeStyle = R; cv.lineWidth = 8; cv.beginPath(); cv.arc(0, -86, 18, Math.PI, 0); cv.stroke(); cv.restore();
    txt('حساب بسته شد', 0, 10, 60, WHITE); txt('حد افت رد شد', 0, 75, 28, R, { w: 800 }); });
}
// diagnostics: strategy fine, risk broken
function twistP(t) {
  txt('عیب‌یابی حساب', 430, -300, 30, MUT, { align: 'right', w: 800 });
  const ks = k01(t, T.twist, ws(85) - T.twist); if (ks < 1) { const y = lerp(-240, 240, ks); glow(rgba(LIME, 0.8), 20, () => line(-440, y, 440, y, LIME, 3)); }
  [['استراتژی', 85, 'سالم', G], ['ریسک', 87, 'خراب', R]].forEach(([name, wi, res, col], i) => {
    const y = -110 + i * 220, k = cub(k01(t, i ? ws(86) - 0.1 : T.twist + 0.05, 0.3)); if (k <= 0) return;
    at(0, y, 1, k, () => {
      rrect(-430, -80, 860, 160, 26, PANEL2, t >= ws(wi) ? rgba(col, 0.7) : EDGE, t >= ws(wi) ? 3 : 2);
      txt(name, 390, 0, 56, WHITE, { align: 'right' });
      if (t >= ws(wi)) { at(-130, 0, 1, 1, () => chip(res, 0, 0, 40, i ? WHITE : INKD, col)); (i ? cross : check)(-330, 0, 50, col, pop(t - ws(wi), 13, 0.5)); }
      else txt('در حال بررسی…', -200, 0, 30, MUT, { w: 700 });
    });
  });
}
// 1% risk: the same five losses stop at −5%
function risk1P(t, A) {
  riskField(t, A.risk, 0, -300, t >= ws(90) - 0.1 && t < ws(92) + 0.4);
  cv.save(); cv.globalAlpha *= 0.3; equity(5, 200, R, -120, 105, -180, 7); cv.restore();
  limitLine(1, -180, false);
  if (t >= T.risk1 + 0.6) equity(nLoss(L1, t), 100, G, -120, 105, -180); else equity((START - A.bal) / 200, 200, R, -120, 105, -180);
  const kr = 1 - cub(k01(t, T.risk1 + 0.6, 0.2)); if (kr > 0) { cv.save(); cv.globalAlpha *= kr; for (let j = 0; j < 12; j++) { const y = -345 + rnd(j * 2.7 + Math.floor(t * 24)) * 690; line(-470, y, 470, y, 'rgba(255,255,255,0.18)', 2); } rewindIcon(330, -200, 1.1); cv.restore(); }
  const kp = pop(t - ws(102) + 0.05, 13, 0.55); if (kp > 0) at(0, 270, cl(kp, 0, 1.2), cl(kp), () => glow(rgba(G, 0.7), 24, () => chip('هنوز توی بازی', 0, 0, 40, INKD, G)));
}
// «عدد واقعیِ استراتژی خودت چنده؟»
function realP(t) {
  const k = pop(t - ws(106) + 0.05, 12, 0.6); if (k <= 0) return;
  at(0, -20, cl(k, 0, 1.15), cl(k), () => { glow(rgba(LIME, 0.6), 40, () => circle(0, 0, 150, PANEL2)); circle(0, 0, 150, null, LIME, 5); txt(Math.floor(t * 2.5) % 2 ? '؟' : '', 0, 10, 180, LIME); });
  txt('عدد واقعیِ استراتژی تو', 0, 230, 34, MUT, { w: 800, alpha: cl(k) });
}
// «حدس» against «بک‌تست»
const PIPS = [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]];
function guessP(t) {
  [['حدس', 112, 115], ['بک‌تست', 117, 119]].forEach(([name, a, b], i) => {
    const k = pop(t - ws(a) + 0.05, 12, 0.6); if (k <= 0) return; const x = i ? -225 : 225;
    at(x, -20, cl(k, 0, 1.15), cl(k), () => {
      rrect(-200, -230, 400, 460, 30, PANEL2, i ? rgba(LIME, 0.8) : EDGE, i ? 4 : 2);
      if (!i) { const roll = t < ws(113); at(0, -60, 1, 1, () => { rrect(-90, -90, 180, 180, 34, WHITE); PIPS.forEach(([px, py]) => circle(px * 46, py * 46, 17, INKD)); }, roll ? Math.sin(t * 9) * 0.35 : 0.12); }
      else glow(rgba(LIME, 0.6), 16, () => trace([[-140, 20], [-80, -30], [-30, 0], [30, -70], [90, -40], [140, -110]], 1, LIME, 10));
      txt(name, 0, 150, 52, i ? LIME : MUT);
      if (!i) cross(140, -190, 40, R, pop(t - ws(b) + 0.02, 14, 0.5)); else check(140, -190, 40, G, pop(t - ws(b), 14, 0.5));
    });
  });
}
// the real gold replay (f1)
const RR = [520, 200, 560, 620], DK = Array.from({ length: 20 }, (_, i) => 'd' + String(2 + i * 2).padStart(2, '0'));
const FLIP = (t, t0, t1, keys) => keys[Math.min(keys.length - 1, Math.max(0, Math.floor(cl((t - t0) / (t1 - t0)) * keys.length)))];
function labP(t) {
  const w = 600, h = (w * RR[3]) / RR[2], x = -300, y = -340;
  crop(FLIP(t, T.lab, T.analytics + 0.3, DK), RR, x, y, w); rrect(x, y, w, h, 14, null, EDGE, 2);
  if (IMG.icon) { const k = pop(t - ws(123) + 0.05, 13, 0.5); if (k > 0) at(x + w, y, cl(k, 0, 1.2), cl(k), () => { cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 24; cv.drawImage(IMG.icon, -55, -55, 110, 110); }); }
  txt('صفحه‌ی واقعی بک‌تست‌لب · بازپخش طلا', 0, y + h + 0.5 * (345 - y - h) + 4, 26, MUT, { w: 700 });
}
// the real Analytics (f1's losers box, k1's Monte Carlo card)
const RWL = [36, 196, 556, 266], QWL = [50, 378, 530, 30], RMC = [325, 605, 545, 92], QMC = [331, 619, 260, 68];
function analyticsP(t) {
  const w = 900, x = -450, y = -335, h = crop('wl', RWL, x, y, w); ringIn(RWL, QWL, x, y, w, cub(k01(t, ws(139), 0.35)));
  const k2 = pop(t - ws(145) + 0.1, 12, 0.6);
  if (k2 > 0) at(0, (1 - cl(k2)) * 40, 1, cl(k2), () => { const y2 = y + h + 26, h2 = crop('mc', RMC, x, y2, w); ringIn(RMC, QMC, x, y2, w, cub(k01(t, ws(146), 0.35))); txt('صفحه‌ی واقعی بک‌تست‌لب · آنالیز', 0, y2 + h2 + 34, 26, MUT, { w: 700 }); });
}
// the checklist before buying the challenge
const SL = [[0.5, 300], [1, 100], [2, -100], [3, -300]];
function firstP(t) {
  at(0, -170, 1, 1, () => {
    rrect(-430, -130, 860, 260, 28, PANEL2, EDGE, 2); chip('۱', 370, -78, 30, INKD, LIME); txt('ریسک هر معامله', 320, -78, 36, WHITE, { align: 'right' });
    rrect(-330, 10, 660, 20, 10, 'rgba(255,255,255,0.12)'); SL.forEach(([v, x]) => txt(pct(v), x, 74, 28, MUT, { w: 800 }));
    const km = cub(k01(t, ws(151), ws(153) - ws(151) + 0.1)), kx = lerp(-100, 100, km); rrect(kx, 10, 330 - kx, 20, 10, LIME); glow(rgba(LIME, 0.7), 18, () => circle(kx, 20, 30, WHITE)); circle(kx, 20, 12, km >= 1 ? G : R);
    check(-380, -78, 28, G, pop(t - ws(153), 13, 0.5));
  });
  const k2 = pop(t - ws(154) + 0.05, 12, 0.6); if (k2 <= 0) return;
  const press = t >= ws(155) && t < ws(155) + 0.15;
  at(0, 170, cl(k2, 0, 1.12), cl(k2), () => {
    rrect(-430, -110, 860, 220, 28, PANEL2, EDGE, 2); chip('۲', 370, -50, 30, INKD, LIME); txt('خرید چالش', 320, -50, 40, WHITE, { align: 'right' });
    at(-200, 30, press ? 0.94 : 1, 1, () => { glow(rgba(G, 0.6), 20, () => rrect(-170, -40, 340, 80, 24, G)); txt('پرداخت', 0, 3, 36, INKD); });
    check(-380, -50, 28, G, pop(t - ws(158), 13, 0.5));
  });
}
const PANELS = { hook: hookP, calc: calcP, four: fourP, spread: spreadP, odds: oddsP, run: runP, risk2: risk2P, prop: propP, twist: twistP, risk1: risk1P, real: realP, guess: guessP, lab: labP, analytics: analyticsP, first: firstP };
// the end card on the terminal: «شروعش رایگانه», then «لینک توی بیو»
function endCard(t) {
  const ki = pop(t - T.cta - 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(CX, 760, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.6); cv.shadowBlur = 60; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, T.cta + 0.15, 0.35));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha = kw; cv.drawImage(IMG.word, CX - w / 2, 950 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - ws(160) + 0.05, 14, 0.55); if (kf > 0) at(CX, 1210, cl(kf, 0, 1.25), cl(kf), () => glow(rgba(LIME, 0.6), 30, () => chip('شروعش رایگانه', 0, 0, 58, INKD, LIME)));
  const kb = pop(t - ws(161) + 0.05, 14, 0.6); if (kb > 0) at(CX, 1380, cl(kb, 0, 1.2), cl(kb), () => { rrect(-260, -72, 520, 144, 72, WHITE); txt('لینک توی بیو', 0, 4, 62, VIO); });
  const ka = cub(k01(t, ws(161) + 0.5, 0.4)); if (ka > 0) { const y = 1530 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha = ka; cv.strokeStyle = WHITE; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(CX - 34, y + 20); cv.lineTo(CX, y - 14); cv.lineTo(CX + 34, y + 20); cv.stroke(); cv.restore(); }
}

// ---------- the screen ----------
let SCAN = null;
function backdrop(t, A) {
  cv.fillStyle = BG; cv.fillRect(0, 0, W, H);
  const g = cv.createRadialGradient(CX, 380, 40, CX, 380, 900); g.addColorStop(0, A.failed ? 'rgba(255,77,106,0.16)' : 'rgba(108,71,255,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.strokeStyle = 'rgba(120,160,255,0.035)'; cv.lineWidth = 2; for (let x = 0; x <= W; x += 60) { cv.beginPath(); cv.moveTo(x, 0); cv.lineTo(x, H); cv.stroke(); } for (let y = 0; y <= H; y += 60) { cv.beginPath(); cv.moveTo(0, y); cv.lineTo(W, y); cv.stroke(); }
}
function scanlines() {
  if (!SCAN) { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0, 4, 1); SCAN = cv.createPattern(c, 'repeat'); }
  cv.fillStyle = SCAN; cv.fillRect(0, 0, W, H);
}
// the glitch when the challenge fails: bands of the frame slide sideways, a red flash
function glitch(t, t0) {
  const d = t - t0; if (d < 0 || d > 0.45) return; const k = 1 - d / 0.45, seed = Math.floor(t * 30);
  for (let j = 0; j < 8; j++) { const y = Math.floor(rnd(seed * 13 + j) * H), h = 16 + Math.floor(rnd(seed * 7 + j * 3) * 70), dx = (rnd(seed * 3 + j * 5) - 0.5) * 90 * k; cv.drawImage(cv.canvas, 0, y, W, h, dx, y, W, h); }
  cv.save(); cv.globalAlpha = 0.22 * k; cv.fillStyle = R; cv.fillRect(0, 0, W, H); cv.restore();
}
function frame(t, o = {}) {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const A = account(t), s = scene(t);
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  backdrop(t, A);
  cv.save(); cv.translate(sh(ws(9), 12) + sh(ws(80), 14) + sh(ws(86), 8) + sh(ws(27 + 24), 6), 0);
  const wa = frameWin(t, A);
  if (wa > 0) {
    cv.save(); cv.globalAlpha *= wa; kpis(t, A);
    // the panel: the scene's content, switching with a quick flicker and slide
    const top = t < T.lab ? 0 : -150, pk = cub(k01(t, s.t0 - 0.05, 0.25)), fl = pk < 1 ? 0.55 + 0.45 * Math.abs(Math.sin(t * 90)) : 1;
    cv.save(); cv.beginPath(); cv.rect(WX + 10, WY + 250 + top, WW - 20, WH - 260 - top); cv.clip();
    at(PX, PY + top / 2 + (1 - pk) * 30, 1, pk * fl, () => PANELS[s.k] && PANELS[s.k](t, A));
    cv.restore(); cv.restore();
  }
  if (s.k === 'cta') endCard(t);
  if (!o.noWords) words(s, t);
  cv.restore();
  scanlines();
  glitch(t, ws(9)); glitch(t, ws(80));
}
window.DURATION = DUR;
window.seek = (t) => frame(t);
/** The cover: the failed challenge, the hook. */
window.cover = () => {
  frame(ws(9) + 0.6, { noWords: true });
  txt('وین‌ریتم', CX, 230, 100, WHITE);
  txt(pct(60), CX, 400, 200, G, { glow: rgba(G, 0.6), gb: 40 });
  const s = 'پس چرا چالشم سوخت؟', size = 80, w = measure(s, size); cv.save(); cv.translate(CX, 545); cv.rotate(-0.02); rrect(-w / 2 - 34, -size * 0.62, w + 68, size * 1.22, 20, R); cv.restore(); txt(s, CX, 545, size, WHITE);
};
(async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  window.seek(0); window.ready = true;
})();
