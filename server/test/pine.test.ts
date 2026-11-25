import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runPine, securitySymbols, type RunOk, type RunResult } from '../../src/pine/run';
import { parse } from '../../src/pine/parser';

/** 5-minute bars from [open, high, low, close] rows, starting Monday 2024-01-08 00:00 UTC. */
function bars(rows: [number, number, number, number][], stepMs = 300_000) {
  const t0 = Date.UTC(2024, 0, 8);
  return {
    time: Float64Array.from(rows.map((_, i) => t0 + i * stepMs)),
    open: Float64Array.from(rows.map((r) => r[0])),
    high: Float64Array.from(rows.map((r) => r[1])),
    low: Float64Array.from(rows.map((r) => r[2])),
    close: Float64Array.from(rows.map((r) => r[3])),
  };
}
const flat = (closes: number[]) => bars(closes.map((c) => [c, c, c, c]));

function run(code: string, base = flat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), extra: Partial<Parameters<typeof runPine>[0]> = {}): RunOk {
  const r: RunResult = runPine({ code: `//@version=5\n${code}`, symbol: 'BTCUSD', timeframe: '5', base, ...extra });
  if (!r.ok) assert.fail(`${r.error.message} (line ${r.error.line})`);
  return r;
}
const plot = (r: RunOk, title: string) => [...r.plots.find((p) => p.title === title)!.values];
const fail = (code: string) => {
  const r = runPine({ code: `//@version=5\n${code}`, symbol: 'BTCUSD', timeframe: '5', base: flat([1, 2, 3]) });
  assert.equal(r.ok, false);
  return (r as Extract<RunResult, { ok: false }>).error;
};

test('parser: blocks, wrapped lines, else if, switch, loops and functions', () => {
  const p = parse(`//@version=5
indicator("t",
     overlay = true)
x = close > open and
  high > low ? 1 : 2
if x == 1
    y = 2
else if x == 2
    y = 3
else
    y = 4
s = switch x
    1 => "a"
    => "b"
for i = 0 to 3 by 1
    continue
f(a, b = 2) =>
    a + b
g(v) => v * 2
`);
  assert.deepEqual(
    p.body.map((n) => n.k),
    ['expr', 'decl', 'if', 'decl', 'for', 'func', 'func'],
  );
  assert.equal(p.version, 5);
});

test('series: history, var, reassignment and per-call-site function state', () => {
  const r = run(`indicator("t")
prev = close[1]
var count = 0
count += 1
a = 0.0
a := close * 2
counter() =>
    var c = 0
    c += 1
    c
p1 = counter()
p2 = counter()
plot(prev, "prev")
plot(count, "count")
plot(a[2], "a2")
plot(p1 + p2, "calls")
plot((high + low)[1], "expr1")
`);
  assert.deepEqual(plot(r, 'prev').slice(0, 4), [NaN, 1, 2, 3]);
  assert.deepEqual(plot(r, 'count').slice(-1), [10]);
  assert.deepEqual(plot(r, 'a2').slice(0, 4), [NaN, NaN, 2, 4]);
  // each call site counts on its own: 2 × (bar_index + 1)
  assert.deepEqual(plot(r, 'calls').slice(0, 3), [2, 4, 6]);
  assert.deepEqual(plot(r, 'expr1').slice(0, 3), [NaN, 2, 4]);
});

test('ta: sma, ema (starts from the first value), rma (SMA seed), rsi, crossover, highest', () => {
  const r = run(`indicator("t")
plot(ta.sma(close, 3), "sma")
plot(ta.ema(close, 3), "ema")
plot(ta.rma(close, 3), "rma")
plot(ta.highest(close, 3), "hi")
plot(ta.change(close), "chg")
plot(ta.crossover(close, 5.5) ? 1 : 0, "xo")
plot(ta.rsi(close, 3), "rsi")
plot(math.sum(close, 2), "sum")
plot(ta.barssince(close % 3 == 0), "since")
plot(ta.valuewhen(close % 4 == 0, close, 0), "vw")
`);
  assert.deepEqual(plot(r, 'sma').slice(0, 4), [NaN, NaN, 2, 3]);
  const ema = plot(r, 'ema');
  assert.equal(ema[0], 1);
  assert.equal(ema[1], 0.5 * 2 + 0.5 * 1);
  const rma = plot(r, 'rma');
  assert.ok(Number.isNaN(rma[1]));
  assert.equal(rma[2], 2);
  assert.equal(rma[3], (4 + 2 * 2) / 3);
  assert.deepEqual(plot(r, 'hi').slice(2, 5), [3, 4, 5]);
  assert.deepEqual(plot(r, 'chg').slice(0, 3), [NaN, 1, 1]);
  assert.deepEqual(plot(r, 'xo'), [0, 0, 0, 0, 0, 1, 0, 0, 0, 0]);
  assert.equal(plot(r, 'rsi')[5], 100, 'only gains');
  assert.deepEqual(plot(r, 'sum').slice(0, 3), [NaN, 3, 5]);
  assert.deepEqual(plot(r, 'since').slice(0, 5), [NaN, NaN, 0, 1, 2]);
  assert.deepEqual(plot(r, 'vw').slice(2, 6), [NaN, 4, 4, 4]);
});

