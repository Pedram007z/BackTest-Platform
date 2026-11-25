import type { IChartApi, IPrimitivePaneRenderer, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, Logical, SeriesAttachedParameter, SeriesType, Time } from 'lightweight-charts';
import type { BoxOut, LineOut, ShapeOut } from '../pine/core';
import type { RunOk } from '../pine/run';

/**
 * Draws a Pine script's fills (between two plots or hlines), lines (line.new) and boxes (box.new) on a
 * lightweight-charts pane, as a series primitive: x positions are bar indexes (logical indexes of the
 * chart, so drawings may reach past the last candle), y positions prices of the series it is attached to.
 */

type Target = Parameters<IPrimitivePaneRenderer['draw']>[0];

export interface PineFill {
  /** the two edges by the script's bar index (they may run past the last candle) */
  a: ArrayLike<number>;
  b: ArrayLike<number>;
  color: string | null;
  colors?: (string | null)[];
}

export interface PineDrawModel {
  /** the chart's logical index of the script's bar 0 */
  offset: number;
  fills: PineFill[];
  lines: LineOut[];
  boxes: BoxOut[];
}

export const emptyDrawModel = (): PineDrawModel => ({ offset: 0, fills: [], lines: [], boxes: [] });

const TEXT_PX: Record<string, number> = { tiny: 9, small: 10, normal: 12, large: 15, huge: 20, auto: 11 };

function dash(ctx: CanvasRenderingContext2D, style: string, w: number) {
  ctx.setLineDash(style === 'dotted' ? [w, 2 * w + 1] : style === 'dashed' ? [4 * w, 3 * w] : []);
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, fromX: number, fromY: number, w: number) {
  const ang = Math.atan2(y - fromY, x - fromX);
  const s = 6 + w * 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * Math.cos(ang - 0.45), y - s * Math.sin(ang - 0.45));
  ctx.lineTo(x - s * Math.cos(ang + 0.45), y - s * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}

export class PineDrawings implements ISeriesPrimitive<Time> {
  private chart: IChartApi | null = null;
  private series: ISeriesApi<SeriesType> | null = null;
  private request: (() => void) | null = null;
  private model: PineDrawModel = emptyDrawModel();
  private readonly back: IPrimitivePaneView;
  private readonly front: IPrimitivePaneView;

  constructor() {
    this.back = { zOrder: () => 'bottom', renderer: () => ({ draw: (t: Target) => this.drawBack(t) }) };
    this.front = { zOrder: () => 'normal', renderer: () => ({ draw: (t: Target) => this.drawFront(t) }) };
  }

  attached(p: SeriesAttachedParameter<Time>) {
    this.chart = p.chart as IChartApi;
    this.series = p.series as ISeriesApi<SeriesType>;
    this.request = p.requestUpdate;
  }

  detached() {
    this.chart = null;
    this.series = null;
    this.request = null;
  }

  paneViews() {
    return [this.back, this.front];
  }

  set(model: PineDrawModel) {
    this.model = model;
    this.request?.();
  }

  private xy() {
    const chart = this.chart,
      series = this.series;
    if (!chart || !series) return null;
    const ts = chart.timeScale();
    const off = this.model.offset;
    const X = (i: number): number | null => ts.logicalToCoordinate((i + off) as Logical);
    const Y = (p: number): number | null => series.priceToCoordinate(p);
    const vr = ts.getVisibleLogicalRange();
    const from = vr ? Math.floor(vr.from) - off - 2 : 0;
    const to = vr ? Math.ceil(vr.to) - off + 2 : Infinity;
    return { X, Y, from, to };
  }

