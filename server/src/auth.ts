import { config } from './config';
import { db, save } from './db';
import { USERNAME, checkPassword, hashPassword, isPasswordHash, passwordError } from './password';
import { HttpError, badRequest, checkRateLimit, notFound, rateLimit, type Ctx } from './http';
import { normalizePhone, type AccountUser } from './shared';
import { sendOtpSms } from './sms';
import { randomBytes } from 'node:crypto';
import { DAY_MS, addDays, clone, hmac, otpCode, randomToken, safeEqual, sha256, toLatinDigits, todayKey, uid } from './util';

const RESEND_SEC = 60;
const MAX_TRIES = 5;

const unauthorized = () => new HttpError(401, 'unauthorized', 'نشست شما تمام شده؛ دوباره وارد شوید.');
const banned = () => new HttpError(403, 'banned', 'این حساب مسدود شده است. با پشتیبانی تماس بگیرید.');

const isAdminPhone = (phone: string) => config.adminPhones.some((p) => normalizePhone(p) === phone);
const codeHash = (phone: string, code: string) => hmac(db().secret, `${phone}:${code}`);

function parsePhone(raw: unknown): string {
  const phone = typeof raw === 'string' ? normalizePhone(raw) : null;
  if (!phone) throw badRequest('bad_phone', 'شماره موبایل درست نیست. نمونه: ۰۹۱۲۱۲۳۴۵۶۷', 'phone');
  return phone;
}

export async function requestOtp(ctx: Ctx) {
  const phone = parsePhone(ctx.body.phone);
  rateLimit(`otp-ip:${ctx.ip}`, 10, 10 * 60_000);
  rateLimit(`otp-phone:${phone}`, 6, 60 * 60_000, 'برای این شماره کد زیادی درخواست شده؛ یک ساعت بعد دوباره تلاش کنید.');
  const d = db();
  const user = d.users.find((u) => u.phone === phone);
  const admin = isAdminPhone(phone) || user?.role === 'admin';
  if (!user && !d.settings.registrationOpen && !admin) throw badRequest('closed', 'ثبت‌نام کاربر جدید فعلاً بسته است.', 'phone');
  if (d.settings.maintenance && !admin) throw new HttpError(503, 'maintenance', 'سایت در حال به‌روزرسانی است؛ کمی بعد دوباره سر بزنید.');
  if (user?.status === 'banned') throw banned();

  const prev = d.otps[phone];
  const wait = prev ? Math.ceil((prev.sentAt + RESEND_SEC * 1000 - Date.now()) / 1000) : 0;
  if (wait > 0) throw badRequest('too_soon', `برای درخواست کد دوباره ${wait} ثانیه صبر کنید.`, 'phone');

  const { otpLength, otpTtlSec, siteName } = d.settings;
  const code = otpCode(otpLength);
  d.otps[phone] = { hash: codeHash(phone, code), expiresAt: Date.now() + otpTtlSec * 1000, sentAt: Date.now(), tries: 0 };
  save();
  // The last line lets phones offer the code automatically (WebOTP / SMS autofill).
  const text = `کد ورود شما به ${siteName}: ${code}\n\n@${new URL(config.appUrl).host} #${code}`;
  const log = await sendOtpSms(phone, code, text);
  if (log.status === 'failed') {
    delete d.otps[phone];
    save();
    throw new HttpError(502, 'sms_failed', 'ارسال پیامک ناموفق بود. چند لحظه بعد دوباره تلاش کنید.', 'phone');
  }
  const echo = config.devOtpEcho && !d.sms.enabled;
  return { ttlSec: otpTtlSec, length: otpLength, resendInSec: RESEND_SEC, isNew: !user, devCode: echo ? code : undefined };
}

export async function verifyOtp(ctx: Ctx) {
  const phone = parsePhone(ctx.body.phone);
  rateLimit(`verify-ip:${ctx.ip}`, 30, 10 * 60_000);
  const code = toLatinDigits(String(ctx.body.code ?? '')).replace(/\D/g, '');
  const d = db();
  const rec = d.otps[phone];
  if (!rec || rec.expiresAt < Date.now()) throw badRequest('expired', 'کد منقضی شده است؛ کد جدید بگیرید.', 'code');
  if (!safeEqual(rec.hash, codeHash(phone, code))) {
    rec.tries++;
    const locked = rec.tries >= MAX_TRIES;
    if (locked) delete d.otps[phone];
    save();
    throw badRequest('bad_code', locked ? 'کد چند بار اشتباه وارد شد؛ کد جدید بگیرید.' : 'کد واردشده درست نیست.', 'code');
  }

  let user = d.users.find((u) => u.phone === phone);
  const isNew = !user;
  if (!user) {
    const name = String(ctx.body.name ?? '')
      .trim()
      .slice(0, 60);
    // keep the code valid so the person can add their name and submit again
    if (name.length < 2) throw badRequest('need_name', 'نام و نام خانوادگی را بنویسید.', 'name');
    const today = todayKey();
    const trial = d.settings.trialDays > 0 && d.plans.some((p) => p.id === d.settings.trialPlanId);
    user = {
      id: uid('u'),
      phone,
      name,
      role: isAdminPhone(phone) ? 'admin' : 'user',
      status: 'active',
      planId: trial ? d.settings.trialPlanId : 'free',
      planStartedAt: today,
      planEndsAt: addDays(today, trial ? d.settings.trialDays : 3650),
      createdAt: Date.now(),
    };
    d.users.unshift(user);
  } else if (isAdminPhone(phone) && user.role !== 'admin') {
    user.role = 'admin';
  }
  if (user.status === 'banned') throw banned();
  delete d.otps[phone];
  return startSession(ctx, user, isNew);
}

