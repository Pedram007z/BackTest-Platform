import type { Drawing } from '../drawings';
import { Kit, dist, fmtDuration, fmtPrice, mid, svgEl, type Pt } from './kit';

/** Chart patterns, Elliott waves, cycles, and the forecasting / range tools. */

// ---------- labels ----------
function isHigh(pts: Pt[], i: number) {
  const p = pts[i];
  const prev = pts[i - 1];
  const next = pts[i + 1];
  if (prev && next) return p.y <= (prev.y + next.y) / 2;
  if (prev) return p.y <= prev.y;
  if (next) return p.y <= next.y;
  return true;
}

/** a white letter on a box of the pattern's colour, above a high or below a low */
function pointLabel(k: Kit, i: number, text: string) {
  if (k.s('showLabels') === false || !text) return;
  const p = k.pts[i];
  const high = isHigh(k.pts, i);
  k.text(p.x, high ? p.y - 6 : p.y + 6, text, {
    size: k.s('fontSize') ?? 12,
    weight: 700,
    color: '#fff',
    bg: k.col,
    pad: 4,
    align: 'center',
    valign: high ? 'bottom' : 'top',
  });
}

const leg = (d: Drawing, i: number, j: number) => Math.abs(d.points[j].price - d.points[i].price);
const ratioOf = (num: number, den: number) => (den > 0 ? num / den : 0);

/** a dashed line between two points with a ratio in its middle */
function ratioLine(k: Kit, i: number, j: number, value: number) {
  const a = k.pts[i];
  const b = k.pts[j];
  if (!a || !b) return;
  k.line(a, b, { width: 1, dash: 'dashed', hit: false });
  if (k.s('showLabels') === false || !Number.isFinite(value)) return;
  const m = mid(a, b);
  k.text(m.x, m.y, value.toFixed(3), { size: 11, color: k.col, bg: k.v.colors.surface, bgOpacity: 0.9, border: k.col, pad: 3, align: 'center', valign: 'middle' });
}

function fillTri(k: Kit, idx: number[]) {
  const f = k.fill();
  if (!f || idx.some((i) => !k.pts[i])) return;
  k.area(
    idx.map((i) => k.pts[i]),
    f.color,
    f.opacity,
    true,
  );
}

// ---------- harmonic and chart patterns ----------
export function xabcd(k: Kit) {
  const d = k.d;
  fillTri(k, [0, 1, 2]);
  fillTri(k, [2, 3, 4]);
  k.poly(k.pts);
  const n = k.pts.length;
  if (k.d.type === 'cypher') {
    if (n > 2) ratioLine(k, 0, 2, ratioOf(leg(d, 1, 2), leg(d, 0, 1)));
    if (n > 3) ratioLine(k, 0, 3, ratioOf(leg(d, 0, 3), leg(d, 0, 1)));
    if (n > 4) ratioLine(k, 0, 4, ratioOf(leg(d, 3, 4), leg(d, 0, 3)));
  } else {
    if (n > 2) ratioLine(k, 0, 2, ratioOf(leg(d, 1, 2), leg(d, 0, 1)));
    if (n > 3) ratioLine(k, 1, 3, ratioOf(leg(d, 2, 3), leg(d, 1, 2)));
    if (n > 4) ratioLine(k, 2, 4, ratioOf(leg(d, 3, 4), leg(d, 2, 3)));
    if (n > 4) ratioLine(k, 1, 4, ratioOf(leg(d, 1, 4), leg(d, 0, 1)));
  }
  ['X', 'A', 'B', 'C', 'D'].forEach((l, i) => i < n && pointLabel(k, i, l));
  k.pointHandles();
}

export function abcd(k: Kit) {
  const d = k.d;
  const n = k.pts.length;
  k.poly(k.pts);
  if (n > 2) ratioLine(k, 0, 2, ratioOf(leg(d, 1, 2), leg(d, 0, 1)));
  if (n > 3) ratioLine(k, 1, 3, ratioOf(leg(d, 2, 3), leg(d, 1, 2)));
  ['A', 'B', 'C', 'D'].forEach((l, i) => i < n && pointLabel(k, i, l));
  k.pointHandles();
}

