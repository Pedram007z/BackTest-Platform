import { create } from 'zustand';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';
import { backend, BackendError } from '.';
import { flushLayouts } from './layoutSync';
import { flushShots, moveInlineShots } from '../lib/shots';
import { baseOf, diffWorkspace, emptyWorkspace, isEmptyWorkspace, rebase, type WorkspaceBase, type WorkspaceData } from './workspace';

/**
 * Keeps the signed-in user's data (sessions, trades and journals, strategies, checklists, practice
 * time, preferences) on the API server, so it is the same in every browser and on every device.
 *
 * The browser works on its own copy (the store, saved in localStorage) and remembers what the server
 * had when they last agreed (`sync.base`). On every page load it asks whether the server's copy moved
 * on (another device changed it) and, if so, puts its own unsent changes on top of it. Changes are
 * sent a moment after they are made (and when the page is left or hidden). A change whose answer was
 * lost is recognised by its id, so nothing is applied twice. See services/workspace.ts for the rules.
 */

export type SyncState = 'off' | 'loading' | 'syncing' | 'saved' | 'offline' | 'error';

interface SyncStatus {
  state: SyncState;
  /** Last time this browser and the server agreed. */
  savedAt: number;
  message?: string;
  /** This browser has no data for the account yet and is fetching it (pages wait for it). */
  firstLoad: boolean;
}

/** A signed-in browser that has nothing of the account yet waits for the server's copy before showing pages. */
function startsEmpty() {
  const s = useAuth.getState().session;
  if (backend.mode !== 'server' || !s || s.demo || useStore.getState().sync?.base) return false;
  return isEmptyWorkspace(readLocal());
}

export const useSyncStatus = create<SyncStatus>(() => ({ state: 'off', savedAt: 0, firstLoad: startsEmpty() }));
const status = (patch: Partial<SyncStatus>) => useSyncStatus.setState(patch);

const QUIET_MS = 1_500;
const MAX_WAIT_MS = 10_000;
/** Ask the server for other devices' changes this often while the page is open. */
const PULL_EVERY_MS = 120_000;
/** keepalive requests (sent as the page closes) are limited to 64 KB by browsers. */
const KEEPALIVE_MAX = 60_000;

let started = false;
let userId: string | null = null;
let busy = false;
let again = false;
let pulled = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let firstChange = 0;
let retryMs = 0;

const newPid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function readLocal(): WorkspaceData {
  const s = useStore.getState();
  return {
    sessions: s.sessions,
    trades: s.trades,
    strategies: s.strategies,
    checklists: s.checklists,
    goToPresets: s.goToPresets,
    dailySeconds: s.dailySeconds,
    replayedMs: s.replayedMs,
    prefs: { avatar: s.user.avatar, theme: s.theme, newsFilters: s.newsFilters, hasDemoData: s.hasDemoData },
  };
}

function writeLocal(d: WorkspaceData, base: WorkspaceBase) {
  useStore.setState((s) => ({
    sessions: d.sessions,
    trades: d.trades,
    strategies: d.strategies,
    checklists: d.checklists,
    goToPresets: d.goToPresets,
    dailySeconds: d.dailySeconds,
    replayedMs: d.replayedMs,
    theme: d.prefs.theme ?? s.theme,
    newsFilters: d.prefs.newsFilters ?? s.newsFilters,
    hasDemoData: d.prefs.hasDemoData ?? false,
    user: { ...s.user, avatar: d.prefs.avatar },
    sync: { base },
  }));
}

/** Whether a store change touched the data kept on the server. */
function dataChanged(s: ReturnType<typeof useStore.getState>, p: ReturnType<typeof useStore.getState>) {
  return (
    s.sessions !== p.sessions ||
    s.trades !== p.trades ||
    s.strategies !== p.strategies ||
    s.checklists !== p.checklists ||
    s.goToPresets !== p.goToPresets ||
    s.dailySeconds !== p.dailySeconds ||
    s.replayedMs !== p.replayedMs ||
    s.theme !== p.theme ||
    s.newsFilters !== p.newsFilters ||
    s.hasDemoData !== p.hasDemoData ||
    s.user.avatar !== p.user.avatar
  );
}

