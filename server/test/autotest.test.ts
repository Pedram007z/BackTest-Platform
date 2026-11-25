import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';
import { hasAutoTest } from '../../src/services/plan';

/** The automatic strategy testing add-on: sold with a plan or alone, priced per plan, extended when paid. */

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let buyer: { token: string; user: { id: string } };
let free: { token: string; user: { id: string } };

const form = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
const checkout = (token: string, body: object) => s.call('POST', '/api/payments/checkout', { planId: 'pro-12m', gateway: 'zarinpal', ...body }, token);
const user = (id: string) => s.db().users.find((u: any) => u.id === id)!;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (k: string, n: number) => new Date(Date.parse(`${k}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

before(async () => {
  s = await startServer({ PAYMENT_SIMULATOR: 'true', OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  buyer = await s.signIn('09351234567', 'سارا');
  free = await s.signIn('09191112233', 'امیر');
});
after(() => s.stop());

test('the paid plans offer the add-on at their own price', async () => {
  const plans = (await s.call('GET', '/api/plans')).data as { id: string; autoTestToman?: number }[];
  assert.equal(plans.find((p) => p.id === 'pro-12m')?.autoTestToman, 2_490_000);
  assert.equal(plans.find((p) => p.id === 'pro-1m')?.autoTestToman, 290_000);
  assert.equal(plans.find((p) => p.id === 'free')?.autoTestToman, undefined);
});

test('plan + add-on: one payment, both extended; a discount applies to the whole order', async () => {
  const put = await s.call('PUT', '/api/admin/discounts/dc_bf', { id: 'dc_bf', code: 'BLACKFRIDAY', percent: 40, maxUses: 100, used: 0, active: true }, admin.token);
  assert.equal(put.status, 200, JSON.stringify(put.data));
  const check = await s.call('POST', '/api/payments/discount', { code: 'BLACKFRIDAY', planId: 'pro-12m', autoTest: true }, buyer.token);
  assert.deepEqual(check.data, { percent: 40, finalToman: Math.round(((5_900_000 + 2_490_000) * 60) / 100) });

  const co = await checkout(buyer.token, { autoTest: true, discountCode: 'BLACKFRIDAY' });
  assert.equal(co.status, 200, JSON.stringify(co.data));
  assert.equal(co.data.amountToman, 5_034_000);
  const p = s.db().payments.find((x: any) => x.id === co.data.paymentId)!;
  assert.equal(p.kind, 'plan_autotest');
  assert.equal(p.planName, 'حرفه‌ای سالانه + تست خودکار استراتژی');

  const before = user(buyer.user.id).planEndsAt;
  await s.call('POST', `/api/payments/simulate/${co.data.paymentId}`, 'action=pay', undefined, form);
  const u = user(buyer.user.id);
  assert.equal(u.autoTestEndsAt, addDays(today(), 365));
  assert.ok(u.planEndsAt > before);
  assert.ok(hasAutoTest(u, today()));
  const me = await s.call('GET', '/api/me', undefined, buyer.token);
  assert.equal(me.data.autoTestEndsAt, u.autoTestEndsAt);
});

test('the add-on alone extends only the add-on, and needs a running paid plan', async () => {
  const planEnd = user(buyer.user.id).planEndsAt;
  const addonEnd = user(buyer.user.id).autoTestEndsAt!;
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zarinpal', addonOnly: true }, buyer.token);
  assert.equal(co.status, 200, JSON.stringify(co.data));
  assert.equal(co.data.amountToman, 290_000);
  await s.call('POST', `/api/payments/simulate/${co.data.paymentId}`, 'action=pay', undefined, form);
  assert.equal(user(buyer.user.id).planEndsAt, planEnd, 'the plan is untouched');
  assert.equal(user(buyer.user.id).autoTestEndsAt, addDays(addonEnd, 30), 'added on top of the running add-on');

  user(free.user.id).planId = 'free';
  const refused = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zarinpal', addonOnly: true }, free.token);
  assert.equal(refused.status, 400);
  assert.equal(refused.data.code, 'needs_plan');
  assert.ok(!hasAutoTest(user(free.user.id), today()));
});

test('a plan without the add-on refuses it; admins price it and switch it per user', async () => {
  const plan = (await s.call('GET', '/api/admin/plans', undefined, admin.token)).data.find((p: any) => p.id === 'pro-3m');
  const saved = await s.call('PUT', '/api/admin/plans/pro-3m', { ...plan, autoTestToman: 0 }, admin.token);
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  const refused = await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'zarinpal', autoTest: true }, buyer.token);
  assert.equal(refused.data.code, 'no_addon');
  // a plan alone still works
  assert.equal((await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'zarinpal' }, buyer.token)).status, 200);

  const end = addDays(today(), 10);
  const set = await s.call('PUT', `/api/admin/users/${free.user.id}`, { autoTestEndsAt: end }, admin.token);
  assert.equal(set.data.autoTestEndsAt, end);
  assert.ok(s.db().audit.some((e: any) => e.action === 'تغییر افزونه‌ی تست خودکار'));
  const off = await s.call('PUT', `/api/admin/users/${free.user.id}`, { autoTestEndsAt: '' }, admin.token);
  assert.equal(off.data.autoTestEndsAt, undefined);
  assert.equal((await s.call('PUT', `/api/admin/users/${free.user.id}`, { autoTestEndsAt: 'tomorrow' }, admin.token)).status, 400);
});
