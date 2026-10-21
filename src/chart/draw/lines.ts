import { levelsOf, type Level } from '../drawings';
import { Kit, dashArray, dist, extendTo, fmtDuration, fmtPrice, mid, svgEl, type Pt } from './kit';

/** Lines, channels, pitchforks, and the original rectangle / text / position / measure tools. */

const CLAMP = 1e6;
const clampY = (y: number) => Math.max(-CLAMP, Math.min(CLAMP, y));

/** the segment a–b, stretched far to the left and/or right along its own line */
export function farX(a: Pt, b: Pt, left: boolean, right: boolean, W: number): [Pt, Pt] {
  if (!left && !right) return [a, b];
  const swap = a.x > b.x;
  const l = swap ? b : a;
  const r = swap ? a : b;
  const dx = r.x - l.x;
  let L = l;
  let R = r;
  if (Math.abs(dx) < 1e-9) {
    // vertical: extend up / down instead
    const up = l.y < r.y ? l : r;
    const down = up === l ? r : l;
    if (left) L = { x: l.x, y: up === l ? -CLAMP : CLAMP };
    if (right) R = { x: r.x, y: down === r ? CLAMP : -CLAMP };
    return swap ? [R, L] : [L, R];
  }
  const slope = (r.y - l.y) / dx;
  if (left) L = { x: -2 * W, y: clampY(l.y + slope * (-2 * W - l.x)) };
  if (right) R = { x: 3 * W, y: clampY(r.y + slope * (3 * W - r.x)) };
  return swap ? [R, L] : [L, R];
}

/** price on the line through two points at a bar time (logical units) */
export function priceOnLine(k: Kit, i0: number, i1: number, t: number): number {
  const a = k.d.points[i0];
  const b = k.d.points[i1];
  const l0 = k.v.logical(a.time);
  const l1 = k.v.logical(b.time);
  if (l1 === l0) return a.price;
  return a.price + ((b.price - a.price) * (k.v.logical(t) - l0)) / (l1 - l0);
}