test('inputs: defaults, overrides and source inputs', () => {
  const code = `indicator("t")
len = input.int(2, "Length", minval = 1)
src = input.source(close, "Source")
flag = input.bool(true, "On")
plot(flag ? ta.sma(src, len) : na, "out")`;
  const base = bars([
    [1, 5, 0, 2],
    [2, 6, 1, 4],
    [4, 8, 3, 6],
  ]);
  const r1 = run(code, base);
  assert.deepEqual(
    r1.inputs.map((i) => [i.key, i.type, i.defval]),
    [
      ['Length', 'int', 2],
      ['Source', 'source', 'close'],
      ['On', 'bool', true],
    ],
  );
  assert.deepEqual(plot(r1, 'out'), [NaN, 3, 5]);
  const r2 = run(code, base, { inputs: { Length: 3, Source: 'high' } });
  assert.deepEqual(plot(r2, 'out'), [NaN, NaN, 19 / 3]);
  // out of range values are clamped
  assert.deepEqual(plot(run(code, base, { inputs: { Length: 0 } }), 'out'), [2, 4, 6]);
});

test('errors are reported in Persian with the line', () => {
  let e = fail('indicator("t")\nx = 1\nx = 2');
  assert.equal(e.line, 4);
  assert.match(e.message, /قبلاً/);
  e = fail('indicator("t")\nplot(foo)');
  assert.match(e.message, /foo/);
  assert.equal(e.line, 3);
  e = fail('indicator("t")\ny := 1');
  assert.match(e.message, /تعریف نشده/);
  e = fail('x = 1');
  assert.match(e.message, /strategy|indicator/);
  e = fail('indicator("t")\na = array.new_float(2)\nb = array.get(a, 5)');
  assert.match(e.message, /اندیس/);
  assert.equal(e.line, 4);
});

test('arrays, maps, strings, user types and methods', () => {
  const r = run(`indicator("t")
type Pt
    float x = 0
    float y = 1
var arr = array.new_float()
arr.push(close)
if arr.size() > 3
    arr.shift()
m = map.new<string, float>()
m.put("a", 5)
p = Pt.new(x = close)
p.y := p.x * 3
method twice(float v) => v * 2
s = str.format("{0}-{1}", close, "x")
plot(arr.sum(), "sum")
plot(m.get("a"), "map")
plot(p.y, "udt")
plot(close.twice(), "method")
plot(str.length(s), "len")
`);
  assert.deepEqual(plot(r, 'sum').slice(0, 5), [1, 3, 6, 9, 12]);
  assert.equal(plot(r, 'map')[0], 5);
  assert.equal(plot(r, 'udt')[3], 12);
  assert.equal(plot(r, 'method')[4], 10);
  assert.equal(plot(r, 'len')[0], 3);
});

// ---------- strategies ----------

test('market orders fill at the next bar open; reversal closes and opens', () => {
  const base = bars([
    [10, 10, 10, 10],
    [11, 12, 10, 11],
    [12, 13, 11, 12],
    [13, 14, 12, 13],
    [14, 15, 13, 14],
    [15, 16, 14, 15],
  ]);
  const r = run(
    `strategy("t", initial_capital = 1000)
if bar_index == 0
    strategy.entry("L", strategy.long, qty = 2)
if bar_index == 2
    strategy.entry("S", strategy.short, qty = 1)
plot(strategy.position_size, "pos")`,
    base,
  );
  const s = r.strategy!;
  assert.deepEqual(plot(r, 'pos'), [0, 2, 2, -1, -1, -1]);
  assert.equal(s.closed.length, 1);
  const t = s.closed[0];
  assert.equal(t.entryPrice, 11);
  assert.equal(t.exitPrice, 13);
  assert.equal(t.profit, 4);
  assert.equal(t.exitId, 'S');
  assert.equal(s.open[0].price, 13);
  assert.equal(s.open[0].profit, -2);
  assert.equal(s.report.finalEquity, 1000 + 4 - 2);
});

