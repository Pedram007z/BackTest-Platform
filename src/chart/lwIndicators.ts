import {
  AreaSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  LineType,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
  type SeriesMarker,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle, Timeframe } from '../lib/market';
import { runOnChart } from '../pine/chart';
import type { InputDef, ShapeOut } from '../pine/core';
import type { RunOk } from '../pine/run';
import { INDICATOR_MAP, computeIndicator, indicatorTitle, newIndicator, type IndicatorConfig, type IndicatorType } from './indicators';
import { createSessionsLayer } from './lwSessions';
import { sessionsFromParams } from './sessions';

/**
 * Indicators on the built-in chart: overlays share the candles' pane, oscillators get a pane each
 * below it. Values come only from the bars the replay has shown.
 *
 * Pine indicators (type `pine`) run the user's script (src/pine/chart.ts) over the candles shown, again
 * on every replay step; their plots, horizontal lines, background colours and shapes are drawn as the
 * script describes them, in the candles' pane (`overlay = true`) or a pane of their own.
 */

export interface IndicatorApi {
  list(): IndicatorConfig[];
  /** returns the new indicator's id */
  add(type: IndicatorType): string;
  /** adds one of the user's Pine scripts; returns the new indicator's id */
  addPine(scriptId: string): string;
  update(cfg: IndicatorConfig): void;
  remove(id: string): void;
  subscribe(fn: () => void): () => void;
  /** a Pine indicator's last run: its title, inputs and error */
  pineInfo(id: string): { title: string; inputs: InputDef[]; error: string | null } | null;
}

export interface PineHost {
  /** the user's script (null: deleted) */
  script(id: string): { name: string; code: string } | null;
  /** the chart's symbol, timeframe and replay position */
  context(): { symbol: string; tf: Timeframe; cursor: number };
}

export interface IndicatorHost {
  chart: IChartApi;
  /** the candles (the sessions boxes are drawn against its price scale) */
  series: ISeriesApi<'Candlestick'>;
  container: HTMLElement;
  /** length of one bar in seconds */
  barSec(): number;
  /** the candles' pane: plot width and height */
  plotBox(): { w: number; h: number };
  /** the main legend (symbol and OHLC): overlay indicators are listed under it */
  legend: HTMLElement;
  digits(): number;
  colors(): { text: string; surface: string; grid: string; gain: string; loss: string };
  onChange(list: IndicatorConfig[]): void;
  onSettings(id: string): void;
  pine?: PineHost;
}

export interface IndicatorLayer extends IndicatorApi {
  setBars(bars: Candle[]): void;
  /** legend values at the crosshair (or the last bar) */
  crosshair(p: MouseEventParams<Time> | null): void;
  /** re-place the oscillator legends after the panes resize */
  place(): void;
  /** run the Pine indicators again (a script was edited) */
  refreshPine(): void;
  destroy(): void;
}

interface PineState {
  title: string;
  overlay: boolean;
  error: string | null;
  inputs: InputDef[];
  result: RunOk | null;
  /** what the run depended on: the same again skips the run */
  key: string;
  /** the series layout built (plots, styles, pane): a different one needs a rebuild */
  sig: string;
  plots: { key: string; title: string; color: string }[];
  markers: ISeriesMarkersPluginApi<Time> | null;
  /** its horizontal lines, and the series they are on */
  lines: { on: ISeriesApi<SeriesType>; line: IPriceLine }[];
}

interface Live {
  cfg: IndicatorConfig;
  series: Map<string, ISeriesApi<SeriesType>>;
  values: Record<string, number[]>;
  pine?: PineState;
}

/** Pine runs read at most this many candles back. */
const PINE_MAX_BARS = 5000;

