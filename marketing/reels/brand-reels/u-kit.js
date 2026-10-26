// u-kit: the engine shared by the u-reels. One story (the reel's story.js: scenes, spoken lines, symbols) renders in two
// looks, chosen by DATA.mode:
//   'kinetic': the q-series look. Full-bleed colour blocks wipe into each other on the beat and the spoken words land
//              huge on screen; each scene's symbol sits under its words.
//   'motion':  a classic explainer. One dark stage, the words typed in as subtitles at the top, the symbol bigger in
//              the middle under a small section tag; scenes without a symbol show their key line as a title card.
// A symbol is drawn in its own frame: (0, 0) is the middle of its area, about 920 × 760 px. Each look places and
// scales it, and passes a theme (th) for the colours of whatever ground it sits on.
// 1080×1920, every frame a pure function of t (window.seek). Vazirmatn 700–900.
const W = 1080, H = 1920, CX = 540;
const PAPER = '#F3F0FA', INKD = '#100C1C', INKP = '#1A1430', VIO = '#6C47FF', LIME = '#C6F24E', G = '#16B37A', R = '#F0435B', AMB = '#FFB020';
const WHITE = '#FFFFFF', MP = '#6B6489', MD = '#9C95B8', PLATE = '#1D1730', NAVY = '#090D18', MINT = '#2EE6A8', SKY = '#4D8DFF';
const cv = document.getElementById('c').getContext('2d');
const D = window.DATA, T = D.T, DUR = D.dur, Wd = D.w, MODE = D.mode || 'kinetic', KIN = MODE === 'kinetic';
const ws = (i) => Wd[i][0], we = (i) => Wd[i][1];

// ---------- time ----------
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, k01 = (t, a, d) => cl((t - a) / d);
const exIO = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const cub = (x) => 1 - Math.pow(1 - cl(x), 3);
const pop = (dt, w = 18, z = 0.55) => { if (dt <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt)); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const win = (t, a, b, din = 0.35, dout = 0.35) => Math.min(cub(k01(t, a, din)), 1 - cub(k01(t, b - dout, dout)));

// ---------- drawing ----------
const FONT = (s, w = 900) => `${w} ${s}px Vazirmatn`;
const isL = (s) => /^[\x20-\x7E−]+$/.test(s);
function txt(s, x, y, size, col, o = {}) {
  cv.save(); if (o.alpha !== undefined) cv.globalAlpha *= o.alpha;
  cv.font = FONT(size, o.w ?? 900); cv.fillStyle = col; cv.textAlign = o.align ?? 'center'; cv.textBaseline = 'middle'; cv.direction = o.dir ?? (isL(s) ? 'ltr' : 'rtl');
  if (o.blur) cv.filter = `blur(${o.blur}px)`;
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = o.gb ?? 30; }
  cv.fillText(s, x, y); cv.restore();
}
function measure(s, size, w = 900) { cv.font = FONT(size, w); cv.direction = isL(s) ? 'ltr' : 'rtl'; return cv.measureText(s).width; }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { cv.beginPath(); cv.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 4) { if (r <= 0) return; cv.beginPath(); cv.arc(x, y, r, 0, Math.PI * 2); if (fill) { cv.fillStyle = fill; cv.fill(); } if (stroke) { cv.strokeStyle = stroke; cv.lineWidth = lw; cv.stroke(); } }
function line(x1, y1, x2, y2, col, lw = 3, dash) { cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; if (dash) cv.setLineDash(dash); cv.beginPath(); cv.moveTo(x1, y1); cv.lineTo(x2, y2); cv.stroke(); cv.restore(); }
function at(x, y, s, a, fn, rot = 0) { cv.save(); cv.translate(x, y); if (rot) cv.rotate(rot); cv.scale(s, s); cv.globalAlpha *= a; fn(); cv.restore(); }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const money = (n) => fa(Math.round(n).toLocaleString('en-US')).replace(/,/g, '٬');
function chip(s, x, y, size, fg, bg, o = {}) { const w = measure(s, size, o.w ?? 800) + size * 1.1, h = size * 1.75; rrect(x - w / 2, y - h / 2, w, h, h / 2, bg, o.stroke, o.lw ?? 3); txt(s, x, y + size * 0.04, size, fg, { w: o.w ?? 800 }); return w; }
/** A polyline drawn up to fraction k of its length; returns the pen's position. */
function trace(pts, k, col, lw) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), L = seg.reduce((a, b) => a + b, 0); let left = k * L;
  cv.save(); cv.strokeStyle = col; cv.lineWidth = lw; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(...pts[0]); let end = pts[0];
  for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); end = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; cv.lineTo(...end); left -= seg[i]; }
  cv.stroke(); cv.restore(); return end;
}
function cursor(x, y, s = 1) { at(x, y, s, 1, () => { cv.fillStyle = WHITE; cv.strokeStyle = INKD; cv.lineWidth = 6; cv.lineJoin = 'round'; cv.beginPath();
  cv.moveTo(0, 0); cv.lineTo(0, 92); cv.lineTo(22, 70); cv.lineTo(38, 106); cv.lineTo(54, 98); cv.lineTo(38, 63); cv.lineTo(68, 63); cv.closePath(); cv.stroke(); cv.fill(); }); }
