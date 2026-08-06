import { assert } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { pushSubscriptions } from '../../db/schema.ts';

import type { Database } from '../../db/client.ts';
import type { Push } from '../../push.ts';

export function pushRoutes({ db, push }: { db: Database; push: Push }) {
  const router = Router();

  const subscriptionSchema = z.strictObject({
    endpoint: z.url().max(1000),
    keys: z.strictObject({
      p256dh: z.string().min(1).max(200),
      auth: z.string().min(1).max(200),
    }),
  });

  router.post('/', async (req, res) => {
    assert(req.tenant);

    if (!push.enabled) {
      return res.status(503).json({ error: 'push_disabled' });
    }

    const { endpoint, keys } = subscriptionSchema.parse(req.body);

    await db
      .insert(pushSubscriptions)
      .values({ tenantId: req.tenant.id, endpoint, ...keys })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { tenantId: req.tenant.id, ...keys },
      });

    res.status(204).end();
  });

  router.delete('/', async (req, res) => {
    assert(req.tenant);

    const { endpoint } = subscriptionSchema.pick({ endpoint: true }).parse(req.body);

    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.tenantId, req.tenant.id)));

    res.status(204).end();
  });

  return router;
}
