import { useEffect, useState } from 'react';
import { backend } from '../services';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';
import { local, readJson, writeJson } from './storage';

/**
 * Chart screenshots for journal entries. Images are kept in IndexedDB (localStorage is too small
 * for pictures); trades only store the screenshot ids. Falls back to memory when IndexedDB is
 * unavailable (private windows, sandboxed previews). With the API server, each picture is also
 * stored on the server, so journals show their pictures on every device; a picture this browser
 * does not have is fetched from there.
 */

const DB = 'backtest-shots';
const STORE = 'shots';
const memory = new Map<string, string>();

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
const db = () => (dbPromise ??= open());

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const d = await db();
  if (!d) return undefined;
  return new Promise((resolve) => {
    try {
      const req = fn(d.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

/** Shrink a data URL to at most `maxW` pixels wide as JPEG. */
export async function compressImage(dataUrl: string, maxW = 1100, quality = 0.78): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, maxW / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}

// ---------- the server's copy ----------

const onServer = () => {
  const s = useAuth.getState().session;
  return backend.mode === 'server' && !!s && !s.demo;
};
/** Pictures not sent yet (offline), tried again at the next sync. */
const pendingKey = () => `btl:shots-pending:${useAuth.getState().session?.userId ?? ''}`;
const pending = () => readJson<string[]>(local, pendingKey(), []);
const setPending = (ids: string[]) => writeJson(local, pendingKey(), ids.slice(-500));

async function upload(id: string, dataUrl: string) {
  try {
    await backend.saveShot(id, await (await fetch(dataUrl)).blob());
    setPending(pending().filter((x) => x !== id));
  } catch {
    if (!pending().includes(id)) setPending([...pending(), id]);
  }
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

/** Sends the pictures that could not be sent before. */
export async function flushShots() {
  if (!onServer()) return;
  for (const id of pending()) {
    const v = memory.get(id) ?? (await tx<string>('readonly', (s) => s.get(id)));
    if (v) await upload(id, v);
    else setPending(pending().filter((x) => x !== id));
  }
}

let inlineMoved = false;
/** Journals from older versions kept pictures inside the trade: they are stored as pictures of their own. */
export async function moveInlineShots() {
  if (inlineMoved) return;
  const inline = new Set<string>();
  for (const t of useStore.getState().trades) for (const s of t.journal?.screenshots ?? []) if (s.startsWith('data:')) inline.add(s);
  const ids = new Map<string, string>();
  for (const dataUrl of inline) ids.set(dataUrl, await saveShot(dataUrl));
  if (ids.size)
    useStore.setState((st) => ({
      trades: st.trades.map((t) =>
        t.journal?.screenshots.some((s) => ids.has(s)) ? { ...t, journal: { ...t.journal, screenshots: t.journal.screenshots.map((s) => ids.get(s) ?? s) } } : t,
      ),
    }));
  inlineMoved = true;
}

export async function saveShot(dataUrl: string): Promise<string> {
  const id = `shot_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const small = await compressImage(dataUrl);
  memory.set(id, small);
  await tx('readwrite', (s) => s.put(small, id));
  if (onServer()) void upload(id, small);
  return id;
}

export async function loadShot(id: string): Promise<string | null> {
  if (id.startsWith('data:')) return id;
  const hit = memory.get(id);
  if (hit) return hit;
  let v = await tx<string>('readonly', (s) => s.get(id));
  if (!v && onServer()) {
    // taken on another device
    try {
      v = await blobToDataUrl(await backend.shot(id));
      await tx('readwrite', (s) => s.put(v!, id));
    } catch {
      v = undefined;
    }
  }
  if (v) memory.set(id, v);
  return v ?? null;
}

export async function deleteShot(id: string) {
  memory.delete(id);
  await tx('readwrite', (s) => s.delete(id));
  if (onServer()) {
    setPending(pending().filter((x) => x !== id));
    void backend.deleteShot(id).catch(() => undefined);
  }
}

export function useShot(id: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(id ? (memory.get(id) ?? null) : null);
  useEffect(() => {
    let alive = true;
    if (!id) {
      setSrc(null);
      return;
    }
    void loadShot(id).then((v) => alive && setSrc(v));
    return () => {
      alive = false;
    };
  }, [id]);
  return src;
}

/** Read an image file the user picked. */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