const IMG = {};
function loadImg(k, src) { return new Promise((ok) => { const i = new Image(); i.onload = () => { IMG[k] = i; ok(); }; i.onerror = () => ok(); i.src = src; }); }

// ---------- themes: the colours a symbol uses on each ground ----------
const THEME = {
  paper: { ink: INKP, mut: MP, card: WHITE, cardInk: INKP, cardMut: MP, rule: 'rgba(26,20,48,0.12)', soft: 'rgba(108,71,255,0.08)', plate: '#ECE7FA' },
  ink: { ink: WHITE, mut: MD, card: PLATE, cardInk: WHITE, cardMut: MD, rule: 'rgba(255,255,255,0.12)', soft: 'rgba(255,255,255,0.06)', plate: '#2A2340' },
  violet: { ink: WHITE, mut: 'rgba(255,255,255,0.72)', card: '#5634E0', cardInk: WHITE, cardMut: 'rgba(255,255,255,0.7)', rule: 'rgba(255,255,255,0.18)', soft: 'rgba(255,255,255,0.1)', plate: '#4F2FD6' },
  lime: { ink: INKD, mut: '#3E4D12', card: '#B5DE3A', cardInk: INKD, cardMut: '#3E4D12', rule: 'rgba(16,12,28,0.15)', soft: 'rgba(16,12,28,0.06)', plate: '#B5DE3A' },
  stage: { ink: WHITE, mut: '#8A97AD', card: '#121A2B', cardInk: WHITE, cardMut: '#8A97AD', rule: 'rgba(255,255,255,0.1)', soft: 'rgba(255,255,255,0.05)', plate: '#1A2438' },
};
const GROUND = { [PAPER]: 'paper', [INKD]: 'ink', [VIO]: 'violet', [LIME]: 'lime' };

