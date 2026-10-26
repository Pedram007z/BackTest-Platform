import { config } from '../config';
import { DAY_MS, UpstreamError, fetchWithTimeout, limiter } from '../util';
import type { Instrument } from './instruments';
import { lzmaDecompress } from './lzma';
import { unzip } from './zip';

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

// ---------- Dukascopy ----------
/**
 * Dukascopy serves the same history two ways: its data API (JSON, used by dukascopy-node since
 * 2026) and the older datafeed (LZMA-packed .bi5 files). The API is tried first; when it cannot be
 * reached or does not answer with data, the datafeed is used.
 */

/** Instrument code in the data API: EUR-USD, XAU-USD, USA30.IDX-USD, LIGHT.CMD-USD. */
export function dukascopyCode(name: string): string {
  const m = /^(.+?)(IDX|CMD)([A-Z]{3})$/.exec(name);
  return m ? `${m[1]}.${m[2]}-${m[3]}` : `${name.slice(0, 3)}-${name.slice(3)}`;
}

/** Decimals of a price step such as 0.00001 or 1e-5. */
function decimalsOf(multiplier: number): number {
  const [coef, exp = '0'] = multiplier.toString().toLowerCase().split('e');
  return Math.max(0, (coef.split('.')[1]?.length ?? 0) - Number(exp));
}

const isNums = (v: unknown, n: number): v is number[] => Array.isArray(v) && v.length === n && v.every((x) => Number.isFinite(x));
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Data API candles into `count` bars of `barMs` from `start`. The reply holds a base candle and, per
 * bar, the time step (in bars) and the price changes (in steps of `multiplier`) from the previous one.
 * Minutes without volume or movement are gaps (market closed), as in the datafeed files.
 */
export function parseDukascopyApiCandles(data: unknown, start: number, count: number, barMs: number): DayBars {
  const d = data as Record<string, unknown> | null;
  const n = Array.isArray(d?.times) ? d.times.length : -1;
  if (!d || n < 0 || !num(d.timestamp)) throw new UpstreamError('Dukascopy API: پاسخ نامعتبر');
  if (n === 0) return null;
  if (!num(d.multiplier) || d.multiplier <= 0 || !num(d.shift) || d.shift <= 0 || ![d.open, d.high, d.low, d.close].every(num))
    throw new UpstreamError('Dukascopy API: پاسخ نامعتبر');
  if (![d.times, d.opens, d.highs, d.lows, d.closes].every((c) => isNums(c, n))) throw new UpstreamError('Dukascopy API: پاسخ نامعتبر');
  const times = d.times as number[];
  const [opens, highs, lows, closes] = [d.opens, d.highs, d.lows, d.closes] as number[][];
  const volumes = Array.isArray(d.volumes) && d.volumes.length === n ? (d.volumes as number[]) : null;
  const mult = d.multiplier;
  const scale = decimalsOf(mult);
  const px = (units: number) => Number((units * mult).toFixed(scale));
  let t = d.timestamp;
  let o = Math.round((d.open as number) / mult);
  let h = Math.round((d.high as number) / mult);
  let l = Math.round((d.low as number) / mult);
  let c = Math.round((d.close as number) / mult);
  const out = empty(count);
  for (let i = 0; i < n; i++) {
    t += times[i] * d.shift;
    o += opens[i];
    h += highs[i];
    l += lows[i];
    c += closes[i];
    if (volumes && volumes[i] === 0 && o === c && h === l && o === h) continue;
    const j = Math.floor((t - start) / barMs);
    if (j < 0 || j >= count) continue;
    addToBar(out, j, px(o), px(h), px(l), px(c));
  }
  return hasBars(out) ? out : null;
}

