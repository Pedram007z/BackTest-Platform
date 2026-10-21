import type { IChartApi, ISeriesApi, Logical, UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '../lib/market';
import { drawDrawing, type View } from './draw';
import { NS, svgEl } from './draw/kit';
import { TOOL_SPECS, drawingId, newProps, saveDefault, tfGroupOf, type Drawing, type DrawingType, type Point, type TfGroup, type ToolId } from './drawings';

/**
 * Drawing tools for the built-in chart: an SVG layer over the main pane. Points snap to bars
 * (and to the bar's open, high, low or close with the magnet). Drawings are kept per symbol;
 * the engine saves them with the pane's layout. The renderers live in ./draw.
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
  canRedo: boolean;
  /** the drawing whose settings dialog is open */
  settings: string | null;
  /** the chart's timeframe group (drawings can be hidden per group) */
  tfGroup: TfGroup;
  digits: number;
}

export type Reorder = 'front' | 'back' | 'forward' | 'backward';
type Patch = Partial<Omit<Drawing, 'id' | 'type'>>;

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
  updateSelected(patch: Patch): void;
  undo(): void;
  redo(): void;
  subscribe(fn: () => void): () => void;
  /** this symbol's drawings, bottom to top */
  list(): Drawing[];
  select(id: string | null): void;
  update(id: string, patch: Patch): void;
  remove(id: string): void;
  /** a copy next to the drawing, selected */
  clone(id?: string): void;
  reorder(where: Reorder, id?: string): void;
  /** the selected drawing's style becomes the default for new drawings of its type */
  saveAsDefault(id?: string): void;
  /** the bar time nearest to a time */
  snapTime(t: number): number;
  openSettings(id?: string): void;
  /** the settings dialog: changes show at once; commit keeps them as one undo step, cancel restores */
  previewEdit(d: Drawing): void;
  commitEdit(): void;
  cancelEdit(): void;
}

export interface DrawingLayer extends DrawingApi {
  render(): void;
  setSymbol(symbol: string): void;
  /** the drawings as an image, for chart screenshots */
  image(): Promise<HTMLImageElement | null>;
  destroy(): void;
}

/** The layer the keyboard (Delete, Ctrl+Z, Escape) acts on: the pane used last. */
let activeLayer: object | null = null;
/** Ctrl+C / Ctrl+V between panes */
let clipboard: Drawing | null = null;

type Handle = string;

interface Drag {
  id: string;
  handle: Handle;
  startLogical: number;
  startPrice: number;
  startX: number;
  startY: number;
  before: Drawing;
  snapshot: string;
  moved: boolean;
  /** Alt / Ctrl drag made a copy: the list changed even without a move */
  cloned: boolean;
}

interface Creating {
  type: DrawingType;
  points: Point[];
  downX: number;
  downY: number;
  pressed: boolean;
  /** multi-click tools: the last click (a second one close by finishes) */
  lastAt: number;
  lastX: number;
  lastY: number;
  /** screen positions of the fixed points (polyline closes on its first point) */
  screen: { x: number; y: number }[];
  props: ReturnType<typeof newProps>;
  scale?: number;
}

/** note tooltips show on hover; numbers in labels line up (classes keep inline styles off thousands of nodes) */
const LAYER_CSS =
  '.btl-drawings .btl-tip{visibility:hidden}.btl-drawings .btl-note:hover .btl-tip{visibility:visible}' +
  '.btl-drawings .n{font-variant-numeric:tabular-nums}.btl-drawings .t{font-variant-numeric:tabular-nums;unicode-bidi:plaintext}';

