import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let user: { token: string };
let store: typeof import('../src/market/store');
let importer: typeof import('../src/market/importer');

const blobSha = (b: Uint8Array) => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');

/** 1440 one-minute bars around `price`, traded 08:00–16:00. */
function dayBars(price: number) {
  const b = new Float64Array(1440 * 4).fill(NaN);
  for (let m = 480; m < 960; m++) b.set([price, price + 0.001, price - 0.001, price + (m % 7) / 10_000], m * 4);
  return b;
}

/** A month file made by the store itself (then removed from the server), with `days` days stored. */
function monthFile(symbol: string, year: number, month: number, days: number[], price: number) {
  const start = Date.UTC(year, month - 1, 1);
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const path = store.monthFilePath(symbol, key);
  rmSync(path, { force: true });
  store.resetStoreCache();
  store.writeDays(symbol, start, new Map(days.map((d) => [d, dayBars(price + d / 1000)])));
  const data = readFileSync(path);
  rmSync(path);
  store.resetStoreCache();
  return { path: `store/${symbol}/${key}.m1`, data };
}

/** A fake GitHub: the branch's tree from the API, the files from raw.githubusercontent.com. */
function github(files: { path: string; data: Uint8Array }[], seen: string[], opts: { corrupt?: string; slow?: number } = {}) {
  return async (url: string) => {
    seen.push(url);
    if (opts.slow) await new Promise((r) => setTimeout(r, opts.slow));
    const u = new URL(url);
    if (u.host === 'api.github.com') {
      if (!u.pathname.startsWith('/repos/Pedram007z/BackTest-Platform/git/trees/market-data')) return new Response('{"message":"Not Found"}', { status: 404 });
      return s.json({
        sha: 'tree',
        truncated: false,
        tree: [
          { path: 'README.md', type: 'blob', size: 10, sha: 'x' },
          { path: 'store', type: 'tree', sha: 't' },
          { path: 'store/NOPE/2024-01.m1', type: 'blob', size: 10, sha: 'y' },
          ...files.map((f) => ({ path: f.path, type: 'blob', size: f.data.length, sha: blobSha(f.data) })),
        ],
      });
    }
    if (u.host === 'raw.githubusercontent.com') {
      const path = decodeURIComponent(u.pathname.replace('/Pedram007z/BackTest-Platform/market-data/', ''));
      const f = files.find((x) => x.path === path);
      if (!f) return new Response('', { status: 404 });
      return new Response(path === opts.corrupt ? f.data.subarray(0, 100) : f.data);
    }
    throw new Error(`unexpected upstream call: ${url}`);
  };
}

async function runImport(body: Record<string, unknown> = {}) {
  const r = await s.call('POST', '/api/admin/market/import', body, admin.token);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return (await importer.importFinished())!;
}

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  store = await import('../src/market/store');
  importer = await import('../src/market/importer');
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'کاربر');
});
after(() => s.stop());

