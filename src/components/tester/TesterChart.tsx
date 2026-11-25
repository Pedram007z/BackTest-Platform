import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  LineType,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { resolveChartStyle, withOpacity } from '../../chart/style';
import { PALETTES } from '../../lib/palettes';
import { tzOffset } from '../../lib/timezone';
import type { PlotOut, ShapeOut } from '../../pine/core';
import type { RunOk } from '../../pine/run';
import { PineDrawings, drawModel, hideGapJoins, markerLook } from '../../chart/pineDraw';
import { useStore } from '../../store/useStore';

/**
 * The tester's chart: the range's candles with the script's plots (on the price chart, or in a pane
 * below for `overlay = false` scripts), plotshape / plotchar / label markers, background colours, and
 * the strategy's fills as arrows. Times follow the chart's time zone (daily bars keep their date).
 */

const MAX_MARKERS = 4000;

/** "#rrggbbaa" → "rgba()" (lightweight-charts reads both, but alpha in hex is safer as rgba). */
function css(c: string | null | undefined, fallback: string): string {
  if (!c || c[0] !== '#' || c.length < 7) return fallback;
  const r = parseInt(c.slice(1, 3), 16),
    g = parseInt(c.slice(3, 5), 16),
    b = parseInt(c.slice(5, 7), 16);
  const a = c.length >= 9 ? parseInt(c.slice(7, 9), 16) / 255 : 1;
  return `rgba(${r},${g},${b},${+a.toFixed(3)})`;
}

const shapeOf = (s: ShapeOut): SeriesMarker<Time>['shape'] => {
  if (/up/.test(s.style)) return 'arrowUp';
  if (/down/.test(s.style)) return 'arrowDown';
  if (s.style === 'square') return 'square';
  if (s.kind === 'arrow') return s.style === 'arrowup' ? 'arrowUp' : 'arrowDown';
  return 'circle';
};

