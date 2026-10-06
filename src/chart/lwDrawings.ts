import type { IChartApi, ISeriesApi, Logical, UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '../lib/market';
import { DEFAULT_COLOR, FIB_LEVELS, TOOL_POINTS, drawingId, type Drawing, type DrawingType, type Point, type ToolId } from './drawings';

/**
 * Drawing tools for the built-in chart: an SVG layer over the main pane. Points snap to bars
 * (and to the bar's open, high, low or close with the magnet). Drawings are kept per symbol;
 * the engine saves them with the pane's layout.
 */

export interface DrawingHost {
  container: HTMLElement;
  /** the SVG goes just before this element (the overlay with orders and positions stays on top) */
  before: HTMLElement;
  chart: IChartApi;
  series: ISeriesApi<'Candlestick'>;
  /** bar times of the candles and of the empty future bars, ascending (UTC seconds) */
  times(): number[];
  candles(): Candle[];
  stepSec(): number;
  digits(): number;
  pip(): number;
  roundPrice(p: number): number;
  colors(): { text: string; surface: string; grid: string; gain: string; loss: string };
  paneHeight(): number;
  plotWidth(): number;
  onChange(all: Record<string, Drawing[]>): void;
}

export interface DrawingUiState {
  tool: ToolId;
  magnet: boolean;
  stay: boolean;
  locked: boolean;
  hidden: boolean;
  count: number;
  selected: Drawing | null;
  canUndo: boolean;
}

export interface DrawingApi {
  ui(): DrawingUiState;
  setTool(t: ToolId): void;
  setMagnet(v: boolean): void;
  setStay(v: boolean): void;
  setLocked(v: boolean): void;
  setHidden(v: boolean): void;
  /** removes this symbol's drawings; returns how many */
  removeAll(): number;
  removeSelected(): void;
  updateSelected(patch: Partial<Pick<Drawing, 'color' | 'width' | 'text' | 'locked'>>): void;
  undo(): void;
  subscribe(fn: () => void): () => void;
}

export interface DrawingLayer extends DrawingApi {
  render(): void;
  setSymbol(symbol: string): void;
  /** the drawings as an image, for chart screenshots */
  image(): Promise<HTMLImageElement | null>;
  destroy(): void;
}

const NS = 'http://www.w3.org/2000/svg';
type Attrs = Record<string, string | number>;
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: SVGElement): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.append(e);
  return e;
}

/** The layer the keyboard (Delete, Ctrl+Z, Escape) acts on: the pane used last. */
let activeLayer: object | null = null;

type Handle = 'p0' | 'p1' | 'p2' | 'c2' | 'c3' | 'entry' | 'stop' | 'target' | 'end';

interface Drag {
  id: string;
  handle: Handle | 'body';
  startLogical: number;
  startPrice: number;
  before: Drawing;
  snapshot: string;
  moved: boolean;
}

