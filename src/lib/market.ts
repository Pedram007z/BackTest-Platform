import { DAY_MS, addDays, keyToMs, localDayKey, type DayKey } from './calendar';

/**
 * Market data for the replay.
 *
 * Every accessor reads 5-minute bars one UTC day at a time through `dayBars()`. By default those
 * days are synthetic and deterministic: a seeded daily random walk per symbol, expanded into 288
 * five-minute bars with a Brownian bridge, so replaying the same dates always shows the same
 * prices. When real data is loaded from the API (see `services/marketFeed.ts`), `setRemoteDay()`
 * stores the real bars and they replace the synthetic ones for that symbol and day.
 */

export type SymbolGroup = 'forex' | 'metal' | 'energy' | 'index' | 'crypto';
export type ForexClass = 'major' | 'minor' | 'exotic';

export interface SymbolInfo {
  id: string;
  /** What traders call it, e.g. "EURUSD", "NAS100". */
  ticker: string;
  name: string;
  /** English description used by the chart library. */
  description: string;
  group: SymbolGroup;
  fxClass?: ForexClass;
  base: number;
  dailyVol: number;
  digits: number;
  /** Size of one pip / point in price units. */
  pip: number;
  /** Units per lot (100,000 for FX, 100 oz for gold, 1 for index CFDs and coins). */
  contractSize: number;
  /** Currency the price is quoted in; P&L is converted from it to USD. */
  quote: string;
  /** Currencies whose economic news moves this symbol. */
  currencies: string[];
  lotStep: number;
  weekends: boolean;
}

type Spec = [id: string, name: string, description: string, base: number, dailyVol: number, digits: number, pip: number];

const FX_NAMES: Record<string, string> = {
  EUR: 'یورو', USD: 'دلار', GBP: 'پوند', JPY: 'ین', CHF: 'فرانک', CAD: 'دلار کانادا', AUD: 'دلار استرالیا',
  NZD: 'دلار نیوزیلند', TRY: 'لیر ترکیه', ZAR: 'رند', MXN: 'پزو مکزیک', SEK: 'کرون سوئد', NOK: 'کرون نروژ',
  SGD: 'دلار سنگاپور', HKD: 'دلار هنگ‌کنگ', PLN: 'زلوتی', CNH: 'یوان',
};
const FX_EN: Record<string, string> = {
  EUR: 'Euro', USD: 'U.S. Dollar', GBP: 'British Pound', JPY: 'Japanese Yen', CHF: 'Swiss Franc', CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar', NZD: 'New Zealand Dollar', TRY: 'Turkish Lira', ZAR: 'South African Rand', MXN: 'Mexican Peso',
  SEK: 'Swedish Krona', NOK: 'Norwegian Krone', SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar', PLN: 'Polish Zloty', CNH: 'Chinese Yuan',
};

function fx(pair: string, fxClass: ForexClass, base: number, dailyVol: number): SymbolInfo {
  const b = pair.slice(0, 3);
  const q = pair.slice(3);
  const jpy = q === 'JPY';
  const wide = ['TRY', 'ZAR', 'MXN', 'SEK', 'NOK', 'HKD', 'PLN', 'CNH'].includes(q);
  return {
    id: pair,
    ticker: pair,
    name: `${FX_NAMES[b]} / ${FX_NAMES[q]}`,
    description: `${FX_EN[b]} / ${FX_EN[q]}`,
    group: 'forex',
    fxClass,
    base,
    dailyVol,
    digits: jpy ? 3 : wide ? 4 : 5,
    pip: jpy ? 0.01 : 0.0001,
    contractSize: 100_000,
    quote: q,
    currencies: [b, q],
    lotStep: 0.01,
    weekends: false,
  };
}

function cfd(
  [id, name, description, base, dailyVol, digits, pip]: Spec,
  group: SymbolGroup,
  quote: string,
  contractSize: number,
  currencies: string[],
  ticker = id,
): SymbolInfo {
  return { id, ticker, name, description, group, base, dailyVol, digits, pip, contractSize, quote, currencies, lotStep: 0.01, weekends: false };
}

