import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanSession, defaultSessionsConfig, sessionBoxes, sessionMinutes, sessionsFromParams, sessionsToParams, type SessionsConfig } from '../../src/chart/sessions';
import { newIndicator } from '../../src/chart/indicators';
import { configFromInputs, sessionsStudy } from '../../src/chart/tvSessions';

/** 15-minute bars from `from` to `to` (UTC ISO), the high and low going up with the time */
function bars(from: string, to: string, step = 900) {
  const out = [];
  for (let t = Date.parse(from) / 1000; t < Date.parse(to) / 1000; t += step) out.push({ time: t, high: t / 1000 + 1, low: t / 1000 - 1 });
  return out;
}
const iso = (sec: number) => new Date(sec * 1000).toISOString().slice(0, 16);
const only = (name: string, start: string, end: string, tz: string): SessionsConfig => ({
  sessions: [{ on: true, name, start, end, tz, color: '#3b82f6' }],
  fill: true,
  labels: true,
});

test('sessions follow their own clock: London and New York move with daylight saving', () => {
  const london = only('London', '08:00', '17:00', 'Europe/London');
  // summer (BST, UTC+1): 07:00–16:00 UTC
  const summer = bars('2025-07-07T00:00Z', '2025-07-08T00:00Z');
  const [s] = sessionBoxes(summer, london, 900);
  assert.equal(iso(summer[s.from].time), '2025-07-07T07:00');
  assert.equal(iso(summer[s.to].time), '2025-07-07T15:45', 'the last bar opening before 17:00 London');
  // winter (GMT): 08:00–17:00 UTC
  const winter = bars('2025-01-13T00:00Z', '2025-01-14T00:00Z');
  const [w] = sessionBoxes(winter, london, 900);
  assert.equal(iso(winter[w.from].time), '2025-01-13T08:00');
  assert.equal(iso(winter[w.to].time), '2025-01-13T16:45');

  const ny = only('New York', '08:00', '17:00', 'America/New_York');
  const [n] = sessionBoxes(summer, ny, 900);
  assert.equal(iso(summer[n.from].time), '2025-07-07T12:00', '08:00 EDT');
  const [nw] = sessionBoxes(winter, ny, 900);
  assert.equal(iso(winter[nw.from].time), '2025-01-13T13:00', '08:00 EST');
});

test('high and low are the highest high and lowest low of the bars inside the session', () => {
  const b = bars('2025-03-03T00:00Z', '2025-03-04T00:00Z').map((x) => ({ ...x, high: 1, low: 0 }));
  b[40].high = 999; // 10:00 UTC, inside
  b[41].low = -999; // 10:15 UTC, inside
  b[2].high = 5000; // 00:30 UTC, outside
  const [box] = sessionBoxes(b, only('London', '08:00', '17:00', 'Europe/London'), 900);
  assert.equal(box.high, 999);
  assert.equal(box.low, -999);
  assert.equal(box.highAt, 40);
  assert.equal(box.lowAt, 41);
});

test('a session past midnight, one a day, and none for bars over an hour', () => {
  const cfg = only('Asia', '20:00', '00:00', 'America/New_York');
  const b = bars('2025-01-13T00:00Z', '2025-01-16T00:00Z', 3600);
  const boxes = sessionBoxes(b, cfg, 3600);
  // 20:00–24:00 New York = 01:00–05:00 UTC the next day
  assert.deepEqual(
    boxes.map((x) => [iso(b[x.from].time), iso(b[x.to].time)]),
    [
      ['2025-01-13T01:00', '2025-01-13T04:00'],
      ['2025-01-14T01:00', '2025-01-14T04:00'],
      ['2025-01-15T01:00', '2025-01-15T04:00'],
    ],
  );
  assert.equal(sessionMinutes({ start: '20:00', end: '00:00' }), 240);
  assert.equal(sessionMinutes({ start: '09:00', end: '09:00' }), 1440, 'same start and end: a whole day');
  assert.deepEqual(sessionBoxes(bars('2025-01-13T00:00Z', '2025-01-16T00:00Z', 14400), cfg, 14400), [], '4-hour bars: no boxes');
});

