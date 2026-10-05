import { faDigits } from './format';
import type { GoToPreset } from './types';

/** Time-zone math with the browser's Intl database (handles daylight saving and historical rules). */

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function partsFmt(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

export interface WallTime {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
}

export function wallTime(ms: number, tz: string): WallTime {
  const out: Record<string, number> = {};
  for (const p of partsFmt(tz).formatToParts(new Date(ms))) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return { y: out.year, m: out.month, d: out.day, hh: out.hour % 24, mm: out.minute };
}

/** Offset of `tz` from UTC at instant `ms`, in ms (Tehran → +3.5h). */
export function tzOffset(ms: number, tz: string): number {
  const w = wallTime(ms, tz);
  const asUtc = Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm);
  return asUtc - Math.floor(ms / 60_000) * 60_000;
}

/** UTC instant of a wall-clock time in `tz`. */
export function wallToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string): number {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffset(guess, tz);
  // second pass settles daylight-saving edges
  t = guess - tzOffset(t, tz);
  return t;
}

export const parseHHMM = (s: string): [number, number] => {
  const [h, m] = s.split(':').map(Number);
  return [Math.min(23, Math.max(0, h || 0)), Math.min(59, Math.max(0, m || 0))];
};

/**
 * First instant strictly after `after` when the clock in `tz` reads `hhmm`,
 * skipping days `accept` rejects (e.g. weekends with no market data).
 */
export function nextOccurrence(after: number, hhmm: string, tz: string, accept: (ms: number) => boolean = () => true): number {
  const [hh, mm] = parseHHMM(hhmm);
  const w = wallTime(after, tz);
  let day = Date.UTC(w.y, w.m - 1, w.d);
  for (let i = 0; i < 21; i++, day += 86_400_000) {
    const dt = new Date(day);
    const t = wallToUtc(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), hh, mm, tz);
    if (t > after && accept(t)) return t;
  }
  return after;
}

export const TZ_OPTIONS = [
  { value: 'Asia/Tehran', label: 'تهران' },
  { value: 'America/New_York', label: 'نیویورک' },
  { value: 'Europe/London', label: 'لندن' },
  { value: 'Asia/Tokyo', label: 'توکیو' },
  { value: 'Australia/Sydney', label: 'سیدنی' },
  { value: 'UTC', label: 'UTC' },
];
export const tzLabel = (tz: string) => TZ_OPTIONS.find((o) => o.value === tz)?.label ?? tz;

export const BUILTIN_GOTO: GoToPreset[] = [
  { id: 'g_asia', name: 'شروع سشن آسیا', time: '09:00', tz: 'Asia/Tokyo', builtin: true, favorite: true },
  { id: 'g_london', name: 'شروع سشن لندن', time: '08:00', tz: 'Europe/London', builtin: true, favorite: true },
  { id: 'g_ny', name: 'شروع سشن نیویورک', time: '08:00', tz: 'America/New_York', builtin: true, favorite: true },
  { id: 'g_nyse', name: 'باز شدن بازار سهام آمریکا', time: '09:30', tz: 'America/New_York', builtin: true },
  { id: 'g_sb', name: 'سیلور بولت نیویورک', time: '10:00', tz: 'America/New_York', builtin: true },
  { id: 'g_day', name: 'شروع روز معاملاتی جدید', time: '17:00', tz: 'America/New_York', builtin: true },
];

/** "۱۶:۳۰" in Tehran time for an instant. */
export function fmtTehran(ms: number): string {
  const w = wallTime(ms, 'Asia/Tehran');
  return faDigits(`${String(w.hh).padStart(2, '0')}:${String(w.mm).padStart(2, '0')}`);
}

/** Trading sessions in UTC hours, for "performance by session" (Tokyo, London, New York cash hours). */
export type MarketSession = 'asia' | 'london' | 'newyork' | 'outside';
export const SESSION_LABEL: Record<MarketSession, string> = { asia: 'آسیا', london: 'لندن', newyork: 'نیویورک', outside: 'خارج از سشن' };
/** Short names for tight spots such as radar axes. */
export const SESSION_SHORT: Record<MarketSession, string> = { asia: 'آسیا', london: 'لندن', newyork: 'نیویورک', outside: 'خارج' };

export function marketSessionOf(ms: number): MarketSession {
  const ny = wallTime(ms, 'America/New_York');
  const ld = wallTime(ms, 'Europe/London');
  const tk = wallTime(ms, 'Asia/Tokyo');
  const nyMin = ny.hh * 60 + ny.mm;
  const ldMin = ld.hh * 60 + ld.mm;
  const tkMin = tk.hh * 60 + tk.mm;
  if (nyMin >= 8 * 60 && nyMin < 17 * 60) return 'newyork';
  if (ldMin >= 8 * 60 && ldMin < 17 * 60) return 'london';
  if (tkMin >= 9 * 60 && tkMin < 18 * 60) return 'asia';
  return 'outside';
}
