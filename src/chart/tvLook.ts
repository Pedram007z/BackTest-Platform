import { FONT_SIZES, cleanChartStyle, defaultChartStyle, type ChartStyle, type ChartStyleOverrides } from './style';

/**
 * The TradingView chart's own settings dialog changes the candles, background, grid, scales and
 * crosshair of a chart. Those changes are copied back into the user's chart colours (useStore.chartStyle,
 * kept on the server) so they stay after signing out and in, on every pane and device, and on the
 * built-in chart too; otherwise the user's colours, applied when a chart opens, would put them back.
 *
 * The colours are read from the chart's saved layout (widget.save()): its main series' `candleStyle`
 * and the chart's `chartProperties`.
 */

type Any = any;

/** A CSS colour as `#rrggbb` and its opacity (0–1); null when it is not one the library writes. */
export function parseColor(c: unknown): { hex: string; alpha: number } | null {
  if (typeof c !== 'string') return null;
  const s = c.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) return { hex: `#${[...m[1]].map((x) => x + x).join('')}`, alpha: 1 };
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
  if (m) return { hex: `#${m[1]}`, alpha: m[2] ? parseInt(m[2], 16) / 255 : 1 };
  m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+%?)\s*)?\)$/.exec(s);
  if (!m) return null;
  const ch = [m[1], m[2], m[3]].map((x) => Math.min(255, Number(x)));
  let alpha = 1;
  if (m[4] !== undefined) alpha = m[4].endsWith('%') ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
  if (!Number.isFinite(alpha)) return null;
  return { hex: `#${ch.map((x) => x.toString(16).padStart(2, '0')).join('')}`, alpha: Math.max(0, Math.min(1, alpha)) };
}

const isObj = (v: unknown): v is Record<string, Any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The first chart of a saved layout: its main series' candle style and its chart properties. */
function partsOf(layout: unknown): { candle?: Record<string, Any>; props?: Record<string, Any> } {
  if (!isObj(layout)) return {};
  const chart = Array.isArray(layout.charts) ? layout.charts[0] : layout;
  if (!isObj(chart)) return {};
  let candle: Record<string, Any> | undefined;
  for (const pane of Array.isArray(chart.panes) ? chart.panes : []) {
    for (const src of Array.isArray(pane?.sources) ? pane.sources : []) {
      if (src?.type === 'MainSeries' && isObj(src.state?.candleStyle)) candle = src.state.candleStyle;
    }
  }
  return { candle, props: isObj(chart.chartProperties) ? chart.chartProperties : undefined };
}

/** What the layout shows, as chart colours (only the fields it has). */
export function lookOfLayout(layout: unknown): ChartStyleOverrides {
  const { candle, props } = partsOf(layout);
  const out: ChartStyleOverrides = {};
  const hex = (v: unknown) => parseColor(v)?.hex;
  if (candle) {
    if (typeof candle.drawBody === 'boolean') out.body = candle.drawBody;
    if (typeof candle.drawBorder === 'boolean') out.borders = candle.drawBorder;
    if (typeof candle.drawWick === 'boolean') out.wick = candle.drawWick;
    for (const k of ['upColor', 'downColor', 'borderUpColor', 'borderDownColor', 'wickUpColor', 'wickDownColor'] as const) {
      const c = hex(candle[k]);
      if (c) out[k] = c;
    }
  }
  const pane = props?.paneProperties;
  if (isObj(pane)) {
    const gradient = pane.backgroundType === 'gradient';
    if (pane.backgroundType === 'solid' || gradient) out.bgType = gradient ? 'gradient' : 'solid';
    const bg = hex(gradient ? pane.backgroundGradientStartColor : pane.background);
    if (bg) out.bg = bg;
    if (gradient) {
      const bg2 = hex(pane.backgroundGradientEndColor);
      if (bg2) out.bg2 = bg2;
    }
    const vert = parseColor(pane.vertGridProperties?.color);
    const horz = parseColor(pane.horzGridProperties?.color);
    if (vert) out.vertGrid = vert.alpha > 0;
    if (horz) out.horzGrid = horz.alpha > 0;
    const shown = vert && vert.alpha > 0 ? vert : horz && horz.alpha > 0 ? horz : null;
    if (shown) {
      out.gridColor = shown.hex;
      out.gridOpacity = Math.round(shown.alpha * 100);
    }
    const cross = hex(pane.crossHairProperties?.color);
    if (cross) out.crosshairColor = cross;
  }
  const scales = props?.scalesProperties;
  if (isObj(scales)) {
    const text = hex(scales.textColor);
    if (text) out.textColor = text;
    if (typeof scales.fontSize === 'number' && FONT_SIZES.includes(scales.fontSize)) out.fontSize = scales.fontSize;
  }
  return out;
}

/** The fields of `seen` that differ from what was applied (opacity within a point is the same). */
export function lookChanges(applied: ChartStyle, seen: ChartStyleOverrides): ChartStyleOverrides {
  const out: ChartStyleOverrides = {};
  for (const k of Object.keys(seen) as (keyof ChartStyle)[]) {
    const v = seen[k];
    const a = applied[k];
    if (v === undefined) continue;
    if (k === 'gridOpacity') {
      if (Math.abs((v as number) - (a as number)) > 1) out.gridOpacity = v as number;
    } else if (typeof v === 'string' ? v.toLowerCase() !== String(a).toLowerCase() : v !== a) (out as Any)[k] = v;
  }
  // grid colour and opacity mean nothing while both grids are off
  if (seen.vertGrid === false && seen.horzGrid === false) {
    delete out.gridColor;
    delete out.gridOpacity;
  }
  // a solid background has no second colour
  if ((seen.bgType ?? applied.bgType) === 'solid') delete out.bg2;
  return out;
}

/** The user's chart colours with `changes` on top (fields back at the theme's value are dropped). */
export function withLookChanges(theme: 'dark' | 'light', overrides: ChartStyleOverrides, changes: ChartStyleOverrides): ChartStyleOverrides {
  const base = defaultChartStyle(theme);
  const next: ChartStyleOverrides = { ...overrides };
  for (const k of Object.keys(changes) as (keyof ChartStyle)[]) {
    const v = changes[k];
    if (v === base[k] || (typeof v === 'string' && v.toLowerCase() === String(base[k]).toLowerCase())) delete next[k];
    else (next as Any)[k] = v;
  }
  return cleanChartStyle(next) ?? {};
}
