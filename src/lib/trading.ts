import { BAR_MS, SYMBOL_MAP, bars5m, pointValueUsd, subBars, type Bar } from './market';
import type { OrderType, PartialClose, Side, SymbolCosts, Trade } from './types';

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

/** A session's spread for a symbol in price units (its setting is in pips). */
export function sessionSpread(session: { costs?: Record<string, SymbolCosts> }, symbolId: string): number {
  const pips = session.costs?.[symbolId]?.spreadPips ?? 0;
  const s = SYMBOL_MAP[symbolId];
  return s && pips > 0 ? Math.round(pips * s.pip * 10 ** s.digits) / 10 ** s.digits : 0;
}

/** A session's commission for a symbol: USD per lot, round turn. */
export const sessionCommission = (session: { costs?: Record<string, SymbolCosts> }, symbolId: string) => Math.max(0, session.costs?.[symbolId]?.commissionPerLot ?? 0);

/** Ask − bid the trade was placed with (price units). */
export const spreadOf = (t: Pick<Trade, 'spread'>) => t.spread ?? 0;

/** The price an open position closes at while the chart (bid) shows `bid`: the bid for buys, the ask for sells. */
export const exitPriceAt = (t: Pick<Trade, 'side' | 'spread'>, bid: number) => (t.side === 'buy' ? bid : bid + spreadOf(t));

/** USD commission for closing `lots` of the trade. */
export const commissionFor = (t: Pick<Trade, 'commissionPerLot'>, lots: number) => round2((t.commissionPerLot ?? 0) * lots);

/** Unrealised dollars on what is still open while the chart shows `bid`: closed at the bid (buys) or ask (sells), less commission. */
export function openPnl(t: Trade, bid: number): number {
  if (t.status !== 'open') return 0;
  return round2((exitPriceAt(t, bid) - t.entry) * dirOf(t.side) * t.pointValue * t.lots - commissionFor(t, t.lots));
}

export function realizedPnl(t: Trade): number {
  return round2(t.partials.reduce((s, p) => s + p.pnl, 0));
}

