// BacktestLab brand reel kit: the site's dark palette, Readex Pro display + Vazirmatn text,
// the landing hero glow, app-style cards and pills, subtitles and chart helpers.
// A page sets window.ASSET (path to the repo root, with a trailing slash) before loading this file.
const W = 1080, H = 1920;
const C = {
  bg: '#0D0B14', side: '#120F1C', surface: '#181424', raised: '#221D32', line: '#302A44',
  ink: '#EEEBF6', muted: '#A39CBA', faint: '#706988', accent: '#7C5CFF', accentInk: '#B5A2FF',
  lilac: '#A58BFF', violet: '#6A46FF', grad0: '#9273FF', grad1: '#5430E6', pink: '#D65CFF',
  gain: '#26C281', loss: '#F25466', amber: '#F5B014', sky: '#6E8BFF',
};
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
};
const P = (t, a, d) => clamp((t - a) / d);
const fa = (n, frac = 0) => Number(n).toLocaleString('fa-IR', { minimumFractionDigits: frac, maximumFractionDigits: frac });
const fy = (n) => fa(n).replace(/٬/g, '');
const usd = (n) => '$' + fa(Math.round(n)).replace(/٬/g, ',');
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const cv = document.getElementById('c').getContext('2d');

/** Text. o: size, weight, color, font ('Vaz' | 'Rdx'), align, dir, alpha, scale, rot, spacing, reveal (0–1), glow, stroke. Returns the width. */
function txt(s, x, y, o = {}) {
  const c = cv, size = o.size ?? 60, dir = o.dir ?? 'rtl', align = o.align ?? 'center';
  c.save(); c.globalAlpha *= o.alpha ?? 1; c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.scale !== undefined) c.scale(o.scale, o.scale);
  c.font = `${o.weight ?? 700} ${size}px ${o.font ?? 'Vaz'}`; c.direction = dir; c.textAlign = align; c.textBaseline = 'middle';
  c.letterSpacing = (o.spacing ?? 0) + 'px';
  const w = c.measureText(s).width, left = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
  if (o.reveal !== undefined && o.reveal < 1) {
    if (o.reveal <= 0) { c.restore(); return w; }
    c.beginPath(); if (dir === 'rtl') c.rect(left + w * (1 - o.reveal) - 4, -size * 1.3, w * o.reveal + 8, size * 2.6); else c.rect(left - 4, -size * 1.3, w * o.reveal + 8, size * 2.6); c.clip();
  }
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.glowBlur ?? 40; }
  if (o.stroke) { c.lineWidth = o.strokeW ?? 10; c.lineJoin = 'round'; c.strokeStyle = o.stroke; c.strokeText(s, 0, 0); }
  c.fillStyle = o.color ?? C.ink; c.fillText(s, 0, 0); c.restore(); return w;
}
function measure(s, size, weight = 700, font = 'Vaz', spacing = 0) { cv.save(); cv.font = `${weight} ${size}px ${font}`; cv.letterSpacing = spacing + 'px'; const w = cv.measureText(s).width; cv.restore(); return w; }
/** One right-to-left line made of coloured runs [[text, color, weight?], …] in reading order. align: center | right | left. */
function runs(parts, x, y, o = {}) {
  const size = o.size ?? 60, font = o.font ?? 'Rdx', gap = measure(' ', size, o.weight ?? 800, font);
  const ws = parts.map(([s, , w]) => measure(s, size, w ?? o.weight ?? 800, font));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  const align = o.align ?? 'center'; let right = align === 'center' ? x + total / 2 : align === 'right' ? x : x + total;
  cv.save(); if (o.reveal !== undefined && o.reveal < 1) { if (o.reveal <= 0) { cv.restore(); return total; } cv.beginPath(); cv.rect(right - total * o.reveal - 6, y - size * 1.3, total * o.reveal + 12, size * 2.6); cv.clip(); }
  parts.forEach(([s, col, w], i) => { txt(s, right, y, { ...o, size, font, weight: w ?? o.weight ?? 800, color: col, align: 'right', reveal: undefined, glow: col === C.ink ? undefined : o.glow }); right -= ws[i] + gap; });
  cv.restore(); return total;
}
function wrap(s, size, maxW, weight = 500, font = 'Vaz') { const words = s.split(' '); const out = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t, size, weight, font) > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }

