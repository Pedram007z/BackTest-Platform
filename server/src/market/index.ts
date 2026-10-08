import { badRequest } from '../http';
import type { DataSource } from '../shared';
import { DAY_MS, isDayKey, keyToMs, utcDayKey } from '../util';
import { INSTRUMENTS, type Instrument } from './instruments';
import { liveQuotes } from './live';
import { sourceFor } from './source';
import { BARS_PER_DAY, HOUR_MS, SECONDS_PER_HOUR, aggregate, type DayBars } from './sources';
import { readDay, readSecondsDay } from './store';

export { sourceFor } from './source';

/**
 * Bars for the replay, read from the server's own storage only (filled by the downloader,
 * download.ts). A chart request never goes to Dukascopy or Binance; a day that is not downloaded yet
 * is reported as such.
 */

const MAX_DAYS = { '5m': 45, '1m': 7 } as const;
const MAX_HOURS = 6;
type DayRes = keyof typeof MAX_DAYS;

export const NOT_DOWNLOADED = 'داده‌ی این روز هنوز روی سرور دانلود نشده است.';

/** A stored day; Saturdays of markets closed at weekends need no download. */
function storedDay(inst: Instrument, dayStart: number): DayBars | undefined {
  const bars = readDay(inst.id, dayStart);
  if (bars === undefined && !inst.weekends && new Date(dayStart).getUTCDay() === 6) return null;
  return bars;
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
export function marketDays(query: URLSearchParams) {
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
  return {
    symbol: inst.id,
    source: sourceFor(inst),
    res,
    days: Array.from({ length: Math.max(0, count) }, (_, i) => {
      const s = first + i * DAY_MS;
      const day = utcDayKey(s);
      const bars = storedDay(inst, s);
      if (bars === undefined) return { day, error: NOT_DOWNLOADED };
      return { day, bars: encode(res === '5m' ? aggregate(bars, 5) : bars, inst.digits) };
    }),
  };
}

const HOUR_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}$/;
const hourToMs = (key: string | null) => (key && HOUR_KEY.test(key) ? Date.parse(`${key}:00:00Z`) : NaN);

/**
 * GET /api/market/seconds?symbol=EURUSD&from=2024-01-15T10&to=2024-01-15T12 (inclusive UTC hours):
 * 3600 one-second bars an hour where they were downloaded; null otherwise (the app then builds second
 * charts from the 1-minute bars).
 */
export function marketSeconds(query: URLSearchParams) {
  const inst = instrumentOf(query);
  const first = hourToMs(query.get('from'));
  const lastAsked = hourToMs(query.get('to'));
  if (!Number.isFinite(first) || !Number.isFinite(lastAsked) || lastAsked < first) throw badRequest('range', 'بازه‌ی ساعت معتبر نیست.');
  const last = Math.min(lastAsked, Math.floor(Date.now() / HOUR_MS) * HOUR_MS);
  const count = Math.floor((last - first) / HOUR_MS) + 1;
  if (count > MAX_HOURS) throw badRequest('range', `حداکثر ${MAX_HOURS} ساعت در هر درخواست.`);
  return {
    symbol: inst.id,
    source: sourceFor(inst),
    hours: Array.from({ length: Math.max(0, count) }, (_, i) => {
      const h = first + i * HOUR_MS;
      const hour = new Date(h).toISOString().slice(0, 13);
      const day = readSecondsDay(inst.id, Math.floor(h / DAY_MS) * DAY_MS);
      if (!day) return { hour, bars: null };
      const at = new Date(h).getUTCHours() * SECONDS_PER_HOUR * 4;
      const bars = day.subarray(at, at + SECONDS_PER_HOUR * 4);
      let traded = false;
      for (let j = 0; j < bars.length && !traded; j += 4) traded = !Number.isNaN(bars[j]);
      return { hour, bars: traded ? encode(bars, inst.digits) : null };
    }),
  };
}

