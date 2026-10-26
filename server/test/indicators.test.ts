import assert from 'node:assert/strict';
import { test } from 'node:test';
import { atr, bollinger, computeIndicator, ema, macd, newIndicator, rsi, sma, stochastic, type OhlcBar } from '../../src/chart/indicators';

const close = (v: number[]) => v.map((c, i): OhlcBar => ({ time: i * 60, open: c, high: c, low: c, close: c }));
const near = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

test('moving averages: SMA, and EMA seeded with the SMA', () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [NaN, NaN, 2, 3, 4]);
  const e = ema([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
  assert.ok(Number.isNaN(e[1]));
  assert.deepEqual(e.slice(2), [2, 3, 4, 5, 6, 7, 8, 9]);
});

test("RSI follows Wilder's smoothing (the classic 14-period example, without rounding)", () => {
  const prices = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.0];
  const r = rsi(prices, 14);
  assert.ok(Number.isNaN(r[13]), 'needs 14 changes');
  // first 14 changes: gains 3.34, losses 1.40 → averages 0.238571 / 0.1
  near(r[14], 100 - 100 / (1 + 0.238571 / 0.1));
  // next change −0.28: averages (0.238571·13)/14 and (0.1·13 + 0.28)/14
  near(r[15], 66.25);
  assert.equal(rsi([1, 2, 3, 4, 5, 6], 3).at(-1), 100, 'only gains');
});

test('bands, MACD, stochastic and ATR', () => {
  const flat = bollinger([5, 5, 5, 5, 5], 3, 2);
  assert.deepEqual([flat.upper[4], flat.basis[4], flat.lower[4]], [5, 5, 5]);
  const m = macd(
    Array.from({ length: 60 }, (_, i) => 100 + i),
    12,
    26,
    9,
  );
  near(m.macd[59], 7, 1e-9); // straight line: the EMAs lag by (n-1)/2 bars, 12.5 - 5.5
  near(m.hist[59], 0, 1e-9);
  const bars: OhlcBar[] = [
    { time: 0, open: 10, high: 12, low: 9, close: 11 },
    { time: 60, open: 11, high: 13, low: 10, close: 13 },
    { time: 120, open: 13, high: 15, low: 12, close: 15 },
  ];
  assert.equal(stochastic(bars, 3, 1, 1).k[2], 100, 'closed at the high of the window');
  // true ranges 3, 3 (13-10), 3 (15-12): ATR(2) seeded with their average
  assert.deepEqual(atr(bars, 2).slice(1), [3, 3]);
});

test('computeIndicator uses each type’s parameters and leaves warm-up bars empty', () => {
  const bars = close(Array.from({ length: 30 }, (_, i) => 1 + (i % 5)));
  const ma = newIndicator('sma');
  ma.params.length = 5;
  const v = computeIndicator(ma, bars).value;
  assert.equal(v.length, 30);
  assert.ok(Number.isNaN(v[3]));
  assert.equal(v[4], 3);
  const bb = computeIndicator(newIndicator('bb'), bars);
  assert.deepEqual(Object.keys(bb).sort(), ['basis', 'lower', 'upper']);
  assert.deepEqual(Object.keys(computeIndicator(newIndicator('macd'), bars)).sort(), ['hist', 'macd', 'signal']);
});
