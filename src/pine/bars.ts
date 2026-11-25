import { DAY_MS } from '../lib/calendar';
import { SYMBOL_MAP, TIMEFRAMES, candleTime, type SymbolInfo, type Timeframe } from '../lib/market';
import type { BarData, SymbolMeta, TimeframeMeta } from './core';
import type { SubBars } from './broker';

/**
 * The tester's price data: 5-minute bars of the chosen range (the platform's base data), built into
 * the chart's timeframe with the same candle rules as the replay (daily and 4-hour candles of forex,
 * metals, energy and indices close at 17:00 New York). The 5-minute bars stay as each candle's
 * insides for the bar magnifier.
 */

export const BASE_MS = 5 * 60_000;

export interface BaseBars {
  /** open times, UTC ms, ascending, completed bars only */
  time: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
}

/** Timeframes the tester offers (TradingView's codes). */
export const TESTER_TIMEFRAMES: { tv: string; label: string; id?: Timeframe }[] = [
  { tv: '5', label: '۵ دقیقه', id: '5m' },
  { tv: '15', label: '۱۵ دقیقه', id: '15m' },
  { tv: '30', label: '۳۰ دقیقه', id: '30m' },
  { tv: '60', label: '۱ ساعت', id: '1h' },
  { tv: '120', label: '۲ ساعت' },
  { tv: '240', label: '۴ ساعت', id: '4h' },
  { tv: 'D', label: 'روزانه', id: '1D' },
  { tv: 'W', label: 'هفتگی' },
];

export function tfMeta(tv: string): TimeframeMeta {
  const t = tv.toUpperCase().replace(/^1(?=[DWM]$)/, '');
  if (t === 'D') return { period: 'D', ms: DAY_MS };
  if (t === 'W') return { period: 'W', ms: 7 * DAY_MS };
  if (t === 'M') return { period: 'M', ms: 30 * DAY_MS };
  const m = /^(\d+)([DWMSH]?)$/.exec(t);
  if (!m) throw new Error(`تایم‌فریم «${tv}» معتبر نیست.`);
  const k = Number(m[1]);
  switch (m[2]) {
    case 'D':
      return { period: `${k}D`, ms: k * DAY_MS };
    case 'W':
      return { period: `${k}W`, ms: k * 7 * DAY_MS };
    case 'M':
      return { period: `${k}M`, ms: k * 30 * DAY_MS };
    case 'H':
      return { period: String(k * 60), ms: k * 3_600_000 };
    case 'S':
      return { period: `${k}S`, ms: k * 1000 };
    default:
      return { period: String(k), ms: k * 60_000 };
  }
}

/** The candle (start time) a 5-minute bar belongs to. */
function bucketFn(sym: SymbolInfo, tf: TimeframeMeta): (t: number) => number {
  const ours = TIMEFRAMES.find((x) => (x.tv === tf.period || (tf.period === 'D' && x.id === '1D')) && x.ms >= BASE_MS);
  if (ours) return (t) => candleTime(sym, ours.id, t);
  const day = (t: number) => candleTime(sym, '1D', t);
  if (tf.period.endsWith('W')) {
    const n = Number(tf.period.slice(0, -1) || 1);
    return (t) => {
      const d = Math.floor(day(t) / DAY_MS);
      const monday = d - ((d + 3) % 7);
      return (monday - (Math.floor(monday / 7) % n) * 7) * DAY_MS;
    };
  }
  if (tf.period.endsWith('M')) {
    const n = Number(tf.period.slice(0, -1) || 1);
    return (t) => {
      const d = new Date(day(t));
      const m = d.getUTCFullYear() * 12 + d.getUTCMonth();
      const s = m - (m % n);
      return Date.UTC(Math.floor(s / 12), s % 12, 1);
    };
  }
  if (tf.period.endsWith('D')) {
    const n = Number(tf.period.slice(0, -1) || 1);
    return (t) => {
      const d = Math.floor(day(t) / DAY_MS);
      return (d - (d % n)) * DAY_MS;
    };
  }
  return (t) => Math.floor(t / tf.ms) * tf.ms;
}

