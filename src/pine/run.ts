import { SYMBOL_MAP } from '../lib/market';
import { aggregate, resolveSymbol, symbolMeta, tfMeta, type BaseBars } from './bars';
import { Broker, type BrokerSettings, type ClosedTrade, type Fill, type OpenTrade } from './broker';
import { compileSource, type Compiled, type SecurityCall } from './compile';
import { type BarData, type InputDef, type LogLine, type PlotOut, Rt, type ScriptDecl, type ShapeOut, type SymbolMeta, num, str } from './core';
import { PineError } from './lexer';
import { buildReport, type Report } from './report';

/**
 * Runs a Pine script over a symbol's bars: the tester page sends this to a Web Worker (worker.ts).
 * Strategies go through the broker emulator and come back with their trades, equity and report;
 * indicators come back with their plots.
 */

export interface RunInput {
  code: string;
  symbol: string;
  /** TradingView timeframe code ("15", "60", "D") */
  timeframe: string;
  /** 5-minute bars of the range */
  base: BaseBars;
  /** 5-minute bars of other symbols the script asks for (request.security) */
  extra?: Record<string, BaseBars>;
  /** input values by key (the settings dialog) */
  inputs?: Record<string, unknown>;
  /** the tester's properties, which override strategy(…) */
  settings?: Partial<BrokerSettings>;
  /** USD per unit of the symbol's quote currency, when it is neither USD nor the base currency */
  quoteUsd?: number;
  timeLimitMs?: number;
}

export interface PineErrorInfo {
  message: string;
  line: number;
  col: number;
  bar?: number;
  time?: number;
}

export interface RunOk {
  ok: true;
  decl: ScriptDecl;
  inputs: InputDef[];
  bars: Pick<BarData, 'time' | 'open' | 'high' | 'low' | 'close'>;
  plots: PlotOut[];
  shapes: ShapeOut[];
  bgcolors: (string | null)[] | null;
  barcolors: (string | null)[] | null;
  logs: LogLine[];
  strategy: null | {
    settings: BrokerSettings;
    closed: ClosedTrade[];
    open: (OpenTrade & { profit: number })[];
    fills: Fill[];
    report: Report;
  };
  ms: number;
}

export interface RunFail {
  ok: false;
  error: PineErrorInfo;
  inputs: InputDef[];
  logs: LogLine[];
}

export type RunResult = RunOk | RunFail;

/** The symbols a script asks for by name in request.security (to load before running). */
export function securitySymbols(code: string, current: string): { symbols: string[]; unknown: string[] } {
  let calls: SecurityCall[] = [];
  try {
    calls = compileSource(code).compiler.securities;
  } catch {
    return { symbols: [], unknown: [] };
  }
  const symbols = new Set<string>();
  const unknown: string[] = [];
  for (const c of calls) {
    if (c.symbol === null) continue;
    const id = resolveSymbol(c.symbol, current);
    if (id && id !== current) symbols.add(id);
    else if (!id) unknown.push(c.symbol);
  }
  return { symbols: [...symbols], unknown };
}

function errorInfo(e: unknown, bars?: BarData): PineErrorInfo {
  if (e instanceof PineError) return { message: e.message, line: e.line, col: e.col, bar: e.bar, time: e.bar !== undefined && bars ? bars.time[e.bar] : undefined };
  return { message: `خطای داخلی: ${(e as Error)?.message ?? String(e)}`, line: 0, col: 0 };
}

const lowerBound = (a: Float64Array, v: number) => {
  let lo = 0,
    hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] < v) lo = m + 1;
    else hi = m;
  }
  return lo;
};

/** request.security: runs the script again on the other timeframe / symbol and maps its values onto the chart's bars. */
function securityHandler(compiled: Compiled, input: RunInput, mainBars: BarData) {
  const runs = new Map<string, { bars: BarData; rec: Map<number, any[]> }>();
  const mapped = new Map<string, any[]>();
  const keyOf = (sym: string, tf: string) => `${sym}|${tf}`;

  const secondary = (symId: string, tf: string, symMeta: SymbolMeta) => {
    const key = keyOf(symId, tf);
    let run = runs.get(key);
    if (run) return run;
    const base = symId === input.symbol ? input.base : input.extra?.[symId];
    if (!base) throw new PineError(`داده‌ی نماد ${symId} برای request.security بارگذاری نشده است.`);
    const meta = tfMeta(tf);
    const { bars } = aggregate(base, SYMBOL_MAP[symId], meta);
    const rt2 = new Rt(bars, symMeta, meta, input.inputs);
    rt2.secondary = true;
    const rec = new Map<number, any[]>();
    rt2.security = (rt, id, sym, tf2, expr) => {
      const v = expr(rt);
      const s = resolveSymbol(sym, input.symbol);
      if (s === symId && (tf2 || input.timeframe) === tf) {
        let arr = rec.get(id);
        if (!arr) rec.set(id, (arr = new Array(rt.n)));
        arr[rt.bar] = v;
      }
      return v;
    };
    for (let i = 0; i < rt2.n; i++) {
      rt2.bar = i;
      compiled.main(rt2);
    }
    run = { bars, rec };
    runs.set(key, run);
    return run;
  };

  return (rt: Rt, id: number, symbol: string, tf: string, expr: (rt: Rt) => any, gaps: boolean, lookahead: boolean) => {
    if (rt.secondary) return expr(rt);
    const symId = resolveSymbol(symbol, input.symbol);
    if (!symId) throw new PineError(`نماد «${symbol}» در فهرست نمادهای سایت نیست.`);
    const tfCode = tf || input.timeframe;
    if (symId === input.symbol && tfMeta(tfCode).period === rt.tf.period) return expr(rt);
    const mkey = `${id}|${symId}|${tfCode}|${gaps}|${lookahead}`;
    let vals = mapped.get(mkey);
    if (!vals) {
      const run = secondary(symId, tfCode, symId === input.symbol ? rt.sym : symbolMeta(SYMBOL_MAP[symId]));
      const rec = run.rec.get(id) ?? [];
      const hb = run.bars;
      vals = new Array(mainBars.close.length);
      let lastK = -1;
      for (let i = 0; i < vals.length; i++) {
        let k: number;
        if (lookahead) k = lowerBound(hb.time, mainBars.time[i] + 1) - 1;
        else k = lowerBound(hb.timeClose, mainBars.timeClose[i] + 1) - 1;
        if (k < 0) vals[i] = NaN;
        else if (gaps && !lookahead && k === lastK) vals[i] = NaN;
        else vals[i] = rec[k] === undefined ? NaN : rec[k];
        lastK = k;
      }
      mapped.set(mkey, vals);
    }
    return vals[rt.bar];
  };
}

