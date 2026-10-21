import { levelsOf, type Level } from '../drawings';
import { Kit, dashArray, dist, extendTo, fmtNum, mid, svgEl, type Pt } from './kit';
import { farX, priceOnLine } from './lines';

/** Fibonacci and Gann tools: every level is editable (value, colour, on/off), see Drawing.levels. */

const sortedVisible = (levels: Level[]) => levels.filter((l) => l.visible && Number.isFinite(l.value)).sort((a, b) => a.value - b.value);
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

function color(k: Kit, l: Level) {
  return k.s('oneColor') ? k.col : l.color;
}

function levelText(k: Kit, l: Level, price?: number): string {
  const parts: string[] = [];
  if (k.s('showLabels') !== false) parts.push(k.s('percent') ? pct(l.value) : fmtNum(l.value));
  if (price !== undefined && k.s('showPrices')) parts.push(parts.length ? `(${price.toFixed(k.v.digits)})` : price.toFixed(k.v.digits));
  return parts.join(' ');
}

function smallText(k: Kit, x: number, y: number, str: string, fill: string, anchor: 'start' | 'middle' | 'end' = 'start') {
  const t = svgEl('text', { x, y, 'text-anchor': anchor, 'font-size': k.s('fontSize') ?? 11, fill, style: 'font-variant-numeric:tabular-nums' }, k.g);
  t.textContent = str;
}

/** level lines across [left, right] at base + span × level (Fib retracement and extension) */
function horizontalLevels(k: Kit, base: number, span: number, left: number, right: number) {
  const { v } = k;
  const xL = k.s('extendLeft') ? 0 : left;
  const xR = k.s('extendRight') ? v.W : right;
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const fs = k.s('fontSize') ?? 11;
  const labH = k.s('labelH') ?? 'left';
  const labV = k.s('labelV') ?? 'top';
  let prevY: number | null = null;
  for (const l of sortedVisible(levelsOf(k.d))) {
    const price = base + span * l.value;
    const ly = v.y(price);
    if (ly === null) continue;
    const c = color(k, l);
    if (prevY !== null && f) svgEl('rect', { x: xL, y: Math.min(prevY, ly), width: xR - xL, height: Math.abs(ly - prevY), fill: c, 'fill-opacity': f.opacity }, k.g);
    svgEl('line', { x1: xL, y1: ly, x2: xR, y2: ly, stroke: c, 'stroke-width': lw, 'stroke-dasharray': dashArray(ld, lw) }, k.g);
    k.hitSeg({ x: xL, y: ly }, { x: xR, y: ly });
    const label = levelText(k, l, price);
    if (label) {
      // left of the levels, or inside them when they start at the chart's edge
      const inside = labH === 'right' ? xR > v.W - 110 : xL < 110;
      const x = labH === 'right' ? (inside ? xR - 4 : xR + 6) : inside ? xL + 4 : xL - 6;
      const anchor = labH === 'right' ? (inside ? 'end' : 'start') : inside ? 'start' : 'end';
      const y = labV === 'top' ? ly - 3 : labV === 'middle' ? ly + fs * 0.35 : ly + fs + 1;
      smallText(k, x, y, label, c, anchor);
    }
    prevY = ly;
  }
}

/** the dashed line through the points (Fib tools' "trend line") */
function trendPath(k: Kit, pts: Pt[]) {
  if (k.s('showTrend') === false || pts.length < 2) return;
  const legacy = !k.d.style;
  svgEl(
    'path',
    {
      d: pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(''),
      fill: 'none',
      stroke: k.col,
      'stroke-width': legacy ? 1 : k.sw,
      'stroke-dasharray': legacy ? '4 4' : dashArray(k.dash, k.sw),
    },
    k.g,
  );
  k.hitPath(pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(''));
}

/** too few points yet (still drawing): the points joined */
function partial(k: Kit, n: number) {
  if (k.pts.length >= n) return false;
  k.poly(k.pts, { dash: 'dashed', width: 1 });
  return true;
}