/** Data API ticks of one hour into 3600 one-second bars of the bid (times in ms, prices in steps). */
export function parseDukascopyApiTicks(data: unknown, hourStart: number): DayBars {
  const d = data as Record<string, unknown> | null;
  const n = Array.isArray(d?.times) ? d.times.length : -1;
  if (!d || n < 0 || !num(d.timestamp)) throw new UpstreamError('Dukascopy API: پاسخ نامعتبر');
  if (n === 0) return null;
  if (!num(d.multiplier) || d.multiplier <= 0 || !num(d.bid) || !isNums(d.times, n) || !isNums(d.bids, n)) throw new UpstreamError('Dukascopy API: پاسخ نامعتبر');
  const mult = d.multiplier;
  const scale = decimalsOf(mult);
  const times = d.times;
  const bids = d.bids;
  let t = d.timestamp;
  let bid = Math.round(d.bid / mult);
  const out = empty(SECONDS_PER_HOUR);
  for (let i = 0; i < n; i++) {
    t += times[i];
    bid += bids[i];
    const j = Math.floor((t - hourStart) / 1000);
    if (j < 0 || j >= SECONDS_PER_HOUR) continue;
    const p = Number((bid * mult).toFixed(scale));
    addToBar(out, j, p, p, p, p);
  }
  return hasBars(out) ? out : null;
}

/**
 * Dukascopy's firewall (AWS WAF) answers with a challenge page (HTTP 202, header x-amzn-waf-action:
 * challenge) instead of data when a browser-like User-Agent comes from a program, so the downloader
 * names itself plainly, and when one address sends too many requests: tens of thousands at about 50 a
 * second set it off for every request from that address for a while.
 */
const DUKASCOPY_UA = 'backtestlab-downloader';

/** After the data API could not be reached several times in a row, the datafeed is used alone for a while. */
const API_PAUSE_MS = 10 * 60_000;
const API_ERRORS_BEFORE_PAUSE = 5;
let apiPausedUntil = 0;
let apiErrorsInARow = 0;

/**
 * Requests to Dukascopy start at most `config.dukascopyRate` a second. A challenge pauses every
 * Dukascopy request for five minutes (the firewall counts requests over five minutes) and asks again;
 * the first challenge after answers also halves the rate; the rate creeps back up after a thousand answers without one. Dukascopy also refuses
 * a share of requests with 429 (too many requests) or 503: those are asked again after a pause that
 * doubles each time (or what Retry-After says), and many in a row pause every request for a while. A
 * timeout or dropped connection is tried again twice.
 */
const RETRIES = 8;
const CHALLENGE_RETRIES = 3;
const NETWORK_RETRIES = 2;
let retryMs = 500;
let refusedInARow = 0;
let refusedUntil = 0;
let gapMs = 1000 / config.dukascopyRate;
let nextStart = 0;
let calm = 0;
/** Dukascopy answered since the last challenge: a new challenge then halves the rate (once per block). */
let answered = true;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wait for a free slot under the current rate and any pause. */
async function slot() {
  for (;;) {
    const now = Date.now();
    const at = Math.max(now, nextStart, refusedUntil);
    if (at <= now) {
      nextStart = now + gapMs;
      return;
    }
    await sleep(at - now);
  }
}

function challenged() {
  calm = 0;
  if (refusedUntil > Date.now()) return;
  if (answered) gapMs = Math.min(2000, gapMs * 2);
  answered = false;
  refusedUntil = Date.now() + 600 * retryMs;
  console.warn(`[market] Dukascopy asks this server to slow down: pausing ${Math.round((600 * retryMs) / 1000)} s, then ${(1000 / gapMs).toFixed(1)} requests a second`);
}

async function dukascopyFetch(url: string, init: RequestInit): Promise<Response> {
  let challenges = 0;
  for (let attempt = 0; ; attempt++) {
    await slot();
    let res: Response;
    try {
      res = await fetchWithTimeout(url, init);
    } catch (e) {
      if (attempt >= NETWORK_RETRIES) throw e;
      await sleep(retryMs * 2 ** attempt);
      continue;
    }
    if (res.status === 202 && res.headers.get('x-amzn-waf-action')) {
      await res.arrayBuffer().catch(() => undefined);
      challenged();
      if (++challenges > CHALLENGE_RETRIES) return res;
      continue;
    }
    const refused = res.status === 429 || res.status === 503;
    if (!refused || attempt >= RETRIES) {
      if (!refused) {
        refusedInARow = 0;
        answered = true;
        if (++calm >= 1000 && gapMs > 1000 / config.dukascopyRate) {
          calm = 0;
          gapMs = Math.max(1000 / config.dukascopyRate, gapMs / 1.5);
        }
      }
      return res;
    }
    await res.arrayBuffer().catch(() => undefined);
    refusedInARow++;
    if (refusedInARow >= 10) refusedUntil = Math.max(refusedUntil, Date.now() + Math.min(120 * retryMs, 4 * retryMs * (refusedInARow - 9)));
    const after = Number(res.headers.get('retry-after')) * 1000;
    await sleep(after > 0 ? Math.min(after, 60_000) : Math.min(60 * retryMs, retryMs * 2 ** attempt) * (0.5 + Math.random()));
  }
}

