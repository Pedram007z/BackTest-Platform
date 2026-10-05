import { DAY_MS, addDays, diffDays, fromKey, keyToMs, localDayKey, msToKey, type CalendarKind, type DayKey } from './calendar';
import { knownPriceAt, seededRng } from './market';
import { marketSessionOf, wallTime, type MarketSession } from './timezone';
import { openPnl, riskDistance } from './trading';
import type { Session, Trade } from './types';

export const closedOnly = (trades: Trade[]) => trades.filter((t) => t.status === 'closed');
/** Trades that reached the market (not cancelled, not still waiting). */
export const executed = (trades: Trade[]) => trades.filter((t) => t.status === 'open' || t.status === 'closed');
const byClose = (a: Trade, b: Trade) => (a.closeTime ?? 0) - (b.closeTime ?? 0);

export const plannedRR = (t: Trade) => {
  const rd = riskDistance(t);
  return rd > 0 ? Math.abs(t.tp - t.entry) / rd : 0;
};

/** R multiple for a price, positive when the trade is in profit. */
export function rAt(t: Pick<Trade, 'side' | 'entry' | 'risk' | 'pointValue' | 'initialLots'>, price: number): number {
  const rd = riskDistance(t);
  if (rd === 0) return 0;
  return (t.side === 'buy' ? price - t.entry : t.entry - price) / rd;
}

export const isWin = (t: Trade, beThreshold = 0) => (t.pnl ?? 0) > beThreshold;
export const isLoss = (t: Trade, beThreshold = 0) => (t.pnl ?? 0) < -beThreshold;
export const isBreakeven = (t: Trade, beThreshold = 0) => !isWin(t, beThreshold) && !isLoss(t, beThreshold);

export interface Summary {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number; // 0..100
  netPnl: number;
  netR: number;
  avgR: number;
  avgRR: number;
  /** average win ÷ average loss in dollars */
  payoff: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  buys: number;
  sells: number;
}

export function summarize(trades: Trade[], beThreshold = 0): Summary {
  const closed = closedOnly(trades).sort(byClose);
  const wins = closed.filter((t) => isWin(t, beThreshold));
  const losses = closed.filter((t) => isLoss(t, beThreshold));
  const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const net = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const netR = closed.reduce((s, t) => s + (t.r ?? 0), 0);

  let peak = 0;
  let equity = 0;
  let maxDd = 0;
  for (const t of closed) {
    equity += t.pnl ?? 0;
    peak = Math.max(peak, equity);
    maxDd = Math.max(maxDd, peak - equity);
  }
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const ex = executed(trades);
  const decided = wins.length + losses.length;

  return {
    total: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: closed.length - wins.length - losses.length,
    winRate: decided ? (wins.length / decided) * 100 : 0,
    netPnl: net,
    netR,
    avgR: closed.length ? netR / closed.length : 0,
    avgRR: closed.length ? closed.reduce((s, t) => s + plannedRR(t), 0) / closed.length : 0,
    payoff: avgLoss > 0 ? avgWin / avgLoss : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    avgWin,
    avgLoss,
    maxDrawdown: maxDd,
    buys: ex.filter((t) => t.side === 'buy').length,
    sells: ex.filter((t) => t.side === 'sell').length,
  };
}

/** Running balance after each closed trade, starting from `start`. */
export function equitySeries(trades: Trade[], start = 0) {
  const closed = closedOnly(trades).sort(byClose);
  let equity = start;
  const points = [{ i: 0, time: closed[0]?.openTime ?? 0, equity }];
  closed.forEach((t, i) => {
    equity += t.pnl ?? 0;
    points.push({ i: i + 1, time: t.closeTime ?? 0, equity });
  });
  return points;
}

/**
 * Balance (closed P&L) and equity (closed + floating P&L of open positions) through market time,
 * sampled at every open and close.
 */