export function headShoulders(k: Kit) {
  const n = k.pts.length;
  fillTri(k, [0, 1, 2]);
  fillTri(k, [2, 3, 4]);
  fillTri(k, [4, 5, 6]);
  k.poly(k.pts);
  if (n > 4) {
    // the neckline through both troughs, across the whole pattern
    const a = k.pts[2];
    const b = k.pts[4];
    const x0 = k.pts[0].x;
    const x1 = k.pts[n - 1].x;
    const slope = b.x === a.x ? 0 : (b.y - a.y) / (b.x - a.x);
    k.line({ x: x0, y: a.y + slope * (x0 - a.x) }, { x: x1, y: a.y + slope * (x1 - a.x) }, { dash: 'dashed', width: 1 });
  }
  const names: [number, string][] = [
    [1, 'شانه‌ی چپ'],
    [3, 'سر'],
    [5, 'شانه‌ی راست'],
  ];
  for (const [i, s] of names) if (i < n) pointLabel(k, i, s);
  k.pointHandles();
}

export function trianglePattern(k: Kit) {
  const n = k.pts.length;
  k.poly(k.pts);
  if (n === 4) {
    const [A, B, C, D] = k.pts;
    const s1 = C.x === A.x ? 0 : (C.y - A.y) / (C.x - A.x);
    const s2 = D.x === B.x ? 0 : (D.y - B.y) / (D.x - B.x);
    const xs = Math.min(A.x, B.x);
    // where the two sides meet (or a bit beyond the last point when they do not converge)
    let xe = Math.max(C.x, D.x) + Math.abs(Math.max(C.x, D.x) - xs) * 0.3;
    if (s1 !== s2) {
      const xi = (B.y - A.y + s1 * A.x - s2 * B.x) / (s1 - s2);
      if (xi > Math.max(C.x, D.x)) xe = Math.min(xi, xe + 4 * Math.abs(Math.max(C.x, D.x) - xs));
    }
    const y1 = (x: number) => A.y + s1 * (x - A.x);
    const y2 = (x: number) => B.y + s2 * (x - B.x);
    const f = k.fill();
    if (f)
      k.area(
        [
          { x: xs, y: y1(xs) },
          { x: xe, y: y1(xe) },
          { x: xe, y: y2(xe) },
          { x: xs, y: y2(xs) },
        ],
        f.color,
        f.opacity,
        true,
      );
    k.line({ x: xs, y: y1(xs) }, { x: xe, y: y1(xe) }, { width: 1, dash: 'dashed' });
    k.line({ x: xs, y: y2(xs) }, { x: xe, y: y2(xe) }, { width: 1, dash: 'dashed' });
  }
  ['A', 'B', 'C', 'D'].forEach((l, i) => i < n && pointLabel(k, i, l));
  k.pointHandles();
}

export function threeDrives(k: Kit) {
  const d = k.d;
  const n = k.pts.length;
  k.poly(k.pts);
  if (n > 2) ratioLine(k, 0, 2, ratioOf(leg(d, 1, 2), leg(d, 0, 1)));
  if (n > 3) ratioLine(k, 1, 3, ratioOf(leg(d, 2, 3), leg(d, 1, 2)));
  if (n > 4) ratioLine(k, 2, 4, ratioOf(leg(d, 3, 4), leg(d, 2, 3)));
  if (n > 5) ratioLine(k, 3, 5, ratioOf(leg(d, 4, 5), leg(d, 3, 4)));
  const names: [number, string][] = [
    [1, '1'],
    [2, 'A'],
    [3, '2'],
    [4, 'B'],
    [5, '3'],
  ];
  for (const [i, s] of names) if (i < n) pointLabel(k, i, s);
  k.pointHandles();
}