// ---------- Fibonacci ----------
export function fibRetracement(k: Kit) {
  const { pts, d } = k;
  const [a, b] = pts;
  const rev = !!k.s('reverse');
  const p0 = d.points[0].price;
  const p1 = d.points[1].price;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  horizontalLevels(k, rev ? p0 : p1, rev ? p1 - p0 : p0 - p1, left, right);
  trendPath(k, [a, b]);
  if (k.interactive) {
    const top = Math.min(a.y, b.y);
    k.hitFill(svgEl('rect', { x: left, y: top, width: Math.max(4, right - left), height: Math.max(4, Math.abs(b.y - a.y)), fill: 'transparent' }, k.g));
  }
  k.handle(a, 'p0');
  k.handle(b, 'p1');
}

export function fibExtension(k: Kit) {
  if (partial(k, 3)) return;
  const { pts, d } = k;
  const [a, b, c] = pts;
  const rev = !!k.s('reverse');
  const span = (d.points[1].price - d.points[0].price) * (rev ? -1 : 1);
  let left = Math.min(b.x, c.x);
  let right = Math.max(b.x, c.x);
  if (right - left < 30) right = left + Math.max(30, Math.abs(b.x - a.x));
  if (c.x > b.x && right - left < 30) left = c.x;
  horizontalLevels(k, d.points[2].price, span, left, right);
  trendPath(k, [a, b, c]);
  k.pointHandles();
}

export function fibChannel(k: Kit) {
  if (partial(k, 3)) return;
  const { pts, d, v } = k;
  const [a, b] = pts;
  const off = d.points[2].price - priceOnLine(k, 0, 1, d.points[2].time);
  const rev = !!k.s('reverse');
  const extL = !!k.s('extendLeft');
  const extR = !!k.s('extendRight');
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const labRight = k.s('labelH') === 'right';
  let prev: [Pt, Pt] | null = null;
  for (const l of sortedVisible(levelsOf(d))) {
    const o = off * (rev ? 1 - l.value : l.value);
    const ya = v.y(d.points[0].price + o);
    const yb = v.y(d.points[1].price + o);
    if (ya === null || yb === null) continue;
    const seg = farX({ x: a.x, y: ya }, { x: b.x, y: yb }, extL, extR, v.W);
    const c = color(k, l);
    if (prev && f)
      svgEl('polygon', { points: `${prev[0].x},${prev[0].y} ${prev[1].x},${prev[1].y} ${seg[1].x},${seg[1].y} ${seg[0].x},${seg[0].y}`, fill: c, 'fill-opacity': f.opacity }, k.g);
    k.line(seg[0], seg[1], { color: c, width: lw, dash: ld, cap: 'butt' });
    const label = levelText(k, l, a.x <= b.x !== labRight ? d.points[0].price + o : d.points[1].price + o);
    if (label) {
      const p = a.x <= b.x !== labRight ? { x: a.x, y: ya } : { x: b.x, y: yb };
      smallText(k, p.x + (labRight ? 6 : -6), p.y - 3, label, c, labRight ? 'start' : 'end');
    }
    prev = seg;
  }
  trendPath(k, [a, b]);
  k.pointHandles();
}

/** vertical lines at bar offsets: Fib time zone (from the first point) and trend-based Fib time (from the third) */
function verticalLevels(k: Kit, l0: number, unit: number, useValue: (l: Level) => number) {
  const { v } = k;
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  let prevX: number | null = null;
  for (const l of sortedVisible(levelsOf(k.d))) {
    const x = v.xAt(l0 + unit * useValue(l));
    if (x === null) continue;
    const c = color(k, l);
    if (prevX !== null && f && Math.abs(x - prevX) > 0.5)
      svgEl('rect', { x: Math.min(prevX, x), y: 0, width: Math.abs(x - prevX), height: v.H, fill: c, 'fill-opacity': f.opacity }, k.g);
    prevX = x;
    if (x < -20 || x > v.W + 20) continue;
    k.line({ x, y: 0 }, { x, y: v.H }, { color: c, width: lw, dash: ld, cap: 'butt' });
    const label = k.s('showLabels') !== false ? (k.s('percent') ? pct(l.value) : fmtNum(l.value)) : '';
    if (label) smallText(k, x + 4, 14, label, c);
  }
}

export function fibTimeZone(k: Kit) {
  const { pts, d, v } = k;
  const l0 = v.logical(d.points[0].time);
  const unit = v.logical(d.points[1].time) - l0;
  verticalLevels(k, l0, unit, (l) => l.value);
  trendPath(k, pts.slice(0, 2));
  k.pointHandles();
}

