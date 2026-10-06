/**
 * Indicators for the built-in chart: pure functions over the bars the replay has shown so far
 * (never later ones), and the catalog the indicators menu offers. Values before an indicator has
 * enough bars are NaN; the chart leaves those bars empty.
 */

export interface OhlcBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Source = 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';

export const SOURCES: Source[] = ['close', 'open', 'high', 'low', 'hl2', 'hlc3', 'ohlc4'];

export function sourceOf(bars: OhlcBar[], src: Source): number[] {
  return bars.map((b) =>
    src === 'hl2' ? (b.high + b.low) / 2 : src === 'hlc3' ? (b.high + b.low + b.close) / 3 : src === 'ohlc4' ? (b.open + b.high + b.low + b.close) / 4 : b[src],
  );
}

export function sma(values: number[], length: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) {
      sum = 0;
      count = 0;
      continue;
    }
    sum += v;
    count++;
    if (count > length) sum -= values[i - length];
    if (count >= length) out[i] = sum / length;
  }
  return out;
}

/** Exponential average seeded with the simple average of the first `length` values (as TradingView). */
export function ema(values: number[], length: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  const k = 2 / (length + 1);
  let prev = NaN;
  let seed = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    if (Number.isNaN(prev)) {
      seed += v;
      count++;
      if (count === length) {
        prev = seed / length;
        out[i] = prev;
      }
      continue;
    }
    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's smoothing (RMA), used by RSI and ATR. */
export function rma(values: number[], length: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  let prev = NaN;
  let seed = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    if (Number.isNaN(prev)) {
      seed += v;
      count++;
      if (count === length) {
        prev = seed / length;
        out[i] = prev;
      }
      continue;
    }
    prev = (prev * (length - 1) + v) / length;
    out[i] = prev;
  }
  return out;
}

function stdev(values: number[], length: number): number[] {
  const mean = sma(values, length);
  return values.map((_, i) => {
    if (Number.isNaN(mean[i])) return NaN;
    let s = 0;
    for (let j = i - length + 1; j <= i; j++) s += (values[j] - mean[i]) ** 2;
    return Math.sqrt(s / length);
  });
}

export function bollinger(values: number[], length: number, mult: number) {
  const basis = sma(values, length);
  const dev = stdev(values, length);
  return { basis, upper: basis.map((b, i) => b + mult * dev[i]), lower: basis.map((b, i) => b - mult * dev[i]) };
}

export function donchian(bars: OhlcBar[], length: number) {
  const upper = bars.map((_, i) => (i + 1 < length ? NaN : Math.max(...bars.slice(i + 1 - length, i + 1).map((b) => b.high))));
  const lower = bars.map((_, i) => (i + 1 < length ? NaN : Math.min(...bars.slice(i + 1 - length, i + 1).map((b) => b.low))));
  return { upper, lower, basis: upper.map((u, i) => (u + lower[i]) / 2) };
}

export function rsi(values: number[], length: number): number[] {
  const gains = values.map((v, i) => (i === 0 ? NaN : Math.max(0, v - values[i - 1])));
  const losses = values.map((v, i) => (i === 0 ? NaN : Math.max(0, values[i - 1] - v)));
  const up = rma(gains, length);
  const down = rma(losses, length);
  return up.map((u, i) => (Number.isNaN(u) ? NaN : down[i] === 0 ? 100 : u === 0 ? 0 : 100 - 100 / (1 + u / down[i])));
}

export function macd(values: number[], fast: number, slow: number, signal: number) {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line = f.map((v, i) => v - s[i]);
  const sig = ema(line, signal);
  return { macd: line, signal: sig, hist: line.map((v, i) => v - sig[i]) };
}

export function stochastic(bars: OhlcBar[], kLength: number, kSmooth: number, dSmooth: number) {
  const raw = bars.map((b, i) => {
    if (i + 1 < kLength) return NaN;
    const win = bars.slice(i + 1 - kLength, i + 1);
    const hi = Math.max(...win.map((x) => x.high));
    const lo = Math.min(...win.map((x) => x.low));
    return hi === lo ? 50 : ((b.close - lo) / (hi - lo)) * 100;
  });
  const k = sma(raw, kSmooth);
  return { k, d: sma(k, dSmooth) };
}