// ---------- shapes ----------
function rr(x, y, w, h, r) { cv.beginPath(); cv.roundRect(x, y, w, h, r); }
function card(x, y, w, h, o = {}) {
  cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  if (o.shadow !== false) { cv.shadowColor = 'rgba(0,0,0,0.5)'; cv.shadowBlur = 48; cv.shadowOffsetY = 16; }
  rr(x, y, w, h, o.r ?? 28); cv.fillStyle = o.fill ?? C.surface; cv.fill(); cv.shadowColor = 'transparent';
  cv.lineWidth = o.lw ?? 2; cv.strokeStyle = o.border ?? C.line; cv.stroke();
  if (o.glow) { cv.shadowColor = o.glow; cv.shadowBlur = 40; cv.strokeStyle = o.glow; cv.lineWidth = 2; rr(x, y, w, h, o.r ?? 28); cv.stroke(); }
  cv.restore();
}
/** The site's eyebrow pill: border, translucent surface, a coloured dot, muted text. */
function pill(x, y, s, o = {}) {
  const size = o.size ?? 30, pad = o.pad ?? 26, dot = o.dot === undefined ? C.gain : o.dot;
  const tw = measure(s, size, o.weight ?? 600), w = tw + pad * 2 + (dot ? 28 : 0), h = size * 1.9;
  const left = o.align === 'right' ? x - w : o.align === 'left' ? x : x - w / 2;
  cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  rr(left, y - h / 2, w, h, h / 2); cv.fillStyle = o.fill ?? rgba(C.surface, 0.78); cv.fill(); cv.lineWidth = 2; cv.strokeStyle = o.border ?? C.line; cv.stroke();
  if (dot) { cv.fillStyle = dot; cv.beginPath(); cv.arc(left + w - pad - 6, y, 7, 0, 7); cv.fill(); }
  cv.restore();
  txt(s, left + w - pad - (dot ? 28 : 0), y + 1, { size, weight: o.weight ?? 600, color: o.color ?? C.muted, align: 'right', alpha: o.alpha });
  return w;
}
/** The site's primary button: accent fill, white text, fully rounded. */
function button(x, y, s, o = {}) {
  const size = o.size ?? 40, tw = measure(s, size, 700), w = tw + 90, h = size * 2.2;
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; cv.translate(x, y); if (o.scale) cv.scale(o.scale, o.scale);
  cv.shadowColor = rgba(C.accent, 0.55); cv.shadowBlur = 50; rr(-w / 2, -h / 2, w, h, h / 2);
  const g = cv.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, o.c0 ?? C.grad0); g.addColorStop(1, o.c1 ?? C.grad1);
  cv.fillStyle = o.fill ?? g; cv.fill(); cv.restore();
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; cv.translate(x, y); if (o.scale) cv.scale(o.scale, o.scale); txt(s, 0, 2, { size, weight: 700, color: '#fff' }); cv.restore();
  return w;
}
function tri(x, y, up, col, s) { cv.fillStyle = col; cv.beginPath(); if (up) { cv.moveTo(x, y - s); cv.lineTo(x + s, y + s); cv.lineTo(x - s, y + s); } else { cv.moveTo(x, y + s); cv.lineTo(x + s, y - s); cv.lineTo(x - s, y - s); } cv.fill(); }
function dashLine(x0, y0, x1, y1, col, lw = 2, dash = [10, 10]) { cv.save(); cv.setLineDash(dash); cv.strokeStyle = col; cv.lineWidth = lw; cv.beginPath(); cv.moveTo(x0, y0); cv.lineTo(x1, y1); cv.stroke(); cv.restore(); }

