import { type BrokerApi, type Rt, fail, int, isNa, num, str } from './core';

/**
 * The strategy broker emulator, as TradingView's Strategy Tester works by default:
 *
 * - The script runs at each bar's close. Orders it places are worked from the next bar: market orders
 *   fill at the next bar's open (with `process_orders_on_close`, at this bar's close).
 * - Inside a bar, price is assumed to go open → the nearer of high / low → the other → close. With the
 *   bar magnifier, the path goes through the bar's 5-minute bars instead. Stop and limit orders fill
 *   where the path reaches them (at the open when the bar gaps past them); stops and market orders get
 *   the slippage.
 * - strategy.entry reverses an opposite position and respects `pyramiding`; strategy.order does not.
 *   strategy.exit places a take-profit / stop-loss / trailing stop for the trades of an entry (all
 *   trades without from_entry); one filling cancels the others for that trade.
 * - Quantities are in units (contracts, coins, base currency units: 1 forex lot = 100,000 units).
 *   P&L is in USD.
 */

export interface BrokerSettings {
  initialCapital: number;
  pyramiding: number;
  qtyType: 'fixed' | 'cash' | 'percent_of_equity';
  qtyValue: number;
  commissionType: 'percent' | 'cash_per_contract' | 'cash_per_order';
  commissionValue: number;
  /** ticks */
  slippage: number;
  processOnClose: boolean;
  closeEntriesRule: 'FIFO' | 'ANY';
  magnifier: boolean;
  riskFreeRate: number;
}

export interface OpenTrade {
  entryId: string;
  side: 1 | -1;
  qty: number;
  price: number;
  bar: number;
  time: number;
  comment: string;
  /** entry commission still unassigned to a closed part */
  commission: number;
  maxP: number;
  minP: number;
}

export interface ClosedTrade {
  entryId: string;
  exitId: string;
  side: 1 | -1;
  qty: number;
  entryPrice: number;
  entryBar: number;
  entryTime: number;
  entryComment: string;
  exitPrice: number;
  exitBar: number;
  exitTime: number;
  exitComment: string;
  profit: number;
  profitPct: number;
  commission: number;
  runup: number;
  runupPct: number;
  drawdown: number;
  drawdownPct: number;
  cumProfit: number;
}

/** An order fill, for the chart's markers. */
export interface Fill {
  bar: number;
  time: number;
  side: 1 | -1;
  qty: number;
  price: number;
  id: string;
  comment: string;
  /** opened (entry) or reduced (exit) a position */
  kind: 'entry' | 'exit';
}

interface Order {
  id: string;
  kind: 'entry' | 'order' | 'close' | 'closeall';
  side: 1 | -1;
  qty: number;
  qtyPct: number;
  limit: number;
  stop: number;
  stopHit: boolean;
  oca: string;
  ocaType: string;
  comment: string;
  seq: number;
}

interface ExitSpec {
  id: string;
  from: string;
  qty: number;
  qtyPct: number;
  profit: number;
  limit: number;
  loss: number;
  stop: number;
  trailPrice: number;
  trailPoints: number;
  trailOffset: number;
  comment: string;
  commentProfit: string;
  commentLoss: string;
  commentTrail: string;
  seq: number;
  attached: boolean;
  /** per trade: size to exit, trailing state */
  per: Map<OpenTrade, { qty: number; trailOn: boolean; best: number }>;
  /** trades this exit has already closed (part of) */
  fired: Set<OpenTrade>;
}

/** A price level that fills when the path reaches it. */
interface Trigger {
  price: number;
  /** fills when price goes up to it (1) or down to it (-1) */
  dir: 1 | -1;
  stop: boolean;
  run: (price: number) => void;
}

export interface BarSeries {
  time: Float64Array;
  timeClose: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
}

/** Finer bars inside each chart bar (the bar magnifier): bar i owns sub-bars [start[i], end[i]). */
export interface SubBars {
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  start: Int32Array;
  end: Int32Array;
}

const EPS = 1e-9;

