import { PineError } from './lexer';

/**
 * Runtime pieces shared by the compiler and the built-in library.
 *
 * Values: numbers (na is NaN), booleans, strings, colors (strings "#rrggbbaa"), arrays, maps, user
 * type objects and drawing objects. A series keeps a variable's value for each bar it was set on, so
 * `x[1]` is its value at the end of the previous execution; values set again on the same bar (in a
 * loop) replace the bar's value. Every call of a user function and every `ta.*` call has its own
 * history at its own place in the code, as in Pine.
 */

export const MAX_BACK = 5000;
const TRIM_AT = MAX_BACK * 2;

export class Series {
  v: any[] = [];
  bar = -1;
}

/** One running copy of the script or of a user function (each call site has its own). */
export class Ctx {
  /** variables by slot */
  s: (Series | undefined)[] = [];
  /** state of built-in calls by node id */
  st: any[] = [];
  /** user function calls by call-site node id */
  ch: Map<number, Ctx> | undefined;
}

export interface BarData {
  /** bar open times, UTC ms */
  time: Float64Array;
  /** bar close times, UTC ms */
  timeClose: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
}

export interface SymbolMeta {
  /** our symbol id (EURUSD) */
  id: string;
  ticker: string;
  description: string;
  type: string;
  currency: string;
  basecurrency: string;
  mintick: number;
  pointvalue: number;
  timezone: string;
  /** units per lot (for showing sizes in lots) */
  contractSize: number;
}

export interface TimeframeMeta {
  /** "5", "60", "240", "D" */
  period: string;
  ms: number;
}

export type InputType = 'int' | 'float' | 'bool' | 'string' | 'source' | 'timeframe' | 'symbol' | 'session' | 'color' | 'price' | 'time' | 'text_area';

export interface InputDef {
  /** title, or "input N" */
  key: string;
  title: string;
  type: InputType;
  defval: unknown;
  options?: unknown[];
  minval?: number;
  maxval?: number;
  step?: number;
  group?: string;
  tooltip?: string;
  inline?: string;
  /** source inputs: the series names to pick from */
  line: number;
}

export interface PlotOut {
  id: number;
  title: string;
  kind: 'plot' | 'hline';
  style: string;
  color: string | null;
  linewidth: number;
  offset: number;
  /** one value per bar (NaN: none) */
  values: Float64Array;
  /** per-bar colours when the colour changes with the bars */
  colors?: (string | null)[];
  /** draw on the price chart even in a separate-pane script */
  forceOverlay?: boolean;
  display: boolean;
}

export interface ShapeOut {
  bar: number;
  kind: 'shape' | 'char' | 'arrow' | 'label';
  title: string;
  style: string;
  location: string;
  color: string | null;
  text: string;
  textColor: string | null;
  size: string;
  /** price for absolute locations and labels */
  price?: number;
}

export interface LogLine {
  bar: number;
  time: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

/** What the strategy functions need from the broker (broker.ts). */
export interface BrokerApi {
  call(name: string, rt: Rt, a: any[]): any;
  get(name: string, rt: Rt): any;
}

export interface ScriptDecl {
  kind: 'strategy' | 'indicator' | 'library';
  title: string;
  shorttitle?: string;
  overlay: boolean;
  /** strategy() arguments by name */
  args: Record<string, unknown>;
}

export class Rt {
  bar = 0;
  n: number;
  ctx: Ctx;
  root: Ctx;
  /** 1: break, 2: continue */
  brk = 0;
  decl: ScriptDecl | null = null;
  inputs: InputDef[] = [];
  inputValues: Record<string, unknown>;
  inputSeen = new Map<number, InputDef>();
  plots = new Map<number, PlotOut>();
  shapes: ShapeOut[] = [];
  bgcolors: (string | null)[] | null = null;
  barcolors: (string | null)[] | null = null;
  logs: LogLine[] = [];
  /** label.new / line.new / box.new objects, oldest first */
  drawings: Drawing[] = [];
  broker: BrokerApi | null = null;
  /** derived series (hl2 …) built once */
  derived = new Map<string, Float64Array>();
  /** request.security: runs on other timeframes / symbols */
  security: ((rt: Rt, id: number, symbol: string, tf: string, expr: (rt: Rt) => any, gaps: boolean, lookahead: boolean) => any) | null = null;
  /** true inside a request.security run: strategy calls, plots and inputs do nothing */
  secondary = false;
  deadline = Infinity;

