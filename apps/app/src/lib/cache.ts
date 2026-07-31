import type { Participant, TenantConfig } from '@festivapp/contracts';
import { defined } from '@festivapp/utils';

/** Same cache the service worker's `/files/` route writes to, so the two must not diverge. */
const cacheName = 'tenant-files';

/** A line-up runs to hundreds of images; fetching them all at once would starve the page's own requests. */
const concurrency = 6;

export async function warmTenantCache(tenant: TenantConfig, participants: Participant[]): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const { logo, backgroundImage } = tenant.theme;

  const urls = [
    logo.wordmarkUrl,
    logo.iconUrl,
    backgroundImage?.url ?? null,
    tenant.mapUrl,
    ...participants.map((participant) => participant.imageUrl),
  ]
    .filter((url) => url !== null)
    .filter((url) => url.startsWith('/'));

  const cache = await caches.open(cacheName);

  await warmAll(cache, Array.from(new Set(urls)));
}

async function warmAll(cache: Cache, urls: string[]): Promise<void> {
  let cursor = 0;

  const worker = async () => {
    while (cursor < urls.length) {
      const url = defined(urls[cursor++]);

      try {
        if (!(await cache.match(url))) {
          await cache.add(url);
        }
      } catch {
        // offline, or a file the tenant deleted: the next load tries again
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
}
