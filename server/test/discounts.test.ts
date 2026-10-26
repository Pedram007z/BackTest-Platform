import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string };
let first: { token: string };
let refunded: { token: string };
let failed: { token: string };

const form = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
const check = (code: string, token?: string) => s.call('POST', '/api/payments/discount', { code, planId: 'pro-1m' }, token);
const checkout = (token: string, discountCode?: string, planId = 'pro-1m') => s.call('POST', '/api/payments/checkout', { planId, gateway: 'zarinpal', discountCode }, token);
/** checkout and finish the payment on the simulator */
async function buy(token: string, discountCode?: string) {
  const co = await checkout(token, discountCode);
  assert.equal(co.status, 200, JSON.stringify(co.data));
  await s.call('POST', `/api/payments/simulate/${co.data.paymentId}`, 'action=pay', undefined, form);
  return co.data.paymentId as string;
}

before(async () => {
  s = await startServer({ PAYMENT_SIMULATOR: 'true', OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  first = await s.signIn('09351234567', 'سارا');
  refunded = await s.signIn('09191112233', 'امیر');
  failed = await s.signIn('09213334455', 'نگار');
});
after(() => s.stop());

test('admins mark a code as first purchase only', async () => {
  const put = (id: string, body: object) => s.call('PUT', `/api/admin/discounts/${id}`, { id, percent: 20, maxUses: 100, used: 0, active: true, ...body }, admin.token);
  const a = await put('dc_w', { code: 'welcome20', firstPurchaseOnly: true });
  assert.equal(a.status, 200, JSON.stringify(a.data));
  assert.equal(a.data.firstPurchaseOnly, true);
  const b = await put('dc_m', { code: 'MEHR10', percent: 10 });
  assert.equal(b.data.firstPurchaseOnly, undefined, 'off unless asked for');
  assert.ok(s.db().audit.some((e: any) => e.target === 'WELCOME20 (فقط اولین خرید)'));
  const list = await s.call('GET', '/api/admin/discounts', undefined, admin.token);
  assert.equal(list.data.find((d: any) => d.code === 'WELCOME20').firstPurchaseOnly, true);
});

test('a customer who has never bought gets the discount, once', async () => {
  assert.deepEqual((await check('welcome20', first.token)).data, { percent: 20, finalToman: 552_000 });
  const paid = await buy(first.token, 'WELCOME20');
  assert.equal((await s.call('GET', `/api/payments/${paid}`, undefined, first.token)).data.status, 'paid');
  assert.equal(s.db().discounts.find((d: any) => d.code === 'WELCOME20')!.used, 1);

  // now a returning customer: refused when the code is applied and at checkout
  const again = await check('WELCOME20', first.token);
  assert.equal(again.status, 400);
  assert.equal(again.data.code, 'first_purchase');
  assert.equal(again.data.field, 'discount');
  assert.equal(again.data.message, 'این کد تخفیف فقط برای اولین خرید است.');
  assert.equal((await checkout(first.token, 'WELCOME20')).data.code, 'first_purchase');
  // other codes still work for them
  assert.equal((await check('MEHR10', first.token)).data.percent, 10);
});

test('visitors can check the code; the purchase itself is checked at checkout', async () => {
  assert.equal((await check('WELCOME20')).data.percent, 20);
  // an ended session is treated as a visitor, not an error
  assert.equal((await check('WELCOME20', 'not-a-session')).data.percent, 20);
});

test('a refunded purchase counts as a purchase; failed and unpaid ones do not', async () => {
  const p = await buy(refunded.token);
  assert.equal((await s.call('POST', `/api/admin/payments/${p}/refund`, {}, admin.token)).data.status, 'refunded');
  assert.equal((await check('WELCOME20', refunded.token)).data.code, 'first_purchase');

  const co = await checkout(failed.token);
  await s.call('POST', `/api/payments/simulate/${co.data.paymentId}`, 'action=cancel', undefined, form);
  await checkout(failed.token); // left pending
  assert.equal((await check('WELCOME20', failed.token)).data.percent, 20);
  assert.equal((await checkout(failed.token, 'WELCOME20')).data.amountToman, 552_000);
});