// ---------- landing and sign-in pages ----------
/** Symbols of the sign-in page's ticker strip. */
const SHOWCASE_TICKERS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'BTCUSD', 'USDJPY', 'US30', 'ETHUSD', 'GBPJPY', 'SPX500'];
/** The landing page's sample replay: three fixed days of EURUSD. */
const SAMPLE = { symbol: 'EURUSD', from: '2024-03-04', days: 3 };
let showcase: { at: number; value: Showcase } | null = null;

export interface Showcase {
  /** 5-minute bars as [time (s), open, high, low, close] */
  sample: { symbol: string; bars: number[][] } | null;
  /**
   * change over the last 24 hours of the stored days, in percent; with live prices on, the live price
   * and its change from the previous close instead
   */
  quotes: { symbol: string; change: number; price?: number; live?: true }[];
}

/** Stored 5-minute bars of these days, oldest first. */
function barsOf(inst: Instrument, starts: number[]): { t: number; o: number; h: number; l: number; c: number }[] {
  const out: { t: number; o: number; h: number; l: number; c: number }[] = [];
  for (const s of starts) {
    const v = aggregate(storedDay(inst, s) ?? null, 5);
    if (!v) continue;
    for (let j = 0; j < BARS_PER_DAY; j++) if (!Number.isNaN(v[j * 4])) out.push({ t: s + j * 300_000, o: v[j * 4], h: v[j * 4 + 1], l: v[j * 4 + 2], c: v[j * 4 + 3] });
  }
  return out;
}

function buildShowcase(): Showcase {
  const inst = INSTRUMENTS[SAMPLE.symbol];
  const first = keyToMs(SAMPLE.from);
  const sampleBars = barsOf(
    inst,
    Array.from({ length: SAMPLE.days }, (_, i) => first + i * DAY_MS),
  );
  // the last seven days before today (a long weekend included)
  const yesterday = Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS;
  const week = Array.from({ length: 7 }, (_, i) => yesterday - (6 - i) * DAY_MS);
  const quotes = SHOWCASE_TICKERS.map((symbol) => {
    const bars = barsOf(INSTRUMENTS[symbol], week);
    const last = bars[bars.length - 1];
    if (!last) return null;
    const before = [...bars].reverse().find((b) => b.t <= last.t - DAY_MS);
    return before ? { symbol, change: Math.round(((last.c - before.c) / before.c) * 1e4) / 100 } : null;
  });
  return {
    sample: sampleBars.length
      ? { symbol: SAMPLE.symbol, bars: sampleBars.map((b) => [b.t / 1000, round(b.o, inst.digits), round(b.h, inst.digits), round(b.l, inst.digits), round(b.c, inst.digits)]) }
      : null,
    quotes: quotes.filter((q): q is { symbol: string; change: number } => q !== null),
  };
}

/**
 * GET /api/market/showcase (public): stored prices for the landing page's sample replay and the
 * sign-in page's ticker, or live prices in the ticker when they are on (live.ts).
 */
export async function marketShowcase(): Promise<Showcase> {
  if (!showcase || Date.now() - showcase.at > 5 * 60_000) showcase = { at: Date.now(), value: buildShowcase() };
  const value = showcase.value;
  const live = await liveQuotes(SHOWCASE_TICKERS);
  if (!live.size) return value;
  const stored = new Map(value.quotes.map((q) => [q.symbol, q]));
  return {
    ...value,
    quotes: SHOWCASE_TICKERS.flatMap((symbol) => {
      const q = live.get(symbol);
      if (q) return [{ symbol, change: q.change, price: q.price, live: true as const }];
      const s = stored.get(symbol);
      return s ? [s] : [];
    }),
  };
}

/** Which real source each market uses, for the app's settings. */
export function marketConfig() {
  const sources: Record<string, DataSource> = {};
  for (const inst of Object.values(INSTRUMENTS)) sources[inst.id] = sourceFor(inst);
  return sources;
}