test('strategy.exit: stop and limit inside the bar, nearer extreme first, gaps fill at the open', () => {
  // bar 2 opens at 100, goes to 103 (nearer) then 95: the 102 target fills before the 96 stop
  const base = bars([
    [100, 100, 100, 100],
    [100, 101, 99, 100],
    [100, 103, 95, 97],
    [100, 100, 100, 100],
    [100, 100, 100, 100],
    [90, 91, 89, 90],
  ]);
  const r = run(
    `strategy("t")
if bar_index == 0 or bar_index == 3
    strategy.entry("L", strategy.long, qty = 1)
strategy.exit("X", "L", limit = 102, stop = 96)`,
    base,
  );
  const [a, b] = r.strategy!.closed;
  assert.equal(a.exitPrice, 102);
  assert.equal(a.exitBar, 2);
  // entered at bar 4's open (100); bar 5 gaps down to 90, under the stop: filled at the open
  assert.equal(b.entryPrice, 100);
  assert.equal(b.exitPrice, 90);
  assert.equal(b.exitBar, 5);
});

test('relative exits in ticks, pyramiding, process_orders_on_close, commission and percent of equity', () => {
  const base = bars([
    [100, 100, 100, 100],
    [100, 100, 100, 100],
    [100, 100, 100, 100],
    [100, 110, 100, 110],
  ]);
  // BTCUSD mintick is 0.1: profit = 50 ticks → +5
  const r = run(
    `strategy("t", initial_capital = 1000, default_qty_type = strategy.percent_of_equity, default_qty_value = 50, commission_type = strategy.commission.cash_per_order, commission_value = 1)
strategy.entry("L", strategy.long)
strategy.exit("TP", "L", profit = 50)`,
    base,
  );
  const s = r.strategy!;
  // one entry only (pyramiding 0), 5 units (500 USD / 100), filled at bar 1 open, target 105 in bar 3
  assert.equal(s.closed.length, 1);
  assert.equal(s.closed[0].qty, 5);
  assert.equal(s.closed[0].exitPrice, 105);
  assert.equal(s.closed[0].profit, 5 * 5 - 2);
  assert.equal(s.report.all.commission, 2);

  const r2 = run(
    `strategy("t", pyramiding = 2, process_orders_on_close = true)
if bar_index < 3
    strategy.entry("L", strategy.long, qty = 1)
plot(strategy.position_size, "pos")`,
    base,
  );
  // filled at each bar's close, after the script ran: the script sees it on the next bar
  assert.deepEqual(plot(r2, 'pos'), [0, 1, 2, 2]);
});

test('report: net profit, win rate, profit factor, drawdown', () => {
  const base = bars([
    [100, 100, 100, 100],
    [100, 100, 100, 100],
    [110, 110, 110, 110],
    [110, 110, 110, 110],
    [105, 105, 105, 105],
    [105, 105, 105, 105],
  ]);
  const r = run(
    `strategy("t", initial_capital = 1000)
if bar_index == 0 or bar_index == 2
    strategy.entry("L", strategy.long, qty = 1)
if bar_index == 1 or bar_index == 3
    strategy.close("L")`,
    base,
  );
  const rep = r.strategy!.report;
  assert.equal(rep.all.totalTrades, 2);
  assert.equal(rep.all.netProfit, 10 - 5);
  assert.equal(rep.all.winRate, 50);
  assert.equal(rep.all.profitFactor, 2);
  assert.equal(rep.maxDrawdown, 5);
});

test('request.security: a higher timeframe value appears once its bar has closed', () => {
  // 5-minute bars over 2 hours; the 1-hour close of the first hour is 12 (bar 11)
  const closes = Array.from({ length: 24 }, (_, i) => i + 1);
  const r = run(
    `indicator("t")
h = request.security(syminfo.tickerid, "60", close)
hl = request.security(syminfo.tickerid, "60", close, lookahead = barmerge.lookahead_on)
plot(h, "h")
plot(hl, "hl")`,
    flat(closes),
  );
  const h = plot(r, 'h');
  assert.ok(Number.isNaN(h[10]));
  assert.equal(h[11], 12);
  assert.equal(h[12], 12);
  assert.equal(h[23], 24);
  assert.equal(plot(r, 'hl')[0], 12, 'looks ahead');
  assert.deepEqual(securitySymbols('//@version=5\nindicator("t")\nx = request.security("BINANCE:ETHUSDT", "D", close)', 'BTCUSD').symbols, ['ETHUSD']);
});