const fmtDuration = (sec: number) => {
  const m = Math.round(Math.abs(sec) / 60);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`;
};

export function createDrawingLayer(host: DrawingHost, symbol: string, initial: Record<string, Drawing[]>): DrawingLayer {
  const all: Record<string, Drawing[]> = structuredClone(initial);
  let sym = symbol;
  let tool: ToolId = 'cursor';
  let magnet = false;
  let stay = false;
  let locked = false;
  let hidden = false;
  let selectedId: string | null = null;
  let creating: { type: DrawingType; points: Point[]; downX: number; downY: number; pressed: boolean } | null = null;
  let drag: Drag | null = null;
  const undoStack: { symbol: string; json: string }[] = [];
  const listeners = new Set<() => void>();
  let destroyed = false;

  const list = () => (all[sym] ??= []);
  const notify = () => listeners.forEach((f) => f());
  const ts = () => host.chart.timeScale();

  const svg = svgEl('svg', { class: 'btl-drawings' });
  Object.assign(svg.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    direction: 'ltr',
    fontFamily: 'Vazirmatn Variable, Vazirmatn, Tahoma, sans-serif',
    userSelect: 'none',
    touchAction: 'none',
  });
  host.container.insertBefore(svg, host.before);

  // ---------- coordinates ----------
  function timeToLogical(t: number): number {
    const tt = host.times();
    const n = tt.length;
    if (!n) return NaN;
    const step = host.stepSec();
    if (t <= tt[0]) return (t - tt[0]) / step;
    if (t >= tt[n - 1]) return n - 1 + (t - tt[n - 1]) / step;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (tt[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return tt[lo] === t ? lo : lo + (t - tt[lo]) / (tt[lo + 1] - tt[lo]);
  }
  function logicalToTime(l: number): number {
    const tt = host.times();
    const n = tt.length;
    const step = host.stepSec();
    if (!n) return 0;
    if (l <= 0) return Math.round(tt[0] + l * step);
    if (l >= n - 1) return Math.round(tt[n - 1] + (l - (n - 1)) * step);
    const i = Math.floor(l);
    return Math.round(tt[i] + (l - i) * (tt[i + 1] - tt[i]));
  }
  const X = (t: number) => {
    const l = timeToLogical(t);
    return Number.isFinite(l) ? ts().logicalToCoordinate(l as Logical) : null;
  };
  const Y = (p: number) => host.series.priceToCoordinate(p);
  const local = (e: PointerEvent) => {
    const r = host.container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** pointer → bar time and price (magnet: the bar's nearest open / high / low / close) */
  function pointAt(x: number, y: number): (Point & { logical: number }) | null {
    const l = ts().coordinateToLogical(x);
    const raw = host.series.coordinateToPrice(y);
    if (l === null || raw === null) return null;
    const li = Math.round(l);
    let price = raw as number;
    const c = host.candles()[li];
    if (magnet && c) {
      let best = Infinity;
      for (const v of [c.open, c.high, c.low, c.close]) {
        const vy = Y(v);
        if (vy !== null && Math.abs(vy - y) < best) {
          best = Math.abs(vy - y);
          price = v;
        }
      }
    }
    return { time: logicalToTime(li), price: host.roundPrice(price), logical: li };
  }

  // ---------- changes ----------
  function remember() {
    undoStack.push({ symbol: sym, json: JSON.stringify(list()) });
    if (undoStack.length > 60) undoStack.shift();
  }
  function changed() {
    host.onChange(all);
    render();
    notify();
  }
  const find = (id: string | null) => list().find((d) => d.id === id) ?? null;

  function select(id: string | null) {
    if (selectedId === id) return;
    selectedId = id;
    render();
    notify();
  }

  function finishCreating() {
    if (!creating) return;
    const { type, points } = creating;
    creating = null;
    const c = host.colors();
    const d: Drawing = { id: drawingId(), type, points: points.map((p) => ({ time: p.time, price: p.price })), color: DEFAULT_COLOR[type], width: type === 'text' ? 2 : 2 };
    if (type === 'long' || type === 'short') {
      const entry = points[0];
      const paneH = host.paneHeight();
      const top = host.series.coordinateToPrice(0);
      const bottom = host.series.coordinateToPrice(paneH);
      const range = top !== null && bottom !== null ? Math.abs((top as number) - (bottom as number)) : entry.price * 0.01;
      const risk = host.roundPrice(Math.max(range * 0.08, 10 ** -host.digits()));
      const dir = type === 'long' ? 1 : -1;
      d.stop = host.roundPrice(entry.price - dir * risk);
      d.target = host.roundPrice(entry.price + dir * risk * 2);
      d.points = [entry, { time: logicalToTime(timeToLogical(entry.time) + 25), price: entry.price }];
      d.color = type === 'long' ? c.gain : c.loss;
    }
    if (type === 'text') d.text = 'متن';
    remember();
    list().push(d);
    selectedId = d.id;
    if (!stay) tool = 'cursor';
    changed();
  }

  function cancel() {
    if (creating) creating = null;
    else if (tool !== 'cursor') tool = 'cursor';
    else selectedId = null;
    render();
    notify();
  }

  // ---------- creating ----------
  function onCaptureDown(e: PointerEvent) {
    if (e.button !== 0 || tool === 'cursor') return;
    e.preventDefault();
    e.stopPropagation();
    activeLayer = api;
    const { x, y } = local(e);
    const pt = pointAt(x, y);
    if (!pt) return;
    const p = { time: pt.time, price: pt.price };
    const type = tool as DrawingType;
    if (!creating) {
      creating = { type, points: TOOL_POINTS[type] === 1 ? [p] : [p, { ...p }], downX: x, downY: y, pressed: true };
      if (TOOL_POINTS[type] === 1) finishCreating();
      else render();
    } else {
      creating.points[creating.points.length - 1] = p;
      creating.downX = x;
      creating.downY = y;
      creating.pressed = true;
      fixPoint();
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!creating?.pressed) return;
      creating.pressed = false;
      const q = local(ev);
      // press, drag, release: the release sets the next point
      if (Math.hypot(q.x - creating.downX, q.y - creating.downY) > 5) {
        const r = pointAt(q.x, q.y);
        if (r) creating.points[creating.points.length - 1] = { time: r.time, price: r.price };
        fixPoint();
      }
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /** the moving point is placed: finish, or start the next one */
  function fixPoint() {
    if (!creating) return;
    if (creating.points.length >= TOOL_POINTS[creating.type]) finishCreating();
    else {
      creating.points.push({ ...creating.points[creating.points.length - 1] });
      render();
    }
  }

  function onCaptureMove(e: PointerEvent) {
    const { x, y } = local(e);
    const pt = pointAt(x, y);
    if (!pt) return;
    const time = logicalToTime(pt.logical);
    // keep the crosshair following the pointer while a tool is active
    const tt = host.times();
    if (tt.includes(time)) host.chart.setCrosshairPosition(pt.price, time as UTCTimestamp, host.series);
    if (creating) {
      creating.points[creating.points.length - 1] = { time: pt.time, price: pt.price };
      render();
    }
  }

  // ---------- moving ----------
  function startDrag(e: PointerEvent, d: Drawing, handle: Handle | 'body') {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    activeLayer = api;
    select(d.id);
    if (locked || d.locked) return;
    const { x, y } = local(e);
    const l = ts().coordinateToLogical(x);
    const p = host.series.coordinateToPrice(y);
    if (l === null || p === null) return;
    drag = { id: d.id, handle, startLogical: Math.round(l), startPrice: p as number, before: structuredClone(d), snapshot: JSON.stringify(list()), moved: false };
    const move = (ev: PointerEvent) => onDrag(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const dr = drag;
      drag = null;
      if (dr?.moved) {
        undoStack.push({ symbol: sym, json: dr.snapshot });
        changed();
      } else render();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function onDrag(e: PointerEvent) {
    if (!drag) return;
    const d = find(drag.id);
    if (!d) return;
    const { x, y } = local(e);
    const pt = pointAt(x, y);
    if (!pt) return;
    const b = drag.before;
    const shift = (p: Point, dl: number, dp: number): Point => ({ time: logicalToTime(timeToLogical(p.time) + dl), price: host.roundPrice(p.price + dp) });
    const P = { time: pt.time, price: pt.price };
    drag.moved = true;
    switch (drag.handle) {
      case 'body': {
        const dl = pt.logical - drag.startLogical;
        const raw = host.series.coordinateToPrice(y);
        const dp = raw === null ? 0 : (raw as number) - drag.startPrice;
        d.points = b.points.map((p) => shift(p, d.type === 'hline' || d.type === 'hray' ? (d.type === 'hray' ? dl : 0) : dl, d.type === 'vline' ? 0 : dp));
        if (b.stop !== undefined) d.stop = host.roundPrice(b.stop + dp);
        if (b.target !== undefined) d.target = host.roundPrice(b.target + dp);
        break;
      }
      case 'p0':
      case 'p1': {
        const i = drag.handle === 'p0' ? 0 : 1;
        d.points = b.points.map((p, j) => (j === i ? (d.type === 'vline' ? { time: P.time, price: p.price } : P) : p));
        if (d.type === 'channel') {
          // keep the channel's width: the parallel line moves with the first one
          const off = channelOffset(b);
          d.points[2] = { time: b.points[2].time, price: host.roundPrice(priceOnLine(d, timeToLogical(b.points[2].time)) + off) };
        }
        break;
      }
      case 'p2':
        d.points = [b.points[0], b.points[1], P];
        break;
      case 'c2': // rectangle corner (start time, end price)
        d.points = [
          { time: P.time, price: b.points[0].price },
          { time: b.points[1].time, price: P.price },
        ];
        break;
      case 'c3': // rectangle corner (end time, start price)
        d.points = [
          { time: b.points[0].time, price: P.price },
          { time: P.time, price: b.points[1].price },
        ];
        break;
      case 'entry': {
        const dir = d.type === 'long' ? 1 : -1;
        const tick = 10 ** -host.digits();
        let price = P.price;
        // the entry stays between the stop and the target
        if (dir * (price - (b.stop ?? price)) <= 0) price = (b.stop ?? price) + dir * tick;
        if (dir * ((b.target ?? price) - price) <= 0) price = (b.target ?? price) - dir * tick;
        d.points = [
          { time: P.time, price: host.roundPrice(price) },
          { time: b.points[1].time, price: host.roundPrice(price) },
        ];
        break;
      }
      case 'stop': {
        const dir = d.type === 'long' ? 1 : -1;
        const e0 = b.points[0].price;
        d.stop = dir * (e0 - P.price) > 0 ? P.price : host.roundPrice(e0 - dir * 10 ** -host.digits());
        break;
      }
      case 'target': {
        const dir = d.type === 'long' ? 1 : -1;
        const e0 = b.points[0].price;
        d.target = dir * (P.price - e0) > 0 ? P.price : host.roundPrice(e0 + dir * 10 ** -host.digits());
        break;
      }
      case 'end':
        if (timeToLogical(P.time) > timeToLogical(b.points[0].time)) d.points = [b.points[0], { time: P.time, price: b.points[0].price }];
        break;
    }
    render();
  }

  /** the first line of a channel at a logical index */
  function priceOnLine(d: Drawing, l: number) {
    const l0 = timeToLogical(d.points[0].time);
    const l1 = timeToLogical(d.points[1].time);
    if (l1 === l0) return d.points[0].price;
    return d.points[0].price + ((d.points[1].price - d.points[0].price) * (l - l0)) / (l1 - l0);
  }
  const channelOffset = (d: Drawing) => (d.points[2] ? d.points[2].price - priceOnLine(d, timeToLogical(d.points[2].time)) : 0);

  // ---------- rendering ----------
  function label(parent: SVGElement, x: number, y: number, text: string, bg: string, fg = '#fff', anchor: 'start' | 'middle' | 'end' = 'middle') {
    const lines = text.split('\n');
    const w = Math.max(...lines.map((l) => l.length)) * 6.3 + 12;
    const h = lines.length * 15 + 5;
    const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    svgEl('rect', { x: left, y, width: w, height: h, rx: 4, fill: bg }, parent);
    lines.forEach((l, i) => {
      const t = svgEl(
        'text',
        { x: left + w / 2, y: y + 14 + i * 15, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: fg, style: 'font-variant-numeric:tabular-nums' },
        parent,
      );
      t.textContent = l;
    });
    return h;
  }

  function hitLine(parent: SVGElement, x1: number, y1: number, x2: number, y2: number, d: Drawing) {
    const hit = svgEl('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 12, 'pointer-events': 'stroke', style: 'cursor:move' }, parent);
    hit.addEventListener('pointerdown', (e) => startDrag(e, d, 'body'));
  }
  function hitArea(el: SVGElement, d: Drawing) {
    el.setAttribute('pointer-events', 'all');
    el.setAttribute('style', 'cursor:move');
    el.addEventListener('pointerdown', (e) => startDrag(e as PointerEvent, d, 'body'));
  }
  function handle(parent: SVGElement, x: number, y: number, d: Drawing, h: Handle, color: string, cursor = 'pointer') {
    const c = svgEl('circle', { cx: x, cy: y, r: 5.5, fill: '#fff', stroke: color, 'stroke-width': 2, 'pointer-events': 'all', class: 'h', style: `cursor:${cursor}` }, parent);
    c.addEventListener('pointerdown', (e) => startDrag(e, d, h));
  }

  /** where a line from a through b leaves the box */
  function extend(ax: number, ay: number, bx: number, by: number, W: number, H: number) {
    const dx = bx - ax;
    const dy = by - ay;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: bx, y: by };
    let t = Infinity;
    if (dx > 0) t = Math.min(t, (W - ax) / dx);
    if (dx < 0) t = Math.min(t, -ax / dx);
    if (dy > 0) t = Math.min(t, (H + 50 - ay) / dy);
    if (dy < 0) t = Math.min(t, (-50 - ay) / dy);
    if (!Number.isFinite(t) || t < 1) t = 1;
    return { x: ax + dx * t, y: ay + dy * t };
  }

  function drawOne(parent: SVGElement, d: Drawing, selected: boolean, interactive: boolean, W: number, H: number) {
    const g = svgEl('g', {}, parent);
    const P = d.points.map((p) => ({ x: X(p.time), y: Y(p.price) }));
    if (P.some((p) => p.x === null || p.y === null)) return;
    const pts = P as { x: number; y: number }[];
    const col = d.color;
    const sw = d.width;
    const c = host.colors();
    const digits = host.digits();
    const stroke = { stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round' };
    switch (d.type) {
      case 'trend':
      case 'ray': {
        const end = d.type === 'ray' ? extend(pts[0].x, pts[0].y, pts[1].x, pts[1].y, W, H) : pts[1];
        svgEl('line', { x1: pts[0].x, y1: pts[0].y, x2: end.x, y2: end.y, ...stroke }, g);
        if (interactive) hitLine(g, pts[0].x, pts[0].y, end.x, end.y, d);
        if (selected) {
          handle(g, pts[0].x, pts[0].y, d, 'p0', col);
          handle(g, pts[1].x, pts[1].y, d, 'p1', col);
        }
        break;
      }
      case 'hline':
      case 'hray': {
        const x0 = d.type === 'hline' ? 0 : pts[0].x;
        svgEl('line', { x1: x0, y1: pts[0].y, x2: W, y2: pts[0].y, ...stroke }, g);
        if (interactive) hitLine(g, x0, pts[0].y, W, pts[0].y, d);
        label(g, W - 4, pts[0].y - 18, d.points[0].price.toFixed(digits), col, '#fff', 'end');
        if (selected) handle(g, pts[0].x, pts[0].y, d, 'p0', col, 'ns-resize');
        break;
      }
      case 'vline': {
        svgEl('line', { x1: pts[0].x, y1: 0, x2: pts[0].x, y2: H, ...stroke }, g);
        if (interactive) hitLine(g, pts[0].x, 0, pts[0].x, H, d);
        if (selected) handle(g, pts[0].x, pts[0].y, d, 'p0', col, 'ew-resize');
        break;
      }
      case 'channel': {
        const off = pts.length > 2 ? channelOffset(d) : 0;
        const y2a = Y(d.points[0].price + off);
        const y2b = Y(d.points[1].price + off);
        if (y2a === null || y2b === null) break;
        svgEl('polygon', { points: `${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[1].x},${y2b} ${pts[0].x},${y2a}`, fill: col, 'fill-opacity': 0.1 }, g);
        svgEl('line', { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y, ...stroke }, g);
        svgEl('line', { x1: pts[0].x, y1: y2a, x2: pts[1].x, y2: y2b, ...stroke }, g);
        svgEl(
          'line',
          { x1: pts[0].x, y1: (pts[0].y + y2a) / 2, x2: pts[1].x, y2: (pts[1].y + y2b) / 2, stroke: col, 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.7 },
          g,
        );
        if (interactive) {
          hitLine(g, pts[0].x, pts[0].y, pts[1].x, pts[1].y, d);
          hitLine(g, pts[0].x, y2a, pts[1].x, y2b, d);
        }
        if (selected) {
          handle(g, pts[0].x, pts[0].y, d, 'p0', col);
          handle(g, pts[1].x, pts[1].y, d, 'p1', col);
          if (pts[2]) handle(g, pts[2].x, pts[2].y, d, 'p2', col);
        }
        break;
      }
      case 'rect': {
        const x = Math.min(pts[0].x, pts[1].x);
        const y = Math.min(pts[0].y, pts[1].y);
        const r = svgEl('rect', { x, y, width: Math.abs(pts[1].x - pts[0].x), height: Math.abs(pts[1].y - pts[0].y), fill: col, 'fill-opacity': 0.15, ...stroke }, g);
        if (interactive) hitArea(r, d);
        if (selected) {
          handle(g, pts[0].x, pts[0].y, d, 'p0', col);
          handle(g, pts[1].x, pts[1].y, d, 'p1', col);
          handle(g, pts[0].x, pts[1].y, d, 'c2', col);
          handle(g, pts[1].x, pts[0].y, d, 'c3', col);
        }
        break;
      }
      case 'fib': {
        const left = Math.min(pts[0].x, pts[1].x);
        const right = Math.max(pts[0].x, pts[1].x);
        const p0 = d.points[0].price;
        const p1 = d.points[1].price;
        let prevY: number | null = null;
        for (const { level, color } of FIB_LEVELS) {
          const price = p1 + (p0 - p1) * level;
          const ly = Y(price);
          if (ly === null) continue;
          if (prevY !== null) svgEl('rect', { x: left, y: Math.min(prevY, ly), width: right - left, height: Math.abs(ly - prevY), fill: color, 'fill-opacity': 0.08 }, g);
          svgEl('line', { x1: left, y1: ly, x2: right, y2: ly, stroke: color, 'stroke-width': 1 }, g);
          // labels left of the levels, or inside them when the drawing starts at the chart's left edge
          const inside = left < 110;
          const t = svgEl(
            'text',
            { x: inside ? left + 4 : left - 6, y: ly - 3, 'text-anchor': inside ? 'start' : 'end', 'font-size': 11, fill: color, style: 'font-variant-numeric:tabular-nums' },
            g,
          );
          t.textContent = `${level} (${price.toFixed(digits)})`;
          prevY = ly;
        }
        svgEl('line', { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y, stroke: col, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, g);
        if (interactive) {
          const top = Math.min(pts[0].y, pts[1].y);
          hitArea(svgEl('rect', { x: left, y: top, width: Math.max(4, right - left), height: Math.max(4, Math.abs(pts[1].y - pts[0].y)), fill: 'transparent' }, g), d);
        }
        if (selected) {
          handle(g, pts[0].x, pts[0].y, d, 'p0', col);
          handle(g, pts[1].x, pts[1].y, d, 'p1', col);
        }
        break;
      }
      case 'long':
      case 'short': {
        const dir = d.type === 'long' ? 1 : -1;
        const ye = pts[0].y;
        const ys = Y(d.stop ?? d.points[0].price);
        const yt = Y(d.target ?? d.points[0].price);
        if (ys === null || yt === null) break;
        const x0 = Math.min(pts[0].x, pts[1].x);
        const x1 = Math.max(pts[0].x, pts[1].x, x0 + 8);
        const entry = d.points[0].price;
        const pip = host.pip();
        const tgt = ((d.target ?? entry) - entry) * dir;
        const stp = (entry - (d.stop ?? entry)) * dir;
        const profit = svgEl('rect', { x: x0, y: Math.min(ye, yt), width: x1 - x0, height: Math.abs(yt - ye), fill: c.gain, 'fill-opacity': 0.2 }, g);
        const loss = svgEl('rect', { x: x0, y: Math.min(ye, ys), width: x1 - x0, height: Math.abs(ys - ye), fill: c.loss, 'fill-opacity': 0.2 }, g);
        svgEl('line', { x1: x0, y1: yt, x2: x1, y2: yt, stroke: c.gain, 'stroke-width': 1.5 }, g);
        svgEl('line', { x1: x0, y1: ys, x2: x1, y2: ys, stroke: c.loss, 'stroke-width': 1.5 }, g);
        svgEl('line', { x1: x0, y1: ye, x2: x1, y2: ye, stroke: c.text, 'stroke-width': 1.5, opacity: 0.8 }, g);
        if (interactive) {
          hitArea(profit, d);
          hitArea(loss, d);
        }
        const mid = (x0 + x1) / 2;
        const pct = (v: number) => ((v / entry) * 100).toFixed(2);
        label(
          g,
          mid,
          dir > 0 ? Math.min(yt, ye) - 22 : Math.max(yt, ye) + 3,
          `Target: ${(d.target ?? entry).toFixed(digits)} (${pct(tgt)}%) ${(tgt / pip).toFixed(1)} pips`,
          c.gain,
        );
        label(g, mid, dir > 0 ? Math.max(ys, ye) + 3 : Math.min(ys, ye) - 22, `Stop: ${(d.stop ?? entry).toFixed(digits)} (${pct(stp)}%) ${(stp / pip).toFixed(1)} pips`, c.loss);
        label(g, mid, ye - 10, `R:R ${stp > 0 ? (tgt / stp).toFixed(2) : '—'}`, c.surface, c.text);
        if (selected) {
          handle(g, x0, yt, d, 'target', c.gain, 'ns-resize');
          handle(g, x0, ys, d, 'stop', c.loss, 'ns-resize');
          handle(g, x0, ye, d, 'entry', c.text, 'move');
          handle(g, x1, ye, d, 'end', c.text, 'ew-resize');
        }
        break;
      }
      case 'measure': {
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
        const bars = Math.round(timeToLogical(d.points[1].time) - timeToLogical(d.points[0].time));
        label(
          g,
          mx,
          up ? y - 40 : y + h + 4,
          `${diff >= 0 ? '+' : ''}${diff.toFixed(digits)} (${((diff / d.points[0].price) * 100).toFixed(2)}%) ${(diff / host.pip()).toFixed(1)} pips\n${bars} bars, ${fmtDuration(d.points[1].time - d.points[0].time)}`,
          mc,
        );
        if (interactive) hitArea(box, d);
        if (selected) {
          handle(g, pts[0].x, pts[0].y, d, 'p0', mc);
          handle(g, pts[1].x, pts[1].y, d, 'p1', mc);
        }
        break;
      }
      case 'text': {
        const size = [12, 14, 18, 24][Math.max(0, Math.min(3, sw - 1))];
        const t = svgEl('text', { x: pts[0].x, y: pts[0].y, 'font-size': size, 'font-weight': 600, fill: col, style: 'unicode-bidi:plaintext' }, g);
        t.textContent = d.text || 'متن';
        const w = (d.text || 'متن').length * size * 0.6 + 6;
        const hit = svgEl('rect', { x: pts[0].x - 3, y: pts[0].y - size, width: w, height: size + 6, fill: 'transparent' }, g);
        if (interactive) hitArea(hit, d);
        if (selected) svgEl('rect', { x: pts[0].x - 3, y: pts[0].y - size, width: w, height: size + 6, fill: 'none', stroke: col, 'stroke-dasharray': '3 3', class: 'h' }, g);
        break;
      }
    }
  }

  function render() {
    if (destroyed) return;
    const W = host.plotWidth();
    const H = host.paneHeight();
    svg.setAttribute('width', String(host.container.clientWidth));
    svg.setAttribute('height', String(H));
    svg.replaceChildren();
    const defs = svgEl('defs', {}, svg);
    const clip = svgEl('clipPath', { id: `clip-${clipId}` }, defs);
    svgEl('rect', { x: 0, y: 0, width: W, height: H }, clip);
    const g = svgEl('g', { 'clip-path': `url(#clip-${clipId})` }, svg);
    if (!hidden) for (const d of list()) drawOne(g, d, d.id === selectedId && tool === 'cursor', tool === 'cursor', W, H);
    if (creating) {
      const preview: Drawing = { id: 'new', type: creating.type, points: creating.points, color: DEFAULT_COLOR[creating.type], width: 2 };
      if (creating.type === 'channel' && creating.points.length === 2) preview.type = 'trend';
      drawOne(g, preview, false, false, W, H);
    }
    if (tool !== 'cursor') {
      const cap = svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent', 'pointer-events': 'all', style: 'cursor:crosshair' }, svg);
      cap.addEventListener('pointerdown', onCaptureDown);
      cap.addEventListener('pointermove', onCaptureMove);
      cap.addEventListener('pointerleave', () => host.chart.clearCrosshairPosition());
    }
  }
  const clipId = Math.random().toString(36).slice(2, 8);

  // ---------- page events ----------
  const onContainerDown = (e: PointerEvent) => {
    activeLayer = api;
    if (!svg.contains(e.target as Node) && selectedId && !drag) select(null);
  };
  host.container.addEventListener('pointerdown', onContainerDown, true);
  const onKey = (e: KeyboardEvent) => {
    if (activeLayer !== api) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      api.removeSelected();
    } else if (e.key === 'Escape' && (creating || tool !== 'cursor' || selectedId)) {
      cancel();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && undoStack.length) {
      e.preventDefault();
      api.undo();
    }
  };
  window.addEventListener('keydown', onKey);

  const api: DrawingLayer = {
    ui: () => ({ tool, magnet, stay, locked, hidden, count: list().length, selected: find(selectedId), canUndo: undoStack.some((u) => u.symbol === sym) }),
    setTool(t) {
      tool = t;
      creating = null;
      if (t !== 'cursor') {
        selectedId = null;
        hidden = false;
      }
      activeLayer = api;
      render();
      notify();
    },
    setMagnet(v) {
      magnet = v;
      notify();
    },
    setStay(v) {
      stay = v;
      notify();
    },
    setLocked(v) {
      locked = v;
      notify();
    },
    setHidden(v) {
      hidden = v;
      if (v) selectedId = null;
      render();
      notify();
    },
    removeAll() {
      const n = list().length;
      if (!n) return 0;
      remember();
      all[sym] = [];
      selectedId = null;
      changed();
      return n;
    },
    removeSelected() {
      if (!selectedId) return;
      remember();
      all[sym] = list().filter((d) => d.id !== selectedId);
      selectedId = null;
      changed();
    },
    updateSelected(patch) {
      const d = find(selectedId);
      if (!d) return;
      remember();
      Object.assign(d, patch);
      changed();
    },
    undo() {
      for (let i = undoStack.length - 1; i >= 0; i--) {
        if (undoStack[i].symbol !== sym) continue;
        const [u] = undoStack.splice(i, 1);
        all[sym] = JSON.parse(u.json) as Drawing[];
        if (!find(selectedId)) selectedId = null;
        changed();
        return;
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    render,
    setSymbol(s) {
      if (s === sym) return;
      sym = s;
      selectedId = null;
      creating = null;
      render();
      notify();
    },
    async image() {
      if (hidden || !list().length) return null;
      const copy = svg.cloneNode(true) as SVGSVGElement;
      copy.querySelectorAll('.h').forEach((n) => n.remove());
      copy.setAttribute('xmlns', NS);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    },
    destroy() {
      destroyed = true;
      window.removeEventListener('keydown', onKey);
      host.container.removeEventListener('pointerdown', onContainerDown, true);
      if (activeLayer === api) activeLayer = null;
      svg.remove();
      listeners.clear();
    },
  };
  render();
  return api;
}
