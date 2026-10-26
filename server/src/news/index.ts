import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config';
import { badRequest } from '../http';
import type { NewsHistoryJob, NewsSyncStatus } from '../shared';
import { DAY_MS, isDayKey, keyToMs, limiter, utcDayKey } from '../util';
import { fetchFmpCalendar, fmpConfigured } from './fmp';
import { CalendarBlockedError, fetchThisWeekFeed, fetchWeekPage, weekKey, weekStart, type NewsEvent } from './forexfactory';
import { scheduleCovers, scheduledBetween, scheduleStatus } from './schedule';

/**
 * Calendar events by ForexFactory week. A past week is fetched once and kept (its numbers no
 * longer change); the current and next week are refreshed every NEWS_SYNC_MINUTES. Weeks are
 * fetched when a replay first needs them, one page at a time to stay polite to ForexFactory.
 *
 * ForexFactory's Cloudflare answers most servers' page requests with a bot check. Then the hourly sync
 * asks only for the week in progress, which comes from its official weekly feed (no actual values):
 * kept hourly, each week stays when it ends, so the history grows week by week.
 *
 * Weeks with neither (most of the past, when ForexFactory blocks the server and FMP's plan has no
 * calendar) are filled from the official release schedule (schedule.ts): USD, EUR and GBP events of
 * high and medium impact, with their times but no values.
 */

const WEEK = 7 * DAY_MS;
const RETRY_AFTER_FAIL = 30 * 60_000;
/** After a bot check, the sync asks for no other week's page during this long. */
const PAGES_BLOCKED_MS = 12 * 3_600_000;
let pagesBlockedUntil = 0;

interface WeekRecord {
  fetchedAt: number;
  /** page: ForexFactory's calendar page; feed: its weekly feed (no actual values); fmp: Financial Modeling Prep */
  source: 'page' | 'feed' | 'fmp';
  events: NewsEvent[];
}
interface NewsFile {
  weeks: Record<string, WeekRecord>;
  lastSyncAt?: number;
  lastError?: string;
}

let store: NewsFile = { weeks: {} };
const failures = new Map<string, { at: number; error: string }>();
const inflight = new Map<string, Promise<void>>();
const one = limiter(1);
let writeTimer: NodeJS.Timeout | null = null;

const file = () => join(config.dataDir, 'news.json');

export function loadNews() {
  if (existsSync(file())) {
    try {
      store = JSON.parse(readFileSync(file(), 'utf8'));
      store.weeks ??= {};
    } catch (e) {
      console.warn('[news] could not read news.json, starting empty:', (e as Error).message);
    }
  }
}

function persist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const tmp = `${file()}.tmp`;
    writeFileSync(tmp, JSON.stringify(store));
    renameSync(tmp, file());
  }, 500);
}

export function flushNews() {
  if (!writeTimer) return;
  clearTimeout(writeTimer);
  writeTimer = null;
  writeFileSync(file(), JSON.stringify(store));
}

/** Current and next week change as numbers come out; older weeks are final. */
function isFresh(start: number, rec: WeekRecord | undefined, now = Date.now()): boolean {
  if (!rec) return false;
  const final = start + WEEK + 2 * DAY_MS < now;
  if (final) return rec.source !== 'feed' || rec.fetchedAt > start + WEEK + 2 * DAY_MS;
  return now - rec.fetchedAt < config.newsSyncMinutes * 60_000;
}