export class Broker implements BrokerApi {
  s: BrokerSettings;
  open: OpenTrade[] = [];
  closed: ClosedTrade[] = [];
  fills: Fill[] = [];
  orders: Order[] = [];
  exits: ExitSpec[] = [];
  seq = 0;
  net = 0;
  grossProfit = 0;
  grossLoss = 0;
  commissionPaid = 0;
  maxHeld = { all: 0, long: 0, short: 0 };
  allowDir: 'all' | 'long' | 'short' = 'all';
  /** per bar */
  equity: Float64Array;
  /** worst and best equity inside each bar */
  equityLow: Float64Array;
  equityHigh: Float64Array;
  position: Float64Array;
  peak = 0;
  maxDD = 0;
  maxDDPct = 0;
  trough = 0;
  maxRunup = 0;
  maxRunupPct = 0;
  started = false;
  curBar = 0;
  curTime = 0;

  constructor(
    public bars: BarSeries,
    public pointValue: number,
    /** USD per unit of the quote currency at a price of the symbol */
    public conv: (price: number) => number,
    public mintick: number,
    public sub: SubBars | null,
    settings: Partial<BrokerSettings> = {},
  ) {
    const n = bars.close.length;
    this.equity = new Float64Array(n).fill(NaN);
    this.equityLow = new Float64Array(n).fill(NaN);
    this.equityHigh = new Float64Array(n).fill(NaN);
    this.position = new Float64Array(n);
    this.s = {
      initialCapital: 1_000_000,
      pyramiding: 0,
      qtyType: 'fixed',
      qtyValue: 1,
      commissionType: 'percent',
      commissionValue: 0,
      slippage: 0,
      processOnClose: false,
      closeEntriesRule: 'FIFO',
      magnifier: false,
      riskFreeRate: 2,
      ...settings,
    };
  }

  /** Settings from strategy(…), read on the first bar; `fixed` are the tester page's own (they win). */
  configure(args: Record<string, unknown>, fixed: Partial<BrokerSettings>) {
    const s = this.s;
    const n = (v: unknown, d: number) => (v === undefined || isNa(v) ? d : num(v));
    s.initialCapital = n(args.initial_capital, 1_000_000);
    s.pyramiding = Math.max(0, int(n(args.pyramiding, 0)));
    const qt = str(args.default_qty_type);
    s.qtyType = qt === 'cash' || qt === 'percent_of_equity' ? qt : 'fixed';
    s.qtyValue = n(args.default_qty_value, 1);
    const ct = str(args.commission_type);
    s.commissionType = ct === 'cash_per_contract' || ct === 'cash_per_order' ? ct : 'percent';
    s.commissionValue = n(args.commission_value, 0);
    s.slippage = Math.max(0, n(args.slippage, 0));
    s.processOnClose = args.process_orders_on_close === true;
    s.closeEntriesRule = str(args.close_entries_rule).toUpperCase() === 'ANY' ? 'ANY' : 'FIFO';
    s.magnifier = args.use_bar_magnifier === true;
    s.riskFreeRate = n(args.risk_free_rate, 2);
    Object.assign(s, fixed);
    this.peak = this.trough = s.initialCapital;
  }

