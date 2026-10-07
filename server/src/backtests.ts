import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config';
import { db } from './db';
import { badRequest, notFound, type Ctx } from './http';
import type { AccountUser, AdminBacktestDetail, AdminBacktestRow, BacktestQuery, BacktestSessionSummary, BacktestSnapshot, BacktestSyncState, Page } from './shared';
import { cleanSnapshot, queryBacktestRows, summarizeSessions } from '../../src/services/backtests';

/**
 * A copy of each user's backtest data (sessions, orders, positions), saved by their app, for the admin
 * panel. One file per user in DATA_DIR/backtests/; an index of the session summaries in index.json.
 * The browser keeps the working data; an admin who deletes a session here removes it from the user's
 * app at its next sync.
 */

interface IndexEntry {
  /** Fingerprint of the app's data when it was last saved. */
  hash: string;
  syncedAt: number;
  ip?: string;
  userAgent?: string;
  sessions: BacktestSessionSummary[];
  /** Sessions an admin deleted that the user's app has not removed yet. */
  pendingRemovals: string[];
}

const DIR = () => join(config.dataDir, 'backtests');
const INDEX = () => join(DIR(), 'index.json');
const userFile = (userId: string) => join(DIR(), `${userId.replace(/[^A-Za-z0-9_-]/g, '')}.json`);

let index: Record<string, IndexEntry> | null = null;
let timer: NodeJS.Timeout | null = null;

function writeAtomic(file: string, data: string) {
  mkdirSync(DIR(), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

function idx(): Record<string, IndexEntry> {
  if (!index) {
    try {
      index = existsSync(INDEX()) ? JSON.parse(readFileSync(INDEX(), 'utf8')) : {};
    } catch {
      index = {};
    }
  }
  return index!;
}

/** Write the index now (also called on shutdown). */
export function flushBacktests() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (index) writeAtomic(INDEX(), JSON.stringify(index));
}
const saveIndex = () => {
  if (!timer) timer = setTimeout(flushBacktests, 1000);
};

function readSnapshot(userId: string): BacktestSnapshot {
  try {
    return cleanSnapshot(JSON.parse(readFileSync(userFile(userId), 'utf8')));
  } catch {
    return { sessions: [], trades: [], strategies: [] };
  }
}

const HASH = /^[0-9a-f]{8,64}$/;

/** POST /api/me/backtests/check: does the server need the data, and which sessions did an admin delete? */
export function syncCheck(user: AccountUser, body: any): BacktestSyncState {
  const hash = String(body?.hash ?? '');
  const e = idx()[user.id];
  return { needData: !e || e.hash !== hash, remove: e?.pendingRemovals ?? [] };
}

/** PUT /api/me/backtests: the app's data (body: { hash, snapshot }). */
export function syncUpload(ctx: Ctx, user: AccountUser): BacktestSyncState {
  const hash = String(ctx.body?.hash ?? '');
  if (!HASH.test(hash)) throw badRequest('invalid', 'داده‌ی ارسالی معتبر نیست.');
  const snap = cleanSnapshot(ctx.body?.snapshot);
  const prev = idx()[user.id];
  // sessions the admin deleted: dropped here too, and still pending until the app no longer sends them
  const pending = (prev?.pendingRemovals ?? []).filter((id) => snap.sessions.some((s) => s.id === id));
  if (pending.length) {
    snap.sessions = snap.sessions.filter((s) => !pending.includes(s.id));
    snap.trades = snap.trades.filter((t) => !pending.includes(t.sessionId));
  }
  writeAtomic(userFile(user.id), JSON.stringify(snap));
  idx()[user.id] = { hash, syncedAt: Date.now(), ip: ctx.ip, userAgent: ctx.userAgent, sessions: summarizeSessions(snap), pendingRemovals: pending };
  saveIndex();
  return { needData: false, remove: pending };
}

export function adminBacktests(q: BacktestQuery): Page<AdminBacktestRow> & { users: number; open: number } {
  const users = new Map(db().users.map((u) => [u.id, u]));
  const rows: AdminBacktestRow[] = [];
  for (const [userId, e] of Object.entries(idx())) {
    const u = users.get(userId);
    if (u) for (const s of e.sessions) rows.push({ ...s, userId, userName: u.name, phone: u.phone, syncedAt: e.syncedAt, ip: e.ip });
  }
  return { ...queryBacktestRows(rows, q), users: new Set(rows.map((r) => r.userId)).size, open: rows.reduce((n, r) => n + r.open, 0) };
}

export function adminBacktestDetail(userId: string): AdminBacktestDetail {
  const u = db().users.find((x) => x.id === userId);
  if (!u) throw notFound('کاربر پیدا نشد.');
  const e = idx()[userId];
  return {
    user: { id: u.id, name: u.name, phone: u.phone, planId: u.planId, status: u.status, lastLoginAt: u.lastLoginAt, lastIp: u.lastIp },
    syncedAt: e?.syncedAt ?? 0,
    ip: e?.ip,
    userAgent: e?.userAgent,
    snapshot: e ? readSnapshot(userId) : { sessions: [], trades: [], strategies: [] },
    pendingRemovals: e?.pendingRemovals ?? [],
  };
}

/** Deletes a session (with its orders and positions) here and, at its next sync, in the user's app. */
export function adminDeleteSession(userId: string, sessionId: string): BacktestSessionSummary {
  const e = idx()[userId];
  const s = e?.sessions.find((x) => x.id === sessionId);
  if (!e || !s) throw notFound('جلسه پیدا نشد.');
  const snap = readSnapshot(userId);
  snap.sessions = snap.sessions.filter((x) => x.id !== sessionId);
  snap.trades = snap.trades.filter((t) => t.sessionId !== sessionId);
  writeAtomic(userFile(userId), JSON.stringify(snap));
  e.sessions = e.sessions.filter((x) => x.id !== sessionId);
  if (!e.pendingRemovals.includes(sessionId)) e.pendingRemovals.push(sessionId);
  saveIndex();
  return s;
}

/** A deleted account's copy goes too. */
export function dropBacktests(userId: string) {
  if (!idx()[userId]) return;
  delete idx()[userId];
  rmSync(userFile(userId), { force: true });
  saveIndex();
}
