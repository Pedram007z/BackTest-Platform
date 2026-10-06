import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { toApiCandles } from './fixtures/dukascopy-api';
import { klinesCsv, makeZip } from './fixtures/zip';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string };
const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
const minuteFile = fixture('EURUSD_2024-01-15_min_1.bi5');
const tickFile = fixture('EURUSD_2024-01-15_10h_ticks.bi5');
const DAY = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

let download: typeof import('../src/market/download');
let parse: typeof import('../src/market/sources');

/**
 * Stand-in for the sources: Dukascopy's data API answers GBPJPY minutes; other Dukascopy minutes come
 * from the datafeed (the EURUSD 2024-01-15 file for every day but Saturday), ticks only for 10:00; Binance has
 * monthly and daily archives and the klines API.
 */
function upstream(seen: string[]) {
  return (url: string) => {
    seen.push(url);
    const u = new URL(url);
    if (u.host === 'jetta.dukascopy.com') {
      const m = /\/candles\/minute\/GBP-JPY\/BID\/(\d+)\/(\d+)\/(\d+)$/.exec(u.pathname);
      if (m) {
        const day = Date.UTC(+m[1], +m[2] - 1, +m[3]);
        return s.json(toApiCandles(parse.parseDukascopyMinuteBars(minuteFile, 1e3)!, day, 0.001));
      }
      return new Response('', { status: 404 });
    }
    if (u.host === 'datafeed.dukascopy.com') {
      const m = /\/(\w+)\/(\d{4})\/(\d{2})\/(\d{2})\/(BID_candles_min_1|(\d{2})h_ticks)\.bi5$/.exec(u.pathname);
      if (!m) return new Response('', { status: 404 });
      if (new Date(Date.UTC(+m[2], +m[3], +m[4])).getUTCDay() === 6) return new Response('', { status: 404 });
      if (m[5] === 'BID_candles_min_1') return new Response(minuteFile);
      return m[6] === '10' ? new Response(tickFile) : new Response('', { status: 404 });
    }
    if (u.host === 'data.binance.vision') {
      const month = /\/monthly\/klines\/(\w+)\/1m\/\w+-1m-(\d{4})-(\d{2})\.zip$/.exec(u.pathname);
      if (month) {
        const start = Date.UTC(+month[2], +month[3] - 1, 1);
        const end = Date.UTC(+month[2], +month[3], 1);
        return new Response(makeZip({ [`${month[1]}-1m.csv`]: klinesCsv(start, end, 60_000, +month[2] >= 2025) }));
      }
      const day = /\/daily\/klines\/(\w+)\/1s\/\w+-1s-(\d{4}-\d{2}-\d{2})\.zip$/.exec(u.pathname);
      if (day) {
        const start = Date.parse(`${day[2]}T00:00:00Z`);
        return new Response(makeZip({ 'x.csv': `open_time,open,high,low,close\n${klinesCsv(start, start + DAY, 1000)}` }));
      }
      return new Response('', { status: 404 });
    }
    if (u.pathname === '/api/v3/klines') {
      const start = Number(u.searchParams.get('startTime'));
      const end = Number(u.searchParams.get('endTime'));
      const step = u.searchParams.get('interval') === '1s' ? 1000 : 60_000;
      return s.json(
        klinesCsv(start, Math.min(end + 1, start + 1000 * step), step)
          .split('\n')
          .map((l) => l.split(',')),
      );
    }
    throw new Error(`unexpected upstream call: ${url}`);
  };
}

async function runDownload(body: Record<string, unknown>) {
  const r = await s.call('POST', '/api/admin/market/download', body, admin.token);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return download.downloadFinished();
}

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  download = await import('../src/market/download');
  parse = await import('../src/market/sources');
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'کاربر');
});
after(() => s.stop());

