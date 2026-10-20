import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';
import { onFreePlan } from '../../src/services/plan';
import type { WorkspacePatch } from '../../src/services/workspace';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string; user: any };

before(async () => {
  s = await startServer({ OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
});
after(() => s.stop());

const session = (id: string) =>
  ({
    id,
    name: `جلسه ${id}`,
    balance: 10_000,
    symbols: ['EURUSD'],
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    cursor: Date.parse('2024-01-01T00:00:00Z'),
    timeframe: '15m',
    activeSymbol: 'EURUSD',
    createdAt: 1,
    notes: '',
  }) as any;

let pidN = 0;
let rev = 0;
async function push(token: string, patch: WorkspacePatch) {
  const r = await s.call('POST', '/api/me/workspace', { baseRev: rev, pid: `pid_plan_${++pidN}`, patch }, token);
  if (r.status === 200) rev = r.data.rev;
  return r;
}
const setPlan = (userId: string, patch: Record<string, string>) => s.call('PUT', `/api/admin/users/${userId}`, patch, admin.token);
const news = (token: string) => s.call('GET', `/api/news?from=${Date.parse('2024-01-01')}&to=${Date.parse('2024-01-08')}`, undefined, token);

test('who counts as being on the free plan', () => {
  const today = '2026-10-20';
  assert.equal(onFreePlan({ planId: 'free', planEndsAt: '2036-01-01' }, today), true);
  assert.equal(onFreePlan({ planId: 'pro-1m', planEndsAt: '2026-10-19' }, today), true, 'a paid plan that has ended');
  assert.equal(onFreePlan({ planId: 'pro-1m', planEndsAt: '2026-10-20' }, today), false, 'the last day still counts');
  assert.equal(onFreePlan({ planId: 'free', role: 'admin' }, today), false);
  assert.equal(onFreePlan({ planId: 'free', demo: true }, today), false);
  assert.equal(onFreePlan({}, today), false, 'a plan not known yet');
});

test('the free plan has one session; an account that already had more keeps them', async () => {
  const u = await s.signIn('09351110001', 'کاربر رایگان');
  rev = 0;
  // on the trial: two sessions
  assert.equal((await push(u.token, { upsert: { sessions: [session('a'), session('b')] } })).status, 200);

  assert.equal((await setPlan(u.user.id, { planId: 'free' })).status, 200);
  // the two it had can still change, but no third one is added
  assert.equal((await push(u.token, { upsert: { sessions: [{ ...session('a'), name: 'تغییر' }] } })).status, 200);
  const third = await push(u.token, { upsert: { sessions: [session('c')] } });
  assert.equal(third.status, 403);
  assert.equal(third.data.error?.code ?? third.data.code, 'plan_limit');

  // down to one, still no second
  assert.equal((await push(u.token, { remove: { sessions: ['b'] } })).status, 200);
  assert.equal((await push(u.token, { upsert: { sessions: [session('d')] } })).status, 403);
  // replacing the one session is fine
  assert.equal((await push(u.token, { remove: { sessions: ['a'] }, upsert: { sessions: [session('e')] } })).status, 200);
  const ws = await s.call('GET', '/api/me/workspace', undefined, u.token);
  assert.deepEqual(
    ws.data.data.sessions.map((x: any) => x.id),
    ['e'],
  );
});

test('a paid plan has no session limit', async () => {
  const u = await s.signIn('09351110002', 'کاربر حرفه‌ای');
  rev = 0;
  assert.equal((await setPlan(u.user.id, { planId: 'pro-3m', planEndsAt: '2099-01-01' })).status, 200);
  assert.equal((await push(u.token, { upsert: { sessions: [session('a'), session('b'), session('c')] } })).status, 200);
});

test('the economic calendar is locked on the free plan and after a plan ends', async () => {
  const u = await s.signIn('09351110003', 'کاربر تقویم');
  assert.notEqual((await news(u.token)).status, 403, 'open on the trial');

  assert.equal((await setPlan(u.user.id, { planId: 'free' })).status, 200);
  const locked = await news(u.token);
  assert.equal(locked.status, 403);
  assert.equal(locked.data.error?.code ?? locked.data.code, 'plan_locked');

  assert.equal((await setPlan(u.user.id, { planId: 'pro-1m', planEndsAt: '2024-01-01' })).status, 200);
  assert.equal((await news(u.token)).status, 403, 'an ended plan counts as free');

  assert.notEqual((await news(admin.token)).status, 403, 'admins are never limited');
});