/** Fetch one week (page first; the JSON feed covers the current week when the page is blocked). */
function fetchWeek(start: number): Promise<void> {
  const key = weekKey(start);
  const running = inflight.get(key);
  if (running) return running;
  const job = one(async () => {
    const thisWeek = weekStart(Date.now()) === start;
    try {
      const events = await fetchWeekPage(start);
      pagesBlockedUntil = 0;
      store.weeks[key] = { fetchedAt: Date.now(), source: 'page', events };
      failures.delete(key);
    } catch (pageError) {
      if (pageError instanceof CalendarBlockedError) pagesBlockedUntil = Date.now() + PAGES_BLOCKED_MS;
      if (thisWeek) {
        try {
          const events = await fetchThisWeekFeed();
          store.weeks[key] = { fetchedAt: Date.now(), source: 'feed', events };
          failures.delete(key);
          persist();
          return;
        } catch {
          /* report the page error */
        }
      }
      const error = (pageError as Error).message;
      failures.set(key, { at: Date.now(), error });
      throw pageError;
    }
    persist();
  }).finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

/**
 * Events in [from, to). Weeks with no calendar data are filled from the official release schedule
 * (listed in `scheduled`, week start UTC ms); weeks the schedule does not cover either are listed in
 * `missing` so the app can fall back to its sample calendar for them.
 */
export async function eventsBetween(from: number, to: number, waitMs = 12_000): Promise<{ events: NewsEvent[]; missing: number[]; scheduled: number[] }> {
  const now = Date.now();
  const starts: number[] = [];
  for (let s = weekStart(from - DAY_MS); s < to; s += WEEK) if (s <= weekStart(now) + WEEK) starts.push(s);

  const pending: Promise<void>[] = [];
  for (const s of starts) {
    const key = weekKey(s);
    const failed = failures.get(key);
    if (isFresh(s, store.weeks[key]) || (failed && now - failed.at < RETRY_AFTER_FAIL)) continue;
    pending.push(fetchWeek(s).catch(() => undefined));
  }
  if (pending.length) await Promise.race([Promise.all(pending), new Promise((r) => setTimeout(r, waitMs))]);

  const events: NewsEvent[] = [];
  const missing: number[] = [];
  const scheduled: number[] = [];
  for (const s of starts) {
    const rec = store.weeks[weekKey(s)];
    if (rec) {
      for (const e of rec.events) if (e.time >= from && e.time < to) events.push(e);
    } else if (scheduleCovers(s)) {
      scheduled.push(s);
      events.push(...scheduledBetween(Math.max(from, s), Math.min(to, s + WEEK)));
    } else {
      missing.push(s);
    }
  }
  events.sort((a, b) => a.time - b.time);
  return { events, missing, scheduled };
}

export function newsStatus(): NewsSyncStatus {
  const weeks = Object.values(store.weeks);
  const keys = Object.keys(store.weeks).sort();
  return {
    source: 'forexfactory',
    lastSyncAt: store.lastSyncAt,
    events: weeks.reduce((n, w) => n + w.events.length, 0),
    weeks: weeks.length,
    firstWeek: keys[0],
    pagesBlocked: Date.now() < pagesBlockedUntil || undefined,
    lastError: store.lastError,
    schedule: scheduleStatus(),
    history: { configured: fmpConfigured(), job: history ? { ...history } : null, lastJob: lastHistory ? { ...lastHistory } : null },
  };
}

// ---------- history from Financial Modeling Prep ----------
/** Weeks per request (whole ForexFactory weeks, Sunday to Saturday UTC). */
const CHUNK_WEEKS = 4;
let pauseMs = 1500;
let history: NewsHistoryJob | null = null;
let lastHistory: NewsHistoryJob | null = null;
let historyStop = false;
let historyDone: Promise<NewsHistoryJob | null> = Promise.resolve(null);

/** Store weeks from FMP; a week ForexFactory's page gave (with actual values) is kept. */
function keepFmpWeeks(first: number, weeks: number, events: NewsEvent[]): number {
  let kept = 0;
  for (let i = 0; i < weeks; i++) {
    const s = first + i * WEEK;
    const key = weekKey(s);
    const own = events.filter((e) => e.time >= s && e.time < s + WEEK);
    if (!own.length || store.weeks[key]?.source === 'page') continue;
    store.weeks[key] = { fetchedAt: Date.now(), source: 'fmp', events: own };
    kept++;
  }
  persist();
  return kept;
}

async function runHistory(j: NewsHistoryJob): Promise<NewsHistoryJob> {
  const first = weekStart(keyToMs(j.from));
  const last = weekStart(Date.now()) - WEEK;
  const chunks: number[] = [];
  for (let s = first; s <= last; s += CHUNK_WEEKS * WEEK) chunks.push(s);
  j.total = chunks.length;
  try {
    for (const s of chunks) {
      if (historyStop) break;
      const weeks = Math.min(CHUNK_WEEKS, Math.round((last - s) / WEEK) + 1);
      j.current = utcDayKey(s);
      const events = await fetchFmpCalendar(utcDayKey(s), utcDayKey(s + weeks * WEEK - DAY_MS));
      j.events += events.length;
      j.weeks += keepFmpWeeks(s, weeks, events);
      j.done++;
      await new Promise((r) => setTimeout(r, pauseMs));
    }
    j.state = historyStop ? 'stopped' : 'done';
  } catch (e) {
    j.state = 'failed';
    j.message = (e as Error).message;
  }
  j.current = undefined;
  j.finishedAt = Date.now();
  console.log(`[news] history ${j.state}: ${j.weeks} weeks, ${j.events} events from FMP`);
  lastHistory = j;
  history = null;
  historyStop = false;
  return j;
}

/** Fill the calendar's past weeks from FMP, from `from` (default 2015-01-01) to last week. */
export function startCalendarHistory(input: { from?: unknown }): NewsHistoryJob {
  if (!fmpConfigured()) throw badRequest('fmp', 'کلید FMP روی سرور تنظیم نشده است: FMP_API_KEY را در ‎.env‎ بگذارید و سرویس را دوباره راه‌اندازی کنید.');
  if (history) throw badRequest('busy', 'دریافت تاریخچه‌ی تقویم در حال انجام است.');
  const from = input.from === undefined || input.from === '' ? '2015-01-01' : String(input.from);
  if (!isDayKey(from) || keyToMs(from) >= Date.now()) throw badRequest('from', 'تاریخ شروع معتبر نیست.', 'from');
  const j: NewsHistoryJob = { from, state: 'running', total: 0, done: 0, weeks: 0, events: 0, startedAt: Date.now() };
  history = j;
  historyStop = false;
  historyDone = runHistory(j);
  return { ...j };
}

export function stopCalendarHistory() {
  if (history) historyStop = true;
  return history ? { ...history } : null;
}

export const calendarHistoryFinished = () => historyDone;

/** Tests: no pause between requests. */
export function setCalendarHistoryPause(ms: number) {
  pauseMs = ms;
}

/**
 * Refresh this week and next, and fill the last four weeks if they are missing. Weeks a bot check
 * keeps out are not errors: the status says pages are blocked.
 */
export async function syncNews(): Promise<NewsSyncStatus> {
  const now = weekStart(Date.now());
  const errors: string[] = [];
  const note = (s: number) => (e: unknown) => {
    if (!(e instanceof CalendarBlockedError)) errors.push(`${weekKey(s)}: ${(e as Error).message}`);
  };
  await fetchWeek(now).catch(note(now));
  // last week's actual values, which the weekly feed does not have
  if (fmpConfigured() && store.weeks[weekKey(now - WEEK)]?.source !== 'page') {
    await fetchFmpCalendar(utcDayKey(now - WEEK), utcDayKey(now - DAY_MS))
      .then((events) => keepFmpWeeks(now - WEEK, 1, events))
      .catch((e) => errors.push(`FMP ${weekKey(now - WEEK)}: ${(e as Error).message}`));
  }
  // pages blocked: next week and the weeks before would be blocked too
  if (Date.now() >= pagesBlockedUntil) {
    await fetchWeek(now + WEEK).catch(note(now + WEEK));
    for (let i = 1; i <= 4; i++) {
      const s = now - i * WEEK;
      if (!store.weeks[weekKey(s)]) await fetchWeek(s).catch(note(s));
    }
  }
  store.lastSyncAt = Date.now();
  store.lastError = errors.length ? errors.join(' — ') : undefined;
  persist();
  return newsStatus();
}
