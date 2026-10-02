import { DAY_MS, addDays, keyToMs, localDayKey, type DayKey } from './calendar';

/**
 * Deterministic synthetic market data.
 *
 * A daily close series is generated per symbol from DATA_START with a seeded random walk.
 * Each trading day is then expanded into 288 five-minute bars with a Brownian bridge from
 * the previous close to that day's close, so every timeframe aggregates from the same bars
 * and replaying the same session always shows the same prices.
 */

export type SymbolGroup = 'forex' | 'metal' | 'index' | 'crypto';

export interface SymbolInfo {
  id: string;
  ticker: string;
  name: string;
  group: SymbolGroup;
  base: number;
  dailyVol: number;
  digits: number;
  /** Size of one pip / point in price units. */
  pip: number;
  /** Default stop-loss distance in pips. */
  defaultSl: number;
  weekends: boolean;
}

export const SYMBOLS: SymbolInfo[] = [
  { id: 'EURUSD', ticker: 'EURUSD', name: 'یورو / دلار', group: 'forex', base: 1.1, dailyVol: 0.005, digits: 5, pip: 0.0001, defaultSl: 20, weekends: false },
  { id: 'GBPUSD', ticker: 'GBPUSD', name: 'پوند / دلار', group: 'forex', base: 1.27, dailyVol: 0.006, digits: 5, pip: 0.0001, defaultSl: 20, weekends: false },
  { id: 'USDJPY', ticker: 'USDJPY', name: 'دلار / ین', group: 'forex', base: 140, dailyVol: 0.006, digits: 3, pip: 0.01, defaultSl: 20, weekends: false },
  { id: 'GBPJPY', ticker: 'GBPJPY', name: 'پوند / ین', group: 'forex', base: 180, dailyVol: 0.008, digits: 3, pip: 0.01, defaultSl: 30, weekends: false },
  { id: 'AUDUSD', ticker: 'AUDUSD', name: 'دلار استرالیا / دلار', group: 'forex', base: 0.68, dailyVol: 0.007, digits: 5, pip: 0.0001, defaultSl: 15, weekends: false },
  { id: 'NZDUSD', ticker: 'NZDUSD', name: 'دلار نیوزیلند / دلار', group: 'forex', base: 0.62, dailyVol: 0.007, digits: 5, pip: 0.0001, defaultSl: 15, weekends: false },
  { id: 'USDCHF', ticker: 'USDCHF', name: 'دلار / فرانک', group: 'forex', base: 0.9, dailyVol: 0.005, digits: 5, pip: 0.0001, defaultSl: 15, weekends: false },
  { id: 'USDCAD', ticker: 'USDCAD', name: 'دلار / دلار کانادا', group: 'forex', base: 1.34, dailyVol: 0.005, digits: 5, pip: 0.0001, defaultSl: 15, weekends: false },
  { id: 'XAUUSD', ticker: 'XAUUSD', name: 'طلا / دلار', group: 'metal', base: 1900, dailyVol: 0.009, digits: 2, pip: 0.1, defaultSl: 50, weekends: false },
  { id: 'NQ', ticker: 'CME_MINI:NQ1!', name: 'نزدک ۱۰۰ (آتی)', group: 'index', base: 15000, dailyVol: 0.012, digits: 2, pip: 1, defaultSl: 40, weekends: false },
  { id: 'ES', ticker: 'CME_MINI:ES1!', name: 'S&P 500 (آتی)', group: 'index', base: 4400, dailyVol: 0.01, digits: 2, pip: 1, defaultSl: 10, weekends: false },
  { id: 'BTCUSD', ticker: 'BTCUSD', name: 'بیت‌کوین / دلار', group: 'crypto', base: 35000, dailyVol: 0.03, digits: 1, pip: 1, defaultSl: 400, weekends: true },
];

export const SYMBOL_MAP: Record<string, SymbolInfo> = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));

export const GROUP_LABELS: Record<SymbolGroup, string> = {
  forex: 'فارکس',
  metal: 'فلزات',
  index: 'شاخص‌ها',
  crypto: 'کریپتو',
};