/** the drawing's optional text along a line (above, on or below it) */
export function lineText(k: Kit, a: Pt, b: Pt) {
  const text = k.d.text?.trim();
  if (!text) return;
  const [l, r] = a.x <= b.x ? [a, b] : [b, a];
  const h = k.s('textH') ?? 'center';
  const vpos = k.s('textV') ?? 'top';
  const p = h === 'left' ? l : h === 'right' ? r : mid(l, r);
  const ang = (Math.atan2(r.y - l.y, r.x - l.x) * 180) / Math.PI;
  const holder = svgEl('g', { transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(2)})` }, k.g);
  const ts = k.textStyle();
  const size = ts.size ?? 14;
  k.text(h === 'left' ? 4 : h === 'right' ? -4 : 0, vpos === 'top' ? -4 : vpos === 'bottom' ? 4 : 0, text, {
    ...ts,
    align: h === 'left' ? 'left' : h === 'right' ? 'right' : 'center',
    valign: vpos === 'top' ? 'bottom' : vpos === 'bottom' ? 'top' : 'middle',
    bg: vpos === 'middle' ? k.v.colors.surface : undefined,
    pad: vpos === 'middle' ? 3 : 0,
    parent: holder,
    lineHeight: size + 4,
  });
}

/** price change, bars, time and angle between two points */
export function statsText(k: Kit, i0 = 0, i1 = 1): string {
  const p0 = k.d.points[i0];
  const p1 = k.d.points[i1];
  const a = k.pts[i0];
  const b = k.pts[i1];
  const diff = p1.price - p0.price;
  const bars = Math.round(k.v.logical(p1.time) - k.v.logical(p0.time));
  const ang = (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI;
  return (
    `${diff >= 0 ? '+' : ''}${fmtPrice(diff, k.v.digits)} (${p0.price ? ((diff / p0.price) * 100).toFixed(2) : '0'}%) ${(diff / k.v.pip).toFixed(1)} pips\n` +
    `${bars} bars, ${fmtDuration(p1.time - p0.time)}\n∠ ${ang.toFixed(2)}°`
  );
}

function statsBox(k: Kit, at: Pt, other: Pt, i0 = 0, i1 = 1) {
  const below = at.y >= other.y;
  k.text(at.x + 8, at.y + (below ? 8 : -8), statsText(k, i0, i1), {
    size: 11,
    color: k.v.colors.text,
    bg: k.v.colors.surface,
    bgOpacity: 0.92,
    border: k.col,
    valign: below ? 'top' : 'bottom',
    pad: 6,
  });
}

// ---------- trend line family ----------
export function trendLike(k: Kit) {
  const { pts, v, d } = k;
  if (pts.length < 2) return;
  const [a, b] = pts;
  const t = d.type;
  const extL = t === 'extended' || !!k.s('extendLeft');
  const extR = t === 'ray' || t === 'extended' || !!k.s('extendRight');
  const start = extL ? extendTo(b, a, v.W, v.H) : a;
  const end = extR ? extendTo(a, b, v.W, v.H) : b;
  k.line(start, end);
  if (k.s('arrowStart')) k.arrowHead(b, a);
  if (k.s('arrowEnd')) k.arrowHead(a, b);
  if (k.s('showMiddle')) svgEl('circle', { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, r: 3 + k.sw / 2, fill: k.col }, k.g);
  if (t === 'trendangle') {
    const len = Math.max(30, Math.min(80, dist(a, b)));
    const dir = b.x >= a.x ? 1 : -1;
    k.line(a, { x: a.x + dir * len, y: a.y }, { width: 1, dash: 'dashed', hit: false });
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const base = dir > 0 ? 0 : Math.PI;
    const r = len * 0.6;
    const e = { x: a.x + r * Math.cos(ang), y: a.y + r * Math.sin(ang) };
    const s0 = { x: a.x + r * Math.cos(base), y: a.y };
    let delta = ang - base;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    svgEl('path', { d: `M${s0.x},${s0.y}A${r},${r} 0 0 ${delta > 0 ? 1 : 0} ${e.x},${e.y}`, fill: 'none', stroke: k.col, 'stroke-width': 1 }, k.g);
    const deg = (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI;
    k.text(a.x + dir * (len + 6), a.y, `${deg.toFixed(2)}°`, { size: 12, color: k.col, align: dir > 0 ? 'left' : 'right', valign: 'middle', weight: 600 });
  }
  if (k.s('showStats') && !k.preview) statsBox(k, b, a);
  lineText(k, a, b);
  k.pointHandles();
}

// ---------- horizontal and vertical ----------
function sideText(k: Kit, y: number, x0: number, x1: number) {
  const text = k.d.text?.trim();
  if (!text) return;
  const h = k.s('textH') ?? 'right';
  const vpos = k.s('textV') ?? 'top';
  const x = h === 'left' ? x0 + 6 : h === 'right' ? x1 - 6 : (x0 + x1) / 2;
  k.text(x, vpos === 'top' ? y - 4 : vpos === 'bottom' ? y + 4 : y, text, {
    ...k.textStyle(),
    align: h === 'left' ? 'left' : h === 'right' ? 'right' : 'center',
    valign: vpos === 'top' ? 'bottom' : vpos === 'bottom' ? 'top' : 'middle',
    bg: vpos === 'middle' ? k.v.colors.surface : undefined,
    pad: vpos === 'middle' ? 3 : 0,
  });
}

export function hline(k: Kit) {
  const { pts, v, d } = k;
  const p = pts[0];
  const x0 = d.type === 'hline' ? 0 : p.x;
  k.line({ x: x0, y: p.y }, { x: v.W, y: p.y });
  if (k.s('showPrice')) k.legacyLabel(v.W - 4, p.y - 18, d.points[0].price.toFixed(v.digits), k.col, '#fff', 'end');
  sideText(k, p.y, x0, v.W - (k.s('showPrice') ? 90 : 0));
  k.handle(p, 'p0', k.col, 'ns-resize');
}

function timeLabel(k: Kit, x: number) {
  const t = k.d.points[0].time;
  const dt = new Date(t * 1000);
  const p2 = (n: number) => String(n).padStart(2, '0');
  const s = `${dt.getUTCFullYear()}-${p2(dt.getUTCMonth() + 1)}-${p2(dt.getUTCDate())} ${p2(dt.getUTCHours())}:${p2(dt.getUTCMinutes())}`;
  k.text(x, k.v.H - 4, s, { size: 11, color: '#fff', bg: k.col, align: 'center', valign: 'bottom', pad: 4, weight: 600 });
}

export function vline(k: Kit) {
  const { pts, v } = k;
  const p = pts[0];
  k.line({ x: p.x, y: 0 }, { x: p.x, y: v.H });
  if (k.s('showTime')) timeLabel(k, p.x);
  const text = k.d.text?.trim();
  if (text) {
    const holder = svgEl('g', { transform: `translate(${p.x.toFixed(1)},12) rotate(90)` }, k.g);
    k.text(0, -4, text, { ...k.textStyle(), align: 'left', valign: 'bottom', parent: holder });
  }
  k.handle(p, 'p0', k.col, 'ew-resize');
}

export function crossline(k: Kit) {
  const { pts, v, d } = k;
  const p = pts[0];
  k.line({ x: 0, y: p.y }, { x: v.W, y: p.y });
  k.line({ x: p.x, y: 0 }, { x: p.x, y: v.H });
  if (k.s('showPrice')) k.legacyLabel(v.W - 4, p.y - 18, d.points[0].price.toFixed(v.digits), k.col, '#fff', 'end');
  if (k.s('showTime')) timeLabel(k, p.x);
  k.handle(p, 'p0', k.col, 'move');
}

// ---------- channels ----------
export function channel(k: Kit) {
  const { pts, d, v } = k;
  if (pts.length < 3) {
    k.line(pts[0], pts[1]);
    return;
  }
  const off = d.points[2].price - priceOnLine(k, 0, 1, d.points[2].time);
  const y2a = v.y(d.points[0].price + off);
  const y2b = v.y(d.points[1].price + off);
  if (y2a === null || y2b === null) return;
  const extL = !!k.s('extendLeft');
  const extR = !!k.s('extendRight');
  const [a1, b1] = farX(pts[0], pts[1], extL, extR, v.W);
  const [a2, b2] = farX({ x: pts[0].x, y: y2a }, { x: pts[1].x, y: y2b }, extL, extR, v.W);
  const f = k.fill();
  if (f) svgEl('polygon', { points: `${a1.x},${a1.y} ${b1.x},${b1.y} ${b2.x},${b2.y} ${a2.x},${a2.y}`, fill: f.color, 'fill-opacity': f.opacity }, k.g);
  k.line(a1, b1);
  k.line(a2, b2);
  if (k.s('showMiddle'))
    svgEl(
      'line',
      { x1: (a1.x + a2.x) / 2, y1: (a1.y + a2.y) / 2, x2: (b1.x + b2.x) / 2, y2: (b1.y + b2.y) / 2, stroke: k.col, 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.7 },
      k.g,
    );
  lineText(k, pts[0], pts[1]);
  k.handle(pts[0], 'p0');
  k.handle(pts[1], 'p1');
  k.handle(pts[2], 'p2');
}

export function flattop(k: Kit) {
  const { pts, v } = k;
  if (pts.length < 3) {
    k.line(pts[0], pts[1]);
    return;
  }
  const [a, b, c] = pts;
  const extL = !!k.s('extendLeft');
  const extR = !!k.s('extendRight');
  const [a1, b1] = farX(a, b, extL, extR, v.W);
  const [a2, b2] = farX({ x: a.x, y: c.y }, { x: b.x, y: c.y }, extL, extR, v.W);
  const f = k.fill();
  if (f) svgEl('polygon', { points: `${a1.x},${a1.y} ${b1.x},${b1.y} ${b2.x},${b2.y} ${a2.x},${a2.y}`, fill: f.color, 'fill-opacity': f.opacity }, k.g);
  k.line(a1, b1);
  k.line(a2, b2);
  lineText(k, a, b);
  k.handle(a, 'p0');
  k.handle(b, 'p1');
  k.handle({ x: Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), c.x)), y: c.y }, 'p2', k.col, 'ns-resize');
}

export function disjoint(k: Kit) {
  const { pts, d, v } = k;
  if (pts.length < 3) {
    k.line(pts[0], pts[1]);
    return;
  }
  const [a, b, c] = pts;
  // the second line mirrors the first one's slope and passes through the third point
  const l0 = v.logical(d.points[0].time);
  const l1 = v.logical(d.points[1].time);
  const lc = v.logical(d.points[2].time);
  const m = l1 === l0 ? 0 : (d.points[1].price - d.points[0].price) / (l1 - l0);
  const ya = v.y(d.points[2].price - m * (l0 - lc));
  const yb = v.y(d.points[2].price - m * (l1 - lc));
  if (ya === null || yb === null) return;
  const extL = !!k.s('extendLeft');
  const extR = !!k.s('extendRight');
  const [a1, b1] = farX(a, b, extL, extR, v.W);
  const [a2, b2] = farX({ x: a.x, y: ya }, { x: b.x, y: yb }, extL, extR, v.W);
  const f = k.fill();
  if (f) svgEl('polygon', { points: `${a1.x},${a1.y} ${b1.x},${b1.y} ${b2.x},${b2.y} ${a2.x},${a2.y}`, fill: f.color, 'fill-opacity': f.opacity }, k.g);
  k.line(a1, b1);
  k.line(a2, b2);
  lineText(k, a, b);
  k.handle(a, 'p0');
  k.handle(b, 'p1');
  k.handle(c, 'p2');
}

/** linear regression of the closes between the two bars, with deviation lines */
export function regression(k: Kit) {
  const { d, v } = k;
  let i0 = Math.round(v.logical(d.points[0].time));
  let i1 = Math.round(v.logical(d.points[d.points.length - 1].time));
  if (i0 > i1) [i0, i1] = [i1, i0];
  const n0 = Math.max(0, i0);
  const n1 = Math.min(v.candles.length - 1, i1);
  const xa = v.xAt(i0);
  const xb = v.xAt(i1);
  if (xa === null || xb === null) return;
  if (n1 - n0 < 1) {
    k.line({ x: xa, y: 0 }, { x: xa, y: v.H }, { dash: 'dashed', width: 1 });
    k.line({ x: xb, y: 0 }, { x: xb, y: v.H }, { dash: 'dashed', width: 1 });
    k.handle({ x: xa, y: v.H / 2 }, 'p0', k.col, 'ew-resize');
    k.handle({ x: xb, y: v.H / 2 }, 'p1', k.col, 'ew-resize');
    return;
  }
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  const n = n1 - n0 + 1;
  for (let i = n0; i <= n1; i++) {
    const c = v.candles[i].close;
    sx += i;
    sy += c;
    sxx += i * i;
    sxy += i * c;
    syy += c * c;
  }
  const den = n * sxx - sx * sx;
  const m = den ? (n * sxy - sx * sy) / den : 0;
  const c0 = (sy - m * sx) / n;
  let ss = 0;
  for (let i = n0; i <= n1; i++) {
    const r = v.candles[i].close - (c0 + m * i);
    ss += r * r;
  }
  const sd = Math.sqrt(ss / n);
  const pr = Math.sqrt(Math.max(0, n * sxx - sx * sx) * Math.max(0, n * syy - sy * sy));
  const pearson = pr ? (n * sxy - sx * sy) / pr : 0;
  const up = k.s('devUp') ?? 2;
  const dn = k.s('devDown') ?? 2;
  const at = (i: number, off: number) => v.y(c0 + m * i + off);
  const ca = at(n0, 0);
  const cb = at(n1, 0);
  const ua = at(n0, up * sd);
  const ub = at(n1, up * sd);
  const la = at(n0, -dn * sd);
  const lb = at(n1, -dn * sd);
  const x0 = v.xAt(n0);
  const x1 = v.xAt(n1);
  if ([ca, cb, ua, ub, la, lb, x0, x1].some((q) => q === null)) return;
  const extL = !!k.s('extendLeft');
  const extR = !!k.s('extendRight');
  const C = farX({ x: x0!, y: ca! }, { x: x1!, y: cb! }, extL, extR, v.W);
  const U = farX({ x: x0!, y: ua! }, { x: x1!, y: ub! }, extL, extR, v.W);
  const L = farX({ x: x0!, y: la! }, { x: x1!, y: lb! }, extL, extR, v.W);
  const f = k.fill();
  if (f) {
    svgEl('polygon', { points: `${U[0].x},${U[0].y} ${U[1].x},${U[1].y} ${C[1].x},${C[1].y} ${C[0].x},${C[0].y}`, fill: f.color, 'fill-opacity': f.opacity }, k.g);
    svgEl('polygon', { points: `${L[0].x},${L[0].y} ${L[1].x},${L[1].y} ${C[1].x},${C[1].y} ${C[0].x},${C[0].y}`, fill: v.colors.loss, 'fill-opacity': f.opacity }, k.g);
  }
  k.line(U[0], U[1]);
  k.line(L[0], L[1]);
  k.line(C[0], C[1], { dash: 'dashed', color: v.colors.loss });
  if (k.s('showPearson') && !k.preview) k.text(x0!, Math.max(la!, lb!) + 6, `R ${pearson.toFixed(3)}`, { size: 11, color: k.col, weight: 600 });
  k.handle({ x: x0!, y: ca! }, 'p0', k.col, 'ew-resize');
  k.handle({ x: x1!, y: cb! }, 'p1', k.col, 'ew-resize');
}

// ---------- pitchforks ----------
const visibleSorted = (levels: Level[]) => levels.filter((l) => l.visible && Number.isFinite(l.value)).sort((x, y) => x.value - y.value);

export function pitchfork(k: Kit) {
  const { pts, v } = k;
  if (pts.length < 3) {
    k.line(pts[0], pts[1]);
    return;
  }
  const [A, B, Cp] = pts;
  const M = mid(B, Cp);
  const variant = k.s('variant') ?? 'original';
  const O = variant === 'schiff' ? { x: A.x, y: (A.y + B.y) / 2 } : variant === 'modified' ? mid(A, B) : variant === 'inside' ? mid(A, M) : A;
  const dir = { x: M.x - O.x, y: M.y - O.y };
  const len = Math.hypot(dir.x, dir.y) || 1;
  const far = (p: Pt) => ({ x: p.x + (dir.x / len) * 6000, y: p.y + (dir.y / len) * 6000 });
  const levels = visibleSorted(levelsOf(k.d));
  const oneColor = !!k.s('oneColor');
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const f = k.fill();
  // the two sides: points on B–C at each level, lines from them along the median
  const sides = [B, Cp].map((E) =>
    [{ value: 0, color: k.col, visible: true } as Level, ...levels.filter((l) => l.value !== 0)].map((l) => ({
      l,
      p: { x: M.x + (E.x - M.x) * l.value, y: M.y + (E.y - M.y) * l.value },
    })),
  );
  if (f)
    for (const side of sides)
      for (let i = 1; i < side.length; i++) {
        const p = side[i - 1].p;
        const q = side[i].p;
        const fp = far(p);
        const fq = far(q);
        svgEl('polygon', { points: `${p.x},${p.y} ${fp.x},${fp.y} ${fq.x},${fq.y} ${q.x},${q.y}`, fill: oneColor ? k.col : side[i].l.color, 'fill-opacity': f.opacity }, k.g);
      }
  for (const side of sides) for (const { l, p } of side.slice(1)) k.line(p, extendTo(p, far(p), v.W, v.H), { color: oneColor ? k.col : l.color, width: lw, dash: ld, cap: 'butt' });
  if (O !== A) k.line(A, O, { dash: 'dashed', width: 1 });
  k.line(O, extendTo(O, M, v.W, v.H));
  k.line(B, Cp);
  k.pointHandles();
}

// ---------- the original tools (unchanged look) ----------
export function rect(k: Kit) {
  const { pts, v } = k;
  const extL = !!k.s('extendLeft');
  const extR = !!k.s('extendRight');
  const left = extL ? -10 : Math.min(pts[0].x, pts[1].x);
  const right = extR ? v.W + 10 : Math.max(pts[0].x, pts[1].x);
  const y = Math.min(pts[0].y, pts[1].y);
  const h = Math.abs(pts[1].y - pts[0].y);
  const f = k.fill();
  const r = svgEl(
    'rect',
    {
      x: left,
      y,
      width: right - left,
      height: h,
      fill: f ? f.color : 'none',
      'fill-opacity': f ? f.opacity : undefined,
      stroke: k.col,
      'stroke-width': k.sw,
      'stroke-linecap': 'round',
      'stroke-dasharray': dashArray(k.dash, k.sw),
    },
    k.g,
  );
  if (f) k.hitFill(r);
  else k.hitPath(`M${left},${y}h${right - left}v${h}h${left - right}Z`);
  if (k.s('showMiddle')) k.line({ x: left, y: y + h / 2 }, { x: right, y: y + h / 2 }, { width: 1, dash: 'dashed', hit: false });
  boxText(k, left, y, right - left, h);
  k.handle(pts[0], 'p0');
  k.handle(pts[1], 'p1');
  k.handle({ x: pts[0].x, y: pts[1].y }, 'c2');
  k.handle({ x: pts[1].x, y: pts[0].y }, 'c3');
}

/** the drawing's text inside a box (rectangles, shapes) */
export function boxText(k: Kit, x: number, y: number, w: number, h: number) {
  const text = k.d.text?.trim();
  if (!text) return;
  const hpos = k.s('textH') ?? 'center';
  const vpos = k.s('textV') ?? 'middle';
  k.text(hpos === 'left' ? x + 6 : hpos === 'right' ? x + w - 6 : x + w / 2, vpos === 'top' ? y + 4 : vpos === 'bottom' ? y + h - 4 : y + h / 2, text, {
    ...k.textStyle(),
    align: hpos === 'left' ? 'left' : hpos === 'right' ? 'right' : 'center',
    valign: vpos === 'top' ? 'top' : vpos === 'bottom' ? 'bottom' : 'middle',
  });
}

export function text(k: Kit) {
  const { pts, d } = k;
  const p = pts[0];
  const str = d.text || 'متن';
  const fs = d.style?.fontSize;
  const size = fs ?? [12, 14, 18, 24][Math.max(0, Math.min(3, k.sw - 1))];
  const bold = k.s('bold') !== false;
  const italic = !!k.s('italic');
  const bg = k.s('showTextBg') ? (k.s('textBg') ?? k.col) : undefined;
  const border = k.s('showTextBorder') ? (k.s('textBorder') ?? k.col) : undefined;
  if (!bg && !border && !str.includes('\n')) {
    // the original single-line text
    const t = svgEl(
      'text',
      { x: p.x, y: p.y, 'font-size': size, 'font-weight': bold ? 600 : 400, 'font-style': italic ? 'italic' : undefined, fill: k.col, style: 'unicode-bidi:plaintext' },
      k.g,
    );
    t.textContent = str;
    const w = str.length * size * 0.6 + 6;
    const hit = svgEl('rect', { x: p.x - 3, y: p.y - size, width: w, height: size + 6, fill: 'transparent' }, k.g);
    k.hitFill(hit);
    if (k.selected) svgEl('rect', { x: p.x - 3, y: p.y - size, width: w, height: size + 6, fill: 'none', stroke: k.col, 'stroke-dasharray': '3 3', class: 'h' }, k.g);
    return;
  }
  const box = k.text(p.x - 3, p.y - size, str, { size, weight: bold ? 600 : 400, italic, color: k.col, bg, border, pad: bg || border ? 6 : 3, hit: true });
  if (k.selected) svgEl('rect', { x: box.x - 2, y: box.y - 2, width: box.w + 4, height: box.h + 4, fill: 'none', stroke: k.col, 'stroke-dasharray': '3 3', class: 'h' }, k.g);
}

export function position(k: Kit) {
  const { pts, d, v } = k;
  const c = v.colors;
  const digits = v.digits;
  const g = k.g;
  const dir = d.type === 'long' ? 1 : -1;
  const ye = pts[0].y;
  const ys = v.y(d.stop ?? d.points[0].price);
  const yt = v.y(d.target ?? d.points[0].price);
  if (ys === null || yt === null) return;
  const x0 = Math.min(pts[0].x, pts[1].x);
  const x1 = Math.max(pts[0].x, pts[1].x, x0 + 8);
  const entry = d.points[0].price;
  const pip = v.pip;
  const tgt = ((d.target ?? entry) - entry) * dir;
  const stp = (entry - (d.stop ?? entry)) * dir;
  const profit = svgEl('rect', { x: x0, y: Math.min(ye, yt), width: x1 - x0, height: Math.abs(yt - ye), fill: c.gain, 'fill-opacity': 0.2 }, g);
  const loss = svgEl('rect', { x: x0, y: Math.min(ye, ys), width: x1 - x0, height: Math.abs(ys - ye), fill: c.loss, 'fill-opacity': 0.2 }, g);
  svgEl('line', { x1: x0, y1: yt, x2: x1, y2: yt, stroke: c.gain, 'stroke-width': 1.5 }, g);
  svgEl('line', { x1: x0, y1: ys, x2: x1, y2: ys, stroke: c.loss, 'stroke-width': 1.5 }, g);
  svgEl('line', { x1: x0, y1: ye, x2: x1, y2: ye, stroke: c.text, 'stroke-width': 1.5, opacity: 0.8 }, g);
  k.hitFill(profit);
  k.hitFill(loss);
  const midX = (x0 + x1) / 2;
  const pct = (val: number) => ((val / entry) * 100).toFixed(2);
  k.legacyLabel(
    midX,
    dir > 0 ? Math.min(yt, ye) - 22 : Math.max(yt, ye) + 3,
    `Target: ${(d.target ?? entry).toFixed(digits)} (${pct(tgt)}%) ${(tgt / pip).toFixed(1)} pips`,
    c.gain,
  );
  k.legacyLabel(midX, dir > 0 ? Math.max(ys, ye) + 3 : Math.min(ys, ye) - 22, `Stop: ${(d.stop ?? entry).toFixed(digits)} (${pct(stp)}%) ${(stp / pip).toFixed(1)} pips`, c.loss);
  k.legacyLabel(midX, ye - 10, `R:R ${stp > 0 ? (tgt / stp).toFixed(2) : '—'}`, c.surface, c.text);
  k.handle({ x: x0, y: yt }, 'target', c.gain, 'ns-resize');
  k.handle({ x: x0, y: ys }, 'stop', c.loss, 'ns-resize');
  k.handle({ x: x0, y: ye }, 'entry', c.text, 'move');
  k.handle({ x: x1, y: ye }, 'end', c.text, 'ew-resize');
}

/** the measure tool's original duration format */
const legacyDuration = (sec: number) => {
  const m = Math.round(Math.abs(sec) / 60);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`;
};

