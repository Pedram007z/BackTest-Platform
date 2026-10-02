import { faDigits, toLatinDigits } from './format';
import { local, readJson, session as sessionStore, writeJson } from './storage';

/**
 * Client-side accounts for the standalone app (there is no server).
 *
 * Passwords are never stored: each account keeps a random salt and a PBKDF2-SHA-256 hash.
 * Sessions live in localStorage when "remember me" is on (30 days), otherwise in sessionStorage
 * so they end when the browser tab closes. Replace this module with calls to your API to use a
 * real backend; the page components only use the exported functions.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  createdAt: number;
  demo?: boolean;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  demo: boolean;
  issuedAt: number;
  /** null = ends with the browser session */
  expiresAt: number | null;
}

export type AuthErrorCode = 'invalid' | 'exists' | 'locked' | 'no_user' | 'bad_code' | 'expired_code' | 'weak' | 'bad_input';

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public field?: 'email' | 'password' | 'code' | 'name',
  ) {
    super(message);
  }
}

const USERS_KEY = 'backtest-auth:users';
export const SESSION_KEY = 'backtest-auth:session';
const ATTEMPTS_KEY = 'backtest-auth:attempts';
const RESET_KEY = 'backtest-auth:reset';

const ITERATIONS = 120_000;
const REMEMBER_MS = 30 * 86_400_000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const RESET_TTL_MS = 10 * 60_000;
const MAX_RESET_TRIES = 5;

export const DEMO_ACCOUNT = { id: 'demo', email: 'demo@backtestlab.ir', password: 'Demo1234', name: 'آرش کریمی' };

// ---------- validation ----------
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;
const PERSIAN_RE = /[؀-ۿﭐ-﷿ﹰ-﻿]/;

export const normalizeEmail = (email: string) => toLatinDigits(email).trim().toLowerCase();
export const hasPersianLetters = (s: string) => PERSIAN_RE.test(toLatinDigits(s));

export function emailError(raw: string): string {
  const email = normalizeEmail(raw);
  if (!email) return 'ایمیل را بنویسید.';
  if (hasPersianLetters(email)) return 'ایمیل را با حروف انگلیسی بنویسید؛ صفحه‌کلید روی فارسی است.';
  if (!EMAIL_RE.test(email)) return 'این ایمیل درست نیست. نمونه: name@example.com';
  return '';
}

export function newPasswordError(pw: string): string {
  if (!pw) return 'رمز عبور را بنویسید.';
  if (hasPersianLetters(pw)) return 'رمز عبور را با صفحه‌کلید انگلیسی بنویسید.';
  if (pw.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return 'رمز عبور باید هم حرف انگلیسی و هم عدد داشته باشد.';
  return '';
}

export function nameError(name: string): string {
  const n = name.trim();
  if (!n) return 'نام خود را بنویسید.';
  if (n.length < 2) return 'نام باید حداقل ۲ حرف باشد.';
  return '';
}

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[a-z]/i.test(pw)) score++;
  if (/[^a-z0-9]/i.test(pw) || pw.length >= 12) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  const labels = ['خیلی ضعیف', 'ضعیف', 'متوسط', 'خوب', 'قوی'];
  return { score: score as Strength['score'], label: labels[score] };
}

// ---------- crypto ----------
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(out);
  else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

async function derive(password: string, saltB64: string, iterations: number): Promise<string> {
  const data = new TextEncoder().encode(password.normalize('NFC'));
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const key = await subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', salt: fromB64(saltB64), iterations, hash: 'SHA-256' }, key, 256);
    return toB64(new Uint8Array(bits));
  }
  // Insecure contexts (plain http) have no SubtleCrypto: fall back to an iterated FNV-1a mix.
  const salt = fromB64(saltB64);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const bytes = [...salt, ...data];
  for (let r = 0; r < 2000; r++) {
    for (const b of bytes) {
      h1 = Math.imul(h1 ^ b, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ (b + r), 2246822519) >>> 0;
    }
  }
  return `fnv:${h1.toString(16)}${h2.toString(16)}`;
}