function coin([id, name, description, base, dailyVol, digits, pip]: Spec): SymbolInfo {
  return { id, ticker: id, name, description, group: 'crypto', base, dailyVol, digits, pip, contractSize: 1, quote: 'USD', currencies: ['USD'], lotStep: 0.001, weekends: true };
}

export const SYMBOLS: SymbolInfo[] = [
  // ---- forex: majors
  fx('EURUSD', 'major', 1.1, 0.005),
  fx('GBPUSD', 'major', 1.27, 0.006),
  fx('USDJPY', 'major', 140, 0.006),
  fx('USDCHF', 'major', 0.9, 0.005),
  fx('USDCAD', 'major', 1.34, 0.005),
  fx('AUDUSD', 'major', 0.68, 0.007),
  fx('NZDUSD', 'major', 0.62, 0.007),
  // ---- forex: minors (crosses)
  fx('EURGBP', 'minor', 0.86, 0.004),
  fx('EURJPY', 'minor', 150, 0.007),
  fx('EURCHF', 'minor', 0.97, 0.004),
  fx('EURCAD', 'minor', 1.46, 0.005),
  fx('EURAUD', 'minor', 1.62, 0.006),
  fx('EURNZD', 'minor', 1.77, 0.006),
  fx('GBPJPY', 'minor', 180, 0.008),
  fx('GBPCHF', 'minor', 1.12, 0.006),
  fx('GBPCAD', 'minor', 1.7, 0.006),
  fx('GBPAUD', 'minor', 1.88, 0.007),
  fx('GBPNZD', 'minor', 2.05, 0.007),
  fx('AUDJPY', 'minor', 95, 0.008),
  fx('AUDCHF', 'minor', 0.6, 0.007),
  fx('AUDCAD', 'minor', 0.9, 0.006),
  fx('AUDNZD', 'minor', 1.09, 0.004),
  fx('NZDJPY', 'minor', 87, 0.008),
  fx('NZDCHF', 'minor', 0.55, 0.007),
  fx('NZDCAD', 'minor', 0.82, 0.006),
  fx('CADJPY', 'minor', 104, 0.007),
  fx('CADCHF', 'minor', 0.66, 0.006),
  fx('CHFJPY', 'minor', 160, 0.007),
  // ---- forex: exotics
  fx('USDTRY', 'exotic', 25, 0.01),
  fx('USDZAR', 'exotic', 18, 0.01),
  fx('USDMXN', 'exotic', 17.5, 0.008),
  fx('USDSEK', 'exotic', 10.5, 0.006),
  fx('USDNOK', 'exotic', 10.6, 0.007),
  fx('USDSGD', 'exotic', 1.35, 0.003),
  fx('USDHKD', 'exotic', 7.82, 0.0006),
  fx('USDPLN', 'exotic', 4, 0.006),
  fx('USDCNH', 'exotic', 7.2, 0.003),
  fx('EURTRY', 'exotic', 28, 0.01),
  fx('EURNOK', 'exotic', 11.5, 0.006),
  fx('EURSEK', 'exotic', 11.4, 0.005),
  fx('EURPLN', 'exotic', 4.4, 0.004),
  // ---- metals
  cfd(['XAUUSD', 'طلا / دلار', 'Gold Spot / U.S. Dollar', 1950, 0.009, 2, 0.1], 'metal', 'USD', 100, ['USD']),
  cfd(['XAGUSD', 'نقره / دلار', 'Silver Spot / U.S. Dollar', 23, 0.015, 3, 0.01], 'metal', 'USD', 5000, ['USD']),
  cfd(['XPTUSD', 'پلاتین / دلار', 'Platinum Spot / U.S. Dollar', 950, 0.012, 2, 0.1], 'metal', 'USD', 100, ['USD']),
  // ---- energy
  cfd(['USOIL', 'نفت WTI', 'WTI Crude Oil', 75, 0.02, 2, 0.01], 'energy', 'USD', 1000, ['USD']),
  cfd(['UKOIL', 'نفت برنت', 'Brent Crude Oil', 80, 0.019, 2, 0.01], 'energy', 'USD', 1000, ['USD']),
  cfd(['NGAS', 'گاز طبیعی', 'Natural Gas', 2.8, 0.03, 3, 0.001], 'energy', 'USD', 10_000, ['USD']),
  // ---- indices (CFDs: one lot = one unit of the index currency per point)
  cfd(['US30', 'داوجونز ۳۰', 'Dow Jones Industrial Average', 34000, 0.009, 1, 1], 'index', 'USD', 1, ['USD']),
  cfd(['NAS100', 'نزدک ۱۰۰', 'Nasdaq 100 Index', 15000, 0.012, 1, 1], 'index', 'USD', 1, ['USD']),
  cfd(['SPX500', 'اس‌اندپی ۵۰۰', 'S&P 500 Index', 4400, 0.01, 2, 0.1], 'index', 'USD', 1, ['USD']),
  cfd(['US2000', 'راسل ۲۰۰۰', 'Russell 2000 Index', 1900, 0.013, 2, 0.1], 'index', 'USD', 1, ['USD']),
  cfd(['GER40', 'دکس آلمان ۴۰', 'Germany 40 Index', 15800, 0.01, 1, 1], 'index', 'EUR', 1, ['EUR']),
  cfd(['UK100', 'فوتسی ۱۰۰', 'UK 100 Index', 7500, 0.008, 1, 1], 'index', 'GBP', 1, ['GBP']),
  cfd(['FRA40', 'کک فرانسه ۴۰', 'France 40 Index', 7200, 0.01, 1, 1], 'index', 'EUR', 1, ['EUR']),
  cfd(['EU50', 'یورو استاکس ۵۰', 'Euro Stoxx 50 Index', 4300, 0.01, 1, 1], 'index', 'EUR', 1, ['EUR']),
  cfd(['JPN225', 'نیکی ۲۲۵', 'Japan 225 Index', 32000, 0.012, 0, 1], 'index', 'JPY', 1, ['JPY']),
  cfd(['AUS200', 'استرالیا ۲۰۰', 'Australia 200 Index', 7200, 0.008, 1, 1], 'index', 'AUD', 1, ['AUD']),
  cfd(['HK50', 'هنگ‌سنگ ۵۰', 'Hong Kong 50 Index', 18000, 0.014, 0, 1], 'index', 'HKD', 1, ['CNY', 'HKD']),
  // index futures (one contract = $20 / $50 per point)
  cfd(['NQ', 'نزدک ۱۰۰ (آتی)', 'E-mini Nasdaq-100 Futures', 15000, 0.012, 2, 0.25], 'index', 'USD', 20, ['USD'], 'CME_MINI:NQ1!'),
  cfd(['ES', 'اس‌اندپی ۵۰۰ (آتی)', 'E-mini S&P 500 Futures', 4400, 0.01, 2, 0.25], 'index', 'USD', 50, ['USD'], 'CME_MINI:ES1!'),
  // ---- crypto
  coin(['BTCUSD', 'بیت‌کوین', 'Bitcoin / U.S. Dollar', 35000, 0.03, 1, 1]),
  coin(['ETHUSD', 'اتریوم', 'Ethereum / U.S. Dollar', 2000, 0.035, 2, 0.1]),
  coin(['BNBUSD', 'بی‌ان‌بی', 'BNB / U.S. Dollar', 300, 0.035, 2, 0.1]),
  coin(['SOLUSD', 'سولانا', 'Solana / U.S. Dollar', 60, 0.05, 3, 0.01]),
  coin(['XRPUSD', 'ریپل', 'XRP / U.S. Dollar', 0.55, 0.045, 5, 0.0001]),
  coin(['ADAUSD', 'کاردانو', 'Cardano / U.S. Dollar', 0.4, 0.045, 5, 0.0001]),
  coin(['DOGEUSD', 'دوج‌کوین', 'Dogecoin / U.S. Dollar', 0.08, 0.055, 6, 0.00001]),
  coin(['LTCUSD', 'لایت‌کوین', 'Litecoin / U.S. Dollar', 80, 0.04, 2, 0.01]),
  coin(['DOTUSD', 'پولکادات', 'Polkadot / U.S. Dollar', 6, 0.045, 4, 0.001]),
  coin(['AVAXUSD', 'آوالانچ', 'Avalanche / U.S. Dollar', 20, 0.05, 3, 0.01]),
  coin(['LINKUSD', 'چین‌لینک', 'Chainlink / U.S. Dollar', 10, 0.045, 4, 0.001]),
  coin(['TRXUSD', 'ترون', 'TRON / U.S. Dollar', 0.1, 0.03, 5, 0.0001]),
];

