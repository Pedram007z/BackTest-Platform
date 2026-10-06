import { BAR_MS, SYMBOL_MAP, bars5m, pointValueUsd, type Bar } from './market';
import type { OrderType, PartialClose, Side, Trade } from './types';

/**
 * The simulated broker: order types, position sizing, fills, stops, targets and partial closes.
 * Everything here is pure; the store applies the results.
 */

export const dirOf = (side: Side) => (side === 'buy' ? 1 : -1);
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Order type implied by where the entry sits relative to the market:
 * at the market → market order; a better price → limit; a worse price (breakout) → stop.
 */
export function detectOrderType(side: Side, entry: number, market: number, tick: number): OrderType {
  if (Math.abs(entry - market) <= tick / 2) return 'market';
  const below = entry < market;
  if (side === 'buy') return below ? 'limit' : 'stop';
  return below ? 'stop' : 'limit';
}

export const ORDER_LABEL: Record<OrderType, string> = { market: 'مارکت', limit: 'لیمیت', stop: 'استاپ' };
export const orderTitle = (side: Side, type: OrderType) => `${side === 'buy' ? 'خرید' : 'فروش'} ${ORDER_LABEL[type]}`;
export const orderTitleEn = (side: Side, type: OrderType) => `${side === 'buy' ? 'Buy' : 'Sell'} ${type === 'market' ? 'Market' : type === 'limit' ? 'Limit' : 'Stop'}`;

export const tickOf = (symbolId: string) => 10 ** -(SYMBOL_MAP[symbolId]?.digits ?? 2);

/** Round a lot amount to the lot step without floating-point dust (6.81, not 6.8100000000000005). */
export function roundLots(lots: number, step: number): number {
  const decimals = Math.max(0, Math.round(-Math.log10(step)));
  return Number((Math.round(lots / step) * step).toFixed(decimals));
}

/** Lots that risk `riskUsd` between entry and stop, rounded down to the symbol's lot step (at least one step). */
export function lotsForRisk(symbolId: string, riskUsd: number, entry: number, sl: number, time: number): number {
  const s = SYMBOL_MAP[symbolId];
  const dist = Math.abs(entry - sl);
  if (!s || dist <= 0 || riskUsd <= 0) return s?.lotStep ?? 0.01;
  const raw = riskUsd / (dist * pointValueUsd(symbolId, time));
  const steps = Math.floor(raw / s.lotStep + 1e-9);
  return roundLots(Math.max(1, steps) * s.lotStep, s.lotStep);
}

export const fmtLots = (lots: number, symbolId?: string) => {
  const step = symbolId ? (SYMBOL_MAP[symbolId]?.lotStep ?? 0.01) : 0.01;
  return lots.toFixed(step < 0.01 ? 3 : 2);
};

export interface OrderDraft {
  symbol: string;
  side: Side;
  entry: number;
  sl: number;
  tp: number;
}

export interface OrderPreview {
  type: OrderType;
  lots: number;
  /** Dollars lost if the stop is hit with the rounded lot size. */
  riskUsd: number;
  rewardUsd: number;
  rr: number;
  slPips: number;
  tpPips: number;
  /** Why the order cannot be placed, if anything. */
  problem: string;
}

export function previewOrder(d: OrderDraft, market: number, balance: number, riskPct: number, time: number): OrderPreview {
  const s = SYMBOL_MAP[d.symbol];
  const pip = s?.pip ?? 1;
  const type = detectOrderType(d.side, d.entry, market, tickOf(d.symbol));
  const dir = dirOf(d.side);
  const lots = lotsForRisk(d.symbol, (balance * riskPct) / 100, d.entry, d.sl, time);
  const pv = pointValueUsd(d.symbol, time) * lots;
  const slDist = (d.entry - d.sl) * dir;
  const tpDist = (d.tp - d.entry) * dir;
  let problem = '';
  if (!(riskPct > 0 && riskPct <= 10)) problem = 'ریسک باید بین ۰ تا ۱۰ درصد باشد.';
  else if (slDist <= 0) problem = d.side === 'buy' ? 'حد ضرر خرید باید زیر قیمت ورود باشد.' : 'حد ضرر فروش باید بالای قیمت ورود باشد.';
  else if (tpDist <= 0) problem = d.side === 'buy' ? 'حد سود خرید باید بالای قیمت ورود باشد.' : 'حد سود فروش باید زیر قیمت ورود باشد.';
  return {
    type,
    lots,
    riskUsd: round2(Math.max(0, slDist) * pv),
    rewardUsd: round2(Math.max(0, tpDist) * pv),
    rr: slDist > 0 ? tpDist / slDist : 0,
    slPips: slDist / pip,
    tpPips: tpDist / pip,
    problem,
  };
}