test('charts read stored days only: nothing is fetched while a user views a chart', async () => {
  const seen: string[] = [];
  s.setUpstream(upstream(seen));
  const before = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-13&to=2024-01-15', undefined, user.token);
  assert.equal(before.status, 200);
  assert.deepEqual(
    before.data.days.map((d: any) => [d.day, d.bars === null ? 'closed' : d.error ? 'not downloaded' : 'bars']),
    [
      ['2024-01-13', 'closed'],
      ['2024-01-14', 'not downloaded'],
      ['2024-01-15', 'not downloaded'],
    ],
  );
  assert.equal(seen.length, 0, 'no source was asked');

  const job = await runDownload({ symbols: ['EURUSD'], from: '2024-01-13', to: '2024-01-16' });
  assert.equal(job.state, 'done');
  assert.deepEqual([job.total, job.stored, job.closed, job.failed], [4, 3, 1, 0], 'Saturday is stored as closed');
  assert.ok(!seen.some((u) => u.includes('/2024/00/13/')), 'Saturdays are not requested');

  const n = seen.length;
  const after = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-13&to=2024-01-15', undefined, user.token);
  assert.equal(after.data.days[1].bars.length, 288 * 4, 'Sunday has bars (the fixture day)');
  assert.equal(after.data.days[2].bars[0], 1.08, 'prices are divided by the instrument factor');
  const m1 = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-15&to=2024-01-15&res=1m', undefined, user.token);
  assert.equal(m1.data.days[0].bars.length, 1440 * 4);
  const expected = parse.parseDukascopyMinuteBars(minuteFile, 1e5)!;
  for (let i = 0; i < expected.length; i++) {
    const v = m1.data.days[0].bars[i];
    if (Number.isNaN(expected[i])) assert.equal(v, null);
    else assert.ok(Math.abs(v - expected[i]) < 1e-9, `minute value ${i}`);
  }
  assert.equal(seen.length, n, 'serving the stored days asked no source');

  const again = await runDownload({ symbols: ['EURUSD'], from: '2024-01-13', to: '2024-01-16' });
  assert.equal(again.total, 0, 'stored days are not downloaded again');
  assert.equal(seen.length, n);
});

test('Dukascopy: the data API first, the datafeed files when it has no answer', async () => {
  const seen: string[] = [];
  s.setUpstream(upstream(seen));
  const job = await runDownload({ symbols: ['GBPJPY', 'XAUUSD'], from: '2024-01-16', to: '2024-01-16' });
  assert.equal(job.stored, 2);
  const gj = await s.call('GET', '/api/market/days?symbol=GBPJPY&from=2024-01-16&to=2024-01-16', undefined, user.token);
  assert.equal(gj.data.days[0].bars[0], 108, 'from the API, in its own price steps');
  assert.ok(!seen.some((u) => u.includes('datafeed.dukascopy.com/datafeed/GBPJPY')), 'GBPJPY needed no datafeed file');
  assert.ok(
    seen.some((u) => u.includes('datafeed.dukascopy.com/datafeed/XAUUSD/2024/00/16/')),
    'XAUUSD fell back to the datafeed',
  );
});

test('Binance: finished months come from the monthly archive, in one request', async () => {
  const seen: string[] = [];
  s.setUpstream(upstream(seen));
  const job = await runDownload({ symbols: ['BTCUSD'], from: '2024-01-01', to: '2024-02-29' });
  assert.equal(job.state, 'done');
  assert.equal(job.stored, 60);
  assert.deepEqual(
    seen.map((u) => new URL(u).pathname.split('/').pop()),
    ['BTCUSDT-1m-2024-01.zip', 'BTCUSDT-1m-2024-02.zip'],
  );
  const d = await s.call('GET', '/api/market/days?symbol=BTCUSD&from=2024-02-29&to=2024-02-29&res=1m', undefined, user.token);
  const t0 = Date.UTC(2024, 1, 29);
  assert.equal(d.data.days[0].bars[4 * 600], +(42000 + Math.round(Math.sin((t0 + 600 * 60_000) / 3.6e6) * 30000) / 100).toFixed(2));

  // archives from 2025 give microseconds
  const seen2: string[] = [];
  s.setUpstream(upstream(seen2));
  const j2 = await runDownload({ symbols: ['ETHUSD'], from: '2025-03-01', to: '2025-03-31' });
  assert.equal(j2.stored, 31);
  assert.equal(seen2.length, 1);
});

test('recent days: days in the current month come from the klines API; empty recent days are asked again later', async () => {
  const seen: string[] = [];
  const base = upstream(seen);
  s.setUpstream((url) => (url.includes('datafeed.dukascopy.com') ? new Response('', { status: 404 }) : base(url)));
  const y = Math.floor(Date.now() / DAY) * DAY - DAY;
  const job = await runDownload({ symbols: ['BTCUSD', 'EURUSD'], from: isoDay(y), to: isoDay(y) });
  assert.equal(job.state, 'done');
  assert.ok(
    seen.some((u) => u.includes('/api/v3/klines') && u.includes('interval=1m')),
    'yesterday from the klines API',
  );
  const eur = new Date(y).getUTCDay() === 6 ? 0 : 1;
  assert.equal(job.later, eur, 'EURUSD: no file for yesterday yet, so not stored as closed');
  const status = await s.call('GET', `/api/market/days?symbol=EURUSD&from=${isoDay(y)}&to=${isoDay(y)}`, undefined, user.token);
  assert.equal(!!status.data.days[0].error, eur === 1);
});

