import { createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readSync, closeSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from './config';
import { FileReply, HttpError, badRequest, notFound, type Ctx } from './http';
import type { AccountUser } from './shared';
import { storeBacktestCopy } from './backtests';
import { cleanSnapshot } from '../../src/services/backtests';
import {
  WS_COLLECTIONS,
  applyPatch,
  cleanPatch,
  emptyWorkspace,
  isEmptyPatch,
  screenshotIds,
  workspaceTooBig,
  type WorkspaceData,
  type WorkspacePatch,
  type WorkspaceReply,
  type WsCollection,
} from '../../src/services/workspace';

/**
 * Each user's own data (sessions, trades with journals, strategies, checklists, practice time,
 * preferences), so they find it in every browser and on every device. The app sends what changed
 * since the revision it last saw (POST /api/me/workspace) and reads the copy when another device
 * changed it (GET /api/me/workspace); see src/services/workspace.ts for how changes are merged.
 *
 * Kept in DATA_DIR/workspaces/<user>.json, with the chart drawings of each session in
 * DATA_DIR/layouts/<user>/<session>.json and journal screenshots in DATA_DIR/shots/<user>/.
 * The admin panel's copy of the user's backtests (backtests.ts) is refreshed from it.
 */

interface WorkspaceDoc {
  v: 1;
  rev: number;
  updatedAt: number;
  data: WorkspaceData;
  /** Deleted items: id → revision it was deleted at. A change sent from an older revision does not bring it back. */
  removed: Partial<Record<WsCollection, Record<string, number>>>;
  /** Ids of the last changes applied (a resent change is not applied twice). */
  pids: string[];
  ip?: string;
  userAgent?: string;
}

const MAX_REMOVED = 5000;
const MAX_PIDS = 40;
const CACHE_SIZE = 64;
const FLUSH_MS = 1500;

const safeId = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '');
const WS_DIR = () => join(config.dataDir, 'workspaces');
const wsFile = (userId: string) => join(WS_DIR(), `${safeId(userId)}.json`);
const LAYOUT_DIR = (userId: string) => join(config.dataDir, 'layouts', safeId(userId));
const SHOT_DIR = (userId: string) => join(config.dataDir, 'shots', safeId(userId));

function writeAtomic(file: string, data: string) {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

// Recently used copies stay in memory; changes are written a moment later (and on shutdown).
const cache = new Map<string, WorkspaceDoc>();
const dirty = new Set<string>();
let timer: NodeJS.Timeout | null = null;

function load(userId: string): WorkspaceDoc | null {
  const hit = cache.get(userId);
  if (hit) {
    cache.delete(userId);
    cache.set(userId, hit);
    return hit;
  }
  let doc: WorkspaceDoc | null = null;
  try {
    if (existsSync(wsFile(userId))) {
      const raw = JSON.parse(readFileSync(wsFile(userId), 'utf8'));
      doc = { v: 1, rev: raw.rev ?? 0, updatedAt: raw.updatedAt ?? 0, data: { ...emptyWorkspace(), ...raw.data }, removed: raw.removed ?? {}, pids: raw.pids ?? [], ip: raw.ip, userAgent: raw.userAgent };
    }
  } catch (e) {
    console.error(`[workspace] cannot read ${wsFile(userId)}:`, (e as Error).message);
    throw new HttpError(500, 'error', 'خواندن داده‌های حساب انجام نشد. دوباره تلاش کنید.');
  }
  if (doc) remember(userId, doc);
  return doc;
}

function remember(userId: string, doc: WorkspaceDoc) {
  cache.delete(userId);
  cache.set(userId, doc);
  for (const id of cache.keys()) {
    if (cache.size <= CACHE_SIZE) break;
    if (!dirty.has(id)) cache.delete(id);
  }
}

function changed(userId: string, doc: WorkspaceDoc) {
  remember(userId, doc);
  dirty.add(userId);
  if (!timer) timer = setTimeout(flushWorkspaces, FLUSH_MS);
}

/** Writes changed copies now (also called on shutdown), with the admin panel's copy and old screenshots tidied. */
export function flushWorkspaces() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!dirty.size) return;
  mkdirSync(WS_DIR(), { recursive: true });
  for (const userId of [...dirty]) {
    dirty.delete(userId);
    const doc = cache.get(userId);
    if (!doc) continue;
    try {
      writeAtomic(wsFile(userId), JSON.stringify(doc));
      storeBacktestCopy(userId, cleanSnapshot(doc.data), { syncedAt: doc.updatedAt, ip: doc.ip, userAgent: doc.userAgent });
      tidyShots(userId, doc.data);
    } catch (e) {
      console.error(`[workspace] cannot save ${userId}:`, (e as Error).message);
      dirty.add(userId);
    }
  }
}