const ICON = {
  eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/></svg>',
  gear: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

/** "#rrggbbaa" (Pine colours) → "rgba()". */
function css(c: string | null | undefined, fallback: string): string {
  if (!c || c[0] !== '#' || c.length < 7) return fallback;
  const r = parseInt(c.slice(1, 3), 16),
    g = parseInt(c.slice(3, 5), 16),
    b = parseInt(c.slice(5, 7), 16);
  const a = c.length >= 9 ? parseInt(c.slice(7, 9), 16) / 255 : 1;
  return `rgba(${r},${g},${b},${+a.toFixed(3)})`;
}

const markerShape = (s: ShapeOut): SeriesMarker<Time>['shape'] => {
  if (/up/.test(s.style)) return 'arrowUp';
  if (/down/.test(s.style)) return 'arrowDown';
  return s.style === 'square' ? 'square' : 'circle';
};

export function createIndicatorLayer(host: IndicatorHost, initial: IndicatorConfig[]): IndicatorLayer {
  const live: Live[] = [];
  const listeners = new Set<() => void>();
  let bars: Candle[] = [];
  let at: number | null = null;
  const paneLegends = new Map<string, HTMLDivElement>();
  const overlayLegend = document.createElement('div');
  host.legend.append(overlayLegend);

  const sessions = createSessionsLayer(host);
  const syncSessions = () => sessions.setConfigs(live.filter((l) => l.cfg.type === 'sessions' && !l.cfg.hidden).map((l) => sessionsFromParams(l.cfg.params, l.cfg.colors)));

  const notify = () => listeners.forEach((f) => f());
  const changed = () => {
    host.onChange(live.map((l) => l.cfg));
    syncSessions();
    renderLegends();
    notify();
  };

  const isOverlay = (l: Live) => (l.cfg.type === 'pine' ? (l.pine?.overlay ?? true) : INDICATOR_MAP[l.cfg.type].overlay);

  function precision(l: Live) {
    if (l.cfg.type === 'pine') return isOverlay(l) ? host.digits() : 2;
    return l.cfg.type === 'rsi' || l.cfg.type === 'stoch' ? 2 : host.digits() + (l.cfg.type === 'macd' ? 1 : 0);
  }

  /** oscillator panes are numbered by their order in the list, after the candles' pane */
  function paneIndexOf(l: Live) {
    if (isOverlay(l)) return 0;
    return 1 + live.filter((x) => !isOverlay(x)).indexOf(l);
  }

  // ---------- Pine indicators ----------
  const newPine = (): PineState => ({ title: 'Pine', overlay: true, error: null, inputs: [], result: null, key: '', sig: '', plots: [], markers: null, lines: [] });

  /** Run the script over the candles shown (skipped when nothing it depends on changed). */
  function runPine(l: Live) {
    const st = (l.pine ??= newPine());
    const script = host.pine?.script(l.cfg.pine?.script ?? '');
    if (!script || !host.pine) {
      st.error = 'این اسکریپت حذف شده است.';
      st.result = null;
      st.title = 'Pine';
      st.key = '';
      return;
    }
    const ctx = host.pine.context();
    const shown = bars.length > PINE_MAX_BARS ? bars.slice(-PINE_MAX_BARS) : bars;
    const last = shown[shown.length - 1];
    const key = [script.code, JSON.stringify(l.cfg.pine?.inputs ?? {}), ctx.symbol, ctx.tf, shown.length, shown[0]?.time, last?.time, last?.high, last?.low, last?.close].join('|');
    if (key === st.key) return;
    st.key = key;
    const r = shown.length ? runOnChart({ code: script.code, candles: shown, symbol: ctx.symbol, tf: ctx.tf, cursor: ctx.cursor, inputs: l.cfg.pine?.inputs }) : null;
    if (!r) {
      st.result = null;
      st.error = null;
      st.title = script.name;
      return;
    }
    st.inputs = r.inputs;
    if (!r.ok) {
      st.error = r.error.line ? `خط ${r.error.line}: ${r.error.message}` : r.error.message;
      st.result = null;
      st.title = script.name;
      return;
    }
    st.error = null;
    st.result = r;
    st.title = r.decl.shorttitle || r.decl.title || script.name;
    st.overlay = r.decl.overlay;
  }

  /** The series a run needs: a different one from the built one means rebuilding. */
  const pineSig = (l: Live) => {
    const r = l.pine?.result;
    if (!r) return 'none';
    return [isOverlay(l), ...r.plots.filter((p) => p.display).map((p) => `${p.id}:${p.kind}:${p.style}`), r.bgcolors ? 'bg' : ''].join(',');
  };

  function buildPine(l: Live, pane: number) {
    const st = l.pine!;
    st.sig = pineSig(l);
    st.plots = [];
    const r = st.result;
    if (!r) return;
    const p = precision(l);
    const priceFormat = { type: 'price' as const, precision: p, minMove: 1 / 10 ** p };
    const base = { priceLineVisible: false, lastValueVisible: !isOverlay(l), crosshairMarkerVisible: false, visible: !l.cfg.hidden, priceFormat };
    let anchor: ISeriesApi<SeriesType> | null = null;
    for (const plot of r.plots) {
      if (!plot.display || plot.kind !== 'plot') continue;
      const key = String(plot.id);
      const color = l.cfg.colors[key] ?? css(plot.color, '#2962ff');
      let s: ISeriesApi<SeriesType>;
      if (plot.style === 'histogram' || plot.style === 'columns') s = host.chart.addSeries(HistogramSeries, { ...base, color, base: 0 }, pane);
      else if (plot.style === 'area' || plot.style === 'areabr')
        s = host.chart.addSeries(
          AreaSeries,
          {
            ...base,
            lineColor: color,
            topColor: color.replace(/[\d.]+\)$/, '0.3)'),
            bottomColor: color.replace(/[\d.]+\)$/, '0.02)'),
            lineWidth: Math.min(4, plot.linewidth) as 1,
          },
          pane,
        );
      else {
        const dots = plot.style === 'circles' || plot.style === 'cross';
        s = host.chart.addSeries(
          LineSeries,
          {
            ...base,
            color,
            lineWidth: Math.min(4, plot.linewidth) as 1,
            lineVisible: !dots,
            pointMarkersVisible: dots,
            pointMarkersRadius: dots ? 1.5 + plot.linewidth / 2 : undefined,
            lineType: plot.style.startsWith('stepline') ? LineType.WithSteps : LineType.Simple,
          },
          pane,
        );
      }
      l.series.set(key, s);
      anchor ??= s;
      st.plots.push({ key, title: plot.title, color });
    }
    // horizontal lines: on the script's first series, or the candles (overlay), or an empty series in its pane
    const hlines = r.plots.filter((x) => x.kind === 'hline' && x.display && x.values[0] === x.values[0]);
    if (hlines.length && !anchor) {
      if (pane === 0) anchor = host.series;
      else {
        anchor = host.chart.addSeries(LineSeries, { ...base, lineVisible: false, lastValueVisible: false }, pane);
        l.series.set('hline-anchor', anchor);
      }
    }
    for (const h of hlines) {
      const line = anchor!.createPriceLine({
        price: h.values[0],
        color: css(h.color, host.colors().grid),
        lineWidth: Math.min(4, h.linewidth) as 1,
        lineStyle: h.style === 'solid' ? LineStyle.Solid : h.style === 'dotted' ? LineStyle.Dotted : LineStyle.Dashed,
        axisLabelVisible: false,
        title: h.title.startsWith('Plot ') ? '' : h.title,
      });
      st.lines.push({ on: anchor!, line });
    }
    if (r.bgcolors) {
      const bg = host.chart.addSeries(
        HistogramSeries,
        { priceScaleId: `pine-bg-${l.cfg.id}`, priceLineVisible: false, lastValueVisible: false, base: 0, visible: !l.cfg.hidden },
        pane,
      );
      bg.priceScale().applyOptions({ scaleMargins: { top: 0, bottom: 0 }, visible: false });
      bg.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 1 } }) });
      l.series.set('bg', bg);
    }
    st.markers = createSeriesMarkers(host.series, []);
  }

  function fillPine(l: Live) {
    const st = l.pine!;
    const r = st.result;
    const shown = bars.length > PINE_MAX_BARS ? bars.slice(-PINE_MAX_BARS) : bars;
    const skip = bars.length - shown.length;
    const times = bars.map((b) => b.time as UTCTimestamp);
    l.values = {};
    if (!r) {
      for (const s of l.series.values()) s.setData([]);
      st.markers?.setMarkers([]);
      return;
    }
    const n = shown.length;
    for (const plot of r.plots) {
      const key = String(plot.id);
      const s = l.series.get(key);
      if (!s) continue;
      const vals = new Array<number>(bars.length).fill(NaN);
      const data: ({ time: UTCTimestamp; value: number; color?: string } | { time: UTCTimestamp })[] = [];
      const gaps = plot.style.endsWith('br') || plot.style === 'histogram' || plot.style === 'columns' || plot.style === 'circles' || plot.style === 'cross';
      for (let j = 0; j < n; j++) {
        const i = j - plot.offset;
        const v = i >= 0 && i < n ? plot.values[i] : NaN;
        vals[skip + j] = v;
        if (v === v) data.push(plot.colors ? { time: times[skip + j], value: v, color: css(plot.colors[i], 'rgba(0,0,0,0)') } : { time: times[skip + j], value: v });
        else if (gaps) data.push({ time: times[skip + j] });
      }
      s.setData(data as never);
      l.values[key] = vals;
    }
    const bg = l.series.get('bg');
    if (bg && r.bgcolors)
      bg.setData(
        shown.map((b, i) => (r.bgcolors![i] ? { time: b.time as UTCTimestamp, value: 1, color: css(r.bgcolors![i], 'rgba(0,0,0,0)') } : { time: b.time as UTCTimestamp })) as never,
      );
    const anchor = l.series.get('hline-anchor');
    if (anchor) anchor.setData(shown.map((b) => ({ time: b.time as UTCTimestamp })) as never);
    if (!st.markers) return;
    if (l.cfg.hidden) {
      st.markers.setMarkers([]);
      return;
    }
    const marks: SeriesMarker<Time>[] = [];
    for (const s of r.shapes.slice(-2000)) {
      if (s.bar < 0 || s.bar >= n) continue;
      const time = times[skip + s.bar];
      const color = css(s.color, '#2962ff');
      const text = (s.kind === 'char' ? s.style + (s.text ? ` ${s.text}` : '') : s.text) || undefined;
      if (s.location === 'absolute' && s.price !== undefined && s.price === s.price)
        marks.push({ time, position: 'atPriceMiddle', price: s.price, shape: markerShape(s), color, text });
      else
        marks.push({
          time,
          position: s.location === 'belowbar' || s.location === 'bottom' ? 'belowBar' : 'aboveBar',
          shape: markerShape(s),
          color,
          text,
          size: s.size === 'tiny' ? 0.6 : s.size === 'small' ? 0.8 : 1,
        });
    }
    marks.sort((a, b) => (a.time as number) - (b.time as number));
    st.markers.setMarkers(marks);
  }

  // ---------- building ----------
  function build(l: Live) {
    const pane = paneIndexOf(l);
    if (l.cfg.type === 'pine') {
      buildPine(l, pane);
      if (!isOverlay(l)) host.chart.panes()[pane]?.setStretchFactor(0.32);
      fillPine(l);
      return;
    }
    const def = INDICATOR_MAP[l.cfg.type];
    const p = precision(l);
    for (const plot of def.plots) {
      const opts = {
        color: l.cfg.colors[plot.key] ?? plot.color,
        lineWidth: 2 as const,
        priceLineVisible: false,
        lastValueVisible: !def.overlay,
        crosshairMarkerVisible: false,
        visible: !l.cfg.hidden,
        priceFormat: { type: 'price' as const, precision: p, minMove: 1 / 10 ** p },
      };
      const s = plot.histogram ? host.chart.addSeries(HistogramSeries, opts, pane) : host.chart.addSeries(LineSeries, { ...opts, lineWidth: def.overlay ? 2 : 1.5 } as never, pane);
      l.series.set(plot.key, s);
    }
    // (the sessions indicator has no lines: its boxes are drawn by lwSessions)
    const first = def.plots.length ? l.series.get(def.plots.find((x) => !x.histogram)?.key ?? def.plots[0].key) : undefined;
    for (const level of def.levels ?? [])
      first?.createPriceLine({ price: level, color: host.colors().grid, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '' });
    if (!def.overlay) host.chart.panes()[pane]?.setStretchFactor(0.32);
    fill(l);
  }

  function unbuild(l: Live) {
    if (l.pine) {
      // a Pine overlay's horizontal lines may sit on the candles
      for (const { on, line } of l.pine.lines) if (on === host.series) on.removePriceLine(line);
      l.pine.lines = [];
      l.pine.markers?.detach();
      l.pine.markers = null;
    }
    for (const s of l.series.values()) host.chart.removeSeries(s);
    l.series.clear();
  }

  function clearAll() {
    for (const l of live) unbuild(l);
    // drop the oscillator panes left empty
    for (let i = host.chart.panes().length - 1; i > 0; i--) if (!host.chart.panes()[i].getSeries().length) host.chart.removePane(i);
  }

  function rebuild() {
    clearAll();
    for (const l of live) build(l);
    renderLegends();
  }

  function fill(l: Live) {
    if (l.cfg.type === 'pine') {
      fillPine(l);
      return;
    }
    l.values = computeIndicator(l.cfg, bars);
    const def = INDICATOR_MAP[l.cfg.type];
    const c = host.colors();
    for (const plot of def.plots) {
      const s = l.series.get(plot.key);
      const v = l.values[plot.key] ?? [];
      if (!s) continue;
      if (plot.histogram) {
        (s as ISeriesApi<'Histogram'>).setData(
          bars.map((b, i) =>
            Number.isFinite(v[i]) ? { time: b.time as UTCTimestamp, value: v[i], color: v[i] >= 0 ? c.gain + 'b0' : c.loss + 'b0' } : { time: b.time as UTCTimestamp },
          ),
        );
      } else {
        (s as ISeriesApi<'Line'>).setData(bars.map((b, i) => (Number.isFinite(v[i]) ? { time: b.time as UTCTimestamp, value: v[i] } : { time: b.time as UTCTimestamp })));
      }
    }
  }

  /** New candles: indicators recomputed; a Pine indicator whose plots changed gets new series. */
  function refreshAll() {
    let rebuildNeeded = false;
    for (const l of live) {
      if (l.cfg.type !== 'pine') {
        fill(l);
        continue;
      }
      const wasOverlay = isOverlay(l);
      runPine(l);
      if (pineSig(l) !== l.pine!.sig) {
        if (wasOverlay !== isOverlay(l)) rebuildNeeded = true;
        else {
          unbuild(l);
          buildPine(l, paneIndexOf(l));
          if (!isOverlay(l)) host.chart.panes()[paneIndexOf(l)]?.setStretchFactor(0.32);
        }
      }
      if (!rebuildNeeded) fillPine(l);
    }
    if (rebuildNeeded) rebuild();
    else renderLegends();
  }

  // ---------- legends ----------
  function valueAt(l: Live, key: string) {
    const v = l.values[key] ?? [];
    let i = v.length - 1;
    if (at !== null) {
      i = bars.findIndex((b) => b.time === at);
      if (i < 0) i = v.length - 1;
    }
    const x = v[i];
    return Number.isFinite(x) ? x.toFixed(precision(l)) : '—';
  }

  function row(l: Live) {
    const c = host.colors();
    const r = document.createElement('div');
    Object.assign(r.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '3px',
      pointerEvents: 'auto',
      width: 'fit-content',
      borderRadius: '6px',
      padding: '1px 4px',
      opacity: l.cfg.hidden ? '0.5' : '1',
    });
    r.className = 'btl-ind-row';
    r.dataset.indicator = l.cfg.type;
    const name = document.createElement('span');
    name.textContent = l.cfg.type === 'pine' ? (l.pine?.title ?? 'Pine') : indicatorTitle(l.cfg);
    name.style.opacity = '0.85';
    r.append(name);
    const plots =
      l.cfg.type === 'pine'
        ? (l.pine?.plots ?? []).slice(0, 6).map((p) => ({ key: p.key, color: p.color }))
        : INDICATOR_MAP[l.cfg.type].plots.map((p) => ({ key: p.key, color: l.cfg.colors[p.key] ?? p.color }));
    for (const plot of plots) {
      const v = document.createElement('span');
      v.style.color = plot.color;
      v.style.fontVariantNumeric = 'tabular-nums';
      v.textContent = valueAt(l, plot.key);
      r.append(v);
    }
    if (l.pine?.error) {
      const e = document.createElement('span');
      e.textContent = '⚠ خطا در اسکریپت';
      e.title = l.pine.error;
      e.style.color = c.loss;
      e.style.direction = 'rtl';
      r.append(e);
    }
    const btn = (html: string, title: string, onClick: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = html;
      b.title = title;
      b.setAttribute('aria-label', title);
      Object.assign(b.style, {
        display: 'grid',
        placeItems: 'center',
        width: '20px',
        height: '20px',
        border: 'none',
        borderRadius: '4px',
        background: c.surface,
        color: c.text,
        cursor: 'pointer',
        padding: '0',
      });
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
      return b;
    };
    const tools = document.createElement('span');
    Object.assign(tools.style, { display: 'flex', gap: '2px' });
    tools.className = 'btl-ind-tools';
    tools.append(
      btn(l.cfg.hidden ? ICON.eyeOff : ICON.eye, l.cfg.hidden ? 'نمایش' : 'پنهان کردن', () => api.update({ ...l.cfg, hidden: !l.cfg.hidden })),
      btn(ICON.gear, 'تنظیمات', () => host.onSettings(l.cfg.id)),
      btn(ICON.x, 'حذف', () => api.remove(l.cfg.id)),
    );
    r.append(tools);
    return r;
  }

  function renderLegends() {
    overlayLegend.replaceChildren(...live.filter(isOverlay).map(row));
    const keep = new Set<string>();
    for (const l of live) {
      if (isOverlay(l)) continue;
      keep.add(l.cfg.id);
      let box = paneLegends.get(l.cfg.id);
      if (!box) {
        box = document.createElement('div');
        Object.assign(box.style, { position: 'absolute', left: '10px', fontSize: '12px', direction: 'ltr', whiteSpace: 'nowrap', zIndex: '3', pointerEvents: 'none' });
        host.container.append(box);
        paneLegends.set(l.cfg.id, box);
      }
      box.style.color = host.colors().text;
      box.replaceChildren(row(l));
    }
    for (const [id, box] of paneLegends) {
      if (!keep.has(id)) {
        box.remove();
        paneLegends.delete(id);
      }
    }
    place();
  }

  function place() {
    sessions.render();
    const top = host.container.getBoundingClientRect().top;
    for (const l of live) {
      const box = paneLegends.get(l.cfg.id);
      if (!box) continue;
      const pane = host.chart.panes()[paneIndexOf(l)];
      const el = pane?.getHTMLElement();
      box.style.top = `${(el ? el.getBoundingClientRect().top - top : 0) + 4}px`;
    }
  }

  /** Add a built indicator: an overlay builds alone, a new pane means rebuilding the panes. */
  function insert(l: Live) {
    live.push(l);
    if (l.cfg.type === 'pine') runPine(l);
    if (isOverlay(l)) build(l);
    else rebuild();
    changed();
    return l.cfg.id;
  }

  const api: IndicatorLayer = {
    list: () => live.map((l) => l.cfg),
    add: (type) => insert({ cfg: newIndicator(type), series: new Map(), values: {} }),
    addPine(scriptId) {
      const cfg: IndicatorConfig = { ...newIndicator('pine'), params: {}, colors: {}, pine: { script: scriptId } };
      return insert({ cfg, series: new Map(), values: {} });
    },
    update(cfg) {
      const l = live.find((x) => x.cfg.id === cfg.id);
      if (!l) return;
      const wasOverlay = isOverlay(l);
      l.cfg = structuredClone(cfg);
      // colors, visibility and parameters: rebuild this one's series in place
      unbuild(l);
      if (l.pine) {
        l.pine.key = '';
        runPine(l);
      }
      if (isOverlay(l) && wasOverlay) build(l);
      else rebuild();
      changed();
    },
    remove(id) {
      const i = live.findIndex((x) => x.cfg.id === id);
      if (i < 0) return;
      const [l] = live.splice(i, 1);
      unbuild(l);
      if (!isOverlay(l)) rebuild();
      changed();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    pineInfo(id) {
      const l = live.find((x) => x.cfg.id === id);
      if (!l || l.cfg.type !== 'pine') return null;
      return { title: l.pine?.title ?? 'Pine', inputs: l.pine?.inputs ?? [], error: l.pine?.error ?? null };
    },
    setBars(next) {
      bars = next;
      sessions.setBars(next);
      refreshAll();
    },
    refreshPine() {
      if (!live.some((l) => l.cfg.type === 'pine')) return;
      refreshAll();
      notify();
    },
    crosshair(p) {
      const t = p?.time;
      const next = typeof t === 'number' ? t : null;
      if (next === at) return;
      at = next;
      renderLegends();
    },
    place,
    destroy() {
      clearAll();
      sessions.destroy();
      overlayLegend.remove();
      for (const box of paneLegends.values()) box.remove();
      listeners.clear();
    },
  };

  for (const cfg of initial) if (INDICATOR_MAP[cfg.type] && (cfg.type !== 'pine' || cfg.pine?.script)) live.push({ cfg: structuredClone(cfg), series: new Map(), values: {} });
  for (const l of live) if (l.cfg.type === 'pine') runPine(l);
  for (const l of live) build(l);
  syncSessions();
  return api;
}