  constructor(
    public d: BarData,
    public sym: SymbolMeta,
    public tf: TimeframeMeta,
    inputValues: Record<string, unknown> = {},
  ) {
    this.n = d.close.length;
    this.root = this.ctx = new Ctx();
    this.inputValues = inputValues;
  }

  state<T>(id: number, init: () => T): T {
    const st = this.ctx.st;
    let v = st[id];
    if (v === undefined) st[id] = v = init();
    return v as T;
  }

  series(name: string): Float64Array {
    const d = this.d;
    switch (name) {
      case 'open':
        return d.open;
      case 'high':
        return d.high;
      case 'low':
        return d.low;
      case 'close':
        return d.close;
      case 'volume':
        return d.volume;
      case 'time':
        return d.time;
      case 'time_close':
        return d.timeClose;
    }
    let s = this.derived.get(name);
    if (s) return s;
    s = new Float64Array(this.n);
    for (let i = 0; i < this.n; i++) {
      const o = d.open[i],
        h = d.high[i],
        l = d.low[i],
        c = d.close[i];
      s[i] =
        name === 'hl2'
          ? (h + l) / 2
          : name === 'hlc3'
            ? (h + l + c) / 3
            : name === 'ohlc4'
              ? (o + h + l + c) / 4
              : name === 'hlcc4'
                ? (h + l + c + c) / 4
                : name === 'bar_index'
                  ? i
                  : NaN;
    }
    this.derived.set(name, s);
    return s;
  }

  log(level: LogLine['level'], message: string) {
    if (this.secondary || this.logs.length >= 2000) return;
    this.logs.push({ bar: this.bar, time: this.d.time[this.bar], level, message });
  }
}

/** Series names a source input can pick. */
export const SOURCE_NAMES = ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'volume'];
export const SERIES_NAMES = new Set([...SOURCE_NAMES, 'time', 'time_close', 'bar_index']);

export function setSer(rt: Rt, s: Series, val: any) {
  if (s.bar !== rt.bar) {
    s.v.push(val);
    s.bar = rt.bar;
    if (s.v.length > TRIM_AT) s.v.splice(0, s.v.length - MAX_BACK);
  } else s.v[s.v.length - 1] = val;
}

export const isNa = (v: any) => v === undefined || v === null || (typeof v === 'number' && v !== v);
export const num = (v: any): number => (typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : NaN);
export const truthy = (v: any) => v === true || (typeof v === 'number' && v !== 0 && v === v);
export const int = (v: any): number => {
  const n = num(v);
  return n === n ? Math.trunc(n) : NaN;
};
export const str = (v: any): string => (typeof v === 'string' ? v : isNa(v) ? '' : String(v));

export function fail(message: string): never {
  throw new PineError(message);
}

/** Pine array (array.new_*). Tuples (`[a, b]`) are plain JS arrays. */
export class PArray {
  constructor(
    public a: any[],
    public type = 'float',
  ) {}
}

export class PMap {
  m = new Map<any, any>();
}

/** label / line / box / table objects: kept so scripts that draw run; drawn as markers where possible. */
export class Drawing {
  deleted = false;
  constructor(
    public kind: string,
    public props: Record<string, any>,
  ) {}
}

export class UdtObj {
  constructor(
    public type: string,
    public f: Record<string, any>,
  ) {}
}

export type Builtin = {
  /** parameter names in order (for named arguments) */
  p: string[];
  f: (rt: Rt, a: any[], id: number) => any;
};
