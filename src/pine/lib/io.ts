import { type Builtin, type FillOut, type InputDef, type InputType, type PlotOut, type Rt, SOURCE_NAMES, fail, int, isNa, num, str, truthy } from '../core';
import { COLORS, parseColor, rgba } from './std';
import { TA_VARS } from './ta';
import { dayofmonth, dayofweek, hour, minute, month, second, timeVar, year } from './time';

/** Declarations (strategy / indicator), inputs, plots, the strategy.* functions, constants and variables. */

const STRATEGY_PARAMS = [
  'title',
  'shorttitle',
  'overlay',
  'format',
  'precision',
  'scale',
  'pyramiding',
  'calc_on_order_fills',
  'calc_on_every_tick',
  'max_bars_back',
  'backtest_fill_limits_assumption',
  'default_qty_type',
  'default_qty_value',
  'initial_capital',
  'currency',
  'slippage',
  'commission_type',
  'commission_value',
  'process_orders_on_close',
  'close_entries_rule',
  'margin_long',
  'margin_short',
  'explicit_plot_zorder',
  'max_lines_count',
  'max_labels_count',
  'max_boxes_count',
  'calc_bars_count',
  'risk_free_rate',
  'use_bar_magnifier',
  'fill_orders_on_standard_ohlc',
  'max_polylines_count',
  'dynamic_requests',
  'behind_chart',
];
const INDICATOR_PARAMS = [
  'title',
  'shorttitle',
  'overlay',
  'format',
  'precision',
  'scale',
  'max_bars_back',
  'timeframe',
  'timeframe_gaps',
  'explicit_plot_zorder',
  'max_lines_count',
  'max_labels_count',
  'max_boxes_count',
  'calc_bars_count',
  'max_polylines_count',
  'dynamic_requests',
  'behind_chart',
];

function declare(kind: 'strategy' | 'indicator' | 'library', params: string[]): Builtin {
  return {
    p: params,
    f: (rt, a) => {
      if (rt.decl) return NaN;
      const args: Record<string, unknown> = {};
      params.forEach((p, i) => a[i] !== undefined && (args[p] = a[i]));
      rt.decl = {
        kind,
        title: str(args.title) || (kind === 'strategy' ? 'Strategy' : 'Indicator'),
        shorttitle: args.shorttitle ? str(args.shorttitle) : undefined,
        overlay: args.overlay === true,
        args,
      };
      return NaN;
    },
  };
}

// ---------- inputs ----------
function coerce(def: InputDef, v: unknown): unknown {
  switch (def.type) {
    case 'int':
    case 'float': {
      let n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n)) return def.defval;
      if (def.type === 'int') n = Math.round(n);
      if (def.minval !== undefined && n < def.minval) n = def.minval;
      if (def.maxval !== undefined && n > def.maxval) n = def.maxval;
      if (def.options && !def.options.includes(n)) return def.defval;
      return n;
    }
    case 'bool':
      return typeof v === 'boolean' ? v : def.defval;
    case 'source':
      return typeof v === 'string' && SOURCE_NAMES.includes(v) ? v : def.defval;
    case 'price':
    case 'time':
      return typeof v === 'number' && Number.isFinite(v) ? v : def.defval;
    default:
      if (typeof v !== 'string') return def.defval;
      if (def.options && !def.options.includes(v)) return def.defval;
      return v;
  }
}

function useInput(rt: Rt, id: number, make: () => Omit<InputDef, 'key'>): unknown {
  let def = rt.inputSeen.get(id);
  if (!def) {
    const d = make();
    let key = d.title || `ورودی ${rt.inputs.length + 1}`;
    while (rt.inputs.some((x) => x.key === key)) key += ' ';
    def = { ...d, key };
    rt.inputs.push(def);
    rt.inputSeen.set(id, def);
  }
  const ov = rt.inputValues[def.key];
  return ov === undefined ? def.defval : coerce(def, ov);
}

