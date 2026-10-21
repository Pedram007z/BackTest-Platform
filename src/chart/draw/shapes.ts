import { Kit, dist, mid, svgEl, textWidth, type Pt } from './kit';
import { boxText, lineText, statsText } from './lines';

/** Brushes, arrows, geometric shapes and the text / note annotations. */

/** a smooth path through the points (midpoint quadratic curves) */
function smooth(points: Pt[], close = false): string {
  if (points.length < 3) return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const m = mid(points[i], points[i + 1]);
    d += `Q${points[i].x.toFixed(1)},${points[i].y.toFixed(1)} ${m.x.toFixed(1)},${m.y.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += `L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return close ? `${d}Z` : d;
}

export function brush(k: Kit) {
  const f = k.d.type === 'brush' ? k.fill() : null;
  if (k.d.type === 'highlighter') {
    k.path(smooth(k.pts), { width: k.sw * 5, opacity: 0.4, dash: 'solid', cap: 'round' });
  } else {
    const el = k.path(smooth(k.pts, !!f), { fill: f?.color, fillOpacity: f?.opacity }, !!f);
    el.setAttribute('stroke-linejoin', 'round');
  }
  if (k.selected && k.pts.length) {
    k.handle(k.pts[0], 'body', k.col, 'move');
    k.handle(k.pts[k.pts.length - 1], 'body', k.col, 'move');
  }
}

export function arrowMarker(k: Kit) {
  const [a, b] = k.pts;
  const len = dist(a, b);
  if (len < 1) return;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const nx = -uy;
  const ny = ux;
  const shaft = 3 + k.sw * 1.5;
  const headW = shaft * 2.6;
  const headL = Math.min(len * 0.6, 14 + k.sw * 4);
  const hx = b.x - ux * headL;
  const hy = b.y - uy * headL;
  const pts: Pt[] = [
    { x: a.x + nx * shaft * 0.4, y: a.y + ny * shaft * 0.4 },
    { x: hx + nx * shaft, y: hy + ny * shaft },
    { x: hx + nx * headW, y: hy + ny * headW },
    b,
    { x: hx - nx * headW, y: hy - ny * headW },
    { x: hx - nx * shaft, y: hy - ny * shaft },
    { x: a.x - nx * shaft * 0.4, y: a.y - ny * shaft * 0.4 },
  ];
  k.poly(pts, { close: true, fill: k.col, fillOpacity: 1, width: 1, dash: 'solid' });
  const text = k.d.text?.trim();
  if (text) k.text(a.x - ux * 8, a.y - uy * 8, text, { ...k.textStyle(), align: ux > 0 ? 'right' : 'left', valign: uy > 0 ? 'bottom' : 'top' });
  k.pointHandles();
}

export function arrowLine(k: Kit) {
  const [a, b] = k.pts;
  k.line(a, b);
  if (k.s('arrowStart')) k.arrowHead(b, a);
  if (k.s('arrowEnd') !== false) k.arrowHead(a, b);
  if (k.s('showStats') && !k.preview) {
    const below = b.y >= a.y;
    k.text(b.x + 8, b.y + (below ? 8 : -8), statsText(k), {
      size: 11,
      color: k.v.colors.text,
      bg: k.v.colors.surface,
      bgOpacity: 0.92,
      border: k.col,
      valign: below ? 'top' : 'bottom',
      pad: 6,
    });
  }
  lineText(k, a, b);
  k.pointHandles();
}

/** Arrow Mark Up / Down: a filled arrow at the point, its tip on the price */
export function arrowMark(k: Kit) {
  const p = k.pts[0];
  const up = k.d.type === 'arrowup';
  const s = 1 + (k.sw - 2) * 0.25;
  const dir = up ? 1 : -1;
  const w = 11 * s;
  const head = 12 * s;
  const tail = 15 * s;
  const sh = 4.5 * s;
  const pts: Pt[] = [
    p,
    { x: p.x + w, y: p.y + dir * head },
    { x: p.x + sh, y: p.y + dir * head },
    { x: p.x + sh, y: p.y + dir * (head + tail) },
    { x: p.x - sh, y: p.y + dir * (head + tail) },
    { x: p.x - sh, y: p.y + dir * head },
    { x: p.x - w, y: p.y + dir * head },
  ];
  k.poly(pts, { close: true, fill: k.col, fillOpacity: 1, width: 1, dash: 'solid' });
  const text = k.d.text?.trim();
  if (text) k.text(p.x, p.y + dir * (head + tail + 4), text, { ...k.textStyle(), align: 'center', valign: up ? 'top' : 'bottom' });
  k.handle(p, 'p0', k.col, 'move');
}

