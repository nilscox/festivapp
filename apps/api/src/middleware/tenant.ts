import { eq } from 'drizzle-orm';
import type { RequestHandler } from 'express';

import { db } from '../db/client.ts';
import { type Tenant, tenants } from '../db/schema.ts';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

export const resolveTenant: RequestHandler = async (req, res, next) => {
  const override =
    (typeof req.query.__tenant === 'string' ? req.query.__tenant : undefined) ??
    req.get('x-tenant-domain') ??
    undefined;
  const host = override ?? req.hostname;

  const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, host)).limit(1);

  if (!tenant) {
    res.status(404).json({ error: 'tenant_not_found', host });

    return;
  }

  req.tenant = tenant;
  next();
};
