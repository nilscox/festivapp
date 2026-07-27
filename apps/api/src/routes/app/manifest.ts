import { Router } from 'express';

import { assert } from '../../utils.ts';

export const manifestRouter = Router();

manifestRouter.get('/manifest.webmanifest', (req, res) => {
  const tenant = req.tenant;
  assert(tenant);

  res.type('application/manifest+json');
  res.json({
    name: tenant.name,
    short_name: tenant.name,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#131118',
    theme_color: tenant.theme.primaryColor,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  });
});
