import { existsSync, mkdirSync, openSync, readFileSync, readSync, closeSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';
import { config } from '../config';
import { DAY_MS } from '../util';
import type { DayBars } from './sources';

/**
 * The market data the replay reads, kept on this server's disk (filled by the downloader,
 * download.ts; chart requests never go to Dukascopy or Binance):
 * - market/store/<SYMBOL>/<YYYY>-<MM>.m1      the month's 1-minute bars
 * - market/store/<SYMBOL>/s1/<YYYY-MM-DD>.s1  one day's 1-second bars (optional)
 * A file is a header (format, price decimals, status of each day) and the bars as zlib-compressed
 * 32-bit integers in steps of 10^-decimals: the open as the change from the previous close, then
 * high, low and close relative to the open, which keeps the numbers small.
 */

export const MISSING = 0;
export const CLOSED = 1;
export const STORED = 2;
export type DayStatus = typeof MISSING | typeof CLOSED | typeof STORED;

const MINUTES = 1440;
const SECONDS = 86_400;
const GAP = -2147483648;
const MONTH_HEADER = 48;
const SECONDS_HEADER = 16;
const MONTH_MAGIC = 'BTM1';
const SECONDS_MAGIC = 'BTS1';

export const storeDir = () => join(config.dataDir, 'market', 'store');
const symbolDir = (symbol: string) => join(storeDir(), symbol);

const monthKey = (ms: number) => new Date(ms).toISOString().slice(0, 7);
export const monthStartOf = (ms: number) => {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
};
export const daysInMonth = (monthStart: number) => {
  const d = new Date(monthStart);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
};
const monthFile = (symbol: string, monthStart: number) => join(symbolDir(symbol), `${monthKey(monthStart)}.m1`);
const secondsFile = (symbol: string, dayStart: number) => join(symbolDir(symbol), 's1', `${new Date(dayStart).toISOString().slice(0, 10)}.s1`);

// ---------- encoding ----------
function encode(bars: Float64Array, n: number, scale: number, out: Int32Array, at: number) {
  let prevClose = 0;
  for (let j = 0; j < n; j++) {
    const b = j * 4;
    const o = at + b;
    if (Number.isNaN(bars[b])) {
      out.fill(GAP, o, o + 4);
      continue;
    }
    const open = Math.round(bars[b] * scale);
    const close = Math.round(bars[b + 3] * scale);
    out[o] = open - prevClose;
    out[o + 1] = Math.round(bars[b + 1] * scale) - open;
    out[o + 2] = open - Math.round(bars[b + 2] * scale);
    out[o + 3] = close - open;
    prevClose = close;
  }
}

function decode(ints: Int32Array, at: number, n: number, scale: number): Float64Array {
  const out = new Float64Array(n * 4);
  let prevClose = 0;
  for (let j = 0; j < n; j++) {
    const b = j * 4;
    const i = at + b;
    if (ints[i] === GAP) {
      out.fill(NaN, b, b + 4);
      continue;
    }
    const open = prevClose + ints[i];
    const close = open + ints[i + 3];
    out[b] = open / scale;
    out[b + 1] = (open + ints[i + 1]) / scale;
    out[b + 2] = (open - ints[i + 2]) / scale;
    out[b + 3] = close / scale;
    prevClose = close;
  }
  return out;
}

const toInts = (buf: Buffer) => new Int32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

function writeAtomic(file: string, data: Buffer) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

// ---------- months of 1-minute bars ----------
interface Month {
  /** file time, to notice a file replaced by another process (the download command) */
  mtime: number;
  decimals: number;
  status: Uint8Array;
  /** decoded body: the stored days' blocks in day order */
  ints: Int32Array | null;
  /** day of month (0-based) → block index in `ints` */
  block: Int16Array;
}

const monthCache = new Map<string, Month>();
const MONTH_CACHE = 24;

function parseMonth(buf: Buffer, mtime: number): Month {
  if (buf.length < MONTH_HEADER || buf.toString('latin1', 0, 4) !== MONTH_MAGIC) throw new Error('not a market data file');
  const decimals = buf[5];
  const status = new Uint8Array(buf.subarray(8, 39));
  const block = new Int16Array(31).fill(-1);
  let n = 0;
  for (let d = 0; d < 31; d++) if (status[d] === STORED) block[d] = n++;
  const ints = n ? toInts(inflateSync(buf.subarray(MONTH_HEADER))) : null;
  if (ints && ints.length !== n * MINUTES * 4) throw new Error('damaged market data file');
  return { mtime, decimals, status, ints, block };
}

function readMonth(symbol: string, monthStart: number): Month | null {
  const key = `${symbol}:${monthKey(monthStart)}`;
  const file = monthFile(symbol, monthStart);
  if (!existsSync(file)) return null;
  const mtime = statSync(file).mtimeMs;
  const hit = monthCache.get(key);
  monthCache.delete(key);
  if (hit && hit.mtime === mtime) {
    monthCache.set(key, hit);
    return hit;
  }
  let month: Month;
  try {
    month = parseMonth(readFileSync(file), mtime);
  } catch (e) {
    console.warn(`[market] ${file}: ${(e as Error).message}`);
    return null;
  }
  if (monthCache.size >= MONTH_CACHE) monthCache.delete(monthCache.keys().next().value!);
  monthCache.set(key, month);
  return month;
}

/** Status of a stored day: MISSING (not downloaded), CLOSED (no trading) or STORED. */
export function dayStatus(symbol: string, dayStart: number): DayStatus {
  const d = new Date(dayStart).getUTCDate() - 1;
  const status = coverageOf(symbol).get(monthKey(dayStart));
  return (status?.[d] ?? MISSING) as DayStatus;
}

/** A day's 1440 one-minute bars; null when the market was closed; undefined when not downloaded. */
export function readDay(symbol: string, dayStart: number): DayBars | undefined {
  const month = readMonth(symbol, monthStartOf(dayStart));
  const d = new Date(dayStart).getUTCDate() - 1;
  const status = month?.status[d] ?? MISSING;
  if (!month || status === MISSING) return undefined;
  if (status === CLOSED || !month.ints) return null;
  return decode(month.ints, month.block[d] * MINUTES * 4, MINUTES, 10 ** month.decimals);
}

/** Fewest decimals that hold every price exactly (prices are quoted in fixed steps), at most 9. */
export function decimalsFor(bars: Iterable<Float64Array>, atLeast = 0): number {
  let d = atLeast;
  for (const arr of bars) {
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (Number.isNaN(v)) continue;
      while (d < 9 && Math.abs(v * 10 ** d - Math.round(v * 10 ** d)) > 1e-6) d++;
    }
  }
  // stay inside 32 bits
  let max = 0;
  for (const arr of bars) for (let i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];
  while (d > 0 && max * 10 ** d > 2e9) d--;
  return d;
}

