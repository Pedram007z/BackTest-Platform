import { type Builtin, Ctx, Drawing, PArray, PMap, type Rt, SERIES_NAMES, SOURCE_NAMES, Series, UdtObj, fail, int, isNa, num, setSer, str, truthy } from './core';
import { PineError } from './lexer';
import { IO, VARS, constant } from './lib/io';
import { STD, colorLiteral, toStr } from './lib/std';
import { TA } from './lib/ta';
import { TIME } from './lib/time';
import { type Node, type Program, parse } from './parser';

/**
 * Compiles the syntax tree into closures (one per node), which run once per bar on a runtime (`Rt`).
 * Names are resolved here: a variable becomes a slot in the script's or the function call's context,
 * so reading one at run time is an array lookup.
 */

export const BUILTINS: Record<string, Builtin> = { ...STD, ...TIME, ...TA, ...IO };

export type Fn = (rt: Rt) => any;

interface VarInfo {
  slot: number;
  global: boolean;
}

class Scope {
  vars = new Map<string, VarInfo>();
  constructor(
    public parent: Scope | null,
    public inFn: boolean,
  ) {}
  lookup(name: string): VarInfo | undefined {
    for (let s: Scope | null = this; s; s = s.parent) {
      const v = s.vars.get(name);
      if (v) return v;
    }
    return undefined;
  }
}

interface UserFn {
  name: string;
  params: { name: string; slot: number; def: Fn | null }[];
  body: Fn;
}

/** A request.security call found in the code (its symbol, when written as text, is loaded before the run). */
export interface SecurityCall {
  id: number;
  symbol: string | null;
  timeframe: string | null;
  line: number;
}

const NOOP: Fn = () => NaN;

const V4_TA =
  'sma ema rma wma hma vwma swma alma linreg stdev variance dev highest lowest highestbars lowestbars change mom roc rsi cci cmo crossover crossunder cross rising falling barssince valuewhen pivothigh pivotlow cum tr atr macd bb bbw kc kcw stoch wpr dmi supertrend sar median percentrank range correlation tsi mfi vwap cog';
const V4_MATH = 'abs ceil floor round max min avg pow sqrt log log10 exp sign sin cos tan asin acos atan';
/** Pine v4's names without a namespace, as v5 calls them. */
const V4_FUNCTIONS: Record<string, string> = {
  ...Object.fromEntries(V4_TA.split(' ').map((x) => [x, `ta.${x}`])),
  ...Object.fromEntries(V4_MATH.split(' ').map((x) => [x, `math.${x}`])),
  sum: 'math.sum',
  tostring: 'str.tostring',
  tonumber: 'str.tonumber',
  security: 'request.security',
  study: 'indicator',
};
const MAX_LOOP = 1_000_000;

function eq(a: any, b: any): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  return a === b;
}

function located(e: unknown, n: Node, rt: Rt): PineError {
  if (e instanceof PineError) {
    if (!e.line) {
      e.line = n.line;
      e.col = n.col;
    }
    if (e.bar === undefined) e.bar = rt.bar;
    return e;
  }
  if (e instanceof RangeError) return new PineError('حافظه یا عمق اجرا تمام شد (حلقه یا آرایه‌ی خیلی بزرگ).', n.line, n.col, rt.bar);
  return new PineError(`خطای اجرا: ${(e as Error)?.message ?? e}`, n.line, n.col, rt.bar);
}

export function callUser(rt: Rt, uf: UserFn, site: number, vals: any[]) {
  const parent = rt.ctx;
  let c = parent.ch?.get(site);
  if (!c) {
    c = new Ctx();
    (parent.ch ??= new Map()).set(site, c);
  }
  rt.ctx = c;
  try {
    for (let i = 0; i < uf.params.length; i++) {
      const p = uf.params[i];
      const s = (c.s[p.slot] ??= new Series());
      setSer(rt, s, vals[i]);
    }
    return uf.body(rt);
  } finally {
    rt.ctx = parent;
  }
}

export class Compiler {
  slots = 0;
  fns = new Map<string, UserFn>();
  methods = new Map<string, UserFn>();
  types = new Map<string, { fields: { name: string; def: Fn | null }[] }>();
  securities: SecurityCall[] = [];
  global = new Scope(null, false);
  lazyBool: boolean;

  constructor(public program: Program) {
    this.lazyBool = (program.version ?? 5) >= 6;
  }

