import { DAY_MS, addDays, keyToMs, localDayKey, type DayKey } from './calendar';

/**
 * Market data for the replay.
 *
 * The history is 5-minute bars, one UTC day at a time through `dayBars()`. By default those days
 * are synthetic and deterministic: a seeded daily random walk per symbol, expanded into 288
 * five-minute bars with a Brownian bridge, so replaying the same dates always shows the same
 * prices. 1-minute and 1-second bars (for minute and second charts, and for stepping inside a
 * 5-minute bar) are split out of the bars above them so they add up exactly. When real data is
 * loaded from the API (see `services/marketFeed.ts`), `setRemoteDay()`, `setRemoteMinutes()` and
 * `setRemoteSeconds()` store the real bars and they replace the synthetic ones for that symbol.
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
  EUR: 'یورو',
  USD: 'دلار',
  GBP: 'پوند',
  JPY: 'ین',
  CHF: 'فرانک',
  CAD: 'دلار کانادا',
  AUD: 'دلار استرالیا',
  NZD: 'دلار نیوزیلند',
  TRY: 'لیر ترکیه',
  ZAR: 'رند',
  MXN: 'پزو مکزیک',
  SEK: 'کرون سوئد',
  NOK: 'کرون نروژ',
  SGD: 'دلار سنگاپور',
  HKD: 'دلار هنگ‌کنگ',
  PLN: 'زلوتی',
  CNH: 'یوان',
};
const FX_EN: Record<string, string> = {
  EUR: 'Euro',
  USD: 'U.S. Dollar',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar',
  TRY: 'Turkish Lira',
  ZAR: 'South African Rand',
  MXN: 'Mexican Peso',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  PLN: 'Polish Zloty',
  CNH: 'Chinese Yuan',
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

function cfd([id, name, description, base, dailyVol, digits, pip]: Spec, group: SymbolGroup, quote: string, contractSize: number, currencies: string[], ticker = id): SymbolInfo {
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
  // the indices in E-mini contract sizes ($20 / $50 per point). Prices are the index CFDs': there is no
  // free source of CME futures history, and futures trade at a premium to the index
  cfd(['NQ', 'نزدک ۱۰۰ (اندازه‌ی E-mini)', 'Nasdaq 100 Index, E-mini size ($20 per point)', 15000, 0.012, 2, 0.25], 'index', 'USD', 20, ['USD']),
  cfd(['ES', 'اس‌اندپی ۵۰۰ (اندازه‌ی E-mini)', 'S&P 500 Index, E-mini size ($50 per point)', 4400, 0.01, 2, 0.25], 'index', 'USD', 50, ['USD']),
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
/**
 * Symbols whose real history starts after DATA_START: Dukascopy's first minute data (platinum,
 * Russell 2000) and the Binance listings of the coins.
 */
const DATA_SINCE: Record<string, DayKey> = {
  XPTUSD: '2021-11-01',
  US2000: '2018-08-08',
  BTCUSD: '2017-08-17',
  ETHUSD: '2017-08-17',
  BNBUSD: '2017-11-06',
  LTCUSD: '2017-12-13',
  ADAUSD: '2018-04-17',
  XRPUSD: '2018-05-04',
  TRXUSD: '2018-06-11',
  LINKUSD: '2019-01-16',
  DOGEUSD: '2019-07-05',
  SOLUSD: '2020-08-11',
  DOTUSD: '2020-08-18',
  AVAXUSD: '2020-09-22',
};
/** First day of real data for these symbols (the latest of their starts). */
export const dataStartOf = (...symbolIds: string[]): DayKey => symbolIds.reduce<DayKey>((a, id) => (DATA_SINCE[id] && DATA_SINCE[id] > a ? DATA_SINCE[id] : a), DATA_START);
/** Replay data runs up to yesterday. */
export const dataEnd = (): DayKey => addDays(localDayKey(), -1);
/** History a replay chart reaches before the session's start date (when the symbol has data that early). */
export const HISTORY_DAYS = 365;
/** The earliest time a session's chart reaches back to: a year before its start, not before the symbol's first data. */
export const historyStartMs = (symbolId: string, startDate: DayKey): number => Math.max(keyToMs(dataStartOf(symbolId)), keyToMs(startDate) - HISTORY_DAYS * DAY_MS);

