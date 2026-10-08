import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string };
const DAY = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

let qveris: typeof import('../src/market/qveris');
let download: typeof import('../src/market/download');
let live: typeof import('../src/market/live');

/** What EODHD's intraday tool sends through QVeris (captured from a real call, 2015-03-02 EURUSD). */
const REAL_CSV = `Timestamp,Gmtoffset,Datetime,Open,High,Low,Close,Volume
1425254400,0,"2015-03-02 00:00:00",1.11776,1.1178,1.11775,1.11775,8
1425254460,0,"2015-03-02 00:01:00",1.11776,1.11777,1.11775,1.11775,4
1425254520,0,"2015-03-02 00:02:00",1.11775,1.11778,1.11775,1.11778,7
1425254640,0,"2015-03-02 00:04:00",1.11777,1.11777,1.11765,1.11769,18
1425340800,0,"2015-03-03 00:00:00",1.11800,1.11810,1.11790,1.11800,5
`;

/** A day of minute rows, 08:00–15:59 UTC, at a price that tells the day apart. */
function dayCsv(from: number) {
  const base = 1 + (from % (100 * 86_400)) / 86_400 / 1000;
  const rows = ['Timestamp,Gmtoffset,Datetime,Open,High,Low,Close,Volume'];
  for (let m = 8 * 60; m < 16 * 60; m++) {
    const t = from + m * 60;
    const p = +(base + m / 1e6).toFixed(5);
    rows.push(`${t},0,"${new Date(t * 1000).toISOString().slice(0, 19).replace('T', ' ')}",${p},${p + 0.0001},${p - 0.0001},${p},10`);
  }
  return rows.join('\n') + '\n';
}

/**
 * QVeris stand-in: search gives a search_id; intraday answers each day (large days through a result
 * file, as QVeris does over max_response_size); quotes answer EODHD's real-time object.
 */
function upstream(seen: { url: string; body?: any; auth?: string }[], opts: { fileDays?: Set<number>; emptyDays?: Set<number> } = {}) {
  return async (url: string, init?: RequestInit) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    seen.push({ url, body, auth: new Headers(init?.headers).get('Authorization') ?? undefined });
    const u = new URL(url);
    if (u.host === 'qveris.ai' && u.pathname === '/api/v1/search') return s.json({ search_id: 'search-1', total: 2, results: [] });
    if (u.host === 'qveris.ai' && u.pathname === '/api/v1/auth/credits') return s.json({ remaining_credits: '912.5' });
    if (u.host === 'qveris.ai' && u.pathname === '/api/v1/tools/execute') {
      const tool = u.searchParams.get('tool_id');
      const p = body.parameters;
      if (tool === qveris.TOOLS.intraday) {
        if (opts.emptyDays?.has(p.from))
          return s.json({ execution_id: 'x', result: { status_code: 200, data: '' }, success: false, error_message: 'Provider returned no valid result data', cost: 0 });
        const csv = p.from === 1425254400 ? REAL_CSV : dayCsv(p.from);
        if (opts.fileDays?.has(p.from))
          return s.json({
            execution_id: 'x',
            result: {
              status_code: 200,
              message: 'Result content is too long',
              full_content_file_url: `https://oss.qveris.ai/cache/${p.from}.json?sig=1`,
              truncated_content: csv.slice(0, 100),
            },
            success: true,
            cost: 2.81,
            remaining_credits: null,
          });
        return s.json({ execution_id: 'x', result: { status_code: 200, data: csv }, success: true, cost: 2.81, remaining_credits: null });
      }
      if (tool === qveris.TOOLS.quote) {
        const close = p.symbol === 'XAUUSD.FOREX' ? 4152.34316 : 1.1185681819916;
        return s.json({
          execution_id: 'x',
          result: {
            status_code: 200,
            data: { code: p.symbol, timestamp: Math.floor(Date.now() / 1000) - 120, gmtoffset: 0, close, previousClose: 1.12004, change: -0.0015, change_p: -0.1314 },
          },
          success: true,
          cost: 2.81,
        });
      }
    }
    if (u.host === 'oss.qveris.ai') return new Response(JSON.stringify(dayCsv(Number(u.pathname.split('/').pop()!.split('.')[0]))));
    if (u.pathname === '/api/v3/ticker/24hr') {
      const symbols = JSON.parse(u.searchParams.get('symbols')!) as string[];
      return s.json(symbols.map((sym) => ({ symbol: sym, lastPrice: sym === 'BTCUSDT' ? '86017.68870000' : '3200.12', priceChangePercent: '1.234', closeTime: Date.now() })));
    }
    throw new Error(`unexpected upstream call: ${url}`);
  };
}

async function setSettings(patch: (s: any) => void) {
  const cur = await s.call('GET', '/api/admin/settings', undefined, admin.token);
  patch(cur.data);
  const r = await s.call('PUT', '/api/admin/settings', cur.data, admin.token);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r;
}

