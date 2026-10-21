import type { Candle } from '../../lib/market';
import { styleOf, type Drawing, type DrawingStyle, type LineDash } from '../drawings';

/**
 * Shared pieces of the drawing renderers: the view (time/price ↔ pixels), SVG helpers, text
 * measuring and the hit areas. Pointer events are delegated: every drawing is a `<g data-id>`,
 * its handles carry `data-h`, and the layer listens once on the SVG.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface View {
  W: number;
  H: number;
  /** bar time → x (null: no bars) */
  x(t: number): number | null;
  y(p: number): number | null;
  /** bar time ↔ logical bar index (fractional between bars and beyond the data) */
  logical(t: number): number;
  timeAt(l: number): number;
  xAt(l: number): number | null;
  priceAt(y: number): number | null;
  /** pixels per bar */
  barSpacing: number;
  colors: { text: string; surface: string; grid: string; gain: string; loss: string };
  digits: number;
  pip: number;
  candles: Candle[];
}

export const NS = 'http://www.w3.org/2000/svg';
export type Attrs = Record<string, string | number | undefined>;

export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: SVGElement): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v !== undefined) e.setAttribute(k, String(v));
  }
  parent?.append(e);
  return e;
}

export function dashArray(dash: LineDash | undefined, w: number): string | undefined {
  if (dash === 'dashed') return `${w * 4 + 2} ${w * 3 + 1}`;
  if (dash === 'dotted') return `0.01 ${w * 2.5 + 1.5}`;
  return undefined;
}

// ---------- text ----------
const FONT = 'Vazirmatn Variable, Vazirmatn, Tahoma, sans-serif';
let measureCtx: CanvasRenderingContext2D | null = null;
const widths = new Map<string, number>();
if (typeof document !== 'undefined') document.fonts?.addEventListener?.('loadingdone', () => widths.clear());

export function textWidth(s: string, size: number, weight = 400): number {
  const k = `${size}|${weight}|${s}`;
  let w = widths.get(k);
  if (w === undefined) {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (measureCtx) {
      measureCtx.font = `${weight} ${size}px ${FONT}`;
      w = measureCtx.measureText(s).width;
    } else w = s.length * size * 0.6;
    if (widths.size > 4000) widths.clear();
    widths.set(k, w);
  }
  return w;
}

const RTL = /[֐-ࣿיִ-ﻼ]/;
export const isRtl = (s: string) => RTL.test(s);

export const fmtPrice = (p: number, digits: number) => p.toFixed(digits);
export const fmtNum = (v: number) => String(Math.round(v * 10000) / 10000);