  err(n: Node, msg: string): PineError {
    return new PineError(msg, n.line, n.col);
  }

  compile(): Fn {
    return this.block(this.program.body, this.global, false);
  }

  block(stmts: Node[], sc: Scope, newScope = true): Fn {
    const scope = newScope ? new Scope(sc, sc.inFn) : sc;
    const fns = stmts.map((s) => this.stmt(s, scope)).filter((f) => f !== NOOP);
    if (fns.length === 0) return NOOP;
    if (fns.length === 1) return fns[0];
    return (rt) => {
      let v: any = NaN;
      for (let i = 0; i < fns.length; i++) {
        v = fns[i](rt);
        if (rt.brk) return v;
      }
      return v;
    };
  }

  wrap(n: Node, f: Fn): Fn {
    return (rt) => {
      try {
        return f(rt);
      } catch (e) {
        throw located(e, n, rt);
      }
    };
  }

  // ---------- statements ----------

  stmt(n: Node, sc: Scope): Fn {
    switch (n.k) {
      case 'expr':
        return this.wrap(n, this.expr(n.e, sc));
      case 'decl':
        return this.wrap(n, this.decl(n, sc));
      case 'tdecl':
        return this.wrap(n, this.tupleDecl(n, sc));
      case 'assign':
        return this.wrap(n, this.assign(n, sc));
      case 'func':
        if (sc !== this.global) throw this.err(n, 'تابع‌ها فقط در بالاترین سطح اسکریپت (بدون تورفتگی) تعریف می‌شوند.');
        this.funcDef(n);
        return NOOP;
      case 'type':
        if (sc !== this.global) throw this.err(n, 'نوع‌ها فقط در بالاترین سطح اسکریپت تعریف می‌شوند.');
        this.typeDef(n);
        return NOOP;
      case 'if':
      case 'switch':
        return this.expr(n, sc);
      case 'for':
        return this.forLoop(n, sc);
      case 'forin':
        return this.forIn(n, sc);
      case 'while':
        return this.whileLoop(n, sc);
      case 'break':
        return (rt) => ((rt.brk = 1), NaN);
      case 'continue':
        return (rt) => ((rt.brk = 2), NaN);
      default:
        throw this.err(n, 'دستور ناشناخته.');
    }
  }

  declare(n: Node, sc: Scope, name: string): VarInfo {
    if (name !== '_' && sc.vars.has(name)) throw this.err(n, `متغیر «${name}» قبلاً در همین بخش تعریف شده است؛ برای تغییر مقدار آن از «:=» استفاده کنید.`);
    const info: VarInfo = { slot: this.slots++, global: !sc.inFn };
    sc.vars.set(name, info);
    return info;
  }

  decl(n: Node, sc: Scope): Fn {
    const val = this.expr(n.value, sc);
    const { slot, global } = this.declare(n, sc, n.name);
    if (n.mode === 'var' || n.mode === 'varip') {
      return (rt) => {
        const ctx = global ? rt.root : rt.ctx;
        let s = ctx.s[slot];
        if (!s) {
          s = ctx.s[slot] = new Series();
          const v = val(rt);
          setSer(rt, s, v);
          return v;
        }
        if (s.bar !== rt.bar) setSer(rt, s, s.v[s.v.length - 1]);
        return s.v[s.v.length - 1];
      };
    }
    return (rt) => {
      const v = val(rt);
      const ctx = global ? rt.root : rt.ctx;
      setSer(rt, (ctx.s[slot] ??= new Series()), v);
      return v;
    };
  }

  tupleDecl(n: Node, sc: Scope): Fn {
    const val = this.expr(n.value, sc);
    const infos = (n.names as string[]).map((name) => this.declare(n, sc, name));
    return (rt) => {
      const v = val(rt);
      if (!Array.isArray(v)) fail('سمت راست باید چند مقدار برگرداند (مثل ‎[a, b] = ta.macd(…)‎).');
      infos.forEach(({ slot, global }, i) => {
        const ctx = global ? rt.root : rt.ctx;
        setSer(rt, (ctx.s[slot] ??= new Series()), v[i]);
      });
      return v;
    };
  }

