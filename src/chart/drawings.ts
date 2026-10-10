import type { IndicatorConfig } from './indicators';
import { layoutSaved } from '../services/layoutSync';

/**
 * Drawings on the built-in chart. Points are (bar time in UTC seconds, price), so a drawing stays
 * on the same candles when the chart scrolls, zooms or changes timeframe.
 */

export type DrawingType = 'trend' | 'ray' | 'hline' | 'hray' | 'vline' | 'channel' | 'rect' | 'fib' | 'long' | 'short' | 'measure' | 'text';
export type ToolId = 'cursor' | DrawingType;

export interface Point {
  time: number;
  price: number;
}

export interface Drawing {
  id: string;
  type: DrawingType;
  /**
   * trend, ray, rect, fib, measure: start and end · hline, hray, vline, text: one point ·
   * channel: two points of the first line and one on the parallel line ·
   * long, short: entry (time, price) and the right edge (time)
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
}

/** How many clicks each tool takes. */
export const TOOL_POINTS: Record<DrawingType, number> = {
  trend: 2,
  ray: 2,
  hline: 1,
  hray: 1,
  vline: 1,
  channel: 3,
  rect: 2,
  fib: 2,
  long: 1,
  short: 1,
  measure: 2,
  text: 1,
};

export interface ToolInfo {
  id: DrawingType;
  name: string;
  hint: string;
}

export const TOOLS: Record<DrawingType, ToolInfo> = {
  trend: { id: 'trend', name: 'خط روند', hint: 'Trend line · دو کلیک' },
  ray: { id: 'ray', name: 'پرتو', hint: 'Ray · خطی که به سمت راست ادامه دارد' },
  hline: { id: 'hline', name: 'خط افقی', hint: 'Horizontal line' },
  hray: { id: 'hray', name: 'پرتو افقی', hint: 'Horizontal ray' },
  vline: { id: 'vline', name: 'خط عمودی', hint: 'Vertical line' },
  channel: { id: 'channel', name: 'کانال موازی', hint: 'Parallel channel · سه کلیک' },
  rect: { id: 'rect', name: 'مستطیل', hint: 'Rectangle' },
  fib: { id: 'fib', name: 'فیبوناچی اصلاحی', hint: 'Fib retracement' },
  long: { id: 'long', name: 'پوزیشن خرید', hint: 'Long position · ورود، حد ضرر و حد سود' },
  short: { id: 'short', name: 'پوزیشن فروش', hint: 'Short position · ورود، حد ضرر و حد سود' },
  measure: { id: 'measure', name: 'اندازه‌گیری', hint: 'Price range · تغییر قیمت، پیپ و تعداد کندل' },
  text: { id: 'text', name: 'متن', hint: 'Text' },
};

/** The toolbar's groups, top to bottom (a group opens a flyout when it has more than one tool). */
export const TOOL_GROUPS: { id: string; name: string; tools: DrawingType[] }[] = [
  { id: 'lines', name: 'خطوط', tools: ['trend', 'ray', 'hline', 'hray', 'vline'] },
  { id: 'channels', name: 'کانال‌ها', tools: ['channel'] },
  { id: 'fib', name: 'فیبوناچی', tools: ['fib'] },
  { id: 'shapes', name: 'اشکال', tools: ['rect'] },
  { id: 'positions', name: 'پوزیشن', tools: ['long', 'short'] },
  { id: 'measure', name: 'اندازه‌گیری', tools: ['measure'] },
  { id: 'text', name: 'متن', tools: ['text'] },
];

export const DRAWING_COLORS = ['#2962ff', '#f23645', '#089981', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#787b86'];

export const DEFAULT_COLOR: Record<DrawingType, string> = {
  trend: '#2962ff',
  ray: '#2962ff',
  hline: '#2962ff',
  hray: '#2962ff',
  vline: '#2962ff',
  channel: '#2962ff',
  rect: '#9c27b0',
  fib: '#787b86',
  long: '#089981',
  short: '#f23645',
  measure: '#2962ff',
  text: '#2962ff',
};

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
