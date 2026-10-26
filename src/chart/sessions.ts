import { isTimeZone, parseHHMM, wallTime, wallToUtc } from '../lib/timezone';

/**
 * The «سشن‌ها» indicator, shared by both chart engines: up to four trading sessions, each with its own
 * clock times in its own time zone (so London and New York follow their daylight saving), and for every
 * day the box from the session's first bar to its last, between the highest high and the lowest low.
 * Only the bars the replay has shown are used: a session still running stops at the cursor, with its
 * high and low so far.
 */

export interface SessionDef {
  on: boolean;
  name: string;
  /** "HH:MM" on the session's own clock */
  start: string;
  /** "HH:MM"; at or before `start` means the next day */
  end: string;
  /** IANA time zone the times are in */
  tz: string;
  color: string;
}

export interface SessionsConfig {
  sessions: SessionDef[];
  /** fill the boxes (the high and low lines are always drawn) */
  fill: boolean;
  /** the session's name at the top of each box */
  labels: boolean;
}

export const SESSION_COUNT = 4;

/** Business hours of the four markets on their own clocks (Sydney's is off at first: it overlaps Tokyo). */
export const DEFAULT_SESSIONS: SessionDef[] = [
  { on: false, name: 'سیدنی', start: '08:00', end: '17:00', tz: 'Australia/Sydney', color: '#8b5cf6' },
  { on: true, name: 'توکیو', start: '09:00', end: '18:00', tz: 'Asia/Tokyo', color: '#ec4899' },
  { on: true, name: 'لندن', start: '08:00', end: '17:00', tz: 'Europe/London', color: '#3b82f6' },
  { on: true, name: 'نیویورک', start: '08:00', end: '17:00', tz: 'America/New_York', color: '#f59e0b' },
];

/** The English names TradingView's (English) settings dialog starts with. */
export const DEFAULT_NAMES_EN = ['Sydney', 'Tokyo', 'London', 'New York'];

/** Longest bar the boxes are drawn for: above an hour a bar spans too much of a session. */
export const SESSIONS_MAX_BAR_SEC = 3600;

export function defaultSessionsConfig(): SessionsConfig {
  return { sessions: DEFAULT_SESSIONS.map((s) => ({ ...s })), fill: true, labels: true };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isHHMM = (v: unknown): v is string => typeof v === 'string' && HHMM.test(v);
const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

/** a session from loose values (a saved layout, the settings dialog); anything unusable falls back to the default */
export function cleanSession(raw: Partial<Record<keyof SessionDef, unknown>>, i: number): SessionDef {
  const d = DEFAULT_SESSIONS[i] ?? DEFAULT_SESSIONS[0];
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) : '';
  return {
    on: typeof raw.on === 'boolean' ? raw.on : raw.on === 1 ? true : raw.on === 0 ? false : d.on,
    name: name || d.name,
    start: isHHMM(raw.start) ? raw.start : d.start,
    end: isHHMM(raw.end) ? raw.end : d.end,
    tz: isTimeZone(raw.tz) ? raw.tz : d.tz,
    color: isColor(raw.color) ? raw.color.toLowerCase() : d.color,
  };
}

// ---------- kept in a built-in chart indicator's params (numbers and strings) ----------
export function sessionsFromParams(params: Record<string, number | string>, colors: Record<string, string>): SessionsConfig {
  const sessions = Array.from({ length: SESSION_COUNT }, (_, i) =>
    cleanSession({ on: params[`s${i}on`], name: params[`s${i}name`], start: params[`s${i}start`], end: params[`s${i}end`], tz: params[`s${i}tz`], color: colors[`s${i}`] }, i),
  );
  return { sessions, fill: params.fill !== 0, labels: params.labels !== 0 };
}

