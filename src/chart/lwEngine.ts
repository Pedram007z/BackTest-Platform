import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type LogicalRange,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { PALETTES } from '../hooks/useChartTheme';
import { SYMBOL_MAP, TF_MS, candleTime, dayIndexOf, getCandles, isTradingDay, roundToTick, type Candle } from '../lib/market';
import { IMPACT_LABEL, newsTitleFa, type NewsEvent } from '../lib/news';
import { fmtTehran } from '../lib/timezone';
import { dirOf, openPnl, orderTitleEn } from '../lib/trading';
import type { Trade } from '../lib/types';
import { readLwLayout, writeLwLayout } from './drawings';
import { createDrawingLayer } from './lwDrawings';
import { createIndicatorLayer } from './lwIndicators';
import type { ChartEngine, DraftOrder, EngineCallbacks, EngineState } from './types';

/**
 * Replay chart on lightweight-charts with a DOM overlay for what the library does not draw:
 * the long/short position tool, draggable stop and target labels, and calendar flags. Drawing
 * tools (lwDrawings) and indicators (lwIndicators) are kept per session pane in this browser.
 */

const HISTORY = 500;
const FUTURE = 90;

type DragTarget =
  | { kind: 'draft'; field: 'entry' | 'sl' | 'tp' | 'all'; startY: number; start: { entry: number; sl: number; tp: number } }
  | { kind: 'line'; tradeId: string; field: 'entry' | 'sl' | 'tp' };

const IMPACT_COLOR: Record<string, string> = { high: '#f25466', medium: '#f5a524', low: '#e8d44d', holiday: '#9b9bb0' };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, style: Partial<CSSStyleDeclaration> = {}, cls = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (cls) e.className = cls;
  return e;
}

const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