function labelsOf(rt: Rt, bars: BarData): ShapeOut[] {
  const out: ShapeOut[] = [];
  for (const d of rt.drawings) {
    if (d.deleted || d.kind !== 'label') continue;
    const p = d.props;
    let bar = num(p.x ?? p.bar);
    if (p.xloc === 'bar_time') bar = lowerBound(bars.time, bar);
    if (!(bar >= 0)) continue;
    out.push({
      bar: Math.round(bar),
      kind: 'label',
      title: '',
      style: str(p.style ?? 'label_down'),
      location: p.yloc === 'abovebar' || p.yloc === 'belowbar' ? str(p.yloc) : 'absolute',
      color: typeof p.color === 'string' ? p.color : '#2196f3ff',
      text: str(p.text),
      textColor: typeof p.textcolor === 'string' ? p.textcolor : null,
      size: str(p.size ?? 'normal'),
      price: num(p.y),
    });
  }
  return out.slice(-500);
}

export function runPine(input: RunInput): RunResult {
  const t0 = Date.now();
  const sym = SYMBOL_MAP[input.symbol];
  if (!sym) return { ok: false, error: { message: `نماد ${input.symbol} شناخته نشد.`, line: 0, col: 0 }, inputs: [], logs: [] };
  let compiled: Compiled;
  try {
    compiled = compileSource(input.code);
  } catch (e) {
    return { ok: false, error: errorInfo(e), inputs: [], logs: [] };
  }
  const meta = symbolMeta(sym);
  let tf;
  try {
    tf = tfMeta(input.timeframe);
  } catch (e) {
    return { ok: false, error: errorInfo(e), inputs: [], logs: [] };
  }
  const { bars, sub } = aggregate(input.base, sym, tf);
  if (!bars.close.length) return { ok: false, error: { message: 'در این بازه‌ی زمانی داده‌ای برای این نماد نیست.', line: 0, col: 0 }, inputs: [], logs: [] };
  const rt = new Rt(bars, meta, tf, input.inputs ?? {});
  rt.deadline = t0 + (input.timeLimitMs ?? 90_000);
  const quoteUsd = input.quoteUsd ?? 1;
  const conv = meta.currency === 'USD' ? () => 1 : sym.group === 'forex' && sym.id.startsWith('USD') ? (price: number) => 1 / price : () => quoteUsd;
  const broker = new Broker(bars, meta.pointvalue, conv, meta.mintick, sub);
  rt.broker = broker;
  rt.security = securityHandler(compiled, input, bars);
  let isStrategy = false;
  try {
    for (let i = 0; i < rt.n; i++) {
      rt.bar = i;
      if (isStrategy) broker.beforeBar(rt);
      compiled.main(rt);
      if (i === 0) {
        if (!rt.decl) throw new PineError('اسکریپت باید یک strategy(…) یا indicator(…) داشته باشد (معمولاً در خط اول، بعد از ‎//@version=5‎).', 1, 1);
        if (rt.decl.kind === 'library') throw new PineError('کتابخانه (library) اجرا نمی‌شود؛ آن را به indicator یا strategy تبدیل کنید.', 1, 1);
        isStrategy = rt.decl.kind === 'strategy';
        if (isStrategy) broker.configure(rt.decl.args, input.settings ?? {});
      }
      if (isStrategy) broker.afterBar(rt);
      if ((i & 255) === 255 && Date.now() > rt.deadline) throw new PineError('اجرای اسکریپت بیش از حد طول کشید؛ بازه‌ی زمانی را کوتاه‌تر یا تایم‌فریم را بزرگ‌تر کنید.', 0, 0, i);
    }
  } catch (e) {
    return { ok: false, error: errorInfo(e, bars), inputs: rt.inputs, logs: rt.logs };
  }
  const decl = rt.decl!;
  const last = bars.close[rt.n - 1];
  return {
    ok: true,
    decl,
    inputs: rt.inputs,
    bars: { time: bars.time, open: bars.open, high: bars.high, low: bars.low, close: bars.close },
    plots: [...rt.plots.values()],
    shapes: [...rt.shapes, ...labelsOf(rt, bars)],
    bgcolors: rt.bgcolors,
    barcolors: rt.barcolors,
    logs: rt.logs,
    strategy: isStrategy
      ? {
          settings: broker.s,
          closed: broker.closed,
          open: broker.open.map((t) => ({ ...t, profit: broker.pnl(t, last) })),
          fills: broker.fills,
          report: buildReport(broker, bars.time, bars.close),
        }
      : null,
    ms: Date.now() - t0,
  };
}
