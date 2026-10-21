import type { IndicatorConfig } from './indicators';
import { layoutSaved } from '../services/layoutSync';

/**
 * Drawings on the built-in chart. Points are (bar time in UTC seconds, price), so a drawing stays
 * on the same candles when the chart scrolls, zooms or changes timeframe.
 *
 * The first twelve types are the original ones: drawings saved with them (and without the newer
 * optional fields) render exactly as before. Every newer field is optional.
 */

export type DrawingType =
  // the original twelve (ids are saved in users' layouts: never rename)
  | 'trend'
  | 'ray'
  | 'hline'
  | 'hray'
  | 'vline'
  | 'channel'
  | 'rect'
  | 'fib'
  | 'long'
  | 'short'
  | 'measure'
  | 'text'
  // lines
  | 'infoline'
  | 'extended'
  | 'trendangle'
  | 'crossline'
  // channels and pitchforks
  | 'regression'
  | 'flattop'
  | 'disjoint'
  | 'pitchfork'
  | 'schiff'
  | 'modschiff'
  | 'insidepitchfork'
  // fibonacci
  | 'fibext'
  | 'fibchannel'
  | 'fibtimezone'
  | 'fibfan'
  | 'fibtime'
  | 'fibcircles'
  | 'fibspiral'
  | 'fibarcs'
  | 'fibwedge'
  | 'pitchfan'
  // gann
  | 'gannbox'
  | 'gannsqfixed'
  | 'gannsquare'
  | 'gannfan'
  // shapes and brushes
  | 'brush'
  | 'highlighter'
  | 'arrowmarker'
  | 'arrow'
  | 'arrowup'
  | 'arrowdown'
  | 'rotrect'
  | 'path'
  | 'circle'
  | 'ellipse'
  | 'polyline'
  | 'triangle'
  | 'arc'
  | 'curve'
  | 'doublecurve'
  // annotations
  | 'anchoredtext'
  | 'note'
  | 'pricenote'
  | 'pin'
  | 'callout'
  | 'comment'
  | 'pricelabel'
  | 'signpost'
  | 'flag'
  // patterns, waves and cycles
  | 'xabcd'
  | 'cypher'
  | 'headshoulders'
  | 'abcd'
  | 'trianglepattern'
  | 'threedrives'
  | 'elliott5'
  | 'elliott3'
  | 'elliotttriangle'
  | 'elliottwxy'
  | 'elliottwxyxz'
  | 'cycliclines'
  | 'timecycles'
  | 'sineline'
  // prediction and measurement
  | 'forecast'
  | 'barspattern'
  | 'ghostfeed'
  | 'projection'
  | 'daterange'
  | 'pricerange';

export type ToolId = 'cursor' | DrawingType;

export interface Point {
  time: number;
  price: number;
}

export type LineDash = 'solid' | 'dashed' | 'dotted';

/** One level of a level-based tool (Fibonacci, Gann, pitchfork). */
export interface Level {
  value: number;
  /** Gann fans: the time part of the ratio (value = price units, value2 = time units) */
  value2?: number;
  color: string;
  visible: boolean;
  dash?: LineDash;
}

/** Timeframe groups for a drawing's visibility. */
export type TfGroup = 's' | 'm' | 'h' | 'd';
export const tfGroupOf = (stepSec: number): TfGroup => (stepSec < 60 ? 's' : stepSec < 3600 ? 'm' : stepSec < 86400 ? 'h' : 'd');

/**
 * Optional look and behaviour of a drawing. Each tool reads the keys that apply to it (its spec's
 * `options` and flags list them); a missing key falls back to the tool's default.
 */
export interface DrawingStyle {
  dash?: LineDash;
  extendLeft?: boolean;
  extendRight?: boolean;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  /** background */
  showFill?: boolean;
  fill?: string;
  fillOpacity?: number;
  /** text */
  textColor?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  showTextBg?: boolean;
  textBg?: string;
  showTextBorder?: boolean;
  textBorder?: string;
  textV?: 'top' | 'middle' | 'bottom';
  textH?: 'left' | 'center' | 'right';
  /** readouts */
  showPrice?: boolean;
  showTime?: boolean;
  showStats?: boolean;
  showMiddle?: boolean;
  /** level-based tools */
  showLabels?: boolean;
  showPrices?: boolean;
  percent?: boolean;
  labelH?: 'left' | 'right';
  labelV?: 'top' | 'middle' | 'bottom';
  reverse?: boolean;
  showTrend?: boolean;
  levelWidth?: number;
  levelDash?: LineDash;
  oneColor?: boolean;
  /** Gann */
  angles?: boolean;
  showFill2?: boolean;
  labelsLeft?: boolean;
  labelsRight?: boolean;
  labelsTop?: boolean;
  labelsBottom?: boolean;
  grid?: boolean;
  fans?: boolean;
  arcs?: boolean;
  /** Gann square fixed: price per bar */
  scale?: number;
  /** pitchforks */
  variant?: 'original' | 'schiff' | 'modified' | 'inside';
  /** regression trend */
  devUp?: number;
  devDown?: number;
  showPearson?: boolean;
  /** Fib arcs: whole circles instead of half */
  fullCircles?: boolean;
  /** Elliott waves */
  degree?: 'circled' | 'paren' | 'plain' | 'roman' | 'romanParen';
  /** bars pattern */
  mode?: 'bars' | 'candles' | 'line';
  mirror?: boolean;
  flip?: boolean;
  /** ghost feed */
  upColor?: string;
  downColor?: string;
  avgHL?: number;
  variance?: number;
  /** polyline: closed shape */
  closed?: boolean;
}

export interface Drawing {
  id: string;
  type: DrawingType;
  /**
   * trend, ray, rect, fib, measure: start and end · hline, hray, vline, text: one point ·
   * channel: two points of the first line and one on the parallel line ·
   * long, short: entry (time, price) and the right edge (time) · newer tools: see TOOL_SPECS
   */
  points: Point[];
  color: string;
  /** line width 1–4 (text: size step) */
  width: number;
  text?: string;
  /** long / short position */
  stop?: number;
  target?: number;
  locked?: boolean;
  // ---------- newer, all optional ----------
  style?: DrawingStyle;
  levels?: Level[];
  levels2?: Level[];
  levels3?: Level[];
  /** timeframe groups this drawing is hidden on */
  hiddenOn?: TfGroup[];
  /** hidden from the chart (the drawings list shows it again) */
  hidden?: boolean;
  /** anchored text: position in the pane, as fractions of its width and height */
  anchor?: { x: number; y: number };
  /** bars pattern: the copied bars, [open, high, low, close] */
  bars?: [number, number, number, number][];
}

