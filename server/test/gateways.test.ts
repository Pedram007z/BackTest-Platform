import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let admin: { token: string; user: any };
let user: { token: string; user: any };

before(async () => {
  s = await startServer({ PAYMENT_SIMULATOR: 'false', OTP_DEV_ECHO: 'true' });
  admin = await s.signIn('09120000001', 'مدیر');
  user = await s.signIn('09127654321', 'خریدار');
});
after(() => s.stop());

const form = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
const payment = (id: string) => s.db().payments.find((p) => p.id === id)!;

test('Zarinpal: request, return from the bank, server-side verify', async () => {
  await s.call('PUT', '/api/admin/gateways/zarinpal', { enabled: true, sandbox: true, merchantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', priority: 1 }, admin.token);
  s.setUpstream((url) => {
    if (url.endsWith('/pg/v4/payment/request.json')) return s.json({ data: { code: 100, message: 'Success', authority: 'A0000000000000000000000000000wwOGYpd' }, errors: [] });
    if (url.endsWith('/pg/v4/payment/verify.json')) return s.json({ data: { code: 100, ref_id: 201, card_pan: '502229******5995' }, errors: [] });
    throw new Error(url);
  });
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zarinpal' }, user.token);
  assert.equal(co.status, 200);
  assert.equal(co.data.redirectUrl, 'https://sandbox.zarinpal.com/pg/StartPay/A0000000000000000000000000000wwOGYpd');
  const req = JSON.parse(s.calls.at(-1)!.body!);
  assert.equal(req.amount, 6_900_000, 'amounts go to the bank in rial');
  assert.equal(req.merchant_id, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  assert.equal(req.callback_url, `https://api.test/api/payments/callback/zarinpal?pid=${co.data.paymentId}`);

  // a forged return with another authority changes nothing
  const forged = await s.call('GET', `/api/payments/callback/zarinpal?pid=${co.data.paymentId}&Authority=OTHER&Status=OK`);
  assert.equal(forged.status, 302);
  assert.equal(payment(co.data.paymentId).status, 'pending');

  const back = await s.call('GET', `/api/payments/callback/zarinpal?pid=${co.data.paymentId}&Authority=A0000000000000000000000000000wwOGYpd&Status=OK`);
  assert.equal(back.status, 302);
  assert.equal(back.headers.get('location'), `https://app.test/billing?payment=${co.data.paymentId}`);
  const verify = JSON.parse(s.calls.at(-1)!.body!);
  assert.deepEqual(verify, { merchant_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', amount: 6_900_000, authority: 'A0000000000000000000000000000wwOGYpd' });
  const p = payment(co.data.paymentId);
  assert.equal(p.status, 'paid');
  assert.equal(p.refId, '201');
  assert.equal(p.cardPan, '502229******5995');
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).data.planId, 'pro-1m');

  // the bank calling back twice does not verify or extend twice
  const n = s.calls.length;
  const endsAt = (await s.call('GET', '/api/me', undefined, user.token)).data.planEndsAt;
  await s.call('GET', `/api/payments/callback/zarinpal?pid=${co.data.paymentId}&Authority=A0000000000000000000000000000wwOGYpd&Status=OK`);
  assert.equal(s.calls.length, n);
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).data.planEndsAt, endsAt);
});

test('Zarinpal: cancelled at the bank', async () => {
  s.setUpstream(() => s.json({ data: { code: 100, authority: 'A-cancel' }, errors: [] }));
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zarinpal' }, user.token);
  const n = s.calls.length;
  await s.call('GET', `/api/payments/callback/zarinpal?pid=${co.data.paymentId}&Authority=A-cancel&Status=NOK`);
  assert.equal(s.calls.length, n, 'no verify call for a cancelled payment');
  assert.equal(payment(co.data.paymentId).status, 'failed');
});

test('Zibal: a verified amount that differs from the order is rejected', async () => {
  s.setUpstream((url) => {
    if (url.endsWith('/v1/request')) return s.json({ result: 100, trackId: 3714061657, message: 'success' });
    if (url.endsWith('/v1/verify')) return s.json({ result: 100, amount: 10_000, refNumber: 9, cardNumber: '62741****44' });
    throw new Error(url);
  });
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'zibal' }, user.token);
  assert.equal(co.data.redirectUrl, 'https://gateway.zibal.ir/start/3714061657');
  assert.equal(JSON.parse(s.calls.at(-1)!.body!).merchant, 'zibal', 'sandbox uses the public test merchant');
  await s.call('GET', `/api/payments/callback/zibal?pid=${co.data.paymentId}&success=1&trackId=3714061657&orderId=${co.data.paymentId}&status=2`);
  const p = payment(co.data.paymentId);
  assert.equal(p.status, 'failed');
  assert.match(p.gatewayMessage!, /برابر نیست/);
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).data.planId, 'pro-1m');
});