export type Timeframe = '1s' | '5s' | '15s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D';
export const TIMEFRAMES: { id: Timeframe; label: string; short: string; ms: number; tv: string }[] = [
  { id: '1s', label: '۱ ثانیه', short: '1s', ms: 1000, tv: '1S' },
  { id: '5s', label: '۵ ثانیه', short: '5s', ms: 5000, tv: '5S' },
  { id: '15s', label: '۱۵ ثانیه', short: '15s', ms: 15_000, tv: '15S' },
  { id: '30s', label: '۳۰ ثانیه', short: '30s', ms: 30_000, tv: '30S' },
  { id: '1m', label: '۱ دقیقه', short: '1m', ms: 60_000, tv: '1' },
  { id: '5m', label: '۵ دقیقه', short: '5m', ms: 5 * 60_000, tv: '5' },
  { id: '15m', label: '۱۵ دقیقه', short: '15m', ms: 15 * 60_000, tv: '15' },
  { id: '30m', label: '۳۰ دقیقه', short: '30m', ms: 30 * 60_000, tv: '30' },
  { id: '1h', label: '۱ ساعت', short: '1h', ms: 60 * 60_000, tv: '60' },
  { id: '4h', label: '۴ ساعت', short: '4h', ms: 4 * 60 * 60_000, tv: '240' },
  { id: '1D', label: 'روزانه', short: 'D', ms: DAY_MS, tv: '1D' },
];
export const TF_MS: Record<Timeframe, number> = Object.fromEntries(TIMEFRAMES.map((t) => [t.id, t.ms])) as Record<Timeframe, number>;
export const tfFromTv = (res: string): Timeframe => TIMEFRAMES.find((t) => t.tv === res || (res === 'D' && t.id === '1D'))?.id ?? '15m';

export const SEC_MS = 1000;
export const MIN_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const BAR_MS = 5 * 60_000;
export const BARS_PER_DAY = 288;
const MINUTES_PER_DAY = 1440;
const SECONDS_PER_HOUR = 3600;
const START_MS = keyToMs(DATA_START);

/** The bars a timeframe is built from: 1-second, 1-minute or 5-minute. */
export const baseMsOf = (tf: Timeframe) => (TF_MS[tf] < MIN_MS ? SEC_MS : TF_MS[tf] < BAR_MS ? MIN_MS : BAR_MS);
const floorTo = (t: number, step: number) => Math.floor(t / step) * step;

// ---------- trading days ----------
/**
 * Forex, metals, energy and index CFDs trade from Sunday 17:00 to Friday 17:00 New York time, and
 * brokers (and TradingView) end their trading days and 4-hour bars at 17:00 New York. Crypto trades
 * all week on UTC days.
 */
const dstCache = new Map<number, [number, number]>();
/** New York's offset from UTC at `t`: −4 h from the second Sunday of March to the first Sunday of November, −5 h otherwise. */
export function nyOffsetMs(t: number): number {
  const y = new Date(t).getUTCFullYear();
  let dst = dstCache.get(y);
  if (!dst) {
    const sunday = (month: number, n: number) => {
      const first = Date.UTC(y, month, 1);
      return first + (((7 - new Date(first).getUTCDay()) % 7) + (n - 1) * 7) * DAY_MS;
    };
    // the switch happens at 02:00 local time
    dst = [sunday(2, 2) + 7 * HOUR_MS, sunday(10, 1) + 6 * HOUR_MS];
    dstCache.set(y, dst);
  }
  return t >= dst[0] && t < dst[1] ? -4 * HOUR_MS : -5 * HOUR_MS;
}

/** Moves 17:00 New York to 00:00, so New York trading days line up with whole days. */
const sessionShift = (t: number) => nyOffsetMs(t) + 7 * HOUR_MS;
const closesAtNy = (sym: SymbolInfo, tf: Timeframe) => !sym.weekends && TF_MS[tf] >= 4 * HOUR_MS;

/**
 * Time (ms) of the `tf` candle that contains `t`: its start, except daily candles of markets that
 * close at 17:00 New York, which carry their trading day at 00:00 UTC (the session that starts on
 * Sunday evening is Monday's), as brokers and TradingView show them.
 */
