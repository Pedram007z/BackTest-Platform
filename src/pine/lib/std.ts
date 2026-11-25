import { type Builtin, type Rt, Drawing, PArray, PMap, fail, int, isNa, num, str, truthy } from '../core';
import { PineError } from '../lexer';

/** math.*, str.*, color.*, array.*, map.*, na/nz, type casts, logs and the drawing objects. */

// ---------- colors: "#rrggbbaa" ----------
const hex2 = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');

export function rgba(r: number, g: number, b: number, transp = 0): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(255 * (1 - Math.max(0, Math.min(100, transp)) / 100))}`;
}

export function parseColor(c: unknown): { r: number; g: number; b: number; t: number } | null {
  if (typeof c !== 'string' || c[0] !== '#') return null;
  const h = c.slice(1);
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return { r, g, b, t: 100 - (a / 255) * 100 };
}

export const colorLiteral = (h: string) => `#${h.toLowerCase()}${h.length === 6 ? 'ff' : ''}`;

export const COLORS: Record<string, string> = {
  'color.aqua': '#00bcd4ff',
  'color.black': '#363a45ff',
  'color.blue': '#2196f3ff',
  'color.fuchsia': '#e040fbff',
  'color.gray': '#787b86ff',
  'color.green': '#4caf50ff',
  'color.lime': '#00e676ff',
  'color.maroon': '#880e4fff',
  'color.navy': '#311b92ff',
  'color.olive': '#808000ff',
  'color.orange': '#ff9800ff',
  'color.purple': '#9c27b0ff',
  'color.red': '#ff5252ff',
  'color.silver': '#b2b5beff',
  'color.teal': '#00897bff',
  'color.white': '#ffffffff',
  'color.yellow': '#ffeb3bff',
};

// ---------- strings ----------
function fmtNumber(v: number, pattern: string): string {
  if (v !== v) return 'NaN';
  const pct = pattern.includes('%');
  if (pct) v *= 100;
  const dec = pattern.split('.')[1]?.replace(/[^#0]/g, '') ?? '';
  const minDec = (dec.match(/0/g) ?? []).length;
  let s = v.toFixed(dec.length);
  if (dec.length > minDec && s.includes('.')) {
    s = s.replace(/0+$/, '');
    const cur = s.split('.')[1]?.length ?? 0;
    if (cur < minDec) s = v.toFixed(minDec);
    s = s.replace(/\.$/, '');
  }
  if (pattern.includes(',')) {
    const [i, f] = s.split('.');
    s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
  }
  return s + (pct ? '%' : '');
}

export function toStr(v: any, format?: unknown, rt?: Rt): string {
  if (v instanceof PArray) return '[' + v.a.map((x) => toStr(x)).join(', ') + ']';
  if (Array.isArray(v)) return '[' + v.map((x) => toStr(x)).join(', ') + ']';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return v;
  if (typeof v !== 'number') return isNa(v) ? 'NaN' : String(v);
  if (v !== v) return 'NaN';
  if (typeof format === 'string' && format) {
    if (format === 'mintick' && rt) {
      const d = Math.max(0, Math.round(-Math.log10(rt.sym.mintick)));
      return v.toFixed(d);
    }
    if (format === 'percent') return v.toFixed(2) + '%';
    if (format === 'volume') return Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(3) + 'M' : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(3) + 'K' : String(v);
    if (format === 'price' || format === 'inherit') return String(+v.toFixed(10));
    return fmtNumber(v, format);
  }
  return String(+v.toFixed(10));
}

function strFormat(rt: Rt, fmt: string, args: any[]): string {
  return fmt.replace(/\{(\d+)(?:,\s*number\s*(?:,\s*([^}]+))?)?\}/g, (_m, i, pattern) => {
    const v = args[Number(i)];
    if (v === undefined) return '';
    if (pattern && typeof v === 'number') return pattern === 'percent' ? (v * 100).toFixed(0) + '%' : fmtNumber(v, pattern);
    return toStr(v, undefined, rt);
  });
}

// ---------- arrays ----------
const arr = (v: any): PArray => {
  if (v instanceof PArray) return v;
  if (isNa(v)) fail('آرایه na است (ساخته نشده).');
  fail('این مقدار آرایه نیست.');
};
const idx = (a: PArray, i: any) => {
  let k = int(i);
  if (k < 0) k += a.a.length;
  if (!(k >= 0 && k < a.a.length)) fail(`اندیس ${int(i)} خارج از محدوده‌ی آرایه (اندازه ${a.a.length}) است.`);
  return k;
};
const nums = (a: PArray) => a.a.map(num).filter((x) => x === x);
const newArr = (type: string) => (_rt: Rt, a: any[]) => {
  const n = int(a[0] ?? 0);
  if (n > 100_000) fail('آرایه حداکثر ۱۰۰٬۰۰۰ عضو می‌تواند داشته باشد.');
  return new PArray(
    Array.from({ length: Math.max(0, n) }, () => (a[1] === undefined ? (type === 'bool' ? false : NaN) : a[1])),
    type,
  );
};
function arrStdev(a: PArray, biased: boolean) {
  const x = nums(a);
  if (!x.length) return NaN;
  const m = x.reduce((s, v) => s + v, 0) / x.length;
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (biased ? x.length : x.length - 1));
}
const cmp = (p: any, q: any) => (typeof p === 'string' ? String(p).localeCompare(String(q)) : num(p) - num(q));

