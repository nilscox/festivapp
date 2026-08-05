import { and, eq, gt } from 'drizzle-orm';
import type { RequestHandler } from 'express';

import { readSessionToken } from '../auth/session.ts';
import { deps } from '../container.ts';
import { authSessions, type Organizer, organizers, organizerTenants, tenants } from '../db/schema.ts';

declare global {
  namespace Express {
    interface Request {
      organizer?: Organizer;
    }
  }
}

export const requireOrganizer: RequestHandler = async (req, res, next) => {
  const { db, logger } = deps();

  const token = readSessionToken(req);

  if (token === undefined) {
    logger.debug('rejected a request carrying no session cookie');
    return res.status(401).json({ error: 'unauthenticated' });
  }

  const [row] = await db
    .select({ organizer: organizers })
    .from(authSessions)
    .innerJoin(organizers, eq(authSessions.organizerId, organizers.id))
    .where(and(eq(authSessions.token, token), gt(authSessions.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    logger.warn('rejected an unknown or expired session');
    return res.status(401).json({ error: 'unauthenticated' });
  }

  req.organizer = row.organizer;
  next();
};

export const requireTenantMembership: RequestHandler = async (req, res, next) => {
  const { db, logger } = deps();

  const organizer = req.organizer;
  const tenantId = req.params.tenantId;

  if (!organizer) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  if (typeof tenantId !== 'string') {
    return res.status(400).json({ error: 'invalid_tenant_id' });
  }

  const [row] = await db
    .select({ tenant: tenants })
    .from(organizerTenants)
    .innerJoin(tenants, eq(organizerTenants.tenantId, tenants.id))
    .where(and(eq(organizerTenants.organizerId, organizer.id), eq(organizerTenants.tenantId, tenantId)))
    .limit(1);

  if (!row) {
    logger.warn('organizer is not a member of this tenant', { organizer: organizer.email, tenantId });
    return res.status(403).json({ error: 'forbidden' });
  }

  req.tenant = row.tenant;
  next();
};
