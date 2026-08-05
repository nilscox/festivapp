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
import { deps } from '../../container.ts';
import { type Organizer, type Tenant } from '../../db/schema.ts';
import { requireOrganizer } from '../../middleware/admin-auth.ts';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

async function listOrganizerTenants(organizerId: string) {
  const { db } = deps();

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

authRouter.post('/login', async (req, res) => {
  const { db } = deps();

  const { email, password } = loginSchema.parse(req.body);

  const organizer = await db.query.organizers.findFirst({
    where: { email },
  });

  if (!organizer || !verifyPassword(password, organizer.passwordHash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const { token, expiresAt } = await createSession(organizer.id);
  const tenants = await listOrganizerTenants(organizer.id);

  res.cookie('token', token, sessionCookieOptions(expiresAt));
  res.json(toMeResponseDto(organizer, tenants));
});

authRouter.get('/me', requireOrganizer, async (req, res) => {
  assert(req.organizer);

  const organizer = req.organizer;
  const tenants = await listOrganizerTenants(organizer.id);

  res.json(toMeResponseDto(organizer, tenants));
});

authRouter.post('/logout', requireOrganizer, async (req, res) => {
  const token = readSessionToken(req);

  if (token !== undefined) {
    await destroySession(token);
  }

  res.clearCookie('token', clearCookieOptions());
  res.status(204).end();
});
