import { config } from '../config';
import { DAY_MS, UpstreamError, fetchWithTimeout, limiter } from '../util';
import type { Instrument } from './instruments';
import { lzmaDecompress } from './lzma';

/**
 * Real bars for the replay: a Float64Array of n × [open, high, low, close] (NaN where there was no
 * trading), or null when the market was closed for the whole period. Days hold 288 five-minute or
 * 1440 one-minute bars; hours hold 3600 one-second bars.
 */
export type DayBars = Float64Array | null;

export const BARS_PER_DAY = 288;
export const MINUTES_PER_DAY = 1440;
export const SECONDS_PER_HOUR = 3600;
export const HOUR_MS = 3_600_000;

const dukascopyQueue = limiter(8);
const binanceQueue = limiter(4);

const empty = (n: number) => new Float64Array(n * 4).fill(NaN);

function addToBar(out: Float64Array, j: number, o: number, h: number, l: number, c: number) {
  const b = j * 4;
  if (Number.isNaN(out[b])) {
    out[b] = o;
    out[b + 1] = h;
    out[b + 2] = l;
    out[b + 3] = c;
    return;
  }
  if (h > out[b + 1]) out[b + 1] = h;
  if (l < out[b + 2]) out[b + 2] = l;
  out[b + 3] = c;
}

const hasBars = (out: Float64Array) => {
  for (let j = 0; j < out.length; j += 4) if (!Number.isNaN(out[j])) return true;
  return false;
};

/** Merge every `per` bars into one (1-minute → 5-minute with per = 5). */
export function aggregate(bars: DayBars, per: number): DayBars {
  if (!bars) return null;
  const n = bars.length / 4 / per;
  const out = empty(n);
  for (let j = 0; j < n * per; j++) {
    const b = j * 4;
    if (!Number.isNaN(bars[b])) addToBar(out, Math.floor(j / per), bars[b], bars[b + 1], bars[b + 2], bars[b + 3]);
  }
  return hasBars(out) ? out : null;
}

/**
 * Decode a Dukascopy BID_candles_min_1 file into 1440 one-minute bars: 24-byte big-endian records of
 * [seconds from midnight UTC, open, close, low, high (integers ÷ factor), volume (float)].
 * Minutes with no volume and no movement are gaps (market closed), not bars.
 */
export function parseDukascopyMinuteBars(raw: Uint8Array, factor: number): DayBars {
  if (raw.length === 0) return null;
  const data = lzmaDecompress(raw);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // Guard against a different field order (open, high, low, close): in the documented order
  // nearly every record satisfies low <= open, close <= high.
  let bad = 0;
  let n = 0;
  for (let off = 0; off + 24 <= data.length; off += 24, n++) {
    const o = view.getInt32(off + 4);
    const c = view.getInt32(off + 8);
    const l = view.getInt32(off + 12);
    const h = view.getInt32(off + 16);
    if (l > Math.min(o, c) || h < Math.max(o, c)) bad++;
  }
  const ohlc = n > 0 && bad / n > 0.3;
  const out = empty(MINUTES_PER_DAY);
  for (let off = 0; off + 24 <= data.length; off += 24) {
    const sec = view.getInt32(off);
    const o = view.getInt32(off + 4);
    const c = view.getInt32(off + (ohlc ? 16 : 8));
    const l = view.getInt32(off + 12);
    const h = view.getInt32(off + (ohlc ? 8 : 16));
    const vol = view.getFloat32(off + 20);
    if (vol === 0 && o === c && h === l && o === h) continue;
    const j = Math.floor(sec / 60);
    if (j < 0 || j >= MINUTES_PER_DAY) continue;
    addToBar(out, j, o / factor, h / factor, l / factor, c / factor);
  }
  return hasBars(out) ? out : null;
}

/** The same file as 288 five-minute bars. */
export const parseDukascopyMinutes = (raw: Uint8Array, factor: number): DayBars => aggregate(parseDukascopyMinuteBars(raw, factor), 5);

/**
 * Decode a Dukascopy {HH}h_ticks file into 3600 one-second bars of the bid: 20-byte big-endian
 * records of [milliseconds into the hour, ask, bid (integers ÷ factor), ask volume, bid volume].
 */
