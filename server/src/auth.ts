import { config } from './config';
import { db, save } from './db';
import { HttpError, badRequest, rateLimit, type Ctx } from './http';
import { normalizePhone, type AccountUser } from './shared';
import { sendOtpSms } from './sms';
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
