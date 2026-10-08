import { randomUUID } from 'node:crypto';
import { config } from '../config';
import { db, save } from '../db';
import type { QverisStatus } from '../shared';
import { DAY_MS, UpstreamError, fetchWithTimeout, limiter, utcDayKey } from '../util';
import { INSTRUMENTS, type Instrument } from './instruments';
import { MINUTES_PER_DAY, type DayBars } from './sources';

/**
 * QVeris (qveris.ai): a paid gateway to data providers. The server uses it for EODHD's 1-minute
 * history (forex, metals and crypto) and EODHD's live quotes. It is optional: without QVERIS_API_KEY
 * it is never called, and a market uses it only when the admin picks it as that market's source.
 *
 * Every call costs credits (CALL_CREDITS each), so the server counts what it spends per UTC day and
 * stops at the admin's daily limit (settings.qveris.dailyCredits). One call fetches one symbol's day.
 *
 * API: POST /search (free) gives a search_id; POST /tools/execute?tool_id=… runs a tool with it.
 * Large results come as a link to a file (full_content_file_url) instead of inline data.
 */

export const TOOLS = {
  intraday: 'eodhd.intraday.retrieve.v1.82292199',
  quote: 'eodhd.real_time.retrieve.v1.3b8a5cf8',
};
/** Credits one call costs (QVeris' price for both EODHD tools); the reply says what was charged. */
export const CALL_CREDITS = 2.81;
/** Inline results up to this size; larger ones come as a file link. */
const MAX_RESPONSE = 512 * 1024;
const CALL_TIMEOUT_MS = 60_000;
const SEARCH_TTL_MS = 6 * 3_600_000;
/** After QVeris says the account has no credits left, wait this long before asking again. */
const NO_CREDITS_PAUSE_MS = 3_600_000;

const queue = limiter(2);
const SESSION = randomUUID();

/** The daily limit (or the account's balance) is used up: what was not fetched is fetched later. */
export class QverisBudgetError extends Error {}

export const qverisConfigured = () => config.qverisApiKey !== '';

/** EODHD's ticker for a symbol; undefined where QVeris has no matching market (indices, energy). */
export function qverisSymbol(inst: Instrument): string | undefined {
  if (inst.group === 'forex' || inst.group === 'metal') return `${inst.id}.FOREX`;
  if (inst.group === 'crypto') return `${inst.id.replace(/USD$/, '')}-USD.CC`;
  return undefined;
}

// ---------- credits ----------
let pending = 0;
let noCreditsUntil = 0;

function usage() {
  const day = utcDayKey(Date.now());
  const d = db();
  if (d.qverisUsage?.day !== day) d.qverisUsage = { ...d.qverisUsage, day, credits: 0, calls: 0 };
  return d.qverisUsage;
}

/** Keep room for one call within today's limit, or throw. */
function reserve() {
  if (Date.now() < noCreditsUntil) throw new QverisBudgetError('اعتبار حساب QVeris تمام شده است.');
  const limit = db().settings.qveris.dailyCredits;
  if (usage().credits + (pending + 1) * CALL_CREDITS > limit + 1e-9)
    throw new QverisBudgetError(`سقف روزانه‌ی اعتبار QVeris (${limit}) پر شد؛ بقیه بعد از ساعت ۰ UTC گرفته می‌شود.`);
  pending++;
}

function settle(charged: number, remaining: unknown) {
  pending--;
  const u = usage();
  u.credits = Math.round((u.credits + charged) * 100) / 100;
  if (charged > 0) u.calls++;
  const r = typeof remaining === 'string' ? Number(remaining) : remaining;
  if (typeof r === 'number' && Number.isFinite(r)) {
    u.remaining = r;
    u.remainingAt = Date.now();
  }
  save();
}