const REV = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : -1);
const PID = /^[A-Za-z0-9_-]{6,40}$/;

/** GET /api/me/workspace?rev=N: the copy, or `unchanged` when it is still at revision N. */
export function getWorkspace(user: AccountUser, knownRev: string | null): WorkspaceReply {
  const doc = load(user.id);
  if (!doc) return { rev: 0, data: null, pids: [] };
  if (knownRev !== null && Number(knownRev) === doc.rev) return { rev: doc.rev, unchanged: true, pids: doc.pids };
  return { rev: doc.rev, data: doc.data, pids: doc.pids };
}

function apply(userId: string, doc: WorkspaceDoc, patch: WorkspacePatch, baseRev: number, meta: { pid?: string; ip?: string; userAgent?: string }): WorkspaceDoc {
  const removedAt = (c: WsCollection, id: string | undefined) => (id ? (doc.removed[c]?.[id] ?? 0) : 0);
  // an item deleted after the revision the sender knew is not brought back by its change
  const skip = (c: WsCollection, item: { id: string; sessionId?: string }) => removedAt(c, item.id) > baseRev || (c === 'trades' && removedAt('sessions', item.sessionId) > baseRev);
  const data = applyPatch(doc.data, patch, { skip });
  const tooBig = workspaceTooBig(data);
  if (tooBig) throw new HttpError(413, 'too_large', 'حجم داده‌های حساب از حد مجاز بیشتر شده است. چند جلسه‌ی قدیمی را حذف کنید.');
  const rev = doc.rev + 1;
  const removed = { ...doc.removed };
  for (const c of WS_COLLECTIONS) {
    const rm = patch.remove?.[c] ?? [];
    const up = (patch.upsert?.[c] ?? []) as { id: string; sessionId?: string }[];
    if (!rm.length && !up.length) continue;
    const m = { ...removed[c] };
    for (const item of up) if (!skip(c, item)) delete m[item.id];
    for (const id of rm) m[id] = rev;
    const ids = Object.keys(m);
    if (ids.length > MAX_REMOVED) for (const id of ids.sort((a, b) => m[a] - m[b]).slice(0, ids.length - MAX_REMOVED)) delete m[id];
    removed[c] = m;
  }
  const next: WorkspaceDoc = {
    v: 1,
    rev,
    updatedAt: Date.now(),
    data,
    removed,
    pids: meta.pid ? [...doc.pids, meta.pid].slice(-MAX_PIDS) : doc.pids,
    ip: meta.ip ?? doc.ip,
    userAgent: meta.userAgent ?? doc.userAgent,
  };
  changed(userId, next);
  // a deleted session's chart drawings go with it
  for (const id of patch.remove?.sessions ?? []) rmSync(join(LAYOUT_DIR(userId), `${safeId(id)}.json`), { force: true });
  return next;
}

const newDoc = (): WorkspaceDoc => ({ v: 1, rev: 0, updatedAt: 0, data: emptyWorkspace(), removed: {}, pids: [] });

/**
 * POST /api/me/workspace { baseRev, pid, patch }: applies a browser's changes. The whole copy comes
 * back when it had changed since `baseRev` (another device), so the browser can put its changes on top.
 */
export function patchWorkspace(ctx: Ctx, user: AccountUser): WorkspaceReply {
  const baseRev = REV(ctx.body?.baseRev);
  if (baseRev < 0) throw badRequest('invalid', 'نسخه‌ی داده‌ها معتبر نیست.');
  const pid = String(ctx.body?.pid ?? '');
  if (!PID.test(pid)) throw badRequest('invalid', 'شناسه‌ی تغییر معتبر نیست.');
  const doc = load(user.id) ?? newDoc();
  // sent again (the answer was lost on the way): already applied
  if (doc.pids.includes(pid)) return { rev: doc.rev, data: doc.data, pids: doc.pids };
  const patch = cleanPatch(ctx.body?.patch);
  if (isEmptyPatch(patch)) return doc.rev === baseRev ? { rev: doc.rev, pids: doc.pids } : { rev: doc.rev, data: doc.data, pids: doc.pids };
  const next = apply(user.id, doc, patch, baseRev, { pid, ip: ctx.ip, userAgent: ctx.userAgent });
  return doc.rev === baseRev ? { rev: next.rev, pids: next.pids } : { rev: next.rev, data: next.data, pids: next.pids };
}

