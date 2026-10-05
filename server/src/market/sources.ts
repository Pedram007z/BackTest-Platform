import { config } from '../config';
import { DAY_MS, UpstreamError, fetchWithTimeout, limiter } from '../util';
import type { Instrument } from './instruments';
import { lzmaDecompress } from './lzma';

/**
 * Real 5-minute bars for one UTC day: Float64Array of 288 × [open, high, low, close]
 * (NaN where there was no trading), or null when the market was closed all day.
 */
export type DayBars = Float64Array | null;

export const BARS_PER_DAY = 288;
const BAR_SEC = 300;

const dukascopyQueue = limiter(8);
const binanceQueue = limiter(4);

const emptyDay = () => new Float64Array(BARS_PER_DAY * 4).fill(NaN);

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
  for (let j = 0; j < BARS_PER_DAY; j++) if (!Number.isNaN(out[j * 4])) return true;
  return false;
};

/**
 * Decode a Dukascopy BID_candles_min_1 file: 24-byte big-endian records of
 * [seconds from midnight UTC, open, close, low, high (integers ÷ factor), volume (float)].
 * Minutes with no volume and no movement are gaps (market closed), not bars.
 */
export function parseDukascopyMinutes(raw: Uint8Array, factor: number): DayBars {
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
  const out = emptyDay();
  for (let off = 0; off + 24 <= data.length; off += 24) {
    const sec = view.getInt32(off);
    const o = view.getInt32(off + 4);
    const c = view.getInt32(off + (ohlc ? 16 : 8));
    const l = view.getInt32(off + 12);
    const h = view.getInt32(off + (ohlc ? 8 : 16));
    const vol = view.getFloat32(off + 20);
    if (vol === 0 && o === c && h === l && o === h) continue;
    const j = Math.floor(sec / BAR_SEC);
    if (j < 0 || j >= BARS_PER_DAY) continue;
    addToBar(out, j, o / factor, h / factor, l / factor, c / factor);
  }
  return hasBars(out) ? out : null;
}

export async function dukascopyDay(inst: Instrument, dayStart: number): Promise<DayBars> {
  if (!inst.dukascopy) throw new UpstreamError(`${inst.id} در Dukascopy موجود نیست`);
  const { name, factor } = inst.dukascopy;
  const d = new Date(dayStart);
  const url = `${config.dukascopyUrl}/${name}/${d.getUTCFullYear()}/${String(d.getUTCMonth()).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/BID_candles_min_1.bi5`;
  return dukascopyQueue(async () => {
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 backtest-dashboard' } });
    if (res.status === 404) {
      // Days well in the past without a file had no trading; recent ones may simply not be published yet.
      if (dayStart + 2 * DAY_MS < Date.now()) return null;
      throw new UpstreamError(`Dukascopy: ${name} ${d.toISOString().slice(0, 10)} هنوز منتشر نشده`, 404);
    }
    if (!res.ok) throw new UpstreamError(`Dukascopy: HTTP ${res.status}`, res.status);
    return parseDukascopyMinutes(new Uint8Array(await res.arrayBuffer()), factor);
  });
}

/** Binance klines rows [openTime, open, high, low, close, ...] into per-day bars. */
export function parseBinanceKlines(rows: unknown, firstDay: number, days: number): DayBars[] {
  if (!Array.isArray(rows)) throw new UpstreamError('Binance: پاسخ نامعتبر');
  const out = Array.from({ length: days }, emptyDay);
  for (const r of rows as unknown[][]) {
    const t = Number(r[0]);
    const i = Math.floor((t - firstDay) / DAY_MS);
    if (i < 0 || i >= days) continue;
    const j = Math.floor((t - (firstDay + i * DAY_MS)) / (BAR_SEC * 1000));
    addToBar(out[i], j, Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]));
  }
  return out.map((d) => (hasBars(d) ? d : null));
}

/** Up to three consecutive days (864 bars fit in one request). */
export async function binanceDays(inst: Instrument, firstDay: number, days: number): Promise<DayBars[]> {
  if (!inst.binance) throw new UpstreamError(`${inst.id} در Binance موجود نیست`);
  const q = new URLSearchParams({ symbol: inst.binance, interval: '5m', startTime: String(firstDay), endTime: String(firstDay + days * DAY_MS - 1), limit: '1000' });
  return binanceQueue(async () => {
    const res = await fetchWithTimeout(`${config.binanceUrl}/api/v3/klines?${q}`);
    const body = await res.text();
    if (!res.ok) {
      const restricted = res.status === 451 || res.status === 403;
      throw new UpstreamError(restricted ? 'Binance دسترسی این سرور را محدود کرده است (تحریم/منطقه)' : `Binance: HTTP ${res.status} ${body.slice(0, 120)}`, res.status);
    }
    return parseBinanceKlines(JSON.parse(body), firstDay, days);
  });
}
