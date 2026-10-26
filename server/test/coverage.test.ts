import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let token = '';
before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  token = (await s.signIn('09351110777', 'بازه‌ها')).token;
});
after(() => s.stop());

const day = () => new Float64Array(1440 * 4).fill(1.1);

test('coverage: the days with chart data per market, gaps split the ranges', async () => {
  const { writeDays, refreshCoverage } = await import('../src/market/store');
  const jan = Date.UTC(2024, 0, 1);
  // EURUSD: 1–5 Jan (Mon–Fri) and 8–10 Jan stored; Saturday 6 Jan has nothing (closed for forex); 11–12 Jan not
  // downloaded (a gap); 15–19 Jan stored again
  const fx = new Map<number, Float64Array | null>();
  for (const d of [1, 2, 3, 4, 5, 7, 8, 9, 10, 15, 16, 17, 18, 19]) fx.set(d, day());
  writeDays('EURUSD', jan, fx);
  // BTCUSD trades at weekends: a missing Saturday is a gap
  const btc = new Map<number, Float64Array | null>();
  for (const d of [1, 2, 3, 4, 5, 7]) btc.set(d, day());
  writeDays('BTCUSD', jan, btc);
  // a month with no file between two stored months is a gap too
  writeDays('XAUUSD', jan, new Map([[2, day()]]));
  writeDays('XAUUSD', Date.UTC(2024, 2, 1), new Map([[4, day()]]));
  refreshCoverage();

  assert.equal((await s.call('GET', '/api/market/coverage')).status, 401);
  const r = await s.call('GET', '/api/market/coverage', undefined, token);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.ranges.EURUSD, [
    ['2024-01-01', '2024-01-10'],
    ['2024-01-15', '2024-01-19'],
  ]);
  assert.deepEqual(r.data.ranges.BTCUSD, [
    ['2024-01-01', '2024-01-05'],
    ['2024-01-07', '2024-01-07'],
  ]);
  assert.deepEqual(r.data.ranges.XAUUSD, [
    ['2024-01-02', '2024-01-02'],
    ['2024-03-04', '2024-03-04'],
  ]);
  assert.deepEqual(r.data.ranges.GBPUSD, []);
});

test('coverage helpers: days every symbol has, and the first gap in a span', async () => {
  const { intersectRanges, gapIn, covered, rangeOf } = await import('../../src/lib/coverage');
  const fx: [string, string][] = [
    ['2024-01-01', '2024-01-10'],
    ['2024-01-15', '2024-01-31'],
  ];
  const gold: [string, string][] = [['2024-01-05', '2024-01-20']];
  const both = intersectRanges([fx, gold]);
  assert.deepEqual(both, [
    ['2024-01-05', '2024-01-10'],
    ['2024-01-15', '2024-01-20'],
  ]);
  assert.deepEqual(intersectRanges([fx, []]), []);
  assert.equal(covered(both, '2024-01-12'), false);
  assert.deepEqual(rangeOf(both, '2024-01-16'), ['2024-01-15', '2024-01-20']);
  assert.equal(gapIn(both, '2024-01-05', '2024-01-10'), null);
  assert.deepEqual(gapIn(both, '2024-01-06', '2024-01-18'), { from: '2024-01-11', to: '2024-01-14' });
  assert.deepEqual(gapIn(both, '2024-01-12', '2024-01-18'), { from: '2024-01-12', to: '2024-01-14' });
  assert.deepEqual(gapIn(both, '2024-01-19', '2024-01-25'), { from: '2024-01-21', to: '2024-01-25' });
});