async function runDownload(body: Record<string, unknown>) {
  const r = await s.call('POST', '/api/admin/market/download', body, admin.token);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return download.downloadFinished();
}

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true', QVERIS_API_KEY: 'sk-test-key' });
  qveris = await import('../src/market/qveris');
  download = await import('../src/market/download');
  live = await import('../src/market/live');
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'کاربر');
});
after(() => s.stop());

test('EODHD CSV: rows land on their minute of the day; other days and bad rows are left out', () => {
  const day = Date.UTC(2015, 2, 2);
  const bars = qveris.parseEodhdMinutes(REAL_CSV, day)!;
  assert.equal(bars.length, 1440 * 4);
  assert.deepEqual(Array.from(bars.subarray(0, 4)), [1.11776, 1.1178, 1.11775, 1.11775]);
  assert.ok(Number.isNaN(bars[3 * 4]), '00:03 had no trades');
  assert.equal(bars[4 * 4 + 3], 1.11769);
  assert.equal(qveris.parseEodhdMinutes('Timestamp,Gmtoffset,Datetime,Open,High,Low,Close,Volume\n', day), null, 'no rows: closed');
  assert.throws(() => qveris.parseEodhdMinutes('<html>', day));
  assert.equal(qveris.qverisSymbol({ id: 'EURUSD', group: 'forex' } as any), 'EURUSD.FOREX');
  assert.equal(qveris.qverisSymbol({ id: 'XAUUSD', group: 'metal' } as any), 'XAUUSD.FOREX');
  assert.equal(qveris.qverisSymbol({ id: 'BTCUSD', group: 'crypto' } as any), 'BTC-USD.CC');
  assert.equal(qveris.qverisSymbol({ id: 'US30', group: 'index' } as any), undefined);
});

test('QVeris is used only for the markets the admin picks, and not for indices or energy', async () => {
  const seen: { url: string }[] = [];
  s.setUpstream(upstream(seen));
  const cfg = await s.call('GET', '/api/config');
  assert.equal(cfg.data.market.EURUSD, 'dukascopy');
  const bad = await s.call(
    'PUT',
    '/api/admin/settings',
    {
      ...(await s.call('GET', '/api/admin/settings', undefined, admin.token)).data,
      marketData: { forex: 'dukascopy', index: 'qveris', metal: 'dukascopy', energy: 'dukascopy', crypto: 'binance' },
    },
    admin.token,
  );
  assert.equal(bad.status, 400);
  assert.equal(bad.data.field, 'marketData.index');
  await setSettings((d) => (d.marketData.forex = 'qveris'));
  const after = await s.call('GET', '/api/config');
  assert.equal(after.data.market.EURUSD, 'qveris');
  assert.equal(after.data.market.US30, 'dukascopy');
  assert.equal(seen.length, 0, 'choosing a source calls nothing');
});

test('download: a call per day, newest first, until the daily credit limit; the rest waits for later runs', async () => {
  qveris.resetQveris();
  const seen: { url: string; body?: any; auth?: string }[] = [];
  const first = Date.UTC(2024, 2, 4); // Monday
  s.setUpstream(upstream(seen, { fileDays: new Set([(first + 3 * DAY) / 1000]) }));
  await setSettings((d) => {
    d.marketData.forex = 'qveris';
    d.qveris.dailyCredits = 9; // three calls
  });
  const job = await runDownload({ symbols: ['EURUSD'], from: isoDay(first), to: isoDay(first + 4 * DAY) });
  assert.equal(job.state, 'done');
  assert.deepEqual([job.total, job.stored, job.later, job.failed], [5, 3, 2, 0]);
  assert.match(job.message ?? '', /سقف روزانه/);

  const calls = seen.filter((c) => c.url.includes('/tools/execute'));
  assert.equal(calls.length, 3);
  assert.ok(
    seen.every((c) => !c.url.includes('qveris.ai/api') || c.auth === 'Bearer sk-test-key'),
    'the key goes in the Authorization header',
  );
  assert.deepEqual(
    calls.map((c) => c.body.parameters.from),
    [first + 4 * DAY, first + 3 * DAY, first + 2 * DAY].map((t) => t / 1000),
    'newest day first',
  );
  const p = calls[0].body;
  assert.deepEqual(p.parameters, { symbol: 'EURUSD.FOREX', interval: '1m', from: (first + 4 * DAY) / 1000, to: (first + 5 * DAY) / 1000 - 60 });
  assert.equal(p.search_id, 'search-1');
  assert.equal(seen.filter((c) => c.url.endsWith('/search')).length, 1, 'one search for every call');
  assert.ok(
    seen.some((c) => c.url.startsWith('https://oss.qveris.ai/')),
    'a large day came from the result file',
  );

  const m1 = await s.call('GET', `/api/market/days?symbol=EURUSD&from=${isoDay(first + 2 * DAY)}&to=${isoDay(first + 4 * DAY)}&res=1m`, undefined, user.token);
  assert.equal(m1.data.source, 'qveris');
  for (const d of m1.data.days) {
    assert.equal(d.bars.length, 1440 * 4);
    assert.equal(d.bars[0], null, '00:00 had no row');
    assert.equal(typeof d.bars[8 * 60 * 4], 'number', '08:00 has a bar');
  }
  const notYet = await s.call('GET', `/api/market/days?symbol=EURUSD&from=${isoDay(first)}&to=${isoDay(first)}`, undefined, user.token);
  assert.ok(notYet.data.days[0].error, 'the oldest days wait for the next day’s credits');

  const status = await s.call('GET', '/api/admin/market/qveris', undefined, admin.token);
  assert.equal(status.status, 200);
  assert.equal(status.data.configured, true);
  assert.deepEqual(status.data.today, { day: isoDay(Date.now()), credits: 8.43, calls: 3 });
  assert.equal(status.data.remaining, 912.5);
  assert.ok(status.data.symbols.includes('XAUUSD') && !status.data.symbols.includes('US30'));
  assert.equal((await s.call('GET', '/api/admin/market/qveris', undefined, user.token)).status, 403);

  // next day's credits: a higher limit lets the next run finish what is missing
  await setSettings((d) => (d.qveris.dailyCredits = 100));
  const rest = await runDownload({ symbols: ['EURUSD'], from: isoDay(first), to: isoDay(first + 4 * DAY) });
  assert.deepEqual([rest.total, rest.stored], [2, 2]);
});

