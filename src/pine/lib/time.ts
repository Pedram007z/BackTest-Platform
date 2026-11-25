import { type Builtin, type Rt, fail, int, num, str } from '../core';

/**
 * Time zones and Pine's date/time functions. A time zone is "UTC", "GMT+3", "UTC-04:30" or an IANA
 * name ("America/New_York"); without one, the symbol's exchange time zone (syminfo.timezone) is used.
 * Sessions are "HHMM-HHMM" with optional days (":23456", 1 = Sunday), several separated by commas.
 */

const HOUR = 3_600_000;
const fmts = new Map<string, Intl.DateTimeFormat | null>();
const offCache = new Map<string, number>();

function fixedOffset(tz: string): number | null {
  if (/^(UTC|GMT|Etc\/UTC|Etc\/GMT|Z)$/i.test(tz)) return 0;
  const m = /^(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(tz);
  if (!m) return null;
  const v = (Number(m[2]) * 60 + Number(m[3] ?? 0)) * 60_000;
  return m[1] === '-' ? -v : v;
}

/** `tz`'s offset from UTC at `ms` (ms to add to UTC to get local time). */
export function tzOffset(tz: string, ms: number): number {
  const fixed = fixedOffset(tz);
  if (fixed !== null) return fixed;
  const key = `${tz}|${Math.floor(ms / HOUR)}`;
  const hit = offCache.get(key);
  if (hit !== undefined) return hit;
  let f = fmts.get(tz);
  if (f === undefined) {
    try {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });
    } catch {
      f = null;
    }
    fmts.set(tz, f);
  }
  if (!f) fail(`منطقه‌ی زمانی «${tz}» شناخته نشد.`);
  const p: Record<string, number> = {};
  for (const part of f.formatToParts(new Date(ms))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  const local = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  const off = local - Math.floor(ms / 1000) * 1000;
  if (offCache.size > 50_000) offCache.clear();
  offCache.set(key, off);
  return off;
}

export const zoneOf = (rt: Rt, tz: unknown) => (typeof tz === 'string' && tz.trim() ? tz.trim() : rt.sym.timezone);
export const localDate = (rt: Rt, ms: number, tz: unknown) => new Date(ms + tzOffset(zoneOf(rt, tz), ms));

/** UTC ms of a wall time in `tz`. */
export function fromLocal(tz: string, y: number, mo: number, d: number, h = 0, mi = 0, s = 0): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  let t = guess - tzOffset(tz, guess);
  t = guess - tzOffset(tz, t);
  return t;
}

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t.getTime() - y0) / 86_400_000 + 1) / 7);
}

const part = (fn: (d: Date) => number) => (rt: Rt, a: any[]) => {
  const t = a[0] === undefined ? rt.d.time[rt.bar] : num(a[0]);
  if (t !== t) return NaN;
  return fn(localDate(rt, t, a[1]));
};

export const year = (d: Date) => d.getUTCFullYear();
export const month = (d: Date) => d.getUTCMonth() + 1;
export const dayofmonth = (d: Date) => d.getUTCDate();
export const dayofweek = (d: Date) => d.getUTCDay() + 1;
export const hour = (d: Date) => d.getUTCHours();
export const minute = (d: Date) => d.getUTCMinutes();
export const second = (d: Date) => d.getUTCSeconds();

/** Timeframe string → ms ("5", "60", "240", "D", "1D", "W", "M", "30S", "1H"). */
export function tfMs(tf: string): number {
  const m = /^(\d*)([SDWMH]?)$/i.exec(tf.trim());
  if (!m) fail(`تایم‌فریم «${tf}» معتبر نیست.`);
  const n = m[1] ? Number(m[1]) : 1;
  switch (m[2].toUpperCase()) {
    case 'S':
      return n * 1000;
    case 'H':
      return n * HOUR;
    case 'D':
      return n * 86_400_000;
    case 'W':
      return n * 7 * 86_400_000;
    case 'M':
      return n * 30 * 86_400_000;
    default:
      return n * 60_000;
  }
}

