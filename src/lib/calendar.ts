import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';
import { faDigits } from './format';

/**
 * Dates are stored as Gregorian day keys ("YYYY-MM-DD", UTC days).
 * The UI can show and pick them in either the Jalali (شمسی) or Gregorian (میلادی) calendar.
 */
export type CalendarKind = 'jalali' | 'gregorian';
export type DayKey = string;
export interface YMD {
  y: number;
  m: number; // 1-based
  d: number;
}

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
export const GREGORIAN_MONTHS = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
];
/** Week starts on Saturday. */
export const WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
/** Indexed by JS getUTCDay() (0 = Sunday). */
export const WEEKDAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

export function keyFromGregorian(y: number, m: number, d: number): DayKey {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseKey(key: DayKey): YMD {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

export function keyToMs(key: DayKey): number {
  const { y, m, d } = parseKey(key);
  return Date.UTC(y, m - 1, d);
}

export function msToKey(ms: number): DayKey {
  const dt = new Date(ms);
  return keyFromGregorian(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** The viewer's local calendar day. */
export function localDayKey(date = new Date()): DayKey {
  return keyFromGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(key: DayKey, days: number): DayKey {
  return msToKey(keyToMs(key) + days * DAY_MS);
}

export function addMonths(key: DayKey, months: number): DayKey {
  const { y, m, d } = parseKey(key);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return keyFromGregorian(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(d, last));
}

export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((keyToMs(b) - keyToMs(a)) / DAY_MS);
}

export function weekdayOf(key: DayKey): number {
  return new Date(keyToMs(key)).getUTCDay();
}

export function fromKey(cal: CalendarKind, key: DayKey): YMD {
  const g = parseKey(key);
  if (cal === 'gregorian') return g;
  const j = toJalaali(g.y, g.m, g.d);
  return { y: j.jy, m: j.jm, d: j.jd };
}

export function toKey(cal: CalendarKind, ymd: YMD): DayKey {
  if (cal === 'gregorian') return keyFromGregorian(ymd.y, ymd.m, ymd.d);
  const g = toGregorian(ymd.y, ymd.m, ymd.d);
  return keyFromGregorian(g.gy, g.gm, g.gd);
}

export function monthLength(cal: CalendarKind, y: number, m: number): number {
  if (cal === 'jalali') return jalaaliMonthLength(y, m);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Column (0 = Saturday) of the first day of a month. */
export function firstColumn(cal: CalendarKind, y: number, m: number): number {
  const key = toKey(cal, { y, m, d: 1 });
  return (weekdayOf(key) + 1) % 7;
}

export function monthName(cal: CalendarKind, m: number): string {
  return (cal === 'jalali' ? JALALI_MONTHS : GREGORIAN_MONTHS)[m - 1];
}

/** "۱۴۰۵/۰۷/۱۰" */
export function fmtDay(key: DayKey, cal: CalendarKind = 'jalali'): string {
  const { y, m, d } = fromKey(cal, key);
  return faDigits(`${y}/${pad(m)}/${pad(d)}`);
}

/** "۱۰ مهر ۱۴۰۵" */
export function fmtDayLong(key: DayKey, cal: CalendarKind = 'jalali', withWeekday = false): string {
  const { y, m, d } = fromKey(cal, key);
  const base = `${faDigits(d)} ${monthName(cal, m)} ${faDigits(y)}`;
  return withWeekday ? `${WEEKDAY_NAMES[weekdayOf(key)]}، ${base}` : base;
}

/** Indexed by getUTCDay(); compact forms for chart axes. */
const WEEKDAY_COMPACT = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];

/** Short chart label, e.g. "پنج ۱۰" (weekday + Jalali day of month). */
export function fmtDayShort(key: DayKey): string {
  const { d } = fromKey('jalali', key);
  return `${WEEKDAY_COMPACT[weekdayOf(key)]} ${faDigits(d)}`;
}

/** Market timestamp → "۱۴۰۳/۰۲/۱۵ ۱۴:۳۰" (UTC). */
export function fmtMarketTime(ms: number): string {
  const dt = new Date(ms);
  const time = `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;
  return `${fmtDay(msToKey(ms))} ${faDigits(time)}`;
}
