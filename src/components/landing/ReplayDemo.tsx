import clsx from 'clsx';
import { Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChartTheme } from '../../hooks/useChartTheme';
import { fmtMarketTime } from '../../lib/calendar';
import { fmtR, fmtUsd } from '../../lib/format';
import { getCandles, type Candle } from '../../lib/market';

const SYMBOL = 'EURUSD';
const TOTAL = 170;
const START_VISIBLE = 96;
const WINDOW = 72;
const RISK_USD = 100;

interface DemoTrade {
  index: number;
  entry: number;
  sl: number;
  tp: number;
  /** candle index where TP or SL was hit */
  exitIndex: number;
  win: boolean;
}

/** Find a long trade in the sample whose outcome lands inside the animation. */
function planTrade(c: Candle[]): DemoTrade | null {
  for (let i = START_VISIBLE + 4; i < TOTAL - 30; i++) {
    const entry = c[i].close;
    const risk = 0.0011;
    const sl = entry - risk;
    const tp = entry + risk * 2;
    for (let j = i + 1; j < Math.min(TOTAL, i + 45); j++) {
      if (c[j].low <= sl) break;
      if (c[j].high >= tp) return { index: i, entry, sl, tp, exitIndex: j, win: true };
    }
  }
  return null;
}

/** Self-playing candle-by-candle replay used in the landing hero. Always left-to-right. */
export function ReplayDemo() {
  const p = useChartTheme();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const candles = useMemo(() => getCandles(SYMBOL, '15m', Date.UTC(2023, 4, 3, 22), TOTAL), []);
  const trade = useMemo(() => planTrade(candles), [candles]);
  const [n, setN] = useState(() => (reduced && trade ? Math.min(TOTAL, trade.exitIndex + 3) : START_VISIBLE));
  const [playing, setPlaying] = useState(!reduced);
  const [size, setSize] = useState({ w: 600, h: 320 });

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setN((v) => (v >= TOTAL ? START_VISIBLE : v + 1)), 420);
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const open = trade && n > trade.index;
  const closed = trade && n > trade.exitIndex;
  const last = candles[n - 1];
  const livePrice = closed ? (trade!.win ? trade!.tp : trade!.sl) : last.close;
  const r = trade && open ? (livePrice - trade.entry) / (trade.entry - trade.sl) : 0;

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = size;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const axisW = 58;
    const plotW = w - axisW;
    const from = Math.max(0, n - WINDOW);
    const view = candles.slice(from, n);
    let hi = Math.max(...view.map((c) => c.high));
    let lo = Math.min(...view.map((c) => c.low));
    if (open && trade) {
      hi = Math.max(hi, trade.tp);
      lo = Math.min(lo, trade.sl);
    }
    const pad = (hi - lo) * 0.12;
    hi += pad;
    lo -= pad;
    const y = (v: number) => 10 + ((hi - v) / (hi - lo)) * (h - 30);
    const step = plotW / (WINDOW + 6);
    const bodyW = Math.max(2, step * 0.62);

    // grid + price axis
    ctx.font = '10px Vazirmatn, Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) * i) / 4;
      const yy = y(v);
      ctx.strokeStyle = p.grid;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(plotW, yy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.axis;
      ctx.fillText(v.toFixed(5), plotW + 6, yy);
    }

    // trade zone
    if (open && trade) {
      const x0 = (trade.index - from) * step + step / 2;
      const x1 = closed ? (trade.exitIndex - from) * step + step / 2 : plotW;
      const zone = (top: number, bottom: number, color: string) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.13;
        ctx.fillRect(Math.max(0, x0), y(top), x1 - Math.max(0, x0), y(bottom) - y(top));
        ctx.globalAlpha = 1;
      };
      zone(trade.tp, trade.entry, p.gain);
      zone(trade.entry, trade.sl, p.loss);
      const line = (v: number, color: string, label: string) => {
        ctx.strokeStyle = color;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(Math.max(0, x0), y(v));
        ctx.lineTo(plotW, y(v));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        const tw = 44;
        ctx.fillRect(plotW + 2, y(v) - 8, tw, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, plotW + 7, y(v));
      };
      line(trade.tp, p.gain, 'TP');
      line(trade.sl, p.loss, 'SL');
      line(trade.entry, p.axis, 'BUY');
    }

    // candles
    view.forEach((c, i) => {
      const x = i * step + step / 2;
      const up = c.close >= c.open;
      ctx.strokeStyle = ctx.fillStyle = up ? p.gain : p.loss;
      ctx.beginPath();
      ctx.moveTo(x, y(c.high));
      ctx.lineTo(x, y(c.low));
      ctx.stroke();
      const top = y(Math.max(c.open, c.close));
      ctx.fillRect(x - bodyW / 2, top, bodyW, Math.max(1, y(Math.min(c.open, c.close)) - top));
    });

    // replay cursor
    const cx = (view.length - 0.5) * step + step / 2;
    ctx.strokeStyle = p.blue;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx, h - 16);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [n, size, p, candles, trade, open, closed]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-line/70 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white"
          aria-label={playing ? 'توقف نمایش' : 'پخش نمایش'}
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="-translate-x-[1px]" />}
        </button>
        <span className="text-sm font-bold" dir="ltr">
          EURUSD
        </span>
        <span className="rounded bg-raised px-1.5 py-0.5 text-[11px] font-semibold text-muted">۱۵ دقیقه</span>
        <span className="num ms-auto hidden text-[11px] text-faint sm:inline">زمان بازار: {fmtMarketTime(last.time * 1000 + 15 * 60_000)}</span>
      </div>

      <div ref={wrap} className="chart-ltr relative h-[260px] sm:h-[320px]">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label="نمایش بازپخش کندل به کندل EURUSD" role="img" />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/70 px-4 py-3 text-xs">
        {!open ? (
          <span className="text-muted">در حال پخش… منتظر ستاپ ورود</span>
        ) : (
          <>
            <span className="rounded bg-gain/15 px-1.5 py-0.5 font-bold text-gain">خرید</span>
            <span className="text-muted">
              ریسک ۱٪ • RR <span className="num">۲</span>
            </span>
            <span className={clsx('num font-bold', r >= 0 ? 'text-gain' : 'text-loss')}>
              {fmtR(r)} ({fmtUsd(r * RISK_USD, 2, true)})
            </span>
            {closed && <span className="ms-auto rounded-full bg-gain/15 px-2.5 py-0.5 font-semibold text-gain">{trade!.win ? 'حد سود فعال شد' : 'حد ضرر فعال شد'}</span>}
          </>
        )}
      </div>
    </div>
  );
}
