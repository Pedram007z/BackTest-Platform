import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { FF_PAGE } from './fixtures/ff-page';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string };
let news: typeof import('../src/news');
let config: typeof import('../src/config').config;

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const sunday = (ms: number) => Math.floor(ms / DAY) * DAY - new Date(Math.floor(ms / DAY) * DAY).getUTCDay() * DAY;
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const thisWeek = sunday(Date.now());

/** A fake FMP: per week, NFP on Friday 12:30 UTC, a holiday, and an event in a currency the app does not show. */
function fmp(seen: string[], opts: { error?: { status: number; message: string } } = {}) {
  return (url: string) => {
    seen.push(url);
    const u = new URL(url);
    if (u.host === 'financialmodelingprep.com' && u.pathname === '/stable/economic-calendar') {
      if (opts.error) return s.json({ 'Error Message': opts.error.message }, opts.error.status);
      assert.equal(u.searchParams.get('apikey'), 'fmp-test-key');
      const from = Date.parse(`${u.searchParams.get('from')}T00:00:00Z`);
      const to = Date.parse(`${u.searchParams.get('to')}T00:00:00Z`);
      const out: unknown[] = [];
      for (let w = sunday(from); w <= to; w += WEEK) {
        const nfp = w + 5 * DAY + 12.5 * 3_600_000;
        out.push(
          { date: new Date(nfp).toISOString().slice(0, 19).replace('T', ' '), country: 'US', event: 'Nonfarm Payrolls', currency: 'USD', previous: 151, estimate: 160, actual: 256, change: 105, impact: 'High', changePercentage: 69.5, unit: 'K' },
          { date: `${day(w + DAY)} 00:00:00`, country: 'JP', event: 'Bank Holiday', currency: 'JPY', previous: null, estimate: null, actual: null, change: null, impact: 'None', changePercentage: null, unit: null },
          { date: `${day(w + 2 * DAY)} 09:00:00`, country: 'CM', event: 'Inflation Rate', currency: 'XAF', previous: 2, estimate: null, actual: 2.1, change: 0.1, impact: 'Low', changePercentage: 5, unit: '%' },
        );
      }
      return s.json(out);
    }
    if (url.includes('forexfactory.com/calendar')) return new Response('<html><title>Just a moment...</title>cf-chl</html>', { status: 403 });
    if (url.includes('ff_calendar_thisweek.json'))
      return s.json([{ title: 'CPI m/m', country: 'USD', date: new Date(thisWeek + 3 * DAY).toISOString(), impact: 'High', forecast: '0.3%', previous: '0.2%' }]);
    throw new Error(`unexpected upstream call: ${url}`);
  };
}

async function runHistory(from: string) {
  const r = await s.call('POST', '/api/admin/news/history', { from }, admin.token);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return (await news.calendarHistoryFinished())!;
}

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true', FMP_API_KEY: 'fmp-test-key' });
  news = await import('../src/news');
  news.setCalendarHistoryPause(0);
  config = (await import('../src/config')).config;
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'کاربر');
});
after(() => s.stop());

test('FMP history: past weeks with actual values, in the currencies the app shows', async () => {
  const seen: string[] = [];
  s.setUpstream(fmp(seen));
  const from = day(thisWeek - 6 * WEEK);
  const job = await runHistory(from);
  assert.equal(job.state, 'done', job.message);
  assert.deepEqual([job.total, job.done, job.weeks], [2, 2, 6], 'two requests of up to four weeks; this week is left to the feed');
  assert.deepEqual(
    seen.map((u) => [new URL(u).searchParams.get('from'), new URL(u).searchParams.get('to')]),
    [
      [day(thisWeek - 6 * WEEK), day(thisWeek - 2 * WEEK - DAY)],
      [day(thisWeek - 2 * WEEK), day(thisWeek - DAY)],
    ],
  );

  const w = thisWeek - 3 * WEEK;
  const r = await s.call('GET', `/api/news?from=${w}&to=${w + WEEK}`, undefined, user.token);
  assert.deepEqual(r.data.missing, []);
  const nfp = r.data.events.find((e: any) => e.title === 'Nonfarm Payrolls');
  assert.equal(nfp.time, w + 5 * DAY + 12.5 * 3_600_000, 'FMP dates are UTC');
  assert.deepEqual([nfp.currency, nfp.impact, nfp.actual, nfp.forecast, nfp.previous], ['USD', 'high', '256K', '160K', '151K']);
  const holiday = r.data.events.find((e: any) => e.title === 'Bank Holiday');
  assert.deepEqual([holiday.impact, holiday.allDay, holiday.actual], ['holiday', true, undefined]);
  assert.ok(!r.data.events.some((e: any) => e.currency === 'XAF'), 'currencies the app does not show are left out');

  const status = await s.call('GET', '/api/admin/news', undefined, admin.token);
  assert.equal(status.data.history.configured, true);
  assert.equal(status.data.history.lastJob.weeks, 6);
});