export const DATA_START: DayKey = '2015-01-01';
/** Replay data runs up to yesterday. */
export const dataEnd = (): DayKey => addDays(localDayKey(), -1);

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1D';
export const TIMEFRAMES: { id: Timeframe; label: string; ms: number }[] = [
  { id: '5m', label: '۵ دقیقه', ms: 5 * 60_000 },
  { id: '15m', label: '۱۵ دقیقه', ms: 15 * 60_000 },
  { id: '1h', label: '۱ ساعت', ms: 60 * 60_000 },
  { id: '4h', label: '۴ ساعت', ms: 4 * 60 * 60_000 },
  { id: '1D', label: 'روزانه', ms: DAY_MS },
];
export const TF_MS: Record<Timeframe, number> = Object.fromEntries(TIMEFRAMES.map((t) => [t.id, t.ms])) as Record<Timeframe, number>;

const BAR_MS = 5 * 60_000;
const BARS_PER_DAY = 288;
const START_MS = keyToMs(DATA_START);
const HORIZON_DAYS = 5200;

// ---------- seeded randomness ----------
function hashStr(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seededRng = (key: string) => mulberry32(hashStr(key));

function gauss(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- calendar helpers ----------
const dayIndexOf = (ms: number) => Math.floor((ms - START_MS) / DAY_MS);
const dayStartMs = (idx: number) => START_MS + idx * DAY_MS;

function isTradingDay(sym: SymbolInfo, idx: number): boolean {
  if (sym.weekends) return true;
  const wd = new Date(dayStartMs(idx)).getUTCDay();
  return wd !== 0 && wd !== 6;
}

// ---------- daily series ----------
const dailyCache = new Map<string, Float64Array>();

function dailyLogCloses(sym: SymbolInfo): Float64Array {
  let arr = dailyCache.get(sym.id);
  if (arr) return arr;
  arr = new Float64Array(HORIZON_DAYS);
  const rng = seededRng(`daily:${sym.id}`);
  const logBase = Math.log(sym.base);
  let prev = logBase;
  for (let i = 0; i < HORIZON_DAYS; i++) {
    if (isTradingDay(sym, i)) {
      // slow volatility regime so some months are calmer than others
      const regime = 0.75 + 0.45 * Math.sin(i / 47 + sym.base) + 0.2 * Math.sin(i / 13);
      prev = prev + sym.dailyVol * Math.max(0.35, regime) * gauss(rng) - 0.0012 * (prev - logBase);
    }
    arr[i] = prev;
  }
  dailyCache.set(sym.id, arr);
  return arr;
}

// ---------- intraday bars ----------
const intradayCache = new Map<string, Float64Array>();
const INTRADAY_CACHE_LIMIT = 2500;

const SESSION_PROFILE = (() => {
  const w = new Float64Array(BARS_PER_DAY);
  let sumSq = 0;
  for (let j = 0; j < BARS_PER_DAY; j++) {
    const hour = j / 12;
    // quieter Asia, active London open and New York open
    w[j] = 0.55 + 0.9 * Math.exp(-((hour - 8) ** 2) / 4) + 1.1 * Math.exp(-((hour - 14) ** 2) / 4);
    sumSq += w[j] * w[j];
  }
  const norm = Math.sqrt(BARS_PER_DAY / sumSq);
  for (let j = 0; j < BARS_PER_DAY; j++) w[j] *= norm;
  return w;
})();

/** OHLC values for one trading day: [o,h,l,c] × 288 */
function intraday(sym: SymbolInfo, idx: number): Float64Array {
  const key = `${sym.id}:${idx}`;
  const hit = intradayCache.get(key);
  if (hit) return hit;

  const daily = dailyLogCloses(sym);
  const openLog = idx > 0 ? daily[idx - 1] : Math.log(sym.base);
  const closeLog = daily[idx];
  const rng = seededRng(`intra:${key}`);
  const s = sym.dailyVol / Math.sqrt(BARS_PER_DAY);

  const walk = new Float64Array(BARS_PER_DAY + 1);
  for (let j = 1; j <= BARS_PER_DAY; j++) walk[j] = walk[j - 1] + s * SESSION_PROFILE[j - 1] * gauss(rng);
  const gap = walk[BARS_PER_DAY] - (closeLog - openLog);

  const out = new Float64Array(BARS_PER_DAY * 4);
  let prevX = openLog;
  for (let j = 1; j <= BARS_PER_DAY; j++) {
    const x = openLog + walk[j] - (j / BARS_PER_DAY) * gap;
    const sj = s * SESSION_PROFILE[j - 1];
    const o = prevX;
    const c = x;
    const h = Math.max(o, c) + Math.abs(gauss(rng)) * sj * 0.55;
    const l = Math.min(o, c) - Math.abs(gauss(rng)) * sj * 0.55;
    const b = (j - 1) * 4;
    out[b] = Math.exp(o);
    out[b + 1] = Math.exp(h);
    out[b + 2] = Math.exp(l);
    out[b + 3] = Math.exp(c);
    prevX = x;
  }

  if (intradayCache.size >= INTRADAY_CACHE_LIMIT) {
    const first = intradayCache.keys().next().value;
    if (first !== undefined) intradayCache.delete(first);
  }
  intradayCache.set(key, out);
  return out;
}

export interface Candle {
  /** UTC seconds */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Bar5 {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Candles for `tf` that are visible at `cursor` (bars whose 5-minute pieces have completed).
 * The last candle may still be forming.
 */
export function getCandles(symbolId: string, tf: Timeframe, cursor: number, count: number): Candle[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym) return [];
  const tfMs = TF_MS[tf];
  const buckets: Candle[] = [];
  let current: Candle | null = null;
  let idx = dayIndexOf(cursor - 1);
  let walked = 0;

  while (idx >= 0 && walked < 4000 && buckets.length <= count) {
    walked++;
    if (isTradingDay(sym, idx)) {
      const bars = intraday(sym, idx);
      const day0 = dayStartMs(idx);
      for (let j = BARS_PER_DAY - 1; j >= 0; j--) {
        const t = day0 + j * BAR_MS;
        if (t + BAR_MS > cursor) continue;
        const bucket = Math.floor(t / tfMs) * tfMs;
        const b = j * 4;
        if (!current || current.time !== bucket / 1000) {
          if (current) buckets.push(current);
          if (buckets.length > count) break;
          current = { time: bucket / 1000, open: bars[b], high: bars[b + 1], low: bars[b + 2], close: bars[b + 3] };
        } else {
          current.open = bars[b];
          if (bars[b + 1] > current.high) current.high = bars[b + 1];
          if (bars[b + 2] < current.low) current.low = bars[b + 2];
        }
      }
    }
    idx--;
  }
  if (current && buckets.length <= count) buckets.push(current);
  return buckets.slice(0, count).reverse();
}

/** Close of the last completed 5-minute bar at `cursor`. */
export function priceAt(symbolId: string, cursor: number): number {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym) return 0;
  let idx = dayIndexOf(cursor - 1);
  for (let guard = 0; guard < 10 && idx >= 0; guard++, idx--) {
    if (!isTradingDay(sym, idx)) continue;
    const day0 = dayStartMs(idx);
    const j = Math.min(BARS_PER_DAY - 1, Math.floor((cursor - day0) / BAR_MS) - 1);
    if (j < 0) continue;
    return intraday(sym, idx)[j * 4 + 3];
  }
  return sym.base;
}

/** Completed 5-minute bars between `from` (inclusive start) and `to` (inclusive end). */
export function bars5m(symbolId: string, from: number, to: number): Bar5[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym || to <= from) return [];
  const out: Bar5[] = [];
  for (let idx = dayIndexOf(from); idx <= dayIndexOf(to - 1); idx++) {
    if (!isTradingDay(sym, idx)) continue;
    const bars = intraday(sym, idx);
    const day0 = dayStartMs(idx);
    for (let j = 0; j < BARS_PER_DAY; j++) {
      const t = day0 + j * BAR_MS;
      if (t < from || t + BAR_MS > to) continue;
      const b = j * 4;
      out.push({ time: t, open: bars[b], high: bars[b + 1], low: bars[b + 2], close: bars[b + 3] });
    }
  }
  return out;
}

/** Next replay cursor for one step of `tf`, skipping days none of the symbols trade. */
export function stepCursor(cursor: number, tf: Timeframe, symbolIds: string[]): number {
  const tfMs = TF_MS[tf];
  let next = (Math.floor(cursor / tfMs) + 1) * tfMs;
  const syms = symbolIds.map((id) => SYMBOL_MAP[id]).filter(Boolean);
  for (let guard = 0; guard < 7; guard++) {
    const idx = dayIndexOf(next - 1);
    if (syms.length === 0 || syms.some((s) => isTradingDay(s, idx))) break;
    next += DAY_MS;
  }
  return next;
}

export const pipsToPrice = (symbolId: string, pips: number) => pips * (SYMBOL_MAP[symbolId]?.pip ?? 1);
