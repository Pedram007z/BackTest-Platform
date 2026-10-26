import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { BAR_MS, MIN_MS, dayIndexOf, dayStartMs, marketSource, setRemoteMinutes, type Bar } from '../../src/lib/market';
import { closeLots, openPnl, processBar, type FillEvent } from '../../src/lib/trading';
import type { Trade } from '../../src/lib/types';

// bars here are made up for each case; no finer (1-minute) data is loaded unless a test sets it
const T0 = Date.parse('2024-01-15T10:00:00Z');
beforeEach(() => {
  marketSource.mode = 'remote';
  marketSource.remote.add('EURUSD');
  setRemoteMinutes('EURUSD', dayIndexOf(T0), null);
});

const bar = (open: number, high: number, low: number, close: number, time = T0, ms = BAR_MS): Bar => ({ time, open, high, low, close, ms });
const order = (p: Partial<Trade>): Trade => ({
  id: 't1',
  sessionId: 's1',
  symbol: 'EURUSD',
  side: 'buy',
  orderType: 'limit',
  status: 'pending',
  entry: 1.1,
  sl: 1.098,
  tp: 1.103,
  lots: 1,
  initialLots: 1,
  pointValue: 100_000,
  risk: 200,
  riskPct: 1,
  placedTime: T0 - BAR_MS,
  openTime: T0 - BAR_MS,
  partials: [],
  executedAt: 0,
  ...p,
});
const near = (a: number | undefined, b: number) => assert.ok(a !== undefined && Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);
const run = (t: Trade, b: Bar) => {
  const events: FillEvent[] = [];
  const out = processBar(t, b, events);
  return { out, kinds: events.map((e) => e.kind) };
};

test('a buy limit that fills and reaches its target in the same candle takes profit', () => {
  // open 1.1010 → low 1.0990 (fills at 1.1000) → high 1.1040 (target 1.1030) → close
  const { out, kinds } = run(order({}), bar(1.101, 1.104, 1.099, 1.1035));
  assert.deepEqual(kinds, ['filled', 'tp']);
  assert.equal(out.status, 'closed');
  assert.equal(out.closeReason, 'tp');
  near(out.exit, 1.103);
  assert.equal(out.pnl, 300);
});

test('a high made before the fill does not count toward the target', () => {
  // open 1.1010 → high 1.1032 first (nearer), then down to 1.0985 (fills at 1.1000), close 1.1005: still open
  const { out, kinds } = run(order({ sl: 1.097 }), bar(1.101, 1.1032, 1.0985, 1.1005));
  assert.deepEqual(kinds, ['filled']);
  assert.equal(out.status, 'open');
  near(out.entry, 1.1);
});

test('a sell stop that fills and stops out in the same candle', () => {
  // open 1.1005 → low 1.0990 first (fills at 1.1000) → high 1.1030 (stop 1.1020)
  const t = order({ side: 'sell', orderType: 'stop', entry: 1.1, sl: 1.102, tp: 1.097 });
  const { out, kinds } = run(t, bar(1.1005, 1.103, 1.099, 1.1025));
  assert.deepEqual(kinds, ['filled', 'sl']);
  assert.equal(out.closeReason, 'sl');
  near(out.exit, 1.102);
  assert.equal(out.pnl, -200);
});

test('a sell limit that fills and takes profit in the same candle', () => {
  // open 1.0995 → high 1.1010 first (fills at 1.1000) → low 1.0960 (target 1.0970)
  const t = order({ side: 'sell', orderType: 'limit', entry: 1.1, sl: 1.102, tp: 1.097 });
  const { out, kinds } = run(t, bar(1.0995, 1.101, 1.096, 1.0965));
  assert.deepEqual(kinds, ['filled', 'tp']);
  near(out.exit, 1.097);
});

test('a candle that gaps past the entry fills at the open and can still reach the target', () => {
  // buy stop at 1.1000, the candle opens at 1.1010: filled there; stop and target move with the fill
  const t = order({ orderType: 'stop', entry: 1.1, sl: 1.098, tp: 1.103 });
  const { out, kinds } = run(t, bar(1.101, 1.1045, 1.1005, 1.104));
  assert.deepEqual(kinds, ['filled', 'tp']);
  near(out.exit, 1.104);
  assert.equal(out.pnl, 300);
});

test('an open position with both levels inside one candle still stops out first', () => {
  const t = order({ status: 'open' });
  const { kinds } = run(t, bar(1.1, 1.1035, 1.0975, 1.1));
  assert.deepEqual(kinds, ['sl']);
});

test('recorded 1-minute bars decide the order inside a 5-minute candle', () => {
  const idx = dayIndexOf(T0);
  const mins = new Float64Array(1440 * 4).fill(NaN);
  const m = (T0 - dayStartMs(idx)) / MIN_MS;
  const put = (j: number, o: number, h: number, l: number, c: number) => mins.set([o, h, l, c], (m + j) * 4);
  // the target is reached in the 2nd minute, the stop only in the 4th
  put(0, 1.1, 1.1012, 1.0995, 1.101);
  put(1, 1.101, 1.1035, 1.1008, 1.103);
  put(2, 1.103, 1.1031, 1.1, 1.1);
  put(3, 1.1, 1.1001, 1.0975, 1.098);
  put(4, 1.098, 1.1, 1.0978, 1.1);
  setRemoteMinutes('EURUSD', idx, mins);
  const { out, kinds } = run(order({ status: 'open' }), bar(1.1, 1.1035, 1.0975, 1.1));
  assert.deepEqual(kinds, ['tp']);
  assert.equal(out.closeTime, T0 + 2 * MIN_MS);
});

test('spread: buys fill on the ask, sell positions close on the ask', () => {
  const spread = 0.0002;
  // buy limit 1.1000: the bid must fall to 1.0998 before the ask reaches the entry
  assert.equal(run(order({ spread }), bar(1.101, 1.1015, 1.0999, 1.1005)).out.status, 'pending');
  assert.equal(run(order({ spread }), bar(1.101, 1.1015, 1.0998, 1.1005)).out.status, 'open');
  // a short's target at 1.0970 is reached when the bid falls to 1.0968
  const short = order({ side: 'sell', status: 'open', entry: 1.1, sl: 1.102, tp: 1.097, spread });
  assert.equal(run(short, bar(1.099, 1.0995, 1.0969, 1.098)).out.status, 'open');
  const hit = run(short, bar(1.099, 1.0995, 1.0968, 1.098)).out;
  assert.equal(hit.closeReason, 'tp');
  near(hit.exit, 1.097);
  // floating P&L of a short is measured at the ask
  assert.equal(openPnl(short, 1.099), Math.round((1.1 - 1.0992) * 100_000 * 100) / 100);
});

test('commission comes off each close and the floating P&L', () => {
  const t = order({ status: 'open', lots: 2, initialLots: 2, risk: 400, commissionPerLot: 7 });
  assert.equal(openPnl(t, 1.101), 200 - 14);
  const half = closeLots(t, 1, 1.101, T0, 'manual');
  assert.equal(half.partials[0].pnl, 93);
  assert.equal(half.partials[0].commission, 7);
  const done = closeLots(half, 1, 1.102, T0, 'manual');
  assert.equal(done.pnl, 93 + 193);
  assert.equal(done.commission, 14);
  assert.equal(done.status, 'closed');
});
