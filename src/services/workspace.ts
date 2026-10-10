import type { Checklist, GoToPreset, NewsFilters, Session, Strategy, Trade } from '../lib/types';

/**
 * A user's own data: sessions, orders and positions (with their journals), strategies, checklists,
 * practice time and preferences. The API server keeps it per account, so it is the same in every
 * browser and on every device; each browser keeps a working copy.
 *
 * A browser remembers what the server had when they last agreed (`WorkspaceBase`: the revision and a
 * fingerprint of every item), sends only what changed since then (`WorkspacePatch`), and puts its own
 * unsent changes on top of a newer server copy (`rebase`). Items are merged one by one; times add up
 * (practice on two devices counts twice); a deleted item stays deleted.
 *
 * Shared by the app (services/workspaceSync) and the API server (server/src/workspace.ts).
 */

export const WS_COLLECTIONS = ['sessions', 'trades', 'strategies', 'checklists', 'goToPresets'] as const;
export type WsCollection = (typeof WS_COLLECTIONS)[number];

/** Collections that list the newest first: new items go to the top, the others take them at the end. */
const NEWEST_FIRST: ReadonlySet<WsCollection> = new Set(['sessions', 'strategies', 'checklists']);

export const WS_LIMITS: Record<WsCollection, number> = { sessions: 500, trades: 20_000, strategies: 200, checklists: 200, goToPresets: 100 };
/** Largest stored copy (JSON). */
export const WS_MAX_BYTES = 24_000_000;

export interface WorkspacePrefs {
  /** Profile picture (a small JPEG data URL). */
  avatar?: string;
  theme?: 'dark' | 'light';
  newsFilters?: NewsFilters;
  /** The sample data is loaded. */
  hasDemoData?: boolean;
}
export const WS_PREFS = ['avatar', 'theme', 'newsFilters', 'hasDemoData'] as const satisfies readonly (keyof WorkspacePrefs)[];
export type WsPref = (typeof WS_PREFS)[number];

export interface WorkspaceData {
  sessions: Session[];
  trades: Trade[];
  strategies: Strategy[];
  checklists: Checklist[];
  goToPresets: GoToPreset[];
  /** Practice seconds per local day. */
  dailySeconds: Record<string, number>;
  /** Market time stepped through on the chart. */
  replayedMs: number;
  prefs: WorkspacePrefs;
}

export interface WorkspacePatch {
  /** New and changed items (whole items). */
  upsert?: { [K in WsCollection]?: WorkspaceData[K] };
  /** Ids of deleted items. */
  remove?: { [K in WsCollection]?: string[] };
  /** Added to the counters, so time spent on several devices adds up (negative after clearing). */
  add?: { dailySeconds?: Record<string, number>; replayedMs?: number };
  /** Preferences set; null clears one. */
  prefs?: { [K in WsPref]?: WorkspacePrefs[K] | null };
}

/** What a browser last knew of the server's copy: its revision, a fingerprint per item, the counters. */
export interface WorkspaceBase {
  rev: number;
  items: Record<WsCollection, Record<string, string>>;
  dailySeconds: Record<string, number>;
  replayedMs: number;
  prefs: Partial<Record<WsPref, string>>;
}

/** GET /api/me/workspace and POST /api/me/workspace answer with this. */
export interface WorkspaceReply {
  rev: number;
  /** The whole copy: when it changed since the revision the browser named (null: nothing saved yet). */
  data?: WorkspaceData | null;
  /** The copy is still at the revision the browser named. */
  unchanged?: boolean;
  /** Ids of the last changes applied, so a browser can tell whether a change it sent arrived. */
  pids: string[];
}

export const emptyWorkspace = (): WorkspaceData => ({
  sessions: [],
  trades: [],
  strategies: [],
  checklists: [],
  goToPresets: [],
  dailySeconds: {},
  replayedMs: 0,
  prefs: {},
});

export const emptyBase = (): WorkspaceBase => ({
  rev: 0,
  items: { sessions: {}, trades: {}, strategies: {}, checklists: {}, goToPresets: {} },
  dailySeconds: {},
  replayedMs: 0,
  prefs: {},
});

// ---------- fingerprints ----------

/** JSON with sorted keys (undefined left out, as JSON.stringify does), so equal items always print the same. */
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined || typeof x === 'function' ? 'null' : stable(x))).join(',')}]`;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o)
    .filter((k) => o[k] !== undefined && typeof o[k] !== 'function')
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`;
}

/** FNV-1a in two lanes, printed short. */
function hash(s: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 13);
  }
  return (a >>> 0).toString(36) + '.' + (b >>> 0).toString(36);
}

// The app's items are never changed in place (the store replaces them), so a fingerprint is worked out once per object.
const cache = new WeakMap<object, string>();
export function fingerprint(v: unknown): string {
  if (v === null || typeof v !== 'object') return hash(stable(v));
  let f = cache.get(v);
  if (f === undefined) {
    f = hash(stable(v));
    cache.set(v, f);
  }
  return f;
}