/**
 * An admin deleted sessions: they leave the user's copy (and so every device of theirs) with their
 * trades. Returns the names of the sessions removed.
 */
export function removeWorkspaceSessions(userId: string, sessionIds: string[]): string[] {
  const doc = load(userId);
  if (!doc) return [];
  const ids = new Set(sessionIds);
  const found = doc.data.sessions.filter((s) => ids.has(s.id));
  if (!found.length) return [];
  const trades = doc.data.trades.filter((t) => ids.has(t.sessionId)).map((t) => t.id);
  apply(userId, doc, { remove: { sessions: found.map((s) => s.id), trades } }, doc.rev, {});
  return found.map((s) => s.name);
}

/** A deleted account's data goes too. */
export function dropWorkspace(userId: string) {
  cache.delete(userId);
  dirty.delete(userId);
  rmSync(wsFile(userId), { force: true });
  rmSync(LAYOUT_DIR(userId), { recursive: true, force: true });
  rmSync(SHOT_DIR(userId), { recursive: true, force: true });
}

// ---------- chart drawings and indicators, per session and chart pane ----------

type LayoutEntry = { at: number; data: unknown };
const LAYOUT_KEY = /^(tv|lw):[A-Za-z0-9_.:-]{1,120}$/;
const SESSION_ID = /^[A-Za-z0-9_.-]{1,80}$/;
const MAX_LAYOUT_BYTES = 3_000_000;
const MAX_LAYOUTS_PER_SESSION = 24;

const layoutFile = (userId: string, sessionId: string) => {
  if (!SESSION_ID.test(sessionId)) throw badRequest('invalid', 'شناسه‌ی جلسه معتبر نیست.');
  return join(LAYOUT_DIR(userId), `${safeId(sessionId)}.json`);
};

function readLayouts(file: string): Record<string, LayoutEntry> {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  } catch {
    return {};
  }
}

/** GET /api/me/layouts/:sessionId: the session's saved charts, by `tv:<pane key>` / `lw:<pane key>`. */
export function getLayouts(user: AccountUser, sessionId: string): { items: Record<string, LayoutEntry> } {
  return { items: readLayouts(layoutFile(user.id, sessionId)) };
}

/** PUT /api/me/layouts/:sessionId { key, at, data }: saves one chart's drawings unless the server has a newer save. */
export function putLayout(ctx: Ctx, user: AccountUser): { key: string; at: number; stored: boolean; data?: unknown } {
  const sessionId = ctx.params.sessionId;
  const file = layoutFile(user.id, sessionId);
  const key = String(ctx.body?.key ?? '');
  if (!LAYOUT_KEY.test(key)) throw badRequest('invalid', 'کلید چارت معتبر نیست.');
  const at = Number(ctx.body?.at);
  if (!Number.isFinite(at) || at <= 0) throw badRequest('invalid', 'زمان ذخیره معتبر نیست.');
  const data = ctx.body?.data;
  if (!data || typeof data !== 'object') throw badRequest('invalid', 'داده‌ی چارت معتبر نیست.');
  if (JSON.stringify(data).length > MAX_LAYOUT_BYTES) throw new HttpError(413, 'too_large', 'ترسیم‌های این چارت بیش از حد بزرگ است.');
  // only sessions the user has (a deleted session's drawings are not saved again)
  const doc = load(user.id);
  if (!doc?.data.sessions.some((s) => s.id === sessionId)) throw notFound('جلسه پیدا نشد.');
  const items = readLayouts(file);
  const prev = items[key];
  if (prev && prev.at > at) return { key, at: prev.at, stored: false, data: prev.data };
  if (!prev && Object.keys(items).length >= MAX_LAYOUTS_PER_SESSION) throw badRequest('too_many', 'تعداد چارت‌های ذخیره‌شده‌ی این جلسه زیاد است.');
  items[key] = { at, data };
  mkdirSync(LAYOUT_DIR(user.id), { recursive: true });
  writeAtomic(file, JSON.stringify(items));
  return { key, at, stored: true };
}