// ---------- colors ----------
export const DRAWING_COLORS = ['#2962ff', '#f23645', '#089981', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#787b86'];

/** The colour grid of the colour picker (TradingView's palette). */
export const PALETTE_GRID: string[][] = [
  ['#ffffff', '#d1d4dc', '#b2b5be', '#9598a1', '#787b86', '#5d606b', '#434651', '#2a2e39', '#131722', '#000000'],
  ['#f23645', '#ff9800', '#ffeb3b', '#4caf50', '#089981', '#00bcd4', '#2962ff', '#673ab7', '#9c27b0', '#e91e63'],
  ['#fccbcd', '#ffe0b2', '#fff9c4', '#c8e6c9', '#ace5dc', '#b2ebf2', '#bbd9fb', '#d1c4e9', '#e1bee7', '#f8bbd0'],
  ['#faa1a4', '#ffcc80', '#fff59d', '#a5d6a7', '#70ccbd', '#80deea', '#90bff9', '#b39ddb', '#ce93d8', '#f48fb1'],
  ['#f77c80', '#ffb74d', '#fff176', '#81c784', '#42bda8', '#4dd0e1', '#5b9cf6', '#9575cd', '#ba68c8', '#f06292'],
  ['#f7525f', '#ffa726', '#ffee58', '#66bb6a', '#22ab94', '#26c6da', '#3179f5', '#7e57c2', '#ab47bc', '#ec407a'],
  ['#b22833', '#f57c00', '#f57f17', '#388e3c', '#056656', '#0097a7', '#1848cc', '#512da8', '#7b1fa2', '#c2185b'],
  ['#801922', '#e65100', '#f57f17', '#1b5e20', '#00332a', '#006064', '#0c3299', '#311b92', '#4a148c', '#880e4f'],
];

const C = {
  gray: '#787b86',
  red: '#f23645',
  orange: '#ff9800',
  yellow: '#ffeb3b',
  green: '#4caf50',
  teal: '#089981',
  cyan: '#00bcd4',
  blue: '#2962ff',
  purple: '#9c27b0',
  pink: '#e91e63',
  violet: '#673ab7',
};

/** The original Fib retracement levels: drawings saved without `levels` keep them. */
export const FIB_LEVELS: { level: number; color: string }[] = [
  { level: 0, color: '#787b86' },
  { level: 0.236, color: '#f23645' },
  { level: 0.382, color: '#ff9800' },
  { level: 0.5, color: '#4caf50' },
  { level: 0.618, color: '#089981' },
  { level: 0.786, color: '#00bcd4' },
  { level: 1, color: '#787b86' },
  { level: 1.618, color: '#2962ff' },
];

// ---------- default levels ----------
const lv = (value: number, color: string, visible = true, value2?: number): Level => (value2 === undefined ? { value, color, visible } : { value, value2, color, visible });

/** TradingView's Fibonacci retracement / extension levels (the extra ones start hidden). */
const FIB_FULL = (on: number): Level[] =>
  [
    lv(0, C.gray),
    lv(0.236, C.red),
    lv(0.382, C.orange),
    lv(0.5, C.green),
    lv(0.618, C.teal),
    lv(0.786, C.cyan),
    lv(1, C.gray),
    lv(1.618, C.blue),
    lv(2.618, C.red),
    lv(3.618, C.purple),
    lv(4.236, C.pink),
    lv(1.272, C.orange, false),
    lv(1.414, C.red, false),
    lv(2, C.teal, false),
    lv(2.272, C.orange, false),
    lv(2.414, C.green, false),
    lv(3, C.cyan, false),
    lv(3.272, C.gray, false),
    lv(3.414, C.blue, false),
    lv(4, C.red, false),
    lv(4.272, C.purple, false),
    lv(4.414, C.pink, false),
    lv(4.618, C.orange, false),
    lv(4.764, C.teal, false),
  ].map((l, i) => (i >= on ? { ...l, visible: false } : l));

const GANN_LEVELS = (): Level[] => [lv(0, C.gray), lv(0.25, C.orange), lv(0.382, C.cyan), lv(0.5, C.green), lv(0.618, C.teal), lv(0.75, C.blue), lv(1, C.gray)];
const FAN_LEVELS = (): Level[] => [
  lv(1, C.orange, true, 8),
  lv(1, C.teal, true, 4),
  lv(1, C.green, true, 3),
  lv(1, C.teal, true, 2),
  lv(1, C.blue, true, 1),
  lv(2, C.cyan, true, 1),
  lv(3, C.purple, true, 1),
  lv(4, C.pink, true, 1),
  lv(8, C.red, true, 1),
];
const FORK_LEVELS = (): Level[] => [
  lv(0.25, C.orange, false),
  lv(0.382, C.cyan, false),
  lv(0.5, C.teal),
  lv(0.618, C.green, false),
  lv(0.75, C.cyan, false),
  lv(1, C.blue),
  lv(1.5, C.purple, false),
  lv(1.75, C.pink, false),
  lv(2, C.red, false),
];
const TIMEZONE_LEVELS = (): Level[] =>
  [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89].map((v, i) => lv(v, [C.gray, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue][i]));
const FIB_TIME_LEVELS = (): Level[] =>
  [0, 0.382, 0.5, 0.618, 1, 1.382, 1.618, 2, 2.382, 2.618, 3, 3.618, 4.236].map((v, i) =>
    lv(v, [C.gray, C.orange, C.green, C.teal, C.gray, C.cyan, C.blue, C.red, C.purple, C.pink, C.orange, C.teal, C.cyan][i]),
  );
const ROUND_LEVELS = (on: number): Level[] =>
  [
    lv(0.236, C.red),
    lv(0.382, C.orange),
    lv(0.5, C.green),
    lv(0.618, C.teal),
    lv(0.786, C.cyan),
    lv(1, C.gray),
    lv(1.618, C.blue),
    lv(2.618, C.red),
    lv(3.618, C.purple),
    lv(4.236, C.pink),
  ].map((l, i) => (i >= on ? { ...l, visible: false } : l));

// ---------- the tools ----------
export type ToolGroupId = 'lines' | 'fib' | 'patterns' | 'forecast' | 'shapes' | 'notes';
export type ToolMode = 'click' | 'multi' | 'free';

export interface LevelSetSpec {
  key: 'levels' | 'levels2' | 'levels3';
  name: string;
  /** Gann fans: each level is a ratio (price units / time units) */
  pair?: boolean;
  /** the toggle that shows this set, if any */
  toggle?: keyof DrawingStyle;
}

export interface OptionSpec {
  key: keyof DrawingStyle;
  label: string;
  kind: 'bool' | 'select' | 'number' | 'color';
  choices?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ToolSpec {
  id: DrawingType;
  name: string;
  /** TradingView's name (and a short how-to) */
  hint: string;
  /** clicks to draw (multi: until a double-click; free: press and drag) */
  points: number;
  mode: ToolMode;
  /** the main line's colour, width and style are editable */
  line: boolean;
  /** background colour and opacity */
  fill?: boolean;
  /** extend left / right */
  extend?: boolean;
  /** arrow heads at the ends */
  arrows?: boolean;
  /** text: the main content (text, notes) or an optional label on the drawing */
  text?: 'main' | 'label';
  levels?: LevelSetSpec[];
  options?: OptionSpec[];
  /** the drawing spreads beyond its points horizontally (no off-screen skipping) */
  wide?: boolean;
  /** letters of the points (patterns), for the coordinates tab and labels */
  labels?: string[];
}

const opt = {
  middle: { key: 'showMiddle', label: 'خط میانی', kind: 'bool' } as OptionSpec,
  price: { key: 'showPrice', label: 'برچسب قیمت', kind: 'bool' } as OptionSpec,
  time: { key: 'showTime', label: 'برچسب زمان', kind: 'bool' } as OptionSpec,
  stats: { key: 'showStats', label: 'آمار (تغییر قیمت، کندل‌ها، زاویه)', kind: 'bool' } as OptionSpec,
  labels: { key: 'showLabels', label: 'نمایش سطوح', kind: 'bool' } as OptionSpec,
  prices: { key: 'showPrices', label: 'نمایش قیمت‌ها', kind: 'bool' } as OptionSpec,
  percent: { key: 'percent', label: 'سطوح به درصد', kind: 'bool' } as OptionSpec,
  reverse: { key: 'reverse', label: 'معکوس', kind: 'bool' } as OptionSpec,
  trend: { key: 'showTrend', label: 'خط روند', kind: 'bool' } as OptionSpec,
  oneColor: { key: 'oneColor', label: 'یک رنگ برای همه‌ی سطوح', kind: 'bool' } as OptionSpec,
  labelH: {
    key: 'labelH',
    label: 'جای برچسب‌ها',
    kind: 'select',
    choices: [
      { value: 'left', label: 'چپ' },
      { value: 'right', label: 'راست' },
    ],
  } as OptionSpec,
  labelV: {
    key: 'labelV',
    label: 'ارتفاع برچسب‌ها',
    kind: 'select',
    choices: [
      { value: 'top', label: 'بالای خط' },
      { value: 'middle', label: 'روی خط' },
      { value: 'bottom', label: 'زیر خط' },
    ],
  } as OptionSpec,
  levelWidth: { key: 'levelWidth', label: 'ضخامت خط سطوح', kind: 'number', min: 1, max: 4, step: 1 } as OptionSpec,
  levelDash: {
    key: 'levelDash',
    label: 'سبک خط سطوح',
    kind: 'select',
    choices: [
      { value: 'solid', label: 'ممتد' },
      { value: 'dashed', label: 'خط‌چین' },
      { value: 'dotted', label: 'نقطه‌چین' },
    ],
  } as OptionSpec,
  fontSize: { key: 'fontSize', label: 'اندازه‌ی قلم برچسب‌ها', kind: 'number', min: 8, max: 28, step: 1 } as OptionSpec,
  degree: {
    key: 'degree',
    label: 'درجه‌ی موج',
    kind: 'select',
    choices: [
      { value: 'circled', label: 'اصلی (دایره‌دار)' },
      { value: 'paren', label: 'میانی ( )' },
      { value: 'plain', label: 'فرعی' },
      { value: 'romanParen', label: 'دقیقه‌ای (i)' },
      { value: 'roman', label: 'ریز i' },
    ],
  } as OptionSpec,
};

const LEVEL_OPTS: OptionSpec[] = [opt.trend, opt.labels, opt.prices, opt.percent, opt.reverse, opt.oneColor, opt.labelH, opt.labelV, opt.levelWidth, opt.levelDash, opt.fontSize];
const ROUND_OPTS: OptionSpec[] = [opt.trend, opt.labels, opt.percent, opt.oneColor, opt.levelWidth, opt.levelDash, opt.fontSize];
const PATTERN_OPTS: OptionSpec[] = [{ key: 'showLabels', label: 'برچسب نقطه‌ها و نسبت‌ها', kind: 'bool' }, opt.fontSize];
const WAVE_OPTS: OptionSpec[] = [opt.degree, { key: 'showLabels', label: 'برچسب موج‌ها', kind: 'bool' }, opt.fontSize];
const FORK_OPTS: OptionSpec[] = [
  {
    key: 'variant',
    label: 'نوع',
    kind: 'select',
    choices: [
      { value: 'original', label: 'اندروز (اصلی)' },
      { value: 'schiff', label: 'شیف' },
      { value: 'modified', label: 'شیف اصلاح‌شده' },
      { value: 'inside', label: 'داخلی' },
    ],
  },
  opt.levelWidth,
  opt.levelDash,
  opt.oneColor,
];

type SpecIn = Omit<ToolSpec, 'id' | 'mode' | 'line'> & { mode?: ToolMode; line?: boolean };
const S = (s: SpecIn) => ({ mode: 'click' as ToolMode, line: true, ...s });

const SPECS: Record<DrawingType, Omit<ToolSpec, 'id'>> = {
  // ----- lines -----
  trend: S({ name: 'خط روند', hint: 'Trend Line · دو کلیک', points: 2, extend: true, arrows: true, text: 'label', options: [opt.middle, opt.stats] }),
  ray: S({ name: 'پرتو', hint: 'Ray · خطی که به سمت راست ادامه دارد', points: 2, arrows: true, text: 'label', wide: true, options: [opt.stats] }),
  infoline: S({ name: 'خط اطلاعات', hint: 'Info Line · تغییر قیمت، کندل‌ها و زاویه', points: 2, extend: true, arrows: true, text: 'label', options: [opt.stats] }),
  extended: S({ name: 'خط ممتد', hint: 'Extended Line · از دو طرف ادامه دارد', points: 2, text: 'label', wide: true, options: [opt.stats] }),
  trendangle: S({ name: 'زاویه‌ی روند', hint: 'Trend Angle · زاویه‌ی خط روی چارت', points: 2, extend: true, arrows: true, text: 'label', options: [opt.stats] }),
  hline: S({ name: 'خط افقی', hint: 'Horizontal Line', points: 1, text: 'label', wide: true, options: [opt.price] }),
  hray: S({ name: 'پرتو افقی', hint: 'Horizontal Ray', points: 1, text: 'label', wide: true, options: [opt.price] }),
  vline: S({ name: 'خط عمودی', hint: 'Vertical Line', points: 1, text: 'label', options: [opt.time] }),
  crossline: S({ name: 'خط متقاطع', hint: 'Cross Line · افقی و عمودی', points: 1, wide: true, options: [opt.price, opt.time] }),
  // ----- channels -----
  channel: S({ name: 'کانال موازی', hint: 'Parallel Channel · سه کلیک', points: 3, fill: true, extend: true, text: 'label', options: [opt.middle] }),
  regression: S({
    name: 'روند رگرسیون',
    hint: 'Regression Trend · کانال رگرسیون خطی روی کندل‌ها',
    points: 2,
    fill: true,
    extend: true,
    options: [
      { key: 'devUp', label: 'انحراف بالا (×σ)', kind: 'number', min: 0, max: 10, step: 0.1 },
      { key: 'devDown', label: 'انحراف پایین (×σ)', kind: 'number', min: 0, max: 10, step: 0.1 },
      { key: 'showPearson', label: 'ضریب همبستگی پیرسون', kind: 'bool' },
    ],
  }),
  flattop: S({ name: 'سقف/کف صاف', hint: 'Flat Top/Bottom · سه کلیک', points: 3, fill: true, extend: true, text: 'label' }),
  disjoint: S({
    name: 'کانال ناهمسو',
    hint: 'Disjoint Channel · سه کلیک؛ هر چهار سر جابه‌جا می‌شود',
    points: 3,
    fill: true,
    extend: true,
    text: 'label',
    labels: ['۱', '۲', '۳', '۴'],
  }),
  pitchfork: S({
    name: 'چنگال اندروز',
    hint: 'Pitchfork · سه کلیک',
    points: 3,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: FORK_OPTS,
    labels: ['A', 'B', 'C'],
  }),
  schiff: S({
    name: 'چنگال شیف',
    hint: 'Schiff Pitchfork',
    points: 3,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: FORK_OPTS,
    labels: ['A', 'B', 'C'],
  }),
  modschiff: S({
    name: 'چنگال شیف اصلاح‌شده',
    hint: 'Modified Schiff Pitchfork',
    points: 3,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: FORK_OPTS,
    labels: ['A', 'B', 'C'],
  }),
  insidepitchfork: S({
    name: 'چنگال داخلی',
    hint: 'Inside Pitchfork',
    points: 3,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: FORK_OPTS,
    labels: ['A', 'B', 'C'],
  }),
  // ----- fibonacci -----
  fib: S({ name: 'فیبوناچی اصلاحی', hint: 'Fib Retracement', points: 2, fill: true, extend: true, levels: [{ key: 'levels', name: 'سطوح' }], options: LEVEL_OPTS }),
  fibext: S({
    name: 'فیبوناچی گسترشی روند',
    hint: 'Trend-Based Fib Extension · سه کلیک',
    points: 3,
    fill: true,
    extend: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: LEVEL_OPTS,
  }),
  fibchannel: S({ name: 'کانال فیبوناچی', hint: 'Fib Channel · سه کلیک', points: 3, fill: true, extend: true, levels: [{ key: 'levels', name: 'سطوح' }], options: LEVEL_OPTS }),
  fibtimezone: S({
    name: 'منطقه‌ی زمانی فیبوناچی',
    hint: 'Fib Time Zone',
    points: 2,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح (تعداد دوره)' }],
    options: [opt.trend, opt.labels, opt.oneColor, opt.levelWidth, opt.levelDash, opt.fontSize],
  }),
  fibfan: S({
    name: 'بادبزن سرعت مقاومت فیبوناچی',
    hint: 'Fib Speed Resistance Fan',
    points: 2,
    fill: true,
    wide: true,
    levels: [
      { key: 'levels', name: 'سطوح قیمت' },
      { key: 'levels2', name: 'سطوح زمان' },
    ],
    options: [{ key: 'grid', label: 'شبکه', kind: 'bool' }, opt.labels, opt.reverse, opt.oneColor, opt.levelWidth, opt.levelDash, opt.fontSize],
  }),
  fibtime: S({
    name: 'زمان فیبوناچی روند',
    hint: 'Trend-Based Fib Time · سه کلیک',
    points: 3,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: [opt.trend, opt.labels, opt.percent, opt.oneColor, opt.levelWidth, opt.levelDash, opt.fontSize],
  }),
  fibcircles: S({ name: 'دایره‌های فیبوناچی', hint: 'Fib Circles', points: 2, fill: true, wide: true, levels: [{ key: 'levels', name: 'سطوح' }], options: ROUND_OPTS }),
  fibspiral: S({ name: 'مارپیچ فیبوناچی', hint: 'Fib Spiral', points: 2, wide: true, options: [opt.trend] }),
  fibarcs: S({
    name: 'کمان‌های سرعت مقاومت فیبوناچی',
    hint: 'Fib Speed Resistance Arcs',
    points: 2,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: [{ key: 'fullCircles', label: 'دایره‌ی کامل', kind: 'bool' }, ...ROUND_OPTS],
  }),
  fibwedge: S({ name: 'گوه‌ی فیبوناچی', hint: 'Fib Wedge · سه کلیک', points: 3, fill: true, wide: true, levels: [{ key: 'levels', name: 'سطوح' }], options: ROUND_OPTS }),
  pitchfan: S({
    name: 'بادبزن چنگالی',
    hint: 'Pitchfan · سه کلیک',
    points: 3,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'سطوح' }],
    options: [opt.levelWidth, opt.levelDash, opt.oneColor],
    labels: ['A', 'B', 'C'],
  }),
  // ----- gann -----
  gannbox: S({
    name: 'جعبه‌ی گن',
    hint: 'Gann Box',
    points: 2,
    fill: true,
    levels: [
      { key: 'levels', name: 'سطوح قیمت' },
      { key: 'levels2', name: 'سطوح زمان' },
    ],
    options: [
      { key: 'angles', label: 'زاویه‌ها', kind: 'bool' },
      { key: 'showFill2', label: 'پس‌زمینه‌ی سطوح زمان', kind: 'bool' },
      opt.reverse,
      { key: 'labelsLeft', label: 'برچسب‌های چپ', kind: 'bool' },
      { key: 'labelsRight', label: 'برچسب‌های راست', kind: 'bool' },
      { key: 'labelsTop', label: 'برچسب‌های بالا', kind: 'bool' },
      { key: 'labelsBottom', label: 'برچسب‌های پایین', kind: 'bool' },
      opt.oneColor,
      opt.levelWidth,
      opt.levelDash,
      opt.fontSize,
    ],
  }),
  gannsqfixed: S({
    name: 'مربع ثابت گن',
    hint: 'Gann Square Fixed · نسبت قیمت به زمان ثابت',
    points: 2,
    fill: true,
    levels: [
      { key: 'levels', name: 'سطوح', toggle: 'grid' },
      { key: 'levels2', name: 'بادبزن‌ها', pair: true, toggle: 'fans' },
      { key: 'levels3', name: 'کمان‌ها', toggle: 'arcs' },
    ],
    options: [
      { key: 'grid', label: 'سطوح', kind: 'bool' },
      { key: 'fans', label: 'بادبزن‌ها', kind: 'bool' },
      { key: 'arcs', label: 'کمان‌ها', kind: 'bool' },
      { key: 'scale', label: 'قیمت به ازای هر کندل', kind: 'number', min: 0, step: 0.00001 },
      opt.labels,
      opt.reverse,
      opt.oneColor,
      opt.levelWidth,
      opt.fontSize,
    ],
  }),
  gannsquare: S({
    name: 'مربع گن',
    hint: 'Gann Square',
    points: 2,
    fill: true,
    levels: [
      { key: 'levels', name: 'سطوح', toggle: 'grid' },
      { key: 'levels2', name: 'بادبزن‌ها', pair: true, toggle: 'fans' },
      { key: 'levels3', name: 'کمان‌ها', toggle: 'arcs' },
    ],
    options: [
      { key: 'grid', label: 'سطوح', kind: 'bool' },
      { key: 'fans', label: 'بادبزن‌ها', kind: 'bool' },
      { key: 'arcs', label: 'کمان‌ها', kind: 'bool' },
      opt.labels,
      opt.reverse,
      opt.oneColor,
      opt.levelWidth,
      opt.fontSize,
    ],
  }),
  gannfan: S({
    name: 'بادبزن گن',
    hint: 'Gann Fan',
    points: 2,
    fill: true,
    wide: true,
    levels: [{ key: 'levels', name: 'زاویه‌ها (قیمت/زمان)', pair: true }],
    options: [opt.labels, opt.oneColor, opt.levelWidth, opt.levelDash, opt.fontSize],
  }),
  // ----- shapes -----
  brush: S({ name: 'قلم‌مو', hint: 'Brush · بکشید و رها کنید', points: 0, mode: 'free', fill: true }),
  highlighter: S({ name: 'ماژیک', hint: 'Highlighter · بکشید و رها کنید', points: 0, mode: 'free' }),
  arrowmarker: S({ name: 'نشانگر پیکان', hint: 'Arrow Marker', points: 2, text: 'label', line: true }),
  arrow: S({ name: 'پیکان', hint: 'Arrow', points: 2, arrows: true, extend: false, text: 'label', options: [opt.stats] }),
  arrowup: S({ name: 'پیکان بالا', hint: 'Arrow Mark Up', points: 1, text: 'label' }),
  arrowdown: S({ name: 'پیکان پایین', hint: 'Arrow Mark Down', points: 1, text: 'label' }),
  rect: S({ name: 'مستطیل', hint: 'Rectangle', points: 2, fill: true, extend: true, text: 'label', options: [opt.middle] }),
  rotrect: S({ name: 'مستطیل چرخان', hint: 'Rotated Rectangle · سه کلیک', points: 3, fill: true, text: 'label' }),
  path: S({ name: 'مسیر', hint: 'Path · کلیک‌ها؛ دابل‌کلیک یا Enter برای پایان', points: 0, mode: 'multi', arrows: true }),
  circle: S({ name: 'دایره', hint: 'Circle · مرکز و شعاع', points: 2, fill: true, text: 'label' }),
  ellipse: S({ name: 'بیضی', hint: 'Ellipse · سه کلیک', points: 3, fill: true, text: 'label' }),
  polyline: S({
    name: 'چندضلعی',
    hint: 'Polyline · کلیک‌ها؛ کلیک روی نقطه‌ی اول یا دابل‌کلیک برای پایان',
    points: 0,
    mode: 'multi',
    fill: true,
    options: [{ key: 'closed', label: 'شکل بسته', kind: 'bool' }],
  }),
  triangle: S({ name: 'مثلث', hint: 'Triangle · سه کلیک', points: 3, fill: true, text: 'label' }),
  arc: S({ name: 'کمان', hint: 'Arc · سه کلیک', points: 3, fill: true }),
  curve: S({ name: 'منحنی', hint: 'Curve · دو کلیک، سپس دستگیره‌ی میانی', points: 2, fill: true, arrows: true }),
  doublecurve: S({ name: 'منحنی دوگانه', hint: 'Double Curve · دو کلیک، سپس دو دستگیره', points: 2, fill: true, arrows: true }),
  // ----- annotations -----
  text: S({ name: 'متن', hint: 'Text', points: 1, text: 'main', line: false }),
  anchoredtext: S({ name: 'متن ثابت', hint: 'Anchored Text · روی صفحه ثابت می‌ماند', points: 1, text: 'main', line: false }),
  note: S({ name: 'یادداشت', hint: 'Note · متن با نگه داشتن نشانگر روی آیکون', points: 1, text: 'main', line: false }),
  pricenote: S({ name: 'یادداشت قیمت', hint: 'Price Note', points: 2, text: 'label' }),
  pin: S({ name: 'سنجاق', hint: 'Pin · متن با نگه داشتن نشانگر', points: 1, text: 'main', line: false }),
  callout: S({ name: 'کادر توضیح', hint: 'Callout · نقطه و جای کادر', points: 2, text: 'main' }),
  comment: S({ name: 'دیدگاه', hint: 'Comment', points: 1, text: 'main', line: false }),
  pricelabel: S({ name: 'برچسب قیمت', hint: 'Price Label', points: 1, line: false }),
  signpost: S({ name: 'تابلو', hint: 'Signpost', points: 1, text: 'main', line: false }),
  flag: S({ name: 'پرچم', hint: 'Flag Mark', points: 1, line: false }),
  // ----- patterns -----
  xabcd: S({ name: 'الگوی XABCD', hint: 'XABCD Pattern · پنج کلیک', points: 5, fill: true, options: PATTERN_OPTS, labels: ['X', 'A', 'B', 'C', 'D'] }),
  cypher: S({ name: 'الگوی سایفر', hint: 'Cypher Pattern · پنج کلیک', points: 5, fill: true, options: PATTERN_OPTS, labels: ['X', 'A', 'B', 'C', 'D'] }),
  headshoulders: S({
    name: 'سر و شانه',
    hint: 'Head and Shoulders · هفت کلیک',
    points: 7,
    fill: true,
    options: PATTERN_OPTS,
    labels: ['شروع', 'شانه‌ی چپ', 'گردن ۱', 'سر', 'گردن ۲', 'شانه‌ی راست', 'پایان'],
  }),
  abcd: S({ name: 'الگوی ABCD', hint: 'ABCD Pattern · چهار کلیک', points: 4, options: PATTERN_OPTS, labels: ['A', 'B', 'C', 'D'] }),
  trianglepattern: S({ name: 'الگوی مثلث', hint: 'Triangle Pattern · چهار کلیک', points: 4, fill: true, options: PATTERN_OPTS, labels: ['A', 'B', 'C', 'D'] }),
  threedrives: S({ name: 'الگوی سه حرکت', hint: 'Three Drives Pattern · هفت کلیک', points: 7, options: PATTERN_OPTS, labels: ['0', '1', 'A', '2', 'B', '3', 'C'] }),
  elliott5: S({ name: 'موج ایمپالس الیوت', hint: 'Elliott Impulse Wave (12345)', points: 6, options: WAVE_OPTS, labels: ['0', '1', '2', '3', '4', '5'] }),
  elliott3: S({ name: 'موج اصلاحی الیوت', hint: 'Elliott Correction Wave (ABC)', points: 4, options: WAVE_OPTS, labels: ['0', 'A', 'B', 'C'] }),
  elliotttriangle: S({ name: 'موج مثلثی الیوت', hint: 'Elliott Triangle Wave (ABCDE)', points: 6, options: WAVE_OPTS, labels: ['0', 'A', 'B', 'C', 'D', 'E'] }),
  elliottwxy: S({ name: 'موج ترکیبی دوگانه‌ی الیوت', hint: 'Elliott Double Combo Wave (WXY)', points: 4, options: WAVE_OPTS, labels: ['0', 'W', 'X', 'Y'] }),
  elliottwxyxz: S({ name: 'موج ترکیبی سه‌گانه‌ی الیوت', hint: 'Elliott Triple Combo Wave (WXYXZ)', points: 6, options: WAVE_OPTS, labels: ['0', 'W', 'X', 'Y', 'X', 'Z'] }),
  cycliclines: S({ name: 'خطوط چرخه‌ای', hint: 'Cyclic Lines · فاصله‌ی دو کلیک تکرار می‌شود', points: 2, wide: true }),
  timecycles: S({ name: 'چرخه‌های زمانی', hint: 'Time Cycles', points: 2, fill: true, wide: true }),
  sineline: S({ name: 'خط سینوسی', hint: 'Sine Line · قله و دره', points: 2, wide: true }),
  // ----- prediction and measurement -----
  long: S({ name: 'پوزیشن خرید', hint: 'Long Position · ورود، حد ضرر و حد سود', points: 1, line: false }),
  short: S({ name: 'پوزیشن فروش', hint: 'Short Position · ورود، حد ضرر و حد سود', points: 1, line: false }),
  forecast: S({ name: 'پیش‌بینی', hint: 'Forecast · مبدأ و هدف', points: 2 }),
  barspattern: S({
    name: 'الگوی کندل‌ها',
    hint: 'Bars Pattern · کپی کندل‌های بین دو کلیک',
    points: 2,
    options: [
      {
        key: 'mode',
        label: 'نمایش',
        kind: 'select',
        choices: [
          { value: 'candles', label: 'کندل' },
          { value: 'bars', label: 'میله‌ای' },
          { value: 'line', label: 'خطی (بسته شدن)' },
        ],
      },
      { key: 'mirror', label: 'قرینه‌ی افقی', kind: 'bool' },
      { key: 'flip', label: 'وارونه (عمودی)', kind: 'bool' },
    ],
  }),
  ghostfeed: S({
    name: 'کندل‌های فرضی',
    hint: 'Ghost Feed · مسیر قیمت را کلیک کنید؛ دابل‌کلیک برای پایان',
    points: 0,
    mode: 'multi',
    options: [
      { key: 'upColor', label: 'رنگ کندل صعودی', kind: 'color' },
      { key: 'downColor', label: 'رنگ کندل نزولی', kind: 'color' },
      { key: 'avgHL', label: 'میانگین سایه‌ها (٪ قیمت)', kind: 'number', min: 0, max: 5, step: 0.01 },
      { key: 'variance', label: 'نوسان (٪)', kind: 'number', min: 0, max: 100, step: 1 },
    ],
  }),
  projection: S({ name: 'پروجکشن', hint: 'Projection · سه کلیک', points: 3, fill: true }),
  daterange: S({ name: 'بازه‌ی تاریخ', hint: 'Date Range · کندل‌ها و مدت', points: 2, fill: true }),
  pricerange: S({ name: 'بازه‌ی قیمت', hint: 'Price Range · تغییر قیمت و پیپ', points: 2, fill: true }),
  measure: S({ name: 'بازه‌ی تاریخ و قیمت', hint: 'Date and Price Range · تغییر قیمت، پیپ و تعداد کندل', points: 2, line: false }),
};