  assign(n: Node, sc: Scope): Fn {
    const val = this.expr(n.value, sc);
    const op: string = n.op;
    const combine = (old: any, v: any) => {
      switch (op) {
        case '+=':
          return typeof old === 'string' || typeof v === 'string' ? toStr(old) + toStr(v) : num(old) + num(v);
        case '-=':
          return num(old) - num(v);
        case '*=':
          return num(old) * num(v);
        case '/=':
          return num(old) / num(v);
        case '%=':
          return num(old) % num(v);
        default:
          return v;
      }
    };
    const t: Node = n.target;
    if (t.k === 'name' && !t.name.includes('.')) {
      const info = sc.lookup(t.name);
      if (!info) throw this.err(t, `متغیر «${t.name}» هنوز تعریف نشده است؛ اول آن را با «=» تعریف کنید.`);
      const { slot, global } = info;
      return (rt) => {
        const ctx = global ? rt.root : rt.ctx;
        const s = (ctx.s[slot] ??= new Series());
        const v = combine(s.v.length ? s.v[s.v.length - 1] : NaN, val(rt));
        setSer(rt, s, v);
        return v;
      };
    }
    // obj.field := …
    let objFn: Fn, field: string;
    if (t.k === 'member') {
      objFn = this.expr(t.obj, sc);
      field = t.name;
    } else {
      const parts = (t.name as string).split('.');
      if (!sc.lookup(parts[0])) throw this.err(t, `«${t.name}» قابل تغییر نیست.`);
      field = parts.pop()!;
      objFn = this.dotted(t, parts, sc);
    }
    return (rt) => {
      const o = objFn(rt);
      if (!(o instanceof UdtObj)) fail(`فیلد «${field}» فقط در اشیای نوع‌های تعریف‌شده قابل تغییر است.`);
      if (!(field in o.f)) fail(`نوع «${o.type}» فیلدی به نام «${field}» ندارد.`);
      const v = combine(o.f[field], val(rt));
      o.f[field] = v;
      return v;
    };
  }

  funcDef(n: Node) {
    if (this.fns.has(n.name) && !n.isMethod) throw this.err(n, `تابع «${n.name}» دوباره تعریف شده است.`);
    const sc = new Scope(this.global, true);
    const params = (n.params as { name: string; def?: Node }[]).map((p) => {
      const info = this.declare(n, sc, p.name);
      return { name: p.name, slot: info.slot, def: p.def ? this.expr(p.def, this.global) : null };
    });
    const uf: UserFn = { name: n.name, params, body: NOOP };
    // registered before the body is compiled would allow recursion, which Pine does not
    uf.body = n.isBlock ? this.block(n.body, sc, false) : this.expr(n.body, sc);
    if (n.isMethod) this.methods.set(n.name, uf);
    else this.fns.set(n.name, uf);
  }

  typeDef(n: Node) {
    const fields = (n.fields as { name: string; def?: Node }[]).map((f) => ({ name: f.name, def: f.def ? this.expr(f.def, this.global) : null }));
    this.types.set(n.name, { fields });
  }

  forLoop(n: Node, sc: Scope): Fn {
    const from = this.expr(n.from, sc);
    const to = this.expr(n.to, sc);
    const by = n.by ? this.expr(n.by, sc) : null;
    const inner = new Scope(sc, sc.inFn);
    const { slot, global } = this.declare(n, inner, n.name);
    const body = this.block(n.body, inner, false);
    return this.wrap(n, (rt) => {
      const a = num(from(rt)),
        b = num(to(rt));
      if (a !== a || b !== b) return NaN;
      let step = by ? Math.abs(num(by(rt))) : 1;
      if (!(step > 0)) fail('گام حلقه (by) باید بزرگ‌تر از صفر باشد.');
      if (a > b) step = -step;
      const ctx = global ? rt.root : rt.ctx;
      const s = (ctx.s[slot] ??= new Series());
      const guard = { n: 0 };
      let v: any = NaN;
      for (let i = a; step > 0 ? i <= b : i >= b; i += step) {
        setSer(rt, s, i);
        v = body(rt);
        if (++guard.n > MAX_LOOP) fail('حلقه بیش از ۱٬۰۰۰٬۰۰۰ بار در یک کندل تکرار شد.');
        if (rt.brk === 1) {
          rt.brk = 0;
          break;
        }
        rt.brk = 0;
      }
      return v;
    });
  }