export function atr(bars: OhlcBar[], length: number): number[] {
  const tr = bars.map((b, i) => (i === 0 ? b.high - b.low : Math.max(b.high - b.low, Math.abs(b.high - bars[i - 1].close), Math.abs(b.low - bars[i - 1].close))));
  return rma(tr, length);
}

// ---------- catalog ----------
export type IndicatorType = 'sma' | 'ema' | 'bb' | 'donchian' | 'rsi' | 'macd' | 'stoch' | 'atr';

export interface IndicatorParam {
  key: string;
  label: string;
  kind: 'int' | 'number' | 'source';
  min?: number;
  max?: number;
  step?: number;
}

export interface IndicatorDef {
  type: IndicatorType;
  /** short name in the legend */
  short: string;
  name: string;
  nameFa: string;
  /** drawn over the candles, or in its own pane below */
  overlay: boolean;
  params: IndicatorParam[];
  defaults: Record<string, number | string>;
  /** one color per plotted line */
  plots: { key: string; label: string; color: string; histogram?: boolean }[];
  /** horizontal guide levels (oscillators) */
  levels?: number[];
}

export const INDICATORS: IndicatorDef[] = [
  {
    type: 'sma',
    short: 'MA',
    name: 'Moving Average',
    nameFa: 'میانگین متحرک ساده',
    overlay: true,
    params: [
      { key: 'length', label: 'دوره', kind: 'int', min: 1, max: 400 },
      { key: 'source', label: 'منبع', kind: 'source' },
    ],
    defaults: { length: 20, source: 'close' },
    plots: [{ key: 'value', label: 'MA', color: '#2962ff' }],
  },
  {
    type: 'ema',
    short: 'EMA',
    name: 'Moving Average Exponential',
    nameFa: 'میانگین متحرک نمایی',
    overlay: true,
    params: [
      { key: 'length', label: 'دوره', kind: 'int', min: 1, max: 400 },
      { key: 'source', label: 'منبع', kind: 'source' },
    ],
    defaults: { length: 50, source: 'close' },
    plots: [{ key: 'value', label: 'EMA', color: '#f59e0b' }],
  },
  {
    type: 'bb',
    short: 'BB',
    name: 'Bollinger Bands',
    nameFa: 'باندهای بولینگر',
    overlay: true,
    params: [
      { key: 'length', label: 'دوره', kind: 'int', min: 2, max: 400 },
      { key: 'mult', label: 'ضریب انحراف معیار', kind: 'number', min: 0.1, max: 10, step: 0.1 },
      { key: 'source', label: 'منبع', kind: 'source' },
    ],
    defaults: { length: 20, mult: 2, source: 'close' },
    plots: [
      { key: 'basis', label: 'Basis', color: '#f97316' },
      { key: 'upper', label: 'Upper', color: '#2962ff' },
      { key: 'lower', label: 'Lower', color: '#2962ff' },
    ],
  },
  {
    type: 'donchian',
    short: 'DC',
    name: 'Donchian Channels',
    nameFa: 'کانال دانچیان',
    overlay: true,
    params: [{ key: 'length', label: 'دوره', kind: 'int', min: 2, max: 400 }],
    defaults: { length: 20 },
    plots: [
      { key: 'upper', label: 'Upper', color: '#0ea5e9' },
      { key: 'basis', label: 'Basis', color: '#f97316' },
      { key: 'lower', label: 'Lower', color: '#0ea5e9' },
    ],
  },
  {
    type: 'rsi',
    short: 'RSI',
    name: 'Relative Strength Index',
    nameFa: 'شاخص قدرت نسبی',
    overlay: false,
    params: [
      { key: 'length', label: 'دوره', kind: 'int', min: 2, max: 200 },
      { key: 'source', label: 'منبع', kind: 'source' },
    ],
    defaults: { length: 14, source: 'close' },
    plots: [{ key: 'value', label: 'RSI', color: '#7e57c2' }],
    levels: [70, 50, 30],
  },
  {
    type: 'macd',
    short: 'MACD',
    name: 'MACD',
    nameFa: 'مکدی',
    overlay: false,
    params: [
      { key: 'fast', label: 'میانگین سریع', kind: 'int', min: 1, max: 200 },
      { key: 'slow', label: 'میانگین کند', kind: 'int', min: 2, max: 400 },
      { key: 'signal', label: 'خط سیگنال', kind: 'int', min: 1, max: 200 },
      { key: 'source', label: 'منبع', kind: 'source' },
    ],
    defaults: { fast: 12, slow: 26, signal: 9, source: 'close' },
    plots: [
      { key: 'hist', label: 'Histogram', color: '#26a69a', histogram: true },
      { key: 'macd', label: 'MACD', color: '#2962ff' },
      { key: 'signal', label: 'Signal', color: '#ff6d00' },
    ],
    levels: [0],
  },
  {
    type: 'stoch',
    short: 'Stoch',
    name: 'Stochastic',
    nameFa: 'استوکستیک',
    overlay: false,
    params: [
      { key: 'k', label: 'دوره %K', kind: 'int', min: 1, max: 200 },
      { key: 'smooth', label: 'هموارسازی %K', kind: 'int', min: 1, max: 50 },
      { key: 'd', label: 'دوره %D', kind: 'int', min: 1, max: 50 },
    ],
    defaults: { k: 14, smooth: 3, d: 3 },
    plots: [
      { key: 'k', label: '%K', color: '#2962ff' },
      { key: 'd', label: '%D', color: '#ff6d00' },
    ],
    levels: [80, 50, 20],
  },
  {
    type: 'atr',
    short: 'ATR',
    name: 'Average True Range',
    nameFa: 'میانگین دامنه‌ی واقعی',
    overlay: false,
    params: [{ key: 'length', label: 'دوره', kind: 'int', min: 1, max: 200 }],
    defaults: { length: 14 },
    plots: [{ key: 'value', label: 'ATR', color: '#e91e63' }],
  },
];