export function candleTime(sym: SymbolInfo, tf: Timeframe, t: number): number {
  const tfMs = TF_MS[tf];
  if (!closesAtNy(sym, tf)) return floorTo(t, tfMs);
  const shift = sessionShift(t);
  return tf === '1D' ? floorTo(t + shift, DAY_MS) : floorTo(t + shift, tfMs) - shift;
}

/** When the `tf` candle containing `t` ends. */
export function candleEnd(sym: SymbolInfo, tf: Timeframe, t: number): number {
  const tfMs = TF_MS[tf];
  if (!closesAtNy(sym, tf)) return floorTo(t, tfMs) + tfMs;
  const shift = sessionShift(t);
  return floorTo(t + shift, tfMs) + tfMs - shift;
}

/** For markets closed at weekends: when they reopen (Sunday 17:00 New York) if `t` falls between Friday 17:00 and then. */
export function weekendReopen(t: number): number | null {
  const local = t + nyOffsetMs(t);
  const day = new Date(local).getUTCDay();
  const hour = (local % DAY_MS) / HOUR_MS;
  if (!(day === 6 || (day === 5 && hour >= 17) || (day === 0 && hour < 17))) return null;
  const sunday = floorTo(local, DAY_MS) + ((7 - day) % 7) * DAY_MS + 17 * HOUR_MS;
  const guess = sunday - nyOffsetMs(t);
  return sunday - nyOffsetMs(guess);
}
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
export const hourIndexOf = (ms: number) => Math.floor((ms - START_MS) / HOUR_MS);
export const hourStartMs = (idx: number) => START_MS + idx * HOUR_MS;

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
  // markets that close for the weekend stop at 17:00 New York on Friday
  const start = dayStartMs(idx);
  if (!sym.weekends && new Date(start).getUTCDay() === 5) {
    const close = start + 17 * HOUR_MS - nyOffsetMs(start + 12 * HOUR_MS);
    out.fill(NaN, Math.ceil((close - start) / BAR_MS) * 4);
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
 * 'synthetic' generates every day locally. 'remote' (set by services/marketFeed.ts when an API
 * server is configured) reads the symbols in `remote` from days loaded with `setRemoteDay()`;
 * days that are not loaded yet read as "no data" until they arrive. Other symbols stay synthetic.
 */
export const marketSource: { mode: 'synthetic' | 'remote'; remote: Set<string> } = { mode: 'synthetic', remote: new Set() };

const isRemote = (symbolId: string) => marketSource.mode === 'remote' && marketSource.remote.has(symbolId);

/** Run `fn` on the built-in synthetic prices (landing demo, sample data), whatever the data source. */
export function synthetic<T>(fn: () => T): T {
  const prev = marketSource.mode;
  marketSource.mode = 'synthetic';
  try {
    return fn();
  } finally {
    marketSource.mode = prev;
  }
}

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
  if (isRemote(sym.id)) return remoteDays.get(sym.id)?.get(idx) ?? null;
  if (!sym.weekends && !isWeekday(idx)) return null;
  if (idx >= HORIZON_DAYS) return null;
  return synthDay(sym, idx);
}

export function isTradingDay(sym: SymbolInfo, idx: number): boolean {
  if (isRemote(sym.id)) {
    const m = remoteDays.get(sym.id);
    if (m?.has(idx)) return m.get(idx) !== null;
  }
  return sym.weekends || isWeekday(idx);
}

// ---------- 1-minute and 1-second bars ----------
/**
 * Split the bar at `src[at]` into `n` bars written to `out[outAt]` that add up exactly to it: a
 * Brownian bridge from its open to its close, kept inside its range, with its high and low each
 * reached by one of the pieces.
 */