  forIn(n: Node, sc: Scope): Fn {
    const arr = this.expr(n.arr, sc);
    const inner = new Scope(sc, sc.inFn);
    const idxInfo = n.index ? this.declare(n, inner, n.index) : null;
    const itemInfo = this.declare(n, inner, n.item);
    const body = this.block(n.body, inner, false);
    return this.wrap(n, (rt) => {
      const a = arr(rt);
      let entries: [any, any][];
      if (a instanceof PArray) entries = a.a.map((x, i) => [i, x]);
      else if (a instanceof PMap) entries = [...a.m.entries()];
      else if (Array.isArray(a)) entries = a.map((x, i) => [i, x]);
      else fail('حلقه‌ی for…in فقط روی آرایه یا map کار می‌کند.');
      const ctx = itemInfo.global ? rt.root : rt.ctx;
      const si = (ctx.s[itemInfo.slot] ??= new Series());
      const sk = idxInfo ? (ctx.s[idxInfo.slot] ??= new Series()) : null;
      let v: any = NaN;
      for (const [k, x] of entries) {
        if (sk) setSer(rt, sk, k);
        setSer(rt, si, x);
        v = body(rt);
        if (rt.brk === 1) {
          rt.brk = 0;
          break;
        }
        rt.brk = 0;
      }
      return v;
    });
  }

  whileLoop(n: Node, sc: Scope): Fn {
    const cond = this.expr(n.cond, sc);
    const body = this.block(n.body, sc);
    return this.wrap(n, (rt) => {
      let v: any = NaN;
      let k = 0;
      while (truthy(cond(rt))) {
        v = body(rt);
        if (++k > MAX_LOOP) fail('حلقه‌ی while بیش از ۱٬۰۰۰٬۰۰۰ بار در یک کندل تکرار شد؛ شرط پایان را بررسی کنید.');
        if (rt.brk === 1) {
          rt.brk = 0;
          break;
        }
        rt.brk = 0;
      }
      return v;
    });
  }

  // ---------- expressions ----------

  expr(n: Node, sc: Scope): Fn {
    switch (n.k) {
      case 'num': {
        const v = n.v as number;
        return () => v;
      }
      case 'str': {
        const v = n.v as string;
        return () => v;
      }
      case 'color': {
        const v = colorLiteral(n.v);
        return () => v;
      }
      case 'bool': {
        const v = n.v as boolean;
        return () => v;
      }
      case 'name':
        return this.name(n, sc);
      case 'member': {
        const obj = this.expr(n.obj, sc);
        const name: string = n.name;
        return (rt) => this.field(obj(rt), name);
      }
      case 'call':
        return this.call(n, sc);
      case 'mcall':
        return this.methodCall(n, this.expr(n.obj, sc), n.name, sc);
      case 'index':
        return this.history(n, sc);
      case 'unary': {
        const e = this.expr(n.e, sc);
        if (n.op === 'not') return (rt) => !truthy(e(rt));
        if (n.op === '-') return (rt) => -num(e(rt));
        return (rt) => num(e(rt));
      }
      case 'binary':
        return this.binary(n, sc);
      case 'ternary': {
        const c = this.expr(n.c, sc),
          a = this.expr(n.a, sc),
          b = this.expr(n.b, sc);
        return (rt) => (truthy(c(rt)) ? a(rt) : b(rt));
      }
      case 'tuple': {
        const items = (n.items as Node[]).map((x) => this.expr(x, sc));
        return (rt) => items.map((f) => f(rt));
      }
      case 'if': {
        const c = this.expr(n.cond, sc);
        const then = this.block(n.then, sc);
        const els = n.els ? this.block(n.els, sc) : null;
        return this.wrap(n, (rt) => (truthy(c(rt)) ? then(rt) : els ? els(rt) : NaN));
      }
      case 'switch':
        return this.switchExpr(n, sc);
      default:
        throw this.err(n, 'این دستور جای یک مقدار به کار رفته است.');
    }
  }