// ---------- background and chrome ----------
const GRAIN = [1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256); const r = rng(s * 77); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 9; } g.putImageData(d, 0, 0); return c; });
function glow(x, y, rx, ry, col, a) { cv.save(); cv.translate(x, y); cv.scale(1, ry / rx); const g = cv.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.7, rgba(col, a * 0.25)); g.addColorStop(1, rgba(col, 0)); cv.fillStyle = g; cv.fillRect(-rx, -rx, 2 * rx, 2 * rx); cv.restore(); }
/** The landing hero: accent glow at the top right, violet at the left, a faint dot grid. mood: 0 calm … 1 tense (adds a red tint). */
function background(t, o = {}) {
  cv.fillStyle = C.bg; cv.fillRect(0, 0, W, H);
  const k = o.intensity ?? 1;
  glow(760 + 60 * Math.sin(t * 0.21), 80 + 40 * Math.cos(t * 0.17), 900, 700, C.accent, 0.20 * k);
  glow(110 + 50 * Math.cos(t * 0.19), 640 + 60 * Math.sin(t * 0.23), 620, 560, C.pink, 0.09 * k);
  glow(540, 1820, 900, 380, C.violet, 0.10 * k);
  if (o.tense) glow(540, 960, 900, 900, C.loss, 0.09 * o.tense);
  if (o.happy) glow(540, 960, 900, 900, C.gain, 0.07 * o.happy);
  cv.save(); cv.fillStyle = rgba(C.line, 0.55);
  for (let y = 60; y < H; y += 60) for (let x = 30; x < W; x += 60) { const d = Math.hypot((x - 540) / 540, (y - 960) / 960); const a = clamp(1 - d) * 0.9; if (a > 0.05) { cv.globalAlpha = a; cv.fillRect(x - 1.5, y - 1.5, 3, 3); } }
  cv.restore();
}
function finish(t) {
  const f = Math.floor(t * 24); for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) cv.drawImage(GRAIN[f % 3], x, y);
  const v = cv.createRadialGradient(540, 960, 520, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); cv.fillStyle = v; cv.fillRect(0, 0, W, H);
}
const IMG = {};
function loadImg(key, src) { return new Promise((res) => { const im = new Image(); im.onload = () => { IMG[key] = im; res(); }; im.onerror = () => res(); im.src = src; }); }
/** Logo at the top right and the series pill at the top left (inside the Instagram safe area). */
function chrome(t, label, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  if (IMG.logo) { const h = 50, w = (IMG.logo.width / IMG.logo.height) * h; cv.save(); cv.globalAlpha = a * 0.95; cv.drawImage(IMG.logo, 1020 - w, 272 - h / 2, w, h); cv.restore(); }
  if (label) pill(60, 274, label, { align: 'left', size: 26, alpha: a, dot: o.dot ?? C.gain });
}