export const tfOf = (rt: Rt, v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : rt.tf.period);

/** Start of the `tf` bar that contains `t` (weeks start on Monday, months on the 1st). */
export function bucket(rt: Rt, tf: string, t: number): number {
  const ms = tfMs(tf);
  if (ms <= rt.tf.ms) return t;
  const u = tf.toUpperCase();
  if (u.endsWith('M') && !u.endsWith('MIN')) {
    const d = new Date(t);
    const n = Number(u.slice(0, -1) || 1);
    const m = d.getUTCFullYear() * 12 + d.getUTCMonth();
    const start = m - (m % n);
    return Date.UTC(Math.floor(start / 12), start % 12, 1);
  }
  if (u.endsWith('W')) {
    const day = Math.floor(t / 86_400_000);
    const monday = day - ((day + 3) % 7);
    return monday * 86_400_000;
  }
  return Math.floor(t / ms) * ms;
}

interface SessionPart {
  from: number;
  to: number;
  days: Set<number> | null;
}
const sessionCache = new Map<string, SessionPart[]>();

function parseSession(s: string): SessionPart[] {
  const hit = sessionCache.get(s);
  if (hit) return hit;
  const parts: SessionPart[] = [];
  const [times, days] = s.split(':');
  const daySet = days ? new Set([...days].map(Number).filter((d) => d >= 1 && d <= 7)) : null;
  for (const range of times.split(',')) {
    const m = /^\s*(\d{2})(\d{2})-(\d{2})(\d{2})\s*$/.exec(range);
    if (!m) {
      if (/^\s*24x7\s*$/i.test(range)) parts.push({ from: 0, to: 1440, days: daySet });
      else fail(`سشن «${s}» معتبر نیست؛ نمونه: "0930-1600" یا "0800-1700:23456".`);
      continue;
    }
    parts.push({ from: Number(m[1]) * 60 + Number(m[2]), to: Number(m[3]) * 60 + Number(m[4]), days: daySet });
  }
  sessionCache.set(s, parts);
  return parts;
}

/** Whether `t` falls in the session (in `tz`). */
export function inSession(rt: Rt, session: string, tz: unknown, t: number): boolean {
  if (!session || /^(regular|extended)$/i.test(session)) return true;
  const d = localDate(rt, t, tz);
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  const dow = d.getUTCDay() + 1;
  for (const p of parseSession(session)) {
    if (p.from === p.to || (p.from === 0 && p.to === 1440)) {
      if (!p.days || p.days.has(dow)) return true;
      continue;
    }
    if (p.from < p.to) {
      if (mins >= p.from && mins < p.to && (!p.days || p.days.has(dow))) return true;
    } else {
      // overnight: the part after midnight belongs to the session that started the day before
      if (mins >= p.from && (!p.days || p.days.has(dow))) return true;
      if (mins < p.to && (!p.days || p.days.has(dow === 1 ? 7 : dow - 1) || p.days.has(dow))) return true;
    }
  }
  return false;
}

function timestamp(rt: Rt, a: any[]): number {
  if (typeof a[0] === 'string' && a[1] === undefined) {
    const t = Date.parse(a[0]);
    if (t !== t) fail(`تاریخ «${a[0]}» قابل خواندن نیست.`);
    return t;
  }
  let tz = rt.sym.timezone;
  let args = a;
  if (typeof a[0] === 'string') {
    tz = a[0];
    args = a.slice(1);
  }
  const [y, mo, d, h, mi, s] = args.map((x) => (x === undefined ? 0 : int(x)));
  return fromLocal(tz, y, mo, d || 1, h, mi, s);
}