const map = (v: any): PMap => {
  if (v instanceof PMap) return v;
  fail('این مقدار map نیست.');
};

// ---------- drawings ----------
const drawingProps: Record<string, string[]> = {
  label: ['x', 'y', 'text', 'xloc', 'yloc', 'color', 'style', 'textcolor', 'size', 'textalign', 'tooltip', 'text_font_family'],
  line: ['x1', 'y1', 'x2', 'y2', 'xloc', 'extend', 'color', 'style', 'width'],
  box: ['left', 'top', 'right', 'bottom', 'border_color', 'border_width', 'border_style', 'extend', 'xloc', 'bgcolor', 'text'],
  table: ['position', 'columns', 'rows', 'bgcolor', 'frame_color', 'frame_width', 'border_color', 'border_width'],
  linefill: ['line1', 'line2', 'color'],
  polyline: ['points', 'curved', 'closed', 'xloc', 'line_color', 'fill_color', 'line_style', 'line_width'],
};

/** All drawings made, newest last (the page shows the labels). */
export const drawingsOf = (rt: Rt) => rt.drawings;

function drawingFns(kind: string): Record<string, Builtin> {
  const props = drawingProps[kind];
  const out: Record<string, Builtin> = {
    [`${kind}.new`]: {
      p: props,
      f: (rt, a) => {
        if (rt.secondary) return NaN;
        const d = new Drawing(kind, {});
        props.forEach((p, i) => a[i] !== undefined && (d.props[p] = a[i]));
        if (kind === 'label') d.props.bar = rt.bar;
        const list = drawingsOf(rt);
        list.push(d);
        if (list.length > 2000) list.splice(0, list.length - 1500);
        return d;
      },
    },
    [`${kind}.delete`]: {
      p: ['id'],
      f: (_rt, a) => {
        if (a[0] instanceof Drawing) a[0].deleted = true;
        return NaN;
      },
    },
    [`${kind}.copy`]: { p: ['id'], f: (_rt, a) => (a[0] instanceof Drawing ? new Drawing(kind, { ...a[0].props }) : NaN) },
  };
  for (const p of [...props, 'xy', 'point', 'lefttop', 'rightbottom', 'text_color', 'text_size', 'bgcolor', 'first_point', 'second_point']) {
    out[`${kind}.set_${p}`] = {
      p: ['id', 'a', 'b'],
      f: (_rt, a) => {
        const d = a[0];
        if (!(d instanceof Drawing)) return NaN;
        if (p === 'xy') {
          d.props.x = a[1];
          d.props.y = a[2];
        } else if (p === 'lefttop') {
          d.props.left = a[1];
          d.props.top = a[2];
        } else if (p === 'rightbottom') {
          d.props.right = a[1];
          d.props.bottom = a[2];
        } else d.props[p] = a[1];
        return NaN;
      },
    };
    out[`${kind}.get_${p}`] = { p: ['id'], f: (_rt, a) => (a[0] instanceof Drawing ? (a[0].props[p] ?? NaN) : NaN) };
  }
  out[`${kind}.all`] = {
    p: [],
    f: (rt) =>
      new PArray(
        drawingsOf(rt).filter((d) => d.kind === kind && !d.deleted),
        kind,
      ),
  };
  return out;
}

