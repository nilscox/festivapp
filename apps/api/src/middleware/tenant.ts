import type { RequestHandler } from 'express';

import { type Tenant } from '../db/schema.ts';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

export const requireTenant: RequestHandler = async (req, res, next) => {
  const db = req.container.resolve('db');
  const logger = req.container.resolve('logger');

  const domain =
    // oxlint-disable-next-line no-underscore-dangle
    (typeof req.query.__tenant === 'string' ? req.query.__tenant : undefined) ??
    req.get('x-tenant-domain') ??
    req.hostname;

  const tenant = await db.query.tenants.findFirst({ where: { domain } });

  if (!tenant) {
    logger.warn('no tenant for this domain', { domain });
    return res.status(404).json({ error: 'tenant_not_found', domain });
  }

  req.tenant = tenant;
  next();
};
