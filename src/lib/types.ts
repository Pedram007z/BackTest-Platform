import type { DayKey } from './calendar';
import type { Timeframe } from './market';

export interface UserProfile {
  name: string;
  phone?: string;
  avatar?: string; // data URL
  plan: {
    id?: string;
    name: string;
    startedAt: DayKey;
    endsAt: DayKey;
  };
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
  createdAt: number;
}

/** One chart in the replay layout. */
export interface ChartPane {
  symbol: string;
  timeframe: Timeframe;
}

export type LayoutId = '1' | '2v' | '2h' | '3' | '4';

export interface Session {
  id: string;
  name: string;
  balance: number;
  symbols: string[];
  startDate: DayKey;
  endDate: DayKey;
  strategyId?: string;
  checklistId?: string;
  /** Free-form notes written on the session page. */
  notes?: string;
  /** Replay position in market time (UTC ms). */
  cursor: number;
  timeframe: Timeframe;
  activeSymbol: string;
  /** Multi-chart layout on the chart page. */
  layout?: LayoutId;
  panes?: ChartPane[];
  createdAt: number;
  lastOpenedAt?: number;
}

export type Side = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop';
export type TradeStatus = 'pending' | 'open' | 'closed' | 'cancelled';
export type CloseReason = 'tp' | 'sl' | 'manual' | 'session_end';

export interface PartialClose {
  /** Market time (UTC ms). */
  time: number;
  price: number;
  lots: number;
  pnl: number;
}

/** What the trader saved in the journal window for a trade. */
export interface JournalEntry {
  /** JPEG data URLs of chart screenshots. */
  screenshots: string[];
  checklistId?: string;
  /** Checklist item ids that were ticked. */
  checked: string[];
  /** 0–100 */
  confidence: number;
  /** 0–5 stars */
  rating: number;
  notes: string;
  tags: string[];
  updatedAt: number;
}

export interface Trade {
  id: string;
  sessionId: string;
  strategyId?: string;
  symbol: string;
  side: Side;
  orderType: OrderType;
  status: TradeStatus;
  /** Requested price for pending orders, fill price once open. */
  entry: number;
  sl: number;
  tp: number;
  /** Position size still open (lots). */
  lots: number;
  /** Size when the position was opened (lots). */
  initialLots: number;
  /** USD gained or lost per 1.0 price move for one lot. */
  pointValue: number;
  /** Dollar amount risked on the full position (1R). */
  risk: number;
  riskPct: number;
  /** Market time the order was placed. */
  placedTime: number;
  /** Market time the position opened (filled). */
  openTime: number;
  closeTime?: number;
  /** Average close price over every partial and the final close. */
  exit?: number;
  partials: PartialClose[];
  /** Realised R multiple and dollars over the whole position. */
  r?: number;
  pnl?: number;
  /** Best price reached while the position was open (high for buys, low for sells). */
  bestPrice?: number;
  /** Largest R the position reached while open. */
  maxR?: number;
  /** Largest R price reached from entry before the original stop would have been hit (5 trading days at most). */
  idealR?: number;
  /** The ideal-RR follow-up is finished. */
  idealDone?: boolean;
  closeReason?: CloseReason;
  /** Wall-clock time the trade was placed / closed. */
  executedAt: number;
  closedAt?: number;
  journal?: JournalEntry;
}

/** A saved "Go To" target on the chart page. */
export interface GoToPreset {
  id: string;
  name: string;
  /** "HH:MM" wall time in `tz`. */
  time: string;
  tz: string;
  favorite?: boolean;
  builtin?: boolean;
}

export type Impact = 'high' | 'medium' | 'low' | 'holiday';

export interface NewsFilters {
  currencies: string[];
  showPast: boolean;
  showFuture: boolean;
  impacts: Impact[];
}