function subdivide(src: Float64Array, at: number, n: number, rng: () => number, out: Float64Array, outAt: number) {
  const o = src[at];
  const h = src[at + 1];
  const l = src[at + 2];
  const c = src[at + 3];
  if (Number.isNaN(o)) {
    out.fill(NaN, outAt, outAt + n * 4);
    return;
  }
  const range = h - l;
  const dev = new Float64Array(n + 1);
  for (let k = 1; k <= n; k++) dev[k] = dev[k - 1] + gauss(rng);
  const drift = dev[n];
  let scale = range > 0 ? range / Math.sqrt(n) : 0;
  for (let k = 1; k < n; k++) {
    dev[k] -= (k / n) * drift;
    const line = o + ((c - o) * k) / n;
    if (dev[k] > 0) scale = Math.min(scale, ((h - line) / dev[k]) * 0.92);
    else if (dev[k] < 0) scale = Math.min(scale, ((l - line) / dev[k]) * 0.92);
  }
  let prev = o;
  let hiK = 0;
  let loK = 0;
  for (let k = 1; k <= n; k++) {
    const x = k === n ? c : o + ((c - o) * k) / n + scale * dev[k];
    const wick = (Math.abs(gauss(rng)) * range * 0.12) / Math.sqrt(n);
    const b = outAt + (k - 1) * 4;
    out[b] = prev;
    out[b + 1] = Math.min(h, Math.max(prev, x) + wick);
    out[b + 2] = Math.max(l, Math.min(prev, x) - wick);
    out[b + 3] = x;
    if (out[b + 1] > out[outAt + hiK * 4 + 1]) hiK = k - 1;
    if (out[b + 2] < out[outAt + loK * 4 + 2]) loK = k - 1;
    prev = x;
  }
  out[outAt + hiK * 4 + 1] = h;
  out[outAt + loK * 4 + 2] = l;
}

const minuteCache = new Map<string, Float64Array>();
const secondCache = new Map<string, Float64Array>();
function remember(cache: Map<string, Float64Array>, key: string, value: Float64Array, limit: number) {
  if (cache.size >= limit) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
  return value;
}

/** A day of 5-minute bars split into 1440 one-minute bars. */
function splitDay(key: string, m5: () => Float64Array): Float64Array {
  const hit = minuteCache.get(key);
  if (hit) return hit;
  const src = m5();
  const out = new Float64Array(MINUTES_PER_DAY * 4);
  const rng = seededRng(`m1:${key}`);
  for (let j = 0; j < BARS_PER_DAY; j++) subdivide(src, j * 4, 5, rng, out, j * 20);
  return remember(minuteCache, key, out, 48);
}

/** One hour of a day's 1-minute bars split into 3600 one-second bars. */
function splitHour(key: string, hourIdx: number, m1: () => Float64Array): Float64Array {
  const hit = secondCache.get(key);
  if (hit) return hit;
  const src = m1();
  const first = (hourIdx % 24) * 60;
  const out = new Float64Array(SECONDS_PER_HOUR * 4);
  const rng = seededRng(`s1:${key}`);
  for (let m = 0; m < 60; m++) subdivide(src, (first + m) * 4, 60, rng, out, m * 240);
  return remember(secondCache, key, out, 72);
}

const synthMinutes = (sym: SymbolInfo, idx: number) => splitDay(`${sym.id}:${idx}`, () => synthDay(sym, idx));
const synthSeconds = (sym: SymbolInfo, hourIdx: number) => splitHour(`${sym.id}:${hourIdx}`, hourIdx, () => synthMinutes(sym, Math.floor(hourIdx / 24)));

/** symbol → day index → 1440×[o,h,l,c] / symbol → hour index → 3600×[o,h,l,c] (null: closed) */
const remoteMinutes = new Map<string, Map<number, Float64Array | null>>();
const remoteSeconds = new Map<string, Map<number, Float64Array | null>>();
const put = (store: Map<string, Map<number, Float64Array | null>>, symbolId: string, idx: number, bars: Float64Array | null) => {
  let m = store.get(symbolId);
  if (!m) store.set(symbolId, (m = new Map()));
  m.set(idx, bars);
};
export const setRemoteMinutes = (symbolId: string, dayIdx: number, bars: Float64Array | null) => put(remoteMinutes, symbolId, dayIdx, bars);
export const setRemoteSeconds = (symbolId: string, hourIdx: number, bars: Float64Array | null) => put(remoteSeconds, symbolId, hourIdx, bars);
export const hasRemoteMinutes = (symbolId: string, dayIdx: number) => remoteMinutes.get(symbolId)?.has(dayIdx) ?? false;
export const hasRemoteSeconds = (symbolId: string, hourIdx: number) => remoteSeconds.get(symbolId)?.has(hourIdx) ?? false;

