import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';
import { backend } from '.';
import { cleanSnapshot, snapshotHash } from './backtests';

/**
 * Keeps the server's copy of this user's backtests (sessions, orders, positions — for the admin panel)
 * up to date. On every page load the app sends a fingerprint and uploads only when the server's copy is
 * out of date; after a change it uploads a few seconds later (at least every 30 s while changes keep
 * coming, as during a replay). Sessions an admin deleted are removed here too.
 */

const QUIET_MS = 3_000;
const MAX_WAIT_MS = 30_000;

let started = false;
let lastSent = '';

function snapshot() {
  const s = useStore.getState();
  const snap = cleanSnapshot({ sessions: s.sessions, trades: s.trades, strategies: s.strategies });
  return { snap, hash: snapshotHash(JSON.stringify(snap)) };
}

function applyRemovals(ids: string[]) {
  if (!ids.length) return;
  const { sessions, deleteSession } = useStore.getState();
  for (const id of ids) if (sessions.some((s) => s.id === id)) deleteSession(id);
}

export function startBacktestSync() {
  if (started || !useAuth.getState().session) return;
  started = true;
  let busy = false;
  let again = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let firstChange = 0;

  const run = async (checkFirst: boolean) => {
    if (!useAuth.getState().session) return;
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    firstChange = 0;
    try {
      const { snap, hash } = snapshot();
      if (checkFirst) {
        const state = await backend.backtestCheck(hash);
        applyRemovals(state.remove);
        if (!state.needData) {
          lastSent = hash;
          return;
        }
      } else if (hash === lastSent) return;
      const state = await backend.backtestUpload(hash, snap);
      lastSent = hash;
      applyRemovals(state.remove);
    } catch {
      // offline or signed out: the next page load checks again
    } finally {
      busy = false;
      if (again) {
        again = false;
        schedule();
      }
    }
  };

  const schedule = () => {
    const now = Date.now();
    firstChange ||= now;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void run(false), now - firstChange >= MAX_WAIT_MS ? 0 : QUIET_MS);
  };

  void run(true);
  useStore.subscribe((s, prev) => {
    if (s.sessions !== prev.sessions || s.trades !== prev.trades || s.strategies !== prev.strategies) schedule();
  });
}