export function balanceEquitySeries(trades: Trade[], start = 0) {
  const ex = executed(trades);
  const times = [...new Set(ex.flatMap((t) => [t.openTime, t.closeTime ?? t.openTime]))].sort((a, b) => a - b);
  return times.map((time) => {
    let closed = 0;
    let floating = 0;
    for (const t of ex) {
      for (const p of t.partials) if (p.time <= time) closed += p.pnl;
      const stillOpen = t.openTime <= time && (t.closeTime === undefined || t.closeTime > time);
      if (stillOpen) {
        const lotsOpen = t.initialLots - t.partials.filter((p) => p.time <= time).reduce((s, p) => s + p.lots, 0);
        floating += ((knownPriceAt(t.symbol, time) ?? t.entry) - t.entry) * (t.side === 'buy' ? 1 : -1) * t.pointValue * Math.max(0, lotsOpen);
      }
    }
    return { time, balance: start + closed, equity: start + closed + floating };
  });
}

/** Net P&L per market day, oldest first. */
export function dailyPnl(trades: Trade[]) {
  const map = new Map<DayKey, { pnl: number; count: number }>();
  for (const t of closedOnly(trades)) {
    const k = msToKey(t.closeTime ?? t.openTime);
    const cur = map.get(k) ?? { pnl: 0, count: 0 };
    cur.pnl += t.pnl ?? 0;
    cur.count++;
    map.set(k, cur);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));
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
  for (const t of executed(trades)) map.set(t.symbol, (map.get(t.symbol) ?? 0) + 1);
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

/** Starting balance plus everything realised so far (including partial closes of open positions). */
export function sessionBalance(s: Session, trades: Trade[]) {
  return s.balance + trades.filter((t) => t.sessionId === s.id).reduce((sum, t) => sum + t.partials.reduce((a, p) => a + p.pnl, 0), 0);
}

export function sessionFloating(s: Session, trades: Trade[]) {
  return trades.filter((t) => t.sessionId === s.id && t.status === 'open').reduce((sum, t) => sum + openPnl(t, knownPriceAt(t.symbol, s.cursor) ?? t.entry), 0);
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
  return dailyPnl(trades)
    .slice(-n)
    .map(({ day, pnl }) => ({ day, pnl }));
}

/** Realised P&L inside the market day / week / month that contains `cursor`. */
export function periodPnl(trades: Trade[], cursor: number) {
  const day = msToKey(cursor);
  const month = day.slice(0, 7);
  const wd = (new Date(cursor).getUTCDay() + 6) % 7; // Monday = 0
  const weekStart = addDays(day, -wd);
  let d = 0;
  let w = 0;
  let m = 0;
  for (const t of trades)
    for (const p of t.partials) {
      const k = msToKey(p.time);
      if (k === day) d += p.pnl;
      if (k >= weekStart && k <= day) w += p.pnl;
      if (k.slice(0, 7) === month) m += p.pnl;
    }
  return { day: d, week: w, month: m };
}

export function planDaysLeft(endsAt: DayKey) {
  return Math.max(0, diffDays(localDayKey(), endsAt));
}

// ---------- analytics ----------

/** % return of each closed trade relative to its session balance just before it closed. */
export function tradeReturns(trades: Trade[], sessions: Session[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sessions) {
    let bal = s.balance;
    for (const t of closedOnly(trades.filter((x) => x.sessionId === s.id)).sort(byClose)) {
      out.set(t.id, bal > 0 ? ((t.pnl ?? 0) / bal) * 100 : 0);
      bal += t.pnl ?? 0;
    }
  }
  return out;
}

export interface SideStats {
  total: number;
  best: number;
  avg: number;
  avgDurationMs: number;
  maxStreak: number;
  avgStreak: number;
}

function streaks(flags: boolean[]) {
  const runs: number[] = [];
  let run = 0;
  for (const f of flags) {
    if (f) run++;
    else if (run) {
      runs.push(run);
      run = 0;
    }
  }
  if (run) runs.push(run);
  return { max: runs.length ? Math.max(...runs) : 0, avg: runs.length ? runs.reduce((a, b) => a + b, 0) / runs.length : 0 };
}

