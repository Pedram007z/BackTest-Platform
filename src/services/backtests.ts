import type { AdminBacktestRow, BacktestQuery, BacktestSessionSummary, BacktestSnapshot, Page, SnapshotSession, SnapshotTrade } from './types';

/**
 * Users' backtest data as kept on the server for the admin panel. Shared by the app (which builds the
 * copy), the API server (which cleans what it receives and summarises it) and the demo backend.
 * Journals (notes, screenshots) and chart layouts stay in the browser.
 */

const DAY_MS = 86_400_000;
export const SNAPSHOT_LIMITS = { sessions: 500, trades: 20_000, strategies: 200 };

const keyMs = (key: string) => {
  const ms = Date.parse(`${key}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : 0;
};
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const optNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const text = (v: unknown, max = 120) => (typeof v === 'string' ? v.slice(0, max) : '');
const optText = (v: unknown, max = 120) => (typeof v === 'string' && v ? v.slice(0, max) : undefined);
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

function cleanSession(s: any): SnapshotSession {
  return {
    id: text(s?.id, 60),
    name: text(s?.name, 120),
    balance: num(s?.balance),
    symbols: Array.isArray(s?.symbols) ? s.symbols.slice(0, 20).map((x: unknown) => text(x, 20)) : [],
    startDate: text(s?.startDate, 10),
    endDate: text(s?.endDate, 10),
    strategyId: optText(s?.strategyId, 60),
    cursor: num(s?.cursor),
    timeframe: text(s?.timeframe, 8),
    activeSymbol: text(s?.activeSymbol, 20),
    createdAt: num(s?.createdAt),
    lastOpenedAt: optNum(s?.lastOpenedAt),
  };
}

function cleanTrade(t: any): SnapshotTrade {
  return {
    id: text(t?.id, 60),
    sessionId: text(t?.sessionId, 60),
    strategyId: optText(t?.strategyId, 60),
    symbol: text(t?.symbol, 20),
    side: pick(t?.side, ['buy', 'sell'] as const, 'buy'),
    orderType: pick(t?.orderType, ['market', 'limit', 'stop'] as const, 'market'),
    status: pick(t?.status, ['pending', 'open', 'closed', 'cancelled'] as const, 'closed'),
    entry: num(t?.entry),
    sl: num(t?.sl),
    tp: num(t?.tp),
    lots: num(t?.lots),
    initialLots: num(t?.initialLots),
    pointValue: num(t?.pointValue),
    risk: num(t?.risk),
    riskPct: num(t?.riskPct),
    placedTime: num(t?.placedTime),
    openTime: num(t?.openTime),
    closeTime: optNum(t?.closeTime),
    exit: optNum(t?.exit),
    partials: Array.isArray(t?.partials) ? t.partials.slice(0, 50).map((p: any) => ({ time: num(p?.time), price: num(p?.price), lots: num(p?.lots), pnl: optNum(p?.pnl) })) : [],
    r: optNum(t?.r),
    pnl: optNum(t?.pnl),
    maxR: optNum(t?.maxR),
    closeReason: t?.closeReason ? pick(t.closeReason, ['tp', 'sl', 'manual', 'session_end'] as const, 'manual') : undefined,
    executedAt: num(t?.executedAt),
    closedAt: optNum(t?.closedAt),
  };
}

/**
 * The copy of the app's data (sessions, orders and positions, strategy names) in a known shape:
 * extra fields are left out, sizes are capped. Used on both ends.
 */
export function cleanSnapshot(raw: any): BacktestSnapshot {
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    sessions: arr(raw?.sessions)
      .slice(0, SNAPSHOT_LIMITS.sessions)
      .map(cleanSession)
      .filter((s) => s.id),
    trades: arr(raw?.trades)
      .slice(-SNAPSHOT_LIMITS.trades)
      .map(cleanTrade)
      .filter((t) => t.id && t.sessionId),
    strategies: arr(raw?.strategies)
      .slice(0, SNAPSHOT_LIMITS.strategies)
      .map((s: any) => ({ id: text(s?.id, 60), name: text(s?.name, 120) }))
      .filter((s) => s.id),
  };
}

/** A short fingerprint of the copy, so the app only uploads when something changed (FNV-1a, two lanes). */
export function snapshotHash(json: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ json.length;
  for (let i = 0; i < json.length; i++) {
    const c = json.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 13);
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/** Realised dollars of a position so far (its partial closes, the final close included). */
export const realisedPnl = (t: Pick<SnapshotTrade, 'partials'>) => t.partials.reduce((sum, p) => sum + (p.pnl ?? 0), 0);

export function summarizeSessions(snap: BacktestSnapshot): BacktestSessionSummary[] {
  const strategyName = new Map(snap.strategies.map((s) => [s.id, s.name]));
  return snap.sessions.map((s) => {
    const trades = snap.trades.filter((t) => t.sessionId === s.id);
    const closed = trades.filter((t) => t.status === 'closed');
    const start = keyMs(s.startDate);
    const end = keyMs(s.endDate) + DAY_MS;
    const progress = end > start ? Math.min(1, Math.max(0, (s.cursor - start) / (end - start))) : 0;
    return {
      id: s.id,
      name: s.name,
      symbols: s.symbols,
      timeframe: s.timeframe,
      startDate: s.startDate,
      endDate: s.endDate,
      balance: s.balance,
      cursor: s.cursor,
      progress,
      createdAt: s.createdAt,
      lastOpenedAt: s.lastOpenedAt,
      strategy: s.strategyId ? strategyName.get(s.strategyId) : undefined,
      closed: closed.length,
      open: trades.filter((t) => t.status === 'open').length,
      pending: trades.filter((t) => t.status === 'pending').length,
      wins: closed.filter((t) => (t.pnl ?? 0) > 0).length,
      losses: closed.filter((t) => (t.pnl ?? 0) < 0).length,
      netPnl: Math.round(trades.reduce((sum, t) => sum + realisedPnl(t), 0) * 100) / 100,
    };
  });
}

/** The admin list: search (user, phone, address, session, symbol, strategy), sort, a page of 30. */
export function queryBacktestRows(rows: AdminBacktestRow[], q: BacktestQuery, pageSize = 30): Page<AdminBacktestRow> {
  const term = (q.q ?? '').trim().toLowerCase();
  let list = q.userId ? rows.filter((r) => r.userId === q.userId) : rows;
  if (term) list = list.filter((r) => [r.userName, r.phone, r.name, r.ip ?? '', r.strategy ?? '', ...r.symbols].some((v) => v.toLowerCase().includes(term)));
  const sort = q.sort ?? 'recent';
  list = [...list].sort((a, b) =>
    sort === 'pnl' ? b.netPnl - a.netPnl : sort === 'trades' ? b.closed - a.closed : (b.lastOpenedAt ?? b.createdAt) - (a.lastOpenedAt ?? a.createdAt),
  );
  const page = Math.max(1, Number(q.page) || 1);
  return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length };
}
