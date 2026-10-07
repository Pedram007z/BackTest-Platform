import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string; user: any };
let user: { token: string; user: any };

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09351234567', 'سارا رضایی');
});
after(() => s.stop());

const DAY = 86_400_000;
const start = Date.parse('2024-01-01T00:00:00Z');
const session = (id: string, name: string) => ({
  id,
  name,
  balance: 10_000,
  symbols: ['EURUSD'],
  startDate: '2024-01-01',
  endDate: '2024-01-10',
  cursor: start + 5 * DAY,
  timeframe: '15m',
  activeSymbol: 'EURUSD',
  createdAt: 1,
  lastOpenedAt: 2,
  notes: 'private notes',
  layout: '1',
});
const trade = (id: string, sessionId: string, status: string, pnl?: number) => ({
  id,
  sessionId,
  symbol: 'EURUSD',
  side: 'buy',
  orderType: 'market',
  status,
  entry: 1.1,
  sl: 1.09,
  tp: 1.12,
  lots: status === 'closed' ? 0 : 1,
  initialLots: 1,
  pointValue: 100_000,
  risk: 100,
  riskPct: 1,
  placedTime: start,
  openTime: start,
  closeTime: status === 'closed' ? start + DAY : undefined,
  exit: status === 'closed' ? 1.11 : undefined,
  partials: pnl === undefined ? [] : [{ time: start + DAY, price: 1.11, lots: 1, pnl }],
  pnl,
  executedAt: 3,
  journal: { notes: 'secret', screenshots: ['data:image/jpeg;base64,AAAA'] },
});
const snapshot = {
  sessions: [session('se1', 'لندن'), session('se2', 'نیویورک')],
  trades: [trade('t1', 'se1', 'closed', 200), trade('t2', 'se1', 'closed', -100), trade('t3', 'se1', 'open'), trade('t4', 'se2', 'closed', 50)],
  strategies: [{ id: 'st1', name: 'شکست' }],
};

test("the app's backtest copy: sent when it changed, summarised for the admin, journals left out", async () => {
  const check = (hash: string) => s.call('POST', '/api/me/backtests/check', { hash }, user.token);
  assert.equal((await s.call('POST', '/api/me/backtests/check', { hash: 'x' })).status, 401);
  assert.deepEqual((await check('aaaa1111bbbb2222')).data, { needData: true, remove: [] });
  assert.equal((await s.call('PUT', '/api/me/backtests', { hash: 'nope!', snapshot }, user.token)).status, 400);
  const up = await s.call('PUT', '/api/me/backtests', { hash: 'aaaa1111bbbb2222', snapshot }, user.token);
  assert.equal(up.status, 200, JSON.stringify(up.data));
  assert.deepEqual((await check('aaaa1111bbbb2222')).data, { needData: false, remove: [] });
  assert.equal((await check('cccc1111bbbb2222')).data.needData, true, 'a different fingerprint asks for the data');

  assert.equal((await s.call('GET', '/api/admin/backtests', undefined, user.token)).status, 403);
  const list = await s.call('GET', '/api/admin/backtests', undefined, admin.token);
  assert.equal(list.data.total, 2);
  assert.equal(list.data.users, 1);
  assert.equal(list.data.open, 1);
  const london = list.data.items.find((r: any) => r.id === 'se1');
  assert.equal(london.userName, 'سارا رضایی');
  assert.equal(london.closed, 2);
  assert.equal(london.open, 1);
  assert.equal(london.wins, 1);
  assert.equal(london.losses, 1);
  assert.equal(london.netPnl, 100);
  assert.equal(london.progress, 0.5);
  assert.ok(london.ip, 'the address the copy came from');
  assert.equal((await s.call('GET', '/api/admin/backtests?q=%D9%86%DB%8C%D9%88%DB%8C%D9%88%D8%B1%DA%A9', undefined, admin.token)).data.total, 1, 'search by session name');
  assert.equal((await s.call('GET', '/api/admin/backtests?sort=pnl', undefined, admin.token)).data.items[0].id, 'se1');

  const detail = await s.call('GET', `/api/admin/backtests/${user.user.id}`, undefined, admin.token);
  assert.equal(detail.data.snapshot.trades.length, 4);
  assert.equal(detail.data.snapshot.trades[0].journal, undefined, 'journals stay in the browser');
  assert.equal(detail.data.snapshot.sessions[0].notes, undefined);
  assert.equal(detail.data.user.phone, '09351234567');
});

test('an admin deletes a session: gone here, and removed by the app at its next sync', async () => {
  const del = await s.call('DELETE', `/api/admin/backtests/${user.user.id}/sessions/se2`, undefined, admin.token);
  assert.equal(del.status, 204);
  assert.equal((await s.call('DELETE', `/api/admin/backtests/${user.user.id}/sessions/se2`, undefined, admin.token)).status, 404);
  assert.ok(s.db().audit.some((e: any) => e.action === 'حذف جلسه‌ی بک‌تست کاربر' && e.target.includes('نیویورک')));
  assert.equal((await s.call('GET', '/api/admin/backtests', undefined, admin.token)).data.total, 1);

  const check = await s.call('POST', '/api/me/backtests/check', { hash: 'aaaa1111bbbb2222' }, user.token);
  assert.deepEqual(check.data.remove, ['se2']);
  // an app that has not removed it yet: the server still leaves it out
  const stale = await s.call('PUT', '/api/me/backtests', { hash: 'dddd1111bbbb2222', snapshot }, user.token);
  assert.deepEqual(stale.data.remove, ['se2']);
  assert.equal((await s.call('GET', `/api/admin/backtests/${user.user.id}`, undefined, admin.token)).data.snapshot.sessions.length, 1);
  // the app removed it: nothing pending any more
  const without = { ...snapshot, sessions: [snapshot.sessions[0]], trades: snapshot.trades.filter((t) => t.sessionId === 'se1') };
  const done = await s.call('PUT', '/api/me/backtests', { hash: 'eeee1111bbbb2222', snapshot: without }, user.token);
  assert.deepEqual(done.data.remove, []);
});

