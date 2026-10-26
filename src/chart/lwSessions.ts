import type { IChartApi, ISeriesApi, Logical } from 'lightweight-charts';
import type { Candle } from '../lib/market';
import { rgba, sessionBoxes, type SessionBox, type SessionsConfig } from './sessions';

/**
 * The «سشن‌ها» indicator on the built-in chart: an SVG under the drawings with one box per session and
 * day, its top and bottom lines at the session's high and low. Boxes are worked out when the bars or the
 * settings change, and only the ones in view are drawn when the view moves.
 */

export interface SessionsHost {
  chart: IChartApi;
  series: ISeriesApi<'Candlestick'>;
  container: HTMLElement;
  barSec(): number;
  /** the candles' pane: plot width (without the price axis) and height */
  plotBox(): { w: number; h: number };
}

export interface SessionsLayer {
  setBars(bars: Candle[]): void;
  /** one entry per sessions indicator on the chart (hidden ones left out) */
  setConfigs(list: SessionsConfig[]): void;
  render(): void;
  destroy(): void;
}

const NS = 'http://www.w3.org/2000/svg';
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.append(e);
  return e;
}

export function createSessionsLayer(host: SessionsHost): SessionsLayer {
  let bars: Candle[] = [];
  let configs: SessionsConfig[] = [];
  let boxes: { cfg: SessionsConfig; box: SessionBox }[] = [];
  const svg = el('svg', { class: 'btl-sessions' });
  Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', overflow: 'hidden', direction: 'ltr' });
  // under the drawings and the trade overlay: right after the chart itself
  const chartEl = host.chart.chartElement();
  host.container.insertBefore(svg, chartEl.nextSibling);

  function compute() {
    boxes = configs.flatMap((cfg) => sessionBoxes(bars, cfg, host.barSec()).map((box) => ({ cfg, box })));
  }

  function render() {
    const { w, h } = host.plotBox();
    svg.setAttribute('width', String(Math.max(0, w)));
    svg.setAttribute('height', String(Math.max(0, h)));
    svg.replaceChildren();
    if (!boxes.length || w <= 0 || h <= 0) return;
    const ts = host.chart.timeScale();
    const a = ts.logicalToCoordinate(0 as Logical);
    const b = ts.logicalToCoordinate(1 as Logical);
    if (a === null || b === null) return;
    const X = (l: number) => a + (b - a) * l;
    const range = ts.getVisibleLogicalRange();
    const font = 'Vazirmatn Variable, Vazirmatn, Tahoma, sans-serif';
    for (const { cfg, box } of boxes) {
      if (range && (box.to < range.from - 1 || box.from > range.to + 1)) continue;
      const s = cfg.sessions[box.session];
      const x0 = X(box.from - 0.5);
      const x1 = X(box.to + 0.5);
      const yh = host.series.priceToCoordinate(box.high);
      const yl = host.series.priceToCoordinate(box.low);
      if (yh === null || yl === null || x1 < 0 || x0 > w) continue;
      const g = el('g', { 'data-session': s.name }, svg);
      if (cfg.fill) el('rect', { x: x0, y: yh, width: Math.max(1, x1 - x0), height: Math.max(1, yl - yh), fill: rgba(s.color, 0.09) }, g);
      // the sides faint, the high and low clear
      for (const x of [x0, x1]) el('line', { x1: x, y1: yh, x2: x, y2: yl, stroke: rgba(s.color, 0.45), 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
      for (const y of [yh, yl]) el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: s.color, 'stroke-width': 1.5 }, g);
      if (cfg.labels && x1 - x0 > 24) {
        const t = el('text', { x: x0 + 4, y: yh - 4, fill: s.color, 'font-size': 11, 'font-weight': 600, 'font-family': font }, g);
        t.textContent = s.name;
      }
    }
  }

  return {
    setBars(next) {
      bars = next;
      compute();
      render();
    },
    setConfigs(list) {
      configs = list;
      compute();
      render();
    },
    render,
    destroy() {
      svg.remove();
    },
  };
}