export function fibTime(k: Kit) {
  if (partial(k, 3)) return;
  const { pts, d, v } = k;
  const unit = v.logical(d.points[1].time) - v.logical(d.points[0].time);
  verticalLevels(k, v.logical(d.points[2].time), unit, (l) => l.value);
  trendPath(k, pts);
  k.pointHandles();
}

/** wedges between rays from o through the given points, and the rays themselves */
function fan(k: Kit, o: Pt, rays: { p: Pt; color: string; label?: string }[], lw: number, ld: Level['dash']) {
  const { v } = k;
  const f = k.fill();
  const far = (p: Pt) => {
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: o.x + (dx / len) * 8000, y: o.y + (dy / len) * 8000 };
  };
  const sorted = rays.slice().sort((r1, r2) => Math.atan2(r1.p.y - o.y, r1.p.x - o.x) - Math.atan2(r2.p.y - o.y, r2.p.x - o.x));
  if (f)
    for (let i = 1; i < sorted.length; i++) {
      const p = far(sorted[i - 1].p);
      const q = far(sorted[i].p);
      svgEl('polygon', { points: `${o.x},${o.y} ${p.x},${p.y} ${q.x},${q.y}`, fill: sorted[i].color, 'fill-opacity': f.opacity }, k.g);
    }
  for (const r of rays) {
    k.line(o, extendTo(o, r.p, v.W, v.H), { color: r.color, width: lw, dash: ld });
    if (r.label) smallText(k, r.p.x + 4, r.p.y - 4, r.label, r.color);
  }
}

export function fibFan(k: Kit) {
  const { pts } = k;
  const [a, b] = pts;
  const rev = !!k.s('reverse');
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const P = sortedVisible(levelsOf(k.d, 'levels'));
  const T = sortedVisible(levelsOf(k.d, 'levels2'));
  const yOf = (v: number) => (rev ? a.y + (b.y - a.y) * v : b.y + (a.y - b.y) * v);
  const xOf = (v: number) => (rev ? a.x + (b.x - a.x) * v : b.x + (a.x - b.x) * v);
  const labels = k.s('showLabels') !== false;
  if (k.s('grid') !== false) {
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    for (const l of P) {
      const y = yOf(l.value);
      k.line({ x: a.x, y }, { x: b.x, y }, { color: color(k, l), width: 1, dash: 'solid', opacity: 0.6, hit: false });
      if (labels) smallText(k, b.x + (b.x >= a.x ? 4 : -4), y + 4, fmtNum(l.value), color(k, l), b.x >= a.x ? 'start' : 'end');
    }
    for (const l of T) {
      const x = xOf(l.value);
      k.line({ x, y: a.y }, { x, y: b.y }, { color: color(k, l), width: 1, dash: 'solid', opacity: 0.6, hit: false });
      if (labels) smallText(k, x, (b.y >= a.y ? bottom + 13 : top - 4) + 0, fmtNum(l.value), color(k, l), 'middle');
    }
  }
  const rays: { p: Pt; color: string }[] = [];
  for (const l of P) rays.push({ p: { x: b.x, y: yOf(l.value) }, color: color(k, l) });
  for (const l of T) if (!P.some((pl) => pl.value === 0 && l.value === 0)) rays.push({ p: { x: xOf(l.value), y: b.y }, color: color(k, l) });
  fan(
    k,
    a,
    rays.filter((r) => Math.hypot(r.p.x - a.x, r.p.y - a.y) > 0.5),
    lw,
    ld,
  );
  k.pointHandles();
}

