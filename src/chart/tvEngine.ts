import { PALETTES } from '../hooks/useChartTheme';
import { SYMBOL_MAP, TF_MS, TIMEFRAMES, candleTime, stepCursor, tfFromTv } from '../lib/market';
import { orderTitleEn } from '../lib/trading';
import type { Trade } from '../lib/types';
import { createNavButtons } from './navButtons';
import { createReplayDatafeed } from './tvDatafeed';
import { TV_LIBRARY_PATH } from './tvLoader';
import { layoutSaved } from '../services/layoutSync';
import type { ChartEngine, DraftOrder, EngineCallbacks, EngineState } from './types';

/**
 * Replay chart on TradingView Advanced Charts. One widget per pane. Prices come from the replay
 * datafeed; the position tool is TradingView's own long/short position drawing; open positions
 * are position lines (with the close X) and stop / target are draggable order lines. The drawing
 * toolbar and the indicators work as in TradingView; each pane's drawings and indicators are saved
 * per session (in this browser and, with the API server, on the server: services/layoutSync) and come
 * back when the session is opened again.
 */

type Any = any; // the library's own typings are not part of this repository

const tvRes = (tf: string) => TIMEFRAMES.find((t) => t.id === tf)?.tv ?? '15';

const LAYOUT_PREFIX = 'btl:tv-layout:';
function readLayout(key: string | undefined): object | undefined {
  if (!key) return undefined;
  try {
    const raw = localStorage.getItem(LAYOUT_PREFIX + key);
    return raw ? (JSON.parse(raw) as object) : undefined;
  } catch {
    return undefined;
  }
}
function writeLayout(key: string, layout: object) {
  try {
    localStorage.setItem(LAYOUT_PREFIX + key, JSON.stringify(layout));
    layoutSaved('tv', key);
  } catch {
    /* storage full or blocked: drawings stay for this visit */
  }
}

function overrides(theme: 'dark' | 'light') {
  const p = PALETTES[theme];
  return {
    'paneProperties.backgroundType': 'solid',
    'paneProperties.background': theme === 'dark' ? '#120f1c' : '#ffffff',
    'paneProperties.vertGridProperties.color': theme === 'dark' ? 'rgba(46,40,66,0.55)' : 'rgba(226,221,239,0.8)',
    'paneProperties.horzGridProperties.color': theme === 'dark' ? 'rgba(46,40,66,0.55)' : 'rgba(226,221,239,0.8)',
    'scalesProperties.textColor': p.axis,
    'mainSeriesProperties.candleStyle.upColor': p.candleUp,
    'mainSeriesProperties.candleStyle.downColor': p.candleDown,
    'mainSeriesProperties.candleStyle.borderUpColor': p.candleUp,
    'mainSeriesProperties.candleStyle.borderDownColor': p.candleDown,
    'mainSeriesProperties.candleStyle.wickUpColor': p.candleUp,
    'mainSeriesProperties.candleStyle.wickDownColor': p.candleDown,
  };
}

interface Lines {
  entry: Any;
  sl: Any;
  tp: Any | null;
  status: Trade['status'];
}

