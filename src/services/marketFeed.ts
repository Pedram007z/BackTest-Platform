import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { keyToMs, msToKey, DAY_MS } from '../lib/calendar';
import {
  BAR_MS,
  HOUR_MS,
  MIN_MS,
  SYMBOLS,
  TF_MS,
  bumpDataVersion,
  dayIndexOf,
  dayStartMs,
  getDataVersion,
  hasRemoteDay,
  hasRemoteMinutes,
  hasRemoteSeconds,
  hourIndexOf,
  hourStartMs,
  marketSource,
  onDataVersion,
  setRemoteDay,
  setRemoteMinutes,
  setRemoteSeconds,
  type Timeframe,
} from '../lib/market';
import { api, hasServer } from './api';
import { backend } from './index';
import type { SiteConfig } from './types';

/**
 * Real market data from the API server (Dukascopy / Binance, chosen per market by the admin).
 * 5-minute days are loaded into lib/market.ts with `setRemoteDay()` in 30-day chunks that callers
 * share; minute and second charts also load 1-minute days (3 per request) and 1-second hours
 * (3 per request) around the replay position. Charts redraw through the data version. Only the
 * demo build without a server uses generated prices.
 */

// With a server every symbol uses real data: a chart without it stays empty, it never shows generated prices.
if (hasServer) {
  marketSource.mode = 'remote';
  marketSource.remote = new Set(SYMBOLS.map((s) => s.id));
}

export const useSiteConfig = create<{ config: SiteConfig | null }>(() => ({ config: null }));

let configJob: Promise<void> | null = null;
/** Read the public site settings once (retried on the next call after a failure). */
export function loadSiteConfig(): Promise<void> {
  configJob ??= backend
    .siteConfig()
    .then((config) => {
      useSiteConfig.setState({ config });
    })
    .catch(() => {
      configJob = null;
    });
  return configJob;
}

/** Symbols users may pick for a new session. */
export function useEnabledSymbols(): Set<string> | null {
  const ids = useSiteConfig((s) => s.config?.enabledSymbols);
  return ids && ids.length ? new Set(ids) : null;
}

// ---------- day loading ----------
const CHUNK = 30;
const RETRY_MS = 60_000;
const chunks = new Map<string, Promise<void>>();
const failed = new Map<string, { at: number; error: string }>();
const errorListeners = new Set<(message: string) => void>();

const usesServer = (symbol: string) => marketSource.mode === 'remote' && marketSource.remote.has(symbol);
const lastDayIdx = () => dayIndexOf(Date.now());
const failKey = (symbol: string, idx: number) => `${symbol}:${idx}`;
const recentlyFailed = (symbol: string, idx: number) => {
  const f = failed.get(failKey(symbol, idx));
  return !!f && Date.now() - f.at < RETRY_MS;
};

/** Called with a Persian message when a load fails. Returns an unsubscribe function. */
export function onMarketError(fn: (message: string) => void) {
  errorListeners.add(fn);
  return () => void errorListeners.delete(fn);
}

interface DaysReply {
  days: { day: string; bars?: (number | null)[] | null; error?: string }[];
}

function loadChunk(symbol: string, chunk: number): Promise<void> {
  const key = `${symbol}:${chunk}`;
  const running = chunks.get(key);
  if (running) return running;
  const first = chunk * CHUNK;
  const last = Math.min(first + CHUNK - 1, lastDayIdx());
  const job = api<DaysReply>(`/api/market/days?symbol=${encodeURIComponent(symbol)}&from=${msToKey(dayStartMs(first))}&to=${msToKey(dayStartMs(last))}`)
    .then((r) => {
      let errorText = '';
      for (const d of r.days) {
        const idx = dayIndexOf(keyToMs(d.day));
        if (d.error) {
          failed.set(failKey(symbol, idx), { at: Date.now(), error: d.error });
          errorText ||= d.error;
          continue;
        }
        failed.delete(failKey(symbol, idx));
        setRemoteDay(symbol, idx, d.bars ? Float64Array.from(d.bars, (v) => (v === null ? NaN : v)) : null);
      }
      if (errorText) errorListeners.forEach((f) => f(`داده‌ی ${symbol} کامل دریافت نشد: ${errorText}`));
    })
    .catch((e: Error) => {
      for (let i = first; i <= last; i++) if (!hasRemoteDay(symbol, i)) failed.set(failKey(symbol, i), { at: Date.now(), error: e.message });
      errorListeners.forEach((f) => f(`داده‌ی بازار ${symbol} دریافت نشد: ${e.message}`));
    })
    .finally(() => {
      chunks.delete(key);
      bumpDataVersion();
    });
  chunks.set(key, job);
  return job;
}

