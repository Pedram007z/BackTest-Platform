// Shared helpers of the BacktestLab reels. Every frame is drawn from the time t alone (render(t)).
const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const P = (t, a, d) => clamp((t - a) / d);
const fa = (n, frac = 0) => n.toLocaleString('fa-IR', { minimumFractionDigits: frac, maximumFractionDigits: frac });
const sgn = (n, frac = 0) => (n > 0 ? '+' : n < 0 ? '−' : '') + fa(Math.abs(n), frac);
const usd = (n) => '$' + fa(Math.round(n)).replace(/٬/g, ',');
const $ = (s) => document.querySelector(s);
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const C = { gain: '#26c281', loss: '#f25466', line: '#302a44', lilac: '#b5a2ff', amber: '#f5b014', muted: '#a39cba', ink: '#eeebf6' };

// text with *accent*, !loss!, +gain+ marks → one span per word (a line break in the text starts a new line)
function build(el) {
  const raw = el.getAttribute('data-k');
  let cls = '';
  const words = [];
  for (const tok of raw.split(/(\s+)/)) {
    if (!tok) continue;
    if (/^\s+$/.test(tok)) { words.push({ t: tok.includes('\n') ? '\n' : ' ', c: '' }); continue; }
    let w = tok, c = cls;
    const opens = w.match(/^[*!+]/);
    if (opens) { c = { '*': 'acc', '!': 'bad', '+': 'good' }[opens[0]]; cls = c; w = w.slice(1); }
    const closes = w.match(/[*!+]([،.؛:…؟]*)$/);
    if (closes) { w = w.slice(0, closes.index) + closes[1]; cls = ''; }
    words.push({ t: w, c });
  }
  el.innerHTML = words.map((w) => (w.t === ' ' ? ' ' : w.t === '\n' ? '<br>' : `<span class="w ${w.c}">${w.t}</span>`)).join('');
  el._w = [...el.querySelectorAll('.w')];
}

/** A block on screen from a to b: rises in (words one after another), fades out. */
function show(sel, t, a, b, o = {}) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  const inD = o.inD ?? 0.5, outD = o.outD ?? 0.35, per = o.per ?? 0.075;
  if (t < a - 0.01 || t > b + 0.01) { el.style.opacity = 0; return 0; }
  const out = 1 - E.in(P(t, b - outD, outD));
  const lift = o.noLift ? 0 : (1 - E.out(P(t, a, inD))) * 50;
  const pop = o.pop ? 0.6 + 0.4 * E.back(P(t, a, inD)) : 1;
  el.style.opacity = out;
  el.style.transform = `translateY(${lift + (1 - out) * -40}px) scale(${pop})`;
  const ws = el._w || el.querySelector('[data-k]')?._w || null;
  if (ws) ws.forEach((w, i) => {
    const k = E.out(P(t, a + i * per, 0.38));
    w.style.opacity = k; w.style.transform = `translateY(${(1 - k) * 36}px)`; w.style.filter = k < 1 ? `blur(${(1 - k) * 10}px)` : 'none';
  });
  else el.style.opacity = out * E.out(P(t, a, inD));
  return out;
}
/** A whole element on screen from a to b (slides up, or pops). */
function fadeEl(sel, t, a, b, o = {}) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (t < a || t > b) { el.style.opacity = 0; return 0; }
  const k = E.out(P(t, a, o.inD ?? 0.45)), out = 1 - E.in(P(t, b - (o.outD ?? 0.35), o.outD ?? 0.35));
  el.style.opacity = Math.min(k, out);
  el.style.transform = o.pop ? `scale(${0.7 + 0.3 * E.back(P(t, a, o.inD ?? 0.5))})` : `translateY(${(1 - k) * (o.lift ?? 60)}px)`;
  return k;
}

// ---------- background ----------
let bg, cv, grain;
function drawBg(t, flash = 0, red = 0) {
  bg.fillStyle = '#0d0b14'; bg.fillRect(0, 0, W, H);
  const gx = 540 + Math.sin(t * 0.35) * 260, gy = 820 + Math.cos(t * 0.27) * 300;
  let g = bg.createRadialGradient(gx, gy, 0, gx, gy, 900);
  g.addColorStop(0, `rgba(${Math.round(124 + 118 * red)},${Math.round(92 - 8 * red)},${Math.round(255 - 153 * red)},0.30)`);
  g.addColorStop(0.5, 'rgba(84,48,230,0.10)'); g.addColorStop(1, 'rgba(13,11,20,0)');
  bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  g = bg.createRadialGradient(W - gx * 0.6, H - 300, 0, W - gx * 0.6, H - 300, 700);
  g.addColorStop(0, 'rgba(214,92,255,0.12)'); g.addColorStop(1, 'rgba(13,11,20,0)');
  bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  bg.strokeStyle = 'rgba(255,255,255,0.035)'; bg.lineWidth = 2;
  const off = (t * 18) % 90;
  for (let x = -90 + off; x < W; x += 90) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, H); bg.stroke(); }
  for (let y = -90 + off; y < H; y += 90) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(W, y); bg.stroke(); }
  if (flash > 0) { bg.fillStyle = `rgba(242,84,102,${0.22 * flash})`; bg.fillRect(0, 0, W, H); }
  const v = bg.createRadialGradient(540, 960, 500, 540, 960, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)');
  bg.fillStyle = v; bg.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) bg.drawImage(grain, x, y);
}

