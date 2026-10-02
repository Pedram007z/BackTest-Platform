/**
 * localStorage / sessionStorage wrappers that never throw.
 * Storage can be missing or blocked (private windows, sandboxed previews); values then live in memory
 * for the lifetime of the page.
 */
export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function make(get: () => Storage): SafeStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (k) => {
      try {
        return get().getItem(k);
      } catch {
        return memory.get(k) ?? null;
      }
    },
    setItem: (k, v) => {
      try {
        get().setItem(k, v);
      } catch {
        memory.set(k, v);
      }
    },
    removeItem: (k) => {
      try {
        get().removeItem(k);
      } catch {
        /* fall through to memory */
      }
      memory.delete(k);
    },
  };
}

export const local = make(() => window.localStorage);
export const session = make(() => window.sessionStorage);

export function readJson<T>(store: SafeStorage, key: string, fallback: T): T {
  const raw = store.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(store: SafeStorage, key: string, value: unknown) {
  store.setItem(key, JSON.stringify(value));
}