const optNum = (v: unknown) => (v === undefined || isNa(v) ? undefined : num(v));
const optStr = (v: unknown) => (v === undefined || isNa(v) ? undefined : str(v));
const asOptions = (v: unknown) => (Array.isArray(v) ? v : undefined);

function numInput(type: 'int' | 'float'): Builtin {
  return {
    p: ['defval', 'title', 'minval', 'maxval', 'step', 'tooltip', 'inline', 'group', 'confirm', 'display', 'options'],
    f: (rt, a, id) => {
      // input.int(defval, title, options, tooltip, inline, group, …) when the third argument is a list
      const listForm = Array.isArray(a[2]);
      return useInput(rt, id, () => ({
        title: str(a[1]),
        type,
        defval: num(a[0]),
        options: listForm ? asOptions(a[2]) : asOptions(a[10]),
        minval: listForm ? undefined : optNum(a[2]),
        maxval: listForm ? undefined : optNum(a[3]),
        step: listForm ? undefined : optNum(a[4]),
        tooltip: optStr(listForm ? a[3] : a[5]),
        inline: optStr(listForm ? a[4] : a[6]),
        group: optStr(listForm ? a[5] : a[7]),
        line: 0,
      }));
    },
  };
}

function textInput(type: InputType, hasOptions: boolean): Builtin {
  const p = hasOptions
    ? ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display']
    : ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'];
  const o = hasOptions ? 1 : 0;
  return {
    p,
    f: (rt, a, id) =>
      useInput(rt, id, () => ({
        title: str(a[1]),
        type,
        defval: type === 'bool' ? truthy(a[0]) : type === 'price' || type === 'time' ? num(a[0]) : a[0] === undefined ? '' : a[0],
        options: hasOptions ? asOptions(a[2]) : undefined,
        tooltip: optStr(a[2 + o]),
        inline: optStr(a[3 + o]),
        group: optStr(a[4 + o]),
        line: 0,
      })),
  };
}

const sourceInput: Builtin = {
  // the compiler passes the default series by name (close → "close")
  p: ['defval', 'title', 'tooltip', 'inline', 'group', 'display'],
  f: (rt, a, id) => {
    const name = useInput(rt, id, () => ({
      title: str(a[1]),
      type: 'source',
      defval: typeof a[0] === 'string' && SOURCE_NAMES.includes(a[0]) ? a[0] : 'close',
      options: SOURCE_NAMES,
      tooltip: optStr(a[2]),
      inline: optStr(a[3]),
      group: optStr(a[4]),
      line: 0,
    })) as string;
    return rt.series(name)[rt.bar];
  },
};

// ---------- plots ----------
/** Pine v4's `transp` argument (0–100) applied to a colour. */
function transp(c: unknown, t: unknown): unknown {
  if (t === undefined || isNa(t)) return c;
  const p = parseColor(c);
  return p ? rgba(p.r, p.g, p.b, num(t)) : c;
}

function plotRec(rt: Rt, id: number, title: unknown, kind: PlotOut['kind'], style: string): PlotOut {
  let p = rt.plots.get(id);
  if (!p) {
    p = {
      id,
      title: str(title) || `Plot ${rt.plots.size + 1}`,
      kind,
      style,
      color: null,
      linewidth: 1,
      offset: 0,
      values: new Float64Array(kind === 'hline' ? 1 : rt.n).fill(NaN),
      display: true,
    };
    rt.plots.set(id, p);
  }
  return p;
}

const colored = new WeakSet<PlotOut>();
const filled = new WeakSet<FillOut>();
function setColor(rt: Rt, p: PlotOut, c: unknown) {
  const col = typeof c === 'string' ? c : null;
  if (p.colors) p.colors[rt.bar] = col;
  else if (!colored.has(p)) {
    p.color = col;
    colored.add(p);
  } else if (col !== p.color) {
    p.colors = new Array(rt.n).fill(p.color);
    p.colors[rt.bar] = col;
  }
}

const hidden = (display: unknown) => display === 'none' || display === 'data_window' || display === 'status_line';