const circlePath = (c: Pt, r: number) => `M${c.x - r},${c.y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;

export function fibCircles(k: Kit) {
  const { pts } = k;
  const [a, b] = pts;
  const R = dist(a, b);
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  let prev = 0;
  for (const l of sortedVisible(levelsOf(k.d))) {
    const r = R * l.value;
    if (r <= 0) continue;
    const c = color(k, l);
    if (f) svgEl('path', { d: circlePath(a, r) + (prev > 0 ? circlePath(a, prev) : ''), fill: c, 'fill-opacity': f.opacity, 'fill-rule': 'evenodd' }, k.g);
    k.path(circlePath(a, r), { color: c, width: lw, dash: ld });
    const label = k.s('showLabels') !== false ? (k.s('percent') ? pct(l.value) : fmtNum(l.value)) : '';
    if (label) smallText(k, a.x, a.y - r - 3, label, c, 'middle');
    prev = r;
  }
  trendPath(k, [a, b]);
  k.pointHandles();
}

export function fibArcs(k: Kit) {
  const { pts } = k;
  const [a, b] = pts;
  const R = dist(a, b);
  const lower = a.y > b.y;
  const full = !!k.s('fullCircles');
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const sw = lower ? 0 : 1;
  const half = (r: number) => `M${b.x - r},${b.y}A${r},${r} 0 0 ${sw} ${b.x + r},${b.y}`;
  let prev = 0;
  for (const l of sortedVisible(levelsOf(k.d))) {
    const r = R * l.value;
    if (r <= 0) continue;
    const c = color(k, l);
    if (f) {
      const ring = full
        ? circlePath(b, r) + (prev > 0 ? circlePath(b, prev) : '')
        : `${half(r)}L${b.x + prev},${b.y}${prev > 0 ? `A${prev},${prev} 0 0 ${1 - sw} ${b.x - prev},${b.y}` : `L${b.x - prev},${b.y}`}Z`;
      svgEl('path', { d: ring, fill: c, 'fill-opacity': f.opacity, 'fill-rule': 'evenodd' }, k.g);
    }
    k.path(full ? circlePath(b, r) : half(r), { color: c, width: lw, dash: ld });
    const label = k.s('showLabels') !== false ? (k.s('percent') ? pct(l.value) : fmtNum(l.value)) : '';
    if (label) smallText(k, b.x, lower ? b.y + r + 12 : b.y - r - 3, label, c, 'middle');
    prev = r;
  }
  trendPath(k, [a, b]);
  k.pointHandles();
}

export function fibWedge(k: Kit) {
  if (partial(k, 3)) return;
  const { pts } = k;
  const [a, b, c] = pts;
  const R = dist(a, b);
  const t1 = Math.atan2(b.y - a.y, b.x - a.x);
  let delta = Math.atan2(c.y - a.y, c.x - a.x) - t1;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const t2 = t1 + delta;
  const sw = delta > 0 ? 1 : 0;
  const at = (r: number, t: number) => ({ x: a.x + r * Math.cos(t), y: a.y + r * Math.sin(t) });
  const levels = sortedVisible(levelsOf(k.d));
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const maxR = R * Math.max(1, ...levels.map((l) => l.value));
  let prev = 0;
  for (const l of levels) {
    const r = R * l.value;
    if (r <= 0) continue;
    const s2 = at(r, t1);
    const e2 = at(r, t2);
    const col = color(k, l);
    if (f) {
      const s1 = at(prev, t1);
      const e1 = at(prev, t2);
      svgEl(
        'path',
        { d: `M${s2.x},${s2.y}A${r},${r} 0 0 ${sw} ${e2.x},${e2.y}L${e1.x},${e1.y}A${prev},${prev} 0 0 ${1 - sw} ${s1.x},${s1.y}Z`, fill: col, 'fill-opacity': f.opacity },
        k.g,
      );
    }
    k.path(`M${s2.x},${s2.y}A${r},${r} 0 0 ${sw} ${e2.x},${e2.y}`, { color: col, width: lw, dash: ld });
    const label = k.s('showLabels') !== false ? (k.s('percent') ? pct(l.value) : fmtNum(l.value)) : '';
    if (label) smallText(k, s2.x + 4, s2.y - 4, label, col);
    prev = r;
  }
  k.line(a, at(maxR, t1));
  k.line(a, at(maxR, t2));
  k.pointHandles();
}

export function fibSpiral(k: Kit) {
  const { pts, v } = k;
  const [a, b] = pts;
  const r0 = dist(a, b);
  if (r0 < 1) return;
  const t0 = Math.atan2(b.y - a.y, b.x - a.x);
  const phi = (1 + Math.sqrt(5)) / 2;
  const limit = 3 * Math.max(v.W, v.H) + dist(a, { x: v.W / 2, y: v.H / 2 });
  const out: string[] = [];
  // from the inside out: the radius grows by φ every quarter turn
  for (let i = -320; i <= 400; i++) {
    const t = (i * Math.PI) / 80;
    const r = r0 * Math.pow(phi, (2 * t) / Math.PI);
    if (r < 0.5) continue;
    if (r > limit) break;
    const x = a.x + r * Math.cos(t0 + t);
    const y = a.y + r * Math.sin(t0 + t);
    out.push(`${out.length ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  k.path(out.join(''));
  if (k.s('showTrend') !== false) k.line(a, extendTo(a, b, v.W, v.H), { width: 1, dash: 'dashed' });
  k.pointHandles();
}