/** Compare without stopping at the first different character. */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// ---------- users ----------
const loadUsers = () => readJson<AuthUser[]>(local, USERS_KEY, []);
const saveUsers = (users: AuthUser[]) => writeJson(local, USERS_KEY, users);
const findUser = (email: string) => loadUsers().find((u) => u.email === normalizeEmail(email));

async function makeUser(name: string, email: string, password: string, extra: Partial<AuthUser> = {}): Promise<AuthUser> {
  const salt = toB64(randomBytes(16));
  return {
    id: `u_${toB64(randomBytes(9)).replace(/[^a-z0-9]/gi, '').slice(0, 12)}`,
    name: name.trim(),
    email: normalizeEmail(email),
    salt,
    hash: await derive(password, salt, ITERATIONS),
    iterations: ITERATIONS,
    createdAt: Date.now(),
    ...extra,
  };
}

/** The sample account exists from the start so the dashboard can be explored right away. */
export async function ensureDemoUser(): Promise<AuthUser> {
  const existing = findUser(DEMO_ACCOUNT.email);
  if (existing) return existing;
  const demo = await makeUser(DEMO_ACCOUNT.name, DEMO_ACCOUNT.email, DEMO_ACCOUNT.password, { id: DEMO_ACCOUNT.id, demo: true });
  saveUsers([...loadUsers().filter((u) => u.email !== demo.email), demo]);
  return demo;
}

export async function signup(input: { name: string; email: string; password: string }): Promise<AuthUser> {
  const err = nameError(input.name) || emailError(input.email) || newPasswordError(input.password);
  if (err) throw new AuthError('bad_input', err);
  if (normalizeEmail(input.email) === DEMO_ACCOUNT.email || findUser(input.email)) {
    throw new AuthError('exists', 'حسابی با این ایمیل وجود دارد. وارد شوید یا ایمیل دیگری بنویسید.', 'email');
  }
  const user = await makeUser(input.name, input.email, input.password);
  saveUsers([...loadUsers(), user]);
  return user;
}

// ---------- failed-attempt lock ----------
type Attempts = Record<string, { count: number; lockedUntil: number }>;

/** Seconds left on a lock for this email, or 0. */
export function lockSecondsLeft(email: string): number {
  const rec = readJson<Attempts>(local, ATTEMPTS_KEY, {})[normalizeEmail(email)];
  if (!rec || rec.lockedUntil <= Date.now()) return 0;
  return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
}

function recordFailure(email: string): number {
  const all = readJson<Attempts>(local, ATTEMPTS_KEY, {});
  const key = normalizeEmail(email);
  const rec = all[key] && all[key].lockedUntil > Date.now() ? all[key] : { count: all[key]?.count ?? 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }
  all[key] = rec;
  writeJson(local, ATTEMPTS_KEY, all);
  return rec.lockedUntil ? 0 : MAX_ATTEMPTS - rec.count;
}

function clearFailures(email: string) {
  const all = readJson<Attempts>(local, ATTEMPTS_KEY, {});
  delete all[normalizeEmail(email)];
  writeJson(local, ATTEMPTS_KEY, all);
}

const lockedMessage = (s: number) => `به‌خاطر چند تلاش ناموفق، ورود با این ایمیل تا ${faDigits(s)} ثانیه‌ی دیگر قفل است.`;

export async function verifyLogin(emailRaw: string, password: string): Promise<AuthUser> {
  const emailErr = emailError(emailRaw);
  if (emailErr) throw new AuthError('bad_input', emailErr, 'email');
  if (!password) throw new AuthError('bad_input', 'رمز عبور را بنویسید.', 'password');
  const email = normalizeEmail(emailRaw);

  const locked = lockSecondsLeft(email);
  if (locked) throw new AuthError('locked', lockedMessage(locked));

  if (email === DEMO_ACCOUNT.email) await ensureDemoUser();
  const user = findUser(email);
  // Hash even when the account is missing so both paths take about the same time.
  const hash = await derive(password, user?.salt ?? toB64(randomBytes(16)), user?.iterations ?? ITERATIONS);
  if (!user || !safeEqual(hash, user.hash)) {
    const left = recordFailure(email);
    const after = lockSecondsLeft(email);
    if (after) throw new AuthError('locked', lockedMessage(after));
    throw new AuthError('invalid', `ایمیل یا رمز عبور اشتباه است.${left <= 2 ? ` ${faDigits(left)} تلاش دیگر تا قفل موقت باقی مانده.` : ''}`);
  }
  clearFailures(email);
  return user;
}