  private drawBack(target: Target) {
    const m = this.model;
    if (!m.fills.length && !m.boxes.length) return;
    const c = this.xy();
    if (!c) return;
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      // fills: one band per bar step where both edges have values
      for (const f of m.fills) {
        const len = Math.min(f.a.length, f.b.length);
        const lo = Math.max(0, c.from);
        const hi = Math.min(len - 2, c.to);
        for (let i = lo; i <= hi; i++) {
          const a0 = f.a[i],
            a1 = f.a[i + 1],
            b0 = f.b[i],
            b1 = f.b[i + 1];
          if (!(a0 === a0 && a1 === a1 && b0 === b0 && b1 === b1)) continue;
          const col = f.colors ? (f.colors[i + 1] ?? f.colors[i]) : f.color;
          if (!col) continue;
          const x0 = c.X(i),
            x1 = c.X(i + 1),
            ya0 = c.Y(a0),
            ya1 = c.Y(a1),
            yb0 = c.Y(b0),
            yb1 = c.Y(b1);
          if (x0 === null || x1 === null || ya0 === null || ya1 === null || yb0 === null || yb1 === null) continue;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(x0, ya0);
          ctx.lineTo(x1, ya1);
          ctx.lineTo(x1, yb1);
          ctx.lineTo(x0, yb0);
          ctx.closePath();
          ctx.fill();
        }
      }
      // box backgrounds and borders
      for (const b of m.boxes) {
        const r = this.boxRect(b, c, mediaSize.width);
        if (!r) continue;
        if (b.bg) {
          ctx.fillStyle = b.bg;
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
        if (b.border && b.borderWidth > 0) {
          ctx.strokeStyle = b.border;
          ctx.lineWidth = b.borderWidth;
          dash(ctx, b.borderStyle, b.borderWidth);
          ctx.strokeRect(r.x, r.y, r.w, r.h);
          ctx.setLineDash([]);
        }
      }
    });
  }

  private boxRect(b: BoxOut, c: NonNullable<ReturnType<PineDrawings['xy']>>, width: number) {
    const l = Math.min(b.left, b.right),
      r = Math.max(b.left, b.right);
    if (b.extend !== 'right' && b.extend !== 'both' && r < c.from) return null;
    if (b.extend !== 'left' && b.extend !== 'both' && l > c.to) return null;
    let x1 = c.X(l),
      x2 = c.X(r);
    const y1 = c.Y(Math.max(b.top, b.bottom)),
      y2 = c.Y(Math.min(b.top, b.bottom));
    if (y1 === null || y2 === null) return null;
    if (b.extend === 'left' || b.extend === 'both') x1 = 0;
    if (b.extend === 'right' || b.extend === 'both') x2 = width;
    if (x1 === null || x2 === null) return null;
    return { x: x1, y: y1, w: Math.max(1, x2 - x1), h: Math.max(1, y2 - y1) };
  }

  private drawFront(target: Target) {
    const m = this.model;
    if (!m.lines.length && !m.boxes.some((b) => b.text)) return;
    const c = this.xy();
    if (!c) return;
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const W = mediaSize.width;
      for (const l of m.lines) {
        const left = Math.min(l.x1, l.x2),
          right = Math.max(l.x1, l.x2);
        const extL = l.extend === 'left' || l.extend === 'both',
          extR = l.extend === 'right' || l.extend === 'both';
        if (!extR && right < c.from) continue;
        if (!extL && left > c.to) continue;
        let x1 = c.X(l.x1),
          x2 = c.X(l.x2);
        let y1 = c.Y(l.y1),
          y2 = c.Y(l.y2);
        if (x1 === null || x2 === null || y1 === null || y2 === null) continue;
        // extended: carry the line to the pane's edge in its own direction
        if (extL || extR) {
          const dx = x2 - x1,
            dy = y2 - y1;
          if (Math.abs(dx) < 1e-9) {
            if (extL || extR) {
              y1 = extL ? 0 : y1;
              y2 = extR ? mediaSize.height : y2;
            }
          } else {
            const k = dy / dx;
            const leftPt = x1 < x2 ? 'p1' : 'p2';
            if (extL) {
              if (leftPt === 'p1') {
                y1 = y1 - k * x1;
                x1 = 0;
              } else {
                y2 = y2 - k * x2;
                x2 = 0;
              }
            }
            if (extR) {
              if (leftPt === 'p1') {
                y2 = y2 + k * (W - x2);
                x2 = W;
              } else {
                y1 = y1 + k * (W - x1);
                x1 = W;
              }
            }
          }
        }
        ctx.strokeStyle = l.color;
        ctx.fillStyle = l.color;
        ctx.lineWidth = l.width;
        dash(ctx, l.style, l.width);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (l.style === 'arrow_right' || l.style === 'arrow_both') arrowHead(ctx, x2, y2, x1, y1, l.width);
        if (l.style === 'arrow_left' || l.style === 'arrow_both') arrowHead(ctx, x1, y1, x2, y2, l.width);
      }
      // box texts, centred and clipped to the box
      for (const b of m.boxes) {
        if (!b.text) continue;
        const r = this.boxRect(b, c, W);
        if (!r) continue;
        const px = TEXT_PX[b.textSize] ?? 11;
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        ctx.font = `${px}px Vazirmatn Variable, Vazirmatn, Tahoma, sans-serif`;
        ctx.fillStyle = b.textColor ?? '#d1d4dc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.text, r.x + r.w / 2, r.y + r.h / 2);
        ctx.restore();
      }
    });
  }
}