function sessionTime(rt: Rt, a: any[], close: boolean): number {
  const tf = tfOf(rt, a[0]);
  const t = rt.d.time[rt.bar];
  if (typeof a[1] === 'string' && a[1] && !inSession(rt, a[1], a[2], t)) return NaN;
  const start = bucket(rt, tf, t);
  return close ? start + Math.max(tfMs(tf), rt.tf.ms) : start;
}

function formatTime(rt: Rt, t: number, fmt: string, tz: unknown): string {
  if (t !== t) return 'NaN';
  const d = localDate(rt, t, tz);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return fmt.replace(/yyyy|yy|MMM|MM|dd|HH|mm|ss|SSS|EEE/g, (k) => {
    switch (k) {
      case 'yyyy':
        return String(d.getUTCFullYear());
      case 'yy':
        return pad(d.getUTCFullYear() % 100);
      case 'MMM':
        return months[d.getUTCMonth()];
      case 'MM':
        return pad(d.getUTCMonth() + 1);
      case 'dd':
        return pad(d.getUTCDate());
      case 'HH':
        return pad(d.getUTCHours());
      case 'mm':
        return pad(d.getUTCMinutes());
      case 'ss':
        return pad(d.getUTCSeconds());
      case 'SSS':
        return pad(d.getUTCMilliseconds(), 3);
      default:
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
    }
  });
}

export const TIME: Record<string, Builtin> = {
  year: { p: ['time', 'timezone'], f: part(year) },
  month: { p: ['time', 'timezone'], f: part(month) },
  dayofmonth: { p: ['time', 'timezone'], f: part(dayofmonth) },
  dayofweek: { p: ['time', 'timezone'], f: part(dayofweek) },
  hour: { p: ['time', 'timezone'], f: part(hour) },
  minute: { p: ['time', 'timezone'], f: part(minute) },
  second: { p: ['time', 'timezone'], f: part(second) },
  weekofyear: { p: ['time', 'timezone'], f: part(isoWeek) },
  timestamp: { p: ['timezone', 'year', 'month', 'day', 'hour', 'minute', 'second'], f: (rt, a) => timestamp(rt, a) },
  time: { p: ['timeframe', 'session', 'timezone', 'bars_back'], f: (rt, a) => sessionTime(rt, a, false) },
  time_close: { p: ['timeframe', 'session', 'timezone', 'bars_back'], f: (rt, a) => sessionTime(rt, a, true) },
  time_tradingday: { p: [], f: (rt) => bucket(rt, 'D', rt.d.time[rt.bar]) },
  'timeframe.in_seconds': { p: ['timeframe'], f: (rt, a) => tfMs(tfOf(rt, a[0])) / 1000 },
  'timeframe.from_seconds': {
    p: ['seconds'],
    f: (_rt, a) => {
      const s = int(a[0]);
      if (s % 86400 === 0) return `${s / 86400}D`;
      if (s % 60 === 0) return String(s / 60);
      return `${s}S`;
    },
  },
  'timeframe.change': {
    p: ['timeframe'],
    f: (rt, a, id) => {
      const tf = tfOf(rt, a[0]);
      const st = rt.state(id, () => ({ bar: -1, prev: NaN, cur: NaN }));
      if (st.bar !== rt.bar) {
        st.prev = st.cur;
        st.bar = rt.bar;
      }
      st.cur = bucket(rt, tf, rt.d.time[rt.bar]);
      return st.prev === st.prev && st.cur !== st.prev;
    },
  },
  'str.format_time': {
    p: ['time', 'format', 'timezone'],
    f: (rt, a) =>
      formatTime(
        rt,
        num(a[0]),
        str(a[1] ?? "yyyy-MM-dd'T'HH:mm:ssZ")
          .replace(/'T'/g, 'T')
          .replace(/Z$/, ''),
        a[2],
      ),
  },
};

/** Bar-time variables: `year`, `hour`, `dayofweek`, … of the current bar in the exchange time zone. */
export const timeVar = (fn: (d: Date) => number) => (rt: Rt) => fn(localDate(rt, rt.d.time[rt.bar], undefined));