/** True when every day of [fromMs, toMs] is loaded for these symbols (or they do not use the server). */
export function rangeReady(symbols: string[], fromMs: number, toMs: number): boolean {
  const a = Math.max(0, dayIndexOf(fromMs));
  const b = Math.min(dayIndexOf(toMs), lastDayIdx());
  for (const s of symbols) {
    if (!usesServer(s)) continue;
    for (let i = a; i <= b; i++) if (!hasRemoteDay(s, i)) return false;
  }
  return true;
}

/** Load [fromMs, toMs] for the symbols. Resolves true when everything arrived. */
export async function ensureRange(symbols: string[], fromMs: number, toMs: number): Promise<boolean> {
  const a = Math.max(0, dayIndexOf(fromMs));
  const b = Math.min(dayIndexOf(toMs), lastDayIdx());
  const jobs: Promise<void>[] = [];
  for (const s of symbols) {
    if (!usesServer(s)) continue;
    for (let c = Math.floor(a / CHUNK); c <= Math.floor(b / CHUNK); c++) {
      let needed = false;
      for (let i = Math.max(a, c * CHUNK); i <= Math.min(b, c * CHUNK + CHUNK - 1) && !needed; i++) needed = !hasRemoteDay(s, i) && !recentlyFailed(s, i);
      if (needed) jobs.push(loadChunk(s, c));
    }
  }
  await Promise.all(jobs);
  return rangeReady(symbols, fromMs, toMs);
}

// ---------- 1-minute days and 1-second hours ----------
const MIN_CHUNK = 3;
const SEC_CHUNK = 3;
const lastHourIdx = () => hourIndexOf(Date.now());
const hourKey = (idx: number) => new Date(hourStartMs(idx)).toISOString().slice(0, 13);

interface HoursReply {
  hours: { hour: string; bars?: (number | null)[] | null; error?: string }[];
}

const toBars = (bars: (number | null)[] | null | undefined) => (bars ? Float64Array.from(bars, (v) => (v === null ? NaN : v)) : null);

function loadFine(kind: 'm1' | 's1', symbol: string, chunk: number): Promise<void> {
  const key = `${kind}:${symbol}:${chunk}`;
  const running = chunks.get(key);
  if (running) return running;
  const size = kind === 'm1' ? MIN_CHUNK : SEC_CHUNK;
  const first = chunk * size;
  const last = Math.min(first + size - 1, kind === 'm1' ? lastDayIdx() : lastHourIdx());
  const url =
    kind === 'm1'
      ? `/api/market/days?symbol=${encodeURIComponent(symbol)}&from=${msToKey(dayStartMs(first))}&to=${msToKey(dayStartMs(last))}&res=1m`
      : `/api/market/seconds?symbol=${encodeURIComponent(symbol)}&from=${hourKey(first)}&to=${hourKey(last)}`;
  const job = api<DaysReply & HoursReply>(url)
    .then((r) => {
      let errorText = '';
      const rows =
        kind === 'm1' ? r.days.map((d) => ({ idx: dayIndexOf(keyToMs(d.day)), ...d })) : r.hours.map((h) => ({ idx: hourIndexOf(Date.parse(`${h.hour}:00:00Z`)), ...h }));
      for (const row of rows) {
        if (row.error) {
          failed.set(`${kind}:${failKey(symbol, row.idx)}`, { at: Date.now(), error: row.error });
          errorText ||= row.error;
          continue;
        }
        (kind === 'm1' ? setRemoteMinutes : setRemoteSeconds)(symbol, row.idx, toBars(row.bars));
      }
      if (errorText) errorListeners.forEach((f) => f(`داده‌ی ${kind === 'm1' ? 'دقیقه‌ای' : 'ثانیه‌ای'} ${symbol} کامل دریافت نشد: ${errorText}`));
    })
    .catch((e: Error) => {
      for (let i = first; i <= last; i++) failed.set(`${kind}:${failKey(symbol, i)}`, { at: Date.now(), error: e.message });
      errorListeners.forEach((f) => f(`داده‌ی ${kind === 'm1' ? 'دقیقه‌ای' : 'ثانیه‌ای'} ${symbol} دریافت نشد: ${e.message}`));
    })
    .finally(() => {
      chunks.delete(key);
      bumpDataVersion();
    });
  chunks.set(key, job);
  return job;
}