function startSession(ctx: Ctx, user: AccountUser, isNew: boolean) {
  const d = db();
  user.lastLoginAt = Date.now();
  const token = randomToken();
  d.sessions[sha256(token)] = {
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + config.sessionDays * DAY_MS,
    lastSeenAt: Date.now(),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  };
  save();
  return { token, user: clone(user), isNew };
}

// ---------- the admin sign-in address ----------
const KEY = /^[A-Za-z0-9_-]{16,128}$/;

/** The secret part of the admin sign-in address (/#/k/<key>): ADMIN_LOGIN_KEY, or a random one kept in db.json. */
export function adminGateKey(): string {
  if (KEY.test(config.adminLoginKey)) return config.adminLoginKey;
  const d = db();
  if (!d.adminGateKey) {
    d.adminGateKey = randomBytes(24).toString('base64url');
    save();
  }
  return d.adminGateKey;
}

/** At start: make sure a key exists (the key itself is never written to the log). */
export function applyAdminGate() {
  if (config.adminLoginKey && !KEY.test(config.adminLoginKey)) {
    console.warn('[auth] ADMIN_LOGIN_KEY must be 16-128 of A-Z a-z 0-9 _ -; using the key saved on the server. Run make-admin.sh --new-url.');
  }
  adminGateKey();
}

/** Wrong keys per IP: after 20 in 15 minutes even the right one is refused for a while. */
const gateFailures = new Map<string, { n: number; until: number }>();
const GATE_TRIES = 20;
function gateOk(ctx: Ctx, key: unknown): boolean {
  const now = Date.now();
  if (gateFailures.size > 10_000) for (const [ip, f] of gateFailures) if (f.until < now) gateFailures.delete(ip);
  const f = gateFailures.get(ctx.ip);
  if (f && f.until > now && f.n >= GATE_TRIES) return false;
  if (typeof key === 'string' && safeEqual(key, adminGateKey())) return true;
  const next = f && f.until > now ? f : { n: 0, until: now + 15 * 60_000 };
  next.n++;
  gateFailures.set(ctx.ip, next);
  return false;
}
/** the same answer as an address that does not exist */
const hidden = () => notFound('مسیر API پیدا نشد.');

/** POST /api/auth/admin-gate { key }: whether the admin sign-in page may be shown. */
export function adminGate(ctx: Ctx) {
  if (!gateOk(ctx, ctx.body.key)) throw hidden();
  return { ok: true };
}

// ---------- admins: username and password ----------
const badLogin = () => badRequest('bad_login', 'نام کاربری یا رمز عبور درست نیست.', 'password');
/** Compared against when the username does not exist, so both cases take as long. */
let dummyHash: Promise<string> | null = null;

const FAILURES = 10;
const FAILURE_WINDOW = 15 * 60_000;

/**
 * POST /api/auth/admin-login { key, username, password }: admins only, and only with the sign-in
 * address key (otherwise "not found"). 10 failed tries per IP and per username in 15 minutes.
 */
export async function adminLogin(ctx: Ctx) {
  if (!gateOk(ctx, ctx.body.key)) throw hidden();
  const tooMany = 'تلاش‌های ناموفق زیاد بود؛ ۱۵ دقیقه بعد دوباره امتحان کنید.';
  const username = String(ctx.body.username ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 64);
  const password = String(ctx.body.password ?? '').slice(0, 200);
  checkRateLimit(`admin-login-ip:${ctx.ip}`, FAILURES, tooMany);
  checkRateLimit(`admin-login-user:${username}`, FAILURES, tooMany);
  if (!username || !password) throw badRequest('invalid', 'نام کاربری و رمز عبور را بنویسید.', username ? 'password' : 'username');
  const d = db();
  const entry = Object.entries(d.credentials).find(([, c]) => c.username === username);
  const user = entry && d.users.find((u) => u.id === entry[0]);
  const ok = await checkPassword(password, entry?.[1].hash ?? (await (dummyHash ??= hashPassword('not a password'))));
  if (!ok || !user || user.role !== 'admin') {
    rateLimit(`admin-login-ip:${ctx.ip}`, FAILURES + 1, FAILURE_WINDOW);
    rateLimit(`admin-login-user:${username}`, FAILURES + 1, FAILURE_WINDOW);
    throw badLogin();
  }
  if (user.status === 'banned') throw banned();
  return startSession(ctx, user, false);
}

