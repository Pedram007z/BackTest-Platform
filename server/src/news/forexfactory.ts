import { createHash } from 'node:crypto';
import { config } from '../config';
import { DAY_MS, UpstreamError, fetchWithTimeout } from '../util';

/** Same shape as NewsEvent in the web app (src/lib/news.ts). */
export type Impact = 'high' | 'medium' | 'low' | 'holiday';
export interface NewsEvent {
  id: string;
  /** UTC ms */
  time: number;
  currency: string;
  title: string;
  impact: Impact;
  actual?: string;
  forecast?: string;
  previous?: string;
  allDay?: boolean;
  /** from the official release schedule (schedule.ts): the time only, no values */
  scheduled?: boolean;
  /** the exact time was not published (shown at noon local time) */
  tentative?: boolean;
}

/** ForexFactory answered with Cloudflare's bot check instead of the calendar page. */
export class CalendarBlockedError extends UpstreamError {
  constructor() {
    super('ForexFactory درخواست را مسدود کرد (Cloudflare)', 403);
  }
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Sunday (UTC) that starts the ForexFactory week containing `ms`. */
export const weekStart = (ms: number) => {
  const day = Math.floor(ms / DAY_MS) * DAY_MS;
  return day - new Date(day).getUTCDay() * DAY_MS;
};
export const weekKey = (start: number) => new Date(start).toISOString().slice(0, 10);
/** ForexFactory's week parameter, e.g. "jan7.2024". */
export const weekParam = (start: number) => {
  const d = new Date(start);
  return `${MONTHS[d.getUTCMonth()]}${d.getUTCDate()}.${d.getUTCFullYear()}`;
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const clean = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  return s ? s : undefined;
};

function impactOf(name: unknown, cls?: unknown): Impact | null {
  const n = String(name ?? '').toLowerCase();
  if (n === 'high' || n === 'medium' || n === 'low' || n === 'holiday') return n;
  if (n === 'non-economic') return null;
  const c = String(cls ?? '');
  if (c.includes('red')) return 'high';
  if (c.includes('ora')) return 'medium';
  if (c.includes('yel')) return 'low';
  if (c.includes('gra')) return 'holiday';
  return null;
}

/** Index of the bracket that closes the one at `open`, skipping strings. */
function closing(text: string, open: number): number {
  const pair: Record<string, string> = { '[': ']', '{': '}' };
  const stack: string[] = [];
  let inString = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '[' || c === '{') stack.push(pair[c]);
    else if (c === ']' || c === '}') {
      if (stack.pop() !== c) return -1;
      if (!stack.length) return i;
    }
  }
  return -1;
}

/**
 * Events from a ForexFactory calendar page. The page embeds its data as
 * `window.calendarComponentStates[1] = { days: [ { events: [...] } ], ... }`.
 */
export function parseCalendarPage(html: string): NewsEvent[] {
  const at = html.indexOf('calendarComponentStates[1]');
  if (at < 0) {
    if (/Just a moment|cf-chl|challenge-platform/i.test(html)) throw new CalendarBlockedError();
    throw new UpstreamError('ForexFactory: ساختار صفحه‌ی تقویم شناخته نشد');
  }
  const daysAt = html.indexOf('days:', at);
  const open = daysAt < 0 ? -1 : html.indexOf('[', daysAt);
  const close = open < 0 ? -1 : closing(html, open);
  if (close < 0) throw new UpstreamError('ForexFactory: داده‌ی رویدادها خوانده نشد');
  let days: any[];
  try {
    days = JSON.parse(html.slice(open, close + 1));
  } catch {
    throw new UpstreamError('ForexFactory: داده‌ی رویدادها JSON معتبر نیست');
  }
  const out: NewsEvent[] = [];
  for (const day of days) {
    for (const e of day?.events ?? []) {
      const impact = impactOf(e.impactName, e.impactClass);
      const time = Number(e.dateline) * 1000;
      const currency = String(e.currency ?? '').toUpperCase();
      if (!impact || !Number.isFinite(time) || time <= 0 || !currency) continue;
      const label = String(e.timeLabel ?? '');
      out.push({
        id: `ff-${e.id ?? `${currency}-${time}-${e.name}`}`,
        time,
        currency,
        title: String(e.name ?? e.prefixedName ?? '').trim(),
        impact,
        actual: clean(e.actual),
        forecast: clean(e.forecast),
        previous: clean(e.previous),
        allDay: impact === 'holiday' || /all day|day \d/i.test(label) || undefined,
      });
    }
  }
  return out;
}

/** Events from the weekly JSON feed (current week only, no actual values). */
export function parseFeed(items: unknown): NewsEvent[] {
  if (!Array.isArray(items)) throw new UpstreamError('فید ForexFactory آرایه نیست');
  const out: NewsEvent[] = [];
  for (const it of items as any[]) {
    const impact = impactOf(it?.impact);
    const time = Date.parse(String(it?.date ?? ''));
    const currency = String(it?.country ?? '').toUpperCase();
    if (!impact || !Number.isFinite(time) || !currency) continue;
    const title = String(it.title ?? '').trim();
    const id = createHash('sha1').update(`${currency}|${title}|${time}`).digest('hex').slice(0, 12);
    out.push({ id: `ffj-${id}`, time, currency, title, impact, forecast: clean(it.forecast), previous: clean(it.previous), allDay: impact === 'holiday' || undefined });
  }
  return out;
}

export async function fetchWeekPage(start: number): Promise<NewsEvent[]> {
  const url = `${config.forexFactoryUrl}/calendar?week=${weekParam(start)}`;
  const res = await fetchWithTimeout(url, { headers: HEADERS });
  const html = await res.text();
  if (!res.ok && !html.includes('calendarComponentStates')) {
    if (/Just a moment|cf-chl|challenge-platform/i.test(html)) throw new CalendarBlockedError();
    throw new UpstreamError(`ForexFactory: HTTP ${res.status}`, res.status);
  }
  return parseCalendarPage(html);
}

export async function fetchThisWeekFeed(): Promise<NewsEvent[]> {
  const res = await fetchWithTimeout(config.forexFactoryFeedUrl, { headers: { ...HEADERS, Accept: 'application/json' } });
  if (!res.ok) throw new UpstreamError(`فید ForexFactory: HTTP ${res.status}`, res.status);
  return parseFeed(await res.json());
}