function fineRange(kind: 'm1' | 's1', fromMs: number, toMs: number): [number, number] {
  if (kind === 'm1') return [Math.max(0, dayIndexOf(fromMs)), Math.min(dayIndexOf(toMs), lastDayIdx())];
  return [Math.max(0, hourIndexOf(fromMs)), Math.min(hourIndexOf(toMs), lastHourIdx())];
}

/** True when the 1-minute days (m1) or 1-second hours (s1) of [fromMs, toMs] are loaded for these symbols. */
export function fineReady(kind: 'm1' | 's1', symbols: string[], fromMs: number, toMs: number): boolean {
  const [a, b] = fineRange(kind, fromMs, toMs);
  const has = kind === 'm1' ? hasRemoteMinutes : hasRemoteSeconds;
  for (const s of symbols) {
    if (!usesServer(s)) continue;
    for (let i = a; i <= b; i++) if (!has(s, i)) return false;
  }
  return true;
}

/** Load the 1-minute days (m1) or 1-second hours (s1) of [fromMs, toMs]. Resolves true when everything arrived. */
export async function ensureFine(kind: 'm1' | 's1', symbols: string[], fromMs: number, toMs: number): Promise<boolean> {
  const [a, b] = fineRange(kind, fromMs, toMs);
  const size = kind === 'm1' ? MIN_CHUNK : SEC_CHUNK;
  const has = kind === 'm1' ? hasRemoteMinutes : hasRemoteSeconds;
  const jobs: Promise<void>[] = [];
  for (const s of symbols) {
    if (!usesServer(s)) continue;
    for (let c = Math.floor(a / size); c <= Math.floor(b / size); c++) {
      let needed = false;
      for (let i = Math.max(a, c * size); i <= Math.min(b, c * size + size - 1) && !needed; i++) {
        const f = failed.get(`${kind}:${failKey(s, i)}`);
        needed = !has(s, i) && !(f && Date.now() - f.at < RETRY_MS);
      }
      if (needed) jobs.push(loadFine(kind, s, c));
    }
  }
  await Promise.all(jobs);
  return fineReady(kind, symbols, fromMs, toMs);
}

/** The finer data a chart of this timeframe needs: 1-minute days for minute charts, 1-second hours for second charts. */
export const fineKindOf = (tf: Timeframe): 'm1' | 's1' | null => (TF_MS[tf] < MIN_MS ? 's1' : TF_MS[tf] < BAR_MS ? 'm1' : null);

/** How far back a minute or second chart reads (500 candles; weekends add a few days for minutes). */
export function fineLookbackMs(tf: Timeframe): number {
  return fineKindOf(tf) === 's1' ? Math.min(6, Math.ceil((500 * TF_MS[tf]) / HOUR_MS) + 1) * HOUR_MS : 4 * DAY_MS;
}

/** How far back a chart of this timeframe reads (500 candles, weekends included). */
export function lookbackMs(tf: Timeframe): number {
  const days = Math.ceil(((500 * TF_MS[tf]) / DAY_MS) * 1.45) + 2;
  return Math.min(240, Math.max(4, days)) * DAY_MS;
}

/**
 * Keeps the replay's data loaded: history for each chart, a few days ahead of the cursor, and for
 * minute / second charts (or a cursor inside a 5-minute bar) the 1-minute days and 1-second hours
 * around it. `ready` is false while the data right at the cursor is still on its way.
 */