/** GET /api/admin/credentials: the signed-in admin's username (null when not set) and the admin sign-in address. */
export function ownCredentials(user: AccountUser) {
  return { username: db().credentials[user.id]?.username ?? null, loginPath: `/k/${adminGateKey()}`, keyFromEnv: KEY.test(config.adminLoginKey) };
}

/** PUT /api/admin/credentials { username, password, currentPassword }: set or change one's own. */
export async function saveCredentials(ctx: Ctx, user: AccountUser) {
  const d = db();
  const username = String(ctx.body.username ?? '')
    .trim()
    .toLowerCase();
  if (!USERNAME.test(username)) throw badRequest('invalid', 'نام کاربری ۳ تا ۳۲ حرف انگلیسی، عدد یا _ . - باشد.', 'username');
  const taken = Object.entries(d.credentials).some(([id, c]) => id !== user.id && c.username === username);
  if (taken) throw badRequest('taken', 'این نام کاربری برای مدیر دیگری است.', 'username');
  const password = String(ctx.body.password ?? '');
  const err = passwordError(password);
  if (err) throw badRequest('invalid', err, 'password');
  const current = d.credentials[user.id];
  if (current && !(await checkPassword(String(ctx.body.currentPassword ?? ''), current.hash))) throw badRequest('bad_password', 'رمز فعلی درست نیست.', 'currentPassword');
  d.credentials[user.id] = { username, hash: await hashPassword(password), fromEnv: current?.fromEnv, updatedAt: Date.now() };
  save();
  return { username };
}

/** DELETE /api/admin/credentials: back to signing in by phone only. */
export function removeCredentials(user: AccountUser) {
  delete db().credentials[user.id];
  save();
}

/**
 * ADMIN_USERNAME + ADMIN_PASSWORD_HASH in .env: an admin who can sign in with them (created when the
 * username is new). A password changed later in the admin panel is kept until the .env value changes.
 */
export function applyAdminLoginFromEnv() {
  const { adminUsername: username, adminPasswordHash: hash } = config;
  if (!username && !hash) return;
  if (!USERNAME.test(username) || !isPasswordHash(hash)) {
    console.warn('[auth] ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not valid; run make-admin.sh --username to set them.');
    return;
  }
  const d = db();
  // the account with this username, or the one an earlier ADMIN_USERNAME made (renamed)
  const entries = Object.entries(d.credentials);
  let id = (entries.find(([, c]) => c.username === username) ?? entries.find(([, c]) => c.fromEnv))?.[0];
  let user = id ? d.users.find((u) => u.id === id) : undefined;
  if (!user) {
    const today = todayKey();
    user = {
      id: uid('u'),
      phone: '',
      name: 'مدیر سایت',
      role: 'admin',
      status: 'active',
      planId: 'free',
      planStartedAt: today,
      planEndsAt: addDays(today, 3650),
      createdAt: Date.now(),
    };
    d.users.push(user);
    id = user.id;
  }
  user.role = 'admin';
  if (user.status === 'banned') user.status = 'active';
  const current = d.credentials[user.id];
  const free = !entries.some(([other, c]) => other !== user.id && c.username === username);
  if (free && (!current || current.fromEnv !== hash || current.username !== username)) d.credentials[user.id] = { username, hash, fromEnv: hash, updatedAt: Date.now() };
  save();
}

function bearer(ctx: Ctx): string | null {
  const h = String(ctx.req.headers.authorization ?? '');
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

/** The signed-in account, or 401. Also refreshes the session's last-seen time. */
export function requireUser(ctx: Ctx): AccountUser {
  const token = bearer(ctx);
  if (!token) throw unauthorized();
  const d = db();
  const key = sha256(token);
  const s = d.sessions[key];
  if (!s || s.expiresAt < Date.now()) {
    if (s) delete d.sessions[key];
    throw unauthorized();
  }
  const user = d.users.find((u) => u.id === s.userId);
  if (!user) {
    delete d.sessions[key];
    save();
    throw unauthorized();
  }
  if (user.status === 'banned') throw banned();
  if (d.settings.maintenance && user.role !== 'admin') throw new HttpError(503, 'maintenance', 'سایت در حال به‌روزرسانی است؛ کمی بعد دوباره سر بزنید.');
  if (Date.now() - s.lastSeenAt > 5 * 60_000) {
    s.lastSeenAt = Date.now();
    save();
  }
  ctx.user = user;
  ctx.token = token;
  return user;
}

export function requireAdmin(ctx: Ctx): AccountUser {
  const user = requireUser(ctx);
  if (user.role !== 'admin') throw new HttpError(403, 'forbidden', 'دسترسی مدیر لازم است.');
  return user;
}

export function logout(ctx: Ctx) {
  const token = bearer(ctx);
  if (token) {
    delete db().sessions[sha256(token)];
    save();
  }
}

/** Sign a user out everywhere (after a ban or deletion). */
export function dropSessions(userId: string) {
  const d = db();
  for (const [k, s] of Object.entries(d.sessions)) if (s.userId === userId) delete d.sessions[k];
  save();
}
