import { DAY_MS, keyToMs, type DayKey } from '../lib/calendar';
import { SYMBOL_MAP, dayBars, dayIndexOf, dayStartMs, usdPer } from '../lib/market';
import { ensureRange } from '../services/marketFeed';
import type { BaseBars } from './bars';
import type { BrokerSettings } from './broker';
import { runPine, securitySymbols, type RunInput, type RunResult } from './run';

/**
 * The tester page's side of a run: loads the 5-minute bars of the range (from the API server, or the
 * demo's sample prices), then runs the script in a Web Worker (on the page itself where workers are
 * not allowed).
 */

export interface TesterRequest {
  code: string;
  symbol: string;
  timeframe: string;
  from: DayKey;
  to: DayKey;
  inputs?: Record<string, unknown>;
  settings?: Partial<BrokerSettings>;
}

export type Stage = 'data' | 'run';

/** The 5-minute bars of [from, to] (whole days), completed bars only. */
export async function loadBase(symbol: string, from: DayKey, to: DayKey): Promise<BaseBars> {
  const sym = SYMBOL_MAP[symbol];
  if (!sym) throw new Error(`نماد ${symbol} شناخته نشد.`);
  const fromMs = keyToMs(from);
  const toMs = keyToMs(to) + DAY_MS - 1;
  await ensureRange([symbol], fromMs, toMs);
  const t: number[] = [],
    o: number[] = [],
    h: number[] = [],
    l: number[] = [],
    c: number[] = [];
  const now = Date.now();
  for (let idx = dayIndexOf(fromMs); idx <= dayIndexOf(toMs); idx++) {
    const bars = dayBars(sym, idx);
    if (!bars) continue;
    const start = dayStartMs(idx);
    for (let j = 0; j < bars.length / 4; j++) {
      const open = bars[j * 4];
      const time = start + j * 300_000;
      if (open !== open || time + 300_000 > now) continue;
      t.push(time);
      o.push(open);
      h.push(bars[j * 4 + 1]);
      l.push(bars[j * 4 + 2]);
      c.push(bars[j * 4 + 3]);
    }
  }
  return { time: Float64Array.from(t), open: Float64Array.from(o), high: Float64Array.from(h), low: Float64Array.from(l), close: Float64Array.from(c) };
}

let worker: Worker | null = null;
let workerBroken = false;
let seq = 0;
const waiting = new Map<number, { input: RunInput; done: (r: RunResult) => void }>();

const onPage = (input: RunInput) => new Promise<RunResult>((resolve) => setTimeout(() => resolve(runPine(input)), 30));

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; result: RunResult }>) => {
      const w = waiting.get(e.data.id);
      waiting.delete(e.data.id);
      w?.done(e.data.result);
    };
    worker.onerror = () => {
      // a worker that cannot start (the single-file preview, a blocked script): run on the page instead
      workerBroken = true;
      worker = null;
      for (const [, w] of waiting) void onPage(w.input).then(w.done);
      waiting.clear();
    };
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

/** Stops a run in progress (the worker is replaced). */
export function cancelRun() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const [, w] of waiting) w.done({ ok: false, error: { message: 'اجرا متوقف شد.', line: 0, col: 0 }, inputs: [], logs: [] });
  waiting.clear();
}

function runInBackground(input: RunInput): Promise<RunResult> {
  const w = getWorker();
  if (!w) return onPage(input);
  const id = ++seq;
  return new Promise((resolve) => {
    waiting.set(id, { input, done: resolve });
    w.postMessage({ id, input });
  });
}

/** USD per unit of a quote currency near `time` (crosses such as EURGBP need GBPUSD's price). */
async function quoteRate(quote: string, time: number): Promise<number> {
  if (quote === 'USD') return 1;
  const pair = SYMBOL_MAP[`${quote}USD`] ? `${quote}USD` : SYMBOL_MAP[`USD${quote}`] ? `USD${quote}` : null;
  if (pair) await ensureRange([pair], time - 5 * DAY_MS, time);
  const r = usdPer(quote, time);
  return Number.isFinite(r) && r > 0 ? r : 1;
}

export async function runTester(req: TesterRequest, onStage: (s: Stage) => void): Promise<RunResult> {
  onStage('data');
  const base = await loadBase(req.symbol, req.from, req.to);
  if (!base.time.length)
    return { ok: false, error: { message: 'برای این نماد در این بازه‌ی زمانی داده‌ای پیدا نشد. بازه‌ی دیگری انتخاب کنید.', line: 0, col: 0 }, inputs: [], logs: [] };
  const { symbols, unknown } = securitySymbols(req.code, req.symbol);
  if (unknown.length) return { ok: false, error: { message: `نماد «${unknown[0]}» (در request.security) در فهرست نمادهای سایت نیست.`, line: 0, col: 0 }, inputs: [], logs: [] };
  const extra: Record<string, BaseBars> = {};
  for (const s of symbols) extra[s] = await loadBase(s, req.from, req.to);
  const sym = SYMBOL_MAP[req.symbol];
  const quoteUsd = sym.quote === 'USD' || sym.id.startsWith('USD') ? 1 : await quoteRate(sym.quote, base.time[base.time.length - 1]);
  onStage('run');
  return runInBackground({ code: req.code, symbol: req.symbol, timeframe: req.timeframe, base, extra, inputs: req.inputs, settings: req.settings, quoteUsd });
}