/** Winners and losers boxes: counts, best / average in %, average holding time, streaks. */
export function winnersLosers(trades: Trade[], returns: Map<string, number>, beThreshold = 0) {
  const closed = closedOnly(trades).sort(byClose);
  const make = (pred: (t: Trade) => boolean, pickBest: (a: number, b: number) => number): SideStats => {
    const list = closed.filter(pred);
    const rets = list.map((t) => returns.get(t.id) ?? 0);
    const st = streaks(closed.map(pred));
    return {
      total: list.length,
      best: rets.length ? rets.reduce((a, b) => pickBest(a, b)) : 0,
      avg: rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0,
      avgDurationMs: list.length ? list.reduce((s, t) => s + ((t.closeTime ?? t.openTime) - t.openTime), 0) / list.length : 0,
      maxStreak: st.max,
      avgStreak: st.avg,
    };
  };
  return {
    winners: make((t) => isWin(t, beThreshold), Math.max),
    losers: make((t) => isLoss(t, beThreshold), Math.min),
  };
}

/** Realised RR, the most R reached while open, and how far price ran before the original stop. */
export function rrStats(trades: Trade[]) {
  const closed = closedOnly(trades).sort(byClose);
  const winners = closed.filter((t) => (t.r ?? 0) > 0);
  const ideal = closed.map((t) => Math.max(t.idealR ?? 0, t.maxR ?? 0));
  const couldHave = closed.filter((t) => (t.pnl ?? 0) <= 0 && (t.maxR ?? 0) >= 1);
  let count = 0;
  return {
    avgRR: winners.length ? winners.reduce((s, t) => s + (t.r ?? 0), 0) / winners.length : 0,
    maxRR: closed.length ? Math.max(0, ...closed.map((t) => t.r ?? 0)) : 0,
    idealAvg: ideal.length ? ideal.reduce((a, b) => a + b, 0) / ideal.length : 0,
    idealMax: ideal.length ? Math.max(...ideal) : 0,
    couldHave: couldHave.length,
    rrLine: closed.map((t, i) => ({ i, v: t.r ?? 0 })),
    idealLine: ideal.map((v, i) => ({ i, v })),
    couldLine: closed.map((t, i) => {
      if ((t.pnl ?? 0) <= 0 && (t.maxR ?? 0) >= 1) count++;
      return { i, v: count };
    }),
  };
}

export function bySide(trades: Trade[], beThreshold = 0) {
  const closed = closedOnly(trades);
  return (['buy', 'sell'] as const).map((side) => {
    const list = closed.filter((t) => t.side === side);
    const wins = list.filter((t) => isWin(t, beThreshold)).length;
    const decided = list.filter((t) => !isBreakeven(t, beThreshold)).length;
    return { side, total: list.length, wins, winRate: decided ? (wins / decided) * 100 : 0, pnl: list.reduce((s, t) => s + (t.pnl ?? 0), 0) };
  });
}

export const SESSIONS_ORDER: MarketSession[] = ['asia', 'london', 'newyork', 'outside'];

export function byMarketSession(trades: Trade[], beThreshold = 0) {
  const closed = closedOnly(trades);
  return SESSIONS_ORDER.map((key) => {
    const list = closed.filter((t) => marketSessionOf(t.openTime) === key);
    const wins = list.filter((t) => isWin(t, beThreshold)).length;
    const decided = list.filter((t) => !isBreakeven(t, beThreshold)).length;
    return {
      key,
      total: list.length,
      winRate: decided ? (wins / decided) * 100 : 0,
      maxRR: list.length ? Math.max(0, ...list.map((t) => t.r ?? 0)) : 0,
      profit: list.reduce((s, t) => s + (t.pnl ?? 0), 0),
    };
  });
}

/** Gross profit, gross loss, average R and % return per hour of the day the trade opened (in `tz`). */
export function byHour(trades: Trade[], returns: Map<string, number>, tz: string) {
  const rows = Array.from({ length: 24 }, (_, h) => ({ hour: h, gain: 0, loss: 0, net: 0, rSum: 0, count: 0, pct: 0 }));
  for (const t of closedOnly(trades)) {
    const h = wallTime(t.openTime, tz).hh;
    const r = rows[h];
    const pnl = t.pnl ?? 0;
    if (pnl >= 0) r.gain += pnl;
    else r.loss += pnl;
    r.net += pnl;
    r.rSum += t.r ?? 0;
    r.count++;
    r.pct += returns.get(t.id) ?? 0;
  }
  return rows.map((r) => ({ ...r, avgR: r.count ? r.rSum / r.count : 0 }));
}