export function baseOf(data: WorkspaceData, rev: number): WorkspaceBase {
  const base = emptyBase();
  base.rev = rev;
  for (const c of WS_COLLECTIONS) {
    const m = base.items[c];
    for (const item of data[c]) m[item.id] = fingerprint(item);
  }
  base.dailySeconds = { ...data.dailySeconds };
  base.replayedMs = data.replayedMs;
  for (const k of WS_PREFS) if (data.prefs[k] !== undefined) base.prefs[k] = fingerprint(data.prefs[k]);
  return base;
}

// ---------- changes ----------

export const isEmptyPatch = (p: WorkspacePatch) => !p.upsert && !p.remove && !p.add && !p.prefs;

/** No data of the user's own (preferences aside): a browser that has not been used with this account yet. */
export const isEmptyWorkspace = (d: WorkspaceData) =>
  WS_COLLECTIONS.every((c) => d[c].length === 0) && Object.keys(d.dailySeconds).length === 0 && !d.replayedMs && !d.prefs.avatar;

/** What changed in `data` since `base`, or null when nothing did. */
export function diffWorkspace(base: WorkspaceBase, data: WorkspaceData): WorkspacePatch | null {
  const patch: WorkspacePatch = {};
  for (const c of WS_COLLECTIONS) {
    const known = base.items[c] ?? {};
    const seen = new Set<string>();
    const up: { id: string }[] = [];
    for (const item of data[c]) {
      seen.add(item.id);
      if (known[item.id] !== fingerprint(item)) up.push(item);
    }
    const rm = Object.keys(known).filter((id) => !seen.has(id));
    if (up.length) (patch.upsert ??= {})[c] = up as never;
    if (rm.length) (patch.remove ??= {})[c] = rm;
  }
  const days: Record<string, number> = {};
  for (const d of new Set([...Object.keys(base.dailySeconds), ...Object.keys(data.dailySeconds)])) {
    const delta = (data.dailySeconds[d] ?? 0) - (base.dailySeconds[d] ?? 0);
    if (delta) days[d] = delta;
  }
  const replayed = data.replayedMs - base.replayedMs;
  if (Object.keys(days).length) (patch.add ??= {}).dailySeconds = days;
  if (replayed) (patch.add ??= {}).replayedMs = replayed;
  for (const k of WS_PREFS) {
    const v = data.prefs[k];
    if ((v === undefined ? undefined : fingerprint(v)) !== base.prefs[k]) (patch.prefs ??= {})[k] = (v ?? null) as never;
  }
  return isEmptyPatch(patch) ? null : patch;
}

export interface ApplyOptions {
  /** Leave out an item being added or changed (the server: items deleted after the sender's revision). */
  skip?: (c: WsCollection, item: { id: string; sessionId?: string }) => boolean;
}

/** `data` with `patch` applied (a new object; `data` is left as it was). */
export function applyPatch(data: WorkspaceData, patch: WorkspacePatch, opts: ApplyOptions = {}): WorkspaceData {
  const out: WorkspaceData = { ...data, prefs: { ...data.prefs } };
  for (const c of WS_COLLECTIONS) {
    const rm = new Set(patch.remove?.[c] ?? []);
    const up = ((patch.upsert?.[c] ?? []) as { id: string }[]).filter((item) => !rm.has(item.id) && !opts.skip?.(c, item));
    if (!rm.size && !up.length) continue;
    const changed = new Map(up.map((item) => [item.id, item]));
    const list: { id: string }[] = [];
    for (const item of data[c] as { id: string }[]) {
      if (rm.has(item.id)) continue;
      const next = changed.get(item.id);
      list.push(next ?? item);
      changed.delete(item.id);
    }
    const added = [...changed.values()];
    (out as any)[c] = NEWEST_FIRST.has(c) ? [...added, ...list] : [...list, ...added];
  }
  // every trade belongs to a session: a session deleted on one device takes its trades with it everywhere
  const sessionIds = new Set(out.sessions.map((s) => s.id));
  if (out.trades.some((t) => !sessionIds.has(t.sessionId))) out.trades = out.trades.filter((t) => sessionIds.has(t.sessionId));

  if (patch.add?.dailySeconds) {
    const days = { ...data.dailySeconds };
    for (const [d, s] of Object.entries(patch.add.dailySeconds)) {
      const v = (days[d] ?? 0) + s;
      if (v > 0) days[d] = v;
      else delete days[d];
    }
    out.dailySeconds = days;
  }
  if (patch.add?.replayedMs) out.replayedMs = Math.max(0, data.replayedMs + patch.add.replayedMs);
  for (const k of WS_PREFS) {
    if (!patch.prefs || !(k in patch.prefs)) continue;
    const v = patch.prefs[k];
    if (v === null || v === undefined) delete out.prefs[k];
    else (out.prefs as any)[k] = v;
  }
  return out;
}

/**
 * The changes a browser sends the first time it syncs with an account (it has no base): all its items
 * and times, and the preferences the server does not have yet. A browser with no data of its own sends
 * nothing and takes the server's copy.
 */
