import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config';
import type { NewsSyncStatus } from '../shared';
import { DAY_MS, limiter } from '../util';
import { CalendarBlockedError, fetchThisWeekFeed, fetchWeekPage, weekKey, weekStart, type NewsEvent } from './forexfactory';

/**
 * Calendar events by ForexFactory week. A past week is fetched once and kept (its numbers no
 * longer change); the current and next week are refreshed every NEWS_SYNC_MINUTES. Weeks are
 * fetched when a replay first needs them, one page at a time to stay polite to ForexFactory.
 *
 * ForexFactory's Cloudflare answers most servers' page requests with a bot check. Then the hourly sync
 * asks only for the week in progress, which comes from its official weekly feed (no actual values):
 * kept hourly, each week stays when it ends, so the history grows week by week.
 */

const WEEK = 7 * DAY_MS;
const RETRY_AFTER_FAIL = 30 * 60_000;
/** After a bot check, the sync asks for no other week's page during this long. */
const PAGES_BLOCKED_MS = 12 * 3_600_000;
let pagesBlockedUntil = 0;

interface WeekRecord {
  fetchedAt: number;
  source: 'page' | 'feed';
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
  if (final) return rec.source === 'page' || rec.fetchedAt > start + WEEK + 2 * DAY_MS;
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
 * Events in [from, to). Weeks that cannot be fetched are listed in `missing` (week start, UTC ms)
 * so the app can fall back to its sample calendar for them.
 */
export async function eventsBetween(from: number, to: number, waitMs = 12_000): Promise<{ events: NewsEvent[]; missing: number[] }> {
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
  for (const s of starts) {
    const rec = store.weeks[weekKey(s)];
    if (!rec) {
      missing.push(s);
      continue;
    }
    for (const e of rec.events) if (e.time >= from && e.time < to) events.push(e);
  }
  events.sort((a, b) => a.time - b.time);
  return { events, missing };
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
  };
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