  binary(n: Node, sc: Scope): Fn {
    const l = this.expr(n.l, sc),
      r = this.expr(n.r, sc);
    switch (n.op as string) {
      case '+':
        return (rt) => {
          const a = l(rt),
            b = r(rt);
          if (typeof a === 'number' && typeof b === 'number') return a + b;
          if (typeof a === 'string' || typeof b === 'string') return toStr(a) + toStr(b);
          return num(a) + num(b);
        };
      case '-':
        return (rt) => num(l(rt)) - num(r(rt));
      case '*':
        return (rt) => num(l(rt)) * num(r(rt));
      case '/':
        return (rt) => num(l(rt)) / num(r(rt));
      case '%':
        return (rt) => num(l(rt)) % num(r(rt));
      case '<':
        return (rt) => l(rt) < r(rt);
      case '>':
        return (rt) => l(rt) > r(rt);
      case '<=':
        return (rt) => l(rt) <= r(rt);
      case '>=':
        return (rt) => l(rt) >= r(rt);
      case '==':
        return (rt) => eq(l(rt), r(rt));
      case '!=':
        return (rt) => {
          const a = l(rt),
            b = r(rt);
          if (isNa(a) || isNa(b)) return false;
          return !eq(a, b);
        };
      case 'and':
        return this.lazyBool
          ? (rt) => truthy(l(rt)) && truthy(r(rt))
          : (rt) => {
              const a = truthy(l(rt));
              const b = truthy(r(rt));
              return a && b;
            };
      case 'or':
        return this.lazyBool
          ? (rt) => truthy(l(rt)) || truthy(r(rt))
          : (rt) => {
              const a = truthy(l(rt));
              const b = truthy(r(rt));
              return a || b;
            };
    }
    throw this.err(n, `عملگر «${n.op}» ناشناخته است.`);
  }

  switchExpr(n: Node, sc: Scope): Fn {
    const subject = n.subject ? this.expr(n.subject, sc) : null;
    const cases = (n.cases as { cond: Node | null; body: Node[] }[]).map((c) => ({ cond: c.cond ? this.expr(c.cond, sc) : null, body: this.block(c.body, sc) }));
    return this.wrap(n, (rt) => {
      const s = subject ? subject(rt) : undefined;
      for (const c of cases) {
        if (!c.cond) return c.body(rt);
        const v = c.cond(rt);
        if (subject ? eq(v, s) : truthy(v)) return c.body(rt);
      }
      return NaN;
    });
  }

  field(o: any, name: string): any {
    if (o instanceof UdtObj) {
      if (!(name in o.f)) fail(`نوع «${o.type}» فیلدی به نام «${name}» ندارد.`);
      return o.f[name];
    }
    if (o instanceof Drawing) return o.props[name] ?? NaN;
    if (isNa(o)) fail(`مقدار na است و فیلد «${name}» ندارد (شیء ساخته نشده).`);
    fail(`«${name}» فیلد این مقدار نیست.`);
  }

  /** `a.b.c` where `a` is a variable: fields of user type objects. */
  dotted(n: Node, parts: string[], sc: Scope): Fn {
    const head = this.name({ ...n, name: parts[0] }, sc);
    let f = head;
    for (const p of parts.slice(1)) {
      const g = f;
      f = (rt) => this.field(g(rt), p);
    }
    return f;
  }

  name(n: Node, sc: Scope): Fn {
    const name: string = n.name;
    if (name === 'na') return () => NaN;
    const info = sc.lookup(name);
    if (info) {
      const { slot, global } = info;
      return global
        ? (rt) => {
            const s = rt.root.s[slot];
            return s && s.v.length ? s.v[s.v.length - 1] : NaN;
          }
        : (rt) => {
            const s = rt.ctx.s[slot];
            return s && s.v.length ? s.v[s.v.length - 1] : NaN;
          };
    }
    const dot = name.indexOf('.');
    if (dot > 0 && sc.lookup(name.slice(0, dot))) return this.dotted(n, name.split('.'), sc);
    if (SERIES_NAMES.has(name)) return (rt) => rt.series(name)[rt.bar];
    const v = VARS[name] ?? VARS[`ta.${name}`];
    if (v) {
      const id = n.id;
      return (rt) => v(rt, id);
    }
    const c = constant(name);
    if (c.ok) {
      const val = c.v;
      return () => val;
    }
    if (this.fns.has(name) || BUILTINS[name]) throw this.err(n, `«${name}» تابع است و باید با پرانتز صدا زده شود، مثل ${name}(…).`);
    throw this.err(n, `«${name}» تعریف نشده است${name.includes('.') ? ' یا در این نسخه پشتیبانی نمی‌شود' : ''}.`);
  }