export function firstSyncPatch(server: WorkspaceData, local: WorkspaceData): WorkspacePatch | null {
  if (isEmptyWorkspace(local)) return null;
  const patch = diffWorkspace(emptyBase(), local);
  if (patch?.prefs) {
    for (const k of WS_PREFS) if (server.prefs[k] !== undefined) delete patch.prefs[k];
    if (!Object.keys(patch.prefs).length) delete patch.prefs;
  }
  return patch && !isEmptyPatch(patch) ? patch : null;
}

/**
 * This browser's unsent changes (since `base`) put on top of a newer server copy. An item deleted on
 * the server since `base` stays deleted even when it was also changed here. Without a base, this is
 * the first sync: the two sides are combined (see firstSyncPatch).
 */
export function rebase(server: WorkspaceData, local: WorkspaceData, base: WorkspaceBase | null): WorkspaceData {
  const pending = base ? diffWorkspace(base, local) : firstSyncPatch(server, local);
  if (!pending) return server;
  if (base && pending.upsert) {
    for (const c of WS_COLLECTIONS) {
      const up = pending.upsert[c] as { id: string }[] | undefined;
      if (!up) continue;
      const onServer = new Set((server[c] as { id: string }[]).map((x) => x.id));
      (pending.upsert as any)[c] = up.filter((item) => !(item.id in base.items[c]) || onServer.has(item.id));
    }
  }
  return applyPatch(server, pending);
}

// ---------- checking what a browser sends (server) ----------

const ID = /^[A-Za-z0-9_.:-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function validItem(c: WsCollection, v: unknown): boolean {
  if (!isObj(v) || !isId(v.id)) return false;
  if (c === 'trades' && !isId(v.sessionId)) return false;
  return true;
}

function cleanNewsFilters(v: unknown): NewsFilters | undefined {
  if (!isObj(v)) return undefined;
  const strings = (a: unknown, max: number) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && x.length <= 12).slice(0, max) : []);
  return {
    currencies: strings(v.currencies, 30),
    showPast: v.showPast !== false,
    showFuture: v.showFuture !== false,
    impacts: strings(v.impacts, 4).filter((x) => ['high', 'medium', 'low', 'holiday'].includes(x)) as NewsFilters['impacts'],
  };
}

function cleanPref(k: WsPref, v: unknown): unknown {
  if (v === null) return null;
  switch (k) {
    case 'avatar':
      return typeof v === 'string' && v.startsWith('data:image/') && v.length <= 400_000 ? v : undefined;
    case 'theme':
      return v === 'dark' || v === 'light' ? v : undefined;
    case 'newsFilters':
      return cleanNewsFilters(v);
    case 'hasDemoData':
      return typeof v === 'boolean' ? v : undefined;
  }
}

/** A patch from a browser in a known shape: unknown fields and malformed items are left out. */
export function cleanPatch(raw: any): WorkspacePatch {
  const patch: WorkspacePatch = {};
  for (const c of WS_COLLECTIONS) {
    const up = raw?.upsert?.[c];
    if (Array.isArray(up)) {
      const items = up.filter((v) => validItem(c, v)).slice(0, WS_LIMITS[c]);
      if (items.length) (patch.upsert ??= {})[c] = items as never;
    }
    const rm = raw?.remove?.[c];
    if (Array.isArray(rm)) {
      const ids = rm.filter(isId).slice(0, WS_LIMITS[c] * 2);
      if (ids.length) (patch.remove ??= {})[c] = ids;
    }
  }
  const days = raw?.add?.dailySeconds;
  if (isObj(days)) {
    const clean: Record<string, number> = {};
    for (const [d, s] of Object.entries(days).slice(0, 5000)) if (DAY.test(d) && typeof s === 'number' && Number.isFinite(s)) clean[d] = Math.round(s);
    if (Object.keys(clean).length) (patch.add ??= {}).dailySeconds = clean;
  }
  const replayed = raw?.add?.replayedMs;
  if (typeof replayed === 'number' && Number.isFinite(replayed) && replayed) (patch.add ??= {}).replayedMs = Math.round(replayed);
  if (isObj(raw?.prefs)) {
    for (const k of WS_PREFS) {
      if (!(k in raw.prefs)) continue;
      const v = cleanPref(k, raw.prefs[k]);
      if (v !== undefined) (patch.prefs ??= {})[k] = v as never;
    }
  }
  return patch;
}

/** Why a copy is too big to keep, or null when it fits. */
export function workspaceTooBig(d: WorkspaceData): string | null {
  for (const c of WS_COLLECTIONS) if (d[c].length > WS_LIMITS[c]) return c;
  return JSON.stringify(d).length > WS_MAX_BYTES ? 'size' : null;
}

/** Screenshot ids the journals use (to keep their pictures on the server). */
export function screenshotIds(d: Pick<WorkspaceData, 'trades'>): Set<string> {
  const ids = new Set<string>();
  for (const t of d.trades) for (const s of t.journal?.screenshots ?? []) if (typeof s === 'string' && !s.startsWith('data:')) ids.add(s);
  return ids;
}