export function pitchfan(k: Kit) {
  if (partial(k, 3)) return;
  const { pts } = k;
  const [A, B, C] = pts;
  const M = mid(B, C);
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const rays: { p: Pt; color: string }[] = [{ p: M, color: k.col }];
  for (const l of sortedVisible(levelsOf(k.d)))
    if (l.value !== 0) for (const E of [B, C]) rays.push({ p: { x: M.x + (E.x - M.x) * l.value, y: M.y + (E.y - M.y) * l.value }, color: color(k, l) });
  fan(k, A, rays, lw, ld);
  k.line(A, M, { hit: false });
  k.line(B, C);
  k.pointHandles();
}

// ---------- Gann ----------
export function gannBox(k: Kit) {
  const { pts } = k;
  const [a, b] = pts;
  const rev = !!k.s('reverse');
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  const yOf = (v: number) => (rev ? b.y + (a.y - b.y) * v : a.y + (b.y - a.y) * v);
  const xOf = (v: number) => (rev ? b.x + (a.x - b.x) * v : a.x + (b.x - a.x) * v);
  const P = sortedVisible(levelsOf(k.d, 'levels'));
  const T = sortedVisible(levelsOf(k.d, 'levels2'));
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const op = f?.opacity ?? 0.08;
  if (f)
    for (let i = 1; i < P.length; i++) {
      const y1 = yOf(P[i - 1].value);
      const y2 = yOf(P[i].value);
      svgEl('rect', { x: left, y: Math.min(y1, y2), width: right - left, height: Math.abs(y2 - y1), fill: color(k, P[i]), 'fill-opacity': op }, k.g);
    }
  if (k.s('showFill2'))
    for (let i = 1; i < T.length; i++) {
      const x1 = xOf(T[i - 1].value);
      const x2 = xOf(T[i].value);
      svgEl('rect', { x: Math.min(x1, x2), y: top, width: Math.abs(x2 - x1), height: bottom - top, fill: color(k, T[i]), 'fill-opacity': op }, k.g);
    }
  const fs = k.s('fontSize') ?? 11;
  for (const l of P) {
    const y = yOf(l.value);
    const c = color(k, l);
    k.line({ x: left, y }, { x: right, y }, { color: c, width: lw, dash: ld, cap: 'butt' });
    if (k.s('labelsLeft')) smallText(k, left - 4, y + fs * 0.35, fmtNum(l.value), c, 'end');
    if (k.s('labelsRight')) smallText(k, right + 4, y + fs * 0.35, fmtNum(l.value), c, 'start');
  }
  for (const l of T) {
    const x = xOf(l.value);
    const c = color(k, l);
    k.line({ x, y: top }, { x, y: bottom }, { color: c, width: lw, dash: ld, cap: 'butt' });
    if (k.s('labelsTop')) smallText(k, x, top - 4, fmtNum(l.value), c, 'middle');
    if (k.s('labelsBottom')) smallText(k, x, bottom + fs + 2, fmtNum(l.value), c, 'middle');
  }
  if (k.s('angles')) {
    k.line({ x: left, y: top }, { x: right, y: bottom }, { width: 1, dash: 'solid', hit: false });
    k.line({ x: left, y: bottom }, { x: right, y: top }, { width: 1, dash: 'solid', hit: false });
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    k.poly(
      [
        { x: cx, y: top },
        { x: right, y: cy },
        { x: cx, y: bottom },
        { x: left, y: cy },
      ],
      { close: true, width: 1, dash: 'dashed', hit: false },
    );
  }
  if (k.interactive) k.hitFill(svgEl('rect', { x: left, y: top, width: Math.max(4, right - left), height: Math.max(4, bottom - top), fill: 'transparent' }, k.g));
  k.handle(a, 'p0');
  k.handle(b, 'p1');
  k.handle({ x: a.x, y: b.y }, 'c2');
  k.handle({ x: b.x, y: a.y }, 'c3');
}