// ---------- Elliott waves ----------
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v'];
export function waveLabel(s: string, degree: string | undefined): string {
  const num = /^\d$/.test(s);
  switch (degree) {
    case 'circled':
      return num ? String.fromCodePoint(0x2460 + Number(s) - 1) : String.fromCodePoint(0x24b6 + (s.charCodeAt(0) - 65));
    case 'plain':
      return s;
    case 'romanParen':
      return `(${num ? ROMAN[Number(s) - 1] : s.toLowerCase()})`;
    case 'roman':
      return num ? ROMAN[Number(s) - 1] : s.toLowerCase();
    default:
      return `(${s})`;
  }
}

const WAVES: Record<string, string[]> = {
  elliott5: ['1', '2', '3', '4', '5'],
  elliott3: ['A', 'B', 'C'],
  elliotttriangle: ['A', 'B', 'C', 'D', 'E'],
  elliottwxy: ['W', 'X', 'Y'],
  elliottwxyxz: ['W', 'X', 'Y', 'X', 'Z'],
};

export function elliott(k: Kit) {
  k.poly(k.pts);
  const names = WAVES[k.d.type] ?? [];
  const deg = k.s('degree');
  const fs = k.s('fontSize') ?? 13;
  if (k.s('showLabels') !== false)
    for (let i = 1; i < k.pts.length; i++) {
      const p = k.pts[i];
      const high = isHigh(k.pts, i);
      k.text(p.x, high ? p.y - 5 : p.y + 5, waveLabel(names[i - 1] ?? '', deg), { size: fs, weight: 700, color: k.col, align: 'center', valign: high ? 'bottom' : 'top' });
    }
  k.pointHandles();
}

// ---------- cycles ----------
/** the first repetition that reaches the visible area */
function firstVisible(k: Kit, l0: number, step: number) {
  const x0 = k.v.xAt(l0);
  if (x0 === null || x0 >= 0) return 0;
  return Math.max(0, Math.floor(-x0 / (step * Math.max(0.01, k.v.barSpacing))) - 1);
}

export function cyclicLines(k: Kit) {
  const { v, d } = k;
  const l0 = v.logical(d.points[0].time);
  const unit = v.logical(d.points[1].time) - l0;
  const [a, b] = k.pts;
  if (Math.abs(unit) < 0.5) {
    k.line({ x: a.x, y: 0 }, { x: a.x, y: v.H });
  } else {
    const step = Math.abs(unit);
    const lmin = Math.min(l0, l0 + unit);
    const start = firstVisible(k, lmin, step);
    for (let i = start; i < start + 600; i++) {
      const x = v.xAt(lmin + i * step);
      if (x === null || x > v.W + 10) break;
      if (x < -10) continue;
      k.line({ x, y: 0 }, { x, y: v.H });
    }
  }
  k.line(a, b, { width: 1, dash: 'dashed', hit: false });
  k.pointHandles();
}

export function timeCycles(k: Kit) {
  const { v, d } = k;
  const [a, b] = k.pts;
  const l0 = v.logical(d.points[0].time);
  const unit = Math.abs(v.logical(d.points[1].time) - l0);
  const up = b.y <= a.y;
  const f = k.fill();
  if (unit >= 0.5) {
    const lmin = Math.min(l0, v.logical(d.points[1].time));
    const start = firstVisible(k, lmin, unit);
    for (let i = start; i < start + 400; i++) {
      const xa = v.xAt(lmin + i * unit);
      const xb = v.xAt(lmin + (i + 1) * unit);
      if (xa === null || xb === null || xa > v.W + 10) break;
      if (xb < -10) continue;
      const rx = Math.abs(xb - xa) / 2;
      const ry = Math.abs(b.y - a.y) > 3 ? Math.abs(b.y - a.y) : rx;
      const path = `M${xa},${a.y}A${rx},${ry} 0 0 ${up ? 1 : 0} ${xb},${a.y}`;
      k.path(f ? `${path}Z` : path, { fill: f?.color, fillOpacity: f?.opacity });
    }
  }
  k.pointHandles();
}

