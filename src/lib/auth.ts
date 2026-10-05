import { setToken } from '../services/api';
import { normalizePhone, type AccountUser, type Role } from '../services/types';
import { faDigits, toLatinDigits } from './format';
import { local, readJson, session as sessionStore, writeJson } from './storage';

/**
 * The signed-in account on this device. Sign-in is by mobile number and a one-time SMS code
 * (see services/); this module only keeps the session. With "remember me" the session lives in
 * localStorage for 30 days, otherwise in sessionStorage until the tab closes.
 */

export interface Session {
  userId: string;
  phone: string;
  name: string;
  role: Role;
  demo: boolean;
  issuedAt: number;
  /** null = ends with the browser session */
  expiresAt: number | null;
}

export const SESSION_KEY = 'backtest-auth:session:v2';
const REMEMBER_MS = 30 * 86_400_000;

export function phoneError(raw: string): string {
  const latin = toLatinDigits(raw).trim();
  if (!latin) return 'شماره موبایل را بنویسید.';
  if (/[a-z]/i.test(latin)) return 'شماره موبایل فقط عدد است.';
  if (!normalizePhone(latin)) return 'شماره موبایل درست نیست. نمونه: ۰۹۱۲۱۲۳۴۵۶۷';
  return '';
}

export function nameError(name: string): string {
  const n = name.trim();
  if (!n) return 'نام و نام خانوادگی را بنویسید.';
  if (n.length < 2) return 'نام باید حداقل ۲ حرف باشد.';
  return '';
}

/** "۰۹۱۲ ۱۲۳ ۴۵۶۷" */
export function fmtPhone(p: string): string {
  const n = normalizePhone(p) ?? p;
  return faDigits(n.length === 11 ? `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}` : n);
}

export function createSession(user: AccountUser, token: string, remember: boolean): Session {
  const s: Session = {
    userId: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    demo: !!user.demo,
    issuedAt: Date.now(),
    expiresAt: remember ? Date.now() + REMEMBER_MS : null,
  };
  clearSession();
  writeJson(remember ? local : sessionStore, SESSION_KEY, s);
  setToken(token);
  return s;
}

export function getSession(): Session | null {
  const s = readJson<Session | null>(local, SESSION_KEY, null) ?? readJson<Session | null>(sessionStore, SESSION_KEY, null);
  if (!s || typeof s.userId !== 'string') return null;
  if (s.expiresAt !== null && s.expiresAt <= Date.now()) {
    clearSession();
    return null;
  }
  return s;
}

export function clearSession() {
  local.removeItem(SESSION_KEY);
  sessionStore.removeItem(SESSION_KEY);
  setToken(null);
}

/** Keep the stored session in step with the account (name or role changed). */
export function updateSession(patch: Partial<Pick<Session, 'name' | 'role'>>) {
  const s = getSession();
  if (!s) return;
  writeJson(s.expiresAt === null ? sessionStore : local, SESSION_KEY, { ...s, ...patch });
}