// ---------- sessions ----------
export function createSession(user: AuthUser, remember: boolean): Session {
  const s: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    demo: !!user.demo,
    issuedAt: Date.now(),
    expiresAt: remember ? Date.now() + REMEMBER_MS : null,
  };
  clearSession();
  writeJson(remember ? local : sessionStore, SESSION_KEY, s);
  return s;
}

export function getSession(): Session | null {
  const s = readJson<Session | null>(local, SESSION_KEY, null) ?? readJson<Session | null>(sessionStore, SESSION_KEY, null);
  if (!s || typeof s.userId !== 'string') return null;
  if (s.expiresAt !== null && s.expiresAt <= Date.now()) {
    clearSession();
    return null;
  }
  // The account may have been removed in another tab.
  if (!s.demo && !loadUsers().some((u) => u.id === s.userId)) {
    clearSession();
    return null;
  }
  return s;
}

export function clearSession() {
  local.removeItem(SESSION_KEY);
  sessionStore.removeItem(SESSION_KEY);
}

export function updateSessionName(name: string) {
  const s = getSession();
  if (!s) return;
  const next = { ...s, name };
  const store = s.expiresAt === null ? sessionStore : local;
  writeJson(store, SESSION_KEY, next);
  saveUsers(loadUsers().map((u) => (u.id === s.userId ? { ...u, name } : u)));
}

// ---------- password reset ----------
type ResetRecord = { email: string; code: string; expiresAt: number; tries: number };

/**
 * Starts a reset and returns the 6-digit code. With a real backend the code would be emailed;
 * in this standalone build the page shows it.
 */
export function requestPasswordReset(emailRaw: string): string {
  const err = emailError(emailRaw);
  if (err) throw new AuthError('bad_input', err, 'email');
  const email = normalizeEmail(emailRaw);
  if (email === DEMO_ACCOUNT.email) throw new AuthError('bad_input', 'رمز حساب نمایشی قابل تغییر نیست.', 'email');
  if (!findUser(email)) throw new AuthError('no_user', 'حسابی با این ایمیل پیدا نشد.', 'email');
  const n = new DataView(randomBytes(4).buffer).getUint32(0) % 1_000_000;
  const code = String(n).padStart(6, '0');
  writeJson(local, RESET_KEY, { email, code, expiresAt: Date.now() + RESET_TTL_MS, tries: 0 } satisfies ResetRecord);
  return code;
}

export async function resetPassword(emailRaw: string, codeRaw: string, password: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const code = toLatinDigits(codeRaw).replace(/\D/g, '');
  const pwErr = newPasswordError(password);
  if (pwErr) throw new AuthError('weak', pwErr, 'password');
  const rec = readJson<ResetRecord | null>(local, RESET_KEY, null);
  if (!rec || rec.email !== email) throw new AuthError('expired_code', 'درخواست بازیابی پیدا نشد. دوباره کد بگیرید.', 'code');
  if (rec.expiresAt <= Date.now()) {
    local.removeItem(RESET_KEY);
    throw new AuthError('expired_code', 'کد منقضی شده است. دوباره کد بگیرید.', 'code');
  }
  if (!safeEqual(code, rec.code)) {
    rec.tries += 1;
    if (rec.tries >= MAX_RESET_TRIES) {
      local.removeItem(RESET_KEY);
      throw new AuthError('expired_code', 'کد چند بار اشتباه وارد شد. دوباره کد بگیرید.', 'code');
    }
    writeJson(local, RESET_KEY, rec);
    throw new AuthError('bad_code', 'کد درست نیست.', 'code');
  }
  const salt = toB64(randomBytes(16));
  const hash = await derive(password, salt, ITERATIONS);
  saveUsers(loadUsers().map((u) => (u.email === email ? { ...u, salt, hash, iterations: ITERATIONS } : u)));
  local.removeItem(RESET_KEY);
  clearFailures(email);
}