export function gannSquare(k: Kit) {
  const { pts, d } = k;
  const [a, b] = pts;
  const rev = !!k.s('reverse');
  const O = rev ? { x: a.x, y: b.y } : a;
  const E = rev ? { x: b.x, y: a.y } : b;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  const f = k.fill();
  const lw = k.s('levelWidth') ?? 1;
  const labels = k.s('showLabels') !== false;
  if (k.s('grid') !== false) {
    const L = sortedVisible(levelsOf(d, 'levels'));
    for (let i = 0; i < L.length; i++) {
      const y = O.y + (E.y - O.y) * L[i].value;
      const x = O.x + (E.x - O.x) * L[i].value;
      const c = color(k, L[i]);
      if (f && i > 0) {
        const py = O.y + (E.y - O.y) * L[i - 1].value;
        svgEl('rect', { x: left, y: Math.min(py, y), width: right - left, height: Math.abs(y - py), fill: c, 'fill-opacity': f.opacity }, k.g);
      }
      k.line({ x: left, y }, { x: right, y }, { color: c, width: lw, dash: 'solid', cap: 'butt' });
      k.line({ x, y: top }, { x, y: bottom }, { color: c, width: lw, dash: 'solid', cap: 'butt' });
      if (labels) {
        smallText(k, left - 4, y + 4, fmtNum(L[i].value), c, 'end');
        smallText(k, x, bottom + 13, fmtNum(L[i].value), c, 'middle');
      }
    }
  }
  if (k.s('fans') !== false)
    for (const l of levelsOf(d, 'levels2')) {
      if (!l.visible || !(l.value > 0) || !((l.value2 ?? 1) > 0)) continue;
      const r = l.value / (l.value2 ?? 1);
      const end = r <= 1 ? { x: E.x, y: O.y + (E.y - O.y) * r } : { x: O.x + (E.x - O.x) / r, y: E.y };
      const c = color(k, l);
      k.line(O, end, { color: c, width: lw, dash: 'solid' });
      if (labels) smallText(k, end.x + (E.x >= O.x ? 3 : -3), end.y + (E.y >= O.y ? 12 : -3), `${fmtNum(l.value)}/${fmtNum(l.value2 ?? 1)}`, c, E.x >= O.x ? 'start' : 'end');
    }
  if (k.s('arcs') !== false) {
    const sx = Math.sign(E.x - O.x) || 1;
    const sy = Math.sign(E.y - O.y) || 1;
    for (const l of sortedVisible(levelsOf(d, 'levels3'))) {
      const rx = Math.abs(E.x - O.x) * l.value;
      const ry = Math.abs(E.y - O.y) * l.value;
      if (rx < 0.5 || ry < 0.5) continue;
      k.path(`M${O.x + sx * rx},${O.y}A${rx},${ry} 0 0 ${sx * sy > 0 ? 1 : 0} ${O.x},${O.y + sy * ry}`, { color: color(k, l), width: lw, dash: 'solid' });
    }
  }
  svgEl('rect', { x: left, y: top, width: right - left, height: bottom - top, fill: 'none', stroke: k.col, 'stroke-width': k.sw }, k.g);
  if (k.interactive) k.hitFill(svgEl('rect', { x: left, y: top, width: Math.max(4, right - left), height: Math.max(4, bottom - top), fill: 'transparent' }, k.g));
  k.handle(a, 'p0');
  k.handle(b, 'p1');
  if (d.type === 'gannsquare') {
    k.handle({ x: a.x, y: b.y }, 'c2');
    k.handle({ x: b.x, y: a.y }, 'c3');
  }
}

export function gannFan(k: Kit) {
  const { pts } = k;
  const [a, b] = pts;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lw = k.s('levelWidth') ?? 1;
  const ld = k.s('levelDash') ?? 'solid';
  const labels = k.s('showLabels') !== false;
  const rays: { p: Pt; color: string; label?: string }[] = [];
  for (const l of levelsOf(k.d)) {
    const t = l.value2 ?? 1;
    if (!l.visible || !(l.value > 0) || !(t > 0)) continue;
    const m = Math.max(l.value, t);
    rays.push({ p: { x: a.x + (dx * t) / m, y: a.y + (dy * l.value) / m }, color: color(k, l), label: labels ? `${fmtNum(l.value)}/${fmtNum(t)}` : undefined });
  }
  fan(k, a, rays, lw, ld);
  k.pointHandles();
}
