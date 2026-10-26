import { PALETTES } from '../lib/palettes';

/**
 * The chart's look, set by the user in «تنظیمات چارت» (like TradingView's chart settings): candles and
 * the canvas. Only the fields the user changed are stored; the rest follow the app's light or dark theme.
 * Both chart engines apply it (lwEngine directly, tvEngine through the library's overrides).
 */
export interface ChartStyle {
  /** candle bodies */
  body: boolean;
  upColor: string;
  downColor: string;
  /** candle borders */
  borders: boolean;
  borderUpColor: string;
  borderDownColor: string;
  /** candle wicks */
  wick: boolean;
  wickUpColor: string;
  wickDownColor: string;
  /** background: one colour, or a gradient from `bg` (top) to `bg2` (bottom) */
  bgType: 'solid' | 'gradient';
  bg: string;
  bg2: string;
  vertGrid: boolean;
  horzGrid: boolean;
  gridColor: string;
  /** 0–100 */
  gridOpacity: number;
  /** price and time scale labels */
  textColor: string;
  fontSize: number;
  crosshairColor: string;
}

export type ChartStyleOverrides = Partial<ChartStyle>;

export const FONT_SIZES = [10, 11, 12, 13, 14, 16];

export function defaultChartStyle(theme: 'dark' | 'light'): ChartStyle {
  const p = PALETTES[theme];
  return {
    body: true,
    upColor: p.candleUp,
    downColor: p.candleDown,
    borders: true,
    borderUpColor: p.candleUp,
    borderDownColor: p.candleDown,
    wick: true,
    wickUpColor: p.candleUp,
    wickDownColor: p.candleDown,
    bgType: 'solid',
    bg: p.bg,
    bg2: p.bg,
    vertGrid: true,
    horzGrid: true,
    gridColor: p.grid,
    gridOpacity: 44,
    textColor: p.axis,
    fontSize: 11,
    crosshairColor: theme === 'dark' ? '#8f88a8' : '#7a7393',
  };
}

export function resolveChartStyle(theme: 'dark' | 'light', overrides: ChartStyleOverrides | undefined): ChartStyle {
  return { ...defaultChartStyle(theme), ...(overrides ?? {}) };
}

/** `#rrggbb` with an opacity (0–100) as `rgba()`. */
export function withOpacity(hex: string, opacity: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(100, opacity)) / 100})`;
}

/** Whether a colour is light (dark text reads better on it). */
export function isLightColor(c: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(c);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

// ---------- kept in the user's settings (and checked on the server) ----------
const COLOR = /^#[0-9a-f]{6}$/i;
const COLOR_KEYS = [
  'upColor',
  'downColor',
  'borderUpColor',
  'borderDownColor',
  'wickUpColor',
  'wickDownColor',
  'bg',
  'bg2',
  'gridColor',
  'textColor',
  'crosshairColor',
] as const satisfies readonly (keyof ChartStyle)[];
const BOOL_KEYS = ['body', 'borders', 'wick', 'vertGrid', 'horzGrid'] as const satisfies readonly (keyof ChartStyle)[];

/** Only known fields with valid values; undefined when nothing is left. */
export function cleanChartStyle(raw: unknown): ChartStyleOverrides | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const v = raw as Record<string, unknown>;
  const out: ChartStyleOverrides = {};
  for (const k of COLOR_KEYS) if (typeof v[k] === 'string' && COLOR.test(v[k] as string)) out[k] = (v[k] as string).toLowerCase();
  for (const k of BOOL_KEYS) if (typeof v[k] === 'boolean') out[k] = v[k] as boolean;
  if (v.bgType === 'solid' || v.bgType === 'gradient') out.bgType = v.bgType;
  if (typeof v.gridOpacity === 'number' && Number.isFinite(v.gridOpacity)) out.gridOpacity = Math.round(Math.max(0, Math.min(100, v.gridOpacity)));
  if (typeof v.fontSize === 'number' && FONT_SIZES.includes(v.fontSize)) out.fontSize = v.fontSize;
  return Object.keys(out).length ? out : undefined;
}

/** Ready-made looks, like TradingView's colour themes. Applying one replaces the user's changes. */
export const CHART_PRESETS: { id: string; name: string; style: ChartStyleOverrides }[] = [
  { id: 'default', name: 'پیش‌فرض بک‌تست‌لب', style: {} },
  {
    id: 'tv-dark',
    name: 'TradingView تیره',
    style: {
      upColor: '#089981',
      downColor: '#f23645',
      borderUpColor: '#089981',
      borderDownColor: '#f23645',
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
      bg: '#131722',
      bg2: '#131722',
      gridColor: '#2a2e39',
      gridOpacity: 100,
      textColor: '#b2b5be',
      crosshairColor: '#9598a1',
    },
  },
  {
    id: 'tv-light',
    name: 'TradingView روشن',
    style: {
      upColor: '#089981',
      downColor: '#f23645',
      borderUpColor: '#089981',
      borderDownColor: '#f23645',
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
      bg: '#ffffff',
      bg2: '#ffffff',
      gridColor: '#f0f3fa',
      gridOpacity: 100,
      textColor: '#131722',
      crosshairColor: '#9598a1',
    },
  },
  {
    id: 'classic',
    name: 'کلاسیک',
    style: {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    },
  },
  {
    id: 'mono',
    name: 'سیاه و سفید',
    style: {
      upColor: '#ffffff',
      downColor: '#000000',
      borderUpColor: '#000000',
      borderDownColor: '#000000',
      wickUpColor: '#000000',
      wickDownColor: '#000000',
      bg: '#ffffff',
      bg2: '#ffffff',
      gridColor: '#e0e3eb',
      gridOpacity: 100,
      textColor: '#131722',
      crosshairColor: '#787b86',
    },
  },
  {
    id: 'blue-orange',
    name: 'آبی و نارنجی',
    style: {
      upColor: '#2962ff',
      downColor: '#ff9800',
      borderUpColor: '#2962ff',
      borderDownColor: '#ff9800',
      wickUpColor: '#2962ff',
      wickDownColor: '#ff9800',
    },
  },
  {
    id: 'night',
    name: 'آبی شب (گرادیان)',
    style: {
      bgType: 'gradient',
      bg: '#0b1530',
      bg2: '#03060f',
      gridColor: '#1f2b4d',
      gridOpacity: 70,
      textColor: '#9fb0d9',
      crosshairColor: '#6f82b8',
      upColor: '#22d3ee',
      downColor: '#f472b6',
      borderUpColor: '#22d3ee',
      borderDownColor: '#f472b6',
      wickUpColor: '#22d3ee',
      wickDownColor: '#f472b6',
    },
  },
];
