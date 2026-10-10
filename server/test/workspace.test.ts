import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';
import {
  applyPatch,
  baseOf,
  diffWorkspace,
  emptyWorkspace,
  firstSyncPatch,
  rebase,
  type WorkspaceData,
  type WorkspacePatch,
} from '../../src/services/workspace';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string; user: any };
let user: { token: string; user: any };
let other: { token: string; user: any };

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'سارا رضایی');
  other = await s.signIn('09359876543', 'علی');
});
after(() => s.stop());

const start = Date.parse('2024-01-01T00:00:00Z');
const session = (id: string, name: string, cursor = start) =>
  ({
    id,
    name,
    balance: 10_000,
    symbols: ['EURUSD'],
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    cursor,
    timeframe: '15m',
    activeSymbol: 'EURUSD',
    createdAt: 1,
    notes: '',
  }) as any;
const trade = (id: string, sessionId: string, pnl = 100) =>
  ({
    id,
    sessionId,
    symbol: 'EURUSD',
    side: 'buy',
    orderType: 'market',
    status: 'closed',
    entry: 1.1,
    sl: 1.09,
    tp: 1.12,
    lots: 0,
    initialLots: 1,
    pointValue: 100_000,
    risk: 100,
    riskPct: 1,
    placedTime: start,
    openTime: start,
    partials: [{ time: start, price: 1.11, lots: 1, pnl }],
    pnl,
    executedAt: 3,
    journal: { screenshots: ['shot_abcd1234'], checked: [], confidence: 50, rating: 4, notes: 'یادداشت', tags: ['breakout'], updatedAt: 5 },
  }) as any;
const data = (patch: Partial<WorkspaceData>): WorkspaceData => ({ ...emptyWorkspace(), ...patch });

const get = (token: string, rev?: number) => s.call('GET', `/api/me/workspace${rev === undefined ? '' : `?rev=${rev}`}`, undefined, token);
let pidN = 0;
const push = (token: string, baseRev: number, patch: WorkspacePatch, pid = `pid_${++pidN}_test`) => s.call('POST', '/api/me/workspace', { baseRev, pid, patch }, token);

// ---------- the merge rules (shared with the app) ----------

test('changes since the base: new, changed and deleted items, added time, preferences', () => {
  const a = data({ sessions: [session('se1', 'A')], trades: [trade('t1', 'se1')], dailySeconds: { '2024-05-01': 60 }, replayedMs: 1000, prefs: { theme: 'dark' } });
  const base = baseOf(a, 3);
  assert.equal(diffWorkspace(base, a), null, 'nothing changed');
  const b = {
    ...a,
    sessions: [session('se2', 'B'), { ...a.sessions[0], cursor: start + 1 }],
    trades: [],
    dailySeconds: { '2024-05-01': 90, '2024-05-02': 15 },
    replayedMs: 4000,
    prefs: { theme: 'light' as const },
  };
  const p = diffWorkspace(base, b)!;
  assert.deepEqual(
    p.upsert?.sessions?.map((x) => x.id),
    ['se2', 'se1'],
  );
  assert.deepEqual(p.remove, { trades: ['t1'] });
  assert.deepEqual(p.add, { dailySeconds: { '2024-05-01': 30, '2024-05-02': 15 }, replayedMs: 3000 });
  assert.deepEqual(p.prefs, { theme: 'light' });
  // applied to the base data gives the new data
  const applied = applyPatch(a, p);
  assert.equal(diffWorkspace(baseOf(b, 0), applied), null);
  // key order does not matter
  const reordered = data({ sessions: [Object.fromEntries(Object.entries(a.sessions[0]).reverse()) as any], trades: a.trades, dailySeconds: a.dailySeconds, replayedMs: 1000, prefs: { theme: 'dark' } });
  assert.equal(diffWorkspace(base, reordered), null);
});

