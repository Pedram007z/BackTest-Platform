import { db } from '../db';
import { HttpError, badRequest } from '../http';
import type { DataSource, MarketDownloadJob, MarketStorage, MarketStorageSymbol } from '../shared';
import { DAY_MS, isDayKey, keyToMs, utcDayKey } from '../util';
import { INSTRUMENTS, type Instrument } from './instruments';
import { importStatus } from './importer';
import { claimStore, releaseStore } from './lock';
import { QverisBudgetError, qverisDayMinutes } from './qveris';
import { sourceFor } from './source';
import { binanceArchiveDay, binanceArchiveMonth, binanceDayMinutes, binanceDaySeconds, dukascopyDayMinutes, dukascopyDaySeconds, type DayBars } from './sources';
import { MISSING, STORED, dayStatus, refreshCoverage, daysInMonth, monthStartOf, storedBytes, storedSecondDays, writeDays, writeSecondsDay } from './store';

/**
 * Downloads market history from Dukascopy and Binance (or QVeris, when the admin picks it for a market)
 * into the server's storage (store.ts), where the replay reads it. Runs from the admin panel, by itself every hour (missing history and each new
 * day, when "marketAutoDownload" is on), or on any computer with `node server.mjs download`.
 * Only days not stored yet are fetched, so a stopped download resumes where it ended.
 */

/** First day of history the app offers. */
export const HISTORY_START = '2015-01-01';
/** A recent day may not be published yet: an empty answer for it is not stored, and it is asked again later. */
const RECENT_MS = 3 * DAY_MS;
/** This many failed days with no day downloaded in between end the download (the source is unreachable). */
const GIVE_UP_AFTER = 60;
/** Months (1-minute data) or days (1-second data) downloaded at the same time. */
const PARALLEL = 3;
/** Most days of 1-second bars in one download. */
const MAX_SECOND_DAYS = 92;

const yesterday = () => Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS;
export const historyStart = (inst: Instrument) => (inst.since && inst.since > HISTORY_START ? inst.since : HISTORY_START);
/** Markets that close at weekends do not trade on Saturdays (UTC); they are stored as closed without asking. */
const saturday = (inst: Instrument, day: number) => !inst.weekends && new Date(day).getUTCDay() === 6;

let job: MarketDownloadJob | null = null;
let lastJob: MarketDownloadJob | null = null;
let stopping = false;
let finished: Promise<MarketDownloadJob> = Promise.resolve(null as unknown as MarketDownloadJob);

const clone = <T>(v: T): T => (v ? JSON.parse(JSON.stringify(v)) : v);
export const currentDownload = () => clone(job);

interface Item {
  inst: Instrument;
  /** month start (1-minute data) or the day (1-second data) */
  start: number;
  days: number[];
}

/**
 * Months with days not stored yet, per symbol, oldest first. QVeris symbols go newest first: QVeris
 * charges per day, so a daily credit limit fills the recent past first and older years day by day.
 */
function planMinutes(symbols: string[], from: number, to: number): Item[] {
  const items: Item[] = [];
  for (const id of symbols) {
    const inst = INSTRUMENTS[id];
    const first = Math.max(from, keyToMs(historyStart(inst)));
    const own: Item[] = [];
    for (let m = monthStartOf(first); m <= to; m = monthStartOf(m + 32 * DAY_MS)) {
      const days: number[] = [];
      const end = Math.min(to, m + (daysInMonth(m) - 1) * DAY_MS);
      for (let d = Math.max(first, m); d <= end; d += DAY_MS) if (dayStatus(id, d) === MISSING) days.push(d);
      if (days.length) own.push({ inst, start: m, days });
    }
    if (sourceFor(inst) === 'qveris') for (const item of own.reverse()) item.days.reverse();
    items.push(...own);
  }
  return items;
}

function planSeconds(symbols: string[], from: number, to: number): Item[] {
  const items: Item[] = [];
  for (const id of symbols) {
    const inst = INSTRUMENTS[id];
    const have = new Set(storedSecondDays(id));
    for (let d = Math.max(from, keyToMs(historyStart(inst))); d <= to; d += DAY_MS) if (!have.has(utcDayKey(d))) items.push({ inst, start: d, days: [d] });
  }
  return items;
}

/** later: not published yet, or (budget) QVeris' daily credit limit was reached */
type Outcome = { day: number; bars: DayBars } | { day: number; later: true; budget?: true } | { day: number; error: string };