export const INDICATOR_MAP = Object.fromEntries(INDICATORS.map((d) => [d.type, d])) as Record<IndicatorType, IndicatorDef>;

/** An indicator added to a chart pane. */
export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  params: Record<string, number | string>;
  /** plot key → color */
  colors: Record<string, string>;
  hidden?: boolean;
}

export function newIndicator(type: IndicatorType): IndicatorConfig {
  const def = INDICATOR_MAP[type];
  return {
    id: `${type}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    type,
    params: { ...def.defaults },
    colors: Object.fromEntries(def.plots.map((p) => [p.key, p.color])),
  };
}

const num = (v: number | string | undefined, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const src = (v: number | string | undefined): Source => (SOURCES.includes(v as Source) ? (v as Source) : 'close');

/** plot key → one value per bar */
export function computeIndicator(cfg: IndicatorConfig, bars: OhlcBar[]): Record<string, number[]> {
  const p = cfg.params;
  const d = INDICATOR_MAP[cfg.type].defaults;
  const L = (k: string) => Math.max(1, Math.round(num(p[k], d[k] as number)));
  switch (cfg.type) {
    case 'sma':
      return { value: sma(sourceOf(bars, src(p.source)), L('length')) };
    case 'ema':
      return { value: ema(sourceOf(bars, src(p.source)), L('length')) };
    case 'bb':
      return bollinger(sourceOf(bars, src(p.source)), L('length'), num(p.mult, 2));
    case 'donchian':
      return donchian(bars, L('length'));
    case 'rsi':
      return { value: rsi(sourceOf(bars, src(p.source)), L('length')) };
    case 'macd':
      return macd(sourceOf(bars, src(p.source)), L('fast'), L('slow'), L('signal'));
    case 'stoch':
      return stochastic(bars, L('k'), L('smooth'), L('d'));
    case 'atr':
      return { value: atr(bars, L('length')) };
  }
}

/** "MA 20 close", "BB 20 2", … */
export function indicatorTitle(cfg: IndicatorConfig): string {
  const def = INDICATOR_MAP[cfg.type];
  return [def.short, ...def.params.map((x) => cfg.params[x.key] ?? def.defaults[x.key])].join(' ');
}
