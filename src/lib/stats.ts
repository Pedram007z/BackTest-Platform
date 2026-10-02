import { DAY_MS, addDays, diffDays, keyToMs, localDayKey, msToKey, type DayKey } from './calendar';
import type { Session, Trade } from './types';

export const closedOnly = (trades: Trade[]) => trades.filter((t) => t.status === 'closed');

export const plannedRR = (t: Trade) => {
  const risk = Math.abs(t.entry - t.sl);
  return risk > 0 ? Math.abs(t.tp - t.entry) / risk : 0;
};

/** R multiple for a price, positive when the trade is in profit. */
export function rAt(t: Pick<Trade, 'side' | 'entry' | 'sl'>, price: number): number {
  const risk = Math.abs(t.entry - t.sl);
  if (risk === 0) return 0;
  return (t.side === 'buy' ? price - t.entry : t.entry - price) / risk;
}

export interface Summary {
  total: number;
  wins: number;
  losses: number;
  winRate: number; // 0..100
  netPnl: number;
  netR: number;
  avgR: number;
  avgRR: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  buys: number;
  sells: number;
}

export function summarize(trades: Trade[]): Summary {
  const closed = closedOnly(trades).sort((a, b) => (a.closeTime ?? 0) - (b.closeTime ?? 0));
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);
  const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const netR = closed.reduce((s, t) => s + (t.r ?? 0), 0);

  let peak = 0;
  let equity = 0;
  let maxDd = 0;
  for (const t of closed) {
    equity += t.pnl ?? 0;
    peak = Math.max(peak, equity);
    maxDd = Math.max(maxDd, peak - equity);
  }

  return {
    total: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    netPnl: grossWin - grossLoss,
    netR,
    avgR: closed.length ? netR / closed.length : 0,
    avgRR: trades.length ? trades.reduce((s, t) => s + plannedRR(t), 0) / trades.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    maxDrawdown: maxDd,
    buys: trades.filter((t) => t.side === 'buy').length,
    sells: trades.filter((t) => t.side === 'sell').length,
  };
}

/** Running balance after each closed trade, starting from `start`. */
export function equitySeries(trades: Trade[], start = 0) {
  const closed = closedOnly(trades).sort((a, b) => (a.closeTime ?? 0) - (b.closeTime ?? 0));
  let equity = start;
  const points = [{ i: 0, time: closed[0]?.openTime ?? 0, equity }];
  closed.forEach((t, i) => {
    equity += t.pnl ?? 0;
    points.push({ i: i + 1, time: t.closeTime ?? 0, equity });
  });
  return points;
}

/** Last `n` local days, oldest first. */
export function lastDays(n: number, today: DayKey = localDayKey()): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

export const wallDayKey = (ms: number) => localDayKey(new Date(ms));

export function winRateByDay(trades: Trade[], days: DayKey[]) {
  return days.map((day) => {
    const list = closedOnly(trades).filter((t) => wallDayKey(t.closedAt ?? t.executedAt) === day);
    const wins = list.filter((t) => (t.pnl ?? 0) > 0).length;
    return { day, trades: list.length, winRate: list.length ? (wins / list.length) * 100 : 0 };
  });
}

export function tradesBySymbol(trades: Trade[]) {
  const map = new Map<string, number>();
  for (const t of trades) map.set(t.symbol, (map.get(t.symbol) ?? 0) + 1);
  return [...map.entries()].map(([symbol, count]) => ({ symbol, count })).sort((a, b) => a.symbol.localeCompare(b.symbol));
}

/** Consecutive local days, ending today (or yesterday), with practice time. */
export function streakDays(dailySeconds: Record<DayKey, number>): number {
  let day = localDayKey();
  if (!(dailySeconds[day] > 0)) day = addDays(day, -1);
  let n = 0;
  while (dailySeconds[day] > 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

// ---------- per-session ----------
export function sessionEndMs(s: Session) {
  return keyToMs(s.endDate) + DAY_MS;
}

export function sessionProgress(s: Session) {
  const start = keyToMs(s.startDate);
  const end = sessionEndMs(s);
  const p = (s.cursor - start) / (end - start);
  return Math.min(1, Math.max(0, p));
}

export function sessionRemainingDays(s: Session) {
  return Math.max(0, Math.ceil((sessionEndMs(s) - s.cursor) / DAY_MS));
}

export function sessionBalance(s: Session, trades: Trade[]) {
  return s.balance + closedOnly(trades).reduce((sum, t) => sum + (t.pnl ?? 0), 0);
}

/** P&L grouped by the market month the trade closed in, for the last `n` months that have trades. */
export function monthlyPerformance(trades: Trade[], n = 3) {
  const map = new Map<string, number>();
  for (const t of closedOnly(trades)) {
    const k = msToKey(t.closeTime ?? t.openTime).slice(0, 7);
    map.set(k, (map.get(k) ?? 0) + (t.pnl ?? 0));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-n)
    .map(([month, pnl]) => ({ month, pnl }));
}

/** P&L for the last `n` market days that had closed trades. */
export function dailyPerformance(trades: Trade[], n = 6) {
  const map = new Map<DayKey, number>();
  for (const t of closedOnly(trades)) {
    const k = msToKey(t.closeTime ?? t.openTime);
    map.set(k, (map.get(k) ?? 0) + (t.pnl ?? 0));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-n)
    .map(([day, pnl]) => ({ day, pnl }));
}

export function planDaysLeft(endsAt: DayKey) {
  return Math.max(0, diffDays(localDayKey(), endsAt));
}