// ---------- shared symbols ----------
/** Candles bars[0..n) in box [x0, y0, x1, y1] (prices lo..hi, from the bars unless given); returns the mappings. */
function candleChart(bars, n, box, o = {}) {
  const [x0, y0, x1, y1] = box, N = o.N ?? bars.length, step = (x1 - x0) / N, bw = Math.max(2, step * (o.bw ?? 0.62));
  const lo = o.lo ?? Math.min(...bars.map((b) => b[2])), hi = o.hi ?? Math.max(...bars.map((b) => b[1])), pad = (hi - lo) * 0.06;
  const Y = (p) => y1 - ((p - lo + pad) / (hi - lo + 2 * pad)) * (y1 - y0), X = (i) => x0 + step * (i + 0.5);
  for (let i = 0; i < Math.min(n, bars.length); i++) { const [op, h, l, c] = bars[i], col = c >= op ? (o.up ?? G) : (o.down ?? R), x = X(i);
    cv.save(); if (o.alpha) cv.globalAlpha *= o.alpha(i); line(x, Y(h), x, Y(l), col, Math.max(2, bw * 0.18)); rrect(x - bw / 2, Y(Math.max(op, c)), bw, Math.max(3, Math.abs(Y(op) - Y(c))), Math.min(6, bw / 3), col); cv.restore(); }
  return { X, Y, step, bw };
}
/** The brand moment: the icon and the wordmark (the light one on paper). */
function brandArt(t, th, at0) {
  const ki = pop(t - at0 + 0.1, 12, 0.6); if (ki > 0 && IMG.icon) at(0, -120, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = rgba(VIO, 0.5); cv.shadowBlur = 60; cv.shadowOffsetY = 18; cv.drawImage(IMG.icon, -160, -160, 320, 320); });
  const wm = th === THEME.paper ? IMG.wordL : IMG.word, kw = cub(k01(t, at0 + 0.15, 0.35));
  if (kw > 0 && wm) { const w = 620, h = (w * wm.height) / wm.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(wm, -w / 2, 90 + (1 - kw) * 24, w, h); cv.restore(); }
}
/** The end card: icon, wordmark, «شروعش رایگانه», «لینک توی بیو», an arrow. */
function endArt(t, th, o) {
  const ki = pop(t - o.t0 + 0.05, 12, 0.6);
  if (ki > 0 && IMG.icon) at(0, -400, cl(ki, 0, 1.3), cl(ki), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 50; cv.shadowOffsetY = 20; cv.drawImage(IMG.icon, -140, -140, 280, 280); });
  const kw = cub(k01(t, o.t0 + 0.2, 0.35));
  if (kw > 0 && IMG.word) { const w = 560, h = (w * IMG.word.height) / IMG.word.width; cv.save(); cv.globalAlpha *= kw; cv.drawImage(IMG.word, -w / 2, -210 + (1 - kw) * 24, w, h); cv.restore(); }
  const kf = pop(t - o.free + 0.05, 14, 0.55); if (kf > 0) at(0, 60, cl(kf, 0, 1.25), cl(kf), () => chip('شروعش رایگانه', 0, 0, 58, INKD, LIME));
  const kb = pop(t - o.link + 0.05, 14, 0.6); if (kb > 0) at(0, 230, cl(kb, 0, 1.2), cl(kb), () => { cv.shadowColor = 'rgba(0,0,0,0.25)'; cv.shadowBlur = 40; cv.shadowOffsetY = 14; rrect(-260, -72, 520, 144, 72, WHITE); cv.shadowColor = 'transparent'; txt('لینک توی بیو', 0, 4, 62, VIO); });
  const ka = cub(k01(t, o.link + 0.5, 0.4)); if (ka > 0) { const y = 380 - ((t * 1.6) % 1) * 30; cv.save(); cv.globalAlpha *= ka; cv.strokeStyle = WHITE; cv.lineWidth = 10; cv.lineCap = 'round'; cv.lineJoin = 'round'; cv.beginPath(); cv.moveTo(-34, y + 20); cv.lineTo(0, y - 14); cv.lineTo(34, y + 20); cv.stroke(); cv.restore(); }
}

// ---------- the story (set by story.js): SC = [{ k, bg, wipe, tag, groups: [{ at, lines: [{ y, size, c, toks }] }], art, title }] ----------
let SC = [], ART = {}, COVER = null, SHAKES = [];
function story(o) { SC = o.scenes; ART = o.art || {}; COVER = o.cover; SHAKES = o.shakes || [];
  SC.forEach((s, i) => { s.t0 = T[s.k]; s.t1 = i + 1 < SC.length ? T[SC[i + 1].k] : DUR + 1; }); }
const wIdx = (x) => (Array.isArray(x) ? x[0] : x);

