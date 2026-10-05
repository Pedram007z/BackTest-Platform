import { DATA_START, SYMBOL_MAP, TF_MS, TIMEFRAMES, candlesBetween, getCandles, tfFromTv, type SymbolInfo, type Timeframe } from '../lib/market';
import { DAY_MS, keyToMs } from '../lib/calendar';
import { newsTitleFa, type NewsEvent } from '../lib/news';
import { hasServer } from '../services/api';
import { ensureRange } from '../services/marketFeed';

/**
 * TradingView JS-API datafeed for a replay: bars never go past the replay cursor, new bars are
 * pushed through `subscribeBars` as the cursor moves, and past calendar events become
 * time-scale marks.
 */

export interface ReplayFeedSource {
  cursor: () => number;
  /** Past events for the marks (already filtered by the user's calendar settings). */
  news: () => NewsEvent[];
  /** Symbols the symbol search offers (the session's symbols). */
  symbols: () => string[];
}

const RESOLUTIONS = TIMEFRAMES.map((t) => t.tv);
const START_MS = keyToMs(DATA_START);

const tvType = (s: SymbolInfo) => (s.group === 'forex' ? 'forex' : s.group === 'crypto' ? 'crypto' : s.group === 'index' ? 'index' : 'commodity');

export function symbolInfoFor(s: SymbolInfo) {
  return {
    name: s.id,
    ticker: s.id,
    full_name: s.id,
    description: s.description,
    type: tvType(s),
    session: s.weekends ? '24x7' : '0000-0000:23456',
    exchange: 'BacktestLab',
    listed_exchange: 'BacktestLab',
    timezone: 'Etc/UTC',
    format: 'price',
    pricescale: 10 ** s.digits,
    minmov: 1,
    has_intraday: true,
    intraday_multipliers: ['5', '15', '30', '60', '240'],
    has_daily: true,
    daily_multipliers: ['1'],
    has_weekly_and_monthly: false,
    supported_resolutions: RESOLUTIONS,
    volume_precision: 0,
    data_status: 'streaming',
    visible_plots_set: 'ohlc',
    currency_code: s.quote,
  };
}

const IMPACT_COLOR: Record<string, string> = { high: '#f25466', medium: '#f5a524', low: '#e8d44d', holiday: '#9b9bb0' };

interface Sub {
  symbol: string;
  tf: Timeframe;
  onTick: (bar: any) => void;
  onReset: () => void;
  lastSec: number;
}

