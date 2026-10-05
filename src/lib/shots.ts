import { useEffect, useState } from 'react';

/**
 * Chart screenshots for journal entries. Images are kept in IndexedDB (localStorage is too small
 * for pictures); trades only store the screenshot ids. Falls back to memory when IndexedDB is
 * unavailable (private windows, sandboxed previews).
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

export async function saveShot(dataUrl: string): Promise<string> {
  const id = `shot_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const small = await compressImage(dataUrl);
  memory.set(id, small);
  await tx('readwrite', (s) => s.put(small, id));
  return id;
}

export async function loadShot(id: string): Promise<string | null> {
  if (id.startsWith('data:')) return id;
  const hit = memory.get(id);
  if (hit) return hit;
  const v = await tx<string>('readonly', (s) => s.get(id));
  if (v) memory.set(id, v);
  return v ?? null;
}

export async function deleteShot(id: string) {
  memory.delete(id);
  await tx('readwrite', (s) => s.delete(id));
}

export function useShot(id: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(id ? memory.get(id) ?? null : null);
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