test('sign-ins and sign-outs are logged with the address; admins see devices and sign users out', async () => {
  const log = await s.call('GET', `/api/admin/activity?userId=${user.user.id}`, undefined, admin.token);
  assert.equal(log.data.total, 1);
  assert.equal(log.data.items[0].kind, 'login');
  assert.equal(log.data.items[0].method, 'otp');
  assert.ok(log.data.items[0].ip);

  const users = await s.call('GET', '/api/admin/users?q=09351234567', undefined, admin.token);
  assert.ok(users.data.items[0].lastIp, 'last address on the user list');

  const second = await s.signIn('09351234567');
  const devices = await s.call('GET', `/api/admin/users/${user.user.id}/devices`, undefined, admin.token);
  assert.equal(devices.data.length, 2);
  assert.ok(devices.data[0].userAgent !== undefined && devices.data[0].ip);

  const one = await s.call('DELETE', `/api/admin/users/${user.user.id}/devices/${devices.data[1].id}`, undefined, admin.token);
  assert.equal(one.data.count, 1);
  const all = await s.call('DELETE', `/api/admin/users/${user.user.id}/devices`, undefined, admin.token);
  assert.equal(all.data.count, 1);
  assert.equal((await s.call('GET', '/api/me', undefined, second.token)).status, 401);
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).status, 401);
  const kinds = (await s.call('GET', `/api/admin/activity?userId=${user.user.id}`, undefined, admin.token)).data.items.map((e: any) => e.kind);
  assert.deepEqual(kinds, ['signed_out_by_admin', 'signed_out_by_admin', 'login', 'login']);

  const again = await s.signIn('09351234567');
  await s.call('POST', '/api/auth/logout', {}, again.token);
  assert.equal((await s.call('GET', `/api/admin/activity?kind=logout`, undefined, admin.token)).data.items[0].userId, user.user.id);
  user = await s.signIn('09351234567');
});

test('announcements: pictures and videos uploaded, shown to the right visitors, counted once', async () => {
  const upload = (body: string, type: string, token = admin.token) => s.call('POST', '/api/admin/media?name=banner.png', body, token, { headers: { 'Content-Type': type } });
  assert.equal((await upload('png-bytes', 'image/png', user.token)).status, 403);
  assert.equal((await upload('<svg/>', 'image/svg+xml')).data.field, 'media', 'only safe picture types');
  assert.equal((await upload('x'.repeat(10 * 1024 * 1024 + 1), 'image/png')).status, 413);
  const img = await upload('0123456789abcdef', 'image/png');
  assert.equal(img.status, 200, JSON.stringify(img.data));
  assert.equal(img.data.kind, 'image');
  assert.equal(img.data.size, 16);

  const file = await s.call('GET', img.data.url);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'image/png');
  assert.equal(file.data, '0123456789abcdef', 'the bytes as uploaded');
  const part = await s.call('GET', img.data.url, undefined, undefined, { headers: { Range: 'bytes=10-' } });
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('content-range'), 'bytes 10-15/16');
  assert.equal((await s.call('GET', '/api/media/m_nope')).status, 404);

  const put = (id: string, body: object) => s.call('PUT', `/api/admin/announcements/${id}`, { title: 'تخفیف پاییزه', body: 'متن', active: true, ...body }, admin.token);
  assert.equal((await put('an1', { button: { label: 'خرید', url: 'javascript:alert(1)' } })).data.field, 'buttonUrl');
  assert.equal((await put('an1', { endsAt: '2024-01-01', startsAt: '2024-02-01' })).data.field, 'endsAt');
  const a = await put('an1', { mediaId: img.data.id, button: { label: 'خرید', url: '/billing' }, placement: 'site', audience: 'everyone' });
  assert.equal(a.status, 200, JSON.stringify(a.data));
  assert.equal(a.data.media.url, img.data.url);
  assert.equal(a.data.version, 1);
  await put('an2', { title: 'فقط کاربران', placement: 'app', audience: 'users' });
  await put('an3', { title: 'تمام‌شده', endsAt: '2020-01-01' });
  await put('an4', { title: 'خاموش', active: false });

  const visible = async (placement: string, token?: string) => (await s.call('GET', `/api/announcements?placement=${placement}`, undefined, token)).data.map((x: any) => x.id);
  assert.deepEqual(await visible('site'), ['an1']);
  assert.deepEqual(await visible('app'), [], 'visitors never see users-only messages');
  assert.deepEqual(await visible('app', user.token), ['an2']);

  await s.call('POST', '/api/announcements/an1/view', {});
  await s.call('POST', '/api/announcements/an1/view', {});
  const listed = await s.call('GET', '/api/admin/announcements', undefined, admin.token);
  assert.equal(listed.data.find((x: any) => x.id === 'an1').views, 1, 'one view per address');
  assert.equal((await s.call('GET', '/api/announcements?placement=site')).data[0].views, 0, 'visitors do not see the count');

  const again = await put('an1', { mediaId: img.data.id, showAgain: true });
  assert.equal(again.data.version, 2, 'shown once more to people who closed it');
  assert.equal(again.data.views, 1);

  assert.equal((await s.call('DELETE', '/api/admin/announcements/an1', undefined, admin.token)).status, 204);
  assert.ok(s.db().audit.some((e: any) => e.action === 'حذف اعلان'));
  assert.deepEqual(await visible('site'), []);
});
