import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { keyToMs, msToKey, DAY_MS } from '../lib/calendar';
import { SYMBOLS, TF_MS, bumpDataVersion, dayIndexOf, dayStartMs, getDataVersion, hasRemoteDay, marketSource, onDataVersion, setRemoteDay, type Timeframe } from '../lib/market';
import { api, hasServer } from './api';
import { backend } from './index';
import type { SiteConfig } from './types';

/**
 * Real market data from the API server (Dukascopy / Binance, chosen per market by the admin).
 * Days are loaded into lib/market.ts with `setRemoteDay()` in 30-day chunks that callers share;
 * charts redraw through the data version. Without a server everything stays synthetic.
 */

// Until the server says otherwise, every symbol waits for real data (never shows synthetic prices).
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
      if (backend.mode === 'server') {
        marketSource.remote = new Set(
          Object.entries(config.market)
            .filter(([, src]) => src !== 'synthetic')
            .map(([id]) => id),
        );
        bumpDataVersion();
      }
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

/** How far back a chart of this timeframe reads (500 candles, weekends included). */
export function lookbackMs(tf: Timeframe): number {
  const days = Math.ceil(((500 * TF_MS[tf]) / DAY_MS) * 1.45) + 2;
  return Math.min(240, Math.max(4, days)) * DAY_MS;
}

/**
 * Keeps the replay's data loaded: history for each chart and a few days ahead of the cursor.
 * `ready` is false while the days right around the cursor are still on their way.
 */
export function useReplayData(panes: { symbol: string; timeframe: Timeframe }[], symbols: string[], cursor: number): { ready: boolean; loading: boolean } {
  const [version, setVersion] = useState(getDataVersion());
  useEffect(() => onDataVersion(() => setVersion(getDataVersion())), []);
  const paneKey = panes.map((p) => `${p.symbol}:${p.timeframe}`).join(',');
  const dayKey = Math.floor(cursor / DAY_MS);
  useEffect(() => {
    if (!hasServer) return;
    const all = [...new Set([...symbols, ...panes.map((p) => p.symbol)])];
    // the days around the cursor first, then history and the days ahead
    void ensureRange(all, cursor - 3 * DAY_MS, cursor + 3 * DAY_MS).then(() => Promise.all(panes.map((p) => ensureRange([p.symbol], cursor - lookbackMs(p.timeframe), cursor))));
  }, [paneKey, symbols.join(','), dayKey]);
  void version;
  const all = [...new Set([...symbols, ...panes.map((p) => p.symbol)])];
  const ready = !hasServer || rangeReady(all, cursor - DAY_MS, cursor);
  // after a failed load, try again every so often until the days arrive
  useEffect(() => {
    if (ready) return;
    const t = setInterval(() => void ensureRange(all, cursor - 3 * DAY_MS, cursor + 3 * DAY_MS), RETRY_MS / 4);
    return () => clearInterval(t);
  }, [ready, all.join(','), dayKey]);
  return { ready, loading: hasServer && (!ready || chunks.size > 0) };
}