export function createDrawingLayer(host: DrawingHost, symbol: string, initial: Record<string, Drawing[]>): DrawingLayer {
  const all: Record<string, Drawing[]> = structuredClone(initial);
  let sym = symbol;
  let tool: ToolId = 'cursor';
  let magnet = false;
  let stay = false;
  let locked = false;
  let hidden = false;
  let selectedId: string | null = null;
  let settingsId: string | null = null;
  let edit: { id: string; before: Drawing; snapshot: string } | null = null;
  let creating: Creating | null = null;
  let drag: Drag | null = null;
  let lastDown: { id: string; at: number; x: number; y: number } | null = null;
  const undoStack: { symbol: string; json: string }[] = [];
  const redoStack: { symbol: string; json: string }[] = [];
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
  /** bar times, rebuilt only when the candles change (the host builds a new array each call) */
  let timesCache: number[] = [];
  let timesRef: Candle[] | null = null;
  let timesKey = '';
  function times(): number[] {
    const c = host.candles();
    const key = `${c.length}|${c[0]?.time}|${c[c.length - 1]?.time}|${host.stepSec()}`;
    if (c !== timesRef || key !== timesKey) {
      timesCache = host.times();
      timesRef = c;
      timesKey = key;
    }
    return timesCache;
  }
  function timeToLogical(t: number): number {
    const tt = times();
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
    const tt = times();
    const n = tt.length;
    const step = host.stepSec();
    if (!n) return 0;
    if (l <= 0) return Math.round(tt[0] + l * step);
    if (l >= n - 1) return Math.round(tt[n - 1] + (l - (n - 1)) * step);
    const i = Math.floor(l);
    return Math.round(tt[i] + (l - i) * (tt[i + 1] - tt[i]));
  }
  /** bar index → x; also between bars (the library rounds fractional indices to the left edge) */
  function xOfLogical(l: number): number | null {
    const s = ts();
    const a = s.logicalToCoordinate(0 as Logical);
    const b = s.logicalToCoordinate(1 as Logical);
    if (a === null || b === null) return null;
    return a + (b - a) * l;
  }
  const X = (t: number) => {
    const l = timeToLogical(t);
    return Number.isFinite(l) ? xOfLogical(l) : null;
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
  /** pointer → time and price without snapping to bars (brushes, curve handles) */
  function freeAt(x: number, y: number): Point | null {
    const l = ts().coordinateToLogical(x);
    const raw = host.series.coordinateToPrice(y);
    if (l === null || raw === null) return null;
    return { time: logicalToTime(l), price: raw as number };
  }

  function barSpacing() {
    const a = ts().logicalToCoordinate(0 as Logical);
    const b = ts().logicalToCoordinate(1 as Logical);
    return a !== null && b !== null ? Math.abs(b - a) : 6;
  }

  function view(W: number, H: number): View {
    return {
      W,
      H,
      x: X,
      y: Y,
      logical: timeToLogical,
      timeAt: logicalToTime,
      xAt: xOfLogical,
      priceAt: (y) => host.series.coordinateToPrice(y) as number | null,
      barSpacing: barSpacing(),
      colors: host.colors(),
      digits: host.digits(),
      pip: host.pip(),
      candles: host.candles(),
    };
  }

  // ---------- changes ----------
  function remember(json = JSON.stringify(list())) {
    undoStack.push({ symbol: sym, json });
    if (undoStack.length > 80) undoStack.shift();
    for (let i = redoStack.length - 1; i >= 0; i--) if (redoStack[i].symbol === sym) redoStack.splice(i, 1);
  }
  function changed() {
    host.onChange(all);
    render();
    notify();
  }
  const find = (id: string | null) => list().find((d) => d.id === id) ?? null;
  const tfGroup = () => tfGroupOf(host.stepSec());
  const shown = (d: Drawing) => !d.hidden && !d.hiddenOn?.includes(tfGroup());

  function select(id: string | null) {
    if (selectedId === id) return;
    selectedId = id;
    render();
    notify();
  }

  // ---------- creating ----------
  /** Gann square fixed: the second point keeps the price-per-bar of the square */
  function constrain(type: DrawingType, pts: Point[], scale: number | undefined) {
    if (type !== 'gannsqfixed' || !scale || pts.length < 2) return;
    const a = pts[0];
    const b = pts[1];
    const bars = Math.abs(timeToLogical(b.time) - timeToLogical(a.time));
    const dir = b.price >= a.price ? 1 : -1;
    pts[1] = { time: b.time, price: host.roundPrice(a.price + dir * bars * scale) };
  }

  function startCreating(type: DrawingType, p: Point, x: number, y: number) {
    const props = newProps(type);
    let scale: number | undefined;
    if (type === 'gannsqfixed') {
      // square on screen as drawn: price per pixel × pixels per bar
      const p0 = host.series.coordinateToPrice(0);
      const p1 = host.series.coordinateToPrice(100);
      scale = props.style.scale || (p0 !== null && p1 !== null ? (Math.abs((p0 as number) - (p1 as number)) / 100) * barSpacing() : undefined);
    }
    const one = TOOL_SPECS[type].points === 1;
    creating = { type, points: one ? [p] : [p, { ...p }], downX: x, downY: y, pressed: true, lastAt: performance.now(), lastX: x, lastY: y, screen: [{ x, y }], props, scale };
  }

  function finishCreating(opts: { closed?: boolean } = {}) {
    if (!creating) return;
    const cr = creating;
    creating = null;
    const { type, props } = cr;
    const spec = TOOL_SPECS[type];
    // a double click repeats the last point: keep one
    const points = cr.points
      .map((p) => ({ time: p.time, price: p.price }))
      .filter((p, i, a) => spec.mode !== 'multi' || !i || p.time !== a[i - 1].time || p.price !== a[i - 1].price);
    const c = host.colors();
    if (spec.mode !== 'click' && points.length < 2) {
      render();
      notify();
      return;
    }
    const d: Drawing = { id: drawingId(), type, points, color: props.color, width: props.width, style: { ...props.style } };
    if (props.levels) d.levels = structuredClone(props.levels);
    if (props.levels2) d.levels2 = structuredClone(props.levels2);
    if (props.levels3) d.levels3 = structuredClone(props.levels3);
    switch (type) {
      case 'long':
      case 'short': {
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
        d.width = 2;
        delete d.style;
        break;
      }
      case 'measure':
        delete d.style;
        break;
      case 'text':
        d.text = 'متن';
        break;
      case 'anchoredtext': {
        const W = host.plotWidth();
        const H = host.paneHeight();
        d.anchor = { x: Math.max(0, Math.min(0.95, cr.downX / W)), y: Math.max(0, Math.min(0.95, cr.downY / H)) };
        d.text = 'متن';
        break;
      }
      case 'note':
        d.text = 'یادداشت';
        break;
      case 'callout':
        d.text = 'توضیح';
        break;
      case 'comment':
        d.text = 'دیدگاه';
        break;
      case 'signpost':
        d.text = 'تابلو';
        break;
      case 'pin':
        d.text = 'سنجاق';
        break;
      case 'polyline':
        d.style!.closed = !!opts.closed;
        break;
      case 'gannsqfixed':
        if (cr.scale) d.style!.scale = cr.scale;
        constrain(type, d.points, cr.scale);
        break;
      case 'curve':
      case 'doublecurve': {
        // control handles off the line, so it starts as a curve
        const a = { x: X(points[0].time), y: Y(points[0].price) };
        const b = { x: X(points[1].time), y: Y(points[1].price) };
        if (a.x !== null && a.y !== null && b.x !== null && b.y !== null) {
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const nx = (-(b.y - a.y) / len) * len * 0.3;
          const ny = ((b.x - a.x) / len) * len * 0.3;
          const ctrl = (t: number, s: number) => freeAt(a.x! + (b.x! - a.x!) * t + nx * s, a.y! + (b.y! - a.y!) * t + ny * s);
          const extra = type === 'curve' ? [ctrl(0.5, -1)] : [ctrl(0.25, -1), ctrl(0.75, 1)];
          if (extra.every(Boolean)) d.points.push(...(extra as Point[]));
        }
        break;
      }
      case 'barspattern': {
        // copy the bars between the two clicks
        let i0 = Math.round(timeToLogical(points[0].time));
        let i1 = Math.round(timeToLogical(points[1].time));
        if (i0 > i1) [i0, i1] = [i1, i0];
        const candles = host.candles();
        i0 = Math.max(0, i0);
        i1 = Math.min(candles.length - 1, i1, i0 + 499);
        if (i1 >= i0) {
          d.bars = candles.slice(i0, i1 + 1).map((k) => [k.open, k.high, k.low, k.close]);
          d.points = [
            { time: candles[i0].time, price: candles[i0].open },
            { time: candles[i1].time, price: candles[i1].close },
          ];
        }
        break;
      }
    }
    remember();
    list().push(d);
    selectedId = d.id;
    if (!stay) tool = 'cursor';
    changed();
  }

  function cancel() {
    if (creating) {
      const spec = TOOL_SPECS[creating.type];
      // a path with points already placed: keep it
      if (spec.mode === 'multi' && creating.points.length > 2) {
        creating.points.pop();
        finishCreating();
        return;
      }
      creating = null;
    } else if (tool !== 'cursor') tool = 'cursor';
    else selectedId = null;
    render();
    notify();
  }

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
    const spec = TOOL_SPECS[type];
    if (spec.mode === 'free') return startFree(e, type);
    if (spec.mode === 'multi') {
      const now = performance.now();
      if (!creating) startCreating(type, p, x, y);
      else {
        const quick = now - creating.lastAt < 400 && Math.hypot(x - creating.lastX, y - creating.lastY) < 6;
        const first = creating.screen[0];
        if (quick) {
          creating.points.pop();
          finishCreating();
          return;
        }
        if (type === 'polyline' && creating.points.length >= 4 && Math.hypot(x - first.x, y - first.y) < 8) {
          creating.points.pop();
          finishCreating({ closed: true });
          return;
        }
        creating.points[creating.points.length - 1] = p;
        creating.points.push({ ...p });
        creating.screen.push({ x, y });
        creating.lastAt = now;
        creating.lastX = x;
        creating.lastY = y;
      }
      render();
      return;
    }
    if (!creating) {
      startCreating(type, p, x, y);
      if (spec.points === 1) finishCreating();
      else render();
    } else {
      creating.points[creating.points.length - 1] = p;
      constrain(type, creating.points, creating.scale);
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
        constrain(creating.type, creating.points, creating.scale);
        fixPoint();
      }
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /** the moving point is placed: finish, or start the next one */
  function fixPoint() {
    if (!creating) return;
    if (creating.points.length >= TOOL_SPECS[creating.type].points) finishCreating();
    else {
      creating.points.push({ ...creating.points[creating.points.length - 1] });
      render();
    }
  }

  /** brush and highlighter: press, draw, release */
  function startFree(e: PointerEvent, type: DrawingType) {
    const { x, y } = local(e);
    const p = freeAt(x, y);
    if (!p) return;
    startCreating(type, p, x, y);
    creating!.points = [p];
    let last = { x, y };
    const move = (ev: PointerEvent) => {
      if (!creating) return;
      const q = local(ev);
      if (Math.hypot(q.x - last.x, q.y - last.y) < 3) return;
      const r = freeAt(q.x, q.y);
      if (!r) return;
      last = q;
      creating.points.push(r);
      render();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      finishCreating();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function onCaptureMove(e: PointerEvent) {
    const { x, y } = local(e);
    const pt = pointAt(x, y);
    if (!pt) return;
    const time = logicalToTime(pt.logical);
    // keep the crosshair following the pointer while a tool is active
    const tt = times();
    if (tt.includes(time)) host.chart.setCrosshairPosition(pt.price, time as UTCTimestamp, host.series);
    if (creating && TOOL_SPECS[creating.type].mode !== 'free') {
      creating.points[creating.points.length - 1] = { time: pt.time, price: pt.price };
      constrain(creating.type, creating.points, creating.scale);
      render();
    }
  }

  // ---------- moving ----------
  function startDrag(e: PointerEvent, d0: Drawing, handle: Handle) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    activeLayer = api;
    let d = d0;
    const snapshot = JSON.stringify(list());
    let cloned = false;
    // Alt or Ctrl drag: move a copy
    if (handle === 'body' && (e.altKey || e.ctrlKey || e.metaKey) && !locked) {
      d = { ...structuredClone(d0), id: drawingId(), locked: false };
      list().push(d);
      cloned = true;
    }
    select(d.id);
    if (locked || d.locked) return;
    const { x, y } = local(e);
    const l = ts().coordinateToLogical(x);
    const p = host.series.coordinateToPrice(y);
    if (l === null || p === null) return;
    drag = { id: d.id, handle, startLogical: Math.round(l), startPrice: p as number, startX: x, startY: y, before: structuredClone(d), snapshot, moved: false, cloned };
    const move = (ev: PointerEvent) => onDrag(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const dr = drag;
      drag = null;
      if (dr?.moved || dr?.cloned) {
        remember(dr.snapshot);
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
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) < 2) return;
    const free = d.type === 'brush' || d.type === 'highlighter' || ((d.type === 'curve' || d.type === 'doublecurve') && /^p[23]$/.test(drag.handle));
    const pt = pointAt(x, y);
    if (!pt) return;
    const b = drag.before;
    const shift = (p: Point, dl: number, dp: number): Point => ({ time: logicalToTime(timeToLogical(p.time) + dl), price: host.roundPrice(p.price + dp) });
    const fp = free ? freeAt(x, y) : null;
    const P = fp ?? { time: pt.time, price: pt.price };
    drag.moved = true;
    switch (drag.handle) {
      case 'body': {
        if (d.type === 'anchoredtext') {
          const a = b.anchor ?? { x: 0.5, y: 0.2 };
          d.anchor = {
            x: Math.max(0, Math.min(0.98, a.x + (x - drag.startX) / host.plotWidth())),
            y: Math.max(0, Math.min(0.98, a.y + (y - drag.startY) / host.paneHeight())),
          };
          break;
        }
        const dl = pt.logical - drag.startLogical;
        const raw = host.series.coordinateToPrice(y);
        const dp = raw === null ? 0 : (raw as number) - drag.startPrice;
        const noTime = d.type === 'hline';
        const noPrice = d.type === 'vline' || d.type === 'regression';
        if (free) {
          // brushes keep their shape exactly (no snapping to bars)
          const f0 = freeAt(drag.startX, drag.startY);
          const f1 = freeAt(x, y);
          const dlf = f0 && f1 ? timeToLogical(f1.time) - timeToLogical(f0.time) : dl;
          d.points = b.points.map((p) => ({ time: logicalToTime(timeToLogical(p.time) + dlf), price: p.price + dp }));
        } else d.points = b.points.map((p) => shift(p, noTime ? 0 : dl, noPrice ? 0 : dp));
        if (b.stop !== undefined) d.stop = host.roundPrice(b.stop + dp);
        if (b.target !== undefined) d.target = host.roundPrice(b.target + dp);
        break;
      }
      case 'c2': // box corner (start time, end price)
        d.points = [
          { time: P.time, price: b.points[0].price },
          { time: b.points[1].time, price: P.price },
        ];
        break;
      case 'c3': // box corner (end time, start price)
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
      default: {
        const i = Number(drag.handle.slice(1));
        if (!Number.isInteger(i) || !b.points[i]) break;
        const keepPrice = d.type === 'vline' || d.type === 'regression';
        d.points = b.points.map((p, j) => (j === i ? (keepPrice ? { time: P.time, price: p.price } : P) : p));
        if ((d.type === 'channel' || d.type === 'fibchannel') && i < 2 && b.points[2]) {
          // keep the channel's width: the parallel line moves with the first one
          const off = b.points[2].price - priceOnLine(b, timeToLogical(b.points[2].time));
          d.points[2] = { time: b.points[2].time, price: host.roundPrice(priceOnLine(d, timeToLogical(b.points[2].time)) + off) };
        }
        if (d.type === 'gannsqfixed') {
          const scale = d.style?.scale;
          if (i === 0 && scale) {
            const dir = b.points[1].price >= b.points[0].price ? 1 : -1;
            const bars = Math.abs(timeToLogical(b.points[1].time) - timeToLogical(P.time));
            d.points[1] = { time: b.points[1].time, price: host.roundPrice(P.price + dir * bars * scale) };
          } else constrain(d.type, d.points, scale);
        }
      }
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

  // ---------- rendering ----------
  const clipId = Math.random().toString(36).slice(2, 8);

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
    svgEl('style', {}, defs).textContent = LAYER_CSS;
    const g = svgEl('g', { 'clip-path': `url(#clip-${clipId})` }, svg);
    const v = view(W, H);
    const interactive = tool === 'cursor';
    if (!hidden) for (const d of list()) if (shown(d)) drawDrawing(g, d, v, { selected: d.id === selectedId && interactive, interactive });
    if (creating) {
      const { props } = creating;
      const preview: Drawing = {
        id: 'new',
        type: creating.type,
        points: creating.points,
        color: props.color,
        width: props.width,
        style: props.style,
        levels: props.levels,
        levels2: props.levels2,
        levels3: props.levels3,
      };
      if (creating.type === 'anchoredtext') preview.anchor = { x: creating.downX / W, y: creating.downY / H };
      drawDrawing(g, preview, v, { selected: false, interactive: false, preview: true });
    }
    if (tool !== 'cursor') {
      const cap = svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent', 'pointer-events': 'all', cursor: 'crosshair' }, svg);
      cap.addEventListener('pointerdown', onCaptureDown);
      cap.addEventListener('pointermove', onCaptureMove);
      cap.addEventListener('pointerleave', () => host.chart.clearCrosshairPosition());
    }
  }

  // ---------- page events ----------
  /** a drawing or one of its handles pressed (one listener for all of them) */
  const onSvgDown = (e: PointerEvent) => {
    if (tool !== 'cursor' || e.button !== 0) return;
    const t = e.target as Element | null;
    const gEl = t?.closest?.('[data-id]');
    if (!gEl) return;
    const d = find(gEl.getAttribute('data-id'));
    if (!d) return;
    const h = t?.closest?.('[data-h]')?.getAttribute('data-h') ?? 'body';
    const now = performance.now();
    // a double click opens the settings
    if (lastDown && lastDown.id === d.id && now - lastDown.at < 380 && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) < 6) {
      lastDown = null;
      e.preventDefault();
      e.stopPropagation();
      api.openSettings(d.id);
      return;
    }
    lastDown = { id: d.id, at: now, x: e.clientX, y: e.clientY };
    startDrag(e, d, h);
  };
  svg.addEventListener('pointerdown', onSvgDown);

  const onContainerDown = (e: PointerEvent) => {
    activeLayer = api;
    if (!svg.contains(e.target as Node) && selectedId && !drag) select(null);
  };
  host.container.addEventListener('pointerdown', onContainerDown, true);
  const onKey = (e: KeyboardEvent) => {
    if (activeLayer !== api || settingsId) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      api.removeSelected();
    } else if (e.key === 'Enter' && creating && TOOL_SPECS[creating.type].mode === 'multi') {
      e.preventDefault();
      creating.points.pop();
      finishCreating();
    } else if (e.key === 'Escape' && (creating || tool !== 'cursor' || selectedId)) {
      cancel();
    } else if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
      if (redoStack.some((u) => u.symbol === sym)) {
        e.preventDefault();
        api.redo();
      }
    } else if (mod && key === 'z' && undoStack.some((u) => u.symbol === sym)) {
      e.preventDefault();
      api.undo();
    } else if (mod && key === 'c' && selectedId && !window.getSelection()?.toString()) {
      clipboard = structuredClone(find(selectedId));
    } else if (mod && key === 'v' && clipboard) {
      e.preventDefault();
      const copy: Drawing = { ...structuredClone(clipboard), id: drawingId(), locked: false };
      if (find(clipboard.id)) offset(copy);
      remember();
      list().push(copy);
      selectedId = copy.id;
      changed();
    }
  };
  window.addEventListener('keydown', onKey);

  /** moves a copy a little to the right and down, so it does not hide its original */
  function offset(d: Drawing) {
    const top = host.series.coordinateToPrice(0);
    const bottom = host.series.coordinateToPrice(host.paneHeight());
    const dp = top !== null && bottom !== null ? -Math.abs((top as number) - (bottom as number)) * 0.04 : 0;
    const dl = d.type === 'hline' ? 0 : 5;
    d.points = d.points.map((p) => ({ time: logicalToTime(timeToLogical(p.time) + dl), price: host.roundPrice(p.price + (d.type === 'vline' ? 0 : dp)) }));
    if (d.stop !== undefined) d.stop = host.roundPrice(d.stop + dp);
    if (d.target !== undefined) d.target = host.roundPrice(d.target + dp);
    if (d.anchor) d.anchor = { x: Math.min(0.95, d.anchor.x + 0.03), y: Math.min(0.95, d.anchor.y + 0.04) };
  }

  function step(from: { symbol: string; json: string }[], to: { symbol: string; json: string }[]) {
    for (let i = from.length - 1; i >= 0; i--) {
      if (from[i].symbol !== sym) continue;
      const [u] = from.splice(i, 1);
      to.push({ symbol: sym, json: JSON.stringify(list()) });
      all[sym] = JSON.parse(u.json) as Drawing[];
      if (!find(selectedId)) selectedId = null;
      changed();
      return;
    }
  }

  const api: DrawingLayer = {
    ui: () => ({
      tool,
      magnet,
      stay,
      locked,
      hidden,
      count: list().length,
      selected: find(selectedId),
      canUndo: undoStack.some((u) => u.symbol === sym),
      canRedo: redoStack.some((u) => u.symbol === sym),
      settings: settingsId,
      tfGroup: tfGroup(),
      digits: host.digits(),
    }),
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
      if (selectedId) api.remove(selectedId);
    },
    updateSelected(patch) {
      if (selectedId) api.update(selectedId, patch);
    },
    undo() {
      step(undoStack, redoStack);
    },
    redo() {
      step(redoStack, undoStack);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    list: () => list(),
    select(id) {
      activeLayer = api;
      if (id && tool !== 'cursor') {
        tool = 'cursor';
        creating = null;
      }
      select(id);
    },
    update(id, patch) {
      const d = find(id);
      if (!d) return;
      remember();
      Object.assign(d, patch);
      // a field set to undefined is removed
      for (const [k, v] of Object.entries(patch)) if (v === undefined) delete (d as unknown as Record<string, unknown>)[k];
      if (d.id === selectedId && !shown(d)) selectedId = null;
      changed();
    },
    remove(id) {
      if (!find(id)) return;
      remember();
      all[sym] = list().filter((d) => d.id !== id);
      if (selectedId === id) selectedId = null;
      changed();
    },
    clone(id = selectedId ?? '') {
      const d = find(id);
      if (!d) return;
      const copy: Drawing = { ...structuredClone(d), id: drawingId(), locked: false };
      offset(copy);
      remember();
      list().push(copy);
      selectedId = copy.id;
      changed();
    },
    reorder(where, id = selectedId ?? '') {
      const arr = list();
      const i = arr.findIndex((d) => d.id === id);
      if (i < 0) return;
      const j = where === 'front' ? arr.length - 1 : where === 'back' ? 0 : where === 'forward' ? Math.min(arr.length - 1, i + 1) : Math.max(0, i - 1);
      if (i === j) return;
      remember();
      const [d] = arr.splice(i, 1);
      arr.splice(j, 0, d);
      changed();
    },
    saveAsDefault(id = selectedId ?? '') {
      const d = find(id);
      if (d) saveDefault(d);
    },
    snapTime: (t) => logicalToTime(Math.round(timeToLogical(t))),
    openSettings(id = selectedId ?? '') {
      const d = find(id);
      if (!d) return;
      if (edit) api.cancelEdit();
      selectedId = d.id;
      settingsId = d.id;
      edit = { id: d.id, before: structuredClone(d), snapshot: JSON.stringify(list()) };
      render();
      notify();
    },
    previewEdit(next) {
      if (!edit || next.id !== edit.id) return;
      const arr = list();
      const i = arr.findIndex((d) => d.id === next.id);
      if (i < 0) return;
      arr[i] = structuredClone(next);
      render();
      notify();
    },
    commitEdit() {
      if (!edit) return;
      const e = edit;
      edit = null;
      settingsId = null;
      const now = find(e.id);
      if (now && JSON.stringify(now) !== JSON.stringify(e.before)) {
        remember(e.snapshot);
        if (!shown(now)) selectedId = null;
        changed();
      } else {
        render();
        notify();
      }
    },
    cancelEdit() {
      if (!edit) return;
      const e = edit;
      edit = null;
      settingsId = null;
      const arr = list();
      const i = arr.findIndex((d) => d.id === e.id);
      if (i >= 0) arr[i] = e.before;
      render();
      notify();
    },
    render,
    setSymbol(s) {
      if (s === sym) return;
      if (edit) api.cancelEdit();
      sym = s;
      selectedId = null;
      creating = null;
      render();
      notify();
    },
    async image() {
      if (hidden || !list().length) return null;
      const copy = svg.cloneNode(true) as SVGSVGElement;
      copy.querySelectorAll('.h, .btl-tip').forEach((n) => n.remove());
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
      svg.removeEventListener('pointerdown', onSvgDown);
      if (activeLayer === api) activeLayer = null;
      svg.remove();
      listeners.clear();
    },
  };
  render();
  return api;
}
