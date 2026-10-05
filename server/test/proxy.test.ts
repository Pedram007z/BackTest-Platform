import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;

before(async () => {
  s = await startServer({ TRUST_PROXY: 'true', OTP_DEV_ECHO: 'true' });
});
after(() => s.stop());

const otp = (phone: string, headers: Record<string, string>) => s.call('POST', '/api/auth/otp', { phone }, undefined, { headers });

test('behind a proxy, a forged X-Forwarded-For does not get around the rate limit', async () => {
  // nginx sets X-Real-IP; the visitor varies the leftmost X-Forwarded-For entry
  for (let i = 0; i < 10; i++) {
    const r = await otp(`0912000${String(i).padStart(4, '0')}`, { 'X-Real-IP': '5.6.7.8', 'X-Forwarded-For': `10.0.0.${i}, 5.6.7.8` });
    assert.equal(r.status, 200, `request ${i + 1}`);
  }
  const blocked = await otp('09120009999', { 'X-Real-IP': '5.6.7.8', 'X-Forwarded-For': '10.0.0.99, 5.6.7.8' });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.data.code, 'rate_limited');
});

test('without X-Real-IP the address the proxy appended is used', async () => {
  for (let i = 0; i < 10; i++) {
    const r = await otp(`0935000${String(i).padStart(4, '0')}`, { 'X-Forwarded-For': `192.168.1.${i}, 9.9.9.9` });
    assert.equal(r.status, 200, `request ${i + 1}`);
  }
  assert.equal((await otp('09350009999', { 'X-Forwarded-For': '192.168.1.99, 9.9.9.9' })).status, 429);
  // another visitor is not affected
  assert.equal((await otp('09350008888', { 'X-Forwarded-For': '9.9.9.10' })).status, 200);
});
