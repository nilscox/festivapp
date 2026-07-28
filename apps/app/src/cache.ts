import type { TenantConfig } from '@festivapp/contracts';

export async function warmTenantCache(tenant: TenantConfig): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const { logo, backgroundImage } = tenant.theme;

  const urls = [logo.wordmarkUrl, logo.iconUrl, backgroundImage?.url ?? null]
    .filter((url) => url !== null)
    .filter((url) => url.startsWith('/'));

  const cache = await caches.open('tenant-files');

  await Promise.allSettled(
    urls.map(async (url) => {
      if (await cache.match(url)) {
        return;
      }

      await cache.add(url);
    }),
  );
}
