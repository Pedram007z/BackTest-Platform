import { type Builtin, type Rt, fail, int, isNa, num, truthy } from '../core';

/**
 * ta.* (technical analysis) and math.sum: each call site keeps its own state (`rt.state(id)`), and a
 * call repeated on the same bar (in a loop) replaces that bar's value, as Pine's history does.
 * Formulas follow the Pine reference's descriptions (ta.ema starts from the first value, ta.rma from
 * an SMA, ta.atr = rma of the true range, …). Volume is not in the data: volume-based ones give na.
 */

/** The last `cap` values, one per bar. */
export class Win {
  a: number[] = [];
  bar = -1;
  cap = 1;
  push(bar: number, v: number, cap: number) {
    if (cap > this.cap) this.cap = Math.min(cap, 5000);
    if (bar === this.bar && this.a.length) this.a[this.a.length - 1] = v;
    else {
      this.a.push(v);
      this.bar = bar;
      if (this.a.length > this.cap) this.a.splice(0, this.a.length - this.cap);
    }
  }
  /** `i` bars back (0: this bar) */
  get(i: number) {
    const k = this.a.length - 1 - i;
    return k >= 0 ? this.a[k] : NaN;
  }
  /** whether the last `n` values are there and none is na */
  full(n: number) {
    if (n < 1 || this.a.length < n) return false;
    for (let i = this.a.length - n; i < this.a.length; i++) if (this.a[i] !== this.a[i]) return false;
    return true;
  }
}

/** A value carried from bar to bar: `p` is the previous execution's final value. */
export class Rec {
  p = NaN;
  c = NaN;
  bar = -1;
  begin(bar: number) {
    if (bar !== this.bar) {
      this.p = this.c;
      this.bar = bar;
    }
    return this.p;
  }
}

const len = (v: any, name = 'length') => {
  const n = int(v);
  if (!(n >= 1)) fail(`طول (${name}) باید عددی صحیح و بزرگ‌تر از صفر باشد.`);
  return n;
};

export class Sma {
  w = new Win();
  step(bar: number, v: number, n: number) {
    this.w.push(bar, v, n);
    if (!this.w.full(n)) return NaN;
    let s = 0;
    const a = this.w.a;
    for (let i = a.length - n; i < a.length; i++) s += a[i];
    return s / n;
  }
}

export class Ema {
  r = new Rec();
  step(bar: number, v: number, alpha: number) {
    const p = this.r.begin(bar);
    return (this.r.c = p !== p ? v : alpha * v + (1 - alpha) * p);
  }
}

export class Rma {
  r = new Rec();
  s = new Sma();
  step(bar: number, v: number, n: number) {
    const seed = this.s.step(bar, v, n);
    const p = this.r.begin(bar);
    return (this.r.c = p !== p ? seed : (v + (n - 1) * p) / n);
  }
}

export class Wma {
  w = new Win();
  step(bar: number, v: number, n: number) {
    this.w.push(bar, v, n);
    if (!this.w.full(n)) return NaN;
    let s = 0;
    for (let i = 0; i < n; i++) s += this.w.get(i) * (n - i);
    return s / ((n * (n + 1)) / 2);
  }
}

export class Prev {
  w = new Win();
  /** value `n` bars back, after recording `v` for this bar */
  step(bar: number, v: number, n = 1) {
    this.w.push(bar, v, n + 1);
    return this.w.get(n);
  }
}

export class Ext {
  w = new Win();
  /** [value, offset] of the highest (dir 1) or lowest (dir -1) of the last n */
  step(bar: number, v: number, n: number, dir: 1 | -1): [number, number] {
    this.w.push(bar, v, n);
    if (this.w.a.length < n) return [NaN, NaN];
    let best = NaN;
    let off = 0;
    for (let i = 0; i < n; i++) {
      const x = this.w.get(i);
      if (x !== x) return [NaN, NaN];
      if (best !== best || (dir > 0 ? x > best : x < best)) {
        best = x;
        off = -i;
      }
    }
    return [best, off];
  }
}

