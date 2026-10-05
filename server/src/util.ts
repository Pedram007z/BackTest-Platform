import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from './config';

export const DAY_MS = 86_400_000;

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const hmac = (key: string, s: string) => createHmac('sha256', key).update(s).digest('hex');

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A numeric code of `length` digits that does not start with 0. */
export const otpCode = (length: number) => String(randomInt(10 ** (length - 1), 10 ** length));

export const randomToken = () => randomBytes(32).toString('base64url');

// ---------- day keys ("YYYY-MM-DD") ----------
const tehran = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Calendar day in Iran for a timestamp; subscriptions and reports follow Tehran days. */
export const tehranDayKey = (ms = Date.now()) => tehran.format(new Date(ms));
export const todayKey = () => tehranDayKey();

export const keyToMs = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const utcDayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (key: string, days: number) => utcDayKey(keyToMs(key) + days * DAY_MS);
export const diffDays = (from: string, to: string) => Math.round((keyToMs(to) - keyToMs(from)) / DAY_MS);
export const isDayKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(keyToMs(v));

const jalali = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long', timeZone: 'UTC' });
/** "۱۳ مهر ۱۴۰۵" for a day key. */
export const faDay = (key: string) => jalali.format(keyToMs(key));

export const toLatinDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

export const faNum = (n: number) => n.toLocaleString('fa-IR');

export const clone = <T>(v: T): T => structuredClone(v);

// ---------- upstream HTTP ----------
export class UpstreamError extends Error {
  constructor(
    message: string,
    public status = 0,
    public body = '',
  ) {
    super(message);
  }
}

/** fetch() with a timeout. Network failures become UpstreamError with status 0. */
export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = config.upstreamTimeoutMs): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const reason = err.name === 'AbortError' ? `timeout after ${timeoutMs} ms` : (err.cause?.code ?? err.message);
    throw new UpstreamError(`${new URL(url).host}: ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

/** POST/GET a JSON API and parse the reply (also on HTTP errors, which these APIs use for business errors). */
export async function fetchJson<T = any>(
  url: string,
  init: RequestInit & { json?: unknown; form?: Record<string, string | number | undefined> } = {},
): Promise<{ status: number; data: T }> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  } else if (init.form) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(init.form)) if (v !== undefined) p.set(k, String(v));
    body = p.toString();
  }
  const res = await fetchWithTimeout(url, { ...init, headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new UpstreamError(`${new URL(url).host}: unexpected reply (HTTP ${res.status})`, res.status, text.slice(0, 300));
  }
  return { status: res.status, data: data as T };
}

/** Run at most `n` tasks at a time. */
export function limiter(n: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (active >= n) return;
    const run = queue.shift();
    if (run) {
      active++;
      run();
    }
  };
  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() =>
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          }),
      );
      next();
    });
}
