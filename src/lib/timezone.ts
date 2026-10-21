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
  return fmtClock(ms, 'Asia/Tehran');
}

// ---------- the chart's time zone (the user picks it under the chart) ----------

/** Before the user picks one. */
export const DEFAULT_CHART_TZ = 'Asia/Tehran';

/** Persian names of zones traders use most; others are named after their city. */
const TZ_FA: Record<string, string> = {
  'Asia/Tehran': 'تهران',
  'America/New_York': 'نیویورک',
  'Europe/London': 'لندن',
  'Asia/Tokyo': 'توکیو',
  'Australia/Sydney': 'سیدنی',
  UTC: 'UTC',
  'Etc/UTC': 'UTC',
  'Asia/Dubai': 'دبی',
  'Europe/Istanbul': 'استانبول',
  'Europe/Berlin': 'برلین',
  'Europe/Paris': 'پاریس',
  'Europe/Zurich': 'زوریخ',
  'Europe/Moscow': 'مسکو',
  'Asia/Hong_Kong': 'هنگ‌کنگ',
  'Asia/Singapore': 'سنگاپور',
  'Asia/Shanghai': 'شانگهای',
  'Asia/Kabul': 'کابل',
  'Asia/Baghdad': 'بغداد',
  'Asia/Riyadh': 'ریاض',
  'Asia/Karachi': 'کراچی',
  'Asia/Kolkata': 'کلکته',
  'America/Chicago': 'شیکاگو',
  'America/Los_Angeles': 'لس‌آنجلس',
  'America/Toronto': 'تورنتو',
  'Pacific/Auckland': 'اوکلند',
};

/** Old names some browsers still list, and the names the cities have now. */
const TZ_RENAMED: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Europe/Kiev': 'Europe/Kyiv',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'America/Godthab': 'America/Nuuk',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'Pacific/Truk': 'Pacific/Chuuk',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
};

/** Every IANA time zone the browser knows (under the cities' current names), UTC first. */
export function allTimeZones(): string[] {
  let list: string[] = [];
  try {
    list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
  } catch {
    /* older browsers */
  }
  if (!list.length) list = TZ_OPTIONS.map((o) => o.value).filter((v) => v !== 'UTC');
  const named = list.map((z) => (TZ_RENAMED[z] && isTimeZone(TZ_RENAMED[z]) ? TZ_RENAMED[z] : z));
  return ['UTC', ...new Set(named.filter((z) => z !== 'UTC' && z !== 'Etc/UTC'))];
}

export function isTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "تهران", or the city of the zone ("Buenos Aires"). */
export function tzName(tz: string): string {
  return TZ_FA[tz] ?? tz.split('/').pop()!.replace(/_/g, ' ');
}

/** "UTC+3:30", "UTC−5", "UTC" at instant `ms` (daylight saving included). */
export function fmtOffset(ms: number, tz: string): string {
  const min = Math.round(tzOffset(ms, tz) / 60_000);
  if (!min) return 'UTC';
  const a = Math.abs(min);
  return `UTC${min > 0 ? '+' : '−'}${Math.floor(a / 60)}${a % 60 ? `:${String(a % 60).padStart(2, '0')}` : ''}`;
}

const two = (n: number) => String(n).padStart(2, '0');

/** "۱۶:۳۰" (Persian digits) in `tz`. */
export function fmtClock(ms: number, tz: string): string {
  const w = wallTime(ms, tz);
  return faDigits(`${two(w.hh)}:${two(w.mm)}`);
}

/** "16:30" (Latin digits) in `tz`, for the chart's axis. */
export function fmtClockLatin(ms: number, tz: string, seconds = false): string {
  const w = wallTime(ms, tz);
  const s = seconds ? `:${two(new Date(ms).getUTCSeconds())}` : '';
  return `${two(w.hh)}:${two(w.mm)}${s}`;
}

/** The calendar day in `tz` (YYYY-MM-DD). */
export function dayKeyIn(ms: number, tz: string): string {
  const w = wallTime(ms, tz);
  return `${w.y}-${two(w.m)}-${two(w.d)}`;
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