/** Price distance of 1R (the original stop) for a trade. */
export function riskDistance(t: Pick<Trade, 'risk' | 'pointValue' | 'initialLots'>): number {
  const denom = t.pointValue * t.initialLots;
  return denom > 0 ? t.risk / denom : 0;
}

export function rOfPrice(t: Trade, price: number): number {
  const rd = riskDistance(t);
  return rd > 0 ? ((price - t.entry) * dirOf(t.side)) / rd : 0;
}

/** Unrealised dollars on what is still open at `price`. */
export function openPnl(t: Trade, price: number): number {
  if (t.status !== 'open') return 0;
  return round2((price - t.entry) * dirOf(t.side) * t.pointValue * t.lots);
}

export function realizedPnl(t: Trade): number {
  return round2(t.partials.reduce((s, p) => s + p.pnl, 0));
}

/** Close `lots` of an open position at `price`. Closing everything finishes the trade. */
export function closeLots(t: Trade, lots: number, price: number, time: number, reason: Trade['closeReason'] = 'manual'): Trade {
  if (t.status !== 'open') return t;
  const step = SYMBOL_MAP[t.symbol]?.lotStep ?? 0.01;
  const qty = Math.min(t.lots, Math.max(step, roundLots(lots, step)));
  const pnl = round2((price - t.entry) * dirOf(t.side) * t.pointValue * qty);
  const partials: PartialClose[] = [...t.partials, { time, price, lots: qty, pnl }];
  const left = roundLots(t.lots - qty, step);
  const total = round2(partials.reduce((s, p) => s + p.pnl, 0));
  const closedLots = partials.reduce((s, p) => s + p.lots, 0);
  const exit = partials.reduce((s, p) => s + p.price * p.lots, 0) / (closedLots || 1);
  const next: Trade = {
    ...t,
    lots: left > step / 2 ? left : 0,
    partials,
    pnl: total,
    r: t.risk > 0 ? round2(total / t.risk) : 0,
    exit,
  };
  if (next.lots === 0) {
    next.status = 'closed';
    next.closeTime = time;
    next.closeReason = reason;
    next.closedAt = Date.now();
  }
  return next;
}

/** Track the best price reached, for max RR. */
function track(t: Trade, bar: Bar): Trade {
  const best = t.side === 'buy' ? Math.max(t.bestPrice ?? t.entry, bar.high) : Math.min(t.bestPrice ?? t.entry, bar.low);
  const maxR = Math.max(0, round2(rOfPrice(t, best)));
  return { ...t, bestPrice: best, maxR, idealR: Math.max(t.idealR ?? 0, maxR) };
}

export interface FillEvent {
  kind: 'filled' | 'sl' | 'tp';
  trade: Trade;
}

/**
 * Run one completed bar (5-minute, 1-minute or 1-second) through a trade. Pending orders fill when price trades through
 * the entry (at the open if the bar gaps past it). Open positions stop out or take profit; when
 * both levels sit inside one bar the stop is assumed to come first.
 */