export const TOOL_SPECS: Record<DrawingType, ToolSpec> = Object.fromEntries(Object.entries(SPECS).map(([id, s]) => [id, { id, ...s }])) as Record<DrawingType, ToolSpec>;

/** How many clicks each tool takes (0: any number, or press and drag). */
export const TOOL_POINTS: Record<DrawingType, number> = Object.fromEntries(Object.entries(SPECS).map(([id, s]) => [id, s.points])) as Record<DrawingType, number>;

export interface ToolInfo {
  id: DrawingType;
  name: string;
  hint: string;
}

export const TOOLS: Record<DrawingType, ToolInfo> = Object.fromEntries(Object.entries(SPECS).map(([id, s]) => [id, { id, name: s.name, hint: s.hint }])) as Record<
  DrawingType,
  ToolInfo
>;

export interface ToolSection {
  name: string;
  tools: DrawingType[];
}

/** The toolbar's groups, top to bottom, as in TradingView (a group opens a flyout of sections). */
export const TOOL_GROUPS: { id: ToolGroupId; name: string; sections: ToolSection[]; tools: DrawingType[] }[] = (
  [
    {
      id: 'lines',
      name: 'ابزارهای خط روند',
      sections: [
        { name: 'خطوط', tools: ['trend', 'ray', 'infoline', 'extended', 'trendangle', 'hline', 'hray', 'vline', 'crossline'] },
        { name: 'کانال‌ها', tools: ['channel', 'regression', 'flattop', 'disjoint'] },
        { name: 'چنگال‌ها', tools: ['pitchfork', 'schiff', 'modschiff', 'insidepitchfork'] },
      ],
    },
    {
      id: 'fib',
      name: 'ابزارهای گن و فیبوناچی',
      sections: [
        { name: 'فیبوناچی', tools: ['fib', 'fibext', 'fibchannel', 'fibtimezone', 'fibfan', 'fibtime', 'fibcircles', 'fibspiral', 'fibarcs', 'fibwedge', 'pitchfan'] },
        { name: 'گن', tools: ['gannbox', 'gannsqfixed', 'gannsquare', 'gannfan'] },
      ],
    },
    {
      id: 'patterns',
      name: 'الگوها',
      sections: [
        { name: 'الگوهای چارت', tools: ['xabcd', 'cypher', 'headshoulders', 'abcd', 'trianglepattern', 'threedrives'] },
        { name: 'امواج الیوت', tools: ['elliott5', 'elliott3', 'elliotttriangle', 'elliottwxy', 'elliottwxyxz'] },
        { name: 'چرخه‌ها', tools: ['cycliclines', 'timecycles', 'sineline'] },
      ],
    },
    {
      id: 'forecast',
      name: 'پیش‌بینی و اندازه‌گیری',
      sections: [
        { name: 'پیش‌بینی', tools: ['long', 'short', 'forecast', 'barspattern', 'ghostfeed', 'projection'] },
        { name: 'اندازه‌گیری', tools: ['pricerange', 'daterange', 'measure'] },
      ],
    },
    {
      id: 'shapes',
      name: 'اشکال هندسی',
      sections: [
        { name: 'قلم‌ها', tools: ['brush', 'highlighter'] },
        { name: 'پیکان‌ها', tools: ['arrowmarker', 'arrow', 'arrowup', 'arrowdown'] },
        { name: 'اشکال', tools: ['rect', 'rotrect', 'path', 'circle', 'ellipse', 'polyline', 'triangle', 'arc', 'curve', 'doublecurve'] },
      ],
    },
    {
      id: 'notes',
      name: 'متن و یادداشت',
      sections: [{ name: 'متن و یادداشت', tools: ['text', 'anchoredtext', 'note', 'pricenote', 'pin', 'callout', 'comment', 'pricelabel', 'signpost', 'flag'] }],
    },
  ] as { id: ToolGroupId; name: string; sections: ToolSection[] }[]
).map((g) => ({ ...g, tools: g.sections.flatMap((s) => s.tools) }));

