import { SYMBOL_MAP, TIMEFRAMES, candleEnd, candlesBetween, type Candle, type Timeframe } from '../lib/market';
import { tfMeta } from './bars';
import { compileSource, type Compiled } from './compile';
import type { BarData } from './core';
import { PineError } from './lexer';
import { runOnBars, type RunResult } from './run';

/**
 * Pine indicators on a replay chart: the script runs over the candles the replay has shown (never
 * later ones), again as the replay moves. request.security reads the same symbol's other timeframes
 * from the replay's data, up to the replay position.
 */

const compiled = new Map<string, Compiled>();

/** Compiled once per code (the closures keep no state; each run has its own). */
export function compileCached(code: string): Compiled {
  let c = compiled.get(code);
  if (!c) {
    c = compileSource(code);
    if (compiled.size > 30) compiled.delete(compiled.keys().next().value as string);
    compiled.set(code, c);
  }
  return c;
}

function toBars(sym: (typeof SYMBOL_MAP)[string], tf: Timeframe, candles: Candle[]): BarData {
  const n = candles.length;
  const b: BarData = {
    time: new Float64Array(n),
    timeClose: new Float64Array(n),
    open: new Float64Array(n),
    high: new Float64Array(n),
    low: new Float64Array(n),
    close: new Float64Array(n),
    volume: new Float64Array(n).fill(NaN),
  };
  candles.forEach((c, i) => {
    const t = c.time * 1000;
    b.time[i] = t;
    b.timeClose[i] = candleEnd(sym, tf, t);
    b.open[i] = c.open;
    b.high[i] = c.high;
    b.low[i] = c.low;
    b.close[i] = c.close;
  });
  return b;
}

export interface ChartRunInput {
  code: string;
  candles: Candle[];
  symbol: string;
  tf: Timeframe;
  /** replay position (UTC ms): nothing after it is read */
  cursor: number;
  inputs?: Record<string, unknown>;
}

export function runOnChart(r: ChartRunInput): RunResult {
  const sym = SYMBOL_MAP[r.symbol];
  const ours = TIMEFRAMES.find((t) => t.id === r.tf);
  if (!sym || !ours) return { ok: false, error: { message: 'نماد یا تایم‌فریم چارت شناخته نشد.', line: 0, col: 0 }, inputs: [], logs: [] };
  let c: Compiled;
  try {
    c = compileCached(r.code);
  } catch (e) {
    const pe = e as PineError;
    return { ok: false, error: { message: pe.message, line: pe.line ?? 0, col: pe.col ?? 0 }, inputs: [], logs: [] };
  }
  const tvCode = ours.id === '1D' ? 'D' : ours.tv;
  const bars = toBars(sym, r.tf, r.candles);
  return runOnBars({
    compiled: c,
    bars,
    sub: null,
    symbol: r.symbol,
    timeframe: tvCode,
    tf: tfMeta(tvCode),
    inputs: r.inputs,
    timeLimitMs: 1500,
    provider: (symId, meta) => {
      if (symId !== r.symbol) throw new PineError('روی چارت جلسه، request.security فقط برای نماد همین چارت کار می‌کند (نمادهای دیگر را در صفحه‌ی تست خودکار امتحان کنید).');
      const tf = TIMEFRAMES.find((t) => t.ms === meta.ms);
      if (!tf) throw new PineError(`تایم‌فریم «${meta.period}» روی چارت جلسه در دسترس نیست؛ یکی از ۱، ۵، ۱۵، ۳۰، ۶۰، ۲۴۰ دقیقه یا روزانه را انتخاب کنید.`);
      const from = (bars.time[0] ?? r.cursor) - 300 * tf.ms;
      return toBars(sym, tf.id, candlesBetween(symId, tf.id, from, r.cursor + 1, r.cursor));
    },
  });
}