/**
 * Store downloaded days of one month (day of month → 1440 bars, or null for a closed day); days
 * already stored and not in `days` are kept.
 */
export function writeDays(symbol: string, monthStart: number, days: Map<number, DayBars>) {
  const old = readMonth(symbol, monthStart);
  const status = new Uint8Array(31);
  const bars: (Float64Array | null)[] = [];
  for (let d = 0; d < 31; d++) {
    const fresh = days.get(d + 1);
    if (fresh !== undefined) {
      status[d] = fresh ? STORED : CLOSED;
      bars[d] = fresh;
    } else if (old && old.status[d] !== MISSING) {
      status[d] = old.status[d];
      bars[d] = old.status[d] === STORED && old.ints ? decode(old.ints, old.block[d] * MINUTES * 4, MINUTES, 10 ** old.decimals) : null;
    } else bars[d] = null;
  }
  const stored = [...status].filter((s) => s === STORED).length;
  const decimals = decimalsFor(
    bars.filter((b): b is Float64Array => !!b),
    old?.decimals ?? 0,
  );
  const scale = 10 ** decimals;
  const ints = new Int32Array(stored * MINUTES * 4);
  for (let d = 0, k = 0; d < 31; d++) if (status[d] === STORED) encode(bars[d]!, MINUTES, scale, ints, k++ * MINUTES * 4);
  const header = Buffer.alloc(MONTH_HEADER);
  header.write(MONTH_MAGIC, 0, 'latin1');
  header[4] = 1;
  header[5] = decimals;
  header.set(status, 8);
  const body = stored ? deflateSync(Buffer.from(ints.buffer), { level: 9 }) : Buffer.alloc(0);
  writeAtomic(monthFile(symbol, monthStart), Buffer.concat([header, body]));
  monthCache.delete(`${symbol}:${monthKey(monthStart)}`);
  coverageOf(symbol).set(monthKey(monthStart), status);
  sizes.delete(symbol);
}