/** 1-minute bars of one UTC day (1440 × [o,h,l,c], NaN gaps); null when closed; undefined when not loaded yet. */
export function minuteBars(sym: SymbolInfo, idx: number): Float64Array | null | undefined {
  if (idx < 0) return null;
  if (isRemote(sym.id)) {
    const m = remoteMinutes.get(sym.id);
    if (!m?.has(idx)) return undefined;
    const bars = m.get(idx)!;
    if (bars) return bars;
    // the source has no 1-minute bars for a day it has 5-minute bars for: split those
    const m5 = remoteDays.get(sym.id)?.get(idx);
    return m5 ? splitDay(`${sym.id}:${idx}:real`, () => m5) : null;
  }
  if ((!sym.weekends && !isWeekday(idx)) || idx >= HORIZON_DAYS) return null;
  return synthMinutes(sym, idx);
}

/** 1-second bars of one UTC hour (3600 × [o,h,l,c], NaN gaps); null when closed; undefined when not loaded yet. */
export function secondBars(sym: SymbolInfo, hourIdx: number): Float64Array | null | undefined {
  if (hourIdx < 0) return null;
  if (isRemote(sym.id)) {
    const m = remoteSeconds.get(sym.id);
    if (!m?.has(hourIdx)) return undefined;
    const bars = m.get(hourIdx)!;
    if (bars) return bars;
    // no 1-second bars for this hour (Binance's 1s history starts years after its 5-minute one; a missing
    // tick file): split the hour's 1-minute bars, once those are loaded
    const m1 = minuteBars(sym, Math.floor(hourIdx / 24));
    return m1 ? splitHour(`${sym.id}:${hourIdx}:real`, hourIdx, () => m1) : m1;
  }
  const day = Math.floor(hourIdx / 24);
  if ((!sym.weekends && !isWeekday(day)) || day >= HORIZON_DAYS) return null;
  return synthSeconds(sym, hourIdx);
}