export const SYMBOL_MAP: Record<string, SymbolInfo> = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));

export const GROUP_LABELS: Record<SymbolGroup, string> = {
  forex: 'فارکس',
  metal: 'فلزات',
  energy: 'انرژی',
  index: 'شاخص‌ها',
  crypto: 'کریپتو',
};

export const FX_CLASS_LABELS: Record<ForexClass, string> = { major: 'اصلی', minor: 'فرعی', exotic: 'اگزوتیک' };

/** Group label for pickers, splitting forex into majors / minors / exotics. */
export function groupLabel(s: SymbolInfo): string {
  return s.group === 'forex' && s.fxClass ? `${GROUP_LABELS.forex} — ${FX_CLASS_LABELS[s.fxClass]}` : GROUP_LABELS[s.group];
}

export const DATA_START: DayKey = '2015-01-01';
/** Replay data runs up to yesterday. */
export const dataEnd = (): DayKey => addDays(localDayKey(), -1);

export type Timeframe = '5m' | '15m' | '30m' | '1h' | '4h' | '1D';
export const TIMEFRAMES: { id: Timeframe; label: string; short: string; ms: number; tv: string }[] = [
  { id: '5m', label: '۵ دقیقه', short: '5m', ms: 5 * 60_000, tv: '5' },
  { id: '15m', label: '۱۵ دقیقه', short: '15m', ms: 15 * 60_000, tv: '15' },
  { id: '30m', label: '۳۰ دقیقه', short: '30m', ms: 30 * 60_000, tv: '30' },
  { id: '1h', label: '۱ ساعت', short: '1h', ms: 60 * 60_000, tv: '60' },
  { id: '4h', label: '۴ ساعت', short: '4h', ms: 4 * 60 * 60_000, tv: '240' },
  { id: '1D', label: 'روزانه', short: 'D', ms: DAY_MS, tv: '1D' },
];
export const TF_MS: Record<Timeframe, number> = Object.fromEntries(TIMEFRAMES.map((t) => [t.id, t.ms])) as Record<Timeframe, number>;
export const tfFromTv = (res: string): Timeframe => TIMEFRAMES.find((t) => t.tv === res || (res === 'D' && t.id === '1D'))?.id ?? '15m';

