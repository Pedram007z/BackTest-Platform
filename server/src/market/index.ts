import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from '../config';
import { db } from '../db';
import { badRequest } from '../http';
import type { DataSource } from '../shared';
import { DAY_MS, isDayKey, keyToMs, utcDayKey } from '../util';
import { INSTRUMENTS, type Instrument } from './instruments';
import { BARS_PER_DAY, binanceDays, dukascopyDay, type DayBars } from './sources';

/**
 * 5-minute bars for the replay, one UTC day at a time. Days are fetched from Dukascopy or
 * Binance (per market, chosen in the admin panel) and kept on disk, so each day is downloaded once.
 */

const MAX_DAYS = 45;
/** A day is cached once it ended this long ago (late ticks and publishing delay). */
const SETTLE_MS = 6 * 3_600_000;

type Remote = Exclude<DataSource, 'synthetic'>;

export function sourceFor(inst: Instrument): DataSource {
  const chosen = db().settings.marketData[inst.group] ?? 'synthetic';
  if (chosen === 'synthetic') return 'synthetic';
  if (chosen === 'binance' && inst.binance) return 'binance';
  if (chosen === 'dukascopy' && inst.dukascopy) return 'dukascopy';
  // fall back to whichever real source has the symbol
  return inst.dukascopy ? 'dukascopy' : inst.binance ? 'binance' : 'synthetic';
}

const cacheFile = (source: Remote, id: string, day: string) => join(config.dataDir, 'market', source, id, day.slice(0, 4), `${day.slice(5)}.f32`);

function readCache(source: Remote, id: string, day: string): DayBars | undefined {
  const f = cacheFile(source, id, day);
  if (!existsSync(f)) return undefined;
  const buf = readFileSync(f);
  if (buf.length === 0) return null;
  if (buf.length !== BARS_PER_DAY * 4 * 4) return undefined;
  const f32 = new Float32Array(buf.buffer, buf.byteOffset, BARS_PER_DAY * 4);
  return Float64Array.from(f32);
}

function writeCache(source: Remote, id: string, day: string, bars: DayBars) {
  const f = cacheFile(source, id, day);
  mkdirSync(dirname(f), { recursive: true });
  const tmp = `${f}.tmp`;
  writeFileSync(tmp, bars ? Buffer.from(Float32Array.from(bars).buffer) : Buffer.alloc(0));
  renameSync(tmp, f);
}

const inflight = new Map<string, Promise<DayBars>>();

async function loadDays(inst: Instrument, source: Remote, starts: number[]): Promise<Map<number, DayBars | Error>> {
  const result = new Map<number, DayBars | Error>();
  const todo: number[] = [];
  for (const s of starts) {
    const hit = readCache(source, inst.id, utcDayKey(s));
    if (hit !== undefined) result.set(s, hit);
    else todo.push(s);
  }

  const settle = (s: number, bars: DayBars) => {
    if (s + DAY_MS + SETTLE_MS < Date.now()) writeCache(source, inst.id, utcDayKey(s), bars);
    return bars;
  };
  const shared = (s: number, run: () => Promise<DayBars>) => {
    const key = `${source}:${inst.id}:${s}`;
    let p = inflight.get(key);
    if (!p) {
      p = run().finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return p.then(
      (bars) => void result.set(s, bars),
      (e: Error) => void result.set(s, e),
    );
  };

  const jobs: Promise<void>[] = [];
  if (source === 'dukascopy') {
    for (const s of todo) {
      // weekends never trade outside crypto; skip the request
      const wd = new Date(s).getUTCDay();
      if (!inst.weekends && wd === 6) {
        result.set(s, settle(s, null));
        continue;
      }
      jobs.push(shared(s, async () => settle(s, await dukascopyDay(inst, s))));
    }
  } else {
    // consecutive missing days in groups of three per request
    for (let i = 0; i < todo.length;) {
      const group = [todo[i]];
      while (group.length < 3 && todo[i + group.length] === group[0] + group.length * DAY_MS) group.push(todo[i + group.length]);
      i += group.length;
      const batch = binanceDays(inst, group[0], group.length);
      group.forEach((s, k) => jobs.push(shared(s, async () => settle(s, (await batch)[k]))));
    }
  }
  await Promise.all(jobs);
  return result;
}

const round = (v: number, digits: number) => {
  const m = 10 ** (digits + 1);
  return Math.round(v * m) / m;
};

/** GET /api/market/days?symbol=EURUSD&from=2024-01-01&to=2024-01-31 (inclusive UTC days). */
export async function marketDays(query: URLSearchParams) {
  const symbol = query.get('symbol') ?? '';
  const inst = INSTRUMENTS[symbol];
  if (!inst) throw badRequest('symbol', 'نماد پشتیبانی نمی‌شود.', 'symbol');
  const from = query.get('from');
  const to = query.get('to');
  if (!isDayKey(from) || !isDayKey(to) || to < from) throw badRequest('range', 'بازه‌ی تاریخ معتبر نیست.');
  const first = keyToMs(from);
  const last = Math.min(keyToMs(to), Math.floor(Date.now() / DAY_MS) * DAY_MS);
  const count = Math.floor((last - first) / DAY_MS) + 1;
  if (count > MAX_DAYS) throw badRequest('range', `حداکثر ${MAX_DAYS} روز در هر درخواست.`);

  const source = sourceFor(inst);
  if (source === 'synthetic') return { symbol, source, days: [] };
  const starts = Array.from({ length: Math.max(0, count) }, (_, i) => first + i * DAY_MS);
  const loaded = await loadDays(inst, source, starts);
  return {
    symbol,
    source,
    days: starts.map((s) => {
      const v = loaded.get(s);
      const day = utcDayKey(s);
      if (v instanceof Error) return { day, error: v.message };
      if (!v) return { day, bars: null };
      return { day, bars: Array.from(v, (x) => (Number.isNaN(x) ? null : round(x, inst.digits))) };
    }),
  };
}

/** Which real source each market uses, for the app's settings. */
export function marketConfig() {
  const sources: Record<string, DataSource> = {};
  for (const inst of Object.values(INSTRUMENTS)) sources[inst.id] = sourceFor(inst);
  return sources;
}
