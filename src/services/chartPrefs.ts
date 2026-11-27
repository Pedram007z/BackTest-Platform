/**
 * The chart's settings that belong to the account (kept on the server with the rest of its data,
 * services/workspace.ts), so they are the same after signing out and in, and on every device:
 *
 * - `tvSettings`: the TradingView library's own settings (each drawing tool's last style, the chart
 *   settings' defaults, its dialogs), by its setting key. Its favorites stay in `tvFavorites`.
 * - `drawDefaults`: the built-in chart's style for new drawings, per tool (the last one chosen).
 * - `indicatorDefaults`: the built-in chart's indicator settings saved as default, per indicator.
 * - `chartPrefs`: the replay chart's own options (magnet, replay speed, risk, where the bars sit…).
 *
 * Shared by the app and the API server, which keeps only what passes these checks.
 */

/** A drawing tool's style for new drawings (chart/drawings DrawingProps). */
export interface DrawDefault {
  color: string;
  width: number;
  style: Record<string, unknown>;
  levels?: unknown[];
  levels2?: unknown[];
  levels3?: unknown[];
}

/** An indicator's settings saved as default (chart/indicators IndicatorConfig; a Pine script's: its inputs). */
export interface IndicatorDefault {
  params: Record<string, number | string>;
  colors: Record<string, string>;
  inputs?: Record<string, unknown>;
}

export type ChartEnginePref = 'auto' | 'lightweight';

export interface ChartPrefs {
  /** Drawings snap to the candles' open, high, low and close. */
  magnet?: boolean;
  /** The drawing tool stays selected after a drawing. */
  stay?: boolean;
  /** Every drawing locked (none can be moved). */
  lockAll?: boolean;
  /** Every drawing hidden. */
  hideAll?: boolean;
  /** Replay speed (an index into PlaybackBar SPEEDS). */
  speed?: number;
  /** Closed trades shown on the chart. */
  history?: boolean;
  /** Risk per order (% of the balance). */
  risk?: number;
  /** TradingView's chart when it is installed ('auto'), or always the built-in one. */
  engine?: ChartEnginePref;
  /** The floating favorites bar: where it sits (shares of the free room) and whether it is shown. */
  favBar?: { x: number; y: number; hidden: boolean };
  /** The floating replay bar's place over the chart (pixels from the top left; none: its own place). */
  playBar?: { x: number; y: number };
  /** The drawing toolbar: each group's last used tool. */
  groupTools?: Record<string, string>;
  /** The strategy tester: the script and the range picked last. */
  tester?: { scriptId?: string; from?: string; to?: string };
}

export const SPEED_COUNT = 8;
export const RISK_MIN = 0.1;
export const RISK_MAX = 10;

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const TYPE = /^[a-z0-9_]{1,40}$/;
const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const typeKey = (k: string) => TYPE.test(k) && !BAD_KEYS.has(k);
const num = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined);
const share = (v: unknown) => num(v, 0, 1);

/**
 * A copy of plain JSON (numbers, short strings, booleans, small arrays and objects, a few levels deep);
 * undefined when it is anything else.
 */
function plain(v: unknown, depth: number): unknown {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') return v.length <= 300 ? v : undefined;
  if (depth <= 0) return undefined;
  if (Array.isArray(v)) {
    if (v.length > 64) return undefined;
    const out: unknown[] = [];
    for (const x of v) {
      const c = plain(x, depth - 1);
      if (c === undefined) return undefined;
      out.push(c);
    }
    return out;
  }
  if (!isObj(v)) return undefined;
  const keys = Object.keys(v);
  if (keys.length > 80) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k.length > 40 || BAD_KEYS.has(k)) continue;
    const c = plain(v[k], depth - 1);
    if (c !== undefined) out[k] = c;
  }
  return out;
}

// ---------- TradingView settings ----------

/** Keys the library uses: printable, short. */
const TV_KEY = /^[\x21-\x7e][\x20-\x7e]{0,159}$/;
export const TV_SETTING_MAX = 100_000;
const TV_SETTINGS_TOTAL = 1_000_000;
const TV_SETTINGS_COUNT = 400;

/** Whether the library's setting can be kept (`favorites`: the keys kept in tvFavorites instead). */
export function tvSettingFits(key: string, value: string, favorites: ReadonlySet<string>): boolean {
  return TV_KEY.test(key) && !BAD_KEYS.has(key) && !favorites.has(key) && value.length <= TV_SETTING_MAX;
}

export function cleanTvSettings(v: unknown, favorites: ReadonlySet<string>): Record<string, string> | undefined {
  if (!isObj(v)) return undefined;
  const out: Record<string, string> = {};
  let total = 0;
  let count = 0;
  for (const [k, x] of Object.entries(v)) {
    if (typeof x !== 'string' || !tvSettingFits(k, x, favorites)) continue;
    if (count >= TV_SETTINGS_COUNT || total + k.length + x.length > TV_SETTINGS_TOTAL) break;
    out[k] = x;
    total += k.length + x.length;
    count++;
  }
  return out;
}