export const BAR_MS = 5 * 60_000;
export const BARS_PER_DAY = 288;
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

export function gauss(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- calendar helpers ----------
export const dayIndexOf = (ms: number) => Math.floor((ms - START_MS) / DAY_MS);
export const dayStartMs = (idx: number) => START_MS + idx * DAY_MS;

function isWeekday(idx: number): boolean {
  const wd = new Date(dayStartMs(idx)).getUTCDay();
  return wd !== 0 && wd !== 6;
}

// ---------- synthetic daily series ----------
const dailyCache = new Map<string, Float64Array>();

function dailyLogCloses(sym: SymbolInfo): Float64Array {
  let arr = dailyCache.get(sym.id);
  if (arr) return arr;
  arr = new Float64Array(HORIZON_DAYS);
  const rng = seededRng(`daily:${sym.id}`);
  const logBase = Math.log(sym.base);
  let prev = logBase;
  for (let i = 0; i < HORIZON_DAYS; i++) {
    if (sym.weekends || isWeekday(i)) {
      // slow volatility regime so some months are calmer than others
      const regime = 0.75 + 0.45 * Math.sin(i / 47 + sym.base) + 0.2 * Math.sin(i / 13);
      prev = prev + sym.dailyVol * Math.max(0.35, regime) * gauss(rng) - 0.0012 * (prev - logBase);
    }
    arr[i] = prev;
  }
  dailyCache.set(sym.id, arr);
  return arr;
}

// ---------- synthetic intraday bars ----------
const intradayCache = new Map<string, Float64Array>();
const INTRADAY_CACHE_LIMIT = 3000;

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

/** OHLC values for one synthetic trading day: [o,h,l,c] × 288 */
function synthDay(sym: SymbolInfo, idx: number): Float64Array {
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

// ---------- data source ----------
/**
 * 'synthetic' generates every day locally. 'remote' only shows days that were loaded with
 * `setRemoteDay()`; days that are not loaded yet read as "no data" until they arrive.
 */
export const marketSource: { mode: 'synthetic' | 'remote' } = { mode: 'synthetic' };

/** symbol → day index → 288×[o,h,l,c] (NaN for missing bars) or null for a closed market day. */
const remoteDays = new Map<string, Map<number, Float64Array | null>>();

export function setRemoteDay(symbolId: string, idx: number, bars: Float64Array | null) {
  let m = remoteDays.get(symbolId);
  if (!m) remoteDays.set(symbolId, (m = new Map()));
  m.set(idx, bars);
}

export function hasRemoteDay(symbolId: string, idx: number): boolean {
  return remoteDays.get(symbolId)?.has(idx) ?? false;
}

let dataVersion = 0;
const versionListeners = new Set<() => void>();
/** Call after loading remote days so charts redraw. */
export function bumpDataVersion() {
  dataVersion++;
  versionListeners.forEach((f) => f());
}
export const getDataVersion = () => dataVersion;
export function onDataVersion(f: () => void) {
  versionListeners.add(f);
  return () => void versionListeners.delete(f);
}

/** 5-minute bars of one UTC day, or null when the market is closed / nothing is loaded. */
export function dayBars(sym: SymbolInfo, idx: number): Float64Array | null {
  if (idx < 0) return null;
  if (marketSource.mode === 'remote') return remoteDays.get(sym.id)?.get(idx) ?? null;
  if (!sym.weekends && !isWeekday(idx)) return null;
  if (idx >= HORIZON_DAYS) return null;
  return synthDay(sym, idx);
}

export function isTradingDay(sym: SymbolInfo, idx: number): boolean {
  if (marketSource.mode === 'remote') {
    const m = remoteDays.get(sym.id);
    if (m?.has(idx)) return m.get(idx) !== null;
  }
  return sym.weekends || isWeekday(idx);
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
 * The last candle may still be forming. Oldest first.
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
    const bars = dayBars(sym, idx);
    if (bars) {
      const day0 = dayStartMs(idx);
      for (let j = BARS_PER_DAY - 1; j >= 0; j--) {
        const t = day0 + j * BAR_MS;
        if (t + BAR_MS > cursor) continue;
        const b = j * 4;
        if (Number.isNaN(bars[b])) continue;
        const bucket = Math.floor(t / tfMs) * tfMs;
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

/**
 * Candles whose bucket starts in [fromMs, toMs), built only from 5-minute bars completed by `cursor`.
 * Used by the TradingView datafeed. Oldest first.
 */
export function candlesBetween(symbolId: string, tf: Timeframe, fromMs: number, toMs: number, cursor: number): Candle[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym) return [];
  const tfMs = TF_MS[tf];
  const end = Math.min(toMs, cursor);
  const out: Candle[] = [];
  let current: Candle | null = null;
  for (let idx = Math.max(0, dayIndexOf(fromMs)); idx <= dayIndexOf(end - 1); idx++) {
    const bars = dayBars(sym, idx);
    if (!bars) continue;
    const day0 = dayStartMs(idx);
    for (let j = 0; j < BARS_PER_DAY; j++) {
      const t = day0 + j * BAR_MS;
      if (t + BAR_MS > cursor) break;
      const b = j * 4;
      if (Number.isNaN(bars[b])) continue;
      const bucket = Math.floor(t / tfMs) * tfMs;
      if (bucket < fromMs || bucket >= toMs) continue;
      if (!current || current.time !== bucket / 1000) {
        if (current) out.push(current);
        current = { time: bucket / 1000, open: bars[b], high: bars[b + 1], low: bars[b + 2], close: bars[b + 3] };
      } else {
        if (bars[b + 1] > current.high) current.high = bars[b + 1];
        if (bars[b + 2] < current.low) current.low = bars[b + 2];
        current.close = bars[b + 3];
      }
    }
  }
  if (current) out.push(current);
  return out;
}

/** Close of the last completed 5-minute bar at `cursor`. */
export function priceAt(symbolId: string, cursor: number): number {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym) return 0;
  let idx = dayIndexOf(cursor - 1);
  for (let guard = 0; guard < 12 && idx >= 0; guard++, idx--) {
    const bars = dayBars(sym, idx);
    if (!bars) continue;
    const day0 = dayStartMs(idx);
    let j = Math.min(BARS_PER_DAY - 1, Math.floor((cursor - day0) / BAR_MS) - 1);
    while (j >= 0 && Number.isNaN(bars[j * 4 + 3])) j--;
    if (j < 0) continue;
    return bars[j * 4 + 3];
  }
  return sym.base;
}

/** Completed 5-minute bars between `from` (inclusive start) and `to` (inclusive end). */
export function bars5m(symbolId: string, from: number, to: number): Bar5[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym || to <= from) return [];
  const out: Bar5[] = [];
  for (let idx = dayIndexOf(from); idx <= dayIndexOf(to - 1); idx++) {
    const bars = dayBars(sym, idx);
    if (!bars) continue;
    const day0 = dayStartMs(idx);
    for (let j = 0; j < BARS_PER_DAY; j++) {
      const t = day0 + j * BAR_MS;
      if (t < from || t + BAR_MS > to) continue;
      const b = j * 4;
      if (Number.isNaN(bars[b])) continue;
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

/** Average true range of the last `n` candles, used to place a sensible default stop. */
export function atr(symbolId: string, tf: Timeframe, cursor: number, n = 14): number {
  const c = getCandles(symbolId, tf, cursor, n + 1);
  if (c.length < 2) return (SYMBOL_MAP[symbolId]?.base ?? 1) * (SYMBOL_MAP[symbolId]?.dailyVol ?? 0.01) * 0.3;
  let sum = 0;
  for (let i = 1; i < c.length; i++) {
    sum += Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));
  }
  return sum / (c.length - 1);
}

export const pipsToPrice = (symbolId: string, pips: number) => pips * (SYMBOL_MAP[symbolId]?.pip ?? 1);
export const priceToPips = (symbolId: string, dist: number) => dist / (SYMBOL_MAP[symbolId]?.pip ?? 1);

export function roundToTick(symbolId: string, price: number): number {
  const d = SYMBOL_MAP[symbolId]?.digits ?? 2;
  const f = 10 ** d;
  return Math.round(price * f) / f;
}

export const fmtPx = (symbolId: string, price: number) => price.toFixed(SYMBOL_MAP[symbolId]?.digits ?? 2);

/**
 * How many USD one unit of `currency` is worth at `time`, read from the symbol list
 * (EURUSD for EUR, 1/USDJPY for JPY, …). Falls back to 1.
 */
export function usdPer(currency: string, time: number): number {
  if (currency === 'USD') return 1;
  if (SYMBOL_MAP[`${currency}USD`]) return priceAt(`${currency}USD`, time);
  if (SYMBOL_MAP[`USD${currency}`]) return 1 / priceAt(`USD${currency}`, time);
  if (currency === 'CNY') return usdPer('CNH', time);
  return 1;
}

/** USD value of a 1.0 price move for one lot of `symbolId` at `time`. */
export function pointValueUsd(symbolId: string, time: number): number {
  const s = SYMBOL_MAP[symbolId];
  if (!s) return 1;
  return s.contractSize * usdPer(s.quote, time);
}
