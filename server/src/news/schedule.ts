import { DAY_MS } from '../util';
import type { Impact, NewsEvent } from './forexfactory';
import centralBanks from './schedule/central-banks.json';
import deReleases from './schedule/de-releases.json';
import euReleases from './schedule/eu-releases.json';
import ukReleases from './schedule/uk-releases.json';
import usReleases from './schedule/us-releases.json';

/**
 * When economic events happened since 2015, from the official sources (collected by tools/calendar):
 * release times only, no actual, forecast or previous values. The platform uses the US dollar, euro and
 * pound events of high and medium impact; calendar weeks with no ForexFactory or FMP data are filled
 * from them (see eventsBetween).
 */

export const SCHEDULE_CURRENCIES = ['USD', 'EUR', 'GBP'];
const IMPACTS: Impact[] = ['high', 'medium'];
const WEEK = 7 * DAY_MS;
/** The schedule's first day; weeks before it have none of its events. */
const FROM = Date.UTC(2015, 0, 1);

interface Entry {
  id: string;
  time: number;
  currency: string;
  title: string;
  impact: string;
  tentative?: boolean;
}

const events: NewsEvent[] = ([centralBanks, usReleases, euReleases, deReleases, ukReleases] as Entry[][])
  .flat()
  .filter((e) => SCHEDULE_CURRENCIES.includes(e.currency) && IMPACTS.includes(e.impact as Impact))
  .map((e) => ({ id: e.id, time: e.time, currency: e.currency, title: e.title, impact: e.impact as Impact, scheduled: true, ...(e.tentative ? { tentative: true } : {}) }))
  .sort((a, b) => a.time - b.time);

/** The last scheduled event: weeks after it are not covered (the sources publish about a year ahead). */
const TO = events.length ? events[events.length - 1].time : 0;

/** Whether the week starting at `start` (UTC ms) lies within the schedule. */
export const scheduleCovers = (start: number) => start + WEEK > FROM && start <= TO;

/** First index with time >= t. */
function lowerBound(t: number) {
  let lo = 0;
  let hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].time < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Scheduled events in [from, to). */
export function scheduledBetween(from: number, to: number): NewsEvent[] {
  const out: NewsEvent[] = [];
  for (let i = lowerBound(from); i < events.length && events[i].time < to; i++) out.push({ ...events[i] });
  return out;
}

export function scheduleStatus() {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { events: events.length, from: day(FROM), to: day(TO), currencies: SCHEDULE_CURRENCIES };
}