const shape =
  (kind: 'shape' | 'char' | 'arrow'): Builtin['f'] =>
  (rt, a, id) => {
    if (rt.secondary) return NaN;
    const st = rt.state(id, () => ({ bar: -1 }));
    if (st.bar === rt.bar) rt.shapes.pop();
    st.bar = -1;
    if (kind === 'arrow') {
      const v = num(a[0]);
      if (!(v !== 0 && v === v)) return NaN;
      st.bar = rt.bar;
      rt.shapes.push({
        bar: rt.bar + int(a[4] ?? 0),
        kind,
        title: str(a[1]),
        style: v > 0 ? 'arrowup' : 'arrowdown',
        location: v > 0 ? 'belowbar' : 'abovebar',
        color: (v > 0 ? a[2] : a[3]) ?? (v > 0 ? '#4caf50ff' : '#ff5252ff'),
        text: '',
        textColor: null,
        size: 'small',
      });
      return NaN;
    }
    if (!truthy(a[0]) || hidden(a[kind === 'shape' ? 11 : 12])) return NaN;
    st.bar = rt.bar;
    const v = num(a[0]);
    if (kind === 'shape')
      rt.shapes.push({
        bar: rt.bar + int(a[5] ?? 0),
        kind,
        title: str(a[1]),
        style: str(a[2] ?? 'xcross'),
        location: str(a[3] ?? 'abovebar'),
        color: typeof a[4] === 'string' ? a[4] : '#2196f3ff',
        text: str(a[6]),
        textColor: typeof a[7] === 'string' ? a[7] : null,
        size: str(a[9] ?? 'auto'),
        price: typeof a[0] === 'number' ? v : undefined,
      });
    else
      rt.shapes.push({
        bar: rt.bar + int(a[5] ?? 0),
        kind,
        title: str(a[1]),
        style: str(a[2] ?? '★'),
        location: str(a[3] ?? 'abovebar'),
        color: typeof a[4] === 'string' ? a[4] : '#2196f3ff',
        text: str(a[6]),
        textColor: typeof a[7] === 'string' ? a[7] : null,
        size: str(a[9] ?? 'auto'),
        price: typeof a[0] === 'number' ? v : undefined,
      });
    if (rt.shapes.length > 20_000) fail('تعداد شکل‌های plotshape/plotchar از ۲۰٬۰۰۰ بیشتر شد؛ شرط نمایش را محدودتر کنید.');
    return NaN;
  };

function perBar(rt: Rt, which: 'bgcolors' | 'barcolors', c: unknown, offset: unknown) {
  if (rt.secondary) return NaN;
  const arr = (rt[which] ??= new Array(rt.n).fill(null));
  const i = rt.bar + int(offset ?? 0);
  if (i >= 0 && i < rt.n) arr[i] = typeof c === 'string' ? c : null;
  return NaN;
}

// ---------- strategy.* ----------
const STRATEGY_FNS: Record<string, string[]> = {
  'strategy.entry': ['id', 'direction', 'qty', 'limit', 'stop', 'oca_name', 'oca_type', 'comment', 'alert_message', 'disable_alert', 'when', 'long'],
  'strategy.order': ['id', 'direction', 'qty', 'limit', 'stop', 'oca_name', 'oca_type', 'comment', 'alert_message', 'disable_alert', 'when', 'long'],
  'strategy.exit': [
    'id',
    'from_entry',
    'qty',
    'qty_percent',
    'profit',
    'limit',
    'loss',
    'stop',
    'trail_price',
    'trail_points',
    'trail_offset',
    'oca_name',
    'comment',
    'comment_profit',
    'comment_loss',
    'comment_trailing',
    'alert_message',
    'alert_profit',
    'alert_loss',
    'alert_trailing',
    'disable_alert',
    'when',
  ],
  'strategy.close': ['id', 'comment', 'qty', 'qty_percent', 'alert_message', 'immediately', 'disable_alert', 'when'],
  'strategy.close_all': ['comment', 'alert_message', 'immediately', 'disable_alert', 'when'],
  'strategy.cancel': ['id', 'when'],
  'strategy.cancel_all': ['when'],
  'strategy.risk.allow_entry_in': ['value'],
  'strategy.risk.max_drawdown': ['value', 'type', 'alert_message'],
  'strategy.risk.max_intraday_loss': ['value', 'type', 'alert_message'],
  'strategy.risk.max_cons_loss_days': ['count', 'alert_message'],
  'strategy.risk.max_intraday_filled_orders': ['count', 'alert_message'],
  'strategy.risk.max_position_size': ['contracts'],
  'strategy.convert_to_account': ['value'],
  'strategy.convert_to_symbol': ['value'],
  'strategy.default_entry_qty': ['fill_price'],
};
for (const f of [
  'entry_price',
  'exit_price',
  'profit',
  'profit_percent',
  'entry_bar_index',
  'exit_bar_index',
  'entry_time',
  'exit_time',
  'size',
  'commission',
  'entry_id',
  'exit_id',
  'max_runup',
  'max_runup_percent',
  'max_drawdown',
  'max_drawdown_percent',
  'entry_comment',
  'exit_comment',
])
  STRATEGY_FNS[`strategy.closedtrades.${f}`] = ['trade_num'];