test('FMP history: a week from ForexFactory’s page is kept; the sync fills last week’s actual values', async () => {
  // last week as the feed left it (no actual values), then the hourly sync
  s.setUpstream(fmp([]));
  const sync = await s.call('POST', '/api/admin/news/sync', {}, admin.token);
  assert.equal(sync.status, 200);
  assert.equal(sync.data.lastError, undefined);
  const last = thisWeek - WEEK;
  const r = await s.call('GET', `/api/news?from=${last}&to=${last + WEEK}`, undefined, user.token);
  assert.equal(r.data.events.find((e: any) => e.title === 'Nonfarm Payrolls').actual, '256K');

  // a week ForexFactory's page gave (with its own actual values) stays as it was
  const base = fmp([]);
  s.setUpstream((url) => (url.includes('forexfactory.com/calendar?week=jan7.2024') ? new Response(FF_PAGE, { status: 200 }) : base(url)));
  const jan7 = Date.UTC(2024, 0, 7);
  const page = await s.call('GET', `/api/news?from=${jan7}&to=${jan7 + WEEK}`, undefined, user.token);
  assert.ok(page.data.events.length > 0 && page.data.events.every((e: any) => e.id.startsWith('ff-')));
  const job = await runHistory('2023-12-24');
  assert.equal(job.state, 'done', job.message);
  const after = await s.call('GET', `/api/news?from=${jan7}&to=${jan7 + WEEK}`, undefined, user.token);
  assert.deepEqual(
    after.data.events.map((e: any) => e.id),
    page.data.events.map((e: any) => e.id),
  );
  const dec31 = Date.UTC(2023, 11, 31);
  const next = await s.call('GET', `/api/news?from=${dec31}&to=${dec31 + WEEK}`, undefined, user.token);
  assert.ok(next.data.events.some((e: any) => e.id.startsWith('fmp-')), 'the weeks around it came from FMP');

  // this week stays the feed's
  const now = await s.call('GET', `/api/news?from=${thisWeek}&to=${thisWeek + WEEK}`, undefined, user.token);
  assert.ok(now.data.events.some((e: any) => e.id.startsWith('ffj-')));
  assert.ok(!now.data.events.some((e: any) => e.id.startsWith('fmp-')));
});

test('FMP history: a refused key or plan is reported; without a key it cannot start', async () => {
  s.setUpstream(fmp([], { error: { status: 401, message: 'Invalid API KEY.' } }));
  const bad = await runHistory(day(thisWeek - 2 * WEEK));
  assert.equal(bad.state, 'failed');
  assert.match(bad.message ?? '', /کلید API پذیرفته نشد/);

  s.setUpstream(fmp([], { error: { status: 402, message: 'Restricted Endpoint: This endpoint is not available under your current subscription' } }));
  const plan = await runHistory(day(thisWeek - 2 * WEEK));
  assert.match(plan.message ?? '', /پلن/);

  assert.equal((await s.call('POST', '/api/admin/news/history', { from: 'soon' }, admin.token)).data.field, 'from');
  assert.equal((await s.call('POST', '/api/admin/news/history', {}, user.token)).status, 403);
  const key = config.fmpApiKey;
  (config as { fmpApiKey: string }).fmpApiKey = '';
  try {
    const none = await s.call('POST', '/api/admin/news/history', {}, admin.token);
    assert.equal(none.status, 400);
    assert.match(JSON.stringify(none.data), /FMP_API_KEY/);
  } finally {
    (config as { fmpApiKey: string }).fmpApiKey = key;
  }
});
