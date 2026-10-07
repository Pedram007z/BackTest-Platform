/**
 * Pictures and videos uploaded in the demo (no server): kept as blobs in IndexedDB, since
 * localStorage only holds a few megabytes. Read back as blob: addresses for the page's lifetime.
 */

const DB_NAME = 'btl-demo-media';
const STORE = 'files';
let opening: Promise<IDBDatabase> | null = null;
const urls = new Map<string, string>();

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function putMedia(id: string, blob: Blob): Promise<string> {
  await run('readwrite', (s) => s.put(blob, id));
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

/** A blob: address for a stored file, or '' when it is gone (for example, site data was cleared). */
export async function mediaUrl(id: string): Promise<string> {
  const known = urls.get(id);
  if (known) return known;
  try {
    const blob = await run<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    urls.set(id, url);
    return url;
  } catch {
    return '';
  }
}

export async function deleteMedia(id: string) {
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
  try {
    await run('readwrite', (s) => s.delete(id));
  } catch {
    /* already gone */
  }
}
