/* Festivapp service worker — offline PWA support.
 * Served by src/app/sw.js/route.ts, which injects the Next build id as the cache
 * version below, so caches are invalidated automatically on every deploy. */
const VERSION = '__SW_VERSION__';
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const PRECACHE_ENDPOINT = '/api/precache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== PRECACHE && name !== RUNTIME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE') {
    event.waitUntil(precache());
  }
});

/* Fetch the festival-specific list of pages to keep available offline and cache
 * each one individually so a single failure doesn't abort the whole batch. */
async function precache() {
  let urls = [];

  try {
    const res = await fetch(PRECACHE_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    urls = Array.isArray(data.urls) ? data.urls : [];
  } catch {
    return;
  }

  const cache = await caches.open(PRECACHE);

  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          await cache.put(url, res);
        }
      } catch {
        /* ignore individual failures */
      }
    }),
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/* Network-first: fresh pages when online, cached snapshot when offline. */
async function handleNavigation(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME);
      void cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;

    const fallback = await caches.match('/offline', { ignoreVary: true });
    if (fallback) return fallback;

    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(RUNTIME);
    void cache.put(request, res.clone());
  }
  return res;
}

async function staleWhileRevalidate(request) {
  // Look across all caches (precache included) — uploads are precached, not in RUNTIME.
  const cached = await caches.match(request, { ignoreVary: true });

  const network = fetch(request)
    .then((res) => {
      if (res.ok) {
        void caches.open(RUNTIME).then((cache) => cache.put(request, res.clone()));
      }
      return res;
    })
    .catch(() => cached);

  return cached || network;
}
