import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCandles } from '../../src/lib/market';
import { runOnChart } from '../../src/pine/chart';
import { LIBRARY } from '../../src/pine/library';
import { runPine } from '../../src/pine/run';

// sample prices (no API server): 30 days of EURUSD 5-minute bars, and a replay chart on 15m and 1h
const from = Date.UTC(2024, 1, 5);
const t: number[] = [],
  o: number[] = [],
  h: number[] = [],
  l: number[] = [],
  c: number[] = [];
for (const k of getCandles('EURUSD', '5m', from + 30 * 86_400_000, 30 * 288)) {
  t.push(k.time * 1000);
  o.push(k.open);
  h.push(k.high);
  l.push(k.low);
  c.push(k.close);
}
const base = { time: Float64Array.from(t), open: Float64Array.from(o), high: Float64Array.from(h), low: Float64Array.from(l), close: Float64Array.from(c) };
const cursor = Date.UTC(2024, 2, 6, 15);

/** Something the indicator drew: a plot value, a shape, a line, a box or a fill. */
const drew = (r: { plots: { kind: string; values: Float64Array }[]; shapes: unknown[]; lines: unknown[]; boxes: unknown[]; fills: unknown[] }) =>
  r.plots.some((p) => p.kind === 'plot' && p.values.some((v) => Number.isFinite(v))) || r.shapes.length > 0 || r.lines.length > 0 || r.boxes.length > 0;

test(`every built-in indicator (${LIBRARY.length}) runs and draws in the tester and on the replay chart`, () => {
  assert.equal(LIBRARY.length, 52);
  assert.equal(new Set(LIBRARY.map((x) => x.id)).size, LIBRARY.length, 'ids are unique');
  for (const ind of LIBRARY) {
    const tf = ['pivots', 'prev-high-low', 'opens', 'adr', 'separators', 'killzones', 'opening-range'].includes(ind.id) ? '15' : '60';
    const r = runPine({ code: ind.code, symbol: 'EURUSD', timeframe: tf, base });
    if (!r.ok) assert.fail(`${ind.id} (tester): ${r.error.message} (line ${r.error.line})`);
    assert.equal(r.decl.kind, 'indicator', ind.id);
    assert.equal(r.decl.overlay, ind.overlay, `${ind.id}: overlay`);
    assert.ok(drew(r), `${ind.id} drew nothing in the tester`);

    const candles = getCandles('EURUSD', tf === '15' ? '15m' : '1h', cursor, 800);
    const rc = runOnChart({ code: ind.code, candles, symbol: 'EURUSD', tf: tf === '15' ? '15m' : '1h', cursor });
    if (!rc.ok) assert.fail(`${ind.id} (chart): ${rc.error.message} (line ${rc.error.line})`);
    assert.ok(drew(rc), `${ind.id} drew nothing on the chart`);
  }
});