  // ---------- money ----------
  value(qty: number, price: number) {
    return qty * price * this.pointValue * this.conv(price);
  }
  commissionFor(qty: number, price: number) {
    const s = this.s;
    if (!s.commissionValue) return 0;
    if (s.commissionType === 'percent') return (this.value(qty, price) * s.commissionValue) / 100;
    if (s.commissionType === 'cash_per_contract') return qty * s.commissionValue;
    return s.commissionValue;
  }
  pnl(t: OpenTrade, price: number, qty = t.qty) {
    return (price - t.price) * t.side * qty * this.pointValue * this.conv(price);
  }
  openProfit(price: number) {
    let p = 0;
    for (const t of this.open) p += this.pnl(t, price);
    return p;
  }
  equityAt(price: number) {
    return this.s.initialCapital + this.net + this.openProfit(price);
  }
  get size() {
    let q = 0;
    for (const t of this.open) q += t.side * t.qty;
    return Math.abs(q) < EPS ? 0 : q;
  }
  avgPrice() {
    let q = 0,
      v = 0;
    for (const t of this.open) {
      q += t.qty;
      v += t.qty * t.price;
    }
    return q ? v / q : NaN;
  }
  defaultQty(price: number) {
    const s = this.s;
    let q: number;
    if (s.qtyType === 'fixed') q = s.qtyValue;
    else {
      const unit = this.value(1, price);
      const cash = s.qtyType === 'cash' ? s.qtyValue : (this.equityAt(price) * s.qtyValue) / 100;
      q = unit > 0 ? cash / unit : 0;
    }
    // whole units for large sizes, fractions for coins
    return q >= 100 ? Math.floor(q) : Math.floor(q * 1e6) / 1e6;
  }
  slip(side: 1 | -1, price: number) {
    return this.tick(price + side * this.s.slippage * this.mintick);
  }
  /** Prices of orders are rounded to the symbol's tick, as TradingView does. */
  tick(p: number) {
    if (p !== p) return p;
    const d = Math.max(0, Math.round(-Math.log10(this.mintick)));
    return +(Math.round(p / this.mintick) * this.mintick).toFixed(d);
  }

  // ---------- fills ----------
  private record(side: 1 | -1, qty: number, price: number, id: string, comment: string, kind: Fill['kind']) {
    this.fills.push({ bar: this.curBar, time: this.curTime, side, qty, price, id, comment, kind });
  }

  private openTrade(id: string, side: 1 | -1, qty: number, price: number, comment: string) {
    if (!(qty > EPS)) return;
    const c = this.commissionFor(qty, price);
    this.commissionPaid += c;
    const t: OpenTrade = { entryId: id, side, qty, price, bar: this.curBar, time: this.curTime, comment, commission: c, maxP: price, minP: price };
    this.open.push(t);
    this.record(side, qty, price, id, comment, 'entry');
    const held = Math.abs(this.size);
    this.maxHeld.all = Math.max(this.maxHeld.all, held);
    if (side > 0) this.maxHeld.long = Math.max(this.maxHeld.long, held);
    else this.maxHeld.short = Math.max(this.maxHeld.short, held);
  }

  private closePart(t: OpenTrade, qty: number, price: number, exitId: string, comment: string) {
    const q = Math.min(qty, t.qty);
    if (!(q > EPS)) return 0;
    const share = q / t.qty;
    const entryComm = t.commission * share;
    const exitComm = this.commissionFor(q, price);
    this.commissionPaid += exitComm;
    const gross = this.pnl(t, price, q);
    const profit = gross - entryComm - exitComm;
    const invested = this.value(q, t.price);
    const pv = this.pointValue * this.conv(price);
    const runup = Math.max(0, (t.side > 0 ? t.maxP - t.price : t.price - t.minP) * q * pv);
    const drawdown = Math.max(0, (t.side > 0 ? t.price - t.minP : t.maxP - t.price) * q * pv);
    this.net += profit;
    if (profit > 0) this.grossProfit += profit;
    else this.grossLoss -= profit;
    this.closed.push({
      entryId: t.entryId,
      exitId,
      side: t.side,
      qty: q,
      entryPrice: t.price,
      entryBar: t.bar,
      entryTime: t.time,
      entryComment: t.comment,
      exitPrice: price,
      exitBar: this.curBar,
      exitTime: this.curTime,
      exitComment: comment,
      profit,
      profitPct: invested ? (profit / invested) * 100 : 0,
      commission: entryComm + exitComm,
      runup,
      runupPct: invested ? (runup / invested) * 100 : 0,
      drawdown,
      drawdownPct: invested ? (drawdown / invested) * 100 : 0,
      cumProfit: this.net,
    });
    this.record(t.side > 0 ? -1 : 1, q, price, exitId, comment, 'exit');
    t.qty -= q;
    t.commission -= entryComm;
    if (t.qty <= EPS) {
      this.open.splice(this.open.indexOf(t), 1);
      for (const e of this.exits) e.per.delete(t);
    }
    return q;
  }