export function createLwEngine(container: HTMLElement, initial: EngineState, cb: EngineCallbacks): ChartEngine {
  let state = initial;
  let pal = PALETTES[state.theme];

  container.style.position = 'relative';
  // z-index 0 keeps the library's layered canvases under the drawings and the overlay
  const chartEl = el('div', { position: 'absolute', inset: '0', zIndex: '0' });
  const overlay = el('div', { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden', direction: 'ltr', fontFamily: 'var(--font-ui)' });
  const legend = el('div', { position: 'absolute', left: '10px', top: '8px', fontSize: '12px', pointerEvents: 'none', direction: 'ltr', whiteSpace: 'nowrap', zIndex: '3' });
  const ohlc = el('div');
  legend.append(ohlc);
  container.append(chartEl, overlay, legend);
  const activate = () => cb.onActivate?.();
  container.addEventListener('pointerdown', activate);

  const chart: IChartApi = createChart(chartEl, {
    autoSize: true,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, fontFamily: 'Vazirmatn Variable, Vazirmatn, Tahoma, sans-serif', fontSize: 11, attributionLogo: false },
    crosshair: { mode: CrosshairMode.Normal },
    timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 0, shiftVisibleRangeOnNewBar: false },
    rightPriceScale: { scaleMargins: { top: 0.12, bottom: 0.12 } },
    localization: { locale: 'en-US' },
  });
  const series: ISeriesApi<'Candlestick'> = chart.addSeries(CandlestickSeries, { borderVisible: false });
  // invisible series holding empty future times, so upcoming news and the position tool have room on the right
  const spacer: ISeriesApi<'Line'> = chart.addSeries(LineSeries, { lineVisible: false, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
  const markers: ISeriesMarkersPluginApi<Time> = createSeriesMarkers(series, []);

  let candles: Candle[] = [];
  /** empty bar times after the last candle (room for drawings, news and the position tool) */
  let future: number[] = [];
  let loadedKey = '';
  /** Cursor of the last load: a daily candle can carry a later date than the cursor (Sunday evening is Monday). */
  let loadedCursor = 0;
  let priceLines: IPriceLine[] = [];
  /** entry / stop / target labels of the position tool on the price axis */
  let draftLines: IPriceLine[] = [];
  let drag: DragTarget | null = null;
  let dragPrices: { entry: number; sl: number; tp: number } | null = null;
  let lineDrag: { tradeId: string; field: 'entry' | 'sl' | 'tp'; price: number } | null = null;
  let hoverCard: HTMLDivElement | null = null;
  let destroyed = false;

  const digits = () => SYMBOL_MAP[state.symbol]?.digits ?? 2;
  const fmt = (p: number) => p.toFixed(digits());
  const tfSec = () => TF_MS[state.timeframe] / 1000;

  // ---------- drawings and indicators (saved per session pane) ----------
  const layout = readLwLayout(state.layoutKey);
  const colors = () => ({ text: pal.text, surface: pal.surface, grid: pal.grid, gain: pal.gain, loss: pal.loss });
  const drawings = createDrawingLayer(
    {
      container,
      before: overlay,
      chart,
      series,
      times: () => (future.length ? candles.map((c) => c.time).concat(future) : candles.map((c) => c.time)),
      candles: () => candles,
      stepSec: () => tfSec(),
      digits: () => digits(),
      pip: () => SYMBOL_MAP[state.symbol]?.pip ?? 1,
      roundPrice: (p) => roundToTick(state.symbol, p),
      colors,
      paneHeight: () => plotBox().h,
      plotWidth: () => chart.timeScale().width(),
      onChange: (all) => {
        layout.drawings = all;
        writeLwLayout(state.layoutKey, layout);
      },
    },
    state.symbol,
    layout.drawings,
  );
  const indicators = createIndicatorLayer(
    {
      chart,
      container,
      legend,
      digits: () => digits(),
      colors,
      onChange: (list) => {
        layout.indicators = list;
        writeLwLayout(state.layoutKey, layout);
      },
      onSettings: (id) => cb.onIndicatorSettings?.(id),
    },
    layout.indicators,
  );

  // ---------- theme ----------
  function applyTheme() {
    pal = PALETTES[state.theme];
    chart.applyOptions({
      layout: { textColor: pal.axis },
      grid: { vertLines: { color: pal.grid + '70' }, horzLines: { color: pal.grid + '70' } },
      rightPriceScale: { borderColor: pal.grid },
      timeScale: { borderColor: pal.grid },
      crosshair: { vertLine: { labelBackgroundColor: pal.accent }, horzLine: { labelBackgroundColor: pal.accent } },
    });
    series.applyOptions({ upColor: pal.candleUp, downColor: pal.candleDown, wickUpColor: pal.candleUp, wickDownColor: pal.candleDown });
    legend.style.color = pal.text;
  }

  // ---------- data ----------
  function futureTimes(lastSec: number): { time: UTCTimestamp }[] {
    const sym = SYMBOL_MAP[state.symbol];
    const step = tfSec();
    const out: { time: UTCTimestamp }[] = [];
    let t = lastSec;
    for (let guard = 0; out.length < FUTURE && guard < FUTURE * 4; guard++) {
      t += step;
      if (sym && !sym.weekends && !isTradingDay(sym, dayIndexOf(t * 1000))) continue;
      out.push({ time: t as UTCTimestamp });
    }
    return out;
  }

  function setFuture(lastSec: number) {
    const f = futureTimes(lastSec);
    future = f.map((x) => x.time);
    spacer.setData(f);
  }

  function loadData() {
    const key = `${state.symbol}:${state.timeframe}:${state.dataVersion}`;
    const lastSec = candles[candles.length - 1]?.time ?? 0;
    const behind = state.cursor < loadedCursor;
    const farJump = state.cursor / 1000 - lastSec > tfSec() * 300;
    const ts = chart.timeScale();
    loadedCursor = state.cursor;

    if (key !== loadedKey || behind || farJump || candles.length === 0) {
      const sameSeries = key.split(':').slice(0, 2).join(':') === loadedKey.split(':').slice(0, 2).join(':');
      candles = getCandles(state.symbol, state.timeframe, state.cursor, HISTORY);
      series.applyOptions({ priceFormat: { type: 'price', precision: digits(), minMove: 1 / 10 ** digits() } });
      chart.applyOptions({ timeScale: { secondsVisible: tfSec() < 60 } });
      series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
      setFuture(candles[candles.length - 1]?.time ?? state.cursor / 1000);
      indicators.setBars(candles);
      const n = candles.length;
      if (!sameSeries || !loadedKey || farJump || behind) ts.setVisibleLogicalRange({ from: Math.max(0, n - 120), to: n + 28 });
      loadedKey = key;
      return;
    }

    // incremental: append / update the forming candles, keep the view following the last bar
    const range = ts.getVisibleLogicalRange();
    const prevLast = candles.length - 1;
    const following = range ? range.to >= prevLast - 1 : true;
    const recent = getCandles(state.symbol, state.timeframe, state.cursor, 60);
    for (const c of recent) {
      const last = candles[candles.length - 1];
      if (last && c.time < last.time) continue;
      if (last && c.time === last.time) candles[candles.length - 1] = c;
      else candles.push(c);
      series.update({ ...c, time: c.time as UTCTimestamp });
    }
    const added = candles.length - 1 - prevLast;
    if (added > 0) setFuture(candles[candles.length - 1].time);
    indicators.setBars(candles);
    if (range && added > 0 && following) ts.setVisibleLogicalRange({ from: range.from + added, to: range.to + added } as LogicalRange);
  }

  // ---------- legend ----------
  function setLegend(c: Candle | undefined) {
    const sym = SYMBOL_MAP[state.symbol];
    if (!c || !sym) {
      ohlc.textContent = '';
      return;
    }
    const up = c.close >= c.open;
    const col = up ? pal.candleUp : pal.candleDown;
    const chg = ((c.close - c.open) / c.open) * 100;
    ohlc.innerHTML =
      `<b style="font-weight:700">${sym.ticker}</b> <span style="opacity:.6">· ${state.timeframe} · BacktestLab</span>&nbsp;&nbsp;` +
      ['O', 'H', 'L', 'C'].map((k, i) => `<span style="opacity:.6">${k}</span><span style="color:${col}">${fmt([c.open, c.high, c.low, c.close][i])}</span>`).join(' ') +
      ` <span style="color:${col}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`;
  }
  chart.subscribeCrosshairMove((p) => {
    const d = p.time !== undefined ? (p.seriesData.get(series) as Candle | undefined) : undefined;
    setLegend(d && 'open' in d ? d : candles[candles.length - 1]);
    indicators.crosshair(p.time !== undefined ? p : null);
  });

  // ---------- trade lines (library price lines) + history markers ----------
  function drawTrades() {
    for (const l of priceLines) series.removePriceLine(l);
    priceLines = [];
    for (const t of state.trades) {
      if (t.status !== 'open' && t.status !== 'pending') continue;
      const pending = t.status === 'pending';
      const entry = lineDrag?.tradeId === t.id && lineDrag.field === 'entry' ? lineDrag.price : t.entry;
      const sl = lineDrag?.tradeId === t.id && lineDrag.field === 'sl' ? lineDrag.price : t.sl;
      const tp = lineDrag?.tradeId === t.id && lineDrag.field === 'tp' ? lineDrag.price : t.tp;
      priceLines.push(
        series.createPriceLine({
          price: entry,
          color: pending ? pal.accent : pal.line,
          lineWidth: 1,
          lineStyle: pending ? LineStyle.Dashed : LineStyle.Solid,
          axisLabelVisible: true,
          title: '',
        }),
        series.createPriceLine({ price: sl, color: pal.loss, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '' }),
      );
      if (tp > 0) priceLines.push(series.createPriceLine({ price: tp, color: pal.gain, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '' }));
    }
    const list: SeriesMarker<Time>[] = [];
    const sym = SYMBOL_MAP[state.symbol];
    const barOf = (t: number) => (sym ? candleTime(sym, state.timeframe, t) : Math.floor(t / TF_MS[state.timeframe]) * TF_MS[state.timeframe]) / 1000;
    const first = candles[0]?.time ?? 0;
    for (const t of state.trades) {
      if (t.status === 'pending' || t.status === 'cancelled') continue;
      if (t.status === 'closed' && !state.showHistory) continue;
      const openSec = barOf(t.openTime);
      if (openSec >= first && t.openTime <= state.cursor)
        list.push({
          time: openSec as UTCTimestamp,
          position: t.side === 'buy' ? 'belowBar' : 'aboveBar',
          shape: t.side === 'buy' ? 'arrowUp' : 'arrowDown',
          color: t.side === 'buy' ? pal.gain : pal.loss,
          size: 1,
        });
      if (t.status === 'closed' && t.closeTime) {
        const closeSec = barOf(t.closeTime - 1);
        if (closeSec >= first)
          list.push({
            time: closeSec as UTCTimestamp,
            position: t.side === 'buy' ? 'aboveBar' : 'belowBar',
            shape: 'circle',
            color: (t.pnl ?? 0) >= 0 ? pal.gain : pal.loss,
            size: 0.6,
            text: `${(t.r ?? 0) >= 0 ? '+' : ''}${(t.r ?? 0).toFixed(1)}R`,
          });
      }
    }
    list.sort((a, b) => (a.time as number) - (b.time as number));
    markers.setMarkers(list);
  }

  // ---------- overlay ----------
  /** the candles' pane (indicator panes sit below it) */
  function plotBox() {
    const ts = chart.timeScale();
    return { w: ts.width(), h: chart.panes()[0]?.getHeight() ?? container.clientHeight - ts.height() };
  }

  const y = (price: number) => series.priceToCoordinate(price);

  function lastBarX(): number | null {
    const last = candles[candles.length - 1];
    if (!last) return null;
    return chart.timeScale().timeToCoordinate(last.time as UTCTimestamp);
  }

  function priceAtY(py: number): number | null {
    const p = series.coordinateToPrice(py);
    return p === null ? null : roundToTick(state.symbol, p as number);
  }

  function startDrag(e: PointerEvent, target: DragTarget) {
    e.preventDefault();
    e.stopPropagation();
    drag = target;
    if (target.kind === 'draft') dragPrices = { ...target.start };
    const move = (ev: PointerEvent) => onDrag(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      finishDrag();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function onDrag(e: PointerEvent) {
    if (!drag) return;
    const rect = container.getBoundingClientRect();
    const py = e.clientY - rect.top;
    const price = priceAtY(py);
    if (price === null) return;
    if (drag.kind === 'draft') {
      const s = drag.start;
      if (drag.field === 'all') {
        const startPrice = priceAtY(drag.startY);
        if (startPrice === null) return;
        const d = price - startPrice;
        dragPrices = { entry: roundToTick(state.symbol, s.entry + d), sl: roundToTick(state.symbol, s.sl + d), tp: roundToTick(state.symbol, s.tp + d) };
      } else {
        const cur = dragPrices ?? s;
        const dir = dirOf(state.draft?.side ?? 'buy');
        const tick = 10 ** -digits();
        let p = price;
        // the stop stays on the losing side of the entry and the target on the winning side
        if (drag.field === 'sl' && dir * (cur.entry - p) <= 0) p = cur.entry - dir * tick;
        if (drag.field === 'tp' && dir * (p - cur.entry) <= 0) p = cur.entry + dir * tick;
        if (drag.field === 'entry') {
          if (dir * (p - cur.sl) <= 0) p = cur.sl + dir * tick;
          if (dir * (cur.tp - p) <= 0) p = cur.tp - dir * tick;
        }
        dragPrices = { ...cur, [drag.field]: roundToTick(state.symbol, p) };
      }
      cb.onDraftChange(dragPrices);
    } else {
      lineDrag = { tradeId: drag.tradeId, field: drag.field, price };
      drawTrades();
    }
    render();
  }

  function finishDrag() {
    if (drag?.kind === 'line' && lineDrag) cb.onLineMove(lineDrag.tradeId, lineDrag.field, lineDrag.price);
    if (drag?.kind === 'draft' && dragPrices) cb.onDraftChange(dragPrices);
    drag = null;
    dragPrices = null;
    lineDrag = null;
    drawTrades();
    render();
  }

  function draftGeometry(d: DraftOrder) {
    const prices = dragPrices ?? { entry: d.entry, sl: d.sl, tp: d.tp };
    const { w } = plotBox();
    const lx = lastBarX();
    const x0 = Math.max(0, Math.min(w - 160, (lx ?? w * 0.7) + 6));
    const width = Math.max(150, Math.min(300, w - x0 - 8));
    return { prices, x0, width, ye: y(prices.entry), ys: y(prices.sl), yt: y(prices.tp) };
  }

  function chip(text: string, bg: string, fg = '#fff') {
    const c = el('div', {
      position: 'absolute',
      padding: '1px 6px',
      borderRadius: '4px',
      background: bg,
      color: fg,
      fontSize: '11px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      lineHeight: '18px',
      fontVariantNumeric: 'tabular-nums',
    });
    c.textContent = text;
    return c;
  }

  function handleBar(top: number, left: number, width: number, color: string, onDown: (e: PointerEvent) => void, title: string, field: string) {
    const h = el('div', { position: 'absolute', left: `${left}px`, top: `${top - 7}px`, width: `${width}px`, height: '14px', cursor: 'ns-resize', pointerEvents: 'auto' });
    h.title = title;
    h.dataset.draftHandle = field;
    const line = el('div', { position: 'absolute', left: '0', right: '0', top: '6px', height: '2px', background: color });
    h.append(line);
    for (const side of ['left', 'right'] as const) {
      h.append(
        el('div', {
          position: 'absolute',
          [side]: '-6px',
          top: '1px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#fff',
          border: `2px solid ${color}`,
          boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0,0,0,.35)',
        }),
      );
    }
    h.addEventListener('pointerdown', onDown);
    return h;
  }

  function renderDraft(frag: DocumentFragment) {
    const d = state.draft;
    if (!d) return;
    const g = draftGeometry(d);
    if (g.ye === null || g.ys === null || g.yt === null) return;
    const { x0, width, ye, ys, yt, prices } = g;
    const sym = SYMBOL_MAP[state.symbol];
    const pip = sym?.pip ?? 1;
    const profit = el('div', {
      position: 'absolute',
      left: `${x0}px`,
      width: `${width}px`,
      top: `${Math.min(ye, yt)}px`,
      height: `${Math.abs(yt - ye)}px`,
      background: 'rgba(38,194,129,0.18)',
      pointerEvents: 'auto',
      cursor: 'move',
    });
    const loss = el('div', {
      position: 'absolute',
      left: `${x0}px`,
      width: `${width}px`,
      top: `${Math.min(ye, ys)}px`,
      height: `${Math.abs(ys - ye)}px`,
      background: 'rgba(242,84,102,0.18)',
      pointerEvents: 'auto',
      cursor: 'move',
    });
    const start = { entry: d.entry, sl: d.sl, tp: d.tp };
    for (const box of [profit, loss])
      box.addEventListener('pointerdown', (e) => startDrag(e, { kind: 'draft', field: 'all', startY: e.clientY - container.getBoundingClientRect().top, start }));
    frag.append(profit, loss);

    const dir = dirOf(d.side);
    const tpDist = (prices.tp - prices.entry) * dir;
    const slDist = (prices.entry - prices.sl) * dir;
    const tpLabel = chip(`Target: ${(tpDist / pip).toFixed(1)} pips (${((tpDist / prices.entry) * 100).toFixed(2)}%)  ${money(d.rewardUsd)}`, pal.gain);
    tpLabel.style.left = `${x0 + width / 2}px`;
    tpLabel.style.transform = 'translateX(-50%)';
    tpLabel.style.top = `${(dir > 0 ? Math.min(yt, ye) : Math.max(yt, ye)) + (dir > 0 ? -22 : 4)}px`;
    const slLabel = chip(`Stop: ${(slDist / pip).toFixed(1)} pips (${((slDist / prices.entry) * 100).toFixed(2)}%)  ${money(-d.riskUsd)}`, pal.loss);
    slLabel.style.left = `${x0 + width / 2}px`;
    slLabel.style.transform = 'translateX(-50%)';
    slLabel.style.top = `${(dir > 0 ? Math.max(ys, ye) : Math.min(ys, ye)) + (dir > 0 ? 4 : -22)}px`;
    const mid = chip(`${orderTitleEn(d.side, d.type)} · ${d.lots} lots · R:R ${d.rr.toFixed(2)}`, pal.surface, pal.text);
    mid.style.border = `1px solid ${pal.grid}`;
    mid.style.left = `${x0 + width / 2}px`;
    mid.style.transform = 'translate(-50%, -50%)';
    mid.style.top = `${ye}px`;
    mid.style.pointerEvents = 'none';
    frag.append(
      handleBar(yt, x0, width, pal.gain, (e) => startDrag(e, { kind: 'draft', field: 'tp', startY: 0, start }), 'حد سود (TP): برای جابه‌جایی بکشید', 'tp'),
      handleBar(ys, x0, width, pal.loss, (e) => startDrag(e, { kind: 'draft', field: 'sl', startY: 0, start }), 'حد ضرر (SL): برای جابه‌جایی بکشید', 'sl'),
      handleBar(ye, x0, width, pal.line, (e) => startDrag(e, { kind: 'draft', field: 'entry', startY: 0, start }), 'قیمت ورود: برای سفارش لیمیت یا استاپ بکشید', 'entry'),
      tpLabel,
      slLabel,
      mid,
    );
  }

  function renderTradeChips(frag: DocumentFragment) {
    const price = candles[candles.length - 1]?.close ?? 0;
    for (const t of state.trades) {
      if (t.status !== 'open' && t.status !== 'pending') continue;
      const cur = (field: 'entry' | 'sl' | 'tp') => (lineDrag?.tradeId === t.id && lineDrag.field === field ? lineDrag.price : t[field]);
      const right = 8;
      const ye = y(cur('entry'));
      if (ye !== null) {
        const pnl = openPnl(t, price);
        const box = el('div', {
          position: 'absolute',
          top: `${ye - 10}px`,
          display: 'flex',
          alignItems: 'stretch',
          pointerEvents: 'auto',
          borderRadius: '4px',
          overflow: 'hidden',
          border: `1px solid ${t.status === 'pending' ? pal.accent : pal.line}`,
          fontSize: '11px',
          fontWeight: '600',
          background: pal.surface,
          color: pal.text,
          fontVariantNumeric: 'tabular-nums',
        });
        box.style.right = `${chart.priceScale('right').width() + right}px`;
        const sideTag = el('span', { padding: '1px 6px', background: t.side === 'buy' ? pal.gain : pal.loss, color: '#fff' });
        sideTag.textContent = t.status === 'pending' ? orderTitleEn(t.side, t.orderType).toUpperCase() : t.side.toUpperCase();
        const qty = el('span', { padding: '1px 6px', borderInlineEnd: `1px solid ${pal.grid}` });
        qty.textContent = `${t.lots}`;
        box.append(sideTag, qty);
        if (t.status === 'open') {
          const pl = el('span', { padding: '1px 6px', color: pnl >= 0 ? pal.gain : pal.loss });
          pl.textContent = money(pnl);
          box.append(pl);
        } else {
          box.style.cursor = 'ns-resize';
          box.title = 'برای جابه‌جایی قیمت ورود بکشید';
          box.addEventListener('pointerdown', (e) => {
            if ((e.target as HTMLElement).dataset.close) return;
            startDrag(e, { kind: 'line', tradeId: t.id, field: 'entry' });
          });
        }
        const x = el('button', {
          padding: '0 6px',
          background: 'transparent',
          color: pal.text,
          border: 'none',
          borderInlineStart: `1px solid ${pal.grid}`,
          cursor: 'pointer',
          font: 'inherit',
        });
        x.textContent = '✕';
        x.dataset.close = '1';
        x.title = t.status === 'open' ? 'بستن کامل یا بخشی از پوزیشن' : 'لغو سفارش';
        x.setAttribute('aria-label', x.title);
        x.addEventListener('pointerdown', (e) => e.stopPropagation());
        x.addEventListener('click', (e) => {
          e.stopPropagation();
          cb.onLineClose(t.id);
        });
        box.append(x);
        frag.append(box);
      }
      for (const field of ['sl', 'tp'] as const) {
        const p = cur(field);
        if (field === 'tp' && !(p > 0)) continue;
        const py = y(p);
        if (py === null) continue;
        const usd = (p - t.entry) * dirOf(t.side) * t.pointValue * t.lots;
        const c = chip(`${field.toUpperCase()}  ${money(usd)}`, field === 'sl' ? pal.loss : pal.gain);
        c.style.right = `${chart.priceScale('right').width() + 8}px`;
        c.style.top = `${py - 10}px`;
        c.style.pointerEvents = 'auto';
        c.style.cursor = 'ns-resize';
        c.title = field === 'sl' ? 'برای جابه‌جایی حد ضرر بکشید' : 'برای جابه‌جایی حد سود بکشید';
        c.addEventListener('pointerdown', (e) => startDrag(e, { kind: 'line', tradeId: t.id, field }));
        frag.append(c);
      }
    }
  }

  function showNewsCard(anchor: HTMLElement, events: NewsEvent[]) {
    hideNewsCard();
    const card = el('div', {
      position: 'absolute',
      zIndex: '10',
      minWidth: '220px',
      maxWidth: '300px',
      padding: '8px 10px',
      borderRadius: '10px',
      background: pal.tooltipBg,
      border: `1px solid ${pal.tooltipBorder}`,
      color: pal.text,
      fontSize: '12px',
      direction: 'rtl',
      boxShadow: '0 12px 30px -10px rgba(0,0,0,.5)',
    });
    for (const ev of events) {
      const row = el('div', { padding: '3px 0' });
      const past = ev.time <= state.cursor;
      row.innerHTML =
        `<div style="display:flex;gap:6px;align-items:center"><span style="width:8px;height:8px;border-radius:2px;background:${IMPACT_COLOR[ev.impact]}"></span>` +
        `<b>${ev.currency}</b><span style="opacity:.7">${fmtTehran(ev.time)} تهران · ${IMPACT_LABEL[ev.impact]}</span></div>` +
        `<div>${newsTitleFa(ev.title)}</div>` +
        (ev.forecast || ev.previous || ev.actual
          ? `<div style="opacity:.75;direction:ltr;text-align:right">A: ${past ? (ev.actual ?? '—') : '—'} · F: ${ev.forecast ?? '—'} · P: ${ev.previous ?? '—'}</div>`
          : '');
      card.append(row);
    }
    const r = anchor.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const or = overlay.getBoundingClientRect();
    card.style.left = `${Math.max(4, Math.min(cr.width - 304, r.left - cr.left - 110))}px`;
    card.style.bottom = `${or.bottom - r.top + 6}px`;
    overlay.append(card);
    hoverCard = card;
  }
  function hideNewsCard() {
    hoverCard?.remove();
    hoverCard = null;
  }

  function renderNews(frag: DocumentFragment) {
    if (!state.news.length) return;
    const ts = chart.timeScale();
    const { h, w } = plotBox();
    const sym = SYMBOL_MAP[state.symbol];
    const step = TF_MS[state.timeframe];
    const groups = new Map<number, NewsEvent[]>();
    for (const ev of state.news) {
      const b = sym ? candleTime(sym, state.timeframe, ev.time) : Math.floor(ev.time / step) * step;
      if (!groups.has(b)) groups.set(b, []);
      groups.get(b)!.push(ev);
    }
    const order = ['high', 'medium', 'low', 'holiday'];
    for (const [bucket, events] of groups) {
      const x = ts.timeToCoordinate((bucket / 1000) as UTCTimestamp);
      if (x === null || x < 0 || x > w) continue;
      const top = events.sort((a, b) => order.indexOf(a.impact) - order.indexOf(b.impact))[0];
      const future = events.every((e) => e.time > state.cursor);
      if (future) {
        frag.append(el('div', { position: 'absolute', left: `${x}px`, top: '0', height: `${h}px`, borderLeft: `1px dashed ${IMPACT_COLOR[top.impact]}`, opacity: '0.7' }));
      }
      const flag = el('div', {
        position: 'absolute',
        left: `${x - 9}px`,
        top: `${h - 22}px`,
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: IMPACT_COLOR[top.impact],
        color: '#111',
        fontSize: '8px',
        fontWeight: '800',
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'auto',
        cursor: 'pointer',
        boxShadow: `0 0 0 2px ${pal.bg}`,
        opacity: future ? '0.85' : '1',
      });
      flag.textContent = top.currency.slice(0, 2);
      flag.setAttribute('role', 'button');
      flag.setAttribute('aria-label', `${top.currency} ${newsTitleFa(top.title)}`);
      flag.addEventListener('pointerenter', () => showNewsCard(flag, events));
      flag.addEventListener('pointerleave', hideNewsCard);
      flag.addEventListener('click', () => cb.onNewsClick?.(top));
      frag.append(flag);
    }
  }

  let lastSig = '';
  function signature() {
    const ts = chart.timeScale();
    const r = ts.getVisibleLogicalRange();
    const ps = series.priceToCoordinate(candles[candles.length - 1]?.close ?? 0);
    return `${r?.from.toFixed(3)}|${r?.to.toFixed(3)}|${ps}|${container.clientWidth}x${container.clientHeight}|${ts.width()}|${plotBox().h}|${chart.panes().length}`;
  }

  /** the position tool's prices on the price axis */
  function syncDraftLines() {
    for (const l of draftLines) series.removePriceLine(l);
    draftLines = [];
    const d = state.draft;
    if (!d) return;
    const p = dragPrices ?? { entry: d.entry, sl: d.sl, tp: d.tp };
    const line = (price: number, color: string, title: string) =>
      series.createPriceLine({ price, color, lineVisible: false, axisLabelVisible: true, axisLabelColor: color, axisLabelTextColor: '#fff', title, lineWidth: 1 });
    draftLines.push(line(p.tp, pal.gain, 'TP'), line(p.sl, pal.loss, 'SL'), line(p.entry, pal.accent, ''));
  }

  /** a new position tool gets room right of the last candle */
  function makeRoom() {
    const ts = chart.timeScale();
    const lx = lastBarX();
    const { w } = plotBox();
    const range = ts.getVisibleLogicalRange();
    const spacing = ts.options().barSpacing;
    const need = Math.min(320, w * 0.4);
    if (lx === null || !range || lx < w - need) return;
    const shift = Math.ceil((lx - (w - need)) / spacing);
    ts.setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift } as LogicalRange);
  }

  function render() {
    if (destroyed) return;
    syncDraftLines();
    // the overlay covers the candles' pane only (indicator panes sit below it)
    overlay.style.bottom = 'auto';
    overlay.style.height = `${plotBox().h}px`;
    const keepCard = hoverCard;
    overlay.replaceChildren();
    const frag = document.createDocumentFragment();
    renderNews(frag);
    renderTradeChips(frag);
    renderDraft(frag);
    overlay.append(frag);
    if (keepCard) overlay.append(keepCard);
    drawings.render();
    indicators.place();
    lastSig = signature();
  }

  // re-place the overlay whenever the view moves (scroll, zoom, price-scale drag, resize)
  let raf = 0;
  const loop = () => {
    if (destroyed) return;
    if (!drag && signature() !== lastSig) render();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // ---------- screenshot ----------
  async function screenshot(): Promise<string | null> {
    try {
      const shot = chart.takeScreenshot();
      const scale = Math.min(1, 1280 / shot.width);
      const out = document.createElement('canvas');
      out.width = Math.round(shot.width * scale);
      out.height = Math.round(shot.height * scale);
      const ctx = out.getContext('2d')!;
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(shot, 0, 0, out.width, out.height);
      // the canvas has the candles; add the drawings, the position tool and trade lines from the overlays
      const dpr = shot.width / Math.max(1, container.clientWidth);
      ctx.scale(scale * dpr, scale * dpr);
      const art = await drawings.image();
      if (art) ctx.drawImage(art, 0, 0);
      const d = state.draft;
      if (d) {
        const g = draftGeometry(d);
        if (g.ye !== null && g.ys !== null && g.yt !== null) {
          ctx.fillStyle = 'rgba(38,194,129,0.22)';
          ctx.fillRect(g.x0, Math.min(g.ye, g.yt), g.width, Math.abs(g.yt - g.ye));
          ctx.fillStyle = 'rgba(242,84,102,0.22)';
          ctx.fillRect(g.x0, Math.min(g.ye, g.ys), g.width, Math.abs(g.ys - g.ye));
          for (const [yy, c] of [
            [g.ye, pal.line],
            [g.ys, pal.loss],
            [g.yt, pal.gain],
          ] as const) {
            ctx.fillStyle = c;
            ctx.fillRect(g.x0, yy - 1, g.width, 2);
          }
          ctx.font = '600 11px sans-serif';
          ctx.fillStyle = pal.text;
          ctx.fillText(`${orderTitleEn(d.side, d.type)}  R:R ${d.rr.toFixed(2)}`, g.x0 + 6, g.ye - 6);
        }
      }
      for (const t of state.trades) {
        if (t.status !== 'open' && t.status !== 'pending') continue;
        ctx.font = '600 11px sans-serif';
        for (const [p, c, label] of [
          [t.entry, pal.line, t.side.toUpperCase()],
          [t.sl, pal.loss, 'SL'],
          [t.tp, pal.gain, 'TP'],
        ] as const) {
          const yy = y(p);
          if (yy === null) continue;
          ctx.fillStyle = c;
          ctx.fillText(label, plotBox().w - 40, yy - 4);
        }
      }
      return out.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  }

  // ---------- lifecycle ----------
  function update(next: EngineState) {
    const prev = state;
    state = next;
    if (prev.symbol !== next.symbol) drawings.setSymbol(next.symbol);
    const draftOpened = !!next.draft && (!prev.draft || prev.symbol !== next.symbol);
    if (prev.theme !== next.theme || !loadedKey) applyTheme();
    if (!loadedKey || prev.symbol !== next.symbol || prev.timeframe !== next.timeframe || prev.cursor !== next.cursor || prev.dataVersion !== next.dataVersion) {
      loadData();
      setLegend(candles[candles.length - 1]);
    }
    if (!drag) drawTrades();
    if (draftOpened) makeRoom();
    render();
  }

  applyTheme();
  update(initial);

  return {
    kind: 'lightweight',
    update,
    screenshot,
    drawings,
    indicators,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      container.removeEventListener('pointerdown', activate);
      drawings.destroy();
      indicators.destroy();
      chart.remove();
      container.replaceChildren();
    },
  };
}

/** Trades on the pane's symbol that should appear on the chart. */
export const tradesForChart = (trades: Trade[], symbol: string) => trades.filter((t) => t.symbol === symbol && t.status !== 'cancelled');