test('import: month files from the GitHub branch fill the storage; charts read them', async () => {
  const files = [monthFile('EURUSD', 2024, 1, [2, 3, 4, 5, 6], 1.09), monthFile('EURUSD', 2024, 2, [1, 2], 1.08), monthFile('BTCUSD', 2024, 1, [1, 2, 3], 42000)];
  const seen: string[] = [];
  s.setUpstream(github(files, seen));

  const status = await s.call('GET', '/api/admin/market/storage', undefined, admin.token);
  assert.deepEqual([status.data.import.repo, status.data.import.branch, status.data.import.tokenSet], ['Pedram007z/BackTest-Platform', 'market-data', false]);

  const job = await runImport();
  assert.equal(job.state, 'done', job.message);
  assert.deepEqual([job.total, job.added, job.replaced, job.kept, job.failed], [3, 3, 0, 0, 0], 'README and unknown symbols are skipped');
  for (const f of files) assert.deepEqual(readFileSync(store.monthFilePath(f.path.split('/')[1], f.path.split('/')[2].slice(0, 7))), f.data);
  assert.ok(seen.every((u) => !u.includes('Authorization')));

  const days = await s.call('GET', '/api/market/days?symbol=EURUSD&from=2024-01-02&to=2024-01-02&res=1m', undefined, user.token);
  assert.equal(days.data.days[0].bars[480 * 4], 1.092);
  const report = await s.call('GET', '/api/admin/market/storage', undefined, admin.token);
  assert.equal(report.data.symbols.find((x: any) => x.id === 'BTCUSD').first, '2024-01-01');
  assert.equal(report.data.import.lastJob.added, 3);

  // again: the same files are not downloaded
  const n = seen.length;
  const again = await runImport();
  assert.deepEqual([again.added, again.kept], [0, 3]);
  assert.equal(seen.slice(n).filter((u) => u.includes('raw.githubusercontent.com')).length, 0, 'nothing downloaded');
});

test('import: a different month replaces the server copy only when it covers more days', async () => {
  // the branch: January with 7 days, February with 2; the server: January with 1 day, February with 5
  const jan = monthFile('EURUSD', 2024, 1, [2, 3, 4, 5, 6, 8, 9], 1.09);
  const feb = monthFile('EURUSD', 2024, 2, [1, 2], 1.08);
  store.writeDays('EURUSD', Date.UTC(2024, 0, 1), new Map([[2, dayBars(1.092)]]));
  store.writeDays('EURUSD', Date.UTC(2024, 1, 1), new Map([1, 2, 5, 6, 7].map((d) => [d, dayBars(1.08 + d / 1000)])));

  s.setUpstream(github([jan, feb], []));
  const job = await runImport();
  assert.deepEqual([job.replaced, job.kept, job.failed], [1, 1, 0]);
  assert.deepEqual(readFileSync(store.monthFilePath('EURUSD', '2024-01')), jan.data, 'January: the branch covers more days');
  assert.equal(store.coveredDays(readFileSync(store.monthFilePath('EURUSD', '2024-02'))), 5, 'February: the server copy covers more days');
});

test('import: a damaged file is not stored; bad input and a missing branch are reported', async () => {
  const good = monthFile('GBPUSD', 2024, 3, [4, 5], 1.27);
  const bad = monthFile('GBPUSD', 2024, 4, [1, 2], 1.26);
  s.setUpstream(github([good, bad], [], { corrupt: bad.path }));
  const job = await runImport();
  assert.deepEqual([job.added, job.failed], [1, 1]);
  assert.match(job.errors[0].error, /ناقص/);
  assert.equal(store.dayStatus('GBPUSD', Date.UTC(2024, 3, 1)), store.MISSING);

  assert.equal((await s.call('POST', '/api/admin/market/import', { repo: 'not a repo' }, admin.token)).data.field, 'repo');
  assert.equal((await s.call('POST', '/api/admin/market/import', {}, user.token)).status, 403);
  const missing = await runImport({ branch: 'nope' });
  assert.equal(missing.state, 'failed');
  assert.match(missing.message ?? '', /پیدا نشد/);
});

test('import and download do not run at the same time', async () => {
  const f = monthFile('USDJPY', 2024, 5, [6, 7], 155);
  s.setUpstream(github([f], [], { slow: 200 }));
  const started = await s.call('POST', '/api/admin/market/import', {}, admin.token);
  assert.equal(started.data.state, 'running');
  const download = await s.call('POST', '/api/admin/market/download', { symbols: ['EURUSD'] }, admin.token);
  assert.equal(download.status, 409);
  assert.match(JSON.stringify(download.data), /GitHub/);
  const second = await s.call('POST', '/api/admin/market/import', {}, admin.token);
  assert.equal(second.status, 409);
  const done = (await importer.importFinished())!;
  assert.equal(done.added, 1);
});