export function createTvEngine(container: HTMLElement, initial: EngineState, cb: EngineCallbacks, TV: Any): ChartEngine {
  let state = initial;
  let ready = false;
  let destroyed = false;
  let chart: Any = null;
  let draftId: Any = null;
  let draftSide: DraftOrder['side'] | null = null;
  let applyingDraft = false;
  /** the chart's right margin (bars) before a position tool made room for itself */
  let offsetBefore: number | null = null;
  const DRAFT_BARS = 40;
  const lines = new Map<string, Lines>();
  const executions = new Map<string, Any[]>();
  let newsShapes = new Map<string, Any>();
  let marksSig = '';

  const feed = createReplayDatafeed({
    cursor: () => state.cursor,
    news: () => state.news,
    symbols: () => state.sessionSymbols,
  });

  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.inset = '0';
  container.style.position = 'relative';
  container.append(host);

  const savedLayout = readLayout(state.layoutKey);
  const widget = new TV.widget({
    container: host,
    library_path: TV_LIBRARY_PATH,
    locale: 'en',
    datafeed: feed.datafeed,
    symbol: state.symbol,
    interval: tvRes(state.timeframe),
    ...(savedLayout ? { saved_data: savedLayout } : {}),
    auto_save_delay: 2,
    autosize: true,
    theme: state.theme === 'dark' ? 'dark' : 'light',
    timezone: 'Asia/Tehran',
    disabled_features: [
      'header_compare',
      'header_saveload',
      'header_screenshot',
      'go_to_date',
      'timeframes_toolbar',
      'popup_hints',
      'display_market_status',
      'use_localstorage_for_settings',
      // its navigation buttons sit under the replay bar; ours (below) keep clear of it
      'control_bar',
    ],
    enabled_features: ['seconds_resolution'],
    favorites: { intervals: TIMEFRAMES.map((t) => t.tv) },
    loading_screen: { backgroundColor: state.theme === 'dark' ? '#120f1c' : '#ffffff', foregroundColor: '#7c5cff' },
    overrides: overrides(state.theme),
  });

  const tick = () => 10 ** -(SYMBOL_MAP[state.symbol]?.digits ?? 2);

  // ---------- navigation buttons (zoom, scroll, reset) ----------
  /** the library's left toolbar, price axis and time axis, roughly */
  const TOOLBAR_W = 52;
  const PRICE_AXIS_W = 64;
  const TIME_AXIS_H = 28;
  const nav = createNavButtons({
    container,
    paneBox: () => ({ x: TOOLBAR_W, w: container.clientWidth - TOOLBAR_W - PRICE_AXIS_W, h: container.clientHeight - TIME_AXIS_H }),
    colors: () => {
      const p = PALETTES[state.theme];
      return { surface: p.surface, text: p.text, border: p.grid };
    },
    actions: {
      zoom(factor) {
        if (!ready || destroyed) return;
        const ts = chart.getTimeScale();
        ts.setBarSpacing(Math.min(80, Math.max(0.5, ts.barSpacing() / factor)));
      },
      scroll(dir, share) {
        if (!ready || destroyed) return;
        const ts = chart.getTimeScale();
        const visible = ts.width() / ts.barSpacing();
        const step = Math.max(1, Math.round(visible * share));
        const maxOffset = Math.max(ts.defaultRightOffset().value(), visible / 2);
        ts.setRightOffset(Math.min(maxOffset, ts.rightOffset() + dir * step));
      },
      reset() {
        if (!ready || destroyed) return;
        feed.resetAll();
        chart.resetData();
        chart.executeActionById('chartReset');
      },
    },
  });
  nav.applyTheme();

  /** the bar `n` trading bars after the one starting at `fromSec` (weekends skipped: the library rejects points there) */
  function barsAhead(fromSec: number, n: number): number {
    const sym = SYMBOL_MAP[state.symbol];
    const tf = state.timeframe;
    if (!sym) return fromSec + (n * TF_MS[tf]) / 1000;
    let end = fromSec * 1000 + TF_MS[tf];
    for (let i = 0; i < n; i++) end = stepCursor(end, tf, [state.symbol]);
    return candleTime(sym, tf, end - 1) / 1000;
  }

  // ---------- draft position tool ----------
  function readDraft() {
    if (!draftId || !chart || applyingDraft) return;
    try {
      const shape = chart.getShapeById(draftId);
      const pt = shape.getPoints()[0];
      const props = shape.getProperties();
      const t = tick();
      const entry = pt.price;
      const dir = draftSide === 'buy' ? 1 : -1;
      cb.onDraftChange({ entry, sl: entry - dir * props.stopLevel * t, tp: entry + dir * props.profitLevel * t });
    } catch {
      /* shape removed */
    }
  }

  function syncDraft() {
    const d = state.draft;
    if (!d) {
      if (draftId) chart.removeEntity(draftId);
      draftId = null;
      draftSide = null;
      if (offsetBefore !== null) {
        try {
          chart.getTimeScale().setRightOffset(offsetBefore);
        } catch {
          /* older library */
        }
        offsetBefore = null;
      }
      return;
    }
    const t = tick();
    const dir = d.side === 'buy' ? 1 : -1;
    const stopLevel = Math.max(1, Math.round(((d.entry - d.sl) * dir) / t));
    const profitLevel = Math.max(1, Math.round(((d.tp - d.entry) * dir) / t));
    const time = Math.floor(state.cursor / 1000) - TF_MS[state.timeframe] / 1000;
    if (draftId && draftSide !== d.side) {
      chart.removeEntity(draftId);
      draftId = null;
    }
    applyingDraft = true;
    try {
      if (!draftId) {
        // room on the right so the tool is wide enough to grab its entry, stop and target
        try {
          const scale = chart.getTimeScale();
          if (offsetBefore === null) offsetBefore = scale.rightOffset();
          if (scale.rightOffset() < DRAFT_BARS + 8) scale.setRightOffset(DRAFT_BARS + 8);
        } catch {
          /* older library */
        }
        const right = barsAhead(time, DRAFT_BARS);
        draftId = chart.createMultipointShape(
          [
            { time, price: d.entry },
            { time: right, price: d.entry },
          ],
          {
            shape: d.side === 'buy' ? 'long_position' : 'short_position',
            disableUndo: true,
            disableSave: true,
            zOrder: 'top',
            overrides: {
              stopLevel,
              profitLevel,
              profitBackground: 'rgba(38,194,129,0.22)',
              stopBackground: 'rgba(242,84,102,0.22)',
              linewidth: 2,
              accountSize: 0,
            },
          },
        );
        draftSide = d.side;
        // the library starts the tool one bar wide and finishes creating it a little later:
        // then widen it into the room made above (checked a few times, kept once it holds)
        const id = draftId;
        for (const delay of [150, 500, 1200]) {
          setTimeout(() => {
            if (destroyed || draftId !== id || !id) return;
            try {
              const shape = chart.getShapeById(id);
              const [pt, end] = shape.getPoints();
              if (end && end.time - pt.time >= (right - time) / 2) return;
              applyingDraft = true;
              shape.setPoints([pt, { time: right, price: pt.price }]);
            } catch {
              /* removed meanwhile */
            } finally {
              applyingDraft = false;
            }
          }, delay);
        }
      } else {
        const shape = chart.getShapeById(draftId);
        const [pt, end] = shape.getPoints();
        const props = shape.getProperties();
        if (Math.abs(pt.price - d.entry) > t / 2)
          shape.setPoints([
            { time: pt.time, price: d.entry },
            { time: end?.time ?? pt.time, price: d.entry },
          ]);
        if (props.stopLevel !== stopLevel || props.profitLevel !== profitLevel) shape.setProperties({ stopLevel, profitLevel });
      }
    } catch {
      /* drawing API not ready */
    } finally {
      applyingDraft = false;
    }
  }

  // ---------- positions and orders ----------
  function money(n: number) {
    return `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`;
  }

  function styleLine(l: Any, color: string) {
    const p = PALETTES[state.theme];
    l.setLineColor(color)
      .setBodyBorderColor(color)
      .setBodyBackgroundColor(p.surface)
      .setBodyTextColor(p.text)
      .setQuantityBorderColor(color)
      .setQuantityBackgroundColor(color)
      .setQuantityTextColor('#ffffff');
    return l;
  }

  function syncTrades() {
    const p = PALETTES[state.theme];
    const live = state.trades.filter((t) => t.status === 'open' || t.status === 'pending');
    const ids = new Set(live.map((t) => t.id));
    for (const [id, l] of lines) {
      const t = live.find((x) => x.id === id);
      if (!ids.has(id) || l.status !== t?.status) {
        l.entry.remove();
        l.sl.remove();
        l.tp?.remove();
        lines.delete(id);
      }
    }
    for (const t of live) {
      let l = lines.get(t.id);
      if (!l) {
        let entry: Any;
        if (t.status === 'open') {
          entry = styleLine(chart.createPositionLine(), t.side === 'buy' ? p.gain : p.loss)
            .setCloseButtonBorderColor(p.grid)
            .setCloseButtonBackgroundColor(p.surface)
            .setCloseButtonIconColor(p.text)
            .setCloseTooltip('بستن کامل یا بخشی از پوزیشن')
            .onClose(() => cb.onLineClose(t.id));
        } else {
          entry = styleLine(chart.createOrderLine(), p.accent)
            .setCancelTooltip('لغو سفارش')
            .onCancel(() => cb.onLineClose(t.id))
            .onMove(function (this: Any) {
              cb.onLineMove(t.id, 'entry', this.getPrice());
            });
        }
        const sl = styleLine(chart.createOrderLine(), p.loss)
          .setCancellable(false)
          .setLineStyle(2)
          .onMove(function (this: Any) {
            cb.onLineMove(t.id, 'sl', this.getPrice());
          });
        const tp =
          t.tp > 0
            ? styleLine(chart.createOrderLine(), p.gain)
                .setCancellable(false)
                .setLineStyle(2)
                .onMove(function (this: Any) {
                  cb.onLineMove(t.id, 'tp', this.getPrice());
                })
            : null;
        l = { entry, sl, tp, status: t.status };
        lines.set(t.id, l);
      }
      const usd = (price: number) => (price - t.entry) * (t.side === 'buy' ? 1 : -1) * t.pointValue * t.lots;
      l.entry
        .setPrice(t.entry)
        .setQuantity(String(t.lots))
        .setText(t.status === 'open' ? t.side.toUpperCase() : orderTitleEn(t.side, t.orderType).toUpperCase());
      l.sl
        .setPrice(t.sl)
        .setQuantity(String(t.lots))
        .setText(`SL ${money(usd(t.sl))}`);
      l.tp
        ?.setPrice(t.tp)
        .setQuantity(String(t.lots))
        .setText(`TP ${money(usd(t.tp))}`);
    }

    // closed trades as execution arrows
    const wanted = state.showHistory ? state.trades.filter((t) => t.status === 'closed') : [];
    const wantedIds = new Set(wanted.map((t) => t.id));
    for (const [id, shapes] of executions) {
      if (!wantedIds.has(id)) {
        shapes.forEach((s) => s.remove());
        executions.delete(id);
      }
    }
    for (const t of wanted) {
      if (executions.has(t.id)) continue;
      const sym = SYMBOL_MAP[t.symbol];
      const step = TF_MS[state.timeframe];
      const barOf = (time: number) => (sym ? candleTime(sym, state.timeframe, time) : Math.floor(time / step) * step) / 1000;
      const open = chart
        .createExecutionShape()
        .setTime(barOf(t.openTime))
        .setPrice(t.entry)
        .setDirection(t.side)
        .setArrowColor(t.side === 'buy' ? p.gain : p.loss)
        .setTooltip(`${t.side.toUpperCase()} ${t.lots} @ ${t.entry}`);
      const close = chart
        .createExecutionShape()
        .setTime(barOf((t.closeTime ?? t.openTime) - 1))
        .setPrice(t.exit ?? t.entry)
        .setDirection(t.side === 'buy' ? 'sell' : 'buy')
        .setArrowColor((t.pnl ?? 0) >= 0 ? p.gain : p.loss)
        .setText(`${(t.r ?? 0) >= 0 ? '+' : ''}${(t.r ?? 0).toFixed(1)}R`)
        .setTooltip(`${money(t.pnl ?? 0)}`);
      executions.set(t.id, [open, close]);
    }
  }

  // ---------- news ----------
  function syncNews() {
    const past = state.news.filter((e) => e.time <= state.cursor);
    const sig = past.map((e) => e.id).join(',');
    if (sig !== marksSig) {
      marksSig = sig;
      chart.refreshMarks();
    }
    const future = state.news.filter((e) => e.time > state.cursor);
    const next = new Map<string, Any>();
    const colors: Record<string, string> = { high: '#f25466', medium: '#f5a524', low: '#e8d44d', holiday: '#9b9bb0' };
    for (const e of future) {
      const existing = newsShapes.get(e.id);
      if (existing) {
        next.set(e.id, existing);
        continue;
      }
      const id = chart.createShape(
        { time: Math.floor(e.time / 1000) },
        {
          shape: 'vertical_line',
          lock: true,
          disableSelection: true,
          disableSave: true,
          disableUndo: true,
          overrides: { linecolor: colors[e.impact], linestyle: 2, linewidth: 1, showTime: false },
        },
      );
      if (id) next.set(e.id, id);
    }
    for (const [id, shape] of newsShapes) if (!next.has(id)) chart.removeEntity(shape);
    newsShapes = next;
  }

  // ---------- update ----------
  function update(next: EngineState) {
    const prev = state;
    state = next;
    if (!ready || destroyed) return;
    if (prev.theme !== next.theme) {
      void widget.changeTheme(next.theme).then(() => widget.applyOverrides(overrides(next.theme)));
      nav.applyTheme();
    }
    if (prev.symbol !== next.symbol && chart.symbol() !== next.symbol) chart.setSymbol(next.symbol);
    if (prev.timeframe !== next.timeframe && tfFromTv(chart.resolution()) !== next.timeframe) chart.setResolution(tvRes(next.timeframe));
    if (prev.cursor !== next.cursor || prev.dataVersion !== next.dataVersion) {
      if (prev.dataVersion !== next.dataVersion || !feed.push()) {
        feed.resetAll();
        chart.resetData();
      }
    }
    syncDraft();
    syncTrades();
    syncNews();
  }

  widget.onChartReady(() => {
    if (destroyed) return;
    ready = true;
    chart = widget.activeChart();
    chart.onSymbolChanged().subscribe(null, () => {
      const sym = String(chart.symbol()).split(':').pop()!;
      if (sym !== state.symbol) cb.onSymbolChange(sym);
    });
    chart.onIntervalChanged().subscribe(null, (interval: string) => {
      const tf = tfFromTv(interval);
      if (tf !== state.timeframe) cb.onTimeframeChange(tf);
    });
    widget.subscribe('drawing_event', (id: Any, type: string) => {
      if (id === draftId && (type === 'points_changed' || type === 'properties_changed' || type === 'move')) readDraft();
      if (id === draftId && type === 'remove') draftId = null;
    });
    widget.subscribe('mouse_down', () => cb.onActivate?.());
    // keep the pane's drawings and indicators (our own lines and markers are not saved)
    widget.subscribe('onAutoSaveNeeded', () => {
      const key = state.layoutKey;
      if (key && !destroyed) widget.save((layout: object) => writeLayout(key, layout));
    });
    // a restored layout brings its own symbol and timeframe: the session's win
    if (String(chart.symbol()).split(':').pop() !== state.symbol) chart.setSymbol(state.symbol);
    if (tfFromTv(chart.resolution()) !== state.timeframe) chart.setResolution(tvRes(state.timeframe));
    marksSig = '';
    update(state);
    nav.place();
  });

  return {
    kind: 'tradingview',
    update: (s) => update(s),
    async screenshot() {
      if (!ready) return null;
      try {
        const canvas: HTMLCanvasElement = await widget.takeClientScreenshot();
        const scale = Math.min(1, 1280 / canvas.width);
        const out = document.createElement('canvas');
        out.width = Math.round(canvas.width * scale);
        out.height = Math.round(canvas.height * scale);
        out.getContext('2d')!.drawImage(canvas, 0, 0, out.width, out.height);
        return out.toDataURL('image/jpeg', 0.85);
      } catch {
        return null;
      }
    },
    destroy() {
      destroyed = true;
      nav.destroy();
      try {
        widget.remove();
      } catch {
        /* already gone */
      }
      container.replaceChildren();
    },
  };
}