export function rotatedRect(k: Kit) {
  const [a, b] = k.pts;
  if (k.pts.length < 3) {
    k.line(a, b);
    return;
  }
  const c = k.pts[2];
  const len = dist(a, b) || 1;
  const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  const h = (c.x - a.x) * n.x + (c.y - a.y) * n.y;
  const quad = [a, b, { x: b.x + n.x * h, y: b.y + n.y * h }, { x: a.x + n.x * h, y: a.y + n.y * h }];
  const f = k.fill();
  k.poly(quad, { close: true, fill: f?.color, fillOpacity: f?.opacity });
  const m = mid(quad[0], quad[2]);
  boxText(k, m.x - 1, m.y - 1, 2, 2);
  k.handle(a, 'p0');
  k.handle(b, 'p1');
  k.handle({ x: (a.x + b.x) / 2 + n.x * h, y: (a.y + b.y) / 2 + n.y * h }, 'p2');
}

const ellipsePath = (c: Pt, rx: number, ry: number, rot: number) => {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const p1 = { x: c.x + rx * cos, y: c.y + rx * sin };
  const p2 = { x: c.x - rx * cos, y: c.y - rx * sin };
  const deg = (rot * 180) / Math.PI;
  return `M${p1.x},${p1.y}A${rx},${ry} ${deg} 1 1 ${p2.x},${p2.y}A${rx},${ry} ${deg} 1 1 ${p1.x},${p1.y}Z`;
};

export function circle(k: Kit) {
  const [a, b] = k.pts;
  const r = dist(a, b);
  const f = k.fill();
  k.path(ellipsePath(a, Math.max(r, 0.5), Math.max(r, 0.5), 0), { fill: f?.color, fillOpacity: f?.opacity }, !!f);
  boxText(k, a.x - 1, a.y - 1, 2, 2);
  k.handle(a, 'p0', k.col, 'move');
  k.handle(b, 'p1');
}

export function ellipse(k: Kit) {
  const [a, b] = k.pts;
  const c0 = mid(a, b);
  const rx = dist(a, b) / 2;
  const rot = Math.atan2(b.y - a.y, b.x - a.x);
  const n = { x: -Math.sin(rot), y: Math.cos(rot) };
  const c = k.pts[2];
  const ry = c ? Math.abs((c.x - c0.x) * n.x + (c.y - c0.y) * n.y) : rx * 0.5;
  const f = k.fill();
  k.path(ellipsePath(c0, Math.max(rx, 0.5), Math.max(ry, 0.5), rot), { fill: f?.color, fillOpacity: f?.opacity }, !!f);
  boxText(k, c0.x - 1, c0.y - 1, 2, 2);
  k.handle(a, 'p0');
  k.handle(b, 'p1');
  if (c)
    k.handle({ x: c0.x + n.x * ry * Math.sign((c.x - c0.x) * n.x + (c.y - c0.y) * n.y || 1), y: c0.y + n.y * ry * Math.sign((c.x - c0.x) * n.x + (c.y - c0.y) * n.y || 1) }, 'p2');
}

export function polyline(k: Kit) {
  const closed = k.d.type === 'triangle' || (k.d.type === 'polyline' && !!k.s('closed') && !k.preview);
  const f = closed ? k.fill() : null;
  k.poly(k.pts, { close: closed, fill: f?.color, fillOpacity: f?.opacity });
  if (k.d.type === 'path' && k.pts.length > 1) {
    const n = k.pts.length;
    if (k.s('arrowEnd') !== false) k.arrowHead(k.pts[n - 2], k.pts[n - 1]);
    if (k.s('arrowStart')) k.arrowHead(k.pts[1], k.pts[0]);
  }
  if (k.d.type === 'triangle' && k.pts.length === 3) {
    const c = { x: (k.pts[0].x + k.pts[1].x + k.pts[2].x) / 3, y: (k.pts[0].y + k.pts[1].y + k.pts[2].y) / 3 };
    boxText(k, c.x - 1, c.y - 1, 2, 2);
  }
  k.pointHandles();
}

export function arc(k: Kit) {
  const [a, b] = k.pts;
  const c = k.pts[2] ?? mid(a, b);
  // the curve passes through the third point halfway
  const q = { x: 2 * c.x - (a.x + b.x) / 2, y: 2 * c.y - (a.y + b.y) / 2 };
  const f = k.fill();
  k.path(`M${a.x},${a.y}Q${q.x},${q.y} ${b.x},${b.y}${f ? 'Z' : ''}`, { fill: f?.color, fillOpacity: f?.opacity }, !!f);
  k.pointHandles();
}