test('rebase: this browser’s changes on top of another device’s, deletions stay deleted', () => {
  const server0 = data({ sessions: [session('se1', 'A'), session('se2', 'B')], trades: [trade('t1', 'se1'), trade('t2', 'se2')], dailySeconds: { d: 10 } as any });
  const base = baseOf(server0, 1);
  // the other device deleted se2 and practised 20 s; this one changed se1 and se2, practised 5 s, added a session
  const server1 = data({ sessions: [server0.sessions[0]], trades: [server0.trades[0]], dailySeconds: { d: 30 } as any });
  const local = data({
    sessions: [session('se3', 'C'), session('se1', 'A', start + 9), session('se2', 'B', start + 9)],
    trades: [server0.trades[0], { ...server0.trades[1], pnl: 1 }, trade('t3', 'se3')],
    dailySeconds: { d: 15 } as any,
  });
  const merged = rebase(server1, local, base);
  assert.deepEqual(
    merged.sessions.map((x) => [x.id, x.cursor]),
    [
      ['se3', start],
      ['se1', start + 9],
    ],
  );
  assert.deepEqual(
    merged.trades.map((t) => t.id),
    ['t1', 't3'],
    'the deleted session’s trade went with it',
  );
  assert.deepEqual(merged.dailySeconds, { d: 35 });
});

test('first sync of a browser: an unused browser takes the server copy, a used one is combined', () => {
  const server = data({ sessions: [session('se1', 'A')], prefs: { theme: 'light' } });
  const fresh = data({ prefs: { theme: 'dark', hasDemoData: false } });
  assert.equal(firstSyncPatch(server, fresh), null);
  assert.deepEqual(rebase(server, fresh, null), server);
  const used = data({ sessions: [session('se9', 'Z')], dailySeconds: { d: 5 } as any, prefs: { theme: 'dark', hasDemoData: false } });
  const merged = rebase(server, used, null);
  assert.deepEqual(
    merged.sessions.map((x) => x.id),
    ['se9', 'se1'],
  );
  assert.equal(merged.prefs.theme, 'light', 'the account’s preference wins on a first sync');
  assert.equal(merged.prefs.hasDemoData, false);
});

// ---------- the API ----------

test('a new account has no saved data; sign-in needed', async () => {
  assert.equal((await s.call('GET', '/api/me/workspace')).status, 401);
  assert.equal((await s.call('POST', '/api/me/workspace', { baseRev: 0, pid: 'pid_aaaaaa', patch: {} })).status, 401);
  const r = await get(user.token);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data, { rev: 0, data: null, pids: [] });
});

test('saved from one browser, read in another; changes from two devices are combined', async () => {
  // browser A uploads its data
  const a = await push(user.token, 0, {
    upsert: { sessions: [session('se1', 'لندن')], trades: [trade('t1', 'se1'), trade('t2', 'se1', -50)], strategies: [{ id: 'st1', name: 'شکست', description: '', createdAt: 1 }] as any },
    add: { dailySeconds: { '2024-05-01': 600 }, replayedMs: 3_600_000 },
    prefs: { theme: 'light', avatar: 'data:image/jpeg;base64,AAAA' },
  });
  assert.equal(a.status, 200);
  assert.equal(a.data.rev, 1);
  assert.equal(a.data.data, undefined, 'nothing else changed: the copy is not sent back');
  assert.deepEqual((await get(user.token, 1)).data, { rev: 1, unchanged: true, pids: ['pid_1_test'] });

  // browser B (a phone) reads it
  const b = await get(user.token);
  assert.equal(b.data.rev, 1);
  assert.deepEqual(
    b.data.data.trades.map((t: any) => t.id),
    ['t1', 't2'],
  );
  assert.equal(b.data.data.trades[0].journal.notes, 'یادداشت', 'journals are kept');
  assert.deepEqual(b.data.data.dailySeconds, { '2024-05-01': 600 });
  assert.equal(b.data.data.prefs.theme, 'light');

  // B practises and adds a session; A, not knowing, moves the replay on: both kept, time adds up
  const fromB = await push(user.token, 1, { upsert: { sessions: [session('se2', 'نیویورک')] }, add: { dailySeconds: { '2024-05-01': 120 } } });
  assert.equal(fromB.data.rev, 2);
  const fromA = await push(user.token, 1, { upsert: { sessions: [session('se1', 'لندن', start + 5000)] }, add: { dailySeconds: { '2024-05-01': 30 } } });
  assert.equal(fromA.data.rev, 3);
  assert.ok(fromA.data.data, 'the copy changed elsewhere: sent back to rebase on');
  assert.deepEqual(
    fromA.data.data.sessions.map((x: any) => [x.id, x.cursor]),
    [
      ['se2', start],
      ['se1', start + 5000],
    ],
  );
  assert.deepEqual(fromA.data.data.dailySeconds, { '2024-05-01': 750 });
  // other users never see it
  assert.equal((await get(other.token)).data.data, null);
});

