import type { DayKey } from './calendar';
import type { Timeframe } from './market';

export interface UserProfile {
  name: string;
  avatar?: string; // data URL
  plan: {
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

export interface Session {
  id: string;
  name: string;
  balance: number;
  symbols: string[];
  startDate: DayKey;
  endDate: DayKey;
  strategyId?: string;
  checklistId?: string;
  /** Replay position in market time (UTC ms). */
  cursor: number;
  timeframe: Timeframe;
  activeSymbol: string;
  createdAt: number;
  lastOpenedAt?: number;
}

export type Side = 'buy' | 'sell';

export interface Trade {
  id: string;
  sessionId: string;
  strategyId?: string;
  symbol: string;
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  /** Dollar amount risked (1R). */
  risk: number;
  openTime: number; // market ms
  closeTime?: number; // market ms
  exit?: number;
  r?: number;
  pnl?: number;
  status: 'open' | 'closed';
  closeReason?: 'tp' | 'sl' | 'manual';
  /** Wall-clock time the trade was placed / closed. */
  executedAt: number;
  closedAt?: number;
  note?: string;
}
