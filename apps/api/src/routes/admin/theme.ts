import { assert, defined } from '@festivapp/utils';
import { eq } from 'drizzle-orm';
import { Router } from 'express';

import { tenants } from '../../db/schema.ts';
import { themeSchema } from '../../theme.ts';

import type { Database } from '../../db/client.ts';

export function themeRoutes({ db }: { db: Database }) {
  const router = Router({ mergeParams: true });

  router.get('/', (req, res) => {
    assert(req.tenant);
    res.json(req.tenant.theme);
  });

  router.put('/', async (req, res) => {
    assert(req.tenant);

    const theme = themeSchema.parse(req.body);

    const [row] = await db
      .update(tenants)
      .set({ theme, updatedAt: new Date() })
      .where(eq(tenants.id, req.tenant.id))
      .returning();

    res.json(defined(row).theme);
  });

  return router;
}
