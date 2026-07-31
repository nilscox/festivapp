import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> };

self.skipWaiting();
clientsClaim();

// oxlint-disable-next-line no-underscore-dangle
precacheAndRoute(self.__WB_MANIFEST);

if (!import.meta.env.DEV) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
      denylist: [/^\/api\//, /^\/files\//],
    }),
  );
}

registerRoute(
  ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/files/'),
  new CacheFirst({
    cacheName: 'tenant-files',
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
);

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const payload: unknown = event.data.json();

  // prettier-ignore
  if (
    typeof payload !== 'object' || payload === null
    || !('body' in payload) || typeof payload.body !== 'string'
    || !('title' in payload) || typeof payload.title !== 'string'
  ) {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: '/info' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(open('/info'));
});

async function open(url: string): Promise<void> {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const client = clients.find((client) => new URL(client.url).origin === self.location.origin);

  if (client) {
    await client.focus();
    await client.navigate(url);
  } else {
    await self.clients.openWindow(url);
  }
}
