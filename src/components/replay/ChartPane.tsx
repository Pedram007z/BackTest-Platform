import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createLwEngine, tradesForChart } from '../../chart/lwEngine';
import { createTvEngine } from '../../chart/tvEngine';
import type { ChartEngine, DraftOrder, EngineCallbacks, EngineState } from '../../chart/types';
import { SYMBOL_MAP, TIMEFRAMES, historyStartMs, type Timeframe } from '../../lib/market';
import type { NewsEvent } from '../../lib/news';
import type { ChartPane as Pane, Trade } from '../../lib/types';
import { Popover } from '../ui/Popover';
import { DrawingToolbar, IndicatorSettings, IndicatorsDialog, SelectedDrawingBar } from './ChartTools';

export type EngineKind = 'tradingview' | 'lightweight';

interface Props {
  index: number;
  pane: Pane;
  engineKind: EngineKind;
  tv: unknown;
  cursor: number;
  theme: 'dark' | 'light';
  sessionSymbols: string[];
  /** Session id: TradingView keeps each pane's drawings and indicators under it. */
  sessionId: string;
  /** The session's start date (YYYY-MM-DD): the chart reaches a year before it. */
  sessionStart: string;
  showHistory: boolean;
  dataVersion: number;
  draft: (DraftOrder & { symbol: string }) | null;
  trades: Trade[];
  news: NewsEvent[];
  active: boolean;
  multi: boolean;
  callbacks: EngineCallbacks;
  onPaneChange: (pane: Pane) => void;
  register: (index: number, engine: ChartEngine | null) => void;
}

/** One chart of the replay layout. The built-in engine gets its own symbol / timeframe strip. */
export function ChartPane(props: Props) {
  const { index, pane, engineKind, tv, active, multi, onPaneChange, register } = props;
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<ChartEngine | null>(null);
  const cbRef = useRef(props.callbacks);
  cbRef.current = props.callbacks;
  /** the built-in engine's drawing tools and indicators */
  const [tools, setTools] = useState<Pick<ChartEngine, 'drawings' | 'indicators'>>({});
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const currencies = SYMBOL_MAP[pane.symbol]?.currencies ?? [];
  const state: EngineState = {
    symbol: pane.symbol,
    sessionSymbols: props.sessionSymbols,
    timeframe: pane.timeframe,
    cursor: props.cursor,
    theme: props.theme,
    draft: props.draft && props.draft.symbol === pane.symbol ? props.draft : null,
    trades: tradesForChart(props.trades, pane.symbol),
    showHistory: props.showHistory,
    news: props.news.filter((e) => currencies.includes(e.currency) || (e.currency === 'CNY' && currencies.includes('HKD'))),
    dataVersion: props.dataVersion,
    historyFrom: historyStartMs(pane.symbol, props.sessionStart),
    layoutKey: `${props.sessionId}:${index}`,
  };
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const cb: EngineCallbacks = {
      onDraftChange: (p) => cbRef.current.onDraftChange(p),
      onLineMove: (id, f, p) => cbRef.current.onLineMove(id, f, p),
      onLineClose: (id) => cbRef.current.onLineClose(id),
      onSymbolChange: (s) => cbRef.current.onSymbolChange(s),
      onTimeframeChange: (t) => cbRef.current.onTimeframeChange(t),
      onNewsClick: (e) => cbRef.current.onNewsClick?.(e),
      onActivate: () => cbRef.current.onActivate?.(),
      onIndicatorSettings: (id) => setEditing(id),
    };
    const e = engineKind === 'tradingview' && tv ? createTvEngine(el, stateRef.current, cb, tv) : createLwEngine(el, stateRef.current, cb);
    engine.current = e;
    setTools({ drawings: e.drawings, indicators: e.indicators });
    register(index, e);
    return () => {
      setTools({});
      setEditing(null);
      register(index, null);
      e.destroy();
      engine.current = null;
    };
  }, [engineKind, tv, index, register]);

  // every render hands the engine the latest state; engines diff it themselves
  useEffect(() => {
    engine.current?.update(stateRef.current);
  });

  const sym = SYMBOL_MAP[pane.symbol];
  return (
    <div className={clsx('relative flex h-full min-h-0 min-w-0 flex-col bg-side', multi && 'ring-1 ring-inset', multi && (active ? 'ring-accent/70' : 'ring-line/60'))}>
      {engineKind === 'lightweight' && (
        <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line/60 px-2" dir="ltr">
          <Popover
            align="end"
            panelClass="w-56 p-1"
            button={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-bold hover:bg-raised"
                aria-expanded={open}
                title="تغییر نماد"
              >
                {sym?.ticker ?? pane.symbol}
                <ChevronDown size={14} className="text-muted" />
              </button>
            )}
          >
            {(close) => (
              <ul className="max-h-72 overflow-y-auto py-1" dir="rtl">
                {props.sessionSymbols.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        onPaneChange({ ...pane, symbol: s });
                        close();
                      }}
                      className={clsx(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm hover:bg-raised',
                        s === pane.symbol && 'text-accent-ink',
                      )}
                    >
                      <span className="font-bold" dir="ltr">
                        {SYMBOL_MAP[s]?.ticker ?? s}
                      </span>
                      <span className="truncate text-xs text-faint">{SYMBOL_MAP[s]?.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Popover>
          <span className="mx-1 h-4 w-px shrink-0 bg-line" />
          {/* eleven timeframes: narrow panes scroll them sideways */}
          <div className="flex min-w-0 items-center overflow-x-auto [scrollbar-width:none]">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onPaneChange({ ...pane, timeframe: t.id as Timeframe })}
                className={clsx(
                  'shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-semibold transition',
                  t.id === pane.timeframe ? 'text-accent-ink' : 'text-muted hover:text-ink',
                )}
                title={t.label}
              >
                {t.short}
              </button>
            ))}
          </div>
          {tools.indicators && (
            <>
              <span className="mx-1 h-4 w-px shrink-0 bg-line" />
              <button
                type="button"
                onClick={() => setIndicatorsOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-muted hover:bg-raised hover:text-ink"
                title="اندیکاتورها"
              >
                <span className="font-serif text-[15px] italic leading-none">ƒx</span>
                <span className="hidden sm:inline">Indicators</span>
              </button>
            </>
          )}
        </div>
      )}
      <div className="flex min-h-0 flex-1" dir="ltr">
        {tools.drawings && <DrawingToolbar api={tools.drawings} />}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={host} className="chart-ltr relative min-h-0 flex-1" />
          {tools.drawings && <SelectedDrawingBar api={tools.drawings} />}
        </div>
      </div>
      {tools.indicators && <IndicatorsDialog api={tools.indicators} open={indicatorsOpen} onClose={() => setIndicatorsOpen(false)} />}
      {tools.indicators && editing && <IndicatorSettings key={editing} api={tools.indicators} id={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
