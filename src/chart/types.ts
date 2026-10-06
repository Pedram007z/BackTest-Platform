import type { Timeframe } from '../lib/market';
import type { NewsEvent } from '../lib/news';
import type { OrderType, Side, Trade } from '../lib/types';

/**
 * Both chart engines (TradingView Advanced Charts and the built-in lightweight-charts engine)
 * implement this interface, so the replay page does not care which one is drawing.
 */

/** The order being set up with the position tool, before "Place trade". */
export interface DraftOrder {
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  type: OrderType;
  /** label numbers shown on the tool */
  rr: number;
  riskUsd: number;
  rewardUsd: number;
  lots: number;
}

export interface EngineState {
  symbol: string;
  /** Every symbol in the session (offered by the chart's symbol search). */
  sessionSymbols: string[];
  timeframe: Timeframe;
  /** Replay position (UTC ms). Nothing after it may be drawn. */
  cursor: number;
  theme: 'dark' | 'light';
  /** Draft order on this pane's symbol, if any. */
  draft: DraftOrder | null;
  /** Session trades on this symbol. */
  trades: Trade[];
  /** Show closed trades as markers. */
  showHistory: boolean;
  /** Filtered calendar events for this symbol's currencies. */
  news: NewsEvent[];
  /** Bumps when remote market data arrives, so the engine reloads bars. */
  dataVersion: number;
  /** Where the chart's own layout (drawings, indicators) is kept: one per session and pane. */
  layoutKey?: string;
}

export interface EngineCallbacks {
  onDraftChange: (patch: Partial<Pick<DraftOrder, 'entry' | 'sl' | 'tp'>>) => void;
  onLineMove: (tradeId: string, field: 'entry' | 'sl' | 'tp', price: number) => void;
  /** X next to a position's entry line (open → close window, pending → cancel). */
  onLineClose: (tradeId: string) => void;
  /** Symbol or timeframe picked inside the chart (TradingView header). */
  onSymbolChange: (symbol: string) => void;
  onTimeframeChange: (tf: Timeframe) => void;
  onNewsClick?: (event: NewsEvent) => void;
  /** The pane was clicked (multi-chart layouts follow the active pane). */
  onActivate?: () => void;
}

export interface ChartEngine {
  readonly kind: 'tradingview' | 'lightweight';
  update(state: EngineState): void;
  /** JPEG data URL of the chart with its drawings. */
  screenshot(): Promise<string | null>;
  destroy(): void;
}

export type EngineFactory = (container: HTMLElement, state: EngineState, cb: EngineCallbacks) => ChartEngine;
