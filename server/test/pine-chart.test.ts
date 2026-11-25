import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HOUR_MS, candlesBetween, getCandles } from '../../src/lib/market';
import { runOnChart } from '../../src/pine/chart';
import type { RunOk } from '../../src/pine/run';

// the sample prices (no API server): a Wednesday noon replay position on EURUSD 1h
const cursor = Date.UTC(2024, 2, 13, 12);
const candles = getCandles('EURUSD', '1h', cursor, 300);

function run(code: string, at = cursor, bars = candles): RunOk {
  const r = runOnChart({ code: `//@version=5\n${code}`, candles: bars, symbol: 'EURUSD', tf: '1h', cursor: at });
  if (!r.ok) assert.fail(`${r.error.message} (line ${r.error.line})`);
  return r;
}
const plot = (r: RunOk, title: string) => [...r.plots.find((p) => p.title === title)!.values];

test('a Pine indicator runs on the candles the replay has shown', () => {
  const r = run('indicator("t", overlay = true)\nplot(ta.sma(close, 3), "sma")\nplot(bar_index, "i")');
  const sma = plot(r, 'sma');
  const n = candles.length;
  assert.equal(sma.length, n);
  const want = (candles[n - 1].close + candles[n - 2].close + candles[n - 3].close) / 3;
  assert.ok(Math.abs(sma[n - 1] - want) < 1e-12);
  assert.equal(plot(r, 'i')[n - 1], n - 1);
  assert.equal(r.decl.overlay, true);
});

test('request.security on the chart reads the higher timeframe only up to the replay position', () => {
  const r = run('indicator("t")\nh4 = request.security(syminfo.tickerid, "240", close)\nplot(h4, "h4")');
  const h4 = plot(r, 'h4');
  const four = candlesBetween('EURUSD', '4h', candles[0].time * 1000 - 300 * 4 * HOUR_MS, cursor + 1, cursor);
  // the last value is the close of the last completed 4-hour candle (12:00 UTC: the one closing then, or before)
  const done = four.filter((c) => c.time * 1000 + 4 * HOUR_MS <= cursor);
  assert.ok(Math.abs(h4[h4.length - 1] - done[done.length - 1].close) < 1e-12);

  // nothing later leaks back: a later position leaves the earlier bars' values unchanged
  const later = cursor + 24 * HOUR_MS;
  const more = getCandles('EURUSD', '1h', later, 324);
  const r2 = run('indicator("t")\nh4 = request.security(syminfo.tickerid, "240", close)\nplot(h4, "h4")', later, more);
  const h4b = plot(r2, 'h4');
  const offset = more.findIndex((c) => c.time === candles[0].time);
  assert.ok(offset >= 0);
  for (let i = 0; i < candles.length - 1; i++) if (Number.isFinite(h4[i])) assert.equal(h4b[offset + i], h4[i], `bar ${i}`);
});

test('chart runs report errors, and other symbols in request.security are refused', () => {
  const bad = runOnChart({ code: '//@version=5\nindicator("t")\nplot(foo)', candles, symbol: 'EURUSD', tf: '1h', cursor });
  assert.equal(bad.ok, false);
  assert.equal(!bad.ok && bad.error.line, 3);
  const other = runOnChart({ code: '//@version=5\nindicator("t")\nplot(request.security("GBPUSD", "60", close))', candles, symbol: 'EURUSD', tf: '1h', cursor });
  assert.equal(other.ok, false);
  assert.match(!other.ok ? other.error.message : '', /همین چارت/);
});