test('a change sent twice (its answer was lost) is applied once', async () => {
  const before = (await get(user.token)).data;
  const p = { add: { replayedMs: 1000 } };
  const once = await push(user.token, before.rev, p, 'pid_resent_1');
  const twice = await push(user.token, once.data.rev, p, 'pid_resent_1');
  assert.equal(twice.data.rev, once.data.rev);
  assert.equal(twice.data.data.replayedMs, before.data.replayedMs + 1000);
  assert.ok(twice.data.pids.includes('pid_resent_1'));
  assert.equal((await s.call('POST', '/api/me/workspace', { baseRev: 0, pid: 'x', patch: p }, user.token)).status, 400);
  assert.equal((await s.call('POST', '/api/me/workspace', { baseRev: -1, pid: 'pid_valid_1', patch: p }, user.token)).status, 400);
});

test('deleted on one device stays deleted: a device that had not seen it cannot bring it back', async () => {
  const now = (await get(user.token)).data;
  const del = await push(user.token, now.rev, { remove: { sessions: ['se2'] } });
  // a device still at the older revision changes the session and adds a trade to it
  const stale = await push(user.token, now.rev, { upsert: { sessions: [session('se2', 'نیویورک', start + 1)], trades: [trade('t9', 'se2')] } });
  assert.ok(!stale.data.data.sessions.some((x: any) => x.id === 'se2'));
  assert.ok(!stale.data.data.trades.some((t: any) => t.id === 't9'));
  // a device that saw the deletion may create the same id again (a built-in preset edited after a reset)
  const preset = { id: 'g_london', name: 'لندن', time: '10:00', tz: 'Europe/London', builtin: true };
  const r1 = await push(user.token, stale.data.rev, { upsert: { goToPresets: [preset] as any } });
  const r2 = await push(user.token, r1.data.rev, { remove: { goToPresets: ['g_london'] } });
  const r3 = await push(user.token, r2.data.rev, { upsert: { goToPresets: [{ ...preset, time: '09:00' }] as any } });
  assert.deepEqual((await get(user.token)).data.data.goToPresets, [{ ...preset, time: '09:00' }]);
  assert.ok(del.data.rev < r3.data.rev);
});

test('malformed items are left out; too much data is refused', async () => {
  const now = (await get(user.token)).data;
  const r = await push(user.token, now.rev, { upsert: { sessions: [{ name: 'no id' }, session('se5', 'ok')], trades: [{ id: 'tx' }] } as any, prefs: { theme: 'blue', avatar: 'javascript:alert(1)' } as any });
  assert.equal(r.status, 200);
  const d = (await get(user.token)).data.data;
  assert.ok(d.sessions.some((x: any) => x.id === 'se5'));
  assert.ok(!d.trades.some((t: any) => t.id === 'tx'));
  assert.equal(d.prefs.theme, 'light');
  assert.equal(d.prefs.avatar, 'data:image/jpeg;base64,AAAA');
  const many = Array.from({ length: 501 }, (_, i) => session(`bulk${i}`, 'x'));
  const big = await push(user.token, r.data.rev, { upsert: { sessions: many } });
  assert.equal(big.status, 413);
});

test('the admin panel’s copy follows the saved data; an admin’s deletion reaches every device', async () => {
  const { flushWorkspaces } = await import('../src/workspace');
  flushWorkspaces();
  const list = await s.call('GET', `/api/admin/backtests?userId=${user.user.id}`, undefined, admin.token);
  assert.deepEqual(list.data.items.map((r: any) => r.id).sort(), ['se1', 'se5']);
  const detail = await s.call('GET', `/api/admin/backtests/${user.user.id}`, undefined, admin.token);
  assert.equal(detail.data.snapshot.trades.length, 2);
  assert.equal(detail.data.snapshot.trades[0].journal, undefined, 'journals stay private');

  const before = (await get(user.token)).data;
  const del = await s.call('DELETE', `/api/admin/backtests/${user.user.id}/sessions/se1`, undefined, admin.token);
  assert.equal(del.status, 204);
  assert.ok(s.db().audit.some((e: any) => e.action === 'حذف جلسه‌ی بک‌تست کاربر' && e.target.includes('لندن')));
  const after = (await get(user.token, before.rev)).data;
  assert.equal(after.rev, before.rev + 1, 'the user’s devices see a new revision');
  assert.ok(!after.data.sessions.some((x: any) => x.id === 'se1'));
  assert.deepEqual(after.data.trades, [], 'with its trades');
  // a device that had not synced yet cannot bring it back
  const stale = await push(user.token, before.rev, { upsert: { sessions: [session('se1', 'لندن', start + 99)] } });
  assert.ok(!stale.data.data.sessions.some((x: any) => x.id === 'se1'));
  assert.equal((await s.call('DELETE', `/api/admin/backtests/${user.user.id}/sessions/se1`, undefined, admin.token)).status, 404);
});