export function aggregate(base: BaseBars, sym: SymbolInfo, tf: TimeframeMeta): { bars: BarData; sub: SubBars } {
  const n = base.time.length;
  const bucket = bucketFn(sym, tf);
  const time: number[] = [],
    tclose: number[] = [],
    o: number[] = [],
    h: number[] = [],
    l: number[] = [],
    c: number[] = [],
    start: number[] = [],
    end: number[] = [];
  let cur = NaN;
  for (let i = 0; i < n; i++) {
    const b = bucket(base.time[i]);
    if (b !== cur) {
      if (time.length) end.push(i);
      cur = b;
      time.push(b);
      tclose.push(base.time[i] + BASE_MS);
      o.push(base.open[i]);
      h.push(base.high[i]);
      l.push(base.low[i]);
      c.push(base.close[i]);
      start.push(i);
      continue;
    }
    const k = time.length - 1;
    if (base.high[i] > h[k]) h[k] = base.high[i];
    if (base.low[i] < l[k]) l[k] = base.low[i];
    c[k] = base.close[i];
    tclose[k] = base.time[i] + BASE_MS;
  }
  if (time.length) end.push(n);
  const f = (a: number[]) => Float64Array.from(a);
  return {
    bars: { time: f(time), timeClose: f(tclose), open: f(o), high: f(h), low: f(l), close: f(c), volume: new Float64Array(time.length).fill(NaN) },
    sub: { open: base.open, high: base.high, low: base.low, close: base.close, start: Int32Array.from(start), end: Int32Array.from(end) },
  };
}

export function symbolMeta(s: SymbolInfo): SymbolMeta {
  const type = s.group === 'forex' ? 'forex' : s.group === 'crypto' ? 'crypto' : s.group === 'index' ? 'index' : 'commodity';
  return {
    id: s.id,
    ticker: s.ticker,
    description: s.description,
    type,
    currency: s.quote,
    basecurrency: s.group === 'forex' ? s.id.slice(0, 3) : s.group === 'crypto' ? s.id.replace(/USD$/, '') : '',
    mintick: 10 ** -s.digits,
    // TradingView's CFD and spot symbols have a point value of 1; the E-mini sized indices carry theirs
    pointvalue: s.id === 'NQ' || s.id === 'ES' ? s.contractSize : 1,
    timezone: s.weekends ? 'Etc/UTC' : 'America/New_York',
    contractSize: s.contractSize,
  };
}

const ALIASES: Record<string, string> = {
  GOLD: 'XAUUSD',
  SILVER: 'XAGUSD',
  US100: 'NAS100',
  NDX: 'NAS100',
  NAS100USD: 'NAS100',
  USTEC: 'NAS100',
  SPX: 'SPX500',
  US500: 'SPX500',
  SPX500USD: 'SPX500',
  DJI: 'US30',
  US30USD: 'US30',
  DE40: 'GER40',
  GER30: 'GER40',
  DAX: 'GER40',
  DE30EUR: 'GER40',
  WTI: 'USOIL',
  WTICOUSD: 'USOIL',
  BRENT: 'UKOIL',
  BCOUSD: 'UKOIL',
  NI225: 'JPN225',
  JP225: 'JPN225',
  UK100GBP: 'UK100',
  XAUUSDT: 'XAUUSD',
};

/** Our symbol id for a Pine symbol string ("OANDA:EURUSD", "BINANCE:BTCUSDT", "EURUSD"), or null. */
export function resolveSymbol(s: string, current: string): string | null {
  const raw = s.trim();
  if (!raw) return current;
  const t = raw
    .split(':')
    .pop()!
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (SYMBOL_MAP[t]) return t;
  if (ALIASES[t]) return ALIASES[t];
  if (t.endsWith('USDT') && SYMBOL_MAP[t.slice(0, -1)]) return t.slice(0, -1);
  if (t.endsWith('PERP') && SYMBOL_MAP[t.slice(0, -5)]) return t.slice(0, -5);
  return null;
}
