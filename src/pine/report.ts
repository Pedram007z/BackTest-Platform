import type { Broker, ClosedTrade } from './broker';

/**
 * The Strategy Tester's numbers (TradingView's "Performance Summary"), for all trades and for longs
 * and shorts apart, plus a thinned equity / drawdown curve for the chart.
 */

export interface Perf {
  netProfit: number;
  netProfitPct: number;
  grossProfit: number;
  grossProfitPct: number;
  grossLoss: number;
  grossLossPct: number;
  commission: number;
  totalTrades: number;
  wins: number;
  losses: number;
  evens: number;
  winRate: number;
  avgTrade: number;
  avgTradePct: number;
  avgWin: number;
  avgWinPct: number;
  avgLoss: number;
  avgLossPct: number;
  ratioWinLoss: number;
  largestWin: number;
  largestWinPct: number;
  largestLoss: number;
  largestLossPct: number;
  avgBars: number;
  avgBarsWin: number;
  avgBarsLoss: number;
  profitFactor: number;
  maxContracts: number;
}

export interface EquityPoint {
  /** UTC ms */
  t: number;
  equity: number;
  /** drawdown from the running peak, negative or 0 (USD) */
  dd: number;
  /** buy & hold equity */
  bh: number;
}

export interface Report {
  initialCapital: number;
  finalEquity: number;
  openPnl: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  maxRunup: number;
  maxRunupPct: number;
  buyHold: number;
  buyHoldPct: number;
  sharpe: number;
  sortino: number;
  openTrades: number;
  all: Perf;
  long: Perf;
  short: Perf;
  curve: EquityPoint[];
  /** month (YYYY-MM) → net profit of the trades closed in it */
  monthly: { month: string; profit: number; returnPct: number }[];
}

function perf(trades: ClosedTrade[], ic: number, maxContracts: number): Perf {
  const wins = trades.filter((t) => t.profit > 0);
  const losses = trades.filter((t) => t.profit < 0);
  const sum = (x: ClosedTrade[], f: (t: ClosedTrade) => number) => x.reduce((s, t) => s + f(t), 0);
  const avg = (x: ClosedTrade[], f: (t: ClosedTrade) => number) => (x.length ? sum(x, f) / x.length : NaN);
  const gp = sum(wins, (t) => t.profit);
  const gl = -sum(losses, (t) => t.profit);
  const net = gp - gl;
  const bars = (t: ClosedTrade) => t.exitBar - t.entryBar;
  const avgWin = avg(wins, (t) => t.profit);
  const avgLoss = avg(losses, (t) => -t.profit);
  const largestWin = wins.reduce<ClosedTrade | null>((b, t) => (!b || t.profit > b.profit ? t : b), null);
  const largestLoss = losses.reduce<ClosedTrade | null>((b, t) => (!b || t.profit < b.profit ? t : b), null);
  return {
    netProfit: net,
    netProfitPct: (net / ic) * 100,
    grossProfit: gp,
    grossProfitPct: (gp / ic) * 100,
    grossLoss: gl,
    grossLossPct: (gl / ic) * 100,
    commission: sum(trades, (t) => t.commission),
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    evens: trades.length - wins.length - losses.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : NaN,
    avgTrade: avg(trades, (t) => t.profit),
    avgTradePct: avg(trades, (t) => t.profitPct),
    avgWin,
    avgWinPct: avg(wins, (t) => t.profitPct),
    avgLoss,
    avgLossPct: avg(losses, (t) => -t.profitPct),
    ratioWinLoss: avgWin / avgLoss,
    largestWin: largestWin?.profit ?? NaN,
    largestWinPct: largestWin?.profitPct ?? NaN,
    largestLoss: largestLoss ? -largestLoss.profit : NaN,
    largestLossPct: largestLoss ? -largestLoss.profitPct : NaN,
    avgBars: avg(trades, bars),
    avgBarsWin: avg(wins, bars),
    avgBarsLoss: avg(losses, bars),
    profitFactor: gl > 0 ? gp / gl : gp > 0 ? Infinity : NaN,
    maxContracts,
  };
}

const monthKey = (t: number) => new Date(t).toISOString().slice(0, 7);

