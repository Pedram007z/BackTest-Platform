import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseCalendarPage, parseFeed, weekParam, weekStart } from '../src/news/forexfactory';
import { lzmaDecompress } from '../src/market/lzma';
import { aggregate, parseBinanceKlines, parseDukascopyMinuteBars, parseDukascopyMinutes, parseDukascopyTicks } from '../src/market/sources';
import { FF_PAGE } from './fixtures/ff-page';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));

test('ForexFactory page: events, impacts, numbers and holidays', () => {
  const events = parseCalendarPage(FF_PAGE);
  assert.equal(events.length, 4, 'non-economic events are dropped');
  const holiday = events.find((e) => e.id === 'ff-131406')!;
  assert.equal(holiday.impact, 'holiday');
  assert.equal(holiday.allDay, true);
  const cpi = events.find((e) => e.id === 'ff-131500')!;
  assert.deepEqual(
    { title: cpi.title, currency: cpi.currency, impact: cpi.impact, time: cpi.time, actual: cpi.actual, forecast: cpi.forecast, previous: cpi.previous },
    { title: 'CPI m/m', currency: 'USD', impact: 'high', time: 1704893400_000, actual: '0.3%', forecast: '0.2%', previous: '0.1%' },
  );
  const gbp = events.find((e) => e.id === 'ff-131502')!;
  assert.equal(gbp.impact, 'medium', 'impact falls back to the icon class');
  assert.equal(gbp.title, 'Oddly "quoted" [title]');
  assert.equal(gbp.actual, undefined, 'empty actual is left out');
});

test('ForexFactory page: blocked or changed pages are reported', () => {
  assert.throws(() => parseCalendarPage('<html><title>Just a moment...</title><div id="cf-chl-widget"></div></html>'), /Cloudflare/);
  assert.throws(() => parseCalendarPage('<html>nothing here</html>'), /ساختار/);
});

test('ForexFactory JSON feed', () => {
  const events = parseFeed([
    { title: 'Non-Farm Employment Change', country: 'USD', date: '2024-01-05T08:30:00-05:00', impact: 'High', forecast: '170K', previous: '199K' },
    { title: 'Bank Holiday', country: 'CNY', date: '2024-01-01T00:00:00-05:00', impact: 'Holiday', forecast: '', previous: '' },
    { title: 'FOMC Member Speaks', country: 'USD', date: '2024-01-05T10:00:00-05:00', impact: 'Non-Economic' },
    { title: 'broken', country: 'USD', date: 'not a date', impact: 'High' },
  ]);
  assert.equal(events.length, 2);
  assert.equal(events[0].time, Date.UTC(2024, 0, 5, 13, 30));
  assert.equal(events[0].impact, 'high');
  assert.equal(events[0].forecast, '170K');
  assert.equal(events[1].allDay, true);
  assert.match(events[0].id, /^ffj-[0-9a-f]{12}$/);
  assert.throws(() => parseFeed({ error: 'x' }));
});

test('ForexFactory weeks start on Sunday and use its URL format', () => {
  const s = weekStart(Date.UTC(2024, 0, 10, 15));
  assert.equal(new Date(s).toISOString(), '2024-01-07T00:00:00.000Z');
  assert.equal(weekParam(s), 'jan7.2024');
  assert.equal(weekStart(s), s);
});

test('LZMA decoder reads a Dukascopy file', () => {
  const out = lzmaDecompress(fixture('EURUSD_2024-01-15_min_1.bi5'));
  assert.equal(out.length, 1440 * 24);
  assert.throws(() => lzmaDecompress(new Uint8Array([1, 2, 3])));
});

