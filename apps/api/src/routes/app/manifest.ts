import { defined } from '@festivapp/utils';
import { Router } from 'express';

export function manifestRoutes() {
  const router = Router();

  router.get('/', (req, res) => {
    const tenant = defined(req.tenant);
    const { pwa, logo, backgroundColor } = tenant.theme;

    res.type('application/manifest+json');
    res.json({
      name: pwa.name ?? tenant.name,
      short_name: pwa.shortName ?? pwa.name ?? tenant.name,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: backgroundColor,
      icons: [
        logo.iconUrl
          ? { src: logo.iconUrl, sizes: 'any', purpose: 'any' }
          : { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    });
  });

  return router;
}
