import { and, eq, gt } from 'drizzle-orm';
import type { RequestHandler } from 'express';

import { readSessionToken } from '../auth/session.ts';
import { db } from '../db/client.ts';
import { type AuthSession, authSessions, type Organizer, organizers, organizerTenants, tenants } from '../db/schema.ts';

declare global {
  namespace Express {
    interface Request {
      organizer?: Organizer;
      authSession?: AuthSession;
    }
  }
}

export const requireOrganizer: RequestHandler = async (req, res, next) => {
  const token = readSessionToken(req);

  if (token === undefined) {
    res.status(401).json({ error: 'unauthenticated' });

    return;
  }

  const [row] = await db
    .select({ session: authSessions, organizer: organizers })
    .from(authSessions)
    .innerJoin(organizers, eq(authSessions.organizerId, organizers.id))
    .where(and(eq(authSessions.token, token), gt(authSessions.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    res.status(401).json({ error: 'unauthenticated' });

    return;
  }

  req.organizer = row.organizer;
  req.authSession = row.session;
  next();
};

export const requireTenantMembership: RequestHandler = async (req, res, next) => {
  const organizer = req.organizer;

  if (!organizer) {
    res.status(401).json({ error: 'unauthenticated' });

    return;
  }

  const tenantId = req.params.tenantId;

  if (typeof tenantId !== 'string') {
    res.status(400).json({ error: 'invalid_tenant' });

    return;
  }

  const [row] = await db
    .select({ tenant: tenants })
    .from(organizerTenants)
    .innerJoin(tenants, eq(organizerTenants.tenantId, tenants.id))
    .where(and(eq(organizerTenants.organizerId, organizer.id), eq(organizerTenants.tenantId, tenantId)))
    .limit(1);

  if (!row) {
    res.status(403).json({ error: 'forbidden' });

    return;
  }

  req.tenant = row.tenant;
  next();
};