// ---------- timeline helpers ----------
let PL = [], LN = [], DUR = 0, LINES = [];
function setTimeline(d) { PL = d.place; LN = d.lens; DUR = d.dur; LINES = d.lines || []; }
const S = (k) => PL[k], E_ = (k) => PL[k] + LN[k], NX = (k) => (k + 1 < PL.length ? PL[k + 1] : DUR);
const win = (t, a, b, fi = 0.35, fo = 0.3) => Math.min(E.out(P(t, a, fi)), 1 - E.in(P(t, b - fo, fo)));
/** Subtitles for muted viewers, in an app-style card near the bottom of the safe area. */
function subs(t, on, o = {}) {
  LINES.forEach(([, sub], k) => { if (!on[k]) return; const a = win(t, S(k), E_(k) + 0.2, 0.15, 0.15); if (a <= 0) return;
    const size = o.size ?? 40, ls = wrap(sub, size, 860, 500); const lh = size * 1.5, y0 = (o.y ?? 1528) - (ls.length - 1) * lh;
    cv.save(); cv.globalAlpha = a * 0.9; rr(80, y0 - lh * 0.75, 920, ls.length * lh + lh * 0.5, 26); cv.fillStyle = rgba(C.side, 0.82); cv.fill(); cv.strokeStyle = rgba(C.line, 0.9); cv.lineWidth = 2; cv.stroke(); cv.restore();
    ls.forEach((l, i) => txt(l, 540, y0 + i * lh, { size, color: C.ink, weight: 500, alpha: a })); });
}
/** A headline block. rows: [[runs or text, size, color?, weight?], …]. Each row reveals right to left. */
function headline(rows, t, a, b, o = {}) {
  const al = o.hold ? E.out(P(t, a, 0.3)) * (1 - E.in(P(t, b - 0.3, 0.3))) : win(t, a, b, 0.25, 0.3); if (al <= 0) return;
  const y0 = o.y ?? 860, gap = o.gap ?? 130; cv.save(); cv.globalAlpha *= al;
  const rise = (1 - E.out(P(t, a, 0.5))) * 24;
  rows.forEach((row, i) => { const [content, size, col, w] = row; const rev = o.instant ? 1 : E.out(P(t, a + (o.stagger ?? 0.3) * i, o.rev ?? 0.6)); const y = y0 + i * gap + rise;
    if (Array.isArray(content)) runs(content, 540, y, { size, weight: w ?? 800, font: o.font ?? 'Rdx', reveal: rev, glow: o.glow });
    else txt(content, 540, y, { size, color: col ?? C.ink, weight: w ?? 800, font: o.font ?? 'Rdx', reveal: rev, glow: o.glowAll }); });
  cv.restore();
}
/** Brand cut: a quick dip with an accent bloom. */
function cutFx(t, times, o = {}) {
  times.forEach((c) => { const k = 1 - Math.abs(t - c) / (o.d ?? 0.2); if (k > 0) { cv.fillStyle = rgba(C.bg, 0.8 * k); cv.fillRect(-20, -20, W + 40, H + 40); glow(540, 960, 800, 800, C.accent, 0.25 * k); } });
}