export interface Candle {
  /** UTC seconds */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** A completed bar of the data the replay steps through (5-minute, 1-minute or 1-second). */
export interface Bar {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  /** length in ms */
  ms: number;
}
/** Older name of `Bar`. */
export type Bar5 = Bar;

const barAt = (arr: Float64Array, j: number, time: number, ms: number): Bar | null => {
  const b = j * 4;
  return Number.isNaN(arr[b]) ? null : { time, open: arr[b], high: arr[b + 1], low: arr[b + 2], close: arr[b + 3], ms };
};

/** One period (day or hour) of bars of a base size: the bars, null when closed, undefined when not loaded. */
function periodOf(sym: SymbolInfo, level: number, idx: number): { bars: Float64Array | null | undefined; start: number; n: number } {
  if (level === BAR_MS) return { bars: dayBars(sym, idx), start: dayStartMs(idx), n: BARS_PER_DAY };
  if (level === MIN_MS) return { bars: minuteBars(sym, idx), start: dayStartMs(idx), n: MINUTES_PER_DAY };
  return { bars: secondBars(sym, idx), start: hourStartMs(idx), n: SECONDS_PER_HOUR };
}
const periodIndex = (level: number, t: number) => (level === SEC_MS ? hourIndexOf(t) : dayIndexOf(t));
/** How many days (or hours, for seconds) a backward walk may cross: weekends and holidays included. */
const WALK_LIMIT: Record<number, number> = { [BAR_MS]: 4000, [MIN_MS]: 14, [SEC_MS]: 24 * 7 };

/**
 * Calls `visit` with completed bars of one base size that end by `end`, newest first, until it returns
 * false. Closed periods are skipped; minute or second data that is not loaded yet ends the walk.
 */
function walkBack(sym: SymbolInfo, level: number, end: number, visit: (b: Bar) => boolean) {
  let idx = periodIndex(level, end - 1);
  for (let walked = 0; idx >= 0 && walked < WALK_LIMIT[level]; walked++, idx--) {
    const { bars, start, n } = periodOf(sym, level, idx);
    if (bars === undefined) return;
    if (!bars) continue;
    for (let j = Math.min(n, Math.floor((end - start) / level)) - 1; j >= 0; j--) {
      const b = barAt(bars, j, start + j * level, level);
      if (b && !visit(b)) return;
    }
  }
}

/** Completed bars of one base size in [from, to), oldest first (periods not loaded are skipped). */
function walkForward(sym: SymbolInfo, level: number, from: number, to: number, visit: (b: Bar) => void) {
  if (to <= from) return;
  for (let idx = Math.max(0, periodIndex(level, from)); idx <= periodIndex(level, to - 1); idx++) {
    const { bars, start, n } = periodOf(sym, level, idx);
    if (!bars) continue;
    for (let j = Math.max(0, Math.ceil((from - start) / level)); j < n; j++) {
      const t = start + j * level;
      if (t + level > to) break;
      const b = barAt(bars, j, t, level);
      if (b) visit(b);
    }
  }
}

/**
 * The bars between two replay positions, for filling orders and following trades: whole 5-minute
 * bars where they fit, 1-minute and 1-second bars for the partial pieces when those are available.
 * Nothing after `to` is used. Where finer data is not loaded (server data), a coarser bar is used in
 * the step in which it completes, so every moment is processed exactly once.
 */
export function replayBars(symbolId: string, from: number, to: number): Bar[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym || to <= from) return [];
  const out: Bar[] = [];
  let t = from;
  for (let guard = 0; t < to && guard < 1_000_000; guard++) {
    const m5Start = floorTo(t, BAR_MS);
    const dIdx = dayIndexOf(t);
    if (t === m5Start && t + BAR_MS <= to) {
      const bars = dayBars(sym, dIdx);
      if (!bars) {
        t = dayStartMs(dIdx + 1);
        continue;
      }
      const b = barAt(bars, (t - dayStartMs(dIdx)) / BAR_MS, t, BAR_MS);
      if (b) out.push(b);
      t += BAR_MS;
      continue;
    }
    const segEnd = Math.min(to, m5Start + BAR_MS);
    const mins = minuteBars(sym, dIdx);
    if (mins === null) {
      t = Math.min(to, dayStartMs(dIdx + 1));
      continue;
    }
    if (mins) {
      const m1Start = floorTo(t, MIN_MS);
      const m1 = (m1Start - dayStartMs(dIdx)) / MIN_MS;
      if (t === m1Start && t + MIN_MS <= segEnd) {
        const b = barAt(mins, m1, t, MIN_MS);
        if (b) out.push(b);
        t += MIN_MS;
        continue;
      }
      const subEnd = Math.min(segEnd, m1Start + MIN_MS);
      const hIdx = hourIndexOf(t);
      const secs = secondBars(sym, hIdx);
      if (secs) {
        walkForward(sym, SEC_MS, t, subEnd, (b) => out.push(b));
        t = subEnd;
        continue;
      }
      if (secs === undefined && m1Start + MIN_MS <= to) {
        const b = barAt(mins, m1, m1Start, MIN_MS);
        if (b) out.push(b);
        t = m1Start + MIN_MS;
        continue;
      }
      t = secs === null ? subEnd : to;
      continue;
    }
    // minutes not loaded: the 5-minute bar counts once it has completed
    if (m5Start + BAR_MS <= to) {
      const bars = dayBars(sym, dIdx);
      const b = bars ? barAt(bars, (m5Start - dayStartMs(dIdx)) / BAR_MS, m5Start, BAR_MS) : null;
      if (b) out.push(b);
      t = m5Start + BAR_MS;
      continue;
    }
    t = to;
  }
  return out;
}

/**
 * Candles for `tf` that are visible at `cursor`. The last candle may still be forming: it includes
 * the finer bars completed so far. Oldest first.
 */
export function getCandles(symbolId: string, tf: Timeframe, cursor: number, count: number): Candle[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym || count <= 0) return [];
  const level = baseMsOf(tf);
  const out: Candle[] = [];
  let current: Candle | null = null;
  const add = (b: Bar): boolean => {
    const bucket = candleTime(sym, tf, b.time) / 1000;
    if (!current || current.time !== bucket) {
      if (current) {
        out.push(current);
        if (out.length >= count) return false;
      }
      current = { time: bucket, open: b.open, high: b.high, low: b.low, close: b.close };
    } else {
      current.open = b.open;
      if (b.high > current.high) current.high = b.high;
      if (b.low < current.low) current.low = b.low;
    }
    return true;
  };
  const levelStart = floorTo(cursor, level);
  const tail = cursor > levelStart ? replayBars(symbolId, levelStart, cursor) : [];
  let going = true;
  for (let i = tail.length - 1; i >= 0 && going; i--) going = add(tail[i]);
  if (going) walkBack(sym, level, levelStart, add);
  if (current && out.length < count) out.push(current);
  return out.reverse();
}

/**
 * Candles whose bucket starts in [fromMs, toMs), built only from bars completed by `cursor`
 * (the forming candle included). Used by the TradingView datafeed. Oldest first.
 */