export function fmtDuration(sec: number) {
  const m = Math.round(Math.abs(sec) / 60);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (Math.abs(sec) < 60) return `${Math.round(Math.abs(sec))}s`;
  return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`;
}

/** where the line from a through b leaves the box (b itself when the box is behind) */
export function extendTo(a: Pt, b: Pt, W: number, H: number): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: b.x, y: b.y };
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (W - a.x) / dx);
  if (dx < 0) t = Math.min(t, -a.x / dx);
  if (dy > 0) t = Math.min(t, (H + 50 - a.y) / dy);
  if (dy < 0) t = Math.min(t, (-50 - a.y) / dy);
  if (!Number.isFinite(t) || t < 1) t = 1;
  return { x: a.x + dx * t, y: a.y + dy * t };
}

export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export interface LineOpts {
  color?: string;
  width?: number;
  dash?: LineDash;
  opacity?: number;
  /** grabbable (default: true) */
  hit?: boolean;
  cap?: 'round' | 'butt' | 'square';
}

export interface TextOpts {
  size?: number;
  color?: string;
  weight?: number;
  italic?: boolean;
  /** horizontal anchor of x */
  align?: 'left' | 'center' | 'right';
  /** vertical anchor of y */
  valign?: 'top' | 'middle' | 'bottom';
  bg?: string;
  bgOpacity?: number;
  border?: string;
  pad?: number;
  radius?: number;
  hit?: boolean;
  /** extra class (the note tooltips) */
  cls?: string;
  lineHeight?: number;
  parent?: SVGElement;
}

/** One drawing being drawn: its group, its points on screen and the helpers. */
export class Kit {
  readonly g: SVGGElement;
  readonly col: string;
  readonly sw: number;
  private hitD = '';
  constructor(
    parent: SVGElement,
    readonly d: Drawing,
    readonly pts: Pt[],
    readonly v: View,
    readonly selected: boolean,
    readonly interactive: boolean,
    readonly preview: boolean,
  ) {
    this.g = svgEl('g', interactive ? { 'data-id': d.id } : {}, parent);
    this.col = d.color;
    this.sw = d.width;
  }

  s<K extends keyof DrawingStyle>(key: K): DrawingStyle[K] {
    return styleOf(this.d, key);
  }

  get dash(): LineDash {
    return this.s('dash') ?? 'solid';
  }

  /** a line in the drawing's style (or the given one) */
  line(a: Pt, b: Pt, o: LineOpts = {}, parent: SVGElement = this.g) {
    const w = o.width ?? this.sw;
    const dash = o.dash ?? this.dash;
    svgEl(
      'line',
      {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: o.color ?? this.col,
        'stroke-width': w,
        'stroke-linecap': dash === 'dotted' ? 'round' : (o.cap ?? 'round'),
        'stroke-dasharray': dashArray(dash, w),
        opacity: o.opacity,
      },
      parent,
    );
    if (o.hit !== false) this.hitSeg(a, b);
  }

  /** an open or closed path through the points */
  poly(points: Pt[], o: LineOpts & { close?: boolean; fill?: string; fillOpacity?: number; stroke?: boolean } = {}) {
    if (points.length < 2) return;
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('') + (o.close ? 'Z' : '');
    return this.path(d, o, o.close && !!o.fill);
  }

  path(d: string, o: LineOpts & { fill?: string; fillOpacity?: number; stroke?: boolean } = {}, fillHit = false) {
    const w = o.width ?? this.sw;
    const dash = o.dash ?? this.dash;
    const stroke = o.stroke !== false;
    const el = svgEl(
      'path',
      {
        d,
        fill: o.fill ?? 'none',
        'fill-opacity': o.fill ? o.fillOpacity : undefined,
        stroke: stroke ? (o.color ?? this.col) : 'none',
        'stroke-width': stroke ? w : undefined,
        'stroke-linecap': stroke ? (dash === 'dotted' ? 'round' : (o.cap ?? 'round')) : undefined,
        'stroke-linejoin': stroke ? 'round' : undefined,
        'stroke-dasharray': stroke ? dashArray(dash, w) : undefined,
        opacity: o.opacity,
      },
      this.g,
    );
    if (o.hit !== false && this.interactive) {
      if (fillHit) this.hitFill(el);
      else if (stroke) this.hitPath(d);
    }
    return el;
  }

  /** a filled area (no outline) */
  area(points: Pt[], fill: string, opacity: number, hit = false) {
    if (points.length < 3) return;
    const el = svgEl('polygon', { points: points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), fill, 'fill-opacity': opacity }, this.g);
    if (hit) this.hitFill(el);
    return el;
  }

  /** the background colour and opacity of the drawing, or null when its background is off */
  fill(): { color: string; opacity: number } | null {
    if (!this.s('showFill')) return null;
    return { color: this.s('fill') ?? this.col, opacity: this.s('fillOpacity') ?? 0.15 };
  }

  /** an arrow head at b, pointing from a */
  arrowHead(a: Pt, b: Pt, color = this.col, w = this.sw) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const len = 7 + w * 2.5;
    const spread = Math.PI / 7;
    const p1 = { x: b.x - len * Math.cos(ang - spread), y: b.y - len * Math.sin(ang - spread) };
    const p2 = { x: b.x - len * Math.cos(ang + spread), y: b.y - len * Math.sin(ang + spread) };
    svgEl(
      'path',
      { d: `M${p1.x},${p1.y}L${b.x},${b.y}L${p2.x},${p2.y}`, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      this.g,
    );
  }

  /**
   * Text, one or more lines, optionally in a box. Returns the box on screen.
   * Persian lines are laid out right to left and aligned right in the box.
   */
  text(x: number, y: number, str: string, o: TextOpts = {}) {
    const size = o.size ?? 12;
    const weight = o.weight ?? 400;
    const lines = str.split('\n');
    const lh = o.lineHeight ?? Math.round(size * 1.35);
    const pad = o.bg || o.border ? (o.pad ?? 5) : (o.pad ?? 0);
    const tw = Math.max(1, ...lines.map((l) => textWidth(l, size, weight)));
    const w = tw + pad * 2;
    const h = lines.length * lh + pad * 2 - (lh - size) + 2;
    const left = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const top = o.valign === 'middle' ? y - h / 2 : o.valign === 'bottom' ? y - h : y;
    const parent = o.parent ?? this.g;
    const holder = o.cls ? svgEl('g', { class: o.cls }, parent) : parent;
    if (o.bg || o.border) {
      const r = svgEl(
        'rect',
        {
          x: left,
          y: top,
          width: w,
          height: h,
          rx: o.radius ?? 4,
          fill: o.bg ?? 'none',
          'fill-opacity': o.bg ? o.bgOpacity : undefined,
          stroke: o.border,
          'stroke-width': o.border ? 1 : undefined,
        },
        holder,
      );
      if (o.hit) this.hitFill(r);
    } else if (o.hit) this.hitFill(svgEl('rect', { x: left, y: top, width: w, height: h, fill: 'transparent' }, holder));
    const rtl = lines.some(isRtl);
    lines.forEach((l, i) => {
      const t = svgEl(
        'text',
        {
          x: o.align === 'center' && !rtl ? left + w / 2 : rtl ? left + w - pad : left + pad,
          y: top + pad + size + i * lh - 1,
          'text-anchor': o.align === 'center' && !rtl ? 'middle' : rtl ? 'end' : 'start',
          'font-size': size,
          'font-weight': weight,
          'font-style': o.italic ? 'italic' : undefined,
          fill: o.color ?? this.col,
          class: 't',
        },
        holder,
      );
      t.textContent = l;
    });
    return { x: left, y: top, w, h };
  }

  /** the text style of the drawing's own text (font size, bold, italic, colour) */
  textStyle(): Pick<TextOpts, 'size' | 'weight' | 'italic' | 'color'> {
    return { size: this.s('fontSize') ?? 14, weight: this.s('bold') ? 700 : 400, italic: !!this.s('italic'), color: this.s('textColor') ?? this.col };
  }

  /** The original label: a rounded box with centred lines (positions, measure, horizontal lines). */
  legacyLabel(x: number, y: number, text: string, bg: string, fg = '#fff', anchor: 'start' | 'middle' | 'end' = 'middle') {
    const lines = text.split('\n');
    const w = Math.max(...lines.map((l) => l.length)) * 6.3 + 12;
    const h = lines.length * 15 + 5;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    svgEl('rect', { x: left, y, width: w, height: h, rx: 4, fill: bg }, this.g);
    lines.forEach((l, i) => {
      const t = svgEl('text', { x: left + w / 2, y: y + 14 + i * 15, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: fg, class: 'n' }, this.g);
      t.textContent = l;
    });
    return h;
  }

  /** a handle the user drags (only on the selected drawing) */
  handle(p: Pt, h: string, color = this.col, cursor = 'pointer') {
    if (!this.selected) return;
    svgEl('circle', { cx: p.x, cy: p.y, r: 5.5, fill: '#fff', stroke: color, 'stroke-width': 2, 'pointer-events': 'all', class: 'h', 'data-h': h, cursor }, this.g);
  }

  /** handles on every point */
  pointHandles(points: Pt[] = this.pts) {
    if (!this.selected) return;
    points.forEach((p, i) => this.handle(p, `p${i}`));
  }

  hitSeg(a: Pt, b: Pt) {
    if (this.interactive) this.hitD += `M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }

  hitPath(d: string) {
    if (this.interactive) this.hitD += d;
  }

  hitFill(el: SVGElement) {
    if (!this.interactive) return;
    el.setAttribute('pointer-events', 'all');
    el.setAttribute('cursor', 'move');
  }

  /** the grabbable strokes, as one path under the handles */
  finish() {
    if (this.hitD) {
      const hit = svgEl('path', { d: this.hitD, fill: 'none', stroke: 'transparent', 'stroke-width': 12, 'pointer-events': 'stroke', cursor: 'move' });
      const firstHandle = this.g.querySelector('.h');
      if (firstHandle) this.g.insertBefore(hit, firstHandle);
      else this.g.append(hit);
    }
  }
}