  /** Close up to `qty` (all when NaN) of the trades that match, oldest first (FIFO). */
  private closeTrades(match: (t: OpenTrade) => boolean, qty: number, price: number, exitId: string, comment: string) {
    let left = qty !== qty ? Infinity : qty;
    for (const t of [...this.open]) {
      if (left <= EPS) break;
      if (!match(t)) continue;
      left -= this.closePart(t, left, price, exitId, comment);
    }
    this.dropFinishedExits();
  }

  private dropFinishedExits() {
    this.exits = this.exits.filter((e) => !e.attached || this.open.some((t) => !e.from || t.entryId === e.from));
  }

  /** `how`: market and stop fills get the slippage, limit fills do not. */
  private fillOrder(o: Order, rawPrice: number, how: 'market' | 'stop' | 'limit') {
    const price = how === 'limit' ? rawPrice : this.slip(o.side, rawPrice);
    const pos = this.size;
    this.orders = this.orders.filter((x) => x !== o);
    if (o.kind === 'close') {
      const sizeOfEntry = this.open.filter((t) => t.entryId === o.id).reduce((s, t) => s + t.qty, 0);
      const q = o.qty === o.qty ? o.qty : o.qtyPct === o.qtyPct ? (sizeOfEntry * o.qtyPct) / 100 : NaN;
      this.closeTrades((t) => t.entryId === o.id, q, price, o.comment || o.id, o.comment);
      return;
    }
    if (o.kind === 'closeall') {
      this.closeTrades(() => true, NaN, price, o.comment || 'Close position order', o.comment);
      return;
    }
    if (o.kind === 'entry') {
      const dir = o.side > 0 ? 'long' : 'short';
      if (this.allowDir !== 'all' && this.allowDir !== dir) {
        // entries against the allowed direction only close the position
        if (pos * o.side < 0) this.closeTrades(() => true, NaN, price, o.id, o.comment);
        return;
      }
      if (pos * o.side > 0) {
        const same = this.open.filter((t) => t.side === o.side).length;
        if (same >= Math.max(1, this.s.pyramiding)) return;
      }
      const qty = o.qty === o.qty ? o.qty : this.defaultQty(price);
      if (pos * o.side < 0) this.closeTrades(() => true, NaN, price, o.id, o.comment);
      if (qty === qty && qty > 0) this.openTrade(o.id, o.side, qty, price, o.comment);
      this.oca(o);
      return;
    }
    // strategy.order: reduces an opposite position first, the rest opens a new one
    let qty = o.qty === o.qty ? o.qty : this.defaultQty(price);
    if (pos * o.side < 0) {
      const before = qty;
      const closing = Math.min(qty, Math.abs(pos));
      this.closeTrades(() => true, closing, price, o.id, o.comment);
      qty = before - closing;
    }
    if (qty > EPS) this.openTrade(o.id, o.side, qty, price, o.comment);
    this.oca(o);
  }

  private oca(o: Order) {
    if (!o.oca || o.ocaType === 'none') return;
    if (o.ocaType === 'cancel') this.orders = this.orders.filter((x) => x.oca !== o.oca);
  }