export function TesterChart({ result, digits, showTrades, height = 440 }: { result: RunOk; digits: number; showTrades: boolean; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const theme = useStore((s) => s.theme);
  const overrides = useStore((s) => s.chartStyle);
  const tz = useStore((s) => s.chartTz);

  useEffect(() => {
    const host = el.current;
    if (!host) return;
    const pal = PALETTES[theme];
    const st = resolveChartStyle(theme, overrides);
    const { bars } = result;
    const n = bars.time.length;
    const daily = n > 1 && bars.time[1] - bars.time[0] >= 86_400_000 * 0.9;
    const shift = (ms: number) => Math.floor((daily ? ms : ms + tzOffset(ms, tz)) / 1000) as UTCTimestamp;
    const times: UTCTimestamp[] = Array.from(bars.time, shift);
    const step = n > 1 ? Math.max(1, Math.round((bars.time[n - 1] - bars.time[n - 2]) / 1000)) : 60;
    // a clock change can put two bars on one local time: keep the times rising
    for (let i = 1; i < n; i++) if (times[i] <= times[i - 1]) times[i] = (times[i - 1] + 1) as UTCTimestamp;

    const chart: IChartApi = createChart(host, {
      autoSize: true,
      layout: {
        background: st.bgType === 'gradient' ? { type: ColorType.VerticalGradient, topColor: st.bg, bottomColor: st.bg2 } : { type: ColorType.Solid, color: st.bg },
        textColor: st.textColor,
        fontSize: st.fontSize,
        fontFamily: 'Vazirmatn Variable, Vazirmatn, Tahoma, sans-serif',
        attributionLogo: false,
        panes: { separatorColor: pal.grid },
      },
      grid: {
        vertLines: { visible: st.vertGrid, color: withOpacity(st.gridColor, st.gridOpacity) },
        horzLines: { visible: st.horzGrid, color: withOpacity(st.gridColor, st.gridOpacity) },
      },
      rightPriceScale: { borderColor: pal.grid },
      timeScale: { borderColor: pal.grid, timeVisible: !daily, secondsVisible: false },
      crosshair: { vertLine: { color: st.crosshairColor, labelBackgroundColor: pal.accent }, horzLine: { color: st.crosshairColor, labelBackgroundColor: pal.accent } },
      localization: { locale: 'en-US', priceFormatter: (p: number) => p.toFixed(digits) },
    });

    const none = 'rgba(0,0,0,0)';
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: st.body ? st.upColor : none,
      downColor: st.body ? st.downColor : none,
      borderVisible: st.borders,
      borderUpColor: st.borderUpColor,
      borderDownColor: st.borderDownColor,
      wickVisible: st.wick,
      wickUpColor: st.wickUpColor,
      wickDownColor: st.wickDownColor,
      priceFormat: { type: 'price', precision: digits, minMove: 10 ** -digits },
    });
    candles.setData(
      times.map((time, i) => {
        const c = result.barcolors?.[i];
        const bar = { time, open: bars.open[i], high: bars.high[i], low: bars.low[i], close: bars.close[i] };
        return c ? { ...bar, color: css(c, ''), wickColor: css(c, ''), borderColor: css(c, '') } : bar;
      }),
    );

    // the script's pane: the price chart, or a pane under it
    const overlay = result.decl.overlay;
    const paneOf = (p: PlotOut) => (overlay || p.forceOverlay ? 0 : 1);
    const firstInPane = new Map<number, ISeriesApi<SeriesType>>();
    const plotOpts = { priceLineVisible: false, lastValueVisible: true, crosshairMarkerVisible: false };

    for (const p of result.plots) {
      if (!p.display) continue;
      const pane = paneOf(p);
      const color = css(p.color, pal.line);
      if (p.kind === 'hline') {
        const host = firstInPane.get(pane) ?? (pane === 0 ? candles : null);
        const v = p.values[0];
        if (host && v === v)
          host.createPriceLine({
            price: v,
            color,
            lineWidth: 1,
            lineStyle: p.style === 'solid' ? LineStyle.Solid : p.style === 'dotted' ? LineStyle.Dotted : LineStyle.Dashed,
            axisLabelVisible: false,
            title: p.title,
          });
        continue;
      }
      const style = p.style;
      // values moved by the plot's offset; bars without a value are gaps (or skipped, to join the line)
      const points = (gaps: boolean) => {
        const out: ({ time: UTCTimestamp; value: number; color?: string } | { time: UTCTimestamp })[] = [];
        // a positive offset carries the plot past the last candle
        for (let j = 0; j < n + Math.max(0, p.offset); j++) {
          const i = j - p.offset;
          const v = i >= 0 && i < n ? p.values[i] : NaN;
          const time = j < n ? times[j] : ((times[n - 1] + (j - n + 1) * step) as UTCTimestamp);
          if (v === v) out.push(p.colors ? { time, value: v, color: css(p.colors[i], none) } : { time, value: v });
          else if (gaps) out.push({ time });
        }
        if (gaps && style !== 'histogram' && style !== 'columns') hideGapJoins(out as never, style.startsWith('area') ? 'area' : style.startsWith('stepline') ? 'step' : 'line');
        return out as never;
      };
      let s: ISeriesApi<SeriesType>;
      if (style === 'histogram' || style === 'columns') {
        s = chart.addSeries(HistogramSeries, { ...plotOpts, color, base: 0 }, pane);
        s.setData(points(true));
      } else if (style === 'area' || style === 'areabr') {
        s = chart.addSeries(
          AreaSeries,
          {
            ...plotOpts,
            lineColor: color,
            topColor: color.replace(/[\d.]+\)$/, '0.35)'),
            bottomColor: color.replace(/[\d.]+\)$/, '0.02)'),
            lineWidth: Math.min(4, p.linewidth) as 1,
          },
          pane,
        );
        s.setData(points(style === 'areabr'));
      } else {
        const dots = style === 'circles' || style === 'cross';
        const step = style.startsWith('stepline');
        s = chart.addSeries(
          LineSeries,
          {
            ...plotOpts,
            color,
            lineWidth: Math.min(4, p.linewidth) as 1,
            lineVisible: !dots,
            pointMarkersVisible: dots,
            pointMarkersRadius: dots ? 1.5 + p.linewidth / 2 : undefined,
            lineType: step ? LineType.WithSteps : LineType.Simple,
          },
          pane,
        );
        // plot.style_line joins across na values; linebr and steplinebr leave gaps
        s.setData(points(style.endsWith('br') || dots));
      }
      if (!firstInPane.has(pane)) firstInPane.set(pane, s);
    }

    // fills, lines and boxes: on the candles (overlay) or the script's first series in its pane
    if (result.fills.length || result.lines.length || result.boxes.length) {
      const on = overlay ? candles : (firstInPane.get(1) ?? candles);
      const draw = new PineDrawings();
      on.attachPrimitive(draw);
      draw.set(drawModel(result, 0));
    }

    // background colours: full-height columns behind the pane's own series
    if (result.bgcolors) {
      const bgPane = overlay ? 0 : firstInPane.has(1) ? 1 : 0;
      const bg = chart.addSeries(HistogramSeries, { priceScaleId: 'pine-bg', priceLineVisible: false, lastValueVisible: false, base: 0 }, bgPane);
      bg.priceScale().applyOptions({ scaleMargins: { top: 0, bottom: 0 }, visible: false });
      bg.setData(times.map((time, i) => (result.bgcolors![i] ? { time, value: 1, color: css(result.bgcolors![i], none) } : { time })));
      bg.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 1 } }) });
    }
    const lower = chart.panes()[1];
    if (lower) lower.setHeight(Math.round(height * 0.32));

    // markers: the script's shapes and labels, then the strategy's fills
    const markers: SeriesMarker<Time>[] = [];
    for (const s of result.shapes) {
      if (s.bar < 0 || s.bar >= n) continue;
      const look = markerLook(s);
      const color = css(look.color, pal.accent);
      const text = s.kind === 'char' ? s.style + (s.text ? ` ${s.text}` : '') : s.text;
      if (s.location === 'absolute' && s.price !== undefined && s.price === s.price)
        markers.push({ time: times[s.bar], position: 'atPriceMiddle', price: s.price, shape: shapeOf(s), color, text: text || undefined, size: look.size });
      else {
        const below = s.location === 'belowbar' || s.location === 'bottom';
        markers.push({
          time: times[s.bar],
          position: below ? 'belowBar' : 'aboveBar',
          shape: shapeOf(s),
          color,
          text: text || undefined,
          size: look.size ?? (s.size === 'tiny' ? 0.6 : s.size === 'small' ? 0.8 : 1),
        });
      }
    }
    if (showTrades && result.strategy) {
      for (const f of result.strategy.fills.slice(-MAX_MARKERS)) {
        if (f.bar < 0 || f.bar >= n) continue;
        const buy = f.side > 0;
        markers.push({
          time: times[f.bar],
          position: buy ? 'belowBar' : 'aboveBar',
          shape: buy ? 'arrowUp' : 'arrowDown',
          color: buy ? pal.gain : pal.loss,
          text: f.comment || f.id,
        });
      }
    }
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    if (markers.length) createSeriesMarkers(candles, markers.slice(-MAX_MARKERS));

    // the last part of the range, as a chart opens on TradingView
    const span = Math.min(n, 220);
    if (n) chart.timeScale().setVisibleLogicalRange({ from: n - span, to: n + 3 });
    return () => chart.remove();
  }, [result, theme, overrides, tz, digits, showTrades, height]);

  return <div ref={el} className="chart-ltr w-full" style={{ height }} dir="ltr" />;
}