test('chart drawings per session and pane: the newest save wins; a deleted session’s go with it', async () => {
  const now = (await get(user.token)).data;
  await push(user.token, now.rev, { upsert: { sessions: [session('se7', 'چارت')] } });
  const put = (sessionId: string, body: unknown, token = user.token) => s.call('PUT', `/api/me/layouts/${sessionId}`, body, token);
  const drawings = { v: 1, drawings: { EURUSD: [{ id: 'd1', kind: 'trend' }] }, indicators: [] };
  assert.equal((await put('se7', { key: 'lw:se7:0', at: 1000, data: drawings })).data.stored, true);
  const older = await put('se7', { key: 'lw:se7:0', at: 500, data: { v: 1, drawings: {}, indicators: [] } });
  assert.equal(older.data.stored, false);
  assert.deepEqual(older.data.data, drawings, 'the newer save comes back');
  assert.equal((await put('se7', { key: 'bad key', at: 1, data: {} })).status, 400);
  assert.equal((await put('nope', { key: 'lw:nope:0', at: 1, data: {} })).status, 404, 'only the user’s own sessions');
  assert.equal((await put('se7', { key: 'lw:se7:0', at: 2000, data: drawings }, other.token)).status, 404, 'not another user’s');
  const got = await s.call('GET', '/api/me/layouts/se7', undefined, user.token);
  assert.deepEqual(got.data.items['lw:se7:0'], { at: 1000, data: drawings });
  assert.deepEqual((await s.call('GET', '/api/me/layouts/se7', undefined, other.token)).data.items, {});

  const cur = (await get(user.token)).data;
  await push(user.token, cur.rev, { remove: { sessions: ['se7'] } });
  assert.deepEqual((await s.call('GET', '/api/me/layouts/se7', undefined, user.token)).data.items, {});
});

test('journal screenshots: stored per user, read back with their type', async () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const put = (id: string, body: Uint8Array | string, type: string, token = user.token) => s.call('PUT', `/api/me/shots/${id}`, body, token, { headers: { 'Content-Type': type } });
  assert.equal((await put('shot_abcd1234', jpeg, 'image/jpeg')).status, 200);
  assert.equal((await put('shot_abcd1235', Buffer.from('<svg/>'), 'image/png')).status, 400, 'not a picture');
  assert.equal((await put('shot_abcd1236', jpeg, 'text/html')).status, 400);
  assert.equal((await put('../etc', jpeg, 'image/jpeg')).status, 404);
  assert.equal((await put('evil_1234', jpeg, 'image/jpeg')).status, 400);
  const got = await s.call('GET', '/api/me/shots/shot_abcd1234', undefined, user.token);
  assert.equal(got.status, 200);
  assert.equal(got.headers.get('content-type'), 'image/jpeg');
  assert.equal((await s.call('GET', '/api/me/shots/shot_abcd1234')).status, 401);
  assert.equal((await s.call('GET', '/api/me/shots/shot_abcd1234', undefined, other.token)).status, 404);
  assert.equal((await s.call('DELETE', '/api/me/shots/shot_abcd1234', undefined, user.token)).status, 204);
  assert.equal((await s.call('GET', '/api/me/shots/shot_abcd1234', undefined, user.token)).status, 404);
});

test('deleting an account deletes its saved data', async () => {
  const gone = await s.signIn('09130000000', 'حذفی');
  await push(gone.token, 0, { upsert: { sessions: [session('se1', 'x')] } });
  const { flushWorkspaces } = await import('../src/workspace');
  flushWorkspaces();
  assert.equal((await s.call('DELETE', `/api/admin/users/${gone.user.id}`, undefined, admin.token)).status, 204);
  const again = await s.signIn('09130000000', 'حذفی');
  assert.equal((await get(again.token)).data.data, null);
});