// ---------- defaults for new drawings ----------
export interface DrawingProps {
  color: string;
  width: number;
  style: DrawingStyle;
  levels?: Level[];
  levels2?: Level[];
  levels3?: Level[];
}

export const DEFAULT_COLOR: Record<DrawingType, string> = Object.fromEntries(Object.keys(SPECS).map((id) => [id, C.blue])) as Record<DrawingType, string>;
Object.assign(DEFAULT_COLOR, {
  rect: '#9c27b0',
  fib: '#787b86',
  long: '#089981',
  short: '#f23645',
  fibext: C.gray,
  fibchannel: C.gray,
  fibtimezone: C.gray,
  fibfan: C.gray,
  fibtime: C.gray,
  fibcircles: C.gray,
  fibspiral: C.orange,
  fibarcs: C.gray,
  fibwedge: C.gray,
  pitchfan: C.red,
  pitchfork: C.red,
  schiff: C.red,
  modschiff: C.red,
  insidepitchfork: C.red,
  gannbox: C.gray,
  gannsqfixed: C.gray,
  gannsquare: C.gray,
  gannfan: C.gray,
  brush: C.blue,
  highlighter: '#f5b014',
  arrowmarker: C.blue,
  arrowup: C.teal,
  arrowdown: C.red,
  rotrect: C.purple,
  circle: C.orange,
  ellipse: C.teal,
  polyline: C.blue,
  triangle: C.pink,
  arc: C.violet,
  curve: C.blue,
  doublecurve: C.blue,
  note: C.orange,
  pin: C.red,
  callout: C.blue,
  comment: C.blue,
  pricelabel: C.blue,
  signpost: C.blue,
  flag: C.blue,
  xabcd: C.blue,
  cypher: C.blue,
  headshoulders: C.teal,
  abcd: C.teal,
  trianglepattern: C.purple,
  threedrives: C.blue,
  elliott5: C.blue,
  elliott3: C.red,
  elliotttriangle: C.orange,
  elliottwxy: C.teal,
  elliottwxyxz: C.purple,
  cycliclines: C.blue,
  timecycles: C.violet,
  sineline: C.blue,
  forecast: C.blue,
  barspattern: C.blue,
  ghostfeed: C.blue,
  projection: C.purple,
  daterange: C.blue,
  pricerange: C.blue,
} satisfies Partial<Record<DrawingType, string>>);