  history(n: Node, sc: Scope): Fn {
    const idx = this.expr(n.index, sc);
    const t: Node = n.target;
    if (t.k === 'name' && t.name !== 'na') {
      const info = sc.lookup(t.name);
      if (info) {
        const { slot, global } = info;
        return (rt) => {
          const s = (global ? rt.root : rt.ctx).s[slot];
          const k = int(idx(rt));
          if (!s || !(k >= 0)) return NaN;
          const i = s.v.length - 1 - k;
          return i >= 0 ? s.v[i] : NaN;
        };
      }
      if (SERIES_NAMES.has(t.name)) {
        const name: string = t.name;
        return (rt) => {
          const k = int(idx(rt));
          const i = rt.bar - k;
          return k >= 0 && i >= 0 ? rt.series(name)[i] : NaN;
        };
      }
    }
    // any other expression: its own history at this place in the code
    const inner = this.expr(t, sc);
    const slot = this.slots++;
    return (rt) => {
      const v = inner(rt);
      const s = (rt.ctx.s[slot] ??= new Series());
      setSer(rt, s, v);
      const k = int(idx(rt));
      if (!(k >= 0)) return NaN;
      const i = s.v.length - 1 - k;
      return i >= 0 ? s.v[i] : NaN;
    };
  }

  /** Argument closures in the order of `params` (named arguments put in place). */
  args(n: Node, params: string[], fname: string, sc: Scope): (Fn | null)[] {
    const out: (Fn | null)[] = new Array(params.length).fill(null);
    let pos = 0;
    for (const a of n.args as { name?: string; value: Node }[]) {
      if (a.name) {
        const k = params.indexOf(a.name);
        if (k < 0) throw this.err(a.value, `تابع «${fname}» پارامتری به نام «${a.name}» ندارد. پارامترها: ${params.join('، ')}`);
        out[k] = this.expr(a.value, sc);
      } else {
        if (pos >= params.length) throw this.err(n, `تابع «${fname}» حداکثر ${params.length} آرگومان می‌گیرد.`);
        out[pos++] = this.expr(a.value, sc);
      }
    }
    return out;
  }

  call(n: Node, sc: Scope): Fn {
    let name: string = n.callee;
    const dot = name.lastIndexOf('.');
    // a method call written as a name: arr.push(1), obj.field.method()
    if (dot > 0) {
      const parts = name.split('.');
      if (sc.lookup(parts[0])) return this.methodCall(n, this.dotted(n, parts.slice(0, -1), sc), parts[parts.length - 1], sc);
      // a user method on a built-in value: close.double()
      const um = this.methods.get(parts[parts.length - 1]);
      if (um && !BUILTINS[name]) return this.userCall(n, um, this.name({ ...n, name: name.slice(0, dot) }, sc), sc);
    }
    const uf = this.fns.get(name);
    if (uf) return this.userCall(n, uf, null, sc);
    // Pine v4 names: sma(), crossover(), security(), study(), abs() …
    if (!BUILTINS[name] && V4_FUNCTIONS[name]) name = V4_FUNCTIONS[name];
    if (dot > 0) {
      const typeName = name.slice(0, dot);
      const t = this.types.get(typeName);
      if (t && name.endsWith('.new')) return this.construct(n, typeName, sc);
      if (t && name.endsWith('.copy')) {
        const o = this.args(n, ['object'], name, sc)[0];
        return (rt) => {
          const v = o?.(rt);
          return v instanceof UdtObj ? new UdtObj(v.type, { ...v.f }) : NaN;
        };
      }
    }
    if (name === 'request.security') return this.security(n, sc);
    if (name.startsWith('request.')) throw this.err(n, `«${name}» در این نسخه پشتیبانی نمی‌شود (فقط request.security).`);
    // input(close) / input.source(close): the default series is passed by name
    if (name === 'input.source' || name === 'input') {
      const first = (n.args as { name?: string; value: Node }[]).find((a) => !a.name || a.name === 'defval');
      if (first && first.value.k === 'name' && SOURCE_NAMES.includes(first.value.name)) {
        first.value = { ...first.value, k: 'str', v: first.value.name };
        name = 'input.source';
      }
    }
    const b = BUILTINS[name];
    if (!b) {
      if (this.methods.has(name)) throw this.err(n, `«${name}» یک method است و باید روی یک مقدار صدا زده شود، مثل x.${name}().`);
      throw this.err(n, `تابع «${name}» ${name.includes('.') ? 'در این نسخه پشتیبانی نمی‌شود' : 'تعریف نشده است (تابع‌ها باید پیش از استفاده تعریف شوند)'}.`);
    }
    const fns = this.args(n, b.p, name, sc);
    const len = fns.length;
    const id = n.id;
    const f = b.f;
    return this.wrap(n, (rt) => {
      const a = new Array(len);
      for (let i = 0; i < len; i++) {
        const g = fns[i];
        a[i] = g ? g(rt) : undefined;
      }
      return f(rt, a, id);
    });
  }