export function candlesBetween(symbolId: string, tf: Timeframe, fromMs: number, toMs: number, cursor: number): Candle[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym) return [];
  const level = baseMsOf(tf);
  const end = Math.min(toMs, cursor);
  const out: Candle[] = [];
  let current: Candle | null = null;
  const add = (b: Bar) => {
    const bucketMs = candleTime(sym, tf, b.time);
    if (bucketMs < fromMs || bucketMs >= toMs) return;
    if (!current || current.time !== bucketMs / 1000) {
      if (current) out.push(current);
      current = { time: bucketMs / 1000, open: b.open, high: b.high, low: b.low, close: b.close };
    } else {
      if (b.high > current.high) current.high = b.high;
      if (b.low < current.low) current.low = b.low;
      current.close = b.close;
    }
  };
  const levelEnd = floorTo(end, level);
  // a daily candle of a New York-close market starts the evening before its date
  walkForward(sym, level, tf === '1D' && !sym.weekends ? fromMs - 3 * HOUR_MS : fromMs, levelEnd, add);
  if (end > levelEnd) replayBars(symbolId, levelEnd, end).forEach(add);
  if (current) out.push(current);
  return out;
}

/** Close of the last completed bar at `cursor` (finest data first), or null when nothing of the last 12 days is loaded. */
export function knownPriceAt(symbolId: string, cursor: number): number | null {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym) return null;
  // inside a minute: the seconds so far; inside a 5-minute bar: the minutes so far
  if (cursor % MIN_MS !== 0) {
    const h = hourIndexOf(cursor - 1);
    const secs = secondBars(sym, h);
    if (secs) {
      const h0 = hourStartMs(h);
      for (let j = Math.floor((cursor - h0) / SEC_MS) - 1; j >= Math.floor((floorTo(cursor, MIN_MS) - h0) / SEC_MS); j--)
        if (!Number.isNaN(secs[j * 4 + 3])) return secs[j * 4 + 3];
    }
  }
  if (cursor % BAR_MS !== 0) {
    const d = dayIndexOf(cursor - 1);
    const mins = minuteBars(sym, d);
    if (mins) {
      const d0 = dayStartMs(d);
      for (let j = Math.floor((cursor - d0) / MIN_MS) - 1; j >= Math.floor((floorTo(cursor, BAR_MS) - d0) / MIN_MS); j--)
        if (!Number.isNaN(mins[j * 4 + 3])) return mins[j * 4 + 3];
    }
  }
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
  return null;
}

/** Close of the last completed bar at `cursor` (the symbol's reference price when nothing is loaded). */
export function priceAt(symbolId: string, cursor: number): number {
  return knownPriceAt(symbolId, cursor) ?? SYMBOL_MAP[symbolId]?.base ?? 0;
}

/** Completed 5-minute bars between `from` (inclusive start) and `to` (inclusive end). */
export function bars5m(symbolId: string, from: number, to: number): Bar[] {
  const sym = SYMBOL_MAP[symbolId];
  if (!sym || to <= from) return [];
  const out: Bar[] = [];
  walkForward(sym, BAR_MS, from, to, (b) => out.push(b));
  return out;
}

/**
 * Next replay cursor for one step of `tf`: the end of the candle that is forming (on the first
 * symbol's candles), skipping weekends and days none of the symbols trade.
 */
export function stepCursor(cursor: number, tf: Timeframe, symbolIds: string[]): number {
  const syms = symbolIds.map((id) => SYMBOL_MAP[id]).filter(Boolean);
  const lead = syms[0];
  if (!lead) return floorTo(cursor, TF_MS[tf]) + TF_MS[tf];
  const weekendsOff = syms.every((s) => !s.weekends);
  let next = candleEnd(lead, tf, cursor);
  for (let guard = 0; guard < 10; guard++) {
    // a step that would end while the market is closed ends with the first candle after it reopens
    const reopen = weekendsOff ? weekendReopen(next - 1) : null;
    if (reopen !== null) {
      next = candleEnd(lead, tf, reopen);
      continue;
    }
    const idx = dayIndexOf(next - 1);
    if (syms.some((s) => isTradingDay(s, idx))) break;
    next = candleEnd(lead, tf, dayStartMs(idx + 1));
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
