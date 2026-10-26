import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string };

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const blocked = () => new Response('<html><title>Just a moment...</title>cf-chl</html>', { status: 403 });

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  s.setUpstream((url) => {
    if (url.includes('forexfactory.com') || url.includes('faireconomy.media')) return blocked();
    throw new Error(`unexpected upstream call: ${url}`);
  });
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'کاربر');
});
after(() => s.stop());

test('schedule: a past week with no calendar data comes from the official release times', async () => {
  const w = Date.UTC(2024, 0, 28); // Sunday
  const r = await s.call('GET', `/api/news?from=${w}&to=${w + WEEK}`, undefined, user.token);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.missing, []);
  assert.deepEqual(r.data.scheduled, [w - WEEK, w], 'the week before is asked for too (a range from Sunday 00:00)');
  const at = (title: string, currency: string) => r.data.events.find((e: any) => e.title === title && e.currency === currency)?.time;
  assert.equal(at('FOMC Statement', 'USD'), Date.UTC(2024, 0, 31, 19));
  assert.equal(at('Official Bank Rate', 'GBP'), Date.UTC(2024, 1, 1, 12));
  assert.equal(at('CPI Flash Estimate y/y', 'EUR'), Date.UTC(2024, 1, 1, 10));
  assert.equal(at('Non-Farm Employment Change', 'USD'), Date.UTC(2024, 1, 2, 13, 30));
  for (const e of r.data.events) {
    assert.ok(['USD', 'EUR', 'GBP'].includes(e.currency), e.currency);
    assert.ok(['high', 'medium'].includes(e.impact), `${e.title}: ${e.impact}`);
    assert.equal(e.scheduled, true);
    assert.equal(e.actual ?? e.forecast ?? e.previous, undefined, 'times only, no values');
  }
  const times = r.data.events.map((e: any) => e.time);
  assert.deepEqual(
    times,
    [...times].sort((a: number, b: number) => a - b),
  );
  assert.ok(times.every((t: number) => t >= w && t < w + WEEK));
});

test('schedule: German ZEW from ZEW’s own release list (11:05 Frankfurt time since 2024)', async () => {
  const zew = async (from: number) =>
    (await s.call('GET', `/api/news?from=${from}&to=${from + WEEK}`, undefined, user.token)).data.events.find((e: any) => e.title === 'German ZEW Economic Sentiment');
  assert.equal((await zew(Date.UTC(2024, 0, 14))).time, Date.UTC(2024, 0, 16, 10, 5));
  assert.equal((await zew(Date.UTC(2019, 0, 20))).time, Date.UTC(2019, 0, 22, 10));
});

test('schedule: a range is cut to its bounds; weeks before 2015 stay missing', async () => {
  const from = Date.UTC(2024, 1, 1, 11);
  const to = Date.UTC(2024, 1, 1, 13);
  const r = await s.call('GET', `/api/news?from=${from}&to=${to}`, undefined, user.token);
  assert.deepEqual(
    r.data.events.map((e: any) => e.title),
    ['BOE Monetary Policy Report', 'MPC Official Bank Rate Votes', 'Monetary Policy Summary', 'Official Bank Rate'],
  );
  const old = Date.UTC(2014, 10, 2);
  const before2015 = await s.call('GET', `/api/news?from=${old}&to=${old + WEEK}`, undefined, user.token);
  assert.deepEqual(before2015.data.events, []);
  assert.ok(before2015.data.missing.includes(old));
  assert.deepEqual(before2015.data.scheduled, []);

  const status = (await s.call('GET', '/api/admin/news', undefined, admin.token)).data;
  assert.deepEqual(status.schedule.currencies, ['USD', 'EUR', 'GBP']);
  assert.equal(status.schedule.from, '2015-01-01');
  assert.ok(status.schedule.events > 6000, String(status.schedule.events));
  assert.equal(status.weeks, 0, 'schedule weeks are not stored as calendar weeks');
});