  // ---------- working orders along a price path ----------
  private triggers(): Trigger[] {
    const out: Trigger[] = [];
    for (const o of this.orders) {
      if (o.kind === 'close' || o.kind === 'closeall') continue;
      const hasLimit = o.limit === o.limit,
        hasStop = o.stop === o.stop;
      if (!hasLimit && !hasStop) continue;
      if (hasStop && !o.stopHit) {
        // a buy stop fills going up, a sell stop going down; a stop-limit turns into a limit order
        out.push({
          price: o.stop,
          dir: o.side,
          stop: true,
          run: (p) => {
            if (hasLimit) o.stopHit = true;
            else this.fillOrder(o, p, 'stop');
          },
        });
      } else if (hasLimit) out.push({ price: o.limit, dir: o.side > 0 ? -1 : 1, stop: false, run: (p) => this.fillOrder(o, p, 'limit') });
    }
    for (const e of this.exits) {
      for (const t of this.open) {
        if ((e.from && t.entryId !== e.from) || e.fired.has(t)) continue;
        let st = e.per.get(t);
        if (!st) {
          const q = e.qty === e.qty ? Math.min(e.qty, t.qty) : (t.qty * e.qtyPct) / 100;
          st = { qty: q, trailOn: false, best: t.side > 0 ? -Infinity : Infinity };
          e.per.set(t, st);
          e.attached = true;
        }
        const state = st;
        const tp = this.tick(e.limit === e.limit ? e.limit : e.profit === e.profit ? t.price + t.side * e.profit * this.mintick : NaN);
        const sl = this.tick(e.stop === e.stop ? e.stop : e.loss === e.loss ? t.price - t.side * e.loss * this.mintick : NaN);
        const exitSide = t.side > 0 ? -1 : 1;
        const done = (p: number, comment: string, isStop: boolean) => {
          const price = isStop ? this.slip(exitSide, p) : p;
          e.fired.add(t);
          e.per.delete(t);
          this.closePart(t, Math.min(state.qty, t.qty), price, e.id, comment);
          this.dropFinishedExits();
        };
        if (tp === tp) out.push({ price: tp, dir: t.side > 0 ? 1 : -1, stop: false, run: (p) => done(p, e.commentProfit || e.comment, false) });
        if (sl === sl) out.push({ price: sl, dir: t.side > 0 ? -1 : 1, stop: true, run: (p) => done(p, e.commentLoss || e.comment, true) });
        if (state.trailOn && e.trailOffset === e.trailOffset) {
          const level = this.tick(state.best - t.side * e.trailOffset * this.mintick);
          out.push({ price: level, dir: t.side > 0 ? -1 : 1, stop: true, run: (p) => done(p, e.commentTrail || e.comment, true) });
        }
      }
    }
    return out;
  }

  /** Trailing stops: activate and follow the best price reached (`p`). */
  private trail(p: number) {
    for (const e of this.exits) {
      if (e.trailOffset !== e.trailOffset) continue;
      for (const [t, st] of e.per) {
        const act = e.trailPrice === e.trailPrice ? e.trailPrice : e.trailPoints === e.trailPoints ? t.price + t.side * e.trailPoints * this.mintick : NaN;
        if (!st.trailOn && act === act && (t.side > 0 ? p >= act : p <= act)) {
          st.trailOn = true;
          st.best = p;
        }
        if (st.trailOn) st.best = t.side > 0 ? Math.max(st.best, p) : Math.min(st.best, p);
      }
    }
  }

  private trackExtremes(p: number) {
    for (const t of this.open) {
      if (p > t.maxP) t.maxP = p;
      if (p < t.minP) t.minP = p;
    }
  }

  /** Fill everything the move from `from` to `to` reaches, nearest first. */
  private walk(from: number, to: number) {
    let cur = from;
    for (let guard = 0; guard < 1000; guard++) {
      const up = to >= cur;
      let best: Trigger | null = null;
      let bestD = Infinity;
      for (const tr of this.triggers()) {
        // already through it (placed after price passed it): fill at the current price
        const through = tr.dir > 0 ? cur >= tr.price : cur <= tr.price;
        let d: number;
        if (through) d = 0;
        else if (up && tr.dir > 0 && tr.price <= to) d = tr.price - cur;
        else if (!up && tr.dir < 0 && tr.price >= to) d = cur - tr.price;
        else continue;
        if (d < bestD || (d === bestD && best && best.stop && !tr.stop)) {
          best = tr;
          bestD = d;
        }
      }
      if (!best) break;
      const fillAt = bestD === 0 ? cur : best.price;
      this.trackExtremes(fillAt);
      best.run(fillAt);
      cur = fillAt;
    }
    this.trackExtremes(to);
    this.trail(to);
  }