  userCall(n: Node, uf: UserFn, self: Fn | null, sc: Scope): Fn {
    const names = uf.params.map((p) => p.name);
    const given = self ? [self, ...this.args(n, names.slice(1), uf.name, sc)] : this.args(n, names, uf.name, sc);
    const fns = given.map((g, i) => {
      if (g) return g;
      const d = uf.params[i].def;
      if (d) return d;
      throw this.err(n, `آرگومان «${uf.params[i].name}» تابع «${uf.name}» داده نشده است.`);
    });
    const id = n.id;
    return this.wrap(n, (rt) => {
      const vals = new Array(fns.length);
      for (let i = 0; i < fns.length; i++) vals[i] = fns[i](rt);
      return callUser(rt, uf, id, vals);
    });
  }

  methodCall(n: Node, obj: Fn, method: string, sc: Scope): Fn {
    const um = this.methods.get(method);
    if (um) return this.userCall(n, um, obj, sc);
    const pos: Fn[] = [];
    const named: { name: string; f: Fn }[] = [];
    for (const a of n.args as { name?: string; value: Node }[]) {
      if (a.name) named.push({ name: a.name, f: this.expr(a.value, sc) });
      else pos.push(this.expr(a.value, sc));
    }
    const id = n.id;
    return this.wrap(n, (rt) => {
      const o = obj(rt);
      const ns = o instanceof PArray ? 'array' : o instanceof PMap ? 'map' : o instanceof Drawing ? o.kind : typeof o === 'string' ? 'str' : null;
      const b = ns ? BUILTINS[`${ns}.${method}`] : undefined;
      if (!b) {
        if (isNa(o)) fail(`مقدار na است و متد «${method}» ندارد (شیء ساخته نشده).`);
        fail(`متد «${method}» برای این مقدار وجود ندارد.`);
      }
      const a = new Array(b.p.length);
      a[0] = o;
      for (let i = 0; i < pos.length; i++) a[i + 1] = pos[i](rt);
      for (const { name, f } of named) {
        const k = b.p.indexOf(name);
        if (k < 0) fail(`متد «${method}» پارامتری به نام «${name}» ندارد.`);
        a[k] = f(rt);
      }
      return b.f(rt, a, id);
    });
  }

  construct(n: Node, typeName: string, sc: Scope): Fn {
    const t = this.types.get(typeName)!;
    const fns = this.args(
      n,
      t.fields.map((f) => f.name),
      `${typeName}.new`,
      sc,
    );
    return (rt) => {
      const f: Record<string, any> = {};
      t.fields.forEach((fd, i) => {
        const g = fns[i] ?? fd.def;
        f[fd.name] = g ? g(rt) : NaN;
      });
      return new UdtObj(typeName, f);
    };
  }

  security(n: Node, sc: Scope): Fn {
    const params = ['symbol', 'timeframe', 'expression', 'gaps', 'lookahead', 'ignore_invalid_symbol', 'currency', 'calc_bars_count'];
    const fns = this.args(n, params, 'request.security', sc);
    if (!fns[2]) throw this.err(n, 'request.security به عبارت (expression) نیاز دارد.');
    const lit = (k: number) => {
      const a = (n.args as { name?: string; value: Node }[]).find((x, i) => x.name === params[k] || (!x.name && i === k));
      return a && a.value.k === 'str' ? (a.value.v as string) : null;
    };
    this.securities.push({ id: n.id, symbol: lit(0), timeframe: lit(1), line: n.line });
    const [sym, tf, expr, gaps, look] = fns;
    const id = n.id;
    return this.wrap(n, (rt) => {
      if (!rt.security) return expr!(rt);
      return rt.security(rt, id, sym ? str(sym(rt)) : '', tf ? str(tf(rt)) : '', expr!, gaps ? truthy(gaps(rt)) : false, look ? truthy(look(rt)) : false);
    });
  }
}

export interface Compiled {
  main: Fn;
  compiler: Compiler;
  version?: number;
}

export function compileSource(source: string): Compiled {
  const program = parse(source);
  const compiler = new Compiler(program);
  const main = compiler.compile();
  return { main, compiler, version: program.version };
}