const LEVEL_STYLE: DrawingStyle = {
  showTrend: true,
  showLabels: true,
  showPrices: true,
  percent: false,
  reverse: false,
  labelH: 'left',
  labelV: 'top',
  levelWidth: 1,
  levelDash: 'solid',
  showFill: true,
  fillOpacity: 0.08,
  fontSize: 11,
  oneColor: false,
  extendLeft: false,
  extendRight: false,
};

/** Factory settings of each tool (before the user's saved default). */
export function factoryProps(type: DrawingType): DrawingProps {
  const color = DEFAULT_COLOR[type];
  const base: DrawingProps = { color, width: 2, style: { dash: 'solid' } };
  const s = TOOL_SPECS[type];
  if (s.fill) Object.assign(base.style, { showFill: true, fillOpacity: 0.15 });
  if (s.extend) Object.assign(base.style, { extendLeft: false, extendRight: false });
  if (s.text === 'label' || s.text === 'main') Object.assign(base.style, { fontSize: 14, bold: false, italic: false });
  switch (type) {
    case 'trend':
    case 'ray':
    case 'extended':
      Object.assign(base.style, { showMiddle: false, showStats: false });
      break;
    case 'infoline':
      Object.assign(base.style, { showStats: true });
      break;
    case 'trendangle':
      Object.assign(base.style, { showStats: false });
      break;
    case 'arrow':
      Object.assign(base.style, { arrowEnd: true, showStats: false });
      break;
    case 'path':
      Object.assign(base.style, { arrowEnd: true });
      break;
    case 'hline':
    case 'hray':
      Object.assign(base.style, { showPrice: true });
      break;
    case 'vline':
      Object.assign(base.style, { showTime: false });
      break;
    case 'crossline':
      Object.assign(base.style, { showPrice: true, showTime: false });
      break;
    case 'channel':
      Object.assign(base.style, { showMiddle: true, fillOpacity: 0.1 });
      break;
    case 'rect':
      Object.assign(base.style, { showMiddle: false });
      break;
    case 'regression':
      Object.assign(base.style, { devUp: 2, devDown: 2, showPearson: true, fillOpacity: 0.1 });
      base.color = C.blue;
      break;
    case 'flattop':
    case 'disjoint':
      Object.assign(base.style, { fillOpacity: 0.1 });
      break;
    case 'fib':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'dashed' }, levels: FIB_FULL(11) };
    case 'fibext':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'dashed' }, levels: FIB_FULL(11) };
    case 'fibchannel':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'solid', showTrend: false, showFill: true, labelV: 'top' }, levels: FIB_FULL(8) };
    case 'fibtimezone':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'dashed', showTrend: true, showFill: false }, levels: TIMEZONE_LEVELS() };
    case 'fibtime':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'dashed', showFill: false }, levels: FIB_TIME_LEVELS() };
    case 'fibfan':
      return { color, width: 1, style: { ...LEVEL_STYLE, grid: true, fillOpacity: 0.06 }, levels: GANN_LEVELS(), levels2: GANN_LEVELS() };
    case 'fibcircles':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'dashed', fillOpacity: 0.06 }, levels: ROUND_LEVELS(7) };
    case 'fibarcs':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'dashed', fullCircles: false, fillOpacity: 0.06 }, levels: ROUND_LEVELS(6) };
    case 'fibwedge':
      return { color, width: 1, style: { ...LEVEL_STYLE, dash: 'solid', fillOpacity: 0.06 }, levels: ROUND_LEVELS(6) };
    case 'fibspiral':
      return { color, width: 2, style: { dash: 'solid', showTrend: true } };
    case 'pitchfan':
      return { color, width: 1, style: { dash: 'solid', showFill: true, fillOpacity: 0.08, levelWidth: 1, levelDash: 'solid', oneColor: false }, levels: FORK_LEVELS() };
    case 'pitchfork':
    case 'schiff':
    case 'modschiff':
    case 'insidepitchfork':
      return {
        color,
        width: 1,
        style: {
          dash: 'solid',
          showFill: true,
          fillOpacity: 0.08,
          levelWidth: 1,
          levelDash: 'solid',
          oneColor: false,
          variant: type === 'schiff' ? 'schiff' : type === 'modschiff' ? 'modified' : type === 'insidepitchfork' ? 'inside' : 'original',
        },
        levels: FORK_LEVELS(),
      };
    case 'gannbox':
      return {
        color,
        width: 1,
        style: {
          ...LEVEL_STYLE,
          angles: false,
          showFill: true,
          showFill2: true,
          fillOpacity: 0.08,
          labelsLeft: true,
          labelsRight: true,
          labelsTop: true,
          labelsBottom: true,
        },
        levels: GANN_LEVELS(),
        levels2: GANN_LEVELS(),
      };
    case 'gannsquare':
    case 'gannsqfixed':
      return {
        color,
        width: 1,
        style: { ...LEVEL_STYLE, grid: true, fans: true, arcs: true, showFill: true, fillOpacity: 0.06 },
        levels: GANN_LEVELS(),
        levels2: FAN_LEVELS().map((l) => (l.value / (l.value2 ?? 1) === 3 || l.value / (l.value2 ?? 1) === 1 / 3 ? { ...l, visible: false } : l)),
        levels3: [lv(0.25, C.orange), lv(0.5, C.green), lv(0.75, C.cyan), lv(1, C.blue), lv(1.5, C.purple, false), lv(2, C.red, false)],
      };
    case 'gannfan':
      return { color, width: 1, style: { ...LEVEL_STYLE, showFill: true, fillOpacity: 0.06 }, levels: FAN_LEVELS() };
    case 'brush':
      return { color, width: 2, style: { dash: 'solid', showFill: false, fillOpacity: 0.15 } };
    case 'highlighter':
      return { color, width: 4, style: {} };
    case 'polyline':
      Object.assign(base.style, { closed: true });
      break;
    case 'curve':
    case 'doublecurve':
      Object.assign(base.style, { showFill: false });
      break;
    case 'text':
      return { color, width: 2, style: { bold: true, italic: false, showTextBg: false, textBg: C.blue, showTextBorder: false, textBorder: C.blue } };
    case 'anchoredtext':
      return { color, width: 2, style: { fontSize: 14, bold: false, italic: false, showTextBg: false, textBg: color, showTextBorder: false, textBorder: color } };
    case 'comment':
    case 'callout':
    case 'signpost':
      return { color, width: type === 'callout' ? 1 : 2, style: { fontSize: 14, bold: false, italic: false, textColor: '#ffffff', textBg: color } };
    case 'note':
    case 'pin':
      return { color, width: 2, style: { fontSize: 13, bold: false, italic: false } };
    case 'xabcd':
    case 'cypher':
    case 'headshoulders':
    case 'trianglepattern':
      Object.assign(base.style, { showLabels: true, fontSize: 12, fillOpacity: 0.15 });
      break;
    case 'abcd':
    case 'threedrives':
      Object.assign(base.style, { showLabels: true, fontSize: 12 });
      break;
    case 'elliott5':
    case 'elliott3':
    case 'elliotttriangle':
    case 'elliottwxy':
    case 'elliottwxyxz':
      Object.assign(base.style, { degree: 'paren', showLabels: true, fontSize: 13 });
      break;
    case 'timecycles':
      Object.assign(base.style, { fillOpacity: 0.08 });
      break;
    case 'barspattern':
      Object.assign(base.style, { mode: 'candles', mirror: false, flip: false });
      break;
    case 'ghostfeed':
      Object.assign(base.style, { upColor: '#089981', downColor: '#f23645', avgHL: 0.1, variance: 50 });
      break;
    case 'daterange':
    case 'pricerange':
      Object.assign(base.style, { fillOpacity: 0.15 });
      break;
    case 'projection':
      Object.assign(base.style, { fillOpacity: 0.1 });
      break;
  }
  return base;
}