const math1 = (f: (x: number) => number): Builtin => ({ p: ['number'], f: (_rt, a) => f(num(a[0])) });

export const STD: Record<string, Builtin> = {
  // ----- na and casts
  na: { p: ['x'], f: (_rt, a) => isNa(a[0]) },
  nz: { p: ['source', 'replacement'], f: (_rt, a) => (isNa(a[0]) ? (a[1] === undefined ? (typeof a[0] === 'boolean' ? false : 0) : a[1]) : a[0]) },
  int: { p: ['x'], f: (_rt, a) => int(a[0]) },
  float: { p: ['x'], f: (_rt, a) => num(a[0]) },
  bool: { p: ['x'], f: (_rt, a) => truthy(a[0]) },
  string: { p: ['x'], f: (_rt, a) => str(a[0]) },
  color: { p: ['x'], f: (_rt, a) => a[0] },
  label: { p: ['x'], f: (_rt, a) => a[0] },
  line: { p: ['x'], f: (_rt, a) => a[0] },
  box: { p: ['x'], f: (_rt, a) => a[0] },
  max_bars_back: { p: ['var', 'num'], f: () => NaN },

  // ----- math
  'math.abs': math1(Math.abs),
  'math.ceil': math1(Math.ceil),
  'math.floor': math1(Math.floor),
  'math.sqrt': math1(Math.sqrt),
  'math.log': math1(Math.log),
  'math.log10': math1(Math.log10),
  'math.exp': math1(Math.exp),
  'math.sign': math1(Math.sign),
  'math.sin': math1(Math.sin),
  'math.cos': math1(Math.cos),
  'math.tan': math1(Math.tan),
  'math.asin': math1(Math.asin),
  'math.acos': math1(Math.acos),
  'math.atan': math1(Math.atan),
  'math.todegrees': math1((x) => (x * 180) / Math.PI),
  'math.toradians': math1((x) => (x * Math.PI) / 180),
  'math.pow': { p: ['base', 'exponent'], f: (_rt, a) => Math.pow(num(a[0]), num(a[1])) },
  'math.round': {
    p: ['number', 'precision'],
    f: (_rt, a) => {
      const x = num(a[0]);
      if (a[1] === undefined) return Math.round(x);
      const p = 10 ** int(a[1]);
      return Math.round(x * p) / p;
    },
  },
  'math.round_to_mintick': {
    p: ['number'],
    f: (rt, a) => Math.round(num(a[0]) / rt.sym.mintick) * rt.sym.mintick,
  },
  'math.max': { p: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], f: (_rt, a) => Math.max(...a.filter((x) => x !== undefined).map(num)) },
  'math.min': { p: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], f: (_rt, a) => Math.min(...a.filter((x) => x !== undefined).map(num)) },
  'math.avg': {
    p: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
    f: (_rt, a) => {
      const x = a.filter((v) => v !== undefined).map(num);
      return x.reduce((s, v) => s + v, 0) / x.length;
    },
  },
  'math.random': {
    p: ['min', 'max', 'seed'],
    f: (rt, a, id) => {
      const st = rt.state(id, () => ({ s: a[2] === undefined ? (Math.random() * 2 ** 31) | 0 : int(a[2]) }));
      st.s = (st.s * 16807) % 2147483647;
      const lo = a[0] === undefined ? 0 : num(a[0]);
      const hi = a[1] === undefined ? 1 : num(a[1]);
      return lo + ((st.s - 1) / 2147483646) * (hi - lo);
    },
  },

  // ----- strings
  'str.tostring': { p: ['value', 'format'], f: (rt, a) => toStr(a[0], a[1], rt) },
  'str.tonumber': {
    p: ['string'],
    f: (_rt, a) => {
      const s = str(a[0]).trim();
      return s && !Number.isNaN(Number(s)) ? Number(s) : NaN;
    },
  },
  'str.format': { p: ['formatString', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], f: (rt, a) => strFormat(rt, str(a[0]), a.slice(1)) },
  'str.length': { p: ['string'], f: (_rt, a) => str(a[0]).length },
  'str.contains': { p: ['source', 'str'], f: (_rt, a) => str(a[0]).includes(str(a[1])) },
  'str.startswith': { p: ['source', 'str'], f: (_rt, a) => str(a[0]).startsWith(str(a[1])) },
  'str.endswith': { p: ['source', 'str'], f: (_rt, a) => str(a[0]).endsWith(str(a[1])) },
  'str.pos': { p: ['source', 'str'], f: (_rt, a) => (str(a[0]).indexOf(str(a[1])) < 0 ? NaN : str(a[0]).indexOf(str(a[1]))) },
  'str.upper': { p: ['source'], f: (_rt, a) => str(a[0]).toUpperCase() },
  'str.lower': { p: ['source'], f: (_rt, a) => str(a[0]).toLowerCase() },
  'str.trim': { p: ['source'], f: (_rt, a) => str(a[0]).trim() },
  'str.repeat': {
    p: ['source', 'repeat', 'separator'],
    f: (_rt, a) =>
      Array(Math.max(0, int(a[1])))
        .fill(str(a[0]))
        .join(str(a[2] ?? '')),
  },
  'str.substring': { p: ['source', 'begin_pos', 'end_pos'], f: (_rt, a) => str(a[0]).substring(int(a[1]), a[2] === undefined ? undefined : int(a[2])) },
  'str.replace_all': { p: ['source', 'target', 'replacement'], f: (_rt, a) => str(a[0]).split(str(a[1])).join(str(a[2])) },
  'str.replace': {
    p: ['source', 'target', 'replacement', 'occurrence'],
    f: (_rt, a) => {
      const s = str(a[0]),
        t = str(a[1]);
      let k = -1;
      for (let i = 0; i <= int(a[3] ?? 0); i++) {
        k = s.indexOf(t, k + 1);
        if (k < 0) return s;
      }
      return s.slice(0, k) + str(a[2]) + s.slice(k + t.length);
    },
  },
  'str.split': { p: ['string', 'separator'], f: (_rt, a) => new PArray(str(a[0]).split(str(a[1])), 'string') },
  'str.match': {
    p: ['source', 'regex'],
    f: (_rt, a) => {
      try {
        return new RegExp(str(a[1])).exec(str(a[0]))?.[0] ?? '';
      } catch {
        fail('عبارت باقاعده (regex) معتبر نیست.');
      }
    },
  },

  // ----- colors
  'color.new': {
    p: ['color', 'transp'],
    f: (_rt, a) => {
      const c = parseColor(a[0]);
      return c ? rgba(c.r, c.g, c.b, num(a[1] ?? 0)) : NaN;
    },
  },
  'color.rgb': { p: ['red', 'green', 'blue', 'transp'], f: (_rt, a) => rgba(num(a[0]), num(a[1]), num(a[2]), num(a[3] ?? 0)) },
  'color.r': { p: ['color'], f: (_rt, a) => parseColor(a[0])?.r ?? NaN },
  'color.g': { p: ['color'], f: (_rt, a) => parseColor(a[0])?.g ?? NaN },
  'color.b': { p: ['color'], f: (_rt, a) => parseColor(a[0])?.b ?? NaN },
  'color.t': { p: ['color'], f: (_rt, a) => parseColor(a[0])?.t ?? NaN },
  'color.from_gradient': {
    p: ['value', 'bottom_value', 'top_value', 'bottom_color', 'top_color'],
    f: (_rt, a) => {
      const v = num(a[0]),
        lo = num(a[1]),
        hi = num(a[2]);
      const c1 = parseColor(a[3]),
        c2 = parseColor(a[4]);
      if (!c1 || !c2 || v !== v) return NaN;
      const k = hi === lo ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
      return rgba(c1.r + (c2.r - c1.r) * k, c1.g + (c2.g - c1.g) * k, c1.b + (c2.b - c1.b) * k, c1.t + (c2.t - c1.t) * k);
    },
  },

  // ----- arrays
  'array.new': { p: ['size', 'initial_value'], f: newArr('any') },
  'array.new_float': { p: ['size', 'initial_value'], f: newArr('float') },
  'array.new_int': { p: ['size', 'initial_value'], f: newArr('int') },
  'array.new_bool': { p: ['size', 'initial_value'], f: newArr('bool') },
  'array.new_string': { p: ['size', 'initial_value'], f: newArr('string') },
  'array.new_color': { p: ['size', 'initial_value'], f: newArr('color') },
  'array.new_line': { p: ['size', 'initial_value'], f: newArr('line') },
  'array.new_label': { p: ['size', 'initial_value'], f: newArr('label') },
  'array.new_box': { p: ['size', 'initial_value'], f: newArr('box') },
  'array.from': { p: Array.from({ length: 40 }, (_, i) => `v${i}`), f: (_rt, a) => new PArray(a.filter((x) => x !== undefined)) },
  'array.size': { p: ['id'], f: (_rt, a) => arr(a[0]).a.length },
  'array.get': { p: ['id', 'index'], f: (_rt, a) => arr(a[0]).a[idx(arr(a[0]), a[1])] },
  'array.set': {
    p: ['id', 'index', 'value'],
    f: (_rt, a) => {
      const x = arr(a[0]);
      x.a[idx(x, a[1])] = a[2];
      return NaN;
    },
  },
  'array.push': {
    p: ['id', 'value'],
    f: (_rt, a) => {
      const x = arr(a[0]);
      if (x.a.length >= 100_000) fail('آرایه حداکثر ۱۰۰٬۰۰۰ عضو می‌تواند داشته باشد.');
      x.a.push(a[1]);
      return NaN;
    },
  },
  'array.unshift': {
    p: ['id', 'value'],
    f: (_rt, a) => {
      arr(a[0]).a.unshift(a[1]);
      return NaN;
    },
  },
  'array.pop': {
    p: ['id'],
    f: (_rt, a) => {
      const x = arr(a[0]);
      if (!x.a.length) fail('آرایه خالی است و pop ممکن نیست.');
      return x.a.pop();
    },
  },
  'array.shift': {
    p: ['id'],
    f: (_rt, a) => {
      const x = arr(a[0]);
      if (!x.a.length) fail('آرایه خالی است و shift ممکن نیست.');
      return x.a.shift();
    },
  },
  'array.insert': {
    p: ['id', 'index', 'value'],
    f: (_rt, a) => {
      arr(a[0]).a.splice(int(a[1]), 0, a[2]);
      return NaN;
    },
  },
  'array.remove': {
    p: ['id', 'index'],
    f: (_rt, a) => {
      const x = arr(a[0]);
      return x.a.splice(idx(x, a[1]), 1)[0];
    },
  },
  'array.clear': {
    p: ['id'],
    f: (_rt, a) => {
      arr(a[0]).a.length = 0;
      return NaN;
    },
  },
  'array.fill': {
    p: ['id', 'value', 'index_from', 'index_to'],
    f: (_rt, a) => {
      const x = arr(a[0]);
      x.a.fill(a[1], int(a[2] ?? 0), a[3] === undefined ? x.a.length : int(a[3]));
      return NaN;
    },
  },
  'array.includes': { p: ['id', 'value'], f: (_rt, a) => arr(a[0]).a.includes(a[1]) },
  'array.indexof': { p: ['id', 'value'], f: (_rt, a) => arr(a[0]).a.indexOf(a[1]) },
  'array.lastindexof': { p: ['id', 'value'], f: (_rt, a) => arr(a[0]).a.lastIndexOf(a[1]) },
  'array.first': { p: ['id'], f: (_rt, a) => (arr(a[0]).a.length ? arr(a[0]).a[0] : fail('آرایه خالی است.')) },
  'array.last': { p: ['id'], f: (_rt, a) => (arr(a[0]).a.length ? arr(a[0]).a[arr(a[0]).a.length - 1] : fail('آرایه خالی است.')) },
  'array.sum': { p: ['id'], f: (_rt, a) => nums(arr(a[0])).reduce((s, v) => s + v, 0) },
  'array.avg': {
    p: ['id'],
    f: (_rt, a) => {
      const x = nums(arr(a[0]));
      return x.length ? x.reduce((s, v) => s + v, 0) / x.length : NaN;
    },
  },
  'array.min': {
    p: ['id', 'nth'],
    f: (_rt, a) => {
      const x = nums(arr(a[0])).sort((p, q) => p - q);
      return x[int(a[1] ?? 0)] ?? NaN;
    },
  },
  'array.max': {
    p: ['id', 'nth'],
    f: (_rt, a) => {
      const x = nums(arr(a[0])).sort((p, q) => q - p);
      return x[int(a[1] ?? 0)] ?? NaN;
    },
  },
  'array.median': {
    p: ['id'],
    f: (_rt, a) => {
      const s = nums(arr(a[0])).sort((p, q) => p - q);
      if (!s.length) return NaN;
      const m = s.length >> 1;
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    },
  },
  'array.range': {
    p: ['id'],
    f: (_rt, a) => {
      const x = nums(arr(a[0]));
      return x.length ? Math.max(...x) - Math.min(...x) : NaN;
    },
  },
  'array.stdev': { p: ['id', 'biased'], f: (_rt, a) => arrStdev(arr(a[0]), a[1] !== false) },
  'array.variance': { p: ['id', 'biased'], f: (_rt, a) => arrStdev(arr(a[0]), a[1] !== false) ** 2 },
  'array.abs': {
    p: ['id'],
    f: (_rt, a) =>
      new PArray(
        arr(a[0]).a.map((x) => Math.abs(num(x))),
        arr(a[0]).type,
      ),
  },
  'array.sort': {
    p: ['id', 'order'],
    f: (_rt, a) => {
      const desc = a[1] === 'descending';
      arr(a[0]).a.sort((p, q) => (desc ? cmp(q, p) : cmp(p, q)));
      return NaN;
    },
  },
  'array.sort_indices': {
    p: ['id', 'order'],
    f: (_rt, a) => {
      const x = arr(a[0]).a;
      const desc = a[1] === 'descending';
      return new PArray(
        x.map((_, i) => i).sort((p, q) => (desc ? cmp(x[q], x[p]) : cmp(x[p], x[q]))),
        'int',
      );
    },
  },
  'array.reverse': {
    p: ['id'],
    f: (_rt, a) => {
      arr(a[0]).a.reverse();
      return NaN;
    },
  },
  'array.slice': { p: ['id', 'index_from', 'index_to'], f: (_rt, a) => new PArray(arr(a[0]).a.slice(int(a[1]), int(a[2])), arr(a[0]).type) },
  'array.copy': { p: ['id'], f: (_rt, a) => new PArray([...arr(a[0]).a], arr(a[0]).type) },
  'array.concat': {
    p: ['id1', 'id2'],
    f: (_rt, a) => {
      arr(a[0]).a.push(...arr(a[1]).a);
      return a[0];
    },
  },
  'array.join': {
    p: ['id', 'separator'],
    f: (rt, a) =>
      arr(a[0])
        .a.map((x) => toStr(x, undefined, rt))
        .join(str(a[1] ?? '')),
  },
  'array.every': { p: ['id'], f: (_rt, a) => arr(a[0]).a.every(truthy) },
  'array.some': { p: ['id'], f: (_rt, a) => arr(a[0]).a.some(truthy) },

  // ----- maps
  'map.new': { p: [], f: () => new PMap() },
  'map.put': {
    p: ['id', 'key', 'value'],
    f: (_rt, a) => {
      const m = map(a[0]);
      const old = m.m.get(a[1]);
      m.m.set(a[1], a[2]);
      return old === undefined ? NaN : old;
    },
  },
  'map.get': { p: ['id', 'key'], f: (_rt, a) => map(a[0]).m.get(a[1]) ?? NaN },
  'map.contains': { p: ['id', 'key'], f: (_rt, a) => map(a[0]).m.has(a[1]) },
  'map.remove': {
    p: ['id', 'key'],
    f: (_rt, a) => {
      const m = map(a[0]);
      const old = m.m.get(a[1]);
      m.m.delete(a[1]);
      return old === undefined ? NaN : old;
    },
  },
  'map.size': { p: ['id'], f: (_rt, a) => map(a[0]).m.size },
  'map.keys': { p: ['id'], f: (_rt, a) => new PArray([...map(a[0]).m.keys()]) },
  'map.values': { p: ['id'], f: (_rt, a) => new PArray([...map(a[0]).m.values()]) },
  'map.clear': {
    p: ['id'],
    f: (_rt, a) => {
      map(a[0]).m.clear();
      return NaN;
    },
  },
  'map.copy': {
    p: ['id'],
    f: (_rt, a) => {
      const m = new PMap();
      for (const [k, v] of map(a[0]).m) m.m.set(k, v);
      return m;
    },
  },
  'map.put_all': {
    p: ['id', 'id2'],
    f: (_rt, a) => {
      for (const [k, v] of map(a[1]).m) map(a[0]).m.set(k, v);
      return NaN;
    },
  },

  // ----- logs, alerts, errors
  'log.info': { p: ['message', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], f: (rt, a) => (rt.log('info', strFormat(rt, toStr(a[0], undefined, rt), a.slice(1))), NaN) },
  'log.warning': { p: ['message', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], f: (rt, a) => (rt.log('warning', strFormat(rt, toStr(a[0], undefined, rt), a.slice(1))), NaN) },
  'log.error': { p: ['message', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], f: (rt, a) => (rt.log('error', strFormat(rt, toStr(a[0], undefined, rt), a.slice(1))), NaN) },
  'runtime.error': {
    p: ['message'],
    f: (rt, a) => {
      throw new PineError(`runtime.error: ${str(a[0])}`, 0, 0, rt.bar);
    },
  },
  alert: { p: ['message', 'freq'], f: () => NaN },
  alertcondition: { p: ['condition', 'title', 'message'], f: () => NaN },
  'table.cell': { p: ['table_id', 'column', 'row', 'text'], f: () => NaN },
  'table.cell_set_text': { p: ['table_id', 'column', 'row', 'text'], f: () => NaN },
  'table.cell_set_bgcolor': { p: ['table_id', 'column', 'row', 'bgcolor'], f: () => NaN },
  'table.cell_set_text_color': { p: ['table_id', 'column', 'row', 'text_color'], f: () => NaN },
  'table.clear': { p: ['table_id'], f: () => NaN },
  'table.merge_cells': { p: ['table_id'], f: () => NaN },
  'line.get_price': {
    p: ['id', 'x'],
    f: (_rt, a) => {
      const d = a[0];
      if (!(d instanceof Drawing)) return NaN;
      const { x1, y1, x2, y2 } = d.props;
      if (x2 === x1) return num(y1);
      return num(y1) + ((num(y2) - num(y1)) * (num(a[1]) - num(x1))) / (num(x2) - num(x1));
    },
  },
  ...drawingFns('label'),
  ...drawingFns('line'),
  ...drawingFns('box'),
  ...drawingFns('table'),
  ...drawingFns('linefill'),
  ...drawingFns('polyline'),
};