export function measure(k: Kit) {
  const { pts, d, v } = k;
  const g = k.g;
  const up = d.points[1].price >= d.points[0].price;
  const mc = up ? '#2962ff' : '#f23645';
  const x = Math.min(pts[0].x, pts[1].x);
  const y = Math.min(pts[0].y, pts[1].y);
  const w = Math.abs(pts[1].x - pts[0].x);
  const h = Math.abs(pts[1].y - pts[0].y);
  const box = svgEl('rect', { x, y, width: Math.max(1, w), height: Math.max(1, h), fill: mc, 'fill-opacity': 0.15 }, g);
  const mx = (pts[0].x + pts[1].x) / 2;
  const my = (pts[0].y + pts[1].y) / 2;
  svgEl('line', { x1: mx, y1: pts[0].y, x2: mx, y2: pts[1].y, stroke: mc, 'stroke-width': 1.5 }, g);
  svgEl('line', { x1: pts[0].x, y1: my, x2: pts[1].x, y2: my, stroke: mc, 'stroke-width': 1.5 }, g);
  const ah = up ? 6 : -6;
  svgEl('path', { d: `M${mx - 5},${pts[1].y + ah} L${mx},${pts[1].y} L${mx + 5},${pts[1].y + ah}`, fill: 'none', stroke: mc, 'stroke-width': 1.5 }, g);
  const diff = d.points[1].price - d.points[0].price;
  const bars = Math.round(v.logical(d.points[1].time) - v.logical(d.points[0].time));
  k.legacyLabel(
    mx,
    up ? y - 40 : y + h + 4,
    `${diff >= 0 ? '+' : ''}${diff.toFixed(v.digits)} (${((diff / d.points[0].price) * 100).toFixed(2)}%) ${(diff / v.pip).toFixed(1)} pips\n${bars} bars, ${legacyDuration(d.points[1].time - d.points[0].time)}`,
    mc,
  );
  k.hitFill(box);
  k.handle(pts[0], 'p0', mc);
  k.handle(pts[1], 'p1', mc);
}