/** Gains and losses (in %) per weekday the trade closed on. Saturday first, like the Persian week. */
export function byWeekday(trades: Trade[], returns: Map<string, number>) {
  const order = [6, 0, 1, 2, 3, 4, 5];
  const rows = order.map((wd) => ({ wd, gain: 0, loss: 0, net: 0, count: 0 }));
  for (const t of closedOnly(trades)) {
    const wd = new Date(t.closeTime ?? t.openTime).getUTCDay();
    const r = rows[order.indexOf(wd)];
    const pct = returns.get(t.id) ?? 0;
    if (pct >= 0) r.gain += pct;
    else r.loss += pct;
    r.net += pct;
    r.count++;
  }
  return rows;
}

/** % return per calendar month (rows = years), in the Jalali or Gregorian calendar. */
export function monthlyTable(trades: Trade[], returns: Map<string, number>, cal: CalendarKind = 'gregorian') {
  const map = new Map<number, number[]>();
  for (const t of closedOnly(trades)) {
    const { y, m } = fromKey(cal, msToKey(t.closeTime ?? t.openTime));
    if (!map.has(y)) map.set(y, Array(12).fill(NaN));
    const arr = map.get(y)!;
    arr[m - 1] = (Number.isNaN(arr[m - 1]) ? 0 : arr[m - 1]) + (returns.get(t.id) ?? 0);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({ year, months, total: months.reduce((s, v) => s + (Number.isNaN(v) ? 0 : v), 0) }));
}

/** Per market day: dollars and number of trades, for the performance calendar. */
export function calendarData(trades: Trade[]) {
  const m = new Map<DayKey, { pnl: number; count: number }>();
  for (const d of dailyPnl(trades)) m.set(d.day, { pnl: d.pnl, count: d.count });
  return m;
}

export interface MonteCarlo {
  bands: { i: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  samples: number[][];
  medianFinal: number;
  probProfit: number;
  worstDrawdown95: number;
  ruin: number;
}

/**
 * Bootstrap the closed trades' % returns into `paths` random sequences of `steps` trades,
 * compounding from `start`. Seeded, so the same inputs draw the same picture.
 */
export function monteCarlo(returnsPct: number[], start: number, steps = 100, paths = 400, seed = 1): MonteCarlo | null {
  if (returnsPct.length < 5) return null;
  const rng = seededRng(`mc:${seed}:${returnsPct.length}`);
  const all: number[][] = [];
  const dds: number[] = [];
  let ruined = 0;
  for (let p = 0; p < paths; p++) {
    let bal = start;
    let peak = start;
    let dd = 0;
    const path = [bal];
    for (let i = 0; i < steps; i++) {
      bal *= 1 + returnsPct[Math.floor(rng() * returnsPct.length)] / 100;
      peak = Math.max(peak, bal);
      dd = Math.max(dd, (peak - bal) / peak);
      path.push(bal);
    }
    if (path.some((b) => b < start * 0.5)) ruined++;
    dds.push(dd * 100);
    all.push(path);
  }
  const q = (arr: number[], p: number) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
  };
  const bands = Array.from({ length: steps + 1 }, (_, i) => {
    const col = all.map((path) => path[i]);
    return { i, p5: q(col, 0.05), p25: q(col, 0.25), p50: q(col, 0.5), p75: q(col, 0.75), p95: q(col, 0.95) };
  });
  const finals = all.map((p) => p[steps]);
  return {
    bands,
    samples: all.slice(0, 12),
    medianFinal: q(finals, 0.5),
    probProfit: (finals.filter((f) => f > start).length / paths) * 100,
    worstDrawdown95: q(dds, 0.95),
    ruin: (ruined / paths) * 100,
  };
}