// ---------- built-in chart: drawing and indicator defaults ----------

const DRAW_DEFAULT_MAX = 20_000;
const DRAW_DEFAULTS_COUNT = 150;

export function cleanDrawDefault(v: unknown): DrawDefault | undefined {
  if (!isObj(v) || typeof v.color !== 'string' || v.color.length > 40) return undefined;
  const width = num(v.width, 0, 20);
  const style = plain(v.style ?? {}, 4);
  if (width === undefined || !isObj(style)) return undefined;
  const out: DrawDefault = { color: v.color, width, style };
  for (const k of ['levels', 'levels2', 'levels3'] as const) {
    if (v[k] === undefined) continue;
    const levels = plain(v[k], 3);
    if (!Array.isArray(levels)) return undefined;
    out[k] = levels;
  }
  return JSON.stringify(out).length <= DRAW_DEFAULT_MAX ? out : undefined;
}

export function cleanDrawDefaults(v: unknown): Record<string, DrawDefault> | undefined {
  if (!isObj(v)) return undefined;
  const out: Record<string, DrawDefault> = {};
  for (const [k, x] of Object.entries(v).slice(0, DRAW_DEFAULTS_COUNT)) {
    const d = typeKey(k) ? cleanDrawDefault(x) : undefined;
    if (d) out[k] = d;
  }
  return out;
}

export function cleanIndicatorDefault(v: unknown): IndicatorDefault | undefined {
  if (!isObj(v) || !isObj(v.params) || !isObj(v.colors)) return undefined;
  const params: Record<string, number | string> = {};
  const colors: Record<string, string> = {};
  for (const [k, x] of Object.entries(v.params).slice(0, 60)) {
    if (k.length > 40 || BAD_KEYS.has(k)) continue;
    if ((typeof x === 'number' && Number.isFinite(x)) || (typeof x === 'string' && x.length <= 60)) params[k] = x;
  }
  for (const [k, x] of Object.entries(v.colors).slice(0, 60)) if (k.length <= 40 && !BAD_KEYS.has(k) && typeof x === 'string' && x.length <= 40) colors[k] = x;
  const out: IndicatorDefault = { params, colors };
  if (v.inputs !== undefined) {
    const inputs = plain(v.inputs, 2);
    if (!isObj(inputs) || JSON.stringify(inputs).length > 20_000) return undefined;
    out.inputs = inputs;
  }
  return out;
}

export function cleanIndicatorDefaults(v: unknown): Record<string, IndicatorDefault> | undefined {
  if (!isObj(v)) return undefined;
  const out: Record<string, IndicatorDefault> = {};
  for (const [k, x] of Object.entries(v).slice(0, 100)) {
    const d = typeKey(k) ? cleanIndicatorDefault(x) : undefined;
    if (d) out[k] = d;
  }
  return out;
}

// ---------- the replay chart's options ----------

export function cleanChartPrefs(v: unknown): ChartPrefs | undefined {
  if (!isObj(v)) return undefined;
  const out: ChartPrefs = {};
  if (typeof v.magnet === 'boolean') out.magnet = v.magnet;
  if (typeof v.stay === 'boolean') out.stay = v.stay;
  if (typeof v.lockAll === 'boolean') out.lockAll = v.lockAll;
  if (typeof v.hideAll === 'boolean') out.hideAll = v.hideAll;
  if (typeof v.history === 'boolean') out.history = v.history;
  const speed = num(v.speed, 0, SPEED_COUNT - 1);
  if (speed !== undefined) out.speed = Math.round(speed);
  const risk = num(v.risk, RISK_MIN, RISK_MAX);
  if (risk !== undefined) out.risk = Math.round(risk * 100) / 100;
  if (v.engine === 'auto' || v.engine === 'lightweight') out.engine = v.engine;
  if (isObj(v.favBar)) {
    const x = share(v.favBar.x),
      y = share(v.favBar.y);
    if (x !== undefined && y !== undefined) out.favBar = { x, y, hidden: v.favBar.hidden === true };
  }
  if (isObj(v.playBar)) {
    const x = num(v.playBar.x, 0, 20_000),
      y = num(v.playBar.y, 0, 20_000);
    if (x !== undefined && y !== undefined) out.playBar = { x: Math.round(x), y: Math.round(y) };
  }
  if (isObj(v.groupTools)) {
    const g: Record<string, string> = {};
    for (const [k, t] of Object.entries(v.groupTools).slice(0, 30)) if (typeKey(k) && typeof t === 'string' && typeKey(t)) g[k] = t;
    out.groupTools = g;
  }
  if (isObj(v.tester)) {
    const t: NonNullable<ChartPrefs['tester']> = {};
    if (typeof v.tester.scriptId === 'string' && ID.test(v.tester.scriptId)) t.scriptId = v.tester.scriptId;
    if (typeof v.tester.from === 'string' && DAY.test(v.tester.from)) t.from = v.tester.from;
    if (typeof v.tester.to === 'string' && DAY.test(v.tester.to)) t.to = v.tester.to;
    out.tester = t;
  }
  return out;
}