test('1-second bars: downloaded per day on request; second charts use them where stored', async () => {
  const seen: string[] = [];
  s.setUpstream(upstream(seen));
  const job = await runDownload({ kind: 's1', symbols: ['EURUSD'], from: '2024-01-15', to: '2024-01-15' });
  assert.equal(job.stored, 1);
  assert.equal(seen.filter((u) => u.includes('h_ticks')).length, 24, 'an hour file each');
  const sec = await s.call('GET', '/api/market/seconds?symbol=EURUSD&from=2024-01-15T09&to=2024-01-15T10', undefined, user.token);
  assert.equal(sec.data.hours[0].bars, null, 'no ticks at 09:00');
  assert.equal(sec.data.hours[1].bars.length, 3600 * 4);
  const ticks = parse.parseDukascopyTicks(tickFile, 1e5)!;
  assert.equal(sec.data.hours[1].bars[0], ticks[0]);
  const notStored = await s.call('GET', '/api/market/seconds?symbol=EURUSD&from=2024-01-16T10&to=2024-01-16T10', undefined, user.token);
  assert.equal(notStored.data.hours[0].bars, null, 'built from minutes by the app');

  const btc = await runDownload({ kind: 's1', symbols: ['BTCUSD'], from: '2024-01-15', to: '2024-01-15' });
  assert.equal(btc.stored, 1);
  assert.ok(
    seen.some((u) => u.endsWith('BTCUSDT-1s-2024-01-15.zip')),
    'from the daily archive',
  );
});

test('admin: storage report, one download at a time, limits, and stop', async () => {
  s.setUpstream(upstream([]));
  const report = await s.call('GET', '/api/admin/market/storage', undefined, admin.token);
  assert.equal(report.status, 200);
  const eur = report.data.symbols.find((x: any) => x.id === 'EURUSD');
  assert.equal(eur.first, '2024-01-14');
  assert.equal(eur.secondDays, 1);
  assert.ok(eur.bytes > 0 && report.data.bytes >= eur.bytes);
  assert.equal(report.data.symbols.find((x: any) => x.id === 'SOLUSD').start, '2020-08-11', 'coins start at their listing');
  assert.equal(report.data.autoDownload, true);
  assert.equal((await s.call('GET', '/api/admin/market/storage', undefined, user.token)).status, 403);

  assert.equal((await s.call('POST', '/api/admin/market/download', { symbols: ['NOPE'] }, admin.token)).data.field, 'symbols');
  assert.equal((await s.call('POST', '/api/admin/market/download', { kind: 's1' }, admin.token)).data.field, 'symbols');
  assert.equal((await s.call('POST', '/api/admin/market/download', { kind: 's1', symbols: ['EURUSD'], from: '2024-01-01', to: '2024-06-01' }, admin.token)).data.code, 'range');

  const slow = upstream([]);
  s.setUpstream(async (url) => {
    await new Promise((r) => setTimeout(r, 20));
    return slow(url);
  });
  const first = await s.call('POST', '/api/admin/market/download', { symbols: ['USDJPY'], from: '2023-01-01', to: '2023-12-31' }, admin.token);
  assert.equal(first.data.state, 'running');
  const busy = await s.call('POST', '/api/admin/market/download', { symbols: ['EURUSD'] }, admin.token);
  assert.equal(busy.status, 409);
  await s.call('POST', '/api/admin/market/download/stop', undefined, admin.token);
  const end = await download.downloadFinished();
  assert.equal(end.state, 'stopped');
  assert.ok(end.done < end.total, 'stopped before the end');
  const resumed = await runDownload({ symbols: ['USDJPY'], from: '2023-01-01', to: '2023-12-31' });
  assert.equal(resumed.total, end.total - end.done, 'a new run fetches only what is missing');
});

test('a source that does not answer ends the download instead of trying every day', async () => {
  s.setUpstream(() => new Response('', { status: 503 }));
  const job = await runDownload({ symbols: ['AUDUSD'], from: '2022-01-01', to: '2022-12-31' });
  assert.equal(job.state, 'failed');
  assert.match(job.message ?? '', /پاسخ نمی‌دهد/);
  assert.ok(job.done < job.total);
});

test('showcase: stored prices only', async () => {
  s.setUpstream(upstream([]));
  const y = Math.floor(Date.now() / DAY) * DAY - DAY;
  await runDownload({ symbols: ['EURUSD', 'GBPUSD'], from: isoDay(y - 9 * DAY), to: isoDay(y - 2 * DAY) });
  await runDownload({ symbols: ['EURUSD'], from: '2024-03-04', to: '2024-03-06' });
  const r = await s.call('GET', '/api/market/showcase');
  assert.equal(r.status, 200);
  assert.equal(r.data.sample.bars.length, 3 * 276);
  const symbols = r.data.quotes.map((q: any) => q.symbol);
  assert.ok(symbols.includes('EURUSD') && symbols.includes('GBPUSD'), symbols.join());
  assert.ok(!symbols.includes('XAUUSD'), 'symbols without stored days are left out');
});
