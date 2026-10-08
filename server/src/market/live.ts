import { config } from '../config';
import { db } from '../db';
import { fetchWithTimeout } from '../util';
import { INSTRUMENTS, type Instrument } from './instruments';
import { type LiveQuote, QverisBudgetError, qverisConfigured, qverisQuote, qverisSymbol } from './qveris';

/**
 * Live prices for the sign-in page's ticker strip, when the admin turns them on (settings.qveris.live):
 * crypto from Binance's 24-hour ticker (free), forex and metals from QVeris (paid per quote).
 * Prices are asked again only after settings.qveris.liveMinutes, and only while someone opens the page.
 */

/** How long a page request waits for a refresh before answering with what it has. */
const WAIT_MS = 4000;

const cache = new Map<string, { quote: LiveQuote; fetched: number }>();
let refreshedAt = 0;
let job: Promise<void> | null = null;

const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits;

/** Binance's 24-hour tickers for these coins (one request). */
async function binanceTickers(coins: Instrument[]): Promise<LiveQuote[]> {
  if (!coins.length) return [];
  const symbols = encodeURIComponent(JSON.stringify(coins.map((c) => c.binance)));
  const res = await fetchWithTimeout(`${config.binanceUrl}/api/v3/ticker/24hr?symbols=${symbols}`);
  if (!res.ok) return [];
  const rows = (await res.json()) as { symbol: string; lastPrice: string; priceChangePercent: string; closeTime: number }[];
  return coins.flatMap((inst) => {
    const r = Array.isArray(rows) ? rows.find((x) => x.symbol === inst.binance) : undefined;
    const price = Number(r?.lastPrice);
    if (!r || !(price > 0)) return [];
    return [{ symbol: inst.id, price, change: Number(r.priceChangePercent) || 0, at: Number(r.closeTime) || Date.now() }];
  });
}

async function refresh(symbols: string[]) {
  const insts = symbols.map((s) => INSTRUMENTS[s]).filter(Boolean);
  const coins = insts.filter((i) => i.binance);
  const paid = qverisConfigured() ? insts.filter((i) => !i.binance && qverisSymbol(i)) : [];
  const got: LiveQuote[] = [];
  await Promise.all([
    binanceTickers(coins).then(
      (q) => got.push(...q),
      () => undefined,
    ),
    (async () => {
      for (const inst of paid) {
        try {
          got.push(await qverisQuote(inst));
        } catch (e) {
          if (e instanceof QverisBudgetError) break;
          console.warn(`[market] live quote ${inst.id}: ${(e as Error).message}`);
        }
      }
    })(),
  ]);
  const now = Date.now();
  for (const q of got) cache.set(q.symbol, { quote: { ...q, price: round(q.price, INSTRUMENTS[q.symbol].digits), change: round(q.change, 2) }, fetched: now });
}

/** Live prices of these symbols that are fresh enough (empty when live prices are off). */
export async function liveQuotes(symbols: string[]): Promise<Map<string, LiveQuote>> {
  const s = db().settings.qveris;
  const out = new Map<string, LiveQuote>();
  if (!s.live) return out;
  const ttl = s.liveMinutes * 60_000;
  if (Date.now() - refreshedAt >= ttl) {
    refreshedAt = Date.now();
    job ??= refresh(symbols).finally(() => (job = null));
  }
  if (job) {
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([job, new Promise<void>((r) => (timer = setTimeout(r, WAIT_MS)))]);
    clearTimeout(timer);
  }
  for (const id of symbols) {
    const c = cache.get(id);
    if (c && Date.now() - c.fetched < 2 * ttl) out.set(id, c.quote);
  }
  return out;
}

/** Tests: forget cached prices. */
export function resetLiveQuotes() {
  cache.clear();
  refreshedAt = 0;
}