for (const f of [
  'entry_price',
  'profit',
  'profit_percent',
  'entry_bar_index',
  'entry_time',
  'size',
  'commission',
  'entry_id',
  'max_runup',
  'max_runup_percent',
  'max_drawdown',
  'max_drawdown_percent',
  'entry_comment',
])
  STRATEGY_FNS[`strategy.opentrades.${f}`] = ['trade_num'];

const strategyFns: Record<string, Builtin> = {};
for (const [name, p] of Object.entries(STRATEGY_FNS))
  strategyFns[name] = {
    p,
    f: (rt, a) => {
      if (rt.secondary) return NaN;
      if (rt.decl?.kind !== 'strategy' || !rt.broker) fail(`${name} فقط در اسکریپتی کار می‌کند که با strategy() شروع شده باشد.`);
      // Pine v4: `when = cond` places the order only while cond is true; `long = true` is the direction
      const w = p.indexOf('when');
      if (w >= 0 && a[w] !== undefined && !truthy(a[w])) return NaN;
      const l = p.indexOf('long');
      if (l >= 0 && a[1] === undefined && a[l] !== undefined) a[1] = truthy(a[l]) ? 'long' : 'short';
      return rt.broker.call(name, rt, a);
    },
  };

export const STRATEGY_VARS = [
  'position_size',
  'position_avg_price',
  'position_entry_name',
  'equity',
  'netprofit',
  'netprofit_percent',
  'openprofit',
  'openprofit_percent',
  'grossprofit',
  'grossprofit_percent',
  'grossloss',
  'grossloss_percent',
  'closedtrades',
  'opentrades',
  'wintrades',
  'losstrades',
  'eventrades',
  'initial_capital',
  'max_drawdown',
  'max_drawdown_percent',
  'max_runup',
  'max_runup_percent',
  'max_contracts_held_all',
  'max_contracts_held_long',
  'max_contracts_held_short',
  'account_currency',
  'avg_trade',
  'avg_trade_percent',
  'avg_winning_trade',
  'avg_winning_trade_percent',
  'avg_losing_trade',
  'avg_losing_trade_percent',
  'margin_liquidation_price',
  'closedtrades.first_index',
];