// ---------- journal screenshots ----------

const SHOT_ID = /^shot_[a-z0-9]{4,40}$/;
const SHOT_TYPES: Record<string, string> = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_SHOT_BYTES = 6_000_000;
const MAX_SHOTS = 5000;
/** Pictures no journal uses are deleted after this long (a journal being written may not be saved yet). */
const UNUSED_SHOT_MS = 2 * 86_400_000;
const lastTidy = new Map<string, number>();

const shotPath = (userId: string, id: string) => {
  if (!SHOT_ID.test(id)) throw badRequest('invalid', 'شناسه‌ی تصویر معتبر نیست.');
  return join(SHOT_DIR(userId), id);
};

/** PUT /api/me/shots/:id: the picture in the body (JPEG, PNG or WebP). */
export async function putShot(ctx: Ctx, user: AccountUser): Promise<{ id: string; size: number }> {
  const id = ctx.params.id;
  const file = shotPath(user.id, id);
  const mime = String(ctx.req.headers['content-type'] ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!SHOT_TYPES[mime]) throw badRequest('type', 'فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود.');
  const tooBig = () => new HttpError(413, 'too_large', 'حجم تصویر بیش از حد مجاز است.');
  if (Number(ctx.req.headers['content-length'] ?? 0) > MAX_SHOT_BYTES) throw tooBig();
  mkdirSync(SHOT_DIR(user.id), { recursive: true });
  if (!existsSync(file) && readdirSync(SHOT_DIR(user.id)).length >= MAX_SHOTS) throw badRequest('too_many', 'تعداد تصاویر ژورنال به حداکثر رسیده است.');
  const tmp = `${file}.${process.pid}.part`;
  let size = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      done(size > MAX_SHOT_BYTES ? tooBig() : null, chunk);
    },
  });
  try {
    await pipeline(ctx.req, counter, createWriteStream(tmp));
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e instanceof HttpError ? e : badRequest('upload', 'ارسال تصویر کامل نشد؛ دوباره تلاش کنید.');
  }
  if (!size || !imageType(tmp)) {
    rmSync(tmp, { force: true });
    throw badRequest('type', 'این فایل تصویر نیست.');
  }
  renameSync(tmp, file);
  return { id, size };
}

/** The picture's type from its first bytes. */
function imageType(file: string): string | null {
  const head = Buffer.alloc(12);
  const fd = openSync(file, 'r');
  try {
    readSync(fd, head, 0, 12, 0);
  } finally {
    closeSync(fd);
  }
  if (head[0] === 0xff && head[1] === 0xd8) return 'image/jpeg';
  if (head.subarray(0, 4).toString('latin1') === '\x89PNG') return 'image/png';
  if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

/** GET /api/me/shots/:id */
export function getShot(user: AccountUser, id: string): FileReply {
  const file = shotPath(user.id, id);
  if (!existsSync(file)) throw notFound('تصویر پیدا نشد.');
  return new FileReply(file, statSync(file).size, {
    'Content-Type': imageType(file) ?? 'application/octet-stream',
    // a screenshot never changes under its id
    'Cache-Control': 'private, max-age=31536000, immutable',
  });
}

/** DELETE /api/me/shots/:id */
export function deleteShot(user: AccountUser, id: string) {
  rmSync(shotPath(user.id, id), { force: true });
}

/** Deletes pictures no journal uses any more (at most every few hours per user). */
function tidyShots(userId: string, data: WorkspaceData) {
  const now = Date.now();
  if (now - (lastTidy.get(userId) ?? 0) < 6 * 3_600_000) return;
  lastTidy.set(userId, now);
  const dir = SHOT_DIR(userId);
  if (!existsSync(dir)) return;
  const used = screenshotIds(data);
  for (const name of readdirSync(dir)) {
    if (used.has(name)) continue;
    const file = join(dir, name);
    try {
      if (now - statSync(file).mtimeMs > UNUSED_SHOT_MS) rmSync(file, { force: true });
    } catch {
      /* gone already */
    }
  }
}
