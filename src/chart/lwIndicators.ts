import { HistogramSeries, LineSeries, LineStyle, type IChartApi, type ISeriesApi, type MouseEventParams, type Time, type UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '../lib/market';
import { INDICATOR_MAP, computeIndicator, indicatorTitle, newIndicator, type IndicatorConfig, type IndicatorType } from './indicators';

/**
 * Indicators on the built-in chart: overlays share the candles' pane, oscillators get a pane each
 * below it. Values come only from the bars the replay has shown.
 */

export interface IndicatorApi {
  list(): IndicatorConfig[];
  add(type: IndicatorType): void;
  update(cfg: IndicatorConfig): void;
  remove(id: string): void;
  subscribe(fn: () => void): () => void;
}

export interface IndicatorHost {
  chart: IChartApi;
  container: HTMLElement;
  /** the main legend (symbol and OHLC): overlay indicators are listed under it */
  legend: HTMLElement;
  digits(): number;
  colors(): { text: string; surface: string; grid: string; gain: string; loss: string };
  onChange(list: IndicatorConfig[]): void;
  onSettings(id: string): void;
}

export interface IndicatorLayer extends IndicatorApi {
  setBars(bars: Candle[]): void;
  /** legend values at the crosshair (or the last bar) */
  crosshair(p: MouseEventParams<Time> | null): void;
  /** re-place the oscillator legends after the panes resize */
  place(): void;
  destroy(): void;
}

interface Live {
  cfg: IndicatorConfig;
  series: Map<string, ISeriesApi<'Line'> | ISeriesApi<'Histogram'>>;
  values: Record<string, number[]>;
}

const ICON = {
  eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/></svg>',
  gear: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

export function createIndicatorLayer(host: IndicatorHost, initial: IndicatorConfig[]): IndicatorLayer {
  const live: Live[] = [];
  const listeners = new Set<() => void>();
  let bars: Candle[] = [];
  let at: number | null = null;
  const paneLegends = new Map<string, HTMLDivElement>();
  const overlayLegend = document.createElement('div');
  host.legend.append(overlayLegend);

  const notify = () => listeners.forEach((f) => f());
  const changed = () => {
    host.onChange(live.map((l) => l.cfg));
    renderLegends();
    notify();
  };

  function precision(cfg: IndicatorConfig) {
    return cfg.type === 'rsi' || cfg.type === 'stoch' ? 2 : host.digits() + (cfg.type === 'macd' ? 1 : 0);
  }

  /** oscillator panes are numbered by their order in the list, after the candles' pane */
  function paneIndexOf(l: Live) {
    if (INDICATOR_MAP[l.cfg.type].overlay) return 0;
    return 1 + live.filter((x) => !INDICATOR_MAP[x.cfg.type].overlay).indexOf(l);
  }

  function build(l: Live) {
    const def = INDICATOR_MAP[l.cfg.type];
    const pane = paneIndexOf(l);
    const p = precision(l.cfg);
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
    const first = l.series.get(def.plots.find((x) => !x.histogram)?.key ?? def.plots[0].key);
    for (const level of def.levels ?? [])
      first?.createPriceLine({ price: level, color: host.colors().grid, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '' });
    if (!def.overlay) host.chart.panes()[pane]?.setStretchFactor(0.32);
    fill(l);
  }

  function clearAll() {
    for (const l of live) {
      for (const s of l.series.values()) host.chart.removeSeries(s);
      l.series.clear();
    }
    // drop the oscillator panes left empty
    for (let i = host.chart.panes().length - 1; i > 0; i--) if (!host.chart.panes()[i].getSeries().length) host.chart.removePane(i);
  }

  function rebuild() {
    clearAll();
    for (const l of live) build(l);
    renderLegends();
  }

  function fill(l: Live) {
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

  // ---------- legends ----------
  function valueAt(l: Live, key: string) {
    const v = l.values[key] ?? [];
    let i = v.length - 1;
    if (at !== null) {
      i = bars.findIndex((b) => b.time === at);
      if (i < 0) i = v.length - 1;
    }
    const x = v[i];
    return Number.isFinite(x) ? x.toFixed(precision(l.cfg)) : '—';
  }

  function row(l: Live) {
    const def = INDICATOR_MAP[l.cfg.type];
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
    name.textContent = indicatorTitle(l.cfg);
    name.style.opacity = '0.85';
    r.append(name);
    for (const plot of def.plots) {
      const v = document.createElement('span');
      v.style.color = l.cfg.colors[plot.key] ?? plot.color;
      v.style.fontVariantNumeric = 'tabular-nums';
      v.textContent = valueAt(l, plot.key);
      r.append(v);
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
    overlayLegend.replaceChildren(...live.filter((l) => INDICATOR_MAP[l.cfg.type].overlay).map(row));
    const keep = new Set<string>();
    for (const l of live) {
      if (INDICATOR_MAP[l.cfg.type].overlay) continue;
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
    const top = host.container.getBoundingClientRect().top;
    for (const l of live) {
      const box = paneLegends.get(l.cfg.id);
      if (!box) continue;
      const pane = host.chart.panes()[paneIndexOf(l)];
      const el = pane?.getHTMLElement();
      box.style.top = `${(el ? el.getBoundingClientRect().top - top : 0) + 4}px`;
    }
  }

  const api: IndicatorLayer = {
    list: () => live.map((l) => l.cfg),
    add(type) {
      const l: Live = { cfg: newIndicator(type), series: new Map(), values: {} };
      live.push(l);
      if (INDICATOR_MAP[type].overlay) build(l);
      else rebuild();
      changed();
    },
    update(cfg) {
      const l = live.find((x) => x.cfg.id === cfg.id);
      if (!l) return;
      l.cfg = structuredClone(cfg);
      // colors, visibility and parameters: rebuild this one's series in place
      for (const s of l.series.values()) host.chart.removeSeries(s);
      l.series.clear();
      if (INDICATOR_MAP[cfg.type].overlay) build(l);
      else rebuild();
      changed();
    },
    remove(id) {
      const i = live.findIndex((x) => x.cfg.id === id);
      if (i < 0) return;
      const [l] = live.splice(i, 1);
      for (const s of l.series.values()) host.chart.removeSeries(s);
      if (!INDICATOR_MAP[l.cfg.type].overlay) rebuild();
      changed();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setBars(next) {
      bars = next;
      for (const l of live) fill(l);
      renderLegends();
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
      overlayLegend.remove();
      for (const box of paneLegends.values()) box.remove();
      listeners.clear();
    },
  };

  for (const cfg of initial) if (INDICATOR_MAP[cfg.type]) live.push({ cfg: structuredClone(cfg), series: new Map(), values: {} });
  for (const l of live) build(l);
  return api;
}