// ---------- API ----------
const headers = () => ({ Authorization: `Bearer ${config.qverisApiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' });

async function request(path: string, init: RequestInit = {}, timeoutMs = config.upstreamTimeoutMs): Promise<any> {
  if (!qverisConfigured()) throw new UpstreamError('QVeris: کلید API روی سرور تنظیم نشده است (QVERIS_API_KEY).');
  const res = await fetchWithTimeout(`${config.qverisUrl}${path}`, { ...init, headers: headers() }, timeoutMs);
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (res.status === 401 || res.status === 403) throw new UpstreamError('QVeris: کلید API پذیرفته نشد.', res.status);
  if (res.status === 402) {
    noCreditsUntil = Date.now() + NO_CREDITS_PAUSE_MS;
    throw new QverisBudgetError('اعتبار حساب QVeris تمام شده است.');
  }
  if (!res.ok || data === null) {
    const detail = data?.message ?? data?.detail ?? data?.error ?? text.slice(0, 120);
    throw new UpstreamError(`QVeris: HTTP ${res.status}${detail ? ` (${String(detail).slice(0, 160)})` : ''}`, res.status, text.slice(0, 300));
  }
  return data;
}

let search: { id: Promise<string>; at: number } | null = null;

/** A search_id, which every call needs (searching is free); calls at the same time share one search. */
function searchId(): Promise<string> {
  if (search && Date.now() - search.at < SEARCH_TTL_MS) return search.id;
  const id = request('/search', { method: 'POST', body: JSON.stringify({ query: 'EODHD intraday historical bars and real-time quotes', limit: 5 }) }).then((data) => {
    const v = data?.search_id ?? data?.data?.search_id;
    if (typeof v !== 'string' || !v) throw new UpstreamError('QVeris: search returned no search_id.');
    return v;
  });
  search = { id, at: Date.now() };
  id.catch(() => (search = null));
  return id;
}

/** The result's data: inline, or read from the file QVeris links to when it is large. */
async function resultData(result: any): Promise<unknown> {
  if (result?.data !== undefined) return result.data;
  let url = result?.full_content_file_url;
  if (typeof url !== 'string' || !url.startsWith('https://')) return undefined;
  if (config.qverisFilesUrl) url = url.replace(/^https:\/\/oss\.qveris\.ai/, config.qverisFilesUrl);
  const res = await fetchWithTimeout(url, {}, CALL_TIMEOUT_MS);
  if (!res.ok) throw new UpstreamError(`QVeris: result file HTTP ${res.status}`, res.status);
  const text = await res.text();
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && 'data' in v ? v.data : v;
  } catch {
    return text;
  }
}

/**
 * Run a tool. An answer QVeris marks as unsuccessful is not charged; its data is still returned when
 * there is any (an empty day comes back that way), and `undefined` when there is none.
 */
async function execute(tool: string, parameters: Record<string, unknown>): Promise<{ data: unknown; ok: boolean; error?: string }> {
  return queue(async () => {
    reserve();
    let charged = 0;
    let remaining: unknown;
    try {
      const sid = await searchId();
      const out = await request(
        `/tools/execute?tool_id=${encodeURIComponent(tool)}`,
        { method: 'POST', body: JSON.stringify({ search_id: sid, session_id: SESSION, parameters, max_response_size: MAX_RESPONSE }) },
        CALL_TIMEOUT_MS,
      );
      remaining = out.remaining_credits;
      const ok = out.success !== false;
      charged = typeof out.cost === 'number' && Number.isFinite(out.cost) ? out.cost : ok ? CALL_CREDITS : 0;
      const status = out.result?.status_code;
      if (typeof status === 'number' && status >= 400) throw new UpstreamError(`QVeris/EODHD: HTTP ${status}`, status);
      return { data: await resultData(out.result), ok, error: out.error_message ?? undefined };
    } finally {
      settle(charged, remaining);
    }
  });
}

// ---------- history ----------
/** EODHD's intraday CSV (Timestamp,Gmtoffset,Datetime,Open,High,Low,Close,Volume) → the day's 1440 one-minute bars. */
export function parseEodhdMinutes(csv: string, dayStart: number): DayBars {
  const lines = csv.trim().split(/\r?\n/);
  const head = (lines.shift() ?? '').split(',').map((h) => h.trim().toLowerCase());
  const col = (name: string) => head.indexOf(name);
  const [ts, o, h, l, c] = [col('timestamp'), col('open'), col('high'), col('low'), col('close')];
  if (ts < 0 || o < 0 || h < 0 || l < 0 || c < 0) throw new UpstreamError('QVeris/EODHD: unexpected CSV header.');
  const out = new Float64Array(MINUTES_PER_DAY * 4).fill(NaN);
  let any = false;
  for (const line of lines) {
    const f = line.split(',');
    const j = (Number(f[ts]) * 1000 - dayStart) / 60_000;
    if (!Number.isInteger(j) || j < 0 || j >= MINUTES_PER_DAY) continue;
    const bar = [Number(f[o]), Number(f[h]), Number(f[l]), Number(f[c])];
    if (!bar.every((v) => Number.isFinite(v) && v > 0)) continue;
    out.set(bar, j * 4);
    any = true;
  }
  return any ? out : null;
}

/** One UTC day of 1-minute bars (one call). */
export async function qverisDayMinutes(inst: Instrument, dayStart: number): Promise<DayBars> {
  const symbol = qverisSymbol(inst);
  if (!symbol) throw new UpstreamError(`QVeris: ${inst.id} پشتیبانی نمی‌شود.`);
  const from = dayStart / 1000;
  const r = await execute(TOOLS.intraday, { symbol, interval: '1m', from, to: from + DAY_MS / 1000 - 60 });
  // an empty answer: no trades that day (a holiday)
  if ((typeof r.data === 'string' && r.data.trim() === '') || (Array.isArray(r.data) && r.data.length === 0)) return null;
  if (typeof r.data !== 'string' || !/^\s*"?timestamp/i.test(r.data)) {
    // no CSV at all: an error, not a closed market
    throw new UpstreamError(`QVeris/EODHD ${symbol}: ${r.error ?? 'no data'}`);
  }
  return parseEodhdMinutes(r.data, dayStart);
}

// ---------- live quotes ----------
export interface LiveQuote {
  symbol: string;
  price: number;
  /** change from the previous day's close, in percent */
  change: number;
  /** when the price was quoted (ms) */
  at: number;
}

/** EODHD's delayed live quote (usually a minute or two old). */
export async function qverisQuote(inst: Instrument): Promise<LiveQuote> {
  const symbol = qverisSymbol(inst);
  if (!symbol) throw new UpstreamError(`QVeris: ${inst.id} پشتیبانی نمی‌شود.`);
  const r = await execute(TOOLS.quote, { symbol, fmt: 'json' });
  const q = (typeof r.data === 'string' ? JSON.parse(r.data) : r.data) as Record<string, unknown> | undefined;
  const price = Number(q?.close);
  const change = Number(q?.change_p);
  if (!r.ok || !Number.isFinite(price) || price <= 0) throw new UpstreamError(`QVeris/EODHD ${symbol}: ${r.error ?? 'no quote'}`);
  return { symbol: inst.id, price, change: Number.isFinite(change) ? change : 0, at: Number(q?.timestamp) > 0 ? Number(q?.timestamp) * 1000 : Date.now() };
}

// ---------- admin ----------
/** Usage and, when reachable, the account's balance (asking for it is free). */
export async function qverisStatus(): Promise<QverisStatus> {
  const u = usage();
  const status: QverisStatus = {
    configured: qverisConfigured(),
    today: { day: u.day, credits: u.credits, calls: u.calls },
    dailyCredits: db().settings.qveris.dailyCredits,
    callCredits: CALL_CREDITS,
    symbols: Object.values(INSTRUMENTS)
      .filter((i) => qverisSymbol(i))
      .map((i) => i.id),
  };
  if (status.configured) {
    try {
      const data = await request('/auth/credits');
      const r = Number(data?.remaining_credits ?? data?.data?.remaining_credits);
      if (Number.isFinite(r)) {
        u.remaining = r;
        u.remainingAt = Date.now();
        save();
      }
    } catch (e) {
      status.error = (e as Error).message;
    }
  }
  status.remaining = u.remaining;
  status.remainingAt = u.remainingAt;
  return status;
}

/** Tests: forget the cached search and pauses. */
export function resetQveris() {
  search = null;
  noCreditsUntil = 0;
  pending = 0;
}
