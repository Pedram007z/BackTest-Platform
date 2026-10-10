/*
 * Service worker: makes the site an installable app (PWA) that opens quickly and still opens offline.
 *
 * - Pages: from the network first (a new release shows at once); offline, the last copy of the app.
 *   Every address of the app is the same index.html, so one copy serves them all.
 * - /assets/ (names carry a content hash, never change) and the TradingView library: from the cache,
 *   fetched once.
 * - Icons, fonts, the manifest: from the cache, refreshed in the background.
 * - Never cached: the API (/api/…: account data, payments, market data), the blog pages the server
 *   renders, sitemap.xml and robots.txt.
 *
 * Bump VERSION to drop every cache of earlier versions.
 */
const VERSION = 'v1';
const SHELL = `btl-shell-${VERSION}`;
const STATIC = `btl-static-${VERSION}`;
const MAX_STATIC = 120;

const NEVER = /^\/(api\/|blog(\/|$)|sitemap\.xml$|robots\.txt$|\.well-known\/)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['/index.html', '/site.webmanifest', '/icon-192.png', '/icon-512.png']))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('btl-') && k !== SHELL && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_STATIC))) await cache.delete(k);
}

async function page(request) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(request);
    if (res.ok && (res.headers.get('content-type') || '').includes('text/html')) cache.put('/index.html', res.clone());
    return res;
  } catch {
    const shell = await cache.match('/index.html');
    if (shell) return shell;
    return new Response('<!doctype html><meta charset="utf-8"><title>آفلاین</title><body dir="rtl" style="font-family:sans-serif;padding:2rem">اتصال به اینترنت برقرار نیست.</body>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    await cache.put(request, res.clone());
    trim(cache);
  }
  return res;
}

async function refreshInBackground(request, event) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(fresh);
    return hit;
  }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || NEVER.test(url.pathname) || url.pathname === '/sw.js') return;
  if (request.mode === 'navigate') {
    event.respondWith(page(request));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/charting_library/') || url.pathname.startsWith('/datafeeds/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (/\.(png|svg|ico|woff2?|webmanifest|json)$/.test(url.pathname)) event.respondWith(refreshInBackground(request, event));
});