export function sessionsToParams(cfg: SessionsConfig): { params: Record<string, number | string>; colors: Record<string, string> } {
  const params: Record<string, number | string> = { fill: cfg.fill ? 1 : 0, labels: cfg.labels ? 1 : 0 };
  const colors: Record<string, string> = {};
  cfg.sessions.forEach((s, i) => {
    params[`s${i}on`] = s.on ? 1 : 0;
    params[`s${i}name`] = s.name;
    params[`s${i}start`] = s.start;
    params[`s${i}end`] = s.end;
    params[`s${i}tz`] = s.tz;
    colors[`s${i}`] = s.color;
  });
  return { params, colors };
}

/** "08:00" → minutes after midnight */
const minutes = (hhmm: string) => {
  const [h, m] = parseHHMM(hhmm);
  return h * 60 + m;
};

/** "08:00–17:00" in the session's clock; a length of 0 means a whole day */
export function sessionMinutes(s: Pick<SessionDef, 'start' | 'end'>): number {
  const len = (minutes(s.end) - minutes(s.start) + 1440) % 1440;
  return len || 1440;
}

export interface SessionBar {
  /** bar open, UTC seconds */
  time: number;
  high: number;
  low: number;
}

export interface SessionBox {
  /** which of the four sessions */
  session: number;
  /** first and last bar inside the session (indexes into the bars given) */
  from: number;
  to: number;
  high: number;
  low: number;
  /** bars of the session's high and low */
  highAt: number;
  lowAt: number;
  /** the session's scheduled start and end (UTC ms) */
  startMs: number;
  endMs: number;
}

const DAY_MS = 86_400_000;

/** first index with bars[i].time ≥ sec, searching from `lo` */
function lowerBound(bars: SessionBar[], sec: number, lo: number): number {
  let hi = bars.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (bars[mid].time < sec) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Every session box the bars cover, oldest first per session. A bar belongs to a session when it opens
 * inside it. A session that began before the first bar is left out (its high and low would be partial),
 * and nothing is returned for bars longer than an hour.
 */
export function sessionBoxes(bars: SessionBar[], cfg: SessionsConfig, barSec: number): SessionBox[] {
  const out: SessionBox[] = [];
  if (!bars.length || barSec > SESSIONS_MAX_BAR_SEC) return out;
  const firstMs = bars[0].time * 1000;
  const lastMs = bars[bars.length - 1].time * 1000;
  cfg.sessions.forEach((s, si) => {
    if (!s.on) return;
    const [sh, sm] = parseHHMM(s.start);
    const [eh, em] = parseHHMM(s.end);
    const overnight = minutes(s.end) <= minutes(s.start);
    // the session's own calendar days, from the one before the first bar (an overnight session) to the last bar's
    const a = wallTime(firstMs - DAY_MS, s.tz);
    const b = wallTime(lastMs, s.tz);
    const lastDay = Date.UTC(b.y, b.m - 1, b.d);
    let i = 0;
    for (let day = Date.UTC(a.y, a.m - 1, a.d); day <= lastDay; day += DAY_MS) {
      const d = new Date(day);
      const startMs = wallToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), sh, sm, s.tz);
      const e = overnight ? new Date(day + DAY_MS) : d;
      const endMs = wallToUtc(e.getUTCFullYear(), e.getUTCMonth() + 1, e.getUTCDate(), eh, em, s.tz);
      // a session that began before the first bar would look shorter than it was: left out
      if (startMs < firstMs) continue;
      i = lowerBound(bars, startMs / 1000, i);
      let j = i;
      let high = -Infinity;
      let low = Infinity;
      let highAt = i;
      let lowAt = i;
      for (; j < bars.length && bars[j].time * 1000 < endMs; j++) {
        if (bars[j].high > high) {
          high = bars[j].high;
          highAt = j;
        }
        if (bars[j].low < low) {
          low = bars[j].low;
          lowAt = j;
        }
      }
      if (j > i) out.push({ session: si, from: i, to: j - 1, high, low, highAt, lowAt, startMs, endMs });
    }
  });
  return out;
}

/** "#3b82f6" with an alpha → "rgba(59,130,246,0.12)" */
export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