// ---------- the user's own defaults ("Template → save as default") ----------
const TEMPLATE_PREFIX = 'btl:draw-default:';

export function savedDefault(type: DrawingType): Partial<DrawingProps> | null {
  try {
    const raw = localStorage.getItem(TEMPLATE_PREFIX + type);
    return raw ? (JSON.parse(raw) as Partial<DrawingProps>) : null;
  } catch {
    return null;
  }
}

export function saveDefault(d: Drawing) {
  const t: DrawingProps = { color: d.color, width: d.width, style: d.style ?? {} };
  if (d.levels) t.levels = d.levels;
  if (d.levels2) t.levels2 = d.levels2;
  if (d.levels3) t.levels3 = d.levels3;
  try {
    localStorage.setItem(TEMPLATE_PREFIX + d.type, JSON.stringify(t));
  } catch {
    /* storage blocked */
  }
}

export function clearDefault(type: DrawingType) {
  try {
    localStorage.removeItem(TEMPLATE_PREFIX + type);
  } catch {
    /* storage blocked */
  }
}

/** Settings for a new drawing: the factory settings with the user's saved default on top. */
export function newProps(type: DrawingType): DrawingProps {
  const f = factoryProps(type);
  const s = savedDefault(type);
  if (!s) return f;
  return {
    color: typeof s.color === 'string' ? s.color : f.color,
    width: typeof s.width === 'number' ? s.width : f.width,
    style: { ...f.style, ...(s.style ?? {}) },
    levels: Array.isArray(s.levels) ? s.levels : f.levels,
    levels2: Array.isArray(s.levels2) ? s.levels2 : f.levels2,
    levels3: Array.isArray(s.levels3) ? s.levels3 : f.levels3,
  };
}

