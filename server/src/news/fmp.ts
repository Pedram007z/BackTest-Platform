import { createHash } from 'node:crypto';
import { config } from '../config';
import { UpstreamError, fetchWithTimeout } from '../util';
import type { Impact, NewsEvent } from './forexfactory';

/**
 * Financial Modeling Prep's economic calendar (licensed, paid): past events with actual, estimate and
 * previous values and an impact level, used to fill calendar weeks ForexFactory does not give a
 * server. GET /stable/economic-calendar?from=YYYY-MM-DD&to=YYYY-MM-DD returns
 * [{ date: "YYYY-MM-DD HH:MM:SS" (UTC), country, event, currency, previous, estimate, actual,
 *    change, impact: "Low" | "Medium" | "High", changePercentage, unit }].
 * Showing the data to the platform's users needs an FMP plan that allows it (data display licence).
 */

/** The currencies the app's calendar shows (src/lib/news.ts NEWS_CURRENCIES). */
const CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY']);

export const fmpConfigured = () => config.fmpApiKey !== '';

function impactOf(impact: unknown, title: string): Impact {
  if (/holiday/i.test(title)) return 'holiday';
  const v = String(impact ?? '').toLowerCase();
  return v === 'high' ? 'high' : v === 'medium' ? 'medium' : 'low';
}

/** A value as the calendar shows it: 3.2 with unit "%" → "3.2%", 256 with unit "K" → "256K". */
function value(v: unknown, unit: unknown): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  const u = typeof unit === 'string' ? unit.trim() : '';
  return `${Number(n.toFixed(4))}${u}`;
}

export function parseFmpCalendar(items: unknown): NewsEvent[] {
  if (!Array.isArray(items)) throw new UpstreamError('FMP: پاسخ تقویم آرایه نیست');
  const out: NewsEvent[] = [];
  for (const it of items as Record<string, unknown>[]) {
    const currency = String(it?.currency ?? '').toUpperCase();
    const title = String(it?.event ?? '').trim();
    const time = Date.parse(`${String(it?.date ?? '').replace(' ', 'T')}Z`);
    if (!CURRENCIES.has(currency) || !title || !Number.isFinite(time)) continue;
    const impact = impactOf(it.impact, title);
    const id = createHash('sha1').update(`${it.country}|${title}|${time}`).digest('hex').slice(0, 12);
    out.push({
      id: `fmp-${id}`,
      time,
      currency,
      title,
      impact,
      actual: value(it.actual, it.unit),
      forecast: value(it.estimate, it.unit),
      previous: value(it.previous, it.unit),
      allDay: impact === 'holiday' || undefined,
    });
  }
  return out.sort((a, b) => a.time - b.time);
}

/** Events from `from` to `to` (YYYY-MM-DD, inclusive). */
export async function fetchFmpCalendar(from: string, to: string): Promise<NewsEvent[]> {
  if (!fmpConfigured()) throw new UpstreamError('FMP: کلید API روی سرور تنظیم نشده است (FMP_API_KEY).');
  const url = `${config.fmpUrl}/stable/economic-calendar?from=${from}&to=${to}&apikey=${encodeURIComponent(config.fmpApiKey)}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json', 'User-Agent': 'backtestlab-server' } }, 60_000);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* reported below */
  }
  const message = (data as Record<string, unknown> | null)?.['Error Message'];
  if (res.status === 401 || /invalid api key/i.test(String(message ?? ''))) throw new UpstreamError('FMP: کلید API پذیرفته نشد.', 401);
  if (res.status === 402 || res.status === 403 || /restricted|subscription|upgrade/i.test(String(message ?? '')))
    throw new UpstreamError('FMP: این تقویم در پلن فعلی شما نیست (پلن را ارتقا دهید).', res.status);
  if (!res.ok || data === null) throw new UpstreamError(`FMP: HTTP ${res.status}${message ? ` (${String(message).slice(0, 120)})` : ''}`, res.status);
  return parseFmpCalendar(data);
}