// ---------- ready-made month files (importer.ts) ----------
/** Where a month file (key "YYYY-MM") of a symbol is kept. */
export const monthFilePath = (symbol: string, key: string) => join(symbolDir(symbol), `${key}.m1`);

/** Days a month file covers (stored or closed), from its header; -1 when it is not a month file. */
export function coveredDays(data: Uint8Array): number {
  if (data.length < MONTH_HEADER || Buffer.from(data.subarray(0, 4)).toString('latin1') !== MONTH_MAGIC) return -1;
  let n = 0;
  for (let d = 0; d < 31; d++) if (data[8 + d] !== MISSING) n++;
  return n;
}

/** Store a month file as it is (already in this format). */
export function writeMonthFile(symbol: string, key: string, data: Uint8Array) {
  writeAtomic(monthFilePath(symbol, key), Buffer.from(data));
  monthCache.delete(`${symbol}:${key}`);
  coverage.delete(symbol);
  sizes.delete(symbol);
}

const sameBars = (a: Float64Array, b: Float64Array) => {
  for (let i = 0; i < a.length; i++) {
    if (Number.isNaN(a[i]) !== Number.isNaN(b[i])) return false;
    if (!Number.isNaN(a[i]) && Math.abs(a[i] - b[i]) > 1e-9 * Math.max(1, Math.abs(a[i]))) return false;
  }
  return true;
};

/**
 * Store the days a month file has (stored or closed) over the server's copy of that month, to take
 * corrected data; days only the server has stay. False when the server's days were already the same.
 */
export function mergeMonthFile(symbol: string, key: string, data: Uint8Array): boolean {
  const incoming = parseMonth(Buffer.from(data), 0);
  const monthStart = Date.parse(`${key}-01T00:00:00Z`);
  const old = readMonth(symbol, monthStart);
  const days = new Map<number, DayBars>();
  let changed = !old;
  for (let d = 0; d < 31; d++) {
    if (incoming.status[d] === MISSING) continue;
    const bars = incoming.status[d] === STORED && incoming.ints ? decode(incoming.ints, incoming.block[d] * MINUTES * 4, MINUTES, 10 ** incoming.decimals) : null;
    days.set(d + 1, bars);
    if (changed || old!.status[d] !== incoming.status[d]) changed = true;
    else if (bars && old!.ints && !sameBars(bars, decode(old!.ints, old!.block[d] * MINUTES * 4, MINUTES, 10 ** old!.decimals))) changed = true;
  }
  if (changed) writeDays(symbol, monthStart, days);
  return changed;
}

// ---------- what is stored ----------
/** symbol → month (YYYY-MM) → status of each day, read from the file headers once. */
const coverage = new Map<string, Map<string, Uint8Array>>();