/** Factory settings, shared (read only): renderers look defaults up on every frame. */
const factoryCache = new Map<DrawingType, DrawingProps>();
function factory(type: DrawingType): DrawingProps {
  let f = factoryCache.get(type);
  if (!f) factoryCache.set(type, (f = factoryProps(type)));
  return f;
}

const LEGACY_FIB: Level[] = FIB_LEVELS.map((l) => ({ value: l.level, color: l.color, visible: true }));

/** A drawing's levels (read only); old Fib retracements saved before levels were editable keep the original set. */
export function levelsOf(d: Drawing, key: 'levels' | 'levels2' | 'levels3' = 'levels'): Level[] {
  const own = d[key];
  if (own) return own;
  if (d.type === 'fib' && key === 'levels' && !d.style) return LEGACY_FIB;
  return factory(d.type)[key] ?? [];
}

/** Style value with the tool's factory default behind it. Old drawings (no `style`) get the original look. */
export function styleOf<K extends keyof DrawingStyle>(d: Drawing, key: K): DrawingStyle[K] {
  const v = d.style?.[key];
  if (v !== undefined) return v;
  const legacy = d.style ? undefined : LEGACY_STYLE[d.type];
  if (legacy && key in legacy) return legacy[key];
  return factory(d.type).style[key];
}