// ================= kinetic =================
const WIPE = 0.32;
function bgFill(bg) {
  if (bg === 'split' || bg === 'splitR') { const top = bg === 'split' ? PAPER : INKD, bot = bg === 'split' ? INKD : PAPER; cv.fillStyle = top; cv.fillRect(0, 0, W, 960); cv.fillStyle = bot; cv.fillRect(0, 960, W, H - 960);
    const y0 = bg === 'split' ? 0 : 960; cv.strokeStyle = 'rgba(26,20,48,0.07)'; cv.lineWidth = 2; for (let gx = 0; gx <= W; gx += 60) { cv.beginPath(); cv.moveTo(gx, y0); cv.lineTo(gx, y0 + 960); cv.stroke(); } for (let gy = y0; gy <= y0 + 960; gy += 60) { cv.beginPath(); cv.moveTo(0, gy); cv.lineTo(W, gy); cv.stroke(); }
    return; }
  cv.fillStyle = bg; cv.fillRect(0, 0, W, H);
}
function wipeK(s, t) { if (s.wipe === 'none') return 1; if (s.wipe === 'cut') return t < s.t0 ? 0 : 1; return exIO(k01(t, s.t0 - 0.06, WIPE)); }
function clipTo(s, k) {
  cv.beginPath();
  if (s.wipe === 'right') cv.rect(W * (1 - k), 0, W * k, H); else if (s.wipe === 'left') cv.rect(0, 0, W * k, H);
  else if (s.wipe === 'up') cv.rect(0, H * (1 - k), W, H * k); else if (s.wipe === 'down') cv.rect(0, 0, W, H * k);
  else if (s.wipe === 'iris') cv.arc(CX, 960, k * 2300, 0, Math.PI * 2); else cv.rect(0, 0, W, H);
  cv.clip();
}
function kineticWords(s, t) {
  s.groups.forEach((g, gi) => {
    const next = s.groups[gi + 1], gEnd = next ? ws(next.at) - 0.08 : s.t1 + 0.4;
    if (g.hideK) return;                                     // said on the symbol's own cards in this look
    const opening = s === SC[0] && gi === 0;                  // the reel's first words are on screen from the first frame
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
function kineticFrame(t) {
  cv.fillStyle = PAPER; cv.fillRect(0, 0, W, H);
  SC.forEach((s, i) => {
    if (t < s.t0 - 0.1) return;
    const nextBg = SC.slice(i + 1).find((x) => x.wipe !== 'none'); if (nextBg && t > nextBg.t0 + WIPE) return;
    const k = wipeK(s, t); if (k <= 0) return;
    cv.save(); if (k < 1) clipTo(s, k);
    if (s.wipe !== 'none' || i === 0) bgFill(s.bg);
    const nx = SC[i + 1], live = t < s.t1 + (nx && (nx.wipe === 'none' || nx.wipe === 'cut') ? 0 : WIPE);
    if (live && s.art && ART[s.art]) { const p = s.kpos ?? [CX, 1090, 0.92], bgk = s.bg === 'split' || s.bg === 'splitR' ? 'ink' : GROUND[s.bg] ?? 'ink';
      at(p[0], p[1], p[2], 1, () => ART[s.art](t, THEME[s.th ?? bgk], s)); }
    if (live) kineticWords(s, t);
    cv.restore();
  });
}

// ================= motion =================
// the stage: deep navy, a glow tinted by the scene's tone, a faint grid, a vignette
function stage(t) {
  cv.fillStyle = NAVY; cv.fillRect(0, 0, W, H);
  let tone = SKY, a = 0.18; SC.forEach((s) => { if (t >= s.t0 - 0.2) { tone = s.tone ?? SKY; } });
  const g = cv.createRadialGradient(CX + 160 * Math.sin(t * 0.3), 980, 60, CX, 980, 1100); g.addColorStop(0, rgba(tone, a)); g.addColorStop(1, rgba(tone, 0)); cv.fillStyle = g; cv.fillRect(0, 0, W, H);
  cv.strokeStyle = 'rgba(255,255,255,0.035)'; cv.lineWidth = 2; for (let x = 0; x <= W; x += 60) { cv.beginPath(); cv.moveTo(x, 0); cv.lineTo(x, H); cv.stroke(); } for (let y = 0; y <= H; y += 60) { cv.beginPath(); cv.moveTo(0, y); cv.lineTo(W, y); cv.stroke(); }
  const v = cv.createRadialGradient(CX, 960, 520, CX, 960, 1300); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
}
/** The spoken words as subtitles: each group's tokens, wrapped to two lines, typed in as spoken; a cursor after the last. */
function subtitles(t) {
  if (t >= T.end - 0.05) return;
  let cur = null, nextAt = T.end - 0.05;
  const all = []; SC.forEach((s) => s.groups.forEach((g) => all.push(g)));
  all.forEach((g, i) => { if (t >= ws(g.at) - 0.1) { cur = g; nextAt = i + 1 < all.length ? ws(all[i + 1].at) - 0.1 : T.end - 0.05; } });
  if (!cur) return;
  const toks = cur.lines.flatMap((ln) => ln.toks.map(([x, wi, o = {}]) => [x, wi, o.hl ?? o.c ?? null, o.blur]));
  const size = 66, gap = measure(' ', size) * 1.3, wds = toks.map(([x]) => measure(x, size));
  // break into lines of at most 920 px
  const rows = [[]]; let wsum = 0; toks.forEach((tk, j) => { const add = wds[j] + (rows[rows.length - 1].length ? gap : 0); if (wsum + add > 920 && rows[rows.length - 1].length) { rows.push([]); wsum = 0; } rows[rows.length - 1].push(j); wsum += wds[j] + (rows[rows.length - 1].length > 1 ? gap : 0); });
  const n = rows.length, sc = n > 2 ? 0.86 : 1, lh = 92 * sc, y0 = 330 - ((Math.min(n, 3) - 1) * lh) / 2;
  const g = cv.createLinearGradient(0, 200, 0, 520); g.addColorStop(0, 'rgba(9,13,24,0.9)'); g.addColorStop(1, 'rgba(9,13,24,0)'); cv.fillStyle = g; cv.fillRect(0, 180, W, 360);
  let last = null;
  rows.forEach((row, ri) => {
    const total = row.reduce((a, j, q) => a + wds[j] + (q ? gap : 0), 0) * sc; let right = CX + total / 2; const y = y0 + ri * lh;
    row.forEach((j) => { const [x, wi, col, blur] = toks[j], st = ws(wIdx(wi)) - 0.04, wpx = wds[j] * sc;
      if (t >= st) { const a = cl((t - st) / 0.06) * (1 - k01(t, nextAt - 0.06, 0.06)); cv.save(); cv.globalAlpha = a; cv.translate(right - wpx / 2, y); cv.scale(sc, sc);
        txt(x, 0, 0, size, col && col !== INKP && col !== INKD && col !== WHITE ? (col === VIO ? '#A48CFF' : col) : WHITE, { blur: blur ? 3 : 0 }); cv.restore(); last = [right - wpx, y, size * sc]; }
      right -= wpx + gap * sc; });
  });
  if (last && Math.floor(t * 2.6) % 2 === 0) rrect(last[0] - 30, last[1] - last[2] * 0.4, 14, last[2] * 0.8, 6, MINT);
}
/** A scene without a symbol: its current lines, built word by word as a title in the middle (the subtitles step aside). */
function titleCard(s, t, a) {
  let g = s.groups[0]; s.groups.forEach((x) => { if (t >= ws(x.at) - 0.1) g = x; }); if (!g) return;
  const sizes = g.lines.map((ln) => Math.min(130, ln.size * 0.82)), gaps = sizes.map((z) => z * 1.25), H0 = gaps.reduce((p, q) => p + q, 0); let y = 1000 - H0 / 2 + gaps[0] / 2;
  cv.save(); cv.globalAlpha *= a;
  g.lines.forEach((ln, li) => {
    const size = sizes[li], gap = measure(' ', size) * 1.35, wds = ln.toks.map(([x]) => measure(x, size)), total = wds.reduce((p, q) => p + q, 0) + gap * (ln.toks.length - 1), sc = Math.min(1, 900 / total);
    let right = CX + (total * sc) / 2;
    ln.toks.forEach(([x, wi, o = {}], j) => { const st = ws(wIdx(wi)) - 0.05, wpx = wds[j] * sc;
      if (t >= st) { const k = pop(t - st, 20, 0.6); at(right - wpx / 2, y, sc * lerp(0.85, 1, k), cl((t - st) / 0.1), () => {
        if (o.hl) rrect(-wds[j] / 2 - 22, -size * 0.6, wds[j] + 44, size * 1.2, 20, o.hl);
        txt(x, 0, 0, size, o.hl ? o.ht : o.c && o.c !== INKP && o.c !== INKD && o.c !== WHITE ? (o.c === VIO ? '#A48CFF' : o.c) : WHITE, { blur: o.blur ? 4 : 0 }); }); }
      right -= wpx + gap * sc; });
    y += gaps[li] * 0.5 + (gaps[li + 1] ?? 0) * 0.5;
  });
  cv.restore();
}
function motionFrame(t) {
  stage(t);
  SC.forEach((s, i) => {
    if (t < s.t0 - 0.3 || t > s.t1 + 0.4) return;
    const a = Math.min(cub(k01(t, s.t0 - 0.05, 0.35)), i + 1 < SC.length ? 1 - cub(k01(t, s.t1 - 0.05, 0.3)) : 1); if (a <= 0) return;
    const rise = (1 - cub(k01(t, s.t0 - 0.05, 0.45))) * 70;
    if (s.tag && s.k !== 'end') { at(CX, 560 + rise * 0.5, 1, a, () => chip(s.tag, 0, 0, 34, s.tone ?? SKY, rgba(s.tone ?? SKY, 0.14), { stroke: rgba(s.tone ?? SKY, 0.5), lw: 2 })); }
    if (s.art && ART[s.art]) { const p = s.mpos ?? [CX, 1030, 1.0]; cv.save(); cv.globalAlpha *= a; at(p[0], p[1] + rise, p[2], 1, () => ART[s.art](t, THEME.stage, s)); cv.restore(); }
    else if (s.k !== 'end') titleCard(s, t, a);
  });
  const cur = SC.filter((s) => t >= s.t0 - 0.05).pop(); if (!cur || cur.art) subtitles(t);
}

// ---------- frame ----------
window.DURATION = DUR;
window.seek = (t) => {
  cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; cv.filter = 'none';
  const sh = (a, amp) => (t >= a ? Math.exp(-(t - a) * 9) * Math.sin((t - a) * 70) * amp : 0);
  cv.save(); cv.translate(SHAKES.reduce((x, [a, amp]) => x + sh(a, amp), 0), 0);
  if (KIN) kineticFrame(t); else motionFrame(t);
  cv.restore();
};
window.cover = () => { cv.setTransform(1, 0, 0, 1, 0, 0); cv.globalAlpha = 1; if (COVER) COVER(); };
window.addEventListener('load', async () => {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 100px Vazirmatn`, 'آبپ۱A')));
  await Promise.all([loadImg('icon', window.LOGO.icon), loadImg('word', window.LOGO.word), loadImg('wordL', window.LOGO.wordL), ...Object.entries(window.IMGS || {}).map(([k, src]) => loadImg(k, src))]);
  const miss = Object.keys(window.IMGS || {}).filter((k) => !IMG[k]); if (miss.length) console.error('missing images: ' + miss.join(', '));
  window.seek(0); window.ready = true;
});