export function curve(k: Kit) {
  const [a, b] = k.pts;
  const f = k.fill();
  if (k.d.type === 'curve') {
    const c = k.pts[2] ?? mid(a, b);
    k.path(`M${a.x},${a.y}Q${c.x},${c.y} ${b.x},${b.y}${f ? 'Z' : ''}`, { fill: f?.color, fillOpacity: f?.opacity }, !!f);
    if (k.s('arrowEnd')) k.arrowHead(c, b);
    if (k.s('arrowStart')) k.arrowHead(c, a);
    if (k.selected && k.pts[2]) k.line(a, c, { width: 1, dash: 'dotted', opacity: 0.5, hit: false });
  } else {
    const c1 = k.pts[2] ?? a;
    const c2 = k.pts[3] ?? b;
    k.path(`M${a.x},${a.y}C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}${f ? 'Z' : ''}`, { fill: f?.color, fillOpacity: f?.opacity }, !!f);
    if (k.s('arrowEnd')) k.arrowHead(c2, b);
    if (k.s('arrowStart')) k.arrowHead(c1, a);
    if (k.selected && k.pts[3]) {
      k.line(a, c1, { width: 1, dash: 'dotted', opacity: 0.5, hit: false });
      k.line(b, c2, { width: 1, dash: 'dotted', opacity: 0.5, hit: false });
    }
  }
  k.pointHandles();
}

// ---------- annotations ----------
const placeholder: Record<string, string> = { anchoredtext: 'متن', note: 'یادداشت', pin: '', callout: 'توضیح', comment: 'دیدگاه', signpost: 'تابلو' };
const textOf = (k: Kit) => k.d.text ?? placeholder[k.d.type] ?? '';

export function anchoredText(k: Kit) {
  const a = k.d.anchor ?? { x: 0.5, y: 0.2 };
  const x = a.x * k.v.W;
  const y = a.y * k.v.H;
  const ts = k.textStyle();
  const bg = k.s('showTextBg') ? (k.s('textBg') ?? k.col) : undefined;
  const border = k.s('showTextBorder') ? (k.s('textBorder') ?? k.col) : undefined;
  const box = k.text(x, y, textOf(k) || 'متن', { ...ts, color: k.s('textColor') ?? k.col, bg, border, pad: 6, hit: true });
  if (k.selected) svgEl('rect', { x: box.x - 2, y: box.y - 2, width: box.w + 4, height: box.h + 4, fill: 'none', stroke: k.col, 'stroke-dasharray': '3 3', class: 'h' }, k.g);
}

/** the hover card of notes and pins (always shown while selected) */
function tooltip(k: Kit, x: number, y: number, str: string, parent: SVGElement) {
  if (!str.trim()) return;
  k.text(x, y, str, {
    ...k.textStyle(),
    color: k.v.colors.text,
    bg: k.v.colors.surface,
    bgOpacity: 0.97,
    border: k.col,
    pad: 8,
    radius: 6,
    align: 'center',
    valign: 'bottom',
    cls: k.selected ? undefined : 'btl-tip',
    parent,
  });
}