/** A plot's values moved by its offset, by the script's bar index (positive offsets reach past the last bar). */
export function shifted(values: ArrayLike<number>, offset: number): Float64Array {
  const n = values.length;
  const out = new Float64Array(n + Math.max(0, offset)).fill(NaN);
  for (let i = 0; i < n; i++) {
    const j = i + offset;
    if (j >= 0 && j < out.length) out[j] = values[i];
  }
  return out;
}

/** A run's fills, lines and boxes for the drawing primitive; `offset` is the chart index of the script's first bar. */
export function drawModel(r: RunOk, offset: number): PineDrawModel {
  const byId = new Map(r.plots.map((p) => [p.id, p]));
  const n = r.bars.time.length;
  const edge = (id: number) => {
    const p = byId.get(id);
    if (!p) return null;
    return p.kind === 'hline' ? new Float64Array(n).fill(p.values[0]) : shifted(p.values, p.offset);
  };
  const fills: PineDrawModel['fills'] = [];
  for (const f of r.fills) {
    const a = edge(f.a),
      b = edge(f.b);
    if (!f.display || !a || !b) continue;
    // the colours move with the plots they fill between
    const off = byId.get(f.a)?.kind === 'plot' ? byId.get(f.a)!.offset : 0;
    const colors = f.colors && off ? Array.from({ length: f.colors.length + Math.max(0, off) }, (_, j) => f.colors![j - off] ?? null) : f.colors;
    fills.push({ a, b, color: f.color, colors });
  }
  return { offset, fills, lines: r.lines, boxes: r.boxes };
}

const transparent = (c: string | null | undefined) => !c || (c.length >= 9 && c.slice(7, 9) === '00');

/**
 * How a plotshape / label shows as a chart marker: a label without a background is its text alone (a tiny
 * mark in the text's colour), otherwise the shape in its colour.
 */
export function markerLook(s: ShapeOut): { color: string | null; size?: number } {
  if (s.kind === 'label' && transparent(s.color)) return { color: s.textColor ?? s.color, size: 0.05 };
  return { color: s.color };
}

const CLEAR = 'rgba(0,0,0,0)';

/**
 * lightweight-charts joins a line across whitespace points; Pine's `linebr` styles leave a gap there.
 * A segment takes the colour of the point it starts from, so the last point before each gap is made
 * transparent (and, for steps, the first point after it, which draws the step up or down).
 */
export function hideGapJoins(data: ({ value?: number } & Record<string, unknown>)[], kind: 'line' | 'step' | 'area') {
  const has = (k: number) => k >= 0 && k < data.length && typeof data[k].value === 'number';
  for (let k = 0; k < data.length; k++) {
    if (!has(k)) continue;
    const beforeGap = k + 1 < data.length && !has(k + 1);
    const afterGap = kind === 'step' && k > 0 && !has(k - 1);
    if (!beforeGap && !afterGap) continue;
    if (kind === 'area') Object.assign(data[k], { lineColor: CLEAR, topColor: CLEAR, bottomColor: CLEAR });
    else data[k].color = CLEAR;
  }
}