const recent = (day: number) => day + DAY_MS + RECENT_MS > Date.now();
/** A day's answer: an empty one for a recent day is not trusted yet. */
const outcome = (day: number, bars: DayBars): Outcome => (!bars && recent(day) ? { day, later: true } : { day, bars });
/** A failed recent day is usually not published yet: it is tried again by the next run. */
const failure = (day: number, e: unknown): Outcome =>
  e instanceof QverisBudgetError ? { day, later: true, budget: true } : recent(day) ? { day, later: true } : { day, error: (e as Error).message };

const dayMinutes = (source: DataSource, inst: Instrument, d: number) =>
  source === 'binance' ? binanceDayMinutes(inst, d) : source === 'qveris' ? qverisDayMinutes(inst, d) : dukascopyDayMinutes(inst, d);

async function fetchMonth(item: Item): Promise<Outcome[]> {
  const { inst, start } = item;
  const out: Outcome[] = [];
  let want = item.days.filter((d) => {
    if (!saturday(inst, d)) return true;
    out.push({ day: d, bars: null });
    return false;
  });
  const source = sourceFor(inst);
  // Binance: a finished month comes in one archive
  if (source === 'binance' && want.length > 3 && start + daysInMonth(start) * DAY_MS <= yesterday()) {
    const month = await binanceArchiveMonth(inst, start, daysInMonth(start)).catch(() => undefined);
    if (month) {
      for (const d of want) out.push({ day: d, bars: month[Math.round((d - start) / DAY_MS)] });
      want = [];
    }
  }
  await Promise.all(
    want.map(async (d) => {
      try {
        out.push(outcome(d, await dayMinutes(source, inst, d)));
      } catch (e) {
        out.push(failure(d, e));
      }
    }),
  );
  const fresh = new Map<number, DayBars>();
  for (const o of out) if ('bars' in o) fresh.set(new Date(o.day).getUTCDate(), o.bars);
  if (fresh.size) writeDays(inst.id, start, fresh);
  return out;
}

async function fetchSecondsDay(item: Item): Promise<Outcome[]> {
  const { inst, start: d } = item;
  let result: Outcome;
  if (saturday(inst, d)) result = { day: d, bars: null };
  else {
    try {
      // QVeris has no 1-second bars: they come from the symbol's free source
      const chosen = sourceFor(inst);
      const source = chosen === 'qveris' ? (inst.dukascopy ? 'dukascopy' : 'binance') : chosen;
      const bars =
        source === 'binance' ? ((await binanceArchiveDay(inst, d, '1s').catch(() => undefined)) ?? (await binanceDaySeconds(inst, d))) : await dukascopyDaySeconds(inst, d);
      result = outcome(d, bars);
    } catch (e) {
      result = failure(d, e);
    }
  }
  if ('bars' in result) writeSecondsDay(inst.id, d, result.bars);
  return [result];
}

async function run(j: MarketDownloadJob): Promise<MarketDownloadJob> {
  refreshCoverage();
  const from = keyToMs(j.from);
  const to = keyToMs(j.to);
  const items = j.kind === 'm1' ? planMinutes(j.symbols, from, to) : planSeconds(j.symbols, from, to);
  j.total = items.reduce((n, i) => n + i.days.length, 0);
  let streak = 0;
  let next = 0;
  let budget = '';
  const worker = async () => {
    while (next < items.length && !stopping && j.state === 'running') {
      const item = items[next++];
      j.current = `${item.inst.id} ${utcDayKey(item.start).slice(0, j.kind === 'm1' ? 7 : 10)}`;
      const results = await (j.kind === 'm1' ? fetchMonth(item) : fetchSecondsDay(item));
      for (const r of results) {
        j.done++;
        if ('error' in r) {
          j.failed++;
          streak++;
          j.errors.push({ symbol: item.inst.id, day: utcDayKey(r.day), error: r.error });
          if (j.errors.length > 30) j.errors.shift();
        } else if ('later' in r) {
          j.later++;
          if (r.budget) budget = 'سقف روزانه‌ی اعتبار QVeris پر شد؛ روزهای باقی‌مانده در اجراهای بعدی (روزهای بعد) دانلود می‌شوند.';
        } else if (r.bars) {
          j.stored++;
          streak = 0;
        } else j.closed++;
      }
      if (streak >= GIVE_UP_AFTER) {
        j.state = 'failed';
        j.message = `منبع داده پاسخ نمی‌دهد (${GIVE_UP_AFTER} روز پشت سر هم ناموفق): ${j.errors[j.errors.length - 1]?.error ?? ''}`;
      }
    }
  };
  try {
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    if (j.state === 'running') j.state = stopping ? 'stopped' : 'done';
    if (budget && !j.message) j.message = budget;
  } catch (e) {
    j.state = 'failed';
    j.message = (e as Error).message;
  }
  j.current = undefined;
  j.finishedAt = Date.now();
  if (j.total > 0 || j.by !== 'auto') {
    lastJob = j;
    if (j.by !== 'cli') console.log(`[market] download ${j.state}: ${j.stored} days stored, ${j.closed} closed, ${j.failed} failed, ${j.later} not published yet (${j.by})`);
  }
  job = null;
  stopping = false;
  releaseStore('download');
  return j;
}