test('only the bars shown so far: a running session stops at the last bar, one cut off at the start is left out', () => {
  const cfg = only('London', '08:00', '17:00', 'Europe/London');
  // the replay is at 11:00 UTC on a winter day
  const shown = bars('2025-01-13T00:00Z', '2025-01-13T11:00Z');
  const [live] = sessionBoxes(shown, cfg, 900);
  assert.equal(iso(shown[live.to].time), '2025-01-13T10:45');
  // the data starts in the middle of a session
  assert.deepEqual(sessionBoxes(bars('2025-01-13T10:00Z', '2025-01-13T12:00Z'), cfg, 900), []);
});

test('weekends: days without bars make no boxes; switched-off sessions none at all', () => {
  const cfg = defaultSessionsConfig();
  // Friday 21:00 UTC to Monday 00:00 UTC, no bars on Saturday and Sunday
  const b = bars('2025-01-10T00:00Z', '2025-01-10T21:00Z');
  const boxes = sessionBoxes(b, cfg, 900);
  assert.deepEqual([...new Set(boxes.map((x) => cfg.sessions[x.session].name))].sort(), ['لندن', 'نیویورک', 'توکیو'].sort());
  assert.ok(!boxes.some((x) => x.session === 0), 'Sydney is off by default');
});

test('settings: kept in the indicator params, bad values fall back to the defaults', () => {
  const cfg = defaultSessionsConfig();
  cfg.sessions[2] = { ...cfg.sessions[2], name: 'Frankfurt', start: '07:00', tz: 'Europe/Berlin', color: '#00ff00' };
  cfg.fill = false;
  const { params, colors } = sessionsToParams(cfg);
  assert.deepEqual(sessionsFromParams(params, colors), cfg);
  const ind = newIndicator('sessions');
  assert.deepEqual(sessionsFromParams(ind.params, ind.colors), defaultSessionsConfig());
  const bad = cleanSession({ on: 'yes', name: '   ', start: '25:00', end: '8:00', tz: 'Mars/Base', color: 'red' }, 3);
  assert.deepEqual(bad, defaultSessionsConfig().sessions[3]);
});

test("TradingView: the indicator's inputs read back as sessions", () => {
  const study = sessionsStudy();
  const inputs = study.metainfo.inputs.map((x: any) => ({ id: x.id, value: x.defval }));
  const cfg = configFromInputs(inputs);
  assert.deepEqual(
    cfg.sessions.map((s) => [s.on, s.name, s.start, s.end, s.tz]),
    [
      [false, 'Sydney', '08:00', '17:00', 'Australia/Sydney'],
      [true, 'Tokyo', '09:00', '18:00', 'Asia/Tokyo'],
      [true, 'London', '08:00', '17:00', 'Europe/London'],
      [true, 'New York', '08:00', '17:00', 'America/New_York'],
    ],
  );
  // values as the settings dialog leaves them
  const edited = inputs.map((x: any) =>
    x.id === 'in_12' ? { ...x, value: '0700-1600:1234567' } : x.id === 'in_14' ? { ...x, value: 'rgba(255, 0, 128, 1)' } : x.id === 'in_20' ? { ...x, value: false } : x,
  );
  const e = configFromInputs(edited);
  assert.equal(e.sessions[2].start, '07:00');
  assert.equal(e.sessions[2].end, '16:00');
  assert.equal(e.sessions[2].color, '#ff0080');
  assert.equal(e.fill, false);
  assert.ok(
    study.metainfo.inputs.every((x: any) => x.hideWhenPlotsHidden?.[0] === 'plot_0'),
    'inputs stay out of the legend',
  );
});
