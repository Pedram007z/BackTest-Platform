/**
 * Loads TradingView Advanced Charts from `public/charting_library/` when it is installed
 * (`npm run setup:charts -- <path to charting_library zip or folder>`). The library is licensed
 * per company and is not part of this repository; without it the replay uses the built-in engine.
 */

export const TV_LIBRARY_PATH = `${import.meta.env.BASE_URL}charting_library/`;

let promise: Promise<any | null> | null = null;

export function loadTradingView(): Promise<any | null> {
  const w = window as any;
  if (w.TradingView?.widget) return Promise.resolve(w.TradingView);
  // the hosted single-file preview never ships the library
  if (import.meta.env.MODE === 'artifact') return Promise.resolve(null);
  if (promise) return promise;
  promise = (async () => {
    try {
      const url = `${TV_LIBRARY_PATH}charting_library.standalone.js`;
      const head = await fetch(url, { method: 'HEAD' });
      // dev servers answer unknown paths with index.html, so check the type too
      if (!head.ok || !(head.headers.get('content-type') ?? '').includes('javascript')) return null;
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('load failed'));
        document.head.append(s);
      });
      return w.TradingView?.widget ? w.TradingView : null;
    } catch {
      return null;
    }
  })();
  return promise;
}
