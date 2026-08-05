import { assert, defined } from '@festivapp/utils';
import { eq } from 'drizzle-orm';
import { Router } from 'express';

import { deps } from '../../container.ts';
import { tenants } from '../../db/schema.ts';
import { themeSchema } from '../../theme.ts';

export const themeRouter = Router({ mergeParams: true });

themeRouter.get('/', (req, res) => {
  assert(req.tenant);
  res.json(req.tenant.theme);
});

themeRouter.put('/', async (req, res) => {
  const { db } = deps();

  assert(req.tenant);

  const theme = themeSchema.parse(req.body);

  const [row] = await db
    .update(tenants)
    .set({ theme, updatedAt: new Date() })
    .where(eq(tenants.id, req.tenant.id))
    .returning();

  res.json(defined(row).theme);
});