export function sineLine(k: Kit) {
  const { v } = k;
  const [a, b] = k.pts;
  const half = b.x - a.x;
  if (Math.abs(half) < 2) {
    k.line(a, b);
    return;
  }
  const c = (a.y + b.y) / 2;
  const A = (a.y - b.y) / 2;
  const out: string[] = [];
  for (let x = -10; x <= v.W + 10; x += 3) out.push(`${out.length ? 'L' : 'M'}${x},${(c + A * Math.cos((Math.PI * (x - a.x)) / half)).toFixed(1)}`);
  k.path(out.join(''));
  k.pointHandles();
}

// ---------- forecasting and ranges ----------
export function forecast(k: Kit) {
  const { v, d } = k;
  const [a, b] = k.pts;
  const c = v.colors;
  k.line(a, b);
  k.arrowHead(a, b);
  svgEl('circle', { cx: a.x, cy: a.y, r: 4, fill: c.surface, stroke: k.col, 'stroke-width': 2 }, k.g);
  const p0 = d.points[0].price;
  const p1 = d.points[1].price;
  const diff = p1 - p0;
  const up = diff >= 0;
  // reached the target between the source and the target time?
  const i0 = Math.max(0, Math.floor(v.logical(d.points[0].time)) + 1);
  const i1 = Math.min(v.candles.length - 1, Math.floor(v.logical(d.points[1].time)));
  let hit = false;
  for (let i = i0; i <= i1 && !hit; i++) hit = up ? v.candles[i].high >= p1 : v.candles[i].low <= p1;
  const last = v.candles[v.candles.length - 1];
  const ended = !!last && last.time >= d.points[1].time;
  const status = hit ? 'Success' : ended ? 'Failure' : '';
  const bg = hit ? c.gain : ended ? c.loss : k.col;
  if (!k.preview)
    k.text(b.x, b.y + (up ? -8 : 8), `${diff >= 0 ? '+' : ''}${fmtPrice(diff, v.digits)} (${p0 ? ((diff / p0) * 100).toFixed(2) : 0}%)${status ? `\n${status}` : ''}`, {
      size: 11,
      weight: 600,
      color: '#fff',
      bg,
      pad: 5,
      align: 'center',
      valign: up ? 'bottom' : 'top',
    });
  k.pointHandles();
}

export function dateRange(k: Kit) {
  const { v, d } = k;
  const [a, b] = k.pts;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  const f = k.fill();
  const box = svgEl(
    'rect',
    { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top), fill: f?.color ?? 'transparent', 'fill-opacity': f?.opacity },
    k.g,
  );
  k.hitFill(box);
  k.line({ x: a.x, y: top }, { x: a.x, y: bottom }, { width: 1, dash: 'solid' });
  k.line({ x: b.x, y: top }, { x: b.x, y: bottom }, { width: 1, dash: 'solid' });
  const my = (top + bottom) / 2;
  k.line({ x: a.x, y: my }, { x: b.x, y: my }, { width: 1.5, dash: 'solid' });
  k.arrowHead({ x: a.x, y: my }, { x: b.x, y: my }, k.col, 1.5);
  const bars = Math.round(v.logical(d.points[1].time) - v.logical(d.points[0].time));
  if (!k.preview)
    k.text((left + right) / 2, bottom + 6, `${bars} bars\n${fmtDuration(d.points[1].time - d.points[0].time)}`, {
      size: 11,
      weight: 600,
      color: '#fff',
      bg: k.col,
      pad: 5,
      align: 'center',
      valign: 'top',
    });
  k.pointHandles();
}