export function createReplayDatafeed(src: ReplayFeedSource) {
  const subs = new Map<string, Sub>();
  /** newest bar time (sec) handed to the chart, per symbol:timeframe */
  const delivered = new Map<string, number>();

  const toBar = (c: { time: number; open: number; high: number; low: number; close: number }) => ({ time: c.time * 1000, open: c.open, high: c.high, low: c.low, close: c.close });

  const datafeed = {
    onReady(cb: (cfg: any) => void) {
      setTimeout(() =>
        cb({
          supported_resolutions: RESOLUTIONS,
          supports_marks: false,
          supports_timescale_marks: true,
          supports_time: true,
          exchanges: [{ value: 'BacktestLab', name: 'BacktestLab', desc: 'BacktestLab' }],
          symbols_types: [
            { name: 'Forex', value: 'forex' },
            { name: 'Index', value: 'index' },
            { name: 'Commodity', value: 'commodity' },
            { name: 'Crypto', value: 'crypto' },
          ],
        }),
      );
    },

    searchSymbols(input: string, _exchange: string, type: string, onResult: (r: any[]) => void) {
      const q = input.trim().toUpperCase();
      onResult(
        src
          .symbols()
          .map((id) => SYMBOL_MAP[id])
          .filter((s): s is SymbolInfo => !!s && (!q || s.id.includes(q) || s.description.toUpperCase().includes(q)) && (!type || tvType(s) === type))
          .map((s) => ({ symbol: s.id, full_name: s.id, description: s.description, exchange: 'BacktestLab', ticker: s.id, type: tvType(s) })),
      );
    },

    resolveSymbol(name: string, onResolve: (info: any) => void, onError: (reason: string) => void) {
      const id = name.includes(':') ? name.split(':').pop()! : name;
      const s = SYMBOL_MAP[id];
      setTimeout(() => (s ? onResolve(symbolInfoFor(s)) : onError('unknown_symbol')));
    },

    getBars(
      symbolInfo: any,
      resolution: string,
      period: { from: number; to: number; countBack: number; firstDataRequest: boolean },
      onResult: (bars: any[], meta: { noData: boolean }) => void,
    ) {
      const tf = tfFromTv(resolution);
      const cursor = src.cursor();
      const toMs = Math.min(period.to * 1000, cursor);
      const answer = () => {
        let candles = candlesBetween(symbolInfo.name, tf, period.from * 1000, period.to * 1000, cursor);
        if (candles.length < period.countBack && toMs > START_MS) {
          // reach further back over weekends and holidays so the chart gets the bars it asked for
          candles = getCandles(symbolInfo.name, tf, toMs, period.countBack).filter((c) => c.time * 1000 < period.to * 1000);
        }
        const key = `${symbolInfo.name}:${tf}`;
        const last = candles[candles.length - 1];
        if (last && last.time > (delivered.get(key) ?? 0)) delivered.set(key, last.time);
        onResult(candles.map(toBar), { noData: candles.length === 0 });
      };
      if (!hasServer) {
        setTimeout(answer);
        return;
      }
      // real data: load the requested range (with room for weekends) before answering
      const fromMs = Math.min(period.from * 1000, toMs - period.countBack * TF_MS[tf] * 1.45);
      void ensureRange([symbolInfo.name], Math.max(START_MS, fromMs - DAY_MS), toMs).finally(answer);
    },

    subscribeBars(symbolInfo: any, resolution: string, onTick: (bar: any) => void, guid: string, onReset: () => void) {
      const tf = tfFromTv(resolution);
      subs.set(guid, { symbol: symbolInfo.name, tf, onTick, onReset, lastSec: delivered.get(`${symbolInfo.name}:${tf}`) ?? 0 });
    },

    unsubscribeBars(guid: string) {
      subs.delete(guid);
    },

    getTimescaleMarks(symbolInfo: any, from: number, to: number, onData: (marks: any[]) => void, resolution: string) {
      const step = TF_MS[tfFromTv(resolution)];
      const cursor = src.cursor();
      const byBar = new Map<number, NewsEvent[]>();
      for (const e of src.news()) {
        if (e.time > cursor || e.time < from * 1000 || e.time > to * 1000) continue;
        const b = Math.floor(e.time / step) * step;
        if (!byBar.has(b)) byBar.set(b, []);
        byBar.get(b)!.push(e);
      }
      const order = ['high', 'medium', 'low', 'holiday'];
      const marks = [...byBar.entries()].map(([b, list]) => {
        list.sort((a, c) => order.indexOf(a.impact) - order.indexOf(c.impact));
        return {
          id: `${symbolInfo.name}:${b}`,
          time: b / 1000,
          color: IMPACT_COLOR[list[0].impact],
          label: list[0].currency.slice(0, 1),
          tooltip: list.map((e) => `${e.currency} · ${newsTitleFa(e.title)}${e.actual ? `  A:${e.actual} F:${e.forecast ?? '—'} P:${e.previous ?? '—'}` : ''}`),
          shape: 'circle',
        };
      });
      setTimeout(() => onData(marks));
    },

    getServerTime(cb: (t: number) => void) {
      cb(Math.floor(src.cursor() / 1000));
    },
  };

  /** Send the bars that formed since the last push. Returns false when a full reload is needed. */
  function push(): boolean {
    const cursor = src.cursor();
    let ok = true;
    for (const sub of subs.values()) {
      const tfSec = TF_MS[sub.tf] / 1000;
      const gapBars = Math.ceil((cursor / 1000 - sub.lastSec) / tfSec);
      if (sub.lastSec && cursor / 1000 < sub.lastSec) {
        ok = false;
        continue;
      }
      if (gapBars > 600) {
        ok = false;
        continue;
      }
      const recent = getCandles(sub.symbol, sub.tf, cursor, Math.max(2, gapBars + 2));
      for (const c of recent) {
        if (c.time < sub.lastSec) continue;
        sub.onTick(toBar(c));
        sub.lastSec = c.time;
      }
      delivered.set(`${sub.symbol}:${sub.tf}`, sub.lastSec);
    }
    return ok;
  }

  function resetAll() {
    delivered.clear();
    for (const sub of subs.values()) {
      sub.lastSec = 0;
      sub.onReset();
    }
  }

  return { datafeed, push, resetAll };
}