export function processBar(t: Trade, bar: Bar, events: FillEvent[]): Trade {
  let trade = t;
  const end = bar.time + bar.ms;

  if (trade.status === 'pending') {
    const e = trade.entry;
    const hit =
      (trade.side === 'buy' && trade.orderType === 'limit' && bar.low <= e) ||
      (trade.side === 'buy' && trade.orderType === 'stop' && bar.high >= e) ||
      (trade.side === 'sell' && trade.orderType === 'limit' && bar.high >= e) ||
      (trade.side === 'sell' && trade.orderType === 'stop' && bar.low <= e);
    if (!hit) return trade;
    const gapped =
      (trade.orderType === 'stop' && (trade.side === 'buy' ? bar.open > e : bar.open < e)) || (trade.orderType === 'limit' && (trade.side === 'buy' ? bar.open < e : bar.open > e));
    const fill = gapped ? bar.open : e;
    // keep 1R in dollars: shift the stop and target with the fill
    const shift = fill - e;
    trade = { ...trade, status: 'open', entry: fill, sl: trade.sl + shift, tp: trade.tp + shift, openTime: bar.time, bestPrice: fill };
    events.push({ kind: 'filled', trade });
    // in the fill bar only the stop is checked (we cannot know the order of the moves inside it)
    const stopNow = trade.side === 'buy' ? bar.low <= trade.sl : bar.high >= trade.sl;
    if (stopNow) {
      trade = closeLots(trade, trade.lots, trade.sl, end, 'sl');
      events.push({ kind: 'sl', trade });
    }
    return trade;
  }

  if (trade.status !== 'open') return trade;
  const buy = trade.side === 'buy';
  const hitSl = buy ? bar.low <= trade.sl : bar.high >= trade.sl;
  const hitTp = trade.tp > 0 && (buy ? bar.high >= trade.tp : bar.low <= trade.tp);
  // a bar that stops out is assumed to hit the stop before its favourable extreme
  if (!hitSl) trade = track(trade, bar);
  if (hitSl) {
    const gap = buy ? bar.open < trade.sl : bar.open > trade.sl;
    trade = closeLots(trade, trade.lots, gap ? bar.open : trade.sl, end, 'sl');
    events.push({ kind: 'sl', trade });
  } else if (hitTp) {
    const gap = buy ? bar.open > trade.tp : bar.open < trade.tp;
    trade = closeLots(trade, trade.lots, gap ? bar.open : trade.tp, end, 'tp');
    events.push({ kind: 'tp', trade });
  }
  return trade;
}

const IDEAL_WINDOW = 5 * 86_400_000;

/**
 * After a trade closes, keep following price (only up to the replay cursor) to see how far it ran
 * before the original stop would have been hit: the "ideal" RR.
 */
export function followIdeal(t: Trade, bar: Bar): Trade {
  if (t.status !== 'closed' || t.idealDone || !t.closeTime || bar.time < t.closeTime) return t;
  const rd = riskDistance(t);
  if (rd <= 0) return { ...t, idealDone: true };
  const dir = dirOf(t.side);
  const stop = t.entry - dir * rd;
  const best = t.side === 'buy' ? Math.max(t.bestPrice ?? t.entry, bar.high) : Math.min(t.bestPrice ?? t.entry, bar.low);
  const stopped = t.side === 'buy' ? bar.low <= stop : bar.high >= stop;
  const idealR = Math.max(t.idealR ?? 0, round2(((best - t.entry) * dir) / rd));
  const done = stopped || bar.time - t.openTime > IDEAL_WINDOW;
  return { ...t, bestPrice: best, idealR, idealDone: done };
}

/** Build a finished historical trade directly from bars (sample data). */
export function simulateHistorical(base: Omit<Trade, 'status' | 'partials' | 'lots'> & { lots?: number }, maxHoldMs: number): Trade {
  let trade: Trade = { ...base, lots: base.initialLots, status: 'open', partials: [], bestPrice: base.entry };
  const events: FillEvent[] = [];
  const bars = bars5m(trade.symbol, trade.openTime, trade.openTime + maxHoldMs);
  for (const b of bars) {
    trade = processBar(trade, b, events);
    if (trade.status !== 'open') break;
  }
  if (trade.status === 'open') {
    const last = bars[bars.length - 1];
    trade = closeLots(trade, trade.lots, last ? last.close : trade.entry, (last?.time ?? trade.openTime) + BAR_MS, 'manual');
  }
  for (const b of bars5m(trade.symbol, trade.closeTime ?? trade.openTime, (trade.closeTime ?? trade.openTime) + IDEAL_WINDOW)) {
    trade = followIdeal(trade, b);
    if (trade.idealDone) break;
  }
  return trade;
}
