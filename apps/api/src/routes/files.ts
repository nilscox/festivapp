import { Router } from 'express';
import { pipeline } from 'node:stream/promises';

import { db } from '../db/client.ts';
import { storage } from '../storage.ts';

export const filesRouter = Router();

filesRouter.get('/:id', async (req, res) => {
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
