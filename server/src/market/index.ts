import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from '../config';
import { db } from '../db';
import { badRequest } from '../http';
import type { DataSource } from '../shared';
import { DAY_MS, isDayKey, keyToMs, utcDayKey } from '../util';
import { INSTRUMENTS, type Instrument } from './instruments';
import {
  BARS_PER_DAY,
  HOUR_MS,
  MINUTES_PER_DAY,
  SECONDS_PER_HOUR,
  aggregate,
  binanceDayMinutes,
  binanceDays,
  binanceHour,
  dukascopyDayMinutes,
  dukascopyHour,
  type DayBars,
} from './sources';

/**
 * Bars for the replay, fetched from Dukascopy or Binance (per market, chosen in the admin panel) and
 * kept on disk, so each period is downloaded once:
 * - days of 5-minute bars (the whole history) and of 1-minute bars (1-minute charts),
 * - hours of 1-second bars (second charts; from Dukascopy's tick files or Binance's 1s klines).
 */

const MAX_DAYS = { '5m': 45, '1m': 7 } as const;
const MAX_HOURS = 6;
/** A period is cached once it ended this long ago (late ticks and publishing delay). */
const SETTLE_MS = 6 * 3_600_000;

type Remote = Exclude<DataSource, 'synthetic'>;
type DayRes = keyof typeof MAX_DAYS;

export function sourceFor(inst: Instrument): DataSource {
  const chosen = db().settings.marketData[inst.group];
  if (chosen === 'binance' && inst.binance) return 'binance';
  if (chosen === 'dukascopy' && inst.dukascopy) return 'dukascopy';
  // fall back to whichever real source has the symbol
  return inst.dukascopy ? 'dukascopy' : inst.binance ? 'binance' : 'synthetic';
}

// ---------- disk cache (float32; an empty file is a closed period) ----------
const dayFile = (source: Remote, id: string, day: string, res: DayRes) =>
  join(config.dataDir, 'market', source, id, day.slice(0, 4), `${day.slice(5)}${res === '1m' ? '.m1' : ''}.f32`);
const hourFile = (source: Remote, id: string, hour: number) => {
  const key = new Date(hour).toISOString();
  return join(config.dataDir, 'market', source, id, key.slice(0, 4), key.slice(5, 10), `${key.slice(11, 13)}.s1.f32`);
};

function readCache(file: string, bars: number): DayBars | undefined {
  if (!existsSync(file)) return undefined;
  const buf = readFileSync(file);
  if (buf.length === 0) return null;
  if (buf.length !== bars * 4 * 4) return undefined;
  return Float64Array.from(new Float32Array(buf.buffer, buf.byteOffset, bars * 4));
}

function writeCache(file: string, bars: DayBars) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, bars ? Buffer.from(Float32Array.from(bars).buffer) : Buffer.alloc(0));
  renameSync(tmp, file);
}

const settled = (periodEnd: number) => periodEnd + SETTLE_MS < Date.now();

