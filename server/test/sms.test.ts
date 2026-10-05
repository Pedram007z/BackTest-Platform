import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { PROVIDERS, SmsError } from '../src/sms/providers';
import type { SmsProviderConfig } from '../src/shared';

const realFetch = globalThis.fetch;
let sent: { url: string; headers: Headers; body: string }[] = [];
function reply(data: unknown) {
  sent = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    sent.push({ url: String(url), headers: new Headers(init?.headers), body: String(init?.body ?? '') });
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}
afterEach(() => (globalThis.fetch = realFetch));

const cfg = (p: Partial<SmsProviderConfig>): SmsProviderConfig => ({ id: 'kavenegar', name: '', apiKey: 'KEY', sender: '3000505', otpTemplate: '', ...p });

test('SMS.ir verify template with a custom parameter name', async () => {
  reply({ status: 1, message: 'موفق' });
  await PROVIDERS.smsir.sendOtp(cfg({ id: 'smsir', otpTemplate: '123456:CODE' }), '09121234567', '48213', 'text');
  assert.equal(sent[0].url, 'https://api.sms.ir/v1/send/verify');
  assert.equal(sent[0].headers.get('x-api-key'), 'KEY');
  assert.deepEqual(JSON.parse(sent[0].body), { mobile: '09121234567', templateId: 123456, parameters: [{ name: 'CODE', value: '48213' }] });
  reply({ status: 0, message: 'کلید نامعتبر' });
  await assert.rejects(PROVIDERS.smsir.sendText(cfg({ id: 'smsir' }), ['09121234567'], 'x'), (e: Error) => e instanceof SmsError && /کلید نامعتبر/.test(e.message));
});

test('Melipayamak: REST with username/password, console API with a key', async () => {
  reply({ Value: '5326438727383049', RetStatus: 1, StrRetStatus: 'Ok' });
  await PROVIDERS.melipayamak.sendOtp(cfg({ id: 'melipayamak', otpTemplate: '98765', username: 'u', password: 'p' }), '09121234567', '48213', 'text');
  assert.equal(sent[0].url, 'https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber');
  assert.deepEqual(Object.fromEntries(new URLSearchParams(sent[0].body)), { username: 'u', password: 'p', to: '09121234567', bodyId: '98765', text: '48213' });

  reply({ recId: 3741437414, status: 'ارسال موفق بود' });
  await PROVIDERS.melipayamak.sendOtp(cfg({ id: 'melipayamak', otpTemplate: '98765' }), '09121234567', '48213', 'text');
  assert.equal(sent[0].url, 'https://console.melipayamak.com/api/send/shared/KEY');
  assert.deepEqual(JSON.parse(sent[0].body), { bodyId: 98765, to: '09121234567', args: ['48213'] });
});

test('Ghasedak OTP template', async () => {
  reply({ isSuccess: true, statusCode: 200, message: 'ok' });
  await PROVIDERS.ghasedak.sendOtp(cfg({ id: 'ghasedak', otpTemplate: 'backtestOtp' }), '09121234567', '48213', 'text');
  assert.equal(sent[0].url, 'https://gateway.ghasedak.me/rest/api/v1/WebService/SendOtpSMS');
  assert.equal(sent[0].headers.get('ApiKey'), 'KEY');
  const body = JSON.parse(sent[0].body);
  assert.equal(body.templateName, 'backtestOtp');
  assert.deepEqual(body.inputs, [{ param: 'Code', value: '48213' }]);
  assert.equal(body.receptors[0].mobile, '09121234567');
});

test('IPPanel / FarazSMS pattern and plain message', async () => {
  reply({ status: 'OK', code: 200, data: { message_id: 1 } });
  await PROVIDERS.farazsms.sendOtp(cfg({ id: 'farazsms', otpTemplate: 'abc123xyz' }), '09121234567', '48213', 'text');
  assert.equal(sent[0].url, 'https://api2.ippanel.com/api/v1/sms/pattern/normal/send');
  assert.deepEqual(JSON.parse(sent[0].body), { code: 'abc123xyz', sender: '3000505', recipient: '+989121234567', variable: { code: '48213' } });
  reply({ status: 'OK', code: 200 });
  await PROVIDERS.farazsms.sendText(cfg({ id: 'farazsms' }), ['09121234567', '09351234567'], 'سلام');
  assert.deepEqual(JSON.parse(sent[0].body).recipient, ['+989121234567', '+989351234567']);
});

test('no template: the code goes out as a normal message; missing keys are explained', async () => {
  reply({ return: { status: 200 } });
  await PROVIDERS.kavenegar.sendOtp(cfg({}), '09121234567', '48213', 'کد ورود: 48213');
  assert.match(sent[0].url, /\/sms\/send\.json$/);
  assert.equal(new URLSearchParams(sent[0].body).get('message'), 'کد ورود: 48213');
  await assert.rejects(PROVIDERS.kavenegar.sendText(cfg({ apiKey: '' }), ['09121234567'], 'x'), /کلید API/);
});