function coverageOf(symbol: string): Map<string, Uint8Array> {
  let months = coverage.get(symbol);
  if (months) return months;
  months = new Map();
  const dir = symbolDir(symbol);
  if (existsSync(dir)) {
    const header = Buffer.alloc(39);
    for (const name of readdirSync(dir)) {
      if (!/^\d{4}-\d{2}\.m1$/.test(name)) continue;
      const fd = openSync(join(dir, name), 'r');
      try {
        if (readSync(fd, header, 0, 39, 0) === 39 && header.toString('latin1', 0, 4) === MONTH_MAGIC) months.set(name.slice(0, 7), new Uint8Array(header.subarray(8, 39)));
      } finally {
        closeSync(fd);
      }
    }
  }
  coverage.set(symbol, months);
  return months;
}

/** Stored days of a symbol: status per day from `from` to `to` (inclusive day starts). */
export function statusRange(symbol: string, from: number, to: number): DayStatus[] {
  const out: DayStatus[] = [];
  for (let t = from; t <= to; t += DAY_MS) out.push(dayStatus(symbol, t));
  return out;
}

const sizes = new Map<string, number>();
/** Bytes a symbol's data takes on disk. */
export function storedBytes(symbol: string): number {
  const hit = sizes.get(symbol);
  if (hit !== undefined) return hit;
  let total = 0;
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) walk(path);
      else total += statSync(path).size;
    }
  };
  walk(symbolDir(symbol));
  sizes.set(symbol, total);
  return total;
}

/** Read the stored days again from the files (another process or a copied folder may have added some). */
export function refreshCoverage() {
  coverage.clear();
  sizes.clear();
}

/** Forget what was read, after files were changed outside this process (tests, a copied folder). */
export function resetStoreCache() {
  monthCache.clear();
  coverage.clear();
  sizes.clear();
  secondCache.clear();
}

// ---------- days of 1-second bars ----------
const secondCache = new Map<string, DayBars>();

/** A day's 86 400 one-second bars; null when the market was closed; undefined when not downloaded. */
export function readSecondsDay(symbol: string, dayStart: number): DayBars | undefined {
  const file = secondsFile(symbol, dayStart);
  const hit = secondCache.get(file);
  if (hit !== undefined) return hit;
  if (!existsSync(file)) return undefined;
  const buf = readFileSync(file);
  if (buf.length < SECONDS_HEADER || buf.toString('latin1', 0, 4) !== SECONDS_MAGIC) return undefined;
  const bars = buf[6] === STORED ? decode(toInts(inflateSync(buf.subarray(SECONDS_HEADER))), 0, SECONDS, 10 ** buf[5]) : null;
  if (secondCache.size >= 4) secondCache.delete(secondCache.keys().next().value!);
  secondCache.set(file, bars);
  return bars;
}

export function writeSecondsDay(symbol: string, dayStart: number, bars: DayBars) {
  const decimals = bars ? decimalsFor([bars]) : 0;
  const header = Buffer.alloc(SECONDS_HEADER);
  header.write(SECONDS_MAGIC, 0, 'latin1');
  header[4] = 1;
  header[5] = decimals;
  header[6] = bars ? STORED : CLOSED;
  let body = Buffer.alloc(0);
  if (bars) {
    const ints = new Int32Array(SECONDS * 4);
    encode(bars, SECONDS, 10 ** decimals, ints, 0);
    body = deflateSync(Buffer.from(ints.buffer), { level: 9 });
  }
  const file = secondsFile(symbol, dayStart);
  writeAtomic(file, Buffer.concat([header, body]));
  secondCache.delete(file);
  sizes.delete(symbol);
}

/** Days of 1-second bars stored for a symbol (YYYY-MM-DD). */
export function storedSecondDays(symbol: string): string[] {
  const dir = join(symbolDir(symbol), 's1');
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((n) => n.endsWith('.s1'))
        .map((n) => n.slice(0, 10))
        .sort()
    : [];
}