export function note(k: Kit) {
  const p = k.pts[0];
  const g = svgEl('g', { class: 'btl-note' }, k.g);
  const s = 22;
  const icon = svgEl('rect', { x: p.x - s / 2, y: p.y - s - 6, width: s, height: s, rx: 5, fill: k.col }, g);
  svgEl(
    'path',
    { d: `M${p.x - 5},${p.y - s + 1}h10M${p.x - 5},${p.y - s + 5.5}h10M${p.x - 5},${p.y - s + 10}h6`, stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round' },
    g,
  );
  svgEl('path', { d: `M${p.x - 4},${p.y - 6.5}L${p.x},${p.y}L${p.x + 4},${p.y - 6.5}Z`, fill: k.col }, g);
  k.hitFill(icon);
  tooltip(k, p.x, p.y - s - 12, textOf(k), g);
  k.handle(p, 'p0', k.col, 'move');
}

export function pin(k: Kit) {
  const p = k.pts[0];
  const g = svgEl('g', { class: 'btl-note' }, k.g);
  const r = 9;
  const cy = p.y - 22;
  const body = svgEl(
    'path',
    {
      d: `M${p.x},${p.y}C${p.x - 3},${cy + 9} ${p.x - r},${cy + 6} ${p.x - r},${cy}A${r},${r} 0 1 1 ${p.x + r},${cy}C${p.x + r},${cy + 6} ${p.x + 3},${cy + 9} ${p.x},${p.y}Z`,
      fill: k.col,
    },
    g,
  );
  svgEl('circle', { cx: p.x, cy, r: 3.5, fill: '#fff' }, g);
  k.hitFill(body);
  tooltip(k, p.x, cy - r - 6, textOf(k), g);
  k.handle(p, 'p0', k.col, 'move');
}

function bubble(k: Kit, p: Pt, str: string, bg: string, fg: string) {
  // a speech bubble above and to the right of the point, its tail on the point
  const box = k.text(p.x - 10, p.y - 12, str, { ...k.textStyle(), color: fg, bg, pad: 8, radius: 6, valign: 'bottom', hit: true });
  k.poly(
    [
      { x: p.x, y: p.y },
      { x: p.x + 4, y: p.y - 13 },
      { x: p.x + 14, y: p.y - 13 },
    ],
    { close: true, fill: bg, fillOpacity: 1, stroke: false, hit: false },
  );
  return box;
}

export function comment(k: Kit) {
  const p = k.pts[0];
  bubble(k, p, textOf(k) || ' ', k.s('textBg') ?? k.col, k.s('textColor') ?? '#fff');
  k.handle(p, 'p0', k.col, 'move');
}

export function priceLabel(k: Kit) {
  const p = k.pts[0];
  bubble(k, p, k.d.points[0].price.toFixed(k.v.digits), k.col, '#fff');
  k.handle(p, 'p0', k.col, 'move');
}

export function callout(k: Kit) {
  const [a, b] = k.pts;
  const ts = k.textStyle();
  const str = textOf(k) || ' ';
  const size = ts.size ?? 14;
  const lines = str.split('\n');
  const w = Math.max(...lines.map((l) => textWidth(l, size, ts.weight))) + 20;
  const h = lines.length * Math.round(size * 1.35) + 14;
  const bg = k.s('textBg') ?? k.col;
  // the tail: from the box's centre to the anchor
  const len = dist(a, b) || 1;
  const nx = -(a.y - b.y) / len;
  const ny = (a.x - b.x) / len;
  const base = Math.min(12, Math.min(w, h) / 3);
  k.poly([{ x: b.x + nx * base, y: b.y + ny * base }, a, { x: b.x - nx * base, y: b.y - ny * base }], {
    close: true,
    fill: bg,
    fillOpacity: 1,
    color: k.col,
    width: k.sw,
    dash: 'solid',
  });
  k.text(b.x, b.y, str, { ...ts, color: k.s('textColor') ?? '#fff', bg, border: k.col, pad: 10, radius: 6, align: 'center', valign: 'middle', hit: true });
  k.handle(a, 'p0');
  k.handle({ x: b.x, y: b.y + h / 2 + 2 }, 'p1', k.col, 'move');
}

export function priceNote(k: Kit) {
  const [a, b] = k.pts;
  k.line(a, b);
  svgEl('circle', { cx: a.x, cy: a.y, r: 3 + k.sw / 2, fill: k.col }, k.g);
  const price = k.d.points[0].price.toFixed(k.v.digits);
  const text = k.d.text?.trim();
  k.text(b.x, b.y, text ? `${price}\n${text}` : price, {
    ...k.textStyle(),
    size: k.s('fontSize') ?? 13,
    color: '#fff',
    bg: k.col,
    pad: 6,
    align: b.x >= a.x ? 'left' : 'right',
    valign: 'middle',
    hit: true,
  });
  k.pointHandles();
}

export function signpost(k: Kit) {
  const p = k.pts[0];
  const top = p.y - 46;
  k.line(p, { x: p.x, y: top }, { width: 2, dash: 'solid' });
  svgEl('circle', { cx: p.x, cy: p.y, r: 3, fill: k.col }, k.g);
  k.text(p.x, top, textOf(k) || ' ', {
    ...k.textStyle(),
    color: k.s('textColor') ?? '#fff',
    bg: k.s('textBg') ?? k.col,
    pad: 7,
    radius: 6,
    align: 'center',
    valign: 'bottom',
    hit: true,
  });
  k.handle(p, 'p0', k.col, 'move');
}

export function flag(k: Kit) {
  const p = k.pts[0];
  const s = 1 + (k.sw - 2) * 0.2;
  const top = p.y - 30 * s;
  k.line(p, { x: p.x, y: top }, { width: 2, dash: 'solid' });
  const w = 18 * s;
  const h = 12 * s;
  const body = svgEl('path', { d: `M${p.x},${top}h${w}l${-5 * s},${h / 2}l${5 * s},${h / 2}h${-w}Z`, fill: k.col }, k.g);
  k.hitFill(body);
  k.handle(p, 'p0', k.col, 'move');
}
