import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { startServer } from './harness';

let s: Awaited<ReturnType<typeof startServer>>;
let pw: typeof import('../src/password');
let auth: typeof import('../src/auth');
let cfg: typeof import('../src/config');

const KEY = 'k3y-For-The-Admin-Page_0123456789';
const login = (username: string, password: string, key = KEY) => s.call('POST', '/api/auth/admin-login', { key, username, password });

before(async () => {
  pw = await import('../src/password');
  const hash = await pw.hashPassword('first-password');
  s = await startServer({ ADMIN_USERNAME: 'Boss', ADMIN_PASSWORD_HASH: hash, ADMIN_LOGIN_KEY: KEY, OTP_DEV_ECHO: 'true' });
  auth = await import('../src/auth');
  cfg = await import('../src/config');
});
after(() => s.stop());

test('password hashes: slow salted scrypt, safe to put in .env', async () => {
  const a = await pw.hashPassword('correct horse');
  const b = await pw.hashPassword('correct horse');
  assert.notEqual(a, b, 'salted');
  assert.ok(pw.isPasswordHash(a));
  assert.match(a, /^scrypt:16384:8:1:[\w-]+:[\w-]+$/, 'no $ or other characters .env files expand');
  assert.equal(await pw.checkPassword('correct horse', a), true);
  assert.equal(await pw.checkPassword('correct horsE', a), false);
  assert.equal(await pw.checkPassword('correct horse', 'nonsense'), false);
});

test('the admin from .env signs in with username and password', async () => {
  const r = await login('BOSS', 'first-password');
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.user.role, 'admin');
  assert.equal(r.data.user.phone, '', 'no phone needed');
  assert.ok(!JSON.stringify(r.data).includes('scrypt:'), 'the hash never leaves the server');
  const stats = await s.call('GET', '/api/admin/stats', undefined, r.data.token);
  assert.equal(stats.status, 200);
  const users = await s.call('GET', '/api/admin/users', undefined, r.data.token);
  assert.ok(!JSON.stringify(users.data).includes('scrypt:'));

  const wrong = await login('boss', 'not-the-password');
  assert.equal(wrong.status, 400);
  assert.equal(wrong.data.code, 'bad_login');
  const unknown = await login('nobody', 'first-password');
  assert.equal(unknown.data.message, wrong.data.message, 'same answer for an unknown username');
  assert.equal((await login('', '')).status, 400);
});

test('admins set and change their own username and password', async () => {
  const phoneAdmin = await s.signIn('09120000001', 'مدیر موبایلی');
  assert.equal(phoneAdmin.user.role, 'admin');
  const t = phoneAdmin.token;
  assert.deepEqual((await s.call('GET', '/api/admin/credentials', undefined, t)).data, { username: null, loginPath: `/k/${KEY}`, keyFromEnv: true });
  assert.equal((await s.call('PUT', '/api/admin/credentials', { username: 'ab', password: 'long-enough-1' }, t)).data.field, 'username');
  assert.equal((await s.call('PUT', '/api/admin/credentials', { username: 'mobile', password: 'short' }, t)).data.field, 'password');
  assert.equal((await s.call('PUT', '/api/admin/credentials', { username: 'boss', password: 'long-enough-1' }, t)).data.code, 'taken');
  const set = await s.call('PUT', '/api/admin/credentials', { username: 'Mobile', password: 'long-enough-1' }, t);
  assert.deepEqual(set.data, { username: 'mobile' });
  assert.equal((await s.call('GET', '/api/admin/credentials', undefined, t)).data.username, 'mobile');
  assert.equal((await login('mobile', 'long-enough-1')).status, 200);

  const noCurrent = await s.call('PUT', '/api/admin/credentials', { username: 'mobile', password: 'another-pass-2' }, t);
  assert.equal(noCurrent.data.field, 'currentPassword', 'changing needs the current password');
  const changed = await s.call('PUT', '/api/admin/credentials', { username: 'mobile', password: 'another-pass-2', currentPassword: 'long-enough-1' }, t);
  assert.equal(changed.status, 200);
  assert.equal((await login('mobile', 'long-enough-1')).status, 400);
  assert.equal((await login('mobile', 'another-pass-2')).status, 200);

  assert.equal((await s.call('DELETE', '/api/admin/credentials', undefined, t)).status, 204);
  assert.equal((await login('mobile', 'another-pass-2')).status, 400, 'removed: phone sign-in only');

  const user = await s.signIn('09351234567', 'کاربر عادی');
  assert.equal((await s.call('PUT', '/api/admin/credentials', { username: 'me', password: 'long-enough-1' }, user.token)).status, 403);
});