/** Tests: shorter pauses between retries, and no rate limit. */
export function setDukascopyRetryMs(ms: number, rate = Infinity) {
  retryMs = ms;
  refusedInARow = 0;
  refusedUntil = 0;
  gapMs = 1000 / rate;
  nextStart = 0;
}

/** A completed period has a fixed address; the current one is asked for with ?from= (changing data). */
function apiUrl(kind: 'minute' | 'ticks', code: string, start: number, periodMs: number): string {
  const d = new Date(start);
  const base = kind === 'ticks' ? `${config.dukascopyApiUrl}/ticks/${code}` : `${config.dukascopyApiUrl}/candles/minute/${code}/BID`;
  if (start + periodMs > Date.now()) return `${base}?from=${start}`;
  const ymd = `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return kind === 'ticks' ? `${base}/${ymd}/${d.getUTCHours()}` : `${base}/${ymd}`;
}

/** The API's data for a period, or undefined when the datafeed should be asked instead. */
async function fromApi<T>(url: string, parse: (data: unknown) => T): Promise<T | undefined> {
  if (config.dukascopyApiUrl === 'off' || Date.now() < apiPausedUntil) return undefined;
  let res: Response;
  try {
    res = await dukascopyFetch(url, { headers: { 'User-Agent': DUKASCOPY_UA, Accept: 'application/json' } });
  } catch {
    if (++apiErrorsInARow >= API_ERRORS_BEFORE_PAUSE) apiPausedUntil = Date.now() + API_PAUSE_MS;
    return undefined;
  }
  apiErrorsInARow = 0;
  if (res.status !== 200) return undefined;
  try {
    return parse(JSON.parse(await res.text()));
  } catch {
    return undefined;
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Datafeed folders count months from 0. */
const dukascopyDir = (name: string, ms: number) => {
  const d = new Date(ms);
  return `${config.dukascopyUrl}/${name}/${d.getUTCFullYear()}/${pad(d.getUTCMonth())}/${pad(d.getUTCDate())}`;
};

async function dukascopyFile(url: string, periodEnd: number, label: string): Promise<Uint8Array | null> {
  const res = await dukascopyFetch(url, { headers: { 'User-Agent': DUKASCOPY_UA } });
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
    const api = await fromApi(apiUrl('minute', dukascopyCode(name), dayStart, DAY_MS), (d) => parseDukascopyApiCandles(d, dayStart, MINUTES_PER_DAY, 60_000));
    if (api !== undefined) return api;
    const raw = await dukascopyFile(`${dukascopyDir(name, dayStart)}/BID_candles_min_1.bi5`, dayStart, `${name} ${new Date(dayStart).toISOString().slice(0, 10)}`);
    return raw ? parseDukascopyMinuteBars(raw, factor) : null;
  });
}

/** One UTC hour as 3600 one-second bars, from the ticks. */
export async function dukascopyHour(inst: Instrument, hourStart: number): Promise<DayBars> {
  if (!inst.dukascopy) throw new UpstreamError(`${inst.id} در Dukascopy موجود نیست`);
  const { name, factor } = inst.dukascopy;
  return dukascopyQueue(async () => {
    const api = await fromApi(apiUrl('ticks', dukascopyCode(name), hourStart, HOUR_MS), (d) => parseDukascopyApiTicks(d, hourStart));
    if (api !== undefined) return api;
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

/** One UTC day of one-minute bars (two requests). */
export async function binanceDayMinutes(inst: Instrument, dayStart: number): Promise<DayBars> {
  return parseBinanceKlines(await binanceKlines(inst, '1m', dayStart, dayStart + DAY_MS - 1, 60_000), dayStart, 1, DAY_MS, 60_000)[0];
}

/** One UTC hour of one-second bars (four requests). */
export async function binanceHour(inst: Instrument, hourStart: number): Promise<DayBars> {
  return parseBinanceKlines(await binanceKlines(inst, '1s', hourStart, hourStart + HOUR_MS - 1, 1000), hourStart, 1, HOUR_MS, 1000)[0];
}

/** A UTC day of 1-second bars (86 400), from Dukascopy's ticks (24 files). */
export async function dukascopyDaySeconds(inst: Instrument, dayStart: number): Promise<DayBars> {
  const hours = await Promise.all(Array.from({ length: 24 }, (_, h) => dukascopyHour(inst, dayStart + h * HOUR_MS)));
  return joinHours(hours);
}

/** 24 hours of 3600 one-second bars as one day; null when all were closed. */
export function joinHours(hours: DayBars[]): DayBars {
  if (hours.every((h) => !h)) return null;
  const out = empty(24 * SECONDS_PER_HOUR);
  hours.forEach((h, i) => h && out.set(h, i * SECONDS_PER_HOUR * 4));
  return out;
}

// ---------- Binance history archives (data.binance.vision) ----------
/**
 * Klines rows of a Binance archive (CSV: open time, open, high, low, close, ...). Open times are in
 * milliseconds, or microseconds in archives from 2025 on. undefined when the archive does not exist.
 */
async function binanceArchive(inst: Instrument, path: string): Promise<number[][] | undefined> {
  if (!inst.binance) throw new UpstreamError(`${inst.id} در Binance موجود نیست`);
  return binanceQueue(async () => {
    const res = await fetchWithTimeout(`${config.binanceVisionUrl}/data/spot/${path}`, {}, Math.max(config.upstreamTimeoutMs, 60_000));
    if (res.status === 404) return undefined;
    if (!res.ok) throw new UpstreamError(`Binance archive: HTTP ${res.status}`, res.status);
    const files = unzip(new Uint8Array(await res.arrayBuffer()));
    const rows: number[][] = [];
    for (const f of files) {
      for (const line of f.data.toString('utf8').split('\n')) {
        const cells = line.split(',');
        let t = Number(cells[0]);
        if (cells.length < 5 || !Number.isFinite(t)) continue; // header or empty line
        if (t > 1e14) t = Math.floor(t / 1000);
        rows.push([t, Number(cells[1]), Number(cells[2]), Number(cells[3]), Number(cells[4])]);
      }
    }
    return rows;
  });
}

const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** A whole month of 1-minute bars from the monthly archive: the month's days, or undefined when not published. */
export async function binanceArchiveMonth(inst: Instrument, monthStart: number, days: number): Promise<DayBars[] | undefined> {
  const sym = inst.binance!;
  const rows = await binanceArchive(inst, `monthly/klines/${sym}/1m/${sym}-1m-${ymd(monthStart).slice(0, 7)}.zip`);
  return rows && parseBinanceKlines(rows, monthStart, days, DAY_MS, 60_000);
}

/** One day of 1-second (or 1-minute) bars from the daily archive; undefined when not published. */
export async function binanceArchiveDay(inst: Instrument, dayStart: number, interval: '1s' | '1m'): Promise<DayBars | undefined> {
  const sym = inst.binance!;
  const rows = await binanceArchive(inst, `daily/klines/${sym}/${interval}/${sym}-${interval}-${ymd(dayStart)}.zip`);
  return rows && parseBinanceKlines(rows, dayStart, 1, DAY_MS, interval === '1s' ? 1000 : 60_000)[0];
}

/** One UTC day of 1-second bars from the klines API (96 requests): when the archive has no file yet. */
export async function binanceDaySeconds(inst: Instrument, dayStart: number): Promise<DayBars> {
  return joinHours(await Promise.all(Array.from({ length: 24 }, (_, h) => binanceHour(inst, dayStart + h * HOUR_MS))));
}