  private path(i: number): number[] {
    const b = this.bars;
    const one = (o: number, h: number, l: number, c: number) => (h - o <= o - l ? [o, h, l, c] : [o, l, h, c]);
    if (this.s.magnifier && this.sub && this.sub.end[i] > this.sub.start[i]) {
      const s = this.sub;
      const out: number[] = [];
      for (let k = s.start[i]; k < s.end[i]; k++) out.push(...one(s.open[k], s.high[k], s.low[k], s.close[k]));
      return out;
    }
    return one(b.open[i], b.high[i], b.low[i], b.close[i]);
  }

  private marketOrders(price: number) {
    for (const o of [...this.orders].sort((a, b) => a.seq - b.seq)) {
      if (!this.orders.includes(o)) continue;
      const market = o.kind === 'close' || o.kind === 'closeall' || (o.limit !== o.limit && o.stop !== o.stop);
      if (market) this.fillOrder(o, price, 'market');
    }
  }

  /** Before the script runs on bar i: work the orders through the bar. */
  beforeBar(rt: Rt) {
    const i = rt.bar;
    this.curBar = i;
    this.curTime = this.bars.time[i];
    if (!this.started) return;
    const pts = this.path(i);
    this.marketOrders(pts[0]);
    this.walk(pts[0], pts[0]);
    for (let k = 1; k < pts.length; k++) this.walk(pts[k - 1], pts[k]);
  }

  /** After the script ran on bar i: orders on close, then the bar's equity. */
  afterBar(rt: Rt) {
    const i = rt.bar;
    if (!this.started && rt.decl?.kind === 'strategy') this.started = true;
    const b = this.bars;
    if (this.s.processOnClose) {
      this.curTime = b.timeClose[i];
      this.marketOrders(b.close[i]);
      this.walk(b.close[i], b.close[i]);
    }
    for (const t of this.open) {
      if (b.high[i] > t.maxP && t.bar < i) t.maxP = b.high[i];
      if (b.low[i] < t.minP && t.bar < i) t.minP = b.low[i];
    }
    const eq = this.equityAt(b.close[i]);
    let lo = eq,
      hi = eq;
    if (this.open.length) {
      const a = this.equityAt(b.high[i]),
        c = this.equityAt(b.low[i]);
      lo = Math.min(eq, a, c);
      hi = Math.max(eq, a, c);
    }
    this.equity[i] = eq;
    this.equityLow[i] = lo;
    this.equityHigh[i] = hi;
    this.position[i] = this.size;
    if (this.peak - lo > this.maxDD) {
      this.maxDD = this.peak - lo;
      this.maxDDPct = (this.maxDD / this.peak) * 100;
    }
    if (hi - this.trough > this.maxRunup) {
      this.maxRunup = hi - this.trough;
      this.maxRunupPct = this.trough > 0 ? (this.maxRunup / this.trough) * 100 : 0;
    }
    this.peak = Math.max(this.peak, hi);
    this.trough = Math.min(this.trough, lo);
  }

  // ---------- strategy.* ----------
  private newOrder(kind: Order['kind'], a: Partial<Order>): Order {
    return { id: '', kind, side: 1, qty: NaN, qtyPct: NaN, limit: NaN, stop: NaN, stopHit: false, oca: '', ocaType: 'none', comment: '', seq: this.seq++, ...a };
  }

  private place(o: Order, rt: Rt, immediately: boolean) {
    if (o.kind === 'entry' || o.kind === 'order') this.orders = this.orders.filter((x) => !(x.id === o.id && (x.kind === 'entry' || x.kind === 'order')));
    if (o.kind === 'close') this.orders = this.orders.filter((x) => !(x.kind === 'close' && x.id === o.id));
    if (o.kind === 'closeall') this.orders = this.orders.filter((x) => x.kind !== 'closeall');
    this.orders.push(o);
    if (immediately) {
      this.curTime = this.bars.timeClose[rt.bar];
      this.fillOrder(o, this.bars.close[rt.bar], 'market');
    }
  }