/**
 * The drawing with every effective setting written out (style keys, levels), so editing one
 * setting of an old drawing keeps the rest of its original look.
 */
export function withDefaults(d: Drawing): Drawing {
  const out = structuredClone(d);
  if (d.type === 'long' || d.type === 'short' || d.type === 'measure') return out;
  const f = factory(d.type);
  const legacy = d.style ? undefined : LEGACY_STYLE[d.type];
  out.style = { ...f.style, ...(legacy ?? {}), ...(d.style ?? {}) };
  for (const key of ['levels', 'levels2', 'levels3'] as const) if (!out[key] && (f[key] || (key === 'levels' && d.type === 'fib'))) out[key] = structuredClone(levelsOf(d, key));
  // old Fib retracements drew their trend line 1px wide whatever the width
  if (d.type === 'fib' && !d.style) out.width = 1;
  return out;
}

/** How the original twelve tools looked, for drawings saved before they had a style. */
const LEGACY_STYLE: Partial<Record<DrawingType, DrawingStyle>> = {
  fib: { ...LEVEL_STYLE, dash: 'dashed', fillOpacity: 0.08 },
  channel: { showFill: true, fillOpacity: 0.1, showMiddle: true, dash: 'solid' },
  rect: { showFill: true, fillOpacity: 0.15, dash: 'solid' },
  text: { bold: true, italic: false },
};

// ---------- saved per session and pane ----------
export interface LwLayout {
  v: 1;
  /** symbol → its drawings */
  drawings: Record<string, Drawing[]>;
  indicators: IndicatorConfig[];
}

const PREFIX = 'btl:lw-layout:';

export function readLwLayout(key: string | undefined): LwLayout {
  const empty: LwLayout = { v: 1, drawings: {}, indicators: [] };
  if (!key) return empty;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    const v = raw ? (JSON.parse(raw) as Partial<LwLayout>) : null;
    return v ? { v: 1, drawings: v.drawings ?? {}, indicators: Array.isArray(v.indicators) ? v.indicators : [] } : empty;
  } catch {
    return empty;
  }
}

export function writeLwLayout(key: string | undefined, layout: LwLayout) {
  if (!key) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(layout));
    // also kept on the server, for the user's other devices
    layoutSaved('lw', key);
  } catch {
    /* storage full or blocked: kept for this visit only */
  }
}

export const drawingId = () => `d_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
