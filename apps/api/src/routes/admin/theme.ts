import type { TenantTheme as TenantThemeDto } from '@festivapp/contracts';
import { eq } from 'drizzle-orm';
import { Router } from 'express';

import { db } from '../../db/client.ts';
import { tenants } from '../../db/schema.ts';
import { themeSchema } from '../../theme.ts';
import { assert } from '../../utils.ts';

export const themeRouter = Router({ mergeParams: true });

themeRouter.get('/', (req, res) => {
  assert(req.tenant);

  res.json(req.tenant.theme satisfies TenantThemeDto);
});

themeRouter.put('/', async (req, res) => {
  assert(req.tenant);

  const theme = themeSchema.parse(req.body);

  const [row] = await db
    .update(tenants)
    .set({ theme, updatedAt: new Date() })
    .where(eq(tenants.id, req.tenant.id))
    .returning();

  assert(row);

  res.json(row.theme satisfies TenantThemeDto);
});