export function useReplayData(panes: { symbol: string; timeframe: Timeframe }[], symbols: string[], cursor: number): { ready: boolean; loading: boolean } {
  const [version, setVersion] = useState(getDataVersion());
  useEffect(() => onDataVersion(() => setVersion(getDataVersion())), []);
  const paneKey = panes.map((p) => `${p.symbol}:${p.timeframe}`).join(',');
  const dayKey = Math.floor(cursor / DAY_MS);
  const hourKey = Math.floor(cursor / HOUR_MS);
  const all = [...new Set([...symbols, ...panes.map((p) => p.symbol)])];
  const needMinutes = panes.some((p) => fineKindOf(p.timeframe)) || cursor % BAR_MS !== 0;
  const needSeconds = panes.some((p) => fineKindOf(p.timeframe) === 's1') || cursor % MIN_MS !== 0;
  useEffect(() => {
    if (!hasServer) return;
    // the days around the cursor first, then history and the days ahead
    void ensureRange(all, cursor - 3 * DAY_MS, cursor + 3 * DAY_MS).then(() => Promise.all(panes.map((p) => ensureRange([p.symbol], cursor - lookbackMs(p.timeframe), cursor))));
  }, [paneKey, symbols.join(','), dayKey]);
  useEffect(() => {
    if (!hasServer || !needMinutes) return;
    // every symbol's current day (fills inside a 5-minute bar), then the minute charts' history
    void ensureFine('m1', all, cursor - DAY_MS, cursor + DAY_MS).then(() =>
      Promise.all(panes.filter((p) => fineKindOf(p.timeframe)).map((p) => ensureFine('m1', [p.symbol], cursor - fineLookbackMs('1m'), cursor))),
    );
  }, [paneKey, symbols.join(','), dayKey, needMinutes]);
  useEffect(() => {
    if (!hasServer || !needSeconds) return;
    void ensureFine('s1', all, cursor - HOUR_MS, cursor + HOUR_MS).then(() =>
      Promise.all(panes.filter((p) => fineKindOf(p.timeframe) === 's1').map((p) => ensureFine('s1', [p.symbol], cursor - fineLookbackMs(p.timeframe), cursor))),
    );
  }, [paneKey, symbols.join(','), hourKey, needSeconds]);
  void version;
  const chartSymbols = [...new Set(panes.map((p) => p.symbol))];
  const ready =
    !hasServer ||
    (rangeReady(all, cursor - DAY_MS, cursor) &&
      (!needMinutes || fineReady('m1', chartSymbols, cursor - 1, cursor)) &&
      (!needSeconds || fineReady('s1', chartSymbols, cursor - 1, cursor)));
  // after a failed load, try again every so often until the data arrives
  useEffect(() => {
    if (ready) return;
    const t = setInterval(() => {
      void ensureRange(all, cursor - 3 * DAY_MS, cursor + 3 * DAY_MS);
      if (needMinutes) void ensureFine('m1', all, cursor - DAY_MS, cursor + DAY_MS);
      if (needSeconds) void ensureFine('s1', all, cursor - HOUR_MS, cursor + HOUR_MS);
    }, RETRY_MS / 4);
    return () => clearInterval(t);
  }, [ready, all.join(','), dayKey, needMinutes, needSeconds]);
  return { ready, loading: hasServer && (!ready || chunks.size > 0) };
}

// ---------- real prices for the landing and sign-in pages ----------
export interface Showcase {
  /** 5-minute bars as [time (s), open, high, low, close] */
  sample: { symbol: string; bars: number[][] } | null;
  /** change over the last 24 hours, in percent; live prices (when the server has them on) also give the price */
  quotes: { symbol: string; change: number; price?: number; live?: true }[];
}

let showcaseJob: Promise<Showcase | null> | null = null;
/** The server's showcase (null without a server or when it cannot be loaded). */
export function loadShowcase(): Promise<Showcase | null> {
  showcaseJob ??= hasServer
    ? api<Showcase>('/api/market/showcase').catch(() => {
        showcaseJob = null;
        return null;
      })
    : Promise.resolve(null);
  return showcaseJob;
}

/** undefined while loading */
export function useShowcase(): Showcase | null | undefined {
  const [value, setValue] = useState<Showcase | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadShowcase().then((v) => live && setValue(v));
    return () => {
      live = false;
    };
  }, []);
  return value;
}
