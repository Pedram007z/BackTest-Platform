import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

/**
 * Admin passwords, stored as "scrypt:N:r:p:salt:hash" (base64url): a slow salted hash, and no
 * characters that .env files treat specially, so a hash can go in ADMIN_PASSWORD_HASH as it is.
 */

const N = 16_384;
const R = 8;
const P = 1;
const KEY_BYTES = 32;

const scrypt = (password: string, salt: Buffer, n: number, r: number, p: number) =>
  new Promise<Buffer>((resolve, reject) => scryptCallback(password, salt, KEY_BYTES, { N: n, r, p, maxmem: 128 * n * r * 2 }, (e, key) => (e ? reject(e) : resolve(key))));

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return `scrypt:${N}:${R}:${P}:${salt.toString('base64url')}:${key.toString('base64url')}`;
}

export const isPasswordHash = (v: string) => /^scrypt:\d{4,7}:\d{1,2}:\d{1,2}:[\w-]{16,}:[\w-]{40,}$/.test(v);

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  if (!isPasswordHash(stored)) return false;
  const [, n, r, p, salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'base64url');
  const key = await scrypt(password, Buffer.from(salt, 'base64url'), Number(n), Number(r), Number(p)).catch(() => null);
  return !!key && key.length === expected.length && timingSafeEqual(key, expected);
}

/** Admin usernames: 3–32 of a-z, 0-9 and _ . - (case does not matter). */
export const USERNAME = /^[a-z0-9_.-]{3,32}$/;
export const passwordError = (password: string) => (password.length < 8 ? 'رمز عبور دست‌کم ۸ حرف باشد.' : password.length > 128 ? 'رمز عبور حداکثر ۱۲۸ حرف است.' : null);

/** `node server.mjs hash-password`: reads a password from standard input and prints its hash. */
export async function runHashPassword(): Promise<number> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const password = Buffer.concat(chunks)
    .toString('utf8')
    .replace(/\r?\n$/, '');
  const err = passwordError(password);
  if (err) {
    console.error(password.length < 8 ? 'The password must be at least 8 characters.' : 'The password must be at most 128 characters.');
    return 1;
  }
  console.log(await hashPassword(password));
  return 0;
}
