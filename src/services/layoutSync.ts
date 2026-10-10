import { local, readJson, writeJson } from '../lib/storage';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';
import { backend, BackendError } from '.';

/**
 * Chart drawings and indicators, which the chart engines save per session and chart pane in this
 * browser (chart/tvEngine, chart/drawings), copied to the server so a session opened on another
 * device shows them too. The newest save wins.
 */

export type LayoutKind = 'tv' | 'lw';
const PREFIX: Record<LayoutKind, string> = { tv: 'btl:tv-layout:', lw: 'btl:lw-layout:' };
const KEEPALIVE_MAX = 60_000;

/** Per layout: when it was last saved here, and the save the server has (0: none). */
interface Meta {
  at: number;
  synced: number;
}

const enabled = () => {
  const s = useAuth.getState().session;
  return backend.mode === 'server' && !!s && !s.demo;
};
const metaKey = () => `btl:layout-sync:${useAuth.getState().session?.userId ?? ''}`;
const readMeta = () => readJson<Record<string, Meta>>(local, metaKey(), {});
const writeMeta = (m: Record<string, Meta>) => writeJson(local, metaKey(), m);

/** `lw:se_abc:0` → the engine, the pane key and its session. */
function parse(full: string) {
  const kind = full.slice(0, 2) as LayoutKind;
  const key = full.slice(3);
  return { kind, key, sessionId: key.split(':')[0], valid: (kind === 'tv' || kind === 'lw') && full[2] === ':' && !!key };
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** A chart engine saved a pane's layout in this browser: sent to the server a moment later. */
export function layoutSaved(kind: LayoutKind, key: string) {
  if (!enabled()) return;
  const full = `${kind}:${key}`;
  const m = readMeta();
  m[full] = { at: Math.max(Date.now(), (m[full]?.at ?? 0) + 1), synced: m[full]?.synced ?? 0 };
  writeMeta(m);
  clearTimeout(timers.get(full));
  timers.set(
    full,
    setTimeout(() => void upload(full).catch(() => undefined), 2_000),
  );
}

async function upload(full: string, keepalive = false) {
  timers.delete(full);
  const m = readMeta()[full];
  const { kind, key, sessionId, valid } = parse(full);
  if (!m || m.at <= m.synced || !valid) return;
  const raw = local.getItem(PREFIX[kind] + key);
  if (!raw || (keepalive && raw.length > KEEPALIVE_MAX)) return;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  try {
    const res = await backend.saveLayout(sessionId, { key: full, at: m.at, data }, { keepalive });
    const all = readMeta();
    if (res.stored) all[full] = { at: all[full]?.at ?? m.at, synced: m.at };
    else {
      // saved more recently on another device: that one is kept here too
      local.setItem(PREFIX[kind] + key, JSON.stringify(res.data));
      all[full] = { at: res.at, synced: res.at };
    }
    writeMeta(all);
  } catch (e) {
    // a session deleted meanwhile: its drawings are not kept
    if (e instanceof BackendError && e.code === 'not_found' && !useStore.getState().sessions.some((s) => s.id === sessionId)) {
      const all = readMeta();
      delete all[full];
      writeMeta(all);
      return;
    }
    throw e;
  }
}

/** Sends every layout saved here that the server does not have yet (what fails is tried the next time). */
export async function flushLayouts(keepalive = false) {
  if (!enabled()) return;
  const m = readMeta();
  for (const full of Object.keys(m)) {
    if (m[full].at <= m[full].synced) continue;
    try {
      await upload(full, keepalive);
    } catch {
      /* next time */
    }
  }
}

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });

/** Before a session's charts open: drawings saved on other devices are brought here (waits a few seconds at most). */
export async function pullLayouts(sessionId: string): Promise<void> {
  if (!enabled()) return;
  try {
    const res = await withTimeout(backend.layouts(sessionId), 4_000);
    const m = readMeta();
    for (const [full, item] of Object.entries(res.items)) {
      const { kind, key, valid } = parse(full);
      if (!valid || !item || typeof item.at !== 'number') continue;
      const mine = m[full];
      // already here, or changed here more recently (sent next)
      if (mine && (mine.synced >= item.at || mine.at > item.at)) continue;
      local.setItem(PREFIX[kind] + key, JSON.stringify(item.data));
      m[full] = { at: item.at, synced: item.at };
    }
    writeMeta(m);
  } catch {
    /* offline or slow: the charts open with what this browser has */
  }
  void flushLayouts();
}

/** Whether opening a session's charts waits for its drawings from the server. */
export const layoutsFromServer = () => enabled();