test('Dukascopy minutes become 5-minute bars with gaps for closed minutes', () => {
  const bars = parseDukascopyMinutes(fixture('EURUSD_2024-01-15_min_1.bi5'), 1e5)!;
  const expected: Record<string, number[]> = JSON.parse(fixture('EURUSD_2024-01-15_expected.json').toString());
  assert.equal(bars.length, 288 * 4);
  let filled = 0;
  for (let j = 0; j < 288; j++) {
    const want = expected[String(j)];
    if (!want) {
      assert.ok(Number.isNaN(bars[j * 4]), `bucket ${j} should be empty`);
      continue;
    }
    filled++;
    for (let k = 0; k < 4; k++) assert.ok(Math.abs(bars[j * 4 + k] - want[k] / 1e5) < 1e-9, `bucket ${j} field ${k}`);
    assert.ok(bars[j * 4 + 2] <= Math.min(bars[j * 4], bars[j * 4 + 3]) && bars[j * 4 + 1] >= Math.max(bars[j * 4], bars[j * 4 + 3]));
  }
  assert.equal(filled, 276, '21:00–22:00 is closed');
  assert.equal(parseDukascopyMinutes(new Uint8Array(0), 1e5), null, 'an empty file is a closed day');
});

test('Binance klines are split into UTC days', () => {
  const day0 = Date.UTC(2024, 0, 1);
  const rows = [
    [day0, '42000.1', '42010.5', '41990.0', '42005.2', '1'],
    [day0 + 5 * 60_000, '42005.2', '42020.0', '42000.0', '42015.0', '1'],
    [day0 + 86_400_000 + 287 * 300_000, '43000', '43001', '42999', '43000.5', '1'],
  ];
  const days = parseBinanceKlines(rows, day0, 3);
  assert.equal(days.length, 3);
  assert.deepEqual(Array.from(days[0]!.slice(0, 8)), [42000.1, 42010.5, 41990, 42005.2, 42005.2, 42020, 42000, 42015]);
  assert.equal(days[1]![287 * 4 + 3], 43000.5);
  assert.equal(days[2], null, 'a day without klines is closed');
});

test('Dukascopy minutes as 1-minute bars aggregate exactly to the 5-minute bars', () => {
  const m1 = parseDukascopyMinuteBars(fixture('EURUSD_2024-01-15_min_1.bi5'), 1e5)!;
  const m5 = parseDukascopyMinutes(fixture('EURUSD_2024-01-15_min_1.bi5'), 1e5)!;
  assert.equal(m1.length, 1440 * 4);
  const again = aggregate(m1, 5)!;
  for (let i = 0; i < m5.length; i++) assert.ok(Object.is(again[i], m5[i]) || Math.abs(again[i] - m5[i]) < 1e-12, `value ${i}`);
  assert.ok(Number.isNaN(m1[21 * 60 * 4 + 4 * 30]), '21:30 is a gap');
});

test('Dukascopy ticks become 1-second bars of the bid', () => {
  const s1 = parseDukascopyTicks(fixture('EURUSD_2024-01-15_10h_ticks.bi5'), 1e5)!;
  assert.equal(s1.length, 3600 * 4);
  // the fixture has a tick every 700 ms with bid starting near 1.0952, and no ticks in 10:20–10:21
  let filled = 0;
  for (let j = 0; j < 3600; j++) {
    const b = j * 4;
    if (Number.isNaN(s1[b])) continue;
    filled++;
    assert.ok(s1[b + 2] <= Math.min(s1[b], s1[b + 3]) && s1[b + 1] >= Math.max(s1[b], s1[b + 3]), `second ${j} is a valid bar`);
    assert.ok(s1[b] > 1.09 && s1[b] < 1.1);
  }
  for (let j = 1200; j < 1260; j++) assert.ok(Number.isNaN(s1[j * 4]), `second ${j} has no ticks`);
  assert.equal(filled, 3600 - 60, 'every second has a tick except the quiet minute');
  assert.equal(parseDukascopyTicks(new Uint8Array(0), 1e5), null, 'an empty file is a closed hour');
});

test('Binance klines split into hours of 1-second bars', () => {
  const h0 = Date.UTC(2024, 0, 1, 10);
  const rows = [
    [h0, '1', '2', '0.5', '1.5', '1'],
    [h0 + 3599_000, '3', '4', '2', '3.5', '1'],
    [h0 + 3600_000, '9', '9', '9', '9', '1'],
  ];
  const [hour, next] = parseBinanceKlines(rows, h0, 2, 3_600_000, 1000);
  assert.deepEqual(Array.from(hour!.slice(0, 4)), [1, 2, 0.5, 1.5]);
  assert.deepEqual(Array.from(hour!.slice(3599 * 4)), [3, 4, 2, 3.5]);
  assert.equal(next![3], 9);
});