// ---------- canvas pieces ----------
function panel(x, y, w, h, r = 32) {
  cv.save(); cv.fillStyle = 'rgba(18,15,28,0.92)'; cv.strokeStyle = C.line; cv.lineWidth = 3;
  cv.beginPath(); cv.roundRect(x, y, w, h, r); cv.fill(); cv.stroke();
  cv.strokeStyle = 'rgba(255,255,255,0.04)'; cv.lineWidth = 2;
  for (let i = 1; i < 5; i++) { const yy = y + (h * i) / 5; cv.beginPath(); cv.moveTo(x + 20, yy); cv.lineTo(x + w - 20, yy); cv.stroke(); }
  cv.restore();
}
function label(text, x, y, color, size = 38, bgc = 'rgba(13,11,20,0.85)', dir = 'rtl', ctx = cv) {
  ctx.save(); ctx.font = `800 ${size}px Vaz`; ctx.direction = dir; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 40;
  ctx.fillStyle = bgc; ctx.beginPath(); ctx.roundRect(x - w / 2, y - size * 0.75, w, size * 1.5, 14); ctx.fill();
  ctx.fillStyle = color; ctx.fillText(text, x, y + 2); ctx.restore();
}
function line(ctx, pts, n, X, Y, color, width = 7) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i < n; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(i), Y(pts[i])); ctx.stroke();
}
const candles = (() => { const r = rng(42), out = []; let p = 100; for (let i = 0; i < 1600; i++) { const d = Math.sin(i / 90) * 0.25 + Math.sin(i / 23) * 0.12, o = p, c = o + d + (r() - 0.5) * 2.4; out.push({ o, c, h: Math.max(o, c) + r() * 1.1, l: Math.min(o, c) - r() * 1.1 }); p = c; } return out; })();
/** Five years of candles going by fast, with the speed, the year and a trade counter. */
function drawReplay(t, a, b, box = { x0: 70, y0: 560, w: 940, h: 720 }, trades = 500) {
  const appear = E.out(P(t, a, 0.45)) * (1 - E.in(P(t, b - 0.35, 0.35)));
  if (appear <= 0) return 0;
  const { x0, y0, w, h } = box;
  cv.save(); cv.globalAlpha = appear; panel(x0, y0, w, h);
  const k = clamp((t - a) / (b - a)), pos = 60 + Math.floor(E.inOut(k) * 1500), list = candles.slice(pos - 60, pos);
  let lo = Infinity, hi = -Infinity; list.forEach((c) => { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); });
  const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  const cw = (w - 60) / 60, Y = (v) => y0 + 100 + (1 - (v - lo) / (hi - lo)) * (h - 140);
  list.forEach((c, i) => { const x = x0 + 30 + i * cw + cw / 2, up = c.c >= c.o; cv.strokeStyle = cv.fillStyle = up ? C.gain : C.loss; cv.lineWidth = 3; cv.beginPath(); cv.moveTo(x, Y(c.h)); cv.lineTo(x, Y(c.l)); cv.stroke(); cv.fillRect(x - cw * 0.34, Y(Math.max(c.o, c.c)), cw * 0.68, Math.max(3, Math.abs(Y(c.o) - Y(c.c)))); });
  label('×۶۰', x0 + 90, y0 + 52, '#fff', 40, '#5430e6');
  label(fa(2020 + Math.floor(E.inOut(k) * 5.99)).replace(/٬/g, ''), x0 + w - 110, y0 + 52, C.lilac, 40);
  label(`${fa(Math.round(E.inOut(k) * trades))} معامله`, x0 + w / 2, y0 + 52, C.ink, 40);
  cv.restore();
  return k;
}