/** True range: with `handleNa`, high − low on the first bar. */
export class TrueRange {
  c = new Prev();
  step(rt: Rt, handleNa: boolean) {
    const i = rt.bar;
    const h = rt.d.high[i],
      l = rt.d.low[i];
    const pc = this.c.step(i, rt.d.close[i]);
    if (pc !== pc) return handleNa ? h - l : NaN;
    return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
}

const src = (a: any) => num(a);

function windowStat(rt: Rt, id: number, v: number, n: number, f: (vals: number[]) => number) {
  const w = rt.state(id, () => new Win());
  w.push(rt.bar, v, n);
  if (!w.full(n)) return NaN;
  return f(w.a.slice(w.a.length - n));
}

const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;

function stdevOf(x: number[], biased: boolean) {
  const m = mean(x);
  let s = 0;
  for (const v of x) s += (v - m) ** 2;
  return Math.sqrt(s / (biased ? x.length : x.length - 1));
}

const hiLo = (rt: Rt, a: any[], dir: 1 | -1, id: number, bars: boolean) => {
  // ta.highest(length) or ta.highest(source, length)
  const oneArg = a[1] === undefined || a[0] === undefined;
  const v = oneArg ? (dir > 0 ? rt.d.high[rt.bar] : rt.d.low[rt.bar]) : src(a[0]);
  const n = len(oneArg ? (a[1] ?? a[0]) : a[1]);
  const [best, off] = rt.state(id, () => new Ext()).step(rt.bar, v, n, dir);
  return bars ? off : best;
};

function pivot(rt: Rt, a: any[], id: number, dir: 1 | -1) {
  // ta.pivothigh(leftbars, rightbars) or ta.pivothigh(source, leftbars, rightbars)
  const withSource = a[2] !== undefined && a[0] !== undefined;
  const v = withSource ? src(a[0]) : dir > 0 ? rt.d.high[rt.bar] : rt.d.low[rt.bar];
  const left = int(a[2] !== undefined ? a[1] : a[0]);
  const right = int(a[2] !== undefined ? a[2] : a[1]);
  if (!(left >= 0 && right >= 0)) fail('تعداد کندل‌های چپ و راست پیوت باید عدد صحیح نامنفی باشد.');
  const w = rt.state(id, () => new Win());
  const n = left + right + 1;
  w.push(rt.bar, v, n);
  if (w.a.length < n) return NaN;
  const c = w.get(right);
  if (c !== c) return NaN;
  for (let i = 0; i < n; i++) {
    if (i === right) continue;
    const x = w.get(i);
    if (x !== x) return NaN;
    if (dir > 0 ? x >= c : x <= c) return NaN;
  }
  return c;
}

function ma(kind: 'sma' | 'ema' | 'rma' | 'wma') {
  return (rt: Rt, a: any[], id: number) => {
    const n = len(a[1]);
    const v = src(a[0]);
    switch (kind) {
      case 'sma':
        return rt.state(id, () => new Sma()).step(rt.bar, v, n);
      case 'ema':
        return rt.state(id, () => new Ema()).step(rt.bar, v, 2 / (n + 1));
      case 'rma':
        return rt.state(id, () => new Rma()).step(rt.bar, v, n);
      case 'wma':
        return rt.state(id, () => new Wma()).step(rt.bar, v, n);
    }
  };
}

export const TA: Record<string, Builtin> = {
  'ta.sma': { p: ['source', 'length'], f: ma('sma') },
  'ta.ema': { p: ['source', 'length'], f: ma('ema') },
  'ta.rma': { p: ['source', 'length'], f: ma('rma') },
  'ta.wma': { p: ['source', 'length'], f: ma('wma') },
  'ta.hma': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const st = rt.state(id, () => ({ h: new Wma(), f: new Wma(), o: new Wma() }));
      const v = src(a[0]);
      const half = st.h.step(rt.bar, v, Math.max(1, Math.floor(n / 2)));
      const full = st.f.step(rt.bar, v, n);
      return st.o.step(rt.bar, 2 * half - full, Math.max(1, Math.floor(Math.sqrt(n))));
    },
  },
  'ta.vwma': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const st = rt.state(id, () => ({ a: new Sma(), b: new Sma() }));
      const vol = rt.d.volume[rt.bar];
      return st.a.step(rt.bar, src(a[0]) * vol, n) / st.b.step(rt.bar, vol, n);
    },
  },
  'ta.swma': {
    p: ['source'],
    f: (rt, a, id) => {
      const w = rt.state(id, () => new Win());
      w.push(rt.bar, src(a[0]), 4);
      if (!w.full(4)) return NaN;
      return (w.get(3) + 2 * w.get(2) + 2 * w.get(1) + w.get(0)) / 6;
    },
  },
  'ta.alma': {
    p: ['series', 'length', 'offset', 'sigma', 'floor'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const offset = num(a[2] ?? 0.85);
      const sigma = num(a[3] ?? 6);
      return windowStat(rt, id, src(a[0]), n, (x) => {
        const m = a[4] === true ? Math.floor(offset * (n - 1)) : offset * (n - 1);
        const s = n / sigma;
        let norm = 0,
          sum = 0;
        for (let i = 0; i < n; i++) {
          const w = Math.exp(-((i - m) ** 2) / (2 * s * s));
          norm += w;
          sum += x[i] * w;
        }
        return sum / norm;
      });
    },
  },
  'ta.linreg': {
    p: ['source', 'length', 'offset'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const off = int(a[2] ?? 0);
      return windowStat(rt, id, src(a[0]), n, (y) => {
        let sx = 0,
          sy = 0,
          sxx = 0,
          sxy = 0;
        for (let i = 0; i < n; i++) {
          sx += i;
          sy += y[i];
          sxx += i * i;
          sxy += i * y[i];
        }
        const slope = n > 1 ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : 0;
        const intercept = (sy - slope * sx) / n;
        return intercept + slope * (n - 1 - off);
      });
    },
  },
  'ta.stdev': { p: ['source', 'length', 'biased'], f: (rt, a, id) => windowStat(rt, id, src(a[0]), len(a[1]), (x) => stdevOf(x, a[2] !== false)) },
  'ta.variance': { p: ['source', 'length', 'biased'], f: (rt, a, id) => windowStat(rt, id, src(a[0]), len(a[1]), (x) => stdevOf(x, a[2] !== false) ** 2) },
  'ta.dev': {
    p: ['source', 'length'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const m = mean(x);
        return x.reduce((s, v) => s + Math.abs(v - m), 0) / x.length;
      }),
  },
  'ta.median': {
    p: ['source', 'length'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const s = [...x].sort((p, q) => p - q);
        const m = s.length >> 1;
        return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
      }),
  },
  'ta.mode': {
    p: ['source', 'length'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const c = new Map<number, number>();
        let best = NaN,
          bc = 0;
        for (const v of x) {
          const k = (c.get(v) ?? 0) + 1;
          c.set(v, k);
          if (k > bc || (k === bc && v < best)) {
            bc = k;
            best = v;
          }
        }
        return best;
      }),
  },
  'ta.range': {
    p: ['source', 'length'],
    f: (rt, a, id) => windowStat(rt, id, src(a[0]), len(a[1]), (x) => Math.max(...x) - Math.min(...x)),
  },
  'ta.percentrank': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      return windowStat(rt, id, src(a[0]), n + 1, (x) => {
        const cur = x[x.length - 1];
        let c = 0;
        for (let i = 0; i < n; i++) if (x[i] <= cur) c++;
        return (100 * c) / n;
      });
    },
  },
  'ta.percentile_linear_interpolation': {
    p: ['source', 'length', 'percentage'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const s = [...x].sort((p, q) => p - q);
        const pos = (num(a[2]) / 100) * (s.length - 1);
        const lo = Math.floor(pos);
        return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
      }),
  },
  'ta.percentile_nearest_rank': {
    p: ['source', 'length', 'percentage'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const s = [...x].sort((p, q) => p - q);
        return s[Math.max(0, Math.ceil((num(a[2]) / 100) * s.length) - 1)];
      }),
  },
  'ta.correlation': {
    p: ['source1', 'source2', 'length'],
    f: (rt, a, id) => {
      const n = len(a[2]);
      const st = rt.state(id, () => ({ x: new Win(), y: new Win() }));
      st.x.push(rt.bar, src(a[0]), n);
      st.y.push(rt.bar, src(a[1]), n);
      if (!st.x.full(n) || !st.y.full(n)) return NaN;
      const x = st.x.a.slice(-n),
        y = st.y.a.slice(-n);
      const mx = mean(x),
        my = mean(y);
      let sxy = 0,
        sxx = 0,
        syy = 0;
      for (let i = 0; i < n; i++) {
        sxy += (x[i] - mx) * (y[i] - my);
        sxx += (x[i] - mx) ** 2;
        syy += (y[i] - my) ** 2;
      }
      return sxy / Math.sqrt(sxx * syy);
    },
  },
  'ta.highest': { p: ['source', 'length'], f: (rt, a, id) => hiLo(rt, a, 1, id, false) },
  'ta.lowest': { p: ['source', 'length'], f: (rt, a, id) => hiLo(rt, a, -1, id, false) },
  'ta.highestbars': { p: ['source', 'length'], f: (rt, a, id) => hiLo(rt, a, 1, id, true) },
  'ta.lowestbars': { p: ['source', 'length'], f: (rt, a, id) => hiLo(rt, a, -1, id, true) },
  'ta.change': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = int(a[1] ?? 1);
      if (typeof a[0] === 'boolean') {
        const w = rt.state(id, () => new Win());
        w.push(rt.bar, a[0] ? 1 : 0, n + 1);
        const p = w.get(n);
        return p === p ? (a[0] ? 1 : 0) !== p : false;
      }
      const v = src(a[0]);
      return v - rt.state(id, () => new Prev()).step(rt.bar, v, n);
    },
  },
  'ta.mom': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const v = src(a[0]);
      return v - rt.state(id, () => new Prev()).step(rt.bar, v, len(a[1]));
    },
  },
  'ta.roc': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const v = src(a[0]);
      const p = rt.state(id, () => new Prev()).step(rt.bar, v, len(a[1]));
      return (100 * (v - p)) / p;
    },
  },
  'ta.rsi': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const st = rt.state(id, () => ({ c: new Prev(), u: new Rma(), d: new Rma() }));
      const v = src(a[0]);
      const ch = v - st.c.step(rt.bar, v);
      const up = st.u.step(rt.bar, ch !== ch ? NaN : Math.max(ch, 0), n);
      const dn = st.d.step(rt.bar, ch !== ch ? NaN : -Math.min(ch, 0), n);
      if (up !== up || dn !== dn) return NaN;
      return dn === 0 ? 100 : up === 0 ? 0 : 100 - 100 / (1 + up / dn);
    },
  },
  'ta.cmo': {
    p: ['series', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const st = rt.state(id, () => ({ c: new Prev(), u: new Win(), d: new Win() }));
      const v = src(a[0]);
      const ch = v - st.c.step(rt.bar, v);
      st.u.push(rt.bar, ch >= 0 ? ch : 0, n);
      st.d.push(rt.bar, ch >= 0 ? 0 : -ch, n);
      if (ch !== ch || !st.u.full(n) || !st.d.full(n)) return NaN;
      const s1 = st.u.a.slice(-n).reduce((s, x) => s + x, 0);
      const s2 = st.d.a.slice(-n).reduce((s, x) => s + x, 0);
      return (100 * (s1 - s2)) / (s1 + s2);
    },
  },
  'ta.cci': {
    p: ['source', 'length'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const m = mean(x);
        const dev = x.reduce((s, v) => s + Math.abs(v - m), 0) / x.length;
        return (x[x.length - 1] - m) / (0.015 * dev);
      }),
  },
  'ta.cog': {
    p: ['source', 'length'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        let s = 0,
          w = 0;
        for (let i = 0; i < x.length; i++) {
          const v = x[x.length - 1 - i];
          s += v;
          w += v * (i + 1);
        }
        return -w / s;
      }),
  },
  'ta.crossover': {
    p: ['source1', 'source2'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ x: new Prev(), y: new Prev() }));
      const x = src(a[0]),
        y = src(a[1]);
      const px = st.x.step(rt.bar, x),
        py = st.y.step(rt.bar, y);
      return x > y && px <= py;
    },
  },
  'ta.crossunder': {
    p: ['source1', 'source2'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ x: new Prev(), y: new Prev() }));
      const x = src(a[0]),
        y = src(a[1]);
      const px = st.x.step(rt.bar, x),
        py = st.y.step(rt.bar, y);
      return x < y && px >= py;
    },
  },
  'ta.cross': {
    p: ['source1', 'source2'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ x: new Prev(), y: new Prev() }));
      const x = src(a[0]),
        y = src(a[1]);
      const px = st.x.step(rt.bar, x),
        py = st.y.step(rt.bar, y);
      return (x > y && px <= py) || (x < y && px >= py);
    },
  },
  'ta.rising': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const w = rt.state(id, () => new Win());
      const v = src(a[0]);
      w.push(rt.bar, v, n + 1);
      if (w.a.length < n + 1) return false;
      for (let i = 1; i <= n; i++) if (!(v > w.get(i))) return false;
      return true;
    },
  },
  'ta.falling': {
    p: ['source', 'length'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const w = rt.state(id, () => new Win());
      const v = src(a[0]);
      w.push(rt.bar, v, n + 1);
      if (w.a.length < n + 1) return false;
      for (let i = 1; i <= n; i++) if (!(v < w.get(i))) return false;
      return true;
    },
  },
  'ta.barssince': {
    p: ['condition'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ r: new Rec() }));
      const p = st.r.begin(rt.bar);
      st.r.c = truthy(a[0]) ? 0 : p === p ? p + 1 : NaN;
      return st.r.c;
    },
  },
  'ta.valuewhen': {
    p: ['condition', 'source', 'occurrence'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ vals: [] as number[], bar: -1, added: false }));
      const occ = int(a[2] ?? 0);
      if (st.bar !== rt.bar) {
        st.bar = rt.bar;
        st.added = false;
      }
      if (truthy(a[0])) {
        if (st.added) st.vals[st.vals.length - 1] = a[1];
        else {
          st.vals.push(a[1]);
          st.added = true;
          if (st.vals.length > 5000) st.vals.shift();
        }
      } else if (st.added) {
        st.vals.pop();
        st.added = false;
      }
      const k = st.vals.length - 1 - occ;
      return k >= 0 ? st.vals[k] : NaN;
    },
  },
  'ta.pivothigh': { p: ['source', 'leftbars', 'rightbars'], f: (rt, a, id) => pivot(rt, a, id, 1) },
  'ta.pivotlow': { p: ['source', 'leftbars', 'rightbars'], f: (rt, a, id) => pivot(rt, a, id, -1) },
  'ta.cum': {
    p: ['source'],
    f: (rt, a, id) => {
      const r = rt.state(id, () => new Rec());
      const p = r.begin(rt.bar);
      const v = src(a[0]);
      return (r.c = (p !== p ? 0 : p) + (v !== v ? 0 : v));
    },
  },
  'ta.max': {
    p: ['source'],
    f: (rt, a, id) => {
      const r = rt.state(id, () => new Rec());
      const p = r.begin(rt.bar);
      const v = src(a[0]);
      return (r.c = p !== p ? v : v !== v ? p : Math.max(p, v));
    },
  },
  'ta.min': {
    p: ['source'],
    f: (rt, a, id) => {
      const r = rt.state(id, () => new Rec());
      const p = r.begin(rt.bar);
      const v = src(a[0]);
      return (r.c = p !== p ? v : v !== v ? p : Math.min(p, v));
    },
  },
  'ta.tr': { p: ['handle_na'], f: (rt, a, id) => rt.state(id, () => new TrueRange()).step(rt, a[0] === true) },
  'ta.atr': {
    p: ['length'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ t: new TrueRange(), r: new Rma() }));
      return st.r.step(rt.bar, st.t.step(rt, true), len(a[0]));
    },
  },
  'ta.macd': {
    p: ['source', 'fastlen', 'slowlen', 'siglen'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ f: new Ema(), s: new Ema(), g: new Ema(), fs: new Sma(), ss: new Sma(), gs: new Sma() }));
      const v = src(a[0]);
      const fl = len(a[1], 'fastlen'),
        sl = len(a[2], 'slowlen'),
        gl = len(a[3], 'siglen');
      const fast = st.f.step(rt.bar, v, 2 / (fl + 1));
      const slow = st.s.step(rt.bar, v, 2 / (sl + 1));
      const m = fast - slow;
      const sig = st.g.step(rt.bar, m, 2 / (gl + 1));
      return [m, sig, m - sig];
    },
  },
  'ta.bb': {
    p: ['series', 'length', 'mult'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const w = rt.state(id, () => new Win());
      w.push(rt.bar, src(a[0]), n);
      if (!w.full(n)) return [NaN, NaN, NaN];
      const x = w.a.slice(-n);
      const basis = mean(x);
      const dev = num(a[2]) * stdevOf(x, true);
      return [basis, basis + dev, basis - dev];
    },
  },
  'ta.bbw': {
    p: ['series', 'length', 'mult'],
    f: (rt, a, id) =>
      windowStat(rt, id, src(a[0]), len(a[1]), (x) => {
        const basis = mean(x);
        const dev = num(a[2]) * stdevOf(x, true);
        return (2 * dev) / basis;
      }),
  },
  'ta.kc': {
    p: ['series', 'length', 'mult', 'useTrueRange'],
    f: (rt, a, id) => {
      const n = len(a[1]);
      const st = rt.state(id, () => ({ b: new Ema(), r: new Ema(), t: new TrueRange() }));
      const basis = st.b.step(rt.bar, src(a[0]), 2 / (n + 1));
      const span = a[3] === false ? rt.d.high[rt.bar] - rt.d.low[rt.bar] : st.t.step(rt, true);
      const rangeEma = st.r.step(rt.bar, span, 2 / (n + 1));
      const m = num(a[2]);
      return [basis, basis + rangeEma * m, basis - rangeEma * m];
    },
  },
  'ta.kcw': {
    p: ['series', 'length', 'mult', 'useTrueRange'],
    f: (rt, a, id) => {
      const [b, u, l] = TA['ta.kc'].f(rt, a, id) as number[];
      return (u - l) / b;
    },
  },
  'ta.stoch': {
    p: ['source', 'high', 'low', 'length'],
    f: (rt, a, id) => {
      const n = len(a[3]);
      const st = rt.state(id, () => ({ h: new Ext(), l: new Ext() }));
      const [hh] = st.h.step(rt.bar, src(a[1]), n, 1);
      const [ll] = st.l.step(rt.bar, src(a[2]), n, -1);
      return (100 * (src(a[0]) - ll)) / (hh - ll);
    },
  },
  'ta.wpr': {
    p: ['length'],
    f: (rt, a, id) => {
      const n = len(a[0]);
      const st = rt.state(id, () => ({ h: new Ext(), l: new Ext() }));
      const [hh] = st.h.step(rt.bar, rt.d.high[rt.bar], n, 1);
      const [ll] = st.l.step(rt.bar, rt.d.low[rt.bar], n, -1);
      return (100 * (rt.d.close[rt.bar] - hh)) / (hh - ll);
    },
  },
  'ta.dmi': {
    p: ['diLength', 'adxSmoothing'],
    f: (rt, a, id) => {
      const di = len(a[0], 'diLength'),
        sm = len(a[1], 'adxSmoothing');
      const st = rt.state(id, () => ({ h: new Prev(), l: new Prev(), t: new TrueRange(), tr: new Rma(), p: new Rma(), m: new Rma(), a: new Rma(), fp: new Rec(), fm: new Rec() }));
      const i = rt.bar;
      const h = rt.d.high[i],
        l = rt.d.low[i];
      const up = h - st.h.step(i, h);
      const down = -(l - st.l.step(i, l));
      const plusDM = up !== up ? NaN : up > down && up > 0 ? up : 0;
      const minusDM = down !== down ? NaN : down > up && down > 0 ? down : 0;
      const trur = st.tr.step(i, st.t.step(rt, true), di);
      const fix = (r: Rec, v: number) => {
        const p = r.begin(i);
        return (r.c = v === v ? v : p);
      };
      const plus = fix(st.fp, (100 * st.p.step(i, plusDM, di)) / trur);
      const minus = fix(st.fm, (100 * st.m.step(i, minusDM, di)) / trur);
      const sum = plus + minus;
      const adx = 100 * st.a.step(i, Math.abs(plus - minus) / (sum === 0 ? 1 : sum), sm);
      return [plus, minus, adx];
    },
  },
  'ta.supertrend': {
    p: ['factor', 'atrPeriod'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ t: new TrueRange(), atr: new Rma(), atrPrev: new Prev(), lo: new Rec(), up: new Rec(), st: new Rec(), c: new Prev() }));
      const i = rt.bar;
      const atr = st.atr.step(i, st.t.step(rt, true), len(a[1], 'atrPeriod'));
      const prevAtr = st.atrPrev.step(i, atr);
      const hl2 = (rt.d.high[i] + rt.d.low[i]) / 2;
      const f = num(a[0]);
      let upper = hl2 + f * atr;
      let lower = hl2 - f * atr;
      const prevClose = st.c.step(i, rt.d.close[i]);
      const pl = st.lo.begin(i),
        pu = st.up.begin(i);
      const prevLower = pl !== pl ? 0 : pl,
        prevUpper = pu !== pu ? 0 : pu;
      lower = lower > prevLower || prevClose < prevLower ? lower : prevLower;
      upper = upper < prevUpper || prevClose > prevUpper ? upper : prevUpper;
      st.lo.c = lower;
      st.up.c = upper;
      const ps = st.st.begin(i);
      const close = rt.d.close[i];
      let dir: number;
      if (prevAtr !== prevAtr) dir = 1;
      else if (ps === pu) dir = close > upper ? -1 : 1;
      else dir = close < lower ? 1 : -1;
      st.st.c = dir === -1 ? lower : upper;
      return [st.st.c, dir];
    },
  },
  'ta.sar': {
    p: ['start', 'inc', 'max'],
    f: (rt, a, id) => {
      // the Pine reference's pine_sar, with its `var` state carried from bar to bar
      const start = num(a[0]),
        inc = num(a[1]),
        max = num(a[2]);
      type S = { r: number; mm: number; acc: number; below: boolean };
      const st = rt.state(id, () => ({
        bar: -1,
        k: -1,
        p: { r: NaN, mm: NaN, acc: NaN, below: false } as S,
        c: { r: NaN, mm: NaN, acc: NaN, below: false } as S,
        h: new Win(),
        l: new Win(),
        cl: new Win(),
      }));
      const i = rt.bar;
      if (st.bar !== i) {
        st.bar = i;
        st.k++;
        st.p = st.c;
      }
      const h = rt.d.high[i],
        l = rt.d.low[i],
        c = rt.d.close[i];
      st.h.push(i, h, 3);
      st.l.push(i, l, 3);
      st.cl.push(i, c, 3);
      const s: S = { ...st.p };
      let first = false;
      if (st.k === 1) {
        if (c > st.cl.get(1)) {
          s.below = true;
          s.mm = h;
          s.r = st.l.get(1);
        } else {
          s.below = false;
          s.mm = l;
          s.r = st.h.get(1);
        }
        first = true;
        s.acc = start;
      }
      s.r = s.r + s.acc * (s.mm - s.r);
      if (s.below) {
        if (s.r > l) {
          first = true;
          s.below = false;
          s.r = Math.max(h, s.mm);
          s.mm = l;
          s.acc = start;
        }
      } else if (s.r < h) {
        first = true;
        s.below = true;
        s.r = Math.min(l, s.mm);
        s.mm = h;
        s.acc = start;
      }
      if (!first) {
        if (s.below) {
          if (h > s.mm) {
            s.mm = h;
            s.acc = Math.min(s.acc + inc, max);
          }
        } else if (l < s.mm) {
          s.mm = l;
          s.acc = Math.min(s.acc + inc, max);
        }
      }
      if (s.below) {
        s.r = Math.min(s.r, st.l.get(1));
        if (st.k > 1) s.r = Math.min(s.r, st.l.get(2));
      } else {
        s.r = Math.max(s.r, st.h.get(1));
        if (st.k > 1) s.r = Math.max(s.r, st.h.get(2));
      }
      st.c = s;
      return s.r;
    },
  },
  'ta.tsi': {
    p: ['source', 'short_length', 'long_length'],
    f: (rt, a, id) => {
      const s = len(a[1], 'short_length'),
        l = len(a[2], 'long_length');
      const st = rt.state(id, () => ({ c: new Prev(), a1: new Ema(), a2: new Ema(), b1: new Ema(), b2: new Ema() }));
      const v = src(a[0]);
      const pc = v - st.c.step(rt.bar, v);
      const n = st.a2.step(rt.bar, st.a1.step(rt.bar, pc, 2 / (l + 1)), 2 / (s + 1));
      const d = st.b2.step(rt.bar, st.b1.step(rt.bar, Math.abs(pc), 2 / (l + 1)), 2 / (s + 1));
      return n / d;
    },
  },
  'math.sum': {
    p: ['source', 'length'],
    f: (rt, a, id) => windowStat(rt, id, src(a[0]), len(a[1]), (x) => x.reduce((s, v) => s + v, 0)),
  },
  // volume-based: the data has no volume
  'ta.mfi': { p: ['series', 'length'], f: () => NaN },
  'ta.vwap': { p: ['source', 'anchor', 'stdev_mult'], f: () => NaN },
  fixnan: {
    p: ['source'],
    f: (rt, a, id) => {
      const r = rt.state(id, () => new Rec());
      const p = r.begin(rt.bar);
      return (r.c = isNa(a[0]) ? p : a[0]);
    },
  },
};

/** ta.* that are used as variables (`ta.tr`, `ta.obv`, …). */
export const TA_VARS: Record<string, (rt: Rt, id: number) => any> = {
  'ta.tr': (rt, id) => rt.state(id, () => new TrueRange()).step(rt, false),
  'ta.obv': () => NaN,
  'ta.vwap': () => NaN,
  'ta.accdist': () => NaN,
  'ta.pvt': () => NaN,
  'ta.nvi': () => NaN,
  'ta.pvi': () => NaN,
  'ta.wad': () => NaN,
  'ta.wvad': () => NaN,
  'ta.iii': () => NaN,
};
