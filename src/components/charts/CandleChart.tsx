import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useChartTheme } from '../../hooks/useChartTheme';
import { SYMBOL_MAP, TF_MS, getCandles, type Timeframe } from '../../lib/market';
import type { Trade } from '../../lib/types';

const HISTORY = 320;

interface Props {
  symbol: string;
  timeframe: Timeframe;
  cursor: number;
  trades: Trade[];
}

/** Candlestick replay chart. Always left-to-right. */
export function CandleChart({ symbol, timeframe, cursor, trades }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const lastTime = useRef(0);
  const firstTime = useRef(0);
  const loadedKey = useRef('');
  const p = useChartTheme();

  // create once
  useEffect(() => {
    if (!el.current) return;
    const chart = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: 11 },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 8 },
      localization: { locale: 'en-US' },
    });
    const series = chart.addSeries(CandlestickSeries, { borderVisible: false });
    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
      linesRef.current = [];
      loadedKey.current = '';
    };
  }, []);

  // theme
  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor: p.axis },
      grid: { vertLines: { color: p.grid + '80' }, horzLines: { color: p.grid + '80' } },
      rightPriceScale: { borderColor: p.grid },
      timeScale: { borderColor: p.grid },
    });
    seriesRef.current?.applyOptions({ upColor: p.gain, downColor: p.loss, wickUpColor: p.gain, wickDownColor: p.loss });
  }, [p]);

  // data: full reload when symbol / timeframe changes or cursor jumps backwards, incremental otherwise
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    const info = SYMBOL_MAP[symbol];
    const key = `${symbol}:${timeframe}`;
    const tfSec = TF_MS[timeframe] / 1000;
    const jumpTooFar = cursor / 1000 - lastTime.current > tfSec * 50;

    if (loadedKey.current !== key || cursor / 1000 < lastTime.current || jumpTooFar) {
      const candles = getCandles(symbol, timeframe, cursor, HISTORY);
      series.applyOptions({
        priceFormat: { type: 'price', precision: info.digits, minMove: 1 / 10 ** info.digits },
      });
      series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
      lastTime.current = candles[candles.length - 1]?.time ?? 0;
      firstTime.current = candles[0]?.time ?? 0;
      if (loadedKey.current !== key) {
        const n = candles.length;
        chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 110), to: n + 6 });
      }
      loadedKey.current = key;
    } else {
      const recent = getCandles(symbol, timeframe, cursor, 60);
      for (const c of recent) {
        if (c.time < lastTime.current) continue;
        series.update({ ...c, time: c.time as UTCTimestamp });
        lastTime.current = c.time;
      }
    }
  }, [symbol, timeframe, cursor]);

  // price lines + entry markers
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    for (const l of linesRef.current) series.removePriceLine(l);
    linesRef.current = [];

    const mine = trades.filter((t) => t.symbol === symbol);
    for (const t of mine.filter((x) => x.status === 'open')) {
      linesRef.current.push(
        series.createPriceLine({ price: t.entry, color: p.axis, lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: t.side === 'buy' ? 'BUY' : 'SELL' }),
        series.createPriceLine({ price: t.sl, color: p.loss, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'SL' }),
        series.createPriceLine({ price: t.tp, color: p.gain, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'TP' }),
      );
    }

    const tfMs = TF_MS[timeframe];
    const markers: SeriesMarker<Time>[] = [];
    for (const t of mine) {
      const time = (Math.floor(t.openTime / tfMs) * tfMs) / 1000;
      if (time < firstTime.current || t.openTime > cursor) continue;
      markers.push({
        time: time as UTCTimestamp,
        position: t.side === 'buy' ? 'belowBar' : 'aboveBar',
        shape: t.side === 'buy' ? 'arrowUp' : 'arrowDown',
        color: t.side === 'buy' ? p.gain : p.loss,
        size: 1,
      });
    }
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    markersRef.current?.setMarkers(markers);
  }, [trades, symbol, timeframe, cursor, p]);

  return <div ref={el} className="chart-ltr h-full w-full" />;
}