// ---------- the belief bubble (✓ turns into ؟) ----------
function belief(t, a, b) {
  const bub = $('#bubble');
  if (t > a && t < b) {
    const k = E.back(P(t, a, 0.45)), o = 1 - E.in(P(t, b - 0.35, 0.35));
    bub.style.opacity = o; bub.style.transform = `scale(${0.85 + 0.15 * k})`; bub.style.transformOrigin = '80% 100%';
    show(bub.querySelector('[data-k]'), t, a + 0.2, b, { per: 0.11, noLift: true, outD: 0.01 });
  } else bub.style.opacity = 0;
  const tick = $('#tick'), ta = a + 1.7, flipAt = a + 2.5;
  if (t > ta && t < b) {
    const flip = P(t, flipAt, 0.3);
    tick.textContent = flip < 0.5 ? '✓' : '؟'; tick.style.background = flip < 0.5 ? '#26c281' : '#f5b014';
    tick.style.opacity = 1 - E.in(P(t, b - 0.35, 0.35));
    tick.style.transform = `scale(${E.back(P(t, ta, 0.4))}) rotateY(${Math.sin(flip * Math.PI) * 90}deg)`;
  } else tick.style.opacity = 0;
}

// ---------- the pre-launch end card ----------
function endCard(t, t0) {
  const logo = $('#logo'); logo.style.opacity = t > t0 ? E.out(P(t, t0, 0.5)) : 0;
  logo.style.transform = `scale(${0.7 + 0.3 * E.back(P(t, t0, 0.6))})`;
  const soon = $('#soon'); soon.style.opacity = t > t0 + 0.3 ? E.out(P(t, t0 + 0.3, 0.35)) : 0;
  soon.style.transform = `scale(${0.5 + 0.5 * E.back(P(t, t0 + 0.3, 0.45))})`;
  soon.querySelector('i').style.opacity = 0.35 + 0.65 * Math.abs(Math.sin(t * 3.2));
  show('#endline', t, t0 + 0.6, 999, { per: 0.07 });
  const fol = $('#follow'); fol.style.opacity = t > t0 + 1.6 ? E.out(P(t, t0 + 1.6, 0.4)) : 0;
  fol.style.transform = `translateY(${(1 - E.out(P(t, t0 + 1.6, 0.45))) * 30}px)`;
  fol.querySelector('svg').style.transform = `rotate(${Math.sin(t * 14) * 14 * Math.max(0, 1 - P(t, t0 + 1.9, 1.2))}deg)`;
  const cta = $('#cta'); cta.style.opacity = t > t0 + 2.4 ? E.out(P(t, t0 + 2.4, 0.45)) : 0;
  cta.style.transform = `translateY(${(1 - E.out(P(t, t0 + 2.4, 0.5))) * 60}px)`;
  cta.querySelectorAll('.opt').forEach((o, i) => { const k = P(t, t0 + 3.4 + i * 0.18, 0.3); o.style.borderColor = k > 0 ? 'rgba(181,162,255,.75)' : ''; o.style.transform = `scale(${1 + 0.06 * Math.sin(Math.PI * k)})`; });
  const ar = $('#arrow'); ar.style.opacity = t > t0 + 3.4 ? E.out(P(t, t0 + 3.4, 0.3)) : 0;
  ar.style.transform = `translateY(${Math.sin(t * 6) * 16}px)`;
}
const END_CARD_HTML = (line, question, options, comment) => `
<img id="logo" src="../../../brand/svg/logo-fa-dark.svg" alt="">
<div id="soon"><span><i></i>به‌زودی</span></div>
<div id="endline" class="layer h3 pad" style="top:770px; font-size:56px" data-k="${line}"></div>
<div id="follow"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#b5a2ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><span>فالو کن تا <b style="color:#b5a2ff">روز لانچ</b> رو از دست ندی</span></div>
<div id="cta" class="card"><div class="q">${question}</div><div class="opts">${options.map((o) => `<div class="opt num">${o}</div>`).join('')}</div><div class="c">${comment}</div></div>
<svg id="arrow" viewBox="0 0 80 110"><path d="M40 6 V92 M12 64 L40 96 L68 64" stroke="#b5a2ff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Call once the page's own markup is in place. */
function setupReel() {
  bg = $('#bg').getContext('2d');
  cv = $('#cv').getContext('2d');
  grain = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256); const r = rng(7); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 10; } g.putImageData(d, 0, 0); return c; })();
  document.querySelectorAll('[data-k]').forEach(build);
}
/** A short shake on the hard cuts, like the reels do. */
function cutShake(t, cuts, extra = 0) {
  let shake = extra;
  for (const cut of cuts) { const k = P(t, cut, 0.25); if (k > 0 && k < 1) shake = Math.max(shake, (1 - k) * 8); }
  document.body.style.transform = shake ? `translate(${Math.sin(t * 90) * shake}px, ${Math.cos(t * 77) * shake}px)` : '';
}