// ---------- registry ----------
export const IO: Record<string, Builtin> = {
  strategy: declare('strategy', STRATEGY_PARAMS),
  indicator: declare('indicator', INDICATOR_PARAMS),
  study: declare('indicator', INDICATOR_PARAMS),
  library: declare('library', ['title', 'overlay', 'dynamic_requests']),

  input: {
    // Pine v5: input(defval, title, tooltip, inline, group); v4 also passes type, minval, maxval, step, options
    p: ['defval', 'title', 'tooltip', 'inline', 'group', 'type', 'minval', 'maxval', 'step', 'options', 'confirm'],
    f: (rt, a, id) =>
      useInput(rt, id, () => {
        const v4: Record<string, InputType> = {
          integer: 'int',
          float: 'float',
          bool: 'bool',
          string: 'string',
          resolution: 'timeframe',
          session: 'session',
          symbol: 'symbol',
          color: 'color',
          time: 'time',
          price: 'price',
          source: 'source',
        };
        const type: InputType =
          (typeof a[5] === 'string' && v4[a[5]]) ||
          (typeof a[0] === 'boolean' ? 'bool' : typeof a[0] === 'string' ? (/^#[0-9a-f]{8}$/.test(a[0]) ? 'color' : 'string') : Number.isInteger(a[0]) ? 'int' : 'float');
        return {
          title: str(a[1]),
          type,
          defval: type === 'float' || type === 'int' ? num(a[0]) : a[0],
          tooltip: optStr(a[2]),
          inline: optStr(a[3]),
          group: optStr(a[4]),
          minval: optNum(a[6]),
          maxval: optNum(a[7]),
          step: optNum(a[8]),
          options: asOptions(a[9]),
          line: 0,
        };
      }),
  },
  'input.int': numInput('int'),
  'input.float': numInput('float'),
  'input.bool': textInput('bool', false),
  'input.string': textInput('string', true),
  'input.timeframe': textInput('timeframe', true),
  'input.symbol': textInput('symbol', false),
  'input.session': textInput('session', true),
  'input.color': textInput('color', false),
  'input.price': textInput('price', false),
  'input.time': textInput('time', false),
  'input.text_area': textInput('text_area', false),
  'input.source': sourceInput,

  plot: {
    p: [
      'series',
      'title',
      'color',
      'linewidth',
      'style',
      'trackprice',
      'histbase',
      'offset',
      'join',
      'editable',
      'show_last',
      'display',
      'format',
      'precision',
      'force_overlay',
      'transp',
    ],
    f: (rt, a, id) => {
      if (rt.secondary) return id;
      const p = plotRec(rt, id, a[1], 'plot', str(a[4] ?? 'line'));
      if (rt.bar === 0) {
        p.linewidth = int(a[3] ?? 1) || 1;
        p.offset = int(a[7] ?? 0);
        p.display = !hidden(a[11]);
        p.forceOverlay = a[14] === true;
      }
      p.values[rt.bar] = typeof a[0] === 'boolean' ? (a[0] ? 1 : 0) : num(a[0]);
      setColor(rt, p, transp(a[2] === undefined ? '#2196f3ff' : a[2], a[15]));
      return id;
    },
  },
  plotshape: {
    p: [
      'series',
      'title',
      'style',
      'location',
      'color',
      'offset',
      'text',
      'textcolor',
      'editable',
      'size',
      'show_last',
      'display',
      'format',
      'precision',
      'force_overlay',
      'transp',
    ],
    f: shape('shape'),
  },
  plotchar: {
    p: [
      'series',
      'title',
      'char',
      'location',
      'color',
      'offset',
      'text',
      'textcolor',
      'editable',
      'size',
      'show_last',
      'display',
      'format',
      'precision',
      'force_overlay',
      'transp',
    ],
    f: shape('char'),
  },
  plotarrow: {
    p: ['series', 'title', 'colorup', 'colordown', 'offset', 'minheight', 'maxheight', 'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay'],
    f: shape('arrow'),
  },
  plotcandle: {
    p: ['open', 'high', 'low', 'close', 'title', 'color', 'wickcolor', 'editable', 'show_last', 'bordercolor', 'display', 'format', 'precision', 'force_overlay'],
    f: () => NaN,
  },
  plotbar: { p: ['open', 'high', 'low', 'close', 'title', 'color', 'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay'], f: () => NaN },
  hline: {
    p: ['price', 'title', 'color', 'linestyle', 'linewidth', 'editable', 'display'],
    f: (rt, a, id) => {
      if (rt.secondary) return id;
      const p = plotRec(rt, id, a[1], 'hline', str(a[3] ?? 'dashed'));
      p.values[0] = num(a[0]);
      p.color = typeof a[2] === 'string' ? a[2] : '#787b86ff';
      p.linewidth = int(a[4] ?? 1) || 1;
      p.display = !hidden(a[6]);
      return id;
    },
  },
  fill: {
    p: ['hline1', 'hline2', 'color', 'title', 'editable', 'fillgaps', 'display', 'transp', 'top_value', 'bottom_value', 'top_color', 'bottom_color'],
    f: (rt, a, id) => {
      if (rt.secondary || typeof a[0] !== 'number' || typeof a[1] !== 'number') return NaN;
      let f = rt.fills.get(id);
      if (!f) {
        f = { id, a: a[0], b: a[1], color: null, display: !hidden(a[6]) };
        rt.fills.set(id, f);
      }
      // a gradient fill (top_color / bottom_color) is drawn in its top colour
      const c = transp(a[2] ?? a[10] ?? '#2196f333', a[7]);
      const col = typeof c === 'string' ? c : null;
      if (f.colors) f.colors[rt.bar] = col;
      else if (rt.bar === 0 || !filled.has(f)) {
        f.color = col;
        filled.add(f);
      } else if (col !== f.color) {
        f.colors = new Array(rt.n).fill(f.color);
        f.colors[rt.bar] = col;
      }
      return NaN;
    },
  },
  bgcolor: { p: ['color', 'offset', 'editable', 'show_last', 'title', 'display', 'force_overlay', 'transp'], f: (rt, a) => perBar(rt, 'bgcolors', transp(a[0], a[7]), a[1]) },
  barcolor: { p: ['color', 'offset', 'editable', 'show_last', 'title', 'display'], f: (rt, a) => perBar(rt, 'barcolors', a[0], a[1]) },
  iff: { p: ['condition', 'then', '_else'], f: (_rt, a) => (truthy(a[0]) ? a[1] : a[2]) },
  ...strategyFns,
};

// ---------- constants ----------
export const CONSTS: Record<string, unknown> = {
  ...COLORS,
  'math.pi': Math.PI,
  'math.e': Math.E,
  'math.phi': 1.618033988749895,
  'math.rphi': 0.6180339887498948,
  'barmerge.gaps_on': true,
  'barmerge.gaps_off': false,
  'barmerge.lookahead_on': true,
  'barmerge.lookahead_off': false,
  'dayofweek.sunday': 1,
  'dayofweek.monday': 2,
  'dayofweek.tuesday': 3,
  'dayofweek.wednesday': 4,
  'dayofweek.thursday': 5,
  'dayofweek.friday': 6,
  'dayofweek.saturday': 7,
  'strategy.long': 'long',
  'strategy.short': 'short',
  'strategy.fixed': 'fixed',
  'strategy.cash': 'cash',
  'strategy.percent_of_equity': 'percent_of_equity',
  'strategy.commission.percent': 'percent',
  'strategy.commission.cash_per_contract': 'cash_per_contract',
  'strategy.commission.cash_per_order': 'cash_per_order',
  'strategy.oca.cancel': 'cancel',
  'strategy.oca.reduce': 'reduce',
  'strategy.oca.none': 'none',
  'strategy.direction.all': 'all',
  'strategy.direction.long': 'long',
  'strategy.direction.short': 'short',
  // Pine v4 input types
  'input.integer': 'integer',
  'input.float': 'float',
  'input.bool': 'bool',
  'input.string': 'string',
  'input.resolution': 'resolution',
  'input.session': 'session',
  'input.source': 'source',
  'input.symbol': 'symbol',
  'input.color': 'color',
  'input.time': 'time',
  'input.price': 'price',
};

/** Other dotted constants (plot.style_line, shape.triangleup, location.abovebar, …) are their last part. */
const CONST_NS =
  /^(label|line|box|shape|plot|hline|position|text|size|extend|xloc|yloc|display|format|location|font|alert|scale|adjustment|backadjustment|settlement_as_close|currency|session|order|dividends|earnings|splits|table|linefill)\.([a-z_0-9]+)$/;

export function constant(name: string): { ok: boolean; v?: unknown } {
  if (name in CONSTS) return { ok: true, v: CONSTS[name] };
  const m = CONST_NS.exec(name);
  // plot.style_line → 'line', line.style_dashed → 'dashed', label.style_label_down → 'label_down'
  if (m && !IO[name]) return { ok: true, v: m[2].replace(/^style_/, '') };
  return { ok: false };
}

// ---------- variables ----------
const tfKind = (rt: Rt) => rt.tf.period.replace(/\d+/g, '') || 'min';

export const VARS: Record<string, (rt: Rt, id: number) => any> = {
  bar_index: (rt) => rt.bar,
  last_bar_index: (rt) => rt.n - 1,
  last_bar_time: (rt) => rt.d.time[rt.n - 1],
  timenow: (rt) => rt.d.timeClose[rt.n - 1],
  year: timeVar(year),
  month: timeVar(month),
  dayofmonth: timeVar(dayofmonth),
  dayofweek: timeVar(dayofweek),
  hour: timeVar(hour),
  minute: timeVar(minute),
  second: timeVar(second),
  weekofyear: (rt) => {
    const d = new Date(rt.d.time[rt.bar]);
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
  },
  'barstate.isfirst': (rt) => rt.bar === 0,
  'barstate.islast': (rt) => rt.bar === rt.n - 1,
  'barstate.ishistory': () => true,
  'barstate.isrealtime': () => false,
  'barstate.isnew': () => true,
  'barstate.isconfirmed': () => true,
  'barstate.islastconfirmedhistory': (rt) => rt.bar === rt.n - 1,
  'syminfo.ticker': (rt) => rt.sym.ticker,
  'syminfo.tickerid': (rt) => rt.sym.ticker,
  'syminfo.root': (rt) => rt.sym.ticker,
  'syminfo.prefix': () => 'BTL',
  'syminfo.description': (rt) => rt.sym.description,
  'syminfo.type': (rt) => rt.sym.type,
  'syminfo.currency': (rt) => rt.sym.currency,
  'syminfo.basecurrency': (rt) => rt.sym.basecurrency,
  'syminfo.mintick': (rt) => rt.sym.mintick,
  'syminfo.pointvalue': (rt) => rt.sym.pointvalue,
  'syminfo.timezone': (rt) => rt.sym.timezone,
  'syminfo.session': () => 'regular',
  'syminfo.volumetype': () => 'tick',
  'syminfo.minmove': () => 1,
  'syminfo.pricescale': (rt) => Math.round(1 / rt.sym.mintick),
  'timeframe.period': (rt) => rt.tf.period,
  'timeframe.main_period': (rt) => rt.tf.period,
  'timeframe.multiplier': (rt) => Number(/^\d+/.exec(rt.tf.period)?.[0] ?? 1),
  'timeframe.isintraday': (rt) => rt.tf.ms < 86_400_000,
  'timeframe.isdaily': (rt) => tfKind(rt) === 'D',
  'timeframe.isweekly': (rt) => tfKind(rt) === 'W',
  'timeframe.ismonthly': (rt) => tfKind(rt) === 'M',
  'timeframe.isdwm': (rt) => rt.tf.ms >= 86_400_000,
  'timeframe.isminutes': (rt) => tfKind(rt) === 'min',
  'timeframe.isseconds': (rt) => tfKind(rt) === 'S',
  'timeframe.isticks': () => false,
  'chart.bg_color': () => '#131722ff',
  'chart.fg_color': () => '#d1d4dcff',
  'chart.left_visible_bar_time': (rt) => rt.d.time[0],
  'chart.right_visible_bar_time': (rt) => rt.d.time[rt.n - 1],
  ...TA_VARS,
};
for (const v of STRATEGY_VARS)
  VARS[`strategy.${v}`] = (rt) =>
    rt.broker && !rt.secondary && rt.decl?.kind === 'strategy' ? rt.broker.get(v, rt) : v === 'position_entry_name' || v === 'account_currency' ? '' : 0;