/** Takes the server's copy, keeping the changes made here that it does not have yet. */
async function pull() {
  const meta = useStore.getState().sync;
  const base = meta?.base ?? null;
  const res = await backend.workspace(base && !meta?.inflight ? base.rev : undefined);
  pulled = Date.now();
  if (res.unchanged) return;
  let known = base;
  // a change sent from here whose answer was lost: if it arrived, the server's copy already has it
  if (meta?.inflight && res.pids.includes(meta.inflight.pid)) known = meta.inflight.base;
  // the server's copy is older than what this browser saw (restored from a backup): everything here is offered again
  if (base && res.rev < base.rev) known = null;
  const server = res.data ?? emptyWorkspace();
  writeLocal(rebase(server, readLocal(), known), baseOf(server, res.rev));
}

/** Sends the changes made since the last agreement. */
async function push(keepalive = false): Promise<boolean> {
  const base = useStore.getState().sync?.base;
  if (!base) return false;
  const local = readLocal();
  const patch = diffWorkspace(base, local);
  if (!patch) return false;
  const pid = newPid();
  const input = { baseRev: base.rev, pid, patch };
  if (keepalive && JSON.stringify(input).length > KEEPALIVE_MAX) return false;
  const sent = baseOf(local, base.rev);
  // remembered (and saved) before sending, in case the answer never comes back
  useStore.setState({ sync: { base, inflight: { pid, base: sent } } });
  if (!keepalive) status({ state: 'syncing' });
  const res = await backend.saveWorkspace(input, { keepalive });
  if (res.data) {
    // another device changed it too: what changed here meanwhile goes on top of the new copy
    writeLocal(rebase(res.data, readLocal(), sent), baseOf(res.data, res.rev));
  } else {
    useStore.setState({ sync: { base: { ...sent, rev: res.rev } } });
  }
  return true;
}

async function run(pullFirst = false) {
  const forUser = userId;
  if (!forUser) return;
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  firstChange = 0;
  if (timer) clearTimeout(timer);
  timer = undefined;
  try {
    const meta = useStore.getState().sync;
    if (pullFirst || !pulled || !meta?.base || meta.inflight) {
      if (!meta?.base && isEmptyWorkspace(readLocal())) status({ firstLoad: true, state: 'loading' });
      await pull();
      status({ firstLoad: false });
    }
    if (userId !== forUser) return;
    // pictures and drawings follow the data they belong to
    await moveInlineShots();
    // changes made while sending are picked up by the next round (the store subscription schedules it)
    await push();
    retryMs = 0;
    status({ state: 'saved', savedAt: Date.now(), message: undefined });
    void flushShots();
    void flushLayouts();
  } catch (e) {
    status({ firstLoad: false });
    const code = e instanceof BackendError ? e.code : 'error';
    if (code === 'unauthorized' || code === 'banned') {
      status({ state: 'off' });
      return;
    }
    // try again later; a change in flight is checked first (it may have arrived)
    pulled = 0;
    retryMs = Math.min(code === 'too_large' ? 300_000 : 60_000, Math.max(5_000, retryMs * 2));
    status(code === 'network' ? { state: 'offline' } : { state: 'error', message: e instanceof Error ? e.message : undefined });
    schedule(retryMs);
  } finally {
    busy = false;
    if (again) {
      again = false;
      schedule(0);
    }
  }
}

function schedule(delay?: number) {
  if (!userId) return;
  const now = Date.now();
  firstChange ||= now;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void run(), delay ?? (now - firstChange >= MAX_WAIT_MS ? 0 : QUIET_MS));
}

/** The page is closing or going to the background (phones may end it there): send what is left. */
function sendNow() {
  if (!userId || busy || !useStore.getState().sync?.base) return;
  busy = true;
  push(true)
    .catch(() => {
      pulled = 0;
    })
    .finally(() => {
      busy = false;
    });
  void flushLayouts(true);
}

export function startWorkspaceSync() {
  if (started || backend.mode !== 'server') return;
  started = true;

  const begin = () => {
    const s = useAuth.getState().session;
    const id = s && !s.demo ? s.userId : null;
    if (id === userId) return;
    userId = id;
    pulled = 0;
    retryMs = 0;
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (id) void run();
    else status({ state: 'off', firstLoad: false });
  };
  begin();
  useAuth.subscribe(begin);
  // a slow connection does not keep the pages waiting: what arrives later is merged in
  setTimeout(() => status({ firstLoad: false }), 12_000);
  useStore.subscribe((s, prev) => {
    if (userId && dataChanged(s, prev)) schedule();
  });

  window.addEventListener('pagehide', sendNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendNow();
    else if (Date.now() - pulled > 15_000) void run(true);
  });
  window.addEventListener('online', () => schedule(0));
  setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - pulled >= PULL_EVERY_MS) void run(true);
  }, 30_000);
}