/** One download per key at a time, shared by concurrent requests. */
const inflight = new Map<string, Promise<unknown>>();
function shared<T>(key: string, run: () => Promise<T>): Promise<T> {
  let p = inflight.get(key) as Promise<T> | undefined;
  if (!p) {
    p = run().finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

const closedDay = (inst: Instrument, s: number) => !inst.weekends && new Date(s).getUTCDay() === 6;

/** Dukascopy publishes one minute file per day: it fills both the 1-minute and the 5-minute cache. */
async function dukascopyBoth(inst: Instrument, s: number): Promise<{ m1: DayBars; m5: DayBars }> {
  return shared(`dukascopy:${inst.id}:${s}`, async () => {
    const m1 = closedDay(inst, s) ? null : await dukascopyDayMinutes(inst, s);
    const m5 = aggregate(m1, 5);
    if (settled(s + DAY_MS)) {
      writeCache(dayFile('dukascopy', inst.id, utcDayKey(s), '1m'), m1);
      writeCache(dayFile('dukascopy', inst.id, utcDayKey(s), '5m'), m5);
    }
    return { m1, m5 };
  });
}

async function loadDays(inst: Instrument, source: Remote, starts: number[], res: DayRes): Promise<Map<number, DayBars | Error>> {
  const result = new Map<number, DayBars | Error>();
  const per = res === '1m' ? MINUTES_PER_DAY : BARS_PER_DAY;
  const todo: number[] = [];
  for (const s of starts) {
    const hit = readCache(dayFile(source, inst.id, utcDayKey(s), res), per);
    if (hit !== undefined) result.set(s, hit);
    else todo.push(s);
  }
  const keep = (s: number, job: Promise<DayBars>) =>
    job.then(
      (bars) => void result.set(s, bars),
      (e: Error) => void result.set(s, e),
    );
  const store = (s: number, bars: DayBars) => {
    if (settled(s + DAY_MS)) writeCache(dayFile(source, inst.id, utcDayKey(s), res), bars);
    return bars;
  };

  const jobs: Promise<void>[] = [];
  if (source === 'dukascopy') {
    // weekends never trade outside crypto; Saturdays are not requested
    for (const s of todo)
      jobs.push(
        keep(
          s,
          dukascopyBoth(inst, s).then((b) => (res === '1m' ? b.m1 : b.m5)),
        ),
      );
  } else if (res === '1m') {
    for (const s of todo)
      jobs.push(
        keep(
          s,
          shared(`binance:1m:${inst.id}:${s}`, async () => store(s, await binanceDayMinutes(inst, s))),
        ),
      );
  } else {
    // consecutive missing days in groups of three per request
    for (let i = 0; i < todo.length;) {
      const group = [todo[i]];
      while (group.length < 3 && todo[i + group.length] === group[0] + group.length * DAY_MS) group.push(todo[i + group.length]);
      i += group.length;
      const batch = binanceDays(inst, group[0], group.length);
      group.forEach((s, k) =>
        jobs.push(
          keep(
            s,
            shared(`binance:5m:${inst.id}:${s}`, async () => store(s, (await batch)[k])),
          ),
        ),
      );
    }
  }
  await Promise.all(jobs);
  return result;
}

async function loadHours(inst: Instrument, source: Remote, starts: number[]): Promise<Map<number, DayBars | Error>> {
  const result = new Map<number, DayBars | Error>();
  await Promise.all(
    starts.map(async (h) => {
      const file = hourFile(source, inst.id, h);
      const hit = readCache(file, SECONDS_PER_HOUR);
      if (hit !== undefined) return void result.set(h, hit);
      try {
        const bars = await shared(`${source}:1s:${inst.id}:${h}`, async () => {
          const b = source === 'dukascopy' ? (closedDay(inst, h) ? null : await dukascopyHour(inst, h)) : await binanceHour(inst, h);
          if (settled(h + HOUR_MS)) writeCache(file, b);
          return b;
        });
        result.set(h, bars);
      } catch (e) {
        result.set(h, e as Error);
      }
    }),
  );
  return result;
}

const round = (v: number, digits: number) => {
  const m = 10 ** (digits + 1);
  return Math.round(v * m) / m;
};
const encode = (bars: DayBars, digits: number) => (bars ? Array.from(bars, (x) => (Number.isNaN(x) ? null : round(x, digits))) : null);

function instrumentOf(query: URLSearchParams): Instrument {
  const inst = INSTRUMENTS[query.get('symbol') ?? ''];
  if (!inst) throw badRequest('symbol', 'نماد پشتیبانی نمی‌شود.', 'symbol');
  return inst;
}

/**
 * GET /api/market/days?symbol=EURUSD&from=2024-01-01&to=2024-01-31[&res=1m] (inclusive UTC days).
 * res=5m (default): 288 five-minute bars a day; res=1m: 1440 one-minute bars a day.
 */
export async function marketDays(query: URLSearchParams) {
  const inst = instrumentOf(query);
  const res = (query.get('res') ?? '5m') as DayRes;
  if (!(res in MAX_DAYS)) throw badRequest('res', 'دقت داده معتبر نیست.', 'res');
  const from = query.get('from');
  const to = query.get('to');
  if (!isDayKey(from) || !isDayKey(to) || to < from) throw badRequest('range', 'بازه‌ی تاریخ معتبر نیست.');
  const first = keyToMs(from);
  const last = Math.min(keyToMs(to), Math.floor(Date.now() / DAY_MS) * DAY_MS);
  const count = Math.floor((last - first) / DAY_MS) + 1;
  if (count > MAX_DAYS[res]) throw badRequest('range', `حداکثر ${MAX_DAYS[res]} روز در هر درخواست.`);

  const source = sourceFor(inst);
  if (source === 'synthetic') return { symbol: inst.id, source, res, days: [] };
  const starts = Array.from({ length: Math.max(0, count) }, (_, i) => first + i * DAY_MS);
  const loaded = await loadDays(inst, source, starts, res);
  return {
    symbol: inst.id,
    source,
    res,
    days: starts.map((s) => {
      const v = loaded.get(s);
      const day = utcDayKey(s);
      if (v instanceof Error) return { day, error: v.message };
      return { day, bars: encode(v ?? null, inst.digits) };
    }),
  };
}

const HOUR_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}$/;
const hourToMs = (key: string | null) => (key && HOUR_KEY.test(key) ? Date.parse(`${key}:00:00Z`) : NaN);

/**
 * GET /api/market/seconds?symbol=EURUSD&from=2024-01-15T10&to=2024-01-15T12 (inclusive UTC hours):
 * 3600 one-second bars an hour.
 */
export async function marketSeconds(query: URLSearchParams) {
  const inst = instrumentOf(query);
  const first = hourToMs(query.get('from'));
  const lastAsked = hourToMs(query.get('to'));
  if (!Number.isFinite(first) || !Number.isFinite(lastAsked) || lastAsked < first) throw badRequest('range', 'بازه‌ی ساعت معتبر نیست.');
  const last = Math.min(lastAsked, Math.floor(Date.now() / HOUR_MS) * HOUR_MS);
  const count = Math.floor((last - first) / HOUR_MS) + 1;
  if (count > MAX_HOURS) throw badRequest('range', `حداکثر ${MAX_HOURS} ساعت در هر درخواست.`);

  const source = sourceFor(inst);
  if (source === 'synthetic') return { symbol: inst.id, source, hours: [] };
  const starts = Array.from({ length: Math.max(0, count) }, (_, i) => first + i * HOUR_MS);
  const loaded = await loadHours(inst, source, starts);
  return {
    symbol: inst.id,
    source,
    hours: starts.map((h) => {
      const v = loaded.get(h);
      const hour = new Date(h).toISOString().slice(0, 13);
      if (v instanceof Error) return { hour, error: v.message };
      return { hour, bars: encode(v ?? null, inst.digits) };
    }),
  };
}

// ---------- landing and sign-in pages ----------
/** Symbols of the sign-in page's ticker strip. */
const SHOWCASE_TICKERS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'BTCUSD', 'USDJPY', 'US30', 'ETHUSD', 'GBPJPY', 'SPX500'];
/** The landing page's sample replay: three fixed days of EURUSD, downloaded once. */
const SAMPLE = { symbol: 'EURUSD', from: '2024-03-04', days: 3 };
let showcase: { at: number; ttl: number; value: Promise<Showcase> } | null = null;