export function parseDukascopyTicks(raw: Uint8Array, factor: number): DayBars {
  if (raw.length === 0) return null;
  const data = lzmaDecompress(raw);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const out = empty(SECONDS_PER_HOUR);
  for (let off = 0; off + 20 <= data.length; off += 20) {
    const j = Math.floor(view.getUint32(off) / 1000);
    if (j < 0 || j >= SECONDS_PER_HOUR) continue;
    const bid = view.getUint32(off + 8) / factor;
    addToBar(out, j, bid, bid, bid, bid);
  }
  return hasBars(out) ? out : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Dukascopy folders count months from 0. */
const dukascopyDir = (name: string, ms: number) => {
  const d = new Date(ms);
  return `${config.dukascopyUrl}/${name}/${d.getUTCFullYear()}/${pad(d.getUTCMonth())}/${pad(d.getUTCDate())}`;
};

async function dukascopyFile(url: string, periodEnd: number, label: string): Promise<Uint8Array | null> {
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 backtest-dashboard' } });
  if (res.status === 404) {
    // Periods well in the past without a file had no trading; recent ones may simply not be published yet.
    if (periodEnd + 2 * DAY_MS < Date.now()) return null;
    throw new UpstreamError(`Dukascopy: ${label} هنوز منتشر نشده`, 404);
  }
  if (!res.ok) throw new UpstreamError(`Dukascopy: HTTP ${res.status}`, res.status);
  return new Uint8Array(await res.arrayBuffer());
}

/** One UTC day as 1440 one-minute bars. */
export async function dukascopyDayMinutes(inst: Instrument, dayStart: number): Promise<DayBars> {
  if (!inst.dukascopy) throw new UpstreamError(`${inst.id} در Dukascopy موجود نیست`);
  const { name, factor } = inst.dukascopy;
  return dukascopyQueue(async () => {
    const raw = await dukascopyFile(`${dukascopyDir(name, dayStart)}/BID_candles_min_1.bi5`, dayStart, `${name} ${new Date(dayStart).toISOString().slice(0, 10)}`);
    return raw ? parseDukascopyMinuteBars(raw, factor) : null;
  });
}

/** One UTC day as 288 five-minute bars. */
export async function dukascopyDay(inst: Instrument, dayStart: number): Promise<DayBars> {
  return aggregate(await dukascopyDayMinutes(inst, dayStart), 5);
}

/** One UTC hour as 3600 one-second bars, from the tick file. */
export async function dukascopyHour(inst: Instrument, hourStart: number): Promise<DayBars> {
  if (!inst.dukascopy) throw new UpstreamError(`${inst.id} در Dukascopy موجود نیست`);
  const { name, factor } = inst.dukascopy;
  return dukascopyQueue(async () => {
    const hh = pad(new Date(hourStart).getUTCHours());
    const raw = await dukascopyFile(`${dukascopyDir(name, hourStart)}/${hh}h_ticks.bi5`, hourStart, `${name} ${new Date(hourStart).toISOString().slice(0, 13)}h`);
    return raw ? parseDukascopyTicks(raw, factor) : null;
  });
}

/**
 * Binance klines rows [openTime, open, high, low, close, ...] into `count` consecutive periods of
 * `spanMs` (days by default) holding bars of `barMs` (five minutes by default).
 */
export function parseBinanceKlines(rows: unknown, first: number, count: number, spanMs = DAY_MS, barMs = 300_000): DayBars[] {
  if (!Array.isArray(rows)) throw new UpstreamError('Binance: پاسخ نامعتبر');
  const perPeriod = spanMs / barMs;
  const out = Array.from({ length: count }, () => empty(perPeriod));
  for (const r of rows as unknown[][]) {
    const t = Number(r[0]);
    const i = Math.floor((t - first) / spanMs);
    if (i < 0 || i >= count) continue;
    const j = Math.floor((t - (first + i * spanMs)) / barMs);
    addToBar(out[i], j, Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]));
  }
  return out.map((d) => (hasBars(d) ? d : null));
}

/** Klines of [start, end], 1000 per request. */
async function binanceKlines(inst: Instrument, interval: string, start: number, end: number, barMs: number): Promise<unknown[][]> {
  if (!inst.binance) throw new UpstreamError(`${inst.id} در Binance موجود نیست`);
  const rows: unknown[][] = [];
  for (let from = start; from <= end; from += 1000 * barMs) {
    const q = new URLSearchParams({ symbol: inst.binance, interval, startTime: String(from), endTime: String(Math.min(end, from + 1000 * barMs - 1)), limit: '1000' });
    const page = await binanceQueue(async () => {
      const res = await fetchWithTimeout(`${config.binanceUrl}/api/v3/klines?${q}`);
      const body = await res.text();
      if (!res.ok) {
        const restricted = res.status === 451 || res.status === 403;
        throw new UpstreamError(restricted ? 'Binance دسترسی این سرور را محدود کرده است (تحریم/منطقه)' : `Binance: HTTP ${res.status} ${body.slice(0, 120)}`, res.status);
      }
      return JSON.parse(body) as unknown;
    });
    if (!Array.isArray(page)) throw new UpstreamError('Binance: پاسخ نامعتبر');
    rows.push(...(page as unknown[][]));
  }
  return rows;
}

/** Up to three consecutive days of five-minute bars (864 bars fit in one request). */
export async function binanceDays(inst: Instrument, firstDay: number, days: number): Promise<DayBars[]> {
  return parseBinanceKlines(await binanceKlines(inst, '5m', firstDay, firstDay + days * DAY_MS - 1, 300_000), firstDay, days);
}

/** One UTC day of one-minute bars (two requests). */
export async function binanceDayMinutes(inst: Instrument, dayStart: number): Promise<DayBars> {
  return parseBinanceKlines(await binanceKlines(inst, '1m', dayStart, dayStart + DAY_MS - 1, 60_000), dayStart, 1, DAY_MS, 60_000)[0];
}

/** One UTC hour of one-second bars (four requests). */
export async function binanceHour(inst: Instrument, hourStart: number): Promise<DayBars> {
  return parseBinanceKlines(await binanceKlines(inst, '1s', hourStart, hourStart + HOUR_MS - 1, 1000), hourStart, 1, HOUR_MS, 1000)[0];
}