function ratios(equity: Float64Array, time: Float64Array, rfr: number): { sharpe: number; sortino: number } {
  // monthly returns of the equity, as TradingView computes them
  const ends: number[] = [];
  let last = NaN;
  let key = '';
  for (let i = 0; i < equity.length; i++) {
    const v = equity[i];
    if (v !== v) continue;
    const k = monthKey(time[i]);
    if (k !== key && key) ends.push(last);
    key = k;
    last = v;
  }
  if (key) ends.push(last);
  const first = equity.find((v) => v === v) ?? NaN;
  const series = [first, ...ends];
  const r: number[] = [];
  for (let i = 1; i < series.length; i++) if (series[i - 1] > 0) r.push(series[i] / series[i - 1] - 1);
  if (r.length < 2) return { sharpe: NaN, sortino: NaN };
  const mrf = rfr / 100 / 12;
  const mean = r.reduce((s, v) => s + v, 0) / r.length;
  const sd = Math.sqrt(r.reduce((s, v) => s + (v - mean) ** 2, 0) / r.length);
  const down = Math.sqrt(r.reduce((s, v) => s + Math.min(0, v - mrf) ** 2, 0) / r.length);
  return { sharpe: sd ? (mean - mrf) / sd : NaN, sortino: down ? (mean - mrf) / down : NaN };
}

export function buildReport(b: Broker, time: Float64Array, close: Float64Array): Report {
  const ic = b.s.initialCapital;
  const n = close.length;
  const lastClose = close[n - 1];
  const openPnl = b.openProfit(lastClose);
  const firstIdx = b.equity.findIndex((v) => v === v);
  const startPrice = close[Math.max(0, firstIdx)];
  const bhQty = startPrice > 0 ? ic / b.value(1, startPrice) : 0;
  const bh = (i: number) => ic + (close[i] - startPrice) * bhQty * b.pointValue * b.conv(close[i]);
  const { sharpe, sortino } = ratios(b.equity, time, b.s.riskFreeRate);

  // thinned curve: at most ~1500 points, keeping each window's lowest equity so drawdowns show
  const step = Math.max(1, Math.ceil(n / 1500));
  const curve: EquityPoint[] = [];
  let peak = ic;
  for (let i = 0; i < n; i += step) {
    let k = i;
    for (let j = i; j < Math.min(n, i + step); j++) {
      const v = b.equity[j];
      if (v === v && (b.equity[k] !== b.equity[k] || v < b.equity[k])) k = j;
      if (v === v) peak = Math.max(peak, v);
    }
    const eq = b.equity[k];
    if (eq !== eq) continue;
    curve.push({ t: time[k], equity: eq, dd: eq - peak, bh: bh(k) });
  }
  if (n && b.equity[n - 1] === b.equity[n - 1] && curve[curve.length - 1]?.t !== time[n - 1])
    curve.push({ t: time[n - 1], equity: b.equity[n - 1], dd: Math.min(0, b.equity[n - 1] - peak), bh: bh(n - 1) });

  const byMonth = new Map<string, number>();
  for (const t of b.closed) byMonth.set(monthKey(t.exitTime), (byMonth.get(monthKey(t.exitTime)) ?? 0) + t.profit);
  let running = ic;
  const monthly = [...byMonth.entries()]
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([month, profit]) => {
      const r = { month, profit, returnPct: running > 0 ? (profit / running) * 100 : NaN };
      running += profit;
      return r;
    });

  return {
    initialCapital: ic,
    finalEquity: ic + b.net + openPnl,
    openPnl,
    maxDrawdown: b.maxDD,
    maxDrawdownPct: b.maxDDPct,
    maxRunup: b.maxRunup,
    maxRunupPct: b.maxRunupPct,
    buyHold: bh(n - 1) - ic,
    buyHoldPct: ((bh(n - 1) - ic) / ic) * 100,
    sharpe,
    sortino,
    openTrades: b.open.length,
    all: perf(b.closed, ic, b.maxHeld.all),
    long: perf(
      b.closed.filter((t) => t.side > 0),
      ic,
      b.maxHeld.long,
    ),
    short: perf(
      b.closed.filter((t) => t.side < 0),
      ic,
      b.maxHeld.short,
    ),
    curve,
    monthly,
  };
}