export function priceRange(k: Kit) {
  const { v, d } = k;
  const [a, b] = k.pts;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  const f = k.fill();
  const box = svgEl(
    'rect',
    { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top), fill: f?.color ?? 'transparent', 'fill-opacity': f?.opacity },
    k.g,
  );
  k.hitFill(box);
  k.line({ x: left, y: a.y }, { x: right, y: a.y }, { width: 1, dash: 'solid' });
  k.line({ x: left, y: b.y }, { x: right, y: b.y }, { width: 1, dash: 'solid' });
  const mx = (left + right) / 2;
  k.line({ x: mx, y: a.y }, { x: mx, y: b.y }, { width: 1.5, dash: 'solid' });
  k.arrowHead({ x: mx, y: a.y }, { x: mx, y: b.y }, k.col, 1.5);
  const diff = d.points[1].price - d.points[0].price;
  const up = diff >= 0;
  if (!k.preview)
    k.text(mx, up ? top - 6 : bottom + 6, `${up ? '+' : ''}${fmtPrice(diff, v.digits)} (${((diff / d.points[0].price) * 100).toFixed(2)}%)\n${(diff / v.pip).toFixed(1)} pips`, {
      size: 11,
      weight: 600,
      color: '#fff',
      bg: k.col,
      pad: 5,
      align: 'center',
      valign: up ? 'bottom' : 'top',
    });
  k.pointHandles();
}

export function barsPattern(k: Kit) {
  const { v, d } = k;
  const bars = d.bars ?? [];
  if (!bars.length) {
    const [a, b] = k.pts;
    const box = svgEl('rect', { x: Math.min(a.x, b.x), y: 0, width: Math.abs(b.x - a.x), height: v.H, fill: k.col, 'fill-opacity': 0.08 }, k.g);
    k.hitFill(box);
    k.pointHandles();
    return;
  }
  const mode = k.s('mode') ?? 'candles';
  const mirror = !!k.s('mirror');
  const flip = !!k.s('flip');
  const base = bars[0][0];
  const shift = d.points[0].price - base;
  const l0 = v.logical(d.points[0].time);
  const n = bars.length;
  const bw = Math.max(1, Math.min(14, v.barSpacing * 0.6));
  const tr = (p: number) => (flip ? 2 * base - p : p) + shift;
  const line: string[] = [];
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < n; i++) {
    const src = bars[mirror ? n - 1 - i : i];
    let [o, h, l, c] = src;
    if (mirror) [o, c] = [c, o];
    o = tr(o);
    c = tr(c);
    [h, l] = flip ? [tr(l), tr(h)] : [tr(h), tr(l)];
    const x = v.xAt(l0 + i);
    const yo = v.y(o);
    const yh = v.y(h);
    const yl = v.y(l);
    const yc = v.y(c);
    if (x === null || yo === null || yh === null || yl === null || yc === null) continue;
    minY = Math.min(minY, yh);
    maxY = Math.max(maxY, yl);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    if (x < -bw || x > v.W + bw) continue;
    const upBar = c >= o;
    if (mode === 'line') line.push(`${line.length ? 'L' : 'M'}${x},${yc}`);
    else if (mode === 'bars') {
      svgEl('path', { d: `M${x},${yh}V${yl}M${x - bw / 2},${yo}H${x}M${x},${yc}H${x + bw / 2}`, stroke: k.col, 'stroke-width': 1, opacity: upBar ? 0.95 : 0.6 }, k.g);
    } else {
      svgEl('line', { x1: x, y1: yh, x2: x, y2: yl, stroke: k.col, 'stroke-width': 1, opacity: 0.8 }, k.g);
      svgEl(
        'rect',
        {
          x: x - bw / 2,
          y: Math.min(yo, yc),
          width: bw,
          height: Math.max(1, Math.abs(yc - yo)),
          fill: k.col,
          'fill-opacity': upBar ? 0.25 : 0.85,
          stroke: k.col,
          'stroke-width': 1,
        },
        k.g,
      );
    }
  }
  if (line.length > 1) k.path(line.join(''), { width: k.sw, dash: 'solid' });
  if (k.interactive && minX <= maxX)
    k.hitFill(svgEl('rect', { x: minX - bw, y: minY, width: Math.max(4, maxX - minX + 2 * bw), height: Math.max(4, maxY - minY), fill: 'transparent' }, k.g));
  k.handle(k.pts[0], 'body', k.col, 'move');
}