test('IDPay: form POST callback, sandbox header', async () => {
  await s.call('PUT', '/api/admin/gateways/idpay', { enabled: true, sandbox: true, merchantId: 'idpay-key', priority: 3 }, admin.token);
  s.setUpstream((url, init) => {
    assert.equal(new Headers(init?.headers).get('X-SANDBOX'), '1');
    if (url.endsWith('/v1.1/payment')) return s.json({ id: 'd2e353189823079e1e4181772cff5292', link: 'https://idpay.ir/p/ws-sandbox/d2e353189823079e1e4181772cff5292' }, 201);
    if (url.endsWith('/v1.1/payment/verify')) return s.json({ status: 100, track_id: '10012', amount: 17_900_000, payment: { card_no: '123456******1234', track_id: '888001' } });
    throw new Error(url);
  });
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-3m', gateway: 'idpay' }, user.token);
  assert.match(co.data.redirectUrl, /^https:\/\/idpay\.ir\/p\/ws-sandbox\//);
  const back = await s.call(
    'POST',
    '/api/payments/callback/idpay',
    `status=10&track_id=10012&id=d2e353189823079e1e4181772cff5292&order_id=${co.data.paymentId}&amount=17900000`,
    undefined,
    form,
  );
  assert.equal(back.status, 302);
  assert.equal(payment(co.data.paymentId).status, 'paid');
  assert.equal((await s.call('GET', '/api/me', undefined, user.token)).data.planId, 'pro-3m');
});

test('gateway errors reach the user; admin connection test', async () => {
  s.setUpstream(() => s.json({ data: [], errors: { code: -9, message: 'The input params invalid, validation error.', validations: [] } }));
  const before = s.db().payments.length;
  const co = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zarinpal' }, user.token);
  assert.equal(co.status, 502);
  assert.equal(co.data.code, 'gateway');
  assert.match(co.data.message, /validation error/);
  assert.equal(s.db().payments.length, before, 'nothing is recorded for a refused request');

  s.setUpstream(() => {
    throw new TypeError('fetch failed');
  });
  const down = await s.call('POST', '/api/payments/checkout', { planId: 'pro-1m', gateway: 'zibal' }, user.token);
  assert.equal(down.status, 502);

  s.setUpstream(() => s.json({ data: { code: 100, authority: 'A-test' }, errors: [] }));
  const ok = await s.call('POST', '/api/admin/gateways/zarinpal/test', {}, admin.token);
  assert.equal(ok.data.ok, true);
  assert.match(ok.data.message, /A-test/);
  await s.call('PUT', '/api/admin/gateways/nextpay', { enabled: false, sandbox: false, merchantId: '', priority: 4 }, admin.token);
  const missing = await s.call('POST', '/api/admin/gateways/nextpay/test', {}, admin.token);
  assert.equal(missing.data.ok, false);
  assert.match(missing.data.message, /شناسه‌ی پذیرنده/);
});