  private dir(v: unknown): 1 | -1 {
    if (v === 'long' || v === true) return 1;
    if (v === 'short' || v === false) return -1;
    fail('جهت معامله باید strategy.long یا strategy.short باشد.');
  }

  private trade(list: 'closed' | 'open', k: unknown): any {
    const arr = list === 'closed' ? this.closed : this.open;
    const i = int(k);
    return i >= 0 && i < arr.length ? arr[i] : null;
  }

  call(name: string, rt: Rt, a: any[]): any {
    const optN = (v: unknown) => (v === undefined || isNa(v) ? NaN : num(v));
    switch (name) {
      case 'strategy.entry':
      case 'strategy.order': {
        const id = str(a[0]);
        if (!id) fail(`${name} به شناسه (id) نیاز دارد.`);
        const qty = optN(a[2]);
        if (qty === qty && !(qty > 0)) fail('حجم سفارش (qty) باید بزرگ‌تر از صفر باشد.');
        this.place(
          this.newOrder(name === 'strategy.entry' ? 'entry' : 'order', {
            id,
            side: this.dir(a[1]),
            qty,
            limit: this.tick(optN(a[3])),
            stop: this.tick(optN(a[4])),
            oca: str(a[5]),
            ocaType: str(a[6] ?? 'none'),
            comment: str(a[7]),
          }),
          rt,
          false,
        );
        return NaN;
      }
      case 'strategy.exit': {
        const id = str(a[0]);
        if (!id) fail('strategy.exit به شناسه (id) نیاز دارد.');
        const from = str(a[1]);
        const spec = {
          qty: optN(a[2]),
          qtyPct: a[3] === undefined || isNa(a[3]) ? 100 : num(a[3]),
          profit: optN(a[4]),
          limit: optN(a[5]),
          loss: optN(a[6]),
          stop: optN(a[7]),
          trailPrice: optN(a[8]),
          trailPoints: optN(a[9]),
          trailOffset: optN(a[10]),
          comment: str(a[12]),
          commentProfit: str(a[13]),
          commentLoss: str(a[14]),
          commentTrail: str(a[15]),
        };
        const old = this.exits.find((e) => e.id === id && e.from === from);
        if (old) Object.assign(old, spec);
        else this.exits.push({ id, from, ...spec, seq: this.seq++, attached: false, per: new Map(), fired: new Set() });
        return NaN;
      }
      case 'strategy.close':
        this.place(this.newOrder('close', { id: str(a[0]), comment: str(a[1]), qty: optN(a[2]), qtyPct: optN(a[3]) }), rt, a[5] === true);
        return NaN;
      case 'strategy.close_all':
        if (this.open.length || this.orders.some((o) => o.kind !== 'closeall')) this.place(this.newOrder('closeall', { comment: str(a[0]) }), rt, a[2] === true);
        return NaN;
      case 'strategy.cancel': {
        const id = str(a[0]);
        this.orders = this.orders.filter((o) => o.id !== id);
        this.exits = this.exits.filter((e) => e.id !== id);
        return NaN;
      }
      case 'strategy.cancel_all':
        this.orders = [];
        this.exits = [];
        return NaN;
      case 'strategy.risk.allow_entry_in':
        this.allowDir = a[0] === 'long' || a[0] === 'short' ? a[0] : 'all';
        return NaN;
      case 'strategy.convert_to_account':
        return num(a[0]) * this.conv(this.bars.close[rt.bar]);
      case 'strategy.convert_to_symbol':
        return num(a[0]) / this.conv(this.bars.close[rt.bar]);
      case 'strategy.default_entry_qty':
        return this.defaultQty(num(a[0]));
    }
    if (name.startsWith('strategy.risk.')) return NaN;
    const m = /^strategy\.(closedtrades|opentrades)\.(\w+)$/.exec(name);
    if (m) {
      const t = this.trade(m[1] === 'closedtrades' ? 'closed' : 'open', a[0]);
      if (!t) return NaN;
      const price = this.bars.close[rt.bar];
      switch (m[2]) {
        case 'entry_price':
          return t.entryPrice ?? t.price;
        case 'exit_price':
          return t.exitPrice;
        case 'profit':
          return m[1] === 'closedtrades' ? t.profit : this.pnl(t, price);
        case 'profit_percent':
          return m[1] === 'closedtrades' ? t.profitPct : (this.pnl(t, price) / this.value(t.qty, t.price)) * 100;
        case 'entry_bar_index':
          return t.entryBar ?? t.bar;
        case 'exit_bar_index':
          return t.exitBar;
        case 'entry_time':
          return t.entryTime ?? t.time;
        case 'exit_time':
          return t.exitTime;
        case 'size':
          return t.side * t.qty;
        case 'commission':
          return t.commission;
        case 'entry_id':
          return t.entryId;
        case 'exit_id':
          return t.exitId;
        case 'entry_comment':
          return t.entryComment ?? t.comment;
        case 'exit_comment':
          return t.exitComment;
        case 'max_runup':
          return t.runup ?? 0;
        case 'max_drawdown':
          return t.drawdown ?? 0;
        case 'max_runup_percent':
          return t.runupPct ?? 0;
        case 'max_drawdown_percent':
          return t.drawdownPct ?? 0;
      }
    }
    return NaN;
  }