export interface Showcase {
  /** 5-minute bars as [time (s), open, high, low, close] */
  sample: { symbol: string; bars: number[][] } | null;
  /** change over the last 24 hours of the last settled days, in percent */
  quotes: { symbol: string; change: number }[];
}

/** Bars of these days, oldest first, as [time (ms), close] and the full rows. */
async function barsOf(inst: Instrument, starts: number[]): Promise<{ t: number; o: number; h: number; l: number; c: number }[]> {
  const source = sourceFor(inst);
  if (source === 'synthetic') return [];
  const loaded = await loadDays(inst, source, starts, '5m');
  const out: { t: number; o: number; h: number; l: number; c: number }[] = [];
  for (const s of starts) {
    const v = loaded.get(s);
    if (!(v instanceof Float64Array)) continue;
    for (let j = 0; j < BARS_PER_DAY; j++) if (!Number.isNaN(v[j * 4])) out.push({ t: s + j * 300_000, o: v[j * 4], h: v[j * 4 + 1], l: v[j * 4 + 2], c: v[j * 4 + 3] });
  }
  return out;
}

async function buildShowcase(): Promise<Showcase> {
  const inst = INSTRUMENTS[SAMPLE.symbol];
  const first = keyToMs(SAMPLE.from);
  const sampleBars = await barsOf(
    inst,
    Array.from({ length: SAMPLE.days }, (_, i) => first + i * DAY_MS),
  ).catch(() => []);
  // the last seven settled days (a long weekend included)
  const yesterday = Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS;
  const week = Array.from({ length: 7 }, (_, i) => yesterday - (6 - i) * DAY_MS);
  const quotes = await Promise.all(
    SHOWCASE_TICKERS.map(async (symbol) => {
      const bars = await barsOf(INSTRUMENTS[symbol], week).catch(() => []);
      const last = bars[bars.length - 1];
      if (!last) return null;
      const before = [...bars].reverse().find((b) => b.t <= last.t - DAY_MS);
      return before ? { symbol, change: Math.round(((last.c - before.c) / before.c) * 1e4) / 100 } : null;
    }),
  );
  return {
    sample: sampleBars.length
      ? { symbol: SAMPLE.symbol, bars: sampleBars.map((b) => [b.t / 1000, round(b.o, inst.digits), round(b.h, inst.digits), round(b.l, inst.digits), round(b.c, inst.digits)]) }
      : null,
    quotes: quotes.filter((q): q is { symbol: string; change: number } => q !== null),
  };
}

/** GET /api/market/showcase (public): real prices for the landing page's sample replay and the sign-in page's ticker. */
export function marketShowcase(): Promise<Showcase> {
  if (!showcase || Date.now() - showcase.at > showcase.ttl) {
    const value = buildShowcase();
    const entry = { at: Date.now(), ttl: 60 * 60_000, value };
    showcase = entry;
    // an incomplete answer is tried again sooner
    void value.then((v) => {
      if (!v.sample || v.quotes.length < SHOWCASE_TICKERS.length) entry.ttl = 5 * 60_000;
    });
  }
  return showcase.value;
}

/** Which real source each market uses, for the app's settings. */
export function marketConfig() {
  const sources: Record<string, DataSource> = {};
  for (const inst of Object.values(INSTRUMENTS)) sources[inst.id] = sourceFor(inst);
  return sources;
}
