import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { msToKey } from '../../src/lib/calendar';
import { BAR_MS, dayIndexOf, marketSource, setRemoteDay, setRemoteMinutes } from '../../src/lib/market';
import { planRewind, simulateTrade, withCheckpoint } from '../../src/lib/rewind';
import { closeLots } from '../../src/lib/trading';
import type { Session, Trade } from '../../src/lib/types';

// one made-up EURUSD day: flat at 1.1000 until 10:00 UTC, then up 1 pip per 5-minute bar
const DAY = Date.parse('2024-01-15T00:00:00Z');
const T0 = Date.parse('2024-01-15T10:00:00Z');
const at = (bars: number) => T0 + bars * BAR_MS;
const level = (i: number) => 1.1 + Math.max(0, i - 120) * 0.0001;

before(() => {
  marketSource.mode = 'remote';
  marketSource.remote.add('EURUSD');
  const idx = dayIndexOf(DAY);
  const bars = new Float64Array(288 * 4);
  for (let i = 0; i < 288; i++) {
    const o = level(i);
    const c = level(i + 1);
    bars.set([o, Math.max(o, c) + 0.00002, Math.min(o, c) - 0.00002, c], i * 4);
  }
  setRemoteDay('EURUSD', idx, bars);
  setRemoteMinutes('EURUSD', idx, null);
});

/**
 * The store's order actions in miniature: every action records a checkpoint (withCheckpoint),
 * advance replays the bars, rewind applies planRewind.
 */
function replay() {
  let session: Session = {
    id: 's1',
    name: 'rewind',
    balance: 10_000,
    symbols: ['EURUSD'],
    startDate: msToKey(DAY),
    endDate: msToKey(DAY),
    cursor: T0,
    timeframe: '5m',
    activeSymbol: 'EURUSD',
    createdAt: 0,
  };
  let trades: Trade[] = [];
  let n = 0;
  const act = (next: Trade[]) => {
    trades = next;
    session = { ...session, checkpoints: withCheckpoint(session, trades) };
  };
  const r = {
    get session() {
      return session;
    },
    trade: (id: string) => trades.find((t) => t.id === id),
    /** a buy at the cursor's price (1.1000 around 10:00): stop 20 pips below, target 10 pips above */
    buy(p: Partial<Trade> = {}) {
      const t: Trade = {
        id: `t${++n}`,
        sessionId: 's1',
        symbol: 'EURUSD',
        side: 'buy',
        orderType: 'market',
        status: 'open',
        entry: 1.1,
        sl: 1.098,
        tp: 1.101,
        lots: 1,
        initialLots: 1,
        pointValue: 100_000,
        risk: 200,
        riskPct: 1,
        placedTime: session.cursor,
        openTime: session.cursor,
        partials: [],
        executedAt: 0,
        ...p,
      };
      act([...trades, t]);
      return t.id;
    },
    modify: (id: string, patch: Partial<Trade>) => act(trades.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    close: (id: string) => act(trades.map((t) => (t.id === id ? closeLots(t, t.lots, 1.1003, session.cursor, 'manual') : t))),
    advance(to: number) {
      trades = trades.map((t) => simulateTrade(t, session.cursor, to, []));
      session = { ...session, cursor: to };
    },
    rewind(target: number) {
      const plan = planRewind(session, trades, target);
      if (plan) {
        trades = plan.trades;
        session = { ...session, cursor: plan.to, checkpoints: plan.checkpoints };
      }
      return plan;
    },
  };
  return r;
}

test('rewinding past a target reopens the position as it was, and replaying settles it again', () => {
  const r = replay();
  const id = r.buy();
  r.advance(at(20));
  assert.equal(r.trade(id)?.closeReason, 'tp');
  const closedAt = r.trade(id)?.closeTime;

  const plan = r.rewind(at(5));
  assert.ok(plan);
  assert.equal(r.session.cursor, at(5));
  assert.equal(r.trade(id)?.status, 'open');
  assert.equal(r.trade(id)?.partials.length, 0);
  assert.deepEqual(plan.changed.map((t) => t.id), [id]);
  assert.equal(plan.removed.length, 0);

  r.advance(at(20));
  assert.equal(r.trade(id)?.closeReason, 'tp');
  assert.equal(r.trade(id)?.closeTime, closedAt);
});

test('orders placed after the rewind point are removed; those up to it stay', () => {
  const r = replay();
  const first = r.buy();
  r.advance(at(3));
  const second = r.buy({ side: 'sell', orderType: 'limit', status: 'pending', entry: 1.105, sl: 1.107, tp: 1.1 });
  r.advance(at(6));
  const plan = r.rewind(at(2));
  assert.ok(plan);
  assert.deepEqual(plan.removed.map((t) => t.id), [second]);
  assert.equal(r.trade(second), undefined);
  assert.equal(r.trade(first)?.status, 'open');
  // back to a moment: what was done at that moment stays, what came after goes
  const third = r.buy();
  r.advance(at(4));
  r.rewind(at(2));
  assert.equal(r.trade(third)?.status, 'open');
  r.advance(at(3));
  r.rewind(at(2) - BAR_MS);
  assert.equal(r.trade(third), undefined);
});

test('a change made after the rewind point goes back; one made before it stays', () => {
  const r = replay();
  const id = r.buy();
  r.advance(at(2));
  r.modify(id, { sl: 1.099 });
  r.advance(at(4));
  r.modify(id, { tp: 1.1005 });
  r.advance(at(6));
  r.rewind(at(3));
  assert.equal(r.trade(id)?.sl, 1.099);
  assert.equal(r.trade(id)?.tp, 1.101);
});

test('a manual close after the rewind point is undone', () => {
  const r = replay();
  const id = r.buy();
  r.advance(at(4));
  r.close(id);
  assert.equal(r.trade(id)?.status, 'closed');
  r.rewind(at(2));
  assert.equal(r.trade(id)?.status, 'open');
  assert.equal(r.trade(id)?.closeReason, undefined);
});

test('a rewind stops at the session start and never goes forward', () => {
  const r = replay();
  const id = r.buy();
  r.advance(at(4));
  assert.equal(r.rewind(at(9)), null);
  assert.equal(r.rewind(at(4)), null);
  const plan = r.rewind(DAY - 7 * 86_400_000);
  assert.ok(plan);
  assert.equal(plan.to, DAY);
  assert.equal(r.session.cursor, DAY);
  assert.equal(r.trade(id), undefined);
  assert.equal(r.rewind(DAY - 1), null);
});

test('a journal written after the rewind point stays with a trade that stays', () => {
  const r = replay();
  const id = r.buy();
  r.advance(at(4));
  r.modify(id, { journal: { notes: 'later note' } as never });
  r.advance(at(20));
  r.rewind(at(2));
  assert.equal((r.trade(id)?.journal as { notes?: string } | undefined)?.notes, 'later note');
  // checkpoints keep no journals
  assert.ok(r.session.checkpoints?.every((c) => c.live.every((t) => t.journal === undefined)));
});