  get(name: string, rt: Rt): any {
    const price = this.bars.close[rt.bar];
    const ic = this.s.initialCapital;
    const wins = this.closed.filter((t) => t.profit > 0);
    const losses = this.closed.filter((t) => t.profit < 0);
    const avg = (x: ClosedTrade[], f: (t: ClosedTrade) => number) => (x.length ? x.reduce((s, t) => s + f(t), 0) / x.length : NaN);
    switch (name) {
      case 'position_size':
        return this.size;
      case 'position_avg_price':
        return this.avgPrice();
      case 'position_entry_name':
        return this.open[this.open.length - 1]?.entryId ?? '';
      case 'equity':
        return this.equityAt(price);
      case 'netprofit':
        return this.net;
      case 'netprofit_percent':
        return (this.net / ic) * 100;
      case 'openprofit':
        return this.openProfit(price);
      case 'openprofit_percent':
        return (this.openProfit(price) / ic) * 100;
      case 'grossprofit':
        return this.grossProfit;
      case 'grossprofit_percent':
        return (this.grossProfit / ic) * 100;
      case 'grossloss':
        return this.grossLoss;
      case 'grossloss_percent':
        return (this.grossLoss / ic) * 100;
      case 'closedtrades':
        return this.closed.length;
      case 'opentrades':
        return this.open.length;
      case 'wintrades':
        return wins.length;
      case 'losstrades':
        return losses.length;
      case 'eventrades':
        return this.closed.length - wins.length - losses.length;
      case 'initial_capital':
        return ic;
      case 'max_drawdown':
        return this.maxDD;
      case 'max_drawdown_percent':
        return this.maxDDPct;
      case 'max_runup':
        return this.maxRunup;
      case 'max_runup_percent':
        return this.maxRunupPct;
      case 'max_contracts_held_all':
        return this.maxHeld.all;
      case 'max_contracts_held_long':
        return this.maxHeld.long;
      case 'max_contracts_held_short':
        return this.maxHeld.short;
      case 'account_currency':
        return 'USD';
      case 'avg_trade':
        return avg(this.closed, (t) => t.profit);
      case 'avg_trade_percent':
        return avg(this.closed, (t) => t.profitPct);
      case 'avg_winning_trade':
        return avg(wins, (t) => t.profit);
      case 'avg_winning_trade_percent':
        return avg(wins, (t) => t.profitPct);
      case 'avg_losing_trade':
        return avg(losses, (t) => -t.profit);
      case 'avg_losing_trade_percent':
        return avg(losses, (t) => -t.profitPct);
      case 'closedtrades.first_index':
        return 0;
      case 'margin_liquidation_price':
        return NaN;
    }
    return NaN;
  }
}