/** Close `lots` of an open position at `price`. Closing everything finishes the trade. */
export function closeLots(t: Trade, lots: number, price: number, time: number, reason: Trade['closeReason'] = 'manual'): Trade {
  if (t.status !== 'open') return t;
  const step = SYMBOL_MAP[t.symbol]?.lotStep ?? 0.01;
  const qty = Math.min(t.lots, Math.max(step, roundLots(lots, step)));
  const commission = commissionFor(t, qty);
  const pnl = round2((price - t.entry) * dirOf(t.side) * t.pointValue * qty - commission);
  const partials: PartialClose[] = [...t.partials, commission ? { time, price, lots: qty, pnl, commission } : { time, price, lots: qty, pnl }];
  const left = roundLots(t.lots - qty, step);
  const total = round2(partials.reduce((s, p) => s + p.pnl, 0));
  const closedLots = partials.reduce((s, p) => s + p.lots, 0);
  const exit = partials.reduce((s, p) => s + p.price * p.lots, 0) / (closedLots || 1);
  const next: Trade = {
    ...t,
    lots: left > step / 2 ? left : 0,
    partials,
    ...(commission ? { commission: round2((t.commission ?? 0) + commission) } : {}),
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
 * Where an order or exit triggers, as a bid price (bars are bid prices) and the way price must move to
 * reach it. Buys fill on the ask (bid + spread); sell positions close on the ask.
 */
interface Trigger {
  level: number;
  rising: boolean;
}
const reached = (p: number, g: Trigger) => (g.rising ? p >= g.level : p <= g.level);
const inBar = (bar: Bar, g: Trigger) => (g.rising ? bar.high >= g.level : bar.low <= g.level);

function entryTrigger(t: Trade): Trigger {
  // buy limit: the ask falls to the entry · buy stop: the ask rises to it · sell limit: the bid rises · sell stop: the bid falls
  if (t.side === 'buy') return { level: t.entry - spreadOf(t), rising: t.orderType === 'stop' };
  return { level: t.entry, rising: t.orderType === 'limit' };
}

function exitTriggers(t: Trade): { sl: Trigger; tp: Trigger | null } {
  const buy = t.side === 'buy';
  const s = buy ? 0 : spreadOf(t);
  return { sl: { level: t.sl - s, rising: !buy }, tp: t.tp > 0 ? { level: t.tp - s, rising: buy } : null };
}

/**
 * The path assumed inside a bar when finer data is not available (as TradingView assumes):
 * open → the nearer extreme → the other extreme → close.
 */
function barPath(bar: Bar): number[] {
  const highFirst = bar.high - bar.open < bar.open - bar.low;
  return highFirst ? [bar.open, bar.high, bar.low, bar.close] : [bar.open, bar.low, bar.high, bar.close];
}

/** Whether the order of the moves inside the bar decides what happens. */
function needsOrder(t: Trade, bar: Bar): boolean {
  if (t.status === 'pending') return inBar(bar, entryTrigger(t));
  if (t.status !== 'open') return false;
  const { sl, tp } = exitTriggers(t);
  return inBar(bar, sl) && !!tp && inBar(bar, tp);
}

/**
 * Run one completed bar (5-minute, 1-minute or 1-second) through a trade. Pending orders fill when the
 * price trades through the entry (at the open if the bar gaps past it); open positions stop out or take
 * profit. When the order of the moves inside the bar matters (an order fills, then its stop or target is
 * reached; or both the stop and the target are inside one bar), the bar is replayed from its recorded
 * 1-minute and 1-second bars when those are loaded. Without them, a bar that fills an order is walked
 * open → nearer extreme → other extreme → close, and an open position whose stop and target are both
 * inside one bar is assumed to hit the stop first.
 */
export function processBar(t: Trade, bar: Bar, events: FillEvent[]): Trade {
  if (t.status !== 'pending' && t.status !== 'open') return t;
  if (needsOrder(t, bar)) {
    const inner = subBars(t.symbol, bar);
    if (inner) {
      let trade = t;
      for (const b of inner) {
        if (trade.status === 'pending' || trade.status === 'open') trade = processBar(trade, b, events);
        else if (trade.status === 'closed' && !trade.idealDone) trade = followIdeal(trade, b);
      }
      return trade;
    }
  }
  return t.status === 'pending' ? fillBar(t, bar, events) : exitBar(t, bar, events);
}

/** A bar that may fill a pending order, walked along its assumed path; the fill can stop out or take profit later in the same bar. */
function fillBar(t: Trade, bar: Bar, events: FillEvent[]): Trade {
  const end = bar.time + bar.ms;
  const path = barPath(bar);
  const entry = entryTrigger(t);
  let seg = 0;
  let at: number;
  let fill: number;
  if (reached(path[0], entry)) {
    // the bar opened past the entry: filled at the open (the ask for buys)
    at = path[0];
    fill = t.side === 'buy' ? path[0] + spreadOf(t) : path[0];
  } else {
    while (seg < 3 && !reached(path[seg + 1], entry)) seg++;
    if (seg === 3) return t;
    at = entry.level;
    fill = t.entry;
  }
  // keep 1R in dollars: shift the stop and target with the fill
  const shift = fill - t.entry;
  let trade: Trade = { ...t, status: 'open', entry: fill, sl: t.sl + shift, tp: t.tp > 0 ? t.tp + shift : t.tp, openTime: bar.time, bestPrice: fill };
  events.push({ kind: 'filled', trade });

  // the rest of the bar, from the fill on
  const buy = trade.side === 'buy';
  const { sl, tp } = exitTriggers(trade);
  const close = (price: number, reason: 'sl' | 'tp') => {
    trade = closeLots(trade, trade.lots, price, end, reason);
    events.push({ kind: reason, trade });
    return trade;
  };
  // opened past the stop or target already (a gap through both levels)
  if (reached(at, sl)) return close(exitPriceAt(trade, at), 'sl');
  if (tp && reached(at, tp)) return close(exitPriceAt(trade, at), 'tp');
  let best = at;
  for (let i = seg; i < 3; i++) {
    const next = path[i + 1];
    // a stretch of the path moves one way only, so it can reach the stop or the target, not both
    if (reached(next, sl)) return close(trade.sl, 'sl');
    if (tp && reached(next, tp)) return close(trade.tp, 'tp');
    best = buy ? Math.max(best, next) : Math.min(best, next);
  }
  const maxR = Math.max(0, round2(rOfPrice(trade, best)));
  return { ...trade, bestPrice: buy ? Math.max(fill, best) : Math.min(fill, best), maxR, idealR: Math.max(trade.idealR ?? 0, maxR) };
}

/** A bar for an open position: its stop or target (the stop first when both are inside the bar). */
function exitBar(t: Trade, bar: Bar, events: FillEvent[]): Trade {
  let trade = t;
  const end = bar.time + bar.ms;
  const { sl, tp } = exitTriggers(trade);
  const hitSl = inBar(bar, sl);
  const hitTp = !!tp && inBar(bar, tp);
  // a bar that stops out is assumed to hit the stop before its favourable extreme
  if (!hitSl) trade = track(trade, bar);
  if (hitSl) {
    // opened past the stop: closed at the open
    const price = reached(bar.open, sl) ? exitPriceAt(trade, bar.open) : trade.sl;
    trade = closeLots(trade, trade.lots, price, end, 'sl');
    events.push({ kind: 'sl', trade });
  } else if (hitTp) {
    const price = reached(bar.open, tp!) ? exitPriceAt(trade, bar.open) : trade.tp;
    trade = closeLots(trade, trade.lots, price, end, 'tp');
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