/** a stable pseudo-random number for a drawing's bar (ghost feed wicks) */
function noise(seed: number, i: number) {
  let x = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
const seedOf = (id: string) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
};

export function ghostFeed(k: Kit) {
  const { v, d } = k;
  const up = k.s('upColor') ?? '#089981';
  const down = k.s('downColor') ?? '#f23645';
  const hl = (k.s('avgHL') ?? 0.1) / 100;
  const variance = (k.s('variance') ?? 50) / 100;
  const seed = seedOf(d.id);
  const bw = Math.max(1, Math.min(14, v.barSpacing * 0.6));
  let prevClose = d.points[0]?.price ?? 0;
  for (let s = 0; s + 1 < d.points.length; s++) {
    const p = d.points[s];
    const q = d.points[s + 1];
    const la = Math.round(v.logical(p.time));
    const lb = Math.round(v.logical(q.time));
    if (lb <= la) continue;
    for (let l = la + 1; l <= lb; l++) {
      const t = (l - la) / (lb - la);
      const close = p.price + (q.price - p.price) * t;
      const open = prevClose;
      prevClose = close;
      const x = v.xAt(l);
      if (x === null || x < -bw || x > v.W + bw) continue;
      const wick = Math.abs(close) * hl * (1 + variance * (noise(seed, l) - 0.5) * 2);
      const high = Math.max(open, close) + wick * noise(seed, l + 7919);
      const low = Math.min(open, close) - wick * noise(seed, l + 104729);
      const yo = v.y(open);
      const yc = v.y(close);
      const yh = v.y(high);
      const yl = v.y(low);
      if (yo === null || yc === null || yh === null || yl === null) continue;
      const col = close >= open ? up : down;
      svgEl('line', { x1: x, y1: yh, x2: x, y2: yl, stroke: col, 'stroke-width': 1, opacity: 0.75 }, k.g);
      svgEl('rect', { x: x - bw / 2, y: Math.min(yo, yc), width: bw, height: Math.max(1, Math.abs(yc - yo)), fill: col, opacity: 0.75 }, k.g);
    }
  }
  k.poly(k.pts, { width: 1, dash: 'dashed', opacity: k.selected || k.preview ? 0.8 : 0.25 });
  k.pointHandles();
}

export function projection(k: Kit) {
  const { d } = k;
  if (k.pts.length < 3) {
    k.poly(k.pts);
    return;
  }
  const [A, B, C] = k.pts;
  const R = dist(A, B);
  const tb = Math.atan2(B.y - A.y, B.x - A.x);
  let delta = Math.atan2(C.y - A.y, C.x - A.x) - tb;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const e = { x: A.x + R * Math.cos(tb + delta), y: A.y + R * Math.sin(tb + delta) };
  const f = k.fill();
  if (f) svgEl('path', { d: `M${A.x},${A.y}L${B.x},${B.y}A${R},${R} 0 0 ${delta > 0 ? 1 : 0} ${e.x},${e.y}Z`, fill: f.color, 'fill-opacity': f.opacity }, k.g);
  k.line(A, B);
  k.line(A, C);
  k.path(`M${B.x},${B.y}A${R},${R} 0 0 ${delta > 0 ? 1 : 0} ${e.x},${e.y}`, { width: 1, dash: 'dashed' });
  const ab = Math.abs(d.points[1].price - d.points[0].price);
  const ac = Math.abs(d.points[2].price - d.points[0].price);
  if (!k.preview) k.text(C.x + 8, C.y, `${ab ? ((ac / ab) * 100).toFixed(1) : '0'}%`, { size: 11, weight: 600, color: '#fff', bg: k.col, pad: 4, valign: 'middle' });
  k.pointHandles();
}
