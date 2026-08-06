import type { MeResponse } from '@festivapp/contracts';
import { assert } from '@festivapp/utils';
import { Router } from 'express';
import { z } from 'zod';

import { verifyPassword } from '../../auth/password.ts';
import {
  clearCookieOptions,
  createSession,
  destroySession,
  readSessionToken,
  sessionCookieOptions,
} from '../../auth/session.ts';
import { type Organizer, type Tenant } from '../../db/schema.ts';
import { requireOrganizer } from '../../middleware/admin-auth.ts';

import type { Database } from '../../db/client.ts';
import type { Logger } from '../../logger.ts';

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export function authRoutes({ logger, db }: { logger: Logger; db: Database }) {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const organizer = await db.query.organizers.findFirst({
      where: { email },
    });

    if (!organizer || !verifyPassword(password, organizer.passwordHash)) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const { token, expiresAt } = await createSession(db, organizer.id);
    const tenants = await listOrganizerTenants(db, organizer.id);

    res.cookie('token', token, sessionCookieOptions(expiresAt));
    res.json(toMeResponseDto(organizer, tenants));
  });

  router.get('/me', requireOrganizer({ logger, db }), async (req, res) => {
    assert(req.organizer);

    const organizer = req.organizer;
    const tenants = await listOrganizerTenants(db, organizer.id);

    res.json(toMeResponseDto(organizer, tenants));
  });

  router.post('/logout', requireOrganizer({ logger, db }), async (req, res) => {
    const token = readSessionToken(req);

    if (token !== undefined) {
      await destroySession(db, token);
    }

    res.clearCookie('token', clearCookieOptions());
    res.status(204).end();
  });

  return router;
}

async function listOrganizerTenants(db: Database, organizerId: string) {
  return db.query.tenants.findMany({
    where: { organizers: { id: organizerId } },
    orderBy: { name: 'asc' },
  });
}

function toMeResponseDto(organizer: Organizer, tenants: Tenant[]): MeResponse {
  return {
    organizer: { id: organizer.id, email: organizer.email, name: organizer.name },
    tenants: tenants.map((tenant) => ({ id: tenant.id, name: tenant.name, domain: tenant.domain })),
  };
}