test('the admin sign-in page and API answer only with the secret key, like an address that does not exist', async () => {
  const unknown = await s.call('POST', '/api/no-such-route', {});
  assert.equal(unknown.status, 404);
  for (const key of [undefined, '', 'wrong-key-0123456789', KEY.slice(0, -1), KEY.toLowerCase()]) {
    const gate = await s.call('POST', '/api/auth/admin-gate', { key }, undefined, { headers: { 'X-Forwarded-For': '10.9.9.9' } });
    assert.equal(gate.status, 404, `gate ${key}`);
    assert.deepEqual(gate.data, unknown.data, 'same answer as a missing route');
  }
  // the right password without the key reveals nothing either
  const noKey = await login('boss', 'first-password', 'nope-nope-nope-nope');
  assert.equal(noKey.status, 404);
  assert.deepEqual(noKey.data, unknown.data);
  assert.equal((await s.call('POST', '/api/auth/admin-gate', { key: KEY })).status, 200);
  assert.equal((await login('boss', 'first-password')).status, 200);
  // the key is only ever given to admins
  const user = await s.signIn('09351112233', 'کاربر');
  assert.equal((await s.call('GET', '/api/admin/credentials', undefined, user.token)).status, 403);
  assert.ok(!JSON.stringify((await s.call('GET', '/api/config')).data).includes(KEY));
});

test('without ADMIN_LOGIN_KEY the server makes a random key and keeps it', async () => {
  cfg.config.adminLoginKey = '';
  auth.applyAdminGate();
  const made = s.db().adminGateKey as string;
  assert.match(made, /^[\w-]{32}$/);
  assert.equal((await login('boss', 'first-password', KEY)).status, 404, 'the old key stops working');
  assert.equal((await login('boss', 'first-password', made)).status, 200);
  auth.applyAdminGate();
  assert.equal(s.db().adminGateKey, made, 'kept across restarts');
  const boss = (await login('boss', 'first-password', made)).data.token;
  assert.deepEqual((await s.call('GET', '/api/admin/credentials', undefined, boss)).data.loginPath, `/k/${made}`);
  cfg.config.adminLoginKey = 'short';
  auth.applyAdminGate();
  assert.equal((await login('boss', 'first-password', made)).status, 200, 'an invalid .env value falls back to the saved key');
  cfg.config.adminLoginKey = KEY;
});

test('a password changed in the panel survives restarts until the .env value changes', async () => {
  const boss = (await login('boss', 'first-password')).data.token;
  await s.call('PUT', '/api/admin/credentials', { username: 'boss', password: 'changed-in-panel', currentPassword: 'first-password' }, boss);
  auth.applyAdminLoginFromEnv(); // as on the next start, same .env
  assert.equal((await login('boss', 'changed-in-panel')).status, 200);

  cfg.config.adminPasswordHash = await pw.hashPassword('reset-from-env');
  auth.applyAdminLoginFromEnv();
  assert.equal((await login('boss', 'reset-from-env')).status, 200, 'a new .env value resets it');
  cfg.config.adminUsername = 'chief';
  auth.applyAdminLoginFromEnv();
  assert.equal((await login('chief', 'reset-from-env')).status, 200, 'a new ADMIN_USERNAME renames the same account');
  assert.equal(s.db().users.filter((u: any) => u.name === 'مدیر سایت').length, 1);
});

test('a demoted admin cannot use the password; repeated failures are slowed down', async () => {
  const id = Object.entries(s.db().credentials as Record<string, { username: string }>).find(([, c]) => c.username === 'chief')![0];
  const u = s.db().users.find((x: any) => x.id === id)!;
  u.role = 'user';
  assert.equal((await login('chief', 'reset-from-env')).status, 400);
  u.role = 'admin';

  let last = 0;
  for (let i = 0; i < 12; i++) last = (await login('chief', `wrong-${i}`)).status;
  assert.equal(last, 429);
});

test('`server.mjs hash-password` prints a hash for .env', () => {
  const cwd = fileURLToPath(new URL('..', import.meta.url));
  const tsx = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url));
  const ok = spawnSync(tsx, ['src/index.ts', 'hash-password'], { cwd, input: 'a good password\n', encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(pw.isPasswordHash(ok.stdout.trim()));
  const short = spawnSync(tsx, ['src/index.ts', 'hash-password'], { cwd, input: 'short\n', encoding: 'utf8' });
  assert.equal(short.status, 1);
  assert.match(short.stderr, /at least 8/);
});