// ---------- charts ----------
/** Candles in rect r over ohlc[i0..i1), with the app's gain/loss colours. o: lo, hi, log, alpha, highlight {i: color}. Returns {X, Y}. */
function candles(r, ohlc, i0, i1, o = {}) {
  const n = o.span ?? i1 - i0, cw = r.w / n; let lo = o.lo, hi = o.hi;
  if (lo === undefined) { lo = Infinity; hi = -Infinity; for (let i = i0; i < i1; i++) { lo = Math.min(lo, ohlc[i][2]); hi = Math.max(hi, ohlc[i][1]); } const pad = (hi - lo) * 0.08; lo -= pad; hi += pad; }
  const L = o.log ? Math.log : (v) => v, X = (i) => r.x + (i - i0 + 0.5) * cw, Y = (v) => r.y + (1 - (L(v) - L(lo)) / (L(hi) - L(lo))) * r.h;
  cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  for (let i = i0; i < Math.min(i1, ohlc.length); i++) {
    const [op, h, l, c] = ohlc[i], x = X(i), up = c >= op, col = o.color?.(i) ?? (up ? C.gain : C.loss);
    cv.strokeStyle = col; cv.fillStyle = col; cv.lineWidth = Math.max(1.5, Math.min(3, cw * 0.18));
    cv.beginPath(); cv.moveTo(x, Y(h)); cv.lineTo(x, Y(l)); cv.stroke();
    const y0 = Y(Math.max(op, c)), hh = Math.max(2, Math.abs(Y(op) - Y(c))); cv.fillRect(x - cw * 0.34, y0, cw * 0.68, hh);
  }
  cv.restore(); return { X, Y, lo, hi };
}
/** A line series with an optional gradient fill below. */
function series(r, vals, o = {}) {
  const n = o.n ?? vals.length, upto = o.upto ?? vals.length; let lo = o.lo, hi = o.hi;
  if (lo === undefined) { lo = Math.min(...vals); hi = Math.max(...vals); }
  const L = o.log ? Math.log : (v) => v, X = (i) => r.x + (i / (n - 1)) * r.w, Y = (v) => r.y + (1 - (L(v) - L(lo)) / (L(hi) - L(lo))) * r.h;
  const m = Math.min(upto, vals.length); if (m < 2) return { X, Y };
  cv.save(); cv.globalAlpha *= o.alpha ?? 1;
  const path = () => { cv.beginPath(); for (let i = 0; i < Math.floor(m); i++) (i ? cv.lineTo : cv.moveTo).call(cv, X(i), Y(vals[i])); const f = m - Math.floor(m); if (f > 0 && Math.floor(m) < vals.length) cv.lineTo(X(Math.floor(m) - 1 + f), Y(lerp(vals[Math.floor(m) - 1], vals[Math.floor(m)], f))); };
  if (o.fill) { path(); const lastI = Math.min(m, vals.length) - 1; cv.lineTo(X(lastI), r.y + r.h); cv.lineTo(X(0), r.y + r.h); cv.closePath(); const g = cv.createLinearGradient(0, r.y, 0, r.y + r.h); g.addColorStop(0, rgba(o.fill, 0.32)); g.addColorStop(1, rgba(o.fill, 0)); cv.fillStyle = g; cv.fill(); }
  path(); cv.lineJoin = 'round'; cv.lineWidth = o.lw ?? 5; cv.strokeStyle = o.color ?? C.accent; if (o.glow) { cv.shadowColor = o.color ?? C.accent; cv.shadowBlur = 24; } cv.stroke();
  cv.restore(); return { X, Y };
}
function dot(x, y, col, r = 12, pulse = 0) { cv.save(); if (pulse > 0) { cv.globalAlpha *= 0.35 * (1 - pulse); cv.fillStyle = col; cv.beginPath(); cv.arc(x, y, r + 30 * pulse, 0, 7); cv.fill(); cv.globalAlpha = 1; } cv.shadowColor = col; cv.shadowBlur = 24; cv.fillStyle = col; cv.beginPath(); cv.arc(x, y, r, 0, 7); cv.fill(); cv.fillStyle = '#fff'; cv.beginPath(); cv.arc(x, y, r * 0.4, 0, 7); cv.fill(); cv.restore(); }
/** A value label chip (like a price tag on the chart's axis). */
function tag(x, y, s, col, o = {}) { const size = o.size ?? 32, w = measure(s, size, 700) + 34, h = size * 1.6; const left = o.align === 'right' ? x - w : o.align === 'left' ? x : x - w / 2;
  cv.save(); cv.globalAlpha *= o.alpha ?? 1; rr(left, y - h / 2, w, h, 12); cv.fillStyle = col; cv.fill(); cv.restore(); txt(s, left + w / 2, y + 1, { size, weight: 700, color: o.ink ?? '#fff', dir: o.dir ?? 'ltr', alpha: o.alpha }); return w; }

async function boot(render, extra = []) {
  await Promise.all(['400', '500', '600', '700', '800'].flatMap((w) => [document.fonts.load(`${w} 60px Vaz`, 'آبپ۱A$'), document.fonts.load(`${w} 60px Rdx`, 'آبپ۱A$')]));
  await Promise.all([loadImg('logo', window.ASSET + 'brand/svg/logo-fa-dark.svg'), loadImg('icon', window.ASSET + 'brand/svg/app-icon.svg'), ...extra]);
  window.render = render; window.DURATION = DUR; render(0); window.ready = true;
}