test('download: an empty day is stored as closed; Saturdays and 1-second bars use no credits', async () => {
  qveris.resetQveris();
  const seen: { url: string; body?: any }[] = [];
  const christmas = Date.UTC(2023, 11, 25);
  s.setUpstream(upstream(seen, { emptyDays: new Set([christmas / 1000]) }));
  const job = await runDownload({ symbols: ['GBPUSD'], from: '2023-12-23', to: '2023-12-25' });
  assert.deepEqual([job.stored, job.closed, job.failed], [1, 2, 0], 'Saturday and the empty Christmas day are closed');
  assert.deepEqual(
    seen.filter((c) => c.url.includes('/tools/execute')).map((c) => c.body.parameters.from),
    [christmas / 1000, christmas / 1000 - DAY / 1000],
    'Saturday was not asked',
  );

  // QVeris has no 1-second bars: they come from the symbol's free source
  const base = upstream(seen);
  s.setUpstream((url, init) => {
    if (!url.includes('dukascopy.com')) return base(url, init);
    seen.push({ url });
    return new Response('', { status: 404 });
  });
  const n = seen.length;
  await runDownload({ kind: 's1', symbols: ['GBPUSD'], from: '2023-12-27', to: '2023-12-27' });
  assert.ok(seen.slice(n).length > 0 && seen.slice(n).every((c) => c.url.includes('dukascopy.com')), 'Dukascopy only');
});

test('live prices: off by default; on, crypto from Binance and forex and gold from QVeris, reused for the set minutes', async () => {
  qveris.resetQveris();
  live.resetLiveQuotes();
  const seen: { url: string; body?: any }[] = [];
  s.setUpstream(upstream(seen));
  const off = await s.call('GET', '/api/market/showcase');
  assert.equal(off.status, 200);
  assert.ok(off.data.quotes.every((q: any) => !q.live));
  assert.equal(seen.length, 0, 'nothing asked while live prices are off');

  await setSettings((d) => {
    d.qveris.live = true;
    d.qveris.liveMinutes = 30;
  });
  const on = await s.call('GET', '/api/market/showcase');
  const q = new Map<string, any>(on.data.quotes.map((x: any) => [x.symbol, x]));
  assert.deepEqual(q.get('EURUSD'), { symbol: 'EURUSD', change: -0.13, price: 1.11857, live: true });
  assert.deepEqual(q.get('XAUUSD'), { symbol: 'XAUUSD', change: -0.13, price: 4152.34, live: true });
  assert.deepEqual(q.get('BTCUSD'), { symbol: 'BTCUSD', change: 1.23, price: 86017.7, live: true });
  assert.ok(!q.get('US30')?.live, 'indices have no live price');
  const quoteCalls = seen.filter((c) => c.url.includes('/tools/execute')).map((c) => c.body.parameters.symbol);
  assert.deepEqual(quoteCalls.sort(), ['EURUSD.FOREX', 'GBPJPY.FOREX', 'GBPUSD.FOREX', 'USDJPY.FOREX', 'XAUUSD.FOREX']);
  assert.equal(seen.filter((c) => c.url.includes('/ticker/24hr')).length, 1, 'all coins in one Binance request');

  const n = seen.length;
  await s.call('GET', '/api/market/showcase');
  assert.equal(seen.length, n, 'cached for the set minutes');
});
