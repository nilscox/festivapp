import type { Participant, TenantConfig } from '@festivapp/contracts';

declare global {
  interface Navigator {
    connection?: { saveData?: boolean };
  }
}

const cacheName = 'tenant-files';
const concurrency = 6;

export async function warmTenantCache(tenant: TenantConfig, participants: Participant[]): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const { logo, backgroundImage } = tenant.theme;
  const shell = [logo.wordmarkUrl, logo.iconUrl, backgroundImage?.url ?? null, tenant.mapUrl];
  const participantImages = participants.map((participant) => participant.imageUrl);

  const urls = [...shell, ...(navigator.connection?.saveData ? [] : participantImages)].filter((url) => url !== null);

  const cache = await caches.open(cacheName);

  await warmAll(cache, Array.from(new Set(urls)));
}

async function warmAll(cache: Cache, urls: string[]): Promise<void> {
  let cursor = 0;

  const worker = async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];

      if (url && !(await cache.match(url))) {
        await cache.add(url).catch(() => {});
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
}
