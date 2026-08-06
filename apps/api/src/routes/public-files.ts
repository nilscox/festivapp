import { Router } from 'express';
import { pipeline } from 'node:stream/promises';

import type { Database } from '../db/client.ts';
import type { Storage } from '../storage.ts';

export function publicFilesRoutes({ db, storage }: { db: Database; storage: Storage }) {
  const router = Router();

  router.get('/:id', async (req, res) => {
    const file = await db.query.files.findFirst({ where: { id: req.params.id } });

    if (!file) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.type(file.contentType);
    res.setHeader('content-length', file.size);
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'");

    await pipeline(storage.read(file.storageKey), res);
  });

  return router;
}