/** Start a download (one at a time). Without symbols / dates: every symbol's whole history up to yesterday. */
export function startDownload(input: { kind?: unknown; symbols?: unknown; from?: unknown; to?: unknown; by: MarketDownloadJob['by'] }): MarketDownloadJob {
  if (job) throw new HttpError(409, 'busy', 'یک دانلود در حال انجام است؛ صبر کنید تا تمام شود یا آن را متوقف کنید.');
  const kind = input.kind === 's1' ? 's1' : 'm1';
  const all = Object.keys(INSTRUMENTS);
  const symbols = Array.isArray(input.symbols) && input.symbols.length ? [...new Set(input.symbols.map(String))] : kind === 'm1' ? all : [];
  const unknown = symbols.find((s) => !INSTRUMENTS[s]);
  if (unknown) throw badRequest('symbols', `نماد ${unknown} پشتیبانی نمی‌شود.`, 'symbols');
  if (!symbols.length) throw badRequest('symbols', 'نماد را انتخاب کنید.', 'symbols');
  const last = utcDayKey(yesterday());
  const from = input.from === undefined || input.from === '' ? HISTORY_START : String(input.from);
  const to = input.to === undefined || input.to === '' ? last : String(input.to) > last ? last : String(input.to);
  if (!isDayKey(from) || !isDayKey(to) || to < from) throw badRequest('range', 'بازه‌ی تاریخ معتبر نیست.', 'from');
  if (kind === 's1' && (keyToMs(to) - keyToMs(from)) / DAY_MS + 1 > MAX_SECOND_DAYS)
    throw badRequest('range', `داده‌ی ثانیه‌ای حداکثر ${MAX_SECOND_DAYS} روز در هر دانلود.`, 'from');
  claimStore('download');
  const j: MarketDownloadJob = {
    kind,
    symbols,
    from,
    to,
    by: input.by,
    state: 'running',
    total: 0,
    done: 0,
    stored: 0,
    closed: 0,
    failed: 0,
    later: 0,
    errors: [],
    startedAt: Date.now(),
  };
  job = j;
  stopping = false;
  finished = run(j);
  return clone(j);
}

/** Stop after the months (or days) being downloaded now; what was downloaded stays. */
export function stopDownload() {
  if (job) stopping = true;
  return clone(job);
}

/** Resolves when the current download ends (the last one when none is running). */
export const downloadFinished = () => finished;

/** Hourly: fetch what is missing (the whole history the first time, then each new day). */
export function autoDownload() {
  if (job || !db().settings.marketAutoDownload) return;
  const enabled = db().settings.enabledSymbols;
  try {
    startDownload({ by: 'auto', symbols: enabled.length ? enabled : undefined });
  } catch (e) {
    // an import from GitHub holds the storage: the next hour tries again
    if (!(e instanceof HttpError && e.status === 409)) throw e;
  }
}

/** What is stored, per symbol (admin panel). */
export function marketStorage(): MarketStorage {
  if (!job) refreshCoverage();
  const end = yesterday();
  const symbols: MarketStorageSymbol[] = Object.values(INSTRUMENTS).map((inst) => {
    const start = keyToMs(historyStart(inst));
    let days = 0;
    let first: number | undefined;
    let last: number | undefined;
    for (let d = start; d <= end; d += DAY_MS) {
      const st = dayStatus(inst.id, d);
      if (st === MISSING) continue;
      days++;
      if (st === STORED) {
        first ??= d;
        last = d;
      }
    }
    return {
      id: inst.id,
      source: sourceFor(inst),
      start: historyStart(inst),
      days,
      expected: Math.max(0, Math.round((end - start) / DAY_MS) + 1),
      first: first === undefined ? undefined : utcDayKey(first),
      last: last === undefined ? undefined : utcDayKey(last),
      bytes: storedBytes(inst.id),
      secondDays: storedSecondDays(inst.id).length,
    };
  });
  return {
    symbols,
    bytes: symbols.reduce((n, s) => n + s.bytes, 0),
    job: clone(job),
    lastJob: clone(lastJob),
    autoDownload: db().settings.marketAutoDownload,
    import: importStatus(),
  };
}
